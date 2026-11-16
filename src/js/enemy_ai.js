/* enemy_ai.js - per-map enemy spawning (radial level bands), enemy AI, bots + chat */
function spawnEnemies(m) {
  if (m.arena) return;
  if (m.bossR) {
    makeEnemy(m.enemies[0], m.bossR, m.bossR, true);
    if (m.mobs) m.mobs.forEach(function (key) {              // mobs surround the boss area (never on the dais)
      for (var q = 0; q < 20; q++) {
        var me = makeEnemy(key, m.safeR + 8, m.R - 8);
        for (var tr = 0; tr < 14 && Math.hypot(me.pos.x, me.pos.z + m.bossR) < 32; tr++) {
          var aa = Math.random() * TAU, rr = rand(m.safeR + 8, m.R - 8); me.pos.set(Math.cos(aa) * rr, 0, Math.sin(aa) * rr); me.spawn.copy(me.pos); me.wx = me.pos.x; me.wz = me.pos.z;
        }
      }
    });
    return;
  }
  var regular = m.enemies.slice(0, m.enemies.length - 1), bossKey = m.enemies[m.enemies.length - 1];
  var r0 = m.safeR + 2, r1 = m.R - 3, n = regular.length, step = (r1 - r0) / n;
  regular.forEach(function (key, i) {           // main bands (area-weighted so big outer bands do not look empty)
    var lo = r0 + i * step, hi = lo + step, cnt = Math.round(ENEMIES_PER_TYPE * (0.7 + 0.6 * (i + 0.5) / n));
    for (var k = 0; k < cnt; k++) makeEnemy(key, lo, hi);
  });
  for (var q = 0; q < 2; q++) {                 // extra mobs: centre (weakest types) and edge (strongest types)
    for (var k2 = 0; k2 < 9; k2++) makeEnemy(regular[q], m.safeR + 2, m.safeR + 16);
    for (var k3 = 0; k3 < 9; k3++) makeEnemy(regular[n - 1 - q], m.R - 14, m.R - 3);
  }
  makeEnemy(bossKey, r1 - 4, r1 - 4, true);
  var mid0 = Math.max(r0, m.R * 0.35), mid1 = m.R * 0.65;      // extra mobs in the middle of the map (all types mixed)
  regular.forEach(function (key) { for (var q = 0; q < 6; q++) makeEnemy(key, mid0, mid1); });
  var top = mapTopLvl(m);
  EDGE_TYPES.forEach(function (k, i) {          // edge elites: levels capped to this map's top level; dormant until the player reaches the edge
    var ek = edgeType(k, Math.max(1, top - (2 - i) * 2));
    for (var q2 = 0; q2 < EDGE_PER_TYPE; q2++) { var ee = makeEnemy(ek, m.R - 20, m.R - 3); ee.edge = true; edgeSleep(ee, rand(1, 4)); }
  });
}
function edgeSleep(e, delay) { e.state = 'dead'; e.deadT = 3; e.c.g.visible = false; e.c.tag.spr.visible = false; e.respawnT = delay; e.target = null; }
var edgeWas = false;
function makeEnemy(key, rLo, rHi, boss) {
  var T = ENEMY_TYPES[key];
  var c = newChar(Object.assign({ scale: T.scale }, T.look), T.name, T.lvl, T.boss ? '#ff8a3a' : '#ff9a9a', true, T.weapon);
  if (T.croc) attachCroc(c);
  var a = boss ? Math.PI * 1.5 : Math.random() * TAU, r = rLo + Math.random() * (rHi - rLo);
  var x = Math.cos(a) * r, z = Math.sin(a) * r;
  c.g.position.set(x, 0, z); c.g.rotation.y = rand(0, TAU);
  var e = { type: key, T: T, c: c, pos: c.g.position, spawn: new THREE.Vector3(x, 0, z), hp: T.hp, maxHp: T.hp, state: 'idle',
    wanderT: rand(0.5, 3), wx: x, wz: z, atkCd: rand(0, 1), hitDone: true, deadT: 0, respawnT: 0, stun: 0, slow: 0 };
  enemies.push(e); return e;
}

function updateEnemies(dt) {
  var inSafe = inSafeZone();
  var edgeOn = !!(curMap && !curMap.arena && !curMap.bossR && Math.hypot(P.pos.x, P.pos.z) > curMap.R - EDGE_ACTIVE);
  if (edgeOn !== edgeWas) { edgeWas = edgeOn; if (edgeOn) { var tl = mapTopLvl(curMap); log('You reached the edge of the world... Edge Elites (Lv ' + Math.max(1, tl - 4) + '-' + tl + ') awaken!', '#d08aff'); sfx('level'); } }
  for (var i = 0; i < enemies.length; i++) {
    var e = enemies[i], T = e.T, c = e.c, pos = e.pos;
    var dxp = P.pos.x - pos.x, dzp = P.pos.z - pos.z, d = Math.hypot(dxp, dzp), spd = 0;

    if (e.state === 'dead') {
      e.deadT += dt;
      if (c.g.visible) { c.mv = 0; animateChar(c, dt, 0); }
      if (e.world && e.deadT > 3.3) continue;   // world boss never respawns (removed by updateWorldBoss)
      if (e.deadT > 3.2 && c.g.visible) { c.g.visible = false; e.respawnT = rand(RESPAWN_TIME[0], RESPAWN_TIME[1]) * (T.boss ? 6 : 1); }
      if (!c.g.visible) {
        e.respawnT -= dt;
        if (e.respawnT <= 0 && (!e.edge || edgeOn) && Math.hypot(P.pos.x - e.spawn.x, P.pos.z - e.spawn.z) > 14) {
          e.hp = e.maxHp; e.state = 'idle'; pos.copy(e.spawn); c.anim = null; c.g.visible = true; c.tag.spr.visible = true; c.tag.draw(1);
          c.rig.body.rotation.x = 0; c.rig.body.position.y = 0; e.stun = 0; e.slow = 0;
        }
      }
      continue;
    }
    if (e.edge && !edgeOn && (e.state === 'idle' || e.state === 'return')) { edgeSleep(e, rand(1, 3)); continue; }   // player left the edge: elites vanish

    var vis = d < 60;
    c.g.visible = vis;
    c.tag.spr.visible = d < 26 || P.target === e;
    if (!vis && e.state === 'idle') continue;      // far-away idle enemies sleep (saves CPU)
    e.atkCd -= dt;
    var stunned = e.stun > 0; if (stunned) e.stun -= dt;
    var sm = e.slow > 0 ? 0.5 : 1; if (e.slow > 0) e.slow -= dt;

    var distSpawn = Math.hypot(pos.x - e.spawn.x, pos.z - e.spawn.z);
    if (stunned) { /* frozen */ }
    else switch (e.state) {
      case 'idle':
        if (e.aiT > 0 && e.aiBy) { e.aiT -= dt; faceTo(c, e.aiBy.pos.x, e.aiBy.pos.z, dt, 10); break; }
        e.wanderT -= dt;
        if (e.wanderT <= 0) { var a = Math.random() * TAU, r = rand(1, 5); e.wx = e.spawn.x + Math.cos(a) * r; e.wz = e.spawn.z + Math.sin(a) * r; e.wanderT = rand(2.5, 6); }
        var wd = Math.hypot(e.wx - pos.x, e.wz - pos.z);
        if (wd > 0.5) { var k = T.speed * 0.35 * dt / wd; pos.x += (e.wx - pos.x) * k; pos.z += (e.wz - pos.z) * k; faceTo(c, e.wx, e.wz, dt, 6); spd = T.speed * 0.35; }
        if (!inSafe && !P.dead && d < T.aggro) e.state = 'chase';
        break;
      case 'chase':
        if (inSafe || P.dead || distSpawn > T.aggro * 2.6) { e.state = 'return'; break; }
        if (d <= T.range * 0.95) { e.state = 'attack'; break; }
        var kk = T.speed * sm * dt / Math.max(d, 0.001); pos.x += dxp * kk; pos.z += dzp * kk; spd = T.speed * sm;
        faceTo(c, P.pos.x, P.pos.z, dt, 10);
        break;
      case 'attack':
        if (inSafe || P.dead) { e.state = 'return'; break; }
        faceTo(c, P.pos.x, P.pos.z, dt, 12);
        if (!c.anim && e.atkCd <= 0 && d <= T.range * 1.1) { startAnim(c, 'attack', 0.9); e.atkCd = T.cd / sm; e.hitDone = false; }
        if (!c.anim && d > T.range * 1.5) e.state = 'chase';
        break;
      case 'return':
        var rd = Math.hypot(e.spawn.x - pos.x, e.spawn.z - pos.z);
        if (rd < 1) { e.state = 'idle'; e.hp = e.maxHp; c.tag.draw(1); break; }
        var rk = T.speed * 1.6 * dt / rd; pos.x += (e.spawn.x - pos.x) * rk; pos.z += (e.spawn.z - pos.z) * rk; spd = T.speed * 1.6;
        faceTo(c, e.spawn.x, e.spawn.z, dt, 10);
        e.hp = Math.min(e.maxHp, e.hp + e.maxHp * 0.1 * dt);
        break;
    }

    if (T.skills && !stunned && (e.state === 'chase' || e.state === 'attack')) bossSkills(e, dt, d);
    if (c.anim && c.anim.type === 'attack' && !e.hitDone && c.anim.t >= c.anim.dur * 0.48) {
      e.hitDone = true;
      if (!P.dead && !stunned && Math.hypot(P.pos.x - pos.x, P.pos.z - pos.z) <= T.range + 0.7) {
        if (T.throwKind) throwFx(T.throwKind, pos, function () { if (!P.dead && e.state !== 'dead') damagePlayer(e); });   // ranged: card / camera flies to you
        else damagePlayer(e);
      }
    }
    if (vis) {
      for (var j = i + 1; j < enemies.length; j++) {
        var o = enemies[j]; if (o.state === 'dead') continue;
        var sx = pos.x - o.pos.x, sz = pos.z - o.pos.z;
        if (sx > 3 || sx < -3 || sz > 3 || sz < -3) continue;
        var sd = sx * sx + sz * sz, minD = 0.9 * (T.scale + o.T.scale) * 0.6;
        if (sd < minD * minD && sd > 1e-6) { var sdd = Math.sqrt(sd), push = (minD - sdd) * 0.5 / sdd; pos.x += sx * push; pos.z += sz * push; o.pos.x -= sx * push; o.pos.z -= sz * push; }
      }
      resolveObstacles(pos, 0.4 * T.scale);
      animateChar(c, dt, spd);
    }
  }
}

/* ---------- bots + world chat ---------- */
var chatLines = ['anyone farming Orcs?', 'LFG Demon Lord!', 'selling Iron Sword cheap', 'Power Slash is so good', 'watch out for Dark Knights',
  'level 10 at last!', 'the boss dropped Dragon Blade!!', 'Shadow Step is worth every gold', 'new here, where is the portal?', 'wings finally dropped!', 'good luck everyone'];
var chatT = 6;
function updateBots(dt) {
  bots.forEach(function (b) {
    var c = b.c, pos = b.pos, spd = 0; b.wait -= dt;
    var dx = b.tx - pos.x, dz = b.tz - pos.z, d = Math.hypot(dx, dz);
    if (d > 0.4 && b.wait <= 0) { var k = 2.4 * dt / d; pos.x += dx * k; pos.z += dz * k; spd = 2.4; faceTo(c, b.tx, b.tz, dt, 8); }
    else if (d <= 0.4 && b.wait <= 0) { var a = Math.random() * TAU, r = rand(4, (curMap ? curMap.safeR : 16) - 3); b.tx = Math.cos(a) * r; b.tz = Math.sin(a) * r; b.wait = rand(2, 7); }
    resolveObstacles(pos, 0.4);
    var dd = Math.hypot(pos.x - P.pos.x, pos.z - P.pos.z);
    c.g.visible = dd < 70; c.tag.spr.visible = dd < 28;
    if (c.g.visible) animateChar(c, dt, spd);
  });
  chatT -= dt;
  if (chatT <= 0 && bots.length) { chatT = rand(10, 24); var b2 = bots[randInt(0, bots.length - 1)]; log('[World] ' + b2.name + ': ' + chatLines[randInt(0, chatLines.length - 1)], '#9be3ff'); }
}

/* ---------- boss skills (Bad Santa): Candy Slam / Gift Bombs / Frost Nova ---------- */
function bossSkills(e, dt, d) {
  e.skT = (e.skT === undefined ? 4 : e.skT) - dt;
  if (e.skT > 0 || d > 30 || P.dead || e.c.anim) return;
  var T = e.T, pick = T.skills[randInt(0, T.skills.length - 1)], bx = e.pos.x, bz = e.pos.z, SN = T.skillNames || { slam: 'Candy Slam!', gifts: 'Gift Bombs!', nova: 'Frost Nova!' };
  e.skT = rand(4, 7); startAnim(e.c, 'attack', 0.9);
  function hitIf(x, z, r, mul) { if (!P.dead && Math.hypot(P.pos.x - x, P.pos.z - z) <= r) damagePlayer(e, mul); }
  if (pick === 'leap') {          // Dark Swordman: jumps high into the air and crashes down on where you stood
    var tx = P.pos.x, tz = P.pos.z, sx0 = e.pos.x, sz0 = e.pos.z, LT = 1.2, RAD = 10, holder = new THREE.Object3D();
    e.skT = rand(3.5, 5.5); e.stun = LT + 0.1; faceTo(e.c, tx, tz, 1, 100);
    spawnText(SN.leap, e.pos, 'fl info', 9); ringFx(tx, tz, RAD, 0xff2222, LT); ringFx(tx, tz, RAD * 0.5, 0xffaa00, LT);
    fxList.push({ t: 0, dur: LT, obj: holder, shared: true, update: function (k) {
      if (e.state === 'dead') return;
      e.pos.x = lerp(sx0, tx, k); e.pos.z = lerp(sz0, tz, k); e.pos.y = Math.sin(k * Math.PI) * 14;
      if (k >= 1) e.pos.y = 0;
    } });
    schedule(LT, function () {
      if (e.state === 'dead') return; e.pos.y = 0; startAnim(e.c, 'attack', 0.6);
      ringFx(tx, tz, RAD, 0xffffff, 0.5); ringFx(tx, tz, RAD * 1.4, 0xff2222, 0.8); pillarFx(tx, tz, 0xff2222); burst(new THREE.Vector3(tx, 0.6, tz), 0xff4a2a, 40, 9, 6); sfx('quake');
      hitIf(tx, tz, RAD, 1.5);
    });
  } else if (pick === 'slam') {
    spawnText(SN.slam, e.pos, 'fl info', 9); ringFx(bx, bz, 11, 0xff3030, 1.0);
    schedule(1.0, function () { if (e.state === 'dead') return; ringFx(bx, bz, 11, 0xffffff, 0.4); burst(new THREE.Vector3(bx, 0.5, bz), 0xff3030, 24, 6, 3); hitIf(bx, bz, 11, 2.2); });
  } else if (pick === 'gifts') {
    spawnText(SN.gifts, e.pos, 'fl info', 9);
    for (var i = 0; i < 4; i++) (function (i) {
      var gx = P.pos.x + (i ? rand(-7, 7) : 0), gz = P.pos.z + (i ? rand(-7, 7) : 0);
      ringFx(gx, gz, 4, 0xffd54f, 1.2 + i * 0.25);
      schedule(1.2 + i * 0.25, function () { if (e.state === 'dead') return; pillarFx(gx, gz, 0xff8a1a); burst(new THREE.Vector3(gx, 0.5, gz), 0xffd54f, 18, 5, 4); hitIf(gx, gz, 4, 1.6); });
    })(i);
  } else {
    spawnText(SN.nova, e.pos, 'fl info', 9); ringFx(bx, bz, 18, 0x8ad8ff, 1.4);
    schedule(1.4, function () { if (e.state === 'dead') return; ringFx(bx, bz, 18, 0xffffff, 0.5); burst(new THREE.Vector3(bx, 0.5, bz), 0x8ad8ff, 30, 8, 3); hitIf(bx, bz, 18, 1.5); });
  }
}

/* ---------- World boss manager: Dark Swordman shows up at random times in a random normal map ---------- */
var WB = { map: null, t: 240, life: 0, e: null };   // first appearance ~4 minutes after launch
var wbAlertT = null;
function bossAlert(sub) {
  var el = $('boss-alert'); if (!el) return; $('ba-sub').textContent = sub; el.className = 'show'; clearTimeout(wbAlertT);
  wbAlertT = setTimeout(function () { el.className = ''; }, 10000);
}
function wbMaps() { return MAPS.filter(function (m) { return !m.arena && !m.boss && !m.bossR; }); }
function wbSpawn(m) {
  var e = makeEnemy('darksword', m.safeR + 30, m.R - 30); e.world = true; WB.e = e;
  log('Dark Swordman lurks somewhere in ' + m.name + '! (HP 15,000,000 - Loot: 10-15 Godzilla Fragments)', '#ff5a5a');
  ringFx(e.pos.x, e.pos.z, 8, 0xff2222, 1.2); pillarFx(e.pos.x, e.pos.z, 0xff2222);
}
function worldBossOnMap(m) { if (WB.map === m.id && !(WB.e && WB.e.state !== 'dead')) wbSpawn(m); }
function wbRemove() { if (WB.e) { var i = enemies.indexOf(WB.e); if (i >= 0) { disposeChar(WB.e.c); enemies.splice(i, 1); } WB.e = null; } }
function updateWorldBoss(dt) {
  if (WB.e && enemies.indexOf(WB.e) < 0) WB.e = null;   // map changed: the old model was cleared
  if (!WB.map) {
    WB.t -= dt;
    if (WB.t <= 0) {
      var ms = wbMaps(); if (!ms.length) { WB.t = 600; return; }
      var m = ms[randInt(0, ms.length - 1)]; WB.map = m.id; WB.life = 1500; sfx('level');
      log('⚠ WORLD BOSS: Dark Swordman has appeared in ' + m.name + '! Defeat him for Exclusive rewards.', '#ff5a5a');
      bossAlert('Dark Swordman has appeared in ' + m.name + ' - Exclusive rewards');
      if (curMap && curMap.id === m.id) wbSpawn(m);
    }
    return;
  }
  WB.life -= dt;
  if (WB.e && WB.e.state === 'dead' && WB.e.deadT > 3.3) { wbRemove(); WB.map = null; WB.t = rand(900, 1500); log('Dark Swordman is gone... he will return someday.', '#ffb74d'); return; }
  if (WB.life <= 0 && !(WB.e && WB.e.state !== 'dead' && WB.e.state !== 'idle')) { wbRemove(); WB.map = null; WB.t = rand(900, 1500); log('Dark Swordman vanished into the shadows.', '#ffb74d'); }
}
