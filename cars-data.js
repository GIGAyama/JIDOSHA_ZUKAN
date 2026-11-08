/* =========================================================================
   cars-data.js — ずかんに のって いる じどう車の いちらん

   ■ 1台ぶんの 形
       id        … 半角英字。URL（#/car/<id>）に なる
       name      … 画面に 出る 名まえ（漢字には <ruby> を つける）
       kana      … よみ（かたかなは かたかなの まま）。さくいんの あいうえお じゅんと、
                   読み上げに つかう
       category  … しごとの なかま（下の carCategories）。ずかんの「しょう」に なる
       art       … car-art.js の 絵の キー
       photo     … assets/ の 写真。ない ときは null（絵を つかう）

   ■ ページの 文は hon-data.js に ある
     見出し・せつめいの 文・かずで 見る は、ぜんぶ hon-data.js。ここには 書かない。

   ⚠️ むかし ここには、教科書と おなじ 型の 文
      （「〜しごとを して います。その ために、〜」）を 60台ぶん もって いた。
      子どもが それを そのまま カードに うつすと、考えなくても しあがって しまうので
      2026-11-08 に けした。ずかんの 文を よんで、しごとと つくりを
      じぶんで 見つけ、じぶんの ことばで つなぐ ための ずかんに する ため。
      もどさない こと（git の れきしには のこって いる）。

   ■ ならびじゅんが ページばんごうに なる
     carCategories の じゅん → その 中は ここの じゅん で、1〜60ページ。
     とちゅうに 車を 足すと、うしろの ページばんごうが ぜんぶ ずれる
     （子どもは「28ページの きゅうきゅう車」の ように おぼえて いる）。
     足す ときは、なるべく なかまの さいごに 足す こと。
   ========================================================================= */

window.carCategories = [
  { id: 'hakobu', name: 'はこぶ', icon: '📦' },
  { id: 'tsukuru', name: 'つくる・なおす', icon: '🚧' },
  { id: 'mamoru', name: 'たすける・まもる', icon: '🚑' },
  { id: 'kurashi', name: 'くらしを ささえる', icon: '🏡' },
  { id: 'sodateru', name: 'そだてる・とる', icon: '🌾' },
  { id: 'basho', name: 'くうこう・みなと・えき', icon: '✈️' }
];

window.carsData = [
  /* ============================ はこぶ ============================ */
  {
    id: 'truck',
    name: 'トラック',
    kana: 'トラック',
    category: 'hakobu',
    art: 'truck',
    photo: 'assets/truck.webp'
  },
  {
    id: 'bus',
    name: 'バス',
    kana: 'バス',
    category: 'hakobu',
    art: 'bus',
    photo: 'assets/bus.webp'
  },
  {
    id: 'car',
    name: 'じょうよう<ruby>車<rt>しゃ</rt></ruby>',
    kana: 'じょうようしゃ',
    category: 'hakobu',
    art: 'car',
    photo: 'assets/car.webp'
  },
  {
    id: 'taxi',
    name: 'タクシー',
    kana: 'タクシー',
    category: 'hakobu',
    art: 'taxi',
    photo: 'assets/taxi.webp'
  },
  {
    id: 'post',
    name: 'ゆうびん<ruby>車<rt>しゃ</rt></ruby>',
    kana: 'ゆうびんしゃ',
    category: 'hakobu',
    art: 'post',
    photo: 'assets/post.webp'
  },
  {
    id: 'delivery',
    name: 'たくはい<ruby>車<rt>しゃ</rt></ruby>',
    kana: 'たくはいしゃ',
    category: 'hakobu',
    art: 'delivery',
    photo: 'assets/delivery.webp'
  },
  {
    id: 'tanker',
    name: 'タンクローリー',
    kana: 'タンクローリー',
    category: 'hakobu',
    art: 'tanker',
    photo: 'assets/tanker.webp'
  },
  {
    id: 'carrier',
    name: 'キャリアカー',
    kana: 'キャリアカー',
    category: 'hakobu',
    art: 'carrier',
    photo: 'assets/carrier.webp'
  },
  {
    id: 'trailer',
    name: 'トレーラー',
    kana: 'トレーラー',
    category: 'hakobu',
    art: 'trailer',
    photo: 'assets/trailer.webp'
  },
  {
    id: 'reefer',
    name: 'れいとう<ruby>車<rt>しゃ</rt></ruby>',
    kana: 'れいとうしゃ',
    category: 'hakobu',
    art: 'reefer',
    photo: 'assets/reefer.webp'
  },
  {
    id: 'moving',
    name: 'ひっこし<ruby>車<rt>しゃ</rt></ruby>',
    kana: 'ひっこししゃ',
    category: 'hakobu',
    art: 'moving',
    photo: 'assets/moving.webp'
  },
  {
    id: 'schoolbus',
    name: 'スクールバス',
    kana: 'スクールバス',
    category: 'hakobu',
    art: 'schoolbus',
    photo: 'assets/schoolbus.webp'
  },
  {
    id: 'cash',
    name: 'げんきんゆそう<ruby>車<rt>しゃ</rt></ruby>',
    kana: 'げんきんゆそうしゃ',
    category: 'hakobu',
    art: 'cash',
    photo: 'assets/cash.webp'
  },
  {
    id: 'welfare',
    name: 'ふくし<ruby>車<rt>しゃ</rt></ruby>',
    kana: 'ふくししゃ',
    category: 'hakobu',
    art: 'welfare',
    photo: 'assets/welfare.webp'
  },

  /* ========================= つくる・なおす ========================= */
  {
    id: 'crane',
    name: 'クレーン<ruby>車<rt>しゃ</rt></ruby>',
    kana: 'クレーンしゃ',
    category: 'tsukuru',
    art: 'crane',
    photo: 'assets/crane.webp'
  },
  {
    id: 'shovel',
    name: 'ショベルカー',
    kana: 'ショベルカー',
    category: 'tsukuru',
    art: 'shovel',
    photo: 'assets/shovel.webp'
  },
  {
    id: 'bulldozer',
    name: 'ブルドーザー',
    kana: 'ブルドーザー',
    category: 'tsukuru',
    art: 'bulldozer',
    photo: 'assets/bulldozer.webp'
  },
  {
    id: 'mixer',
    name: 'ミキサー<ruby>車<rt>しゃ</rt></ruby>',
    kana: 'ミキサーしゃ',
    category: 'tsukuru',
    art: 'mixer',
    photo: 'assets/mixer.webp'
  },
  {
    id: 'roller',
    name: 'ロードローラー',
    kana: 'ロードローラー',
    category: 'tsukuru',
    art: 'roller',
    photo: 'assets/roller.webp'
  },
  {
    id: 'dump',
    name: 'ダンプカー',
    kana: 'ダンプカー',
    category: 'tsukuru',
    art: 'dump',
    photo: 'assets/dump.webp'
  },
  {
    id: 'aerial',
    name: '<ruby>高<rt>こう</rt></ruby>しょさぎょう<ruby>車<rt>しゃ</rt></ruby>',
    kana: 'こうしょさぎょうしゃ',
    category: 'tsukuru',
    art: 'aerial',
    photo: 'assets/aerial.webp'
  },
  {
    id: 'forklift',
    name: 'フォークリフト',
    kana: 'フォークリフト',
    category: 'tsukuru',
    art: 'forklift',
    photo: 'assets/forklift.webp'
  },
  {
    id: 'loader',
    name: 'ホイールローダー',
    kana: 'ホイールローダー',
    category: 'tsukuru',
    art: 'loader',
    photo: 'assets/loader.webp'
  },
  {
    id: 'paver',
    name: 'ほそう<ruby>車<rt>しゃ</rt></ruby>',
    kana: 'ほそうしゃ',
    category: 'tsukuru',
    art: 'paver',
    photo: 'assets/paver.webp'
  },
  {
    id: 'pumpcar',
    name: 'コンクリートポンプ<ruby>車<rt>しゃ</rt></ruby>',
    kana: 'コンクリートポンプしゃ',
    category: 'tsukuru',
    art: 'pumpcar',
    photo: 'assets/pumpcar.webp'
  },
  {
    id: 'breaker',
    name: 'かいたい<ruby>車<rt>しゃ</rt></ruby>',
    kana: 'かいたいしゃ',
    category: 'tsukuru',
    art: 'breaker',
    photo: 'assets/breaker.webp'
  },
  {
    id: 'grader',
    name: 'グレーダー',
    kana: 'グレーダー',
    category: 'tsukuru',
    art: 'grader',
    photo: 'assets/grader.webp'
  },

  /* ======================= たすける・まもる ======================= */
  {
    id: 'ambulance',
    name: 'きゅうきゅう<ruby>車<rt>しゃ</rt></ruby>',
    kana: 'きゅうきゅうしゃ',
    category: 'mamoru',
    art: 'ambulance',
    photo: 'assets/ambulance.webp'
  },
  {
    id: 'fire',
    name: 'しょうぼう<ruby>車<rt>しゃ</rt></ruby>',
    kana: 'しょうぼうしゃ',
    category: 'mamoru',
    art: 'fire',
    photo: 'assets/fire.webp'
  },
  {
    id: 'ladder',
    name: 'はしご<ruby>車<rt>しゃ</rt></ruby>',
    kana: 'はしごしゃ',
    category: 'mamoru',
    art: 'ladder',
    photo: 'assets/ladder.webp'
  },
  {
    id: 'police',
    name: 'パトカー',
    kana: 'パトカー',
    category: 'mamoru',
    art: 'police',
    photo: 'assets/police.webp'
  },
  {
    id: 'wrecker',
    name: 'レッカー<ruby>車<rt>しゃ</rt></ruby>',
    kana: 'レッカーしゃ',
    category: 'mamoru',
    art: 'wrecker',
    photo: 'assets/wrecker.webp'
  },
  {
    id: 'snowplow',
    name: 'じょせつ<ruby>車<rt>しゃ</rt></ruby>',
    kana: 'じょせつしゃ',
    category: 'mamoru',
    art: 'snowplow',
    photo: 'assets/snowplow.webp'
  },
  {
    id: 'blood',
    name: 'けんけつ<ruby>車<rt>しゃ</rt></ruby>',
    kana: 'けんけつしゃ',
    category: 'mamoru',
    art: 'blood',
    photo: null
  },
  {
    id: 'rescue',
    name: 'きゅうじょ<ruby>車<rt>しゃ</rt></ruby>',
    kana: 'きゅうじょしゃ',
    category: 'mamoru',
    art: 'rescue',
    photo: 'assets/rescue.webp'
  },
  {
    id: 'foam',
    name: 'かがくしょうぼう<ruby>車<rt>しゃ</rt></ruby>',
    kana: 'かがくしょうぼうしゃ',
    category: 'mamoru',
    art: 'foam',
    photo: 'assets/foam.webp'
  },
  {
    id: 'doctorcar',
    name: 'ドクターカー',
    kana: 'ドクターカー',
    category: 'mamoru',
    art: 'doctorcar',
    photo: 'assets/doctorcar.webp'
  },
  {
    id: 'xray',
    name: 'けんしん<ruby>車<rt>しゃ</rt></ruby>',
    kana: 'けんしんしゃ',
    category: 'mamoru',
    art: 'xray',
    photo: 'assets/xray.webp'
  },

  /* ====================== くらしを ささえる ====================== */
  {
    id: 'garbage',
    name: 'ごみしゅうしゅう<ruby>車<rt>しゃ</rt></ruby>',
    kana: 'ごみしゅうしゅうしゃ',
    category: 'kurashi',
    art: 'garbage',
    photo: 'assets/garbage.webp'
  },
  {
    id: 'sweeper',
    name: 'そうじ<ruby>車<rt>しゃ</rt></ruby>',
    kana: 'そうじしゃ',
    category: 'kurashi',
    art: 'sweeper',
    photo: 'assets/sweeper.webp'
  },
  {
    id: 'water',
    name: 'きゅうすい<ruby>車<rt>しゃ</rt></ruby>',
    kana: 'きゅうすいしゃ',
    category: 'kurashi',
    art: 'water',
    photo: 'assets/water.webp'
  },
  {
    id: 'kitchen',
    name: 'キッチンカー',
    kana: 'キッチンカー',
    category: 'kurashi',
    art: 'kitchen',
    photo: null
  },
  {
    id: 'library',
    name: 'としょかん<ruby>車<rt>しゃ</rt></ruby>',
    kana: 'としょかんしゃ',
    category: 'kurashi',
    art: 'library',
    photo: 'assets/library.webp'
  },
  {
    id: 'sightseeing',
    name: 'かんこうバス',
    kana: 'かんこうバス',
    category: 'kurashi',
    art: 'sightseeing',
    photo: 'assets/sightseeing.webp'
  },
  {
    id: 'waterworks',
    name: 'すいどうこうじ<ruby>車<rt>しゃ</rt></ruby>',
    kana: 'すいどうこうじしゃ',
    category: 'kurashi',
    art: 'waterworks',
    photo: null
  },
  {
    id: 'shop',
    name: 'いどうはんばい<ruby>車<rt>しゃ</rt></ruby>',
    kana: 'いどうはんばいしゃ',
    category: 'kurashi',
    art: 'shop',
    photo: 'assets/shop.webp'
  },
  {
    id: 'kei',
    name: 'けいトラック',
    kana: 'けいトラック',
    category: 'kurashi',
    art: 'kei',
    photo: 'assets/kei.webp'
  },
  {
    id: 'gas',
    name: 'ガスこうじ<ruby>車<rt>しゃ</rt></ruby>',
    kana: 'ガスこうじしゃ',
    category: 'kurashi',
    art: 'gas',
    photo: 'assets/gas.webp'
  },

  /* ======================== そだてる・とる ======================== */
  {
    id: 'tractor',
    name: 'トラクター',
    kana: 'トラクター',
    category: 'sodateru',
    art: 'tractor',
    photo: 'assets/tractor.webp'
  },
  {
    id: 'combine',
    name: 'コンバイン',
    kana: 'コンバイン',
    category: 'sodateru',
    art: 'combine',
    photo: 'assets/combine.webp'
  },
  {
    id: 'rice',
    name: 'たうえき',
    kana: 'たうえき',
    category: 'sodateru',
    art: 'rice',
    photo: 'assets/rice.webp'
  },
  {
    id: 'mower',
    name: 'くさかり<ruby>車<rt>しゃ</rt></ruby>',
    kana: 'くさかりしゃ',
    category: 'sodateru',
    art: 'mower',
    photo: 'assets/mower.webp'
  },
  {
    id: 'logger',
    name: '<ruby>木<rt>き</rt></ruby>を はこぶ <ruby>車<rt>くるま</rt></ruby>',
    kana: 'きをはこぶくるま',
    category: 'sodateru',
    art: 'logger',
    photo: 'assets/logger.webp'
  },
  {
    id: 'sprayer',
    name: 'くすりを まく <ruby>車<rt>くるま</rt></ruby>',
    kana: 'くすりをまくくるま',
    category: 'sodateru',
    art: 'sprayer',
    photo: 'assets/sprayer.webp'
  },

  /* ==================== くうこう・みなと・えき ==================== */
  {
    id: 'towing',
    name: 'トーイングカー',
    kana: 'トーイングカー',
    category: 'basho',
    art: 'towing',
    photo: 'assets/towing.webp'
  },
  {
    id: 'fueler',
    name: 'きゅうゆ<ruby>車<rt>しゃ</rt></ruby>',
    kana: 'きゅうゆしゃ',
    category: 'basho',
    art: 'fueler',
    photo: 'assets/fueler.webp'
  },
  {
    id: 'cargoloader',
    name: 'ハイリフトローダー',
    kana: 'ハイリフトローダー',
    category: 'basho',
    art: 'cargoloader',
    photo: 'assets/cargoloader.webp'
  },
  {
    id: 'stairs',
    name: 'タラップ<ruby>車<rt>しゃ</rt></ruby>',
    kana: 'タラップしゃ',
    category: 'basho',
    art: 'stairs',
    photo: 'assets/stairs.webp'
  },
  {
    id: 'stacker',
    name: 'リーチスタッカー',
    kana: 'リーチスタッカー',
    category: 'basho',
    art: 'stacker',
    photo: 'assets/stacker.webp'
  },
  {
    id: 'railcar',
    name: 'せんろの てんけん<ruby>車<rt>しゃ</rt></ruby>',
    kana: 'せんろのてんけんしゃ',
    category: 'basho',
    art: 'railcar',
    photo: 'assets/railcar.webp'
  }
];
