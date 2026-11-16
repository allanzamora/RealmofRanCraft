/* characters.js - procedural humanoid rig, weapons, name tags, animation, NPCs/bots/enemy creation */
/* =====================================================================
   HUMANOID CHARACTER RIG (procedural, articulated)
   ===================================================================== */
function makeHumanoid(o) {
  var def = { scale: 1, bulk: 1, thin: false, skin: 0xffcc99, shirt: 0x3366cc, pants: 0x333344, boots: 0x2a1c10, hair: 0x3a2616, eye: 0x111111 };
  for (var key in def) if (o[key] === undefined) o[key] = def[key];
  var th = o.thin ? 0.75 : 1, bk = o.bulk;

  var root = new THREE.Group();
  var body = new THREE.Group(); root.add(body);
  var mats = [];
  function M(c, ex) {
    var p = { color: c, roughness: 0.85, metalness: 0.02 };
    if (ex) for (var k in ex) p[k] = ex[k];
    var m = new THREE.MeshStandardMaterial(p);
    m.userData.em = ex && ex.emissive ? ex.emissive : 0;
    m.userData.emi = ex && ex.emissiveIntensity ? ex.emissiveIntensity : 1;
    mats.push(m); return m;
  }
  function add(geo, mat, parent, x, y, z, noShadow) {
    var m = new THREE.Mesh(geo, mat); m.position.set(x || 0, y || 0, z || 0);
    if (!noShadow) m.castShadow = true;
    parent.add(m); return m;
  }
  var box = function (w, hgt, d) { return new THREE.BoxGeometry(w, hgt, d); };
  var pantsMat = M(o.pants);
  var padMat = M(o.padColor !== undefined ? o.padColor : 0x555e6b, { metalness: 0.5, roughness: 0.45 });
  var glovesMat = M(0xaaaaaa, { metalness: 0.4, roughness: 0.5 });
  var helmMat = M(0x8a97a6, { metalness: 0.55, roughness: 0.4 });
  var wingMat = M(0xffffff, { roughness: 0.6, side: THREE.DoubleSide });
  var hairStyles = null, crownG = null, maskG = null, ssjWings = null, ssjG = null, aura = null, hm = null, padMeshes = [], gloveMeshes = [], helmMeshes = [], hairMeshes = [], wings = [];
  var gzTrim = o.gear ? M(0x1adcff, { emissive: 0x0a8cb0, emissiveIntensity: 0.7, roughness: 0.4 }) : null;
  var gzPanel = o.gear ? M(0x174650, { roughness: 0.6 }) : null;
  var gzArmorMeshes = [], gzGloveMeshes = [], gzPantsMeshes = [], radArmorMeshes = [], radGloveMeshes = [], radPantsMeshes = [];
  var radGold = o.gear ? M(0xffd54f, { emissive: 0x8a6a00, emissiveIntensity: 0.8, metalness: 0.6, roughness: 0.3 }) : null;
  var radTeal = o.gear ? M(0x3ff0e0, { emissive: 0x10a090, emissiveIntensity: 1.1, roughness: 0.3 }) : null;
  function gz(arr, geo, mat, parent, x, y, z, rz) { var m = add(geo, mat, parent, x, y, z, true); m.visible = false; if (rz) m.rotation.z = rz; arr.push(m); return m; }

  // hips: a belt block
  var hips = new THREE.Group(); hips.position.y = 0.97; body.add(hips);
  add(box(0.5 * bk, 0.1, 0.27), M(0x3a2410), hips, 0, 0.12, 0);

  // torso: one big block (Roblox style)
  var torso = new THREE.Group(); torso.position.y = 0.16; hips.add(torso);
  var shirtMats = [], shirtM = M(o.shirt); shirtMats.push(shirtM);
  add(box(0.5 * bk, 0.62, 0.27), shirtM, torso, 0, 0.31, 0);
  var skirt = null;
  if (o.hairStyles) { skirt = add(box(0.58, 0.26, 0.34), shirtM, hips, 0, -0.02, 0); skirt.visible = false; }
  var armorMat = M(o.armor !== undefined ? o.armor : 0x8a97a6, { metalness: 0.5, roughness: 0.45 });
  var armor = add(box(0.54 * bk, 0.5, 0.31), armorMat, torso, 0, 0.34, 0); armor.visible = o.armor !== undefined;
  if (o.gear) {   // Godzilla armor trim: cyan V plate, straps, side stripes, teal belly panel
    [-1, 1].forEach(function (sx) {
      gz(gzArmorMeshes, box(0.06, 0.34, 0.03), gzTrim, torso, sx * 0.08, 0.46, 0.17, sx * 0.42);
      gz(gzArmorMeshes, box(0.045, 0.3, 0.03), gzTrim, torso, sx * 0.2, 0.5, 0.17);
      for (var si = 0; si < 3; si++) gz(gzArmorMeshes, box(0.1, 0.025, 0.2), gzTrim, torso, sx * 0.28 * bk, 0.14 + si * 0.08, 0);
    });
    gz(gzArmorMeshes, box(0.4, 0.22, 0.02), gzPanel, torso, 0, 0.2, 0.165);
    // Radiant armor costume trim: gold collar + belt + stripes, teal chest gem
    gz(radArmorMeshes, box(0.14, 0.16, 0.03), radTeal, torso, 0, 0.45, 0.17); gz(radArmorMeshes, box(0.32, 0.05, 0.22), radGold, torso, 0, 0.63, 0); gz(radArmorMeshes, box(0.57 * bk, 0.06, 0.33), radGold, torso, 0, 0.08, 0);
    [-1, 1].forEach(function (sx) { gz(radArmorMeshes, box(0.045, 0.32, 0.03), radGold, torso, sx * 0.16, 0.38, 0.17); gz(radArmorMeshes, box(0.2, 0.04, 0.03), radGold, torso, sx * 0.1, 0.26, 0.17); });
  }

  // head: cube with a block face
  var head = new THREE.Group(); head.position.y = 0.62; torso.add(head);
  var skinM = M(o.skin);
  add(box(0.34, 0.34, 0.34), skinM, head, 0, 0.17, 0);
  if (o.hair !== null && !o.helmet && !o.bald) {
    hm = M(o.hair);
    var cap = add(box(0.37, 0.11, 0.37), hm, head, 0, 0.365, 0), back = add(box(0.37, 0.3, 0.09), hm, head, 0, 0.2, -0.165), fr = add(box(0.37, 0.05, 0.05), hm, head, 0, 0.32, 0.17);
    hairMeshes.push(cap, back, fr);
    if (o.hairStyles) {   // King Crown costume model (hidden until worn)
      var cg = new THREE.Group(), gm2 = M(0xffd54f); gm2.emissive.setHex(0x6a4a00); gm2.userData.em = 0x6a4a00; gm2.userData.emi = 1;
      var rb = M(0xe02030), bl = M(0x2a6ad8);
      var cb = function (w, h2, d, mat, x, y, z) { var m = new THREE.Mesh(new THREE.BoxGeometry(w, h2, d), mat); m.position.set(x, y, z); cg.add(m); };
      cb(0.43, 0.1, 0.43, gm2, 0, 0.0, 0);
      [[-0.18, -0.18], [0.18, -0.18], [-0.18, 0.18], [0.18, 0.18], [0, 0.2], [0, -0.2], [-0.2, 0], [0.2, 0]].forEach(function (q, i) { cb(0.08, i < 4 ? 0.2 : 0.14, 0.08, gm2, q[0], i < 4 ? 0.14 : 0.11, q[1]); cb(0.045, 0.045, 0.045, i % 2 ? bl : rb, q[0], i < 4 ? 0.27 : 0.2, q[1]); });
      cb(0.07, 0.07, 0.03, rb, 0, 0.0, 0.225);
      cg.position.y = 0.42; cg.visible = false; head.add(cg); crownG = cg;
      // Super Saiyan Hair (from the side-view picture): swept-back golden spikes + a long flat lock down the back
      var sg = new THREE.Group(), gold = M(0xc8c81a); gold.emissive.setHex(0x5a5a00); gold.userData.em = 0x5a5a00; gold.userData.emi = 1;
      var pale = M(0xdcdc3a); pale.emissive.setHex(0x6a6a00); pale.userData.em = 0x6a6a00; pale.userData.emi = 1;
      sg.userData.gold = gold; sg.userData.sway = []; sg.userData.arcs = [];
      var sb = function (w, h2, d, x, y, z) { var m = new THREE.Mesh(new THREE.BoxGeometry(w, h2, d), gold); m.position.set(x, y, z); sg.add(m); };
      var spike = function (x, y, z, len, rad, rx, rz, mat, sway, flat) {
        var pv = new THREE.Group(); pv.position.set(x, y, z); pv.rotation.set(rx, 0, rz); if (flat) pv.scale.x = flat;
        var m = new THREE.Mesh(new THREE.ConeGeometry(rad, len, 5), mat || gold); m.position.y = len / 2; pv.add(m); sg.add(pv);
        if (sway) sg.userData.sway.push({ pv: pv, rx: rx, rz: rz, ph: Math.random() * 6 }); return pv;
      };
      sb(0.39, 0.13, 0.39, 0, 0.36, 0); sb(0.39, 0.34, 0.12, 0, 0.19, -0.19); sb(0.06, 0.22, 0.22, -0.2, 0.2, -0.04); sb(0.06, 0.22, 0.22, 0.2, 0.2, -0.04);
      [0.55, 0.75, 0.95, 1.05, 0.95, 0.8, 0.6].forEach(function (len, i) {   // spikes sweeping up and back
        spike(((i % 3) - 1) * 0.09, 0.4, 0.12 - 0.05 * i, len, 0.085, -(0.35 + 0.18 * i), -((i % 3) - 1) * 0.2, i % 2 ? pale : gold, true);
      });
      [0.95, 1.1, 1.0, 0.8].forEach(function (len, i) {                         // spikes streaming straight back
        spike([-0.1, 0.1, -0.05, 0.05][i], 0.3 - 0.04 * i, -0.15, len, 0.09, -(1.7 + 0.12 * i), (i % 2 ? 0.1 : -0.1), i % 2 ? gold : pale, true);
      });
      [[-0.08, -2.85, 1.5], [0.04, -2.92, 1.75], [0.12, -2.8, 1.3]].forEach(function (q, i) { spike(q[0], 0.3, -0.2, q[2], 0.13, q[1], 0, i === 1 ? pale : gold, true, 2.2); });   // long flat lock
      spike(0, 0.37, 0.17, 0.3, 0.06, 1.1, 0, pale, false);                     // brow tuft pointing forward
      sg.visible = false; head.add(sg); ssjG = sg;
      // Johny Mask (from the picture): grey mask, blue ear spikes, 4 white dots, white visor strip with a notch, pointed chin plate
      var mg = new THREE.Group(), gry = M(0x737373), blu = M(0x4399d3), wht = M(0xf6f6f6, { emissive: 0x555555, emissiveIntensity: 0.4 });
      var mb = function (w, h2, d, mat, x, y, z) { var m = new THREE.Mesh(new THREE.BoxGeometry(w, h2, d), mat); m.position.set(x, y, z); mg.add(m); return m; };
      mb(0.385, 0.4, 0.385, gry, 0, 0.17, 0); mb(0.385, 0.1, 0.385, gry, 0, -0.04, 0);
      var chin = new THREE.Mesh(new THREE.ConeGeometry(0.27, 0.14, 4), gry); chin.rotation.set(Math.PI, Math.PI / 4, 0); chin.position.set(0, -0.14, 0); mg.add(chin);
      [-0.115, -0.04, 0.04, 0.115].forEach(function (x) { mb(0.04, 0.04, 0.02, wht, x, 0.29, 0.195); });
      mb(0.3, 0.115, 0.02, wht, 0, 0.15, 0.195); mb(0.3, 0.012, 0.022, blu, 0, 0.21, 0.196);
      var nt = mb(0.075, 0.075, 0.024, gry, 0, 0.1, 0.197); nt.rotation.z = Math.PI / 4;
      [-1, 1].forEach(function (s2) { var sp = new THREE.Mesh(new THREE.ConeGeometry(0.075, 0.2, 3), blu); sp.rotation.z = -s2 * Math.PI / 2; sp.position.set(s2 * 0.3, 0.17, 0); mg.add(sp); });
      mg.visible = false; head.add(mg); maskG = mg;
      // Super Saiyan Wings (from the picture): radiating golden spikes with pale translucent spikes behind them
      var wgr = new THREE.Group(), wy = M(0xc4c42e), wp = new THREE.MeshBasicMaterial({ color: 0xe6e6c8, transparent: true, opacity: 0.4, depthWrite: false, side: THREE.DoubleSide });
      wgr.userData.sides = [];
      [-1, 1].forEach(function (s2) {
        var side = new THREE.Group(); wgr.add(side); wgr.userData.sides.push({ g: side, s: s2 });
        [[10, 2.3], [32, 2.0], [55, 1.6], [80, 1.1], [-14, 2.1], [-38, 1.7], [-62, 1.25], [-88, 0.9]].forEach(function (q) {
          var phi = q[0] * Math.PI / 180, ang = Math.atan2(-s2 * Math.cos(phi), Math.sin(phi));
          [[wy, 0.085, q[1]], [wp, 0.2, q[1] * 1.15]].forEach(function (k) {
            var pv = new THREE.Group(); pv.rotation.set(-0.3, 0, ang); var m = new THREE.Mesh(new THREE.ConeGeometry(k[1], k[2], 4), k[0]); m.position.y = k[2] / 2; pv.add(m); side.add(pv);
          });
        });
        var gem = new THREE.Mesh(new THREE.BoxGeometry(0.1, 0.1, 0.05), M(0xf6f6f6)); gem.position.set(s2 * 0.05, 0, 0); side.add(gem);
      });
      wgr.position.set(0, 0.42, -0.2); wgr.visible = false; torso.add(wgr); ssjWings = wgr;
      var auraM = new THREE.MeshBasicMaterial({ color: 0xffd54f, transparent: true, opacity: 0.28, side: THREE.DoubleSide, depthWrite: false });
      var au = new THREE.Mesh(new THREE.CylinderGeometry(0.95, 0.75, 2.6, 18, 1, true), auraM); au.position.y = 1.0; au.visible = false; root.add(au); aura = au;
    }
    if (o.hairStyles) {   // player hair styles: 0 short, 1 spiky, 2 long, 3 ponytail, 4 buzz, 5 mohawk, 6 bun
      hairStyles = [hairMeshes.slice()];
      var hs = function (list) { list.forEach(function (m) { m.visible = false; }); hairStyles.push(list); };
      var sp = []; for (var si = -1; si <= 1; si++) for (var sj = -1; sj <= 1; sj++) sp.push(add(box(0.09, 0.14 + ((si + sj) & 1) * 0.06, 0.09), hm, head, si * 0.12, 0.47, sj * 0.12, true));
      sp.push(add(box(0.37, 0.09, 0.37), hm, head, 0, 0.36, 0)); hs(sp);
      hs([add(box(0.37, 0.11, 0.37), hm, head, 0, 0.365, 0), add(box(0.37, 0.62, 0.09), hm, head, 0, 0.0, -0.165), add(box(0.07, 0.5, 0.2), hm, head, -0.2, 0.05, -0.06), add(box(0.07, 0.5, 0.2), hm, head, 0.2, 0.05, -0.06), add(box(0.37, 0.05, 0.05), hm, head, 0, 0.32, 0.17)]);
      hs([add(box(0.37, 0.11, 0.37), hm, head, 0, 0.365, 0), add(box(0.37, 0.18, 0.09), hm, head, 0, 0.25, -0.165), add(box(0.1, 0.4, 0.1), hm, head, 0, -0.02, -0.25), add(box(0.37, 0.05, 0.05), hm, head, 0, 0.32, 0.17)]);
      hs([add(box(0.355, 0.05, 0.355), hm, head, 0, 0.345, 0)]);
      hs([add(box(0.08, 0.16, 0.38), hm, head, 0, 0.45, 0), add(box(0.08, 0.1, 0.1), hm, head, 0, 0.3, -0.19)]);
      hs([add(box(0.37, 0.11, 0.37), hm, head, 0, 0.365, 0), add(box(0.37, 0.15, 0.09), hm, head, 0, 0.27, -0.165), add(box(0.15, 0.15, 0.15), hm, head, 0, 0.5, -0.05)]);
    }
  }
  var eyeMat = M(o.eye, o.eyeGlow ? { emissive: o.eye, emissiveIntensity: 1 } : null);
  if (!o.faceless) {
    [-1, 1].forEach(function (sx) { add(box(o.bone ? 0.07 : 0.05, o.bone ? 0.07 : 0.06, 0.02), eyeMat, head, sx * 0.08, 0.2, 0.172, true); });
    add(box(0.12, 0.03, 0.02), M(o.tusks ? 0x2a1a1a : 0x5a2a20), head, 0, 0.09, 0.172, true);
  }
  if (o.ears) [-1, 1].forEach(function (sx) { add(box(0.14, 0.06, 0.04), skinM, head, sx * 0.24, 0.2, 0, true); });
  if (o.horns) [-1, 1].forEach(function (sx) {
    var hr = add(box(0.07, 0.24, 0.07), M(0x1a1a1a, { roughness: 0.5 }), head, sx * 0.12, 0.45, 0, true); hr.rotation.z = -sx * 0.35;
  });
  if (o.helmet) {
    add(box(0.38, 0.17, 0.38), M(0x5a6573, { metalness: 0.6, roughness: 0.4 }), head, 0, 0.3, 0);
    add(box(0.38, 0.07, 0.04), M(0x111111), head, 0, 0.21, 0.19, true);
    add(box(0.05, 0.14, 0.2), M(0xaa1111), head, 0, 0.45, 0, true);
  }
  if (o.tusks) [-1, 1].forEach(function (sx) { add(box(0.035, 0.08, 0.035), M(0xf2ecd6), head, sx * 0.07, 0.06, 0.18, true); });
  if (o.bikini) {
    var bkM = M(o.bikini.top), bbM = M(o.bikini.bottom);
    [-1, 1].forEach(function (sx) { add(box(0.2, 0.13, 0.05), bkM, torso, sx * 0.1, 0.46, 0.14); });
    add(box(0.5 * bk + 0.02, 0.025, 0.29), bkM, torso, 0, 0.53, 0); add(box(0.5 * bk + 0.02, 0.14, 0.29), bbM, hips, 0, 0.04, 0);
  }
  if (o.pigtails) [-1, 1].forEach(function (sx) { add(box(0.12, 0.42, 0.12), M(o.hair || 0xff6fa8), head, sx * 0.26, 0.08, -0.04); add(box(0.15, 0.07, 0.15), M(0xff2e7e), head, sx * 0.26, 0.3, -0.04); });
  if (o.belly) add(box(0.78, 0.5, 0.42), M(o.shirt), torso, 0, 0.16, 0.2);
  if (o.santa) {
    var sred = M(0xc41e1e), swhite = M(0xf4f4f4);
    add(box(0.4, 0.16, 0.4), sred, head, 0, 0.42, 0); add(box(0.43, 0.07, 0.43), swhite, head, 0, 0.35, 0);
    add(box(0.26, 0.14, 0.26), sred, head, -0.05, 0.54, -0.02); add(box(0.09, 0.09, 0.09), swhite, head, -0.13, 0.63, -0.04);
    add(box(0.36, 0.2, 0.06), swhite, head, 0, 0.07, 0.18); add(box(0.3, 0.05, 0.06), swhite, head, 0, 0.17, 0.19);
    [-1, 1].forEach(function (sx) { add(box(0.1, 0.04, 0.02), swhite, head, sx * 0.08, 0.26, 0.175, true); });
    add(box(0.54 * bk, 0.1, 0.3), M(0x111111), torso, 0, 0.08, 0); add(box(0.14, 0.1, 0.02), M(0xffd54f), torso, 0, 0.08, 0.16);
    add(box(0.1, 0.62, 0.02), swhite, torso, 0, 0.31, 0.14);
    add(box(0.62, 0.62, 0.3), M(0x7a4a22), torso, 0, 0.3, -0.3); add(box(0.5, 0.12, 0.26), M(0x5a3412), torso, 0, 0.66, -0.3);
  }
  if (o.gear) {   // equippable helmet (player only)
    var dome = add(box(0.39, 0.19, 0.39), helmMat, head, 0, 0.29, 0);
    var visor = add(box(0.39, 0.06, 0.04), M(0x111111), head, 0, 0.2, 0.195, true);
    var crest = add(box(0.05, 0.15, 0.22), M(0xcc2222, { emissive: 0x330000 }), head, 0, 0.47, 0, true);
    var side = add(box(0.4, 0.2, 0.34), helmMat, head, 0, 0.13, -0.02);
    helmMeshes.push(dome, visor, crest, side);
    helmMeshes.forEach(function (m) { m.visible = false; });
  }

  // arms (blocky 0.2 wide, shoulder pivot at the top)
  function mkArm(sx) {
    var sh = new THREE.Group(); sh.position.set(sx * (0.25 * bk + 0.1 * th), 0.55, 0); torso.add(sh);
    add(box(0.2 * th, 0.3, 0.2 * th), (o.sleeve !== undefined ? M(o.sleeve) : shirtM), sh, 0, -0.15, 0);
    if (o.pads) { var pd = add(box(0.26, 0.1, 0.26), padMat, sh, 0, 0.0, 0); padMeshes.push(pd); if (o.gear) pd.visible = false; }
    var el = new THREE.Group(); el.position.y = -0.3; sh.add(el);
    add(box(0.19 * th, 0.27, 0.19 * th), M(o.forearm !== undefined ? o.forearm : o.skin), el, 0, -0.135, 0);
    if (o.gear) {
      gz(gzArmorMeshes, box(0.27, 0.035, 0.27), gzTrim, sh, 0, 0.07, 0);
      gz(radArmorMeshes, box(0.05, 0.14, 0.3), radGold, sh, sx * 0.14, 0.04, 0); gz(radArmorMeshes, box(0.08, 0.08, 0.08), radTeal, sh, sx * 0.14, 0.12, 0);
      gz(gzArmorMeshes, box(0.04, 0.16, 0.27), gzTrim, sh, sx * 0.12, 0.0, 0);
      gz(gzGloveMeshes, box(0.25, 0.035, 0.25), gzTrim, el, 0, -0.12, 0);
      gz(radGloveMeshes, box(0.27, 0.05, 0.27), radGold, el, 0, -0.1, 0); gz(radGloveMeshes, box(0.09, 0.09, 0.03), radTeal, el, 0, -0.21, 0.125); gz(radGloveMeshes, box(0.24, 0.03, 0.24), radTeal, el, 0, -0.29, 0);
      gz(gzGloveMeshes, box(0.25, 0.03, 0.25), gzTrim, el, 0, -0.29, 0);
      gz(gzGloveMeshes, box(0.1, 0.1, 0.02), gzPanel, el, 0, -0.2, 0.125);
      var gh = add(box(0.23, 0.12, 0.23), glovesMat, el, 0, -0.25, 0, true);
      var gc = add(box(0.23, 0.09, 0.23), glovesMat, el, 0, -0.17, 0);
      gh.visible = gc.visible = false; gloveMeshes.push(gh, gc);
    }
    return { sh: sh, el: el };
  }
  var armL = mkArm(-1), armR = mkArm(1);

  // legs (blocky)
  function mkLeg(sx) {
    var hp = new THREE.Group(); hp.position.set(sx * 0.125 * bk, 0, 0); hips.add(hp);
    add(box(0.23 * th, 0.46, 0.24 * th), pantsMat, hp, 0, -0.23, 0);
    var kn = new THREE.Group(); kn.position.y = -0.46; hp.add(kn);
    add(box(0.22 * th, 0.36, 0.23 * th), (o.shin !== undefined ? M(o.shin) : pantsMat), kn, 0, -0.18, 0);
    add(box(0.25, 0.1, 0.3), M(o.boots), kn, 0, -0.41, 0.03);
    if (o.gear) {   // Godzilla pants: cyan knee plate + thigh stripes
      gz(gzPantsMeshes, box(0.27, 0.1, 0.27), gzTrim, kn, 0, 0.02, 0);
      gz(radPantsMeshes, box(0.27, 0.1, 0.27), radGold, kn, 0, 0.02, 0); gz(radPantsMeshes, box(0.05, 0.3, 0.03), radTeal, hp, 0, -0.22, 0.125); gz(radPantsMeshes, box(0.27, 0.06, 0.26), radGold, kn, 0, -0.3, 0);
      for (var ti = 0; ti < 3; ti++) gz(gzPantsMeshes, box(0.2 - ti * 0.05, 0.03, 0.02), gzTrim, hp, 0, -0.1 - ti * 0.07, 0.125);
      gz(gzPantsMeshes, box(0.2, 0.025, 0.02), gzTrim, kn, 0, -0.2, 0.12);
    }
    return { hp: hp, kn: kn };
  }
  var legL = mkLeg(-1), legR = mkLeg(1);

  // cape
  var cape = null;
  if (o.cape !== undefined) {
    cape = new THREE.Group(); cape.position.set(0, 0.58, -0.17 * bk); torso.add(cape);
    add(box(0.44 * bk, 0.85, 0.04), M(o.cape, { side: THREE.DoubleSide }), cape, 0, -0.42, 0);
  }

  // wings (player only, hidden until equipped): blocky feather bars
  var wingsG = null;
  if (o.gear) {
    wingsG = new THREE.Group(); wingsG.position.set(0, 0.42, -0.17); torso.add(wingsG); wingsG.visible = false;
    var lens = [0.8, 0.9, 0.85, 0.7, 0.55], angs = [0.75, 0.45, 0.15, -0.15, -0.45];
    [-1, 1].forEach(function (sx) {
      var wg = new THREE.Group(); wg.position.x = sx * 0.07; wg.rotation.y = sx * 0.7; wingsG.add(wg);
      for (var i = 0; i < 5; i++) {
        var gg = new THREE.BoxGeometry(lens[i], 0.09, 0.03); gg.translate(sx * lens[i] / 2, 0, 0);
        var bl = new THREE.Mesh(gg, wingMat); bl.rotation.z = sx * angs[i]; wg.add(bl);
      }
      wings.push({ g: wg, sx: sx });
    });
  }

  // clockwork fairy wings (Bad Santa drop): teal membranes, gold trim, central gear
  var wingsG2 = null, wingMat2 = null;
  if (o.gear) {
    wingMat2 = M(0x1fb4a0, { roughness: 0.5, metalness: 0.2, side: THREE.DoubleSide });
    var goldM = M(0xe0a830, { metalness: 0.7, roughness: 0.35 });
    wingsG2 = new THREE.Group(); wingsG2.position.set(0, 0.42, -0.17); torso.add(wingsG2); wingsG2.visible = false;
    var lens2 = [1.05, 0.9, 0.72, 0.5], angs2 = [1.0, 0.6, 0.2, -0.28];
    [-1, 1].forEach(function (sx) {
      var wg2 = new THREE.Group(); wg2.position.x = sx * 0.08; wg2.rotation.y = sx * 0.7; wingsG2.add(wg2);
      for (var i = 0; i < 4; i++) {
        var bg = new THREE.BoxGeometry(lens2[i], 0.14, 0.025); bg.translate(sx * lens2[i] / 2, 0, 0);
        var bl2 = new THREE.Mesh(bg, wingMat2); bl2.rotation.z = sx * angs2[i]; wg2.add(bl2);
        var tg = new THREE.BoxGeometry(lens2[i], 0.035, 0.035); tg.translate(sx * lens2[i] / 2, 0.08, 0);
        var tr = new THREE.Mesh(tg, goldM); tr.rotation.z = sx * angs2[i]; wg2.add(tr);
        var tg2 = new THREE.BoxGeometry(lens2[i], 0.035, 0.035); tg2.translate(sx * lens2[i] / 2, -0.08, 0);
        var tr2 = new THREE.Mesh(tg2, goldM); tr2.rotation.z = sx * angs2[i]; wg2.add(tr2);
      }
      wings.push({ g: wg2, sx: sx });
    });
    [0, Math.PI / 4].forEach(function (rz) { var gb = new THREE.Mesh(new THREE.BoxGeometry(0.26, 0.26, 0.05), goldM); gb.rotation.z = rz; gb.position.set(0, -0.12, 0); wingsG2.add(gb); });
    var hub = new THREE.Mesh(new THREE.BoxGeometry(0.12, 0.12, 0.07), wingMat2); hub.position.set(0, -0.12, 0.01); wingsG2.add(hub);
  }

  // Godzilla Wings (Croczilla drop): black bone with cyan joints, cyan ribs and a translucent cyan membrane
  var wingsG3 = null;
  if (o.gear) {
    var gzBone = M(0x141414, { roughness: 0.6 });
    var gzMem = M(0x8aeaff, { roughness: 0.5, transparent: true, opacity: 0.45, side: THREE.DoubleSide });
    wingsG3 = new THREE.Group(); wingsG3.position.set(0, 0.42, -0.17); torso.add(wingsG3); wingsG3.visible = false; wingsG3.userData.mem = gzMem;
    var JNT = [0.55, 0.23], TIP = [0.82, 0.66], ENDS = [[0.04, -0.2], [0.3, -0.34], [0.62, -0.32], [0.98, -0.08]];
    function seg(g, mat, x0, y0, x1, y1, th2, d) {
      var L = Math.sqrt((x1 - x0) * (x1 - x0) + (y1 - y0) * (y1 - y0)), gg = new THREE.BoxGeometry(L, th2, d); gg.translate(L / 2, 0, 0);
      var m = new THREE.Mesh(gg, mat); m.position.set(x0, y0, 0); m.rotation.z = Math.atan2(y1 - y0, x1 - x0); g.add(m); return m;
    }
    [-1, 1].forEach(function (sx) {
      var wg3 = new THREE.Group(); wg3.position.x = sx * 0.08; wg3.rotation.y = sx * 0.7; wingsG3.add(wg3);
      var inn = new THREE.Group(); inn.scale.x = sx; wg3.add(inn);
      seg(inn, gzBone, 0, 0, JNT[0], JNT[1], 0.08, 0.05); seg(inn, gzBone, JNT[0], JNT[1], TIP[0], TIP[1], 0.07, 0.05);
      var jn = new THREE.Mesh(new THREE.BoxGeometry(0.13, 0.13, 0.07), gzTrim); jn.position.set(JNT[0], JNT[1], 0); inn.add(jn);
      [0.3, 0.62].forEach(function (f) { var b = new THREE.Mesh(new THREE.BoxGeometry(0.07, 0.1, 0.06), gzTrim); b.position.set(JNT[0] * f / 0.62 * 0.55, JNT[1] * f / 0.62 * 0.55, 0); b.rotation.z = 0.4; inn.add(b); });
      ENDS.forEach(function (e) { seg(inn, gzTrim, TIP[0], TIP[1], e[0], e[1], 0.05, 0.035); });
      if (THREE.ShapeGeometry && THREE.Shape) {
        var sh2 = new THREE.Shape(); sh2.moveTo(JNT[0], JNT[1]); sh2.lineTo(TIP[0], TIP[1]); sh2.lineTo(ENDS[3][0], ENDS[3][1]); sh2.lineTo(ENDS[2][0], ENDS[2][1]); sh2.lineTo(ENDS[1][0], ENDS[1][1]); sh2.lineTo(ENDS[0][0], ENDS[0][1]); sh2.lineTo(0.05, 0.02);
        var ms = new THREE.Mesh(new THREE.ShapeGeometry(sh2), gzMem); ms.position.z = -0.01; inn.add(ms);
      }
      wings.push({ g: wg3, sx: sx });
    });
  }

  // "God of Helmet": Godzilla-style armoured head with blue glowing spines (Croczilla drop)
  var godG = null, godMat = null, flameMat = null;
  if (o.gear) {
    godMat = M(0x30343e, { metalness: 0.5, roughness: 0.5 }); flameMat = M(0x66bbff, { emissive: 0x2a8cff, emissiveIntensity: 0.9, roughness: 0.4 });
    var toothM = M(0xf2efe0), eyeG = M(0xdff4ff, { emissive: 0x88ccff, emissiveIntensity: 1.2 });
    godG = new THREE.Group(); head.add(godG); godG.visible = false;
    add(box(0.43, 0.36, 0.43), godMat, godG, 0, 0.2, 0); add(box(0.45, 0.07, 0.12), godMat, godG, 0, 0.36, 0.2);
    add(box(0.3, 0.15, 0.3), godMat, godG, 0, 0.12, 0.32); var jaw = add(box(0.28, 0.06, 0.26), godMat, godG, 0, 0.0, 0.3); jaw.rotation.x = 0.22;
    for (var gi = 0; gi < 4; gi++) [-1, 1].forEach(function (sx) { add(box(0.035, 0.07, 0.035), toothM, godG, sx * 0.12, 0.03, 0.22 + gi * 0.075, true); });
    [-1, 1].forEach(function (sx) { add(box(0.075, 0.05, 0.04), eyeG, godG, sx * 0.13, 0.26, 0.215, true); });
    for (var col = -1; col <= 1; col++) for (var row = 0; row < 3; row++) {
      add(box(0.16, 0.09, 0.12), godMat, godG, col * 0.15, 0.38 - row * 0.07, -0.08 - row * 0.12);
      var sp = add(box(0.09, 0.3 - row * 0.04, 0.07), flameMat, godG, col * 0.15, 0.5 - row * 0.06, -0.1 - row * 0.12, true); sp.rotation.x = -0.7;
    }
  }

  var wpn = new THREE.Group(); wpn.position.y = -0.26; wpn.rotation.x = 1.9; armR.el.add(wpn);

  root.scale.setScalar(o.scale);
  return { root: root, mats: mats, rig: { body: body, hips: hips, torso: torso, head: head, armL: armL, armR: armR, legL: legL, legR: legR, cape: cape, wpn: wpn, armor: armor, armorMat: armorMat,
    pantsMat: pantsMat, padMat: padMat, padMeshes: padMeshes, glovesMat: glovesMat, gloveMeshes: gloveMeshes, helmMat: helmMat, helmMeshes: helmMeshes,
    hairMeshes: hairMeshes, hairStyles: hairStyles, crownG: crownG, maskG: maskG, ssjWings: ssjWings, ssjG: ssjG, aura: aura, skirt: skirt, hairMat: hm, shirtMats: shirtMats, wingMat: wingMat, wingsG: wingsG, wingsG2: wingsG2, wingsG3: wingsG3, wingMat2: wingMat2, gzTrim: gzTrim, radArmorMeshes: radArmorMeshes, radGloveMeshes: radGloveMeshes, radPantsMeshes: radPantsMeshes, gzArmorMeshes: gzArmorMeshes, gzGloveMeshes: gzGloveMeshes, gzPantsMeshes: gzPantsMeshes, wings: wings, godG: godG, godMat: godMat, flameMat: flameMat } };
}

function setWeapon(c, kind, color, glow) {
  var holder = c.rig.wpn; c.wMat = null;
  while (holder.children.length) {
    var o = holder.children[0]; holder.remove(o);
    if (o.geometry) o.geometry.dispose();
    if (o.material) o.material.dispose();
  }
  var metal = new THREE.MeshStandardMaterial({ color: color, metalness: 0.7, roughness: 0.3, emissive: glow ? color : 0x000000, emissiveIntensity: glow ? 0.7 : 0 });
  c.wMat = metal;
  var wood = new THREE.MeshStandardMaterial({ color: 0x5a3a1c, roughness: 0.9 });
  function add(geo, mat, x, y, z) { var m = new THREE.Mesh(geo, mat); m.position.set(x, y, z); m.castShadow = true; holder.add(m); return m; }
  if (kind === 'axe') {
    add(new THREE.BoxGeometry(0.06, 0.95, 0.06), wood, 0, 0.32, 0);
    add(new THREE.BoxGeometry(0.34, 0.28, 0.05), metal, 0.15, 0.72, 0);
  } else if (kind === 'eyeblade') {          // red flaming sword with an eye pommel
    var gold = new THREE.MeshStandardMaterial({ color: 0xffb020, metalness: 0.6, roughness: 0.35, emissive: 0xaa5500, emissiveIntensity: 0.5 });
    var dark = new THREE.MeshStandardMaterial({ color: 0x2a0a0a, roughness: 0.6 });
    var aura = new THREE.MeshBasicMaterial({ color: 0xff2020, transparent: true, opacity: 0.28, depthWrite: false });
    add(new THREE.BoxGeometry(0.07, 0.3, 0.07), dark, 0, -0.04, 0);
    add(new THREE.BoxGeometry(0.2, 0.2, 0.08), dark, 0, 0.14, 0);
    add(new THREE.BoxGeometry(0.1, 0.1, 0.1), gold, 0, 0.14, 0.03);
    add(new THREE.BoxGeometry(0.03, 0.09, 0.11), dark, 0, 0.14, 0.04);
    [-1, 1].forEach(function (sx) {
      var h1 = add(new THREE.BoxGeometry(0.22, 0.045, 0.06), dark, sx * 0.17, 0.12, 0); h1.rotation.z = sx * 0.55;
      var h2 = add(new THREE.BoxGeometry(0.16, 0.04, 0.06), dark, sx * 0.14, 0.27, 0); h2.rotation.z = -sx * 0.7;
      var h3 = add(new THREE.BoxGeometry(0.16, 0.04, 0.06), dark, sx * 0.14, 0.0, 0); h3.rotation.z = -sx * 0.7;
    });
    add(new THREE.BoxGeometry(0.17, 1.25, 0.03), metal, 0, 0.3 + 0.62, 0);
    add(new THREE.BoxGeometry(0.1, 0.2, 0.03), metal, 0.02, 1.62, 0);
    add(new THREE.BoxGeometry(0.34, 1.3, 0.1), aura, 0, 0.3 + 0.65, 0);
    [0.5, 0.8, 1.1].forEach(function (yy, i) { var sp = add(new THREE.BoxGeometry(0.1, 0.09, 0.03), metal, (i % 2 ? -1 : 1) * 0.12, 0.3 + yy, 0); sp.rotation.z = (i % 2 ? 1 : -1) * 0.6; });
  } else if (kind === 'ssjblade') {          // Super Saiyan Sword: flat, wide glowing yellow + white blade
    var wh = new THREE.MeshStandardMaterial({ color: 0xffffff, emissive: 0xffffff, emissiveIntensity: 0.9, roughness: 0.2 });
    var gl = new THREE.MeshBasicMaterial({ color: 0xffe14a, transparent: true, opacity: 0.3, depthWrite: false });
    add(new THREE.BoxGeometry(0.07, 0.3, 0.07), wood, 0, -0.04, 0);
    add(new THREE.BoxGeometry(0.34, 0.07, 0.09), wh, 0, 0.14, 0);
    add(new THREE.BoxGeometry(0.3, 1.5, 0.025), metal, 0, 0.18 + 0.75, 0);
    add(new THREE.BoxGeometry(0.1, 1.4, 0.032), wh, 0, 0.18 + 0.7, 0);
    add(new THREE.BoxGeometry(0.03, 1.5, 0.032), wh, -0.15, 0.18 + 0.75, 0); add(new THREE.BoxGeometry(0.03, 1.5, 0.032), wh, 0.15, 0.18 + 0.75, 0);
    add(new THREE.BoxGeometry(0.16, 0.2, 0.025), metal, 0, 0.18 + 1.6, 0);
    add(new THREE.BoxGeometry(0.5, 1.7, 0.08), gl, 0, 0.18 + 0.85, 0);
  } else if (kind === 'cane') {               // giant candy cane (Bad Santa)
    var red = new THREE.MeshStandardMaterial({ color: 0xd01818, roughness: 0.5 }), whi = new THREE.MeshStandardMaterial({ color: 0xf4f4f4, roughness: 0.5 });
    for (var sI = 0; sI < 10; sI++) add(new THREE.BoxGeometry(0.1, 0.17, 0.1), sI % 2 ? whi : red, 0, -0.1 + sI * 0.17, 0);
    add(new THREE.BoxGeometry(0.28, 0.1, 0.1), red, 0.09, 1.7, 0); add(new THREE.BoxGeometry(0.1, 0.22, 0.1), whi, 0.22, 1.6, 0);
  } else if (kind === 'fist') {               // no weapon (punch)
  } else if (kind === 'card') {               // playing card (SocMiya)
    var cw = new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.5 }), cr = new THREE.MeshStandardMaterial({ color: color, emissive: color, emissiveIntensity: 0.4 });
    add(new THREE.BoxGeometry(0.34, 0.48, 0.03), cw, 0, 0.15, 0.1); add(new THREE.BoxGeometry(0.16, 0.16, 0.035), cr, 0, 0.15, 0.1);
  } else if (kind === 'camera') {             // camera (FakeOld)
    var cb = new THREE.MeshStandardMaterial({ color: 0x1c1c22, roughness: 0.5 }), cl = new THREE.MeshStandardMaterial({ color: 0x66bbff, emissive: 0x2a8cff, emissiveIntensity: 0.8 });
    add(new THREE.BoxGeometry(0.4, 0.26, 0.22), cb, 0, 0.14, 0.1); add(new THREE.BoxGeometry(0.15, 0.15, 0.12), cl, 0, 0.14, 0.24); add(new THREE.BoxGeometry(0.12, 0.06, 0.08), new THREE.MeshBasicMaterial({ color: 0xffffff }), 0.1, 0.3, 0.1);
  } else if (kind === 'godsword') {           // Godzilla Sword (olive cross-blade, as in the icon)
    var grip = new THREE.MeshStandardMaterial({ color: 0x96443c, roughness: 0.7 });
    var panel = new THREE.MeshBasicMaterial({ color: 0xebeee0, transparent: true, opacity: 0.55, depthWrite: false });
    var aura2 = new THREE.MeshBasicMaterial({ color: 0x66bbff, transparent: true, opacity: 0.22, depthWrite: false });
    add(new THREE.BoxGeometry(0.075, 0.38, 0.075), grip, 0, -0.06, 0);
    [-1, 1].forEach(function (sx) {
      var g1 = add(new THREE.BoxGeometry(0.36, 0.065, 0.08), metal, sx * 0.15, 0.22, 0); g1.rotation.z = sx * 0.5;
      var g2 = add(new THREE.BoxGeometry(0.26, 0.05, 0.08), metal, sx * 0.1, 0.1, 0); g2.rotation.z = sx * -0.5;
      add(new THREE.BoxGeometry(0.06, 0.85, 0.045), metal, sx * 0.19, 0.3 + 0.55, 0);
    });
    add(new THREE.BoxGeometry(0.15, 1.7, 0.05), metal, 0, 0.3 + 0.85, 0); add(new THREE.BoxGeometry(0.58, 0.13, 0.055), metal, 0, 0.3 + 1.55, 0);
    add(new THREE.BoxGeometry(0.5, 1.5, 0.02), panel, 0, 0.3 + 0.8, -0.04); add(new THREE.BoxGeometry(0.36, 1.85, 0.1), aura2, 0, 0.3 + 0.95, 0);
  } else if (kind === 'staff') {
    add(new THREE.BoxGeometry(0.06, 1.1, 0.06), wood, 0, 0.35, 0);
    add(new THREE.BoxGeometry(0.18, 0.18, 0.18), metal, 0, 0.98, 0);
  } else if (kind === 'spear') {
    add(new THREE.BoxGeometry(0.05, 1.2, 0.05), wood, 0, 0.4, 0);
    add(new THREE.BoxGeometry(0.1, 0.25, 0.04), metal, 0, 1.12, 0);
  } else {
    var L = kind === 'dagger' ? 0.32 : (kind === 'greatsword' ? 1.15 : 0.78);
    var W = kind === 'greatsword' ? 0.13 : (kind === 'dagger' ? 0.05 : 0.075);
    add(new THREE.BoxGeometry(0.06, 0.22, 0.06), wood, 0, 0, 0);
    add(new THREE.BoxGeometry(kind === 'greatsword' ? 0.3 : 0.22, 0.035, 0.06), metal, 0, 0.11, 0);
    add(new THREE.BoxGeometry(W, L, 0.018), metal, 0, 0.12 + L / 2, 0);
    add(new THREE.BoxGeometry(W * 0.6, 0.08, 0.018), metal, 0, 0.12 + L + 0.04, 0);
  }
}

/* floating name tag + hp bar sprite */
function makeTag(c, color, showBar) {
  var cv = document.createElement('canvas'); cv.width = 512; cv.height = 128;
  var ctx = cv.getContext('2d'); ctx.scale(2, 2);   // drawn in 256x64 units, 2x pixels for a sharp, bigger tag
  var tex = new THREE.CanvasTexture(cv);
  var spr = new THREE.Sprite(new THREE.SpriteMaterial({ map: tex, transparent: true, depthTest: false, depthWrite: false }));
  spr.scale.set(4.2 / c.scale, 1.05 / c.scale, 1);   // name tags are 2x bigger
  spr.position.y = 2.6; spr.renderOrder = 999;
  c.g.add(spr);
  function draw(frac) {
    ctx.clearRect(0, 0, 256, 64);
    ctx.font = 'bold 22px sans-serif'; ctx.textAlign = 'center';
    ctx.lineWidth = 4; ctx.strokeStyle = 'rgba(0,0,0,.85)';
    var txt = (c.lvl ? 'Lv' + c.lvl + ' ' : '') + c.name;
    ctx.strokeText(txt, 128, 24); ctx.fillStyle = color; ctx.fillText(txt, 128, 24);
    if (frac !== null && frac !== undefined) {
      ctx.fillStyle = 'rgba(0,0,0,.75)'; ctx.fillRect(38, 34, 180, 14);
      ctx.fillStyle = frac > 0.5 ? '#46d246' : (frac > 0.25 ? '#e0c020' : '#e03030');
      ctx.fillRect(40, 36, Math.max(0, 176 * frac), 10);
    }
    tex.needsUpdate = true;
  }
  draw(showBar ? 1 : null);
  return { spr: spr, draw: draw };
}

function newChar(look, name, lvl, tagColor, showBar, weapon) {
  var hm = makeHumanoid(look);
  var c = { g: hm.root, rig: hm.rig, mats: hm.mats, scale: look.scale, phase: Math.random() * 6, mv: 0, anim: null, flash: 0, hitT: 0, _fl: false, name: name, lvl: lvl };
  if (weapon) setWeapon(c, weapon.kind, weapon.color, weapon.glow);
  c.tag = makeTag(c, tagColor, showBar);
  scene.add(c.g);
  return c;
}

function slashPose(k) { // [armX, elbowX, torsoYaw, lean, lunge]
  if (k < 0.28) { var s = ease(k / 0.28); return [lerp(-0.2, -2.7, s), lerp(-0.9, -0.5, s), lerp(0, 0.55, s), lerp(0, -0.15, s), 0]; }
  if (k < 0.55) { var s2 = (k - 0.28) / 0.27, e = s2 * s2; return [lerp(-2.7, -0.35, e), lerp(-0.5, -0.2, e), lerp(0.55, -0.6, e), lerp(-0.15, 0.3, e), e]; }
  var s3 = ease((k - 0.55) / 0.45); return [lerp(-0.35, -0.2, s3), lerp(-0.2, -0.9, s3), lerp(-0.6, 0, s3), lerp(0.3, 0, s3), 1 - s3];
}

function startAnim(c, type, dur) { c.anim = { type: type, t: 0, dur: dur }; }
/* death: drop (caller) -> kneel -> topple forward -> 1 s later a translucent ghost rises out of the body to heaven */
function startDeath(c, pos) {
  startAnim(c, 'death', 1.3); c.deathKnee = 0;
  var s = c.scale || 1, gx = pos.x, gz = pos.z, ry = c.g.rotation.y;
  schedule(1.0, function () {
    var g = new THREE.Group(), mats = [];
    function gm(w, h2, d, x, y, z, rz, col, op) { var m = new THREE.MeshBasicMaterial({ color: col || 0xdff1ff, transparent: true, opacity: op || 0.55, depthWrite: false }); mats.push([m, op || 0.55]); var b = new THREE.Mesh(new THREE.BoxGeometry(w, h2, d), m); b.position.set(x, y, z); if (rz) b.rotation.z = rz; g.add(b); return b; }
    gm(0.36, 0.36, 0.36, 0, 1.75, 0);                       // head
    gm(0.52, 0.62, 0.3, 0, 1.25, 0);                        // torso
    gm(0.16, 0.6, 0.16, 0.38, 1.38, 0, -0.7); gm(0.16, 0.6, 0.16, -0.38, 1.38, 0, 0.7);   // arms raised
    gm(0.44, 0.26, 0.28, 0, 0.82, 0, 0, 0xdff1ff, 0.42); gm(0.3, 0.26, 0.24, 0, 0.58, 0, 0, 0xdff1ff, 0.3); gm(0.16, 0.26, 0.2, 0, 0.34, 0, 0, 0xdff1ff, 0.2);   // fading wisp instead of legs
    gm(0.07, 0.07, 0.03, 0.09, 1.78, 0.19, 0, 0x203050, 0.8); gm(0.07, 0.07, 0.03, -0.09, 1.78, 0.19, 0, 0x203050, 0.8);   // eyes
    g.scale.setScalar(s); g.rotation.y = ry; g.position.set(gx, 0.3, gz);
    var dur = 2.6;
    gfx(g, dur, function (k) {
      g.position.y = 0.3 + k * 7 * s * 0.8 + k * k * 4; g.position.x = gx + Math.sin(k * 9) * 0.25 * s; g.rotation.y = ry + Math.sin(k * 5) * 0.25;
      var f = k > 0.55 ? 1 - (k - 0.55) / 0.45 : 1;
      mats.forEach(function (m) { m[0].opacity = m[1] * f; });
    });
  });
}

function animateChar(c, dt, spd) {
  if (c.croc) animCroc(c, dt, spd);
  var r = c.rig, t = performance.now() / 1000;
  c.mv = lerp(c.mv, clamp(spd / 4.2, 0, 1.3), Math.min(1, dt * 12));
  c.phase += dt * spd * 1.9 / Math.sqrt(c.scale);
  var mv = c.mv, sw = Math.sin(c.phase), co = Math.cos(c.phase);
  var aR = -0.2 + sw * 0.25 * mv, eR = -0.9 - 0.15 * mv;
  var aL = -sw * 0.55 * mv, eL = -0.25 - 0.25 * mv * (sw > 0 ? 1 : 0.3);
  var tw = sw * 0.1 * mv, lean = 0.04 * mv, lunge = 0, bodyYaw = 0, bodyRX = 0, bodyY = 0, armLZ = 0, armRZ = 0, headX = 0;
  var a = c.anim;
  if (a) {
    a.t += dt;
    var k = Math.min(1, a.t / a.dur);
    if (a.type === 'attack') {
      var p = slashPose(k); aR = p[0]; eR = p[1]; tw = p[2]; lean = p[3]; lunge = p[4]; aL = lerp(aL, -0.5, 0.7);
    } else if (a.type === 'spin') {
      bodyYaw = k * TAU; aR = -1.4; eR = -0.2; aL = -1.4; eL = -0.2; armRZ = 0.6; armLZ = -0.6; lean = 0.15;
    } else if (a.type === 'cast') {
      var s = Math.sin(Math.min(1, k * 1.2) * Math.PI);
      aR = -2.5 * s - 0.2 * (1 - s); aL = -2.5 * s; eR = -0.5; eL = -0.4; headX = -0.3 * s; lean = -0.1 * s;
    } else if (a.type === 'death') {
      var kk = Math.min(1, a.t / 1.3), kneel = ease(Math.min(1, kk / 0.4)), fall = ease(Math.max(0, (kk - 0.35) / 0.65));   // 1) knees bend  2) slowly topple forward
      bodyRX = fall * Math.PI / 2 * 0.97; bodyY = fall * 0.12; aR = -0.3 + fall * 0.5; aL = 0.4 - fall * 0.5; eR = -0.2; eL = -0.3; tw = 0; lean = 0.15 * kneel;
      c.deathKnee = kneel * (1 - fall * 0.35);
    }
    if (a.type !== 'death' && a.t >= a.dur) c.anim = null;
  }
  if (c.hitT > 0) { c.hitT -= dt; lean -= c.hitT * 1.2; }

  r.legR.hp.rotation.x = -sw * 0.75 * mv; r.legL.hp.rotation.x = sw * 0.75 * mv;
  r.legR.kn.rotation.x = Math.max(0, co) * 0.95 * mv; r.legL.kn.rotation.x = Math.max(0, -co) * 0.95 * mv;
  r.armR.sh.rotation.x = aR; r.armR.el.rotation.x = eR; r.armR.sh.rotation.z = 0.08 + armRZ;
  r.armL.sh.rotation.x = aL; r.armL.el.rotation.x = eL; r.armL.sh.rotation.z = -0.08 + armLZ;
  r.torso.rotation.y = tw; r.torso.rotation.x = lean;
  r.head.rotation.y = -tw * 0.5; r.head.rotation.x = headX - lean * 0.5;
  r.torso.scale.y = 1 + Math.sin(t * 2 + c.phase * 0.0) * 0.012;
  r.hips.position.y = 0.97 + Math.abs(co) * 0.035 * mv;
  if (a && a.type === 'death') { var dk = c.deathKnee || 0; r.legR.hp.rotation.x = r.legL.hp.rotation.x = -1.0 * dk; r.legR.kn.rotation.x = r.legL.kn.rotation.x = 1.7 * dk; r.hips.position.y = 0.97 - 0.4 * dk; }
  r.body.rotation.y = bodyYaw; r.body.rotation.x = bodyRX; r.body.position.y = bodyY; r.body.position.z = lunge * 0.3;
  if (r.cape) r.cape.rotation.x = 0.08 + mv * 0.5 + Math.sin(t * 3 + c.phase) * 0.05;
  if (r.wings && r.wings.length && (r.wingsG.visible || r.wingsG2.visible || r.wingsG3.visible)) {
    var flap = Math.sin(t * (4 + mv * 5)) * (0.1 + mv * 0.14);
    for (var wi = 0; wi < r.wings.length; wi++) { var w = r.wings[wi]; w.g.rotation.y = w.sx * (0.7 - flap); w.g.rotation.z = flap * 0.5 * w.sx * -1; }
  }

  var fl = c.flash > 0;
  if (fl) c.flash -= dt;
  if (fl !== c._fl) {
    c._fl = fl;
    for (var i = 0; i < c.mats.length; i++) {
      var m = c.mats[i];
      m.emissive.setHex(fl ? 0xff2a1a : (m.userData.em || 0));
      m.emissiveIntensity = fl ? 0.9 : (m.userData.emi || 1);
    }
  }
}

function faceTo(c, x, z, dt, rate) {
  var dx = x - c.g.position.x, dz = z - c.g.position.z;
  if (dx * dx + dz * dz < 1e-6) return;
  var ang = Math.atan2(dx, dz);
  c.g.rotation.y = rate ? turnToward(c.g.rotation.y, ang, 1 - Math.exp(-rate * dt)) : ang;
}

/* free GPU resources of a character (used when changing maps) */
function disposeChar(c) {
  scene.remove(c.g);
  c.g.traverse(function (o) {
    if (o.geometry) o.geometry.dispose();
    if (o.material) { if (o.material.map) o.material.map.dispose(); o.material.dispose(); }
  });
}

/* ---------- player / NPC / bots / enemies ---------- */
function wItem() { return ITEMS[P.equip.weapon] || ITEMS.weapon0; }
var playerChar = newChar({ hairStyles: true, scale: 1, skin: 0xf0c8a0, shirt: 0x2f6fd0, pants: 0x353a48, hair: 0x2a1a10, pads: true, padColor: 0x8a97a6, boots: 0x3a2a1a, gear: true }, P.name, 1, '#7fd1ff', false, { kind: 'sword', color: 0x9b7653 });
playerChar.tag.spr.visible = true;
P.c = playerChar; P.pos = playerChar.g.position;

function applyLook(rig) {   // apply P.look (sex, hair style, colors) to a model (default: the player)
  var r = rig || P.c.rig, L = P.look;
  if (r.hairMat) r.hairMat.color.setHex(L.hair);
  r.pantsMat.color.setHex(L.pants);
  if (r.skirt) r.skirt.visible = L.sex === 'f';
  r.shirtMats.forEach(function (m) { m.color.setHex(L.shirt); });
  r.torso.scale.x = L.sex === 'f' ? 0.84 : 1; r.hips.scale.x = L.sex === 'f' ? 1.1 : 1;
  if (r.hairStyles) {
    var st = clamp(L.style | 0, 0, r.hairStyles.length - 1);
    r.hairStyles.forEach(function (arr) { arr.forEach(function (m) { m.visible = false; }); });
    r.hairMeshes = r.hairStyles[st]; r.hairMeshes.forEach(function (m) { m.visible = true; });
  }
}
function applyEquipVisuals(tc, ov) {   // tc: optional preview character; ov: costume overrides {slot: id} (preview only)
  var pc = tc || P.c, CW = Object.assign({}, P.costumeWorn || {}, ov || {}); pc.cwEff = CW;
  applyLook(pc.rig);
  var r = pc.rig, w = CW.weapon ? COSTUME_DEFS[CW.weapon] : wItem();
  setWeapon(pc, w.kind, w.color, w.glow);   // a worn costume replaces (hides) the gear visual of its slot
  function vis(slot) { return CW[slot] ? COSTUME_DEFS[CW[slot]] : ITEMS[P.equip[slot]]; }
  var a = vis('armor'), p = vis('pants'), g = vis('gloves'), hm = vis('helmet'), wg = vis('wings');
  var crown = !!(hm && hm.model === 'crown'); if (crown) hm = null;
  var ssj = !!(hm && hm.model === 'ssj3'); if (ssj) hm = null;
  var mask = !!(hm && hm.model === 'mask'); if (mask) hm = null;
  var sw = !!(wg && wg.model === 'ssjwings'); if (sw) wg = null;
  if (r.maskG) { r.maskG.visible = mask; r.ssjWings.visible = sw; }
  if (r.crownG) r.crownG.visible = crown;
  if (r.ssjG) { r.ssjG.visible = ssj; r.aura.visible = ssj; }
  var gzA = !!(a && a.model === 'godzilla'), gzP = !!(p && p.model === 'godzilla'), gzG = !!(g && g.model === 'godzilla'), gzW = !!(wg && wg.model === 'godzilla');
  r.armor.visible = !!a; if (a) r.armorMat.color.setHex(gzA ? 0x141414 : a.color);
  r.gzArmorMeshes.forEach(function (m) { m.visible = gzA; }); r.gzGloveMeshes.forEach(function (m) { m.visible = gzG; }); r.gzPantsMeshes.forEach(function (m) { m.visible = gzP; });
  if (p) { r.pantsMat.color.setHex(gzP ? 0x141414 : p.color); r.pantsMat.metalness = 0.5; } else { r.pantsMat.color.setHex(P.look.pants); r.pantsMat.metalness = 0.05; }
  r.padMeshes.forEach(function (m) { m.visible = !!a; });
  if (a) r.padMat.color.setHex(gzA ? 0x141414 : (a.padColor || a.color));
  var radA = !!(a && a.model === 'radiant'), radG = !!(g && g.model === 'radiant'), radP = !!(p && p.model === 'radiant');
  r.radArmorMeshes.forEach(function (m) { m.visible = radA; }); r.radGloveMeshes.forEach(function (m) { m.visible = radG; }); r.radPantsMeshes.forEach(function (m) { m.visible = radP; });
  r.gloveMeshes.forEach(function (m) { m.visible = !!g; }); if (g) r.glovesMat.color.setHex(gzG ? 0x141414 : g.color);
  var godH = !!(hm && hm.model === 'god');
  r.helmMeshes.forEach(function (m) { m.visible = !!hm && !godH; }); r.hairMeshes.forEach(function (m) { m.visible = !hm && !ssj && !mask; }); if (r.godG) r.godG.visible = godH; if (hm) r.helmMat.color.setHex(hm.color);
  if (r.wingsG) {
    var gearW = !!(wg && wg.model === 'gear');
    r.wingsG.visible = !!wg && !gearW && !gzW; r.wingsG2.visible = gearW; r.wingsG3.visible = gzW;
    if (wg && !gearW && !gzW) r.wingMat.color.setHex(wg.color);
  }
  var rare = [];
  if (w.rare && pc.wMat) rare.push({ m: pc.wMat, fx: w.fx });
  var gzUsed = false; function gzRare(fx) { if (!gzUsed) { gzUsed = true; rare.push({ m: r.gzTrim, fx: fx }); } }
  if (a && a.rare) { if (gzA) gzRare(a.fx); else { rare.push({ m: r.armorMat, fx: a.fx }); rare.push({ m: r.padMat, fx: a.fx }); } }
  if (p && p.rare) { if (gzP) gzRare(p.fx); else rare.push({ m: r.pantsMat, fx: p.fx }); }
  if (g && g.rare) { if (gzG) gzRare(g.fx); else rare.push({ m: r.glovesMat, fx: g.fx }); }
  if (hm && hm.rare) rare.push({ m: godH ? r.flameMat : r.helmMat, fx: hm.fx });
  if (wg && wg.rare) { if (gzW) { gzRare(wg.fx); rare.push({ m: r.wingsG3.userData.mem, fx: wg.fx }); } else rare.push({ m: (wg.model === 'gear' ? r.wingMat2 : r.wingMat), fx: wg.fx }); }
  pc.rare = rare;
  var rareMats = rare.map(function (x) { return x.m; });
  pc.mats.forEach(function (m) { if (m.emissive && rareMats.indexOf(m) < 0) { m.emissive.setHex(m.userData.em || 0); m.emissiveIntensity = m.userData.emi || 1; } });
  // upgrade glow: every +1 makes the item glow stronger
  var up = [];
  function ug(m, id) { var l = id ? upgLvl(id) : 0; if (m && l > 0) up.push({ m: m, lvl: l, rare: rareMats.indexOf(m) >= 0 }); }
  function gm(m, it) { return it && it.model === 'godzilla' ? r.gzTrim : m; }
  var eqU = function (s) { return CW[s] ? null : P.equip[s]; };
  ug(pc.wMat, eqU('weapon')); ug(gm(r.armorMat, a), eqU('armor')); if (!gzA) ug(r.padMat, eqU('armor')); ug(gm(r.pantsMat, p), eqU('pants'));
  ug(gm(r.glovesMat, g), eqU('gloves')); ug(godH ? r.flameMat : r.helmMat, eqU('helmet')); ug(gzW ? r.gzTrim : (wg && wg.model === 'gear' ? r.wingMat2 : r.wingMat), eqU('wings'));
  pc.upg = up;
}
var UPG_COL = [0x9bd0ff, 0x6dff9a, 0xffd54f, 0xff7a2a, 0xff4fd8];
function upgColor(l, t) { return l >= MAX_UPG ? new THREE.Color().setHSL((t * 0.6) % 1, 1, 0.6).getHex() : UPG_COL[Math.min(4, Math.floor(l / 10))]; }
function updateUpg(c, dt, t) {
  if (!c.upg || !c.upg.length || c.flash > 0) return;
  var maxL = 0;
  for (var i = 0; i < c.upg.length; i++) {
    var u = c.upg[i], pulse = 0.85 + 0.15 * Math.sin(t * 3 + i); if (u.lvl > maxL) maxL = u.lvl;
    if (u.rare) { u.m.emissiveIntensity += 0.02 * u.lvl; continue; }
    u.m.emissive.setHex(upgColor(u.lvl, t)); u.m.emissiveIntensity = (0.1 + 0.03 * u.lvl) * pulse;
  }
  c.upT = (c.upT || 0) - dt;
  if (maxL >= 3 && c.upT <= 0) {
    c.upT = Math.max(0.05, 0.6 - maxL * 0.011);
    var col = upgColor(maxL, t), qc = Math.round(((col >> 16) & 255) / 32) * 32, qg = Math.round(((col >> 8) & 255) / 32) * 32, qb = Math.round((col & 255) / 32) * 32;
    burst({ x: c.g.position.x + rand(-0.5, 0.5), y: rand(0.2, 2), z: c.g.position.z + rand(-0.5, 0.5) }, (Math.min(255, qc) << 16) | (Math.min(255, qg) << 8) | Math.min(255, qb), 1 + Math.floor(maxL / 15), 0.5, 1.6);
  }
}

/* rare (boss) gear: animated neon colours + sparkles */
var FX_RANGE = { rainbow: [0, 1, 0.35], fire: [0, 0.11, 0.9], ice: [0.48, 0.58, 0.7], galaxy: [0.72, 0.88, 0.5], neon: [0.42, 0.95, 0.45], gold: [0.1, 0.16, 0.8], teal: [0.44, 0.52, 0.6], celestial: [0.1, 0.55, 0.45], atomic: [0.55, 0.62, 0.55] };
function rareHue(fx, t, off) {
  var r = FX_RANGE[fx] || FX_RANGE.rainbow;
  if (fx === 'rainbow') return (t * r[2] + off) % 1;
  return r[0] + (r[1] - r[0]) * (0.5 + 0.5 * Math.sin(t * r[2] * 6.28 + off * 6.28));
}
function updateRare(c, dt, t) {
  if (!c.rare || !c.rare.length || c.flash > 0) return;
  for (var i = 0; i < c.rare.length; i++) {
    var r = c.rare[i], hh = rareHue(r.fx, t, i * 0.11);
    r.m.color.setHSL(hh, 0.85, 0.55); r.m.emissive.setHSL(hh, 1, 0.5); r.m.emissiveIntensity = 0.85;
  }
  c.spT = (c.spT || 0) - dt;
  if (c.spT <= 0) {
    c.spT = 0.12;
    var hq = Math.round(rareHue(c.rare[0].fx, t, 0) * 11) / 11, col = new THREE.Color().setHSL(hq, 1, 0.6).getHex();
    burst({ x: c.g.position.x + rand(-0.45, 0.45), y: rand(0.2, 2), z: c.g.position.z + rand(-0.45, 0.45) }, col, 1, 0.5, 1.6);
  }
}

function makeMarker() {
  var cv = document.createElement('canvas'); cv.width = cv.height = 64;
  var ctx = cv.getContext('2d');
  var tex = new THREE.CanvasTexture(cv);
  var spr = new THREE.Sprite(new THREE.SpriteMaterial({ map: tex, transparent: true, depthTest: false, depthWrite: false }));
  spr.scale.set(0.8, 0.8, 1); spr.renderOrder = 1000; spr.visible = false;
  return { spr: spr, set: function (ch) {
    if (!ch) { spr.visible = false; return; }
    ctx.clearRect(0, 0, 64, 64); ctx.font = 'bold 54px sans-serif'; ctx.textAlign = 'center';
    ctx.lineWidth = 6; ctx.strokeStyle = '#000'; ctx.strokeText(ch, 32, 50);
    ctx.fillStyle = ch === '!' ? '#ffd54f' : '#7dff9a'; ctx.fillText(ch, 32, 50);
    tex.needsUpdate = true; spr.visible = true; } };
}
var npcs = [], bots = [], enemies = [];
function makeNpc(name, kind, x, z, look) {
  var c = newChar(look, name, 0, '#ffe08a', false, null);
  c.g.position.set(x, 0, z);
  var mk = makeMarker(); c.g.add(mk.spr); mk.spr.position.y = 2.75;
  var n = { name: name, kind: kind, c: c, pos: c.g.position, marker: mk };
  npcs.push(n); addObstacle(x, z, 0.6); return n;
}
function populateTown(m) {
  var hub = m.hub, RR = Math.max(10, m.safeR - 4);
  function rp(i) { var an = i / 11 * TAU + 0.5; return [Math.cos(an) * RR, Math.sin(an) * RR]; }   // NPCs stand on the edge of the safe zone
  var q0 = rp(0), q1 = rp(1), q2 = rp(2), q3 = rp(3), q4 = rp(4), q5 = rp(5), q6 = rp(6), q7 = rp(7), q8 = rp(8), q9 = rp(9), q10 = rp(10);
  npcQuest = makeNpc('Elder Rowan', 'quest', q0[0], q0[1], { scale: 1, skin: 0xe0b896, shirt: 0x6a3d8a, pants: 0x3a2a4a, hair: 0xdddddd, sleeve: 0x6a3d8a, cape: 0x4a2a6a, boots: 0x2a1a10 });
  var shop = makeNpc('Merchant Mira', 'shop', q1[0], q1[1], { scale: 0.96, skin: 0xf0c0a0, shirt: 0xc0392b, pants: 0x5a3a2a, hair: 0x8a3a1a, boots: 0x3a2412 });
  var smith = makeNpc('Smith Brannock', 'upgrade', q2[0], q2[1], { scale: 1.08, bulk: 1.25, skin: 0xd0a07c, shirt: 0x5a4636, pants: 0x2a2a2a, hair: 0x3a2a1a, armor: 0x6a5a4a, pads: true, padColor: 0x6a5a4a, boots: 0x2a1a10 });
  var reb = makeNpc('Rebirth Master Aeon', 'rebirth', q3[0], q3[1], { scale: 1.06, skin: 0xe6c8a8, shirt: 0xe8d8a0, pants: 0xe8d8a0, hair: 0xffffff, cape: 0xffd54f, armor: 0xf4e8b0, pads: true, padColor: 0xffd54f, boots: 0xc8a850 });
  var tist = makeNpc('They I See Tea (TIST)', 'tist', q4[0], q4[1], { scale: 1.02, skin: 0xe8c4a0, shirt: 0x15202e, pants: 0x1a1a24, hair: 0x1adcff, sleeve: 0x15202e, cape: 0x0b6f8a, boots: 0x101018 });
  var gmN = makeNpc('The Game Master', 'gm', 0, 0, { scale: 2, skin: 0xe8c4a0, shirt: 0x1c1c28, pants: 0x14141c, hair: 0x1a1a1a, bald: true, sleeve: 0x1c1c28, cape: 0x7a1f1f, armor: 0x2a2a3a, pads: true, padColor: 0xffd54f, boots: 0x101018 });
  gmN.sit = true; gmN.my = 4.9; gmN.c.g.rotation.y = 0; addObstacle(0, 0, 1.5);   // sits on a chair in the middle of the safe zone
  (function () {   // golden crown
    var cm = stdMat(0xffd23a, { metalness: 0.8, roughness: 0.3, emissive: 0x6a4a00 }), hd = gmN.c.rig.head;
    var band = new THREE.Mesh(new THREE.BoxGeometry(0.4, 0.09, 0.4), cm); band.position.set(0, 0.385, 0); hd.add(band);
    [[-0.17, -0.17], [0.17, -0.17], [-0.17, 0.17], [0.17, 0.17], [0, 0.18], [0, -0.18], [0.18, 0], [-0.18, 0]].forEach(function (c2, i) {
      var sp = new THREE.Mesh(new THREE.BoxGeometry(0.07, i < 4 ? 0.17 : 0.11, 0.07), cm); sp.position.set(c2[0], i < 4 ? 0.51 : 0.48, c2[1]); hd.add(sp); });
    var gem = new THREE.Mesh(new THREE.BoxGeometry(0.07, 0.06, 0.03), stdMat(0xe01818, { emissive: 0x801010 })); gem.position.set(0, 0.39, 0.205); hd.add(gem);
  })();
  (function () {
    var wood = stdMat(0x5a3a22), gold = stdMat(0xd9a82a, { metalness: 0.6, roughness: 0.4 }), ch = new THREE.Group(); ch.position.set(0, 0, -0.05);
    var seat = new THREE.Mesh(new THREE.BoxGeometry(1.5, 0.14, 1.4), wood); seat.position.y = 0.89; ch.add(seat);
    [[-0.65, -0.6], [0.65, -0.6], [-0.65, 0.6], [0.65, 0.6]].forEach(function (p) { var l = new THREE.Mesh(new THREE.BoxGeometry(0.14, 0.84, 0.14), wood); l.position.set(p[0], 0.42, p[1]); ch.add(l); });
    var back = new THREE.Mesh(new THREE.BoxGeometry(1.5, 1.7, 0.16), wood); back.position.set(0, 1.85, -0.68); ch.add(back);
    var top = new THREE.Mesh(new THREE.BoxGeometry(1.7, 0.18, 0.22), gold); top.position.set(0, 2.75, -0.68); ch.add(top);
    [-1, 1].forEach(function (sx) { var ar = new THREE.Mesh(new THREE.BoxGeometry(0.14, 0.14, 1.3), gold); ar.position.set(sx * 0.82, 1.35, 0); ch.add(ar); var ap = new THREE.Mesh(new THREE.BoxGeometry(0.14, 0.46, 0.14), wood); ap.position.set(sx * 0.82, 1.1, 0.55); ch.add(ap); });
    worldGroup.add(ch);
  })();
  var craft = makeNpc('Item Craft Master Vulcan', 'craft', q6[0], q6[1], { scale: 1.08, skin: 0xd9a77c, shirt: 0xb85a1e, pants: 0x3a2a22, hair: 0x2a1a10, sleeve: 0xb85a1e, cape: 0x5a3a22, boots: 0x2a1a10, armor: 0x6a4a30 });
  var dshop = makeNpc('Diamond Merchant Jewel', 'diamond', q7[0], q7[1], { scale: 1.05, skin: 0xe0b894, shirt: 0x1aa8c8, pants: 0x1a3a5a, hair: 0xf0f0ff, sleeve: 0x1aa8c8, cape: 0x7fe8ff, boots: 0x1a2a3a });
  var petn = makeNpc('PetMaloo', 'pet', q8[0], q8[1], { scale: 1.0, skin: 0xf0c8a0, shirt: 0xff8ab0, pants: 0x6a4a9a, hair: 0xffb050, sleeve: 0xff8ab0, cape: 0xffd54f, boots: 0x5a3a22 });
  var pfood = makeNpc('Kibble Kay (Pet Food)', 'petfood', q9[0], q9[1], { scale: 1.0, skin: 0xe0b894, shirt: 0x4aa05a, pants: 0x3a3a22, hair: 0x6a3a1a, sleeve: 0x4aa05a, cape: 0xc89850, boots: 0x3a2a1a });
  var cshop = makeNpc('Costume Shop', 'costume', q10[0], q10[1], { scale: 1.0, skin: 0xf0c8a0, shirt: 0x8a2ad0, pants: 0x1a1a3a, hair: 0xe8e8e8, sleeve: 0x8a2ad0, cape: 0xffd54f, boots: 0x1a1a1a });
  var stable = makeNpc('Stable Master Garrick', 'mount', q5[0], q5[1], { scale: 1.02, skin: 0xc89870, shirt: 0x3f6a3a, pants: 0x4a3a22, hair: 0x2a1a10, sleeve: 0x3f6a3a, cape: 0x2a4a22, boots: 0x2a1a10 });
  npcs.forEach(function (n) { if (!n.sit) n.c.g.rotation.y = Math.atan2(-n.pos.x, -n.pos.z); });   // face the middle of the safe zone
}
function clearPopulation() {
  npcs.forEach(function (n) { disposeChar(n.c); }); npcs.length = 0; npcQuest = null;
  bots.forEach(function (b) { disposeChar(b.c); }); bots.length = 0;
  enemies.forEach(function (e) { disposeChar(e.c); }); enemies.length = 0;
  ais.forEach(function (a) { disposeChar(a.c); }); ais.length = 0;
}

/* animated golden aura of the Super Saiyan 3 costume */
function updateCostumeFx(dt, pvc) {
  var cc = pvc || P.c, r = cc && cc.rig; if (!r) return;
  var cw = (cc.cwEff || P.costumeWorn || {}).weapon; if (cw && cc.wMat) cc.wMat.emissiveIntensity = 0.8 + 0.5 * Math.sin(performance.now() / 150);
  if (r.ssjWings && r.ssjWings.visible) { var wt = performance.now() / 1000; r.ssjWings.userData.sides.forEach(function (sd) { sd.g.rotation.y = sd.s * (0.35 + Math.sin(wt * 2.2) * 0.12); sd.g.rotation.z = sd.s * Math.sin(wt * 2.2 + 1) * 0.04; }); }
  if (!r.aura || !r.aura.visible) return;
  var sg = r.ssjG, tt = performance.now() / 1000;
  sg.userData.sway.forEach(function (s) { s.pv.rotation.x = s.rx + Math.sin(tt * 3 + s.ph) * 0.07; s.pv.rotation.z = s.rz + Math.cos(tt * 2.4 + s.ph) * 0.05; });
  sg.userData.gold.emissiveIntensity = 0.9 + 0.5 * Math.sin(tt * 9);
  sg.userData.arcs.forEach(function (am) { am.visible = Math.random() < 0.5; if (am.visible) { am.position.set(rand(-0.7, 0.7), rand(-0.3, 1.2), rand(-0.7, 0.4)); am.rotation.set(rand(0, TAU), rand(0, TAU), rand(0, TAU)); am.scale.z = rand(0.4, 1.6); } });
  var t = performance.now() / 1000; r.aura.scale.set(1 + 0.08 * Math.sin(t * 9), 1 + 0.06 * Math.sin(t * 7), 1 + 0.08 * Math.sin(t * 9)); r.aura.material.opacity = 0.24 + 0.1 * Math.sin(t * 11); r.aura.rotation.y += dt * 2;
  if (pvc) return;
  P.ssjT = (P.ssjT || 0) - dt; if (P.ssjT <= 0) { P.ssjT = 0.12; burst({ x: P.pos.x + rand(-0.6, 0.6), y: rand(0.2, 2.2), z: P.pos.z + rand(-0.6, 0.6) }, 0xffe14a, 1, 0.5, 2.2); }
}
