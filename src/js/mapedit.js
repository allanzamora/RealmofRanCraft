/* mapedit.js - applies Map Editor data (MAP_EDITS) when a map loads: size, safe zone, portal, props, walls, mob spawns.
   The editor itself is the separate file three_bundle_map_editor.html (src/js/mapeditor_ui.js). */
var CUR_EDIT = null, ME_MATS = null;
function mapEditSkipScatter() { return !!(CUR_EDIT && CUR_EDIT.decor); }
function mapEditBegin(m) {
  if (m._R0 === undefined) { m._R0 = m.R; m._S0 = m.safeR; m._P0 = m.portalAt || null; }
  var ed = MAP_EDITS[m.id] || null; CUR_EDIT = ed;
  m.R = (ed && ed.R) || m._R0; m.safeR = (ed && ed.safeR != null) ? ed.safeR : m._S0; m.portalAt = (ed && ed.portal) || m._P0;
}
function meMats() {
  if (!ME_MATS) ME_MATS = {
    trunk: new THREE.MeshStandardMaterial({ color: 0x6a4524, roughness: 1 }), leaf: new THREE.MeshStandardMaterial({ color: 0x2f7f3a, roughness: 1, flatShading: true }),
    rock: new THREE.MeshStandardMaterial({ color: 0x8a8d92, roughness: 1, flatShading: true }), pillar: new THREE.MeshStandardMaterial({ color: 0xb9b2a0, roughness: 1 }),
    crate: new THREE.MeshStandardMaterial({ color: 0x9a6a38, roughness: 1 }), bush: new THREE.MeshStandardMaterial({ color: 0x3f9a4a, roughness: 1, flatShading: true }), wall: new THREE.MeshStandardMaterial({ color: 0x7a7468, roughness: 0.95, flatShading: true })
  };
  return ME_MATS;
}
function meDecorMesh(kind, r) {
  var M = meMats(), g = new THREE.Group(), s = Math.max(0.3, r);
  function add(geo, mat, y) { var o = new THREE.Mesh(geo, mat); o.position.y = y; o.castShadow = true; o.receiveShadow = true; g.add(o); return o; }
  if (kind === 'rock') { var k = add(new THREE.DodecahedronGeometry(s * 1.15, 0), M.rock, s * 0.45); k.scale.y = 0.8; }
  else if (kind === 'pillar') add(new THREE.CylinderGeometry(s * 0.8, s, s * 4.5, 10), M.pillar, s * 2.25);
  else if (kind === 'crate') add(new THREE.BoxGeometry(s * 1.7, s * 1.7, s * 1.7), M.crate, s * 0.85);
  else if (kind === 'bush') add(new THREE.SphereGeometry(s * 1.1, 8, 6), M.bush, s * 0.7);
  else { var k2 = s / 0.55; add(new THREE.CylinderGeometry(0.18 * k2, 0.28 * k2, 1.7 * k2, 6), M.trunk, 0.85 * k2); add(new THREE.ConeGeometry(1.35 * k2, 2.3 * k2, 7), M.leaf, 2.35 * k2); add(new THREE.ConeGeometry(1.0 * k2, 1.9 * k2, 7), M.leaf, 3.4 * k2); }
  return g;
}
function mapEditBuild(m) {
  var ed = CUR_EDIT; if (!ed) return;
  var pt = OBS_TAG; OBS_TAG = 'ed';
  try {
    (ed.decor || []).forEach(function (d) { var g = meDecorMesh(d[0], d[3]); g.position.set(d[1], 0, d[2]); g.rotation.y = (d[1] * 7.3 + d[2] * 3.1) % 6.28; worldGroup.add(g); addObstacle(d[1], d[2], d[3] * (d[0] === 'tree' ? 1 : 1.1)); });
    (ed.walls || []).forEach(function (w) {
      var dx = w[2] - w[0], dz = w[3] - w[1], L = Math.hypot(dx, dz); if (L < 0.5) return;
      var b = new THREE.Mesh(new THREE.BoxGeometry(L, 5, 1.2), meMats().wall); b.position.set((w[0] + w[2]) / 2, 2.5, (w[1] + w[3]) / 2); b.rotation.y = -Math.atan2(dz, dx); b.castShadow = true; b.receiveShadow = true; worldGroup.add(b);
      for (var t = 0; t <= L + 0.01; t += 1.5) addObstacle(w[0] + dx * t / L, w[1] + dz * t / L, 1.0);
    });
  } finally { OBS_TAG = pt; }
}
