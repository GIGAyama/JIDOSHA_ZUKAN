/* =========================================================================
   photo-credits.js — 写真の でどころ（クレジット）

   assets/ の 写真は、Wikimedia Commons で 利用が ゆるされて いる 本物の 写真
   （CC0・パブリックドメイン・CC BY・CC BY-SA）だけを つかって います。
   ライセンスの 条件として、撮影者・ライセンス・元の ページを 表示します。
   表示する ところ：車の ページの 写真の 下（撮影者と ライセンス）と、ページの いちばん 下の
                   「おとなの かたへ」（ファイル名・元の ページ・かえた ところ）／credits.html（一覧）

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

window.photoCredits = {
  truck: {
    file: 'assets/truck.webp',
    title: 'File:Hino Auto Plaza Hino Profia FR Cargo.jpg',
    author: 'Ypy31',
    license: 'CC0',
    licenseUrl: 'https://creativecommons.org/publicdomain/zero/1.0/',
    source: 'https://commons.wikimedia.org/wiki/File:Hino_Auto_Plaza_Hino_Profia_FR_Cargo.jpg',
    changes: '切りぬき・縮小・にだいの よこの 車種名と 宣伝の 文字、メーカーの エンブレムと 名まえの 板、部品の 文字、うしろの 車の マーク、小さな 刻印を ぼかし'
  },
  bus: {
    file: 'assets/bus.webp',
    title: 'File:Keio-Bus D-010.jpg',
    author: 'MaedaAkihiko',
    license: 'CC BY-SA 4.0',
    licenseUrl: 'https://creativecommons.org/licenses/by-sa/4.0/',
    source: 'https://commons.wikimedia.org/wiki/File:Keio-Bus_D-010.jpg',
    changes: '切りぬき・縮小・行き先の 表示、会社名と ロゴ、車番、ナンバー、まどの はり紙、運転席の 人と 中の 人を ぼかし'
  },
  car: {
    file: 'assets/car.webp',
    title: 'File:Toyota COROLLA HEV X.jpg',
    author: 'Tokumeigakarinoaoshima',
    license: 'CC0',
    licenseUrl: 'https://creativecommons.org/publicdomain/zero/1.0/',
    source: 'https://commons.wikimedia.org/wiki/File:Toyota_COROLLA_HEV_X.jpg',
    changes: '縮小・メーカーの エンブレム（車の前と タイヤの まん中）、小さな バッジ、うしろの 車の エンブレムと ナンバー・文字、かんばんを ぼかし'
  },
  taxi: {
    file: 'assets/taxi.webp',
    title: 'File:Heiwa Kotsu 7-374 Toyota JPN Taxi.jpg',
    author: 'Ypy31',
    license: 'CC0',
    licenseUrl: 'https://creativecommons.org/publicdomain/zero/1.0/',
    source: 'https://commons.wikimedia.org/wiki/File:Heiwa_Kotsu_7-374_Toyota_JPN_Taxi.jpg',
    changes: '縮小・あんどんの 文字、会社名と TAXI の 文字、地名、車番、メーカーの エンブレム（車の前と ホイールキャップの まん中）、ナンバー、ステッカー（まどの 中の ラベルも）、運転席の 人、うしろの 人と 看板を ぼかし'
  },
  post: {
    file: 'assets/post.webp',
    title: 'File:Daihatsu Hijet 923.JPG',
    author: 'Tennen-Gas',
    license: 'CC BY-SA 3.0',
    licenseUrl: 'https://creativecommons.org/licenses/by-sa/3.0/',
    source: 'https://commons.wikimedia.org/wiki/File:Daihatsu_Hijet_923.JPG',
    changes: '切りぬき・縮小・〒マークと 日本郵便の 文字（はこ・ドア・中の ケース）、メーカーの エンブレムと 車種名、車番、ステッカー、ナンバー、ケースの ラベル、まどの 紙を ぼかし'
  },
  delivery: {
    file: 'assets/delivery.webp',
    title: 'File:Toyota Quick Delivery 200 "Vulture", front right.jpg',
    author: 'Mr.choppers',
    license: 'CC BY-SA 3.0',
    licenseUrl: 'https://creativecommons.org/licenses/by-sa/3.0/',
    source: 'https://commons.wikimedia.org/wiki/File:Toyota_Quick_Delivery_200_%22Vulture%22,_front_right.jpg',
    changes: '切りぬき・縮小・車体の お店の 名まえ、前と うしろの ナンバー、メーカーの 標章、まどと ドアの シール、うしろの お店の 看板の 文字を ぼかし'
  },
  tanker: {
    file: 'assets/tanker.webp',
    title: 'File:Mitsubishi Corporation Energy Tank Truck.jpg',
    author: 'VVVN',
    license: 'CC BY 3.0',
    licenseUrl: 'https://creativecommons.org/licenses/by/3.0/',
    source: 'https://commons.wikimedia.org/wiki/File:Mitsubishi_Corporation_Energy_Tank_Truck.jpg',
    changes: '切りぬき・縮小・タンクと 運転席の 会社名、メーカーの 標章、ナンバーと「危」の 板、機械の メーカー名、消火器の 文字、まどの 紙、うしろの お店の 看板を ぼかし'
  },
  carrier: {
    file: 'assets/carrier.webp',
    title: 'File:トヨタ輸送 05.JPG',
    author: 'Trans5885',
    license: 'Public domain',
    licenseUrl: '',
    source: 'https://commons.wikimedia.org/wiki/File:%E3%83%88%E3%83%A8%E3%82%BF%E8%BC%B8%E9%80%81_05.JPG',
    changes: '切りぬき・縮小・運転席と にだいの 会社名と 番号、「一般」の 札、信号の 地名の 看板、となりの 車の ナンバー、のせた 車の エンブレムを ぼかし'
  },
  trailer: {
    file: 'assets/trailer.webp',
    title: 'File:At Shinko Kobe01bs3090.jpg',
    author: '663highland',
    license: 'CC BY 2.5',
    licenseUrl: 'https://creativecommons.org/licenses/by/2.5/',
    source: 'https://commons.wikimedia.org/wiki/File:At_Shinko_Kobe01bs3090.jpg',
    changes: '切りぬき・縮小・コンテナの 会社名と マーク、ウェブアドレス、コンテナ番号と 札、うしろの たてものの 会社名と 役所の 名まえ、運転席の まどを ぼかし'
  },
  reefer: {
    file: 'assets/reefer.webp',
    title: 'File:2007 Mitsubishi Fuso FM61F refrigerated truck, front left.jpg',
    author: 'Mr.choppers',
    license: 'CC BY-SA 3.0',
    licenseUrl: 'https://creativecommons.org/licenses/by-sa/3.0/',
    source: 'https://commons.wikimedia.org/wiki/File:2007_Mitsubishi_Fuso_FM61F_refrigerated_truck,_front_left.jpg',
    changes: '切りぬき・縮小・メーカーの 標章と 車種名、れいとうきの メーカー名と 銘板、ナンバー、まどや 車体の シールと 札を ぼかし'
  },
  moving: {
    file: 'assets/moving.webp',
    title: 'File:Art Setting Delivery M0601 ex Yamato Home Convinience Dutro XZU600 series (white cab).jpg',
    author: 'Comyu',
    license: 'CC0',
    licenseUrl: 'https://creativecommons.org/publicdomain/zero/1.0/',
    source: 'https://commons.wikimedia.org/wiki/File:Art_Setting_Delivery_M0601_ex_Yamato_Home_Convinience_Dutro_XZU600_series_(white_cab).jpg',
    changes: '切りぬき・縮小・会社の ロゴと 名まえ、車体番号、メーカーの マーク、ナンバー、ステッカーの 文字、運転席の 人、うしろの 看板を ぼかし'
  },
  schoolbus: {
    file: 'assets/schoolbus.webp',
    title: 'File:Koto Wangan Satellite Smart Nursery School Liesse II (Orange-1st).jpg',
    author: 'Comyu',
    license: 'CC BY-SA 4.0',
    licenseUrl: 'https://creativecommons.org/licenses/by-sa/4.0/',
    source: 'https://commons.wikimedia.org/wiki/File:Koto_Wangan_Satellite_Smart_Nursery_School_Liesse_II_(Orange-1st).jpg',
    changes: '切りぬき・縮小・保育園の 名まえと マーク、屋根の 文字、幼児バスの 文字、ナンバー、車の 中の 人、うしろの 看板、とびらの まどの ステッカーと とびらの 下の 小さな 文字の 板を ぼかし'
  },
  cash: {
    file: 'assets/cash.webp',
    title: 'File:The frontview of Isuzu COMO (E26) as an armored car of ALSOK.JPG',
    author: 'Tokumeigakarinoaoshima',
    license: 'CC0',
    licenseUrl: 'https://creativecommons.org/publicdomain/zero/1.0/',
    source: 'https://commons.wikimedia.org/wiki/File:The_frontview_of_Isuzu_COMO_(E26)_as_an_armored_car_of_ALSOK.JPG',
    changes: '切りぬき・縮小・警備会社の ロゴと 文字、号車の 番号、ステッカー、メーカーの マーク、ナンバー、運転席の 人を ぼかし'
  },
  welfare: {
    file: 'assets/welfare.webp',
    title: 'File:The rearview of Toyota Ractis (NCP120) Welcab ver.wheelchair vehicle.JPG',
    author: 'Tokumeigakarinoaoshima',
    license: 'CC0',
    licenseUrl: 'https://creativecommons.org/publicdomain/zero/1.0/',
    source: 'https://commons.wikimedia.org/wiki/File:The_rearview_of_Toyota_Ractis_(NCP120)_Welcab_ver.wheelchair_vehicle.JPG',
    changes: '切りぬき・縮小・会場の 看板と メーカーの マーク、車の ステッカーと 中の ラベルの 文字、となりの 車の マークと プレート、まわりの 人の 顔を ぼかし'
  },
  crane: {
    file: 'assets/crane.webp',
    title: 'File:Rough terrain crane Kato MR-130Ri.jpg',
    author: 'Project Kei',
    license: 'CC BY-SA 4.0',
    licenseUrl: 'https://creativecommons.org/licenses/by-sa/4.0/',
    source: 'https://commons.wikimedia.org/wiki/File:Rough_terrain_crane_Kato_MR-130Ri.jpg',
    changes: '切りぬき（たて長の 写真の 下の ほうを よこ長に）・縮小・運転席の 人の 顔と、車種名の 文字を ぼかし'
  },
  shovel: {
    file: 'assets/shovel.webp',
    title: 'File:Komatsu PC200-8 Hydraulic Excavator -Rakhu Bhagawati,Myagdi-0461.jpg',
    author: 'Bijay Chaurasia',
    license: 'CC BY-SA 4.0',
    licenseUrl: 'https://creativecommons.org/licenses/by-sa/4.0/',
    source: 'https://commons.wikimedia.org/wiki/File:Komatsu_PC200-8_Hydraulic_Excavator_-Rakhu_Bhagawati,Myagdi-0461.jpg',
    changes: '切りぬき・縮小・うでと うしろの メーカー名、型の 文字、シール、うんてんせきの 人を ぼかし'
  },
  bulldozer: {
    file: 'assets/bulldozer.webp',
    title: 'File:Liebherr bulldozer-20240815-RM-171920.jpg',
    author: 'Reinhold Möller Ermell',
    license: 'CC BY-SA 4.0',
    licenseUrl: 'https://creativecommons.org/licenses/by-sa/4.0/',
    source: 'https://commons.wikimedia.org/wiki/File:Liebherr_bulldozer-20240815-RM-171920.jpg',
    changes: '切りぬき・縮小・メーカー名の 文字（ボンネットと やねの 上の 機械）、銘板・シール・うしろの 札の 文字を ぼかし'
  },
  mixer: {
    file: 'assets/mixer.webp',
    title: 'File:コンクリートミキサー車.jpg',
    author: 'Syced',
    license: 'CC0',
    licenseUrl: 'https://creativecommons.org/publicdomain/zero/1.0/',
    source: 'https://commons.wikimedia.org/wiki/File:%E3%82%B3%E3%83%B3%E3%82%AF%E3%83%AA%E3%83%BC%E3%83%88%E3%83%9F%E3%82%AD%E3%82%B5%E3%83%BC%E8%BB%8A.jpg',
    changes: '切りぬき・縮小・ドラムの 文字、うんてんせきの 会社名と 車の 番号、うしろの 番号と シール・ラベル、道路の 標識を ぼかし'
  },
  roller: {
    file: 'assets/roller.webp',
    title: 'File:Singapore SAKAI-W300-Road-Roller-01.jpg',
    author: 'CEphoto, Uwe Aranas',
    license: 'CC BY-SA 3.0',
    licenseUrl: 'https://creativecommons.org/licenses/by-sa/3.0/',
    source: 'https://commons.wikimedia.org/wiki/File:Singapore_SAKAI-W300-Road-Roller-01.jpg',
    changes: '切りぬき・縮小・メーカー名と 車の 名まえ、会社名、注意書きの シール・札の 文字を ぼかし'
  },
  dump: {
    file: 'assets/dump.webp',
    title: 'File:Hino-Purofia-dump.JPG',
    author: '佐藤純一',
    license: 'CC BY-SA 3.0',
    licenseUrl: 'https://creativecommons.org/licenses/by-sa/3.0/',
    source: 'https://commons.wikimedia.org/wiki/File:Hino-Purofia-dump.JPG',
    changes: '切りぬき・縮小・メーカーの エンブレム、うんてんせきの 中の かげ、バンパーと タイヤの 文字、おくの かんばんを ぼかし（ナンバーは もとの 写真で 白く けして ある）'
  },
  aerial: {
    file: 'assets/aerial.webp',
    title: 'File:ISUZU ELF Aerial Work Vehicle.jpg',
    author: 'Mj-bird',
    license: 'CC BY-SA 3.0',
    licenseUrl: 'https://creativecommons.org/licenses/by-sa/3.0/',
    source: 'https://commons.wikimedia.org/wiki/File:ISUZU_ELF_Aerial_Work_Vehicle.jpg',
    changes: '切りぬき・縮小・うでと ドアの 会社名、メーカーの 文字、ドアの 地名シール、ナンバー、かごの 文字、うしろの 看板・駐車場の 看板、左の 車の ナンバーと 車名を ぼかし'
  },
  forklift: {
    file: 'assets/forklift.webp',
    title: 'File:JMSDF Forklift(Nichiyu FB20P, 43-3798) left front view at Maizuru Air Station July 29, 2017.jpg',
    author: 'Hunini',
    license: 'CC BY-SA 4.0',
    licenseUrl: 'https://creativecommons.org/licenses/by-sa/4.0/',
    source: 'https://commons.wikimedia.org/wiki/File:JMSDF_Forklift(Nichiyu_FB20P,_43-3798)_left_front_view_at_Maizuru_Air_Station_July_29,_2017.jpg',
    changes: '切りぬき・縮小・車名と 番号の 文字、ちゅういの シールと 青い 小さな シール、かべの 文字、左の 車の 文字、おくの 人を ぼかし（左の 子どもと 右の ヘリコプターの 番号は 切りぬきで 外した）'
  },
  loader: {
    file: 'assets/loader.webp',
    title: 'File:コマツWA500 運転質量33845kg バケット容量5.6㎥ エンジン出力266kw.jpg',
    author: 'めどい',
    license: 'CC BY-SA 4.0',
    licenseUrl: 'https://creativecommons.org/licenses/by-sa/4.0/',
    source: 'https://commons.wikimedia.org/wiki/File:%E3%82%B3%E3%83%9E%E3%83%84WA500_%E9%81%8B%E8%BB%A2%E8%B3%AA%E9%87%8F33845kg_%E3%83%90%E3%82%B1%E3%83%83%E3%83%88%E5%AE%B9%E9%87%8F5.6%E3%8E%A5_%E3%82%A8%E3%83%B3%E3%82%B8%E3%83%B3%E5%87%BA%E5%8A%9B266kw.jpg',
    changes: '切りぬき・縮小・うでと 運転席と 車体の メーカー名・車種名、番号、ちゅういの シールを ぼかし'
  },
  paver: {
    file: 'assets/paver.webp',
    title: 'File:Japanese Asphalt finisher.jpg',
    author: 'Project Kei',
    license: 'CC BY-SA 4.0',
    licenseUrl: 'https://creativecommons.org/licenses/by-sa/4.0/',
    source: 'https://commons.wikimedia.org/wiki/File:Japanese_Asphalt_finisher.jpg',
    changes: '切りぬき・縮小・メーカー名と 車種名、番号、ちゅういの シール・マーク、ガスボンベの 文字を ぼかし（左はしの はたらく 人は 切りぬきで 外し、のこった くつを ぼかした）'
  },
  pumpcar: {
    file: 'assets/pumpcar.webp',
    title: 'File:Concrete-pump-20120210-001.jpg',
    author: 'Ghouston',
    license: 'CC0',
    licenseUrl: 'https://creativecommons.org/publicdomain/zero/1.0/',
    source: 'https://commons.wikimedia.org/wiki/File:Concrete-pump-20120210-001.jpg',
    changes: '切りぬき・縮小・うでと 車体の メーカー名・会社名、運転席の ドアの 車の 名まえ、車体の 小さな シール、ミキサー車の 会社名、はたらく 人、おくの 車の 文字と 看板を ぼかし（ガードレールの 文字と 右の 案内看板は 切りぬきで 外した）'
  },
  breaker: {
    file: 'assets/breaker.webp',
    title: 'File:Liebherr R 936 (49922072686).jpg',
    author: 'Alexandre Prevot from Nancy, France',
    license: 'CC BY-SA 2.0',
    licenseUrl: 'https://creativecommons.org/licenses/by-sa/2.0/',
    source: 'https://commons.wikimedia.org/wiki/File:Liebherr_R_936_(49922072686).jpg',
    changes: '切りぬき・縮小・うでと 車体の 会社名・メーカーの ロゴ・型の 番号、うしろの かんばんの 文字を ぼかし'
  },
  grader: {
    file: 'assets/grader.webp',
    title: 'File:Snow motor grader.jpg',
    author: 'あおもりくま（Aomorikuma）',
    license: 'CC BY-SA 3.0',
    licenseUrl: 'https://creativecommons.org/licenses/by-sa/3.0/',
    source: 'https://commons.wikimedia.org/wiki/File:Snow_motor_grader.jpg',
    changes: '切りぬき・縮小・市の 名まえと 車の 名まえ・型の 文字、番号の 札、メーカーの 小さな 札、うしろの たてものの かんばん、おくの 車の まどを ぼかし'
  },
  ambulance: {
    file: 'assets/ambulance.webp',
    title: 'File:Kumamoto City Fire Department Chuo 2.jpg',
    author: 'KUPS39M',
    license: 'CC BY-SA 4.0',
    licenseUrl: 'https://creativecommons.org/licenses/by-sa/4.0/',
    source: 'https://commons.wikimedia.org/wiki/File:Kumamoto_City_Fire_Department_Chuo_2.jpg',
    changes: '切りぬき・縮小・消防局の 名まえと 消防章、車の 番号の 文字、ナンバー、うしろの 消防車の 文字と 標章、運転席の まど、サイドミラーに うつった 人、まどの シールを ぼかし'
  },
  fire: {
    file: 'assets/fire.webp',
    title: 'File:Isuzu Elf, 6th Gen, Pumper truck, Fire-engine YCFD, Double-cab.jpg',
    author: 'Mj-bird',
    license: 'CC BY-SA 4.0',
    licenseUrl: 'https://creativecommons.org/licenses/by-sa/4.0/',
    source: 'https://commons.wikimedia.org/wiki/File:Isuzu_Elf,_6th_Gen,_Pumper_truck,_Fire-engine_YCFD,_Double-cab.jpg',
    changes: '切りぬき・縮小・消防の 名まえと 消防章、車の 番号や 署の 名まえ、タイヤの メーカー名を ぼかし（ナンバーは もとから 白く かくして あった）'
  },
  ladder: {
    file: 'assets/ladder.webp',
    title: 'File:Danbara hasigo jp.jpg',
    author: 'Kami9180',
    license: 'CC BY-SA 4.0',
    licenseUrl: 'https://creativecommons.org/licenses/by-sa/4.0/',
    source: 'https://commons.wikimedia.org/wiki/File:Danbara_hasigo_jp.jpg',
    changes: '切りぬき・縮小・消防局と メーカーの 文字、標章、ナンバーを ぼかし'
  },
  police: {
    file: 'assets/police.webp',
    title: 'File:Toyota CROWN 2.0 TURBO S 2WD (3BA-ARS220) used as a patrol car of Nara Prefectural Police.jpg',
    author: 'Tokumeigakarinoaoshima',
    license: 'CC BY-SA 4.0',
    licenseUrl: 'https://creativecommons.org/licenses/by-sa/4.0/',
    source: 'https://commons.wikimedia.org/wiki/File:Toyota_CROWN_2.0_TURBO_S_2WD_(3BA-ARS220)_used_as_a_patrol_car_of_Nara_Prefectural_Police.jpg',
    changes: '切りぬき・縮小・県警の 名まえと POLICE の 文字、メーカーの エンブレム（前・ボンネット・前と うしろの タイヤの まん中）、ナンバーを ぼかし'
  },
  wrecker: {
    file: 'assets/wrecker.webp',
    title: 'File:Yamaguchi Wrecker Manufactured by Isuzu Giga Tow truck.png',
    author: 'Mj-bird',
    license: 'CC BY-SA 4.0',
    licenseUrl: 'https://creativecommons.org/licenses/by-sa/4.0/',
    source: 'https://commons.wikimedia.org/wiki/File:Yamaguchi_Wrecker_Manufactured_by_Isuzu_Giga_Tow_truck.png',
    changes: '切りぬき・縮小・うでの 文字、メーカーと 会社の 文字・マーク、まえの せつめい板と ひだりの 車の せつめい板、うしろの かんばん、うしろの 人の 顔を ぼかし'
  },
  snowplow: {
    file: 'assets/snowplow.webp',
    title: 'File:北海道開発局 除雪車01.JPG',
    author: 'Trans5885',
    license: 'Public domain',
    licenseUrl: '',
    source: 'https://commons.wikimedia.org/wiki/File:%E5%8C%97%E6%B5%B7%E9%81%93%E9%96%8B%E7%99%BA%E5%B1%80_%E9%99%A4%E9%9B%AA%E8%BB%8A01.JPG',
    changes: '切りぬき・縮小・ナンバー、メーカーの マーク（前と 燃料タンク）、運転席の 人の 顔、ドアの 標章と 文字、はねの 注意書き、はねの 下の はしの 文字を ぼかし'
  },
  blood: {
    file: 'assets/blood.webp',
    title: 'File:Japanese Red Cross Society Vehicle (Love Blood Donor Vehicle).jpg',
    author: 'Haba740',
    license: 'CC BY-SA 4.0',
    licenseUrl: 'https://creativecommons.org/licenses/by-sa/4.0/',
    source: 'https://commons.wikimedia.org/wiki/File:Japanese_Red_Cross_Society_Vehicle_(Love_Blood_Donor_Vehicle).jpg',
    changes: '切りぬき・縮小・赤十字の 標章、「日本赤十字社」「Japanese Red Cross Society」の 文字（2か所）、けんけつちゃんの 絵、寄贈した 会社の ロゴと 名まえ、「東京 愛の献血車」の 文字を 車体の 色で ぬりつぶし（絵が かかって いた とびらの ふちと つなぎめの 線は 元の 色で かきなおし）。まどに うつった 看板・電話番号の 文字（右はしの まどの 上の だんに うすく のこって いた 看板の 字も）と、左はしの 店の 看板を ぼかし'
  },
  rescue: {
    file: 'assets/rescue.webp',
    title: 'File:TOKYO FIRE DEPT Adachi Rescue unit 1.JPG',
    author: 'Kawagchi F.D.',
    license: 'CC BY-SA 3.0',
    licenseUrl: 'https://creativecommons.org/licenses/by-sa/3.0/',
    source: 'https://commons.wikimedia.org/wiki/File:TOKYO_FIRE_DEPT_Adachi_Rescue_unit_1.JPG',
    changes: '切りぬき・縮小・消防の 名まえの 文字と 消防章、ドアの 標章と 車の 番号、運転席の 標章、前の 消防章と メーカーの 文字、ナンバー、タイヤどめの 文字を ぼかし'
  },
  foam: {
    file: 'assets/foam.webp',
    title: 'File:JGSDF Airport crash tender(24-0604) at Camp Akeno October 2, 2016 02.jpg',
    author: 'Hunini',
    license: 'CC BY-SA 4.0',
    licenseUrl: 'https://creativecommons.org/licenses/by-sa/4.0/',
    source: 'https://commons.wikimedia.org/wiki/File:JGSDF_Airport_crash_tender(24-0604)_at_Camp_Akeno_October_2,_2016_02.jpg',
    changes: '切りぬき・縮小・よこの 部隊の 名まえ、とびらの 小さな 文字、ナンバー、運転席の 人の 顔、うしろの 人たちと かんばんを ぼかし'
  },
  doctorcar: {
    file: 'assets/doctorcar.webp',
    title: 'File:東京医科歯科大学 ドクターカー(レクサス).jpg',
    author: 'ERM911',
    license: 'CC BY-SA 4.0',
    licenseUrl: 'https://creativecommons.org/licenses/by-sa/4.0/',
    source: 'https://commons.wikimedia.org/wiki/File:%E6%9D%B1%E4%BA%AC%E5%8C%BB%E7%A7%91%E6%AD%AF%E7%A7%91%E5%A4%A7%E5%AD%A6_%E3%83%89%E3%82%AF%E3%82%BF%E3%83%BC%E3%82%AB%E3%83%BC(%E3%83%AC%E3%82%AF%E3%82%B5%E3%82%B9).jpg',
    changes: '切りぬき・縮小・ボンネットの 文字、メーカーの マーク、ナンバー、ドアの 病院の 名まえ、うしろの かんばん・標識の 文字・のぼり・お店の かんばん、まどの シールと 写りこみ、うしろの 人を ぼかし'
  },
  xray: {
    file: 'assets/xray.webp',
    title: 'File:Rodo Hoken Kyokai 11 Mobile X-Ray Vehicle Takarakuji-Go.jpg',
    author: 'Comyu',
    license: 'CC BY-SA 3.0',
    licenseUrl: 'https://creativecommons.org/licenses/by-sa/3.0/',
    source: 'https://commons.wikimedia.org/wiki/File:Rodo_Hoken_Kyokai_11_Mobile_X-Ray_Vehicle_Takarakuji-Go.jpg',
    changes: '切りぬき・縮小・まどの 中の 文字の 札、団体名と 車の 名まえ・号数の 文字、メーカーの エンブレムと タイヤの 文字、ナンバーを ぼかし'
  },
  garbage: {
    file: 'assets/garbage.webp',
    title: 'File:ISUZU ELF, 5th Gen, Garbage Collection White Truck.jpg',
    author: 'Mj-bird',
    license: 'CC BY-SA 3.0',
    licenseUrl: 'https://creativecommons.org/licenses/by-sa/3.0/',
    source: 'https://commons.wikimedia.org/wiki/File:ISUZU_ELF,_5th_Gen,_Garbage_Collection_White_Truck.jpg',
    changes: '切りぬき・縮小・運転席の 人の 顔、メーカーと 車種の 文字、ナンバー、まどの シール、うしろの だんボールの マークと 札を ぼかし'
  },
  sweeper: {
    file: 'assets/sweeper.webp',
    title: 'File:Road cleaning track.JPG',
    author: '100yen',
    license: 'CC BY-SA 3.0',
    licenseUrl: 'https://creativecommons.org/licenses/by-sa/3.0/',
    source: 'https://commons.wikimedia.org/wiki/File:Road_cleaning_track.JPG',
    changes: '切りぬき・縮小・運転席の 人の 顔、メーカーの 文字と エンブレム、ナンバー、役所の 名まえと マーク、車の 名まえと 作った 会社の 文字（グリルの エンブレムの 下の 小さな 漢字も）、まどの シールを ぼかし'
  },
  water: {
    file: 'assets/water.webp',
    title: 'File:Tokyo Metropolitan Government Bureau of Waterworks Isuzu Forward FRS-J.jpg',
    author: 'Ypy31',
    license: 'CC0',
    licenseUrl: 'https://creativecommons.org/publicdomain/zero/1.0/',
    source: 'https://commons.wikimedia.org/wiki/File:Tokyo_Metropolitan_Government_Bureau_of_Waterworks_Isuzu_Forward_FRS-J.jpg',
    changes: '縮小・運転席の 人と 制服の ワッペン、メーカーと 車種の 文字、ナンバー、水道局の 名まえと マスコット、タンクの 文字、タイヤの 文字、まわりの 看板の 文字を ぼかし'
  },
  kitchen: {
    file: 'assets/kitchen.webp',
    title: 'File:Niconiconingen food truck (50515820113).jpg',
    author: 'Real Estate Japan from Tokyo, Japan',
    license: 'CC BY 2.0',
    licenseUrl: 'https://creativecommons.org/licenses/by/2.0/',
    source: 'https://commons.wikimedia.org/wiki/File:Niconiconingen_food_truck_(50515820113).jpg',
    changes: '切りぬき・縮小・店名の ロゴ、QR コード、ステッカー、のぼり（旗の 布）、メニューの 黒板の 字と はった 料理の 写真を 車体や 黒板の 色で ぬりつぶし、左の まどの 中の ネオンの 字と 支払いの ステッカーを 色ガラスの 色で ぬりつぶし、右の まどの 中の OPEN の ネオンと うしろの とびらの QR コード、背景の 看板（R）を まわりの 色で ぬりつぶし、ナンバー・小さな 札・ステッカーを ぼかし。中の かべの マンガの 絵が かいて ある 古い 看板を こい 茶色で ぬりつぶし、右の まどに うつった 筆記体の 字を ぼかし'
  },
  library: {
    file: 'assets/library.webp',
    title: 'File:Saga City Library Bookmobile Bookas.jpg',
    author: 'ハポニアラ',
    license: 'CC BY 4.0',
    licenseUrl: 'https://creativecommons.org/licenses/by/4.0/',
    source: 'https://commons.wikimedia.org/wiki/File:Saga_City_Library_Bookmobile_Bookas.jpg',
    changes: '切りぬき・縮小・車の 名まえの 文字と うしろの とびらの はり紙を ぼかし'
  },
  sightseeing: {
    file: 'assets/sightseeing.webp',
    title: 'File:神姫観光バス 6501.jpg',
    author: 'みるみるシンキ',
    license: 'CC BY-SA 4.0',
    licenseUrl: 'https://creativecommons.org/licenses/by-sa/4.0/',
    source: 'https://commons.wikimedia.org/wiki/File:%E7%A5%9E%E5%A7%AB%E8%A6%B3%E5%85%89%E3%83%90%E3%82%B9_6501.jpg',
    changes: '切りぬき・縮小・会社の 名まえと マーク（前の 白い 面に うすく のこる 文字の あとも）、メーカーの 文字と マーク（ホイールの まん中）、タイヤの メーカーの 文字、まどの シール（前まどの 上の 小さな シールも）、「貸切」の 文字、ナンバーを ぼかし'
  },
  waterworks: {
    file: 'assets/waterworks.webp',
    title: 'File:Moscow, Gazon Next crew truck with pump, Mosvodostok badge, Mar 2026 01.jpg',
    author: 'Retired electrician',
    license: 'CC0',
    licenseUrl: 'https://creativecommons.org/publicdomain/zero/1.0/',
    source: 'https://commons.wikimedia.org/wiki/File:Moscow,_Gazon_Next_crew_truck_with_pump,_Mosvodostok_badge,_Mar_2026_01.jpg',
    changes: '切りぬき・縮小・クレーンの メーカー名と メーカーの 白い マークを クレーンの 色で、ドアの 水道（下水）の 団体の 標章を 車体の 色で、うしろの 工事の 看板と 通りの 名まえの 標識を 下地の 色で ぬりつぶし。会社名の 文字・荷台の シール・ポンプの 文字と QR・ナンバー・ボンネットの 車種名の バッジ・どうぐばこの 小さな ラベル・うしろの 席の 人・右はしの 人を ぼかし'
  },
  shop: {
    file: 'assets/shop.webp',
    title: 'File:Q124478365 RosenGo.jpg',
    author: 'Haya4',
    license: 'CC BY 4.0',
    licenseUrl: 'https://creativecommons.org/licenses/by/4.0/',
    source: 'https://commons.wikimedia.org/wiki/File:Q124478365_RosenGo.jpg',
    changes: '切りぬき・縮小・お店の 名まえと マーク、メーカーの マーク（ホイールの まん中）、バッテリーの メーカーの 文字、黄色い はり紙を ぼかし'
  },
  kei: {
    file: 'assets/kei.webp',
    title: 'File:1996-1999 Honda Acty Truck SDX 4WD.jpg',
    author: 'TTTNIS',
    license: 'CC0',
    licenseUrl: 'https://creativecommons.org/publicdomain/zero/1.0/',
    source: 'https://commons.wikimedia.org/wiki/File:1996-1999_Honda_Acty_Truck_SDX_4WD.jpg',
    changes: '切りぬき・縮小・メーカーの マーク（前と ホイールの まん中）、車種名の 文字、ナンバーの 場所、まどの シール、にだいの ラベル、タイヤの 文字を ぼかし'
  },
  gas: {
    file: 'assets/gas.webp',
    title: 'File:Moriyama 20210615-37.jpg',
    author: '円周率３パーセント',
    license: 'CC BY-SA 4.0',
    licenseUrl: 'https://creativecommons.org/licenses/by-sa/4.0/',
    source: 'https://commons.wikimedia.org/wiki/File:Moriyama_20210615-37.jpg',
    changes: '切りぬき・縮小・ガス会社の 名まえと マーク、車の 文字、うしろの まどの 文字（まどの 中の 赤い 文字も）、メーカーの 標章、ナンバー、ステッカー、ホイールキャップの まん中の 標章を ぼかし'
  },
  tractor: {
    file: 'assets/tractor.webp',
    title: 'File:Yanmar AF220s.JPG',
    author: 'Corpse Reviver',
    license: 'CC BY-SA 3.0',
    licenseUrl: 'https://creativecommons.org/licenses/by-sa/3.0/',
    source: 'https://commons.wikimedia.org/wiki/File:Yanmar_AF220s.JPG',
    changes: '切りぬき・縮小・メーカー名と 車種名、ライトの よこの メーカーの エンブレム、作業機の メーカー名、ちゅうい書きの シール、値札、エアコンの 文字、かべの らくがきを ぼかし'
  },
  combine: {
    file: 'assets/combine.webp',
    title: 'File:Rice-combine-harvester, Katori-city, Japan.jpg',
    author: 'katorisi',
    license: 'CC BY 3.0',
    licenseUrl: 'https://creativecommons.org/licenses/by/3.0/',
    source: 'https://commons.wikimedia.org/wiki/File:Rice-combine-harvester,_Katori-city,_Japan.jpg',
    changes: '切りぬき・縮小・運転する 人の 顔、メーカー名と マーク、車種名、タンクの 文字、ちゅうい書きの シールを ぼかし'
  },
  rice: {
    file: 'assets/rice.webp',
    title: 'File:Rice-planting-machine,katori-city,japan.JPG',
    author: 'katorisi',
    license: 'CC BY 2.5',
    licenseUrl: 'https://creativecommons.org/licenses/by/2.5/',
    source: 'https://commons.wikimedia.org/wiki/File:Rice-planting-machine,katori-city,japan.JPG',
    changes: '切りぬき・縮小・運転する 人の 顔の よこ、メーカー名と 車種名、マーク、車の 文字を ぼかし'
  },
  mower: {
    file: 'assets/mower.webp',
    title: 'File:Tractor with shoulder mower.jpg',
    author: 'Filo gèn\'',
    license: 'CC BY-SA 4.0',
    licenseUrl: 'https://creativecommons.org/licenses/by-sa/4.0/',
    source: 'https://commons.wikimedia.org/wiki/File:Tractor_with_shoulder_mower.jpg',
    changes: '切りぬき・縮小・車種名、メーカー名と マーク、ちゅうい書きの シール、草かりの きかいの 文字を ぼかし'
  },
  logger: {
    file: 'assets/logger.webp',
    title: 'File:Timber Haulier - geograph.org.uk - 4275070.jpg',
    author: 'Michael Trolove',
    license: 'CC BY-SA 2.0',
    licenseUrl: 'https://creativecommons.org/licenses/by-sa/2.0/',
    source: 'https://commons.wikimedia.org/wiki/File:Timber_Haulier_-_geograph.org.uk_-_4275070.jpg',
    changes: '切りぬき・縮小・会社名と 電話番号、メーカーの 標章、クレーンの 文字と 標章、看板、まどの 中を ぼかし'
  },
  sprayer: {
    file: 'assets/sprayer.webp',
    title: 'File:Condor landbouwspuit.jpg',
    author: 'Josephine-v-G',
    license: 'CC BY-SA 4.0',
    licenseUrl: 'https://creativecommons.org/licenses/by-sa/4.0/',
    source: 'https://commons.wikimedia.org/wiki/File:Condor_landbouwspuit.jpg',
    changes: '切りぬき・縮小・運転席の 人と メーカー名・車種名を ぼかし'
  },
  towing: {
    file: 'assets/towing.webp',
    title: 'File:JAL Pushback tractor01.JPG',
    author: '221.20 (talk)',
    license: 'Public domain',
    licenseUrl: '',
    source: 'https://commons.wikimedia.org/wiki/File:JAL_Pushback_tractor01.JPG',
    changes: '切りぬき・縮小・メーカー名と 航空会社の 標章、車の 番号、運転席の 人と その 右の 黄色い ベストの ような もの、ひこうきの 番号を ぼかし。右はしの 係の 人は 切りぬきで 外した'
  },
  fueler: {
    file: 'assets/fueler.webp',
    title: 'File:Fuel tanker refuelling at Seville Airport.jpg',
    author: 'Philip Mallis',
    license: 'CC BY-SA 4.0',
    licenseUrl: 'https://creativecommons.org/licenses/by-sa/4.0/',
    source: 'https://commons.wikimedia.org/wiki/File:Fuel_tanker_refuelling_at_Seville_Airport.jpg',
    changes: '切りぬき・縮小・会社名と 燃料の 名まえ、番号、運転席の まど、ボーディングブリッジの 文字、ひこうきの 航空会社名と 標章と 番号、とおくの ひこうきの 尾翼と 格納庫の 文字、地面の 文字を ぼかし'
  },
  cargoloader: {
    file: 'assets/cargoloader.webp',
    title: 'File:Narita Airport 20190714 091950.jpg',
    author: 'Ka23 13',
    license: 'CC BY-SA 4.0',
    licenseUrl: 'https://creativecommons.org/licenses/by-sa/4.0/',
    source: 'https://commons.wikimedia.org/wiki/File:Narita_Airport_20190714_091950.jpg',
    changes: '切りぬき・縮小・航空会社の 標章、車の 番号と 文字、注意書き、台の 上の 係の 人の 頭（フードの 前まで）と 雨がっぱの せなかの 文字、うしろの 車の 文字を ぼかし。左上の 遠くの 車と 人は 切りぬきで 外した'
  },
  stairs: {
    file: 'assets/stairs.webp',
    title: 'File:JASDF Gangway ladder vehicle in Komaki Base 20140223.JPG',
    author: 'Hunini',
    license: 'CC BY-SA 3.0',
    licenseUrl: 'https://creativecommons.org/licenses/by-sa/3.0/',
    source: 'https://commons.wikimedia.org/wiki/File:JASDF_Gangway_ladder_vehicle_in_Komaki_Base_20140223.JPG',
    changes: '切りぬき・縮小・ひこうきの 番号と 日の丸、うしろの ひこうきの 標章、トラックの ドアの 番号と シールを ぼかし'
  },
  stacker: {
    file: 'assets/stacker.webp',
    title: 'File:Reach Stacker.jpg',
    author: 'ISEWAN RIKUUN',
    license: 'CC BY 4.0',
    licenseUrl: 'https://creativecommons.org/licenses/by/4.0/',
    source: 'https://commons.wikimedia.org/wiki/File:Reach_Stacker.jpg',
    changes: '切りぬき・縮小・メーカーと 会社の 名まえ・ロゴ、コンテナの 番号と 文字、運転席の 人（とびらの まどに 見える せなかと 頭の あたりも）、地面の 番号を ぼかし'
  },
  railcar: {
    file: 'assets/railcar.webp',
    title: 'File:Kirikusha truck shunting vehicle.jpg',
    author: 'ja:利用者:Cassiopeia sweet',
    license: 'CC BY-SA 3.0',
    licenseUrl: 'https://creativecommons.org/licenses/by-sa/3.0/',
    source: 'https://commons.wikimedia.org/wiki/File:Kirikusha_truck_shunting_vehicle.jpg',
    changes: '切りぬき・縮小・メーカーの エンブレムと 車種名、鉄道会社の 名まえ、ナンバー（2台）、のせて ある 札の 文字、うしろの 人と 看板を ぼかし'
  }
};
