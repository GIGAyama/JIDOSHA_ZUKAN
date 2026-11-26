/* =========================================================================
   hon.js — 車の ページ（#/car/<id>）

   ■ なにを する ページか
     図書室の ずかんの かわりに 読む、1台ぶんの ページ。
     「じどう車くらべ」の さいごの 時間（はしご車）と「じどう車ずかんを つくろう」で、
     子どもは この ページを 読んで、えらんだ 車の しごとと つくりを じぶんで 見つけ、
     ワークシートや ノートに じぶんの ことばで 書く。

   ■ わざと しない こと
     ・文に「しごと」「つくり」の ラベルや 色を つけて 出す こと、「その ために」の 型。
       本物の ずかんにも 書いて いない。見出しと 文から 子どもが 見つける。
     ・線を ひいた 文を メモに あつめる こと、カードの 書きだしの 型。
       アプリを そうさする だけで カードが しあがって しまうので、2026-11-08 に はずした。
       （その ときに たまって いた 線の データ jz.hon.* は app.js が 1かいだけ かたづける）

   ■ 文に 線を ひく（2026-11-26 に 足した）
     教科書に 線を ひく のと おなじ ように、子どもが ペンを えらんで 文を なぞると、
     その ところに 線が ひける。どこが しごとで どこが つくりかは 子どもが きめる。
     アプリは「あって いる」とも「ちがう」とも 言わない。線は 画面に のこる だけで、
     どこにも あつめない（書くのは ノートや ワークシート）。
       しごとの ペン … あおい ふとい 線
       つくりの ペン … みどりの 2本の 線（色が 見わけにくい 子でも かたちで わかる）
       けしゴム     … なぞった ところを けす。1かい おすと、そこに つながった 線を けす
     ペンを えらんで いる あいだは、文の 上で ゆびを うごかしても 画面は うごかない
     （文の そとを さわれば うごく）。もう いちど おすと ペンを しまう。

   ■ 線の ほぞん
     jz.sen.<車のid> = { <文の かぎ>: "..ssss...tt.." }
     文の かぎは まとまりの 文字から 作り、1もじに 1つ（ふりがなの ついた ことばは
     まとめて 1つ）、'.' か 's' か 't' を ならべる。文を 書きかえると その 線は 消える
     （ちがう ところに 線が うつって しまう より よい）。
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
     線を ひく — 文を 1もじずつに わける
     ------------------------------------------------------------------ */
  var PEN = {
    s: { name: 'しごと' },
    t: { name: 'つくり' }
  };

  var HINT = {
    none: 'ペンを えらんで、<ruby>文<rt>ぶん</rt></ruby>を なぞります。',
    s: 'しごとの <ruby>線<rt>せん</rt></ruby>。<ruby>文<rt>ぶん</rt></ruby>を なぞります。',
    t: 'つくりの <ruby>線<rt>せん</rt></ruby>。<ruby>文<rt>ぶん</rt></ruby>を なぞります。',
    e: 'けしたい <ruby>線<rt>せん</rt></ruby>を なぞるか、おします。',
    clear: 'もう いちど おすと、ぜんぶ きえます。'
  };

  /* <ruby>…</ruby> は まとめて 1つ、ほかは 1もじずつ */
  var TOKEN = /<ruby>[\s\S]*?<\/ruby>|<[^>]+>|&[#a-zA-Z0-9]+;|[\uD800-\uDBFF][\uDC00-\uDFFF]|[\s\S]/g;

  function paraSource(pg) {
    return pg.s.map(function (s) { return s.t; }).join(' ');
  }

  function tokensOf(html) {
    return String(html).match(TOKEN) || [];
  }

  /* 線を ひける 1つ（タグ だけの もの は かぞえない） */
  function isMarkable(tok) {
    return tok.charAt(0) !== '<' || tok.indexOf('<ruby>') === 0;
  }

  function countOf(html) {
    return tokensOf(html).filter(isMarkable).length;
  }

  /* 文の かぎ（文字から 作る。ルビの よみは ふくめない） */
  function pkey(html) {
    var s = A.bare(html), h = 5381, i;
    for (i = 0; i < s.length; i++) { h = ((h << 5) + h + s.charCodeAt(i)) | 0; }
    return (h >>> 0).toString(36);
  }

  function blank(n) {
    var a = [], i;
    for (i = 0; i < n; i++) { a.push('.'); }
    return a;
  }

  /* ほぞんした 線を 読む。文が かわって いたら（かずが あわない）すてる */
  function loadSen(d) {
    var saved = A.store.get('sen.' + S.car.id, {}), out = [];
    if (!saved || typeof saved !== 'object' || Array.isArray(saved)) { saved = {}; }
    d.pages.forEach(function (pg) {
      var html = paraSource(pg), n = countOf(html), m = saved[pkey(html)];
      out.push(typeof m === 'string' && m.length === n && /^[.st]*$/.test(m) ? m.split('') : blank(n));
    });
    return out;
  }

  function saveSen() {
    var o = {}, any = false;
    S.d.pages.forEach(function (pg, i) {
      var m = S.sen[i].join('');
      if (/[st]/.test(m)) { o[pkey(paraSource(pg))] = m; any = true; }
    });
    if (any) { A.store.set('sen.' + S.car.id, o); }
    else { A.store.remove('sen.' + S.car.id); }
  }

  /* 文の 中身。おなじ ペンが つづく ところは 1つの <span class="sen"> に まとめる
     （1もじずつ 線を かくと、もじの さかいめに すきまが 見える） */
  function paraBody(pi) {
    var marks = S.sen[pi], n = 0, open = '', out = '';
    tokensOf(paraSource(S.d.pages[pi])).forEach(function (tok) {
      if (isMarkable(tok)) {
        var i = n++, k = marks[i] === 's' || marks[i] === 't' ? marks[i] : '';
        if (k !== open) {
          if (open) { out += '</span>'; }
          if (k) { out += '<span class="sen is-' + k + '">'; }
          open = k;
        }
        out += '<span class="ch" data-i="' + i + '">' + tok + '</span>';
      } else {
        out += tok;
      }
    });
    return out + (open ? '</span>' : '');
  }

  function paraHTML(pg) {
    var pi = S.d.pages.indexOf(pg);
    return '<p class="sec__p js-p" data-pi="' + pi + '">' + paraBody(pi) + '</p>';
  }

  function penbarHTML() {
    function tool(k, label) {
      return '<button type="button" class="pen js-pen pen--' + k + '" data-tool="' + k + '" aria-pressed="false">' +
        '<span class="pen__sample" aria-hidden="true"></span>' +
        '<span class="pen__name">' + label + '</span></button>';
    }
    return '<div class="penbar" role="group" aria-labelledby="penbar-h">' +
      '<p class="penbar__h"><b id="penbar-h"><span aria-hidden="true">✏️</span> <ruby>線<rt>せん</rt></ruby>を ひく</b>' +
      '<span class="penbar__hint" id="penbar-hint" aria-live="polite">' + HINT.none + '</span></p>' +
      '<div class="penbar__tools">' +
      tool('s', PEN.s.name) +
      tool('t', PEN.t.name) +
      tool('e', 'けしゴム') +
      '<button type="button" class="pen pen--undo js-undo" disabled><span class="pen__name">↩ もどす</span></button>' +
      '<button type="button" class="pen pen--clear js-clear" data-label="ぜんぶ けす"><span class="pen__name">ぜんぶ けす</span></button>' +
      '</div>' +
      '</div>';
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
      paraHTML(pg) +
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
      penbarHTML() +
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
    A.placeCallout(els, c, stage);
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
    A.placeCallout($$('[data-part="' + S.pin + '"]', svg), $('#page-callout'), stage);
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
     線を ひく — ペンを えらぶ・なぞる・けす・もどす
     ------------------------------------------------------------------ */

  function setHint(k) {
    var h = $('#penbar-hint');
    if (h) { h.innerHTML = HINT[k] || HINT.none; }
  }

  function setTool(k) {
    if (!S) { return; }
    S.tool = (k && S.tool !== k) ? k : null;
    $$('.js-pen', S.el).forEach(function (b) {
      b.setAttribute('aria-pressed', String(b.getAttribute('data-tool') === S.tool));
    });
    var page = $('.page', S.el);
    if (page) {
      page.classList.toggle('is-pen', !!S.tool);
      page.setAttribute('data-tool', S.tool || '');
    }
    disarmClear();
    setHint(S.tool || 'none');
  }

  function paint(pi) {
    var p = $('.js-p[data-pi="' + pi + '"]', S.el);
    if (p) { p.innerHTML = paraBody(pi); }
  }

  function syncUndo() {
    var b = $('.js-undo', S.el);
    if (b) { b.disabled = !S.undo.length; }
  }

  /* ゆびの ところに ある 1もじ。ゆびは 文字より すこし 下に ずれやすいので、上も さがす */
  function hitAt(p, x, y) {
    var dy = [0, -8, 8, -16], i, el;
    for (i = 0; i < dy.length; i++) {
      el = document.elementFromPoint(x, y + dy[i]);
      el = el && el.closest && el.closest('.ch');
      if (el && p.contains(el)) { return +el.getAttribute('data-i'); }
    }
    return -1;
  }

  function strokeApply() {
    var st = S.stroke, a = Math.min(st.from, st.to), b = Math.max(st.from, st.to), i;
    var m = st.before.slice(), v = st.tool === 'e' ? '.' : st.tool;
    for (i = a; i <= b; i++) { m[i] = v; }
    S.sen[st.pi] = m;
    paint(st.pi);
  }

  /* けしゴムで 1かい おした ときは、そこに つながった おなじ 色の 線を けす */
  function eraseRun(pi, i) {
    var m = S.sen[pi].slice(), k = m[i], a = i, b = i;
    if (k !== 's' && k !== 't') { return false; }
    while (a > 0 && m[a - 1] === k) { a--; }
    while (b < m.length - 1 && m[b + 1] === k) { b++; }
    for (; a <= b; a++) { m[a] = '.'; }
    S.sen[pi] = m;
    paint(pi);
    return true;
  }

  function same(a, b) { return a.join('') === b.join(''); }

  function onDown(e) {
    if (!S || !S.tool || S.stroke || e.isPrimary === false) { return; }
    if (e.pointerType === 'mouse' && e.button !== 0) { return; }
    var p = e.target.closest && e.target.closest('.js-p');
    if (!p || !S.el.contains(p)) { return; }
    var i = hitAt(p, e.clientX, e.clientY);
    if (i < 0) { return; }
    e.preventDefault();
    var pi = +p.getAttribute('data-pi');
    S.stroke = { id: e.pointerId, p: p, pi: pi, from: i, to: i, moved: false, tool: S.tool, before: S.sen[pi].slice() };
    try { p.setPointerCapture(e.pointerId); } catch (err) { /* なくても うごく */ }
    if (S.tool !== 'e') { strokeApply(); }
  }

  function onMove(e) {
    var st = S && S.stroke;
    if (!st || e.pointerId !== st.id) { return; }
    e.preventDefault();
    var i = hitAt(st.p, e.clientX, e.clientY);
    if (i < 0 || i === st.to) { return; }
    st.to = i;
    st.moved = true;
    strokeApply();
  }

  function onUp(e) {
    var st = S && S.stroke;
    if (!st || e.pointerId !== st.id) { return; }
    S.stroke = null;
    if (st.tool === 'e' && !st.moved) { eraseRun(st.pi, st.from); }
    if (!same(st.before, S.sen[st.pi])) {
      S.undo.push([{ pi: st.pi, before: st.before }]);
      if (S.undo.length > 50) { S.undo.shift(); }
      saveSen();
      syncUndo();
    }
  }

  function onCancel(e) {
    var st = S && S.stroke;
    if (!st || e.pointerId !== st.id) { return; }
    S.stroke = null;
    S.sen[st.pi] = st.before;
    paint(st.pi);
  }

  /* もどすは 1かいの なぞり（ぜんぶ けす なら ぜんぶ）ずつ */
  function undo() {
    var u = S.undo.pop();
    if (!u) { return; }
    u.forEach(function (x) { S.sen[x.pi] = x.before; paint(x.pi); });
    saveSen();
    syncUndo();
  }

  /* ぜんぶ けす は 2かい おす（まちがえて おしても すぐには きえない） */
  function disarmClear() {
    if (!S) { return; }
    clearTimeout(S.clearTimer);
    S.clearArmed = false;
    var b = $('.js-clear', S.el);
    if (b) { b.classList.remove('is-armed'); $('.pen__name', b).textContent = b.getAttribute('data-label'); }
  }

  function clearAll(btn) {
    if (!S.clearArmed) {
      S.clearArmed = true;
      btn.classList.add('is-armed');
      $('.pen__name', btn).textContent = 'ほんとうに けす？';
      setHint('clear');
      S.clearTimer = setTimeout(function () { disarmClear(); setHint(S && S.tool || 'none'); }, 4000);
      return;
    }
    disarmClear();
    var step = [];
    S.sen.forEach(function (m, pi) {
      if (/[st]/.test(m.join(''))) {
        step.push({ pi: pi, before: m.slice() });
        S.sen[pi] = blank(m.length);
        paint(pi);
      }
    });
    if (step.length) { S.undo.push(step); saveSen(); syncUndo(); }
    setHint(S.tool || 'none');
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
      if ((b = e.target.closest('.js-part'))) { light(b); return; }
      if ((b = e.target.closest('.js-pen'))) { setTool(b.getAttribute('data-tool')); return; }
      if ((b = e.target.closest('.js-undo'))) { undo(); return; }
      if ((b = e.target.closest('.js-clear'))) { clearAll(b); }
    });

    el.addEventListener('pointerdown', onDown);
    el.addEventListener('pointermove', onMove);
    el.addEventListener('pointerup', onUp);
    el.addEventListener('pointercancel', onCancel);
    el.addEventListener('lostpointercapture', onUp);

    document.addEventListener('keydown', function (e) {
      if (S && e.key === 'Escape') { clearLight(); if (S.tool) { setTool(null); } }
    });

    window.addEventListener('resize', relight);
  }

  function mount(car, el) {
    A = window.jzApp;
    var d = dataOf(car.id);
    if (!d) { return false; }
    unmount();
    S = { car: car, d: d, el: el, pin: null, tool: null, stroke: null, undo: [], clearArmed: false, clearTimer: 0 };
    S.sen = loadSen(d);
    el.innerHTML = pageHTML(car, d);
    bind(el);
    return true;
  }

  function unmount() {
    if (!S) { return; }
    clearLight();
    clearTimeout(S.clearTimer);
    S = null;
  }

  window.jzHon = {
    has: function (id) { return !!dataOf(id); },
    mount: mount,
    unmount: unmount,
    parts: artParts
  };
})();
