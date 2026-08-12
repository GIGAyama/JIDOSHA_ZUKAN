/* =========================================================================
   kansatsu-common.js — ものすごい かんさつ の、2D版と 3D版で おなじ ところ

   kansatsu.js（イラスト版）と kansatsu3d.js（3D版）は、
   ・絵の うごかしかた（SVGの viewBox ／ three.js の カメラ）
   ・◯マークの おきかた
   が まったく ちがうので、そこは わけた ままに して あります。

   けれど「どの ぶぶんを 見た か」を おぼえて、かぞえる ところは
   2Dでも 3Dでも おなじです。
   おなじ コードが 2つの ファイルに あると、直す ときに かたほうを 忘れます。
   （じっさい 3D版だけ ちがう キーに ほぞんして いて、2Dと 3Dを 行き来すると
     ✓が 消えて 見えて いました。）
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

  /* かぞえて、うえの バーに 出す。

     「みつけた n / N」と 分母を 出して いた ころは、ぜんぶ 集める ことが
     ゴールに 見えて しまい、この 単元の ねらい（書く ざいりょうを
     1つ2つ えらぶ）と ずれて いました。
     しかも 分母は 3Dと イラストで ちがいます
     （トラックは 3D=8こ / イラスト=5こ）。
     いまは 見た かずだけを しずかに 出します。 */
  function syncFound(S) {
    var n = 0;
    S.parts.forEach(function (p, i) {
      var on = S.found.indexOf(p.key) >= 0;
      if (on) { n++; }
      if (S.markEls && S.markEls[i]) { S.markEls[i].classList.toggle('is-found', on); }
      if (S.chipEls && S.chipEls[i]) { S.chipEls[i].classList.toggle('is-found', on); }
    });
    S.count.innerHTML = '<ruby>見<rt>み</rt></ruby>た ぶぶん ' + n + 'こ';
  }

  function markFound(S, key) {
    if (S.found.indexOf(key) >= 0) { return; }
    S.found.push(key);
    store.set(foundKey(S), S.found);
    syncFound(S);
  }

  window.jzKz = {
    store: store,
    plain: plain,
    foundKey: foundKey,
    loadFound: loadFound,
    syncFound: syncFound,
    markFound: markFound
  };
})();
