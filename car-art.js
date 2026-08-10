/* =========================================================================
   car-art.js — じどう車の イラスト（SVG）を くみたてる

   ■ きまりごと
     ・すべての 車は「地面 y = 200」「まん中 x = 200」を きじゅんに かく
     ・1メートル ＝ およそ 28 たんい（ぜんぶの 車が おなじ しゅくしゃく）
       → 「大きさくらべ」の 画面で 車を ならべると 大きさの ちがいが 分かる
     ・「つくり」で せつめいする ぶひんには data-part を つける
       → app.js が つくりの 文と むすびつけて、その ぶぶんを 光らせる

   ■ つかいかた
     window.carArt.svg('truck', 'fit')    … その車に よった 絵（カード・詳細用）
     window.carArt.svg('truck', 'scale')  … 全車 共通しゅくしゃくの 絵（大きさくらべ用）
     window.carArt.size('truck')          … { w, h }（たんい）
   ========================================================================= */
(function () {
  'use strict';

  var G = 200;   // 地面の y ざひょう
  var CX = 200;  // まん中の x ざひょう
  var M = 28;    // 1メートル ＝ 28たんい

  var STROKE = '#22314a';
  var SW = 3;
  var GLASS = '#c7e6f7';
  var GLASS_D = '#8fc6e4';
  var TIRE = '#2f3542';
  var HUB = '#e6ebf2';
  var STEEL = '#ccd5e0';
  var STEEL_D = '#95a2b5';
  var LAMP_Y = '#ffd34d';
  var LAMP_R = '#ef4b4b';
  var SEAT = '#3f6f92';
  var SHADOW = 'rgba(34,49,74,0.12)';

  /* ---------- ちいさな 道具 ---------- */

  function n(v) { return Math.round(v * 100) / 100; }

  function P(part) {
    return part ? ' data-part="' + part + '" class="art-part"' : '';
  }

  function d(o, key, def) {
    return o && o[key] !== undefined ? o[key] : def;
  }

  function shade(hex, k) {
    var v = parseInt(hex.slice(1), 16);
    var c = [(v >> 16) & 255, (v >> 8) & 255, v & 255].map(function (x) {
      var y = Math.max(0, Math.min(255, Math.round(x * k)));
      return (y < 16 ? '0' : '') + y.toString(16);
    });
    return '#' + c.join('');
  }

  function rect(x, y, w, h, o) {
    o = o || {};
    return '<rect x="' + n(x) + '" y="' + n(y) + '" width="' + n(w) + '" height="' + n(h) +
      '" rx="' + d(o, 'rx', 4) + '" fill="' + d(o, 'fill', '#fff') +
      '" stroke="' + d(o, 'stroke', STROKE) + '" stroke-width="' + d(o, 'sw', SW) +
      '" stroke-linejoin="round"' + P(o.part) + '/>';
  }

  function circ(cx, cy, r, o) {
    o = o || {};
    return '<circle cx="' + n(cx) + '" cy="' + n(cy) + '" r="' + n(r) +
      '" fill="' + d(o, 'fill', '#fff') + '" stroke="' + d(o, 'stroke', STROKE) +
      '" stroke-width="' + d(o, 'sw', SW) + '"' + P(o.part) + '/>';
  }

  function ell(cx, cy, rx, ry, o) {
    o = o || {};
    return '<ellipse cx="' + n(cx) + '" cy="' + n(cy) + '" rx="' + n(rx) + '" ry="' + n(ry) +
      '" fill="' + d(o, 'fill', '#fff') + '" stroke="' + d(o, 'stroke', STROKE) +
      '" stroke-width="' + d(o, 'sw', SW) + '"' + P(o.part) + '/>';
  }

  function poly(points, o) {
    o = o || {};
    var pts = points.map(function (p) { return n(p[0]) + ',' + n(p[1]); }).join(' ');
    return '<polygon points="' + pts + '" fill="' + d(o, 'fill', '#fff') +
      '" stroke="' + d(o, 'stroke', STROKE) + '" stroke-width="' + d(o, 'sw', SW) +
      '" stroke-linejoin="round"' + P(o.part) + '/>';
  }

  function line(x1, y1, x2, y2, o) {
    o = o || {};
    return '<line x1="' + n(x1) + '" y1="' + n(y1) + '" x2="' + n(x2) + '" y2="' + n(y2) +
      '" stroke="' + d(o, 'stroke', STROKE) + '" stroke-width="' + d(o, 'sw', SW) +
      '" stroke-linecap="round"' + P(o.part) + '/>';
  }

  function path(dd, o) {
    o = o || {};
    return '<path d="' + dd + '" fill="' + d(o, 'fill', 'none') +
      '" stroke="' + d(o, 'stroke', STROKE) + '" stroke-width="' + d(o, 'sw', SW) +
      '" stroke-linecap="round" stroke-linejoin="round"' + P(o.part) + '/>';
  }

  function mark(x, y, size, str, color) {
    return '<text x="' + n(x) + '" y="' + n(y) + '" font-size="' + size +
      '" font-family="sans-serif" font-weight="bold" fill="' + color +
      '" text-anchor="middle" dominant-baseline="central">' + str + '</text>';
  }

  /* タイヤ（地面に せっする ように 中心を 計算する） */
  function wheel(cx, r, part) {
    var cy = G - r;
    return '<g' + P(part || 'tire') + '>' +
      circ(cx, cy, r, { fill: TIRE }) +
      circ(cx, cy, r * 0.45, { fill: HUB, sw: 2 }) +
      '</g>';
  }

  function wheels(xs, r, part) {
    return xs.map(function (x) { return wheel(x, r, part); }).join('');
  }

  /* まど（ガラス） */
  function glass(x, y, w, h, o) {
    o = o || {};
    return rect(x, y, w, h, {
      rx: d(o, 'rx', 5), fill: GLASS, sw: d(o, 'sw', 2.5), part: d(o, 'part', 'window')
    });
  }

  /* ライト */
  function lamp(cx, cy, r, color, part) {
    return circ(cx, cy, r, { fill: color, sw: 2, part: part });
  }

  /* 赤い じゅうじ（きゅうきゅう車など） */
  function cross(cx, cy, s, color, part) {
    return '<g' + P(part) + '>' +
      rect(cx - s, cy - s / 3, s * 2, s / 1.5, { fill: color, sw: 0, rx: 1 }) +
      rect(cx - s / 3, cy - s, s / 1.5, s * 2, { fill: color, sw: 0, rx: 1 }) +
      '</g>';
  }

  /* かいてんとう（パトカー・きゅうきゅう車） */
  function siren(cx, y, w, part) {
    return '<g' + P(part || 'lamp') + '>' +
      rect(cx - w / 2, y - 9, w, 11, { rx: 4, fill: LAMP_R, sw: 2.5 }) +
      rect(cx - w / 2 + 3, y - 6, w / 3, 5, { rx: 2, fill: '#ffd9d9', sw: 0 }) +
      '</g>';
  }

  /* 大がたトラックの うんてんせき（キャブオーバー型） */
  function bigCab(x, top, w, color, part) {
    var h = G - 56 - top;
    return rect(x, top, w, h, { rx: 12, fill: color, part: part || 'cab' }) +
      glass(x + 8, top + 8, w - 22, h * 0.45, { part: 'window' }) +
      rect(x + 2, G - 66, w - 6, 12, { rx: 4, fill: shade(color, 0.8), sw: 2 }) +
      lamp(x + 12, G - 48, 5.5, LAMP_Y, null) +
      line(x + w, top + 14, x + w, G - 58, { sw: 2, stroke: shade(color, 0.75) });
  }

  /* =====================================================================
     じどう車ごとの イラスト
     w … よこの 長さ / h … 地面からの 高さ（たんい）/ draw(L) … 左はしの x
     ===================================================================== */
  var ART = {};

  /* ---------- はこぶ ---------- */

  ART.truck = {
    label: 'トラック', w: 336, h: 128,
    draw: function (L) {
      var body = '#4aa564';
      return [
        rect(L + 40, G - 60, 296, 10, { fill: STEEL_D, rx: 3, sw: 2 }),
        // ひろい にだい（ウィングボディ）
        rect(L + 68, G - 128, 268, 72, { rx: 6, fill: STEEL, part: 'nidai' }),
        rect(L + 68, G - 102, 268, 7, { fill: '#2f8f52', sw: 0 }),
        rect(L + 68, G - 95, 268, 7, { fill: '#e5544b', sw: 0 }),
        line(L + 150, G - 128, L + 150, G - 56, { sw: 2, stroke: STEEL_D }),
        line(L + 250, G - 128, L + 250, G - 56, { sw: 2, stroke: STEEL_D }),
        // とびら（ウィングドア）の あわせめ
        line(L + 68, G - 124, L + 336, G - 124, { sw: 2.5, stroke: STEEL_D, part: 'door' }),
        bigCab(L, G - 118, 68, body),
        wheels([L + 46, L + 252, L + 302], 26)
      ].join('');
    }
  };

  ART.bus = {
    label: 'バス', w: 308, h: 106,
    draw: function (L) {
      var body = '#5aa9d6';
      var win = [];
      for (var i = 0; i < 3; i++) {
        var x = L + 96 + i * 70;
        win.push(glass(x, G - 96, 58, 36));
        win.push(rect(x + 8, G - 86, 18, 26, { rx: 4, fill: SEAT, sw: 2, part: 'seat' }));
        win.push(rect(x + 32, G - 86, 18, 26, { rx: 4, fill: SEAT, sw: 2, part: 'seat' }));
      }
      return [
        rect(L, G - 106, 308, 84, { rx: 16, fill: body, part: 'body' }),
        rect(L + 6, G - 102, 40, 14, { rx: 4, fill: '#20364d', sw: 2 }),
        glass(L + 8, G - 84, 40, 40),
        // のりおりぐち
        rect(L + 58, G - 96, 28, 74, { rx: 4, fill: GLASS, sw: 2.5, part: 'door' }),
        line(L + 72, G - 96, L + 72, G - 22, { sw: 2, stroke: GLASS_D }),
        win.join(''),
        lamp(L + 10, G - 34, 6, LAMP_Y, null),
        wheels([L + 52, L + 252], 24)
      ].join('');
    }
  };

  ART.car = {
    label: 'じょうよう車', w: 132, h: 52,
    draw: function (L) {
      var body = '#7b74e0';
      return [
        rect(L, G - 32, 132, 22, { rx: 10, fill: body, part: 'body' }),
        poly([[L + 30, G - 31], [L + 46, G - 52], [L + 92, G - 52], [L + 106, G - 31]],
          { fill: body, part: 'cab' }),
        poly([[L + 38, G - 33], [L + 50, G - 48], [L + 66, G - 48], [L + 66, G - 33]],
          { fill: GLASS, sw: 2, part: 'window' }),
        poly([[L + 71, G - 33], [L + 71, G - 48], [L + 88, G - 48], [L + 99, G - 33]],
          { fill: GLASS, sw: 2, part: 'window' }),
        rect(L + 52, G - 44, 11, 12, { rx: 3, fill: SEAT, sw: 1.8, part: 'seat' }),
        rect(L + 74, G - 44, 11, 12, { rx: 3, fill: SEAT, sw: 1.8, part: 'seat' }),
        line(L + 68, G - 32, L + 68, G - 14, { sw: 2, stroke: shade(body, 0.75) }),
        lamp(L + 6, G - 24, 5, LAMP_Y, null),
        wheels([L + 30, L + 104], 13)
      ].join('');
    }
  };

  ART.taxi = {
    label: 'タクシー', w: 138, h: 62,
    draw: function (L) {
      var body = '#2b2f3a';
      return [
        rect(L, G - 34, 138, 24, { rx: 10, fill: body, part: 'body' }),
        rect(L + 6, G - 26, 126, 9, { fill: '#ffd34d', sw: 0 }),
        poly([[L + 30, G - 33], [L + 46, G - 56], [L + 96, G - 56], [L + 110, G - 33]],
          { fill: body, part: 'cab' }),
        poly([[L + 38, G - 35], [L + 50, G - 52], [L + 68, G - 52], [L + 68, G - 35]],
          { fill: GLASS, sw: 2, part: 'window' }),
        poly([[L + 73, G - 35], [L + 73, G - 52], [L + 92, G - 52], [L + 103, G - 35]],
          { fill: GLASS, sw: 2, part: 'window' }),
        rect(L + 54, G - 48, 11, 13, { rx: 3, fill: SEAT, sw: 1.8, part: 'seat' }),
        rect(L + 77, G - 48, 11, 13, { rx: 3, fill: SEAT, sw: 1.8, part: 'seat' }),
        // やねの あんどん
        rect(L + 56, G - 62, 34, 9, { rx: 3, fill: '#ffe9a8', part: 'andon' }),
        line(L + 70, G - 34, L + 70, G - 16, { sw: 2, stroke: '#6b7280' }),
        wheels([L + 32, L + 108], 14)
      ].join('');
    }
  };

  ART.post = {
    label: 'ゆうびん車', w: 136, h: 66,
    draw: function (L) {
      var body = '#e5544b';
      return [
        rect(L + 34, G - 66, 102, 48, { rx: 5, fill: body, part: 'nidai' }),
        rect(L + 44, G - 58, 42, 22, { rx: 3, fill: '#fff', sw: 2 }),
        mark(L + 65, G - 47, 17, '〒', body),
        rect(L, G - 56, 40, 38, { rx: 9, fill: body, part: 'cab' }),
        glass(L + 5, G - 50, 26, 17),
        // うしろの とびら
        line(L + 136, G - 62, L + 136, G - 20, { sw: 3, stroke: shade(body, 0.75), part: 'door' }),
        rect(L + 108, G - 62, 26, 42, { rx: 3, fill: shade(body, 0.92), sw: 2, part: 'door' }),
        lamp(L + 5, G - 26, 5, LAMP_Y, null),
        wheels([L + 28, L + 108], 15)
      ].join('');
    }
  };

  ART.delivery = {
    label: 'たくはい車', w: 140, h: 70,
    draw: function (L) {
      var body = '#4e9d8c';
      var inner = [];
      // にもつを 分ける たな
      [G - 52, G - 36, G - 20].forEach(function (y) {
        inner.push(line(L + 40, y, L + 106, y, { sw: 2.5, stroke: shade(body, 0.6), part: 'shelf' }));
      });
      // たなに ならんだ にもつ
      [[L + 44, G - 52], [L + 74, G - 52], [L + 44, G - 36], [L + 74, G - 36], [L + 58, G - 20]]
        .forEach(function (p) {
          inner.push(rect(p[0], p[1] - 13, 24, 13, { rx: 2, fill: '#e0b878', sw: 2, part: 'shelf' }));
          inner.push(line(p[0] + 12, p[1] - 13, p[0] + 12, p[1], { sw: 1.6, stroke: '#b48a4a', part: 'shelf' }));
        });
      return [
        rect(L + 34, G - 70, 106, 52, { rx: 5, fill: body, part: 'nidai' }),
        rect(L + 38, G - 66, 70, 44, { rx: 3, fill: '#fdf7ea', sw: 2, part: 'nidai' }),
        inner.join(''),
        rect(L, G - 58, 40, 40, { rx: 9, fill: body, part: 'cab' }),
        glass(L + 5, G - 52, 26, 18),
        // うしろの 大きな とびら
        rect(L + 112, G - 66, 24, 44, { rx: 3, fill: shade(body, 0.88), sw: 2.5, part: 'door' }),
        circ(L + 116, G - 44, 3, { fill: '#fdf7ea', sw: 1.6, part: 'door' }),
        lamp(L + 5, G - 26, 5, LAMP_Y, null),
        wheels([L + 28, L + 110], 16)
      ].join('');
    }
  };

  ART.tanker = {
    label: 'タンクローリー', w: 330, h: 116,
    draw: function (L) {
      var body = '#4a7fd0';
      return [
        rect(L + 44, G - 60, 286, 10, { fill: STEEL_D, rx: 3, sw: 2 }),
        // まるい タンク
        rect(L + 76, G - 112, 246, 58, { rx: 29, fill: STEEL, part: 'tank' }),
        line(L + 150, G - 110, L + 150, G - 56, { sw: 2, stroke: STEEL_D }),
        line(L + 230, G - 110, L + 230, G - 56, { sw: 2, stroke: STEEL_D }),
        rect(L + 168, G - 120, 26, 12, { rx: 4, fill: STEEL_D, sw: 2, part: 'tank' }),
        // ホースを まく ところ
        circ(L + 300, G - 42, 16, { fill: '#e9edf3', part: 'hose' }),
        circ(L + 300, G - 42, 6, { fill: STEEL_D, sw: 2, part: 'hose' }),
        bigCab(L, G - 110, 64, body),
        wheels([L + 44, L + 232, L + 280], 25)
      ].join('');
    }
  };

  ART.carrier = {
    label: 'キャリアカー', w: 336, h: 120,
    draw: function (L) {
      var body = '#e08a3c';
      function minicar(x, y, col) {
        return rect(x, y - 14, 58, 15, { rx: 6, fill: col, sw: 2 }) +
          poly([[x + 12, y - 14], [x + 20, y - 24], [x + 42, y - 24], [x + 48, y - 14]],
            { fill: col, sw: 2 }) +
          circ(x + 14, y + 1, 5, { fill: TIRE, sw: 1.6 }) +
          circ(x + 44, y + 1, 5, { fill: TIRE, sw: 1.6 });
      }
      return [
        rect(L + 40, G - 60, 296, 10, { fill: STEEL_D, rx: 3, sw: 2 }),
        // 2だんの にだい
        rect(L + 66, G - 66, 270, 8, { rx: 2, fill: STEEL, part: 'deck' }),
        rect(L + 66, G - 116, 270, 8, { rx: 2, fill: STEEL, part: 'deck' }),
        line(L + 70, G - 116, L + 70, G - 58, { sw: 3, stroke: STEEL_D, part: 'deck' }),
        line(L + 332, G - 116, L + 332, G - 58, { sw: 3, stroke: STEEL_D, part: 'deck' }),
        line(L + 200, G - 116, L + 200, G - 58, { sw: 2.5, stroke: STEEL_D, part: 'deck' }),
        minicar(L + 96, G - 116, '#e5544b'),
        minicar(L + 216, G - 116, '#5aa9d6'),
        minicar(L + 96, G - 66, '#7b74e0'),
        minicar(L + 216, G - 66, '#4aa564'),
        // うしろの スロープ
        poly([[L + 336, G - 58], [L + 336, G - 48], [L + 306, G - 4], [L + 296, G - 10]],
          { fill: STEEL, part: 'slope' }),
        bigCab(L, G - 116, 62, body),
        wheels([L + 42, L + 250, L + 296], 24)
      ].join('');
    }
  };

  /* ---------- つくる・なおす ---------- */

  ART.crane = {
    label: 'クレーン車', w: 300, h: 172,
    draw: function (L) {
      var body = '#f2a93b';
      var px = L + 128, py = G - 100;          // うでの つけね
      var rad = -30 * Math.PI / 180;
      var len = 142;
      var tx = px + len * Math.cos(rad);
      var ty = py + len * Math.sin(rad);
      return [
        // しっかりした あし（アウトリガー）
        '<g' + P('ashi') + '>' +
        path('M' + n(L + 40) + ' ' + n(G - 62) + 'L' + n(L + 10) + ' ' + n(G - 62) +
          'L' + n(L + 10) + ' ' + n(G - 14), { sw: 9, stroke: '#3f4a5c' }) +
        rect(L - 4, G - 16, 32, 12, { rx: 3, fill: '#55637a' }) +
        path('M' + n(L + 260) + ' ' + n(G - 62) + 'L' + n(L + 290) + ' ' + n(G - 62) +
          'L' + n(L + 290) + ' ' + n(G - 14), { sw: 9, stroke: '#3f4a5c' }) +
        rect(L + 272, G - 16, 32, 12, { rx: 3, fill: '#55637a' }) +
        '</g>',
        rect(L + 18, G - 88, 264, 36, { rx: 8, fill: body, part: 'body' }),
        rect(L + 18, G - 60, 264, 10, { rx: 3, fill: shade(body, 0.75), sw: 2 }),
        // うんてんせき
        rect(L + 30, G - 126, 62, 40, { rx: 9, fill: shade(body, 1.08), part: 'cab' }),
        glass(L + 38, G - 120, 44, 24),
        // のびたり うごいたり する うで（ブーム）
        '<g' + P('arm') + ' transform="rotate(-30 ' + n(px) + ' ' + n(py) + ')">' +
        rect(px - 8, py - 15, len, 30, { rx: 8, fill: body }) +
        rect(px + 60, py - 10, len - 40, 20, { rx: 6, fill: shade(body, 1.14), sw: 2.5 }) +
        '</g>',
        circ(px, py, 12, { fill: shade(body, 0.8), part: 'arm' }),
        // つりさげる ところ
        line(tx, ty, tx, ty + 58, { sw: 2.5 }),
        poly([[tx - 9, ty + 58], [tx + 9, ty + 58], [tx + 5, ty + 72], [tx - 5, ty + 72]],
          { fill: '#e5544b', part: 'hook' }),
        wheels([L + 48, L + 106, L + 200, L + 252], 24)
      ].join('');
    }
  };

  ART.shovel = {
    label: 'ショベルカー', w: 212, h: 134,
    draw: function (L) {
      var body = '#f2a93b';
      return [
        // キャタピラ
        '<g' + P('crawler') + '>' +
        rect(L + 8, G - 38, 176, 38, { rx: 19, fill: '#4a5568' }) +
        circ(L + 28, G - 19, 11, { fill: '#77839a', sw: 2 }) +
        circ(L + 164, G - 19, 11, { fill: '#77839a', sw: 2 }) +
        circ(L + 82, G - 19, 8, { fill: '#77839a', sw: 2 }) +
        circ(L + 122, G - 19, 8, { fill: '#77839a', sw: 2 }) +
        '</g>',
        rect(L + 34, G - 88, 122, 52, { rx: 9, fill: body, part: 'body' }),
        rect(L + 38, G - 126, 52, 42, { rx: 9, fill: shade(body, 1.08), part: 'cab' }),
        glass(L + 44, G - 120, 38, 26),
        // うで
        path('M' + n(L + 146) + ' ' + n(G - 78) + 'L' + n(L + 186) + ' ' + n(G - 122) +
          'L' + n(L + 206) + ' ' + n(G - 72), { sw: 15, stroke: body, part: 'arm' }),
        path('M' + n(L + 146) + ' ' + n(G - 78) + 'L' + n(L + 186) + ' ' + n(G - 122) +
          'L' + n(L + 206) + ' ' + n(G - 72), { sw: 3, stroke: STROKE, part: 'arm' }),
        // つちを すくう バケット
        poly([[L + 198, G - 76], [L + 214, G - 72], [L + 210, G - 44],
        [L + 192, G - 38], [L + 186, G - 60]],
          { fill: shade(body, 0.8), part: 'bucket' }),
        line(L + 192, G - 40, L + 210, G - 46, { sw: 4, stroke: '#f5f7fa', part: 'bucket' })
      ].join('');
    }
  };

  ART.bulldozer = {
    label: 'ブルドーザー', w: 176, h: 106,
    draw: function (L) {
      var body = '#f0b429';
      return [
        '<g' + P('crawler') + '>' +
        rect(L + 32, G - 44, 138, 44, { rx: 22, fill: '#4a5568' }) +
        circ(L + 56, G - 22, 13, { fill: '#77839a', sw: 2 }) +
        circ(L + 146, G - 22, 13, { fill: '#77839a', sw: 2 }) +
        circ(L + 100, G - 22, 9, { fill: '#77839a', sw: 2 }) +
        '</g>',
        rect(L + 54, G - 82, 108, 40, { rx: 7, fill: body, part: 'body' }),
        rect(L + 86, G - 106, 54, 28, { rx: 7, fill: shade(body, 1.08), part: 'cab' }),
        glass(L + 92, G - 101, 42, 18),
        // つちを おす はいど（ブレード）
        path('M' + n(L + 26) + ' ' + n(G - 66) + 'Q' + n(L + 6) + ' ' + n(G - 34) + ' ' +
          n(L + 10) + ' ' + n(G - 4) + 'L' + n(L + 30) + ' ' + n(G - 4) +
          'Q' + n(L + 26) + ' ' + n(G - 34) + ' ' + n(L + 44) + ' ' + n(G - 62) + 'Z',
          { fill: shade(body, 0.85), part: 'blade' }),
        line(L + 40, G - 56, L + 66, G - 44, { sw: 7, stroke: '#55637a', part: 'blade' })
      ].join('');
    }
  };

  ART.mixer = {
    label: 'ミキサー車', w: 236, h: 116,
    draw: function (L) {
      var body = '#3f7fbf';
      return [
        rect(L + 40, G - 58, 196, 10, { fill: STEEL_D, rx: 3, sw: 2 }),
        // ぐるぐる まわる ドラム
        '<g' + P('drum') + ' transform="rotate(-9 ' + n(L + 150) + ' ' + n(G - 82) + ')">' +
        rect(L + 78, G - 112, 150, 62, { rx: 31, fill: '#e8ecf2' }) +
        path('M' + n(L + 104) + ' ' + n(G - 110) + 'q14 32 0 60', { sw: 3, stroke: STEEL_D }) +
        path('M' + n(L + 140) + ' ' + n(G - 112) + 'q14 32 0 62', { sw: 3, stroke: STEEL_D }) +
        path('M' + n(L + 176) + ' ' + n(G - 110) + 'q14 30 0 58', { sw: 3, stroke: STEEL_D }) +
        '</g>',
        // コンクリートを ながす シュート
        poly([[L + 224, G - 74], [L + 236, G - 70], [L + 214, G - 22], [L + 202, G - 28]],
          { fill: '#b9c3d1', part: 'chute' }),
        rect(L, G - 108, 62, 52, { rx: 12, fill: body, part: 'cab' }),
        glass(L + 8, G - 102, 42, 24),
        rect(L + 2, G - 64, 56, 12, { rx: 4, fill: shade(body, 0.8), sw: 2 }),
        lamp(L + 10, G - 46, 5.5, LAMP_Y, null),
        wheels([L + 44, L + 168, L + 214], 24)
      ].join('');
    }
  };

  ART.roller = {
    label: 'ロードローラー', w: 146, h: 100,
    draw: function (L) {
      var body = '#f0b429';
      return [
        // 大きくて おもい ローラー
        '<g' + P('roller') + '>' +
        circ(L + 34, G - 32, 32, { fill: '#b9c3d1' }) +
        circ(L + 34, G - 32, 12, { fill: STEEL_D, sw: 2 }) +
        circ(L + 116, G - 28, 28, { fill: '#b9c3d1' }) +
        circ(L + 116, G - 28, 10, { fill: STEEL_D, sw: 2 }) +
        '</g>',
        rect(L + 22, G - 78, 108, 34, { rx: 8, fill: body, part: 'body' }),
        // うんてんせき（ひろく 見える やね）
        rect(L + 46, G - 84, 62, 8, { rx: 3, fill: shade(body, 0.85), part: 'cab' }),
        line(L + 52, G - 84, L + 52, G - 100, { sw: 4, stroke: STROKE, part: 'cab' }),
        line(L + 102, G - 84, L + 102, G - 100, { sw: 4, stroke: STROKE, part: 'cab' }),
        rect(L + 44, G - 104, 68, 8, { rx: 4, fill: shade(body, 1.05), part: 'cab' }),
        rect(L + 62, G - 96, 22, 18, { rx: 4, fill: SEAT, sw: 2, part: 'seat' })
      ].join('');
    }
  };

  ART.dump = {
    label: 'ダンプカー', w: 220, h: 122,
    draw: function (L) {
      var body = '#e0632f';
      return [
        rect(L + 40, G - 58, 180, 10, { fill: STEEL_D, rx: 3, sw: 2 }),
        // かたむく にだい
        '<g' + P('nidai') + ' transform="rotate(-16 ' + n(L + 208) + ' ' + n(G - 62) + ')">' +
        rect(L + 70, G - 104, 146, 46, { rx: 5, fill: '#5a6575' }) +
        rect(L + 74, G - 100, 138, 12, { rx: 3, fill: '#8b98ad', sw: 0 }) +
        '</g>',
        // もちあげる シリンダー
        line(L + 118, G - 58, L + 140, G - 86, { sw: 8, stroke: STEEL_D, part: 'nidai' }),
        rect(L, G - 108, 64, 52, { rx: 12, fill: body, part: 'cab' }),
        glass(L + 8, G - 102, 44, 24),
        rect(L + 2, G - 64, 58, 12, { rx: 4, fill: shade(body, 0.8), sw: 2 }),
        lamp(L + 10, G - 46, 5.5, LAMP_Y, null),
        wheels([L + 44, L + 156, L + 202], 24)
      ].join('');
    }
  };

  ART.aerial = {
    label: '高しょさぎょう車', w: 232, h: 172,
    draw: function (L) {
      var body = '#f2a93b';
      var px = L + 118, py = G - 92;
      var rad = -44 * Math.PI / 180;
      var len = 128;
      var tx = px + len * Math.cos(rad);
      var ty = py + len * Math.sin(rad);
      return [
        '<g' + P('ashi') + '>' +
        path('M' + n(L + 46) + ' ' + n(G - 58) + 'L' + n(L + 16) + ' ' + n(G - 58) +
          'L' + n(L + 16) + ' ' + n(G - 12), { sw: 8, stroke: '#3f4a5c' }) +
        rect(L + 2, G - 14, 28, 11, { rx: 3, fill: '#55637a' }) +
        path('M' + n(L + 196) + ' ' + n(G - 58) + 'L' + n(L + 222) + ' ' + n(G - 58) +
          'L' + n(L + 222) + ' ' + n(G - 12), { sw: 8, stroke: '#3f4a5c' }) +
        rect(L + 208, G - 14, 28, 11, { rx: 3, fill: '#55637a' }) +
        '</g>',
        rect(L + 62, G - 84, 170, 28, { rx: 6, fill: STEEL, part: 'body' }),
        '<g' + P('arm') + ' transform="rotate(-44 ' + n(px) + ' ' + n(py) + ')">' +
        rect(px - 6, py - 12, len, 24, { rx: 7, fill: body }) +
        rect(px + 50, py - 8, len - 46, 16, { rx: 5, fill: shade(body, 1.14), sw: 2.5 }) +
        '</g>',
        circ(px, py, 11, { fill: shade(body, 0.8), part: 'arm' }),
        // 人が のる かご（バスケット）
        rect(tx - 4, ty - 26, 40, 26, { rx: 4, fill: '#fff', part: 'basket' }),
        line(tx + 2, ty - 20, tx + 30, ty - 20, { sw: 2.5, stroke: STEEL_D, part: 'basket' }),
        rect(L, G - 106, 60, 50, { rx: 11, fill: '#eceff4', part: 'cab' }),
        glass(L + 7, G - 100, 42, 23),
        wheels([L + 42, L + 176], 23)
      ].join('');
    }
  };

  ART.forklift = {
    label: 'フォークリフト', w: 122, h: 104,
    draw: function (L) {
      var body = '#f0b429';
      return [
        // 高く のびる マスト
        '<g' + P('mast') + '>' +
        rect(L + 30, G - 100, 10, 86, { rx: 3, fill: STEEL_D }) +
        rect(L + 44, G - 100, 10, 86, { rx: 3, fill: STEEL_D }) +
        rect(L + 27, G - 104, 30, 8, { rx: 3, fill: '#77839a' }) +
        '</g>',
        // にもつを のせる つめ（フォーク）
        '<g' + P('fork') + '>' +
        rect(L + 20, G - 48, 9, 36, { rx: 2, fill: '#b9c3d1' }) +
        rect(L, G - 18, 30, 8, { rx: 2, fill: '#b9c3d1' }) +
        '</g>',
        // はこんで いる にもつ
        rect(L + 2, G - 46, 26, 28, { rx: 3, fill: '#e0b878', sw: 2 }),
        line(L + 15, G - 46, L + 15, G - 18, { sw: 1.8, stroke: '#b48a4a' }),
        rect(L + 56, G - 58, 64, 42, { rx: 8, fill: body, part: 'body' }),
        rect(L + 66, G - 94, 48, 10, { rx: 3, fill: shade(body, 0.9), part: 'roof' }),
        line(L + 72, G - 86, L + 68, G - 58, { sw: 4, stroke: STROKE, part: 'roof' }),
        line(L + 110, G - 86, L + 114, G - 58, { sw: 4, stroke: STROKE, part: 'roof' }),
        rect(L + 80, G - 80, 22, 22, { rx: 4, fill: SEAT, sw: 2, part: 'seat' }),
        wheels([L + 68, L + 108], 15)
      ].join('');
    }
  };

  /* ---------- たすける・まもる ---------- */

  ART.ambulance = {
    label: 'きゅうきゅう車', w: 168, h: 84,
    draw: function (L) {
      return [
        rect(L + 46, G - 78, 122, 58, { rx: 6, fill: '#ffffff', part: 'body' }),
        rect(L, G - 60, 52, 40, { rx: 10, fill: '#ffffff', part: 'cab' }),
        glass(L + 6, G - 54, 34, 20),
        rect(L + 46, G - 34, 122, 8, { fill: '#e5544b', sw: 0 }),
        // ねかせたまま はこべる ベッド
        glass(L + 56, G - 70, 44, 26, { part: 'bed' }),
        rect(L + 60, G - 58, 36, 9, { rx: 3, fill: '#ffffff', sw: 2, part: 'bed' }),
        cross(L + 128, G - 56, 12, '#e5544b', 'mark'),
        // うしろの 大きな とびら
        rect(L + 140, G - 74, 26, 50, { rx: 3, fill: '#f3f5f8', sw: 2.5, part: 'door' }),
        siren(L + 96, G - 78, 40, 'lamp'),
        lamp(L + 6, G - 28, 5.5, LAMP_Y, null),
        wheels([L + 36, L + 132], 17)
      ].join('');
    }
  };

  ART.fire = {
    label: 'しょうぼう車', w: 204, h: 100,
    draw: function (L) {
      var body = '#e02f2f';
      return [
        rect(L, G - 96, 204, 74, { rx: 9, fill: body, part: 'body' }),
        glass(L + 8, G - 90, 40, 28),
        rect(L + 56, G - 90, 34, 30, { rx: 4, fill: GLASS, sw: 2.5, part: 'cab' }),
        // ホースを しまう ところ
        rect(L + 100, G - 86, 96, 34, { rx: 4, fill: shade(body, 0.85), sw: 2.5, part: 'hose' }),
        circ(L + 124, G - 68, 13, { fill: '#f0f3f7', sw: 2, part: 'hose' }),
        circ(L + 124, G - 68, 8, { fill: '#c9d2de', sw: 2, part: 'hose' }),
        circ(L + 124, G - 68, 3.5, { fill: '#f0f3f7', sw: 1.6, part: 'hose' }),
        circ(L + 166, G - 68, 13, { fill: '#f0f3f7', sw: 2, part: 'hose' }),
        circ(L + 166, G - 68, 8, { fill: '#c9d2de', sw: 2, part: 'hose' }),
        circ(L + 166, G - 68, 3.5, { fill: '#f0f3f7', sw: 1.6, part: 'hose' }),
        // 水を おくり出す ポンプ
        rect(L + 104, G - 46, 88, 20, { rx: 4, fill: '#b9c3d1', part: 'pump' }),
        circ(L + 126, G - 36, 6, { fill: STEEL_D, sw: 2, part: 'pump' }),
        circ(L + 170, G - 36, 6, { fill: STEEL_D, sw: 2, part: 'pump' }),
        siren(L + 60, G - 96, 44, 'lamp'),
        lamp(L + 8, G - 32, 6, LAMP_Y, null),
        wheels([L + 42, L + 158], 22)
      ].join('');
    }
  };

  ART.ladder = {
    label: 'はしご車', w: 316, h: 158,
    draw: function (L) {
      var body = '#e02f2f';
      var px = L + 150, py = G - 104;
      var rad = -34 * Math.PI / 180;
      var len = 168;
      var tx = px + len * Math.cos(rad);
      var ty = py + len * Math.sin(rad);
      var rungs = '';
      for (var i = 1; i < 9; i++) {
        rungs += line(px + i * 19, py - 13, px + i * 19, py + 13, { sw: 3, stroke: shade(body, 0.7) });
      }
      return [
        '<g' + P('ashi') + '>' +
        path('M' + n(L + 60) + ' ' + n(G - 58) + 'L' + n(L + 26) + ' ' + n(G - 58) +
          'L' + n(L + 26) + ' ' + n(G - 12), { sw: 8, stroke: '#3f4a5c' }) +
        rect(L + 12, G - 14, 30, 11, { rx: 3, fill: '#55637a' }) +
        path('M' + n(L + 272) + ' ' + n(G - 58) + 'L' + n(L + 302) + ' ' + n(G - 58) +
          'L' + n(L + 302) + ' ' + n(G - 12), { sw: 8, stroke: '#3f4a5c' }) +
        rect(L + 288, G - 14, 30, 11, { rx: 3, fill: '#55637a' }) +
        '</g>',
        rect(L, G - 96, 316, 40, { rx: 8, fill: body, part: 'body' }),
        rect(L, G - 96, 92, 40, { rx: 8, fill: body, part: 'cab' }),
        glass(L + 8, G - 90, 34, 24),
        glass(L + 50, G - 90, 34, 24),
        // 高い ところに とどく はしご
        '<g' + P('ladder') + ' transform="rotate(-34 ' + n(px) + ' ' + n(py) + ')">' +
        rect(px - 14, py - 16, len, 32, { rx: 6, fill: shade(body, 1.12) }) +
        rungs +
        rect(px + 96, py - 11, len - 100, 22, { rx: 5, fill: '#f4b8b8', sw: 2.5 }) +
        '</g>',
        circ(px, py, 13, { fill: shade(body, 0.8), part: 'ladder' }),
        rect(tx - 6, ty - 22, 30, 22, { rx: 4, fill: '#fff', sw: 2.5, part: 'ladder' }),
        siren(L + 116, G - 96, 44, 'lamp'),
        wheels([L + 48, L + 236, L + 282], 23)
      ].join('');
    }
  };

  ART.police = {
    label: 'パトカー', w: 140, h: 74,
    draw: function (L) {
      return [
        rect(L, G - 34, 140, 24, { rx: 10, fill: '#2b2f3a', part: 'body' }),
        poly([[L + 30, G - 33], [L + 46, G - 56], [L + 96, G - 56], [L + 112, G - 33]],
          { fill: '#f5f7fa', part: 'cab' }),
        rect(L + 46, G - 34, 66, 12, { fill: '#f5f7fa', sw: 0 }),
        poly([[L + 38, G - 35], [L + 50, G - 52], [L + 68, G - 52], [L + 68, G - 35]],
          { fill: GLASS, sw: 2, part: 'window' }),
        poly([[L + 73, G - 35], [L + 73, G - 52], [L + 92, G - 52], [L + 104, G - 35]],
          { fill: GLASS, sw: 2, part: 'window' }),
        // 上に ついた あかい ランプ
        '<g' + P('lamp') + '>' +
        rect(L + 52, G - 66, 42, 11, { rx: 4, fill: LAMP_R, sw: 2.5 }) +
        rect(L + 56, G - 63, 14, 5, { rx: 2, fill: '#ffdada', sw: 0 }) +
        '</g>',
        // むせんの アンテナ
        line(L + 100, G - 56, L + 106, G - 74, { sw: 3, part: 'antenna' }),
        circ(L + 106, G - 76, 3.5, { fill: '#2b2f3a', sw: 2, part: 'antenna' }),
        wheels([L + 32, L + 110], 14)
      ].join('');
    }
  };

  ART.wrecker = {
    label: 'レッカー車', w: 208, h: 116,
    draw: function (L) {
      var body = '#3f8fbf';
      var px = L + 130, py = G - 92;
      return [
        rect(L + 40, G - 58, 168, 10, { fill: STEEL_D, rx: 3, sw: 2 }),
        rect(L + 62, G - 88, 146, 30, { rx: 6, fill: STEEL, part: 'body' }),
        // 車を つり上げる うで
        '<g' + P('arm') + ' transform="rotate(-22 ' + n(px) + ' ' + n(py) + ')">' +
        rect(px - 8, py - 12, 96, 24, { rx: 7, fill: body }) +
        rect(px + 46, py - 8, 52, 16, { rx: 5, fill: shade(body, 1.18), sw: 2.5 }) +
        '</g>',
        circ(px, py, 11, { fill: shade(body, 0.8), part: 'arm' }),
        line(L + 218, G - 132, L + 218, G - 96, { sw: 2.5 }),
        poly([[L + 211, G - 96], [L + 225, G - 96], [L + 222, G - 82], [L + 214, G - 82]],
          { fill: '#e5544b', part: 'hook' }),
        rect(L, G - 106, 62, 48, { rx: 11, fill: body, part: 'cab' }),
        glass(L + 7, G - 100, 42, 22),
        siren(L + 30, G - 106, 36, 'lamp'),
        wheels([L + 42, L + 152], 23)
      ].join('');
    }
  };

  ART.snowplow = {
    label: 'じょせつ車', w: 236, h: 114,
    draw: function (L) {
      var body = '#e8a33c';
      return [
        rect(L + 60, G - 58, 176, 10, { fill: STEEL_D, rx: 3, sw: 2 }),
        rect(L + 86, G - 104, 150, 48, { rx: 6, fill: STEEL, part: 'hopper' }),
        line(L + 86, G - 84, L + 236, G - 84, { sw: 2, stroke: STEEL_D, part: 'hopper' }),
        rect(L + 20, G - 104, 66, 48, { rx: 11, fill: body, part: 'cab' }),
        glass(L + 28, G - 98, 46, 24),
        // ゆきを おしのける はね（ブレード）
        path('M' + n(L + 22) + ' ' + n(G - 74) + 'Q' + n(L - 2) + ' ' + n(G - 40) + ' ' +
          n(L + 4) + ' ' + n(G - 4) + 'L' + n(L + 30) + ' ' + n(G - 4) +
          'Q' + n(L + 22) + ' ' + n(G - 40) + ' ' + n(L + 44) + ' ' + n(G - 70) + 'Z',
          { fill: '#e0632f', part: 'plow' }),
        line(L + 6, G - 30, L + 26, G - 30, { sw: 3, stroke: '#fff', part: 'plow' }),
        siren(L + 52, G - 104, 38, 'lamp'),
        wheels([L + 64, L + 178, L + 222], 23)
      ].join('');
    }
  };

  ART.blood = {
    label: 'けんけつ車', w: 258, h: 106,
    draw: function (L) {
      var body = '#e05a7a';
      return [
        rect(L, G - 106, 258, 84, { rx: 12, fill: '#ffffff', part: 'body' }),
        rect(L, G - 44, 258, 12, { fill: body, sw: 0 }),
        glass(L + 8, G - 98, 42, 32),
        // ベッドと まど
        glass(L + 100, G - 96, 54, 30, { part: 'window' }),
        glass(L + 168, G - 96, 54, 30, { part: 'window' }),
        rect(L + 106, G - 62, 42, 11, { rx: 4, fill: '#f4dbe2', sw: 2, part: 'bed' }),
        rect(L + 174, G - 62, 42, 11, { rx: 4, fill: '#f4dbe2', sw: 2, part: 'bed' }),
        // のりおりする とびらと かいだん
        rect(L + 58, G - 98, 30, 66, { rx: 4, fill: GLASS, sw: 2.5, part: 'door' }),
        rect(L + 56, G - 22, 34, 8, { rx: 2, fill: STEEL_D, sw: 2, part: 'door' }),
        cross(L + 236, G - 74, 11, body, 'mark'),
        lamp(L + 10, G - 34, 6, LAMP_Y, null),
        wheels([L + 46, L + 210], 22)
      ].join('');
    }
  };

  /* ---------- くらしを ささえる ---------- */

  ART.garbage = {
    label: 'ごみしゅうしゅう車', w: 202, h: 100,
    draw: function (L) {
      var body = '#5ab88a';
      return [
        rect(L + 40, G - 58, 162, 10, { fill: STEEL_D, rx: 3, sw: 2 }),
        // ごみを ためる ところ
        rect(L + 62, G - 96, 108, 40, { rx: 5, fill: body, part: 'nidai' }),
        rect(L + 62, G - 56, 108, 24, { rx: 4, fill: shade(body, 0.85), sw: 2.5, part: 'nidai' }),
        // ごみを 入れて まわす ところ
        rect(L + 168, G - 92, 34, 62, { rx: 5, fill: shade(body, 0.78), part: 'hopper' }),
        path('M' + n(L + 174) + ' ' + n(G - 54) + 'a12 12 0 1 0 22 6',
          { sw: 3.5, stroke: '#f3f6f9', part: 'hopper' }),
        rect(L, G - 100, 60, 44, { rx: 11, fill: body, part: 'cab' }),
        glass(L + 7, G - 94, 40, 22),
        lamp(L + 8, G - 40, 5.5, LAMP_Y, null),
        wheels([L + 42, L + 148], 22)
      ].join('');
    }
  };

  ART.sweeper = {
    label: 'そうじ車', w: 176, h: 96,
    draw: function (L) {
      var body = '#4e9ac9';
      return [
        rect(L + 34, G - 58, 142, 10, { fill: STEEL_D, rx: 3, sw: 2 }),
        // ごみと 水を ためる タンク
        rect(L + 66, G - 92, 110, 36, { rx: 16, fill: '#e8ecf2', part: 'tank' }),
        rect(L, G - 96, 58, 40, { rx: 10, fill: body, part: 'cab' }),
        glass(L + 6, G - 90, 38, 20),
        // ぐるぐる まわる ブラシ
        '<g' + P('brush') + '>' +
        circ(L + 28, G - 16, 16, { fill: '#f0b429' }) +
        line(L + 28, G - 32, L + 28, G, { sw: 2.5, stroke: '#a97c12' }) +
        line(L + 12, G - 16, L + 44, G - 16, { sw: 2.5, stroke: '#a97c12' }) +
        line(L + 17, G - 27, L + 39, G - 5, { sw: 2.5, stroke: '#a97c12' }) +
        line(L + 39, G - 27, L + 17, G - 5, { sw: 2.5, stroke: '#a97c12' }) +
        '</g>',
        // 水を まく ノズル
        rect(L + 96, G - 52, 42, 10, { rx: 3, fill: STEEL_D, part: 'nozzle' }),
        wheels([L + 40, L + 142], 19)
      ].join('');
    }
  };

  ART.water = {
    label: 'きゅうすい車', w: 230, h: 106,
    draw: function (L) {
      var body = '#3fa9d6';
      return [
        rect(L + 42, G - 58, 188, 10, { fill: STEEL_D, rx: 3, sw: 2 }),
        // きれいな 水を 入れる タンク
        rect(L + 72, G - 102, 158, 46, { rx: 12, fill: '#eaf4fb', part: 'tank' }),
        line(L + 150, G - 100, L + 150, G - 58, { sw: 2, stroke: GLASS_D, part: 'tank' }),
        rect(L + 118, G - 110, 24, 10, { rx: 3, fill: STEEL_D, sw: 2, part: 'tank' }),
        // 水を くばる じゃぐち
        '<g' + P('tap') + '>' +
        rect(L + 196, G - 54, 30, 14, { rx: 3, fill: '#b9c3d1' }) +
        line(L + 204, G - 40, L + 204, G - 26, { sw: 4, stroke: STEEL_D }) +
        line(L + 218, G - 40, L + 218, G - 26, { sw: 4, stroke: STEEL_D }) +
        '</g>',
        rect(L, G - 102, 60, 46, { rx: 11, fill: body, part: 'cab' }),
        glass(L + 7, G - 96, 40, 22),
        lamp(L + 8, G - 42, 5.5, LAMP_Y, null),
        wheels([L + 44, L + 172], 22)
      ].join('');
    }
  };

  ART.kitchen = {
    label: 'キッチンカー', w: 166, h: 96,
    draw: function (L) {
      var body = '#f0894d';
      return [
        rect(L + 36, G - 82, 130, 62, { rx: 7, fill: '#fff6ec', part: 'body' }),
        rect(L, G - 62, 42, 42, { rx: 10, fill: body, part: 'cab' }),
        glass(L + 6, G - 56, 28, 20),
        // はねあげて ひらく まど
        rect(L + 52, G - 96, 98, 12, { rx: 4, fill: body, part: 'window' }),
        line(L + 60, G - 84, L + 56, G - 70, { sw: 3, stroke: STEEL_D, part: 'window' }),
        line(L + 142, G - 84, L + 146, G - 70, { sw: 3, stroke: STEEL_D, part: 'window' }),
        // りょうりを わたす カウンター
        rect(L + 48, G - 62, 108, 10, { rx: 3, fill: '#d9a066', part: 'counter' }),
        // ちょうりだい（コンロ）
        rect(L + 58, G - 48, 40, 22, { rx: 4, fill: '#c8d0dc', sw: 2, part: 'kitchen' }),
        circ(L + 68, G - 40, 5, { fill: '#8f9cb0', sw: 1.8, part: 'kitchen' }),
        circ(L + 86, G - 40, 5, { fill: '#8f9cb0', sw: 1.8, part: 'kitchen' }),
        rect(L + 108, G - 48, 40, 22, { rx: 4, fill: '#c8d0dc', sw: 2, part: 'kitchen' }),
        wheels([L + 30, L + 132], 17)
      ].join('');
    }
  };

  ART.library = {
    label: 'としょかん車', w: 208, h: 100,
    draw: function (L) {
      var body = '#7b74e0';
      var shelf = [];
      for (var i = 0; i < 3; i++) {
        var y = G - 88 + i * 20;
        shelf.push(rect(L + 62, y, 128, 20, { rx: 2, fill: '#fff4e0', sw: 2, part: 'shelf' }));
        for (var k = 0; k < 9; k++) {
          shelf.push(rect(L + 66 + k * 13, y + 4, 8, 14,
            { rx: 1.5, fill: ['#e5544b', '#3f8fbf', '#5ab88a', '#f0b429'][(i + k) % 4], sw: 1.4, part: 'shelf' }));
        }
      }
      return [
        rect(L + 50, G - 96, 158, 74, { rx: 7, fill: body, part: 'body' }),
        shelf.join(''),
        rect(L, G - 74, 54, 52, { rx: 11, fill: body, part: 'cab' }),
        glass(L + 7, G - 68, 36, 22),
        // のりおりの ステップ
        rect(L + 60, G - 22, 34, 8, { rx: 2, fill: STEEL_D, part: 'step' }),
        rect(L + 66, G - 12, 34, 8, { rx: 2, fill: STEEL_D, part: 'step' }),
        wheels([L + 34, L + 168], 19)
      ].join('');
    }
  };

  ART.sightseeing = {
    label: 'かんこうバス', w: 336, h: 116,
    draw: function (L) {
      var body = '#f0b429';
      var win = [];
      for (var i = 0; i < 5; i++) {
        var x = L + 68 + i * 52;
        win.push(glass(x, G - 104, 44, 34));
        win.push(rect(x + 6, G - 92, 14, 22, { rx: 4, fill: SEAT, sw: 2, part: 'seat' }));
        win.push(rect(x + 25, G - 92, 14, 22, { rx: 4, fill: SEAT, sw: 2, part: 'seat' }));
      }
      return [
        rect(L, G - 116, 336, 94, { rx: 18, fill: body, part: 'body' }),
        rect(L, G - 66, 336, 12, { fill: '#e05a7a', sw: 0 }),
        glass(L + 8, G - 110, 48, 44),
        win.join(''),
        // にもつを 入れる ところ（トランク）
        rect(L + 96, G - 50, 90, 24, { rx: 4, fill: shade(body, 0.85), sw: 2.5, part: 'trunk' }),
        rect(L + 216, G - 50, 90, 24, { rx: 4, fill: shade(body, 0.85), sw: 2.5, part: 'trunk' }),
        rect(L + 60, G - 104, 26, 68, { rx: 4, fill: GLASS, sw: 2.5, part: 'door' }),
        lamp(L + 12, G - 40, 6, LAMP_Y, null),
        wheels([L + 56, L + 272], 24)
      ].join('');
    }
  };

  ART.tractor = {
    label: 'トラクター', w: 134, h: 100,
    draw: function (L) {
      var body = '#4aa564';
      return [
        rect(L + 16, G - 62, 82, 26, { rx: 6, fill: body, part: 'body' }),
        rect(L + 44, G - 96, 48, 36, { rx: 7, fill: shade(body, 1.12), part: 'cab' }),
        glass(L + 50, G - 90, 36, 22),
        // つちを たがやす ロータリー
        '<g' + P('rotary') + '>' +
        rect(L + 96, G - 46, 38, 30, { rx: 4, fill: '#e0632f' }) +
        line(L + 104, G - 16, L + 104, G - 4, { sw: 3.5, stroke: '#8f9cb0' }) +
        line(L + 115, G - 16, L + 115, G - 4, { sw: 3.5, stroke: '#8f9cb0' }) +
        line(L + 126, G - 16, L + 126, G - 4, { sw: 3.5, stroke: '#8f9cb0' }) +
        '</g>',
        // 大きな うしろの タイヤ
        '<g' + P('bigtire') + '>' +
        circ(L + 76, G - 32, 32, { fill: TIRE }) +
        circ(L + 76, G - 32, 13, { fill: HUB, sw: 2 }) +
        line(L + 56, G - 52, L + 96, G - 12, { sw: 3, stroke: '#5a6575' }) +
        line(L + 56, G - 12, L + 96, G - 52, { sw: 3, stroke: '#5a6575' }) +
        '</g>',
        wheel(L + 22, 17)
      ].join('');
    }
  };

  /* =====================================================================
     そとに 出す ぶぶん
     ===================================================================== */

  /* 大きさくらべ用の「1年生」（せの高さ やく 1.2メートル）
     おなじ しゅくしゃくで となりに 立たせると、車の 大きさが 分かる */
  function person() {
    var x = 13, top = G - 34;
    return '<g class="art-person" opacity=".5">' +
      circ(x, top + 5, 5.5, { fill: '#8b97ab', stroke: '#5d6a80', sw: 2 }) +
      line(x, top + 11, x, G - 13, { sw: 6, stroke: '#8b97ab' }) +
      line(x - 6, G - 19, x, G - 24, { sw: 3.5, stroke: '#8b97ab' }) +
      line(x + 6, G - 19, x, G - 24, { sw: 3.5, stroke: '#8b97ab' }) +
      line(x - 5, G, x, G - 14, { sw: 4.5, stroke: '#8b97ab' }) +
      line(x + 5, G, x, G - 14, { sw: 4.5, stroke: '#8b97ab' }) +
      '</g>';
  }

  function render(id, mode) {
    var a = ART[id];
    if (!a) return '';
    var scale = mode === 'scale';
    /* 大きさくらべでは 左はしを そろえて かく（ながさの ちがいが すぐ 分かる） */
    var L = scale ? 46 : CX - a.w / 2;
    var vb, par;
    if (scale) {
      vb = '0 20 400 198';
      par = 'xMinYMid meet';
    } else {
      vb = n(L - 16) + ' ' + n(G - a.h - 20) + ' ' + n(a.w + 32) + ' ' + n(a.h + 40);
      par = 'xMidYMid meet';
    }
    return '<svg class="car-art" viewBox="' + vb + '" xmlns="http://www.w3.org/2000/svg" ' +
      'preserveAspectRatio="' + par + '" role="img" aria-label="' + a.label + 'の え">' +
      ell(L + a.w / 2, G + 5, a.w / 2 + 10, 6, { fill: SHADOW, stroke: 'none', sw: 0 }) +
      (scale ? person() : '') +
      a.draw(L) +
      '</svg>';
  }

  window.carArt = {
    svg: function (id, mode) { return render(id, mode || 'fit'); },
    size: function (id) { return ART[id] ? { w: ART[id].w, h: ART[id].h } : null; },
    has: function (id) { return !!ART[id]; },
    ids: function () { return Object.keys(ART); },
    METER: M
  };
})();
