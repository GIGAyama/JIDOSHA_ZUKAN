/* =========================================================================
   car3d.js — じどう車の 3Dモデル と ビューア

   ■ かんがえかた
     ・car-art.js（SVG）と おなじ「部品に なまえ（part）を つける」やりかたを
       そのまま 3Dに もちこむ。part の 名まえは car-art.js / parts-data.js と 共通。
       → つくりの 文を おすと、3Dの その部品だけが 光る（回しながら たしかめられる）
     ・1たんい ＝ 1メートル。地面は y = 0、車の まん中が x = 0。
       うしろ → まえ が +x、上が +y、右が +z。
     ・見た目は「スタジオで さつえいした ような」絵づくり
       （ACESトーンマッピング＋環境光＋やわらかい 影＋クリアコート塗装）

   ■ つかいかた
       import { createViewer, MODEL3D } from './car3d.js';
       const v = createViewer(document.querySelector('#stage'), 'truck');
       v.highlight('nidai');   // その部品だけ 光る
       v.focusPart('nidai');   // カメラが そこへ 飛ぶ
       v.clearHighlight();
   ========================================================================= */

import * as THREE from './vendor/three.module.min.js';

/* =========================================================================
   1. いろ と ざいりょう
   ========================================================================= */

const PAL = {
  tire:    0x1a1c20,
  tread:   0x101216,
  hub:     0xb9c0ca,
  steel:   0xaeb7c2,
  steelD:  0x6d7684,
  frame:   0x39404c,
  chrome:  0xdfe5ec,
  glass:   0x0e1620,
  lampY:   0xffbe2e,
  lampR:   0xe33b34,
  lampB:   0x2f6fe0,
  white:   0xeef1f5,
  black:   0x22262d,
  rubber:  0x2a2e35
};

/* ごく こまかい ムラ（塗装や 金属の 面を 均一に しない ための もの）*/
let grainTex = null;
function grain() {
  if (grainTex) return grainTex;
  const c = document.createElement('canvas');
  c.width = c.height = 256;
  const g = c.getContext('2d');
  const img = g.createImageData(256, 256);
  let seed = 20260811;
  const rnd = () => (seed = (seed * 1103515245 + 12345) & 0x7fffffff) / 0x7fffffff;
  for (let i = 0; i < img.data.length; i += 4) {
    const v = 150 + (rnd() - 0.5) * 46;
    img.data[i] = img.data[i + 1] = img.data[i + 2] = v;
    img.data[i + 3] = 255;
  }
  g.putImageData(img, 0, 0);
  grainTex = new THREE.CanvasTexture(c);
  grainTex.wrapS = grainTex.wrapT = THREE.RepeatWrapping;
  grainTex.repeat.set(9, 9);
  return grainTex;
}

/* 車の 塗装（クリアコートで つやを 出す） */
function paint(color, opt) {
  opt = opt || {};
  return new THREE.MeshPhysicalMaterial({
    color: color,
    metalness: opt.metal !== undefined ? opt.metal : 0.15,
    roughness: opt.rough !== undefined ? opt.rough : 0.3,
    roughnessMap: grain(),
    clearcoat: opt.clear !== undefined ? opt.clear : 0.85,
    clearcoatRoughness: 0.08,
    envMapIntensity: 1.05
  });
}

/* 金属（アルミ・鉄板） */
function metalMat(color, rough) {
  return new THREE.MeshPhysicalMaterial({
    color: color,
    metalness: 0.85,
    roughness: rough !== undefined ? rough : 0.35,
    roughnessMap: grain(),
    envMapIntensity: 1.2
  });
}

/* ゴム・つや消し */
function matte(color, rough) {
  return new THREE.MeshStandardMaterial({
    color: color,
    metalness: 0.0,
    roughness: rough !== undefined ? rough : 0.85,
    envMapIntensity: 0.7
  });
}

/* まど（ガラス） */
function glassMat(quality) {
  if (quality !== 'ultra') {
    return new THREE.MeshPhysicalMaterial({
      color: 0x36485e, metalness: 0.30, roughness: 0.03,
      clearcoat: 1, clearcoatRoughness: 0.02,
      transparent: true, opacity: 0.78, envMapIntensity: 4.0
    });
  }
  return new THREE.MeshPhysicalMaterial({
    color: 0x223040, metalness: 0.0, roughness: 0.04,
    transmission: 0.55, ior: 1.45, thickness: 0.06,
    clearcoat: 1, clearcoatRoughness: 0.02,
    transparent: true, opacity: 0.95, envMapIntensity: 1.5
  });
}

/* ライト（光って 見える） */
function lampMat(color, strength) {
  return new THREE.MeshStandardMaterial({
    color: color, emissive: color,
    emissiveIntensity: strength === undefined ? 1.1 : strength,
    roughness: 0.25, metalness: 0.0
  });
}

/* =========================================================================
   2. かたち を つくる 道具
   ========================================================================= */

/* かどの まるい 箱。SVGの rect(..., {rx}) の 3D版。
   w=よこ(x) h=たかさ(y) d=おくゆき(z) r=かどの まるみ b=面取り */
const geoCache = new Map();
function roundedBox(w, h, d, r, b) {
  r = Math.min(r === undefined ? 0.06 : r, w / 2 - 0.001, h / 2 - 0.001);
  b = Math.min(b === undefined ? 0.035 : b, d / 2 - 0.001, r * 0.9);
  const key = [w, h, d, r, b].map(v => Math.round(v * 1000)).join('_');
  if (geoCache.has(key)) return geoCache.get(key);

  const iw = w - 2 * b, ih = h - 2 * b, ir = Math.max(0.001, r - b);
  const s = new THREE.Shape();
  const x0 = -iw / 2, y0 = -ih / 2, x1 = iw / 2, y1 = ih / 2;
  s.moveTo(x0 + ir, y0);
  s.lineTo(x1 - ir, y0);
  s.quadraticCurveTo(x1, y0, x1, y0 + ir);
  s.lineTo(x1, y1 - ir);
  s.quadraticCurveTo(x1, y1, x1 - ir, y1);
  s.lineTo(x0 + ir, y1);
  s.quadraticCurveTo(x0, y1, x0, y1 - ir);
  s.lineTo(x0, y0 + ir);
  s.quadraticCurveTo(x0, y0, x0 + ir, y0);

  const g = new THREE.ExtrudeGeometry(s, {
    depth: Math.max(0.002, d - 2 * b),
    bevelEnabled: true, bevelSize: b, bevelThickness: b,
    bevelSegments: 2, curveSegments: 6
  });
  g.translate(0, 0, -(d / 2 - b));
  g.computeVertexNormals();
  geoCache.set(key, g);
  return g;
}

/* タイヤ（だんめんを 回して つくるので かたが まるい） */
function tireGeom(r, width) {
  const key = 'tire_' + Math.round(r * 1000) + '_' + Math.round(width * 1000);
  if (geoCache.has(key)) return geoCache.get(key);
  const hw = width / 2, sh = Math.min(0.055, width * 0.22);
  const pts = [
    new THREE.Vector2(r * 0.52, -hw),
    new THREE.Vector2(r * 0.90, -hw),
    new THREE.Vector2(r * 0.985, -hw + sh * 0.5),
    new THREE.Vector2(r, -hw + sh),
    new THREE.Vector2(r, hw - sh),
    new THREE.Vector2(r * 0.985, hw - sh * 0.5),
    new THREE.Vector2(r * 0.90, hw),
    new THREE.Vector2(r * 0.52, hw)
  ];
  const g = new THREE.LatheGeometry(pts, 40);
  g.computeVertexNormals();
  geoCache.set(key, g);
  return g;
}

/* トレッド（みぞ）の もよう を 作る テクスチャ */
let treadTex = null;
function treadTexture() {
  if (treadTex) return treadTex;
  const c = document.createElement('canvas');
  c.width = 256; c.height = 64;
  const g = c.getContext('2d');
  g.fillStyle = '#8a8a8a'; g.fillRect(0, 0, 256, 64);
  g.fillStyle = '#3a3a3a';
  for (let i = 0; i < 16; i++) {
    g.save();
    g.translate(i * 16, 0);
    g.beginPath();
    g.moveTo(2, 0); g.lineTo(9, 0); g.lineTo(6, 64); g.lineTo(-1, 64);
    g.closePath(); g.fill();
    g.restore();
  }
  g.fillStyle = '#5a5a5a';
  g.fillRect(0, 28, 256, 8);
  treadTex = new THREE.CanvasTexture(c);
  treadTex.wrapS = treadTex.wrapT = THREE.RepeatWrapping;
  treadTex.repeat.set(6, 1);
  return treadTex;
}

/* =========================================================================
   3. Builder — モデルを くみたてる ための 道具ばこ
      （car-art.js の rect() / circ() / wheel() と 同じ かんかくで つかえる）
   ========================================================================= */

class Builder {
  constructor(quality) {
    this.root = new THREE.Group();
    this.quality = quality || 'high';
    this.parts = new Map();     // part名 -> [mesh, ...]
    this.spin = [];             // ぐるぐる まわす もの
    this.anims = [];            // ボタンで うごかせる もの
  }

  /* ボタンで うごかせる しかけを 足す
     B.anim('tilt', 'にだいを かたむける', v => bed.rotation.z = -v * 0.62)
     v は 0（もとの かたち）〜 1（うごかしきった かたち） */
  anim(key, label, apply, opt) {
    const a = Object.assign({ key: key, label: label, apply: apply, value: 0 }, opt || {});
    if (a.start !== undefined) { a.value = a.start; a.target = a.start; }
    this.anims.push(a);
    apply(a.value);
    return this;
  }

  _register(mesh, part, aux) {
    mesh.castShadow = true;
    mesh.receiveShadow = true;
    if (aux) mesh.userData.aux = true;
    if (part) {
      mesh.userData.part = part;
      if (!this.parts.has(part)) this.parts.set(part, []);
      this.parts.get(part).push(mesh);
    }
    return mesh;
  }

  /* 箱。x,y,z は まん中の いち（yは 地面からの たかさ） */
  box(o) {
    const m = new THREE.Mesh(
      roundedBox(o.w, o.h, o.d, o.r, o.b),
      o.mat || paint(o.color === undefined ? PAL.steel : o.color, o)
    );
    m.position.set(o.x || 0, o.y || 0, o.z || 0);
    if (o.rz) m.rotation.z = o.rz;
    if (o.ry) m.rotation.y = o.ry;
    if (o.rx) m.rotation.x = o.rx;
    (o.parent || this.root).add(m);
    return this._register(m, o.part, o.aux);
  }

  /* つつ（円柱）。axis: 'x' | 'y' | 'z' */
  cyl(o) {
    const g = new THREE.CylinderGeometry(
      o.r, o.r2 === undefined ? o.r : o.r2, o.h, o.seg || 24, 1, !!o.open
    );
    const m = new THREE.Mesh(g, o.mat || paint(o.color === undefined ? PAL.steel : o.color, o));
    if (o.axis === 'x') m.rotation.z = Math.PI / 2;
    else if (o.axis === 'z') m.rotation.x = Math.PI / 2;
    m.position.set(o.x || 0, o.y || 0, o.z || 0);
    if (o.tilt) m.rotateZ(o.tilt);
    (o.parent || this.root).add(m);
    return this._register(m, o.part, o.aux);
  }

  /* タイヤ（左右 セット。z を 指定すると 片がわだけ） */
  wheel(o) {
    const r = o.r, w = o.w === undefined ? r * 0.62 : o.w;
    const part = o.part || 'tire';
    const zs = o.z !== undefined ? [o.z] : [o.spread, -o.spread];
    const made = [];
    zs.forEach(z => {
      const g = new THREE.Group();
      g.position.set(o.x, r + (o.lift || 0), z);
      const tire = new THREE.Mesh(tireGeom(r, w), o.mat || (() => {
        const mm = matte(PAL.tire, 0.72);
        mm.map = treadTexture();
        mm.roughnessMap = treadTexture();
        return mm;
      })());
      tire.rotation.x = Math.PI / 2;
      g.add(this._register(tire, part));

      /* ホイール（ハブ） */
      const hubSide = z >= 0 ? 1 : -1;
      const hub = new THREE.Mesh(
        new THREE.CylinderGeometry(r * 0.55, r * 0.55, w * 0.42, 28),
        metalMat(PAL.hub, 0.28)
      );
      hub.rotation.x = Math.PI / 2;
      hub.position.z = hubSide * w * 0.30;
      g.add(this._register(hub, part));

      /* ボルト */
      for (let i = 0; i < 8; i++) {
        const a = (i / 8) * Math.PI * 2;
        const b = new THREE.Mesh(
          new THREE.CylinderGeometry(r * 0.045, r * 0.045, w * 0.12, 6),
          metalMat(0x8b939e, 0.4)
        );
        b.rotation.x = Math.PI / 2;
        b.position.set(Math.cos(a) * r * 0.33, Math.sin(a) * r * 0.33, hubSide * w * 0.47);
        g.add(this._register(b, part));
      }
      /* まん中の キャップ */
      const cap = new THREE.Mesh(
        new THREE.SphereGeometry(r * 0.16, 16, 12, 0, Math.PI * 2, 0, Math.PI / 2),
        metalMat(PAL.chrome, 0.2)
      );
      cap.rotation.x = hubSide * Math.PI / 2;
      cap.position.z = hubSide * w * 0.50;
      g.add(this._register(cap, part));

      (o.parent || this.root).add(g);
      made.push(g);
    });
    return made;
  }

  /* まど */
  glass(o) {
    const mat = o.mat || glassMat(this.quality);
    const m = new THREE.Mesh(roundedBox(o.w, o.h, o.d, o.r === undefined ? 0.08 : o.r, 0.02), mat);
    m.position.set(o.x || 0, o.y || 0, o.z || 0);
    if (o.rz) m.rotation.z = o.rz;
    if (o.ry) m.rotation.y = o.ry;
    (o.parent || this.root).add(m);
    m.castShadow = false;
    const reg = this._register(m, o.part || 'window');
    reg.castShadow = false;
    return reg;
  }

  /* ライト */
  lamp(o) {
    const m = new THREE.Mesh(
      roundedBox(o.w || 0.12, o.h || 0.16, o.d || 0.22, 0.05, 0.02),
      lampMat(o.color === undefined ? PAL.lampY : o.color, o.strength)
    );
    m.position.set(o.x, o.y, o.z);
    (o.parent || this.root).add(m);
    m.castShadow = false;
    const reg = this._register(m, o.part);
    reg.castShadow = false;
    return reg;
  }

  group(part) {
    const g = new THREE.Group();
    if (part) g.userData.partGroup = part;
    this.root.add(g);
    return g;
  }
}

/* =========================================================================
   4. 「スタジオ」の 光 — 写真スタジオの ような 環境光を つくる
      （まわりに 白い かべと ライトを おいた 部屋を つくり、それを
        うつしこみ用の 画像に 焼きこむ。金属や 塗装の つやが 本物っぽく なる）
   ========================================================================= */

function studioEnvironment(renderer) {
  const scene = new THREE.Scene();
  const box = new THREE.BoxGeometry(1, 1, 1);
  box.deleteAttribute('uv');

  const add = (color, intensity, x, y, z, sx, sy, sz) => {
    const m = new THREE.MeshStandardMaterial({
      color: 0x000000, emissive: color, emissiveIntensity: intensity, side: THREE.BackSide
    });
    const mesh = new THREE.Mesh(box, m);
    mesh.position.set(x, y, z);
    mesh.scale.set(sx, sy, sz);
    scene.add(mesh);
  };
  const panel = (color, intensity, x, y, z, sx, sy, sz, rx, ry) => {
    const m = new THREE.MeshStandardMaterial({
      color: 0x000000, emissive: color, emissiveIntensity: intensity
    });
    const mesh = new THREE.Mesh(box, m);
    mesh.position.set(x, y, z);
    mesh.scale.set(sx, sy, sz);
    if (rx) mesh.rotation.x = rx;
    if (ry) mesh.rotation.y = ry;
    scene.add(mesh);
  };

  /* 部屋（上は 明るく、下は くらい） */
  add(0x9fb2c8, 0.85, 0, 0, 0, 30, 22, 30);
  /* 天じょうの 大きな ソフトボックス（主役の 光） */
  panel(0xffffff, 11.0, 1.2, 9.6, -0.8, 9, 0.3, 7);
  /* ほそながい ライン照明 — つやのある 面に すじの ように うつりこむ */
  panel(0xffffff, 16.0, -3.0, 8.6, 4.5, 13, 0.25, 0.8);
  panel(0xffffff, 12.0, 3.5, 8.2, -5.0, 11, 0.25, 0.7);
  /* 横からの 補助光 */
  panel(0xeaf2ff, 3.2, -10, 4.6, 3.0, 0.3, 7, 9);
  panel(0xd6e4f5, 1.6, 10, 4.6, -3.0, 0.3, 7, 9);
  panel(0xffffff, 2.2, 0, 3.6, 12, 12, 7, 0.3);
  /* 床の おきかえし（よわめ） */
  panel(0xb9c4d2, 0.45, 0, -0.2, 0, 26, 0.3, 26);
  /* くらい かべ（コントラストを つける） */
  panel(0x141a24, 0.0, -4, 3.0, -12, 14, 8, 0.3);

  const pmrem = new THREE.PMREMGenerator(renderer);
  const rt = pmrem.fromScene(scene, 0.04);
  pmrem.dispose();
  scene.traverse(o => { if (o.isMesh) o.material.dispose(); });
  box.dispose();
  return rt.texture;
}

/* 背景（上が すこし 濃い グラデーション） */
function backdropTexture() {
  const c = document.createElement('canvas');
  c.width = 8; c.height = 256;
  const g = c.getContext('2d');
  const grd = g.createLinearGradient(0, 0, 0, 256);
  grd.addColorStop(0, '#b9cbe0');
  grd.addColorStop(0.5, '#dde6f1');
  grd.addColorStop(1, '#c2cddb');
  g.fillStyle = grd; g.fillRect(0, 0, 8, 256);
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  return t;
}

/* くらい 部屋（ものすごい かんさつ 用） */
function darkBackdropTexture() {
  const c = document.createElement('canvas');
  c.width = 8; c.height = 256;
  const g = c.getContext('2d');
  const grd = g.createLinearGradient(0, 0, 0, 256);
  grd.addColorStop(0, '#0b1220');
  grd.addColorStop(0.55, '#16233a');
  grd.addColorStop(1, '#24395c');
  g.fillStyle = grd; g.fillRect(0, 0, 8, 256);
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  return t;
}

/* 車の 下の やわらかい 影（接地感を 出す） */
function contactShadow(w, d) {
  const c = document.createElement('canvas');
  c.width = c.height = 256;
  const g = c.getContext('2d');
  const grd = g.createRadialGradient(128, 128, 6, 128, 128, 126);
  grd.addColorStop(0, 'rgba(18,26,40,0.62)');
  grd.addColorStop(0.45, 'rgba(24,32,46,0.26)');
  grd.addColorStop(1, 'rgba(24,32,46,0)');
  g.fillStyle = grd; g.fillRect(0, 0, 256, 256);
  const t = new THREE.CanvasTexture(c);
  const m = new THREE.Mesh(
    new THREE.PlaneGeometry(w, d),
    new THREE.MeshBasicMaterial({ map: t, transparent: true, depthWrite: false })
  );
  m.rotation.x = -Math.PI / 2;
  m.position.y = 0.006;
  m.renderOrder = -1;
  return m;
}

/* =========================================================================
   5. ゆびで まわす しくみ（子ども向けに 動きを 制限して ある）
   ========================================================================= */

class Orbit {
  constructor(camera, dom, target) {
    this.cam = camera;
    this.dom = dom;
    this.target = target.clone();
    this.az = -0.62;          // よこの 角度
    this.pl = 1.24;           // たての 角度（0=真上）
    this.dist = 16;
    this.minDist = 4; this.maxDist = 40;
    this.minPl = 0.22; this.maxPl = 1.52;   // 地面より 下には もぐらない
    this.tAz = this.az; this.tPl = this.pl; this.tDist = this.dist;
    this.tTarget = this.target.clone();
    this.autoRotate = true;
    this.autoSpeed = 0.13;
    this.idle = 0;
    this.enabled = true;
    this._bind();
  }

  _bind() {
    const d = this.dom;
    let ptrs = new Map(), lastDist = 0, mode = null;
    const pos = e => ({ x: e.clientX, y: e.clientY });

    const down = e => {
      if (!this.enabled) return;
      d.setPointerCapture && d.setPointerCapture(e.pointerId);
      ptrs.set(e.pointerId, pos(e));
      mode = ptrs.size >= 2 ? 'zoom' : 'rot';
      if (mode === 'zoom') lastDist = this._pinch(ptrs);
      this.idle = 0; this.autoRotate = false;
    };
    const move = e => {
      if (!ptrs.has(e.pointerId)) return;
      const prev = ptrs.get(e.pointerId);
      const cur = pos(e);
      ptrs.set(e.pointerId, cur);
      if (ptrs.size >= 2) {
        const nd = this._pinch(ptrs);
        if (lastDist) this.tDist = this._clampD(this.tDist * (lastDist / nd));
        lastDist = nd;
      } else {
        this.tAz -= (cur.x - prev.x) * 0.0072;
        this.tPl -= (cur.y - prev.y) * 0.0055;
        this.tPl = Math.max(this.minPl, Math.min(this.maxPl, this.tPl));
      }
      this.idle = 0;
      e.preventDefault();
    };
    const up = e => {
      ptrs.delete(e.pointerId);
      if (ptrs.size < 2) lastDist = 0;
      if (!ptrs.size) mode = null;
    };
    d.addEventListener('pointerdown', down);
    d.addEventListener('pointermove', move, { passive: false });
    d.addEventListener('pointerup', up);
    d.addEventListener('pointercancel', up);
    d.addEventListener('pointerleave', up);
    d.addEventListener('wheel', e => {
      if (!this.enabled) return;
      this.tDist = this._clampD(this.tDist * (1 + Math.sign(e.deltaY) * 0.12));
      this.idle = 0; this.autoRotate = false;
      e.preventDefault();
    }, { passive: false });
  }

  _pinch(ptrs) {
    const v = [...ptrs.values()];
    return Math.hypot(v[0].x - v[1].x, v[0].y - v[1].y);
  }
  _clampD(v) { return Math.max(this.minDist, Math.min(this.maxDist, v)); }

  setView(az, pl, dist, target) {
    if (az !== null && az !== undefined) this.tAz = az;
    if (pl !== null && pl !== undefined) this.tPl = Math.max(this.minPl, Math.min(this.maxPl, pl));
    if (dist !== null && dist !== undefined) this.tDist = this._clampD(dist);
    if (target) this.tTarget.copy(target);
    this.autoRotate = false; this.idle = 0;
  }
  snap() {
    this.az = this.tAz; this.pl = this.tPl; this.dist = this.tDist;
    this.target.copy(this.tTarget);
    this.update(0);
  }

  update(dt) {
    this.idle += dt;
    if (this.idle > 6) this.autoRotate = true;
    if (this.autoRotate) this.tAz += this.autoSpeed * dt;

    const k = 1 - Math.pow(0.0022, dt);   // なめらかに 追いつく
    this.az += (this.tAz - this.az) * k;
    this.pl += (this.tPl - this.pl) * k;
    this.dist += (this.tDist - this.dist) * k;
    this.target.lerp(this.tTarget, k);

    const sp = Math.sin(this.pl), cp = Math.cos(this.pl);
    this.cam.position.set(
      this.target.x + this.dist * sp * Math.sin(this.az),
      this.target.y + this.dist * cp,
      this.target.z + this.dist * sp * Math.cos(this.az)
    );
    this.cam.lookAt(this.target);
  }
}

/* =========================================================================
   6. ビューア
   ========================================================================= */

const MODEL3D = {};

/* 1年生（およそ 1.2メートル）— 大きさを くらべる ための 人形 */
function kidFigure() {
  const g = new THREE.Group();
  const skin = matte(0xf0c9a4, 0.75);
  const cloth = matte(0x4d7ea8, 0.85);
  const cloth2 = matte(0x2f3d52, 0.85);
  const mk = (geo, mat, x, y, z) => {
    const m = new THREE.Mesh(geo, mat);
    m.position.set(x, y, z); m.castShadow = true; g.add(m); return m;
  };
  mk(new THREE.SphereGeometry(0.105, 20, 16), skin, 0, 1.09, 0);
  mk(new THREE.SphereGeometry(0.112, 20, 16, 0, Math.PI * 2, 0, Math.PI * 0.62), matte(0x3a2a22, 0.9), 0, 1.10, 0);
  mk(new THREE.CapsuleGeometry(0.088, 0.30, 6, 14), cloth, 0, 0.79, 0);
  mk(new THREE.CapsuleGeometry(0.030, 0.24, 5, 10), skin, 0.115, 0.80, 0);
  mk(new THREE.CapsuleGeometry(0.030, 0.24, 5, 10), skin, -0.115, 0.80, 0);
  mk(new THREE.CapsuleGeometry(0.040, 0.34, 5, 10), cloth2, 0.055, 0.34, 0);
  mk(new THREE.CapsuleGeometry(0.040, 0.34, 5, 10), cloth2, -0.055, 0.34, 0);
  mk(new THREE.BoxGeometry(0.09, 0.05, 0.17), matte(0x22262d, 0.8), 0.055, 0.03, 0.02);
  mk(new THREE.BoxGeometry(0.09, 0.05, 0.17), matte(0x22262d, 0.8), -0.055, 0.03, 0.02);
  g.visible = false;
  return g;
}

/* 1メートルの ますめ（ものさし） */
function meterGrid(size) {
  const g = new THREE.GridHelper(size, size, 0x8899ad, 0xc3ccd8);
  g.material.transparent = true;
  g.material.opacity = 0.5;
  g.position.y = 0.004;
  g.visible = false;
  return g;
}

function createViewer(container, artKey, options) {
  options = Object.assign({
    quality: 'high',
    background: true,
    autoRotate: true,
    pixelRatioCap: 2
  }, options || {});

  const def = MODEL3D[artKey];
  if (!def) throw new Error('3Dモデルが ありません: ' + artKey);

  /* --- レンダラ --- */
  const renderer = new THREE.WebGLRenderer({
    antialias: true, alpha: !options.background, powerPreference: 'high-performance'
  });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, options.pixelRatioCap));
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 0.85;
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  renderer.domElement.style.cssText = 'display:block;width:100%;height:100%;touch-action:none;';
  container.appendChild(renderer.domElement);

  const scene = new THREE.Scene();
  if (options.background) scene.background = backdropTexture();
  scene.environment = studioEnvironment(renderer);
  scene.environmentIntensity = 0.62;

  /* --- モデル --- */
  const B = new Builder(options.quality);
  def.build(B);
  const car = B.root;
  scene.add(car);

  /* 大きさを はかる */
  const bbox = new THREE.Box3();
  car.updateMatrixWorld(true);
  car.traverse(o => { if (o.isMesh && !o.userData.aux) bbox.expandByObject(o); });
  const size = bbox.getSize(new THREE.Vector3());
  const center = bbox.getCenter(new THREE.Vector3());
  const span = Math.max(size.x, size.z, size.y * 1.6);

  /* --- 地面・影 --- */
  const gc = document.createElement('canvas');
  gc.width = gc.height = 256;
  {
    const g2 = gc.getContext('2d');
    const grd = g2.createRadialGradient(128, 128, 20, 128, 128, 128);
    grd.addColorStop(0, '#bcc7d5');
    grd.addColorStop(0.55, '#a8b5c6');
    grd.addColorStop(1, '#8593a6');
    g2.fillStyle = grd; g2.fillRect(0, 0, 256, 256);
  }
  const groundTex = new THREE.CanvasTexture(gc);
  groundTex.colorSpace = THREE.SRGBColorSpace;
  const ground = new THREE.Mesh(
    new THREE.CircleGeometry(Math.max(20, span * 2.2), 64),
    new THREE.MeshStandardMaterial({ map: groundTex, color: 0xffffff, roughness: 0.9, metalness: 0.0, envMapIntensity: 0.28 })
  );
  ground.rotation.x = -Math.PI / 2;
  ground.receiveShadow = true;
  scene.add(ground);
  scene.add(contactShadow(size.x * 1.45, size.z * 2.0));

  const grid = meterGrid(Math.ceil(Math.max(16, span * 1.6)));
  scene.add(grid);
  const kid = kidFigure();
  kid.position.set(-size.x / 2 - 0.95, 0, size.z / 2 + 0.15);
  scene.add(kid);

  /* --- 光 --- */
  const key = new THREE.DirectionalLight(0xfff4e2, 3.0);
  key.position.set(span * 0.82, span * 0.72, span * 0.18);
  key.castShadow = true;
  key.shadow.mapSize.set(2048, 2048);
  key.shadow.bias = -0.0008;
  key.shadow.radius = 3;
  key.shadow.normalBias = 0.02;
  const sc = key.shadow.camera;
  const r = span * 0.95;
  sc.left = -r; sc.right = r; sc.top = r; sc.bottom = -r;
  sc.near = 0.5; sc.far = span * 4;
  sc.updateProjectionMatrix();
  scene.add(key);
  const fill = new THREE.DirectionalLight(0xdfeaf8, 0.48);
  fill.position.set(-span * 0.85, span * 0.40, span * 0.60);   /* 見ている がわを 明るく */
  scene.add(fill);
  const rim = new THREE.DirectionalLight(0xffffff, 0.30);
  rim.position.set(span * 0.9, span * 0.28, span * 0.35);
  scene.add(rim);
  const hemi = new THREE.HemisphereLight(0xdfeaf7, 0.6);
  hemi.intensity = 0.10;
  scene.add(hemi);

  /* --- カメラ --- */
  const FOV = 30;
  const camera = new THREE.PerspectiveCamera(FOV, 1, 0.1, span * 14);
  const home = new THREE.Vector3(center.x, Math.max(size.y * 0.42, 0.9), 0);
  /* 車ぜんたいが きちんと 画面に おさまる きょり */
  function fitDistance(aspect) {
    const vf = 2 * Math.tan(THREE.MathUtils.degToRad(FOV) / 2);
    const hf = vf * Math.max(0.9, aspect || 1.5);
    const rad = Math.hypot(size.x, size.z) * 0.5;
    return Math.max((size.y * 1.05) / vf, (rad * 2) / hf) * 1.32 + rad * 0.35;
  }
  const orbit = new Orbit(camera, renderer.domElement, home);
  orbit.homeDist = fitDistance(1.5);
  orbit.tDist = orbit.dist = orbit.homeDist;
  orbit.minDist = span * 0.25;
  orbit.maxDist = span * 3.2;
  orbit.autoRotate = options.autoRotate;
  orbit.snap();

  /* --- 部位ハイライトの ため 元の いろを おぼえておく --- */
  const meshes = [];
  car.traverse(o => {
    if (!o.isMesh) return;
    if (Array.isArray(o.material)) o.material = o.material[0];
    o.material = o.material.clone();
    o.userData.baseColor = o.material.color.clone();
    o.userData.baseEmissive = o.material.emissive ? o.material.emissive.clone() : new THREE.Color(0);
    o.userData.baseEmissiveI = o.material.emissiveIntensity || 0;
    o.userData.baseEnv = o.material.envMapIntensity === undefined ? 1 : o.material.envMapIntensity;
    meshes.push(o);
  });

  const DIM = new THREE.Color(0x0d1522);
  let litPart = null, pulse = 0, dark = false;

  function applyHighlight() {
    meshes.forEach(o => {
      const m = o.material;
      const on = !litPart || o.userData.part === litPart;
      if (on) {
        m.color.copy(o.userData.baseColor);
        m.envMapIntensity = o.userData.baseEnv;
        if (m.emissive) {
          if (litPart && o.userData.part === litPart) {
            m.emissive.setHex(0xffc23d);
            m.emissiveIntensity = 0.30 + Math.sin(pulse * 3.0) * 0.11;
          } else {
            m.emissive.copy(o.userData.baseEmissive);
            m.emissiveIntensity = o.userData.baseEmissiveI;
          }
        }
      } else {
        m.color.copy(o.userData.baseColor).lerp(DIM, 0.62);
        m.envMapIntensity = o.userData.baseEnv * 0.3;
        if (m.emissive) {
          m.emissive.copy(o.userData.baseEmissive);
          m.emissiveIntensity = o.userData.baseEmissiveI * 0.15;
        }
      }
    });
    hemi.intensity = (litPart ? 0.04 : 0.10) * (dark ? 0.5 : 1);
    key.intensity = litPart ? 1.3 : 3.0;
    scene.environmentIntensity = (litPart ? 0.22 : 0.62) * (dark ? 0.62 : 1);
    ground.material.color.setHex(dark
      ? (litPart ? 0x2f3a4d : 0x44526b)
      : (litPart ? 0x8d99a8 : 0xffffff));
  }

  function partCenter(part) {
    const list = B.parts.get(part);
    if (!list || !list.length) return null;
    car.updateMatrixWorld(true);
    const b = new THREE.Box3();
    list.forEach(m => b.expandByObject(m));
    return { center: b.getCenter(new THREE.Vector3()), box: b };
  }

  applyHighlight();

  /* --- ループ --- */
  let raf = 0, last = performance.now(), running = true, spinT = 0;
  const clockScale = { drum: 1 };

  function resize() {
    const w = container.clientWidth || 640;
    const h = container.clientHeight || 400;
    renderer.setSize(w, h, false);
    camera.aspect = w / h;
    camera.updateProjectionMatrix();
    const nd = fitDistance(camera.aspect);
    if (Math.abs(nd - orbit.homeDist) > 0.01) {
      const wasHome = Math.abs(orbit.tDist - orbit.homeDist) < 0.02;
      orbit.homeDist = nd;
      if (wasHome) { orbit.tDist = nd; orbit.dist = nd; }
    }
  }
  const ro = new ResizeObserver(resize);
  ro.observe(container);
  resize();

  function frame(now) {
    raf = requestAnimationFrame(frame);
    const dt = Math.min(0.05, (now - last) / 1000);
    last = now;
    if (!running) return;
    spinT += dt;
    pulse += dt;
    B.spin.forEach(s => { s.obj.rotation[s.axis || 'y'] += s.speed * dt; });
    B.anims.forEach(a => {
      const t = a.target === undefined ? 0 : a.target;
      if (Math.abs(a.value - t) < 0.0015) { if (a.value !== t) { a.value = t; a.apply(t); } return; }
      a.value += (t - a.value) * (1 - Math.pow(0.02, dt));
      a.apply(a.value);
    });
    if (litPart) applyHighlight();
    orbit.update(dt);
    renderer.render(scene, camera);
    if (onFrame) onFrame(camera, renderer.domElement);
  }
  let onFrame = null;
  raf = requestAnimationFrame(frame);

  /* --- 外に 出す API --- */
  const api = {
    THREE, scene, camera, renderer, orbit, car, builder: B,
    size, center, span,

    parts: () => [...B.parts.keys()],

    highlight(part) {
      litPart = B.parts.has(part) ? part : null;
      applyHighlight();
      return !!litPart;
    },
    clearHighlight() { litPart = null; applyHighlight(); },

    /* その部品が よく 見える 角度へ カメラを 動かす */
    focusPart(part, opts) {
      const pc = partCenter(part);
      if (!pc) return false;
      const s = pc.box.getSize(new THREE.Vector3());
      /* ちかづきすぎない・とおすぎない ように 上下を おさえる */
      const dist = THREE.MathUtils.clamp(
        Math.max(s.x, s.y, s.z) * 2.3, orbit.homeDist * 0.42, orbit.homeDist * 0.92);
      const dir = pc.center.clone().sub(new THREE.Vector3(center.x, center.y, 0));
      let az = Math.atan2(dir.x, dir.z || 0.001);
      if (Math.abs(dir.z) < 0.3) az = dir.x >= 0 ? 0.85 : -0.85;
      /* ふきだしが 下に 出るので、その ぶぶんが 画面の 上がわに 来るように する */
      const tgt = pc.center.clone();
      tgt.y -= dist * 0.17;
      /* 地面ちかくの ぶぶんでも 車ぜんたいが 画面に のこる ように */
      tgt.y = Math.max(tgt.y, size.y * 0.22);
      orbit.setView(az, (opts && opts.pl) || 1.16, dist, tgt);
      return true;
    },

    resetView() {
      orbit.setView(-0.62, 1.24, orbit.homeDist, home);
    },
    setView(az, pl, dist) { orbit.setView(az, pl, dist === undefined ? null : dist); },

    /* 画面の どこに その部品が あるか（①②③の 印を 出すため） */
    screenPos(part) {
      const pc = partCenter(part);
      if (!pc) return null;
      /* えがく 前でも 正しく 計算できる ように、行列を ここで そろえる */
      camera.updateMatrixWorld();
      camera.matrixWorldInverse.copy(camera.matrixWorld).invert();
      const v = pc.center.clone().project(camera);
      const el = renderer.domElement;
      return {
        x: (v.x * 0.5 + 0.5) * el.clientWidth,
        y: (-v.y * 0.5 + 0.5) * el.clientHeight,
        visible: v.z < 1
      };
    },

    /* 画面を さわった ところの 部品名 */
    pick(clientX, clientY) {
      const el = renderer.domElement;
      const rect = el.getBoundingClientRect();
      const ndc = new THREE.Vector2(
        ((clientX - rect.left) / rect.width) * 2 - 1,
        -((clientY - rect.top) / rect.height) * 2 + 1
      );
      camera.updateMatrixWorld();
      camera.matrixWorldInverse.copy(camera.matrixWorld).invert();
      const rc = new THREE.Raycaster();
      rc.setFromCamera(ndc, camera);
      const hits = rc.intersectObject(car, true);
      for (const h of hits) if (h.object.userData.part) return h.object.userData.part;
      return null;
    },

    /* うごかせる しかけの 一らん → [{key, label, value}] */
    animations() { return B.anims.filter(a => !a.hidden && a.label).map(a => ({ key: a.key, label: a.label, value: a.target === undefined ? a.value : a.target })); },

    /* うごかす。v は 0〜1。なめらかに うごく */
    setAnim(key, v) {
      const a = B.anims.find(x => x.key === key);
      if (!a) return false;
      a.target = THREE.MathUtils.clamp(v, 0, 1);
      return true;
    },
    toggleAnim(key) {
      const a = B.anims.find(x => x.key === key);
      if (!a) return false;
      a.target = (a.target === undefined ? a.value : a.target) > 0.5 ? 0 : 1;
      return a.target > 0.5;
    },

    /* 'studio'（あかるい スタジオ）／'dark'（くらい 部屋に ライト）*/
    setTheme(name) {
      dark = (name === 'dark');
      scene.background = dark ? darkBackdropTexture() : backdropTexture();
      ground.material.envMapIntensity = dark ? 0.12 : 0.28;
      renderer.toneMappingExposure = dark ? 0.80 : 0.85;
      applyHighlight();
    },

    showRuler(on) { grid.visible = !!on; kid.visible = !!on; },
    setAutoRotate(on) { orbit.autoRotate = !!on; orbit.idle = 0; },
    onFrame(fn) { onFrame = fn; },
    pause() { running = false; },
    resume() { running = true; last = performance.now(); },

    /* 何メートル か（説明文に つかえる）
       モデルに size（走行の ときの 大きさ）が あれば そちらを つかう */
    meters() {
      const d = def.size || {};
      return {
        length: d.length || size.x,
        height: d.height || size.y,
        width: d.width || size.z
      };
    },

    dispose() {
      cancelAnimationFrame(raf);
      ro.disconnect();
      scene.traverse(o => {
        if (o.isMesh) { o.geometry.dispose && o.geometry.dispose(); o.material.dispose && o.material.dispose(); }
      });
      renderer.dispose();
      renderer.domElement.remove();
      geoCache.clear();
    }
  };
  return api;
}

/* =========================================================================
   7. モデルを 足す ための 追加の 道具
   ========================================================================= */

/* すきな かたち（LatheやTubeなど）を そのまま おく */
Builder.prototype.mesh = function (geo, mat, o) {
  o = o || {};
  const m = new THREE.Mesh(geo, mat);
  m.position.set(o.x || 0, o.y || 0, o.z || 0);
  if (o.rx) m.rotation.x = o.rx;
  if (o.ry) m.rotation.y = o.ry;
  if (o.rz) m.rotation.z = o.rz;
  (o.parent || this.root).add(m);
  return this._register(m, o.part);
};

/* うすい すじ（とびらの あわせめ・ラインなど） */
Builder.prototype.seam = function (o) {
  return this.box(Object.assign({ h: 0.035, d: 0.02, r: 0.01, b: 0.008 }, o, {
    mat: o.mat || matte(o.color === undefined ? 0x3a4250 : o.color, 0.6)
  }));
};

/* トラック系の うんてんせき（キャブ）を まとめて つくる */
function truckCab(B, o) {
  const cx = o.x, len = o.len, W = o.w, top = o.top, floor = o.floor, col = o.color;
  const hc = top - floor;
  const body = B.box({
    x: cx, y: (top + floor) / 2, z: 0, w: len, h: hc, d: W,
    r: 0.22, b: 0.055, color: col, part: 'cab', rough: 0.26
  });

  /* まえまど（すこし ねかせる） */
  const wsH = hc * 0.44;
  B.glass({
    x: cx + len / 2 - 0.10, y: top - wsH * 0.62, z: 0,
    w: 0.10, h: wsH, d: W - 0.30, r: 0.08, rz: -0.13, part: 'window'
  });
  /* よこまど */
  [1, -1].forEach(s => {
    B.glass({
      x: cx - len * 0.16, y: top - wsH * 0.60, z: s * (W / 2 - 0.045),
      w: len * 0.44, h: wsH * 0.80, d: 0.08, r: 0.07, part: 'window'
    });
  });
  /* とびら の あわせめ */
  [1, -1].forEach(s => {
    B.seam({ x: cx - len * 0.02, y: (top + floor) / 2 - 0.1, z: s * (W / 2 + 0.005), w: 0.028, h: hc * 0.74, d: 0.03, part: 'door' });
    B.seam({ x: cx - len * 0.42, y: (top + floor) / 2 - 0.1, z: s * (W / 2 + 0.005), w: 0.028, h: hc * 0.74, d: 0.03, part: 'door' });
    /* ドアハンドル */
    B.box({ x: cx - len * 0.16, y: top - wsH - 0.14, z: s * (W / 2 + 0.03), w: 0.24, h: 0.05, d: 0.05, r: 0.02, mat: metalMat(PAL.chrome, 0.22) });
    /* ステップ */
    B.box({ x: cx - len * 0.20, y: floor - 0.28, z: s * (W / 2 - 0.16), w: 0.55, h: 0.06, d: 0.30, r: 0.02, mat: matte(PAL.frame, 0.7), part: 'step' });
    B.box({ x: cx - len * 0.20, y: floor - 0.62, z: s * (W / 2 - 0.16), w: 0.55, h: 0.06, d: 0.30, r: 0.02, mat: matte(PAL.frame, 0.7), part: 'step' });
    /* ミラー */
    B.cyl({ x: cx + len * 0.30, y: top - 0.30, z: s * (W / 2 + 0.16), r: 0.022, h: 0.34, axis: 'z', mat: metalMat(0x9aa3ae, 0.4), aux: true });
    B.box({ x: cx + len * 0.30, y: top - 0.52, z: s * (W / 2 + 0.30), w: 0.10, h: 0.46, d: 0.16, r: 0.04, mat: matte(0x2a2f38, 0.5), aux: true });
  });
  /* グリル */
  B.box({ x: cx + len / 2 + 0.012, y: floor + hc * 0.24, z: 0, w: 0.05, h: hc * 0.30, d: W * 0.72, r: 0.05, mat: matte(0x1e232b, 0.45) });
  for (let i = 0; i < 4; i++) {
    B.box({ x: cx + len / 2 + 0.03, y: floor + hc * 0.14 + i * hc * 0.068, z: 0, w: 0.03, h: 0.030, d: W * 0.68, r: 0.012, mat: metalMat(PAL.chrome, 0.2) });
  }
  /* バンパー */
  B.box({ x: cx + len / 2 - 0.02, y: floor - 0.16, z: 0, w: 0.30, h: 0.34, d: W + 0.04, r: 0.09, mat: matte(0x38404d, 0.55) });
  /* ヘッドライト */
  [1, -1].forEach(s => {
    B.lamp({ x: cx + len / 2 + 0.03, y: floor + 0.12, z: s * (W / 2 - 0.30), w: 0.06, h: 0.20, d: 0.34, color: 0xfff2cf, strength: 1.4, part: 'lamp' });
    B.lamp({ x: cx + len / 2 + 0.035, y: floor - 0.02, z: s * (W / 2 - 0.30), w: 0.05, h: 0.09, d: 0.22, color: PAL.lampY, strength: 1.1, part: 'lamp' });
  });
  /* 車の うえの ひさし */
  if (o.deflector) {
    B.box({ x: cx + len * 0.06, y: top + 0.16, z: 0, w: len * 0.80, h: 0.30, d: W - 0.10, r: 0.12, color: col, rough: 0.24 });
  }
  return body;
}

/* シャシー（フレーム）と 燃料タンク */
function chassis(B, o) {
  [1, -1].forEach(s => {
    B.box({
      x: o.x, y: o.y, z: s * (o.spread || 0.42), w: o.len, h: 0.26, d: 0.14,
      r: 0.03, mat: matte(PAL.frame, 0.62)
    });
  });
  if (o.tank) {
    B.cyl({ x: o.tank.x, y: o.y - 0.12, z: o.tank.z, r: 0.30, h: 1.25, axis: 'x', seg: 22, mat: metalMat(0xc9d1da, 0.22), part: 'tank' });
  }
}

/* ---------------- キャタピラ（クローラ）----------------
   まわりに でっぱり（グローサ）の ついた わっかを 1まいの かたちで つくる。
   ほった 土に しずまない ように「ひろい めんで ささえる」ことが 見て わかる。 */
function trackShape(len, r, tooth) {
  const a = Math.max(0.05, len / 2 - r);
  const pts = [];
  let i = 0;
  const push = (px, py, nx, ny) => {
    const g = (i++ % 4 < 2) ? tooth : 0;
    pts.push(new THREE.Vector2(px + nx * g, py + ny * g));
  };
  const N = 18, M = 26;
  for (let k = 0; k <= N; k++) push(-a + 2 * a * (k / N), r, 0, 1);
  for (let k = 1; k < M; k++) {
    const ang = Math.PI / 2 - Math.PI * k / M;
    push(a + Math.cos(ang) * r, Math.sin(ang) * r, Math.cos(ang), Math.sin(ang));
  }
  for (let k = 0; k <= N; k++) push(a - 2 * a * (k / N), -r, 0, -1);
  for (let k = 1; k < M; k++) {
    const ang = -Math.PI / 2 - Math.PI * k / M;
    push(-a + Math.cos(ang) * r, Math.sin(ang) * r, Math.cos(ang), Math.sin(ang));
  }
  return new THREE.Shape(pts);
}

function crawlerTrack(B, o) {
  const r = o.r, len = o.len, w = o.w, part = o.part || 'crawler';
  const zs = o.z !== undefined ? [o.z] : [o.spread, -o.spread];
  zs.forEach(z => {
    const g = new THREE.Group();
    g.position.set(o.x || 0, r, z);
    (o.parent || B.root).add(g);

    const geo = new THREE.ExtrudeGeometry(trackShape(len, r, o.tooth || 0.055), {
      depth: w - 0.05, bevelEnabled: true, bevelSize: 0.025, bevelThickness: 0.025,
      bevelSegments: 1, curveSegments: 2
    });
    geo.translate(0, 0, -(w - 0.05) / 2);
    geo.computeVertexNormals();
    B.mesh(geo, matte(0x2b3038, 0.78), { parent: g, part: part });

    /* うちがわの わく・スプロケット・ころ */
    B.box({ parent: g, x: 0, y: 0, z: 0, w: len - r * 1.6, h: r * 0.86, d: w * 0.52, r: 0.06, mat: matte(0x4d545e, 0.6), part: part });
    [[len / 2 - r, r * 0.72], [-(len / 2 - r), r * 0.66]].forEach(([px, pr]) => {
      B.cyl({ parent: g, x: px, y: 0, z: 0, r: pr, h: w * 0.42, axis: 'z', seg: 22, mat: metalMat(0x8d959f, 0.42), part: part });
    });
    for (let k = -1; k <= 1; k++) {
      B.cyl({ parent: g, x: k * (len * 0.24), y: -r * 0.62, z: 0, r: r * 0.26, h: w * 0.5, axis: 'z', seg: 14, mat: matte(0x646c78, 0.55), part: part });
    }
  });
}

/* ---------------- ふんばる あし（アウトリガー）---------------- */
function outriggers(B, o) {
  const W = o.w, color = o.color, reach = o.reach === undefined ? 1.6 : o.reach;
  const part = o.part || 'ashi';
  const beamY = o.y === undefined ? 1.15 : o.y;
  const legs = [];
  o.xs.forEach(ox => {
    [1, -1].forEach(sz => {
      /* よこへ のびる はり（本体に くっついた ところ）*/
      B.box({ x: ox, y: beamY, z: sz * (W / 2 + 0.22), w: 1.00, h: 0.42, d: 0.62, r: 0.06, color: color, part: part });
      /* のびる ぶぶん ＋ まっすぐ 下へ おりる あし */
      const leg = new THREE.Group();
      leg.position.set(0, 0, 0);
      B.root.add(leg);
      legs.push({ g: leg, sz: sz, reach: reach });
      B.box({ parent: leg, x: ox, y: beamY, z: sz * (W / 2 + 0.30 - reach * 0.5), w: 0.78, h: 0.32, d: reach + 0.90, r: 0.05, mat: metalMat(0xc3cad3, 0.28), part: part });
      B.cyl({ parent: leg, x: ox, y: beamY * 0.54, z: sz * (W / 2 + 0.62), r: 0.17, h: beamY * 1.05, seg: 18, mat: matte(0x4a525f, 0.5), part: part });
      const foot = new THREE.Group();
      leg.add(foot);
      B.cyl({ parent: foot, x: ox, y: 0.30, z: sz * (W / 2 + 0.62), r: 0.11, h: 0.70, seg: 16, mat: metalMat(0xdfe4ea, 0.12), part: part });
      B.cyl({ parent: foot, x: ox, y: 0.055, z: sz * (W / 2 + 0.62), r: 0.52, h: 0.11, seg: 26, mat: matte(0x33393f, 0.75), part: part });
      legs[legs.length - 1].foot = foot;
    });
  });
  /* v = 0 しまった / 1 いっぱいに ひろげた */
  return function (v) {
    legs.forEach(L => {
      L.g.position.z = L.sz * L.reach * v;
      L.foot.position.y = -0.30 + v * 0.30;
    });
  };
}

/* ---------------- 箱の からだ（きゅうきゅう車・としょかん車 など）---------------- */
function boxBody(B, o) {
  const cx = o.x, len = o.len, W = o.w, bot = o.bot, top = o.top;
  const h = top - bot;
  const body = B.box({
    x: cx, y: (top + bot) / 2, z: 0, w: len, h: h, d: W,
    r: 0.16, b: 0.05, color: o.color, part: o.part, rough: 0.26
  });
  /* よこの まど */
  if (o.sideWindow !== false) {
    [1, -1].forEach(s => {
      B.glass({ x: cx + len * 0.22, y: top - h * 0.34, z: s * (W / 2 - 0.04), w: len * 0.34, h: h * 0.34, d: 0.08, r: 0.07, part: 'window' });
    });
  }
  /* ライン */
  if (o.stripe !== undefined) {
    [1, -1].forEach(s => {
      B.box({ x: cx, y: bot + h * 0.30, z: s * (W / 2 + 0.008), w: len - 0.16, h: 0.20, d: 0.02, r: 0.01, mat: paint(o.stripe, { rough: 0.3 }) });
    });
    B.box({ x: cx - len / 2 - 0.012, y: bot + h * 0.30, z: 0, w: 0.02, h: 0.20, d: W - 0.14, r: 0.01, mat: paint(o.stripe, { rough: 0.3 }) });
  }
  return body;
}

/* ---------------- 回転灯（けいこうとう）---------------- */
function lightBar(B, o) {
  const w = o.w === undefined ? 1.5 : o.w;
  B.box({ x: o.x, y: o.y - 0.05, z: 0, w: 0.34, h: 0.10, d: w, r: 0.04, mat: matte(0x2b3038, 0.6), part: o.part || 'lamp' });
  const n = o.n === undefined ? 6 : o.n;
  for (let i = 0; i < n; i++) {
    const z = (-(n - 1) / 2 + i) * (w / n);
    const col = (o.colors || [PAL.lampR, PAL.lampR])[i % 2];
    B.lamp({ x: o.x, y: o.y + 0.10, z: z, w: 0.26, h: 0.19, d: w / n - 0.03, color: col, strength: 1.5, part: o.part || 'lamp' });
  }
}

/* =========================================================================
   8. じどう車の 3Dモデル
      part の 名まえは car-art.js / parts-data.js と おなじに する
   ========================================================================= */

/* ---------------------------------------------------------------- トラック */
MODEL3D.truck = {
  label: 'トラック',
  build: function (B) {
    const COL = 0x2f9e63;          // うんてんせきの いろ
    const BODY_W = 2.49;           // 車の はば（およそ 2.5メートル）
    const cabLen = 2.25, cabTop = 3.42, floor = 1.02;

    chassis(B, { x: -0.4, y: 0.90, len: 11.1, spread: 0.44, tank: { x: 2.0, z: 1.02 } });

    /* ==== にだい（ウイングボディ）==== */
    const nx = -1.5, nLen = 9.25, nBot = 1.20, nTop = 3.92;
    const nh = nTop - nBot;
    B.box({
      x: nx, y: (nTop + nBot) / 2, z: 0, w: nLen, h: nh, d: BODY_W,
      r: 0.10, b: 0.05, color: 0xd2d9e2, part: 'nidai', metal: 0.62, rough: 0.26, clear: 0.25
    });
    /* にだいの ゆか（ひろくて たいら）*/
    B.box({ x: nx, y: nBot - 0.05, z: 0, w: nLen + 0.06, h: 0.14, d: BODY_W + 0.05, r: 0.03, mat: matte(PAL.steelD, 0.6), part: 'nidai' });
    /* ラインの もよう */
    [[0.55, 0x2f8f52], [0.44, 0xe5544b]].forEach(([t, c]) => {
      [1, -1].forEach(s => {
        B.box({ x: nx, y: nBot + nh * t, z: s * (BODY_W / 2 + 0.008), w: nLen - 0.10, h: 0.16, d: 0.02, r: 0.01, mat: paint(c, { rough: 0.3 }) });
      });
    });
    /* ウイングの あわせめ（うえが パカッと ひらく とびら）*/
    [1, -1].forEach(s => {
      B.seam({ x: nx, y: nTop - 0.28, z: s * (BODY_W / 2 + 0.012), w: nLen - 0.06, h: 0.05, d: 0.03, color: 0x8b95a3, part: 'door' });
      /* たてスジ（ほねぐみ）*/
      for (let i = -3; i <= 3; i++) {
        B.seam({ x: nx + i * 1.28, y: (nTop + nBot) / 2, z: s * (BODY_W / 2 + 0.012), w: 0.055, h: nh - 0.36, d: 0.03, color: 0x8d97a5 });
      }
    });
    /* うしろの とびら */
    B.box({ x: nx - nLen / 2 - 0.03, y: (nTop + nBot) / 2, z: 0, w: 0.07, h: nh - 0.10, d: BODY_W - 0.06, r: 0.04, mat: metalMat(0xd6dce4, 0.32), part: 'door' });
    B.seam({ x: nx - nLen / 2 - 0.08, y: (nTop + nBot) / 2, z: 0, w: 0.04, h: nh - 0.20, d: 0.05, color: 0x8b95a3, part: 'door' });
    /* うしろの ランプ */
    [1, -1].forEach(s => {
      B.lamp({ x: nx - nLen / 2 - 0.09, y: nBot + 0.18, z: s * (BODY_W / 2 - 0.28), w: 0.05, h: 0.30, d: 0.16, color: PAL.lampR, strength: 1.0, part: 'lamp' });
    });

    /* ==== うんてんせき ==== */
    truckCab(B, { x: 4.55, len: cabLen, w: 2.45, top: cabTop, floor: floor, color: COL, deflector: true });

    /* ==== タイヤ（うしろは 二本ずつ）==== */
    B.wheel({ x: 4.35, r: 0.535, w: 0.34, spread: 1.03 });          // まえ 2こ
    [-3.45, -4.90].forEach(ax => {                                   // うしろ 2じく × 4こ
      B.wheel({ x: ax, r: 0.535, w: 0.30, z: 0.90 });
      B.wheel({ x: ax, r: 0.535, w: 0.30, z: 1.19 });
      B.wheel({ x: ax, r: 0.535, w: 0.30, z: -0.90 });
      B.wheel({ x: ax, r: 0.535, w: 0.30, z: -1.19 });
    });
    /* しゃじく */
    [4.35, -3.45, -4.90].forEach(ax => {
      B.cyl({ x: ax, y: 0.535, z: 0, r: 0.11, h: 2.1, axis: 'z', seg: 14, mat: matte(PAL.frame, 0.6) });
      B.cyl({ x: ax, y: 0.535, z: 0, r: 0.30, h: 0.55, axis: 'z', seg: 18, mat: matte(0x4a525f, 0.65) });
    });
    /* どろよけ */
    [1, -1].forEach(s => {
      B.box({ x: -5.75, y: 0.34, z: s * 1.05, w: 0.05, h: 0.62, d: 0.60, r: 0.03, mat: matte(0x23272e, 0.85) });
    });
  }
};

/* -------------------------------------------------------------- クレーン車 */
MODEL3D.crane = {
  label: 'クレーン車',
  build: function (B) {
    const COL = 0xf0a828;
    const W = 2.78;
    const carrierY = 1.42, carrierH = 0.95;

    /* ==== 車の からだ（キャリア）==== */
    B.box({
      x: -0.2, y: carrierY, z: 0, w: 10.6, h: carrierH, d: W,
      r: 0.14, b: 0.05, color: COL, part: 'body', rough: 0.28
    });
    B.box({ x: -0.2, y: carrierY - carrierH / 2 - 0.10, z: 0, w: 10.2, h: 0.24, d: W - 0.20, r: 0.05, mat: matte(0x2c333f, 0.7), part: 'body' });
    /* まえの バンパー・ライト */
    B.box({ x: 5.22, y: 1.06, z: 0, w: 0.28, h: 0.40, d: W + 0.02, r: 0.08, mat: matte(0x39414e, 0.55) });
    [1, -1].forEach(s => {
      B.lamp({ x: 5.32, y: 1.52, z: s * (W / 2 - 0.34), w: 0.06, h: 0.22, d: 0.30, color: 0xfff2cf, strength: 1.4, part: 'lamp' });
    });

    /* ==== うんてんせき（右まえ・ガラスばり）==== */
    const cabX = 3.35, cabZ = 1.02, cabW = 1.24, cabD = 1.30, cabBot = 1.92, cabTop = 3.55;
    B.box({
      x: cabX, y: (cabTop + cabBot) / 2, z: cabZ, w: cabW, h: cabTop - cabBot, d: cabD,
      r: 0.16, b: 0.05, color: COL, part: 'cab', rough: 0.26
    });
    B.glass({ x: cabX + cabW / 2 - 0.06, y: (cabTop + cabBot) / 2 + 0.08, z: cabZ, w: 0.08, h: (cabTop - cabBot) * 0.66, d: cabD - 0.22, r: 0.07, rz: -0.10, part: 'window' });
    B.glass({ x: cabX - 0.06, y: (cabTop + cabBot) / 2 + 0.10, z: cabZ + cabD / 2 - 0.04, w: cabW * 0.66, h: (cabTop - cabBot) * 0.58, d: 0.07, r: 0.06, part: 'window' });
    B.glass({ x: cabX - 0.06, y: (cabTop + cabBot) / 2 + 0.10, z: cabZ - cabD / 2 + 0.04, w: cabW * 0.66, h: (cabTop - cabBot) * 0.58, d: 0.07, r: 0.06, part: 'window' });
    B.box({ x: cabX, y: cabTop + 0.10, z: cabZ, w: cabW - 0.06, h: 0.10, d: cabD - 0.06, r: 0.05, mat: paint(0xd7d9dd, { rough: 0.4 }) });
    /* 回転する 上の 台 */
    B.cyl({ x: -0.9, y: 2.02, z: 0, r: 1.28, h: 0.34, seg: 32, color: COL, part: 'body' });

    /* ==== うで（ブーム）— 中から つぎつぎ のびる ==== */
    const ANG = 42 * Math.PI / 180;
    const pivot = new THREE.Group();
    pivot.position.set(-1.60, 2.62, 0);
    pivot.rotation.z = ANG;
    B.root.add(pivot);

    /* ねもとの まるい つなぎめ */
    B.cyl({ parent: pivot, x: -0.20, y: 0, z: 0, r: 0.52, h: 1.05, axis: 'z', seg: 24, color: 0xc98a1e, part: 'arm' });

    const bconf = [
      { len: 6.4, h: 0.92, d: 0.86, col: COL },
      { len: 5.4, h: 0.74, d: 0.70, col: 0xf4b746 },
      { len: 4.6, h: 0.58, d: 0.56, col: 0xf7c76a }
    ];
    const secs = [];
    let par = pivot;
    bconf.forEach(c => {
      const g = new THREE.Group();
      par.add(g);
      secs.push(g);
      B.box({
        parent: g, x: c.len / 2, y: 0, z: 0, w: c.len, h: c.h, d: c.d,
        r: 0.14, b: 0.045, color: c.col, part: 'arm', rough: 0.3
      });
      par = g;
    });

    /* うでを おこす シリンダー */
    const cyl = new THREE.Group();
    cyl.position.set(-0.30, 2.20, 0);
    cyl.rotation.z = 30 * Math.PI / 180;
    B.root.add(cyl);
    B.cyl({ parent: cyl, x: 1.05, y: 0, z: 0, r: 0.20, h: 2.1, axis: 'x', seg: 18, mat: matte(0x555d6b, 0.5), part: 'arm' });
    B.cyl({ parent: cyl, x: 2.35, y: 0, z: 0, r: 0.115, h: 1.5, axis: 'x', seg: 16, mat: metalMat(0xdfe4ea, 0.12), part: 'arm' });

    /* さきの シーブ ＋ まっすぐ たれる ワイヤーと フック
       （うでが かたむいても、つりさげる ものは まっすぐ 下を むく）*/
    const tipG = new THREE.Group();
    tipG.position.set(bconf[2].len, 0, 0);
    secs[2].add(tipG);
    B.cyl({ parent: tipG, x: 0, y: 0, z: 0, r: 0.26, h: 0.42, axis: 'z', seg: 20, mat: metalMat(0xb9c0ca, 0.3), part: 'arm' });

    const hang = new THREE.Group();
    hang.rotation.z = -ANG;                    /* うでの かたむきを うちけす */
    tipG.add(hang);
    B.cyl({ parent: hang, x: 0, y: -1.55, z: 0, r: 0.035, h: 3.10, axis: 'y', seg: 8, mat: metalMat(0x9aa3ae, 0.35) });
    B.box({ parent: hang, x: 0, y: -3.36, z: 0, w: 0.46, h: 0.72, d: 0.40, r: 0.12, mat: metalMat(0x2f3d52, 0.35), part: 'hook' });
    B.mesh(new THREE.TorusGeometry(0.26, 0.075, 12, 24, Math.PI * 1.45),
      metalMat(0xd8dee6, 0.25), { parent: hang, x: 0, y: -3.96, z: 0, rz: Math.PI * 0.28, part: 'hook' });

    /* 教科書の 文「つりざおの ように 中から つぎつぎ のびて」を そのまま */
    B.anim('boom', 'うでを のばす', v => {
      secs[1].position.x = v * (bconf[0].len - 0.95);
      secs[2].position.x = v * (bconf[1].len - 0.95);
      cyl.rotation.z = (30 + v * 8) * Math.PI / 180;
      cyl.scale.x = 1 + v * 0.12;
    });

    /* ==== ふんばる あし（アウトリガー）— 4本を 大きく ひろげる ==== */
    B.anim('ashi', 'あしを しまう／ひろげる',
      outriggers(B, { xs: [4.05, -3.95], w: W, color: COL, reach: 1.52, y: 1.20, part: 'ashi' }),
      { start: 1 });

    /* ==== タイヤ（あしで もち上げられて ういている）==== */
    const LIFT = 0.17;
    [3.55, 1.35, -1.95, -4.15].forEach(ax => {
      B.wheel({ x: ax, r: 0.82, w: 0.52, z: 1.16, lift: LIFT });
      B.wheel({ x: ax, r: 0.82, w: 0.52, z: -1.16, lift: LIFT });
      B.cyl({ x: ax, y: 0.82 + LIFT, z: 0, r: 0.15, h: 2.3, axis: 'z', seg: 14, mat: matte(PAL.frame, 0.6) });
    });
  }
};

/* -------------------------------------------------------------- ミキサー車 */
MODEL3D.mixer = {
  label: 'ミキサー車',
  build: function (B) {
    const COL = 0x2f6fbf;
    const W = 2.46;

    chassis(B, { x: -0.3, y: 0.88, len: 8.4, spread: 0.42, tank: { x: 1.7, z: 1.00 } });

    /* ==== ぐるぐる まわる ドラム ==== */
    /* tiltGroup: かたむける（うしろ下がり）/ spinGroup: その中で ぐるぐる まわる */
    const tiltGroup = new THREE.Group();
    tiltGroup.position.set(-1.55, 2.26, 0);
    tiltGroup.rotation.z = -14 * Math.PI / 180;
    B.root.add(tiltGroup);

    const orientGroup = new THREE.Group();
    orientGroup.rotation.z = Math.PI / 2;   // Lathe の たてじくを 車の まえうしろへ むける
    tiltGroup.add(orientGroup);
    const spinGroup = new THREE.Group();    // この中だけが じくの まわりに 回る
    orientGroup.add(spinGroup);
    B.spin.push({ obj: spinGroup, axis: 'y', speed: 0.85 });

    /* ドラムの かたち（だんめんを 一しゅう 回して つくる）*/
    const prof = [
      [0.03, -2.55], [0.55, -2.50], [0.82, -2.20], [1.05, -1.66],
      [1.22, -0.92], [1.28, -0.08], [1.24, 0.66], [1.08, 1.30],
      [0.82, 1.86], [0.56, 2.20], [0.45, 2.42], [0.43, 2.62], [0.03, 2.62]
    ].map(p => new THREE.Vector2(p[0], p[1]));
    const drumGeo = new THREE.LatheGeometry(prof, 48);
    drumGeo.computeVertexNormals();
    B.mesh(drumGeo, paint(0xe2e8ef, { metal: 0.42, rough: 0.30, clear: 0.4 }),
      { parent: spinGroup, part: 'drum' });

    /* ドラムの まわりの らせん（中の コンクリートを まぜる はね）*/
    function drumRadius(y) {
      let best = prof[0];
      for (let i = 0; i < prof.length - 1; i++) {
        const p0 = prof[i], p1 = prof[i + 1];
        if (y >= Math.min(p0.y, p1.y) && y <= Math.max(p0.y, p1.y)) {
          const t = (y - p0.y) / ((p1.y - p0.y) || 1);
          return p0.x + (p1.x - p0.x) * t;
        }
      }
      return best.x;
    }
    for (let k = 0; k < 2; k++) {
      const curve = new THREE.CatmullRomCurve3(
        Array.from({ length: 64 }, (_, i) => {
          const t = i / 63;
          const y = -2.25 + t * 4.55;
          const rr = drumRadius(y) + 0.05;
          const a = t * Math.PI * 3.4 + k * Math.PI;
          return new THREE.Vector3(Math.cos(a) * rr, y, Math.sin(a) * rr);
        })
      );
      B.mesh(new THREE.TubeGeometry(curve, 130, 0.062, 8, false),
        metalMat(0xa7b0bb, 0.34), { parent: spinGroup, part: 'drum' });
    }
    /* ドラムを ささえる ローラーと 回す モーター */
    B.cyl({ x: -3.62, y: 1.55, z: 0, r: 0.44, h: 0.52, axis: 'z', seg: 24, mat: metalMat(0x8f98a3, 0.4) });
    B.box({ x: 0.62, y: 2.02, z: 0, w: 0.95, h: 0.82, d: 1.10, r: 0.12, color: COL, rough: 0.3 });
    B.box({ x: -3.62, y: 1.20, z: 0, w: 1.10, h: 0.60, d: 1.60, r: 0.08, mat: matte(0x59616e, 0.6) });

    /* ==== コンクリートを ながす シュート ==== */
    const chute = new THREE.Group();
    chute.position.set(-4.05, 1.95, 0);
    chute.rotation.z = -0.62;
    chute.rotation.y = 0.30;
    B.root.add(chute);
    const cprof = [];
    for (let i = 0; i <= 14; i++) {
      const a = Math.PI * (0.06 + i / 14 * 0.88);
      cprof.push(new THREE.Vector2(Math.cos(a) * 0.34, Math.sin(a) * 0.30));
    }
    const chuteShape = new THREE.Shape(cprof);
    const chuteGeo = new THREE.ExtrudeGeometry(chuteShape, { depth: 1.45, bevelEnabled: true, bevelSize: 0.02, bevelThickness: 0.02, bevelSegments: 1, curveSegments: 4 });
    chuteGeo.translate(0, 0, -0.72);
    chuteGeo.computeVertexNormals();
    B.mesh(chuteGeo, metalMat(0xbcc5d0, 0.38), { parent: chute, x: -0.6, y: 0, z: 0, ry: Math.PI / 2, rx: Math.PI, part: 'chute' });
    B.cyl({ parent: chute, x: 0.15, y: 0.06, z: 0, r: 0.14, h: 0.42, axis: 'y', seg: 16, mat: metalMat(0x8f98a3, 0.35), part: 'chute' });
    /* シュートを 回す ハンドル */
    B.mesh(new THREE.TorusGeometry(0.24, 0.03, 8, 20), metalMat(0x9aa3ae, 0.4), { x: -3.95, y: 2.75, z: 0.62, rx: Math.PI / 2, part: 'chute' });

    /* 水タンク・はしご */
    B.cyl({ x: -0.15, y: 1.30, z: 1.12, r: 0.28, h: 1.30, axis: 'x', seg: 20, mat: metalMat(0xc9d1da, 0.25), part: 'tank' });
    [1, -1].forEach(s => {
      B.box({ x: -4.05, y: 1.55, z: s * 0.55, w: 0.06, h: 2.1, d: 0.06, r: 0.02, mat: matte(0x707a86, 0.6), part: 'ladder' });
    });
    for (let i = 0; i < 5; i++) {
      B.box({ x: -4.05, y: 0.72 + i * 0.40, z: 0, w: 0.05, h: 0.05, d: 1.10, r: 0.02, mat: matte(0x707a86, 0.6), part: 'ladder' });
    }

    /* ==== うんてんせき ==== */
    truckCab(B, { x: 3.02, len: 2.05, w: 2.38, top: 3.05, floor: 0.98, color: COL, deflector: false });

    /* ==== タイヤ ==== */
    B.wheel({ x: 2.85, r: 0.52, w: 0.32, spread: 1.00 });
    [-2.05, -3.40].forEach(ax => {
      [0.88, 1.16, -0.88, -1.16].forEach(z => B.wheel({ x: ax, r: 0.52, w: 0.28, z: z }));
      B.cyl({ x: ax, y: 0.52, z: 0, r: 0.10, h: 2.0, axis: 'z', seg: 14, mat: matte(PAL.frame, 0.6) });
      B.cyl({ x: ax, y: 0.52, z: 0, r: 0.28, h: 0.5, axis: 'z', seg: 18, mat: matte(0x4a525f, 0.65) });
    });
    B.cyl({ x: 2.85, y: 0.52, z: 0, r: 0.10, h: 2.0, axis: 'z', seg: 14, mat: matte(PAL.frame, 0.6) });
  }
};


/* ---------------- まるく そった 板（バケット・ブルドーザーの はね）---------------- */
function curvedPlateGeom(rIn, thick, a0, a1, depth, seg) {
  const n = seg || 14;
  const sh = new THREE.Shape();
  for (let i = 0; i <= n; i++) {
    const a = a0 + (a1 - a0) * i / n;
    const p = [Math.cos(a) * rIn, Math.sin(a) * rIn];
    if (i === 0) sh.moveTo(p[0], p[1]); else sh.lineTo(p[0], p[1]);
  }
  for (let i = n; i >= 0; i--) {
    const a = a0 + (a1 - a0) * i / n;
    sh.lineTo(Math.cos(a) * (rIn + thick), Math.sin(a) * (rIn + thick));
  }
  const g = new THREE.ExtrudeGeometry(sh, {
    depth: depth, bevelEnabled: true, bevelSize: 0.018, bevelThickness: 0.018,
    bevelSegments: 1, curveSegments: 2
  });
  g.translate(0, 0, -depth / 2);
  g.computeVertexNormals();
  return g;
}

/* ---------------------------------------------------------- ショベルカー */
MODEL3D.shovel = {
  label: 'ショベルカー',
  build: function (B) {
    const COL = 0xf2941f;

    /* ==== キャタピラ ==== */
    crawlerTrack(B, { x: 0, len: 4.10, r: 0.43, w: 0.64, spread: 1.14, tooth: 0.045 });
    B.box({ x: 0, y: 0.56, z: 0, w: 3.30, h: 0.36, d: 2.10, r: 0.06, mat: matte(0x4d545e, 0.6), part: 'crawler' });

    /* ==== 上の からだ（ぐるっと まわる ところ）==== */
    B.cyl({ x: -0.25, y: 0.90, z: 0, r: 1.10, h: 0.32, seg: 30, mat: metalMat(0x8d959f, 0.4), part: 'body' });
    B.box({ x: -1.05, y: 1.62, z: 0, w: 2.95, h: 1.16, d: 2.34, r: 0.16, color: COL, part: 'body', rough: 0.3 });
    B.box({ x: -1.15, y: 2.14, z: -0.35, w: 2.10, h: 0.30, d: 1.55, r: 0.10, color: COL, part: 'body', rough: 0.34 });
    /* うしろの おもり（バランスを とる） */
    B.box({ x: -2.42, y: 1.44, z: 0, w: 0.72, h: 1.30, d: 2.28, r: 0.14, mat: paint(0xd97f14, { rough: 0.4 }), part: 'body' });
    /* マフラー */
    B.cyl({ x: -0.20, y: 2.42, z: -0.72, r: 0.09, h: 0.55, seg: 14, mat: metalMat(0x9aa3ae, 0.4) });

    /* ==== うんてんせき（ガラスばり）==== */
    const cbx = 0.42, cbz = 0.74, cw = 1.14, cd = 1.22, cbot = 1.06, ctop = 2.86;
    B.box({ x: cbx, y: (ctop + cbot) / 2, z: cbz, w: cw, h: ctop - cbot, d: cd, r: 0.14, b: 0.045, color: COL, part: 'cab', rough: 0.26 });
    B.glass({ x: cbx + cw / 2 - 0.05, y: (ctop + cbot) / 2 + 0.16, z: cbz, w: 0.08, h: (ctop - cbot) * 0.72, d: cd - 0.20, r: 0.06, part: 'window' });
    B.glass({ x: cbx - 0.04, y: (ctop + cbot) / 2 + 0.14, z: cbz + cd / 2 - 0.035, w: cw * 0.68, h: (ctop - cbot) * 0.60, d: 0.07, r: 0.06, part: 'window' });
    B.glass({ x: cbx - 0.04, y: (ctop + cbot) / 2 + 0.14, z: cbz - cd / 2 + 0.035, w: cw * 0.68, h: (ctop - cbot) * 0.60, d: 0.07, r: 0.06, part: 'window' });
    B.box({ x: cbx, y: ctop + 0.08, z: cbz, w: cw - 0.06, h: 0.09, d: cd - 0.06, r: 0.04, mat: paint(0xd7d9dd, { rough: 0.4 }) });
    B.lamp({ x: cbx + 0.10, y: ctop + 0.14, z: cbz - 0.30, w: 0.14, h: 0.10, d: 0.24, color: 0xfff2cf, strength: 1.2, part: 'lamp' });

    /* ==== うで（ブーム → アーム → バケット）==== */
    const boom = new THREE.Group();          // ねもとの うで
    boom.position.set(0.95, 1.62, 0);
    B.root.add(boom);
    const stick = new THREE.Group();         // その さきの うで
    stick.position.set(3.30, 0, 0);
    boom.add(stick);
    const bucketG = new THREE.Group();       // バケット
    bucketG.position.set(2.30, 0, 0);
    stick.add(bucketG);

    B.box({ parent: boom, x: 1.70, y: 0, z: 0, w: 3.55, h: 0.62, d: 0.56, r: 0.14, color: COL, part: 'arm', rough: 0.3 });
    B.cyl({ parent: boom, x: 0, y: 0, z: 0, r: 0.30, h: 0.70, axis: 'z', seg: 20, mat: metalMat(0x9aa3ae, 0.4), part: 'arm' });
    B.cyl({ parent: boom, x: 1.30, y: 0.42, z: 0, r: 0.13, h: 1.9, axis: 'x', seg: 14, mat: metalMat(0xdfe4ea, 0.14), part: 'arm' });
    B.box({ parent: stick, x: 1.15, y: 0, z: 0, w: 2.45, h: 0.46, d: 0.44, r: 0.11, color: COL, part: 'arm', rough: 0.3 });
    B.cyl({ parent: stick, x: 0, y: 0, z: 0, r: 0.24, h: 0.56, axis: 'z', seg: 18, mat: metalMat(0x9aa3ae, 0.4), part: 'arm' });

    /* バケット（するどい つめが ついた すくう ところ）*/
    B.mesh(curvedPlateGeom(0.70, 0.08, -0.10, 2.25, 1.06, 18),
      metalMat(0x9099a5, 0.45), { parent: bucketG, x: 0, y: 0, z: 0, part: 'bucket' });
    [1, -1].forEach(sz => {
      B.mesh(curvedPlateGeom(0.70, 0.08, -0.10, 2.25, 0.06, 18),
        metalMat(0x7d858f, 0.5), { parent: bucketG, x: 0, y: 0, z: sz * 0.54, part: 'bucket' });
    });
    for (let i = 0; i < 4; i++) {
      const z = (-1.5 + i) * 0.24;
      B.box({
        parent: bucketG, x: Math.cos(-0.10) * 0.90, y: Math.sin(-0.10) * 0.90, z: z,
        w: 0.38, h: 0.14, d: 0.15, r: 0.03, rz: -0.10, mat: metalMat(0xc8cfd8, 0.25), part: 'bucket'
      });
    }

    /* うごかす: 土を ほって すくいあげる */
    const pose = (v) => {
      boom.rotation.z = THREE.MathUtils.lerp(0.72, 0.14, v);
      stick.rotation.z = THREE.MathUtils.lerp(-2.05, -1.15, v);
      bucketG.rotation.z = THREE.MathUtils.lerp(0.55, -1.15, v);
    };
    B.anim('dig', 'うでを のばして ほる', pose);
  }
};

/* -------------------------------------------------------- ブルドーザー */
MODEL3D.bulldozer = {
  label: 'ブルドーザー',
  build: function (B) {
    const COL = 0xf0b21c;

    crawlerTrack(B, { x: -0.30, len: 4.00, r: 0.50, w: 0.66, spread: 1.18, tooth: 0.05 });
    B.box({ x: -0.30, y: 0.74, z: 0, w: 3.30, h: 0.44, d: 2.10, r: 0.06, mat: matte(0x4d545e, 0.6), part: 'crawler' });

    /* からだ・エンジンの ふた */
    B.box({ x: -0.20, y: 1.32, z: 0, w: 2.85, h: 0.90, d: 1.90, r: 0.14, color: COL, part: 'body', rough: 0.32 });
    B.box({ x: 0.90, y: 1.92, z: 0, w: 1.35, h: 0.72, d: 1.42, r: 0.12, color: COL, part: 'body', rough: 0.32 });
    B.cyl({ x: 1.30, y: 2.52, z: 0.46, r: 0.10, h: 0.55, seg: 14, mat: metalMat(0x8d959f, 0.42) });

    /* うんてんせき（まわりを かこう じょうぶな わく）*/
    B.box({ x: -0.85, y: 1.90, z: 0, w: 1.15, h: 0.28, d: 1.35, r: 0.06, mat: matte(0x3c434e, 0.6), part: 'cab' });
    B.box({ x: -0.95, y: 2.28, z: 0, w: 0.62, h: 0.60, d: 0.70, r: 0.10, mat: matte(0x2f3640, 0.7), part: 'seat' });
    [[-0.30, 0.62], [-0.30, -0.62], [-1.45, 0.62], [-1.45, -0.62]].forEach(([px, pz]) => {
      B.box({ x: px, y: 2.42, z: pz, w: 0.10, h: 1.30, d: 0.10, r: 0.03, mat: matte(0x3c434e, 0.55), part: 'cab' });
    });
    B.box({ x: -0.88, y: 3.10, z: 0, w: 1.45, h: 0.11, d: 1.55, r: 0.05, color: COL, part: 'cab', rough: 0.4 });
    B.lamp({ x: -0.32, y: 3.02, z: 0.52, w: 0.14, h: 0.12, d: 0.22, color: 0xfff2cf, strength: 1.2, part: 'lamp' });

    /* 土を おす 大きな はね（ブレード）*/
    const blade = new THREE.Group();
    blade.position.set(3.62, 0.78, 0);       /* 円の 中心。板は この 左がわに つく */
    B.root.add(blade);
    /* 土を まとめて 前へ おす、そりかえった 板 */
    B.mesh(curvedPlateGeom(1.05, 0.10, Math.PI - 0.62, Math.PI + 0.62, 3.50, 18),
      paint(COL, { rough: 0.34 }), { parent: blade, part: 'blade' });
    /* した の は（土に くいこむ ところ）*/
    B.box({ parent: blade, x: -0.90, y: -0.66, z: 0, w: 0.34, h: 0.15, d: 3.52, r: 0.03, rz: 0.42, mat: metalMat(0xb9c0ca, 0.3), part: 'blade' });
    [1, -1].forEach(sz => {
      B.box({ parent: blade, x: -1.02, y: 0.02, z: sz * 1.76, w: 0.72, h: 1.42, d: 0.07, r: 0.06, mat: paint(COL, { rough: 0.34 }), part: 'blade' });
    });
    /* はねを ささえる うで */
    [1, -1].forEach(sz => {
      B.box({ x: 1.32, y: 0.74, z: sz * 1.04, w: 2.55, h: 0.20, d: 0.20, r: 0.05, mat: matte(0x59616e, 0.5), part: 'blade' });
    });
    const cylG = new THREE.Group();
    cylG.position.set(1.05, 1.70, 0);
    B.root.add(cylG);
    [1, -1].forEach(sz => {
      B.cyl({ parent: cylG, x: 0.62, y: 0, z: sz * 0.72, r: 0.13, h: 1.15, axis: 'x', seg: 14, mat: matte(0x59616e, 0.5), part: 'blade' });
      B.cyl({ parent: cylG, x: 1.42, y: 0, z: sz * 0.72, r: 0.075, h: 0.85, axis: 'x', seg: 12, mat: metalMat(0xdfe4ea, 0.14), part: 'blade' });
    });

    B.anim('blade', 'はねを 上げ下げ する', v => {
      blade.position.y = 0.78 + v * 0.85;
      blade.rotation.z = -v * 0.10;
      cylG.rotation.z = v * 0.30;
    });
  }
};

/* ------------------------------------------------------------ ダンプカー */
MODEL3D.dump = {
  label: 'ダンプカー',
  build: function (B) {
    const COL = 0x2f6fbf, BED = 0xd94f38;
    const W = 2.44;

    chassis(B, { x: -0.5, y: 0.90, len: 8.0, spread: 0.44, tank: { x: 1.35, z: 1.00 } });

    /* ==== うんてんせき ==== */
    truckCab(B, { x: 2.95, len: 2.05, w: 2.40, top: 3.06, floor: 0.98, color: COL });
    /* 上から 土や 石が おちて きても だいじょうぶな じょうぶな やね */
    B.box({ x: 2.10, y: 3.24, z: 0, w: 2.15, h: 0.20, d: 2.44, r: 0.06, mat: metalMat(0x8f98a3, 0.4), part: 'cab' });
    for (let i = -3; i <= 3; i++) {
      B.box({ x: 2.10 + i * 0.30, y: 3.38, z: 0, w: 0.12, h: 0.12, d: 2.40, r: 0.03, mat: metalMat(0x757e8a, 0.45), part: 'cab' });
    }
    [1, -1].forEach(sz => {
      B.box({ x: 1.12, y: 2.60, z: sz * 1.05, w: 0.14, h: 1.35, d: 0.14, r: 0.04, mat: metalMat(0x757e8a, 0.45), part: 'cab' });
    });

    /* ==== にだい（かたむいて 土を おろす）==== */
    const bed = new THREE.Group();
    bed.position.set(-4.05, 1.22, 0);        // うしろの ちょうつがい
    B.root.add(bed);
    const bl = 5.65, bh = 1.02;
    B.box({ parent: bed, x: bl / 2, y: 0.06, z: 0, w: bl, h: 0.16, d: W, r: 0.04, mat: metalMat(0xb9c0ca, 0.35), part: 'nidai' });
    [1, -1].forEach(sz => {
      B.box({ parent: bed, x: bl / 2, y: bh / 2 + 0.10, z: sz * (W / 2 - 0.06), w: bl, h: bh, d: 0.13, r: 0.05, color: BED, part: 'nidai', rough: 0.34 });
      for (let i = 0; i < 5; i++) {
        B.box({ parent: bed, x: 0.55 + i * 1.28, y: bh / 2 + 0.10, z: sz * (W / 2 + 0.03), w: 0.14, h: bh - 0.12, d: 0.07, r: 0.03, mat: paint(0xb03b28, { rough: 0.4 }), part: 'nidai' });
      }
    });
    B.box({ parent: bed, x: bl - 0.08, y: bh / 2 + 0.42, z: 0, w: 0.14, h: bh + 0.66, d: W, r: 0.05, color: BED, part: 'nidai', rough: 0.34 });
    /* うしろの とびら（土が ざあっと 出る ところ）*/
    const gate = new THREE.Group();
    gate.position.set(0.02, bh + 0.12, 0);
    bed.add(gate);
    B.box({ parent: gate, x: 0, y: -bh / 2, z: 0, w: 0.13, h: bh, d: W, r: 0.05, color: BED, part: 'door', rough: 0.34 });
    /* にだいを もち上げる ふとい つつ */
    const ram = new THREE.Group();
    ram.position.set(-1.30, 1.05, 0);
    B.root.add(ram);
    B.cyl({ parent: ram, x: 0.40, y: 0, z: 0, r: 0.20, h: 1.10, axis: 'x', seg: 18, mat: matte(0x59616e, 0.5), part: 'nidai' });
    B.cyl({ parent: ram, x: 1.25, y: 0, z: 0, r: 0.115, h: 1.30, axis: 'x', seg: 14, mat: metalMat(0xdfe4ea, 0.12), part: 'nidai' });

    /* ==== タイヤ ==== */
    B.wheel({ x: 2.75, r: 0.56, w: 0.34, spread: 1.02 });
    [-1.85, -3.25].forEach(ax => {
      [0.90, 1.19, -0.90, -1.19].forEach(z => B.wheel({ x: ax, r: 0.56, w: 0.30, z: z }));
      B.cyl({ x: ax, y: 0.56, z: 0, r: 0.11, h: 2.05, axis: 'z', seg: 14, mat: matte(PAL.frame, 0.6) });
      B.cyl({ x: ax, y: 0.56, z: 0, r: 0.30, h: 0.52, axis: 'z', seg: 18, mat: matte(0x4a525f, 0.65) });
    });
    B.cyl({ x: 2.75, y: 0.56, z: 0, r: 0.11, h: 2.05, axis: 'z', seg: 14, mat: matte(PAL.frame, 0.6) });

    B.anim('tilt', 'にだいを かたむける', v => {
      bed.rotation.z = v * 0.62;
      gate.rotation.z = -v * 1.15;
      ram.rotation.z = v * 0.55;
      ram.scale.x = 1 + v * 0.55;
    });
  }
};

/* -------------------------------------------------------- フォークリフト */
MODEL3D.forklift = {
  label: 'フォークリフト',
  build: function (B) {
    const COL = 0xf2941f;

    /* からだ と うしろの おもり */
    B.box({ x: -0.55, y: 0.80, z: 0, w: 2.05, h: 0.82, d: 1.16, r: 0.12, color: COL, part: 'body', rough: 0.3 });
    B.box({ x: -1.58, y: 0.64, z: 0, w: 0.66, h: 0.94, d: 1.10, r: 0.14, mat: paint(0xd97f14, { rough: 0.38 }), part: 'counter' });
    B.box({ x: -0.20, y: 1.22, z: 0, w: 0.95, h: 0.18, d: 1.06, r: 0.05, mat: matte(0x3c434e, 0.6) });

    /* ざせき */
    B.box({ x: -0.78, y: 1.28, z: 0, w: 0.62, h: 0.14, d: 0.62, r: 0.05, mat: matte(0x2f3640, 0.7), part: 'seat' });
    B.box({ x: -1.10, y: 1.58, z: 0, w: 0.14, h: 0.60, d: 0.60, r: 0.05, mat: matte(0x2f3640, 0.7), part: 'seat' });
    B.mesh(new THREE.TorusGeometry(0.20, 0.028, 8, 22), matte(0x22262d, 0.6),
      { x: -0.28, y: 1.56, z: 0, ry: Math.PI / 2, rz: -0.5 });

    /* うんてんする 人を まもる やね */
    [[-0.10, 0.48], [-0.10, -0.48], [-1.25, 0.48], [-1.25, -0.48]].forEach(([px, pz]) => {
      B.box({ x: px, y: 1.62, z: pz, w: 0.08, h: 1.55, d: 0.08, r: 0.02, mat: matte(0x3c434e, 0.55), part: 'guard' });
    });
    B.box({ x: -0.68, y: 2.42, z: 0, w: 1.35, h: 0.08, d: 1.10, r: 0.04, mat: matte(0x3c434e, 0.55), part: 'guard' });
    for (let i = -2; i <= 2; i++) {
      B.box({ x: -0.68 + i * 0.26, y: 2.46, z: 0, w: 0.06, h: 0.05, d: 1.06, r: 0.02, mat: matte(0x3c434e, 0.55), part: 'guard' });
    }

    /* まっすぐ のびる はしら（マスト）*/
    const mastOuterH = 2.05;
    [1, -1].forEach(sz => {
      B.box({ x: 0.62, y: mastOuterH / 2 + 0.10, z: sz * 0.42, w: 0.16, h: mastOuterH, d: 0.13, r: 0.03, mat: metalMat(0x7d858f, 0.4), part: 'mast' });
    });
    B.box({ x: 0.62, y: 0.22, z: 0, w: 0.22, h: 0.22, d: 1.00, r: 0.04, mat: matte(0x59616e, 0.5), part: 'mast' });

    const inner = new THREE.Group();     // のびる うちがわの はしら
    B.root.add(inner);
    [1, -1].forEach(sz => {
      B.box({ parent: inner, x: 0.74, y: 1.15, z: sz * 0.30, w: 0.13, h: 1.95, d: 0.11, r: 0.03, mat: metalMat(0xb0b8c2, 0.32), part: 'mast' });
    });

    const carriage = new THREE.Group();  // つめを のせる 台
    B.root.add(carriage);
    B.box({ parent: carriage, x: 0.80, y: 0.52, z: 0, w: 0.10, h: 0.86, d: 1.02, r: 0.03, mat: metalMat(0x9099a5, 0.38), part: 'fork' });
    [1, -1].forEach(sz => {
      /* たての ぶぶん */
      B.box({ parent: carriage, x: 0.88, y: 0.44, z: sz * 0.34, w: 0.09, h: 0.78, d: 0.16, r: 0.02, mat: metalMat(0xb9c0ca, 0.3), part: 'fork' });
      /* にもつの 下へ さしこむ ところ */
      B.box({ parent: carriage, x: 1.48, y: 0.075, z: sz * 0.34, w: 1.20, h: 0.075, d: 0.16, r: 0.02, mat: metalMat(0xc8cfd8, 0.26), part: 'fork' });
    });

    /* タイヤ（まえは 大きく、うしろは 小さく まがる）*/
    B.wheel({ x: 0.30, r: 0.33, w: 0.24, spread: 0.52 });
    B.wheel({ x: -1.42, r: 0.27, w: 0.19, spread: 0.36 });

    B.anim('lift', 'つめを 上げる', v => {
      inner.position.y = v * 1.55;
      carriage.position.y = v * 3.05;
    });
  }
};


/* ---------------- はしごの ひとふし（レール＋よこ木）---------------- */
function ladderSection(B, parent, o) {
  const g = new THREE.Group();
  parent.add(g);
  const rail = o.rail, len = o.len, wid = o.wid;
  [1, -1].forEach(sz => {
    B.box({ parent: g, x: len / 2, y: 0, z: sz * (wid / 2), w: len, h: rail, d: rail * 0.55, r: 0.03, mat: metalMat(o.color, 0.34), part: o.part });
  });
  const n = Math.max(3, Math.round(len / 0.42));
  for (let i = 0; i <= n; i++) {
    B.cyl({ parent: g, x: 0.10 + (len - 0.20) * i / n, y: 0, z: 0, r: rail * 0.22, h: wid, axis: 'z', seg: 8, mat: metalMat(0xc3cad3, 0.3), part: o.part });
  }
  return g;
}

/* ---------------------------------------------------------- はしご車 */
MODEL3D.ladder = {
  label: 'はしご車',
  build: function (B) {
    const COL = 0xd8342c;
    const W = 2.46;

    chassis(B, { x: -0.75, y: 0.90, len: 10.5, spread: 0.44 });

    /* うんてんせき */
    truckCab(B, { x: 4.00, len: 2.30, w: W, top: 3.02, floor: 0.96, color: COL });
    lightBar(B, { x: 4.00, y: 3.14, w: 1.75, n: 6, colors: [PAL.lampR, 0xfff0d0], part: 'lamp' });

    /* どうぐを 入れる からだ（シャッターが ならぶ）*/
    B.box({ x: -0.90, y: 1.72, z: 0, w: 6.60, h: 1.36, d: W, r: 0.10, color: COL, part: 'body', rough: 0.3 });
    [1, -1].forEach(sz => {
      for (let i = -1; i <= 1; i++) {
        B.box({ x: -0.90 + i * 2.05, y: 1.68, z: sz * (W / 2 + 0.012), w: 1.80, h: 1.02, d: 0.03, r: 0.04, mat: metalMat(0xc7ced7, 0.4), part: 'door' });
      }
    });
    B.box({ x: -0.90, y: 2.46, z: 0, w: 6.70, h: 0.16, d: W + 0.06, r: 0.05, mat: matte(0x3c434e, 0.6), part: 'body' });

    /* はしごが のる 台（ぐるっと まわる）*/
    B.cyl({ x: -3.10, y: 2.66, z: 0, r: 0.95, h: 0.30, seg: 28, mat: metalMat(0x9aa3ae, 0.38), part: 'ladder' });

    /* ==== のびる はしご（4だん）==== */
    const base = new THREE.Group();
    base.position.set(-3.10, 2.92, 0);
    B.root.add(base);
    const secs = [];
    let parent = base;
    const conf = [
      { len: 6.3, rail: 0.26, wid: 1.05, color: 0xdadfe6 },
      { len: 5.2, rail: 0.22, wid: 0.88, color: 0xe6eaef },
      { len: 4.8, rail: 0.18, wid: 0.72, color: 0xd3d9e1 },
      { len: 4.4, rail: 0.15, wid: 0.58, color: 0xe6eaef }
    ];
    conf.forEach((c, i) => {
      const g = ladderSection(B, parent, { len: c.len, rail: c.rail, wid: c.wid, color: c.color, part: 'ladder' });
      secs.push(g);
      parent = g;
    });
    /* さきの かご（人が のる ところ）*/
    const basket = new THREE.Group();
    basket.position.set(conf[3].len - 0.15, 0, 0);
    secs[3].add(basket);
    B.box({ parent: basket, x: 0, y: -0.30, z: 0, w: 0.80, h: 0.08, d: 0.95, r: 0.03, mat: metalMat(0xc3cad3, 0.32), part: 'basket' });
    [[0.38, 0], [-0.38, 0], [0, 0.46], [0, -0.46]].forEach(([px, pz]) => {
      B.box({ parent: basket, x: px, y: 0.05, z: pz, w: px ? 0.06 : 0.78, h: 0.62, d: pz ? 0.06 : 0.92, r: 0.02, mat: metalMat(0xd6dce4, 0.34), part: 'basket' });
    });
    /* はしごを おこす シリンダー */
    const raise = new THREE.Group();
    raise.position.set(-3.10, 2.30, 0);
    B.root.add(raise);
    [1, -1].forEach(sz => {
      B.cyl({ parent: raise, x: 0.85, y: 0, z: sz * 0.55, r: 0.16, h: 1.60, axis: 'x', seg: 16, mat: matte(0x59616e, 0.5), part: 'ladder' });
      B.cyl({ parent: raise, x: 1.95, y: 0, z: sz * 0.55, r: 0.09, h: 1.10, axis: 'x', seg: 12, mat: metalMat(0xdfe4ea, 0.13), part: 'ladder' });
    });

    /* ==== ふんばる あし ==== */
    B.anim('ashi', 'あしを しまう／ひろげる',
      outriggers(B, { xs: [2.55, -4.70], w: W, color: COL, reach: 1.40, y: 1.06, part: 'ashi' }),
      { start: 1 });

    /* ==== タイヤ ==== */
    B.wheel({ x: 3.80, r: 0.55, w: 0.32, spread: 1.02 });
    [-3.15, -4.50].forEach(ax => {
      [0.90, 1.18, -0.90, -1.18].forEach(z => B.wheel({ x: ax, r: 0.55, w: 0.28, z: z }));
      B.cyl({ x: ax, y: 0.55, z: 0, r: 0.10, h: 2.0, axis: 'z', seg: 14, mat: matte(PAL.frame, 0.6) });
    });
    B.cyl({ x: 3.80, y: 0.55, z: 0, r: 0.10, h: 2.0, axis: 'z', seg: 14, mat: matte(PAL.frame, 0.6) });

    /* うごかす: おこして、中から つぎつぎ のばす */
    B.anim('ladder', 'はしごを のばす', v => {
      base.rotation.z = v * 1.02;
      raise.rotation.z = v * 0.62;
      raise.scale.x = 1 + v * 0.35;
      secs.forEach((g, i) => {
        if (i === 0) return;
        g.position.x = v * (conf[i - 1].len - 0.55);
      });
      basket.rotation.z = -v * 1.02;     /* かごは まっすぐの まま */
    });
  }
};

/* ------------------------------------------------------- きゅうきゅう車 */
MODEL3D.ambulance = {
  label: 'きゅうきゅう車',
  build: function (B) {
    const W = 2.10, WHITE = 0xf2f5f9, RED = 0xd8342c;
    const bot = 0.86, top = 2.98;
    const bx = -0.55, blen = 4.10;      /* うしろの へや */

    chassis(B, { x: 0, y: 0.72, len: 5.3, spread: 0.38 });

    /* ==== うしろの へや（中が 見えるように 箱では なく かべで つくる）==== */
    /* ゆか */
    B.box({ x: bx, y: bot, z: 0, w: blen, h: 0.14, d: W, r: 0.03, color: WHITE, part: 'body', rough: 0.4 });
    /* よこの かべ */
    [1, -1].forEach(sz => {
      B.box({ x: bx, y: (top + bot) / 2 + 0.08, z: sz * (W / 2 - 0.045), w: blen, h: top - bot, d: 0.09, r: 0.06, color: WHITE, part: 'body', rough: 0.28 });
      B.glass({ x: bx + blen * 0.26, y: top - 0.52, z: sz * (W / 2 - 0.02), w: blen * 0.34, h: 0.62, d: 0.07, r: 0.07, part: 'window' });
      /* 赤い ライン */
      B.box({ x: bx, y: bot + 0.72, z: sz * (W / 2 + 0.012), w: blen - 0.10, h: 0.16, d: 0.02, r: 0.01, mat: paint(RED, { rough: 0.3 }) });
    });
    /* やね と まえの かべ */
    B.box({ x: bx, y: top + 0.10, z: 0, w: blen, h: 0.14, d: W, r: 0.06, color: WHITE, part: 'body', rough: 0.3 });
    B.box({ x: bx + blen / 2 - 0.05, y: (top + bot) / 2 + 0.08, z: 0, w: 0.10, h: top - bot, d: W - 0.10, r: 0.04, color: WHITE, part: 'body', rough: 0.3 });

    /* ==== ねたまま はこべる ベッド（ストレッチャー）==== */
    const bed = new THREE.Group();
    bed.position.set(bx - 0.30, 0, 0.16);
    B.root.add(bed);
    B.box({ parent: bed, x: 0, y: 1.62, z: 0, w: 1.95, h: 0.13, d: 0.66, r: 0.05, mat: matte(0xdfe6ee, 0.6), part: 'bed' });
    B.box({ parent: bed, x: 0.62, y: 1.76, z: 0, w: 0.70, h: 0.16, d: 0.62, r: 0.06, rz: -0.42, mat: matte(0xdfe6ee, 0.6), part: 'bed' });
    B.box({ parent: bed, x: 0, y: 1.50, z: 0, w: 1.85, h: 0.10, d: 0.10, r: 0.03, mat: metalMat(0xb9c0ca, 0.3), part: 'bed' });
    [[0.78, 0.28], [0.78, -0.28], [-0.78, 0.28], [-0.78, -0.28]].forEach(([px, pz]) => {
      B.box({ parent: bed, x: px, y: 1.22, z: pz, w: 0.06, h: 0.52, d: 0.06, r: 0.02, mat: metalMat(0xb9c0ca, 0.3), part: 'bed' });
      B.cyl({ parent: bed, x: px, y: 1.00, z: pz, r: 0.07, h: 0.05, axis: 'z', seg: 12, mat: matte(0x2f3640, 0.6), part: 'bed' });
    });

    /* ==== うしろの とびら（2まい・ひらく）==== */
    const rearX = bx - blen / 2;
    const hinges = [];
    [1, -1].forEach(sz => {
      const hinge = new THREE.Group();
      hinge.position.set(rearX, 0, sz * (W / 2 - 0.05));
      B.root.add(hinge);
      B.box({ parent: hinge, x: -0.04, y: (top + bot) / 2 + 0.10, z: -sz * (W / 4 - 0.02), w: 0.09, h: top - bot - 0.02, d: W / 2 - 0.06, r: 0.05, color: WHITE, part: 'door', rough: 0.28 });
      B.glass({ parent: hinge, x: -0.10, y: top - 0.52, z: -sz * (W / 4 - 0.02), w: 0.05, h: 0.60, d: W / 2 - 0.24, r: 0.06, part: 'window' });
      B.lamp({ parent: hinge, x: -0.10, y: bot + 0.30, z: -sz * (W / 4 - 0.02), w: 0.05, h: 0.24, d: 0.16, color: PAL.lampR, strength: 1.0, part: 'lamp' });
      hinges.push({ g: hinge, sz: sz });
    });
    B.anim('door', 'うしろの とびらを あける', v => {
      hinges.forEach(h => { h.g.rotation.y = -h.sz * v * 1.75; });
      bed.position.x = (bx - 0.30) - v * 1.30;      /* ベッドが すこし 出る */
    });

    /* ==== うんてんせき ==== */
    const cx = 2.20, clen = 1.75;
    B.box({ x: cx, y: (2.62 + bot) / 2, z: 0, w: clen, h: 2.62 - bot, d: W, r: 0.20, b: 0.05, color: WHITE, part: 'cab', rough: 0.26 });
    B.glass({ x: cx + clen / 2 - 0.08, y: 2.18, z: 0, w: 0.10, h: 0.92, d: W - 0.26, r: 0.08, rz: -0.16, part: 'window' });
    [1, -1].forEach(sz => {
      B.glass({ x: cx - 0.30, y: 2.14, z: sz * (W / 2 - 0.04), w: 0.90, h: 0.78, d: 0.08, r: 0.07, part: 'window' });
      B.box({ x: cx - 0.20, y: 1.62, z: sz * (W / 2 + 0.03), w: 0.22, h: 0.05, d: 0.05, r: 0.02, mat: metalMat(PAL.chrome, 0.22) });
      B.seam({ x: cx - 0.60, y: 1.90, z: sz * (W / 2 + 0.006), w: 0.028, h: 1.30, d: 0.03, part: 'door' });
      B.cyl({ x: cx + 0.55, y: 2.34, z: sz * (W / 2 + 0.14), r: 0.02, h: 0.28, axis: 'z', mat: metalMat(0x9aa3ae, 0.4), aux: true });
      B.box({ x: cx + 0.55, y: 2.16, z: sz * (W / 2 + 0.26), w: 0.09, h: 0.38, d: 0.14, r: 0.04, mat: matte(0x2a2f38, 0.5), aux: true });
      B.lamp({ x: cx + clen / 2 + 0.02, y: 1.36, z: sz * (W / 2 - 0.26), w: 0.06, h: 0.20, d: 0.30, color: 0xfff2cf, strength: 1.4, part: 'lamp' });
    });
    B.box({ x: cx + clen / 2 - 0.01, y: 1.06, z: 0, w: 0.24, h: 0.30, d: W + 0.02, r: 0.08, mat: matte(0x38404d, 0.55) });
    B.box({ x: cx + clen / 2 + 0.01, y: 1.62, z: 0, w: 0.05, h: 0.26, d: W * 0.66, r: 0.04, mat: matte(0x1e232b, 0.45) });

    /* ==== 赤い ランプ ==== */
    lightBar(B, { x: cx - 0.15, y: 2.80, w: 1.55, n: 6, colors: [PAL.lampR, 0xfff0d0], part: 'lamp' });
    [1, -1].forEach(sz => {
      B.lamp({ x: bx + blen / 2 - 0.10, y: top - 0.10, z: sz * (W / 2 + 0.02), w: 0.16, h: 0.16, d: 0.10, color: PAL.lampR, strength: 1.5, part: 'lamp' });
    });

    /* ==== タイヤ ==== */
    B.wheel({ x: 2.05, r: 0.42, w: 0.26, spread: 0.90 });
    B.wheel({ x: -1.55, r: 0.42, w: 0.26, spread: 0.90 });
  }
};

/* ---------------------------------------------------------- トラクター */
MODEL3D.tractor = {
  label: 'トラクター',
  build: function (B) {
    const COL = 0x2f8f52;

    /* エンジンの ある まえの ぶぶん */
    B.box({ x: 1.05, y: 1.18, z: 0, w: 1.85, h: 0.86, d: 1.10, r: 0.16, color: COL, part: 'body', rough: 0.3 });
    B.box({ x: 1.05, y: 0.76, z: 0, w: 1.70, h: 0.42, d: 0.86, r: 0.08, mat: matte(0x3c434e, 0.6), part: 'body' });
    B.box({ x: 1.98, y: 1.16, z: 0, w: 0.10, h: 0.62, d: 1.00, r: 0.06, mat: matte(0x1e232b, 0.45) });
    [1, -1].forEach(sz => {
      B.lamp({ x: 2.02, y: 1.42, z: sz * 0.38, w: 0.06, h: 0.18, d: 0.24, color: 0xfff2cf, strength: 1.4, part: 'lamp' });
    });
    B.cyl({ x: 1.62, y: 1.90, z: 0.42, r: 0.06, h: 0.70, seg: 12, mat: metalMat(0x8d959f, 0.42) });

    /* うんてんせき */
    const cbot = 1.35, ctop = 2.92;
    B.box({ x: -0.45, y: (ctop + cbot) / 2, z: 0, w: 1.45, h: ctop - cbot, d: 1.55, r: 0.16, b: 0.045, color: COL, part: 'cab', rough: 0.28 });
    B.glass({ x: 0.25, y: (ctop + cbot) / 2 + 0.10, z: 0, w: 0.10, h: (ctop - cbot) * 0.68, d: 1.30, r: 0.07, rz: -0.12, part: 'window' });
    [1, -1].forEach(sz => {
      B.glass({ x: -0.50, y: (ctop + cbot) / 2 + 0.10, z: sz * 0.76, w: 1.10, h: (ctop - cbot) * 0.60, d: 0.07, r: 0.06, part: 'window' });
    });
    B.glass({ x: -1.14, y: (ctop + cbot) / 2 + 0.08, z: 0, w: 0.08, h: (ctop - cbot) * 0.62, d: 1.30, r: 0.07, part: 'window' });
    B.box({ x: -0.45, y: ctop + 0.09, z: 0, w: 1.55, h: 0.12, d: 1.62, r: 0.06, color: 0xe8ecf1, part: 'cab', rough: 0.4 });
    B.lamp({ x: 0.15, y: ctop + 0.14, z: 0.62, w: 0.14, h: 0.10, d: 0.22, color: 0xfff2cf, strength: 1.2, part: 'lamp' });
    B.lamp({ x: 0.15, y: ctop + 0.14, z: -0.62, w: 0.14, h: 0.10, d: 0.22, color: 0xfff2cf, strength: 1.2, part: 'lamp' });

    /* まえの タイヤ（小さい）・うしろの タイヤ（人の せの 高さほど）*/
    B.wheel({ x: 1.30, r: 0.46, w: 0.32, spread: 0.72 });
    B.cyl({ x: 1.30, y: 0.46, z: 0, r: 0.10, h: 1.30, axis: 'z', seg: 12, mat: matte(PAL.frame, 0.6) });
    B.wheel({ x: -0.75, r: 0.84, w: 0.52, spread: 0.86, part: 'bigtire' });
    /* うしろの タイヤの どろよけ */
    [1, -1].forEach(sz => {
      B.mesh(curvedPlateGeom(0.98, 0.06, 0.62, 2.52, 0.60, 16), paint(COL, { rough: 0.34 }),
        { x: -0.75, y: 0.84, z: sz * 0.90, part: 'bigtire' });
    });

    /* うしろに つける「たがやす きかい」（ロータリー）*/
    const rot = new THREE.Group();
    rot.position.set(-1.55, 0.86, 0);
    B.root.add(rot);
    B.box({ parent: rot, x: -0.42, y: 0.22, z: 0, w: 0.95, h: 0.42, d: 1.95, r: 0.08, color: COL, part: 'rotary', rough: 0.34 });
    B.box({ parent: rot, x: -0.42, y: -0.06, z: 0, w: 0.90, h: 0.30, d: 1.86, r: 0.05, mat: matte(0x4a525f, 0.6), part: 'rotary' });
    B.box({ parent: rot, x: -0.90, y: -0.18, z: 0, w: 0.16, h: 0.68, d: 1.90, r: 0.04, rz: 0.35, mat: metalMat(0x9099a5, 0.42), part: 'rotary' });
    const blades = new THREE.Group();
    blades.position.set(-0.42, -0.28, 0);
    rot.add(blades);
    B.cyl({ parent: blades, x: 0, y: 0, z: 0, r: 0.13, h: 1.80, axis: 'z', seg: 14, mat: metalMat(0x8d959f, 0.4), part: 'rotary' });
    for (let i = 0; i < 12; i++) {
      const a = (i / 6) * Math.PI, z = (-2.5 + (i % 6)) * 0.30;
      B.box({
        parent: blades, x: Math.cos(a) * 0.26, y: Math.sin(a) * 0.26, z: z,
        w: 0.34, h: 0.09, d: 0.06, r: 0.02, rz: a, mat: metalMat(0xb9c0ca, 0.3), part: 'rotary'
      });
    }
    B.spin.push({ obj: blades, axis: 'z', speed: 0 });
    /* 三てんリンク（つなぐ うで）*/
    [1, -1].forEach(sz => {
      B.box({ x: -1.15, y: 0.78, z: sz * 0.55, w: 0.85, h: 0.11, d: 0.11, r: 0.03, mat: matte(0x59616e, 0.5), part: 'rotary' });
    });

    B.anim('rotary', 'きかいを 下ろして たがやす', v => {
      rot.position.y = 0.86 - v * 0.30;
      rot.rotation.z = -v * 0.10;
      B.spin[0].speed = v * 7.0;
    });
  }
};


/* ------------------------------------------------------- ロードローラー */
MODEL3D.roller = {
  label: 'ロードローラー',
  build: function (B) {
    const COL = 0xf0b21c;

    /* 中に 水を 入れて もっと おもく できる てつの ローラー（前と うしろ）*/
    [[1.62, 0.66, 2.00], [-1.62, 0.62, 1.86]].forEach(([px, rr, ww]) => {
      B.cyl({ x: px, y: rr, z: 0, r: rr, h: ww, axis: 'z', seg: 44, mat: metalMat(0xb9c0ca, 0.22), part: 'roller' });
      B.cyl({ x: px, y: rr, z: 0, r: rr * 1.01, h: ww * 0.12, axis: 'z', seg: 44, mat: metalMat(0x8f98a3, 0.3), part: 'roller' });
      [1, -1].forEach(sz => {
        B.cyl({ x: px, y: rr, z: sz * ww / 2, r: rr * 0.34, h: 0.10, axis: 'z', seg: 22, mat: matte(0x4a525f, 0.5), part: 'roller' });
        /* ローラーを ささえる わく */
        B.box({ x: px + (px > 0 ? -0.42 : 0.42), y: rr + 0.30, z: sz * (ww / 2 + 0.10), w: 0.95, h: 0.34, d: 0.16, r: 0.04, mat: matte(0x59616e, 0.55), part: 'roller' });
      });
      /* 水を 入れる くち */
      B.box({ x: px, y: rr * 2 - 0.04, z: 0, w: 0.22, h: 0.10, d: 0.22, r: 0.03, mat: metalMat(0x8f98a3, 0.3), part: 'roller' });
    });

    /* からだ（エンジン）*/
    B.box({ x: -0.90, y: 1.42, z: 0, w: 1.95, h: 0.98, d: 1.62, r: 0.14, color: COL, part: 'body', rough: 0.3 });
    B.box({ x: 0.30, y: 1.10, z: 0, w: 0.95, h: 0.42, d: 1.10, r: 0.06, mat: matte(0x59616e, 0.55), part: 'body' });
    B.cyl({ x: -1.30, y: 2.12, z: 0.50, r: 0.075, h: 0.55, seg: 12, mat: metalMat(0x8d959f, 0.42) });

    /* ざせき — はしが 見えるように 高く、よこへ ずらせる */
    const seat = new THREE.Group();
    seat.position.set(0.55, 0, 0);
    B.root.add(seat);
    B.box({ parent: seat, x: 0, y: 1.52, z: 0, w: 1.35, h: 0.14, d: 1.30, r: 0.05, mat: matte(0x3c434e, 0.6), part: 'seat' });
    B.box({ parent: seat, x: -0.12, y: 1.80, z: 0, w: 0.62, h: 0.42, d: 0.66, r: 0.08, mat: matte(0x2f3640, 0.7), part: 'seat' });
    B.box({ parent: seat, x: -0.42, y: 2.18, z: 0, w: 0.14, h: 0.58, d: 0.62, r: 0.06, mat: matte(0x2f3640, 0.7), part: 'seat' });
    B.mesh(new THREE.TorusGeometry(0.20, 0.028, 8, 22), matte(0x22262d, 0.6),
      { parent: seat, x: 0.42, y: 1.98, z: 0, ry: Math.PI / 2, rz: -0.5, part: 'seat' });
    /* 人を まもる やね */
    [[0.52, 0.56], [0.52, -0.56], [-0.52, 0.56], [-0.52, -0.56]].forEach(([px, pz]) => {
      B.box({ parent: seat, x: px, y: 2.22, z: pz, w: 0.09, h: 1.40, d: 0.09, r: 0.03, mat: matte(0x3c434e, 0.55), part: 'seat' });
    });
    B.box({ parent: seat, x: 0, y: 2.96, z: 0, w: 1.40, h: 0.10, d: 1.42, r: 0.05, color: COL, part: 'seat', rough: 0.4 });
    B.lamp({ parent: seat, x: 0.55, y: 2.90, z: 0.52, w: 0.14, h: 0.10, d: 0.22, color: 0xfff2cf, strength: 1.2, part: 'lamp' });

    B.anim('seat', 'ざせきを よこへ ずらす', v => { seat.position.z = v * 0.62; });
  }
};

/* ------------------------------------------------------- タンクローリー */
MODEL3D.tanker = {
  label: 'タンクローリー',
  build: function (B) {
    const COL = 0xd8342c, W = 2.44;

    chassis(B, { x: -0.6, y: 0.90, len: 9.8, spread: 0.44, tank: { x: 1.60, z: 1.02 } });
    truckCab(B, { x: 3.85, len: 2.25, w: W, top: 3.24, floor: 1.00, color: COL, deflector: true });

    /* うしろが まるくて 大きな タンク（中は いくつかの へやに 分かれる）*/
    const prof = [
      [0.03, -3.20], [0.55, -3.16], [0.90, -3.00], [1.06, -2.72],
      [1.12, -2.30], [1.14, 0], [1.12, 2.30], [1.06, 2.72],
      [0.90, 3.00], [0.55, 3.16], [0.03, 3.20]
    ].map(p => new THREE.Vector2(p[0], p[1]));
    const geo = new THREE.LatheGeometry(prof, 44);
    geo.computeVertexNormals();
    B.mesh(geo, metalMat(0xd7dde5, 0.20), { x: -0.75, y: 2.24, z: 0, rz: Math.PI / 2, part: 'tank' });
    /* へやの さかいめ（4つの へや）*/
    [-1.9, -0.6, 0.7, 2.0].forEach(dx => {
      B.mesh(new THREE.TorusGeometry(1.15, 0.055, 10, 34), metalMat(0x9aa3ae, 0.32),
        { x: -0.75 + dx, y: 2.24, z: 0, ry: Math.PI / 2, part: 'tank' });
    });
    /* 上の マンホールと 手すり */
    [-2.4, -1.1, 0.2, 1.5, 2.8].forEach(dx => {
      B.cyl({ x: -0.75 + dx, y: 3.42, z: 0, r: 0.24, h: 0.14, seg: 18, mat: metalMat(0xb9c0ca, 0.28), part: 'tank' });
    });
    [1, -1].forEach(sz => {
      B.box({ x: -0.75, y: 3.52, z: sz * 0.62, w: 6.10, h: 0.06, d: 0.06, r: 0.02, mat: metalMat(0x9aa3ae, 0.35), part: 'tank' });
      for (let i = -2; i <= 2; i++) {
        B.box({ x: -0.75 + i * 1.45, y: 3.42, z: sz * 0.62, w: 0.06, h: 0.24, d: 0.06, r: 0.02, mat: metalMat(0x9aa3ae, 0.35), part: 'tank' });
      }
      /* よこの 箱（ポンプや メーター）*/
      B.box({ x: -0.20, y: 1.42, z: sz * (W / 2 - 0.10), w: 2.10, h: 0.86, d: 0.32, r: 0.06, color: COL, part: 'tank', rough: 0.32 });
    });
    B.box({ x: -3.95, y: 2.10, z: 0, w: 0.24, h: 1.30, d: W - 0.30, r: 0.06, mat: metalMat(0xb9c0ca, 0.3), part: 'tank' });

    /* よこに ながい ホースを まいて しまって ある */
    const reelG = new THREE.Group();
    reelG.position.set(1.10, 1.46, -(W / 2 - 0.05));
    B.root.add(reelG);
    B.mesh(new THREE.TorusGeometry(0.44, 0.115, 12, 30), matte(0x2b3038, 0.75),
      { parent: reelG, ry: Math.PI / 2, part: 'hose' });
    B.mesh(new THREE.TorusGeometry(0.30, 0.115, 12, 30), matte(0x33393f, 0.75),
      { parent: reelG, ry: Math.PI / 2, part: 'hose' });
    B.cyl({ parent: reelG, x: 0, y: 0, z: 0, r: 0.16, h: 0.34, axis: 'z', seg: 18, mat: metalMat(0x8f98a3, 0.35), part: 'hose' });
    /* 出て くる ホース */
    const outG = new THREE.Group();
    reelG.add(outG);
    B.cyl({ parent: outG, x: 0, y: -0.62, z: -0.20, r: 0.075, h: 1.10, seg: 12, mat: matte(0x2b3038, 0.7), part: 'hose' });
    B.cyl({ parent: outG, x: 0, y: -1.18, z: -0.20, r: 0.085, h: 0.22, seg: 12, mat: metalMat(0xb9c0ca, 0.3), part: 'hose' });
    outG.scale.y = 0.001;

    B.anim('hose', 'ホースを 下ろす', v => {
      outG.scale.y = 0.001 + v;
      reelG.rotation.z = -v * 3.4;
    });

    /* タイヤ */
    B.wheel({ x: 3.60, r: 0.56, w: 0.34, spread: 1.02 });
    [-2.60, -3.95].forEach(ax => {
      [0.90, 1.19, -0.90, -1.19].forEach(z => B.wheel({ x: ax, r: 0.56, w: 0.30, z: z }));
      B.cyl({ x: ax, y: 0.56, z: 0, r: 0.11, h: 2.05, axis: 'z', seg: 14, mat: matte(PAL.frame, 0.6) });
    });
    B.cyl({ x: 3.60, y: 0.56, z: 0, r: 0.11, h: 2.05, axis: 'z', seg: 14, mat: matte(PAL.frame, 0.6) });
  }
};

/* ---------------------------------------------------------- レッカー車 */
MODEL3D.wrecker = {
  label: 'レッカー車',
  build: function (B) {
    const COL = 0x2f8f52, W = 2.36;

    chassis(B, { x: -0.4, y: 0.88, len: 7.4, spread: 0.42, tank: { x: 1.20, z: 0.98 } });
    truckCab(B, { x: 2.55, len: 2.10, w: W, top: 3.02, floor: 0.96, color: COL });
    lightBar(B, { x: 2.55, y: 3.14, w: 1.60, n: 6, colors: [PAL.lampY, 0xfff0d0], part: 'lamp' });

    /* どうぐを 入れる からだ */
    B.box({ x: -1.10, y: 1.62, z: 0, w: 4.10, h: 1.16, d: W, r: 0.10, color: COL, part: 'body', rough: 0.3 });
    [1, -1].forEach(sz => {
      for (let i = -1; i <= 1; i++) {
        B.box({ x: -1.10 + i * 1.30, y: 1.58, z: sz * (W / 2 + 0.012), w: 1.10, h: 0.86, d: 0.03, r: 0.04, mat: metalMat(0xc7ced7, 0.4), part: 'door' });
      }
    });
    B.box({ x: -1.10, y: 2.26, z: 0, w: 4.20, h: 0.14, d: W + 0.05, r: 0.05, mat: matte(0x3c434e, 0.6), part: 'body' });
    /* つなを まく きかい */
    B.cyl({ x: 0.55, y: 2.52, z: 0, r: 0.28, h: 1.00, axis: 'z', seg: 22, mat: metalMat(0x8f98a3, 0.35), part: 'winch' });

    /* うしろへ のびる うで（ブーム）*/
    const boom = new THREE.Group();
    boom.position.set(-0.60, 2.44, 0);
    boom.rotation.z = Math.PI - 0.30;          /* うしろ むきに、すこし 上げて */
    B.root.add(boom);
    B.box({ parent: boom, x: 1.35, y: 0, z: 0, w: 2.90, h: 0.52, d: 0.62, r: 0.10, color: COL, part: 'arm', rough: 0.3 });
    B.cyl({ parent: boom, x: 0, y: 0, z: 0, r: 0.32, h: 0.72, axis: 'z', seg: 20, mat: metalMat(0x9aa3ae, 0.38), part: 'arm' });

    const ext = new THREE.Group();
    ext.position.set(2.55, 0, 0);
    boom.add(ext);
    B.box({ parent: ext, x: 1.05, y: 0, z: 0, w: 2.30, h: 0.40, d: 0.48, r: 0.08, mat: paint(0x4fb377, { rough: 0.32 }), part: 'arm' });
    B.cyl({ parent: ext, x: 2.20, y: 0, z: 0, r: 0.20, h: 0.52, axis: 'z', seg: 18, mat: metalMat(0xb9c0ca, 0.3), part: 'arm' });

    /* うでを おこす シリンダー */
    const ram = new THREE.Group();
    ram.position.set(0.35, 1.95, 0);
    B.root.add(ram);
    [1, -1].forEach(sz => {
      B.cyl({ parent: ram, x: -0.72, y: 0, z: sz * 0.44, r: 0.14, h: 1.35, axis: 'x', seg: 14, mat: matte(0x59616e, 0.5), part: 'arm' });
    });
    ram.rotation.z = 0.22;

    /* つりさげる フック（まっすぐ 下を むく）*/
    const hang = new THREE.Group();
    hang.rotation.z = -(Math.PI - 0.30);
    ext.add(hang);
    hang.position.set(2.20, 0, 0);
    B.cyl({ parent: hang, x: 0, y: -0.75, z: 0, r: 0.03, h: 1.50, axis: 'y', seg: 8, mat: metalMat(0x9aa3ae, 0.35) });
    B.box({ parent: hang, x: 0, y: -1.66, z: 0, w: 0.36, h: 0.42, d: 0.32, r: 0.09, mat: metalMat(0x2f3d52, 0.35), part: 'hook' });
    B.mesh(new THREE.TorusGeometry(0.22, 0.062, 12, 24, Math.PI * 1.45),
      metalMat(0xd8dee6, 0.25), { parent: hang, x: 0, y: -2.06, z: 0, rz: Math.PI * 0.28, part: 'hook' });

    B.anim('arm', 'うでを のばす', v => {
      ext.position.x = 2.55 + v * 1.70;
      boom.rotation.z = Math.PI - 0.30 - v * 0.22;
      ram.scale.x = 1 + v * 0.30;
    });

    /* タイヤ */
    B.wheel({ x: 2.35, r: 0.53, w: 0.32, spread: 0.98 });
    B.wheel({ x: -1.95, r: 0.53, w: 0.28, z: 0.86 });
    B.wheel({ x: -1.95, r: 0.53, w: 0.28, z: 1.14 });
    B.wheel({ x: -1.95, r: 0.53, w: 0.28, z: -0.86 });
    B.wheel({ x: -1.95, r: 0.53, w: 0.28, z: -1.14 });
    [2.35, -1.95].forEach(ax => {
      B.cyl({ x: ax, y: 0.53, z: 0, r: 0.10, h: 2.0, axis: 'z', seg: 14, mat: matte(PAL.frame, 0.6) });
    });
  }
};

export { createViewer, MODEL3D, Builder, THREE, PAL, paint, metalMat, matte, glassMat };
