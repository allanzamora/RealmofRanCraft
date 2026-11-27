/* pets.js - companion pets: Chicken (ground, heals the hero) and Mini Robot (floating, shoots mobs) */
var PETS = {
  chicken: { name: 'Chicken', emoji: '🐔', price: 60000, type: 'Ground', desc: 'Follows you on the ground and regenerates your HP every second.',
    regen: function (L) { return 30 + 10 * (L - 1); }, lines: function (L) { return ['HP regen ' + PETS.chicken.regen(L) + ' / sec']; } },
  dog: { name: 'Dog', emoji: '🐶', price: 80000, type: 'Ground', desc: 'Loyal companion: regenerates HP and fetches loot for you.',
    regen: function (L) { return 10 + 4 * (L - 1); }, loot: function (L) { return 10 + 1.5 * (L - 1); },
    lines: function (L) { return ['HP regen ' + PETS.dog.regen(L) + ' / sec', 'Loot pull range ' + PETS.dog.loot(L).toFixed(1) + 'm']; } },
  bird: { name: 'Bird', emoji: '🐦', price: 120000, type: 'Flying', desc: 'Regenerates HP and makes you run faster.',
    regen: function (L) { return 10 + 4 * (L - 1); }, spd: function (L) { return 0.12 + 0.01 * (L - 1); },
    lines: function (L) { return ['HP regen ' + PETS.bird.regen(L) + ' / sec', 'Move speed +' + PETS.bird.spd(L).toFixed(2)]; } },
  fairy: { name: 'Fairy', emoji: '🧚', price: 200000, type: 'Floating', desc: 'Regenerates HP and blesses you with extra attack.',
    regen: function (L) { return 10 + 4 * (L - 1); }, atk: function (L) { return 10 + 3 * (L - 1); },
    lines: function (L) { return ['HP regen ' + PETS.fairy.regen(L) + ' / sec', 'Attack +' + PETS.fairy.atk(L)]; } },
  robot: { name: 'Mini Robot', emoji: '🤖', price: 150000, type: 'Floating', desc: 'Floats beside you and shoots nearby mobs.',
    stat: function (L) { return 110 + 40 * (L - 1); }, lines: function (L) { return ['Damage ' + PETS.robot.stat(L) + ' / hit']; } }
};
var PET_HUNGER_T = 5 * 3600;   // an active pet gets hungry after 5 hours of being summoned
var PET_MEALS = { chicken: { name: 'Chicken Feed', emoji: '🌾', price: 500 }, dog: { name: 'Dog Biscuit', emoji: '🦴', price: 800 }, bird: { name: 'Bird Seeds', emoji: '🌻', price: 600 },
  fairy: { name: 'Fairy Nectar', emoji: '🍯', price: 1500 }, robot: { name: 'Robot Battery', emoji: '🔋', price: 1200 } };
function petHungry(id) { return !!P.pets[id] && (P.petHunger[id] || 0) >= PET_HUNGER_T; }
function petHungerLeft(id) { return Math.max(0, PET_HUNGER_T - (P.petHunger[id] || 0)); }
function fmtHours(sec) { var h2 = Math.floor(sec / 3600), m = Math.floor(sec % 3600 / 60); return h2 + 'h ' + m + 'm'; }
function feedPetMeal(id) { P.petHunger[id] = 0; }
function petBonus(kind) {   // passive bonuses of the active pet (none while it is hungry)
  var id = P.pet; if (!id || !P.pets[id] || !PETS[id][kind] || petHungry(id)) return 0; return PETS[id][kind](P.pets[id].lvl);
}
var PET_MAX = 10, PET_FOOD_PRICE = 1000;
function petFoodNeed(L) { return L * 2; }          // pet food needed to go from level L to L+1
var petObj = null, petId = null, petHealT = 0, petAtkT = 0, petMap = '';

function buildPetModel(id) {
  var g = new THREE.Group(), M = function (c, o) { var p = { color: c }; if (o) for (var k in o) p[k] = o[k]; return new THREE.MeshBasicMaterial(p); };
  function bx(w, h2, d, mat, x, y, z, parent) { var m = new THREE.Mesh(new THREE.BoxGeometry(w, h2, d), mat); m.position.set(x, y, z); (parent || g).add(m); return m; }
  var parts = {};
  if (id === 'chicken') {
    var wh = M(0xfafafa), red = M(0xe03a3a), yl = M(0xffb020), dk = M(0x111111);
    parts.body = bx(0.5, 0.42, 0.62, wh, 0, 0.5, 0);
    var head = bx(0.3, 0.3, 0.3, wh, 0, 0.88, 0.3); bx(0.08, 0.14, 0.2, red, 0, 1.1, 0.3); bx(0.1, 0.08, 0.16, yl, 0, 0.86, 0.5); bx(0.08, 0.1, 0.06, red, 0, 0.74, 0.46);
    bx(0.05, 0.05, 0.03, dk, -0.1, 0.94, 0.46); bx(0.05, 0.05, 0.03, dk, 0.1, 0.94, 0.46);
    bx(0.4, 0.3, 0.14, wh, 0, 0.62, -0.38); bx(0.1, 0.2, 0.3, wh, -0.3, 0.52, 0); bx(0.1, 0.2, 0.3, wh, 0.3, 0.52, 0);
    parts.legL = bx(0.07, 0.3, 0.07, yl, -0.12, 0.15, 0.05); parts.legR = bx(0.07, 0.3, 0.07, yl, 0.12, 0.15, 0.05); parts.head = head;
    g.scale.setScalar(0.62);
  } else if (id === 'dog') {
    var br = M(0xb87a3a), dbr = M(0x7a4a1e), wt = M(0xf5ead8), dk2 = M(0x111111);
    parts.body = bx(0.46, 0.4, 0.8, br, 0, 0.55, 0);
    var hd = bx(0.36, 0.34, 0.36, br, 0, 0.9, 0.46); bx(0.2, 0.16, 0.2, wt, 0, 0.82, 0.68); bx(0.07, 0.07, 0.05, dk2, 0, 0.88, 0.79);
    bx(0.06, 0.06, 0.03, dk2, -0.1, 0.96, 0.65); bx(0.06, 0.06, 0.03, dk2, 0.1, 0.96, 0.65);
    bx(0.1, 0.2, 0.1, dbr, -0.2, 0.95, 0.4); bx(0.1, 0.2, 0.1, dbr, 0.2, 0.95, 0.4);
    parts.tail = bx(0.08, 0.08, 0.34, dbr, 0, 0.78, -0.5); parts.tail.rotation.x = 0.7;
    parts.legs = [[-0.15, 0.3], [0.15, 0.3], [-0.15, -0.3], [0.15, -0.3]].map(function (p) { return bx(0.12, 0.34, 0.12, dbr, p[0], 0.17, p[1]); });
    parts.head = hd; g.scale.setScalar(0.62);
  } else if (id === 'bird') {
    var bl = M(0x4aa8ff), lb = M(0xcfe8ff), og = M(0xffa020), dk3 = M(0x111111);
    parts.body = bx(0.3, 0.26, 0.42, bl, 0, 0, 0); bx(0.22, 0.12, 0.3, lb, 0, -0.08, 0.02);
    bx(0.22, 0.22, 0.22, bl, 0, 0.18, 0.24); bx(0.07, 0.06, 0.12, og, 0, 0.16, 0.4); bx(0.04, 0.04, 0.03, dk3, -0.07, 0.22, 0.36); bx(0.04, 0.04, 0.03, dk3, 0.07, 0.22, 0.36);
    bx(0.16, 0.05, 0.3, bl, 0, 0.02, -0.34);
    parts.wingL = bx(0.4, 0.04, 0.26, lb, -0.32, 0.06, 0); parts.wingR = bx(0.4, 0.04, 0.26, lb, 0.32, 0.06, 0);
    g.scale.setScalar(0.8);
  } else if (id === 'fairy') {
    var sk = M(0xffe0c8), pk = M(0xff8ad8), gd = M(0xffe066), wg = M(0xbff4ff, { transparent: true, opacity: 0.6, side: THREE.DoubleSide }), gl = M(0xffffaa, { transparent: true, opacity: 0.35 });
    parts.body = bx(0.16, 0.26, 0.12, pk, 0, 0, 0); bx(0.2, 0.2, 0.2, sk, 0, 0.26, 0); bx(0.24, 0.1, 0.24, gd, 0, 0.4, 0); bx(0.2, 0.2, 0.06, gd, 0, 0.22, -0.12);
    bx(0.05, 0.05, 0.02, M(0x111111), -0.05, 0.28, 0.1); bx(0.05, 0.05, 0.02, M(0x111111), 0.05, 0.28, 0.1);
    bx(0.1, 0.2, 0.1, pk, -0.16, -0.02, 0); bx(0.1, 0.2, 0.1, pk, 0.16, -0.02, 0);
    parts.wingL = bx(0.34, 0.4, 0.02, wg, -0.28, 0.12, -0.1); parts.wingR = bx(0.34, 0.4, 0.02, wg, 0.28, 0.12, -0.1);
    parts.glow = bx(0.7, 0.7, 0.7, gl, 0, 0.1, 0); g.scale.setScalar(0.9);
  } else {
    var gr = M(0xb8c2cc), dg = M(0x56606c), cy = M(0x35e0ff), glow = M(0x35e0ff, { transparent: true, opacity: 0.55 });
    parts.body = bx(0.55, 0.5, 0.5, gr, 0, 0, 0);
    bx(0.62, 0.12, 0.56, dg, 0, 0.0, 0); bx(0.42, 0.2, 0.06, cy, 0, 0.08, 0.28);
    bx(0.12, 0.3, 0.12, dg, -0.36, -0.02, 0); bx(0.12, 0.3, 0.12, dg, 0.36, -0.02, 0);
    bx(0.04, 0.3, 0.04, dg, 0, 0.4, 0); bx(0.1, 0.1, 0.1, cy, 0, 0.58, 0);
    parts.jet = bx(0.28, 0.2, 0.28, glow, 0, -0.38, 0);
    g.scale.setScalar(0.55);
  }
  g.userData.parts = parts; return g;
}
function removePet() { if (petObj) { scene.remove(petObj); disposeTree(petObj); petObj = null; } petId = null; }
function setActivePet(id) {
  P.pet = (id && P.pets[id]) ? id : null; removePet(); petHealT = 0; petAtkT = 0; refreshPetBtn(); saveGame();
}
function petLevel(id) { return P.pets[id] ? P.pets[id].lvl : 0; }
function updatePets(dt) {
  if (!P.pet || !P.pets[P.pet]) { if (petObj) removePet(); return; }
  if (petId !== P.pet || !petObj) { removePet(); petObj = buildPetModel(P.pet); petId = P.pet; scene.add(petObj); petObj.position.set(P.pos.x - 1.5, 0, P.pos.z + 1.5); petMap = P.map; }
  var r = P.c.g.rotation.y, fx = Math.sin(r), fz = Math.cos(r), side = (P.pet === 'chicken' || P.pet === 'dog') ? -1 : 1;
  var tx = P.pos.x - fx * 1.7 + Math.cos(r) * 1.1 * side, tz = P.pos.z - fz * 1.7 - Math.sin(r) * 1.1 * side;
  var dx = tx - petObj.position.x, dz = tz - petObj.position.z, d = Math.hypot(dx, dz);
  if (d > 22 || petMap !== P.map) { petObj.position.x = tx; petObj.position.z = tz; petMap = P.map; d = 0; dx = dz = 0; }
  var sp = Math.min(d, Math.max(0, d * 4.5) * dt * 1);
  if (d > 0.05) { petObj.position.x += dx / d * Math.min(d, (4 + d * 3) * dt); petObj.position.z += dz / d * Math.min(d, (4 + d * 3) * dt); petObj.rotation.y = Math.atan2(dx, dz); }
  var moving = d > 0.6, t = performance.now() / 1000, parts = petObj.userData.parts, id = P.pet;
  if (id === 'chicken') {
    petObj.position.y = moving ? Math.abs(Math.sin(t * 14)) * 0.08 : 0;
    parts.legL.rotation.x = moving ? Math.sin(t * 14) * 0.7 : 0; parts.legR.rotation.x = moving ? -Math.sin(t * 14) * 0.7 : 0; parts.head.position.z = 0.3 + (moving ? Math.sin(t * 14) * 0.04 : 0);
  } else if (id === 'dog') {
    petObj.position.y = moving ? Math.abs(Math.sin(t * 12)) * 0.06 : 0;
    parts.legs.forEach(function (l, i) { l.rotation.x = moving ? Math.sin(t * 12 + (i % 2 ? Math.PI : 0)) * 0.7 : 0; }); parts.tail.rotation.z = Math.sin(t * 14) * 0.5;
  } else if (id === 'bird') {
    petObj.position.y = 1.7 + Math.sin(t * 2.2) * 0.12; var fl = Math.sin(t * 22) * 0.6; parts.wingL.rotation.z = fl; parts.wingR.rotation.z = -fl;
  } else if (id === 'fairy') {
    petObj.position.y = 1.9 + Math.sin(t * 2.6) * 0.15; var ff = Math.sin(t * 26) * 0.5; parts.wingL.rotation.y = ff; parts.wingR.rotation.y = -ff; parts.glow.rotation.y = t * 2; parts.glow.rotation.x = t * 1.3;
  } else {
    petObj.position.y = 1.6 + Math.sin(t * 2.4) * 0.14; petObj.rotation.z = Math.sin(t * 1.7) * 0.08; parts.jet.scale.y = 1 + Math.sin(t * 30) * 0.25;
  }
  if (!P.dead || true) {   // hunger only grows while the pet is out
    var was = petHungry(id); P.petHunger[id] = (P.petHunger[id] || 0) + dt;
    if (!was && petHungry(id)) { log('Your ' + PETS[id].name + ' is hungry! Feed it ' + PET_MEALS[id].name + ' (open the paw button).', '#ffb74d'); spawnText('Hungry!', petObj.position, 'fl dmg', 2.0); }
  }
  if (P.dead || petHungry(id)) { if (petHungry(id) && petObj) petObj.rotation.z = Math.sin(t * 3) * 0.12; return; }
  var L = petLevel(id);
  if (PETS[id].regen) {
    petHealT += dt;
    if (petHealT >= 1) {
      petHealT -= 1;
      if (P.hp < maxHp()) { var hv = Math.min(PETS[id].regen(L), maxHp() - P.hp); P.hp += hv; spawnText('+' + Math.round(hv), P.pos, 'fl heal', 2.0); burst({ x: P.pos.x, y: 1, z: P.pos.z }, 0x6dff8f, 4, 2, 2); }
    }
  }
  if (id === 'robot') {
    petAtkT -= dt;
    if (petAtkT <= 0) {
      var best = null, bd = 16;
      if (P.target && P.target.state !== 'dead' && !P.target.isAI && enemies.indexOf(P.target) >= 0 && distP(P.target.pos) < 18) best = P.target;
      else for (var i = 0; i < enemies.length; i++) { var e = enemies[i]; if (e.state === 'dead') continue; var de = distP(e.pos); if (de < bd) { bd = de; best = e; } }
      if (best) {
        petAtkT = 1.1; orbFx(petObj.position.x, petObj.position.z, best.pos.x, best.pos.z, 0x35e0ff, 0.22, false);
        hurtEnemy(best, PETS.robot.stat(L), { color: 0x35e0ff }); burst({ x: best.pos.x, y: 1, z: best.pos.z }, 0x35e0ff, 5, 3, 3);
      } else petAtkT = 0.3;
    }
  }
}
