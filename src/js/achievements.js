/* achievements.js - monster-kill achievements (Menu > Achievements).
   Normal monsters: kill 100 / 200 / 500 -> Gold + EXP (the higher the monster level, the bigger the reward).
   Bosses: kill 1 / 5 / 10 -> 10 / 20 / 30 Diamonds (no EXP). */
var ACH_KILLS = [100, 200, 500], ACH_BOSS_KILLS = [1, 5, 10], ACH_BOSS_GEMS = [10, 20, 30];
var achTab = 'mob';
function achCount(e) { var k = e.type; if (e.T && e.T.edge) return; P.kills[k] = (P.kills[k] | 0) + 1; }
function achList(boss) {
  var out = [];
  for (var k in ENEMY_TYPES) { var T = ENEMY_TYPES[k]; if (T.edge || !!T.boss !== boss) continue; out.push(T); }
  out.sort(function (a, b) { return a.lvl - b.lvl || (a.name < b.name ? -1 : 1); });
  return out;
}
function achReward(T, tier) {                       // tier 0..2
  if (T.boss) return { gems: ACH_BOSS_GEMS[tier], need: ACH_BOSS_KILLS[tier] };
  var f = 1 + (T.lvl - 1) * 0.1, m = [1, 2, 5][tier];   // Lv 1 monster: 1000 G + 500 XP at 100 kills
  return { gold: Math.round(1000 * f * m), xp: Math.round(500 * f * m), need: ACH_KILLS[tier] };
}
function achClaimable() { var n = 0; [false, true].forEach(function (b) { achList(b).forEach(function (T) { var t = P.ach[T.key] | 0; if (t < 3 && (P.kills[T.key] | 0) >= achReward(T, t).need) n++; }); }); return n; }
function achClaim(T) {
  var t = P.ach[T.key] | 0; if (t >= 3) return; var rw = achReward(T, t); if ((P.kills[T.key] | 0) < rw.need) return;
  P.ach[T.key] = t + 1;
  if (rw.gems) { P.diamonds += rw.gems; log('Achievement: ' + T.name + ' x' + rw.need + '! +' + rw.gems + ' Diamonds', '#7fe9ff'); }
  else { P.gold += rw.gold; log('Achievement: ' + T.name + ' x' + rw.need + '! +' + rw.gold + ' G, +' + rw.xp + ' XP', '#ffe066'); gainXp(rw.xp); }
  sfx('level'); saveGame(); rerender();
}
function openAchievements() { openPanel('Achievements', renderAchievements); }
function renderAchievements(body) {
  var tabs = h('div', 'tabs', null, body);
  [['mob', 'Monsters'], ['boss', 'Bosses']].forEach(function (t) { var b = h('button', achTab === t[0] ? 'act' : null, t[1], tabs); b.addEventListener('click', function () { achTab = t[0]; rerender(); }); });
  var boss = achTab === 'boss';
  h('div', 'ds', boss ? 'Defeat bosses: 1 / 5 / 10 kills reward 10 / 20 / 30 Diamonds each (no EXP).' : 'Kill monsters: 100 / 200 / 500 kills reward Gold + EXP. Higher level monsters give bigger rewards.', body);
  achList(boss).forEach(function (T) {
    var t = P.ach[T.key] | 0, n = P.kills[T.key] | 0, r = h('div', 'item', null, body), ic = h('div', 'ico', boss ? '👑' : '🏆', r);
    ic.style.cssText = 'font-size:26px;display:flex;align-items:center;justify-content:center;width:44px;height:44px;flex:none';
    var nm = h('div', 'nm', null, r); h('div', null, T.name + '  (Lv ' + T.lvl + ')', nm);
    if (t >= 3) { h('div', 'ds', 'All achievements complete - ' + n + ' kills', nm); h('span', 'tag eq', 'DONE', r); return; }
    var rw = achReward(T, t);
    h('div', 'ds', 'Tier ' + (t + 1) + '/3 - kill ' + rw.need + ': ' + Math.min(n, rw.need) + '/' + rw.need + '  ·  Reward: ' + (rw.gems ? rw.gems + ' 💎' : rw.gold.toLocaleString() + ' G + ' + rw.xp.toLocaleString() + ' XP'), nm);
    btn(r, n >= rw.need ? 'Claim' : 'Locked', function () { achClaim(T); }, { disabled: n < rw.need, cls: 'good' });
  });
}
