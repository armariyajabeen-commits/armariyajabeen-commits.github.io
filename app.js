/* Maria Jabeen — Archive of Evidence: interactions */
(() => {
const $ = (s, r = document) => r.querySelector(s);
const $$ = (s, r = document) => [...r.querySelectorAll(s)];
const finePointer = matchMedia('(pointer:fine)').matches;
const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
let z = 10;

/* ---------- plate data ---------- */
const PLATES = [
  { id:'p01', no:'P01', cat:['flood'], place:'Pakistan · 2022', title:'Where the 2022 flood met the settled ground',
    img:'img/p01-board.jpg', thumb:'img/p01-board-sm.jpg',
    q:'Where did the mapped 2022 flood extent coincide with buildings, modelled population and roads in the Larkana–Shikarpur–Jacobabad corridor (13,092 km²)?',
    data:'Sentinel-1 flood extent (TU Wien, 14 dates, Aug–Sep 2022) · Microsoft building footprints · WorldPop 2020 · OSM roads · Copernicus GLO-30',
    find:[['7,884 km²','detected flood — 67.7% of observable ground'],['74,564','mapped buildings intersect detected flood (a floor)'],['1,703 km','of 6,884 km of roads intersect detected flood'],['90.2%','of modelled population in 1 km cells ≥10% flooded'],['39%','of buildings sit only on ground the satellite never observed']],
    limit:'Limit — coincidence with mapped extent only; unobserved ground is reported as its own class, never as dry.' },
  { id:'p02', no:'P02', cat:['urban'], place:'Athens · Greece', title:'Thermal Athens',
    img:'img/p02-board.jpg', thumb:'img/p02-board-sm.jpg',
    q:'How does summer land-surface temperature relate to built intensity, vegetation and population across Attica?',
    data:'Satellite land-surface temperature (summer median) · built intensity · vegetation · population',
    find:[['7','sequential analytical states, from base city to the hottest areas'],['A / B','close-up comparison of two neighbourhoods']],
    limit:'Limit — land-surface temperature, not air temperature.' },
  { id:'p03', no:'P03', cat:['urban','flood'], place:'Dhaka · Bangladesh', title:'Dhaka — the city leans north',
    img:'img/p03-board.jpg', thumb:'img/p03-board-sm.jpg',
    q:'How has rapid urban expansion (2000–2020) met land that is wet, low-lying or both? 70 × 70 km window.',
    data:'GHS-BUILT-S R2023A (2000–2020, 100 m) · JRC Global Surface Water 1984–2021 · SRTM 1″',
    find:[['+125 km²','built footprint, 244 → 369 km² (+51%)'],['64%','of the gain lies north and north-west of the centre'],['11%','of new footprint on constrained land, vs 24% of the window']],
    limit:'Limit — overlap only, no causality; results are threshold-sensitive.' },
  { id:'p04', no:'P04', cat:['terrain'], place:'Hunza–Gojal · Valais', title:'Terrain, Settled',
    img:'img/p04-board.jpg', thumb:'img/p04-board-sm.jpg',
    q:'How does terrain constrain settlement and infrastructure in a mountain valley? Two identical 36 × 36 km windows at one scale.',
    data:'Copernicus GLO-30 DEM · OpenStreetMap buildings, roads, rivers, glaciers, peaks (Sep 2026)',
    find:[['52% / 29%','of land steeper than 35° — Hunza / Valais'],['75% / 56%','of buildings on slopes under 15°'],['21% / 50%','of buildings near river elevation'],['960 / 2,430 m','valley-floor width at the sections']],
    limit:'Limit — associations only; OSM completeness differs by country.' },
  { id:'p05', no:'P05', cat:['urban','access'], place:'Chicago · LA · Philadelphia', title:'Cheap rent, far from work?',
    img:'img/p05-board.jpg', thumb:'img/p05-board-sm.jpg',
    q:'Where is housing affordability spatially disconnected from access to employment, and how does the pattern differ across three cities?',
    data:'ACS 5-year 2018–2022 · LEHD LODES8 2021 · TIGER/Line 2022',
    find:[['ρ −0.28','rent burden × job access in Chicago (LA −0.15, Philadelphia −0.13)'],['14.5–17.2%','of residents in high-burden, low-access tracts']],
    limit:'Limit — straight-line proximity, not travel time; descriptive only.' },
  { id:'p06', no:'P06', cat:['access'], place:'Barcelona · Lahore', title:'Walking to Care',
    img:'img/p06-board.jpg', thumb:'img/p06-board-sm.jpg',
    q:'How does street-network access to hospitals and clinics differ between a European and a Pakistani city, and who lies beyond a 15/30-minute walk?',
    data:'OpenStreetMap (Geofabrik) streets & facilities · WorldPop 2020 · NetworkX multi-source Dijkstra',
    find:[['86% / 57%','within a 15-minute walk — Barcelona / Lahore'],['96% / 91%','within 30 minutes'],['561 / 1,048 m','median network distance to the nearest facility'],['108k / 455k','residents beyond 30 minutes']],
    limit:'Limit — OSM facility completeness differs; modelled walking, no capacity or transit.' },
  { id:'p07', no:'P07', cat:['urban'], place:'Venice · Italy', title:'Venice, Layer by Layer',
    img:'img/venice-board.jpg', thumb:'img/venice-board-sm.jpg',
    q:'Water, movement, infrastructure and the historic core, drawn as an exploded axonometric of stacked layers.',
    data:'Landmarks · buildings · bridges · roads · paths · green space · water',
    find:[['7','layers stacked to show how the city is assembled']],
    limit:'An architectural way of reading a city: the stack makes relationships visible at a glance.' },
  { id:'p08', no:'P08', cat:['terrain'], place:'Mississippi · USA', title:'Mississippi in relief',
    img:'img/relief-ms.jpg', thumb:'img/relief-ms-sm.jpg',
    q:'A shaded-relief study of Mississippi: the flat Delta floodplain in the west set against the dissected uplands and branching river valleys to the east.',
    data:'Digital elevation model · hillshade rendering',
    find:[['West / East','a smooth alluvial Delta beside an intricately eroded upland'],['Drainage','river networks read directly from the terrain']],
    limit:'A cartographic study: shading emphasises landform rather than exact heights.' }
];

/* ---------- generic drag ---------- */
function draggable(el, { onTap } = {}) {
  let sx, sy, ox, oy, moved = false, id = null;
  el.addEventListener('pointerdown', e => {
    if (e.button !== 0) return;
    id = e.pointerId; moved = false;
    sx = e.clientX; sy = e.clientY;
    ox = parseFloat(el.style.getPropertyValue('--dx')) || 0;
    oy = parseFloat(el.style.getPropertyValue('--dy')) || 0;
    el.style.zIndex = ++z;
    el.setPointerCapture(id);
  });
  el.addEventListener('pointermove', e => {
    if (e.pointerId !== id) return;
    const dx = e.clientX - sx, dy = e.clientY - sy;
    if (!moved && Math.hypot(dx, dy) > 5) { moved = true; el.classList.add('dragging'); }
    if (moved) { el.style.setProperty('--dx', ox + dx + 'px'); el.style.setProperty('--dy', oy + dy + 'px'); }
  });
  const end = e => {
    if (e.pointerId !== id) return;
    id = null; el.classList.remove('dragging');
    if (!moved && onTap) onTap(el, e);
  };
  el.addEventListener('pointerup', end);
  el.addEventListener('pointercancel', end);
  el.addEventListener('keydown', e => { if ((e.key === 'Enter' || e.key === ' ') && onTap) { e.preventDefault(); onTap(el, e); } });
}

function shuffle(container, sel) {
  const r = container.getBoundingClientRect();
  $$(sel, container).forEach(el => {
    el.style.setProperty('--dx', (Math.random() - .5) * r.width * .18 + 'px');
    el.style.setProperty('--dy', (Math.random() - .5) * r.height * .14 + 'px');
    el.style.setProperty(sel === '.art' ? '--r' : '--pr', (Math.random() * 16 - 8).toFixed(1) + 'deg');
    el.style.zIndex = ++z + Math.floor(Math.random() * 6);
  });
}

/* ---------- hero pile + tag ---------- */
const pile = $('#heroPile'), tag = $('#pileTag'), stage = $('.pile-stage');
function showTag(card) {
  $$('.art', pile).forEach(a => a.classList.toggle('is-active', a === card));
  $('.tag-title', tag).textContent = card.dataset.title;
  $('.tag-text', tag).textContent = card.dataset.text;
  $('.tag-year', tag).textContent = card.dataset.year;
  const btn = $('.btn-yellow', tag);
  btn.textContent = card.dataset.cta || 'Open';
  btn.href = card.dataset.link || '#';
  btn.target = /^https?:/.test(btn.href) && !card.dataset.plate ? '_blank' : '';
  btn.onclick = card.dataset.tab ? (e => { e.preventDefault(); hideTag(); const t = document.querySelector(`[data-proj=${card.dataset.tab}]`); if (t) t.click(); document.querySelector('#architecture').scrollIntoView({ behavior:'smooth' }); }) : card.dataset.plate ? (e => { e.preventDefault(); hideTag(); openViewer(PLATES.findIndex(p => p.id === card.dataset.plate)); }) : (() => hideTag());
  tag.hidden = false;
  const s = stage.getBoundingClientRect(), c = card.getBoundingClientRect();
  const tw = tag.offsetWidth, th = tag.offsetHeight;
  let left = c.right - s.left + 12, top = c.top - s.top + 10;
  if (left + tw > s.width) left = c.left - s.left - tw - 12;
  if (left < 0) left = Math.max(0, Math.min(s.width - tw, c.left - s.left + c.width / 2 - tw / 2));
  top = Math.max(0, Math.min(top, s.height - th));
  tag.style.left = left + 'px'; tag.style.top = top + 'px';
  tag.style.animation = 'none'; tag.offsetHeight; tag.style.animation = '';
}
function hideTag() { tag.hidden = true; $$('.art', pile).forEach(a => a.classList.remove('is-active')); }
$$('.art', pile).forEach((a, i) => { a.tabIndex = 0; a.setAttribute('role', 'button'); a.setAttribute('aria-label', a.dataset.title + ' — show label'); a.style.zIndex = i + 1; draggable(a, { onTap: showTag }); });
$('.tag-x', tag).addEventListener('click', hideTag);
document.addEventListener('pointerdown', e => { if (!tag.hidden && !tag.contains(e.target) && !e.target.closest('.art')) hideTag(); });
document.addEventListener('keydown', e => { if (e.key === 'Escape') hideTag(); });
$$('[data-shuffle]').forEach(b => b.addEventListener('click', () => { hideTag(); shuffle($('#' + b.dataset.shuffle), '.art'); }));


/* keep pile items inside the stage on small screens */
function fitPile() {
  const pr = pile.getBoundingClientRect();
  $$('.art', pile).forEach(a => {
    a.style.setProperty('--dx', '0px');
    const r = a.getBoundingClientRect();
    let dx = 0;
    if (r.right > pr.right - 4) dx = pr.right - 4 - r.right;
    if (r.left + dx < pr.left + 4) dx = pr.left + 4 - r.left;
    a.style.setProperty('--dx', dx + 'px');
  });
}
fitPile();
let rz; addEventListener('resize', () => { clearTimeout(rz); rz = setTimeout(() => { hideTag(); fitPile(); }, 200); });

/* intro: deal the cards in */
if (!reduced) {
  $$('.art', pile).forEach((a, i) => {
    a.style.opacity = 0; a.style.setProperty('--dy', '60px');
    setTimeout(() => { a.style.transition = 'transform .8s cubic-bezier(.2,.8,.2,1), opacity .6s'; a.style.opacity = 1; a.style.setProperty('--dy', '0px');
      setTimeout(() => a.style.transition = '', 900); }, 250 + i * 110);
  });
}

/* ---------- collections ---------- */
const platesEl = $('#plates');
platesEl.innerHTML = PLATES.map((p, i) => `
  <button class="plate" data-i="${i}" data-cat="${p.cat.join(' ')}" aria-label="Open plate ${p.no}: ${p.title}">
    <div class="plate-img"><img src="${p.thumb}" alt="" loading="lazy" draggable="false"></div>
    <div class="plate-meta"><p class="label">${p.no} · ${p.place}</p><h3>${p.title}</h3></div>
  </button>`).join('');
const plateEls = $$('.plate', platesEl);
plateEls.forEach(el => draggable(el, { onTap: el => openViewer(+el.dataset.i) }));

function layoutPile() {
  const vis = plateEls.filter(p => !p.classList.contains('is-hidden'));
  const n = vis.length, cols = innerWidth < 720 ? 2 : 4;
  vis.forEach((p, k) => {
    const c = k % cols, r = Math.floor(k / cols);
    p.style.setProperty('--px', (4 + c * (88 / cols) + (Math.random() * 6 - 3)) + '%');
    p.style.setProperty('--py', (4 + r * (innerWidth < 720 ? 24 : 38) + Math.random() * 6) + '%');
    p.style.setProperty('--pr', (Math.random() * 14 - 7).toFixed(1) + 'deg');
    p.style.setProperty('--dx', '0px'); p.style.setProperty('--dy', '0px');
  });
  platesEl.style.height = innerWidth < 720 ? (Math.ceil(n / 2) * 250 + 180) + 'px' : '';
}
function setView(v) {
  $$('.view-btn').forEach(b => b.classList.toggle('is-on', b.dataset.view === v));
  platesEl.classList.toggle('is-grid', v === 'grid');
  platesEl.classList.toggle('is-pile', v === 'pile');
  plateEls.forEach(p => { p.style.removeProperty('--dx'); p.style.removeProperty('--dy'); p.style.zIndex = ''; });
  if (v === 'pile') layoutPile(); else platesEl.style.height = '';
}
$$('.view-btn').forEach(b => b.addEventListener('click', () => setView(b.dataset.view)));
$$('[data-filter]').forEach(b => b.addEventListener('click', () => {
  $$('[data-filter]').forEach(x => x.classList.toggle('is-on', x === b));
  const f = b.dataset.filter;
  plateEls.forEach(p => p.classList.toggle('is-hidden', f !== 'all' && !p.dataset.cat.split(' ').includes(f)));
  if (platesEl.classList.contains('is-pile')) layoutPile();
}));
// grid view must not move cards when dragged
plateEls.forEach(p => p.addEventListener('pointermove', () => { if (platesEl.classList.contains('is-grid')) { p.style.removeProperty('--dx'); p.style.removeProperty('--dy'); } }));

/* ---------- viewer ---------- */
const viewer = $('#viewer'); let cur = 0;
function visibleIdx() { return plateEls.filter(p => !p.classList.contains('is-hidden')).map(p => +p.dataset.i); }
function openViewer(i) {
  if (i < 0) return;
  cur = i; const p = PLATES[i];
  $('#vCrumbs').innerHTML = `Archive <i>/</i> Collections <i>/</i> ${p.no}`;
  $('#vImg').src = p.thumb; $('#vImg').alt = p.title + ' — full board';
  const hi = new Image(); hi.onload = () => { if (cur === i) $('#vImg').src = p.img; }; hi.src = p.img;
  $('#vNo').textContent = `${p.no} · ${p.place}`;
  $('#vTitle').textContent = p.title;
  $('#vQ').textContent = p.q;
  $('#vData').textContent = p.data;
  $('#vFind').innerHTML = p.find.map(([b, t]) => `<li><b>${b}</b>${t}</li>`).join('');
  $('#vLimit').textContent = p.limit;
  $('.v-img', viewer).scrollTop = 0;
  renderGal(p);
  if (!viewer.open) viewer.showModal();
}
let GIS = null;
const gisReady = fetch('img/gis/manifest.json').then(r => r.json()).then(d => { GIS = d; }).catch(() => {});
function renderGal(p) {
  const wrap = $('#vGalWrap'); wrap.hidden = true;
  gisReady.then(() => {
    if (!GIS || cur !== PLATES.indexOf(p)) return;
    const imgs = GIS.imgs[p.id] || [], gifs = GIS.gifs[p.id] || [];
    if (!imgs.length && !gifs.length) return;
    const all = [...gifs.map(g => ({ src: g.src, cap: g.cap })), ...imgs.map(i => ({ src: i.src, cap: i.cap }))];
    $('#vGifs').innerHTML = gifs.map((g, k) => `<button type="button" data-k="${k}"><img src="${g.src}" alt="${g.cap}" loading="lazy"><span>${g.cap}</span></button>`).join('');
    $('#vGifs').previousElementSibling.hidden = !gifs.length; $('#vGifs').hidden = !gifs.length;
    $('#vThumbs').innerHTML = imgs.map((i, k) => `<button type="button" data-k="${gifs.length + k}"><img src="${i.sm}" alt="${i.cap}" loading="lazy" width="${i.w}" height="${i.h}"><span>${i.cap}</span></button>`).join('');
    $('#vThumbs').previousElementSibling.hidden = !imgs.length; $('#vThumbs').hidden = !imgs.length;
    $$('button', wrap).forEach(b => b.onclick = () => lbOpen(all, +b.dataset.k));
    wrap.hidden = false;
  });
}
function step(d) { const v = visibleIdx(); const k = v.indexOf(cur); openViewer(v[(k + d + v.length) % v.length] ?? cur); }
$('#vClose').addEventListener('click', () => viewer.close());
$('#vPrev').addEventListener('click', () => step(-1));
$('#vNext').addEventListener('click', () => step(1));
viewer.addEventListener('click', e => { if (e.target === viewer) viewer.close(); });
viewer.addEventListener('keydown', e => { if (e.key === 'ArrowRight') step(1); if (e.key === 'ArrowLeft') step(-1); });

/* ---------- timeline drawer: drag to scroll ---------- */
const drawer = $('#drawer');
let dDown = false, dX = 0, dS = 0;
drawer.addEventListener('pointerdown', e => { if (e.pointerType !== 'mouse') return; dDown = true; dX = e.clientX; dS = drawer.scrollLeft; drawer.classList.add('grabbing'); });
addEventListener('pointermove', e => { if (dDown) drawer.scrollLeft = dS - (e.clientX - dX); });
addEventListener('pointerup', () => { dDown = false; drawer.classList.remove('grabbing'); });
drawer.addEventListener('wheel', e => { if (Math.abs(e.deltaY) > Math.abs(e.deltaX) && drawer.scrollWidth > drawer.clientWidth) {
  const atEnd = drawer.scrollLeft + drawer.clientWidth >= drawer.scrollWidth - 2, atStart = drawer.scrollLeft <= 0;
  if ((e.deltaY > 0 && !atEnd) || (e.deltaY < 0 && !atStart)) { e.preventDefault(); drawer.scrollLeft += e.deltaY; } } }, { passive:false });

/* ---------- tilt cards ---------- */
if (finePointer && !reduced) $$('.tilt').forEach(el => {
  el.addEventListener('pointermove', e => { const r = el.getBoundingClientRect(); const x = (e.clientX - r.left) / r.width - .5, y = (e.clientY - r.top) / r.height - .5;
    el.style.transform = `rotateY(${x * 8}deg) rotateX(${-y * 8}deg) translateZ(0)`; });
  el.addEventListener('pointerleave', () => el.style.transform = '');
});

/* ---------- reveal on scroll ---------- */
const io = new IntersectionObserver(es => es.forEach(e => { if (e.isIntersecting) { e.target.classList.add('in'); io.unobserve(e.target); } }), { threshold:.12 });
$$('.reveal').forEach(el => io.observe(el));

/* ---------- cursor dot ---------- */
if (finePointer && !reduced) {
  const dot = $('.cursor-dot'); let tx = -100, ty = -100, x = -100, y = -100;
  addEventListener('pointermove', e => { tx = e.clientX + 16; ty = e.clientY + 16; dot.classList.add('on');
    dot.classList.toggle('big', !!e.target.closest('a, button, .art, .plate, .inst')); });
  document.addEventListener('pointerleave', () => dot.classList.remove('on'));
  (function loop() { x += (tx - x) * .2; y += (ty - y) * .2; dot.style.transform = `translate(${x}px, ${y}px)`; requestAnimationFrame(loop); })();
}

/* ================= ARCHITECTURE ================= */
/* lightbox for drawings */
const lb = $('#lb'); let lbList = [], lbI = 0;
function lbShow(i) { lbI = (i + lbList.length) % lbList.length; const it = lbList[lbI];
  $('#lbImg').src = it.src; $('#lbImg').alt = it.cap || ''; $('#lbCap').textContent = it.cap || '';
  $('#lbPrev').hidden = $('#lbNext').hidden = lbList.length < 2; $('.lb-img', lb).scrollTop = 0; if (!lb.open) lb.showModal(); }
function lbOpen(list, i) { lbList = list; lbShow(i); }
$('#lbClose').addEventListener('click', () => lb.close());
$('#lbPrev').addEventListener('click', () => lbShow(lbI - 1));
$('#lbNext').addEventListener('click', () => lbShow(lbI + 1));
lb.addEventListener('click', e => { if (e.target === lb) lb.close(); });
lb.addEventListener('keydown', e => { if (e.key === 'ArrowRight') lbShow(lbI + 1); if (e.key === 'ArrowLeft') lbShow(lbI - 1); });

/* undercooked wall + conferences */
$$('#ucWall').forEach(g => { const bs = $$('button', g); const L = bs.map(b => ({ src:b.dataset.full, cap:b.dataset.cap }));
  bs.forEach((b, i) => b.addEventListener('click', () => lbOpen(L, i))); });
$$('.conf-img').forEach(b => b.addEventListener('click', () => lbOpen([{ src:b.dataset.full, cap:b.dataset.cap }], 0)));
/* crux image */
$$('.crux button').forEach(b => b.addEventListener('click', () => lbOpen([{ src:b.dataset.full, cap:b.dataset.cap }], 0)));

/* sketchbook wall */
(() => {
  const wall = $('#skWall'); if (!wall) return;
  let items = [], f = 'all';
  const label = { section:'Exhibit section', ink:'Ink study', plan:'Plan / concept' };
  const draw = () => {
    const list = items.filter(i => f === 'all' || i.cat === f);
    $('#skCount').textContent = list.length + ' drawings';
    wall.innerHTML = list.map((i, k) => `<button type="button" class="sk" data-k="${k}"><img src="img/sketch/${i.id}-sm.jpg" alt="${i.t}" width="${i.w}" height="${i.h}" loading="lazy"><span>${i.t}</span></button>`).join('');
    const L = list.map(i => ({ src:`img/sketch/${i.id}.jpg`, cap:`${i.t} · ${label[i.cat]}` }));
    $$('.sk', wall).forEach(b => b.addEventListener('click', () => lbOpen(L, +b.dataset.k)));
  };
  $$('[data-skf]').forEach(b => b.addEventListener('click', () => { f = b.dataset.skf; $$('[data-skf]').forEach(x => x.classList.toggle('is-on', x === b)); draw(); }));
  fetch('img/sketch/manifest.json').then(r => r.json()).then(d => { items = d; draw(); }).catch(() => { wall.textContent = 'Sketches could not be loaded.'; });
})();

$$('[data-gallery]').forEach(g => { const btns = $$('button', g); const list = btns.map(b => ({ src:b.dataset.full, cap:b.dataset.cap }));
  btns.forEach((b, i) => b.addEventListener('click', () => lbOpen(list, i))); });

/* project tabs */
const tabs = $$('.folder-tabs [role=tab]');
tabs.forEach(t => t.addEventListener('click', () => {
  tabs.forEach(x => x.setAttribute('aria-selected', x === t));
  $$('.proj').forEach(p => { const on = p.id === 'proj-' + t.dataset.proj; p.hidden = !on; p.classList.toggle('is-on', on); });
  stopPlay();
}));

/* image swap with fade + preload */
function swap(img, src) { if (img.getAttribute('src') === src) return; img.classList.add('fade');
  const n = new Image(); n.onload = () => { img.src = src; requestAnimationFrame(() => img.classList.remove('fade')); }; n.src = src; }

/* build the shelter */
const STEPS = ['Foundation formation','Platform formation','Zoning division','Framework structure','Opening framework','Brick wall formation','Mud & clay plaster coating','Roof structure formation','Roofing formation','Kitchen & veranda','Outdoor area division','Cattle shade shelter','Exterior wall formation','Complete shelter unit'];
const stepImg = $('#stepImg'), range = $('#stepRange'), list = $('#stepList');
list.innerHTML = STEPS.map((s, i) => `<li><button data-s="${i + 1}"><span>${String(i + 1).padStart(2, '0')}</span>${s}</button></li>`).join('');
function setStep(n) { n = Math.max(1, Math.min(14, n)); range.value = n;
  swap(stepImg, `img/arch/step-${String(n).padStart(2, '0')}.jpg`); stepImg.alt = 'Shelter construction step ' + n + ': ' + STEPS[n - 1];
  $('#stepNo').textContent = String(n).padStart(2, '0'); $('#stepTitle').textContent = STEPS[n - 1];
  $$('button', list).forEach((b, i) => { b.classList.toggle('done', i + 1 < n); b.classList.toggle('cur', i + 1 === n); }); }
range.addEventListener('input', () => { stopPlay(); setStep(+range.value); });
$('#stepPrev').addEventListener('click', () => { stopPlay(); setStep(+range.value - 1); });
$('#stepNext').addEventListener('click', () => { stopPlay(); setStep(+range.value + 1); });
$$('button', list).forEach(b => b.addEventListener('click', () => { stopPlay(); setStep(+b.dataset.s); }));
let playT = null; const playBtn = $('#stepPlay');
function stopPlay() { if (playT) { clearInterval(playT); playT = null; playBtn.textContent = '▶ Play sequence'; } }
playBtn.addEventListener('click', () => { if (playT) return stopPlay(); if (+range.value >= 14) setStep(1);
  playBtn.textContent = '❚❚ Pause'; playT = setInterval(() => { if (+range.value >= 14) return stopPlay(); setStep(+range.value + 1); }, 1400); });
stepImg.parentElement.addEventListener('click', () => lbOpen(STEPS.map((s, i) => ({ src:`img/arch/step-${String(i + 1).padStart(2, '0')}.jpg`, cap:`Step ${i + 1} — ${s}` })), +range.value - 1));
stepImg.parentElement.style.cursor = 'zoom-in';
setStep(1);
for (let i = 2; i <= 14; i++) { const p = new Image(); p.src = `img/arch/step-${String(i).padStart(2, '0')}.jpg`; }

/* clusters */
const cImg = $('#clusterImg');
$$('#clusterBtns button').forEach(b => b.addEventListener('click', () => {
  $$('#clusterBtns button').forEach(x => x.classList.toggle('is-on', x === b));
  swap(cImg, `img/arch/cluster-${b.dataset.c}.jpg`); cImg.alt = b.textContent + ' cluster typology'; }));

/* magnifier lens */
function lens(stage) {
  const img = $('img', stage), l = $('.lens', stage), Z = 3;
  stage.addEventListener('pointermove', e => { if (e.pointerType !== 'mouse') return;
    const r = img.getBoundingClientRect(), x = e.clientX - r.left, y = e.clientY - r.top;
    l.style.backgroundImage = `url("${img.currentSrc || img.src}")`;
    l.style.backgroundSize = `${r.width * Z}px ${r.height * Z}px`;
    l.style.backgroundPosition = `${-(x * Z - 95)}px ${-(y * Z - 95)}px`;
    l.style.left = (x - 95) + 'px'; l.style.top = (y - 95) + 'px'; });
  stage.addEventListener('click', () => lbOpen([{ src:img.currentSrc || img.src, cap:img.alt }], 0));
}
$$('[data-lens]').forEach(lens);
const gdMain = $('#gdMain');
$$('#gdThumbs button').forEach(b => b.addEventListener('click', () => {
  $$('#gdThumbs button').forEach(x => x.classList.toggle('is-on', x === b));
  swap(gdMain, b.dataset.src); gdMain.alt = 'Gentle Density — ' + $('span', b).textContent; }));

/* page-flip books */
$$('[data-book]').forEach(bk => {
  const key = bk.dataset.book, n = +bk.dataset.pages; let p = 1;
  bk.innerHTML = `<div class="book-stage"><img src="img/arch/${key}-1.jpg" alt="Page 1"></div>
    <div class="book-ctrl"><button class="chip bk-prev">← Previous page</button><span class="book-count"><b>1</b> / ${n}</span><button class="chip bk-next">Next page →</button>
    <div class="book-dots">${Array.from({ length:n }, (_, i) => `<button aria-label="Page ${i + 1}" style="background-image:url(img/arch/${key}-${i + 1}-sm.jpg)"></button>`).join('')}</div></div>`;
  const stage = $('.book-stage', bk), dots = $$('.book-dots button', bk);
  function go(t) { t = Math.max(1, Math.min(n, t)); if (t === p) return; const dir = t > p ? 'turn-next' : 'turn-prev'; p = t;
    const im = document.createElement('img'); im.src = `img/arch/${key}-${p}.jpg`; im.alt = 'Page ' + p; im.className = dir;
    stage.appendChild(im); im.addEventListener('animationend', () => { $$('img', stage).forEach(x => { if (x !== im) x.remove(); }); im.className = ''; });
    $('.book-count b', bk).textContent = p; dots.forEach((d, i) => d.classList.toggle('is-on', i + 1 === p)); }
  dots[0].classList.add('is-on');
  $('.bk-prev', bk).addEventListener('click', () => go(p - 1));
  $('.bk-next', bk).addEventListener('click', () => go(p + 1));
  dots.forEach((d, i) => d.addEventListener('click', () => go(i + 1)));
  stage.addEventListener('click', () => lbOpen(Array.from({ length:n }, (_, i) => ({ src:`img/arch/${key}-${i + 1}.jpg`, cap:`Page ${i + 1} of ${n}` })), p - 1));
  let sx = null; stage.addEventListener('touchstart', e => sx = e.touches[0].clientX, { passive:true });
  stage.addEventListener('touchend', e => { if (sx === null) return; const d = e.changedTouches[0].clientX - sx; if (Math.abs(d) > 40) go(p + (d < 0 ? 1 : -1)); sx = null; });
  for (let i = 2; i <= n; i++) { const pre = new Image(); pre.src = `img/arch/${key}-${i}.jpg`; }
});

/* compare slider */
$$('[data-compare]').forEach(c => {
  const h = $('.compare-handle', c); let on = false;
  const set = v => { v = Math.max(0, Math.min(100, v)); c.style.setProperty('--pos', v + '%'); h.setAttribute('aria-valuenow', Math.round(v)); };
  const fromX = x => { const r = c.getBoundingClientRect(); set((x - r.left) / r.width * 100); };
  c.addEventListener('pointerdown', e => { on = true; c.setPointerCapture(e.pointerId); fromX(e.clientX); });
  c.addEventListener('pointermove', e => { if (on) fromX(e.clientX); });
  c.addEventListener('pointerup', () => on = false); c.addEventListener('pointercancel', () => on = false);
  h.addEventListener('keydown', e => { const v = parseFloat(c.style.getPropertyValue('--pos')) || 50;
    if (e.key === 'ArrowLeft') set(v - 5); if (e.key === 'ArrowRight') set(v + 5); });
  if (!reduced) { let t = 0; const intro = setInterval(() => { t += .06; set(50 + Math.sin(t) * 22); if (t > Math.PI * 2) { clearInterval(intro); set(50); } }, 30);
    c.addEventListener('pointerdown', () => clearInterval(intro), { once:true }); }
});

/* ================= presentations ================= */
const DECKS = {
  tp:{ title:'Understanding prototype structures for transitional shelter for rural flooding',
       sub:'M.Arch thesis presentation, NUST 2024: introduction, literature, methodology, data findings and design principles for Rajanpur.',
       n:46, pdf:'docs/Maria-Jabeen-Thesis-Presentation.pdf',
       ch:[[1,'Cover'],[3,'Introduction'],[7,'Literature review'],[13,'Methodology'],[19,'Data findings'],[24,'A vital need'],[30,'Universal design'],[36,'Community-centred'],[43,'Way forward']] },
  iv:{ title:'Transitional housing for adaptive flood recovery',
       sub:'Research talk: household preferences, institutional feedback and patterns in transitional housing, as a comparative North–South study of Punjab, Pakistan and Holmestrand, Norway.',
       n:5, pdf:'docs/Maria-Jabeen-Research-Talk-Transitional-Housing.pdf',
       ch:[[1,'Research aim'],[2,'Theoretical frameworks'],[3,'Methodological choices'],[4,'Analytical process']] }
};
let dk = 'tp', ds = 1;
const dImg = $('#deckImg'), dStage = $('#deckStage'), dThumbs = $('#deckThumbs'), dCh = $('#deckChapters');
const pad = n => String(n).padStart(2, '0');
function deckLoad(k) {
  dk = k; const d = DECKS[k];
  $$('[data-deck]').forEach(b => b.classList.toggle('is-on', b.dataset.deck === k));
  $('#deckTitle').textContent = d.title; $('#deckSub').textContent = d.sub;
  $('#deckPdf').href = d.pdf; $('#deckTotal').textContent = d.n;
  dCh.innerHTML = d.ch.map(([s, t], i) => `<button class="chip" data-s="${s}"><span>${pad(i + 1)}</span>${t}</button>`).join('');
  $$('button', dCh).forEach(b => b.addEventListener('click', () => deckGo(+b.dataset.s)));
  dThumbs.innerHTML = Array.from({ length:d.n }, (_, i) => `<button data-s="${i + 1}" aria-label="Slide ${i + 1}"><img src="img/deck/${k}-${pad(i + 1)}-t.jpg" alt="" loading="lazy"><span>${i + 1}</span></button>`).join('');
  $$('button', dThumbs).forEach(b => b.addEventListener('click', () => deckGo(+b.dataset.s)));
  ds = 0; deckGo(1);
}
function deckGo(s) {
  const d = DECKS[dk]; s = Math.max(1, Math.min(d.n, s)); if (s === ds) return; ds = s;
  swap(dImg, `img/deck/${dk}-${pad(s)}.jpg`); dImg.alt = `${d.title}, slide ${s} of ${d.n}`;
  $('#deckNo').textContent = s;
  let cur = 0; d.ch.forEach(([c], i) => { if (s >= c) cur = i; });
  $$('button', dCh).forEach((b, i) => b.classList.toggle('is-on', i === cur));
  $$('button', dThumbs).forEach((b, i) => b.classList.toggle('is-on', i + 1 === s));
  const t = $$('button', dThumbs)[s - 1]; if (t) dThumbs.scrollTo({ left:t.offsetLeft - dThumbs.clientWidth / 2 + t.clientWidth / 2, behavior:reduced ? 'auto' : 'smooth' });
  const nx = new Image(); nx.src = `img/deck/${dk}-${pad(Math.min(d.n, s + 1))}.jpg`;
}
$$('[data-deck]').forEach(b => b.addEventListener('click', () => deckLoad(b.dataset.deck)));
$('#deckPrev').addEventListener('click', e => { e.stopPropagation(); deckGo(ds - 1); });
$('#deckNext').addEventListener('click', e => { e.stopPropagation(); deckGo(ds + 1); });
dStage.addEventListener('keydown', e => { if (e.key === 'ArrowRight') { e.preventDefault(); deckGo(ds + 1); } if (e.key === 'ArrowLeft') { e.preventDefault(); deckGo(ds - 1); } });
$('#deckFs').addEventListener('click', e => { e.stopPropagation();
  if (document.fullscreenElement) document.exitFullscreen(); else if (dStage.requestFullscreen) dStage.requestFullscreen().then(() => dStage.focus()).catch(() => {}); });
let dsx = null; dStage.addEventListener('touchstart', e => dsx = e.touches[0].clientX, { passive:true });
dStage.addEventListener('touchend', e => { if (dsx === null) return; const dx = e.changedTouches[0].clientX - dsx; if (Math.abs(dx) > 40) deckGo(ds + (dx < 0 ? 1 : -1)); dsx = null; });
deckLoad('tp');

/* ================= shelter phasing ================= */
const PHASES = [
  [0, 1, '<b>Four phases, one shelter.</b> The diagram follows a household from an emergency unit to a home inside a community. Select a phase to read it.'],
  [.10, .45, '<b>1 · Emergency.</b> A prefabricated tent or room and a toilet are placed on the family plot, meeting the basic need first.'],
  [.45, .73, '<b>2 · Temporary.</b> With size flexibility and participatory layouts, families self-build: rooms, toilets and kitchens are added in many arrangements.'],
  [.73, .86, '<b>3 · Transitional.</b> Using vernacular materials, the shelter becomes a full home that answers privacy, sanitation and kitchen needs.'],
  [.86, .99, '<b>4 · Community.</b> Homes join into shared compounds and streets, grouped around community needs.']
];
const band = $('#phaseBand'), ptext = $('#phaseText');
function setPhase(i) {
  $$('#phaseBtns button').forEach(b => b.classList.toggle('is-on', +b.dataset.ph === i));
  const [t, bt, txt] = PHASES[i];
  band.style.top = t * 100 + '%'; band.style.height = (bt - t) * 100 + '%';
  band.classList.toggle('on', i > 0); ptext.innerHTML = txt;
}
$$('#phaseBtns button').forEach(b => b.addEventListener('click', () => setPhase(+b.dataset.ph)));
$('#phaseStage').addEventListener('click', e => { const r = e.currentTarget.getBoundingClientRect(), y = (e.clientY - r.top) / r.height;
  const i = PHASES.findIndex((p, k) => k > 0 && y >= p[0] && y < p[1]); setPhase(i > 0 ? i : 0); });
$('#phaseStage').style.cursor = 'pointer';
setPhase(0);

/* ================= credential seals ================= */
$$('.cseal').forEach(s => s.addEventListener('click', () => { if (!matchMedia('(hover:hover)').matches) s.classList.toggle('flip'); }));
})();
