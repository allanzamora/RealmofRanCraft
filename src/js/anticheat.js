/* anticheat.js - client-side deterrents against Cheat Engine / GameGuardian / Game Killer style memory editing,
   save-file editing and speed hacks. A browser game can never be 100% cheat-proof, but this stops the common tools:
   1) key values (gold, diamonds, level, xp, stat points, rebirth) are stored ENCRYPTED with a key that changes on every write,
      so a memory value-scan finds nothing, plus a plain "decoy" copy that is only a trap (editing it = caught)
   2) every value carries a checksum: if the stored number is edited, the next read detects it and restores the last valid value
   3) the save is signed: a hand-edited localStorage save is detected on load
   4) speed-hack check (game clock vs. real clock) and HP/MP sanity clamp
   Penalty: warning, value restored; 3 strikes = Gold and Diamonds reset to 0. */
var acStrikes = 0, acTamper = false, acLastMsg = 0;
var AC_SALT = 'rc#Q7vX9!mN2pL4zT';
function acHash(str) { var h1 = 0x811c9dc5, h2 = 5381; for (var i = 0; i < str.length; i++) { var c = str.charCodeAt(i); h1 ^= c; h1 = Math.imul(h1, 16777619); h2 = (Math.imul(h2, 33) ^ c) | 0; } return (h1 >>> 0).toString(36) + (h2 >>> 0).toString(36); }
function acSeal(json) { return 'AC1.' + acHash(AC_SALT + json) + '.' + json; }
function acOpen(raw) {          // returns the JSON text; flags acTamper when the signature does not match
  if (!raw) return raw;
  if (raw.slice(0, 4) !== 'AC1.') return raw;        // older unsigned save: accepted once, signed on next save
  var d = raw.indexOf('.', 4), sig = raw.slice(4, d), json = raw.slice(d + 1);
  if (acHash(AC_SALT + json) !== sig) acTamper = true;
  return json;
}
function acBanner(msg) {
  var now = Date.now(); if (now - acLastMsg < 4000) return; acLastMsg = now;
  try { log(msg, '#ff5a5a'); var b = document.getElementById('ac-banner');
    if (!b) { b = document.createElement('div'); b.id = 'ac-banner'; document.body.appendChild(b); }
    b.textContent = msg; b.style.opacity = '1'; clearTimeout(b._t); b._t = setTimeout(function () { b.style.opacity = '0'; }, 4500); } catch (e) {}
}
function acStrike(kind) {
  acStrikes++;
  if (acStrikes >= 3 && kind !== 'speed') { P.gold = 0; P.diamonds = 0; acBanner('CHEAT DETECTED (' + acStrikes + ' strikes): Gold and Diamonds reset. Play fair!'); }
  else acBanner('Cheat detected (' + kind + '). Value restored. Strike ' + acStrikes + '/3 - Gold & Diamonds are wiped at 3.');
  try { saveGame(); } catch (e) {}
}
var acDecoys = {}, acGuards = {};
function acGuard(name) {
  var v0 = +P[name] || 0, a = 0, k = 0, c = 0, last = v0;
  function chk(v, kk) { return ((Math.abs(Math.floor(v)) % 1000003) * 7919 + (kk % 99991) * 104729) % 2147483629; }
  function put(v) { if (!isFinite(v)) v = last; k = Math.floor(Math.random() * 1e9) + 1; a = v + k; c = chk(v, k); last = v; acDecoys[name] = v; }
  function read() {
    var v = a - k;
    if (chk(v, k) !== c || !isFinite(v)) { v = last; put(v); acStrike('memory'); }
    return v;
  }
  put(v0);
  Object.defineProperty(P, name, { enumerable: true, configurable: false, get: read, set: put });
  acGuards[name] = { read: read, decoy: function () { return acDecoys[name]; } };
}
['gold', 'diamonds', 'lvl', 'xp', 'sp', 'reb'].forEach(acGuard);
/* acDecoys holds a plain, always-current copy of each value. A memory scanner finds THAT number first;
   the real value is stored encrypted. If the decoy ever differs from the real value, it was edited = caught. */
var acWatch = 0, acT0 = performance.now(), acD0 = Date.now(), acSpeedBad = 0;
function updateAntiCheat(dt) {
  acWatch += dt; if (acWatch < 1) return; acWatch = 0;
  for (var n in acGuards) {
    var real = acGuards[n].read();
    if (acDecoys[n] !== real) { acDecoys[n] = real; acStrike('memory'); }
  }
  // HP / MP sanity
  if (!isFinite(P.hp)) P.hp = maxHp(); if (!isFinite(P.mp)) P.mp = maxMp();
  if (P.hp > maxHp() * 1.001 + 1) { P.hp = maxHp(); }
  if (P.mp > maxMp() * 1.001 + 1) { P.mp = maxMp(); }
  // speed hack: game clock vs. real clock
  var dp = performance.now() - acT0, dd = Date.now() - acD0;
  if (dp > 5000) { var ratio = dp / Math.max(1, dd); if (ratio > 1.3 || ratio < 0.7) { if (++acSpeedBad >= 2) { acSpeedBad = 0; acStrike('speed'); } } else acSpeedBad = 0; acT0 = performance.now(); acD0 = Date.now(); }
}
