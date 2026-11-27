/* items.js - gear (6 slots x tiers), potions, icons */

var MAX_LVL = 150;
var XP_CUTOFF = 10;          // hero this many levels above a mob gets no XP (loot only)

/* ---- gear: 6 slots x tiers (generated) ---- */
var SLOTS = ['weapon', 'helmet', 'armor', 'pants', 'gloves', 'wings'];               // slots that random gear / shop gear is generated for
var EQ_SLOTS = SLOTS.concat(['necklace', 'ringL', 'ringR', 'aura']);                           // every slot a hero can wear
var SLOT_INFO = {
  weapon: { label: 'Sword', pl: 'Swords', icon: '⚔' }, helmet: { label: 'Helmet', pl: 'Helmets', icon: '🪖' }, armor: { label: 'Armor', pl: 'Armors', icon: '🛡' },
  pants: { label: 'Pants', pl: 'Pants', icon: '👖' }, gloves: { label: 'Gloves', pl: 'Gloves', icon: '🧤' }, wings: { label: 'Wings', pl: 'Wings', icon: '🪽' },
  necklace: { label: 'Necklace', pl: 'Necklaces', icon: '📿' }, ringL: { label: 'Ring Left', pl: 'Left Rings', icon: '💍' }, ringR: { label: 'Ring Right', pl: 'Right Rings', icon: '💍' }, aura: { label: 'Aura', pl: 'Auras', icon: '🔆' }
};
var AURA_IDS = [];
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
COSTUME_DEFS.cos_wing_halo = { id: 'cos_wing_halo', slot: 'wings', name: 'Halo Ring Wings', emoji: '💫', diamonds: 2000, model: 'cw1', color: 0x8af4ff, stats: { hp: 8000, hpRegen: 200, mpRegen: 60, spd: 0.4, def: 200 }, desc: 'Floating glowing rings with orbiting light orbs.' };
COSTUME_DEFS.cos_wing_prism = { id: 'cos_wing_prism', slot: 'wings', name: 'Prism Butterfly Wings', emoji: '🦋', diamonds: 2000, model: 'cw2', color: 0x9a4ae0, stats: { hp: 8000, hpRegen: 200, mpRegen: 60, spd: 0.4, def: 200 }, desc: 'Big translucent purple and pink butterfly wings that flap.' };
COSTUME_DEFS.cos_wing_crystal = { id: 'cos_wing_crystal', slot: 'wings', name: 'Crystal Shard Wings', emoji: '💎', diamonds: 2000, model: 'cw3', color: 0x40d8ff, stats: { hp: 8000, hpRegen: 200, mpRegen: 60, spd: 0.4, def: 200 }, desc: 'Floating cyan and pink crystal blades fanned out behind you.' };
COSTUME_DEFS.cos_wing_ember = { id: 'cos_wing_ember', slot: 'wings', name: 'Ember Plume Wings', emoji: '🔥', diamonds: 2000, model: 'cw4', color: 0xff6a1a, stats: { hp: 8000, hpRegen: 200, mpRegen: 60, spd: 0.4, def: 200 }, desc: 'Streaming flame feathers with drifting embers.' };
COSTUME_DEFS.cos_wing_jet = { id: 'cos_wing_jet', slot: 'wings', name: 'Jet Thruster Wings', emoji: '🚀', diamonds: 2000, model: 'cw5', color: 0x6af0ff, stats: { hp: 8000, hpRegen: 200, mpRegen: 60, spd: 0.4, def: 200 }, desc: 'Mechanical jet pods with cyan exhaust and small fins.' };
COSTUME_DEFS.cos_sw_frost = { id: 'cos_sw_frost', slot: 'weapon', name: 'Frost Fang Sword', emoji: '🧊', diamonds: 1000, kind: 'sw_frost', color: 0xaeeeff, glow: true, stats: { atk: 2500 }, desc: 'A jagged ice-crystal blade with a snowflake guard and drifting frost sparks.' };
COSTUME_DEFS.cos_sw_plasma = { id: 'cos_sw_plasma', slot: 'weapon', name: 'Plasma Saber', emoji: '🔮', diamonds: 1000, kind: 'sw_plasma', color: 0xff3ad8, glow: true, stats: { atk: 2500 }, desc: 'A pulsing magenta energy beam from a metal hilt.' };
COSTUME_DEFS.cos_sw_thorn = { id: 'cos_sw_thorn', slot: 'weapon', name: 'Thorn Vine Blade', emoji: '🌿', diamonds: 1000, kind: 'sw_thorn', color: 0x2f9a3a, glow: true, stats: { atk: 2500 }, desc: 'A serrated green blade wrapped in thorny vines with a poison glow.' };
COSTUME_DEFS.cos_sw_void = { id: 'cos_sw_void', slot: 'weapon', name: 'Void Edge', emoji: '🌑', diamonds: 1000, kind: 'sw_void', color: 0xb44aff, glow: true, stats: { atk: 2500 }, desc: 'A black blade with violet cracks and orbiting dark orbs.' };
COSTUME_DEFS.cos_sw_storm = { id: 'cos_sw_storm', slot: 'weapon', name: 'Storm Bolt Sword', emoji: '⚡', diamonds: 1000, kind: 'sw_storm', color: 0x56b4ff, glow: true, stats: { atk: 2500 }, desc: 'A zig-zag lightning blade crackling with electric arcs.' };
COSTUME_DEFS.cos_hair_ice = { id: 'cos_hair_ice', slot: 'helmet', name: 'Ice Crystal Hair', emoji: '❄️', diamonds: 1000, model: 'hm1', color: 0x9fe8ff, stats: { atk: 1000, exp: 10 }, desc: 'Spiky icy crystal hair with drifting snow sparkles.' };
COSTUME_DEFS.cos_hair_flame = { id: 'cos_hair_flame', slot: 'helmet', name: 'Blazing Flame Hair', emoji: '🔥', diamonds: 1000, model: 'hm2', color: 0xff6a1a, stats: { atk: 1000, exp: 10 }, desc: 'Hair of living flames that flicker and sway.' };
COSTUME_DEFS.cos_hair_neon = { id: 'cos_hair_neon', slot: 'helmet', name: 'Neon Mohawk', emoji: '🎸', diamonds: 1000, model: 'hm3', color: 0xff2ad0, stats: { atk: 1000, exp: 10 }, desc: 'A tall glowing pink and cyan mohawk fin.' };
COSTUME_DEFS.cos_hair_horn = { id: 'cos_hair_horn', slot: 'helmet', name: 'Demon Horn Crown', emoji: '😈', diamonds: 1000, model: 'hm4', color: 0xff2a2a, stats: { atk: 1000, exp: 10 }, desc: 'A black helm with curved horns, a red gem and rising embers.' };
COSTUME_DEFS.cos_hair_sakura = { id: 'cos_hair_sakura', slot: 'helmet', name: 'Sakura Topknot', emoji: '🌸', diamonds: 1000, model: 'hm5', color: 0xff8ab8, stats: { atk: 1000, exp: 10 }, desc: 'A pink topknot with a golden pin and swirling blossom petals.' };
COSTUME_DEFS.cos_ct1_armor = { id: 'cos_ct1_armor', slot: 'armor', name: 'Frost Armor', emoji: '🛡️', diamonds: 1000, model: 'ct1', color: 0xcfeaff, padColor: 0x7ad0ff, stats: { hp: 2500, def: 120 }, desc: 'A icy white-blue plate with crystal spikes and a snowflake gem.' };
COSTUME_DEFS.cos_ct1_pants = { id: 'cos_ct1_pants', slot: 'pants', name: 'Frost Greaves', emoji: '👖', diamonds: 1000, model: 'ct1', color: 0xcfeaff, stats: { hp: 2500, def: 120 }, desc: 'Matching greaves of the Frost set.' };
COSTUME_DEFS.cos_ct1_gloves = { id: 'cos_ct1_gloves', slot: 'gloves', name: 'Frost Gauntlets', emoji: '🧤', diamonds: 1000, model: 'ct1', color: 0x9fe0ff, stats: { hp: 2500, def: 120 }, desc: 'Matching gauntlets of the Frost set.' };
COSTUME_DEFS.cos_ct2_armor = { id: 'cos_ct2_armor', slot: 'armor', name: 'Inferno Armor', emoji: '🛡️', diamonds: 1000, model: 'ct2', color: 0x4a1410, padColor: 0xff6a1a, stats: { hp: 2500, def: 120 }, desc: 'A dark red plate with orange flame fins and a glowing core.' };
COSTUME_DEFS.cos_ct2_pants = { id: 'cos_ct2_pants', slot: 'pants', name: 'Inferno Greaves', emoji: '👖', diamonds: 1000, model: 'ct2', color: 0x4a1410, stats: { hp: 2500, def: 120 }, desc: 'Matching greaves of the Inferno set.' };
COSTUME_DEFS.cos_ct2_gloves = { id: 'cos_ct2_gloves', slot: 'gloves', name: 'Inferno Gauntlets', emoji: '🧤', diamonds: 1000, model: 'ct2', color: 0xff6a1a, stats: { hp: 2500, def: 120 }, desc: 'Matching gauntlets of the Inferno set.' };
COSTUME_DEFS.cos_ct3_armor = { id: 'cos_ct3_armor', slot: 'armor', name: 'Neon Cyber Armor', emoji: '🛡️', diamonds: 1000, model: 'ct3', color: 0x1a1a24, padColor: 0x2affea, stats: { hp: 2500, def: 120 }, desc: 'A black tech plating with glowing neon stripes.' };
COSTUME_DEFS.cos_ct3_pants = { id: 'cos_ct3_pants', slot: 'pants', name: 'Neon Cyber Greaves', emoji: '👖', diamonds: 1000, model: 'ct3', color: 0x1a1a24, stats: { hp: 2500, def: 120 }, desc: 'Matching greaves of the Neon Cyber set.' };
COSTUME_DEFS.cos_ct3_gloves = { id: 'cos_ct3_gloves', slot: 'gloves', name: 'Neon Cyber Gauntlets', emoji: '🧤', diamonds: 1000, model: 'ct3', color: 0x2affea, stats: { hp: 2500, def: 120 }, desc: 'Matching gauntlets of the Neon Cyber set.' };
COSTUME_DEFS.cos_ct4_armor = { id: 'cos_ct4_armor', slot: 'armor', name: 'Void Demon Armor', emoji: '🛡️', diamonds: 1000, model: 'ct4', color: 0x2a1440, padColor: 0x7a2aff, stats: { hp: 2500, def: 120 }, desc: 'A purple-black plate with demon spikes, bone ribs and a red gem.' };
COSTUME_DEFS.cos_ct4_pants = { id: 'cos_ct4_pants', slot: 'pants', name: 'Void Demon Greaves', emoji: '👖', diamonds: 1000, model: 'ct4', color: 0x2a1440, stats: { hp: 2500, def: 120 }, desc: 'Matching greaves of the Void Demon set.' };
COSTUME_DEFS.cos_ct4_gloves = { id: 'cos_ct4_gloves', slot: 'gloves', name: 'Void Demon Gauntlets', emoji: '🧤', diamonds: 1000, model: 'ct4', color: 0x7a2aff, stats: { hp: 2500, def: 120 }, desc: 'Matching gauntlets of the Void Demon set.' };
COSTUME_DEFS.cos_ct5_armor = { id: 'cos_ct5_armor', slot: 'armor', name: 'Sakura Armor', emoji: '🛡️', diamonds: 1000, model: 'ct5', color: 0xffc0dc, padColor: 0xe0b040, stats: { hp: 2500, def: 120 }, desc: 'A pink silk plate with a gold obi belt, ribbons and petals.' };
COSTUME_DEFS.cos_ct5_pants = { id: 'cos_ct5_pants', slot: 'pants', name: 'Sakura Greaves', emoji: '👖', diamonds: 1000, model: 'ct5', color: 0xffc0dc, stats: { hp: 2500, def: 120 }, desc: 'Matching greaves of the Sakura set.' };
COSTUME_DEFS.cos_ct5_gloves = { id: 'cos_ct5_gloves', slot: 'gloves', name: 'Sakura Gauntlets', emoji: '🧤', diamonds: 1000, model: 'ct5', color: 0xe0b040, stats: { hp: 2500, def: 120 }, desc: 'Matching gauntlets of the Sakura set.' };
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
    kind: 'sword', type: 'gear', rare: true, fx: 'fire', bossOnly: true, set: 'Santa', model: 'santa', padColor: 0xf6f6f6 };
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

/* ---- Hunter Bow: sold by the Merchant (5000 G). While equipped, basic attacks fire arrows (ranged) ---- */
ITEMS.bow1 = { id: 'bow1', slot: 'weapon', name: 'Hunter Bow', tier: 2, lvl: 10, atk: 30, def: 0, hp: 0, price: 5000, color: 0x8a5a2a, glow: false, kind: 'bow', type: 'gear', emoji: '🏹', desc: '+30 ATK  ·  Ranged basic attack (arrows, 14m)' };
function isRangedWeapon() { var w = ITEMS[P.equip.weapon]; return !!w && (w.kind === 'bow' || w.kind === 'godbow'); }
/* Godzilla Bow: same stats as the Godzilla Sword, +50% attack speed, crafted (100 Godzilla Fragments) */
(function () {
  var s = ITEMS.godzilla_sword, b = {}; for (var k in s) b[k] = s[k];
  b.id = 'godzilla_bow'; b.name = 'Godzilla Bow'; b.kind = 'godbow'; b.color = 0x4d9fd8; b.aspd = 0.03; b.emoji = '🏹';
  b.baseDesc = s.baseDesc + '  +3% Attack Speed  ·  Ranged'; b.desc = b.baseDesc + '  ★ Atomic Breath'; ITEMS[b.id] = b;
})();
/* ---- jewelry (necklace + 2 rings): fixed stats, no random bonus. jw = visual style: 'god' | 'dark' | 'gm' | undefined (no visual) ---- */
var JEWELRY_IDS = [];
[{ id: 'godzilla_necklace', slot: 'necklace', name: 'Godzilla Necklace', hp: 2000, def: 1500, mp: 300, jw: 'god', lvl: 50, emoji: '📿', col: 0x1adcff },
 { id: 'godzilla_ring_l', slot: 'ringL', name: 'Godzilla Ring Left', hp: 1500, def: 1100, mp: 100, jw: 'god', lvl: 50, emoji: '💍', col: 0x1adcff },
 { id: 'godzilla_ring_r', slot: 'ringR', name: 'Godzilla Ring Right', hp: 1500, def: 1100, mp: 100, jw: 'god', lvl: 50, emoji: '💍', col: 0x1adcff },
 { id: 'dark_necklace', slot: 'necklace', name: 'Dark Necklace', hp: 3000, def: 2500, mp: 300, hpr: 200, jw: 'dark', lvl: 1, emoji: '📿', col: 0xb01040, drop: true },
 { id: 'dark_ring_l', slot: 'ringL', name: 'Dark Ring Left', hp: 3000, def: 2000, mp: 300, hpr: 200, jw: 'dark', lvl: 1, emoji: '💍', col: 0xb01040, drop: true },
 { id: 'dark_ring_r', slot: 'ringR', name: 'Dark Ring Right', hp: 3000, def: 2000, mp: 300, hpr: 200, jw: 'dark', lvl: 1, emoji: '💍', col: 0xb01040, drop: true },
 { id: 'gm_necklace', slot: 'necklace', name: 'GM Necklace', hp: 12000, def: 5000, mp: 300, hpr: 600, jw: 'gm', exp: 50, cdmg: 50, lvl: 1, emoji: '📿', col: 0x00ffd5, drop: true },
 { id: 'gm_ring_l', slot: 'ringL', name: 'GM Ring Left', hp: 10000, def: 5000, mp: 500, hpr: 600, jw: 'gm', exp: 50, cdmg: 50, lvl: 1, emoji: '💍', col: 0x00ffd5, drop: true },
 { id: 'gm_ring_r', slot: 'ringR', name: 'GM Ring Right', hp: 10000, def: 5000, mp: 500, hpr: 600, jw: 'gm', exp: 50, cdmg: 50, lvl: 1, emoji: '💍', col: 0x00ffd5, drop: true },
 { id: 'starter_necklace', slot: 'necklace', name: 'Starter Necklace', hp: 200, def: 20, mp: 60, lvl: 5, emoji: '📿', col: 0xb0b0b0, price: 10000 },
 { id: 'starter_ring_l', slot: 'ringL', name: 'Starter Ring Left', hp: 150, def: 10, mp: 30, lvl: 5, emoji: '💍', col: 0xb0b0b0, price: 10000 },
 { id: 'starter_ring_r', slot: 'ringR', name: 'Starter Ring Right', hp: 150, def: 10, mp: 30, lvl: 5, emoji: '💍', col: 0xb0b0b0, price: 10000 }].forEach(function (d) {
  var it = { id: d.id, slot: d.slot, name: d.name, tier: 9, lvl: d.lvl, atk: 0, def: d.def, hp: d.hp, mp: d.mp, hpr: d.hpr || 0, exp: d.exp || 0, cdmg: d.cdmg || 0, price: d.price || 250000, color: d.col, glow: !!d.jw, kind: 'sword', type: 'gear', rare: false, fixed: true, jw: d.jw, emoji: d.emoji, bossDrop: !!d.drop };
  it.baseDesc = '+' + d.hp + ' HP  +' + d.def + ' DEF  +' + d.mp + ' MP' + (d.hpr ? '  +' + d.hpr + ' HP Regen/s' : '') + (d.exp ? '  +' + d.exp + '% EXP Boost' : '') + (d.cdmg ? '  +' + d.cdmg + '% Crit Damage' : ''); it.desc = it.baseDesc; ITEMS[it.id] = it; JEWELRY_IDS.push(it.id);
});
function gearAspd() { var s = 0; EQ_SLOTS.forEach(function (sl) { var it = ITEMS[P.equip[sl]]; if (it && it.aspd) s += it.aspd * starMul(P.equip[sl]); }); return s; }

/* ---- item order => icon file (src/item1.png ... src/itemN.png) ---- */
var ITEM_ORDER = ['hp_potion', 'mp_potion', 'weapon0', 'weapon1', 'weapon2', 'weapon3', 'weapon4', 'weapon5', 'dragon_blade'];
['helmet', 'armor', 'pants', 'gloves', 'wings'].forEach(function (sl) { for (var i = 1; i <= 5; i++) ITEM_ORDER.push(sl + i); });
BOSS_ITEMS.forEach(function (id) { ITEM_ORDER.push(id); });
SANTA_ITEMS.forEach(function (id) { ITEM_ORDER.push(id); });
/* ---- upgrade materials (stackable) ---- */
var MATERIAL_IDS = ['burr_stone', 'luxury_stone', 'feather', 'accessory_stone'];
ITEMS.burr_stone = { name: 'Burr Stone', type: 'material', color: 0xd9722e, price: 1500, desc: 'Upgrades your Sword (up to +80)' };
ITEMS.luxury_stone = { name: 'Luxury Stone', type: 'material', color: 0x5ad0ff, price: 1500, desc: 'Upgrades Helmet, Armor, Pants and Gloves (up to +80)' };
ITEMS.feather = { name: 'Feather', type: 'material', color: 0xdff8f4, price: 2500, desc: 'Upgrades your Wings (up to +80)' };
ITEMS.accessory_stone = { name: 'Accessories Stone', type: 'material', emoji: '💎', color: 0xc77dff, price: 2500, desc: 'Upgrades your Necklace and Rings (up to +80)' };
MATERIAL_IDS.slice(0, 3).forEach(function (id) { ITEM_ORDER.push(id); });   // accessory_stone is added at the end so the numbered icons never shift
CELESTIAL_ITEMS.forEach(function (id) { ITEM_ORDER.push(id); });
GODZILLA_ITEMS.forEach(function (id) { ITEM_ORDER.push(id); });
SANTA_SET.forEach(function (id) { ITEM_ORDER.push(id); });
GODZILLA_SET.forEach(function (id) { ITEM_ORDER.push(id); });
/* crafted Godzilla gear carries Movement Speed (no longer rolled on drops) */
['god_helmet', 'godset_armor', 'godset_pants', 'godset_gloves'].forEach(function (id) { var it = ITEMS[id]; it.spd = 1.5; it.baseDesc += '  +1.5% Move Speed'; it.desc = it.baseDesc + '  ★ Atomic Breath'; });
ITEMS.godzilla_fragment = { name: 'Godzilla Fragment', type: 'material', color: 0x1adcff, price: 0, desc: 'Crafting material (Promise Wonderland mobs). Used by the Item Craft NPC.' };
ITEM_ORDER.push('godzilla_fragment');   // icon: src/item62.png
ITEM_ORDER.push('bow1');                // no icon file: shows the bow emoji
ITEMS.bus_card = { name: 'Special Bus Card', type: 'material', emoji: '🚌', color: 0xffd23a, price: 0, desc: 'Diamond Shop only. Travel to ANY map even if your level is too low. Expires 15 days after purchase.' };
/* Diamond Shop cards (single use) */
ITEMS.name_card = { name: 'Change Name Card', type: 'material', emoji: '🪪', price: 0, dprice: 150, icon: 'src/item_missing.png', desc: 'Change your character name (IGN). 1 use.' };
ITEMS.stat_card = { name: 'Reset Stat Card', type: 'material', emoji: '♻️', price: 0, dprice: 100, icon: 'src/item_missing.png', desc: 'Resets HP, Damage, Defence, Crit Rate and Crit Damage points to 0 and gives all the points back. 1 use.' };
ITEMS.hair_card = { name: 'Change Hairstyle Card', type: 'material', emoji: '💇', price: 0, dprice: 100, icon: 'src/item_missing.png', desc: 'Change your hairstyle - includes the new Emo and exclusive styles. 1 use.' };
ITEMS.color_card = { name: 'Change Hair Color Card', type: 'material', emoji: '🎨', price: 0, dprice: 100, icon: 'src/item_missing.png', desc: 'Change your hair colour (pick from many colours, with live preview). 1 use.' };
ITEMS.face_card = { name: 'Change Face Card', type: 'material', emoji: '😎', price: 0, dprice: 100, icon: 'src/item_missing.png', desc: 'Change your face (8 faces, with live preview). 1 use.' };
var BUS_DAYS = 15;
function nowSec() { return Math.floor(Date.now() / 1000); }
function hasBusCard() { if (P.inv.bus_card === 1) P.inv.bus_card = nowSec() + BUS_DAYS * 86400; return (P.inv.bus_card || 0) > nowSec(); }   // value = expiry time (epoch seconds); 15 days after purchase
function busLeftText() { var s = (P.inv.bus_card || 0) - nowSec(); if (s <= 0) return 'Expired'; var d = Math.floor(s / 86400), h = Math.floor(s % 86400 / 3600); return d + 'd ' + h + 'h left'; }
/* Golden Key: needed to enter the Golden Room. Using a key opens a 30-minute pass (leave and come back freely until it ends). */
ITEMS.golden_key = { name: 'Golden Key', type: 'material', emoji: '🗝️', color: 0xffd23a, price: 0, desc: 'Dropped by Dark Swordman (10%). Opens the Golden Room (Lv 100+). One key = 30 minutes inside.' };
var GOLD_PASS_MIN = 30;
function hasGoldenPass() { return (P.inv.golden_pass || 0) > nowSec(); }
function goldenPassText() { var s = (P.inv.golden_pass || 0) - nowSec(); return s > 0 ? Math.ceil(s / 60) + ' min left' : ''; }
function mapLevelOk(m) { return P.lvl >= m.min || hasBusCard(); }
function canEnterMap(m) { return mapLevelOk(m) && (!m.key || hasGoldenPass() || (P.inv.golden_key | 0) > 0); }
ITEM_ORDER.push('bus_card');            // no icon file: shows the bus emoji
ITEM_ORDER.push('godzilla_bow');        // icon: src/item_godbow.png (assigned below)
ITEM_ORDER.push('accessory_stone', 'golden_key');   // no icon files: show their emoji (keep NEW items at the END of this list)
ITEM_ORDER.forEach(function (id, i) { ITEMS[id].icon = iconUrl('src/item' + (i + 1) + '.png'); ITEMS[id].id = id; });
ITEMS.godzilla_bow.icon = iconUrl('src/item_godbow.png');

/* ---- inventory helpers ---- */
function giveItem(id, n) {
  var it = ITEMS[id]; n = n || 1;
  if (!it) return;
  if (it.type === 'potion' || it.type === 'material') P.inv[id] = (P.inv[id] || 0) + n;
  else if (P.owned.indexOf(id) < 0) P.owned.push(id);
}
function itemLabel(id) { return ITEMS[id].name; }

/* ---- upgrades: +1 ... +50, each level = +5% of the item's stats, costs gold + one material type ---- */
var MAX_UPG = 80, UPG_BONUS = 0.05;
/* success chance to reach level n (n = target +level) */
function upgRate(n) { return n <= 10 ? 1 : n <= 20 ? 0.8 : n <= 25 ? 0.7 : n <= 30 ? 0.6 : n <= 35 ? 0.55 : n <= 40 ? 0.5 : n <= 45 ? 0.4 : n <= 50 ? 0.3 : n <= 55 ? 0.2 : n <= 60 ? 0.1 : n <= 65 ? 0.05 : n <= 70 ? 0.02 : n <= 75 ? 0.01 : 0.003; }
function upgMat(slot) { return slot === 'weapon' ? 'burr_stone' : slot === 'wings' ? 'feather' : (slot === 'necklace' || slot === 'ringL' || slot === 'ringR') ? 'accessory_stone' : 'luxury_stone'; }
function upgLvl(id) { return (P.upg && P.upg[id]) | 0; }
function upgMul(id) { return 1 + UPG_BONUS * upgLvl(id); }
function upgGold(it, lvl) { return Math.round(250 * Math.pow(lvl + 1, 1.2) * (1 + (it.tier || 1) * 0.4)); }
function upgStones(lvl) { return 1 + Math.floor(lvl / 5); }
function itemName(id) { var l = upgLvl(id); return ITEMS[id].name + (l ? ' +' + l : ''); }
function pickMaterial() { var r = Math.random(); return r < 0.32 ? 'burr_stone' : r < 0.64 ? 'luxury_stone' : r < 0.82 ? 'feather' : 'accessory_stone'; }

/* ---- dropped gear gets 3 random stats: +Damage, +HP, HP regen, MP regen, Speed Up ---- */
var STAT_POOL = ['dmg', 'hp', 'hpr', 'mpr', 'crit', 'cdmg', 'spd', 'absorb'];
var BOSS_POOL = STAT_POOL;
var STAT_RANGE = { crit: [0.3, 1], cdmg: [0.5, 4], spd: [0.2, 0.5], absorb: [0.5, 1] };
function r1(a, b) { return Math.round(rand(a, b) * 10) / 10; }
function rollStats(tier, n, pool) {
  pool = (pool || STAT_POOL).slice(); n = n || 3; var out = [];
  for (var i = 0; i < n; i++) {
    var st = pool.splice(randInt(0, pool.length - 1), 1)[0], k = rand(0.6, 1.4), v;
    if (st === 'dmg') v = Math.round(k * (4 + 4 * tier));
    else if (st === 'hp') v = Math.round(k * 22 * tier * tier / 2 + 15);
    else if (st === 'hpr') v = Math.round(k * (0.5 + 0.6 * tier) * 10) / 10;
    else if (st === 'mpr') v = Math.round(k * (0.3 + 0.4 * tier) * 10) / 10;
    else v = r1(STAT_RANGE[st][0], STAT_RANGE[st][1]);
    out.push([st, v]);
  }
  return out;
}
function fixRolls(rolls) {   // old saves: bring crit / crit dmg / speed rolls into the new ranges (merged items are skipped by the caller)
  return (rolls || []).map(function (r) { var g = STAT_RANGE[r[0]]; return (g && (r[1] > g[1] || r[1] < g[0])) ? [r[0], r1(g[0], g[1])] : r; });
}
function statText(r) {
  var s = r[0], v = r[1];
  return s === 'dmg' ? '+' + v + ' Damage' : s === 'hp' ? '+' + v + ' HP' : s === 'hpr' ? '+' + v + ' HP Regen/s' : s === 'mpr' ? '+' + v + ' MP Regen/s' : s === 'crit' ? '+' + v + '% Crit Chance' : s === 'cdmg' ? '+' + v + '% Crit Damage' : s === 'absorb' ? '+' + v + '% Damage Absorb' : '+' + v + '% Move Speed';
}
var BASE_KEYS = [['atk', 'ATK', ''], ['def', 'DEF', ''], ['hp', 'HP', ''], ['mp', 'MP', ''], ['hpr', 'HP Regen/s', ''], ['mpr', 'MP Regen/s', ''], ['crit', 'Crit Chance', '%'], ['cdmg', 'Crit Damage', '%'], ['spd', 'Move Speed', '%'], ['absorb', 'Damage Absorb', '%'], ['exp', 'EXP', '%']];
function makeInstance(base, rolls, uid, bm) {
  var b = ITEMS[base]; if (!b) return null;
  rolls = rolls || [];
  var id = uid || (base + '~' + Math.random().toString(36).slice(2, 8)), it = Object.assign({}, b);
  it.id = id; it.base = base; it.rolls = rolls; bm = bm > 1 ? Math.min(1024, bm | 0) : 1; it.bm = bm;
  if (bm > 1) BASE_KEYS.forEach(function (k) { if (b[k[0]]) it[k[0]] = Math.round(b[k[0]] * bm * 10) / 10; });
  rolls.forEach(function (r) {
    if (r[0] === 'dmg') it.atk = (it.atk || 0) + r[1]; else if (r[0] === 'hp') it.hp = (it.hp || 0) + r[1];
    else if (r[0] === 'hpr') it.hpr = (it.hpr || 0) + r[1]; else if (r[0] === 'mpr') it.mpr = (it.mpr || 0) + r[1];
    else if (r[0] === 'crit') it.crit = (it.crit || 0) + r[1]; else if (r[0] === 'cdmg') it.cdmg = (it.cdmg || 0) + r[1]; else if (r[0] === 'absorb') it.absorb = (it.absorb || 0) + r[1]; else it.spd = (it.spd || 0) + r[1];
  });
  var bd = b.baseDesc || b.desc; if (bm > 1) bd = BASE_KEYS.filter(function (k) { return b[k[0]]; }).map(function (k) { return '+' + Math.round(b[k[0]] * bm * 10) / 10 + k[2] + ' ' + k[1]; }).join('  ') + '  (base x' + bm + ')';
  it.desc = bd + (b.rare ? '  ★ ' + FX_NAMES[b.fx] : '') + (rolls.length ? '  |  ' + rolls.map(statText).join('  ') : '');
  it.price = Math.round(b.price * 1.15);
  ITEMS[id] = it; P.rolls[id] = { base: base, r: rolls }; if (bm > 1) P.rolls[id].bm = bm;
  return id;
}
/* looting gear creates a unique copy with random stats; potions stack as before */
function giveDrop(id) {
  var it = ITEMS[id]; if (!it) return null;
  if (it.type !== 'gear') { giveItem(id, 1); return id; }
  if (it.fixed) { var fid = makeInstance(id, []); P.owned.push(fid); return fid; }   // jewelry: fixed stats
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
function rollDrops(e) {
  if (e.T.goldOnly) return [];                  // Prison Rooms: gold + EXP only, no item drops         // + upgrade materials: bosses always drop 4-7, normal mobs 7%
  if (e.T.matOnly) { var mo = []; if (Math.random() < 0.7) for (var mq = randInt(1, 3); mq > 0; mq--) mo.push(pickMaterial()); if (Math.random() < 0.10) mo.push('godzilla_fragment'); return mo; }   // Wonderland mobs: refine stones + gold only
  var out = rollDropsBase(e);
  if (e.T.jewelDrops) e.T.jewelDrops.forEach(function (d) { if (Math.random() < d[1]) out.push(d[0]); });   // Dark Swordman 8% / Game Master 1% per jewelry piece
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

/* ---- Aura: ground circle at the hero's feet (Diamond Shop) ---- */
[{ id: 'aura_basic', name: 'Basic Aura', hp: 1000, def: 250, dia: 10, col: 0x66e0ff, emoji: '🔆', st: '' },
  { id: 'aura_flame', name: 'Inferno Aura', hp: 5000, def: 550, dia: 350, col: 0xff6a1a, emoji: '🔥', st: 'flame' },
  { id: 'aura_frost', name: 'Frostbite Aura', hp: 5000, def: 550, dia: 350, col: 0x8fe8ff, emoji: '❄️', st: 'frost' },
  { id: 'aura_thunder', name: 'Thunderstorm Aura', hp: 5000, def: 550, dia: 350, col: 0xffe14a, emoji: '⚡', st: 'thunder' },
  { id: 'aura_toxic', name: 'Toxic Bloom Aura', hp: 5000, def: 550, dia: 350, col: 0x6dff3a, emoji: '☣️', st: 'toxic' },
  { id: 'aura_shadow', name: 'Shadow Rune Aura', hp: 5000, def: 550, dia: 350, col: 0x8a3cff, emoji: '🌑', st: 'shadow' },
  { id: 'aura_blossom', name: 'Sakura Blossom Aura', hp: 5000, def: 550, dia: 350, col: 0xff8ac8, emoji: '🌸', st: 'blossom' },
  { id: 'aura_holy', name: 'Holy Radiance Aura', hp: 5000, def: 550, dia: 350, col: 0xfff2a8, emoji: '✨', st: 'holy' },
  { id: 'aura_galaxy', name: 'Galaxy Orbit Aura', hp: 5000, def: 550, dia: 350, col: 0x6a7bff, emoji: '🪐', st: 'galaxy' }].forEach(function (d) {
  ITEMS[d.id] = { id: d.id, slot: 'aura', name: d.name, tier: 9, lvl: 1, atk: 0, def: d.def, hp: d.hp, mp: 0, price: d.dia * 1000, dprice: d.dia, color: d.col, glow: true, kind: 'sword', type: 'gear', rare: false, fixed: true, aura: true, astyle: d.st, emoji: d.emoji, desc: '+' + d.hp + ' HP  +' + d.def + ' DEF  ·  a glowing circle on the ground at your feet' };
  AURA_IDS.push(d.id);
});
