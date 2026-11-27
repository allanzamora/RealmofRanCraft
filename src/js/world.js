/* world.js - shared world building: obstacles, textures, scatter, portal, camp, environment, weather */
/* =====================================================================
   WORLD: every map is built on demand (terrain, props, camp/village, portal, weather)
   ===================================================================== */
var obstacles = [], bigObs = [], obGrid = {};
var OB_CELL = 12, OBS_TAG = null;   // OBS_TAG: 'sc' = scatter() prop, 'rk' = addRocks() rock, 'ed' = placed by the Map Editor data
function addObstacle(x, z, r) {
  var o = { x: x, z: z, r: r, tag: OBS_TAG };
  obstacles.push(o);
  if (r > 5) { bigObs.push(o); return; }
  var k = Math.floor(x / OB_CELL) + ',' + Math.floor(z / OB_CELL);
  if (!obGrid[k]) obGrid[k] = [];
  obGrid[k].push(o);
}
function pushOut(pos, o, rad) {
  var dx = pos.x - o.x, dz = pos.z - o.z, min = o.r + rad, d2 = dx * dx + dz * dz;
  if (d2 < min * min && d2 > 1e-6) { var d = Math.sqrt(d2), push = (min - d) / d; pos.x += dx * push; pos.z += dz * push; }
}
function resolveObstacles(pos, rad) {
  var cx = Math.floor(pos.x / OB_CELL), cz = Math.floor(pos.z / OB_CELL), i;
  for (var a = -1; a <= 1; a++) for (var b = -1; b <= 1; b++) {
    var cell = obGrid[(cx + a) + ',' + (cz + b)];
    if (cell) for (i = 0; i < cell.length; i++) pushOut(pos, cell[i], rad);
  }
  for (i = 0; i < bigObs.length; i++) pushOut(pos, bigObs[i], rad);
  var r = Math.hypot(pos.x, pos.z);
  if (r > WORLD_R) { pos.x *= WORLD_R / r; pos.z *= WORLD_R / r; }
}


var texCache = {};
function groundTexture(m) {
  var theme = m.id;
  if (texCache[theme]) return texCache[theme];
  var T = m.theme, c = document.createElement('canvas'); c.width = c.height = 256;
  var x = c.getContext('2d');
  x.fillStyle = T.ground; x.fillRect(0, 0, 256, 256);
  for (var i = 0; i < 2400; i++) {
    x.fillStyle = T.speck[i % T.speck.length]; x.globalAlpha = 0.3 + Math.random() * 0.3;
    x.fillRect(Math.random() * 256, Math.random() * 256, 2 + Math.random() * 3, 2 + Math.random() * 3);
  }
  x.globalAlpha = 1;
  if (theme === 'city') { x.strokeStyle = 'rgba(255,255,255,.07)'; x.lineWidth = 2; x.strokeRect(0, 0, 256, 256); x.strokeRect(128, 0, 0, 256); x.strokeRect(0, 128, 256, 0); }
  if (theme === 'demon') {
    x.strokeStyle = 'rgba(255,90,20,.55)'; x.lineWidth = 2;
    for (var k = 0; k < 7; k++) { x.beginPath(); var px = Math.random() * 256, py = Math.random() * 256; x.moveTo(px, py); for (var j = 0; j < 5; j++) { px += rand(-40, 40); py += rand(-40, 40); x.lineTo(px, py); } x.stroke(); }
  }
  var t = new THREE.CanvasTexture(c);
  t.wrapS = t.wrapT = THREE.RepeatWrapping; t.repeat.set(110, 110);
  texCache[theme] = t; return t;
}
function windowTexture() {
  if (texCache.win) return texCache.win;
  var c = document.createElement('canvas'); c.width = 64; c.height = 128;
  var x = c.getContext('2d'); x.fillStyle = '#1a2030'; x.fillRect(0, 0, 64, 128);
  var cols = ['#ffe9a0', '#7af0ff', '#ff7ad8', '#ffffff', '#2a3448'];
  for (var yy = 4; yy < 124; yy += 12) for (var xx = 4; xx < 60; xx += 12) { x.fillStyle = cols[randInt(0, 4)]; x.fillRect(xx, yy, 7, 7); }
  var t = new THREE.CanvasTexture(c); t.wrapS = t.wrapT = THREE.RepeatWrapping; texCache.win = t; return t;
}

var worldGroup = new THREE.Group(); scene.add(worldGroup);
var portals = [], clouds = [], weather = null, curMap = null;

function clearWorld() {
  scene.remove(worldGroup);
  worldGroup.traverse(function (o) {
    if (o.geometry) o.geometry.dispose();
    if (o.material) { var ms = Array.isArray(o.material) ? o.material : [o.material]; ms.forEach(function (m) { m.dispose(); }); }
  });
  worldGroup = new THREE.Group(); scene.add(worldGroup);
  obstacles.length = 0; bigObs.length = 0; obGrid = {};
  portals.length = 0; clouds = []; weather = null;
}

/* scatter instanced props. parts: [{geo, mat, tint}]  o: {rMin, rMax, sMin, sMax, obs, gap, color(i), scaleFn(s), clear(x,z), shadow, y} */
var _dm = new THREE.Object3D();
function scatter(g, parts, n, o) {
  if ((o.obs || o.obsFn) && typeof mapEditSkipScatter === 'function' && mapEditSkipScatter()) return 0;      // Map Editor: this map's props come from MAP_EDITS
  var prevTag = OBS_TAG; if (!prevTag) OBS_TAG = 'sc';
  try { return scatter0(g, parts, n, o); } finally { OBS_TAG = prevTag; }
}
function scatter0(g, parts, n, o) {
  n = Math.max(1, Math.round(n * AREA * GQ().prop)); var gridG = {}, GC = 8;
  if (S.gfx === 'low') {                                    // Low graphics: every prop becomes one semi-transparent box (1 draw call per prop group)
    var bb = null; try { parts.forEach(function (p) { p.geo.computeBoundingBox(); var b = p.geo.boundingBox; if (!bb) bb = { x0: b.min.x, x1: b.max.x, y0: b.min.y, y1: b.max.y, z0: b.min.z, z1: b.max.z }; else { bb.x0 = Math.min(bb.x0, b.min.x); bb.x1 = Math.max(bb.x1, b.max.x); bb.y0 = Math.min(bb.y0, b.min.y); bb.y1 = Math.max(bb.y1, b.max.y); bb.z0 = Math.min(bb.z0, b.min.z); bb.z1 = Math.max(bb.z1, b.max.z); } }); } catch (e) { bb = null; }
    if (!bb) bb = { x0: -0.5, x1: 0.5, y0: 0, y1: 1, z0: -0.5, z1: 0.5 };
    var bg = geoUp(new THREE.BoxGeometry(bb.x1 - bb.x0, bb.y1 - bb.y0, bb.z1 - bb.z0), (bb.y0 + bb.y1) / 2);
    var bc = parts[0].mat && parts[0].mat.color ? parts[0].mat.color.getHex() : 0x888888;
    parts = [{ geo: bg, mat: new THREE.MeshBasicMaterial({ color: bc, transparent: true, opacity: 0.38, depthWrite: false }) }]; o = Object.assign({}, o, { shadow: false, color: null });
  }
  var ims = parts.map(function (p) {
    var im = new THREE.InstancedMesh(p.geo, p.mat, n);
    im.frustumCulled = false; im.castShadow = o.shadow !== false; im.receiveShadow = !!o.receive;
    return im;
  });
  var placed = 0, tries = 0, pts = [], col = new THREE.Color();
  while (placed < n && tries < n * 40) {
    tries++;
    var a = Math.random() * TAU, r = o.rMin + (o.rMax - o.rMin) * Math.sqrt(Math.random());
    var x = Math.cos(a) * r, z = Math.sin(a) * r;
    if (o.clear && o.clear(x, z)) continue;
    var s = rand(o.sMin, o.sMax), sc = o.scaleFn ? o.scaleFn(s) : [s, s, s];
    var rad = o.obsFn ? o.obsFn(sc) : (o.obs || 0) * s;
    if (o.gap) {
      var bad = false, gx = Math.floor(x / GC), gz = Math.floor(z / GC), reach = Math.ceil((rad + o.gap + 4) / GC);
      for (var ix = gx - reach; ix <= gx + reach && !bad; ix++) for (var iz = gz - reach; iz <= gz + reach && !bad; iz++) {
        var cell = gridG[ix + ',' + iz]; if (!cell) continue;
        for (var q = 0; q < cell.length; q++) { var pq = cell[q]; if (Math.hypot(pq.x - x, pq.z - z) < pq.r + rad + o.gap) { bad = true; break; } }
      }
      if (bad) continue;
      var key = gx + ',' + gz; (gridG[key] = gridG[key] || []).push({ x: x, z: z, r: rad });
    }
    _dm.position.set(x, o.y || 0, z); _dm.scale.set(sc[0], sc[1], sc[2]); _dm.rotation.set(0, Math.random() * TAU, 0); _dm.updateMatrix();
    if (o.color) col.copy(o.color(placed));
    for (var k = 0; k < ims.length; k++) { ims[k].setMatrixAt(placed, _dm.matrix); if (parts[k].tint && o.color) ims[k].setColorAt(placed, col); }
    if (rad > 0) addObstacle(x, z, rad);
    placed++;
  }
  ims.forEach(function (im) { im.count = placed; im.instanceMatrix.needsUpdate = true; if (im.instanceColor) im.instanceColor.needsUpdate = true; g.add(im); });
  return placed;
}
function stdMat(c, ex) { var p = { color: c, roughness: 1 }; if (ex) for (var k in ex) p[k] = ex[k]; return new THREE.MeshStandardMaterial(p); }
function geoUp(geo, y) { geo.translate(0, y, 0); return geo; }
function hsl(h, s, l) { return new THREE.Color().setHSL(h, s, l); }

function addRocks(g, m, n, color) {
  var pt = OBS_TAG; OBS_TAG = 'rk'; try { addRocks0(g, m, n, color); } finally { OBS_TAG = pt; }
}
function addRocks0(g, m, n, color) {
  scatter(g, [{ geo: new THREE.DodecahedronGeometry(1, 0), mat: stdMat(color, { flatShading: true }) }], n,
    { rMin: m.safeR + 6, rMax: m.R + 5, sMin: 0.5, sMax: 1.7, obs: 0.85, y: 0.4, scaleFn: function (s) { return [s, s * 0.8, s]; } });
}
function addMountains(g, m, color) {
  var mm = stdMat(color, { flatShading: true });
  for (var i = 0; i < 14; i++) {
    var ang = (i / 14) * TAU + Math.random() * 0.2, rad = m.R + 50 + Math.random() * 40, hh = 40 + Math.random() * 55;
    var mt = new THREE.Mesh(new THREE.ConeGeometry(26 + Math.random() * 22, hh, 6), mm);
    mt.position.set(Math.cos(ang) * rad, hh / 2 - 2, Math.sin(ang) * rad); g.add(mt);
  }
}

function makePortal(g, x, z) {
  var pg = new THREE.Group(); pg.position.set(x, 0, z);
  var stone = stdMat(0x555a66), glow = new THREE.MeshBasicMaterial({ color: 0x66ccff });
  var base = new THREE.Mesh(new THREE.CylinderGeometry(2.1, 2.3, 0.3, 20), stone); base.position.y = 0.15; base.receiveShadow = true; pg.add(base);
  var ring = new THREE.Mesh(new THREE.TorusGeometry(1.5, 0.13, 8, 30), glow); ring.position.y = 1.9; pg.add(ring);
  var disc = new THREE.Mesh(new THREE.CircleGeometry(1.4, 24), new THREE.MeshBasicMaterial({ color: 0x88e0ff, transparent: true, opacity: 0.45, side: THREE.DoubleSide, depthWrite: false }));
  disc.position.y = 1.9; pg.add(disc);
  [-1.6, 1.6].forEach(function (px) { var p = new THREE.Mesh(new THREE.CylinderGeometry(0.2, 0.26, 2.4, 8), stone); p.position.set(px, 1.2, 0); p.castShadow = true; pg.add(p); });
  g.add(pg); addObstacle(x, z, 2.3);
  var obj = { x: x, z: z, ring: ring, disc: disc };
  portals.push(obj); return obj;
}

/* ---- Moviex village (plains hub) ---- */
/* ---- camp used in the other maps ---- */
function buildCamp(g, m) {
  var plaza = new THREE.Mesh(new THREE.CircleGeometry(m.safeR, 40), stdMat(0x77736a));
  plaza.rotation.x = -Math.PI / 2; plaza.position.y = 0.02; plaza.receiveShadow = true; g.add(plaza);
  var edge = new THREE.Mesh(new THREE.RingGeometry(m.safeR - 0.4, m.safeR, 56), new THREE.MeshBasicMaterial({ color: 0x66ccff, transparent: true, opacity: 0.55, side: THREE.DoubleSide }));
  edge.rotation.x = -Math.PI / 2; edge.position.y = 0.04; g.add(edge);
}

function buildEnvironment(m) {
  var T = m.theme, g = worldGroup;
  scene.background = new THREE.Color(T.sky); scene.fog = new THREE.Fog(T.sky, T.fog[0] * GQ().fog, T.fog[1] * GQ().fog);
  hemi.color.setHex(T.hemi[0]); hemi.groundColor.setHex(T.hemi[1]); hemi.intensity = T.hemi[2]; sun.color.setHex(T.sun);
  var ground = new THREE.Mesh(new THREE.PlaneGeometry(m.R * 2 + 600, m.R * 2 + 600), new THREE.MeshStandardMaterial({ map: groundTexture(m), roughness: 1 }));
  ground.rotation.x = -Math.PI / 2; ground.receiveShadow = true; g.add(ground);
  ground.material.map.repeat.set((m.R * 2 + 600) / 8.2, (m.R * 2 + 600) / 8.2);

  if (m.build) m.build(g, m);
  if (!m.hub && !m.noCamp) buildCamp(g, m);
  addMountains(g, m, T.mount);

  // clouds
  var cmat = new THREE.MeshBasicMaterial({ color: T.cloud, transparent: true, opacity: 0.88, fog: false });
  for (var i = 0; i < 14 + Math.round(m.R / 20); i++) {
    var cg = new THREE.Group();
    for (var j = 0; j < 4; j++) { var s = new THREE.Mesh(new THREE.SphereGeometry(5 + Math.random() * 4, 8, 6), cmat); s.position.set(j * 7 - 10 + rand(-2, 2), rand(-1, 2), rand(-3, 3)); s.scale.y = 0.5; cg.add(s); }
    cg.position.set(rand(-m.R - 60, m.R + 60), rand(60, 85), rand(-m.R - 60, m.R + 60)); g.add(cg); clouds.push(cg);
  }

  // weather particles (snow / embers / spores)
  var kind = m.weather;
  if (kind) {
    var N = Math.max(40, Math.round(320 * GQ().wx)), pos = new Float32Array(N * 3);
    for (var p = 0; p < N; p++) { pos[p * 3] = rand(-30, 30); pos[p * 3 + 1] = rand(0, 22); pos[p * 3 + 2] = rand(-30, 30); }
    var geo = new THREE.BufferGeometry(); geo.setAttribute('position', new THREE.BufferAttribute(pos, 3));
    var col = kind === 'snow' ? 0xffffff : (kind === 'ember' ? 0xff7a2a : 0xd8ffa0);
    var pts2 = new THREE.Points(geo, new THREE.PointsMaterial({ color: col, size: kind === 'snow' ? 0.22 : 0.16, transparent: true, opacity: 0.9, depthWrite: false }));
    pts2.frustumCulled = false; g.add(pts2); weather = { pts: pts2, pos: pos, N: N, kind: kind };
  }
}

function updateWeather(dt) {
  if (!weather) return;
  var p = weather.pos, px = P.pos.x, pz = P.pos.z, up = weather.kind === 'ember';
  for (var i = 0; i < weather.N; i++) {
    var k = i * 3;
    p[k + 1] += (up ? 1.6 : (weather.kind === 'snow' ? -2.2 : -0.35)) * dt; p[k] += Math.sin(p[k + 1] * 0.7 + i) * dt * 0.6;
    if (p[k + 1] < 0 || p[k + 1] > 22) p[k + 1] = up ? 0 : 22;
    if (p[k] - px > 30) p[k] -= 60; else if (p[k] - px < -30) p[k] += 60;
    if (p[k + 2] - pz > 30) p[k + 2] -= 60; else if (p[k + 2] - pz < -30) p[k + 2] += 60;
  }
  weather.pts.geometry.attributes.position.needsUpdate = true;
}
