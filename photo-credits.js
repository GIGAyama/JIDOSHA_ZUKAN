/* =========================================================================
   photo-credits.js — 写真の でどころ（クレジット）

   assets/ の 写真は、Wikimedia Commons で 利用が ゆるされて いる 本物の 写真
   （CC0・パブリックドメイン・CC BY・CC BY-SA）だけを つかって います。
   ライセンスの 条件として、撮影者・ライセンス・元の ページを 表示します。
   表示する ところ：①②③の ページと 本の ページの 写真の 下／credits.html（一覧）

   ■ きまり（assets/README.md に くわしく）
     ・会社の ロゴ・会社名・車種名、消防や 警察などの 標章、ナンバー、人の 顔は
       ぼかすか 切りぬく（changes に 書く）。赤十字の 標章が ある 車は 写真に しない
     ・cars-data.js の photo と、ここの file は おなじ パスに する
     ・CC BY-SA の 写真は、加工した この 画像も CC BY-SA で 公開して いる あつかい
       （LICENSE の 但し書きの とおり、MIT は assets/ には かからない）

   ■ 1台ぶんの 形
     <id>: {
       file:    'assets/<id>.webp',
       title:   'File:〜.jpg',                       … Commons の ファイル名
       author:  '撮影者',                            … Commons の Artist（そのまま）
       license: 'CC BY-SA 4.0',
       licenseUrl: 'https://creativecommons.org/licenses/by-sa/4.0/',
       source:  'https://commons.wikimedia.org/wiki/File:〜',
       changes: '切りぬき・縮小・ナンバーと 文字を ぼかし'
     }
   ========================================================================= */

window.photoCredits = {};
