/* loot.js - Item Merge (stars), PK Penalty, death drops + ground loot, Police Station */
var MAX_STARS = 5;
var ABS_CAP = 60;
function starsOf(id) { return (P.stars && P.stars[id]) | 0; }
function starText(n) { var s = ''; for (var i = 0; i < n; i++) s += '★'; return s; }
function absorbPct() { return Math.min(ABS_CAP, gearSum('absorb')); }
function absorbDmg(d) { var a = absorbPct(); return a > 0 ? Math.max(1, Math.round(d * (1 - a / 100))) : d; }
/* ---------------- Item Star Upgrade: sacrifice similar items + gold to put a star on an EQUIPPED item (+10% all stats per star) ---------------- */
var STAR_REQ = [null, { n: 5, g: 4000000, d: 0 }, { n: 10, g: 8000000, d: 0 }, { n: 15, g: 12000000, d: 0 }, { n: 20, g: 16000000, d: 0 }, { n: 25, g: 20000000, d: 100 }];
var STAR_BONUS = 0.1, STAR_SLOTS = [['weapon', 'Weapon'], ['helmet', 'Helmet'], ['armor', 'Armor'], ['gloves', 'Gloves'], ['pants', 'Pants'], ['necklace', 'Necklace'], ['ringL', 'Ring Left'], ['ringR', 'Ring Right']];
function starMul(id) { return 1 + STAR_BONUS * starsOf(id); }
function starFodder(id) {   // other copies of the same item in the bag (not worn)
  var it = ITEMS[id]; if (!it) return [];
  return P.owned.filter(function (x) { return x !== id && ITEMS[x] && ITEMS[x].base === it.base && !EQ_SLOTS.some(function (s) { return P.equip[s] === x; }); })
    .sort(function (a, b) { return (starsOf(a) + upgLvl(a)) - (starsOf(b) + upgLvl(b)); });
}
function doStarUp(id, use) {
  var st = starsOf(id); if (!ITEMS[id] || st >= MAX_STARS) return 'Already max stars.';
  if (!EQ_SLOTS.some(function (s) { return P.equip[s] === id; })) return 'Item must be equipped.';
  var rq = STAR_REQ[st + 1], pool = starFodder(id);
  if (!use || use.length !== rq.n) return 'Select exactly ' + rq.n + ' similar items.';
  for (var i = 0; i < use.length; i++) if (pool.indexOf(use[i]) < 0 || use.indexOf(use[i]) !== i) return 'Invalid items selected.';
  if (P.gold < rq.g) return 'Not enough gold.'; if (P.diamonds < rq.d) return 'Not enough diamonds.';
  P.gold -= rq.g; P.diamonds -= rq.d;
  use.forEach(function (x) { P.owned.splice(P.owned.indexOf(x), 1); delete P.rolls[x]; delete P.upg[x]; if (P.stars) delete P.stars[x]; delete ITEMS[x]; });
  P.stars[id] = st + 1; P.hp = Math.min(P.hp, maxHp()); saveGame(); sfx('level');
  log('Star upgrade success! ' + ITEMS[id].name + ' ' + starText(st + 1) + ' (all stats +' + Math.round(STAR_BONUS * 100 * (st + 1)) + '%)', '#ffd54f');
  return null;
}
var STAR_SLOT = 'weapon', STAR_SEL = [];
function openMerge(n) { STAR_SEL = []; var fs0 = STAR_SLOTS.filter(function (sd) { var q = P.equip[sd[0]]; return q && ITEMS[q] && q !== 'weapon0'; })[0]; if (fs0 && (!P.equip[STAR_SLOT] || P.equip[STAR_SLOT] === 'weapon0')) STAR_SLOT = fs0[0]; openPanel(n ? n.name : 'Item Star Upgrade', renderStarUp); }
function renderStarUp(body) {
  h('p', 'ds', 'Pick an equipped item, then sacrifice similar copies from your bag + gold to give it a star. Every star = +10% to all its stats (basic + random). 100% success, max 5 stars.', body);
  h('p', 'ds', 'Stars: 1★ 5 items + 4M gold · 2★ 10 + 8M · 3★ 15 + 12M · 4★ 20 + 16M · 5★ 25 + 20M + 100 diamonds.   You have ' + P.gold + ' gold, ' + P.diamonds + ' diamonds.', body);
  var row = h('div', 'btns', null, body);
  STAR_SLOTS.forEach(function (sd) {
    var id = P.equip[sd[0]], has = id && ITEMS[id] && !(sd[0] === 'weapon' && id === 'weapon0');
    btn(row, sd[1] + (has ? ': ' + itemName(id) + (starsOf(id) ? ' ' + starText(starsOf(id)) : '') : ': -'), function () { STAR_SLOT = sd[0]; STAR_SEL = []; rerender(); }, { cls: STAR_SLOT === sd[0] ? 'good' : '', disabled: !has });
  });
  var id = P.equip[STAR_SLOT];
  if (!id || !ITEMS[id]) { h('p', null, 'Nothing equipped in that slot.', body); return; }
  var st = starsOf(id);
  h('div', 'sec', ITEMS[id].name + (st ? ' ' + starText(st) : '') + (upgLvl(id) ? ' +' + upgLvl(id) : ''), body);
  h('div', 'ds', 'Stats now x' + starMul(id).toFixed(1) + (st < MAX_STARS ? ' → x' + (starMul(id) + STAR_BONUS).toFixed(1) : '  (MAX)'), body);
  if (st >= MAX_STARS) { h('p', null, 'This item has reached 5 stars.', body); return; }
  var rq = STAR_REQ[st + 1], pool = starFodder(id);
  STAR_SEL = STAR_SEL.filter(function (x) { return pool.indexOf(x) >= 0; });
  if (!STAR_SEL.length && pool.length >= rq.n) STAR_SEL = pool.slice(0, rq.n);   // default: the weakest copies
  h('div', 'sec', 'Similar items in your bag: ' + pool.length + '  (need ' + rq.n + ', selected ' + STAR_SEL.length + ')', body);
  if (!pool.length) h('p', 'ds', 'You have no other ' + ITEMS[id].name + ' in your bag.', body);
  pool.forEach(function (x) {
    var on = STAR_SEL.indexOf(x) >= 0;
    btn(body, (on ? '✔ ' : '') + itemName(x) + (starsOf(x) ? ' ' + starText(starsOf(x)) : ''), function () {
      if (on) STAR_SEL.splice(STAR_SEL.indexOf(x), 1); else if (STAR_SEL.length < rq.n) STAR_SEL.push(x); rerender();
    }, { cls: on ? 'good' : '' });
  });
  var ok = STAR_SEL.length === rq.n && P.gold >= rq.g && P.diamonds >= rq.d;
  btn(body, 'UPGRADE → ' + starText(st + 1) + '  (' + rq.n + ' items + ' + (rq.g / 1000000) + 'M gold' + (rq.d ? ' + ' + rq.d + ' diamonds' : '') + ')', function () {
    var r = doStarUp(id, STAR_SEL.slice()); if (r) log(r, '#ff9a9a'); else STAR_SEL = []; rerender();
  }, { cls: 'good', disabled: !ok });
}

/* ---------------- PK penalty ---------------- */
function pkMap() { return !!(curMap && !curMap.arena && !curMap.online && !curMap.moba && !curMap.key); }
function pkAdd(v) { P.pkp = Math.min(100, Math.max(0, Math.round(((P.pkp || 0) + v) * 10) / 10)); saveGame(); }
var PK_T = 0;
function pkTick(dt) {
  if (!(P.pkp > 0) || P.dead || !curMap || !inSafeZone()) { return; }
  PK_T += dt;
  if (PK_T >= 600) { PK_T = 0; pkAdd(-0.1); log('Police: PK Penalty reduced by 0.1% (now ' + P.pkp.toFixed(1) + '%).', '#9fd8ff'); }
}
var POLICE_COST = 1000000;
function openPolice(n) { openPanel(n ? n.name : 'Police Station', renderPolice); }
function renderPolice(body) {
  h('p', 'ds', 'PK Penalty: ' + (P.pkp || 0).toFixed(1) + '%. Every player you kill in a normal map adds 0.4%. When you die, that % is your chance to drop 1 equipped item that anyone can loot.', body);
  h('p', 'ds', 'Pay 1,000,000 gold per 1% to clear it. Or stay inside a safe zone: -0.1% every 10 minutes (next in ' + Math.max(0, Math.ceil(600 - PK_T)) + 's while in a safe zone).   Gold: ' + P.gold, body);
  if (!(P.pkp > 0)) { h('p', null, 'Your record is clean.', body); return; }
  [1, 5, 10, 100].forEach(function (a) {
    var amt = Math.min(a, P.pkp), cost = Math.round(amt * POLICE_COST);
    btn(body, (a === 100 ? 'Clear all (' + P.pkp.toFixed(1) + '%)' : 'Reduce ' + a + '%') + ' — ' + cost + ' gold', function () {
      if (P.gold < cost) { log('Not enough gold.', '#ff9a9a'); return; }
      P.gold -= cost; pkAdd(-amt); sfx('coin'); log('PK Penalty reduced by ' + amt + '%.', '#9fd8ff'); rerender();
    }, { cls: 'good', disabled: P.gold < cost });
  });
}

/* ---------------- death drop + ground loot ---------------- */
var LOOT = [], LOOT_SEQ = 0, LOOT_SLOTS = ['weapon', 'helmet', 'armor', 'gloves', 'pants', 'necklace', 'ringL', 'ringR'];
function lootOK() { return pkMap() && pvpWanted(curMap); }
function dropOnDeath() {
  if (!lootOK() || !(P.pkp > 0) || Math.random() * 100 >= P.pkp) return null;
  var c = LOOT_SLOTS.filter(function (s) { var id = P.equip[s]; return id && ITEMS[id] && ITEMS[id].base !== 'weapon0' && id !== 'weapon0'; });
  if (!c.length) return null;
  var sl = c[randInt(0, c.length - 1)], id = P.equip[sl], it = ITEMS[id];
  var data = { b: it.base, r: ((P.rolls[id] && P.rolls[id].r) || []).map(function (r) { return [r[0], r[1]]; }), u: upgLvl(id), s: starsOf(id), m: (P.rolls[id] && P.rolls[id].bm) || 1 };
  P.equip[sl] = sl === 'weapon' ? 'weapon0' : null; P.owned.splice(P.owned.indexOf(id), 1);
  delete P.rolls[id]; delete P.upg[id]; if (P.stars) delete P.stars[id]; delete ITEMS[id];
  try { applyEquipVisuals(); } catch (e) {} saveGame();
  var x = P.pos.x, z = P.pos.z;
  if (PVP.ws && PVP.ws.readyState === 1 && PVP.on && !PVP.hidden) pvpSend({ t: 'ld', it: data, x: +x.toFixed(1), z: +z.toFixed(1) });
  else lootAdd({ lid: 'l' + (++LOOT_SEQ), it: data, x: x, z: z });
  log('You dropped ' + ITEMS[data.b].name + (data.u ? ' +' + data.u : '') + '! Anyone can loot it.', '#ff7a7a');
  return data;
}
function lootLabel(txt) {
  var cv = document.createElement('canvas'); cv.width = 256; cv.height = 48; var g = cv.getContext('2d');
  g.font = 'bold 22px sans-serif'; g.textAlign = 'center'; g.lineWidth = 4; g.strokeStyle = '#000'; g.strokeText(txt, 128, 32); g.fillStyle = '#ffd54f'; g.fillText(txt, 128, 32);
  var t = new THREE.CanvasTexture(cv), s = new THREE.Sprite(new THREE.SpriteMaterial({ map: t, transparent: true, depthTest: false })); s.scale.set(4, 0.75, 1); return s;
}
function lootAdd(l) {
  if (!l || !l.it || !ITEMS[l.it.b] || LOOT.some(function (q) { return q.lid === l.lid; })) return;
  var g = new THREE.Group(), box = new THREE.Mesh(new THREE.BoxGeometry(0.7, 0.5, 0.7), new THREE.MeshBasicMaterial({ color: 0xffc83a }));
  box.position.y = 0.45; g.add(box);
  var beam = new THREE.Mesh(new THREE.CylinderGeometry(0.12, 0.12, 4, 6, 1, true), new THREE.MeshBasicMaterial({ color: 0xffe36a, transparent: true, opacity: 0.4, depthWrite: false })); beam.position.y = 2.2; g.add(beam);
  var lb = lootLabel(ITEMS[l.it.b].name + (l.it.u ? ' +' + l.it.u : '') + (l.it.s ? ' ' + starText(l.it.s) : '')); lb.position.y = 1.6; g.add(lb);
  g.position.set(l.x, 0, l.z); scene.add(g);
  LOOT.push({ lid: l.lid, it: l.it, x: l.x, z: l.z, g: g, box: box, age: 0, req: 0 });
}
function lootRemove(lid) { for (var i = LOOT.length - 1; i >= 0; i--) if (LOOT[i].lid === lid) { scene.remove(LOOT[i].g); LOOT[i].g.traverse(function (o) { if (o.geometry) o.geometry.dispose(); if (o.material) { if (o.material.map) o.material.map.dispose(); o.material.dispose(); } }); LOOT.splice(i, 1); } }
function lootClear() { while (LOOT.length) lootRemove(LOOT[0].lid); }
var LOOT_STAT = { dmg: 1, hp: 1, hpr: 1, mpr: 1, crit: 1, cdmg: 1, spd: 1, absorb: 1 };
function lootGive(d) {
  if (!d || !ITEMS[d.b] || ITEMS[d.b].type !== 'gear') return;
  var rolls = (Array.isArray(d.r) ? d.r : []).filter(function (r) { return Array.isArray(r) && LOOT_STAT[r[0]] && isFinite(r[1]) && r[1] > 0 && r[1] < 1e7; }).slice(0, 12).map(function (r) { return [r[0], +r[1]]; });
  var nid = makeInstance(d.b, rolls, null, Math.min(1024, d.m | 0)); P.owned.push(nid);
  if (d.u > 0) P.upg[nid] = Math.min(MAX_UPG, d.u | 0); if (d.s > 0) P.stars[nid] = Math.min(MAX_STARS, d.s | 0);
  saveGame(); sfx('coin'); log('Looted ' + itemName(nid) + (starsOf(nid) ? ' ' + starText(starsOf(nid)) : '') + '!', '#ffd54f');
}
function lootOnMsg(m) {
  if (m.t === 'ld') { lootAdd(m.l); return true; }
  if (m.t === 'lx') { lootRemove(m.lid); return true; }
  if (m.t === 'lg') { lootGive(m.it); return true; }
  return false;
}
function updateLoot(dt) {
  pkTick(dt);
  for (var i = LOOT.length - 1; i >= 0; i--) {
    var l = LOOT[i]; l.age += dt; l.box.rotation.y += dt * 2; l.box.position.y = 0.45 + Math.sin(l.age * 3) * 0.12;
    if (l.age > 185) { lootRemove(l.lid); continue; }
    if (P.dead || !P.pos || Math.hypot(P.pos.x - l.x, P.pos.z - l.z) > 2.2) continue;
    if (l.req > 0) { l.req -= dt; continue; }
    if (String(l.lid).charAt(0) === 'l') { var d = l.it; lootRemove(l.lid); lootGive(d); }       // offline / local loot
    else if (PVP.ws && PVP.ws.readyState === 1) { l.req = 1.5; pvpSend({ t: 'lp', lid: l.lid }); }
  }
}
