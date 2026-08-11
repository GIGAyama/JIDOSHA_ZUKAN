/* =========================================================================
   kansatsu3d.js — ものすごい かんさつ（3D版）

   ・kansatsu.js（SVG版）と 同じ 見ため・同じ そうさ・同じ 保存キー（kz.<id>）
   ・ちがうのは「まわせる」こと。◯印は 車を まわしても ついてきて、
     うら がわに 行くと きえます。
   ・3Dモデルの ない 車では 出て きません（app.js が SVG版に まわします）
   ========================================================================= */

(function () {
  'use strict';

  var $ = function (s, r) { return (r || document).querySelector(s); };
  var $$ = function (s, r) { return Array.prototype.slice.call((r || document).querySelectorAll(s)); };

  function plain(html) {
    var d = document.createElement('div');
    d.innerHTML = html;
    return d.textContent.replace(/\s+/g, ' ').trim();
  }

  var store = {
    get: function (k, def) {
      try { var v = localStorage.getItem(k); return v === null ? def : JSON.parse(v); }
      catch (e) { return def; }
    },
    set: function (k, v) { try { localStorage.setItem(k, JSON.stringify(v)); } catch (e) { } }
  };

  var S = null;

  /* ==================================================================
     わく（kansatsu.css を そのまま つかう）
     ================================================================== */

  function shell(car) {
    return '<div class="kz kz--3d" id="kz">' +

      '<div class="kz__bar">' +
      '<button type="button" class="kz-btn kz-btn--back" id="kz-back">' +
      '<span aria-hidden="true">←</span> ずかんに もどる</button>' +
      '<h2 class="kz__title">' + car.name +
      '<span class="kz__len" id="kz-len"></span></h2>' +
      '<span class="kz__count" id="kz-count"></span>' +
      '<button type="button" class="kz-btn" id="kz-ruler" aria-pressed="false">📏 ものさし</button>' +
      '<button type="button" class="kz-btn" id="kz-full">⛶ ぜんがめん</button>' +
      '</div>' +

      '<div class="kz__main" id="kz-main">' +
      '<div class="kz__stage" id="kz-stage"></div>' +
      '<div class="kz__marks" id="kz-marks"></div>' +
      '<p class="kz__hint" id="kz-hint">' +
      'ゆびで <b>ドラッグ</b>すると 車が まわります。ひろげると 大きく なります。' +
      'ひかる <b>◯</b>を おすと、その ぶぶんに とんで いきます。</p>' +
      '<div class="kz__zoom">' +
      '<button type="button" class="kz-zbtn" id="kz-out" aria-label="小さくする">−</button>' +
      '<input type="range" id="kz-range" min="0" max="1000" value="0" aria-label="大きさを かえる">' +
      '<button type="button" class="kz-zbtn" id="kz-in" aria-label="大きくする">＋</button>' +
      '<span class="kz-zoomval" id="kz-zval">×1.0</span>' +
      '<button type="button" class="kz-zbtn" id="kz-reset" aria-label="もとの 大きさに もどす">⟲</button>' +
      '</div>' +
      '<div class="kz__turn" id="kz-turn"></div>' +
      '</div>' +

      '<div class="kz__rail" id="kz-rail" aria-label="ぶぶんを えらぶ"></div>' +
      '</div>';
  }

  /* ==================================================================
     ぶぶんの 一らん（SVG版と 同じ ならびかた）
     ================================================================== */

  function collectParts(car, viewer) {
    var info = window.partInfo || {};
    var keys = viewer.parts();
    var list = keys.map(function (k) {
      var own = null;
      (car.tsukuri || []).forEach(function (t) { if (t.part === k) { own = t; } });
      var d = info[k] || {};
      return { key: k, name: d.name || k, text: d.text || '', tsukuri: own };
    });
    /* ③つくりで せつめいする ぶぶんを さきに、あとは 名まえ順 */
    var order = (car.tsukuri || []).map(function (t) { return t.part; });
    list.sort(function (a, b) {
      var ia = order.indexOf(a.key), ib = order.indexOf(b.key);
      if (ia >= 0 && ib >= 0) return ia - ib;
      if (ia >= 0) return -1;
      if (ib >= 0) return 1;
      return a.key < b.key ? -1 : 1;
    });
    return list;
  }

  /* その ぶぶんだけを きりとった ちいさい 絵（SVGイラストから 借りる）*/
  function cropSVG(car, key) {
    if (!window.carArt || !window.carArt.has || !window.carArt.has(car.art)) return '';
    var host = document.createElement('div');
    host.style.cssText = 'position:absolute;left:-9999px;top:0;width:400px;height:300px';
    host.innerHTML = window.carArt.svg(car.art, 'fit');
    document.body.appendChild(host);
    var svg = host.querySelector('svg');
    var out = '';
    try {
      var els = $$('[data-part="' + key + '"]', svg);
      if (els.length) {
        var x0 = Infinity, y0 = Infinity, x1 = -Infinity, y1 = -Infinity;
        els.forEach(function (e) {
          var b;
          try { b = e.getBBox(); } catch (err) { return; }
          if (!b || (!b.width && !b.height)) return;
          x0 = Math.min(x0, b.x); y0 = Math.min(y0, b.y);
          x1 = Math.max(x1, b.x + b.width); y1 = Math.max(y1, b.y + b.height);
        });
        if (isFinite(x0)) {
          var pad = Math.max(x1 - x0, y1 - y0) * 0.3 + 4;
          svg.setAttribute('viewBox', (x0 - pad) + ' ' + (y0 - pad) + ' ' +
            (x1 - x0 + pad * 2) + ' ' + (y1 - y0 + pad * 2));
          svg.removeAttribute('width'); svg.removeAttribute('height');
          out = host.innerHTML;
        }
      }
    } catch (e) { out = ''; }
    host.remove();
    return out;
  }

  /* ==================================================================
     ◯印（まわすと ついてくる）
     ================================================================== */

  function buildMarks() {
    S.marks.innerHTML = S.parts.map(function (p, i) {
      return '<button type="button" class="kz-mark" data-i="' + i + '" ' +
        'aria-label="' + plain(p.name) + 'を 見る">' + (i + 1) + '</button>';
    }).join('');
    S.markEls = $$('.kz-mark', S.marks);
    syncFound();
  }

  function placeMarks() {
    if (!S || !S.markEls || !S.viewer) return;
    for (var i = 0; i < S.parts.length; i++) {
      var el = S.markEls[i];
      if (!el) continue;
      var p = S.viewer.screenPos(S.parts[i].key);
      if (!p || !p.visible) { el.style.opacity = '0'; el.style.pointerEvents = 'none'; continue; }
      el.style.opacity = '1';
      el.style.pointerEvents = 'auto';
      el.style.left = p.x + 'px';
      el.style.top = p.y + 'px';
    }
  }

  function buildRail() {
    S.rail.innerHTML = S.parts.map(function (p, i) {
      var pic = cropSVG(S.car, p.key);
      return '<button type="button" class="kz-chip' + (pic ? '' : ' kz-chip--noimg') + '" data-i="' + i + '">' +
        (pic ? '<span class="kz-chip__pic">' + pic + '</span>' : '') +
        '<span class="kz-chip__n">' + (i + 1) + '</span>' +
        '<span class="kz-chip__name">' + p.name + '</span>' +
        '</button>';
    }).join('');
    S.chipEls = $$('.kz-chip', S.rail);
  }

  /* ==================================================================
     ぶぶんを えらぶ
     ================================================================== */

  function select(i) {
    var p = S.parts[i];
    if (!p) return;
    S.sel = i;
    S.viewer.highlight(p.key);
    S.viewer.focusPart(p.key);
    S.viewer.setAutoRotate(false);
    S.markEls.forEach(function (el, n) { el.classList.toggle('is-on', n === i); });
    S.chipEls.forEach(function (el, n) { el.classList.toggle('is-on', n === i); });
    showPanel(p, i);
    markFound(p.key);
  }

  function deselect() {
    S.sel = -1;
    S.viewer.clearHighlight();
    var pan = $('#kz-panel');
    if (pan) pan.remove();
    S.main.classList.remove('has-panel');
    S.markEls.forEach(function (el) { el.classList.remove('is-on'); });
    S.chipEls.forEach(function (el) { el.classList.remove('is-on'); });
  }

  function showPanel(p, i) {
    var old = $('#kz-panel');
    if (old) old.remove();

    var tsu = '';
    if (p.tsukuri) {
      tsu = '<div class="kz__tsukuri"><span class="kz__tag">③ つくり</span><br>' +
        '<span class="js-read">' + p.tsukuri.text + '</span></div>';
    }
    var pic = cropSVG(S.car, p.key);
    var html = '<aside class="kz__panel" id="kz-panel" aria-live="polite">' +
      '<div class="kz__panel-head">' +
      '<span class="kz__panel-n">' + (i + 1) + '</span>' +
      '<h3 class="kz__panel-name">' + p.name + '</h3>' +
      '<button type="button" class="kz__panel-close" id="kz-pclose" aria-label="とじる">✕</button>' +
      '</div>' +
      (pic ? '<div class="kz__thumb">' + pic + '</div>' : '') +
      tsu +
      (p.text ? '<p class="kz__panel-text js-read">' + p.text + '</p>' : '') +
      '<div class="kz__panel-foot">' +
      '<button type="button" class="btn btn--audio" id="kz-say" data-label="🔊 こえで きく">🔊 こえで きく</button>' +
      '<button type="button" class="btn btn--audio" id="kz-next">つぎの ぶぶん →</button>' +
      '</div>' +
      '</aside>';
    S.main.insertAdjacentHTML('beforeend', html);
    S.main.classList.add('has-panel');
  }

  /* ==================================================================
     みつけた しるし（SVG版と 同じ 保存キー）
     ================================================================== */

  function foundKey() { return 'kz.' + S.car.id; }

  function markFound(key) {
    if (S.found.indexOf(key) >= 0) return;
    S.found.push(key);
    store.set(foundKey(), S.found);
    syncFound();
    if (S.found.length >= S.parts.length) celebrate();
  }

  function syncFound() {
    var n = 0;
    S.parts.forEach(function (p, i) {
      var on = S.found.indexOf(p.key) >= 0;
      if (on) n++;
      if (S.markEls && S.markEls[i]) S.markEls[i].classList.toggle('is-found', on);
      if (S.chipEls && S.chipEls[i]) S.chipEls[i].classList.toggle('is-found', on);
    });
    var all = n >= S.parts.length && S.parts.length > 0;
    S.count.innerHTML = all ? '🎉 ぜんぶ みつけた！' : 'みつけた ' + n + ' / ' + S.parts.length;
    S.count.classList.toggle('is-done', all);
  }

  function celebrate() {
    if (S.celebrated) return;
    S.celebrated = true;
    S.main.insertAdjacentHTML('beforeend',
      '<div class="kz__done" id="kz-done"><div class="kz__done-card">' +
      '<h2>🎉 ぜんぶ みつけた！</h2>' +
      '<p>' + S.car.name + 'の ぶぶんを ' + S.parts.length + 'こ ぜんぶ かんさつ しました。<br>' +
      'どの ぶぶんが いちばん おどろいたか、ずかんに かいて みよう。</p>' +
      '<button type="button" class="btn" id="kz-done-stay">もっと かんさつ する</button> ' +
      '<button type="button" class="btn btn--next" id="kz-done-go">✏️ ずかんに かく</button>' +
      '</div></div>');
  }

  /* ==================================================================
     大きさ（ズーム）と むき
     ================================================================== */

  function zoomRatio() { return S.viewer.orbit.homeDist / S.viewer.orbit.tDist; }

  function setZoomFromSlider(t) {
    var o = S.viewer.orbit;
    var maxZ = o.homeDist / o.minDist;                 /* いちばん 寄れる 倍率 */
    var z = Math.pow(maxZ, t / 1000);
    o.setView(null, null, o.homeDist / z);
  }

  function updateZoomUI() {
    if (!S || !S.viewer || !document.getElementById('kz-zval')) return;
    var z = zoomRatio();
    $('#kz-zval').textContent = '×' + (z < 10 ? z.toFixed(1) : Math.round(z));
    var o = S.viewer.orbit;
    var maxZ = o.homeDist / o.minDist;
    var t = Math.log(Math.max(1, z)) / Math.log(maxZ) * 1000;
    if (document.activeElement !== S.range) S.range.value = Math.round(t);
  }

  var TURNS = [
    { n: 'ななめ', az: -0.62, pl: 1.24 },
    { n: 'よこ', az: -Math.PI / 2, pl: 1.40 },
    { n: 'まえ', az: -Math.PI, pl: 1.36 },
    { n: 'うしろ', az: 0, pl: 1.36 },
    { n: '上から', az: -0.62, pl: 0.40 },
    { n: 'ぐるり', spin: true }
  ];

  function buildTurn() {
    S.turn.innerHTML = TURNS.map(function (t, i) {
      return '<button type="button" class="kz-tbtn" data-i="' + i + '">' + t.n + '</button>';
    }).join('') + (S.viewer.animations().length
      ? S.viewer.animations().map(function (a, i) {
        return '<button type="button" class="kz-tbtn kz-tbtn--anim" data-a="' + a.key + '">▶ ' +
          a.label + '</button>';
      }).join('') : '');

    $$('.kz-tbtn', S.turn).forEach(function (b) {
      b.addEventListener('click', function () {
        var ai = b.getAttribute('data-a');
        if (ai) {
          b.classList.toggle('is-on', S.viewer.toggleAnim(ai));
          S.viewer.setAutoRotate(false);
          return;
        }
        var t = TURNS[Number(b.getAttribute('data-i'))];
        if (t.spin) { S.viewer.setAutoRotate(true); return; }
        S.viewer.setView(t.az, t.pl);
      });
    });
  }

  /* ==================================================================
     mount / unmount
     ================================================================== */

  function mount(car, host) {
    unmount();
    host.innerHTML = shell(car);

    S = {
      car: car, host: host,
      main: $('#kz-main'), stage: $('#kz-stage'), marks: $('#kz-marks'),
      rail: $('#kz-rail'), count: $('#kz-count'), range: $('#kz-range'),
      turn: $('#kz-turn'),
      found: store.get('kz.' + car.id, []) || [],
      sel: -1, celebrated: false, handlers: []
    };

    try {
      S.viewer = window.jz3d.createViewer(S.stage, car.art, { autoRotate: true });
      S.viewer.setTheme('dark');
    } catch (e) {
      /* WebGLが つかえない ときは SVG版に まかせる */
      S = null;
      host.innerHTML = '';
      return false;
    }

    S.parts = collectParts(car, S.viewer);
    buildMarks();
    buildRail();
    buildTurn();

    var m = S.viewer.meters();
    $('#kz-len').innerHTML = ' ／ ながさ やく' + m.length.toFixed(1) + 'メートル・' +
      'たかさ やく' + m.height.toFixed(1) + 'メートル';

    S.viewer.onFrame(function () { placeMarks(); updateZoomUI(); });

    /* --- そうさ --- */
    function on(el, ev, fn) { if (el) { el.addEventListener(ev, fn); S.handlers.push([el, ev, fn]); } }

    on(S.marks, 'click', function (e) {
      var b = e.target.closest('.kz-mark');
      if (!b) return;
      var i = Number(b.getAttribute('data-i'));
      if (S.sel === i) { deselect(); } else { select(i); }
    });
    on(S.rail, 'click', function (e) {
      var b = e.target.closest('.kz-chip');
      if (!b) return;
      select(Number(b.getAttribute('data-i')));
    });
    on(S.main, 'click', function (e) {
      if (e.target.closest('#kz-pclose')) { deselect(); return; }
      if (e.target.closest('#kz-next')) { select((S.sel + 1) % S.parts.length); return; }
      if (e.target.closest('#kz-say') && window.jzSpeech) {
        var panel = $('#kz-panel');
        var box = document.createElement('div');
        $$('.js-read', panel).forEach(function (x) { box.appendChild(x.cloneNode(true)); });
        window.jzSpeech.speak(e.target.closest('#kz-say'), box);
        return;
      }
      if (e.target.closest('#kz-done-stay')) { var d = $('#kz-done'); if (d) d.remove(); return; }
      if (e.target.closest('#kz-done-go')) { location.hash = '#/car/' + S.car.id; return; }
    });

    /* 車を 直せつ さわる → その ぶぶんへ */
    var down = null;
    on(S.stage, 'pointerdown', function (e) { down = [e.clientX, e.clientY]; });
    on(S.stage, 'pointerup', function (e) {
      if (!down) return;
      var moved = Math.hypot(e.clientX - down[0], e.clientY - down[1]);
      down = null;
      if (moved > 8) return;
      var key = S.viewer.pick(e.clientX, e.clientY);
      if (!key) return;
      for (var i = 0; i < S.parts.length; i++) {
        if (S.parts[i].key === key) { select(i); return; }
      }
    });

    on($('#kz-in'), 'click', function () { S.viewer.orbit.setView(null, null, S.viewer.orbit.tDist * 0.72); });
    on($('#kz-out'), 'click', function () { S.viewer.orbit.setView(null, null, S.viewer.orbit.tDist / 0.72); });
    on($('#kz-reset'), 'click', function () { S.viewer.resetView(); deselect(); });
    on(S.range, 'input', function () { setZoomFromSlider(Number(S.range.value)); });
    on($('#kz-back'), 'click', function () { location.hash = '#/car/' + S.car.id; });
    on($('#kz-ruler'), 'click', function (e) {
      S.ruler = !S.ruler;
      S.viewer.showRuler(S.ruler);
      e.currentTarget.setAttribute('aria-pressed', S.ruler ? 'true' : 'false');
      e.currentTarget.classList.toggle('is-on', S.ruler);
    });
    on($('#kz-full'), 'click', function () {
      var el = $('#kz');
      if (document.fullscreenElement) { document.exitFullscreen(); }
      else if (el.requestFullscreen) { el.requestFullscreen(); }
    });

    var keyFn = function (e) {
      if (e.key === 'Escape') { if (S.sel >= 0) { deselect(); } else { location.hash = '#/car/' + S.car.id; } }
      else if (e.key === '+' || e.key === '=') { S.viewer.orbit.setView(null, null, S.viewer.orbit.tDist * 0.8); }
      else if (e.key === '-') { S.viewer.orbit.setView(null, null, S.viewer.orbit.tDist / 0.8); }
      else if (e.key === '0') { S.viewer.resetView(); }
      else if (e.key === 'ArrowLeft') { S.viewer.orbit.setView(S.viewer.orbit.tAz - 0.25, null); }
      else if (e.key === 'ArrowRight') { S.viewer.orbit.setView(S.viewer.orbit.tAz + 0.25, null); }
      else if (e.key === 'ArrowUp') { S.viewer.orbit.setView(null, S.viewer.orbit.tPl - 0.12); }
      else if (e.key === 'ArrowDown') { S.viewer.orbit.setView(null, S.viewer.orbit.tPl + 0.12); }
      else { return; }
      e.preventDefault();
    };
    document.addEventListener('keydown', keyFn);
    S.handlers.push([document, 'keydown', keyFn]);

    setTimeout(function () { var h = $('#kz-hint'); if (h) h.classList.add('is-out'); }, 7000);
    return true;
  }

  function unmount() {
    if (!S) return;
    S.handlers.forEach(function (h) { h[0].removeEventListener(h[1], h[2]); });
    if (S.viewer) S.viewer.dispose();
    if (S.host) S.host.innerHTML = '';
    S = null;
  }

  window.kansatsu3d = { mount: mount, unmount: unmount };
})();
