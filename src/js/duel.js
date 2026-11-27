/* duel.js - Duel (1v1, 2 minutes, 25m circle) + map loading screen */
var DUEL = { on: false, opp: 0, name: '', cx: 0, cz: 0, t: 0, ring: null, out: 0, outAt: 0, req: null }, DUEL_R = 25, DUEL_T = 120;
function duelOnline() { return !!(PVP.ws && PVP.ws.readyState === 1 && PVP.ver >= 7); }
function duelRequest(p) {
  if (!p || !p.remote || p.state === 'dead') return;
  if (!duelOnline()) { log('Duel needs the online server (v7). Update server.js.', '#ff9a9a'); return; }
  if (DUEL.on) { log('You are already in a duel.', '#ff9a9a'); return; }
  if (inSafeZone() || aiInSafe(p)) { log('Duels are not allowed inside the safe zone.', '#ff9a9a'); return; }
  if (performance.now() - DUEL.outAt < 8000) { log('Wait a few seconds before sending another duel request.', '#ff9a9a'); return; }
  DUEL.out = p.pid; DUEL.outAt = performance.now(); pvpSend({ t: 'dq', to: p.pid });
  log('Duel request sent to ' + p.name + '...', '#ffb84a');
}
function duelShowReq(on) { var d = $('duel-req'); if (!d) return; d.style.display = on ? 'block' : 'none'; if (on && DUEL.req) $('duel-req-t').textContent = DUEL.req.fn + ' challenges you to a duel!'; }
function duelAccept() {
  var r = DUEL.req; DUEL.req = null; duelShowReq(false); if (!r) return;
  var p = pvpPeer(r.from);
  if (!p || DUEL.on || P.dead || inSafeZone()) { pvpSend({ t: 'dn', to: r.from }); return; }
  var cx = (p.pos.x + P.pos.x) / 2, cz = (p.pos.z + P.pos.z) / 2;
  pvpSend({ t: 'da', to: r.from, cx: +cx.toFixed(1), cz: +cz.toFixed(1) });
  duelStart(r.from, r.fn, cx, cz);
}
function duelDecline() { var r = DUEL.req; DUEL.req = null; duelShowReq(false); if (r) pvpSend({ t: 'dn', to: r.from }); }
function duelStart(id, name, cx, cz) {
  DUEL.on = true; DUEL.opp = id; DUEL.name = name; DUEL.cx = cx; DUEL.cz = cz; DUEL.t = DUEL_T; DUEL.out = 0;
  var g = new THREE.Mesh(new THREE.RingGeometry(DUEL_R - 0.6, DUEL_R, 96), new THREE.MeshBasicMaterial({ color: 0xff4040, transparent: true, opacity: 0.85, side: THREE.DoubleSide, depthWrite: false }));
  g.rotation.x = -Math.PI / 2; g.position.set(cx, 0.12, cz); scene.add(g);
  var f = new THREE.Mesh(new THREE.CircleGeometry(DUEL_R, 64), new THREE.MeshBasicMaterial({ color: 0xff2020, transparent: true, opacity: 0.07, side: THREE.DoubleSide, depthWrite: false }));
  f.rotation.x = -Math.PI / 2; f.position.set(cx, 0.06, cz); scene.add(f);
  DUEL.ring = [g, f];
  var p = pvpPeer(id); if (p) P.target = p;
  sfx('level'); log('⚔ DUEL vs ' + name + '! 2:00 - stay inside the red circle (leaving = draw). First to 0 HP loses (no death, no drops).', '#ff7a7a');
}
function duelEnd(res, why) {
  if (!DUEL.on) return;
  var p = pvpPeer(DUEL.opp); if (p && p.hostile < 1e8) p.hostile = 0;
  (DUEL.ring || []).forEach(function (m) { scene.remove(m); m.geometry.dispose(); m.material.dispose(); }); DUEL.ring = null;
  DUEL.on = false; var d = $('duel-hud'); if (d) d.style.display = 'none';
  if (res === 'win') { sfx('level'); log('🏆 You won the duel against ' + DUEL.name + '!', '#ffd54f'); spawnText('DUEL WON!', P.pos, 'fl crit', 3); }
  else if (res === 'lose') { log('You lost the duel against ' + DUEL.name + '.', '#ff9a9a'); P.hp = Math.max(1, Math.round(maxHp() * 0.2)); spawnText('DUEL LOST', P.pos, 'fl hurt', 3); }
  else log('Duel with ' + DUEL.name + ' ended in a DRAW' + (why ? ' (' + why + ')' : '') + '.', '#9fd8ff');
}
function duelCancel() { if (DUEL.on) { if (PVP.ws && PVP.ws.readyState === 1) pvpSend({ t: 'dx', to: DUEL.opp, r: 'draw' }); duelEnd('draw', 'map changed'); } DUEL.req = null; duelShowReq(false); }
function duelHit(m) {                                           // called from pvpTakeHit after damage: the duel loser does not die
  if (!DUEL.on || m.from !== DUEL.opp || P.hp > 0) return false;
  P.hp = 1; pvpSend({ t: 'dx', to: DUEL.opp, r: 'lost' }); duelEnd('lose'); return true;
}
function duelOnMsg(m) {
  if (m.t === 'dq') {
    if (DUEL.on || P.dead || inSafeZone() || !pkMap() || DUEL.req || !pvpPeer(m.from)) { pvpSend({ t: 'dn', to: m.from }); return true; }
    DUEL.req = { from: m.from, fn: m.fn || 'A player', at: performance.now() }; duelShowReq(true); sfx('hurt'); log('⚔ ' + DUEL.req.fn + ' challenges you to a duel!', '#ff9a6a'); return true;
  }
  if (m.t === 'da') { if (DUEL.out === m.from && !DUEL.on && performance.now() - DUEL.outAt < 20000) { DUEL.out = 0; duelStart(m.from, m.fn || 'Opponent', +m.cx || P.pos.x, +m.cz || P.pos.z); } return true; }
  if (m.t === 'dn') { if (DUEL.out === m.from) { DUEL.out = 0; log((m.fn || 'The player') + ' declined the duel.', '#ff9a9a'); } return true; }
  if (m.t === 'dx') { if (DUEL.on && DUEL.opp === m.from) duelEnd(m.r === 'lost' ? 'win' : 'draw', m.r === 'draw' ? 'opponent left the circle' : ''); return true; }
  return false;
}
function updateDuel(dt) {
  if (DUEL.req && performance.now() - DUEL.req.at > 15000) { DUEL.req = null; duelShowReq(false); }
  if (!DUEL.on) return;
  var p = pvpPeer(DUEL.opp), hud = $('duel-hud'); DUEL.t -= dt;
  if (DUEL.ring) DUEL.ring[0].material.opacity = 0.55 + Math.sin(performance.now() / 250) * 0.3;
  if (hud) { hud.style.display = 'block'; var s = Math.max(0, Math.ceil(DUEL.t)); hud.textContent = '⚔ DUEL vs ' + DUEL.name + '   ' + Math.floor(s / 60) + ':' + ('0' + (s % 60)).slice(-2); }
  if (!p || p.state === 'dead') { duelEnd('draw', 'opponent left'); return; }
  if (P.dead) { duelEnd('draw', 'you died'); return; }
  if (p.hostile < 1e8) p.hostile = 60;
  if (Math.hypot(P.pos.x - DUEL.cx, P.pos.z - DUEL.cz) > DUEL_R) { pvpSend({ t: 'dx', to: DUEL.opp, r: 'draw' }); duelEnd('draw', 'you left the circle'); return; }
  if (Math.hypot(p.pos.x - DUEL.cx, p.pos.z - DUEL.cz) > DUEL_R + 3) { pvpSend({ t: 'dx', to: DUEL.opp, r: 'draw' }); duelEnd('draw', 'opponent left the circle'); return; }
  if (DUEL.t <= 0) { pvpSend({ t: 'dx', to: DUEL.opp, r: 'draw' }); duelEnd('draw', 'time is up'); }
}
/* ---------- loading screen when changing map ---------- */
function mapLoading(name, fn) {
  var o = $('map-loading'); if (!o) { fn(); return; }
  $('map-loading-n').textContent = name; o.style.display = 'flex'; o.style.opacity = '1';
  var t0 = performance.now(), bar = $('map-loading-b'); bar.style.width = '8%';
  setTimeout(function () {
    try { fn(); } catch (e) { console.log('map load error', e); }
    bar.style.width = '70%';
    var iv = setInterval(function () {
      var el = performance.now() - t0, ready = !(curMap && pvpWanted(curMap)) || (PVP.wAt || 0) > t0;
      bar.style.width = Math.min(98, 70 + el / 60) + '%';
      if ((el > 700 && ready) || el > 4000) { clearInterval(iv); bar.style.width = '100%'; o.style.opacity = '0'; setTimeout(function () { o.style.display = 'none'; }, 250); }
    }, 100);
  }, 80);
}
