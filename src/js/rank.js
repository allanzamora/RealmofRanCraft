/* rank.js - Rank tiers (E ... GM). Each tier has its own stats while equipped and a kill requirement. Shown as [RANK] Name [R#] on the name tag (also to other players in PvP). */
var RANKS = [
  { id: 'E', hp: 250, cd: 1, mp: 10, req: { mobs: 100 }, col: '#b8b8b8' },
  { id: 'E+', hp: 550, cd: 1.4, mp: 30, req: { mobs: 200 }, col: '#b8b8b8' },
  { id: 'D', hp: 620, cd: 1.6, mp: 40, req: { mobs: 300 }, col: '#7ee07e' },
  { id: 'D+', hp: 700, cd: 1.9, mp: 50, req: { mobs: 400 }, col: '#7ee07e' },
  { id: 'C', hp: 1050, cd: 2, mp: 80, req: { mobs: 600 }, col: '#5ab8ff' },
  { id: 'C+', hp: 1250, cd: 2.8, mp: 100, req: { mobs: 800 }, col: '#5ab8ff' },
  { id: 'B', hp: 1550, cd: 3, mp: 120, req: { mobs: 1000 }, col: '#b48aff' },
  { id: 'B+', hp: 2000, cd: 3.4, mp: 100, req: { mobs: 1250 }, col: '#b48aff' },
  { id: 'A', hp: 2200, cd: 3.9, mp: 100, req: { mobs: 1500, boss: 100 }, col: '#ffa040' },
  { id: 'A+', hp: 2500, cd: 4, mp: 100, req: { mobs: 2000, ds: 1 }, col: '#ffa040' },
  { id: 'S', hp: 3000, cd: 4.5, mp: 100, req: { ds: 50 }, col: '#ffd54f' },
  { id: 'S+', hp: 3500, cd: 5.2, mp: 100, req: { ds: 75 }, col: '#ffd54f' },
  { id: 'SS', hp: 4000, cd: 6, mp: 100, req: { ds: 100 }, col: '#ff6a6a' },
  { id: 'SSS', hp: 5000, cd: 10, mp: 100, req: { gm: 50 }, col: '#ff4a9a' },
  { id: 'GM', hp: 9000, cd: 20, mp: 100, req: { gm: 100 }, col: '#3affea' }
];
var RANK_REQ_NAME = { mobs: 'Mobs killed', boss: 'Bosses killed', ds: 'Dark Swordman killed', gm: 'The Game Master killed' };
function rankById(id) { for (var i = 0; i < RANKS.length; i++) if (RANKS[i].id === id) return RANKS[i]; return null; }
function rankIdx() { for (var i = 0; i < RANKS.length; i++) if (RANKS[i].id === P.rkEq) return i; return -1; }
function rankSum(k) { var r = rankById(P.rkEq); if (!r) return 0; return k === 'hp' ? r.hp : k === 'cdmg' ? r.cd : k === 'mp' ? r.mp : 0; }
function rankProg() {
  var k = P.kills || {}, o = { mobs: 0, boss: 0, ds: k.darksword | 0, gm: k.gamemaster | 0 };
  for (var t in k) { var T = ENEMY_TYPES[t]; if (!T) continue; if (T.boss) o.boss += k[t] | 0; else o.mobs += k[t] | 0; }
  return o;
}
function rankMet(r, pr) { for (var q in r.req) if ((pr[q] | 0) < r.req[q]) return false; return true; }
function rankCheck(silent) {
  if (!P.rkOwn) P.rkOwn = []; var pr = rankProg(), got = false;
  RANKS.forEach(function (r) {
    if (P.rkOwn.indexOf(r.id) >= 0 || !rankMet(r, pr)) return;
    P.rkOwn.push(r.id); got = true;
    if (!silent) { log('🎖️ Rank ' + r.id + ' unlocked! Equip it in Menu > Rank.', '#ffe066'); sfx('level'); }
  });
  if (got && !P.rkEq && P.rkOwn.length) P.rkEq = P.rkOwn[P.rkOwn.length - 1];
  return got;
}
function rankStatText(r) { return '+' + r.hp + ' HP, +' + r.cd + '% Crit Damage, +' + r.mp + ' MP'; }
function openRank() { openPanel('Rank', renderRank); }
function renderRank(body) {
  var pr = rankProg(), cur = rankById(P.rkEq);
  h('div', 'sec', cur ? 'Equipped rank: ' + cur.id : 'No rank equipped', body);
  h('div', 'ds', 'Reach a requirement to unlock a rank, then equip one. Only the equipped rank gives its stats. Your rank shows left of your name, your rebirth on the right - other players see both.', body);
  RANKS.forEach(function (r) {
    var own = P.rkOwn && P.rkOwn.indexOf(r.id) >= 0, row = h('div', 'item', null, body), ic = h('div', 'ico', r.id, row);
    ic.style.cssText = 'font-weight:900;font-size:' + (r.id.length > 2 ? 16 : 20) + 'px;display:flex;align-items:center;justify-content:center;width:48px;height:48px;flex:none;color:' + r.col + ';text-shadow:1px 1px 2px #000';
    var nm = h('div', 'nm', null, row); h('div', 'rare', 'Rank ' + r.id, nm).style.color = r.col; h('div', 'ds', '✨ ' + rankStatText(r), nm).style.color = '#9fe59f';
    for (var q in r.req) { var have = Math.min(pr[q] | 0, r.req[q]); h('div', 'ds', (RANK_REQ_NAME[q]) + ': ' + have + ' / ' + r.req[q], nm).style.color = have >= r.req[q] ? '#9fe59f' : '#ffb870'; }
    if (!own) { h('span', 'tag', '🔒', row); return; }
    if (P.rkEq === r.id) { h('span', 'tag eq', 'EQUIPPED', row); btn(row, 'Remove', function () { P.rkEq = ''; P.hp = Math.min(P.hp, maxHp()); P.mp = Math.min(P.mp, maxMp()); saveGame(); updateHud(); rerender(); }); }
    else btn(row, 'Equip', function () { P.rkEq = r.id; P.hp = Math.min(P.hp, maxHp()); saveGame(); sfx('ui'); updateHud(); rerender(); }, { cls: 'good' });
  });
}
function rankTagPeer(c, cw) {       // other players: rank + rebirth from their costume/state block
  var i = ((cw && cw._rk) | 0) - 1, rb = (cw && cw._rb) | 0; setTagTitle(c, i >= 0 && RANKS[i] ? RANKS[i].id : '', rb, i >= 0 && RANKS[i] ? RANKS[i].col : '#ffffff');
}
