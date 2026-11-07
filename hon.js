/* =========================================================================
   hon.js — じどう車の 本（#/hon/<id>）

   ■ なにを する ページか
     「じどう車ずかんを つくろう」の 第2〜4時、子どもは 図書室の 図鑑を 読んで、
     えらんだ 車の しごとと つくりを 見つけて ノートに 書きだす。
     この ページは その 図鑑の かわり。

     ・文は 教科書の 型（〜しごとを して います。その ために、〜）で 書いて いない。
       しごと・つくり・その ほか（大きさ・はたらく 人・まめちしき）が まざって いて、
       どれが しごとで どれが つくりかを、子どもが じぶんで 見分ける。
     ・しごとの 文に あおペン、つくりの 文に みどりペンで 線を ひく
       （「じどう車くらべ」で 教科書に 線を ひいた のと おなじ ことを する）。
     ・線を ひいた 文は「📝 メモ」に あつまる。メモには カードの 型
       「〇〇は、〜しごとを して います。その ために、〜。」も 出す。
       書くのは ノートや カード（この サイトには 書く ところを つくらない）。

   ■ こたえあわせは しない
     hon-data.js の k（s / t / o）は、ページに じゅうぶんな 材料が あるかを
     検査する ための もの。画面では つかわない。本は「これは しごとの 文です」とは
     言わないので、ここでも 言わない。

   ■ ほぞん
     jz.hon.<車のid> = { <文の かぎ>: 's' | 't' }
     文の かぎは 文の 文字から 作る。文を 書きかえると その 線は 消える
     （ちがう 文に 線が うつって しまう より よい）。
   ========================================================================= */
(function () {
  'use strict';

  var A = null;            /* app.js が 用意する 道具（window.jzApp） */
  var S = null;            /* いま ひらいて いる 本 */
  var bound = false;

  var PEN = {
    s: { name: 'しごと', color: 'あお' },
    t: { name: 'つくり', color: 'みどり' }
  };

  var $ = function (s, r) { return (r || document).querySelector(s); };
  var $$ = function (s, r) { return Array.prototype.slice.call((r || document).querySelectorAll(s)); };

  function dataOf(id) {
    var all = window.honData || {};
    return Object.prototype.hasOwnProperty.call(all, id) ? all[id] : null;
  }

  function esc(s) {
    return String(s).replace(/[&<>"]/g, function (c) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c];
    });
  }

  /* 文の かぎ（文字から 作る。ルビの よみは ふくめない） */
  function hkey(html) {
    var s = A.plain(html), h = 5381, i;
    for (i = 0; i < s.length; i++) { h = ((h << 5) + h + s.charCodeAt(i)) | 0; }
    return (h >>> 0).toString(36);
  }

  /* この 本で 線を ひける もの（文と「かずで 見る」）を、本の じゅんに */
  function itemsOf(d) {
    var out = [];
    d.pages.forEach(function (pg) {
      pg.s.forEach(function (s) { out.push({ key: hkey(s.t), html: s.t }); });
    });
    (d.kazu || []).forEach(function (kz) {
      var html = kz.l + '：' + kz.v;
      out.push({ key: hkey(html), html: html });
    });
    return out;
  }

  function loadMarks(id) {
    var m = A.store.get('hon.' + id, {});
    return (m && typeof m === 'object' && !Array.isArray(m)) ? m : {};
  }

  /* いまの 本に ない かぎ（文を 書きかえた あとの のこり）は すてる */
  function cleanMarks(d, marks) {
    var keep = {}, ok = {};
    itemsOf(d).forEach(function (it) { ok[it.key] = true; });
    Object.keys(marks).forEach(function (k) {
      if (ok[k] && (marks[k] === 's' || marks[k] === 't')) { keep[k] = marks[k]; }
    });
    return keep;
  }

  /* もくじの カードに 出す かず */
  function countMarks(id) {
    var d = dataOf(id);
    if (!d || !A) { return { s: 0, t: 0 }; }
    var m = cleanMarks(d, loadMarks(id)), n = { s: 0, t: 0 };
    Object.keys(m).forEach(function (k) { n[m[k]]++; });
    return n;
  }

  function save() { A.store.set('hon.' + S.car.id, S.marks); }

  /* ------------------------------------------------------------------
     ページの 中身
     ------------------------------------------------------------------ */
  function markAttr(key) {
    return ' data-key="' + key + '" role="button" tabindex="0"';
  }

  function stateText(k) {
    return k ? '（' + PEN[k].name + 'の 線）' : '';
  }

  function sentHTML(s) {
    var key = hkey(s.t), k = S.marks[key];
    return '<span class="hs' + (k ? ' is-' + k : '') + '"' + markAttr(key) + '>' + s.t +
      '<span class="visually-hidden js-state">' + stateText(k) + '</span></span>';
  }

  function kazuHTML(kz) {
    var key = hkey(kz.l + '：' + kz.v), k = S.marks[key];
    return '<div class="hon__kz-row hs' + (k ? ' is-' + k : '') + '"' + markAttr(key) + '>' +
      '<dt>' + kz.l + '</dt><dd>' + kz.v + '</dd>' +
      '<span class="visually-hidden js-state">' + stateText(k) + '</span></div>';
  }

  function partName(part) {
    var info = window.partInfo && window.partInfo[part];
    return info ? info.name : part;
  }

  /* 本に 出て くる ぶぶん（part）を、出て きた じゅんに 1つずつ */
  function partsOf(d) {
    var seen = {}, out = [];
    d.pages.forEach(function (pg) {
      pg.s.forEach(function (s) {
        if (s.part && !seen[s.part]) { seen[s.part] = true; out.push(s.part); }
      });
    });
    return out;
  }

  function audioBtn(label) {
    var html = '🔊 よむ';
    return '<button type="button" class="btn btn--audio hon__audio js-hon-audio" data-label="' + html + '" ' +
      'aria-label="' + label + 'を こえで きく">' + html + '</button>';
  }

  /* 本の ページの じゅんばん（ずかんと おなじ ならび）。本を めくる ように 前後へ 行ける */
  function bookOrder() {
    return (window.carsData || []).filter(function (c) { return !!dataOf(c.id); });
  }

  function turnHTML(car) {
    var list = bookOrder(), i = -1, k;
    for (k = 0; k < list.length; k++) { if (list[k].id === car.id) { i = k; break; } }
    if (i < 0) { return ''; }
    var prev = list[i - 1], next = list[i + 1];
    return '<nav class="hon__turn" aria-label="ページを めくる">' +
      (prev ? '<a class="hon__turn-a hon__turn-a--prev" href="#/hon/' + prev.id + '">' +
        '<span class="hon__turn-dir">← まえの ページ</span><span class="hon__turn-name">' + prev.name + '</span></a>'
        : '<span></span>') +
      (next ? '<a class="hon__turn-a hon__turn-a--next" href="#/hon/' + next.id + '">' +
        '<span class="hon__turn-dir">つぎの ページ →</span><span class="hon__turn-name">' + next.name + '</span></a>'
        : '<span></span>') +
      '</nav>';
  }

  function pageNo(car) {
    var list = bookOrder();
    for (var k = 0; k < list.length; k++) {
      if (list[k].id === car.id) { return (k + 1) + ' / ' + list.length; }
    }
    return '';
  }

  function pageHTML(car, d) {
    var cat = A.catMap[car.category] || { icon: '', name: '' };
    var name = A.plain(car.name);
    var parts = window.carArt && window.carArt.has(car.art) ? partsOf(d) : [];

    var secs = d.pages.map(function (pg, i) {
      return '<section class="hon__sec">' +
        '<div class="hon__sec-head">' +
        '<h3 class="hon__h js-hon-h">' + pg.h + '</h3>' +
        audioBtn('「' + A.plain(pg.h) + '」') +
        '</div>' +
        '<p class="hon__p js-hon-p" data-sec="' + i + '">' + pg.s.map(sentHTML).join(' ') + '</p>' +
        '</section>';
    }).join('');

    var look = parts.length ? '<div class="hon__look">' +
      '<p class="hon__look-h">👀 ここを <ruby>見<rt>み</rt></ruby>て！</p>' +
      '<div class="hon__chips">' + parts.map(function (p) {
        return '<button type="button" class="hon__chip js-hon-part" data-part="' + p + '" aria-pressed="false">' +
          partName(p) + '</button>';
      }).join('') + '</div></div>' : '';

    var kazu = (d.kazu && d.kazu.length) ? '<section class="hon__kazu">' +
      '<h3 class="hon__kazu-h">🔢 かずで <ruby>見<rt>み</rt></ruby>る</h3>' +
      '<dl class="hon__kz">' + d.kazu.map(kazuHTML).join('') + '</dl></section>' : '';

    var src = (d.src && d.src.length) ? '<details class="hon__src">' +
      '<summary>📎 この ページを かく ために しらべた ところ（せんせい・おうちの かたへ）</summary>' +
      '<ul>' + d.src.map(function (s) {
        return '<li><a href="' + esc(s.u) + '" target="_blank" rel="noopener noreferrer">' + esc(s.n) + '</a></li>';
      }).join('') + '</ul>' +
      '<p>すうじは「やく」「くらい」の めやすです。<ruby>車<rt>くるま</rt></ruby>に よって ちがいます。</p>' +
      '</details>' : '';

    return '<article class="hon" data-cat="' + car.category + '">' +

      '<header class="hon__head">' +
      '<p class="hon__series"><span>📚 はたらく じどう<ruby>車<rt>しゃ</rt></ruby>の <ruby>本<rt>ほん</rt></ruby>' +
      '<span class="hon__pno">' + pageNo(car) + ' ページ</span></span>' +
      '<span class="hon__cat">' + cat.icon + ' ' + cat.name + '</span></p>' +
      '<h2 class="hon__name">' + car.name + '</h2>' +
      '<p class="hon__catch">' + d.catch + '</p>' +
      '</header>' +

      '<div class="hon__spread">' +

      /* 「ここを 見て！」は 絵の 上に おく。下に おくと、ひらいた ときに
         したの ペンの おびに かくれて おせない（よこむきの タブレット） */
      '<div class="hon__left">' +
      look +
      '<figure class="hon__fig">' +
      '<div class="art-stage hon__stage' + (A.hasArtSwap(car) ? ' has-photo' : '') + '" id="hon-stage">' +
      A.artHTML(car, 'both') +
      '<div class="callout" id="hon-callout" hidden></div>' +
      '</div>' +
      '<figcaption class="hon__cap">' + (car.photo ? '📷 ' : '🖼️ ') + name +
      (parts.length ? '<br>「ここを <ruby>見<rt>み</rt></ruby>て！」を おすと、その ぶぶんが <ruby>光<rt>ひか</rt></ruby>ります。' : '') +
      '</figcaption>' +
      '</figure>' +
      '</div>' +

      '<div class="hon__right">' +
      secs +
      kazu +
      src +
      '<div class="hon__more">' +
      '<a class="btn btn--ghost" href="#/car/' + car.id + '">📖 ①②③の ずかんで <ruby>見<rt>み</rt></ruby>る（3Dも あるよ）</a>' +
      '</div>' +
      '</div>' +

      '</div>' +
      turnHTML(car) +
      '</article>' +

      /* ペン（したに いつも 出て いる） */
      '<div class="penbar" role="toolbar" aria-label="ペン">' +
      '<button type="button" class="pen pen--s js-pen" data-pen="s" aria-pressed="false">' +
      '<span class="pen__tip" aria-hidden="true"></span><span class="pen__name">しごと</span></button>' +
      '<button type="button" class="pen pen--t js-pen" data-pen="t" aria-pressed="false">' +
      '<span class="pen__tip" aria-hidden="true"></span><span class="pen__name">つくり</span></button>' +
      '<button type="button" class="pen pen--x js-pen" data-pen="x" aria-pressed="false">' +
      '<span class="pen__ico" aria-hidden="true">🧽</span><span class="pen__name">けす</span></button>' +
      '<button type="button" class="pen-memo js-memo-open" id="hon-memo-btn">' +
      '<span class="pen__ico" aria-hidden="true">📝</span><span class="pen__name">メモ</span>' +
      '<span class="pen-memo__n" id="hon-count"></span></button>' +
      '</div>' +

      '<div class="hon-toast" id="hon-toast" role="status" aria-live="polite"></div>' +

      '<div class="hon-memo" id="hon-memo" hidden>' +
      '<div class="hon-memo__panel" role="dialog" aria-modal="true" aria-labelledby="hon-memo-title" tabindex="-1">' +
      '<div class="hon-memo__body" id="hon-memo-body"></div>' +
      '</div></div>';
  }

  /* ------------------------------------------------------------------
     メモ
     ------------------------------------------------------------------ */
  function marked(kind) {
    return itemsOf(S.d).filter(function (it) { return S.marks[it.key] === kind; });
  }

  function memoList(kind) {
    var list = marked(kind);
    if (!list.length) {
      return '<p class="memo__empty">まだ ありません。<b class="ink-' + kind + '">' + PEN[kind].color +
        'の ペン</b>で、' + PEN[kind].name + 'の ことが かいて ある <ruby>文<rt>ぶん</rt></ruby>に <ruby>線<rt>せん</rt></ruby>を ひこう。</p>';
    }
    return '<ol class="memo__list">' + list.map(function (it) {
      return '<li class="memo__item memo__item--' + kind + '">' +
        '<span class="memo__text">' + it.html + '</span>' +
        '<button type="button" class="memo__del js-memo-del" data-key="' + it.key + '" ' +
        'aria-label="この メモを けす">✕ けす</button></li>';
    }).join('') + '</ol>';
  }

  function memoHTML() {
    var name = S.car.name;
    var any = marked('s').length + marked('t').length > 0;
    return '<div class="memo__top">' +
      '<h2 class="memo__title" id="hon-memo-title">📝 ' + name + 'の メモ</h2>' +
      '<button type="button" class="btn btn--ghost memo__close js-memo-close">とじる ✕</button>' +
      '</div>' +

      '<section class="memo__group memo__group--s">' +
      '<h3 class="memo__h"><span class="memo__pen memo__pen--s" aria-hidden="true"></span>しごと</h3>' +
      memoList('s') + '</section>' +

      '<section class="memo__group memo__group--t">' +
      '<h3 class="memo__h"><span class="memo__pen memo__pen--t" aria-hidden="true"></span>つくり</h3>' +
      memoList('t') + '</section>' +

      '<section class="memo__frame">' +
      '<h3 class="memo__frame-h">✏️ ノートに かく ときの かたち</h3>' +
      '<p class="memo__line"><b>' + name + '</b>は、<span class="blank blank--s">しごと</span> しごとを して います。</p>' +
      '<p class="memo__line"><b>その ために</b>、<span class="blank blank--t">つくり</span>。</p>' +
      '<p class="memo__tip">メモの ことばを、じぶんの ことばに なおして かこう。' +
      'つくりは「〜ように、〜。」と わけも かけると、もっと よく つたわるよ。</p>' +
      '</section>' +

      '<div class="memo__foot">' +
      (any ? '<button type="button" class="btn btn--ghost memo__clear js-memo-clear">🗑️ ぜんぶ けす</button>' : '') +
      '<button type="button" class="btn memo__back js-memo-close">📚 <ruby>本<rt>ほん</rt></ruby>に もどる</button>' +
      '</div>';
  }

  function syncCount() {
    var n = { s: 0, t: 0 };
    Object.keys(S.marks).forEach(function (k) { n[S.marks[k]]++; });
    var el = $('#hon-count');
    if (el) {
      el.innerHTML = '<span class="ink-s">' + n.s + '</span>・<span class="ink-t">' + n.t + '</span>';
      el.setAttribute('aria-label', 'しごと ' + n.s + 'こ、つくり ' + n.t + 'こ');
    }
  }

  var lastFocus = null;

  function openMemo() {
    stopAll();
    var memo = $('#hon-memo');
    $('#hon-memo-body').innerHTML = memoHTML();
    lastFocus = document.activeElement;
    memo.hidden = false;
    document.body.classList.add('is-memo-open');
    var close = $('.js-memo-close', memo);
    if (close) { close.focus(); }
  }

  function closeMemo() {
    var memo = $('#hon-memo');
    if (!memo || memo.hidden) { return false; }
    memo.hidden = true;
    document.body.classList.remove('is-memo-open');
    if (lastFocus && lastFocus.focus) { lastFocus.focus(); }
    return true;
  }

  /* ------------------------------------------------------------------
     ペンで 線を ひく
     ------------------------------------------------------------------ */
  function setPen(p) {
    S.pen = S.pen === p ? null : p;           /* もう いちど おすと ペンを おく */
    $$('.js-pen', S.el).forEach(function (b) {
      b.setAttribute('aria-pressed', String(b.getAttribute('data-pen') === S.pen));
    });
    var art = $('.hon', S.el);
    art.classList.remove('pen-s', 'pen-t', 'pen-x');
    if (S.pen) {
      art.classList.add('pen-' + S.pen);
      toast(S.pen === 'x'
        ? '<ruby>線<rt>せん</rt></ruby>を けしたい <ruby>文<rt>ぶん</rt></ruby>を おしてね'
        : '<b class="ink-' + S.pen + '">' + PEN[S.pen].name + '</b>の ことが かいて ある <ruby>文<rt>ぶん</rt></ruby>を おしてね');
    } else {
      toast('ペンを おきました');
    }
  }

  function paint(el, isNew) {
    var k = S.marks[el.getAttribute('data-key')];
    el.classList.remove('is-s', 'is-t');
    if (k) { el.classList.add('is-' + k); }
    if (isNew && k) {
      el.classList.remove('is-new');
      void el.offsetWidth;                    /* アニメーションを もう いちど うごかす */
      el.classList.add('is-new');
    }
    var st = $('.js-state', el);
    if (st) { st.textContent = stateText(k); }
  }

  function repaintKey(key) {
    $$('.hs[data-key="' + key + '"]', S.el).forEach(function (el) { paint(el, false); });
  }

  function mark(el) {
    if (!S.pen) {
      toast('まず <b>したの ペン</b>を えらんでね');
      var bar = $('.penbar', S.el);
      if (bar) {
        bar.classList.remove('is-nudge');
        void bar.offsetWidth;
        bar.classList.add('is-nudge');
      }
      return;
    }
    var key = el.getAttribute('data-key');
    var cur = S.marks[key], next;
    if (S.pen === 'x') { next = null; }
    else if (cur === S.pen) { next = null; }  /* おなじ ペンで もう いちど → けす */
    else { next = S.pen; }
    if (!next && !cur) { return; }
    if (next) { S.marks[key] = next; } else { delete S.marks[key]; }
    save();
    paint(el, !!next);
    syncCount();
    if (next) {
      toast('<b class="ink-' + next + '">' + PEN[next].name + '</b>の メモに 入れたよ（📝 メモで 見られます）');
    } else {
      toast('<ruby>線<rt>せん</rt></ruby>を けしたよ');
    }
  }

  var toastTimer = null;
  function toast(html) {
    var t = $('#hon-toast');
    if (!t) { return; }
    t.innerHTML = html;
    t.classList.add('is-on');
    clearTimeout(toastTimer);
    toastTimer = setTimeout(function () { t.classList.remove('is-on'); }, 2600);
  }

  /* ------------------------------------------------------------------
     「ここを 見て！」— 絵の その ぶぶんを 光らせる
     ------------------------------------------------------------------ */
  function clearLight() {
    if (!S) { return; }
    var stage = $('#hon-stage');
    if (stage) {
      stage.classList.remove('is-art');
      var svg = stage.querySelector('svg');
      if (svg) {
        svg.classList.remove('has-lit');
        $$('.is-lit', svg).forEach(function (e) { e.classList.remove('is-lit'); });
      }
    }
    var c = $('#hon-callout');
    if (c) { c.hidden = true; }
    $$('.js-hon-part', S.el).forEach(function (b) { b.setAttribute('aria-pressed', 'false'); });
    S.pin = null;
  }

  function light(chip) {
    var part = chip.getAttribute('data-part');
    if (S.pin === part) { clearLight(); return; }
    clearLight();
    var stage = $('#hon-stage');
    var svg = stage && stage.querySelector('svg');
    if (!svg) { return; }
    var els = $$('[data-part="' + part + '"]', svg);
    if (!els.length) { return; }
    stage.classList.add('is-art');               /* 写真の ときは えに かえて 光らせる */
    els.forEach(function (e) { e.classList.add('is-lit'); });
    svg.classList.add('has-lit');
    chip.setAttribute('aria-pressed', 'true');
    var c = $('#hon-callout');
    c.innerHTML = partName(part);
    c.hidden = false;
    S.pin = part;
    A.placeCallout(svg, els, c, stage);
    /* 1年生は 絵が 見えない ところで おす ことが ある。光った ところを 見せる */
    if (window.matchMedia && !window.matchMedia('(min-width: 900px)').matches) {
      stage.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
    }
  }

  function relight() {
    if (!S || !S.pin) { return; }
    var stage = $('#hon-stage'), svg = stage && stage.querySelector('svg');
    if (!svg) { return; }
    A.placeCallout(svg, $$('[data-part="' + S.pin + '"]', svg), $('#hon-callout'), stage);
  }

  /* ------------------------------------------------------------------
     こえで きく
     ------------------------------------------------------------------ */
  function speakSection(btn) {
    var sec = btn.closest('.hon__sec');
    if (!sec) { return; }
    /* ボタンの 文字まで 読まない ように、見出しと 文だけを あつめる */
    var box = document.createElement('div');
    box.appendChild($('.js-hon-h', sec).cloneNode(true));
    box.appendChild(document.createTextNode('。'));
    var p = $('.js-hon-p', sec).cloneNode(true);
    $$('.js-state', p).forEach(function (e) { e.parentNode.removeChild(e); });
    box.appendChild(p);
    A.speak(btn, box);
  }

  function stopAll() {
    if (A) { A.stopSpeech(); }
  }

  /* ------------------------------------------------------------------
     うけつけ
     ------------------------------------------------------------------ */
  function bind(el) {
    if (bound) { return; }
    bound = true;

    el.addEventListener('click', function (e) {
      if (!S) { return; }
      var t = e.target;
      var b;
      if ((b = t.closest('.js-pen'))) { setPen(b.getAttribute('data-pen')); return; }
      if (t.closest('.js-memo-open')) { openMemo(); return; }
      if (t.closest('.js-memo-close')) { closeMemo(); return; }
      if ((b = t.closest('.js-memo-del'))) {
        var key = b.getAttribute('data-key');
        delete S.marks[key];
        save();
        repaintKey(key);
        syncCount();
        $('#hon-memo-body').innerHTML = memoHTML();
        var first = $('.js-memo-del', S.el) || $('.js-memo-close', S.el);
        if (first) { first.focus(); }
        return;
      }
      if ((b = t.closest('.js-memo-clear'))) {
        /* 1年生が うっかり おしても 消えない ように、2かい おす */
        if (!b.classList.contains('is-armed')) {
          b.classList.add('is-armed');
          b.innerHTML = 'ほんとうに けす？ もう いちど おしてね';
          setTimeout(function () {
            if (b.isConnected && b.classList.contains('is-armed')) {
              b.classList.remove('is-armed');
              b.innerHTML = '🗑️ ぜんぶ けす';
            }
          }, 3500);
          return;
        }
        var keys = Object.keys(S.marks);
        S.marks = {};
        save();
        keys.forEach(repaintKey);
        syncCount();
        $('#hon-memo-body').innerHTML = memoHTML();
        return;
      }
      if (t.classList && t.classList.contains('hon-memo')) { closeMemo(); return; }   /* そとがわ */
      if ((b = t.closest('.js-hon-audio'))) { speakSection(b); return; }
      if ((b = t.closest('.js-hon-part'))) { light(b); return; }
      if (t.closest('a')) { return; }
      var hs = t.closest('.hs');
      if (hs && !t.closest('.hon-memo')) { mark(hs); }
    });

    el.addEventListener('keydown', function (e) {
      if (!S) { return; }
      if (e.key === 'Escape') {
        if (closeMemo()) { e.stopPropagation(); }
        return;
      }
      if (e.key !== 'Enter' && e.key !== ' ' && e.key !== 'Spacebar') { return; }
      var hs = e.target.classList && e.target.classList.contains('hs') ? e.target : null;
      if (!hs) { return; }
      e.preventDefault();
      mark(hs);
    });

    el.addEventListener('animationend', function (e) {
      if (e.target.classList) {
        e.target.classList.remove('is-new');
        e.target.classList.remove('is-nudge');
      }
    });

    window.addEventListener('resize', relight);
  }

  function mount(car, el) {
    A = window.jzApp;
    var d = dataOf(car.id);
    if (!d) { return false; }
    unmount();                                 /* ページを めくった ときも メモや 光りを のこさない */
    S = { car: car, d: d, el: el, pen: null, pin: null, marks: {} };
    S.marks = cleanMarks(d, loadMarks(car.id));
    el.innerHTML = pageHTML(car, d);
    bind(el);
    syncCount();
    return true;
  }

  function unmount() {
    if (!S) { return; }
    closeMemo();
    clearLight();
    document.body.classList.remove('is-memo-open');
    S = null;
  }

  window.jzHon = {
    has: function (id) { return !!dataOf(id); },
    mount: mount,
    unmount: unmount,
    count: function (id) { A = A || window.jzApp; return countMarks(id); },
    key: function (html) { A = A || window.jzApp; return hkey(html); }
  };
})();
