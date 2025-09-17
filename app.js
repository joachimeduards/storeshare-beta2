if(document.readyState==='loading'){document.addEventListener('DOMContentLoaded',()=>ss_injectNav());}else{ss_injectNav();}
// === Common helpers ===
function qs(sel,root=document){ return root.querySelector(sel) }
function fmtPrice(n){ return (n||0) + ' kr/mån' }
function getListings(){
  try{ if(typeof window.loadListings==='function'){ const a=window.loadListings(); if(Array.isArray(a)&&a.length) return a; } }catch{}
  try{ if(typeof window.seedListings==='function'){ const a=window.seedListings(); if(Array.isArray(a)&&a.length) return a; } }catch{}
  return [
    {id:'1',title:'Uppvärmt förråd med avfuktare',description:'Torrt och säkert',size:6,price:750,photos:['./assets/garage1.avif'],location:{address:'Göteborg',lat:57.709,lng:11.974}},
    {id:'2',title:'Källarförråd i villa',description:'Svalt & tryggt',size:4,price:300,photos:['./assets/garage2.webp'],location:{address:'Stockholm',lat:59.329,lng:18.068}},
  ];
}

// === Place header logo (non-overlay) ===

function ss_bindMaskObservers(header, logo){
  try{
    const wrap = logo.querySelector('.logo-icon') || logo;
    const img  = wrap.querySelector('img');
    const ensure = ()=> ss_updateHeaderMask(header, logo);
      ss_bindMaskObservers(header, logo);
    // Early and repeated updates
    requestAnimationFrame(ensure);
    for (let i=1;i<=8;i++) setTimeout(ensure, i*75);
    // On image decode/load
    if (img){
      if (img.decode) { img.decode().then(ensure).catch(()=>{}); }
      img.addEventListener('load', ensure, { once:false });
    }
    // React to size changes
    if (window.ResizeObserver){
      const ro = new ResizeObserver(()=>ensure());
      ro.observe(wrap);
    }
  }catch(e){ console.warn(e); }
}

function ss_placeHeaderLogo(){ /* corner-logo removed */ }
}
    logo.classList.add('site-logo');
    const header = document.createElement('header'); header.className='site-header';
    document.body.insertBefore(header, document.body.firstChild);
    header.appendChild(logo);
    /* set logo background to match banner + update cutout */
    try{
      const wrap = logo.querySelector('.logo-icon');
      const bg = getComputedStyle(header).backgroundColor;
      if (wrap && bg) wrap.style.backgroundColor = bg || 'transparent';
      ss_updateHeaderMask(header, logo);
      ss_bindMaskObservers(header, logo);
      window.addEventListener('resize', ()=>ss_updateHeaderMask(header, logo));
      setTimeout(()=>ss_updateHeaderMask(header, logo), 300);
      ss_setupHeaderFade(header, logo);
    }catch(e){}
  }catch(e){ console.warn(e); }
}



function ss_setupHeaderFade(header, logo){
  try{
    const max = Math.max(80, Math.min(160, header?.offsetHeight || 120)); // fade range
    const onScroll = ()=>{
      const y = window.scrollY || document.documentElement.scrollTop || 0;
      const a = Math.max(0, Math.min(1, 1 - (y / max)));
      header.style.setProperty('--banner-alpha', String(a));
      if (a < 0.96) header.classList.add('scrolled'); else header.classList.remove('scrolled');
    };
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', onScroll);
    setTimeout(onScroll, 300);
  }catch(e){ console.warn(e); }
}

function ss_updateHeaderMask(header, logo){
  try{
    if(!header || !logo) return;
    const wrap = logo.querySelector('.logo-icon') || logo;
    const hb = getComputedStyle(header).backgroundColor;
    if(hb) header.style.setProperty('--header-bg', hb);
    const r = Math.round(Math.max(wrap.offsetWidth, wrap.offsetHeight)/2);
    const hr = header.getBoundingClientRect();
    const wr = wrap.getBoundingClientRect();
    header.style.setProperty('--logo-r', r + 'px');
    header.style.setProperty('--logo-x', (wr.left - hr.left) + 'px');
    header.style.setProperty('--logo-y', (wr.top - hr.top) + 'px');
  }catch(e){ console.warn(e); }
}

// === Setup spacer so bottom nav never covers content ===
function ss_setupNavSpacer(nav){
  try{
    const apply=()=>{
      const h=(nav?.getBoundingClientRect().height||72)+24;
      document.body.style.paddingBottom = h + 'px';
      document.documentElement.style.setProperty('--nav-spacer', h + 'px');
      let sp=document.querySelector('.nav-spacer'); if(!sp){ sp=document.createElement('div'); sp.className='nav-spacer'; document.body.appendChild(sp); }
      sp.style.height=h+'px';
    };
    apply(); window.addEventListener('resize',apply); setTimeout(apply,300);
  }catch(e){ console.warn(e); }
}

// === Floating bottom nav ===
function ss_homeIcon(){ 
  return `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
    <path d="M3 11.5L12 4l9 7.5" />
    <path d="M5 10.5V20a1 1 0 0 0 1 1h4v-6h4v6h4a1 1 0 0 0 1-1v-9.5" />
  </svg>`; 
}
function ss_injectNav(){
  const nav=document.createElement('nav'); nav.className='bottom-nav';
  const file=(location.pathname.split('/').pop()||'index.html').toLowerCase();
  function a(href,label,iconHtml){ const el=document.createElement('a'); el.href=href; el.innerHTML=`<span class="nav-ico" aria-hidden="true">${iconHtml}</span><span>${label}</span>`; if((href==='index.html'&&file==='index.html')||file===href.toLowerCase()) el.classList.add('active'); return el; }
  nav.append(a('index.html','Start','🧭'), a('search.html','Sök','🔎'), a('create.html','Hyr ut','🏠'), a('profile.html','Profil','👤'));
  document.body.appendChild(nav); document.body.classList.add('main-pad'); ss_setupNavSpacer(nav);
}

// === SEARCH page ===
function mountSearch(){
  const cards=qs('#cards'); const count=qs('#count'); const mapEl=qs('#map'); if(!cards||!count||!mapEl||typeof L==='undefined') return;
  const data=getListings();
  const map=L.map(mapEl).setView([57.66,12.05], 11);
  L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',{maxZoom:19}).addTo(map);
  let markers=[]; const clear=()=>{markers.forEach(m=>m.remove()); markers=[]};
  function add(list){ list.forEach(s=>{ if(!s.location||typeof s.location.lat!=='number') return; const m=L.marker([s.location.lat,s.location.lng]).addTo(map);
    const img=(s.photos&&s.photos[0])?`<img src="${s.photos[0]}" style="width:100%;height:90px;object-fit:cover;border-radius:10px;margin-bottom:6px">`:'';
    m.bindPopup(`${img}<div style="display:flex;justify-content:space-between;gap:8px"><div><div style="font-weight:800">${s.title}</div><div style="font-size:12px;color:#666">${s.location?.address||''} • ${s.size||'?'} m²</div></div><a href="./listing.html?id=${encodeURIComponent(s.id)}" style="font-size:12px;color:#0a58ca;text-decoration:underline">Detaljer</a></div>`); markers.push(m); }); }
  const qEl=qs('#q'); const minSize=qs('#minSize'); const maxPrice=qs('#maxPrice');
  function matches(s,t){ if(!t) return true; const q=t.toLowerCase(); return (s.title||'').toLowerCase().includes(q)||(s.description||'').toLowerCase().includes(q)||(s.location?.address||'').toLowerCase().includes(q); }
  function card(s){ const img=(s.photos&&s.photos[0])||'./assets/garage1.avif'; return `<a class="card" href="./listing.html?id=${encodeURIComponent(s.id)}"><div class="thumb" style="height:190px;overflow:hidden;border-bottom:1px solid #0001"><img src="${img}" style="width:100%;height:100%;object-fit:cover"></div><div class="card-body"><div class="row" style="justify-content:space-between"><div><div class="card-title">${s.title}</div><div class="muted">${s.location?.address||''} • ${s.size||'?'} m²</div></div><div class="price">${fmtPrice(s.price||0)}</div></div></div></a>`;}
  function render(list){ cards.innerHTML=list.map(card).join(''); count.textContent=String(list.length); clear(); add(list); }
  function apply(){ const list=data.filter(s=>matches(s,qEl?.value.trim()||'')&&(s.size||0)>=((+minSize?.value)||0)&&(s.price||0)<=((+maxPrice?.value)||Infinity)); render(list); }
  [qEl,minSize,maxPrice].forEach(el=>el&&el.addEventListener('input',apply)); apply();
}

// === LISTING page: request + rating after renting ===
function mountListing(){
  const params=new URLSearchParams(location.search); const id=params.get('id'); if(!id) return;
  const container=document.getElementById('detailActions')||document.body;
  let btn=container.querySelector('.btn.request'); if(!btn){ btn=document.createElement('button'); btn.className='btn request'; btn.textContent='Begär att hyra'; container.appendChild(btn); }
  const rk='ss:rentals'; let rentals=[]; try{rentals=JSON.parse(localStorage.getItem(rk)||'[]')}catch{rentals=[]}
  const addRental=()=>{ if(!rentals.some(r=>r.storeId===id&&r.who==='me')){ rentals.push({storeId:id,who:'me',status:'aktiv'}); localStorage.setItem(rk, JSON.stringify(rentals)); } };
  btn.addEventListener('click',()=>{ addRental(); alert('Din förfrågan är skickad! (demo)'); renderRating(); });
  function renderRating(){
    const rented=rentals.some(r=>r.storeId===id&&r.who==='me'); let box=document.getElementById('rateHostBox'); if(!rented){ if(box) box.remove(); return; }
    if(!box){ box=document.createElement('div'); box.id='rateHostBox'; box.className='profile-panel'; box.style.marginTop='12px'; container.appendChild(box); }
    const key='ss:starsGiven'; let given={}; try{given=JSON.parse(localStorage.getItem(key)||'{}')}catch{given={}}
    const current=given[id]||0; box.innerHTML=`<h3 style="margin:0 0 8px 0">Betygsätt värden</h3><div class="stars" id="rateStars">${[1,2,3,4,5].map(i=>`<span data-v="${i}" class="star ${i<=current?'filled':''}">★</span>`).join('')}</div><div class="muted" style="margin-top:6px">Ditt betyg sparas lokalt.</div>`;
    document.querySelectorAll('#rateStars .star').forEach(el=>{ el.addEventListener('click',()=>{ const v=Number(el.dataset.v)||5; given[id]=v; localStorage.setItem(key, JSON.stringify(given)); renderRating(); }); });
  }
  renderRating();
}

// === PROFILE page: show my received stars only ===
function starRow(name,stars){ const max=5; let h=`<div class="row" style="justify-content:space-between;align-items:center"><strong>${name}</strong><div class="stars">`; for(let i=1;i<=max;i++){h+=`<span class="star ${i<=stars?'filled':''}">★</span>`} h+='</div></div>'; return h; }
function mountProfile(){
  const root=document.getElementById('profileRoot'); if(!root) return;
  const recvKey='ss:starsReceived:me'; let recv={}; try{ recv=JSON.parse(localStorage.getItem(recvKey)||'{}') }catch{ recv={} } if(Object.keys(recv).length===0){ recv={'Anna':4}; localStorage.setItem(recvKey, JSON.stringify(recv)); }
  const data=getListings(); const renting=data.slice(0,1); const letting=data.slice(1,2);
  function card(s){ const img=(s.photos&&s.photos[0])||'./assets/garage1.avif'; return `<div class="card"><div class="row" style="gap:12px; padding:10px"><img src="${img}" style="width:90px;height:64px;object-fit:cover;border-radius:10px;border:1px solid #0001"><div class="col"><div class="card-title" style="margin:0">${s.title}</div><div class="muted">${s.location?.address||''} • ${s.size||'?'} m²</div></div><a class="btn secondary" href="./listing.html?id=${encodeURIComponent(s.id)}">Visa</a></div></div>`; }
  const vals=Object.values(recv).map(v=>+v||0); const avg=vals.length?(vals.reduce((a,b)=>a+b,0)/vals.length):0; const rounded=Math.round(avg);
  root.innerHTML=`
    <div class="profile-card">
      <div class="profile-panel">
        <h1 style="margin-top:0">Din profil</h1>
        <div class="profile-ok"><span style="font-size:20px">✅</span> <span>Bra jobbat, din profil ser strålande ut!</span></div>
        <div class="grid" style="grid-template-columns:1fr 1fr; gap:10px; margin-top:6px">
          <div><div class="muted">Namn</div><div class="card-title" style="margin-top:4px">Du (demo)</div></div>
          <div><div class="muted">Plats</div><div style="margin-top:4px">Göteborg</div></div>
          <div><div class="muted">Om mig</div><div style="margin-top:4px">Hyresvärd & hyrestagare – gillar ordning och säker förvaring.</div></div>
          <div><div class="muted">Intressen</div><div style="margin-top:4px">Cykling, renovering, second hand</div></div>
        </div>
        <div class="profile-panel" style="margin-top:12px">
          <h3 style="margin:0 0 8px 0">Mina stjärnor</h3>
          <div class="row" style="align-items:center; gap:10px">
            <div class="stars">${[1,2,3,4,5].map(i=>`<span class="star ${i<=rounded?'filled':''}">★</span>`).join('')}</div>
            <div class="muted">${avg.toFixed(1)} / 5 (${vals.length} omdömen)</div>
          </div>
          <div class="grid" style="grid-template-columns:repeat(auto-fit,minmax(180px,1fr)); gap:8px; margin-top:8px">
            ${Object.entries(recv).map(([n,v])=>`<div class="card"><div class="card-body">${starRow(n,v)}</div></div>`).join('')}
          </div>
        </div>
      </div>
      <div class="profile-panel" style="text-align:center">
        <img class="profile-avatar" src="./assets/user-sample.svg" alt="Profil" />
        <div style="margin-top:8px"><a class="btn secondary" href="#" onclick="alert('Byta bild (demo)');return false;">Byt bild</a></div>
      </div>
    </div>
    <div class="profile-grid" style="margin-top:16px">
      <div class="profile-panel"><h3 style="margin-top:0">Du hyr</h3><div id="profileRenting" class="grid" style="grid-template-columns:1fr; gap:10px"></div></div>
      <div class="profile-panel"><h3 style="margin-top:0">Du hyr ut</h3><div id="profileLetting" class="grid" style="grid-template-columns:1fr; gap:10px"></div></div>
    </div>
  `;
  document.getElementById('profileRenting').innerHTML = renting.map(card).join('') || '<div class="muted">Inga aktiva hyror.</div>';
  document.getElementById('profileLetting').innerHTML = letting.map(card).join('') || '<div class="muted">Inget uthyrt just nu.</div>';
}

// === Boot ===
function ss_boot(){
  try{

  ss_placeHeaderLogo();
  ss_injectNav();
  const f=(location.pathname.split('/').pop()||'index.html').toLowerCase();
  if(f==='search.html') mountSearch();
  if(f==='listing.html') mountListing();
  if(f==='profile.html') mountProfile();

  }catch(e){ console.warn(e); }
}
if (document.readyState === 'loading') { document.addEventListener('DOMContentLoaded', ss_boot); } else { ss_boot(); }
