/* map_16.js - Golden Room (Lv 100 mobs, needs Lv 100 + a Golden Key). Prison layout in gold; living treasure-box mobs. Gold only (15k per kill), no item drops. */
E('goldbox', 'Golden Box', 100, 'm', 1.2, null, { skin: 0xffd23a, shirt: 0xffd23a, pants: 0xffd23a, hair: null, bald: true, boots: 0xb8860b, eye: 0xff4422 }, { hpMul: 3 });
(function (a) {
  a.xp = 15000; a.fixedXp = true; a.goldOnly = true; a.gold = [15000, 15000]; a.aggro = 12; a.box = true; a.range = 2.0;
})(ENEMY_TYPES.goldbox);

/* box-style mob model: a golden chest with a lid, glowing eyes, stubby legs and a lock */
function attachBox(c) {
  var g = new THREE.Group(), gold = stdMat(0xffc82a, { metalness: 0.8, roughness: 0.3, emissive: 0x6a4a00 }), dark = stdMat(0x7a5200, { metalness: 0.6, roughness: 0.5 });
  var body = new THREE.Mesh(new THREE.BoxGeometry(1.6, 1.1, 1.3), gold); body.position.y = 1.0; body.castShadow = true; g.add(body);
  var lid = new THREE.Group(); lid.position.set(0, 1.55, -0.65); g.add(lid);
  var lm = new THREE.Mesh(new THREE.BoxGeometry(1.7, 0.45, 1.4), gold); lm.position.set(0, 0.22, 0.65); lm.castShadow = true; lid.add(lm);
  var band = new THREE.Mesh(new THREE.BoxGeometry(0.3, 1.2, 1.45), dark); band.position.set(0, 0.95, 0); g.add(band);
  var band2 = new THREE.Mesh(new THREE.BoxGeometry(0.34, 0.5, 1.5), dark); band2.position.set(0, 0.22, 0.65); lid.add(band2);
  var lock = new THREE.Mesh(new THREE.BoxGeometry(0.34, 0.34, 0.14), stdMat(0xfff2a0, { metalness: 0.9, roughness: 0.2 })); lock.position.set(0, 1.35, 0.7); g.add(lock);
  var eyeM = new THREE.MeshBasicMaterial({ color: 0xff3a1a });
  [-0.35, 0.35].forEach(function (x) { var e = new THREE.Mesh(new THREE.BoxGeometry(0.22, 0.22, 0.1), eyeM); e.position.set(x, 1.65, 0.66); g.add(e); });
  var legs = [];
  [[-0.5, 0.4], [0.5, 0.4], [-0.5, -0.4], [0.5, -0.4]].forEach(function (p) { var l = new THREE.Mesh(new THREE.BoxGeometry(0.4, 0.5, 0.4), dark); l.position.set(p[0], 0.25, p[1]); l.castShadow = true; g.add(l); legs.push(l); });
  g.scale.setScalar(1.3);
  c.g.add(g); c.box = { g: g, lid: lid, legs: legs }; c.rig.body.visible = false; c.tag.spr.position.y = 3.2;
  g.traverse(function (o) { if (o.material && o.material.emissive) c.mats.push(o.material); });
}
function animBox(c, dt, spd) {
  var m = c.box, t = performance.now() / 1000, mv = Math.min(1, (spd || 0) / 6);
  m.g.position.y = Math.abs(Math.sin(c.phase * 1.2)) * 0.35 * mv;
  for (var k = 0; k < 4; k++) m.legs[k].position.y = 0.25 + Math.max(0, Math.sin(c.phase + (k % 2) * Math.PI)) * 0.15 * mv;
  var open = 0.15 + Math.sin(t * 2) * 0.05;
  if (c.anim && c.anim.type === 'attack') open = Math.sin(Math.min(1, c.anim.t / c.anim.dur) * Math.PI) * 1.0;
  m.lid.rotation.x = -open;
  if (c.anim && c.anim.type === 'death') { var k2 = Math.min(1, c.anim.t / c.anim.dur); m.g.rotation.z = k2 * 1.45; m.g.position.y = -k2 * 0.1; }
  else m.g.rotation.z = 0;
}

MAPS.push({ id: 'goldroom', name: 'Golden Room', min: 100, key: true, R: 46, safeR: 0, tier: 9, hub: false, prison: true, noNPC: true, noCamp: true, noAI: true,
  enemies: ['goldbox'], perRoom: [8, 8, 8, 8],
  theme: prisonTheme({ sky: 0x1a1204, h1: 0xffe9a0, h2: 0x2a1c06, sun: 0xffd86a, ground: '#2a1e08', speck: ['#3a2a0c', '#241806', '#54400e'], mount: 0x1a1204, cloud: 0x4a360c }),
  build: function (g, m) { buildPrison(g, m, { wall: 0x8a6a1c, floor: 0x3a2a0a, cot: 0xd4a62a, lamp: 0xffe066, stain: 0xb8860b }); } });
