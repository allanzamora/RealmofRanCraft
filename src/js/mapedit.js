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
var ME_MC = {};
function mc(c) { return ME_MC[c] || (ME_MC[c] = new THREE.MeshStandardMaterial({ color: c, roughness: 0.95, flatShading: true })); }
function meDecorMesh(kind, r) {
  var M = meMats(), g = new THREE.Group(), s = Math.max(0.3, r);
  function add(geo, mat, y) { var o = new THREE.Mesh(geo, mat); o.position.y = y; o.castShadow = true; o.receiveShadow = true; g.add(o); return o; }
  if (kind === 'rock') { var k = add(new THREE.DodecahedronGeometry(s * 1.15, 0), M.rock, s * 0.45); k.scale.y = 0.8; }
  else if (kind === 'pillar') add(new THREE.CylinderGeometry(s * 0.8, s, s * 4.5, 10), M.pillar, s * 2.25);
  else if (kind === 'crate') add(new THREE.BoxGeometry(s * 1.7, s * 1.7, s * 1.7), M.crate, s * 0.85);
  else if (kind === 'bush') add(new THREE.SphereGeometry(s * 1.1, 8, 6), M.bush, s * 0.7);
  else if (kind === 'cactus') { add(new THREE.CylinderGeometry(s * 0.35, s * 0.4, s * 3.2, 8), mc(0x3c9a4a), s * 1.6); var a1 = add(new THREE.CylinderGeometry(s * 0.2, s * 0.2, s * 1.1, 6), mc(0x3c9a4a), s * 1.9); a1.position.x = s * 0.6; var a2 = add(new THREE.CylinderGeometry(s * 0.2, s * 0.2, s * 0.9, 6), mc(0x3c9a4a), s * 1.5); a2.position.x = -s * 0.6; }
  else if (kind === 'stump') { add(new THREE.CylinderGeometry(s * 0.8, s * 0.95, s * 1.1, 9), mc(0x7a5230), s * 0.55); add(new THREE.CylinderGeometry(s * 0.7, s * 0.7, s * 0.05, 9), mc(0xc9a06a), s * 1.1); }
  else if (kind === 'mushroom') { add(new THREE.CylinderGeometry(s * 0.3, s * 0.35, s * 1.2, 7), mc(0xe8e0cc), s * 0.6); add(new THREE.SphereGeometry(s * 0.95, 9, 6, 0, 6.283, 0, 1.6), mc(0xd94a4a), s * 1.2); }
  else if (kind === 'barrel') { add(new THREE.CylinderGeometry(s * 0.8, s * 0.8, s * 1.6, 10), mc(0x8a5a2e), s * 0.8); add(new THREE.CylinderGeometry(s * 0.84, s * 0.84, s * 0.12, 10), mc(0x3a3a40), s * 0.4); add(new THREE.CylinderGeometry(s * 0.84, s * 0.84, s * 0.12, 10), mc(0x3a3a40), s * 1.2); }
  else if (kind === 'lamp') { add(new THREE.CylinderGeometry(s * 0.18, s * 0.25, s * 6, 6), mc(0x2a2d33), s * 3); add(new THREE.SphereGeometry(s * 0.7, 8, 6), new THREE.MeshBasicMaterial({ color: 0xffd36a }), s * 6.2); }
  else if (kind === 'crystal') { var c1 = add(new THREE.OctahedronGeometry(s * 0.9, 0), new THREE.MeshStandardMaterial({ color: 0x6ad8ff, emissive: 0x1a6a9a, roughness: 0.3, flatShading: true }), s * 1.4); c1.scale.y = 1.9; var c2 = add(new THREE.OctahedronGeometry(s * 0.5, 0), new THREE.MeshStandardMaterial({ color: 0x9a7aff, emissive: 0x3a1a7a, roughness: 0.3, flatShading: true }), s * 0.6); c2.position.x = s * 0.9; c2.scale.y = 1.7; }
  else if (kind === 'tomb') { add(new THREE.BoxGeometry(s * 1.2, s * 1.8, s * 0.4), mc(0x8a8f98), s * 0.9); add(new THREE.BoxGeometry(s * 1.7, s * 0.3, s * 2.2), mc(0x5a5f68), s * 0.15); }
  else if (kind === 'statue') { add(new THREE.BoxGeometry(s * 1.6, s * 0.8, s * 1.6), mc(0x8a8478), s * 0.4); add(new THREE.CylinderGeometry(s * 0.35, s * 0.5, s * 2.2, 8), mc(0xb0aa9a), s * 1.9); add(new THREE.SphereGeometry(s * 0.5, 8, 6), mc(0xb0aa9a), s * 3.3); }
  else if (kind === 'well') { add(new THREE.CylinderGeometry(s * 0.95, s * 1.0, s * 1.0, 12), mc(0x8a8478), s * 0.5); add(new THREE.CylinderGeometry(s * 0.7, s * 0.7, s * 0.06, 12), mc(0x2a5a9a), s * 0.95); var p1 = add(new THREE.BoxGeometry(s * 0.15, s * 2, s * 0.15), mc(0x6a4524), s * 1.8); p1.position.x = s * 0.85; var p2 = add(new THREE.BoxGeometry(s * 0.15, s * 2, s * 0.15), mc(0x6a4524), s * 1.8); p2.position.x = -s * 0.85; add(new THREE.BoxGeometry(s * 2, s * 0.15, s * 0.3), mc(0x6a4524), s * 2.8); }
  else if (kind === 'tent') { var t1 = add(new THREE.ConeGeometry(s * 1.3, s * 1.8, 4), mc(0xd8c090), s * 0.9); t1.rotation.y = Math.PI / 4; }
  else if (kind === 'torch') { add(new THREE.CylinderGeometry(s * 0.12, s * 0.16, s * 3, 5), mc(0x5a3a20), s * 1.5); add(new THREE.ConeGeometry(s * 0.35, s * 0.9, 6), new THREE.MeshBasicMaterial({ color: 0xff8a3a }), s * 3.4); }
  else if (kind === 'hay') { var h1 = add(new THREE.CylinderGeometry(s * 0.8, s * 0.8, s * 1.4, 10), mc(0xd8b84a), s * 0.8); h1.rotation.z = Math.PI / 2; h1.position.y = s * 0.8; }
  else if (kind === 'flower') { add(new THREE.CylinderGeometry(s * 0.05, s * 0.05, s * 1.2, 4), mc(0x3f9a4a), s * 0.6); add(new THREE.SphereGeometry(s * 0.4, 7, 5), mc(0xff7ab8), s * 1.3); }
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
