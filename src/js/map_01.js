/* map_01.js - Moviex Plains (level 1+) */
function buildVillage(g, m) {
  // village plaza
  var plaza = new THREE.Mesh(new THREE.CircleGeometry(m.safeR, 48), new THREE.MeshStandardMaterial({ color: 0xb9b2a0, roughness: 1 }));
  plaza.rotation.x = -Math.PI / 2; plaza.position.y = 0.02; plaza.receiveShadow = true; g.add(plaza);
  var edge = new THREE.Mesh(new THREE.RingGeometry(m.safeR - 0.45, m.safeR, 64), new THREE.MeshBasicMaterial({ color: 0x6b6354 }));
  edge.rotation.x = -Math.PI / 2; edge.position.y = 0.03; g.add(edge);

  // dirt roads
  var roadMat = new THREE.MeshStandardMaterial({ color: 0x8a6f4a, roughness: 1 });
  [[0, 0], [Math.PI / 2, 0]].forEach(function (a) {
    var r = new THREE.Mesh(new THREE.PlaneGeometry(3.2, m.R * 2 + 40), roadMat);
    r.rotation.x = -Math.PI / 2; r.rotation.z = a[0]; r.position.y = 0.012; r.receiveShadow = true; g.add(r);
  });

  // (safe zone is intentionally empty: only the NPCs and the portal stand here)
}


MAPS.push({ id: 'plains', name: 'Moviex Plains', min: 1, R: 340, safeR: 16, tier: 1, hub: true, weather: null,
  enemies: ['goblin', 'bandit', 'skeleton', 'shaman', 'orc', 'knight', 'warlord', 'demon'],
  theme: { sky: 0x9cc7f0, fog: [60, 200], hemi: [0xdfefff, 0x4a6b3a, 0.78], sun: 0xfff2d0, ground: '#3d8f3d', speck: ['#2a7a2a', '#58b058', '#4aa040'], mount: 0x6f7f95, cloud: 0xffffff },
  build: function (g, m) {
  var hubClear = function (x, z) { return Math.hypot(x, z) < m.safeR + 4; };
  var plainsClear = function (x, z) { return hubClear(x, z) || Math.abs(x) < 2.8 || Math.abs(z) < 2.8; };
    buildVillage(g, m);
    var trunk = geoUp(new THREE.CylinderGeometry(0.18, 0.28, 1.7, 6), 0.85), f1 = geoUp(new THREE.ConeGeometry(1.35, 2.3, 7), 2.35), f2 = geoUp(new THREE.ConeGeometry(1.0, 1.9, 7), 3.4);
    var fm = stdMat(0xffffff);
    scatter(g, [{ geo: trunk, mat: stdMat(0x6a4524) }, { geo: f1, mat: fm, tint: true }, { geo: f2, mat: fm, tint: true }], 230,
      { rMin: m.safeR + 4, rMax: m.R + 10, sMin: 0.8, sMax: 1.7, obs: 0.55, gap: 1.4, clear: plainsClear, color: function () { return hsl(0.27 + Math.random() * 0.06, 0.55, 0.22 + Math.random() * 0.1); } });
    addRocks(g, m, 80, 0x8a8d92);
  }
});
