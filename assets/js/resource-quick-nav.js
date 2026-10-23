(function(){
'use strict';
var list=document.getElementById('resource-list');if(!list)return;
var dock=document.createElement('div');dock.className='drcgf-resource-dock';dock.setAttribute('role','region');dock.setAttribute('aria-label','Điều hướng tài liệu');
var select=document.createElement('select');select.setAttribute('aria-label','Mở nhanh mục tài liệu');
var close=document.createElement('button');close.type='button';close.textContent='Đóng mục đang mở';dock.append(select,close);document.body.appendChild(dock);
function sync(){var value=select.value;select.replaceChildren(new Option('Mở nhanh mục tài liệu…',''));list.querySelectorAll('.drcgf-resource-item').forEach(function(item){var title=item.querySelector('.drcgf-resource-title');select.add(new Option(title.textContent,item.dataset.id));});select.value=value;}
new MutationObserver(sync).observe(list,{childList:true});sync();
function alignTitle(item){
  // Run after the accordion's own scroll compensation and layout update.
  requestAnimationFrame(function(){requestAnimationFrame(function(){
    var header=document.getElementById('header');
    var bottom=0;
    if(header)[header].concat(Array.from(header.querySelectorAll('.header-wrapper,.header-main,.header-bottom'))).forEach(function(el){var pos=getComputedStyle(el).position;if(pos==='fixed'||pos==='sticky')bottom=Math.max(bottom,el.getBoundingClientRect().bottom);});
    var offset=Math.max(0,Math.min(bottom,window.innerHeight/2))+8;
    var top=window.scrollY+item.getBoundingClientRect().top-offset;
    window.scrollTo({top:Math.max(0,top),behavior:window.matchMedia('(prefers-reduced-motion: reduce)').matches?'instant':'smooth'});
    setTimeout(function(){if(item.classList.contains('is-open'))window.scrollTo({top:Math.max(0,window.scrollY+item.getBoundingClientRect().top-offset),behavior:'instant'});},650);
  });});
}
select.addEventListener('change' ,function(){var item=Array.from(list.querySelectorAll('.drcgf-resource-item')).find(function(e){return e.dataset.id===select.value;});if(!item)return;var button=item.querySelector('.drcgf-resource-button');if(!item.classList.contains('is-open'))button.click();alignTitle(item);});
close.addEventListener('click',function(){var opened=Array.from(list.querySelectorAll('.drcgf-resource-item.is-open'));opened.forEach(function(item){item.querySelector('.drcgf-resource-button').click();});select.value='';if(opened[0])alignTitle(opened[0]);});
})();