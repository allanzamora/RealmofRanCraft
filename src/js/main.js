/* main.js - map loading / travel, main loop, boot */
MAPS.forEach(function (m) { if (!m.arena && !m.safe2x) { m.safeR *= 2; m.safe2x = true; } });   // safe zones are 2x bigger
function mapById(id) { for (var i = 0; i < MAPS.length; i++) if (MAPS[i].id === id) return MAPS[i]; return MAPS[0]; }
function loadMap(id, quiet) {
  var m = mapById(id);
  curMap = m; WORLD_R = m.R; SAFE_R = m.safeR; AREA = 4; P.map = m.id;
  clearPopulation(); clearPickups(); P.target = null;
  timers.length = 0;
  clearWorld(); buildEnvironment(m);
  makePortal(worldGroup, m.arena ? 0 : 9.5, m.arena ? 0 : 9.5);   // Blood Arena: only the portal, in the centre
  P.dest = null;
  if (!m.arena) populateTown(m); spawnEnemies(m); spawnAIs(m); worldBossOnMap(m);
  P.pos.set(0, 0, 7); P.c.g.rotation.y = Math.PI;
  camera.position.set(P.pos.x, 4, P.pos.z + 9);
  lastZone = -1; refreshMarkers(); saveGame();
  if (!quiet) {
    if (m.arena) log('Welcome to the ARENA! Free PK: every player here can be attacked (and will attack you). No drops.', '#ff9a7a');
    else if (m.boss) log(ENEMY_TYPES[m.enemies[0]].name + ' (Lv ' + ENEMY_TYPES[m.enemies[0]].lvl + ') waits here. Boss-only rare gear drops here.', '#d08aff');
    else log('Arrived at ' + m.name + '. Monsters here are Lv ' + ENEMY_TYPES[m.enemies[0]].lvl + '-' + ENEMY_TYPES[m.enemies[m.enemies.length - 1]].lvl + '.', '#9fe3ff');
  }
}
function travelTo(id) {
  var m = mapById(id);
  if (P.lvl < m.min) { log('You need level ' + m.min + ' to enter ' + m.name + '.', '#ff9a9a'); return; }
  ringFx(P.pos.x, P.pos.z, 4, 0x66ccff, 0.6); pillarFx(P.pos.x, P.pos.z, 0x66ccff); sfx('level');
  loadMap(id);
}

var last = performance.now(), fpsAcc = 0, fpsN = 0, saveT = 0, hudT = 0, miniT = 0;
var targetRing = new THREE.Mesh(new THREE.RingGeometry(0.9, 1.1, 32), new THREE.MeshBasicMaterial({ color: 0xff4a4a, side: THREE.DoubleSide, transparent: true, opacity: 0.9, depthWrite: false }));
targetRing.rotation.x = -Math.PI / 2; targetRing.visible = false; scene.add(targetRing);

var welcomeOn = true;
cam.dist = 85; cam.pitch = 0.78;      // welcome backdrop: Moviex Plains fully zoomed out
function frame(now) {
  requestAnimationFrame(frame);
  var dt = Math.min(0.05, (now - last) / 1000); last = now;
  fpsAcc += dt; fpsN++;
  if (fpsAcc > 1) { $('fps').textContent = Math.round(fpsN / fpsAcc) + ' FPS'; fpsAcc = 0; fpsN = 0; }
  updateZoomHold(dt); updateAntiCheat(dt);
  if (welcomeOn) cam.yaw += dt * 0.05;
  if (ui.open !== 'name' && !welcomeOn) {      // popups no longer pause the game (only the first-launch name screen does)
    gameTime += dt; updateTimers(dt); updatePlayer(dt); updatePets(dt); updateCostumeFx(dt); updateEnemies(dt); updateWorldBoss(dt); updateAIs(dt); updateBots(dt); updatePickups(dt);
    saveT += dt; if (saveT > 15) { saveT = 0; saveGame(); }
  }
  npcs.forEach(function (n) {
    var d = Math.hypot(n.pos.x - P.pos.x, n.pos.z - P.pos.z);
    if (d < 6 && !n.sit) faceTo(n.c, P.pos.x, P.pos.z, dt, 5);
    n.marker.spr.position.y = (n.my || 2.75) + Math.sin(now / 300) * 0.08; animateChar(n.c, dt, 0);
    if (n.sit) { var rg = n.c.rig; rg.legL.hp.rotation.x = rg.legR.hp.rotation.x = -1.5; rg.legL.kn.rotation.x = rg.legR.kn.rotation.x = 1.5; rg.body.position.y = -0.47; }
  });
  portals.forEach(function (pt) { pt.ring.rotation.z += dt * 0.8; pt.disc.material.opacity = 0.35 + Math.sin(now / 300) * 0.1; });
  clouds.forEach(function (cl) { cl.position.x += dt * 1.2; if (cl.position.x > WORLD_R + 120) cl.position.x = -WORLD_R - 120; });
  updateWeather(dt); updateFx(dt); updateThrown(dt); updateCamera(dt); updateFloaters(dt);
  if (P.target && P.target.state !== 'dead') {
    targetRing.visible = true; var s = P.target.T.scale * (1.0 + Math.sin(now / 200) * 0.06);
    targetRing.position.set(P.target.pos.x, 0.06, P.target.pos.z); targetRing.scale.set(s, s, s);
  } else targetRing.visible = false;
  hudT += dt; if (hudT > 0.08) { hudT = 0; updateHud(); updateZone(); }
  miniT += dt; if (miniT > 0.12) { miniT = 0; drawMini(); }
  renderer.render(scene, camera);
}
window.addEventListener('resize', function () { camera.aspect = window.innerWidth / window.innerHeight; camera.updateProjectionMatrix(); renderer.setSize(window.innerWidth, window.innerHeight); });

/* ---- start ---- */
var freshGame = true;
try { freshGame = !localStorage.getItem(SAVE_KEY); } catch (e) {}
loadGame(); refreshPetBtn();
freshGame = !P.named;
P.c.name = P.name;
applyEquipVisuals(); P.c.lvl = P.lvl; 
P.hp = maxHp(); P.mp = maxMp(); refreshPlayerTag(true);
layoutActions(); refreshSkillButtons();
(function () { var m = mapById(P.map); loadMap(P.lvl >= m.min ? m.id : 'plains', true); })();
updateHud();
log('Welcome to Realm of RanCraft! Talk to Elder Rowan (!) to begin.', '#ffe066');
log('Joystick: bottom-left. Pinch or +/- to zoom. Portal ring = World Map.', '#cfd8ff');
function runBoot() {     // loading bar finishes, then the splash fades out
  var boot = $('boot'), fill = $('boot-fill'), pct = $('boot-pct'), t0 = performance.now(), DUR = 1600;
  (function step() {
    var p = Math.min(1, (performance.now() - t0) / DUR); fill.style.width = (p * 100).toFixed(0) + '%'; pct.textContent = 'Loading... ' + (p * 100).toFixed(0) + '%';
    if (p < 1) { setTimeout(step, 50); return; }
    boot.style.opacity = '0'; setTimeout(function () { boot.style.display = 'none'; }, 650);
    if (freshGame) openNameScreen();
  })();
}
$('w-play').addEventListener('click', function () {
  var w = $('welcome'); w.style.opacity = '0'; setTimeout(function () { w.style.display = 'none'; }, 500);
  cam.dist = 9.5; cam.pitch = 0.42; cam.yaw = 0; welcomeOn = false;
  var b = $('boot'); b.style.display = 'block'; b.style.opacity = '1'; runBoot();
});
requestAnimationFrame(frame);
