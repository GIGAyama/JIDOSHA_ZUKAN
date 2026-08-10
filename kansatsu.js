/* =========================================================================
   kansatsu.js — ものすごい かんさつ（ぜんがめんの かんさつしつ）

   じどう車の 絵は SVG（ベクター）なので、どれだけ 大きくしても ぼやけません。
   その とくちょうを つかって、「ものすごく よって 見る」ことが できる
   かんさつ画面を つくって います。

   ■ できること
     ・ゆびや マウスで、うごかす／大きくする（ピンチ・ホイール・ボタン・キー）
     ・絵の 上の ◯マークを おすと、そこへ カメラが とんで いって 光る
     ・その ぶぶんの 名まえと せつめい（parts-data.js）が 出る
     ・その 車の「③ つくり」の 文が あれば、いっしょに ならぶ
     ・ものさしを 出すと、1メートルの ますめと 1年生が ならんで 大きさが 分かる
     ・見た ぶぶんには ✓が つく。ぜんぶ 見つけると おいわいが 出る

   ■ しくみ（さわる ときの めやす）
     ・カメラ = SVG の viewBox。view（いま）→ target（いきたい ところ）へ
       まいフレーム すこしずつ 近づける（なめらかに 見える）
     ・◯マークは HTML の <button>。まいフレーム、SVG の ざひょうから
       がめんの ざひょうに なおして おく
   ========================================================================= */
(function () {
  'use strict';

  var MIN_ZOOM = 0.7;    /* これいじょう 小さくは しない */
  var MAX_ZOOM = 14;     /* これいじょう 大きくは しない */
  var LERP = 0.22;       /* カメラの なめらかさ（大きいほど はやく つく） */

  var $ = function (s, r) { return (r || document).querySelector(s); };
  var $$ = function (s, r) { return Array.prototype.slice.call((r || document).querySelectorAll(s)); };

  function plain(html) {
    var d = document.createElement('div');
    d.innerHTML = html;
    return d.textContent.replace(/\s+/g, ' ').trim();
  }

  function clamp(v, lo, hi) { return v < lo ? lo : (v > hi ? hi : v); }

  var reduced = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* ほぞん（app.js の ものを つかう。なければ この 場で つくる） */
  var store = window.jzStore || {
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

  var S = null;   /* いま ひらいて いる かんさつの じょうたい */

  /* ==================================================================
     がめんを くみたてる
     ================================================================== */

  function shell(car) {
    return '<div class="kz" id="kz">' +

      '<div class="kz__bar">' +
      '<button type="button" class="kz-btn kz-btn--back" id="kz-back">' +
      '<span aria-hidden="true">←</span> ずかんに もどる</button>' +
      '<h2 class="kz__title">' + car.name +
      '<span class="kz__len" id="kz-len"></span></h2>' +
      '<span class="kz__count" id="kz-count"></span>' +
      '<button type="button" class="kz-btn" id="kz-ruler" aria-pressed="false">' +
      '📏 ものさし</button>' +
      '<button type="button" class="kz-btn" id="kz-full">⛶ ぜんがめん</button>' +
      '</div>' +

      '<div class="kz__main" id="kz-main">' +
      '<div class="kz__stage" id="kz-stage"></div>' +
      '<div class="kz__marks" id="kz-marks"></div>' +
      '<p class="kz__hint" id="kz-hint">' +
      'ゆびで ひろげると <b>ものすごく 大きく</b> なります。' +
      'ひかる <b>◯</b>を おすと、その ぶぶんに とんで いきます。</p>' +
      '<div class="kz__zoom">' +
      '<button type="button" class="kz-zbtn" id="kz-out" aria-label="小さくする">−</button>' +
      '<input type="range" id="kz-range" min="0" max="1000" value="0" ' +
      'aria-label="大きさを かえる">' +
      '<button type="button" class="kz-zbtn" id="kz-in" aria-label="大きくする">＋</button>' +
      '<span class="kz-zoomval" id="kz-zval">×1.0</span>' +
      '<button type="button" class="kz-zbtn" id="kz-reset" aria-label="もとの 大きさに もどす">⟲</button>' +
      '</div>' +
      '</div>' +

      '<div class="kz__rail" id="kz-rail" aria-label="ぶぶんを えらぶ"></div>' +
      '</div>';
  }

  /* ==================================================================
     カメラ（SVG の viewBox）
     ================================================================== */

  function stageRect() { return S.stage.getBoundingClientRect(); }

  /* いまの ばい率（1.0 = ぜんたいが ちょうど 入る 大きさ） */
  function zoom() { return S.fitW / S.view.w; }

  function applyView() {
    var r = stageRect();
    if (!r.width || !r.height) return;
    var h = S.view.w * r.height / r.width;
    S.svg.setAttribute('viewBox',
      (S.view.cx - S.view.w / 2) + ' ' + (S.view.cy - h / 2) + ' ' + S.view.w + ' ' + h);

    /* ものさしの 文字と 線は、がめんの 上では いつも おなじ 大きさに 見せる
       （1ピクセル = S.view.w / stage の はば） */
    if (S.rulerG) {
      var px = S.view.w / r.width;
      S.rulerG.setAttribute('font-size', (18 * px).toFixed(2));
      S.rulerG.setAttribute('stroke-width', (3 * px).toFixed(2));
    }
    placeMarks(r);
    updateZoomUI();
  }

  /* ぜんたいが 入る 大きさを 計算する */
  function computeFit() {
    var r = stageRect();
    var b = S.bounds;
    if (!r.width || !r.height) { S.fitW = b.w; return; }
    var stageAspect = r.width / r.height;
    var w = b.w;
    if (b.w / b.h < stageAspect) { w = b.h * stageAspect; }
    S.fitW = w * 1.04;                       /* すこし よゆうを もたせる */
  }

  function fitAll(instant) {
    computeFit();
    var b = S.bounds;
    setTarget(b.x + b.w / 2, b.y + b.h / 2, S.fitW, instant);
  }

  function setTarget(cx, cy, w, instant) {
    var b = S.bounds;
    w = clamp(w, S.fitW / MAX_ZOOM, S.fitW / MIN_ZOOM);
    var r = stageRect();
    var h = w * (r.height || 1) / (r.width || 1);
    /* 車が がめんの そとへ 出て いって しまわない ように する */
    var mx = w * 0.35, my = h * 0.35;
    S.target.cx = clamp(cx, b.x - mx, b.x + b.w + mx);
    S.target.cy = clamp(cy, b.y - my, b.y + b.h + my);
    S.target.w = w;
    if (instant || reduced) {
      S.view.cx = S.target.cx; S.view.cy = S.target.cy; S.view.w = S.target.w;
      applyView();
    }
    S.moving = true;
    kick();
  }

  /* がめんの ある 点を うごかさない まま、大きさだけ かえる */
  function zoomAt(px, py, factor) {
    var r = stageRect();
    if (!r.width) return;
    var w = clamp(S.view.w / factor, S.fitW / MAX_ZOOM, S.fitW / MIN_ZOOM);
    var scale = r.width / S.view.w;
    var ux = S.view.cx - S.view.w / 2 + (px - r.left) / scale;
    var h = S.view.w * r.height / r.width;
    var uy = S.view.cy - h / 2 + (py - r.top) / scale;
    var k = w / S.view.w;
    setTarget(ux + (S.view.cx - ux) * k, uy + (S.view.cy - uy) * k, w, true);
  }

  function tick() {
    if (!S) return;
    S.raf = 0;
    var v = S.view, t = S.target;
    var dx = t.cx - v.cx, dy = t.cy - v.cy, dw = t.w - v.w;
    var near = Math.abs(dw) < S.fitW * 0.0005 &&
      Math.abs(dx) < S.fitW * 0.0008 && Math.abs(dy) < S.fitW * 0.0008;
    if (near) {
      v.cx = t.cx; v.cy = t.cy; v.w = t.w;
      S.moving = false;
      applyView();
      return;
    }
    v.cx += dx * LERP; v.cy += dy * LERP; v.w += dw * LERP;
    applyView();
    kick();
  }

  function kick() {
    if (!S || S.raf) return;
    S.raf = window.requestAnimationFrame(tick);
  }

  function updateZoomUI() {
    var z = zoom();
    S.zval.textContent = '×' + (z < 10 ? z.toFixed(1) : Math.round(z));
    if (document.activeElement !== S.range) {
      var t = (Math.log(z / MIN_ZOOM) / Math.log(MAX_ZOOM / MIN_ZOOM)) * 1000;
      S.range.value = String(clamp(Math.round(t), 0, 1000));
    }
  }

  /* ==================================================================
     ぶぶん（ホットスポット）を さがす
     ================================================================== */

  /* がめんの しかくを SVG の ざひょうに なおす */
  function toUser(rect, sr) {
    var scale = sr.width / S.view.w;
    var h = S.view.w * sr.height / sr.width;
    var x0 = S.view.cx - S.view.w / 2, y0 = S.view.cy - h / 2;
    return {
      x: x0 + (rect.left - sr.left) / scale,
      y: y0 + (rect.top - sr.top) / scale,
      w: rect.width / scale,
      h: rect.height / scale
    };
  }

  function findParts(car) {
    var sr = stageRect();
    var seen = {}, keys = [];
    $$('[data-part]', S.svg).forEach(function (el) {
      var k = el.getAttribute('data-part');
      if (!seen[k]) { seen[k] = []; keys.push(k); }
      seen[k].push(el);
    });

    var list = keys.map(function (k) {
      var minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
      seen[k].forEach(function (el) {
        var r = el.getBoundingClientRect();
        if (!r.width && !r.height) return;
        var u = toUser(r, sr);
        minX = Math.min(minX, u.x); minY = Math.min(minY, u.y);
        maxX = Math.max(maxX, u.x + u.w); maxY = Math.max(maxY, u.y + u.h);
      });
      if (!isFinite(minX)) return null;

      var info = (window.partInfo || {})[k] || {};
      var own = null;
      (car.tsukuri || []).forEach(function (t) { if (t.part === k) { own = t; } });

      return {
        key: k,
        name: (own && own.label) || info.name || k,
        text: info.text || '',
        tsukuri: own,
        box: { x: minX, y: minY, w: maxX - minX, h: maxY - minY },
        mx: (minX + maxX) / 2,
        my: (minY + maxY) / 2
      };
    }).filter(Boolean);

    /* ならびじゅん … ①②は ずかんの 本文（つくり）に 出て くる ぶぶん、
       そのあとは 左から じゅんばんに */
    var order = (car.tsukuri || []).map(function (t) { return t.part; });
    list.sort(function (a, b) {
      var ia = order.indexOf(a.key), ib = order.indexOf(b.key);
      if (ia >= 0 || ib >= 0) {
        if (ia < 0) return 1;
        if (ib < 0) return -1;
        return ia - ib;
      }
      return a.mx - b.mx;
    });

    spreadMarks(list);
    return list;
  }

  /* ◯マークが かさならない ように、すこしずつ はなす */
  function spreadMarks(list) {
    var min = Math.max(26, S.bounds.w * 0.09);
    for (var pass = 0; pass < 60; pass++) {
      var moved = false;
      for (var i = 0; i < list.length; i++) {
        for (var j = i + 1; j < list.length; j++) {
          var a = list[i], b = list[j];
          var dx = b.mx - a.mx, dy = b.my - a.my;
          var d = Math.sqrt(dx * dx + dy * dy) || 0.01;
          if (d < min) {
            var push = (min - d) / 2;
            var ux = dx / d, uy = dy / d;
            a.mx -= ux * push; a.my -= uy * push;
            b.mx += ux * push; b.my += uy * push;
            moved = true;
          }
        }
      }
      if (!moved) break;
    }
    /* はなした あとも、その ぶぶんの すぐ そばに あるように もどす */
    list.forEach(function (p) {
      p.mx = clamp(p.mx, p.box.x - p.box.w * 0.35, p.box.x + p.box.w * 1.35);
      p.my = clamp(p.my, p.box.y - p.box.h * 0.9, p.box.y + p.box.h * 1.25);
    });
  }

  function placeMarks(r) {
    if (!S.parts.length) return;
    r = r || stageRect();
    if (!r.width) return;
    var scale = r.width / S.view.w;
    var h = S.view.w * r.height / r.width;
    var x0 = S.view.cx - S.view.w / 2, y0 = S.view.cy - h / 2;
    S.parts.forEach(function (p, i) {
      var el = S.markEls[i];
      if (!el) return;
      el.style.transform = 'translate(' +
        Math.round((p.mx - x0) * scale) + 'px,' + Math.round((p.my - y0) * scale) + 'px)';
    });
  }

  /* ==================================================================
     ◯マークと リストを つくる
     ================================================================== */

  function buildMarks() {
    S.marks.innerHTML = S.parts.map(function (p, i) {
      return '<button type="button" class="kz-mark" data-i="' + i + '" ' +
        'aria-label="' + plain(p.name) + 'を 見る">' + (i + 1) + '</button>';
    }).join('');
    S.markEls = $$('.kz-mark', S.marks);
    syncFound();
    placeMarks();
  }

  /* その ぶぶんだけを きりとった、ちいさい 絵を つくる */
  function cropSVG(part, pad) {
    var clone = S.svg.cloneNode(true);
    var b = part.box;
    var m = Math.max(b.w, b.h) * (pad === undefined ? 0.28 : pad) + 6;
    clone.setAttribute('viewBox',
      (b.x - m) + ' ' + (b.y - m) + ' ' + (b.w + m * 2) + ' ' + (b.h + m * 2));
    clone.setAttribute('preserveAspectRatio', 'xMidYMid meet');
    clone.classList.add('has-lit');
    var g = clone.querySelector('.kz-ruler');
    if (g) { g.remove(); }
    $$('[data-part="' + part.key + '"]', clone).forEach(function (e) {
      e.classList.add('is-lit');
    });
    return clone.outerHTML;
  }

  function buildRail() {
    S.rail.innerHTML = S.parts.map(function (p, i) {
      return '<button type="button" class="kz-chip" data-i="' + i + '">' +
        '<span class="kz-chip__pic">' + cropSVG(p, 0.3) + '</span>' +
        '<span class="kz-chip__n">' + (i + 1) + '</span>' +
        '<span class="kz-chip__name">' + p.name + '</span>' +
        '</button>';
    }).join('');
    S.chipEls = $$('.kz-chip', S.rail);
  }

  /* ==================================================================
     ぶぶんを えらぶ
     ================================================================== */

  function focusShift(r) {
    /* せつめいパネルの ぶんだけ、カメラの まん中を ずらす */
    var panel = $('#kz-panel');
    if (!panel) return { x: 0, y: 0 };
    var pr = panel.getBoundingClientRect();
    if (window.innerWidth > 760) { return { x: (pr.width + 28) / 2, y: 0 }; }
    return { x: 0, y: (pr.height + 16) / 2 };
  }

  function select(i) {
    var p = S.parts[i];
    if (!p) return;
    if (S.sel === i) { deselect(); return; }
    S.sel = i;

    $$('.is-lit', S.svg).forEach(function (e) { e.classList.remove('is-lit'); });
    S.svg.classList.add('has-lit');
    $$('[data-part="' + p.key + '"]', S.svg).forEach(function (e) { e.classList.add('is-lit'); });

    S.marks.classList.add('has-on');
    S.markEls.forEach(function (el, n) { el.classList.toggle('is-on', n === i); });
    S.chipEls.forEach(function (el, n) { el.classList.toggle('is-on', n === i); });
    var chip = S.chipEls[i];
    if (chip && chip.scrollIntoView) {
      chip.scrollIntoView({ block: 'nearest', inline: 'center', behavior: reduced ? 'auto' : 'smooth' });
    }

    hideHint();
    showPanel(p, i);
    markFound(p.key);

    /* カメラを その ぶぶんへ とばす */
    var r = stageRect();
    var b = p.box;
    var pad = Math.max(b.w, b.h) * 0.45 + 6;
    var need = Math.max(b.w + pad * 2, (b.h + pad * 2) * (r.width / r.height));
    var w = clamp(need, S.fitW / 9, S.fitW * 0.9);
    var scale = r.width / w;
    var sh = focusShift(r);
    setTarget(b.x + b.w / 2 + sh.x / scale, b.y + b.h / 2 + sh.y / scale, w);
  }

  function deselect() {
    S.sel = -1;
    S.svg.classList.remove('has-lit');
    $$('.is-lit', S.svg).forEach(function (e) { e.classList.remove('is-lit'); });
    S.marks.classList.remove('has-on');
    S.markEls.forEach(function (el) { el.classList.remove('is-on'); });
    S.chipEls.forEach(function (el) { el.classList.remove('is-on'); });
    var panel = $('#kz-panel');
    if (panel) { panel.remove(); }
    S.main.classList.remove('has-panel');
    stopSpeech();
  }

  function showPanel(p, i) {
    var old = $('#kz-panel');
    if (old) { old.remove(); }

    var tsu = '';
    if (p.tsukuri) {
      tsu = '<div class="kz__tsukuri">' +
        '<span class="kz__tag">③ つくり</span><br>' +
        '<span class="js-read">' + p.tsukuri.text + '</span></div>';
    }

    var html = '<aside class="kz__panel" id="kz-panel" aria-live="polite">' +
      '<div class="kz__panel-head">' +
      '<span class="kz__panel-n">' + (i + 1) + '</span>' +
      '<h3 class="kz__panel-name">' + p.name + '</h3>' +
      '<button type="button" class="kz__panel-close" id="kz-pclose" aria-label="とじる">✕</button>' +
      '</div>' +
      '<div class="kz__thumb">' + cropSVG(p, 0.22) + '</div>' +
      tsu +
      (p.text ? '<p class="kz__panel-text js-read">' + p.text + '</p>' : '') +
      '<div class="kz__panel-foot">' +
      '<button type="button" class="btn btn--audio" id="kz-say" ' +
      'data-label="🔊 こえで きく">🔊 こえで きく</button>' +
      '<button type="button" class="btn btn--audio" id="kz-next">つぎの ぶぶん →</button>' +
      '</div>' +
      '</aside>';

    S.main.insertAdjacentHTML('beforeend', html);
    S.main.classList.add('has-panel');
  }

  /* ==================================================================
     みつけた しるし
     ================================================================== */

  function foundKey() { return 'kz.' + S.car.id; }

  function markFound(key) {
    if (S.found.indexOf(key) >= 0) { return; }
    S.found.push(key);
    store.set(foundKey(), S.found);
    syncFound();
    if (S.found.length >= S.parts.length) { celebrate(); }
  }

  function syncFound() {
    var n = 0;
    S.parts.forEach(function (p, i) {
      var on = S.found.indexOf(p.key) >= 0;
      if (on) { n++; }
      if (S.markEls[i]) { S.markEls[i].classList.toggle('is-found', on); }
      if (S.chipEls && S.chipEls[i]) { S.chipEls[i].classList.toggle('is-found', on); }
    });
    var all = n >= S.parts.length && S.parts.length > 0;
    S.count.innerHTML = all
      ? '🎉 ぜんぶ みつけた！'
      : 'みつけた ' + n + ' / ' + S.parts.length;
    S.count.classList.toggle('is-done', all);
  }

  function celebrate() {
    if (S.celebrated) return;
    S.celebrated = true;
    var html = '<div class="kz__done" id="kz-done">' +
      '<div class="kz__done-card">' +
      '<h2>🎉 ぜんぶ みつけた！</h2>' +
      '<p>' + S.car.name + 'の ぶぶんを ' + S.parts.length + 'こ ぜんぶ かんさつ しました。<br>' +
      'どの ぶぶんが いちばん おどろいたか、ずかんに かいて みよう。</p>' +
      '<button type="button" class="btn" id="kz-done-stay">もっと かんさつ する</button> ' +
      '<button type="button" class="btn btn--next" id="kz-done-go">✏️ ずかんに かく</button>' +
      '</div></div>';
    S.main.insertAdjacentHTML('beforeend', html);
  }

  /* ==================================================================
     ものさし（1メートルの ますめ・1年生）
     ================================================================== */

  function buildRuler() {
    var g = S.base, M = window.carArt.METER;
    var L = g.x + 16, W = g.w - 32;           /* 車の 左はしと はば */
    var ground = g.y + g.h - 20;              /* じめんの line */
    var top = ground - (g.h - 40);
    var mW = W / M, mH = (ground - top) / M;

    var grid = '';
    for (var i = 0; i <= Math.ceil(mW) + 1; i++) {
      var x = L + i * M;
      grid += '<line x1="' + x + '" y1="' + (ground - Math.ceil(mH + 1) * M) +
        '" x2="' + x + '" y2="' + ground + '"/>';
    }
    for (var j = 0; j <= Math.ceil(mH) + 1; j++) {
      var y = ground - j * M;
      grid += '<line x1="' + (L - M * 1.6) + '" y1="' + y +
        '" x2="' + (L + (Math.ceil(mW) + 1) * M) + '" y2="' + y + '"/>';
    }

    var by = ground + 30;
    var len = Math.round(W / M * 10) / 10;
    var hgt = Math.round((ground - top) / M * 10) / 10;

    var ruler =
      '<line x1="' + L + '" y1="' + by + '" x2="' + (L + W) + '" y2="' + by + '"/>' +
      '<line x1="' + L + '" y1="' + (by - 7) + '" x2="' + L + '" y2="' + (by + 7) + '"/>' +
      '<line x1="' + (L + W) + '" y1="' + (by - 7) + '" x2="' + (L + W) + '" y2="' + (by + 7) + '"/>' +
      '<text x="' + (L + W / 2) + '" y="' + (by - 10) + '">よこ やく ' + len + 'メートル</text>' +
      '<line x1="' + (L - 22) + '" y1="' + ground + '" x2="' + (L - 22) + '" y2="' + top + '"/>' +
      '<line x1="' + (L - 29) + '" y1="' + ground + '" x2="' + (L - 15) + '" y2="' + ground + '"/>' +
      '<line x1="' + (L - 29) + '" y1="' + top + '" x2="' + (L - 15) + '" y2="' + top + '"/>' +
      '<text x="' + (L - 22) + '" y="' + (top - 10) + '">たかさ やく ' + hgt + 'メートル</text>';

    /* おなじ しゅくしゃくの 1年生（せの たかさ やく 1.2メートル） */
    var px = L - M * 1.05, ph = M * 1.2, pt = ground - ph;
    var person = '<g class="kz-person" stroke="#9fc3ef" fill="none" ' +
      'stroke-width="3.2" stroke-linecap="round">' +
      '<circle cx="' + px + '" cy="' + (pt + 5) + '" r="5.2" fill="#9fc3ef" stroke="none"/>' +
      '<line x1="' + px + '" y1="' + (pt + 11) + '" x2="' + px + '" y2="' + (ground - 13) + '"/>' +
      '<line x1="' + (px - 6) + '" y1="' + (ground - 19) + '" x2="' + px + '" y2="' + (ground - 24) + '"/>' +
      '<line x1="' + (px + 6) + '" y1="' + (ground - 19) + '" x2="' + px + '" y2="' + (ground - 24) + '"/>' +
      '<line x1="' + (px - 5) + '" y1="' + ground + '" x2="' + px + '" y2="' + (ground - 13) + '"/>' +
      '<line x1="' + (px + 5) + '" y1="' + ground + '" x2="' + px + '" y2="' + (ground - 13) + '"/>' +
      '<text x="' + px + '" y="' + (pt - 7) + '" fill="#9fc3ef" stroke="none" ' +
      'font-size="7.5" text-anchor="middle">1ねんせい</text>' +
      '</g>';

    var wrap = document.createElementNS('http://www.w3.org/2000/svg', 'g');
    wrap.setAttribute('class', 'kz-ruler');
    wrap.setAttribute('font-size', '15');
    wrap.setAttribute('stroke-width', '3');
    wrap.innerHTML = '<g class="kz-grid" stroke-width="1">' + grid + '</g>' + ruler + person;
    S.svg.appendChild(wrap);
    S.rulerG = wrap;

    /* ものさしの ぶんだけ、うつす はんいを ひろげる */
    var c = S.content;
    var x1 = Math.min(c.x, px - M * 0.8);
    var y1 = Math.min(c.y, top - 30);
    var x2 = Math.max(c.x + c.w, L + W + 10);
    var y2 = Math.max(c.y + c.h, by + 14);
    S.bounds = { x: x1, y: y1, w: x2 - x1, h: y2 - y1 };
  }

  function toggleRuler() {
    if (S.rulerG) {
      S.rulerG.remove();
      S.rulerG = null;
      S.bounds = { x: S.content.x, y: S.content.y, w: S.content.w, h: S.content.h };
      S.rulerBtn.classList.remove('is-on');
      S.rulerBtn.setAttribute('aria-pressed', 'false');
    } else {
      buildRuler();
      S.rulerBtn.classList.add('is-on');
      S.rulerBtn.setAttribute('aria-pressed', 'true');
      deselect();
    }
    fitAll(false);
  }

  /* ==================================================================
     こえで きく
     ================================================================== */

  function stopSpeech() {
    if (window.jzSpeech) { window.jzSpeech.stop(); }
    else if (window.speechSynthesis) { window.speechSynthesis.cancel(); }
  }

  function sayPanel(btn) {
    var panel = $('#kz-panel');
    if (!panel) return;
    if (window.jzSpeech) {
      /* パネルの 文を まとめて よむ */
      var box = document.createElement('div');
      $$('.js-read', panel).forEach(function (e) { box.appendChild(e.cloneNode(true)); });
      window.jzSpeech.speak(btn, box);
    }
  }

  /* ==================================================================
     さわる／おす
     ================================================================== */

  function bind() {
    var pointers = {};
    var last = null, pinch = null, movedFar = false;

    S.stage.addEventListener('pointerdown', function (e) {
      pointers[e.pointerId] = { x: e.clientX, y: e.clientY };
      var ids = Object.keys(pointers);
      movedFar = false;
      if (ids.length === 1) {
        last = { x: e.clientX, y: e.clientY };
        S.stage.setPointerCapture(e.pointerId);
        S.stage.classList.add('is-grabbing');
      } else if (ids.length === 2) {
        pinch = pinchState(pointers);
        last = null;
      }
    });

    S.stage.addEventListener('pointermove', function (e) {
      if (!pointers[e.pointerId]) return;
      pointers[e.pointerId] = { x: e.clientX, y: e.clientY };
      var ids = Object.keys(pointers);
      var r = stageRect();
      if (!r.width) return;

      if (ids.length >= 2 && pinch) {
        var now = pinchState(pointers);
        var f = now.d / (pinch.d || 1);
        zoomAt(now.x, now.y, f);
        /* ゆびの まん中が うごいた ぶんだけ、いっしょに うごかす */
        var scale = r.width / S.view.w;
        panBy((now.x - pinch.x) / scale, (now.y - pinch.y) / scale);
        pinch = now;
        movedFar = true;
        return;
      }
      if (ids.length === 1 && last) {
        var scale2 = r.width / S.view.w;
        var dx = (e.clientX - last.x) / scale2;
        var dy = (e.clientY - last.y) / scale2;
        if (Math.abs(e.clientX - last.x) + Math.abs(e.clientY - last.y) > 3) { movedFar = true; }
        panBy(dx, dy);
        last = { x: e.clientX, y: e.clientY };
      }
    });

    function end(e) {
      delete pointers[e.pointerId];
      var ids = Object.keys(pointers);
      if (ids.length < 2) { pinch = null; }
      if (ids.length === 1) { last = pointers[ids[0]]; }
      if (!ids.length) {
        last = null;
        S.stage.classList.remove('is-grabbing');
        if (!movedFar) { hideHint(); }
      }
    }
    S.stage.addEventListener('pointerup', end);
    S.stage.addEventListener('pointercancel', end);

    S.stage.addEventListener('wheel', function (e) {
      e.preventDefault();
      zoomAt(e.clientX, e.clientY, Math.exp(-e.deltaY * 0.0022));
      hideHint();
    }, { passive: false });

    S.stage.addEventListener('dblclick', function (e) {
      zoomAt(e.clientX, e.clientY, 2);
    });

    /* ◯マーク */
    S.marks.addEventListener('click', function (e) {
      var m = e.target.closest('.kz-mark');
      if (m) { select(Number(m.getAttribute('data-i'))); }
    });

    /* ぶぶんの リスト */
    S.rail.addEventListener('click', function (e) {
      var c = e.target.closest('.kz-chip');
      if (c) { select(Number(c.getAttribute('data-i'))); }
    });

    /* パネルの なかの ボタン */
    S.main.addEventListener('click', function (e) {
      if (e.target.closest('#kz-pclose')) { deselect(); return; }
      if (e.target.closest('#kz-say')) { sayPanel(e.target.closest('#kz-say')); return; }
      if (e.target.closest('#kz-next')) {
        select((S.sel + 1) % S.parts.length);
        return;
      }
      if (e.target.closest('#kz-done-stay')) { $('#kz-done').remove(); return; }
      if (e.target.closest('#kz-done-go')) {
        location.hash = '#/car/' + S.car.id;
        return;
      }
    });

    /* ズームの バー */
    $('#kz-in').addEventListener('click', function () { hideHint(); zoomCenter(1.7); });
    $('#kz-out').addEventListener('click', function () { hideHint(); zoomCenter(1 / 1.7); });
    $('#kz-reset').addEventListener('click', function () { deselect(); fitAll(false); });
    S.range.addEventListener('input', function () {
      var t = Number(S.range.value) / 1000;
      var z = MIN_ZOOM * Math.pow(MAX_ZOOM / MIN_ZOOM, t);
      setTarget(S.view.cx, S.view.cy, S.fitW / z);
    });

    S.rulerBtn.addEventListener('click', toggleRuler);
    $('#kz-back').addEventListener('click', function () { location.hash = '#/car/' + S.car.id; });
    $('#kz-full').addEventListener('click', toggleFull);

    /* キーボード */
    S.onKey = function (e) {
      var tag = (e.target.tagName || '').toLowerCase();
      if (tag === 'input' || tag === 'textarea') return;
      var step = S.view.w * 0.12;
      if (e.key === 'ArrowLeft') { panBy(step, 0); e.preventDefault(); }
      else if (e.key === 'ArrowRight') { panBy(-step, 0); e.preventDefault(); }
      else if (e.key === 'ArrowUp') { panBy(0, step); e.preventDefault(); }
      else if (e.key === 'ArrowDown') { panBy(0, -step); e.preventDefault(); }
      else if (e.key === '+' || e.key === '=') { zoomCenter(1.7); }
      else if (e.key === '-') { zoomCenter(1 / 1.7); }
      else if (e.key === '0') { fitAll(false); }
      else if (e.key === 'Escape') {
        if (S.sel >= 0) { deselect(); }
        else { location.hash = '#/car/' + S.car.id; }
      }
    };
    document.addEventListener('keydown', S.onKey);

    S.onResize = function () {
      computeFit();
      setTarget(S.view.cx, S.view.cy, S.view.w, true);
    };
    window.addEventListener('resize', S.onResize);
  }

  function pinchState(pointers) {
    var ids = Object.keys(pointers);
    var a = pointers[ids[0]], b = pointers[ids[1]];
    var dx = b.x - a.x, dy = b.y - a.y;
    return { d: Math.sqrt(dx * dx + dy * dy), x: (a.x + b.x) / 2, y: (a.y + b.y) / 2 };
  }

  function panBy(dx, dy) {
    S.view.cx -= dx; S.view.cy -= dy;
    setTarget(S.view.cx, S.view.cy, S.view.w, true);
  }

  function zoomCenter(f) {
    var r = stageRect();
    zoomAt(r.left + r.width / 2, r.top + r.height / 2, f);
  }

  function toggleFull() {
    var el = $('#kz');
    if (!el) return;
    if (document.fullscreenElement) {
      if (document.exitFullscreen) { document.exitFullscreen(); }
    } else if (el.requestFullscreen) {
      el.requestFullscreen().catch(function () { });
    }
  }

  function hideHint() {
    var h = $('#kz-hint');
    if (h) { h.remove(); }
  }

  /* ==================================================================
     ひらく・とじる
     ================================================================== */

  function mount(car, hostEl) {
    unmount();
    hostEl.innerHTML = shell(car);

    S = {
      car: car,
      host: hostEl,
      main: $('#kz-main'),
      stage: $('#kz-stage'),
      marks: $('#kz-marks'),
      rail: $('#kz-rail'),
      count: $('#kz-count'),
      range: $('#kz-range'),
      zval: $('#kz-zval'),
      rulerBtn: $('#kz-ruler'),
      parts: [], markEls: [], chipEls: [],
      sel: -1, raf: 0, moving: false, rulerG: null, celebrated: false,
      found: []
    };
    var saved = store.get('kz.' + car.id, []);
    S.found = Array.isArray(saved) ? saved : [];

    /* 絵は かならず イラスト（SVG）を つかう。写真では ぶぶんを 光らせられない */
    S.stage.innerHTML = window.carArt.svg(car.art, 'fit');
    S.svg = S.stage.querySelector('svg');
    if (!S.svg) { return; }
    S.svg.removeAttribute('role');
    S.svg.setAttribute('aria-hidden', 'true');   /* 中みは ◯マークで よめる */

    var vb = (S.svg.getAttribute('viewBox') || '0 0 400 220').split(/\s+/).map(Number);
    S.base = { x: vb[0], y: vb[1], w: vb[2], h: vb[3] };

    /* じっさいに かかれて いる はんい（うでを 上げた クレーンなど、
       きめられた わくより 外へ はみ出す 車が あるので はかりなおす） */
    S.content = { x: S.base.x, y: S.base.y, w: S.base.w, h: S.base.h };
    try {
      var bb = S.svg.getBBox();
      if (bb && bb.width && bb.height) {
        var x1 = Math.min(S.base.x, bb.x - 8);
        var y1 = Math.min(S.base.y, bb.y - 8);
        var x2 = Math.max(S.base.x + S.base.w, bb.x + bb.width + 8);
        var y2 = Math.max(S.base.y + S.base.h, bb.y + bb.height + 8);
        S.content = { x: x1, y: y1, w: x2 - x1, h: y2 - y1 };
      }
    } catch (e) { /* はかれない ときは きめられた わくの まま */ }
    S.bounds = { x: S.content.x, y: S.content.y, w: S.content.w, h: S.content.h };

    computeFit();
    S.view = { cx: S.base.x + S.base.w / 2, cy: S.base.y + S.base.h / 2, w: S.fitW * 1.35 };
    S.target = { cx: S.view.cx, cy: S.view.cy, w: S.view.w };
    applyView();

    var len = window.carArt.size(car.art);
    if (len) {
      var m = Math.round(len.w / window.carArt.METER * 10) / 10;
      $('#kz-len').textContent = 'ながさ やく ' + m + 'メートル';
    }

    document.body.classList.add('kz-open');
    bind();

    /* レイアウトが おちついてから、ぶぶんの ばしょを はかる */
    window.requestAnimationFrame(function () {
      if (!S) return;
      S.parts = findParts(car);
      buildMarks();
      buildRail();
      syncFound();
      fitAll(false);            /* すこし よってから、すっと ぜんたいへ */
    });
  }

  function unmount() {
    if (!S) { document.body.classList.remove('kz-open'); return; }
    stopSpeech();
    if (S.raf) { window.cancelAnimationFrame(S.raf); }
    document.removeEventListener('keydown', S.onKey);
    window.removeEventListener('resize', S.onResize);
    if (document.fullscreenElement && document.exitFullscreen) {
      document.exitFullscreen().catch(function () { });
    }
    if (S.host) { S.host.innerHTML = ''; }
    document.body.classList.remove('kz-open');
    S = null;
  }

  window.kansatsu = { mount: mount, unmount: unmount };
})();
