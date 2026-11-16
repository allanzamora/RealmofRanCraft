/* combat.js - targeting, damage, basic attack, 25-skill executor, potions, pickups/loot */
var ui = { open: null, render: null };
function canAct() { return !P.dead && ui.open !== 'name'; }
function nearestEnemy(maxD) {
  var best = null, bd = maxD * maxD;
  for (var i = 0; i < enemies.length; i++) {
    var e = enemies[i]; if (e.state === 'dead') continue;
    var dx = e.pos.x - P.pos.x, dz = e.pos.z - P.pos.z, d2 = dx * dx + dz * dz;
    if (d2 < bd) { bd = d2; best = e; }
  }
  if (curMap && curMap.arena) for (var j = 0; j < ais.length; j++) {          // arena: auto-aim at the nearest fighter
    var a = ais[j]; if (a.state === 'dead') continue;
    var ax = a.pos.x - P.pos.x, az = a.pos.z - P.pos.z, ad = ax * ax + az * az;
    if (ad < bd) { bd = ad; best = a; }
  }
  return best;
}
function setTarget(e) { P.target = e; }
function autoTarget(maxD) {
  var t = P.target;
  if (t && t.isAI && !(t.hostile > 0)) t = null;
  if (t && t.state !== 'dead' && Math.hypot(t.pos.x - P.pos.x, t.pos.z - P.pos.z) <= maxD + 4) return t;
  t = nearestEnemy(maxD); P.target = t; return t;
}
function facingVec() { return { x: Math.sin(P.c.g.rotation.y), z: Math.cos(P.c.g.rotation.y) }; }
function distTo(e) { return Math.hypot(e.pos.x - P.pos.x, e.pos.z - P.pos.z); }
function inCone(e, range, cone) {
  var dx = e.pos.x - P.pos.x, dz = e.pos.z - P.pos.z, d = Math.hypot(dx, dz);
  if (d > range + 0.6 * e.T.scale) return false;
  if (d < 0.8) return true;
  var f = facingVec(), dot = (dx * f.x + dz * f.z) / d;
  return Math.acos(clamp(dot, -1, 1)) <= cone / 2;
}
function startDashTo(e, stopDist) {
  var dx = e.pos.x - P.pos.x, dz = e.pos.z - P.pos.z, d = Math.hypot(dx, dz);
  if (d > stopDist && d < 9) { P.dash = 0.16; P.dashDir.x = dx / d; P.dashDir.z = dz / d; P.dashSpeed = clamp((d - stopDist) / 0.16, 2, 22); }
}
function snapFaceTo(e) { P.c.g.rotation.y = Math.atan2(e.pos.x - P.pos.x, e.pos.z - P.pos.z); }
function eachEnemy(fn) {
  for (var i = enemies.length - 1; i >= 0; i--) if (enemies[i].state !== 'dead') fn(enemies[i]);
  for (var j = ais.length - 1; j >= 0; j--) if (ais[j].state !== 'dead' && ais[j].hostile > 0) fn(ais[j]);
}

/* XP rule: a hero more than XP_CUTOFF levels above the mob gets no EXP (loot only) */
function xpFor(T) {
  if (P.lvl - T.lvl > XP_CUTOFF) return 0;
  return Math.max(1, Math.round(T.xp * clamp(1 + (T.lvl - P.lvl) * 0.12, 0.15, 1.8)));
}

function hurtEnemy(e, base, o) {
  if (e.state === 'dead') return 0;
  o = o || {};
  var by = o.by || null, near = distP(e.pos) < 42;
  if (e.isAI && !by && !(e.hostile > 0)) return 0;          // AI players can only be hit after PK is enabled
  if (e.isAI && !by) { if (inSafeZone() || aiInSafe(e)) return 0; e.hostile = 60; }
  var crit = by ? Math.random() < 0.12 : Math.random() < critChance();
  var mult = (o.execute && e.hp < e.maxHp * 0.35) ? o.execute : 1;
  var d = Math.max(1, Math.round(base * mult * rand(0.9, 1.1) * (crit ? (by ? 1.8 : critMul()) : 1) - e.T.def * 0.5));
  e.hp -= d; e.c.flash = 0.12; e.c.hitT = 0.2;
  if (o.stun) e.stun = Math.max(e.stun || 0, e.T.boss ? o.stun * 0.4 : o.stun);
  if (o.slow) e.slow = Math.max(e.slow || 0, o.slow);
  if (near) {
    spawnText(String(d), e.pos, crit ? 'fl crit' : 'fl dmg', 2.1 * e.T.scale);
    burst({ x: e.pos.x, y: 1.1 * e.T.scale, z: e.pos.z }, o.color || (crit ? 0xffa726 : 0xff5a4a), crit ? 10 : 6, 3, 4);
    sfx(crit ? 'crit' : 'hit');
  }
  if (!by) P.lastCombat = gameTime;
  e.c.tag.draw(Math.max(0, e.hp / e.maxHp));
  if (e.isAI) { e.hostile = 60; e.pkBy = P; e.lastHitBy = by; }
  else if (by) { e.aiT = 2.5; e.aiBy = by; }
  else if (e.state === 'idle' || e.state === 'return') { if (!inSafeZone()) e.state = 'chase'; }
  var src = by || P;
  if (!o.noKnock && !e.T.boss && !e.isAI) { var dx = e.pos.x - src.pos.x, dz = e.pos.z - src.pos.z, dd = Math.hypot(dx, dz) || 1; e.pos.x += dx / dd * 0.25; e.pos.z += dz / dd * 0.25; }
  if (e.hp <= 0) { if (e.isAI) killAI(e, by); else killEnemy(e, by); }
  return d;
}
function inSafeZone() { return Math.hypot(P.pos.x, P.pos.z) < SAFE_R; }
function aiInSafe(a) { return Math.hypot(a.pos.x, a.pos.z) < SAFE_R; }
function distP(pos) { return Math.hypot(pos.x - P.pos.x, pos.z - P.pos.z); }

/* ---------- pickups ---------- */
var pickups = [];
var coinGeo = new THREE.CylinderGeometry(0.17, 0.17, 0.04, 14); coinGeo.rotateX(Math.PI / 2);
var coinMat = new THREE.MeshStandardMaterial({ color: 0xffd23a, metalness: 0.8, roughness: 0.3, emissive: 0x886600, emissiveIntensity: 0.6 });
var botGeo = new THREE.SphereGeometry(0.16, 10, 8), neckGeo = new THREE.CylinderGeometry(0.05, 0.05, 0.14, 6);
var gemGeo = new THREE.OctahedronGeometry(0.25, 0), beamGeo = new THREE.CylinderGeometry(0.04, 0.04, 3, 6);
var mats_item = { hp: new THREE.MeshStandardMaterial({ color: 0xe53935, emissive: 0x7a0000, emissiveIntensity: 0.6 }),
  mp: new THREE.MeshStandardMaterial({ color: 0x2979ff, emissive: 0x001a7a, emissiveIntensity: 0.6 }),
  gear: new THREE.MeshStandardMaterial({ color: 0xffe066, emissive: 0xaa7700, emissiveIntensity: 0.9 }),
  beam: new THREE.MeshBasicMaterial({ color: 0xffe066, transparent: true, opacity: 0.45 }) };
function addPickup(mesh, type, id, amount, pos) {
  mesh.position.set(pos.x, 0.8, pos.z); scene.add(mesh);
  pickups.push({ m: mesh, type: type, id: id, amount: amount, t: 0, vx: rand(-1.6, 1.6), vz: rand(-1.6, 1.6), vy: rand(4, 6), life: 90 });
}
function dropGold(pos, amount) { addPickup(new THREE.Mesh(coinGeo, coinMat), 'gold', null, amount, pos); }
var matsMat = {};
function dropItem(pos, id) {
  var it = ITEMS[id], g = new THREE.Group();
  if (it.type === 'potion') { g.add(new THREE.Mesh(botGeo, id === 'hp_potion' ? mats_item.hp : mats_item.mp)); var n = new THREE.Mesh(neckGeo, mats_item.gear); n.position.y = 0.2; g.add(n); }
  else if (it.type === 'material') { var mm2 = matsMat[id] || (matsMat[id] = new THREE.MeshStandardMaterial({ color: it.color, emissive: it.color, emissiveIntensity: 0.7 })); g.add(new THREE.Mesh(gemGeo, mm2)); var b2 = new THREE.Mesh(beamGeo, new THREE.MeshBasicMaterial({ color: it.color, transparent: true, opacity: 0.45 })); b2.position.y = 1.4; g.add(b2); }
  else { g.add(new THREE.Mesh(gemGeo, mats_item.gear)); var b = new THREE.Mesh(beamGeo, mats_item.beam); b.position.y = 1.4; g.add(b); }
  addPickup(g, 'item', id, 1, pos);
}
function clearPickups() { pickups.forEach(function (p) { scene.remove(p.m); }); pickups.length = 0; }
function updatePickups(dt) {
  var lootR = Math.max(3.8, petBonus('loot'));
  for (var i = pickups.length - 1; i >= 0; i--) {
    var p = pickups[i]; p.t += dt; p.life -= dt; var m = p.m;
    if (p.t < 0.55) { m.position.x += p.vx * dt; m.position.z += p.vz * dt; p.vy -= 16 * dt; m.position.y += p.vy * dt; if (m.position.y < 0.4) { m.position.y = 0.4; p.vy = 0; } }
    else m.position.y = 0.45 + Math.sin(p.t * 3) * 0.08;
    m.rotation.y += dt * 2.5;
    var dx = P.pos.x - m.position.x, dz = P.pos.z - m.position.z, d = Math.hypot(dx, dz);
    if (!P.dead && p.t > 0.6 && d < lootR) { var sp = (lootR > 3.8 ? 16 : 9) * dt / Math.max(d, 0.001); m.position.x += dx * sp; m.position.z += dz * sp; }
    if (!P.dead && p.t > 0.6 && d < 0.9) {
      if (p.type === 'gold') { P.gold += p.amount; spawnText('+' + p.amount + ' G', P.pos, 'gold', 2.2); sfx('coin'); }
      else {
        var gid = giveDrop(p.id), gi = ITEMS[gid]; sfx('coin');
        if (gi.type === 'gear') { log((gi.rare ? '★ RARE DROP! ' : 'Looted ') + gi.name + ': ' + gi.rolls.map(statText).join(', '), gi.rare ? '#ff7aff' : '#ffe066'); log('Open BAG to equip.', '#9fe3ff'); }
        else log('Looted ' + gi.name + '.', gi.type === 'material' ? '#7fe8ff' : '#ffe066');
      }
      scene.remove(m); pickups.splice(i, 1); saveGame(); continue;
    }
    if (p.life <= 0) { scene.remove(m); pickups.splice(i, 1); }
  }
}

function killEnemy(e, by) {
  e.state = 'dead'; e.deadT = 0; e.hp = 0; e.aiT = 0;
  startDeath(e.c, e.pos); e.c.tag.spr.visible = false;
  if (P.target === e) P.target = null;
  if (by) { aiGainXp(by, e.T); return; }       // an AI player got the kill: no loot/XP/quest for you
  var xp = xpFor(e.T); if (xp > 0) xp = Math.round(xp * (1 + costumeSum('exp') / 100));   // costume EXP boost
  if (xp > 0) { spawnText('+' + xp + ' XP', P.pos, 'xp', 2.4); log('Defeated ' + e.T.name + '. +' + xp + ' XP', '#9fe3ff'); gainXp(xp); }
  else { spawnText('No EXP', P.pos, 'info', 2.4); log('Defeated ' + e.T.name + ' (level too low for EXP - loot only).', '#b8b8b8'); }
  dropGold(e.pos, randInt(e.T.gold[0], e.T.gold[1]));
  rollDrops(e).forEach(function (id) { dropItem(e.pos, id); });
  var q = currentQuest();
  if (q && P.quests[q.id] && P.quests[q.id].state === 'active' && q.target === e.type) {
    var s = P.quests[q.id]; s.n++;
    if (s.n >= q.need) { s.n = q.need; s.state = 'ready'; log('Quest complete: ' + q.title + '! Return to Elder Rowan.', '#7dff9a'); sfx('level'); }
    else log(q.title + ': ' + s.n + '/' + q.need, '#ffd54f');
    refreshMarkers(); saveGame();
  }
  if (e.T.boss) log(e.T.name + ' has fallen!', '#ff9a3a');
}

/* ---------- basic attack ---------- */
function tryBasic() {
  if (!canAct() || P.cd.atk > 0) return;
  dismount('You dismount to fight.');
  P.cd.atk = 0.6 / (1 + Math.max(0, buffSum('spd')));
  var t = autoTarget(7);
  if (t) { snapFaceTo(t); startDashTo(t, 2.0); }
  startAnim(P.c, 'attack', 0.55); sfx('swing');
  schedule(0.26, function () {
    if (P.dead) return;
    var f = facingVec();
    slashFx(P.pos.x + f.x * 0.6, P.pos.z + f.z * 0.6, P.c.g.rotation.y, 0xfff2a0, 2.6, Math.PI * 0.9);
    var tgt = null;
    if (P.target && P.target.state !== 'dead' && inCone(P.target, 3.0, Math.PI * 0.9)) tgt = P.target;
    else { var bd = 1e9; eachEnemy(function (e) { if (!inCone(e, 3.0, Math.PI * 0.9)) return; var d = distTo(e); if (d < bd) { bd = d; tgt = e; } }); }
    if (tgt) { if (!P.target) P.target = tgt; hurtEnemy(tgt, atkVal()); }
  });
}

/* ---------- skills ---------- */
function orbFx(x0, z0, x1, z1, color, dur, big) {
  var m = new THREE.Mesh(new THREE.SphereGeometry(big ? 0.5 : 0.28, 10, 8), new THREE.MeshBasicMaterial({ color: color }));
  m.position.set(x0, 1.3, z0); scene.add(m);
  fxList.push({ t: 0, dur: dur, obj: m, update: function (k) { m.position.x = lerp(x0, x1, k); m.position.z = lerp(z0, z1, k); m.position.y = 1.3 + Math.sin(k * Math.PI) * 0.4; } });
}
function lightningFx(x, z, color) {
  var m = new THREE.Mesh(new THREE.CylinderGeometry(0.12, 0.12, 14, 5), new THREE.MeshBasicMaterial({ color: color || 0xdff3ff, transparent: true, opacity: 0.95 }));
  m.position.set(x, 7, z); scene.add(m);
  fxList.push({ t: 0, dur: 0.25, obj: m, update: function (k) { m.material.opacity = 0.95 * (1 - k); } });
  ringFx(x, z, 1.6, color || 0xdff3ff, 0.3); burst({ x: x, y: 0.5, z: z }, color || 0xdff3ff, 6, 3, 4);
}
function skillTarget(range) { var t = autoTarget(range || 8); if (t) snapFaceTo(t); return t; }
function aoeHit(sk, k, mult) {
  eachEnemy(function (e) { if (distTo(e) <= sk.radius + 0.5 * e.T.scale) hurtEnemy(e, atkVal() * sk.mult * (mult || 1), { stun: sk.stun, color: sk.color, execute: sk.execute }); });
}

var SKILL_EXEC = {
  cone: function (sk) {
    var t = skillTarget(sk.dash ? 9 : 7); if (t) startDashTo(t, sk.dash > 5 ? 1.8 : 2.2);
    startAnim(P.c, 'attack', 0.6);
    var hits = sk.hits || 1;
    for (var h2 = 0; h2 < hits; h2++) (function (i) {
      schedule(0.26 + i * (hits > 1 ? 0.14 : 0), function () {
        if (P.dead) return;
        var f = facingVec();
        slashFx(P.pos.x + f.x * 0.5, P.pos.z + f.z * 0.5, P.c.g.rotation.y, sk.healSelf ? 0xb36bff : (sk.dash > 5 ? 0x9bd0ff : 0xff9a3a), sk.range, sk.cone);
        var tot = 0;
        eachEnemy(function (e) { if (inCone(e, sk.range, sk.cone)) tot += hurtEnemy(e, atkVal() * sk.mult, { execute: sk.execute }); });
        if (tot && sk.healSelf) { var a = Math.round(maxHp() * sk.healSelf); P.hp = Math.min(maxHp(), P.hp + a); spawnText('+' + a, P.pos, 'fl heal', 2.2); }
        if (tot && sk.mpGain) P.mp = Math.min(maxMp(), P.mp + Math.round(maxMp() * sk.mpGain));
      });
    })(h2);
  },
  aoe: function (sk) {
    startAnim(P.c, 'spin', 0.7);
    ringFx(P.pos.x, P.pos.z, sk.radius, sk.color || 0x6ab7ff, 0.5);
    if (sk.healSelf) { var a = Math.round(maxHp() * sk.healSelf); P.hp = Math.min(maxHp(), P.hp + a); spawnText('+' + a, P.pos, 'fl heal', 2.2); }
    var n = sk.hits || 1, per = n > 1 ? 0.6 : 1;
    for (var i = 0; i < n; i++) (function (i) {
      schedule(0.18 + i * (0.5 / Math.max(1, n - 1 || 1)) * (n > 1 ? 1 : 0), function () {
        if (P.dead) return;
        ringFx(P.pos.x, P.pos.z, sk.radius, sk.color || 0x9bd0ff, 0.35); aoeHit(sk, i, per);
        if (sk.radius > 8) pillarFx(P.pos.x, P.pos.z, sk.color);
      });
    })(i);
  },
  heal: function (sk) {
    startAnim(P.c, 'cast', 0.8);
    schedule(0.3, function () {
      if (P.dead) return;
      var amt = Math.round(maxHp() * sk.frac); P.hp = Math.min(maxHp(), P.hp + amt);
      spawnText('+' + amt, P.pos, 'fl heal', 2.2); ringFx(P.pos.x, P.pos.z, 3, 0x6dff8f, 0.7); pillarFx(P.pos.x, P.pos.z, 0x6dff8f);
      burst({ x: P.pos.x, y: 0.3, z: P.pos.z }, 0x8dffa8, 18, 1.5, 4);
    });
  },
  bolt: function (sk) {
    var t = skillTarget(sk.range); startAnim(P.c, 'cast', 0.6);
    var f = facingVec(), tx = t ? t.pos.x : P.pos.x + f.x * 6, tz = t ? t.pos.z : P.pos.z + f.z * 6;
    schedule(0.25, function () {
      if (P.dead) return;
      orbFx(P.pos.x, P.pos.z, tx, tz, sk.color || 0xff7a2a, 0.22);
      schedule(0.22, function () {
        if (!t || t.state === 'dead') return;
        var d = hurtEnemy(t, atkVal() * sk.mult, { slow: sk.slow, color: sk.color });
        ringFx(t.pos.x, t.pos.z, 2, sk.color || 0xff7a2a, 0.3);
        if (sk.heal && d) { var a = Math.round(d * sk.heal); P.hp = Math.min(maxHp(), P.hp + a); spawnText('+' + a, P.pos, 'fl heal', 2.2); }
      });
    });
  },
  buff: function (sk) {
    startAnim(P.c, 'cast', 0.7);
    for (var st in sk.buff) addBuff(st, sk.buff[st], sk.dur, sk.name);
    ringFx(P.pos.x, P.pos.z, 2.6, st === 'def' ? 0xc0c0d0 : (st === 'spd' ? 0x9bffd0 : 0xffb04a), 0.6); pillarFx(P.pos.x, P.pos.z, 0xffb04a);
    log(sk.name + ' active (' + sk.dur + 's).', '#ffd54f');
  },
  shield: function (sk) {
    startAnim(P.c, 'cast', 0.7);
    P.shield = Math.round(maxHp() * sk.frac); P.shieldT = sk.dur; P.shieldDur = sk.dur; P.shieldSrc = sk.name;
    ringFx(P.pos.x, P.pos.z, 2.6, 0x9bd0ff, 0.6); pillarFx(P.pos.x, P.pos.z, 0x9bd0ff);
    spawnText('Shield ' + P.shield, P.pos, 'fl info', 2.4);
  },
  hot: function (sk) {
    startAnim(P.c, 'cast', 0.7); P.hot = { frac: sk.frac, t: sk.dur, dur: sk.dur, acc: 0, src: sk.name };
    ringFx(P.pos.x, P.pos.z, 3, 0x6dff8f, 0.6); pillarFx(P.pos.x, P.pos.z, 0x6dff8f);
  },
  chain: function (sk) {
    var t = skillTarget(sk.range); startAnim(P.c, 'cast', 0.6);
    if (!t) { log('No target in range.', '#ccc'); return; }
    schedule(0.25, function () {
      if (P.dead) return;
      var hit = [], cur = t, fx0 = P.pos.x, fz0 = P.pos.z;
      for (var i = 0; i < sk.n && cur; i++) {
        hit.push(cur); orbFx(fx0, fz0, cur.pos.x, cur.pos.z, 0xdff3ff, 0.1); sfx('zap');
        hurtEnemy(cur, atkVal() * sk.mult * (1 - i * 0.12), { color: 0xdff3ff });
        fx0 = cur.pos.x; fz0 = cur.pos.z;
        var nx = null, bd = 7;
        eachEnemy(function (e) { if (hit.indexOf(e) >= 0) return; var d = Math.hypot(e.pos.x - fx0, e.pos.z - fz0); if (d < bd) { bd = d; nx = e; } });
        cur = nx;
      }
    });
  },
  meteor: function (sk) {
    var t = skillTarget(sk.range); startAnim(P.c, 'cast', 0.8);
    var f = facingVec(), tx = t ? t.pos.x : P.pos.x + f.x * 7, tz = t ? t.pos.z : P.pos.z + f.z * 7;
    ringFx(tx, tz, sk.radius, 0xff5a1a, sk.delay);
    var m = new THREE.Mesh(new THREE.SphereGeometry(1.1, 12, 8), new THREE.MeshBasicMaterial({ color: 0xff6a1a })); scene.add(m);
    fxList.push({ t: 0, dur: sk.delay, obj: m, update: function (k) { m.position.set(tx - (1 - k) * 8, 1 + (1 - k) * 28, tz); } });
    schedule(sk.delay, function () {
      ringFx(tx, tz, sk.radius, 0xffa040, 0.5); pillarFx(tx, tz, 0xff6a1a); burst({ x: tx, y: 1, z: tz }, 0xff8a2a, 26, 6, 7);
      eachEnemy(function (e) { if (Math.hypot(e.pos.x - tx, e.pos.z - tz) <= sk.radius + 0.5 * e.T.scale) hurtEnemy(e, atkVal() * sk.mult, { color: 0xff8a2a, stun: 0.8 }); });
    });
  },
  step: function (sk) {
    var t = skillTarget(sk.range);
    if (!t) { log('No target in range.', '#ccc'); P.cd.skillRefund = true; return; }
    burst({ x: P.pos.x, y: 1, z: P.pos.z }, 0x6a3aff, 14, 3, 4);
    var a = t.c.g.rotation.y + Math.PI, bx = t.pos.x + Math.sin(a) * 1.6, bz = t.pos.z + Math.cos(a) * 1.6;
    P.pos.x = bx; P.pos.z = bz; snapFaceTo(t); startAnim(P.c, 'attack', 0.5);
    burst({ x: P.pos.x, y: 1, z: P.pos.z }, 0x6a3aff, 14, 3, 4);
    schedule(0.22, function () { if (!P.dead && t.state !== 'dead') { slashFx(P.pos.x, P.pos.z, P.c.g.rotation.y, 0xaa77ff, 3, 2); hurtEnemy(t, atkVal() * sk.mult, { color: 0xaa77ff }); } });
  },
  storm: function (sk) {
    startAnim(P.c, 'cast', 0.9); ringFx(P.pos.x, P.pos.z, sk.radius, 0xdff3ff, 0.8);
    for (var i = 0; i < sk.strikes; i++) (function (i) {
      schedule(0.3 + i * (sk.dur / sk.strikes), function () {
        if (P.dead) return;
        var tg = nearestEnemy(sk.radius + 2), x, z;
        if (tg && Math.random() < 0.8) { x = tg.pos.x + rand(-0.8, 0.8); z = tg.pos.z + rand(-0.8, 0.8); }
        else { var a = rand(0, TAU), r = rand(2, sk.radius); x = P.pos.x + Math.cos(a) * r; z = P.pos.z + Math.sin(a) * r; }
        lightningFx(x, z); sfx('zap');
        eachEnemy(function (e) { if (Math.hypot(e.pos.x - x, e.pos.z - z) <= 2.4 + 0.5 * e.T.scale) hurtEnemy(e, atkVal() * sk.mult, { color: 0xdff3ff, stun: 0.5 }); });
      });
    })(i);
  }
};

function slotSkill(i) { return P.slots[i] ? SKILLS[P.slots[i]] : null; }
function useSkillSlot(i) {
  var id = P.slots[i]; if (id) useSkill(id);
}
var ATTACK_KINDS = { cone: 1, aoe: 1, bolt: 1, chain: 1, meteor: 1, step: 1, storm: 1, anvil: 1, laser: 1, starfall: 1, icecrack: 1, hsword: 1, angel: 1, skelly: 1, ewave: 1 };
function useSkill(id) {
  if (!canAct()) return;
  var sk = SKILLS[id]; if (!sk) return;
  if ((P.skcd[id] || 0) > 0) return;
  if (P.mp < sk.mp) { log('Not enough MP.', '#8ab4ff'); return; }
  if (ATTACK_KINDS[sk.kind]) {                      // every attack skill needs a proper target before it can be cast
    var need = Math.max(sk.range || 0, (sk.radius || 0) + 2.5, 5);
    if (!autoTarget(need)) { log('No target in range for ' + sk.name + '.', '#ccc'); return; }
  }
  dismount('You dismount to fight.');
  P.cd.skillRefund = false;
  P.mp -= sk.mp; P.skcd[id] = sk.cd / (1 + Math.max(0, buffSum('spd')) * 0.5); P.lastCombat = gameTime;
  sfx(sk.kind === 'heal' || sk.kind === 'hot' ? 'heal' : 'skill');
  SKILL_EXEC[sk.kind](sk);
  if (P.cd.skillRefund) { P.mp += sk.mp; P.skcd[id] = 0; }
}

function usePotion(id) {
  if (!canAct() || P.cd.pot > 0) return;
  if (!P.inv[id]) { log('No ' + itemLabel(id) + '.', '#ff9a9a'); return; }
  var it = ITEMS[id];
  if (id === 'hp_potion') {
    if (P.hp >= maxHp()) { log('HP is already full.', '#ccc'); return; }
    var a = Math.round(maxHp() * it.frac); P.hp = Math.min(maxHp(), P.hp + a); spawnText('+' + a, P.pos, 'fl heal', 2.2);
  } else {
    if (P.mp >= maxMp()) { log('MP is already full.', '#ccc'); return; }
    var m = Math.round(maxMp() * it.frac); P.mp = Math.min(maxMp(), P.mp + m); spawnText('+' + m + ' MP', P.pos, 'fl xp', 2.2);
  }
  P.inv[id]--; P.cd.pot = 1.2; sfx('heal');
  burst({ x: P.pos.x, y: 1, z: P.pos.z }, id === 'hp_potion' ? 0xff6b6b : 0x6ab7ff, 10, 1.5, 3);
  saveGame();
}

function damagePlayer(e, mul) {
  if (P.dead) return;
  if (P.invuln > 0) { spawnText('Dodge', P.pos, 'fl info', 2.5); return; }
  var raw = e.T.atk * (mul || 1) * rand(0.85, 1.15);
  var dmg = Math.max(1, Math.round(raw - defVal() * 0.6));
  if (P.shield > 0) { var ab = Math.min(P.shield, dmg); P.shield -= ab; dmg -= ab; spawnText('Block ' + ab, P.pos, 'fl info', 2.5); }
  P.c.flash = 0.12; P.c.hitT = 0.2; P.lastCombat = gameTime; sfx('hurt');
  if (dmg <= 0) return;
  P.hp -= dmg; spawnText('-' + dmg, P.pos, 'fl hurt', 2.2);
  var v = $('vignette'); v.style.opacity = '1'; setTimeout(function () { v.style.opacity = '0'; }, 160);
  if (P.hp <= 0) { playerDie(e.T.name); return; }
  if (e.T.onHit) applyOnHit(e.T.onHit);
}

/* ---------- PK: attack AI players ---------- */
function startPK(a) {
  if (!a || a.state === 'dead') return;
  if (inSafeZone() || aiInSafe(a)) { log('PK is not allowed inside the safe zone.', '#ff9a9a'); return; }
  a.hostile = 60; a.pkBy = P; P.target = a; P.lastCombat = gameTime;
  a.c.tag.draw(a.hp / a.maxHp);
  log('PK! ' + a.name + ' (Lv' + a.lvl + ') is now hostile - attack to kill!', '#ff7a7a'); sfx('hurt');
}
function killAI(a, by) {
  a.state = 'dead'; a.deadT = 0; a.hp = 0; a.hostile = 0; a.tgt = null;
  startDeath(a.c, a.pos); a.c.tag.spr.visible = false;
  if (P.target === a) P.target = null;
  if (by) { log('[PK] ' + by.name + ' was defeated by ' + a.name + '.', '#ff9a9a'); return; }
  if (curMap && curMap.arena) { log('Arena: you defeated ' + a.name + ' (Lv' + a.lvl + '). No drops here.', '#ff9a3a'); return; }
  var gold = Math.round(a.lvl * 25 + a.gold * 0.1);
  P.gold += gold; spawnText('+' + gold + ' G', P.pos, 'gold', 2.4);
  log('PK victory! You defeated ' + a.name + ' (Lv' + a.lvl + '). +' + gold + ' G', '#ff9a3a');
  if (Math.random() < 0.35) dropItem(a.pos, Math.random() < 0.5 ? 'hp_potion' : 'mp_potion');
  if (Math.random() < 0.08) { var sl = SLOTS[randInt(0, SLOTS.length - 1)], tr = clamp(Math.ceil(a.lvl / 12), 1, 5); dropItem(a.pos, sl === 'weapon' ? 'weapon' + tr : sl + tr); }
  saveGame();
}

/* ---------- default skill: DASH (quick dodge in move direction, brief invulnerability) ---------- */
var DASH_CD = 4;
function tryDash() {
  if (P.dead || P.cd.dash > 0 || !canAct()) return;
  var mv = getMove(), dx, dz, fy = cam.yaw;
  if (mv.m > 0.05) { dx = Math.cos(fy) * mv.x + (-Math.sin(fy)) * (-mv.y); dz = (-Math.sin(fy)) * mv.x + (-Math.cos(fy)) * (-mv.y); var l = Math.hypot(dx, dz) || 1; dx /= l; dz /= l; }
  else { var yaw = P.c.g.rotation.y; dx = Math.sin(yaw); dz = Math.cos(yaw); }
  P.dash = 0.18; P.dashDir.x = dx; P.dashDir.z = dz; P.dashSpeed = 42; P.cd.dash = DASH_CD; P.invuln = 0.4;
  P.c.g.rotation.y = Math.atan2(dx, dz); burst(P.pos.clone ? P.pos.clone() : P.pos, 0x9bd0ff, 12, 4, 1); sfx('ui');
}

/* ---------- mounts: buy at the Stable Master, ride with the RIDE button; attacking dismounts you ---------- */
var MOUNT_SPEED = 1.7, AI_MOUNT_SPEED = 1.2, MOUNT_H = -0.12;
var MOUNTS = { croc: { name: 'Crocodile', price: 25000, desc: 'Ride speed x1.7. You dismount automatically when you attack.' } };
var mountObj = null;
function makeCrocMount(crown) {
  var g = new THREE.Group(), tail = [], legs = [];
  function M(c, ex) { var p = { color: c, roughness: 0.8, metalness: 0.02 }; if (ex) for (var k in ex) p[k] = ex[k]; return new THREE.MeshStandardMaterial(p); }
  var green = M(0x3f7a3a), dark = M(0x2a5a2a), belly = M(0xc8c07a), tooth = M(0xf4f0dc), eye = M(0xffdd00, { emissive: 0xffaa00, emissiveIntensity: 0.8 });
  function box(w, h, d, mat, x, y, z, par) { var m = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), mat); m.position.set(x, y, z); m.castShadow = true; (par || g).add(m); return m; }
  box(1.0, 0.5, 2.2, green, 0, 0.45, 0); box(0.8, 0.12, 2.0, belly, 0, 0.17, 0);
  for (var i = 0; i < 7; i++) box(0.16, 0.14, 0.2, dark, 0, 0.75, -0.95 + i * 0.32);          // back ridges
  box(0.85, 0.42, 0.5, green, 0, 0.48, 1.3);                                                  // head
  box(0.66, 0.2, 1.0, green, 0, 0.48, 1.85); box(0.58, 0.1, 0.95, belly, 0, 0.32, 1.82);      // snout + lower jaw
  for (var j = 0; j < 4; j++) { box(0.05, 0.07, 0.06, tooth, 0.31, 0.38, 1.5 + j * 0.24); box(0.05, 0.07, 0.06, tooth, -0.31, 0.38, 1.5 + j * 0.24); }
  box(0.14, 0.14, 0.14, eye, 0.28, 0.74, 1.25); box(0.14, 0.14, 0.14, eye, -0.28, 0.74, 1.25);
  box(0.07, 0.05, 0.07, dark, 0.1, 0.6, 2.28); box(0.07, 0.05, 0.07, dark, -0.1, 0.6, 2.28);  // nostrils
  if (crown) {                                                                                 // golden crown (Croczilla)
    var goldM = M(0xffd24a, { metalness: 0.8, roughness: 0.25, emissive: 0xffa800, emissiveIntensity: 0.55 }), gemR = M(0xff2244, { emissive: 0xff0022, emissiveIntensity: 0.9 }), gemB = M(0x33aaff, { emissive: 0x1188ff, emissiveIntensity: 0.9 });
    box(0.62, 0.14, 0.5, goldM, 0, 0.74, 1.2);
    for (var ci = 0; ci < 5; ci++) { box(0.1, 0.26, 0.1, goldM, -0.24 + ci * 0.12, 0.9, ci % 2 ? 1.1 : 1.3); box(0.07, 0.07, 0.07, ci % 2 ? gemB : gemR, -0.24 + ci * 0.12, 1.07, ci % 2 ? 1.1 : 1.3); }
    box(0.1, 0.1, 0.06, gemR, 0, 0.74, 1.46);
  }
  var wd = [0.8, 0.62, 0.46, 0.32, 0.2], ht = [0.4, 0.32, 0.26, 0.2, 0.14], L = 0.55, par = g, px = -1.1;
  for (var t = 0; t < 5; t++) {                                                               // tail: 5 segments that wag
    var sg = new THREE.Group(); sg.position.set(0, t === 0 ? 0.42 : 0, t === 0 ? px : -L); par.add(sg);
    box(wd[t], ht[t], L + 0.04, t % 2 ? dark : green, 0, 0, -L / 2, sg); box(0.1, 0.1, 0.16, dark, 0, ht[t] / 2 + 0.03, -L / 2, sg);
    tail.push(sg); par = sg;
  }
  [[0.58, 0.75], [-0.58, 0.75], [0.58, -0.75], [-0.58, -0.75]].forEach(function (p, k) {       // short splayed legs
    var lg = new THREE.Group(); lg.position.set(p[0], 0.3, p[1]); g.add(lg);
    box(0.24, 0.34, 0.3, dark, p[0] > 0 ? 0.08 : -0.08, -0.15, 0, lg); box(0.3, 0.07, 0.38, green, p[0] > 0 ? 0.12 : -0.12, -0.31, 0.06, lg);
    lg.userData.k = k; legs.push(lg);
  });
  return { g: g, tail: tail, legs: legs };
}
function applyMountVisual() {
  if (!mountObj) { mountObj = makeCrocMount(); P.c.g.add(mountObj.g); }
  mountObj.g.visible = !!P.mounted;
  if (P.c.tag && P.c.tag.spr) P.c.tag.spr.position.y = P.mounted ? 2.75 : 2.6;
  if (!P.mounted) { P.c.rig.body.position.y = 0; }
}
function toggleMount() {
  if (P.dead) return;
  if (P.mounted) { dismount('You get off your Crocodile.'); return; }
  if (!P.mounts.croc) { log('You have no mount. Visit the Stable Master (Garrick) at the camp.', '#ffcc88'); return; }
  P.mounted = true; applyMountVisual(); sfx('ui'); log('You ride your Crocodile! Speed x' + MOUNT_SPEED + '.', '#9ff59f');
}
function dismount(msg) {
  if (!P.mounted) return;
  P.mounted = false; applyMountVisual(); if (msg) log(msg, '#cfd8ff');
}
function updateMount(dt, spd) {
  if (!P.mounted || !mountObj) return;
  var r = P.c.rig, t = performance.now() / 1000, mv = P.c.mv, ph = P.c.phase * 0.9;
  r.body.position.y += MOUNT_H;                                   // rider sits on the croc's back
  r.legR.hp.rotation.x = -1.15; r.legL.hp.rotation.x = -1.15; r.legR.kn.rotation.x = 0.8; r.legL.kn.rotation.x = 0.8;
  for (var i = 0; i < mountObj.tail.length; i++) mountObj.tail[i].rotation.y = Math.sin(t * (2.2 + mv * 5) - i * 0.7) * (0.12 + 0.2 * mv);
  for (var k = 0; k < 4; k++) { var lg = mountObj.legs[k]; lg.rotation.x = Math.sin(ph + (k === 0 || k === 3 ? 0 : Math.PI)) * 0.6 * Math.min(1, mv); }
  mountObj.g.position.y = Math.abs(Math.sin(ph)) * 0.03 * mv;
}
function openMountShop(npc) { openPanel(npc.name + ' - Mounts', renderMountShop); }
function renderMountShop(body) {
  h('div', 'sec', 'Gold: ' + P.gold, body);
  h('div', 'ds', 'Press RIDE (next to DASH) to mount or dismount. Attacking or using a skill makes you dismount automatically.', body);
  for (var id in MOUNTS) (function (id) {
    var m = MOUNTS[id], r = h('div', 'item', null, body); iconEl(r, null, '🐊');
    var nm = h('div', 'nm', null, r); h('div', null, m.name, nm); h('div', 'ds', m.desc + (P.mounts[id] ? '' : '  ·  ' + m.price + ' G + 12% tax = ' + buyCost(m.price) + ' G'), nm);
    if (P.mounts[id]) { h('span', 'tag eq', 'OWNED', r); btn(r, P.mounted ? 'Dismount' : 'Ride', function () { toggleMount(); closePanel(); }, { cls: 'good' }); }
    else btn(r, 'Buy', function () { var cost = buyCost(m.price); if (P.gold < cost) { log('Not enough gold (price + 12% tax = ' + cost + ' G).', '#ff9a9a'); return; } P.gold -= cost; P.taxPaid += cost - m.price; P.mounts[id] = true; sfx('coin'); log('You bought a ' + m.name + '!', '#ffe066'); saveGame(); rerender(); }, { disabled: P.gold < buyCost(m.price), cls: 'good' });
  })(id);
}

/* ---------- Croczilla: the crowned crocodile boss uses the mount model, enlarged ---------- */
function attachCroc(c) {
  var m = makeCrocMount(true); c.g.add(m.g); c.croc = m; c.rig.body.visible = false; c.tag.spr.position.y = 2.0;
  m.g.traverse(function (o) { if (o.material && o.material.emissive) { o.material.userData = o.material.userData || {}; c.mats.push(o.material); } });
}
function animCroc(c, dt, spd) {
  var m = c.croc, t = performance.now() / 1000, mv = Math.min(1, (spd || 0) / 6);
  for (var i = 0; i < m.tail.length; i++) m.tail[i].rotation.y = Math.sin(t * (1.6 + mv * 4) - i * 0.7) * (0.1 + 0.18 * mv);
  for (var k = 0; k < 4; k++) m.legs[k].rotation.x = Math.sin(c.phase + (k === 0 || k === 3 ? 0 : Math.PI)) * 0.6 * mv;
  var lunge = 0; if (c.anim && c.anim.type === 'attack') lunge = Math.sin(Math.min(1, c.anim.t / c.anim.dur) * Math.PI) * 0.7;
  m.g.position.z = lunge; m.g.rotation.x = -lunge * 0.12;
  if (c.anim && c.anim.type === 'death') { var k2 = Math.min(1, c.anim.t / c.anim.dur); m.g.rotation.z = k2 * 1.45; m.g.position.y = -k2 * 0.1; }
  else { m.g.rotation.z = 0; m.g.position.y = 0; }
}

/* ---------- status effects on the player: slow + poison (applied by Wonderland mobs) ---------- */
function applyOnHit(h) {
  if (h.slow) { P.slowT = h.slow.t; P.slowMul = h.slow.mul; spawnText('Slowed!', P.pos, 'fl info', 2.8); }
  if (h.poison) { P.poisonT = h.poison.t; P.poisonDps = h.poison.dps; P.poisonAcc = 0; spawnText('Poisoned!', P.pos, 'fl hurt', 2.8); }
}
function playerDie(who) {
  dismount(); P.hp = 0; P.dead = true; P.target = null; P.attackHeld = false; P.buffs.length = 0; P.shield = 0; P.hot = null; P.slowT = 0; P.poisonT = 0;
  startDeath(P.c, P.pos);
  log('You were slain by ' + who + '.', '#ff6a6a');
  $('death-msg').textContent = (curMap && curMap.arena) ? 'Defeated in the arena. No penalty - jump back in!' : 'The wilds are not forgiving. You lose 5% of your gold.';
  setTimeout(function () { $('death').style.display = 'flex'; }, 900);
}

/* ====================== new big skills: Raining Anvil, Laser Gun, Star Fall, Ice Crack, Heavenly Sword, Summon Angel ====================== */
function disposeTree(o) { o.traverse(function (x) { if (x.geometry) x.geometry.dispose(); if (x.material) x.material.dispose(); }); }
function gfx(obj, dur, upd) { scene.add(obj); fxList.push({ t: 0, dur: dur, obj: obj, shared: true, update: function (k, dt) { upd(k, dt); if (k >= 1) disposeTree(obj); } }); return obj; }
function hitCircle(x, z, r, mult, o) { eachEnemy(function (e) { if (Math.hypot(e.pos.x - x, e.pos.z - z) <= r + 0.5 * e.T.scale) hurtEnemy(e, atkVal() * mult, o); }); }
function aimPoint(range, ahead) { var t = skillTarget(range), f = facingVec(); return { t: t, x: t ? t.pos.x : P.pos.x + f.x * ahead, z: t ? t.pos.z : P.pos.z + f.z * ahead }; }
function bm(w, h2, d, color, o) { o = o || {}; var p = { color: color }; if (o.op) { p.transparent = true; p.opacity = o.op; } return new THREE.Mesh(new THREE.BoxGeometry(w, h2, d), new THREE.MeshBasicMaterial(p)); }
function groundRing(x, z, r, color, dur, spin) {
  var m = new THREE.Mesh(new THREE.RingGeometry(r * 0.92, r, 48), new THREE.MeshBasicMaterial({ color: color, transparent: true, opacity: 0.8, side: THREE.DoubleSide, depthWrite: false }));
  m.rotation.x = -Math.PI / 2; m.position.set(x, 0.1, z);
  gfx(m, dur, function (k) { m.material.opacity = 0.8 * (1 - k * k); if (spin) m.rotation.z += spin * 0.016; }); return m;
}

SKILL_EXEC.anvil = function (sk) {
  var a = aimPoint(sk.range, 8); startAnim(P.c, 'cast', 0.8);
  groundRing(a.x, a.z, sk.radius, 0x9aa3ad, 2.3);
  for (var i = 0; i < sk.n; i++) (function (i) {
    var ang = rand(0, TAU), rr = Math.sqrt(Math.random()) * (sk.radius - 0.8), x = a.x + Math.cos(ang) * rr, z = a.z + Math.sin(ang) * rr, d0 = 0.35 + i * 0.16, fall = 0.55;
    schedule(d0, function () {
      if (P.dead) return;
      var g = new THREE.Group(), mat = new THREE.MeshBasicMaterial({ color: 0x3a3f4a });
      [[1.5, 0.4, 0.8, 0, 0.2], [0.6, 0.5, 0.5, 0, 0.65], [1.8, 0.45, 0.95, 0, 1.12]].forEach(function (p) { var m = new THREE.Mesh(new THREE.BoxGeometry(p[0], p[1], p[2]), mat); m.position.set(p[3], p[4], 0); g.add(m); });
      var horn = new THREE.Mesh(new THREE.ConeGeometry(0.4, 1, 6), mat); horn.rotation.z = -Math.PI / 2; horn.position.set(1.3, 1.12, 0); g.add(horn);
      g.scale.setScalar(1.3); g.rotation.y = rand(0, TAU);
      var sh = groundRing(x, z, 1.5, 0xff5a3a, fall + 0.1);
      gfx(g, fall, function (k) { g.position.set(x, 1 + (1 - k * k) * 26, z); });
      schedule(fall, function () {
        ringFx(x, z, 3, 0xcfd5dc, 0.4); burst({ x: x, y: 0.4, z: z }, 0xb0b6bf, 8, 4, 3); sfx('quake');
        hitCircle(x, z, 2.3, sk.mult, { stun: 0.5, color: 0xcfd5dc });
      });
    });
  })(i);
};

SKILL_EXEC.laser = function (sk) {
  var t = skillTarget(sk.range);                       // the laser needs a target and is aimed straight at it
  if (!t) { log('Laser Gun needs a target in range.', '#ccc'); P.cd.skillRefund = true; return; }
  startAnim(P.c, 'cast', 1.2);
  var L = sk.range, dx0 = t.pos.x - P.pos.x, dz0 = t.pos.z - P.pos.z, l0 = Math.hypot(dx0, dz0) || 1, dx = dx0 / l0, dz = dz0 / l0;
  var chargeOrb = new THREE.Mesh(new THREE.SphereGeometry(0.5, 12, 10), new THREE.MeshBasicMaterial({ color: 0xff3030 }));
  gfx(chargeOrb, 0.5, function (k) { chargeOrb.position.set(P.pos.x + dx * 1.2, 1.5, P.pos.z + dz * 1.2); chargeOrb.scale.setScalar(0.3 + k * 1.6); P.c.g.rotation.y = Math.atan2(dx, dz); });
  schedule(0.5, function () {
    if (P.dead) return;
    if (t.state !== 'dead') { var rx0 = t.pos.x - P.pos.x, rz0 = t.pos.z - P.pos.z, rl = Math.hypot(rx0, rz0); if (rl > 0.5) { dx = rx0 / rl; dz = rz0 / rl; } }   // re-aim at the target when firing
    var yaw = Math.atan2(dx, dz); P.c.g.rotation.y = yaw;
    var beam = new THREE.Group(); beam.position.set(P.pos.x, 1.5, P.pos.z); beam.rotation.y = yaw;
    var outer = new THREE.Mesh(new THREE.CylinderGeometry(0.9, 0.9, L, 14, 1, true), new THREE.MeshBasicMaterial({ color: 0xff1a1a, transparent: true, opacity: 0.55, side: THREE.DoubleSide, depthWrite: false }));
    var core = new THREE.Mesh(new THREE.CylinderGeometry(0.4, 0.4, L, 10, 1, true), new THREE.MeshBasicMaterial({ color: 0xffd0d0, transparent: true, opacity: 0.95, side: THREE.DoubleSide, depthWrite: false }));
    [outer, core].forEach(function (m) { m.rotation.x = Math.PI / 2; m.position.z = L / 2; beam.add(m); });
    var dur = 1.0;
    gfx(beam, dur, function (k) { var p = 1 + Math.sin(k * 60) * 0.18, fade = k > 0.8 ? (1 - k) / 0.2 : 1; outer.scale.set(p, 1, p); outer.material.opacity = 0.55 * fade; core.material.opacity = 0.95 * fade; beam.position.x = P.pos.x; beam.position.z = P.pos.z; beam.rotation.y = yaw; P.c.g.rotation.y = yaw; });
    burst({ x: P.pos.x, y: 1.5, z: P.pos.z }, 0xff4040, 14, 4, 2); sfx('zap');
    for (var i = 0; i < sk.ticks; i++) schedule(i * (dur / sk.ticks), function () {
      if (P.dead) return;
      var px = P.pos.x, pz = P.pos.z;
      eachEnemy(function (e) {
        var rx = e.pos.x - px, rz = e.pos.z - pz, al = rx * dx + rz * dz, pp = Math.abs(rx * dz - rz * dx);
        if (al > -0.5 && al < L && pp <= 1.7 + 0.5 * e.T.scale) { hurtEnemy(e, atkVal() * sk.mult, { color: 0xff3030 }); burst({ x: e.pos.x, y: 1, z: e.pos.z }, 0xff6a4a, 4, 3, 2); }
      });
    });
  });
};

SKILL_EXEC.starfall = function (sk) {
  var a = aimPoint(sk.range, 9); startAnim(P.c, 'cast', 1.0);
  var rg = groundRing(a.x, a.z, sk.radius, 0xffe066, 2.9, 0.6); groundRing(a.x, a.z, sk.radius * 0.6, 0xfff2a0, 2.9, -0.9);
  for (var i = 0; i < sk.n; i++) (function (i) {
    var ang = rand(0, TAU), rr = Math.sqrt(Math.random()) * (sk.radius - 0.5), x = a.x + Math.cos(ang) * rr, z = a.z + Math.sin(ang) * rr, d0 = 0.4 + i * (2.3 / sk.n), fall = 0.38;
    schedule(d0, function () {
      if (P.dead) return;
      var ar = new THREE.Group(), core = new THREE.Mesh(new THREE.CylinderGeometry(0.07, 0.07, 3.2, 5), new THREE.MeshBasicMaterial({ color: 0xfff2a0 }));
      var tip = new THREE.Mesh(new THREE.ConeGeometry(0.22, 0.7, 5), new THREE.MeshBasicMaterial({ color: 0xffffff })); tip.position.y = -1.85; tip.rotation.x = Math.PI;
      var glow = new THREE.Mesh(new THREE.SphereGeometry(0.3, 8, 6), new THREE.MeshBasicMaterial({ color: 0xffd54f, transparent: true, opacity: 0.7 })); glow.position.y = 1.6;
      ar.add(core); ar.add(tip); ar.add(glow); ar.rotation.z = 0.35;
      gfx(ar, fall, function (k) { ar.position.set(x - (1 - k) * 7, 1 + (1 - k) * 22, z); });
      schedule(fall, function () {
        ringFx(x, z, 1.8, 0xffe066, 0.3); burst({ x: x, y: 0.5, z: z }, 0xfff2a0, 6, 3, 3);
        hitCircle(x, z, 1.9, sk.mult, { color: 0xffe066 });
      });
    });
  })(i);
};

SKILL_EXEC.icecrack = function (sk) {
  var t = skillTarget(sk.range); startAnim(P.c, 'cast', 0.7);
  var f = facingVec(), tx = t ? t.pos.x : P.pos.x + f.x * 12, tz = t ? t.pos.z : P.pos.z + f.z * 12;
  var sx = P.pos.x, sz = P.pos.z, dx = tx - sx, dz = tz - sz, len = Math.max(1, Math.hypot(dx, dz)); dx /= len; dz /= len;
  len = sk.range;                                   // always as long as the Laser Gun beam
  var steps = Math.ceil(len / 1.1);
  for (var i = 1; i <= steps; i++) (function (i) {
    var x = sx + dx * i * 1.1, z = sz + dz * i * 1.1, big = i > steps - 2;
    schedule(0.15 + i * 0.045, function () {
      if (P.dead) return;
      var g = new THREE.Group(), n = big ? 5 : 3;
      for (var j = 0; j < n; j++) {
        var h2 = (big ? 3.2 : 1.8) * rand(0.7, 1.3), cone = new THREE.Mesh(new THREE.ConeGeometry(rand(0.3, 0.55) * (big ? 1.4 : 1), h2, 5), new THREE.MeshBasicMaterial({ color: j % 2 ? 0xbff2ff : 0x7fd6ff, transparent: true, opacity: 0.82 }));
        cone.position.set(rand(-0.6, 0.6), h2 / 2, rand(-0.6, 0.6)); cone.rotation.set(rand(-0.25, 0.25), 0, rand(-0.25, 0.25)); cone.userData.h = h2; g.add(cone);
      }
      g.position.set(x, 0, z); var life = 1.3;
      gfx(g, life, function (k) { var up = k < 0.15 ? k / 0.15 : (k > 0.8 ? 1 - (k - 0.8) / 0.2 : 1); g.scale.set(1, Math.max(0.01, up), 1); g.position.y = 0; });
      ringFx(x, z, 1.5, 0x9fe8ff, 0.3); burst({ x: x, y: 0.4, z: z }, 0xcff4ff, 5, 3, 3); sfx('zap');
      hitCircle(x, z, big ? 2.6 : 1.7, sk.mult * (big ? 1.4 : 1) / 2, { slow: 3, stun: 0.6, color: 0x9fe8ff, once: true });
    });
  })(i);
};

SKILL_EXEC.hsword = function (sk) {
  var a = aimPoint(sk.range, 10); startAnim(P.c, 'cast', 1.0);
  groundRing(a.x, a.z, sk.radius, 0xfff2a0, 1.5); groundRing(a.x, a.z, sk.radius * 0.55, 0xffffff, 1.5, 1.2);
  var sw = new THREE.Group(), blade = bm(2.2, 11, 0.4, 0xf4f8ff), edge = bm(0.7, 11.2, 0.46, 0xbfe3ff), guard = bm(4, 0.6, 0.7, 0xffd54f), hilt = bm(0.5, 2.4, 0.5, 0x8a5a2a), pom = bm(0.9, 0.9, 0.9, 0xffd54f);
  var tip = new THREE.Mesh(new THREE.ConeGeometry(1.56, 2.4, 4), new THREE.MeshBasicMaterial({ color: 0xf4f8ff })); tip.rotation.x = Math.PI; tip.rotation.y = Math.PI / 4;
  blade.position.y = 6.8; edge.position.y = 6.8; tip.position.y = 0.2 + 0.0; tip.scale.z = 0.25; guard.position.y = 12.6; hilt.position.y = 14.1; pom.position.y = 15.6; sw.position.y = 0;
  [blade, edge, tip, guard, hilt, pom].forEach(function (m) { sw.add(m); }); sw.scale.setScalar(0.5);                          // lower sword: it reads as a sword stuck in the ground
  sw.position.set(a.x, 40, a.z);
  gfx(sw, 2.6, function (k) { var tt = k * 2.6; sw.position.y = tt < 0.9 ? lerp(40, 0, tt / 0.9 * (tt / 0.9)) : 0; if (tt > 2.0) sw.position.y = -(tt - 2.0) * 3; });
  schedule(0.9, function () {
    ringFx(a.x, a.z, sk.radius, 0xfff2a0, 0.6); ringFx(a.x, a.z, sk.radius * 0.6, 0xffffff, 0.5); pillarFx(a.x, a.z, 0xfff2a0); burst({ x: a.x, y: 1, z: a.z }, 0xfff2a0, 34, 8, 8); sfx('quake');
    hitCircle(a.x, a.z, sk.radius, sk.mult, { stun: sk.stun, color: 0xfff2a0 });
  });
};

SKILL_EXEC.angel = function (sk) {
  var a = aimPoint(sk.range, 7); startAnim(P.c, 'cast', 1.2);
  [[2.2, 0xffffff, 0.5], [3.6, 0xfff2a0, -0.8], [5, 0xffffff, 0.6], [6.4, 0xfff2a0, -0.4]].forEach(function (r, i) {   // 1) draw the magic circles
    schedule(i * 0.28, function () {
      var m = groundRing(a.x, a.z, r[0], r[1], 2.4 - i * 0.28, r[2]);
      var spokes = bm(r[0] * 2, 0.05, 0.12, r[1], { op: 0.7 }); spokes.position.set(a.x, 0.12, a.z); var sp2 = bm(r[0] * 2, 0.05, 0.12, r[1], { op: 0.7 }); sp2.rotation.y = Math.PI / 2; spokes.add(sp2);
      gfx(spokes, 2.4 - i * 0.28, function (k) { spokes.rotation.y += r[2] * 0.02; spokes.children[0].material.opacity = sp2.material.opacity = 0.7 * (1 - k); });
    });
  });
  var hm = makeHumanoid({ scale: 3, skin: 0xffe0c0, shirt: 0xffffff, pants: 0xf2f2ff, hair: 0xffe066, boots: 0xffd54f, sleeve: 0xffffff, gear: true, armor: 0xfffbe0, pads: true, padColor: 0xffd54f });   // 2) the 3x-sized angel descends
  var an = hm.root, r = hm.rig;
  if (r.wingsG) { r.wingsG.visible = true; r.wingMat.color.setHex(0xffffff); }
  r.armor && (r.armor.visible = true);
  var halo = new THREE.Mesh(new THREE.TorusGeometry(0.28, 0.04, 8, 24), new THREE.MeshBasicMaterial({ color: 0xffe066 })); halo.rotation.x = Math.PI / 2; halo.position.y = 0.62; r.head.add(halo);
  var fx0 = a.x, fz0 = a.z, T = 3.0, struck = false;
  an.position.set(fx0, 40, fz0); an.rotation.y = Math.atan2(P.pos.x - fx0, P.pos.z - fz0);
  schedule(1.0, function () {
    gfx(an, T, function (k, dt) {
      var tt = k * T;
      an.position.y = tt < 0.7 ? lerp(40, 0, 1 - Math.pow(1 - tt / 0.7, 2)) : (tt > 2.3 ? (tt - 2.3) * 28 : 0);
      var fl = Math.sin(tt * 9); if (r.wings) r.wings.forEach(function (w) { w.g.rotation.y = w.sx * (0.6 + 0.35 * fl); });
      var up = tt >= 0.7 && tt < 1.6 ? 1 : 0; r.armR.sh.rotation.x = up ? -2.6 : -0.3; r.armL.sh.rotation.x = up ? -2.6 : -0.3;
      halo.rotation.z += dt * 3;
      if (!struck && tt >= 1.0) { struck = true; strike(); }
    });
  });
  function strike() {
    ringFx(fx0, fz0, sk.radius, 0xfff2a0, 0.7); ringFx(fx0, fz0, sk.radius * 0.6, 0xffffff, 0.5); pillarFx(fx0, fz0, 0xffffff); burst({ x: fx0, y: 2, z: fz0 }, 0xfff2a0, 40, 8, 9); sfx('quake');
    hitCircle(fx0, fz0, sk.radius, sk.mult, { stun: 1.2, color: 0xfff2a0 });
    if (!P.dead) { var h3 = Math.round(maxHp() * sk.healSelf); P.hp = Math.min(maxHp(), P.hp + h3); spawnText('+' + h3, P.pos, 'fl heal', 2.2); ringFx(P.pos.x, P.pos.z, 3, 0x6dff8f, 0.7); }
  }
};


/* ---------- Summon Big Skeleton: a giant skeleton rises and smashes everything inside a huge circle ---------- */
SKILL_EXEC.skelly = function (sk) {
  var a = aimPoint(sk.range, 9); startAnim(P.c, 'cast', 1.0);
  [[sk.radius, 0xb58cff, 0.5], [sk.radius * 0.72, 0xe8e4d0, -0.7], [sk.radius * 0.45, 0xb58cff, 0.9]].forEach(function (r, i) {
    schedule(i * 0.2, function () { groundRing(a.x, a.z, r[0], r[1], 5.2 - i * 0.2, r[2]); });
  });
  var hm = makeHumanoid({ scale: 5, skin: 0xe8e4d0, shirt: 0xd8d2bc, pants: 0xcfc9b2, hair: null, bald: true, bone: true, eye: 0x9b6bff, eyeGlow: true, boots: 0xcfc9b2, sleeve: 0xd8d2bc, thin: true });
  var sk3 = hm.root, r = hm.rig, T = 5.4, SM = [1.2, 1.9, 2.6, 3.3, 4.0];
  setWeapon({ rig: r }, 'greatsword', 0x8a8f99);
  sk3.position.set(a.x, -26, a.z); sk3.rotation.y = Math.atan2(P.pos.x - a.x, P.pos.z - a.z);
  schedule(0.5, function () {
    gfx(sk3, T, function (k) {
      var tt = k * T;
      sk3.position.y = tt < 0.7 ? lerp(-26, 0, 1 - Math.pow(1 - tt / 0.7, 2)) : (tt > 4.7 ? -(tt - 4.7) * 40 : 0);
      var up = 0;
      for (var q = 0; q < SM.length; q++) { var d = tt - (SM[q] - 0.6); if (d >= 0 && d < 0.6) up = d / 0.6; else if (d >= 0.6 && d < 0.8) up = 1 - (d - 0.6) / 0.2; }
      var ang = lerp(-0.3, -2.8, up); r.armR.sh.rotation.x = ang; r.armL.sh.rotation.x = ang; r.torso.rotation.x = lerp(0, -0.25, up) + (up === 0 && tt > 1 ? 0.12 : 0);
    });
  });
  SM.forEach(function (t, i) {
    schedule(0.5 + t, function () {
      if (P.dead) return;
      ringFx(a.x, a.z, sk.radius, 0xb58cff, 0.55); ringFx(a.x, a.z, sk.radius * 0.5, 0xffffff, 0.4); burst({ x: a.x, y: 0.6, z: a.z }, 0xe8e4d0, 26, 7, 6); sfx('quake');
      hitCircle(a.x, a.z, sk.radius, sk.mult, { stun: 0.8, color: 0xb58cff });
    });
  });
};

/* ---------- Energy Wave: a Spirit-Bomb style energy ball forms above the hero with lightning, then is hurled ---------- */
SKILL_EXEC.ewave = function (sk) {
  startAnim(P.c, 'cast', 2.3);
  var CH = 2.3, FLY = 0.55, ball = new THREE.Group(), R = 3.2;
  var core = new THREE.Mesh(new THREE.SphereGeometry(1, 20, 14), new THREE.MeshBasicMaterial({ color: 0xeafcff }));
  var glow = new THREE.Mesh(new THREE.SphereGeometry(1.35, 20, 14), new THREE.MeshBasicMaterial({ color: 0x35c8ff, transparent: true, opacity: 0.45, depthWrite: false }));
  ball.add(core); ball.add(glow);
  var arcs = []; for (var i = 0; i < 12; i++) { var ar = bm(0.12, 0.12, 1, 0xbff4ff, { op: 0.95 }); ball.add(ar); arcs.push(ar); }
  var cx = P.pos.x, cz = P.pos.z, launched = false, tx = 0, tz = 0;
  var rings = [4.5, 3.2, 2.0].map(function (rr, i) { return rr; });
  rings.forEach(function (rr, i) { schedule(i * 0.3, function () { groundRing(P.pos.x, P.pos.z, rr + 3, 0x35c8ff, 1.2, 0.8); }); });
  gfx(ball, CH + FLY + 0.05, function (k, dt) {
    var tt = k * (CH + FLY + 0.05), s;
    if (tt < CH) {                                             // charge: grow above the hero (follows the hero)
      s = lerp(0.3, R, tt / CH); ball.position.set(P.pos.x, 3.2 + s * 1.2, P.pos.z);
    } else {                                                   // hurl
      if (!launched) { launched = true; var t = autoTarget(sk.range); if (t) { tx = t.pos.x; tz = t.pos.z; } else { var f = facingVec(); tx = P.pos.x + f.x * 14; tz = P.pos.z + f.z * 14; } cx = ball.position.x; cz = ball.position.z; sfx('skill'); }
      var u = Math.min(1, (tt - CH) / FLY); s = R * (1 - u * 0.25);
      ball.position.set(lerp(cx, tx, u), lerp(3.2 + R * 1.2, 0.8, u * u), lerp(cz, tz, u));
    }
    core.scale.setScalar(s); glow.scale.setScalar(s * (1 + 0.08 * Math.sin(tt * 30))); glow.material.opacity = 0.35 + 0.15 * Math.sin(tt * 25);
    arcs.forEach(function (ar) {                               // crackling lightning on the surface
      var th = rand(0, TAU), ph = Math.acos(rand(-1, 1)), rr = s * rand(1.1, 1.9), len = s * rand(0.6, 1.4);
      ar.position.set(Math.sin(ph) * Math.cos(th) * rr, Math.cos(ph) * rr, Math.sin(ph) * Math.sin(th) * rr); ar.scale.set(1, 1, len * 4); ar.rotation.set(rand(0, TAU), rand(0, TAU), rand(0, TAU)); ar.visible = Math.random() < 0.8;
    });
  });
  schedule(CH + FLY, function () {
    var bx = tx, bz = tz;
    ringFx(bx, bz, sk.radius, 0x35c8ff, 0.7); ringFx(bx, bz, sk.radius * 0.6, 0xffffff, 0.55); pillarFx(bx, bz, 0x9fe8ff); burst({ x: bx, y: 1.5, z: bz }, 0x9fe8ff, 46, 10, 10); sfx('quake');
    for (var j = 0; j < 4; j++) lightningFx(bx + rand(-4, 4), bz + rand(-4, 4), 0x9fe8ff);
    if (!P.dead) hitCircle(bx, bz, sk.radius, sk.mult, { stun: 1.0, color: 0x9fe8ff });
  });
};
