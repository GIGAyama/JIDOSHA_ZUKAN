/* =========================================================================
   kansatsu-common.js — ものすごい かんさつ の、2D版と 3D版で おなじ ところ

   kansatsu.js（イラスト版）と kansatsu3d.js（3D版）は、
   ・絵の うごかしかた（SVGの viewBox ／ three.js の カメラ）
   ・◯マークの おきかた
   が まったく ちがうので、そこは わけた ままに して あります。

   けれど「どの ぶぶんを 見た か」を おぼえて、かぞえて、ぜんぶ 見つけたら
   おいわいを 出す ところは、2Dでも 3Dでも おなじです。
   おなじ コードが 2つの ファイルに あると、直す ときに かたほうを 忘れます。
   （じっさい「ぜんぶ みつけた！」の ボタンの 文が、
     もう ない かきうつしシートを さした まま 両方に のこって いました。）
   そういう ことが おきない ように、ここに まとめて あります。

   つかいかた: window.jzKz.〇〇 で よびます。
   どちらの ファイルより さきに 読みこんで ください（index.html）。
   ========================================================================= */
(function () {
  'use strict';

  /* ------------------------------------------------------------------
     ほぞん（学校の たんまつで ブロックされて いても うごくように）
     app.js が さきに 読みこまれて いれば、その ものを つかう
     ------------------------------------------------------------------ */
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

  /* <ruby>つきの HTML から、文字だけ 取り出す */
  function plain(html) {
    var d = document.createElement('div');
    d.innerHTML = html;
    return d.textContent.replace(/\s+/g, ' ').trim();
  }

  /* ------------------------------------------------------------------
     見た ぶぶんの ✓（たんまつに ほぞんする。キーは kz.<車のid>）
     ------------------------------------------------------------------ */
  function foundKey(S) { return 'kz.' + S.car.id; }

  function loadFound(S) {
    var saved = store.get(foundKey(S), []);
    return Array.isArray(saved) ? saved : [];
  }

  /* かぞえて、うえの バーに 出す */
  function syncFound(S) {
    var n = 0;
    S.parts.forEach(function (p, i) {
      var on = S.found.indexOf(p.key) >= 0;
      if (on) { n++; }
      if (S.markEls && S.markEls[i]) { S.markEls[i].classList.toggle('is-found', on); }
      if (S.chipEls && S.chipEls[i]) { S.chipEls[i].classList.toggle('is-found', on); }
    });
    var all = n >= S.parts.length && S.parts.length > 0;
    S.count.innerHTML = all
      ? '🎉 ぜんぶ みつけた！'
      : 'みつけた ' + n + ' / ' + S.parts.length;
    S.count.classList.toggle('is-done', all);
  }

  function markFound(S, key) {
    if (S.found.indexOf(key) >= 0) { return; }
    S.found.push(key);
    store.set(foundKey(S), S.found);
    syncFound(S);
    if (S.found.length >= S.parts.length) { celebrate(S); }
  }

  /* ------------------------------------------------------------------
     ぜんぶ 見つけた ときの おいわい
     ------------------------------------------------------------------ */
  function celebrate(S) {
    if (S.celebrated) { return; }
    S.celebrated = true;
    S.main.insertAdjacentHTML('beforeend',
      '<div class="kz__done" id="kz-done"><div class="kz__done-card">' +
      '<h2>🎉 ぜんぶ みつけた！</h2>' +
      '<p>' + S.car.name + 'の ぶぶんを ' + S.parts.length + 'こ ぜんぶ かんさつ しました。<br>' +
      'どの ぶぶんが いちばん おどろいたか、ノートに かいて みよう。</p>' +
      '<button type="button" class="btn" id="kz-done-stay">もっと かんさつ する</button> ' +
      '<button type="button" class="btn btn--next" id="kz-done-go">' +
      '← この <ruby>車<rt>くるま</rt></ruby>の ページに もどる</button>' +
      '</div></div>');
  }

  window.jzKz = {
    store: store,
    plain: plain,
    foundKey: foundKey,
    loadFound: loadFound,
    syncFound: syncFound,
    markFound: markFound,
    celebrate: celebrate
  };
})();
