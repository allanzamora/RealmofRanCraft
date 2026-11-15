/* enemies.js - enemy roster (data). 7 regular + 1 boss per map. */
/* ---- enemy roster ---- */
var ENEMY_TYPES = {};
// role: 'm' melee, 'b' brute (more hp/slower), 'f' fast/fragile
function E(key, name, lvl, role, scale, weapon, look, extra) {
  var hpMul = role === 'b' ? 1.45 : (role === 'f' ? 0.8 : 1), atkMul = role === 'b' ? 1.15 : (role === 'f' ? 1.1 : 1);
  var boss = !!(extra && extra.boss);
  var T = {
    key: key, name: name, lvl: lvl, scale: scale, boss: boss,
    hp: Math.round((45 + 11 * Math.pow(lvl, 1.7)) * hpMul * (boss ? 3.2 : 1) * (extra && extra.hpMul || 1)),
    atk: Math.round((5 + 2.2 * Math.pow(lvl, 1.15)) * atkMul * (boss ? 1.5 : 1)),
    def: Math.round(lvl * 0.45), speed: (role === 'b' ? 2.4 : (role === 'f' ? 3.1 : 2.8)) + (boss ? 0 : 0),
    aggro: boss ? 20 : 10 + Math.min(4, lvl / 12), range: (weapon && (weapon.kind === 'greatsword' || weapon.kind === 'spear' || weapon.kind === 'staff') ? 2.2 : 1.7) * Math.max(1, scale * 0.9),
    cd: boss ? 1.5 : (role === 'f' ? 1.4 : 1.8),
    xp: Math.round((14 * Math.pow(lvl, 1.4) + 10) * (boss ? 4 : 1)), gold: [Math.round(lvl * 6 + 6), Math.round(lvl * 12 + 14)],
    weapon: weapon, look: look
  };
  if (boss) { T.gold = [lvl * 60, lvl * 90]; }
  ENEMY_TYPES[key] = T; return T;
}
function W(kind, color, glow) { return { kind: kind, color: color, glow: !!glow }; }

// ---------- Moviex Plains (Lv 1-12) ----------
E('goblin', 'Goblin Scout', 1, 'f', 0.78, W('dagger', 0xb0b0b0), { skin: 0x6fae3c, shirt: 0x6b4a2a, pants: 0x4a3a2a, hair: null, bald: true, ears: true, eye: 0xffee00, eyeGlow: true });
E('bandit', 'Bandit Thief', 2, 'f', 1.0, W('dagger', 0xc0c0c0), { skin: 0xe0b896, shirt: 0x4a4a52, pants: 0x2f2f38, hair: 0x1a1a1a, cape: 0x3a2a2a });
E('skeleton', 'Skeleton Warrior', 3, 'm', 1.0, W('sword', 0x9a9a9a), { skin: 0xe9e6d8, shirt: 0xd8d4c2, pants: 0xd0ccb8, hair: null, bald: true, thin: true, bone: true, eye: 0xff2a2a, eyeGlow: true, boots: 0xbdb8a4 });
E('shaman', 'Goblin Shaman', 4, 'm', 0.85, W('staff', 0xb066ff, true), { skin: 0x4f9a3a, shirt: 0x6a2f8a, pants: 0x3a2a4a, hair: null, bald: true, ears: true, eye: 0x66ffcc, eyeGlow: true, cape: 0x4a1f6a });
E('orc', 'Orc Brute', 5, 'b', 1.22, W('axe', 0x8a8f96), { skin: 0x5f7f3a, shirt: 0x5a3a22, pants: 0x3d2b1a, hair: 0x111111, tusks: true, bulk: 1.28, pads: true, padColor: 0x4a3a2a, eye: 0xff5522, eyeGlow: true });
E('knight', 'Dark Knight', 8, 'm', 1.12, W('greatsword', 0x4b4b66), { skin: 0xd9b08c, shirt: 0x2b2b4a, pants: 0x1f1f35, armor: 0x34344d, helmet: true, pads: true, padColor: 0x3d3d5c, cape: 0x5a0f2f, bulk: 1.12 });
E('warlord', 'Orc Warlord', 10, 'b', 1.35, W('greatsword', 0x8a8f96), { skin: 0x4f6f30, shirt: 0x6a1f1f, pants: 0x2a1a10, hair: 0x111111, tusks: true, bulk: 1.35, pads: true, padColor: 0x5a1a1a, cape: 0x5a0f0f, eye: 0xff3322, eyeGlow: true });
E('demon', 'Demon Lord Vorgath', 12, 'b', 1.75, W('greatsword', 0xff4a1a, true), { skin: 0xa02424, shirt: 0x2a0a0a, pants: 0x1a0505, hair: null, bald: true, horns: true, pads: true, padColor: 0x1a1a1a, cape: 0x3a0000, bulk: 1.3, eye: 0xffcc00, eyeGlow: true }, { boss: true });

// ---------- Whispering Nature (Lv 10-21) ----------
E('poacher', 'Poacher', 10, 'f', 1.0, W('spear', 0x8a6a3a), { skin: 0xe0b896, shirt: 0x4a6a2a, pants: 0x5a4a2a, hair: 0x5a3a1a, cape: 0x3a5a22 });
E('elf', 'Wild Elf', 11, 'f', 1.0, W('sword', 0x9fe0b0, true), { skin: 0xe8d0b0, shirt: 0x2f7a4a, pants: 0x3a5a3a, hair: 0xd8d070, ears: true, pads: true, padColor: 0x2f6a3a });
E('druid', 'Forest Druid', 13, 'm', 1.0, W('staff', 0x7ad07a, true), { skin: 0xd8b896, shirt: 0x2f6a3a, pants: 0x2a4a2a, hair: 0xcccccc, cape: 0x2f5a2a });
E('bark', 'Bark Golem', 14, 'b', 1.35, W('axe', 0x6a4a2a), { skin: 0x6a4a2a, shirt: 0x5a3a1a, pants: 0x4a2f14, hair: null, bald: true, bulk: 1.5, eye: 0xffaa33, eyeGlow: true, pads: true, padColor: 0x4a3a1a });
E('satyr', 'Satyr Raider', 16, 'm', 1.1, W('axe', 0x9a9a9a), { skin: 0xb07a4a, shirt: 0x7a4a2a, pants: 0x5a3a1a, hair: 0x2a1a0a, horns: true, ears: true, bulk: 1.1 });
E('witch', 'Vine Witch', 17, 'm', 1.0, W('staff', 0xb066ff, true), { skin: 0x9ac07a, shirt: 0x4a2a6a, pants: 0x2f2f4a, hair: 0x1a3a1a, cape: 0x2a1a4a, eye: 0xaaff44, eyeGlow: true });
E('ent', 'Ent Guardian', 19, 'b', 1.6, W('greatsword', 0x5a6a2a), { skin: 0x4a5a2a, shirt: 0x3a4a1f, pants: 0x2f3a14, hair: null, bald: true, bulk: 1.5, pads: true, padColor: 0x3a4a1f, eye: 0x99ff33, eyeGlow: true });
E('treant', 'Elder Treant King', 21, 'b', 2.0, W('greatsword', 0x6a8a2a, true), { skin: 0x3a4a1a, shirt: 0x2a3a10, pants: 0x1f2a0a, hair: null, bald: true, horns: true, bulk: 1.4, pads: true, padColor: 0x2a3a10, cape: 0x1f3a14, eye: 0xff6a00, eyeGlow: true }, { boss: true });

// ---------- Scorched Desert (Lv 18-29) ----------
E('sandbandit', 'Sand Bandit', 18, 'f', 1.0, W('sword', 0xcfcfcf), { skin: 0xd0a070, shirt: 0xc8a060, pants: 0x7a5a30, hair: 0x2a1a0a });
E('nomad', 'Desert Nomad', 19, 'm', 1.0, W('spear', 0xcccccc), { skin: 0xc09060, shirt: 0xe0d0a0, pants: 0xb89860, hair: 0x111111, cape: 0xc8a060 });
E('scorp', 'Scorpion Cultist', 21, 'f', 1.0, W('dagger', 0x9a9a2a, true), { skin: 0xb08060, shirt: 0x4a1a1a, pants: 0x2a1a1a, hair: null, bald: true, cape: 0x3a0a0a, eye: 0xff3333, eyeGlow: true });
E('mummy', 'Cursed Mummy', 22, 'm', 1.05, W('sword', 0x8a7a50), { skin: 0xd8cfae, shirt: 0xe6dec0, pants: 0xd8cfae, hair: null, bald: true, thin: true, eye: 0x66ffff, eyeGlow: true, boots: 0xcfc6a0 });
E('wraith', 'Sand Wraith', 24, 'f', 1.05, W('staff', 0xffe066, true), { skin: 0x8a7a5a, shirt: 0x6a5a3a, pants: 0x4a3a1a, hair: null, bald: true, thin: true, cape: 0x8a7a5a, eye: 0x66ffff, eyeGlow: true });
E('anubis', 'Anubis Guard', 26, 'm', 1.2, W('spear', 0xffd54f, true), { skin: 0x3a2a1a, shirt: 0xd4a82a, pants: 0x2a1a10, armor: 0xd4a82a, helmet: true, pads: true, padColor: 0xd4a82a, cape: 0x1a3a6a, bulk: 1.2 });
E('sandgolem', 'Sand Golem', 27, 'b', 1.55, W('axe', 0xa08040), { skin: 0xc09a5a, shirt: 0xa08040, pants: 0x806030, hair: null, bald: true, bulk: 1.6, eye: 0xff7a00, eyeGlow: true, pads: true, padColor: 0x8a6a30 });
E('pharaoh', 'Pharaoh Khenti', 29, 'b', 1.8, W('greatsword', 0xffd54f, true), { skin: 0x8a6a3a, shirt: 0x2a1a6a, pants: 0x1a1030, armor: 0xd4a82a, helmet: true, pads: true, padColor: 0xffd54f, cape: 0x2a1a6a, bulk: 1.3, eye: 0x66ffff, eyeGlow: true }, { boss: true });

// ---------- Frostpeak Snowfield (Lv 26-37) ----------
E('frostbandit', 'Frost Bandit', 26, 'f', 1.0, W('sword', 0xbfe0ff), { skin: 0xe8c8b0, shirt: 0x4a6a8a, pants: 0x2a3a5a, hair: 0x99aabb, cape: 0x3a5a7a });
E('icegoblin', 'Ice Goblin', 27, 'f', 0.88, W('dagger', 0xbfe0ff, true), { skin: 0x8fd0e8, shirt: 0x4a7aa8, pants: 0x2a4a6a, hair: null, bald: true, ears: true, eye: 0x00ffff, eyeGlow: true });
E('icemage', 'Ice Mage', 29, 'm', 1.0, W('staff', 0x66e0ff, true), { skin: 0xcfe8f5, shirt: 0x3a5aa8, pants: 0x2a3a6a, hair: 0xeeeeff, cape: 0x2a4a9a });
E('draugr', 'Frozen Draugr', 31, 'm', 1.05, W('sword', 0x9fd0e8), { skin: 0x8fb8d0, shirt: 0x4a6a80, pants: 0x2a4a60, hair: null, bald: true, thin: true, bone: true, eye: 0x66ffff, eyeGlow: true });
E('berserker', 'Snow Berserker', 32, 'b', 1.12, W('axe', 0xbfc9d8), { skin: 0xe0b896, shirt: 0x6a4a2a, pants: 0x3a3a3a, hair: 0xcc6a2a, bulk: 1.25, pads: true, padColor: 0x8a7a6a });
E('yeti', 'Yeti Brute', 34, 'b', 1.5, null, { skin: 0xeaf2f8, shirt: 0xdfe9f2, pants: 0xdfe9f2, hair: null, bald: true, ears: true, bulk: 1.6, eye: 0x3399ff, eyeGlow: true, boots: 0xc8d4e0 });
E('frostgiant', 'Frost Giant', 35, 'b', 1.7, W('greatsword', 0x9fd0ff, true), { skin: 0x9ac0dd, shirt: 0x4a6a8a, pants: 0x2a3a5a, armor: 0x6a8aa8, helmet: true, pads: true, padColor: 0x6a8aa8, bulk: 1.5 });
E('icequeen', 'Ice Queen Elsara', 37, 'b', 1.55, W('greatsword', 0xaaf0ff, true), { skin: 0xcfe8f5, shirt: 0x6ab7ff, pants: 0x2a5aa8, hair: 0xaad4ff, horns: true, cape: 0x2a6ab8, bulk: 1.05, eye: 0x66ffff, eyeGlow: true }, { boss: true });

// ---------- Neon Ruins City (Lv 34-46) ----------
E('thug', 'Street Thug', 34, 'm', 1.05, W('mace', 0x888888), { skin: 0xd0a080, shirt: 0x3a3a3a, pants: 0x222a3a, hair: 0x111111, bulk: 1.1 });
E('punk', 'Neon Punk', 36, 'f', 1.0, W('dagger', 0xff3ad0, true), { skin: 0xe0b896, shirt: 0xd02a7a, pants: 0x1a1a2a, hair: 0x22e0e0, pads: true, padColor: 0x222233 });
E('guard', 'Riot Guard', 38, 'b', 1.2, W('spear', 0xaaaaaa), { skin: 0xd9b08c, shirt: 0x1a2a4a, pants: 0x1a2a4a, armor: 0x2a3a5a, helmet: true, pads: true, padColor: 0x2a3a5a, bulk: 1.2 });
E('assassin', 'Shadow Assassin', 40, 'f', 1.0, W('dagger', 0xff3a3a, true), { skin: 0xd0b090, shirt: 0x1a1a1a, pants: 0x111111, hair: 0x111111, cape: 0x111111, eye: 0xff2222, eyeGlow: true });
E('zombie', 'Mutant Zombie', 41, 'b', 1.15, null, { skin: 0x6a8a5a, shirt: 0x5a4a3a, pants: 0x3a3a2a, hair: 0x222222, bulk: 1.15, eye: 0xff2a2a, eyeGlow: true });
E('ninja', 'Cyber Ninja', 42, 'f', 1.0, W('sword', 0x00ffcc, true), { skin: 0xd0b090, shirt: 0x15202a, pants: 0x0a1018, armor: 0x15202a, helmet: true, eye: 0x00ffcc, eyeGlow: true });
E('mech', 'Mech Soldier', 44, 'b', 1.3, W('greatsword', 0x33ccff, true), { skin: 0x9aa3ad, shirt: 0x6a737d, pants: 0x4a535d, hair: null, bald: true, armor: 0x7a8591, helmet: true, pads: true, padColor: 0x5a6571, bulk: 1.3, eye: 0x33ff66, eyeGlow: true });
E('overlord', 'Neo Tyrant Overlord', 46, 'b', 1.85, W('greatsword', 0xff33cc, true), { skin: 0x9aa3ad, shirt: 0x2a2f3a, pants: 0x1a1f2a, armor: 0x2a2f3a, helmet: true, pads: true, padColor: 0x2a2f3a, cape: 0x5a0f5a, bulk: 1.3, eye: 0xff33cc, eyeGlow: true }, { boss: true });

// ---------- Hellfire Demon Realm (Lv 42-55) ----------
E('imp', 'Fire Imp', 42, 'f', 0.82, W('dagger', 0xff6a2a, true), { skin: 0xd04a2a, shirt: 0x4a1a1a, pants: 0x2a0a0a, hair: null, bald: true, horns: true, ears: true, eye: 0xffee00, eyeGlow: true });
E('cultist', 'Blood Cultist', 43, 'm', 1.0, W('sword', 0xaa2a2a, true), { skin: 0xc8a090, shirt: 0x3a0a0a, pants: 0x1a0505, hair: 0x111111, cape: 0x4a0a0a, eye: 0xff2a2a, eyeGlow: true });
E('fallen', 'Fallen Angel', 45, 'f', 1.05, W('sword', 0x8a8aff, true), { skin: 0xcfa0a0, shirt: 0x2a2a3a, pants: 0x1a1a2a, hair: 0xeeeeee, cape: 0x1a1a2a, eye: 0xff6a00, eyeGlow: true });
E('hellknight', 'Hell Knight', 47, 'm', 1.15, W('greatsword', 0xff4a1a, true), { skin: 0xd9b08c, shirt: 0x3a0a0a, pants: 0x1a0505, armor: 0x4a0a0a, helmet: true, pads: true, padColor: 0x6a1a1a, cape: 0x3a0000, bulk: 1.2, eye: 0xffaa00, eyeGlow: true });
E('lavabrute', 'Lava Brute', 49, 'b', 1.45, W('axe', 0xff6a1a, true), { skin: 0x8a2a1a, shirt: 0x2a1a1a, pants: 0x1a0a0a, hair: null, bald: true, horns: true, bulk: 1.5, eye: 0xffcc00, eyeGlow: true, pads: true, padColor: 0x2a1a1a });
E('demonmage', 'Demon Warlock', 51, 'm', 1.1, W('staff', 0xff44ff, true), { skin: 0x7a1a4a, shirt: 0x2a0a3a, pants: 0x1a0a2a, hair: null, bald: true, horns: true, cape: 0x3a0a4a, eye: 0xff66ff, eyeGlow: true });
E('pitlord', 'Pit Lord', 52, 'b', 1.7, W('greatsword', 0xff2a00, true), { skin: 0x6a0a0a, shirt: 0x1a0505, pants: 0x0a0000, hair: null, bald: true, horns: true, bulk: 1.4, pads: true, padColor: 0x1a1a1a, cape: 0x2a0000, eye: 0xffee00, eyeGlow: true });
E('malphas', 'Archdemon Malphas', 55, 'b', 2.1, W('greatsword', 0xff00aa, true), { skin: 0x4a0a2a, shirt: 0x1a0510, pants: 0x0a0008, hair: null, bald: true, horns: true, bulk: 1.4, pads: true, padColor: 0x1a0a14, cape: 0x3a0020, eye: 0xff00aa, eyeGlow: true }, { boss: true });


var ENEMIES_PER_TYPE = 20;     // 2.5x of the old 8 per type: 7 x 20 = 140 + boss per map
var RESPAWN_TIME = [6, 10];    // seconds (was 12-20): 2x faster

/* ---------- Abyss Throne (boss map): ONE Lv 60 boss ---------- */
E('abyss', 'Abyss Sovereign', 60, 'b', 3.0, W('greatsword', 0xaa44ff, true), { skin: 0x3a2a4a, shirt: 0x1a1030, pants: 0x120a22, hair: null, bald: true, horns: true, eye: 0xff44ff, eyeGlow: true, bulk: 1.4, pads: true, padColor: 0x2a1a44, armor: 0x2a1a44, cape: 0x5a1a7a }, { boss: true });
ENEMY_TYPES.abyss.bossLoot = true;

/* ---------- Bad Santa's Lair (boss map): bigger than the Abyss Sovereign, casts skills ---------- */
E('santa', 'Bad Santa', 60, 'b', 4.6, W('cane', 0xd01818), { skin: 0xe0b090, shirt: 0xc41e1e, pants: 0xa01010, hair: null, bald: true, santa: true, bulk: 1.5, pads: true, padColor: 0xf4f4f4, eye: 0xff3030, eyeGlow: true, cape: 0xc41e1e }, { boss: true, hpMul: 1.6 });
ENEMY_TYPES.santa.lootPool = ['santa_weapon', 'santa_wings', 'santaset_helmet', 'santaset_armor', 'santaset_pants', 'santaset_gloves'];
ENEMY_TYPES.santa.range = 4.6;
ENEMY_TYPES.santa.skills = ['slam', 'gifts', 'nova'];

ENEMY_TYPES.santa.hp += 50000;      // Bad Santa +50,000 HP
ENEMY_TYPES.abyss.hp += 40000;      // Abyss Sovereign +40,000 HP

/* ---------- Crocodile Island (Lv 60-80, 7 mobs + boss) ---------- */
E('hatchling', 'Swamp Hatchling', 60, 'f', 0.95, W('dagger', 0x9ac08a), { skin: 0x4f8a3a, shirt: 0x3a5a2a, pants: 0x2a3a1a, hair: null, bald: true, tusks: true, eye: 0xffee00, eyeGlow: true });
E('lurker', 'Mud Lurker', 62, 'm', 1.1, W('spear', 0x6a5a3a), { skin: 0x5a7a3a, shirt: 0x4a3a22, pants: 0x3a2a14, hair: null, bald: true, tusks: true, eye: 0xffaa22, eyeGlow: true });
E('crocwar', 'Croc Warrior', 65, 'm', 1.2, W('sword', 0xb0b8a8), { skin: 0x3f7a3a, shirt: 0x5a4a2a, pants: 0x3a2f1a, hair: null, bald: true, tusks: true, pads: true, padColor: 0x6a5a3a, bulk: 1.15, eye: 0xff5522, eyeGlow: true });
E('bogshaman', 'Bog Shaman', 68, 'm', 1.1, W('staff', 0x66ffaa, true), { skin: 0x3a6a4a, shirt: 0x1f4a3a, pants: 0x143028, hair: null, bald: true, tusks: true, cape: 0x143a2a, eye: 0x66ffcc, eyeGlow: true });
E('scalebrute', 'Scale Brute', 71, 'b', 1.55, W('axe', 0x8a8f96), { skin: 0x2f6a30, shirt: 0x4a3a22, pants: 0x2a2010, hair: null, bald: true, tusks: true, bulk: 1.45, pads: true, padColor: 0x3a5a2a, eye: 0xff3322, eyeGlow: true });
E('tidehunter', 'Tide Hunter', 75, 'f', 1.15, W('spear', 0x66d0ff, true), { skin: 0x4a8a6a, shirt: 0x1f5a7a, pants: 0x143a50, hair: null, bald: true, tusks: true, eye: 0x66e0ff, eyeGlow: true });
E('crocwarlord', 'Croc Warlord', 78, 'b', 1.75, W('greatsword', 0x9a9a6a), { skin: 0x2a5a2a, shirt: 0x5a1f1f, pants: 0x2a1a10, hair: null, bald: true, tusks: true, bulk: 1.5, pads: true, padColor: 0x5a1a1a, armor: 0x4a3a2a, cape: 0x5a1f1f, eye: 0xff2200, eyeGlow: true });
E('sobek', 'Sobek the Devourer', 80, 'b', 3.8, W('greatsword', 0x66ffaa, true), { skin: 0x2a6a30, shirt: 0x143a1a, pants: 0x0f2a12, hair: null, bald: true, tusks: true, horns: true, bulk: 1.45, pads: true, padColor: 0x1a4a22, armor: 0x1a4a22, cape: 0x0f2a12, eye: 0xffee22, eyeGlow: true }, { boss: true });
ENEMY_TYPES.sobek.celestial = 0.3; ENEMY_TYPES.sobek.range = 4.8;
ENEMY_TYPES.sobek.skills = ['slam', 'nova']; ENEMY_TYPES.sobek.skillNames = { slam: 'Death Roll!', nova: 'Tidal Surge!' };

/* ---------- Death Prison (Lv 80-100, 7 mobs + boss) ---------- */
E('inmate', 'Rotting Inmate', 80, 'm', 1.0, W('dagger', 0x8a8a8a), { skin: 0x9aa890, shirt: 0x6a6a5a, pants: 0x4a4a3a, hair: null, bald: true, thin: true, eye: 0xff2a2a, eyeGlow: true });
E('ghoul', 'Chain Ghoul', 83, 'm', 1.1, W('axe', 0x6a6a7a), { skin: 0x7a8a8a, shirt: 0x3a3a44, pants: 0x2a2a34, hair: null, bald: true, bone: true, thin: true, eye: 0x66ffcc, eyeGlow: true });
E('warden', 'Warden Guard', 86, 'b', 1.3, W('sword', 0xaab4c0), { skin: 0xd0a890, shirt: 0x2a3040, pants: 0x1a2030, armor: 0x3a4458, helmet: true, pads: true, padColor: 0x4a5468, bulk: 1.25, cape: 0x1a2030 });
E('jailer', 'Shadow Jailer', 89, 'f', 1.15, W('dagger', 0xaa66ff, true), { skin: 0x3a3a50, shirt: 0x1a1a28, pants: 0x101018, hair: null, bald: true, cape: 0x120a22, eye: 0xaa66ff, eyeGlow: true });
E('executioner', 'Executioner', 92, 'b', 1.6, W('axe', 0xff3322, true), { skin: 0x4a3a3a, shirt: 0x2a0a0a, pants: 0x1a0505, hair: null, bald: true, bulk: 1.5, pads: true, padColor: 0x2a1a1a, helmet: true, armor: 0x2a1a1a, eye: 0xff2200, eyeGlow: true });
E('reaper', 'Soul Reaper', 95, 'm', 1.3, W('staff', 0x66ffee, true), { skin: 0x8a9a9a, shirt: 0x14202a, pants: 0x0a1018, hair: null, bald: true, thin: true, cape: 0x0a1018, eye: 0x66ffee, eyeGlow: true });
E('prisonlord', 'Prison Overlord', 98, 'b', 1.8, W('greatsword', 0xaa44ff, true), { skin: 0x5a4a6a, shirt: 0x1a1030, pants: 0x0f0a20, hair: null, bald: true, horns: true, bulk: 1.5, pads: true, padColor: 0x2a1a44, armor: 0x2a1a44, cape: 0x1a0a30, eye: 0xff44ff, eyeGlow: true });
E('azrael', 'Death Warden Azrael', 100, 'b', 4.0, W('greatsword', 0xcc22ff, true), { skin: 0x3a3a50, shirt: 0x0a0a14, pants: 0x06060c, hair: null, bald: true, horns: true, bulk: 1.5, pads: true, padColor: 0x1a1030, armor: 0x16102a, cape: 0x0a0618, eye: 0xff2255, eyeGlow: true }, { boss: true });
ENEMY_TYPES.azrael.celestial = 0.6; ENEMY_TYPES.azrael.range = 5.0;
ENEMY_TYPES.azrael.skills = ['slam', 'gifts', 'nova']; ENEMY_TYPES.azrael.skillNames = { slam: 'Execution!', gifts: 'Soul Chains!', nova: 'Death Nova!' };
['inmate', 'ghoul', 'warden', 'jailer', 'executioner', 'reaper', 'prisonlord', 'hatchling', 'lurker', 'crocwar', 'bogshaman', 'scalebrute', 'tidehunter', 'crocwarlord'].forEach(function (k) { ENEMY_TYPES[k].celestial = 0.012; });

/* ---------- Edge Elites: spawn only at the rim of every normal map, and only while the player is near the edge ---------- */
E('voidstalker', 'Void Stalker', 94, 'f', 1.25, W('dagger', 0xb66bff, true), { skin: 0x3a2a55, shirt: 0x1a1030, pants: 0x0f0820, hair: null, bald: true, cape: 0x1a0a30, eye: 0xdd66ff, eyeGlow: true });
E('riftreaver', 'Rift Reaver', 97, 'm', 1.55, W('sword', 0x55e6ff, true), { skin: 0x2a4a5a, shirt: 0x0f2a3a, pants: 0x081a26, hair: null, bald: true, pads: true, padColor: 0x1a5a7a, armor: 0x144a66, bulk: 1.2, eye: 0x66f0ff, eyeGlow: true });
E('edgecolossus', 'Edge Colossus', 100, 'b', 2.1, W('axe', 0xff9a2a, true), { skin: 0x5a3a2a, shirt: 0x2a1408, pants: 0x1a0c04, hair: null, bald: true, horns: true, bulk: 1.5, pads: true, padColor: 0x6a3a14, armor: 0x4a2a10, eye: 0xffaa22, eyeGlow: true });
['voidstalker', 'riftreaver', 'edgecolossus'].forEach(function (k) { ENEMY_TYPES[k].celestial = 0.02; ENEMY_TYPES[k].edge = true; });
var EDGE_TYPES = ['voidstalker', 'riftreaver', 'edgecolossus'], EDGE_PER_TYPE = 14, EDGE_ACTIVE = 75;   // active when the player is within 75 of the rim

/* edge elites are re-levelled per map: they match the strongest level of the map they spawn in */
var EDGE_ROLE = { voidstalker: 'f', riftreaver: 'm', edgecolossus: 'b' };
function mapTopLvl(m) { return Math.max.apply(null, m.enemies.map(function (k) { return ENEMY_TYPES[k].lvl; })); }
function edgeType(k, lvl) {
  var key = k + '_' + lvl;
  if (!ENEMY_TYPES[key]) { var b = ENEMY_TYPES[k], T = E(key, b.name, lvl, EDGE_ROLE[k], b.scale, b.weapon, b.look); T.edge = true; T.celestial = lvl >= 60 ? 0.02 : 0; }
  return key;
}

/* ---------- Promise Wonderland: 4 Lv 100 mobs (refine stones + gold only) and the crowned boss Croczilla ---------- */
E('socmiya', 'SocMiya', 100, 'f', 1.15, W('card', 0xff2e7e), { skin: 0xf0c8a8, shirt: 0xf0c8a8, pants: 0xf0c8a8, hair: 0xff6fa8, thin: true, bikini: { top: 0xff2e7e, bottom: 0xff2e7e }, pigtails: true, eye: 0x331122 });
E('kierupt', 'Kierupt', 100, 'b', 1.3, W('fist', 0xcccccc), { skin: 0xd8a878, shirt: 0x8a3a3a, pants: 0x3a3a4a, hair: 0x2a1a10, bulk: 2.0, belly: true, eye: 0x221100 });
E('fakeold', 'FakeOld', 100, 'f', 1.1, W('camera', 0x222222), { skin: 0xe0b890, shirt: 0x4a6a8a, pants: 0x3a3a3a, hair: 0xd0d0d0, eye: 0x111111 });
E('thesilent', 'TheSilent', 100, 'm', 1.15, W('fist', 0xcccccc), { skin: 0xb0b4b8, shirt: 0x2a2a30, pants: 0x1a1a20, hair: null, bald: true, faceless: true });
ENEMY_TYPES.socmiya.range = 14; ENEMY_TYPES.socmiya.aggro = 22; ENEMY_TYPES.socmiya.throwKind = 'card'; ENEMY_TYPES.socmiya.onHit = { slow: { mul: 0.7, t: 5 } };
ENEMY_TYPES.fakeold.range = 15; ENEMY_TYPES.fakeold.aggro = 22; ENEMY_TYPES.fakeold.throwKind = 'camera';
ENEMY_TYPES.kierupt.range = 2.6;
ENEMY_TYPES.thesilent.range = 2.0; ENEMY_TYPES.thesilent.onHit = { poison: { dps: 100, t: 5 } };
['socmiya', 'kierupt', 'fakeold', 'thesilent'].forEach(function (k) { ENEMY_TYPES[k].matOnly = true; });

E('croczilla', 'Croczilla', 100, 'b', 5.4, W('fist', 0xffd54f), { skin: 0x2a6a30, shirt: 0x2a6a30, pants: 0x2a6a30, hair: null, bald: true }, { boss: true, hpMul: 2.4 });
ENEMY_TYPES.croczilla.hp = 700000;   // Croczilla: 700,000 HP
ENEMY_TYPES.croczilla.croc = true; ENEMY_TYPES.croczilla.range = 10; ENEMY_TYPES.croczilla.lootPool = ['godzilla_sword', 'godset_wings'];   // helmet / armor / gloves / pants are crafted (Item Craft NPC)
ENEMY_TYPES.croczilla.skills = ['slam', 'gifts', 'nova']; ENEMY_TYPES.croczilla.skillNames = { slam: 'Crown Crush!', gifts: 'Gold Rain!', nova: 'Royal Roar!' };
