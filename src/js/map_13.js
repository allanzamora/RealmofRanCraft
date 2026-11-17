/* map_13.js - Boss Room (Developer Game Station): no NPCs. Abyss Sovereign, Bad Santa, Croczilla, 7x Dark Swordman, The Game Master. Each boss drops 1 Diamond (70%). */
MAPS.push({ id: 'bossroom', name: 'Boss Room', min: 100, R: 150, safeR: 10, tier: 9, hub: false, boss: true, bossRoom: true, noNPC: true, noCamp: true, noAI: true,
  enemies: ['abyss', 'santa', 'croczilla', 'darksword', 'gamemaster'],
  bossList: [['abyss', 1], ['santa', 1], ['croczilla', 1], ['darksword', 7], ['gamemaster', 1]],
  theme: { sky: 0x050a18, fog: [30, 150], hemi: [0x66ccff, 0x101830, 0.75], sun: 0x88aaff, ground: '#0b1426', speck: ['#10203a', '#0a1830', '#00e5ff'], mount: 0x0a1428, cloud: 0x1a2a4a },
  build: function (g, m) {
    var rack = stdMat(0x141c2e, { metalness: 0.6, roughness: 0.4 }), plate = stdMat(0x1c2742, { metalness: 0.5, roughness: 0.5 });
    var cy = new THREE.MeshBasicMaterial({ color: 0x00e5ff }), mg = new THREE.MeshBasicMaterial({ color: 0xff2bd6 }), gn = new THREE.MeshBasicMaterial({ color: 0x39ff6a }), yl = new THREE.MeshBasicMaterial({ color: 0xffd54f });
    var scr = [cy, mg, gn, yl], keyM = stdMat(0x2a3350, { metalness: 0.3 });
    function mesh(geo, mat, x, y, z, ry, shadow) { var o = new THREE.Mesh(geo, mat); o.position.set(x, y, z); if (ry) o.rotation.y = ry; o.castShadow = shadow !== false; o.receiveShadow = true; g.add(o); return o; }
    // glowing circuit grid on the floor
    for (var i = -7; i <= 7; i++) { mesh(new THREE.BoxGeometry(m.R * 2, 0.03, 0.18), i % 2 ? cy : mg, 0, 0.04, i * 20, 0, false); mesh(new THREE.BoxGeometry(0.18, 0.03, m.R * 2), i % 2 ? mg : cy, i * 20, 0.04, 0, 0, false); }
    // central dais ring (spawn)
    var ring = new THREE.Mesh(new THREE.RingGeometry(m.safeR + 2, m.safeR + 3, 48), new THREE.MeshBasicMaterial({ color: 0x00e5ff, side: THREE.DoubleSide })); ring.rotation.x = -Math.PI / 2; ring.position.y = 0.1; g.add(ring);
    function clearC(x, z) { return Math.hypot(x, z) < m.safeR + 8; }
    // server racks with blinking LED columns
    for (var r = 0; r < 34; r++) {
      var a = r / 34 * TAU, rad = m.R - 8 + rand(-4, 2), x = Math.cos(a) * rad, z = Math.sin(a) * rad, ry = -a + Math.PI / 2;
      mesh(new THREE.BoxGeometry(3, 7, 2), rack, x, 3.5, z, ry);
      for (var k = 0; k < 6; k++) mesh(new THREE.BoxGeometry(2.4, 0.18, 0.1), scr[(r + k) % 4], x - Math.sin(ry) * 1.05 * -1 * 0 + Math.cos(a) * -1.02, 1 + k * 1.05, z + Math.sin(a) * -1.02, ry, false);
      addObstacle(x, z, 2.2);
    }
    // giant monitors on stands
    for (var s = 0; s < 14; s++) {
      var a2 = s / 14 * TAU + 0.2, r2 = rand(50, m.R - 28), x2 = Math.cos(a2) * r2, z2 = Math.sin(a2) * r2; if (clearC(x2, z2)) continue;
      var face = Math.atan2(-x2, -z2);
      mesh(new THREE.BoxGeometry(0.8, 4, 0.8), plate, x2, 2, z2, face); mesh(new THREE.BoxGeometry(9, 5.2, 0.5), rack, x2, 6.4, z2, face);
      mesh(new THREE.BoxGeometry(8.2, 4.4, 0.2), scr[s % 4], x2 + Math.sin(face) * 0.3, 6.4, z2 + Math.cos(face) * 0.3, face, false); addObstacle(x2, z2, 2.4);
    }
    // oversized keyboards (keycap blocks), joystick gamepads, cables
    for (var q = 0; q < 10; q++) {
      var a3 = rand(0, TAU), r3 = rand(40, m.R - 20), x3 = Math.cos(a3) * r3, z3 = Math.sin(a3) * r3; if (clearC(x3, z3)) continue; var ry3 = rand(0, TAU);
      mesh(new THREE.BoxGeometry(14, 0.8, 5), plate, x3, 0.4, z3, ry3, false);
      for (var kx = -5; kx <= 5; kx++) for (var kz = -1; kz <= 1; kz++) mesh(new THREE.BoxGeometry(1, 0.5, 1), keyM, x3 + Math.cos(ry3) * kx * 1.2 - Math.sin(ry3) * kz * 1.3 * -1, 1.0, z3 - Math.sin(ry3) * kx * 1.2 + Math.cos(ry3) * kz * 1.3, ry3, false);
    }
    scatter(g, [{ geo: geoUp(new THREE.BoxGeometry(1.4, 1.1, 1.4), 0.55), mat: keyM }, { geo: geoUp(new THREE.OctahedronGeometry(0.9), 0.9), mat: cy }, { geo: geoUp(new THREE.CylinderGeometry(0.15, 0.15, 3.2, 6), 1.6), mat: mg }], 70, { rMin: m.safeR + 8, rMax: m.R - 12, sMin: 0.7, sMax: 1.6, obs: 0, gap: 1, shadow: false, clear: clearC });
    // glowing "console" logo ring floating over the centre
    var hr = new THREE.Mesh(new THREE.TorusGeometry(7, 0.25, 8, 40), cy); hr.position.set(0, 14, 0); hr.rotation.x = Math.PI / 2; g.add(hr);
    var hr2 = new THREE.Mesh(new THREE.TorusGeometry(5, 0.2, 8, 40), mg); hr2.position.set(0, 14, 0); hr2.rotation.x = Math.PI / 2; hr2.rotation.y = 0.6; g.add(hr2);
  }
});
