/* map_14.js - Prison Room B1 (Lv 120 mobs, needs Lv 100) and Prison Room B2 (Lv 140 mobs, needs Lv 115).
   15-cell block connected by hallways from each cell to the next cell, small central yard,
   no safe zone, no NPCs, no item drops (gold + fixed EXP only). */
E('inmate', 'Death Row Inmate', 120, 'm', 1.2, W('dagger', 0xb8b8c0), { skin: 0xc9a27e, shirt: 0xe8731c, pants: 0xe8731c, hair: null, bald: true, boots: 0x2a2018, eye: 0xff4422 }, { hpMul: 3 });
E('warden', 'Prison Warden', 140, 'b', 1.35, W('greatsword', 0x3a3f4a), { skin: 0xd6b08c, shirt: 0x16233f, pants: 0x0e1630, hair: null, bald: true, helmet: true, armor: 0x22345a, pads: true, padColor: 0x9aa3b8, boots: 0x0a0e1c, eye: 0xffcc33, eyeGlow: true, bulk: 1.15 }, { hpMul: 3 });
(function (a, b) {
  a.xp = 13600; a.fixedXp = true; a.goldOnly = true; a.gold = [3000, 6000]; a.aggro = 12;
  b.xp = 14600; b.fixedXp = true; b.goldOnly = true; b.gold = [4000, 8000]; b.aggro = 12;
})(ENEMY_TYPES.inmate, ENEMY_TYPES.warden);

function buildPrison(g, m, c) {
  var H = 44, WH = 6, TH = 1.2, YARD = 8, HALL_W = 4.6, CELL_W = 11, CELL_D = 8.5;
  var wall = stdMat(c.wall, { flatShading: true, roughness: 0.9 }),
      floor = stdMat(c.floor, { roughness: 0.95 }),
      hallFloor = stdMat(c.hall || 0x1f232d, { roughness: 0.92 }),
      bars = stdMat(0x2a2d33, { metalness: 0.7, roughness: 0.4 }),
      cotM = stdMat(c.cot),
      lamp = new THREE.MeshBasicMaterial({ color: c.lamp }),
      stain = new THREE.MeshBasicMaterial({ color: c.stain, transparent: true, opacity: 0.55 });

  function mesh(geo, mat, x, y, z, ry, shadow) {
    var o = new THREE.Mesh(geo, mat);
    o.position.set(x, y, z);
    if (ry) o.rotation.y = ry;
    o.castShadow = shadow !== false;
    o.receiveShadow = true;
    g.add(o);
    return o;
  }

  function wallSegX(xa, xb, z) {
    var x0 = Math.min(xa, xb), x1 = Math.max(xa, xb), L = x1 - x0;
    if (L <= 0.2) return;
    mesh(new THREE.BoxGeometry(L, WH, TH), wall, (x0 + x1) / 2, WH / 2, z);
    for (var t = 0; t <= L + 0.01; t += 1.6) addObstacle(x0 + t, z, 1.0);
  }

  function wallSegZ(za, zb, x) {
    var z0 = Math.min(za, zb), z1 = Math.max(za, zb), L = z1 - z0;
    if (L <= 0.2) return;
    mesh(new THREE.BoxGeometry(TH, WH, L), wall, x, WH / 2, (z0 + z1) / 2);
    for (var t = 0; t <= L + 0.01; t += 1.6) addObstacle(x, z0 + t, 1.0);
  }

  // Main floor + central yard ring
  mesh(new THREE.BoxGeometry(H * 2 + 4, 0.08, H * 2 + 4), floor, 0, 0.04, 0, 0, false);
  var ring = new THREE.Mesh(
    new THREE.RingGeometry(YARD - 1.0, YARD - 0.5, 40),
    new THREE.MeshBasicMaterial({ color: c.lamp, side: THREE.DoubleSide, transparent: true, opacity: 0.6 })
  );
  ring.rotation.x = -Math.PI / 2;
  ring.position.y = 0.12;
  g.add(ring);

  // Outer perimeter walls with open yard/hallway entryways
  wallSegX(-H, -HALL_W / 2, -H);
  wallSegX(HALL_W / 2, H, -H);
  wallSegX(-H, -HALL_W / 2, H);
  wallSegX(HALL_W / 2, H, H);
  wallSegZ(-H, -HALL_W / 2, -H);
  wallSegZ(HALL_W / 2, H, -H);
  wallSegZ(-H, -HALL_W / 2, H);
  wallSegZ(HALL_W / 2, H, H);

  // North sign
  var cv = document.createElement('canvas');
  cv.width = 512; cv.height = 128;
  var cx = cv.getContext('2d');
  cx.fillStyle = '#0a0c12'; cx.fillRect(0, 0, 512, 128);
  cx.strokeStyle = '#' + ('000000' + c.lamp.toString(16)).slice(-6);
  cx.lineWidth = 6; cx.strokeRect(6, 6, 500, 116);
  cx.fillStyle = cx.strokeStyle; cx.font = 'bold 54px sans-serif';
  cx.textAlign = 'center'; cx.textBaseline = 'middle';
  cx.fillText(m.name.toUpperCase(), 256, 66);
  var sign = new THREE.Mesh(new THREE.PlaneGeometry(14, 3.5), new THREE.MeshBasicMaterial({ map: new THREE.CanvasTexture(cv) }));
  sign.position.set(0, 4.2, -H + TH / 2 + 0.05);
  g.add(sign);

  // 15 Cells arranged in 3 wings of 5 cells, each cell having an end-hallway leading to the next cell
  // Wing 1 (Cells 1-5): North wing along z = -31, x from -27.5 to +27.5 (left-to-right)
  // Wing 2 (Cells 6-10): Middle wing along z = 0 (outside yard), x from +27.5 back to -27.5 (right-to-left)
  // Wing 3 (Cells 11-15): South wing along z = +31, x from -27.5 to +27.5 (left-to-right)
  var cells = [];
  var xs = [-27.5, -13.75, 0, 13.75, 27.5];
  var idx = 1;

  for (var i = 0; i < 5; i++) cells.push({ num: idx++, cx: xs[i], cz: -31, dirX: 1, dirZ: 0 });
  for (var j = 4; j >= 0; j--) cells.push({ num: idx++, cx: xs[j], cz: 0, dirX: -1, dirZ: 0 });
  for (var k = 0; k < 5; k++) cells.push({ num: idx++, cx: xs[k], cz: 31, dirX: 1, dirZ: 0 });

  // Connect central yard to the cellblock corridors
  mesh(new THREE.BoxGeometry(HALL_W, 0.09, 23), hallFloor, 0, 0.05, -19.5, 0, false);
  mesh(new THREE.BoxGeometry(HALL_W, 0.09, 23), hallFloor, 0, 0.05, 19.5, 0, false);

  cells.forEach(function (cell, n) {
    var x0 = cell.cx - CELL_W / 2, x1 = cell.cx + CELL_W / 2;
    var z0 = cell.cz - CELL_D / 2, z1 = cell.cz + CELL_D / 2;
    var hasNext = n < cells.length - 1;
    var next = hasNext ? cells[n + 1] : null;
    var step = CELL_W + 2.75; // spacing between adjacent cell centers (13.75)

    // Back & front cell walls (leave a 4.6m opening on the side facing the central corridor)
    wallSegX(x0, x1, z0);
    wallSegX(x0, x1, z1);

    // Side walls: if connected to next cell along X, put a hallway opening at the end of this cell
    var openRight = hasNext && next.cz === cell.cz && next.cx > cell.cx;
    var openLeft = hasNext && next.cz === cell.cz && next.cx < cell.cx;

    function sideWallZ(xPos, isOpen) {
      if (!isOpen) {
        wallSegZ(z0, z1, xPos);
        return;
      }
      // Hallway passage at the end of the cell (centered on cell.cz, width HALL_W)
      var gapA = cell.cz - HALL_W / 2, gapB = cell.cz + HALL_W / 2;
      wallSegZ(z0, gapA, xPos);
      wallSegZ(gapB, z1, xPos);
      // Bar frame & overhead lamp marking the hallway doorway to the next cell
      mesh(new THREE.BoxGeometry(1.1, WH + 0.8, 1.1), bars, xPos, (WH + 0.8) / 2, gapA);
      mesh(new THREE.BoxGeometry(1.1, WH + 0.8, 1.1), bars, xPos, (WH + 0.8) / 2, gapB);
      mesh(new THREE.BoxGeometry(0.45, 0.45, 0.45), lamp, xPos, WH + 1.0, cell.cz, 0, false);
    }

    sideWallZ(x0, openLeft);
    sideWallZ(x1, openRight);

    // Hallway corridor floor & walls from this cell to the next cell
    if (hasNext) {
      if (next.cz === cell.cz) {
        var midX = (cell.cx + next.cx) / 2;
        var spanX = Math.abs(next.cx - cell.cx);
        mesh(new THREE.BoxGeometry(spanX, 0.09, HALL_W), hallFloor, midX, 0.05, cell.cz, 0, false);
        wallSegX(Math.min(cell.cx, next.cx), Math.max(cell.cx, next.cx), cell.cz - HALL_W / 2);
        wallSegX(Math.min(cell.cx, next.cx), Math.max(cell.cx, next.cx), cell.cz + HALL_W / 2);
      } else {
        // Vertical hallway transition at the end of a wing (Cell 5 -> Cell 6 and Cell 10 -> Cell 11)
        var midZ = (cell.cz + next.cz) / 2;
        var spanZ = Math.abs(next.cz - cell.cz);
        mesh(new THREE.BoxGeometry(HALL_W, 0.09, spanZ), hallFloor, cell.cx, 0.05, midZ, 0, false);
        wallSegZ(Math.min(cell.cz, next.cz), Math.max(cell.cz, next.cz), cell.cx - HALL_W / 2);
        wallSegZ(Math.min(cell.cz, next.cz), Math.max(cell.cz, next.cz), cell.cx + HALL_W / 2);
      }
    }

    // Cot + lamp + bars + floor stain inside each cell (kept clear of hallway openings)
    var cotZ = cell.cz <= 0 ? z0 + 1.6 : z1 - 1.6;
    mesh(new THREE.BoxGeometry(2.8, 0.5, 1.4), cotM, cell.cx, 0.45, cotZ);
    mesh(new THREE.BoxGeometry(0.65, 0.2, 1.0), stdMat(0xd8d2c0), cell.cx - 0.95, 0.8, cotZ, 0, false);
    addObstacle(cell.cx, cotZ, 1.2);

    var lampZ = cell.cz <= 0 ? z0 + 0.8 : z1 - 0.8;
    mesh(new THREE.BoxGeometry(0.4, 0.4, 0.4), lamp, cell.cx, 4.2, lampZ, 0, false);
    for (var b = -2; b <= 2; b++) {
      mesh(new THREE.BoxGeometry(0.12, 2.0, 0.12), bars, cell.cx + b * 0.45, 3.1, lampZ, 0, false);
    }

    var st = new THREE.Mesh(new THREE.CircleGeometry(0.75 + Math.random() * 0.7, 10), stain);
    st.rotation.x = -Math.PI / 2;
    st.position.set(cell.cx + rand(-2.2, 2.2), 0.1, cell.cz + rand(-1.6, 1.6));
    g.add(st);
  });
}

function prisonTheme(a) {
  return { sky: a.sky, fog: [26, 120], hemi: [a.h1, a.h2, 0.8], sun: a.sun, ground: a.ground, speck: a.speck, mount: a.mount, cloud: a.cloud };
}

MAPS.push({
  id: 'prison1', name: 'Prison Room B1', min: 100, R: 48, safeR: 0, tier: 9, hub: false, prison: true, noNPC: true, noCamp: true, noAI: true,
  cellsCount: 15, enemies: ['inmate'], perRoom: [6, 6, 6, 6, 6, 6, 6, 6, 6, 6, 6, 6, 6, 6, 7],
  theme: prisonTheme({ sky: 0x0c1018, h1: 0xb8c8e0, h2: 0x181c28, sun: 0x9fb4d8, ground: '#1a1e28', speck: ['#222836', '#161a24', '#2c3446'], mount: 0x10141e, cloud: 0x20283a }),
  build: function (g, m) { buildPrison(g, m, { wall: 0x4a5060, floor: 0x2c303c, hall: 0x1c202a, cot: 0x6a5a48, lamp: 0xffd36a, stain: 0x3a2a20 }); }
});

MAPS.push({
  id: 'prison2', name: 'Prison Room B2', min: 115, R: 48, safeR: 0, tier: 9, hub: false, prison: true, noNPC: true, noCamp: true, noAI: true,
  cellsCount: 15, enemies: ['warden'], perRoom: [6, 6, 6, 6, 6, 6, 6, 6, 6, 6, 6, 6, 6, 6, 7],
  theme: prisonTheme({ sky: 0x140808, h1: 0xe0a8a0, h2: 0x24100e, sun: 0xd88a7a, ground: '#26110f', speck: ['#341816', '#220e0c', '#4a1e1a'], mount: 0x180a08, cloud: 0x3a1a18 }),
  build: function (g, m) { buildPrison(g, m, { wall: 0x5a3a38, floor: 0x2e1c1a, hall: 0x1e1110, cot: 0x4a3a34, lamp: 0xff5a3a, stain: 0x7a0e0e }); }
});
