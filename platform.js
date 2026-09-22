/* DEMO ONLY - Backend integration pending. Premium flags do not activate subscriptions. */
(() => {
  // One strict selector supplies both the hero and the featured cards.
  const slides=AWPresentation.premiumProjects(projects);
  let current=0,timer=null,transition=null,paused=false,hover=false,focused=false;
  const motion=matchMedia('(prefers-reduced-motion: reduce)');
  const carousel=$('#heroCarousel'),copy=$('.hero-slide-copy');
  $('#heroMedia').innerHTML=slides.map((p,i)=>`<div class="hero-scene ${p.heroImageLayout==='portrait'?'is-portrait':''}" data-hero-scene="${i}"><img src="${escapeHTML(p.image)}" alt="" width="1920" height="1280" decoding="async" ${i===0?'fetchpriority="high"':'loading="lazy"'}></div>`).join('');
  $('#heroDots').innerHTML=slides.map((p,i)=>`<button class="slide-dot" type="button" data-slide="${i}" aria-label="${escapeHTML(localized(p,'name'))}"></button>`).join('');
  // Broken remote imagery falls back to the branded background, never a broken-image icon.
  $$('#heroMedia img').forEach(img=>img.addEventListener('error',()=>{img.hidden=true;}));
  function paint(){
    const slide=slides[current];
    $('#heroPremiumBadge').hidden=!slide;$('.hero-project').hidden=!slide;$('.hero-controls').hidden=slides.length<2;
    if(!slide){$('#heroPropertyTitle').textContent=t('اختيارات مميزة قريبًا','Our next selection is on its way');$('#heroDescription').textContent=t('تُعرض العقارات المميزة هنا عند توفرها.','Premium properties will appear here when available.');$('#heroLocation').textContent='';$('#heroPriceLabel').textContent='';$('#heroSlideLink').hidden=true;$('#heroDetails').hidden=true;$('#premium').hidden=true;return;}
    $('#heroPropertyTitle').textContent=localized(slide,'name');
    $('#heroLocation').innerHTML=locationHTML(slide);
    $('#heroDescription').textContent=localized(slide,'shortDescription');
    $('#heroPriceLabel').innerHTML=`<span>${t('السعر يبدأ من','Starting from')}</span><bdi>${money(slide.startingPrice)}</bdi>`;
    $('#heroPriceLabel').hidden=slide.startingPrice==null;
    $('#heroSlideLink').dataset.projectUnits=slide.id;$('#heroDetails').dataset.project=slide.id;
    $('#heroSlideCount').textContent=`${current+1} / ${slides.length}`;
    $$('[data-slide]').forEach((b,i)=>{b.setAttribute('aria-current',String(current===i));b.setAttribute('aria-label',t('عرض ','Show ')+localized(slides[i],'name'));});
    $$('[data-hero-scene]').forEach((scene,i)=>scene.classList.toggle('is-active',current===i));
    $('#heroPause').disabled=motion.matches;$('#heroPause').textContent=motion.matches?t('الحركة مخفّضة','Motion reduced'):paused?t('تشغيل','Play'):t('إيقاف','Pause');
  }
  function schedule(){clearInterval(timer);timer=null;const stopped=paused||hover||focused||document.hidden||motion.matches;$('#heroMedia').classList.toggle('is-paused',stopped);if(!stopped&&slides.length>1)timer=setInterval(()=>go(current+1),7500);}
  function go(index){if(!slides.length)return;clearTimeout(transition);current=(index+slides.length)%slides.length;if(motion.matches){paint();copy.classList.remove('changing');return;}copy.classList.add('changing');transition=setTimeout(()=>{paint();copy.classList.remove('changing');},180);}
  $('#heroPrev').addEventListener('click',()=>{go(current-1);schedule();});$('#heroNext').addEventListener('click',()=>{go(current+1);schedule();});
  $$('[data-slide]').forEach(b=>b.addEventListener('click',()=>{go(Number(b.dataset.slide));schedule();}));
  $('#heroPause').addEventListener('click',()=>{paused=!paused;paint();schedule();});
  carousel.addEventListener('mouseenter',()=>{hover=true;schedule();});carousel.addEventListener('mouseleave',()=>{hover=false;schedule();});
  carousel.addEventListener('focusin',()=>{focused=true;schedule();});carousel.addEventListener('focusout',event=>{if(!carousel.contains(event.relatedTarget)){focused=false;schedule();}});
  document.addEventListener('visibilitychange',schedule);motion.addEventListener('change',()=>{paint();schedule();});
  function renderPremium(){
    $('#premiumGrid').innerHTML=slides.map(p=>`<article class="card premium-card" data-premium-project="${p.id}"><button class="card-media" data-project="${p.id}" aria-label="${escapeHTML(t('استكشف ','Explore ')+localized(p,'name'))}"><img src="${escapeHTML(p.image)}" alt="${escapeHTML(localized(p,'name'))}" loading="lazy" width="900" height="550"><span class="premium-card-badge">✦ Premium</span></button><div class="card-body"><span class="project-label">${label(p.type)}</span><h3 class="card-title">${localized(p,'name')}</h3>${locationHTML(p)}<div class="card-bottom"><div><span class="price-label">${p.startingPrice==null?'':t('السعر يبدأ من','Starting from')}</span><div class="price">${money(p.startingPrice)}</div></div><button class="text-link" data-project="${p.id}">${t('عرض التفاصيل','View details')} ${arrow}</button></div></div></article>`).join('');
  }
  document.addEventListener('languagechange',()=>{paint();renderPremium();renderEvents();});
  const events=[['Cityscape','سيتي سكيب','Cityscape','الرياض','Riyadh','مساحة لعرض المشاركة والتواصل مع المهتمين بالمشاريع العقارية.','A space to present project participation and connect with property audiences.'],['REAL ESTATE','معرض عقاري محلي','Local real estate exhibition','جدة','Jeddah','تجربة مقترحة لاستعراض المشاريع والتعرف على احتياجات الزوار.','A proposed experience for exploring projects and understanding visitors’ needs.'],['AMAZING WILL','لقاء أميزينغ ويل','Amazing Will gathering','جدة','Jeddah','تصوّر للقاء يجمع الملاك والمسوقين والمستثمرين.','A proposed gathering for owners, marketers and investors.']];
  function renderEvents(){$('#eventsGrid').innerHTML=events.map((e,i)=>`<article class="card event-card"><div class="event-art" role="img" aria-label="${escapeHTML(t(e[1],e[2]))}"><b>${e[0]}</b><span>AMAZING WILL · 2026</span></div><div class="card-body"><span class="project-label">2026 · ${t(e[3],e[4])}</span><h3 class="card-title">${t(e[1],e[2])}</h3><p class="card-description">${t(e[5],e[6])}</p><button class="text-link" data-event="${i}">${t('عرض التفاصيل','View details')} ${arrow}</button></div></article>`).join('');}
  document.addEventListener('click',event=>{const b=event.target.closest('[data-event]');if(!b)return;const e=events[Number(b.dataset.event)];setDetailWhatsAppContext($('#detailDialog'),null);$('#detailTitle').textContent=t(e[1],e[2]);$('#detailContent').innerHTML=`<div class="event-art"><b>${e[0]}</b><span>2026 · ${t(e[3],e[4])}</span></div><p class="detail-description">${t(e[5],e[6])}</p><p class="detail-note">${t('تصوّر للعرض؛ لا يمثل إعلان مشاركة مؤكدة أو موعد فعالية معتمدًا. تُضاف التفاصيل والصور بعد اعتمادها.','Presentation concept only, not a confirmed participation or event date. Approved details and photos will be added later.')}</p>`;openDialog($('#detailDialog'));});
  paint();schedule();renderPremium();renderEvents();
})();
