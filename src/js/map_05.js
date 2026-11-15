/* map_05.js - Neon Ruins City (level 33+) */
MAPS.push({ id: 'city', name: 'Neon Ruins City', min: 33, R: 320, safeR: 11, tier: 4, hub: false, weather: null,
  enemies: ['thug', 'punk', 'guard', 'assassin', 'zombie', 'ninja', 'mech', 'overlord'],
  theme: { sky: 0x5a6690, fog: [40, 160], hemi: [0xb0b8e0, 0x30344a, 0.7], sun: 0xc0c8ff, ground: '#3a3d44', speck: ['#2f3238', '#4a4e58', '#55596a'], mount: 0x2a3050, cloud: 0x555a78 },
  build: function (g, m) {
  var hubClear = function (x, z) { return Math.hypot(x, z) < m.safeR + 4; };
      var bg = geoUp(new THREE.BoxGeometry(1, 1, 1), 0.5), bm = new THREE.MeshStandardMaterial({ map: windowTexture(), emissiveMap: windowTexture(), emissive: 0xffffff, emissiveIntensity: 0.6, roughness: 0.8, color: 0xffffff });
      scatter(g, [{ geo: bg, mat: bm, tint: true }], 85,
        { rMin: m.safeR + 8, rMax: m.R + 4, sMin: 1, sMax: 1, gap: 3, clear: hubClear, receive: true,
          scaleFn: function () { return [rand(7, 13), rand(14, 44), rand(7, 13)]; }, obsFn: function (sc) { return Math.max(sc[0], sc[2]) * 0.55; },
          color: function () { return hsl(0.6 + Math.random() * 0.1, 0.3, 0.45 + Math.random() * 0.3); } });
      var lp = geoUp(new THREE.CylinderGeometry(0.1, 0.14, 4.4, 6), 2.2), lb = geoUp(new THREE.SphereGeometry(0.4, 8, 6), 4.5);
      scatter(g, [{ geo: lp, mat: stdMat(0x2a2a30) }, { geo: lb, mat: new THREE.MeshBasicMaterial({ color: 0xffd88a }) }], 70, { rMin: m.safeR + 3, rMax: m.R, sMin: 1, sMax: 1, obs: 0.3, clear: hubClear, shadow: false });
      scatter(g, [{ geo: geoUp(new THREE.BoxGeometry(3.6, 1.3, 1.7), 0.65), mat: stdMat(0xffffff), tint: true }], 36,
        { rMin: m.safeR + 5, rMax: m.R, sMin: 1, sMax: 1.2, obs: 1.7, clear: hubClear, color: function () { return hsl(Math.random(), 0.5, 0.4); } });
      addRocks(g, m, 25, 0x55596a);
  }
});
