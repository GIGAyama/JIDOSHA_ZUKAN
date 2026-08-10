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

  ART.trailer = {
    label: 'トレーラー', w: 420, h: 126,
    draw: function (L) {
      var body = '#c94f4f';
      var con = '#4a7fd0';
      return [
        rect(L + 40, G - 60, 380, 10, { fill: STEEL_D, rx: 3, sw: 2 }),
        // ながい コンテナ
        rect(L + 96, G - 124, 324, 66, { rx: 4, fill: con, part: 'container' }),
        line(L + 180, G - 124, L + 180, G - 58, { sw: 2, stroke: shade(con, 0.78), part: 'container' }),
        line(L + 264, G - 124, L + 264, G - 58, { sw: 2, stroke: shade(con, 0.78), part: 'container' }),
        line(L + 348, G - 124, L + 348, G - 58, { sw: 2, stroke: shade(con, 0.78), part: 'container' }),
        rect(L + 392, G - 120, 24, 58, { rx: 3, fill: shade(con, 0.88), sw: 2.5, part: 'container' }),
        // くるりと うごく つなぎめ
        '<g' + P('joint') + '>' +
        circ(L + 106, G - 52, 14, { fill: STEEL_D }) +
        circ(L + 106, G - 52, 5, { fill: '#eef2f7', sw: 2 }) +
        '</g>',
        bigCab(L, G - 116, 68, body),
        wheels([L + 44, L + 120, L + 330, L + 376], 25)
      ].join('');
    }
  };

  ART.reefer = {
    label: 'れいとう車', w: 182, h: 92,
    draw: function (L) {
      var body = '#6fb7e0';
      return [
        // あつい かべの にだい
        rect(L + 40, G - 76, 142, 54, { rx: 5, fill: '#ffffff', part: 'wall' }),
        rect(L + 47, G - 69, 128, 40, { rx: 3, fill: '#e8f4fb', sw: 2, part: 'wall' }),
        // 中を ひやす きかい
        '<g' + P('cooler') + '>' +
        rect(L + 46, G - 92, 48, 18, { rx: 4, fill: '#b9c3d1' }) +
        line(L + 56, G - 88, L + 56, G - 78, { sw: 2.5, stroke: STEEL_D }) +
        line(L + 65, G - 88, L + 65, G - 78, { sw: 2.5, stroke: STEEL_D }) +
        line(L + 74, G - 88, L + 74, G - 78, { sw: 2.5, stroke: STEEL_D }) +
        '</g>',
        mark(L + 130, G - 50, 26, '❄', '#5aa9d6'),
        rect(L, G - 62, 44, 40, { rx: 10, fill: body, part: 'cab' }),
        glass(L + 6, G - 56, 28, 18),
        lamp(L + 6, G - 28, 5, LAMP_Y, null),
        wheels([L + 30, L + 148], 17)
      ].join('');
    }
  };

  ART.moving = {
    label: 'ひっこし車', w: 212, h: 104,
    draw: function (L) {
      var body = '#e0a83c';
      return [
        rect(L + 44, G - 58, 166, 10, { fill: STEEL_D, rx: 3, sw: 2 }),
        // せの 高い にだい
        rect(L + 56, G - 104, 154, 48, { rx: 5, fill: '#fdf7ea', part: 'nidai' }),
        rect(L + 56, G - 104, 154, 14, { rx: 4, fill: body, sw: 2, part: 'nidai' }),
        // つんで ある かぐ
        rect(L + 66, G - 86, 32, 30, { rx: 3, fill: '#d9a066', sw: 2 }),
        line(L + 66, G - 71, L + 98, G - 71, { sw: 1.8, stroke: '#a97645' }),
        rect(L + 106, G - 86, 26, 30, { rx: 3, fill: '#c8d0dc', sw: 2 }),
        rect(L + 140, G - 82, 30, 26, { rx: 3, fill: '#9fc7a8', sw: 2 }),
        // 上下に うごく あげさげ台
        '<g' + P('gate') + '>' +
        rect(L + 176, G - 44, 36, 9, { rx: 2, fill: '#b9c3d1' }) +
        line(L + 194, G - 35, L + 194, G - 16, { sw: 3.5, stroke: STEEL_D }) +
        path('M' + n(L + 194) + ' ' + n(G - 56) + 'l-8 10h16z', { fill: STEEL_D, sw: 2 }) +
        '</g>',
        rect(L, G - 92, 56, 70, { rx: 11, fill: body, part: 'cab' }),
        glass(L + 7, G - 86, 38, 22),
        lamp(L + 8, G - 32, 5, LAMP_Y, null),
        wheels([L + 34, L + 168], 19)
      ].join('');
    }
  };

  ART.schoolbus = {
    label: 'スクールバス', w: 252, h: 104,
    draw: function (L) {
      var body = '#f5c33b';
      var win = [];
      for (var i = 0; i < 3; i++) {
        var x = L + 92 + i * 54;
        win.push(glass(x, G - 94, 44, 32));
        win.push(rect(x + 6, G - 86, 13, 22, { rx: 4, fill: SEAT, sw: 2, part: 'seat' }));
        win.push(rect(x + 25, G - 86, 13, 22, { rx: 4, fill: SEAT, sw: 2, part: 'seat' }));
      }
      return [
        rect(L, G - 104, 252, 82, { rx: 14, fill: body, part: 'body' }),
        rect(L + 6, G - 100, 36, 12, { rx: 4, fill: '#20364d', sw: 2 }),
        glass(L + 8, G - 84, 36, 32),
        rect(L + 54, G - 94, 26, 62, { rx: 4, fill: GLASS, sw: 2.5, part: 'door' }),
        win.join(''),
        // 小さい 子でも のりやすい ひくい かいだん
        '<g' + P('step') + '>' +
        rect(L + 50, G - 28, 34, 8, { rx: 2, fill: STEEL_D }) +
        rect(L + 56, G - 17, 34, 8, { rx: 2, fill: STEEL_D }) +
        '</g>',
        lamp(L + 10, G - 34, 5.5, LAMP_Y, null),
        wheels([L + 48, L + 204], 22)
      ].join('');
    }
  };

  ART.cash = {
    label: 'げんきんゆそう車', w: 154, h: 88,
    draw: function (L) {
      var body = '#5a6575';
      return [
        // かんたんに あかない かたい はこ
        rect(L + 40, G - 88, 114, 66, { rx: 5, fill: '#8b98ad', part: 'safe' }),
        rect(L + 50, G - 80, 94, 50, { rx: 3, fill: '#6f7c92', sw: 2, part: 'safe' }),
        circ(L + 132, G - 55, 7, { fill: '#dfe5ee', sw: 2, part: 'safe' }),
        rect(L, G - 66, 44, 44, { rx: 9, fill: body, part: 'cab' }),
        // とても 小さな まど
        glass(L + 8, G - 60, 20, 14, { part: 'window' }),
        rect(L + 64, G - 78, 22, 13, { rx: 3, fill: GLASS, sw: 2.5, part: 'window' }),
        lamp(L + 6, G - 30, 5, LAMP_Y, null),
        wheels([L + 30, L + 120], 16)
      ].join('');
    }
  };

  ART.welfare = {
    label: 'ふくし車', w: 150, h: 70,
    draw: function (L) {
      var body = '#6fae8f';
      return [
        rect(L, G - 70, 118, 50, { rx: 12, fill: '#f7f9fc', part: 'body' }),
        rect(L, G - 34, 118, 8, { fill: body, sw: 0 }),
        glass(L + 7, G - 64, 24, 20),
        glass(L + 37, G - 64, 24, 20),
        // のせた 車いす
        circ(L + 88, G - 32, 11, { fill: 'none', stroke: '#55637a', sw: 3 }),
        rect(L + 80, G - 56, 8, 26, { rx: 3, fill: SEAT, sw: 2 }),
        rect(L + 88, G - 40, 20, 7, { rx: 2, fill: SEAT, sw: 2 }),
        // 車いすを ゆかに とめる ベルト
        '<g' + P('belt') + '>' +
        line(L + 74, G - 22, L + 84, G - 36, { sw: 3.5, stroke: '#e5544b' }) +
        line(L + 104, G - 22, L + 94, G - 36, { sw: 3.5, stroke: '#e5544b' }) +
        '</g>',
        // 車いすが のぼる スロープ
        poly([[L + 108, G - 22], [L + 118, G - 30], [L + 150, G - 4], [L + 136, G - 4]],
          { fill: '#b9c3d1', part: 'slope' }),
        wheels([L + 28, L + 96], 16)
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

  ART.loader = {
    label: 'ホイールローダー', w: 196, h: 108,
    draw: function (L) {
      var body = '#f0b429';
      return [
        rect(L + 92, G - 74, 96, 42, { rx: 8, fill: body, part: 'body' }),
        rect(L + 110, G - 108, 56, 36, { rx: 8, fill: shade(body, 1.08), part: 'cab' }),
        glass(L + 116, G - 102, 44, 24),
        // すくい上げる うで
        path('M' + n(L + 100) + ' ' + n(G - 66) + 'L' + n(L + 50) + ' ' + n(G - 54),
          { sw: 14, stroke: body, part: 'arm' }),
        path('M' + n(L + 100) + ' ' + n(G - 66) + 'L' + n(L + 50) + ' ' + n(G - 54),
          { sw: 3, stroke: STROKE, part: 'arm' }),
        // たくさん すくえる バケット
        poly([[L + 52, G - 60], [L + 20, G - 46], [L + 6, G - 14], [L + 54, G - 14]],
          { fill: shade(body, 0.8), part: 'bucket' }),
        line(L + 8, G - 16, L + 52, G - 16, { sw: 4, stroke: '#f5f7fa', part: 'bucket' }),
        // みぞの ふかい 大きな タイヤ
        '<g' + P('bigtire') + '>' +
        circ(L + 68, G - 26, 26, { fill: TIRE }) +
        circ(L + 68, G - 26, 11, { fill: HUB, sw: 2 }) +
        circ(L + 160, G - 26, 26, { fill: TIRE }) +
        circ(L + 160, G - 26, 11, { fill: HUB, sw: 2 }) +
        '</g>'
      ].join('');
    }
  };

  ART.paver = {
    label: 'ほそう車', w: 176, h: 106,
    draw: function (L) {
      var body = '#f2a93b';
      return [
        '<g' + P('crawler') + '>' +
        rect(L + 30, G - 32, 116, 32, { rx: 16, fill: '#4a5568' }) +
        circ(L + 50, G - 16, 10, { fill: '#77839a', sw: 2 }) +
        circ(L + 126, G - 16, 10, { fill: '#77839a', sw: 2 }) +
        '</g>',
        rect(L + 40, G - 76, 104, 46, { rx: 6, fill: body, part: 'body' }),
        // アスファルトを うける ホッパー
        poly([[L + 4, G - 80], [L + 62, G - 80], [L + 52, G - 44], [L + 16, G - 44]],
          { fill: '#b9c3d1', part: 'hopper' }),
        line(L + 12, G - 72, L + 56, G - 72, { sw: 3, stroke: '#5a6575', part: 'hopper' }),
        rect(L + 58, G - 106, 62, 8, { rx: 3, fill: shade(body, 0.9), part: 'roof' }),
        line(L + 64, G - 98, L + 64, G - 78, { sw: 4, stroke: STROKE, part: 'roof' }),
        line(L + 114, G - 98, L + 114, G - 78, { sw: 4, stroke: STROKE, part: 'roof' }),
        rect(L + 74, G - 96, 24, 22, { rx: 4, fill: SEAT, sw: 2, part: 'seat' }),
        // たいらに ならす いた（スクリード）
        '<g' + P('screed') + '>' +
        rect(L + 132, G - 42, 44, 20, { rx: 3, fill: STEEL_D }) +
        rect(L + 128, G - 24, 48, 8, { rx: 2, fill: '#e8ecf2' }) +
        '</g>'
      ].join('');
    }
  };

  ART.pumpcar = {
    label: 'コンクリートポンプ車', w: 308, h: 172,
    draw: function (L) {
      var body = '#3f7fbf';
      var px = L + 148, py = G - 104;
      var ax = L + 194, ay = G - 162;
      var bx = L + 280, by = G - 132;
      return [
        '<g' + P('ashi') + '>' +
        path('M' + n(L + 76) + ' ' + n(G - 62) + 'L' + n(L + 46) + ' ' + n(G - 62) +
          'L' + n(L + 46) + ' ' + n(G - 14), { sw: 8, stroke: '#3f4a5c' }) +
        rect(L + 32, G - 16, 30, 12, { rx: 3, fill: '#55637a' }) +
        path('M' + n(L + 260) + ' ' + n(G - 62) + 'L' + n(L + 290) + ' ' + n(G - 62) +
          'L' + n(L + 290) + ' ' + n(G - 14), { sw: 8, stroke: '#3f4a5c' }) +
        rect(L + 276, G - 16, 30, 12, { rx: 3, fill: '#55637a' }) +
        '</g>',
        rect(L + 44, G - 60, 264, 10, { fill: STEEL_D, rx: 3, sw: 2 }),
        rect(L + 70, G - 88, 236, 28, { rx: 6, fill: STEEL, part: 'body' }),
        // おれまがりながら のびる うで（ブーム）
        '<g' + P('boom') + '>' +
        path('M' + n(px) + ' ' + n(py) + 'L' + n(ax) + ' ' + n(ay) + 'L' + n(bx) + ' ' + n(by),
          { sw: 15, stroke: body }) +
        path('M' + n(px) + ' ' + n(py) + 'L' + n(ax) + ' ' + n(ay) + 'L' + n(bx) + ' ' + n(by),
          { sw: 3, stroke: STROKE }) +
        circ(ax, ay, 8, { fill: shade(body, 1.2), sw: 2.5 }) +
        '</g>',
        circ(px, py, 12, { fill: shade(body, 0.8), part: 'boom' }),
        // コンクリートが 出る ホース
        path('M' + n(bx) + ' ' + n(by) + 'q10 22 -4 40', { sw: 7, stroke: '#8b98ad' }),
        bigCab(L, G - 112, 64, body),
        wheels([L + 44, L + 214, L + 262], 25)
      ].join('');
    }
  };

  ART.breaker = {
    label: 'かいたい車', w: 258, h: 174,
    draw: function (L) {
      var body = '#e0632f';
      return [
        '<g' + P('crawler') + '>' +
        rect(L + 8, G - 42, 152, 42, { rx: 21, fill: '#4a5568' }) +
        circ(L + 30, G - 21, 12, { fill: '#77839a', sw: 2 }) +
        circ(L + 138, G - 21, 12, { fill: '#77839a', sw: 2 }) +
        circ(L + 84, G - 21, 9, { fill: '#77839a', sw: 2 }) +
        '</g>',
        rect(L + 28, G - 90, 112, 50, { rx: 9, fill: body, part: 'body' }),
        rect(L + 34, G - 128, 52, 40, { rx: 9, fill: shade(body, 1.12), part: 'cab' }),
        glass(L + 40, G - 122, 38, 24),
        // 高い ところまで とどく ながい うで
        path('M' + n(L + 130) + ' ' + n(G - 82) + 'L' + n(L + 176) + ' ' + n(G - 164) +
          'L' + n(L + 234) + ' ' + n(G - 110), { sw: 13, stroke: body, part: 'arm' }),
        path('M' + n(L + 130) + ' ' + n(G - 82) + 'L' + n(L + 176) + ' ' + n(G - 164) +
          'L' + n(L + 234) + ' ' + n(G - 110), { sw: 3, stroke: STROKE, part: 'arm' }),
        // かべを かみくだく 大きな 手
        '<g' + P('nipper') + '>' +
        poly([[L + 228, G - 114], [L + 252, G - 106], [L + 244, G - 84], [L + 224, G - 92]],
          { fill: '#8b98ad' }) +
        poly([[L + 230, G - 116], [L + 254, G - 124], [L + 258, G - 102], [L + 240, G - 98]],
          { fill: '#b9c3d1' }) +
        '</g>'
      ].join('');
    }
  };

  ART.grader = {
    label: 'グレーダー', w: 238, h: 120,
    draw: function (L) {
      var body = '#f0b429';
      return [
        // ながい からだ
        rect(L + 34, G - 74, 178, 20, { rx: 8, fill: body, part: 'body' }),
        rect(L + 150, G - 94, 62, 26, { rx: 7, fill: body, part: 'body' }),
        rect(L + 156, G - 120, 50, 28, { rx: 7, fill: shade(body, 1.08), part: 'cab' }),
        glass(L + 162, G - 115, 38, 20),
        // 土を けずる ながい は（ブレード）
        '<g' + P('blade') + '>' +
        line(L + 108, G - 72, L + 118, G - 48, { sw: 5, stroke: '#55637a' }) +
        rect(L + 84, G - 46, 78, 13, { rx: 3, fill: '#b9c3d1' }) +
        line(L + 90, G - 32, L + 156, G - 32, { sw: 4, stroke: STEEL_D }) +
        '</g>',
        line(L + 28, G - 68, L + 28, G - 30, { sw: 7, stroke: shade(body, 0.78) }),
        wheel(L + 28, 18),
        wheels([L + 180, L + 216], 22)
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

  ART.rescue = {
    label: 'きゅうじょ車', w: 196, h: 108,
    draw: function (L) {
      var body = '#e02f2f';
      var box = [];
      [L + 62, L + 128].forEach(function (x) {
        box.push(rect(x, G - 86, 60, 42, { rx: 4, fill: '#f0f3f7', sw: 2.5, part: 'box' }));
        box.push(line(x + 4, G - 74, x + 56, G - 74, { sw: 2, stroke: '#a9b4c4', part: 'box' }));
        box.push(line(x + 4, G - 62, x + 56, G - 62, { sw: 2, stroke: '#a9b4c4', part: 'box' }));
        box.push(line(x + 4, G - 50, x + 56, G - 50, { sw: 2, stroke: '#a9b4c4', part: 'box' }));
      });
      return [
        rect(L, G - 98, 196, 76, { rx: 9, fill: body, part: 'body' }),
        glass(L + 8, G - 92, 40, 26),
        box.join(''),
        // つなを まきとる ウインチ
        '<g' + P('winch') + '>' +
        rect(L + 2, G - 42, 42, 18, { rx: 4, fill: '#b9c3d1' }) +
        circ(L + 23, G - 33, 7, { fill: STEEL_D, sw: 2 }) +
        '</g>',
        siren(L + 60, G - 98, 44, 'lamp'),
        wheels([L + 42, L + 152], 21)
      ].join('');
    }
  };

  ART.foam = {
    label: 'かがくしょうぼう車', w: 252, h: 128,
    draw: function (L) {
      var body = '#e02f2f';
      return [
        rect(L, G - 100, 252, 78, { rx: 9, fill: body, part: 'body' }),
        glass(L + 8, G - 94, 38, 26),
        rect(L + 52, G - 94, 32, 30, { rx: 4, fill: GLASS, sw: 2.5, part: 'cab' }),
        // あわの もとを ためる タンク
        rect(L + 96, G - 92, 144, 42, { rx: 18, fill: '#f0f3f7', part: 'tank' }),
        line(L + 168, G - 90, L + 168, G - 52, { sw: 2, stroke: '#c9d2de', part: 'tank' }),
        // むきを かえられる ふとい ノズル
        '<g' + P('turret') + '>' +
        rect(L + 152, G - 114, 22, 16, { rx: 4, fill: '#b9c3d1' }) +
        path('M' + n(L + 166) + ' ' + n(G - 110) + 'L' + n(L + 210) + ' ' + n(G - 126),
          { sw: 10, stroke: STEEL_D }) +
        '</g>',
        siren(L + 62, G - 100, 44, 'lamp'),
        lamp(L + 8, G - 34, 6, LAMP_Y, null),
        wheels([L + 46, L + 190], 22)
      ].join('');
    }
  };

  ART.doctorcar = {
    label: 'ドクターカー', w: 140, h: 78,
    draw: function (L) {
      return [
        rect(L, G - 68, 140, 48, { rx: 12, fill: '#ffffff', part: 'body' }),
        rect(L, G - 32, 140, 8, { fill: '#e5544b', sw: 0 }),
        glass(L + 8, G - 62, 28, 22),
        glass(L + 42, G - 62, 32, 22),
        // つんで ある きゅうきゅうバッグ
        rect(L + 90, G - 54, 36, 26, { rx: 4, fill: '#e5544b', sw: 2, part: 'kit' }),
        cross(L + 108, G - 41, 8, '#ffffff', 'kit'),
        siren(L + 62, G - 68, 40, 'lamp'),
        lamp(L + 6, G - 28, 5, LAMP_Y, null),
        wheels([L + 30, L + 108], 16)
      ].join('');
    }
  };

  ART.xray = {
    label: 'けんしん車', w: 252, h: 104,
    draw: function (L) {
      var body = '#8fa8d8';
      return [
        rect(L, G - 104, 252, 82, { rx: 12, fill: '#ffffff', part: 'body' }),
        rect(L, G - 48, 252, 10, { fill: body, sw: 0 }),
        glass(L + 8, G - 98, 40, 30),
        // レントゲンを とる きかいの へや
        rect(L + 106, G - 96, 132, 52, { rx: 5, fill: '#eef2f9', sw: 2.5, part: 'machine' }),
        rect(L + 116, G - 88, 46, 36, { rx: 4, fill: '#c8d0dc', sw: 2, part: 'machine' }),
        circ(L + 139, G - 70, 9, { fill: '#8f9cb0', sw: 2, part: 'machine' }),
        rect(L + 176, G - 88, 52, 36, { rx: 4, fill: '#dfe6f1', sw: 2, part: 'machine' }),
        line(L + 184, G - 78, L + 220, G - 78, { sw: 2, stroke: '#a9b4c4', part: 'machine' }),
        // かいだんの ついた とびら
        rect(L + 60, G - 98, 32, 62, { rx: 4, fill: GLASS, sw: 2.5, part: 'door' }),
        rect(L + 56, G - 28, 36, 8, { rx: 2, fill: STEEL_D, part: 'door' }),
        rect(L + 62, G - 17, 36, 8, { rx: 2, fill: STEEL_D, part: 'door' }),
        lamp(L + 10, G - 36, 5.5, LAMP_Y, null),
        wheels([L + 46, L + 204], 22)
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

  ART.waterworks = {
    label: 'すいどうこうじ車', w: 158, h: 98,
    draw: function (L) {
      var body = '#3f8fbf';
      return [
        rect(L + 36, G - 58, 108, 10, { fill: STEEL_D, rx: 3, sw: 2 }),
        // どうぐを しまう はこ
        '<g' + P('box') + '>' +
        rect(L + 44, G - 84, 68, 28, { rx: 4, fill: '#e8ecf2', sw: 2.5 }) +
        line(L + 78, G - 84, L + 78, G - 56, { sw: 2, stroke: '#a9b4c4' }) +
        circ(L + 72, G - 70, 3, { fill: STEEL_D, sw: 1.6 }) +
        circ(L + 84, G - 70, 3, { fill: STEEL_D, sw: 1.6 }) +
        '</g>',
        // 地めんを ほる ちいさな うで
        path('M' + n(L + 118) + ' ' + n(G - 72) + 'L' + n(L + 138) + ' ' + n(G - 98) +
          'L' + n(L + 150) + ' ' + n(G - 62), { sw: 10, stroke: '#f0b429', part: 'arm' }),
        path('M' + n(L + 118) + ' ' + n(G - 72) + 'L' + n(L + 138) + ' ' + n(G - 98) +
          'L' + n(L + 150) + ' ' + n(G - 62), { sw: 2.5, stroke: STROKE, part: 'arm' }),
        poly([[L + 144, G - 64], [L + 158, G - 60], [L + 152, G - 40], [L + 138, G - 42]],
          { fill: '#d99a1f', part: 'arm' }),
        rect(L, G - 88, 46, 66, { rx: 10, fill: body, part: 'cab' }),
        glass(L + 6, G - 82, 32, 20),
        lamp(L + 8, G - 30, 5, LAMP_Y, null),
        wheels([L + 30, L + 118], 17)
      ].join('');
    }
  };

  ART.shop = {
    label: 'いどうはんばい車', w: 140, h: 96,
    draw: function (L) {
      var body = '#e0632f';
      var goods = [];
      for (var i = 0; i < 3; i++) {
        var y = G - 78 + i * 20;
        goods.push(rect(L + 40, y, 54, 5, { rx: 2, fill: '#d9a066', sw: 1.8, part: 'shelf' }));
        goods.push(rect(L + 44, y - 12, 14, 12, { rx: 2, fill: ['#e5544b', '#5ab88a', '#f0b429'][i], sw: 1.6, part: 'shelf' }));
        goods.push(rect(L + 64, y - 12, 14, 12, { rx: 2, fill: ['#5ab88a', '#f0b429', '#e5544b'][i], sw: 1.6, part: 'shelf' }));
      }
      return [
        rect(L + 34, G - 84, 106, 62, { rx: 6, fill: '#fff6ec', part: 'body' }),
        // はねあげて ひらく かべ（＝ たな）
        rect(L + 36, G - 96, 102, 12, { rx: 4, fill: body, part: 'shelf' }),
        goods.join(''),
        // ひやして おく ところ
        rect(L + 100, G - 74, 34, 44, { rx: 4, fill: '#cfe6f2', sw: 2, part: 'cooler' }),
        line(L + 100, G - 54, L + 134, G - 54, { sw: 2, stroke: GLASS_D, part: 'cooler' }),
        rect(L, G - 62, 36, 40, { rx: 9, fill: body, part: 'cab' }),
        glass(L + 5, G - 56, 24, 18),
        wheels([L + 26, L + 112], 16)
      ].join('');
    }
  };

  ART.kei = {
    label: 'けいトラック', w: 98, h: 56,
    draw: function (L) {
      var body = '#f5f7fa';
      return [
        rect(L + 34, G - 40, 64, 20, { rx: 3, fill: '#d9dfe8', part: 'nidai' }),
        rect(L + 34, G - 40, 64, 6, { rx: 2, fill: '#b9c3d1', sw: 2, part: 'nidai' }),
        // のせた やさいの はこ
        rect(L + 42, G - 54, 22, 14, { rx: 2, fill: '#e0b878', sw: 2 }),
        rect(L + 68, G - 52, 20, 12, { rx: 2, fill: '#9fc7a8', sw: 2 }),
        rect(L, G - 54, 38, 34, { rx: 7, fill: body, part: 'body' }),
        glass(L + 5, G - 49, 26, 16),
        lamp(L + 4, G - 26, 4, LAMP_Y, null),
        wheels([L + 18, L + 80], 12)
      ].join('');
    }
  };

  ART.gas = {
    label: 'ガスこうじ車', w: 140, h: 92,
    draw: function (L) {
      var body = '#f0b429';
      return [
        rect(L, G - 74, 140, 54, { rx: 11, fill: '#f7f9fc', part: 'body' }),
        rect(L, G - 40, 140, 8, { fill: body, sw: 0 }),
        glass(L + 7, G - 68, 28, 20),
        glass(L + 42, G - 68, 28, 20),
        // ガスもれを しらべる きかい
        '<g' + P('detector') + '>' +
        rect(L + 88, G - 62, 42, 30, { rx: 4, fill: '#c8d0dc' }) +
        circ(L + 100, G - 50, 6, { fill: '#5ab88a', sw: 2 }) +
        line(L + 112, G - 56, L + 126, G - 44, { sw: 3, stroke: STEEL_D }) +
        '</g>',
        // こうじちゅうを しらせる きいろい ランプ
        '<g' + P('lamp') + '>' +
        rect(L + 64, G - 78, 14, 6, { rx: 2, fill: STEEL_D, sw: 2 }) +
        circ(L + 71, G - 86, 8, { fill: LAMP_Y, sw: 2.5 }) +
        '</g>',
        wheels([L + 30, L + 108], 17)
      ].join('');
    }
  };

  /* ---------- そだてる・とる ---------- */

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

  ART.combine = {
    label: 'コンバイン', w: 158, h: 114,
    draw: function (L) {
      var body = '#e5544b';
      return [
        '<g' + P('crawler') + '>' +
        rect(L + 34, G - 32, 110, 32, { rx: 16, fill: '#4a5568' }) +
        circ(L + 54, G - 16, 10, { fill: '#77839a', sw: 2 }) +
        circ(L + 124, G - 16, 10, { fill: '#77839a', sw: 2 }) +
        '</g>',
        rect(L + 40, G - 80, 104, 48, { rx: 7, fill: body, part: 'body' }),
        // つぶだけを ためて おく はこ
        rect(L + 78, G - 112, 68, 34, { rx: 6, fill: '#f0b429', part: 'tank' }),
        path('M' + n(L + 144) + ' ' + n(G - 104) + 'L' + n(L + 158) + ' ' + n(G - 92),
          { sw: 8, stroke: '#d99a1f', part: 'tank' }),
        rect(L + 36, G - 112, 40, 34, { rx: 7, fill: shade(body, 1.14), part: 'cab' }),
        glass(L + 41, G - 107, 30, 22),
        // いねを かきこんで かりとる ところ
        '<g' + P('reel') + '>' +
        rect(L, G - 44, 46, 24, { rx: 4, fill: '#c8d0dc' }) +
        line(L + 4, G - 24, L + 42, G - 24, { sw: 3.5, stroke: STEEL_D }) +
        circ(L + 20, G - 62, 15, { fill: 'none', stroke: '#8f9cb0', sw: 3 }) +
        line(L + 5, G - 62, L + 35, G - 62, { sw: 3, stroke: '#8f9cb0' }) +
        line(L + 20, G - 77, L + 20, G - 47, { sw: 3, stroke: '#8f9cb0' }) +
        '</g>'
      ].join('');
    }
  };

  ART.rice = {
    label: 'たうえき', w: 108, h: 90,
    draw: function (L) {
      var body = '#4aa564';
      return [
        // なえを ならべる ななめの たな
        '<g' + P('tray') + '>' +
        poly([[L + 48, G - 90], [L + 104, G - 68], [L + 98, G - 56], [L + 42, G - 78]],
          { fill: '#cfe6d6' }) +
        line(L + 54, G - 84, L + 96, G - 68, { sw: 2.5, stroke: '#7fae90' }) +
        line(L + 66, G - 86, L + 60, G - 72, { sw: 2, stroke: '#7fae90' }) +
        line(L + 82, G - 80, L + 76, G - 66, { sw: 2, stroke: '#7fae90' }) +
        '</g>',
        rect(L + 12, G - 56, 58, 26, { rx: 6, fill: body, part: 'body' }),
        rect(L + 22, G - 78, 24, 22, { rx: 5, fill: SEAT, sw: 2, part: 'seat' }),
        line(L + 48, G - 60, L + 58, G - 74, { sw: 3 }),
        // なえを 土に さしこむ つめ
        '<g' + P('planter') + '>' +
        rect(L + 66, G - 34, 38, 15, { rx: 3, fill: '#e0632f' }) +
        line(L + 74, G - 19, L + 71, G - 4, { sw: 3.5, stroke: '#8f9cb0' }) +
        line(L + 86, G - 19, L + 83, G - 4, { sw: 3.5, stroke: '#8f9cb0' }) +
        line(L + 98, G - 19, L + 95, G - 4, { sw: 3.5, stroke: '#8f9cb0' }) +
        '</g>',
        wheels([L + 20, L + 56], 13)
      ].join('');
    }
  };

  ART.mower = {
    label: 'くさかり車', w: 124, h: 90,
    draw: function (L) {
      var body = '#f0b429';
      return [
        rect(L + 10, G - 58, 62, 26, { rx: 6, fill: body, part: 'body' }),
        rect(L + 24, G - 90, 42, 34, { rx: 7, fill: shade(body, 1.1), part: 'cab' }),
        glass(L + 29, G - 85, 32, 22),
        // よこに のびる うで
        path('M' + n(L + 68) + ' ' + n(G - 64) + 'L' + n(L + 96) + ' ' + n(G - 60) +
          'L' + n(L + 104) + ' ' + n(G - 42), { sw: 9, stroke: shade(body, 0.8), part: 'arm' }),
        // かった くさが とばない ように かこう カバー
        path('M' + n(L + 82) + ' ' + n(G - 32) + 'a20 20 0 0 1 40 0',
          { sw: 6, stroke: '#55637a', part: 'guard' }),
        // ぐるぐる まわる は
        '<g' + P('cutter') + '>' +
        circ(L + 102, G - 28, 13, { fill: '#c8d0dc' }) +
        line(L + 89, G - 28, L + 115, G - 28, { sw: 3, stroke: STEEL_D }) +
        line(L + 102, G - 41, L + 102, G - 15, { sw: 3, stroke: STEEL_D }) +
        '</g>',
        wheels([L + 22, L + 62], 16)
      ].join('');
    }
  };

  ART.logger = {
    label: '木を はこぶ 車', w: 280, h: 128,
    draw: function (L) {
      var body = '#5a7d4a';
      var stakes = [];
      [L + 96, L + 152, L + 208, L + 262].forEach(function (x) {
        stakes.push(rect(x, G - 104, 8, 46, { rx: 2, fill: '#8b98ad', part: 'stake' }));
      });
      return [
        rect(L + 44, G - 60, 236, 10, { fill: STEEL_D, rx: 3, sw: 2 }),
        // つんだ まるた
        rect(L + 92, G - 82, 176, 24, { rx: 12, fill: '#c99a5e' }),
        rect(L + 100, G - 100, 160, 22, { rx: 11, fill: '#d9ab72' }),
        circ(L + 264, G - 70, 11, { fill: '#e6c79b', sw: 2 }),
        stakes.join(''),
        // 木を つかんで もち上げる うで
        '<g' + P('grapple') + '>' +
        path('M' + n(L + 74) + ' ' + n(G - 88) + 'L' + n(L + 84) + ' ' + n(G - 126) +
          'L' + n(L + 128) + ' ' + n(G - 118), { sw: 9, stroke: '#f0b429' }) +
        path('M' + n(L + 128) + ' ' + n(G - 118) + 'l-9 16', { sw: 5, stroke: '#8f9cb0' }) +
        path('M' + n(L + 128) + ' ' + n(G - 118) + 'l11 13', { sw: 5, stroke: '#8f9cb0' }) +
        '</g>',
        bigCab(L, G - 114, 64, body),
        wheels([L + 44, L + 194, L + 242], 24)
      ].join('');
    }
  };

  ART.sprayer = {
    label: 'くすりを まく 車', w: 186, h: 94,
    draw: function (L) {
      var body = '#4aa564';
      var noz = [];
      [L + 126, L + 150, L + 174].forEach(function (x) {
        noz.push(line(x, G - 50, x, G - 38, { sw: 2.5, stroke: STEEL_D, part: 'boom' }));
        noz.push(path('M' + n(x) + ' ' + n(G - 38) + 'l-6 12', { sw: 2, stroke: '#9fc7d8', part: 'boom' }));
        noz.push(path('M' + n(x) + ' ' + n(G - 38) + 'l6 12', { sw: 2, stroke: '#9fc7d8', part: 'boom' }));
      });
      return [
        rect(L + 8, G - 60, 68, 26, { rx: 6, fill: body, part: 'body' }),
        rect(L + 18, G - 94, 42, 36, { rx: 7, fill: shade(body, 1.12), part: 'cab' }),
        glass(L + 23, G - 89, 32, 22),
        // くすりを ためる タンク
        rect(L + 62, G - 86, 58, 36, { rx: 15, fill: '#eef4ef', part: 'tank' }),
        // よこに ながく のびる うで（ブーム）
        rect(L + 108, G - 57, 78, 8, { rx: 3, fill: '#8b98ad', part: 'boom' }),
        noz.join(''),
        wheels([L + 22, L + 96], 18)
      ].join('');
    }
  };

  /* ---------- くうこう・みなと・えき ---------- */

  ART.towing = {
    label: 'トーイングカー', w: 140, h: 58,
    draw: function (L) {
      var body = '#5aa9d6';
      return [
        // ひこうきの 下に 入れる ひくい からだ
        rect(L + 10, G - 36, 124, 24, { rx: 6, fill: body, part: 'body' }),
        rect(L + 34, G - 58, 46, 24, { rx: 6, fill: shade(body, 1.1), part: 'cab' }),
        glass(L + 39, G - 53, 36, 15),
        // ひこうきと つなぐ かなぐ
        '<g' + P('hitch') + '>' +
        rect(L, G - 32, 24, 13, { rx: 3, fill: STEEL_D }) +
        circ(L + 7, G - 25, 4, { fill: '#eef2f7', sw: 2 }) +
        '</g>',
        lamp(L + 126, G - 42, 5, LAMP_Y, null),
        wheels([L + 34, L + 112], 14)
      ].join('');
    }
  };

  ART.fueler = {
    label: 'きゅうゆ車', w: 252, h: 158,
    draw: function (L) {
      var body = '#4a7fd0';
      return [
        rect(L + 44, G - 58, 208, 10, { fill: STEEL_D, rx: 3, sw: 2 }),
        // あぶらを ためる ながい タンク
        rect(L + 74, G - 106, 178, 50, { rx: 25, fill: STEEL, part: 'tank' }),
        line(L + 140, G - 104, L + 140, G - 58, { sw: 2, stroke: STEEL_D, part: 'tank' }),
        line(L + 200, G - 104, L + 200, G - 58, { sw: 2, stroke: STEEL_D, part: 'tank' }),
        // つばさまで とどく あがる 台
        '<g' + P('lift') + '>' +
        line(L + 190, G - 106, L + 190, G - 132, { sw: 5, stroke: STEEL_D }) +
        line(L + 220, G - 106, L + 220, G - 132, { sw: 5, stroke: STEEL_D }) +
        rect(L + 174, G - 136, 58, 10, { rx: 3, fill: '#b9c3d1' }) +
        line(L + 178, G - 136, L + 178, G - 156, { sw: 3, stroke: STEEL_D }) +
        line(L + 228, G - 136, L + 228, G - 156, { sw: 3, stroke: STEEL_D }) +
        line(L + 178, G - 156, L + 228, G - 156, { sw: 3, stroke: STEEL_D }) +
        '</g>',
        bigCab(L, G - 108, 64, body),
        wheels([L + 44, L + 178, L + 224], 24)
      ].join('');
    }
  };

  ART.cargoloader = {
    label: 'ハイリフトローダー', w: 168, h: 132,
    draw: function (L) {
      var body = '#4e9d8c';
      var rollers = [];
      for (var i = 0; i < 6; i++) {
        rollers.push(circ(L + 52 + i * 20, G - 100, 6, { fill: '#e8ecf2', sw: 2, part: 'roller' }));
      }
      // ひこうきに つみこむ にもつ
      return [
        rect(L + 66, G - 130, 78, 30, { rx: 4, fill: '#e0b878', sw: 2 }),
        // そのまま 上へ もち上がる ゆか
        '<g' + P('deck') + '>' +
        rect(L + 46, G - 46, 112, 10, { rx: 3, fill: '#8b98ad' }) +
        path('M' + n(L + 70) + ' ' + n(G - 88) + 'L' + n(L + 132) + ' ' + n(G - 46), { sw: 6, stroke: STEEL_D }) +
        path('M' + n(L + 132) + ' ' + n(G - 88) + 'L' + n(L + 70) + ' ' + n(G - 46), { sw: 6, stroke: STEEL_D }) +
        rect(L + 40, G - 98, 126, 12, { rx: 3, fill: '#b9c3d1' }) +
        '</g>',
        rollers.join(''),
        rect(L, G - 62, 40, 40, { rx: 9, fill: body, part: 'cab' }),
        glass(L + 5, G - 56, 26, 18),
        wheels([L + 26, L + 140], 16)
      ].join('');
    }
  };

  ART.stairs = {
    label: 'タラップ車', w: 172, h: 134,
    draw: function (L) {
      var body = '#5aa9d6';
      var steps = [];
      for (var i = 0; i < 7; i++) {
        var x = L + 66 + i * 11;
        var y = G - 34 - i * 10;
        steps.push(rect(x, y - 5, 12, 5, { rx: 1.5, fill: '#b9c3d1', sw: 1.6, part: 'stairs' }));
      }
      return [
        // ながい かいだん
        poly([[L + 58, G - 26], [L + 140, G - 100], [L + 164, G - 100], [L + 164, G - 92],
        [L + 80, G - 20], [L + 58, G - 20]], { fill: '#dfe5ee', part: 'stairs' }),
        steps.join(''),
        // 高さを かえられる ぶぶん
        '<g' + P('lift') + '>' +
        rect(L + 126, G - 130, 46, 10, { rx: 3, fill: body }) +
        line(L + 132, G - 120, L + 142, G - 100, { sw: 3, stroke: STEEL_D }) +
        line(L + 166, G - 120, L + 163, G - 100, { sw: 3, stroke: STEEL_D }) +
        '</g>',
        rect(L, G - 68, 52, 46, { rx: 10, fill: body, part: 'cab' }),
        glass(L + 6, G - 62, 34, 20),
        lamp(L + 6, G - 30, 5, LAMP_Y, null),
        wheels([L + 30, L + 120], 17)
      ].join('');
    }
  };

  ART.stacker = {
    label: 'リーチスタッカー', w: 280, h: 172,
    draw: function (L) {
      var body = '#e0632f';
      var px = L + 110, py = G - 92;
      var rad = -30 * Math.PI / 180;
      var len = 140;
      var tx = px + len * Math.cos(rad);
      var ty = py + len * Math.sin(rad);
      return [
        rect(L + 20, G - 84, 182, 46, { rx: 8, fill: body, part: 'body' }),
        rect(L + 32, G - 124, 54, 42, { rx: 8, fill: shade(body, 1.12), part: 'cab' }),
        glass(L + 38, G - 118, 40, 26),
        // ななめに ながく のびる うで
        '<g' + P('arm') + ' transform="rotate(-30 ' + n(px) + ' ' + n(py) + ')">' +
        rect(px - 8, py - 15, len, 30, { rx: 8, fill: '#f0b429' }) +
        rect(px + 76, py - 10, len - 66, 20, { rx: 6, fill: '#f7cf6a', sw: 2.5 }) +
        '</g>',
        circ(px, py, 12, { fill: '#c98a2a', part: 'arm' }),
        // コンテナの かどを つかむ ところ
        '<g' + P('spreader') + '>' +
        rect(tx - 42, ty - 7, 88, 15, { rx: 3, fill: '#8b98ad' }) +
        rect(tx - 42, ty + 8, 11, 16, { rx: 2, fill: STEEL_D }) +
        rect(tx + 35, ty + 8, 11, 16, { rx: 2, fill: STEEL_D }) +
        '</g>',
        rect(tx - 36, ty + 14, 76, 36, { rx: 3, fill: '#4a7fd0', sw: 2.5 }),
        wheels([L + 62, L + 150, L + 188], 26)
      ].join('');
    }
  };

  ART.railcar = {
    label: 'せんろの てんけん車', w: 168, h: 126,
    draw: function (L) {
      var body = '#f0b429';
      var px = L + 100, py = G - 64;
      var rad = -38 * Math.PI / 180;
      var len = 80;
      var tx = px + len * Math.cos(rad);
      var ty = py + len * Math.sin(rad);
      return [
        // せんろ
        line(L - 8, G + 2, L + 176, G + 2, { sw: 5, stroke: '#8b98ad' }),
        // せんろの 上を はしる てつの わ
        '<g' + P('railwheel') + '>' +
        circ(L + 34, G - 16, 17, { fill: '#8b98ad' }) +
        circ(L + 34, G - 16, 6, { fill: HUB, sw: 2 }) +
        circ(L + 130, G - 16, 17, { fill: '#8b98ad' }) +
        circ(L + 130, G - 16, 6, { fill: HUB, sw: 2 }) +
        '</g>',
        rect(L + 8, G - 62, 152, 42, { rx: 7, fill: body, part: 'body' }),
        rect(L + 14, G - 96, 54, 38, { rx: 7, fill: shade(body, 1.1), part: 'cab' }),
        glass(L + 20, G - 90, 42, 24),
        // レールを とりかえる ちいさな クレーン
        '<g' + P('arm') + ' transform="rotate(-38 ' + n(px) + ' ' + n(py) + ')">' +
        rect(px - 6, py - 9, len, 18, { rx: 6, fill: '#8b98ad' }) +
        '</g>',
        circ(px, py, 9, { fill: STEEL_D, part: 'arm' }),
        line(tx, ty, tx, ty + 26, { sw: 2.5 }),
        poly([[tx - 7, ty + 26], [tx + 7, ty + 26], [tx + 4, ty + 38], [tx - 4, ty + 38]],
          { fill: '#e5544b', part: 'hook' })
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
      /* いちばん ながい トレーラー（やく 15メートル）まで 入る はば */
      vb = '0 20 490 198';
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
