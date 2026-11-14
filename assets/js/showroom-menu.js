(function(){
  "use strict";
  var nav=document.getElementById('sm3-nav'),toggle=document.getElementById('sm3-toggle');
  var header=document.querySelector('.top'), actions=document.querySelector('.top-nav');
  var desktop=window.matchMedia('(min-width:1150px)');
  function close(restore){nav.classList.remove('is-open');toggle.setAttribute('aria-expanded','false');toggle.setAttribute('aria-label','Mở menu website');nav.querySelectorAll('details[open]').forEach(function(d){d.open=false;});if(restore)toggle.focus();}
  var tools=document.createElement('div');tools.id='sm3-mobile-tools';document.body.appendChild(tools);
  var small=window.matchMedia('(max-width:900px)');
  function positionTools(){
    var dock=document.getElementById('product-dock');
    if(small.matches && dock && dock.getClientRects().length){
      document.documentElement.style.setProperty('--sm3-tools-bottom',Math.round(window.innerHeight-dock.getBoundingClientRect().top+8)+'px');
    }
  }
  function place(){
    close(false);
    var view=document.getElementById('drcgf-view-switch');
    if(desktop.matches){header.insertBefore(nav,actions);header.insertBefore(toggle,actions);}
    else {document.body.appendChild(nav);document.body.appendChild(toggle);}
    if(small.matches){if(view)document.body.appendChild(view);actions.appendChild(toggle);}
    else if(view){document.body.appendChild(view);}
    positionTools();
  }
  if(window.ResizeObserver){var observer=new ResizeObserver(positionTools);observer.observe(document.getElementById('product-dock'));}
  var wasSmall=small.matches;
  window.addEventListener('resize',function(){if(wasSmall!==small.matches){wasSmall=small.matches;place();}else positionTools();});
  window.addEventListener('load',place);
  toggle.addEventListener('click',function(){var open=toggle.getAttribute('aria-expanded')!=='true';nav.classList.toggle('is-open',open);toggle.setAttribute('aria-expanded',String(open));toggle.setAttribute('aria-label',open?'Đóng menu website':'Mở menu website');});
  nav.querySelectorAll('details').forEach(function(group){
    var leaveTimer=0;
    group.querySelector('summary').addEventListener('click',function(event){
      if(desktop.matches && event.detail>0 && window.matchMedia('(hover:hover)').matches){event.preventDefault();group.open=true;}
    });
    group.addEventListener('toggle',function(){if(group.open)nav.querySelectorAll('details').forEach(function(other){if(other!==group)other.open=false;});});
    group.addEventListener('pointerenter',function(event){
      if(!desktop.matches || event.pointerType==='touch')return;
      clearTimeout(leaveTimer);
      nav.querySelectorAll('details').forEach(function(other){if(other!==group)other.open=false;});
      group.open=true;
    });
    group.addEventListener('pointerleave',function(event){
      if(!desktop.matches || event.pointerType==='touch')return;
      clearTimeout(leaveTimer);
      leaveTimer=window.setTimeout(function(){
        if(!group.matches(':hover') && !group.querySelector(':focus-visible'))group.open=false;
      },160);
    });
  });
  document.addEventListener('pointerdown',function(e){if(!nav.contains(e.target)&&!toggle.contains(e.target))close(false);});
  document.addEventListener('keydown',function(e){if(e.key==='Escape')close(!desktop.matches&&nav.classList.contains('is-open'));});
  nav.addEventListener('click',function(e){if(e.target.closest('a'))close(false);});
  if(desktop.addEventListener)desktop.addEventListener('change',place);else desktop.addListener(place);
  place();
})();
