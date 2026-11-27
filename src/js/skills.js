/* skills.js - 25 skills (5 starters + 20 shop skills), 5 equip slots */
/* ---- skills: 25 total (5 starters + 20 to buy), 5 equip slots ---- */
var SKILL_SLOTS = 8;
var SKILLS = {
  slash: { name: 'Power Slash', icon: '💥', kind: 'cone', mp: 12, cd: 3.5, lvl: 1, price: 0, range: 4.4, cone: 2.35, mult: 2.2, dash: 2.4, desc: 'Heavy cone slash.' },
  whirl: { name: 'Whirlwind', icon: '🌀', kind: 'aoe', mp: 26, cd: 9, lvl: 1, price: 0, radius: 4.4, mult: 0.9, hits: 2, color: 0x6ab7ff, desc: 'Spin and hit all nearby enemies twice.' },
  heal: { name: 'Healing Light', icon: '✨', kind: 'heal', mp: 22, cd: 12, lvl: 1, price: 0, frac: 0.4, desc: 'Restore 40% HP.' },
  fireb: { name: 'Fire Bolt', icon: '🔥', kind: 'bolt', mp: 14, cd: 4, lvl: 1, price: 0, range: 16, mult: 2.0, color: 0xff7a2a, desc: 'Ranged fire bolt.' },
  cry: { name: 'Battle Cry', icon: '📣', kind: 'buff', mp: 20, cd: 25, lvl: 1, price: 0, buff: { atk: 0.3 }, dur: 15, desc: '+30% ATK for 15s.' },
  triple: { name: 'Triple Strike', icon: '🗡', kind: 'cone', mp: 18, cd: 6, lvl: 4, price: 400, range: 3.8, cone: 1.4, mult: 1.1, hits: 3, desc: 'Three rapid strikes.' },
  swall: { name: 'Shield Wall', icon: '🛡', kind: 'shield', mp: 24, cd: 22, lvl: 5, price: 500, frac: 0.6, dur: 10, desc: 'Absorb damage up to 60% max HP.' },
  fnova: { name: 'Frost Nova', icon: '❄', kind: 'aoe', mp: 30, cd: 14, lvl: 6, price: 650, radius: 6, mult: 1.2, hits: 1, stun: 1.8, color: 0x9bd0ff, desc: 'Freeze nearby enemies.' },
  charge: { name: 'Charge', icon: '💨', kind: 'cone', mp: 16, cd: 7, lvl: 7, price: 800, range: 7, cone: 1.1, mult: 2.6, dash: 7, desc: 'Dash forward, hit what is in the way.' },
  chain: { name: 'Chain Lightning', icon: '⚡', kind: 'chain', mp: 28, cd: 8, lvl: 9, price: 1100, n: 4, range: 9, mult: 1.6, desc: 'Lightning jumps between 4 enemies.' },
  drain: { name: 'Life Drain', icon: '🩸', kind: 'bolt', mp: 22, cd: 9, lvl: 10, price: 1300, range: 10, mult: 1.8, heal: 0.5, color: 0xaa2a8a, desc: 'Damage a target and heal 50% of it.' },
  quake: { name: 'Earthquake', icon: '🌋', kind: 'aoe', mp: 36, cd: 15, lvl: 12, price: 1700, radius: 7.5, mult: 1.4, hits: 1, stun: 1, color: 0xb07a3a, desc: 'Shake the ground, stun foes.' },
  haste: { name: 'Haste', icon: '🏃', kind: 'buff', mp: 20, cd: 24, lvl: 13, price: 1900, buff: { spd: 0.5 }, dur: 40, desc: '+50% move and attack speed for 40s.' },
  ilance: { name: 'Ice Lance', icon: '🧊', kind: 'bolt', mp: 24, cd: 6, lvl: 15, price: 2400, range: 18, mult: 2.6, slow: 3, color: 0x9fe8ff, desc: 'Piercing ice that slows.' },
  meteor: { name: 'Meteor', icon: '☄', kind: 'meteor', mp: 50, cd: 20, lvl: 18, price: 4000, radius: 6, mult: 4.0, delay: 1.0, range: 14, desc: 'Call a meteor at your target.' },
  bstorm: { name: 'Blade Storm', icon: '🌪', kind: 'aoe', mp: 45, cd: 16, lvl: 20, price: 5000, radius: 5, mult: 0.8, hits: 5, color: 0xdfe8ff, desc: 'Five rapid spins.' },
  hnova: { name: 'Holy Nova', icon: '🌟', kind: 'aoe', mp: 40, cd: 14, lvl: 22, price: 6000, radius: 6, mult: 1.8, hits: 1, healSelf: 0.2, color: 0xfff2a0, desc: 'Blast enemies and heal 20% HP.' },
  sstep: { name: 'Shadow Step', icon: '🌑', kind: 'step', mp: 28, cd: 8, lvl: 24, price: 7500, range: 12, mult: 3.2, desc: 'Teleport behind a target and stab.' },
  berserk: { name: 'Berserk', icon: '😡', kind: 'buff', mp: 30, cd: 30, lvl: 26, price: 9000, buff: { atk: 0.6, def: -0.2 }, dur: 15, desc: '+60% ATK, -20% DEF for 15s.' },
  regen: { name: 'Regeneration', icon: '💚', kind: 'hot', mp: 34, cd: 25, lvl: 28, price: 11000, frac: 0.06, dur: 8, desc: 'Heal 6% HP every second for 8s.' },
  exec: { name: 'Execution', icon: '💀', kind: 'cone', mp: 32, cd: 10, lvl: 31, price: 14000, range: 3.9, cone: 1.2, mult: 3.5, execute: 2.0, dash: 2.2, desc: 'Huge damage, double vs enemies under 35% HP.' },
  tstorm: { name: 'Thunder Storm', icon: '🌩', kind: 'storm', mp: 60, cd: 22, lvl: 35, price: 20000, strikes: 8, radius: 8, mult: 1.5, dur: 2.4, desc: 'Eight lightning strikes around you.' },
  iskin: { name: 'Iron Skin', icon: '🪨', kind: 'buff', mp: 30, cd: 28, lvl: 38, price: 26000, buff: { def: 0.8 }, dur: 12, desc: '+80% DEF for 12s.' },
  reaper: { name: 'Soul Reaper', icon: '👻', kind: 'cone', mp: 45, cd: 12, lvl: 42, price: 34000, range: 5.5, cone: 2.6, mult: 3.5, healSelf: 0.08, mpGain: 0.12, desc: 'Wide scythe: heals HP and restores MP.' },
  anvil: { name: 'Raining Anvil', icon: '⚓', kind: 'anvil', mp: 70, cd: 18, lvl: 50, price: 60000, radius: 6.5, n: 10, mult: 1.5, range: 14, desc: 'Rain heavy anvils over an area.' },
  laser: { name: 'Laser Gun', icon: '🔫', kind: 'laser', mp: 80, cd: 16, lvl: 55, price: 75000, range: 20, mult: 1.3, ticks: 6, desc: 'Fire a huge red laser beam.' },
  starfall: { name: 'Star Fall', icon: '🌠', kind: 'starfall', mp: 85, cd: 20, lvl: 60, price: 90000, radius: 7.5, n: 28, mult: 0.9, range: 14, desc: 'Rain glowing arrows over a circle, many hits.' },
  icecrack: { name: 'Ice Crack', icon: '🧊', kind: 'icecrack', mp: 75, cd: 14, lvl: 65, price: 110000, range: 20, mult: 3.4, desc: 'Ice spikes burst from the ground, from you to the enemy.' },
  hsword: { name: 'Heavenly Sword', icon: '🗡', kind: 'hsword', mp: 120, cd: 28, lvl: 75, price: 150000, radius: 8, mult: 6, stun: 1.8, range: 14, desc: 'A giant sword drops from the sky.' },
  skelly: { name: 'Summon Big Skeleton', icon: '💀', kind: 'skelly', mp: 130, cd: 34, lvl: 70, price: 120000, radius: 9, hits: 5, mult: 1.6, range: 12, desc: 'A giant skeleton rises and smashes every enemy inside a huge circle.' },
  ewave: { name: 'Energy Wave', icon: '🔵', kind: 'ewave', mp: 120, cd: 30, lvl: 75, price: 150000, radius: 8, mult: 6, range: 20, desc: 'Gather a giant crackling energy ball above you, then hurl it for a massive blast.' },
  angel: { name: 'Summon Angel', icon: '😇', kind: 'angel', mp: 150, cd: 40, lvl: 85, price: 250000, radius: 10, mult: 7, healSelf: 0.3, range: 12, desc: 'An angel descends and smites all nearby. Heals you.' },
  dwrath: { name: 'Dragon Wrath', icon: '🐉', kind: 'aoe', mp: 90, cd: 30, lvl: 48, price: 50000, radius: 9, mult: 5.5, hits: 1, stun: 1.5, color: 0xff4a1a, desc: 'Devastating dragon fire blast.' }
};
var SKILL_ORDER = ['slash', 'whirl', 'heal', 'fireb', 'cry', 'triple', 'swall', 'fnova', 'charge', 'chain', 'drain', 'quake', 'haste', 'ilance', 'meteor', 'bstorm', 'hnova', 'sstep', 'berserk', 'regen', 'exec', 'tstorm', 'iskin', 'reaper', 'dwrath', 'anvil', 'laser', 'starfall', 'icecrack', 'hsword', 'angel', 'skelly', 'ewave'];
var DEFAULT_SLOTS = ['slash', 'whirl', 'heal', 'fireb', 'cry'];
function padSlots(a) { var o = a.slice(); while (o.length < SKILL_SLOTS) o.push(null); return o; }

/* ---- icon files: src/skill1.png ... src/skill33.png (emoji kept as fallback) ---- */
/* attack skills load 11 seconds faster (minimum 1.5s) */
(function () { var NONATK = { heal: 1, buff: 1, shield: 1, hot: 1 }; for (var id in SKILLS) { var sk = SKILLS[id]; if (!NONATK[sk.kind]) sk.cd = Math.max(1.5, sk.cd - 11); } })();
SKILL_ORDER.forEach(function (id, i) { SKILLS[id].id = id; SKILLS[id].emoji = SKILLS[id].icon; SKILLS[id].icon = iconUrl('src/skill' + (i + 1) + '.png'); });
/* Thunder Storm Special: same lightning storm as Thunder Storm, but only 3 s cooldown and 5 MP (added after the global cooldown cut so the 3 s stays exact) */
(function () {
  var b = SKILLS.tstorm, s = {}; for (var k in b) s[k] = b[k];
  s.name = 'Thunder Storm Special'; s.mp = 5; s.cd = 2; s.price = 0; s.dprice = 50; s.color = 0xff4a3a; s.desc = 'Eight blood-red lightning strikes around you. Only 2s cooldown and 5 MP!';
  s.noAI = true; s.id = 'tstormx'; SKILLS.tstormx = s; SKILL_ORDER.push('tstormx');
})();
