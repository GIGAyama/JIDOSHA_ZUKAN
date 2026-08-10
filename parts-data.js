/* =========================================================================
   parts-data.js — ぶぶんの 名まえと せつめい（ものすごい かんさつ 用）

   car-art.js の data-part（ぜんぶで 71しゅるい）に、
   「どの 車にも あてはまる 名まえと せつめい」を つけて おく ファイル。

   ■ つかわれかた
     ・ものすごい かんさつの ◯マーク（ホットスポット）を おすと ここの 文が 出る
     ・その 車の cars-data.js に おなじ part が あれば、
       「③ つくり」の 文も いっしょに ならぶ（ずかんの 本文と つながる）

   ■ かきかた の きまり
     ・分かち書き（ことばの あいだを あける）
     ・漢字には かならず <ruby>漢字<rt>よみ</rt></ruby> で ふりがなを つける
     ・name は みじかく、text は 1〜2文で
   ========================================================================= */

window.partInfo = {

  andon: {
    name: 'あんどん',
    text: 'やねの <ruby>上<rt>うえ</rt></ruby>で <ruby>光<rt>ひか</rt></ruby>る ランプです。とおくからでも、あれが タクシーだと すぐに わかります。'
  },
  antenna: {
    name: 'アンテナ',
    text: 'とおくに いる <ruby>人<rt>ひと</rt></ruby>と、むせんで はなす ための ぼうです。'
  },
  arm: {
    name: 'うで',
    text: 'のびたり まがったり する うでです。<ruby>人<rt>ひと</rt></ruby>の うでの ように うごいて、しごとを します。'
  },
  ashi: {
    name: 'ふんばる あし',
    text: 'しごとの あいだ、じめんに ぐっと ふんばる あしです。おもい ものを もちあげても、<ruby>車<rt>くるま</rt></ruby>が たおれません。'
  },
  basket: {
    name: 'かご',
    text: '<ruby>人<rt>ひと</rt></ruby>が のる かごです。まわりが かこんで あるので、たかい ところでも おちません。'
  },
  bed: {
    name: 'ベッド',
    text: 'けがや びょうきの <ruby>人<rt>ひと</rt></ruby>を、ねたまま はこぶ ための ベッドです。'
  },
  belt: {
    name: 'とめる ベルト',
    text: 'にもつが うごいたり たおれたり しない ように、ぎゅっと とめる ベルトです。'
  },
  bigtire: {
    name: '<ruby>大<rt>おお</rt></ruby>きな タイヤ',
    text: 'とても <ruby>大<rt>おお</rt></ruby>きな タイヤです。でこぼこの みちや やわらかい つちの <ruby>上<rt>うえ</rt></ruby>でも、しずまずに すすめます。'
  },
  blade: {
    name: 'けずる は',
    text: 'つちや ゆきを けずったり おしたり する、かたい いたです。'
  },
  body: {
    name: 'からだ',
    text: '<ruby>車<rt>くるま</rt></ruby>の からだです。この かたちが、その しごとに ぴったり あう ように つくって あります。'
  },
  boom: {
    name: 'ながい うで',
    text: 'ぐんぐん のびて、たかい ところまで とどく うでです。「ブーム」と いいます。'
  },
  box: {
    name: 'どうぐばこ',
    text: 'しごとに つかう どうぐを、きちんと しまって おく はこです。'
  },
  brush: {
    name: 'ブラシ',
    text: 'くるくる まわって、みちの ごみや すなを はきあつめる ブラシです。'
  },
  bucket: {
    name: 'バケット',
    text: 'つちや すなを すくいとる、<ruby>大<rt>おお</rt></ruby>きな てのひらの ような ぶぶんです。'
  },
  cab: {
    name: 'うんてんせき',
    text: 'うんてんする <ruby>人<rt>ひと</rt></ruby>が すわる ところです。まわりが よく <ruby>見<rt>み</rt></ruby>える ように、まどが <ruby>大<rt>おお</rt></ruby>きく なって います。'
  },
  chute: {
    name: 'シュート',
    text: 'できあがった コンクリートを、ながして おろす ための ながい といです。'
  },
  container: {
    name: 'コンテナ',
    text: 'にもつを <ruby>入<rt>い</rt></ruby>れる <ruby>大<rt>おお</rt></ruby>きな はこです。<ruby>船<rt>ふね</rt></ruby>にも でんしゃにも、その まま つみかえられます。'
  },
  cooler: {
    name: 'ひやす きかい',
    text: '<ruby>中<rt>なか</rt></ruby>を つめたく して おく きかいです。あつい <ruby>日<rt>ひ</rt></ruby>でも、なかみが とけません。'
  },
  counter: {
    name: 'カウンター',
    text: 'ちゅうもんを きいたり、できた りょうりを わたしたり する まどです。'
  },
  crawler: {
    name: 'キャタピラ',
    text: 'わの かわりに ぐるぐる まわる、はばの ひろい おびです。じめんに ふれる ところが ひろいので、やわらかい つちでも しずみません。'
  },
  cutter: {
    name: 'かる は',
    text: 'くさや いねを、ざくざくと かりとる はです。'
  },
  deck: {
    name: 'にだい',
    text: 'にもつを のせる、たいらな ゆかです。'
  },
  detector: {
    name: 'しらべる きかい',
    text: '<ruby>目<rt>め</rt></ruby>に <ruby>見<rt>み</rt></ruby>えない ことを しらべて、おしえて くれる きかいです。'
  },
  door: {
    name: 'とびら',
    text: 'のりおりしたり、にもつを <ruby>入<rt>い</rt></ruby>れたり する ための とびらです。'
  },
  drum: {
    name: 'ドラム',
    text: 'ぐるぐる まわる <ruby>大<rt>おお</rt></ruby>きな つつです。<ruby>中<rt>なか</rt></ruby>で コンクリートを まぜつづけるので、かたまりません。'
  },
  fork: {
    name: 'つめ',
    text: 'にもつの <ruby>下<rt>した</rt></ruby>に すっと さしこんで、そのまま もちあげる <ruby>二本<rt>にほん</rt></ruby>の つめです。'
  },
  gate: {
    name: 'あげさげ<ruby>台<rt>だい</rt></ruby>',
    text: 'にもつを のせおろし する ときに、<ruby>上<rt>うえ</rt></ruby>や <ruby>下<rt>した</rt></ruby>へ うごく <ruby>台<rt>だい</rt></ruby>です。'
  },
  grapple: {
    name: 'つかむ うで',
    text: '<ruby>木<rt>き</rt></ruby>や にもつを、がしっと つかむ <ruby>手<rt>て</rt></ruby>です。'
  },
  guard: {
    name: 'カバー',
    text: 'あぶない ところや、よごれては こまる ところを おおう カバーです。'
  },
  hitch: {
    name: 'つなぐ ところ',
    text: 'うしろの <ruby>車<rt>くるま</rt></ruby>や どうぐを つなぐ ところです。ここで つないで、ひっぱって いきます。'
  },
  hook: {
    name: 'フック',
    text: 'つなを かけて、ものを つりあげる ための かぎです。'
  },
  hopper: {
    name: 'うける ところ',
    text: '<ruby>上<rt>うえ</rt></ruby>から <ruby>入<rt>い</rt></ruby>れた ものを、こぼさずに うけとめる ところです。'
  },
  hose: {
    name: 'ホース',
    text: '<ruby>水<rt>みず</rt></ruby>や あわ、くうきを おくる ための くだです。まげられるので、どこへでも のばせます。'
  },
  joint: {
    name: 'つなぎめ',
    text: 'まえと うしろが つながって いる ところです。ここで くの<ruby>字<rt>じ</rt></ruby>に まがるので、ながい <ruby>車<rt>くるま</rt></ruby>でも まがれます。'
  },
  kit: {
    name: 'きゅうきゅうバッグ',
    text: 'けがを した <ruby>人<rt>ひと</rt></ruby>を すぐに てあて できる どうぐが、まとめて <ruby>入<rt>はい</rt></ruby>って います。'
  },
  kitchen: {
    name: 'ちょうりだい',
    text: 'りょうりを つくる ための だいです。<ruby>火<rt>ひ</rt></ruby>や <ruby>水<rt>みず</rt></ruby>が つかえる ように なって います。'
  },
  ladder: {
    name: 'はしご',
    text: 'ぐんぐん のびて、たかい ところまで とどく はしごです。'
  },
  lamp: {
    name: 'ランプ',
    text: 'くるくる <ruby>光<rt>ひか</rt></ruby>って、まわりの <ruby>人<rt>ひと</rt></ruby>に「いそいで います」と しらせる ランプです。'
  },
  lift: {
    name: 'あがる <ruby>台<rt>だい</rt></ruby>',
    text: 'しずかに <ruby>上<rt>うえ</rt></ruby>がったり <ruby>下<rt>さ</rt></ruby>がったり する <ruby>台<rt>だい</rt></ruby>です。おもい ものでも らくに のせられます。'
  },
  machine: {
    name: 'きかい',
    text: 'その しごとの ためだけに つくられた、とくべつな きかいです。'
  },
  mark: {
    name: 'しるし',
    text: 'なんの <ruby>車<rt>くるま</rt></ruby>かが ひとめで わかる、<ruby>大<rt>おお</rt></ruby>きな しるしです。'
  },
  mast: {
    name: 'マスト',
    text: 'まっすぐ <ruby>立<rt>た</rt></ruby>った はしらです。この はしらに そって、つめが <ruby>上<rt>うえ</rt></ruby>まで <ruby>上<rt>あ</rt></ruby>がります。'
  },
  nidai: {
    name: 'にだい',
    text: 'うんてんせきの うしろに ある、にもつを つむ ところです。'
  },
  nipper: {
    name: 'つかむ <ruby>手<rt>て</rt></ruby>',
    text: 'かたい ものを はさんで、こわしたり はこんだり する <ruby>手<rt>て</rt></ruby>です。'
  },
  nozzle: {
    name: 'ノズル',
    text: '<ruby>水<rt>みず</rt></ruby>を いきおいよく とばす ための、さきっぽです。'
  },
  planter: {
    name: 'うえる つめ',
    text: 'なえを 1<ruby>本<rt>ぽん</rt></ruby>ずつ つまんで、たんぼに うえて いく つめです。'
  },
  plow: {
    name: 'ゆきを おす はね',
    text: 'つもった ゆきを、みちの よこへ おしのける <ruby>大<rt>おお</rt></ruby>きな はねです。'
  },
  pump: {
    name: 'ポンプ',
    text: '<ruby>水<rt>みず</rt></ruby>を すいあげて、いきおいよく おくりだす きかいです。'
  },
  railwheel: {
    name: 'てつの わ',
    text: 'せんろの <ruby>上<rt>うえ</rt></ruby>を はしる ための、てつで できた わです。'
  },
  reel: {
    name: 'かきこむ ところ',
    text: 'くるくる まわって、いねを きかいの <ruby>中<rt>なか</rt></ruby>へ かきこむ ところです。'
  },
  roller: {
    name: 'ローラー',
    text: 'とても おもい てつの わです。ころがりながら、じめんを たいらに おしかためます。'
  },
  roof: {
    name: 'やね',
    text: '<ruby>雨<rt>あめ</rt></ruby>や <ruby>日<rt>ひ</rt></ruby>ざしから、<ruby>中<rt>なか</rt></ruby>を まもる やねです。'
  },
  rotary: {
    name: 'たがやす きかい',
    text: 'はが ぐるぐる まわって、かたい つちを ほりおこし、やわらかく します。'
  },
  safe: {
    name: 'かたい はこ',
    text: 'てつで できた、とても じょうぶな はこです。たいせつな ものを まもります。'
  },
  screed: {
    name: 'ならす いた',
    text: 'あつい アスファルトを、たいらに ならして いく いたです。'
  },
  seat: {
    name: 'ざせき',
    text: '<ruby>人<rt>ひと</rt></ruby>が すわる ところです。なん<ruby>人<rt>にん</rt></ruby>のせるかで、ならびかたが かわります。'
  },
  shelf: {
    name: 'たな',
    text: 'ものを ならべて のせる たなです。ゆれても おちない ように なって います。'
  },
  slope: {
    name: 'スロープ',
    text: 'だんさが なく、ななめに なって いる みちです。くるまいすの まま、のりおり できます。'
  },
  spreader: {
    name: 'つかむ ところ',
    text: 'コンテナの <ruby>四<rt>よっ</rt></ruby>すみを がっちり つかむ ところです。'
  },
  stairs: {
    name: 'かいだん',
    text: '<ruby>上<rt>うえ</rt></ruby>に のぼる ための かいだんです。'
  },
  stake: {
    name: 'とめる ぼう',
    text: 'つんだ ものが ころがりおちない ように、よこで ささえる ぼうです。'
  },
  step: {
    name: 'ステップ',
    text: 'のりおりする ときに ふむ、ひくい だんです。ひくいので、<ruby>小<rt>ちい</rt></ruby>さい <ruby>人<rt>ひと</rt></ruby>でも のれます。'
  },
  tank: {
    name: 'タンク',
    text: '<ruby>水<rt>みず</rt></ruby>や あぶらを ためて おく、<ruby>大<rt>おお</rt></ruby>きな いれものです。まるい かたちは、じょうぶで こぼれにくいのです。'
  },
  tap: {
    name: 'じゃぐち',
    text: 'ためた <ruby>水<rt>みず</rt></ruby>を <ruby>出<rt>だ</rt></ruby>す ための ぐちです。'
  },
  tire: {
    name: 'タイヤ',
    text: 'ゴムで できた わです。まわって <ruby>車<rt>くるま</rt></ruby>を すすめ、でこぼこの ゆれも やわらげます。おもい <ruby>車<rt>くるま</rt></ruby>ほど、<ruby>大<rt>おお</rt></ruby>きく かずも おおく なります。'
  },
  tray: {
    name: 'なえの たな',
    text: 'うえる まえの なえを、たくさん のせて おく たなです。'
  },
  trunk: {
    name: 'にもつ<ruby>入<rt>い</rt></ruby>れ',
    text: 'うしろに ある、にもつを しまう ところです。'
  },
  turret: {
    name: '<ruby>大<rt>おお</rt></ruby>きな ノズル',
    text: 'やねの <ruby>上<rt>うえ</rt></ruby>から、<ruby>水<rt>みず</rt></ruby>や あわを とおくまで とばす ノズルです。'
  },
  wall: {
    name: 'あつい かべ',
    text: 'ぶあつくて じょうぶな かべです。<ruby>中<rt>なか</rt></ruby>の ものを しっかり まもります。'
  },
  winch: {
    name: 'つなを まく きかい',
    text: 'つなを ぐるぐる まきとって、うごけなく なった <ruby>車<rt>くるま</rt></ruby>を ひっぱりあげる きかいです。'
  },
  window: {
    name: 'まど',
    text: 'そとが <ruby>見<rt>み</rt></ruby>える まどです。うんてんする <ruby>人<rt>ひと</rt></ruby>が まわりを たしかめる ために、<ruby>大<rt>おお</rt></ruby>きく つくって あります。'
  }
};
