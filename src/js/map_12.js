/* map_12.js - Promise Wonderland (boss map, opens at level 90): Croczilla (Lv 100 crowned crocodile) + 4 Lv 100 mob types. Mobs drop refine stones + gold only. */
MAPS.push({ id: 'wonder', name: 'Promise Wonderland', min: 90, R: 130, safeR: 12, tier: 9, hub: false, boss: true, noAI: true, bossR: 75, weather: 'ember',
  enemies: ['croczilla'], mobs: ['socmiya', 'kierupt', 'fakeold', 'thesilent'],
  theme: { sky: 0x3a1f4a, fog: [34, 170], hemi: [0xffd9a8, 0x4a2a5a, 0.72], sun: 0xffc880, ground: '#7a5a78', speck: ['#8a6a88', '#6a4a68', '#caa84a'], mount: 0x5a3a6a, cloud: 0xd8a8c8 },
  build: function (g, m) {
    var goldM = stdMat(0xe8b830, { metalness: 0.8, roughness: 0.3, emissive: 0x6a4a00, emissiveIntensity: 0.4 }), bone = stdMat(0xd8d2bc), stone = stdMat(0x8a7a8e, { flatShading: true }), road = stdMat(0x6f6678), brick = stdMat(0xc9a23a, { metalness: 0.4, roughness: 0.5 });
    var emer = stdMat(0x22cc77, { emissive: 0x0a6a3a, emissiveIntensity: 0.7, flatShading: true }), ruby = stdMat(0xff2a55, { emissive: 0x880022, emissiveIntensity: 0.7, flatShading: true }), sapph = stdMat(0x33aaff, { emissive: 0x0a4a88, emissiveIntensity: 0.7, flatShading: true });
    var cash = stdMat(0x5fae6a), cashB = stdMat(0x3f8a50);
    function mesh(geo, mat, x, y, z, ry, shadow) { var o = new THREE.Mesh(geo, mat); o.position.set(x, y, z); if (ry) o.rotation.y = ry; o.castShadow = shadow !== false; o.receiveShadow = true; g.add(o); return o; }
    var clearC = function (x, z) { return Math.hypot(x, z) < m.safeR + 4 || Math.hypot(x, z + m.bossR) < 34 || (Math.abs(x) < 5 && z < -m.safeR && z > -(m.bossR - 20)); };

    // boss dais: golden platform, crown emblem ring, gem pillars
    mesh(new THREE.CylinderGeometry(24, 26, 0.12, 40), goldM, 0, 0.06, -m.bossR, 0, false);
    var ring = new THREE.Mesh(new THREE.RingGeometry(15, 17, 40), new THREE.MeshBasicMaterial({ color: 0xff2a55, side: THREE.DoubleSide })); ring.rotation.x = -Math.PI / 2; ring.position.set(0, 0.14, -m.bossR); g.add(ring);
    for (var i = 0; i < 8; i++) { var a = i / 8 * TAU, px = Math.cos(a) * 30, pz = -m.bossR + Math.sin(a) * 30;
      mesh(new THREE.BoxGeometry(2.4, 9, 2.4), goldM, px, 4.5, pz); mesh(new THREE.OctahedronGeometry(1.4), i % 3 === 0 ? ruby : i % 3 === 1 ? emer : sapph, px, 10.4, pz); addObstacle(px, pz, 1.8); }

    // broken golden road from the safe zone to the dais (gaps + fallen slabs)
    for (var z = -(m.safeR + 4); z > -(m.bossR - 26); z -= 6.4) {
      if (Math.random() < 0.22) continue;
      var sl = mesh(new THREE.BoxGeometry(5.6, 0.14, 5.8), brick, (Math.random() - 0.5) * 0.6, 0.06, z, (Math.random() - 0.5) * 0.12, false); if (Math.random() < 0.3) { sl.rotation.z = (Math.random() - 0.5) * 0.25; sl.position.y = 0.2; }
    }
    scatter(g, [{ geo: geoUp(new THREE.BoxGeometry(4, 0.16, 2.6), 0.08), mat: road }], 70, { rMin: m.safeR + 4, rMax: m.R + 10, sMin: 0.7, sMax: 1.5, obs: 0, gap: 1, shadow: false, clear: clearC });

    // piles of gold / gems / money
    scatter(g, [{ geo: geoUp(new THREE.ConeGeometry(2.4, 2.6, 7), 1.3), mat: goldM }], 36, { rMin: m.safeR + 6, rMax: m.R + 5, sMin: 0.7, sMax: 1.6, obs: 1.2, gap: 1, clear: clearC });
    scatter(g, [{ geo: geoUp(new THREE.OctahedronGeometry(0.9), 0.9), mat: emer }, { geo: geoUp(new THREE.OctahedronGeometry(0.8), 0.8), mat: ruby }, { geo: geoUp(new THREE.OctahedronGeometry(1.0), 1.0), mat: sapph }], 60, { rMin: m.safeR + 6, rMax: m.R + 5, sMin: 0.6, sMax: 1.5, obs: 0.5, gap: 1, clear: clearC });
    scatter(g, [{ geo: geoUp(new THREE.BoxGeometry(2.2, 1.1, 1.2), 0.55), mat: cash }, { geo: geoUp(new THREE.BoxGeometry(1.6, 0.8, 0.9), 0.4), mat: cashB }], 50, { rMin: m.safeR + 6, rMax: m.R + 5, sMin: 0.8, sMax: 1.4, obs: 0.6, gap: 1, clear: clearC });

    // broken buildings: stumpy ruined blocks, leaning walls, snapped pillars
    scatter(g, [{ geo: geoUp(new THREE.BoxGeometry(5, 5.5, 5), 2.75), mat: stone }, { geo: geoUp(new THREE.BoxGeometry(6, 3, 0.7), 1.5), mat: stone }, { geo: geoUp(new THREE.CylinderGeometry(0.8, 1, 6, 6), 3), mat: stone }], 38, { rMin: m.safeR + 8, rMax: m.R + 8, sMin: 0.8, sMax: 1.6, obs: 2.4, gap: 1.5, clear: clearC });
    scatter(g, [{ geo: geoUp(new THREE.BoxGeometry(2.4, 3.4, 2.2), 1.7), mat: stone }], 26, { rMin: m.safeR + 8, rMax: m.R + 8, sMin: 0.7, sMax: 1.3, obs: 0.2, gap: 1, clear: clearC });

    // broken bridges over dark gaps (a few planks missing, posts snapped)
    [[-48, -30, 0.5], [46, -52, -0.4], [-30, -96, 1.2]].forEach(function (b) {
      var bx = b[0], bz = b[1], ry = b[2];
      var gap = mesh(new THREE.BoxGeometry(34, 0.1, 9), stdMat(0x120818), bx, 0.03, bz, ry, false);
      for (var k = -7; k <= 7; k++) { if (Math.random() < 0.28) continue;
        var cx = bx + Math.cos(ry) * k * 2.2, cz = bz - Math.sin(ry) * k * 2.2;
        var pl = mesh(new THREE.BoxGeometry(1.7, 0.22, 5.2), stdMat(0x7a5a3a), cx, 0.5 + (Math.random() < 0.2 ? -0.2 : 0), cz, ry, false); if (Math.random() < 0.25) pl.rotation.z = (Math.random() - 0.5) * 0.4; }
      [-1, 1].forEach(function (s) { for (var k2 = -7; k2 <= 7; k2 += 2) { if (Math.random() < 0.4) continue;
        var cx2 = bx + Math.cos(ry) * k2 * 2.2 + Math.sin(ry) * s * 2.7, cz2 = bz - Math.sin(ry) * k2 * 2.2 + Math.cos(ry) * s * 2.7;
        mesh(new THREE.BoxGeometry(0.3, 1.1 + Math.random() * 0.8, 0.3), stdMat(0x5a3f26), cx2, 0.8, cz2, ry); } });
    });

    // piles of dead skinny mobs: thin bodies, limbs and skulls
    var body = new THREE.BoxGeometry(0.28, 0.9, 0.18), limb = new THREE.BoxGeometry(0.09, 0.85, 0.09), skull = new THREE.SphereGeometry(0.2, 7, 6), rib = new THREE.BoxGeometry(0.4, 0.05, 0.05);
    for (var p = 0; p < 16; p++) {
      var ang = Math.random() * TAU, rad = rand(m.safeR + 8, m.R - 6), cx = Math.cos(ang) * rad, cz = Math.sin(ang) * rad;
      if (clearC(cx, cz)) continue;
      for (var n = 0; n < 9; n++) {
        var ox = cx + rand(-1.7, 1.7), oz = cz + rand(-1.7, 1.7), oy = 0.12 + Math.random() * 0.4;
        var bd = mesh(body, bone, ox, oy, oz, Math.random() * TAU, false); bd.rotation.z = Math.PI / 2 + rand(-0.4, 0.4);
        var l1 = mesh(limb, bone, ox + rand(-0.4, 0.4), oy, oz + rand(-0.4, 0.4), Math.random() * TAU, false); l1.rotation.z = Math.PI / 2 + rand(-0.6, 0.6);
        if (n % 2 === 0) mesh(skull, bone, ox + rand(-0.5, 0.5), oy + 0.1, oz + rand(-0.5, 0.5), 0, false);
        if (n % 3 === 0) mesh(rib, bone, ox, oy + 0.2, oz, Math.random() * TAU, false);
      }
      addObstacle(cx, cz, 1.2);
    }
    addRocks(g, m, 20, 0x6a5a72);
  }
});
