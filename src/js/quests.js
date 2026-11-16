/* quests.js - quest data */
/* ---- quests ---- */
var QUESTS = [
  { id: 'q1', title: 'Goblin Trouble', target: 'goblin', need: 8, intro: 'Goblins are raiding our farms. Thin their numbers, hero!', done: 'You saved the farms. Take this reward.', rewards: { gold: 150, xp: 120, items: { hp_potion: 2 } } },
  { id: 'q2', title: 'Restless Bones', target: 'skeleton', need: 8, intro: 'The dead rise on the plains. Lay eight Skeleton Warriors to rest.', done: 'The dead sleep again.', rewards: { gold: 320, xp: 360, items: { mp_potion: 3 } } },
  { id: 'q3', title: 'Orc Warband', target: 'orc', need: 6, intro: 'An Orc warband gathers in the wastes. Break it!', done: 'The warband is broken!', rewards: { gold: 650, xp: 850, items: { hp_potion: 4, weapon1: 1 } } },
  { id: 'q4', title: 'Fallen Knights', target: 'knight', need: 5, intro: 'Dark Knights guard the citadel road. Defeat five of them.', done: 'Their banner falls.', rewards: { gold: 1300, xp: 1900, items: { weapon2: 1 } } },
  { id: 'q5', title: 'The Demon Lord', target: 'demon', need: 1, intro: "Vorgath himself waits at the far edge of the plains. End this nightmare.", done: 'Vorgath is slain! Legends will be told of you.', rewards: { gold: 5000, xp: 6000, items: { hp_potion: 10, mp_potion: 10 } } },
  { id: 'q6', title: 'Hunt in the Wilds', target: 'elf', need: 10, intro: 'Wild Elves defend Whispering Nature. Travel there via the portal and thin them out.', done: 'The forest is calmer.', rewards: { gold: 3000, xp: 5000, items: { helmet2: 1 } } },
  { id: 'q7', title: 'Curse of the Sands', target: 'mummy', need: 10, intro: 'Cursed Mummies roam the Scorched Desert. Destroy ten.', done: 'The sands are quiet again.', rewards: { gold: 6000, xp: 10000, items: { armor3: 1 } } },
  { id: 'q8', title: 'Beasts of the Peak', target: 'yeti', need: 8, intro: 'Yeti Brutes terrorize Frostpeak. Bring me proof of eight kills.', done: 'The peak is safe.', rewards: { gold: 11000, xp: 20000, items: { gloves3: 1 } } },
  { id: 'q9', title: 'Machine Uprising', target: 'mech', need: 8, intro: 'Mech Soldiers have taken the ruined city. Scrap eight of them.', done: 'The city can rest.', rewards: { gold: 18000, xp: 38000, items: { pants4: 1 } } },
  { id: 'q10', title: 'Pit of Despair', target: 'pitlord', need: 5, intro: 'Pit Lords guard the gates of hell. Slay five to weaken Malphas.', done: 'You are a legend among heroes.', rewards: { gold: 40000, xp: 90000, items: { wings4: 1 } } }
];


/* ---- quest logic ---- */
var npcQuest = null;
function currentQuest() { for (var i = 0; i < QUESTS.length; i++) { var s = P.quests[QUESTS[i].id]; if (!s || s.state !== 'done') return QUESTS[i]; } return null; }
function refreshMarkers() {
  var q = currentQuest(), ch = null;
  if (q) { var st = P.quests[q.id]; ch = !st ? '!' : (st.state === 'ready' ? '?' : null); }
  if (npcQuest) npcQuest.marker.set(ch);
  var tr = $('tracker');
  if (!q) { tr.innerHTML = '<b>All quests complete!</b>'; return; }
  var s = P.quests[q.id];
  if (!s) tr.innerHTML = '<b>New quest:</b> talk to Elder Rowan (!) in Moviex Plains';
  else if (s.state === 'ready') tr.innerHTML = '<b>' + q.title + '</b><br>Done! Return to Elder Rowan (?)';
  else tr.innerHTML = '<b>' + q.title + '</b><br>Defeat ' + ENEMY_TYPES[q.target].name + ': ' + s.n + '/' + q.need;
}
