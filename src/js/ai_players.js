/* ai_players.js - AI "players" that level/farm in every map, use skills, can be PK'd by the real player */
var ais = [];
function ARENA() { return !!(curMap && curMap.arena); }
var AI_NAMES = ['ShadowBlade', 'NoobSlayer', 'KuyaBen', 'Lyra', 'DragonX', 'Mikay', 'Zephyr', 'AteRina', 'JuanPogi', 'Nyx', 'Rafa', 'Tala', 'Bryx', 'Cassie', 'Dodong', 'PogiMark', 'IceQueen', 'Vexor', 'Aria', 'Kiko', 'Blaze', 'Moonlit', 'Ghost', 'Sakura', 'Rex', 'Pinoy_Warrior', 'Xander', 'Mara', 'Titan', 'Elora', 'Jin', 'Odin', 'Bea', 'Crimson', 'Lucky', 'Hana', 'Storm', 'Ryu', 'Mang_Tomas', 'Selene'];
var AI_TIER_COL = [0x7a4a21, 0x9aa3ad, 0xd6dde6, 0x4fd1c5, 0xe0463a, 0xffd54f];
var AI_DMG_KINDS = { cone: 1, aoe: 1, bolt: 1, chain: 1, meteor: 1, step: 1, storm: 1, anvil: 1, laser: 1, starfall: 1, icecrack: 1, hsword: 1, angel: 1 };
var AI_MOUNT_LVL = 30, AI_DASH_LVL = 10;

function aiStats(a) {
  var l = a.lvl, ratio = a.maxHp ? a.hp / a.maxHp : 1;
  a.maxHp = Math.round(100 + 25 * (l - 1) + l * 7); a.maxMp = 50 + 10 * (l - 1);
  a.atk = (12 + 3.2 * (l - 1) + l * 1.6) * (a.gm || 1); a.def = (2 + 1.5 * (l - 1) + l * 0.9) * (a.gm || 1);
  a.hp = Math.max(1, Math.round(a.maxHp * ratio)); a.mp = Math.min(a.mp || a.maxMp, a.maxMp);
  a.T = { name: a.name, lvl: l, scale: 1, boss: false, def: a.def * 0.6, atk: a.atk, xp: 0, gold: [0, 0] };
}
function aiKit(a) {      // 8 slots: the 6 strongest attack skills for its level + 2 buffs (falls back to heal/shield/regen)
  var el = SKILL_ORDER.filter(function (id) { return SKILLS[id].lvl <= a.lvl && !SKILLS[id].noAI; }), byLvl = function (x, y) { return SKILLS[y].lvl - SKILLS[x].lvl; };
  var atk = el.filter(function (id) { return AI_DMG_KINDS[SKILLS[id].kind]; }).sort(byLvl).slice(0, 6);
  var bf = el.filter(function (id) { return SKILLS[id].kind === 'buff'; }).sort(byLvl).slice(0, 2);
  if (bf.length < 2) el.filter(function (id) { var k = SKILLS[id].kind; return k === 'heal' || k === 'shield' || k === 'hot'; }).sort(byLvl).forEach(function (id) { if (bf.length < 2) bf.push(id); });
  a.kit = atk.concat(bf);
}
function makeAI(name, lvl, m) {
  var t = clamp(Math.ceil(lvl / 12), 1, 5), tc = AI_TIER_COL[t], pick = function (arr) { return arr[randInt(0, arr.length - 1)]; };
  var semi = lvl >= 45;
  var look = { scale: 1, skin: pick([0xf0c8a0, 0xe0b080, 0xc89060, 0xf4d6b8, 0xa87850]), shirt: pick([0x2f6fd0, 0x8a2f2f, 0x2f8a6a, 0x6a3d8a, 0x555566, 0xc0782a, 0x2a2a3a]), pants: pick([0x353a48, 0x3a3a2a, 0x2f2f3a, 0x4a3a2a]),
    hair: pick([0x2a1a10, 0x1a1a1a, 0xd8c040, 0x6a3a1a, 0xaa3a3a, 0x3a5aa0]), boots: 0x3a2a1a, gear: semi };
  if (t >= 2) { look.pads = true; look.padColor = tc; look.armor = tc; }
  var c = newChar(look, name, lvl, '#9be3ff', true, { kind: t >= 4 ? 'greatsword' : (Math.random() < 0.2 ? 'dagger' : 'sword'), color: tc, glow: t >= 5 });
  c.sheath = true;
  if (semi) {
    var r = c.rig;
    r.armor.visible = true; r.armorMat.color.setHex(tc); r.padMeshes.forEach(function (x) { x.visible = true; }); r.padMat.color.setHex(tc);
    r.gloveMeshes.forEach(function (x) { x.visible = true; }); r.glovesMat.color.setHex(tc);
    r.helmMeshes.forEach(function (x) { x.visible = true; }); r.hairMeshes.forEach(function (x) { x.visible = false; }); r.helmMat.color.setHex(tc);
    r.pantsMat.color.setHex(tc);
    if (r.wingsG) { r.wingsG.visible = true; r.wingMat.color.setHex(t >= 5 ? 0xffd54f : 0xe0463a); }
  }
  var ang = rand(0, TAU), rad = rand(m.safeR + 4, Math.min(m.safeR + 90, m.R - 10));
  c.g.position.set(Math.cos(ang) * rad, 0, Math.sin(ang) * rad);
  var a = { isAI: true, name: name, lvl: lvl, xp: 0, c: c, pos: c.g.position, state: 'alive', hostile: 0, tgt: null, cd: {}, thinkT: rand(0, 1), atkCd: 0, hitCd: 1, skT: 0, deadT: 0, resT: 0, gold: 0, mode: 'farm',
    boostT: 0, atkBoost: 0, defBoost: 0, shield: 0, shieldT: 0, wx: 0, wz: 0, wanderT: 0, hp: 1, maxHp: 0, mp: 9999 };
  aiStats(a); a.hp = a.maxHp; a.mp = a.maxMp; aiKit(a);
  c.tag.draw(1);
  return a;
}
/* arena showpieces: 'gz' = 1-2 random Godzilla pieces, 'cr' = Crimson Eye Blade (visual + small stat bonus) */
function aiRareGear(a, role) {
  var c = a.c, r = c.rig, bl = 0x141414;
  if (role === 'cr') { setWeapon(c, 'eyeblade', 0xe01818, true); a.gm = 1.12; aiStats(a); a.hp = a.maxHp; return; }
  var pool = ['godzilla_sword', 'god_helmet', 'godset_armor', 'godset_gloves', 'godset_pants', 'godset_wings'], n = randInt(1, 2), got = [];
  while (got.length < n) { var k = pool[randInt(0, pool.length - 1)]; if (got.indexOf(k) < 0) got.push(k); }
  got.forEach(function (id) {
    if (id === 'godzilla_sword') setWeapon(c, 'godsword', 0x939a3b, true);
    else if (id === 'godzilla_bow') setWeapon(c, 'godbow', 0x4d9fd8, true);
    else if (id === 'god_helmet') { r.helmMeshes.forEach(function (x) { x.visible = false; }); r.hairMeshes.forEach(function (x) { x.visible = false; }); if (r.godG) r.godG.visible = true; }
    else if (id === 'godset_armor') { r.armor.visible = true; r.armorMat.color.setHex(bl); r.padMeshes.forEach(function (x) { x.visible = true; }); r.padMat.color.setHex(bl); r.gzArmorMeshes.forEach(function (x) { x.visible = true; }); }
    else if (id === 'godset_gloves') { r.gloveMeshes.forEach(function (x) { x.visible = true; }); r.glovesMat.color.setHex(bl); r.gzGloveMeshes.forEach(function (x) { x.visible = true; }); }
    else if (id === 'godset_pants') { r.pantsMat.color.setHex(bl); r.gzPantsMeshes.forEach(function (x) { x.visible = true; }); }
    else if (id === 'godset_wings') { if (r.wingsG) r.wingsG.visible = false; if (r.wingsG2) r.wingsG2.visible = false; if (r.wingsG3) r.wingsG3.visible = true; }
  });
  a.gm = 1.1 + 0.08 * got.length; aiStats(a); a.hp = a.maxHp; a.gz = got;
}
function spawnAIs(m) {
  if (m.noAI) return;
  if (m.arena) {
    var na = randInt(20, 25), used0 = {}, nGz = randInt(4, 5), nCr = randInt(2, 4);   // 4-5 bots wear Godzilla gear, 2-4 wield the Crimson Eye Blade
    for (var q = 0; q < na; q++) {
      var nm0; do { nm0 = AI_NAMES[randInt(0, AI_NAMES.length - 1)]; } while (used0[nm0]); used0[nm0] = 1;
      var role = q < nGz ? 'gz' : (q < nGz + nCr ? 'cr' : null);
      var aa = makeAI(nm0, role === 'gz' ? randInt(75, MAX_LVL - 2) : role === 'cr' ? randInt(60, MAX_LVL - 2) : (q < nGz + nCr + 3 ? randInt(Math.round(MAX_LVL * 0.83), MAX_LVL - 2) : randInt(10, MAX_LVL)), m);
      aa.hostile = 1e9; if (role) aiRareGear(aa, role); ais.push(aa);
    }
    return;
  }
  var lv = m.enemies.map(function (k) { return ENEMY_TYPES[k].lvl; }), low = Math.min.apply(null, lv), top = Math.max.apply(null, lv);
  var n = randInt(10, 15), used = {};
  for (var i = 0; i < n; i++) {
    var nm; do { nm = AI_NAMES[randInt(0, AI_NAMES.length - 1)]; } while (used[nm] && Object.keys(used).length < AI_NAMES.length); used[nm] = 1;
    var lvl = i < 2 ? randInt(Math.round(MAX_LVL * 0.83), MAX_LVL - 2) : randInt(Math.max(1, low - 2), Math.min(MAX_LVL, top + 4));
    ais.push(makeAI(nm, lvl, m));
  }
}
function aiGainXp(a, T) {
  var xp = (a.lvl - T.lvl > XP_CUTOFF) ? 0 : Math.round(T.xp * clamp(1 + (T.lvl - a.lvl) * 0.12, 0.15, 1.8));
  a.gold += randInt(T.gold[0], T.gold[1]);
  if (a.lvl >= MAX_LVL || xp <= 0) return;
  a.xp += xp;
  while (a.lvl < MAX_LVL && a.xp >= xpNext(a.lvl)) {
    a.xp -= xpNext(a.lvl); a.lvl++; aiStats(a); a.hp = a.maxHp; aiKit(a);
    a.c.lvl = a.lvl; a.c.tag.draw(a.hp / a.maxHp);
    if (distP(a.pos) < 40) { ringFx(a.pos.x, a.pos.z, 3, 0xffe066, 0.6); }
    if (a.lvl % 5 === 0) log('[World] ' + a.name + ' reached level ' + a.lvl + '!', '#9be3ff');
  }
}
function aiNear(a) { return distP(a.pos) < 45; }
function eachMob(fn) { for (var i = enemies.length - 1; i >= 0; i--) if (enemies[i].state !== 'dead') fn(enemies[i]); }
function aiFace(a, x, z) { a.c.g.rotation.y = Math.atan2(x - a.pos.x, z - a.pos.z); }
function aiDmg(a) { return a.atk * (a.boostT > gameTime ? 1 + a.atkBoost : 1); }
function aiHitPlayer(a, mult) {
  if (P.dead || inSafeZone()) return;
  damagePlayer({ T: { atk: aiDmg(a) * mult, name: a.name + ' (PK)' } });
  if (P.dead) { a.hostile = 0; a.tgt = null; log('You were killed by ' + a.name + ' in PK!', '#ff6a6a'); }
}
function aiHit(a, tgt, mult, o) {
  if (tgt.isP) { aiHitPlayer(a, mult); return; }
  if (tgt.isAI) { damageAI(tgt, Math.max(1, aiDmg(a) * mult * rand(0.85, 1.15) - tgt.def * 0.5), a); return; }
  o = o || {}; o.by = a; hurtEnemy(tgt, aiDmg(a) * mult, o);
}
function damageAI(a, dmg, by) {
  if (a.state === 'dead') return;
  if (a.shield > 0) { var ab = Math.min(a.shield, dmg); a.shield -= ab; dmg -= ab; }
  a.hp -= Math.max(0, dmg); a.c.flash = 0.1; a.c.tag.draw(Math.max(0, a.hp / a.maxHp));
  if (a.hp <= 0) { a.state = 'dead'; a.deadT = 0; a.tgt = null; a.hostile = 0; startDeath(a.c, a.pos); a.c.tag.spr.visible = false; if (P.target === a) P.target = null; }
}
function eachFoe(a, fn) {
  eachMob(fn);
  if (ARENA()) for (var i = ais.length - 1; i >= 0; i--) { var o = ais[i]; if (o !== a && o.state !== 'dead') fn(o); }
}
function aiFindFoe(a) {
  var best = null, bs = 1e9;
  for (var i = 0; i < ais.length; i++) { var o = ais[i]; if (o === a || o.state === 'dead') continue; var d = Math.hypot(o.pos.x - a.pos.x, o.pos.z - a.pos.z); if (d < bs) { bs = d; best = o; } }
  if (!P.dead && distP(a.pos) < bs * 1.25) best = { isP: true, pos: P.pos, c: P.c, state: 'alive' };
  return best;
}
function aiFindTarget(a) {
  var best = null, bs = 1e9;
  for (var i = 0; i < enemies.length; i++) {
    var e = enemies[i]; if (e.state === 'dead' || !e.c.g.visible && distP(e.pos) < 60 && false) continue;
    if (e.T.boss && a.lvl < e.T.lvl - 3) continue;
    var d = Math.hypot(e.pos.x - a.pos.x, e.pos.z - a.pos.z); if (d > 130) continue;
    var diff = Math.abs(e.T.lvl - a.lvl), s = d + diff * 6 + (a.lvl - e.T.lvl > XP_CUTOFF ? 40 : 0) + Math.random() * 8;
    if (s < bs) { bs = s; best = e; }
  }
  return best;
}

/* ----- skill casting (simplified versions of the player skills) ----- */
function aiCast(a, id, tgt) {
  var sk = SKILLS[id], near = aiNear(a), px = tgt.pos.x, pz = tgt.pos.z;
  a.mp -= sk.mp; a.cd[id] = sk.cd * 1.1; aiFace(a, px, pz);
  var inCone = function (e) {
    var dx = e.pos.x - a.pos.x, dz = e.pos.z - a.pos.z, d = Math.hypot(dx, dz);
    if (d > sk.range + 0.6) return false; if (d < 0.8) return true;
    return Math.acos(clamp((dx * Math.sin(a.c.g.rotation.y) + dz * Math.cos(a.c.g.rotation.y)) / d, -1, 1)) <= sk.cone / 2;
  };
  var pObj = P; pObj.isP = true;
  switch (sk.kind) {
    case 'cone':
      startAnim(a.c, 'attack', 0.55);
      if (sk.dash) { var d0 = Math.hypot(px - a.pos.x, pz - a.pos.z); if (d0 > 2.2) { var k = (d0 - 2) / d0; a.pos.x += (px - a.pos.x) * Math.min(1, k); a.pos.z += (pz - a.pos.z) * Math.min(1, k); } }
      if (near) slashFx(a.pos.x, a.pos.z, a.c.g.rotation.y, 0xff9a3a, sk.range, sk.cone);
      eachFoe(a, function (e) { if (inCone(e)) aiHit(a, e, sk.mult * (sk.hits || 1), { execute: sk.execute }); });
      if ((tgt.isP || ARENA()) && inCone(P)) aiHitPlayer(a, sk.mult * (sk.hits || 1));
      if (sk.healSelf) a.hp = Math.min(a.maxHp, a.hp + a.maxHp * sk.healSelf);
      break;
    case 'aoe':
      startAnim(a.c, 'spin', 0.7); if (near) ringFx(a.pos.x, a.pos.z, sk.radius, sk.color || 0x6ab7ff, 0.5);
      var tot = sk.mult * (sk.hits > 1 ? sk.hits * 0.6 : 1);
      eachFoe(a, function (e) { if (Math.hypot(e.pos.x - a.pos.x, e.pos.z - a.pos.z) <= sk.radius + 0.5) aiHit(a, e, tot, { stun: sk.stun, color: sk.color }); });
      if ((tgt.isP || ARENA()) && Math.hypot(P.pos.x - a.pos.x, P.pos.z - a.pos.z) <= sk.radius + 0.5) aiHitPlayer(a, tot);
      if (sk.healSelf) a.hp = Math.min(a.maxHp, a.hp + a.maxHp * sk.healSelf);
      break;
    case 'bolt':
      startAnim(a.c, 'cast', 0.6); if (near) orbFx(a.pos.x, a.pos.z, px, pz, sk.color || 0xff7a2a, 0.22);
      aiHit(a, tgt, sk.mult, { slow: sk.slow, color: sk.color }); if (sk.heal) a.hp = Math.min(a.maxHp, a.hp + a.atk * sk.mult * sk.heal);
      break;
    case 'chain':
      startAnim(a.c, 'cast', 0.6); var hit = [tgt], cur = tgt;
      aiHit(a, tgt, sk.mult, { color: 0xdff3ff }); if (near) orbFx(a.pos.x, a.pos.z, px, pz, 0xdff3ff, 0.1);
      for (var i = 1; i < sk.n; i++) {
        var nx = null, bd = 7; eachFoe(a, function (e) { if (hit.indexOf(e) >= 0) return; var d = Math.hypot(e.pos.x - cur.pos.x, e.pos.z - cur.pos.z); if (d < bd) { bd = d; nx = e; } });
        if (!nx) break; hit.push(nx); if (near) orbFx(cur.pos.x, cur.pos.z, nx.pos.x, nx.pos.z, 0xdff3ff, 0.1); aiHit(a, nx, sk.mult * (1 - i * 0.12), { color: 0xdff3ff }); cur = nx;
      }
      break;
    case 'meteor':
      startAnim(a.c, 'cast', 0.8); if (near) ringFx(px, pz, sk.radius, 0xff5a1a, sk.delay);
      schedule(sk.delay, function () {
        if (near) { ringFx(px, pz, sk.radius, 0xffa040, 0.5); pillarFx(px, pz, 0xff6a1a); }
        eachFoe(a, function (e) { if (Math.hypot(e.pos.x - px, e.pos.z - pz) <= sk.radius + 0.5) aiHit(a, e, sk.mult, { stun: 0.8 }); });
        if ((tgt.isP || ARENA()) && Math.hypot(P.pos.x - px, P.pos.z - pz) <= sk.radius + 0.5) aiHitPlayer(a, sk.mult);
      });
      break;
    case 'step':
      var ang = (tgt.c ? tgt.c.g.rotation.y : 0) + Math.PI; a.pos.x = px + Math.sin(ang) * 1.6; a.pos.z = pz + Math.cos(ang) * 1.6; aiFace(a, px, pz);
      startAnim(a.c, 'attack', 0.5); if (near) burst({ x: a.pos.x, y: 1, z: a.pos.z }, 0x6a3aff, 10, 3, 4);
      aiHit(a, tgt, sk.mult, { color: 0xaa77ff });
      break;
    case 'storm':
      startAnim(a.c, 'cast', 0.9); if (near) { ringFx(a.pos.x, a.pos.z, sk.radius, 0xdff3ff, 0.8); lightningFx(px, pz); }
      var st = sk.mult * sk.strikes * 0.35;
      eachFoe(a, function (e) { if (Math.hypot(e.pos.x - a.pos.x, e.pos.z - a.pos.z) <= sk.radius) aiHit(a, e, st, { stun: 0.5, color: 0xdff3ff }); });
      if ((tgt.isP || ARENA()) && Math.hypot(P.pos.x - a.pos.x, P.pos.z - a.pos.z) <= sk.radius) aiHitPlayer(a, st);
      break;
    case 'anvil': case 'starfall': case 'hsword': case 'angel': case 'icecrack': case 'laser': aiBigSkill(a, sk, tgt, near); break;
    case 'heal': startAnim(a.c, 'cast', 0.8); a.hp = Math.min(a.maxHp, a.hp + a.maxHp * sk.frac); if (near) { ringFx(a.pos.x, a.pos.z, 3, 0x6dff8f, 0.7); spawnText('+' + Math.round(a.maxHp * sk.frac), a.pos, 'fl heal', 2.2); } break;
    case 'hot': startAnim(a.c, 'cast', 0.8); a.hp = Math.min(a.maxHp, a.hp + a.maxHp * sk.frac * sk.dur * 0.5); if (near) ringFx(a.pos.x, a.pos.z, 3, 0x6dff8f, 0.7); break;
    case 'shield': startAnim(a.c, 'cast', 0.7); a.shield = a.maxHp * sk.frac; a.shieldT = sk.dur; if (near) ringFx(a.pos.x, a.pos.z, 2.6, 0x9bd0ff, 0.6); break;
    case 'buff': startAnim(a.c, 'cast', 0.7); a.boostT = gameTime + sk.dur; a.atkBoost = sk.buff.atk || 0; a.defBoost = sk.buff.def || 0; if (near) ringFx(a.pos.x, a.pos.z, 2.6, 0xffb04a, 0.6); break;
  }
}
/* simplified big skills for AI (target is always required) */
function aiBigSkill(a, sk, tgt, near) {
  var px = tgt.pos.x, pz = tgt.pos.z, m = sk.mult * 0.6;
  function area(x, z, r, mult, o) {
    eachFoe(a, function (e) { if (Math.hypot(e.pos.x - x, e.pos.z - z) <= r + 0.5 * ((e.T && e.T.scale) || 1)) aiHit(a, e, mult, o); });
    if ((tgt.isP || ARENA()) && Math.hypot(P.pos.x - x, P.pos.z - z) <= r + 0.5) aiHitPlayer(a, mult);
  }
  startAnim(a.c, 'cast', 0.9);
  if (sk.kind === 'anvil') {
    if (near) ringFx(px, pz, sk.radius, 0x9aa3ad, 0.9);
    for (var i = 0; i < 4; i++) (function (i) { schedule(0.3 + i * 0.2, function () { if (near) { var x = px + rand(-3, 3), z = pz + rand(-3, 3); ringFx(x, z, 2.5, 0xcfd5dc, 0.35); burst({ x: x, y: 0.5, z: z }, 0xb0b6bf, 8, 4, 3); } }); })(i);
    schedule(0.9, function () { if (a.state !== 'dead') area(px, pz, sk.radius, m * sk.n * 0.35, { stun: 0.5 }); });
  } else if (sk.kind === 'starfall') {
    if (near) ringFx(px, pz, sk.radius, 0xffe066, 1.2);
    for (var j = 0; j < 6; j++) (function (j) { schedule(0.2 + j * 0.15, function () { if (near) lightningFx(px + rand(-4, 4), pz + rand(-4, 4), 0xffe066); }); })(j);
    schedule(1.1, function () { if (a.state !== 'dead') area(px, pz, sk.radius, m * sk.n * 0.3); });
  } else if (sk.kind === 'hsword') {
    if (near) ringFx(px, pz, sk.radius, 0xfff2a0, 0.9);
    schedule(0.9, function () { if (near) { ringFx(px, pz, sk.radius, 0xffffff, 0.5); pillarFx(px, pz, 0xfff2a0); burst({ x: px, y: 1, z: pz }, 0xfff2a0, 22, 7, 7); } if (a.state !== 'dead') area(px, pz, sk.radius, m, { stun: sk.stun }); });
  } else if (sk.kind === 'angel') {
    if (near) { ringFx(px, pz, 3, 0xffffff, 0.8); ringFx(px, pz, 6, 0xfff2a0, 1.0); }
    schedule(1.0, function () { if (near) { pillarFx(px, pz, 0xffffff); ringFx(px, pz, sk.radius, 0xfff2a0, 0.6); burst({ x: px, y: 2, z: pz }, 0xfff2a0, 24, 7, 8); } if (a.state !== 'dead') { area(px, pz, sk.radius, m, { stun: 1.2 }); a.hp = Math.min(a.maxHp, a.hp + a.maxHp * sk.healSelf); } });
  } else if (sk.kind === 'icecrack') {
    var dd = Math.max(1, Math.hypot(px - a.pos.x, pz - a.pos.z));
    for (var q = 1; q <= 5; q++) (function (q) { schedule(0.1 + q * 0.07, function () { if (near) { var x = a.pos.x + (px - a.pos.x) * q / 5, z = a.pos.z + (pz - a.pos.z) * q / 5; ringFx(x, z, 1.4, 0x9fe8ff, 0.3); burst({ x: x, y: 0.4, z: z }, 0xcff4ff, 5, 3, 3); } }); })(q);
    schedule(0.5, function () { if (a.state !== 'dead') for (var q2 = 1; q2 <= 5; q2++) area(a.pos.x + (px - a.pos.x) * q2 / 5, a.pos.z + (pz - a.pos.z) * q2 / 5, 1.6, m / 3, { slow: 3, stun: 0.5 }); });
  } else if (sk.kind === 'laser') {
    var ddx = px - a.pos.x, ddz = pz - a.pos.z, dl = Math.max(0.5, Math.hypot(ddx, ddz)), ux = ddx / dl, uz = ddz / dl;
    if (near) orbFx(a.pos.x, a.pos.z, a.pos.x + ux * sk.range, a.pos.z + uz * sk.range, 0xff2a2a, 0.5, true);
    schedule(0.5, function () {
      if (a.state === 'dead') return;
      var hitL = function (e) { var rx = e.pos.x - a.pos.x, rz = e.pos.z - a.pos.z, al = rx * ux + rz * uz, pp = Math.abs(rx * uz - rz * ux); return al > -0.5 && al < sk.range && pp <= 1.7 + 0.5 * ((e.T && e.T.scale) || 1); };
      eachFoe(a, function (e) { if (hitL(e)) aiHit(a, e, m * sk.ticks * 0.5); });
      if ((tgt.isP || ARENA()) && hitL(P)) aiHitPlayer(a, m * sk.ticks * 0.5);
    });
  }
}
function aiSkillReach(sk) { return sk.kind === 'aoe' ? sk.radius * 0.8 : (sk.kind === 'cone' ? sk.range * 0.85 : (sk.kind === 'storm' ? sk.radius * 0.7 : (sk.range || 3))); }
function aiThink(a, tgt, d) {
  for (var i = 0; i < a.kit.length; i++) {
    var id = a.kit[i], sk = SKILLS[id];
    if ((a.cd[id] || 0) > 0 || a.mp < sk.mp) continue;
    var k = sk.kind;
    if (k === 'heal' || k === 'hot') { if (a.hp < a.maxHp * 0.55) { aiCast(a, id, tgt); return; } continue; }
    if (k === 'shield') { if (a.hp < a.maxHp * 0.75 && a.shield <= 0) { aiCast(a, id, tgt); return; } continue; }
    if (k === 'buff') { if (a.boostT < gameTime) { aiCast(a, id, tgt); return; } continue; }
    if (d <= aiSkillReach(sk)) { aiCast(a, id, tgt); return; }
  }
}

/* AI mounts: bots of level 30+ ride a crocodile (x1.2 speed) when travelling and get off to fight */
function aiMount(a, on, vis) {
  if (a.lvl < AI_MOUNT_LVL) return;
  if (!!a.mounted === on) return;
  a.mounted = on; a.c.forceSheath = on;
  if (on && vis && !a.mount) { a.mount = makeCrocMount(); a.c.g.add(a.mount.g); }
  if (a.mount) a.mount.g.visible = on;
  if (!on) a.c.rig.body.position.y = 0;
  if (a.c.tag && a.c.tag.spr) a.c.tag.spr.position.y = on ? 2.75 : 2.6;
}
function aiMountAnim(a, dt) {
  if (!a.mounted || !a.mount) { if (a.mount && a.mount.g.visible && !a.mounted) a.mount.g.visible = false; return; }
  var r = a.c.rig, t = performance.now() / 1000, mv = a.c.mv, ph = a.c.phase * 0.9, m = a.mount; m.g.visible = true;
  r.body.position.y += MOUNT_H; r.armR.sh.rotation.x = -0.9; r.armR.el.rotation.x = -0.9; r.armL.sh.rotation.x = -0.45; r.armL.el.rotation.x = -0.8; r.torso.rotation.y = 0; r.legR.hp.rotation.x = r.legL.hp.rotation.x = -1.15; r.legR.kn.rotation.x = r.legL.kn.rotation.x = 0.8;
  for (var i = 0; i < m.tail.length; i++) m.tail[i].rotation.y = Math.sin(t * (2.2 + mv * 5) - i * 0.7) * (0.12 + 0.2 * mv);
  for (var k = 0; k < 4; k++) m.legs[k].rotation.x = Math.sin(ph + (k === 0 || k === 3 ? 0 : Math.PI)) * 0.6 * Math.min(1, mv);
}
function updateAIs(dt) {
  var inCampOf = function (a) { return Math.hypot(a.pos.x, a.pos.z) < SAFE_R; };
  for (var i = 0; i < ais.length; i++) {
    var a = ais[i]; if (a.remote) continue;                       // online players are driven by pvp.js
    var c = a.c, pos = a.pos, spd = 0, dP = distP(pos), vis = dP < 70;
    c.g.visible = vis && a.state !== 'dead' || (a.state === 'dead' && c.g.visible);
    if (a.state === 'dead') {
      a.deadT += dt; if (vis) { c.mv = 0; animateChar(c, dt, 0); }
      if (a.deadT > 3.2 && c.g.visible) { c.g.visible = false; a.resT = 8; }
      if (!c.g.visible) {
        a.resT -= dt;
        if (a.resT <= 0) { var ang = rand(0, TAU), r = ARENA() ? rand(10, WORLD_R - 12) : rand(SAFE_R + 4, SAFE_R + 30); pos.set(Math.cos(ang) * r, 0, Math.sin(ang) * r); a.hp = a.maxHp; a.mp = a.maxMp; a.state = 'alive'; a.hostile = 0; c.anim = null; c.rig.body.rotation.x = 0; c.rig.body.position.y = 0; c.tag.spr.visible = true; c.tag.draw(1); c.g.visible = vis; a.mode = 'farm'; a.tgt = null; }
      }
      continue;
    }
    c.tag.spr.visible = dP < 28;
    if (!ARENA()) { var dc0 = Math.hypot(pos.x, pos.z); if (dc0 < SAFE_R + 1) { if (dc0 < 0.01) pos.x = SAFE_R + 1; else { pos.x *= (SAFE_R + 1) / dc0; pos.z *= (SAFE_R + 1) / dc0; } } }
    for (var id in a.cd) if (a.cd[id] > 0) a.cd[id] -= dt;
    a.dashCd = (a.dashCd || 0) - dt;
    a.atkCd -= dt; a.skT -= dt; if (a.shieldT > 0) { a.shieldT -= dt; if (a.shieldT <= 0) a.shield = 0; }
    a.mp = Math.min(a.maxMp, a.mp + (2 + a.maxMp * 0.012) * dt);
    if (ARENA()) a.hostile = 1e9;                    // arena = free PK
    else if (a.hostile > 0) { a.hostile -= dt; if (inCampOf(a) || inSafeZone() || P.dead || dP > 70) a.hostile = 0; }
    var pk = a.hostile > 0 && !ARENA(), tgt = null;
    if (pk) tgt = { isP: true, pos: P.pos, c: P.c, state: 'alive' };
    else if (a.mode === 'retreat') {
      var cd0 = Math.hypot(pos.x, pos.z);
      if (cd0 > SAFE_R + 6) { aiMount(a, true, vis); var kx = 5 * dt / cd0; pos.x -= pos.x * Math.min(1, kx * cd0 / Math.max(cd0, 1)) * 0 + (pos.x / cd0) * 5 * dt; pos.z -= (pos.z / cd0) * 5 * dt; spd = 5 * (a.mounted ? AI_MOUNT_SPEED : 1); aiFace(a, 0, 0); }
      a.hp = Math.min(a.maxHp, a.hp + a.maxHp * 0.12 * dt * (cd0 < SAFE_R + 12 ? 1 : 0.2));
      if (a.hp > a.maxHp * 0.9) a.mode = 'farm';
    } else {
      if (a.hp < a.maxHp * 0.3 && !ARENA()) { a.mode = 'retreat'; a.tgt = null; }
      else {
        a.thinkT -= dt;
        if (ARENA()) { a.tgtT = (a.tgtT || 0) - dt; if (a.tgtT <= 0 || (a.tgt && a.tgt.isP && P.dead)) { a.tgt = null; a.tgtT = 3 + Math.random() * 3; } }
        if ((!a.tgt || a.tgt.state === 'dead') && a.thinkT <= 0) { a.tgt = ARENA() ? aiFindFoe(a) : aiFindTarget(a); a.thinkT = 0.8 + Math.random() * 0.6; }
        tgt = a.tgt && a.tgt.state !== 'dead' ? a.tgt : null;
        if (!tgt) {                                   // nothing to fight: wander
          aiMount(a, true, vis);
          a.wanderT -= dt;
          if (a.wanderT <= 0) { var wa = rand(0, TAU), wr = rand(10, 40); a.wx = clamp(pos.x + Math.cos(wa) * wr, -WORLD_R + 10, WORLD_R - 10); a.wz = clamp(pos.z + Math.sin(wa) * wr, -WORLD_R + 10, WORLD_R - 10); a.wanderT = rand(3, 7); }
          var wd = Math.hypot(a.wx - pos.x, a.wz - pos.z);
          if (wd > 1 && Math.hypot(a.wx, a.wz) > SAFE_R + 2) { var ws = 3.6 * (a.mounted ? AI_MOUNT_SPEED : 1); pos.x += (a.wx - pos.x) / wd * ws * dt; pos.z += (a.wz - pos.z) / wd * ws * dt; spd = ws; aiFace(a, a.wx, a.wz); }
        }
      }
    }
    if (tgt) {
      var tx = tgt.pos.x, tz = tgt.pos.z, d = Math.hypot(tx - pos.x, tz - pos.z), meleeR = 2.1 * (tgt.T && tgt.T.scale ? Math.max(1, tgt.T.scale * 0.9) : 1);
      if (d > 150) { a.tgt = null; }
      else {
        if (a.mounted && d < 18) aiMount(a, false, vis); else if (!a.mounted && d > 26) aiMount(a, true, vis);
        if (a.lvl >= AI_DASH_LVL && a.dashCd <= 0 && d > 9 && d < 45 && !c.anim) {      // dash toward the target
          a.dashCd = a.lvl >= 50 ? 4 : 6; var dsh = Math.min(7, d - meleeR - 1);
          if (dsh > 1) { if (vis) burst({ x: pos.x, y: 1, z: pos.z }, 0x9bd0ff, 10, 4, 1); pos.x += (tx - pos.x) / d * dsh; pos.z += (tz - pos.z) / d * dsh; d -= dsh; }
        }
        if (d > meleeR) { var sp = 5.2 * (a.mounted ? AI_MOUNT_SPEED : 1); pos.x += (tx - pos.x) / d * sp * dt; pos.z += (tz - pos.z) / d * sp * dt; spd = sp; }
        aiFace(a, tx, tz);
        if (a.skT <= 0 && d < 16) { a.skT = 0.45; if (a.mounted) aiMount(a, false, vis); aiThink(a, tgt, d); }
        if (d <= meleeR + 0.8 && a.atkCd <= 0 && !c.anim) {
          a.atkCd = 0.75; startAnim(c, 'attack', 0.5);
          (function (a, tgt) { schedule(0.22, function () { if (a.state === 'dead' || (tgt.state === 'dead')) return; var dd = Math.hypot(tgt.pos.x - a.pos.x, tgt.pos.z - a.pos.z); if (dd <= meleeR + 1.4) aiHit(a, tgt, 1); }); })(a, tgt);
        }
        // the mob we are fighting hits back (works even when it is far from the real player)
        if (!tgt.isP && d <= tgt.T.range + 1.3 && !(tgt.stun > 0)) {
          a.hitCd -= dt;
          if (a.hitCd <= 0) { a.hitCd = tgt.T.cd; var dm = Math.max(1, tgt.T.atk * rand(0.85, 1.15) - a.def * (a.boostT > gameTime ? 0.6 + a.defBoost : 0.6)); damageAI(a, dm); }
        }
      }
    }
    resolveObstacles(pos, 0.4);
    var lim = WORLD_R - 2, rr = Math.hypot(pos.x, pos.z); if (rr > lim) { pos.x *= lim / rr; pos.z *= lim / rr; }
    if (vis) { animateChar(c, dt, spd); aiMountAnim(a, dt); }
  }
}
