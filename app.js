/* =========================================================================
   app.js — がめんの きりかえ・じゅんばんに ひらく しくみ・こえで きく

   ・ハッシュルーティング  #/ 一覧 / #/car/<id> 詳細 / #/kurabe 大きさくらべ
                           #/hon 本の もくじ / #/hon/<id> 本の ページ（hon.js）
   ・詳細は ①とい → ②しごと → ③つくり の じゅんにしか ひらかない
   ・「つくり」の 文を おすと、絵の その ぶぶんが 光って ふきだしが 出る
   ・読み上げは <ruby> の よみを つかうので、漢字を まちがえて 読まない
   ========================================================================= */
(function () {
  'use strict';

  var cars = window.carsData || [];
  var cats = window.carCategories || [];
  var catMap = {};
  cats.forEach(function (c) { catMap[c.id] = c; });

  var $ = function (s, r) { return (r || document).querySelector(s); };
  var $$ = function (s, r) { return Array.prototype.slice.call((r || document).querySelectorAll(s)); };

  var elHeader = $('#site-header');
  var elTopbar = $('#topbar');
  var viewList = $('#view-list');
  var viewDetail = $('#view-detail');
  var viewCompare = $('#view-compare');
  var viewKansatsu = $('#view-kansatsu');
  var viewHon = $('#view-hon');
  var elHonHeader = $('#hon-header');

  /* ------------------------------------------------------------------
     ほぞん（学校の たんまつで ブロックされて いても うごくように）
     ------------------------------------------------------------------ */
  var store = {
    get: function (k, def) {
      try {
        var v = window.localStorage.getItem('jz.' + k);
        return v === null ? def : JSON.parse(v);
      } catch (e) { return def; }
    },
    set: function (k, v) {
      try { window.localStorage.setItem('jz.' + k, JSON.stringify(v)); return true; }
      catch (e) { return false; }
    }
  };

  /* ものすごい かんさつ（kansatsu.js）からも つかう */
  window.jzStore = store;

  /* むかし あった「かきうつしシート」の のこりを 片づける。
     きのうが なくなったので、たんまつに データだけ のこって しまう */
  function dropOldSheets() {
    try {
      var ls = window.localStorage, kill = [], i;
      for (i = 0; i < ls.length; i++) {
        var k = ls.key(i);
        if (k && k.indexOf('jz.sheet.') === 0) { kill.push(k); }
      }
      kill.forEach(function (k) { ls.removeItem(k); });
    } catch (e) { /* ほぞんが つかえない たんまつでは なにも しない */ }
  }

  function stars() {
    var s = store.get('stars', []);
    return Array.isArray(s) ? s : [];
  }
  function isStar(id) { return stars().indexOf(id) >= 0; }
  function toggleStar(id) {
    var s = stars(), i = s.indexOf(id);
    if (i >= 0) { s.splice(i, 1); } else { s.push(id); }
    store.set('stars', s);
    return i < 0;
  }

  /* ------------------------------------------------------------------
     ちいさな 道具
     ------------------------------------------------------------------ */
  function plain(html) {
    var d = document.createElement('div');
    d.innerHTML = html;
    return d.textContent.replace(/\s+/g, ' ').trim();
  }

  /* <ruby>漢字<rt>よみ</rt></ruby> → よみ に して から 読み上げる */
  function readingOf(el) {
    var clone = el.cloneNode(true);
    $$('ruby', clone).forEach(function (ruby) {
      var rt = ruby.querySelector('rt');
      if (rt) { ruby.parentNode.replaceChild(document.createTextNode(rt.textContent.trim()), ruby); }
    });
    return clone.textContent.replace(/\s+/g, ' ').trim();
  }

  function carById(id) {
    for (var i = 0; i < cars.length; i++) { if (cars[i].id === id) return cars[i]; }
    return null;
  }

  function meters(car) {
    var s = window.carArt.size(car.art);
    if (!s) return '';
    var m = Math.round(s.w / window.carArt.METER * 10) / 10;
    return (m % 1 === 0 ? m : m.toFixed(1)) + 'メートル';
  }

  /* 絵（assets に 写真が あれば そちらを つかう）

     mode に 'both' を わたすと、写真の うしろに イラストも いっしょに 入れて おく。
     写真では ぶぶんを 光らせられないので、「つくり」の 文を おした ときだけ
     イラストに 入れかえて 光らせる（CSS の .art-stage.has-photo / .is-art で きりかえ）。 */
  function artHTML(car, mode) {
    if (car.photo) {
      var img = '<img class="art-photo" src="' + car.photo + '" alt="' + plain(car.name) +
        'の しゃしん" loading="lazy" decoding="async">';
      if (mode === 'both' && window.carArt.has(car.art)) {
        return img + window.carArt.svg(car.art, 'fit');
      }
      return img;
    }
    return window.carArt.svg(car.art, mode === 'both' ? 'fit' : (mode || 'fit'));
  }

  /* 写真の 車で、イラストに 入れかえられる か */
  function hasArtSwap(car) { return !!(car && car.photo && window.carArt.has(car.art)); }

  /* 写真の でどころ（photo-credits.js）。ライセンスの 条件なので、写真を 出す ところには かならず 出す。
     大人むけの 小さな 字。リンクは 新しい タブで ひらく */
  function esc(t) {
    return String(t == null ? '' : t).replace(/[&<>"]/g, function (c) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c];
    });
  }
  function photoCredit(car) {
    var c = car && car.photo && window.photoCredits && window.photoCredits[car.id];
    if (!c) return '';
    var lic = c.licenseUrl
      ? '<a href="' + esc(c.licenseUrl) + '" target="_blank" rel="noopener noreferrer">' + esc(c.license) + '</a>'
      : esc(c.license);
    return '<p class="photo-credit">📷 しゃしん：' +
      '<a href="' + esc(c.source) + '" target="_blank" rel="noopener noreferrer">' + esc(c.author || 'Wikimedia Commons') + '</a>' +
      '（' + lic + '／Wikimedia Commons）' +
      (c.changes ? '<span class="photo-credit__chg">' + esc(c.changes) + '</span>' : '') +
      '</p>';
  }

  /* ------------------------------------------------------------------
     3Dモデル（car3d.js）— ある 車だけ「3Dで 見る」が 出る
     ------------------------------------------------------------------ */
  var view3d = null;                                   /* いま 出て いる ビューア */

  /* 3Dは 1MBを こえるので、一覧では 読みこまない。
     詳細ページと かんさつを ひらく ときだけ よぶ。
     index.html の module は defer なので、この app.js より あとに 走る ことが ある。
     その ときは しるしだけ つけて おき、module 側で ひろって もらう。 */
  function load3d() {
    if (window.jzLoad3d) { window.jzLoad3d(); }
    else { window.jzNeeds3d = true; }
  }

  function has3d(car) {
    return !!(car && window.jz3d && window.jz3d.MODEL3D[car.art]);
  }
  function want3d() { return store.get('use3d', true) !== false; }
  function setWant3d(v) { store.set('use3d', !!v); }

  var seen3d = null;                                   /* 絵が がめんに 出て いるか 見はる */

  function drop3d() {
    if (seen3d) { try { seen3d.disconnect(); } catch (e) { } seen3d = null; }
    if (view3d) { try { view3d.dispose(); } catch (e) { } view3d = null; }
  }

  /* 絵の パネルが スクロールで がめんの 外へ 出たら、3Dの えがきを 休ませる。
     児童が ①②③の 文を 読んで いる あいだ ずっと 回しつづけると、
     タブレットの でんちが へって しまう。もどって きたら すぐ 動きだす。 */
  function watch3d(stage) {
    if (!view3d || !window.IntersectionObserver) { return; }
    seen3d = new window.IntersectionObserver(function (entries) {
      if (!view3d) { return; }
      var on = entries[entries.length - 1].isIntersecting;
      try { if (on) { view3d.resume(); } else { view3d.pause(); } } catch (e) { }
    }, { threshold: 0 });
    seen3d.observe(stage);
  }

  /* 詳細ページの 絵を 3Dに する（できなければ false）*/
  function mount3d(car) {
    var stage = $('#art-stage');
    if (!stage || !has3d(car)) return false;
    drop3d();
    var svg = stage.querySelector('svg'), img = stage.querySelector('img');
    try {
      view3d = window.jz3d.createViewer(stage, car.art, { autoRotate: true });
    } catch (e) {
      return false;                                    /* WebGLが ない → イラストの まま */
    }
    if (svg) svg.style.display = 'none';
    if (img) img.style.display = 'none';
    stage.classList.add('is-3d');
    build3dBar(car);
    watch3d(stage);
    return true;
  }

  function unmount3d() {
    drop3d();
    var stage = $('#art-stage');
    if (!stage) return;
    stage.classList.remove('is-3d');
    var svg = stage.querySelector('svg'), img = stage.querySelector('img');
    if (svg) svg.style.display = '';
    if (img) img.style.display = '';
    var bar = $('#art-anim');
    if (bar) bar.innerHTML = '';
  }

  /* ▶ うごかす ボタン（にだいが かたむく など）*/
  function build3dBar(car) {
    var bar = $('#art-anim');
    if (!bar || !view3d) return;
    bar.innerHTML = '';
    view3d.animations().forEach(function (a) {
      var b = document.createElement('button');
      b.type = 'button';
      b.className = 'btn btn--anim3d' + (a.value > 0.5 ? ' is-on' : '');
      b.setAttribute('data-anim', a.key);
      b.textContent = '▶ ' + a.label;
      bar.appendChild(b);
    });
  }

  function sync3dToggle(car) {
    var t = $('#btn-3d');
    if (!t) return;
    t.hidden = !has3d(car);
    var on = !!view3d;
    /* 3Dを 出して いる ときは「しゃしん」に もどす ボタンに なる。
       写真の ない 車では イラストに もどるので、そう 書く */
    t.innerHTML = on
      ? (car && car.photo
        ? '📷 しゃしんで <ruby>見<rt>み</rt></ruby>る'
        : '🖼️ イラストで <ruby>見<rt>み</rt></ruby>る')
      : '🧊 3Dで まわして <ruby>見<rt>み</rt></ruby>る';
    t.setAttribute('aria-pressed', String(on));
  }

  /* ------------------------------------------------------------------
     こえで きく
     ------------------------------------------------------------------ */
  var playing = null;

  function stopSpeech() {
    if (window.speechSynthesis) { window.speechSynthesis.cancel(); }
    if (playing) {
      playing.classList.remove('is-playing');
      playing.innerHTML = playing.getAttribute('data-label');
      playing = null;
    }
  }

  function speak(btn, target) {
    if (btn === playing) { stopSpeech(); return; }
    stopSpeech();
    if (!window.speechSynthesis || !target) { return; }

    var u = new window.SpeechSynthesisUtterance(readingOf(target));
    u.lang = 'ja-JP';
    u.rate = 0.75;   /* 1年生が ついて いける はやさ */
    u.pitch = 1.15;

    var done = function () {
      btn.classList.remove('is-playing');
      btn.innerHTML = btn.getAttribute('data-label');
      if (playing === btn) { playing = null; }
    };
    u.onstart = function () {
      btn.classList.add('is-playing');
      btn.innerHTML = '⏹️ とめる';
      playing = btn;
    };
    u.onend = done;
    u.onerror = done;

    window.speechSynthesis.speak(u);
  }

  /* ものすごい かんさつ（kansatsu.js）からも つかう */
  window.jzSpeech = { speak: speak, stop: stopSpeech, reading: readingOf };

  function audioBtn(label) {
    var html = '🔊 こえで きく';
    return '<button type="button" class="btn btn--audio js-audio" data-label="' + html + '" ' +
      'aria-label="' + label + 'を こえで きく">' + html + '</button>';
  }

  /* ==================================================================
     一覧
     ================================================================== */
  var filter = store.get('filter', 'all');

  /* 一覧は 2つの 入り口で つかう。
     'zukan' … #/   ①とい→②しごと→③つくり の ずかん（じどう車くらべの ふくしゅう）
     'hon'   … #/hon 本の もくじ（じどう車ずかんを つくろう の 材料あつめ）
     カードの 行き先と 見出しだけが ちがう。しごとの タブや ★は おなじ ものを つかう。 */
  var listMode = 'zukan';

  /* 「さっき 見て いた 車」— ずかんに もどった ときに しるしを つける */
  var lastCarId = null;

  function tabHTML(id, icon, name) {
    var on = filter === id;
    return '<button type="button" class="tab' + (on ? ' is-active' : '') +
      '" data-filter="' + id + '" aria-pressed="' + on + '">' +
      '<span class="tab__icon" aria-hidden="true">' + icon + '</span>' +
      '<span class="tab__name">' + name + '</span></button>';
  }

  function renderTabs() {
    var html = tabHTML('all', '🚙', 'ぜんぶ');
    cats.forEach(function (c) { html += tabHTML(c.id, c.icon, c.name); });
    html += tabHTML('star', '⭐', 'えらんだ <ruby>車<rt>くるま</rt></ruby>');
    $('#tabs').innerHTML = html;
  }

  /* 本の もくじで、線を ひいた かずを カードに 出す */
  function memoBadge(car) {
    if (listMode !== 'hon' || !window.jzHon) return '';
    var n = window.jzHon.count(car.id);
    if (!n.s && !n.t) return '';
    return '<span class="card__memo" aria-label="メモ しごと ' + n.s + 'こ、つくり ' + n.t + 'こ">📝 ' +
      '<span class="ink-s">' + n.s + '</span>・<span class="ink-t">' + n.t + '</span></span>';
  }

  function cardHTML(car) {
    var cat = catMap[car.category] || { icon: '', name: '' };
    var on = isStar(car.id);
    /* 本の ページが まだ ない 車は、①②③の ページへ（行き止まりに しない） */
    var href = (listMode === 'hon' && window.jzHon && window.jzHon.has(car.id)) ? '#/hon/' : '#/car/';
    return '<article class="card' + (car.id === lastCarId ? ' is-last' : '') + '">' +
      '<button type="button" class="card__star js-star" data-id="' + car.id + '" ' +
      'aria-pressed="' + on + '" aria-label="' + plain(car.name) + 'を えらんだ 車に する">' +
      (on ? '★' : '☆') + '</button>' +
      '<div class="card__art">' + artHTML(car, 'fit') + '</div>' +
      '<p class="card__cat">' + cat.icon + ' ' + cat.name + '</p>' +
      '<h3 class="card__name"><a class="card__link" href="' + href + car.id + '">' +
      car.name + '</a></h3>' +
      memoBadge(car) +
      '</article>';
  }

  function renderTools() {
    $('#list-tools').innerHTML = listMode === 'hon'
      ? '<a class="btn btn--tool" href="#/">📖 ①②③の ずかんを <ruby>見<rt>み</rt></ruby>る</a>' +
        '<a class="btn btn--tool" href="#/kurabe">📏 <ruby>大<rt>おお</rt></ruby>きさくらべを <ruby>見<rt>み</rt></ruby>る</a>'
      : '<a class="btn btn--tool btn--hon" href="#/hon">📚 <ruby>本<rt>ほん</rt></ruby>で しらべる</a>' +
        '<a class="btn btn--tool" href="#/kurabe">📏 <ruby>大<rt>おお</rt></ruby>きさくらべを <ruby>見<rt>み</rt></ruby>る</a>';
  }

  function renderList() {
    var list = filter === 'all' ? cars
      : filter === 'star' ? cars.filter(function (c) { return isStar(c.id); })
        : cars.filter(function (c) { return c.category === filter; });

    var grid = $('#grid');

    /* 「ぜんぶ」の ときは、しごとの かたまりに 分けて 見出しを つける
       （60だいが ずらっと ならぶと、いま どこを 見て いるか 分からなく なる） */
    if (filter === 'all') {
      grid.className = 'grid grid--blocks';
      grid.innerHTML = cats.map(function (c) {
        var g = cars.filter(function (x) { return x.category === c.id; });
        if (!g.length) return '';
        return '<section class="cat-block">' +
          '<h3 class="cat-block__head">' +
          '<span class="cat-block__icon" aria-hidden="true">' + c.icon + '</span>' +
          '<span class="cat-block__name">' + c.name + '</span>' +
          '<span class="cat-block__n">' + g.length + 'だい</span></h3>' +
          '<div class="cat-block__grid">' + g.map(cardHTML).join('') + '</div>' +
          '</section>';
      }).join('');
    } else {
      grid.className = 'grid';
      grid.innerHTML = list.map(cardHTML).join('');
    }

    $('#empty').hidden = !(filter === 'star' && list.length === 0);
    $('#list-count').innerHTML = list.length + 'だいの じどう<ruby>車<rt>しゃ</rt></ruby>が あります。';
  }

  $('#tabs').addEventListener('click', function (e) {
    var tab = e.target.closest('.tab[data-filter]');
    if (!tab) return;
    filter = tab.getAttribute('data-filter');
    store.set('filter', filter);
    renderTabs();
    renderList();
  });

  $('#grid').addEventListener('click', function (e) {
    var star = e.target.closest('.js-star');
    if (!star) return;
    e.preventDefault();
    var on = toggleStar(star.getAttribute('data-id'));
    star.setAttribute('aria-pressed', String(on));
    star.textContent = on ? '★' : '☆';
    if (filter === 'star' && !on) { renderList(); }
  });

  /* ==================================================================
     詳細（ずかんの ページ）
     ================================================================== */

  /* 「つくり」の カードに いつも 出して おく、おせる ことの めじるし */
  var TAPME = '👆 おすと <ruby>光<rt>ひか</rt></ruby>る';
  var TAPBACK = '✕ もどす';

  /* その 車の 本の ページへ（本が ある 車だけ） */
  function honLink(car) {
    if (!window.jzHon || !window.jzHon.has(car.id)) return '';
    return '<a class="btn btn--hon-go" href="#/hon/' + car.id + '">' +
      '📚 この <ruby>車<rt>くるま</rt></ruby>の <ruby>本<rt>ほん</rt></ruby>を よむ</a>';
  }

  function detailHTML(car) {
    var cat = catMap[car.category] || { icon: '', name: '' };
    var t = car.tsukuri;

    var makes = t.map(function (item, i) {
      return '<div class="step step--make js-make" data-part="' + item.part + '" data-i="' + i + '" ' +
        'role="button" tabindex="0" hidden>' +
        '<span class="step__tag">③ つくり' + (t.length > 1 ? ' その' + (i + 1) : '') + '</span>' +
        '<span class="step__tapme js-tapme" aria-hidden="true">' + TAPME + '</span>' +
        '<p class="step__text js-read">' + item.text + '</p>' +
        '<div class="step__foot">' +
        audioBtn('つくりの せつめい') +
        ' <button type="button" class="btn btn--audio js-pin">📍 ばしょを <ruby>見<rt>み</rt></ruby>る</button>' +
        '</div></div>';
    }).join('');

    return '<div class="detail">' +

      '<div class="detail__head">' +
      '<span class="cat-chip">' + cat.icon + ' ' + cat.name + '</span>' +
      '<h2 class="detail__name">' + car.name + '</h2>' +
      '<p class="detail__len">ながさ やく ' + meters(car) + '</p>' +
      '</div>' +

      '<div class="detail__body">' +

      '<div class="art-panel">' +
      '<div class="art-stage' + (hasArtSwap(car) ? ' has-photo' : '') + '" id="art-stage">' +
      artHTML(car, 'both') +
      '<div class="callout" id="callout" hidden></div>' +
      '</div>' +
      '<div class="art-tools">' +
      '<button type="button" class="btn btn--3d" id="btn-3d" aria-pressed="false" hidden>' +
      '🧊 3Dで まわして <ruby>見<rt>み</rt></ruby>る</button>' +
      '<a class="btn btn--zoom" href="#/kansatsu/' + car.id + '">' +
      '🔬 ものすごく <ruby>大<rt>おお</rt></ruby>きく <ruby>見<rt>み</rt></ruby>る</a>' +
      honLink(car) +
      '</div>' +
      '<div class="art-anim" id="art-anim"></div>' +
      /* 3つの 見せかたは、それぞれ やくわりが ちがう。
         しゃしん＝ほんものを 見る／3D＝まわして つくりを 見る／え＝ぶぶんを 光らせて 見る */
      '<p class="art-hint">' +
      (car.photo ? '<b>📷 しゃしん</b>は ほんものの すがた。' : '') +
      (has3d(car) ? '<b>🧊 3D</b>は <b>ゆびで まわして</b> つくりを たしかめられます。' : '') + '<br>' +
      '「つくり」の <b>ぶん</b>を おすと、その ぶぶんが <b>光ります</b>' +
      (hasArtSwap(car) ? '（しゃしんの ときは <b>えに かわって</b> 光ります）' : '') + '。<br>' +
      'もっと よく 見る ときは、<b>ものすごく <ruby>大<rt>おお</rt></ruby>きく</b> して みよう。</p>' +
      photoCredit(car) +
      '</div>' +

      '<div class="steps">' +
      '<ol class="progress" id="progress">' +
      '<li class="is-on">① とい</li><li>② しごと</li><li>③ つくり</li>' +
      '</ol>' +

      '<div class="step step--q">' +
      '<span class="step__tag">① とい</span>' +
      '<p class="step__text js-read">' + car.name +
      'は、どんな しごとを して いますか。<br>その ために、どんな つくりに なって いますか。</p>' +
      '<div class="step__foot">' + audioBtn('とい') + '</div>' +
      '</div>' +

      '<div class="step step--job" id="step-job" hidden>' +
      '<span class="step__tag">② しごと</span>' +
      '<p class="step__text js-read">' + car.shigoto + '</p>' +
      '<div class="step__foot">' + audioBtn('しごとの せつめい') + '</div>' +
      '</div>' +

      makes +

      '<button type="button" class="btn btn--next" id="btn-next">こたえを <ruby>見<rt>み</rt></ruby>る →</button>' +

      '<div class="done" id="done" hidden>' +
      '<p class="done__msg">🎉 ぜんぶ よめたね！</p>' +
      '<div class="done__acts">' +
      '<a class="btn btn--zoom" href="#/kansatsu/' + car.id + '">' +
      '🔬 ものすごく <ruby>大<rt>おお</rt></ruby>きく <ruby>見<rt>み</rt></ruby>る</a>' +
      honLink(car) +
      '</div></div>' +

      '</div>' +

      '</div>' +

      '<details class="more">' +
      '<summary>🔍 もっと しりたい <ruby>人<rt>ひと</rt></ruby>へ</summary>' +
      '<p class="js-read">' + car.hakken + '</p>' +
      '<div class="step__foot">' + audioBtn('もっと しりたい') + '</div>' +
      '</details>' +

      '</div>';
  }

  var state = { car: null, step: 0, pin: null };

  function updateSteps() {
    var t = state.car.tsukuri;
    $('#step-job').hidden = state.step < 1;
    $$('.js-make', viewDetail).forEach(function (el, i) {
      el.hidden = state.step < 2 + i;
    });

    /* is-on = もう ひらいた／is-now = いま ここ（1年生が 見うしなわない ように） */
    var now = state.step < 1 ? 0 : (state.step < 2 ? 1 : 2);
    $$('#progress li').forEach(function (li, i) {
      li.classList.toggle('is-on', state.step >= i);
      li.classList.toggle('is-now', i === now);
      if (i === now) { li.setAttribute('aria-current', 'step'); }
      else { li.removeAttribute('aria-current'); }
    });

    var next = $('#btn-next');
    var done = $('#done');
    var last = 1 + t.length;
    if (state.step === 0) {
      next.innerHTML = 'こたえを <ruby>見<rt>み</rt></ruby>る →';
    } else if (state.step === 1) {
      next.innerHTML = '<b>その ために</b>… →';
    } else if (state.step < last) {
      next.innerHTML = 'つぎの つくり →';
    } else {
      next.hidden = true;
      if (done) { done.hidden = false; }
    }
  }

  /* --- 絵の ぶぶんを 光らせる --- */
  function clearPin() {
    var stage = $('#art-stage');
    if (!stage) return;
    if (view3d) { view3d.clearHighlight(); }
    stage.classList.remove('is-art');          /* 写真に もどす */
    var svg = stage.querySelector('svg');
    if (svg) {
      svg.classList.remove('has-lit');
      $$('.is-lit', svg).forEach(function (e) { e.classList.remove('is-lit'); });
    }
    var c = $('#callout');
    if (c) { c.hidden = true; }
    $$('.js-make', viewDetail).forEach(function (el) {
      el.classList.remove('is-active');
      var b = $('.js-pin', el);
      if (b) b.innerHTML = '📍 ばしょを <ruby>見<rt>み</rt></ruby>る';
      var tap = $('.js-tapme', el);
      if (tap) tap.innerHTML = TAPME;
    });
    state.pin = null;
  }

  function showPin(makeEl) {
    var part = makeEl.getAttribute('data-part');
    var i = Number(makeEl.getAttribute('data-i'));
    if (state.pin === part) { clearPin(); return; }
    clearPin();

    var stage = $('#art-stage');
    var callout = $('#callout');

    /* --- 3Dの とき --- */
    if (view3d) {
      if (!view3d.highlight(part)) return;
      view3d.focusPart(part);
      view3d.setAutoRotate(false);
      makeEl.classList.add('is-active');
      var b3 = $('.js-pin', makeEl);
      if (b3) b3.innerHTML = '✕ もどす';
      var tap3 = $('.js-tapme', makeEl);
      if (tap3) tap3.innerHTML = TAPBACK;
      callout.innerHTML = state.car.tsukuri[i].label;
      callout.hidden = false;
      state.pin = part;
      place3dCallout();
      return;
    }

    /* --- イラストの とき ---
       写真の 車でも、うしろに イラストを 入れて あるので、
       ここで えに 入れかえて 光らせる（clearPin で 写真に もどる）*/
    var svg = stage.querySelector('svg');
    if (!svg) return;                       /* えが ない ときだけ なにも しない */
    var els = $$('[data-part="' + part + '"]', svg);
    if (!els.length) return;

    stage.classList.add('is-art');

    els.forEach(function (e) { e.classList.add('is-lit'); });
    svg.classList.add('has-lit');
    makeEl.classList.add('is-active');
    var b = $('.js-pin', makeEl);
    if (b) b.innerHTML = '✕ もどす';
    var tap = $('.js-tapme', makeEl);
    if (tap) tap.innerHTML = TAPBACK;

    callout.innerHTML = state.car.tsukuri[i].label;
    callout.hidden = false;
    state.pin = part;
    placeCallout(svg, els, callout, stage);
  }

  /* 3Dの ふきだしは 車を まわしても ついてくる */
  function place3dCallout() {
    if (!view3d || !state.pin) return;
    var stage = $('#art-stage');
    var callout = $('#callout');
    if (!stage || !callout || callout.hidden) return;
    var p = view3d.screenPos(state.pin);
    if (!p) return;
    var half = callout.offsetWidth / 2 + 6;
    callout.style.opacity = p.visible ? '1' : '0.25';
    callout.style.left = Math.max(half, Math.min(stage.clientWidth - half, p.x)) + 'px';
    callout.style.top = Math.max(callout.offsetHeight + 10, p.y - 14) + 'px';
  }

  function placeCallout(svg, els, callout, stage) {
    var minX = Infinity, maxX = -Infinity, minY = Infinity;
    els.forEach(function (e) {
      var b;
      try { b = e.getBBox(); } catch (err) { return; }
      if (!b || (!b.width && !b.height)) return;
      minX = Math.min(minX, b.x);
      maxX = Math.max(maxX, b.x + b.width);
      minY = Math.min(minY, b.y);
    });
    if (!isFinite(minX)) return;

    var ctm = svg.getScreenCTM();
    if (!ctm) return;
    var p = svg.createSVGPoint();
    p.x = (minX + maxX) / 2;
    p.y = minY;
    var s = p.matrixTransform(ctm);
    var host = stage.getBoundingClientRect();

    var x = s.x - host.left;
    var y = s.y - host.top;
    var half = callout.offsetWidth / 2 + 6;
    callout.style.left = Math.max(half, Math.min(host.width - half, x)) + 'px';
    callout.style.top = Math.max(callout.offsetHeight + 6, y - 6) + 'px';
  }

  function repositionCallout() {
    if (!state.pin) return;
    if (view3d) { place3dCallout(); return; }
    var stage = $('#art-stage');
    if (!stage) return;
    var svg = stage.querySelector('svg');
    if (!svg) return;
    placeCallout(svg, $$('[data-part="' + state.pin + '"]', svg), $('#callout'), stage);
  }
  window.addEventListener('resize', repositionCallout);

  function showDetail(car) {
    load3d();                           /* ここで はじめて 3Dを 読みこむ */
    state = { car: car, step: 0, pin: null };
    lastCarId = car.id;                 /* ずかんに もどった ときの しるし */
    unmount3d();
    viewDetail.innerHTML = detailHTML(car);
    if (has3d(car) && want3d()) { mount3d(car); }
    sync3dToggle(car);
    if (view3d) { view3d.onFrame(place3dCallout); }

    updateSteps();
    setView('detail');
    document.title = plain(car.name) + ' - じどう車ずかん';

    var star = $('#btn-star');
    var on = isStar(car.id);
    star.setAttribute('aria-pressed', String(on));
    $('.star', star).textContent = on ? '★' : '☆';
    $('.btn-star__text', star).textContent = on ? 'えらんで います' : 'えらんだ 車に する';
  }

  viewDetail.addEventListener('click', function (e) {
    var audio = e.target.closest('.js-audio');
    if (audio) {
      e.stopPropagation();
      var host = audio.closest('.step, .more');
      speak(audio, host ? $('.js-read', host) : null);
      return;
    }
    if (e.target.closest('#btn-next')) {
      state.step++;
      updateSteps();
      var justOpened = state.step === 1 ? $('#step-job') : $$('.js-make', viewDetail)[state.step - 2];
      if (justOpened) { justOpened.scrollIntoView({ block: 'nearest', behavior: 'smooth' }); }
      return;
    }
    if (e.target.closest('#btn-3d')) {
      clearPin();
      if (view3d) { unmount3d(); setWant3d(false); }
      else if (mount3d(state.car)) { setWant3d(true); view3d.onFrame(place3dCallout); }
      sync3dToggle(state.car);
      return;
    }
    var anim = e.target.closest('[data-anim]');
    if (anim && view3d) {
      anim.classList.toggle('is-on', view3d.toggleAnim(anim.getAttribute('data-anim')));
      view3d.setAutoRotate(false);
      return;
    }

    var make = e.target.closest('.js-make');
    if (make) { showPin(make); }
  });

  /* 「つくり」の カードは キーボードからも おせる（role="button" tabindex="0"） */
  viewDetail.addEventListener('keydown', function (e) {
    if (e.key !== 'Enter' && e.key !== ' ' && e.key !== 'Spacebar') { return; }
    if (!e.target.classList || !e.target.classList.contains('js-make')) { return; }
    e.preventDefault();                 /* スペースで がめんが 下がらない ように */
    showPin(e.target);
  });

  document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape') { clearPin(); stopSpeech(); }
  });

  /* 本の ページからは 本の もくじへ。それ いがいは、さいごに 見た 一覧へ */
  $('#btn-back').addEventListener('click', function () {
    location.hash = (!viewHon.hidden || listMode === 'hon') ? '#/hon' : '#/';
  });

  $('#btn-star').addEventListener('click', function () {
    var car = !viewHon.hidden ? carById(lastCarId) : state.car;
    if (!car) return;
    var on = toggleStar(car.id);
    this.setAttribute('aria-pressed', String(on));
    $('.star', this).textContent = on ? '★' : '☆';
    $('.btn-star__text', this).textContent = on ? 'えらんで います' : 'えらんだ 車に する';
  });

  /* ==================================================================
     大きさくらべ
     ================================================================== */
  function showCompare() {
    var sorted = cars.slice().sort(function (a, b) {
      return window.carArt.size(b.art).w - window.carArt.size(a.art).w;
    });
    var rows = sorted.map(function (car) {
      return '<div class="crow">' +
        '<div class="crow__label">' +
        '<a class="crow__name" href="#/car/' + car.id + '">' + car.name + '</a>' +
        '<div class="crow__len">ながさ やく ' + meters(car) + '</div>' +
        '</div>' +
        '<div class="crow__art">' + window.carArt.svg(car.art, 'scale') + '</div>' +
        '</div>';
    }).join('');

    viewCompare.innerHTML = '<div class="compare">' +
      '<div class="compare__lead">' +
      '<b>ぜんぶ おなじ 大きさの ものさし</b>で ならべて います。' +
      'いちばん <ruby>左<rt>ひだり</rt></ruby>に いるのは、みんなと おなじ <ruby>一年生<rt>いちねんせい</rt></ruby>です。' +
      'どの じどう<ruby>車<rt>しゃ</rt></ruby>が 大きいか、くらべて みよう。' +
      '</div>' + rows + '</div>';
    setView('compare');
    document.title = '大きさくらべ - じどう車ずかん';
  }

  /* ==================================================================
     がめんの きりかえ
     ================================================================== */
  /* 一覧で どこまで スクロールして いたか（ずかんと 本の もくじで べつべつ） */
  var lastListY = { zukan: 0, hon: 0 };

  function setView(name) {
    stopSpeech();
    if (name !== 'kansatsu') {
      if (window.kansatsu) { window.kansatsu.unmount(); }
      if (window.kansatsu3d) { window.kansatsu3d.unmount(); }
    }
    if (name !== 'detail') { unmount3d(); }
    if (name !== 'hon' && window.jzHon) { window.jzHon.unmount(); }
    viewList.hidden = name !== 'list';
    viewDetail.hidden = name !== 'detail';
    viewCompare.hidden = name !== 'compare';
    viewKansatsu.hidden = name !== 'kansatsu';
    viewHon.hidden = name !== 'hon';
    elHeader.hidden = !(name === 'list' && listMode === 'zukan');
    elHonHeader.hidden = !(name === 'list' && listMode === 'hon');
    $('#note-zukan').hidden = listMode !== 'zukan';
    $('#note-hon').hidden = listMode !== 'hon';
    elTopbar.hidden = !(name === 'detail' || name === 'compare' || name === 'hon');
    $('#btn-star').hidden = name === 'compare';
    $('#btn-back').innerHTML = '<span aria-hidden="true">←</span> ' +
      ((name === 'hon' || listMode === 'hon')
        ? '<ruby>本<rt>ほん</rt></ruby>の もくじに もどる'
        : 'ずかんに もどる');
    document.body.classList.toggle('is-hon', name === 'hon');
    /* 一覧に もどった ときは、さがして いた ところへ もどす
       （60だい あるので、まいかい 先頭に もどると さがしなおしに なる） */
    window.scrollTo(0, name === 'list' ? lastListY[listMode] : 0);
  }

  /* ==================================================================
     ものすごい かんさつ
     ================================================================== */
  function showKansatsu(car) {
    load3d();                           /* ここで はじめて 3Dを 読みこむ */
    setView('kansatsu');
    document.title = plain(car.name) + 'を ものすごく 大きく - じどう車ずかん';
    /* まえの かんさつを かならず 片づけてから 出す（3D↔イラストの 行き来の ため）*/
    if (window.kansatsu) { window.kansatsu.unmount(); }
    if (window.kansatsu3d) { window.kansatsu3d.unmount(); }
    /* 3Dモデルが あれば まわせる ほうを つかう。だめなら イラスト版に もどす */
    if (has3d(car) && want3d() && window.kansatsu3d &&
      window.kansatsu3d.mount(car, viewKansatsu)) { return; }
    window.kansatsu.mount(car, viewKansatsu);
  }

  /* ==================================================================
     じどう車の 本（中身は hon.js）
     ================================================================== */
  function showHon(car) {
    listMode = 'hon';                   /* もどる ボタンの 行き先を 本の もくじに */
    lastCarId = car.id;
    setView('hon');
    if (!window.jzHon.mount(car, viewHon)) { location.replace('#/car/' + car.id); return; }
    document.title = plain(car.name) + 'の 本 - じどう車ずかん';
    var star = $('#btn-star');
    var on = isStar(car.id);
    star.setAttribute('aria-pressed', String(on));
    $('.star', star).textContent = on ? '★' : '☆';
    $('.btn-star__text', star).textContent = on ? 'えらんで います' : 'えらんだ 車に する';
  }

  function route() {
    var h = location.hash || '#/';
    /* 一覧から はなれる まえに、いま 見て いた ところを おぼえて おく */
    if (!viewList.hidden) { lastListY[listMode] = window.scrollY || window.pageYOffset || 0; }
    clearPin();
    if (h.indexOf('#/hon/') === 0 && window.jzHon) {
      var hcar = carById(h.slice('#/hon/'.length));
      if (hcar && window.jzHon.has(hcar.id)) { showHon(hcar); return; }
    }
    if (h.indexOf('#/kansatsu/') === 0) {
      var kcar = carById(h.slice('#/kansatsu/'.length));
      if (kcar && window.kansatsu &&
        (window.carArt.has(kcar.art) || has3d(kcar))) { showKansatsu(kcar); return; }
    }
    if (h.indexOf('#/car/') === 0) {
      var car = carById(h.slice('#/car/'.length));
      if (car) { showDetail(car); return; }
    }
    if (h === '#/kurabe') { showCompare(); return; }
    listMode = (h === '#/hon' || h.indexOf('#/hon/') === 0) ? 'hon' : 'zukan';
    renderTabs();
    renderTools();
    renderList();
    setView('list');
    document.title = listMode === 'hon'
      ? 'じどう車の 本 - しごとと つくりを さがそう'
      : 'じどう車ずかん - しごとと つくりを しらべよう';
  }

  window.addEventListener('hashchange', route);

  /* car3d.js は あとから 読みこまれる。来た ときに 詳細ページを 出して いたら、
     詳細ページを 作りなおさずに（いまの じょうたいの まま）3Dを のせる */
  window.addEventListener('jz3d-ready', function () {
    /* かんさつを 見て いる とちゅうなら、まわせる ほうに 入れかえる
       （✓は localStorage に 入って いるので 消えません）*/
    if (!viewKansatsu.hidden) {
      var h3 = location.hash;
      if (h3.indexOf('#/kansatsu/') === 0) {
        var kc = carById(h3.slice('#/kansatsu/'.length));
        if (kc && has3d(kc) && want3d()) { showKansatsu(kc); }
      }
      return;
    }
    if (!state || !state.car || viewDetail.hidden) { return; }
    if (!view3d && has3d(state.car) && want3d() && mount3d(state.car)) {
      view3d.onFrame(place3dCallout);
    }
    sync3dToggle(state.car);
  });

  /* hon.js（じどう車の 本）が つかう 道具 */
  window.jzApp = {
    photoCredit: photoCredit,
    store: store,
    plain: plain,
    speak: speak,
    stopSpeech: stopSpeech,
    artHTML: artHTML,
    hasArtSwap: hasArtSwap,
    placeCallout: placeCallout,
    catMap: catMap
  };

  dropOldSheets();
  route();
})();
