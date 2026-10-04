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
    limit:'An architectural way of reading a city: the stack makes relationships visible at a glance.' }
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
  btn.onclick = card.dataset.plate ? (e => { e.preventDefault(); hideTag(); openViewer(PLATES.findIndex(p => p.id === card.dataset.plate)); }) : (() => hideTag());
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
  if (!viewer.open) viewer.showModal();
}
function step(d) { const v = visibleIdx(); const k = v.indexOf(cur); openViewer(v[(k + d + v.length) % v.length] ?? cur); }
$('#vClose').addEventListener('click', () => viewer.close());
$('#vPrev').addEventListener('click', () => step(-1));
$('#vNext').addEventListener('click', () => step(1));
viewer.addEventListener('click', e => { if (e.target === viewer) viewer.close(); });
viewer.addEventListener('keydown', e => { if (e.key === 'ArrowRight') step(1); if (e.key === 'ArrowLeft') step(-1); });

/* ---------- HHI classifier ---------- */
const HHI = [
  { claim:'NDMA reports record flood-damaged housing in Sindh in 2022.', label:'Directly supported', color:'#2f8a4f',
    why:'The figure appears as an observed value in the NDMA/PDMA provincial reports held in the evidence store.' },
  { claim:'Damaged houses per 1,000 residents in Sujawal, from reported damage and census population.', label:'Reasonable derivation', color:'#2f5be6',
    why:'A deterministic calculation from two registered values (damage counts and census population) — computed by code, never by the language model.' },
  { claim:'Women in Rajanpur recovered more slowly than men after the flood.', label:'Structurally unanswerable', color:'#a07d00',
    why:'No sex-disaggregated recovery data exist in the evidence. Answering would need qualitative, participatory fieldwork.' },
  { claim:'Since relief camps were empty by October, displacement had ended.', label:'Unsupported premise', color:'#c0262a',
    why:'Conflates camp headcounts with confirmed displacement — one of the twenty named failure modes the validator screens for.' }
];
const card = $('#hhiCard');
function setStatus(i) {
  $$('.status-btns button').forEach((b, k) => b.setAttribute('aria-selected', k === i));
  const h = HHI[i];
  $('.hc-no span', card).textContent = String(412 + i * 37).padStart(4, '0');
  $('.hc-claim', card).textContent = '“' + h.claim + '”';
  const st = $('.hc-status', card); st.style.color = h.color; $('span', st).textContent = h.label;
  $('.hc-why', card).textContent = h.why;
  card.classList.remove('flip'); void card.offsetWidth; card.classList.add('flip');
}
$$('.status-btns button').forEach((b, i) => b.addEventListener('click', () => setStatus(i)));
setStatus(0);

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
})();
