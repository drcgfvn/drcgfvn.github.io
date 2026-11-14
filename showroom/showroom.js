const $ = selector => document.querySelector(selector);
const experience = $('#experience');
const stage = $('#stage');
const render = $('#render');
const details = $('#details');
const catalog = $('#catalog');
const listToggle = $('#list-toggle');
const search = $('#search');
const exit = $('#exit');
const markers = $('#markers');
const panel = $('#panel');
const readDetails = $('#read-details');
const mobile = matchMedia('(max-width:900px)');
const reducedMotion = matchMedia('(prefers-reduced-motion:reduce)');
const currency = new Intl.NumberFormat('vi-VN');
const serial = number => String(number+1).padStart(2,'0');
const cleanedPhotos = new Set(['b5-60','mist','oil','peel','pink']);
const photo = product => cleanedPhotos.has(product.id) ? '/showroom/assets/clean/'+product.id+'.png?v=29' : '/showroom/assets/'+product.id+'.webp?v=3';
const descriptions = [
  'Khám phá các dòng serum, tinh chất và xịt khoáng của DR.CGF.',
  'Các dòng kem dưỡng ngày, đêm và kem chống nắng trong cùng một khu.',
  'Từ sữa rửa mặt và gel tẩy tế bào chết đến mặt nạ dưỡng da.',
  'Bộ sản phẩm dung tích 1 lít dành cho quy trình chăm sóc chuyên nghiệp.'
];
const labels = [
  'B5 Exosome','Spicule','Tranexamic','B5 60 ml','Stem Cell','PDRN Mist',
  'Exocell B5','NMN Day','Spicule Night','Retinal','Pink Tone Up','Suncream',
  'Da dầu','Da khô','Gel tẩy da chết','Detox','Extra Whitening',
  'Micellar','Derma Wash','Derma Polish','Derma Balance','Calm Aloe','Kem massage'
];
let zone = 0;
let groupFilter = null;
const matchesGroup = product => groupFilter === null || product.group === groupFilter;
let selected = -1;
let hovered = -1;
let tab = 'info';
let returnFocus;
let catalogFocus;
let renderer;
let refreshView = () => {};
let refreshProducts = () => {};
let turnTable = () => {};
let spinning = !reducedMotion.matches;
const tableRings = [
  {count:10,radius:4.30,top:.68},
  {count:8,radius:2.95,top:1.91},
  {count:5,radius:1.49,top:3.12}
];
const displayOrder = [
  ...products.flatMap((product,index) => product.group === 3 ? [index] : []),
  ...products.flatMap((product,index) => product.group !== 3 ? [index] : [])
];
const placements = products.map((product,index) => {
  const position = displayOrder.indexOf(index);
  const ring = position < 10 ? 0 : position < 18 ? 1 : 2;
  const slot = position-(ring === 0 ? 0 : ring === 1 ? 10 : 18);
  const angle = slot/tableRings[ring].count*Math.PI*2;
  return {...tableRings[ring],ring,slot,angle};
});
const autoTourButton = $('#auto-tour');
// Physical order: bottom tier first, then middle, then top; each slot exactly once.
const autoTourOrder = placements.map((p,index) => ({...p,index}))
  .sort((a,b) => a.ring-b.ring || a.slot-b.slot).map(p => p.index);
let autoTourRunning = false;
let autoTourTimer;
function stopAutoTour() {
  autoTourRunning = false;
  clearTimeout(autoTourTimer);
  autoTourButton.setAttribute('aria-pressed','false');
  autoTourButton.querySelector('use').setAttribute('href','#icon-play');
  autoTourButton.querySelector('span').textContent = 'Xem tự động';
}
function scheduleAutoTour() {
  clearTimeout(autoTourTimer);
  if (!autoTourRunning || document.hidden) return;
  autoTourTimer = setTimeout(() => {
    if (!autoTourRunning) return;
    const tour = autoTourOrder.filter(index => matchesGroup(products[index]));
    const next = tour.indexOf(selected)+1;
    if (next >= tour.length) { closeProduct(false); return; }
    select(tour[next],autoTourButton,true);
    scheduleAutoTour();
  },4000);
}
autoTourButton.onclick = () => {
  if (autoTourRunning) { stopAutoTour(); return; }
  autoTourRunning = true;
  autoTourButton.setAttribute('aria-pressed','true');
  autoTourButton.querySelector('use').setAttribute('href','#icon-pause');
  autoTourButton.querySelector('span').textContent = 'Tạm dừng';
  const tour = autoTourOrder.filter(index => matchesGroup(products[index]));
  const start = tour.includes(selected) && selected !== tour.at(-1) ? selected : tour[0];
  select(start,autoTourButton,true);
  scheduleAutoTour();
};
document.addEventListener('visibilitychange',scheduleAutoTour);
const spinButton = $('#spin-toggle');
function updateSpinButton() {
  spinButton.setAttribute('aria-pressed',String(spinning));
  spinButton.setAttribute('aria-label',spinning ? 'Tạm dừng xoay bàn' : 'Tiếp tục xoay bàn');
  spinButton.querySelector('use').setAttribute('href',spinning ? '#icon-pause' : '#icon-play');
  const tourAction = $('#tour-action');
  tourAction.setAttribute('aria-pressed',String(spinning));
  tourAction.innerHTML = '<svg class="icon" aria-hidden="true"><use href="'+(spinning ? '#icon-pause' : '#icon-play')+'"/></svg><span>'+(spinning ? 'Tạm dừng bàn xoay' : 'Tiếp tục bàn xoay')+'</span>';
}
spinButton.onclick = () => { spinning = !spinning; updateSpinButton(); };
$('#table-left').onclick = () => turnTable(-.45);
$('#table-right').onclick = () => turnTable(.45);
updateSpinButton();
$('#tour-action').onclick = () => spinButton.click();
$('.brand').onclick = event => {
  event.preventDefault();
  stopAutoTour();
  toggleCatalog(false);
  closeProduct(false);
  search.value = '';
  setGroupFilter(null);
};
products.forEach((product,index) => {
  const button = document.createElement('button');
  button.setAttribute('aria-label',product.name);
  button.dataset.productName = product.name;
  button.innerHTML = '<img src="'+photo(product)+'" alt="" loading="lazy">';
  button.onclick = () => select(index,button);
  $('#product-strip').append(button);
});

// Desktop mouse dragging complements native touch scrolling in the product strip.
const productStrip = $('#product-strip');
const stripTooltip = document.createElement('div');
stripTooltip.id = 'strip-tooltip';
stripTooltip.setAttribute('role','tooltip');
stripTooltip.hidden = true;
document.body.append(stripTooltip);
const tableTooltip = document.createElement('div');
tableTooltip.id = 'table-tooltip';
tableTooltip.setAttribute('role','tooltip');
tableTooltip.hidden = true;
document.body.append(tableTooltip);

let tooltipButton;
function hideStripTooltip() {
  tooltipButton?.removeAttribute('aria-describedby');
  tooltipButton = undefined;
  stripTooltip.hidden = true;
}
function showStripTooltip(button) {
  if (!button?.dataset.productName) return;
  tooltipButton?.removeAttribute('aria-describedby');
  tooltipButton = button;
  stripTooltip.textContent = button.dataset.productName;
  stripTooltip.hidden = false;
  button.setAttribute('aria-describedby',stripTooltip.id);
  const box = button.getBoundingClientRect();
  const width = stripTooltip.offsetWidth;
  stripTooltip.style.left = Math.max(10,Math.min(innerWidth-width-10,box.left+box.width/2-width/2))+'px';
  stripTooltip.style.top = Math.max(10,box.top-stripTooltip.offsetHeight-10)+'px';
}
productStrip.addEventListener('pointerover',event => {
  if (event.pointerType === 'touch') return;
  const button = event.target.closest('button');
  if (button && !productStrip.classList.contains('is-dragging')) showStripTooltip(button);
});
productStrip.addEventListener('pointerout',event => {
  if (tooltipButton && !tooltipButton.contains(event.relatedTarget)) hideStripTooltip();
});
productStrip.addEventListener('focusin',event => showStripTooltip(event.target.closest('button')));
productStrip.addEventListener('focusout',hideStripTooltip);
productStrip.addEventListener('pointerdown',hideStripTooltip);
productStrip.addEventListener('scroll',hideStripTooltip,{passive:true});
productStrip.addEventListener('click',hideStripTooltip);
window.addEventListener('resize',hideStripTooltip);

let stripDrag;
let stripDragged = false;
productStrip.addEventListener('pointerdown',event => {
  if (event.pointerType !== 'mouse' || event.button !== 0) return;
  stripDragged = false;
  stripDrag = {id:event.pointerId,x:event.clientX,left:productStrip.scrollLeft};
});
productStrip.addEventListener('pointermove',event => {
  if (!stripDrag || event.pointerId !== stripDrag.id) return;
  const distance = event.clientX-stripDrag.x;
  if (!stripDragged && Math.abs(distance) > 6) {
    stripDragged = true;
    productStrip.setPointerCapture(event.pointerId);
    productStrip.classList.add('is-dragging');
  }
  if (stripDragged) {
    event.preventDefault();
    productStrip.scrollLeft = stripDrag.left-distance;
  }
});
for (const type of ['pointerup','pointercancel','lostpointercapture']) {
  productStrip.addEventListener(type,() => {
    stripDrag = undefined;
    productStrip.classList.remove('is-dragging');
  });
}
productStrip.addEventListener('pointerleave',() => {
  if (!stripDragged) stripDrag = undefined;
});
productStrip.addEventListener('click',event => {
  if (!stripDragged) return;
  event.preventDefault();
  event.stopImmediatePropagation();
  stripDragged = false;
},true);
productStrip.addEventListener('dragstart',event => event.preventDefault());
productStrip.addEventListener('wheel',event => {
  if (event.ctrlKey || event.metaKey || productStrip.scrollWidth <= productStrip.clientWidth) return;
  // Leave horizontal trackpad gestures native; translate vertical wheel motion.
  if (Math.abs(event.deltaX) >= Math.abs(event.deltaY)) return;
  const unit = event.deltaMode === 1 ? 20 : event.deltaMode === 2 ? productStrip.clientWidth : 1;
  event.preventDefault();
  productStrip.scrollLeft += event.deltaY*unit;
},{passive:false});

$('#count').textContent = products.length;
$('#footer-count').textContent = '03 TẦNG · '+products.length+' SẢN PHẨM';

const allZoneButton = document.createElement('button');
allZoneButton.id = 'all-products';
allZoneButton.textContent = 'Tất cả sản phẩm';
allZoneButton.setAttribute('aria-pressed','true');
allZoneButton.onclick = () => {
  if (selected >= 0) closeProduct(false);
  setGroupFilter(null);
};
$('#zones').append(allZoneButton);
const mobileCategory = $('#mobile-category');
const mobileCategoryOptions = $('#mobile-category-options');
const mobileCategoryButtons = ['Tất cả sản phẩm',...groups].map((name,i) => {
  const option=document.createElement('button');
  option.type='button';option.setAttribute('role','option');
  option.value=i === 0 ? 'all' : String(i-1);
  option.textContent=name;option.tabIndex=-1;
  option.setAttribute('aria-selected',String(i===0));
  option.onclick = () => {
    if (selected >= 0) closeProduct(false);
    setGroupFilter(option.value === 'all' ? null : Number(option.value));
    mobileCategory.focus({preventScroll:true});
  };
  mobileCategoryOptions.append(option);
  return option;
});
function closeMobileCategories(restoreFocus=false) {
  mobileCategoryOptions.hidden=true;
  mobileCategory.setAttribute('aria-expanded','false');
  if (restoreFocus) mobileCategory.focus({preventScroll:true});
}
function openMobileCategories() {
  mobileCategoryOptions.hidden=false;
  mobileCategory.setAttribute('aria-expanded','true');
  mobileCategoryButtons.find(button=>button.value===mobileCategory.value)?.focus({preventScroll:true});
}
mobileCategory.onclick = () => {
  if (mobileCategoryOptions.hidden) openMobileCategories();
  else closeMobileCategories();
};
mobileCategory.onkeydown = event => {
  if (event.key==='ArrowDown'||event.key==='ArrowUp') {
    event.preventDefault();openMobileCategories();
  }
};
mobileCategoryOptions.onkeydown = event => {
  const current=mobileCategoryButtons.indexOf(document.activeElement);
  const direction=event.key==='ArrowDown' ? 1 : event.key==='ArrowUp' ? -1 : 0;
  if (direction) {
    event.preventDefault();
    mobileCategoryButtons[(current+direction+mobileCategoryButtons.length)%mobileCategoryButtons.length].focus();
  } else if (event.key==='Home'||event.key==='End') {
    event.preventDefault();mobileCategoryButtons[event.key==='Home' ? 0 : mobileCategoryButtons.length-1].focus();
  }
};
document.addEventListener('pointerdown',event => {
  if (!$('#mobile-categories').contains(event.target)) closeMobileCategories();
});
document.addEventListener('keydown',event => {
  if (event.key==='Escape' && !mobileCategoryOptions.hidden) {
    event.preventDefault();event.stopImmediatePropagation();closeMobileCategories(true);
  }
},true);
window.addEventListener('resize',()=>closeMobileCategories());
const zoneButtons = groups.map((name,index) => {
  const button = document.createElement('button');
  button.innerHTML = '<span>'+serial(index)+'</span>'+name;
  button.onclick = () => {
    if (selected >= 0) closeProduct(false);
    setGroupFilter(groupFilter === index ? null : index);
  };
  $('#zones').append(button);
  return button;
});

function toggleCatalog(open, trigger = listToggle) {
  if(window.DRCGFWindows && window.DRCGFWindows.currentPage())window.DRCGFWindows.close();
  if (open) {
    stopAutoTour();
    hovered = -1;
    catalogFocus = trigger;
    search.value = '';
    filterCatalog();
    $('.catalog-scroll').scrollTop = 0;
  }
  catalog.hidden = !open;
  listToggle.setAttribute('aria-expanded', String(open));
}
listToggle.onclick = () => toggleCatalog(catalog.hidden || !!(window.DRCGFWindows && window.DRCGFWindows.currentPage()));
$('#explore').onclick = event => toggleCatalog(true,event.currentTarget);
$('#catalog-close').onclick = () => {
  toggleCatalog(false);
  catalogFocus?.focus();
};

const markerButtons = products.map((p, index) => {
  const marker = document.createElement('button');
  marker.className = 'marker marker-upper';
  marker.innerHTML = '<span aria-hidden="true">'+serial(index)+'</span>'+labels[index];
  marker.setAttribute('aria-label', p.name);
  marker.onclick = () => select(index);
  marker.onpointerenter = event => { if (event.pointerType === 'mouse') hovered = index; };
  marker.onpointerleave = () => { hovered = -1; };
  markers.append(marker);
  return marker;
});

const catalogEntries = groups.map((name,group) => {
  const heading = document.createElement('h3');
  heading.textContent = serial(group)+' / '+name;
  $('#catalog-grid').append(heading);
  const items = products.flatMap((p,index) => {
    if (p.group !== group) return [];
    const button = document.createElement('button');
    button.innerHTML = '<img src="'+photo(p)+'" alt="" loading="lazy"><span>'+p.name+'</span>';
    button.onclick = () => select(index,listToggle);
    $('#catalog-grid').append(button);
    return [{button,product:p}];
  });
  return {heading,items};
});
const normalize = value => value.normalize('NFD').replace(/\p{Diacritic}/gu,'').toLowerCase().replace(/đ/g,'d');
function filterCatalog() {
  const query = normalize(search.value.trim());
  let count = 0;
  for (const {heading,items} of catalogEntries) {
    let matches = 0;
    for (const {button,product} of items) {
      button.hidden = !normalize(product.name+' '+product.line).includes(query);
      button.classList.remove('is-muted');
      if (!button.hidden) matches++;
    }
    heading.hidden = !matches;
    heading.classList.remove('is-muted');
    count += matches;
  }
  $('#empty').hidden = count > 0;
}
search.oninput = filterCatalog;

function setGroupFilter(index) {
  stopAutoTour();
  hideStripTooltip();
  tableTooltip.hidden = true;
  groupFilter = index;
  mobileCategory.value=index === null ? 'all' : String(index);
  mobileCategory.querySelector('span').textContent=index === null ? 'Tất cả sản phẩm' : groups[index];
  mobileCategoryButtons.forEach(button=>button.setAttribute('aria-selected',String(button.value===mobileCategory.value)));
  closeMobileCategories();
  hovered = -1;
  if (index !== null) zone = index;
  zoneButtons.forEach((button,i) => button.setAttribute('aria-pressed',String(i === groupFilter)));
  allZoneButton.setAttribute('aria-pressed',String(groupFilter === null));
  $('#product-strip').querySelectorAll('button').forEach((button,i) => {
    button.hidden = !matchesGroup(products[i]);
    button.classList.remove('is-muted');
  });
  $('#product-strip').scrollLeft = 0;
  $('#count').textContent = products.length;
  $('#catalog .catalog-header h2').textContent = 'Sản phẩm';
  filterCatalog();
  refreshProducts();
  if (!renderer && stage.classList.contains('no-webgl')) showFallback();
}

function setZone(index) {
  zone = index;
  hovered = -1;
  zoneButtons.forEach((button,i) => button.setAttribute('aria-pressed',String(i===groupFilter)));
  allZoneButton.setAttribute('aria-pressed',String(groupFilter === null));

  $('#zone-label').textContent = 'BỘ SƯU TẬP / '+groups[zone].toUpperCase();
  $('#zone-description').textContent = '';

  if (!renderer && stage.classList.contains('no-webgl')) showFallback();
}

function neighbors(index) {
  const current = placements[index];
  const eligible = placements.map((placement,i) => ({...placement,index:i})).filter(p => matchesGroup(products[p.index]));
  const onRing = eligible.filter(p => p.ring === current.ring).sort((a,b) => a.slot-b.slot);
  const position = onRing.findIndex(p => p.index === index);
  const closest = direction => {
    for (let ring=current.ring+direction;ring>=0 && ring<tableRings.length;ring+=direction) {
      const options = eligible.filter(p => p.ring === ring);
      options.sort((a,b) => Math.abs(Math.atan2(Math.sin(a.angle-current.angle),Math.cos(a.angle-current.angle)))
        -Math.abs(Math.atan2(Math.sin(b.angle-current.angle),Math.cos(b.angle-current.angle))));
      if (options.length) return options[0].index;
    }
    return -1;
  };
  return {
    left:onRing.length>1 && position>=0 ? onRing[(position+onRing.length-1)%onRing.length].index : -1,
    right:onRing.length>1 && position>=0 ? onRing[(position+1)%onRing.length].index : -1,
    up:closest(1), down:closest(-1)
  };
}

const catalogueSections = [
  ['benefits','Công dụng'],['highlights','Điểm nổi bật'],['ingredients','Thành phần'],
  ['skin','Dành cho da'],['directions','Hướng dẫn sử dụng'],['storage','Bảo quản']
];

function showCatalogue(product) {
  const sections = document.createDocumentFragment();
  for (const [key,title] of catalogueSections) {
    const entries = product.catalogue[key];
    if (!entries?.length) continue;
    const section = document.createElement('section');
    section.className = 'catalogue-section';
    const heading = document.createElement('h3');
    heading.textContent = title;
    section.append(heading);
    const copy = document.createElement(entries.length === 1 ? 'p' : 'ul');
    for (const entry of entries) {
      if (entries.length === 1) copy.textContent = entry;
      else {
        const item = document.createElement('li');
        item.textContent = entry;
        copy.append(item);
      }
    }
    section.append(copy);
    sections.append(section);
  }
  panel.replaceChildren(sections);
}

function showTab(name) {
  tab = name;
  document.querySelectorAll('[data-tab]').forEach(button => {
    button.setAttribute('aria-pressed', String(button.dataset.tab === tab));
  });
  const p = products[selected];
  if (tab === 'photo') {
    panel.innerHTML = '<img src="'+photo(p)+'" alt="Ảnh trưng bày '+p.name+'">';
  } else if (tab === 'docs') {
    const receipt = p.receipt ? '<p>Số tiếp nhận: '+p.receipt+'</p>' : '<p>Chưa có số tiếp nhận để hiển thị.</p>';
    const reports = p.reports.length ? '<p>Mã hồ sơ theo tài liệu cung cấp:</p><ul>'+p.reports.map(code => '<li>'+code+'</li>').join('')+'</ul>' : '<p>Chưa có mã hồ sơ để hiển thị.</p>';
    const notification = p.notificationImage ? '<a class="notification-preview" href="'+p.notificationImage+'" target="_blank" rel="noopener" aria-label="Xem rõ trang đầu phiếu công bố '+p.name+'"><img src="'+p.notificationImage+'" alt="Trang đầu phiếu công bố '+p.name+'" loading="lazy"></a><p class="notification-hint">Chạm ảnh để xem rõ hơn</p>' : '';
    panel.innerHTML = '<h3>Phiếu công bố sản phẩm</h3>'+receipt+notification+'<h3>Kiểm nghiệm</h3>'+reports;
  } else {
    showCatalogue(p);
  }
}

function select(index, focusTarget = markerButtons[index], automatic = false) {
  hideStripTooltip();
  tableTooltip.hidden = true;
  if (!products[index]) return;
  if (!automatic) stopAutoTour();
  const p = products[index];
  if (!matchesGroup(p)) setGroupFilter(null);
  const entering = selected < 0;
  if (entering) returnFocus = renderer ? focusTarget : listToggle;
  setZone(p.group);
  selected = index;
  hovered = -1;
  toggleCatalog(false);
  experience.classList.add('inspect');
  $('#table-controls').hidden = true;
  details.hidden = exit.hidden = readDetails.hidden = $('#controls').hidden = false;
  markers.hidden = true;
  $('#position').textContent = groups[p.group].toUpperCase()+' / '+serial(index);
  $('#product-name').textContent = p.name;
  $('#product-line').textContent = 'DR.CGF '+p.line;
  $('#price').textContent = currency.format(p.price)+' ₫';
  $('#amount').textContent = p.size;
  $('#product-strip').querySelectorAll('button').forEach((button,i) => button.setAttribute('aria-pressed',String(i===index)));
  const adjacent = neighbors(index);
  for (const button of document.querySelectorAll('[data-move]')) {
    button.disabled = adjacent[button.dataset.move] < 0;
  }
  showTab(entering ? 'info' : tab);
  if (entering || document.activeElement.disabled || document.activeElement.closest('#catalog')) {
    $('#product-name').focus({preventScroll:true});
  }
  $('.details-scroll').scrollTop = 0;
  if (!renderer) showFallback();
  refreshView();
}

function closeProduct(restoreFocus = true) {
  stopAutoTour();
  if (selected < 0) return;
  selected = hovered = -1;
  experience.classList.remove('inspect');
  $('#table-controls').hidden = false;
  details.hidden = exit.hidden = readDetails.hidden = $('#controls').hidden = true;
  markers.hidden = !renderer;
  if (!renderer) showFallback();
  refreshView();
  if (restoreFocus) {
    const target = returnFocus?.hidden ? zoneButtons[zone] : returnFocus;
    target?.focus({preventScroll:true});
  }
}

readDetails.onclick = () => {
  details.scrollIntoView({behavior:reducedMotion.matches ? 'instant' : 'smooth',block:'start'});
  $('#product-name').focus({preventScroll:true});
};
exit.onclick = () => closeProduct();
document.querySelectorAll('[data-tab]').forEach(button => {
  button.onclick = () => showTab(button.dataset.tab);
});
document.querySelectorAll('[data-move]').forEach(button => {
  button.onclick = () => select(neighbors(selected)[button.dataset.move]);
});
addEventListener('keydown', event => {
  if (event.key === 'Escape') {
    if (!catalog.hidden) {
      toggleCatalog(false);
      catalogFocus?.focus({preventScroll:true});
    } else closeProduct();
  }
  const direction = {ArrowUp:'up',ArrowDown:'down',ArrowLeft:'left',ArrowRight:'right'}[event.key];
  if (direction && selected >= 0 && catalog.hidden && !event.altKey && !event.ctrlKey && !event.metaKey) {
    event.preventDefault();
    select(neighbors(selected)[direction]);
  }
});

function showFallback() {
  const fallback = $('#fallback');
  fallback.hidden = false;
  stage.classList.add('no-webgl');
  markers.hidden = true;
  if (selected >= 0) {
    const p = products[selected];
    fallback.innerHTML = '<img src="'+photo(p)+'" alt="'+p.name+'">';
  } else {
    fallback.innerHTML = '<strong>'+groups[zone]+'</strong><p>Chọn một sản phẩm trong danh mục để xem ảnh và thông tin.</p><button type="button">Mở danh mục</button>';
    fallback.querySelector('button').onclick = () => toggleCatalog(true);
  }
}

setZone(0);

function buildRoom() {
  const T = THREE;
  const scene = new T.Scene();
  scene.fog = new T.FogExp2(0xd6edfc,.018);
  const camera = new T.PerspectiveCamera(38,1,.05,75);
  renderer = new T.WebGLRenderer({antialias:true,alpha:true});
  const renderDensity = () => mobile.matches
    ? Math.min(devicePixelRatio || 1,2.5)
    : selected >= 0
      ? Math.max(1.5,Math.min(devicePixelRatio || 1,1.75))
      : Math.max(1.25,Math.min(devicePixelRatio || 1,1.5));
  renderer.setPixelRatio(renderDensity());
  renderer.outputColorSpace = T.SRGBColorSpace;
  renderer.toneMapping = T.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.06;
  render.append(renderer.domElement);
  const canvas = renderer.domElement;
  canvas.setAttribute('aria-hidden','true');

  function radialTexture(stops) {
    const art = document.createElement('canvas');
    art.width = art.height = 128;
    const ctx = art.getContext('2d');
    const gradient = ctx.createRadialGradient(64,64,0,64,64,64);
    for (const [point,color] of stops) gradient.addColorStop(point,color);
    ctx.fillStyle = gradient;
    ctx.fillRect(0,0,128,128);
    return new T.CanvasTexture(art);
  }

  const glow = radialTexture([[0,'rgba(255,255,255,.88)'],[.42,'rgba(255,255,255,.45)'],[1,'rgba(255,255,255,0)']]);
  const shadow = radialTexture([[0,'rgba(255,255,255,.8)'],[.5,'rgba(255,255,255,.35)'],[1,'rgba(255,255,255,0)']]);
  function plane(width,height,x,y,z,mat,floor=false,parent=scene) {
    const obj = new T.Mesh(new T.PlaneGeometry(width,height),mat);
    obj.position.set(x,y,z);
    if (floor) obj.rotation.x = -Math.PI/2;
    parent.add(obj);
    return obj;
  }
  function box(width,height,depth,x,y,z,material) {
    const mesh = new T.Mesh(new T.BoxGeometry(width,height,depth),material);
    mesh.position.set(x,y,z);
    scene.add(mesh);
    return mesh;
  }

  scene.add(new T.HemisphereLight(0xf4fcff,0x8ba8c4,3.0));
  const key = new T.DirectionalLight(0xfff7e9,2.45);
  key.position.set(-4,7,4);
  scene.add(key);

  // Soft studio reflections create a bright enamel-and-frosted-glass finish.
  const studio = document.createElement('canvas');
  studio.width=512; studio.height=256;
  const ctx=studio.getContext('2d');
  const studioWash=ctx.createLinearGradient(0,0,0,256);
  studioWash.addColorStop(0,'#f2f9ff'); studioWash.addColorStop(.55,'#b8d1e0'); studioWash.addColorStop(1,'#8c9eae');
  ctx.fillStyle=studioWash;ctx.fillRect(0,0,512,256);
  ctx.fillStyle='#fff';ctx.fillRect(25,35,90,110);ctx.fillRect(300,20,135,100);
  const studioTexture=new T.CanvasTexture(studio);
  studioTexture.colorSpace=T.SRGBColorSpace;
  studioTexture.mapping=T.EquirectangularReflectionMapping;
  const environmentGenerator=new T.PMREMGenerator(renderer);
  scene.environment=environmentGenerator.fromEquirectangular(studioTexture).texture;
  studioTexture.dispose();environmentGenerator.dispose();
  const white = new T.MeshStandardMaterial({color:0xf6fbff,metalness:.10,roughness:.19,emissive:0xa6bfce,emissiveIntensity:.48});
  const silver = new T.MeshStandardMaterial({color:0xe1eaf0,metalness:.68,roughness:.25});
  const light = new T.MeshBasicMaterial({color:0xb8edff,toneMapped:false});
  const glowMat = new T.MeshBasicMaterial({
    map:glow,color:0x79cfff,transparent:true,opacity:.10,depthWrite:false,blending:T.AdditiveBlending
  });
  const floor = new T.MeshBasicMaterial({
    map:shadow,color:0x607fa0,transparent:true,opacity:.18,depthWrite:false
  });
  plane(13,11,0,-.10,0,floor,true);



  const glassBody = new T.MeshPhysicalMaterial({
    color:0xffffff,vertexColors:true,metalness:.16,roughness:.28,clearcoat:1,clearcoatRoughness:.24,envMapIntensity:.35,emissive:0xa5c2d6,emissiveIntensity:.045,
    transparent:false,opacity:1,depthWrite:true
  });
  const glassSurface = new T.MeshPhysicalMaterial({
    color:0x83c9df,metalness:.22,roughness:.17,clearcoat:1,clearcoatRoughness:.16,envMapIntensity:.45,emissive:0x8cc6df,emissiveIntensity:.04,
    transparent:false,opacity:1,depthWrite:true
  });
  // Compensate for the top tier's shallower viewing angle: retain the glass base
  // but soften the clearcoat lobe so the same light cannot form a sharp white streak.
  const topGlassSurface = glassSurface.clone();
  topGlassSurface.clearcoat = .45;
  topGlassSurface.clearcoatRoughness = .38;
  topGlassSurface.roughness = .23;
  const violetLight = new T.MeshBasicMaterial({color:0xd8e8ff,toneMapped:false});
  const edgeClock={value:0};
  const edgeTint=new T.ShaderMaterial({
    uniforms:{uTime:edgeClock},toneMapped:false,
    vertexShader:`varying vec2 vUv;void main(){vUv=uv;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.0);}`,
    fragmentShader:`varying vec2 vUv;uniform float uTime;void main(){
      float a=vUv.x*6.283185;
      float mixTone=.5+.5*sin(a*1.5-uTime*.12);
      vec3 c=mix(vec3(.42,.95,1.0),vec3(.86,.76,1.0),mixTone*.65);
      float sheen=pow(.5+.5*cos(a-uTime*.22),22.0);
      c=mix(c,vec3(.94,.99,1.0),sheen*.75);
      gl_FragColor=vec4(c,1.0);
    }`
  });
  const neonPink = new T.MeshBasicMaterial({color:0xffb7e6,toneMapped:false});
  const pinkAura = new T.MeshBasicMaterial({color:0xff94d5,transparent:true,opacity:.18,depthWrite:false,blending:T.AdditiveBlending,toneMapped:false});
  const table = new T.Group();
  scene.add(table);
  function disc(radius,height,y,material,parent=table) {
    const geometry = new T.CylinderGeometry(radius,radius,height,112,12);
    if (material === glassBody) {
      const positions = geometry.getAttribute('position');
      const colors = new Float32Array(positions.count*3);
      const lower = new T.Color(0xb9d6e8), middle = new T.Color(0xd5e9ef), upper = new T.Color(0xead3e8);
      const shade = new T.Color();
      for (let i=0;i<positions.count;i++) {
        const t=T.MathUtils.clamp(positions.getY(i)/height+.5,0,1);
        if(t<.5) shade.copy(lower).lerp(middle,T.MathUtils.smoothstep(t,0,.5));
        else shade.copy(middle).lerp(upper,T.MathUtils.smoothstep(t,.5,1));
        colors.set([shade.r,shade.g,shade.b],i*3);
      }
      geometry.setAttribute('color',new T.BufferAttribute(colors,3));
    }
    const mesh = new T.Mesh(geometry,material);
    mesh.position.y = y;
    parent.add(mesh);
    return mesh;
  }
  function hoop(radius,y,tube,material,parent=table) {
    const mesh = new T.Mesh(new T.TorusGeometry(radius,tube,12,128),material);
    mesh.rotation.x = -Math.PI/2;
    mesh.position.y = y;
    parent.add(mesh);
    return mesh;
  }

  const tabletopReflection = new T.ShaderMaterial({
    uniforms:{uTime:edgeClock,uStrength:{value:1}},transparent:true,depthWrite:false,side:T.DoubleSide,toneMapped:false,
    vertexShader:`varying vec2 vUv;void main(){vUv=uv;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.0);}`,
    fragmentShader:`varying vec2 vUv;uniform float uTime;uniform float uStrength;void main(){
      vec2 p=vUv-.5;float r=length(p);if(r>.493)discard;
      float sweep=p.x*.74+p.y*.67-(.10+sin(uTime*.09)*.035);
      // Broad, low-contrast reflection without a thin scratch-like highlight.
      float broad=exp(-pow(sweep/.15,2.0));
      float angle=atan(p.y,p.x);
      float rim=exp(-pow((r-.469)/.014,2.0))*(.5+.5*cos(angle-1.1));
      float fade=1.0-smoothstep(.43,.493,r);
      float alpha=broad*.055*fade+rim*.09;
      gl_FragColor=vec4(.94,.99,1.0,alpha*uStrength);
    }`
  });
  const shadowLip = new T.MeshStandardMaterial({color:0x6d829f,metalness:.45,roughness:.31});
  const lavenderTrim = new T.MeshStandardMaterial({color:0xc2b8dc,metalness:.42,roughness:.24});
  for (const [radius,top] of [[5.05,.65],[3.59,1.88],[2.12,3.09]]) {
    const base = top === .65 ? .03 : top-1.13;
    // Recess the support so the projecting top reads as a separate glass slab.
    const bodyHeight=top-base-.22;
    disc(radius-.31,bodyHeight,base+bodyHeight/2,glassBody);
    disc(radius-.24,.075,top-.185,shadowLip);
    hoop(radius-.305,base+.06,.014,lavenderTrim);
    disc(radius,.075,top-.10,silver);
    disc(radius-.018,.041,top-.047,[edgeTint,light,light]);
    disc(radius-.035,.058,top-.003,top===3.09 ? topGlassSurface : glassSurface);
    const reflection=tabletopReflection.clone();
    reflection.uniforms.uTime=edgeClock;
    reflection.uniforms.uStrength.value=1;
    plane(radius*2,radius*2,0,top+.036,0,reflection,true,table);
    hoop(radius-.026,top+.018,.014,violetLight);
    hoop(radius-.22,top+.027,.009,silver);
    hoop(radius-.016,top-.125,.022,silver);
    hoop(radius+.006,top-.098,.014,neonPink);
    hoop(radius+.006,top-.098,.034,pinkAura);
    // Coloured light spills from the neon edge onto the physical support below.
    const cyanSpill = new T.PointLight(0x69dcff,7.5,radius*2.2,2);
    cyanSpill.position.set(-radius*.78,top-.28,radius*.82);
    table.add(cyanSpill);
    const pinkSpill = new T.PointLight(0xff99d4,6.5,radius*2.2,2);
    pinkSpill.position.set(radius*.78,top-.28,radius*.82);
    table.add(pinkSpill);
    hoop(radius-.022,top-.047,.045,glowMat);
    hoop(radius-.11,base+.055,.018,light);
  }
  // The top tier has no illuminated tier above it; a broad overhead source
  // supplies the same gentle glass response without a separate reflection overlay.
  const topSoftLight = new T.PointLight(0xe8f6ff,.28,7,2);
  topSoftLight.position.set(1.9,3.85,-2.7);
  table.add(topSoftLight);
  hoop(5.34,.007,.018,light,scene);

  const edgeGlow = new T.MeshBasicMaterial({
    color:0x88ccff,transparent:true,opacity:.045,depthWrite:false,
    blending:T.AdditiveBlending,toneMapped:false
  });
  for (const [radius,top] of [[5.05,.65],[3.59,1.88],[2.12,3.09]]) {
    hoop(radius-.018,top-.044,.085,edgeGlow);
  }
  const productLightClock={value:0};
  const loader = new T.TextureLoader();
  const models = products.map((p,index) => {
    const placement = placements[index];
    const {radius,angle,top} = placement;
    const texture = loader.load(photo(p));
    texture.colorSpace = T.SRGBColorSpace;
    texture.anisotropy = Math.min(8,renderer.capabilities.getMaxAnisotropy());
    const material = new T.MeshBasicMaterial({map:texture,transparent:mobile.matches,depthWrite:true,alphaTest:.08,alphaToCoverage:true,side:T.DoubleSide,toneMapped:false,fog:false});
    const focus={value:matchesGroup(p) ? 1 : 0,target:matchesGroup(p) ? 1 : 0};
    material.onBeforeCompile = shader => {
      shader.uniforms.uGroupFocus=focus;
      shader.uniforms.uProductTime=productLightClock;
      shader.uniforms.uProductPhase={value:index*.137};
      shader.fragmentShader='uniform float uProductTime; uniform float uProductPhase; uniform float uGroupFocus;\n'+shader.fragmentShader;
      shader.fragmentShader=shader.fragmentShader.replace('#include <map_fragment>',`#include <map_fragment>
        #ifdef USE_MAP
          float sweep=fract(uProductTime*.065+uProductPhase)*2.0-.5;
          float distanceToLight=(vMapUv.x*.88+vMapUv.y*.12)-sweep;
          float reflection=exp(-pow(distanceToLight/.095,2.0));
          diffuseColor.rgb=mix(diffuseColor.rgb,vec3(.93,.98,1.0),reflection*.065);
          float neutral=dot(diffuseColor.rgb,vec3(.2126,.7152,.0722));
          diffuseColor.rgb=mix(vec3(neutral*.9),diffuseColor.rgb,uGroupFocus);
          diffuseColor.a*=mix(.55,1.0,uGroupFocus);
        #endif
      `);
    };
    material.customProgramCacheKey=()=> 'drcgf-product-soft-reflection-v2-muted';
    const height = Math.min(1.07,1.21/p.aspect)*(p.group === 3 ? 1.27 : 1);
    const geometry = new T.PlaneGeometry(1,1);
    geometry.translate(0,.5,0);
    const mesh = new T.Mesh(geometry,material);
    const x = Math.sin(angle)*radius;
    const z = Math.cos(angle)*radius;
    mesh.position.set(x,top,z);
    mesh.scale.set(height*p.aspect,height,1);
    mesh.userData.index = index;
    mesh.renderOrder = 0;
    table.add(mesh);
    return {mesh,x,z,top,height,angle,radius,ring:placement.ring,focus};
  });

  function updateProductEdges() {
    // Blend desktop product alpha edges smoothly in both overview and close-up.
    // Preserve the existing mobile treatment.
    const softDesktop = !mobile.matches;
    models.forEach(({mesh}) => {
      const material = mesh.material;
      const transparent = mobile.matches || softDesktop;
      const coverage = !softDesktop;
      const cutoff = softDesktop ? .01 : .08;
      if (material.transparent !== transparent || material.alphaToCoverage !== coverage || material.alphaTest !== cutoff) {
        material.transparent = transparent;
        material.alphaToCoverage = coverage;
        material.alphaTest = cutoff;
        material.needsUpdate = true;
      }
      material.depthWrite = true;
      mesh.renderOrder = 0;
    });
  }

  let tableAngle = 0;
  let rotationTarget = null;
  let rotationStart = 0;
  let rotationStarted = 0;
  let rotationDuration = 650;
  let resumeAt = 0;
  const world = new T.Vector3();
  function startRotation(destination,duration=650) {
    rotationStart = tableAngle;
    rotationTarget = destination;
    rotationStarted = performance.now();
    rotationDuration = reducedMotion.matches ? 0 : duration;
  }
  function orientTo(index,duration=650) {
    const destination = -models[index].angle;
    startRotation(tableAngle+Math.atan2(Math.sin(destination-tableAngle),Math.cos(destination-tableAngle)),duration);
  }
  turnTable = delta => {
    startRotation((rotationTarget ?? tableAngle)+delta);
    spinning = true;
    updateSpinButton();
    resumeAt = performance.now()+2000;
  };
  refreshProducts = () => {
    models.forEach(({mesh,focus},index) => {
      mesh.visible=matchesGroup(products[index]);
      focus.value=focus.target=1;
      mesh.material.depthWrite=true;
    });
    if (groupFilter !== null && selected < 0) {
      const indexes = products.flatMap((p,index) => matchesGroup(p) ? [index] : []);
      if (indexes.length) orientTo(indexes[Math.floor((indexes.length-1)/2)]);
      resumeAt = performance.now()+2000;
    }
  };
  refreshProducts();

  const aim = new T.Vector3();
  const targetAim = new T.Vector3();
  const targetCamera = new T.Vector3();
  const startAim = new T.Vector3();
  const startCamera = new T.Vector3();
  const projected = new T.Vector3();
  const cameraSpace = new T.Vector3();
  const tint = new T.Color();
  const tones = [0x79cfff,0xa0a1fa,0x69d8ec,0x71a9fa];
  let flightStarted = 0;
  let flightDuration = 0;
  let previousSelection = -1;
  let viewportBounds = render.getBoundingClientRect();
  let entryProjectionScale = 1;
  let entryProjectionShift = 0;
  function setTargets() {
    if (selected >= 0) {
      const {radius,top,height} = models[selected];
      const x = 0;
      const z = radius;
      const distance = mobile.matches
        ? Math.max(2.55,(height*products[selected].aspect+.35)/(camera.aspect*.60))
        : Math.max(3.40,(height*products[selected].aspect+.57)/(camera.aspect*.58));
      const offset = mobile.matches ? 0 : .26*camera.aspect*Math.tan(T.MathUtils.degToRad(19))*distance;
      targetAim.set(x+offset,top+height*.49,z);
      // A level lens keeps world-vertical product edges parallel to the table axis.
      // Camera and aim rise together during tier changes, without pitching.
      targetCamera.set(x+offset,top+height*.49,z+distance);
    } else {
      const x = 0;
      const distance = mobile.matches
        ? Math.max(12.8,14.0/camera.aspect)
        : Math.max(13.6,15.8/camera.aspect);
      targetAim.set(x,mobile.matches ? 1.20 : 1.50,0);
      targetCamera.set(x, mobile.matches ? 5.65 : 5.20,distance);
    }
  }

  refreshView = () => {
    updateProductEdges();
    const density = renderDensity();
    if (renderer.getPixelRatio() !== density) renderer.setPixelRatio(density);
    const now = performance.now();
    const enteringOnMobile = mobile.matches && selected >= 0 && previousSelection < 0;
    entryProjectionScale = 1;
    entryProjectionShift = 0;
    if(enteringOnMobile && !reducedMotion.matches){
      // The inspect layout shrinks and moves the canvas before the camera flies.
      // Preserve its former pixel scale and screen centre, then ease to the new lens.
      const before = viewportBounds;
      resize();
      const after = viewportBounds;
      if(before.height && after.height){
        entryProjectionScale = before.height/after.height;
        entryProjectionShift = 2*((before.top+before.height/2)-(after.top+after.height/2))/after.height;
      }
    }
    const sameRing = selected >= 0 && previousSelection >= 0
      && models[selected].ring === models[previousSelection].ring
      && now >= flightStarted+flightDuration;
    startAim.copy(aim);
    startCamera.copy(camera.position);
    if (sameRing) {
      // When browsing a row, keep the lens still and let the table pass beneath it.
      targetAim.copy(aim);
      targetCamera.copy(camera.position);
    } else {
      setTargets();
    }
    const rotationMs = reducedMotion.matches ? 0 : enteringOnMobile ? 950 : 580;
    if (selected >= 0) {
      orientTo(selected,rotationMs);
      rotationStarted = now;
      // Move diagonally between tiers while the table turns; keep the lens still within a tier.
      flightStarted = now;
      flightDuration = reducedMotion.matches || sameRing ? 0 : rotationMs;
    } else {
      rotationTarget = null;
      flightStarted = now;
      flightDuration = reducedMotion.matches ? 0 : 800;
      resumeAt = now+flightDuration;
    }
    previousSelection = selected;
  };

  function resize() {
    const width = render.clientWidth;
    const height = render.clientHeight;
    if (!width || !height) return;
    viewportBounds = render.getBoundingClientRect();
    camera.aspect = width/height;
    camera.updateProjectionMatrix();
    updateProductEdges();
    const density = renderDensity();
    if (renderer.getPixelRatio() !== density) renderer.setPixelRatio(density);
    renderer.setSize(width,height,false);
    setTargets();
  }

  new ResizeObserver(resize).observe(render);
  resize();
  camera.position.copy(targetCamera);
  aim.copy(targetAim);

  const ray = new T.Raycaster();
  const pointer = new T.Vector2();
  const pickMasks = new WeakMap();
  function pick(event) {
    const rect = canvas.getBoundingClientRect();
    pointer.set((event.clientX-rect.left)/rect.width*2-1,1-(event.clientY-rect.top)/rect.height*2);
    ray.setFromCamera(pointer,camera);
    for (const hit of ray.intersectObjects(table.children,true)) {
      const mesh = hit.object;
      if (!mesh.visible) continue;
      const index = mesh.userData.index;
      if (index === undefined) {
        // Opaque shelves hide products behind them; light rings do not block clicks.
        if (mesh.material && !mesh.material.transparent) return -1;
        continue;
      }
      const image = mesh.material.map?.image;
      if (!image?.width || !hit.uv) continue;
      let mask = pickMasks.get(image);
      if (!mask) {
        const surface = document.createElement('canvas');
        surface.width = image.width; surface.height = image.height;
        const context = surface.getContext('2d',{willReadFrequently:true});
        context.drawImage(image,0,0);
        mask = context.getImageData(0,0,image.width,image.height);
        pickMasks.set(image,mask);
      }
      const x = Math.min(mask.width-1,Math.max(0,Math.floor(hit.uv.x*mask.width)));
      const y = Math.min(mask.height-1,Math.max(0,Math.floor((1-hit.uv.y)*mask.height)));
      if (mask.data[(y*mask.width+x)*4+3] >= 21) return index;
    }
    return -1;
  }

  let drag;
  let dragged = false;
  canvas.style.touchAction = 'pan-y';
  canvas.addEventListener('pointerdown',event => {
    if (event.button !== 0) return;
    dragged = false;
    if (selected >= 0) return;
    drag = {id:event.pointerId,x:event.clientX,angle:tableAngle};
    dragged = false;
    canvas.setPointerCapture(event.pointerId);
  });
  canvas.addEventListener('pointermove',event => {
    if (selected >= 0) {
      hovered = pick(event);
      canvas.style.cursor = hovered >= 0 && hovered !== selected ? 'pointer' : 'default';
      return;
    }
    if (drag?.id === event.pointerId) {
      const distance = event.clientX-drag.x;
      if (Math.abs(distance)>6) dragged = true;
      if (dragged) {
        tableAngle = drag.angle+distance*.006;
        rotationTarget = null;
        resumeAt = performance.now()+2000;
      }
    } else if (event.pointerType === 'mouse') {
      hovered = pick(event);
      canvas.style.cursor = hovered >= 0 ? 'pointer' : 'grab';
    }
  });
  for (const type of ['pointerup','pointercancel','lostpointercapture']) {
    canvas.addEventListener(type,() => {drag = undefined;});
  }
  canvas.addEventListener('pointerleave',() => {hovered = -1;});
  canvas.addEventListener('click',event => {
    if (dragged) return;
    const index = pick(event);
    if (index >= 0 && index !== selected) select(index,listToggle);
  });
  canvas.addEventListener('webglcontextlost',event => {
    event.preventDefault();
    renderer = undefined;
    showFallback();
  });

  let lastFrame = 0;
  function frame(now) {
    if (!renderer) return;
    const elapsed = Math.min(50,now-lastFrame);
    const blend = reducedMotion.matches ? 1 : 1-Math.exp(-elapsed/115);
    lastFrame = now;
    productLightClock.value=reducedMotion.matches ? -20 : now*.001;
    edgeClock.value=reducedMotion.matches ? 0 : now*.001;
    if (rotationTarget !== null) {
      const progress = rotationDuration ? T.MathUtils.clamp((now-rotationStarted)/rotationDuration,0,1) : 1;
      tableAngle = T.MathUtils.lerp(rotationStart,rotationTarget,T.MathUtils.smootherstep(progress,0,1));
      if (progress === 1) rotationTarget = null;
    } else if (selected < 0 && spinning && !drag && hovered < 0 && now > resumeAt && !document.hidden) {
      tableAngle += elapsed*.000075;
    }
    // The table and product planes share the same vertical Y axis at every angle.
    table.rotation.set(0,tableAngle,0);
    table.updateMatrixWorld(true);
    const t = now < flightStarted ? 0 : flightDuration ? T.MathUtils.clamp((now-flightStarted)/flightDuration,0,1) : 1;
    camera.position.lerpVectors(startCamera,targetCamera,T.MathUtils.smootherstep(t,0,1));
    aim.lerpVectors(startAim,targetAim,T.MathUtils.smootherstep(t,0,1));
    camera.up.set(0,1,0);
    // Architectural perspective: keep the optical axis level at every tier.
    // Shift the lens vertically to frame the target without tilting vertical lines.
    camera.lookAt(aim.x,camera.position.y,aim.z);
    const aimDepth = Math.max(.01,Math.hypot(camera.position.x-aim.x,camera.position.z-aim.z));
    if(entryProjectionScale!==1 || entryProjectionShift!==0){
      camera.updateProjectionMatrix();
      const remaining=1-T.MathUtils.smootherstep(t,0,1);
      const lensScale=1+(entryProjectionScale-1)*remaining;
      camera.projectionMatrix.elements[0]*=lensScale;
      camera.projectionMatrix.elements[5]*=lensScale;
      camera.projectionMatrix.elements[9]=(aim.y-camera.position.y)*camera.projectionMatrix.elements[5]/aimDepth+entryProjectionShift*remaining;
      if(t===1){entryProjectionScale=1;entryProjectionShift=0;}
    }else camera.projectionMatrix.elements[9] = (aim.y-camera.position.y)*camera.projectionMatrix.elements[5]/aimDepth;
    camera.projectionMatrixInverse.copy(camera.projectionMatrix).invert();
    camera.updateMatrixWorld();
    glowMat.color.lerp(tint.setHex(tones[zone]),blend);
    // Product cutouts stand vertically on the table: only yaw toward the lens.
    // Full camera-facing sprites tilt with camera pitch and appear to fall forward.
    const productYaw = Math.atan2(camera.position.x-aim.x,camera.position.z-aim.z);
    if (hovered < 0 || drag || !catalog.hidden) tableTooltip.hidden = true;
    models.forEach(({mesh,height,focus},index) => {
      focus.value=T.MathUtils.lerp(focus.value,focus.target,blend);
      mesh.rotation.set(0,productYaw-tableAngle,0);
      const width = height*products[index].aspect;
      const targetScale = hovered === index && selected < 0 ? 1.08 : 1;
      const scale = T.MathUtils.lerp(mesh.scale.y/height,targetScale,blend);
      mesh.scale.set(width*scale,height*scale,1);
      markerButtons[index].hidden = true;
      if (hovered === index && !drag && catalog.hidden) {
        mesh.getWorldPosition(world);
        world.y += height*scale;
        projected.copy(world).project(camera);
        if (projected.z < -1 || projected.z > 1) {
          tableTooltip.hidden = true;
          return;
        }
        tableTooltip.textContent = products[index].name;
        tableTooltip.hidden = false;
        const bounds = canvas.getBoundingClientRect();
        const center = bounds.left+(projected.x*.5+.5)*bounds.width;
        const top = bounds.top+(1-projected.y)*.5*bounds.height;
        tableTooltip.style.left = Math.max(10,Math.min(innerWidth-tableTooltip.offsetWidth-10,center-tableTooltip.offsetWidth/2))+'px';
        tableTooltip.style.top = Math.max(10,top-tableTooltip.offsetHeight-10)+'px';
      }
    });
    renderer.render(scene,camera);
    requestAnimationFrame(frame);
  }
  requestAnimationFrame(frame);
}

try { buildRoom(); } catch (error) {
  console.warn('WebGL showroom unavailable',error);
  renderer = undefined;
  showFallback();
}
