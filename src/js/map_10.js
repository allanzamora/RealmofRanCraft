/* map_10.js - Crocodile Island (min level 60, suggested 60-80): drops the Celestial set */
MAPS.push({ id: 'croc', name: 'Crocodile Island', min: 60, R: 340, safeR: 16, tier: 5, hub: false, weather: 'spores',
  enemies: ['hatchling', 'lurker', 'crocwar', 'bogshaman', 'scalebrute', 'tidehunter', 'crocwarlord', 'sobek'],
  theme: { sky: 0x6fa890, fog: [45, 190], hemi: [0xd8f0e0, 0x2a4a2a, 0.72], sun: 0xfff0c0, ground: '#35552f', speck: ['#2a4a26', '#4a7040', '#6a8a50'], mount: 0x3f6a58, cloud: 0xe0efe6 },
  build: function (g, m) {
    var clear = function (x, z) { return Math.hypot(x, z) < m.safeR + 4; };
    var trunk = geoUp(new THREE.CylinderGeometry(0.22, 0.34, 2.6, 6), 1.3), crown = geoUp(new THREE.ConeGeometry(1.9, 1.6, 7), 3.2), crown2 = geoUp(new THREE.SphereGeometry(1.5, 8, 6), 3.4);
    scatter(g, [{ geo: trunk, mat: stdMat(0x4a3a24) }, { geo: crown2, mat: stdMat(0x2f6a2a, { flatShading: true }) }], 190, { rMin: m.safeR + 4, rMax: m.R + 10, sMin: 0.9, sMax: 1.8, obs: 0.6, gap: 1.4, clear: clear });
    var pool = geoUp(new THREE.CylinderGeometry(4, 4, 0.12, 14), 0.06);
    scatter(g, [{ geo: pool, mat: stdMat(0x2a7a8a, { emissive: 0x0a2a3a, emissiveIntensity: 0.5 }) }], 40, { rMin: m.safeR + 8, rMax: m.R, sMin: 0.8, sMax: 2.4, obs: 0, gap: 1, shadow: false, clear: clear });
    var tooth = geoUp(new THREE.ConeGeometry(0.7, 3.4, 5), 1.7);
    scatter(g, [{ geo: tooth, mat: stdMat(0xe6e0c8, { flatShading: true }) }], 40, { rMin: m.safeR + 10, rMax: m.R + 5, sMin: 0.8, sMax: 1.8, obs: 0.5, gap: 1, clear: clear });
    addRocks(g, m, 60, 0x6f7f6a);
  }
});
