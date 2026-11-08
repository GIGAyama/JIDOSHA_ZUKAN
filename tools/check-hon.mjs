#!/usr/bin/env node
// ==========================================================================
// check-hon.mjs — 車の ページの 中身（hon-data.js）を 検査する
//
//   node tools/check-hon.mjs                 … hon-data.js を 検査（60台 そろって いるかも 見る）
//   node tools/check-hon.mjs <batch.json…>   … 書きかけの 原稿（{ "<id>": {…} }）を 検査
//
// 見る こと（どれも 1年生が 読む ページとして こまる もの）
//   ・ふりがなの ない 漢字、rt が かなでない、ルビの 形が こわれて いる
//   ・教科書の 型（「その ために」「しごとを して います」）を 書いて しまって いる
//     → どれが しごとで どれが つくりかを 子どもが 見分ける 学習に ならない
//   ・見出しや ひとことに「しごと」「つくり」と 書いて いる（どこを 読めば よいかの こたえに なる）
//   ・しごと（k:s）2つ・つくり（k:t）5つ・その ほか（k:o）1つ より すくない
//   ・part が その 車の 絵（car-art.js の data-part）に ない
//   ・src（しらべた ところ）が 2つ より すくない
//
// ⚠️ 事実が 正しいかは 機械では 見られない。src を 読んで 人が たしかめる こと。
// ==========================================================================
import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';
import { fileURLToPath } from 'node:url';

const repo = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const rest = process.argv.slice(2);
if (rest.length === 0) rest.push('--all');
const ctx = { window: {} };
vm.createContext(ctx);
for (const f of ['car-art.js', 'cars-data.js', 'parts-data.js']) {
  vm.runInContext(fs.readFileSync(`${repo}/${f}`, 'utf8'), ctx, { filename: f });
}
const W = ctx.window;
const cars = new Map(W.carsData.map((c) => [c.id, c]));
const partsOf = (car) => new Set([...W.carArt.svg(car.art, 'fit').matchAll(/data-part="([^"]+)"/g)].map((m) => m[1]));

let data = {};
const all = rest[0] === '--all';
if (all) {
  vm.runInContext(fs.readFileSync(`${repo}/hon-data.js`, 'utf8'), ctx, { filename: 'hon-data.js' });
  data = W.honData;
} else {
  for (const f of rest) Object.assign(data, JSON.parse(fs.readFileSync(f, 'utf8')));
}

const errs = [], warns = [];
const E = (id, m) => errs.push(`${id}: ${m}`);
const Wn = (id, m) => warns.push(`${id}: ${m}`);

const KANJI = /[㐀-鿿豈-﫿々〆]/;
const plain = (h) => h.replace(/<rt>.*?<\/rt>/g, '').replace(/<[^>]+>/g, '');
const norm = (s) => s.replace(/\s+/g, ' ').trim();

function checkText(id, where, html, { maxLen = 90, sentence = false } = {}) {
  if (typeof html !== 'string' || !html.trim()) { E(id, `${where}: 空`); return; }
  const tags = [...html.matchAll(/<\/?([a-zA-Z]+)[^>]*>/g)].map((m) => m[1].toLowerCase());
  const bad = tags.filter((t) => t !== 'ruby' && t !== 'rt');
  if (bad.length) E(id, `${where}: 使えない タグ ${[...new Set(bad)].join(',')}`);
  if ((html.match(/<ruby>/g) || []).length !== (html.match(/<\/ruby>/g) || []).length) E(id, `${where}: <ruby> の 閉じ忘れ`);
  // ruby の 中身: <ruby>漢字<rt>かな</rt></ruby>
  for (const m of html.matchAll(/<ruby>(.*?)<\/ruby>/g)) {
    const inner = m[1];
    const mm = inner.match(/^([^<]+)<rt>([^<]+)<\/rt>$/);
    if (!mm) { E(id, `${where}: ruby の 形が ちがう「${inner}」`); continue; }
    if (!KANJI.test(mm[1])) Wn(id, `${where}: ruby の 中に 漢字が ない「${mm[1]}」`);
    if (!/^[ぁ-ゟ゠-ヿー]+$/.test(mm[2])) E(id, `${where}: rt が かなでない「${mm[2]}」`);
  }
  // ruby の 外に 漢字が のこって いないか
  const outside = html.replace(/<ruby>.*?<\/ruby>/g, '');
  const k = outside.match(new RegExp(KANJI.source, 'g'));
  if (k) E(id, `${where}: ふりがなの ない 漢字「${[...new Set(k)].join('')}」`);
  const p = norm(plain(html));
  if (p.length > maxLen) E(id, `${where}: ながすぎる（${p.length}字）「${p}」`);
  if (/[Ａ-Ｚａ-ｚ０-９]/.test(p)) E(id, `${where}: 全角英数字は 半角に「${p}」`);
  if (/[A-Za-z]/.test(p)) Wn(id, `${where}: 英字が ある「${p}」`);
  if (sentence) {
    if (!/[。！？]$/.test(p)) E(id, `${where}: 「。」で おわって いない「${p}」`);
    if (p.length > 16 && !/ /.test(p)) E(id, `${where}: 分かち書きに なって いない「${p}」`);
    if (/その ?ために/.test(p)) E(id, `${where}: 「その ために」は 本では つかわない（子どもが じぶんで つなぐ）「${p}」`);
    if (/しごとを ?して ?います/.test(p)) E(id, `${where}: 「しごとを して います」は 本では つかわない「${p}」`);
    if (/^(これ|それ|この|その|ここ|そこ)/.test(p)) Wn(id, `${where}: 「これ/それ/この/その」で はじまる 文は、1文だけ ノートに うつすと いみが とおらない「${p}」`);
  }
}

const seen = new Set();
for (const [id, e] of Object.entries(data)) {
  if (id.startsWith('_')) continue;
  const car = cars.get(id);
  if (!car) { E(id, 'cars-data.js に ない id'); continue; }
  seen.add(id);
  const parts = partsOf(car);
  checkText(id, 'catch', e.catch, { maxLen: 40 });
  // 見出しと ひとことに「しごと」「つくり」と 書くと、どこを 読めば よいかの こたえに なる
  const noLabel = (where, html) => {
    if (typeof html === 'string' && /しごと|つくり/.test(norm(plain(html)))) {
      E(id, `${where}: 「しごと」「つくり」と いう ことばは 見出しに つかわない（どこが こたえかを 教えて しまう）「${norm(plain(html))}」`);
    }
  };
  noLabel('catch', e.catch);
  if (!Array.isArray(e.pages) || e.pages.length < 3 || e.pages.length > 6) E(id, `pages は 3〜6（${e.pages && e.pages.length}）`);
  const cnt = { s: 0, t: 0, o: 0 }, usedParts = new Set(), texts = new Set();
  let total = 0;
  (e.pages || []).forEach((pg, i) => {
    checkText(id, `pages[${i}].h`, pg.h, { maxLen: 22 });
    noLabel(`pages[${i}].h`, pg.h);
    if (!Array.isArray(pg.s) || pg.s.length < 2 || pg.s.length > 6) E(id, `pages[${i}].s は 2〜6（${pg.s && pg.s.length}）`);
    (pg.s || []).forEach((s, j) => {
      const w = `pages[${i}].s[${j}]`;
      total++;
      checkText(id, w, s.t, { maxLen: 75, sentence: true });
      if (!['s', 't', 'o'].includes(s.k)) E(id, `${w}: k は s/t/o`);
      else cnt[s.k]++;
      if (s.part !== undefined) {
        if (!parts.has(s.part)) E(id, `${w}: part「${s.part}」は この 車の 絵に ない（つかえる: ${[...parts].join(',')}）`);
        else usedParts.add(s.part);
      }
      const key = norm(plain(s.t || ''));
      if (texts.has(key)) E(id, `${w}: おなじ 文が 2かい`);
      texts.add(key);
      const extra = Object.keys(s).filter((x) => !['t', 'k', 'part'].includes(x));
      if (extra.length) E(id, `${w}: しらない キー ${extra.join(',')}`);
    });
  });
  if (total < 11 || total > 18) E(id, `文の かずは 11〜18（${total}）`);
  if (cnt.s < 2) E(id, `しごと（k:s）の 文が 2つ より すくない（${cnt.s}）`);
  if (cnt.t < 5) E(id, `つくり（k:t）の 文が 5つ より すくない（${cnt.t}）`);
  if (cnt.o < 1) E(id, `その ほか（k:o）の 文が ない`);
  if (usedParts.size < 2) E(id, `part の ついた 文が 2しゅるい より すくない（${[...usedParts].join(',')}）`);
  if (!Array.isArray(e.kazu) || e.kazu.length < 2 || e.kazu.length > 5) E(id, `kazu は 2〜5`);
  (e.kazu || []).forEach((kz, i) => {
    checkText(id, `kazu[${i}].l`, kz.l, { maxLen: 16 });
    checkText(id, `kazu[${i}].v`, kz.v, { maxLen: 30 });
    if (!/[0-9]/.test(plain(kz.v || ''))) E(id, `kazu[${i}].v に すうじが ない`);
  });
  if (!Array.isArray(e.src) || e.src.length < 2) E(id, `src は 2つ いじょう`);
  (e.src || []).forEach((s, i) => {
    if (!s.n || !/^https:\/\//.test(s.u || '')) E(id, `src[${i}] は { n, u(https) }`);
  });
  const extraTop = Object.keys(e).filter((x) => !['catch', 'pages', 'kazu', 'src', '_concerns'].includes(x));
  if (extraTop.length) E(id, `しらない キー ${extraTop.join(',')}`);
}
if (all) for (const id of cars.keys()) if (!seen.has(id)) E(id, 'hon-data.js に ない');

// 子どもが 読む 文に、自前で 配る フォント（fonts.config.json）に ない 漢字が ないか。
// ない 字は 端末の 書体に おちて、その 字だけ 形が かわる（□には ならない）。
// 止めは しない。足すなら fonts.config.json の extra に 入れて build-fonts を 走らせる。
try {
  const { kanjiForGrades } = await import('./fonts/chars.mjs');
  const cfg = JSON.parse(fs.readFileSync(`${repo}/fonts.config.json`, 'utf8'));
  const have = new Set([...kanjiForGrades(cfg.grades || []) + (cfg.extra || '')]);
  for (const f of cfg.scan || []) {
    try { for (const ch of fs.readFileSync(`${repo}/${f}`, 'utf8')) have.add(ch); } catch (e) { /* なければ とばす */ }
  }
  for (const [id, e] of Object.entries(data)) {
    if (id.startsWith('_') || !e || !e.pages) continue;
    let kid = e.catch || '';
    e.pages.forEach((pg) => { kid += pg.h; (pg.s || []).forEach((s) => { kid += s.t; }); });
    (e.kazu || []).forEach((k) => { kid += k.l + k.v; });
    const miss = [...new Set([...plain(kid)].filter((c) => KANJI.test(c) && !have.has(c)))];
    if (miss.length) Wn(id, `フォントに ない 漢字「${miss.join('')}」→ fonts.config.json の extra に 足して node tools/fonts/build-fonts.mjs`);
  }
} catch (err) {
  Wn('-', `フォントの しらべに しっぱい: ${err.message}`);
}

for (const w of warns) console.log('warn ' + w);
for (const e of errs) console.log('NG   ' + e);
console.log(`\n${seen.size} 台 / NG ${errs.length} / warn ${warns.length}`);
process.exit(errs.length ? 1 : 0);
