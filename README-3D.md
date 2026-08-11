# 3Dの じどう車ずかん

SVGイラストの かわりに、**ブラウザの 中で 組み立てた 3Dモデル**を まわして 見られるように
した ものです。いまは **13台**。**ずかん本体（`index.html`）に 組みこみずみ**です。

| | |
| --- | --- |
| ずかん本体 | `index.html` を ふつうに 開くだけ。3Dモデルの ある 車は はじめから 3Dで 出ます |
| デモ（3Dだけ） | `demo3d.html` |
| たしかめ | `selftest.html`（イラストの 動き・43 checks）／ `selftest3d.html`（3Dの 動き・298 checks） |
| 足した ファイル | `car3d.js` / `car3d.css` / `kansatsu3d.js` / `vendor/three.module.min.js` |
| 直した ファイル | `index.html`（読みこみ 3行）／ `app.js`（3Dの 出し入れ）／ `selftest.html`（下記） |

### ずかんの どこが 3Dに なったか

- **詳細ページ**: 絵が 3Dに なり、ゆびで まわせます。「🖼️ イラストで 見る」で いつでも もどれます
  （えらんだ ほうは たんまつに おぼえます）。
- **③つくりの 文**を おすと、3Dの その ぶぶんだけが 光り、カメラが そこへ 飛びます。
  ふきだしは 車を まわしても ついてきます。
- **▶ うごかす ボタン**が 絵の 下に 出ます（にだいを かたむける、はしごを のばす など）。
- **ものすごい かんさつ**が 3D版に なります（`kansatsu3d.js`）。
  くらい 部屋・◯印・✓の ほぞん・ものさし・こえで きく は SVG版と 同じ。
  **保存キーも 同じ（`kz.<id>`）**なので、行き来しても ✓は そのままです。
- 3Dモデルの ない 47台と、WebGLが つかえない 端末では、**これまで どおり イラスト**です。

---

## いま 3Dに なって いる じどう車（10台）

| しごと | じどう車 | ③つくりで 光る ところ | ▶ うごかせる |
| --- | --- | --- | --- |
| はこぶ | トラック | にだい・タイヤ | — |
| つくる・なおす | クレーン車 | うで・あし | **うでを のばす** ／ あしを しまう・ひろげる |
| つくる・なおす | ショベルカー | バケット・キャタピラ | うでを のばして ほる |
| つくる・なおす | ブルドーザー | はね・キャタピラ | はねを 上げ下げ する |
| つくる・なおす | ミキサー車 | ドラム・シュート | （ドラムは いつも 回る） |
| つくる・なおす | ダンプカー | にだい・うんてんせき | **にだいを かたむける** |
| つくる・なおす | フォークリフト | つめ・マスト | つめを 上げる |
| たすける・まもる | きゅうきゅう車 | ベッド・ランプ | **うしろの とびらを あける** |
| たすける・まもる | はしご車 | はしご・あし | **はしごを のばす** ／ あし |
| そだてる・とる | トラクター | たがやす きかい・うしろの タイヤ | きかいを 下ろして たがやす |
| はこぶ | タンクローリー | タンク・ホース | ホースを 下ろす |
| つくる・なおす | ロードローラー | ローラー・ざせき | ざせきを よこへ ずらす |
| たすける・まもる | レッカー車 | うで・フック | うでを のばす |

6つの しごとの うち **4つ**に 3Dの 車が あります。
「つくる・なおす」は 13台中 **7台**が 3Dです。

---

## SVGでは できなかった こと

3Dに して、教科書の 文と 絵が はじめて ぴったり 合った ところ。

| ③つくりの 文 | SVG（よこ向き 1まい） | 3D |
| --- | --- | --- |
| 「**四本の あしを 大きく ひろげ**、タイヤが うくまで」（クレーン車） | 2本しか かけない | まわすと 前後左右 4本の ひろがりが 見える |
| 「うしろの タイヤは **二本ずつ ならべて** つけて あり」（トラック） | 重なって 見えない | うしろから 見ると 数えられる |
| 「にだいを **かたむけ**、土を ざあっと おろします」（ダンプカー） | かたむいた 絵は かけない | ▶ボタンで じっさいに かたむく |
| 「中から **つぎつぎ のびて**」（はしご車・クレーン車） | のびる ようすは かけない | ▶ボタンで のびる |
| 「タイヤの かわりに、**ひろい めんで ささえる キャタピラ**」（ショベルカー） | 線でしか かけない | 下から 見ると せっち面の ひろさが 分かる |

`assets/README.md` に あった「写真にすると 部位ハイライトが 使えない」という
いちばんの 弱点も、3Dなら ありません。

**正直に**: 見た目は「きれいな CG（製品カタログの 3D図）」で、写真そのものでは ありません。
1年生の 観察用としては、写真より 形が はっきりして いて かえって 見やすい、という 判断です。

---

## つかいかた（コード）

```js
import { createViewer, MODEL3D } from './car3d.js';

const v = createViewer(document.querySelector('#stage'), 'dump');

v.highlight('nidai');          // その部分だけ 光る（まわりは 暗くなる）
v.focusPart('nidai');          // カメラが そこへ 飛ぶ
v.clearHighlight();

v.setView(-1.57, 1.4);         // よこから 見る（az, pl）
v.resetView();
v.showRuler(true);             // 1メートルのますめ ＋ 1年生（1.2m）
v.setAutoRotate(true);

v.animations();                // → [{key:'tilt', label:'にだいを かたむける', value:0}]
v.setAnim('tilt', 1);          // 0〜1で うごかす（なめらかに うごく）
v.toggleAnim('tilt');          // → true/false

v.screenPos('nidai');          // → {x, y, visible}  ①②③の 印を 画面に 出すため
v.pick(clientX, clientY);      // → 'nidai'          さわった ところの 部品名
v.meters();                    // → {length, height, width}（メートル）
v.parts();                     // → ['nidai','tire', ...]
v.dispose();
```

`part` の 名まえは `car-art.js` の `data-part` / `parts-data.js` の キーと **同じ**です。
そのため `cars-data.js` の `tsukuri[].part` を そのまま つかえます。

---

## じどう車を 足す

`car3d.js` の下のほうに、`car-art.js` と 同じ かんかくで 書きます。

```js
MODEL3D.dump = {
  label: 'ダンプカー',
  build: function (B) {
    chassis(B, { x: -0.5, y: 0.90, len: 8.0, spread: 0.44 });
    truckCab(B, { x: 2.95, len: 2.05, w: 2.40, top: 3.06, floor: 0.98, color: 0x2f6fbf });

    const bed = new THREE.Group();          // かたむける ぶぶんは グループに
    bed.position.set(-4.05, 1.22, 0);       // ← ちょうつがいの いち
    B.root.add(bed);
    B.box({ parent: bed, x: 2.8, y: 0.06, z: 0, w: 5.65, h: 0.16, d: 2.44, part: 'nidai' });

    B.wheel({ x: 2.75, r: 0.56, w: 0.34, spread: 1.02 });

    B.anim('tilt', 'にだいを かたむける', v => { bed.rotation.z = v * 0.62; });
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
| うごき | `B.anim(key, label, v => …)`。`v` は 0（もとの かたち）〜 1（うごかしきった かたち） |
| さいしょから うごかした ようすに する | `B.anim(…, { start: 1 })`（クレーン車の あしなど） |

### 道具

**かたち**

| | |
| --- | --- |
| `B.box({x,y,z,w,h,d,r,color,metal,rough,clear,part,parent,aux})` | かどの まるい 箱（面取りつき） |
| `B.cyl({x,y,z,r,r2,h,axis,seg,part})` | つつ。`axis` は `'x'`/`'y'`/`'z'` |
| `B.wheel({x,r,w,spread})` / `({x,r,w,z})` | タイヤ（左右セット／片がわ）。`lift` で うかせる |
| `B.glass({x,y,z,w,h,d,part})` | まど |
| `B.lamp({x,y,z,color,strength,part})` | 光る ライト |
| `B.seam({...})` | うすい すじ（とびらの あわせめ など） |
| `B.mesh(geometry, material, {x,y,z,part,parent})` | すきな かたち（Lathe・Tube など） |
| `B.spin.push({obj, axis, speed})` | ぐるぐる まわす（ミキサー車の ドラム） |
| `B.anim(key, label, fn, opt)` | ▶ボタンで うごかす |

**まとめて つくる**

| | |
| --- | --- |
| `truckCab(B, {x,len,w,top,floor,color,deflector})` | トラック系の うんてんせき 一式（まど・ミラー・グリル・ステップ） |
| `chassis(B, {x,y,len,spread,tank})` | フレームと 燃料タンク |
| `crawlerTrack(B, {x,len,r,w,spread,tooth})` | キャタピラ（でっぱり つき） |
| `outriggers(B, {xs,w,color,reach,y})` | ふんばる あし 4本。**もどり値は `v=>…` の 関数**（`B.anim` に そのまま わたせる） |
| `boxBody(B, {x,len,w,bot,top,color,stripe,part})` | 箱の からだ |
| `lightBar(B, {x,y,w,n,colors})` | 回転灯 |
| `ladderSection(B, parent, {len,rail,wid,color,part})` | はしごの ひとふし |
| `curvedPlateGeom(rIn,thick,a0,a1,depth)` | そりかえった 板（バケット・ブレード・どろよけ） |

### たしかめる

`selftest3d.html` を ブラウザで 開くと、全部の 3Dモデルを 順に 組み立てて 次を 見ます。

- `cars-data.js` の `tsukuri[].part` が モデルの 中に あり、実さいに 光り、カメラが 飛べるか
- モデルの part が ぜんぶ `parts-data.js` に そろって いるか
- 大きさ（ながさ・たかさ・はば）が おかしくないか
- ①②③の しるしが 画面の 中に おさまるか
- ▶ の うごきに 名まえが つき、0〜1で うごくか

`ALL PASS` と 出れば 大丈夫です（いま 228 checks）。

---

## いまの ずかんに 組みこむ

3Dは モジュール（`type="module"`）なので、`index.html` に 1行 足すだけです。

### 1. 詳細ページに 「3Dで 見る」を 足す

```html
<link rel="stylesheet" href="car3d.css">   <!-- index.html の <head> -->
```

```js
// app.js — 絵を 出して いる ところ（artHTML のあたり）
import('./car3d.js').then(({ createViewer, MODEL3D }) => {
  if (!MODEL3D[car.art]) return;              // 3Dが ない車は これまで どおり SVG
  window.__view3d = createViewer(stage, car.art);
});
```

`highlightPart(part)` の 中で、SVGが なければ `window.__view3d.highlight(part)` を
呼べば、**つくりの 文を おすと 3Dが 光る**ように なります。

### 2. 「ものすごい かんさつ」を 3Dに する

`kansatsu.js` は いま `[data-part]` を SVGから 集めて ◯印を 作って います。3D版では：

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

`viewer.showRuler(true)` で 1メートルの ますめと 同じ縮尺の 1年生（1.2m）が 出ます。
`viewer.meters()` が 実さいの ながさ・たかさ・はばを 返します。

### 4. ▶ うごかす ボタン

```js
viewer.animations().forEach(a => {
  const b = document.createElement('button');
  b.textContent = '▶ ' + a.label;
  b.onclick = () => b.classList.toggle('is-on', viewer.toggleAnim(a.key));
  bar.appendChild(b);
});
```

「その ために、〜」の 文を 読んだ あとに おすと、書いてある ことが そのまま 目の前で
おこります。**読む → 予想する → たしかめる** の 流れに そのまま はまります。

---

## うごきと 重さ

| | |
| --- | --- |
| ライブラリ | three.js r169 を 同梱（約 670KB / gzipで 約 170KB） |
| ビルド | **不要**。これまで どおり ファイルを 置くだけ |
| モデル | コードで 組み立てるので、モデルファイルの ダウンロードは **0バイト** |
| 必要なもの | WebGL 2（2018年 以降の iPad / Chromebook なら まず 動きます） |
| 画質を 上げる | `createViewer(el, key, { quality: 'ultra' })` で ガラスが 透過に（重くなる） |
| WebGLが ない 端末 | `MODEL3D[car.art]` を 見て、なければ これまでの SVGに もどす |

### 学校の 端末で 気を つける ところ

- 1画面に 出す ビューアは **1つまで**に して、画面を はなれる ときは `dispose()` を 呼びます。
- 影は 2048×2048 です。もっと 軽くしたい ときは `key.shadow.mapSize` を 1024に。
- さわって いない ときの 自動回転を 切ると 電池が もちます（`setAutoRotate(false)`）。

---

## これから

- [ ] のこり 47台。つぎに 3Dの ききめが 大きいのは
      じょせつ車・高しょさぎょう車・コンバイン・ホイールローダー・コンクリートポンプ車
- [x] `index.html` 本体への 組みこみ
- [x] 見た ◯印の ✓を `localStorage` に 保存（SVG版と 同じ キー）
- [ ] `parts-data.js` の 71件中 30件が 3Dに 登場ずみ。のこり 41件は
      まだ 3Dに して いない 車の ぶぶん（`selftest3d.html` が 一らんを 出します）
- [ ] 「ながさ」は `car-art.js`（SVG）の 大きさから 出して います。
      3Dの 形と ±15%くらい ずれる 車が あります（ブルドーザー・ミキサー車）。
      どちらかに そろえるなら、`car-art.js` の `w`・`h` を 直すのが 早いです。

## selftest.html に 足した こと

もとからの `selftest.html` は **イラスト（SVG）の 動き**を たしかめる テストです。
3Dが 出て しまうと 別の ものを 見て しまう ので、はじめに
`localStorage['jz.use3d'] = false` を 入れて、イラストで 動かすように しました。
あわせて、おそい たんまつで こけない ように「◯印が 出るまで まつ」に 変えて あります
（もとは 150ms 待つだけ でした）。3Dの ほうは `selftest3d.html` が 見ます。
