# 3Dの じどう車ずかん（試作）

SVGイラストの かわりに、**ブラウザの 中で 組み立てた 3Dモデル**を まわして 見られるように
した ものです。トラック・クレーン車・ミキサー車の 3台を つくって あります。

- デモ: `demo3d.html` をブラウザで開く（`python3 -m http.server` の下で）
- 本体: `car3d.js`（エンジン＋モデル）/ `car3d.css` / `vendor/three.module.min.js`

---

## なぜ「写真」ではなく 3D なのか

| | 実写真 | AI生成画像 | 3Dモデル（これ） |
| --- | --- | --- | --- |
| 角度をかえて見る | ✗ 撮った1枚だけ | △ 角度ごとに別画像 | **◎ 自由** |
| 部位ハイライト | ✗ できない | ✗ できない | **◎ できる** |
| 著作権 | △ 要確認 | △ 学習元の問題 | **◎ 自作** |
| つくりの正しさ | ◎ | ✗ 形がくずれる事故が多い | ◎ 自分で決める |
| 60台そろえる手間 | 大 | 中 | 大 |

`assets/README.md` に書いてある「写真にすると 部位ハイライトが 使えない」という
いちばんの 弱点が、3Dなら **なくなります**。むしろ、SVGでは 見せられなかった
「クレーン車の 四本の あしが 前後左右に ひろがって いる」ことなどが、
まわすだけで 分かるように なります。

**正直なところ**: 見た目は「きれいな CG（製品カタログの 3D図）」で、
写真そのものでは ありません。1年生の 観察用としては、写真より 形が はっきりして いて
かえって 見やすい、という 判断で つくって あります。

---

## つかいかた（コード）

```js
import { createViewer, MODEL3D } from './car3d.js';

const v = createViewer(document.querySelector('#stage'), 'truck');

v.highlight('nidai');      // その部分だけ 光る（まわりは 暗くなる）
v.focusPart('nidai');      // カメラが そこへ 飛ぶ
v.clearHighlight();

v.setView(-1.57, 1.4);     // よこから 見る（az, pl）
v.resetView();
v.showRuler(true);         // 1メートルのますめ ＋ 1年生（1.2m）
v.setAutoRotate(true);

v.screenPos('nidai');      // → {x, y, visible}  ①②③の 印を 画面に 出すため
v.pick(clientX, clientY);  // → 'nidai'          さわった ところの 部品名
v.meters();                // → {length, height, width}（メートル）
v.parts();                 // → ['nidai','tire', ...]
v.dispose();
```

`part` の 名まえは `car-art.js` の `data-part` / `parts-data.js` の キーと **同じ**です。
そのため `cars-data.js` の `tsukuri[].part` を そのまま つかえます。

---

## じどう車を 足す

`car3d.js` のいちばん下に、`car-art.js` と 同じ かんかくで 書きます。

```js
MODEL3D.truck = {
  label: 'トラック',
  build: function (B) {
    B.box({ x: -1.5, y: 2.5, z: 0, w: 9.2, h: 2.7, d: 2.49,
            r: 0.10, color: 0xd2d9e2, part: 'nidai', metal: 0.6, rough: 0.26 });
    B.wheel({ x: 4.35, r: 0.535, w: 0.34, spread: 1.03 });
    B.glass({ x: 5.6, y: 2.7, z: 0, w: 0.1, h: 1.0, d: 2.1, part: 'window' });
    B.lamp({ x: 5.7, y: 1.1, z: 0.9, part: 'lamp' });
  }
};
```

### きまりごと

| | |
| --- | --- |
| たんい | **1たんい ＝ 1メートル**（SVGの 28たんい＝1mとは ちがうので 注意） |
| 地面 | `y = 0`。車の まん中が `x = 0` |
| むき | うしろ → まえ が `+x`、上が `+y`、右が `+z` |
| 部品名 | 説明したい ところに `part: 'nidai'` を つける（`parts-data.js` と そろえる） |
| ミラーなど | `aux: true` を つけると 「はば 何メートル」の 計算から はずれる |

### 道具

| | |
| --- | --- |
| `B.box({x,y,z,w,h,d,r,color,metal,rough,clear,part})` | かどの まるい 箱（面取りつき） |
| `B.cyl({x,y,z,r,r2,h,axis,seg,part})` | つつ。`axis` は `'x'`/`'y'`/`'z'` |
| `B.wheel({x,r,w,spread})` / `({x,r,w,z})` | タイヤ（左右セット／片がわ）。`lift` で うかせる |
| `B.glass({x,y,z,w,h,d,part})` | まど |
| `B.lamp({x,y,z,color,strength,part})` | 光る ライト |
| `B.seam({...})` | うすい すじ（とびらの あわせめ など） |
| `B.mesh(geometry, material, {x,y,z,part})` | すきな かたち（Lathe・Tube など） |
| `B.spin.push({obj, axis, speed})` | ぐるぐる まわす（ミキサー車の ドラム） |
| `truckCab(B, {x,len,w,top,floor,color})` | トラック系の うんてんせき 一式 |
| `chassis(B, {x,y,len,spread,tank})` | フレームと 燃料タンク |

`selftest.html` と 同じ かんがえかたで、`MODEL3D` の part が
`parts-data.js` に そろって いるかを 確かめる チェックを 足すと 安全です。

---

## いまの ずかんに 組みこむ

3Dは モジュール（`type="module"`）なので、`index.html` に 1行 足すだけです。

### 1. 詳細ページに 「3Dで 見る」を 足す

```html
<!-- index.html の <head> -->
<link rel="stylesheet" href="car3d.css">
```

```js
// app.js — 絵を 出して いる ところ（artHTML のあたり）
// photo より さきに 3Dモデルが あるか 見る
import('./car3d.js').then(({ createViewer, MODEL3D }) => {
  if (!MODEL3D[car.art]) return;              // 3Dが ない車は これまで どおり SVG
  const v = createViewer(stage, car.art);
  window.__view3d = v;
});
```

`highlightPart(part)` の 中で、SVGが なければ `window.__view3d.highlight(part)` を
呼ぶように すれば、**つくりの 文を おすと 3Dが 光る**ように なります。

### 2. 「ものすごい かんさつ」を 3Dに する

`kansatsu.js` は いま `[data-part]` を SVGから 集めて ◯印を 作って います。
3D版では 同じ ことを こう します。

```js
viewer.parts().forEach((key, i) => { /* ◯印を つくる */ });
viewer.onFrame(() => {                       // 毎フレーム 位置を 合わせる
  const p = viewer.screenPos(key);
  mark.hidden = !p || !p.visible;            // うら がわに 行ったら きえる
  if (p) { mark.style.left = p.x + 'px'; mark.style.top = p.y + 'px'; }
});
mark.onclick = () => { viewer.focusPart(key); viewer.highlight(key); };
```

`demo3d.html` に 動く 見本が あります。そのまま うつせます。

### 3. 「大きさくらべ」

`viewer.showRuler(true)` で、1メートルの ますめと 同じ縮尺の 1年生（1.2m）が 出ます。
`viewer.meters()` が 実さいの ながさ・たかさ・はばを 返すので、
いまの「ながさ やく◯メートル」の 表示に そのまま つかえます。

---

## うごきと 重さ

| | |
| --- | --- |
| ライブラリ | three.js r169 を 同梱（`vendor/three.module.min.js` 約 670KB / gzipで 約 170KB） |
| ビルド | **不要**。これまで どおり ファイルを 置くだけ |
| モデル | コードで 組み立てるので、モデルファイルの ダウンロードは **0バイト** |
| 必要なもの | WebGL 2（2018年 以降の iPad / Chromebook なら まず 動きます） |
| 画質の 調整 | `createViewer(el, key, { quality: 'ultra' })` で ガラスを 透過に（重くなる） |
| WebGLが ない 端末 | `MODEL3D[car.art]` を 見て、なければ これまでの SVGに もどす |

### 学校の 端末で 気を つける ところ

- 1画面に 出す ビューアは **1つまで**に して、画面を はなれるときは `dispose()` を 呼びます。
- 影は 2048×2048 です。もっと 軽くしたい ときは `key.shadow.mapSize` を 1024に。
- 電池の もちが 気に なる 場合は、さわって いない ときの 自動回転を 切ります
  （`setAutoRotate(false)`）。

---

## これから

- [ ] のこり 57台（まずは ショベルカー・ダンプカー・はしご車 あたりが 3Dの ききめ 大）
- [ ] `selftest.html` に 3D用の チェックを 足す
- [ ] 見た ◯印の ✓を `localStorage` に 保存（いまの かんさつと 同じ しくみ）
- [ ] うでが のびる・にだいが かたむく などの 「うごき」を ボタンで 見せる
      （3Dなら できる。SVGでは むずかしかった ところ）
