/* map_15.js - Online PvP Arena: real players fight each other here (needs the PvP server, see server/pvp_server.js). Free PK, no drops, no penalty. */
[1, 2, 3, 4, 5].forEach(function (n) { MAPS.push({ id: n === 1 ? 'pvp' : 'pvp' + n, name: 'PvP Arena Room ' + n, min: 10, R: 70, safeR: 0, tier: 4, hub: false, noCamp: true, arena: true, online: true, noAI: true, weather: null, enemies: [],
  theme: { sky: 0x1a2a4a, fog: [45, 190], hemi: [0xc8e0ff, 0x1a2230, 0.95], sun: 0xbcd8ff, ground: '#3a4a60', speck: ['#34445a', '#45566e', '#2a3a50'], mount: 0x1a2438, cloud: 0x5a7aa8 },
  build: function (g, m) {
    var R = m.R;
    var floor = new THREE.Mesh(new THREE.CircleGeometry(R - 1, 56), stdMat(0x56688a)); floor.rotation.x = -Math.PI / 2; floor.position.y = 0.03; floor.receiveShadow = true; g.add(floor);
    [[R - 6, R - 4, 0x2f8fe0], [46, 47.5, 0x1f6fb8], [24, 25.5, 0x1f6fb8]].forEach(function (r) {
      var ring = new THREE.Mesh(new THREE.RingGeometry(r[0], r[1], 64), new THREE.MeshBasicMaterial({ color: r[2], side: THREE.DoubleSide })); ring.rotation.x = -Math.PI / 2; ring.position.y = 0.05; g.add(ring);
    });
    var emblem = new THREE.Mesh(new THREE.CircleGeometry(8, 6), new THREE.MeshBasicMaterial({ color: 0x1f6fb8 })); emblem.rotation.x = -Math.PI / 2; emblem.position.y = 0.06; g.add(emblem);
    var wall = new THREE.Mesh(new THREE.CylinderGeometry(R + 1, R + 1, 9, 64, 1, true), new THREE.MeshStandardMaterial({ color: 0x3a4a64, side: THREE.DoubleSide, roughness: 1 })); wall.position.y = 4.5; g.add(wall);
    var stone = stdMat(0x6a7a96), glow = new THREE.MeshBasicMaterial({ color: 0x66d0ff });
    for (var i = 0; i < 36; i++) {
      var a = i / 36 * TAU, px = Math.cos(a) * (R - 1), pz = Math.sin(a) * (R - 1);
      var pil = new THREE.Mesh(new THREE.BoxGeometry(2.4, 11, 2.4), stone); pil.position.set(px, 5.5, pz); g.add(pil);
      var fl = new THREE.Mesh(new THREE.BoxGeometry(1, 1.2, 1), glow); fl.position.set(px, 11.6, pz); g.add(fl);
    }
    for (var k = 0; k < 6; k++) {       // a few cover pillars
      var b = k / 6 * TAU + 0.3, cx = Math.cos(b) * 36, cz = Math.sin(b) * 36;
      var cp = new THREE.Mesh(new THREE.BoxGeometry(3, 6, 3), stone); cp.position.set(cx, 3, cz); g.add(cp); addObstacle(cx, cz, 2.2);
    }
  }
}); });
