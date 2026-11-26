/* map_14.js - Prison Room B1 (Lv 120 mobs, needs Lv 100) and Prison Room B2 (Lv 140 mobs, needs Lv 115).
   Layout matches diagram: white circular safe zone on the left, red walls forming cell bays,
   and 7-mob clusters in each cell bay (gold + fixed EXP only). */
E('inmate', 'Death Row Inmate', 120, 'm', 1.2, W('dagger', 0xb8b8c0), { skin: 0xc9a27e, shirt: 0xe8731c, pants: 0xe8731c, hair: null, bald: true, boots: 0x2a2018, eye: 0xff4422 }, { hpMul: 3 });
E('warden', 'Prison Warden', 140, 'b', 1.35, W('greatsword', 0x3a3f4a), { skin: 0xd6b08c, shirt: 0x16233f, pants: 0x0e1630, hair: null, bald: true, helmet: true, armor: 0x22345a, pads: true, padColor: 0x9aa3b8, boots: 0x0a0e1c, eye: 0xffcc33, eyeGlow: true, bulk: 1.15 }, { hpMul: 3 });
(function (a, b) {
  a.xp = 13600; a.fixedXp = true; a.goldOnly = true; a.gold = [3000, 6000]; a.aggro = 12;
  b.xp = 14600; b.fixedXp = true; b.goldOnly = true; b.gold = [4000, 8000]; b.aggro = 12;
})(ENEMY_TYPES.inmate, ENEMY_TYPES.warden);

function buildPrisonLayout(g, m, c) {
  var W_MAP = 104, D_MAP = 62, WH = 6, TH = 1.4;
  var SAFE_X = -40, SAFE_Z = 0, SAFE_R = 11;

  // 4 columns along X, 2 rows along Z (8 cell bays total, matching the drawing)
  var COL_X = [-18, -3, 12, 27, 42]; // 5 vertical divider lines -> 4 cell columns
  var TOP_Z = -22, MID_Z = 0, BOT_Z = 22;

  var floorMat = stdMat(c.floor || 0x14161a, { roughness: 0.95 });
  var safeFloorMat = stdMat(0xf8fafc, { roughness: 0.7 });
  var redWallMat = stdMat(c.redWall || 0xb93838, { flatShading: true, roughness: 0.85 });
  var barsMat = stdMat(0x2a2d33, { metalness: 0.7, roughness: 0.4 });
  var lampMat = new THREE.MeshBasicMaterial({ color: c.lamp || 0xff9f43 });

  function mesh(geo, mat, x, y, z, ry, shadow) {
    var o = new THREE.Mesh(geo, mat);
    o.position.set(x, y, z);
    if (ry) o.rotation.y = ry;
    o.castShadow = shadow !== false;
    o.receiveShadow = true;
    g.add(o);
    return o;
  }

  function wallX(xa, xb, z, withGate) {
    var x0 = Math.min(xa, xb), x1 = Math.max(xa, xb), L = x1 - x0;
    if (L <= 0.2) return;
    if (!withGate || L < 7) {
      mesh(new THREE.BoxGeometry(L, WH, TH), redWallMat, (x0 + x1) / 2, WH / 2, z);
      for (var t = 0; t <= L + 0.01; t += 1.5) addObstacle(x0 + t, z, 1.0);
      return;
    }
    var mid = (x0 + x1) / 2, gap = 2.6;
    var segA = (mid - gap) - x0, segB = x1 - (mid + gap);
    if (segA > 0.2) {
      mesh(new THREE.BoxGeometry(segA, WH, TH), redWallMat, x0 + segA / 2, WH / 2, z);
      for (var a = 0; a <= segA + 0.01; a += 1.5) addObstacle(x0 + a, z, 1.0);
    }
    if (segB > 0.2) {
      mesh(new THREE.BoxGeometry(segB, WH, TH), redWallMat, (mid + gap) + segB / 2, WH / 2, z);
      for (var b = 0; b <= segB + 0.01; b += 1.5) addObstacle((mid + gap) + b, z, 1.0);
    }
    mesh(new THREE.BoxGeometry(0.9, WH + 0.6, 0.9), barsMat, mid - gap, (WH + 0.6) / 2, z);
    mesh(new THREE.BoxGeometry(0.9, WH + 0.6, 0.9), barsMat, mid + gap, (WH + 0.6) / 2, z);
  }

  function wallZ(za, zb, x, withGate) {
    var z0 = Math.min(za, zb), z1 = Math.max(za, zb), L = z1 - z0;
    if (L <= 0.2) return;
    if (!withGate || L < 7) {
      mesh(new THREE.BoxGeometry(TH, WH, L), redWallMat, x, WH / 2, (z0 + z1) / 2);
      for (var t = 0; t <= L + 0.01; t += 1.5) addObstacle(x, z0 + t, 1.0);
      return;
    }
    var mid = (z0 + z1) / 2, gap = 2.6;
    var segA = (mid - gap) - z0, segB = z1 - (mid + gap);
    if (segA > 0.2) {
      mesh(new THREE.BoxGeometry(TH, WH, segA), redWallMat, x, WH / 2, z0 + segA / 2);
      for (var a = 0; a <= segA + 0.01; a += 1.5) addObstacle(x, z0 + a, 1.0);
    }
    if (segB > 0.2) {
      mesh(new THREE.BoxGeometry(TH, WH, segB), redWallMat, x, WH / 2, (mid + gap) + segB / 2);
      for (var b = 0; b <= segB + 0.01; b += 1.5) addObstacle(x, (mid + gap) + b, 1.0);
    }
    mesh(new THREE.BoxGeometry(0.9, WH + 0.6, 0.9), barsMat, x, (WH + 0.6) / 2, mid - gap);
    mesh(new THREE.BoxGeometry(0.9, WH + 0.6, 0.9), barsMat, x, (WH + 0.6) / 2, mid + gap);
  }

  // Ground floor
  mesh(new THREE.BoxGeometry(W_MAP + 12, 0.08, D_MAP + 12), floorMat, 0, 0.04, 0, 0, false);

  // White Safe Zone circle on the left (matching the white circle in the photo)
  var safeDisc = new THREE.Mesh(
    new THREE.CircleGeometry(SAFE_R, 48),
    safeFloorMat
  );
  safeDisc.rotation.x = -Math.PI / 2;
  safeDisc.position.set(SAFE_X, 0.09, SAFE_Z);
  safeDisc.receiveShadow = true;
  g.add(safeDisc);

  var safeRing = new THREE.Mesh(
    new THREE.RingGeometry(SAFE_R - 0.55, SAFE_R, 48),
    new THREE.MeshBasicMaterial({ color: 0xffffff, side: THREE.DoubleSide })
  );
  safeRing.rotation.x = -Math.PI / 2;
  safeRing.position.set(SAFE_X, 0.14, SAFE_Z);
  g.add(safeRing);

  // Outer perimeter red walls
  wallX(-48, 42, TOP_Z, false);
  wallX(-48, 42, BOT_Z, false);
  wallZ(TOP_Z, BOT_Z, -48, false);
  wallZ(TOP_Z, BOT_Z, 42, false);

  // Horizontal red divider wall down the middle
  wallX(COL_X[0], COL_X[COL_X.length - 1], MID_Z, false);

  // Vertical red walls dividing the 4 columns (with doorway openings on the left/front side)
  for (var i = 0; i < COL_X.length; i++) {
    var vx = COL_X[i];
    // Top half vertical wall (with opening for players to enter top cells)
    wallZ(TOP_Z, MID_Z, vx, i > 0);
    // Bottom half vertical wall (with opening for players to enter bottom cells)
    wallZ(MID_Z, BOT_Z, vx, i > 0);
    mesh(new THREE.BoxGeometry(0.45, 0.45, 0.45), lampMat, vx, WH + 0.9, MID_Z, 0, false);
  }

  // Store 8 cell bay centers so enemy spawners can place 7 mobs inside each bay
  m.safePos = { x: SAFE_X, z: SAFE_Z, r: SAFE_R };
  m.cellCenters = [];
  for (var cIdx = 0; cIdx < COL_X.length - 1; cIdx++) {
    var cx = (COL_X[cIdx] + COL_X[cIdx + 1]) / 2;
    m.cellCenters.push({ x: cx, z: (TOP_Z + MID_Z) / 2 }); // top row cell
    m.cellCenters.push({ x: cx, z: (MID_Z + BOT_Z) / 2 }); // bottom row cell
  }

  // Map sign near top wall
  var cv = document.createElement('canvas');
  cv.width = 512; cv.height = 128;
  var cx2d = cv.getContext('2d');
  cx2d.fillStyle = '#111318'; cx2d.fillRect(0, 0, 512, 128);
  cx2d.strokeStyle = '#ff6b4a'; cx2d.lineWidth = 6; cx2d.strokeRect(6, 6, 500, 116);
  cx2d.fillStyle = '#ffffff'; cx2d.font = 'bold 50px sans-serif';
  cx2d.textAlign = 'center'; cx2d.textBaseline = 'middle';
  cx2d.fillText(m.name.toUpperCase(), 256, 66);
  var sign = new THREE.Mesh(new THREE.PlaneGeometry(14, 3.5), new THREE.MeshBasicMaterial({ map: new THREE.CanvasTexture(cv) }));
  sign.position.set(-18, 4.2, TOP_Z + TH / 2 + 0.08);
  g.add(sign);
}

function prisonTheme(a) {
  return { sky: a.sky, fog: [32, 130], hemi: [a.h1, a.h2, 0.85], sun: a.sun, ground: a.ground, speck: a.speck, mount: a.mount, cloud: a.cloud };
}

MAPS.push({
  id: 'prison1', name: 'Prison Room B1', min: 100, R: 52, safeR: 11, safePos: { x: -40, z: 0 },
  tier: 9, hub: false, prison: true, noNPC: true, noCamp: true, noAI: true,
  enemies: ['inmate'], perRoom: [7, 7, 7, 7, 7, 7, 7, 7],
  theme: prisonTheme({ sky: 0x0c0e12, h1: 0xd0d8e8, h2: 0x16181f, sun: 0xb8c4d8, ground: '#14161a', speck: ['#1c1f26', '#101216', '#252932'], mount: 0x0e1015, cloud: 0x1c2028 }),
  build: function (g, m) { buildPrisonLayout(g, m, { floor: 0x14161a, redWall: 0xb83838, lamp: 0xf59e0b }); }
});

MAPS.push({
  id: 'prison2', name: 'Prison Room B2', min: 115, R: 52, safeR: 11, safePos: { x: -40, z: 0 },
  tier: 9, hub: false, prison: true, noNPC: true, noCamp: true, noAI: true,
  enemies: ['warden'], perRoom: [7, 7, 7, 7, 7, 7, 7, 7],
  theme: prisonTheme({ sky: 0x120909, h1: 0xe6b8b0, h2: 0x221010, sun: 0xd88e82, ground: '#181010', speck: ['#241616', '#140c0c', '#321e1e'], mount: 0x120909, cloud: 0x281616 }),
  build: function (g, m) { buildPrisonLayout(g, m, { floor: 0x181010, redWall: 0xc53030, lamp: 0xf97316 }); }
});
