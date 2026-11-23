/* core.js - helpers, settings, renderer, scene, camera (classic script: everything is global) */
if (typeof THREE === 'undefined') { document.getElementById('boot').textContent = 'Could not load three.js. Check your internet connection and reopen the game.'; throw new Error('three.js missing'); }

/* =====================================================================
   HELPERS
   ===================================================================== */
var $ = function (id) { return document.getElementById(id); };
var clamp = function (v, a, b) { return v < a ? a : (v > b ? b : v); };
var lerp = function (a, b, t) { return a + (b - a) * t; };
var rand = function (a, b) { return a + Math.random() * (b - a); };
var randInt = function (a, b) { return Math.floor(rand(a, b + 1)); };
var TAU = Math.PI * 2;
var ease = function (t) { return 1 - (1 - t) * (1 - t); };
function angDiff(a, b) { var d = (b - a) % TAU; if (d > Math.PI) d -= TAU; if (d < -Math.PI) d += TAU; return d; }
function turnToward(cur, target, k) { return cur + angDiff(cur, target) * k; }
function h(tag, cls, text, parent) {
  var el = document.createElement(tag);
  if (cls) el.className = cls;
  if (text !== undefined && text !== null) el.textContent = text;
  if (parent) parent.appendChild(el);
  return el;
}

/* icons: plain file path normally; inlined data-URI when built into one file */
function iconUrl(p) { return (typeof ICON_DATA !== 'undefined' && ICON_DATA[p]) || p; }
var MAPS = [];            // filled by map_01.js ... map_06.js
var S = { shadows: true, sound: true, sens: 1, music: 0.5 };
try { var _s = JSON.parse(localStorage.getItem('moviex_settings') || 'null'); if (_s) Object.assign(S, _s); } catch (e) {}
function saveSettings() { try { localStorage.setItem('moviex_settings', JSON.stringify(S)); } catch (e) {} }
/* Graphics presets (default Medium, shadows off by default). pr = pixel ratio cap, prop = scenery density, mob = mob density, fog = view-distance scale, far = camera far plane, wx = weather particles, vis = distance mobs are animated */
var GFX = { low: { pr: 1, prop: 0.2, mob: 1.0, fog: 0.62, far: 150, wx: 0.35, vis: 42 }, medium: { pr: 1.25, prop: 0.4, mob: 1.5, fog: 0.85, far: 260, wx: 0.7, vis: 55 }, high: { pr: 1.75, prop: 0.6, mob: 2, fog: 1, far: 500, wx: 1, vis: 65 } };
if (!S.gfx) { S.gfx = 'medium'; S.shadows = false; saveSettings(); }          // new default: Medium graphics, shadows OFF
function GQ() { return GFX[S.gfx] || GFX.medium; }


/* =====================================================================
   RENDERER / SCENE / CAMERA
   ===================================================================== */
var canvas = $('game');
var dpr = window.devicePixelRatio || 1;
var renderer = new THREE.WebGLRenderer({ canvas: canvas, antialias: dpr < 2, powerPreference: 'high-performance' });
renderer.setPixelRatio(Math.min(dpr, GQ().pr));
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.shadowMap.enabled = S.shadows;
renderer.shadowMap.type = THREE.PCFShadowMap;

var SKY = 0x9cc7f0;
var scene = new THREE.Scene();
scene.background = new THREE.Color(SKY);
scene.fog = new THREE.Fog(SKY, 50, 190);
var camera = new THREE.PerspectiveCamera(58, window.innerWidth / window.innerHeight, 0.1, GQ().far);
var cam = { yaw: 0, pitch: 0.42, dist: 9.5 };
var CAM_MIN = 3, CAM_MAX = 24;

var BASE_R = 170, AREA = 1;     // AREA = (map radius / BASE_R)^2 : scales prop counts so bigger maps stay populated
var WORLD_R = 170, SAFE_R = 16;   // reassigned by loadMap()

var hemi = new THREE.HemisphereLight(0xdfefff, 0x4a6b3a, 0.78);
scene.add(hemi);
var sun = new THREE.DirectionalLight(0xfff2d0, 0.95);
sun.position.set(30, 50, 20);
sun.castShadow = S.shadows;
sun.shadow.mapSize.set(1024, 1024);
(function () { var c = sun.shadow.camera; c.left = -28; c.right = 28; c.top = 28; c.bottom = -28; c.near = 1; c.far = 140; })();
sun.shadow.bias = -0.0006;
scene.add(sun); scene.add(sun.target);

function applyGfx() {                       // pixel ratio + view distance apply instantly; scenery / mob density apply the next time a map loads
  renderer.setPixelRatio(Math.min(dpr, GQ().pr)); renderer.setSize(window.innerWidth, window.innerHeight);
  camera.far = GQ().far; camera.updateProjectionMatrix();
  if (scene.fog && curMap) { var T = curMap.theme; scene.fog.near = T.fog[0] * GQ().fog; scene.fog.far = T.fog[1] * GQ().fog; }
}
function applyShadows() {
  renderer.shadowMap.enabled = S.shadows;
  sun.castShadow = S.shadows;
  scene.traverse(function (o) {
    if (o.material) {
      var ms = Array.isArray(o.material) ? o.material : [o.material];
      ms.forEach(function (m) { m.needsUpdate = true; });
    }
  });
}


/* ---------- background music (volume slider in the Menu; browsers need a tap before audio can start) ---------- */
var MUSIC_LIST = ['https://archive.org/download/music_02_202611/music_01.mp3', 'https://archive.org/download/music_02_202611/music_02.mp3', 'https://archive.org/download/music_02_202611/music_03.mp3', 'https://archive.org/download/music_02_202611/music_04.mp3'];
var bgm = null, bgmFailed = false, bgmIdx = -1, bgmErrs = 0;
function musicNext() {                                   // random track, never the same one twice in a row
  var n = MUSIC_LIST.length, i = Math.floor(Math.random() * n); if (n > 1 && i === bgmIdx) i = (i + 1 + Math.floor(Math.random() * (n - 1))) % n;
  bgmIdx = i; if (!bgm) return; bgm.src = MUSIC_LIST[i]; bgm.load();
  if (S.music > 0) { var p = bgm.play(); if (p && p.catch) p.catch(function () {}); }
}
function musicInit() {
  if (bgm) return;
  try {
    bgm = new Audio(); bgm.loop = false; bgm.preload = 'auto'; bgm.volume = clamp(S.music, 0, 1);
    bgm.addEventListener('ended', function () { bgmErrs = 0; musicNext(); });
    bgm.addEventListener('playing', function () { bgmErrs = 0; bgmFailed = false; });
    bgm.addEventListener('error', function () { bgmErrs++; if (bgmErrs < MUSIC_LIST.length * 2) musicNext(); else bgmFailed = true; });
    bgmIdx = -1; var n = MUSIC_LIST.length; bgmIdx = Math.floor(Math.random() * n); bgm.src = MUSIC_LIST[bgmIdx];
  } catch (e) { bgm = null; }
}
function musicApply() {
  musicInit(); if (!bgm) return;
  bgm.volume = clamp(S.music, 0, 1);
  if (S.music <= 0) { bgm.pause(); return; }
  var p = bgm.play(); if (p && p.catch) p.catch(function () {});
}
['pointerdown', 'touchend', 'click', 'keydown'].forEach(function (ev) { var once = function () { musicApply(); document.removeEventListener(ev, once, true); }; document.addEventListener(ev, once, true); });
document.addEventListener('visibilitychange', function () { if (!bgm) return; if (document.hidden) bgm.pause(); else if (S.music > 0) { var p = bgm.play(); if (p && p.catch) p.catch(function () {}); } });
