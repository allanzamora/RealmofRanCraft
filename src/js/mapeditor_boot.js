/* mapeditor_boot.js - starts the standalone Map Editor (three_bundle_map_editor.html): hides the game's menus and opens the editor */
(function () {
  var st = document.createElement('style'); st.textContent = '#boot,#name-screen,#welcome,#auth-screen{display:none!important}'; document.head.appendChild(st);
  var tries = 0;
  (function go() {
    if (typeof openMapEditor === 'function' && typeof curMap !== 'undefined' && curMap && typeof P !== 'undefined') {
      try { P.named = true; } catch (e) {}
      ['name-screen', 'welcome', 'auth-screen', 'boot'].forEach(function (i) { var e = document.getElementById(i); if (e) e.style.display = 'none'; });
      try { ui.open = null; } catch (e) {}
      openMapEditor(); return;
    }
    if (++tries < 200) setTimeout(go, 100);
  })();
})();
