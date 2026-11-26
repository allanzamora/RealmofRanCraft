/* map_04.js - Frostpeak Snowfield (level 25+) */
MAPS.push({ id: 'snow', name: 'Frostpeak Snowfield', min: 25, R: 320, safeR: 11, tier: 3, hub: false, weather: 'snow',
  enemies: ['frostbandit', 'icegoblin', 'icemage', 'draugr', 'berserker', 'yeti', 'frostgiant', 'icequeen'],
  theme: { sky: 0xcfe0ee, fog: [35, 150], hemi: [0xe8f4ff, 0x9ab0c8, 0.95], sun: 0xf0f8ff, ground: '#eef3f8', speck: ['#d0e0ee', '#ffffff', '#c0d4e6'], mount: 0x9ab0c8, cloud: 0xffffff },
  build: function (g, m) {
  var hubClear = function (x, z) { return Math.hypot(x, z) < m.safeR + 4; };
      var st = geoUp(new THREE.CylinderGeometry(0.2, 0.3, 1.6, 6), 0.8), sc1 = geoUp(new THREE.ConeGeometry(1.5, 2.4, 7), 2.4), sc2 = geoUp(new THREE.ConeGeometry(1.1, 2.0, 7), 3.7), sm = stdMat(0xffffff);
      scatter(g, [{ geo: st, mat: stdMat(0x5a4030) }, { geo: sc1, mat: sm, tint: true }, { geo: sc2, mat: sm, tint: true }], 230,
        { rMin: m.safeR + 4, rMax: m.R + 10, sMin: 0.8, sMax: 1.7, obs: 0.55, gap: 1.3, clear: hubClear, color: function () { return hsl(0.45 + Math.random() * 0.12, 0.25, 0.7 + Math.random() * 0.25); } });
      scatter(g, [{ geo: geoUp(new THREE.OctahedronGeometry(1, 0), 1), mat: stdMat(0x8fe0ff, { emissive: 0x2a8ab0, emissiveIntensity: 0.6, transparent: true, opacity: 0.85 }) }], 55,
        { rMin: m.safeR + 8, rMax: m.R, sMin: 1, sMax: 2.2, obs: 0.7, clear: hubClear, scaleFn: function (s) { return [s * 0.7, s * 1.8, s * 0.7]; } });
      scatter(g, [{ geo: new THREE.SphereGeometry(1, 10, 6), mat: stdMat(0xffffff) }], 60,
        { rMin: m.safeR + 6, rMax: m.R + 10, sMin: 2, sMax: 6, shadow: false, y: -0.4, scaleFn: function (s) { return [s, s * 0.35, s]; } });
      addRocks(g, m, 40, 0xb0bccc);
  }
});
