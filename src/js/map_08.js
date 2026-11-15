/* map_08.js - Abyss Throne (opens at level 10): ONE Lv 60 boss with boss-only rare drops */
MAPS.push({ id: 'abyss', name: 'Abyss Throne', min: 10, R: 120, safeR: 12, tier: 6, hub: false, boss: true, noAI: true, bossR: 70, weather: 'ember', enemies: ['abyss'],
  theme: { sky: 0x120818, fog: [25, 130], hemi: [0xb080ff, 0x140a22, 0.6], sun: 0xaa66ff, ground: '#1a1024', speck: ['#2a1a3a', '#120a1c', '#6a2aaa'], mount: 0x0a0612, cloud: 0x2a1a3a },
  build: function (g, m) {
    var obs = stdMat(0x14081e, { emissive: 0x5a1a9a, emissiveIntensity: 0.7 }), glow = new THREE.MeshBasicMaterial({ color: 0xcc66ff });
    var path = new THREE.Mesh(new THREE.PlaneGeometry(6, m.bossR - m.safeR), stdMat(0x2a1a3a)); path.rotation.x = -Math.PI / 2; path.position.set(0, 0.04, -(m.safeR + m.bossR) / 2); path.receiveShadow = true; g.add(path);
    var dais = new THREE.Mesh(new THREE.CylinderGeometry(20, 22, 0.12, 40), stdMat(0x2a1a3a)); dais.position.set(0, 0.06, -m.bossR); dais.receiveShadow = true; g.add(dais);
    var rune = new THREE.Mesh(new THREE.RingGeometry(12, 14, 40), new THREE.MeshBasicMaterial({ color: 0xaa44ff, side: THREE.DoubleSide })); rune.rotation.x = -Math.PI / 2; rune.position.set(0, 0.14, -m.bossR); g.add(rune);
    for (var i = 0; i < 10; i++) {
      var a = i / 10 * TAU, x = Math.cos(a) * 26, z = -m.bossR + Math.sin(a) * 26;
      var ob = new THREE.Mesh(new THREE.BoxGeometry(2.2, 14, 2.2), obs); ob.position.set(x, 7, z); ob.castShadow = true; g.add(ob);
      var cr = new THREE.Mesh(new THREE.OctahedronGeometry(1.2), glow); cr.position.set(x, 15.5, z); g.add(cr); addObstacle(x, z, 1.8);
    }
    scatter(g, [{ geo: geoUp(new THREE.ConeGeometry(1.3, 8, 5), 4), mat: stdMat(0x180a26, { emissive: 0x3a1066, emissiveIntensity: 0.8, flatShading: true }) }], 60,
      { rMin: m.safeR + 6, rMax: m.R + 10, sMin: 0.6, sMax: 1.6, obs: 0.9, gap: 1, clear: function (x, z) { return Math.abs(x) < 5 && z < 0 || Math.hypot(x, z + m.bossR) < 32 || Math.hypot(x, z) < m.safeR + 4; } });
    addRocks(g, m, 30, 0x241830);
  }
});
