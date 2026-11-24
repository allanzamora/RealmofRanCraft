/* pvp.js - ONLINE PvP ARENA client. Talks to server/pvp_server.js over a WebSocket.
   Other real players appear as remote fighters (entries in `ais` flagged remote:true). Damage is computed by the attacker and applied by the victim. */
var PVP_SERVER_URL = 'wss://testgg-jh7k.onrender.com';          // <-- put your deployed server here, e.g. 'wss://my-pvp.onrender.com'  (players can also type it in Settings)
var PVP_DMG_MUL = 0.5;            // PvP damage scale (tune: lower = longer fights)
var PVP = { ws: null, on: false, id: 0, status: 'off', ping: 0, n: 0, top: [], tries: 0, sendT: 0, eqKey: '', pingT: 0, eqT: 0, hudT: 0, lastX: 0, lastZ: 0, spd: 0, retry: null };
function pvpUrl() { return String((S.pvpUrl || PVP_SERVER_URL || '')).trim(); }
function pvpPeers() { return ais.filter(function (a) { return a.remote; }); }
function pvpPeer(id) { for (var i = 0; i < ais.length; i++) if (ais[i].remote && ais[i].pid === id) return ais[i]; return null; }
function pvpSend(o) { if (PVP.ws && PVP.ws.readyState === 1) { try { PVP.ws.send(JSON.stringify(o)); } catch (e) {} } }
function pvpEq() {                                              // my gear as BASE item ids (instance ids only exist on my own device)
  var o = {}; EQ_SLOTS.forEach(function (sl) { var id = P.equip[sl], it = id && ITEMS[id]; if (it) o[sl] = it.base || id; }); return o;
}
function pvpUp() { var o = {}; EQ_SLOTS.forEach(function (sl) { var id = P.equip[sl]; if (id && upgLvl(id) > 0) o[sl] = upgLvl(id); }); return o; }
function pvpCw() { return Object.assign({}, P.costumeWorn || {}, { _mt: (P.mounted && P.mountSel) ? P.mountSel : '', _pt: P.pet || '', _up: pvpUp(), _em: P.emoNow || '', _dn: P.dance || '', _rk: rankIdx() + 1, _rb: P.reb | 0 }); }   // mount + pet + upgrade levels ride inside cw (no server change needed)
/* run fn() with the global P dressed as another player (look / gear / costumes / upgrade levels), then restore */
function pvpDress(L, eq, cw, fn) {
  var sv = [P.look, P.equip, P.costumeWorn, P.upg], up = {}, e2 = eq || {}, w2 = Object.assign({}, cw || {}); delete w2._up; delete w2._em; delete w2._dn; delete w2._rk; delete w2._rb;
  for (var sl in e2) if (cw && cw._up && cw._up[sl]) up[e2[sl]] = cw._up[sl] | 0;
  P.look = L; P.equip = e2; P.costumeWorn = w2; P.upg = up;
  try { fn(); } catch (e) {} finally { P.look = sv[0]; P.equip = sv[1]; P.costumeWorn = sv[2]; P.upg = sv[3]; }
}   // mount + pet ride inside cw (no server change needed)
function pvpMe() { return { name: P.name, lvl: P.lvl, look: P.look, eq: pvpEq(), cw: pvpCw(), mh: maxHp() }; }
function pvpEqKey() { try { return JSON.stringify([pvpEq(), pvpCw(), P.look, P.lvl]); } catch (e) { return ''; } }

function pvpEnter() {
  PVP.on = true; PVP.tries = 0; PVP.top = []; PVP.n = 0;
  var a = rand(0, TAU), r = rand(14, 44); P.pos.set(Math.cos(a) * r, 0, Math.sin(a) * r); P.invuln = 3;
  log('ONLINE PvP ARENA: fight real players! Free PK, no drops, no penalty.', '#7fd0ff');
  if (!pvpUrl()) { PVP.status = 'nourl'; openPanel('Online PvP server', renderPvpServer); return; }
  pvpConnect();
}
function pvpLeave() {
  PVP.on = false; clearTimeout(PVP.retry); PVP.status = 'off';
  if (PVP.ws) { try { PVP.ws.onclose = null; PVP.ws.close(); } catch (e) {} PVP.ws = null; }
  var h = $('pvp-hud'); if (h) h.style.display = 'none';
}
function pvpConnect() {
  if (!PVP.on) return;
  var url = pvpUrl(); if (!url) { PVP.status = 'nourl'; return; }
  clearTimeout(PVP.retry); PVP.status = 'connecting';
  var ws; try { ws = new WebSocket(url); } catch (e) { PVP.status = 'error'; pvpRetry(); return; }
  PVP.ws = ws;
  ws.onopen = function () { PVP.status = 'online'; PVP.tries = 0; pvpSend(Object.assign({ t: 'join' }, pvpMe())); PVP.eqKey = pvpEqKey(); };
  ws.onmessage = function (e) { var m; try { m = JSON.parse(e.data); } catch (x) { return; } pvpOnMsg(m); };
  ws.onclose = function () { if (PVP.ws === ws) { PVP.ws = null; PVP.status = 'off'; pvpClearPeers(); if (PVP.on) { log('PvP server disconnected - reconnecting...', '#ff9a9a'); pvpRetry(); } } };
  ws.onerror = function () { PVP.status = 'error'; };
}
function pvpRetry() { if (!PVP.on) return; PVP.tries++; if (PVP.tries > 10) { PVP.status = 'failed'; log('Cannot reach the PvP server. Check the address in Settings, then re-enter the arena.', '#ff9a9a'); return; } clearTimeout(PVP.retry); PVP.retry = setTimeout(pvpConnect, Math.min(15000, 2000 * PVP.tries)); }
function pvpDropPet(a) { if (a.petObj) { scene.remove(a.petObj); try { disposeTree(a.petObj); } catch (e) {} a.petObj = null; a.pt = ''; } }
function pvpClearPeers() { for (var i = ais.length - 1; i >= 0; i--) if (ais[i].remote) { pvpDropPet(ais[i]); scene.remove(ais[i].c.g); if (ais[i].c.tag && ais[i].c.tag.spr) scene.remove(ais[i].c.tag.spr); ais.splice(i, 1); } if (P.target && P.target.remote) P.target = null; }

/* ----- remote players ----- */
function pvpAddPeer(p) {
  if (!p || pvpPeer(p.id)) return;
  var L = Object.assign({ scale: 1, hairStyles: true, gear: true, pads: true, padColor: 0x8a97a6, skin: 0xf0c8a0, boots: 0x3a2a1a }, P.look, p.look || {});   // full player rig so costumes / wings / helmets / hair styles can be shown
  var c = newChar(L, p.name, p.lvl, '#ff9a7a', true, { kind: 'sword', color: 0x9b7653 });
  pvpDress(L, p.eq, p.cw, function () { applyEquipVisuals(c); });   // dress the model with the other player's look / gear
  c.sheath = true; c.pvpLook = L;
  c.g.position.set(p.x || 0, 0, p.z || 0); c.g.rotation.y = p.ry || 0;
  var a = { isAI: true, remote: true, pid: p.id, name: p.name, lvl: p.lvl, c: c, pos: c.g.position, state: 'alive', hostile: 1e9, hp: p.hp || 1, maxHp: p.mh || 1, mp: 0, maxMp: 0, atk: 0, def: 0, shield: 0, cd: {}, deadT: 0, tx: p.x || 0, tz: p.z || 0, tr: p.ry || 0, spd: 0,
    T: { name: p.name, lvl: p.lvl, scale: 1, boss: false, def: 0, atk: 0, xp: 0, gold: [0, 0] } };
  c.tag.draw(Math.max(0, a.hp / a.maxHp)); ais.push(a); pvpExtras(a, p.cw || {});
}
function pvpRemovePeer(id) { var a = pvpPeer(id); if (!a) return; emoClear(a); pvpDropPet(a); scene.remove(a.c.g); if (a.c.tag && a.c.tag.spr) scene.remove(a.c.tag.spr); ais.splice(ais.indexOf(a), 1); if (P.target === a) P.target = null; }
function pvpReskin(a, m) {
  var L = Object.assign({ scale: 1, hairStyles: true, gear: true, pads: true }, P.look, m.look || {});
  pvpDress(L, m.eq, m.cw, function () { applyEquipVisuals(a.c); });
  a.lvl = m.lvl || a.lvl; a.c.lvl = a.lvl; a.T.lvl = a.lvl; a.c.tag.draw(Math.max(0, a.hp / a.maxHp)); pvpExtras(a, m.cw || {});
}

/* ----- other players' mount + pet ----- */
function pvpExtras(a, cw) {
  emoPeer(a, cw); rankTagPeer(a.c, cw); a.c.dance = (cw && cw._dn) || '';
  var mt = (cw._mt && MOUNTS[cw._mt]) ? cw._mt : '', pt = (cw._pt && PETS[cw._pt]) ? cw._pt : '', c = a.c;
  if (mt !== (a.mt || '')) {
    if (a.mount && (!mt || a.mt !== mt)) { c.g.remove(a.mount.g); a.mount = null; }
    if (mt && !a.mount) { try { a.mount = makeMountById(mt); c.g.add(a.mount.g); } catch (e) { a.mount = null; } }
    a.mt = mt; c.forceSheath = !!mt;
    if (!mt) c.rig.body.position.y = 0;
    if (c.tag && c.tag.spr) c.tag.spr.position.y = mt ? 2.75 + mountHover(mt) : 2.6;
  }
  if (pt !== (a.pt || '')) {
    pvpDropPet(a);
    if (pt) { try { a.petObj = buildPetModel(pt); a.petObj.position.set(a.pos.x - 1.5, 0, a.pos.z + 1.5); scene.add(a.petObj); } catch (e) { a.petObj = null; } }
    a.pt = pt;
  }
}
function pvpMountAnim(a, dt) {     // same riding pose as updateMount() but for a remote rider
  var m = a.mount; if (!m) return;
  if (!a.mt) { m.g.visible = false; return; }
  var c = a.c, r = c.rig, t = performance.now() / 1000, mv = c.mv, ph = c.phase * 0.9, hov = mountHover(a.mt) ? mountHover(a.mt) + Math.sin(t * 2.4) * 0.1 : 0;
  m.g.visible = true;
  mountRiderPose(r, m, hov);
  for (var i = 0; i < m.tail.length; i++) m.tail[i].rotation.y = Math.sin(t * (2.2 + mv * 5) - i * 0.7) * (0.12 + 0.2 * mv);
  for (var k = 0; k < m.legs.length; k++) m.legs[k].rotation.x = Math.sin(ph + (k === 0 || k === 3 ? 0 : Math.PI)) * 0.6 * Math.min(1, mv);
  mountAnim(m, a.mt, t, mv, ph, hov);
}
function pvpPetAnim(a, dt) {       // pet follows its owner (simplified updatePets)
  var o = a.petObj; if (!o) return;
  var r = a.c.g.rotation.y, fx = Math.sin(r), fz = Math.cos(r), id = a.pt, side = (id === 'chicken' || id === 'dog') ? -1 : 1;
  var tx = a.pos.x - fx * 1.7 + Math.cos(r) * 1.1 * side, tz = a.pos.z - fz * 1.7 - Math.sin(r) * 1.1 * side, dx = tx - o.position.x, dz = tz - o.position.z, d = Math.hypot(dx, dz);
  if (d > 22) { o.position.x = tx; o.position.z = tz; d = 0; dx = dz = 0; }
  if (d > 0.05) { var st = Math.min(d, (4 + d * 3) * dt); o.position.x += dx / d * st; o.position.z += dz / d * st; o.rotation.y = Math.atan2(dx, dz); }
  var mov = d > 0.6, t = performance.now() / 1000;
  if (id === 'chicken') o.position.y = mov ? Math.abs(Math.sin(t * 14)) * 0.08 : 0;
  else if (id === 'dog') o.position.y = mov ? Math.abs(Math.sin(t * 12)) * 0.06 : 0;
  else if (id === 'bird') o.position.y = 1.7 + Math.sin(t * 2.2) * 0.12;
  else if (id === 'fairy') o.position.y = 1.9 + Math.sin(t * 2.6) * 0.15;
  else { o.position.y = 1.6 + Math.sin(t * 2.4) * 0.14; o.rotation.z = Math.sin(t * 1.7) * 0.08; }
  o.visible = a.c.g.visible && a.state !== 'dead';
}
function pvpOnMsg(m) {
  if (m.t === 'w') {                                            // welcome: my id + spawn + players already inside
    PVP.id = m.id; P.pos.set(m.x, 0, m.z); P.invuln = 3; PVP.top = m.top || [];
    (m.players || []).forEach(pvpAddPeer); log('Connected to the PvP server. Players in arena: ' + ((m.players || []).length + 1), '#7fd0ff');
  } else if (m.t === 'j') { pvpAddPeer(m.p); log(m.p.name + ' (Lv' + m.p.lvl + ') entered the arena.', '#9fd8ff'); }
  else if (m.t === 'l') { var lp = pvpPeer(m.id); if (lp) log(lp.name + ' left the arena.', '#9fd8ff'); pvpRemovePeer(m.id); }
  else if (m.t === 's') {
    var a = pvpPeer(m.id); if (!a) return;
    a.tx = m.x; a.tz = m.z; a.tr = m.r; a.hp = m.hp; a.maxHp = m.mh; a.spd = m.m || 0;
    if (a.state === 'dead' && m.hp > 0 && a.deadT > 1.2) { a.state = 'alive'; a.c.anim = null; a.c.g.visible = true; a.c.rig.body.rotation.x = 0; a.c.rig.body.position.y = 0; a.pos.set(m.x, 0, m.z); a.c.tag.spr.visible = true; }
    if (a.state !== 'dead') a.c.tag.draw(Math.max(0, a.hp / a.maxHp));
  } else if (m.t === 'a') {
    var b = pvpPeer(m.id); if (!b || b.state === 'dead') return;
    if (m.sk) { pvpSkillFx(b, m.sk, m.x, m.z); return; }       // a skill cast: its own animation + effects
    if (m.k && m.k !== 'death') startAnim(b.c, m.k, m.d || 0.5);
  } else if (m.t === 'e') { var q = pvpPeer(m.id); if (q) pvpReskin(q, m); }
  else if (m.t === 'h') pvpTakeHit(m);
  else if (m.t === 'k') {
    var v = pvpPeer(m.victim); if (v) { v.state = 'dead'; v.deadT = 0; v.hp = 0; startDeath(v.c, v.pos); v.c.tag.spr.visible = false; if (P.target === v) P.target = null; }
    if (m.killer === PVP.id) { log('You defeated ' + m.vn + '!', '#ffb84a'); sfx('level'); }
    else if (m.victim === PVP.id) log('You were defeated by ' + (m.kn || 'someone') + '.', '#ff7a7a');
    else log(m.kn + ' defeated ' + m.vn, '#c9b8ff');
    PVP.top = m.top || PVP.top;
  } else if (m.t === 'top') { PVP.top = m.top || []; PVP.n = m.n || PVP.n; }
  else if (m.t === 'p') { PVP.ping = Math.round(performance.now() - m.ts); PVP.n = m.n || PVP.n; }
  else if (m.t === 'full') { log('The PvP arena is full (40 players). Try again later.', '#ff9a9a'); PVP.on = false; }
}
/* ----- combat ----- */
function pvpHit(e, base, o) {                                   // called from hurtEnemy() when the target is a remote player
  if (e.state === 'dead' || !PVP.ws || PVP.ws.readyState !== 1) return 0;
  var crit = Math.random() < critChance(), mult = (o && o.execute && e.hp < e.maxHp * 0.35) ? o.execute : 1;
  var d = Math.max(1, Math.round(base * mult * rand(0.9, 1.1) * (crit ? critMul() : 1)));
  pvpSend({ t: 'h', to: e.pid, d: d, c: crit ? 1 : 0 });
  var shown = Math.max(1, Math.round(d * PVP_DMG_MUL));
  e.c.flash = 0.12; e.c.hitT = 0.2; P.lastCombat = gameTime;
  spawnText(String(shown), e.pos, crit ? 'fl crit' : 'fl dmg', 2.1); burst({ x: e.pos.x, y: 1.1, z: e.pos.z }, (o && o.color) || (crit ? 0xffa726 : 0xff5a4a), crit ? 10 : 6, 3, 4); sfx(crit ? 'crit' : 'hit');
  return shown;
}
function pvpTakeHit(m) {
  if (P.dead || P.invuln > 0 || !PVP.on) return;
  var dmg = Math.max(1, Math.round(m.d * PVP_DMG_MUL - defVal() * 0.5));
  if (P.shield > 0) { var ab = Math.min(P.shield, dmg); P.shield -= ab; dmg -= ab; spawnText('Block ' + ab, P.pos, 'fl info', 2.5); }
  P.c.flash = 0.12; P.c.hitT = 0.2; P.lastCombat = gameTime; sfx('hurt');
  if (dmg <= 0) return;
  P.hp -= dmg; spawnText('-' + dmg, P.pos, m.c ? 'fl crit' : 'fl hurt', 2.2);
  var vg = $('vignette'); vg.style.opacity = '1'; setTimeout(function () { vg.style.opacity = '0'; }, 160);
  if (P.hp <= 0) { P.hp = 0; pvpSend({ t: 'k', by: m.from }); playerDie(m.n || 'a player'); }
}
/* ----- other players' skills: visual-only copy of the AI skill effects (no damage; damage is sent as 'h' hits) ----- */
function pvpSkill(id, x, z) { if (PVP.on) PVP.skT = performance.now(); if (PVP.on) pvpSend({ t: 'a', k: 'cast', d: 0.6, sk: id, x: +x.toFixed(1), z: +z.toFixed(1) }); }
/* Full-effect replay: run the REAL skill code with the global P swapped for a ghost of the caster. Damage / logs / network are stubbed, and delayed effects keep the ghost. */
var PVP_GH = { on: false };
function pvpGhEnter(b, tx, tz) {
  var s = { P: P, hurtEnemy: hurtEnemy, eachEnemy: eachEnemy, autoTarget: autoTarget, skillTarget: skillTarget, snapFaceTo: snapFaceTo, log: log, schedule: schedule, pvpAnim: pvpAnim, fl: fxList, nest: PVP_GH.on };
  var G = b.ghost; if (!G) { G = b.ghost = Object.create(s.P); }
  G.pos = b.pos; G.c = b.c; G.dead = false; G.buffs = []; G.shield = 0; G.hot = null; G.target = null; G.hp = Math.max(1, b.hp || 1); G.mp = 9999; G.skcd = {}; G.cd = { skillRefund: false }; G.equip = b.eq || s.P.equip;
  var fake = { pos: { x: tx, z: tz }, state: 'alive', hp: 1, maxHp: 1, c: { g: { rotation: { y: 0 } }, rig: {} }, T: { scale: 1, lvl: 1, name: '' }, remote: true };
  P = G; PVP_GH.on = true;
  hurtEnemy = function () { return 0; }; eachEnemy = function () {}; autoTarget = function () { return fake; }; skillTarget = function () { return fake; }; snapFaceTo = function () {}; log = function () {}; pvpAnim = function () {};
  schedule = function (d, fn) { s.schedule(d, function () { var s2 = pvpGhEnter(b, tx, tz); try { fn(); } finally { pvpGhLeave(s2); } }); };
  s.fl.push = function (o) { if (o && o.update) { var u = o.update; o.update = function () { var s3 = pvpGhEnter(b, tx, tz); try { return u.apply(this, arguments); } finally { pvpGhLeave(s3); } }; } return Array.prototype.push.call(s.fl, o); };
  return s;
}
function pvpGhLeave(s) {
  delete s.fl.push; P = s.P; hurtEnemy = s.hurtEnemy; eachEnemy = s.eachEnemy; autoTarget = s.autoTarget; skillTarget = s.skillTarget; snapFaceTo = s.snapFaceTo; log = s.log; schedule = s.schedule; pvpAnim = s.pvpAnim; PVP_GH.on = s.nest;
}
function pvpSkillFx(b, id, tx, tz) {
  var sk = SKILLS[id]; if (!sk || b.state === 'dead') return;
  if (!isFinite(tx) || !isFinite(tz) || (!tx && !tz)) { var f0 = b.c.g.rotation.y; tx = b.pos.x + Math.sin(f0) * 6; tz = b.pos.z + Math.cos(f0) * 6; }
  if (SKILL_EXEC[sk.kind] && !PVP_GH.on) {
    if (distP(b.pos) > 90) return;
    var gs = pvpGhEnter(b, tx, tz);
    try { b.c.g.rotation.y = Math.atan2(tx - b.pos.x, tz - b.pos.z); SKILL_EXEC[sk.kind](sk); return; } catch (e) { /* fall back to the simple effects below */ } finally { pvpGhLeave(gs); }
  }
  var near = distP(b.pos) < 70, px = b.pos.x, pz = b.pos.z;
  if (!isFinite(tx) || !isFinite(tz) || (!tx && !tz)) { var f = b.c.g.rotation.y; tx = px + Math.sin(f) * 6; tz = pz + Math.cos(f) * 6; }
  var col = sk.color || 0xff9a3a;
  if (near) sfx(sk.kind === 'heal' || sk.kind === 'hot' ? 'heal' : 'skill');
  switch (sk.kind) {
    case 'cone': startAnim(b.c, 'attack', 0.55); if (near) slashFx(px, pz, b.c.g.rotation.y, col, sk.range || 3, sk.cone || 1.6); break;
    case 'aoe': startAnim(b.c, 'spin', 0.7); if (near) { ringFx(px, pz, sk.radius, col, 0.5); schedule(0.3, function () { ringFx(px, pz, sk.radius, col, 0.35); }); if (sk.radius > 8) pillarFx(px, pz, col); } break;
    case 'bolt': startAnim(b.c, 'cast', 0.6); if (near) { orbFx(px, pz, tx, tz, col, 0.22); schedule(0.22, function () { ringFx(tx, tz, 2, col, 0.3); }); } break;
    case 'chain': startAnim(b.c, 'cast', 0.6); if (near) orbFx(px, pz, tx, tz, 0xdff3ff, 0.12); break;
    case 'meteor':
      startAnim(b.c, 'cast', 0.8);
      if (near) { ringFx(tx, tz, sk.radius, 0xff5a1a, sk.delay); schedule(sk.delay, function () { ringFx(tx, tz, sk.radius, 0xffa040, 0.5); pillarFx(tx, tz, 0xff6a1a); burst({ x: tx, y: 1, z: tz }, 0xff8a2a, 22, 6, 7); }); } break;
    case 'step': startAnim(b.c, 'attack', 0.5); if (near) { burst({ x: px, y: 1, z: pz }, 0x6a3aff, 12, 3, 4); slashFx(px, pz, b.c.g.rotation.y, 0xaa77ff, 3, 2); } break;
    case 'storm': startAnim(b.c, 'cast', 0.9); if (near) { ringFx(px, pz, sk.radius, col, 0.8); for (var i = 0; i < 5; i++) (function (i) { schedule(0.3 + i * 0.25, function () { var a2 = rand(0, TAU), r = rand(1, sk.radius); lightningFx(px + Math.cos(a2) * r, pz + Math.sin(a2) * r, col); }); })(i); } break;
    case 'anvil': startAnim(b.c, 'cast', 0.9); if (near) { ringFx(tx, tz, sk.radius, 0x9aa3ad, 0.9); for (var q = 0; q < 4; q++) (function (q) { schedule(0.3 + q * 0.2, function () { var x = tx + rand(-3, 3), z = tz + rand(-3, 3); ringFx(x, z, 2.5, 0xcfd5dc, 0.35); burst({ x: x, y: 0.5, z: z }, 0xb0b6bf, 8, 4, 3); }); })(q); } break;
    case 'starfall': startAnim(b.c, 'cast', 0.9); if (near) { ringFx(tx, tz, sk.radius, 0xffe066, 1.2); for (var j = 0; j < 6; j++) (function (j) { schedule(0.2 + j * 0.15, function () { lightningFx(tx + rand(-4, 4), tz + rand(-4, 4), 0xffe066); }); })(j); } break;
    case 'hsword': startAnim(b.c, 'cast', 0.9); if (near) { ringFx(tx, tz, sk.radius, 0xfff2a0, 0.9); schedule(0.9, function () { ringFx(tx, tz, sk.radius, 0xffffff, 0.5); pillarFx(tx, tz, 0xfff2a0); burst({ x: tx, y: 1, z: tz }, 0xfff2a0, 22, 7, 7); }); } break;
    case 'angel': startAnim(b.c, 'cast', 0.9); if (near) { ringFx(tx, tz, 3, 0xffffff, 0.8); ringFx(tx, tz, 6, 0xfff2a0, 1.0); schedule(1.0, function () { pillarFx(tx, tz, 0xffffff); ringFx(tx, tz, sk.radius, 0xfff2a0, 0.6); burst({ x: tx, y: 2, z: tz }, 0xfff2a0, 24, 7, 8); }); } break;
    case 'icecrack': startAnim(b.c, 'cast', 0.9); if (near) for (var w = 1; w <= 5; w++) (function (w) { schedule(0.1 + w * 0.07, function () { var x = px + (tx - px) * w / 5, z = pz + (tz - pz) * w / 5; ringFx(x, z, 1.4, 0x9fe8ff, 0.3); burst({ x: x, y: 0.4, z: z }, 0xcff4ff, 8, 2, 4); }); })(w); break;
    case 'laser': startAnim(b.c, 'cast', 0.9); if (near) { var dx = tx - px, dz = tz - pz, dl = Math.max(0.5, Math.hypot(dx, dz)); orbFx(px, pz, px + dx / dl * (sk.range || 14), pz + dz / dl * (sk.range || 14), 0xff2a2a, 0.5, true); } break;
    case 'skelly': case 'ewave': startAnim(b.c, 'cast', 1.0); if (near) { ringFx(tx, tz, sk.radius, sk.kind === 'ewave' ? 0x6ab7ff : 0xe8e4d4, 0.9); schedule(0.9, function () { pillarFx(tx, tz, sk.kind === 'ewave' ? 0x6ab7ff : 0xe8e4d4); burst({ x: tx, y: 1.5, z: tz }, sk.kind === 'ewave' ? 0x8fd0ff : 0xe8e4d4, 24, 7, 8); }); } break;
    case 'heal': case 'hot': startAnim(b.c, 'cast', 0.8); if (near) { ringFx(px, pz, 3, 0x6dff8f, 0.7); pillarFx(px, pz, 0x6dff8f); } break;
    case 'shield': startAnim(b.c, 'cast', 0.7); if (near) { ringFx(px, pz, 2.6, 0x9bd0ff, 0.6); pillarFx(px, pz, 0x9bd0ff); } break;
    default: startAnim(b.c, 'cast', 0.7); if (near) { ringFx(px, pz, 2.6, 0xffb04a, 0.6); pillarFx(px, pz, 0xffb04a); }   // buffs
  }
}
function pvpAnim(type, dur) { if (!PVP.on || type === 'death' || performance.now() - (PVP.skT || 0) < 200) return; pvpSend({ t: 'a', k: type, d: dur }); }
function pvpRespawn() {
  var a = rand(0, TAU), r = rand(14, 48); P.pos.set(Math.cos(a) * r, 0, Math.sin(a) * r); P.invuln = 3; P.dest = null;
  pvpSend({ t: 's', x: P.pos.x, z: P.pos.z, r: P.c.g.rotation.y, hp: P.hp, mh: maxHp(), m: 0 });
}
/* ----- per-frame ----- */
function updatePvp(dt) {
  if (!PVP.on) return;
  var peers = pvpPeers();
  for (var i = 0; i < peers.length; i++) {
    var a = peers[i], c = a.c, pos = a.pos;
    if (a.state === 'dead') { if (a.petObj) a.petObj.visible = false; if (a.mount) a.mount.g.visible = false; a.deadT += dt; c.mv = 0; animateChar(c, dt, 0); if (a.deadT > 3.2) c.g.visible = false; continue; }
    var ox = pos.x, oz = pos.z, k = 1 - Math.exp(-14 * dt);
    pos.x += (a.tx - pos.x) * k; pos.z += (a.tz - pos.z) * k;
    var dr = a.tr - c.g.rotation.y; while (dr > Math.PI) dr -= TAU; while (dr < -Math.PI) dr += TAU; c.g.rotation.y += dr * k;
    var spd = dt > 0 ? Math.min(14, Math.hypot(pos.x - ox, pos.z - oz) / dt) : 0, dP = distP(pos);
    c.g.visible = dP < 95; c.tag.spr.visible = dP < 45;
    if (c.g.visible) { animateChar(c, dt, spd); pvpMountAnim(a, dt); }
    pvpPetAnim(a, dt);
  }
  PVP.sendT -= dt; PVP.pingT -= dt;
  var dx = P.pos.x - PVP.lastX, dz = P.pos.z - PVP.lastZ; PVP.spd = dt > 0 ? Math.hypot(dx, dz) / dt : 0; PVP.lastX = P.pos.x; PVP.lastZ = P.pos.z;
  if (PVP.ws && PVP.ws.readyState === 1) {
    if (PVP.sendT <= 0) { PVP.sendT = 0.1; pvpSend({ t: 's', x: +P.pos.x.toFixed(2), z: +P.pos.z.toFixed(2), r: +P.c.g.rotation.y.toFixed(2), hp: Math.max(0, Math.round(P.hp)), mh: maxHp(), m: +Math.min(30, PVP.spd).toFixed(1) }); }
    if (PVP.pingT <= 0) { PVP.pingT = 5; pvpSend({ t: 'p', ts: performance.now() }); }
    PVP.eqT -= dt; if (PVP.eqT <= 0) { PVP.eqT = 0.5; var k2 = pvpEqKey(); if (k2 !== PVP.eqKey) { PVP.eqKey = k2; pvpSend({ t: 'e', lvl: P.lvl, look: P.look, eq: pvpEq(), cw: pvpCw() }); } }
  }
  PVP.hudT -= dt; if (PVP.hudT <= 0) { PVP.hudT = 0.5; pvpHud(); }
}
function pvpHud() {
  var h = $('pvp-hud'); if (!h) return; h.style.display = PVP.on ? 'block' : 'none'; if (!PVP.on) return;
  var st = { online: '🟢 ' + (PVP.n || pvpPeers().length + 1) + ' players · ' + PVP.ping + ' ms', connecting: '🟡 connecting...', nourl: '🔴 no server set (Settings)', error: '🔴 connection error', off: '🟡 reconnecting...', failed: '🔴 server unreachable' }[PVP.status] || PVP.status;
  h.innerHTML = '<b>ONLINE PvP</b> ' + st;
}
/* ----- server address popup / settings ----- */
function renderPvpServer(body) {
  h('div', 'ds', 'The Online PvP Arena needs a PvP server (the file server/pvp_server.js - run it on Render, Railway or Termux). Enter its address: wss://your-server.onrender.com (use ws://IP:8080 only on a local network).', body);
  var inp = h('input', null, null, body); inp.type = 'text'; inp.value = S.pvpUrl || PVP_SERVER_URL || ''; inp.placeholder = 'wss://your-server.onrender.com'; inp.autocapitalize = 'off'; inp.autocomplete = 'off';
  inp.style.cssText = 'width:100%;padding:8px;border-radius:8px;border:1px solid #888;background:#111a33;color:#fff;font-size:14px;box-sizing:border-box;margin:6px 0';
  btn(body, 'Save & connect', function () {
    var v = inp.value.trim(); if (v && !/^wss?:\/\//i.test(v)) v = 'wss://' + v.replace(/^https?:\/\//i, '');
    S.pvpUrl = v; saveSettings(); closePanel();
    if (PVP.on) { PVP.tries = 0; if (PVP.ws) { try { PVP.ws.onclose = null; PVP.ws.close(); } catch (e) {} PVP.ws = null; } pvpClearPeers(); pvpConnect(); }
  }, { cls: 'good' });
}

/* ---------- Top 5 most kills (left side) in the PvP maps: Online PvP Arena = server scoreboard, Blood Arena = local scoreboard ---------- */
var ARENA_SB = {};
function arenaReset() { ARENA_SB = {}; var b = $('arena-board'); if (b) b.style.display = 'none'; }
function arenaScore(killer, victim) {
  if (!curMap || !curMap.arena || curMap.online) return;
  if (killer) { var k = ARENA_SB[killer] || (ARENA_SB[killer] = { k: 0, d: 0 }); k.k++; }
  if (victim) { var v = ARENA_SB[victim] || (ARENA_SB[victim] = { k: 0, d: 0 }); v.d++; }
}
function arenaBoard() {
  var b = $('arena-board'); if (!b) return;
  if (!curMap || !curMap.arena) { b.style.display = 'none'; return; }
  var rows;
  if (curMap.online) rows = (PVP.on && PVP.top || []).map(function (r) { return { n: r[0], k: r[1] | 0, d: r[2] | 0 }; });
  else rows = Object.keys(ARENA_SB).map(function (n) { return { n: n, k: ARENA_SB[n].k, d: ARENA_SB[n].d }; }).filter(function (r) { return r.k > 0; }).sort(function (a, c) { return c.k - a.k || a.d - c.d; }).slice(0, 5);
  var medals = ['🥇', '🥈', '🥉', '4', '5'], html = '<b>🏆 TOP 5 KILLS</b>';
  if (!rows.length) html += '<div class="ab-empty">No kills yet</div>';
  rows.slice(0, 5).forEach(function (r, i) {
    html += '<div class="ab-row' + (r.n === P.name ? ' me' : '') + '"><span class="ab-n">' + medals[i] + '</span><span class="ab-nm">' + String(r.n).replace(/[<>&]/g, '') + '</span><span class="ab-k">' + r.k + '</span></div>';
  });
  if (b._h !== html) { b._h = html; b.innerHTML = html; }
  b.style.display = 'block';
}
setInterval(arenaBoard, 500);
