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
  grainTex.anisotropy = 8;
  return grainTex;
}

/* 「ゆず肌」— 本物の 車の 塗装に ある、ごく 小さな 波うち。
   クリアコートの 法線を すこしだけ ゆがめると、うつりこみが
   本物の 塗装の ように ゆらいで 見える */
let peelTex = null;
function orangePeelTexture() {
  if (peelTex) return peelTex;
  const N = 128;
  let seed = 987654321;
  const rnd = () => (seed = (seed * 1103515245 + 12345) & 0x7fffffff) / 0x7fffffff;
  /* たかさの マップを つくって、2回 ならして なだらかに する */
  let h = new Float32Array(N * N);
  for (let i = 0; i < h.length; i++) h[i] = rnd();
  for (let pass = 0; pass < 2; pass++) {
    const s = new Float32Array(N * N);
    for (let y = 0; y < N; y++) for (let x = 0; x < N; x++) {
      let sum = 0;
      for (let dy = -1; dy <= 1; dy++) for (let dx = -1; dx <= 1; dx++) {
        sum += h[((y + dy + N) % N) * N + ((x + dx + N) % N)];
      }
      s[y * N + x] = sum / 9;
    }
    h = s;
  }
  /* たかさの さから 法線を つくる */
  const c = document.createElement('canvas');
  c.width = c.height = N;
  const g = c.getContext('2d');
  const img = g.createImageData(N, N);
  for (let y = 0; y < N; y++) for (let x = 0; x < N; x++) {
    const dx = h[y * N + ((x + 1) % N)] - h[y * N + ((x - 1 + N) % N)];
    const dy = h[((y + 1) % N) * N + x] - h[((y - 1 + N) % N) * N + x];
    const i = (y * N + x) * 4;
    img.data[i]     = 128 + Math.max(-127, Math.min(127, dx * 900));
    img.data[i + 1] = 128 + Math.max(-127, Math.min(127, dy * 900));
    img.data[i + 2] = 255;
    img.data[i + 3] = 255;
  }
  g.putImageData(img, 0, 0);
  peelTex = new THREE.CanvasTexture(c);
  peelTex.wrapS = peelTex.wrapT = THREE.RepeatWrapping;
  peelTex.repeat.set(5, 5);
  return peelTex;
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
    clearcoatNormalMap: orangePeelTexture(),
    clearcoatNormalScale: new THREE.Vector2(0.10, 0.10),
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
    anisotropy: 0.35,          /* ひきのばした ような うつりこみ（ヘアライン仕上げ） */
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
  treadTex.anisotropy = 8;
  return treadTex;
}

/* タイヤの 下の ちいさな 影（せっち した ところが いちばん 暗い） */
let wheelShadowTex = null;
function wheelShadowTexture() {
  if (wheelShadowTex) return wheelShadowTex;
  const c = document.createElement('canvas');
  c.width = c.height = 128;
  const g = c.getContext('2d');
  const grd = g.createRadialGradient(64, 64, 4, 64, 64, 62);
  grd.addColorStop(0, 'rgba(10,14,22,0.55)');
  grd.addColorStop(0.4, 'rgba(14,18,28,0.28)');
  grd.addColorStop(1, 'rgba(14,18,28,0)');
  g.fillStyle = grd; g.fillRect(0, 0, 128, 128);
  wheelShadowTex = new THREE.CanvasTexture(c);
  return wheelShadowTex;
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
        mm.bumpMap = treadTexture();          /* みぞが 立体に 見える */
        mm.bumpScale = 0.9;
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

      /* せっち した ところの 影（うかせて ある タイヤには つけない） */
      if (!o.lift) {
        const blob = new THREE.Mesh(
          new THREE.PlaneGeometry(r * 2.3, Math.max(w * 2.3, r * 1.2)),
          new THREE.MeshBasicMaterial({ map: wheelShadowTexture(), transparent: true, depthWrite: false })
        );
        blob.rotation.x = -Math.PI / 2;
        blob.position.set(o.x, 0.012, z);
        blob.renderOrder = -1;
        blob.userData.aux = true;
        blob.userData.jzGroundFx = true;   /* 床の うつりこみには 入れない */
        blob.castShadow = blob.receiveShadow = false;
        (o.parent || this.root).add(blob);
      }
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
    if (o.ry) m.rotation.y = o.ry;
    if (o.rz) m.rotation.z = o.rz;
    (o.parent || this.root).add(m);
    m.castShadow = false;
    const reg = this._register(m, o.part, o.aux);
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

/* スタジオの 床 — みがいた コンクリート。
   ほんの すこしの シミ・つぶつぶ・みがきムラを 入れると、
   のっぺりした CGの 床では なく なる */
let concreteTex = null;
function concreteTextures() {
  if (concreteTex) return concreteTex;
  let seed = 424243;
  const rnd = () => (seed = (seed * 1103515245 + 12345) & 0x7fffffff) / 0x7fffffff;

  const c = document.createElement('canvas');
  c.width = c.height = 512;
  const g = c.getContext('2d');
  const grd = g.createRadialGradient(256, 256, 40, 256, 256, 256);
  grd.addColorStop(0, '#bcc7d5');
  grd.addColorStop(0.55, '#a8b5c6');
  grd.addColorStop(1, '#8593a6');
  g.fillStyle = grd; g.fillRect(0, 0, 512, 512);

  /* 大きな うすい シミ */
  for (let i = 0; i < 26; i++) {
    const x = rnd() * 512, y = rnd() * 512, r = 30 + rnd() * 90;
    const s = g.createRadialGradient(x, y, 2, x, y, r);
    const dark = rnd() > 0.45;
    s.addColorStop(0, dark ? 'rgba(70,82,100,0.055)' : 'rgba(235,240,248,0.05)');
    s.addColorStop(1, 'rgba(0,0,0,0)');
    g.fillStyle = s;
    g.beginPath(); g.arc(x, y, r, 0, Math.PI * 2); g.fill();
  }
  /* 骨材の つぶつぶ */
  for (let i = 0; i < 7000; i++) {
    const x = rnd() * 512, y = rnd() * 512;
    const dark = rnd() > 0.5;
    g.fillStyle = dark
      ? 'rgba(58,68,84,' + (0.04 + rnd() * 0.09).toFixed(3) + ')'
      : 'rgba(240,244,250,' + (0.04 + rnd() * 0.08).toFixed(3) + ')';
    g.fillRect(x, y, 1 + rnd() * 1.4, 1 + rnd() * 1.4);
  }
  const map = new THREE.CanvasTexture(c);
  map.colorSpace = THREE.SRGBColorSpace;
  map.anisotropy = 8;

  /* みがきムラ（つやの ちがい）— roughness マップ */
  const rc = document.createElement('canvas');
  rc.width = rc.height = 256;
  const rg = rc.getContext('2d');
  rg.fillStyle = '#9a9a9a'; rg.fillRect(0, 0, 256, 256);
  for (let i = 0; i < 40; i++) {
    const x = rnd() * 256, y = rnd() * 256, r = 20 + rnd() * 60;
    const s = rg.createRadialGradient(x, y, 2, x, y, r);
    const v = 120 + Math.floor(rnd() * 90);
    s.addColorStop(0, 'rgba(' + v + ',' + v + ',' + v + ',0.5)');
    s.addColorStop(1, 'rgba(0,0,0,0)');
    rg.fillStyle = s;
    rg.beginPath(); rg.arc(x, y, r, 0, Math.PI * 2); rg.fill();
  }
  const rough = new THREE.CanvasTexture(rc);
  rough.anisotropy = 8;

  concreteTex = { map: map, rough: rough };
  return concreteTex;
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
  renderer.shadowMap.autoUpdate = false;   /* うつりこみ用の 2回目の えがきで 影を 焼きなおさない */
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
  const groundTex = concreteTextures();
  const ground = new THREE.Mesh(
    new THREE.CircleGeometry(Math.max(20, span * 2.2), 64),
    new THREE.MeshStandardMaterial({
      map: groundTex.map, color: 0xffffff,
      roughness: 0.62, roughnessMap: groundTex.rough,
      metalness: 0.0, envMapIntensity: 0.45
    })
  );
  ground.rotation.x = -Math.PI / 2;
  ground.receiveShadow = true;
  scene.add(ground);
  const contact = contactShadow(size.x * 1.45, size.z * 2.0);
  scene.add(contact);

  /* --- 床の うつりこみ ---
     車を 床(y=0)で 鏡うつしに した ところから もう一度 えがき、
     その 絵を 床に うっすら まぜる。みがいた ゆかに 車が うつって、
     ショールームの 写真の ように 見える */
  const groundFx = [];
  car.traverse(o => { if (o.userData.jzGroundFx) groundFx.push(o); });
  const reflRT = new THREE.WebGLRenderTarget(1024, 1024, {
    generateMipmaps: true,
    minFilter: THREE.LinearMipmapLinearFilter,
    magFilter: THREE.LinearFilter
  });
  const reflCam = new THREE.PerspectiveCamera();
  const reflMat4 = new THREE.Matrix4();

  ground.material.onBeforeCompile = shader => {
    shader.uniforms.tJzReflect = { value: reflRT.texture };
    shader.uniforms.jzRefMat = { value: reflMat4 };
    shader.vertexShader = shader.vertexShader
      .replace('#include <common>', '#include <common>\nuniform mat4 jzRefMat;\nvarying vec4 vJzRefUv;')
      .replace('#include <project_vertex>', '#include <project_vertex>\nvJzRefUv = jzRefMat * (modelMatrix * vec4(transformed, 1.0));');
    shader.fragmentShader = shader.fragmentShader
      .replace('#include <common>', '#include <common>\nuniform sampler2D tJzReflect;\nvarying vec4 vJzRefUv;')
      .replace('#include <opaque_fragment>',
        'vec4 jzRef = textureLod(tJzReflect, vJzRefUv.xy / vJzRefUv.w, 1.5);\n' +
        'float jzNoV = clamp(dot(normal, normalize(vViewPosition)), 0.0, 1.0);\n' +
        'float jzW = (0.45 + 0.50 * pow(1.0 - jzNoV, 3.0)) * (1.0 - 0.8 * roughnessFactor);\n' +
        'outgoingLight = mix(outgoingLight, jzRef.rgb, clamp(jzW, 0.0, 0.65) * jzRef.a);\n' +
        '#include <opaque_fragment>');
  };
  ground.material.needsUpdate = true;

  function renderReflection() {
    /* 主カメラを 床で うら返した カメラを つくる */
    reflCam.position.set(camera.position.x, -camera.position.y, camera.position.z);
    reflCam.up.set(0, -1, 0);
    const t = orbit.target;
    reflCam.lookAt(t.x, -t.y, t.z);
    reflCam.updateMatrixWorld();
    reflCam.projectionMatrix.copy(camera.projectionMatrix);
    reflMat4.set(
      0.5, 0, 0, 0.5,
      0, 0.5, 0, 0.5,
      0, 0, 0.5, 0.5,
      0, 0, 0, 1
    ).multiply(reflCam.projectionMatrix).multiply(reflCam.matrixWorldInverse);

    /* 床じしん・床の 上の 影・背景は うつりこみに 入れない。
       背景まで まぜると 床ぜんたいが 白っぽく なって、影が きえて しまう。
       とうめいで えがいて、車の うつった ところだけ（アルファ）を まぜる */
    ground.visible = false; contact.visible = false; grid.visible = false;
    groundFx.forEach(m => { m.visible = false; });
    const prevBg = scene.background;
    const prevColor = new THREE.Color();
    renderer.getClearColor(prevColor);
    const prevAlpha = renderer.getClearAlpha();
    scene.background = null;
    renderer.setClearColor(0x000000, 0);
    const prevRT = renderer.getRenderTarget();
    renderer.setRenderTarget(reflRT);
    renderer.render(scene, reflCam);
    renderer.setRenderTarget(prevRT);
    renderer.setClearColor(prevColor, prevAlpha);
    scene.background = prevBg;
    ground.visible = true; contact.visible = true; grid.visible = gridOn;
    groundFx.forEach(m => { m.visible = true; });
  }

  const grid = meterGrid(Math.ceil(Math.max(16, span * 1.6)));
  scene.add(grid);
  let gridOn = false;
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

    /* 地面に ちかい ところほど 光が まわりこみにくい（かんきょう遮蔽）。
       車の 下が ほんのり 暗くなり、ういて 見えなく なる。
       光る ライトと 影用の 板には かけない */
    const isLamp = (o.material.emissiveIntensity || 0) > 0.5;
    if (!isLamp && !o.material.isMeshBasicMaterial) {
      o.material.onBeforeCompile = shader => {
        shader.vertexShader = shader.vertexShader
          .replace('#include <common>', '#include <common>\nvarying float vJzY;')
          .replace('#include <project_vertex>', 'vJzY = (modelMatrix * vec4(transformed, 1.0)).y;\n#include <project_vertex>');
        shader.fragmentShader = shader.fragmentShader
          .replace('#include <common>', '#include <common>\nvarying float vJzY;')
          .replace('#include <dithering_fragment>', 'gl_FragColor.rgb *= 0.80 + 0.20 * smoothstep(0.02, 1.25, vJzY);\n#include <dithering_fragment>');
      };
      o.material.needsUpdate = true;
    }
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
    renderer.shadowMap.needsUpdate = true;   /* 影は 1フレームに 1回だけ 焼く */
    renderReflection();
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
      ground.material.envMapIntensity = dark ? 0.16 : 0.45;
      renderer.toneMappingExposure = dark ? 0.80 : 0.85;
      applyHighlight();
    },

    showRuler(on) { gridOn = !!on; grid.visible = gridOn; kid.visible = !!on; },
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
      reflRT.dispose();
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

/* =========================================================================
   7b. こまかい 部品の 道具（全車で つかいまわす）
   ========================================================================= */

/* ドアハンドル — くぼみ ＋ にぎり ＋ かぎあな */
function doorHandle(B, o) {
  const s = o.s === undefined ? (o.z >= 0 ? 1 : -1) : o.s;
  B.box({ x: o.x, y: o.y, z: o.z, w: o.len || 0.30, h: 0.10, d: 0.022, r: 0.035,
    mat: matte(0x1f242c, 0.5), aux: true, parent: o.parent });
  B.box({ x: o.x - 0.02, y: o.y + 0.012, z: o.z + s * 0.020, w: (o.len || 0.30) * 0.72, h: 0.042, d: 0.034, r: 0.018,
    mat: o.dark ? matte(0x30363f, 0.4) : metalMat(PAL.chrome, 0.18), aux: true, parent: o.parent });
  B.cyl({ x: o.x + (o.len || 0.30) * 0.36, y: o.y - 0.005, z: o.z + s * 0.012, r: 0.015, h: 0.018, axis: 'z', seg: 10,
    mat: metalMat(0x8b939e, 0.4), aux: true, parent: o.parent });
}

/* トラックの サイドミラー — うでに 大小 2まいの かがみ。
   かがみの めん（うちがわ）に あかるい 金属を はって、本物の ように 光る */
function truckMirror(B, o) {
  const s = o.s, armM = metalMat(0x8f98a3, 0.35);
  const zArm = o.zOut - 0.02;
  /* うで（うえの よこぼう と 下ささえ） */
  B.cyl({ x: o.x, y: o.y, z: s * (o.zIn + (zArm - o.zIn) / 2), r: 0.020, h: zArm - o.zIn, axis: 'z', mat: armM, aux: true, parent: o.parent });
  B.cyl({ x: o.x, y: o.y - 0.34, z: s * (o.zIn + (zArm - o.zIn) / 2), r: 0.017, h: zArm - o.zIn, axis: 'z', mat: armM, aux: true, parent: o.parent });
  B.cyl({ x: o.x, y: o.y - 0.17, z: s * zArm, r: 0.018, h: 0.42, axis: 'y', mat: armM, aux: true, parent: o.parent });
  /* おおきい かがみ */
  const mh = o.h || 0.52;
  B.box({ x: o.x, y: o.y - 0.17, z: s * (o.zOut + 0.055), w: 0.085, h: mh, d: 0.26, r: 0.05,
    mat: matte(0x262b33, 0.45), aux: true, parent: o.parent });
  B.box({ x: o.x - 0.048, y: o.y - 0.17, z: s * (o.zOut + 0.055), w: 0.012, h: mh - 0.06, d: 0.21, r: 0.04,
    mat: metalMat(0xd9e3ec, 0.05), aux: true, parent: o.parent });
  /* ちいさい ひろがりかがみ（下がわ） */
  B.box({ x: o.x, y: o.y - 0.17 - mh / 2 - 0.13, z: s * (o.zOut + 0.05), w: 0.075, h: 0.19, d: 0.19, r: 0.05,
    mat: matte(0x262b33, 0.45), aux: true, parent: o.parent });
  B.box({ x: o.x - 0.042, y: o.y - 0.17 - mh / 2 - 0.13, z: s * (o.zOut + 0.05), w: 0.012, h: 0.15, d: 0.15, r: 0.04,
    mat: metalMat(0xd9e3ec, 0.05), aux: true, parent: o.parent });
}

/* じょうよう車の ドアミラー */
function doorMirror(B, o) {
  const s = o.s;
  const bodyMat = o.mat || paint(o.color === undefined ? 0x2a2f38 : o.color, { rough: 0.3 });
  B.box({ x: o.x, y: o.y, z: o.z + s * 0.10, w: 0.06, h: 0.045, d: 0.20, r: 0.02,
    mat: bodyMat, aux: true, parent: o.parent });
  B.box({ x: o.x - 0.02, y: o.y + 0.06, z: o.z + s * 0.21, w: 0.16, h: 0.15, d: 0.10, r: 0.045,
    mat: bodyMat, aux: true, parent: o.parent });
  B.box({ x: o.x - 0.09, y: o.y + 0.06, z: o.z + s * 0.21, w: 0.012, h: 0.115, d: 0.075, r: 0.03,
    mat: metalMat(0xd9e3ec, 0.05), aux: true, parent: o.parent });
}

/* ワイパー — まどの めんに そって ならぶ 2本 */
function wipers(B, o) {
  const n = o.n === undefined ? 2 : o.n;
  for (let i = 0; i < n; i++) {
    const z = (o.z || 0) + (-(n - 1) / 2 + i) * (o.gap || 0.62);
    const g = new THREE.Group();
    g.position.set(o.x, o.y, z);
    g.rotation.z = o.rz || 0;
    if (o.ry) g.rotation.y = o.ry;
    (o.parent || B.root).add(g);
    const a = (o.a === undefined ? 0.42 : o.a) * (i % 2 === 0 ? 1 : 0.88);
    const arm = new THREE.Group();
    arm.rotation.x = a;
    g.add(arm);
    const L = o.len || 0.55;
    B.box({ parent: arm, x: 0.012, y: L * 0.42, z: 0, w: 0.020, h: L * 0.84, d: 0.030, r: 0.008,
      mat: matte(0x14181e, 0.5), aux: true });
    B.box({ parent: arm, x: 0.026, y: L * 0.86, z: 0, w: 0.016, h: L * 0.52, d: 0.042, r: 0.008,
      mat: matte(0x14181e, 0.5), aux: true });
  }
}

/* ナンバープレート（axis: 'x+'=まえむき / 'x-'=うしろむき） */
function plate(B, o) {
  const back = o.axis === 'x-';
  B.box({ x: o.x + (back ? -0.012 : 0.012), y: o.y, z: o.z || 0, w: 0.022, h: 0.24, d: 0.46, r: 0.02,
    mat: matte(0x2c323b, 0.5), aux: true, parent: o.parent });
  B.box({ x: o.x + (back ? -0.024 : 0.024), y: o.y, z: o.z || 0, w: 0.012, h: 0.19, d: 0.40, r: 0.015,
    mat: matte(0xeef1f0, 0.35), aux: true, parent: o.parent });
  B.box({ x: o.x + (back ? -0.032 : 0.032), y: o.y + 0.045, z: o.z || 0, w: 0.006, h: 0.05, d: 0.20, r: 0.01,
    mat: matte(0x3f7a52, 0.4), aux: true, parent: o.parent });
}

/* やねの マーカーランプ（トラックの みどり/オレンジの 3つならび） */
function roofMarkers(B, o) {
  const n = o.n === undefined ? 3 : o.n;
  for (let i = 0; i < n; i++) {
    const z = (-(n - 1) / 2 + i) * (o.gap || 0.46);
    B.lamp({ x: o.x, y: o.y, z: z, w: 0.10, h: 0.085, d: 0.15,
      color: o.color === undefined ? 0xffa63d : o.color, strength: 0.9, aux: true, parent: o.parent });
  }
}

/* タイヤの うえの フェンダー（アーチ）＋ うしろの どろよけ */
function wheelArch(B, o) {
  const zs = o.z !== undefined ? [o.z] : [o.spread, -o.spread];
  zs.forEach(z => {
    const geo = curvedPlateGeom(o.r + 0.10, 0.055, Math.PI * 0.06, Math.PI * 0.94, o.w || 0.52, 12);
    B.mesh(geo, o.mat || matte(0x262b33, 0.66), { x: o.x, y: o.r + (o.lift || 0), z: z, part: o.part, parent: o.parent });
    if (o.flap) {
      B.box({ x: o.x - o.r - 0.16, y: (o.r + (o.lift || 0)) * 0.52, z: z, w: 0.04, h: o.r + (o.lift || 0), d: (o.w || 0.52) + 0.04, r: 0.02,
        mat: matte(0x1d2127, 0.85), parent: o.parent });
    }
  });
}

/* うしろの テールランプ（あか・オレンジ・しろ の 3れんネ） */
function tailLamps(B, o) {
  [1, -1].forEach(s => {
    const z = s * o.zOff;
    B.box({ x: o.x - 0.012, y: o.y, z: z, w: 0.05, h: 0.20, d: 0.62, r: 0.03,
      mat: matte(0x22262d, 0.5), aux: true, parent: o.parent });
    [[PAL.lampR, 0.19], [0xff8a2a, 0], [0xe8edf2, -0.19]].forEach(([c, dz]) => {
      B.lamp({ x: o.x - 0.040, y: o.y, z: z + s * dz, w: 0.025, h: 0.15, d: 0.155, color: c, strength: c === 0xe8edf2 ? 0.5 : 0.9, aux: true, parent: o.parent });
    });
  });
}

/* トラック系の うんてんせき（キャブ）を まとめて つくる。
   よこ顔を おしだして、まるい やね と ねかせた まえまど の ある
   ほんものらしい かたちに する */
function truckCab(B, o) {
  /* parent を わたされたら、その 中に まとめて つくる
     （トレーラーの ように キャブごと まわしたい とき） */
  const prevRoot = B.root;
  if (o.parent) {
    const host = new THREE.Group();
    o.parent.add(host);
    B.root = host;
  }
  const cx = o.x, len = o.len, W = o.w, top = o.top, floor = o.floor, col = o.color;
  const hc = top - floor;
  const x0 = cx - len / 2, x1 = cx + len / 2;
  const skirt = floor - 0.16;
  const wsH = hc * 0.46;                      /* まえまどの たかさ */
  const wsTop = top - 0.34;                   /* まどの うえはし（やねの まるみの 下）*/
  const wsBot = wsTop - wsH;
  const rake = o.rake === undefined ? 0.10 : o.rake;   /* まえまどの ねかせぐあい */

  /* --- からだ（よこ顔 → 立体） --- */
  const prof = [
    [x0, skirt],
    [x0, top],
    [x1 - 0.55, top],                 /* やね */
    [x1 - 0.06 - rake, top - 0.30],   /* やねまえの 大きな まるみ */
    [x1 - 0.02, wsBot + 0.04],        /* まえまどの めん */
    [x1 + 0.03, floor + 0.30],        /* はな（すこし まえに はりだす） */
    [x1 + 0.03, skirt]
  ];
  const body = B.mesh(sideProfileGeom(prof, W, 0.15), paint(col, { rough: 0.26 }), { part: 'cab' });

  const wsRz = -Math.atan2(0.04 + rake, wsH - 0.26);   /* まどの かたむき */

  /* --- まえまど（わく → ガラス の 2そう） --- */
  const wsCx = x1 - 0.045 - rake * 0.5, wsCy = (wsTop + wsBot) / 2 + 0.02;
  B.box({ x: wsCx - 0.015, y: wsCy, z: 0, w: 0.06, h: wsH + 0.10, d: W - 0.36, r: 0.10, rz: wsRz,
    mat: matte(0x11151b, 0.5) });
  B.glass({ x: wsCx + 0.020, y: wsCy, z: 0, w: 0.06, h: wsH - 0.04, d: W - 0.46, r: 0.08, rz: wsRz, part: 'window' });
  /* ワイパー ＋ カウル（まどの 下の みぞ） */
  B.box({ x: x1 - 0.015, y: wsBot - 0.055, z: 0, w: 0.07, h: 0.09, d: W - 0.40, r: 0.03, mat: matte(0x2b313a, 0.6) });
  wipers(B, { x: x1 + 0.005, y: wsBot - 0.02, z: -0.28, rz: wsRz, len: wsH * 0.62, gap: 0.72 });
  /* サンバイザー */
  B.box({ x: x1 - 0.10 - rake, y: wsTop + 0.10, z: 0, w: 0.30, h: 0.05, d: W - 0.30, r: 0.02, rz: -0.5,
    mat: paint(col, { rough: 0.3 }) });

  /* --- よこまど（わくつき）と ドア --- */
  [1, -1].forEach(s => {
    B.box({ x: cx - len * 0.14, y: top - 0.30 - wsH * 0.42, z: s * (W / 2 - 0.030), w: len * 0.52, h: wsH * 0.86, d: 0.055, r: 0.09,
      mat: matte(0x11151b, 0.5) });
    B.glass({ x: cx - len * 0.14, y: top - 0.30 - wsH * 0.42, z: s * (W / 2 - 0.008), w: len * 0.46, h: wsH * 0.74, d: 0.055, r: 0.07, part: 'window' });
    /* 三かくの ベンチレーションまど の しきり */
    B.box({ x: cx + len * 0.10, y: top - 0.30 - wsH * 0.42, z: s * (W / 2 + 0.006), w: 0.030, h: wsH * 0.72, d: 0.020, r: 0.01,
      mat: matte(0x11151b, 0.5) });

    /* とびらの あわせめ（まえ・うしろ・うえ） */
    B.seam({ x: cx + len * 0.16, y: floor + hc * 0.34, z: s * (W / 2 + 0.006), w: 0.028, h: hc * 0.62, d: 0.03, part: 'door' });
    B.seam({ x: cx - len * 0.44, y: floor + hc * 0.34, z: s * (W / 2 + 0.006), w: 0.028, h: hc * 0.62, d: 0.03, part: 'door' });
    B.seam({ x: cx - len * 0.14, y: wsBot - 0.06, z: s * (W / 2 + 0.006), w: len * 0.60, h: 0.028, d: 0.03, part: 'door' });
    doorHandle(B, { x: cx - len * 0.10, y: wsBot - 0.26, z: s * (W / 2 + 0.012), s: s });

    /* ステップ（2だん、おくに くぼんだ 台） */
    B.box({ x: cx - len * 0.16, y: floor - 0.24, z: s * (W / 2 - 0.20), w: 0.56, h: 0.05, d: 0.34, r: 0.02, mat: matte(0x30363f, 0.62), part: 'step' });
    B.box({ x: cx - len * 0.16, y: floor - 0.56, z: s * (W / 2 - 0.13), w: 0.56, h: 0.05, d: 0.34, r: 0.02, mat: matte(0x30363f, 0.62), part: 'step' });

    /* ミラー ＋ ウインカー */
    truckMirror(B, { x: x1 - 0.16, y: top - 0.26, s: s, zIn: W / 2 - 0.06, zOut: W / 2 + 0.30 });
    B.lamp({ x: cx + len * 0.28, y: wsBot - 0.22, z: s * (W / 2 + 0.012), w: 0.16, h: 0.09, d: 0.035, color: PAL.lampY, strength: 0.9, aux: true });
  });

  /* --- まえの かお --- */
  /* グリル（くろい あみ ＋ よこ3本の ギラリ） */
  B.box({ x: x1 + 0.035, y: floor + hc * 0.22, z: 0, w: 0.05, h: hc * 0.26, d: W * 0.74, r: 0.06, mat: matte(0x171c23, 0.5) });
  for (let i = 0; i < 3; i++) {
    B.box({ x: x1 + 0.055, y: floor + hc * 0.135 + i * hc * 0.082, z: 0, w: 0.028, h: 0.045, d: W * 0.70, r: 0.02, mat: metalMat(PAL.chrome, 0.18) });
  }
  /* メーカーの まる エンブレム */
  B.cyl({ x: x1 + 0.065, y: floor + hc * 0.345, z: 0, r: 0.085, h: 0.03, axis: 'x', seg: 20, mat: metalMat(PAL.chrome, 0.12) });
  /* まえまどの 下の パネルの あわせめ */
  B.seam({ x: x1 + 0.035, y: wsBot - 0.14, z: 0, w: 0.02, h: 0.025, d: W - 0.36 });

  /* バンパー（3だん: くろい 台 ＋ ボディいろの おおい ＋ したくちびる） */
  B.box({ x: x1 + 0.02, y: floor - 0.14, z: 0, w: 0.32, h: 0.36, d: W + 0.04, r: 0.09, mat: matte(0x353d49, 0.5) });
  B.box({ x: x1 + 0.06, y: floor - 0.34, z: 0, w: 0.24, h: 0.10, d: W - 0.20, r: 0.04, mat: matte(0x22272f, 0.6) });
  plate(B, { x: x1 + 0.19, y: floor - 0.12, z: 0, axis: 'x+' });

  /* ヘッドライト（ふちどり つき）＋ フォグ */
  [1, -1].forEach(s => {
    B.box({ x: x1 + 0.035, y: floor + 0.14, z: s * (W / 2 - 0.33), w: 0.06, h: 0.24, d: 0.42, r: 0.05, mat: metalMat(0xb9c2cc, 0.3) });
    B.lamp({ x: x1 + 0.055, y: floor + 0.16, z: s * (W / 2 - 0.33), w: 0.05, h: 0.17, d: 0.34, color: 0xfff2cf, strength: 1.4, part: 'lamp' });
    B.lamp({ x: x1 + 0.055, y: floor + 0.035, z: s * (W / 2 - 0.33), w: 0.045, h: 0.07, d: 0.24, color: PAL.lampY, strength: 1.1, part: 'lamp' });
    B.lamp({ x: x1 + 0.10, y: floor - 0.33, z: s * (W / 2 - 0.42), w: 0.05, h: 0.065, d: 0.14, color: 0xfff8e2, strength: 0.8, aux: true });
  });

  /* やねの マーカーランプ（やねの まえはしに） */
  roofMarkers(B, { x: x1 - 0.26 - rake, y: top + 0.02, n: 3, gap: W * 0.26 });

  /* 車の うえの ひさし */
  if (o.deflector) {
    B.box({ x: cx + len * 0.02, y: top + 0.17, z: 0, w: len * 0.78, h: 0.32, d: W - 0.12, r: 0.13, color: col, rough: 0.24 });
  }
  B.root = prevRoot;
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

/* ---------------- よこ顔（サイドビュー）を そのまま 立体に する ----------------
   じょうよう車や バスは 箱の 組み合わせだと それらしく ならない。
   「よこから 見た かたち」を 点で 書いて、はば の ぶんだけ 押し出すと 一気に 車らしくなる。
   pts は [[x, y], ...]（x=まえうしろ / y=たかさ、地面が 0）。 */
function sideProfileGeom(pts, depth, round) {
  const r = round === undefined ? 0.10 : round;
  const sh = new THREE.Shape();
  const n = pts.length;
  /* かどを まるめながら たどる */
  for (let i = 0; i < n; i++) {
    const p0 = pts[(i - 1 + n) % n], p1 = pts[i], p2 = pts[(i + 1) % n];
    const v1 = [p0[0] - p1[0], p0[1] - p1[1]];
    const v2 = [p2[0] - p1[0], p2[1] - p1[1]];
    const l1 = Math.hypot(v1[0], v1[1]) || 1;
    const l2 = Math.hypot(v2[0], v2[1]) || 1;
    const k = Math.min(r, l1 * 0.45, l2 * 0.45);
    const a = [p1[0] + v1[0] / l1 * k, p1[1] + v1[1] / l1 * k];
    const b = [p1[0] + v2[0] / l2 * k, p1[1] + v2[1] / l2 * k];
    if (i === 0) sh.moveTo(a[0], a[1]); else sh.lineTo(a[0], a[1]);
    sh.quadraticCurveTo(p1[0], p1[1], b[0], b[1]);
  }
  const b = 0.035;
  const g = new THREE.ExtrudeGeometry(sh, {
    depth: Math.max(0.01, depth - 2 * b), bevelEnabled: true,
    bevelSize: b, bevelThickness: b, bevelSegments: 2, curveSegments: 6
  });
  g.translate(0, 0, -(depth / 2 - b));
  g.computeVertexNormals();
  return g;
}

/* こい スモークガラス（中を 見せない ガラス。とうめいに しない ぶん かるい）*/
function darkGlassMat() {
  return new THREE.MeshPhysicalMaterial({
    color: 0x141c26, metalness: 0.25, roughness: 0.05,
    clearcoat: 1, clearcoatRoughness: 0.03, envMapIntensity: 2.6
  });
}

/* すきとおりの つよい ガラス（中の ざせきを 見せたい ときに つかう）*/
function clearGlassMat() {
  return new THREE.MeshPhysicalMaterial({
    color: 0x9fc4dd, metalness: 0.1, roughness: 0.04,
    clearcoat: 1, clearcoatRoughness: 0.02,
    transparent: true, opacity: 0.34, envMapIntensity: 2.4,
    side: THREE.DoubleSide
  });
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
    /* うしろの ランプ・ナンバー・おいこみ ぼうし バー */
    tailLamps(B, { x: nx - nLen / 2 - 0.02, y: 0.86, zOff: BODY_W / 2 - 0.42 });
    plate(B, { x: nx - nLen / 2 - 0.02, y: 0.86, z: 0, axis: 'x-' });
    B.box({ x: nx - nLen / 2 + 0.12, y: 0.56, z: 0, w: 0.09, h: 0.15, d: BODY_W - 0.55, r: 0.03, mat: matte(0x2c323b, 0.6) });
    [1, -1].forEach(s => {
      B.box({ x: nx - nLen / 2 + 0.12, y: 0.80, z: s * 0.70, w: 0.07, h: 0.36, d: 0.09, r: 0.02, mat: matte(0x2c323b, 0.6) });
    });
    /* よこの ガードレール（じてんしゃを まきこまない ための ぼう） */
    [1, -1].forEach(s => {
      [0.46, 0.68].forEach(gy => {
        B.box({ x: 0.45, y: gy, z: s * 1.16, w: 5.4, h: 0.075, d: 0.04, r: 0.02, mat: metalMat(0xc3cad3, 0.35), aux: true });
      });
      B.box({ x: 0.45 - 2.2, y: 0.57, z: s * 1.16, w: 0.05, h: 0.30, d: 0.04, r: 0.01, mat: metalMat(0xc3cad3, 0.35), aux: true });
      B.box({ x: 0.45 + 2.2, y: 0.57, z: s * 1.16, w: 0.05, h: 0.30, d: 0.04, r: 0.01, mat: metalMat(0xc3cad3, 0.35), aux: true });
    });
    /* にだいの よこの ちいさな オレンジランプ */
    [1, -1].forEach(s => {
      [-4.6, -1.5, 1.4].forEach(mx => {
        B.lamp({ x: mx, y: nBot - 0.02, z: s * (BODY_W / 2 + 0.015), w: 0.10, h: 0.07, d: 0.035, color: 0xffa63d, strength: 0.8, aux: true });
      });
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
    /* まえタイヤの フェンダー と どろよけ */
    wheelArch(B, { x: 4.35, r: 0.535, spread: 1.03, w: 0.50, flap: false });
    [1, -1].forEach(s => {
      B.box({ x: -5.72, y: 0.36, z: s * 1.05, w: 0.045, h: 0.58, d: 0.58, r: 0.02, mat: matte(0x1d2127, 0.85) });
      B.box({ x: 3.72, y: 0.42, z: s * 1.03, w: 0.045, h: 0.42, d: 0.50, r: 0.02, mat: matte(0x1d2127, 0.85) });
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
    /* まえの バンパー・グリル・ライト・ナンバー */
    B.box({ x: 5.22, y: 1.06, z: 0, w: 0.28, h: 0.40, d: W + 0.02, r: 0.08, mat: matte(0x39414e, 0.55) });
    B.box({ x: 5.12, y: 1.52, z: 0, w: 0.05, h: 0.30, d: W * 0.52, r: 0.04, mat: matte(0x171c23, 0.5) });
    for (let i = 0; i < 3; i++) {
      B.box({ x: 5.135, y: 1.42 + i * 0.10, z: 0, w: 0.025, h: 0.035, d: W * 0.48, r: 0.015, mat: metalMat(PAL.chrome, 0.2) });
    }
    plate(B, { x: 5.36, y: 1.06, z: 0, axis: 'x+' });
    [1, -1].forEach(s => {
      B.box({ x: 5.10, y: 1.52, z: s * (W / 2 - 0.34), w: 0.07, h: 0.26, d: 0.36, r: 0.05, mat: metalMat(0xb9c2cc, 0.3) });
      B.lamp({ x: 5.13, y: 1.54, z: s * (W / 2 - 0.34), w: 0.06, h: 0.19, d: 0.28, color: 0xfff2cf, strength: 1.4, part: 'lamp' });
      B.lamp({ x: 5.13, y: 1.40, z: s * (W / 2 - 0.34), w: 0.05, h: 0.06, d: 0.20, color: PAL.lampY, strength: 1.0, aux: true });
    });
    /* うしろの ランプ と はんしゃばん */
    tailLamps(B, { x: -5.48, y: 1.18, zOff: W / 2 - 0.40 });
    plate(B, { x: -5.48, y: 1.18, z: 0, axis: 'x-' });
    /* デッキの てすり と ステップ */
    [1, -1].forEach(s => {
      [4.6, 2.2].forEach(hx => {
        B.cyl({ x: hx, y: 2.24, z: s * (W / 2 - 0.10), r: 0.022, h: 0.60, axis: 'y', mat: metalMat(0xd8dee6, 0.3), aux: true });
      });
      B.cyl({ x: 1.35, y: 2.52, z: s * (W / 2 - 0.10), r: 0.020, h: 1.7, axis: 'x', mat: metalMat(0xd8dee6, 0.3), aux: true });
      /* のぼる ステップ（うしろがわ） */
      B.box({ x: -4.9, y: 0.62, z: s * (W / 2 - 0.18), w: 0.42, h: 0.05, d: 0.30, r: 0.02, mat: matte(0x30363f, 0.62), part: 'step' });
      B.box({ x: -4.9, y: 1.02, z: s * (W / 2 - 0.12), w: 0.42, h: 0.05, d: 0.30, r: 0.02, mat: matte(0x30363f, 0.62), part: 'step' });
    });

    /* ==== うんてんせき（右まえ・ガラスばり、まるい やね）==== */
    const cabX = 3.35, cabZ = 1.02, cabW = 1.24, cabD = 1.30, cabBot = 1.92, cabTop = 3.55;
    B.mesh(sideProfileGeom([
      [cabX - cabW / 2, cabBot - 0.20],
      [cabX - cabW / 2, cabTop],
      [cabX + cabW / 2 - 0.34, cabTop],
      [cabX + cabW / 2, cabTop - 0.52],
      [cabX + cabW / 2, cabBot - 0.20]
    ], cabD, 0.13), paint(COL, { rough: 0.26 }), { z: cabZ, part: 'cab' });
    /* まえまど（わく つき・ねかせ） */
    B.box({ x: cabX + cabW / 2 - 0.10, y: (cabTop + cabBot) / 2 + 0.14, z: cabZ, w: 0.07, h: (cabTop - cabBot) * 0.72, d: cabD - 0.16, r: 0.08, rz: -0.10, mat: matte(0x11151b, 0.5) });
    B.glass({ x: cabX + cabW / 2 - 0.065, y: (cabTop + cabBot) / 2 + 0.14, z: cabZ, w: 0.07, h: (cabTop - cabBot) * 0.62, d: cabD - 0.26, r: 0.07, rz: -0.10, part: 'window' });
    wipers(B, { x: cabX + cabW / 2 - 0.02, y: (cabTop + cabBot) / 2 - 0.30, z: cabZ, rz: -0.10, len: 0.45, n: 1 });
    /* よこまど（そとがわに とびらの あわせめ と ハンドル） */
    B.glass({ x: cabX - 0.06, y: (cabTop + cabBot) / 2 + 0.10, z: cabZ + cabD / 2 - 0.04, w: cabW * 0.66, h: (cabTop - cabBot) * 0.58, d: 0.07, r: 0.06, part: 'window' });
    B.glass({ x: cabX - 0.06, y: (cabTop + cabBot) / 2 + 0.10, z: cabZ - cabD / 2 + 0.04, w: cabW * 0.66, h: (cabTop - cabBot) * 0.58, d: 0.07, r: 0.06, part: 'window' });
    B.seam({ x: cabX - cabW / 2 + 0.14, y: (cabTop + cabBot) / 2 - 0.2, z: cabZ + cabD / 2 + 0.006, w: 0.026, h: (cabTop - cabBot) * 0.66, d: 0.03, part: 'door' });
    doorHandle(B, { x: cabX - 0.10, y: (cabTop + cabBot) / 2 - 0.42, z: cabZ + cabD / 2 + 0.010, s: 1 });
    /* やねの ひさし と かいてんとう */
    B.box({ x: cabX, y: cabTop + 0.10, z: cabZ, w: cabW - 0.06, h: 0.10, d: cabD - 0.06, r: 0.05, mat: paint(0xd7d9dd, { rough: 0.4 }) });
    B.lamp({ x: cabX - 0.30, y: cabTop + 0.22, z: cabZ, w: 0.14, h: 0.13, d: 0.14, color: 0xffa63d, strength: 1.3, aux: true });
    /* キャブへ のぼる てすり */
    B.cyl({ x: cabX + cabW / 2 + 0.03, y: cabBot - 0.62, z: cabZ + cabD / 2 - 0.10, r: 0.022, h: 1.15, axis: 'y', mat: metalMat(0xd8dee6, 0.3), aux: true });
    /* 回転する 上の 台 ＋ うしろの おもり（カウンターウェイト） */
    B.cyl({ x: -0.9, y: 2.02, z: 0, r: 1.28, h: 0.34, seg: 32, color: COL, part: 'body' });
    B.box({ x: -2.85, y: 2.45, z: 0, w: 1.15, h: 1.05, d: 2.35, r: 0.10, mat: paint(0xc98a1e, { rough: 0.38 }), part: 'body' });
    B.seam({ x: -2.85, y: 2.45, z: 1.18, w: 0.9, h: 0.03, d: 0.03, color: 0x8a5f12 });
    B.seam({ x: -2.85, y: 2.45, z: -1.18, w: 0.9, h: 0.03, d: 0.03, color: 0x8a5f12 });

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

    /* コンクリートを 入れる じょうご（ホッパー） */
    B.cyl({ x: -3.55, y: 3.10, z: 0, r: 0.55, r2: 0.26, h: 0.52, axis: 'y', seg: 22, tilt: -0.20, mat: metalMat(0xaeb7c2, 0.35), part: 'drum' });
    B.cyl({ x: -3.42, y: 2.72, z: 0, r: 0.24, h: 0.45, axis: 'y', seg: 16, tilt: -0.20, mat: metalMat(0x9aa3ae, 0.4), part: 'drum' });

    /* 水タンク・はしご */
    B.cyl({ x: -0.15, y: 1.30, z: 1.12, r: 0.28, h: 1.30, axis: 'x', seg: 20, mat: metalMat(0xc9d1da, 0.25), part: 'tank' });
    [1, -1].forEach(s => {
      B.box({ x: -4.05, y: 1.55, z: s * 0.55, w: 0.06, h: 2.1, d: 0.06, r: 0.02, mat: matte(0x707a86, 0.6), part: 'ladder' });
    });
    for (let i = 0; i < 5; i++) {
      B.box({ x: -4.05, y: 0.72 + i * 0.40, z: 0, w: 0.05, h: 0.05, d: 1.10, r: 0.02, mat: matte(0x707a86, 0.6), part: 'ladder' });
    }

    /* うしろタイヤの フェンダー・どろよけ・うしろの ランプ */
    [-2.05, -3.40].forEach((ax, i) => {
      if (i === 1) wheelArch(B, { x: ax, r: 0.52, spread: 1.02, w: 0.66, flap: true });
    });
    B.box({ x: -0.72, y: 1.12, z: 1.02, w: 1.05, h: 0.05, d: 0.62, r: 0.02, mat: matte(0x30363f, 0.6) });
    B.box({ x: -0.72, y: 1.12, z: -1.02, w: 1.05, h: 0.05, d: 0.62, r: 0.02, mat: matte(0x30363f, 0.6) });
    tailLamps(B, { x: -4.45, y: 0.82, zOff: W / 2 - 0.40 });
    plate(B, { x: -4.45, y: 0.82, z: 0, axis: 'x-' });

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
    B.seam({ x: -2.42, y: 1.10, z: 1.15, w: 0.55, h: 0.03, d: 0.03, color: 0x9c5c10 });
    B.seam({ x: -2.42, y: 1.10, z: -1.15, w: 0.55, h: 0.03, d: 0.03, color: 0x9c5c10 });
    /* エンジンの ふたの あみめ（ベント） */
    for (let i = 0; i < 4; i++) {
      B.seam({ x: -1.55 + i * 0.22, y: 2.155, z: -0.35, w: 0.06, h: 0.02, d: 1.30, color: 0xb46a10 });
    }
    /* マフラー ＋ エアクリーナー */
    B.cyl({ x: -0.20, y: 2.42, z: -0.72, r: 0.09, h: 0.55, seg: 14, mat: metalMat(0x9aa3ae, 0.4) });
    B.cyl({ x: -0.20, y: 2.72, z: -0.72, r: 0.055, h: 0.28, seg: 10, mat: matte(0x3a414b, 0.5) });
    B.cyl({ x: -0.85, y: 2.44, z: -0.55, r: 0.13, h: 0.40, axis: 'x', seg: 14, mat: matte(0x3a414b, 0.55) });

    /* ==== うんてんせき（ガラスばり・まるい やね）==== */
    const cbx = 0.42, cbz = 0.74, cw = 1.14, cd = 1.22, cbot = 1.06, ctop = 2.86;
    B.mesh(sideProfileGeom([
      [cbx - cw / 2, cbot - 0.10],
      [cbx - cw / 2, ctop],
      [cbx + cw / 2 - 0.30, ctop],
      [cbx + cw / 2, ctop - 0.46],
      [cbx + cw / 2, cbot - 0.10]
    ], cd, 0.12), paint(COL, { rough: 0.26 }), { z: cbz, part: 'cab' });
    /* まえまど（大きい 一まいガラス・わく つき） */
    B.box({ x: cbx + cw / 2 - 0.055, y: (ctop + cbot) / 2 + 0.18, z: cbz, w: 0.06, h: (ctop - cbot) * 0.80, d: cd - 0.14, r: 0.07, rz: -0.06, mat: matte(0x11151b, 0.5) });
    B.glass({ x: cbx + cw / 2 - 0.02, y: (ctop + cbot) / 2 + 0.18, z: cbz, w: 0.06, h: (ctop - cbot) * 0.72, d: cd - 0.24, r: 0.06, rz: -0.06, part: 'window' });
    wipers(B, { x: cbx + cw / 2 + 0.01, y: (ctop + cbot) / 2 - 0.32, z: cbz, rz: -0.06, len: 0.5, n: 1, a: 0.9 });
    /* よこまど と とびら（そとがわ） */
    B.glass({ x: cbx - 0.04, y: (ctop + cbot) / 2 + 0.14, z: cbz + cd / 2 - 0.030, w: cw * 0.70, h: (ctop - cbot) * 0.62, d: 0.07, r: 0.06, part: 'window' });
    B.glass({ x: cbx - 0.04, y: (ctop + cbot) / 2 + 0.14, z: cbz - cd / 2 + 0.035, w: cw * 0.68, h: (ctop - cbot) * 0.60, d: 0.07, r: 0.06, part: 'window' });
    B.seam({ x: cbx - cw / 2 + 0.12, y: (ctop + cbot) / 2 - 0.22, z: cbz + cd / 2 + 0.006, w: 0.026, h: (ctop - cbot) * 0.62, d: 0.03, part: 'door' });
    doorHandle(B, { x: cbx - 0.08, y: (ctop + cbot) / 2 - 0.40, z: cbz + cd / 2 + 0.010, s: 1 });
    /* てすり（オレンジいろ）と ステップ */
    B.cyl({ x: cbx + cw / 2 + 0.06, y: cbot + 0.55, z: cbz + cd / 2 - 0.06, r: 0.024, h: 1.30, axis: 'y', mat: paint(0xd97f14, { rough: 0.4 }), aux: true });
    B.box({ x: cbx + 0.10, y: 0.80, z: cbz + cd / 2 + 0.10, w: 0.34, h: 0.04, d: 0.22, r: 0.02, mat: matte(0x30363f, 0.62) });
    /* やね（ひさし・ガード・ライト） */
    B.box({ x: cbx, y: ctop + 0.08, z: cbz, w: cw - 0.06, h: 0.09, d: cd - 0.06, r: 0.04, mat: paint(0xd7d9dd, { rough: 0.4 }) });
    for (let i = 0; i < 3; i++) {
      B.cyl({ x: cbx + cw / 2 + 0.045, y: (ctop + cbot) / 2 + 0.16, z: cbz - cd / 2 + 0.24 + i * 0.38, r: 0.016, h: (ctop - cbot) * 0.58, axis: 'y', seg: 8, mat: matte(0x3c434e, 0.5), aux: true });
    }
    B.lamp({ x: cbx + 0.10, y: ctop + 0.14, z: cbz - 0.30, w: 0.14, h: 0.10, d: 0.24, color: 0xfff2cf, strength: 1.2, part: 'lamp' });
    B.lamp({ x: cbx + cw / 2 - 0.08, y: ctop - 0.12, z: cbz + cd / 2 - 0.14, w: 0.10, h: 0.10, d: 0.10, color: 0xfff2cf, strength: 1.1, aux: true });

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
    /* まえの ラジエーターの あみ（たてスリット） */
    B.box({ x: 1.60, y: 1.90, z: 0, w: 0.05, h: 0.56, d: 1.20, r: 0.04, mat: matte(0x171c23, 0.5) });
    for (let i = -3; i <= 3; i++) {
      B.box({ x: 1.625, y: 1.90, z: i * 0.155, w: 0.03, h: 0.50, d: 0.035, r: 0.012, mat: matte(0x39414c, 0.45) });
    }
    /* エンジンの ふたの スリット と きゅうきキャップ */
    for (let i = 0; i < 3; i++) {
      B.seam({ x: 0.55 + i * 0.28, y: 2.29, z: 0.40, w: 0.05, h: 0.02, d: 0.5, color: 0xb98812 });
      B.seam({ x: 0.55 + i * 0.28, y: 2.29, z: -0.40, w: 0.05, h: 0.02, d: 0.5, color: 0xb98812 });
    }
    B.cyl({ x: 1.30, y: 2.52, z: 0.46, r: 0.10, h: 0.55, seg: 14, mat: metalMat(0x8d959f, 0.42) });
    B.cyl({ x: 1.30, y: 2.83, z: 0.46, r: 0.13, h: 0.06, seg: 12, mat: matte(0x3a414b, 0.5) });
    B.cyl({ x: 0.72, y: 2.52, z: -0.46, r: 0.11, h: 0.34, seg: 12, mat: matte(0x3a414b, 0.55) });

    /* うんてんせき（まわりを かこう じょうぶな わく）*/
    B.box({ x: -0.85, y: 1.90, z: 0, w: 1.15, h: 0.28, d: 1.35, r: 0.06, mat: matte(0x3c434e, 0.6), part: 'cab' });
    B.box({ x: -0.95, y: 2.28, z: 0, w: 0.62, h: 0.60, d: 0.70, r: 0.10, mat: matte(0x2f3640, 0.7), part: 'seat' });
    /* ざせきの クッションの みぞ と ひじかけ */
    B.seam({ x: -0.95, y: 2.28, z: 0.36, w: 0.55, h: 0.02, d: 0.03, color: 0x232830 });
    [1, -1].forEach(s => {
      B.box({ x: -0.80, y: 2.10, z: s * 0.42, w: 0.42, h: 0.07, d: 0.10, r: 0.03, mat: matte(0x232830, 0.6), part: 'seat' });
    });
    /* そうじゅうレバー と ハンドルじく */
    B.cyl({ x: -0.42, y: 2.22, z: 0.18, r: 0.022, h: 0.42, axis: 'y', tilt: 0.35, seg: 8, mat: matte(0x22262d, 0.5) });
    B.cyl({ x: -0.42, y: 2.22, z: -0.18, r: 0.022, h: 0.42, axis: 'y', tilt: 0.35, seg: 8, mat: matte(0x22262d, 0.5) });
    B.box({ x: -0.36, y: 2.06, z: 0, w: 0.30, h: 0.24, d: 0.44, r: 0.06, mat: matte(0x2b313a, 0.55), part: 'cab' });
    [[-0.30, 0.62], [-0.30, -0.62], [-1.45, 0.62], [-1.45, -0.62]].forEach(([px, pz]) => {
      B.box({ x: px, y: 2.42, z: pz, w: 0.10, h: 1.30, d: 0.10, r: 0.03, mat: matte(0x3c434e, 0.55), part: 'cab' });
    });
    B.box({ x: -0.88, y: 3.10, z: 0, w: 1.45, h: 0.11, d: 1.55, r: 0.05, color: COL, part: 'cab', rough: 0.4 });
    B.lamp({ x: -0.32, y: 3.02, z: 0.52, w: 0.14, h: 0.12, d: 0.22, color: 0xfff2cf, strength: 1.2, part: 'lamp' });
    B.lamp({ x: -0.32, y: 3.02, z: -0.52, w: 0.14, h: 0.12, d: 0.22, color: 0xfff2cf, strength: 1.2, part: 'lamp' });
    /* のぼりおり する ときの てすり */
    [1, -1].forEach(s => {
      B.cyl({ x: -1.50, y: 1.62, z: s * 0.98, r: 0.022, h: 0.72, axis: 'y', seg: 8, mat: matte(0x3c434e, 0.5), aux: true });
    });

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
    /* にだいの ゆかの ほねぐみ（かたむけた とき 下から 見える） */
    for (let i = 0; i < 5; i++) {
      B.box({ parent: bed, x: 0.65 + i * 1.15, y: -0.075, z: 0, w: 0.13, h: 0.11, d: W - 0.10, r: 0.02, mat: matte(0x39414c, 0.6), part: 'nidai' });
    }
    /* ちょうつがい（うしろの じくうけ） */
    [1, -1].forEach(s => {
      B.cyl({ x: -4.05, y: 1.22, z: s * 0.85, r: 0.14, h: 0.28, axis: 'z', seg: 14, mat: metalMat(0x7d858f, 0.4), part: 'nidai' });
    });
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

    /* まえの フェンダー・うしろの どろよけ・うしろの ランプ */
    wheelArch(B, { x: 2.75, r: 0.56, spread: 1.02, w: 0.50 });
    [1, -1].forEach(s => {
      B.box({ x: -3.95, y: 0.38, z: s * 1.04, w: 0.045, h: 0.60, d: 0.58, r: 0.02, mat: matte(0x1d2127, 0.85) });
    });
    tailLamps(B, { x: -4.42, y: 0.80, zOff: W / 2 - 0.42 });
    plate(B, { x: -4.42, y: 0.80, z: 0, axis: 'x-' });

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

    /* けいこくとう と うしろの ひっぱり ピン */
    B.lamp({ x: -1.30, y: 2.50, z: -0.38, w: 0.10, h: 0.12, d: 0.10, color: 0xffa63d, strength: 1.2, aux: true });
    B.cyl({ x: -1.92, y: 0.50, z: 0, r: 0.09, h: 0.14, axis: 'x', seg: 12, mat: matte(0x3a414b, 0.5), part: 'counter' });
    /* まえの ライト（ガードの はしらに つく） */
    [1, -1].forEach(sz => {
      B.lamp({ x: -0.06, y: 1.98, z: sz * 0.50, w: 0.09, h: 0.09, d: 0.12, color: 0xfff2cf, strength: 1.2, part: 'lamp' });
    });

    /* まっすぐ のびる はしら（マスト）*/
    const mastOuterH = 2.05;
    [1, -1].forEach(sz => {
      B.box({ x: 0.62, y: mastOuterH / 2 + 0.10, z: sz * 0.42, w: 0.16, h: mastOuterH, d: 0.13, r: 0.03, mat: metalMat(0x7d858f, 0.4), part: 'mast' });
    });
    B.box({ x: 0.62, y: 0.22, z: 0, w: 0.22, h: 0.22, d: 1.00, r: 0.04, mat: matte(0x59616e, 0.5), part: 'mast' });
    /* もち上げる チェーン と 中央の シリンダー */
    [1, -1].forEach(sz => {
      B.box({ x: 0.70, y: mastOuterH / 2 + 0.10, z: sz * 0.16, w: 0.030, h: mastOuterH - 0.16, d: 0.055, r: 0.01, mat: matte(0x22262d, 0.45), part: 'mast' });
    });
    B.cyl({ x: 0.55, y: mastOuterH / 2, z: 0, r: 0.045, h: mastOuterH - 0.35, axis: 'y', seg: 10, mat: metalMat(0xb8c0ca, 0.25), part: 'mast' });

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
        /* シャッターの よこスリット と とって */
        for (let k = 0; k < 5; k++) {
          B.seam({ x: -0.90 + i * 2.05, y: 1.32 + k * 0.19, z: sz * (W / 2 + 0.030), w: 1.72, h: 0.022, d: 0.012, color: 0x9aa3ae });
        }
        B.box({ x: -0.90 + i * 2.05, y: 1.24, z: sz * (W / 2 + 0.040), w: 0.55, h: 0.045, d: 0.030, r: 0.015, mat: metalMat(PAL.chrome, 0.25), part: 'door' });
      }
    });
    B.box({ x: -0.90, y: 2.46, z: 0, w: 6.70, h: 0.16, d: W + 0.06, r: 0.05, mat: matte(0x3c434e, 0.6), part: 'body' });
    /* うしろの ランプ・ナンバー・そうさばん */
    tailLamps(B, { x: -4.22, y: 0.86, zOff: W / 2 - 0.42 });
    plate(B, { x: -4.22, y: 0.86, z: 0, axis: 'x-' });
    B.box({ x: -3.45, y: 2.20, z: 1.10, w: 0.55, h: 0.62, d: 0.18, r: 0.04, mat: matte(0x3a414b, 0.5), part: 'body' });
    [[0, 0.12], [0.14, 0.12], [-0.14, 0.12], [0, -0.08], [0.14, -0.08]].forEach(([dx, dy]) => {
      B.cyl({ x: -3.45 + dx, y: 2.24 + dy, z: 1.20, r: 0.028, h: 0.03, axis: 'z', seg: 10, mat: matte(0xd8dee6, 0.4) });
    });

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
      /* まどの わく */
      B.box({ x: bx + blen * 0.26, y: top - 0.52, z: sz * (W / 2 - 0.035), w: blen * 0.34 + 0.08, h: 0.70, d: 0.045, r: 0.07, mat: matte(0x11151b, 0.5) });
      /* 赤い ライン */
      B.box({ x: bx, y: bot + 0.72, z: sz * (W / 2 + 0.012), w: blen - 0.10, h: 0.16, d: 0.02, r: 0.01, mat: paint(RED, { rough: 0.3 }) });
      /* 赤十字の マーク */
      B.box({ x: bx - blen * 0.22, y: top - 0.85, z: sz * (W / 2 + 0.014), w: 0.13, h: 0.42, d: 0.02, r: 0.01, mat: paint(RED, { rough: 0.3 }) });
      B.box({ x: bx - blen * 0.22, y: top - 0.85, z: sz * (W / 2 + 0.014), w: 0.42, h: 0.13, d: 0.02, r: 0.01, mat: paint(RED, { rough: 0.3 }) });
      /* よこの ちいさな マーカー */
      B.lamp({ x: bx - blen / 2 + 0.25, y: bot + 0.10, z: sz * (W / 2 + 0.012), w: 0.09, h: 0.06, d: 0.03, color: PAL.lampR, strength: 0.8, aux: true });
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

    /* ==== うんてんせき（ボンネットの ある バンがた）==== */
    const cx = 2.20, clen = 1.75, ctp = 2.62;
    B.mesh(sideProfileGeom([
      [cx - clen / 2, bot - 0.10],
      [cx - clen / 2, ctp],
      [cx + clen / 2 - 0.62, ctp],
      [cx + clen / 2 - 0.12, 1.78],     /* ねかせた まえまど */
      [cx + clen / 2 + 0.10, 1.70],     /* みじかい ボンネット */
      [cx + clen / 2 + 0.14, bot - 0.10]
    ], W, 0.14), paint(WHITE, { rough: 0.26 }), { part: 'cab' });
    /* まえまど（わく つき） */
    const aRz = -Math.atan2(0.50, ctp - 1.78);
    B.box({ x: cx + clen / 2 - 0.40, y: (ctp + 1.80) / 2 + 0.01, z: 0, w: 0.06, h: ctp - 1.80 + 0.06, d: W - 0.30, r: 0.09, rz: aRz, mat: matte(0x11151b, 0.5) });
    B.glass({ x: cx + clen / 2 - 0.365, y: (ctp + 1.80) / 2, z: 0, w: 0.06, h: ctp - 1.86, d: W - 0.42, r: 0.08, rz: aRz, part: 'window' });
    wipers(B, { x: cx + clen / 2 - 0.33, y: 1.86, z: -0.25, rz: aRz, len: 0.42, gap: 0.62 });
    [1, -1].forEach(sz => {
      /* よこまど（わく つき）と とびら */
      B.box({ x: cx - 0.30, y: 2.14, z: sz * (W / 2 - 0.030), w: 1.00, h: 0.86, d: 0.05, r: 0.08, mat: matte(0x11151b, 0.5) });
      B.glass({ x: cx - 0.30, y: 2.14, z: sz * (W / 2 - 0.006), w: 0.90, h: 0.78, d: 0.05, r: 0.07, part: 'window' });
      B.seam({ x: cx - 0.72, y: 1.86, z: sz * (W / 2 + 0.006), w: 0.028, h: 1.42, d: 0.03, part: 'door' });
      B.seam({ x: cx + 0.22, y: 1.86, z: sz * (W / 2 + 0.006), w: 0.028, h: 1.42, d: 0.03, part: 'door' });
      doorHandle(B, { x: cx - 0.22, y: 1.66, z: sz * (W / 2 + 0.012), s: sz, len: 0.24 });
      /* ドアミラー（うでつき） */
      doorMirror(B, { x: cx + 0.62, y: 2.30, z: sz * (W / 2 - 0.02), s: sz, color: WHITE });
      B.lamp({ x: cx + clen / 2 + 0.05, y: 1.36, z: sz * (W / 2 - 0.26), w: 0.06, h: 0.20, d: 0.30, color: 0xfff2cf, strength: 1.4, part: 'lamp' });
      B.lamp({ x: cx + clen / 2 + 0.055, y: 1.20, z: sz * (W / 2 - 0.26), w: 0.05, h: 0.07, d: 0.20, color: PAL.lampY, strength: 1.0, aux: true });
    });
    /* バンパー・グリル・ナンバー */
    B.box({ x: cx + clen / 2 + 0.04, y: 1.06, z: 0, w: 0.24, h: 0.30, d: W + 0.02, r: 0.08, mat: matte(0x38404d, 0.55) });
    B.box({ x: cx + clen / 2 + 0.11, y: 1.50, z: 0, w: 0.05, h: 0.20, d: W * 0.60, r: 0.04, mat: matte(0x1e232b, 0.45) });
    for (let i = 0; i < 2; i++) {
      B.box({ x: cx + clen / 2 + 0.125, y: 1.45 + i * 0.10, z: 0, w: 0.025, h: 0.030, d: W * 0.56, r: 0.012, mat: metalMat(PAL.chrome, 0.2) });
    }
    plate(B, { x: cx + clen / 2 + 0.16, y: 1.06, z: 0, axis: 'x+' });

    /* ==== 赤い ランプ ==== */
    lightBar(B, { x: cx - 0.15, y: 2.80, w: 1.55, n: 6, colors: [PAL.lampR, 0xfff0d0], part: 'lamp' });
    [1, -1].forEach(sz => {
      B.lamp({ x: bx + blen / 2 - 0.10, y: top - 0.10, z: sz * (W / 2 + 0.02), w: 0.16, h: 0.16, d: 0.10, color: PAL.lampR, strength: 1.5, part: 'lamp' });
    });

    /* ==== うしろの ステップ と ナンバー ==== */
    B.box({ x: rearX - 0.22, y: bot - 0.28, z: 0, w: 0.42, h: 0.07, d: W - 0.30, r: 0.03, mat: matte(0x30363f, 0.6), part: 'step' });
    plate(B, { x: rearX - 0.10, y: bot - 0.10, z: 0.55, axis: 'x-' });
    /* やねの アンテナ と かんきせん */
    B.cyl({ x: bx - 1.2, y: top + 0.35, z: 0.6, r: 0.012, h: 0.40, axis: 'y', seg: 6, mat: matte(0x22262d, 0.4), aux: true });
    B.box({ x: bx + 0.4, y: top + 0.22, z: 0, w: 0.5, h: 0.10, d: 0.5, r: 0.04, mat: matte(0xd9dee6, 0.5), aux: true });

    /* ==== タイヤ ==== */
    B.wheel({ x: 2.05, r: 0.42, w: 0.26, spread: 0.90 });
    B.wheel({ x: -1.55, r: 0.42, w: 0.26, spread: 0.90 });
    wheelArch(B, { x: 2.05, r: 0.42, spread: 0.90, w: 0.40, mat: matte(0x30363f, 0.6) });
    wheelArch(B, { x: -1.55, r: 0.42, spread: 0.90, w: 0.40, mat: matte(0x30363f, 0.6), flap: true });
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
    /* ボンネットの よこの スリット */
    [1, -1].forEach(sz => {
      for (let i = 0; i < 4; i++) {
        B.seam({ x: 1.30 + i * 0.17, y: 1.22, z: sz * 0.556, w: 0.055, h: 0.34, d: 0.012, color: 0x1f6238 });
      }
    });
    /* グリル（たての ぎんの スリット）と まえの おもり */
    B.box({ x: 1.98, y: 1.16, z: 0, w: 0.10, h: 0.62, d: 1.00, r: 0.06, mat: matte(0x1e232b, 0.45) });
    for (let i = -2; i <= 2; i++) {
      B.box({ x: 2.035, y: 1.16, z: i * 0.17, w: 0.03, h: 0.55, d: 0.035, r: 0.012, mat: metalMat(0xaeb7c2, 0.3) });
    }
    for (let i = 0; i < 4; i++) {
      B.box({ x: 2.16 + i * 0.055, y: 0.78, z: 0, w: 0.045, h: 0.42, d: 0.62, r: 0.03, mat: matte(0x3a414b, 0.55), part: 'body' });
    }
    [1, -1].forEach(sz => {
      B.lamp({ x: 2.02, y: 1.42, z: sz * 0.38, w: 0.06, h: 0.18, d: 0.24, color: 0xfff2cf, strength: 1.4, part: 'lamp' });
    });
    B.cyl({ x: 1.62, y: 1.90, z: 0.42, r: 0.06, h: 0.70, seg: 12, mat: metalMat(0x8d959f, 0.42) });
    B.cyl({ x: 1.62, y: 2.28, z: 0.42, r: 0.075, h: 0.05, seg: 10, mat: matte(0x3a414b, 0.5) });

    /* うんてんせき */
    const cbot = 1.35, ctop = 2.92;
    B.box({ x: -0.45, y: (ctop + cbot) / 2, z: 0, w: 1.45, h: ctop - cbot, d: 1.55, r: 0.16, b: 0.045, color: COL, part: 'cab', rough: 0.28 });
    B.glass({ x: 0.25, y: (ctop + cbot) / 2 + 0.10, z: 0, w: 0.10, h: (ctop - cbot) * 0.68, d: 1.30, r: 0.07, rz: -0.12, part: 'window' });
    [1, -1].forEach(sz => {
      B.glass({ x: -0.50, y: (ctop + cbot) / 2 + 0.10, z: sz * 0.76, w: 1.10, h: (ctop - cbot) * 0.60, d: 0.07, r: 0.06, part: 'window' });
    });
    B.glass({ x: -1.14, y: (ctop + cbot) / 2 + 0.08, z: 0, w: 0.08, h: (ctop - cbot) * 0.62, d: 1.30, r: 0.07, part: 'window' });
    /* とびらの あわせめ・ハンドル・ミラー・ワイパー */
    [1, -1].forEach(sz => {
      B.seam({ x: -1.05, y: (ctop + cbot) / 2 - 0.10, z: sz * 0.783, w: 0.024, h: (ctop - cbot) * 0.72, d: 0.03, part: 'cab' });
      doorHandle(B, { x: -0.85, y: (ctop + cbot) / 2 - 0.28, z: sz * 0.790, s: sz, len: 0.22 });
      B.cyl({ x: 0.28, y: ctop - 0.32, z: sz * 0.86, r: 0.016, h: 0.30, axis: 'z', seg: 8, mat: metalMat(0x9aa3ae, 0.35), aux: true });
      B.box({ x: 0.28, y: ctop - 0.42, z: sz * 1.04, w: 0.07, h: 0.26, d: 0.10, r: 0.03, mat: matte(0x2a2f38, 0.5), aux: true });
      B.box({ x: 0.24, y: ctop - 0.42, z: sz * 1.04, w: 0.012, h: 0.20, d: 0.075, r: 0.02, mat: metalMat(0xd9e3ec, 0.06), aux: true });
    });
    wipers(B, { x: 0.30, y: (ctop + cbot) / 2 - 0.28, z: 0, rz: -0.12, len: 0.42, n: 1, a: 0.7 });
    B.box({ x: -0.45, y: ctop + 0.09, z: 0, w: 1.55, h: 0.12, d: 1.62, r: 0.06, color: 0xe8ecf1, part: 'cab', rough: 0.4 });
    B.lamp({ x: 0.15, y: ctop + 0.14, z: 0.62, w: 0.14, h: 0.10, d: 0.22, color: 0xfff2cf, strength: 1.2, part: 'lamp' });
    B.lamp({ x: 0.15, y: ctop + 0.14, z: -0.62, w: 0.14, h: 0.10, d: 0.22, color: 0xfff2cf, strength: 1.2, part: 'lamp' });
    B.lamp({ x: -0.85, y: ctop + 0.20, z: 0, w: 0.13, h: 0.13, d: 0.13, color: 0xffa63d, strength: 1.2, aux: true });

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
    /* エンジンの よこの あみめ と まえの ライト */
    [1, -1].forEach(sz => {
      for (let i = 0; i < 3; i++) {
        B.seam({ x: -1.45 + i * 0.35, y: 1.46, z: sz * 0.82, w: 0.06, h: 0.44, d: 0.012, color: 0xb98812 });
      }
      B.lamp({ x: -1.86, y: 1.66, z: sz * 0.52, w: 0.06, h: 0.14, d: 0.20, color: 0xfff2cf, strength: 1.2, part: 'lamp' });
    });
    /* ローラーの まえに ついている ヘラ（どろを おとす） */
    [[1.62, 0.66, 2.00], [-1.62, 0.62, 1.86]].forEach(([px, rr, ww]) => {
      B.box({ x: px + (px > 0 ? 0.52 : -0.52), y: rr + 0.42, z: 0, w: 0.06, h: 0.10, d: ww - 0.10, r: 0.02, rz: px > 0 ? -0.5 : 0.5, mat: metalMat(0x7d858f, 0.4), part: 'roller' });
    });
    /* 水を まく くだ（ローラーの 上） */
    [[1.62, 1.42], [-1.62, 1.34]].forEach(([px, py]) => {
      B.cyl({ x: px, y: py, z: 0, r: 0.035, h: 1.85, axis: 'z', seg: 8, mat: metalMat(0x9aa3ae, 0.35), part: 'roller' });
    });
    /* のぼる ステップ */
    B.box({ x: 0.55, y: 0.72, z: 0.88, w: 0.42, h: 0.05, d: 0.26, r: 0.02, mat: matte(0x30363f, 0.62) });
    B.box({ x: 0.55, y: 1.12, z: 0.80, w: 0.42, h: 0.05, d: 0.26, r: 0.02, mat: matte(0x30363f, 0.62) });

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
    B.lamp({ parent: seat, x: -0.55, y: 3.06, z: 0, w: 0.13, h: 0.12, d: 0.13, color: 0xffa63d, strength: 1.2, aux: true });

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
    /* うしろの あぶない しるし（オレンジの 板）と ランプ・ナンバー */
    B.box({ x: -4.10, y: 2.30, z: 0, w: 0.03, h: 0.34, d: 0.42, r: 0.02, mat: paint(0xf07818, { rough: 0.35 }), aux: true });
    B.box({ x: -4.10, y: 1.78, z: 0, w: 0.03, h: 0.30, d: 0.30, r: 0.02, mat: paint(0xd8342c, { rough: 0.35 }), aux: true });
    tailLamps(B, { x: -4.55, y: 0.84, zOff: W / 2 - 0.42 });
    plate(B, { x: -4.55, y: 0.84, z: 0, axis: 'x-' });
    /* タンクへ のぼる はしご（うしろ） */
    [1, -1].forEach(sz => {
      B.box({ x: -3.55, y: 2.30, z: sz === 1 ? 0.85 : 0.55, w: 0.05, h: 2.30, d: 0.05, r: 0.02, mat: metalMat(0x9aa3ae, 0.35), part: 'tank' });
    });
    for (let i = 0; i < 5; i++) {
      B.box({ x: -3.55, y: 1.35 + i * 0.48, z: 0.70, w: 0.045, h: 0.045, d: 0.32, r: 0.02, mat: metalMat(0x9aa3ae, 0.35), part: 'tank' });
    }
    /* うしろタイヤの フェンダー と どろよけ */
    wheelArch(B, { x: -2.60, r: 0.56, spread: 1.04, w: 0.66 });
    wheelArch(B, { x: -3.95, r: 0.56, spread: 1.04, w: 0.66, flap: true });
    /* しょうかき の 赤い 箱 */
    B.box({ x: 1.95, y: 1.22, z: -(W / 2 - 0.12), w: 0.40, h: 0.50, d: 0.24, r: 0.05, mat: paint(0xd8342c, { rough: 0.3 }), part: 'tank' });

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
        for (let k = 0; k < 4; k++) {
          B.seam({ x: -1.10 + i * 1.30, y: 1.30 + k * 0.19, z: sz * (W / 2 + 0.030), w: 1.02, h: 0.022, d: 0.012, color: 0x9aa3ae });
        }
        B.box({ x: -1.10 + i * 1.30, y: 1.22, z: sz * (W / 2 + 0.040), w: 0.42, h: 0.042, d: 0.028, r: 0.014, mat: metalMat(PAL.chrome, 0.25), part: 'door' });
      }
    });
    B.box({ x: -1.10, y: 2.26, z: 0, w: 4.20, h: 0.14, d: W + 0.05, r: 0.05, mat: matte(0x3c434e, 0.6), part: 'body' });
    /* つなを まく きかい と ワイヤー */
    B.cyl({ x: 0.55, y: 2.52, z: 0, r: 0.28, h: 1.00, axis: 'z', seg: 22, mat: metalMat(0x8f98a3, 0.35), part: 'winch' });
    B.cyl({ x: 0.55, y: 2.52, z: 0, r: 0.22, h: 1.04, axis: 'z', seg: 22, mat: matte(0x2b3038, 0.6), part: 'winch' });
    B.cyl({ x: -0.05, y: 2.50, z: 0, r: 0.022, h: 1.30, axis: 'x', tilt: 0.10, seg: 8, mat: matte(0x33393f, 0.5), part: 'winch' });
    /* うしろの ランプ・ナンバー・はんしゃ */
    tailLamps(B, { x: -3.12, y: 0.82, zOff: W / 2 - 0.40 });
    plate(B, { x: -3.12, y: 0.82, z: 0, axis: 'x-' });
    /* まえの フェンダー */
    wheelArch(B, { x: 2.35, r: 0.53, spread: 0.98, w: 0.48 });
    [1, -1].forEach(sz => {
      B.box({ x: -2.72, y: 0.36, z: sz * 1.00, w: 0.045, h: 0.56, d: 0.54, r: 0.02, mat: matte(0x1d2127, 0.85) });
    });
    /* ブームの さぎょうとう */
    B.lamp({ x: -0.85, y: 2.62, z: 0.45, w: 0.12, h: 0.10, d: 0.12, color: 0xfff2cf, strength: 1.2, aux: true });

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


/* --------------------------------------------------- ごみしゅうしゅう車 */
MODEL3D.garbage = {
  label: 'ごみしゅうしゅう車',
  build: function (B) {
    const COL = 0xf0f2f5, ACC = 0x4aa564, W = 2.06;

    chassis(B, { x: -0.2, y: 0.74, len: 5.3, spread: 0.40 });

    /* ==== ごみを ためて おく ところ（にだい）==== */
    const nx = -0.45, nlen = 3.30, nbot = 0.94, ntop = 2.72;
    B.mesh(sideProfileGeom([
      [-nlen / 2, 0], [nlen / 2, 0], [nlen / 2, ntop - nbot],
      [nlen / 2 - 0.10, ntop - nbot + 0.16], [-nlen / 2 + 0.45, ntop - nbot + 0.16], [-nlen / 2, ntop - nbot - 0.10]
    ], W, 0.14), paint(COL, { metal: 0.35, rough: 0.3 }), { x: nx, y: nbot, z: 0, part: 'nidai' });
    [1, -1].forEach(sz => {
      B.box({ x: nx, y: nbot + 0.55, z: sz * (W / 2 + 0.012), w: nlen - 0.20, h: 0.24, d: 0.02, r: 0.01, mat: paint(ACC, { rough: 0.3 }) });
      for (let i = -1; i <= 1; i++) {
        B.seam({ x: nx + i * 1.05, y: nbot + 0.95, z: sz * (W / 2 + 0.012), w: 0.05, h: 1.45, d: 0.03, color: 0x9aa5b2, part: 'nidai' });
      }
    });

    /* ==== ごみを 入れる ところ（うしろ・ぐるっと まわる 板で おしこむ）==== */
    const hx = -2.32, hbot = 0.82, htop = 2.64;
    /* 3まいの かべ（うしろは 開いて いて 中が 見える）*/
    /* よこの かべ（うしろに むかって 下がる かたち。中が 見えるように うしろは あける）*/
    [1, -1].forEach(sz => {
      B.mesh(sideProfileGeom([
        [-0.70, 0], [0.70, 0], [0.70, htop - hbot], [-0.70, htop - hbot - 0.55]
      ], 0.10, 0.08), paint(COL, { rough: 0.3 }), { x: hx, y: hbot, z: sz * (W / 2 - 0.05), part: 'hopper' });
    });
    B.box({ x: hx + 0.62, y: (htop + hbot) / 2, z: 0, w: 0.12, h: htop - hbot, d: W, r: 0.05, color: COL, part: 'hopper', rough: 0.3 });
    B.box({ x: hx, y: hbot - 0.02, z: 0, w: 1.44, h: 0.16, d: W - 0.04, r: 0.04, mat: metalMat(0xaeb7c2, 0.4), part: 'hopper' });
    /* ごみを 入れる 口（ひくくて 入れやすい）*/
    B.box({ x: hx - 0.70, y: hbot + 0.30, z: 0, w: 0.14, h: 0.46, d: W - 0.10, r: 0.05, mat: metalMat(0x8f98a3, 0.4), part: 'hopper' });
    [1, -1].forEach(sz => {
      B.box({ x: hx - 0.66, y: hbot + 0.62, z: sz * (W / 2 - 0.08), w: 0.10, h: 0.62, d: 0.10, r: 0.03, mat: metalMat(0x8f98a3, 0.4), part: 'hopper' });
    });

    /* ぐるぐる まわる 板 */
    const packer = new THREE.Group();
    packer.position.set(hx + 0.06, hbot + 0.86, 0);
    B.root.add(packer);
    B.cyl({ parent: packer, x: 0, y: 0, z: 0, r: 0.14, h: W - 0.24, axis: 'z', seg: 16, mat: metalMat(0x8f98a3, 0.35), part: 'hopper' });
    [0, 1].forEach(k => {
      B.box({
        parent: packer, x: Math.cos(k * Math.PI) * 0.34, y: Math.sin(k * Math.PI) * 0.34, z: 0,
        w: 0.72, h: 0.10, d: W - 0.30, r: 0.03, rz: k * Math.PI, mat: metalMat(0xb9c0ca, 0.35), part: 'hopper'
      });
    });
    B.spin.push({ obj: packer, axis: 'z', speed: 0 });
    B.anim('hopper', 'ごみを おしこむ 板を まわす', v => { B.spin[B.spin.length - 1].speed = -v * 2.2; });

    /* ごみを 入れる 口の しまがら（きけんを しらせる） */
    [1, -1].forEach(sz => {
      for (let i = 0; i < 3; i++) {
        B.box({ x: hx - 0.72, y: hbot + 0.12 + i * 0.22, z: sz * (W / 2 - 0.02), w: 0.03, h: 0.11, d: 0.10, r: 0.01,
          mat: paint(i % 2 ? 0x22262d : 0xf5c433, { rough: 0.4 }), part: 'hopper' });
      }
      /* うしろに つかまる ての てすり と ステップ */
      B.cyl({ x: hx - 0.35, y: htop - 0.42, z: sz * (W / 2 + 0.035), r: 0.022, h: 0.85, axis: 'y', seg: 8, mat: metalMat(0xd8dee6, 0.3), aux: true });
      B.box({ x: hx - 0.62, y: 0.42, z: sz * (W / 2 - 0.20), w: 0.40, h: 0.05, d: 0.34, r: 0.02, mat: matte(0x30363f, 0.62), part: 'step' });
    });
    /* うしろの さぎょうとう */
    B.lamp({ x: hx - 0.05, y: htop + 0.06, z: 0, w: 0.14, h: 0.10, d: 0.20, color: 0xfff2cf, strength: 1.1, aux: true });

    /* ==== うんてんせき（まえに ちいさく・まるい やね）==== */
    const cx = 1.85, clen = 1.75, cbot = 0.82, ctop = 2.62;
    B.mesh(sideProfileGeom([
      [cx - clen / 2, cbot - 0.14],
      [cx - clen / 2, ctop],
      [cx + clen / 2 - 0.40, ctop],
      [cx + clen / 2 - 0.02, ctop - 0.55],
      [cx + clen / 2 + 0.02, cbot - 0.14]
    ], W, 0.14), paint(ACC, { rough: 0.26 }), { part: 'cab' });
    B.box({ x: cx + clen / 2 - 0.135, y: ctop - 0.62, z: 0, w: 0.06, h: 0.95, d: W - 0.20, r: 0.09, rz: -0.14, mat: matte(0x11151b, 0.5) });
    B.glass({ x: cx + clen / 2 - 0.10, y: ctop - 0.62, z: 0, w: 0.06, h: 0.86, d: W - 0.32, r: 0.08, rz: -0.14, part: 'window' });
    wipers(B, { x: cx + clen / 2 - 0.06, y: ctop - 1.02, z: -0.24, rz: -0.14, len: 0.40, gap: 0.58 });
    [1, -1].forEach(sz => {
      B.box({ x: cx - 0.28, y: ctop - 0.54, z: sz * (W / 2 - 0.030), w: 0.95, h: 0.80, d: 0.05, r: 0.08, mat: matte(0x11151b, 0.5) });
      B.glass({ x: cx - 0.28, y: ctop - 0.54, z: sz * (W / 2 - 0.006), w: 0.85, h: 0.72, d: 0.05, r: 0.07, part: 'window' });
      B.seam({ x: cx - 0.62, y: 1.72, z: sz * (W / 2 + 0.006), w: 0.028, h: 1.35, d: 0.03, part: 'door' });
      B.seam({ x: cx + 0.32, y: 1.72, z: sz * (W / 2 + 0.006), w: 0.028, h: 1.35, d: 0.03, part: 'door' });
      doorHandle(B, { x: cx - 0.20, y: 1.56, z: sz * (W / 2 + 0.012), s: sz, len: 0.24 });
      B.box({ x: cx - 0.30, y: 0.52, z: sz * (W / 2 - 0.16), w: 0.50, h: 0.06, d: 0.28, r: 0.02, mat: matte(PAL.frame, 0.7), part: 'step' });
      truckMirror(B, { x: cx + clen / 2 - 0.20, y: ctop - 0.16, s: sz, zIn: W / 2 - 0.06, zOut: W / 2 + 0.24, h: 0.42 });
      B.lamp({ x: cx + clen / 2 + 0.04, y: 1.16, z: sz * (W / 2 - 0.26), w: 0.06, h: 0.20, d: 0.28, color: 0xfff2cf, strength: 1.4, part: 'lamp' });
    });
    B.box({ x: cx + clen / 2 + 0.02, y: 0.92, z: 0, w: 0.24, h: 0.30, d: W + 0.02, r: 0.08, mat: matte(0x38404d, 0.55) });
    B.box({ x: cx + clen / 2 + 0.045, y: 1.44, z: 0, w: 0.05, h: 0.26, d: W * 0.66, r: 0.04, mat: matte(0x1e232b, 0.45) });
    for (let i = 0; i < 2; i++) {
      B.box({ x: cx + clen / 2 + 0.06, y: 1.38 + i * 0.12, z: 0, w: 0.025, h: 0.032, d: W * 0.62, r: 0.012, mat: metalMat(PAL.chrome, 0.2) });
    }
    plate(B, { x: cx + clen / 2 + 0.10, y: 0.92, z: 0, axis: 'x+' });
    B.lamp({ x: nx + nlen / 2 - 0.10, y: ntop, z: 0, w: 0.20, h: 0.14, d: 0.30, color: PAL.lampY, strength: 1.3, part: 'lamp' });

    /* ==== タイヤ ==== */
    B.wheel({ x: 1.70, r: 0.42, w: 0.26, spread: 0.86 });
    B.wheel({ x: -1.55, r: 0.42, w: 0.24, z: 0.76 });
    B.wheel({ x: -1.55, r: 0.42, w: 0.24, z: 1.00 });
    B.wheel({ x: -1.55, r: 0.42, w: 0.24, z: -0.76 });
    B.wheel({ x: -1.55, r: 0.42, w: 0.24, z: -1.00 });
    [1.70, -1.55].forEach(ax => {
      B.cyl({ x: ax, y: 0.42, z: 0, r: 0.09, h: 1.7, axis: 'z', seg: 14, mat: matte(PAL.frame, 0.6) });
    });
  }
};

/* --------------------------------------------------------------- バス */
MODEL3D.bus = {
  label: 'バス',
  build: function (B) {
    const COL = 0x2f7fd0, W = 2.48;
    const L = 10.4, FLOOR = 0.58, ROOF = 3.10;

    /* ==== よこの かべ（まどの ぶんだけ ぬく）==== */
    const glassBot = 1.62, glassTop = 2.62;
    [1, -1].forEach(sz => {
      const zz = sz * (W / 2 - 0.05);
      /* まどの 下の かべ（ゆかが 地めんの ちかくまで ひくい）*/
      B.box({ x: 0, y: (glassBot + FLOOR) / 2 - 0.04, z: zz, w: L, h: glassBot - FLOOR + 0.08, d: 0.10, r: 0.10, color: COL, part: 'body', rough: 0.28 });
      /* まどの 上の かべ */
      B.box({ x: 0, y: (glassTop + ROOF) / 2, z: zz, w: L, h: ROOF - glassTop, d: 0.10, r: 0.08, color: 0xeef2f7, part: 'body', rough: 0.3 });
      /* はしら（まどの あいだ）*/
      for (let i = -4; i <= 4; i++) {
        B.box({ x: i * 1.05 - 0.4, y: (glassTop + glassBot) / 2, z: zz, w: 0.10, h: glassTop - glassBot, d: 0.10, r: 0.03, color: 0xeef2f7, part: 'body', rough: 0.3 });
      }
      /* まど（中が 見えるように うすい）*/
      B.box({
        x: -0.4, y: (glassTop + glassBot) / 2, z: zz, w: L - 0.30, h: glassTop - glassBot, d: 0.06,
        r: 0.05, mat: clearGlassMat(), part: 'window'
      });
      /* 帯 */
      B.box({ x: 0, y: 1.30, z: sz * (W / 2 + 0.012), w: L - 0.20, h: 0.18, d: 0.02, r: 0.01, mat: paint(0xf5c433, { rough: 0.3 }) });
    });

    /* ゆか・やね・まえ・うしろ */
    B.box({ x: 0, y: FLOOR, z: 0, w: L, h: 0.16, d: W, r: 0.06, color: 0x39404c, part: 'body' });
    B.box({ x: 0, y: ROOF + 0.05, z: 0, w: L, h: 0.14, d: W, r: 0.10, color: 0xeef2f7, part: 'body', rough: 0.3 });
    B.box({ x: L / 2 - 0.05, y: (ROOF + FLOOR) / 2, z: 0, w: 0.12, h: ROOF - FLOOR, d: W - 0.06, r: 0.12, color: COL, part: 'cab', rough: 0.28 });
    B.glass({ x: L / 2 + 0.01, y: 2.20, z: 0, w: 0.09, h: 1.10, d: W - 0.30, r: 0.10, rz: -0.06, part: 'window' });
    B.box({ x: -L / 2 + 0.05, y: (ROOF + FLOOR) / 2, z: 0, w: 0.12, h: ROOF - FLOOR, d: W - 0.06, r: 0.12, color: COL, part: 'body', rough: 0.28 });
    B.glass({ x: -L / 2 - 0.01, y: 2.20, z: 0, w: 0.09, h: 0.90, d: W - 0.40, r: 0.10, part: 'window' });
    [1, -1].forEach(sz => {
      B.lamp({ x: L / 2 + 0.03, y: 1.02, z: sz * (W / 2 - 0.32), w: 0.06, h: 0.22, d: 0.34, color: 0xfff2cf, strength: 1.4, part: 'lamp' });
      B.lamp({ x: -L / 2 - 0.03, y: 1.02, z: sz * (W / 2 - 0.32), w: 0.06, h: 0.22, d: 0.30, color: PAL.lampR, strength: 1.1, part: 'lamp' });
    });
    B.box({ x: L / 2 + 0.02, y: 2.86, z: 0, w: 0.08, h: 0.30, d: W - 0.60, r: 0.04, mat: matte(0x1b2028, 0.5) });
    /* いきさきの ひょうじ（うしろ・よこ）*/
    B.box({ x: -L / 2 - 0.015, y: 2.80, z: 0, w: 0.05, h: 0.24, d: 0.90, r: 0.03, mat: matte(0x1b2028, 0.5) });
    /* まえの バンパー・ワイパー・ナンバー */
    B.box({ x: L / 2 + 0.04, y: 0.66, z: 0, w: 0.16, h: 0.34, d: W - 0.04, r: 0.07, mat: matte(0x2a2f38, 0.5) });
    B.box({ x: -L / 2 - 0.04, y: 0.66, z: 0, w: 0.16, h: 0.34, d: W - 0.04, r: 0.07, mat: matte(0x2a2f38, 0.5) });
    wipers(B, { x: L / 2 + 0.05, y: 1.66, z: -0.35, rz: -0.06, len: 0.65, gap: 0.85 });
    plate(B, { x: L / 2 + 0.10, y: 0.62, z: 0, axis: 'x+' });
    plate(B, { x: -L / 2 - 0.10, y: 0.62, z: 0, axis: 'x-' });
    /* バスの 大きな ミラー（まえに つきだした うで） */
    [1, -1].forEach(sz => {
      B.cyl({ x: L / 2 - 0.10, y: 2.72, z: sz * (W / 2 - 0.10), r: 0.020, h: 0.55, axis: 'y', tilt: sz * 0.45, seg: 8, mat: matte(0x22262d, 0.5), aux: true });
      B.box({ x: L / 2 + 0.14, y: 2.30, z: sz * (W / 2 + 0.10), w: 0.10, h: 0.48, d: 0.22, r: 0.05, mat: matte(0x22262d, 0.5), aux: true });
      B.box({ x: L / 2 + 0.10, y: 2.30, z: sz * (W / 2 + 0.10), w: 0.012, h: 0.40, d: 0.17, r: 0.04, mat: metalMat(0xd9e3ec, 0.05), aux: true });
    });
    /* やねの クーラー と かんきせん */
    B.box({ x: -0.8, y: ROOF + 0.22, z: 0, w: 2.6, h: 0.22, d: 1.7, r: 0.08, mat: paint(0xdfe5ec, { rough: 0.4 }), part: 'body' });
    B.box({ x: 2.2, y: ROOF + 0.16, z: 0, w: 0.5, h: 0.10, d: 0.5, r: 0.04, mat: matte(0xc8cfd8, 0.5) });
    /* うしろの エンジンの あみ */
    for (let i = 0; i < 4; i++) {
      B.seam({ x: -L / 2 - 0.012, y: 0.92 + i * 0.14, z: -0.55, w: 0.02, h: 0.05, d: 0.85, color: 0x2a5f9e });
    }
    /* よこの ちいさな マーカーランプ */
    [1, -1].forEach(sz => {
      [-4.2, 0, 4.2].forEach(mx => {
        B.lamp({ x: mx, y: 0.78, z: sz * (W / 2 + 0.012), w: 0.09, h: 0.06, d: 0.03, color: 0xffa63d, strength: 0.8, aux: true });
      });
    });

    /* ==== 中の ざせき（まん中の つうろを あけて ならぶ）==== */
    const seatMat = matte(0x2f5f9c, 0.8), backMat = matte(0x27508a, 0.8);
    for (let i = 0; i < 8; i++) {
      const sx = 3.15 - i * 0.90;
      [1, -1].forEach(sz => {
        B.box({ x: sx, y: 1.14, z: sz * 0.72, w: 0.46, h: 0.10, d: 0.92, r: 0.05, mat: seatMat, part: 'seat' });
        B.box({ x: sx - 0.24, y: 1.42, z: sz * 0.72, w: 0.10, h: 0.60, d: 0.92, r: 0.05, mat: backMat, part: 'seat' });
      });
    }
    /* うしろの ながい ざせき */
    B.box({ x: -4.45, y: 1.14, z: 0, w: 0.50, h: 0.10, d: W - 0.30, r: 0.05, mat: seatMat, part: 'seat' });
    B.box({ x: -4.68, y: 1.42, z: 0, w: 0.10, h: 0.60, d: W - 0.30, r: 0.05, mat: backMat, part: 'seat' });
    /* うんてんせき */
    B.box({ x: 4.05, y: 1.16, z: 0.66, w: 0.50, h: 0.12, d: 0.56, r: 0.05, mat: matte(0x2f3640, 0.75), part: 'seat' });
    B.box({ x: 3.80, y: 1.52, z: 0.66, w: 0.12, h: 0.62, d: 0.56, r: 0.05, mat: matte(0x2f3640, 0.75), part: 'seat' });
    B.mesh(new THREE.TorusGeometry(0.22, 0.03, 8, 22), matte(0x22262d, 0.6),
      { x: 4.45, y: 1.62, z: 0.66, ry: Math.PI / 2, rz: -0.42 });

    /* 立って のる 人の ための つりかわ */
    [1, -1].forEach(sz => {
      B.box({ x: -0.4, y: 2.52, z: sz * 0.52, w: L - 1.6, h: 0.05, d: 0.05, r: 0.02, mat: metalMat(0xb9c0ca, 0.3) });
      for (let i = -4; i <= 4; i++) {
        B.mesh(new THREE.TorusGeometry(0.09, 0.016, 8, 16), matte(0xd8b64a, 0.6),
          { x: -0.4 + i * 0.90, y: 2.30, z: sz * 0.52, ry: Math.PI / 2, part: 'seat' });
        B.cyl({ x: -0.4 + i * 0.90, y: 2.42, z: sz * 0.52, r: 0.012, h: 0.20, seg: 6, mat: matte(0x8f98a3, 0.6), part: 'seat' });
      }
    });

    /* ==== とびら（二まいに 分かれて ひらく）==== */
    const doors = [];
    [[3.05, 1], [-1.15, 1]].forEach(([dx, sz]) => {
      [-1, 1].forEach(half => {
        const hinge = new THREE.Group();
        hinge.position.set(dx + half * 0.56, 0, sz * (W / 2 - 0.05));
        B.root.add(hinge);
        doors.push({ g: hinge, half: half });
        B.box({ parent: hinge, x: -half * 0.28, y: (2.62 + FLOOR) / 2 + 0.04, z: 0, w: 0.52, h: 2.62 - FLOOR, d: 0.09, r: 0.05, color: 0xdfe6ee, part: 'door', rough: 0.3 });
        B.box({
          parent: hinge, x: -half * 0.28, y: 2.16, z: 0.01, w: 0.38, h: 1.00, d: 0.05,
          r: 0.04, mat: clearGlassMat(), part: 'door'
        });
      });
      /* だんの ない ひくい ゆか */
      B.box({ x: dx, y: 0.30, z: sz * (W / 2 - 0.30), w: 1.15, h: 0.10, d: 0.50, r: 0.03, mat: matte(0x4a525f, 0.7), part: 'door' });
    });
    B.anim('door', 'とびらを ひらく', v => {
      doors.forEach(d => { d.g.rotation.y = -d.half * v * 1.45; });
    });

    /* ==== タイヤ ==== */
    B.wheel({ x: 3.55, r: 0.52, w: 0.32, spread: 1.02 });
    B.wheel({ x: -3.20, r: 0.52, w: 0.28, z: 0.88 });
    B.wheel({ x: -3.20, r: 0.52, w: 0.28, z: 1.16 });
    B.wheel({ x: -3.20, r: 0.52, w: 0.28, z: -0.88 });
    B.wheel({ x: -3.20, r: 0.52, w: 0.28, z: -1.16 });
    [1, -1].forEach(sz => {
      B.mesh(curvedPlateGeom(0.66, 0.06, 0.30, 2.84, 0.42, 14), paint(COL, { rough: 0.3 }),
        { x: 3.55, y: 0.52, z: sz * 1.05, part: 'body' });
    });
  }
};

/* ------------------------------------------------------------ パトカー */
MODEL3D.police = {
  label: 'パトカー',
  build: function (B) {
    const W = 1.76, L = 4.70;
    /* よこ顔（ボンネット → ベルトライン → トランク）。まどの ところは あける */
    const body = [
      [-L / 2, 0.30], [-L / 2 + 0.06, 0.72], [-L / 2 + 0.30, 0.92],
      [-1.30, 1.02], [0.98, 1.06],
      [1.90, 0.92], [L / 2 - 0.10, 0.80], [L / 2, 0.44], [L / 2 - 0.20, 0.26],
      [1.05, 0.22], [-1.15, 0.22], [-L / 2 + 0.20, 0.26]
    ];
    B.mesh(sideProfileGeom(body, W, 0.16), paint(0xf2f5f9, { metal: 0.25, rough: 0.22, clear: 1.0 }),
      { x: 0, y: 0, z: 0, part: 'cab' });
    /* やねと はしら */
    B.mesh(sideProfileGeom([
      [-1.12, 1.00], [-0.82, 1.44], [0.42, 1.48], [1.02, 1.02],
      [0.85, 1.02], [0.32, 1.36], [-0.70, 1.32], [-0.92, 1.00]
    ], W - 0.05, 0.045), paint(0xf2f5f9, { metal: 0.25, rough: 0.22, clear: 1.0 }), { x: 0, y: 0, z: 0, part: 'cab' });
    /* 中の ゆか・ダッシュボード・ざせき */
    B.box({ x: -0.16, y: 1.035, z: 0, w: 2.15, h: 0.05, d: W - 0.24, r: 0.03, mat: matte(0x232830, 0.85), part: 'cab' });
    B.box({ x: 0.82, y: 1.10, z: 0, w: 0.30, h: 0.10, d: W - 0.30, r: 0.04, mat: matte(0x2a2f38, 0.7), part: 'cab' });
    [[0.45, 1], [0.45, -1], [-0.55, 1], [-0.55, -1]].forEach(([sx, sz]) => {
      B.box({ x: sx - 0.20, y: 1.22, z: sz * 0.40, w: 0.10, h: 0.34, d: 0.40, r: 0.04, mat: matte(0x2f3d52, 0.8), part: 'cab' });
    });
    /* パトカーの くろい ぶぶん（ドアの あたり）*/
    [1, -1].forEach(sz => {
      B.box({ x: -0.15, y: 0.62, z: sz * (W / 2 + 0.008), w: 2.55, h: 0.62, d: 0.02, r: 0.06, mat: paint(0x1b2028, { rough: 0.24, clear: 1.0 }) });
      B.seam({ x: -0.62, y: 0.78, z: sz * (W / 2 + 0.018), w: 0.026, h: 0.86, d: 0.03, color: 0x8d97a5, part: 'door' });
      B.seam({ x: 0.52, y: 0.78, z: sz * (W / 2 + 0.018), w: 0.026, h: 0.86, d: 0.03, color: 0x8d97a5, part: 'door' });
      /* ドアハンドル と ドアミラー */
      doorHandle(B, { x: -0.30, y: 0.96, z: sz * (W / 2 + 0.012), s: sz, len: 0.20 });
      doorHandle(B, { x: 0.90, y: 0.96, z: sz * (W / 2 + 0.012), s: sz, len: 0.20 });
      doorMirror(B, { x: 0.80, y: 1.02, z: sz * (W / 2 - 0.02), s: sz, color: 0xf2f5f9 });
      /* ライト（ふちどり つき） */
      B.box({ x: L / 2 - 0.055, y: 0.72, z: sz * (W / 2 - 0.24), w: 0.10, h: 0.19, d: 0.38, r: 0.05, mat: metalMat(0xb9c2cc, 0.3) });
      B.lamp({ x: L / 2 - 0.03, y: 0.72, z: sz * (W / 2 - 0.24), w: 0.12, h: 0.15, d: 0.32, color: 0xfff6e0, strength: 1.5, part: 'lamp' });
      B.lamp({ x: -L / 2 + 0.05, y: 0.74, z: sz * (W / 2 - 0.24), w: 0.10, h: 0.16, d: 0.30, color: PAL.lampR, strength: 1.2, part: 'lamp' });
      /* タイヤの アーチの ふちどり */
      B.mesh(curvedPlateGeom(0.42, 0.035, 0.15, Math.PI - 0.15, 0.05, 12), matte(0x1b2028, 0.5),
        { x: 1.42, y: 0.34, z: sz * 0.86 });
      B.mesh(curvedPlateGeom(0.42, 0.035, 0.15, Math.PI - 0.15, 0.05, 12), matte(0x1b2028, 0.5),
        { x: -1.45, y: 0.34, z: sz * 0.86 });
    });
    /* ワイパー（ねかせた まえガラスに あわせる） */
    wipers(B, { x: 0.90, y: 1.06, z: -0.28, rz: -0.95, len: 0.36, gap: 0.55 });
    /* まど（よこ顔の かたちで 一気に。車体より ほんの すこし ふとくして 外に 出す）*/
    B.mesh(sideProfileGeom([
      [-1.02, 1.06], [-0.78, 1.42], [0.40, 1.46], [0.94, 1.06]
    ], W + 0.015, 0.07), glassMat(B.quality), { x: 0, y: 0, z: 0, part: 'window' });
    /* まどわくの ほそい はしら */
    [1, -1].forEach(sz => {
      B.box({ x: -0.16, y: 1.24, z: sz * (W / 2 + 0.012), w: 0.05, h: 0.40, d: 0.03, r: 0.01, mat: metalMat(0xc7ced7, 0.3) });
      B.box({ x: 0.46, y: 1.26, z: sz * (W / 2 + 0.012), w: 0.05, h: 0.40, d: 0.03, r: 0.01, rz: -0.6, mat: metalMat(0xc7ced7, 0.3) });
    });

    /* グリル・バンパー・ナンバー・エンブレム */
    B.box({ x: L / 2 - 0.02, y: 0.62, z: 0, w: 0.06, h: 0.20, d: W - 0.44, r: 0.04, mat: matte(0x1e232b, 0.45) });
    B.box({ x: L / 2 - 0.005, y: 0.62, z: 0, w: 0.03, h: 0.035, d: W - 0.50, r: 0.015, mat: metalMat(PAL.chrome, 0.2) });
    B.cyl({ x: L / 2 + 0.012, y: 0.63, z: 0, r: 0.045, h: 0.025, axis: 'x', seg: 14, mat: metalMat(PAL.chrome, 0.12) });
    B.box({ x: L / 2 - 0.08, y: 0.36, z: 0, w: 0.22, h: 0.26, d: W - 0.04, r: 0.08, mat: matte(0x2a2f38, 0.5) });
    B.box({ x: -L / 2 + 0.08, y: 0.36, z: 0, w: 0.22, h: 0.26, d: W - 0.04, r: 0.08, mat: matte(0x2a2f38, 0.5) });
    plate(B, { x: L / 2 + 0.02, y: 0.38, z: 0, axis: 'x+' });
    plate(B, { x: -L / 2 - 0.02, y: 0.38, z: 0, axis: 'x-' });
    /* うしろの テールランプ（よこなが） */
    [1, -1].forEach(sz => {
      B.lamp({ x: -L / 2 + 0.035, y: 0.60, z: sz * (W / 2 - 0.22), w: 0.05, h: 0.10, d: 0.30, color: PAL.lampR, strength: 1.0, aux: true });
    });

    /* ==== やねの ランプ（赤い 回転灯）==== */
    B.box({ x: -0.18, y: 1.53, z: 0, w: 0.62, h: 0.07, d: 1.16, r: 0.03, mat: matte(0x2b3038, 0.55), part: 'lamp' });
    [1, -1].forEach(sz => {
      B.lamp({ x: -0.18, y: 1.62, z: sz * 0.36, w: 0.46, h: 0.16, d: 0.40, color: PAL.lampR, strength: 1.8, part: 'lamp' });
    });
    B.box({ x: -0.18, y: 1.62, z: 0, w: 0.46, h: 0.16, d: 0.30, r: 0.05, mat: matte(0xe8ecf1, 0.4), part: 'lamp' });
    /* とおくと 話す ための アンテナ（うしろの やねに ちいさく）*/
    B.cyl({ x: -1.02, y: 1.62, z: -0.36, r: 0.010, h: 0.52, seg: 8, tilt: 0.14, mat: matte(0x22262d, 0.5), part: 'antenna' });
    B.cyl({ x: -1.02, y: 1.38, z: -0.36, r: 0.035, h: 0.08, seg: 12, mat: matte(0x2b3038, 0.6), part: 'antenna' });

    /* ==== タイヤ ==== */
    B.wheel({ x: 1.42, r: 0.34, w: 0.22, spread: 0.78 });
    B.wheel({ x: -1.45, r: 0.34, w: 0.22, spread: 0.78 });
  }
};


/* -------------------------------------------------------- トーイングカー */
MODEL3D.towing = {
  label: 'トーイングカー',
  build: function (B) {
    const COL = 0xf0b21c, W = 2.62, L = 4.60;

    /* ひこうきの 下に もぐれる ように、うんと ひくい からだ */
    B.mesh(sideProfileGeom([
      [-L / 2, 0.26], [L / 2, 0.26], [L / 2, 0.92], [1.05, 1.00],
      [0.55, 1.00], [0.55, 0.98], [-0.95, 0.98], [-L / 2, 0.90]
    ], W, 0.12), paint(COL, { rough: 0.28 }), { x: 0, y: 0, z: 0, part: 'body' });
    /* 上の すべりどめの ゆか */
    B.box({ x: -0.20, y: 1.02, z: 0, w: 3.10, h: 0.06, d: W - 0.14, r: 0.03, mat: matte(0x59616e, 0.75), part: 'body' });
    [1, -1].forEach(sz => {
      B.box({ x: 0, y: 0.62, z: sz * (W / 2 + 0.012), w: L - 0.30, h: 0.22, d: 0.02, r: 0.01, mat: paint(0x1b2028, { rough: 0.3 }) });
    });

    /* まん中に ひくく すわる うんてんせき（前後どちらも 見える）*/
    const cx = -0.30, cw = 1.35, cd = 1.30, cbot = 1.02, ctop = 2.16;
    B.box({ x: cx, y: cbot + 0.10, z: 0, w: cw + 0.10, h: 0.18, d: cd + 0.10, r: 0.05, color: COL, part: 'cab', rough: 0.3 });
    [[cw / 2, cd / 2], [cw / 2, -cd / 2], [-cw / 2, cd / 2], [-cw / 2, -cd / 2]].forEach(([px, pz]) => {
      B.box({ x: cx + px, y: (ctop + cbot) / 2 + 0.14, z: pz, w: 0.09, h: ctop - cbot, d: 0.09, r: 0.03, mat: matte(0x3c434e, 0.55), part: 'cab' });
    });
    B.box({ x: cx, y: ctop + 0.20, z: 0, w: cw + 0.24, h: 0.10, d: cd + 0.24, r: 0.05, color: COL, part: 'cab', rough: 0.4 });
    [1, -1].forEach(sx => {
      B.glass({ x: cx + sx * (cw / 2 - 0.02), y: (ctop + cbot) / 2 + 0.16, z: 0, w: 0.07, h: (ctop - cbot) * 0.74, d: cd - 0.18, r: 0.06, part: 'window' });
    });
    B.box({ x: cx - 0.20, y: 1.40, z: 0, w: 0.55, h: 0.12, d: 0.60, r: 0.05, mat: matte(0x2f3640, 0.7), part: 'cab' });
    B.box({ x: cx - 0.46, y: 1.68, z: 0, w: 0.12, h: 0.52, d: 0.58, r: 0.05, mat: matte(0x2f3640, 0.7), part: 'cab' });
    B.mesh(new THREE.TorusGeometry(0.20, 0.028, 8, 22), matte(0x22262d, 0.6),
      { x: cx + 0.28, y: 1.62, z: 0, ry: Math.PI / 2, rz: -0.5 });
    B.lamp({ x: cx, y: ctop + 0.34, z: 0, w: 0.24, h: 0.16, d: 0.24, color: PAL.lampY, strength: 1.6, part: 'lamp' });
    /* ミラー と ワイパー */
    [1, -1].forEach(sz => {
      B.box({ x: cx + cw / 2 + 0.10, y: ctop - 0.28, z: sz * (cd / 2 + 0.10), w: 0.08, h: 0.26, d: 0.12, r: 0.04, mat: matte(0x2a2f38, 0.5), aux: true });
      B.box({ x: cx + cw / 2 + 0.065, y: ctop - 0.28, z: sz * (cd / 2 + 0.10), w: 0.012, h: 0.20, d: 0.09, r: 0.03, mat: metalMat(0xd9e3ec, 0.06), aux: true });
    });
    wipers(B, { x: cx + cw / 2 + 0.02, y: (ctop + cbot) / 2 - 0.15, z: 0, len: 0.36, n: 1, a: 0.8 });
    /* よこの はんしゃばん */
    [1, -1].forEach(sz => {
      [1.45, -1.45].forEach(mx => {
        B.lamp({ x: mx + 0.75, y: 0.50, z: sz * (W / 2 + 0.012), w: 0.08, h: 0.055, d: 0.03, color: 0xffa63d, strength: 0.7, aux: true });
      });
    });

    /* ひこうきと つなぐ ところ（前と うしろ）*/
    [1, -1].forEach(sx => {
      const hx = sx * (L / 2);
      B.box({ x: hx + sx * 0.22, y: 0.52, z: 0, w: 0.50, h: 0.26, d: 0.46, r: 0.05, mat: metalMat(0x8f98a3, 0.35), part: 'hitch' });
      B.cyl({ x: hx + sx * 0.34, y: 0.72, z: 0, r: 0.07, h: 0.42, seg: 14, mat: metalMat(0xdfe4ea, 0.2), part: 'hitch' });
      B.mesh(new THREE.TorusGeometry(0.16, 0.045, 10, 22), metalMat(0xb9c0ca, 0.3),
        { x: hx + sx * 0.34, y: 0.52, z: 0, rx: Math.PI / 2, part: 'hitch' });
      B.lamp({ x: hx + sx * 0.02, y: 0.78, z: 0.86, w: 0.08, h: 0.14, d: 0.20, color: sx > 0 ? 0xfff2cf : PAL.lampR, strength: 1.3, part: 'lamp' });
      B.lamp({ x: hx + sx * 0.02, y: 0.78, z: -0.86, w: 0.08, h: 0.14, d: 0.20, color: sx > 0 ? 0xfff2cf : PAL.lampR, strength: 1.3, part: 'lamp' });
    });

    /* ちいさくて ふとい タイヤ */
    B.wheel({ x: 1.45, r: 0.42, w: 0.44, spread: 1.02 });
    B.wheel({ x: -1.45, r: 0.42, w: 0.44, spread: 1.02 });
  }
};

/* ----------------------------------------------------- ホイールローダー */
MODEL3D.loader = {
  label: 'ホイールローダー',
  build: function (B) {
    const COL = 0xf0b21c, W = 2.70;

    /* うしろ（エンジンと おもり）*/
    B.box({ x: -1.85, y: 1.28, z: 0, w: 2.60, h: 1.16, d: 2.00, r: 0.16, color: COL, part: 'body', rough: 0.3 });
    B.box({ x: -3.05, y: 1.00, z: 0, w: 0.55, h: 1.10, d: 1.90, r: 0.14, mat: paint(0xd99a12, { rough: 0.38 }), part: 'body' });
    B.cyl({ x: -1.10, y: 2.10, z: 0.62, r: 0.09, h: 0.60, seg: 14, mat: metalMat(0x8d959f, 0.42) });

    /* うんてんせき（高い ところから 前が よく 見える）*/
    const cbot = 1.86, ctop = 3.40;
    B.box({ x: -1.05, y: (ctop + cbot) / 2, z: 0, w: 1.55, h: ctop - cbot, d: 1.72, r: 0.16, b: 0.045, color: COL, part: 'cab', rough: 0.28 });
    B.glass({ x: -1.05 + 0.74, y: (ctop + cbot) / 2 + 0.08, z: 0, w: 0.08, h: (ctop - cbot) * 0.70, d: 1.45, r: 0.07, rz: -0.10, part: 'window' });
    [1, -1].forEach(sz => {
      B.glass({ x: -1.10, y: (ctop + cbot) / 2 + 0.08, z: sz * 0.84, w: 1.20, h: (ctop - cbot) * 0.62, d: 0.07, r: 0.06, part: 'window' });
    });
    B.glass({ x: -1.82, y: (ctop + cbot) / 2 + 0.06, z: 0, w: 0.08, h: (ctop - cbot) * 0.60, d: 1.40, r: 0.07, part: 'window' });
    B.box({ x: -1.05, y: ctop + 0.09, z: 0, w: 1.62, h: 0.12, d: 1.80, r: 0.06, color: 0xe8ecf1, part: 'cab', rough: 0.4 });
    [1, -1].forEach(sz => {
      B.lamp({ x: -0.35, y: ctop + 0.14, z: sz * 0.68, w: 0.14, h: 0.10, d: 0.22, color: 0xfff2cf, strength: 1.2, part: 'lamp' });
      B.lamp({ x: -1.78, y: ctop + 0.14, z: sz * 0.68, w: 0.13, h: 0.10, d: 0.20, color: 0xfff2cf, strength: 1.1, aux: true });
    });
    /* とびら・ハンドル・ミラー・のぼる かいだん */
    B.seam({ x: -1.05 - 0.45, y: (ctop + cbot) / 2 - 0.14, z: 0.87, w: 0.026, h: (ctop - cbot) * 0.72, d: 0.03, part: 'cab' });
    doorHandle(B, { x: -1.28, y: (ctop + cbot) / 2 - 0.32, z: 0.875, s: 1, len: 0.22 });
    [1, -1].forEach(sz => {
      B.cyl({ x: -0.32, y: ctop - 0.42, z: sz * 0.90, r: 0.018, h: 0.28, axis: 'z', seg: 8, mat: metalMat(0x9aa3ae, 0.35), aux: true });
      B.box({ x: -0.32, y: ctop - 0.46, z: sz * 1.10, w: 0.08, h: 0.30, d: 0.12, r: 0.04, mat: matte(0x2a2f38, 0.5), aux: true });
      B.box({ x: -0.36, y: ctop - 0.46, z: sz * 1.10, w: 0.012, h: 0.24, d: 0.09, r: 0.03, mat: metalMat(0xd9e3ec, 0.06), aux: true });
    });
    B.box({ x: -1.05, y: 1.10, z: 1.02, w: 0.55, h: 0.05, d: 0.34, r: 0.02, mat: matte(0x30363f, 0.62), part: 'step' });
    B.box({ x: -1.05, y: 1.52, z: 0.94, w: 0.55, h: 0.05, d: 0.34, r: 0.02, mat: matte(0x30363f, 0.62), part: 'step' });
    B.cyl({ x: -0.42, y: 1.45, z: 0.96, r: 0.022, h: 0.95, axis: 'y', seg: 8, mat: paint(0xd99a12, { rough: 0.4 }), aux: true });
    wipers(B, { x: -1.05 + 0.78, y: (ctop + cbot) / 2 - 0.28, z: 0, rz: -0.10, len: 0.5, n: 1, a: 0.8 });
    /* タイヤの うえの フェンダー（ささえの はしら つき） */
    [1.35, -1.85].forEach(fx => {
      [1, -1].forEach(sz => {
        B.box({ x: fx, y: 1.90, z: sz * 1.06, w: 1.30, h: 0.07, d: 0.70, r: 0.03, mat: paint(0xd99a12, { rough: 0.38 }), part: 'body' });
        B.box({ x: fx + 0.62, y: 1.62, z: sz * 1.06, w: 0.07, h: 0.60, d: 0.70, r: 0.03, rz: -0.25, mat: paint(0xd99a12, { rough: 0.38 }), part: 'body' });
        B.box({ x: fx - 0.55, y: 1.62, z: sz * 1.06, w: 0.07, h: 0.60, d: 0.70, r: 0.03, rz: 0.25, mat: paint(0xd99a12, { rough: 0.38 }), part: 'body' });
        B.box({ x: fx, y: 1.55, z: sz * 0.88, w: 0.10, h: 0.65, d: 0.10, r: 0.03, mat: matte(0x59616e, 0.5), part: 'body' });
      });
    });

    /* まん中の つなぎめ（ここで 車が くの字に 曲がる）*/
    B.cyl({ x: -0.45, y: 1.10, z: 0, r: 0.30, h: 0.80, seg: 20, mat: metalMat(0x8f98a3, 0.4), part: 'body' });
    B.box({ x: 0.75, y: 1.02, z: 0, w: 2.60, h: 0.72, d: 1.70, r: 0.10, color: COL, part: 'body', rough: 0.3 });
    B.box({ x: 1.45, y: 0.70, z: 0, w: 1.60, h: 0.34, d: 1.90, r: 0.06, mat: matte(0x4d545e, 0.6), part: 'body' });

    /* うでと バケット */
    const arm = new THREE.Group();
    arm.position.set(0.35, 1.42, 0);
    B.root.add(arm);
    [1, -1].forEach(sz => {
      B.box({ parent: arm, x: 1.25, y: 0, z: sz * 0.86, w: 2.80, h: 0.40, d: 0.32, r: 0.09, color: COL, part: 'bucket', rough: 0.32 });
    });
    B.box({ parent: arm, x: 1.20, y: 0.02, z: 0, w: 0.90, h: 0.22, d: 1.75, r: 0.06, color: COL, part: 'bucket', rough: 0.32 });
    B.cyl({ parent: arm, x: 0, y: 0, z: 0, r: 0.20, h: 1.90, axis: 'z', seg: 18, mat: metalMat(0x9aa3ae, 0.4), part: 'bucket' });
    /* もち上げる シリンダー */
    const ram = new THREE.Group();
    ram.position.set(-0.10, 1.05, 0);
    B.root.add(ram);
    [1, -1].forEach(sz => {
      B.cyl({ parent: ram, x: 0.70, y: 0, z: sz * 0.62, r: 0.14, h: 1.40, axis: 'x', seg: 14, mat: matte(0x59616e, 0.5), part: 'bucket' });
      B.cyl({ parent: ram, x: 1.60, y: 0, z: sz * 0.62, r: 0.08, h: 0.90, axis: 'x', seg: 12, mat: metalMat(0xdfe4ea, 0.14), part: 'bucket' });
    });

    /* すくう ところ（ひろくて 大きい）*/
    /* すくう ところ（口が 上まえを むくように、円の 中心を 口がわに おく）*/
    const bkt = new THREE.Group();
    bkt.position.set(3.20, 0.62, 0);
    arm.add(bkt);
    const A0 = Math.PI * 0.98, A1 = Math.PI * 1.56, RB = 0.92;
    B.mesh(curvedPlateGeom(RB, 0.09, A0, A1, 2.60, 18),
      metalMat(0x9099a5, 0.42), { parent: bkt, part: 'bucket' });
    [1, -1].forEach(sz => {
      B.mesh(curvedPlateGeom(RB, 0.09, A0, A1, 0.07, 18),
        metalMat(0x7d858f, 0.5), { parent: bkt, z: sz * 1.30, part: 'bucket' });
    });
    /* するどい つめ（前の 下がわ）*/
    for (let i = 0; i < 6; i++) {
      B.box({
        parent: bkt, x: Math.cos(A1) * (RB + 0.16), y: Math.sin(A1) * (RB + 0.16),
        z: (-2.5 + i) * 0.44, w: 0.34, h: 0.14, d: 0.16, r: 0.03, rz: A1 - Math.PI * 1.5,
        mat: metalMat(0xc8cfd8, 0.25), part: 'bucket'
      });
    }

    /* 人の せの 高さほども ある 大きな タイヤ */
    B.wheel({ x: 1.35, r: 0.88, w: 0.62, spread: 1.04, part: 'bigtire' });
    B.wheel({ x: -1.85, r: 0.88, w: 0.62, spread: 1.04, part: 'bigtire' });
    [1.35, -1.85].forEach(ax => {
      B.cyl({ x: ax, y: 0.88, z: 0, r: 0.16, h: 2.0, axis: 'z', seg: 14, mat: matte(PAL.frame, 0.6) });
    });

    B.anim('bucket', 'バケットを 上げる', v => {
      arm.rotation.z = v * 0.80;
      bkt.rotation.z = -v * 0.55;
      ram.rotation.z = v * 0.40;
      ram.scale.x = 1 + v * 0.22;
    });
  }
};

/* ------------------------------------------------ 高しょさぎょう車 */
MODEL3D.aerial = {
  label: '高しょさぎょう車',
  build: function (B) {
    const COL = 0xf5f7fa, ACC = 0xf0b21c, W = 2.30;

    chassis(B, { x: -0.4, y: 0.84, len: 7.4, spread: 0.42 });
    truckCab(B, { x: 2.55, len: 2.05, w: W, top: 2.96, floor: 0.92, color: COL });
    lightBar(B, { x: 2.55, y: 3.08, w: 1.50, n: 4, colors: [PAL.lampY, 0xfff0d0], part: 'lamp' });

    /* どうぐを のせる からだ */
    B.box({ x: -1.10, y: 1.42, z: 0, w: 4.00, h: 0.98, d: W, r: 0.10, color: 0xdfe6ee, part: 'body', rough: 0.3 });
    [1, -1].forEach(sz => {
      B.box({ x: -1.10, y: 1.32, z: sz * (W / 2 + 0.012), w: 3.70, h: 0.66, d: 0.03, r: 0.04, mat: metalMat(0xc7ced7, 0.4), part: 'body' });
      for (let k = 0; k < 3; k++) {
        B.seam({ x: -1.10, y: 1.14 + k * 0.19, z: sz * (W / 2 + 0.030), w: 3.62, h: 0.022, d: 0.012, color: 0x9aa3ae });
      }
      B.box({ x: -1.10, y: 1.86, z: sz * (W / 2 + 0.012), w: 3.80, h: 0.14, d: 0.02, r: 0.01, mat: paint(ACC, { rough: 0.3 }) });
      B.box({ x: -1.10, y: 1.06, z: sz * (W / 2 + 0.040), w: 0.45, h: 0.042, d: 0.028, r: 0.014, mat: metalMat(PAL.chrome, 0.25), part: 'body' });
      /* よこの マーカー */
      [-2.6, 0.4].forEach(mx => {
        B.lamp({ x: mx, y: 0.94, z: sz * (W / 2 + 0.012), w: 0.08, h: 0.055, d: 0.03, color: 0xffa63d, strength: 0.7, aux: true });
      });
    });
    B.box({ x: -1.10, y: 1.96, z: 0, w: 4.10, h: 0.14, d: W + 0.05, r: 0.05, mat: matte(0x3c434e, 0.6), part: 'body' });
    /* うしろの ランプ・ナンバー・どろよけ */
    tailLamps(B, { x: -3.14, y: 0.78, zOff: W / 2 - 0.40 });
    plate(B, { x: -3.14, y: 0.78, z: 0, axis: 'x-' });
    [1, -1].forEach(sz => {
      B.box({ x: -2.98, y: 0.36, z: sz * 0.95, w: 0.045, h: 0.52, d: 0.52, r: 0.02, mat: matte(0x1d2127, 0.85) });
    });

    /* ぐるっと まわる 台 と のびる うで */
    B.cyl({ x: -2.35, y: 2.14, z: 0, r: 0.75, h: 0.26, seg: 26, mat: metalMat(0x9aa3ae, 0.38), part: 'boom' });
    const ANG = 52 * Math.PI / 180;
    const pivot = new THREE.Group();
    pivot.position.set(-2.35, 2.42, 0);
    pivot.rotation.z = ANG;
    B.root.add(pivot);
    B.cyl({ parent: pivot, x: -0.10, y: 0, z: 0, r: 0.34, h: 0.80, axis: 'z', seg: 20, mat: paint(ACC, { rough: 0.34 }), part: 'boom' });

    const bconf = [{ len: 3.9, h: 0.62, d: 0.58 }, { len: 3.4, h: 0.48, d: 0.46 }, { len: 3.0, h: 0.36, d: 0.36 }];
    const secs = [];
    let par = pivot;
    const cols = [ACC, 0xf6c44a, 0xfad978];
    bconf.forEach((c, i) => {
      const g = new THREE.Group();
      par.add(g);
      secs.push(g);
      B.box({ parent: g, x: c.len / 2, y: 0, z: 0, w: c.len, h: c.h, d: c.d, r: 0.10, color: cols[i], part: 'boom', rough: 0.32 });
      par = g;
    });

    /* さきの かご（人が のって さぎょうする ところ・いつも まっすぐ）*/
    const tip = new THREE.Group();
    tip.position.set(bconf[2].len, 0, 0);
    secs[2].add(tip);
    const basket = new THREE.Group();
    basket.rotation.z = -ANG;
    tip.add(basket);
    B.box({ parent: basket, x: 0.34, y: -0.28, z: 0, w: 0.90, h: 0.08, d: 0.80, r: 0.03, mat: metalMat(0xc3cad3, 0.32), part: 'basket' });
    [[0.34, 0.40], [0.34, -0.40], [-0.10, 0], [0.78, 0]].forEach(([px, pz]) => {
      B.box({
        parent: basket, x: px, y: 0.14, z: pz,
        w: pz ? 0.88 : 0.07, h: 0.78, d: pz ? 0.07 : 0.82, r: 0.02,
        mat: metalMat(0xd6dce4, 0.34), part: 'basket'
      });
    });
    B.box({ parent: basket, x: 0.34, y: 0.55, z: 0, w: 0.94, h: 0.06, d: 0.86, r: 0.02, mat: paint(ACC, { rough: 0.35 }), part: 'basket' });
    /* かごの そうさばん */
    B.box({ parent: basket, x: 0.72, y: 0.42, z: 0, w: 0.10, h: 0.22, d: 0.34, r: 0.03, mat: matte(0x3a414b, 0.5), part: 'basket' });

    /* うでを おこす シリンダー */
    const ram = new THREE.Group();
    ram.position.set(-2.35, 2.06, 0);
    ram.rotation.z = 38 * Math.PI / 180;
    B.root.add(ram);
    [1, -1].forEach(sz => {
      B.cyl({ parent: ram, x: 0.62, y: 0, z: sz * 0.40, r: 0.13, h: 1.15, axis: 'x', seg: 14, mat: matte(0x59616e, 0.5), part: 'boom' });
      B.cyl({ parent: ram, x: 1.45, y: 0, z: sz * 0.40, r: 0.075, h: 0.85, axis: 'x', seg: 12, mat: metalMat(0xdfe4ea, 0.13), part: 'boom' });
    });

    /* ふんばる あし */
    B.anim('ashi', 'あしを しまう／ひろげる',
      outriggers(B, { xs: [1.35, -3.35], w: W, color: ACC, reach: 1.25, y: 1.00, part: 'ashi' }),
      { start: 1 });

    B.anim('basket', 'かごを 高く 上げる', v => {
      secs[1].position.x = v * (bconf[0].len - 0.75);
      secs[2].position.x = v * (bconf[1].len - 0.75);
      ram.scale.x = 1 + v * 0.25;
    });

    /* タイヤ */
    B.wheel({ x: 2.35, r: 0.50, w: 0.30, spread: 0.94 });
    B.wheel({ x: -2.45, r: 0.50, w: 0.28, z: 0.82 });
    B.wheel({ x: -2.45, r: 0.50, w: 0.28, z: 1.08 });
    B.wheel({ x: -2.45, r: 0.50, w: 0.28, z: -0.82 });
    B.wheel({ x: -2.45, r: 0.50, w: 0.28, z: -1.08 });
    [2.35, -2.45].forEach(ax => {
      B.cyl({ x: ax, y: 0.50, z: 0, r: 0.10, h: 1.85, axis: 'z', seg: 14, mat: matte(PAL.frame, 0.6) });
    });
  }
};


/* ------------------------------------------------ コンクリートポンプ車 */
MODEL3D.pumpcar = {
  label: 'コンクリートポンプ車',
  build: function (B) {
    const COL = 0xe0e5ec, ACC = 0x2f6fbf, W = 2.48;

    chassis(B, { x: -0.5, y: 0.90, len: 9.6, spread: 0.44 });
    truckCab(B, { x: 3.65, len: 2.20, w: W, top: 3.10, floor: 0.96, color: ACC });

    /* コンクリートを うける ところと ポンプ */
    B.box({ x: -3.75, y: 1.52, z: 0, w: 1.55, h: 0.90, d: W - 0.10, r: 0.08, mat: metalMat(0xaeb7c2, 0.4), part: 'boom' });
    B.mesh(sideProfileGeom([[-0.72, 0], [0.72, 0], [0.72, 0.62], [-0.72, 0.62], [-0.55, 0.18], [0.55, 0.18]], W - 0.30, 0.06),
      metalMat(0x8f98a3, 0.45), { x: -3.75, y: 1.96, z: 0, part: 'boom' });
    B.box({ x: -2.20, y: 1.42, z: 0, w: 1.60, h: 0.72, d: 1.60, r: 0.08, color: ACC, part: 'boom', rough: 0.3 });

    /* うでを のせる デッキ（すべりどめの ゆか）*/
    B.box({ x: -0.60, y: 1.18, z: 0, w: 7.30, h: 0.16, d: W, r: 0.05, mat: matte(0x59616e, 0.7), part: 'boom' });
    [1, -1].forEach(sz => {
      B.box({ x: -0.60, y: 1.36, z: sz * (W / 2 - 0.04), w: 7.30, h: 0.24, d: 0.08, r: 0.03, color: ACC, part: 'boom', rough: 0.3 });
      for (let i = -2; i <= 2; i++) {
        B.box({ x: 0.90 + i * 1.35, y: 1.62, z: sz * (W / 2 - 0.02), w: 0.10, h: 0.60, d: 0.06, r: 0.02, mat: metalMat(0x9aa3ae, 0.4), part: 'boom' });
      }
    });

    /* ==== くの字に おれまがる ながい うで ==== */
    const base = new THREE.Group();
    base.position.set(1.25, 2.42, 0);
    B.root.add(base);
    B.cyl({ x: 1.25, y: 2.20, z: 0, r: 0.62, h: 0.42, seg: 26, mat: metalMat(0x9aa3ae, 0.38), part: 'boom' });

    const conf = [
      { len: 4.6, h: 0.62, d: 0.56, col: ACC },
      { len: 4.2, h: 0.50, d: 0.46, col: 0x4a8ad4 },
      { len: 3.8, h: 0.40, d: 0.38, col: 0x76aae4 }
    ];
    const secs = [];
    let par = base;
    conf.forEach(c => {
      const g = new THREE.Group();
      par.add(g);
      secs.push(g);
      B.box({ parent: g, x: c.len / 2, y: 0, z: 0, w: c.len, h: c.h, d: c.d, r: 0.10, color: c.col, part: 'boom', rough: 0.3 });
      /* うでの 中の くだ（ここを コンクリートが のぼる）*/
      B.cyl({ parent: g, x: c.len / 2, y: c.h / 2 + 0.10, z: 0, r: 0.11, h: c.len - 0.10, axis: 'x', seg: 12, mat: metalMat(0x8f98a3, 0.4), part: 'boom' });
      B.cyl({ parent: g, x: 0, y: 0, z: 0, r: c.h * 0.55, h: c.d + 0.14, axis: 'z', seg: 18, mat: metalMat(0x9aa3ae, 0.4), part: 'boom' });
      par = g;
    });
    /* さきの ホース */
    const tip = new THREE.Group();
    tip.position.set(conf[2].len, 0, 0);
    secs[2].add(tip);
    const hose = new THREE.Group();
    tip.add(hose);
    B.cyl({ parent: hose, x: 0, y: -0.75, z: 0, r: 0.10, h: 1.50, axis: 'y', seg: 12, mat: matte(0x2b3038, 0.7), part: 'boom' });

    /* しまった かたち → のばした かたち */
    const pose = (v) => {
      base.rotation.z = THREE.MathUtils.lerp(0.04, 1.05, v);
      secs[1].position.x = conf[0].len;
      secs[2].position.x = conf[1].len;
      secs[1].rotation.z = THREE.MathUtils.lerp(-2.95, -1.35, v);   /* くの字 */
      secs[2].rotation.z = THREE.MathUtils.lerp(2.90, 0.95, v);
      hose.rotation.z = -(base.rotation.z + secs[1].rotation.z + secs[2].rotation.z);
    };
    secs[1].position.x = conf[0].len;
    secs[2].position.x = conf[1].len;
    B.anim('boom', 'うでを のばす', pose);

    /* ==== 四すみから 出す あし ==== */
    B.anim('ashi', 'あしを しまう／ひろげる',
      outriggers(B, { xs: [2.20, -3.10], w: W, color: ACC, reach: 1.60, y: 1.08, part: 'ashi' }),
      { start: 1 });

    /* タイヤ */
    B.wheel({ x: 3.45, r: 0.55, w: 0.32, spread: 1.02 });
    [-1.10, -2.45].forEach(ax => {
      [0.90, 1.18, -0.90, -1.18].forEach(z => B.wheel({ x: ax, r: 0.55, w: 0.28, z: z }));
      B.cyl({ x: ax, y: 0.55, z: 0, r: 0.10, h: 2.0, axis: 'z', seg: 14, mat: matte(PAL.frame, 0.6) });
    });
    B.cyl({ x: 3.45, y: 0.55, z: 0, r: 0.10, h: 2.0, axis: 'z', seg: 14, mat: matte(PAL.frame, 0.6) });
    lightBar(B, { x: 3.65, y: 3.22, w: 1.40, n: 4, colors: [PAL.lampY, 0xfff0d0], part: 'lamp' });
    /* うしろの ランプ・ナンバー・どろよけ・さぎょうとう */
    tailLamps(B, { x: -5.28, y: 0.80, zOff: W / 2 - 0.42 });
    plate(B, { x: -5.28, y: 0.80, z: 0, axis: 'x-' });
    [1, -1].forEach(sz => {
      B.box({ x: -3.15, y: 0.36, z: sz * 1.02, w: 0.045, h: 0.55, d: 0.55, r: 0.02, mat: matte(0x1d2127, 0.85) });
    });
    B.lamp({ x: -3.05, y: 2.10, z: 0.85, w: 0.12, h: 0.10, d: 0.12, color: 0xfff2cf, strength: 1.2, aux: true });
    /* デッキの 水あらい用タンク */
    B.cyl({ x: 0.30, y: 1.62, z: -(W / 2 - 0.35), r: 0.26, h: 1.10, axis: 'x', seg: 18, mat: metalMat(0xc9d1da, 0.25), part: 'boom' });
  }
};

/* ------------------------------------------------- くすりを まく 車 */
MODEL3D.sprayer = {
  label: 'くすりを まく 車',
  build: function (B) {
    const COL = 0x2f8f52, W = 2.10;

    /* さくもつを またげる ように 車高が 高い */
    B.box({ x: 0.20, y: 1.75, z: 0, w: 3.40, h: 0.52, d: 1.05, r: 0.06, mat: matte(0x4d545e, 0.6), part: 'body' });
    [1, -1].forEach(sz => {
      B.box({ x: 1.35, y: 1.62, z: sz * 0.86, w: 0.22, h: 0.24, d: 1.75, r: 0.05, mat: matte(0x59616e, 0.6), part: 'body' });
      B.box({ x: -1.55, y: 1.62, z: sz * 0.86, w: 0.22, h: 0.24, d: 1.75, r: 0.05, mat: matte(0x59616e, 0.6), part: 'body' });
    });

    /* まん中の 大きな タンク */
    const prof = [
      [0.03, -1.35], [0.60, -1.32], [0.85, -1.15], [0.96, -0.80],
      [1.00, 0], [0.96, 0.80], [0.85, 1.15], [0.60, 1.32], [0.03, 1.35]
    ].map(p => new THREE.Vector2(p[0], p[1]));
    const g = new THREE.LatheGeometry(prof, 40);
    g.computeVertexNormals();
    B.mesh(g, paint(0xf2f5f9, { metal: 0.3, rough: 0.26 }), { x: -0.15, y: 2.68, z: 0, rz: Math.PI / 2, part: 'tank' });
    B.mesh(new THREE.TorusGeometry(0.98, 0.05, 10, 32), metalMat(0x9aa3ae, 0.35),
      { x: -0.15, y: 2.68, z: 0, ry: Math.PI / 2, part: 'tank' });
    B.cyl({ x: -0.15, y: 3.70, z: 0, r: 0.22, h: 0.16, seg: 18, mat: metalMat(0xb9c0ca, 0.3), part: 'tank' });
    B.box({ x: -1.85, y: 2.30, z: 0, w: 0.75, h: 0.72, d: 1.15, r: 0.10, color: COL, part: 'tank', rough: 0.32 });

    /* うんてんせき（前・ガラスばり）*/
    const cbot = 2.10, ctop = 3.62;
    B.box({ x: 1.65, y: (ctop + cbot) / 2, z: 0, w: 1.45, h: ctop - cbot, d: 1.62, r: 0.16, b: 0.045, color: COL, part: 'cab', rough: 0.28 });
    B.glass({ x: 1.65 + 0.70, y: (ctop + cbot) / 2 + 0.10, z: 0, w: 0.08, h: (ctop - cbot) * 0.70, d: 1.35, r: 0.07, rz: -0.12, part: 'window' });
    [1, -1].forEach(sz => {
      B.glass({ x: 1.60, y: (ctop + cbot) / 2 + 0.10, z: sz * 0.79, w: 1.10, h: (ctop - cbot) * 0.62, d: 0.07, r: 0.06, part: 'window' });
    });
    B.box({ x: 1.65, y: ctop + 0.09, z: 0, w: 1.55, h: 0.12, d: 1.70, r: 0.06, color: 0xe8ecf1, part: 'cab', rough: 0.4 });
    [1, -1].forEach(sz => {
      B.lamp({ x: 2.30, y: ctop + 0.14, z: sz * 0.62, w: 0.14, h: 0.10, d: 0.22, color: 0xfff2cf, strength: 1.2, part: 'lamp' });
    });
    /* とびら・ハンドル・ミラー・ワイパー・かいてんとう */
    B.seam({ x: 1.15, y: (ctop + cbot) / 2 - 0.10, z: 0.82, w: 0.024, h: (ctop - cbot) * 0.70, d: 0.03, part: 'cab' });
    doorHandle(B, { x: 1.38, y: (ctop + cbot) / 2 - 0.30, z: 0.825, s: 1, len: 0.20 });
    [1, -1].forEach(sz => {
      B.cyl({ x: 2.32, y: ctop - 0.30, z: sz * 0.90, r: 0.016, h: 0.26, axis: 'z', seg: 8, mat: metalMat(0x9aa3ae, 0.35), aux: true });
      B.box({ x: 2.32, y: ctop - 0.40, z: sz * 1.06, w: 0.07, h: 0.26, d: 0.11, r: 0.03, mat: matte(0x2a2f38, 0.5), aux: true });
    });
    wipers(B, { x: 2.37, y: (ctop + cbot) / 2 - 0.26, z: 0, rz: -0.12, len: 0.45, n: 1, a: 0.8 });
    B.lamp({ x: 1.05, y: ctop + 0.20, z: 0, w: 0.13, h: 0.13, d: 0.13, color: 0xffa63d, strength: 1.2, aux: true });
    /* のぼる はしご と まえの ライト */
    [0.55, 1.05, 1.55].forEach((sy, i) => {
      B.box({ x: 2.20 - i * 0.06, y: sy, z: 0.72, w: 0.30, h: 0.045, d: 0.24, r: 0.02, mat: matte(0x30363f, 0.62) });
    });
    [1, -1].forEach(sz => {
      B.cyl({ x: 2.08, y: 1.05, z: sz * 0.86, r: 0.020, h: 1.05, axis: 'y', seg: 8, mat: matte(0x30363f, 0.5), aux: true });
    });
    B.lamp({ x: 1.95, y: 1.70, z: 0.45, w: 0.10, h: 0.10, d: 0.12, color: 0xfff2cf, strength: 1.2, part: 'lamp' });
    B.lamp({ x: 1.95, y: 1.70, z: -0.45, w: 0.10, h: 0.10, d: 0.12, color: 0xfff2cf, strength: 1.2, part: 'lamp' });
    /* 大きな タイヤの うえの ちいさな フェンダー */
    [1.35, -1.55].forEach(fx => {
      wheelArch(B, { x: fx, r: 0.92, spread: 0.94, w: 0.42, mat: paint(COL, { rough: 0.34 }) });
    });

    /* ==== うしろの うで（左右へ 大きく ひろがる）==== */
    const NOZ = (parent, len, x0) => {
      const n = Math.max(3, Math.round(Math.abs(len) / 0.55));
      for (let i = 0; i <= n; i++) {
        const zz = x0 + (len) * (i / n);
        B.box({ parent: parent, x: 0, y: -0.14, z: zz, w: 0.09, h: 0.16, d: 0.09, r: 0.02, mat: matte(0xf0d24a, 0.6), part: 'boom' });
      }
    };
    /* まん中の ぶぶん */
    const center = new THREE.Group();
    center.position.set(-2.15, 2.30, 0);
    B.root.add(center);
    B.box({ parent: center, x: 0, y: 0, z: 0, w: 0.18, h: 0.20, d: 2.20, r: 0.04, mat: metalMat(0xc3cad3, 0.32), part: 'boom' });
    NOZ(center, 2.0, -1.0);
    /* 左右の はね（つけねで 回って ひらく）*/
    const wings = [];
    [1, -1].forEach(sz => {
      const hinge = new THREE.Group();
      hinge.position.set(0, 0, sz * 1.10);
      center.add(hinge);
      wings.push({ g: hinge, sz: sz });
      const inner = new THREE.Group();
      hinge.add(inner);
      B.box({ parent: inner, x: 0, y: 0, z: sz * 1.30, w: 0.15, h: 0.17, d: 2.60, r: 0.04, mat: metalMat(0xc3cad3, 0.32), part: 'boom' });
      NOZ(inner, sz * 2.4, sz * 0.15);
      const outer = new THREE.Group();
      outer.position.set(0, 0, sz * 2.60);
      inner.add(outer);
      B.box({ parent: outer, x: 0, y: 0, z: sz * 1.15, w: 0.12, h: 0.14, d: 2.30, r: 0.03, mat: metalMat(0xd6dce4, 0.3), part: 'boom' });
      NOZ(outer, sz * 2.1, sz * 0.15);
      wings[wings.length - 1].outer = outer;
    });
    B.anim('boom', 'うでを 左右へ ひろげる', v => {
      wings.forEach(w => {
        w.g.rotation.y = -w.sz * (1 - v) * 1.62;      /* たたむと 前後に そう */
        w.outer.rotation.y = -w.sz * (1 - v) * 1.62;
      });
      center.position.y = 2.30 - v * 0.30;
    });

    /* 土に しずみにくい 細くて 大きな タイヤ */
    B.wheel({ x: 1.35, r: 0.92, w: 0.34, spread: 0.94 });
    B.wheel({ x: -1.55, r: 0.92, w: 0.34, spread: 0.94 });
  }
};

/* ---------------------------------------------------------- じょせつ車 */
MODEL3D.snowplow = {
  label: 'じょせつ車',
  build: function (B) {
    const COL = 0xf0a828, W = 2.44;

    chassis(B, { x: -0.4, y: 0.90, len: 7.6, spread: 0.44 });
    truckCab(B, { x: 2.45, len: 2.10, w: W, top: 3.06, floor: 0.98, color: COL });
    lightBar(B, { x: 2.45, y: 3.18, w: 1.60, n: 4, colors: [PAL.lampY, 0xfff0d0], part: 'lamp' });

    /* うしろの すなや つぶを まく ところ */
    const hx = -1.90, hlen = 3.10;
    B.mesh(sideProfileGeom([
      [-hlen / 2, 0], [hlen / 2, 0], [hlen / 2, 1.35], [-hlen / 2, 1.35]
    ], W, 0.10), paint(0xdfe6ee, { metal: 0.3, rough: 0.3 }), { x: hx, y: 1.20, z: 0, part: 'hopper' });
    /* 上が ひろく 下が せまい（すなが 出て いく かたち）*/
    [1, -1].forEach(sz => {
      B.mesh(sideProfileGeom([[-hlen / 2, 0], [hlen / 2, 0], [hlen / 2, 0.62], [-hlen / 2, 0.62]], 0.06, 0.04),
        metalMat(0x9aa3ae, 0.4), { x: hx, y: 0.94, z: sz * (W / 2 - 0.28), rz: sz * 0, part: 'hopper' });
    });
    B.box({ x: hx, y: 2.60, z: 0, w: hlen - 0.10, h: 0.10, d: W - 0.12, r: 0.04, mat: matte(0x3c434e, 0.6), part: 'hopper' });
    for (let i = -2; i <= 2; i++) {
      B.box({ x: hx + i * 0.62, y: 2.66, z: 0, w: 0.08, h: 0.08, d: W - 0.16, r: 0.02, mat: metalMat(0x8f98a3, 0.4), part: 'hopper' });
    }
    /* まく 円ばん（ぐるぐる まわって すなを ちらす）*/
    const disc = new THREE.Group();
    disc.position.set(hx - hlen / 2 - 0.28, 0.72, 0);
    B.root.add(disc);
    B.cyl({ parent: disc, x: 0, y: 0, z: 0, r: 0.46, h: 0.09, seg: 26, mat: metalMat(0xb9c0ca, 0.3), part: 'hopper' });
    for (let i = 0; i < 4; i++) {
      const a = i / 4 * Math.PI * 2;
      B.box({ parent: disc, x: Math.cos(a) * 0.24, y: 0.10, z: Math.sin(a) * 0.24, w: 0.30, h: 0.10, d: 0.06, r: 0.02, ry: -a, mat: metalMat(0x9099a5, 0.35), part: 'hopper' });
    }
    B.box({ x: hx - hlen / 2 - 0.28, y: 1.05, z: 0, w: 0.42, h: 0.55, d: 0.55, r: 0.06, mat: matte(0x59616e, 0.55), part: 'hopper' });
    B.spin.push({ obj: disc, axis: 'y', speed: 0 });
    /* ホッパーへ のぼる はしご と うしろの ランプ */
    for (let i = 0; i < 4; i++) {
      B.box({ x: hx + hlen / 2 - 0.10, y: 0.75 + i * 0.48, z: 0.95, w: 0.045, h: 0.045, d: 0.34, r: 0.02, mat: metalMat(0x9aa3ae, 0.35), part: 'hopper' });
    }
    [0.78, 1.12].forEach(lz => {
      B.box({ x: hx + hlen / 2 - 0.10, y: 1.70, z: lz, w: 0.05, h: 2.0, d: 0.05, r: 0.02, mat: metalMat(0x9aa3ae, 0.35), part: 'hopper' });
    });
    tailLamps(B, { x: hx - hlen / 2 - 0.02, y: 1.05, zOff: W / 2 - 0.42 });
    plate(B, { x: hx - hlen / 2 - 0.02, y: 1.42, z: 0, axis: 'x-' });
    B.lamp({ x: hx, y: 2.76, z: 0, w: 0.14, h: 0.13, d: 0.14, color: 0xffa63d, strength: 1.3, aux: true });

    /* ==== 前の はね（ななめに ついて いて、雪が わきへ よけられる）==== */
    const plow = new THREE.Group();
    plow.position.set(4.55, 0.92, 0);
    plow.rotation.y = -0.42;                 /* ← これが「ななめ」*/
    B.root.add(plow);
    B.mesh(curvedPlateGeom(0.92, 0.10, Math.PI - 0.66, Math.PI + 0.52, 3.30, 18),
      paint(0xe5544b, { rough: 0.3 }), { parent: plow, part: 'plow' });
    B.box({ parent: plow, x: -0.82, y: -0.62, z: 0, w: 0.34, h: 0.14, d: 3.32, r: 0.03, rz: 0.40, mat: metalMat(0xb9c0ca, 0.3), part: 'plow' });
    [1, -1].forEach(sz => {
      B.box({ parent: plow, x: -0.95, y: 0.02, z: sz * 1.66, w: 0.70, h: 1.30, d: 0.07, r: 0.05, mat: paint(0xe5544b, { rough: 0.3 }), part: 'plow' });
      /* よく 目だつ ななめの しま */
      B.box({ parent: plow, x: -0.95, y: 0.32, z: sz * 1.705, w: 0.55, h: 0.14, d: 0.02, r: 0.01, rz: 0.6, mat: paint(0xf5c433, { rough: 0.35 }), part: 'plow' });
      B.box({ parent: plow, x: -0.95, y: -0.10, z: sz * 1.705, w: 0.55, h: 0.14, d: 0.02, r: 0.01, rz: 0.6, mat: paint(0xf5c433, { rough: 0.35 }), part: 'plow' });
      /* 雪の 高さを しめす ポール */
      B.cyl({ parent: plow, x: -0.95, y: 0.85, z: sz * 1.66, r: 0.022, h: 0.90, seg: 8, mat: matte(0xf5c433, 0.6), part: 'plow' });
    });
    /* はねへ つながる ホース（あぶらの くだ） */
    [0.10, -0.10].forEach(dz => {
      B.cyl({ x: 3.90, y: 1.30, z: dz, r: 0.030, h: 0.85, axis: 'x', tilt: -0.35, seg: 8, mat: matte(0x22262d, 0.5), part: 'plow' });
    });
    /* はねを ささえる わく */
    B.box({ x: 4.02, y: 0.94, z: 0, w: 1.10, h: 0.26, d: 0.60, r: 0.05, mat: matte(0x59616e, 0.55), part: 'plow' });
    const lift = new THREE.Group();
    lift.position.set(3.66, 1.62, 0);
    B.root.add(lift);
    B.cyl({ parent: lift, x: 0.40, y: -0.30, z: 0, r: 0.10, h: 0.95, axis: 'x', seg: 14, rz: -0.62, mat: matte(0x59616e, 0.5), part: 'plow' });

    B.anim('plow', 'はねを 上げる', v => {
      plow.position.y = 0.92 + v * 0.55;
      plow.rotation.z = v * 0.12;
      lift.rotation.z = v * 0.30;
    });
    B.anim('hopper', 'すなを まく', v => { B.spin[B.spin.length - 1].speed = v * 9.0; });

    /* タイヤ */
    B.wheel({ x: 2.30, r: 0.56, w: 0.34, spread: 1.02 });
    B.wheel({ x: -2.05, r: 0.56, w: 0.30, z: 0.90 });
    B.wheel({ x: -2.05, r: 0.56, w: 0.30, z: 1.19 });
    B.wheel({ x: -2.05, r: 0.56, w: 0.30, z: -0.90 });
    B.wheel({ x: -2.05, r: 0.56, w: 0.30, z: -1.19 });
    [2.30, -2.05].forEach(ax => {
      B.cyl({ x: ax, y: 0.56, z: 0, r: 0.10, h: 2.05, axis: 'z', seg: 14, mat: matte(PAL.frame, 0.6) });
    });
  }
};


/* ---------------- はこばれる がわの ちいさな じどう車（キャリアカー用）---- */
function miniCar(B, o) {
  const g = new THREE.Group();
  g.position.set(o.x, o.y, o.z || 0);
  if (o.rz) g.rotation.z = o.rz;
  (o.parent || B.root).add(g);
  const W = 1.66;
  B.mesh(sideProfileGeom([
    [-2.10, 0.30], [-2.04, 0.68], [-1.80, 0.86], [-1.15, 0.94],
    [-0.70, 1.34], [0.35, 1.38], [0.90, 0.98], [1.75, 0.86],
    [2.10, 0.72], [2.10, 0.36], [1.90, 0.24], [-1.90, 0.24]
  ], W, 0.16), paint(o.color, { metal: 0.25, rough: 0.22, clear: 1.0 }), { parent: g, part: o.part });
  B.mesh(sideProfileGeom([[-0.92, 0.98], [-0.68, 1.30], [0.30, 1.33], [0.84, 0.98]], W + 0.015, 0.07),
    darkGlassMat(), { parent: g, part: o.part });
  [1.30, -1.35].forEach(ax => {
    [1, -1].forEach(sz => {
      B.cyl({ parent: g, x: ax, y: 0.30, z: sz * (W / 2 - 0.10), r: 0.30, h: 0.20, axis: 'z', seg: 18, mat: matte(0x1a1c20, 0.75), part: o.part });
      B.cyl({ parent: g, x: ax, y: 0.30, z: sz * (W / 2 - 0.02), r: 0.16, h: 0.06, axis: 'z', seg: 16, mat: metalMat(0xb9c0ca, 0.3), part: o.part });
    });
  });
  return g;
}

/* ------------------------------------------------------------ コンバイン */
MODEL3D.combine = {
  label: 'コンバイン',
  build: function (B) {
    const COL = 0xe5544b, W = 2.30;

    crawlerTrack(B, { x: -0.55, len: 3.20, r: 0.36, w: 0.52, spread: 0.86, tooth: 0.045 });
    B.box({ x: -0.55, y: 0.60, z: 0, w: 2.60, h: 0.34, d: 1.60, r: 0.06, mat: matte(0x4d545e, 0.6), part: 'crawler' });

    /* からだ */
    B.box({ x: -0.75, y: 1.30, z: 0, w: 3.30, h: 1.05, d: W - 0.20, r: 0.12, color: COL, part: 'body', rough: 0.3 });
    B.box({ x: -2.10, y: 1.85, z: 0, w: 0.90, h: 0.72, d: 1.60, r: 0.10, color: COL, part: 'body', rough: 0.32 });
    B.cyl({ x: -1.90, y: 2.48, z: 0.52, r: 0.075, h: 0.55, seg: 12, mat: metalMat(0x8d959f, 0.42) });

    /* おこめの つぶを ためる はこ（上）*/
    B.mesh(sideProfileGeom([
      [-1.15, 0], [1.15, 0], [1.15, 1.02], [-1.15, 1.02], [-0.85, 0.20], [0.85, 0.20]
    ], 1.55, 0.10), paint(0xf2f5f9, { metal: 0.3, rough: 0.3 }), { x: -0.55, y: 1.82, z: 0.28, part: 'tank' });
    B.box({ x: -0.55, y: 2.90, z: 0.28, w: 2.35, h: 0.10, d: 1.60, r: 0.05, mat: metalMat(0xb9c0ca, 0.35), part: 'tank' });
    /* たまった おこめを 出す くだ */
    const auger = new THREE.Group();
    auger.position.set(0.55, 2.35, 0.28);
    B.root.add(auger);
    B.cyl({ parent: auger, x: 0.95, y: 0, z: 0, r: 0.17, h: 2.10, axis: 'x', seg: 18, mat: metalMat(0xc3cad3, 0.32), part: 'tank' });
    B.cyl({ parent: auger, x: 2.05, y: -0.14, z: 0, r: 0.15, h: 0.34, seg: 14, mat: metalMat(0x9099a5, 0.4), part: 'tank' });
    auger.rotation.y = 0;

    /* うんてんせき */
    const cbot = 1.82, ctop = 3.02;
    B.box({ x: 0.15, y: (ctop + cbot) / 2, z: -0.72, w: 1.15, h: ctop - cbot, d: 0.98, r: 0.12, color: COL, part: 'cab', rough: 0.28 });
    B.glass({ x: 0.70, y: (ctop + cbot) / 2 + 0.06, z: -0.72, w: 0.08, h: (ctop - cbot) * 0.66, d: 0.80, r: 0.06, rz: -0.10, part: 'window' });
    B.glass({ x: 0.10, y: (ctop + cbot) / 2 + 0.06, z: -0.72 - 0.46, w: 0.85, h: (ctop - cbot) * 0.60, d: 0.06, r: 0.05, part: 'window' });
    B.box({ x: 0.15, y: ctop + 0.07, z: -0.72, w: 1.22, h: 0.10, d: 1.05, r: 0.05, color: 0xe8ecf1, part: 'cab', rough: 0.4 });
    /* とびら・ハンドル・ミラー・ワイパー・のぼる ステップ */
    B.seam({ x: -0.30, y: (ctop + cbot) / 2 - 0.08, z: -1.215, w: 0.024, h: (ctop - cbot) * 0.66, d: 0.03, part: 'cab' });
    doorHandle(B, { x: -0.10, y: (ctop + cbot) / 2 - 0.26, z: -1.22, s: -1, len: 0.20 });
    B.cyl({ x: 0.72, y: ctop - 0.26, z: -1.10, r: 0.016, h: 0.26, axis: 'z', seg: 8, mat: metalMat(0x9aa3ae, 0.35), aux: true });
    B.box({ x: 0.72, y: ctop - 0.36, z: -1.28, w: 0.07, h: 0.24, d: 0.10, r: 0.03, mat: matte(0x2a2f38, 0.5), aux: true });
    wipers(B, { x: 0.74, y: (ctop + cbot) / 2 - 0.22, z: -0.72, rz: -0.10, len: 0.38, n: 1, a: 0.8 });
    B.box({ x: 0.15, y: 1.15, z: -1.30, w: 0.34, h: 0.045, d: 0.26, r: 0.02, mat: matte(0x30363f, 0.62) });
    B.box({ x: 0.15, y: 1.52, z: -1.24, w: 0.34, h: 0.045, d: 0.26, r: 0.02, mat: matte(0x30363f, 0.62) });
    B.lamp({ x: -0.35, y: ctop + 0.14, z: -0.72, w: 0.12, h: 0.12, d: 0.12, color: 0xffa63d, strength: 1.2, aux: true });
    /* まえの さぎょうとう */
    [0.35, -1.15].forEach(lz => {
      B.lamp({ x: 0.92, y: 1.95, z: lz, w: 0.09, h: 0.10, d: 0.12, color: 0xfff2cf, strength: 1.3, part: 'lamp' });
    });

    /* ==== 前の かりとる ところ ==== */
    const head = new THREE.Group();
    head.position.set(1.35, 0.72, 0);
    B.root.add(head);
    /* うける ゆか */
    B.box({ parent: head, x: 0.45, y: 0, z: 0, w: 1.20, h: 0.20, d: W, r: 0.05, mat: metalMat(0xc3cad3, 0.35), part: 'reel' });
    [1, -1].forEach(sz => {
      B.mesh(sideProfileGeom([[-0.15, 0], [1.05, 0], [1.05, 0.95], [-0.15, 0.80]], 0.07, 0.05),
        paint(COL, { rough: 0.3 }), { parent: head, x: 0.45, y: 0.08, z: sz * (W / 2 - 0.04), part: 'reel' });
    });
    /* かりとる は（下の ほう）*/
    B.box({ parent: head, x: 1.02, y: -0.02, z: 0, w: 0.16, h: 0.10, d: W - 0.10, r: 0.02, mat: metalMat(0xdfe4ea, 0.2), part: 'reel' });
    for (let i = -6; i <= 6; i++) {
      B.box({ parent: head, x: 1.14, y: -0.02, z: i * 0.17, w: 0.16, h: 0.06, d: 0.10, r: 0.02, mat: metalMat(0xc8cfd8, 0.25), part: 'reel' });
    }
    /* 水車の ような ぶぶん（まわって いねを かきこむ）*/
    const reel = new THREE.Group();
    reel.position.set(0.80, 0.92, 0);
    head.add(reel);
    B.cyl({ parent: reel, x: 0, y: 0, z: 0, r: 0.10, h: W - 0.12, axis: 'z', seg: 14, mat: metalMat(0x9aa3ae, 0.4), part: 'reel' });
    for (let k = 0; k < 6; k++) {
      const a = k / 6 * Math.PI * 2;
      B.box({
        parent: reel, x: Math.cos(a) * 0.52, y: Math.sin(a) * 0.52, z: 0,
        w: 0.10, h: 0.14, d: W - 0.18, r: 0.03, rz: a, mat: paint(0xf5c433, { rough: 0.35 }), part: 'reel'
      });
      for (let i = -4; i <= 4; i++) {
        B.cyl({
          parent: reel, x: Math.cos(a) * 0.60, y: Math.sin(a) * 0.60, z: i * 0.24,
          r: 0.018, h: 0.24, axis: 'y', seg: 6, tilt: a + Math.PI / 2, mat: matte(0x3c434e, 0.6), part: 'reel'
        });
      }
    }
    B.spin.push({ obj: reel, axis: 'z', speed: 0 });
    const spinIdx = B.spin.length - 1;
    B.anim('reel', 'かりとる ところを まわす', v => {
      B.spin[spinIdx].speed = -v * 3.2;
      head.position.y = 0.72 - v * 0.22;
    });
    B.anim('tank', 'おこめを 出す くだを 出す', v => { auger.rotation.y = -v * 1.45; });
  }
};

/* -------------------------------------------------------- キャリアカー */
MODEL3D.carrier = {
  label: 'キャリアカー',
  build: function (B) {
    const COL = 0x2f4a80, W = 2.48;

    chassis(B, { x: -1.0, y: 0.86, len: 11.6, spread: 0.44 });
    truckCab(B, { x: 4.55, len: 2.20, w: W, top: 3.05, floor: 0.94, color: COL });

    /* ==== 下の ゆか ==== */
    B.box({ x: -1.60, y: 1.12, z: 0, w: 8.60, h: 0.14, d: W, r: 0.04, mat: metalMat(0x9aa3ae, 0.4), part: 'deck' });
    [1, -1].forEach(sz => {
      B.box({ x: -1.60, y: 1.24, z: sz * (W / 2 - 0.02), w: 8.60, h: 0.16, d: 0.08, r: 0.03, color: COL, part: 'deck', rough: 0.3 });
    });
    /* ==== 上の ゆか（はしらで ささえる）==== */
    const upY = 3.05;
    B.box({ x: -0.60, y: upY, z: 0, w: 6.40, h: 0.14, d: W, r: 0.04, mat: metalMat(0x9aa3ae, 0.4), part: 'deck' });
    [[2.45, 1], [2.45, -1], [-3.65, 1], [-3.65, -1], [-0.60, 1], [-0.60, -1]].forEach(([px, sz]) => {
      B.box({ x: px, y: (upY + 1.20) / 2 + 0.10, z: sz * (W / 2 - 0.08), w: 0.14, h: upY - 1.20, d: 0.14, r: 0.04, color: COL, part: 'deck', rough: 0.3 });
    });

    /* ==== うしろの ゆかが かたむいて さかみちに なる ==== */
    const slope = new THREE.Group();
    slope.position.set(-5.85, 3.05, 0);        /* 上の ゆかの うしろはし */
    B.root.add(slope);
    B.box({ parent: slope, x: -1.45, y: 0, z: 0, w: 3.00, h: 0.13, d: W, r: 0.04, mat: metalMat(0xb0b8c2, 0.35), part: 'slope' });
    [1, -1].forEach(sz => {
      B.box({ parent: slope, x: -1.45, y: 0.14, z: sz * (W / 2 - 0.02), w: 3.00, h: 0.16, d: 0.08, r: 0.03, mat: paint(0xf5c433, { rough: 0.3 }), part: 'slope' });
    });
    for (let i = 0; i < 5; i++) {
      B.box({ parent: slope, x: -0.45 - i * 0.55, y: 0.09, z: 0, w: 0.10, h: 0.05, d: W - 0.16, r: 0.02, mat: metalMat(0x8f98a3, 0.4), part: 'slope' });
    }
    /* かたむける うで */
    const ram = new THREE.Group();
    ram.position.set(-5.20, 1.95, 0);
    B.root.add(ram);
    [1, -1].forEach(sz => {
      B.cyl({ parent: ram, x: 0, y: 0.50, z: sz * 0.95, r: 0.10, h: 1.15, axis: 'y', seg: 12, mat: matte(0x59616e, 0.5), part: 'slope' });
    });

    /* ==== はこばれる じどう車（タイヤどめ つき）==== */
    miniCar(B, { x: 3.05, y: 1.26, color: 0xd94f38, part: 'deck' });
    miniCar(B, { x: -1.40, y: 1.26, color: 0xf2f5f9, part: 'deck' });
    miniCar(B, { x: 1.75, y: 3.19, color: 0x2f9e63, part: 'deck' });
    miniCar(B, { x: -2.75, y: 3.19, color: 0x3a4250, part: 'deck' });
    [[3.05, 1.19], [-1.40, 1.19], [1.75, 3.12], [-2.75, 3.12]].forEach(([mx, my]) => {
      [1.30 + 0.42, -1.35 - 0.42].forEach(dx => {
        [1, -1].forEach(sz => {
          B.box({ x: mx + dx, y: my + 0.10, z: sz * 0.73, w: 0.18, h: 0.13, d: 0.22, r: 0.03, rz: dx > 0 ? -0.5 : 0.5, mat: paint(0xf5c433, { rough: 0.4 }), part: 'deck' });
        });
      });
    });
    /* うしろの ランプ・ナンバー・よこの マーカー */
    tailLamps(B, { x: -5.88, y: 0.80, zOff: W / 2 - 0.42 });
    plate(B, { x: -5.88, y: 0.80, z: 0, axis: 'x-' });
    [1, -1].forEach(sz => {
      [-4.5, -1.5, 1.5].forEach(mx => {
        B.lamp({ x: mx, y: 1.06, z: sz * (W / 2 + 0.012), w: 0.08, h: 0.055, d: 0.03, color: 0xffa63d, strength: 0.7, aux: true });
      });
    });

    B.anim('slope', 'うしろを かたむけて さかみちに する', v => {
      slope.rotation.z = -v * 0.62;
      ram.scale.y = 1 - v * 0.45;
    });

    /* タイヤ */
    B.wheel({ x: 4.35, r: 0.52, w: 0.30, spread: 1.02 });
    [-3.60, -4.90].forEach(ax => {
      [0.88, 1.16, -0.88, -1.16].forEach(z => B.wheel({ x: ax, r: 0.52, w: 0.28, z: z }));
      B.cyl({ x: ax, y: 0.52, z: 0, r: 0.10, h: 2.0, axis: 'z', seg: 14, mat: matte(PAL.frame, 0.6) });
    });
    B.cyl({ x: 4.35, y: 0.52, z: 0, r: 0.10, h: 2.0, axis: 'z', seg: 14, mat: matte(PAL.frame, 0.6) });
  }
};

/* -------------------------------------------------------- としょかん車 */
MODEL3D.library = {
  label: 'としょかん車',
  build: function (B) {
    const COL = 0x2b9c68, W = 2.16;
    const bx = -0.75, blen = 4.30, bbot = 0.92, btop = 3.00;

    chassis(B, { x: 0, y: 0.76, len: 6.4, spread: 0.40 });
    truckCab(B, { x: 2.55, len: 1.85, w: W, top: 2.88, floor: 0.88, color: COL });

    /* ==== 本を のせる からだ ==== */
    B.box({ x: bx, y: bbot, z: 0, w: blen, h: 0.16, d: W, r: 0.04, color: 0x39404c, part: 'shelf' });
    B.box({ x: bx, y: btop + 0.08, z: 0, w: blen, h: 0.16, d: W, r: 0.06, color: 0xeef2f7, part: 'shelf', rough: 0.3 });
    B.box({ x: bx - blen / 2 - 0.05, y: (btop + bbot) / 2, z: 0, w: 0.10, h: btop - bbot, d: W, r: 0.06, color: COL, part: 'shelf', rough: 0.3 });
    B.box({ x: bx + blen / 2 + 0.05, y: (btop + bbot) / 2, z: 0, w: 0.10, h: btop - bbot, d: W, r: 0.06, color: COL, part: 'shelf', rough: 0.3 });

    /* ==== そとから えらべる 本だな（左右）==== */
    const BOOK = [0xe5544b, 0xf5c433, 0x2f7fd0, 0xe8896f, 0x7a5cc4, 0x2f9e63, 0xef7127, 0x3aa8b8];
    [1, -1].forEach(sz => {
      /* たな板 3だん ＋ 本 */
      [0.42, 1.02, 1.62].forEach((dy, row) => {
        B.box({ x: bx, y: bbot + dy, z: sz * (W / 2 - 0.28), w: blen - 0.30, h: 0.06, d: 0.46, r: 0.02, mat: matte(0xd6c3a5, 0.75), part: 'shelf' });
        const n = 26;
        for (let i = 0; i < n; i++) {
          const h = 0.28 + ((i * 7 + row * 3) % 5) * 0.035;
          B.box({
            x: bx - (blen - 0.50) / 2 + i * ((blen - 0.50) / (n - 1)), y: bbot + dy + 0.03 + h / 2,
            z: sz * (W / 2 - 0.30), w: 0.11, h: h, d: 0.34, r: 0.012,
            mat: matte(BOOK[(i * 3 + row) % BOOK.length], 0.75), part: 'shelf'
          });
        }
      });
      /* うしろの かべ（たなの おく）*/
      B.box({ x: bx, y: (btop + bbot) / 2, z: sz * 0.10, w: blen - 0.12, h: btop - bbot - 0.10, d: 0.10, r: 0.03, color: 0xeef2f7, part: 'shelf', rough: 0.4 });
    });

    /* ==== よこの かべ（上へ ひらいて 本だなに なる）==== */
    const walls = [];
    [1, -1].forEach(sz => {
      const hinge = new THREE.Group();
      hinge.position.set(bx, btop + 0.02, sz * (W / 2 - 0.03));
      B.root.add(hinge);
      walls.push({ g: hinge, sz: sz });
      B.box({ parent: hinge, x: 0, y: -(btop - bbot) / 2 - 0.02, z: 0, w: blen - 0.06, h: btop - bbot, d: 0.09, r: 0.05, color: COL, part: 'door', rough: 0.28 });
      B.box({ parent: hinge, x: 0, y: -(btop - bbot) * 0.28, z: sz * 0.01, w: blen - 0.50, h: 0.42, d: 0.05, r: 0.04, mat: paint(0xf2f5f9, { rough: 0.3 }), part: 'door' });
    });
    B.anim('shelf', 'よこの かべを ひらく', v => {
      walls.forEach(w => { w.g.rotation.x = w.sz * v * 1.55; });
    });

    /* ==== 小さな 子でも のぼれる ひくい かいだん ==== */
    const stx = bx + blen / 2 - 0.55;
    [0.20, 0.42, 0.64].forEach((h, i) => {
      B.box({ x: stx - i * 0.30, y: h, z: -(W / 2 + 0.34), w: 0.34, h: 0.07, d: 0.86, r: 0.02, mat: matte(0xc7ced7, 0.6), part: 'step' });
    });
    [1, -1].forEach(sz => {
      B.cyl({ x: stx - 0.30, y: 0.95, z: -(W / 2 + 0.34) + sz * 0.40, r: 0.025, h: 0.62, seg: 8, mat: metalMat(0xb9c0ca, 0.3), part: 'step' });
    });
    B.box({ x: stx - 0.30, y: 1.24, z: -(W / 2 + 0.34), w: 0.05, h: 0.05, d: 0.86, r: 0.02, mat: metalMat(0xb9c0ca, 0.3), part: 'step' });

    /* タイヤ と フェンダー */
    B.wheel({ x: 2.35, r: 0.44, w: 0.26, spread: 0.90 });
    B.wheel({ x: -1.85, r: 0.44, w: 0.26, spread: 0.90 });
    wheelArch(B, { x: 2.35, r: 0.44, spread: 0.90, w: 0.42 });
    wheelArch(B, { x: -1.85, r: 0.44, spread: 0.90, w: 0.42, flap: true });
    B.lamp({ x: bx - blen / 2 - 0.10, y: 1.30, z: 0.70, w: 0.06, h: 0.24, d: 0.16, color: PAL.lampR, strength: 1.0, part: 'lamp' });
    B.lamp({ x: bx - blen / 2 - 0.10, y: 1.30, z: -0.70, w: 0.06, h: 0.24, d: 0.16, color: PAL.lampR, strength: 1.0, part: 'lamp' });
    /* うしろの ナンバー・やねの かんきせん・よこの マーカー */
    plate(B, { x: bx - blen / 2 - 0.10, y: 0.80, z: 0, axis: 'x-' });
    B.box({ x: bx - 0.8, y: btop + 0.20, z: 0, w: 0.5, h: 0.10, d: 0.5, r: 0.04, mat: matte(0xd9dee6, 0.5), aux: true });
    [1, -1].forEach(sz => {
      B.lamp({ x: bx, y: bbot - 0.04, z: sz * (W / 2 + 0.012), w: 0.09, h: 0.06, d: 0.03, color: 0xffa63d, strength: 0.7, aux: true });
    });
  }
};


/* ---------------------------------------------------------- かいたい車 */
MODEL3D.breaker = {
  label: 'かいたい車',
  build: function (B) {
    const COL = 0xf2941f;

    /* ゴムの タイヤでは なく てつの キャタピラ */
    crawlerTrack(B, { x: 0, len: 4.70, r: 0.50, w: 0.76, spread: 1.32, tooth: 0.055 });
    B.box({ x: 0, y: 0.64, z: 0, w: 3.80, h: 0.42, d: 2.35, r: 0.06, mat: matte(0x4d545e, 0.6), part: 'crawler' });

    /* 上の からだ */
    B.cyl({ x: -0.25, y: 1.02, z: 0, r: 1.25, h: 0.36, seg: 30, mat: metalMat(0x8d959f, 0.4), part: 'body' });
    B.box({ x: -1.20, y: 1.80, z: 0, w: 3.20, h: 1.28, d: 2.60, r: 0.16, color: COL, part: 'body', rough: 0.3 });
    B.box({ x: -2.75, y: 1.60, z: 0, w: 0.80, h: 1.44, d: 2.52, r: 0.14, mat: paint(0xd97f14, { rough: 0.4 }), part: 'body' });
    B.seam({ x: -2.75, y: 1.16, z: 1.27, w: 0.6, h: 0.03, d: 0.03, color: 0x9c5c10 });
    B.seam({ x: -2.75, y: 1.16, z: -1.27, w: 0.6, h: 0.03, d: 0.03, color: 0x9c5c10 });
    /* エンジンの ふたの あみめ */
    for (let i = 0; i < 4; i++) {
      B.seam({ x: -1.85 + i * 0.24, y: 2.45, z: -0.5, w: 0.06, h: 0.02, d: 1.4, color: 0xb46a10 });
    }
    B.cyl({ x: -0.30, y: 2.66, z: -0.85, r: 0.10, h: 0.60, seg: 14, mat: metalMat(0x8d959f, 0.42) });
    B.cyl({ x: -0.30, y: 2.99, z: -0.85, r: 0.13, h: 0.06, seg: 12, mat: matte(0x3a414b, 0.5) });

    /* うんてんせき（うしろへ たおれて 上を 見られる・まえに まもりの わく）*/
    const cab = new THREE.Group();
    cab.position.set(0.55, 1.14, 0.80);
    cab.rotation.z = -0.24;
    B.root.add(cab);
    const ch = 1.86, cw = 1.20, cd = 1.26;
    B.box({ parent: cab, x: 0, y: ch / 2, z: 0, w: cw, h: ch, d: cd, r: 0.14, b: 0.045, color: COL, part: 'cab', rough: 0.26 });
    B.glass({ parent: cab, x: cw / 2 - 0.05, y: ch / 2 + 0.16, z: 0, w: 0.08, h: ch * 0.66, d: cd - 0.22, r: 0.06, part: 'window' });
    B.glass({ parent: cab, x: -0.04, y: ch / 2 + 0.14, z: cd / 2 - 0.035, w: cw * 0.66, h: ch * 0.56, d: 0.07, r: 0.06, part: 'window' });
    B.glass({ parent: cab, x: -0.04, y: ch / 2 + 0.14, z: -cd / 2 + 0.035, w: cw * 0.66, h: ch * 0.56, d: 0.07, r: 0.06, part: 'window' });
    B.box({ parent: cab, x: 0, y: ch + 0.08, z: 0, w: cw - 0.06, h: 0.10, d: cd - 0.06, r: 0.04, mat: paint(0xd7d9dd, { rough: 0.4 }) });
    /* おちて くる かけらから まもる わく */
    for (let i = 0; i < 6; i++) {
      B.box({ parent: cab, x: cw / 2 + 0.10, y: 0.42 + i * 0.26, z: 0, w: 0.05, h: 0.05, d: cd - 0.10, r: 0.02, mat: matte(0x3c434e, 0.55), part: 'cab' });
    }
    B.box({ parent: cab, x: cw / 2 + 0.12, y: ch / 2, z: 0, w: 0.06, h: ch - 0.12, d: 0.06, r: 0.02, mat: matte(0x3c434e, 0.55), part: 'cab' });
    /* とびら・ハンドル・かいてんとう・てすり */
    B.seam({ parent: cab, x: -cw / 2 + 0.12, y: ch / 2 - 0.10, z: cd / 2 + 0.006, w: 0.024, h: ch * 0.62, d: 0.03, part: 'cab' });
    doorHandle(B, { parent: cab, x: -0.06, y: ch / 2 - 0.28, z: cd / 2 + 0.010, s: 1, len: 0.20 });
    B.lamp({ parent: cab, x: -0.25, y: ch + 0.20, z: 0, w: 0.13, h: 0.13, d: 0.13, color: 0xffa63d, strength: 1.2, aux: true });
    B.cyl({ x: 1.25, y: 1.05, z: 1.30, r: 0.024, h: 0.90, axis: 'y', seg: 8, mat: paint(0xd97f14, { rough: 0.4 }), aux: true });
    B.box({ x: 1.15, y: 0.62, z: 1.35, w: 0.36, h: 0.045, d: 0.26, r: 0.02, mat: matte(0x30363f, 0.62) });

    /* ==== ながい うで ==== */
    const boom = new THREE.Group();
    boom.position.set(1.05, 1.95, 0);
    B.root.add(boom);
    const stick = new THREE.Group();
    stick.position.set(5.60, 0, 0);
    boom.add(stick);
    const jaw = new THREE.Group();
    jaw.position.set(4.30, 0, 0);
    stick.add(jaw);

    B.box({ parent: boom, x: 2.85, y: 0, z: 0, w: 5.90, h: 0.68, d: 0.62, r: 0.14, color: COL, part: 'arm', rough: 0.3 });
    B.lamp({ parent: boom, x: 1.30, y: 0.42, z: 0.20, w: 0.10, h: 0.09, d: 0.11, color: 0xfff2cf, strength: 1.2, aux: true });
    B.cyl({ parent: boom, x: 0, y: 0, z: 0, r: 0.34, h: 0.78, axis: 'z', seg: 20, mat: metalMat(0x9aa3ae, 0.4), part: 'arm' });
    B.cyl({ parent: boom, x: 2.10, y: 0.46, z: 0, r: 0.14, h: 3.20, axis: 'x', seg: 14, mat: metalMat(0xdfe4ea, 0.14), part: 'arm' });
    B.box({ parent: stick, x: 2.15, y: 0, z: 0, w: 4.50, h: 0.50, d: 0.48, r: 0.11, color: COL, part: 'arm', rough: 0.3 });
    B.cyl({ parent: stick, x: 0, y: 0, z: 0, r: 0.26, h: 0.60, axis: 'z', seg: 18, mat: metalMat(0x9aa3ae, 0.4), part: 'arm' });

    /* ==== コンクリートを かみくだく 大きな 手 ==== */
    B.cyl({ parent: jaw, x: 0, y: 0, z: 0, r: 0.24, h: 0.62, axis: 'z', seg: 18, mat: metalMat(0x9099a5, 0.4), part: 'nipper' });
    B.box({ parent: jaw, x: 0.28, y: 0, z: 0, w: 0.62, h: 0.52, d: 0.56, r: 0.08, mat: metalMat(0x8f98a3, 0.42), part: 'nipper' });
    const jaws = [];
    [1, -1].forEach(sy => {
      const g = new THREE.Group();
      g.position.set(0.55, 0, 0);
      jaw.add(g);
      jaws.push({ g: g, sy: sy });
      B.mesh(curvedPlateGeom(1.15, 0.12, Math.PI - 0.56, Math.PI - 0.02, 0.68, 12),
        metalMat(0xb0b8c2, 0.35), { parent: g, x: 1.15, y: 0, z: 0, part: 'nipper' });
      /* かみくだく は */
      for (let i = 0; i < 3; i++) {
        const t = 0.14 + i * 0.26;
        B.box({
          parent: g, x: 0.34 + t * 1.10, y: sy * (0.18 + t * 0.26), z: 0,
          w: 0.20, h: 0.26, d: 0.54, r: 0.03, rz: sy * 0.5, mat: metalMat(0xdfe4ea, 0.2), part: 'nipper'
        });
      }
    });
    /* 上の あごは 上むきに、下の あごは 下むきに かたむける */
    jaws[0].g.scale.y = 1;
    jaws[1].g.scale.y = -1;

    const pose = (v) => {
      boom.rotation.z = THREE.MathUtils.lerp(0.62, 0.92, v);
      stick.rotation.z = THREE.MathUtils.lerp(-1.50, -1.72, v);
      jaw.rotation.z = THREE.MathUtils.lerp(0.30, 0.10, v);
    };
    pose(0);
    B.anim('nipper', 'つかむ 手を ひらく／とじる', v => {
      jaws.forEach(j => { j.g.rotation.z = j.sy * v * 0.42; });
      pose(v * 0.4);
    });
  }
};

/* ------------------------------------------------------------ グレーダー */
MODEL3D.grader = {
  label: 'グレーダー',
  build: function (B) {
    const COL = 0xf0b21c, W = 2.50;

    /* とても ながい からだ（でこぼこを けずり のこさない ため）*/
    B.mesh(sideProfileGeom([
      [-1.55, 1.10], [4.05, 1.10], [4.15, 1.50], [3.70, 1.62],
      [0.60, 1.62], [0.20, 1.44], [-1.55, 1.44]
    ], 0.70, 0.10), paint(COL, { rough: 0.3 }), { x: 0, y: 0, z: 0, part: 'body' });
    B.box({ x: -2.55, y: 1.62, z: 0, w: 2.30, h: 1.20, d: 1.90, r: 0.14, color: COL, part: 'body', rough: 0.3 });
    B.box({ x: -3.55, y: 1.30, z: 0, w: 0.70, h: 1.10, d: 1.80, r: 0.12, mat: paint(0xd99a12, { rough: 0.38 }), part: 'body' });
    B.cyl({ x: -1.75, y: 2.62, z: 0.62, r: 0.09, h: 0.62, seg: 14, mat: metalMat(0x8d959f, 0.42) });

    /* うんてんせき（は の はしが 見えるように 高い ところ）*/
    const cbot = 2.24, ctop = 3.80;
    B.box({ x: -1.05, y: (ctop + cbot) / 2, z: 0, w: 1.55, h: ctop - cbot, d: 1.80, r: 0.16, b: 0.045, color: COL, part: 'cab', rough: 0.28 });
    B.glass({ x: -1.05 + 0.74, y: (ctop + cbot) / 2 + 0.08, z: 0, w: 0.08, h: (ctop - cbot) * 0.70, d: 1.52, r: 0.07, rz: -0.10, part: 'window' });
    [1, -1].forEach(sz => {
      B.glass({ x: -1.10, y: (ctop + cbot) / 2 + 0.08, z: sz * 0.88, w: 1.22, h: (ctop - cbot) * 0.62, d: 0.07, r: 0.06, part: 'window' });
    });
    B.glass({ x: -1.82, y: (ctop + cbot) / 2 + 0.06, z: 0, w: 0.08, h: (ctop - cbot) * 0.58, d: 1.45, r: 0.07, part: 'window' });
    B.box({ x: -1.05, y: ctop + 0.09, z: 0, w: 1.65, h: 0.12, d: 1.90, r: 0.06, color: 0xe8ecf1, part: 'cab', rough: 0.4 });
    [1, -1].forEach(sz => {
      B.lamp({ x: -0.30, y: ctop + 0.14, z: sz * 0.72, w: 0.14, h: 0.10, d: 0.22, color: 0xfff2cf, strength: 1.2, part: 'lamp' });
    });
    /* とびら・ハンドル・ミラー・ワイパー・かいてんとう */
    B.seam({ x: -1.50, y: (ctop + cbot) / 2 - 0.10, z: 0.905, w: 0.024, h: (ctop - cbot) * 0.70, d: 0.03, part: 'cab' });
    doorHandle(B, { x: -1.28, y: (ctop + cbot) / 2 - 0.30, z: 0.910, s: 1, len: 0.20 });
    [1, -1].forEach(sz => {
      B.cyl({ x: -0.28, y: ctop - 0.30, z: sz * 0.95, r: 0.016, h: 0.26, axis: 'z', seg: 8, mat: metalMat(0x9aa3ae, 0.35), aux: true });
      B.box({ x: -0.28, y: ctop - 0.40, z: sz * 1.12, w: 0.07, h: 0.26, d: 0.11, r: 0.03, mat: matte(0x2a2f38, 0.5), aux: true });
    });
    wipers(B, { x: -0.29, y: (ctop + cbot) / 2 - 0.26, z: 0, rz: -0.10, len: 0.45, n: 1, a: 0.8 });
    B.lamp({ x: -1.75, y: ctop + 0.20, z: 0, w: 0.13, h: 0.13, d: 0.13, color: 0xffa63d, strength: 1.2, aux: true });
    /* のぼる かいだん と てすり */
    [1.35, 1.80].forEach((sy, i) => {
      B.box({ x: -1.05 - i * 0.06, y: sy, z: 1.00, w: 0.34, h: 0.045, d: 0.26, r: 0.02, mat: matte(0x30363f, 0.62) });
    });
    B.cyl({ x: -1.05, y: 1.75, z: 1.10, r: 0.022, h: 1.10, axis: 'y', seg: 8, mat: matte(0x3c434e, 0.5), aux: true });
    /* エンジンの あみめ と まえの ライト */
    for (let i = 0; i < 4; i++) {
      B.seam({ x: -2.9 + i * 0.24, y: 2.23, z: 0.9, w: 0.06, h: 0.02, d: 0.35, color: 0xb98812 });
      B.seam({ x: -2.9 + i * 0.24, y: 2.23, z: -0.9, w: 0.06, h: 0.02, d: 0.35, color: 0xb98812 });
    }
    [1, -1].forEach(sz => {
      B.lamp({ x: 4.18, y: 1.42, z: sz * 0.42, w: 0.07, h: 0.14, d: 0.18, color: 0xfff2cf, strength: 1.3, part: 'lamp' });
    });
    /* うしろタイヤの ながい フェンダー */
    [1, -1].forEach(sz => {
      B.box({ x: -2.72, y: 1.55, z: sz * 1.02, w: 2.75, h: 0.07, d: 0.55, r: 0.03, mat: paint(0xd99a12, { rough: 0.38 }), part: 'body' });
    });

    /* ==== 前と うしろの タイヤの あいだの、ななめに かたむけられる ながい は ==== */
    const circle = new THREE.Group();
    circle.position.set(1.35, 1.05, 0);
    B.root.add(circle);
    B.cyl({ parent: circle, x: 0, y: 0.06, z: 0, r: 0.90, h: 0.16, seg: 30, mat: metalMat(0x8f98a3, 0.4), part: 'blade' });
    /* は は 円ばんに ぶらさがって いるので、円ばんを まわすと ななめに なる */
    const blade = new THREE.Group();
    blade.position.set(0, -0.42, 0);
    circle.add(blade);
    B.mesh(curvedPlateGeom(0.72, 0.09, Math.PI - 0.72, Math.PI + 0.30, 3.70, 16),
      paint(COL, { rough: 0.3 }), { parent: blade, x: 0.62, y: 0.30, z: 0, part: 'blade' });
    B.box({ parent: blade, x: -0.06, y: -0.30, z: 0, w: 0.32, h: 0.13, d: 3.72, r: 0.03, rz: 0.34, mat: metalMat(0xb9c0ca, 0.28), part: 'blade' });
    /* は を つるす わく */
    [1, -1].forEach(sz => {
      B.box({ x: 2.30, y: 1.32, z: sz * 0.30, w: 2.10, h: 0.18, d: 0.16, r: 0.04, rz: -0.10, mat: matte(0x59616e, 0.55), part: 'blade' });
      B.cyl({ x: 1.05, y: 1.34, z: sz * 0.62, r: 0.11, h: 0.72, seg: 14, tilt: sz * 0.22, mat: matte(0x59616e, 0.5), part: 'blade' });
    });

    B.anim('blade', 'はを ななめに かたむける', v => {
      circle.rotation.y = v * 0.62;
      blade.position.y = -0.42 - v * 0.16;
    });

    /* 前の タイヤ（うんと 前）・うしろは 二じく */
    B.wheel({ x: 4.05, r: 0.66, w: 0.32, spread: 1.05 });
    B.cyl({ x: 4.05, y: 0.66, z: 0, r: 0.11, h: 2.1, axis: 'z', seg: 14, mat: matte(PAL.frame, 0.6) });
    [-2.10, -3.35].forEach(ax => {
      B.wheel({ x: ax, r: 0.72, w: 0.42, spread: 1.02 });
      B.cyl({ x: ax, y: 0.72, z: 0, r: 0.12, h: 2.0, axis: 'z', seg: 14, mat: matte(PAL.frame, 0.6) });
    });
  }
};

/* ------------------------------------------------------------ そうじ車 */
MODEL3D.sweeper = {
  label: 'そうじ車',
  build: function (B) {
    const COL = 0x2f9e63, W = 2.10;

    chassis(B, { x: -0.3, y: 0.74, len: 5.4, spread: 0.40 });
    truckCab(B, { x: 1.95, len: 1.75, w: W, top: 2.72, floor: 0.84, color: COL });
    lightBar(B, { x: 1.95, y: 2.84, w: 1.30, n: 4, colors: [PAL.lampY, 0xfff0d0], part: 'lamp' });

    /* 上が そうじきの ような 大きな タンク */
    const prof = [
      [0.03, -1.60], [0.55, -1.56], [0.82, -1.38], [0.94, -1.05],
      [0.99, 0], [0.94, 1.05], [0.82, 1.38], [0.55, 1.56], [0.03, 1.60]
    ].map(p => new THREE.Vector2(p[0], p[1]));
    const g = new THREE.LatheGeometry(prof, 40);
    g.computeVertexNormals();
    B.mesh(g, paint(0xe2e8ef, { metal: 0.35, rough: 0.28 }), { x: -1.15, y: 1.98, z: 0, rz: Math.PI / 2, part: 'tank' });
    [-0.9, 0.3].forEach(dx => {
      B.mesh(new THREE.TorusGeometry(0.97, 0.05, 10, 30), metalMat(0x9aa3ae, 0.34),
        { x: -1.15 + dx, y: 1.98, z: 0, ry: Math.PI / 2, part: 'tank' });
    });
    B.box({ x: -1.15, y: 1.00, z: 0, w: 3.30, h: 0.42, d: 1.70, r: 0.06, color: COL, part: 'tank', rough: 0.3 });
    B.box({ x: 0.55, y: 1.90, z: 0, w: 0.70, h: 0.86, d: 1.30, r: 0.10, color: COL, part: 'tank', rough: 0.3 });
    /* すいこむ くだ（じゃばらの わっか つき） */
    B.cyl({ x: -0.10, y: 1.15, z: 0, r: 0.22, h: 1.40, axis: 'y', seg: 18, tilt: 0.30, mat: matte(0x3c434e, 0.6), part: 'tank' });
    for (let i = 0; i < 5; i++) {
      const t = 0.55 + i * 0.22;
      B.mesh(new THREE.TorusGeometry(0.235, 0.025, 8, 20), matte(0x2b3038, 0.6),
        { x: -0.10 - Math.sin(0.30) * (t - 1.15) * 1.0, y: t, z: 0, rx: Math.PI / 2, rz: 0.30, part: 'tank' });
    }
    B.box({ x: -0.05, y: 0.30, z: 0, w: 0.85, h: 0.36, d: 1.05, r: 0.06, mat: matte(0x2b3038, 0.65), part: 'tank' });
    /* まえの 水を まく ノズル（バンパーの 下に つきだす） */
    for (let i = -2; i <= 2; i++) {
      B.box({ x: 3.04, y: 0.30, z: i * 0.38, w: 0.07, h: 0.10, d: 0.07, r: 0.02, mat: metalMat(0x9aa3ae, 0.35), part: 'brush' });
    }
    B.cyl({ x: 3.04, y: 0.38, z: 0, r: 0.028, h: 1.70, axis: 'z', seg: 8, mat: metalMat(0x9aa3ae, 0.35), part: 'brush' });
    /* うしろの とびら（ためた ごみを 出す） の あわせめ と ちょうつがい */
    B.seam({ x: -2.72, y: 1.98, z: 0.55, w: 0.026, h: 1.30, d: 0.03, part: 'tank' });
    B.seam({ x: -2.72, y: 1.98, z: -0.55, w: 0.026, h: 1.30, d: 0.03, part: 'tank' });
    tailLamps(B, { x: -2.90, y: 0.78, zOff: W / 2 - 0.38 });
    plate(B, { x: -2.90, y: 0.78, z: 0, axis: 'x-' });

    /* ==== 車の 下で まわる 大きな ブラシ ==== */
    const brushes = [];
    [1, -1].forEach(sz => {
      const gg = new THREE.Group();
      gg.position.set(1.05, 0.34, sz * 1.00);
      B.root.add(gg);
      brushes.push(gg);
      B.cyl({ parent: gg, x: 0, y: 0.10, z: 0, r: 0.20, h: 0.16, seg: 18, mat: metalMat(0x8f98a3, 0.4), part: 'brush' });
      for (let i = 0; i < 16; i++) {
        const a = i / 16 * Math.PI * 2;
        B.box({
          parent: gg, x: Math.cos(a) * 0.42, y: -0.06, z: Math.sin(a) * 0.42,
          w: 0.20, h: 0.30, d: 0.10, r: 0.03, ry: -a,
          mat: matte(i % 2 ? 0xf0d24a : 0xd9a92e, 0.85), part: 'brush'
        });
      }
      /* ブラシを ささえる うで */
      B.box({ x: 1.05, y: 0.72, z: sz * 0.66, w: 0.55, h: 0.14, d: 0.60, r: 0.04, mat: matte(0x59616e, 0.55), part: 'brush' });
      B.spin.push({ obj: gg, axis: 'y', speed: 0 });
    });
    const i0 = B.spin.length - 2;
    B.anim('brush', 'ブラシを まわす', v => {
      B.spin[i0].speed = v * 5.5;
      B.spin[i0 + 1].speed = -v * 5.5;
    });

    /* タイヤ */
    B.wheel({ x: 1.80, r: 0.42, w: 0.26, spread: 0.88 });
    B.wheel({ x: -1.85, r: 0.42, w: 0.24, z: 0.78 });
    B.wheel({ x: -1.85, r: 0.42, w: 0.24, z: 1.02 });
    B.wheel({ x: -1.85, r: 0.42, w: 0.24, z: -0.78 });
    B.wheel({ x: -1.85, r: 0.42, w: 0.24, z: -1.02 });
    [1.80, -1.85].forEach(ax => {
      B.cyl({ x: ax, y: 0.42, z: 0, r: 0.09, h: 1.7, axis: 'z', seg: 14, mat: matte(PAL.frame, 0.6) });
    });
  }
};


/* ---------------- 車いす（ふくし車に のせる）---------------- */
function wheelchair(B, o) {
  const g = new THREE.Group();
  g.position.set(o.x, o.y, o.z || 0);
  if (o.ry) g.rotation.y = o.ry;
  (o.parent || B.root).add(g);
  const P = o.part;
  const frame = metalMat(0x8f98a3, 0.35), seat = matte(0x2f4a80, 0.8);
  B.box({ parent: g, x: 0, y: 0.50, z: 0, w: 0.46, h: 0.07, d: 0.48, r: 0.03, mat: seat, part: P });
  B.box({ parent: g, x: -0.22, y: 0.78, z: 0, w: 0.07, h: 0.52, d: 0.48, r: 0.03, mat: seat, part: P });
  B.box({ parent: g, x: 0.26, y: 0.22, z: 0, w: 0.30, h: 0.05, d: 0.36, r: 0.02, mat: frame, part: P });
  [1, -1].forEach(sz => {
    B.cyl({ parent: g, x: -0.04, y: 0.30, z: sz * 0.30, r: 0.30, h: 0.05, axis: 'z', seg: 24, mat: matte(0x2b3038, 0.7), part: P });
    B.mesh(new THREE.TorusGeometry(0.32, 0.016, 8, 26), frame, { parent: g, x: -0.04, y: 0.30, z: sz * 0.34, ry: Math.PI / 2, part: P });
    B.cyl({ parent: g, x: 0.34, y: 0.10, z: sz * 0.22, r: 0.10, h: 0.05, axis: 'z', seg: 14, mat: matte(0x2b3038, 0.7), part: P });
    B.box({ parent: g, x: -0.30, y: 1.08, z: sz * 0.22, w: 0.22, h: 0.05, d: 0.05, r: 0.02, mat: frame, part: P });
  });
  return g;
}

/* ------------------------------------------------------------ ふくし車 */
MODEL3D.welfare = {
  label: 'ふくし車',
  build: function (B) {
    const COL = 0xf2f5f9, ACC = 0x2f7fd0, W = 1.92;
    const L = 4.90, FLOOR = 0.48, ROOF = 2.42;

    chassis(B, { x: 0.1, y: 0.40, len: 4.4, spread: 0.34 });

    /* よこの かべ（うしろは あけて 中を 見せる）*/
    [1, -1].forEach(sz => {
      const zz = sz * (W / 2 - 0.05);
      B.mesh(sideProfileGeom([
        [-2.42, 0.34], [2.42, 0.34], [2.45, 1.06], [2.05, 1.24],
        [1.22, 1.76], [0.55, ROOF], [-2.42, ROOF]
      ], 0.10, 0.14), paint(COL, { metal: 0.25, rough: 0.24, clear: 1.0 }), { x: 0, y: 0, z: zz, part: 'body' });
      B.mesh(sideProfileGeom([[-1.95, 1.42], [-0.35, 1.42], [-0.35, 2.14], [-1.95, 2.14]], 0.06, 0.06),
        clearGlassMat(), { x: 0, y: 0, z: zz + sz * 0.012, part: 'window' });
      B.mesh(sideProfileGeom([[0.20, 1.48], [1.30, 1.48], [0.98, 2.10], [0.05, 2.10]], 0.06, 0.06),
        clearGlassMat(), { x: 0, y: 0, z: zz + sz * 0.012, part: 'window' });
      B.box({ x: -0.20, y: 1.02, z: sz * (W / 2 + 0.012), w: 3.10, h: 0.16, d: 0.02, r: 0.01, mat: paint(ACC, { rough: 0.3 }) });
      B.seam({ x: -0.10, y: 1.30, z: sz * (W / 2 + 0.008), w: 0.026, h: 1.65, d: 0.03, part: 'door' });
      B.lamp({ x: 2.47, y: 0.74, z: sz * (W / 2 - 0.30), w: 0.07, h: 0.18, d: 0.26, color: 0xfff2cf, strength: 1.4, part: 'lamp' });
    });
    B.box({ x: 0, y: FLOOR, z: 0, w: L - 0.10, h: 0.12, d: W, r: 0.04, color: 0x39404c, part: 'body' });
    B.box({ x: -0.95, y: ROOF + 0.05, z: 0, w: L - 1.90, h: 0.12, d: W, r: 0.10, color: COL, part: 'body', rough: 0.3 });
    /* まえ（うんてんせき）*/
    B.mesh(sideProfileGeom([
      [0.55, 0.34], [2.42, 0.34], [2.45, 1.06], [2.05, 1.24], [1.22, 1.76], [0.55, ROOF]
    ], W - 0.16, 0.12), paint(COL, { metal: 0.25, rough: 0.24 }), { x: 0, y: 0, z: 0, part: 'cab' });
    B.mesh(sideProfileGeom([[1.28, 1.74], [2.02, 1.30], [1.72, 2.20], [0.72, 2.24]], W - 0.06, 0.08),
      glassMat(B.quality), { x: 0, y: 0, z: 0, part: 'window' });
    B.box({ x: 2.42, y: 0.44, z: 0, w: 0.20, h: 0.28, d: W - 0.02, r: 0.07, mat: matte(0x38404d, 0.55) });
    /* グリル・ナンバー・ワイパー・ドアミラー・ドアハンドル */
    B.box({ x: 2.475, y: 0.90, z: 0, w: 0.045, h: 0.16, d: W * 0.55, r: 0.03, mat: matte(0x1e232b, 0.45) });
    B.box({ x: 2.49, y: 0.90, z: 0, w: 0.025, h: 0.03, d: W * 0.50, r: 0.012, mat: metalMat(PAL.chrome, 0.2) });
    plate(B, { x: 2.50, y: 0.60, z: 0, axis: 'x+' });
    plate(B, { x: -L / 2 - 0.02, y: 0.70, z: 0.45, axis: 'x-' });
    wipers(B, { x: 1.72, y: 1.55, z: -0.25, rz: -0.62, len: 0.42, gap: 0.60 });
    [1, -1].forEach(sz => {
      doorMirror(B, { x: 1.42, y: 1.42, z: sz * (W / 2 - 0.03), s: sz, color: COL });
      doorHandle(B, { x: 0.28, y: 1.22, z: sz * (W / 2 + 0.012), s: sz, len: 0.22 });
      /* まえの とびらの あわせめ */
      B.seam({ x: 0.98, y: 1.02, z: sz * (W / 2 + 0.008), w: 0.026, h: 1.15, d: 0.03, part: 'door' });
      /* タイヤの アーチ */
      B.mesh(curvedPlateGeom(0.44, 0.035, 0.12, Math.PI - 0.12, 0.05, 12), matte(0x22262d, 0.5),
        { x: 1.65, y: 0.36, z: sz * 0.90 });
      B.mesh(curvedPlateGeom(0.44, 0.035, 0.12, Math.PI - 0.12, 0.05, 12), matte(0x22262d, 0.5),
        { x: -1.55, y: 0.36, z: sz * 0.90 });
    });
    /* やねの アンテナ */
    B.cyl({ x: -0.4, y: ROOF + 0.28, z: 0.55, r: 0.012, h: 0.35, axis: 'y', seg: 6, mat: matte(0x22262d, 0.4), aux: true });

    /* うしろの とびら（2まい）*/
    const hinges = [];
    [1, -1].forEach(sz => {
      const hg = new THREE.Group();
      hg.position.set(-L / 2 + 0.05, 0, sz * (W / 2 - 0.05));
      B.root.add(hg);
      hinges.push({ g: hg, sz: sz });
      B.box({ parent: hg, x: -0.04, y: (ROOF + FLOOR) / 2 + 0.06, z: -sz * (W / 4 - 0.02), w: 0.09, h: ROOF - FLOOR, d: W / 2 - 0.06, r: 0.05, color: COL, part: 'door', rough: 0.26 });
      B.box({ parent: hg, x: -0.10, y: 1.80, z: -sz * (W / 4 - 0.02), w: 0.05, h: 0.62, d: W / 2 - 0.26, r: 0.05, mat: clearGlassMat(), part: 'door' });
    });

    /* ==== のった ままで のぼれる スロープ ==== */
    const slope = new THREE.Group();
    slope.position.set(-L / 2 + 0.12, FLOOR + 0.06, 0);
    B.root.add(slope);
    B.box({ parent: slope, x: -0.85, y: 0, z: 0, w: 1.80, h: 0.07, d: W - 0.24, r: 0.03, mat: metalMat(0xb0b8c2, 0.35), part: 'slope' });
    [1, -1].forEach(sz => {
      B.box({ parent: slope, x: -0.85, y: 0.07, z: sz * (W / 2 - 0.16), w: 1.80, h: 0.10, d: 0.06, r: 0.02, mat: paint(0xf5c433, { rough: 0.3 }), part: 'slope' });
    });
    for (let i = 0; i < 4; i++) {
      B.box({ parent: slope, x: -0.30 - i * 0.42, y: 0.05, z: 0, w: 0.08, h: 0.04, d: W - 0.34, r: 0.02, mat: metalMat(0x8f98a3, 0.4), part: 'slope' });
    }

    /* ==== 車いすと、四すみを とめる ベルト ==== */
    wheelchair(B, { x: -0.95, y: FLOOR + 0.06, z: 0, ry: Math.PI, part: 'seat' });
    [[-0.35, 0.42], [-0.35, -0.42], [-1.55, 0.42], [-1.55, -0.42]].forEach(([bx, bz]) => {
      B.box({ x: bx, y: FLOOR + 0.24, z: bz, w: 0.06, h: 0.42, d: 0.05, r: 0.02, rz: bx > -0.95 ? -0.5 : 0.5, mat: matte(0xe5544b, 0.8), part: 'belt' });
      B.box({ x: bx, y: FLOOR + 0.08, z: bz, w: 0.14, h: 0.06, d: 0.10, r: 0.02, mat: metalMat(0x8f98a3, 0.4), part: 'belt' });
    });

    B.anim('slope', 'スロープを おろす', v => {
      hinges.forEach(h => { h.g.rotation.y = -h.sz * v * 1.70; });
      /* しまって ある ときは ゆかの 中。ひらくと すべり出て、ななめに なる */
      slope.position.x = (-L / 2 + 0.12) + (1 - Math.min(1, v * 1.6)) * 1.72;
      slope.rotation.z = -Math.max(0, v - 0.35) / 0.65 * 0.30;
      slope.position.y = FLOOR + 0.06 - v * 0.02;
    });

    B.wheel({ x: 1.65, r: 0.36, w: 0.22, spread: 0.82 });
    B.wheel({ x: -1.55, r: 0.36, w: 0.22, spread: 0.82 });
  }
};

/* ---------------------------------------------------------- ひっこし車 */
MODEL3D.moving = {
  label: 'ひっこし車',
  build: function (B) {
    const COL = 0x2f7fd0, W = 2.30;
    const nx = -0.85, nlen = 5.40, nbot = 1.06, ntop = 3.86;   /* せの 高い にだい */

    chassis(B, { x: -0.3, y: 0.86, len: 7.4, spread: 0.42 });
    truckCab(B, { x: 2.95, len: 1.95, w: W, top: 2.96, floor: 0.92, color: COL });

    /* ==== たんすや れいぞうこを 立てた まま 入れられる、せの 高い にだい ==== */
    B.box({ x: nx, y: (ntop + nbot) / 2, z: 0, w: nlen, h: ntop - nbot, d: W, r: 0.10, b: 0.05, color: 0xf2f5f9, part: 'nidai', metal: 0.28, rough: 0.3 });
    [1, -1].forEach(sz => {
      B.box({ x: nx, y: nbot + 0.55, z: sz * (W / 2 + 0.012), w: nlen - 0.14, h: 0.26, d: 0.02, r: 0.01, mat: paint(COL, { rough: 0.3 }) });
      for (let i = -2; i <= 2; i++) {
        B.seam({ x: nx + i * 1.15, y: (ntop + nbot) / 2, z: sz * (W / 2 + 0.012), w: 0.055, h: ntop - nbot - 0.30, d: 0.03, color: 0x9aa5b2, part: 'nidai' });
      }
    });
    B.box({ x: nx, y: ntop + 0.06, z: 0, w: nlen + 0.05, h: 0.12, d: W + 0.05, r: 0.06, color: 0xdfe6ee, part: 'nidai', rough: 0.3 });
    B.box({ x: nx + nlen / 2 + 0.02, y: (ntop + nbot) / 2, z: 0, w: 0.06, h: ntop - nbot, d: W, r: 0.04, mat: paint(0xdfe6ee, { rough: 0.3 }), part: 'nidai' });
    /* 中が 見えるように うしろは あける */
    [1, -1].forEach(sz => {
      B.lamp({ x: nx - nlen / 2 - 0.06, y: nbot + 0.20, z: sz * (W / 2 - 0.26), w: 0.05, h: 0.26, d: 0.16, color: PAL.lampR, strength: 1.0, part: 'lamp' });
    });
    /* 四すみの まもりの ゴム・ナンバー・よこの マーカー・どろよけ */
    [1, -1].forEach(sz => {
      B.box({ x: nx - nlen / 2 + 0.05, y: (ntop + nbot) / 2, z: sz * (W / 2 - 0.01), w: 0.09, h: ntop - nbot - 0.08, d: 0.09, r: 0.03, mat: matte(0x2b3038, 0.6), part: 'nidai' });
      [-2.8, 0, 2.0].forEach(mx => {
        B.lamp({ x: mx + nx, y: nbot - 0.03, z: sz * (W / 2 + 0.012), w: 0.09, h: 0.06, d: 0.03, color: 0xffa63d, strength: 0.7, aux: true });
      });
      B.box({ x: -2.95, y: 0.34, z: sz * 0.97, w: 0.045, h: 0.52, d: 0.52, r: 0.02, mat: matte(0x1d2127, 0.85) });
    });
    plate(B, { x: nx - nlen / 2 - 0.06, y: 0.72, z: 0.55, axis: 'x-' });

    /* ==== うしろの 台（エレベーターの ように 上下する）==== */
    const gate = new THREE.Group();
    gate.position.set(nx - nlen / 2 - 0.90, nbot, 0);
    B.root.add(gate);
    B.box({ parent: gate, x: 0, y: 0, z: 0, w: 1.70, h: 0.12, d: W - 0.10, r: 0.03, mat: metalMat(0xb0b8c2, 0.35), part: 'gate' });
    [1, -1].forEach(sz => {
      B.box({ parent: gate, x: 0, y: 0.10, z: sz * (W / 2 - 0.10), w: 1.70, h: 0.10, d: 0.06, r: 0.02, mat: paint(0xf5c433, { rough: 0.3 }), part: 'gate' });
    });
    B.box({ parent: gate, x: -0.85, y: 0.06, z: 0, w: 0.14, h: 0.20, d: W - 0.14, r: 0.03, mat: metalMat(0x8f98a3, 0.4), part: 'gate' });
    /* 台に のせた たんす */
    B.box({ parent: gate, x: 0.05, y: 0.95, z: 0, w: 0.72, h: 1.68, d: 0.86, r: 0.04, mat: matte(0x8f6a3f, 0.75), part: 'gate' });
    B.box({ parent: gate, x: 0.42, y: 0.95, z: 0, w: 0.03, h: 1.50, d: 0.72, r: 0.01, mat: matte(0x6f5230, 0.7), part: 'gate' });
    /* 上下させる はしら */
    [1, -1].forEach(sz => {
      B.box({ x: nx - nlen / 2 - 0.12, y: (ntop + nbot) / 2 - 0.30, z: sz * (W / 2 - 0.12), w: 0.16, h: ntop - nbot - 0.40, d: 0.16, r: 0.04, mat: matte(0x59616e, 0.55), part: 'gate' });
    });
    B.anim('gate', '台を 上げ下げ する', v => { gate.position.y = nbot - v * 0.94; });

    /* タイヤ */
    B.wheel({ x: 2.75, r: 0.52, w: 0.30, spread: 0.96 });
    B.wheel({ x: -2.15, r: 0.52, w: 0.28, z: 0.84 });
    B.wheel({ x: -2.15, r: 0.52, w: 0.28, z: 1.10 });
    B.wheel({ x: -2.15, r: 0.52, w: 0.28, z: -0.84 });
    B.wheel({ x: -2.15, r: 0.52, w: 0.28, z: -1.10 });
    [2.75, -2.15].forEach(ax => {
      B.cyl({ x: ax, y: 0.52, z: 0, r: 0.10, h: 1.9, axis: 'z', seg: 14, mat: matte(PAL.frame, 0.6) });
    });
  }
};

/* ---------------------------------------------------------- キッチンカー */
MODEL3D.kitchen = {
  label: 'キッチンカー',
  build: function (B) {
    const COL = 0xe8896f, W = 2.06;
    const bx = -0.60, blen = 3.60, bbot = 0.96, btop = 3.00;

    chassis(B, { x: 0.1, y: 0.78, len: 5.4, spread: 0.38 });
    truckCab(B, { x: 2.10, len: 1.70, w: W, top: 2.78, floor: 0.90, color: COL });

    /* からだ */
    B.box({ x: bx, y: bbot, z: 0, w: blen, h: 0.16, d: W, r: 0.04, color: 0x39404c, part: 'kitchen' });
    B.box({ x: bx, y: btop + 0.08, z: 0, w: blen, h: 0.16, d: W, r: 0.06, color: 0xf2f5f9, part: 'kitchen', rough: 0.3 });
    B.box({ x: bx - blen / 2 - 0.05, y: (btop + bbot) / 2, z: 0, w: 0.10, h: btop - bbot, d: W, r: 0.06, color: COL, part: 'kitchen', rough: 0.3 });
    B.box({ x: bx + blen / 2 + 0.05, y: (btop + bbot) / 2, z: 0, w: 0.10, h: btop - bbot, d: W, r: 0.06, color: COL, part: 'kitchen', rough: 0.3 });
    /* おくの かべ（ひらかない がわ）*/
    B.box({ x: bx, y: (btop + bbot) / 2, z: -(W / 2 - 0.05), w: blen, h: btop - bbot, d: 0.10, r: 0.05, color: COL, part: 'kitchen', rough: 0.3 });

    /* ==== 中の ちょうりだい（水の タンクと 火）==== */
    B.box({ x: bx, y: bbot + 0.52, z: -0.30, w: blen - 0.35, h: 0.86, d: 0.72, r: 0.05, mat: metalMat(0xc7ced7, 0.35), part: 'kitchen' });
    B.box({ x: bx, y: bbot + 0.98, z: -0.30, w: blen - 0.30, h: 0.08, d: 0.80, r: 0.03, mat: metalMat(0xdfe4ea, 0.22), part: 'kitchen' });
    /* 火（コンロ）*/
    [-0.55, 0.05].forEach(dx => {
      B.cyl({ x: bx + dx, y: bbot + 1.04, z: -0.30, r: 0.17, h: 0.05, seg: 20, mat: matte(0x2b3038, 0.6), part: 'kitchen' });
      B.mesh(new THREE.TorusGeometry(0.11, 0.022, 8, 18), lampMat(0x2f6fe0, 0.8),
        { x: bx + dx, y: bbot + 1.07, z: -0.30, rx: Math.PI / 2, part: 'kitchen' });
    });
    /* 水の タンクと ながし */
    B.box({ x: bx + 1.15, y: bbot + 1.00, z: -0.30, w: 0.62, h: 0.10, d: 0.56, r: 0.04, mat: metalMat(0xb0b8c2, 0.25), part: 'kitchen' });
    B.cyl({ x: bx + 1.28, y: bbot + 1.16, z: -0.42, r: 0.03, h: 0.28, seg: 10, mat: metalMat(PAL.chrome, 0.2), part: 'kitchen' });
    B.cyl({ x: bx - 1.35, y: bbot + 0.52, z: -0.30, r: 0.26, h: 0.86, seg: 20, mat: metalMat(0xdfe4ea, 0.25), part: 'kitchen' });
    /* うえの たな */
    B.box({ x: bx, y: bbot + 1.60, z: -0.62, w: blen - 0.60, h: 0.06, d: 0.34, r: 0.02, mat: matte(0xd6c3a5, 0.75), part: 'kitchen' });

    /* ==== よこの かべが 上へ ひらいて まどに なる ＋ カウンター ==== */
    const WH = 0.95;                                   /* ひらく かべの たかさ */
    const wing = new THREE.Group();
    wing.position.set(bx, btop - 0.04, W / 2 - 0.05);
    B.root.add(wing);
    B.box({ parent: wing, x: 0, y: -WH / 2, z: 0, w: blen - 0.06, h: WH, d: 0.09, r: 0.05, color: COL, part: 'counter', rough: 0.28 });
    B.box({ parent: wing, x: 0, y: -WH / 2, z: 0.012, w: blen - 0.55, h: WH - 0.30, d: 0.04, r: 0.04, mat: paint(0xf2f5f9, { rough: 0.3 }), part: 'counter' });
    /* かべを ささえる ぼう */
    [1, -1].forEach(sx => {
      B.cyl({ parent: wing, x: sx * (blen / 2 - 0.30), y: -WH + 0.02, z: 0.30, r: 0.022, h: 0.62, seg: 8, tilt: 0.55, mat: metalMat(0xb9c0ca, 0.3), part: 'counter' });
    });

    /* ちょうど よい 高さの カウンター板 */
    B.box({ x: bx, y: bbot + 1.04, z: W / 2 + 0.16, w: blen - 0.25, h: 0.10, d: 0.56, r: 0.03, mat: matte(0xd6c3a5, 0.6), part: 'counter' });
    [1, -1].forEach(sx => {
      B.cyl({ x: bx + sx * (blen / 2 - 0.35), y: bbot + 0.52, z: W / 2 + 0.30, r: 0.035, h: 1.00, seg: 10, mat: metalMat(0x9aa3ae, 0.35), part: 'counter' });
    });
    /* 下の かべ（カウンターの 下）*/
    B.box({ x: bx, y: bbot + 0.50, z: W / 2 - 0.05, w: blen - 0.06, h: 1.00, d: 0.09, r: 0.05, color: COL, part: 'counter', rough: 0.28 });
    /* まどの わく（かべが ひらくと ここが 出て くる）*/
    [1, -1].forEach(sx => {
      B.box({ x: bx + sx * (blen / 2 - 0.05), y: bbot + 1.52, z: W / 2 - 0.05, w: 0.10, h: 1.04, d: 0.09, r: 0.03, color: COL, part: 'counter', rough: 0.3 });
    });

    B.anim('counter', 'よこの かべを 上へ ひらく', v => { wing.rotation.x = -v * 1.48; });

    /* だいどころの えんとつ（かんきせん）と メニューの 板 */
    B.box({ x: bx - 0.9, y: btop + 0.26, z: -0.3, w: 0.42, h: 0.22, d: 0.42, r: 0.04, mat: metalMat(0xb9c0ca, 0.35), part: 'kitchen' });
    B.cyl({ x: bx - 0.9, y: btop + 0.45, z: -0.3, r: 0.10, h: 0.18, axis: 'y', seg: 12, mat: metalMat(0x9aa3ae, 0.4), part: 'kitchen' });
    B.box({ x: bx + blen / 2 - 0.30, y: bbot + 1.68, z: W / 2 + 0.01, w: 0.60, h: 0.45, d: 0.03, r: 0.02, mat: matte(0x3a3f36, 0.6), part: 'counter' });
    /* うしろの まど・ランプ・ナンバー */
    B.glass({ x: bx - blen / 2 - 0.06, y: (btop + bbot) / 2 + 0.30, z: 0, w: 0.05, h: 0.62, d: 1.10, r: 0.06, part: 'window' });
    tailLamps(B, { x: bx - blen / 2 - 0.06, y: 0.80, zOff: W / 2 - 0.35 });
    plate(B, { x: bx - blen / 2 - 0.06, y: 0.80, z: 0, axis: 'x-' });

    B.wheel({ x: 1.95, r: 0.40, w: 0.24, spread: 0.86 });
    B.wheel({ x: -1.70, r: 0.40, w: 0.24, spread: 0.86 });
    wheelArch(B, { x: 1.95, r: 0.40, spread: 0.86, w: 0.38 });
    wheelArch(B, { x: -1.70, r: 0.40, spread: 0.86, w: 0.38, flap: true });
  }
};


/* --------------------------------------------------- 木を はこぶ 車 */
MODEL3D.logger = {
  label: '木を はこぶ 車',
  build: function (B) {
    const COL = 0x2f8f52, W = 2.44;

    chassis(B, { x: -0.6, y: 0.90, len: 9.8, spread: 0.44 });
    truckCab(B, { x: 3.85, len: 2.20, w: W, top: 3.10, floor: 0.96, color: COL });

    /* ==== まるたを のせる にだい と、ころがり おちない ように 立てた ふとい ぼう ==== */
    const nx = -1.90, nlen = 5.60;
    B.box({ x: nx, y: 1.16, z: 0, w: nlen, h: 0.18, d: W, r: 0.04, mat: matte(0x59616e, 0.6), part: 'stake' });
    for (let i = -2; i <= 2; i++) {
      B.box({ x: nx + i * 1.30, y: 1.30, z: 0, w: 0.16, h: 0.18, d: W + 0.10, r: 0.04, mat: matte(0x4a525f, 0.6), part: 'stake' });
      [1, -1].forEach(sz => {
        B.box({ x: nx + i * 1.30, y: 2.10, z: sz * (W / 2 + 0.06), w: 0.16, h: 1.55, d: 0.16, r: 0.04, mat: paint(0xd99a12, { rough: 0.35 }), part: 'stake' });
      });
    }
    /* つんだ まるた */
    const LOG = [0x9a7143, 0xa87e4c, 0x8c6539, 0xb08a5a];
    [[1.62, 0.62], [1.62, -0.02], [1.62, -0.66], [2.20, 0.32], [2.20, -0.34], [2.72, 0.00]].forEach((p, i) => {
      B.cyl({
        x: nx + (i % 2 ? 0.15 : -0.10), y: p[0], z: p[1], r: 0.31, h: nlen + 0.9 - (i % 3) * 0.5,
        axis: 'x', seg: 18, mat: matte(LOG[i % 4], 0.85), part: 'stake'
      });
    });

    /* まるたが うんてんせきに とびこまない ための まもりの あみ（ヘッドガード）
       うえは クレーンを たたんで のせられる ように あけて ある */
    B.box({ x: 2.82, y: 1.58, z: 0, w: 0.10, h: 1.30, d: W - 0.10, r: 0.04, mat: matte(0x3c434e, 0.55), part: 'stake' });
    for (let i = -3; i <= 3; i++) {
      B.box({ x: 2.86, y: 1.58, z: i * (W - 0.30) / 6, w: 0.05, h: 1.22, d: 0.055, r: 0.02, mat: matte(0x59616e, 0.5), part: 'stake' });
    }
    /* たてに 立てた マフラー（きこりの トラックらしい） */
    B.cyl({ x: 2.90, y: 2.60, z: -(W / 2 - 0.20), r: 0.075, h: 1.70, axis: 'y', seg: 12, mat: metalMat(0x9aa3ae, 0.3), part: 'stake' });
    B.cyl({ x: 2.90, y: 3.50, z: -(W / 2 - 0.20), r: 0.045, h: 0.22, axis: 'y', seg: 8, mat: matte(0x3a414b, 0.5), part: 'stake' });

    /* うしろの ランプ・ナンバー・どろよけ */
    tailLamps(B, { x: -4.72, y: 0.82, zOff: W / 2 - 0.42 });
    plate(B, { x: -4.72, y: 0.82, z: 0, axis: 'x-' });
    [1, -1].forEach(sz => {
      B.box({ x: -4.62, y: 0.36, z: sz * 1.04, w: 0.045, h: 0.56, d: 0.55, r: 0.02, mat: matte(0x1d2127, 0.85) });
    });

    /* ==== うんてんせきの うしろの クレーンと、まるたを つかむ 手 ==== */
    B.box({ x: 2.20, y: 1.55, z: 0, w: 1.10, h: 1.10, d: W - 0.20, r: 0.08, color: COL, part: 'grapple', rough: 0.3 });
    B.cyl({ x: 2.20, y: 2.22, z: 0, r: 0.42, h: 0.30, seg: 24, mat: metalMat(0x9aa3ae, 0.38), part: 'grapple' });

    const boom = new THREE.Group();
    boom.position.set(2.20, 2.45, 0);
    B.root.add(boom);
    const stick = new THREE.Group();
    stick.position.set(3.10, 0, 0);
    boom.add(stick);
    const head = new THREE.Group();
    head.position.set(2.90, 0, 0);
    stick.add(head);

    B.box({ parent: boom, x: 1.55, y: 0, z: 0, w: 3.20, h: 0.48, d: 0.44, r: 0.10, color: 0xd99a12, part: 'grapple', rough: 0.32 });
    B.cyl({ parent: boom, x: 0, y: 0, z: 0, r: 0.26, h: 0.58, axis: 'z', seg: 18, mat: metalMat(0x9aa3ae, 0.4), part: 'grapple' });
    B.box({ parent: stick, x: 1.45, y: 0, z: 0, w: 3.00, h: 0.36, d: 0.34, r: 0.08, color: 0xf0b21c, part: 'grapple', rough: 0.32 });
    B.cyl({ parent: stick, x: 0, y: 0, z: 0, r: 0.20, h: 0.46, axis: 'z', seg: 16, mat: metalMat(0x9aa3ae, 0.4), part: 'grapple' });

    /* まるたを がしっと つかむ 手 */
    const claw = new THREE.Group();
    head.add(claw);
    B.cyl({ parent: claw, x: 0, y: -0.20, z: 0, r: 0.09, h: 0.42, axis: 'y', seg: 12, mat: metalMat(0x9aa3ae, 0.35), part: 'grapple' });
    B.box({ parent: claw, x: 0, y: -0.48, z: 0, w: 0.44, h: 0.24, d: 0.52, r: 0.06, mat: metalMat(0x8f98a3, 0.4), part: 'grapple' });
    const arms = [];
    [1, -1].forEach(sz => {
      const g = new THREE.Group();
      g.position.set(0, -0.58, sz * 0.16);
      claw.add(g);
      arms.push({ g: g, sz: sz });
      B.mesh(curvedPlateGeom(0.62, 0.09, Math.PI * 1.52, Math.PI * 1.98, 0.42, 12),
        metalMat(0xb0b8c2, 0.35), { parent: g, x: 0, y: 0.62, z: 0, ry: sz > 0 ? 0 : Math.PI, part: 'grapple' });
    });

    const pose = v => {
      boom.rotation.z = THREE.MathUtils.lerp(0.10, 0.62, v);
      stick.rotation.z = THREE.MathUtils.lerp(-2.55, -1.35, v);
      head.rotation.z = -(boom.rotation.z + stick.rotation.z);   /* 手は いつも 下むき */
      arms.forEach(a => { a.g.rotation.z = a.sz * (0.10 + v * 0.52); });
    };
    pose(0);
    B.anim('grapple', 'うでを のばして 手を ひらく', pose);

    /* タイヤ */
    B.wheel({ x: 3.65, r: 0.56, w: 0.34, spread: 1.02 });
    [-2.60, -3.95].forEach(ax => {
      [0.90, 1.19, -0.90, -1.19].forEach(z => B.wheel({ x: ax, r: 0.56, w: 0.30, z: z }));
      B.cyl({ x: ax, y: 0.56, z: 0, r: 0.11, h: 2.05, axis: 'z', seg: 14, mat: matte(PAL.frame, 0.6) });
    });
    B.cyl({ x: 3.65, y: 0.56, z: 0, r: 0.11, h: 2.05, axis: 'z', seg: 14, mat: matte(PAL.frame, 0.6) });
  }
};

/* -------------------------------------------------------------- たうえき */
MODEL3D.rice = {
  label: 'たうえき',
  build: function (B) {
    const COL = 0xe5544b, W = 1.90;

    /* からだ（水を ためた たんぼを すすむ）*/
    B.box({ x: 0.35, y: 0.86, z: 0, w: 2.30, h: 0.52, d: 1.20, r: 0.10, color: COL, part: 'body', rough: 0.3 });
    B.box({ x: 1.05, y: 1.24, z: 0, w: 0.95, h: 0.44, d: 1.00, r: 0.10, color: COL, part: 'body', rough: 0.3 });
    B.box({ x: 0.35, y: 0.52, z: 0, w: 2.60, h: 0.24, d: 1.34, r: 0.06, mat: matte(0x4a525f, 0.6), part: 'body' });

    /* まえの ライト と グリル */
    B.box({ x: 1.53, y: 1.24, z: 0, w: 0.05, h: 0.26, d: 0.72, r: 0.04, mat: matte(0x1e232b, 0.45) });
    [1, -1].forEach(sz => {
      B.lamp({ x: 1.55, y: 1.24, z: sz * 0.28, w: 0.05, h: 0.13, d: 0.17, color: 0xfff2cf, strength: 1.3, part: 'lamp' });
    });
    /* たんぼに しずまない ための そり（フロート） */
    [-0.72, 0, 0.72].forEach(pz => {
      B.box({ x: -0.90, y: 0.10, z: pz, w: 1.30, h: 0.07, d: 0.34, r: 0.04, mat: matte(0xdfe6ee, 0.6), part: 'body' });
    });

    /* ざせき と ハンドル */
    B.box({ x: -0.35, y: 1.20, z: 0, w: 0.60, h: 0.12, d: 0.62, r: 0.05, mat: matte(0x2f3640, 0.75), part: 'seat' });
    B.seam({ x: -0.35, y: 1.27, z: 0, w: 0.5, h: 0.02, d: 0.03, color: 0x232830 });
    B.box({ x: -0.62, y: 1.50, z: 0, w: 0.12, h: 0.52, d: 0.58, r: 0.05, mat: matte(0x2f3640, 0.75), part: 'seat' });
    B.mesh(new THREE.TorusGeometry(0.20, 0.028, 8, 22), matte(0x22262d, 0.6),
      { x: 0.42, y: 1.58, z: 0, ry: Math.PI / 2, rz: -0.5, part: 'seat' });
    B.cyl({ x: 0.55, y: 1.38, z: 0, r: 0.035, h: 0.42, seg: 8, tilt: -0.4, mat: metalMat(0x8f98a3, 0.4), part: 'seat' });

    /* ==== 上の ななめの たな（なえが たくさん のって いる）==== */
    const tray = new THREE.Group();
    tray.position.set(-1.20, 1.34, 0);
    tray.rotation.z = 0.46;                     /* ← ななめ */
    B.root.add(tray);
    B.box({ parent: tray, x: 0, y: 0, z: 0, w: 1.55, h: 0.08, d: 2.30, r: 0.03, mat: metalMat(0xc7ced7, 0.4), part: 'tray' });
    for (let k = -2; k <= 2; k++) {
      B.box({ parent: tray, x: 0, y: 0.10, z: k * 0.46, w: 1.50, h: 0.09, d: 0.38, r: 0.02, mat: matte(0x3c434e, 0.7), part: 'tray' });
      /* なえ（みどりの ふさ）*/
      for (let i = 0; i < 7; i++) {
        B.box({
          parent: tray, x: -0.62 + i * 0.21, y: 0.26, z: k * 0.46,
          w: 0.13, h: 0.26, d: 0.30, r: 0.04, mat: matte(0x4caf50, 0.85), part: 'tray'
        });
      }
    }
    [1, -1].forEach(sz => {
      B.box({ parent: tray, x: 0, y: 0.12, z: sz * 1.18, w: 1.55, h: 0.22, d: 0.06, r: 0.02, mat: metalMat(0xb9c0ca, 0.35), part: 'tray' });
    });

    /* ==== うしろの うえる つめ（なえを つまんでは さす）==== */
    const units = [];
    [-0.72, -0.24, 0.24, 0.72].forEach(pz => {
      const gg = new THREE.Group();
      gg.position.set(-1.85, 0.52, pz);
      B.root.add(gg);
      units.push(gg);
      B.box({ x: -1.85, y: 0.86, z: pz, w: 0.55, h: 0.34, d: 0.26, r: 0.05, color: COL, part: 'planter', rough: 0.3 });
      B.cyl({ parent: gg, x: 0, y: 0, z: 0, r: 0.09, h: 0.20, axis: 'z', seg: 12, mat: metalMat(0x8f98a3, 0.4), part: 'planter' });
      [0, 1].forEach(k => {
        const a = k * Math.PI;
        B.box({
          parent: gg, x: Math.cos(a) * 0.28, y: Math.sin(a) * 0.28, z: 0,
          w: 0.46, h: 0.09, d: 0.10, r: 0.02, rz: a, mat: metalMat(0xb9c0ca, 0.32), part: 'planter'
        });
        B.box({
          parent: gg, x: Math.cos(a) * 0.50, y: Math.sin(a) * 0.50, z: 0,
          w: 0.16, h: 0.14, d: 0.09, r: 0.02, rz: a, mat: metalMat(0xdfe4ea, 0.2), part: 'planter'
        });
      });
      B.spin.push({ obj: gg, axis: 'z', speed: 0 });
    });
    const i0 = B.spin.length - 4;
    B.anim('planter', 'つめを うごかして なえを うえる', v => {
      for (let i = 0; i < 4; i++) B.spin[i0 + i].speed = -v * 4.5;
    });
    /* うえた あとの なえ（地めんに ならぶ）*/
    [-0.72, -0.24, 0.24, 0.72].forEach(pz => {
      for (let i = 0; i < 3; i++) {
        B.box({ x: -2.40 - i * 0.55, y: 0.13, z: pz, w: 0.10, h: 0.26, d: 0.10, r: 0.03, mat: matte(0x4caf50, 0.85), part: 'planter' });
      }
    });

    /* たんぼを すすむ ための ひろい わ */
    B.wheel({ x: 0.95, r: 0.36, w: 0.22, spread: 0.66 });
    B.wheel({ x: -0.60, r: 0.46, w: 0.34, spread: 0.72 });
  }
};

/* ------------------------------------------------------------ ほそう車 */
MODEL3D.paver = {
  label: 'ほそう車',
  build: function (B) {
    const COL = 0xf0b21c, W = 2.40;

    crawlerTrack(B, { x: 0.35, len: 2.90, r: 0.36, w: 0.50, spread: 1.05, tooth: 0.04 });
    B.box({ x: 0.35, y: 0.72, z: 0, w: 3.20, h: 0.42, d: 1.95, r: 0.06, color: COL, part: 'body', rough: 0.3 });

    /* ==== 前の うける ところ（ダンプカーが あける アスファルトを こぼさず うけとめる）==== */
    const hop = new THREE.Group();
    hop.position.set(1.95, 0.80, 0);
    B.root.add(hop);
    B.box({ parent: hop, x: 0, y: 0.10, z: 0, w: 1.70, h: 0.14, d: W - 0.20, r: 0.04, mat: metalMat(0x8f98a3, 0.42), part: 'hopper' });
    const wings = [];
    [1, -1].forEach(sz => {
      const g = new THREE.Group();
      g.position.set(0, 0.10, sz * (W / 2 - 0.14));
      hop.add(g);
      wings.push({ g: g, sz: sz });
      B.mesh(sideProfileGeom([[-0.85, 0], [0.85, 0], [0.85, 0.62], [-0.85, 0.50]], 0.10, 0.06),
        paint(COL, { rough: 0.3 }), { parent: g, x: 0, y: 0, z: 0, part: 'hopper' });
    });
    B.box({ parent: hop, x: 0.85, y: 0.42, z: 0, w: 0.12, h: 0.62, d: W - 0.24, r: 0.04, color: COL, part: 'hopper', rough: 0.3 });
    /* うける ローラー（ダンプカーの タイヤが あたる）*/
    [1, -1].forEach(sz => {
      B.cyl({ parent: hop, x: 1.02, y: 0.02, z: sz * 0.62, r: 0.20, h: 0.42, axis: 'z', seg: 18, mat: metalMat(0x9099a5, 0.4), part: 'hopper' });
    });
    /* 中の アスファルト */
    B.box({ parent: hop, x: 0, y: 0.28, z: 0, w: 1.50, h: 0.20, d: W - 0.40, r: 0.03, mat: matte(0x2b2f36, 0.9), part: 'hopper' });

    /* うんてんする ところ（かんたんな 屋ねと ざせき）*/
    B.box({ x: -0.25, y: 1.02, z: 0, w: 1.55, h: 0.18, d: 1.90, r: 0.05, mat: matte(0x59616e, 0.6), part: 'body' });
    [1, -1].forEach(sz => {
      B.box({ x: -0.25, y: 1.36, z: sz * 0.60, w: 0.55, h: 0.14, d: 0.55, r: 0.05, mat: matte(0x2f3640, 0.75), part: 'body' });
      B.box({ x: -0.52, y: 1.62, z: sz * 0.60, w: 0.12, h: 0.44, d: 0.52, r: 0.05, mat: matte(0x2f3640, 0.75), part: 'body' });
    });
    [[0.45, 0.85], [0.45, -0.85], [-1.00, 0.85], [-1.00, -0.85]].forEach(([px, pz]) => {
      B.box({ x: px, y: 1.75, z: pz, w: 0.08, h: 1.35, d: 0.08, r: 0.03, mat: matte(0x3c434e, 0.55), part: 'body' });
    });
    B.box({ x: -0.28, y: 2.46, z: 0, w: 1.70, h: 0.10, d: 1.90, r: 0.05, color: COL, part: 'body', rough: 0.4 });
    B.lamp({ x: 0.40, y: 2.40, z: 0.72, w: 0.14, h: 0.10, d: 0.22, color: PAL.lampY, strength: 1.4, part: 'lamp' });
    /* マフラー・そうさばん・てすり */
    B.cyl({ x: 0.85, y: 1.55, z: -0.75, r: 0.075, h: 0.85, axis: 'y', seg: 12, mat: metalMat(0x9aa3ae, 0.35), part: 'body' });
    B.cyl({ x: 0.85, y: 2.02, z: -0.75, r: 0.045, h: 0.16, axis: 'y', seg: 8, mat: matte(0x3a414b, 0.5), part: 'body' });
    [1, -1].forEach(sz => {
      B.box({ x: 0.15, y: 1.42, z: sz * 0.60, w: 0.30, h: 0.16, d: 0.34, r: 0.04, mat: matte(0x3a414b, 0.5), part: 'body' });
      B.cyl({ x: 0.18, y: 1.58, z: sz * 0.52, r: 0.016, h: 0.22, axis: 'y', tilt: 0.3, seg: 6, mat: matte(0x22262d, 0.5), part: 'body' });
      B.cyl({ x: 0.98, y: 1.32, z: sz * 0.92, r: 0.022, h: 0.55, axis: 'y', seg: 8, mat: metalMat(0xd8dee6, 0.3), aux: true });
    });

    /* ==== うしろの ながい いた（アスファルトを おしつけながら すすむ）==== */
    const scr = new THREE.Group();
    scr.position.set(-1.85, 0.34, 0);
    B.root.add(scr);
    B.box({ parent: scr, x: 0, y: 0, z: 0, w: 0.85, h: 0.34, d: W - 0.10, r: 0.04, mat: metalMat(0xb0b8c2, 0.3), part: 'screed' });
    B.box({ parent: scr, x: 0.10, y: 0.36, z: 0, w: 0.75, h: 0.38, d: W - 0.06, r: 0.05, color: COL, part: 'screed', rough: 0.3 });
    B.box({ parent: scr, x: 0.10, y: 0.62, z: 0, w: 0.60, h: 0.14, d: W + 0.02, r: 0.04, mat: matte(0x3c434e, 0.6), part: 'screed' });
    /* よこへ ひろがる ぶぶん */
    const ext = [];
    [1, -1].forEach(sz => {
      const g = new THREE.Group();
      scr.add(g);
      ext.push({ g: g, sz: sz });
      B.box({ parent: g, x: 0, y: -0.01, z: sz * (W / 2 + 0.22), w: 0.80, h: 0.30, d: 0.70, r: 0.03, mat: metalMat(0xc3cad3, 0.3), part: 'screed' });
      B.box({ parent: g, x: 0.10, y: 0.34, z: sz * (W / 2 + 0.22), w: 0.70, h: 0.32, d: 0.66, r: 0.04, color: COL, part: 'screed', rough: 0.3 });
    });
    /* いたを つなぐ うで */
    [1, -1].forEach(sz => {
      B.box({ x: -1.10, y: 0.62, z: sz * 0.80, w: 1.60, h: 0.14, d: 0.14, r: 0.04, mat: matte(0x59616e, 0.55), part: 'screed' });
    });
    /* ならされた あたらしい どうろ */
    B.box({ x: -3.55, y: 0.035, z: 0, w: 2.90, h: 0.07, d: W + 1.10, r: 0.01, mat: matte(0x33383f, 0.92), part: 'screed' });

    B.anim('screed', 'いたを よこへ ひろげる', v => {
      ext.forEach(e => { e.g.position.z = e.sz * v * 0.50; });
      wings.forEach(w => { w.g.rotation.x = -w.sz * (1 - v) * 0.85; });
    });
    B.anims[B.anims.length - 1].target = 1;
    B.anims[B.anims.length - 1].value = 1;
    B.anims[B.anims.length - 1].apply(1);
  }
};

/* ---------------------------------------------------------- くさかり車 */
MODEL3D.mower = {
  label: 'くさかり車',
  build: function (B) {
    const COL = 0xf0b21c;

    /* トラクターの ような からだ */
    B.box({ x: 0.95, y: 1.14, z: 0, w: 1.75, h: 0.80, d: 1.05, r: 0.14, color: COL, part: 'body', rough: 0.3 });
    B.box({ x: 0.95, y: 0.74, z: 0, w: 1.60, h: 0.40, d: 0.82, r: 0.08, mat: matte(0x3c434e, 0.6), part: 'body' });
    B.box({ x: 1.84, y: 1.12, z: 0, w: 0.10, h: 0.58, d: 0.95, r: 0.06, mat: matte(0x1e232b, 0.45) });
    for (let i = -2; i <= 2; i++) {
      B.box({ x: 1.875, y: 1.12, z: i * 0.16, w: 0.03, h: 0.52, d: 0.035, r: 0.012, mat: metalMat(0xaeb7c2, 0.3) });
    }
    [1, -1].forEach(sz => {
      B.lamp({ x: 1.88, y: 1.36, z: sz * 0.36, w: 0.06, h: 0.16, d: 0.22, color: 0xfff2cf, strength: 1.4, part: 'lamp' });
    });
    B.cyl({ x: 1.45, y: 1.75, z: 0.38, r: 0.055, h: 0.55, seg: 10, mat: metalMat(0x8d959f, 0.4), part: 'body' });
    /* うんてんせき */
    const cbot = 1.30, ctop = 2.82;
    B.box({ x: -0.50, y: (ctop + cbot) / 2, z: 0, w: 1.40, h: ctop - cbot, d: 1.50, r: 0.16, b: 0.045, color: COL, part: 'cab', rough: 0.28 });
    B.glass({ x: 0.18, y: (ctop + cbot) / 2 + 0.10, z: 0, w: 0.09, h: (ctop - cbot) * 0.68, d: 1.26, r: 0.07, rz: -0.12, part: 'window' });
    [1, -1].forEach(sz => {
      B.glass({ x: -0.55, y: (ctop + cbot) / 2 + 0.10, z: sz * 0.73, w: 1.06, h: (ctop - cbot) * 0.60, d: 0.07, r: 0.06, part: 'window' });
    });
    B.glass({ x: -1.18, y: (ctop + cbot) / 2 + 0.08, z: 0, w: 0.08, h: (ctop - cbot) * 0.62, d: 1.26, r: 0.07, part: 'window' });
    B.box({ x: -0.50, y: ctop + 0.09, z: 0, w: 1.50, h: 0.12, d: 1.58, r: 0.06, color: 0xe8ecf1, part: 'cab', rough: 0.4 });
    /* とびら・ハンドル・ミラー・ワイパー・かいてんとう */
    B.seam({ x: -1.02, y: (ctop + cbot) / 2 - 0.10, z: -0.755, w: 0.024, h: (ctop - cbot) * 0.70, d: 0.03, part: 'cab' });
    doorHandle(B, { x: -0.82, y: (ctop + cbot) / 2 - 0.28, z: -0.760, s: -1, len: 0.20 });
    [1, -1].forEach(sz => {
      B.cyl({ x: 0.20, y: ctop - 0.30, z: sz * 0.80, r: 0.016, h: 0.24, axis: 'z', seg: 8, mat: metalMat(0x9aa3ae, 0.35), aux: true });
      B.box({ x: 0.20, y: ctop - 0.40, z: sz * 0.96, w: 0.07, h: 0.24, d: 0.10, r: 0.03, mat: matte(0x2a2f38, 0.5), aux: true });
    });
    wipers(B, { x: 0.23, y: (ctop + cbot) / 2 - 0.24, z: 0, rz: -0.12, len: 0.40, n: 1, a: 0.8 });
    B.lamp({ x: -1.10, y: ctop + 0.18, z: 0, w: 0.13, h: 0.12, d: 0.13, color: 0xffa63d, strength: 1.2, aux: true });

    B.wheel({ x: 1.20, r: 0.44, w: 0.30, spread: 0.70 });
    B.wheel({ x: -0.80, r: 0.80, w: 0.48, spread: 0.84 });
    [1, -1].forEach(sz => {
      B.mesh(curvedPlateGeom(0.94, 0.06, 0.62, 2.52, 0.56, 16), paint(COL, { rough: 0.34 }),
        { x: -0.80, y: 0.80, z: sz * 0.86, part: 'body' });
    });

    /* ==== よこへ のびる うでの さきの、まわる は ==== */
    const arm = new THREE.Group();
    arm.position.set(-1.35, 1.55, 0.55);
    B.root.add(arm);
    B.cyl({ parent: arm, x: 0, y: 0, z: 0, r: 0.20, h: 0.50, axis: 'x', seg: 18, mat: metalMat(0x9aa3ae, 0.4), part: 'cutter' });
    B.box({ parent: arm, x: 0, y: 0, z: 0.95, w: 0.30, h: 0.28, d: 1.90, r: 0.06, color: COL, part: 'cutter', rough: 0.32 });
    const arm2 = new THREE.Group();
    arm2.position.set(0, 0, 1.85);
    arm.add(arm2);
    B.box({ parent: arm2, x: 0, y: 0, z: 0.80, w: 0.24, h: 0.22, d: 1.60, r: 0.05, mat: paint(0xf6c44a, { rough: 0.32 }), part: 'cutter' });
    B.cyl({ parent: arm2, x: 0, y: 0, z: 0, r: 0.15, h: 0.40, axis: 'x', seg: 16, mat: metalMat(0x9aa3ae, 0.4), part: 'cutter' });

    /* は の あたま（カバーで すっぽり かこって ある）*/
    const headG = new THREE.Group();
    headG.position.set(0, 0, 1.55);
    arm2.add(headG);
    /* すすむ むきに ながい あたま（は の まわりを すっぽり かこう カバー）*/
    B.box({ parent: headG, x: 0, y: 0.10, z: 0, w: 1.55, h: 0.56, d: 0.86, r: 0.12, mat: paint(0xe5544b, { rough: 0.32 }), part: 'guard' });
    B.box({ parent: headG, x: 0, y: 0.42, z: 0, w: 1.40, h: 0.12, d: 0.72, r: 0.05, mat: paint(0xc4372f, { rough: 0.34 }), part: 'guard' });
    /* とんで こない ように たれさがる ゴムの カバー */
    for (let i = -3; i <= 3; i++) {
      B.box({ parent: headG, x: i * 0.22, y: -0.24, z: 0.44, w: 0.19, h: 0.36, d: 0.05, r: 0.02, mat: matte(0x2b3038, 0.85), part: 'guard' });
      B.box({ parent: headG, x: i * 0.22, y: -0.24, z: -0.44, w: 0.19, h: 0.36, d: 0.05, r: 0.02, mat: matte(0x2b3038, 0.85), part: 'guard' });
    }
    /* ぐるぐる まわる は */
    const rotor = new THREE.Group();
    rotor.position.set(0, -0.06, 0);
    headG.add(rotor);
    B.cyl({ parent: rotor, x: 0, y: 0, z: 0, r: 0.13, h: 1.35, axis: 'x', seg: 14, mat: metalMat(0x8f98a3, 0.4), part: 'cutter' });
    for (let k = 0; k < 6; k++) {
      const a = k / 6 * Math.PI * 2;
      for (let i = -2; i <= 2; i++) {
        B.box({
          parent: rotor, x: i * 0.27, y: Math.sin(a) * 0.24, z: Math.cos(a) * 0.24,
          w: 0.07, h: 0.26, d: 0.06, r: 0.02, rx: -a, mat: metalMat(0xc8cfd8, 0.28), part: 'cutter'
        });
      }
    }
    B.spin.push({ obj: rotor, axis: 'x', speed: 0 });
    const si = B.spin.length - 1;

    B.anim('cutter', 'うでを 出して はを まわす', v => {
      arm.rotation.x = -v * 0.55;                    /* よこへ ひろげる */
      arm2.rotation.x = -v * 0.42;
      headG.rotation.x = v * 0.62;                   /* 土手の ななめに 合わせる */
      B.spin[si].speed = v * 9.0;
    });
  }
};


/* ---------------- コンテナ（みなとの 車に つかう）---------------- */
function containerBox(B, o) {
  const g = new THREE.Group();
  g.position.set(o.x, o.y, o.z || 0);
  if (o.ry) g.rotation.y = o.ry;
  (o.parent || B.root).add(g);
  const L = o.len || 6.0, H = o.h || 2.55, W = o.w || 2.40;
  B.box({ parent: g, x: 0, y: 0, z: 0, w: L, h: H, d: W, r: 0.05, mat: paint(o.color, { metal: 0.3, rough: 0.4 }), part: o.part });
  /* なみなみの もよう */
  const nRib = Math.max(4, Math.round((L - 0.6) / 0.42));
  [1, -1].forEach(sz => {
    for (let i = 0; i <= nRib; i++) {
      B.box({
        parent: g, x: -(L - 0.6) / 2 + i * ((L - 0.6) / nRib), y: 0, z: sz * (W / 2 + 0.012),
        w: 0.16, h: H - 0.26, d: 0.03, r: 0.01, mat: paint(o.color, { metal: 0.3, rough: 0.5 }), part: o.part
      });
    }
  });
  /* 四すみの あな（ここに わくが はまる）*/
  [[1, 1], [1, -1], [-1, 1], [-1, -1]].forEach(([sx, sz]) => {
    [1, -1].forEach(sy => {
      B.box({
        parent: g, x: sx * (L / 2 - 0.14), y: sy * (H / 2 - 0.12), z: sz * (W / 2 - 0.12),
        w: 0.26, h: 0.22, d: 0.22, r: 0.03, mat: matte(0x3c434e, 0.6), part: o.part
      });
    });
  });
  B.box({ parent: g, x: -L / 2 - 0.02, y: 0, z: 0, w: 0.06, h: H - 0.16, d: W - 0.16, r: 0.03, mat: paint(0xdfe6ee, { rough: 0.45 }), part: o.part });
  return g;
}

/* ---------------------------------------------------------- タラップ車 */
MODEL3D.stairs = {
  label: 'タラップ車',
  build: function (B) {
    const COL = 0xf5f7fa, ACC = 0x2f7fd0, W = 2.20;

    chassis(B, { x: -0.4, y: 0.72, len: 6.0, spread: 0.40 });
    truckCab(B, { x: 2.15, len: 1.70, w: W, top: 2.62, floor: 0.78, color: ACC });

    /* かいだんを ささえる 台 */
    B.box({ x: -1.10, y: 1.00, z: 0, w: 4.10, h: 0.36, d: W, r: 0.06, color: ACC, part: 'lift', rough: 0.3 });
    /* まっすぐ 上へ のびる はしら */
    [1, -1].forEach(sz => {
      B.box({ x: -0.35, y: 1.55, z: sz * (W / 2 - 0.18), w: 0.20, h: 0.90, d: 0.20, r: 0.04, mat: matte(0x59616e, 0.55), part: 'lift' });
      B.box({ x: -2.55, y: 1.55, z: sz * (W / 2 - 0.18), w: 0.20, h: 0.90, d: 0.20, r: 0.04, mat: matte(0x59616e, 0.55), part: 'lift' });
    });

    /* ==== うしろの ながい かいだん（ぜんたいが 上下する）====
       よこ顔を ぎざぎざに して 一まいで つくると、だんだんが はっきり 出る */
    const st = new THREE.Group();
    st.position.set(-0.35, 1.20, 0);
    B.root.add(st);
    const N = 10, RUN = 0.34, RISE = 0.27;
    const pts = [[0, 0]];
    for (let i = 1; i <= N; i++) {
      pts.push([-(i - 1) * RUN, i * RISE]);
      pts.push([-i * RUN, i * RISE]);
    }
    pts.push([-N * RUN - 0.10, N * RISE - 0.50]);
    pts.push([0, -0.50]);
    [1, -1].forEach(sz => {
      B.mesh(sideProfileGeom(pts, 0.16, 0.035), paint(ACC, { rough: 0.3 }),
        { parent: st, x: 0, y: 0, z: sz * (W / 2 - 0.14), part: 'stairs' });
      /* 手すり */
      B.box({
        parent: st, x: -(N * RUN) / 2, y: N * RISE / 2 + 0.98, z: sz * (W / 2 - 0.12),
        w: Math.hypot(N * RUN, N * RISE) + 0.40, h: 0.10, d: 0.10, r: 0.03,
        rz: Math.atan2(RISE, RUN), mat: metalMat(0xb9c0ca, 0.3), part: 'stairs'
      });
      for (let i = 0; i <= N; i += 2) {
        B.box({
          parent: st, x: -i * RUN, y: i * RISE + 0.52, z: sz * (W / 2 - 0.12),
          w: 0.08, h: 1.05, d: 0.08, r: 0.03, mat: metalMat(0xb9c0ca, 0.3), part: 'stairs'
        });
      }
    });
    /* ふむ ところ（すべりどめの 板）*/
    for (let i = 1; i <= N; i++) {
      B.box({
        parent: st, x: -(i - 0.5) * RUN, y: i * RISE + 0.03, z: 0,
        w: RUN + 0.04, h: 0.05, d: W - 0.34, r: 0.02, mat: metalMat(0xdfe4ea, 0.28), part: 'stairs'
      });
    }
    /* いちばん 上の 平ら（ひこうきの 入口に つく）*/
    const top = new THREE.Group();
    top.position.set(-N * RUN - 0.62, N * RISE, 0);
    st.add(top);
    B.box({ parent: top, x: 0, y: 0.02, z: 0, w: 1.30, h: 0.12, d: W - 0.14, r: 0.04, mat: metalMat(0xc3cad3, 0.35), part: 'stairs' });
    [1, -1].forEach(sz => {
      B.box({ parent: top, x: 0, y: 0.58, z: sz * (W / 2 - 0.12), w: 1.30, h: 0.10, d: 0.10, r: 0.03, mat: metalMat(0xb9c0ca, 0.3), part: 'stairs' });
      B.box({ parent: top, x: -0.60, y: 0.32, z: sz * (W / 2 - 0.12), w: 0.08, h: 1.05, d: 0.08, r: 0.03, mat: metalMat(0xb9c0ca, 0.3), part: 'stairs' });
      B.box({ parent: top, x: 0.60, y: 0.32, z: sz * (W / 2 - 0.12), w: 0.08, h: 1.05, d: 0.08, r: 0.03, mat: metalMat(0xb9c0ca, 0.3), part: 'stairs' });
    });
    B.box({ parent: top, x: -0.62, y: 0.36, z: 0, w: 0.14, h: 1.10, d: W - 0.10, r: 0.05, color: ACC, part: 'stairs', rough: 0.35 });

    B.anim('lift', 'かいだんを 上げる', v => {
      st.position.y = 1.20 + v * 1.55;
    });

    /* くうこうの 車らしい かいてんとう・ランプ・ナンバー */
    B.lamp({ x: 2.15, y: 2.80, z: 0, w: 0.16, h: 0.14, d: 0.16, color: 0xffa63d, strength: 1.5, aux: true });
    tailLamps(B, { x: -3.14, y: 0.72, zOff: W / 2 - 0.38 });
    plate(B, { x: -3.14, y: 0.72, z: 0, axis: 'x-' });
    [1, -1].forEach(sz => {
      B.lamp({ x: -1.0, y: 0.86, z: sz * (W / 2 + 0.012), w: 0.08, h: 0.055, d: 0.03, color: 0xffa63d, strength: 0.7, aux: true });
    });

    B.wheel({ x: 1.95, r: 0.42, w: 0.26, spread: 0.90 });
    B.wheel({ x: -2.05, r: 0.42, w: 0.26, spread: 0.90 });
    wheelArch(B, { x: 1.95, r: 0.42, spread: 0.90, w: 0.40 });
    wheelArch(B, { x: -2.05, r: 0.42, spread: 0.90, w: 0.40 });
  }
};

/* -------------------------------------------------- ハイリフトローダー */
MODEL3D.cargoloader = {
  label: 'ハイリフトローダー',
  build: function (B) {
    const COL = 0xf0b21c, W = 2.90, BASE = 0.72;

    /* ひくい からだ */
    B.box({ x: 0, y: 0.44, z: 0, w: 6.20, h: 0.44, d: W, r: 0.08, color: COL, part: 'deck', rough: 0.3 });
    [1, -1].forEach(sz => {
      B.box({ x: 0, y: 0.62, z: sz * (W / 2 + 0.012), w: 6.00, h: 0.18, d: 0.02, r: 0.01, mat: paint(0x1b2028, { rough: 0.3 }) });
    });
    /* すみの うんてんせき */
    B.box({ x: -2.05, y: 1.35, z: -1.05, w: 1.10, h: 1.30, d: 0.80, r: 0.12, color: COL, part: 'deck', rough: 0.3 });
    B.glass({ x: -1.52, y: 1.52, z: -1.05, w: 0.08, h: 0.66, d: 0.62, r: 0.06, part: 'window' });
    B.box({ x: -2.05, y: 2.06, z: -1.05, w: 1.16, h: 0.10, d: 0.88, r: 0.05, color: COL, part: 'deck', rough: 0.4 });
    B.mesh(new THREE.TorusGeometry(0.18, 0.026, 8, 20), matte(0x22262d, 0.6),
      { x: -1.68, y: 1.42, z: -1.05, ry: Math.PI / 2, rz: -0.5 });
    wipers(B, { x: -1.49, y: 1.30, z: -1.05, len: 0.30, n: 1, a: 0.7 });
    B.lamp({ x: -2.05, y: 2.18, z: -1.05, w: 0.14, h: 0.13, d: 0.14, color: 0xffa63d, strength: 1.5, aux: true });
    /* まえと うしろの ライト・てすり */
    [1, -1].forEach(sx => {
      [1, -1].forEach(sz => {
        B.lamp({ x: sx * 3.06, y: 0.52, z: sz * (W / 2 - 0.30), w: 0.05, h: 0.12, d: 0.20, color: sx > 0 ? 0xfff2cf : PAL.lampR, strength: 1.1, part: 'lamp' });
      });
    });
    B.cyl({ x: -2.62, y: 1.10, z: -1.05, r: 0.022, h: 0.85, axis: 'y', seg: 8, mat: metalMat(0xd8dee6, 0.3), aux: true });

    /* ==== ころ の ならんだ ゆか（2まい）==== */
    const decks = [];
    [[1.55, 2.60], [-1.60, 2.40]].forEach(([dx, dlen], k) => {
      const d = new THREE.Group();
      d.position.set(dx, BASE, 0);
      B.root.add(d);
      decks.push(d);
      B.box({ parent: d, x: 0, y: 0, z: 0, w: dlen, h: 0.14, d: W - 0.30, r: 0.04, mat: metalMat(0x9aa3ae, 0.4), part: 'deck' });
      /* おもい にもつを すべらせて おせる まるい ころ */
      const n = Math.round(dlen / 0.36);
      for (let i = 0; i < n; i++) {
        B.cyl({
          parent: d, x: -dlen / 2 + 0.20 + i * ((dlen - 0.40) / (n - 1)), y: 0.12, z: 0,
          r: 0.09, h: W - 0.44, axis: 'z', seg: 16, mat: metalMat(0xc8cfd8, 0.22), part: 'roller'
        });
      }
      [1, -1].forEach(sz => {
        B.box({ parent: d, x: 0, y: 0.14, z: sz * (W / 2 - 0.16), w: dlen, h: 0.16, d: 0.08, r: 0.03, color: COL, part: 'deck', rough: 0.3 });
      });
      /* もち上げる はさみの ような わく */
      const sc = [];
      [1, -1].forEach(sz => {
        [1, -1].forEach(dir => {
          const g = new THREE.Group();
          g.position.set(0, -0.30, sz * (W / 2 - 0.55));
          B.root.add(g);
          g.userData.dx = dx;
          sc.push({ g: g, dir: dir, sz: sz });
          B.box({ parent: g, x: 0, y: 0, z: 0, w: 2.10, h: 0.13, d: 0.11, r: 0.03, mat: metalMat(0x8f98a3, 0.4), part: 'deck' });
        });
      });
      d.userData.sc = sc;
      d.userData.dx = dx;
    });

    B.anim('deck', 'ゆかを もち上げる', v => {
      decks.forEach((d, k) => {
        const a = THREE.MathUtils.lerp(0.10, 0.92, k === 0 ? v : v * 0.72);
        const h = Math.sin(a) * 2.10;
        d.position.y = BASE + h;
        d.userData.sc.forEach(x => {
          x.g.rotation.z = x.dir * a;
          x.g.position.set(d.userData.dx, BASE + h / 2 - 0.14, x.sz * (W / 2 - 0.55));
        });
      });
    });

    /* はこぶ にもつ（ゆかに のって いっしょに 上がる）*/
    B.box({ parent: decks[0], x: 0, y: 0.98, z: 0, w: 1.85, h: 1.60, d: 1.90, r: 0.06, mat: paint(0xdfe6ee, { rough: 0.45 }), part: 'deck' });
    B.box({ parent: decks[0], x: 0, y: 0.22, z: 0, w: 1.95, h: 0.12, d: 2.00, r: 0.03, mat: matte(0x8f6a3f, 0.8), part: 'deck' });

    B.wheel({ x: 2.35, r: 0.40, w: 0.34, spread: 1.15 });
    B.wheel({ x: -2.35, r: 0.40, w: 0.34, spread: 1.15 });
  }
};

/* ---------------------------------------------------- リーチスタッカー */
MODEL3D.stacker = {
  label: 'リーチスタッカー',
  build: function (B) {
    const COL = 0xe5544b, W = 3.10;

    /* おもい からだ */
    B.box({ x: -1.35, y: 1.35, z: 0, w: 6.20, h: 1.10, d: W, r: 0.14, color: COL, part: 'body', rough: 0.3 });
    B.box({ x: -4.05, y: 1.10, z: 0, w: 1.00, h: 1.55, d: W - 0.20, r: 0.12, mat: paint(0xb03b28, { rough: 0.4 }), part: 'body' });
    B.box({ x: 0.85, y: 1.05, z: 0, w: 1.20, h: 0.62, d: W - 0.40, r: 0.08, color: COL, part: 'body', rough: 0.3 });

    /* うんてんせき（よこに つき出て いる）*/
    const cbot = 2.00, ctop = 3.70;
    B.box({ x: -0.55, y: (ctop + cbot) / 2, z: 1.15, w: 1.60, h: ctop - cbot, d: 1.35, r: 0.14, b: 0.045, color: COL, part: 'cab', rough: 0.28 });
    B.glass({ x: 0.22, y: (ctop + cbot) / 2 + 0.10, z: 1.15, w: 0.08, h: (ctop - cbot) * 0.70, d: 1.15, r: 0.07, rz: -0.10, part: 'window' });
    B.glass({ x: -0.60, y: (ctop + cbot) / 2 + 0.10, z: 1.15 + 0.62, w: 1.25, h: (ctop - cbot) * 0.62, d: 0.07, r: 0.06, part: 'window' });
    B.glass({ x: -0.60, y: (ctop + cbot) / 2 + 0.10, z: 1.15 - 0.62, w: 1.25, h: (ctop - cbot) * 0.62, d: 0.07, r: 0.06, part: 'window' });
    B.box({ x: -0.55, y: ctop + 0.08, z: 1.15, w: 1.68, h: 0.11, d: 1.44, r: 0.06, color: 0xe8ecf1, part: 'cab', rough: 0.4 });
    /* とびら・ハンドル・ミラー・ワイパー・かいてんとう */
    B.seam({ x: -1.10, y: (ctop + cbot) / 2 - 0.10, z: 1.828, w: 0.024, h: (ctop - cbot) * 0.68, d: 0.03, part: 'cab' });
    doorHandle(B, { x: -0.90, y: (ctop + cbot) / 2 - 0.30, z: 1.833, s: 1, len: 0.20 });
    B.cyl({ x: 0.24, y: ctop - 0.28, z: 1.95, r: 0.016, h: 0.26, axis: 'z', seg: 8, mat: metalMat(0x9aa3ae, 0.35), aux: true });
    B.box({ x: 0.24, y: ctop - 0.38, z: 2.10, w: 0.07, h: 0.26, d: 0.11, r: 0.03, mat: matte(0x2a2f38, 0.5), aux: true });
    wipers(B, { x: 0.27, y: (ctop + cbot) / 2 - 0.26, z: 1.15, rz: -0.10, len: 0.45, n: 1, a: 0.8 });
    B.lamp({ x: -1.20, y: ctop + 0.18, z: 1.15, w: 0.13, h: 0.13, d: 0.13, color: 0xffa63d, strength: 1.3, aux: true });
    /* のぼる かいだん・マフラー・カウンターウェイトの みぞ */
    [0.55, 1.05, 1.55].forEach((sy, i) => {
      B.box({ x: -0.40 - i * 0.10, y: sy, z: 1.55, w: 0.38, h: 0.05, d: 0.28, r: 0.02, mat: matte(0x30363f, 0.62) });
    });
    B.cyl({ x: -0.42, y: 1.30, z: 1.68, r: 0.022, h: 1.50, axis: 'y', seg: 8, mat: metalMat(0xd8dee6, 0.3), aux: true });
    B.cyl({ x: -3.30, y: 2.25, z: -1.10, r: 0.09, h: 0.75, axis: 'y', seg: 12, mat: metalMat(0x9aa3ae, 0.35), part: 'body' });
    B.seam({ x: -4.05, y: 1.55, z: 1.46, w: 0.7, h: 0.03, d: 0.03, color: 0x7d2a1d });
    B.seam({ x: -4.05, y: 1.55, z: -1.46, w: 0.7, h: 0.03, d: 0.03, color: 0x7d2a1d });
    /* まえと うしろの ライト */
    [1, -1].forEach(sz => {
      B.lamp({ x: 1.48, y: 1.20, z: sz * (W / 2 - 0.35), w: 0.06, h: 0.14, d: 0.22, color: 0xfff2cf, strength: 1.3, part: 'lamp' });
      B.lamp({ x: -4.56, y: 1.35, z: sz * (W / 2 - 0.40), w: 0.05, h: 0.16, d: 0.24, color: PAL.lampR, strength: 1.0, aux: true });
    });

    /* ==== ななめに のびる じょうぶな うで ==== */
    const pivot = new THREE.Group();
    pivot.position.set(-3.40, 1.95, 0);
    B.root.add(pivot);
    B.cyl({ x: -3.40, y: 1.95, z: 0, r: 0.42, h: 1.55, axis: 'z', seg: 22, mat: metalMat(0x9aa3ae, 0.4), part: 'arm' });
    B.box({ parent: pivot, x: 3.30, y: 0, z: 0, w: 6.80, h: 0.95, d: 1.10, r: 0.14, color: COL, part: 'arm', rough: 0.3 });
    const ext = new THREE.Group();
    ext.position.set(6.40, 0, 0);
    pivot.add(ext);
    B.box({ parent: ext, x: 2.40, y: 0, z: 0, w: 5.20, h: 0.76, d: 0.88, r: 0.12, mat: paint(0xef7127, { rough: 0.32 }), part: 'arm' });
    /* うでを おこす シリンダー */
    const ram = new THREE.Group();
    ram.position.set(-2.10, 1.30, 0);
    B.root.add(ram);
    [1, -1].forEach(sz => {
      B.cyl({ parent: ram, x: 1.15, y: 0, z: sz * 0.72, r: 0.20, h: 2.20, axis: 'x', seg: 18, mat: matte(0x59616e, 0.5), part: 'arm' });
      B.cyl({ parent: ram, x: 2.60, y: 0, z: sz * 0.72, r: 0.115, h: 1.30, axis: 'x', seg: 14, mat: metalMat(0xdfe4ea, 0.13), part: 'arm' });
    });

    /* ==== さきの わく（四すみの あなに はまって かちっと とまる）==== */
    const tip = new THREE.Group();
    tip.position.set(4.90, 0, 0);
    ext.add(tip);
    const spread = new THREE.Group();
    tip.add(spread);
    B.box({ parent: spread, x: 0, y: -0.55, z: 0, w: 0.55, h: 0.45, d: 2.30, r: 0.06, mat: metalMat(0x8f98a3, 0.4), part: 'spreader' });
    B.box({ parent: spread, x: 0, y: -0.95, z: 0, w: 6.30, h: 0.34, d: 0.42, r: 0.05, mat: paint(0xf5c433, { rough: 0.32 }), part: 'spreader' });
    [1, -1].forEach(sx => {
      B.box({ parent: spread, x: sx * 3.00, y: -0.95, z: 0, w: 0.36, h: 0.42, d: 2.36, r: 0.05, mat: paint(0xf5c433, { rough: 0.32 }), part: 'spreader' });
      [1, -1].forEach(sz => {
        /* あなに はまる つめ */
        B.cyl({ parent: spread, x: sx * 3.00, y: -1.24, z: sz * 1.06, r: 0.11, h: 0.30, seg: 12, mat: metalMat(0xdfe4ea, 0.2), part: 'spreader' });
      });
    });

    /* つみ上げて ある コンテナ（四つぶんの 高さ）*/
    [0, 1, 2, 3].forEach(k => {
      containerBox(B, {
        x: 10.20, y: 1.30 + k * 2.62, z: 0, len: 6.05, h: 2.55, w: 2.38,
        color: [0xe5544b, 0x2b9c68, 0xf0b21c, 0x9aa3ae][k], part: 'spreader'
      });
    });

    const pose = v => {
      pivot.rotation.z = THREE.MathUtils.lerp(0.16, 0.72, v);
      ext.position.x = 6.40 + v * 2.90;
      spread.rotation.z = -pivot.rotation.z;
      ram.rotation.z = v * 0.22;
      ram.scale.x = 1 + v * 0.26;
    };
    pose(0);
    B.anim('arm', 'うでを のばして つみ上げる', pose);

    /* 大きな タイヤ */
    B.wheel({ x: -2.60, r: 0.95, w: 0.62, z: 1.20 });
    B.wheel({ x: -2.60, r: 0.95, w: 0.62, z: -1.20 });
    B.wheel({ x: -2.60, r: 0.95, w: 0.62, z: 0.55 });
    B.wheel({ x: -2.60, r: 0.95, w: 0.62, z: -0.55 });
    B.wheel({ x: 1.20, r: 0.80, w: 0.48, spread: 1.20 });
  }
};

/* ---------------------------------------------------------- きゅうゆ車 */
MODEL3D.fueler = {
  label: 'きゅうゆ車',
  build: function (B) {
    const COL = 0xdfe6ee, ACC = 0x2f6fbf, W = 2.44;

    chassis(B, { x: -0.6, y: 0.90, len: 9.4, spread: 0.44, tank: { x: 1.55, z: 1.02 } });
    truckCab(B, { x: 3.70, len: 2.20, w: W, top: 3.06, floor: 0.96, color: ACC });

    /* ドラムかん 何百本ぶんもの あぶらを ためる ながい タンク */
    const prof = [
      [0.03, -3.40], [0.60, -3.36], [0.95, -3.18], [1.10, -2.85],
      [1.16, -2.30], [1.18, 0], [1.16, 2.30], [1.10, 2.85],
      [0.95, 3.18], [0.60, 3.36], [0.03, 3.40]
    ].map(p => new THREE.Vector2(p[0], p[1]));
    const g = new THREE.LatheGeometry(prof, 44);
    g.computeVertexNormals();
    B.mesh(g, metalMat(0xd7dde5, 0.20), { x: -1.05, y: 2.20, z: 0, rz: Math.PI / 2, part: 'tank' });
    [-2.1, -0.7, 0.7, 2.1].forEach(dx => {
      B.mesh(new THREE.TorusGeometry(1.19, 0.055, 10, 34), metalMat(0x9aa3ae, 0.32),
        { x: -1.05 + dx, y: 2.20, z: 0, ry: Math.PI / 2, part: 'tank' });
    });
    [1, -1].forEach(sz => {
      B.box({ x: -1.05, y: 2.20, z: sz * (W / 2 - 0.10), w: 6.20, h: 0.30, d: 0.05, r: 0.02, mat: paint(ACC, { rough: 0.3 }), part: 'tank' });
      B.box({ x: -0.60, y: 1.30, z: sz * (W / 2 - 0.12), w: 2.30, h: 0.88, d: 0.30, r: 0.06, color: ACC, part: 'tank', rough: 0.32 });
    });
    B.box({ x: -4.35, y: 2.05, z: 0, w: 0.24, h: 1.30, d: W - 0.40, r: 0.06, mat: metalMat(0xb9c0ca, 0.3), part: 'tank' });

    /* ==== つばさの 高さまで とどく、人の のる 台 ==== */
    const plat = new THREE.Group();
    plat.position.set(1.05, 3.50, 0);
    B.root.add(plat);
    B.box({ parent: plat, x: 0, y: 0, z: 0, w: 1.70, h: 0.10, d: 1.60, r: 0.04, mat: metalMat(0xc3cad3, 0.35), part: 'lift' });
    [[0.80, 0], [-0.80, 0], [0, 0.75], [0, -0.75]].forEach(([px, pz]) => {
      B.box({
        parent: plat, x: px, y: 0.50, z: pz,
        w: pz ? 1.72 : 0.07, h: 0.95, d: pz ? 0.07 : 1.62, r: 0.02,
        mat: metalMat(0xd6dce4, 0.32), part: 'lift'
      });
    });
    B.box({ parent: plat, x: 0, y: 0.98, z: 0, w: 1.76, h: 0.07, d: 1.66, r: 0.03, mat: paint(0xf5c433, { rough: 0.35 }), part: 'lift' });
    /* まっすぐ 上へ のびる はしら */
    const mast = new THREE.Group();
    mast.position.set(1.05, 3.10, 0);
    B.root.add(mast);
    [1, -1].forEach(sz => {
      B.box({ parent: mast, x: 0, y: 0, z: sz * 0.52, w: 0.26, h: 1.10, d: 0.24, r: 0.05, mat: metalMat(0xb0b8c2, 0.32), part: 'lift' });
    });
    [1, -1].forEach(sz => {
      B.box({ x: 1.05, y: 3.05, z: sz * 0.66, w: 0.34, h: 1.60, d: 0.32, r: 0.06, color: ACC, part: 'lift', rough: 0.3 });
    });
    /* ホース と アースの リール（せいでんきを にがす） */
    B.mesh(new THREE.TorusGeometry(0.44, 0.10, 12, 28), matte(0x2b3038, 0.75),
      { x: -3.30, y: 1.50, z: W / 2 - 0.10, ry: Math.PI / 2, part: 'tank' });
    B.cyl({ x: -2.35, y: 1.42, z: W / 2 - 0.05, r: 0.16, h: 0.14, axis: 'z', seg: 16, mat: matte(0xd97f14, 0.5), part: 'tank' });
    /* あぶないの しるし・しょうかき・ランプ・ナンバー・どろよけ */
    B.box({ x: -4.50, y: 2.30, z: 0, w: 0.03, h: 0.34, d: 0.42, r: 0.02, mat: paint(0xf07818, { rough: 0.35 }), aux: true });
    B.box({ x: 1.90, y: 1.24, z: -(W / 2 - 0.14), w: 0.38, h: 0.48, d: 0.24, r: 0.05, mat: paint(0xd8342c, { rough: 0.3 }), part: 'tank' });
    tailLamps(B, { x: -4.50, y: 0.84, zOff: W / 2 - 0.42 });
    plate(B, { x: -4.50, y: 0.84, z: 0, axis: 'x-' });
    wheelArch(B, { x: -2.30, r: 0.56, spread: 1.04, w: 0.66 });
    wheelArch(B, { x: -3.65, r: 0.56, spread: 1.04, w: 0.66, flap: true });

    B.anim('lift', '台を 上げる', v => {
      plat.position.y = 3.50 + v * 2.10;
      mast.position.y = 3.10 + v * 1.05;
      mast.scale.y = 1 + v * 1.6;
    });

    B.wheel({ x: 3.50, r: 0.56, w: 0.34, spread: 1.02 });
    [-2.30, -3.65].forEach(ax => {
      [0.90, 1.19, -0.90, -1.19].forEach(z => B.wheel({ x: ax, r: 0.56, w: 0.30, z: z }));
      B.cyl({ x: ax, y: 0.56, z: 0, r: 0.11, h: 2.05, axis: 'z', seg: 14, mat: matte(PAL.frame, 0.6) });
    });
    B.cyl({ x: 3.50, y: 0.56, z: 0, r: 0.11, h: 2.05, axis: 'z', seg: 14, mat: matte(PAL.frame, 0.6) });
  }
};

/* -------------------------------------------------- せんろの てんけん車 */
MODEL3D.railcar = {
  label: 'せんろの てんけん車',
  build: function (B) {
    const COL = 0xf0b21c, W = 2.20;

    /* せんろ（この 車が はしる ところ）*/
    B.box({ x: 0, y: 0.045, z: 0, w: 9.4, h: 0.09, d: 2.70, r: 0.01, mat: matte(0x6b6357, 0.95) });
    for (let i = -6; i <= 6; i++) {
      B.box({ x: i * 0.72, y: 0.13, z: 0, w: 0.24, h: 0.10, d: 2.20, r: 0.02, mat: matte(0x6f5230, 0.9) });
    }
    [1, -1].forEach(sz => {
      B.box({ x: 0, y: 0.245, z: sz * 0.717, w: 9.4, h: 0.14, d: 0.13, r: 0.02, mat: metalMat(0xa8b0ba, 0.28) });
    });

    chassis(B, { x: -0.3, y: 1.02, len: 6.0, spread: 0.40 });
    truckCab(B, { x: 2.05, len: 1.80, w: W, top: 3.02, floor: 1.06, color: COL });
    lightBar(B, { x: 2.05, y: 3.14, w: 1.40, n: 4, colors: [PAL.lampY, 0xfff0d0], part: 'lamp' });

    /* にだい と どうぐ */
    B.box({ x: -1.35, y: 1.28, z: 0, w: 3.40, h: 0.22, d: W, r: 0.04, mat: matte(0x59616e, 0.6), part: 'arm' });
    [1, -1].forEach(sz => {
      B.box({ x: -1.35, y: 1.55, z: sz * (W / 2 - 0.04), w: 3.40, h: 0.42, d: 0.08, r: 0.03, color: COL, part: 'arm', rough: 0.3 });
    });
    /* とりかえる レール */
    B.box({ x: -1.45, y: 1.46, z: 0.42, w: 3.20, h: 0.14, d: 0.13, r: 0.02, mat: metalMat(0xa8b0ba, 0.3), part: 'arm' });

    /* ==== ちいさな クレーン ==== */
    const post = new THREE.Group();
    post.position.set(0.55, 1.40, -0.55);
    B.root.add(post);
    B.cyl({ parent: post, x: 0, y: 0.55, z: 0, r: 0.16, h: 1.10, seg: 18, color: COL, part: 'arm' });
    const jib = new THREE.Group();
    jib.position.set(0, 1.05, 0);
    jib.rotation.z = 0.34;
    post.add(jib);
    B.box({ parent: jib, x: 1.15, y: 0, z: 0, w: 2.50, h: 0.24, d: 0.24, r: 0.06, color: COL, part: 'arm', rough: 0.3 });
    const hang = new THREE.Group();
    hang.position.set(2.30, 0, 0);
    hang.rotation.z = -0.34;
    jib.add(hang);
    B.cyl({ parent: hang, x: 0, y: -0.60, z: 0, r: 0.022, h: 1.20, axis: 'y', seg: 8, mat: metalMat(0x9aa3ae, 0.35), part: 'arm' });
    B.mesh(new THREE.TorusGeometry(0.16, 0.05, 10, 20, Math.PI * 1.45), metalMat(0xd8dee6, 0.25),
      { parent: hang, x: 0, y: -1.32, z: 0, rz: Math.PI * 0.28, part: 'arm' });

    /* ==== タイヤの ほかの てつの わ（せんろの 上で おろす）==== */
    const rw = [];
    [[2.95, 1], [-2.75, 1]].forEach(([px]) => {
      const g = new THREE.Group();
      g.position.set(px, 0, 0);
      B.root.add(g);
      rw.push(g);
      [1, -1].forEach(sz => {
        B.cyl({ parent: g, x: 0, y: 1.05, z: sz * 0.717, r: 0.40, h: 0.10, axis: 'z', seg: 26, mat: metalMat(0x8d959f, 0.3), part: 'railwheel' });
        B.cyl({ parent: g, x: 0, y: 1.05, z: sz * 0.777, r: 0.46, h: 0.05, axis: 'z', seg: 26, mat: metalMat(0x7d858f, 0.32), part: 'railwheel' });
      });
      B.cyl({ parent: g, x: 0, y: 1.05, z: 0, r: 0.09, h: 1.55, axis: 'z', seg: 14, mat: metalMat(0x9aa3ae, 0.35), part: 'railwheel' });
      B.box({ parent: g, x: 0, y: 1.45, z: 0, w: 0.34, h: 0.60, d: 1.75, r: 0.05, mat: matte(0x59616e, 0.55), part: 'railwheel' });
    });

    B.anim('railwheel', 'てつの わを おろす', v => {
      rw.forEach(g => { g.position.y = -v * 0.64; });
    });

    /* クレーンの さぎょうとう・うしろの ランプ・ナンバー */
    B.lamp({ parent: post, x: 0.20, y: 1.02, z: 0, w: 0.10, h: 0.09, d: 0.11, color: 0xfff2cf, strength: 1.2, aux: true });
    tailLamps(B, { x: -3.06, y: 1.12, zOff: W / 2 - 0.38 });
    plate(B, { x: -3.06, y: 1.12, z: 0, axis: 'x-' });

    B.wheel({ x: 1.95, r: 0.48, w: 0.28, spread: 0.88 });
    B.wheel({ x: -1.85, r: 0.48, w: 0.26, z: 0.78 });
    B.wheel({ x: -1.85, r: 0.48, w: 0.26, z: 1.02 });
    B.wheel({ x: -1.85, r: 0.48, w: 0.26, z: -0.78 });
    B.wheel({ x: -1.85, r: 0.48, w: 0.26, z: -1.02 });
    B.root.children.forEach(c => {
      if (c.isGroup && c.children.length && c.children[0].userData &&
        c.children[0].userData.part === 'tire') c.position.y += 0.30;
    });
  }
};


/* ---------------- よこの とびらの 下に 出る かいだん ---------------- */
function sideSteps(B, o) {
  const g = new THREE.Group();
  g.position.set(o.x, 0, o.z);
  (o.parent || B.root).add(g);
  const n = o.n || 3, rise = (o.top || 0.95) / n;
  for (let i = 0; i < n; i++) {
    B.box({
      parent: g, x: 0, y: (i + 1) * rise, z: o.sz * (0.18 + (n - 1 - i) * 0.26),
      w: o.w || 1.00, h: 0.07, d: 0.30, r: 0.02, mat: matte(0xc7ced7, 0.6), part: o.part
    });
  }
  [1, -1].forEach(sx => {
    B.cyl({ parent: g, x: sx * ((o.w || 1.00) / 2 - 0.06), y: (o.top || 0.95) * 0.75, z: o.sz * 0.30, r: 0.025, h: 0.80, seg: 8, mat: metalMat(0xb9c0ca, 0.3), part: o.part });
  });
  return g;
}

/* -------------------------------------------------------- しょうぼう車 */
MODEL3D.fire = {
  label: 'しょうぼう車',
  build: function (B) {
    const COL = 0xd8342c, W = 2.36;

    chassis(B, { x: -0.4, y: 0.88, len: 6.8, spread: 0.42 });

    /* たくさんの しょうぼうしが のる ながい うんてんせき */
    truckCab(B, { x: 2.15, len: 2.95, w: W, top: 3.02, floor: 0.94, color: COL });
    [1, -1].forEach(sz => {
      B.seam({ x: 1.35, y: 2.05, z: sz * (W / 2 + 0.008), w: 0.028, h: 1.30, d: 0.03, part: 'door' });
      B.glass({ x: 1.05, y: 2.42, z: sz * (W / 2 - 0.04), w: 0.85, h: 0.62, d: 0.08, r: 0.07, part: 'window' });
    });
    lightBar(B, { x: 2.15, y: 3.14, w: 1.80, n: 6, colors: [PAL.lampR, 0xfff0d0], part: 'lamp' });

    /* ==== 水を すい上げて いきおいよく おくり出す ポンプ ==== */
    const px = -0.75;
    B.box({ x: px, y: 1.62, z: 0, w: 1.90, h: 1.28, d: W, r: 0.08, color: COL, part: 'pump', rough: 0.3 });
    [1, -1].forEach(sz => {
      /* そうさばん（メーターと ハンドルが ならぶ）*/
      B.box({ x: px, y: 1.62, z: sz * (W / 2 + 0.02), w: 1.70, h: 1.10, d: 0.05, r: 0.04, mat: metalMat(0xb0b8c2, 0.4), part: 'pump' });
      [-0.55, -0.18, 0.19, 0.56].forEach((dx, i) => {
        B.cyl({ x: px + dx, y: 2.02, z: sz * (W / 2 + 0.06), r: 0.13, h: 0.05, axis: 'z', seg: 18, mat: metalMat(0xdfe4ea, 0.2), part: 'pump' });
        B.mesh(new THREE.TorusGeometry(0.11, 0.022, 8, 18), matte(i % 2 ? 0xe5544b : 0x2f6fe0, 0.6),
          { x: px + dx, y: 1.42, z: sz * (W / 2 + 0.07), ry: Math.PI / 2, part: 'pump' });
        /* 水を 出す 口 */
        B.cyl({ x: px + dx, y: 1.10, z: sz * (W / 2 + 0.10), r: 0.09, h: 0.16, axis: 'z', seg: 14, mat: metalMat(0xc8cfd8, 0.25), part: 'pump' });
      });
    });
    /* 川から 水を すい上げる ふとい くだ */
    B.cyl({ x: px - 1.55, y: 2.62, z: W / 2 - 0.22, r: 0.13, h: 2.60, axis: 'x', seg: 14, mat: matte(0x3c434e, 0.7), part: 'pump' });

    /* ==== すぐ のばせる ように まいて ある ながい ホース ==== */
    const bx = -2.55;
    B.box({ x: bx, y: 1.62, z: 0, w: 2.10, h: 1.28, d: W, r: 0.08, color: COL, part: 'hose', rough: 0.3 });
    [1, -1].forEach(sz => {
      /* まいて ある ホースが 見える たな */
      B.box({ x: bx, y: 1.62, z: sz * (W / 2 - 0.04), w: 1.90, h: 1.06, d: 0.06, r: 0.04, mat: matte(0x2b3038, 0.7), part: 'hose' });
      [[-0.48, 2.02], [0.16, 2.02], [-0.48, 1.42], [0.16, 1.42], [0.72, 1.72]].forEach(([dx, dy]) => {
        B.mesh(new THREE.TorusGeometry(0.23, 0.075, 10, 24), matte(0xe8ecf1, 0.7),
          { x: bx + dx, y: dy, z: sz * (W / 2 + 0.03), ry: Math.PI / 2, part: 'hose' });
        B.mesh(new THREE.TorusGeometry(0.13, 0.075, 10, 22), matte(0xd6dce4, 0.7),
          { x: bx + dx, y: dy, z: sz * (W / 2 + 0.03), ry: Math.PI / 2, part: 'hose' });
      });
    });
    B.box({ x: -1.65, y: 2.36, z: 0, w: 4.20, h: 0.14, d: W + 0.04, r: 0.05, mat: matte(0x3c434e, 0.6), part: 'hose' });
    /* やねの 上の ぎんいろの はしご（かならず つんで ある） */
    [1, -1].forEach(sz => {
      B.box({ x: -1.55, y: 2.56, z: sz * 0.42, w: 3.60, h: 0.07, d: 0.07, r: 0.02, mat: metalMat(0xd6dce4, 0.25), part: 'hose' });
    });
    for (let i = 0; i < 8; i++) {
      B.cyl({ x: -3.15 + i * 0.46, y: 2.56, z: 0, r: 0.024, h: 0.84, axis: 'z', seg: 8, mat: metalMat(0xc3cad3, 0.3), part: 'hose' });
    }
    [[-3.35], [0.25]].forEach(([rx]) => {
      B.box({ x: rx, y: 2.47, z: 0.42, w: 0.06, h: 0.12, d: 0.07, r: 0.02, mat: metalMat(0x9aa3ae, 0.4), part: 'hose' });
      B.box({ x: rx, y: 2.47, z: -0.42, w: 0.06, h: 0.12, d: 0.07, r: 0.02, mat: metalMat(0x9aa3ae, 0.4), part: 'hose' });
    });
    /* うしろの ステップ・ランプ・ナンバー・どろよけ */
    B.box({ x: -3.72, y: 0.68, z: 0, w: 0.42, h: 0.07, d: W - 0.40, r: 0.03, mat: metalMat(0xb9c0ca, 0.3), part: 'step' });
    tailLamps(B, { x: -3.66, y: 1.02, zOff: W / 2 - 0.40 });
    plate(B, { x: -3.66, y: 1.32, z: 0, axis: 'x-' });
    [1, -1].forEach(sz => {
      B.box({ x: -3.42, y: 0.36, z: sz * 1.00, w: 0.045, h: 0.52, d: 0.52, r: 0.02, mat: matte(0x1d2127, 0.85) });
    });
    /* のばした ホース */
    const laid = new THREE.Group();
    B.root.add(laid);
    const curve = new THREE.CatmullRomCurve3([
      new THREE.Vector3(bx - 1.05, 1.35, W / 2 - 0.10),
      new THREE.Vector3(bx - 1.85, 0.80, 1.70),
      new THREE.Vector3(bx - 2.30, 0.14, 2.60),
      new THREE.Vector3(bx - 1.20, 0.10, 3.40),
      new THREE.Vector3(bx + 0.60, 0.10, 3.10)
    ]);
    B.mesh(new THREE.TubeGeometry(curve, 60, 0.085, 8, false), matte(0xe8ecf1, 0.7),
      { parent: laid, part: 'hose' });
    B.cyl({ parent: laid, x: bx + 0.90, y: 0.10, z: 3.05, r: 0.10, h: 0.55, axis: 'x', seg: 12, mat: metalMat(0xc8cfd8, 0.25), part: 'hose' });
    laid.visible = false;
    B.anim('hose', 'ホースを のばす', v => { laid.visible = v > 0.05; laid.scale.setScalar(0.2 + v * 0.8); });

    B.wheel({ x: 2.20, r: 0.54, w: 0.32, spread: 1.00 });
    B.wheel({ x: -2.40, r: 0.54, w: 0.30, z: 0.86 });
    B.wheel({ x: -2.40, r: 0.54, w: 0.30, z: 1.14 });
    B.wheel({ x: -2.40, r: 0.54, w: 0.30, z: -0.86 });
    B.wheel({ x: -2.40, r: 0.54, w: 0.30, z: -1.14 });
    [2.20, -2.40].forEach(ax => {
      B.cyl({ x: ax, y: 0.54, z: 0, r: 0.10, h: 1.95, axis: 'z', seg: 14, mat: matte(PAL.frame, 0.6) });
    });
  }
};

/* -------------------------------------------------- かがくしょうぼう車 */
MODEL3D.foam = {
  label: 'かがくしょうぼう車',
  build: function (B) {
    const COL = 0xd8342c, W = 2.44;

    chassis(B, { x: -0.5, y: 0.90, len: 8.0, spread: 0.44 });
    truckCab(B, { x: 2.85, len: 2.60, w: W, top: 3.06, floor: 0.96, color: COL });
    [1, -1].forEach(sz => {
      B.seam({ x: 2.05, y: 2.05, z: sz * (W / 2 + 0.008), w: 0.028, h: 1.30, d: 0.03, part: 'door' });
    });
    lightBar(B, { x: 2.85, y: 3.18, w: 1.80, n: 6, colors: [PAL.lampR, 0xfff0d0], part: 'lamp' });

    /* あわの もとに なる くすりを ためた タンク */
    const prof = [
      [0.03, -2.20], [0.55, -2.16], [0.85, -1.98], [0.98, -1.66],
      [1.04, -1.20], [1.06, 0], [1.04, 1.20], [0.98, 1.66],
      [0.85, 1.98], [0.55, 2.16], [0.03, 2.20]
    ].map(p => new THREE.Vector2(p[0], p[1]));
    const g = new THREE.LatheGeometry(prof, 40);
    g.computeVertexNormals();
    B.mesh(g, paint(0xf2f5f9, { metal: 0.32, rough: 0.28 }), { x: -1.55, y: 2.10, z: 0, rz: Math.PI / 2, part: 'tank' });
    [-1.2, 0, 1.2].forEach(dx => {
      B.mesh(new THREE.TorusGeometry(1.07, 0.05, 10, 30), metalMat(0x9aa3ae, 0.34),
        { x: -1.55 + dx, y: 2.10, z: 0, ry: Math.PI / 2, part: 'tank' });
    });
    B.box({ x: -1.55, y: 1.10, z: 0, w: 4.60, h: 0.52, d: W - 0.10, r: 0.06, color: COL, part: 'tank', rough: 0.3 });
    [1, -1].forEach(sz => {
      B.box({ x: -1.55, y: 1.44, z: sz * (W / 2 - 0.06), w: 4.40, h: 0.86, d: 0.10, r: 0.05, mat: metalMat(0xc7ced7, 0.4), part: 'tank' });
      B.box({ x: -1.55, y: 2.10, z: sz * (W / 2 + 0.012), w: 3.60, h: 0.24, d: 0.02, r: 0.01, mat: paint(0xf5c433, { rough: 0.3 }) });
    });
    B.cyl({ x: -1.55, y: 3.20, z: 0, r: 0.26, h: 0.16, seg: 20, mat: metalMat(0xb9c0ca, 0.28), part: 'tank' });

    /* ==== やねの 上の ふとい ノズル（はなれた ところから あわを とばす）==== */
    const base = new THREE.Group();
    base.position.set(1.10, 3.30, 0);
    B.root.add(base);
    B.cyl({ x: 1.10, y: 3.16, z: 0, r: 0.34, h: 0.30, seg: 22, mat: metalMat(0x9aa3ae, 0.4), part: 'turret' });
    const gun = new THREE.Group();
    gun.rotation.z = 0.30;
    base.add(gun);
    B.cyl({ parent: gun, x: 0.70, y: 0, z: 0, r: 0.17, h: 1.50, axis: 'x', seg: 20, mat: paint(0xf5c433, { rough: 0.3 }), part: 'turret' });
    B.cyl({ parent: gun, x: 1.52, y: 0, z: 0, r: 0.24, r2: 0.14, h: 0.42, axis: 'x', seg: 20, mat: metalMat(0xc8cfd8, 0.25), part: 'turret' });
    B.mesh(new THREE.TorusGeometry(0.22, 0.035, 8, 20), matte(0x2b3038, 0.6),
      { parent: gun, x: -0.10, y: -0.10, z: 0.30, ry: Math.PI / 2, part: 'turret' });
    B.box({ parent: gun, x: -0.28, y: 0, z: 0, w: 0.34, h: 0.34, d: 0.46, r: 0.06, mat: metalMat(0x8f98a3, 0.4), part: 'turret' });

    B.anim('turret', 'ノズルを むける', v => {
      base.rotation.y = -v * 1.15;
      gun.rotation.z = 0.30 + v * 0.36;
    });

    /* タンクの 上の あるく ところ と てすり */
    B.box({ x: -1.55, y: 3.22, z: 0.72, w: 3.9, h: 0.05, d: 0.34, r: 0.02, mat: metalMat(0xb9c0ca, 0.35), part: 'tank' });
    [1, -1].forEach(e => {
      B.cyl({ x: -1.55 + e * 1.9, y: 3.48, z: 0.86, r: 0.020, h: 0.5, axis: 'y', seg: 8, mat: metalMat(0xd8dee6, 0.3), part: 'tank' });
    });
    B.cyl({ x: -1.55, y: 3.72, z: 0.86, r: 0.020, h: 3.8, axis: 'x', seg: 8, mat: metalMat(0xd8dee6, 0.3), part: 'tank' });
    /* うしろの ランプ・ナンバー・どろよけ */
    tailLamps(B, { x: -4.44, y: 0.84, zOff: W / 2 - 0.42 });
    plate(B, { x: -4.44, y: 0.84, z: 0, axis: 'x-' });
    [1, -1].forEach(sz => {
      B.box({ x: -3.35, y: 0.36, z: sz * 1.04, w: 0.045, h: 0.56, d: 0.55, r: 0.02, mat: matte(0x1d2127, 0.85) });
    });

    B.wheel({ x: 2.85, r: 0.56, w: 0.34, spread: 1.02 });
    B.wheel({ x: -2.55, r: 0.56, w: 0.30, z: 0.90 });
    B.wheel({ x: -2.55, r: 0.56, w: 0.30, z: 1.19 });
    B.wheel({ x: -2.55, r: 0.56, w: 0.30, z: -0.90 });
    B.wheel({ x: -2.55, r: 0.56, w: 0.30, z: -1.19 });
    [2.85, -2.55].forEach(ax => {
      B.cyl({ x: ax, y: 0.56, z: 0, r: 0.10, h: 2.05, axis: 'z', seg: 14, mat: matte(PAL.frame, 0.6) });
    });
  }
};

/* -------------------------------------------------------- きゅうじょ車 */
MODEL3D.rescue = {
  label: 'きゅうじょ車',
  build: function (B) {
    const COL = 0xd8342c, W = 2.36;
    const bx = -1.10, blen = 4.20, bbot = 1.02, btop = 3.06;

    chassis(B, { x: -0.4, y: 0.88, len: 6.8, spread: 0.42 });
    truckCab(B, { x: 2.35, len: 2.60, w: W, top: 3.02, floor: 0.94, color: COL });
    lightBar(B, { x: 2.35, y: 3.14, w: 1.75, n: 6, colors: [PAL.lampR, 0xfff0d0], part: 'lamp' });

    /* どうぐを 入れる からだ */
    B.box({ x: bx, y: bbot, z: 0, w: blen, h: 0.16, d: W, r: 0.04, color: 0x39404c, part: 'box' });
    B.box({ x: bx, y: btop + 0.08, z: 0, w: blen, h: 0.16, d: W, r: 0.06, color: COL, part: 'box', rough: 0.3 });
    B.box({ x: bx - blen / 2 - 0.05, y: (btop + bbot) / 2, z: 0, w: 0.10, h: btop - bbot, d: W, r: 0.06, color: COL, part: 'box', rough: 0.3 });
    B.box({ x: bx + blen / 2 + 0.05, y: (btop + bbot) / 2, z: 0, w: 0.10, h: btop - bbot, d: W, r: 0.06, color: COL, part: 'box', rough: 0.3 });
    B.box({ x: bx, y: (btop + bbot) / 2, z: 0, w: blen, h: btop - bbot, d: 0.16, r: 0.04, color: COL, part: 'box', rough: 0.3 });

    /* ==== どうぐが 一つずつ きまった ところに ならんで いる ==== */
    const TOOL = [0xf5c433, 0x2f7fd0, 0x2b9c68, 0xe8896f, 0x9aa3ae, 0xef7127];
    [1, -1].forEach(sz => {
      [0.52, 1.16, 1.72].forEach((dy, row) => {
        B.box({ x: bx, y: bbot + dy, z: sz * (W / 2 - 0.32), w: blen - 0.30, h: 0.05, d: 0.44, r: 0.02, mat: matte(0x59616e, 0.7), part: 'box' });
        for (let i = 0; i < 6; i++) {
          const wI = 0.30 + ((i + row) % 3) * 0.14;
          B.box({
            x: bx - (blen - 0.60) / 2 + i * ((blen - 0.60) / 5), y: bbot + dy + 0.22,
            z: sz * (W / 2 - 0.34), w: wI, h: 0.36, d: 0.32, r: 0.04,
            mat: matte(TOOL[(i * 2 + row) % TOOL.length], 0.7), part: 'box'
          });
        }
      });
    });

    /* よこの とびら（上へ ひらく シャッター）*/
    const doors = [];
    [1, -1].forEach(sz => {
      const hg = new THREE.Group();
      hg.position.set(bx, btop - 0.02, sz * (W / 2 - 0.04));
      B.root.add(hg);
      doors.push({ g: hg, sz: sz });
      B.box({ parent: hg, x: 0, y: -(btop - bbot) / 2, z: 0, w: blen - 0.06, h: btop - bbot - 0.06, d: 0.08, r: 0.04, mat: metalMat(0xc7ced7, 0.42), part: 'door' });
      for (let i = -4; i <= 4; i++) {
        B.box({ parent: hg, x: 0, y: -(btop - bbot) / 2 + i * 0.21, z: sz * 0.05, w: blen - 0.20, h: 0.10, d: 0.03, r: 0.01, mat: metalMat(0xaeb7c2, 0.5), part: 'door' });
      }
    });
    B.anim('box', 'よこの とびらを ひらく', v => {
      doors.forEach(d => { d.g.rotation.x = d.sz * v * 1.62; });
    });

    /* ==== 前の、つなを ぐるぐる まきとる きかい ==== */
    const win = new THREE.Group();
    win.position.set(4.05, 0.86, 0);
    B.root.add(win);
    B.box({ parent: win, x: 0, y: 0, z: 0, w: 0.62, h: 0.55, d: 1.35, r: 0.06, mat: matte(0x3c434e, 0.6), part: 'winch' });
    B.cyl({ parent: win, x: 0, y: 0.06, z: 0, r: 0.22, h: 1.00, axis: 'z', seg: 22, mat: metalMat(0x8f98a3, 0.35), part: 'winch' });
    for (let i = 0; i < 9; i++) {
      B.mesh(new THREE.TorusGeometry(0.27, 0.028, 8, 24), metalMat(0xb9c0ca, 0.3),
        { parent: win, x: 0, y: 0.06, z: -0.42 + i * 0.105, ry: Math.PI / 2, part: 'winch' });
    }
    B.cyl({ parent: win, x: 0.55, y: 0.06, z: 0, r: 0.028, h: 0.75, axis: 'x', seg: 8, mat: metalMat(0x9aa3ae, 0.35), part: 'winch' });
    B.mesh(new THREE.TorusGeometry(0.13, 0.035, 10, 20, Math.PI * 1.4), metalMat(0xd8dee6, 0.25),
      { parent: win, x: 1.00, y: 0.06, z: 0, rz: Math.PI * 0.28, part: 'winch' });
    B.spin.push({ obj: win, axis: 'z', speed: 0 });
    const si = B.spin.length - 1;
    B.anim('winch', 'つなを まきとる', v => { B.spin[si].speed = v * 2.4; });

    /* うしろの しょうめいとう（げんばを てらす ライトの はしら） */
    B.cyl({ x: -3.05, y: btop + 0.42, z: -0.72, r: 0.055, h: 0.85, axis: 'y', seg: 10, mat: metalMat(0x9aa3ae, 0.35), part: 'box' });
    [1, -1].forEach(sz => {
      B.lamp({ x: -3.05, y: btop + 0.85, z: -0.72 + sz * 0.14, w: 0.16, h: 0.15, d: 0.13, color: 0xfff4d4, strength: 1.6, part: 'lamp' });
    });
    /* うしろの ランプ・ナンバー・どろよけ */
    tailLamps(B, { x: bx - blen / 2 - 0.06, y: 0.84, zOff: W / 2 - 0.42 });
    plate(B, { x: bx - blen / 2 - 0.06, y: 0.84, z: 0, axis: 'x-' });
    [1, -1].forEach(sz => {
      B.box({ x: -3.12, y: 0.36, z: sz * 1.00, w: 0.045, h: 0.52, d: 0.52, r: 0.02, mat: matte(0x1d2127, 0.85) });
    });

    B.wheel({ x: 2.35, r: 0.54, w: 0.32, spread: 1.00 });
    B.wheel({ x: -2.30, r: 0.54, w: 0.30, z: 0.86 });
    B.wheel({ x: -2.30, r: 0.54, w: 0.30, z: 1.14 });
    B.wheel({ x: -2.30, r: 0.54, w: 0.30, z: -0.86 });
    B.wheel({ x: -2.30, r: 0.54, w: 0.30, z: -1.14 });
    [2.35, -2.30].forEach(ax => {
      B.cyl({ x: ax, y: 0.54, z: 0, r: 0.10, h: 1.95, axis: 'z', seg: 14, mat: matte(PAL.frame, 0.6) });
    });
  }
};


/* -------------------------------------------------------- けんけつ車 */
MODEL3D.blood = {
  label: 'けんけつ車',
  build: function (B) {
    const COL = 0xf2f5f9, ACC = 0xe5544b, W = 2.36;
    const L = 8.60, FLOOR = 0.92, ROOF = 3.14;
    const gb = 1.90, gt = 2.72;                     /* まどの 上と 下 */

    chassis(B, { x: -0.4, y: 0.80, len: 7.8, spread: 0.42 });

    /* よこの かべ（中の ベッドが 見えるように まどを ぬく）*/
    [1, -1].forEach(sz => {
      const zz = sz * (W / 2 - 0.05);
      B.box({ x: -0.60, y: (gb + FLOOR) / 2, z: zz, w: L - 1.9, h: gb - FLOOR, d: 0.10, r: 0.08, color: COL, part: 'body', rough: 0.28 });
      B.box({ x: -0.60, y: (gt + ROOF) / 2, z: zz, w: L - 1.9, h: ROOF - gt, d: 0.10, r: 0.06, color: COL, part: 'body', rough: 0.3 });
      for (let i = -2; i <= 2; i++) {
        B.box({ x: -0.60 + i * 1.32, y: (gt + gb) / 2, z: zz, w: 0.12, h: gt - gb, d: 0.10, r: 0.03, color: COL, part: 'body', rough: 0.3 });
      }
      B.box({ x: -0.60, y: (gt + gb) / 2, z: zz, w: L - 2.1, h: gt - gb, d: 0.06, r: 0.05, mat: clearGlassMat(), part: 'window' });
      B.box({ x: -0.60, y: 1.52, z: sz * (W / 2 + 0.012), w: L - 2.0, h: 0.22, d: 0.02, r: 0.01, mat: paint(ACC, { rough: 0.3 }) });
    });
    B.box({ x: -0.40, y: FLOOR, z: 0, w: L - 1.4, h: 0.14, d: W, r: 0.05, color: 0x39404c, part: 'body' });
    B.box({ x: -0.40, y: ROOF + 0.06, z: 0, w: L - 1.3, h: 0.14, d: W, r: 0.08, color: COL, part: 'body', rough: 0.3 });
    B.box({ x: -L / 2 + 0.05, y: (ROOF + FLOOR) / 2, z: 0, w: 0.12, h: ROOF - FLOOR, d: W - 0.04, r: 0.08, color: COL, part: 'body', rough: 0.28 });

    /* ==== うでを のばして よこに なれる ベッドが いくつも ==== */
    for (let i = 0; i < 4; i++) {
      const bxx = 1.55 - i * 1.30;
      B.box({ x: bxx, y: FLOOR + 0.62, z: -0.52, w: 1.05, h: 0.14, d: 0.62, r: 0.05, mat: matte(0xdfe6ee, 0.6), part: 'bed' });
      B.box({ x: bxx + 0.42, y: FLOOR + 0.80, z: -0.52, w: 0.34, h: 0.16, d: 0.58, r: 0.06, rz: -0.42, mat: matte(0xdfe6ee, 0.6), part: 'bed' });
      B.box({ x: bxx, y: FLOOR + 0.30, z: -0.52, w: 0.95, h: 0.52, d: 0.52, r: 0.05, mat: matte(0x2f5f9c, 0.8), part: 'bed' });
      /* うでを のせる 台 */
      B.box({ x: bxx - 0.10, y: FLOOR + 0.66, z: -0.05, w: 0.55, h: 0.08, d: 0.30, r: 0.03, mat: matte(0xc7ced7, 0.6), part: 'bed' });
      /* 血の ふくろを かける ぼう */
      B.cyl({ x: bxx + 0.42, y: FLOOR + 1.10, z: -0.05, r: 0.022, h: 0.86, seg: 8, mat: metalMat(0xb9c0ca, 0.3), part: 'bed' });
    }
    /* うけつけの つくえ */
    B.box({ x: -2.60, y: FLOOR + 0.42, z: 0.50, w: 1.30, h: 0.12, d: 0.55, r: 0.04, mat: matte(0xd6c3a5, 0.7), part: 'bed' });

    /* ==== よこの とびらと、のぼる かいだん ==== */
    const dz = W / 2 - 0.05;
    const hinge = new THREE.Group();
    hinge.position.set(2.35, 0, dz);
    B.root.add(hinge);
    B.box({ parent: hinge, x: -0.55, y: (ROOF + FLOOR) / 2, z: 0, w: 1.10, h: ROOF - FLOOR - 0.06, d: 0.09, r: 0.05, color: COL, part: 'door', rough: 0.28 });
    B.box({ parent: hinge, x: -0.55, y: 2.32, z: 0.012, w: 0.80, h: 0.72, d: 0.05, r: 0.05, mat: clearGlassMat(), part: 'door' });
    const steps = sideSteps(B, { x: 1.85, z: dz + 0.12, sz: 1, n: 3, top: FLOOR - 0.02, w: 1.05, part: 'door' });
    steps.visible = false;
    B.anim('door', 'よこの とびらを ひらく', v => {
      hinge.rotation.y = -v * 1.55;
      steps.visible = v > 0.1;
      steps.scale.set(1, Math.max(0.05, v), 1);
    });

    /* ==== うんてんせき ==== */
    truckCab(B, { x: 3.55, len: 1.95, w: W, top: 3.02, floor: 0.90, color: ACC });
    B.box({ x: 2.60, y: (ROOF + FLOOR) / 2 + 0.10, z: 0, w: 0.14, h: ROOF - FLOOR, d: W, r: 0.05, color: ACC, part: 'body', rough: 0.3 });
    /* うしろの 赤十字・クーラー・ランプ・ナンバー・マーカー */
    B.box({ x: -L / 2 - 0.012, y: 2.30, z: 0, w: 0.02, h: 0.44, d: 0.14, r: 0.01, mat: paint(ACC, { rough: 0.3 }) });
    B.box({ x: -L / 2 - 0.012, y: 2.30, z: 0, w: 0.02, h: 0.14, d: 0.44, r: 0.01, mat: paint(ACC, { rough: 0.3 }) });
    B.box({ x: -0.8, y: ROOF + 0.24, z: 0, w: 2.0, h: 0.22, d: 1.55, r: 0.08, mat: paint(0xe8ecf1, { rough: 0.4 }), part: 'body' });
    tailLamps(B, { x: -L / 2 + 0.02, y: 1.24, zOff: W / 2 - 0.40 });
    plate(B, { x: -L / 2 + 0.02, y: 1.24, z: 0, axis: 'x-' });
    [1, -1].forEach(sz => {
      [-3.0, 0.2].forEach(mx => {
        B.lamp({ x: mx, y: FLOOR + 0.03, z: sz * (W / 2 + 0.012), w: 0.08, h: 0.055, d: 0.03, color: 0xffa63d, strength: 0.7, aux: true });
      });
    });

    B.wheel({ x: 3.20, r: 0.50, w: 0.30, spread: 0.98 });
    B.wheel({ x: -2.70, r: 0.50, w: 0.28, z: 0.84 });
    B.wheel({ x: -2.70, r: 0.50, w: 0.28, z: 1.10 });
    B.wheel({ x: -2.70, r: 0.50, w: 0.28, z: -0.84 });
    B.wheel({ x: -2.70, r: 0.50, w: 0.28, z: -1.10 });
    [3.20, -2.70].forEach(ax => {
      B.cyl({ x: ax, y: 0.50, z: 0, r: 0.10, h: 1.95, axis: 'z', seg: 14, mat: matte(PAL.frame, 0.6) });
    });
  }
};

/* -------------------------------------------------------- ドクターカー */
MODEL3D.doctorcar = {
  label: 'ドクターカー',
  build: function (B) {
    const W = 1.82, L = 4.90;
    /* よこ顔（うしろが 高い ワゴン）*/
    const body = [
      [-L / 2, 0.32], [-L / 2 + 0.06, 0.80], [-L / 2 + 0.02, 1.62],
      [-1.05, 1.70], [-0.30, 1.72], [0.60, 1.58], [1.05, 1.06],
      [1.95, 0.92], [L / 2 - 0.10, 0.80], [L / 2, 0.44], [L / 2 - 0.20, 0.26],
      [1.05, 0.22], [-1.15, 0.22], [-L / 2 + 0.20, 0.26]
    ];
    B.mesh(sideProfileGeom(body, W, 0.16), paint(0xf2f5f9, { metal: 0.25, rough: 0.22, clear: 1.0 }),
      { x: 0, y: 0, z: 0, part: 'cab' });
    /* まど（よこ顔の かたちで 一気に。中が すけない こい スモークガラス）*/
    B.mesh(sideProfileGeom([
      [-2.30, 1.10], [-2.26, 1.58], [-0.26, 1.64], [0.58, 1.52], [1.00, 1.08]
    ], W + 0.015, 0.08), darkGlassMat(), { x: 0, y: 0, z: 0, part: 'window' });
    [1, -1].forEach(sz => {
      B.box({ x: -0.20, y: 0.64, z: sz * (W / 2 + 0.008), w: 2.70, h: 0.20, d: 0.02, r: 0.01, mat: paint(0xe5544b, { rough: 0.3 }) });
      B.seam({ x: -0.70, y: 0.76, z: sz * (W / 2 + 0.018), w: 0.026, h: 0.90, d: 0.03, color: 0x8d97a5, part: 'door' });
      B.seam({ x: 0.55, y: 0.76, z: sz * (W / 2 + 0.018), w: 0.026, h: 0.90, d: 0.03, color: 0x8d97a5, part: 'door' });
      doorHandle(B, { x: -0.36, y: 0.98, z: sz * (W / 2 + 0.012), s: sz, len: 0.20 });
      doorHandle(B, { x: 0.90, y: 0.98, z: sz * (W / 2 + 0.012), s: sz, len: 0.20 });
      doorMirror(B, { x: 0.86, y: 1.06, z: sz * (W / 2 - 0.02), s: sz, color: 0xf2f5f9 });
      B.box({ x: L / 2 - 0.055, y: 0.72, z: sz * (W / 2 - 0.24), w: 0.10, h: 0.19, d: 0.38, r: 0.05, mat: metalMat(0xb9c2cc, 0.3) });
      B.lamp({ x: L / 2 - 0.03, y: 0.72, z: sz * (W / 2 - 0.24), w: 0.12, h: 0.15, d: 0.32, color: 0xfff6e0, strength: 1.5, part: 'lamp' });
      B.lamp({ x: -L / 2 + 0.05, y: 1.10, z: sz * (W / 2 - 0.20), w: 0.10, h: 0.34, d: 0.20, color: PAL.lampR, strength: 1.2, part: 'lamp' });
      B.mesh(curvedPlateGeom(0.43, 0.032, 0.15, Math.PI - 0.15, 0.05, 12), matte(0x22262d, 0.5),
        { x: 1.45, y: 0.35, z: sz * (W / 2 - 0.08) });
      B.mesh(curvedPlateGeom(0.43, 0.032, 0.15, Math.PI - 0.15, 0.05, 12), matte(0x22262d, 0.5),
        { x: -1.45, y: 0.35, z: sz * (W / 2 - 0.08) });
    });
    wipers(B, { x: 0.98, y: 1.08, z: -0.26, rz: -0.88, len: 0.36, gap: 0.55 });
    B.cyl({ x: -1.35, y: 1.80, z: -0.42, r: 0.010, h: 0.34, axis: 'y', seg: 6, mat: matte(0x22262d, 0.4), aux: true });
    B.box({ x: L / 2 - 0.02, y: 0.62, z: 0, w: 0.06, h: 0.20, d: W - 0.44, r: 0.04, mat: matte(0x1e232b, 0.45) });
    B.box({ x: L / 2 - 0.005, y: 0.62, z: 0, w: 0.03, h: 0.035, d: W - 0.50, r: 0.015, mat: metalMat(PAL.chrome, 0.2) });
    plate(B, { x: L / 2 + 0.02, y: 0.38, z: 0, axis: 'x+' });
    plate(B, { x: -L / 2 - 0.02, y: 0.44, z: 0, axis: 'x-' });
    B.box({ x: L / 2 - 0.08, y: 0.36, z: 0, w: 0.22, h: 0.26, d: W - 0.04, r: 0.08, mat: matte(0x2a2f38, 0.5) });

    /* ==== 一分でも はやく つく ための ランプと サイレン ==== */
    B.box({ x: -0.55, y: 1.76, z: 0, w: 1.00, h: 0.09, d: 1.20, r: 0.04, mat: matte(0x2b3038, 0.55), part: 'lamp' });
    [1, -1].forEach(sz => {
      B.lamp({ x: -0.55, y: 1.86, z: sz * 0.38, w: 0.72, h: 0.18, d: 0.40, color: PAL.lampR, strength: 1.8, part: 'lamp' });
    });
    B.box({ x: -0.55, y: 1.86, z: 0, w: 0.60, h: 0.18, d: 0.32, r: 0.05, mat: matte(0xe8ecf1, 0.4), part: 'lamp' });
    B.cyl({ x: 0.35, y: 1.72, z: 0.52, r: 0.10, h: 0.16, seg: 16, mat: matte(0x3c434e, 0.6), part: 'lamp' });

    /* ==== うしろの とびらと、びょういんと おなじ どうぐの かばん ==== */
    const hatch = new THREE.Group();
    hatch.position.set(-L / 2 + 0.04, 1.60, 0);
    B.root.add(hatch);
    B.box({ parent: hatch, x: 0.10, y: -0.44, z: 0, w: 0.10, h: 0.90, d: W - 0.14, r: 0.05, mat: paint(0xf2f5f9, { rough: 0.24, clear: 1.0 }), part: 'kit' });
    B.box({ parent: hatch, x: 0.04, y: -0.34, z: 0, w: 0.05, h: 0.52, d: W - 0.42, r: 0.05, mat: glassMat(B.quality), part: 'kit' });
    /* かばん */
    const bag = new THREE.Group();
    bag.position.set(-1.55, 0.72, 0);
    B.root.add(bag);
    B.box({ parent: bag, x: 0, y: 0, z: 0.28, w: 0.72, h: 0.44, d: 0.42, r: 0.07, mat: matte(0xef7127, 0.7), part: 'kit' });
    B.box({ parent: bag, x: 0, y: 0.05, z: 0.28, w: 0.74, h: 0.10, d: 0.44, r: 0.03, mat: matte(0xf2f5f9, 0.7), part: 'kit' });
    B.mesh(new THREE.TorusGeometry(0.13, 0.022, 8, 18, Math.PI), matte(0x2b3038, 0.6),
      { parent: bag, x: 0, y: 0.24, z: 0.28, part: 'kit' });
    B.box({ parent: bag, x: 0, y: 0, z: -0.28, w: 0.66, h: 0.40, d: 0.40, r: 0.06, mat: matte(0x2f7fd0, 0.7), part: 'kit' });

    B.anim('kit', 'うしろを あけて かばんを 出す', v => {
      hatch.rotation.z = -v * 1.35;
      bag.position.x = -1.55 - v * 1.35;
      bag.position.y = 0.72 - v * 0.44;
    });

    B.wheel({ x: 1.45, r: 0.35, w: 0.22, spread: 0.80 });
    B.wheel({ x: -1.45, r: 0.35, w: 0.22, spread: 0.80 });
  }
};

/* -------------------------------------------------------- けんしん車 */
MODEL3D.xray = {
  label: 'けんしん車',
  build: function (B) {
    const COL = 0xdfe6ee, ACC = 0x2b9c68, W = 2.44;
    const bx = -1.30, blen = 6.00, bbot = 1.06, btop = 3.42;

    chassis(B, { x: -0.6, y: 0.88, len: 9.0, spread: 0.44 });
    truckCab(B, { x: 3.40, len: 1.95, w: W, top: 3.04, floor: 0.94, color: ACC });

    /* ==== 中が ちいさな へやに なって いる からだ ==== */
    B.box({ x: bx, y: bbot, z: 0, w: blen, h: 0.16, d: W, r: 0.04, color: 0x39404c, part: 'machine' });
    B.box({ x: bx, y: btop + 0.08, z: 0, w: blen, h: 0.16, d: W, r: 0.06, color: COL, part: 'machine', rough: 0.3 });
    B.box({ x: bx - blen / 2 - 0.05, y: (btop + bbot) / 2, z: 0, w: 0.10, h: btop - bbot, d: W, r: 0.06, color: COL, part: 'machine', rough: 0.3 });
    B.box({ x: bx + blen / 2 + 0.05, y: (btop + bbot) / 2, z: 0, w: 0.10, h: btop - bbot, d: W, r: 0.06, color: COL, part: 'machine', rough: 0.3 });
    /* おくの かべ（ひらかない がわ）*/
    B.box({ x: bx, y: (btop + bbot) / 2, z: -(W / 2 - 0.05), w: blen, h: btop - bbot, d: 0.10, r: 0.05, color: COL, part: 'machine', rough: 0.3 });
    [1, -1].forEach(sz => {
      B.box({ x: bx, y: 2.10, z: sz * (W / 2 + 0.012), w: blen - 0.20, h: 0.26, d: 0.02, r: 0.01, mat: paint(ACC, { rough: 0.3 }) });
    });

    /* 一人ずつの へやに 分ける しきり */
    [-1.05, 0.95].forEach(dx => {
      B.box({ x: bx + dx, y: (btop + bbot) / 2, z: -0.25, w: 0.10, h: btop - bbot - 0.10, d: W - 0.55, r: 0.04, color: 0xf2f5f9, part: 'machine', rough: 0.4 });
    });
    /* からだの 中の しゃしんを とる きかい */
    B.box({ x: bx - 1.95, y: bbot + 1.00, z: -0.42, w: 1.30, h: 1.90, d: 1.00, r: 0.10, mat: paint(0xe8ecf1, { rough: 0.3 }), part: 'machine' });
    B.box({ x: bx - 1.35, y: bbot + 1.05, z: -0.42, w: 0.24, h: 1.10, d: 0.86, r: 0.06, mat: metalMat(0xb0b8c2, 0.3), part: 'machine' });
    B.cyl({ x: bx - 0.85, y: bbot + 1.30, z: -0.42, r: 0.22, h: 0.70, axis: 'x', seg: 20, mat: metalMat(0x9099a5, 0.35), part: 'machine' });
    B.box({ x: bx - 0.85, y: bbot + 0.35, z: -0.42, w: 0.55, h: 0.70, d: 0.55, r: 0.06, mat: matte(0x59616e, 0.6), part: 'machine' });
    /* せつめいを 見る がめん と いす */
    B.box({ x: bx + 1.75, y: bbot + 1.10, z: -0.55, w: 0.10, h: 0.55, d: 0.80, r: 0.03, mat: lampMat(0x9fd6f5, 0.55), part: 'machine' });
    B.box({ x: bx + 1.75, y: bbot + 0.42, z: -0.55, w: 0.55, h: 0.10, d: 0.52, r: 0.04, mat: matte(0x2f5f9c, 0.8), part: 'machine' });
    B.box({ x: bx + 0.10, y: bbot + 0.42, z: -0.55, w: 0.55, h: 0.10, d: 0.52, r: 0.04, mat: matte(0x2f5f9c, 0.8), part: 'machine' });

    /* ==== よこの とびらと かいだん ==== */
    const dz = W / 2 - 0.05;
    const doorX = bx + 1.85;
    const hinge = new THREE.Group();
    hinge.position.set(doorX + 0.60, 0, dz);
    B.root.add(hinge);
    B.box({ parent: hinge, x: -0.60, y: (btop + bbot) / 2, z: 0, w: 1.20, h: btop - bbot - 0.06, d: 0.09, r: 0.05, color: ACC, part: 'door', rough: 0.28 });
    B.box({ parent: hinge, x: -0.60, y: 2.55, z: 0.012, w: 0.85, h: 0.80, d: 0.05, r: 0.05, mat: clearGlassMat(), part: 'door' });
    /* あいた ところの かべ（とびら いがい）*/
    [[doorX + 1.85, 2.30], [doorX - 2.55, 2.90]].forEach(([wx, ww]) => {
      B.box({ x: wx, y: (btop + bbot) / 2, z: dz, w: ww, h: btop - bbot, d: 0.10, r: 0.05, color: COL, part: 'machine', rough: 0.3 });
    });
    const steps = sideSteps(B, { x: doorX, z: dz + 0.14, sz: 1, n: 3, top: bbot - 0.04, w: 1.15, part: 'door' });
    steps.visible = false;
    B.anim('door', 'よこの とびらを ひらく', v => {
      hinge.rotation.y = -v * 1.55;
      steps.visible = v > 0.1;
      steps.scale.set(1, Math.max(0.05, v), 1);
    });

    /* やねの クーラー 2つ と うしろの はしご・ランプ・ナンバー */
    [-2.6, 0.4].forEach(ax => {
      B.box({ x: ax, y: btop + 0.28, z: 0, w: 1.3, h: 0.24, d: 1.5, r: 0.08, mat: paint(0xe8ecf1, { rough: 0.4 }), part: 'machine' });
    });
    [1, -1].forEach(sz => {
      B.box({ x: bx - blen / 2 - 0.10, y: 2.20, z: sz === 1 ? 0.70 : 0.40, w: 0.05, h: 2.20, d: 0.05, r: 0.02, mat: metalMat(0x9aa3ae, 0.35), part: 'machine' });
    });
    for (let i = 0; i < 5; i++) {
      B.box({ x: bx - blen / 2 - 0.10, y: 1.30 + i * 0.46, z: 0.55, w: 0.045, h: 0.045, d: 0.32, r: 0.02, mat: metalMat(0x9aa3ae, 0.35), part: 'machine' });
    }
    tailLamps(B, { x: bx - blen / 2 - 0.06, y: 0.84, zOff: W / 2 - 0.42 });
    plate(B, { x: bx - blen / 2 - 0.06, y: 0.84, z: -0.55, axis: 'x-' });
    [1, -1].forEach(sz => {
      [-3.5, -0.5, 1.5].forEach(mx => {
        B.lamp({ x: mx, y: bbot - 0.03, z: sz * (W / 2 + 0.012), w: 0.08, h: 0.055, d: 0.03, color: 0xffa63d, strength: 0.7, aux: true });
      });
    });

    B.wheel({ x: 3.15, r: 0.54, w: 0.32, spread: 1.00 });
    B.wheel({ x: -2.95, r: 0.54, w: 0.30, z: 0.88 });
    B.wheel({ x: -2.95, r: 0.54, w: 0.30, z: 1.16 });
    B.wheel({ x: -2.95, r: 0.54, w: 0.30, z: -0.88 });
    B.wheel({ x: -2.95, r: 0.54, w: 0.30, z: -1.16 });
    [3.15, -2.95].forEach(ax => {
      B.cyl({ x: ax, y: 0.54, z: 0, r: 0.10, h: 1.95, axis: 'z', seg: 14, mat: matte(PAL.frame, 0.6) });
    });
  }
};


/* ---------------- じょうよう車の からだ（じょうよう車・タクシー 共通）---- */
function sedanBody(B, o) {
  const W = o.w || 1.76, L = o.len || 4.70;
  /* からだは まどの 下（ベルトライン）まで。まどの ところは あけて おく */
  B.mesh(sideProfileGeom([
    [-L / 2, 0.30], [-L / 2 + 0.06, 0.72], [-L / 2 + 0.30, 0.92],
    [-1.30, 1.02], [0.98, 1.06],
    [1.90, 0.92], [L / 2 - 0.10, 0.80], [L / 2, 0.44], [L / 2 - 0.20, 0.26],
    [1.05, 0.22], [-1.15, 0.22], [-L / 2 + 0.20, 0.26]
  ], W, 0.16), paint(o.color, { metal: 0.28, rough: 0.20, clear: 1.0 }), { x: 0, y: 0, z: 0, part: o.part });
  /* やねと はしら（まどの わく だけ のこして 中を あける） */
  B.mesh(sideProfileGeom([
    [-1.12, 1.00], [-0.82, 1.44], [0.42, 1.48], [1.02, 1.02],
    [0.85, 1.02], [0.32, 1.36], [-0.70, 1.32], [-0.92, 1.00]
  ], W - 0.05, 0.045), paint(o.color, { metal: 0.28, rough: 0.20, clear: 1.0 }), { x: 0, y: 0, z: 0, part: o.part });
  /* 中の ゆか（こい 色）と ダッシュボード */
  B.box({ x: -0.16, y: 1.035, z: 0, w: 2.15, h: 0.05, d: W - 0.24, r: 0.03, mat: matte(0x232830, 0.85), part: o.part });
  B.box({ x: 0.82, y: 1.10, z: 0, w: 0.30, h: 0.10, d: W - 0.30, r: 0.04, mat: matte(0x2a2f38, 0.7), part: o.part });
  /* まどが ぐるりと つく（中が 見えるように うすい ガラス）*/
  B.mesh(sideProfileGeom([
    [-1.02, 1.06], [-0.78, 1.42], [0.40, 1.46], [0.94, 1.06]
  ], W + 0.015, 0.07), o.clear ? clearGlassMat() : glassMat(B.quality), { x: 0, y: 0, z: 0, part: 'window' });
  [1, -1].forEach(sz => {
    B.box({ x: -0.16, y: 1.24, z: sz * (W / 2 + 0.012), w: 0.05, h: 0.40, d: 0.03, r: 0.01, mat: metalMat(0xc7ced7, 0.3) });
    B.box({ x: 0.46, y: 1.26, z: sz * (W / 2 + 0.012), w: 0.05, h: 0.40, d: 0.03, r: 0.01, rz: -0.6, mat: metalMat(0xc7ced7, 0.3) });
    B.seam({ x: -0.62, y: 0.78, z: sz * (W / 2 + 0.014), w: 0.026, h: 0.86, d: 0.03, color: 0x8d97a5, part: 'door' });
    B.seam({ x: 0.52, y: 0.78, z: sz * (W / 2 + 0.014), w: 0.026, h: 0.86, d: 0.03, color: 0x8d97a5, part: 'door' });
    /* ドアハンドル（まえ・うしろ） */
    doorHandle(B, { x: -0.28, y: 0.96, z: sz * (W / 2 + 0.012), s: sz, len: 0.20 });
    doorHandle(B, { x: 0.86, y: 0.96, z: sz * (W / 2 + 0.012), s: sz, len: 0.20 });
    /* まわりが 見えるように つける かがみ（かがみの めん つき） */
    doorMirror(B, { x: 0.80, y: 1.02, z: sz * (W / 2 - 0.02), s: sz, mat: paint(o.color, { rough: 0.24, clear: 1.0 }) });
    /* ライト（ふちどり つき）と タイヤの アーチ */
    B.box({ x: L / 2 - 0.055, y: 0.72, z: sz * (W / 2 - 0.24), w: 0.10, h: 0.19, d: 0.38, r: 0.05, mat: metalMat(0xb9c2cc, 0.3) });
    B.lamp({ x: L / 2 - 0.03, y: 0.72, z: sz * (W / 2 - 0.24), w: 0.12, h: 0.15, d: 0.32, color: 0xfff6e0, strength: 1.5, part: 'lamp' });
    B.lamp({ x: -L / 2 + 0.05, y: 0.74, z: sz * (W / 2 - 0.24), w: 0.10, h: 0.16, d: 0.30, color: PAL.lampR, strength: 1.2, part: 'lamp' });
    B.mesh(curvedPlateGeom(0.42, 0.032, 0.15, Math.PI - 0.15, 0.05, 12), matte(0x22262d, 0.5),
      { x: 1.42, y: 0.34, z: sz * (W / 2 - 0.08) });
    B.mesh(curvedPlateGeom(0.42, 0.032, 0.15, Math.PI - 0.15, 0.05, 12), matte(0x22262d, 0.5),
      { x: -1.45, y: 0.34, z: sz * (W / 2 - 0.08) });
  });
  /* ワイパー・グリル・エンブレム・ナンバー */
  wipers(B, { x: 0.92, y: 1.05, z: -0.26, rz: -0.98, len: 0.36, gap: 0.55 });
  B.box({ x: L / 2 - 0.02, y: 0.62, z: 0, w: 0.06, h: 0.20, d: W - 0.44, r: 0.04, mat: matte(0x1e232b, 0.45) });
  B.box({ x: L / 2 - 0.005, y: 0.62, z: 0, w: 0.03, h: 0.035, d: W - 0.50, r: 0.015, mat: metalMat(PAL.chrome, 0.2) });
  B.cyl({ x: L / 2 + 0.012, y: 0.63, z: 0, r: 0.045, h: 0.025, axis: 'x', seg: 14, mat: metalMat(PAL.chrome, 0.12) });
  B.box({ x: L / 2 - 0.08, y: 0.36, z: 0, w: 0.22, h: 0.26, d: W - 0.04, r: 0.08, mat: matte(0x2a2f38, 0.5) });
  B.box({ x: -L / 2 + 0.08, y: 0.36, z: 0, w: 0.22, h: 0.26, d: W - 0.04, r: 0.08, mat: matte(0x2a2f38, 0.5) });
  plate(B, { x: L / 2 + 0.02, y: 0.38, z: 0, axis: 'x+' });
  plate(B, { x: -L / 2 - 0.02, y: 0.38, z: 0, axis: 'x-' });
  B.wheel({ x: 1.42, r: 0.34, w: 0.22, spread: W / 2 - 0.10 });
  B.wheel({ x: -1.45, r: 0.34, w: 0.22, spread: W / 2 - 0.10 });
}

/* 中の ざせき（二れつ）*/
function sedanSeats(B, o) {
  const seat = matte(o.color || 0x3c434e, 0.8);
  [[0.52, 0.62], [0.52, -0.62], [-0.52, 0.62], [-0.52, -0.62]].forEach(([sx, sz]) => {
    B.box({ x: sx, y: 0.82, z: sz * (o.spread || 0.62) / 0.62 * 0.42, w: 0.46, h: 0.09, d: 0.44, r: 0.04, mat: seat, part: 'seat' });
    B.box({ x: sx - 0.24, y: 1.10, z: sz * (o.spread || 0.62) / 0.62 * 0.42, w: 0.10, h: 0.50, d: 0.44, r: 0.04, mat: seat, part: 'seat' });
  });
  B.mesh(new THREE.TorusGeometry(0.17, 0.026, 8, 20), matte(0x22262d, 0.6),
    { x: 0.96, y: 1.12, z: 0.42, ry: Math.PI / 2, rz: -0.5, part: 'seat' });
  /* うしろを うつす かがみ */
  B.box({ x: 0.42, y: 1.36, z: 0, w: 0.06, h: 0.11, d: 0.30, r: 0.03, mat: matte(0x2a2f38, 0.45), part: 'window' });
}

/* ------------------------------------------------------- じょうよう車 */
MODEL3D.car = {
  label: 'じょうよう車',
  build: function (B) {
    sedanBody(B, { color: 0x2f7fd0, part: 'cab', clear: true });
    sedanSeats(B, { color: 0x3c434e });
  }
};

/* ------------------------------------------------------------ タクシー */
MODEL3D.taxi = {
  label: 'タクシー',
  build: function (B) {
    const W = 1.78;
    sedanBody(B, { color: 0x1b2028, w: W, part: 'cab', clear: true });
    /* うしろの ざせきは 足もとが ひろい（前の ざせきを 前へ 出して ある）*/
    const seat = matte(0x4a525f, 0.8);
    [[0.72, 1], [0.72, -1]].forEach(([sx, sz]) => {
      B.box({ x: sx, y: 0.82, z: sz * 0.42, w: 0.44, h: 0.09, d: 0.42, r: 0.04, mat: seat, part: 'seat' });
      B.box({ x: sx - 0.23, y: 1.10, z: sz * 0.42, w: 0.10, h: 0.50, d: 0.42, r: 0.04, mat: seat, part: 'seat' });
    });
    B.box({ x: -0.62, y: 0.84, z: 0, w: 0.58, h: 0.11, d: 1.22, r: 0.05, mat: seat, part: 'seat' });
    B.box({ x: -0.92, y: 1.16, z: 0, w: 0.12, h: 0.58, d: 1.22, r: 0.05, mat: seat, part: 'seat' });
    B.mesh(new THREE.TorusGeometry(0.17, 0.026, 8, 20), matte(0x22262d, 0.6),
      { x: 1.14, y: 1.12, z: 0.42, ry: Math.PI / 2, rz: -0.5, part: 'seat' });
    /* よるでも とおくから わかる「あんどん」*/
    B.box({ x: 0.05, y: 1.55, z: 0, w: 0.62, h: 0.09, d: 0.36, r: 0.03, mat: matte(0x2b3038, 0.55), part: 'andon' });
    B.box({ x: 0.05, y: 1.70, z: 0, w: 0.68, h: 0.22, d: 0.42, r: 0.06, mat: lampMat(0xfff0c8, 1.5), part: 'andon' });
    B.box({ x: 0.05, y: 1.70, z: 0, w: 0.40, h: 0.14, d: 0.44, r: 0.03, mat: matte(0x2b3038, 0.5), part: 'andon' });
    /* 「くうしゃ」の あかい ランプ */
    B.lamp({ x: 1.05, y: 1.28, z: -0.42, w: 0.14, h: 0.10, d: 0.22, color: PAL.lampR, strength: 1.4, part: 'andon' });
    [1, -1].forEach(sz => {
      B.box({ x: -0.05, y: 0.66, z: sz * (W / 2 + 0.012), w: 1.90, h: 0.18, d: 0.02, r: 0.01, mat: paint(0xf5c433, { rough: 0.3 }) });
    });
  }
};

/* ---------------------------------------------------------- けいトラック */
MODEL3D.kei = {
  label: 'けいトラック',
  build: function (B) {
    const COL = 0xf2f5f9, W = 1.48, L = 3.40;   /* ふつうの 車より 小さく、はばも せまい */

    B.box({ x: 0.15, y: 0.50, z: 0, w: L - 0.30, h: 0.20, d: W - 0.10, r: 0.04, mat: matte(0x4a525f, 0.6), part: 'body' });
    /* まえに よせた ちいさい うんてんせき */
    const cx = 0.78, clen = 1.35, cbot = 0.58, ctop = 1.90;
    B.box({ x: cx, y: (ctop + cbot) / 2, z: 0, w: clen, h: ctop - cbot, d: W, r: 0.16, b: 0.045, color: COL, part: 'body', rough: 0.26 });
    B.box({ x: cx + clen / 2 - 0.075, y: ctop - 0.38, z: 0, w: 0.06, h: 0.70, d: W - 0.14, r: 0.08, rz: -0.10, mat: matte(0x11151b, 0.5) });
    B.glass({ x: cx + clen / 2 - 0.045, y: ctop - 0.38, z: 0, w: 0.06, h: 0.62, d: W - 0.24, r: 0.07, rz: -0.10, part: 'window' });
    wipers(B, { x: cx + clen / 2 - 0.01, y: ctop - 0.66, z: -0.18, rz: -0.10, len: 0.30, gap: 0.45 });
    [1, -1].forEach(sz => {
      B.box({ x: cx - 0.22, y: ctop - 0.40, z: sz * (W / 2 - 0.030), w: 0.70, h: 0.60, d: 0.05, r: 0.07, mat: matte(0x11151b, 0.5) });
      B.glass({ x: cx - 0.22, y: ctop - 0.40, z: sz * (W / 2 - 0.006), w: 0.62, h: 0.52, d: 0.05, r: 0.06, part: 'window' });
      B.seam({ x: cx - 0.50, y: 1.10, z: sz * (W / 2 + 0.006), w: 0.026, h: 1.00, d: 0.03, part: 'body' });
      doorHandle(B, { x: cx - 0.16, y: 1.06, z: sz * (W / 2 + 0.012), s: sz, len: 0.18 });
      /* Aピラーの ちいさな ミラー */
      B.cyl({ x: cx + 0.42, y: ctop - 0.18, z: sz * (W / 2 + 0.05), r: 0.014, h: 0.20, axis: 'y', tilt: sz * 0.5, seg: 6, mat: matte(0x22262d, 0.5), aux: true });
      B.box({ x: cx + 0.46, y: ctop - 0.08, z: sz * (W / 2 + 0.12), w: 0.07, h: 0.16, d: 0.11, r: 0.04, mat: matte(0x22262d, 0.5), aux: true });
      B.box({ x: cx + 0.42, y: ctop - 0.08, z: sz * (W / 2 + 0.12), w: 0.012, h: 0.125, d: 0.085, r: 0.03, mat: metalMat(0xd9e3ec, 0.06), aux: true });
      B.lamp({ x: cx + clen / 2 + 0.02, y: 0.76, z: sz * (W / 2 - 0.22), w: 0.06, h: 0.16, d: 0.24, color: 0xfff2cf, strength: 1.4, part: 'lamp' });
      B.box({ x: cx + clen / 2 - 0.02, y: 0.52, z: sz * 0, w: 0.16, h: 0.22, d: W, r: 0.05, mat: matte(0x38404d, 0.55) });
    });
    /* グリル・ナンバー */
    B.box({ x: cx + clen / 2 + 0.012, y: 0.88, z: 0, w: 0.04, h: 0.14, d: W * 0.55, r: 0.03, mat: matte(0x1e232b, 0.45) });
    plate(B, { x: cx + clen / 2 + 0.03, y: 0.64, z: 0, axis: 'x+' });

    /* うしろは たいらで ひくい にだい（手で かるがると のせおろし できる）*/
    const nx = -0.85, nlen = 1.85, ny = 0.62;
    B.box({ x: nx, y: ny, z: 0, w: nlen, h: 0.10, d: W, r: 0.03, mat: metalMat(0xb9c0ca, 0.35), part: 'nidai' });
    [1, -1].forEach(sz => {
      B.box({ x: nx, y: ny + 0.24, z: sz * (W / 2 - 0.03), w: nlen, h: 0.38, d: 0.06, r: 0.03, color: COL, part: 'nidai', rough: 0.3 });
    });
    B.box({ x: nx - nlen / 2 + 0.03, y: ny + 0.24, z: 0, w: 0.06, h: 0.38, d: W, r: 0.03, color: COL, part: 'nidai', rough: 0.3 });
    B.box({ x: nx + nlen / 2 - 0.03, y: ny + 0.30, z: 0, w: 0.06, h: 0.50, d: W, r: 0.03, color: COL, part: 'nidai', rough: 0.3 });
    /* のせて ある はこ */
    B.box({ x: nx - 0.35, y: ny + 0.28, z: 0.30, w: 0.55, h: 0.36, d: 0.50, r: 0.03, mat: matte(0xb08a5a, 0.8), part: 'nidai' });
    B.box({ x: nx + 0.35, y: ny + 0.26, z: -0.28, w: 0.50, h: 0.32, d: 0.46, r: 0.03, mat: matte(0x8f6a3f, 0.8), part: 'nidai' });
    /* あおりの とめがね と ロープフック */
    [1, -1].forEach(sz => {
      [-0.5, 0.5].forEach(dx => {
        B.box({ x: nx + dx, y: ny + 0.40, z: sz * (W / 2 + 0.015), w: 0.06, h: 0.09, d: 0.025, r: 0.01, mat: metalMat(0x8b939e, 0.4), part: 'nidai' });
        B.cyl({ x: nx + dx, y: ny + 0.02, z: sz * (W / 2 - 0.01), r: 0.022, h: 0.05, axis: 'z', seg: 8, mat: metalMat(0x8b939e, 0.4), part: 'nidai' });
      });
    });
    /* うしろの ランプ・ナンバー */
    [1, -1].forEach(sz => {
      B.lamp({ x: nx - nlen / 2 - 0.02, y: ny + 0.16, z: sz * (W / 2 - 0.16), w: 0.04, h: 0.12, d: 0.14, color: PAL.lampR, strength: 1.0, aux: true });
    });
    plate(B, { x: nx - nlen / 2 - 0.02, y: ny + 0.16, z: 0, axis: 'x-' });

    B.wheel({ x: 1.05, r: 0.30, w: 0.18, spread: W / 2 - 0.08 });
    B.wheel({ x: -1.10, r: 0.30, w: 0.18, spread: W / 2 - 0.08 });
    wheelArch(B, { x: 1.05, r: 0.30, spread: W / 2 - 0.08, w: 0.30, mat: matte(0x30363f, 0.6) });
    wheelArch(B, { x: -1.10, r: 0.30, spread: W / 2 - 0.08, w: 0.30, mat: matte(0x30363f, 0.6) });
  }
};

/* -------------------------------------------------------- ゆうびん車 */
MODEL3D.post = {
  label: 'ゆうびん車',
  build: function (B) {
    const COL = 0xe5544b, W = 1.86;
    const bx = -0.95, blen = 2.60, bbot = 0.66, btop = 2.44;

    chassis(B, { x: 0.1, y: 0.56, len: 3.9, spread: 0.34 });
    /* まえの うんてんせき */
    B.box({ x: 1.30, y: (2.32 + bbot) / 2, z: 0, w: 1.70, h: 2.32 - bbot, d: W, r: 0.18, b: 0.05, color: COL, part: 'nidai', rough: 0.26 });
    B.box({ x: 1.30 + 0.79, y: 1.86, z: 0, w: 0.06, h: 0.88, d: W - 0.14, r: 0.09, rz: -0.14, mat: matte(0x11151b, 0.5) });
    B.glass({ x: 1.30 + 0.82, y: 1.86, z: 0, w: 0.06, h: 0.80, d: W - 0.26, r: 0.08, rz: -0.14, part: 'window' });
    wipers(B, { x: 2.16, y: 1.50, z: -0.20, rz: -0.14, len: 0.35, gap: 0.50 });
    [1, -1].forEach(sz => {
      B.box({ x: 1.05, y: 1.82, z: sz * (W / 2 - 0.030), w: 0.88, h: 0.76, d: 0.05, r: 0.07, mat: matte(0x11151b, 0.5) });
      B.glass({ x: 1.05, y: 1.82, z: sz * (W / 2 - 0.006), w: 0.80, h: 0.68, d: 0.05, r: 0.07, part: 'window' });
      B.seam({ x: 0.62, y: 1.42, z: sz * (W / 2 + 0.006), w: 0.026, h: 1.30, d: 0.03, part: 'door' });
      doorHandle(B, { x: 1.18, y: 1.36, z: sz * (W / 2 + 0.012), s: sz, len: 0.20 });
      doorMirror(B, { x: 1.95, y: 2.00, z: sz * (W / 2 - 0.02), s: sz, color: COL });
      B.lamp({ x: 2.18, y: 1.06, z: sz * (W / 2 - 0.24), w: 0.06, h: 0.18, d: 0.26, color: 0xfff2cf, strength: 1.4, part: 'lamp' });
    });
    B.box({ x: 2.16, y: 0.80, z: 0, w: 0.20, h: 0.28, d: W, r: 0.07, mat: matte(0x38404d, 0.55) });
    B.box({ x: 2.17, y: 1.10, z: 0, w: 0.04, h: 0.15, d: W * 0.5, r: 0.03, mat: matte(0x1e232b, 0.45) });
    plate(B, { x: 2.28, y: 0.80, z: 0, axis: 'x+' });
    /* うしろの ランプ・ナンバー・ステップ */
    tailLamps(B, { x: bx - blen / 2 - 0.06, y: 0.90, zOff: W / 2 - 0.32 });
    plate(B, { x: bx - blen / 2 - 0.13, y: 0.90, z: 0, axis: 'x-' });
    B.box({ x: bx - blen / 2 - 0.20, y: 0.48, z: 0, w: 0.32, h: 0.06, d: W - 0.40, r: 0.03, mat: matte(0x30363f, 0.6), part: 'nidai' });

    /* ==== うしろは てがみの ケースを ならべて つめる はこ ==== */
    B.box({ x: bx, y: bbot, z: 0, w: blen, h: 0.14, d: W, r: 0.04, color: 0x39404c, part: 'nidai' });
    B.box({ x: bx, y: btop + 0.07, z: 0, w: blen, h: 0.14, d: W, r: 0.06, color: COL, part: 'nidai', rough: 0.3 });
    B.box({ x: bx - blen / 2 - 0.05, y: (btop + bbot) / 2, z: 0, w: 0.10, h: btop - bbot, d: W, r: 0.05, color: COL, part: 'nidai', rough: 0.3 });
    B.box({ x: bx, y: (btop + bbot) / 2, z: -(W / 2 - 0.05), w: blen, h: btop - bbot, d: 0.10, r: 0.05, color: COL, part: 'nidai', rough: 0.3 });
    [1, -1].forEach(sz => {
      B.box({ x: bx, y: 1.72, z: sz * (W / 2 + 0.012), w: blen - 0.20, h: 0.30, d: 0.02, r: 0.01, mat: paint(0xf2f5f9, { rough: 0.3 }) });
    });
    /* まちごとに 分けた てがみの ケース */
    const CASE = [0xf2f5f9, 0xdfe6ee, 0xe8ecf1];
    [0.30, 0.86, 1.42].forEach((dy, row) => {
      B.box({ x: bx, y: bbot + dy, z: -0.28, w: blen - 0.20, h: 0.05, d: 0.90, r: 0.02, mat: matte(0x59616e, 0.7), part: 'nidai' });
      for (let i = 0; i < 5; i++) {
        B.box({
          x: bx - (blen - 0.50) / 2 + i * ((blen - 0.50) / 4), y: bbot + dy + 0.22,
          z: -0.28, w: 0.36, h: 0.38, d: 0.72, r: 0.03,
          mat: matte(CASE[(i + row) % 3], 0.7), part: 'nidai'
        });
      }
    });

    /* ==== うしろの とびらは よこへ すべらせて ひらく ====
       （せまい みちに とめても、ひらいた とびらが 外へ 出っぱらない）*/
    B.box({ x: bx, y: (btop + bbot) / 2, z: (W / 2 - 0.05), w: blen, h: btop - bbot, d: 0.10, r: 0.05, color: COL, part: 'nidai', rough: 0.3 });
    const slide = new THREE.Group();
    slide.position.set(bx - blen / 2 - 0.06, 0, 0);
    B.root.add(slide);
    B.box({ parent: slide, x: 0, y: (btop + bbot) / 2, z: 0, w: 0.10, h: btop - bbot - 0.04, d: W - 0.08, r: 0.05, color: COL, part: 'door', rough: 0.28 });
    B.box({ parent: slide, x: -0.02, y: 1.92, z: 0, w: 0.05, h: 0.56, d: W - 0.52, r: 0.05, mat: glassMat(B.quality), part: 'door' });
    B.box({ parent: slide, x: -0.06, y: 1.36, z: -0.52, w: 0.06, h: 0.07, d: 0.26, r: 0.02, mat: metalMat(PAL.chrome, 0.22), part: 'door' });
    /* すべる ための レール */
    B.box({ x: bx - blen / 2 - 0.06, y: btop - 0.02, z: 0.55, w: 0.08, h: 0.08, d: W + 1.5, r: 0.02, mat: metalMat(0x9aa3ae, 0.35), part: 'door' });
    B.anim('door', 'とびらを よこへ すべらせる', v => { slide.position.z = v * (W - 0.20); });

    B.wheel({ x: 1.25, r: 0.32, w: 0.20, spread: 0.78 });
    B.wheel({ x: -1.35, r: 0.32, w: 0.20, spread: 0.78 });
  }
};

/* -------------------------------------------------------- たくはい車 */
MODEL3D.delivery = {
  label: 'たくはい車',
  build: function (B) {
    const COL = 0x2f9e63, W = 2.00;
    const bx = -1.05, blen = 3.10, bbot = 0.86, btop = 2.92;

    chassis(B, { x: 0.1, y: 0.72, len: 4.8, spread: 0.36 });
    truckCab(B, { x: 1.75, len: 1.60, w: W, top: 2.70, floor: 0.80, color: COL });

    B.box({ x: bx, y: bbot, z: 0, w: blen, h: 0.14, d: W, r: 0.04, color: 0x39404c, part: 'shelf' });
    B.box({ x: bx, y: btop + 0.07, z: 0, w: blen, h: 0.14, d: W, r: 0.06, color: 0xf2f5f9, part: 'shelf', rough: 0.3 });
    B.box({ x: bx + blen / 2 + 0.05, y: (btop + bbot) / 2, z: 0, w: 0.10, h: btop - bbot, d: W, r: 0.05, color: COL, part: 'shelf', rough: 0.3 });
    [1, -1].forEach(sz => {
      B.box({ x: bx, y: (btop + bbot) / 2, z: sz * (W / 2 - 0.05), w: blen, h: btop - bbot, d: 0.10, r: 0.05, color: 0xf2f5f9, part: 'shelf', rough: 0.3 });
      B.box({ x: bx, y: 1.42, z: sz * (W / 2 + 0.012), w: blen - 0.16, h: 0.32, d: 0.02, r: 0.01, mat: paint(COL, { rough: 0.3 }) });
    });

    /* ==== とどける じゅんばんに ならべられる いくつもの たな ==== */
    [0.34, 0.96, 1.58].forEach((dy, row) => {
      B.box({ x: bx, y: bbot + dy, z: 0, w: blen - 0.18, h: 0.06, d: W - 0.30, r: 0.02, mat: matte(0x8f98a3, 0.6), part: 'shelf' });
      for (let i = 0; i < 4; i++) {
        for (let k = -1; k <= 1; k += 2) {
          B.box({
            x: bx - (blen - 0.70) / 2 + i * ((blen - 0.70) / 3), y: bbot + dy + 0.26,
            z: k * 0.38, w: 0.52, h: 0.44, d: 0.52, r: 0.03,
            mat: matte([0xd6c3a5, 0xc9b494, 0xe0d0b4][(i + row + (k > 0 ? 0 : 1)) % 3], 0.8), part: 'shelf'
          });
        }
      }
    });

    /* ==== うしろの とびらは 上へ まきあがる シャッター ==== */
    const sh = new THREE.Group();
    sh.position.set(bx - blen / 2 - 0.04, 0, 0);
    B.root.add(sh);
    B.box({ parent: sh, x: 0, y: (btop + bbot) / 2, z: 0, w: 0.09, h: btop - bbot - 0.04, d: W - 0.06, r: 0.03, mat: metalMat(0xc7ced7, 0.42), part: 'door' });
    for (let i = -4; i <= 4; i++) {
      B.box({ parent: sh, x: -0.05, y: (btop + bbot) / 2 + i * 0.22, z: 0, w: 0.03, h: 0.11, d: W - 0.16, r: 0.01, mat: metalMat(0xaeb7c2, 0.5), part: 'door' });
    }
    B.anim('door', 'シャッターを 上へ まきあげる', v => {
      sh.position.y = v * (btop - bbot - 0.20);
      sh.scale.y = 1 - v * 0.82;
    });

    /* うしろの ランプ・ナンバー・ステップ・マーカー */
    tailLamps(B, { x: bx - blen / 2 - 0.04, y: 0.72, zOff: W / 2 - 0.34 });
    plate(B, { x: bx - blen / 2 - 0.04, y: 0.72, z: 0.62, axis: 'x-' });
    B.box({ x: bx - blen / 2 - 0.20, y: 0.50, z: 0, w: 0.34, h: 0.06, d: W - 0.30, r: 0.03, mat: matte(0x30363f, 0.6), part: 'shelf' });
    [1, -1].forEach(sz => {
      B.lamp({ x: bx, y: bbot - 0.03, z: sz * (W / 2 + 0.012), w: 0.08, h: 0.055, d: 0.03, color: 0xffa63d, strength: 0.7, aux: true });
    });

    B.wheel({ x: 1.60, r: 0.38, w: 0.24, spread: 0.84 });
    B.wheel({ x: -1.60, r: 0.38, w: 0.24, spread: 0.84 });
    wheelArch(B, { x: -1.60, r: 0.38, spread: 0.84, w: 0.36, flap: true });
  }
};

/* -------------------------------------------------------- れいとう車 */
MODEL3D.reefer = {
  label: 'れいとう車',
  build: function (B) {
    const COL = 0xf2f5f9, ACC = 0x2f7fd0, W = 2.30;
    const bx = -1.25, blen = 4.60, bbot = 1.06, btop = 3.36;

    chassis(B, { x: -0.3, y: 0.88, len: 7.2, spread: 0.42 });
    truckCab(B, { x: 2.65, len: 1.90, w: W, top: 2.94, floor: 0.92, color: ACC });

    /* ==== まほうびんの ように あつい かべの にだい ==== */
    const TH = 0.26;                                   /* ← かべの あつさ */
    B.box({ x: bx, y: bbot, z: 0, w: blen, h: 0.22, d: W, r: 0.04, color: COL, part: 'wall', rough: 0.3 });
    B.box({ x: bx, y: btop + 0.11, z: 0, w: blen, h: 0.22, d: W, r: 0.06, color: COL, part: 'wall', rough: 0.3 });
    B.box({ x: bx + blen / 2 + 0.10, y: (btop + bbot) / 2, z: 0, w: TH, h: btop - bbot, d: W, r: 0.05, color: COL, part: 'wall', rough: 0.3 });
    B.box({ x: bx, y: (btop + bbot) / 2, z: -(W / 2 - TH / 2), w: blen, h: btop - bbot, d: TH, r: 0.05, color: COL, part: 'wall', rough: 0.3 });
    B.box({ x: bx, y: (btop + bbot) / 2, z: (W / 2 - TH / 2), w: blen, h: btop - bbot, d: TH, r: 0.05, color: COL, part: 'wall', rough: 0.3 });
    /* かべの きりくちが 見える ように、うしろは とびら 1まいだけ */
    const hinge = new THREE.Group();
    hinge.position.set(bx - blen / 2 - 0.05, 0, W / 2 - 0.10);
    B.root.add(hinge);
    B.box({ parent: hinge, x: 0, y: (btop + bbot) / 2, z: -(W / 2 - 0.16) / 1.0, w: TH, h: btop - bbot - 0.04, d: W - 0.30, r: 0.05, color: COL, part: 'wall', rough: 0.3 });
    B.box({ parent: hinge, x: -0.14, y: 1.75, z: -(W / 2 - 0.16), w: 0.05, h: 0.30, d: 0.10, r: 0.02, mat: metalMat(PAL.chrome, 0.25), part: 'wall' });
    B.anim('wall', 'うしろの とびらを あける', v => { hinge.rotation.y = -v * 1.75; });
    /* あつさが 分かる きりくち */
    [1, -1].forEach(sz => {
      B.box({ x: bx - blen / 2 - 0.02, y: (btop + bbot) / 2, z: sz * (W / 2 - TH / 2), w: 0.05, h: btop - bbot, d: TH + 0.02, r: 0.02, mat: matte(0xc7ced7, 0.6), part: 'wall' });
      B.box({ x: bx, y: 1.70, z: sz * (W / 2 + 0.012), w: blen - 0.20, h: 0.28, d: 0.02, r: 0.01, mat: paint(ACC, { rough: 0.3 }) });
    });

    /* ==== にだいの 前の、こおりよりも つめたく できる きかい ==== */
    B.box({ x: bx + blen / 2 + 0.34, y: 2.86, z: 0, w: 0.48, h: 1.05, d: W - 0.30, r: 0.08, mat: paint(0xe8ecf1, { metal: 0.3, rough: 0.32 }), part: 'cooler' });
    for (let i = -2; i <= 2; i++) {
      B.box({ x: bx + blen / 2 + 0.58, y: 2.86 + i * 0.18, z: 0, w: 0.05, h: 0.09, d: W - 0.50, r: 0.02, mat: matte(0x59616e, 0.6), part: 'cooler' });
    }
    B.cyl({ x: bx + blen / 2 + 0.60, y: 3.20, z: 0, r: 0.20, h: 0.10, axis: 'x', seg: 20, mat: matte(0x3c434e, 0.6), part: 'cooler' });
    B.lamp({ x: bx + blen / 2 + 0.60, y: 2.44, z: 0.42, w: 0.05, h: 0.10, d: 0.14, color: 0x6fd2ff, strength: 1.4, part: 'cooler' });
    /* とけた 水を ながす くだ・ランプ・ナンバー・マーカー・どろよけ */
    B.cyl({ x: bx - blen / 2 + 0.15, y: 0.68, z: W / 2 - 0.20, r: 0.025, h: 0.75, axis: 'y', seg: 8, mat: matte(0x9aa3ae, 0.5), part: 'wall' });
    tailLamps(B, { x: bx - blen / 2 - 0.06, y: 0.80, zOff: W / 2 - 0.40 });
    plate(B, { x: bx - blen / 2 - 0.06, y: 0.80, z: -0.55, axis: 'x-' });
    [1, -1].forEach(sz => {
      [-2.5, 0].forEach(mx => {
        B.lamp({ x: mx, y: bbot - 0.05, z: sz * (W / 2 + 0.012), w: 0.08, h: 0.055, d: 0.03, color: 0xffa63d, strength: 0.7, aux: true });
      });
      B.box({ x: -3.05, y: 0.34, z: sz * 0.97, w: 0.045, h: 0.50, d: 0.50, r: 0.02, mat: matte(0x1d2127, 0.85) });
    });

    B.wheel({ x: 2.45, r: 0.52, w: 0.30, spread: 0.96 });
    B.wheel({ x: -2.25, r: 0.52, w: 0.28, z: 0.84 });
    B.wheel({ x: -2.25, r: 0.52, w: 0.28, z: 1.10 });
    B.wheel({ x: -2.25, r: 0.52, w: 0.28, z: -0.84 });
    B.wheel({ x: -2.25, r: 0.52, w: 0.28, z: -1.10 });
    [2.45, -2.25].forEach(ax => {
      B.cyl({ x: ax, y: 0.52, z: 0, r: 0.10, h: 1.9, axis: 'z', seg: 14, mat: matte(PAL.frame, 0.6) });
    });
  }
};

/* ---------------------------------------------------- げんきんゆそう車 */
MODEL3D.cash = {
  label: 'げんきんゆそう車',
  build: function (B) {
    const COL = 0x39404c, ACC = 0xb9c0ca, W = 2.16;
    const bx = -0.95, blen = 3.40, bbot = 0.92, btop = 3.00;

    chassis(B, { x: 0, y: 0.78, len: 5.4, spread: 0.38 });

    /* うんてんせき（まども ちいさい）*/
    const cx = 2.05, clen = 1.75, cbot = 0.88, ctop = 2.90;
    B.box({ x: cx, y: (ctop + cbot) / 2, z: 0, w: clen, h: ctop - cbot, d: W, r: 0.14, b: 0.05, color: COL, part: 'safe', rough: 0.32 });
    B.box({ x: cx + clen / 2 - 0.095, y: 2.24, z: 0, w: 0.08, h: 0.60, d: W - 0.50, r: 0.06, rz: -0.12, mat: matte(0x11151b, 0.5) });
    B.glass({ x: cx + clen / 2 - 0.07, y: 2.24, z: 0, w: 0.12, h: 0.52, d: W - 0.60, r: 0.06, rz: -0.12, part: 'window' });
    wipers(B, { x: cx + clen / 2 - 0.03, y: 1.98, z: -0.15, rz: -0.12, len: 0.28, gap: 0.42 });
    [1, -1].forEach(sz => {
      /* かおぐらいの 大きさしか ない、あつい まど */
      B.box({ x: cx - 0.22, y: 2.22, z: sz * (W / 2 - 0.04), w: 0.42, h: 0.38, d: 0.12, r: 0.05, mat: glassMat(B.quality), part: 'window' });
      B.box({ x: cx - 0.22, y: 2.22, z: sz * (W / 2 - 0.01), w: 0.52, h: 0.48, d: 0.06, r: 0.05, mat: metalMat(0x8f98a3, 0.45), part: 'window' });
      B.seam({ x: cx - 0.62, y: 1.80, z: sz * (W / 2 + 0.006), w: 0.03, h: 1.55, d: 0.03, color: 0x7d858f, part: 'safe' });
      doorHandle(B, { x: cx - 0.30, y: 1.62, z: sz * (W / 2 + 0.012), s: sz, len: 0.20, dark: true });
      B.box({ x: cx + 0.55, y: 2.30, z: sz * (W / 2 + 0.10), w: 0.08, h: 0.26, d: 0.12, r: 0.04, mat: matte(0x2a2f38, 0.5), aux: true });
      B.lamp({ x: cx + clen / 2 + 0.02, y: 1.24, z: sz * (W / 2 - 0.26), w: 0.06, h: 0.18, d: 0.28, color: 0xfff2cf, strength: 1.4, part: 'safe' });
    });
    B.box({ x: cx + clen / 2 - 0.01, y: 0.98, z: 0, w: 0.24, h: 0.30, d: W + 0.02, r: 0.08, mat: matte(0x2a2f38, 0.55) });
    plate(B, { x: cx + clen / 2 + 0.11, y: 0.98, z: 0, axis: 'x+' });
    /* ぼうはんカメラ・むせんアンテナ・うしろの ランプ */
    B.box({ x: bx - blen / 2 - 0.14, y: btop - 0.20, z: 0.55, w: 0.10, h: 0.10, d: 0.14, r: 0.03, mat: matte(0x22262d, 0.5), part: 'safe' });
    B.cyl({ x: bx + 0.5, y: btop + 0.28, z: -0.5, r: 0.012, h: 0.42, axis: 'y', seg: 6, mat: matte(0x22262d, 0.4), aux: true });
    tailLamps(B, { x: bx - blen / 2 - 0.26, y: 0.78, zOff: W / 2 - 0.36 });
    plate(B, { x: bx - blen / 2 - 0.26, y: 0.78, z: 0.55, axis: 'x-' });

    /* ==== こじあけられない てつの あつい はこ ==== */
    B.box({ x: bx, y: (btop + bbot) / 2, z: 0, w: blen, h: btop - bbot, d: W, r: 0.06, b: 0.04, mat: paint(ACC, { metal: 0.55, rough: 0.34 }), part: 'safe' });
    /* ほきょうの ろっ骨 */
    [1, -1].forEach(sz => {
      for (let i = -2; i <= 2; i++) {
        B.box({ x: bx + i * 0.72, y: (btop + bbot) / 2, z: sz * (W / 2 + 0.02), w: 0.16, h: btop - bbot - 0.14, d: 0.06, r: 0.02, mat: metalMat(0x8f98a3, 0.4), part: 'safe' });
      }
      B.box({ x: bx, y: btop - 0.18, z: sz * (W / 2 + 0.02), w: blen - 0.10, h: 0.14, d: 0.05, r: 0.02, mat: metalMat(0x8f98a3, 0.4), part: 'safe' });
    });
    /* うしろの あつい とびらと、ふとい かんぬき */
    B.box({ x: bx - blen / 2 - 0.09, y: (btop + bbot) / 2, z: 0, w: 0.18, h: btop - bbot - 0.06, d: W - 0.10, r: 0.04, mat: paint(0x9aa3ae, { metal: 0.6, rough: 0.34 }), part: 'safe' });
    [1, -1].forEach(sy => {
      B.cyl({ x: bx - blen / 2 - 0.20, y: (btop + bbot) / 2 + sy * 0.44, z: 0, r: 0.075, h: W - 0.30, axis: 'z', seg: 14, mat: metalMat(0xdfe4ea, 0.2), part: 'safe' });
    });
    B.mesh(new THREE.TorusGeometry(0.16, 0.035, 8, 20), metalMat(0xdfe4ea, 0.22),
      { x: bx - blen / 2 - 0.22, y: (btop + bbot) / 2, z: 0, ry: Math.PI / 2, part: 'safe' });
    B.lamp({ x: bx, y: btop + 0.12, z: 0, w: 0.24, h: 0.14, d: 0.30, color: PAL.lampY, strength: 1.4, part: 'safe' });

    B.wheel({ x: 1.90, r: 0.44, w: 0.28, spread: 0.90 });
    B.wheel({ x: -1.75, r: 0.44, w: 0.26, z: 0.80 });
    B.wheel({ x: -1.75, r: 0.44, w: 0.26, z: 1.04 });
    B.wheel({ x: -1.75, r: 0.44, w: 0.26, z: -0.80 });
    B.wheel({ x: -1.75, r: 0.44, w: 0.26, z: -1.04 });
  }
};


/* ------------------------------------------------------------ トレーラー */
MODEL3D.trailer = {
  label: 'トレーラー',
  build: function (B) {
    const COL = 0x2f4a80, W = 2.48;

    /* ==== まえ（うんてんせき）==== */
    const head = new THREE.Group();
    head.position.set(4.60, 0, 0);
    B.root.add(head);
    [1, -1].forEach(sz => {
      B.box({ parent: head, x: -1.55, y: 0.92, z: sz * 0.44, w: 3.30, h: 0.26, d: 0.14, r: 0.03, mat: matte(PAL.frame, 0.62) });
    });
    truckCab(B, { parent: head, x: 0.30, len: 2.30, w: W, top: 3.42, floor: 1.00, color: COL, deflector: true });
    B.box({ parent: head, x: -1.55, y: 1.10, z: 0, w: 1.70, h: 0.18, d: W - 0.30, r: 0.04, mat: metalMat(0x8f98a3, 0.4), part: 'joint' });
    /* ==== くの字に おれる つなぎめ ==== */
    B.cyl({ parent: head, x: -1.55, y: 1.28, z: 0, r: 0.34, h: 0.24, seg: 24, mat: metalMat(0xb0b8c2, 0.3), part: 'joint' });
    B.box({ parent: head, x: -1.20, y: 1.24, z: 0, w: 0.70, h: 0.14, d: 0.55, r: 0.03, mat: metalMat(0x9aa3ae, 0.35), part: 'joint' });
    B.wheel({ parent: head, x: 1.05, r: 0.56, w: 0.34, spread: 1.02 });
    B.wheel({ parent: head, x: -1.95, r: 0.56, w: 0.30, z: 0.90 });
    B.wheel({ parent: head, x: -1.95, r: 0.56, w: 0.30, z: 1.19 });
    B.wheel({ parent: head, x: -1.95, r: 0.56, w: 0.30, z: -0.90 });
    B.wheel({ parent: head, x: -1.95, r: 0.56, w: 0.30, z: -1.19 });

    /* ==== うしろ（船にも でんしゃにも つみかえられる ながい コンテナ）==== */
    B.box({ x: -2.90, y: 1.12, z: 0, w: 11.6, h: 0.24, d: W - 0.20, r: 0.04, mat: matte(0x59616e, 0.6), part: 'container' });
    containerBox(B, { x: -3.10, y: 2.60, z: 0, len: 12.0, h: 2.60, w: W, color: 0x2b9c68, part: 'container' });
    B.cyl({ x: 2.70, y: 1.12, z: 0, r: 0.30, h: 0.20, seg: 22, mat: metalMat(0xb0b8c2, 0.3), part: 'joint' });
    [1, -1].forEach(sz => {
      B.box({ x: 1.55, y: 0.62, z: sz * 0.72, w: 0.22, h: 0.90, d: 0.22, r: 0.04, mat: matte(0x59616e, 0.6), part: 'joint' });
    });
    [-6.60, -7.90].forEach(ax => {
      [0.90, 1.19, -0.90, -1.19].forEach(z => B.wheel({ x: ax, r: 0.54, w: 0.30, z: z }));
      B.cyl({ x: ax, y: 0.54, z: 0, r: 0.10, h: 2.0, axis: 'z', seg: 14, mat: matte(PAL.frame, 0.6) });
    });
    /* トレーラーの うしろ: ランプ・ナンバー・おいこみぼうしバー・どろよけ */
    tailLamps(B, { x: -8.86, y: 0.86, zOff: W / 2 - 0.44 });
    plate(B, { x: -8.86, y: 0.86, z: 0, axis: 'x-' });
    B.box({ x: -8.72, y: 0.56, z: 0, w: 0.09, h: 0.15, d: W - 0.60, r: 0.03, mat: matte(0x2c323b, 0.6) });
    [1, -1].forEach(sz => {
      B.box({ x: -8.60, y: 0.36, z: sz * 1.04, w: 0.045, h: 0.55, d: 0.55, r: 0.02, mat: matte(0x1d2127, 0.85) });
      /* よこの ガードレール と マーカーランプ */
      [0.50, 0.72].forEach(gy => {
        B.box({ x: -3.4, y: gy, z: sz * 1.12, w: 4.6, h: 0.07, d: 0.04, r: 0.02, mat: metalMat(0xc3cad3, 0.35), aux: true });
      });
      [-7.5, -4.5, -1.5, 1.0].forEach(mx => {
        B.lamp({ x: mx, y: 1.20, z: sz * (W / 2 + 0.012), w: 0.09, h: 0.06, d: 0.03, color: 0xffa63d, strength: 0.8, aux: true });
      });
    });

    /* まがりみちでは くの字に おれる */
    B.anim('joint', 'まがりみちで くの字に おれる', v => {
      head.rotation.y = -v * 0.48;
      head.position.z = -v * 0.90;
    });
  }
};

/* -------------------------------------------------------- スクールバス */
MODEL3D.schoolbus = {
  label: 'スクールバス',
  build: function (B) {
    const COL = 0xf5c433, W = 2.36;
    const L = 8.20, FLOOR = 0.86, ROOF = 3.00;
    const gb = 1.66, gt = 2.56;

    chassis(B, { x: -0.3, y: 0.76, len: 7.4, spread: 0.42 });
    [1, -1].forEach(sz => {
      const zz = sz * (W / 2 - 0.05);
      B.box({ x: -0.55, y: (gb + FLOOR) / 2, z: zz, w: L - 1.7, h: gb - FLOOR, d: 0.10, r: 0.08, color: COL, part: 'body', rough: 0.28 });
      B.box({ x: -0.55, y: (gt + ROOF) / 2, z: zz, w: L - 1.7, h: ROOF - gt, d: 0.10, r: 0.06, color: COL, part: 'body', rough: 0.3 });
      for (let i = -3; i <= 3; i++) {
        B.box({ x: -0.55 + i * 0.94, y: (gt + gb) / 2, z: zz, w: 0.10, h: gt - gb, d: 0.10, r: 0.03, color: COL, part: 'body', rough: 0.3 });
      }
      B.box({ x: -0.55, y: (gt + gb) / 2, z: zz, w: L - 1.9, h: gt - gb, d: 0.06, r: 0.05, mat: clearGlassMat(), part: 'window' });
      B.box({ x: -0.55, y: 1.30, z: sz * (W / 2 + 0.012), w: L - 1.8, h: 0.20, d: 0.02, r: 0.01, mat: paint(0x1b2028, { rough: 0.3 }) });
    });
    B.box({ x: -0.30, y: FLOOR, z: 0, w: L - 1.2, h: 0.14, d: W, r: 0.05, color: 0x39404c, part: 'body' });
    B.box({ x: -0.30, y: ROOF + 0.06, z: 0, w: L - 1.1, h: 0.14, d: W, r: 0.08, color: 0xf2f5f9, part: 'body', rough: 0.3 });
    B.box({ x: -L / 2 + 0.05, y: (ROOF + FLOOR) / 2, z: 0, w: 0.12, h: ROOF - FLOOR, d: W - 0.04, r: 0.08, color: COL, part: 'body', rough: 0.28 });
    B.box({ x: L / 2 - 0.60, y: (ROOF + FLOOR) / 2, z: 0, w: 0.14, h: ROOF - FLOOR, d: W - 0.04, r: 0.10, color: COL, part: 'body', rough: 0.28 });
    B.glass({ x: L / 2 - 0.54, y: 2.22, z: 0, w: 0.09, h: 1.00, d: W - 0.30, r: 0.09, rz: -0.08, part: 'window' });
    [1, -1].forEach(sz => {
      B.lamp({ x: L / 2 - 0.48, y: 1.06, z: sz * (W / 2 - 0.30), w: 0.06, h: 0.20, d: 0.30, color: 0xfff2cf, strength: 1.4, part: 'lamp' });
      B.lamp({ x: -L / 2 - 0.02, y: 1.06, z: sz * (W / 2 - 0.30), w: 0.06, h: 0.20, d: 0.28, color: PAL.lampR, strength: 1.1, part: 'lamp' });
    });

    /* ==== 子どもの からだに あわせた ちいさめの ざせき（せもたれが 高い）==== */
    const seat = matte(0xd94f38, 0.8), back = matte(0xb03b28, 0.8);
    for (let i = 0; i < 7; i++) {
      const sx = 2.35 - i * 0.86;
      [1, -1].forEach(sz => {
        B.box({ x: sx, y: 1.24, z: sz * 0.64, w: 0.40, h: 0.09, d: 0.80, r: 0.04, mat: seat, part: 'seat' });
        B.box({ x: sx - 0.21, y: 1.62, z: sz * 0.64, w: 0.10, h: 0.80, d: 0.80, r: 0.05, mat: back, part: 'seat' });
      });
    }
    B.box({ x: 3.05, y: 1.24, z: 0.62, w: 0.48, h: 0.11, d: 0.54, r: 0.05, mat: matte(0x2f3640, 0.75), part: 'seat' });
    B.box({ x: 2.80, y: 1.58, z: 0.62, w: 0.12, h: 0.60, d: 0.54, r: 0.05, mat: matte(0x2f3640, 0.75), part: 'seat' });
    B.mesh(new THREE.TorusGeometry(0.21, 0.03, 8, 20), matte(0x22262d, 0.6),
      { x: 3.42, y: 1.68, z: 0.62, ry: Math.PI / 2, rz: -0.45 });

    /* ==== とびらの 下から 出て くる ひくい だん ==== */
    const dz = W / 2 - 0.05;
    const hinge = new THREE.Group();
    hinge.position.set(3.05, 0, dz);
    B.root.add(hinge);
    B.box({ parent: hinge, x: -0.48, y: (2.56 + FLOOR) / 2, z: 0, w: 0.96, h: 2.56 - FLOOR, d: 0.09, r: 0.05, color: 0xf2f5f9, part: 'body', rough: 0.3 });
    B.box({ parent: hinge, x: -0.48, y: 2.10, z: 0.012, w: 0.72, h: 0.82, d: 0.05, r: 0.05, mat: clearGlassMat(), part: 'body' });
    const st = new THREE.Group();
    st.position.set(2.55, 0, dz);
    B.root.add(st);
    [0.30, 0.58].forEach((h, i) => {
      B.box({ parent: st, x: 0, y: h, z: 0.16 + (1 - i) * 0.24, w: 1.00, h: 0.08, d: 0.32, r: 0.02, mat: matte(0xc7ced7, 0.6), part: 'step' });
    });
    st.visible = false;
    B.anim('step', 'とびらを あけて だんを 出す', v => {
      hinge.rotation.y = -v * 1.55;
      st.visible = v > 0.1;
      st.scale.set(1, 1, Math.max(0.05, v));
    });

    /* ミラー・ワイパー・バンパー・ナンバー・こどもの マーク */
    [1, -1].forEach(sz => {
      B.cyl({ x: L / 2 - 0.62, y: 2.66, z: sz * (W / 2 - 0.10), r: 0.020, h: 0.50, axis: 'y', tilt: sz * 0.45, seg: 8, mat: matte(0x22262d, 0.5), aux: true });
      B.box({ x: L / 2 - 0.40, y: 2.30, z: sz * (W / 2 + 0.08), w: 0.10, h: 0.44, d: 0.20, r: 0.05, mat: matte(0x22262d, 0.5), aux: true });
      B.box({ x: L / 2 - 0.44, y: 2.30, z: sz * (W / 2 + 0.08), w: 0.012, h: 0.36, d: 0.15, r: 0.04, mat: metalMat(0xd9e3ec, 0.05), aux: true });
    });
    wipers(B, { x: L / 2 - 0.49, y: 1.72, z: -0.30, rz: -0.08, len: 0.55, gap: 0.75 });
    B.box({ x: L / 2 - 0.42, y: 0.68, z: 0, w: 0.16, h: 0.30, d: W - 0.06, r: 0.06, mat: matte(0x2a2f38, 0.5) });
    B.box({ x: -L / 2 - 0.02, y: 0.68, z: 0, w: 0.14, h: 0.30, d: W - 0.06, r: 0.06, mat: matte(0x2a2f38, 0.5) });
    plate(B, { x: L / 2 - 0.34, y: 0.62, z: 0, axis: 'x+' });
    plate(B, { x: -L / 2 - 0.08, y: 0.62, z: 0, axis: 'x-' });
    /* 「こどもが のって います」の きいろい ひし形の 板 */
    B.box({ x: L / 2 - 0.52, y: 2.86, z: 0, w: 0.03, h: 0.30, d: 0.30, r: 0.02, ry: 0, mat: paint(0xf5c433, { rough: 0.35 }), aux: true });
    B.box({ x: -L / 2 - 0.09, y: 2.72, z: 0.55, w: 0.03, h: 0.26, d: 0.26, r: 0.02, mat: paint(0xf5c433, { rough: 0.35 }), aux: true });
    /* やねの マーカー と アーチ */
    roofMarkers(B, { x: L / 2 - 0.75, y: ROOF + 0.14, n: 2, gap: 1.2, color: 0xffa63d });
    [1, -1].forEach(sz => {
      B.mesh(curvedPlateGeom(0.62, 0.045, 0.20, Math.PI - 0.20, 0.06, 14), paint(COL, { rough: 0.3 }),
        { x: 2.65, y: 0.50, z: sz * 1.05 });
    });

    B.wheel({ x: 2.65, r: 0.50, w: 0.30, spread: 0.98 });
    B.wheel({ x: -2.55, r: 0.50, w: 0.28, z: 0.84 });
    B.wheel({ x: -2.55, r: 0.50, w: 0.28, z: 1.10 });
    B.wheel({ x: -2.55, r: 0.50, w: 0.28, z: -0.84 });
    B.wheel({ x: -2.55, r: 0.50, w: 0.28, z: -1.10 });
  }
};

/* ---------------------------------------------------------- かんこうバス */
MODEL3D.sightseeing = {
  label: 'かんこうバス',
  build: function (B) {
    const COL = 0xf2f5f9, ACC = 0x2f7fd0, W = 2.48;
    const L = 11.0, FLOOR = 1.32, ROOF = 3.52;      /* ゆかの 下が まるごと にもつ入れ */
    const gb = 2.02, gt = 3.06;

    [1, -1].forEach(sz => {
      const zz = sz * (W / 2 - 0.05);
      /* ==== ゆかの 下は まるごと にもつ入れ ==== */
      B.box({ x: -0.40, y: 0.86, z: zz, w: L - 1.4, h: 1.10, d: 0.10, r: 0.06, color: ACC, part: 'trunk', rough: 0.28 });
      B.box({ x: -0.55, y: (gb + FLOOR) / 2, z: zz, w: L - 1.6, h: gb - FLOOR, d: 0.10, r: 0.06, color: COL, part: 'body', rough: 0.28 });
      B.box({ x: -0.55, y: (gt + ROOF) / 2, z: zz, w: L - 1.6, h: ROOF - gt, d: 0.10, r: 0.06, color: COL, part: 'body', rough: 0.3 });
      for (let i = -4; i <= 4; i++) {
        B.box({ x: -0.55 + i * 1.06, y: (gt + gb) / 2, z: zz, w: 0.09, h: gt - gb, d: 0.10, r: 0.03, color: COL, part: 'body', rough: 0.3 });
      }
      B.box({ x: -0.55, y: (gt + gb) / 2, z: zz, w: L - 1.8, h: gt - gb, d: 0.06, r: 0.05, mat: clearGlassMat(), part: 'window' });
      B.box({ x: -0.55, y: 1.72, z: sz * (W / 2 + 0.012), w: L - 1.7, h: 0.16, d: 0.02, r: 0.01, mat: paint(0xf5c433, { rough: 0.3 }) });
      /* にもつ入れの とびら（3まい）*/
      for (let i = -1; i <= 1; i++) {
        B.box({ x: -0.40 + i * 2.55, y: 0.86, z: sz * (W / 2 + 0.012), w: 2.30, h: 0.94, d: 0.03, r: 0.05, mat: paint(0x2a63b0, { rough: 0.3 }), part: 'trunk' });
        B.box({ x: -0.40 + i * 2.55, y: 0.86, z: sz * (W / 2 + 0.03), w: 0.24, h: 0.06, d: 0.05, r: 0.02, mat: metalMat(PAL.chrome, 0.22), part: 'trunk' });
      }
    });
    B.box({ x: -0.30, y: FLOOR, z: 0, w: L - 1.2, h: 0.14, d: W, r: 0.05, color: 0x39404c, part: 'body' });
    B.box({ x: -0.30, y: 0.32, z: 0, w: L - 1.5, h: 0.16, d: W - 0.10, r: 0.05, color: 0x39404c, part: 'trunk' });
    B.box({ x: -0.30, y: ROOF + 0.06, z: 0, w: L - 1.1, h: 0.14, d: W, r: 0.08, color: COL, part: 'body', rough: 0.3 });
    B.box({ x: -L / 2 + 0.05, y: (ROOF + FLOOR) / 2, z: 0, w: 0.12, h: ROOF - FLOOR, d: W - 0.04, r: 0.08, color: COL, part: 'body', rough: 0.28 });
    B.box({ x: L / 2 - 0.05, y: (ROOF + FLOOR) / 2, z: 0, w: 0.12, h: ROOF - FLOOR, d: W - 0.04, r: 0.10, color: ACC, part: 'body', rough: 0.28 });
    B.glass({ x: L / 2 + 0.01, y: 2.70, z: 0, w: 0.09, h: 1.20, d: W - 0.28, r: 0.10, rz: -0.06, part: 'window' });
    [1, -1].forEach(sz => {
      B.lamp({ x: L / 2 + 0.03, y: 1.20, z: sz * (W / 2 - 0.32), w: 0.06, h: 0.22, d: 0.34, color: 0xfff2cf, strength: 1.4, part: 'lamp' });
      B.lamp({ x: -L / 2 - 0.03, y: 1.32, z: sz * (W / 2 - 0.32), w: 0.06, h: 0.22, d: 0.30, color: PAL.lampR, strength: 1.1, part: 'lamp' });
    });

    /* ==== うしろへ たおせる ざせき（テーブルと 足を のせる 台つき）==== */
    const seatM = matte(0x3a5f96, 0.8), backM = matte(0x2f4a80, 0.8);
    const seats = [];
    for (let i = 0; i < 9; i++) {
      const sx = 3.55 - i * 0.98;
      [1, -1].forEach(sz => {
        B.box({ x: sx, y: 1.70, z: sz * 0.68, w: 0.46, h: 0.10, d: 0.86, r: 0.05, mat: seatM, part: 'seat' });
        const bk = new THREE.Group();
        bk.position.set(sx - 0.24, 1.76, sz * 0.68);
        B.root.add(bk);
        seats.push(bk);
        B.box({ parent: bk, x: 0, y: 0.42, z: 0, w: 0.11, h: 0.84, d: 0.86, r: 0.05, mat: backM, part: 'seat' });
        B.box({ parent: bk, x: 0, y: 0.92, z: 0, w: 0.13, h: 0.24, d: 0.36, r: 0.05, mat: matte(0xf2f5f9, 0.7), part: 'seat' });
        /* テーブル と 足を のせる 台 */
        B.box({ x: sx - 0.52, y: 1.52, z: sz * 0.68, w: 0.34, h: 0.05, d: 0.60, r: 0.02, mat: matte(0xd6c3a5, 0.6), part: 'seat' });
        B.box({ x: sx + 0.28, y: 1.44, z: sz * 0.68, w: 0.30, h: 0.05, d: 0.52, r: 0.02, rz: 0.28, mat: matte(0x59616e, 0.7), part: 'seat' });
      });
    }
    B.anim('seat', 'ざせきを うしろへ たおす', v => {
      seats.forEach(g => { g.rotation.z = v * 0.34; });
    });

    /* 入口の とびら・ミラー・ワイパー・ナンバー・やねの クーラー */
    B.seam({ x: 3.85, y: (FLOOR + gt) / 2 + 0.10, z: W / 2 + 0.008, w: 0.026, h: gt - FLOOR - 0.20, d: 0.03, part: 'body' });
    B.seam({ x: 4.75, y: (FLOOR + gt) / 2 + 0.10, z: W / 2 + 0.008, w: 0.026, h: gt - FLOOR - 0.20, d: 0.03, part: 'body' });
    B.box({ x: 4.30, y: 2.30, z: W / 2 - 0.02, w: 0.72, h: 0.86, d: 0.05, r: 0.05, mat: clearGlassMat(), part: 'body' });
    doorHandle(B, { x: 4.68, y: 1.90, z: W / 2 + 0.012, s: 1, len: 0.20 });
    [1, -1].forEach(sz => {
      B.cyl({ x: L / 2 - 0.12, y: 3.10, z: sz * (W / 2 - 0.10), r: 0.020, h: 0.55, axis: 'y', tilt: sz * 0.45, seg: 8, mat: matte(0x22262d, 0.5), aux: true });
      B.box({ x: L / 2 + 0.10, y: 2.68, z: sz * (W / 2 + 0.10), w: 0.10, h: 0.46, d: 0.22, r: 0.05, mat: paint(ACC, { rough: 0.3 }), aux: true });
      B.box({ x: L / 2 + 0.06, y: 2.68, z: sz * (W / 2 + 0.10), w: 0.012, h: 0.38, d: 0.16, r: 0.04, mat: metalMat(0xd9e3ec, 0.05), aux: true });
    });
    wipers(B, { x: L / 2 + 0.05, y: 2.20, z: -0.35, rz: -0.06, len: 0.62, gap: 0.85 });
    plate(B, { x: L / 2 + 0.08, y: 0.78, z: 0, axis: 'x+' });
    plate(B, { x: -L / 2 - 0.08, y: 0.78, z: 0, axis: 'x-' });
    B.box({ x: -0.6, y: ROOF + 0.24, z: 0, w: 3.4, h: 0.22, d: 1.8, r: 0.08, mat: paint(0xe8ecf1, { rough: 0.4 }), part: 'body' });
    /* うしろの エンジンの あみ と マーカー */
    for (let i = 0; i < 4; i++) {
      B.seam({ x: -L / 2 - 0.012, y: 1.55 + i * 0.14, z: -0.6, w: 0.02, h: 0.05, d: 0.9, color: 0xb9c4d2 });
    }
    [1, -1].forEach(sz => {
      [-4.2, 0, 4.2].forEach(mx => {
        B.lamp({ x: mx, y: 0.42, z: sz * (W / 2 + 0.012), w: 0.09, h: 0.06, d: 0.03, color: 0xffa63d, strength: 0.8, aux: true });
      });
    });

    B.wheel({ x: 3.75, r: 0.52, w: 0.32, spread: 1.02 });
    B.wheel({ x: -3.35, r: 0.52, w: 0.28, z: 0.88 });
    B.wheel({ x: -3.35, r: 0.52, w: 0.28, z: 1.16 });
    B.wheel({ x: -3.35, r: 0.52, w: 0.28, z: -0.88 });
    B.wheel({ x: -3.35, r: 0.52, w: 0.28, z: -1.16 });
  }
};


/* -------------------------------------------------------- きゅうすい車 */
MODEL3D.water = {
  label: 'きゅうすい車',
  build: function (B) {
    const COL = 0x2f7fd0, W = 2.20;

    chassis(B, { x: -0.4, y: 0.80, len: 6.0, spread: 0.40 });
    truckCab(B, { x: 2.05, len: 1.80, w: W, top: 2.86, floor: 0.86, color: COL });

    /* ==== のみ水を きれいな まま はこべる、中を あらえる タンク ==== */
    const prof = [
      [0.03, -1.95], [0.55, -1.92], [0.82, -1.74], [0.95, -1.42],
      [1.00, -1.00], [1.02, 0], [1.00, 1.00], [0.95, 1.42],
      [0.82, 1.74], [0.55, 1.92], [0.03, 1.95]
    ].map(p => new THREE.Vector2(p[0], p[1]));
    const g = new THREE.LatheGeometry(prof, 40);
    g.computeVertexNormals();
    B.mesh(g, metalMat(0xdfe6ee, 0.16), { x: -1.30, y: 1.98, z: 0, rz: Math.PI / 2, part: 'tank' });
    [-1.0, 0.2, 1.4].forEach(dx => {
      B.mesh(new THREE.TorusGeometry(1.03, 0.05, 10, 30), metalMat(0x9aa3ae, 0.32),
        { x: -1.30 + dx, y: 1.98, z: 0, ry: Math.PI / 2, part: 'tank' });
    });
    /* 中を あらう ための 大きな ふた */
    B.cyl({ x: -1.30, y: 2.98, z: 0, r: 0.40, h: 0.16, seg: 24, mat: metalMat(0xb9c0ca, 0.26), part: 'tank' });
    B.mesh(new THREE.TorusGeometry(0.40, 0.035, 8, 24), metalMat(0x9aa3ae, 0.3),
      { x: -1.30, y: 3.06, z: 0, rx: Math.PI / 2, part: 'tank' });
    B.box({ x: -1.30, y: 0.98, z: 0, w: 4.20, h: 0.40, d: W - 0.10, r: 0.06, color: COL, part: 'tank', rough: 0.3 });
    /* はしご */
    for (let i = 0; i < 4; i++) {
      B.box({ x: -3.30, y: 1.20 + i * 0.44, z: 0, w: 0.05, h: 0.05, d: 0.62, r: 0.02, mat: metalMat(0x9aa3ae, 0.35), part: 'tank' });
    }

    /* ==== おおぜいが いちどに もらえる ように ならんだ じゃぐち ==== */
    const water = [];
    [1, -1].forEach(sz => {
      B.box({ x: -1.30, y: 1.36, z: sz * (W / 2 - 0.02), w: 3.30, h: 0.42, d: 0.12, r: 0.04, mat: metalMat(0xc7ced7, 0.4), part: 'tap' });
      for (let i = -2; i <= 2; i++) {
        const tx = -1.30 + i * 0.72;
        B.cyl({ x: tx, y: 1.28, z: sz * (W / 2 + 0.10), r: 0.05, h: 0.24, seg: 12, mat: metalMat(PAL.chrome, 0.2), part: 'tap' });
        B.cyl({ x: tx, y: 1.14, z: sz * (W / 2 + 0.16), r: 0.035, h: 0.16, axis: 'z', seg: 10, mat: metalMat(PAL.chrome, 0.2), part: 'tap' });
        B.mesh(new THREE.TorusGeometry(0.075, 0.018, 8, 16), matte(0x2f6fe0, 0.5),
          { x: tx, y: 1.44, z: sz * (W / 2 + 0.10), rx: Math.PI / 2, part: 'tap' });
        /* 出て くる 水 */
        const wm = B.cyl({
          x: tx, y: 0.72, z: sz * (W / 2 + 0.24), r: 0.025, h: 0.72, seg: 8,
          mat: new THREE.MeshPhysicalMaterial({
            color: 0x9fd6f5, roughness: 0.05, metalness: 0, transparent: true, opacity: 0.55, transmission: 0
          }), part: 'tap'
        });
        wm.visible = false;
        water.push(wm);
      }
    });
    B.anim('tap', 'じゃぐちから 水を 出す', v => {
      water.forEach(m => { m.visible = v > 0.1; m.scale.y = Math.max(0.05, v); });
    });

    /* かいてんとう・うしろの ランプ・ナンバー・どろよけ */
    B.lamp({ x: 2.05, y: 2.98, z: 0, w: 0.15, h: 0.14, d: 0.15, color: 0xffa63d, strength: 1.4, aux: true });
    tailLamps(B, { x: -3.34, y: 0.78, zOff: W / 2 - 0.38 });
    plate(B, { x: -3.34, y: 0.78, z: 0, axis: 'x-' });
    [1, -1].forEach(sz => {
      B.box({ x: -2.62, y: 0.32, z: sz * 0.92, w: 0.045, h: 0.46, d: 0.46, r: 0.02, mat: matte(0x1d2127, 0.85) });
    });

    B.wheel({ x: 1.90, r: 0.44, w: 0.26, spread: 0.90 });
    B.wheel({ x: -1.95, r: 0.44, w: 0.26, z: 0.80 });
    B.wheel({ x: -1.95, r: 0.44, w: 0.26, z: 1.04 });
    B.wheel({ x: -1.95, r: 0.44, w: 0.26, z: -0.80 });
    B.wheel({ x: -1.95, r: 0.44, w: 0.26, z: -1.04 });
  }
};

/* ---------------------------------------------------- すいどうこうじ車 */
MODEL3D.waterworks = {
  label: 'すいどうこうじ車',
  build: function (B) {
    const COL = 0x2b9c68, W = 2.10;

    chassis(B, { x: -0.2, y: 0.76, len: 5.4, spread: 0.38 });
    truckCab(B, { x: 1.85, len: 1.75, w: W, top: 2.76, floor: 0.82, color: COL });
    lightBar(B, { x: 1.85, y: 2.88, w: 1.30, n: 4, colors: [PAL.lampY, 0xfff0d0], part: 'lamp' });

    /* ==== よこの はこに、くだや どうぐが しゅるいごとに 分けて ==== */
    const bx = -0.75, blen = 2.60, bbot = 0.92, btop = 2.10;
    B.box({ x: bx, y: (btop + bbot) / 2, z: 0, w: blen, h: btop - bbot, d: W, r: 0.08, color: COL, part: 'box', rough: 0.3 });
    const doors = [];
    [1, -1].forEach(sz => {
      const hg = new THREE.Group();
      hg.position.set(bx, btop - 0.04, sz * (W / 2 - 0.03));
      B.root.add(hg);
      doors.push({ g: hg, sz: sz });
      B.box({ parent: hg, x: 0, y: -(btop - bbot) / 2, z: 0, w: blen - 0.08, h: btop - bbot - 0.08, d: 0.07, r: 0.04, mat: metalMat(0xc7ced7, 0.42), part: 'box' });
      /* 中の たな（しゅるいごとに 分けた くだと どうぐ）*/
      [0.32, 0.82].forEach((dy, row) => {
        B.box({ x: bx, y: bbot + dy, z: sz * (W / 2 - 0.28), w: blen - 0.20, h: 0.05, d: 0.42, r: 0.02, mat: matte(0x59616e, 0.7), part: 'box' });
        for (let i = 0; i < 4; i++) {
          const px = bx - (blen - 0.55) / 2 + i * ((blen - 0.55) / 3);
          if ((i + row) % 2 === 0) {
            B.cyl({ x: px, y: bbot + dy + 0.16, z: sz * (W / 2 - 0.28), r: 0.11, h: 0.36, axis: 'x', seg: 14, mat: matte([0x2f6fe0, 0xf5c433, 0xe5544b][(i + row) % 3], 0.7), part: 'box' });
          } else {
            B.box({ x: px, y: bbot + dy + 0.16, z: sz * (W / 2 - 0.28), w: 0.30, h: 0.26, d: 0.32, r: 0.03, mat: matte([0xef7127, 0x9aa3ae, 0x2b9c68][(i + row) % 3], 0.75), part: 'box' });
          }
        }
      });
    });
    B.anim('box', 'よこの はこを ひらく', v => {
      doors.forEach(d => { d.g.rotation.x = d.sz * v * 1.55; });
    });

    /* ==== うしろの、どうろを ほって 土の 中の くだを 出す ちいさな うで ==== */
    const base = new THREE.Group();
    base.position.set(-2.45, 1.02, 0);
    B.root.add(base);
    B.box({ x: -2.45, y: 0.88, z: 0, w: 0.90, h: 0.36, d: 1.30, r: 0.06, color: COL, part: 'arm', rough: 0.3 });
    B.cyl({ parent: base, x: 0, y: 0.10, z: 0, r: 0.28, h: 0.24, seg: 20, mat: metalMat(0x9aa3ae, 0.4), part: 'arm' });
    const boom = new THREE.Group();
    boom.position.set(0, 0.24, 0);
    base.add(boom);
    B.box({ parent: boom, x: 0.85, y: 0, z: 0, w: 1.80, h: 0.28, d: 0.26, r: 0.06, color: 0xf0b21c, part: 'arm', rough: 0.32 });
    const stick = new THREE.Group();
    stick.position.set(1.70, 0, 0);
    boom.add(stick);
    B.box({ parent: stick, x: 0.62, y: 0, z: 0, w: 1.35, h: 0.22, d: 0.20, r: 0.05, color: 0xf6c44a, part: 'arm', rough: 0.32 });
    const bkt = new THREE.Group();
    bkt.position.set(1.25, 0, 0);
    stick.add(bkt);
    B.mesh(curvedPlateGeom(0.36, 0.055, -0.10, 2.20, 0.52, 14), metalMat(0x9099a5, 0.42), { parent: bkt, part: 'arm' });
    for (let i = 0; i < 3; i++) {
      B.box({
        parent: bkt, x: Math.cos(-0.10) * 0.47, y: Math.sin(-0.10) * 0.47, z: (-1 + i) * 0.16,
        w: 0.20, h: 0.08, d: 0.09, r: 0.02, mat: metalMat(0xc8cfd8, 0.25), part: 'arm'
      });
    }
    /* ほった あなと 土の 中の くだ */
    const hole = new THREE.Group();
    B.root.add(hole);
    B.box({ parent: hole, x: -4.35, y: 0.02, z: 0, w: 1.60, h: 0.05, d: 1.30, r: 0.02, mat: matte(0x4a413a, 0.95), part: 'arm' });
    B.cyl({ parent: hole, x: -4.35, y: 0.10, z: 0, r: 0.16, h: 1.30, axis: 'z', seg: 16, mat: matte(0x2f6fe0, 0.7), part: 'arm' });
    hole.visible = false;

    const pose = v => {
      base.rotation.z = THREE.MathUtils.lerp(0.30, -0.06, v);
      boom.rotation.z = THREE.MathUtils.lerp(-0.30, 0.10, v);
      stick.rotation.z = THREE.MathUtils.lerp(-2.20, -1.55, v);
      bkt.rotation.z = THREE.MathUtils.lerp(0.90, 0.10, v);
      hole.visible = v > 0.5;
    };
    pose(0);
    B.anim('arm', 'ちいさな うでを のばして ほる', pose);

    /* うしろの ランプ・ナンバー・こうじの コーン */
    tailLamps(B, { x: -2.94, y: 0.74, zOff: W / 2 - 0.36 });
    plate(B, { x: -2.94, y: 0.74, z: 0.55, axis: 'x-' });
    [[-3.6, 0.85], [-3.6, -0.85]].forEach(([cx2, cz]) => {
      B.cyl({ x: cx2, y: 0.30, z: cz, r: 0.06, r2: 0.20, h: 0.58, seg: 16, mat: matte(0xef7127, 0.8), part: 'arm' });
      B.box({ x: cx2, y: 0.02, z: cz, w: 0.42, h: 0.05, d: 0.42, r: 0.02, mat: matte(0xd9600f, 0.85), part: 'arm' });
    });

    B.wheel({ x: 1.70, r: 0.42, w: 0.26, spread: 0.86 });
    B.wheel({ x: -1.55, r: 0.42, w: 0.26, spread: 0.86 });
    wheelArch(B, { x: -1.55, r: 0.42, spread: 0.86, w: 0.40, flap: true });
  }
};

/* ------------------------------------------------------ いどうはんばい車 */
MODEL3D.shop = {
  label: 'いどうはんばい車',
  build: function (B) {
    const COL = 0x2f9e63, W = 2.06;
    const bx = -0.55, blen = 3.40, bbot = 0.94, btop = 2.96;

    chassis(B, { x: 0.1, y: 0.76, len: 5.2, spread: 0.38 });
    truckCab(B, { x: 2.05, len: 1.70, w: W, top: 2.76, floor: 0.88, color: COL });

    B.box({ x: bx, y: bbot, z: 0, w: blen, h: 0.16, d: W, r: 0.04, color: 0x39404c, part: 'shelf' });
    B.box({ x: bx, y: btop + 0.08, z: 0, w: blen, h: 0.16, d: W, r: 0.06, color: 0xf2f5f9, part: 'shelf', rough: 0.3 });
    B.box({ x: bx - blen / 2 - 0.05, y: (btop + bbot) / 2, z: 0, w: 0.10, h: btop - bbot, d: W, r: 0.06, color: COL, part: 'shelf', rough: 0.3 });
    B.box({ x: bx + blen / 2 + 0.05, y: (btop + bbot) / 2, z: 0, w: 0.10, h: btop - bbot, d: W, r: 0.06, color: COL, part: 'shelf', rough: 0.3 });
    B.box({ x: bx, y: (btop + bbot) / 2, z: -(W / 2 - 0.05), w: blen, h: btop - bbot, d: 0.10, r: 0.05, color: COL, part: 'shelf', rough: 0.3 });

    /* ==== その まま しなものが ならぶ たな ==== */
    const GOODS = [0xe5544b, 0xf5c433, 0x2f7fd0, 0xef7127, 0x9c6ee0, 0x3aa8b8];
    [0.42, 0.98].forEach((dy, row) => {
      B.box({ x: bx, y: bbot + dy, z: -0.14, w: blen - 0.28, h: 0.06, d: 0.60, r: 0.02, mat: matte(0xd6c3a5, 0.7), part: 'shelf' });
      for (let i = 0; i < 9; i++) {
        B.box({
          x: bx - (blen - 0.55) / 2 + i * ((blen - 0.55) / 8), y: bbot + dy + 0.17,
          z: -0.14, w: 0.22, h: 0.28, d: 0.46, r: 0.03,
          mat: matte(GOODS[(i + row * 2) % GOODS.length], 0.75), part: 'shelf'
        });
      }
    });
    /* ==== たなの いちぶは ひえた ケース ==== */
    B.box({ x: bx + 1.05, y: bbot + 1.60, z: -0.16, w: 1.15, h: 0.72, d: 0.62, r: 0.05, mat: metalMat(0xc7ced7, 0.35), part: 'cooler' });
    B.box({ x: bx + 1.05, y: bbot + 1.62, z: 0.13, w: 1.02, h: 0.58, d: 0.06, r: 0.03, mat: clearGlassMat(), part: 'cooler' });
    [0, 1].forEach(k => {
      for (let i = 0; i < 4; i++) {
        B.box({
          x: bx + 0.65 + i * 0.26, y: bbot + 1.42 + k * 0.34, z: -0.16,
          w: 0.20, h: 0.26, d: 0.34, r: 0.03, mat: matte(k ? 0xf2f5f9 : 0xe8896f, 0.75), part: 'cooler'
        });
      }
    });
    B.lamp({ x: bx + 1.05, y: bbot + 1.92, z: -0.16, w: 0.90, h: 0.05, d: 0.10, color: 0x9fd6f5, strength: 1.2, part: 'cooler' });

    /* ==== よこの かべが やねの ように 上へ ひらく ==== */
    const WH = 1.20;
    const wing = new THREE.Group();
    wing.position.set(bx, btop - 0.04, W / 2 - 0.05);
    B.root.add(wing);
    B.box({ parent: wing, x: 0, y: -WH / 2, z: 0, w: blen - 0.06, h: WH, d: 0.09, r: 0.05, color: COL, part: 'shelf', rough: 0.28 });
    B.box({ parent: wing, x: 0, y: -WH / 2, z: 0.012, w: blen - 0.55, h: WH - 0.40, d: 0.04, r: 0.04, mat: paint(0xf2f5f9, { rough: 0.3 }), part: 'shelf' });
    [1, -1].forEach(sx => {
      B.cyl({ parent: wing, x: sx * (blen / 2 - 0.30), y: -WH + 0.04, z: 0.32, r: 0.022, h: 0.66, seg: 8, tilt: 0.55, mat: metalMat(0xb9c0ca, 0.3), part: 'shelf' });
    });
    B.box({ x: bx, y: bbot + 0.34, z: W / 2 - 0.05, w: blen - 0.06, h: 0.68, d: 0.09, r: 0.05, color: COL, part: 'shelf', rough: 0.28 });
    /* ひらいた かべの うらは 赤白の 日よけ（テント）もよう */
    for (let i = 0; i < 6; i++) {
      B.box({ parent: wing, x: -blen / 2 + 0.35 + i * (blen - 0.60) / 5, y: -WH / 2, z: -0.055, w: (blen - 0.60) / 10, h: WH - 0.16, d: 0.012, r: 0.01,
        mat: paint(i % 2 ? 0xe5544b : 0xf2f5f9, { rough: 0.5 }), part: 'shelf' });
    }
    B.anim('shelf', 'よこの かべを 上へ ひらく', v => { wing.rotation.x = -v * 1.48; });
    /* おきゃくさん用の ふみ台（車体に そわせて おいて ある）・うしろの ランプ・ナンバー */
    B.box({ x: bx, y: 0.20, z: W / 2 + 0.14, w: 0.95, h: 0.09, d: 0.34, r: 0.03, mat: matte(0xc7ced7, 0.6), part: 'counter' });
    B.glass({ x: bx - blen / 2 - 0.06, y: (btop + bbot) / 2 + 0.35, z: 0, w: 0.05, h: 0.55, d: 1.05, r: 0.06, part: 'window' });
    tailLamps(B, { x: bx - blen / 2 - 0.06, y: 0.80, zOff: W / 2 - 0.34 });
    plate(B, { x: bx - blen / 2 - 0.06, y: 0.80, z: 0, axis: 'x-' });

    B.wheel({ x: 1.90, r: 0.40, w: 0.24, spread: 0.86 });
    B.wheel({ x: -1.75, r: 0.40, w: 0.24, spread: 0.86 });
    wheelArch(B, { x: 1.90, r: 0.40, spread: 0.86, w: 0.38 });
    wheelArch(B, { x: -1.75, r: 0.40, spread: 0.86, w: 0.38, flap: true });
  }
};

/* -------------------------------------------------------- ガスこうじ車 */
MODEL3D.gas = {
  label: 'ガスこうじ車',
  build: function (B) {
    const COL = 0xf2f5f9, ACC = 0x2f7fd0, W = 1.94;
    const bx = -0.85, blen = 2.60, bbot = 0.76, btop = 2.50;

    chassis(B, { x: 0.1, y: 0.62, len: 4.4, spread: 0.34 });
    truckCab(B, { x: 1.60, len: 1.60, w: W, top: 2.40, floor: 0.70, color: ACC });

    /* どうぐを つむ からだ */
    B.box({ x: bx, y: (btop + bbot) / 2, z: 0, w: blen, h: btop - bbot, d: W, r: 0.08, color: COL, part: 'detector', rough: 0.3 });
    [1, -1].forEach(sz => {
      for (let i = -1; i <= 1; i++) {
        B.box({ x: bx + i * 0.85, y: (btop + bbot) / 2, z: sz * (W / 2 + 0.012), w: 0.72, h: btop - bbot - 0.24, d: 0.03, r: 0.04, mat: metalMat(0xc7ced7, 0.42), part: 'detector' });
      }
      B.box({ x: bx, y: 1.34, z: sz * (W / 2 + 0.03), w: blen - 0.20, h: 0.16, d: 0.02, r: 0.01, mat: paint(ACC, { rough: 0.3 }) });
    });
    B.box({ x: bx, y: btop + 0.06, z: 0, w: blen + 0.06, h: 0.12, d: W + 0.04, r: 0.05, color: COL, part: 'detector', rough: 0.3 });

    /* ==== 目に 見えない ガスが もれて いないかを 音で しらせる きかい ==== */
    const det = new THREE.Group();
    det.position.set(bx - 1.55, 0, 0.45);
    B.root.add(det);
    B.box({ parent: det, x: 0, y: 0.72, z: 0, w: 0.42, h: 0.52, d: 0.34, r: 0.06, mat: paint(0xf5c433, { rough: 0.35 }), part: 'detector' });
    B.box({ parent: det, x: 0.02, y: 0.86, z: 0.18, w: 0.26, h: 0.20, d: 0.03, r: 0.02, mat: lampMat(0x8fe8b0, 0.7), part: 'detector' });
    /* 音を 出す ところ */
    for (let i = 0; i < 3; i++) {
      B.mesh(new THREE.TorusGeometry(0.10 + i * 0.055, 0.014, 8, 20), matte(0x2b3038, 0.6),
        { parent: det, x: -0.22, y: 0.72, z: 0, ry: Math.PI / 2, part: 'detector' });
    }
    /* 地めんに あてる ぼう（センサー）*/
    B.cyl({ parent: det, x: 0.06, y: 0.36, z: 0, r: 0.022, h: 0.72, seg: 8, tilt: 0.16, mat: metalMat(0x9aa3ae, 0.35), part: 'detector' });
    B.cyl({ parent: det, x: 0.12, y: 0.04, z: 0, r: 0.09, h: 0.08, seg: 16, mat: matte(0x59616e, 0.6), part: 'detector' });
    B.box({ parent: det, x: -0.02, y: 1.06, z: 0, w: 0.30, h: 0.06, d: 0.06, r: 0.02, mat: matte(0x3c434e, 0.6), part: 'detector' });

    /* ==== 上で ゆっくり 光る きいろい ランプ ==== */
    const beacon = new THREE.Group();
    beacon.position.set(bx, btop + 0.30, 0);
    B.root.add(beacon);
    B.cyl({ parent: beacon, x: 0, y: -0.10, z: 0, r: 0.17, h: 0.10, seg: 20, mat: matte(0x2b3038, 0.55), part: 'lamp' });
    B.cyl({ parent: beacon, x: 0, y: 0.10, z: 0, r: 0.16, h: 0.30, seg: 20, mat: lampMat(PAL.lampY, 1.5), part: 'lamp' });
    B.box({ parent: beacon, x: 0.10, y: 0.10, z: 0, w: 0.14, h: 0.28, d: 0.06, r: 0.02, mat: matte(0x8f6a1f, 0.5), part: 'lamp' });
    B.cyl({ parent: beacon, x: 0, y: 0.27, z: 0, r: 0.17, h: 0.05, seg: 20, mat: matte(0x2b3038, 0.55), part: 'lamp' });
    B.spin.push({ obj: beacon, axis: 'y', speed: 0 });
    const si = B.spin.length - 1;
    B.anim('lamp', 'ランプを ゆっくり 光らせる', v => { B.spin[si].speed = v * 1.6; });

    /* こうじの しるし（コーン）*/
    [[-2.65, 0.95], [-2.65, -0.95]].forEach(([cx2, cz]) => {
      B.cyl({ x: cx2, y: 0.30, z: cz, r: 0.06, r2: 0.20, h: 0.58, seg: 16, mat: matte(0xef7127, 0.8), part: 'lamp' });
      B.box({ x: cx2, y: 0.02, z: cz, w: 0.42, h: 0.05, d: 0.42, r: 0.02, mat: matte(0xd9600f, 0.85), part: 'lamp' });
    });

    /* うしろの ランプ・ナンバー・ステップ */
    tailLamps(B, { x: bx - blen / 2 - 0.04, y: 0.62, zOff: W / 2 - 0.30 });
    plate(B, { x: bx - blen / 2 - 0.04, y: 0.62, z: 0, axis: 'x-' });
    B.box({ x: bx - blen / 2 - 0.18, y: 0.40, z: 0, w: 0.30, h: 0.055, d: W - 0.40, r: 0.03, mat: matte(0x30363f, 0.6), part: 'detector' });

    B.wheel({ x: 1.45, r: 0.36, w: 0.22, spread: 0.80 });
    B.wheel({ x: -1.45, r: 0.36, w: 0.22, spread: 0.80 });
    wheelArch(B, { x: 1.45, r: 0.36, spread: 0.80, w: 0.34 });
    wheelArch(B, { x: -1.45, r: 0.36, spread: 0.80, w: 0.34 });
  }
};

export { createViewer, MODEL3D, Builder, THREE, PAL, paint, metalMat, matte, glassMat };
