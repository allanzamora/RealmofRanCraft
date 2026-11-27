/* cloud.js - Firebase LOGIN / SIGN-UP + CLOUD SAVE (Firebase Authentication email+password, Cloud Firestore doc users/{uid}).
   Put your Firebase web-app config below. Firebase web configs are public by design; the database rules protect the data. */
var FIREBASE_CONFIG = { apiKey: 'AIzaSyDW3stEoUduTdsrCl9v6mCdQcHBLahG80A', authDomain: 'html-codes-encrytper.firebaseapp.com', databaseURL: 'https://html-codes-encrytper.firebaseio.com', projectId: 'html-codes-encrytper', storageBucket: 'html-codes-encrytper.firebasestorage.app', messagingSenderId: '755964720135', appId: '1:755964720135:web:0087dad8e2b4a5715366a2' };

var CLOUD = { rt: false, sid: Math.random().toString(36).slice(2) + Date.now().toString(36), baseTs: 0, conflict: false, auth: null, db: null, user: null, ready: false, synced: false, dirty: false, last: 0, status: '', err: '', waiters: [], pushing: false };
var CLOUD_UID_KEY = 'moviex_uid', CLOUD_TS_KEY = 'moviex_ts', CLOUD_CFG_KEY = 'moviex_fbcfg';
function lsGet(k) { try { return localStorage.getItem(k); } catch (e) { return null; } }
function lsSet(k, v) { try { localStorage.setItem(k, v); } catch (e) {} }
function lsDel(k) { try { localStorage.removeItem(k); } catch (e) {} }

function cloudCfg() {
  var c = FIREBASE_CONFIG; if (c && c.apiKey && c.projectId) return c;
  return null;
}
function cloudInit() {
  if (CLOUD.auth) return true;
  if (typeof firebase === 'undefined') { CLOUD.err = 'sdk'; return false; }
  var cfg = cloudCfg(); if (!cfg) { CLOUD.err = 'cfg'; return false; }
  try {
    if (!firebase.apps || !firebase.apps.length) firebase.initializeApp(cfg);
    CLOUD.auth = firebase.auth();
    if (cfg.databaseURL && typeof firebase.database === 'function') { CLOUD.rt = true; CLOUD.db = firebase.database(); }   // Realtime Database (when the config has databaseURL)
    else { CLOUD.rt = false; CLOUD.db = firebase.firestore(); try { CLOUD.db.settings({ experimentalAutoDetectLongPolling: true, merge: true }); } catch (e) {} }
    CLOUD.auth.onAuthStateChanged(function (u) { CLOUD.user = u || null; CLOUD.ready = true; var w = CLOUD.waiters; CLOUD.waiters = []; w.forEach(function (f) { f(); }); });
    return true;
  } catch (e) { CLOUD.err = 'init'; CLOUD.auth = null; return false; }
}
function cloudWhenReady(fn) {
  if (CLOUD.ready) { fn(); return; }
  var fired = false, once = function () { if (fired) return; fired = true; fn(); };
  CLOUD.waiters.push(once); setTimeout(once, 7000);
}

/* ---------- save bookkeeping (called from saveGame) ---------- */
function cloudMark() {
  if (!CLOUD.synced) return;                                   // never touch the timestamp before the login/sync step is finished
  lsSet(CLOUD_TS_KEY, String(Date.now()));
  if (CLOUD.user) CLOUD.dirty = true;
}
function cloudPeek(raw) {                                       // read a sealed save without touching the anti-cheat flag
  try { if (!raw) return null; var j = raw; if (raw.slice(0, 4) === 'AC1.') j = raw.slice(raw.indexOf('.', 4) + 1); var s = JSON.parse(j); return (s && typeof s === 'object') ? s : null; } catch (e) { return null; }
}
/* storage helpers: Realtime Database (users/{uid}) or Firestore (users/{uid} document) */
function cloudTimeout(p, ms) { return new Promise(function (res, rej) { var t = setTimeout(function () { rej(new Error('timeout')); }, ms); p.then(function (v) { clearTimeout(t); res(v); }, function (e) { clearTimeout(t); rej(e); }); }); }
function cloudGet(uid) {
  if (CLOUD.rt) return CLOUD.db.ref('users/' + uid).once('value').then(function (s) { return s.val() || null; });
  return CLOUD.db.collection('users').doc(uid).get().then(function (s) { return s.exists ? s.data() : null; });
}
function cloudCodeKey(raw) { return String(raw || '').trim().toLowerCase().replace(/[^a-z0-9_-]+/g, '_').replace(/^_+|_+$/g, '').slice(0, 40); }
function cloudGetCode(key) {                               // redeem codes live in the database: codes/{key}
  if (!CLOUD.user || !CLOUD.db) return Promise.reject(new Error('offline'));
  var q = CLOUD.rt ? CLOUD.db.ref('codes/' + key).once('value').then(function (s) { return s.val() || null; })
                   : CLOUD.db.collection('codes').doc(key).get().then(function (s) { return s.exists ? s.data() : null; });
  return cloudTimeout(q, 10000);
}
/* single-use codes ("single": true): the first account to write codes/{key}/used wins; the database rules refuse a second write */
function cloudClaimCode(key) {
  if (!CLOUD.user || !CLOUD.db) return Promise.reject(new Error('offline'));
  var uid = CLOUD.user.uid;
  if (CLOUD.rt) return cloudTimeout(CLOUD.db.ref('codes/' + key + '/used').set(uid).then(function () { return true; }, function (e) { if (e && /permission|denied/i.test(String(e.code || e.message))) return false; throw e; }), 10000);
  var ref = CLOUD.db.collection('codes').doc(key);
  return cloudTimeout(CLOUD.db.runTransaction(function (t) { return t.get(ref).then(function (d) { if (!d.exists || d.data().used) return false; t.update(ref, { used: uid }); return true; }); }).catch(function (e) { if (e && /permission|denied/i.test(String(e.code || e.message))) return false; throw e; }), 10000);
}
/* today's date (Philippine time, UTC+8) taken from the Firebase SERVER clock, so changing the phone's date/time cannot give extra daily rewards */
function cloudServerDay() {
  if (!CLOUD.user || !CLOUD.db || !CLOUD.rt) return Promise.reject(new Error('offline'));
  return cloudTimeout(CLOUD.db.ref('.info/serverTimeOffset').once('value'), 8000).then(function (s) {
    var off = +s.val(); if (!isFinite(off)) throw new Error('no time');
    return new Date(Date.now() + off + 8 * 3600 * 1000).toISOString().slice(0, 10);
  });
}
function cloudSet(uid, obj) { return CLOUD.rt ? CLOUD.db.ref('users/' + uid).set(obj) : CLOUD.db.collection('users').doc(uid).set(obj); }
function cloudPush(force) {
  if (!CLOUD.user || !CLOUD.db || !CLOUD.synced || CLOUD.conflict) return Promise.resolve(false);
  if (!force && !CLOUD.dirty) return Promise.resolve(true);
  var sealed = lsGet(SAVE_KEY); if (!sealed) return Promise.resolve(false);
  var ts = +lsGet(CLOUD_TS_KEY) || Date.now(), uid = CLOUD.user.uid; CLOUD.dirty = false; CLOUD.pushing = true;
  return cloudTimeout(cloudGet(uid), 10000).then(function (d) {                          // another device wrote a newer save meanwhile? then do NOT overwrite it with this older state
    if (d && d.sid && d.sid !== CLOUD.sid && (+d.ts || 0) > CLOUD.baseTs) { CLOUD.conflict = true; CLOUD.pushing = false; CLOUD.status = 'conflict'; try { log('This account is being played on another device. Cloud saving is paused here - log out and log in again.', '#ff9a9a'); } catch (e) {} return false; }
    return cloudTimeout(cloudSet(uid, { save: sealed, ts: ts, sid: CLOUD.sid, name: String(P.name || ''), lvl: P.lvl | 0, email: String(CLOUD.user.email || '') }), 10000).then(function () { CLOUD.pushing = false; CLOUD.last = Date.now(); CLOUD.baseTs = ts; CLOUD.status = 'ok'; return true; });
  }).catch(function () { CLOUD.pushing = false; CLOUD.dirty = true; CLOUD.status = 'error'; return false; });
}
setInterval(function () { if (CLOUD.dirty && CLOUD.user && !CLOUD.pushing && Date.now() - CLOUD.last > 30000) cloudPush(); }, 10000);
document.addEventListener('visibilitychange', function () { if (document.hidden) setTimeout(function () { if (CLOUD.dirty) cloudPush(); }, 50); });
window.addEventListener('pagehide', function () { if (CLOUD.dirty) cloudPush(); });
function cloudStatusText() {
  if (!CLOUD.user) return 'Not logged in (offline mode)';
  if (CLOUD.conflict) return 'PAUSED - account used on another device. Log out and in again.';
  if (CLOUD.status === 'error') return 'Could not sync - will retry';
  if (CLOUD.pushing) return 'Saving...';
  if (CLOUD.dirty) return 'Changes pending (auto-saves every 30s)';
  return CLOUD.last ? 'Saved to cloud ' + Math.max(0, Math.round((Date.now() - CLOUD.last) / 1000)) + 's ago' : 'Cloud save is up to date';
}
function cloudLogout(done) {
  noSave = true; saveGameRaw();
  CLOUD.synced = true; CLOUD.dirty = true;
  cloudPush(true).then(function (ok) {
    if (!ok && !CLOUD.conflict) { noSave = false; if (done) done(false); return; }
    lsDel(SAVE_KEY); lsDel(CLOUD_UID_KEY); lsDel(CLOUD_TS_KEY);
    var fin = function () { location.reload(); };
    try { CLOUD.auth.signOut().then(fin, fin); } catch (e) { fin(); }
  });
}
function saveGameRaw() { noSave = false; try { saveGame(); } catch (e) {} noSave = true; }

/* ---------- login / sign-up screen ---------- */
var authUI = null, authStart = null;
function authMsg(t, bad) { if (!authUI) return; authUI.msg.textContent = t || ''; authUI.msg.className = 'amsg' + (bad ? ' bad' : ''); }
function authErrText(e) {
  var c = (e && e.code) || '';
  var map = {
    'auth/email-already-in-use': 'That email already has an account. Use Login.', 'auth/invalid-email': 'Please enter a valid email address.', 'auth/weak-password': 'Password must be at least 6 characters.',
    'auth/user-not-found': 'No account with that email. Use Sign Up.', 'auth/wrong-password': 'Wrong password.', 'auth/invalid-credential': 'Wrong email or password.', 'auth/invalid-login-credentials': 'Wrong email or password.',
    'auth/too-many-requests': 'Too many attempts. Wait a few minutes and try again.', 'auth/network-request-failed': 'No internet connection.', 'auth/operation-not-allowed': 'Email/Password sign-in is not enabled in Firebase (Authentication > Sign-in method).',
    'auth/invalid-api-key': 'Online login is misconfigured (API key).', 'auth/api-key-not-valid.-please-pass-a-valid-api-key.': 'Online login is misconfigured (API key).', 'auth/unauthorized-domain': 'This website address is not allowed in Firebase (Authentication > Settings > Authorized domains).',
    'auth/user-disabled': 'This account is disabled.', 'auth/missing-password': 'Enter your password.', 'auth/missing-email': 'Enter your email.'
  };
  return map[c] || ('Error: ' + (c || (e && e.message) || 'unknown'));
}
function authBuild() {
  if (authUI) return;
  var root = document.createElement('div'); root.id = 'auth-screen'; document.body.appendChild(root);
  var box = h('div', 'abox', null, root);
  h('h2', null, 'Realm of RanCraft', box); var sub = h('p', 'asub', 'Log in to save your hero online and play on any device.', box);
  var tabs = h('div', 'atabs', null, box), tLog = h('button', 'on', 'Login', tabs), tSign = h('button', null, 'Sign Up', tabs);
  var email = h('input', null, null, box); email.type = 'email'; email.placeholder = 'Email'; email.autocomplete = 'email'; email.autocapitalize = 'off'; email.spellcheck = false;
  var pw = h('input', null, null, box); pw.type = 'password'; pw.placeholder = 'Password (min 6 characters)'; pw.autocomplete = 'current-password';
  var pw2 = h('input', null, null, box); pw2.type = 'password'; pw2.placeholder = 'Confirm password'; pw2.autocomplete = 'new-password'; pw2.style.display = 'none';
  var go = h('button', 'ago', 'LOGIN', box);
  var msg = h('div', 'amsg', '', box);
  var links = h('div', 'alinks', null, box), fg = h('a', null, 'Forgot password?', links), off = h('a', null, 'Play offline', links);
  off.style.display = 'none';
  var choose = h('div', 'achoose', null, box); choose.style.display = 'none';
  authUI = { root: root, box: box, msg: msg, tabs: [tLog, tSign], email: email, pw: pw, pw2: pw2, go: go, off: off, choose: choose, mode: 'login', busy: false, sub: sub };
  function setMode(m) {
    authUI.mode = m; tLog.className = m === 'login' ? 'on' : ''; tSign.className = m === 'sign' ? 'on' : ''; pw2.style.display = m === 'sign' ? '' : 'none';
    go.textContent = m === 'sign' ? 'CREATE ACCOUNT' : 'LOGIN'; pw.autocomplete = m === 'sign' ? 'new-password' : 'current-password'; authMsg('');
  }
  tLog.addEventListener('click', function () { setMode('login'); }); tSign.addEventListener('click', function () { setMode('sign'); });
  function busy(b) { authUI.busy = b; go.disabled = b; go.style.opacity = b ? '.6' : '1'; }
  go.addEventListener('click', function () {
    if (authUI.busy) return;
    if (!CLOUD.auth && !cloudInit()) { authMsg(CLOUD.err === 'sdk' ? 'Cannot load the online service (no internet?). You can Play offline.' : 'Online login is not available right now. You can Play offline.', true); return; }
    var em = email.value.trim(), p = pw.value;
    if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(em)) { authMsg('Please enter a valid email address.', true); return; }
    if (p.length < 6) { authMsg('Password must be at least 6 characters.', true); return; }
    if (authUI.mode === 'sign' && p !== pw2.value) { authMsg('Passwords do not match.', true); return; }
    busy(true); authMsg(authUI.mode === 'sign' ? 'Creating account...' : 'Logging in...');
    var pr = authUI.mode === 'sign' ? CLOUD.auth.createUserWithEmailAndPassword(em, p) : CLOUD.auth.signInWithEmailAndPassword(em, p);
    pr.then(function (cred) { var u = (cred && cred.user) || CLOUD.auth.currentUser; CLOUD.user = u; busy(false); authSync(u); }).catch(function (e) { busy(false); authMsg(authErrText(e), true); });
  });
  [email, pw, pw2].forEach(function (i) { i.addEventListener('keydown', function (e) { if (e.key === 'Enter') { e.preventDefault(); go.click(); } }); });
  fg.addEventListener('click', function () {
    if (!CLOUD.auth && !cloudInit()) { authMsg('Online login is not available right now.', true); return; }
    var em = email.value.trim(); if (!em) { authMsg('Type your email above first, then tap Forgot password.', true); return; }
    CLOUD.auth.sendPasswordResetEmail(em).then(function () { authMsg('Password reset link sent to ' + em + '. Check your inbox (and spam).'); }).catch(function (e) { authMsg(authErrText(e), true); });
  });
  off.addEventListener('click', function () { authFinish(); });
}
function authShow(mode) {
  authBuild(); authUI.root.style.display = 'flex'; authInputs(true); authUI.choose.style.display = 'none'; busy0();
  var offline = !CLOUD.auth; authUI.off.style.display = (offline || CLOUD.err) ? '' : 'none';
  if (CLOUD.err === 'sdk') authMsg('Cannot load the online service (no internet?). You can Play offline.', true);
  else if (CLOUD.err === 'cfg' || CLOUD.err === 'init') authMsg('Online login is not available right now. You can Play offline.', true);
  else authMsg(mode === 'retry' ? 'Could not reach the cloud save. Check your internet and log in again.' : '');
}
function busy0() { if (authUI) { authUI.busy = false; authUI.go.disabled = false; authUI.go.style.opacity = '1'; } }
function authInputs(on) { if (authUI) [authUI.email, authUI.pw, authUI.pw2].forEach(function (i) { if (i) i.disabled = !on; }); }
function authHide() { if (authUI) { authUI.root.style.display = 'none'; authInputs(false); } }       // disabled while hidden so the browser stops offering your email in game text boxes
function authFinish() { CLOUD.synced = true; authHide(); var s = authStart; authStart = null; if (s) s(); }
function authReload() { noSave = true; try { sessionStorage.setItem('moviex_auto', '1'); } catch (e) {} location.reload(); }

/* ---------- decide between the local save and the cloud save ---------- */
function authSync(user) {
  authBuild(); authUI.root.style.display = 'flex'; authInputs(true); authUI.choose.style.display = 'none'; authMsg('Syncing your progress...');
  var fin = false;
  var to = setTimeout(function () { end('timeout'); }, 9000);
  function end(err, data) {
    if (fin) return; fin = true; clearTimeout(to);
    if (err) {                                                        // cloud unreachable: continue with this device's save when it belongs to this account
      var lp = cloudPeek(lsGet(SAVE_KEY));
      if (lp && lp.named && lsGet(CLOUD_UID_KEY) === user.uid) { CLOUD.status = 'error'; CLOUD.dirty = true; CLOUD.baseTs = +lsGet(CLOUD_TS_KEY) || 0; authFinish(); try { log('Offline - progress will sync to the cloud when the connection is back.', '#ffcc88'); } catch (e) {} }
      else { authShow('retry'); }
      return;
    }
    authResolve(user, data);
  }
  cloudGet(user.uid).then(function (d) { end(null, d); }).catch(function (e) { end(e || 'err'); });
}
function authResolve(user, cloud) {
  var sealed = lsGet(SAVE_KEY), luid = lsGet(CLOUD_UID_KEY) || '', lts = +lsGet(CLOUD_TS_KEY) || 0, ls = cloudPeek(sealed), hasLocal = !!(ls && ls.named);
  var cs = (cloud && cloud.save) ? cloudPeek(cloud.save) : null, cts = cloud ? (+cloud.ts || 0) : 0;
  CLOUD.baseTs = cts;
  function takeCloud() { noSave = true; lsSet(SAVE_KEY, cloud.save); lsSet(CLOUD_UID_KEY, user.uid); lsSet(CLOUD_TS_KEY, String(cts)); authReload(); }
  function keepLocal(pushIt) {
    lsSet(CLOUD_UID_KEY, user.uid); if (!lsGet(CLOUD_TS_KEY)) lsSet(CLOUD_TS_KEY, String(Date.now()));
    CLOUD.synced = true; CLOUD.user = user;
    if (!pushIt) { authFinish(); return; }
    CLOUD.dirty = true; var done = false, go = function () { if (!done) { done = true; authFinish(); } };
    cloudPush(true).then(go); setTimeout(go, 4000);
  }
  if (!cs) {                                                          // nothing in the cloud yet
    if (hasLocal && (!luid || luid === user.uid)) { keepLocal(true); return; }   // first login: adopt this device's hero
    if (hasLocal) { noSave = true; lsDel(SAVE_KEY); lsDel(CLOUD_TS_KEY); lsSet(CLOUD_UID_KEY, user.uid); authReload(); return; }   // another account's hero: start fresh
    lsSet(CLOUD_UID_KEY, user.uid); CLOUD.synced = true; authFinish(); return;      // brand-new player -> create hero
  }
  if (!hasLocal) { takeCloud(); return; }
  if (luid === user.uid) { if (cts > lts) takeCloud(); else keepLocal(cts !== lts); return; }
  if (luid) { takeCloud(); return; }                                  // local hero belongs to a different account
  var c = authUI.choose; c.innerHTML = ''; c.style.display = 'block';   // unknown owner: ask
  h('div', 'ds', 'A hero already exists on this device AND in your account. Which one do you want to keep?', c);
  function sum(s) { return (s.name || 'Hero') + ' - Lv ' + (s.lvl | 0) + (s.reb ? ' (R' + s.reb + ')' : '') + ', ' + (s.gold | 0) + ' gold'; }
  var b1 = h('button', 'ago', 'This device: ' + sum(ls), c), b2 = h('button', 'ago alt', 'Cloud account: ' + sum(cs), c);
  b1.addEventListener('click', function () { c.style.display = 'none'; lsSet(CLOUD_TS_KEY, String(Date.now())); keepLocal(true); });
  b2.addEventListener('click', function () { takeCloud(); });
}

/* called by the Play Now button: login first, then run `start` */
function cloudGate(start) {
  authStart = start;
  if (!cloudInit()) { authShow(); return; }
  cloudWhenReady(function () { if (CLOUD.user) authSync(CLOUD.user); else authShow(); });
}
