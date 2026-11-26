/* map_06.js - Hellfire Demon Realm (level 41+) */
MAPS.push({ id: 'demon', name: 'Hellfire Demon Realm', min: 41, R: 320, safeR: 11, tier: 5, hub: false, weather: 'ember',
  enemies: ['imp', 'cultist', 'fallen', 'hellknight', 'lavabrute', 'demonmage', 'pitlord', 'malphas'],
  theme: { sky: 0x3a0a0a, fog: [30, 140], hemi: [0xff8a6a, 0x3a0a0a, 0.65], sun: 0xff6a3a, ground: '#2a0d0d', speck: ['#4a1010', '#1a0505', '#ff5a1a'], mount: 0x2a0505, cloud: 0x4a1515 },
  build: function (g, m) {
  var hubClear = function (x, z) { return Math.hypot(x, z) < m.safeR + 4; };
      var sp = geoUp(new THREE.ConeGeometry(1.4, 9, 6), 4.5);
      scatter(g, [{ geo: sp, mat: stdMat(0x180808, { emissive: 0x330000, emissiveIntensity: 0.8, flatShading: true }) }], 130,
        { rMin: m.safeR + 4, rMax: m.R + 10, sMin: 0.6, sMax: 1.6, obs: 0.9, gap: 1, clear: hubClear, scaleFn: function (s) { return [s, s * rand(0.6, 1.7), s]; } });
      scatter(g, [{ geo: geoUp(new THREE.CylinderGeometry(0.5, 0.6, 6, 7), 3), mat: stdMat(0xd8cfae) }], 40, { rMin: m.safeR + 6, rMax: m.R, sMin: 0.7, sMax: 1.4, obs: 0.7, clear: hubClear });
      var lava = new THREE.MeshBasicMaterial({ color: 0xff5a1a });
      for (var lv = 0; lv < 34 * AREA; lv++) {
        var la = Math.random() * TAU, lr = m.safeR + 10 + Math.random() * (m.R - m.safeR - 10), lp2 = new THREE.Mesh(new THREE.CircleGeometry(3 + Math.random() * 7, 18), lava);
        lp2.rotation.x = -Math.PI / 2; lp2.position.set(Math.cos(la) * lr, 0.04, Math.sin(la) * lr); g.add(lp2);
      }
      addRocks(g, m, 60, 0x2a1a1a);
  }
});
