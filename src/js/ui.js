/* ui.js - panels (bag/equipment, shops, skills, world map, quests, settings), HUD, minimap, camera */
var panelEl = $('panel'), panelBody = $('panel-body');
var pvw = null, pvOverride = {}, pvLook = {}, pvZoom = false;
function openPanel(title, render, opts) { if (title !== 'Merry Christmas!') xmasStop(); closeNav(); ui.open = title; ui.render = render; ui.preview = !!(opts && opts.preview); pvOverride = {}; pvLook = {}; pvZoom = false; panelEl.classList.toggle('hasprev', ui.preview); if (pvw) pvw.run = false; $('panel-title').textContent = title; panelEl.style.display = 'flex'; releaseInputs(); rerender(); }
function rerender() {
  var st = panelBody.scrollTop, pt = $('panel-tabs'); panelEl.classList.remove('mapmode'); panelBody.innerHTML = ''; pt.innerHTML = '';
  if (ui.render) ui.render(panelBody);
  if (ui.preview) updatePanelPreview();
  var tb = panelBody.querySelector('.tabs'); if (tb) pt.appendChild(tb);   // tabs are pinned right under the title
  pt.style.display = tb ? 'block' : 'none'; panelBody.scrollTop = st;
}
function closePanel() { xmasStop(); ui.open = null; ui.render = null; ui.preview = false; panelEl.classList.remove('hasprev'); if (pvw) pvw.run = false; panelEl.style.display = 'none'; }
$('panel-close').addEventListener('click', closePanel);
/* popups close only with the X button (tapping outside does nothing) */
function btn(parent, text, fn, opts) {
  var b = h('button', opts && opts.cls ? opts.cls : null, text, parent);
  if (opts && opts.disabled) b.disabled = true;
  b.addEventListener('click', function () { sfx('ui'); fn(); }); return b;
}
function iconEl(parent, src, fallback, cls, itemId) {
  var d = h('div', 'ico ' + (cls || ''), null, parent), im = h('img', null, null, d);
  im.src = src; im.alt = ''; im.draggable = false;
  im.onerror = function () { d.removeChild(im); d.textContent = fallback || '?'; starBadge(d, itemId); };
  starBadge(d, itemId);
  return d;
}
function starBadge(d, id) { var n = id && P.stars && (P.stars[id] | 0); if (n > 0) { d.style.position = 'relative'; h('span', 'sbadge', '★' + n, d); } }
var SHOP_STOCK = ['hp_potion', 'mp_potion'];
ITEM_ORDER.forEach(function (id) { if (ITEMS[id].type === 'gear' && !ITEMS[id].bossOnly && id !== 'dragon_blade' && id !== 'weapon0') SHOP_STOCK.push(id); });
/* bow sells right after the Iron Sword in the Merchant's Sword tab */
['starter_necklace', 'starter_ring_l', 'starter_ring_r'].forEach(function (id) { SHOP_STOCK.push(id); });
SHOP_STOCK.splice(SHOP_STOCK.indexOf('weapon1') + 1, 0, SHOP_STOCK.splice(SHOP_STOCK.indexOf('bow1'), 1)[0]);

/* ---------- bag / equipment ---------- */
var bagTab = 'weapon';
function openBag() { openPanel('Bag - Items', renderBag, { preview: true }); }
var bagMode = 'gear', BAG_ITEMS = ['name_card', 'stat_card', 'hair_card', 'color_card', 'face_card', 'hp_potion', 'mp_potion', 'burr_stone', 'luxury_stone', 'feather', 'accessory_stone', 'godzilla_fragment', 'golden_key', 'bus_card'];
function renderBag(body) {
  var mt = h('div', 'tabs', null, body);
  [['gear', 'Equipment'], ['items', 'Items'], ['costume', 'Costume']].forEach(function (t) { var b = h('button', bagMode === t[0] ? 'act' : null, t[1], mt); b.addEventListener('click', function () { bagMode = t[0]; rerender(); }); });
  if (bagMode === 'costume') { renderCostumes(body); return; }
  if (bagMode === 'items') {
    h('div', 'sec', 'Potions & materials (total collected)', body);
    BAG_ITEMS.forEach(function (id) {
      var it = ITEMS[id], r = h('div', 'item', null, body); iconEl(r, it.icon, it.emoji || '?');
      var nm = h('div', 'nm', null, r); h('div', null, it.name, nm); h('div', 'ds', it.desc, nm);
      h('span', 'tag eq', id === 'bus_card' ? (P.inv.bus_card ? busLeftText() : 'none') : 'x' + (P.inv[id] || 0), r);
      if (CARD_USE[id] && (P.inv[id] || 0) > 0) btn(r, 'Use', function () { CARD_USE[id](); }, { cls: 'good' });
    });
    return;
  }
  h('div', 'sec', 'Equipped', body);
  var row = h('div', 'slotrow', null, body);
  EQ_SLOTS.forEach(function (sl) {
    var id = P.equip[sl], bx = h('div', 'slotbox' + (bagTab === sl ? ' sel' : ''), null, row);
    if (id) iconEl(bx, ITEMS[id].icon, ITEMS[id].emoji || SLOT_INFO[sl].icon, '', id); else h('div', 'ico', SLOT_INFO[sl].icon, bx).style.opacity = '.35';
    h('div', null, id ? itemName(id) : SLOT_INFO[sl].label, bx);
    bx.addEventListener('click', function () { bagTab = sl; rerender(); });
  });
  h('div', 'sec', (SLOT_INFO[bagTab].pl || SLOT_INFO[bagTab].label) + ' owned', body);
  var any = false;
  P.owned.forEach(function (id) {
    var it = ITEMS[id]; if (it.slot !== bagTab) return; any = true;
    var r = h('div', 'item', null, body); iconEl(r, it.icon, it.emoji || SLOT_INFO[it.slot].icon, '', id);
    var nm = h('div', 'nm', null, r); h('div', it.rare ? 'rare' : null, (it.rare ? '★ ' : '') + itemName(id) + (it.lvl > 1 ? '  (Lv ' + it.lvl + '+)' : ''), nm); h('div', 'ds', it.desc, nm);
    if (P.equip[it.slot] === id) { h('span', 'tag eq', 'EQUIPPED', r); if (it.slot !== 'weapon') btn(r, 'Remove', function () { unequipSlot(it.slot); rerender(); }); }
    else btn(r, 'Equip', function () { if (equipItem(id)) rerender(); }, { disabled: P.lvl < it.lvl });
  });
  if (!any) h('div', 'ds', 'Nothing yet. Buy or loot some!', body);
}

/* ---------- skills: loadout + shop ---------- */
var skillTab = 'mine', pickSlot = 0;
function openSkills() { openPanel('Skills', renderSkills); }
function skillRow(parent, id, extra) {
  var sk = SKILLS[id], r = h('div', 'item' + (P.skills.indexOf(id) < 0 && P.lvl < sk.lvl ? ' locked' : ''), null, parent);
  iconEl(r, sk.icon, sk.emoji);
  var nm = h('div', 'nm', null, r);
  h('div', null, sk.name + '  (Lv ' + sk.lvl + ')', nm);
  h('div', 'ds', sk.desc + '  MP ' + sk.mp + ' · CD ' + sk.cd + 's', nm);
  extra(r, sk); return r;
}
function renderSkills(body) {
  var tabs = h('div', 'tabs', null, body);
  [['mine', 'My skills'], ['shop', 'Skill shop']].forEach(function (t) { var b = h('button', skillTab === t[0] ? 'act' : null, t[1], tabs); b.addEventListener('click', function () { skillTab = t[0]; rerender(); }); });
  if (skillTab === 'mine') {
    h('div', 'sec', 'Equipped slots (tap a slot, then "Equip" a skill)', body);
    var row = h('div', 'slotrow', null, body);
    for (var i = 0; i < SKILL_SLOTS; i++) (function (i) {
      var id = P.slots[i], bx = h('div', 'slotbox' + (pickSlot === i ? ' sel' : ''), null, row);
      if (id) iconEl(bx, SKILLS[id].icon, SKILLS[id].emoji); else h('div', 'ico', '+', bx).style.opacity = '.4';
      h('div', null, (i + 1) + '. ' + (id ? SKILLS[id].name : 'empty'), bx);
      bx.addEventListener('click', function () { pickSlot = i; rerender(); });
    })(i);
    h('div', 'sec', 'Owned skills (' + P.skills.length + '/' + SKILL_ORDER.length + ')', body);
    SKILL_ORDER.forEach(function (id) {
      if (P.skills.indexOf(id) < 0) return;
      skillRow(body, id, function (r) {
        var at = P.slots.indexOf(id);
        if (at >= 0) h('span', 'tag eq', 'SLOT ' + (at + 1), r);
        btn(r, at === pickSlot ? 'In slot' : 'Equip', function () {
          var prev = P.slots[pickSlot], old = P.slots.indexOf(id);
          if (old >= 0) P.slots[old] = prev || null;          // swap if already equipped elsewhere
          P.slots[pickSlot] = id; refreshSkillButtons(); saveGame(); rerender();
        }, { disabled: at === pickSlot });
      });
    });
  } else {
    h('div', 'sec', 'Gold: ' + P.gold + '   ·   Diamonds: ' + P.diamonds, body);
    SKILL_ORDER.forEach(function (id) {
      if (P.skills.indexOf(id) >= 0) return;
      skillRow(body, id, function (r, sk) {
        var dia = !!sk.dprice, poor = dia ? P.diamonds < sk.dprice : P.gold < sk.price;
        h('span', 'tag', dia ? sk.dprice + ' 💎' : sk.price + ' G', r);
        btn(r, 'Buy', function () {
          if (P.lvl < sk.lvl) { log('Requires level ' + sk.lvl + '.', '#ff9a9a'); return; }
          if (poor) { log(dia ? 'Not enough Diamonds.' : 'Not enough gold.', '#ff9a9a'); return; }
          if (dia) P.diamonds -= sk.dprice; else P.gold -= sk.price;
          P.skills.push(id); sfx('coin'); log('Learned ' + sk.name + '! Equip it in My skills.', '#ffd54f'); saveGame(); updateHud(); rerender();
        }, { disabled: P.lvl < sk.lvl || poor, cls: 'good' });
      });
    });
    if (P.skills.length >= SKILL_ORDER.length) h('div', 'ds', 'You know every skill!', body);
  }
}
function refreshSkillButtons() {
  for (var i = 0; i < SKILL_SLOTS; i++) {
    var el = $('b-k' + (i + 1)), id = P.slots[i]; el.innerHTML = '';
    el.classList.toggle('empty', !id);
    if (id) { var im = h('img', null, null, el); im.src = SKILLS[id].icon; im.draggable = false; im.onerror = (function (e2) { return function () { var p = this.parentNode; if (p) { p.removeChild(this); p.insertBefore(document.createTextNode(e2), p.firstChild); } }; })(SKILLS[id].emoji); h('span', 'kn', String(i + 1), el); }
    else h('span', 'kn', String(i + 1), el);
    h('div', 'cd', null, el);
  }
}

/* ---------- world map / portals ---------- */
function openWorldMap() { openPanel('World Map', renderWorldMap); }
var WM_TABS = [['normal', 'Normal'], ['dungeon', 'Dungeon'], ['pvp', 'PvP'], ['boss', 'Boss']], wmTab = 'normal';
function wmCat(m) { return m.key ? 'dungeon' : (m.arena || m.online) ? 'pvp' : ((m.boss || m.bossRoom) && !m.mobs) ? 'boss' : 'normal'; }
function renderWorldMap(body) {
  var tabs = h('div', 'tabs', null, body);
  WM_TABS.forEach(function (t) { var b = h('button', wmTab === t[0] ? 'act' : null, t[1], tabs); b.addEventListener('click', function () { wmTab = t[0]; rerender(); }); });
  h('div', 'ds', 'Use a portal (glowing ring at the camp) or this map to travel. Your level must meet the map requirement.' + (wmTab === 'dungeon' ? ' Dungeons also need a Golden Key.' : ''), body);
  MAPS.filter(function (m) { return wmCat(m) === wmTab; }).sort(function (a, b) { return a.min - b.min; }).forEach(function (m) {
    var here = curMap && curMap.id === m.id, ok = canEnterMap(m);
    var r = h('div', 'item' + (ok ? '' : ' locked'), null, body);
    h('div', 'ico', ok ? '🗺' : '🔒', r);
    var nm = h('div', 'nm', null, r);
    h('div', null, m.name + '  (Lv ' + m.min + '+)', nm);
    var lv = m.enemies.map(function (k) { return ENEMY_TYPES[k].lvl; });
    if (m.prison) h('div', 'ds', 'Prison · 4 cell rooms · ' + m.perRoom.reduce(function (a, b) { return a + b; }, 0) + ' Lv ' + ENEMY_TYPES[m.enemies[0]].lvl + ' ' + ENEMY_TYPES[m.enemies[0]].name + 's · ' + ENEMY_TYPES[m.enemies[0]].xp.toLocaleString() + ' EXP per kill · gold only, no item drops · NO safe zone' + (m.key ? ' · Gold per kill: ' + ENEMY_TYPES[m.enemies[0]].gold[0].toLocaleString() + ' · needs a Golden Key (own ' + (P.inv.golden_key | 0) + (hasGoldenPass() ? ', pass: ' + goldenPassText() : '') + ')' : ''), nm);
    else if (m.bossRoom) h('div', 'ds', 'Developer Game Station · 11 bosses incl. The Game Master (HP 50M) · no NPCs · each boss 70% to drop 1 Diamond', nm);
    else if (m.online) h('div', 'ds', 'ONLINE PvP · fight real players · free PK · no drops · needs the PvP server', nm);
    else if (m.arena) h('div', 'ds', 'PvP arena · 20-25 AI players · FREE PK · no drops', nm);
    else if (m.mobs) h('div', 'ds', 'Boss: ' + ENEMY_TYPES[m.enemies[0]].name + ' (Lv ' + lv[0] + ') + ' + m.mobs.length + ' Lv ' + ENEMY_TYPES[m.mobs[0]].lvl + ' mob types · mobs drop refine stones + gold, boss drops God of Helmet / Godzilla Sword', nm);
    else if (m.boss) h('div', 'ds', 'ONE boss: ' + ENEMY_TYPES[m.enemies[0]].name + ' (Lv ' + lv[0] + ') · drops boss-only rare gear', nm);
    else h('div', 'ds', m.enemies.length + ' monster types · Suggested Lv ' + Math.min.apply(null, lv) + '-' + Math.max.apply(null, lv) + ' · Boss: ' + ENEMY_TYPES[m.enemies[m.enemies.length - 1]].name + (ENEMY_TYPES[m.enemies[m.enemies.length - 1]].celestial ? ' · Drops: Celestial set' : ''), nm);
    if (here) h('span', 'tag eq', 'HERE', r);
    else btn(r, 'Travel', function () { closePanel(); travelTo(m.id); }, { disabled: !ok, cls: 'good' });
  });
}

/* ---------- quests / npc ---------- */
function openQuestLog() { openPanel('Quest Log', renderQuests); }
function questRewardText(q) { var rw = q.rewards, parts = [rw.gold + ' G', rw.xp + ' XP']; for (var id in rw.items) parts.push(rw.items[id] + 'x ' + ITEMS[id].name); return parts.join(', '); }
function renderQuests(body) {
  QUESTS.forEach(function (q) {
    var s = P.quests[q.id], row = h('div', 'item', null, body), nm = h('div', 'nm', null, row);
    h('div', null, q.title, nm);
    var status = !s ? 'Not started' : (s.state === 'done' ? 'Completed' : (s.state === 'ready' ? 'Ready to turn in' : 'Progress: ' + s.n + '/' + q.need));
    h('div', 'ds', 'Defeat ' + q.need + ' ' + ENEMY_TYPES[q.target].name + ' - ' + status, nm);
    h('div', 'ds', 'Reward: ' + questRewardText(q), nm);
  });
}
function nearestNpc() {
  var best = null, bd = 3.4;
  npcs.forEach(function (n) { var d = Math.hypot(n.pos.x - P.pos.x, n.pos.z - P.pos.z); if (d < bd) { bd = d; best = n; } });
  return best;
}
function nearestInteract() {
  var n = nearestNpc(); if (n) return n;
  for (var i = 0; i < portals.length; i++) if (Math.hypot(portals[i].x - P.pos.x, portals[i].z - P.pos.z) < 3.6) return { name: 'Portal', kind: 'portal', pos: { x: portals[i].x, z: portals[i].z } };
  return null;
}
function interact(n) {
  if (P.dead) return;
  if (n.kind === 'shop') openShop(n); else if (n.kind === 'upgrade') openUpgrade(n); else if (n.kind === 'mount') openMountShop(n); else if (n.kind === 'rebirth') openRebirth(n); else if (n.kind === 'tist') openTist(n); else if (n.kind === 'gm') openGM(n); else if (n.kind === 'xmas') openXmas(); else if (n.kind === 'craft') openCraft(n); else if (n.kind === 'merge') openMerge(n); else if (n.kind === 'police') openPolice(n); else if (n.kind === 'market') openMarket(n); else if (n.kind === 'diamond') openDiamondShop(n); else if (n.kind === 'costume') openCostumeShop(n); else if (n.kind === 'pet') openPetShop(n); else if (n.kind === 'petfood') openPetFoodShop(n); else if (n.kind === 'portal') openWorldMap(); else openQuestDialog(n);
}
function openQuestDialog(npc) {
  openPanel(npc.name, function (body) {
    var q = currentQuest(), dlg = h('div', 'dlg', null, body), btns;
    if (!q) { h('p', null, 'You have cleared every threat in the land. The realm is safe, hero.', dlg); return; }
    var st = P.quests[q.id];
    h('div', 'sec', q.title, dlg);
    if (!st) {
      h('p', null, q.intro, dlg);
      h('p', null, 'Goal: defeat ' + q.need + ' ' + ENEMY_TYPES[q.target].name + '. Reward: ' + questRewardText(q) + '.', dlg);
      btns = h('div', 'btns', null, dlg);
      btn(btns, 'Accept quest', function () { P.quests[q.id] = { state: 'active', n: 0 }; refreshMarkers(); saveGame(); log('Quest accepted: ' + q.title, '#ffd54f'); closePanel(); }, { cls: 'good' });
    } else if (st.state === 'active') {
      h('p', null, 'Progress: ' + st.n + '/' + q.need + ' ' + ENEMY_TYPES[q.target].name + '. Keep fighting!', dlg);
    } else {
      h('p', null, q.done, dlg); btns = h('div', 'btns', null, dlg);
      btn(btns, 'Claim reward', function () {
        var rw = q.rewards; P.gold += rw.gold; for (var id in rw.items) giveItem(id, rw.items[id]);
        st.state = 'done'; log('Quest reward: ' + rw.gold + ' gold, ' + rw.xp + ' XP.', '#7dff9a');
        gainXp(rw.xp); sfx('level'); refreshMarkers(); saveGame(); closePanel();
        if (currentQuest()) schedule(0.5, function () { log('Elder Rowan has a new task for you.', '#ffd54f'); });
      }, { cls: 'good' });
    }
  });
}

/* ---------- shop ---------- */
function openShop(npc) { openPanel(npc.name + ' - Shop', renderShop); }
function renderShop(body) {
  h('div', 'sec', 'Gold: ' + P.gold, body);
  var tabs = h('div', 'tabs', null, body);
  [['potion', 'Potions']].concat(SLOTS.map(function (s) { return [s, SLOT_INFO[s].label]; })).concat([['jewel', 'Jewelry']]).forEach(function (t) {
    var b = h('button', shopTab === t[0] ? 'act' : null, t[1], tabs); b.addEventListener('click', function () { shopTab = t[0]; rerender(); });
  });
  SHOP_STOCK.forEach(function (id) {
    var it = ITEMS[id]; if ((it.type === 'potion' ? 'potion' : (it.slot === 'necklace' || it.slot === 'ringL' || it.slot === 'ringR') ? 'jewel' : it.slot) !== shopTab) return;
    var r = h('div', 'item', null, body); iconEl(r, it.icon, it.emoji || '+');
    var nm = h('div', 'nm', null, r);
    h('div', null, it.name + (it.lvl > 1 ? '  (Lv ' + it.lvl + '+)' : ''), nm); h('div', 'ds', it.desc + ' - ' + it.price + ' G + 12% tax = ' + buyCost(it.price) + ' G', nm);
    if (it.type !== 'potion' && P.owned.indexOf(id) >= 0) h('span', 'tag', 'OWNED', r);
    else btn(r, 'Buy', function () {
      var cost = buyCost(it.price);
      if (P.gold < cost) { log('Not enough gold (price + 12% tax = ' + cost + ' G).', '#ff9a9a'); return; }
      P.gold -= cost; P.taxPaid += cost - it.price; giveItem(id, 1); sfx('coin'); log('Bought ' + it.name + ' for ' + cost + ' G (incl. ' + (cost - it.price) + ' G tax).', '#ffd54f'); saveGame(); rerender();
    }, { disabled: P.gold < buyCost(it.price) });
  });
  h('div', 'sec', 'Sell gear (12% tax deducted)', body);
  var sold = false;
  P.owned.forEach(function (id) {
    var it = ITEMS[id]; if (P.equip[it.slot] === id || id === 'weapon0' || it.slot === 'aura' || upgLvl(id) > 0) return; sold = true;
    var r = h('div', 'item', null, body); iconEl(r, it.icon, '?', '', id); var nm = h('div', 'nm', null, r); h('div', null, it.name, nm);
    btn(r, 'Sell ' + sellNet(sellValue(it)) + ' G', function () { P.owned.splice(P.owned.indexOf(id), 1); P.gold += sellNet(sellValue(it)); P.taxPaid += sellValue(it) - sellNet(sellValue(it)); sfx('coin'); saveGame(); rerender(); });
  });
  if (!sold) h('div', 'ds', 'No spare gear to sell.', body);
}
var shopTab = 'potion';

/* ---------- settings ---------- */
function openSettings() { openPanel('Menu', renderSettings); }
function renderSettings(body) {
  var r1 = h('div', 'setrow', null, body); h('span', null, 'Camera sensitivity', r1);
  var rng = h('input', null, null, body); rng.type = 'range'; rng.min = '0.4'; rng.max = '2'; rng.step = '0.1'; rng.value = String(S.sens);
  rng.addEventListener('input', function () { S.sens = parseFloat(rng.value); saveSettings(); });
  var rm = h('div', 'setrow', null, body); var ml = h('span', null, 'Music volume: ' + Math.round(S.music * 100) + '%' + (bgmFailed ? '  (could not load)' : ''), rm);
  var mr = h('input', null, null, body); mr.type = 'range'; mr.min = '0'; mr.max = '1'; mr.step = '0.05'; mr.value = String(S.music);
  mr.addEventListener('input', function () { S.music = parseFloat(mr.value); ml.textContent = 'Music volume: ' + Math.round(S.music * 100) + '%'; musicApply(); saveSettings(); });
  var rg = h('div', 'setrow', null, body); h('span', null, 'Graphics', rg);
  var gs = document.createElement('select'); gs.className = 'gfxsel'; rg.appendChild(gs);
  [['low', 'Low'], ['medium', 'Medium'], ['high', 'High']].forEach(function (q) { var op = document.createElement('option'); op.value = q[0]; op.textContent = q[1]; if (S.gfx === q[0]) op.selected = true; gs.appendChild(op); });
  gs.value = S.gfx;
  gs.addEventListener('change', function () { S.gfx = gs.value; if (S.gfx === 'low') S.shadows = false; applyGfx(); applyShadows(); saveSettings();
    var live = curMap && !curMap.moba && !curMap.key, keep = P.pos.clone();      // rebuild the current map now so trees / props / effects switch immediately
    if (live) { mapLoading(curMap.name, function () { loadMap(curMap.id, true); P.pos.copy(keep); camera.position.set(P.pos.x, 4, P.pos.z + 9); }); }
    applyEquipVisuals(); rerender(); log('Graphics: ' + gs.options[gs.selectedIndex].text + (live ? ' - applied now.' : ' - scenery updates when you leave this map.'), '#9fe3ff'); });
  h('div', 'ds', 'Low = old / low-end phones (scenery shown as see-through boxes). Medium is the default. Changes apply immediately (the current map reloads). Low also hides auras and skill effects.', body);
  var rp = h('div', 'setrow', null, body); h('span', null, 'Game server: ' + pvpSrvName(), rp); btn(rp, 'Switch', function () { openPanel('Game server', renderPvpServer); }, {});
  var r2 = h('div', 'setrow', null, body); h('span', null, 'Shadows (turn off for speed)', r2);
  btn(r2, S.shadows ? 'ON' : 'OFF', function () { S.shadows = !S.shadows; applyShadows(); saveSettings(); rerender(); });
  var r3 = h('div', 'setrow', null, body); h('span', null, 'Sound', r3);
  btn(r3, S.sound ? 'ON' : 'OFF', function () { S.sound = !S.sound; saveSettings(); rerender(); });
  var r4 = h('div', 'setrow', null, body); h('span', null, 'Fullscreen', r4);
  btn(r4, 'TOGGLE', function () { if (document.fullscreenElement || document.webkitFullscreenElement) { (document.exitFullscreen || document.webkitExitFullscreen).call(document); } else goFullscreen(); });
  h('div', 'sec', 'Controls', body);
  h('div', 'ds', 'Bottom-left: joystick (touch anywhere in the lower-left area). Right side: drag to turn the camera, pinch or +/- to zoom, tap an enemy to target. Hold ATTACK to auto-attack. Keyboard: WASD, Space, 1-5 skills, Q/E potions, F talk, B bag, K skills, M map, L quests, +/- zoom.', body);
  h('div', 'sec', 'Account', body);
  if (CLOUD.user) {
    var ra = h('div', 'setrow', null, body); h('span', null, 'Logged in: ' + (CLOUD.user.email || ''), ra);
    var rb = h('div', 'setrow', null, body); h('span', null, '\u2601 ' + cloudStatusText(), rb);
    btn(rb, 'Sync now', function () { cloudPush(true).then(function () { if (ui.open === 'Menu') rerender(); }); rerender(); });
    var rc = h('div', 'setrow', null, body); h('span', null, 'Log out (saves to cloud first)', rc);
    btn(rc, logoutBusy ? '...' : 'Log out', function () {
      if (logoutBusy) return; logoutBusy = true; rerender();
      cloudLogout(function (ok) { logoutBusy = false; if (!ok) log('Could not save to the cloud. Check your internet and try again.', '#ff9a9a'); if (ui.open === 'Menu') rerender(); });
    }, { cls: 'danger' });
  } else {
    var rd = h('div', 'setrow', null, body); h('span', null, 'Offline mode - progress is saved on this device only', rd);
    btn(rd, 'Log in', function () { try { sessionStorage.setItem('moviex_auto', '1'); } catch (e) {} location.reload(); });
  }
}
var logoutBusy = false;

/* ---------- camera / HUD / minimap / zone banner ---------- */
function updateCamera(dt) {
  var tx = P.pos.x, ty = P.pos.y + 1.5, tz = P.pos.z, cp = Math.cos(cam.pitch);
  var px = tx + Math.sin(cam.yaw) * cp * cam.dist, py = Math.max(0.6, ty + Math.sin(cam.pitch) * cam.dist), pz = tz + Math.cos(cam.yaw) * cp * cam.dist;
  var k = 1 - Math.exp(-16 * dt);
  camera.position.x = lerp(camera.position.x, px, k); camera.position.y = lerp(camera.position.y, py, k); camera.position.z = lerp(camera.position.z, pz, k);
  camera.lookAt(tx, ty + 0.2, tz);
  sun.position.set(tx + 30, 50, tz + 20); sun.target.position.set(tx, 0, tz);
}
var lastZone = -1, zoneTimer = null;
function zoneIndex() {
  if (!curMap) return 0;
  if (curMap.prison) return 1;
  if (curMap.arena || curMap.boss) return Math.hypot(P.pos.x, P.pos.z) < curMap.safeR ? 0 : 1;
  var r = Math.hypot(P.pos.x, P.pos.z); if (r < curMap.safeR) return 0;
  var r0 = curMap.safeR + 6, step = (curMap.R - 12 - r0) / (curMap.enemies.length - 1);
  return clamp(1 + Math.floor((r - r0) / step + 1e-6) + (r < r0 ? -1 : 0), 1, curMap.enemies.length);
}
function showBanner(t, s) {
  $('zone-t').textContent = t; $('zone-s').textContent = s;
  var zb = $('zone-banner'); zb.style.opacity = '1'; clearTimeout(zoneTimer); zoneTimer = setTimeout(function () { zb.style.opacity = '0'; }, 2600);
}
function updateZone() {
  if (!curMap) return;
  var z = zoneIndex();
  if (z === lastZone) return; lastZone = z;
  if (curMap.prison) { showBanner(curMap.name, 'Lv ' + ENEMY_TYPES[curMap.enemies[0]].lvl + ' · No Safe Zone'); return; }
  if (curMap.arena) { showBanner(curMap.name, 'FREE PK  -  no drops'); return; }
  if (curMap.boss && z === 1) { showBanner(curMap.name, 'Boss: Lv ' + ENEMY_TYPES[curMap.enemies[0]].lvl + ' ' + ENEMY_TYPES[curMap.enemies[0]].name); return; }
  if (z === 0) { showBanner(curMap.name + (curMap.hub ? ' Village' : ' Camp'), 'Safe Zone'); return; }
  var T = ENEMY_TYPES[curMap.enemies[Math.min(z - 1, curMap.enemies.length - 1)]];
  showBanner(T.boss ? 'Boss Lair' : T.name + ' Grounds', 'Level ' + T.lvl + (T.boss ? ' Boss' : ''));
}
function setCd(id, remain, total) { var el = $(id).querySelector('.cd'); if (el) el.style.setProperty('--p', total > 0 && remain > 0 ? (remain / total * 100).toFixed(0) : '0'); }
function updateHud() {
  if (P.c) { var tk = (P.rkEq || '') + '|' + (P.reb | 0); if (P._tk !== tk) { P._tk = tk; var rr = rankById(P.rkEq); setTagTitle(P.c, rr ? rr.id : '', P.reb, rr ? rr.col : '#ffffff'); } }
  $('p-lvl').textContent = P.lvl; $('p-name').textContent = P.name + (P.reb ? ' [R' + P.reb + ']' : '');
  $('p-hp').style.width = (P.hp / maxHp() * 100) + '%'; $('p-hp-t').textContent = Math.floor(P.hp) + ' / ' + maxHp();
  $('p-mp').style.width = (P.mp / maxMp() * 100) + '%'; $('p-mp-t').textContent = Math.floor(P.mp) + ' / ' + maxMp();
  $('p-xp').style.width = (P.lvl >= MAX_LVL ? 100 : P.xp / xpNext(P.lvl) * 100) + '%';
  refreshPlayerTag(false);
  var spb = $('p-sp'); spb.textContent = P.sp > 0 ? '+' + P.sp + ' pts' : ''; spb.style.display = P.sp > 0 ? 'block' : 'none';
  $('gold').textContent = P.gold + ' G'; $('dia-n').textContent = P.diamonds + ' \uD83D\uDC8E'; $('mapname').textContent = curMap ? curMap.name : '';
  $('c-hp').textContent = P.inv.hp_potion || 0; $('c-mp').textContent = P.inv.mp_potion || 0;
  for (var i = 0; i < SKILL_SLOTS; i++) {
    var id = P.slots[i], el = $('b-k' + (i + 1));
    if (id) { setCd('b-k' + (i + 1), P.skcd[id] || 0, SKILLS[id].cd); el.style.opacity = P.mp >= SKILLS[id].mp ? '1' : '0.55'; }
  }
  $('b-mount').classList.toggle('on', !!P.mounted); $('b-mount').lastChild.textContent = P.mounted ? 'UNRIDE' : 'RIDE';
  setCd('b-dash', P.cd.dash, DASH_CD); setCd('b-hp', P.cd.pot, 1.2); setCd('b-mp', P.cd.pot, 1.2);
  renderBuffs();
  var tf = $('target-frame');
  if (P.target && P.target.state !== 'dead') {
    tf.style.display = 'block'; $('t-name').textContent = 'Lv' + P.target.T.lvl + ' ' + P.target.T.name;
    $('t-hp').style.width = Math.max(0, P.target.hp / P.target.maxHp * 100) + '%'; $('t-hp-t').textContent = Math.ceil(P.target.hp) + ' / ' + P.target.maxHp;
  } else tf.style.display = 'none';
  var pkb = $('btn-pk'), ta = P.target, dub = $('btn-duel');
  dub.style.display = (ta && ta.remote && ta.state !== 'dead' && !ui.open && !P.dead && !DUEL.on && pkMap()) ? 'block' : 'none';
  if (ta && ta.isAI && ta.state !== 'dead' && !ui.open && !P.dead) { pkb.style.display = 'block'; pkb.textContent = ta.hostile > 0 ? 'PK ON' : 'PK'; pkb.classList.toggle('on', ta.hostile > 0); } else pkb.style.display = 'none';
  var n = nearestInteract(), tb = $('btn-talk');
  if (n && !ui.open && !P.dead) { tb.style.display = 'block'; tb.textContent = (n.kind === 'portal' ? 'ENTER ' : 'TALK: ') + n.name; } else tb.style.display = 'none';
}
var mini = $('minimap'), mctx = mini.getContext('2d');
function drawMini() {
  var W = mini.width, R = 46, s = (W / 2) / R;
  mctx.clearRect(0, 0, W, W); mctx.save(); mctx.translate(W / 2, W / 2);
  mctx.beginPath(); mctx.arc(0, 0, W / 2 - 2, 0, TAU); mctx.clip();
  mctx.fillStyle = curMap ? '#' + ('000000' + new THREE.Color(curMap.theme.mount).getHexString()).slice(-6) : '#244'; mctx.globalAlpha = 0.85; mctx.fillRect(-W / 2, -W / 2, W, W); mctx.globalAlpha = 1;
  var fx = -Math.sin(cam.yaw), fz = -Math.cos(cam.yaw), rx = Math.cos(cam.yaw), rz = -Math.sin(cam.yaw);
  function toMap(x, z) { var dx = x - P.pos.x, dz = z - P.pos.z; return { x: (dx * rx + dz * rz) * s, y: -(dx * fx + dz * fz) * s }; }
  var o = toMap(0, 0);
  mctx.fillStyle = 'rgba(190,180,150,.8)'; mctx.beginPath(); mctx.arc(o.x, o.y, (curMap ? curMap.safeR : 16) * s, 0, TAU); mctx.fill();
  enemies.forEach(function (e) { if (e.state === 'dead' || !e.T.boss) return; var p = toMap(e.pos.x, e.pos.z); if (p.x * p.x + p.y * p.y > W * W / 4) return; mctx.fillStyle = '#ff2a2a'; mctx.beginPath(); mctx.arc(p.x, p.y, e.T.boss ? 6 : 3, 0, TAU); mctx.fill(); });
  ais.forEach(function (a) { if (a.state === 'dead') return; var p = toMap(a.pos.x, a.pos.z); if (p.x * p.x + p.y * p.y > W * W / 4) return; mctx.fillStyle = '#c08aff'; mctx.beginPath(); mctx.arc(p.x, p.y, 3.4, 0, TAU); mctx.fill(); });
  bots.forEach(function (b) { var p = toMap(b.pos.x, b.pos.z); mctx.fillStyle = '#6ab7ff'; mctx.beginPath(); mctx.arc(p.x, p.y, 3, 0, TAU); mctx.fill(); });
  npcs.forEach(function (n) { var p = toMap(n.pos.x, n.pos.z); mctx.fillStyle = '#ffe066'; mctx.beginPath(); mctx.arc(p.x, p.y, 4, 0, TAU); mctx.fill(); });
  portals.forEach(function (pt) { var p = toMap(pt.x, pt.z); mctx.fillStyle = '#66ccff'; mctx.fillRect(p.x - 4, p.y - 4, 8, 8); });
  var a = P.c.g.rotation.y, dx = Math.sin(a), dz = Math.cos(a), ax = dx * rx + dz * rz, ay = -(dx * fx + dz * fz);
  mctx.rotate(Math.atan2(ay, ax)); mctx.fillStyle = '#fff'; mctx.beginPath(); mctx.moveTo(9, 0); mctx.lineTo(-6, 6); mctx.lineTo(-3, 0); mctx.lineTo(-6, -6); mctx.closePath(); mctx.fill(); mctx.restore();
}
$('btn-respawn').addEventListener('click', function () {
  $('death').style.display = 'none'; if (!(curMap && curMap.arena)) { var xl = Math.min(P.xp, Math.floor(xpNext(P.lvl) * 0.02)); if (xl > 0) { P.xp -= xl; log('Death penalty: -' + xl.toLocaleString() + ' EXP (2% of this level).', '#ff9a9a'); } }
  P.dead = false; P.hp = maxHp(); P.mp = maxMp(); P.c.anim = null; if (curMap && curMap.moba) { P.pos.set(MOBA_SPAWN.blue[0], 0, MOBA_SPAWN.blue[1]); P.c.g.rotation.y = -Math.PI * 0.25; } else { P.pos.set(0, 0, 7); P.c.g.rotation.y = Math.PI; }
  P.c.rig.body.rotation.x = 0; P.c.rig.body.position.y = 0; if (curMap && curMap.online) pvpRespawn();
  enemies.forEach(function (e) { if (e.state === 'chase' || e.state === 'attack') e.state = 'return'; }); saveGame();
});

/* ---------- first launch: enter character name ---------- */
var NAME_ERR = 'TIST: Special character is not allew in game name';
var HAIR_STYLES = ['Short', 'Spiky', 'Long', 'Ponytail', 'Buzz cut', 'Mohawk', 'Bun'], HAIR_EXCLUSIVE = [null, 'Afro', 'Pompadour', 'Twin Tails', 'Topknot'];   // index 7 (Emo) removed from the card list   // exclusive styles are only available with a Change Hairstyle Card
var HAIR_COLORS = [0x2a1a10, 0x6b3a1a, 0xc8a050, 0xf0e070, 0xe8e8e8, 0x111111, 0xd03030, 0x2f6fd0, 0x9b3fd0, 0xff7ab8];
var DRESS_COLORS = [0x2f6fd0, 0xd03030, 0x2fa04a, 0xf0c020, 0x9b3fd0, 0xff7ab8, 0xf2f2f2, 0x222222, 0xe07a20, 0x1ab8c8];
var PANTS_COLORS = [0x353a48, 0x111111, 0x2a4a8a, 0x5a3a22, 0x3f6a3a, 0x7a1f1f, 0xd8d8d8, 0x6a4a9a, 0xc8a050, 0x1a6a7a];
var crv = null;   // creation-screen 3D preview (own renderer + scene)
function initCreatorPreview() {
  if (crv) { crv.fit(); return; }
  try {
    var cv = $('cr-canvas'), rd = new THREE.WebGLRenderer({ canvas: cv, antialias: true, alpha: true });
    var sc = new THREE.Scene(), cam = new THREE.PerspectiveCamera(30, 1, 0.1, 50);
    sc.add(new THREE.AmbientLight(0xffffff, 0.75)); var dl = new THREE.DirectionalLight(0xffffff, 0.9); dl.position.set(2, 4, 5); sc.add(dl);
    var hm = makeHumanoid({ hairStyles: true, scale: 1, skin: 0xf0c8a0, shirt: 0x2f6fd0, pants: 0x353a48, hair: 0x2a1a10, pads: true, padColor: 0x8a97a6, boots: 0x3a2a1a });
    setWeapon({ rig: hm.rig }, 'sword', 0x9b7653); sc.add(hm.root);
    crv = { rd: rd, sc: sc, cam: cam, rig: hm.rig, root: hm.root, ry: 0.5, drag: null, run: false };
    crv.fit = function () {
      var w = cv.clientWidth || 140, hh = cv.clientHeight || 300; rd.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2)); rd.setSize(w, hh, false);
      cam.aspect = w / hh; cam.fov = cam.aspect < 0.6 ? 38 : 30; cam.updateProjectionMatrix(); cam.position.set(0, 1.0, 6.2); cam.lookAt(0, 0.95, 0);
    };
    crv.fit();
    cv.addEventListener('pointerdown', function (e) { crv.drag = e.clientX; try { cv.setPointerCapture(e.pointerId); } catch (x) {} });
    cv.addEventListener('pointermove', function (e) { if (crv.drag !== null) { crv.ry += (e.clientX - crv.drag) * 0.012; crv.drag = e.clientX; } });
    cv.addEventListener('pointerup', function () { crv.drag = null; });
    cv.addEventListener('pointercancel', function () { crv.drag = null; });
    window.addEventListener('resize', function () { if (crv.run) crv.fit(); });
  } catch (e) { crv = null; }
}
function creatorLoop() {
  if (!crv || !crv.run) return;
  if (crv.drag === null) crv.ry += 0.012;
  crv.root.rotation.y = crv.ry; try { crv.rd.render(crv.sc, crv.cam); } catch (e) {}
  requestAnimationFrame(creatorLoop);
}
function previewLook() { applyLook(); applyEquipVisuals(); if (crv) applyLook(crv.rig); }
function buildCreator() {
  var L = P.look;
  function swatches(id, list, key) {
    var box = $(id); box.innerHTML = '';
    list.forEach(function (col) {
      var i = document.createElement('i'); i.style.background = '#' + ('000000' + col.toString(16)).slice(-6);
      if (L[key] === col) i.className = 'on';
      i.addEventListener('click', function () { L[key] = col; Array.prototype.forEach.call(box.children, function (x) { x.className = ''; }); i.className = 'on'; previewLook(); });
      box.appendChild(i);
    });
  }
  swatches('sw-hair', HAIR_COLORS, 'hair'); swatches('sw-shirt', DRESS_COLORS, 'shirt'); swatches('sw-pants', PANTS_COLORS, 'pants');
  var sb = $('cr-sex').querySelectorAll('button');
  Array.prototype.forEach.call(sb, function (b) {
    b.className = b.getAttribute('data-sex') === L.sex ? 'on' : '';
    b.onclick = function () { L.sex = b.getAttribute('data-sex'); Array.prototype.forEach.call(sb, function (x) { x.className = x === b ? 'on' : ''; }); previewLook(); };
  });
  var st = $('cr-style'); st.innerHTML = '';
  HAIR_STYLES.forEach(function (nm, idx) {
    var b = document.createElement('button'); b.textContent = nm; b.className = L.style === idx ? 'on' : '';
    b.onclick = function () { L.style = idx; Array.prototype.forEach.call(st.children, function (x) { x.className = x === b ? 'on' : ''; }); previewLook(); };
    st.appendChild(b);
  });
  previewLook();
}
function openNameScreen() {
  ui.open = 'name'; $('name-screen').style.display = 'flex'; var inp = $('name-input'); inp.value = ''; $('name-err').textContent = '';
  initCreatorPreview(); buildCreator();
  if (crv) { crv.run = true; crv.fit(); creatorLoop(); }
}
function cleanNameInput() {
  var inp = $('name-input'), raw = inp.value, v = raw.replace(/[^A-Za-z0-9]/g, '');
  if (v !== raw) { inp.value = v; $('name-err').textContent = NAME_ERR; clearTimeout(cleanNameInput.t); cleanNameInput.t = setTimeout(function () { if ($('name-err').textContent === NAME_ERR) $('name-err').textContent = ''; }, 3500); }
}
$('name-input').addEventListener('input', cleanNameInput);
function confirmName() {
  var raw = $('name-input').value, v = raw.replace(/[^A-Za-z0-9]/g, '').slice(0, 14);
  if (v !== raw.trim() && raw.length) { $('name-input').value = v; $('name-err').textContent = NAME_ERR; return; }
  if (v.length < 2) { $('name-err').textContent = 'Name must be 2-14 characters.'; return; }
  P.name = v; P.named = true; P.c.name = v; refreshPlayerTag(true);
  $('name-screen').style.display = 'none'; ui.open = null; if (crv) crv.run = false; saveGame(); sfx('level');
  log('Welcome, ' + v + '! Talk to Elder Rowan (!) to begin.', '#ffe066');
}
$('name-go').addEventListener('click', confirmName);
$('name-input').addEventListener('keydown', function (e) { if (e.key === 'Enter') { e.preventDefault(); try { $('name-input').blur(); } catch (x) {} } });   // Enter does NOT create the hero; only START ADVENTURE does

/* ---------- character stats popup (tap the player frame) ---------- */
function critRoom() { var need = Math.ceil((90 - 12 - gearSum('crit')) / SP_CRIT - 1e-9); return Math.max(0, need - P.alloc.crit); }
function openStats() { openPanel('Character Stats', renderStats); }
function renderStats(body) {
  var g = h('div', 'grid2', null, body);
  [['Name', P.name], ['Level', P.lvl], ['Rebirth', P.reb + ' / 50'], ['Gold', P.gold], ['XP', P.xp + ' / ' + (P.lvl >= MAX_LVL ? 'MAX' : xpNext(P.lvl))],
   ['HP', Math.floor(P.hp) + ' / ' + maxHp()], ['MP', Math.floor(P.mp) + ' / ' + maxMp()], ['Attack', Math.round(atkVal())], ['Defense', Math.round(defVal() * 10) / 10],
   ['HP regen', '+' + (Math.round(gearSum('hpr') * 10) / 10) + '/s (gear)'], ['MP regen', '+' + (Math.round((2 + maxMp() * 0.012 + gearSum('mpr')) * 10) / 10) + '/s'],
   ['Move speed', '+' + Math.round((moveMul() - 1) * 100) + '%'], ['Crit chance', Math.round(critChance() * 1000) / 10 + '%'], ['Crit damage', Math.round(critMul() * 100) + '%'], ['Damage absorb', Math.round(absorbPct() * 10) / 10 + '%'], ['PK Penalty', (P.pkp || 0).toFixed(1) + '%  (death drop chance)'], ['EXP cutoff', 'mobs ' + XP_CUTOFF + '+ lvls below you']
  ].forEach(function (r) { h('div', null, r[0] + ': ' + r[1], g); });
  h('div', 'sec', 'Stat points: ' + P.sp + '   (+' + SP_PER_LEVEL + ' every level)', body);
  [['hp', 'HP', '+' + SP_HP + ' max HP per point'], ['dmg', 'Damage', '+' + SP_DMG + ' attack per point'], ['def', 'Defence', '+' + SP_DEF + ' defence per point'], ['crit', 'Crit Rate', '+' + SP_CRIT + '% crit chance per point (max 90% total)'], ['cdmg', 'Crit Damage', '+' + SP_CDMG + '% crit damage per point']].forEach(function (st) {
    var r = h('div', 'item', null, body), nm = h('div', 'nm', null, r);
    h('div', null, st[1] + '   (points: ' + P.alloc[st[0]] + ')', nm); h('div', 'ds', st[2], nm);
    var room = st[0] === 'crit' ? critRoom() : 1e9;                       // Crit Rate stops taking points at 90%
    if (st[0] === 'crit' && room <= 0) h('div', 'ds', 'MAX - crit rate reached 90%', nm);
    [1, 5, 25].forEach(function (n) { btn(r, '+' + n, function () { var k = Math.min(n, P.sp, room); if (k <= 0) return; P.alloc[st[0]] += k; P.sp -= k; if (st[0] === 'hp') P.hp += SP_HP * k; saveGame(); rerender(); }, { disabled: P.sp <= 0 || room <= 0, cls: 'good' }); });
  });
}
tapBtn('player-frame', function () { openStats(); });
(function () { var b = h('div', null, null, $('player-frame')); b.id = 'p-sp'; b.textContent = ''; })();


/* ---------- Upgrade NPC (Smith Brannock): +1 ... +80 for weapon, items and wings ---------- */
var upTab = 'weapon';
function pctTxt(r) { return (Math.round(r * 1000) / 10) + '%'; }
var UP_TABS = [['weapon', 'Sword', ['weapon']], ['item', 'Item', ['helmet', 'armor', 'pants', 'gloves']], ['wings', 'Wings', ['wings']], ['acc', 'Jewelry', ['necklace', 'ringL', 'ringR']]];
function openUpgrade(npc) { openPanel(npc.name + ' - Upgrade', renderUpgrade); }
function doUpgrade(id) {
  var it = ITEMS[id], l = upgLvl(id), mat = upgMat(it.slot), g = upgGold(it, l), n = upgStones(l);
  if (l >= MAX_UPG) return;
  if (P.gold < g) { log('Not enough gold.', '#ff9a9a'); return; }
  if ((P.inv[mat] || 0) < n) { log('Not enough ' + ITEMS[mat].name + '.', '#ff9a9a'); return; }
  P.gold -= g; P.inv[mat] -= n;
  if (Math.random() >= upgRate(l + 1)) {            // failed: materials and gold are lost, the level stays
    sfx('ui'); if (P.equip[it.slot] === id) burst({ x: P.pos.x, y: 1, z: P.pos.z }, 0x666666, 10, 3, 2);
    spawnText('FAILED', P.pos, 'dmg', 2.4); log('Upgrade to +' + (l + 1) + ' FAILED (' + pctTxt(upgRate(l + 1)) + ' chance). The level stays +' + l + '.', '#ff7a7a');
    saveGame(); rerender(); return;
  }
  P.upg[id] = l + 1;
  var col = upgColor(l + 1, performance.now() / 1000);
  if (P.equip[it.slot] === id) {
    applyEquipVisuals(); ringFx(P.pos.x, P.pos.z, 2.4, col, 0.7); pillarFx(P.pos.x, P.pos.z, col);
    burst({ x: P.pos.x, y: 1, z: P.pos.z }, col, 16, 4, 3);
  }
  sfx('level'); spawnText(itemName(id), P.pos, 'xp', 2.6);
  log('Upgraded ' + it.name + ' to +' + (l + 1) + '!' + ((l + 1) % 10 === 0 ? '  The glow changes colour!' : ''), '#ffd54f');
  saveGame(); rerender();
}
function renderUpgrade(body) {
  h('div', 'sec', 'Gold: ' + P.gold + '    |    ' + MATERIAL_IDS.map(function (m) { return ITEMS[m].name + ' x' + (P.inv[m] || 0); }).join('  ·  '), body);
  h('div', 'ds', 'Each + adds 5% to the item\'s stats and makes it glow brighter (colour changes every +10). Max +' + MAX_UPG + '. Success rate: +1-10 100%, +11-20 80%, +21-25 70%, +26-30 60%, +31-35 55%, +36-40 50%, +41-45 40%, +46-50 30%, +51-55 20%, +56-60 10%, +61-65 5%, +66-70 2%, +71-75 1%, +76-80 0.3%. A failed attempt keeps the level but uses the materials.', body);
  var tabs = h('div', 'tabs', null, body);
  UP_TABS.forEach(function (t) { var b = h('button', upTab === t[0] ? 'act' : null, t[1], tabs); b.addEventListener('click', function () { upTab = t[0]; rerender(); }); });
  var slots = UP_TABS.filter(function (t) { return t[0] === upTab; })[0][2], any = false;
  var ids = P.owned.filter(function (id) { return ITEMS[id] && slots.indexOf(ITEMS[id].slot) >= 0; });
  ids.sort(function (a, b) { return (P.equip[ITEMS[b].slot] === b ? 1 : 0) - (P.equip[ITEMS[a].slot] === a ? 1 : 0); });
  ids.forEach(function (id) {
    any = true; var it = ITEMS[id], l = upgLvl(id), mat = upgMat(it.slot);
    var r = h('div', 'item', null, body); iconEl(r, it.icon, it.emoji || SLOT_INFO[it.slot].icon, '', id);
    var nm = h('div', 'nm', null, r);
    h('div', it.rare ? 'rare' : null, (it.rare ? '★ ' : '') + itemName(id), nm);
    if (P.equip[it.slot] === id) h('span', 'tag eq', 'EQUIPPED', nm);
    if (l >= MAX_UPG) { h('div', 'ds', 'MAX +' + MAX_UPG + '  (stats x' + upgMul(id).toFixed(2) + ')', nm); return; }
    var g = upgGold(it, l), n = upgStones(l), ok = P.gold >= g && (P.inv[mat] || 0) >= n;
    h('div', 'ds', 'Success ' + pctTxt(upgRate(l + 1)) + '  ·  Now x' + upgMul(id).toFixed(2) + ' → x' + (upgMul(id) + UPG_BONUS).toFixed(2) + '  ·  ' + g + ' G + ' + n + ' ' + ITEMS[mat].name, nm);
    btn(r, '+' + (l + 1), function () { doUpgrade(id); }, { disabled: !ok, cls: ok ? 'good' : '' });
  });
  if (!any) h('div', 'ds', 'You have nothing of this kind to upgrade.', body);
  h('div', 'sec', 'Materials shop', body);
  MATERIAL_IDS.forEach(function (m) {
    var it = ITEMS[m], r = h('div', 'item', null, body); iconEl(r, it.icon, '◆');
    var nm = h('div', 'nm', null, r); h('div', null, it.name + '  (owned ' + (P.inv[m] || 0) + ')', nm); h('div', 'ds', it.desc + '  ·  ' + it.price + ' G', nm);
    btn(r, 'Buy', function () { if (P.gold < it.price) return; P.gold -= it.price; giveItem(m, 1); sfx('coin'); saveGame(); rerender(); }, { disabled: P.gold < it.price });
  });
}

/* ---------- side navigation + Redeem Code + Support popups ---------- */
function openNav() { $('sidenav').classList.add('open'); $('nav-back').style.display = 'block'; releaseInputs(); }
function closeNav() { $('sidenav').classList.remove('open'); $('nav-back').style.display = 'none'; }

var redeemMsg = '', redeemBusy = false;
function openRedeem() { redeemMsg = ''; openPanel('Redeem Code', renderRedeem); }
function doRedeem(raw) {                                     // codes are stored in Firebase (codes/{code} = { gold, xp, diamonds, enabled, expires })
  if (redeemBusy) return;
  var key = cloudCodeKey(raw);
  if (!key) { redeemMsg = 'Enter a code first.'; rerender(); return; }
  if (P.codes[key] || P.codes[String(raw || '').trim().toLowerCase()]) { redeemMsg = 'You already redeemed this code.'; rerender(); return; }
  if (!CLOUD.user) { redeemMsg = 'Log in to your account to redeem codes (they are checked online).'; rerender(); return; }
  redeemBusy = true; redeemMsg = 'Checking code...'; rerender();
  cloudGetCode(key).then(function (r) {
    redeemBusy = false;
    if (!r || r.enabled === false || r.enabled === 'false' || (+r.expires && Date.now() > +r.expires)) { redeemMsg = (r && +r.expires && Date.now() > +r.expires) ? 'This code has expired.' : 'Invalid code.'; rerender(); return; }
    if (P.codes[key]) { redeemMsg = 'You already redeemed this code.'; rerender(); return; }
    var gold = Math.max(0, Math.min(1e12, +r.gold || 0)), dia = Math.max(0, Math.min(1e9, +r.diamonds || 0)), xp = Math.max(0, Math.min(1e10, +(r.xp || r.exp) || 0));
    var its = [];   // items: "gm_necklace,gm_ring_l" or {"gm_necklace":1,"burr_stone":5}
    if (r.items) {
      var lst = typeof r.items === 'string' ? r.items.split(',').map(function (x) { var q = x.trim().split(':'); return [q[0], +q[1] || 1]; }) : Object.keys(r.items).map(function (k) { return [k, +r.items[k] || 1]; });
      lst.forEach(function (q) { var id = q[0], it = ITEMS[id]; if (it && (it.type === 'gear' || MATERIAL_IDS.indexOf(id) >= 0 || id === 'godzilla_fragment' || id === 'golden_key')) its.push([id, Math.max(1, Math.min(it.type === 'gear' ? 5 : 100000, q[1] | 0))]); });
    }
    if (!gold && !dia && !xp && !its.length) { redeemMsg = 'Invalid code.'; rerender(); return; }
    if (r.single === true || r.single === 'true') {              // sold / one-person code: claim it first (the first account wins)
      if (r.used) { redeemMsg = 'This code was already used.'; rerender(); return; }
      redeemBusy = true; redeemMsg = 'Claiming code...'; rerender();
      cloudClaimCode(key).then(function (ok) {
        redeemBusy = false;
        if (!ok) { redeemMsg = 'This code was already used.'; rerender(); return; }
        grantCode(key, r, gold, dia, xp, its);
      }).catch(function () { redeemBusy = false; redeemMsg = 'Could not claim the code. Check your internet connection and try again.'; rerender(); });
      return;
    }
    grantCode(key, r, gold, dia, xp, its);
  }).catch(function () { redeemBusy = false; redeemMsg = 'Could not check the code. Check your internet connection and try again.'; rerender(); });
}
function grantCode(key, r, gold, dia, xp, its) {
  var got = [];
  {
    P.codes[key] = true;
    if (gold) { P.gold += gold; got.push(gold.toLocaleString() + ' Gold'); }
    if (dia) { P.diamonds += dia; got.push(dia.toLocaleString() + ' Diamonds'); }
    if (xp) { if (P.lvl >= MAX_LVL) got.push(xp.toLocaleString() + ' EXP (not applied: max level)'); else { gainXp(xp); got.push(xp.toLocaleString() + ' EXP'); } }
    its.forEach(function (q) { if (ITEMS[q[0]].type === 'gear') { for (var i = 0; i < q[1]; i++) giveDrop(q[0]); } else giveItem(q[0], q[1]); got.push((q[1] > 1 ? q[1] + 'x ' : '') + ITEMS[q[0]].name); });
    redeemMsg = 'Code redeemed! You got ' + got.join(' + ') + '.'; log(redeemMsg, '#ffe066'); sfx('coin'); saveGame(); rerender();
  }
}
function renderRedeem(body) {
  h('div', 'ds', 'Enter a code to get rewards. Each code can be used once.', body);
  var inp = h('input', null, null, body); inp.id = 'redeem-in'; inp.type = 'text'; inp.placeholder = 'Enter code'; inp.autocomplete = 'off'; inp.autocapitalize = 'off'; inp.spellcheck = false;
  var row = h('div', 'setrow', null, body);
  btn(row, 'REDEEM', function () { doRedeem(inp.value); }, { cls: 'good' });
  if (redeemMsg) h('div', 'ds', redeemMsg, body);
  h('div', 'sec', 'Your gold: ' + P.gold.toLocaleString() + '  ·  Level ' + P.lvl, body);
}
var QR_URL = 'https://blogger.googleusercontent.com/img/b/R29vZ2xl/AVvXsEgzsQpH4IJNOiMZp1c-T8ZytpxsBFlFB-e3l-wm_gmG3cQAz6RRwVAI6qa6OMe9TeVnHWhAMj9bNWAl0UkmlCcsm8s8bVXoXmQbBTMmp22Rau3Mw4LunXBd0DDHOI-dMJFl_ZumjlkiYUw4lV5K3EWMuWGh1pvmg8HXhBAJRiHiGcHYnUZfs7Tfl9P_45vl/s1339/GCash_QR_Code%20%281%29.png';
function openSupport() { openPanel('Support Game', renderSupport); }
var SUPPORT_EMAIL = 'koruruz90@gmail.com';
var PAY_METHODS = [];   // e.g. [['GCash', '09XX XXX XXXX (Juan D.)'], ['Maya', '09XX XXX XXXX']] - shown with Copy buttons in the Support popup
var CRYPTOS = [['Dogecoin', 'DNuduyH3E8WYmEZEjhZt7jCLJzjgDs7Dde'], ['Tron', 'TFsR9Vzj38HksvAuzJ9LAR2aqrRZeEvjpD'], ['Toncoin (Gram)', 'UQACnBO8SbJJ1z1NAOypTpcqfxJ1P2rdxx-InkUHe8ZUd3vJ'],
  ['Litecoin', 'MF3ERrX6GBDXz4wbwqCGTnnSgDvvrNRvQr'], ['Ripple (XRP)', 'rhVuiY5jeUnaDKbWYPh18j2kpGhnrYQ8nJ'], ['Solana', '8XTXAWR4BNHwLRJMLEHZHvmNs1j9RNJ7dX8YSMKNg2uD']];
var DONATE_RATES = [['$1', '2M Gold', '100'], ['$3', '10M Gold', '500'], ['$5', '20M Gold', '1,000'], ['$10', '50M Gold', '2,500'], ['$20', '120M Gold', '5,500'], ['$50', '600M Gold', '15,000']];
function copyText(txt, done) {
  function fallback() { try { var t = document.createElement('textarea'); t.value = txt; t.style.cssText = 'position:fixed;left:-999px;top:0'; document.body.appendChild(t); t.select(); document.execCommand('copy'); document.body.removeChild(t); done(true); } catch (e) { done(false); } }
  if (navigator.clipboard && navigator.clipboard.writeText) navigator.clipboard.writeText(txt).then(function () { done(true); }, fallback); else fallback();
}
function renderSupport(body) {
  h('div', 'sec', 'Support the Game', body);
  var intro = h('ul', 'supul', null, body);
  h('li', null, 'Supporting the game is completely optional. You can keep playing and enjoy every feature without sending any support.', intro);
  h('li', null, 'Every contribution helps us keep the game running and add new content - thank you!', intro);
  h('div', 'sec', 'Instant payment (QR code)', body);
  h('div', 'qrnote', 'Scan the QR code below with your payment app, or download it.', body);
  var im = h('img', 'qrimg', null, body); im.src = QR_URL; im.alt = 'Support QR code'; im.draggable = false;
  var n = h('div', 'qrnote', null, body);
  var a = document.createElement('a'); a.href = QR_URL; a.target = '_blank'; a.rel = 'noopener'; a.setAttribute('download', 'Support_QR.png'); a.textContent = 'Download QR code'; n.appendChild(a);
  h('div', 'sec', 'Cryptocurrency', body);
  h('div', 'qrnote', 'You may also send payment to any of the following wallet addresses:', body);
  CRYPTOS.forEach(function (c) {
    var r = h('div', 'cryrow', null, body), t = h('div', 'cryname', c[0], r), ad = h('div', 'cryaddr', c[1], r);
    var bt = h('button', 'crybtn', 'Copy', r);
    bt.addEventListener('click', function () { copyText(c[1], function (ok) { bt.textContent = ok ? 'Copied!' : 'Copy failed'; setTimeout(function () { bt.textContent = 'Copy'; }, 1600); if (ok) log(c[0] + ' address copied to clipboard.', '#9ff59f'); }); });
  });
  h('div', 'sec', 'Buy with a redeem code (GCash / Maya / crypto)', body);
  var st = h('ol', 'supul', null, body);
  h('li', null, 'Pick a pack below and send the payment (QR code, ' + (PAY_METHODS.length ? PAY_METHODS.map(function (m) { return m[0]; }).join(' / ') + ', ' : '') + 'or crypto above).', st);
  h('li', null, 'Tap "Send order email" - it fills in your hero and account for you. Attach your payment proof and send.', st);
  h('li', null, 'The admin replies with a one-time code. Open Menu > Redeem Code and type it in. Gold, diamonds and items go straight to your hero.', st);
  PAY_METHODS.forEach(function (m) {
    var r2 = h('div', 'cryrow', null, body); h('div', 'cryname', m[0], r2); h('div', 'cryaddr', m[1], r2);
    var b2 = h('button', 'crybtn', 'Copy', r2); b2.addEventListener('click', function () { copyText(m[1], function (ok) { b2.textContent = ok ? 'Copied!' : 'Copy failed'; setTimeout(function () { b2.textContent = 'Copy'; }, 1600); }); });
  });
  var pk = h('select', null, null, body); pk.style.cssText = 'width:100%;padding:8px;border-radius:8px;border:1px solid #888;background:#111a33;color:#fff;font-size:13px;margin:6px 0';
  DONATE_RATES.forEach(function (rt, i) { var o3 = document.createElement('option'); o3.value = i; o3.textContent = rt[0] + '  =  ' + rt[1] + '  +  ' + rt[2] + ' Diamonds'; pk.appendChild(o3); });
  btn(body, 'Send order email', function () {
    var rt = DONATE_RATES[+pk.value || 0], acct = (typeof CLOUD !== 'undefined' && CLOUD.user && CLOUD.user.email) || '(not logged in)';
    var txt = 'Pack: ' + rt[0] + ' = ' + rt[1] + ' + ' + rt[2] + ' Diamonds\nHero name: ' + P.name + '\nLevel: ' + P.lvl + '\nGame account email: ' + acct + '\nPayment method: \nPayment reference / proof: (attach screenshot)';
    location.href = 'mailto:' + SUPPORT_EMAIL + '?subject=' + encodeURIComponent('RanCraft order ' + rt[0]) + '&body=' + encodeURIComponent(txt);
  }, { cls: 'good' });
  h('div', 'sec', 'After you pay', body);
  var ap = h('div', 'qrnote', null, body); ap.style.textAlign = 'left';
  ap.appendChild(document.createTextNode('Once your payment is sent, email the game admin at '));
  var ml = document.createElement('a'); ml.href = 'mailto:' + SUPPORT_EMAIL + '?subject=RanCraft%20support%20payment'; ml.textContent = SUPPORT_EMAIL; ap.appendChild(ml);
  ap.appendChild(document.createTextNode(' with your proof of payment, and you will receive your redeem code.'));
  h('div', 'sec', 'Donation rewards', body);
  var tb = h('table', 'ratetbl', null, body), hd = h('tr', null, null, tb);
  ['Donation (USD)', 'Gold', 'Diamonds'].forEach(function (x) { h('th', null, x, hd); });
  DONATE_RATES.forEach(function (rt) { var tr = h('tr', null, null, tb); h('td', null, rt[0], tr); h('td', null, rt[1], tr); h('td', null, rt[2] + ' \uD83D\uDC8E', tr); });
}

/* ---------- Rebirth (max 50): needs max level + gold; resets level to 1, strips gear that needs a higher level, sends you to the first map ---------- */
var MAX_REBIRTH = 50, rebConfirm = false;
function rebirthCost(n) { return n <= 5 ? 1000000 : n <= 10 ? 3000000 : n <= 15 ? 6000000 : n <= 25 ? 10000000 : 15000000; }
function openRebirth(npc) { rebConfirm = false; openPanel(npc.name + ' - Rebirth', renderRebirth); }
function doRebirth() {
  var n = P.reb + 1, cost = rebirthCost(n);
  if (P.reb >= MAX_REBIRTH || P.lvl < MAX_LVL || P.gold < cost) return;
  P.gold -= cost; P.reb = n; P.lvl = 1; P.xp = 0;
  var removed = [];
  EQ_SLOTS.forEach(function (sl) { var id = P.equip[sl]; if (id && ITEMS[id] && (ITEMS[id].lvl || 1) > P.lvl) { removed.push(ITEMS[id].name); P.equip[sl] = (sl === 'weapon') ? 'weapon0' : null; } });
  dismount(); P.buffs.length = 0; P.shield = 0; P.hot = null; P.slowT = 0; P.poisonT = 0; P.target = null;
  applyEquipVisuals(); P.c.lvl = P.lvl; P.hp = maxHp(); P.mp = maxMp(); refreshPlayerTag(true);
  ringFx(P.pos.x, P.pos.z, 5, 0xffd54f, 0.9); pillarFx(P.pos.x, P.pos.z, 0xffd54f); sfx('level');
  loadMap(MAPS[0].id, true);
  log('REBIRTH ' + n + '! You are level 1 again in ' + MAPS[0].name + '.' + (removed.length ? ' Unequipped: ' + removed.join(', ') + '.' : ''), '#ffd54f');
  saveGame(); closePanel();
}
function renderRebirth(body) {
  var n = P.reb + 1, maxed = P.reb >= MAX_REBIRTH;
  h('div', 'sec', 'Rebirth: ' + P.reb + ' / ' + MAX_REBIRTH, body);
  h('div', 'ds', 'On rebirth your level returns to 1 (EXP 0), gear that needs a higher level is unequipped (it stays in your bag), and you return to the first map\'s safe zone. Gold is spent; items, skills, stat points, upgrades and mounts are kept.', body);
  if (maxed) { h('div', 'sec', 'You reached the maximum rebirth.', body); return; }
  var cost = rebirthCost(n), okLv = P.lvl >= MAX_LVL, okG = P.gold >= cost;
  h('div', 'sec', 'Rebirth ' + n + ' requires:', body);
  h('div', null, (okLv ? '✔ ' : '✘ ') + 'Level ' + MAX_LVL + '  (you: ' + P.lvl + ')', body);
  h('div', null, (okG ? '✔ ' : '✘ ') + cost.toLocaleString() + ' Gold  (you: ' + P.gold.toLocaleString() + ')', body);
  var row = h('div', 'setrow', null, body);
  btn(row, rebConfirm ? 'TAP AGAIN TO CONFIRM' : 'REBIRTH', function () { if (!rebConfirm) { rebConfirm = true; rerender(); return; } doRebirth(); }, { disabled: !(okLv && okG), cls: 'good' });
  h('div', 'sec', 'Costs', body);
  h('div', 'ds', 'Rebirth 1-5: 1M · 6-10: 3M · 11-15: 6M · 16-25: 10M · 26-50: 15M gold (each also needs level ' + MAX_LVL + ')', body);
}

/* ---------- minimap popup: tap anywhere on the big map and the hero walks there ---------- */
var mapTimer = null;
/* walk the hero to a world position, stopping `stop` metres short of it (used by the map dropdowns and the quest tracker) */
function walkTo(x, z, stop) {
  if (P.dead) return false;
  var dx = P.pos.x - x, dz = P.pos.z - z, dd = Math.hypot(dx, dz);
  if (dd <= stop + 0.8) { log('You are already there.', '#9fe3ff'); return false; }
  x += dx / dd * stop; z += dz / dd * stop;
  var lim = WORLD_R - 2, rr = Math.hypot(x, z); if (rr > lim) { x *= lim / rr; z *= lim / rr; }
  P.dest = { x: x, z: z }; P.destChk = 0; P.destX0 = P.pos.x; P.destZ0 = P.pos.z; sfx('ui'); return true;
}
function nearestEnemyOfType(type) {
  var best = null, bd = 1e9;
  enemies.forEach(function (e) { if (e.type !== type) return; var dd = Math.hypot(e.pos.x - P.pos.x, e.pos.z - P.pos.z) + (e.state === 'dead' ? 500 : 0); if (dd < bd) { bd = dd; best = e; } });
  return best;
}
function openMapPopup() {
  if (P.dead || ui.open) return;
  openPanel('Map - tap to move', function (body) {
    panelEl.classList.add('mapmode');                       // no scrolling in this popup
    var px = Math.max(170, Math.min(300, Math.min(window.innerHeight - 110, window.innerWidth - 40)));
    var cv = h('canvas', 'bigmap', null, body); cv.width = cv.height = px * 2; cv.style.width = cv.style.height = px + 'px';
    drawBigMap(cv);
    cv.addEventListener('click', function (e) {
      var r = cv.getBoundingClientRect(), qx = (e.clientX - r.left) / r.width * 2 - 1, qz = (e.clientY - r.top) / r.height * 2 - 1;
      var k = (WORLD_R - 2) / (1 - 0.04), wx = qx * k, wz = qz * k, d = Math.hypot(wx, wz), lim = WORLD_R - 2;
      if (d > lim) { wx *= lim / d; wz *= lim / d; }
      P.dest = { x: wx, z: wz }; P.destChk = 0; P.destX0 = P.pos.x; P.destZ0 = P.pos.z;
      sfx('ui'); closePanel(); log('Moving to the selected spot...', '#9fe3ff');
    });
    // floating dropdowns (right side, under the close button): pick a mob type or an NPC and the hero walks there
    var dd = h('div', 'mapdd', null, body);
    function mkSel(label, items, onPick) {
      var sel = document.createElement('select'); dd.appendChild(sel);
      var o0 = document.createElement('option'); o0.value = ''; o0.textContent = label + (items.length ? ' ▾' : ' (none)'); sel.appendChild(o0);
      items.forEach(function (it, i) { var o = document.createElement('option'); o.value = String(i); o.textContent = it.label; sel.appendChild(o); });
      sel.disabled = !items.length;
      sel.addEventListener('change', function () { var it = items[+sel.value]; if (!it) return; if (onPick(it)) closePanel(); else sel.value = ''; });
    }
    var seen = {}, mobs = []; enemies.forEach(function (e) { if (seen[e.type]) return; seen[e.type] = 1; mobs.push({ label: e.T.name + ' (Lv ' + e.T.lvl + ')', type: e.type }); });
    mkSel('Mobs', mobs, function (it) { var e = nearestEnemyOfType(it.type); if (!e) return false; log('Heading to ' + it.label + '...', '#9fe3ff'); walkTo(e.pos.x, e.pos.z, 3); return true; });
    var nseen = {}, nl = []; npcs.forEach(function (n) { if (nseen[n.name]) return; nseen[n.name] = 1; nl.push({ label: n.name, npc: n }); });
    mkSel('NPC', nl, function (it) { log('Heading to ' + it.label + '...', '#9fe3ff'); walkTo(it.npc.pos.x, it.npc.pos.z, 2.2); return true; });
    clearInterval(mapTimer); mapTimer = setInterval(function () { if (ui.open !== 'Map - tap to move') { clearInterval(mapTimer); return; } drawBigMap(cv); }, 400);
  });
}
/* tap the on-screen quest text: walk to the quest giver (new / finished quest) or to the nearest target mob */
$('tracker').addEventListener('click', function () {
  var q = currentQuest(); if (!q || P.dead) return;
  var s = P.quests[q.id];
  if (!s || s.state === 'ready') {
    if (npcQuest && npcs.indexOf(npcQuest) >= 0) { log('Heading to Elder Rowan...', '#9fe3ff'); walkTo(npcQuest.pos.x, npcQuest.pos.z, 2.2); }
    else { log('Elder Rowan is in Moviex Plains - use the portal or World Map to travel there.', '#ffd54f'); if (portals[0]) walkTo(portals[0].x, portals[0].z, 0.5); }
    return;
  }
  var e = nearestEnemyOfType(q.target);
  if (e) { log('Heading to ' + ENEMY_TYPES[q.target].name + '...', '#9fe3ff'); walkTo(e.pos.x, e.pos.z, 3); return; }
  var tm = null; MAPS.forEach(function (m) { if (!tm && m.enemies.indexOf(q.target) >= 0) tm = m; });
  log(ENEMY_TYPES[q.target].name + ' live in ' + (tm ? tm.name : 'another map') + ' - use the portal or World Map to travel there.', '#ffd54f');
  if (portals[0]) walkTo(portals[0].x, portals[0].z, 0.5);
});
function drawBigMap(cv) {
  var W = cv.width, c = cv.getContext('2d'), k = (W / 2) * 0.96 / (WORLD_R - 2);
  function T(x, z) { return { x: W / 2 + x * k, y: W / 2 + z * k }; }
  c.clearRect(0, 0, W, W); c.save(); c.beginPath(); c.arc(W / 2, W / 2, W / 2 - 2, 0, TAU); c.clip();
  c.fillStyle = curMap ? '#' + ('000000' + new THREE.Color(curMap.theme.mount).getHexString()).slice(-6) : '#244'; c.fillRect(0, 0, W, W);
  c.fillStyle = 'rgba(0,0,0,.25)'; c.fillRect(0, 0, W, W);
  var o = T(0, 0); c.fillStyle = 'rgba(190,180,150,.75)'; c.beginPath(); c.arc(o.x, o.y, (curMap ? curMap.safeR : 16) * k, 0, TAU); c.fill();
  function dot(x, z, col, r) { var p = T(x, z); c.fillStyle = col; c.beginPath(); c.arc(p.x, p.y, r, 0, TAU); c.fill(); }
  enemies.forEach(function (e) { if (e.state !== 'dead' && e.T.boss) dot(e.pos.x, e.pos.z, '#ff2a2a', 9); });      // only bosses are red dots
  ais.forEach(function (a) { if (a.state !== 'dead') dot(a.pos.x, a.pos.z, '#c08aff', 4); });
  npcs.forEach(function (n) { dot(n.pos.x, n.pos.z, '#ffe066', 6); });
  portals.forEach(function (pt) { var p = T(pt.x, pt.z); c.fillStyle = '#66ccff'; c.fillRect(p.x - 7, p.y - 7, 14, 14); });
  if (P.dest) { var d = T(P.dest.x, P.dest.z); c.strokeStyle = '#7dff9a'; c.lineWidth = 3; c.beginPath(); c.arc(d.x, d.y, 9, 0, TAU); c.stroke(); }
  dot(P.pos.x, P.pos.z, '#ffffff', 7); c.restore();
  c.strokeStyle = 'rgba(255,255,255,.6)'; c.lineWidth = 4; c.beginPath(); c.arc(W / 2, W / 2, W / 2 - 2, 0, TAU); c.stroke();
}
mini.addEventListener('click', openMapPopup);

/* ---------- They I See Tea (TIST): 1000-gold prize roulette ---------- */
var ROULETTE_COST = 1000, spinning = false;
var ROULETTE = [
  { id: 'hp_potion', n: 2, p: 22, label: '2 HP Potions' }, { id: 'mp_potion', n: 2, p: 22, label: '2 MP Potions' },
  { id: 'hp_potion', n: 5, p: 12, label: '5 HP Potions' }, { id: 'luxury_stone', n: 2, p: 14.5, label: 'Luxury Stone x2' },
  { id: 'burr_stone', n: 2, p: 14.5, label: 'Burr Stone x2' }, { id: 'feather', n: 2, p: 13.7, label: 'Feather x2' },
  { id: 'santa_weapon', n: 1, p: 1.0, label: 'Crimson Eye Blade' }, { id: 'godset_wings', n: 1, p: 0.3, label: 'Godzilla Wings', jackpot: true }];
function rollRoulette() { var r = Math.random() * 100, a = 0; for (var i = 0; i < ROULETTE.length; i++) { a += ROULETTE[i].p; if (r < a) return i; } return 0; }
function openTist(npc) { spinning = false; openPanel(npc.name, renderTist); }
function renderTist(body) {
  var dlg = h('div', 'dlg', null, body);
  h('p', null, 'They I See Tea (TIST) is the guardian of this realm: game security, patches, updates and much more. Fancy a shot at the legendary Godzilla Wings? Spin the roulette below and try your luck!', dlg);
  h('div', 'sec', 'Prizes', body);
  var grid = h('div', 'rgrid', null, body), cells = [];
  ROULETTE.forEach(function (rw, i) {
    var cell = h('div', 'rcell' + (rw.jackpot ? ' jack' : ''), null, grid); cells.push(cell);
    iconEl(cell, ITEMS[rw.id].icon, '?');
    h('div', 'rn', rw.label, cell); h('div', 'rp', (rw.jackpot ? 'JACKPOT ' : '') + rw.p + '%', cell);
  });
  var res = h('div', 'rres', 'Cost per spin: ' + ROULETTE_COST.toLocaleString() + ' gold', body);
  var gl = h('div', 'ds', 'Your gold: ' + P.gold.toLocaleString(), body);
  var row = h('div', 'setrow', null, body), sp;
  sp = btn(row, 'SPIN (' + ROULETTE_COST + ' G)', function () {
    if (spinning || P.gold < ROULETTE_COST) return;
    spinning = true; sp.disabled = true; P.gold -= ROULETTE_COST; gl.textContent = 'Your gold: ' + P.gold.toLocaleString();
    var t = rollRoulette(), rw = ROULETTE[t], steps = 24 + t + 1, i = 0;
    if (rw.id === 'godset_wings' || rw.id === 'santa_weapon') giveDrop(rw.id); else giveItem(rw.id, rw.n);   // prize is granted immediately
    saveGame(); res.textContent = 'Spinning...'; res.className = 'rres';
    (function tick() {
      cells.forEach(function (c2) { c2.classList.remove('on'); }); cells[i % 8].classList.add('on'); sfx('ui');
      if (i >= steps - 1) {
        spinning = false; sp.disabled = P.gold < ROULETTE_COST; res.textContent = (rw.jackpot ? 'JACKPOT! ' : 'You won: ') + rw.label + '!'; res.className = 'rres win' + (rw.jackpot ? ' jp' : '');
        cells[t].classList.add('won'); sfx('level'); log('TIST Roulette: ' + rw.label + '!', rw.jackpot ? '#ffd54f' : '#9fe3ff'); return;
      }
      var delay = 45 + 260 * Math.pow(i / steps, 3); i++; setTimeout(tick, delay);
    })();
  }, { disabled: P.gold < ROULETTE_COST, cls: 'good' });
}

/* ---------- The Game Master: asset management + tax collector ---------- */
function openGM(npc) { openPanel(npc.name, function (body) {
  var d = h('div', 'dlg', null, body);
  h('p', null, 'The Game Master handles the realm\'s asset management and collects the taxes. Nothing moves in this land without a small cut.', d);
  h('div', 'sec', 'Tax rules', body);
  h('div', 'ds', '• Buying from NPC shops: price + 12% tax (e.g. a 2,000 G sword costs 2,240 G).', body);
  h('div', 'ds', '• Selling to NPC shops: selling price - 12% tax.', body);
  h('div', 'ds', '• Staying inside a safe zone: ' + SAFE_TAX + ' gold every ' + SAFE_TAX_EVERY + ' seconds (not in the Blood Arena).', body);
  h('div', 'sec', 'Your tax record', body);
  h('div', null, 'Total tax paid: ' + P.taxPaid.toLocaleString() + ' G', body);
}); }

/* ---------- buff HUD: skill icon + vertical time bar ---------- */
var buffEls = {};
function buffIcon(name) { for (var id in SKILLS) if (SKILLS[id].name === name) return SKILLS[id]; return null; }
function renderBuffs() {
  var host = $('buffs'), list = activeBuffs();
  for (var k in buffEls) if (!list.some(function (b) { return b.key === k; })) { host.removeChild(buffEls[k].el); delete buffEls[k]; }
  list.forEach(function (b) {
    var e = buffEls[b.key];
    if (!e) {
      var el = h('div', 'bf', null, host), ic = h('div', 'bfi', null, el), sk = buffIcon(b.name);
      if (sk) iconEl(ic, sk.icon, sk.emoji); else ic.textContent = '✨';
      var bar = h('div', 'bfbar', null, el), fill = h('div', 'bfill', null, bar), tx = h('div', 'bft', null, ic);
      e = buffEls[b.key] = { el: el, fill: fill, tx: tx };
    }
    e.fill.style.height = Math.max(0, Math.min(100, b.t / b.dur * 100)) + '%'; e.fill.style.background = '#' + ('000000' + b.col.toString(16)).slice(-6);
    e.tx.textContent = Math.ceil(b.t);
  });
  var st = '';
  if (P.slowT > 0) st += 'Slowed ' + Math.ceil(P.slowT) + 's  '; if (P.poisonT > 0) st += 'Poisoned ' + Math.ceil(P.poisonT) + 's';
  var se = host.querySelector('.bfst'); if (!se) { se = h('div', 'bfst', null, host); } se.textContent = st; se.style.display = st ? 'block' : 'none';
}

/* ---------- Item Craft NPC: Godzilla Fragments -> Godzilla Armor / Gloves / Pants ---------- */
var CRAFT_RECIPES = [
  { id: 'god_helmet', frag: 110, gold: 700000 },
  { id: 'godset_armor', frag: 100, gold: 600000 },
  { id: 'godset_pants', frag: 90, gold: 550000 },
  { id: 'godset_gloves', frag: 80, gold: 500000 },
  { id: 'godzilla_bow', frag: 100, gold: 600000 },
  { id: 'godzilla_necklace', frag: 200, gold: 700000 },
  { id: 'godzilla_ring_l', frag: 150, gold: 700000 },
  { id: 'godzilla_ring_r', frag: 150, gold: 700000 }];
function openCraft(npc) { openPanel(npc.name + ' - Crafting', renderCraft); }
function renderCraft(body) {
  var d = h('div', 'dlg', null, body);
  h('p', null, 'Bring me Godzilla Fragments from the mobs of Promise Wonderland and I will forge the Godzilla set (helmet, armor, pants and gloves), the Godzilla Bow and the Godzilla jewelry (necklace and rings) for you.', d);
  h('div', 'ds', 'Godzilla Fragments: ' + (P.inv.godzilla_fragment || 0) + '   ·   Gold: ' + P.gold.toLocaleString(), body);
  CRAFT_RECIPES.forEach(function (rc) {
    var it = ITEMS[rc.id], r = h('div', 'item', null, body); iconEl(r, it.icon, it.emoji || '?');
    var nm = h('div', 'nm', null, r); h('div', null, it.name, nm); h('div', 'ds', it.baseDesc + (it.fixed ? '' : '  (random bonus stats)') + '  ·  Lv ' + it.lvl, nm);
    var okF = (P.inv.godzilla_fragment || 0) >= rc.frag, okG = P.gold >= rc.gold;
    h('div', 'ds', (okF ? '✔ ' : '✘ ') + rc.frag + ' Godzilla Fragments   ' + (okG ? '✔ ' : '✘ ') + rc.gold.toLocaleString() + ' Gold', nm);
    btn(r, 'Craft', function () {
      if ((P.inv.godzilla_fragment || 0) < rc.frag || P.gold < rc.gold) return;
      P.inv.godzilla_fragment -= rc.frag; P.gold -= rc.gold; giveDrop(rc.id); sfx('coin');
      log('Crafted ' + it.name + '!', '#1adcff'); saveGame(); rerender();
    }, { disabled: !(okF && okG), cls: 'good' });
  });
}

/* ---------- Diamond Shop NPC ---------- */
function openDiamondShop(npc) { openPanel(npc.name + ' - Diamond Shop', renderDiamondShop); }
function renderDiamondShop(body) {
  var d = h('div', 'dlg', null, body);
  h('p', null, 'Spend your Diamonds here. More goods coming soon!', d);
  h('div', 'ds', 'Diamonds: ' + P.diamonds.toLocaleString() + '   ·   Godzilla Fragments: ' + (P.inv.godzilla_fragment || 0), body);
  var it = ITEMS.godzilla_fragment, r = h('div', 'item', null, body); iconEl(r, it.icon, '?');
  var nm = h('div', 'nm', null, r); h('div', null, it.name, nm); h('div', 'ds', '1 Diamond = 1 Fragment', nm);
  var bc = ITEMS.bus_card, rb = h('div', 'item', null, body); iconEl(rb, bc.icon, bc.emoji);
  var nb = h('div', 'nm', null, rb); h('div', null, bc.name, nb); h('div', 'ds', '100 Diamonds · travel to ANY map, no level required · valid 15 days' + (hasBusCard() ? '  ·  ✔ Active: ' + busLeftText() : (P.inv.bus_card ? '  ·  Expired' : '')), nb);
  btn(rb, hasBusCard() ? 'Active' : (P.inv.bus_card ? 'Renew' : 'Buy'), function () {
    if (hasBusCard() || P.diamonds < 100) return;
    P.diamonds -= 100; P.inv.bus_card = nowSec() + BUS_DAYS * 86400; sfx('coin'); log('Bought the Special Bus Card! You can travel to any map for 15 days.', '#7fe8ff'); saveGame(); updateHud(); rerender();
  }, { disabled: hasBusCard() || P.diamonds < 100, cls: 'good' });
  ['name_card', 'stat_card', 'hair_card', 'color_card', 'face_card'].forEach(function (cid) {
    var c = ITEMS[cid], cr = h('div', 'item', null, body); iconEl(cr, c.icon, c.emoji);
    var cn = h('div', 'nm', null, cr); h('div', null, c.name + '   (owned: ' + (P.inv[cid] || 0) + ')', cn); h('div', 'ds', c.dprice + ' Diamonds · ' + c.desc, cn);
    btn(cr, 'Buy', function () {
      if (P.diamonds < c.dprice) return;
      P.diamonds -= c.dprice; P.inv[cid] = (P.inv[cid] || 0) + 1; sfx('coin'); log('Bought ' + c.name + '. Use it from Bag > Items.', '#7fe8ff'); saveGame(); updateHud(); rerender();
    }, { disabled: P.diamonds < c.dprice, cls: 'good' });
  });
  AURA_IDS.forEach(function (aid) {
    var au = ITEMS[aid], ar = h('div', 'item', null, body); iconEl(ar, null, au.emoji);
    var an = h('div', 'nm', null, ar); h('div', null, au.name, an); h('div', 'ds', au.dprice + ' Diamonds · ' + au.desc, an);
    var have = P.owned.indexOf(aid) >= 0;
    if (have) h('span', 'tag eq', 'OWNED', ar);
    else btn(ar, 'Buy', function () {
      if (P.diamonds < au.dprice || P.owned.indexOf(aid) >= 0) return;
      P.diamonds -= au.dprice; P.owned.push(aid); sfx('coin'); log('Bought ' + au.name + '! Equip it from Bag > Items > Equipment (right of Ring Right).', '#7fe8ff'); saveGame(); updateHud(); rerender();
    }, { disabled: P.diamonds < au.dprice, cls: 'good' });
  });
  [1, 10, 100].forEach(function (n) {
    btn(r, 'Buy ' + n, function () {
      if (P.diamonds < n) return;
      P.diamonds -= n; P.inv.godzilla_fragment = (P.inv.godzilla_fragment || 0) + n; sfx('coin');
      log('Bought ' + n + ' Godzilla Fragment' + (n > 1 ? 's' : '') + ' for ' + n + ' Diamond' + (n > 1 ? 's' : ''), '#7fe8ff'); saveGame(); updateHud(); rerender();
    }, { disabled: P.diamonds < n, cls: 'good' });
  });
}

/* ---------- Pets: PetMaloo (pet shop), Kibble Kay (pet food), pet panel ---------- */
function petIcon(parent, id) { var d = h('div', 'ico', null, parent); d.textContent = PETS[id].emoji; d.style.cssText = 'font-size:30px;display:flex;align-items:center;justify-content:center;width:48px;height:48px;flex:none'; return d; }
function openPetShop(npc) { openPanel(npc.name + ' - Pets', renderPetShop); }
function renderPetShop(body) {
  h('div', 'sec', 'Gold: ' + P.gold.toLocaleString(), body);
  h('p', null, 'Hi! I am PetMaloo. A pet follows you everywhere. Only one pet can be out at a time - switch with the paw button at the top-left.', body);
  Object.keys(PETS).forEach(function (id) {
    var pt = PETS[id], r = h('div', 'item', null, body); petIcon(r, id);
    var nm = h('div', 'nm', null, r); h('div', null, pt.name + ' (' + pt.type + ')', nm);
    h('div', 'ds', pt.desc + '  Lv1: ' + pt.lines(1).join(', '), nm);
    if (P.pets[id]) { h('div', 'ds', 'Owned - Lv ' + P.pets[id].lvl, nm); return; }
    var cost = buyCost(pt.price); h('div', 'ds', pt.price.toLocaleString() + ' G + 12% tax = ' + cost.toLocaleString() + ' G', nm);
    btn(r, 'Buy', function () {
      if (P.gold < cost) { log('Not enough gold (price + 12% tax = ' + cost + ' G).', '#ff9a9a'); return; }
      P.gold -= cost; P.pets[id] = { lvl: 1 }; if (!P.pet) setActivePet(id); sfx('coin'); log('You got a ' + pt.name + '! Open the paw button to manage pets.', '#ffd54f'); saveGame(); updateHud(); rerender();
    }, { disabled: P.gold < cost, cls: 'good' });
  });
}
function openPetFoodShop(npc) { openPanel(npc.name + ' - Pet Food', renderPetFoodShop); }
function renderPetFoodShop(body) {
  h('div', 'sec', 'Gold: ' + P.gold.toLocaleString() + '   ·   Pet Food Upgrade: ' + P.petFood, body);
  h('p', null, 'Pet Food Upgrade levels up your pets (max Lv ' + PET_MAX + '): Lv N to N+1 costs N x 2. Each pet also gets hungry after 5 hours out, and needs its own food.', body);
  var r = h('div', 'item', null, body), ic = h('div', 'ico', null, r); ic.textContent = '🍖'; ic.style.cssText = 'font-size:30px;width:48px;height:48px;display:flex;align-items:center;justify-content:center;flex:none';
  var nm = h('div', 'nm', null, r); h('div', null, 'Pet Food Upgrade', nm); h('div', 'ds', 'Pet level up · ' + PET_FOOD_PRICE + ' G + 12% tax = ' + buyCost(PET_FOOD_PRICE) + ' G each', nm);
  [1, 10, 50].forEach(function (n) {
    var cost = buyCost(PET_FOOD_PRICE) * n;
    btn(r, 'x' + n, function () {
      if (P.gold < cost) { log('Not enough gold.', '#ff9a9a'); return; }
      P.gold -= cost; P.petFood += n; sfx('coin'); log('Bought ' + n + ' Pet Food Upgrade.', '#ffd54f'); saveGame(); updateHud(); rerender();
    }, { disabled: P.gold < cost, cls: 'good' });
  });
  h('div', 'sec', 'Pet meals (stops hunger for 5 hours)', body);
  Object.keys(PETS).forEach(function (id) {
    var ml = PET_MEALS[id], r2 = h('div', 'item', null, body), ic2 = h('div', 'ico', null, r2); ic2.textContent = ml.emoji; ic2.style.cssText = ic.style.cssText;
    var n2 = h('div', 'nm', null, r2); h('div', null, ml.name + '  (for ' + PETS[id].name + ')', n2); h('div', 'ds', 'You have ' + (P.petMeal[id] || 0) + ' · ' + ml.price + ' G + 12% tax = ' + buyCost(ml.price) + ' G each', n2);
    [1, 10].forEach(function (n) {
      var cost = buyCost(ml.price) * n;
      btn(r2, 'x' + n, function () {
        if (P.gold < cost) { log('Not enough gold.', '#ff9a9a'); return; }
        P.gold -= cost; P.petMeal[id] = (P.petMeal[id] || 0) + n; sfx('coin'); log('Bought ' + n + ' ' + ml.name + '.', '#ffd54f'); saveGame(); updateHud(); rerender();
      }, { disabled: P.gold < cost, cls: 'good' });
    });
  });
}
function openPets() { openPanel('My Pets', renderPets); }
function renderPets(body) {
  h('div', 'sec', 'Pet Food Upgrade: ' + P.petFood, body);
  var have = Object.keys(P.pets);
  if (!have.length) { h('p', null, 'You have no pets yet. Visit PetMaloo in the safe zone to buy one.', body); return; }
  have.forEach(function (id) {
    var pt = PETS[id], L = P.pets[id].lvl, active = P.pet === id, r = h('div', 'item', null, body); petIcon(r, id);
    var nm = h('div', 'nm', null, r); h('div', null, pt.name + '  Lv ' + L + (L >= PET_MAX ? ' (MAX)' : '') + (active ? '  - ACTIVE' : ''), nm);
    h('div', 'ds', pt.type + ' · ' + pt.lines(L).join(' · '), nm);
    if (L < PET_MAX) h('div', 'ds', 'Next Lv ' + (L + 1) + ': ' + pt.lines(L + 1).join(' · '), nm);
    var ml = PET_MEALS[id], hung = petHungry(id);
    h('div', 'ds', hung ? '😢 HUNGRY - no bonuses until fed' : (active ? 'Hungry in ' + fmtHours(petHungerLeft(id)) : 'Not hungry'), nm);
    btn(r, (P.petMeal[id] || 0) > 0 ? 'Give ' + ml.name + ' (' + P.petMeal[id] + ')' : 'No ' + ml.name, function () { if ((P.petMeal[id] || 0) < 1) return; P.petMeal[id]--; feedPetMeal(id); sfx('coin'); log(pt.name + ' ate ' + ml.name + '. Not hungry for 5 hours!', '#9ff59f'); saveGame(); rerender(); }, { disabled: (P.petMeal[id] || 0) < 1 || (P.petHunger[id] || 0) < 600, cls: 'good' });
    btn(r, active ? 'Dismiss' : 'Summon', function () { setActivePet(active ? null : id); rerender(); });
    if (L < PET_MAX) { var need = petFoodNeed(L); btn(r, 'Feed (' + need + ')', function () {
      if (P.petFood < need || P.pets[id].lvl >= PET_MAX) return;
      P.petFood -= need; P.pets[id].lvl++; sfx('level'); log(pt.name + ' reached Lv ' + P.pets[id].lvl + '!', '#9ff59f'); saveGame(); rerender();
    }, { disabled: P.petFood < need, cls: 'good' }); }
  });
}
function refreshPetBtn() { var e = $('pet-ico'); if (e) e.textContent = P.pet ? PETS[P.pet].emoji : '\uD83D\uDC3E'; }
$('pet-btn').addEventListener('click', openPets);
refreshPetBtn();

/* ---------- Bag > Costume tab (owned costumes) + Costume Shop NPC ---------- */
function renderCostumes(body) {
  h('div', 'sec', 'My costumes', body);
  if (!P.costumes.length) { h('p', null, 'You have no costumes yet. Visit the Costume Shop NPC in the safe zone to buy one with Diamonds.', body); return; }
  var ctabs = h('div', 'tabs', null, body);                                   // categories: one tab per costume slot (with owned count)
  COSTUME_SLOTS.forEach(function (t) {
    var n = P.costumes.filter(function (id) { return COSTUME_DEFS[id] && COSTUME_DEFS[id].slot === t[0]; }).length;
    var b = h('button', bagCosTab === t[0] ? 'act' : null, t[1] + ' (' + n + ')', ctabs); b.addEventListener('click', function () { bagCosTab = t[0]; rerender(); });
  });
  h('div', 'ds', 'A worn costume hides the gear you equip in the same slot (gear stats still apply) and adds its own bonus stats.', body);
  var shown = 0;
  P.costumes.forEach(function (id) {
    if (!COSTUME_DEFS[id] || COSTUME_DEFS[id].slot !== bagCosTab) return; shown++;
    var cd = COSTUME_DEFS[id], r = h('div', 'item', null, body), ic = h('div', 'ico', cd.emoji, r); ic.style.cssText = 'font-size:28px;display:flex;align-items:center;justify-content:center;width:48px;height:48px;flex:none';
    var nm = h('div', 'nm', null, r); h('div', 'rare', '★ ' + cd.name + '  (' + SLOT_INFO[cd.slot].label + ' costume)', nm); h('div', 'ds', cd.desc, nm); h('div', 'ds', '✨ ' + costumeStatText(cd), nm).style.color = '#9fe59f';
    if (P.costumeWorn[cd.slot] === id) { h('span', 'tag eq', 'WORN', r); btn(r, 'Remove', function () { delete P.costumeWorn[cd.slot]; applyEquipVisuals(); saveGame(); rerender(); }); }
    else btn(r, 'Wear', function () { P.costumeWorn[cd.slot] = id; applyEquipVisuals(); saveGame(); sfx('ui'); rerender(); }, { cls: 'good' });
  });
  if (!shown) h('p', null, 'You have no ' + COSTUME_SLOTS.filter(function (t) { return t[0] === bagCosTab; })[0][1].toLowerCase() + ' costumes yet.', body);
}
var bagCosTab = 'helmet';
var costumeTab = 'helmet';
function openCostumeShop(npc) { openPanel(npc.name, renderCostumeShop, { preview: true }); }
function renderCostumeShop(body) {
  var tabs = h('div', 'tabs', null, body);
  COSTUME_SLOTS.forEach(function (t) { var b = h('button', costumeTab === t[0] ? 'act' : null, t[1], tabs); b.addEventListener('click', function () { costumeTab = t[0]; rerender(); }); });
  h('div', 'sec', 'Diamonds: ' + P.diamonds.toLocaleString() + ' 💎', body);
  var any = false;
  Object.keys(COSTUME_DEFS).forEach(function (id) {
    var cd = COSTUME_DEFS[id]; if (cd.slot !== costumeTab) return; any = true;
    var r = h('div', 'item', null, body), ic = h('div', 'ico', cd.emoji, r); ic.style.cssText = 'font-size:28px;display:flex;align-items:center;justify-content:center;width:48px;height:48px;flex:none';
    var nm = h('div', 'nm', null, r); h('div', 'rare', '★ ' + cd.name, nm); h('div', 'ds', cd.desc, nm); h('div', 'ds', '✨ When worn: ' + costumeStatText(cd), nm).style.color = '#9fe59f'; h('div', 'ds', cd.diamonds.toLocaleString() + ' 💎', nm);
    var pvOn = pvOverride[cd.slot] === id;
    btn(r, pvOn ? 'Stop' : 'Preview', function () { if (pvOn) delete pvOverride[cd.slot]; else pvOverride[cd.slot] = id; rerender(); }, { cls: pvOn ? 'danger' : null });
    if (P.costumes.indexOf(id) >= 0) h('span', 'tag eq', 'OWNED', r);
    else btn(r, 'Buy', function () {
      if (P.diamonds < cd.diamonds) { log('Not enough Diamonds.', '#ff9a9a'); return; }
      P.diamonds -= cd.diamonds; P.costumes.push(id); sfx('coin'); log('Bought costume: ' + cd.name + '! Wear it from Bag > Costume.', '#7fe8ff'); saveGame(); updateHud(); rerender();
    }, { disabled: P.diamonds < cd.diamonds, cls: 'good' });
  });
  if (!any) h('p', null, 'No costumes in this category yet. More are coming soon!', body);
}

/* ---------- live character preview inside popups (Bag, Costume Shop) ---------- */
function initPanelPreview() {
  if (pvw) return true;
  try {
    var cv = $('pv-canvas'), rd = new THREE.WebGLRenderer({ canvas: cv, antialias: true, alpha: true });
    var sc = new THREE.Scene(), cam = new THREE.PerspectiveCamera(32, 1, 0.1, 60);
    sc.add(new THREE.AmbientLight(0xffffff, 0.8)); var dl = new THREE.DirectionalLight(0xffffff, 0.9); dl.position.set(2, 4, 5); sc.add(dl);
    var hm = makeHumanoid({ hairStyles: true, scale: 1, skin: 0xf0c8a0, shirt: 0x2f6fd0, pants: 0x353a48, hair: 0x2a1a10, pads: true, padColor: 0x8a97a6, boots: 0x3a2a1a, gear: true });
    var pc = { rig: hm.rig, mats: hm.mats, g: hm.root, rare: [], upg: [], wMat: null }; sc.add(hm.root);
    pvw = { rd: rd, sc: sc, cam: cam, c: pc, root: hm.root, ry: 0.4, drag: null, run: false, w: 0, h: 0 };
    cv.addEventListener('pointerdown', function (e) { pvw.drag = e.clientX; try { cv.setPointerCapture(e.pointerId); } catch (x) {} });
    cv.addEventListener('pointermove', function (e) { if (pvw.drag !== null) { pvw.ry += (e.clientX - pvw.drag) * 0.012; pvw.drag = e.clientX; } });
    cv.addEventListener('pointerup', function () { pvw.drag = null; }); cv.addEventListener('pointercancel', function () { pvw.drag = null; });
  } catch (e) { pvw = null; return false; }
  return true;
}
function pvFit() {
  var cv = $('pv-canvas'), w = cv.clientWidth, hh = cv.clientHeight; if (!w || !hh) return;
  if (w === pvw.w && hh === pvw.h && pvw.zm === pvZoom) return;
  pvw.zm = pvZoom; pvw.w = w; pvw.h = hh; pvw.rd.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2)); pvw.rd.setSize(w, hh, false);
  pvw.cam.aspect = w / hh; pvw.cam.fov = pvw.cam.aspect < 0.7 ? 40 : 32; pvw.cam.updateProjectionMatrix(); if (pvZoom) { pvw.cam.position.set(0, 1.75, 3.4); pvw.cam.lookAt(0, 1.68, 0); } else { pvw.cam.position.set(0, 1.15, 6.6); pvw.cam.lookAt(0, 1.0, 0); }
}
function updatePanelPreview() {
  if (!initPanelPreview()) return;
  pvFit(); applyEquipVisuals(pvw.c, pvOverride);
  if (!pvw.run) { pvw.run = true; pvLoop(); }
}
function pvLoop() {
  if (!pvw || !pvw.run) return;
  pvFit(); if (pvw.drag === null) pvw.ry += 0.012; pvw.root.rotation.y = pvw.ry;
  updateCostumeFx(0.016, pvw.c); try { pvw.rd.render(pvw.sc, pvw.cam); } catch (e) {}
  requestAnimationFrame(pvLoop);
}

/* ---------- Diamond Shop cards: use from Bag > Items ---------- */
function useUpCard(id) { P.inv[id] = Math.max(0, (P.inv[id] || 0) - 1); saveGame(); }
var CARD_USE = {
  name_card: function () { if ((P.inv.name_card || 0) < 1) return; openPanel('Change Name', renderNameCard); },
  stat_card: function () { if ((P.inv.stat_card || 0) < 1) return; openPanel('Reset Stats', renderStatCard); },
  hair_card: function () { if ((P.inv.hair_card || 0) < 1) return; openPanel('Change Hairstyle', renderHairCard, { preview: true }); },
  color_card: function () { if ((P.inv.color_card || 0) < 1) return; openPanel('Change Hair Color', renderColorCard, { preview: true }); },
  face_card: function () { if ((P.inv.face_card || 0) < 1) return; openPanel('Change Face', renderFaceCard, { preview: true }); }
};
function renderNameCard(body) {
  h('div', 'ds', 'Your current name: ' + P.name + '. Letters and numbers only, 2-14 characters. The card is used up when you confirm.', body);
  var inp = h('input', null, null, body); inp.type = 'text'; inp.maxLength = 14; inp.placeholder = 'New name'; inp.autocomplete = 'off'; inp.style.cssText = 'width:100%;padding:8px;border-radius:8px;border:1px solid #888;background:#111a33;color:#fff;font-size:15px;box-sizing:border-box;margin:6px 0';
  var err = h('div', 'ds', '', body); err.style.color = '#ff8a8a';
  inp.addEventListener('input', function () { var v = inp.value.replace(/[^A-Za-z0-9]/g, ''); if (v !== inp.value) { inp.value = v; err.textContent = NAME_ERR; } else err.textContent = ''; });
  btn(body, 'Confirm new name', function () {
    var v = inp.value.replace(/[^A-Za-z0-9]/g, '').slice(0, 14);
    if (v.length < 2) { err.textContent = 'Name must be 2-14 characters.'; return; }
    if (v === P.name) { err.textContent = 'That is already your name.'; return; }
    if ((P.inv.name_card || 0) < 1) return;
    useUpCard('name_card'); P.name = v; P.c.name = v; refreshPlayerTag(true); saveGame(); sfx('level'); closePanel();
    log('Your name is now ' + v + '!', '#ffe066');
  }, { cls: 'good' });
}
function renderStatCard(body) {
  var a = P.alloc, tot = a.hp + a.dmg + a.def + a.crit + a.cdmg;
  h('div', 'ds', 'Allocated points: HP ' + a.hp + ' · Damage ' + a.dmg + ' · Defence ' + a.def + ' · Crit Rate ' + a.crit + ' · Crit Damage ' + a.cdmg + '  (total ' + tot + '). Using the card sets them all to 0 and gives you ' + tot + ' stat points back to spend again.', body);
  btn(body, 'Reset all stat points', function () {
    if ((P.inv.stat_card || 0) < 1) return;
    useUpCard('stat_card'); P.sp += tot; P.alloc = { hp: 0, dmg: 0, def: 0, crit: 0, cdmg: 0 }; P.hp = Math.min(P.hp, maxHp());
    saveGame(); sfx('level'); closePanel(); log('Stats reset! ' + tot + ' stat points returned.', '#ffe066');
  }, { cls: 'good', disabled: tot <= 0 });
}
var FACE_NAMES = ['Default', 'Happy', 'Angry', 'Sleepy', 'Cool', 'Cute', 'Wink', 'Surprised'];
var HAIR_COLOR_NAMES = ['Dark Brown', 'Brown', 'Blonde', 'Yellow', 'White', 'Black', 'Red', 'Blue', 'Purple', 'Pink'];
function lookCardList(body, key, names, cardId, label, cur, zoom, swatch) {   // shared list: each row = Preview (left model) + Apply
  pvZoom = !!zoom;
  h('div', 'ds', 'Tap Preview to try it on the character at the left. Apply uses the card (' + (P.inv[cardId] || 0) + ' left).', body);
  names.forEach(function (nm, idx) {
    var r = h('div', 'item', null, body), n = h('div', 'nm', null, r), on = pvLook[key] === idx;
    if (swatch) { var sw = h('div', null, '', r); sw.style.cssText = 'width:26px;height:26px;border-radius:50%;border:2px solid #fff;margin-right:6px;flex:none;background:#' + ('000000' + swatch(idx).toString(16)).slice(-6); r.insertBefore(sw, n); }
    h('div', null, nm + (cur === idx ? '  (current)' : ''), n);
    btn(r, on ? 'Stop' : 'Preview', function () { if (on) delete pvLook[key]; else pvLook[key] = idx; rerender(); }, { cls: on ? 'danger' : null });
    btn(r, 'Apply', function () {
      if ((P.inv[cardId] || 0) < 1) return;
      useUpCard(cardId); P.look[key] = idx === undefined ? 0 : (swatch ? swatch(idx) : idx); applyLook(); saveGame(); sfx('level'); closePanel(); log(label + ': ' + nm + '!', '#ffe066');
    }, { disabled: swatch ? P.look[key] === swatch(idx) : cur === idx, cls: 'good' });
  });
}
function renderHairCard(body) { lookCardList(body, 'style', HAIR_STYLES.concat(HAIR_EXCLUSIVE), 'hair_card', 'New hairstyle', P.look.style, true); }
function renderFaceCard(body) { lookCardList(body, 'face', FACE_NAMES, 'face_card', 'New face', P.look.face | 0, true); }
function renderColorCard(body) {
  var cols = HAIR_COLORS.concat([0x3fd0a0, 0xff8a20, 0x8a8a8a, 0x7a1f3a, 0x1ab8c8, 0xc0c0ff]), nms = HAIR_COLOR_NAMES.concat(['Teal', 'Orange', 'Grey', 'Wine', 'Cyan', 'Lavender']);
  var cur = cols.indexOf(P.look.hair); pvZoom = true;
  h('div', 'ds', 'Tap Preview to try the colour on the character at the left. Apply uses the card (' + (P.inv.color_card || 0) + ' left).', body);
  nms.forEach(function (nm, idx) {
    var r = h('div', 'item', null, body), n = h('div', 'nm', null, r), on = pvLook.hair === cols[idx];
    var sw = h('div', null, '', r); sw.style.cssText = 'width:26px;height:26px;border-radius:50%;border:2px solid #fff;margin-right:6px;flex:none;background:#' + ('000000' + cols[idx].toString(16)).slice(-6); r.insertBefore(sw, n);
    h('div', null, nm + (cur === idx ? '  (current)' : ''), n);
    btn(r, on ? 'Stop' : 'Preview', function () { if (on) delete pvLook.hair; else pvLook.hair = cols[idx]; rerender(); }, { cls: on ? 'danger' : null });
    btn(r, 'Apply', function () {
      if ((P.inv.color_card || 0) < 1) return;
      useUpCard('color_card'); P.look.hair = cols[idx]; applyLook(); saveGame(); sfx('level'); closePanel(); log('New hair colour: ' + nm + '!', '#ffe066');
    }, { disabled: cur === idx, cls: 'good' });
  });
}

/* ---- dungeon pass timer (right of the pet button): time left on the Golden Key pass; when it ends you are sent out ---- */
setInterval(function () {
  var e = $('dun-timer'); if (!e) return;
  if (!curMap || !curMap.key || typeof P === 'undefined' || !P.inv) { e.style.display = 'none'; return; }
  var left = (P.inv.golden_pass || 0) - nowSec();
  if (left <= 0) { e.style.display = 'none'; log('Your dungeon pass has ended. Returning to Moviex Plains.', '#ffb3b3'); try { travelTo('plains'); } catch (x) {} return; }
  var m = Math.floor(left / 60), sc = left % 60;
  e.style.display = 'flex'; e.classList.toggle('low', left <= 60); e.textContent = '\uD83D\uDDDD\uFE0F ' + m + ':' + (sc < 10 ? '0' : '') + sc;
}, 1000);

/* ---------- Christmas tree: popup that loops the Christmas video (no controls) ---------- */
var XMAS_URL = 'https://archive.org/download/xmas_20261122/xmas.mp4', xmasVid = null;
function xmasStop() { if (xmasVid) { try { xmasVid.pause(); } catch (e) {} } if (bgm && ui.xmasBgm) { ui.xmasBgm = false; if (S.music > 0) { var p = bgm.play(); if (p && p.catch) p.catch(function () {}); } } }
function openXmas() {
  var st = 'check', day = '', errTxt = '';
  function checkDay() {
    st = 'check'; errTxt = ''; rerender();
    cloudServerDay().then(function (d) { day = d; st = (P.xmasDay === d) ? 'video' : 'gift'; if (ui.open === 'Merry Christmas!') rerender(); })
      .catch(function () { st = 'err'; errTxt = (CLOUD.user ? 'Could not reach the server clock. Check your internet and try again.' : 'Log in (with internet) to open your daily Christmas gift. This keeps the daily reward fair for everyone.'); if (ui.open === 'Merry Christmas!') rerender(); });
  }
  openPanel('Merry Christmas!', function (body) {
    var wrap = h('div', st === 'video' ? 'xm-wrap' : null, null, body);
    if (st !== 'video') wrap.style.cssText = 'text-align:center';
    if (st === 'check') { h('div', 'ds', 'Checking today\'s gift...', wrap); return; }
    if (st === 'err') { h('div', 'ds', errTxt, wrap); var rb = h('div', 'btns', null, wrap); btn(rb, 'Try again', checkDay); return; }
    if (st === 'gift') {                         // tap the gift: random 20,000-50,000 Gold + 2-10 Diamonds, once per (server) day
      h('div', 'ds', 'A Christmas gift is waiting under the tree! You can open one every day.', wrap);
      var gift = h('div', null, '\uD83C\uDF81', wrap); gift.style.cssText = 'font-size:96px;line-height:1.3;cursor:pointer;animation:giftbob 1s ease-in-out infinite;user-select:none';
      h('div', 'ds', 'Tap the gift to open it', wrap);
      var busy = false;
      gift.addEventListener('click', function () {
        if (busy) return; busy = true;
        cloudServerDay().then(function (d) {           // re-check the server day right before paying out
          day = d; if (P.xmasDay === d) { st = 'video'; rerender(); return; }
          P.xmasGold = 20000 + Math.floor(Math.random() * 30001); P.xmasDia = 2 + Math.floor(Math.random() * 9); P.xmasDay = d;
          P.gold += P.xmasGold; P.diamonds += P.xmasDia; sfx('level'); sfx('coin');
          log('Christmas gift: +' + P.xmasGold.toLocaleString() + ' Gold and +' + P.xmasDia + ' Diamonds!', '#ffe066'); saveGame(); cloudPush && cloudPush(true);
          st = 'video'; rerender();
        }).catch(function () { busy = false; st = 'err'; errTxt = 'Could not reach the server clock. Check your internet and try again.'; rerender(); });
      });
      return;
    }
    var rw = h('div', 'xm-rw', null, wrap);       // reward text: floats left of the video (landscape) so the video can be full size
    rw.innerHTML = '\uD83C\uDF81 Today\'s gift<br>+' + P.xmasGold.toLocaleString() + ' Gold<br>+' + P.xmasDia + ' \uD83D\uDC8E Diamonds<br><span style="opacity:.75;font-weight:600">Next gift tomorrow</span>';
    if (!xmasVid) {
      xmasVid = document.createElement('video'); xmasVid.src = XMAS_URL; xmasVid.loop = true; xmasVid.autoplay = true; xmasVid.controls = false; xmasVid.playsInline = true; xmasVid.preload = 'auto';
      xmasVid.setAttribute('playsinline', ''); xmasVid.setAttribute('webkit-playsinline', ''); xmasVid.setAttribute('disablepictureinpicture', ''); xmasVid.setAttribute('controlslist', 'nodownload nofullscreen noremoteplayback');
      xmasVid.addEventListener('contextmenu', function (e) { e.preventDefault(); });
    }
    wrap.appendChild(xmasVid);
    var msg = h('div', 'ds xm-msg', 'Loading video...', wrap); msg.style.cssText = 'margin-top:6px;position:absolute;left:50%;bottom:10px;transform:translateX(-50%);background:rgba(0,0,0,.6);padding:3px 10px;border-radius:8px';
    xmasVid.onplaying = function () { msg.style.display = 'none'; }; xmasVid.onerror = function () { msg.style.display = 'block'; msg.textContent = 'Could not load the video. Check your internet connection.'; };
    var go = function () { var pr = xmasVid.play(); if (pr && pr.catch) pr.catch(function () { xmasVid.muted = true; var p2 = xmasVid.play(); if (p2 && p2.catch) p2.catch(function () { msg.textContent = 'Tap the video area to play.'; msg.style.display = 'block'; wrap.onclick = function () { xmasVid.play(); }; }); }); };
    xmasVid.muted = false; xmasVid.volume = 0.8; go();
    if (bgm && !bgm.paused) { bgm.pause(); ui.xmasBgm = true; }
  });
  checkDay();
}
