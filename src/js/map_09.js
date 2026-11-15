/* map_09.js - Bad Santa's Lair (opens at level 50): ONE Lv 60 giant boss that casts skills; drops Crimson Eye Blade / Clockwork Fairy Wings */
MAPS.push({ id: 'santa', name: "Bad Santa's Lair", min: 50, R: 130, safeR: 12, tier: 7, hub: false, boss: true, noAI: true, bossR: 75, weather: 'snow', enemies: ['santa'],
  theme: { sky: 0x1a2a40, fog: [30, 150], hemi: [0xbfe0ff, 0x203040, 0.7], sun: 0xffe6c0, ground: '#dfe8f0', speck: ['#ffffff', '#c8d8e8', '#a8c0d8'], mount: 0x7890a8, cloud: 0xcfdcea },
  build: function (g, m) {
    var red = stdMat(0xc41e1e), white = stdMat(0xf4f4f4), green = stdMat(0x1f6a34, { flatShading: true }), gold = new THREE.MeshBasicMaterial({ color: 0xffd54f });
    var path = new THREE.Mesh(new THREE.PlaneGeometry(6, m.bossR - m.safeR), stdMat(0x8a2a2a)); path.rotation.x = -Math.PI / 2; path.position.set(0, 0.04, -(m.safeR + m.bossR) / 2); path.receiveShadow = true; g.add(path);
    var dais = new THREE.Mesh(new THREE.CylinderGeometry(24, 26, 0.12, 40), stdMat(0xe8eef4)); dais.position.set(0, 0.06, -m.bossR); dais.receiveShadow = true; g.add(dais);
    var ring = new THREE.Mesh(new THREE.RingGeometry(15, 17, 40), new THREE.MeshBasicMaterial({ color: 0xd01818, side: THREE.DoubleSide })); ring.rotation.x = -Math.PI / 2; ring.position.set(0, 0.14, -m.bossR); g.add(ring);
    for (var i = 0; i < 12; i++) {                 // candy-cane pillars + giant gifts around the dais
      var a = i / 12 * TAU, x = Math.cos(a) * 30, z = -m.bossR + Math.sin(a) * 30;
      if (i % 2) { var gb = new THREE.Mesh(new THREE.BoxGeometry(4, 4, 4), red); gb.position.set(x, 2, z); gb.castShadow = true; g.add(gb);
        var rb = new THREE.Mesh(new THREE.BoxGeometry(4.1, 4.1, 0.7), gold); rb.position.set(x, 2, z); g.add(rb); addObstacle(x, z, 2.8); }
      else { for (var k = 0; k < 7; k++) { var sg = new THREE.Mesh(new THREE.BoxGeometry(1.2, 2, 1.2), k % 2 ? white : red); sg.position.set(x, 1 + k * 2, z); sg.castShadow = true; g.add(sg); } addObstacle(x, z, 1.4); }
    }
    scatter(g, [{ geo: geoUp(new THREE.ConeGeometry(2, 7, 6), 3.5), mat: green }, { geo: geoUp(new THREE.BoxGeometry(2.4, 2.4, 2.4), 1.2), mat: red }], 70,
      { rMin: m.safeR + 6, rMax: m.R + 10, sMin: 0.7, sMax: 1.5, obs: 1.2, gap: 1, clear: function (x, z) { return Math.abs(x) < 5 && z < 0 || Math.hypot(x, z + m.bossR) < 36 || Math.hypot(x, z) < m.safeR + 4; } });
    addRocks(g, m, 25, 0x9fb0c4);
  }
});
