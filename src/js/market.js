/* market.js - Market Place NPC: players sell / buy gear for gold or diamonds (server v6, listings kept on the server + Firebase) */
var MK = { tab: 'buy', slot: 'weapon', cur: 'g', sort: 'hi', list: [], n: 0, loading: false, mine: [], earn: { g: 0, d: 0 }, sel: null, price: '', scur: 'g', pend: null };
var MK_SLOT_LIST = [['weapon', 'Weapon'], ['helmet', 'Helmet'], ['armor', 'Armor'], ['pants', 'Pants'], ['gloves', 'Gloves'], ['wings', 'Wings'], ['necklace', 'Necklace'], ['ringL', 'Ring Left'], ['ringR', 'Ring Right']];
function mkOnline() { return !!(PVP.ws && PVP.ws.readyState === 1 && PVP.ver >= 6); }
function mkSend(o) { if (!mkOnline()) { log('The Market needs the online server (v6). Check Settings > Game server and update server.js.', '#ff9a9a'); return false; } pvpSend(o); return true; }
function itemData(id) { var it = ITEMS[id]; return { b: it.base, r: ((P.rolls[id] && P.rolls[id].r) || []).map(function (r) { return [r[0], r[1]]; }), u: upgLvl(id), s: starsOf(id), m: (P.rolls[id] && P.rolls[id].bm) || 1 }; }
function removeInstance(id) { var i = P.owned.indexOf(id); if (i >= 0) P.owned.splice(i, 1); delete P.rolls[id]; delete P.upg[id]; if (P.stars) delete P.stars[id]; delete ITEMS[id]; }
function mkDesc(d) {
  var b = ITEMS[d.b]; if (!b) return '';
  var bm = d.m > 1 ? d.m : 1, p = BASE_KEYS.filter(function (k) { return b[k[0]]; }).map(function (k) { return '+' + Math.round(b[k[0]] * bm * 10) / 10 + k[2] + ' ' + k[1]; });
  var s = p.join('  ') + (d.r && d.r.length ? '  |  ' + d.r.map(statText).join('  ') : '');
  if (d.s > 0) s += '  |  ★' + d.s + ' (+' + (d.s * 10) + '% all stats)'; return s;
}
function mkRow(parent, d) {
  var b = ITEMS[d.b], r = h('div', 'item', null, parent), ic = iconEl(r, b.icon, b.emoji || '?');
  if (d.s > 0) { ic.style.position = 'relative'; h('span', 'sbadge', '★' + d.s, ic); }
  var nm = h('div', 'nm', null, r); h('div', b.rare ? 'rare' : null, (b.rare ? '★ ' : '') + b.name + (d.u ? ' +' + d.u : ''), nm); h('div', 'ds', mkDesc(d), nm);
  return { row: r, nm: nm };
}
function mkFetch() { MK.loading = true; if (!mkSend({ t: 'mxl', slot: MK.slot, cur: MK.cur, sort: MK.sort })) MK.loading = false; }
function openMarket(n) { MK.sel = null; MK.price = ''; openPanel(n ? n.name : 'Market Place', renderMarket); if (mkOnline()) { mkFetch(); mkSend({ t: 'mxm' }); } }
function mkPriceTxt(p, cur) { return p.toLocaleString('en-US') + (cur === 'd' ? ' 💎' : ' G'); }
function mkSlotRow(body, onPick) {
  var row = h('div', 'btns', null, body);
  MK_SLOT_LIST.forEach(function (s) { btn(row, s[1], function () { MK.slot = s[0]; MK.sel = null; onPick(); rerender(); }, { cls: MK.slot === s[0] ? 'good' : '' }); });
}
function renderMarket(body) {
  var mt = h('div', 'tabs', null, body);
  [['buy', 'Buy'], ['sell', 'Sell'], ['mine', 'My Listings']].forEach(function (t) { var b = h('button', MK.tab === t[0] ? 'act' : null, t[1], mt); b.addEventListener('click', function () { MK.tab = t[0]; MK.sel = null; if (t[0] === 'buy') mkFetch(); if (t[0] === 'mine') mkSend({ t: 'mxm' }); rerender(); }); });
  if (!mkOnline()) { h('div', 'ds', '🔴 The Market needs the online server (v6). Check your connection and Settings > Game server.', body).style.color = '#ff9a9a'; return; }
  h('div', 'ds', 'Gold: ' + P.gold.toLocaleString('en-US') + '   Diamonds: ' + P.diamonds.toLocaleString('en-US') + '    (no tax; costumes cannot be sold)', body);
  if (MK.tab === 'buy') {
    mkSlotRow(body, mkFetch);
    var o = h('div', 'btns', null, body);
    btn(o, MK.cur === 'g' ? '💰 Gold' : '💎 Diamonds', function () { MK.cur = MK.cur === 'g' ? 'd' : 'g'; mkFetch(); rerender(); }, { cls: 'good' });
    btn(o, MK.sort === 'hi' ? 'Price: High → Low' : 'Price: Low → High', function () { MK.sort = MK.sort === 'hi' ? 'lo' : 'hi'; mkFetch(); rerender(); }, { cls: 'good' });
    h('div', 'sec', (MK_SLOT_LIST.filter(function (s) { return s[0] === MK.slot; })[0][1]) + ' for sale (' + (MK.cur === 'g' ? 'gold' : 'diamonds') + '): ' + MK.n, body);
    if (MK.loading) h('p', 'ds', 'Loading...', body);
    else if (!MK.list.length) h('p', 'ds', 'Nothing for sale here.', body);
    MK.list.forEach(function (x) {
      if (!ITEMS[x.it.b]) return;
      var r = mkRow(body, x.it); h('div', 'ds', 'Seller: ' + x.sn, r.nm);
      var own = x.sn === P.name && MK.mineIds && MK.mineIds[x.id];
      h('span', 'tag eq', mkPriceTxt(x.p, x.cur), r.row);
      var afford = x.cur === 'd' ? P.diamonds >= x.p : P.gold >= x.p;
      btn(r.row, 'Buy', function () { if ((x.cur === 'd' ? P.diamonds : P.gold) < x.p) { log('Not enough ' + (x.cur === 'd' ? 'diamonds' : 'gold') + '.', '#ff9a9a'); return; } mkSend({ t: 'mxb', id: x.id }); }, { cls: 'good', disabled: !afford || own });
    });
    return;
  }
  if (MK.tab === 'sell') {
    mkSlotRow(body, function () {});
    h('div', 'sec', 'Your ' + (MK_SLOT_LIST.filter(function (s) { return s[0] === MK.slot; })[0][1]) + ' items (not worn)', body);
    var any = false;
    P.owned.forEach(function (id) {
      var it = ITEMS[id]; if (!it || it.slot !== MK.slot || id === 'weapon0' || it.base === 'weapon0' || EQ_SLOTS.some(function (s) { return P.equip[s] === id; })) return; any = true;
      var d = itemData(id), r = mkRow(body, d);
      btn(r.row, MK.sel === id ? 'Cancel' : 'Sell', function () { MK.sel = MK.sel === id ? null : id; rerender(); }, { cls: MK.sel === id ? '' : 'good' });
      if (MK.sel === id) {
        var f = h('div', 'dlg', null, body);
        var inp = h('input', null, null, f); inp.type = 'text'; inp.inputMode = 'numeric'; inp.autocomplete = 'off'; inp.name = 'mkprice'; inp.placeholder = 'Price (amount)'; inp.value = MK.price;
        inp.style.cssText = 'width:100%;padding:8px;border-radius:8px;border:1px solid #888;background:#111a33;color:#fff;font-size:14px;box-sizing:border-box;margin:6px 0';
        inp.addEventListener('input', function () { MK.price = inp.value.replace(/[^0-9]/g, ''); if (inp.value !== MK.price) inp.value = MK.price; });
        var b2 = h('div', 'btns', null, f);
        btn(b2, MK.scur === 'g' ? 'Currency: 💰 Gold' : 'Currency: 💎 Diamonds', function () { MK.scur = MK.scur === 'g' ? 'd' : 'g'; rerender(); });
        btn(b2, 'LIST FOR SALE', function () {
          var p = parseInt(MK.price, 10); if (!(p >= 1)) { log('Enter a price first.', '#ff9a9a'); return; }
          MK.pend = id; mkSend({ t: 'mxs', slot: MK.slot, it: itemData(id), p: p, cur: MK.scur });
        }, { cls: 'good' });
      }
    });
    if (!any) h('p', 'ds', 'You have no unequipped items in this category.', body);
    return;
  }
  h('div', 'sec', 'Earnings waiting: ' + mkPriceTxt(MK.earn.g, 'g') + '   ' + mkPriceTxt(MK.earn.d, 'd'), body);
  btn(body, 'Collect earnings', function () { mkSend({ t: 'mxe' }); }, { cls: 'good', disabled: !(MK.earn.g || MK.earn.d) });
  h('div', 'sec', 'Your listings (' + MK.mine.length + ')', body);
  if (!MK.mine.length) h('p', 'ds', 'You are not selling anything.', body);
  MK.mine.forEach(function (x) { if (!ITEMS[x.it.b]) return; var r = mkRow(body, x.it); h('span', 'tag eq', mkPriceTxt(x.p, x.cur), r.row); btn(r.row, 'Cancel', function () { mkSend({ t: 'mxc', id: x.id }); }); });
}
function marketOnMsg(m) {
  var re = function () { if (ui.open && ui.render === renderMarket && !(document.activeElement && document.activeElement.tagName === 'INPUT')) rerender(); };
  switch (m.t) {
    case 'mxl': if (m.slot === MK.slot && m.cur === MK.cur) { MK.list = m.l || []; MK.n = m.n || 0; MK.loading = false; re(); } return true;
    case 'mxmine': MK.mine = m.l || []; MK.earn = m.e || { g: 0, d: 0 }; MK.mineIds = {}; MK.mine.forEach(function (x) { MK.mineIds[x.id] = 1; }); re(); return true;
    case 'mxo':
      if (m.ok && MK.pend && ITEMS[MK.pend]) { var nm = itemName(MK.pend); removeInstance(MK.pend); MK.pend = null; MK.sel = null; MK.price = ''; saveGame(); log('Listed ' + nm + ' on the Market.', '#ffd54f'); mkSend({ t: 'mxm' }); }
      else if (!m.ok) { MK.pend = null; log(m.msg || 'Could not list the item.', '#ff9a9a'); }
      rerender(); return true;
    case 'mxbk':
      if (!m.ok) { log(m.msg || 'Could not buy.', '#ff9a9a'); mkFetch(); return true; }
      if ((m.cur === 'd' ? P.diamonds : P.gold) < m.p) { mkSend({ t: 'mxs', slot: m.slot, it: m.it, p: m.p, cur: m.cur }); log('Not enough currency - item returned to the market.', '#ff9a9a'); return true; }
      if (m.cur === 'd') P.diamonds -= m.p; else P.gold -= m.p;
      lootGive(m.it); log('Bought for ' + mkPriceTxt(m.p, m.cur) + '.', '#ffd54f'); saveGame(); mkFetch(); return true;
    case 'mxcx': if (m.ok) { lootGive(m.it); log('Listing cancelled - item returned.', '#ffd54f'); } mkSend({ t: 'mxm' }); return true;
    case 'mxcl': if (m.g || m.d) { P.gold += m.g | 0; P.diamonds += m.d | 0; saveGame(); sfx('coin'); log('Collected ' + (m.g ? mkPriceTxt(m.g, 'g') + ' ' : '') + (m.d ? mkPriceTxt(m.d, 'd') : ''), '#ffd54f'); } else log('Nothing to collect.', '#9fd8ff'); mkSend({ t: 'mxm' }); return true;
    case 'mxe': log('🛒 ' + m.msg, '#ffd54f'); sfx('coin'); return true;
  }
  return false;
}
