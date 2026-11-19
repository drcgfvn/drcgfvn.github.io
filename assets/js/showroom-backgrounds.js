(function () {
  'use strict';
  if (document.body.dataset.view !== '3d') return;
  var themes = [
    {id:'original', name:'Ánh ngọc', image:'/showroom/assets/showroom-empty.png'},
    {id:'botanical', name:'Vườn kính', image:'/showroom/assets/backgrounds/botanical.png'},
    {id:'aurora', name:'Cực quang', image:'/showroom/assets/backgrounds/aurora.png'},
    {id:'pearl', name:'Ngọc trai', image:'/showroom/assets/backgrounds/pearl.png'},
    {id:'dawn', name:'Bình minh', image:'/showroom/assets/backgrounds/dawn.png'}
  ];
  var storageKey = 'drcgf.showroomBackground';
  var chosen = themes[0], request = 0;
  try { var saved = localStorage.getItem(storageKey); chosen = themes.find(function(t){return t.id === saved;}) || chosen; } catch(e) {}
  document.documentElement.style.setProperty('--showroom-background', 'url("' + chosen.image + '")');
  function mount() {
    var nav = document.getElementById('drcgf-view-switch');
    if (!nav || document.getElementById('showroom-background-toggle')) return;
    var toggle = document.createElement('button');
    toggle.id = 'showroom-background-toggle'; toggle.type = 'button';
    toggle.setAttribute('aria-label','Đổi hình nền showroom');
    toggle.setAttribute('title','Đổi hình nền showroom');
    toggle.setAttribute('aria-expanded','false'); toggle.setAttribute('aria-controls','showroom-background-picker');
    toggle.innerHTML = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><rect x="3" y="3" width="18" height="18" rx="5"/><circle cx="8.5" cy="8.5" r="1.5"/><path d="m3 16 5-5 5 5 3-3 5 5"/></svg><span>Nền</span>';
    nav.appendChild(toggle);
    var picker = document.createElement('section');
    picker.id = 'showroom-background-picker'; picker.hidden = true;
    picker.setAttribute('aria-label','Chọn hình nền showroom');
    picker.innerHTML = '<div class="background-picker-heading"><div><small>KHÔNG GIAN DR.CGF</small><h2>Chọn hình nền</h2></div><button type="button" class="background-picker-close" aria-label="Đóng chọn hình nền"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" aria-hidden="true"><path d="m6 6 12 12M18 6 6 18"/></svg></button></div><div class="background-picker-grid"></div><p class="background-picker-status" role="status" aria-live="polite"></p>';
    document.body.appendChild(picker);
    var grid = picker.querySelector('.background-picker-grid');
    var status = picker.querySelector('.background-picker-status');
    themes.forEach(function(theme){
      var button = document.createElement('button'); button.type='button'; button.dataset.background=theme.id;
      button.setAttribute('aria-pressed',String(theme.id === chosen.id));
      button.innerHTML='<img src="'+theme.image+'" alt="" loading="lazy" decoding="async"><span>'+theme.name+'</span><svg class="background-check" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><path d="m6 12 4 4 8-8"/></svg>';
      button.addEventListener('click',function(){
        var ticket=++request; status.textContent='Đang tải nền '+theme.name+'…'; picker.setAttribute('aria-busy','true');
        var image=new Image();
        image.onload=function(){
          if(ticket!==request)return;
          chosen=theme;
          document.documentElement.style.setProperty('--showroom-background','url("'+theme.image+'")');
          grid.querySelectorAll('button').forEach(function(b){b.setAttribute('aria-pressed',String(b.dataset.background===theme.id));});
          try{localStorage.setItem(storageKey,theme.id);}catch(e){}
          status.textContent='Đã chọn '+theme.name;picker.removeAttribute('aria-busy');close(false);
        };
        image.onerror=function(){if(ticket!==request)return;status.textContent='Chưa tải được hình nền. Bạn thử lại nhé.';picker.removeAttribute('aria-busy');};
        image.src=theme.image;
      });
      grid.appendChild(button);
    });
    function position(){var rect=nav.getBoundingClientRect();picker.style.bottom=Math.max(12,window.innerHeight-rect.top+10)+'px';picker.style.left=Math.max(10,Math.min(rect.left,window.innerWidth-picker.offsetWidth-10))+'px';}
    function close(restore){picker.hidden=true;toggle.setAttribute('aria-expanded','false');if(restore)toggle.focus();}
    toggle.addEventListener('click',function(){if(!picker.hidden){close(false);return;}picker.hidden=false;toggle.setAttribute('aria-expanded','true');position();grid.querySelector('[aria-pressed="true"]').focus({preventScroll:true});});
    picker.querySelector('.background-picker-close').addEventListener('click',function(){close(true);});
    document.addEventListener('pointerdown',function(e){if(!picker.hidden&&!picker.contains(e.target)&&!toggle.contains(e.target))close(false);});
    document.addEventListener('keydown',function(e){if(e.key==='Escape'&&!picker.hidden){e.preventDefault();close(true);}});
    window.addEventListener('resize',function(){if(!picker.hidden)position();});
    window.addEventListener('drcgf:pagechange',function(){close(false);});
  }
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',mount);else mount();
})();
