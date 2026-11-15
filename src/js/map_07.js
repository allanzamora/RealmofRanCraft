/* map_07.js - Blood Arena (level 10+): no monsters, only 20-25 AI players, free PK, no drops */
MAPS.push({ id: 'arena', name: 'Blood Arena', min: 10, R: 90, safeR: 0, tier: 3, hub: false, noCamp: true, arena: true, weather: null, enemies: [],
  theme: { sky: 0x4a3a5a, fog: [45, 190], hemi: [0xffe6c0, 0x3a2a2a, 0.9], sun: 0xffe0b0, ground: '#7a6a55', speck: ['#6a5a48', '#8a7a62', '#5a4a3a'], mount: 0x3a2a3a, cloud: 0x7a6a8a },
  build: function (g, m) {
    var R = m.R;
    var floor = new THREE.Mesh(new THREE.CircleGeometry(R - 1, 56), stdMat(0x9a8a70)); floor.rotation.x = -Math.PI / 2; floor.position.y = 0.03; floor.receiveShadow = true; g.add(floor);
    [[R - 6, R - 4, 0x6a1a1a], [60, 62, 0x5a1010], [30, 32, 0x5a1010]].forEach(function (r) {
      var ring = new THREE.Mesh(new THREE.RingGeometry(r[0], r[1], 64), new THREE.MeshBasicMaterial({ color: r[2], side: THREE.DoubleSide })); ring.rotation.x = -Math.PI / 2; ring.position.y = 0.05; g.add(ring);
    });
    var emblem = new THREE.Mesh(new THREE.CircleGeometry(9, 8), new THREE.MeshBasicMaterial({ color: 0x7a1414 })); emblem.rotation.x = -Math.PI / 2; emblem.position.y = 0.06; g.add(emblem);
    var wall = new THREE.Mesh(new THREE.CylinderGeometry(R + 1, R + 1, 9, 64, 1, true), new THREE.MeshStandardMaterial({ color: 0x6a5a4a, side: THREE.DoubleSide, roughness: 1 })); wall.position.y = 4.5; g.add(wall);
    var stone = stdMat(0x8a7a68), fire = new THREE.MeshBasicMaterial({ color: 0xffa030 });
    for (var i = 0; i < 40; i++) {
      var a = i / 40 * TAU, px = Math.cos(a) * (R - 1), pz = Math.sin(a) * (R - 1);
      var pil = new THREE.Mesh(new THREE.BoxGeometry(2.4, 11, 2.4), stone); pil.position.set(px, 5.5, pz); pil.castShadow = true; g.add(pil);
      var fl = new THREE.Mesh(new THREE.BoxGeometry(1, 1.2, 1), fire); fl.position.set(px, 11.6, pz); g.add(fl);
    }
    for (var k = 0; k < 8; k++) {       // cover pillars inside the arena
      var b = k / 8 * TAU + 0.2, cx = Math.cos(b) * 42, cz = Math.sin(b) * 42;
      var cp = new THREE.Mesh(new THREE.BoxGeometry(3, 6, 3), stone); cp.position.set(cx, 3, cz); cp.castShadow = true; g.add(cp); addObstacle(cx, cz, 2.2);
    }
  }
});
