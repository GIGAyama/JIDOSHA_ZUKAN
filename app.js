/* =========================================================================
   app.js — がめんの きりかえ・じゅんばんに ひらく しくみ・こえで きく

   ・ハッシュルーティング  #/ 一覧 / #/car/<id> 詳細 / #/kurabe 大きさくらべ
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

  /* 絵（assets に 写真が あれば そちらを つかう） */
  function artHTML(car, mode) {
    if (car.photo) {
      return '<img src="' + car.photo + '" alt="' + plain(car.name) + 'の しゃしん" ' +
        'loading="lazy" decoding="async">';
    }
    return window.carArt.svg(car.art, mode || 'fit');
  }

  /* ------------------------------------------------------------------
     3Dモデル（car3d.js）— ある 車だけ「3Dで 見る」が 出る
     ------------------------------------------------------------------ */
  var view3d = null;                                   /* いま 出て いる ビューア */

  function has3d(car) {
    return !!(car && window.jz3d && window.jz3d.MODEL3D[car.art]);
  }
  function want3d() { return store.get('use3d', true) !== false; }
  function setWant3d(v) { store.set('use3d', !!v); }

  function drop3d() {
    if (view3d) { try { view3d.dispose(); } catch (e) { } view3d = null; }
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
    t.innerHTML = on
      ? '🖼️ イラストで <ruby>見<rt>み</rt></ruby>る'
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

  function renderTabs() {
    var html = '<button type="button" class="tab' + (filter === 'all' ? ' is-active' : '') +
      '" data-filter="all">🚙 ぜんぶ</button>';
    cats.forEach(function (c) {
      html += '<button type="button" class="tab' + (filter === c.id ? ' is-active' : '') +
        '" data-filter="' + c.id + '">' + c.icon + ' ' + c.name + '</button>';
    });
    html += '<button type="button" class="tab' + (filter === 'star' ? ' is-active' : '') +
      '" data-filter="star">⭐ えらんだ <ruby>車<rt>くるま</rt></ruby></button>';
    html += '<a class="tab" href="#/kurabe">📏 <ruby>大<rt>おお</rt></ruby>きさくらべ</a>';
    $('#tabs').innerHTML = html;
  }

  function cardHTML(car) {
    var cat = catMap[car.category] || { icon: '', name: '' };
    var on = isStar(car.id);
    return '<article class="card">' +
      '<button type="button" class="card__star js-star" data-id="' + car.id + '" ' +
      'aria-pressed="' + on + '" aria-label="' + plain(car.name) + 'を えらんだ 車に する">' +
      (on ? '★' : '☆') + '</button>' +
      '<div class="card__art">' + artHTML(car, 'fit') + '</div>' +
      '<p class="card__cat">' + cat.icon + ' ' + cat.name + '</p>' +
      '<h3 class="card__name"><a class="card__link" href="#/car/' + car.id + '">' +
      car.name + '</a></h3>' +
      '</article>';
  }

  function renderList() {
    var list = filter === 'all' ? cars
      : filter === 'star' ? cars.filter(function (c) { return isStar(c.id); })
        : cars.filter(function (c) { return c.category === filter; });

    $('#grid').innerHTML = list.map(cardHTML).join('');
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

  var SLOTS = [
    {
      key: 'shigoto', num: '1',
      tmpl: function (car) {
        return car.name + 'は、<i class="slot__blank">　　　　　</i> しごとを して います。';
      },
      hint: 'どんな しごとを して いますか。'
    },
    {
      key: 'tsukuri1', num: '2',
      tmpl: function () {
        return '<b>その ために</b>、<i class="slot__blank">　　　　　</i>。';
      },
      hint: 'その しごとの ために、どんな つくりに なって いますか。'
    },
    {
      key: 'tsukuri2', num: '3',
      tmpl: function () {
        return '<i class="slot__blank">　　　　</i>ように、<i class="slot__blank">　　　　</i>。';
      },
      hint: 'もう ひとつの つくりも かいて みましょう。'
    }
  ];

  function detailHTML(car) {
    var cat = catMap[car.category] || { icon: '', name: '' };
    var t = car.tsukuri;

    var makes = t.map(function (item, i) {
      return '<div class="step step--make js-make" data-part="' + item.part + '" data-i="' + i + '" hidden>' +
        '<span class="step__tag">③ つくり' + (t.length > 1 ? ' その' + (i + 1) : '') + '</span>' +
        '<p class="step__text js-read">' + item.text + '</p>' +
        '<div class="step__foot">' +
        audioBtn('つくりの せつめい') +
        ' <button type="button" class="btn btn--audio js-pin">📍 ばしょを <ruby>見<rt>み</rt></ruby>る</button>' +
        '</div></div>';
    }).join('');

    var saved = store.get('sheet.' + car.id, {}) || {};
    var slots = SLOTS.map(function (s) {
      var val = typeof saved[s.key] === 'string' ? saved[s.key] : '';
      return '<div class="slot">' +
        '<p class="slot__tmpl"><span class="slot__num">' + s.num + '</span>' + s.tmpl(car) + '</p>' +
        '<label class="visually-hidden" for="slot-' + s.key + '">' + s.hint + '</label>' +
        '<textarea id="slot-' + s.key + '" class="js-slot" data-key="' + s.key + '" ' +
        'placeholder="' + s.hint + '"></textarea>' +
        '<div class="sheet__print"></div>' +
        '</div>';
    }).join('');

    return '<div class="detail">' +

      '<div class="detail__head">' +
      '<span class="cat-chip">' + cat.icon + ' ' + cat.name + '</span>' +
      '<h2 class="detail__name">' + car.name + '</h2>' +
      '<p class="detail__len">ながさ やく ' + meters(car) + '</p>' +
      '</div>' +

      '<div class="detail__body">' +

      '<div class="art-panel">' +
      '<div class="art-stage" id="art-stage">' + artHTML(car, 'fit') +
      '<div class="callout" id="callout" hidden></div>' +
      '</div>' +
      '<div class="art-tools">' +
      '<button type="button" class="btn btn--3d" id="btn-3d" aria-pressed="false" hidden>' +
      '🧊 3Dで まわして <ruby>見<rt>み</rt></ruby>る</button>' +
      '<a class="btn btn--zoom" href="#/kansatsu/' + car.id + '">' +
      '🔬 ものすごく <ruby>大<rt>おお</rt></ruby>きく <ruby>見<rt>み</rt></ruby>る</a>' +
      '</div>' +
      '<div class="art-anim" id="art-anim"></div>' +
      '<p class="art-hint">「つくり」の <b>ぶん</b>を おすと、その ぶぶんが <b>光ります</b>。' +
      (has3d(car) ? '<br>3Dの ときは、<b>ゆびで まわしながら</b> たしかめられます。' : '') + '<br>' +

      'ぜんぶの ぶぶんを しらべる ときは、<b>ものすごく <ruby>大<rt>おお</rt></ruby>きく</b> して みよう。</p>' +
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
      '</div>' +

      '</div>' +

      '<details class="more">' +
      '<summary>🔍 もっと しりたい <ruby>人<rt>ひと</rt></ruby>へ</summary>' +
      '<p class="js-read">' + car.hakken + '</p>' +
      '<div class="step__foot">' + audioBtn('もっと しりたい') + '</div>' +
      '</details>' +

      '<section class="sheet">' +
      '<h2>✏️ かきうつしシート</h2>' +
      '<p class="sheet__lead">' +
      'この じゅんばんで かくと、じぶんの ずかんの <ruby>文<rt>ぶん</rt></ruby>に なります。' +
      'ここに かいた ことは、この たんまつに ほぞんされます。' +
      '</p>' + slots +
      '<div class="sheet__foot">' +
      '<button type="button" class="btn" id="btn-print">🖨️ ワークシートを いんさつ</button>' +
      '<span class="sheet__saved" id="saved"></span>' +
      '</div>' +
      '</section>' +

      '</div>';
  }

  var state = { car: null, step: 0, pin: null };

  function updateSteps() {
    var t = state.car.tsukuri;
    $('#step-job').hidden = state.step < 1;
    $$('.js-make', viewDetail).forEach(function (el, i) {
      el.hidden = state.step < 2 + i;
    });

    var prog = $$('#progress li');
    prog[0].classList.toggle('is-on', state.step >= 0);
    prog[1].classList.toggle('is-on', state.step >= 1);
    prog[2].classList.toggle('is-on', state.step >= 2);

    var next = $('#btn-next');
    var last = 1 + t.length;
    if (state.step === 0) {
      next.innerHTML = 'こたえを <ruby>見<rt>み</rt></ruby>る →';
    } else if (state.step === 1) {
      next.innerHTML = '<b>その ために</b>… →';
    } else if (state.step < last) {
      next.innerHTML = 'つぎの つくり →';
    } else {
      next.hidden = true;
    }
  }

  /* --- 絵の ぶぶんを 光らせる --- */
  function clearPin() {
    var stage = $('#art-stage');
    if (!stage) return;
    if (view3d) { view3d.clearHighlight(); }
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
      callout.innerHTML = state.car.tsukuri[i].label;
      callout.hidden = false;
      state.pin = part;
      place3dCallout();
      return;
    }

    /* --- イラストの とき（これまで どおり）--- */
    var svg = stage.querySelector('svg');
    if (!svg) return;                       /* 写真の ときは 光らせない */
    var els = $$('[data-part="' + part + '"]', svg);
    if (!els.length) return;

    els.forEach(function (e) { e.classList.add('is-lit'); });
    svg.classList.add('has-lit');
    makeEl.classList.add('is-active');
    var b = $('.js-pin', makeEl);
    if (b) b.innerHTML = '✕ もどす';

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

  /* --- かきうつしシート --- */
  var saveTimer = null;
  function saveSheet() {
    if (!state.car) return;
    var data = {};
    $$('.js-slot', viewDetail).forEach(function (ta) {
      data[ta.getAttribute('data-key')] = ta.value;
    });
    var ok = store.set('sheet.' + state.car.id, data);
    var el = $('#saved');
    if (el) {
      el.textContent = ok ? '✓ ほぞん しました' : '（この たんまつでは ほぞん できません）';
      clearTimeout(saveTimer);
      saveTimer = setTimeout(function () { if (el) el.textContent = ''; }, 2200);
    }
    syncPrint();
  }

  /* 印刷用に、入力した 文を うつしておく（textarea は 印刷で きれる ことが ある） */
  function syncPrint() {
    $$('.js-slot', viewDetail).forEach(function (ta) {
      var box = ta.parentNode.querySelector('.sheet__print');
      if (box) { box.textContent = ta.value; }
    });
  }

  function showDetail(car) {
    state = { car: car, step: 0, pin: null };
    unmount3d();
    viewDetail.innerHTML = detailHTML(car);
    if (has3d(car) && want3d()) { mount3d(car); }
    sync3dToggle(car);
    if (view3d) { view3d.onFrame(place3dCallout); }

    /* ほぞんして あった 文を もどす */
    var saved = store.get('sheet.' + car.id, {}) || {};
    $$('.js-slot', viewDetail).forEach(function (ta) {
      var v = saved[ta.getAttribute('data-key')];
      if (typeof v === 'string') { ta.value = v; }
    });
    syncPrint();

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
    if (e.target.closest('#btn-print')) { window.print(); return; }

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

  viewDetail.addEventListener('input', function (e) {
    if (e.target.classList.contains('js-slot')) { saveSheet(); }
  });

  document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape') { clearPin(); stopSpeech(); }
  });

  $('#btn-back').addEventListener('click', function () { location.hash = '#/'; });

  $('#btn-star').addEventListener('click', function () {
    if (!state.car) return;
    var on = toggleStar(state.car.id);
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
  function setView(name) {
    stopSpeech();
    if (name !== 'kansatsu') {
      if (window.kansatsu) { window.kansatsu.unmount(); }
      if (window.kansatsu3d) { window.kansatsu3d.unmount(); }
    }
    if (name !== 'detail') { unmount3d(); }
    viewList.hidden = name !== 'list';
    viewDetail.hidden = name !== 'detail';
    viewCompare.hidden = name !== 'compare';
    viewKansatsu.hidden = name !== 'kansatsu';
    elHeader.hidden = name !== 'list';
    elTopbar.hidden = name !== 'detail';
    if (name === 'compare') {
      elTopbar.hidden = false;
      $('#btn-star').hidden = true;
    } else {
      $('#btn-star').hidden = false;
    }
    window.scrollTo(0, 0);
  }

  /* ==================================================================
     ものすごい かんさつ
     ================================================================== */
  function showKansatsu(car) {
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

  function route() {
    var h = location.hash || '#/';
    clearPin();
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
    renderTabs();
    renderList();
    setView('list');
    document.title = 'じどう車ずかん - しごとと つくりを しらべよう';
  }

  window.addEventListener('hashchange', route);

  /* car3d.js は あとから 読みこまれる。来た ときに 詳細ページを 出して いたら、
     画面を 作りなおさずに（かきうつしシートを 消さずに）3Dを のせる */
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

  route();
})();
