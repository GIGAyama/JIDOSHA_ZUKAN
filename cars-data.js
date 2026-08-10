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
  { id: 'kurashi', name: 'くらしを ささえる', icon: '🏡' }
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
        text: 'おもい にもつを のせても つぶれない ように、じょうぶで <ruby>大<rt>おお</rt></ruby>きな タイヤが、かたがわに <ruby>四本<rt>よんほん</rt></ruby>ずつ ついて います。'
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
    id: 'tractor',
    name: 'トラクター',
    kana: 'トラクター',
    category: 'kurashi',
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
  }
];
