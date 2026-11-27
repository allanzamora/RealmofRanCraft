/* input.js - fixed joystick, multitouch camera (drag + pinch), zoom, action buttons, keyboard */
var joy = { id: null, cx: 0, cy: 0, x: 0, y: 0, R: 40 };
var kb = { x: 0, y: 0 }, keys = {};
var camPtrs = {}, camCount = 0, pinchDist = 0;
var joyBase = $('joy-base'), joyStick = $('joy-stick');

function joyCenter() { var r = joyBase.getBoundingClientRect(); joy.cx = r.left + r.width / 2; joy.cy = r.top + r.height / 2; joy.R = r.width * 0.36; }
function moveJoyVisual() { joyStick.style.transform = 'translate(' + (joy.x * joy.R).toFixed(1) + 'px,' + (joy.y * joy.R).toFixed(1) + 'px)'; joyBase.classList.toggle('on', joy.id !== null); }
function inJoyZone(x, y) { return x < window.innerWidth * 0.45 && y > window.innerHeight * 0.45; }
function pinchNow() {
  var ids = Object.keys(camPtrs); if (ids.length < 2) return 0;
  var a = camPtrs[ids[0]], b = camPtrs[ids[1]]; return Math.hypot(a.x - b.x, a.y - b.y);
}
function zoomBy(d) { cam.dist = clamp(cam.dist + d, CAM_MIN, CAM_MAX); }
function releaseInputs() {
  joy.id = null; joy.x = joy.y = 0; moveJoyVisual();
  camPtrs = {}; camCount = 0; pinchDist = 0; P.attackHeld = false;
  Array.prototype.forEach.call(document.querySelectorAll('.abtn.down,.zbtn.down'), function (b) { b.classList.remove('down'); });
}
function setJoyFromPointer(px, py) {
  var dx = px - joy.cx, dy = py - joy.cy, d = Math.hypot(dx, dy) || 1;
  var m = Math.min(1, d / joy.R);
  joy.x = dx / d * m; joy.y = dy / d * m; moveJoyVisual();
}

canvas.addEventListener('pointerdown', function (e) {
  e.preventDefault(); unlockAudio();
  if (ui.open) return;
  try { canvas.setPointerCapture(e.pointerId); } catch (err) {}
  if (e.pointerType !== 'mouse' && joy.id === null && inJoyZone(e.clientX, e.clientY)) {
    joy.id = e.pointerId; joyCenter(); setJoyFromPointer(e.clientX, e.clientY);
  } else {
    camPtrs[e.pointerId] = { x: e.clientX, y: e.clientY, t0: performance.now(), moved: 0 };
    camCount = Object.keys(camPtrs).length;
    if (camCount === 2) pinchDist = pinchNow();
  }
});
window.addEventListener('pointermove', function (e) {
  if (e.pointerId === joy.id) { setJoyFromPointer(e.clientX, e.clientY); return; }
  var p = camPtrs[e.pointerId]; if (!p) return;
  var cx = e.clientX - p.x, cy = e.clientY - p.y;
  p.moved += Math.abs(cx) + Math.abs(cy); p.x = e.clientX; p.y = e.clientY;
  if (camCount >= 2) {
    var nd = pinchNow();
    if (pinchDist > 0) zoomBy(-(nd - pinchDist) * 0.05);
    pinchDist = nd;
  } else {
    cam.yaw -= cx * 0.0065 * S.sens;
    cam.pitch = clamp(cam.pitch + cy * 0.0045 * S.sens, 0.08, 1.25);
  }
});
function endPointer(e) {
  if (e.pointerId === joy.id) { joy.id = null; joy.x = joy.y = 0; moveJoyVisual(); return; }
  var p = camPtrs[e.pointerId];
  if (p) {
    delete camPtrs[e.pointerId]; camCount = Object.keys(camPtrs).length; pinchDist = 0;
    if (e.type === 'pointerup' && p.moved < 14 && performance.now() - p.t0 < 350) handleTap(e.clientX, e.clientY);
  }
}
window.addEventListener('pointerup', endPointer);
window.addEventListener('pointercancel', endPointer);
canvas.addEventListener('wheel', function (e) { zoomBy(e.deltaY * 0.012); e.preventDefault(); }, { passive: false });
canvas.addEventListener('contextmenu', function (e) { e.preventDefault(); });
window.addEventListener('blur', releaseInputs);
document.addEventListener('visibilitychange', function () { if (document.hidden) { releaseInputs(); saveGame(); } });

function bindBtn(id, onDown, onUp) {
  var el = $(id), active = {};
  el.addEventListener('pointerdown', function (e) {
    e.preventDefault(); e.stopPropagation(); unlockAudio();
    try { el.setPointerCapture(e.pointerId); } catch (err) {}
    active[e.pointerId] = true; el.classList.add('down'); onDown();
  });
  var up = function (e) {
    if (!active[e.pointerId]) return; delete active[e.pointerId];
    if (!Object.keys(active).length) { el.classList.remove('down'); if (onUp) onUp(); }
  };
  el.addEventListener('pointerup', up); el.addEventListener('pointercancel', up); el.addEventListener('lostpointercapture', up);
}
function tapBtn(id, fn) {
  var el = $(id);
  el.addEventListener('pointerdown', function (e) { e.preventDefault(); e.stopPropagation(); unlockAudio(); el.classList.add('down'); });
  el.addEventListener('pointerup', function (e) { e.preventDefault(); e.stopPropagation(); el.classList.remove('down'); sfx('ui'); fn(); });
  el.addEventListener('pointercancel', function () { el.classList.remove('down'); });
}
/* zoom buttons: hold to keep zooming */
var zoomDir = 0;
bindBtn('z-in', function () { zoomDir = -1; zoomBy(-1.5); }, function () { zoomDir = 0; });
bindBtn('z-out', function () { zoomDir = 1; zoomBy(1.5); }, function () { zoomDir = 0; });
function updateZoomHold(dt) { if (zoomDir) zoomBy(zoomDir * 9 * dt); }

bindBtn('b-attack', function () { P.attackHeld = true; tryBasic(); }, function () { P.attackHeld = false; });
for (var _i = 0; _i < SKILL_SLOTS; _i++) (function (i) { bindBtn('b-k' + (i + 1), function () { useSkillSlot(i); }); })(_i);
bindBtn('b-dash', function () { tryDash(); });
bindBtn('b-mount', function () { toggleMount(); });
function refreshWalkBtn() { var b = $('b-walk'); b.querySelector('.ic').innerHTML = P.walk ? '&#128694;' : '&#127939;'; b.querySelector('.lb').textContent = P.walk ? 'WALK' : 'RUN'; }
bindBtn('b-walk', function () { P.walk = !P.walk; refreshWalkBtn(); sfx('ui'); });
bindBtn('b-hp', function () { usePotion('hp_potion'); });
bindBtn('b-mp', function () { usePotion('mp_potion'); });
tapBtn('m-nav', function () { openNav(); });
tapBtn('nav-x', function () { closeNav(); });
$('nav-back').addEventListener('pointerdown', function () { closeNav(); });
tapBtn('m-redeem', function () { openRedeem(); });
tapBtn('m-support', function () { openSupport(); });
tapBtn('dia-plus', function () { openSupport(); });
tapBtn('m-bag', function () { openBag(); });
tapBtn('m-skill', function () { openSkills(); });
tapBtn('m-quest', function () { openQuestLog(); });
tapBtn('m-ach', function () { openAchievements(); });
tapBtn('m-rank', function () { openRank(); });
tapBtn('m-map', function () { openWorldMap(); });
tapBtn('m-menu', function () { openSettings(); });
tapBtn('btn-duel', function () { if (P.target && P.target.remote) duelRequest(P.target); });
tapBtn('duel-yes', function () { duelAccept(); });
tapBtn('duel-no', function () { duelDecline(); });
tapBtn('btn-pk', function () { if (P.target && P.target.isAI) startPK(P.target); });
tapBtn('btn-talk', function () { var n = nearestInteract(); if (n) interact(n); });

window.addEventListener('keydown', function (e) {
  if (e.repeat && e.code !== 'Space') return;
  keys[e.code] = true; unlockAudio();
  if (e.code === 'Escape') { if (ui.open !== 'name') closePanel(); return; }
  if (ui.open) return;
  if (e.code === 'Space' || e.code === 'KeyJ') { P.attackHeld = true; tryBasic(); }
  else if (/^Digit[1-8]$/.test(e.code)) useSkillSlot(parseInt(e.code.charAt(5), 10) - 1);
  else if (e.code === 'KeyQ') usePotion('hp_potion');
  else if (e.code === 'KeyE') usePotion('mp_potion');
  else if (e.code === 'KeyF') { var n = nearestInteract(); if (n) interact(n); }
  else if (e.code === 'KeyR') toggleMount();
  else if (e.code === 'KeyX') { if (P.target && P.target.isAI) startPK(P.target); }
  else if (e.code === 'KeyB') openBag();
  else if (e.code === 'KeyK') openSkills();
  else if (e.code === 'KeyM') openWorldMap();
  else if (e.code === 'KeyL') openQuestLog();
  else if (e.code === 'Equal' || e.code === 'NumpadAdd') zoomBy(-2);
  else if (e.code === 'Minus' || e.code === 'NumpadSubtract') zoomBy(2);
  updateKb();
});
window.addEventListener('keyup', function (e) { keys[e.code] = false; if (e.code === 'Space' || e.code === 'KeyJ') P.attackHeld = false; updateKb(); });
function updateKb() {
  kb.x = (keys.KeyD || keys.ArrowRight ? 1 : 0) - (keys.KeyA || keys.ArrowLeft ? 1 : 0);
  kb.y = (keys.KeyS || keys.ArrowDown ? 1 : 0) - (keys.KeyW || keys.ArrowUp ? 1 : 0);
}

function handleTap(x, y) {
  var best = null, bd = 70, v = new THREE.Vector3();
  function consider(kind, obj, pos, hgt) {
    v.set(pos.x, (pos.y || 0) + hgt, pos.z); v.project(camera); if (v.z > 1) return;
    var sx = (v.x * 0.5 + 0.5) * window.innerWidth, sy = (-v.y * 0.5 + 0.5) * window.innerHeight, d = Math.hypot(sx - x, sy - y);
    if (d < bd) { bd = d; best = { kind: kind, obj: obj }; }
  }
  enemies.forEach(function (e) { if (e.state !== 'dead' && e.c.g.visible) consider('enemy', e, e.pos, 1.0 * e.T.scale); });
  ais.forEach(function (a) { if (a.state !== 'dead' && a.c.g.visible) consider('ai', a, a.pos, 1.0); });
  npcs.forEach(function (n) { consider('npc', n, n.pos, 1.0); });
  if (!best) return;
  if (best.kind === 'enemy' || best.kind === 'ai') { setTarget(best.obj); sfx('ui'); }
  else if (Math.hypot(best.obj.pos.x - P.pos.x, best.obj.pos.z - P.pos.z) < 4) interact(best.obj);
  else log('Move closer to talk to ' + best.obj.name + '.', '#ccc');
}

function getMove() {
  var x = joy.x + kb.x, y = joy.y + kb.y, m = Math.hypot(x, y);
  if (m < 0.001) return { x: 0, y: 0, m: 0 };
  var dz = 0.12, mm = clamp((Math.min(m, 1) - dz) / (1 - dz), 0, 1);
  if (kb.x || kb.y) mm = 1;
  return { x: x / m, y: y / m, m: Math.pow(mm, 1.15) };
}

/* ---------- on-screen layout of the action buttons (small icons) ---------- */
function layoutActions() {
  var W = window.innerWidth, H = window.innerHeight;
  var s = clamp(Math.min(W, H) / 380, 0.8, 1.15);
  var sa = Math.round(54 * s) + 20, sk = Math.round(38 * s), g = sk + Math.round(6 * s);
  var m = 8, cx = W - m - sa / 2, cy = H - m - sa / 2 - 2;
  function put(id, size, x, y) { var el = $(id); el.style.width = el.style.height = size + 'px'; el.style.left = (x - size / 2).toFixed(1) + 'px'; el.style.top = (y - size / 2).toFixed(1) + 'px'; }
  put('b-attack', sa, cx, cy);
  var x1 = cx - sa / 2 - 4 - sk / 2;                      // bottom row (right -> left): ATTACK, DASH, RIDE, HP, MP
  put('b-dash', sk, x1, cy); put('b-mount', sk, x1 - g, cy); put('b-hp', sk, x1 - 2 * g, cy); put('b-mp', sk, x1 - 3 * g, cy); put('b-chat', sk, x1 - 4 * g, cy);
  var y1 = cy - sa / 2 - 4 - sk / 2;                      // second row: 4 skills (+ WALK/RUN above ATTACK)
  for (var j = 0; j < 4; j++) put('b-k' + (1 + j), sk, x1 - j * g, y1);
  put('b-walk', sk, cx, y1);
  var y2 = y1 - g; put('b-auto', sk, cx, y2);                                        // top row: 4 skills
  for (var q = 0; q < 4; q++) put('b-k' + (5 + q), sk, x1 - q * g, y2);
  joyBase.style.width = joyBase.style.height = Math.round(104 * s) + 'px';
  joyStick.style.width = joyStick.style.height = Math.round(42 * s) + 'px';
  joyStick.style.left = joyStick.style.top = Math.round((104 * s - 42 * s) / 2) + 'px';
  joyCenter();
}
window.addEventListener('resize', function () { layoutActions(); });

/* ---------- fullscreen on open (browsers need a user gesture, so it also fires on the first touch/click) ---------- */
function goFullscreen() {
  var el = document.documentElement, rq = el.requestFullscreen || el.webkitRequestFullscreen || el.msRequestFullscreen;
  try { if (rq && !document.fullscreenElement && !document.webkitFullscreenElement) { var p = rq.call(el); if (p && p.catch) p.catch(function () {}); } } catch (e) {}
  try { if (screen.orientation && screen.orientation.lock) screen.orientation.lock('landscape').catch(function () {}); } catch (e2) {}
}
goFullscreen();
['pointerdown', 'touchend', 'click'].forEach(function (ev) { var once = function () { goFullscreen(); document.removeEventListener(ev, once, true); }; document.addEventListener(ev, once, true); });
document.addEventListener('fullscreenchange', function () { setTimeout(layoutActions, 150); });
