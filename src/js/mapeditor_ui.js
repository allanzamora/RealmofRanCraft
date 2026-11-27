/* mapeditor_ui.js - Map Editor (only in three_bundle_map_editor.html): import map_XX.js, view layout, edit, resize, Save = copy-paste code */
/* ======================= editor UI ======================= */
var ME = { files: [], on: false, id: null, tool: 'pan', cx: 0, cz: 0, zoom: 2, base: null, size: 0, mob: null, wallA: null, drag: null, pts: {}, pinch: 0, msg: '', root: null };
var ME_KIND = { tree: [0.55, '#2f9f45'], rock: [0.85, '#9aa0aa'], pillar: [0.9, '#d8d2b8'], crate: [0.9, '#b87a40'], bush: [0.5, '#4fc060'],
  cactus: [0.5, '#3c9a4a'], stump: [0.5, '#7a5230'], mushroom: [0.5, '#d94a4a'], barrel: [0.55, '#8a5a2e'], lamp: [0.35, '#ffd36a'], crystal: [0.7, '#6ad8ff'], tomb: [0.6, '#8a8f98'],
  statue: [0.8, '#b0aa9a'], well: [1.1, '#8a8478'], tent: [1.6, '#d8c090'], torch: [0.3, '#ff8a3a'], hay: [0.9, '#d8b84a'], flower: [0.35, '#ff7ab8'] };
var ME_ICON = { tree: '🌲', rock: '🪨', pillar: '🏛', crate: '📦', bush: '🌿', cactus: '🌵', stump: '🪵', mushroom: '🍄', barrel: '🛢', lamp: '💡', crystal: '💎', tomb: '🪦', statue: '🗿', well: '⛲', tent: '⛺', torch: '🔥', hay: '🌾', flower: '🌸', wall: '🧱', mob: '👾', portal: '🌀' };
var ME_UNDO = [];
function meUndoPush() { try { ME_UNDO.push(JSON.stringify(MAP_EDITS)); if (ME_UNDO.length > 80) ME_UNDO.shift(); } catch (e) {} }
function meUndo() {
  ME.wallA = null; if (!ME_UNDO.length) { ME.msg = 'Nothing to undo.'; meDraw(); return; }
  var s = JSON.parse(ME_UNDO.pop()); for (var k in MAP_EDITS) delete MAP_EDITS[k]; for (var k2 in s) MAP_EDITS[k2] = s[k2];
  meSaveWip(); meReload(ME.id, true); ME.msg = 'Undone (' + ME_UNDO.length + ' more).'; meDraw();
}
function meEdit(create) { var id = ME.id; if (!MAP_EDITS[id] && create) MAP_EDITS[id] = {}; return MAP_EDITS[id] || null; }
function meSaveWip() { try { localStorage.setItem('moviex_mapedit_wip', JSON.stringify(MAP_EDITS)); } catch (e) {} }
function meLoadWip() { try { var w = JSON.parse(localStorage.getItem('moviex_mapedit_wip') || 'null'); if (w) for (var k in w) MAP_EDITS[k] = w[k]; } catch (e) {} }
function meSnap() {
  var m = mapById(ME.id), ed = meEdit(false);
  ME.base = {
    R: m.R, safeR: m.safeR, portal: m.portalAt || (m.arena ? [0, 0] : [9.5, 9.5]),
    obs: obstacles.map(function (o) { return { x: o.x, z: o.z, r: o.r, tag: o.tag }; }),
    mobs: enemies.filter(function (e) { return !e.edge && !e.world && !e.moba; }).map(function (e) { return { key: e.type, x: e.spawn.x, z: e.spawn.z, boss: !!e.T.boss, ed: !!e.ed }; }),
    npcs: npcs.map(function (n) { return { name: n.name, x: n.pos.x, z: n.pos.z }; }), frozenDecor: !!(ed && ed.decor), frozenMobs: !!(ed && ed.spawns)
  };
}
function meFreezeDecor() {
  var ed = meEdit(true); if (ed.decor) return;
  ed.decor = ME.base.obs.filter(function (o) { return o.tag === 'sc' || o.tag === 'rk'; }).map(function (o) { return [o.tag === 'rk' ? 'rock' : 'tree', +o.x.toFixed(1), +o.z.toFixed(1), +o.r.toFixed(2)]; });
  ME.base.frozenDecor = true; ME.msg = 'Props frozen (' + ed.decor.length + ' trees/rocks now editable).'; meSaveWip();
}
function meFreezeMobs() {
  var ed = meEdit(true); if (ed.spawns) return;
  ed.spawns = ME.base.mobs.map(function (b) { return [b.key, +b.x.toFixed(1), +b.z.toFixed(1)]; });
  ME.base.frozenMobs = true; ME.msg = 'Mob spawns frozen (' + ed.spawns.length + ' now editable).'; meSaveWip();
}
function meFreezeBuild() {
  var ed = meEdit(true); if (ed.nb) return;
  var src = ME.base.obs.filter(function (o) { return o.tag === 'bd'; }), used = new Array(src.length), walls = [], decor = [];
  function runs(axis) {                      // axis 'x': circles sharing the same z in a row (wall along X); 'z': same x (wall along Z)
    var key = axis === 'x' ? 'z' : 'x', mv = axis === 'x' ? 'x' : 'z', groups = {};
    src.forEach(function (o, i) { if (used[i] || o.r > 1.05) return; var k = o[key].toFixed(1); (groups[k] = groups[k] || []).push(i); });
    Object.keys(groups).forEach(function (k) {
      var ids = groups[k].sort(function (a, b) { return src[a][mv] - src[b][mv]; }), cur = [];
      function flush() { if (cur.length >= 3) { var a = src[cur[0]], b = src[cur[cur.length - 1]]; walls.push([+a.x.toFixed(1), +a.z.toFixed(1), +b.x.toFixed(1), +b.z.toFixed(1)]); cur.forEach(function (i) { used[i] = 1; }); } cur = []; }
      ids.forEach(function (i) { if (cur.length && src[i][mv] - src[cur[cur.length - 1]][mv] > 1.7) flush(); cur.push(i); }); flush();
    });
  }
  runs('x'); runs('z');
  src.forEach(function (o, i) { if (!used[i]) decor.push([o.r >= 1.2 ? 'crate' : 'pillar', +o.x.toFixed(1), +o.z.toFixed(1), +Math.max(0.3, o.r / 1.1).toFixed(2)]); });
  ed.nb = true; ed.walls = (ed.walls || []).concat(walls); ed.decor = (ed.decor || []).concat(decor);
  ME.msg = 'Unlocked the map\'s built-in walls/objects: ' + walls.length + ' walls + ' + decor.length + ' objects are now editable (original 3D decorations removed).'; meSaveWip();
}
function meUnlockAll() { var had0 = meEdit(false) && meEdit(false).nb; if (!had0 && ME.tool === 'pan') meUndoPush(); var had = !!(meEdit(false) && meEdit(false).nb); meFreezeDecor(); meFreezeMobs(); meFreezeBuild(); if (!had) { var m = ME.msg; meReload(ME.id, true); ME.msg = m; } meDraw(); }
function meReload(id, keepView) {
  ME.id = id; var m = mapById(id); mapEditBegin(m);
  try { loadMap(id, true); } catch (e) { ME.msg = 'Map error: ' + e.message; }
  meSnap(); if (!keepView) { ME.msg = ''; ME.cx = 0; ME.cz = 0; ME.zoom = Math.max(0.4, Math.min(4, (Math.min(ME.cv.width, ME.cv.height) / 2) / (m.R + 15))); }
  meUI(); meDraw();
}
function meColor(key) { var keys = Object.keys(ENEMY_TYPES), i = Math.max(0, keys.indexOf(key)); return 'hsl(' + ((i * 47) % 360) + ',85%,60%)'; }
function meS(x, z) { return [(x - ME.cx) * ME.zoom + ME.cv.width / 2, (z - ME.cz) * ME.zoom + ME.cv.height / 2]; }
function meW(sx, sy) { return [(sx - ME.cv.width / 2) / ME.zoom + ME.cx, (sy - ME.cv.height / 2) / ME.zoom + ME.cz]; }
function meDraw() {
  if (!ME.on || !ME.base) return;
  var cv = ME.cv, g = cv.getContext('2d'), b = ME.base, ed = meEdit(false), R = (ed && ed.R) || b.R, SR = (ed && ed.safeR != null) ? ed.safeR : b.safeR, pt, i;
  g.fillStyle = '#10131c'; g.fillRect(0, 0, cv.width, cv.height);
  var step = ME.zoom > 3 ? 10 : ME.zoom > 1 ? 20 : 50; g.strokeStyle = 'rgba(255,255,255,.06)'; g.lineWidth = 1;
  var a = meW(0, 0), z0 = meW(cv.width, cv.height);
  for (var gx = Math.floor(a[0] / step) * step; gx < z0[0]; gx += step) { pt = meS(gx, 0); g.beginPath(); g.moveTo(pt[0], 0); g.lineTo(pt[0], cv.height); g.stroke(); }
  for (var gz = Math.floor(a[1] / step) * step; gz < z0[1]; gz += step) { pt = meS(0, gz); g.beginPath(); g.moveTo(0, pt[1]); g.lineTo(cv.width, pt[1]); g.stroke(); }
  pt = meS(0, 0); g.fillStyle = '#1b2236'; g.beginPath(); g.arc(pt[0], pt[1], R * ME.zoom, 0, 6.2832); g.fill(); g.strokeStyle = '#5aa0ff'; g.lineWidth = 2; g.stroke();
  g.fillStyle = 'rgba(80,220,120,.15)'; g.beginPath(); g.arc(pt[0], pt[1], SR * ME.zoom, 0, 6.2832); g.fill(); g.strokeStyle = '#46d878'; g.lineWidth = 1.5; g.stroke();
  function dot(x, z, r, col, ring) { var p = meS(x, z); g.fillStyle = col; g.beginPath(); g.arc(p[0], p[1], Math.max(1.5, r * ME.zoom), 0, 6.2832); g.fill(); if (ring) { g.strokeStyle = ring; g.lineWidth = 1.5; g.stroke(); } }
  b.obs.forEach(function (o) { if (o.tag === 'ed' || (o.tag === 'bd' && ed && ed.nb)) return; if ((o.tag === 'sc' || o.tag === 'rk') && b.frozenDecor) return; dot(o.x, o.z, o.r, o.tag ? '#5f7a66' : '#7d8493'); });
  if (ed && ed.decor) ed.decor.forEach(function (d) { dot(d[1], d[2], d[3], (ME_KIND[d[0]] || [0, '#ccc'])[1], '#ffffff55'); });
  if (ed && ed.walls) ed.walls.forEach(function (w) { var p1 = meS(w[0], w[1]), p2 = meS(w[2], w[3]); g.strokeStyle = '#d0c8b0'; g.lineWidth = Math.max(2, 1.2 * ME.zoom); g.lineCap = 'round'; g.beginPath(); g.moveTo(p1[0], p1[1]); g.lineTo(p2[0], p2[1]); g.stroke(); g.fillStyle = '#ffd54f'; [p1, p2].forEach(function (q) { g.beginPath(); g.arc(q[0], q[1], 4, 0, 6.2832); g.fill(); }); });
  if (ME.wallA) dot(ME.wallA[0], ME.wallA[1], 0.8, '#ffffff');
  var mobs = (ed && ed.spawns) ? ed.spawns.map(function (s) { return { key: s[0], x: s[1], z: s[2], boss: !!(ENEMY_TYPES[s[0]] && ENEMY_TYPES[s[0]].boss), ed: 1 }; }) : b.mobs;
  mobs.forEach(function (s) { dot(s.x, s.z, s.boss ? 3 : 1.6, meColor(s.key), s.boss ? '#fff' : (s.ed ? '#000' : null)); });
  b.npcs.forEach(function (n) { var p = meS(n.x, n.z); g.fillStyle = '#4fb4ff'; g.fillRect(p[0] - 3, p[1] - 3, 6, 6); });
  var pp = (ed && ed.portal) || b.portal, p3 = meS(pp[0], pp[1]); g.fillStyle = '#c070ff'; g.beginPath(); g.moveTo(p3[0], p3[1] - 9); g.lineTo(p3[0] + 7, p3[1]); g.lineTo(p3[0], p3[1] + 9); g.lineTo(p3[0] - 7, p3[1]); g.closePath(); g.fill();
  var c = meS(ME.pt ? ME.pt[0] : 0, ME.pt ? ME.pt[1] : 0);
  if (ME.info) ME.info.textContent = (ME.msg ? ME.msg + '   ' : '') + 'R ' + R + '  safe ' + SR + '  props ' + (ed && ed.decor ? ed.decor.length : b.obs.filter(function (o) { return o.tag === 'sc' || o.tag === 'rk'; }).length) + '  walls ' + ((ed && ed.walls) ? ed.walls.length : 0) + '  mobs ' + mobs.length + '  npcs ' + b.npcs.length + '   ' + (ME.pt ? 'x ' + ME.pt[0].toFixed(1) + ' z ' + ME.pt[1].toFixed(1) : '');
}
function meNearest(x, z) {
  var ed = meEdit(false), best = null, tol = 16 / ME.zoom + 0.8;
  function consider(kind, idx, d) { if (d < tol && (!best || d < best.d)) best = { kind: kind, idx: idx, d: d }; }
  if (ed) {
    (ed.decor || []).forEach(function (o, i) { consider('decor', i, Math.max(0, Math.hypot(o[1] - x, o[2] - z) - o[3])); });
    (ed.spawns || []).forEach(function (o, i) { consider('spawn', i, Math.hypot(o[1] - x, o[2] - z)); });
    (ed.walls || []).forEach(function (w, i) { var dx = w[2] - w[0], dz = w[3] - w[1], L2 = dx * dx + dz * dz || 1, t = Math.max(0, Math.min(1, ((x - w[0]) * dx + (z - w[1]) * dz) / L2)); var d0 = Math.hypot(w[0] - x, w[1] - z), d1 = Math.hypot(w[2] - x, w[3] - z);
      if (Math.min(d0, d1) < tol) { var bb = { kind: 'wall', idx: i, d: Math.min(d0, d1) - 0.5, end: d0 <= d1 ? 0 : 1 }; if (!best || bb.d < best.d) best = bb; } else consider('wall', i, Math.hypot(w[0] + dx * t - x, w[1] + dz * t - z)); });
  }
  return best;
}
function meTap(x, z) {
  var t = ME.tool, ed;
  if (t === 'pan') return;
  if (ME_KIND[t]) { meUndoPush(); meFreezeDecor(); ed = meEdit(true); ed.decor.push([t, +x.toFixed(1), +z.toFixed(1), +(ME.size || ME_KIND[t][0]).toFixed(2)]); }
  else if (t === 'wall') { if (!ME.wallA) { ME.wallA = [x, z]; ME.msg = 'Tap the wall end point.'; } else { meUndoPush(); ed = meEdit(true); ed.walls = ed.walls || []; ed.walls.push([+ME.wallA[0].toFixed(1), +ME.wallA[1].toFixed(1), +x.toFixed(1), +z.toFixed(1)]); ME.wallA = null; ME.msg = ''; } }
  else if (t === 'mob') { if (!ME.mob) { ME.msg = 'Pick a mob type first.'; } else { meUndoPush(); meFreezeMobs(); ed = meEdit(true); ed.spawns.push([ME.mob, +x.toFixed(1), +z.toFixed(1)]); } }
  else if (t === 'portal') { meUndoPush(); ed = meEdit(true); ed.portal = [+x.toFixed(1), +z.toFixed(1)]; }
  else if (t === 'erase') {
    meUndoPush(); meUnlockAll(); var h = meNearest(x, z); ed = meEdit(true);
    if (h) { (h.kind === 'decor' ? ed.decor : h.kind === 'spawn' ? ed.spawns : ed.walls).splice(h.idx, 1); } else ME.msg = 'Nothing editable here.';
  }
  meSaveWip(); meDraw();
}
function meDragStart(x, z) { if (ME.tool !== 'move') return false; meUndoPush(); meUnlockAll(); var h = meNearest(x, z); if (!h) return false; ME.drag = h; return true; }
function meDragMove(x, z) {
  var h = ME.drag, ed = meEdit(false); if (!h || !ed) return;
  if (h.kind === 'decor') { ed.decor[h.idx][1] = +x.toFixed(1); ed.decor[h.idx][2] = +z.toFixed(1); }
  else if (h.kind === 'spawn') { ed.spawns[h.idx][1] = +x.toFixed(1); ed.spawns[h.idx][2] = +z.toFixed(1); }
  else if (h.end != null) { var we = ed.walls[h.idx]; we[h.end * 2] = +x.toFixed(1); we[h.end * 2 + 1] = +z.toFixed(1); }
  else { var w = ed.walls[h.idx], dx = w[2] - w[0], dz = w[3] - w[1], mx = (w[0] + w[2]) / 2, mz = (w[1] + w[3]) / 2; w[0] = +(x - dx / 2).toFixed(1); w[1] = +(z - dz / 2).toFixed(1); w[2] = +(x + dx / 2).toFixed(1); w[3] = +(z + dz / 2).toFixed(1); }
  meDraw();
}
function meResize(R, SR, scaleObjs) {
  var m = mapById(ME.id), old = (meEdit(false) && meEdit(false).R) || m._R0 || m.R; R = Math.max(40, Math.min(1200, R | 0)); SR = Math.max(0, Math.min(R - 10, +SR || 0));
  meUndoPush(); var ed = meEdit(true), k = R / old;
  if (scaleObjs && k !== 1) {
    meUnlockAll(); ed = meEdit(true);
    ed.decor.forEach(function (d) { d[1] = +(d[1] * k).toFixed(1); d[2] = +(d[2] * k).toFixed(1); });
    ed.spawns.forEach(function (d) { d[1] = +(d[1] * k).toFixed(1); d[2] = +(d[2] * k).toFixed(1); });
    (ed.walls || []).forEach(function (w) { for (var i = 0; i < 4; i++) w[i] = +(w[i] * k).toFixed(1); });
    if (ed.portal) ed.portal = [+(ed.portal[0] * k).toFixed(1), +(ed.portal[1] * k).toFixed(1)];
  }
  ed.R = R; ed.safeR = SR; meSaveWip(); meReload(ME.id, true); ME.msg = 'Resized to R ' + R + (scaleObjs ? ' (objects scaled x' + k.toFixed(2) + ')' : '') + '.'; meDraw();
}
var ME_MARK0 = '/* >>> MAP EDITOR EDITS (generated by three_bundle_map_editor.html - re-import this file in the editor to change them) >>> */', ME_MARK1 = '/* <<< MAP EDITOR EDITS <<< */';
function meStrip(t) { var a = t.indexOf(ME_MARK0), b = t.indexOf(ME_MARK1); if (a < 0 || b < a) return t; return (t.slice(0, a).replace(/\s+$/, '') + '\n' + t.slice(b + ME_MARK1.length).replace(/^\s+/, '')).replace(/\s+$/, '') + '\n'; }
function meFooter(ids) {
  var l = ids.filter(function (k) { return MAP_EDITS[k] && Object.keys(MAP_EDITS[k]).length; }); if (!l.length) return '';
  var s = '\n' + ME_MARK0 + '\nvar MAP_EDITS = (typeof MAP_EDITS !== \'undefined\' && MAP_EDITS) || {};\n';
  l.forEach(function (k) { s += 'MAP_EDITS[' + JSON.stringify(k) + '] = ' + JSON.stringify(MAP_EDITS[k]) + ';\n'; }); return s + ME_MARK1 + '\n';
}
function meSaveDialog() {
  var d = document.createElement('div'); d.style.cssText = 'position:fixed;inset:0;z-index:220;background:#0b0d14;color:#fff;font:12px sans-serif;display:flex;flex-direction:column;overflow:auto;padding:8px;box-sizing:border-box';
  function mk(tag, css, text, parent) { var e = document.createElement(tag); if (css) e.style.cssText = css; if (text != null) e.textContent = text; (parent || d).appendChild(e); return e; }
  var bc = 'padding:8px 12px;margin:3px;border-radius:8px;border:1px solid #556;background:#222a44;color:#fff;font-weight:700;font-size:13px';
  var top = mk('div', 'display:flex;align-items:center;margin-bottom:6px'); mk('div', 'flex:1;font-size:15px;font-weight:800', 'Save: copy the code and paste it into the map file', top);
  var x = mk('button', bc + ';background:#8a1a2a', '✕ Close', top); x.addEventListener('click', function () { d.remove(); });
  function block(title, code, fname, note) {
    mk('div', 'margin-top:10px;font-weight:800;color:#ffd54f', title, d); if (note) mk('div', 'color:#9fd8ff;margin:2px 0', note, d);
    var row = mk('div', 'display:flex;flex-wrap:wrap', d), ta = mk('textarea', 'width:100%;height:130px;background:#0a0d18;color:#9fe3a0;font-size:10px;box-sizing:border-box', null, d); ta.value = code; ta.readOnly = true;
    var cp = mk('button', bc + ';background:#1f7a3a', 'Copy code', row);
    cp.addEventListener('click', function () { ta.focus(); ta.select(); var ok = false; try { ok = document.execCommand('copy'); } catch (e) {} if (!ok && navigator.clipboard) { navigator.clipboard.writeText(code).then(function () { cp.textContent = 'Copied ✔'; }); } else cp.textContent = ok ? 'Copied ✔' : 'Select all + copy'; });
    var dl = mk('button', bc, 'Download ' + fname, row); dl.addEventListener('click', function () { var a = document.createElement('a'); a.href = URL.createObjectURL(new Blob([code], { type: 'text/javascript' })); a.download = fname; document.body.appendChild(a); a.click(); setTimeout(function () { a.remove(); }, 500); });
  }
  var used = {};
  ME.files.forEach(function (f) {
    f.ids.forEach(function (k) { used[k] = 1; });
    var foot = meFooter(f.ids);
    block(f.name + (foot ? '  (with your edits)' : '  (no edits)'), f.text + foot, f.name, 'Select all of this code and paste it over the whole contents of ' + f.name + '.');
  });
  var other = Object.keys(MAP_EDITS).filter(function (k) { return !used[k] && MAP_EDITS[k] && Object.keys(MAP_EDITS[k]).length; });
  if (other.length) block('Maps that were not imported from a file: ' + other.join(', '), meFooter(other), 'map_edits_snippet.js', 'No source file was imported for these maps. Paste this at the END of the map file that defines them (or import that file first, then Save).');
  if (!ME.files.length && !other.length) mk('div', 'margin-top:14px', 'Nothing to save yet: import a map file (Import map .js) and edit it.', d);
  document.body.appendChild(d);
}
function meImport(files) {
  var done = 0, msgs = [];
  Array.prototype.forEach.call(files, function (f) {
    var rd = new FileReader();
    rd.onload = function () {
      var n0 = MAPS.length, text = String(rd.result);
      try { (0, eval)(text); } catch (e) { msgs.push(f.name + ': ' + e.message); }
      for (var i = n0; i < MAPS.length; i++) {
        var nm = MAPS[i]; for (var j = 0; j < n0; j++) if (MAPS[j] && MAPS[j].id === nm.id) { MAPS.splice(j, 1); i--; n0--; break; }
      }
      MAPS.forEach(function (m) { if (!m.arena && !m.safe2x) { m.safeR *= 2; m.safe2x = true; } });
      var added = MAPS.slice(n0).map(function (m) { return m.id; }); msgs.push(f.name + ': ' + (added.length ? 'loaded ' + added.join(', ') : 'executed (no new map)'));
      ME.files = ME.files.filter(function (q) { return q.name !== f.name; }); ME.files.push({ name: f.name, text: meStrip(text), ids: added });
      added.forEach(function (id) { var mm = mapById(id); delete mm._R0; delete mm._S0; delete mm._P0; });
      if (++done === files.length) { ME.msg = msgs.join(' | '); meUI(); var last = MAPS[MAPS.length - 1]; if (last) { ME.sel.value = last.id; meReload(last.id); } }
    };
    rd.readAsText(f);
  });
}
function meUI() {
  if (!ME.root) return;
  var sel = ME.sel; if (sel) { var cur = sel.value || ME.id; sel.innerHTML = ''; MAPS.forEach(function (m) { var o = document.createElement('option'); o.value = m.id; o.textContent = m.name + ' (' + m.id + ')'; sel.appendChild(o); }); sel.value = ME.id || cur; }
  var ms = ME.mobSel; if (ms) { var cv = ms.value; ms.innerHTML = ''; var m0 = mapById(ME.id), keys = (m0.enemies || []).concat((m0.mobs || [])).filter(function (k, i, a) { return ENEMY_TYPES[k] && a.indexOf(k) === i; }); Object.keys(ENEMY_TYPES).forEach(function (k) { if (keys.indexOf(k) < 0) keys.push(k); });
    keys.forEach(function (k) { var o = document.createElement('option'); o.value = k; o.textContent = ENEMY_TYPES[k].name + ' Lv' + ENEMY_TYPES[k].lvl; o.style.color = meColor(k); ms.appendChild(o); }); ms.value = cv && ENEMY_TYPES[cv] ? cv : keys[0]; ME.mob = ms.value; }
  var ed = meEdit(false), m = mapById(ME.id); if (ME.rIn) { ME.rIn.value = (ed && ed.R) || m.R; ME.sIn.value = (ed && ed.safeR != null) ? ed.safeR : m.safeR; }
  Array.prototype.forEach.call(ME.root.querySelectorAll('[data-tool]'), function (b) { b.style.outline = b.dataset.tool === ME.tool ? '2px solid #ffd54f' : 'none'; });
  if (ME.place) ME.place.value = ME_KIND[ME.tool] || ME.tool === 'wall' || ME.tool === 'mob' || ME.tool === 'portal' ? ME.tool : '';
}
function openMapEditor() {
  if (ME.on) return; meLoadWip(); ME.on = true; ME.prevUi = ui.open; ui.open = 'editor';
  var r = document.createElement('div'); ME.root = r; r.id = 'mapedit';
  r.style.cssText = 'position:fixed;inset:0;z-index:200;background:#0b0d14;color:#fff;font:12px sans-serif;display:flex;flex-direction:column;touch-action:none';
  function mk(tag, css, text, parent) { var e = document.createElement(tag); if (css) e.style.cssText = css; if (text != null) e.textContent = text; (parent || r).appendChild(e); return e; }
  var bcss = 'padding:6px 9px;margin:2px;border-radius:7px;border:1px solid #556;background:#222a44;color:#fff;font-size:12px;font-weight:700';
  function B(label, fn, parent, tool) { var b = mk('button', bcss, label, parent); b.addEventListener('click', fn); if (tool) { b.dataset.tool = tool; } return b; }
  var top = mk('div', 'padding:4px;background:#161b2e;display:flex;flex-wrap:wrap;align-items:center');
  ME.sel = mk('select', 'max-width:46vw;padding:5px;background:#222a44;color:#fff;border:1px solid #556;border-radius:6px', null, top); ME.sel.addEventListener('change', function () { meReload(ME.sel.value); });
  B('Reload', function () { meReload(ME.id, true); }, top);
  var imp = mk('input', 'display:none', null, top); imp.type = 'file'; imp.accept = '.js,text/javascript'; imp.multiple = true; imp.addEventListener('change', function () { if (imp.files.length) meImport(imp.files); imp.value = ''; });
  B('Import map .js', function () { imp.click(); }, top);
  B('💾 Save code', function () { meSaveDialog(); }, top).style.background = '#1f7a3a';
  B('↶ Undo', function () { meUndo(); }, top);
  ME.place = mk('select', 'max-width:44vw;padding:6px;margin:2px;background:#222a44;color:#fff;border:1px solid #556;border-radius:7px;font-size:13px;font-weight:700', null, top);
  var og = document.createElement('option'); og.value = ''; og.textContent = '➕ Place object…'; ME.place.appendChild(og);
  [['Nature', ['tree', 'bush', 'flower', 'mushroom', 'cactus', 'stump', 'rock']], ['Structures', ['wall', 'pillar', 'crate', 'barrel', 'hay', 'tent', 'well', 'statue', 'tomb']], ['Lights / magic', ['lamp', 'torch', 'crystal']], ['Game', ['mob', 'portal']]].forEach(function (grp) {
    var g = document.createElement('optgroup'); g.label = grp[0]; grp[1].forEach(function (k) { var o = document.createElement('option'); o.value = k; o.textContent = ME_ICON[k] + ' ' + k.charAt(0).toUpperCase() + k.slice(1); g.appendChild(o); }); ME.place.appendChild(g);
  });
  ME.place.addEventListener('change', function () { if (ME.place.value) { ME.tool = ME.place.value; ME.wallA = null; ME.msg = ''; meUI(); meDraw(); } });
  var tools = mk('div', 'padding:2px 4px;background:#12162a;display:flex;flex-wrap:wrap;align-items:center');
  [['pan', '✋ Pan'], ['move', '↔ Move'], ['erase', '🗑 Erase']].forEach(function (t) {
    B(t[1], function () { ME.tool = t[0]; ME.wallA = null; ME.msg = ''; meUI(); meDraw(); }, tools, t[0]);
  });
  ME.mobSel = mk('select', 'max-width:40vw;padding:5px;background:#222a44;color:#fff;border:1px solid #556;border-radius:6px', null, tools); ME.mobSel.addEventListener('change', function () { ME.mob = ME.mobSel.value; ME.tool = 'mob'; meUI(); });
  mk('span', 'margin-left:6px', 'Size', tools); var sz = mk('input', 'width:46px;padding:4px;background:#222a44;color:#fff;border:1px solid #556;border-radius:6px', null, tools); sz.type = 'number'; sz.step = '0.1'; sz.placeholder = 'auto'; sz.addEventListener('input', function () { ME.size = +sz.value || 0; });
  var rs = mk('div', 'padding:2px 4px;background:#12162a;display:flex;flex-wrap:wrap;align-items:center');
  mk('span', null, 'Map radius R', rs); ME.rIn = mk('input', 'width:62px;margin:0 6px 0 4px;padding:4px;background:#222a44;color:#fff;border:1px solid #556;border-radius:6px', null, rs); ME.rIn.type = 'number';
  mk('span', null, 'Safe zone', rs); ME.sIn = mk('input', 'width:54px;margin:0 6px 0 4px;padding:4px;background:#222a44;color:#fff;border:1px solid #556;border-radius:6px', null, rs); ME.sIn.type = 'number';
  var lab = mk('label', 'margin-right:6px', null, rs), cb = mk('input', null, null, lab); cb.type = 'checkbox'; cb.checked = true; lab.appendChild(document.createTextNode(' scale objects'));
  B('Apply resize', function () { meResize(+ME.rIn.value, +ME.sIn.value, cb.checked); }, rs);
  B('🔓 Unlock everything', function () { meUnlockAll(); }, rs);
  B('+', function () { ME.zoom = Math.min(8, ME.zoom * 1.3); meDraw(); }, rs); B('−', function () { ME.zoom = Math.max(0.2, ME.zoom / 1.3); meDraw(); }, rs);
  B('Clear edits of this map', function () { meUndoPush(); delete MAP_EDITS[ME.id]; meSaveWip(); meReload(ME.id, true); }, rs);
  ME.info = mk('div', 'padding:3px 6px;background:#0f1322;color:#9fd8ff;font-size:11px;min-height:15px');
  var cv = mk('canvas', 'flex:1;width:100%;min-height:0;touch-action:none'); ME.cv = cv;
  document.body.appendChild(r);
  function fit() { var rc = cv.getBoundingClientRect(); cv.width = Math.max(100, Math.round(rc.width)); cv.height = Math.max(100, Math.round(rc.height)); meDraw(); }
  ME.fit = fit; window.addEventListener('resize', fit); setTimeout(fit, 50);
  function pos(e) { var rc = cv.getBoundingClientRect(); return [(e.clientX - rc.left) * cv.width / rc.width, (e.clientY - rc.top) * cv.height / rc.height]; }
  var pts = {}, last = null, moved = 0, start = null;
  cv.addEventListener('pointerdown', function (e) { cv.setPointerCapture(e.pointerId); pts[e.pointerId] = pos(e); var ids = Object.keys(pts); if (ids.length === 2) { ME.pinch = Math.hypot(pts[ids[0]][0] - pts[ids[1]][0], pts[ids[0]][1] - pts[ids[1]][1]); ME.drag = null; } else { start = pos(e); last = start; moved = 0; var w = meW(start[0], start[1]); meDragStart(w[0], w[1]); } });
  cv.addEventListener('pointermove', function (e) {
    var p = pos(e), w = meW(p[0], p[1]); ME.pt = w; if (!pts[e.pointerId]) { meDraw(); return; } pts[e.pointerId] = p; var ids = Object.keys(pts);
    if (ids.length === 2) { var d = Math.hypot(pts[ids[0]][0] - pts[ids[1]][0], pts[ids[0]][1] - pts[ids[1]][1]); if (ME.pinch > 0) ME.zoom = Math.max(0.2, Math.min(8, ME.zoom * d / ME.pinch)); ME.pinch = d; meDraw(); return; }
    moved += Math.hypot(p[0] - last[0], p[1] - last[1]);
    if (ME.drag) meDragMove(w[0], w[1]);
    else if (ME.tool === 'pan' || moved > 10 && ['move'].indexOf(ME.tool) < 0 && false) { ME.cx -= (p[0] - last[0]) / ME.zoom; ME.cz -= (p[1] - last[1]) / ME.zoom; meDraw(); }
    last = p;
  });
  function up(e) { var had = !!pts[e.pointerId], n = Object.keys(pts).length; delete pts[e.pointerId]; if (n === 1 && had && !ME.drag && moved < 10 && start) { var w = meW(start[0], start[1]); meTap(w[0], w[1]); } if (n === 1) ME.drag = null; if (Object.keys(pts).length < 2) ME.pinch = 0; }
  cv.addEventListener('pointerup', up); cv.addEventListener('pointercancel', up);
  cv.addEventListener('wheel', function (e) { e.preventDefault(); ME.zoom = Math.max(0.2, Math.min(8, ME.zoom * (e.deltaY < 0 ? 1.15 : 1 / 1.15))); meDraw(); }, { passive: false });
  ME.id = curMap.id; meReload(ME.id);
}
function closeMapEditor() {
  if (!ME.on) return; ME.on = false; window.removeEventListener('resize', ME.fit); if (ME.root) ME.root.remove(); ME.root = null; ui.open = ME.prevUi || null; meSaveWip();
}
