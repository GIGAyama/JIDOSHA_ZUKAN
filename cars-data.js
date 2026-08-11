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
    photo: 'assets/truck.png',
    shigoto: 'トラックは、たくさんの にもつを とおくまで はこぶ しごとを して います。',
    tsukuri: [
      {
        part: 'nidai', label: 'にだい',
        text: 'その ために、うんてんせきの うしろが、フォークリフトで にもつを その まま のせられる、ひろくて たいらな にだいに なって います。'
      },
      {
        part: 'tire', label: 'タイヤ',
        text: 'おもい にもつを のせても つぶれない ように、うしろの タイヤは <ruby>二本<rt>にほん</rt></ruby>ずつ ならべて つけて あり、ぜんぶで <ruby>十<rt>じゅっ</rt></ruby>こ ちかくも あります。'
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
    photo: 'assets/bus.png',
    shigoto: 'バスは、たくさんの <ruby>人<rt>ひと</rt></ruby>を のせて はこぶ しごとを して います。',
    tsukuri: [
      {
        part: 'seat', label: 'ざせき',
        text: 'その ために、<ruby>車<rt>くるま</rt></ruby>の <ruby>中<rt>なか</rt></ruby>は、まん<ruby>中<rt>なか</rt></ruby>の つうろを あけて ざせきが ならび、<ruby>立<rt>た</rt></ruby>って のる <ruby>人<rt>ひと</rt></ruby>の ための つりかわも ついて います。'
      },
      {
        part: 'door', label: 'とびら',
        text: 'のりおりが しやすい ように、とびらが <ruby>二<rt>に</rt></ruby>まいに <ruby>分<rt>わ</rt></ruby>かれて ひらき、ゆかが <ruby>地<rt>じ</rt></ruby>めんの ちかくまで ひくく なって います。'
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
    photo: 'assets/car.png',
    shigoto: 'じょうよう<ruby>車<rt>しゃ</rt></ruby>は、かぞくや <ruby>友<rt>とも</rt></ruby>だちなど、すこしの <ruby>人<rt>ひと</rt></ruby>を のせて はこぶ しごとを して います。',
    tsukuri: [
      {
        part: 'seat', label: 'ざせき',
        text: 'その ために、うんてんせきも <ruby>入<rt>い</rt></ruby>れて <ruby>四人<rt>よにん</rt></ruby>か <ruby>五人<rt>ごにん</rt></ruby>が すわれる ざせきが、<ruby>二<rt>に</rt></ruby>れつに ならべて あります。'
      },
      {
        part: 'window', label: 'まど',
        text: 'うんてんする <ruby>人<rt>ひと</rt></ruby>が まわりの <ruby>車<rt>くるま</rt></ruby>や <ruby>人<rt>ひと</rt></ruby>に すぐ <ruby>気<rt>き</rt></ruby>づける ように、まどが ぐるりと つき、うしろを うつす かがみも ついて います。'
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
    photo: 'assets/taxi.png',
    shigoto: 'タクシーは、<ruby>行<rt>い</rt></ruby>きたい ところまで <ruby>人<rt>ひと</rt></ruby>を のせて はこぶ しごとを して います。',
    tsukuri: [
      {
        part: 'andon', label: 'あんどん',
        text: 'その ために、やねの <ruby>上<rt>うえ</rt></ruby>に「あんどん」と いう ランプが あり、くらい よるでも とおくから、あれは タクシーだと わかります。'
      },
      {
        part: 'seat', label: 'ざせき',
        text: '<ruby>大<rt>おお</rt></ruby>きな にもつを もった <ruby>人<rt>ひと</rt></ruby>でも ゆったり すわれる ように、うしろの ざせきは <ruby>足<rt>あし</rt></ruby>もとが ひろく つくって あります。'
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
    photo: 'assets/post.png',
    shigoto: 'ゆうびん<ruby>車<rt>しゃ</rt></ruby>は、てがみや はがきを、みんなの おうちへ とどける しごとを して います。',
    tsukuri: [
      {
        part: 'nidai', label: 'にもつ<ruby>入<rt>い</rt></ruby>れ',
        text: 'その ために、うしろが、まちごとに <ruby>分<rt>わ</rt></ruby>けた てがみの ケースを、じゅんばんに ならべて つめる はこに なって います。'
      },
      {
        part: 'door', label: 'とびら',
        text: 'せまい みちに とめても じゃまに ならない ように、うしろの とびらは よこへ すべらせて ひらきます。'
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
    photo: 'assets/delivery.png',
    shigoto: 'たくはい<ruby>車<rt>しゃ</rt></ruby>は、たのまれた にもつを、おうちや お<ruby>店<rt>みせ</rt></ruby>まで とどける しごとを して います。',
    tsukuri: [
      {
        part: 'shelf', label: 'たな',
        text: 'その ために、にもつを <ruby>入<rt>い</rt></ruby>れる ところが、とどける じゅんばんに ならべられる、いくつもの たなに <ruby>分<rt>わ</rt></ruby>かれて います。'
      },
      {
        part: 'door', label: 'とびら',
        text: 'にもつを かかえた ままでも あけられる ように、うしろの とびらは <ruby>上<rt>うえ</rt></ruby>へ まきあがる シャッターに なって います。'
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
    photo: 'assets/tanker.png',
    shigoto: 'タンクローリーは、ガソリンや <ruby>水<rt>みず</rt></ruby>のような、ながれる ものを はこぶ しごとを して います。',
    tsukuri: [
      {
        part: 'tank', label: 'タンク',
        text: 'その ために、うしろが まるくて <ruby>大<rt>おお</rt></ruby>きな タンクに なって いて、<ruby>中<rt>なか</rt></ruby>は いくつかの へやに <ruby>分<rt>わ</rt></ruby>かれて います。'
      },
      {
        part: 'hose', label: 'ホース',
        text: 'ガソリンスタンドの <ruby>地<rt>じ</rt></ruby>めんの <ruby>下<rt>した</rt></ruby>の タンクへ ながしこめる ように、よこに ながい ホースを まいて しまって あります。'
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
    photo: 'assets/carrier.png',
    shigoto: 'キャリアカーは、できたばかりの じどう<ruby>車<rt>しゃ</rt></ruby>を、お<ruby>店<rt>みせ</rt></ruby>まで はこぶ しごとを して います。',
    tsukuri: [
      {
        part: 'deck', label: 'にだい',
        text: 'その ために、<ruby>車<rt>くるま</rt></ruby>を のせる ゆかが <ruby>上<rt>うえ</rt></ruby>と <ruby>下<rt>した</rt></ruby>の <ruby>二<rt>に</rt></ruby>だんに なって いて、<ruby>六<rt>ろく</rt></ruby>だいほども はこべます。'
      },
      {
        part: 'slope', label: 'スロープ',
        text: 'はこぶ <ruby>車<rt>くるま</rt></ruby>が じぶんの タイヤで のぼれる ように、うしろの ゆかが ゆっくり かたむいて、さかみちに かわります。'
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
    photo: 'assets/trailer.png',
    shigoto: 'トレーラーは、<ruby>大<rt>おお</rt></ruby>きな はこ（コンテナ）を、みなとから とおくの まちへ はこぶ しごとを して います。',
    tsukuri: [
      {
        part: 'container', label: 'コンテナ',
        text: 'その ために、うしろが、<ruby>船<rt>ふね</rt></ruby>にも でんしゃにも その まま つみかえられる、ながい コンテナに なって います。'
      },
      {
        part: 'joint', label: 'つなぎめ',
        text: 'まがりみちでも まがれる ように、うんてんせきと コンテナの あいだが、くの<ruby>字<rt>じ</rt></ruby>に おれる つなぎめで つないで あります。'
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
    photo: 'assets/reefer.png',
    shigoto: 'れいとう<ruby>車<rt>しゃ</rt></ruby>は、アイスや おさかなを、つめたい ままで はこぶ しごとを して います。',
    tsukuri: [
      {
        part: 'cooler', label: 'ひやす きかい',
        text: 'その ために、にだいの <ruby>前<rt>まえ</rt></ruby>に、<ruby>中<rt>なか</rt></ruby>を こおりよりも つめたく できる きかいが ついて います。'
      },
      {
        part: 'wall', label: 'あつい かべ',
        text: 'つめたい くうきが にげない ように、にだいの かべが、まほうびんの ように あつく つくって あります。'
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
    photo: 'assets/moving.png',
    shigoto: 'ひっこし<ruby>車<rt>しゃ</rt></ruby>は、おうちの かぐや にもつを、あたらしい おうちへ はこぶ しごとを して います。',
    tsukuri: [
      {
        part: 'nidai', label: 'にだい',
        text: 'その ために、たんすや れいぞうこを <ruby>立<rt>た</rt></ruby>てた まま <ruby>入<rt>い</rt></ruby>れられる、せの <ruby>高<rt>たか</rt></ruby>い にだいに なって います。'
      },
      {
        part: 'gate', label: 'あげさげ<ruby>台<rt>だい</rt></ruby>',
        text: 'おもい かぐを かかえて はしごを のぼらなくて よい ように、うしろの <ruby>台<rt>だい</rt></ruby>が エレベーターの ように <ruby>上<rt>うえ</rt></ruby>や <ruby>下<rt>した</rt></ruby>へ うごきます。'
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
    photo: 'assets/schoolbus.png',
    shigoto: 'スクールバスは、<ruby>子<rt>こ</rt></ruby>どもたちを がっこうまで のせて はこぶ しごとを して います。',
    tsukuri: [
      {
        part: 'seat', label: 'ざせき',
        text: 'その ために、ざせきは <ruby>子<rt>こ</rt></ruby>どもの からだに あわせて ちいさめで、せもたれは からだを まもれる ように <ruby>高<rt>たか</rt></ruby>く つくって あります。'
      },
      {
        part: 'step', label: 'かいだん',
        text: '<ruby>小<rt>ちい</rt></ruby>さい <ruby>子<rt>こ</rt></ruby>でも じぶんで のれる ように、とびらの <ruby>下<rt>した</rt></ruby>から ひくい だんが <ruby>出<rt>で</rt></ruby>て きます。'
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
    photo: 'assets/cash.png',
    shigoto: 'げんきんゆそう<ruby>車<rt>しゃ</rt></ruby>は、ぎんこうの お<ruby>金<rt>かね</rt></ruby>を、あんぜんに はこぶ しごとを して います。',
    tsukuri: [
      {
        part: 'safe', label: 'かたい はこ',
        text: 'その ために、うしろが、そとから <ruby>力<rt>ちから</rt></ruby>を かけても こじあけられない、てつの あつい はこに なって います。'
      },
      {
        part: 'window', label: 'まど',
        text: 'そとから <ruby>中<rt>なか</rt></ruby>の ようすが <ruby>見<rt>み</rt></ruby>えない ように、まどは かおぐらいの <ruby>大<rt>おお</rt></ruby>きさしか なく、ガラスも あつく なって います。'
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
    photo: 'assets/welfare.png',
    shigoto: 'ふくし<ruby>車<rt>しゃ</rt></ruby>は、<ruby>車<rt>くるま</rt></ruby>いすの <ruby>人<rt>ひと</rt></ruby>を、のったまま はこぶ しごとを して います。',
    tsukuri: [
      {
        part: 'slope', label: 'スロープ',
        text: 'その ために、うしろの とびらの ところに、くるまいすに のった ままで のぼれる スロープが おりて きます。'
      },
      {
        part: 'belt', label: 'とめる ベルト',
        text: 'はしって いる あいだ くるまいすが うごかない ように、<ruby>四<rt>よ</rt></ruby>すみを ベルトで ゆかに とめます。'
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
    photo: 'assets/crane.png',
    shigoto: 'クレーン<ruby>車<rt>しゃ</rt></ruby>は、<ruby>人<rt>ひと</rt></ruby>の <ruby>手<rt>て</rt></ruby>では もてない おもい ものを、<ruby>高<rt>たか</rt></ruby>い ところまで つり<ruby>上<rt>あ</rt></ruby>げる しごとを して います。',
    tsukuri: [
      {
        part: 'arm', label: 'うで',
        text: 'その ために、うでが つりざおの ように <ruby>中<rt>なか</rt></ruby>から つぎつぎ のびて、ビルの <ruby>上<rt>うえ</rt></ruby>まで とどきます。'
      },
      {
        part: 'ashi', label: 'あし',
        text: 'おもい ものを つり<ruby>上<rt>あ</rt></ruby>げても たおれない ように、<ruby>四本<rt>よんほん</rt></ruby>の あしを <ruby>大<rt>おお</rt></ruby>きく ひろげ、タイヤが うくまで <ruby>車<rt>くるま</rt></ruby>を もち<ruby>上<rt>あ</rt></ruby>げます。'
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
    photo: 'assets/shovel.png',
    shigoto: 'ショベルカーは、かたい <ruby>土<rt>つち</rt></ruby>を ほったり、すくって はこんだり する しごとを して います。',
    tsukuri: [
      {
        part: 'bucket', label: 'バケット',
        text: 'その ために、うでの さきに するどい つめの ついた バケットが あり、<ruby>地<rt>じ</rt></ruby>めんより <ruby>下<rt>した</rt></ruby>の <ruby>土<rt>つち</rt></ruby>まで ほりおこせます。'
      },
      {
        part: 'crawler', label: 'キャタピラ',
        text: 'ほった あなの ふちの やわらかい <ruby>土<rt>つち</rt></ruby>でも しずまない ように、タイヤの かわりに、ひろい めんで ささえる キャタピラで すすみます。'
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
    photo: 'assets/bulldozer.png',
    shigoto: 'ブルドーザーは、でこぼこの <ruby>土<rt>つち</rt></ruby>を おして、たいらな <ruby>地<rt>じ</rt></ruby>めんに する しごとを して います。',
    tsukuri: [
      {
        part: 'blade', label: 'はね',
        text: 'その ために、<ruby>前<rt>まえ</rt></ruby>に、<ruby>土<rt>つち</rt></ruby>を まとめて <ruby>前<rt>まえ</rt></ruby>へ おして いく <ruby>大<rt>おお</rt></ruby>きな はねが あり、<ruby>上<rt>あ</rt></ruby>げ<ruby>下<rt>さ</rt></ruby>げも できます。'
      },
      {
        part: 'crawler', label: 'キャタピラ',
        text: 'つよい <ruby>力<rt>ちから</rt></ruby>で おしても すべらない ように、キャタピラの でっぱりが <ruby>地<rt>じ</rt></ruby>めんに ぐいと くいこみます。'
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
    photo: 'assets/mixer.png',
    shigoto: 'ミキサー<ruby>車<rt>しゃ</rt></ruby>は、こうじの ばしょまで、コンクリートを はこぶ しごとを して います。',
    tsukuri: [
      {
        part: 'drum', label: 'ドラム',
        text: 'その ために、うしろの <ruby>大<rt>おお</rt></ruby>きな ドラムが、はしって いる あいだも ぐるぐる まわりつづけ、<ruby>中<rt>なか</rt></ruby>の コンクリートを まぜて います。'
      },
      {
        part: 'chute', label: 'シュート',
        text: 'こうじの ばしょの ねらった ところへ ながしこめる ように、うしろの とい（シュート）は むきを かえられます。'
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
    photo: 'assets/roller.png',
    shigoto: 'ロードローラーは、あたらしい どうろを おして かためる しごとを して います。',
    tsukuri: [
      {
        part: 'roller', label: 'ローラー',
        text: 'その ために、<ruby>前<rt>まえ</rt></ruby>と うしろに、<ruby>中<rt>なか</rt></ruby>へ <ruby>水<rt>みず</rt></ruby>を <ruby>入<rt>い</rt></ruby>れて もっと おもく できる、てつの ローラーが ついて います。'
      },
      {
        part: 'seat', label: 'ざせき',
        text: 'ローラーの はしが どこを とおって いるか <ruby>見<rt>み</rt></ruby>える ように、ざせきが <ruby>高<rt>たか</rt></ruby>い ところに あり、よこへ ずらす ことも できます。'
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
    photo: 'assets/dump.png',
    shigoto: 'ダンプカーは、<ruby>土<rt>つち</rt></ruby>や すなを たくさん はこんで、いっきに おろす しごとを して います。',
    tsukuri: [
      {
        part: 'nidai', label: 'にだい',
        text: 'その ために、にだいの <ruby>下<rt>した</rt></ruby>に ふとい つつが あり、それが ぐいと のびて にだいを かたむけ、<ruby>土<rt>つち</rt></ruby>を ざあっと おろします。'
      },
      {
        part: 'cab', label: 'うんてんせき',
        text: '<ruby>上<rt>うえ</rt></ruby>から <ruby>土<rt>つち</rt></ruby>や <ruby>石<rt>いし</rt></ruby>が おちて きても だいじょうぶな ように、うんてんせきの やねが とくべつ じょうぶに つくって あります。'
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
    photo: 'assets/aerial.png',
    shigoto: '<ruby>高<rt>こう</rt></ruby>しょさぎょう<ruby>車<rt>しゃ</rt></ruby>は、はたらく <ruby>人<rt>ひと</rt></ruby>を <ruby>高<rt>たか</rt></ruby>い ところまで はこぶ しごとを して います。',
    tsukuri: [
      {
        part: 'basket', label: 'かご',
        text: 'その ために、うでの さきに <ruby>人<rt>ひと</rt></ruby>が <ruby>立<rt>た</rt></ruby>って はたらける かごが つき、うでが かたむいても かごは いつも まっすぐな ままです。'
      },
      {
        part: 'ashi', label: 'あし',
        text: 'かごが ゆれて あぶなく ならない ように、<ruby>四本<rt>よんほん</rt></ruby>の あしを <ruby>出<rt>だ</rt></ruby>して <ruby>車<rt>くるま</rt></ruby>を とめてからで ないと、うでは のびません。'
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
    photo: 'assets/forklift.png',
    shigoto: 'フォークリフトは、そうこの <ruby>中<rt>なか</rt></ruby>で、おもい にもつを もち<ruby>上<rt>あ</rt></ruby>げて はこぶ しごとを して います。',
    tsukuri: [
      {
        part: 'fork', label: 'つめ',
        text: 'その ために、<ruby>前<rt>まえ</rt></ruby>に、にもつの <ruby>下<rt>した</rt></ruby>の すきまへ さしこむ <ruby>二本<rt>にほん</rt></ruby>の つめが あり、はばも かえられます。'
      },
      {
        part: 'mast', label: 'マスト',
        text: 'そうこの <ruby>高<rt>たか</rt></ruby>い たなに とどく ように、まっすぐな はしらが <ruby>二<rt>に</rt></ruby>だん <ruby>三<rt>さん</rt></ruby>だんと のびて、つめを <ruby>上<rt>うえ</rt></ruby>まで はこびます。'
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
    photo: 'assets/loader.png',
    shigoto: 'ホイールローダーは、つみ<ruby>上<rt>あ</rt></ruby>げられた <ruby>土<rt>つち</rt></ruby>や すなを すくって、トラックに のせる しごとを して います。',
    tsukuri: [
      {
        part: 'bucket', label: 'バケット',
        text: 'その ために、<ruby>前<rt>まえ</rt></ruby>の バケットが、すくった <ruby>土<rt>つち</rt></ruby>を その まま トラックの にだいの <ruby>高<rt>たか</rt></ruby>さまで もち<ruby>上<rt>あ</rt></ruby>げます。'
      },
      {
        part: 'bigtire', label: '<ruby>大<rt>おお</rt></ruby>きな タイヤ',
        text: 'すくう ときに <ruby>前<rt>まえ</rt></ruby>へ ぐっと おしつけても すべらない ように、みぞの ふかい <ruby>大<rt>おお</rt></ruby>きな タイヤが ついて います。'
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
    photo: 'assets/paver.png',
    shigoto: 'ほそう<ruby>車<rt>しゃ</rt></ruby>は、あつい アスファルトを <ruby>地<rt>じ</rt></ruby>めんに ひろげて、あたらしい どうろを つくる しごとを して います。',
    tsukuri: [
      {
        part: 'hopper', label: 'うける ところ',
        text: 'その ために、<ruby>前<rt>まえ</rt></ruby>が、ダンプカーが うしろむきで あける あつい アスファルトを、こぼさず うけとめる <ruby>入<rt>い</rt></ruby>れものに なって います。'
      },
      {
        part: 'screed', label: 'ならす いた',
        text: 'どうろが たいらに なる ように、うしろの ながい いたが、アスファルトを おしつけながら すすみます。'
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
    photo: 'assets/pumpcar.png',
    shigoto: 'コンクリートポンプ<ruby>車<rt>しゃ</rt></ruby>は、コンクリートを <ruby>高<rt>たか</rt></ruby>い ところや とおい ところへ おくる しごとを して います。',
    tsukuri: [
      {
        part: 'boom', label: 'うで',
        text: 'その ために、くの<ruby>字<rt>じ</rt></ruby>に おれまがる ながい うでが あり、その <ruby>中<rt>なか</rt></ruby>の くだを とおって、コンクリートが <ruby>上<rt>うえ</rt></ruby>まで のぼって いきます。'
      },
      {
        part: 'ashi', label: 'あし',
        text: 'うでを のばした ほうへ かたむかない ように、<ruby>車<rt>くるま</rt></ruby>の <ruby>四<rt>よ</rt></ruby>すみから あしを <ruby>出<rt>だ</rt></ruby>して、<ruby>地<rt>じ</rt></ruby>めんを おさえます。'
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
    photo: 'assets/breaker.png',
    shigoto: 'かいたい<ruby>車<rt>しゃ</rt></ruby>は、ふるく なった たてものを こわして、かたづける しごとを して います。',
    tsukuri: [
      {
        part: 'nipper', label: 'つかむ <ruby>手<rt>て</rt></ruby>',
        text: 'その ために、ながい うでの さきに、コンクリートの かべを ぱきんと かみくだく <ruby>大<rt>おお</rt></ruby>きな <ruby>手<rt>て</rt></ruby>が ついて います。'
      },
      {
        part: 'crawler', label: 'キャタピラ',
        text: 'こわれた かべの するどい かけらを ふんでも パンクしない ように、ゴムの タイヤでは なく、てつの キャタピラで すすみます。'
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
    photo: 'assets/grader.png',
    shigoto: 'グレーダーは、どうろの <ruby>地<rt>じ</rt></ruby>めんを けずって、たいらに ならす しごとを して います。',
    tsukuri: [
      {
        part: 'blade', label: 'けずる は',
        text: 'その ために、<ruby>前<rt>まえ</rt></ruby>と うしろの タイヤの あいだに、ななめに かたむけられる ながい はが ついて います。'
      },
      {
        part: 'body', label: 'ながい からだ',
        text: 'すこしの でこぼこも けずり のこさない ように、からだを とても ながく して、はが <ruby>上<rt>うえ</rt></ruby>や <ruby>下<rt>した</rt></ruby>に ゆれにくく なって います。'
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
    photo: 'assets/ambulance.png',
    shigoto: 'きゅうきゅう<ruby>車<rt>しゃ</rt></ruby>は、けがや びょうきの <ruby>人<rt>ひと</rt></ruby>を、びょういんまで はやく はこぶ しごとを して います。',
    tsukuri: [
      {
        part: 'bed', label: 'ベッド',
        text: 'その ために、<ruby>車<rt>くるま</rt></ruby>の <ruby>中<rt>なか</rt></ruby>の ベッドは、うしろの とびらから <ruby>台<rt>だい</rt></ruby>ごと <ruby>出<rt>だ</rt></ruby>し<ruby>入<rt>い</rt></ruby>れ できる ように なって います。'
      },
      {
        part: 'lamp', label: 'ランプ',
        text: 'まわりの <ruby>車<rt>くるま</rt></ruby>に はやく <ruby>気<rt>き</rt></ruby>づいて もらえる ように、<ruby>上<rt>うえ</rt></ruby>の あかい ランプが <ruby>光<rt>ひか</rt></ruby>り、サイレンの <ruby>音<rt>おと</rt></ruby>が <ruby>前<rt>まえ</rt></ruby>へ とどきます。'
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
    photo: 'assets/pump.png',
    shigoto: 'しょうぼう<ruby>車<rt>しゃ</rt></ruby>は、<ruby>火事<rt>かじ</rt></ruby>を けす ために、<ruby>水<rt>みず</rt></ruby>を かける しごとを して います。',
    tsukuri: [
      {
        part: 'pump', label: 'ポンプ',
        text: 'その ために、<ruby>川<rt>かわ</rt></ruby>や しょうかせんの <ruby>水<rt>みず</rt></ruby>を すい<ruby>上<rt>あ</rt></ruby>げて、ビルの <ruby>上<rt>うえ</rt></ruby>まで とどく いきおいで おくり<ruby>出<rt>だ</rt></ruby>す ポンプが ついて います。'
      },
      {
        part: 'hose', label: 'ホース',
        text: '<ruby>火<rt>ひ</rt></ruby>が どこで もえて いても とどく ように、ながい ホースが なん<ruby>本<rt>ぼん</rt></ruby>も、すぐ のばせる ように まいて あります。'
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
    photo: 'assets/ladder.png',
    shigoto: 'はしご<ruby>車<rt>しゃ</rt></ruby>は、<ruby>高<rt>たか</rt></ruby>い ビルに いる <ruby>人<rt>ひと</rt></ruby>を、たすけ<ruby>出<rt>だ</rt></ruby>す しごとを して います。',
    tsukuri: [
      {
        part: 'ladder', label: 'はしご',
        text: 'その ために、<ruby>何<rt>なん</rt></ruby>だんにも かさなった はしごが、ビルの <ruby>十<rt>じゅっ</rt></ruby>かいくらいの <ruby>高<rt>たか</rt></ruby>さまで のびて いきます。'
      },
      {
        part: 'ashi', label: 'あし',
        text: 'はしごを のばしても たおれない ように、はしごを <ruby>出<rt>だ</rt></ruby>す <ruby>前<rt>まえ</rt></ruby>に、<ruby>四本<rt>よんほん</rt></ruby>の あしで <ruby>車<rt>くるま</rt></ruby>を もち<ruby>上<rt>あ</rt></ruby>げ、タイヤを <ruby>地<rt>じ</rt></ruby>めんから はなします。'
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
    photo: 'assets/police.png',
    shigoto: 'パトカーは、まちを まわって、みんなの あんぜんを まもる しごとを して います。',
    tsukuri: [
      {
        part: 'lamp', label: 'ランプ',
        text: 'その ために、やねの <ruby>上<rt>うえ</rt></ruby>の あかい ランプは、ふだんは けして おき、いそぐ ときだけ くるくる <ruby>光<rt>ひか</rt></ruby>ります。'
      },
      {
        part: 'antenna', label: 'アンテナ',
        text: 'はなれて いる なかまと いつでも <ruby>話<rt>はな</rt></ruby>せる ように、とおくまで とどく むせんの アンテナが <ruby>立<rt>た</rt></ruby>って います。'
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
    photo: 'assets/wrecker.png',
    shigoto: 'レッカー<ruby>車<rt>しゃ</rt></ruby>は、うごかなく なった <ruby>車<rt>くるま</rt></ruby>を、なおす ところまで はこぶ しごとを して います。',
    tsukuri: [
      {
        part: 'arm', label: 'うで',
        text: 'その ために、うしろの うでが のびて、うごかなく なった <ruby>車<rt>くるま</rt></ruby>の <ruby>前<rt>まえ</rt></ruby>の タイヤだけを もち<ruby>上<rt>あ</rt></ruby>げます。'
      },
      {
        part: 'hook', label: 'フック',
        text: 'みぞに おちた <ruby>車<rt>くるま</rt></ruby>も ひきあげられる ように、じょうぶな つなと フックが あり、まきとる きかいで ひっぱります。'
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
        text: 'その ために、<ruby>前<rt>まえ</rt></ruby>の はねが ななめに ついて いて、すすむだけで <ruby>雪<rt>ゆき</rt></ruby>が みちの わきへ よけられて いきます。'
      },
      {
        part: 'hopper', label: 'まく ところ',
        text: 'こおった みちで <ruby>車<rt>くるま</rt></ruby>が すべらない ように、うしろから すなや つぶを まきながら すすみます。'
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
        text: 'その ために、<ruby>車<rt>くるま</rt></ruby>の <ruby>中<rt>なか</rt></ruby>に、うでを のばして よこに なれる ベッドが、いくつも ならべて あります。'
      },
      {
        part: 'door', label: 'とびら',
        text: 'まちの ひろばに とめて すぐ うけつけ できる ように、よこの とびらから、かいだんを のぼって <ruby>入<rt>はい</rt></ruby>れます。'
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
        text: 'その ために、よこの とびらを ひらくと、どうぐが <ruby>一<rt>ひと</rt></ruby>つずつ きまった ところに ならんで いて、まよわず とり<ruby>出<rt>だ</rt></ruby>せます。'
      },
      {
        part: 'winch', label: 'つなを まく きかい',
        text: '<ruby>川<rt>かわ</rt></ruby>や みぞに おちた <ruby>車<rt>くるま</rt></ruby>を ひきあげられる ように、<ruby>前<rt>まえ</rt></ruby>に、つなを ぐるぐる まきとる きかいが ついて います。'
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
        text: 'その ために、<ruby>水<rt>みず</rt></ruby>では なく、あわの もとに なる くすりを ためた タンクを つんで います。'
      },
      {
        part: 'turret', label: 'ノズル',
        text: 'あぶなくて ちかづけない <ruby>火<rt>ひ</rt></ruby>にも とどく ように、やねの <ruby>上<rt>うえ</rt></ruby>の ふとい ノズルが、はなれた ところから あわを とばします。'
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
        text: 'その ために、びょういんと おなじ どうぐを つめた かばんが つんで あり、ついた その ばで <ruby>手当<rt>てあ</rt></ruby>てを はじめられます。'
      },
      {
        part: 'lamp', label: 'ランプ',
        text: '<ruby>一<rt>いっ</rt></ruby>ぷんでも はやく つける ように、<ruby>上<rt>うえ</rt></ruby>の ランプと サイレンで、ほかの <ruby>車<rt>くるま</rt></ruby>に みちを あけて もらいます。'
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
        text: 'その ために、<ruby>車<rt>くるま</rt></ruby>の <ruby>中<rt>なか</rt></ruby>が、からだの <ruby>中<rt>なか</rt></ruby>の しゃしんを とる きかいの、ちいさな へやに なって います。'
      },
      {
        part: 'door', label: 'とびら',
        text: 'じゅんばんに <ruby>入<rt>はい</rt></ruby>って いける ように、よこの とびらに かいだんが つき、<ruby>中<rt>なか</rt></ruby>は <ruby>一人<rt>ひとり</rt></ruby>ずつの へやに <ruby>分<rt>わ</rt></ruby>かれて います。'
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
    photo: 'assets/garbage.png',
    shigoto: 'ごみしゅうしゅう<ruby>車<rt>しゃ</rt></ruby>は、まちの ごみを あつめて、もやす ところまで はこぶ しごとを して います。',
    tsukuri: [
      {
        part: 'hopper', label: 'ごみを <ruby>入<rt>い</rt></ruby>れる ところ',
        text: 'その ために、うしろの <ruby>口<rt>くち</rt></ruby>に <ruby>入<rt>い</rt></ruby>れた ごみを、くるりと まわる ばんが おくへ おしこんで いきます。'
      },
      {
        part: 'nidai', label: 'ためる ところ',
        text: 'たくさん つめる ように、おしこんだ ごみを ぎゅうっと おしかためて、<ruby>小<rt>ちい</rt></ruby>さく して ためて いきます。'
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
    photo: 'assets/sweeper.png',
    shigoto: 'そうじ<ruby>車<rt>しゃ</rt></ruby>は、どうろの すなや ごみを あつめて、まちを きれいに する しごとを して います。',
    tsukuri: [
      {
        part: 'brush', label: 'ブラシ',
        text: 'その ために、<ruby>車<rt>くるま</rt></ruby>の <ruby>下<rt>した</rt></ruby>で <ruby>大<rt>おお</rt></ruby>きな ブラシが まわり、みちの はしの すなを まん<ruby>中<rt>なか</rt></ruby>へ はきよせます。'
      },
      {
        part: 'tank', label: 'タンク',
        text: 'はきよせた すなを すいこんで ためられる ように、<ruby>上<rt>うえ</rt></ruby>が そうじきの ような <ruby>大<rt>おお</rt></ruby>きな タンクに なって います。'
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
    photo: 'assets/water.png',
    shigoto: 'きゅうすい<ruby>車<rt>しゃ</rt></ruby>は、<ruby>水<rt>みず</rt></ruby>が <ruby>出<rt>で</rt></ruby>なく なった まちへ、のみ<ruby>水<rt>みず</rt></ruby>を はこぶ しごとを して います。',
    tsukuri: [
      {
        part: 'tank', label: 'タンク',
        text: 'その ために、うしろが、のみ<ruby>水<rt>みず</rt></ruby>を きれいな まま はこべる、<ruby>中<rt>なか</rt></ruby>を あらえる タンクに なって います。'
      },
      {
        part: 'tap', label: 'じゃぐち',
        text: 'おおぜいが いちどに <ruby>水<rt>みず</rt></ruby>を もらえる ように、よこに じゃぐちが いくつも ならんで ついて います。'
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
    photo: 'assets/kitchen.png',
    shigoto: 'キッチンカーは、まちへ <ruby>出<rt>で</rt></ruby>かけて いって、りょうりを つくって うる しごとを して います。',
    tsukuri: [
      {
        part: 'kitchen', label: 'ちょうりだい',
        text: 'その ために、<ruby>車<rt>くるま</rt></ruby>の <ruby>中<rt>なか</rt></ruby>に、<ruby>水<rt>みず</rt></ruby>の タンクと <ruby>火<rt>ひ</rt></ruby>が つかえる ちょうりだいが あり、その ばで りょうりが できます。'
      },
      {
        part: 'counter', label: 'カウンター',
        text: '<ruby>立<rt>た</rt></ruby>って いる おきゃくさんに <ruby>手<rt>て</rt></ruby>わたし できる ように、よこの かべが <ruby>上<rt>うえ</rt></ruby>へ ひらいて、ちょうど よい <ruby>高<rt>たか</rt></ruby>さの まどに なります。'
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
        text: 'その ために、<ruby>車<rt>くるま</rt></ruby>の よこの かべが ひらき、そとから えらべる <ruby>本<rt>ほん</rt></ruby>だなに なります。'
      },
      {
        part: 'step', label: 'かいだん',
        text: '<ruby>小<rt>ちい</rt></ruby>さな <ruby>子<rt>こ</rt></ruby>でも じぶんで えらべる ように、<ruby>入口<rt>いりぐち</rt></ruby>に ひくい かいだんが つき、<ruby>下<rt>した</rt></ruby>の たなには えほんが ならべて あります。'
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
        text: 'その ために、ざせきは うしろへ たおせて、テーブルや <ruby>足<rt>あし</rt></ruby>を のせる <ruby>台<rt>だい</rt></ruby>も ついて います。'
      },
      {
        part: 'trunk', label: 'にもつ<ruby>入<rt>い</rt></ruby>れ',
        text: 'みんなの <ruby>大<rt>おお</rt></ruby>きな かばんも つめる ように、ゆかの <ruby>下<rt>した</rt></ruby>が まるごと にもつ<ruby>入<rt>い</rt></ruby>れに なって います。'
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
        text: 'その ために、うしろに、どうろを ほって <ruby>土<rt>つち</rt></ruby>の <ruby>中<rt>なか</rt></ruby>の くだを <ruby>出<rt>だ</rt></ruby>せる、ちいさな うでが ついて います。'
      },
      {
        part: 'box', label: 'どうぐばこ',
        text: 'その ばで すぐ なおせる ように、よこの はこに、くだや どうぐが しゅるいごとに <ruby>分<rt>わ</rt></ruby>けて <ruby>入<rt>い</rt></ruby>れて あります。'
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
        text: 'その ために、よこの かべが やねの ように <ruby>上<rt>うえ</rt></ruby>へ ひらき、その まま しなものが ならぶ たなに なります。'
      },
      {
        part: 'cooler', label: 'ひやす ところ',
        text: 'おにくや ぎゅうにゅうが いたまない ように、たなの いちぶが ひえた ケースに なって います。'
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
        text: 'その ために、うしろが たいらで ひくい にだいに なって いて、はたけの わきでも <ruby>手<rt>て</rt></ruby>で かるがると のせおろし できます。'
      },
      {
        part: 'body', label: 'ちいさい からだ',
        text: 'はたけの あいだの せまい みちでも とおれる ように、からだが ふつうの <ruby>車<rt>くるま</rt></ruby>より <ruby>小<rt>ちい</rt></ruby>さく、はばも せまく つくって あります。'
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
        text: 'その ために、<ruby>目<rt>め</rt></ruby>に <ruby>見<rt>み</rt></ruby>えない ガスが もれて いないかを、<ruby>音<rt>おと</rt></ruby>で しらせる きかいを つんで います。'
      },
      {
        part: 'lamp', label: 'ランプ',
        text: 'こうじを して いる ことが とおくからでも わかる ように、<ruby>上<rt>うえ</rt></ruby>で きいろい ランプが ゆっくり <ruby>光<rt>ひか</rt></ruby>ります。'
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
    photo: 'assets/tractor.png',
    shigoto: 'トラクターは、はたけの かたい <ruby>土<rt>つち</rt></ruby>を たがやす しごとを して います。',
    tsukuri: [
      {
        part: 'rotary', label: 'たがやす きかい',
        text: 'その ために、うしろに つけた きかいの はが ぐるぐる まわって、かたい <ruby>土<rt>つち</rt></ruby>を ほりおこし、やわらかく して いきます。'
      },
      {
        part: 'bigtire', label: 'うしろの タイヤ',
        text: 'やわらかい <ruby>土<rt>つち</rt></ruby>に しずまない ように、うしろの タイヤは <ruby>人<rt>ひと</rt></ruby>の せの <ruby>高<rt>たか</rt></ruby>さほども あり、ふかい みぞで <ruby>土<rt>つち</rt></ruby>を つかみます。'
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
    photo: 'assets/combine.png',
    shigoto: 'コンバインは、みのった いねを かりとって、おこめの つぶだけを あつめる しごとを して います。',
    tsukuri: [
      {
        part: 'reel', label: 'かりとる ところ',
        text: 'その ために、<ruby>前<rt>まえ</rt></ruby>の <ruby>水車<rt>すいしゃ</rt></ruby>の ような ぶぶんが まわって いねを かきこみ、すぐ <ruby>下<rt>した</rt></ruby>の はが かりとります。'
      },
      {
        part: 'tank', label: 'ためる ところ',
        text: 'かりとりながら つぶだけを ためられる ように、<ruby>上<rt>うえ</rt></ruby>の はこに おこめが たまり、いっぱいに なると くだから <ruby>出<rt>だ</rt></ruby>せます。'
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
    photo: 'assets/rice.png',
    shigoto: 'たうえきは、<ruby>水<rt>みず</rt></ruby>を ためた たんぼに、いねの なえを うえて いく しごとを して います。',
    tsukuri: [
      {
        part: 'planter', label: 'うえる つめ',
        text: 'その ために、うしろの つめが、なえを <ruby>一本<rt>いっぽん</rt></ruby>ずつ つまんでは たんぼに さす うごきを、なんども くりかえします。'
      },
      {
        part: 'tray', label: 'なえの たな',
        text: 'なんども なえを とりに もどらなくて よい ように、<ruby>上<rt>うえ</rt></ruby>の ななめの たなに、なえが たくさん のせて あります。'
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
        text: 'その ために、よこへ のびる うでの さきの はが ぐるぐる まわり、<ruby>土手<rt>どて</rt></ruby>の ななめの くさも かる ことが できます。'
      },
      {
        part: 'guard', label: 'カバー',
        text: 'かった くさや <ruby>小石<rt>こいし</rt></ruby>が とんで こない ように、はの まわりが カバーで すっぽり かこって あります。'
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
        text: 'その ために、<ruby>車<rt>くるま</rt></ruby>に ついた クレーンの さきの <ruby>手<rt>て</rt></ruby>が、まるたを がしっと つかんで、じぶんで にだいに つみます。'
      },
      {
        part: 'stake', label: 'とめる ぼう',
        text: 'まるたが よこへ ころがり おちない ように、にだいの りょうがわに ふとい ぼうが <ruby>立<rt>た</rt></ruby>てて あります。'
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
        text: 'その ために、うしろの うでが <ruby>左右<rt>さゆう</rt></ruby>へ <ruby>大<rt>おお</rt></ruby>きく ひろがり、いちど とおるだけで ひろい はたけに まけます。'
      },
      {
        part: 'tank', label: 'タンク',
        text: 'とちゅうで <ruby>入<rt>い</rt></ruby>れに もどらなくて よい ように、まん<ruby>中<rt>なか</rt></ruby>に くすりを ためる <ruby>大<rt>おお</rt></ruby>きな タンクが あります。'
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
        text: 'その ために、ひこうきの おなかの <ruby>下<rt>した</rt></ruby>に もぐりこめるほど、からだが ひくく たいらに つくって あります。'
      },
      {
        part: 'hitch', label: 'つなぐ ところ',
        text: '<ruby>何十<rt>なんじゅう</rt></ruby>トンも ある ひこうきを うごかせる ように、<ruby>前<rt>まえ</rt></ruby>に ふとい かなぐが つき、<ruby>車<rt>くるま</rt></ruby>じたいも おもく つくって あります。'
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
        text: 'その ために、ドラムかん <ruby>何百本<rt>なんびゃっぽん</rt></ruby>ぶんもの あぶらを ためられる、ながい タンクが ついて います。'
      },
      {
        part: 'lift', label: 'あがる <ruby>台<rt>だい</rt></ruby>',
        text: 'つばさの <ruby>高<rt>たか</rt></ruby>さまで とどく ように、<ruby>人<rt>ひと</rt></ruby>の のる <ruby>台<rt>だい</rt></ruby>が <ruby>上<rt>うえ</rt></ruby>へ あがって いきます。'
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
        text: 'その ために、にもつを のせる ゆかが、ひこうきの <ruby>入口<rt>いりぐち</rt></ruby>と おなじ <ruby>高<rt>たか</rt></ruby>さまで もち<ruby>上<rt>あ</rt></ruby>がります。'
      },
      {
        part: 'roller', label: 'ころ',
        text: 'おもい にもつを <ruby>一人<rt>ひとり</rt></ruby>でも うごかせる ように、ゆかに まるい ころが ならんで いて、すべらせて おせます。'
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
        text: 'その ために、うしろが、ひこうきの <ruby>入口<rt>いりぐち</rt></ruby>まで つづく ながい かいだんに なって います。'
      },
      {
        part: 'lift', label: 'のびる ところ',
        text: '<ruby>大<rt>おお</rt></ruby>きな ひこうきにも <ruby>小<rt>ちい</rt></ruby>さな ひこうきにも あう ように、かいだん ぜんたいが <ruby>上<rt>うえ</rt></ruby>や <ruby>下<rt>した</rt></ruby>へ うごきます。'
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
        text: 'その ために、ななめに のびる じょうぶな うでが、コンテナを <ruby>四<rt>よっ</rt></ruby>つぶんの <ruby>高<rt>たか</rt></ruby>さまで もち<ruby>上<rt>あ</rt></ruby>げます。'
      },
      {
        part: 'spreader', label: 'つかむ ところ',
        text: 'コンテナを おとさない ように、うでの さきの わくが <ruby>四<rt>よ</rt></ruby>すみの あなに はまって、かちっと とまります。'
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
        text: 'その ために、タイヤの ほかに てつの わも ついて いて、せんろの <ruby>上<rt>うえ</rt></ruby>では それを おろして はしります。'
      },
      {
        part: 'arm', label: 'クレーン',
        text: '<ruby>一本<rt>いっぽん</rt></ruby>で <ruby>何百<rt>なんびゃく</rt></ruby>キロも ある レールを とりかえられる ように、ちいさな クレーンが ついて います。'
      }
    ],
    hakken: 'ひるまは タイヤで どうろを はしり、よるは せんろの <ruby>上<rt>うえ</rt></ruby>に のって しごとを します。'
  }
];
