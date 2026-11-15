/* map_11.js - Death Prison (min level 80, suggested 80-100): drops the Celestial set */
MAPS.push({ id: 'prison', name: 'Death Prison', min: 80, R: 340, safeR: 16, tier: 5, hub: false, weather: 'ember',
  enemies: ['inmate', 'ghoul', 'warden', 'jailer', 'executioner', 'reaper', 'prisonlord', 'azrael'],
  theme: { sky: 0x0e0e16, fog: [28, 150], hemi: [0x9a9ac8, 0x14141c, 0.55], sun: 0x8a8ad0, ground: '#25252c', speck: ['#34343c', '#16161c', '#4a4a58'], mount: 0x16161e, cloud: 0x2a2a38 },
  build: function (g, m) {
    var clear = function (x, z) { return Math.hypot(x, z) < m.safeR + 4; };
    var wall = stdMat(0x3a3a46, { flatShading: true }), iron = stdMat(0x1a1a22, { metalness: 0.6, roughness: 0.5 }), glowM = stdMat(0x2a1040, { emissive: 0x7a2aaa, emissiveIntensity: 0.8 });
    scatter(g, [{ geo: geoUp(new THREE.BoxGeometry(2.4, 9, 2.4), 4.5), mat: wall }], 70, { rMin: m.safeR + 6, rMax: m.R + 10, sMin: 0.7, sMax: 1.5, obs: 1.0, gap: 1.4, clear: clear });
    var bars = [];
    scatter(g, [{ geo: geoUp(new THREE.BoxGeometry(0.2, 5, 0.2), 2.5), mat: iron }, { geo: geoUp(new THREE.BoxGeometry(5, 0.2, 0.2), 4.4), mat: iron }], 80, { rMin: m.safeR + 6, rMax: m.R, sMin: 0.8, sMax: 1.4, obs: 0.4, gap: 1, clear: clear });
    scatter(g, [{ geo: geoUp(new THREE.OctahedronGeometry(0.9), 1.2), mat: glowM }], 55, { rMin: m.safeR + 8, rMax: m.R + 5, sMin: 0.6, sMax: 1.4, obs: 0.4, gap: 1, clear: clear });
    scatter(g, [{ geo: geoUp(new THREE.SphereGeometry(0.45, 6, 5), 0.4), mat: stdMat(0xd8d4c0) }], 60, { rMin: m.safeR + 6, rMax: m.R, sMin: 0.7, sMax: 1.3, obs: 0, gap: 1, shadow: false, clear: clear });
    addRocks(g, m, 50, 0x2a2a34);
  }
});
