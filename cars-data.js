/* =========================================================================
   cars-data.js — じどう車の せつめい

   ■ 文の かたち（教科書「じどう車くらべ」と おなじ じゅんじょ）
       ① とい   … 「〜は、どんな しごとを して いますか。」（じどうで つくる）
       ② しごと … 「〜は、〜しごとを して います。」
       ③ つくり … 「その ために、〜」「〜ように、〜」
     この じゅんじょの まま よむと、そのまま「じどう車ずかん」の 文に なる。

   ■ かきかた の きまり
     ・分かち書き（ことばの あいだを あける）
     ・漢字には かならず <ruby>漢字<rt>よみ</rt></ruby> で ふりがなを つける
     ・tsukuri の part は car-art.js の data-part と おなじ 名まえに する
       → その ぶぶんが 絵の 中で 光る
     ・photo に "assets/〇〇.webp" を 入れると、イラストの かわりに 写真が 出る
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
    photo: null,
    shigoto: 'トラックは、たくさんの にもつを とおくまで はこぶ しごとを して います。',
    tsukuri: [
      {
        part: 'nidai', label: 'にだい',
        text: 'その ために、うんてんせきの うしろが、にもつを つむ ひろい にだいに なって います。'
      },
      {
        part: 'tire', label: 'タイヤ',
        text: 'おもい にもつを のせても つぶれない ように、じょうぶで <ruby>大<rt>おお</rt></ruby>きな タイヤが、うしろでは <ruby>二本<rt>にほん</rt></ruby>ずつ ならべて ついて います。'
      }
    ],
    hakken: 'にだいの よこの とびらが、<ruby>鳥<rt>とり</rt></ruby>の つばさの ように ま<ruby>上<rt>うえ</rt></ruby>まで <ruby>大<rt>おお</rt></ruby>きく ひらく トラックも あります。「ウィングドア」と いいます。'
  },
  {
    id: 'bus',
    name: 'バス',
    kana: 'バス',
    category: 'hakobu',
    art: 'bus',
    photo: null,
    shigoto: 'バスは、たくさんの <ruby>人<rt>ひと</rt></ruby>を のせて はこぶ しごとを して います。',
    tsukuri: [
      {
        part: 'seat', label: 'ざせき',
        text: 'その ために、<ruby>車<rt>くるま</rt></ruby>の <ruby>中<rt>なか</rt></ruby>に、ならんで すわれる ざせきが たくさん つくって あります。'
      },
      {
        part: 'door', label: 'とびら',
        text: 'のりおりが しやすい ように、とびらが <ruby>大<rt>おお</rt></ruby>きく ひらいて、ゆかが ひくく なって います。'
      }
    ],
    hakken: 'そとの けしきが よく <ruby>見<rt>み</rt></ruby>えるように、まどが <ruby>大<rt>おお</rt></ruby>きく つくって あります。'
  },
  {
    id: 'car',
    name: 'じょうよう<ruby>車<rt>しゃ</rt></ruby>',
    kana: 'じょうようしゃ',
    category: 'hakobu',
    art: 'car',
    photo: null,
    shigoto: 'じょうよう<ruby>車<rt>しゃ</rt></ruby>は、かぞくや <ruby>友<rt>とも</rt></ruby>だちなど、すこしの <ruby>人<rt>ひと</rt></ruby>を のせて はこぶ しごとを して います。',
    tsukuri: [
      {
        part: 'seat', label: 'ざせき',
        text: 'その ために、<ruby>四人<rt>よにん</rt></ruby>か <ruby>五人<rt>ごにん</rt></ruby>が ゆったり すわれる ざせきが、つくって あります。'
      },
      {
        part: 'window', label: 'まど',
        text: 'うんてんする <ruby>人<rt>ひと</rt></ruby>が まわりを よく <ruby>見<rt>み</rt></ruby>られる ように、まどが ぐるりと ついて います。'
      }
    ],
    hakken: 'うしろの ざせきを たおすと、<ruby>大<rt>おお</rt></ruby>きな にもつも のせられます。'
  },
  {
    id: 'taxi',
    name: 'タクシー',
    kana: 'タクシー',
    category: 'hakobu',
    art: 'taxi',
    photo: null,
    shigoto: 'タクシーは、<ruby>行<rt>い</rt></ruby>きたい ところまで <ruby>人<rt>ひと</rt></ruby>を のせて はこぶ しごとを して います。',
    tsukuri: [
      {
        part: 'andon', label: 'あんどん',
        text: 'その ために、やねの <ruby>上<rt>うえ</rt></ruby>に「あんどん」と いう ランプが ついて いて、とおくからでも すぐに <ruby>見<rt>み</rt></ruby>つけられます。'
      },
      {
        part: 'seat', label: 'ざせき',
        text: 'ゆったり すわれる ように、うしろの ざせきが ひろく つくって あります。'
      }
    ],
    hakken: 'うんてんせきの よこには、のった ながさを はかる「メーター」が ついて います。'
  },
  {
    id: 'post',
    name: 'ゆうびん<ruby>車<rt>しゃ</rt></ruby>',
    kana: 'ゆうびんしゃ',
    category: 'hakobu',
    art: 'post',
    photo: null,
    shigoto: 'ゆうびん<ruby>車<rt>しゃ</rt></ruby>は、てがみや はがきを、みんなの おうちへ とどける しごとを して います。',
    tsukuri: [
      {
        part: 'nidai', label: 'にもつ<ruby>入<rt>い</rt></ruby>れ',
        text: 'その ために、うしろが、たくさんの てがみを <ruby>入<rt>い</rt></ruby>れられる はこの かたちに なって います。'
      },
      {
        part: 'door', label: 'とびら',
        text: 'てがみを すぐに <ruby>出<rt>だ</rt></ruby>せる ように、うしろの とびらが <ruby>大<rt>おお</rt></ruby>きく ひらきます。'
      }
    ],
    hakken: '<ruby>車<rt>くるま</rt></ruby>の よこには、ゆうびんの しるし「〒」が かいて あります。'
  },
  {
    id: 'delivery',
    name: 'たくはい<ruby>車<rt>しゃ</rt></ruby>',
    kana: 'たくはいしゃ',
    category: 'hakobu',
    art: 'delivery',
    photo: null,
    shigoto: 'たくはい<ruby>車<rt>しゃ</rt></ruby>は、たのまれた にもつを、おうちや お<ruby>店<rt>みせ</rt></ruby>まで とどける しごとを して います。',
    tsukuri: [
      {
        part: 'shelf', label: 'たな',
        text: 'その ために、にもつを <ruby>入<rt>い</rt></ruby>れる ところが、いくつもの たなに <ruby>分<rt>わ</rt></ruby>かれて います。'
      },
      {
        part: 'door', label: 'とびら',
        text: 'とどける にもつを すぐに <ruby>出<rt>だ</rt></ruby>せる ように、うしろの とびらが <ruby>大<rt>おお</rt></ruby>きく ひらきます。'
      }
    ],
    hakken: 'つめたい ままで とどける ために、<ruby>中<rt>なか</rt></ruby>を ひやせる たくはい<ruby>車<rt>しゃ</rt></ruby>も あります。'
  },
  {
    id: 'tanker',
    name: 'タンクローリー',
    kana: 'タンクローリー',
    category: 'hakobu',
    art: 'tanker',
    photo: null,
    shigoto: 'タンクローリーは、ガソリンや <ruby>水<rt>みず</rt></ruby>のような、ながれる ものを はこぶ しごとを して います。',
    tsukuri: [
      {
        part: 'tank', label: 'タンク',
        text: 'その ために、うしろが、まるくて <ruby>大<rt>おお</rt></ruby>きな タンクに なって います。'
      },
      {
        part: 'hose', label: 'ホース',
        text: 'ためた ものを ながし<ruby>出<rt>だ</rt></ruby>せる ように、ながい ホースを まいて おく ところが ついて います。'
      }
    ],
    hakken: 'タンクの <ruby>中<rt>なか</rt></ruby>は へやのように <ruby>分<rt>わ</rt></ruby>かれて いて、ちがう しゅるいの ものを いっしょに はこべます。'
  },
  {
    id: 'carrier',
    name: 'キャリアカー',
    kana: 'キャリアカー',
    category: 'hakobu',
    art: 'carrier',
    photo: null,
    shigoto: 'キャリアカーは、できたばかりの じどう<ruby>車<rt>しゃ</rt></ruby>を、お<ruby>店<rt>みせ</rt></ruby>まで はこぶ しごとを して います。',
    tsukuri: [
      {
        part: 'deck', label: 'にだい',
        text: 'その ために、<ruby>車<rt>くるま</rt></ruby>を のせる ゆかが、<ruby>上<rt>うえ</rt></ruby>と <ruby>下<rt>した</rt></ruby>の <ruby>二<rt>に</rt></ruby>だんに なって います。'
      },
      {
        part: 'slope', label: 'スロープ',
        text: '<ruby>車<rt>くるま</rt></ruby>が じぶんで のぼれる ように、うしろに ながい さかみち（スロープ）が ついて います。'
      }
    ],
    hakken: '<ruby>一<rt>いち</rt></ruby>だいの キャリアカーで、<ruby>六<rt>ろく</rt></ruby>だいくらいの <ruby>車<rt>くるま</rt></ruby>を はこべます。'
  },

  {
    id: 'trailer',
    name: 'トレーラー',
    kana: 'トレーラー',
    category: 'hakobu',
    art: 'trailer',
    photo: null,
    shigoto: 'トレーラーは、<ruby>大<rt>おお</rt></ruby>きな はこ（コンテナ）を、みなとから とおくの まちへ はこぶ しごとを して います。',
    tsukuri: [
      {
        part: 'container', label: 'コンテナ',
        text: 'その ために、うしろが、にもつを たくさん <ruby>入<rt>い</rt></ruby>れられる ながい はこに なって います。'
      },
      {
        part: 'joint', label: 'つなぎめ',
        text: 'まがりみちでも まがれる ように、うんてんせきと にだいの <ruby>間<rt>あいだ</rt></ruby>が、くるりと うごく つなぎめに なって います。'
      }
    ],
    hakken: 'にだいだけを きりはなして おいて おき、べつの うんてんせきが ひっぱって いく ことも できます。'
  },
  {
    id: 'reefer',
    name: 'れいとう<ruby>車<rt>しゃ</rt></ruby>',
    kana: 'れいとうしゃ',
    category: 'hakobu',
    art: 'reefer',
    photo: null,
    shigoto: 'れいとう<ruby>車<rt>しゃ</rt></ruby>は、アイスや おさかなを、つめたい ままで はこぶ しごとを して います。',
    tsukuri: [
      {
        part: 'cooler', label: 'ひやす きかい',
        text: 'その ために、にだいの <ruby>前<rt>まえ</rt></ruby>に、<ruby>中<rt>なか</rt></ruby>を ひやす きかいが ついて います。'
      },
      {
        part: 'wall', label: 'あつい かべ',
        text: 'つめたい くうきが にげない ように、にだいの かべが あつく つくって あります。'
      }
    ],
    hakken: '<ruby>中<rt>なか</rt></ruby>の つめたさは、うんてんせきに ある きかいで いつでも しらべられます。'
  },
  {
    id: 'moving',
    name: 'ひっこし<ruby>車<rt>しゃ</rt></ruby>',
    kana: 'ひっこししゃ',
    category: 'hakobu',
    art: 'moving',
    photo: null,
    shigoto: 'ひっこし<ruby>車<rt>しゃ</rt></ruby>は、おうちの かぐや にもつを、あたらしい おうちへ はこぶ しごとを して います。',
    tsukuri: [
      {
        part: 'nidai', label: 'にだい',
        text: 'その ために、たんすや れいぞうこも <ruby>入<rt>はい</rt></ruby>る、せの <ruby>高<rt>たか</rt></ruby>い にだいに なって います。'
      },
      {
        part: 'gate', label: 'あげさげ<ruby>台<rt>だい</rt></ruby>',
        text: 'おもい かぐを らくに のせられる ように、うしろの <ruby>台<rt>だい</rt></ruby>が <ruby>上<rt>うえ</rt></ruby>と <ruby>下<rt>した</rt></ruby>に うごきます。'
      }
    ],
    hakken: 'にもつに きずが つかない ように、あつい ぬのを かけてから はこびます。'
  },
  {
    id: 'schoolbus',
    name: 'スクールバス',
    kana: 'スクールバス',
    category: 'hakobu',
    art: 'schoolbus',
    photo: null,
    shigoto: 'スクールバスは、<ruby>子<rt>こ</rt></ruby>どもたちを がっこうまで のせて はこぶ しごとを して います。',
    tsukuri: [
      {
        part: 'seat', label: 'ざせき',
        text: 'その ために、<ruby>子<rt>こ</rt></ruby>どもの からだに あった、ちいさめの ざせきが ならんで います。'
      },
      {
        part: 'step', label: 'かいだん',
        text: '<ruby>小<rt>ちい</rt></ruby>さい <ruby>子<rt>こ</rt></ruby>でも のりやすい ように、とびらの <ruby>下<rt>した</rt></ruby>に ひくい かいだんが ついて います。'
      }
    ],
    hakken: 'まわりの <ruby>車<rt>くるま</rt></ruby>から よく <ruby>見<rt>み</rt></ruby>える ように、きいろく ぬって ある バスが おおいです。'
  },
  {
    id: 'cash',
    name: 'げんきんゆそう<ruby>車<rt>しゃ</rt></ruby>',
    kana: 'げんきんゆそうしゃ',
    category: 'hakobu',
    art: 'cash',
    photo: null,
    shigoto: 'げんきんゆそう<ruby>車<rt>しゃ</rt></ruby>は、ぎんこうの お<ruby>金<rt>かね</rt></ruby>を、あんぜんに はこぶ しごとを して います。',
    tsukuri: [
      {
        part: 'safe', label: 'かたい はこ',
        text: 'その ために、うしろが、かんたんには あかない かたい はこに なって います。'
      },
      {
        part: 'window', label: 'まど',
        text: 'そとから <ruby>中<rt>なか</rt></ruby>が <ruby>見<rt>み</rt></ruby>えない ように、まどが とても <ruby>小<rt>ちい</rt></ruby>さく つくって あります。'
      }
    ],
    hakken: 'とびらは、<ruby>中<rt>なか</rt></ruby>に いる <ruby>人<rt>ひと</rt></ruby>が よいと しらせるまで あかない しくみに なって います。'
  },
  {
    id: 'welfare',
    name: 'ふくし<ruby>車<rt>しゃ</rt></ruby>',
    kana: 'ふくししゃ',
    category: 'hakobu',
    art: 'welfare',
    photo: null,
    shigoto: 'ふくし<ruby>車<rt>しゃ</rt></ruby>は、<ruby>車<rt>くるま</rt></ruby>いすの <ruby>人<rt>ひと</rt></ruby>を、のったまま はこぶ しごとを して います。',
    tsukuri: [
      {
        part: 'slope', label: 'スロープ',
        text: 'その ために、うしろに、<ruby>車<rt>くるま</rt></ruby>いすが のぼれる さかみち（スロープ）が ついて います。'
      },
      {
        part: 'belt', label: 'とめる ベルト',
        text: 'はしって いる あいだ うごかない ように、<ruby>車<rt>くるま</rt></ruby>いすを ゆかに とめる ベルトが ついて います。'
      }
    ],
    hakken: 'スロープの かわりに、<ruby>車<rt>くるま</rt></ruby>いすごと もち<ruby>上<rt>あ</rt></ruby>げる リフトが ついた <ruby>車<rt>くるま</rt></ruby>も あります。'
  },

  /* ========================= つくる・なおす ========================= */
  {
    id: 'crane',
    name: 'クレーン<ruby>車<rt>しゃ</rt></ruby>',
    kana: 'クレーンしゃ',
    category: 'tsukuru',
    art: 'crane',
    photo: null,
    shigoto: 'クレーン<ruby>車<rt>しゃ</rt></ruby>は、<ruby>人<rt>ひと</rt></ruby>の <ruby>手<rt>て</rt></ruby>では もてない おもい ものを、<ruby>高<rt>たか</rt></ruby>い ところまで つり<ruby>上<rt>あ</rt></ruby>げる しごとを して います。',
    tsukuri: [
      {
        part: 'arm', label: 'うで',
        text: 'その ために、ながく のびる じょうぶな うでが ついて います。'
      },
      {
        part: 'ashi', label: 'あし',
        text: 'おもい ものを つっても <ruby>車<rt>くるま</rt></ruby>が たおれない ように、<ruby>四本<rt>よんほん</rt></ruby>の しっかりした あしを <ruby>出<rt>だ</rt></ruby>して、<ruby>地<rt>じ</rt></ruby>めんを おさえます。'
      }
    ],
    hakken: 'うでは、はしごの ように <ruby>中<rt>なか</rt></ruby>から つぎつぎに のびて、ビルの <ruby>屋上<rt>おくじょう</rt></ruby>まで とどきます。'
  },
  {
    id: 'shovel',
    name: 'ショベルカー',
    kana: 'ショベルカー',
    category: 'tsukuru',
    art: 'shovel',
    photo: null,
    shigoto: 'ショベルカーは、かたい <ruby>土<rt>つち</rt></ruby>を ほったり、すくって はこんだり する しごとを して います。',
    tsukuri: [
      {
        part: 'bucket', label: 'バケット',
        text: 'その ために、うでの さきに、<ruby>土<rt>つち</rt></ruby>を すくう <ruby>大<rt>おお</rt></ruby>きな バケットが ついて います。'
      },
      {
        part: 'crawler', label: 'キャタピラ',
        text: 'やわらかい <ruby>土<rt>つち</rt></ruby>の <ruby>上<rt>うえ</rt></ruby>でも しずまない ように、タイヤの かわりに ベルトのような キャタピラが ついて います。'
      }
    ],
    hakken: 'うでの さきを とりかえると、コンクリートを こわす ドリルにも なります。'
  },
  {
    id: 'bulldozer',
    name: 'ブルドーザー',
    kana: 'ブルドーザー',
    category: 'tsukuru',
    art: 'bulldozer',
    photo: null,
    shigoto: 'ブルドーザーは、でこぼこの <ruby>土<rt>つち</rt></ruby>を おして、たいらな <ruby>地<rt>じ</rt></ruby>めんに する しごとを して います。',
    tsukuri: [
      {
        part: 'blade', label: 'はね',
        text: 'その ために、<ruby>前<rt>まえ</rt></ruby>に、<ruby>土<rt>つち</rt></ruby>を おしのける <ruby>大<rt>おお</rt></ruby>きな はねが ついて います。'
      },
      {
        part: 'crawler', label: 'キャタピラ',
        text: 'つよい <ruby>力<rt>ちから</rt></ruby>で おせる ように、はばの ひろい キャタピラで、しっかりと <ruby>地<rt>じ</rt></ruby>めんを つかみます。'
      }
    ],
    hakken: 'はねは <ruby>上下<rt>じょうげ</rt></ruby>に うごきます。<ruby>少<rt>すこ</rt></ruby>しずつ <ruby>下<rt>さ</rt></ruby>げながら すすむと、<ruby>地<rt>じ</rt></ruby>めんが たいらに なります。'
  },
  {
    id: 'mixer',
    name: 'ミキサー<ruby>車<rt>しゃ</rt></ruby>',
    kana: 'ミキサーしゃ',
    category: 'tsukuru',
    art: 'mixer',
    photo: null,
    shigoto: 'ミキサー<ruby>車<rt>しゃ</rt></ruby>は、こうじの ばしょまで、コンクリートを はこぶ しごとを して います。',
    tsukuri: [
      {
        part: 'drum', label: 'ドラム',
        text: 'その ために、うしろに、いつも ぐるぐる まわる <ruby>大<rt>おお</rt></ruby>きな ドラムが ついて います。'
      },
      {
        part: 'chute', label: 'シュート',
        text: 'はこんだ コンクリートを ながしこめる ように、といのような シュートが ついて います。'
      }
    ],
    hakken: 'ドラムが まわりつづけるのは、はこぶ とちゅうで コンクリートが かたまって しまわない ようにする ためです。'
  },
  {
    id: 'roller',
    name: 'ロードローラー',
    kana: 'ロードローラー',
    category: 'tsukuru',
    art: 'roller',
    photo: null,
    shigoto: 'ロードローラーは、あたらしい どうろを おして かためる しごとを して います。',
    tsukuri: [
      {
        part: 'roller', label: 'ローラー',
        text: 'その ために、<ruby>前<rt>まえ</rt></ruby>と うしろに、てつで できた <ruby>大<rt>おお</rt></ruby>きくて おもい ローラーが ついて います。'
      },
      {
        part: 'seat', label: 'ざせき',
        text: 'どこまで かためたかが よく <ruby>見<rt>み</rt></ruby>える ように、ざせきが <ruby>高<rt>たか</rt></ruby>い ところに あります。'
      }
    ],
    hakken: 'おなじ ところを なんども いったり きたり して、どうろを たいらに かためます。'
  },
  {
    id: 'dump',
    name: 'ダンプカー',
    kana: 'ダンプカー',
    category: 'tsukuru',
    art: 'dump',
    photo: null,
    shigoto: 'ダンプカーは、<ruby>土<rt>つち</rt></ruby>や すなを たくさん はこんで、いっきに おろす しごとを して います。',
    tsukuri: [
      {
        part: 'nidai', label: 'にだい',
        text: 'その ために、にだいが うしろに かたむいて、<ruby>土<rt>つち</rt></ruby>を ざあっと おろせる ように なって います。'
      },
      {
        part: 'tire', label: 'タイヤ',
        text: 'おもい <ruby>土<rt>つち</rt></ruby>を のせても だいじょうぶな ように、じょうぶで <ruby>大<rt>おお</rt></ruby>きな タイヤが ついて います。'
      }
    ],
    hakken: 'にだいを もち<ruby>上<rt>あ</rt></ruby>げるのは、<ruby>力<rt>ちから</rt></ruby>の つよい「シリンダー」と いう ぼうです。'
  },
  {
    id: 'aerial',
    name: '<ruby>高<rt>こう</rt></ruby>しょさぎょう<ruby>車<rt>しゃ</rt></ruby>',
    kana: 'こうしょさぎょうしゃ',
    category: 'tsukuru',
    art: 'aerial',
    photo: null,
    shigoto: '<ruby>高<rt>こう</rt></ruby>しょさぎょう<ruby>車<rt>しゃ</rt></ruby>は、はたらく <ruby>人<rt>ひと</rt></ruby>を <ruby>高<rt>たか</rt></ruby>い ところまで はこぶ しごとを して います。',
    tsukuri: [
      {
        part: 'basket', label: 'かご',
        text: 'その ために、うでの さきに、<ruby>人<rt>ひと</rt></ruby>が のる かごが ついて います。'
      },
      {
        part: 'ashi', label: 'あし',
        text: 'うでを <ruby>高<rt>たか</rt></ruby>く のばしても たおれない ように、<ruby>四本<rt>よんほん</rt></ruby>の あしを <ruby>出<rt>だ</rt></ruby>して <ruby>地<rt>じ</rt></ruby>めんを おさえます。'
      }
    ],
    hakken: 'でんちゅうの こうじや、まちの あかりを とりかえる ときに つかわれます。'
  },
  {
    id: 'forklift',
    name: 'フォークリフト',
    kana: 'フォークリフト',
    category: 'tsukuru',
    art: 'forklift',
    photo: null,
    shigoto: 'フォークリフトは、そうこの <ruby>中<rt>なか</rt></ruby>で、おもい にもつを もち<ruby>上<rt>あ</rt></ruby>げて はこぶ しごとを して います。',
    tsukuri: [
      {
        part: 'fork', label: 'つめ',
        text: 'その ために、<ruby>前<rt>まえ</rt></ruby>に、にもつの <ruby>下<rt>した</rt></ruby>に さしこむ <ruby>二本<rt>にほん</rt></ruby>の つめが ついて います。'
      },
      {
        part: 'mast', label: 'マスト',
        text: 'にもつを <ruby>高<rt>たか</rt></ruby>い たなに のせられる ように、つめが まっすぐ <ruby>上<rt>うえ</rt></ruby>に のびて いきます。'
      }
    ],
    hakken: 'そうこでは、この フォークリフトが トラックの にだいへ にもつを つみこみます。'
  },

  {
    id: 'loader',
    name: 'ホイールローダー',
    kana: 'ホイールローダー',
    category: 'tsukuru',
    art: 'loader',
    photo: null,
    shigoto: 'ホイールローダーは、つみ<ruby>上<rt>あ</rt></ruby>げられた <ruby>土<rt>つち</rt></ruby>や すなを すくって、トラックに のせる しごとを して います。',
    tsukuri: [
      {
        part: 'bucket', label: 'バケット',
        text: 'その ために、<ruby>前<rt>まえ</rt></ruby>に、いちどに たくさん すくえる <ruby>大<rt>おお</rt></ruby>きな バケットが ついて います。'
      },
      {
        part: 'bigtire', label: '<ruby>大<rt>おお</rt></ruby>きな タイヤ',
        text: 'でこぼこの <ruby>地<rt>じ</rt></ruby>めんでも すすめる ように、みぞの ふかい <ruby>大<rt>おお</rt></ruby>きな タイヤが ついて います。'
      }
    ],
    hakken: 'まん<ruby>中<rt>なか</rt></ruby>から くの<ruby>字<rt>じ</rt></ruby>に まがるので、せまい ばしょでも むきを かえられます。'
  },
  {
    id: 'paver',
    name: 'ほそう<ruby>車<rt>しゃ</rt></ruby>',
    kana: 'ほそうしゃ',
    category: 'tsukuru',
    art: 'paver',
    photo: null,
    shigoto: 'ほそう<ruby>車<rt>しゃ</rt></ruby>は、あつい アスファルトを <ruby>地<rt>じ</rt></ruby>めんに ひろげて、あたらしい どうろを つくる しごとを して います。',
    tsukuri: [
      {
        part: 'hopper', label: 'うける ところ',
        text: 'その ために、<ruby>前<rt>まえ</rt></ruby>に、ダンプカーから アスファルトを うけとる <ruby>大<rt>おお</rt></ruby>きな <ruby>入<rt>い</rt></ruby>れものが ついて います。'
      },
      {
        part: 'screed', label: 'ならす いた',
        text: 'どうろが たいらに なる ように、うしろの ながい いたが、アスファルトを ならしながら すすみます。'
      }
    ],
    hakken: 'ほそう<ruby>車<rt>しゃ</rt></ruby>の あとから ロードローラーが きて、どうろを おして かためます。'
  },
  {
    id: 'pumpcar',
    name: 'コンクリートポンプ<ruby>車<rt>しゃ</rt></ruby>',
    kana: 'コンクリートポンプしゃ',
    category: 'tsukuru',
    art: 'pumpcar',
    photo: null,
    shigoto: 'コンクリートポンプ<ruby>車<rt>しゃ</rt></ruby>は、コンクリートを <ruby>高<rt>たか</rt></ruby>い ところや とおい ところへ おくる しごとを して います。',
    tsukuri: [
      {
        part: 'boom', label: 'うで',
        text: 'その ために、おれまがりながら のびる ながい うでが ついて います。'
      },
      {
        part: 'ashi', label: 'あし',
        text: 'うでを のばしても たおれない ように、よこに <ruby>四本<rt>よんほん</rt></ruby>の あしを <ruby>出<rt>だ</rt></ruby>して <ruby>地<rt>じ</rt></ruby>めんを おさえます。'
      }
    ],
    hakken: 'うでの <ruby>中<rt>なか</rt></ruby>は くだに なって いて、その <ruby>中<rt>なか</rt></ruby>を コンクリートが とおって いきます。'
  },
  {
    id: 'breaker',
    name: 'かいたい<ruby>車<rt>しゃ</rt></ruby>',
    kana: 'かいたいしゃ',
    category: 'tsukuru',
    art: 'breaker',
    photo: null,
    shigoto: 'かいたい<ruby>車<rt>しゃ</rt></ruby>は、ふるく なった たてものを こわして、かたづける しごとを して います。',
    tsukuri: [
      {
        part: 'nipper', label: 'つかむ <ruby>手<rt>て</rt></ruby>',
        text: 'その ために、ながい うでの さきに、かべを かみくだく <ruby>大<rt>おお</rt></ruby>きな <ruby>手<rt>て</rt></ruby>が ついて います。'
      },
      {
        part: 'crawler', label: 'キャタピラ',
        text: 'こわれた かべの <ruby>上<rt>うえ</rt></ruby>でも すすめる ように、はばの ひろい キャタピラが ついて います。'
      }
    ],
    hakken: 'ほこりが とばない ように、<ruby>水<rt>みず</rt></ruby>を かけながら たてものを こわします。'
  },
  {
    id: 'grader',
    name: 'グレーダー',
    kana: 'グレーダー',
    category: 'tsukuru',
    art: 'grader',
    photo: null,
    shigoto: 'グレーダーは、どうろの <ruby>地<rt>じ</rt></ruby>めんを けずって、たいらに ならす しごとを して います。',
    tsukuri: [
      {
        part: 'blade', label: 'けずる は',
        text: 'その ために、<ruby>前<rt>まえ</rt></ruby>と うしろの タイヤの <ruby>間<rt>あいだ</rt></ruby>に、<ruby>土<rt>つち</rt></ruby>を けずる ながい はが ついて います。'
      },
      {
        part: 'body', label: 'ながい からだ',
        text: 'すこしの でこぼこも うまく けずれる ように、からだが とても ながく つくって あります。'
      }
    ],
    hakken: 'はの むきを かえると、けずった <ruby>土<rt>つち</rt></ruby>を みちの はしへ よせながら すすめます。'
  },

  /* ======================= たすける・まもる ======================= */
  {
    id: 'ambulance',
    name: 'きゅうきゅう<ruby>車<rt>しゃ</rt></ruby>',
    kana: 'きゅうきゅうしゃ',
    category: 'mamoru',
    art: 'ambulance',
    photo: null,
    shigoto: 'きゅうきゅう<ruby>車<rt>しゃ</rt></ruby>は、けがや びょうきの <ruby>人<rt>ひと</rt></ruby>を、びょういんまで はやく はこぶ しごとを して います。',
    tsukuri: [
      {
        part: 'bed', label: 'ベッド',
        text: 'その ために、<ruby>車<rt>くるま</rt></ruby>の <ruby>中<rt>なか</rt></ruby>に、ねかせた ままで はこべる ベッドが つくって あります。'
      },
      {
        part: 'lamp', label: 'ランプ',
        text: 'まわりの <ruby>車<rt>くるま</rt></ruby>に <ruby>気<rt>き</rt></ruby>づいて もらえる ように、<ruby>上<rt>うえ</rt></ruby>に あかい ランプと サイレンが ついて います。'
      }
    ],
    hakken: 'うしろの とびらは <ruby>大<rt>おお</rt></ruby>きく ひらき、ベッドを のせやすい ように <ruby>台<rt>だい</rt></ruby>が <ruby>出<rt>で</rt></ruby>て きます。'
  },
  {
    id: 'fire',
    name: 'しょうぼう<ruby>車<rt>しゃ</rt></ruby>',
    kana: 'しょうぼうしゃ',
    category: 'mamoru',
    art: 'fire',
    photo: null,
    shigoto: 'しょうぼう<ruby>車<rt>しゃ</rt></ruby>は、<ruby>火事<rt>かじ</rt></ruby>を けす ために、<ruby>水<rt>みず</rt></ruby>を かける しごとを して います。',
    tsukuri: [
      {
        part: 'pump', label: 'ポンプ',
        text: 'その ために、<ruby>川<rt>かわ</rt></ruby>や しょうかせんから <ruby>水<rt>みず</rt></ruby>を すい<ruby>上<rt>あ</rt></ruby>げて、いきおいよく おくり<ruby>出<rt>だ</rt></ruby>す ポンプが ついて います。'
      },
      {
        part: 'hose', label: 'ホース',
        text: '<ruby>火事<rt>かじ</rt></ruby>の ばしょまで とどく ように、ながい ホースが たくさん つんで あります。'
      }
    ],
    hakken: '<ruby>車<rt>くるま</rt></ruby>の <ruby>中<rt>なか</rt></ruby>に <ruby>水<rt>みず</rt></ruby>の タンクを もって いるので、ついて すぐに <ruby>水<rt>みず</rt></ruby>を かけられます。'
  },
  {
    id: 'ladder',
    name: 'はしご<ruby>車<rt>しゃ</rt></ruby>',
    kana: 'はしごしゃ',
    category: 'mamoru',
    art: 'ladder',
    photo: null,
    shigoto: 'はしご<ruby>車<rt>しゃ</rt></ruby>は、<ruby>高<rt>たか</rt></ruby>い ビルに いる <ruby>人<rt>ひと</rt></ruby>を、たすけ<ruby>出<rt>だ</rt></ruby>す しごとを して います。',
    tsukuri: [
      {
        part: 'ladder', label: 'はしご',
        text: 'その ために、<ruby>上<rt>うえ</rt></ruby>に、ながく のびる はしごが ついて います。'
      },
      {
        part: 'ashi', label: 'あし',
        text: 'はしごを のばしても たおれない ように、<ruby>四本<rt>よんほん</rt></ruby>の しっかりした あしを <ruby>出<rt>だ</rt></ruby>します。'
      }
    ],
    hakken: 'はしごの さきには <ruby>人<rt>ひと</rt></ruby>が のる かごが あり、まどから にげて きた <ruby>人<rt>ひと</rt></ruby>を のせられます。'
  },
  {
    id: 'police',
    name: 'パトカー',
    kana: 'パトカー',
    category: 'mamoru',
    art: 'police',
    photo: null,
    shigoto: 'パトカーは、まちを まわって、みんなの あんぜんを まもる しごとを して います。',
    tsukuri: [
      {
        part: 'lamp', label: 'ランプ',
        text: 'その ために、やねの <ruby>上<rt>うえ</rt></ruby>に、くるくる まわる あかい ランプが ついて います。'
      },
      {
        part: 'antenna', label: 'アンテナ',
        text: 'はなれた ところと <ruby>話<rt>はな</rt></ruby>が できる ように、むせんの アンテナが ついて います。'
      }
    ],
    hakken: '<ruby>車<rt>くるま</rt></ruby>の <ruby>中<rt>なか</rt></ruby>には、まちを しらべる ための きかいが つんで あります。'
  },
  {
    id: 'wrecker',
    name: 'レッカー<ruby>車<rt>しゃ</rt></ruby>',
    kana: 'レッカーしゃ',
    category: 'mamoru',
    art: 'wrecker',
    photo: null,
    shigoto: 'レッカー<ruby>車<rt>しゃ</rt></ruby>は、うごかなく なった <ruby>車<rt>くるま</rt></ruby>を、なおす ところまで はこぶ しごとを して います。',
    tsukuri: [
      {
        part: 'arm', label: 'うで',
        text: 'その ために、うしろに、<ruby>車<rt>くるま</rt></ruby>を つり<ruby>上<rt>あ</rt></ruby>げる うでが ついて います。'
      },
      {
        part: 'hook', label: 'フック',
        text: 'うごけない <ruby>車<rt>くるま</rt></ruby>を ひっぱれる ように、じょうぶな くさりと フックが ついて います。'
      }
    ],
    hakken: '<ruby>前<rt>まえ</rt></ruby>の タイヤだけを もち<ruby>上<rt>あ</rt></ruby>げて、うしろの タイヤを ころがしながら はこびます。'
  },
  {
    id: 'snowplow',
    name: 'じょせつ<ruby>車<rt>しゃ</rt></ruby>',
    kana: 'じょせつしゃ',
    category: 'mamoru',
    art: 'snowplow',
    photo: null,
    shigoto: 'じょせつ<ruby>車<rt>しゃ</rt></ruby>は、ふりつもった <ruby>雪<rt>ゆき</rt></ruby>を どけて、<ruby>車<rt>くるま</rt></ruby>が とおれる ように する しごとを して います。',
    tsukuri: [
      {
        part: 'plow', label: 'はね',
        text: 'その ために、<ruby>前<rt>まえ</rt></ruby>に、<ruby>雪<rt>ゆき</rt></ruby>を よこへ おしのける <ruby>大<rt>おお</rt></ruby>きな はねが ついて います。'
      },
      {
        part: 'hopper', label: 'まく ところ',
        text: 'こおった みちで すべらない ように、うしろから すなを まきながら すすみます。'
      }
    ],
    hakken: '<ruby>雪<rt>ゆき</rt></ruby>の <ruby>中<rt>なか</rt></ruby>でも <ruby>見<rt>み</rt></ruby>つけやすい ように、<ruby>車<rt>くるま</rt></ruby>が きいろく ぬって あります。'
  },
  {
    id: 'blood',
    name: 'けんけつ<ruby>車<rt>しゃ</rt></ruby>',
    kana: 'けんけつしゃ',
    category: 'mamoru',
    art: 'blood',
    photo: null,
    shigoto: 'けんけつ<ruby>車<rt>しゃ</rt></ruby>は、まちを まわって、みんなから <ruby>血<rt>ち</rt></ruby>を <ruby>分<rt>わ</rt></ruby>けて もらう しごとを して います。',
    tsukuri: [
      {
        part: 'bed', label: 'ベッド',
        text: 'その ために、<ruby>車<rt>くるま</rt></ruby>の <ruby>中<rt>なか</rt></ruby>に、よこに なれる ベッドが ならべて あります。'
      },
      {
        part: 'door', label: 'とびら',
        text: 'のりおりが しやすい ように、とびらの <ruby>下<rt>した</rt></ruby>に かいだんが ついて います。'
      }
    ],
    hakken: '<ruby>分<rt>わ</rt></ruby>けて もらった <ruby>血<rt>ち</rt></ruby>は、けがや びょうきの <ruby>人<rt>ひと</rt></ruby>を たすける ために つかわれます。'
  },

  {
    id: 'rescue',
    name: 'きゅうじょ<ruby>車<rt>しゃ</rt></ruby>',
    kana: 'きゅうじょしゃ',
    category: 'mamoru',
    art: 'rescue',
    photo: null,
    shigoto: 'きゅうじょ<ruby>車<rt>しゃ</rt></ruby>は、じこや さいがいで うごけなく なった <ruby>人<rt>ひと</rt></ruby>を、たすけ<ruby>出<rt>だ</rt></ruby>す しごとを して います。',
    tsukuri: [
      {
        part: 'box', label: 'どうぐばこ',
        text: 'その ために、よこの とびらの <ruby>中<rt>なか</rt></ruby>が、たくさんの どうぐを しまう たなに なって います。'
      },
      {
        part: 'winch', label: 'つなを まく きかい',
        text: 'おもい ものを ひっぱれる ように、<ruby>前<rt>まえ</rt></ruby>に つなを まきとる きかいが ついて います。'
      }
    ],
    hakken: 'てつを きる きかいや もち<ruby>上<rt>あ</rt></ruby>げる きかいなど、<ruby>百<rt>ひゃく</rt></ruby>より おおくの どうぐを つんで います。'
  },
  {
    id: 'foam',
    name: 'かがくしょうぼう<ruby>車<rt>しゃ</rt></ruby>',
    kana: 'かがくしょうぼうしゃ',
    category: 'mamoru',
    art: 'foam',
    photo: null,
    shigoto: 'かがくしょうぼう<ruby>車<rt>しゃ</rt></ruby>は、<ruby>水<rt>みず</rt></ruby>では けせない <ruby>火<rt>ひ</rt></ruby>を、あわで けす しごとを して います。',
    tsukuri: [
      {
        part: 'tank', label: 'あわの タンク',
        text: 'その ために、あわの もとを ためて おく <ruby>大<rt>おお</rt></ruby>きな タンクを つんで います。'
      },
      {
        part: 'turret', label: 'ノズル',
        text: 'とおくまで あわを とばせる ように、やねの <ruby>上<rt>うえ</rt></ruby>に、むきを かえられる ふとい くちが ついて います。'
      }
    ],
    hakken: 'ガソリンの <ruby>火事<rt>かじ</rt></ruby>に <ruby>水<rt>みず</rt></ruby>を かけると あぶないので、あわで ふたを して <ruby>火<rt>ひ</rt></ruby>を けします。'
  },
  {
    id: 'doctorcar',
    name: 'ドクターカー',
    kana: 'ドクターカー',
    category: 'mamoru',
    art: 'doctorcar',
    photo: null,
    shigoto: 'ドクターカーは、おいしゃさんを けがの ばしょまで はやく はこぶ しごとを して います。',
    tsukuri: [
      {
        part: 'kit', label: 'きゅうきゅうバッグ',
        text: 'その ために、<ruby>車<rt>くるま</rt></ruby>の <ruby>中<rt>なか</rt></ruby>に、すぐに <ruby>手当<rt>てあ</rt></ruby>てが できる どうぐが つんで あります。'
      },
      {
        part: 'lamp', label: 'ランプ',
        text: 'いそいで すすめる ように、<ruby>上<rt>うえ</rt></ruby>に あかい ランプと サイレンが ついて います。'
      }
    ],
    hakken: 'びょういんに つく <ruby>前<rt>まえ</rt></ruby>から <ruby>手当<rt>てあ</rt></ruby>てを はじめられるので、いのちを たすけやすく なります。'
  },
  {
    id: 'xray',
    name: 'けんしん<ruby>車<rt>しゃ</rt></ruby>',
    kana: 'けんしんしゃ',
    category: 'mamoru',
    art: 'xray',
    photo: null,
    shigoto: 'けんしん<ruby>車<rt>しゃ</rt></ruby>は、まちや がっこうを まわって、からだの <ruby>中<rt>なか</rt></ruby>を しらべる しごとを して います。',
    tsukuri: [
      {
        part: 'machine', label: 'しらべる きかい',
        text: 'その ために、<ruby>車<rt>くるま</rt></ruby>の <ruby>中<rt>なか</rt></ruby>が、からだの しゃしんを とる きかいの へやに なって います。'
      },
      {
        part: 'door', label: 'とびら',
        text: 'じゅんばんに <ruby>入<rt>はい</rt></ruby>って いける ように、よこの とびらに かいだんが ついて います。'
      }
    ],
    hakken: 'びょういんが とおい まちでも、この <ruby>車<rt>くるま</rt></ruby>が くれば からだを しらべて もらえます。'
  },

  /* ====================== くらしを ささえる ====================== */
  {
    id: 'garbage',
    name: 'ごみしゅうしゅう<ruby>車<rt>しゃ</rt></ruby>',
    kana: 'ごみしゅうしゅうしゃ',
    category: 'kurashi',
    art: 'garbage',
    photo: null,
    shigoto: 'ごみしゅうしゅう<ruby>車<rt>しゃ</rt></ruby>は、まちの ごみを あつめて、もやす ところまで はこぶ しごとを して います。',
    tsukuri: [
      {
        part: 'hopper', label: 'ごみを <ruby>入<rt>い</rt></ruby>れる ところ',
        text: 'その ために、うしろに、ごみを <ruby>入<rt>い</rt></ruby>れる <ruby>口<rt>くち</rt></ruby>と、おくへ おしこむ ばんが ついて います。'
      },
      {
        part: 'nidai', label: 'ためる ところ',
        text: 'たくさん つめる ように、あつめた ごみを ぎゅっと おしかためて、<ruby>中<rt>なか</rt></ruby>に ためて いきます。'
      }
    ],
    hakken: 'ばんが くるりと まわって ごみを おしこむので、<ruby>手<rt>て</rt></ruby>を <ruby>入<rt>い</rt></ruby>れると あぶないです。ちかづかない ように しましょう。'
  },
  {
    id: 'sweeper',
    name: 'そうじ<ruby>車<rt>しゃ</rt></ruby>',
    kana: 'そうじしゃ',
    category: 'kurashi',
    art: 'sweeper',
    photo: null,
    shigoto: 'そうじ<ruby>車<rt>しゃ</rt></ruby>は、どうろの すなや ごみを あつめて、まちを きれいに する しごとを して います。',
    tsukuri: [
      {
        part: 'brush', label: 'ブラシ',
        text: 'その ために、<ruby>下<rt>した</rt></ruby>に、ぐるぐる まわる <ruby>大<rt>おお</rt></ruby>きな ブラシが ついて います。'
      },
      {
        part: 'tank', label: 'タンク',
        text: 'あつめた ごみを ためられる ように、<ruby>上<rt>うえ</rt></ruby>が <ruby>大<rt>おお</rt></ruby>きな タンクに なって います。'
      }
    ],
    hakken: 'ほこりが <ruby>立<rt>た</rt></ruby>たない ように、<ruby>水<rt>みず</rt></ruby>を まきながら そうじを します。'
  },
  {
    id: 'water',
    name: 'きゅうすい<ruby>車<rt>しゃ</rt></ruby>',
    kana: 'きゅうすいしゃ',
    category: 'kurashi',
    art: 'water',
    photo: null,
    shigoto: 'きゅうすい<ruby>車<rt>しゃ</rt></ruby>は、<ruby>水<rt>みず</rt></ruby>が <ruby>出<rt>で</rt></ruby>なく なった まちへ、のみ<ruby>水<rt>みず</rt></ruby>を はこぶ しごとを して います。',
    tsukuri: [
      {
        part: 'tank', label: 'タンク',
        text: 'その ために、うしろが、きれいな <ruby>水<rt>みず</rt></ruby>を ためる <ruby>大<rt>おお</rt></ruby>きな タンクに なって います。'
      },
      {
        part: 'tap', label: 'じゃぐち',
        text: 'みんなが じゅんばんに <ruby>水<rt>みず</rt></ruby>を もらえる ように、よこに じゃぐちが ならんで ついて います。'
      }
    ],
    hakken: 'じしんなどで すいどうが つかえなく なった とき、この <ruby>車<rt>くるま</rt></ruby>が <ruby>水<rt>みず</rt></ruby>を はこびます。'
  },
  {
    id: 'kitchen',
    name: 'キッチンカー',
    kana: 'キッチンカー',
    category: 'kurashi',
    art: 'kitchen',
    photo: null,
    shigoto: 'キッチンカーは、まちへ <ruby>出<rt>で</rt></ruby>かけて いって、りょうりを つくって うる しごとを して います。',
    tsukuri: [
      {
        part: 'kitchen', label: 'ちょうりだい',
        text: 'その ために、<ruby>車<rt>くるま</rt></ruby>の <ruby>中<rt>なか</rt></ruby>が、りょうりを つくれる ちょうりだいに なって います。'
      },
      {
        part: 'counter', label: 'カウンター',
        text: 'りょうりを わたしやすい ように、よこの まどが <ruby>大<rt>おお</rt></ruby>きく ひらいて、カウンターに なります。'
      }
    ],
    hakken: '<ruby>水<rt>みず</rt></ruby>の タンクや でんきの きかいも つんで いるので、どこでも お<ruby>店<rt>みせ</rt></ruby>が ひらけます。'
  },
  {
    id: 'library',
    name: 'としょかん<ruby>車<rt>しゃ</rt></ruby>',
    kana: 'としょかんしゃ',
    category: 'kurashi',
    art: 'library',
    photo: null,
    shigoto: 'としょかん<ruby>車<rt>しゃ</rt></ruby>は、としょかんから とおい まちへ、<ruby>本<rt>ほん</rt></ruby>を はこんで かす しごとを して います。',
    tsukuri: [
      {
        part: 'shelf', label: '<ruby>本<rt>ほん</rt></ruby>だな',
        text: 'その ために、<ruby>車<rt>くるま</rt></ruby>の <ruby>中<rt>なか</rt></ruby>が、たくさんの <ruby>本<rt>ほん</rt></ruby>が ならぶ <ruby>本<rt>ほん</rt></ruby>だなに なって います。'
      },
      {
        part: 'step', label: 'かいだん',
        text: '<ruby>子<rt>こ</rt></ruby>どもでも のりやすい ように、<ruby>入口<rt>いりぐち</rt></ruby>に ひくい かいだんが ついて います。'
      }
    ],
    hakken: '<ruby>一<rt>いち</rt></ruby>だいに <ruby>三千<rt>さんぜん</rt></ruby>さつくらいの <ruby>本<rt>ほん</rt></ruby>を つんで、まちを まわります。'
  },
  {
    id: 'sightseeing',
    name: 'かんこうバス',
    kana: 'かんこうバス',
    category: 'kurashi',
    art: 'sightseeing',
    photo: null,
    shigoto: 'かんこうバスは、たくさんの <ruby>人<rt>ひと</rt></ruby>を、とおくの まちまで はこぶ しごとを して います。',
    tsukuri: [
      {
        part: 'seat', label: 'ざせき',
        text: 'その ために、ゆったりと たおれる ざせきが、ならべて あります。'
      },
      {
        part: 'trunk', label: 'にもつ<ruby>入<rt>い</rt></ruby>れ',
        text: '<ruby>大<rt>おお</rt></ruby>きな にもつも つめる ように、ゆかの <ruby>下<rt>した</rt></ruby>が、ひろい にもつ<ruby>入<rt>い</rt></ruby>れに なって います。'
      }
    ],
    hakken: '<ruby>高<rt>たか</rt></ruby>い ところに ざせきが あるので、まどから けしきが よく <ruby>見<rt>み</rt></ruby>えます。'
  },
  {
    id: 'waterworks',
    name: 'すいどうこうじ<ruby>車<rt>しゃ</rt></ruby>',
    kana: 'すいどうこうじしゃ',
    category: 'kurashi',
    art: 'waterworks',
    photo: null,
    shigoto: 'すいどうこうじ<ruby>車<rt>しゃ</rt></ruby>は、<ruby>土<rt>つち</rt></ruby>の <ruby>中<rt>なか</rt></ruby>を とおる すいどうの くだを なおす しごとを して います。',
    tsukuri: [
      {
        part: 'arm', label: 'ちいさな うで',
        text: 'その ために、うしろに、<ruby>地<rt>じ</rt></ruby>めんを ほる ちいさな うでが ついて います。'
      },
      {
        part: 'box', label: 'どうぐばこ',
        text: 'その ばで すぐに なおせる ように、よこに どうぐを しまう はこが ならんで います。'
      }
    ],
    hakken: 'ほった あなは、こうじが おわると もとどおりに うめもどして いきます。'
  },
  {
    id: 'shop',
    name: 'いどうはんばい<ruby>車<rt>しゃ</rt></ruby>',
    kana: 'いどうはんばいしゃ',
    category: 'kurashi',
    art: 'shop',
    photo: null,
    shigoto: 'いどうはんばい<ruby>車<rt>しゃ</rt></ruby>は、お<ruby>店<rt>みせ</rt></ruby>が とおい まちへ、しなものを はこんで うる しごとを して います。',
    tsukuri: [
      {
        part: 'shelf', label: 'たな',
        text: 'その ために、よこの かべが <ruby>上<rt>うえ</rt></ruby>に ひらいて、しなものを ならべる たなに なります。'
      },
      {
        part: 'cooler', label: 'ひやす ところ',
        text: 'おにくや やさいが いたまない ように、ひやして おく ところが あります。'
      }
    ],
    hakken: 'かいものに <ruby>行<rt>い</rt></ruby>くのが たいへんな <ruby>人<rt>ひと</rt></ruby>の ところへ、お<ruby>店<rt>みせ</rt></ruby>の ほうから やって きます。'
  },
  {
    id: 'kei',
    name: 'けいトラック',
    kana: 'けいトラック',
    category: 'kurashi',
    art: 'kei',
    photo: null,
    shigoto: 'けいトラックは、はたけや せまい みちで、すこしの にもつを はこぶ しごとを して います。',
    tsukuri: [
      {
        part: 'nidai', label: 'にだい',
        text: 'その ために、うしろが、やさいの はこを のせる たいらな にだいに なって います。'
      },
      {
        part: 'body', label: 'ちいさい からだ',
        text: 'せまい みちでも とおれる ように、からだが <ruby>小<rt>ちい</rt></ruby>さく つくって あります。'
      }
    ],
    hakken: 'にだいの よこの いたは たおせるので、よこからでも にもつを のせられます。'
  },
  {
    id: 'gas',
    name: 'ガスこうじ<ruby>車<rt>しゃ</rt></ruby>',
    kana: 'ガスこうじしゃ',
    category: 'kurashi',
    art: 'gas',
    photo: null,
    shigoto: 'ガスこうじ<ruby>車<rt>しゃ</rt></ruby>は、おうちへ とどく ガスの くだを しらべて なおす しごとを して います。',
    tsukuri: [
      {
        part: 'detector', label: 'しらべる きかい',
        text: 'その ために、ガスが もれて いないかを しらべる きかいを つんで います。'
      },
      {
        part: 'lamp', label: 'ランプ',
        text: 'こうじを して いる ことが とおくからでも わかる ように、<ruby>上<rt>うえ</rt></ruby>で きいろい ランプが <ruby>光<rt>ひか</rt></ruby>ります。'
      }
    ],
    hakken: 'ガスの においは、もれた ことに <ruby>気<rt>き</rt></ruby>づける ように、わざと つけて あります。'
  },

  /* ======================== そだてる・とる ======================== */
  {
    id: 'tractor',
    name: 'トラクター',
    kana: 'トラクター',
    category: 'sodateru',
    art: 'tractor',
    photo: null,
    shigoto: 'トラクターは、はたけの かたい <ruby>土<rt>つち</rt></ruby>を たがやす しごとを して います。',
    tsukuri: [
      {
        part: 'rotary', label: 'たがやす きかい',
        text: 'その ために、うしろに、<ruby>土<rt>つち</rt></ruby>を ほりおこす はの ついた きかいを つけます。'
      },
      {
        part: 'bigtire', label: 'うしろの タイヤ',
        text: 'やわらかい <ruby>土<rt>つち</rt></ruby>に しずまない ように、うしろの タイヤが とても <ruby>大<rt>おお</rt></ruby>きく、ふかい みぞが ついて います。'
      }
    ],
    hakken: 'うしろの きかいを とりかえると、たねまきや、しゅうかくにも つかえます。'
  },
  {
    id: 'combine',
    name: 'コンバイン',
    kana: 'コンバイン',
    category: 'sodateru',
    art: 'combine',
    photo: null,
    shigoto: 'コンバインは、みのった いねを かりとって、おこめの つぶだけを あつめる しごとを して います。',
    tsukuri: [
      {
        part: 'reel', label: 'かりとる ところ',
        text: 'その ために、<ruby>前<rt>まえ</rt></ruby>に、いねを かきこんで かりとる はが ついて います。'
      },
      {
        part: 'tank', label: 'ためる ところ',
        text: 'つぶだけを ためて おける ように、<ruby>上<rt>うえ</rt></ruby>に <ruby>大<rt>おお</rt></ruby>きな はこが ついて います。'
      }
    ],
    hakken: 'かりとる・つぶを はずす・ためる の <ruby>三<rt>みっ</rt></ruby>つの しごとを、いちどに して しまいます。'
  },
  {
    id: 'rice',
    name: 'たうえき',
    kana: 'たうえき',
    category: 'sodateru',
    art: 'rice',
    photo: null,
    shigoto: 'たうえきは、<ruby>水<rt>みず</rt></ruby>を ためた たんぼに、いねの なえを うえて いく しごとを して います。',
    tsukuri: [
      {
        part: 'planter', label: 'うえる つめ',
        text: 'その ために、うしろに、なえを <ruby>土<rt>つち</rt></ruby>に さしこむ つめが ならんで います。'
      },
      {
        part: 'tray', label: 'なえの たな',
        text: 'たくさん うえられる ように、<ruby>上<rt>うえ</rt></ruby>に なえを ならべる ななめの たなが あります。'
      }
    ],
    hakken: 'なえと なえの あいだが きれいに そろうので、あとの おせわが しやすく なります。'
  },
  {
    id: 'mower',
    name: 'くさかり<ruby>車<rt>しゃ</rt></ruby>',
    kana: 'くさかりしゃ',
    category: 'sodateru',
    art: 'mower',
    photo: null,
    shigoto: 'くさかり<ruby>車<rt>しゃ</rt></ruby>は、どうろの わきや <ruby>土手<rt>どて</rt></ruby>の くさを かる しごとを して います。',
    tsukuri: [
      {
        part: 'cutter', label: 'かる は',
        text: 'その ために、よこに のびる うでの さきに、ぐるぐる まわる はが ついて います。'
      },
      {
        part: 'guard', label: 'カバー',
        text: 'かった くさが とんで こない ように、はの まわりが カバーで かこって あります。'
      }
    ],
    hakken: '<ruby>人<rt>ひと</rt></ruby>が かまで かるより ずっと はやく、ひろい ばしょを きれいに できます。'
  },
  {
    id: 'logger',
    name: '<ruby>木<rt>き</rt></ruby>を はこぶ <ruby>車<rt>くるま</rt></ruby>',
    kana: 'きをはこぶくるま',
    category: 'sodateru',
    art: 'logger',
    photo: null,
    shigoto: '<ruby>木<rt>き</rt></ruby>を はこぶ <ruby>車<rt>くるま</rt></ruby>は、<ruby>山<rt>やま</rt></ruby>で きりたおした <ruby>木<rt>き</rt></ruby>を、まちまで はこぶ しごとを して います。',
    tsukuri: [
      {
        part: 'grapple', label: 'つかむ うで',
        text: 'その ために、<ruby>木<rt>き</rt></ruby>を つかんで もち<ruby>上<rt>あ</rt></ruby>げる うでが ついて います。'
      },
      {
        part: 'stake', label: 'とめる ぼう',
        text: '<ruby>木<rt>き</rt></ruby>が ころがり <ruby>落<rt>お</rt></ruby>ちない ように、にだいの よこに ふとい ぼうが <ruby>立<rt>た</rt></ruby>てて あります。'
      }
    ],
    hakken: 'はこばれた <ruby>木<rt>き</rt></ruby>は、いえの はしらや、かみに なります。'
  },
  {
    id: 'sprayer',
    name: 'くすりを まく <ruby>車<rt>くるま</rt></ruby>',
    kana: 'くすりをまくくるま',
    category: 'sodateru',
    art: 'sprayer',
    photo: null,
    shigoto: 'くすりを まく <ruby>車<rt>くるま</rt></ruby>は、はたけの さくもつを <ruby>虫<rt>むし</rt></ruby>から まもる くすりを まく しごとを して います。',
    tsukuri: [
      {
        part: 'boom', label: 'ながい うで',
        text: 'その ために、うしろに、<ruby>左右<rt>さゆう</rt></ruby>へ ながく のびる うでが ついて いて、いちどに ひろく まけます。'
      },
      {
        part: 'tank', label: 'タンク',
        text: 'なんども <ruby>入<rt>い</rt></ruby>れに もどらなくても よい ように、まん<ruby>中<rt>なか</rt></ruby>に くすりを ためる タンクが あります。'
      }
    ],
    hakken: 'うでは たたんで しまえるので、みちを はしる ときは じゃまに なりません。'
  },

  /* ==================== くうこう・みなと・えき ==================== */
  {
    id: 'towing',
    name: 'トーイングカー',
    kana: 'トーイングカー',
    category: 'basho',
    art: 'towing',
    photo: null,
    shigoto: 'トーイングカーは、くうこうで ひこうきを おしたり ひっぱったり して、うごかす しごとを して います。',
    tsukuri: [
      {
        part: 'body', label: 'ひくい からだ',
        text: 'その ために、ひこうきの <ruby>下<rt>した</rt></ruby>に <ruby>入<rt>はい</rt></ruby>れる ように、からだが とても ひくく つくって あります。'
      },
      {
        part: 'hitch', label: 'つなぐ ところ',
        text: 'ひこうきと しっかり つなげる ように、<ruby>前<rt>まえ</rt></ruby>に ふとい かなぐが ついて います。'
      }
    ],
    hakken: 'ひこうきは じぶんで うしろへ さがれないので、この <ruby>車<rt>くるま</rt></ruby>が おして あげます。'
  },
  {
    id: 'fueler',
    name: 'きゅうゆ<ruby>車<rt>しゃ</rt></ruby>',
    kana: 'きゅうゆしゃ',
    category: 'basho',
    art: 'fueler',
    photo: null,
    shigoto: 'きゅうゆ<ruby>車<rt>しゃ</rt></ruby>は、くうこうで、ひこうきに あぶらを <ruby>入<rt>い</rt></ruby>れる しごとを して います。',
    tsukuri: [
      {
        part: 'tank', label: 'タンク',
        text: 'その ために、たくさんの あぶらを ためて おける ながい タンクが ついて います。'
      },
      {
        part: 'lift', label: 'あがる <ruby>台<rt>だい</rt></ruby>',
        text: 'ひこうきの つばさまで とどく ように、<ruby>人<rt>ひと</rt></ruby>が のる <ruby>台<rt>だい</rt></ruby>が <ruby>上<rt>うえ</rt></ruby>へ あがります。'
      }
    ],
    hakken: 'ひこうきの あぶらは つばさの <ruby>中<rt>なか</rt></ruby>に <ruby>入<rt>い</rt></ruby>れるので、つばさに くだを つなぎます。'
  },
  {
    id: 'cargoloader',
    name: 'ハイリフトローダー',
    kana: 'ハイリフトローダー',
    category: 'basho',
    art: 'cargoloader',
    photo: null,
    shigoto: 'ハイリフトローダーは、ひこうきの <ruby>中<rt>なか</rt></ruby>へ にもつを つみこむ しごとを して います。',
    tsukuri: [
      {
        part: 'deck', label: 'あがる ゆか',
        text: 'その ために、にもつを のせる ゆかが、そのまま <ruby>上<rt>うえ</rt></ruby>へ もち<ruby>上<rt>あ</rt></ruby>がります。'
      },
      {
        part: 'roller', label: 'ころ',
        text: 'おもい にもつを かるく うごかせる ように、ゆかに まるい ころが ならんで います。'
      }
    ],
    hakken: 'ひこうきの ゆかと おなじ <ruby>高<rt>たか</rt></ruby>さに ぴったり あわせてから、にもつを おしこみます。'
  },
  {
    id: 'stairs',
    name: 'タラップ<ruby>車<rt>しゃ</rt></ruby>',
    kana: 'タラップしゃ',
    category: 'basho',
    art: 'stairs',
    photo: null,
    shigoto: 'タラップ<ruby>車<rt>しゃ</rt></ruby>は、ひこうきの <ruby>入口<rt>いりぐち</rt></ruby>まで、のりおりする <ruby>人<rt>ひと</rt></ruby>の かいだんを はこぶ しごとを して います。',
    tsukuri: [
      {
        part: 'stairs', label: 'かいだん',
        text: 'その ために、うしろが、ながい かいだんに なって います。'
      },
      {
        part: 'lift', label: 'のびる ところ',
        text: 'いろいろな <ruby>大<rt>おお</rt></ruby>きさの ひこうきに あう ように、かいだんの <ruby>高<rt>たか</rt></ruby>さを かえられます。'
      }
    ],
    hakken: 'かいだんの <ruby>上<rt>うえ</rt></ruby>には やねが ついて いて、あめの <ruby>日<rt>ひ</rt></ruby>でも ぬれずに のれます。'
  },
  {
    id: 'stacker',
    name: 'リーチスタッカー',
    kana: 'リーチスタッカー',
    category: 'basho',
    art: 'stacker',
    photo: null,
    shigoto: 'リーチスタッカーは、みなとで、おもい コンテナを つみ<ruby>上<rt>あ</rt></ruby>げる しごとを して います。',
    tsukuri: [
      {
        part: 'arm', label: 'のびる うで',
        text: 'その ために、ななめに ながく のびる じょうぶな うでが ついて います。'
      },
      {
        part: 'spreader', label: 'つかむ ところ',
        text: 'コンテナを おとさない ように、うでの さきが かどを がっちり つかみます。'
      }
    ],
    hakken: 'コンテナを <ruby>四<rt>よっ</rt></ruby>つも <ruby>五<rt>いつ</rt></ruby>つも かさねて つみ<ruby>上<rt>あ</rt></ruby>げられます。'
  },
  {
    id: 'railcar',
    name: 'せんろの てんけん<ruby>車<rt>しゃ</rt></ruby>',
    kana: 'せんろのてんけんしゃ',
    category: 'basho',
    art: 'railcar',
    photo: null,
    shigoto: 'せんろの てんけん<ruby>車<rt>しゃ</rt></ruby>は、でんしゃが とまった よるに、せんろを しらべて なおす しごとを して います。',
    tsukuri: [
      {
        part: 'railwheel', label: 'てつの わ',
        text: 'その ために、せんろの <ruby>上<rt>うえ</rt></ruby>を はしれる てつの わが ついて います。'
      },
      {
        part: 'arm', label: 'クレーン',
        text: 'おもい レールを とりかえられる ように、ちいさな クレーンが ついて います。'
      }
    ],
    hakken: 'ひるまは タイヤで どうろを はしり、よるは せんろの <ruby>上<rt>うえ</rt></ruby>に のって しごとを します。'
  }
];
