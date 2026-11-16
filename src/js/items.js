/* items.js - gear (6 slots x tiers), potions, icons */

var MAX_LVL = 100;
var XP_CUTOFF = 10;          // hero this many levels above a mob gets no XP (loot only)

/* ---- gear: 6 slots x tiers (generated) ---- */
var SLOTS = ['weapon', 'helmet', 'armor', 'pants', 'gloves', 'wings'];
var SLOT_INFO = {
  weapon: { label: 'Sword', icon: '⚔' }, helmet: { label: 'Helmet', icon: '🪖' }, armor: { label: 'Armor', icon: '🛡' },
  pants: { label: 'Pants', icon: '👖' }, gloves: { label: 'Gloves', icon: '🧤' }, wings: { label: 'Wings', icon: '🪽' }
};
var ITEMS = {
  hp_potion: { name: 'Health Potion', type: 'potion', frac: 0.35, price: 30, desc: 'Restores 35% HP' },
  mp_potion: { name: 'Mana Potion', type: 'potion', frac: 0.4, price: 35, desc: 'Restores 40% MP' }
};
(function genGear() {
  var tierCol = [0x7a4a21, 0x9aa3ad, 0xd6dde6, 0x4fd1c5, 0xe0463a, 0xffd54f];
  var wingCol = [0xe8e8e8, 0xfff2c0, 0x6ab7ff, 0xe0463a, 0xffd54f];
  var armorLvl = [3, 12, 22, 32, 42];
  var names = {
    helmet: ['Leather Cap', 'Iron Helm', 'Steel Helm', 'Mithril Helm', 'Dragon Crown'],
    armor: ['Leather Armor', 'Iron Cuirass', 'Steel Plate', 'Mithril Mail', 'Dragon Armor'],
    pants: ['Leather Pants', 'Iron Greaves', 'Steel Greaves', 'Mithril Leggings', 'Dragon Greaves'],
    gloves: ['Leather Gloves', 'Iron Gauntlets', 'Steel Gauntlets', 'Mithril Gloves', 'Dragon Claws'],
    wings: ['Feather Wings', 'Angel Wings', 'Azure Wings', 'Crimson Wings', 'Celestial Wings']
  };
  var stat = {
    helmet: { def: [2, 5, 10, 17, 26], hp: [10, 30, 70, 130, 220] }, armor: { def: [4, 10, 20, 34, 52], hp: [20, 60, 140, 260, 440] },
    pants: { def: [3, 7, 14, 24, 38], hp: [10, 30, 70, 120, 200] }, gloves: { def: [1, 3, 6, 10, 16], atk: [1, 3, 6, 10, 16] },
    wings: { def: [1, 3, 6, 10, 15], hp: [60, 160, 340, 620, 1000], atk: [0, 2, 5, 9, 14] }
  };
  var pmul = { helmet: 0.7, armor: 1.4, pants: 1, gloves: 0.6, wings: 1.8 }, pbase = [150, 600, 2000, 6500, 18000];
  var wn = ['Wooden Sword', 'Iron Sword', 'Steel Sword', 'Mithril Blade', 'Hellforged Greatsword', 'Celestial Blade'];
  var wAtk = [0, 10, 24, 46, 80, 125], wLvl = [1, 5, 14, 26, 38, 48], wPrice = [0, 250, 900, 3000, 9000, 25000];
  var wKind = ['sword', 'sword', 'sword', 'sword', 'greatsword', 'greatsword'];
  function desc(it) { var p = []; if (it.atk) p.push('+' + it.atk + ' ATK'); if (it.def) p.push('+' + it.def + ' DEF'); if (it.hp) p.push('+' + it.hp + ' HP'); return p.join('  '); }
  for (var t = 0; t < 6; t++) {
    var w = { id: 'weapon' + t, slot: 'weapon', name: wn[t], tier: t, lvl: wLvl[t], atk: wAtk[t], def: 0, hp: 0, price: wPrice[t], color: tierCol[t], glow: t >= 4, kind: wKind[t], type: 'gear' };
    w.desc = desc(w) || 'A starter blade'; ITEMS[w.id] = w;
  }
  ITEMS.dragon_blade = { id: 'dragon_blade', slot: 'weapon', name: 'Dragon Blade', tier: 3, lvl: 10, atk: 38, def: 0, hp: 0, price: 0, color: 0xff5522, glow: true, kind: 'greatsword', type: 'gear', desc: '+38 ATK (Demon Lord drop)' };
  SLOTS.forEach(function (sl) {
    if (sl === 'weapon') return;
    for (var i = 0; i < 5; i++) {
      var it = { id: sl + (i + 1), slot: sl, name: names[sl][i], tier: i + 1, lvl: armorLvl[i], type: 'gear',
        atk: stat[sl].atk ? stat[sl].atk[i] : 0, def: stat[sl].def ? stat[sl].def[i] : 0, hp: stat[sl].hp ? stat[sl].hp[i] : 0,
        price: Math.round(pbase[i] * pmul[sl]), color: sl === 'wings' ? wingCol[i] : tierCol[i + 1], glow: i === 4 };
      it.desc = desc(it); ITEMS[it.id] = it;
    }
  });
})();


/* ---- boss-only rare items (1 per equipment slot) with a glowing Roblox-style effect ---- */
var BOSS_ITEMS = [], FX_NAMES = { rainbow: 'Rainbow Neon', gold: 'Royal Gold Aura', fire: 'Inferno Flames', galaxy: 'Galaxy Pulse', neon: 'Neon Shift' };
(function () {
  var defs = [
    { slot: 'weapon', name: 'Dominus Blade', fx: 'rainbow', atk: 170, kind: 'greatsword', color: 0xff4aff },
    { slot: 'helmet', name: 'Valkyrie Crown', fx: 'gold', def: 34, hp: 320, color: 0xffd54f },
    { slot: 'armor', name: 'Inferno Plate', fx: 'fire', def: 66, hp: 640, color: 0xff6a2a },
    { slot: 'pants', name: 'Void Greaves', fx: 'galaxy', def: 48, hp: 320, color: 0x8a4aff },
    { slot: 'gloves', name: 'Neon Gauntlets', fx: 'neon', def: 20, atk: 24, color: 0x4affd8 },
    { slot: 'wings', name: 'Wings of Eternity', fx: 'rainbow', def: 22, hp: 1500, atk: 22, color: 0xffffff }];
  defs.forEach(function (d) {
    var it = { id: 'boss_' + d.slot, slot: d.slot, name: d.name, tier: 6, lvl: 30, atk: d.atk || 0, def: d.def || 0, hp: d.hp || 0, price: 40000, color: d.color, glow: true,
      kind: d.kind || 'sword', type: 'gear', rare: true, fx: d.fx, bossOnly: true };
    var p = []; if (it.atk) p.push('+' + it.atk + ' ATK'); if (it.def) p.push('+' + it.def + ' DEF'); if (it.hp) p.push('+' + it.hp + ' HP');
    it.baseDesc = p.join('  '); it.desc = it.baseDesc + '  ★ ' + FX_NAMES[d.fx];
    ITEMS[it.id] = it; BOSS_ITEMS.push(it.id);
  });
})();

/* ---- Bad Santa boss-only drops: Crimson Eye Blade + Clockwork Fairy Wings ---- */
var SANTA_ITEMS = [];
FX_NAMES.fire = 'Inferno Flames'; FX_NAMES.teal = 'Clockwork Glow';
[{ id: 'santa_weapon', slot: 'weapon', name: 'Crimson Eye Blade', fx: 'fire', atk: 240, kind: 'eyeblade', color: 0xe01818 },
 { id: 'santa_wings', slot: 'wings', name: 'Clockwork Fairy Wings', fx: 'teal', def: 34, hp: 2300, atk: 34, model: 'gear', color: 0x2fb8a8 }].forEach(function (d) {
  var it = { id: d.id, slot: d.slot, name: d.name, tier: 7, lvl: 40, atk: d.atk || 0, def: d.def || 0, hp: d.hp || 0, price: 90000, color: d.color, glow: true,
    kind: d.kind || 'sword', model: d.model, type: 'gear', rare: true, fx: d.fx, bossOnly: true };
  var p = []; if (it.atk) p.push('+' + it.atk + ' ATK'); if (it.def) p.push('+' + it.def + ' DEF'); if (it.hp) p.push('+' + it.hp + ' HP');
  it.baseDesc = p.join('  '); it.desc = it.baseDesc + '  ★ ' + FX_NAMES[d.fx];
  ITEMS[it.id] = it; SANTA_ITEMS.push(it.id);
});

/* ---- Celestial set (Crocodile Island + Death Prison bosses): one boss-only rare piece per slot ---- */
var COSTUME_DEFS = {   // cosmetic costumes bought at the Costume Shop (Diamonds). Worn costume hides the gear visual of its slot; stats still come from gear.
  cos_king_crown: { id: 'cos_king_crown', slot: 'helmet', name: 'King Crown', emoji: '👑', diamonds: 100, model: 'crown', color: 0xffd54f, stats: { exp: 60 }, desc: 'A royal golden crown that sits on your head.' },
  cos_ssj3: { id: 'cos_ssj3', slot: 'helmet', name: 'Super Saiyan Hair', emoji: '⚡', diamonds: 1000, model: 'ssj3', color: 0xc8c81a, stats: { atk: 1000, exp: 10 }, desc: 'Golden spiky hair swept back with a long flat lock down your back, and a golden aura.' },
  cos_ssj_sword: { id: 'cos_ssj_sword', slot: 'weapon', name: 'Super Saiyan Sword', emoji: '🗡️', diamonds: 1000, kind: 'ssjblade', color: 0xffd54f, glow: true, stats: { atk: 2500 }, desc: 'A flat, wide blade glowing in yellow and white.' }
};
function costumeSum(k) { var s = 0, w = (typeof P !== 'undefined' && P.costumeWorn) || {}; for (var sl in w) { var d = COSTUME_DEFS[w[sl]]; if (d && d.stats && d.stats[k]) s += d.stats[k]; } return s; }
function costumeStatText(d) { var p = []; if (d.stats.atk) p.push('+' + d.stats.atk + ' Attack'); if (d.stats.hp) p.push('+' + d.stats.hp + ' HP'); if (d.stats.def) p.push('+' + d.stats.def + ' Defence'); if (d.stats.hpRegen) p.push('+' + d.stats.hpRegen + ' HP regen/s'); if (d.stats.mpRegen) p.push('+' + d.stats.mpRegen + ' MP regen/s'); if (d.stats.spd) p.push('+' + d.stats.spd + ' Move Speed'); if (d.stats.exp) p.push('+' + d.stats.exp + '% EXP'); return p.join(', '); }
COSTUME_DEFS.cos_rad_armor = { id: 'cos_rad_armor', slot: 'armor', name: 'Radiant Armor', emoji: '🛡️', diamonds: 1000, model: 'radiant', color: 0xf3f0e4, padColor: 0xffd54f, stats: { hp: 2500, def: 120 }, desc: 'White plate armor with gold trim, golden shoulder fins and a glowing teal chest gem.' };
COSTUME_DEFS.cos_rad_pants = { id: 'cos_rad_pants', slot: 'pants', name: 'Radiant Greaves', emoji: '👖', diamonds: 1000, model: 'radiant', color: 0xece7d6, stats: { hp: 2500, def: 120 }, desc: 'White leg armor with gold knee guards and teal light strips.' };
COSTUME_DEFS.cos_rad_gloves = { id: 'cos_rad_gloves', slot: 'gloves', name: 'Radiant Gauntlets', emoji: '🧤', diamonds: 1000, model: 'radiant', color: 0xffd54f, stats: { hp: 2500, def: 120 }, desc: 'Golden gauntlets with teal gems and glowing cuffs.' };
COSTUME_DEFS.cos_ssj_wings = { id: 'cos_ssj_wings', slot: 'wings', name: 'Super Saiyan Wings', emoji: '🪽', diamonds: 2000, model: 'ssjwings', color: 0xc4c42e, stats: { hp: 8000, hpRegen: 200, mpRegen: 60, spd: 0.4, def: 200 }, desc: 'Radiating golden spikes with pale ghost-spikes behind them.' };
COSTUME_DEFS.cos_johny_mask = { id: 'cos_johny_mask', slot: 'helmet', name: 'Johny Mask', emoji: '🎭', diamonds: 1000, model: 'mask', color: 0x737373, stats: { exp: 100, hp: 1000, atk: 500 }, desc: 'A grey mask with blue ear spikes, four white dots and a white visor.' };
var COSTUME_SLOTS = [['weapon', 'Sword'], ['armor', 'Armor'], ['helmet', 'Helmet'], ['pants', 'Pants'], ['gloves', 'Gloves'], ['wings', 'Wings']];
var CELESTIAL_ITEMS = [];
FX_NAMES.celestial = 'Celestial Radiance';
[{ slot: 'weapon', name: 'Celestial Blade', atk: 520, kind: 'greatsword', color: 0xfff1b0 },
 { slot: 'helmet', name: 'Celestial Halo', def: 70, hp: 900, color: 0xfff1b0 },
 { slot: 'armor', name: 'Celestial Aegis', def: 130, hp: 1800, color: 0xfff1b0 },
 { slot: 'pants', name: 'Celestial Greaves', def: 95, hp: 900, color: 0xfff1b0 },
 { slot: 'gloves', name: 'Celestial Gauntlets', def: 45, atk: 60, color: 0xfff1b0 },
 { slot: 'wings', name: 'Celestial Wings', def: 50, hp: 4000, atk: 50, color: 0xffffff }].forEach(function (d) {
  var it = { id: 'cel_' + d.slot, slot: d.slot, name: d.name, tier: 8, lvl: 60, atk: d.atk || 0, def: d.def || 0, hp: d.hp || 0, price: 150000, color: d.color, glow: true,
    kind: d.kind || 'sword', type: 'gear', rare: true, fx: 'celestial', bossOnly: true, set: 'Celestial' };
  var p = []; if (it.atk) p.push('+' + it.atk + ' ATK'); if (it.def) p.push('+' + it.def + ' DEF'); if (it.hp) p.push('+' + it.hp + ' HP');
  it.baseDesc = p.join('  '); it.desc = it.baseDesc + '  ★ Celestial Set';
  ITEMS[it.id] = it; CELESTIAL_ITEMS.push(it.id);
});

/* ---- Promise Wonderland boss drops (Croczilla): God of Helmet + Godzilla Sword ---- */
var GODZILLA_ITEMS = [];
FX_NAMES.atomic = 'Atomic Breath';
[{ id: 'godzilla_sword', slot: 'weapon', name: 'Godzilla Sword', atk: 720, kind: 'godsword', color: 0x939a3b },
 { id: 'god_helmet', slot: 'helmet', name: 'God of Helmet', def: 120, hp: 2200, atk: 60, model: 'god', color: 0x3a3f4a }].forEach(function (d) {
  var it = { id: d.id, slot: d.slot, name: d.name, tier: 9, lvl: 50, atk: d.atk || 0, def: d.def || 0, hp: d.hp || 0, price: 250000, color: d.color, glow: true,
    kind: d.kind || 'sword', model: d.model, type: 'gear', rare: true, fx: 'atomic', bossOnly: true };
  var p = []; if (it.atk) p.push('+' + it.atk + ' ATK'); if (it.def) p.push('+' + it.def + ' DEF'); if (it.hp) p.push('+' + it.hp + ' HP');
  it.baseDesc = p.join('  '); it.desc = it.baseDesc + '  ★ Atomic Breath';
  ITEMS[it.id] = it; GODZILLA_ITEMS.push(it.id);
});

/* ---- Bad Santa Set (red suit): helmet, armor, pants, gloves drop from Bad Santa ---- */
var SANTA_SET = [];
[{ slot: 'helmet', name: 'Santa Hat', def: 55, hp: 700 },
 { slot: 'armor', name: 'Santa Suit', def: 95, hp: 1300 },
 { slot: 'pants', name: 'Santa Pants', def: 70, hp: 700 },
 { slot: 'gloves', name: 'Santa Gloves', def: 32, atk: 42 }].forEach(function (d) {
  var it = { id: 'santaset_' + d.slot, slot: d.slot, name: d.name, tier: 7, lvl: 40, atk: d.atk || 0, def: d.def || 0, hp: d.hp || 0, price: 90000, color: 0xc41e1e, glow: true,
    kind: 'sword', type: 'gear', rare: true, fx: 'fire', bossOnly: true, set: 'Santa' };
  var p = []; if (it.atk) p.push('+' + it.atk + ' ATK'); if (it.def) p.push('+' + it.def + ' DEF'); if (it.hp) p.push('+' + it.hp + ' HP');
  it.baseDesc = p.join('  '); it.desc = it.baseDesc + '  ★ Santa Set';
  ITEMS[it.id] = it; SANTA_SET.push(it.id);
});

/* ---- Godzilla Set (Croczilla): armor, gloves, pants, wings (icons item58-61) ---- */
var GODZILLA_SET = [];
[{ slot: 'armor', name: 'Godzilla Armor', def: 220, hp: 3500 },
 { slot: 'gloves', name: 'Godzilla Gloves', def: 80, atk: 110 },
 { slot: 'pants', name: 'Godzilla Pants', def: 160, hp: 2000 },
 { slot: 'wings', name: 'Godzilla Wings', def: 90, hp: 6000, atk: 90 }].forEach(function (d) {
  var it = { id: 'godset_' + d.slot, slot: d.slot, name: d.name, tier: 9, lvl: 50, atk: d.atk || 0, def: d.def || 0, hp: d.hp || 0, price: 250000, color: 0x1adcff, glow: true,
    kind: 'sword', model: 'godzilla', type: 'gear', rare: true, fx: 'atomic', bossOnly: true, set: 'Godzilla' };
  var p = []; if (it.atk) p.push('+' + it.atk + ' ATK'); if (it.def) p.push('+' + it.def + ' DEF'); if (it.hp) p.push('+' + it.hp + ' HP');
  it.baseDesc = p.join('  '); it.desc = it.baseDesc + '  ★ Atomic Breath';
  ITEMS[it.id] = it; GODZILLA_SET.push(it.id);
});

/* ---- item order => icon file (src/item1.png ... src/itemN.png) ---- */
var ITEM_ORDER = ['hp_potion', 'mp_potion', 'weapon0', 'weapon1', 'weapon2', 'weapon3', 'weapon4', 'weapon5', 'dragon_blade'];
['helmet', 'armor', 'pants', 'gloves', 'wings'].forEach(function (sl) { for (var i = 1; i <= 5; i++) ITEM_ORDER.push(sl + i); });
BOSS_ITEMS.forEach(function (id) { ITEM_ORDER.push(id); });
SANTA_ITEMS.forEach(function (id) { ITEM_ORDER.push(id); });
/* ---- upgrade materials (stackable) ---- */
var MATERIAL_IDS = ['burr_stone', 'luxury_stone', 'feather'];
ITEMS.burr_stone = { name: 'Burr Stone', type: 'material', color: 0xd9722e, price: 1500, desc: 'Upgrades your Sword (up to +50)' };
ITEMS.luxury_stone = { name: 'Luxury Stone', type: 'material', color: 0x5ad0ff, price: 1500, desc: 'Upgrades Helmet, Armor, Pants and Gloves (up to +50)' };
ITEMS.feather = { name: 'Feather', type: 'material', color: 0xdff8f4, price: 2500, desc: 'Upgrades your Wings (up to +50)' };
MATERIAL_IDS.forEach(function (id) { ITEM_ORDER.push(id); });
CELESTIAL_ITEMS.forEach(function (id) { ITEM_ORDER.push(id); });
GODZILLA_ITEMS.forEach(function (id) { ITEM_ORDER.push(id); });
SANTA_SET.forEach(function (id) { ITEM_ORDER.push(id); });
GODZILLA_SET.forEach(function (id) { ITEM_ORDER.push(id); });
/* crafted Godzilla gear carries Movement Speed (no longer rolled on drops) */
['god_helmet', 'godset_armor', 'godset_pants', 'godset_gloves'].forEach(function (id) { var it = ITEMS[id]; it.spd = 5; it.baseDesc += '  +5% Move Speed'; it.desc = it.baseDesc + '  ★ Atomic Breath'; });
ITEMS.godzilla_fragment = { name: 'Godzilla Fragment', type: 'material', color: 0x1adcff, price: 0, desc: 'Crafting material (Promise Wonderland mobs). Used by the Item Craft NPC.' };
ITEM_ORDER.push('godzilla_fragment');   // icon: src/item62.png
ITEM_ORDER.forEach(function (id, i) { ITEMS[id].icon = iconUrl('src/item' + (i + 1) + '.png'); ITEMS[id].id = id; });

/* ---- inventory helpers ---- */
function giveItem(id, n) {
  var it = ITEMS[id]; n = n || 1;
  if (!it) return;
  if (it.type === 'potion' || it.type === 'material') P.inv[id] = (P.inv[id] || 0) + n;
  else if (P.owned.indexOf(id) < 0) P.owned.push(id);
}
function itemLabel(id) { return ITEMS[id].name; }

/* ---- upgrades: +1 ... +50, each level = +5% of the item's stats, costs gold + one material type ---- */
var MAX_UPG = 50, UPG_BONUS = 0.05;
function upgMat(slot) { return slot === 'weapon' ? 'burr_stone' : slot === 'wings' ? 'feather' : 'luxury_stone'; }
function upgLvl(id) { return (P.upg && P.upg[id]) | 0; }
function upgMul(id) { return 1 + UPG_BONUS * upgLvl(id); }
function upgGold(it, lvl) { return Math.round(250 * Math.pow(lvl + 1, 1.2) * (1 + (it.tier || 1) * 0.4)); }
function upgStones(lvl) { return 1 + Math.floor(lvl / 5); }
function itemName(id) { var l = upgLvl(id); return ITEMS[id].name + (l ? ' +' + l : ''); }
function pickMaterial() { var r = Math.random(); return r < 0.4 ? 'burr_stone' : r < 0.8 ? 'luxury_stone' : 'feather'; }

/* ---- dropped gear gets 3 random stats: +Damage, +HP, HP regen, MP regen, Speed Up ---- */
var STAT_POOL = ['dmg', 'hp', 'hpr', 'mpr'];   // no random Movement Speed on drops any more (it comes from crafting)
var BOSS_POOL = STAT_POOL.concat(['crit', 'cdmg']);          // boss-only gear can also roll Crit Chance / Crit Damage
function rollStats(tier, n, pool) {
  pool = (pool || STAT_POOL).slice(); n = n || 3; var out = [];
  for (var i = 0; i < n; i++) {
    var st = pool.splice(randInt(0, pool.length - 1), 1)[0], k = rand(0.6, 1.4), v;
    if (st === 'dmg') v = Math.round(k * (4 + 4 * tier));
    else if (st === 'hp') v = Math.round(k * 22 * tier * tier / 2 + 15);
    else if (st === 'hpr') v = Math.round(k * (0.5 + 0.6 * tier) * 10) / 10;
    else if (st === 'mpr') v = Math.round(k * (0.3 + 0.4 * tier) * 10) / 10;
    else if (st === 'crit') v = Math.round(k * (1.5 + 0.5 * tier) * 10) / 10;
    else if (st === 'cdmg') v = Math.round(k * (8 + 4 * tier));
    else v = Math.round(k * (1.5 + tier) * 10) / 10;
    out.push([st, v]);
  }
  return out;
}
function statText(r) {
  var s = r[0], v = r[1];
  return s === 'dmg' ? '+' + v + ' Damage' : s === 'hp' ? '+' + v + ' HP' : s === 'hpr' ? '+' + v + ' HP Regen/s' : s === 'mpr' ? '+' + v + ' MP Regen/s' : s === 'crit' ? '+' + v + '% Crit Chance' : s === 'cdmg' ? '+' + v + '% Crit Damage' : '+' + v + '% Speed';
}
function makeInstance(base, rolls, uid) {
  var b = ITEMS[base]; if (!b) return null;
  rolls = (rolls || []).filter(function (r) { return r[0] !== 'spd'; });   // drop old random speed rolls
  var id = uid || (base + '~' + Math.random().toString(36).slice(2, 8)), it = Object.assign({}, b);
  it.id = id; it.base = base; it.rolls = rolls;
  rolls.forEach(function (r) {
    if (r[0] === 'dmg') it.atk = (it.atk || 0) + r[1]; else if (r[0] === 'hp') it.hp = (it.hp || 0) + r[1];
    else if (r[0] === 'hpr') it.hpr = (it.hpr || 0) + r[1]; else if (r[0] === 'mpr') it.mpr = (it.mpr || 0) + r[1];
    else if (r[0] === 'crit') it.crit = (it.crit || 0) + r[1]; else if (r[0] === 'cdmg') it.cdmg = (it.cdmg || 0) + r[1]; else it.spd = (it.spd || 0) + r[1];
  });
  it.desc = (b.baseDesc || b.desc) + (b.rare ? '  ★ ' + FX_NAMES[b.fx] : '') + '  |  ' + rolls.map(statText).join('  ');
  it.price = Math.round(b.price * 1.15);
  ITEMS[id] = it; P.rolls[id] = { base: base, r: rolls };
  return id;
}
/* looting gear creates a unique copy with random stats; potions stack as before */
function giveDrop(id) {
  var it = ITEMS[id]; if (!it) return null;
  if (it.type !== 'gear') { giveItem(id, 1); return id; }
  var nid = makeInstance(id, it.bossOnly ? rollStats(it.tier || 1, randInt(4, 5), BOSS_POOL) : rollStats(it.tier || 1)); P.owned.push(nid); return nid;
}
function sellValue(it) { return Math.floor(it.price * 0.3) + 10; }

function equipItem(id) {
  var it = ITEMS[id];
  if (!it || it.type !== 'gear' || P.owned.indexOf(id) < 0) return false;
  if (it.lvl && P.lvl < it.lvl) { log('Requires level ' + it.lvl + '.', '#ff9a9a'); return false; }
  P.equip[it.slot] = id; applyEquipVisuals(); P.hp = Math.min(P.hp, maxHp()); saveGame(); return true;
}
function unequipSlot(slot) { if (slot === 'weapon') return; P.equip[slot] = null; applyEquipVisuals(); P.hp = Math.min(P.hp, maxHp()); saveGame(); }

/* loot table: potions, gear matching the map tier (boss: always gear, one tier higher) */
function rollDrops(e) {         // + upgrade materials: bosses always drop 4-7, normal mobs 7%
  if (e.T.matOnly) { var mo = []; if (Math.random() < 0.7) for (var mq = randInt(1, 3); mq > 0; mq--) mo.push(pickMaterial()); if (Math.random() < 0.10) mo.push('godzilla_fragment'); return mo; }   // Wonderland mobs: refine stones + gold only
  var out = rollDropsBase(e);
  if (e.T.fragDrop) for (var fq = randInt(e.T.fragDrop[0], e.T.fragDrop[1]); fq > 0; fq--) out.push('godzilla_fragment');   // world boss: 10-15 Godzilla Fragments
  if (e.T.celestial) { if (e.T.boss) { out.push(CELESTIAL_ITEMS[randInt(0, 5)]); if (Math.random() < e.T.celestial) out.push(CELESTIAL_ITEMS[randInt(0, 5)]); } else if (Math.random() < e.T.celestial) out.push(CELESTIAL_ITEMS[randInt(0, 5)]); }
  if (e.T.boss) { for (var q = randInt(4, 7); q > 0; q--) out.push(pickMaterial()); }
  else if (Math.random() < 0.07) out.push(pickMaterial());
  return out;
}
function rollDropsBase(e) {
  if (e.T.lootPool) {            // Bad Santa: guaranteed Crimson Eye Blade or Clockwork Wings
    var pl = e.T.lootPool, o2 = [pl[randInt(0, pl.length - 1)], 'hp_potion', 'mp_potion'];
    if (Math.random() < 0.4) o2.push(pl[randInt(0, pl.length - 1)]);
    return o2;
  }
  if (e.T.bossLoot) {            // Abyss boss: guaranteed boss-only item(s)
    var o = [BOSS_ITEMS[randInt(0, BOSS_ITEMS.length - 1)], 'hp_potion', 'mp_potion'];
    if (Math.random() < 0.35) o.push(BOSS_ITEMS[randInt(0, BOSS_ITEMS.length - 1)]);
    return o;
  }
  var T = e.T, out = [], boss = T.boss;
  if (Math.random() < (boss ? 1 : 0.2)) out.push('hp_potion');
  if (Math.random() < (boss ? 1 : 0.14)) out.push('mp_potion');
  if (Math.random() < (boss ? 1 : 0.05)) {
    var tier = clamp((curMap ? curMap.tier : 1) + (boss ? 1 : (Math.random() < 0.3 ? 1 : 0)), 1, 5);
    var slot = SLOTS[randInt(0, SLOTS.length - 1)];
    out.push(slot + tier);
  }
  if (T.key === 'demon') out.push('dragon_blade');
  return out;
}
