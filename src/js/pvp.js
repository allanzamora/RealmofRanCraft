
var PVP_SERVER_URL = 'wss://testgg-jh7k.onrender.com';          
var PVP_DMG_MUL = 0.5;      
var PVP = { ws: null, on: false, id: 0, status: 'off', ping: 0, n: 0, top: [], tries: 0, sendT: 0, eqKey: '', pingT: 0, eqT: 0, hudT: 0, lastX: 0, lastZ: 0, spd: 0, retry: null };
function pvpUrl() { return String((S.pvpUrl || PVP_SERVER_URL || '')).trim(); }
function pvpPeers() { return ais.filter(function (a) { return a.remote; }); }
function pvpPeer(id) { for (var i = 0; i < ais.length; i++) if (ais[i].remote && ais[i].pid === id) return ais[i]; return null; }
function pvpSend(o) { if (PVP.ws && PVP.ws.readyState === 1) { try { PVP.ws.send(JSON.stringify(o)); } catch (e) {} } }
function pvpCw() { return Object.assign({}, P.costumeWorn || {}, { _mt: (P.mounted && P.mountSel) ? P.mountSel : '', _pt: P.pet || '' }); }   // mount + pet ride inside cw (no server change needed)
function pvpMe() { return { name: P.name, lvl: P.lvl, look: P.look, eq: P.equip, cw: pvpCw(), mh: maxHp() }; }
function pvpEqKey() { try { return JSON.stringify([P.equip, pvpCw(), P.look, P.lvl]); } catch (e) { return ''; } }

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
  var sv = [P.look, P.equip, P.costumeWorn];                    // dress the model with the other player's look / gear
  P.look = L; P.equip = p.eq || {}; P.costumeWorn = p.cw || {};
  try { applyEquipVisuals(c); } catch (e) {} finally { P.look = sv[0]; P.equip = sv[1]; P.costumeWorn = sv[2]; }
  c.sheath = true; c.pvpLook = L;
  c.g.position.set(p.x || 0, 0, p.z || 0); c.g.rotation.y = p.ry || 0;
  var a = { isAI: true, remote: true, pid: p.id, name: p.name, lvl: p.lvl, c: c, pos: c.g.position, state: 'alive', hostile: 1e9, hp: p.hp || 1, maxHp: p.mh || 1, mp: 0, maxMp: 0, atk: 0, def: 0, shield: 0, cd: {}, deadT: 0, tx: p.x || 0, tz: p.z || 0, tr: p.ry || 0, spd: 0,
    T: { name: p.name, lvl: p.lvl, scale: 1, boss: false, def: 0, atk: 0, xp: 0, gold: [0, 0] } };
  c.tag.draw(Math.max(0, a.hp / a.maxHp)); ais.push(a); pvpExtras(a, p.cw || {});
}
function pvpRemovePeer(id) { var a = pvpPeer(id); if (!a) return; pvpDropPet(a); scene.remove(a.c.g); if (a.c.tag && a.c.tag.spr) scene.remove(a.c.tag.spr); ais.splice(ais.indexOf(a), 1); if (P.target === a) P.target = null; }
function pvpReskin(a, m) {
  var L = Object.assign({ scale: 1, hairStyles: true, gear: true, pads: true }, P.look, m.look || {}), sv = [P.look, P.equip, P.costumeWorn];
  P.look = L; P.equip = m.eq || {}; P.costumeWorn = m.cw || {};
  try { applyEquipVisuals(a.c); } catch (e) {} finally { P.look = sv[0]; P.equip = sv[1]; P.costumeWorn = sv[2]; }
  a.lvl = m.lvl || a.lvl; a.c.lvl = a.lvl; a.T.lvl = a.lvl; a.c.tag.draw(Math.max(0, a.hp / a.maxHp)); pvpExtras(a, m.cw || {});
}

/* ----- other players' mount + pet ----- */
function pvpExtras(a, cw) {
  var mt = (cw._mt && MOUNTS[cw._mt]) ? cw._mt : '', pt = (cw._pt && PETS[cw._pt]) ? cw._pt : '', c = a.c;
  if (mt !== (a.mt || '')) {
    if (a.mount && (!mt || a.mt !== mt)) { c.g.remove(a.mount.g); a.mount = null; }
    if (mt && !a.mount) { try { a.mount = mt === 'dragon' ? makeDragonMount() : makeCrocMount(); c.g.add(a.mount.g); } catch (e) { a.mount = null; } }
    a.mt = mt; c.forceSheath = !!mt;
    if (!mt) c.rig.body.position.y = 0;
    if (c.tag && c.tag.spr) c.tag.spr.position.y = mt ? 2.75 + (mt === 'dragon' ? MOUNTS.dragon.hover : 0) : 2.6;
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
  var c = a.c, r = c.rig, t = performance.now() / 1000, mv = c.mv, ph = c.phase * 0.9, hov = m.dragon ? MOUNTS.dragon.hover + Math.sin(t * 2.4) * 0.1 : 0;
  m.g.visible = true;
  r.armR.sh.rotation.x = -0.95; r.armR.el.rotation.x = -0.85; r.armR.sh.rotation.z = 0.08; r.armL.sh.rotation.x = -0.45; r.armL.el.rotation.x = -0.8; r.torso.rotation.y = 0;
  r.body.position.y += MOUNT_H + hov;
  r.legR.hp.rotation.x = -1.15; r.legL.hp.rotation.x = -1.15; r.legR.kn.rotation.x = 0.8; r.legL.kn.rotation.x = 0.8;
  for (var i = 0; i < m.tail.length; i++) m.tail[i].rotation.y = Math.sin(t * (2.2 + mv * 5) - i * 0.7) * (0.12 + 0.2 * mv);
  for (var k = 0; k < m.legs.length; k++) m.legs[k].rotation.x = Math.sin(ph + (k === 0 || k === 3 ? 0 : Math.PI)) * 0.6 * Math.min(1, mv);
  if (m.dragon) {
    m.g.position.y = hov; m.g.rotation.x = -0.1 * mv;
    var fa = Math.sin(t * (4.5 + mv * 3)) * 0.6 + 0.2; m.wings.forEach(function (w) { w.g.rotation.z = fa * w.s; });
    var fs = 0.75 + Math.sin(t * 22) * 0.25; m.fl.scale.set(fs, fs, 0.8 + fs * 0.5); m.tip.scale.y = 0.8 + Math.sin(t * 17) * 0.3;
  } else m.g.position.y = Math.abs(Math.sin(ph)) * 0.03 * mv;
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
    if (m.k && m.k !== 'death') startAnim(b.c, m.k, m.d || 0.5);
    if (m.k === 'cast') ringFx(b.pos.x, b.pos.z, 3.2, 0xff8a4a, 0.5);
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
function pvpAnim(type, dur) { if (!PVP.on || type === 'death') return; pvpSend({ t: 'a', k: type, d: dur }); }
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
    PVP.eqT -= dt; if (PVP.eqT <= 0) { PVP.eqT = 0.5; var k2 = pvpEqKey(); if (k2 !== PVP.eqKey) { PVP.eqKey = k2; pvpSend({ t: 'e', lvl: P.lvl, look: P.look, eq: P.equip, cw: pvpCw() }); } }
  }
  PVP.hudT -= dt; if (PVP.hudT <= 0) { PVP.hudT = 0.5; pvpHud(); }
}
function pvpHud() {
  var h = $('pvp-hud'); if (!h) return; h.style.display = PVP.on ? 'block' : 'none'; if (!PVP.on) return;
  var st = { online: '🟢 ' + (PVP.n || pvpPeers().length + 1) + ' players · ' + PVP.ping + ' ms', connecting: '🟡 connecting...', nourl: '🔴 no server set (Settings)', error: '🔴 connection error', off: '🟡 reconnecting...', failed: '🔴 server unreachable' }[PVP.status] || PVP.status;
  var rows = (PVP.top || []).slice(0, 3).map(function (r, i) { return (i + 1) + '. ' + r[0] + '  ' + r[1] + '/' + r[2]; }).join('<br>');
  h.innerHTML = '<b>ONLINE PvP</b> ' + st + (rows ? '<br><span class="pvp-top">K/D  ' + rows + '</span>' : '');
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
