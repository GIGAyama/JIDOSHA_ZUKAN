/* =========================================================================
   app.js — じどう車ずかん の がめんの きりかえ

   ■ ページ（ハッシュ）
     #/               ひょうし と もくじ（しごとの なかま ＝ しょう ごとに ならぶ）
     #/car/<id>       車の ページ（中身は hon.js）
     #/sakuin         さくいん（名まえの あいうえお じゅん）
     #/mikata         ずかんの 見かた
     #/kurabe         大きさくらべ
     #/kansatsu/<id>  くわしく 見る（3D・大きく。kansatsu.js / kansatsu3d.js）

     むかしの 行き先も そのまま つかえる（先生が くばった URL が 行き止まりに ならない）
     #/hon → #/ 、#/hon/<id> → #/car/<id>

   ■ この ずかんで しない こと（2026-11-08 に はずした）
     ・①とい → ②しごと → ③つくり の じゅんに こたえを ひらく ページ
     ・「〜しごとを して います。その ために、〜」の 型の 文を 出す こと
     ・文に ペンで 線を ひいて メモに あつめ、カードの 型に ならべる こと
     子どもが アプリを そうさして 書きうつす だけで ずかんの カードが できて しまった。
     いまは 本物の ずかんと おなじに、読んで、見つけて、じぶんで 書く。

   ■ ページばんごう
     carCategories の じゅん → その 中は cars-data.js の じゅん で 1〜60。
     もくじ・さくいん・車の ページで おなじ 数を 出す（「28ページ」で つたえあえる）。
   ========================================================================= */
(function () {
  'use strict';

  var cars = window.carsData || [];
  var cats = window.carCategories || [];
  var catMap = {};
  cats.forEach(function (c) { catMap[c.id] = c; });

  var $ = function (s, r) { return (r || document).querySelector(s); };
  var $$ = function (s, r) { return Array.prototype.slice.call((r || document).querySelectorAll(s)); };

  var viewMokuji = $('#view-mokuji');
  var viewPage = $('#view-page');
  var viewSakuin = $('#view-sakuin');
  var viewMikata = $('#view-mikata');
  var viewCompare = $('#view-compare');
  var viewKansatsu = $('#view-kansatsu');
  var elTopbar = $('#topbar');
  var btnShiori = $('#btn-shiori');

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

  /* くわしく 見る（kansatsu.js）からも つかう */
  window.jzStore = store;

  /* なくなった きのうの データを 片づける（たんまつに のこさない）
     jz.sheet.* … かきうつしシート
     jz.hon.*   … 本の 文に ひいた ペンの 線（2026-11-08 に ペンを はずした） */
  function dropOld() {
    try {
      var ls = window.localStorage, kill = [], i;
      for (i = 0; i < ls.length; i++) {
        var k = ls.key(i);
        if (k && (k.indexOf('jz.sheet.') === 0 || k.indexOf('jz.hon.') === 0)) { kill.push(k); }
      }
      kill.forEach(function (k) { ls.removeItem(k); });
    } catch (e) { /* ほぞんが つかえない たんまつでは なにも しない */ }
  }

  /* しおり（むかしの「★ えらんだ 車」と おなじ ばしょ jz.stars に ほぞん） */
  function shioriList() {
    var s = store.get('stars', []);
    return Array.isArray(s) ? s : [];
  }
  function isShiori(id) { return shioriList().indexOf(id) >= 0; }
  function toggleShiori(id) {
    var s = shioriList(), i = s.indexOf(id);
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

  /* ふりがなを のぞいた 文字（「きゅうきゅう車」。title や alt に つかう） */
  function bare(html) {
    return plain(String(html).replace(/<rt>[\s\S]*?<\/rt>/g, ''));
  }

  function esc(t) {
    return String(t == null ? '' : t).replace(/[&<>"]/g, function (c) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c];
    });
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

  /* ------------------------------------------------------------------
     ページばんごう
     ------------------------------------------------------------------ */
  var bookList = [];
  cats.forEach(function (c) {
    cars.forEach(function (car) { if (car.category === c.id) { bookList.push(car); } });
  });
  cars.forEach(function (car) { if (bookList.indexOf(car) < 0) { bookList.push(car); } });
  var pageNo = {};
  bookList.forEach(function (car, i) { pageNo[car.id] = i + 1; });

  var book = {
    list: bookList,
    pageOf: function (id) { return pageNo[id] || 0; },
    prev: function (id) { return bookList[(pageNo[id] || 0) - 2] || null; },
    next: function (id) { return pageNo[id] ? (bookList[pageNo[id]] || null) : null; },
    /* その しょうの さいしょと さいごの ページ */
    range: function (catId) {
      var first = 0, last = 0;
      bookList.forEach(function (car, i) {
        if (car.category !== catId) { return; }
        if (!first) { first = i + 1; }
        last = i + 1;
      });
      return { first: first, last: last };
    }
  };

  function rangeText(catId) {
    var r = book.range(catId);
    return r.first === r.last ? r.first + 'ページ' : r.first + '〜' + r.last + 'ページ';
  }

  /* カードの 絵（写真が あれば 写真） */
  function cardArt(car) {
    if (car.photo) {
      return '<img src="' + esc(car.photo) + '" alt="" loading="lazy" decoding="async">';
    }
    return window.carArt.svg(car.art, 'fit');
  }

  /* ------------------------------------------------------------------
     3Dモデル（car3d.js）— くわしく 見る で つかう
     ------------------------------------------------------------------ */
  /* 3Dは 1MBを こえるので、くわしく 見る を ひらく まで 読みこまない。
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
    u.rate = 0.8;    /* 1年生が ついて いける はやさ */
    u.pitch = 1.1;

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

  /* くわしく 見る（kansatsu.js）からも つかう */
  window.jzSpeech = { speak: speak, stop: stopSpeech, reading: readingOf };

  /* ------------------------------------------------------------------
     えの ぶぶんの 上に ふきだしを おく（hon.js が つかう）
     ------------------------------------------------------------------ */
  function placeCallout(els, callout, stage) {
    /* ぶぶんが はなれた いくつかの かたち（左右の あし・ならんだ タイヤ）で できて いる ときに
       ぜんぶの まん中に おくと、なにも ない ところを さして しまう。
       いちばん 大きな かたちの 上に おく（おなじ くらいなら さきに かいた ほう）。
       <g> で まとめて ある ときは、中の かたち 1つずつで くらべる（はしご車の あしは
       左右 2本で 1つの <g>）。getBoundingClientRect は 回した <g> の 中でも
       見た とおりの ばしょを かえす。 */
    var shapes = [];
    els.forEach(function (e) {
      if (String(e.tagName).toLowerCase() === 'g') {
        $$('rect, circle, ellipse, path, polygon, polyline, line, text', e).forEach(function (x) { shapes.push(x); });
      } else {
        shapes.push(e);
      }
    });
    var best = null, bestArea = -1;
    shapes.forEach(function (e) {
      var r = e.getBoundingClientRect();
      if (!r.width && !r.height) return;
      var area = r.width * r.height;
      if (area > bestArea * 1.05) { best = r; bestArea = area; }
    });
    if (!best) return;
    var host = stage.getBoundingClientRect();

    var x = best.left + best.width / 2 - host.left;
    var y = best.top - host.top;
    var half = callout.offsetWidth / 2 + 6;
    callout.style.left = Math.max(half, Math.min(host.width - half, x)) + 'px';
    callout.style.top = Math.max(callout.offsetHeight + 6, y - 6) + 'px';
  }

  /* ==================================================================
     もくじ
     ================================================================== */
  var filter = store.get('filter', 'all');
  if (filter === 'star') { filter = 'shiori'; }                 /* むかしの ★ */
  if (filter !== 'all' && filter !== 'shiori' && !catMap[filter]) { filter = 'all'; }

  var lastCarId = null;     /* さっき 見て いた 車（もくじに もどった ときに わくを つける） */
  var lastListY = 0;        /* もくじで どこまで スクロールして いたか */

  function tabHTML(id, icon, name, sub, attrs) {
    var on = filter === id;
    return '<button type="button" class="tab' + (on ? ' is-active' : '') + '" data-filter="' + id + '"' +
      (attrs || '') + ' aria-pressed="' + on + '">' +
      '<span class="tab__icon" aria-hidden="true">' + icon + '</span>' +
      '<span class="tab__text"><span class="tab__name">' + name + '</span>' +
      '<span class="tab__pages">' + sub + '</span></span></button>';
  }

  function renderTabs() {
    var n = shioriList().filter(function (id) { return !!carById(id); }).length;
    var html = tabHTML('all', '📚', 'ぜんぶ', '1〜' + bookList.length + 'ページ');
    cats.forEach(function (c) {
      html += tabHTML(c.id, c.icon, c.name, rangeText(c.id), ' data-cat="' + c.id + '"');
    });
    html += tabHTML('shiori', '🔖', 'しおり', n ? n + 'ページ' : 'まだ ない', '').replace('class="tab', 'class="tab tab--shiori');
    $('#tabs').innerHTML = html;
  }

  function cardHTML(car) {
    var no = book.pageOf(car.id);
    var on = isShiori(car.id);
    return '<a class="card' + (car.id === lastCarId ? ' is-last' : '') + '" href="#/car/' + car.id + '" ' +
      'data-cat="' + car.category + '" data-id="' + car.id + '" ' +
      'aria-label="' + esc(car.kana) + '、' + no + 'ページ' + (on ? '、しおり' : '') + '">' +
      '<span class="card__art">' + cardArt(car) + '</span>' +
      '<span class="card__body">' +
      '<span class="card__no" aria-hidden="true">' + no + '</span>' +
      '<span class="card__name">' + car.name + '</span>' +
      '</span>' +
      (on ? '<span class="card__shiori" aria-hidden="true">🔖</span>' : '') +
      '</a>';
  }

  function chapHTML(c) {
    var list = bookList.filter(function (x) { return x.category === c.id; });
    if (!list.length) { return ''; }
    return '<section class="chap" data-cat="' + c.id + '">' +
      '<h3 class="chap__head">' +
      '<span class="chap__icon" aria-hidden="true">' + c.icon + '</span>' +
      '<span class="chap__name">' + c.name + '</span>' +
      '<span class="chap__pages">' + rangeText(c.id) + '</span></h3>' +
      '<div class="chap__grid">' + list.map(cardHTML).join('') + '</div>' +
      '</section>';
  }

  function renderList() {
    var grid = $('#grid');
    var empty = false;
    if (filter === 'shiori') {
      var list = bookList.filter(function (c) { return isShiori(c.id); });
      grid.className = 'grid';
      grid.innerHTML = list.map(cardHTML).join('');
      empty = list.length === 0;
    } else {
      grid.className = 'grid grid--chaps';
      grid.innerHTML = cats.filter(function (c) { return filter === 'all' || c.id === filter; })
        .map(chapHTML).join('');
    }
    $('#empty').hidden = !empty;
  }

  $('#tabs').addEventListener('click', function (e) {
    var tab = e.target.closest('.tab[data-filter]');
    if (!tab) return;
    filter = tab.getAttribute('data-filter');
    store.set('filter', filter);
    renderTabs();
    renderList();
  });

  function showMokuji() {
    renderTabs();
    renderList();
    setView('mokuji');
    document.title = 'じどう車ずかん - はたらく じどう車 60だい';
  }

  /* ==================================================================
     車の ページ（中身は hon.js）
     ================================================================== */
  function syncShiori(car) {
    var on = isShiori(car.id);
    btnShiori.setAttribute('aria-pressed', String(on));
    $('.btn--shiori__text', btnShiori).textContent = on ? 'しおりを はさんだ' : 'しおりを はさむ';
  }

  function showPage(car) {
    lastCarId = car.id;
    setView('page');
    if (!window.jzHon.mount(car, viewPage)) { location.replace('#/'); return; }
    syncShiori(car);
    document.title = bare(car.name) + '（' + book.pageOf(car.id) + 'ページ） - じどう車ずかん';
  }

  btnShiori.addEventListener('click', function () {
    var car = carById(lastCarId);
    if (!car) return;
    toggleShiori(car.id);
    syncShiori(car);
  });

  /* ==================================================================
     さくいん（名まえの あいうえお じゅん）
     ================================================================== */
  var GYO = [
    ['あ', 'あいうえおぁぃぅぇぉ'], ['か', 'かきくけこ'], ['さ', 'さしすせそ'],
    ['た', 'たちつてとっ'], ['な', 'なにぬねの'], ['は', 'はひふへほ'], ['ま', 'まみむめも'],
    ['や', 'やゆよゃゅょ'], ['ら', 'らりるれろ'], ['わ', 'わをん']
  ];

  /* かたかなを ひらがなに（さくいんの ならびと ぎょう わけ だけに つかう） */
  function hira(s) {
    return String(s).replace(/[ァ-ヶ]/g, function (ch) {
      return String.fromCharCode(ch.charCodeAt(0) - 0x60);
    });
  }

  function gyoOf(kana) {
    var c = hira(kana);
    if (c.normalize) { c = c.normalize('NFD'); }      /* が → か ＋ ゛ */
    c = c.charAt(0);
    for (var i = 0; i < GYO.length; i++) { if (GYO[i][1].indexOf(c) >= 0) { return i; } }
    return -1;
  }

  function sakuinGroups() {
    var groups = GYO.map(function (g) { return { head: g[0], cars: [] }; });
    var other = { head: 'ほか', cars: [] };
    bookList.forEach(function (car) {
      var i = gyoOf(car.kana);
      (i >= 0 ? groups[i] : other).cars.push(car);
    });
    groups.push(other);
    groups.forEach(function (g) {
      g.cars.sort(function (a, b) { return hira(a.kana).localeCompare(hira(b.kana), 'ja'); });
    });
    return groups.filter(function (g) { return g.cars.length; });
  }

  function showSakuin() {
    var groups = sakuinGroups();
    viewSakuin.innerHTML = '<div class="sheet sakuin">' +
      '<h2 class="sheet__h">さくいん</h2>' +
      '<p class="sheet__lead"><ruby>車<rt>くるま</rt></ruby>の <ruby>名<rt>な</rt></ruby>まえを、あいうえおの じゅんに ならべました。' +
      '<ruby>名<rt>な</rt></ruby>まえの よこの かずが ページです。</p>' +
      '<div class="sakuin__jump" role="group" aria-label="ぎょうへ とぶ">' + groups.map(function (g, i) {
        return '<a href="#/sakuin" data-jump="sakuin-' + i + '">' + g.head + '</a>';
      }).join('') + '</div>' +
      groups.map(function (g, i) {
        return '<section class="sakuin__grp" id="sakuin-' + i + '" aria-label="' + g.head + 'の ぎょう">' +
          '<h3 class="sakuin__kana">' + g.head + '</h3>' +
          '<ul class="sakuin__list">' + g.cars.map(function (car) {
            return '<li><a class="sakuin__a" href="#/car/' + car.id + '" data-cat="' + car.category + '">' +
              '<span class="sakuin__name">' + car.name + '</span>' +
              '<span class="sakuin__dots" aria-hidden="true"></span>' +
              '<span class="sakuin__no">' + book.pageOf(car.id) + '<small>ページ</small></span></a></li>';
          }).join('') + '</ul></section>';
      }).join('') +
      '</div>';
    setView('sakuin');
    document.title = 'さくいん - じどう車ずかん';
  }

  viewSakuin.addEventListener('click', function (e) {
    var a = e.target.closest('[data-jump]');
    if (!a) return;
    e.preventDefault();
    var to = document.getElementById(a.getAttribute('data-jump'));
    if (to) { to.scrollIntoView({ block: 'start', behavior: 'smooth' }); }
  });

  /* ==================================================================
     ずかんの 見かた
     ================================================================== */
  function showMikata() {
    var car = carById('ambulance') || bookList[0];
    var d = (window.honData || {})[car.id] || { pages: [{ h: '' }] };
    var photo = car.photo ? ' style="background-image:url(' + esc(car.photo) + ')"' : '';
    var cat = catMap[car.category] || { icon: '', name: '' };

    var mock = '<div class="mock" data-cat="' + car.category + '" aria-hidden="true">' +
      '<div class="mock__band"><span><span class="num">1</span> ' + cat.icon + ' ' + cat.name + '</span><b>' + book.pageOf(car.id) + '</b></div>' +
      '<div class="mock__name"><span class="num">2</span> ' + car.name + '</div>' +
      '<div class="mock__body">' +
      '<div>' +
      '<div class="mock__photo"' + photo + '><span class="num num--on">3</span></div>' +
      '<div class="mock__zukai"><span class="num num--on">4</span>' + window.carArt.svg(car.art, 'fit') +
      '<div class="mock__chips"><i></i><i></i><i></i></div></div>' +
      '</div>' +
      '<div>' +
      '<div class="mock__h"><span class="num">5</span><span>' + d.pages[0].h + '</span></div>' +
      '<div class="mock__lines"><span class="num">6</span><span><i></i><i></i><i></i><i></i><i></i></span></div>' +
      '<div class="mock__kazu"><span class="num">7</span> 🔢 かずで <ruby>見<rt>み</rt></ruby>る</div>' +
      '</div>' +
      '</div>' +
      '<div class="mock__turn"><span><span class="num">8</span> ← まえの ページ</span><span>つぎの ページ →</span></div>' +
      '</div>';

    var items = [
      ['なかま と ページ', 'しごとの なかまの <ruby>名<rt>な</rt></ruby>まえと、ページの かずです。'],
      ['<ruby>名<rt>な</rt></ruby>まえ', '<ruby>車<rt>くるま</rt></ruby>の <ruby>名<rt>な</rt></ruby>まえと、どんな <ruby>車<rt>くるま</rt></ruby>かを みじかく あらわした ことばです。'],
      ['しゃしん', 'ほんものの <ruby>車<rt>くるま</rt></ruby>の しゃしんです。'],
      ['ぶぶんの <ruby>名<rt>な</rt></ruby>まえ', '<ruby>名<rt>な</rt></ruby>まえを おすと、えの その ぶぶんが <ruby>光<rt>ひか</rt></ruby>ります。'],
      ['<ruby>見出<rt>みだ</rt></ruby>し', 'その まとまりに なにが かいて あるかが わかります。しりたい ことは、<ruby>見出<rt>みだ</rt></ruby>しを <ruby>見<rt>み</rt></ruby>て さがしましょう。'],
      ['せつめいの <ruby>文<rt>ぶん</rt></ruby>', '<ruby>見出<rt>みだ</rt></ruby>しの ことを くわしく かいて あります。'],
      ['かずで <ruby>見<rt>み</rt></ruby>る', '<ruby>大<rt>おお</rt></ruby>きさや <ruby>長<rt>なが</rt></ruby>さ、のれる <ruby>人<rt>ひと</rt></ruby>の かず などです。'],
      ['ページを めくる', 'まえの ページと つぎの ページへ すすめます。']
    ];

    viewMikata.innerHTML = '<div class="sheet mikata">' +
      '<h2 class="sheet__h">ずかんの <ruby>見<rt>み</rt></ruby>かた</h2>' +
      '<p class="sheet__lead">この ずかんの 1ページには、こんな ことが のって います。</p>' +
      '<div class="mikata__grid">' + mock +
      '<ol class="mikata__list">' + items.map(function (it, i) {
        return '<li><span class="num">' + (i + 1) + '</span><span><b>' + it[0] + '</b>' + it[1] + '</span></li>';
      }).join('') + '</ol>' +
      '</div>' +
      '<section class="mikata__find">' +
      '<h3><ruby>車<rt>くるま</rt></ruby>の さがしかた</h3>' +
      '<div class="mikata__ways">' +
      '<a class="mikata__way" href="#/"><b>📚 もくじ</b>しごとの なかまで さがします。</a>' +
      '<a class="mikata__way" href="#/sakuin"><b>あ さくいん</b><ruby>名<rt>な</rt></ruby>まえの あいうえおで さがします。</a>' +
      '<div class="mikata__way"><b>🔖 しおり</b>ページの <ruby>上<rt>うえ</rt></ruby>の「しおりを はさむ」を おすと、もくじの「しおり」に あつまります。</div>' +
      '</div></section>' +
      '</div>';
    setView('mikata');
    document.title = 'ずかんの 見かた - じどう車ずかん';
  }

  /* ==================================================================
     大きさくらべ
     ================================================================== */
  function showCompare() {
    var sorted = bookList.slice().sort(function (a, b) {
      return window.carArt.size(b.art).w - window.carArt.size(a.art).w;
    });
    var rows = sorted.map(function (car) {
      return '<div class="crow" data-cat="' + car.category + '">' +
        '<div class="crow__label">' +
        '<a class="crow__name" href="#/car/' + car.id + '">' + car.name + '</a>' +
        '<span class="crow__len">ながさ やく ' + meters(car) + '・' + book.pageOf(car.id) + 'ページ</span>' +
        '</div>' +
        '<div class="crow__art">' + window.carArt.svg(car.art, 'scale') + '</div>' +
        '</div>';
    }).join('');

    viewCompare.innerHTML = '<div class="sheet compare">' +
      '<h2 class="sheet__h"><ruby>大<rt>おお</rt></ruby>きさくらべ</h2>' +
      '<p class="sheet__lead">ぜんぶ おなじ ものさしで ならべて います。' +
      'いちばん <ruby>左<rt>ひだり</rt></ruby>に いるのは、1<ruby>年生<rt>ねんせい</rt></ruby>（やく 1.2メートル）です。</p>' +
      rows + '</div>';
    setView('compare');
    document.title = '大きさくらべ - じどう車ずかん';
  }

  /* ==================================================================
     くわしく 見る（3D・大きく）
     ================================================================== */
  var kzCar = null;
  var no3d = false;         /* 3Dを 出そうと して できなかった（WebGLが ない たんまつ） */

  /* 3D ⇄ え の きりかえボタン（kansatsu.js / kansatsu3d.js の バーに ある #kz-mode） */
  function syncKzMode() {
    var b = $('#kz-mode', viewKansatsu);
    if (!b || !kzCar) return;
    var in3d = !!$('.kz--3d', viewKansatsu);
    /* 3Dが 出せない たんまつでは、おしても かわらない ボタンを 出さない */
    b.hidden = !in3d && (!has3d(kzCar) || no3d);
    b.innerHTML = in3d ? '🖼️ えで <ruby>見<rt>み</rt></ruby>る' : '🧊 3Dで <ruby>見<rt>み</rt></ruby>る';
    b.setAttribute('aria-pressed', String(in3d));
  }

  function showKansatsu(car) {
    load3d();                           /* ここで はじめて 3Dを 読みこむ */
    kzCar = car;
    setView('kansatsu');
    document.title = bare(car.name) + 'を くわしく 見る - じどう車ずかん';
    /* まえの かんさつを かならず 片づけてから 出す（3D↔イラストの 行き来の ため）*/
    if (window.kansatsu) { window.kansatsu.unmount(); }
    if (window.kansatsu3d) { window.kansatsu3d.unmount(); }
    /* 3Dモデルが あれば まわせる ほうを つかう。だめなら イラスト版に もどす */
    var try3d = has3d(car) && want3d() && !!window.kansatsu3d;
    if (!(try3d && window.kansatsu3d.mount(car, viewKansatsu))) {
      if (try3d) { no3d = true; }
      window.kansatsu.mount(car, viewKansatsu);
    }
    syncKzMode();
  }

  viewKansatsu.addEventListener('click', function (e) {
    if (!e.target.closest('#kz-mode') || !kzCar) return;
    var in3d = !!$('.kz--3d', viewKansatsu);
    setWant3d(!in3d);
    showKansatsu(kzCar);
  });

  /* ==================================================================
     がめんの きりかえ
     ================================================================== */
  var routed = false;

  function setView(name) {
    routed = true;
    stopSpeech();
    if (name !== 'kansatsu') {
      if (window.kansatsu) { window.kansatsu.unmount(); }
      if (window.kansatsu3d) { window.kansatsu3d.unmount(); }
      kzCar = null;
    }
    if (name !== 'page' && window.jzHon) { window.jzHon.unmount(); }
    viewMokuji.hidden = name !== 'mokuji';
    viewPage.hidden = name !== 'page';
    viewSakuin.hidden = name !== 'sakuin';
    viewMikata.hidden = name !== 'mikata';
    viewCompare.hidden = name !== 'compare';
    viewKansatsu.hidden = name !== 'kansatsu';
    elTopbar.hidden = name === 'mokuji' || name === 'kansatsu';
    btnShiori.hidden = name !== 'page';
    $('#topbar-where').innerHTML = name === 'mokuji' || name === 'kansatsu' ? ''
      : 'じどう<ruby>車<rt>しゃ</rt></ruby>ずかん';
    document.body.setAttribute('data-view', name);
    /* もくじに もどった ときは、さがして いた ところへ もどす
       （60だい あるので、まいかい 先頭に もどると さがしなおしに なる） */
    window.scrollTo(0, name === 'mokuji' ? lastListY : 0);
  }

  function route() {
    var h = location.hash || '#/';
    /* #main（「ほんぶんへ すすむ」）の ような ページの 中の しるしは、そのまま ブラウザに まかせる */
    if (h.length > 1 && h.charAt(1) !== '/') {
      if (!routed) { showMokuji(); }
      return;
    }
    /* もくじから はなれる まえに、いま 見て いた ところを おぼえて おく */
    if (!viewMokuji.hidden && routed) { lastListY = window.scrollY || window.pageYOffset || 0; }

    /* むかしの 行き先（本の もくじ・本の ページ）は、いまの ページへ */
    if (h === '#/hon' || h === '#/hon/') { location.replace('#/'); return; }
    if (h.indexOf('#/hon/') === 0) { location.replace('#/car/' + h.slice('#/hon/'.length)); return; }

    if (h.indexOf('#/car/') === 0) {
      var car = carById(h.slice('#/car/'.length));
      if (car && window.jzHon && window.jzHon.has(car.id)) { showPage(car); return; }
    }
    if (h.indexOf('#/kansatsu/') === 0) {
      var kcar = carById(h.slice('#/kansatsu/'.length));
      if (kcar && window.kansatsu && window.carArt.has(kcar.art)) { showKansatsu(kcar); return; }
    }
    if (h === '#/sakuin') { showSakuin(); return; }
    if (h === '#/mikata') { showMikata(); return; }
    if (h === '#/kurabe') { showCompare(); return; }
    if (h !== '#/') { location.replace('#/'); return; }   /* しらない 行き先は もくじへ */
    showMokuji();
  }

  window.addEventListener('hashchange', route);

  document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape') { stopSpeech(); }
  });

  /* car3d.js は あとから 読みこまれる。くわしく 見る を ひらいて いたら、まわせる ほうに 入れかえる
     （見た ✓は localStorage に 入って いるので 消えません）*/
  window.addEventListener('jz3d-ready', function () {
    if (viewKansatsu.hidden || !kzCar) { return; }
    if (has3d(kzCar) && want3d() && !$('.kz--3d', viewKansatsu)) { showKansatsu(kzCar); return; }
    syncKzMode();
  });

  /* hon.js（車の ページ）が つかう 道具 */
  window.jzApp = {
    store: store,
    plain: plain,
    bare: bare,
    speak: speak,
    stopSpeech: stopSpeech,
    placeCallout: placeCallout,
    catMap: catMap,
    book: book
  };

  dropOld();
  route();
})();
