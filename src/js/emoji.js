/* emoji.js - emoji bubbles above a character's name (everyone in the PvP arena sees yours).
   Add your own pictures here: {id:'wow', name:'Wow', src:'src/emoji/wow.gif'}  (.png / .gif / .webp / https:// links all work; gifs animate).
   Put the image files in the src/emoji/ folder next to the game page. 'e' = a normal text emoji. */
var EMOJI_LIST = [
  { id: 'card', name: "Credit Card", src: 'https://cdn3.emoji.gg/emojis/761219-pepe-credit-card.gif' },
  { id: 'smoke', name: "Smoke", src: 'https://cdn3.emoji.gg/emojis/136857-pepesmoke.gif' },
  { id: 'gamercry', name: "Gamer Cry", src: 'https://cdn3.emoji.gg/emojis/411644-gamer-pepe-cry.gif' },
  { id: 'doctor', name: "Doctor", src: 'https://cdn3.emoji.gg/emojis/276883-doctor-pepe.gif' },
  { id: 'jam', name: "Jam", src: 'https://cdn3.emoji.gg/emojis/45997-pepejam.gif' },
  { id: 'pixel', name: "Pixel", src: 'https://cdn3.emoji.gg/emojis/41261-pixelpepe.gif' },
  { id: 'jam2', name: "Jam 2", src: 'https://cdn3.emoji.gg/emojis/67908-pepejam.gif' },
  { id: 'clown', name: "Clown Train", src: 'https://cdn3.emoji.gg/emojis/59958-pepeclownblobtrain.gif' },
  { id: 'money', name: "Money Rain", src: 'https://cdn3.emoji.gg/emojis/93659-pepemoneyrain.gif' },
  { id: 'daddy', name: "Daddy", src: 'https://cdn3.emoji.gg/emojis/52925-pepedaddy.gif' },
  { id: 'hug', name: "Hug", src: 'https://cdn3.emoji.gg/emojis/26924-dogehug.gif' },
  { id: 'robber', name: "Robber", src: 'https://cdn3.emoji.gg/emojis/63618-pepe-robber.gif' },
  { id: 'rock', name: "Rockstar", src: 'https://cdn3.emoji.gg/emojis/18075-pepe-rockstar.gif' },
  { id: 'lmfao', name: "LMFAO", src: 'https://cdn3.emoji.gg/emojis/32868-pepe-lmfaoooo.gif' },
  { id: 'toilet', name: "Toilet", src: 'https://cdn3.emoji.gg/emojis/96012-pepe-toilet.gif' },
  { id: 'speed', name: "Hyperspeed", src: 'https://cdn3.emoji.gg/emojis/61444-pepe-hyperspeed.gif' },
  { id: 'hehe', name: "Hehehe", src: 'https://cdn3.emoji.gg/emojis/792638-hehehe.gif' },
  { id: 'mlady', name: "M'lady", src: 'https://cdn3.emoji.gg/emojis/399137-mlady.gif' },
  { id: 'think', name: "Thinking", src: 'https://cdn3.emoji.gg/emojis/560184-think.gif' },
  { id: 'bussin', name: "Bussin", src: 'https://cdn3.emoji.gg/emojis/5613-bussin.gif' }
];
var EMOJI_SHOW = 4.5, emoActive = [], emoLastUse = 0, emoV = null;
function emoFind(id) { for (var i = 0; i < EMOJI_LIST.length; i++) if (EMOJI_LIST[i].id === id) return EMOJI_LIST[i]; return null; }
function emoNode(em) {
  var el;
  if (em.src) { el = document.createElement('img'); el.src = em.src; el.draggable = false; }
  else { el = document.createElement('span'); el.textContent = em.e || '?'; }
  return el;
}
function emoClear(owner) { for (var i = emoActive.length - 1; i >= 0; i--) if (emoActive[i].o === owner) { emoActive[i].el.remove(); emoActive.splice(i, 1); } }
function emoShow(owner, pos, hgt, id, getH) {          // owner = P or a peer; pos = its position vector
  var em = emoFind(id); if (!em) return; emoClear(owner);
  var layer = document.getElementById('emoji-layer'); if (!layer) return;
  var el = document.createElement('div'); el.className = 'emo-b'; el.appendChild(emoNode(em)); layer.appendChild(el);
  emoActive.push({ ph: Math.random() * 6, o: owner, el: el, pos: pos, h: hgt, getH: getH, t: EMOJI_SHOW });
}
var emoRay = null, emoV2 = null, emoDir = null, emoGap = 5;      // emoGap = fixed 5px between the name text and the emoji
function emoHidden(e, headPos, dist) {                  // true when a wall / building is between the camera and the character
  if (!emoRay) { emoRay = new THREE.Raycaster(); emoDir = new THREE.Vector3(); }
  emoDir.copy(headPos).sub(camera.position); var d = emoDir.length(); if (d < 0.5) return false; emoDir.divideScalar(d);
  emoRay.camera = camera; emoRay.set(camera.position, emoDir); emoRay.near = 0.3; emoRay.far = Math.max(0.3, d - 0.4);
  var hits; try { hits = emoRay.intersectObjects(worldGroup.children, true); } catch (x) { return false; }
  for (var k = 0; k < hits.length; k++) { var o = hits[k].object; if (o.isMesh && o.visible) return true; }
  return false;
}
function emoUpdate(dt) {
  if (!emoActive.length) return;
  if (!emoV) { emoV = new THREE.Vector3(); emoV2 = new THREE.Vector3(); }
  for (var i = emoActive.length - 1; i >= 0; i--) {
    var e = emoActive[i]; e.t -= dt;
    if (e.t <= 0 || (e.o !== P && ais.indexOf(e.o) < 0)) { e.el.remove(); emoActive.splice(i, 1); continue; }
    var c = e.o.c, tg = c && c.tag && c.tag.spr, W = window.innerWidth, H = window.innerHeight, py;
    if (tg && tg.matrixWorld) {                         // sit exactly above the name tag: fixed pixel gap, fixed emoji size at every zoom level
      emoV.setFromMatrixPosition(tg.matrixWorld);
      emoV2.copy(emoV); emoV2.y += 0.525; emoV.project(camera); emoV2.project(camera);
      if (emoV.z > 1) { e.el.style.display = 'none'; continue; }
      var halfH = Math.abs(emoV2.y - emoV.y) * 0.5 * H;             // half of the name tag's height in pixels
      py = (-emoV.y * 0.5 + 0.5) * H - halfH + halfH * 2 * 0.125;   // top of the name text
    } else {
      emoV.set(e.pos.x, (e.pos.y || 0) + (e.getH ? e.getH() : e.h), e.pos.z); emoV.project(camera);
      if (emoV.z > 1) { e.el.style.display = 'none'; continue; }
      py = (-emoV.y * 0.5 + 0.5) * H;
    }
    e.occT = (e.occT || 0) - dt;                         // wall check ~8x per second
    if (e.occT <= 0) { e.occT = 0.12; emoV2.set(e.pos.x, (e.pos.y || 0) + 1.8, e.pos.z); e.hid = emoHidden(e, emoV2); }
    if (e.hid || (e.o !== P && c && c.g && !c.g.visible)) { e.el.style.display = 'none'; continue; }
    var age = EMOJI_SHOW - e.t, pop = age < 0.35 ? (function (u) { var c1 = 1.70158, c3 = c1 + 1; return 1 + c3 * Math.pow(u - 1, 3) + c1 * Math.pow(u - 1, 2); })(age / 0.35) : 1;   // soft pop-in with a little overshoot
    var bob = Math.sin(age * 3.2 + (e.ph || 0)) * 2.5, rise = e.t < 0.7 ? (0.7 - e.t) / 0.7 * 10 : 0;                                                                         // gentle floating bob; drifts up while fading out
    var s = e.el.style; s.display = 'block'; s.left = ((emoV.x * 0.5 + 0.5) * W) + 'px'; s.top = (py - emoGap + bob - rise) + 'px';
    s.opacity = e.t < 0.7 ? Math.max(0, e.t / 0.7) : Math.min(1, age / 0.15); s.transform = 'translate(-50%,-100%) scale(' + Math.max(0.01, pop) + ')'; s.transformOrigin = '50% 100%';
  }
}
function emoSend(id) {                                  // my emoji: show it over my head and tell the arena (rides inside cw._em, so no server change)
  var now = performance.now(); if (now - emoLastUse < 1200) return; emoLastUse = now;
  emoShow(P, P.pos, 3.9, id, function () { return P.mounted ? 4.9 : 3.9; });
  P.emoNow = id + ':' + (Math.floor(now) % 100000); var mine = P.emoNow;
  setTimeout(function () { if (P.emoNow === mine) P.emoNow = ''; }, (EMOJI_SHOW + 0.8) * 1000);
}
function emoPeer(a, cw) {                                // an emoji coming from another player
  var v = cw && cw._em || '';
  if (!v) { a.emoSeen = ''; return; }
  if (a.emoSeen === v) return; a.emoSeen = v;
  emoShow(a, a.pos, 3.9, v.split(':')[0], function () { return a.mt ? 4.9 : 3.9; });
}
(function () {
  var btn = document.getElementById('emo-btn'), menu = document.getElementById('emo-menu'); if (!btn || !menu) return;
  EMOJI_LIST.forEach(function (em) {
    var c = document.createElement('div'); c.className = 'emo-cell'; c.title = em.name; c.appendChild(emoNode(em));
    c.addEventListener('click', function () { menu.style.display = 'none'; emoSend(em.id); });
    menu.appendChild(c);
  });
  btn.addEventListener('click', function (e) { e.stopPropagation(); menu.style.display = menu.style.display === 'grid' ? 'none' : 'grid'; });
  document.addEventListener('pointerdown', function (e) { if (menu.style.display === 'grid' && !menu.contains(e.target) && e.target !== btn && !btn.contains(e.target)) menu.style.display = 'none'; }, true);
})();

/* ---------- Dance button (right of the emoji button): pick a dance, it repeats until you move, attack or use a skill ---------- */
function stopDance() { P.dance = ''; if (P.c) P.c.dance = ''; }
function startDance(id) {
  if (P.dead) return; if (P.mounted) { log('Get off your mount to dance.', '#ffcc88'); return; }
  P.dance = id; P.c.dance = id; P.dest = null; if (typeof P.target !== 'undefined') P.target = null;
}
(function () {
  var btn = document.getElementById('dance-btn'), menu = document.getElementById('dance-menu'); if (!btn || !menu) return;
  DANCES.forEach(function (d) {
    var c = document.createElement('div'); c.className = 'dn-cell'; c.innerHTML = '<span>' + d.e + '</span><b>' + d.name + '</b>';
    c.addEventListener('click', function () { menu.style.display = 'none'; startDance(d.id); });
    menu.appendChild(c);
  });
  btn.addEventListener('click', function (e) { e.stopPropagation(); var em = document.getElementById('emo-menu'); if (em) em.style.display = 'none'; menu.style.display = menu.style.display === 'grid' ? 'none' : 'grid'; });
  var eb = document.getElementById('emo-btn'); if (eb) eb.addEventListener('click', function () { menu.style.display = 'none'; });
  document.addEventListener('pointerdown', function (e) { if (menu.style.display === 'grid' && !menu.contains(e.target) && e.target !== btn && !btn.contains(e.target)) menu.style.display = 'none'; }, true);
})();
