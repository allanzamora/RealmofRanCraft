/* map_17.js - 5v5 Battle Arena: Mobile-Legends-style MOBA map (3 lanes, towers, minion waves, bases). You + 4 AI allies (blue) vs 5 AI enemies (red). Logic lives in moba.js */
var MOBA_LANES = {
  A: [[-66, 66], [-66, 0], [-66, -66], [0, -66], [66, -66]],      // west edge, then north edge
  B: [[-66, 66], [0, 66], [66, 66], [66, 0], [66, -66]],          // south edge, then east edge
  M: [[-66, 66], [-33, 33], [0, 0], [33, -33], [66, -66]]         // middle diagonal
};
MAPS.push({ id: 'moba', name: '5v5 Battle Arena', min: 10, R: 112, safeR: 0, tier: 4, hub: false, noCamp: true, arena: true, moba: true, noAI: true, portalAt: [-47, 62], weather: null, enemies: [],
  theme: { sky: 0x8ed0f0, fog: [90, 260], hemi: [0xffffff, 0x4a6a3a, 1.0], sun: 0xfff2d0, ground: '#5f9a45', speck: ['#548c3c', '#6aa84e', '#4c7e36'], mount: 0x3a6a4a, cloud: 0xffffff },
  build: function (g, m) {
    var R = m.R;
    function bx(w, h, d, col, x, y, z, ry, op) { var p = { color: col, roughness: 1 }; if (op) { p.transparent = true; p.opacity = op; } var o = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), new THREE.MeshStandardMaterial(p)); o.position.set(x, y, z); if (ry) o.rotation.y = ry; o.receiveShadow = true; g.add(o); return o; }
    var floor = new THREE.Mesh(new THREE.CircleGeometry(R - 1, 56), stdMat(0x6aa84e)); floor.rotation.x = -Math.PI / 2; floor.position.y = 0.03; floor.receiveShadow = true; g.add(floor);
    ['A', 'B', 'M'].forEach(function (k) {                                   // dirt lanes
      var p = MOBA_LANES[k];
      for (var i = 0; i < p.length - 1; i++) {
        var a = p[i], b = p[i + 1], dx = b[0] - a[0], dz = b[1] - a[1], len = Math.hypot(dx, dz);
        bx(9, 0.06, len + 9, 0xb59a68, (a[0] + b[0]) / 2, 0.07, (a[1] + b[1]) / 2, Math.atan2(dx, dz));
      }
    });
    var rv = bx(9, 0.08, 190, 0x4aa8e0, 0, 0.09, 0, Math.PI / 4, 0.75);        // river across the middle (NW -> SE)
    [[-1, 0x3a7fd0], [1, 0xd03a3a]].forEach(function (s) {                    // team bases
      var cx = s[0] * -57, cz = s[0] * 57;
      var plat = new THREE.Mesh(new THREE.CylinderGeometry(15, 16, 0.4, 28), stdMat(s[1] === 0x3a7fd0 ? 0x4a74b8 : 0xb84a4a)); plat.position.set(cx, 0.2, cz); plat.receiveShadow = true; g.add(plat);
      var ring = new THREE.Mesh(new THREE.RingGeometry(11, 12, 40), new THREE.MeshBasicMaterial({ color: s[1], side: THREE.DoubleSide })); ring.rotation.x = -Math.PI / 2; ring.position.set(cx, 0.45, cz); g.add(ring);
    });
    var wall = new THREE.Mesh(new THREE.CylinderGeometry(R + 1, R + 1, 7, 64, 1, true), new THREE.MeshStandardMaterial({ color: 0x5a7a4a, side: THREE.DoubleSide, roughness: 1 })); wall.position.y = 3.5; g.add(wall);
    function laneDist(x, z) {
      var best = 1e9;
      for (var k in MOBA_LANES) { var p = MOBA_LANES[k]; for (var i = 0; i < p.length - 1; i++) {
        var ax = p[i][0], az = p[i][1], bx2 = p[i + 1][0], bz = p[i + 1][1], vx = bx2 - ax, vz = bz - az, t = clamp(((x - ax) * vx + (z - az) * vz) / (vx * vx + vz * vz), 0, 1);
        best = Math.min(best, Math.hypot(x - (ax + vx * t), z - (az + vz * t))); } }
      return best;
    }
    var trunk = stdMat(0x6a4a2a), leaf = stdMat(0x2f7a38), leaf2 = stdMat(0x3f9a46), n = 0, tries = 0;
    while (n < 70 && tries < 800) {                                            // jungle trees between the lanes
      tries++; var a = Math.random() * TAU, r = Math.sqrt(Math.random()) * (R - 8), x = Math.cos(a) * r, z = Math.sin(a) * r;
      if (laneDist(x, z) < 9 || Math.hypot(x + 57, z - 57) < 20 || Math.hypot(x - 57, z + 57) < 20) continue;
      var s = 0.8 + Math.random() * 0.7, t1 = new THREE.Mesh(new THREE.BoxGeometry(0.8 * s, 3 * s, 0.8 * s), trunk); t1.position.set(x, 1.5 * s, z); t1.castShadow = true; g.add(t1);
      var t2 = new THREE.Mesh(new THREE.BoxGeometry(3.2 * s, 2.4 * s, 3.2 * s), Math.random() < 0.5 ? leaf : leaf2); t2.position.set(x, 3.8 * s, z); t2.castShadow = true; g.add(t2);
      if (n % 2 === 0) addObstacle(x, z, 1.1 * s); n++;
    }
    for (var q = 0; q < 26; q++) {                                             // bushes beside the lanes
      var qa = Math.random() * TAU, qr = Math.sqrt(Math.random()) * (R - 12), bxp = Math.cos(qa) * qr, bzp = Math.sin(qa) * qr, ld = laneDist(bxp, bzp);
      if (ld < 5 || ld > 16 || Math.hypot(bxp + 57, bzp - 57) < 16 || Math.hypot(bxp - 57, bzp + 57) < 16) continue;
      var bs = new THREE.Mesh(new THREE.BoxGeometry(2.6, 1.3, 2.6), leaf2); bs.position.set(bxp, 0.65, bzp); g.add(bs);
    }
  }
});
