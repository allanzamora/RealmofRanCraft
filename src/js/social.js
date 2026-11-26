/* social.js - PARTY + GUILD. Both run through the online server (server/pvp_server.js v3+): parties are live (invite, shared EXP, chat),
   guilds are saved on the server (create / search / join / members / chat). Menu > Party, Menu > Guild. */
var PARTY = { lead: 0, m: [], inv: null, chat: [] };
var GUILD = { g: null, list: null, q: '', tab: 'my', chat: [], err: '', pend: false };
var GUILD_COST = 50000, GUILD_MIN_LVL = 10, PARTY_XP_SHARE = 0;
function socUid() {
  var u = null; try { u = localStorage.getItem('moviex_uid') || localStorage.getItem('moviex_gid'); if (!u) { u = 'g' + Math.random().toString(36).slice(2, 12) + Date.now().toString(36); localStorage.setItem('moviex_gid', u); } } catch (e) {}
  return String(u || 'guest');
}
function socOnline() { return !!(PVP.ws && PVP.ws.readyState === 1 && PVP.ver >= 3); }
function socSend(o) {
  if (!PVP.ws || PVP.ws.readyState !== 1) { log('Not connected to the server. Set the server address in Settings, then try again.', '#ff9a9a'); return false; }
  if (PVP.ver < 3) { log('Your server is the old version. Update server/pvp_server.js to use Party and Guild.', '#ffb86b'); return false; }
  pvpSend(o); return true;
}
function socRerender() { if ((ui.open === 'Party' || ui.open === 'Guild') && !(document.activeElement && document.activeElement.tagName === 'INPUT')) rerender(); }
function inParty() { return PARTY.m.length > 1; }

/* ---------- incoming ---------- */
function socialOnMsg(m) {
  switch (m.t) {
    case 'sm': log(m.msg, '#ffd27a'); return true;
    case 'pi': PARTY.inv = { from: m.from, n: m.fn, l: m.fl, at: Date.now() }; showInvite(); sfx('ui'); log('👥 ' + m.fn + ' (Lv' + m.fl + ') invited you to a party.', '#9fe3ff'); return true;
    case 'ps':
      PARTY.lead = m.lead || 0; PARTY.m = m.m || [];
      if (m.why === 'kicked') log('You were removed from the party.', '#ffb3b3'); else if (m.why === 'disbanded') log('The party was disbanded.', '#ffb3b3');
      if (!PARTY.m.length) PARTY.chat = []; partyHud(); socRerender(); return true;
    case 'pc': pushChat(PARTY.chat, m.n, m.msg); log('[Party] ' + m.n + ': ' + m.msg, '#8fd8ff'); socRerender(); return true;
    case 'px': {                                       // my share of a party kill (mob EXP divided equally between the party members nearby)
      var xp = Math.round(m.x * (1 + (costumeSum('exp') + gearSum('exp')) / 100));
      if (xp > 0) { spawnText('+' + xp + ' XP' + (m.n > 1 ? ' (party /' + m.n + ')' : ''), P.pos, 'xp', 2.4); gainXp(xp); }
      return true;
    }
    case 'gok':
      GUILD.g = m.g || null; GUILD.err = '';
      if (P.c) { var gn = GUILD.g ? GUILD.g.name : ''; if ((P.c.guildTxt || '') !== gn) { P.c.guildTxt = gn; try { P.c.tag.draw(); } catch (e) {} } }
      if (m.created && GUILD.pend) { GUILD.pend = false; P.gold = Math.max(0, P.gold - GUILD_COST); saveGame(); log('🏰 Guild "' + GUILD.g.name + '" created! (-' + GUILD_COST + ' gold)', '#ffe066'); GUILD.tab = 'my'; }
      socRerender(); return true;
    case 'gl': GUILD.list = m.list || []; socRerender(); return true;
    case 'ge': GUILD.err = m.msg; GUILD.pend = false; log('🏰 ' + m.msg, '#ff9a9a'); socRerender(); return true;
    case 'gc': chatIn({ c: 'guild', n: m.n, msg: m.msg }); return true;
    case 'ch': chatIn({ c: m.c, n: m.n, msg: m.msg, to: m.to, me: m.me }); return true;
  }
  return false;
}
function pushChat(arr, n, msg) { arr.push({ n: n, m: msg }); if (arr.length > 30) arr.shift(); }

/* ---------- invite popup + party HUD ---------- */
function showInvite() {
  var pop = $('soc-pop'); if (!pop || !PARTY.inv) return;
  pop.innerHTML = ''; pop.style.display = 'block';
  h('div', 'st', '👥 ' + PARTY.inv.n + ' (Lv' + PARTY.inv.l + ') invites you to a party', pop);
  var row = h('div', 'sr', null, pop);
  btn(row, 'Accept', function () { pvpSend({ t: 'pa' }); PARTY.inv = null; pop.style.display = 'none'; }, { cls: 'good' });
  btn(row, 'Decline', function () { pvpSend({ t: 'pd' }); PARTY.inv = null; pop.style.display = 'none'; });
  clearTimeout(showInvite.t); showInvite.t = setTimeout(function () { PARTY.inv = null; pop.style.display = 'none'; }, 45000);
}
function partyHud() {
  var el = $('party-hud'); if (!el) return;
  var html;
  if (!inParty()) html = '<b>👥 PARTY</b><div class="pe">No party yet. Tap here to invite friends and level together.</div>';
  else {
    html = '<b>👥 PARTY ' + PARTY.m.length + '/5 <i>(tap to manage)</i></b>';
    PARTY.m.forEach(function (x) {
      var f = Math.max(0, Math.min(1, x.hp / (x.mh || 1))), nm = String(x.n).replace(/[<>&]/g, '');
      html += '<div class="pm"><span class="pn">' + (x.id === PARTY.lead ? '👑' : '') + nm + ' <i>Lv' + x.l + '</i></span><span class="pb"><span style="width:' + (f * 100).toFixed(0) + '%"></span></span></div>';
    });
  }
  el.style.display = 'block';
  if (el._h !== html) { el._h = html; el.innerHTML = html; }
}
(function () { var el = $('party-hud'); if (el) el.addEventListener('pointerup', function (e) { e.stopPropagation(); openParty(); }); })();
setInterval(partyHud, 1500);

/* ---------- helpers for panels ---------- */
function socInput(body, ph, val, max) {
  var inp = h('input', null, null, body); inp.type = 'text'; inp.value = val || ''; inp.placeholder = ph; inp.maxLength = max || 40; inp.autocapitalize = 'off'; inp.autocomplete = 'off';
  inp.style.cssText = 'width:100%;padding:8px;border-radius:8px;border:1px solid #888;background:#111a33;color:#fff;font-size:14px;box-sizing:border-box;margin:4px 0';
  return inp;
}
function socText(body, ph, val, max) {
  var ta = h('textarea', null, null, body); ta.value = val || ''; ta.placeholder = ph; ta.maxLength = max || 60; ta.rows = 3;
  ta.style.cssText = 'width:100%;padding:8px;border-radius:8px;border:1px solid #888;background:#111a33;color:#fff;font-size:14px;box-sizing:border-box;margin:4px 0;resize:none;font-family:inherit';
  return ta;
}
function chatBox(body, arr, sendFn) {
  var box = h('div', 'ds', null, body); box.style.cssText = 'max-height:120px;overflow:auto;background:rgba(0,0,0,.35);border-radius:8px;padding:5px 7px;margin:4px 0;text-align:left';
  if (!arr.length) box.textContent = 'No messages yet.';
  arr.slice(-12).forEach(function (c) { var d = h('div', null, null, box); var b = h('b', null, c.n + ': ', d); d.appendChild(document.createTextNode(c.m)); });
  box.scrollTop = box.scrollHeight;
  var inp = socInput(body, 'Type a message...', '', 120);
  function go() { var v = inp.value.trim(); if (v) { sendFn(v); inp.value = ''; } }
  inp.addEventListener('keydown', function (e) { if (e.key === 'Enter') go(); });
  btn(body, 'Send', go);
}
function mapName(id) { id = String(id || '').replace(/^x_/, ''); for (var i = 0; i < MAPS.length; i++) if (MAPS[i].id === id) return MAPS[i].name; return id; }

/* ---------- PARTY panel ---------- */
function openParty() { openPanel('Party', renderParty); }
function renderParty(body) {
  h('div', 'ds', 'Party up to 5 friends. The EXP of every mob a member kills is split equally between the party members nearby (e.g. 9000 EXP with 3 members = 3000 each).', body);
  if (!socOnline()) h('div', 'ds', '🔴 Not connected to the server (Settings > Game server). Party needs the server v3.', body).style.color = '#ff9a9a';
  var lead = PARTY.lead === PVP.id;
  if (inParty()) {
    h('div', 'rare', 'Your party (' + PARTY.m.length + '/5)', body);
    PARTY.m.forEach(function (x) {
      var r = h('div', 'item', null, body); h('div', 'ico', x.id === PARTY.lead ? '👑' : '🧑', r);
      var nm = h('div', 'nm', null, r); h('div', null, x.n + '  (Lv ' + x.l + ')', nm); h('div', 'ds', 'HP ' + x.hp + ' / ' + x.mh + ' · ' + mapName(x.map), nm);
      if (lead && x.id !== PVP.id) btn(r, 'Kick', function () { pvpSend({ t: 'pk', id: x.id }); });
    });
    btn(body, 'Leave party', function () { pvpSend({ t: 'pl' }); });
  } else h('div', 'ds', 'You are not in a party. Invite a friend below, or wait for an invite.', body);
  if (!inParty() || lead) {
    h('div', 'rare', 'Invite a player', body);
    var inp = socInput(body, 'Player name (exact, must be online)', '', 20);
    btn(body, 'Invite by name', function () { var v = inp.value.trim(); if (v) socSend({ t: 'pn', name: v }); }, { cls: 'good' });
    var near = PEERS.filter(function (a) { return a.state !== 'dead'; });
    h('div', 'ds', near.length ? 'Players in this map:' : 'No other players in this map right now.', body);
    near.slice(0, 12).forEach(function (a) { var r = h('div', 'item', null, body); h('div', 'ico', '🧑', r); h('div', 'nm', a.name + '  (Lv ' + a.lvl + ')', r); btn(r, 'Invite', function () { socSend({ t: 'pi', to: a.pid }); }); });
  }
  if (inParty()) { h('div', 'rare', 'Party chat', body); chatBox(body, PARTY.chat, function (v) { pvpSend({ t: 'pc', msg: v }); }); }
}

/* ---------- GUILD panel ---------- */
function openGuild() { openPanel('Guild', renderGuild); if (socOnline()) { pvpSend({ t: 'gv' }); if (!GUILD.g) pvpSend({ t: 'gs', q: GUILD.q }); } }
function renderGuild(body) {
  var tabs = h('div', 'tabs', null, body);
  [['my', 'My Guild'], ['search', 'Search'], ['create', 'Create']].forEach(function (t) { var b = h('button', GUILD.tab === t[0] ? 'act' : null, t[1], tabs); b.addEventListener('click', function () { GUILD.tab = t[0]; if (t[0] === 'search' && socOnline()) pvpSend({ t: 'gs', q: GUILD.q }); rerender(); }); });
  if (!socOnline()) h('div', 'ds', '🔴 Not connected to the server (Settings > Game server). Guild needs the server v3.', body).style.color = '#ff9a9a';
  if (GUILD.err) h('div', 'ds', GUILD.err, body).style.color = '#ff9a9a';
  var g = GUILD.g, lead = g && g.leader === socUid();
  if (GUILD.tab === 'my') {
    if (!g) { h('div', 'ds', 'You are not in a guild. Use Search to join one, or Create your own (' + GUILD_COST.toLocaleString() + ' gold, Lv ' + GUILD_MIN_LVL + '+).', body); return; }
    h('div', 'rare', '🏰 ' + g.name, body); if (g.desc) h('div', 'ds', g.desc, body);
    h('div', 'ds', 'Members: ' + g.members.length + ' / 30 · online: ' + g.members.filter(function (x) { return x.on; }).length, body);
    g.members.slice().sort(function (a, b) { return (b.r === 'leader') - (a.r === 'leader') || b.on - a.on || b.l - a.l; }).forEach(function (x) {
      var r = h('div', 'item', null, body); h('div', 'ico', x.r === 'leader' ? '👑' : (x.on ? '🟢' : '⚫'), r);
      var nm = h('div', 'nm', null, r); h('div', null, x.n + '  (Lv ' + x.l + ')', nm); h('div', 'ds', (x.r === 'leader' ? 'Leader' : 'Member') + (x.on ? ' · online' : ''), nm);
      if (lead && x.u !== socUid()) btn(r, 'Kick', function () { pvpSend({ t: 'gk', name: x.n }); });
    });
    if (lead) {
      var di = socText(body, 'Guild description', g.desc, 60); btn(body, 'Save description', function () { pvpSend({ t: 'gn', desc: di.value }); });
      btn(body, 'Disband guild', function () { if (confirm('Disband the guild for everyone?')) pvpSend({ t: 'gd' }); });
    } else btn(body, 'Leave guild', function () { if (confirm('Leave the guild?')) pvpSend({ t: 'gx' }); });
  } else if (GUILD.tab === 'search') {
    var si = socInput(body, 'Search guild name (blank = all)', GUILD.q, 16);
    btn(body, 'Search', function () { GUILD.q = si.value.trim(); socSend({ t: 'gs', q: GUILD.q }); }, { cls: 'good' });
    if (GUILD.list === null) h('div', 'ds', 'Press Search to list guilds.', body);
    else if (!GUILD.list.length) h('div', 'ds', 'No guilds found.', body);
    (GUILD.list || []).forEach(function (x) {
      var r = h('div', 'item', null, body); h('div', 'ico', '🏰', r);
      var nm = h('div', 'nm', null, r); h('div', null, x.name + '  (' + x.n + '/' + x.max + ')', nm); h('div', 'ds', 'Leader: ' + x.leader + (x.desc ? ' · ' + x.desc : ''), nm);
      btn(r, 'Join', function () { socSend({ t: 'gj', id: x.id }); }, { disabled: !!g || x.n >= x.max });
    });
    if (g) h('div', 'ds', 'You are already in a guild. Leave it first to join another.', body);
  } else {
    if (g) { h('div', 'ds', 'You are already in a guild.', body); return; }
    h('div', 'ds', 'Create a guild: costs ' + GUILD_COST.toLocaleString() + ' gold, needs Lv ' + GUILD_MIN_LVL + '+. Name: 3-16 letters/numbers. Your guild name shows under your name for other players.', body);
    var ni = socInput(body, 'Guild name', '', 16), de = socText(body, 'Description (optional)', '', 60);
    btn(body, 'Create guild  (' + GUILD_COST.toLocaleString() + ' gold)', function () {
      if (P.lvl < GUILD_MIN_LVL) { GUILD.err = 'You need Lv ' + GUILD_MIN_LVL + ' to create a guild.'; rerender(); return; }
      if (P.gold < GUILD_COST) { GUILD.err = 'Not enough gold (' + GUILD_COST.toLocaleString() + ' needed).'; rerender(); return; }
      GUILD.err = ''; GUILD.pend = true; socSend({ t: 'gcr', name: ni.value, desc: de.value });
    }, { cls: 'good' });
  }
}
/* ---------- side tabs under the player frame: Quest | Party | Kills (Kills only in the Online PvP Arena) ---------- */
var SIDE = { t: 'q', wasOnline: false };
function sideTab(t) {
  SIDE.t = t; document.body.classList.remove('side-q', 'side-p', 'side-k'); document.body.classList.add('side-' + t);
  var bs = document.querySelectorAll('#side-tabs button'); for (var i = 0; i < bs.length; i++) bs[i].classList.toggle('act', bs[i].getAttribute('data-t') === t);
  partyHud();
}
function sideRefresh() {
  var on = !!(curMap && curMap.online), k = $('st-k'); if (!k) return;
  k.style.display = on ? '' : 'none';
  if (on && !SIDE.wasOnline) sideTab('k'); else if (!on && SIDE.t === 'k') sideTab('q');
  SIDE.wasOnline = on;
}
(function () {
  var bs = document.querySelectorAll('#side-tabs button');
  for (var i = 0; i < bs.length; i++) (function (b) { b.addEventListener('pointerup', function (e) { e.stopPropagation(); sideTab(b.getAttribute('data-t')); }); })(bs[i]);
  sideTab('q'); setInterval(sideRefresh, 500);
})();
tapBtn('m-guild', function () { closeNav(); openGuild(); });

/* ====================== CHAT (button left of the Mana potion) ====================== */
var CHAT = { msgs: [], tab: 'all', ch: 'world', to: '', unread: 0, feed: null };
var CHAT_CH = { world: ['World', '#ffd27a'], map: ['Map', '#9fe3ff'], guild: ['Guild', '#9fffa8'], priv: ['Whisper', '#ff9aff'] };
var CHAT_TABS = [['all', 'All Chats'], ['guild', 'Guild Chat'], ['priv', 'Private Chat'], ['map', 'Map Chat']];
function chatOn() { return !!(PVP.ws && PVP.ws.readyState === 1 && PVP.ver >= 4); }
function chatLine(m) {
  var d = document.createElement('div'); d.className = 'cm'; var c = CHAT_CH[m.c] || CHAT_CH.world; d.style.color = c[1];
  var tag = '[' + c[0] + '] ', who = m.c === 'priv' ? (m.me ? 'To ' + m.to : 'From ' + m.n) : m.n;
  d.appendChild(document.createTextNode(tag)); var b = document.createElement('b'); b.textContent = who + ': ';
  if (m.c === 'priv' || m.n) b.addEventListener('pointerup', function () { var who2 = m.c === 'priv' && m.me ? m.to : m.n; if (who2 === P.name) return; CHAT.to = who2; CHAT.ch = 'priv'; CHAT.tab = 'priv'; if (ui.open === 'Chat') rerender(); else openChat(); });
  d.appendChild(b); d.appendChild(document.createTextNode(m.msg)); return d;
}
function chatShown(m) { return CHAT.tab === 'all' || CHAT.tab === m.c; }
function chatIn(m) {
  CHAT.msgs.push(m); if (CHAT.msgs.length > 120) CHAT.msgs.shift();
  log('[' + (CHAT_CH[m.c] || CHAT_CH.world)[0] + '] ' + (m.c === 'priv' ? (m.me ? 'To ' + m.to : 'From ' + m.n) : m.n) + ': ' + m.msg, (CHAT_CH[m.c] || CHAT_CH.world)[1]);
  if (ui.open === 'Chat' && CHAT.feed && document.body.contains(CHAT.feed)) { if (chatShown(m)) { CHAT.feed.appendChild(chatLine(m)); CHAT.feed.scrollTop = CHAT.feed.scrollHeight; } }
  else if (!m.me) { CHAT.unread++; chatDot(); }
}
function chatDot() { var d = $('chat-dot'); if (!d) return; d.style.display = CHAT.unread ? 'block' : 'none'; d.textContent = CHAT.unread > 9 ? '9+' : CHAT.unread; }
function openChat() { CHAT.unread = 0; chatDot(); openPanel('Chat', renderChat); }
function renderChat(body) {
  var tabs = h('div', 'tabs', null, body);
  CHAT_TABS.forEach(function (t) { var b = h('button', CHAT.tab === t[0] ? 'act' : null, t[1], tabs); b.addEventListener('click', function () { CHAT.tab = t[0]; if (t[0] === 'guild') CHAT.ch = 'guild'; else if (t[0] === 'priv') CHAT.ch = 'priv'; else if (t[0] === 'map') CHAT.ch = 'map'; else if (CHAT.ch === 'guild' || CHAT.ch === 'priv' || CHAT.ch === 'map') CHAT.ch = CHAT.ch; rerender(); }); });
  if (!chatOn()) h('div', 'ds', '🔴 Chat needs the online server (v4). Check Settings > Game server, and update server/pvp_server.js.', body).style.color = '#ff9a9a';
  var feed = h('div', null, null, body); feed.id = 'chat-feed'; CHAT.feed = feed;
  var list = CHAT.msgs.filter(chatShown); if (!list.length) h('div', 'ds', CHAT.tab === 'map' ? 'Only players in this map can see Map chat.' : 'No messages yet.', feed);
  list.forEach(function (m) { feed.appendChild(chatLine(m)); }); feed.scrollTop = feed.scrollHeight;
  var row = h('div', 'chat-row', null, body), sel = h('select', null, null, row);
  [['world', 'World'], ['map', 'Map'], ['guild', 'Guild'], ['priv', 'Whisper']].forEach(function (o) { var op = document.createElement('option'); op.value = o[0]; op.textContent = o[1]; if (CHAT.ch === o[0]) op.selected = true; sel.appendChild(op); });
  var to = h('input', null, null, row); to.type = 'text'; to.placeholder = 'Player name'; to.maxLength = 20; to.value = CHAT.to; to.style.maxWidth = '34%'; to.style.display = CHAT.ch === 'priv' ? '' : 'none';
  to.addEventListener('input', function () { CHAT.to = to.value; });
  sel.addEventListener('change', function () { CHAT.ch = sel.value; to.style.display = CHAT.ch === 'priv' ? '' : 'none'; });
  var row2 = h('div', 'chat-row', null, body), inp = h('input', null, null, row2); inp.type = 'text'; inp.placeholder = 'Type a message...'; inp.maxLength = 120;
  function go() {
    var v = inp.value.trim(); if (!v) return;
    if (!chatOn()) { log('Chat needs the online server (v4).', '#ff9a9a'); return; }
    if (CHAT.ch === 'guild') { if (!GUILD.g) { log('You are not in a guild.', '#ff9a9a'); return; } pvpSend({ t: 'gc', msg: v }); }
    else if (CHAT.ch === 'priv') { var tn = (to.value || '').trim(); if (!tn) { log('Type the player name to whisper.', '#ff9a9a'); return; } CHAT.to = tn; pvpSend({ t: 'ch', c: 'priv', to: tn, msg: v }); }
    else pvpSend({ t: 'ch', c: CHAT.ch, msg: v });
    inp.value = '';
  }
  inp.addEventListener('keydown', function (e) { if (e.key === 'Enter') go(); });
  var sb = h('button', null, 'Send', row2); sb.style.cssText = 'padding:8px 14px;border-radius:8px;border:1px solid #fff;background:#2e9b3d;color:#fff;font-weight:700'; sb.addEventListener('click', go);
  h('div', 'ds', 'Tip: tap a player name in the chat to whisper them.', body);
}
tapBtn('b-chat', function () { openChat(); });
