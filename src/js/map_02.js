/* map_02.js - Whispering Nature (level 9+) */
MAPS.push({ id: 'nature', name: 'Whispering Nature', min: 9, R: 320, safeR: 11, tier: 2, hub: false, weather: 'spore',
  enemies: ['poacher', 'elf', 'druid', 'bark', 'satyr', 'witch', 'ent', 'treant'],
  theme: { sky: 0x8fd1b0, fog: [40, 160], hemi: [0xd0ffe0, 0x2f5a2a, 0.72], sun: 0xf0ffd0, ground: '#2f7a3a', speck: ['#1f6a2a', '#4a9a4a', '#e8e060', '#f08ab0'], mount: 0x4a7a5a, cloud: 0xeafff0 },
  build: function (g, m) {
  var hubClear = function (x, z) { return Math.hypot(x, z) < m.safeR + 4; };
      var tr = geoUp(new THREE.CylinderGeometry(0.28, 0.4, 3.2, 7), 1.6), cn = geoUp(new THREE.SphereGeometry(2.2, 9, 7), 4.2), cn2 = geoUp(new THREE.SphereGeometry(1.6, 8, 6), 6.0), lm = stdMat(0xffffff);
      scatter(g, [{ geo: tr, mat: stdMat(0x5a3a1c) }, { geo: cn, mat: lm, tint: true }, { geo: cn2, mat: lm, tint: true }], 280,
        { rMin: m.safeR + 4, rMax: m.R + 10, sMin: 0.8, sMax: 1.6, obs: 0.7, gap: 1.2, clear: hubClear, color: function () { return hsl(0.25 + Math.random() * 0.1, 0.55, 0.2 + Math.random() * 0.13); } });
      var stalk = geoUp(new THREE.CylinderGeometry(0.2, 0.28, 1.2, 6), 0.6), cap = geoUp(new THREE.SphereGeometry(0.9, 10, 6, 0, TAU, 0, Math.PI / 2), 1.2), cm = stdMat(0xffffff);
      scatter(g, [{ geo: stalk, mat: stdMat(0xeeeadf) }, { geo: cap, mat: cm, tint: true }], 60,
        { rMin: m.safeR + 5, rMax: m.R, sMin: 0.8, sMax: 2.4, obs: 0.4, clear: hubClear, color: function () { return Math.random() < 0.5 ? new THREE.Color(0xd83a3a) : new THREE.Color(0xe8a43a); } });
      scatter(g, [{ geo: geoUp(new THREE.SphereGeometry(0.9, 8, 6), 0.5), mat: stdMat(0x2f8a3a) }], 120, { rMin: m.safeR + 3, rMax: m.R, sMin: 0.6, sMax: 1.5, shadow: false, clear: hubClear });
      for (var pnd = 0; pnd < 6 * AREA; pnd++) {
        var pa = Math.random() * TAU, pr = 30 + Math.random() * (m.R - 40), pd = new THREE.Mesh(new THREE.CircleGeometry(5 + Math.random() * 5, 20), new THREE.MeshStandardMaterial({ color: 0x3a9ad8, roughness: 0.2, transparent: true, opacity: 0.85 }));
        pd.rotation.x = -Math.PI / 2; pd.position.set(Math.cos(pa) * pr, 0.03, Math.sin(pa) * pr); g.add(pd);
      }
      addRocks(g, m, 40, 0x6a7a6a);
  }
});
