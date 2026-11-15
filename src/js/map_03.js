/* map_03.js - Scorched Desert (level 17+) */
MAPS.push({ id: 'desert', name: 'Scorched Desert', min: 17, R: 320, safeR: 11, tier: 3, hub: false, weather: null,
  enemies: ['sandbandit', 'nomad', 'scorp', 'mummy', 'wraith', 'anubis', 'sandgolem', 'pharaoh'],
  theme: { sky: 0xf0d8a0, fog: [50, 190], hemi: [0xfff0d0, 0xb08850, 0.9], sun: 0xffe0a0, ground: '#d8b46a', speck: ['#c8a05a', '#e8c88a', '#b89050'], mount: 0xc09060, cloud: 0xfff2d0 },
  build: function (g, m) {
  var hubClear = function (x, z) { return Math.hypot(x, z) < m.safeR + 4; };
      var cb = geoUp(new THREE.CylinderGeometry(0.4, 0.45, 3.4, 8), 1.7), arm = new THREE.CylinderGeometry(0.25, 0.28, 1.6, 7); arm.rotateZ(Math.PI / 2); arm.translate(0.9, 1.9, 0);
      var arm2 = new THREE.CylinderGeometry(0.25, 0.28, 1.6, 7); arm2.rotateZ(Math.PI / 2); arm2.translate(-0.9, 2.5, 0);
      var cm2 = stdMat(0x4a8a3a);
      scatter(g, [{ geo: cb, mat: cm2 }, { geo: arm, mat: cm2 }, { geo: arm2, mat: cm2 }], 110, { rMin: m.safeR + 4, rMax: m.R + 10, sMin: 0.7, sMax: 1.5, obs: 0.6, gap: 1, clear: hubClear });
      scatter(g, [{ geo: new THREE.SphereGeometry(1, 12, 8), mat: stdMat(0xd2ac62) }], 40,
        { rMin: m.safeR + 10, rMax: m.R + 20, sMin: 8, sMax: 18, shadow: false, y: -3, scaleFn: function (s) { return [s * 1.6, s * 0.28, s]; } });
      addRocks(g, m, 70, 0xb8793a);
      [[75, 55], [-80, 40], [10, -100], [-50, -85]].forEach(function (p, i) {
        var py = new THREE.Mesh(new THREE.ConeGeometry(14, 18, 4), stdMat(0xc9a35a, { flatShading: true })); py.rotation.y = Math.PI / 4 + i * 0.3; py.position.set(p[0], 9, p[1]); py.castShadow = true; g.add(py); addObstacle(p[0], p[1], 11);
      });
  }
});
