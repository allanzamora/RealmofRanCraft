/* fx.js - floating text, particles, rings, sound, log, timers */
/* =====================================================================
   FX, FLOATING TEXT, SOUND
   ===================================================================== */
var fxList = [];
var floaters = [];
var floatLayer = $('floaters');
var _v = new THREE.Vector3();

function spawnText(str, pos, cls, yOff) {
  var el = h('div', 'fl ' + cls, str, floatLayer);
  var f = { el: el, pos: new THREE.Vector3(pos.x + rand(-0.3, 0.3), pos.y + (yOff || 1.8), pos.z), t: 0, dur: 0.95 };
  floaters.push(f);
  if (floaters.length > 40) { var o = floaters.shift(); if (o.el.parentNode) o.el.parentNode.removeChild(o.el); }
}
function updateFloaters(dt) {
  for (var i = floaters.length - 1; i >= 0; i--) {
    var f = floaters[i]; f.t += dt;
    if (f.t >= f.dur) { if (f.el.parentNode) f.el.parentNode.removeChild(f.el); floaters.splice(i, 1); continue; }
    _v.copy(f.pos); _v.y += f.t * 1.3; _v.project(camera);
    if (_v.z > 1) { f.el.style.display = 'none'; continue; }
    f.el.style.display = 'block';
    var x = (_v.x * 0.5 + 0.5) * window.innerWidth, y = (-_v.y * 0.5 + 0.5) * window.innerHeight;
    f.el.style.transform = 'translate(' + x.toFixed(1) + 'px,' + y.toFixed(1) + 'px) translate(-50%,-50%)';
    f.el.style.opacity = f.t > f.dur * 0.6 ? String(1 - (f.t - f.dur * 0.6) / (f.dur * 0.4)) : '1';
  }
}

var particleGeo = new THREE.BoxGeometry(0.09, 0.09, 0.09);
var particleMats = {};
function burst(pos, color, n, speed, up) {
  if (lowFx()) return;
  if (fxList.length > 160) return;
  if (!particleMats[color]) particleMats[color] = new THREE.MeshBasicMaterial({ color: color });
  for (var i = 0; i < n; i++) {
    var m = new THREE.Mesh(particleGeo, particleMats[color]);
    m.position.set(pos.x, pos.y, pos.z);
    scene.add(m);
    var vx = rand(-1, 1) * speed, vy = rand(0.3, 1) * (up || speed), vz = rand(-1, 1) * speed;
    fxList.push({ t: 0, dur: rand(0.4, 0.8), obj: m, shared: true, update: (function (m, vx, vy, vz) {
      return function (k, dt) { vy -= 9 * dt; m.position.x += vx * dt; m.position.y += vy * dt; m.position.z += vz * dt; m.scale.setScalar(1 - k); };
    })(m, vx, vy, vz) });
  }
}
function ringFx(x, z, radius, color, dur) {
  if (lowFx()) return;
  var m = new THREE.Mesh(new THREE.RingGeometry(0.85, 1, 40), new THREE.MeshBasicMaterial({ color: color, transparent: true, opacity: 0.9, side: THREE.DoubleSide, depthWrite: false }));
  m.rotation.x = -Math.PI / 2; m.position.set(x, 0.08, z); scene.add(m);
  fxList.push({ t: 0, dur: dur, obj: m, update: function (k) { var s = lerp(0.3, radius, ease(k)); m.scale.set(s, s, s); m.material.opacity = 0.9 * (1 - k); } });
}
function slashFx(x, z, yaw, color, radius, arc) {
  if (lowFx()) return;
  var g = new THREE.Group();
  var m = new THREE.Mesh(new THREE.RingGeometry(radius * 0.45, radius, 28, 1, -arc / 2, arc), new THREE.MeshBasicMaterial({ color: color, transparent: true, opacity: 0.85, side: THREE.DoubleSide, depthWrite: false }));
  m.rotation.x = -Math.PI / 2; g.add(m);
  g.position.set(x, 0.9, z); g.rotation.y = yaw - Math.PI / 2; scene.add(g);
  fxList.push({ t: 0, dur: 0.28, obj: g, geoOwner: m, update: function (k) { m.material.opacity = 0.85 * (1 - k); var s = 0.85 + 0.25 * k; g.scale.set(s, s, s); } });
}
function pillarFx(x, z, color) {
  if (lowFx()) return;
  var m = new THREE.Mesh(new THREE.CylinderGeometry(1.1, 1.1, 8, 20, 1, true), new THREE.MeshBasicMaterial({ color: color, transparent: true, opacity: 0.6, side: THREE.DoubleSide, depthWrite: false }));
  m.position.set(x, 4, z); scene.add(m);
  fxList.push({ t: 0, dur: 1.2, obj: m, update: function (k) { m.material.opacity = 0.6 * (1 - k); m.scale.set(1 - k * 0.6, 1 + k * 0.4, 1 - k * 0.6); } });
}
function updateFx(dt) {
  for (var i = fxList.length - 1; i >= 0; i--) {
    var f = fxList[i]; f.t += dt;
    if (f.obj && f.obj.visible !== !lowFx()) f.obj.visible = !lowFx();      // Low graphics: skill effects stay hidden (not rendered)
    var k = Math.min(1, f.t / f.dur);
    f.update(k, dt);
    if (f.t >= f.dur) {
      scene.remove(f.obj);
      if (!f.shared) {
        var mesh = f.geoOwner || f.obj;
        if (mesh.geometry) mesh.geometry.dispose();
        if (mesh.material) mesh.material.dispose();
      }
      fxList.splice(i, 1);
    }
  }
}

var actx = null;
function unlockAudio() {
  if (!S.sound) return;
  try {
    if (!actx) { var AC = window.AudioContext || window.webkitAudioContext; if (!AC) return; actx = new AC(); }
    if (actx.state === 'suspended') actx.resume();
  } catch (e) {}
}
function tone(f0, f1, dur, type, vol, delay) {
  if (!S.sound || !actx) return;
  try {
    var t0 = actx.currentTime + (delay || 0);
    var o = actx.createOscillator(), g = actx.createGain();
    o.type = type; o.frequency.setValueAtTime(f0, t0); o.frequency.exponentialRampToValueAtTime(Math.max(20, f1), t0 + dur);
    g.gain.setValueAtTime(vol, t0); g.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
    o.connect(g); g.connect(actx.destination); o.start(t0); o.stop(t0 + dur + 0.02);
  } catch (e) {}
}
function sfx(name) {
  switch (name) {
    case 'swing': tone(300, 120, 0.12, 'triangle', 0.05); break;
    case 'hit': tone(220, 80, 0.09, 'square', 0.06); break;
    case 'crit': tone(500, 90, 0.16, 'sawtooth', 0.07); break;
    case 'hurt': tone(160, 55, 0.18, 'sawtooth', 0.07); break;
    case 'skill': tone(300, 900, 0.22, 'sine', 0.07); break;
    case 'heal': tone(500, 900, 0.3, 'sine', 0.06); tone(700, 1200, 0.3, 'sine', 0.04, 0.12); break;
    case 'coin': tone(900, 1400, 0.1, 'square', 0.035); break;
    case 'level': tone(520, 520, 0.14, 'triangle', 0.07); tone(660, 660, 0.14, 'triangle', 0.07, 0.14); tone(880, 880, 0.3, 'triangle', 0.07, 0.28); break;
    case 'ui': tone(600, 800, 0.06, 'square', 0.03); break;
    case 'zap': tone(900, 200, 0.15, 'sawtooth', 0.05); break;
  }
}

/* =====================================================================
   LOG / HUD HELPERS
   ===================================================================== */
var logEl = $('log');
function log(text, color) {
  var d = h('div', null, text, logEl);
  if (color) d.style.color = color;
  while (logEl.children.length > 6) logEl.removeChild(logEl.firstChild);
  setTimeout(function () { if (d.parentNode) d.parentNode.removeChild(d); }, 9000);
}
var timers = [];
function schedule(delay, fn) { timers.push({ t: delay, fn: fn }); }
function updateTimers(dt) {
  for (var i = timers.length - 1; i >= 0; i--) {
    timers[i].t -= dt;
    if (timers[i].t <= 0) { var f = timers[i].fn; timers.splice(i, 1); f(); }
  }
}
var gameTime = 0;
function inCombat() { return gameTime - P.lastCombat < 5; }


/* ---------- thrown projectiles (cards / cameras) ---------- */
var thrown = [];
function throwFx(kind, from, onHit) {
  var mesh;
  if (kind === 'camera') { mesh = new THREE.Mesh(new THREE.BoxGeometry(0.5, 0.34, 0.3), new THREE.MeshStandardMaterial({ color: 0x1c1c22, emissive: 0x2a8cff, emissiveIntensity: 0.5 })); }
  else { mesh = new THREE.Mesh(new THREE.BoxGeometry(0.42, 0.6, 0.04), new THREE.MeshStandardMaterial({ color: 0xffffff, emissive: 0xff2e7e, emissiveIntensity: 0.55 })); }
  mesh.position.set(from.x, 1.5, from.z); scene.add(mesh); thrown.push({ m: mesh, cb: onHit, t: 0 });
}
function updateThrown(dt) {
  for (var i = thrown.length - 1; i >= 0; i--) {
    var o = thrown[i], m = o.m, dx = P.pos.x - m.position.x, dz = P.pos.z - m.position.z, dy = 1.1 - m.position.y, d = Math.hypot(dx, dz, dy);
    o.t += dt; var step = 24 * dt;
    if (d <= step + 0.4 || o.t > 2) { scene.remove(m); m.geometry.dispose(); m.material.dispose(); thrown.splice(i, 1); if (o.t <= 2 && o.cb) o.cb(); continue; }
    m.position.x += dx / d * step; m.position.y += dy / d * step; m.position.z += dz / d * step; m.rotation.y += dt * 16; m.rotation.z += dt * 9;
  }
}
