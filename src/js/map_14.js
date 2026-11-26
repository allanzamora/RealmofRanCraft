/* map_14.js - Prison Room B1 (Lv 120 mobs, needs Lv 100) and Prison Room B2 (Lv 140 mobs, needs Lv 115).
   Square prison: 4 cell rooms around a small central yard, 7-8 mobs per room, no safe zone, no NPCs, no item drops (gold + fixed EXP only). */
E('inmate', 'Death Row Inmate', 120, 'm', 1.2, W('dagger', 0xb8b8c0), { skin: 0xc9a27e, shirt: 0xe8731c, pants: 0xe8731c, hair: null, bald: true, boots: 0x2a2018, eye: 0xff4422 }, { hpMul: 3 });
E('warden', 'Prison Warden', 140, 'b', 1.35, W('greatsword', 0x3a3f4a), { skin: 0xd6b08c, shirt: 0x16233f, pants: 0x0e1630, hair: null, bald: true, helmet: true, armor: 0x22345a, pads: true, padColor: 0x9aa3b8, boots: 0x0a0e1c, eye: 0xffcc33, eyeGlow: true, bulk: 1.15 }, { hpMul: 3 });
(function (a, b) {
  a.xp = 13600; a.fixedXp = true; a.goldOnly = true; a.gold = [3000, 6000]; a.aggro = 12;
  b.xp = 14600; b.fixedXp = true; b.goldOnly = true; b.gold = [4000, 8000]; b.aggro = 12;
})(ENEMY_TYPES.inmate, ENEMY_TYPES.warden);

function buildPrison(g, m, c) {
  var H = 30, WH = 6, TH = 1.2, DOOR0 = 17, DOOR1 = 23, YARD = 10;
  var wall = stdMat(c.wall, { flatShading: true, roughness: 0.9 }), floor = stdMat(c.floor, { roughness: 0.95 }), bars = stdMat(0x2a2d33, { metalness: 0.7, roughness: 0.4 }),
    cotM = stdMat(c.cot), lamp = new THREE.MeshBasicMaterial({ color: c.lamp }), stain = new THREE.MeshBasicMaterial({ color: c.stain, transparent: true, opacity: 0.55 });
  function mesh(geo, mat, x, y, z, ry, shadow) { var o = new THREE.Mesh(geo, mat); o.position.set(x, y, z); if (ry) o.rotation.y = ry; o.castShadow = shadow !== false; o.receiveShadow = true; g.add(o); return o; }
  function wallX(xa, xb, z) { var x0 = Math.min(xa, xb), x1 = Math.max(xa, xb), L = x1 - x0; mesh(new THREE.BoxGeometry(L, WH, TH), wall, (x0 + x1) / 2, WH / 2, z); for (var t = 0; t <= L + 0.01; t += 1.5) addObstacle(x0 + t, z, 1.0); }
  function wallZ(za, zb, x) { var z0 = Math.min(za, zb), z1 = Math.max(za, zb), L = z1 - z0; mesh(new THREE.BoxGeometry(TH, WH, L), wall, x, WH / 2, (z0 + z1) / 2); for (var t = 0; t <= L + 0.01; t += 1.5) addObstacle(x, z0 + t, 1.0); }
  mesh(new THREE.BoxGeometry(H * 2 + 2, 0.08, H * 2 + 2), floor, 0, 0.04, 0, 0, false);
  wallX(-H, H, -H); wallX(-H, H, H); wallZ(-H, H, -H); wallZ(-H, H, H);          // outer walls
  [-1, 1].forEach(function (s) {                                                    // cross walls with a doorway in every arm
    wallX(s * YARD, s * DOOR0, 0); wallX(s * DOOR1, s * H, 0); wallZ(s * YARD, s * DOOR0, 0); wallZ(s * DOOR1, s * H, 0);
    [DOOR0, DOOR1].forEach(function (d) {
      mesh(new THREE.BoxGeometry(1.6, WH + 1.2, 1.6), bars, s * d, (WH + 1.2) / 2, 0); mesh(new THREE.BoxGeometry(1.6, WH + 1.2, 1.6), bars, 0, (WH + 1.2) / 2, s * d);
      mesh(new THREE.BoxGeometry(0.5, 0.5, 0.5), lamp, s * d, WH + 1.4, 0, 0, false); mesh(new THREE.BoxGeometry(0.5, 0.5, 0.5), lamp, 0, WH + 1.4, s * d, 0, false);
    });
  });
  // central yard marking
  var ring = new THREE.Mesh(new THREE.RingGeometry(YARD - 1.2, YARD - 0.6, 40), new THREE.MeshBasicMaterial({ color: c.lamp, side: THREE.DoubleSide, transparent: true, opacity: 0.6 })); ring.rotation.x = -Math.PI / 2; ring.position.y = 0.12; g.add(ring);
  // room sign on the north wall
  var cv = document.createElement('canvas'); cv.width = 512; cv.height = 128; var cx = cv.getContext('2d');
  cx.fillStyle = '#0a0c12'; cx.fillRect(0, 0, 512, 128); cx.strokeStyle = '#' + ('000000' + c.lamp.toString(16)).slice(-6); cx.lineWidth = 6; cx.strokeRect(6, 6, 500, 116);
  cx.fillStyle = cx.strokeStyle; cx.font = 'bold 54px sans-serif'; cx.textAlign = 'center'; cx.textBaseline = 'middle'; cx.fillText(m.name.toUpperCase(), 256, 66);
  var sign = new THREE.Mesh(new THREE.PlaneGeometry(14, 3.5), new THREE.MeshBasicMaterial({ map: new THREE.CanvasTexture(cv) })); sign.position.set(0, 4.2, -H + TH / 2 + 0.05); g.add(sign);
  // cell furniture in each room: cots along the outer walls, bar windows, wall lamps, floor stains
  [[1, 1], [-1, 1], [-1, -1], [1, -1]].forEach(function (q) {
    var sx = q[0], sz = q[1];
    for (var i = 0; i < 3; i++) {
      var cxp = sx * (6 + i * 7.5), czp = sz * (H - 2.4);
      mesh(new THREE.BoxGeometry(3.2, 0.5, 1.5), cotM, cxp, 0.45, czp); mesh(new THREE.BoxGeometry(0.7, 0.2, 1.1), stdMat(0xd8d2c0), cxp - sx * 1.1, 0.8, czp, 0, false); addObstacle(cxp, czp, 1.3);
      var wxp = sx * (H - 2.4), wzp = sz * (6 + i * 7.5);
      mesh(new THREE.BoxGeometry(1.5, 0.5, 3.2), cotM, wxp, 0.45, wzp); addObstacle(wxp, wzp, 1.3);
      mesh(new THREE.BoxGeometry(0.4, 0.4, 0.4), lamp, sx * (H - 0.9), 4.2, wzp, 0, false); mesh(new THREE.BoxGeometry(0.4, 0.4, 0.4), lamp, cxp, 4.2, sz * (H - 0.9), 0, false);
      for (var b = -2; b <= 2; b++) { mesh(new THREE.BoxGeometry(0.12, 2.2, 0.12), bars, sx * (H - 0.75), 3.2, wzp + b * 0.45, 0, false); mesh(new THREE.BoxGeometry(0.12, 2.2, 0.12), bars, cxp + b * 0.45, 3.2, sz * (H - 0.75), 0, false); }
      var st = new THREE.Mesh(new THREE.CircleGeometry(0.8 + Math.random() * 0.9, 10), stain); st.rotation.x = -Math.PI / 2; st.position.set(sx * rand(6, 26), 0.1, sz * rand(6, 26)); g.add(st);
    }
  });
}
function prisonTheme(a) { return { sky: a.sky, fog: [26, 120], hemi: [a.h1, a.h2, 0.8], sun: a.sun, ground: a.ground, speck: a.speck, mount: a.mount, cloud: a.cloud }; }
MAPS.push({ id: 'prison1', name: 'Prison Room B1', min: 100, R: 46, safeR: 0, tier: 9, hub: false, prison: true, noNPC: true, noCamp: true, noAI: true,
  enemies: ['inmate'], perRoom: [10, 12, 10, 12],
  theme: prisonTheme({ sky: 0x0c1018, h1: 0xb8c8e0, h2: 0x181c28, sun: 0x9fb4d8, ground: '#1a1e28', speck: ['#222836', '#161a24', '#2c3446'], mount: 0x10141e, cloud: 0x20283a }),
  build: function (g, m) { buildPrison(g, m, { wall: 0x4a5060, floor: 0x2c303c, cot: 0x6a5a48, lamp: 0xffd36a, stain: 0x3a2a20 }); } });
MAPS.push({ id: 'prison2', name: 'Prison Room #2', min: 115, R: 46, safeR: 0, tier: 9, hub: false, prison: true, noNPC: true, noCamp: true, noAI: true,
  enemies: ['warden'], perRoom: [10, 12, 10, 12],
  theme: prisonTheme({ sky: 0x140808, h1: 0xe0a8a0, h2: 0x24100e, sun: 0xd88a7a, ground: '#26110f', speck: ['#341816', '#220e0c', '#4a1e1a'], mount: 0x180a08, cloud: 0x3a1a18 }),
  build: function (g, m) { buildPrison(g, m, { wall: 0x5a3a38, floor: 0x2e1c1a, cot: 0x4a3a34, lamp: 0xff5a3a, stain: 0x7a0e0e }); } });
