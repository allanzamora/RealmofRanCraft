/* auto.js - Auto Attack: pick 1-8 skills (Basic Attack counts as one), the hero walks to mobs inside a circle around where you started and fights them. */
var AUTO = { on: false, skills: ['basic'], R: 20, cx: 0, cz: 0, ring: null };
(function () { try { var s = JSON.parse(localStorage.getItem('moviex_auto') || 'null'); if (s) { if (s.skills && s.skills.length) AUTO.skills = s.skills.slice(0, 8); if (s.R) AUTO.R = clamp(+s.R || 20, 8, 45); } } catch (e) {} })();
function saveAuto() { try { localStorage.setItem('moviex_auto', JSON.stringify({ skills: AUTO.skills, R: AUTO.R })); } catch (e) {} }
function autoCleanSkills() { AUTO.skills = AUTO.skills.filter(function (id) { return id === 'basic' || (SKILLS[id] && P.skills.indexOf(id) >= 0); }); if (!AUTO.skills.length) AUTO.skills = ['basic']; }
function refreshAutoBtn() { var b = $('b-auto'); b.classList.toggle('autoon', AUTO.on); b.querySelector('.lb').textContent = AUTO.on ? 'AUTO ON' : 'AUTO'; }
function autoRing() {
  if (!AUTO.ring) { AUTO.ring = new THREE.Mesh(new THREE.RingGeometry(0.97, 1, 72), new THREE.MeshBasicMaterial({ color: 0x66ffa0, transparent: true, opacity: 0.8, side: THREE.DoubleSide, depthWrite: false })); AUTO.ring.rotation.x = -Math.PI / 2; scene.add(AUTO.ring); }
  return AUTO.ring;
}
function startAuto() {
  autoCleanSkills(); AUTO.on = true; AUTO.cx = P.pos.x; AUTO.cz = P.pos.z; AUTO.idx = 0;
  var r = autoRing(); r.position.set(AUTO.cx, 0.1, AUTO.cz); r.scale.set(AUTO.R, AUTO.R, AUTO.R); r.visible = true;
  refreshAutoBtn(); log('Auto attack ON - fighting inside the green circle. Move the joystick to stop.', '#7dff9a');
}
function stopAuto(quiet) {
  if (!AUTO.on) return; AUTO.on = false; if (AUTO.ring) AUTO.ring.visible = false; P.dest = null; refreshAutoBtn();
  if (!quiet) log('Auto attack OFF.', '#ffd54f');
}
/* obstacle / wall awareness: the hero only chases mobs in a clear line (no wall or tree in between) and gives up on a mob it cannot reach */
function autoBlockedAt(x, z) {
  var cx = Math.floor(x / OB_CELL), cz = Math.floor(z / OB_CELL), i, o;
  for (var a = -1; a <= 1; a++) for (var b = -1; b <= 1; b++) { var cell = obGrid[(cx + a) + ',' + (cz + b)]; if (cell) for (i = 0; i < cell.length; i++) { o = cell[i]; if (Math.hypot(x - o.x, z - o.z) < o.r + 0.7) return true; } }
  for (i = 0; i < bigObs.length; i++) { o = bigObs[i]; if (Math.hypot(x - o.x, z - o.z) < o.r + 0.7) return true; }
  return false;
}
function autoLineClear(x0, z0, x1, z1) {
  var d = Math.hypot(x1 - x0, z1 - z0), n = Math.ceil(d / 1.0);
  for (var i = 1; i < n; i++) { var k = i / n; if (autoBlockedAt(x0 + (x1 - x0) * k, z0 + (z1 - z0) * k)) return false; }
  return true;
}
function autoInCircle(x, z) { return Math.hypot(x - AUTO.cx, z - AUTO.cz) <= AUTO.R; }
function autoUsable(e) { return e && !e.isAI && e.state !== 'dead' && e.c.g.visible !== false && autoInCircle(e.pos.x, e.pos.z) && !(e.autoBlk > gameTime) && autoLineClear(P.pos.x, P.pos.z, e.pos.x, e.pos.z); }
function autoPickTarget() {
  var t = P.target;
  if (autoUsable(t)) return t;
  var best = null, bd = 1e9;
  for (var i = 0; i < enemies.length; i++) {
    var e = enemies[i]; if (e.state === 'dead' || e.c.g.visible === false || !autoInCircle(e.pos.x, e.pos.z) || e.autoBlk > gameTime) continue;
    var d = Math.hypot(e.pos.x - P.pos.x, e.pos.z - P.pos.z); if (d >= bd) continue;
    if (!autoLineClear(P.pos.x, P.pos.z, e.pos.x, e.pos.z)) continue;      // behind a wall / obstacle
    bd = d; best = e;
  }
  P.target = best; return best;
}
function autoSkillReady(id, d) {
  var sk = SKILLS[id]; if (!sk || (P.skcd[id] || 0) > 0 || P.mp < sk.mp) return false;
  if (ATTACK_KINDS[sk.kind]) return d <= Math.max(sk.range || 0, (sk.radius || 0) + 2.5, 5);
  if (sk.kind === 'heal' || sk.kind === 'hot') return P.hp < maxHp() * 0.65;
  return d <= 14;                                   // buffs / shields: cast when a fight is on
}
function updateAuto(dt) {
  if (!AUTO.on) return;
  if (P.dead) { stopAuto(); return; }
  if (getMove().m > 0) { stopAuto(); return; }
  AUTO.chk = (AUTO.chk || 0) + dt;                    // stuck check: wanted to move but barely moved for ~0.8s -> skip this mob for a while
  if (AUTO.chk > 0.8) {
    var mvd = Math.hypot(P.pos.x - (AUTO.lx || 0), P.pos.z - (AUTO.lz || 0));
    if (P.dest && mvd < 0.6) { if (P.target) P.target.autoBlk = gameTime + 8; P.target = null; P.dest = null; AUTO.stuck = (AUTO.stuck || 0) + 1; }
    else if (mvd >= 0.6) AUTO.stuck = 0;
    AUTO.chk = 0; AUTO.lx = P.pos.x; AUTO.lz = P.pos.z;
  }
  var t = autoPickTarget();
  if (!t) {                                         // nothing in the circle: wait in the middle
    if (Math.hypot(P.pos.x - AUTO.cx, P.pos.z - AUTO.cz) > 3) { if (!P.dest) { P.destChk = 0; P.destX0 = P.pos.x; P.destZ0 = P.pos.z; } P.dest = { x: AUTO.cx, z: AUTO.cz }; }
    return;
  }
  var d = Math.hypot(t.pos.x - P.pos.x, t.pos.z - P.pos.z), reach = isRangedWeapon() ? 10 : 4.5;
  if (d > reach) {                                  // run to the mob
    if (!P.dest) { P.destChk = 0; P.destX0 = P.pos.x; P.destZ0 = P.pos.z; }
    P.dest = { x: t.pos.x, z: t.pos.z }; return;
  }
  P.dest = null;
  for (var i = 0; i < AUTO.skills.length; i++) { var id = AUTO.skills[i]; if (id !== 'basic' && autoSkillReady(id, d)) { useSkill(id); return; } }
  if (AUTO.skills.indexOf('basic') >= 0) tryBasic();
}
function openAutoPanel() { if (P.dead || ui.open) return; autoCleanSkills(); openPanel('Auto Attack', renderAuto); }
function renderAuto(body) {
  h('div', 'ds', 'Pick 1 to 8 skills to use while auto attacking (' + AUTO.skills.length + '/8). Your hero walks to mobs inside the circle and fights them.', body);
  function row(id, name, icon, emoji, desc) {
    var on = AUTO.skills.indexOf(id) >= 0, r = h('div', 'item', null, body); iconEl(r, icon, emoji);
    var nm = h('div', 'nm', null, r); h('div', null, name, nm); h('div', 'ds', desc, nm);
    btn(r, on ? 'Remove' : 'Add', function () {
      if (on) { if (AUTO.skills.length <= 1) { log('Auto attack needs at least 1 skill.', '#ff9a9a'); return; } AUTO.skills.splice(AUTO.skills.indexOf(id), 1); }
      else { if (AUTO.skills.length >= 8) { log('Maximum 8 skills.', '#ff9a9a'); return; } AUTO.skills.push(id); }
      saveAuto(); rerender();
    }, { cls: on ? 'danger' : 'good' });
  }
  row('basic', 'Basic Attack', null, '⚔', 'Normal attack (used when no chosen skill is ready)');
  P.skills.forEach(function (id) { var sk = SKILLS[id]; if (sk) row(id, sk.name, sk.icon, sk.emoji, 'MP ' + sk.mp + ' · CD ' + sk.cd + 's'); });
  var rr = h('div', 'setrow', null, body), rl = h('span', null, 'Circle radius: ' + AUTO.R + ' m', rr);
  var rg = h('input', null, null, body); rg.type = 'range'; rg.min = '8'; rg.max = '45'; rg.step = '1'; rg.value = String(AUTO.R);
  rg.addEventListener('input', function () { AUTO.R = +rg.value; rl.textContent = 'Circle radius: ' + AUTO.R + ' m'; if (AUTO.on && AUTO.ring) AUTO.ring.scale.set(AUTO.R, AUTO.R, AUTO.R); saveAuto(); });
  var br = h('div', 'setrow', null, body);
  btn(br, AUTO.on ? 'STOP AUTO ATTACK' : 'START AUTO ATTACK', function () { closePanel(); if (AUTO.on) stopAuto(); else startAuto(); }, { cls: AUTO.on ? 'danger' : 'good' });
}
bindBtn('b-auto', function () { openAutoPanel(); });
