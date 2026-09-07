(function(){
  'use strict';

  var canvas = document.getElementById('invite-canvas');
  if (!canvas) return;

  var ctx = canvas.getContext('2d', { alpha: false });
  var template = new Image();
  var guest = null;
  var guestUrl = null;
  var originalFile = null;
  var originalGuestUrl = null;
  var processedGuestUrl = null;
  var removingBackground = false;
  var templateReady = false;

  // Tọa độ theo file PNG 1536 x 2048 hiện tại.
  // Ảnh khách nằm dưới PNG; vùng khoét trong PNG tự tạo mặt nạ.
  var HOLE = { x:527, y:674, w:473, h:422 };
  var NAME = { x:768, y:1222, maxWidth:760, fontSize:42, minFontSize:25 };

  var state = {
    x: HOLE.x + HOLE.w / 2,
    y: HOLE.y + HOLE.h / 2,
    baseScale: 1,
    zoom: 1,
    rotation: 0,
    dragging: false,
    lastX: 0,
    lastY: 0
  };

  var fileInput = document.getElementById('guest-photo');
  var nameInput = document.getElementById('guest-name');
  var nameSizeInput = document.getElementById('name-size');
  var nameSizeValue = document.getElementById('name-size-value');
  var zoomInput = document.getElementById('photo-zoom');
  var rotateInput = document.getElementById('photo-rotate');
  var zoomValue = document.getElementById('zoom-value');
  var rotateValue = document.getElementById('rotate-value');
  var resetBtn = document.getElementById('reset-photo');
  var downloadBtn = document.getElementById('download-invite');
  var emptyHint = document.getElementById('invite-empty');
  var status = document.getElementById('invite-status');
  var removeBgBtn = document.getElementById('remove-background');
  var useOriginalBtn = document.getElementById('use-original');
  var bgProgressWrap = document.getElementById('bg-progress-wrap');
  var bgProgressBar = document.getElementById('bg-progress-bar');
  var bgProgressLabel = document.getElementById('bg-progress-label');

  function setStatus(text, type){
    status.textContent = text || '';
    status.className = 'invite-status' + (type ? ' is-' + type : '');
  }

  function fitCanvasToTemplate(){
    if (!template.naturalWidth || !template.naturalHeight) return;
    canvas.width = template.naturalWidth;
    canvas.height = template.naturalHeight;
    // Nếu bạn thay PNG khác kích thước nhưng cùng tỷ lệ, tọa độ sẽ tự scale.
    if (template.naturalWidth !== 1536 || template.naturalHeight !== 2048) {
      var sx = template.naturalWidth / 1536;
      var sy = template.naturalHeight / 2048;
      HOLE = { x:527*sx, y:674*sy, w:473*sx, h:422*sy };
      NAME = { x:768*sx, y:1222*sy, maxWidth:760*sx, fontSize:42*sy, minFontSize:25*sy };
      state.x = HOLE.x + HOLE.w/2;
      state.y = HOLE.y + HOLE.h/2;
    }
  }

  function draw(){
    if (!templateReady) return;
    ctx.save();
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0,0,canvas.width,canvas.height);

    // Layer 1: ảnh khách
    if (guest) {
      var s = state.baseScale * state.zoom;
      ctx.save();
      ctx.translate(state.x, state.y);
      ctx.rotate(state.rotation * Math.PI / 180);
      ctx.scale(s, s);
      ctx.drawImage(guest, -guest.naturalWidth/2, -guest.naturalHeight/2);
      ctx.restore();
    }

    // Layer 2: PNG thư mời đã khoét lỗ
    ctx.drawImage(template,0,0,canvas.width,canvas.height);

    // Layer 3: tên khách
    drawName();
    ctx.restore();
  }

  function normalizedName(){
    return (nameInput.value || '').trim().replace(/\s+/g,' ');
  }

  function drawName(){
    var text = normalizedName();
    if (!text) return;
    var requestedSize = nameSizeInput ? Number(nameSizeInput.value) : NAME.fontSize;
    var fontSize = Math.max(NAME.minFontSize, requestedSize);
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillStyle = '#432817';
    ctx.font = '700 ' + fontSize + 'px Arial, Helvetica, sans-serif';
    while (fontSize > NAME.minFontSize && ctx.measureText(text).width > NAME.maxWidth) {
      fontSize -= 1;
      ctx.font = '700 ' + fontSize + 'px Arial, Helvetica, sans-serif';
    }
    ctx.fillText(text, NAME.x, NAME.y, NAME.maxWidth);
  }

  function resetTransform(){
    if (!guest) return;
    state.x = HOLE.x + HOLE.w / 2;
    state.y = HOLE.y + HOLE.h / 2;
    // cover vùng khoét, cộng nhẹ 8% để tránh hở khi xoay
    state.baseScale = Math.max(HOLE.w / guest.naturalWidth, HOLE.h / guest.naturalHeight) * 1.08;
    state.zoom = 1;
    state.rotation = 0;
    zoomInput.value = '100';
    rotateInput.value = '0';
    updateOutputs();
    draw();
  }

  function updateOutputs(){
    zoomValue.textContent = Math.round(state.zoom * 100) + '%';
    rotateValue.textContent = Math.round(state.rotation) + '°';
  }

  function setBgProgress(percent, label){
    if (!bgProgressWrap) return;
    bgProgressWrap.classList.remove('is-hidden');
    bgProgressBar.style.width = Math.max(0, Math.min(100, percent || 0)) + '%';
    bgProgressLabel.textContent = label || 'Đang xử lý…';
  }

  function hideBgProgress(){ if (bgProgressWrap) bgProgressWrap.classList.add('is-hidden'); }

  function setGuestFromUrl(url, message){
    var img = new Image();
    img.onload = function(){
      guest = img;
      resetTransform();
      emptyHint.classList.add('is-hidden');
      if (message) setStatus(message, 'success');
    };
    img.onerror = function(){ setStatus('Không đọc được ảnh đã xử lý.', 'error'); };
    img.src = url;
  }

  function loadGuest(file){
    if (!file) return;
    if (!/^image\/(jpeg|png|webp|heic|heif)$/i.test(file.type) && !/\.(jpe?g|png|webp|heic|heif)$/i.test(file.name)) {
      setStatus('Vui lòng chọn file ảnh JPG, PNG, WEBP hoặc HEIC/HEIF được trình duyệt hỗ trợ.', 'error');
      return;
    }
    if (file.size > 30 * 1024 * 1024) {
      setStatus('Ảnh quá lớn. Vui lòng chọn ảnh dưới 30 MB.', 'error');
      return;
    }
    originalFile = file;
    if (guestUrl) URL.revokeObjectURL(guestUrl);
    if (originalGuestUrl) URL.revokeObjectURL(originalGuestUrl);
    if (processedGuestUrl) { URL.revokeObjectURL(processedGuestUrl); processedGuestUrl = null; }
    guestUrl = URL.createObjectURL(file);
    originalGuestUrl = guestUrl;
    removeBgBtn.disabled = false;
    useOriginalBtn.disabled = true;
    hideBgProgress();
    var img = new Image();
    img.onload = function(){
      guest = img;
      resetTransform();
      emptyHint.classList.add('is-hidden');
      setStatus('Đã chọn ảnh gốc. Bạn có thể căn chỉnh ngay hoặc bấm “Tách nền ảnh”.', 'success');
    };
    img.onerror = function(){
      guest = null;
      setStatus('Không đọc được ảnh này. Hãy thử JPG hoặc PNG.', 'error');
    };
    img.src = guestUrl;
  }

  function canvasPoint(evt){
    var rect = canvas.getBoundingClientRect();
    return {
      x:(evt.clientX - rect.left) * canvas.width / rect.width,
      y:(evt.clientY - rect.top) * canvas.height / rect.height
    };
  }

  canvas.addEventListener('pointerdown', function(evt){
    if (!guest) return;
    var p = canvasPoint(evt);
    state.dragging = true;
    state.lastX = p.x;
    state.lastY = p.y;
    canvas.classList.add('is-dragging');
    canvas.setPointerCapture(evt.pointerId);
  });
  canvas.addEventListener('pointermove', function(evt){
    if (!guest || !state.dragging) return;
    var p = canvasPoint(evt);
    state.x += p.x - state.lastX;
    state.y += p.y - state.lastY;
    state.lastX = p.x;
    state.lastY = p.y;
    draw();
  });
  function endDrag(evt){
    if (!state.dragging) return;
    state.dragging = false;
    canvas.classList.remove('is-dragging');
    try { canvas.releasePointerCapture(evt.pointerId); } catch(e) {}
  }
  canvas.addEventListener('pointerup', endDrag);
  canvas.addEventListener('pointercancel', endDrag);

  canvas.addEventListener('wheel', function(evt){
    if (!guest) return;
    evt.preventDefault();
    var next = state.zoom * (evt.deltaY < 0 ? 1.06 : 0.94);
    state.zoom = Math.min(4, Math.max(.45, next));
    zoomInput.value = String(Math.round(state.zoom * 100));
    updateOutputs();
    draw();
  }, {passive:false});

  fileInput.addEventListener('change', function(){ loadGuest(this.files && this.files[0]); });

  removeBgBtn.addEventListener('click', async function(){
    if (!originalFile || removingBackground) return;
    removingBackground = true;
    removeBgBtn.disabled = true;
    useOriginalBtn.disabled = true;
    setBgProgress(3, 'Đang tải AI tách nền (lần đầu có thể lâu hơn)…');
    setStatus('Đang tách nền trên thiết bị của bạn…');
    try {
      var mod = await import('https://esm.sh/@imgly/background-removal@1.7.0');
      var lastPct = 8;
      var blob = await mod.removeBackground(originalFile, {
        model: 'isnet_quint8',
        device: 'gpu',
        output: { format: 'image/png', quality: 1 },
        progress: function(key, current, total){
          var pct = total ? Math.round((current / total) * 88) + 8 : lastPct;
          lastPct = Math.max(lastPct, Math.min(96, pct));
          var label = key && key.indexOf('download') >= 0 ? 'Đang tải dữ liệu AI…' : 'AI đang tách chủ thể khỏi nền…';
          setBgProgress(lastPct, label);
        }
      });
      if (processedGuestUrl) URL.revokeObjectURL(processedGuestUrl);
      processedGuestUrl = URL.createObjectURL(blob);
      guestUrl = processedGuestUrl;
      setGuestFromUrl(processedGuestUrl, 'Đã tách nền. Bạn vẫn có thể kéo, zoom và xoay ảnh như bình thường.');
      setBgProgress(100, 'Tách nền hoàn tất.');
      setTimeout(hideBgProgress, 1400);
      useOriginalBtn.disabled = false;
    } catch (err) {
      console.error(err);
      hideBgProgress();
      setStatus('Thiết bị hoặc trình duyệt này chưa tách nền được. Ảnh gốc vẫn được giữ nguyên để bạn tiếp tục sử dụng.', 'error');
      useOriginalBtn.disabled = true;
    } finally {
      removingBackground = false;
      removeBgBtn.disabled = !originalFile;
    }
  });

  useOriginalBtn.addEventListener('click', function(){
    if (!originalGuestUrl) return;
    guestUrl = originalGuestUrl;
    setGuestFromUrl(originalGuestUrl, 'Đã chuyển về ảnh gốc.');
    useOriginalBtn.disabled = true;
  });
  nameInput.addEventListener('input', draw);
  if (nameSizeInput) {
    nameSizeInput.addEventListener('input', function(){
      if (nameSizeValue) nameSizeValue.textContent = Math.round(Number(this.value)) + ' px';
      draw();
    });
  }
  zoomInput.addEventListener('input', function(){ state.zoom = Number(this.value)/100; updateOutputs(); draw(); });
  rotateInput.addEventListener('input', function(){ state.rotation = Number(this.value); updateOutputs(); draw(); });
  resetBtn.addEventListener('click', function(){ resetTransform(); setStatus('Đã đưa ảnh về vị trí ban đầu.'); });

  downloadBtn.addEventListener('click', function(){
    if (!guest) { setStatus('Bạn cần chọn ảnh trước khi tải thư mời.', 'error'); fileInput.focus(); return; }
    if (!normalizedName()) { setStatus('Bạn cần nhập họ và tên trước khi tải thư mời.', 'error'); nameInput.focus(); return; }
    draw();
    setStatus('Đang tạo ảnh JPG...');
    canvas.toBlob(function(blob){
      if (!blob) { setStatus('Không thể tạo file JPG. Vui lòng thử lại.', 'error'); return; }
      var url = URL.createObjectURL(blob);
      var a = document.createElement('a');
      var safe = normalizedName().normalize('NFD').replace(/[\u0300-\u036f]/g,'').replace(/đ/g,'d').replace(/Đ/g,'D').replace(/[^a-zA-Z0-9]+/g,'-').replace(/^-|-$/g,'');
      a.href = url;
      a.download = 'thu-moi-' + (safe || 'DRCGF') + '.jpg';
      document.body.appendChild(a);
      a.click();
      a.remove();
      setTimeout(function(){ URL.revokeObjectURL(url); }, 15000);
      setStatus('Đã tạo thư mời. Nếu trình duyệt hỏi quyền tải file, hãy chọn Cho phép.', 'success');
    }, 'image/jpeg', 0.96);
  });

  template.onload = function(){
    templateReady = true;
    fitCanvasToTemplate();
    draw();
  };
  template.onerror = function(){ setStatus('Không tìm thấy file img/thu-moi.png.', 'error'); };
  template.src = 'img/thu-moi.png';
  updateOutputs();
})();
