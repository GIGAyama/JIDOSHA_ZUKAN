/* =========================================================================
   hon.js — 車の ページ（#/car/<id>）

   ■ なにを する ページか
     図書室の ずかんの かわりに 読む、1台ぶんの ページ。
     「じどう車くらべ」の さいごの 時間（はしご車）と「じどう車ずかんを つくろう」で、
     子どもは この ページを 読んで、えらんだ 車の しごとと つくりを じぶんで 見つけ、
     ワークシートや ノートに じぶんの ことばで 書く。

   ■ わざと しない こと
     ・「しごと」「つくり」の ラベルや 色わけ、「その ために」の 型は 出さない。
       本物の ずかんにも 書いて いない。見出しと 文から 子どもが 見つける。
     ・文に 線を ひく ペン・あつめる メモ・カードの 書きだしの 型は 出さない。
       アプリを そうさする だけで カードが しあがって しまうので、2026-11-08 に はずした。
       （その ときに たまって いた 線の データは app.js が 1かいだけ かたづける）
     ・hon-data.js の k（s / t / o）と part は、材料が そろって いるかの 検査
       （tools/check-hon.mjs）に だけ つかう。画面では つかわない。

   ■ 画面
     あたま … しょうの 色の おび（なかまの 名まえ・ページばんごう）、名まえ、ひとこと
     ひだり … 写真（出典は 小さく）／ぶぶんの 名まえ（えの ぶぶんを 光らせる）／くわしく 見る／
              かずで 見る（1年生と くらべた 大きさ つき）
     みぎ   … 見出しと 文（🔊 よむ）
     した   … ページを めくる／おとなの かたへ（しらべた 資料・写真の 出典。とじて おく）

   ■「ぶぶんの 名まえ」に ならべる もの
     その 車の え（car-art.js）に ある data-part を ぜんぶ、えの 中の じゅんに。
     本文に 出て くる ぶぶんだけに しぼると「ここが こたえ」の めじるしに なるので、
     タイヤや うんてんせきの ような どの 車にも ある ぶぶんも いっしょに ならべる。
   ========================================================================= */
(function () {
  'use strict';

  var A = null;            /* app.js が 用意する 道具（window.jzApp） */
  var S = null;            /* いま ひらいて いる ページ */
  var bound = false;

  var $ = function (s, r) { return (r || document).querySelector(s); };
  var $$ = function (s, r) { return Array.prototype.slice.call((r || document).querySelectorAll(s)); };

  function dataOf(id) {
    var all = window.honData || {};
    return Object.prototype.hasOwnProperty.call(all, id) ? all[id] : null;
  }

  function esc(s) {
    return String(s == null ? '' : s).replace(/[&<>"]/g, function (c) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c];
    });
  }

  function partName(part) {
    var info = window.partInfo && window.partInfo[part];
    return info ? info.name : part;
  }

  /* その 車の えに ある ぶぶん（data-part）を、えの 中の じゅんに 1つずつ */
  function artParts(car) {
    if (!window.carArt || !window.carArt.has(car.art)) { return []; }
    var seen = {}, out = [];
    var svg = window.carArt.svg(car.art, 'fit');
    var re = /data-part="([a-zA-Z0-9_]+)"/g, m;
    while ((m = re.exec(svg))) {
      if (!seen[m[1]]) { seen[m[1]] = true; out.push(m[1]); }
    }
    return out;
  }

  /* 見出しの 文字だけ（ルビの よみを のぞく） */
  function headText(html) {
    return A.bare(html);
  }

  /* ------------------------------------------------------------------
     写真の 出典（photo-credits.js）
     ライセンスの きまりで 出す。写真の 下には 撮影者と ライセンスだけを 小さく、
     ファイル名・元の ページ・かえた ところは「おとなの かたへ」に まとめる。
     ------------------------------------------------------------------ */
  function creditOf(car) {
    return car && car.photo && window.photoCredits && window.photoCredits[car.id] || null;
  }

  function licenseLink(c) {
    return c.licenseUrl
      ? '<a href="' + esc(c.licenseUrl) + '" target="_blank" rel="noopener noreferrer">' + esc(c.license) + '</a>'
      : esc(c.license);
  }

  function creditShort(car) {
    var c = creditOf(car);
    if (!c) { return ''; }
    return '<figcaption class="credit photo-credit">📷 ' +
      '<a href="' + esc(c.source) + '" target="_blank" rel="noopener noreferrer">' + esc(c.author || 'Wikimedia Commons') + '</a>' +
      '（' + licenseLink(c) + '）</figcaption>';
  }

  function creditFull(car) {
    var c = creditOf(car);
    if (!c) { return ''; }
    return '<h4>写真の 出典</h4>' +
      '<p><a href="' + esc(c.source) + '" target="_blank" rel="noopener noreferrer">' + esc(c.title) + '</a>' +
      '／撮影：' + esc(c.author || '') + '／' + licenseLink(c) + '（Wikimedia Commons）' +
      (c.changes ? '<br>かえた ところ：' + esc(c.changes) : '') + '</p>';
  }

  /* ------------------------------------------------------------------
     ページの 中身
     ------------------------------------------------------------------ */
  function audioBtn(label) {
    var html = '🔊 よむ';
    return '<button type="button" class="btn btn--audio js-say" data-label="' + html + '" ' +
      'aria-label="「' + esc(label) + '」を こえで きく">' + html + '</button>';
  }

  function secHTML(pg) {
    var title = headText(pg.h);
    var mame = /^まめちしき/.test(title);
    return '<section class="sec' + (mame ? ' sec--mame' : '') + '">' +
      '<div class="sec__head">' +
      '<h3 class="sec__h js-h"><span>' + pg.h + '</span></h3>' +
      audioBtn(title) +
      '</div>' +
      '<p class="sec__p js-p">' + pg.s.map(function (s) { return s.t; }).join(' ') + '</p>' +
      '</section>';
  }

  function kazuHTML(car, d) {
    if (!d.kazu || !d.kazu.length) { return ''; }
    var size = window.carArt && window.carArt.has(car.art)
      ? '<figure class="kazu__size">' + window.carArt.svg(car.art, 'size') +
        '<figcaption>1<ruby>年生<rt>ねんせい</rt></ruby>（やく 1.2メートル）と くらべた <ruby>大<rt>おお</rt></ruby>きさ</figcaption></figure>'
      : '';
    return '<section class="kazu">' +
      '<h3 class="kazu__h">🔢 かずで <ruby>見<rt>み</rt></ruby>る</h3>' +
      size +
      '<dl class="kazu__dl">' + d.kazu.map(function (kz) {
        return '<div class="kazu__row"><dt>' + kz.l + '</dt><dd>' + kz.v + '</dd></div>';
      }).join('') + '</dl>' +
      '</section>';
  }

  function zukaiHTML(car, parts) {
    if (!parts.length) { return ''; }
    return '<section class="zukai" aria-labelledby="zukai-h">' +
      '<h3 class="zukai__h" id="zukai-h">ぶぶんの <ruby>名<rt>な</rt></ruby>まえ</h3>' +
      '<div class="art-stage" id="page-stage">' + window.carArt.svg(car.art, 'fit') +
      '<div class="callout" id="page-callout" hidden></div></div>' +
      '<div class="zukai__chips">' + parts.map(function (p) {
        return '<button type="button" class="chip js-part" data-part="' + p + '" aria-pressed="false">' +
          partName(p) + '</button>';
      }).join('') + '</div>' +
      '<p class="zukai__hint"><ruby>名<rt>な</rt></ruby>まえを おすと、えの その ぶぶんが <ruby>光<rt>ひか</rt></ruby>ります。</p>' +
      '</section>';
  }

  function turnHTML(car) {
    var B = A.book, prev = B.prev(car.id), next = B.next(car.id);
    function link(c, cls, dir) {
      return '<a class="turn__a ' + cls + '" href="#/car/' + c.id + '" data-cat="' + c.category + '">' +
        '<span class="turn__dir">' + dir + '</span>' +
        '<span class="turn__name">' + (cls === 'turn__a--next'
          ? c.name + '<span class="turn__no">' + B.pageOf(c.id) + '</span>'
          : '<span class="turn__no">' + B.pageOf(c.id) + '</span>' + c.name) + '</span></a>';
    }
    return '<nav class="turn" aria-label="ページを めくる">' +
      (prev ? link(prev, 'turn__a--prev', '← まえの ページ') : '<span></span>') +
      (next ? link(next, 'turn__a--next', 'つぎの ページ →') : '<span></span>') +
      '</nav>';
  }

  function otonaHTML(car, d) {
    var src = (d.src && d.src.length) ? '<h4>この ページを 書く ために しらべた 資料</h4><ul>' +
      d.src.map(function (s) {
        return '<li><a href="' + esc(s.u) + '" target="_blank" rel="noopener noreferrer">' + esc(s.n) + '</a></li>';
      }).join('') + '</ul>' : '';
    return '<details class="otona otona--page">' +
      '<summary>おとなの かたへ（しらべた 資料・写真の 出典）</summary>' +
      '<div class="otona__body">' +
      src +
      '<p>数は「やく」「くらい」の めやすです。同じ 種類の 車でも、大きさや 作りは 車ごとに ちがいます。</p>' +
      creditFull(car) +
      '</div></details>';
  }

  function pageHTML(car, d) {
    var cat = A.catMap[car.category] || { icon: '', name: '' };
    var parts = artParts(car);
    var no = A.book.pageOf(car.id);

    var photo = car.photo
      ? '<figure class="photo">' +
        '<div class="photo__frame"><img src="' + esc(car.photo) + '" alt="' + esc(A.bare(car.name)) +
        'の しゃしん" decoding="async"></div>' +
        creditShort(car) +
        '</figure>'
      : '';

    return '<article class="page' + (car.photo ? '' : ' page--nophoto') + '" data-cat="' + car.category + '">' +

      '<header class="page__head">' +
      '<div class="page__band">' +
      '<span class="page__chap"><span class="page__chap-ico" aria-hidden="true">' + cat.icon + '</span>' + cat.name + '</span>' +
      '<span class="page__no">' + no + '<small>ページ</small></span>' +
      '</div>' +
      '<div class="page__title">' +
      '<h2 class="page__name">' + car.name + '</h2>' +
      '<p class="page__catch">' + d.catch + '</p>' +
      '</div>' +
      '</header>' +

      '<div class="page__body">' +

      '<div class="page__fig">' +
      photo +
      zukaiHTML(car, parts) +
      '<a class="btn btn--kansatsu" href="#/kansatsu/' + car.id + '">' +
      '<span class="btn--kansatsu__ico" aria-hidden="true">🔬</span>' +
      '<span>くわしく <ruby>見<rt>み</rt></ruby>る<br><small>まわして <ruby>見<rt>み</rt></ruby>る・<ruby>大<rt>おお</rt></ruby>きく <ruby>見<rt>み</rt></ruby>る</small></span></a>' +
      kazuHTML(car, d) +
      '</div>' +

      '<div class="page__text">' +
      d.pages.map(secHTML).join('') +
      '</div>' +

      '</div>' +

      turnHTML(car) +
      otonaHTML(car, d) +
      '</article>';
  }

  /* ------------------------------------------------------------------
     ぶぶんの 名まえ — えの その ぶぶんを 光らせる
     ------------------------------------------------------------------ */
  function clearLight() {
    if (!S) { return; }
    var stage = $('#page-stage');
    if (stage) {
      var svg = stage.querySelector('svg');
      if (svg) {
        svg.classList.remove('has-lit');
        $$('.is-lit', svg).forEach(function (e) { e.classList.remove('is-lit'); });
      }
    }
    var c = $('#page-callout');
    if (c) { c.hidden = true; }
    $$('.js-part', S.el).forEach(function (b) { b.setAttribute('aria-pressed', 'false'); });
    S.pin = null;
  }

  function light(chip) {
    var part = chip.getAttribute('data-part');
    if (S.pin === part) { clearLight(); return; }
    clearLight();
    var stage = $('#page-stage');
    var svg = stage && stage.querySelector('svg');
    if (!svg) { return; }
    var els = $$('[data-part="' + part + '"]', svg);
    if (!els.length) { return; }
    els.forEach(function (e) { e.classList.add('is-lit'); });
    svg.classList.add('has-lit');
    chip.setAttribute('aria-pressed', 'true');
    var c = $('#page-callout');
    c.innerHTML = partName(part);
    c.hidden = false;
    S.pin = part;
    A.placeCallout(svg, els, c, stage);
    /* えが 見えない ところで おした ときは、光った ところを 見せる */
    var r = stage.getBoundingClientRect();
    if (r.top < 0 || r.bottom > (window.innerHeight || document.documentElement.clientHeight)) {
      stage.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
    }
  }

  function relight() {
    if (!S || !S.pin) { return; }
    var stage = $('#page-stage'), svg = stage && stage.querySelector('svg');
    if (!svg) { return; }
    A.placeCallout(svg, $$('[data-part="' + S.pin + '"]', svg), $('#page-callout'), stage);
  }

  /* ------------------------------------------------------------------
     こえで きく（見出しと 文だけ。ボタンの 文字は 読まない）
     ------------------------------------------------------------------ */
  function speakSection(btn) {
    var sec = btn.closest('.sec');
    if (!sec) { return; }
    var box = document.createElement('div');
    box.appendChild($('.js-h', sec).cloneNode(true));
    box.appendChild(document.createTextNode('。'));
    box.appendChild($('.js-p', sec).cloneNode(true));
    A.speak(btn, box);
  }

  /* ------------------------------------------------------------------
     うけつけ
     ------------------------------------------------------------------ */
  function bind(el) {
    if (bound) { return; }
    bound = true;

    el.addEventListener('click', function (e) {
      if (!S) { return; }
      var b;
      if ((b = e.target.closest('.js-say'))) { speakSection(b); return; }
      if ((b = e.target.closest('.js-part'))) { light(b); }
    });

    document.addEventListener('keydown', function (e) {
      if (S && e.key === 'Escape') { clearLight(); }
    });

    window.addEventListener('resize', relight);
  }

  function mount(car, el) {
    A = window.jzApp;
    var d = dataOf(car.id);
    if (!d) { return false; }
    unmount();
    S = { car: car, d: d, el: el, pin: null };
    el.innerHTML = pageHTML(car, d);
    bind(el);
    return true;
  }

  function unmount() {
    if (!S) { return; }
    clearLight();
    S = null;
  }

  window.jzHon = {
    has: function (id) { return !!dataOf(id); },
    mount: mount,
    unmount: unmount,
    parts: artParts
  };
})();
