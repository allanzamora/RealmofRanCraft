
var MOBA = { on: false, over: false, t: 0, waveT: 5, units: { blue: [], red: [] }, S: { blue: {}, red: {} }, score: { blue: 0, red: 0 }, pa: 12, ph: 100, pd: 0, hudT: 0, deaths: { blue: 0, red: 0 } };
var MOBA_SPAWN = { blue: [-52, 52], red: [52, -52] };
var MOBA_COL = { blue: 0x3a7fd0, red: 0xd03a3a };
function mobaPath(team, lane) { var p = MOBA_LANES[lane].map(function (q) { return { x: q[0], z: q[1] }; }); return team === 'blue' ? p : p.reverse(); }
function mobaClear() {
  MOBA.on = false; MOBA.units.blue.forEach(function (u) { try { disposeChar(u.c); } catch (e) {} }); MOBA.units = { blue: [], red: [] };
  var b = $('moba-banner'); if (b) b.style.display = 'none'; var h = $('moba-hud'); if (h) h.style.display = 'none';
}
function mobaFoes(team) { return MOBA.units[team === 'blue' ? 'red' : 'blue']; }
function mobaAlive(u) { return u && u.state !== 'dead'; }
function mobaProtected(u) { return !!(u.prot && u.prot()); }

/* ---------- unit factory ---------- */
function mobaUnit(team, kind, x, z, o) {
  o = o || {}; var pa = MOBA.pa, ph = MOBA.ph, tc = MOBA_COL[team], blue = team === 'blue', tag = blue ? '#7fc4ff' : '#ff8a8a';
  var cfg = {
    minion: { name: (blue ? 'Blue' : 'Red') + ' Minion', hp: pa * 7, dmg: pa * 0.35, dmgP: ph * 0.02, range: 2.2, speed: 3.4, cd: 1.3, scale: 0.8, aggro: 8 },
    rminion: { name: (blue ? 'Blue' : 'Red') + ' Caster', hp: pa * 4.5, dmg: pa * 0.4, dmgP: ph * 0.025, range: 9, speed: 3.2, cd: 1.8, scale: 0.75, aggro: 10 },
    hero: { name: o.name || 'Hero', hp: pa * 20, dmg: pa * 0.9, dmgP: ph * 0.06, range: o.ranged ? 10 : 2.6, speed: 5, cd: 1.0, scale: 1, aggro: 12 },
    tower: { name: (blue ? 'Blue' : 'Red') + ' Tower', hp: pa * 70, dmg: pa * 1.6, dmgP: ph * 0.14, range: 13, speed: 0, cd: 1.6, scale: 1, aggro: 13 },
    nexus: { name: (blue ? 'Blue' : 'Red') + ' Nexus', hp: pa * 110, dmg: 0, dmgP: 0, range: 0, speed: 0, cd: 9, scale: 1, aggro: 0 }
  }[kind];
  var struct = kind === 'tower' || kind === 'nexus', c;
  var T = { name: cfg.name, lvl: P.lvl, scale: cfg.scale, boss: false, def: 0, atk: cfg.dmgP + defVal() * 0.6, hp: cfg.hp, xp: 0, gold: [0, 0], speed: cfg.speed, aggro: cfg.aggro, range: cfg.range, cd: cfg.cd, look: {} };
  if (kind === 'hero') {
    var skin = [0xf0c8a0, 0xe0b080, 0xc89060, 0xf4d6b8][randInt(0, 3)];
    c = newChar({ scale: 1, skin: skin, shirt: tc, pants: 0x2a2f3c, hair: [0x2a1a10, 0x1a1a1a, 0xd8c040, 0x6a3a1a][randInt(0, 3)], boots: 0x3a2a1a, gear: true, pads: true, padColor: tc, armor: tc }, cfg.name, P.lvl, tag, true,
      o.ranged ? { kind: 'bow', color: 0x7a5a30, glow: false } : { kind: 'sword', color: tc, glow: true });
    var r = c.rig; r.armor.visible = true; r.armorMat.color.setHex(tc); r.padMeshes.forEach(function (m) { m.visible = true; }); r.padMat.color.setHex(tc);
    r.gloveMeshes.forEach(function (m) { m.visible = true; }); r.glovesMat.color.setHex(tc); r.helmMeshes.forEach(function (m) { m.visible = true; }); r.hairMeshes.forEach(function (m) { m.visible = false; }); r.helmMat.color.setHex(tc);
    c.sheath = false;
  } else if (!struct) {
    c = newChar({ scale: cfg.scale, skin: 0xd8b890, shirt: tc, pants: 0x2a2f3c, hair: 0x333333, boots: 0x2a1c10 }, cfg.name, 1, tag, true, kind === 'minion' ? { kind: 'sword', color: 0x9aa3ad, glow: false } : null);
  } else {
    c = newChar({ scale: 1, skin: 0xd8b890, shirt: tc, pants: 0x222222, hair: 0x222222, boots: 0x222222 }, cfg.name, 1, tag, true, null);
    c.rig.body.visible = false; mobaStructModel(c, kind, team);
  }
  c.g.position.set(x, 0, z); c.g.rotation.y = blue ? Math.PI * 0.75 : -Math.PI * 0.25;
  var u = { moba: true, team: team, kind: kind, struct: struct, name: cfg.name, type: 'moba_' + kind, T: T, c: c, pos: c.g.position, spawn: new THREE.Vector3(x, 0, z), hp: cfg.hp, maxHp: cfg.hp,
    dmg: cfg.dmg, dmgP: cfg.dmgP, range: cfg.range, speed: cfg.speed, state: struct ? 'idle' : 'lane', stun: 0, slow: 0, atkCd: rand(0, 1), tgt: null, thinkT: rand(0, 0.3), deadT: 0, spd: 0,
    ranged: kind === 'rminion' || !!o.ranged, lane: o.lane || 'M', path: o.lane ? mobaPath(team, o.lane) : null, wi: 1, off: rand(-1.8, 1.8), skT: rand(4, 9), resp: 0, wait: false };
  if (struct) { c.tag.spr.position.y = kind === 'nexus' ? 11 : 8.6; addObstacle(x, z, kind === 'nexus' ? 3.2 : 1.9); }
  if (team === 'red') enemies.push(u);
  MOBA.units[team].push(u);
  return u;
}
function mobaStructModel(c, kind, team) {
  var tc = MOBA_COL[team], big = kind === 'nexus', g = c.g, s = big ? 1.9 : 1;
  var stone = new THREE.MeshStandardMaterial({ color: 0x8a8f9a, roughness: 0.9 }), tm = new THREE.MeshStandardMaterial({ color: tc, roughness: 0.6, emissive: tc, emissiveIntensity: 0.18 });
  var glow = new THREE.MeshBasicMaterial({ color: team === 'blue' ? 0x7fe0ff : 0xff8a6a }), top = [];
  var base = new THREE.Mesh(new THREE.CylinderGeometry(2.3 * s, 2.7 * s, 1.0, 14), stone); base.position.y = 0.5; base.castShadow = true; g.add(base);
  var shaft = new THREE.Mesh(new THREE.BoxGeometry(1.7 * s, 4.4 * s, 1.7 * s), tm); shaft.position.y = 1 + 2.2 * s; shaft.castShadow = true; g.add(shaft); top.push(shaft);
  var band = new THREE.Mesh(new THREE.BoxGeometry(2.1 * s, 0.4, 2.1 * s), stone); band.position.y = 1 + 4.4 * s; g.add(band); top.push(band);
  var cry = new THREE.Mesh(new THREE.BoxGeometry(1.0 * s, 1.0 * s, 1.0 * s), glow); cry.position.y = 2.2 + 4.4 * s; cry.rotation.set(0.6, 0.6, 0); g.add(cry); top.push(cry);
  if (big) { var w1 = new THREE.Mesh(new THREE.BoxGeometry(5.2, 1.4, 5.2), stone); w1.position.y = 0.2; g.add(w1); }
  c.mobaTop = top; c.mobaCry = cry;
}
function mobaMakeHero(team, lane, name, ranged) {
  var sp = MOBA_SPAWN[team], u = mobaUnit(team, 'hero', sp[0] + rand(-4, 4), sp[1] + rand(-4, 4), { lane: lane, name: name, ranged: ranged });
  u.hero = true; u.spawnX = sp[0]; u.spawnZ = sp[1]; return u;
}

/* ---------- start / setup ---------- */
function mobaStart(m) {
  MOBA.on = true; MOBA.over = false; MOBA.t = 0; MOBA.waveT = 5; MOBA.score = { blue: 0, red: 0 }; MOBA.pd = 0; MOBA.deaths = { blue: 0, red: 0 }; MOBA.S = { blue: {}, red: {} };
  MOBA.pa = Math.max(10, atkVal()); MOBA.ph = Math.max(100, maxHp());
  [['blue', 1], ['red', -1]].forEach(function (tt) {
    var team = tt[0], k = tt[1], S = MOBA.S[team];
    function P2(x, z) { return [x * k, z * k]; }
    var pos = team === 'blue' ? { A1: [-66, -18], A2: [-66, 32], B1: [18, 66], B2: [-32, 66], M1: [-14, 14], M2: [-38, 38] }      // red = point reflection (its A lane is the blue B lane reflected)
      : { A1: [-18, -66], A2: [32, -66], B1: [66, 18], B2: [66, -32], M1: [14, -14], M2: [38, -38] };
    ['A', 'B', 'M'].forEach(function (L) {
      S[L + '1'] = mobaUnit(team, 'tower', pos[L + '1'][0], pos[L + '1'][1]);
      S[L + '2'] = mobaUnit(team, 'tower', pos[L + '2'][0], pos[L + '2'][1]);
      S[L + '2'].prot = function () { return mobaAlive(S[L + '1']); };       // inner tower is shielded until the outer one falls
    });
    S.N = mobaUnit(team, 'nexus', -62 * k, 62 * k);
    S.N.prot = function () { return mobaAlive(S.A2) && mobaAlive(S.B2) && mobaAlive(S.M2); };   // nexus is shielded until every inner tower falls
  });
  var names = AI_NAMES.slice().sort(function () { return Math.random() - 0.5; });
  ['A', 'B', 'M', 'M'].forEach(function (L, i) { mobaMakeHero('blue', L, names[i], i % 2 === 1); });
  ['A', 'B', 'M', 'M', 'A'].forEach(function (L, i) { mobaMakeHero('red', L, names[4 + i], i % 2 === 0); });
  mobaWave();
  var h = $('moba-hud'); if (h) h.style.display = 'block';
}
function mobaWave() {
  if (MOBA.units.red.length + MOBA.units.blue.length > 130) return;
  ['blue', 'red'].forEach(function (team) {
    ['A', 'B', 'M'].forEach(function (L) {
      for (var i = 0; i < 5; i++) (function (i) {
        schedule(i * 0.9, function () {
          if (!MOBA.on || MOBA.over) return;
          var p = mobaPath(team, L)[0], sp = MOBA_SPAWN[team], u = mobaUnit(team, i < 3 ? 'minion' : 'rminion', (team === 'blue' ? -60 : 60) + rand(-2, 2), (team === 'blue' ? 60 : -60) + rand(-2, 2), { lane: L });
          u.ranged = i >= 3;
        });
      })(i);
    });
  });
}

/* ---------- damage ---------- */
function mobaHurt(t, dmg, src) {
  if (!t || !mobaAlive(t) && t !== P) return;
  if (t === P) { damagePlayer({ T: { atk: (src.dmgP || 1) + defVal() * 0.6, name: src.name } }); return; }
  if (t.team === 'red') { hurtEnemy(t, dmg, { by: src, noKnock: true }); return; }
  if (mobaProtected(t)) { if (distP(t.pos) < 30) spawnText('Protected', t.pos, 'fl info', 5); return; }
  var d = Math.max(1, Math.round(dmg * rand(0.9, 1.1)));
  t.hp -= d; t.c.flash = 0.1; t.c.hitT = 0.2; t.c.tag.draw(Math.max(0, t.hp / t.maxHp));
  if (distP(t.pos) < 42) spawnText(String(d), t.pos, 'fl dmg', t.struct ? 4 : 2.1);
  if (t.hp <= 0) mobaDie(t, src);
}
function mobaKilled(e, by) { e.hp = 0; mobaDie(e, by || P); }
function mobaDie(u, killer) {
  if (u.state === 'dead') return;
  u.state = 'dead'; u.hp = 0; u.deadT = 0; u.tgt = null; u.c.tag.spr.visible = false; if (P.target === u) P.target = null;
  if (u.struct) {
    u.c.mobaTop.forEach(function (m) { m.visible = false; }); burst({ x: u.pos.x, y: 2.5, z: u.pos.z }, MOBA_COL[u.team], 26, 6, 6); ringFx(u.pos.x, u.pos.z, 6, MOBA_COL[u.team], 0.8); sfx('crit');
    log((u.team === 'red' ? 'Enemy' : 'Your') + ' ' + (u.kind === 'nexus' ? 'NEXUS' : 'tower') + ' destroyed!', u.team === 'red' ? '#7fe8ff' : '#ff8a8a');
    if (u.kind === 'nexus') mobaEnd(u.team === 'red' ? 'blue' : 'red');
    return;
  }
  startAnim(u.c, 'death', 1.3);
  if (u.hero) {
    var kn = killer === P ? P.name : (killer && killer.name) || '', kteam = killer === P ? 'blue' : (killer && killer.team) || (u.team === 'blue' ? 'red' : 'blue');
    MOBA.score[kteam]++; arenaScore(killer === P || (killer && killer.hero) ? kn : '', u.name);
    u.resp = Math.min(20, 8 + MOBA.deaths[u.team] * 0.8); MOBA.deaths[u.team]++;
    log((killer === P ? 'You' : kn || 'A tower') + ' slew ' + u.name + '!', u.team === 'red' ? '#7fe8ff' : '#ff9a9a'); if (killer === P) { sfx('level'); spawnText('Slain ' + u.name, P.pos, 'xp', 2.6); }
  }
}
function mobaPlayerDied(who) {
  MOBA.pd++; MOBA.score.red++; var w = Math.min(14, 5 + MOBA.pd * 1.5);
  var isHero = MOBA.units.red.some(function (u) { return u.hero && u.name === who; });
  arenaScore(isHero ? who : '', P.name);
  $('death-msg').textContent = 'Slain by ' + who + '. Respawning at your base in ' + Math.round(w) + 's...'; var br = $('btn-respawn'); br.style.display = 'none';
  setTimeout(function () { br.style.display = ''; if (curMap && curMap.moba && P.dead) br.click(); }, w * 1000);
}
function mobaEnd(winner) {
  MOBA.over = true; var b = $('moba-banner'); if (!b) return;
  b.className = winner === 'blue' ? 'win' : 'lose'; $('moba-banner-t').textContent = winner === 'blue' ? 'VICTORY!' : 'DEFEAT'; $('moba-banner-s').textContent = 'Final score  Blue ' + MOBA.score.blue + ' - ' + MOBA.score.red + ' Red';
  b.style.display = 'flex'; sfx(winner === 'blue' ? 'level' : 'hurt');
  MOBA.units.red.concat(MOBA.units.blue).forEach(function (u) { u.tgt = null; });
}

/* ---------- AI ---------- */
function mobaMove(u, tx, tz, spd, dt) {
  var dx = tx - u.pos.x, dz = tz - u.pos.z, d = Math.hypot(dx, dz); if (d < 0.05) return 0;
  var sm = u.slow > 0 ? 0.5 : 1, st = Math.min(d, spd * sm * dt); u.pos.x += dx / d * st; u.pos.z += dz / d * st; faceTo(u.c, tx, tz, dt, 10);
  resolveObstacles(u.pos, 0.5 * u.T.scale); return spd * sm;
}
function mobaFind(u) {
  var foes = mobaFoes(u.team), best = null, bs = 1e9, R = u.T.aggro;
  for (var i = 0; i < foes.length; i++) {
    var f = foes[i]; if (!mobaAlive(f)) continue;
    var d = Math.hypot(f.pos.x - u.pos.x, f.pos.z - u.pos.z), sc;
    if (f.struct) { if (mobaProtected(f) || d > u.range + (u.kind === 'tower' ? 0 : 2.5) + (f.kind === 'nexus' ? 3 : 0)) continue; if (u.kind === 'hero' && !u.hero) continue; sc = d + 6; }
    else { if (d > R) continue; sc = f.hero ? d * 0.8 : d; }
    if (u.kind === 'tower' && f.hero) sc += 6;
    if (sc < bs) { bs = sc; best = f; }
  }
  if (u.team === 'red' && !P.dead) { var dp = distP(u.pos); if (dp <= R && dp * 0.8 < bs) best = P; }
  return best;
}
function mobaHit(u, t) {
  if (!mobaAlive(u) || (t !== P && !mobaAlive(t))) return;
  var cl = u.kind === 'rminion' || u.ranged || u.kind === 'tower'; var dx = t.pos.x - u.pos.x, dz = t.pos.z - u.pos.z;
  if (!cl && Math.hypot(dx, dz) > u.range + 2) return;
  mobaHurt(t, u.dmg * (t.struct && u.hero ? 0.6 : 1), u);
}
function mobaAttack(u, t, dt) {
  var d = Math.hypot(t.pos.x - u.pos.x, t.pos.z - u.pos.z) - (t.struct ? 1.8 : 0);
  faceTo(u.c, t.pos.x, t.pos.z, dt, 12);
  if (d > u.range) { u.spd = mobaMove(u, t.pos.x, t.pos.z, u.speed, dt); return; }
  if (u.atkCd > 0 || u.c.anim) return;
  u.atkCd = u.T.cd * (u.slow > 0 ? 1.5 : 1);
  if (u.kind === 'tower') { orbFx(u.pos.x, u.pos.z, t.pos.x, t.pos.z, MOBA_COL[u.team], 0.35, true); schedule(0.35, function () { mobaHit(u, t); }); return; }
  if (u.ranged) {
    if (u.hero) { startAnim(u.c, 'shoot', 0.6); schedule(0.2, function () { if (mobaAlive(u)) arrowFx(u.pos.x, u.pos.z, t.pos.x, t.pos.z, 0.25); }); schedule(0.45, function () { mobaHit(u, t); }); }
    else { startAnim(u.c, 'cast', 0.6); orbFx(u.pos.x, u.pos.z, t.pos.x, t.pos.z, MOBA_COL[u.team], 0.35); schedule(0.35, function () { mobaHit(u, t); }); }
  } else { startAnim(u.c, 'attack', 0.6); schedule(0.28, function () { mobaHit(u, t); }); }
}
function mobaSkill(u) {
  u.skT = rand(8, 11); var r = 5, col = MOBA_COL[u.team];
  startAnim(u.c, u.ranged ? 'cast' : 'spin', 0.7); ringFx(u.pos.x, u.pos.z, r, col, 0.6); burst({ x: u.pos.x, y: 1, z: u.pos.z }, col, 14, 4, 3);
  schedule(0.35, function () {
    if (!mobaAlive(u)) return;
    mobaFoes(u.team).forEach(function (f) { if (mobaAlive(f) && !f.struct && Math.hypot(f.pos.x - u.pos.x, f.pos.z - u.pos.z) <= r) mobaHurt(f, u.dmg * 2.2, u); });
    if (u.team === 'red' && !P.dead && distP(u.pos) <= r) mobaHurt(P, u.dmg * 2.2, u);
  });
}
function mobaAlliesNear(u, x, z, r) { var n = 0, L = MOBA.units[u.team]; for (var i = 0; i < L.length; i++) { var a = L[i]; if (mobaAlive(a) && !a.struct && !a.hero && Math.hypot(a.pos.x - x, a.pos.z - z) < r) n++; } return n; }
function mobaUnitAI(u, dt) {
  u.atkCd -= dt; var stunned = u.stun > 0; if (stunned) u.stun -= dt; if (u.slow > 0) u.slow -= dt; u.spd = 0;
  var sp = MOBA_SPAWN[u.team];
  if (u.hero) {
    if (Math.hypot(u.pos.x - sp[0], u.pos.z - sp[1]) < 11 && u.hp < u.maxHp) { u.hp = Math.min(u.maxHp, u.hp + u.maxHp * 0.12 * dt); u.c.tag.draw(u.hp / u.maxHp); }
    if (u.hp < u.maxHp * 0.3 && u.state !== 'retreat') u.state = 'retreat';
    if (u.state === 'retreat') {
      if (!stunned) u.spd = mobaMove(u, sp[0], sp[1], u.speed * 1.15, dt);
      if (Math.hypot(u.pos.x - sp[0], u.pos.z - sp[1]) < 6 && u.hp > u.maxHp * 0.9) { u.state = 'lane'; u.wi = 1; }
      return;
    }
  }
  if (stunned) return;
  u.thinkT -= dt; if (u.thinkT <= 0) { u.thinkT = 0.3 + Math.random() * 0.15; u.tgt = mobaFind(u); }
  if (u.tgt && u.tgt !== P && !mobaAlive(u.tgt)) u.tgt = null;
  if (u.tgt === P && P.dead) u.tgt = null;
  if (u.hero) { u.skT -= dt; if (u.tgt && u.skT <= 0 && !u.tgt.struct && Math.hypot(u.tgt.pos.x - u.pos.x, u.tgt.pos.z - u.pos.z) < 6) mobaSkill(u); }
  if (u.tgt) { u.state = 'fight'; mobaAttack(u, u.tgt, dt); return; }
  u.state = 'lane';
  var p = u.path, w = p[Math.min(u.wi, p.length - 1)];
  if (Math.hypot(w.x - u.pos.x, w.z - u.pos.z) < 4 && u.wi < p.length - 1) u.wi++;
  w = p[Math.min(u.wi, p.length - 1)];
  if (u.hero) {                                           // heroes wait for their minions before walking into enemy tower range
    var foes = mobaFoes(u.team), hold = false;
    for (var i = 0; i < foes.length; i++) { var f = foes[i]; if (f.kind === 'tower' && mobaAlive(f) && Math.hypot(f.pos.x - u.pos.x, f.pos.z - u.pos.z) < 19 && mobaAlliesNear(u, u.pos.x, u.pos.z, 12) < 2) { hold = true; break; } }
    if (hold) { u.spd = 0; return; }
  }
  var wx = w.x + (u.off || 0) * 0.5, wz = w.z + (u.off || 0) * 0.5; u.spd = mobaMove(u, wx, wz, u.speed, dt);
}
function mobaTowerAI(u, dt) {
  u.atkCd -= dt; if (u.kind !== 'tower' || u.atkCd > 0) return;
  u.thinkT -= dt; if (u.thinkT > 0) return; u.thinkT = 0.25;
  var t = mobaFind(u); if (t) { u.atkCd = 0; mobaAttack(u, t, dt); }
}
function mobaRevive(u) {
  u.hp = u.maxHp; u.state = 'lane'; u.wi = 1; u.tgt = null; var sp = MOBA_SPAWN[u.team]; u.pos.set(sp[0] + rand(-4, 4), 0, sp[1] + rand(-4, 4));
  u.c.anim = null; u.c.g.visible = true; u.c.tag.spr.visible = true; u.c.tag.draw(1); u.c.rig.body.rotation.x = 0; u.c.rig.body.position.y = 0; u.skT = rand(4, 8); u.stun = 0; u.slow = 0;
}
function updateMoba(dt) {
  if (!MOBA.on) return;
  MOBA.t += dt;
  if (!MOBA.over) { MOBA.waveT -= dt; if (MOBA.waveT <= 0) { MOBA.waveT = 28; mobaWave(); } }
  if (P.dead === false && Math.hypot(P.pos.x - MOBA_SPAWN.blue[0], P.pos.z - MOBA_SPAWN.blue[1]) < 11 && (P.hp < maxHp() || P.mp < maxMp())) { P.hp = Math.min(maxHp(), P.hp + maxHp() * 0.12 * dt); P.mp = Math.min(maxMp(), P.mp + maxMp() * 0.12 * dt); }
  ['blue', 'red'].forEach(function (team) {
    var L = MOBA.units[team];
    for (var i = L.length - 1; i >= 0; i--) {
      var u = L[i], c = u.c;
      if (u.state === 'dead') {
        u.deadT += dt;
        if (u.struct) { if (u.c.mobaCry) u.c.mobaCry.visible = false; continue; }
        if (c.g.visible) { c.mv = 0; animateChar(c, dt, 0); }
        if (u.hero) { if (u.deadT > 3.2) c.g.visible = false; if (u.deadT >= u.resp && !MOBA.over) mobaRevive(u); }
        else if (u.deadT > 3.2) { disposeChar(c); L.splice(i, 1); var ei = enemies.indexOf(u); if (ei >= 0) enemies.splice(ei, 1); }
        continue;
      }
      if (MOBA.over) { if (!u.struct) animateChar(c, dt, 0); continue; }
      if (u.struct) { mobaTowerAI(u, dt); if (c.mobaCry) { c.mobaCry.rotation.y += dt * 1.5; c.mobaCry.position.y += Math.sin(MOBA.t * 2) * 0.004; } c.tag.spr.visible = distP(u.pos) < 45 || P.target === u; continue; }
      mobaUnitAI(u, dt);
      c.tag.spr.visible = u.hero || distP(u.pos) < 22;
      animateChar(c, dt, u.spd);
    }
  });
  MOBA.hudT -= dt;
  if (MOBA.hudT <= 0) {
    MOBA.hudT = 0.5; var h = $('moba-hud'); if (h) {
      var tw = function (team) { var n = 0, S = MOBA.S[team]; ['A1', 'A2', 'B1', 'B2', 'M1', 'M2'].forEach(function (k) { if (S[k] && mobaAlive(S[k])) n++; }); return n; };
      var s = Math.floor(MOBA.t), mm = Math.floor(s / 60), ss = s % 60;
      h.innerHTML = '<span class="mb-b">🔵 ' + MOBA.score.blue + '</span><span class="mb-t">' + mm + ':' + (ss < 10 ? '0' : '') + ss + '</span><span class="mb-r">' + MOBA.score.red + ' 🔴</span><div class="mb-s">Towers  🔵 ' + tw('blue') + '/6  ·  🔴 ' + tw('red') + '/6</div>';
    }
  }
}
(function () {
  var rm = document.getElementById('moba-rematch'), lv = document.getElementById('moba-leave');
  if (rm) rm.addEventListener('click', function () { loadMap('moba', true); });
  if (lv) lv.addEventListener('click', function () { loadMap('plains', true); });
})();
