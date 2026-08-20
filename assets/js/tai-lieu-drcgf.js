(function(){
  'use strict';
  var listEl=document.getElementById('resource-list'); if(!listEl) return;
  var data=Array.isArray(window.DRCGF_RESOURCE_DATA)?window.DRCGF_RESOURCE_DATA:[];
  var typeLabel={video:'Video',image:'Hình ảnh',document:'Tài liệu',slide:'Slide'};
  var esc=function(s){return String(s||'').replace(/[&<>"']/g,function(c){return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c];});};
  var fileExt=function(s){var x=String(s||'').split('.').pop();return x&&x.length<6?x.toUpperCase():'FILE';};
  var ytPromise=null;
  var ytPlayers={};
  var ytSelectedVideo={};

  function pauseOtherPlayers(exceptId){
    Object.keys(ytPlayers).forEach(function(id){
      if(String(id)===String(exceptId)) return;
      var p=ytPlayers[id];
      try{ if(p&&p.pauseVideo) p.pauseVideo(); }catch(e){}
    });
  }

  function pausePlayer(itemId){
    var p=ytPlayers[itemId];
    try{ if(p&&p.pauseVideo) p.pauseVideo(); }catch(e){}
  }

  function empty(item,msg){return '<div class="drcgf-resource-empty"><strong>'+esc(msg||'Chưa có dữ liệu')+'</strong><span>Đưa file vào <span class="drcgf-resource-path">/tai-lieu/'+esc(item.slug)+'/</span></span></div>';}

  function loadYouTubeApi(){
    if(window.YT&&window.YT.Player) return Promise.resolve(window.YT);
    if(ytPromise) return ytPromise;
    ytPromise=new Promise(function(resolve){
      var prev=window.onYouTubeIframeAPIReady;
      window.onYouTubeIframeAPIReady=function(){if(typeof prev==='function')prev();resolve(window.YT);};
      var s=document.createElement('script');s.src='https://www.youtube.com/iframe_api';s.async=true;document.head.appendChild(s);
    });
    return ytPromise;
  }

  function youtube(item){
    if(!item.playlistId) return empty(item,'Chưa gắn playlist YouTube');
    var playerId='yt-player-'+item.id;
    var gridId='yt-grid-'+item.id;
    setTimeout(function(){initPlaylist(item,playerId,gridId);},0);
    return '<div class="drcgf-youtube-section">'+
      '<div class="drcgf-youtube-frame"><div id="'+playerId+'"></div></div>'+
      '<div class="drcgf-video-grid-head"><h3>Danh sách video</h3><span id="'+gridId+'-count">Đang tải playlist…</span></div>'+
      '<div class="drcgf-video-grid" id="'+gridId+'"><div class="drcgf-video-loading">Đang lấy toàn bộ video từ YouTube…</div></div>'+
    '</div>';
  }

  function initPlaylist(item,playerId,gridId){
    loadYouTubeApi().then(function(){
      var grid=document.getElementById(gridId); if(!grid) return;
      var player=new YT.Player(playerId,{
        width:'100%',height:'100%',
        playerVars:{listType:'playlist',list:item.playlistId,rel:0,playsinline:1,hl:'vi',cc_lang_pref:'vi',cc_load_policy:0},
        events:{
          onReady:function(e){
            ytPlayers[item.id]=e.target;
            try{ if(e.target.setPlaybackQuality) e.target.setPlaybackQuality('hd1080'); }catch(err){}
            var tries=0;
            (function read(){
              var ids=e.target.getPlaylist&&e.target.getPlaylist();
              if(ids&&ids.length){
                ytSelectedVideo[item.id]=ids[0];
                renderVideoGrid(item,e.target,ids,gridId);
                // Sau khi đã lấy được danh sách playlist, chuyển player sang video độc lập.
                // Nhờ vậy video kết thúc sẽ không tự chạy sang item kế tiếp của playlist.
                try{ if(e.target.cueVideoById) e.target.cueVideoById(ids[0]); }catch(err){}
                return;
              }
              tries++;
              if(tries<24){setTimeout(read,250);return;}
              grid.innerHTML='<div class="drcgf-video-loading">Không đọc được danh sách video. <a target="_blank" rel="noopener" href="https://www.youtube.com/playlist?list='+encodeURIComponent(item.playlistId)+'">Mở playlist trên YouTube</a></div>';
            })();
          },
          onStateChange:function(e){
            if(e.data===YT.PlayerState.ENDED){
              var current=ytSelectedVideo[item.id];
              // Không cho YouTube tự advance sang video khác.
              // Cue lại đúng video vừa xem để giữ nguyên khung kết thúc.
              try{ if(current&&e.target.cueVideoById) e.target.cueVideoById(current); else if(e.target.stopVideo) e.target.stopVideo(); }catch(err){}
            }
          }
        }
      });
    }).catch(function(){
      var grid=document.getElementById(gridId);if(grid)grid.innerHTML='<div class="drcgf-video-loading">Không tải được YouTube Player API.</div>';
    });
  }

  function renderVideoGrid(item,player,ids,gridId){
    var grid=document.getElementById(gridId), count=document.getElementById(gridId+'-count'); if(!grid)return;
    count.textContent=ids.length+' video';
    grid.innerHTML=ids.map(function(id,i){return '<button class="drcgf-video-card'+(i===0?' is-active':'')+'" type="button" data-video-id="'+esc(id)+'" data-index="'+i+'">'+
      '<span class="drcgf-video-thumb"><img loading="lazy" src="https://i.ytimg.com/vi/'+esc(id)+'/hqdefault.jpg" alt="Video '+(i+1)+'"><span class="drcgf-video-play">▶</span></span>'+
      '<span class="drcgf-video-card-title" data-title-for="'+esc(id)+'">Video '+String(i+1).padStart(2,'0')+'</span>'+
    '</button>';}).join('');

    grid.addEventListener('click',function(ev){
      var card=ev.target.closest('.drcgf-video-card');if(!card)return;
      var index=Number(card.getAttribute('data-index'));
      grid.querySelectorAll('.drcgf-video-card').forEach(function(x){x.classList.remove('is-active');});card.classList.add('is-active');
      pauseOtherPlayers(item.id);
      var videoId=card.getAttribute('data-video-id');
      ytSelectedVideo[item.id]=videoId;
      // Phát video độc lập thay vì playVideoAt(index) trong playlist,
      // để khi xem hết không tự chuyển sang video kế tiếp.
      if(player.loadVideoById)player.loadVideoById(videoId);
      var frame=card.closest('.drcgf-youtube-section').querySelector('.drcgf-youtube-frame');if(frame)frame.scrollIntoView({behavior:'smooth',block:'nearest'});
    });

    // Tên video được lấy từ YouTube oEmbed. Nếu trình duyệt chặn yêu cầu, nhãn Video 01, 02... vẫn giữ nguyên.
    ids.forEach(function(id){
      var url='https://www.youtube.com/oembed?format=json&url='+encodeURIComponent('https://www.youtube.com/watch?v='+id);
      fetch(url).then(function(r){if(!r.ok)throw 0;return r.json();}).then(function(meta){
        var el=grid.querySelector('[data-title-for="'+id+'"]');if(el&&meta&&meta.title)el.textContent=meta.title;
      }).catch(function(){});
    });
  }


  // v15: khóa scroll trang nền khi mở viewer, giữ nguyên chính xác vị trí hiện tại.
  var drcgfScrollLock={count:0,y:0,bodyCssText:'',htmlCssText:''};
  function lockPageScroll(){
    drcgfScrollLock.count++;
    if(drcgfScrollLock.count>1)return;
    var body=document.body,html=document.documentElement;
    drcgfScrollLock.y=window.pageYOffset||html.scrollTop||body.scrollTop||0;
    drcgfScrollLock.bodyCssText=body.style.cssText||'';
    drcgfScrollLock.htmlCssText=html.style.cssText||'';
    var scrollbar=Math.max(0,window.innerWidth-html.clientWidth);
    html.style.overflow='hidden';
    html.style.height='100%';
    html.style.overscrollBehavior='none';
    body.style.position='fixed';
    body.style.top=(-drcgfScrollLock.y)+'px';
    body.style.left='0';
    body.style.right='0';
    body.style.width='100%';
    body.style.overflow='hidden';
    body.style.overscrollBehavior='none';
    if(scrollbar)body.style.paddingRight=scrollbar+'px';
    body.classList.add('drcgf-viewer-scroll-locked');
  }
  function unlockPageScroll(){
    if(drcgfScrollLock.count<=0)return;
    drcgfScrollLock.count--;
    if(drcgfScrollLock.count>0)return;
    var body=document.body,html=document.documentElement,y=drcgfScrollLock.y;
    body.classList.remove('drcgf-viewer-scroll-locked');
    body.style.cssText=drcgfScrollLock.bodyCssText;
    html.style.cssText=drcgfScrollLock.htmlCssText;
    window.scrollTo(0,y);
  }

  var lightboxState={items:[],index:0};
  function ensureLightbox(){
    var lb=document.getElementById('drcgf-image-lightbox');
    if(lb)return lb;
    lb=document.createElement('div');
    lb.id='drcgf-image-lightbox';
    lb.className='drcgf-image-lightbox';
    lb.setAttribute('aria-hidden','true');
    lb.innerHTML='<span class="drcgf-lightbox-close drcgf-round-close" role="button" tabindex="0" aria-label="Đóng">×</span><button class="drcgf-lightbox-prev" type="button" aria-label="Ảnh trước">‹</button><div class="drcgf-lightbox-stage"><img alt=""><div class="drcgf-lightbox-caption"></div></div><button class="drcgf-lightbox-next" type="button" aria-label="Ảnh tiếp theo">›</button><div class="drcgf-lightbox-counter"></div>';
    document.body.appendChild(lb);
    var imageClose=lb.querySelector('.drcgf-lightbox-close');imageClose.onclick=closeLightbox;imageClose.addEventListener('keydown',function(e){if(e.key==='Enter'||e.key===' '){e.preventDefault();closeLightbox();}});
    lb.querySelector('.drcgf-lightbox-prev').onclick=function(e){e.stopPropagation();moveLightbox(-1);};
    lb.querySelector('.drcgf-lightbox-next').onclick=function(e){e.stopPropagation();moveLightbox(1);};
    lb.addEventListener('click',function(e){if(e.target===lb)closeLightbox();});
    var startX=null;
    lb.addEventListener('touchstart',function(e){startX=e.touches&&e.touches[0]?e.touches[0].clientX:null;},{passive:true});
    lb.addEventListener('touchend',function(e){if(startX===null)return;var end=e.changedTouches&&e.changedTouches[0]?e.changedTouches[0].clientX:startX;var dx=end-startX;startX=null;if(Math.abs(dx)>45)moveLightbox(dx>0?-1:1);},{passive:true});
    lb.addEventListener('wheel',function(e){e.preventDefault();},{passive:false});
    return lb;
  }
  function showLightbox(){
    var lb=ensureLightbox(),x=lightboxState.items[lightboxState.index];if(!x)return;
    var img=lb.querySelector('.drcgf-lightbox-stage img');img.src=x.url;img.alt=x.name||'';
    lb.querySelector('.drcgf-lightbox-caption').textContent=x.name||'';
    lb.querySelector('.drcgf-lightbox-counter').textContent=(lightboxState.index+1)+' / '+lightboxState.items.length;
    var many=lightboxState.items.length>1;
    lb.querySelector('.drcgf-lightbox-prev').style.display=many?'flex':'none';
    lb.querySelector('.drcgf-lightbox-next').style.display=many?'flex':'none';
  }
  function openLightbox(items,index){lightboxState.items=items||[];lightboxState.index=index||0;var lb=ensureLightbox();showLightbox();lockPageScroll();lb.classList.add('is-open');lb.setAttribute('aria-hidden','false');document.body.classList.add('drcgf-lightbox-open');}
  function closeLightbox(){var lb=document.getElementById('drcgf-image-lightbox');if(!lb||!lb.classList.contains('is-open'))return;lb.classList.remove('is-open');lb.setAttribute('aria-hidden','true');document.body.classList.remove('drcgf-lightbox-open');unlockPageScroll();}
  function moveLightbox(step){var n=lightboxState.items.length;if(!n)return;lightboxState.index=(lightboxState.index+step+n)%n;showLightbox();}

  document.addEventListener('keydown',function(e){
    var pv=document.getElementById('drcgf-pdf-viewer');
    if(pv&&pv.classList.contains('is-open')){if(e.key==='Escape')closePdfViewer();return;}
    var lb=document.getElementById('drcgf-image-lightbox');if(!lb||!lb.classList.contains('is-open'))return;
    if(e.key==='Escape')closeLightbox();else if(e.key==='ArrowLeft')moveLightbox(-1);else if(e.key==='ArrowRight')moveLightbox(1);
  });

  function images(item){
    var a=item.images||[]; if(!a.length)return empty(item,'Chưa có hình ảnh trong thư mục img');
    var normalized=a.map(function(x){var u=typeof x==='string'?x:x.url;var n=decodeURIComponent((typeof x==='string'?x:(x.title||x.url)).split('/').pop());return {url:u,name:n};});
    setTimeout(function(){
      var holder=document.querySelector('.drcgf-resource-item[data-id="'+item.id+'"] .drcgf-image-grid');if(!holder)return;
      holder.addEventListener('click',function(e){var card=e.target.closest('.drcgf-image-card');if(!card)return;e.preventDefault();openLightbox(normalized,Number(card.getAttribute('data-index'))||0);});
    },0);
    return '<div class="drcgf-image-grid">'+normalized.map(function(x,i){return '<a class="drcgf-image-card" href="'+esc(x.url)+'" data-index="'+i+'"><span class="drcgf-image-media"><img loading="lazy" src="'+esc(x.url)+'" alt="'+esc(x.name)+'"></span><span class="drcgf-image-caption">'+esc(x.name)+'</span></a>';}).join('')+'</div>';
  }
  var pdfViewerState={url:'',name:'',kind:'pdf'};
  function ensurePdfViewer(){
    var pv=document.getElementById('drcgf-pdf-viewer');
    if(pv)return pv;
    pv=document.createElement('div');
    pv.id='drcgf-pdf-viewer';
    pv.className='drcgf-pdf-viewer';
    pv.setAttribute('aria-hidden','true');
    pv.innerHTML='<div class="drcgf-pdf-toolbar"><div class="drcgf-pdf-title"></div><div class="drcgf-pdf-actions"><button class="drcgf-pdf-fullscreen" type="button" aria-label="Toàn màn hình" title="Toàn màn hình">⛶</button><a class="drcgf-pdf-open-new" target="_blank" rel="noopener">Mở tab mới</a><span class="drcgf-pdf-close drcgf-round-close" role="button" tabindex="0" aria-label="Đóng tài liệu">×</span></div></div><div class="drcgf-pdf-stage"><iframe title="Trình xem tài liệu" allowfullscreen></iframe><div class="drcgf-office-local-note" hidden><strong>Không thể xem PPTX khi chạy localhost.</strong><span>Microsoft Office Web Viewer chỉ đọc được file từ một địa chỉ HTTPS công khai. Khi website được deploy lên Cloudflare, PPTX sẽ mở ngay tại đây.</span></div></div>';
    document.body.appendChild(pv);
    var pdfClose=pv.querySelector('.drcgf-pdf-close');pdfClose.onclick=closePdfViewer;pdfClose.addEventListener('keydown',function(e){if(e.key==='Enter'||e.key===' '){e.preventDefault();closePdfViewer();}});
    pv.querySelector('.drcgf-pdf-fullscreen').onclick=togglePdfFullscreen;
    pv.addEventListener('click',function(e){if(e.target===pv)closePdfViewer();});
    return pv;
  }
  function openPdfViewer(url,name){
    pdfViewerState.url=url;pdfViewerState.name=name||'Tài liệu PDF';pdfViewerState.kind='pdf';
    var pv=ensurePdfViewer();
    var absolute=new URL(url,window.location.href).href;
    var frame=pv.querySelector('iframe'), note=pv.querySelector('.drcgf-office-local-note');
    pv.classList.remove('is-office-viewer');
    if(note)note.hidden=true;
    if(frame){frame.style.display='block';frame.title='Trình xem PDF';}
    pv.querySelector('.drcgf-pdf-title').textContent=pdfViewerState.name;
    pv.querySelector('.drcgf-pdf-open-new').href=absolute;
    var cleanPdfUrl=absolute.split('#')[0];if(frame)frame.src=cleanPdfUrl+'#page=1&view=Fit';
    lockPageScroll();pv.classList.add('is-open');pv.setAttribute('aria-hidden','false');document.body.classList.add('drcgf-pdf-open');
  }

  function openOfficeViewer(url,name){
    pdfViewerState.url=url;pdfViewerState.name=name||'Tài liệu PowerPoint';pdfViewerState.kind='office';
    var pv=ensurePdfViewer();
    var absolute=new URL(url,window.location.href).href;
    var frame=pv.querySelector('iframe'), note=pv.querySelector('.drcgf-office-local-note');
    var local=/^(localhost|127\.0\.0\.1)$/i.test(window.location.hostname)||window.location.protocol==='file:';
    pv.classList.add('is-office-viewer');
    pv.querySelector('.drcgf-pdf-title').textContent=pdfViewerState.name;
    pv.querySelector('.drcgf-pdf-open-new').href=absolute;
    if(local){
      if(frame){frame.src='about:blank';frame.style.display='none';}
      if(note)note.hidden=false;
    }else{
      if(note)note.hidden=true;
      if(frame){
        frame.style.display='block';
        frame.title='Trình xem PowerPoint';
        frame.src='https://view.officeapps.live.com/op/embed.aspx?src='+encodeURIComponent(absolute);
      }
    }
    lockPageScroll();pv.classList.add('is-open');pv.setAttribute('aria-hidden','false');document.body.classList.add('drcgf-pdf-open');
  }

  function togglePdfFullscreen(){
    var pv=document.getElementById('drcgf-pdf-viewer');if(!pv)return;
    if(!document.fullscreenElement){
      var req=pv.requestFullscreen||pv.webkitRequestFullscreen||pv.msRequestFullscreen;
      if(req){try{req.call(pv);}catch(e){}}
    }else{
      var exit=document.exitFullscreen||document.webkitExitFullscreen||document.msExitFullscreen;
      if(exit){try{exit.call(document);}catch(e){}}
    }
  }
  function syncPdfFullscreenButton(){
    var pv=document.getElementById('drcgf-pdf-viewer');if(!pv)return;
    var btn=pv.querySelector('.drcgf-pdf-fullscreen');if(!btn)return;
    var active=!!document.fullscreenElement;
    btn.textContent=active?'⛶':'⛶';
    btn.setAttribute('aria-label',active?'Thoát toàn màn hình':'Toàn màn hình');
    btn.title=active?'Thoát toàn màn hình':'Toàn màn hình';
    pv.classList.toggle('is-native-fullscreen',active);
  }
  document.addEventListener('fullscreenchange',syncPdfFullscreenButton);
  document.addEventListener('webkitfullscreenchange',syncPdfFullscreenButton);

  function closePdfViewer(){
    var pv=document.getElementById('drcgf-pdf-viewer');if(!pv||!pv.classList.contains('is-open'))return;
    if(document.fullscreenElement===pv){var exit=document.exitFullscreen||document.webkitExitFullscreen||document.msExitFullscreen;if(exit){try{exit.call(document);}catch(e){}}}
    pv.classList.remove('is-open');pv.setAttribute('aria-hidden','true');document.body.classList.remove('drcgf-pdf-open');
    var frame=pv.querySelector('iframe');if(frame)frame.src='about:blank';
    unlockPageScroll();
  }

  function files(item){
    var a=item.files||[]; if(!a.length)return empty(item,'Chưa có tài liệu trong thư mục files');
    return '<div class="drcgf-file-grid">'+a.map(function(x){
      var u=typeof x==='string'?x:x.url;
      var n=decodeURIComponent((typeof x==='string'?x:(x.title||x.url)).split('/').pop());
      var ext=fileExt(n),office=/^(PPT|PPTX|DOC|DOCX|XLS|XLSX)$/i.test(ext),pdf=/^PDF$/i.test(ext);
      var meta=pdf?'Xem PDF trực tiếp':(office?'Xem trực tiếp trên website':'Mở tài liệu');
      return '<a class="drcgf-file-card" href="'+esc(u)+'" target="_blank" rel="noopener" data-file-url="'+esc(u)+'" data-file-name="'+esc(n)+'" data-office="'+(office?'1':'0')+'" data-pdf="'+(pdf?'1':'0')+'"><span class="drcgf-file-icon">'+esc(ext)+'</span><span class="drcgf-file-info"><span class="drcgf-file-name">'+esc(n)+'</span><span class="drcgf-file-meta">'+meta+'</span></span></a>';
    }).join('')+'</div>';
  }
  function slides(item){var a=(item.images||[]).concat(item.files||[]).filter(function(x){var u=typeof x==='string'?x:x.url;return /\.(png|jpe?g|webp|gif)$/i.test(u)});if(!a.length)return files(item);var idx=0;var id='slide-'+item.id;setTimeout(function(){var box=document.getElementById(id);if(!box)return;var img=box.querySelector('img'),count=box.querySelector('.drcgf-slide-counter');function show(){var x=a[idx],u=typeof x==='string'?x:x.url;img.src=u;count.textContent=(idx+1)+' / '+a.length;}box.querySelector('[data-prev]').onclick=function(){idx=(idx-1+a.length)%a.length;show()};box.querySelector('[data-next]').onclick=function(){idx=(idx+1)%a.length;show()};show();},0);return '<div id="'+id+'"><div class="drcgf-slide-stage"><img alt="Slide '+esc(item.title)+'"></div><div class="drcgf-slide-nav"><button type="button" data-prev>‹ Trước</button><span class="drcgf-slide-counter"></span><button type="button" data-next>Sau ›</button></div></div>';}
  function linkDirectory(){
    var links=[
      ['Link Shopee','https://www.shopee.vn/dr.cgf'],
      ['Facebook Dr.CGF Vietnam','https://www.facebook.com/Dr.CGFVietnam'],
      ['Link TikTok','https://www.tiktok.com/@dr.cgf_vn'],
      ['Kênh Youtube','https://www.youtube.com/@tapdoanthuanhoa'],
      ['Website drcgf.vn','https://www.drcgf.vn'],
      ['Website miracollvietnam.info','https://www.miracollvietnam.info'],
      ['Link eclafinvietnam.info','https://www.eclafinvietnam.info'],
      ['Website Hàn Quốc','https://www.cgfcosmetic.com'],
      ['Website drcgfvietnam.info','https://www.drcgfvietnam.info'],
      ['Slide Thuần Hoa Group','https://canva.link/8tnhtufh09fvama'],
	  ['Drive Tài liệu DR.CGF','https://drive.google.com/drive/folders/1d77CBAx-GQMNbT-kwehb06nGUYZn5FwJ?usp=drive_link']
    ];
    return '<div class="drcgf-links-box"><div class="drcgf-links-heading">DANH SÁCH LIÊN KẾT</div><div class="drcgf-links-table-wrap"><table class="drcgf-links-table"><thead><tr><th>STT</th><th>Tên liên kết</th><th>Đường dẫn</th><th>Truy cập</th></tr></thead><tbody>'+links.map(function(x,i){return '<tr><td>'+(i+1)+'</td><td><strong>'+esc(x[0])+'</strong></td><td><a href="'+esc(x[1])+'" target="_blank" rel="noopener">'+esc(x[1])+'</a></td><td><a class="drcgf-link-open" href="'+esc(x[1])+'" target="_blank" rel="noopener">MỞ WEBSITE</a></td></tr>';}).join('')+'</tbody></table></div></div>';
  }
  function content(item){if(item.slug==='link-tong-hop')return linkDirectory();if(item.type==='video')return youtube(item);if(item.type==='image')return images(item);if(item.type==='slide')return slides(item);return files(item);}
  function render(q){q=(q||'').trim().toLowerCase();var filtered=data.filter(function(x){return !q||x.title.toLowerCase().indexOf(q)>-1;});document.getElementById('resource-count').textContent=filtered.length+' mục tài liệu';if(!filtered.length){listEl.innerHTML='<div class="drcgf-resource-no-results">Không tìm thấy mục tài liệu phù hợp.</div>';return;}listEl.innerHTML=filtered.map(function(item){return '<article class="drcgf-resource-item" data-id="'+item.id+'"><button class="drcgf-resource-button" type="button" aria-expanded="false"><span class="drcgf-resource-number">'+String(item.id).padStart(2,'0')+'</span><span><span class="drcgf-resource-title">'+esc(item.title)+'</span><span class="drcgf-resource-type">'+esc(typeLabel[item.type]||'Tài liệu')+'</span></span><span class="drcgf-resource-chevron" aria-hidden="true"><i class="icon-angle-down"></i></span></button><div class="drcgf-resource-content"></div></article>';}).join('');}
  listEl.addEventListener('click',function(e){
    var b=e.target.closest('.drcgf-resource-button');if(!b)return;
    var itemEl=b.closest('.drcgf-resource-item'),id=Number(itemEl.getAttribute('data-id')),item=data.find(function(x){return x.id===id});
    var wasOpen=itemEl.classList.contains('is-open');
    // Ghi lại vị trí nút vừa bấm trước khi folder khác co lại.
    // Sau khi DOM đổi chiều cao, bù scroll để folder này đứng nguyên tại vị trí cũ trên màn hình.
    var clickedViewportTop=b.getBoundingClientRect().top;

    // Chỉ cho phép mở một folder tại một thời điểm. Khi đóng folder video thì dừng video ngay.
    listEl.querySelectorAll('.drcgf-resource-item.is-open').forEach(function(other){
      if(other===itemEl)return;
      other.classList.remove('is-open');
      var otherButton=other.querySelector('.drcgf-resource-button');
      if(otherButton)otherButton.setAttribute('aria-expanded','false');
      var otherId=Number(other.getAttribute('data-id'));
      var otherItem=data.find(function(x){return x.id===otherId});
      if(otherItem&&otherItem.type==='video')pausePlayer(otherItem.id);
    });

    if(wasOpen){
      itemEl.classList.remove('is-open');
      b.setAttribute('aria-expanded','false');
      if(item&&item.type==='video')pausePlayer(item.id);
      return;
    }

    itemEl.classList.add('is-open');
    b.setAttribute('aria-expanded','true');
    if(item&&item.type==='video')pauseOtherPlayers(item.id);
    var c=itemEl.querySelector('.drcgf-resource-content');
    if(!c.dataset.loaded){c.innerHTML=content(item);c.dataset.loaded='1';}

    requestAnimationFrame(function(){
      var newTop=b.getBoundingClientRect().top;
      var delta=newTop-clickedViewportTop;
      if(Math.abs(delta)>1){window.scrollBy(0,delta);}
    });
  });
  listEl.addEventListener('click',function(e){
    var pdfLink=e.target.closest('.drcgf-file-card[data-pdf="1"]');
    if(pdfLink){
      var pdfRaw=pdfLink.getAttribute('data-file-url');
      if(pdfRaw){e.preventDefault();openPdfViewer(pdfRaw,pdfLink.getAttribute('data-file-name')||'Tài liệu PDF');}
      return;
    }
    var link=e.target.closest('.drcgf-file-card[data-office="1"]');if(!link)return;
    var raw=link.getAttribute('data-file-url');if(!raw)return;
    e.preventDefault();
    openOfficeViewer(raw,link.getAttribute('data-file-name')||'Tài liệu PowerPoint');
  });

  var search=document.getElementById('resource-search'); if(search)search.addEventListener('input',function(){render(this.value)});

  function applyManifest(manifest){
    var resources=manifest&&manifest.resources?manifest.resources:{};
    data.forEach(function(item){
      var r=resources[item.slug];
      item.images=r&&Array.isArray(r.images)?r.images:[];
      item.files=r&&Array.isArray(r.files)?r.files:[];
    });
  }

  // Không dùng danh sách ảnh hard-code. Mỗi deploy Cloudflare đọc manifest được sinh từ folder thật.
  fetch('../assets/data/tai-lieu-files.json?v=20260819-01',{cache:'no-store'})
    .then(function(r){if(!r.ok)throw new Error('manifest');return r.json();})
    .then(function(manifest){applyManifest(manifest);render(search?search.value:'');})
    .catch(function(){
      // Vẫn render menu/video nếu manifest chưa được build; gallery sẽ báo chưa có ảnh.
      applyManifest(null);render(search?search.value:'');
    });
})();
