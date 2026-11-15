
var SAVE_KEY = 'moviex_rpg_v3';
var P = {
  name: 'Hero', lvl: 1, xp: 0, hp: 100, look: { sex: 'm', style: 0, hair: 0x2a1a10, shirt: 0x2f6fd0, pants: 0x353a48 }, mp: 50, gold: 0, diamonds: 0, map: 'plains',
  inv: { hp_potion: 3, mp_potion: 1 }, owned: ['weapon0'],
  equip: { weapon: 'weapon0', helmet: null, armor: null, pants: null, gloves: null, wings: null },
  skills: DEFAULT_SLOTS.slice(), slots: padSlots(DEFAULT_SLOTS), quests: {},
  rolls: {}, upg: {}, mounts: {}, mounted: false, codes: {}, slowT: 0, slowMul: 1, poisonT: 0, poisonDps: 0, poisonAcc: 0, sp: 0, alloc: { hp: 0, dmg: 0, def: 0, crit: 0, cdmg: 0 }, reb: 0, taxPaid: 0, taxT: 0, dead: false, target: null, dash: 0, dashDir: { x: 0, z: 0 }, dashSpeed: 0,
  cd: { atk: 0, pot: 0, dash: 0 }, invuln: 0, skcd: {}, buffs: [], shield: 0, shieldT: 0, hot: null, lastCombat: -99, attackHeld: false, c: null, pos: null
};
function refreshPlayerTag(force) { 
  var f = clamp(P.hp / maxHp(), 0, 1), bkt = Math.round(f * 50);
  if (force || bkt !== P._tagB) { P._tagB = bkt; P.c.tag.draw(f); }
}
function xpNext(l) { return Math.floor(80 * Math.pow(l, 1.55)); }
function gearSum(stat) { var t = 0; SLOTS.forEach(function (sl) { var id = P.equip[sl]; if (id && ITEMS[id]) t += (ITEMS[id][stat] || 0) * upgMul(id); }); return t; }
function buffSum(stat) { var t = 0; for (var i = 0; i < P.buffs.length; i++) if (P.buffs[i].stat === stat) t += P.buffs[i].v; return t; }
var TAX_RATE = 0.12, SAFE_TAX = 5, SAFE_TAX_EVERY = 25;
function buyCost(price) { return Math.ceil(price * (1 + TAX_RATE)); }
function sellNet(v) { return Math.floor(v * (1 - TAX_RATE)); }
var SP_PER_LEVEL = 3, SP_HP = 10, SP_DMG = 2, SP_DEF = 1, SP_CRIT = 0.2, SP_CDMG = 1;
function maxHp() { return Math.round(100 + 25 * (P.lvl - 1) + gearSum('hp') + SP_HP * P.alloc.hp); }
function critChance() { return Math.min(0.9, 0.12 + (gearSum('crit') + SP_CRIT * P.alloc.crit) / 100); }
function critMul() { return 1.8 + (gearSum('cdmg') + SP_CDMG * P.alloc.cdmg) / 100; }
function maxMp() { return 50 + 10 * (P.lvl - 1); }
function atkVal() { return (12 + 3.2 * (P.lvl - 1) + gearSum('atk') + SP_DMG * P.alloc.dmg) * (1 + buffSum('atk')); }
function defVal() { return Math.max(0, (2 + 1.5 * (P.lvl - 1) + gearSum('def') + SP_DEF * P.alloc.def) * (1 + buffSum('def'))); }
function moveMul() { return Math.max(0.3, 1 + buffSum('spd') + gearSum('spd') / 100) * (P.mounted ? MOUNT_SPEED : 1) * (P.slowT > 0 ? P.slowMul : 1); }

function addBuff(stat, v, dur, name) {
  for (var i = P.buffs.length - 1; i >= 0; i--) if (P.buffs[i].src === name && P.buffs[i].stat === stat) P.buffs.splice(i, 1);
  P.buffs.push({ stat: stat, v: v, t: dur, dur: dur, src: name });
}
function updateBuffs(dt) {
  if (P.slowT > 0) P.slowT -= dt;
  if (P.poisonT > 0 && !P.dead) {               
    P.poisonT -= dt; P.poisonAcc += dt;
    while (P.poisonAcc >= 1 && !P.dead) { P.poisonAcc -= 1; P.hp -= P.poisonDps; spawnText('-' + P.poisonDps, P.pos, 'fl hurt', 2.2); if (P.hp <= 0) { playerDie('Poison'); break; } }
  }
  if (P.cd.dash > 0) P.cd.dash -= dt; if (P.invuln > 0) P.invuln -= dt;
  for (var i = P.buffs.length - 1; i >= 0; i--) { P.buffs[i].t -= dt; if (P.buffs[i].t <= 0) P.buffs.splice(i, 1); }
  if (P.shieldT > 0) { P.shieldT -= dt; if (P.shieldT <= 0) P.shield = 0; }
  if (P.hot) {
    P.hot.t -= dt; P.hot.acc = (P.hot.acc || 0) + dt;
    if (P.hot.acc >= 1) { P.hot.acc -= 1; var a = Math.round(maxHp() * P.hot.frac); P.hp = Math.min(maxHp(), P.hp + a); spawnText('+' + a, P.pos, 'fl heal', 2.2); }
    if (P.hot.t <= 0) P.hot = null;
  }
}

function activeBuffs() {
  var out = [], seen = {};
  P.buffs.forEach(function (b) { if (seen[b.src]) return; seen[b.src] = 1; out.push({ key: b.src, name: b.src, t: b.t, dur: b.dur || b.t, col: b.stat === 'def' ? 0xb0b8d0 : b.stat === 'spd' ? 0x7dffb0 : 0xffa040 }); });
  if (P.shield > 0 && P.shieldT > 0) out.push({ key: 'shield', name: P.shieldSrc || 'Shield Wall', t: P.shieldT, dur: P.shieldDur || P.shieldT, col: 0x6ab7ff });
  if (P.hot) out.push({ key: 'hot', name: P.hot.src || 'Regeneration', t: P.hot.t, dur: P.hot.dur || P.hot.t, col: 0x6dff8f });
  return out;
}
var buffBoxes = [];
function updateBuffFx(dt) {
  var list = P.dead ? [] : activeBuffs().slice(0, 5), tt = performance.now() / 1000;
  while (buffBoxes.length < list.length) { var bx = new THREE.Mesh(new THREE.BoxGeometry(0.24, 0.24, 0.24), new THREE.MeshBasicMaterial({ color: 0xffffff })); scene.add(bx); buffBoxes.push(bx); }
  for (var i = 0; i < buffBoxes.length; i++) {
    var b = buffBoxes[i]; b.visible = i < list.length; if (!b.visible) continue;
    var a = tt * 2.6 + i * TAU / Math.max(1, list.length), r = 1.05 * (P.c.scale || 1);
    b.position.set(P.pos.x + Math.cos(a) * r, 1.1 * (P.c.scale || 1) + Math.sin(tt * 3 + i) * 0.18 + (P.mounted ? 0.5 : 0), P.pos.z + Math.sin(a) * r);
    b.rotation.x += dt * 4; b.rotation.y += dt * 5; b.material.color.setHex(list[i].col);
    var low = list[i].t < 3 && Math.floor(tt * 6) % 2 === 0; b.scale.setScalar(low ? 0.6 : 1);
  }
}
function buffText() {
  var seen = {}, out = [];
  P.buffs.forEach(function (b) { if (!seen[b.src]) { seen[b.src] = 1; out.push(b.src + ' ' + Math.ceil(b.t) + 's'); } });
  if (P.shield > 0) out.push('Shield ' + Math.ceil(P.shield));
  if (P.slowT > 0) out.push('Slowed ' + Math.ceil(P.slowT) + 's'); if (P.poisonT > 0) out.push('Poisoned ' + Math.ceil(P.poisonT) + 's');
  if (P.hot) out.push('Regen ' + Math.ceil(P.hot.t) + 's');
  return out.join('  ');
}

var noSave = false;
function resetGame() {
  noSave = true;
  try { ['moviex_rpg_v3', 'moviex_rpg_v2', 'moviex_rpg_v1', 'moviex_settings'].forEach(function (k) { localStorage.removeItem(k); }); } catch (e) {}
  try { localStorage.clear(); } catch (e) {}
  location.reload();
}
function saveGame() {
  if (noSave) return;
  try { localStorage.setItem(SAVE_KEY, JSON.stringify({ sp: P.sp, alloc: P.alloc, reb: P.reb, taxPaid: P.taxPaid, name: P.name, rolls: P.rolls, upg: P.upg, mounts: P.mounts, codes: P.codes, lvl: P.lvl, xp: P.xp, look: P.look, gold: P.gold, diamonds: P.diamonds, inv: P.inv, owned: P.owned, equip: P.equip, skills: P.skills, slots: P.slots, quests: P.quests, map: P.map })); } catch (e) {}
}
function loadGame() {
  try {
    var s = JSON.parse(localStorage.getItem(SAVE_KEY) || 'null');
    if (!s) return;
    if (s.look) { var Lk = s.look; P.look = { sex: Lk.sex === 'f' ? 'f' : 'm', style: clamp(Lk.style | 0, 0, 6), hair: (Lk.hair | 0) & 0xffffff, shirt: (Lk.shirt | 0) & 0xffffff, pants: (Lk.pants | 0) & 0xffffff }; }
    if (s.name) P.name = String(s.name).slice(0, 14);
    if (s.rolls) for (var rid in s.rolls) { var ro = s.rolls[rid]; if (ro && ITEMS[ro.base] && ITEMS[ro.base].type === 'gear') makeInstance(ro.base, ro.r, rid); }
    P.codes = {}; if (s.codes) for (var cc in s.codes) if (REDEEM[cc]) P.codes[cc] = true;
    P.mounts = {}; if (s.mounts && s.mounts.croc) P.mounts.croc = true; P.mounted = false;
    P.upg = {}; if (s.upg) for (var uid in s.upg) if (ITEMS[uid] && ITEMS[uid].type === 'gear') P.upg[uid] = clamp(s.upg[uid] | 0, 0, MAX_UPG);
    P.lvl = clamp((s.lvl | 0) || 1, 1, MAX_LVL); P.xp = Math.max(0, s.xp | 0); P.gold = Math.max(0, s.gold | 0); P.diamonds = Math.max(0, s.diamonds | 0);
    if (s.inv) { P.inv = { hp_potion: s.inv.hp_potion | 0, mp_potion: s.inv.mp_potion | 0 }; ['godzilla_fragment'].concat(MATERIAL_IDS).forEach(function (mid) { P.inv[mid] = Math.max(0, s.inv[mid] | 0); }); }
    if (s.owned) P.owned = s.owned.filter(function (id) { return ITEMS[id] && ITEMS[id].type === 'gear'; });
    if (P.owned.indexOf('weapon0') < 0) P.owned.unshift('weapon0');
    if (s.equip) SLOTS.forEach(function (sl) { var id = s.equip[sl]; P.equip[sl] = (id && ITEMS[id] && ITEMS[id].slot === sl && P.owned.indexOf(id) >= 0) ? id : (sl === 'weapon' ? 'weapon0' : null); });
    if (s.skills) P.skills = s.skills.filter(function (id) { return SKILLS[id]; });
    DEFAULT_SLOTS.forEach(function (id) { if (P.skills.indexOf(id) < 0) P.skills.push(id); });
    if (s.slots) { P.slots = []; for (var i = 0; i < SKILL_SLOTS; i++) { var sid = s.slots[i]; P.slots.push(sid && P.skills.indexOf(sid) >= 0 ? sid : null); } }
    var al = s.alloc || {}; P.alloc = { hp: Math.max(0, al.hp | 0), dmg: Math.max(0, al.dmg | 0), def: Math.max(0, al.def | 0), crit: Math.max(0, al.crit | 0), cdmg: Math.max(0, al.cdmg | 0) };
    P.reb = clamp(s.reb | 0, 0, 50); P.taxPaid = Math.max(0, s.taxPaid || 0);
    P.sp = (s.sp === undefined) ? Math.max(0, SP_PER_LEVEL * (P.lvl - 1) - P.alloc.hp - P.alloc.dmg - P.alloc.def - P.alloc.crit - P.alloc.cdmg) : Math.max(0, s.sp | 0);
    P.quests = s.quests || {}; if (s.map) P.map = s.map;
  } catch (e) {}
}

function gainXp(amount) {
  if (P.lvl >= MAX_LVL || amount <= 0) return;
  P.xp += amount;
  while (P.lvl < MAX_LVL && P.xp >= xpNext(P.lvl)) {
    P.xp -= xpNext(P.lvl); P.lvl++; P.sp += SP_PER_LEVEL; log('+' + SP_PER_LEVEL + ' stat points! Tap your portrait to spend them.', '#ffd54f');
    P.hp = maxHp(); P.mp = maxMp();
    P.c.lvl = P.lvl; refreshPlayerTag(true);
    pillarFx(P.pos.x, P.pos.z, 0xffe066); ringFx(P.pos.x, P.pos.z, 5, 0xffe066, 0.9);
    burst({ x: P.pos.x, y: 1, z: P.pos.z }, 0xffe066, 24, 4, 6);
    sfx('level');
    var lu = $('levelup'); lu.style.opacity = '1'; lu.style.transform = 'translateX(-50%) scale(1)';
    setTimeout(function () { lu.style.opacity = '0'; lu.style.transform = 'translateX(-50%) scale(.6)'; }, 1600);
    log('LEVEL UP! You are now level ' + P.lvl + '.', '#ffe066');
    MAPS.forEach(function (m) { if (m.min === P.lvl && m.min > 1) log('New map unlocked: ' + m.name + ' (use a portal).', '#9fe3ff'); });
  }
  saveGame();
}


function updatePlayer(dt) {
  var c = P.c;
  P.cd.atk = Math.max(0, P.cd.atk - dt); P.cd.pot = Math.max(0, P.cd.pot - dt);
  for (var id in P.skcd) if (P.skcd[id] > 0) P.skcd[id] -= dt;
  updateBuffs(dt); updateBuffFx(dt);
  if (P.dead) { animateChar(c, dt, 0); return; }

  var mv = getMove(), spd = 0;
  var fy = cam.yaw, fx = -Math.sin(fy), fz = -Math.cos(fy), rx = Math.cos(fy), rz = -Math.sin(fy);
  var wx = rx * mv.x + fx * (-mv.y), wz = rz * mv.x + fz * (-mv.y);
  var inSafe = inSafeZone();
  if (inSafe && !(curMap && curMap.arena)) {        
    P.taxT += dt;
    if (P.taxT >= SAFE_TAX_EVERY) { P.taxT -= SAFE_TAX_EVERY; var tx = Math.min(P.gold, SAFE_TAX); if (tx > 0) { P.gold -= tx; P.taxPaid += tx; spawnText('-' + tx + ' G tax', P.pos, 'fl gold', 2.4); log('Safe-zone tax: -' + tx + ' G', '#ffd54f'); } }
  } else P.taxT = 0;
  if (P.dash > 0) { P.dash -= dt; P.pos.x += P.dashDir.x * P.dashSpeed * dt; P.pos.z += P.dashDir.z * P.dashSpeed * dt; spd = 6; }
  else if (mv.m === 0 && P.dest && !(c.anim && c.anim.type === 'attack')) {      // minimap click-to-move
    var ddx = P.dest.x - P.pos.x, ddz = P.dest.z - P.pos.z, dd = Math.hypot(ddx, ddz);
    if (dd < 0.7) P.dest = null;
    else {
      var sp2 = 5.6 * moveMul(), bx = P.pos.x, bz = P.pos.z;
      P.pos.x += ddx / dd * sp2 * dt; P.pos.z += ddz / dd * sp2 * dt; spd = sp2;
      c.g.rotation.y = turnToward(c.g.rotation.y, Math.atan2(ddx, ddz), 1 - Math.exp(-14 * dt));
      P.destChk = (P.destChk || 0) + dt; P.destMoved = (P.destMoved || 0);
      if (P.destChk > 0.8) { var mvd = Math.hypot(P.pos.x - (P.destX0 || bx), P.pos.z - (P.destZ0 || bz)); if (mvd < sp2 * 0.8 * 0.35) P.dest = null; P.destChk = 0; P.destX0 = P.pos.x; P.destZ0 = P.pos.z; }
    }
  }
  else if (mv.m > 0) {
    P.dest = null;
    var sp = 5.6 * mv.m * moveMul();
    P.pos.x += wx * sp * dt; P.pos.z += wz * sp * dt; spd = sp;
    if (!c.anim || c.anim.type !== 'attack') c.g.rotation.y = turnToward(c.g.rotation.y, Math.atan2(wx, wz), 1 - Math.exp(-14 * dt));
  }
  if ((c.anim && c.anim.type === 'attack') || P.dash > 0) P.dest = null;
  resolveObstacles(P.pos, 0.4);
  var lim = WORLD_R - 2, rr = Math.hypot(P.pos.x, P.pos.z);
  if (rr > lim) { P.pos.x *= lim / rr; P.pos.z *= lim / rr; }
  if (c.anim && c.anim.type === 'attack' && P.target && P.target.state !== 'dead')
    c.g.rotation.y = turnToward(c.g.rotation.y, Math.atan2(P.target.pos.x - P.pos.x, P.target.pos.z - P.pos.z), 1 - Math.exp(-18 * dt));
  if (P.attackHeld) tryBasic();
  P.mp = Math.min(maxMp(), P.mp + (2 + maxMp() * 0.012 + gearSum('mpr')) * dt);
  var hrg = gearSum('hpr'); if (hrg > 0) P.hp = Math.min(maxHp(), P.hp + hrg * dt);
  if (inSafe) P.hp = Math.min(maxHp(), P.hp + maxHp() * 0.06 * dt);
  else if (!inCombat()) P.hp = Math.min(maxHp(), P.hp + maxHp() * 0.015 * dt);
  if (P.target && (P.target.state === 'dead' || Math.hypot(P.target.pos.x - P.pos.x, P.target.pos.z - P.pos.z) > 28)) P.target = null;
  animateChar(c, dt, spd); updateMount(dt, spd);
  updateRare(c, dt, performance.now() / 1000); updateUpg(c, dt, performance.now() / 1000);
}
