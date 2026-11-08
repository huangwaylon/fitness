// The okinawa guide (docs/travel.md "Content"), ported from the old travel-plans site (its page, map tables and OSRM
// legs) and edited here since. Private values are {p:key} tokens (the trip note on the relay).
import type { Trip } from '../types.ts';

export const okinawa: Trip = {
  id: "okinawa",
  title: { ja: "沖縄", en: "Okinawa" },
  eyebrow: { ja: "沖縄本島 · 3日間", en: "Okinawa Main Island · 3 days" },
  sub: { ja: "10月10日 – 10月12日 · ジムニー・ルーフトップテント", en: "Oct 10 – Oct 12 · Jimny & rooftop tent" },
  start: "2026-10-10",
  end: "2026-10-12",
  tz: "Asia/Tokyo",
  cover: { src: "travel/okinawa/cover.webp", w: 560, h: 240 },
  hero: { src: "travel/okinawa/hero.webp", w: 720, h: 900 },
  dayColors: ["#0e7b8b", "#e2593a", "#b87d17"],
  bbox: [127.586, 26.055, 128.374, 26.895],
  days: [
    {
      n: 1,
      date: "2026-10-10",
      title: { ja: "到着", en: "Arrival" },
      sub: { ja: "那覇 → 金武 → 名護", en: "Naha → Kin → Nago" },
      rows: [
        {
          t: "06:10",
          text: { ja: "羽田 → 那覇 — ソラシドエア SNA 021", en: "Haneda → Naha — Solaseed SNA 021" },
          note: { ja: "座席 14B · 航空券番号 {p:ticket}", en: "Seat 14B · ticket {p:ticket}" }
        },
        { t: "08:55", text: { ja: "那覇空港（OKA）着", en: "Land at Naha (OKA)" }, place: "s1-0" },
        {
          t: "09:40",
          text: { ja: "空港から路線バス111番／117番", en: "Airport bus 111 or 117" },
          note: { ja: "1人¥1,330 · 高速経由で約1時間", en: "¥1,330 each · about 1 h via the expressway" }
        },
        {
          t: "10:45",
          text: { ja: "沖縄北ICで下車", en: "Off at Okinawa Kita IC" },
          note: { ja: "徒歩10分、または希望すれば無料送迎", en: "10 min walk, or free pickup on request" },
          place: "s1-1"
        },
        {
          t: "11:00",
          text: { ja: "ジムニー受け取り — 沖縄市池原", en: "Collect the Jimny — Ikehara, Okinawa City" },
          note: { ja: "営業所 9:30–18:00 · 荷物預かりあり", en: "Office 9:30–18:00 · luggage storage available" },
          place: "s1-2"
        },
        {
          t: "11:55",
          text: { ja: "キングタコス金武町 — タコライス", en: "King Tacos, Kin Town — taco rice" },
          note: {
            ja: "営業所から26分 · タコライスは1984年に金武町で誕生",
            en: "26 min from the office · taco rice originated in Kin, 1984"
          },
          place: "s1-3"
        },
        {
          t: "12:40",
          text: { ja: "万座毛", en: "Cape Manzamo" },
          note: { ja: "金武町から19分 · 象の鼻の形の岩", en: "19 min from Kin · elephant-trunk rock formation" },
          place: "s1-4"
        },
        {
          t: "13:45",
          text: { ja: "おきなわみるくふぁーむカフェ — かき氷", en: "Okinawa Milk Farm Cafe — kakigori" },
          note: { ja: "万座毛から36分 · 12:00–18:00", en: "36 min from Manzamo · 12:00–18:00" },
          place: "s1-5"
        },
        {
          t: "14:12",
          text: { ja: "タウンプラザかねひで大宮市場（名護市）— 食料の買い出し", en: "Town Plaza Kanehide Omiya Market, Nago — groceries" },
          note: { ja: "カフェから1分 · 07:00–23:00", en: "1 min from the cafe · 07:00–23:00" },
          place: "s1-6"
        },
        {
          t: "15:00",
          text: { ja: "キャンプ — 津波の浜（大宜味村）", en: "Camp — Tsuha Beach, Ogimi" },
          note: { ja: "かねひでから21分", en: "21 min from the store" },
          place: "s1-7"
        },
        { t: "17:00", text: { ja: "バーベキュー — Evertrailのセット", en: "BBQ — Evertrail set" } },
        { t: "18:05", text: { ja: "夕日", en: "Sunset" } }
      ]
    },
    {
      n: 2,
      date: "2026-10-11",
      title: { ja: "ダイビングと南下", en: "Dive, then South" },
      sub: { ja: "水納島、大家、安座真", en: "Minna Island, Ufuya, Azama" },
      rows: [
        { t: "06:25", text: { ja: "朝日、テント撤収", en: "Sunrise, break camp" }, place: "s2-0" },
        {
          t: "06:50",
          text: { ja: "キャンプ場を出発", en: "Leave camp" },
          note: { ja: "ショップまで44分", en: "44 min to the shop" }
        },
        {
          t: "08:00",
          text: { ja: "瀬底島のDIVENUTSに集合", en: "Dive Nuts, Sesoko — meet" },
          note: { ja: "ショップで着替えと説明、そのあと出港", en: "Change and briefing at the shop, then out" },
          place: "s2-1"
        },
        {
          t: "09:30",
          text: { ja: "1本目 — 水納島か瀬底島", en: "First dive — Minna or Sesoko" },
          note: { ja: "潜水時間30–40分 · 浅場のサンゴ礁 · 海水温 {c:29}", en: "30–40 min under · shallow reef · sea {c:29}" },
          place: "s2-2"
        },
        {
          t: "11:15",
          text: { ja: "2本目", en: "Second dive" },
          note: { ja: "ポイントを変え、船上で休憩のあと", en: "A new point, after a rest on board" }
        },
        {
          t: "13:00",
          text: { ja: "ショップで解散", en: "Done at the shop" },
          note: { ja: "シャワーと着替え · 写真付き", en: "Shower and change · photos included" }
        },
        {
          t: "13:50",
          text: { ja: "百年古家 大家（名護市）— あぐー肉とゆし豆腐そば", en: "Ufuya, Nago — agu and yushi-dofu soba" },
          note: {
            ja: "ショップから24分 · 昼は15:30まで、L.O. 15:00",
            en: "24 min from the shop · lunch to 15:30, last order 15:00"
          },
          place: "s2-3"
        },
        {
          t: "16:15",
          text: { ja: "タウンプラザかねひで佐敷店 — 今夜の食材と氷", en: "Town Plaza Kanehide, Sashiki — tonight's food and ice" },
          note: {
            ja: "大家から81分、島を縦断 · 07:00–23:00 · 三連休の日曜、20–40分の余裕を",
            en: "81 min from Ufuya, the length of the island · 07:00–23:00 · Sunday of a three-day weekend, so add 20–40 min"
          },
          place: "s2-4"
        },
        {
          t: "17:00",
          text: { ja: "あざまサンサンビーチ（南城市）— チェックイン", en: "Azama Sun Sun Beach, Nanjo — check in" },
          note: { ja: "かねひでから14分", en: "14 min from the store" },
          place: "s2-5"
        },
        { t: "18:06", text: { ja: "夕日", en: "Sunset" } },
        { t: "19:00", text: { ja: "バーベキュー — 6つある炊事棟のひとつ", en: "BBQ — one of the six pavilions" } }
      ]
    },
    {
      n: 3,
      date: "2026-10-12",
      title: { ja: "南部の海岸、出発", en: "South Coast, Departure" },
      sub: { ja: "知念、新原、喜屋武岬、秘境プール", en: "Chinen, Mibaru, Cape Kyan, the tide pool" },
      rows: [
        {
          t: "06:26",
          text: { ja: "久高島から朝日", en: "Sunrise over Kudaka Island" },
          note: { ja: "キャンプ場から東向き", en: "From the campsite, facing east" },
          place: "s3-0"
        },
        { t: "07:45", text: { ja: "テント撤収", en: "Break camp" } },
        {
          t: "08:30",
          text: { ja: "知念岬公園", en: "Chinen Misaki Park" },
          note: { ja: "4分 · 二つの湾に挟まれた岬の芝地 · 入場無料", en: "4 min · headland lawn between two bays · free" },
          place: "s3-1"
        },
        {
          t: "10:30",
          text: { ja: "浜辺の茶屋（新原）— 砂浜でブランチ", en: "Hamabe no Chaya, Mibaru — brunch on the sand" },
          note: {
            ja: "知念から15分 · 窓の外がそのまま浜 · 営業時間は事前確認",
            en: "15 min from Chinen · windows open onto the beach · check the hours before going"
          },
          place: "s3-2"
        },
        {
          t: "12:30",
          text: { ja: "大度浜海岸", en: "Odohama Beach" },
          note: { ja: "26分 · リーフの浅場、設備なし", en: "26 min · reef flat, no facilities" },
          place: "s3-3"
        },
        {
          t: "13:10",
          text: { ja: "喜屋武岬", en: "Cape Kyan" },
          note: { ja: "14分 · 本島最南端", en: "14 min · the island's southern tip" },
          place: "s3-4"
        },
        {
          t: "13:50",
          text: { ja: "具志川城跡 — 秘境プール", en: "Gushikawa Castle ruins — the tide pool" },
          note: {
            ja: "岬から3分 · 干潮14:53 · 崖を下る · 入場無料",
            en: "3 min from the cape · low tide 14:53 · cliff scramble down · free"
          },
          place: "s3-5"
        },
        {
          t: "15:30",
          text: { ja: "プールを出発", en: "Leave the pool" },
          note: { ja: "Evertrail営業所まで56分", en: "56 min to the Evertrail office" }
        },
        { t: "16:20", text: { ja: "給油、営業所の手前で", en: "Refuel, before the office" } },
        {
          t: "16:45",
          text: { ja: "ジムニー返却 — 沖縄市のEvertrail営業所", en: "Return the Jimny — Evertrail office, Okinawa City" },
          note: { ja: "空港ではありません · 営業所は18:00まで", en: "Not the airport · office closes 18:00" },
          place: "s3-6"
        },
        {
          t: "17:05",
          text: { ja: "沖縄北ICまで徒歩", en: "Walk to Okinawa Kita IC" },
          note: { ja: "10分、または営業所の無料送迎", en: "10 min, or the free lift from the office" },
          place: "s3-7"
        },
        {
          t: "17:20",
          text: { ja: "路線バス111番／117番で那覇空港へ", en: "Bus 111 or 117 to Naha Airport" },
          note: { ja: "1人¥1,330 · 高速経由で約1時間", en: "¥1,330 each · about 1 h via the expressway" }
        },
        { t: "18:25", text: { ja: "那覇空港着", en: "Land side at Naha Airport" }, place: "s3-8" },
        { t: "18:45", text: { ja: "チェックイン", en: "Check in" } },
        {
          t: "20:25",
          text: { ja: "那覇 → 羽田 — ソラシドエア SNA 026", en: "Naha → Haneda — Solaseed SNA 026" },
          note: { ja: "座席 14B", en: "Seat 14B" }
        },
        { t: "22:50", text: { ja: "羽田着", en: "Land at Haneda" } }
      ]
    }
  ],
  logistics: [
    {
      id: "flights",
      icon: "plane-takeoff",
      title: { ja: "フライト", en: "Flights" },
      sub: { ja: "ソラシドエア · 予約番号 {p:flightRef}", en: "Solaseed Air · ref {p:flightRef}" },
      stats: [
        { k: { ja: "往路", en: "Outbound" }, v: { ja: "SNA 021" } },
        { k: { ja: "10月10日", en: "Oct 10" }, v: { ja: "06:10 → 08:55" } },
        { k: { ja: "復路", en: "Return" }, v: { ja: "SNA 026" } },
        { k: { ja: "10月12日", en: "Oct 12" }, v: { ja: "20:25 → 22:50" } },
        { k: { ja: "座席", en: "Seat" }, v: { ja: "往復ともに14B", en: "14B both ways" } },
        { k: { ja: "運賃", en: "Fare" }, v: { ja: "Early Sora Value" } }
      ],
      sections: [
        {
          head: { ja: "参考", en: "Reference" },
          kind: "bul",
          rows: [
            {
              text: { ja: "予約番号 {p:flightRef} · 航空券番号 {p:ticket}", en: "Booking {p:flightRef} · ticket {p:ticket}" },
              note: { ja: "{p:traveller1} · 羽田 ↔ 那覇、時刻はすべて日本時間", en: "{p:traveller1} · Haneda ↔ Naha, all times JST" }
            },
            { text: { ja: "06:10発なので、自宅を04:00頃に出発します", en: "06:10 departure means leaving home around 04:00" } }
          ]
        }
      ]
    },
    {
      id: "the-jimny",
      icon: "car",
      title: { ja: "ジムニー", en: "The Jimny" },
      sub: { ja: "Evertrail · 予約番号 #{p:carRef}", en: "Evertrail · booking #{p:carRef}" },
      desc: {
        ja: "スズキ・ジムニーシエラ II、ルーフトップテント、2名。受け取りも返却も同じ場所 — 沖縄市池原のEvertrail営業所で、空港ではありません。空港バスは往復 — 1日目に行き、3日目に帰り。",
        en: "Suzuki Jimny Sierra II, rooftop tent, 2 guests. Collected at and returned to the same place — the Evertrail office in Ikehara, Okinawa City, not the airport. So the airport bus is a round trip: bus out on day 1, bus back on day 3."
      },
      stats: [
        { k: { ja: "レンタル料", en: "Rent" }, v: { ja: "¥17,000 × 3" } },
        { k: { ja: "免責補償", en: "Zero Liability" }, v: { ja: "¥9,000" } },
        { k: { ja: "清掃料", en: "Cleaning" }, v: { ja: "3日以上で無料", en: "Waived at 3 days" } },
        { k: { ja: "カード手数料 3.6%", en: "Card fee 3.6%" }, v: { ja: "¥2,160" } },
        { k: { ja: "消費税 10%", en: "Tax 10%" }, v: { ja: "¥6,000" } },
        { k: { ja: "支払総額", en: "Total paid" }, v: { ja: "¥68,160" } }
      ],
      sections: [
        {
          head: { ja: "付属 — バーベキューセット", en: "Included — the BBQ set" },
          kind: "bul",
          rows: [
            { text: { ja: "あぐー豚 200 g · 沖縄県産牛 200 g", en: "200 g agu pork · 200 g Okinawa beef" } },
            { text: { ja: "あぐーソーセージ2本 · 焼き鳥4本", en: "2 agu sausages · 4 yakitori" } },
            {
              text: { ja: "ガスカートリッジ · 焼肉鉄板グリル", en: "Gas canister · yakiniku teppan grill" },
              note: { ja: "2人分の夕食1回", en: "One dinner for two" }
            }
          ]
        },
        {
          head: { ja: "付属しないもの", en: "Not included" },
          kind: "bul",
          rows: [
            { text: { ja: "マスク・シュノーケル・フィン", en: "Mask, snorkel, fins" } },
            { text: { ja: "蚊取り線香", en: "Mosquito coils" } },
            {
              text: { ja: "日本の運転免許証で可", en: "Japanese licence accepted" },
              note: { ja: "国際運転免許証は不要", en: "No International Driving Permit required" }
            }
          ]
        },
        {
          head: { ja: "行きと帰り", en: "Getting there and back" },
          kind: "bul",
          rows: [
            {
              text: { ja: "営業所：沖縄市池原2-11-7", en: "Office: 2-11-7 Ikehara, Okinawa City" },
              note: {
                ja: "9:30–18:00 · 080 9104 3373 · 駐車場・荷物預かり",
                en: "9:30–18:00 · 080 9104 3373 · parking and luggage storage"
              }
            },
            {
              text: {
                ja: "1日目・行き：空港から路線バス111番／117番、沖縄北ICで下車",
                en: "Day 1, out: bus 111 or 117 from the airport, off at Okinawa Kita IC"
              },
              note: {
                ja: "1人¥1,330 · 約1時間 · 乗車時に支払い · そこから徒歩10分、または無料送迎",
                en: "¥1,330 each · about 1 h · pay on board · then 10 min on foot, or a free lift"
              }
            },
            {
              text: { ja: "3日目・帰り：同じ経路を逆に", en: "Day 3, back: the same in reverse" },
              note: {
                ja: "18:00までに営業所で返却、ICまで10分、バスで空港 · 1人¥1,330 · 約1時間",
                en: "Drop the car at the office by 18:00, 10 min to the IC, bus to the airport · ¥1,330 each · about 1 h"
              }
            },
            { text: { ja: "バス代は2人往復で合計¥5,320", en: "¥5,320 of bus fares in total, for two, both ways" } },
            {
              text: { ja: "バスが厳しければ空港送迎", en: "Airport shuttle instead, if the bus is tight" },
              note: {
                ja: "2人で片道¥10,000 · 10:30–16:00なので、プールのあとの帰りには使えません",
                en: "¥10,000 for two, one way · 10:30–16:00, so it cannot do the return after the pool"
              }
            }
          ]
        },
        {
          head: { ja: "台風が来たら", en: "If a typhoon comes" },
          kind: "bul",
          rows: [
            { text: { ja: "車両の引き上げ → 未使用日数を100%返金", en: "Vehicle recalled → 100% refund of unused days" } },
            {
              text: {
                ja: "ルーフトップテントが使用不可 → 該当日ごとに30%返金",
                en: "Rooftop tent ruled unsafe → 30% back for each affected day"
              }
            },
            { text: { ja: "フライトの遅延・欠航 → 変更手数料は免除", en: "Flight delayed or cancelled → amendment fees waived" } },
            { text: { ja: "キャンプ用品は車両保険の対象外", en: "Camping gear is not covered by the vehicle insurance" } }
          ]
        }
      ],
      links: [{ label: { ja: "Evertrail の登録手順", en: "Evertrail onboarding" }, href: "{p:onboardingUrl}" }]
    },
    {
      id: "scuba-diving-dive-nuts",
      icon: "waves",
      title: { ja: "体験ダイビング — DIVENUTS", en: "Scuba diving — Dive Nuts" },
      sub: { ja: "瀬底島・本部町 · 2日目", en: "Sesoko, Motobu · Day 2" },
      desc: {
        ja: "瀬底島発のボート体験ダイビング、2ダイブ。水納島と瀬底島の浅いサンゴ礁、FUNダイビングと同じポイント。器材レンタル代込み、水中写真付き。ノンダイバー対象。",
        en: "Boat intro dive from Sesoko, two dives. The shallow reef at Minna and Sesoko, the points certified divers use. Gear rental and underwater photos included. Non-divers."
      },
      photo: { src: "travel/okinawa/boat.webp", w: 442, h: 386 },
      stats: [
        { k: { ja: "プラン", en: "Plan" }, v: { ja: "ボート体験ダイビング 2本", en: "Boat intro dive × 2" } },
        { k: { ja: "1人あたり", en: "Each" }, v: { ja: "¥17,000" } },
        { k: { ja: "2人で", en: "Two of us" }, v: { ja: "¥34,000" } },
        { k: { ja: "時間", en: "Hours" }, v: { ja: "08:00–13:00" } },
        { k: { ja: "潜水時間", en: "Time under" }, v: { ja: "1本30–40分", en: "30–40 min a dive" } },
        { k: { ja: "器材レンタル", en: "Gear rental" }, v: { ja: "料金に含む", en: "In the price" } }
      ],
      sections: [
        {
          head: { ja: "午前、2ダイブ", en: "The morning, two dives" },
          kind: "tl",
          rows: [
            {
              t: "08:00",
              text: { ja: "ショップ集合", en: "Meet at the shop" },
              note: { ja: "着替えてダイビングの説明", en: "Change, then the dive briefing" }
            },
            { t: "09:00", text: { ja: "出港", en: "Out to the point" } },
            { t: "09:30", text: { ja: "1本目", en: "First dive" }, note: { ja: "潜水時間30–40分", en: "30–40 min" } },
            { t: "10:30", text: { ja: "ポイントを変えて船上で休憩", en: "Move to a new point, rest on board" } },
            { t: "11:15", text: { ja: "2本目", en: "Second dive" } },
            { t: "12:00", text: { ja: "港へ出港", en: "Back to port" } },
            { t: "12:30", text: { ja: "港に到着", en: "At the port" } },
            { t: "13:00", text: { ja: "ショップでシャワーと着替え、解散", en: "Shower and change at the shop, done" } }
          ]
        },
        {
          head: { ja: "ダイビング後の搭乗", en: "Flying after" },
          kind: "bul",
          rows: [
            {
              text: { ja: "帰りの便は2本目の約32時間後", en: "Flight home about 32 h after the second dive" },
              note: { ja: "複数ダイブ後の一般的な目安は18時間以上", en: "18 h is the usual minimum after more than one dive" }
            }
          ]
        },
        {
          head: { ja: "ポイント", en: "Where" },
          kind: "bul",
          rows: [
            {
              text: { ja: "水納島と瀬底島", en: "Minna Island and Sesoko Island" },
              note: {
                ja: "浅場一面のサンゴ礁 · サンゴが多く魚が群れるポイントへ案内",
                en: "Reef spreading across the shallows · the shop picks the point with the most coral and fish"
              }
            }
          ]
        },
        {
          head: { ja: "持ち物", en: "Bring" },
          kind: "bul",
          rows: [
            { text: { ja: "水着、サンダル、日焼け止め", en: "Swimsuit, sandals, sunscreen" } },
            {
              text: { ja: "酔い止め", en: "Seasickness tablets" },
              note: { ja: "酔うかわからない人も飲んだほうがよい、とショップの案内", en: "The shop suggests them even if you are unsure" }
            }
          ]
        },
        {
          head: { ja: "ほかのコース — 税込", en: "The other courses — tax in" },
          kind: "bul",
          rows: [
            {
              text: { ja: "ビーチ体験ダイビング — ¥13,200", en: "Beach intro dive — ¥13,200" },
              note: { ja: "約3時間", en: "About 3 h" }
            },
            {
              text: { ja: "ボート体験ダイビング 1本 — ¥13,750", en: "Boat intro dive, one — ¥13,750" },
              note: { ja: "約3時間30分 · 追加ダイブ+¥5,500", en: "About 3 h 30 · ¥5,500 for an extra dive" }
            },
            {
              text: { ja: "ボートシュノーケル 午前便 — 2名以上で1人¥9,900", en: "Boat snorkel, morning — ¥9,900 each at 2 or more" },
              note: { ja: "08:00–12:00 · 2本目は+¥2,750", en: "08:00–12:00 · ¥2,750 for the second drop" }
            },
            {
              text: { ja: "ボート体験ダイビング＆ボートシュノーケルセット — ¥18,700", en: "Boat intro dive + boat snorkel — ¥18,700" },
              note: {
                ja: "約5時間 · シュノーケルを追加ダイブに変更 +¥2,200",
                en: "About 5 h · ¥2,200 to swap the snorkel for a second dive"
              }
            },
            {
              text: { ja: "サンセットボートシュノーケル — ¥14,300", en: "Sunset boat snorkel — ¥14,300" },
              note: { ja: "約2時間", en: "About 2 h" }
            }
          ]
        },
        {
          head: { ja: "ショップ", en: "Shop" },
          kind: "bul",
          rows: [
            {
              text: { ja: "本部町瀬底1278 · 09:00–19:00", en: "1278 Sesoko, Motobu · 09:00–19:00" },
              note: { ja: "シャワー、バスタオル、アメニティあり", en: "Showers, bath towels and amenities" }
            },
            {
              text: { ja: "電話対応は休止中 — メールかLINE", en: "Phone bookings are suspended — email or LINE" },
              note: {
                ja: "info@divenuts.jp · 当日の夕方か翌日に返信",
                en: "info@divenuts.jp · reply that evening or the next day"
              }
            },
            { text: { ja: "水中の写真と動画は無料", en: "Photos and video from the water, free" } },
            {
              text: {
                ja: "キャンセル料 3日前30% / 前日50% / 当日100%",
                en: "Cancellation 30% / 50% / 100% at three days, one day, same day"
              },
              note: { ja: "台風や悪海況で中止の場合は不要", en: "Waived if a typhoon or rough sea cancels the boat" }
            }
          ]
        }
      ],
      links: [
        {
          label: { ja: "マップで開く", en: "Open in Maps" },
          href: "https://www.google.com/maps/place//data=!4m2!3m1!1s0x34e4f9648721b8c7:0xb25f11ae1a588779"
        },
        { label: { ja: "divenuts.jp" }, href: "https://divenuts.jp/taiken-snorkel/" }
      ]
    }
  ],
  camps: [
    {
      id: "katsuren-beach",
      name: { ja: "勝連ビーチ", en: "Katsuren Beach" },
      sub: { ja: "野営地 · うるま市", en: "Wild camp · Uruma" },
      type: "wild",
      beach: true,
      toilet: false,
      shower: false,
      photo: { src: "travel/okinawa/camps/katsuren-beach.webp", w: 720, h: 539 },
      desc: { ja: "穏やかな湾、市街に沈む夕日。トイレなし。", en: "Calm bay, sunsets over the city. No toilets." },
      chips: [
        { text: { ja: "ビーチ", en: "Beach" } },
        { text: { ja: "オーシャンビュー", en: "Ocean view" } },
        { text: { ja: "夕日", en: "Sunset" } }
      ],
      fromMin: 17,
      fromKm: 9.9,
      fee: { ja: "記載なし", en: "None posted" },
      maps: "https://maps.app.goo.gl/Uvd7dxm7JLn6nKsF6"
    },
    {
      id: "okinawa-prefectural-people-s-forrest",
      name: { ja: "沖縄県民の森", en: "Okinawa Prefectural People's Forrest" },
      sub: { ja: "有料キャンプ場 · 恩納村", en: "Paid camp · Onna" },
      type: "paid",
      beach: false,
      toilet: true,
      shower: true,
      photo: { src: "travel/okinawa/camps/okinawa-prefectural-people-s-forrest.webp", w: 720, h: 707 },
      desc: {
        ja: "森林サイト。広い区画、炊事場、トイレ、シャワー。",
        en: "Forest site. Spacious plots, designated cooking areas, toilets, showers."
      },
      chips: [
        { text: { ja: "候補", en: "Shortlist" }, pick: true },
        { text: { ja: "星空", en: "Stargazing" } },
        { text: { ja: "トイレ", en: "Toilet" } },
        { text: { ja: "シャワー", en: "Shower" } }
      ],
      fromMin: 29,
      fromKm: 24.7,
      fee: { ja: "現地で確認", en: "Ask on site" },
      maps: "https://maps.app.goo.gl/2y2mMv4doqEGUonM7"
    },
    {
      id: "koki-camp-spot",
      name: { ja: "幸喜（こうき）の野営地", en: "Koki Camp Spot" },
      sub: { ja: "野営地 · 名護市", en: "Wild camp · Nago" },
      type: "wild",
      beach: true,
      toilet: false,
      shower: false,
      photo: { src: "travel/okinawa/camps/koki-camp-spot.webp", w: 720, h: 480 },
      desc: {
        ja: "静かな湾、穏やかな海。トイレなし。公開座標は高速道路上。",
        en: "Quiet bay, calm water. No toilets. Published coordinate falls on the expressway."
      },
      chips: [
        { text: { ja: "ビーチ", en: "Beach" } },
        { text: { ja: "オーシャンビュー", en: "Ocean view" } },
        { text: { ja: "夕日", en: "Sunset" } }
      ],
      fromMin: 36,
      fromKm: 35.2,
      fee: { ja: "記載なし", en: "None posted" },
      maps: "https://www.google.com/maps/place/26%C2%B032'36.8%22N+127%C2%B057'36.0%22E/@26.5437855,127.9584414,262m/data=!3m1!1e3!4m8!1m3!11m2!2skItwiim2KGlHKzS9245Y_LOdxVctbQ!3e3!3m3!8m2!3d26.5435556!4d127.96?entry=ttu"
    },
    {
      id: "nago-castle-bridge-spot",
      name: { ja: "名護城橋の野営地", en: "Nago Castle Bridge Spot" },
      sub: { ja: "野営地 · 名護市", en: "Wild camp · Nago" },
      type: "wild",
      beach: false,
      toilet: true,
      shower: false,
      photo: { src: "travel/okinawa/camps/nago-castle-bridge-spot.webp", w: 720, h: 539 },
      desc: {
        ja: "名護市街の道路橋の下、川沿いの空き地。水道とトイレ。ビーチなし。",
        en: "Riverside pull-in under a road bridge in urban Nago. Water and toilets. No beach."
      },
      chips: [{ text: { ja: "トイレ", en: "Toilet" } }],
      fromMin: 45,
      fromKm: 41.8,
      fee: { ja: "記載なし", en: "None posted" },
      maps: "https://maps.app.goo.gl/4DiHnCXi4Fi8L97i8"
    },
    {
      id: "neos-outdoor-park",
      name: { ja: "NEOSアウトドアパーク", en: "NEOS Outdoor Park" },
      sub: { ja: "有料キャンプ場 · 南城市", en: "Paid camp · Nanjō" },
      type: "paid",
      beach: true,
      toilet: true,
      shower: true,
      photo: { src: "travel/okinawa/camps/neos-outdoor-park.webp", w: 720, h: 480 },
      desc: {
        ja: "ビーチ直結の管理されたパーク。オートキャンプ、カヤックとSUPのレンタル。",
        en: "Managed park with direct beach access. Car camping, kayak and SUP rental."
      },
      chips: [
        { text: { ja: "候補", en: "Shortlist" }, pick: true },
        { text: { ja: "ビーチ", en: "Beach" } },
        { text: { ja: "オーシャンビュー", en: "Ocean view" } },
        { text: { ja: "朝日", en: "Sunrise" } },
        { text: { ja: "星空", en: "Stargazing" } },
        { text: { ja: "トイレ", en: "Toilet" } },
        { text: { ja: "シャワー", en: "Shower" } }
      ],
      fromMin: 45,
      fromKm: 35.5,
      fee: { ja: "現地で確認", en: "Ask on site" },
      maps: "https://www.google.com/maps/place/26%C2%B008'53.9%22N+127%C2%B048'18.5%22E/@26.1482968,127.8025511,590m/data=!3m2!1e3!4b1!4m4!3m3!8m2!3d26.148292!4d127.805126?entry=ttu&g_ep=EgoyMDI0MDgyMC4xIKXMDSoASAFQAw%3D%3D"
    },
    {
      id: "azama-sun-beach-camping-ground",
      name: { ja: "あざまサンサンビーチ キャンプ場", en: "Azama Sun Beach Camping Ground" },
      sub: { ja: "有料キャンプ場 · 南城市", en: "Paid camp · Nanjō" },
      type: "paid",
      beach: true,
      toilet: true,
      shower: true,
      photo: { src: "travel/okinawa/camps/azama-sun-beach-camping-ground.webp", w: 720, h: 942 },
      desc: {
        ja: "刈り込まれた芝、久高島からの朝日。トイレ、シャワー、東屋6棟。",
        en: "Mown lawn, sunrise over Kudaka Island. Toilets, showers, six pavilions."
      },
      chips: [
        { text: { ja: "2泊目", en: "Night 2" }, pick: true },
        { text: { ja: "候補", en: "Shortlist" }, pick: true },
        { text: { ja: "ビーチ", en: "Beach" } },
        { text: { ja: "オーシャンビュー", en: "Ocean view" } },
        { text: { ja: "朝日", en: "Sunrise" } },
        { text: { ja: "トイレ", en: "Toilet" } },
        { text: { ja: "シャワー", en: "Shower" } }
      ],
      fromMin: 47,
      fromKm: 38.4,
      fee: { ja: "現地で確認", en: "Ask on site" },
      maps: "https://maps.app.goo.gl/ykBFkzo8djM3RUap9"
    },
    {
      id: "kita-nashiro-beach",
      name: { ja: "北名城ビーチ", en: "Kita Nashiro Beach" },
      sub: { ja: "野営地 · 糸満市", en: "Wild camp · Itoman" },
      type: "wild",
      beach: true,
      toilet: true,
      shower: false,
      photo: { src: "travel/okinawa/camps/kita-nashiro-beach.webp", w: 720, h: 271 },
      desc: { ja: "無料、砂浜の上。トイレあり。週末は混雑。", en: "Free, on the sand. Toilets. Crowded at weekends." },
      chips: [
        { text: { ja: "ビーチ", en: "Beach" } },
        { text: { ja: "オーシャンビュー", en: "Ocean view" } },
        { text: { ja: "夕日", en: "Sunset" } },
        { text: { ja: "トイレ", en: "Toilet" } }
      ],
      fromMin: 48,
      fromKm: 43.1,
      fee: { ja: "記載なし", en: "None posted" },
      maps: "https://www.google.com/maps/place/26%C2%B006'28.8%22N+127%C2%B039'42.0%22E/@26.1574819,127.6575679,12.5z/data=!4m4!3m3!8m2!3d26.108003!4d127.661654?authuser=1&entry=ttu"
    },
    {
      id: "kudeken-beach",
      name: { ja: "久手堅ビーチ", en: "Kudeken Beach" },
      sub: { ja: "野営地 · 南城市", en: "Wild camp · Nanjō" },
      type: "wild",
      beach: true,
      toilet: false,
      shower: false,
      photo: { src: "travel/okinawa/camps/kudeken-beach.webp", w: 720, h: 480 },
      desc: { ja: "無料、朝日側。星空。知念岬が近い。", en: "Free, sunrise side. Stargazing. Cape Chinen nearby." },
      chips: [
        { text: { ja: "ビーチ", en: "Beach" } },
        { text: { ja: "朝日", en: "Sunrise" } },
        { text: { ja: "星空", en: "Stargazing" } }
      ],
      fromMin: 50,
      fromKm: 38.1,
      fee: { ja: "記載なし", en: "None posted" },
      maps: "https://maps.app.goo.gl/fSZv7eJ8s4uF77ny7"
    },
    {
      id: "base-camp",
      name: { ja: "ベースキャンプ", en: "Base Camp" },
      sub: { ja: "有料キャンプ場 · 名護市", en: "Paid camp · Nago" },
      type: "paid",
      beach: false,
      toilet: true,
      shower: true,
      photo: { src: "travel/okinawa/camps/base-camp.webp", w: 720, h: 720 },
      desc: {
        ja: "名護近くの管理キャンプ場。シャワー、トイレ、Wi-Fi。下段の区画は風をしのげる。",
        en: "Managed site near Nago. Showers, toilets, Wi-Fi. Lower pitches are sheltered."
      },
      chips: [
        { text: { ja: "夕日", en: "Sunset" } },
        { text: { ja: "星空", en: "Stargazing" } },
        { text: { ja: "トイレ", en: "Toilet" } },
        { text: { ja: "シャワー", en: "Shower" } }
      ],
      fromMin: 53,
      fromKm: 48.1,
      fee: { ja: "現地で確認", en: "Ask on site" },
      maps: "https://maps.app.goo.gl/1z98EaKALKR9ubxR9"
    },
    {
      id: "yagaji-beach-campsite",
      name: { ja: "屋我地ビーチ キャンプ場", en: "Yagaji Beach Campsite" },
      sub: { ja: "有料キャンプ場 · 名護市", en: "Paid camp · Nago" },
      type: "paid",
      beach: true,
      toilet: true,
      shower: true,
      photo: { src: "travel/okinawa/camps/yagaji-beach-campsite.webp", w: 720, h: 477 },
      desc: {
        ja: "オートキャンプとバンガロー。バーベキュー設備、ボートとカヤックのレンタル。",
        en: "Auto camping and bungalows. BBQ facilities, boat and kayak rental."
      },
      chips: [
        { text: { ja: "候補", en: "Shortlist" }, pick: true },
        { text: { ja: "ビーチ", en: "Beach" } },
        { text: { ja: "オーシャンビュー", en: "Ocean view" } },
        { text: { ja: "夕日", en: "Sunset" } },
        { text: { ja: "トイレ", en: "Toilet" } },
        { text: { ja: "シャワー", en: "Shower" } }
      ],
      fromMin: 57,
      fromKm: 50.6,
      fee: { ja: "¥1,000" },
      maps: "https://www.google.com/maps/search/yagaji+beach+camping/@26.6481261,128.0308987,17z/data=!3m1!4b1?entry=ttu"
    },
    {
      id: "inamine-camp-spot",
      name: { ja: "稲嶺の野営地", en: "Inamine Camp Spot" },
      sub: { ja: "野営地 · 名護市", en: "Wild camp · Nago" },
      type: "wild",
      beach: true,
      toilet: false,
      shower: false,
      photo: { src: "travel/okinawa/camps/inamine-camp-spot.webp", w: 720, h: 480 },
      desc: { ja: "古宇利大橋の眺め、海に沈む夕日。駐車は1台分。", en: "Views of Kouri Bridge, ocean sunsets. Room for one car." },
      chips: [
        { text: { ja: "ビーチ", en: "Beach" } },
        { text: { ja: "オーシャンビュー", en: "Ocean view" } },
        { text: { ja: "夕日", en: "Sunset" } }
      ],
      fromMin: 57,
      fromKm: 50.5,
      fee: { ja: "記載なし", en: "None posted" },
      maps: "https://maps.app.goo.gl/9fTpH1cCbHkFpprV9"
    },
    {
      id: "yagajima-spot",
      name: { ja: "屋我地島の野営地", en: "Yagajima Spot" },
      sub: { ja: "野営地 · 名護市", en: "Wild camp · Nago" },
      type: "wild",
      beach: true,
      toilet: false,
      shower: false,
      photo: { src: "travel/okinawa/camps/yagajima-spot.webp", w: 720, h: 539 },
      desc: {
        ja: "人の少ない海岸、海に沈む夕日。行き止まりの道、駐車スペースは極小。",
        en: "Secluded stretch of coast, ocean sunsets. Dead-end track, very limited parking."
      },
      chips: [
        { text: { ja: "ビーチ", en: "Beach" } },
        { text: { ja: "オーシャンビュー", en: "Ocean view" } },
        { text: { ja: "夕日", en: "Sunset" } }
      ],
      fromMin: 59,
      fromKm: 51.7,
      fee: { ja: "記載なし", en: "None posted" },
      maps: "https://maps.app.goo.gl/HrZcLm1K6aRrayb26"
    },
    {
      id: "henan-bridge",
      name: { ja: "平南橋", en: "Henan Bridge" },
      sub: { ja: "野営地 · 大宜味村", en: "Wild camp · Ogimi" },
      type: "wild",
      beach: true,
      toilet: false,
      shower: false,
      photo: { src: "travel/okinawa/camps/henan-bridge.webp", w: 720, h: 480 },
      desc: {
        ja: "日陰あり、夕日側、古宇利大橋の正面。潮位線から離れて駐車。",
        en: "Shaded, sunset side, facing Kouri Bridge. Park back from the tide line."
      },
      chips: [
        { text: { ja: "やんばる", en: "Yanbaru" } },
        { text: { ja: "ビーチ", en: "Beach" } },
        { text: { ja: "オーシャンビュー", en: "Ocean view" } },
        { text: { ja: "夕日", en: "Sunset" } }
      ],
      fromMin: 63,
      fromKm: 54.9,
      fee: { ja: "記載なし", en: "None posted" },
      maps: "https://www.google.com/maps/place/26%C2%B038'59.4%22N+128%C2%B005'15.7%22E/@26.6497186,128.0874132,67m/data=!3m1!1e3!4m4!3m3!8m2!3d26.649824!4d128.087702?authuser=1&entry=ttu"
    },
    {
      id: "tsuha-beach-camp-spot",
      name: { ja: "津波ビーチの野営地", en: "Tsuha Beach Camp Spot" },
      sub: { ja: "野営地 · 大宜味村", en: "Wild camp · Ogimi" },
      type: "wild",
      beach: true,
      toilet: true,
      shower: false,
      photo: { src: "travel/okinawa/camps/tsuha-beach-camp-spot.webp", w: 720, h: 480 },
      desc: { ja: "夕日のビーチ。道の駅とコンビニが隣接。", en: "Sunset beach. Michi-no-eki and konbini adjacent." },
      chips: [
        { text: { ja: "1泊目", en: "Night 1" }, pick: true },
        { text: { ja: "やんばる", en: "Yanbaru" } },
        { text: { ja: "ビーチ", en: "Beach" } },
        { text: { ja: "オーシャンビュー", en: "Ocean view" } },
        { text: { ja: "夕日", en: "Sunset" } },
        { text: { ja: "トイレ", en: "Toilet" } }
      ],
      fromMin: 66,
      fromKm: 57,
      fee: { ja: "記載なし", en: "None posted" },
      maps: "https://www.google.com/maps/place/26%C2%B039'41.3%22N+128%C2%B006'05.3%22E/@26.6614431,128.1009642,139m/data=!3m1!1e3!4m4!3m3!8m2!3d26.661466!4d128.101462?authuser=1&entry=ttu"
    },
    {
      id: "tonokiya-campsite",
      name: { ja: "渡野喜屋キャンプ場", en: "Tonokiya Campsite" },
      sub: { ja: "有料キャンプ場 · 大宜味村", en: "Paid camp · Ogimi" },
      type: "paid",
      beach: true,
      toilet: true,
      shower: true,
      photo: { src: "travel/okinawa/camps/tonokiya-campsite.webp", w: 720, h: 405 },
      desc: { ja: "トイレ、シャワー、グリル、焚き火場。", en: "Toilets, showers, grills and fire pits." },
      chips: [
        { text: { ja: "やんばる", en: "Yanbaru" } },
        { text: { ja: "候補", en: "Shortlist" }, pick: true },
        { text: { ja: "ビーチ", en: "Beach" } },
        { text: { ja: "オーシャンビュー", en: "Ocean view" } },
        { text: { ja: "星空", en: "Stargazing" } },
        { text: { ja: "トイレ", en: "Toilet" } },
        { text: { ja: "シャワー", en: "Shower" } }
      ],
      fromMin: 68,
      fromKm: 57.9,
      fee: { ja: "現地で確認", en: "Ask on site" },
      maps: "https://maps.app.goo.gl/w5TqEBiigaZwMsPS9"
    },
    {
      id: "kouri-island-camp-ground",
      name: { ja: "古宇利島キャンプ場", en: "Kouri Island Camp Ground" },
      sub: { ja: "有料キャンプ場 · 今帰仁村", en: "Paid camp · Nakijin" },
      type: "paid",
      beach: true,
      toilet: true,
      shower: true,
      photo: { src: "travel/okinawa/camps/kouri-island-camp-ground.webp", w: 720, h: 480 },
      desc: { ja: "ビーチサイド・山側・VIPの区画。予約可。", en: "Beachside, mountain and VIP pitches. Bookable." },
      chips: [
        { text: { ja: "候補", en: "Shortlist" }, pick: true },
        { text: { ja: "ビーチ", en: "Beach" } },
        { text: { ja: "オーシャンビュー", en: "Ocean view" } },
        { text: { ja: "夕日", en: "Sunset" } },
        { text: { ja: "星空", en: "Stargazing" } },
        { text: { ja: "トイレ", en: "Toilet" } },
        { text: { ja: "シャワー", en: "Shower" } }
      ],
      fromMin: 74,
      fromKm: 60,
      fee: { ja: "現地で確認", en: "Ask on site" },
      maps: "https://maps.app.goo.gl/Vk5gPnS14gfpJqYJ8"
    },
    {
      id: "daiboo-river-camp",
      name: { ja: "大保川キャンプ場", en: "Daiboo River Camp" },
      sub: { ja: "野営地 · 大宜味村", en: "Wild camp · Ogimi" },
      type: "wild",
      beach: false,
      toilet: false,
      shower: false,
      photo: { src: "travel/okinawa/camps/daiboo-river-camp.webp", w: 720, h: 539 },
      desc: {
        ja: "高木の下、川沿いの草地の開けた場所。設備なし、未舗装路でアクセス。",
        en: "Grassy riverside clearing under tall trees. No facilities, off-road access."
      },
      chips: [{ text: { ja: "やんばる", en: "Yanbaru" } }, { text: { ja: "星空", en: "Stargazing" } }],
      fromMin: 74,
      fromKm: 61.8,
      fee: { ja: "記載なし", en: "None posted" },
      maps: "https://maps.app.goo.gl/HtPGd8hyqt3myoMw6"
    },
    {
      id: "fukuchi-river-seaside-park",
      name: { ja: "福地川海浜公園", en: "Fukuchi River Seaside Park" },
      sub: { ja: "有料キャンプ場 · 東村", en: "Paid camp · Higashi" },
      type: "paid",
      beach: true,
      toilet: true,
      shower: true,
      photo: { src: "travel/okinawa/camps/fukuchi-river-seaside-park.webp", w: 720, h: 487 },
      desc: { ja: "ビーチサイド・川沿い・VIPの区画。マリンスポーツ可。", en: "Beachside, riverside and VIP pitches. Water sports access." },
      chips: [
        { text: { ja: "やんばる", en: "Yanbaru" } },
        { text: { ja: "ビーチ", en: "Beach" } },
        { text: { ja: "オーシャンビュー", en: "Ocean view" } },
        { text: { ja: "朝日", en: "Sunrise" } },
        { text: { ja: "星空", en: "Stargazing" } },
        { text: { ja: "トイレ", en: "Toilet" } },
        { text: { ja: "シャワー", en: "Shower" } }
      ],
      fromMin: 81,
      fromKm: 66.2,
      fee: { ja: "現地で確認", en: "Ask on site" },
      maps: "https://maps.app.goo.gl/zXJEK7k2b2BVBgJr8"
    },
    {
      id: "kokyono-beach",
      name: { ja: "コキョウノビーチ", en: "Kokyono Beach" },
      sub: { ja: "野営地 · 国頭村", en: "Wild camp · Kunigami" },
      type: "wild",
      beach: true,
      toilet: true,
      shower: true,
      photo: { src: "travel/okinawa/camps/kokyono-beach.webp", w: 720, h: 480 },
      desc: {
        ja: "無料、夕日側。トイレとシャワーも無料。週末は日帰り客と共用。",
        en: "Free, sunset side. Free toilets and showers. Shared with day visitors at weekends."
      },
      chips: [
        { text: { ja: "やんばる", en: "Yanbaru" } },
        { text: { ja: "ビーチ", en: "Beach" } },
        { text: { ja: "オーシャンビュー", en: "Ocean view" } },
        { text: { ja: "夕日", en: "Sunset" } },
        { text: { ja: "トイレ", en: "Toilet" } },
        { text: { ja: "シャワー", en: "Shower" } }
      ],
      fromMin: 87,
      fromKm: 70.8,
      fee: { ja: "記載なし", en: "None posted" },
      maps: "https://www.google.com/maps/place/26%C2%B044'47.6%22N+128%C2%B010'19.0%22E/@26.7465407,128.1711413,227m/data=!3m1!1e3!4m4!3m3!8m2!3d26.746565!4d128.171939?authuser=1&entry=ttu"
    },
    {
      id: "hentona-camp-spot",
      name: { ja: "辺土名の野営地", en: "Hentona Camp Spot" },
      sub: { ja: "野営地 · 国頭村", en: "Wild camp · Kunigami" },
      type: "wild",
      beach: true,
      toilet: false,
      shower: false,
      photo: { src: "travel/okinawa/camps/hentona-camp-spot.webp", w: 720, h: 480 },
      desc: { ja: "ビーチの区画。暗い夜空、夕日。", en: "Beach pitch. Dark skies, sunsets." },
      chips: [
        { text: { ja: "やんばる", en: "Yanbaru" } },
        { text: { ja: "ビーチ", en: "Beach" } },
        { text: { ja: "オーシャンビュー", en: "Ocean view" } },
        { text: { ja: "夕日", en: "Sunset" } },
        { text: { ja: "星空", en: "Stargazing" } }
      ],
      fromMin: 89,
      fromKm: 71.6,
      fee: { ja: "記載なし", en: "None posted" },
      maps: "https://www.google.com/maps/place/26%C2%B045'02.0%22N+128%C2%B011'05.8%22E/@26.7500591,128.1839969,370m/data=!3m1!1e3!4m10!1m5!3m4!2zMjbCsDQ3JzU0LjIiTiAxMjjCsDEzJzU1LjciRQ!8m2!3d26.7983889!4d128.2321389!3m3!8m2!3d26.750541!4d128.184956?authuser=1&entry=ttu"
    },
    {
      id: "okuma-mountains",
      name: { ja: "奥間の山あい", en: "Okuma Mountains" },
      sub: { ja: "有料キャンプ場 · 国頭村", en: "Paid camp · Kunigami" },
      type: "paid",
      beach: false,
      toilet: true,
      shower: true,
      photo: { src: "travel/okinawa/camps/okuma-mountains.webp", w: 720, h: 405 },
      desc: { ja: "星空。トイレ、シャワー、炊事場。", en: "Stargazing. Toilets, showers, kitchen." },
      chips: [
        { text: { ja: "やんばる", en: "Yanbaru" } },
        { text: { ja: "オーシャンビュー", en: "Ocean view" } },
        { text: { ja: "夕日", en: "Sunset" } },
        { text: { ja: "星空", en: "Stargazing" } },
        { text: { ja: "トイレ", en: "Toilet" } },
        { text: { ja: "シャワー", en: "Shower" } }
      ],
      fromMin: 91,
      fromKm: 71.9,
      fee: { ja: "¥2,000" },
      maps: "https://maps.app.goo.gl/NmPtRRuQFPK5Qb7b9"
    },
    {
      id: "benoki-camp-spot",
      name: { ja: "辺野喜の野営地", en: "Benoki Camp Spot" },
      sub: { ja: "野営地 · 国頭村", en: "Wild camp · Kunigami" },
      type: "wild",
      beach: false,
      toilet: false,
      shower: false,
      photo: { src: "travel/okinawa/camps/benoki-camp-spot.webp", w: 720, h: 480 },
      desc: { ja: "辺野喜川の河口。光害はごくわずか。", en: "Where the Benoki River meets the sea. Minimal light pollution." },
      chips: [
        { text: { ja: "やんばる", en: "Yanbaru" } },
        { text: { ja: "オーシャンビュー", en: "Ocean view" } },
        { text: { ja: "夕日", en: "Sunset" } },
        { text: { ja: "星空", en: "Stargazing" } }
      ],
      fromMin: 101,
      fromKm: 79.6,
      fee: { ja: "記載なし", en: "None posted" },
      maps: "https://www.google.com/maps/place/26%C2%B047'54.2%22N+128%C2%B013'55.7%22E/@26.7985574,128.2321175,156m/data=!3m1!1e3!4m4!3m3!8m2!3d26.798378!4d128.232139?authuser=1&entry=ttu"
    },
    {
      id: "yanbaru-discovery-forest",
      name: { ja: "やんばる学びの森", en: "Yanbaru Discovery Forest" },
      sub: { ja: "有料キャンプ場 · 国頭村", en: "Paid camp · Kunigami" },
      type: "paid",
      beach: false,
      toilet: true,
      shower: true,
      photo: { src: "travel/okinawa/camps/yanbaru-discovery-forest.webp", w: 720, h: 486 },
      desc: { ja: "林冠の下の区画。トイレ、シャワー。", en: "Pitches under forest canopy. Toilets, showers." },
      chips: [
        { text: { ja: "やんばる", en: "Yanbaru" } },
        { text: { ja: "朝日", en: "Sunrise" } },
        { text: { ja: "星空", en: "Stargazing" } },
        { text: { ja: "トイレ", en: "Toilet" } },
        { text: { ja: "シャワー", en: "Shower" } }
      ],
      fromMin: 122,
      fromKm: 87.7,
      fee: { ja: "現地で確認", en: "Ask on site" },
      maps: "https://maps.app.goo.gl/zYafRAvFhUYwAG3fA"
    },
    {
      id: "aha-yanbaru",
      name: { ja: "安波（やんばる）", en: "Aha, Yanbaru" },
      sub: { ja: "野営地 · 国頭村", en: "Wild camp · Kunigami" },
      type: "wild",
      beach: true,
      toilet: false,
      shower: false,
      photo: { src: "travel/okinawa/camps/aha-yanbaru.webp", w: 720, h: 480 },
      desc: { ja: "海の眺め、朝日、暗い夜空。トイレ・シャワーなし。", en: "Ocean views, sunrises, dark skies. No toilet or shower." },
      chips: [
        { text: { ja: "やんばる", en: "Yanbaru" } },
        { text: { ja: "ビーチ", en: "Beach" } },
        { text: { ja: "オーシャンビュー", en: "Ocean view" } },
        { text: { ja: "朝日", en: "Sunrise" } },
        { text: { ja: "星空", en: "Stargazing" } }
      ],
      fromMin: 131,
      fromKm: 90.4,
      fee: { ja: "記載なし", en: "None posted" },
      maps: "https://www.google.com/maps/place/26%C2%B042'57.2%22N+128%C2%B017'38.4%22E/@26.7149311,128.2914264,17.75z/data=!4m4!3m3!8m2!3d26.715876!4d128.293995?authuser=1&entry=ttu"
    },
    {
      id: "oku-beach-road",
      name: { ja: "奥のビーチロード", en: "Oku Beach Road" },
      sub: { ja: "野営地 · 国頭村", en: "Wild camp · Kunigami" },
      type: "wild",
      beach: true,
      toilet: false,
      shower: false,
      photo: { src: "travel/okinawa/camps/oku-beach-road.webp", w: 720, h: 480 },
      desc: {
        ja: "北東海岸、辺戸岬の南3 kmの日陰の区画。裾礁。",
        en: "Shaded pitch on the north-east coast, 3 km south of Cape Hedo. Fringing reef."
      },
      chips: [
        { text: { ja: "やんばる", en: "Yanbaru" } },
        { text: { ja: "ビーチ", en: "Beach" } },
        { text: { ja: "オーシャンビュー", en: "Ocean view" } },
        { text: { ja: "星空", en: "Stargazing" } }
      ],
      fromMin: 132,
      fromKm: 96.9,
      fee: { ja: "記載なし", en: "None posted" },
      maps: "https://www.google.com/maps/place/26%C2%B050'45.8%22N+128%C2%B017'08.5%22E/@26.8452102,128.2842858,523m/data=!3m1!1e3!4m4!3m3!8m2!3d26.846056!4d128.285682?authuser=1&entry=ttu"
    },
    {
      id: "adan-beach-campsite",
      name: { ja: "アダンビーチ キャンプ場", en: "Adan Beach Campsite" },
      sub: { ja: "有料キャンプ場 · 国頭村", en: "Paid camp · Kunigami" },
      type: "paid",
      beach: true,
      toilet: true,
      shower: true,
      photo: { src: "travel/okinawa/camps/adan-beach-campsite.webp", w: 720, h: 417 },
      desc: {
        ja: "辺戸岬から10分の人の少ない湾。駐車場、シャワー。林道経由でアクセス。",
        en: "Secluded bay 10 min from Cape Hedo. Parking, showers. Access via forest roads."
      },
      chips: [
        { text: { ja: "やんばる", en: "Yanbaru" } },
        { text: { ja: "ビーチ", en: "Beach" } },
        { text: { ja: "オーシャンビュー", en: "Ocean view" } },
        { text: { ja: "朝日", en: "Sunrise" } },
        { text: { ja: "星空", en: "Stargazing" } },
        { text: { ja: "トイレ", en: "Toilet" } },
        { text: { ja: "シャワー", en: "Shower" } }
      ],
      fromMin: 133,
      fromKm: 95.4,
      fee: { ja: "現地で確認", en: "Ask on site" },
      maps: "https://maps.app.goo.gl/NFrjgX2ypCiQRxbq8"
    },
    {
      id: "tokashiki-island-youth-travel-village",
      name: { ja: "渡嘉敷村青少年旅行村", en: "Tokashiki Island - Youth Travel Village" },
      sub: { ja: "有料キャンプ場 · 渡嘉敷村", en: "Paid camp · Tokashiki" },
      type: "paid",
      beach: true,
      toilet: true,
      shower: true,
      desc: {
        ja: "阿波連ビーチの隣。炊事場、シャワー、トイレ。ビーチを見渡す展望台。",
        en: "Next to Aharen Beach. Cooking facilities, showers, toilets; a lookout over the beach."
      },
      chips: [
        { text: { ja: "離島", en: "Outer island" } },
        { text: { ja: "ビーチ", en: "Beach" } },
        { text: { ja: "オーシャンビュー", en: "Ocean view" } },
        { text: { ja: "夕日", en: "Sunset" } },
        { text: { ja: "星空", en: "Stargazing" } },
        { text: { ja: "トイレ", en: "Toilet" } },
        { text: { ja: "シャワー", en: "Shower" } }
      ],
      fee: { ja: "現地で確認", en: "Ask on site" },
      maps: "https://maps.app.goo.gl/rttdQoqNBK42j2tr6"
    },
    {
      id: "zamami-island-ama-beach",
      name: { ja: "座間味島 阿真ビーチ", en: "Zamami Island - Ama Beach" },
      sub: { ja: "有料キャンプ場 · 座間味村", en: "Paid camp · Zamami" },
      type: "paid",
      beach: true,
      toilet: true,
      shower: true,
      desc: {
        ja: "座間味港から歩いてすぐ。澄んだ海、ウミガメによく会え、シュノーケルに。日陰あり、キャンプ用品のレンタルあり。",
        en: "A short walk from Zamami Port. Clear water, frequent sea turtles, snorkelling. Shade; camping gear for rent."
      },
      chips: [
        { text: { ja: "離島", en: "Outer island" } },
        { text: { ja: "ビーチ", en: "Beach" } },
        { text: { ja: "オーシャンビュー", en: "Ocean view" } },
        { text: { ja: "夕日", en: "Sunset" } },
        { text: { ja: "星空", en: "Stargazing" } },
        { text: { ja: "トイレ", en: "Toilet" } },
        { text: { ja: "シャワー", en: "Shower" } }
      ],
      fee: { ja: "現地で確認", en: "Ask on site" },
      maps: "https://maps.app.goo.gl/CtibYnS1ZoUaU9e48"
    },
    {
      id: "izena-island-akechihara-park-camping-ground",
      name: { ja: "伊是名島 アケチハラ公園キャンプ場", en: "Izena Island - Akechihara Park Camping Ground" },
      sub: { ja: "有料キャンプ場 · 伊是名村", en: "Paid camp · Izena" },
      type: "paid",
      beach: true,
      toilet: true,
      shower: true,
      desc: {
        ja: "木陰の多い林間サイト。トイレ、シャワー、ビーチ。夕日がきれい。",
        en: "Wooded and shady. Toilets, showers, a beach. Fine sunsets."
      },
      chips: [
        { text: { ja: "離島", en: "Outer island" } },
        { text: { ja: "ビーチ", en: "Beach" } },
        { text: { ja: "オーシャンビュー", en: "Ocean view" } },
        { text: { ja: "夕日", en: "Sunset" } },
        { text: { ja: "星空", en: "Stargazing" } },
        { text: { ja: "トイレ", en: "Toilet" } },
        { text: { ja: "シャワー", en: "Shower" } }
      ],
      fee: { ja: "現地で確認", en: "Ask on site" },
      maps: "https://maps.app.goo.gl/JAqtW9dmccTbmrTB6"
    },
    {
      id: "izena-island-izena-beach",
      name: { ja: "伊是名島 伊是名ビーチ", en: "Izena Island - Izena Beach" },
      sub: { ja: "野営地 · 伊是名村", en: "Wild camp · Izena" },
      type: "wild",
      beach: true,
      toilet: true,
      shower: true,
      desc: {
        ja: "白い砂浜と澄んだ海、泳ぎやシュノーケルに。仲田港から自転車ですぐ。シャワー、トイレ。近くに居酒屋が2軒。",
        en: "White sand, clear water for swimming and snorkelling. A short bike ride from Nakada Port. Showers, toilets; two izakaya nearby."
      },
      chips: [
        { text: { ja: "離島", en: "Outer island" } },
        { text: { ja: "ビーチ", en: "Beach" } },
        { text: { ja: "オーシャンビュー", en: "Ocean view" } },
        { text: { ja: "夕日", en: "Sunset" } },
        { text: { ja: "星空", en: "Stargazing" } },
        { text: { ja: "トイレ", en: "Toilet" } },
        { text: { ja: "シャワー", en: "Shower" } }
      ],
      fee: { ja: "記載なし", en: "None posted" },
      maps: "https://maps.app.goo.gl/zgZHxMVgU6Ldeu5q6"
    },
    {
      id: "izena-island-matela-camp-spot",
      name: { ja: "伊是名島 マテラの野営地", en: "Izena Island - Matela Camp Spot" },
      sub: { ja: "野営地 · 伊是名村", en: "Wild camp · Izena" },
      type: "wild",
      beach: true,
      toilet: false,
      shower: false,
      desc: {
        ja: "島の南側。大きな岩に日が沈み、反対側の岩から朝日が昇る。魚の多いビーチ。",
        en: "South side of the island. The sun sets behind one big rock and rises behind another. A beach full of fish."
      },
      chips: [
        { text: { ja: "離島", en: "Outer island" } },
        { text: { ja: "ビーチ", en: "Beach" } },
        { text: { ja: "オーシャンビュー", en: "Ocean view" } },
        { text: { ja: "朝日", en: "Sunrise" } },
        { text: { ja: "星空", en: "Stargazing" } }
      ],
      fee: { ja: "記載なし", en: "None posted" },
      maps: "https://maps.app.goo.gl/RD77DCDw7DP2zTZP8"
    },
    {
      id: "izena-island-uchihana-camp-spot",
      name: { ja: "伊是名島 内花の野営地", en: "Izena Island - Uchihana Camp Spot" },
      sub: { ja: "野営地 · 伊是名村", en: "Wild camp · Izena" },
      type: "wild",
      beach: false,
      toilet: true,
      shower: true,
      desc: {
        ja: "ディレクトリでは無料。シャワー、トイレ、ベンチ、BBQ炉。星空。",
        en: "Free, per the directory. Showers, toilets, seating, a BBQ pit. Stargazing."
      },
      chips: [
        { text: { ja: "離島", en: "Outer island" } },
        { text: { ja: "オーシャンビュー", en: "Ocean view" } },
        { text: { ja: "夕日", en: "Sunset" } },
        { text: { ja: "星空", en: "Stargazing" } },
        { text: { ja: "トイレ", en: "Toilet" } },
        { text: { ja: "シャワー", en: "Shower" } }
      ],
      fee: { ja: "記載なし", en: "None posted" },
      maps: "https://maps.app.goo.gl/A9GucdiPGTx5ibUWA"
    },
    {
      id: "iheya-island-sugahama-beach",
      name: { ja: "伊平屋島 スガハマビーチ", en: "Iheya Island - Sugahama Beach" },
      sub: { ja: "野営地 · 伊平屋村", en: "Wild camp · Iheya" },
      type: "wild",
      beach: true,
      toilet: false,
      shower: false,
      desc: {
        ja: "浜辺のサイト、夕日と星空。浜に車で入らない。吹きさらし — 北風の強い日は避ける。",
        en: "Beachside; big sunsets and stars. Don’t drive on the beach. Very exposed: avoid in a strong north wind."
      },
      chips: [
        { text: { ja: "離島", en: "Outer island" } },
        { text: { ja: "ビーチ", en: "Beach" } },
        { text: { ja: "オーシャンビュー", en: "Ocean view" } },
        { text: { ja: "夕日", en: "Sunset" } },
        { text: { ja: "星空", en: "Stargazing" } }
      ],
      fee: { ja: "記載なし", en: "None posted" },
      maps: "https://maps.app.goo.gl/HmmX4g51P9sM1rSn6"
    },
    {
      id: "iheya-island-south-island-spot",
      name: { ja: "伊平屋島 南の野営地", en: "Iheya Island South Island Spot" },
      sub: { ja: "野営地 · 伊平屋村", en: "Wild camp · Iheya" },
      type: "wild",
      beach: true,
      toilet: false,
      shower: false,
      desc: {
        ja: "南海岸、海のすぐそば。砂にはまらないよう、またウミガメの産卵を守るため、浜の手前に駐車。",
        en: "South coast, right by the sea. Park at the beach’s edge: soft sand, and sea turtles nest here."
      },
      chips: [
        { text: { ja: "離島", en: "Outer island" } },
        { text: { ja: "ビーチ", en: "Beach" } },
        { text: { ja: "オーシャンビュー", en: "Ocean view" } },
        { text: { ja: "夕日", en: "Sunset" } },
        { text: { ja: "星空", en: "Stargazing" } }
      ],
      fee: { ja: "記載なし", en: "None posted" },
      maps: "https://maps.app.goo.gl/2B2wxqpCLxw6YZBk8"
    },
    {
      id: "iheya-island-yonezaki",
      name: { ja: "伊平屋島 米崎", en: "Iheya Island Yonezaki" },
      sub: { ja: "有料キャンプ場 · 伊平屋村", en: "Paid camp · Iheya" },
      type: "paid",
      beach: true,
      toilet: true,
      shower: true,
      desc: {
        ja: "両側を海に囲まれ、目の前に海が広がる。",
        en: "Sea on both sides, the ocean right in front."
      },
      chips: [
        { text: { ja: "離島", en: "Outer island" } },
        { text: { ja: "ビーチ", en: "Beach" } },
        { text: { ja: "オーシャンビュー", en: "Ocean view" } },
        { text: { ja: "夕日", en: "Sunset" } },
        { text: { ja: "朝日", en: "Sunrise" } },
        { text: { ja: "星空", en: "Stargazing" } },
        { text: { ja: "トイレ", en: "Toilet" } },
        { text: { ja: "シャワー", en: "Shower" } }
      ],
      fee: { ja: "現地で確認", en: "Ask on site" },
      maps: "https://maps.app.goo.gl/PHo9xSh5YiSeBjNY6"
    }
  ],
  campsFoot: {
    ja: "所要時間はEvertrail営業所からのOSRMによる渋滞なしの値 — 連休の渋滞時は20–40分を 加えてください。データ出典 directory.evertrailokinawa.com",
    en: "Free-flow drive times from the Evertrail office via OSRM — add 20–40 min in holiday traffic. Data from directory.evertrailokinawa.com"
  },
  places: [
    { id: "s1-0", kind: "stop", name: { ja: "那覇空港", en: "Naha Airport" }, lat: 26.1967, lon: 127.64895, day: 1, i: 0, min: 535 },
    { id: "s1-1", kind: "stop", name: { ja: "沖縄北IC", en: "Okinawa Kita IC" }, lat: 26.3748, lon: 127.8204, day: 1, i: 1, min: 645 },
    { id: "s1-2", kind: "stop", name: { ja: "Evertrail営業所", en: "Evertrail office" }, lat: 26.38051, lon: 127.82639, day: 1, i: 2, min: 660 },
    { id: "s1-3", kind: "stop", name: { ja: "キングタコス金武", en: "King Tacos, Kin" }, lat: 26.45328, lon: 127.91728, day: 1, i: 3, min: 715 },
    { id: "s1-4", kind: "stop", name: { ja: "万座毛", en: "Cape Manzamo" }, lat: 26.50501, lon: 127.85026, day: 1, i: 4, min: 760 },
    { id: "s1-5", kind: "stop", name: { ja: "みるくふぁーむカフェ", en: "Okinawa Milk Farm Cafe" }, lat: 26.60526, lon: 127.97327, day: 1, i: 5, min: 825 },
    { id: "s1-6", kind: "stop", name: { ja: "かねひで 大宮市場", en: "Kanehide, Omiya Market" }, lat: 26.60134, lon: 127.97508, day: 1, i: 6, min: 852 },
    { id: "s1-7", kind: "stop", name: { ja: "キャンプ 津波の浜", en: "Camp, Tsuha Beach" }, lat: 26.65669, lon: 128.09269, day: 1, i: 7, min: 900 },
    { id: "s2-0", kind: "stop", name: { ja: "キャンプ 津波の浜", en: "Camp, Tsuha Beach" }, lat: 26.65669, lon: 128.09269, day: 2, i: 0, min: 385 },
    { id: "s2-1", kind: "stop", name: { ja: "DIVENUTS 瀬底", en: "Dive Nuts, Sesoko" }, lat: 26.642, lon: 127.863, day: 2, i: 1, min: 480 },
    { id: "s2-2", kind: "stop", name: { ja: "水納島 ダイビング", en: "Minna Island, dive" }, lat: 26.64767, lon: 127.81791, day: 2, i: 2, min: 570 },
    { id: "s2-3", kind: "stop", name: { ja: "百年古家 大家", en: "Ufuya" }, lat: 26.621, lon: 127.96367, day: 2, i: 3, min: 830 },
    { id: "s2-4", kind: "stop", name: { ja: "かねひで 佐敷", en: "Kanehide, Sashiki" }, lat: 26.17978, lon: 127.7741, day: 2, i: 4, min: 975 },
    { id: "s2-5", kind: "stop", name: { ja: "あざまサンサンビーチ", en: "Azama Sun Sun Beach" }, lat: 26.1781, lon: 127.82925, day: 2, i: 5, min: 1020 },
    { id: "s3-0", kind: "stop", name: { ja: "あざまサンサンビーチ", en: "Azama Sun Sun Beach" }, lat: 26.1781, lon: 127.82925, day: 3, i: 0, min: 386 },
    { id: "s3-1", kind: "stop", name: { ja: "知念岬公園", en: "Chinen Misaki Park" }, lat: 26.16666, lon: 127.82992, day: 3, i: 1, min: 510 },
    { id: "s3-2", kind: "stop", name: { ja: "浜辺の茶屋 新原", en: "Hamabe no Chaya, Mibaru" }, lat: 26.13353, lon: 127.78461, day: 3, i: 2, min: 630 },
    { id: "s3-3", kind: "stop", name: { ja: "大度浜海岸", en: "Odohama Beach" }, lat: 26.09047, lon: 127.70848, day: 3, i: 3, min: 750 },
    { id: "s3-4", kind: "stop", name: { ja: "喜屋武岬", en: "Cape Kyan" }, lat: 26.07842, lon: 127.66895, day: 3, i: 4, min: 790 },
    { id: "s3-5", kind: "stop", name: { ja: "具志川城跡 秘境プール", en: "Gushikawa tide pool" }, lat: 26.08036, lon: 127.66452, day: 3, i: 5, min: 830 },
    { id: "s3-6", kind: "stop", name: { ja: "Evertrail営業所 返却", en: "Evertrail office, car back" }, lat: 26.38051, lon: 127.82639, day: 3, i: 6, min: 1005 },
    { id: "s3-7", kind: "stop", name: { ja: "沖縄北IC", en: "Okinawa Kita IC" }, lat: 26.3748, lon: 127.8204, day: 3, i: 7, min: 1025 },
    { id: "s3-8", kind: "stop", name: { ja: "那覇空港", en: "Naha Airport" }, lat: 26.1967, lon: 127.64895, day: 3, i: 8, min: 1105 },
    { id: "katsuren-beach", kind: "camp", name: { ja: "勝連ビーチ", en: "Katsuren Beach" }, lat: 26.3263, lon: 127.8775, link: "https://maps.app.goo.gl/Uvd7dxm7JLn6nKsF6" },
    { id: "okinawa-prefectural-people-s-forrest", kind: "camp", name: { ja: "沖縄県民の森", en: "Okinawa Prefectural People's Forrest" }, lat: 26.5117, lon: 127.9064, link: "https://maps.app.goo.gl/2y2mMv4doqEGUonM7" },
    { id: "koki-camp-spot", kind: "camp", name: { ja: "幸喜の野営地", en: "Koki Camp Spot" }, lat: 26.5436, lon: 127.96, link: "https://www.google.com/maps/place/26%C2%B032'36.8%22N+127%C2%B057'36.0%22E/@26.5437855,127.9584414,262m/data=!3m1!1e3!4m8!1m3!11m2!2skItwiim2KGlHKzS9245Y_LOdxVctbQ!3e3!3m3!8m2!3d26.5435556!4d127.96?entry=ttu" },
    { id: "nago-castle-bridge-spot", kind: "camp", name: { ja: "名護城橋の野営地", en: "Nago Castle Bridge Spot" }, lat: 26.58686, lon: 127.99276, link: "https://maps.app.goo.gl/4DiHnCXi4Fi8L97i8" },
    { id: "neos-outdoor-park", kind: "camp", name: { ja: "NEOSアウトドアパーク", en: "NEOS Outdoor Park" }, lat: 26.1482, lon: 127.8039, link: "https://www.google.com/maps/place/26%C2%B008'53.9%22N+127%C2%B048'18.5%22E/@26.1482968,127.8025511,590m/data=!3m2!1e3!4b1!4m4!3m3!8m2!3d26.148292!4d127.805126?entry=ttu&g_ep=EgoyMDI0MDgyMC4xIKXMDSoASAFQAw%3D%3D" },
    { id: "azama-sun-beach-camping-ground", kind: "camp", name: { ja: "あざまサンサンビーチ", en: "Azama Sun Beach Camping Ground" }, lat: 26.178, lon: 127.8292, link: "https://maps.app.goo.gl/ykBFkzo8djM3RUap9" },
    { id: "kita-nashiro-beach", kind: "camp", name: { ja: "北名城ビーチ", en: "Kita Nashiro Beach" }, lat: 26.108, lon: 127.6616, link: "https://www.google.com/maps/place/26%C2%B006'28.8%22N+127%C2%B039'42.0%22E/@26.1574819,127.6575679,12.5z/data=!4m4!3m3!8m2!3d26.108003!4d127.661654?authuser=1&entry=ttu" },
    { id: "kudeken-beach", kind: "camp", name: { ja: "久手堅ビーチ", en: "Kudeken Beach" }, lat: 26.1662, lon: 127.8256, link: "https://maps.app.goo.gl/fSZv7eJ8s4uF77ny7" },
    { id: "base-camp", kind: "camp", name: { ja: "ベースキャンプ", en: "Base Camp" }, lat: 26.61681, lon: 127.93812, link: "https://maps.app.goo.gl/1z98EaKALKR9ubxR9" },
    { id: "yagaji-beach-campsite", kind: "camp", name: { ja: "屋我地ビーチ キャンプ場", en: "Yagaji Beach Campsite" }, lat: 26.6482, lon: 128.03368, link: "https://www.google.com/maps/search/yagaji+beach+camping/@26.6481261,128.0308987,17z/data=!3m1!4b1?entry=ttu" },
    { id: "inamine-camp-spot", kind: "camp", name: { ja: "稲嶺の野営地", en: "Inamine Camp Spot" }, lat: 26.6346, lon: 128.05, link: "https://maps.app.goo.gl/9fTpH1cCbHkFpprV9" },
    { id: "yagajima-spot", kind: "camp", name: { ja: "屋我地島の野営地", en: "Yagajima Spot" }, lat: 26.65472, lon: 128.03404, link: "https://maps.app.goo.gl/HrZcLm1K6aRrayb26" },
    { id: "henan-bridge", kind: "camp", name: { ja: "平南橋", en: "Henan Bridge" }, lat: 26.6499, lon: 128.0877, link: "https://www.google.com/maps/place/26%C2%B038'59.4%22N+128%C2%B005'15.7%22E/@26.6497186,128.0874132,67m/data=!3m1!1e3!4m4!3m3!8m2!3d26.649824!4d128.087702?authuser=1&entry=ttu" },
    { id: "tsuha-beach-camp-spot", kind: "camp", name: { ja: "津波ビーチの野営地", en: "Tsuha Beach Camp Spot" }, lat: 26.6615, lon: 128.1015, link: "https://www.google.com/maps/place/26%C2%B039'41.3%22N+128%C2%B006'05.3%22E/@26.6614431,128.1009642,139m/data=!3m1!1e3!4m4!3m3!8m2!3d26.661466!4d128.101462?authuser=1&entry=ttu" },
    { id: "tonokiya-campsite", kind: "camp", name: { ja: "渡野喜屋キャンプ場", en: "Tonokiya Campsite" }, lat: 26.66378, lon: 128.10874, link: "https://maps.app.goo.gl/w5TqEBiigaZwMsPS9" },
    { id: "kouri-island-camp-ground", kind: "camp", name: { ja: "古宇利島キャンプ場", en: "Kouri Island Camp Ground" }, lat: 26.7085, lon: 128.018, link: "https://maps.app.goo.gl/Vk5gPnS14gfpJqYJ8" },
    { id: "daiboo-river-camp", kind: "camp", name: { ja: "大保川キャンプ場", en: "Daiboo River Camp" }, lat: 26.65352, lon: 128.14329, link: "https://maps.app.goo.gl/HtPGd8hyqt3myoMw6" },
    { id: "fukuchi-river-seaside-park", kind: "camp", name: { ja: "福地川海浜公園", en: "Fukuchi River Seaside Park" }, lat: 26.6316, lon: 128.1586, link: "https://maps.app.goo.gl/zXJEK7k2b2BVBgJr8" },
    { id: "kokyono-beach", kind: "camp", name: { ja: "コキョウノビーチ", en: "Kokyono Beach" }, lat: 26.7466, lon: 128.172, link: "https://www.google.com/maps/place/26%C2%B044'47.6%22N+128%C2%B010'19.0%22E/@26.7465407,128.1711413,227m/data=!3m1!1e3!4m4!3m3!8m2!3d26.746565!4d128.171939?authuser=1&entry=ttu" },
    { id: "hentona-camp-spot", kind: "camp", name: { ja: "辺土名の野営地", en: "Hentona Camp Spot" }, lat: 26.7506, lon: 128.1849, link: "https://www.google.com/maps/place/26%C2%B045'02.0%22N+128%C2%B011'05.8%22E/@26.7500591,128.1839969,370m/data=!3m1!1e3!4m10!1m5!3m4!2zMjbCsDQ3JzU0LjIiTiAxMjjCsDEzJzU1LjciRQ!8m2!3d26.7983889!4d128.2321389!3m3!8m2!3d26.750541!4d128.184956?authuser=1&entry=ttu" },
    { id: "okuma-mountains", kind: "camp", name: { ja: "奥間の山あい", en: "Okuma Mountains" }, lat: 26.7296, lon: 128.1904, link: "https://maps.app.goo.gl/NmPtRRuQFPK5Qb7b9" },
    { id: "benoki-camp-spot", kind: "camp", name: { ja: "辺野喜の野営地", en: "Benoki Camp Spot" }, lat: 26.7985, lon: 128.2321, link: "https://www.google.com/maps/place/26%C2%B047'54.2%22N+128%C2%B013'55.7%22E/@26.7985574,128.2321175,156m/data=!3m1!1e3!4m4!3m3!8m2!3d26.798378!4d128.232139?authuser=1&entry=ttu" },
    { id: "yanbaru-discovery-forest", kind: "camp", name: { ja: "やんばる学びの森", en: "Yanbaru Discovery Forest" }, lat: 26.7235, lon: 128.2649, link: "https://maps.app.goo.gl/zYafRAvFhUYwAG3fA" },
    { id: "aha-yanbaru", kind: "camp", name: { ja: "安波（やんばる）", en: "Aha, Yanbaru" }, lat: 26.7159, lon: 128.2939, link: "https://www.google.com/maps/place/26%C2%B042'57.2%22N+128%C2%B017'38.4%22E/@26.7149311,128.2914264,17.75z/data=!4m4!3m3!8m2!3d26.715876!4d128.293995?authuser=1&entry=ttu" },
    { id: "oku-beach-road", kind: "camp", name: { ja: "奥のビーチロード", en: "Oku Beach Road" }, lat: 26.8462, lon: 128.2857, link: "https://www.google.com/maps/place/26%C2%B050'45.8%22N+128%C2%B017'08.5%22E/@26.8452102,128.2842858,523m/data=!3m1!1e3!4m4!3m3!8m2!3d26.846056!4d128.285682?authuser=1&entry=ttu" },
    { id: "adan-beach-campsite", kind: "camp", name: { ja: "アダンビーチ キャンプ場", en: "Adan Beach Campsite" }, lat: 26.821, lon: 128.3135, link: "https://maps.app.goo.gl/NFrjgX2ypCiQRxbq8" },
    { id: "n-hiji-falls", kind: "nature", name: { ja: "比地大滝", en: "Hiji Falls" }, lat: 26.71053, lon: 128.18661 },
    { id: "n-ta-falls", kind: "nature", name: { ja: "ター滝", en: "Ta Falls" }, lat: 26.63136, lon: 128.09272 },
    { id: "n-kayauchi-banta", kind: "nature", name: { ja: "茅打バンタ", en: "Kayauchi Banta" }, lat: 26.85432, lon: 128.24978 },
    { id: "n-cape-hedo", kind: "nature", name: { ja: "辺戸岬", en: "Cape Hedo" }, lat: 26.87197, lon: 128.26564 },
    { id: "n-gorilla-chop", kind: "nature", name: { ja: "ゴリラチョップ", en: "Gorilla Chop" }, lat: 26.63703, lon: 127.88235 },
    { id: "n-fureai-hirugi-park", kind: "nature", name: { ja: "ふれあいヒルギ公園", en: "Fureai Hirugi Park" }, lat: 26.60399, lon: 128.14484 },
    { id: "n-diamond-beach", kind: "nature", name: { ja: "ダイヤモンドビーチ", en: "Diamond Beach" }, lat: 26.50675, lon: 127.87912 },
    { id: "n-kouri-island", kind: "nature", name: { ja: "古宇利島", en: "Kouri Island" }, lat: 26.7073, lon: 128.01817 },
    { id: "n-bise-fukugi-tree-road", kind: "nature", name: { ja: "備瀬のフクギ並木", en: "Bise Fukugi tree road" }, lat: 26.70159, lon: 127.88022 },
    { id: "f-aragaki-zenzai", kind: "food", name: { ja: "新垣ぜんざい屋", en: "Aragaki Zenzai" }, lat: 26.66063, lon: 127.89583 },
    { id: "f-kishimoto-shokudo", kind: "food", name: { ja: "きしもと食堂", en: "Kishimoto Shokudo" }, lat: 26.66032, lon: 127.8959 },
    { id: "f-higashi-shokudo", kind: "food", name: { ja: "ひがし食堂", en: "Higashi Shokudo" }, lat: 26.58881, lon: 127.98866 },
    { id: "f-mitsuya-kyoda", kind: "food", name: { ja: "三矢 道の駅許田店", en: "Mitsuya, Kyoda" }, lat: 26.55201, lon: 127.96999 },
    { id: "f-ryupin-onna", kind: "food", name: { ja: "琉冰 おんなの駅", en: "Ryupin, Onna" }, lat: 26.43624, lon: 127.7947 },
    { id: "f-tsurukamedo", kind: "food", name: { ja: "鶴亀堂ぜんざい", en: "Tsurukamedo" }, lat: 26.4062, lon: 127.74229 },
    { id: "f-kori-wo-kizame", kind: "food", name: { ja: "氷ヲ刻メ", en: "Kori wo Kizame" }, lat: 26.32752, lon: 127.75176 },
    { id: "f-kajinho", kind: "food", name: { ja: "花人逢", en: "Kajinho" }, lat: 26.66859, lon: 127.90082 },
    { id: "f-cafe-cahaya-bulan", kind: "food", name: { ja: "cafe CAHAYA BULAN", en: "Cafe Cahaya Bulan" }, lat: 26.70213, lon: 127.87989 },
    { id: "f-anettai-chaya", kind: "food", name: { ja: "亜熱帯茶屋", en: "Anettai Chaya" }, lat: 26.66711, lon: 127.90033 },
    { id: "f-banta-cafe", kind: "food", name: { ja: "バンタカフェ", en: "Banta Cafe" }, lat: 26.41772, lon: 127.71401 }
  ],
  legs: [
    { day: 1, i: 1, from: "s1-0", to: "s1-1", mode: "bus", min: 40, km: 33.5, line: [[127.64999,26.19687],[127.65006,26.19548],[127.65569,26.1952],[127.65699,26.19531],[127.65868,26.19564],[127.65913,26.19563],[127.65924,26.19558],[127.65905,26.19491],[127.65912,26.19383],[127.6595,26.19321],[127.65969,26.19313],[127.66311,26.19388],[127.66416,26.19428],[127.6648,26.19472],[127.6688,26.19805],[127.66964,26.19846],[127.6748,26.2006],[127.67578,26.19806],[127.67641,26.19665],[127.67642,26.19628],[127.68101,26.19459],[127.68156,26.19462],[127.6818,26.19481],[127.68203,26.19521],[127.68546,26.19394],[127.68648,26.19371],[127.69457,26.19381],[127.69621,26.19381],[127.69719,26.19372],[127.69801,26.19357],[127.69933,26.19318],[127.70189,26.19199],[127.70257,26.19174],[127.70368,26.19156],[127.70481,26.19164],[127.70606,26.19207],[127.7089,26.19372],[127.71149,26.19509],[127.71198,26.19548],[127.71253,26.19609],[127.71286,26.19661],[127.71402,26.19929],[127.71444,26.20009],[127.71488,26.20067],[127.71533,26.20106],[127.71602,26.20142],[127.71643,26.20155],[127.7188,26.20193],[127.71955,26.20213],[127.72022,26.20245],[127.72089,26.20302],[127.72118,26.20338],[127.72158,26.2041],[127.72315,26.20727],[127.72323,26.2076],[127.72319,26.20801],[127.72267,26.20932],[127.72261,26.20979],[127.72269,26.21007],[127.72326,26.21114],[127.72344,26.21135],[127.72375,26.21208],[127.724,26.21239],[127.72425,26.21247],[127.72448,26.21243],[127.7247,26.21226],[127.72506,26.21177],[127.72554,26.21163],[127.72656,26.21201],[127.7274,26.21221],[127.73081,26.21266],[127.73268,26.21298],[127.73422,26.21338],[127.73624,26.21409],[127.73729,26.21464],[127.73819,26.21538],[127.7389,26.21637],[127.73919,26.21705],[127.73937,26.21786],[127.73929,26.21916],[127.73912,26.21986],[127.73837,26.22196],[127.73819,26.22271],[127.73807,26.22371],[127.73816,26.22576],[127.73859,26.22838],[127.73941,26.23213],[127.74016,26.23491],[127.74067,26.23646],[127.74152,26.23864],[127.74223,26.24006],[127.74301,26.24132],[127.74455,26.24336],[127.74586,26.24474],[127.74786,26.24643],[127.74949,26.24745],[127.75082,26.24804],[127.75209,26.24843],[127.75572,26.24891],[127.75725,26.24924],[127.75845,26.24977],[127.75923,26.25024],[127.75983,26.25073],[127.7607,26.2517],[127.76232,26.2542],[127.76335,26.25537],[127.76438,26.25622],[127.76498,26.25661],[127.76768,26.25815],[127.7686,26.25875],[127.77015,26.26002],[127.77116,26.26107],[127.77177,26.26181],[127.77268,26.26323],[127.77351,26.26478],[127.77549,26.26909],[127.77688,26.27131],[127.77797,26.27272],[127.78404,26.27961],[127.78472,26.28045],[127.78572,26.28192],[127.78634,26.28311],[127.78696,26.28473],[127.78772,26.2881],[127.7883,26.28995],[127.78933,26.29206],[127.79159,26.29599],[127.79215,26.29719],[127.79243,26.29827],[127.79251,26.29893],[127.79249,26.29995],[127.79228,26.30101],[127.79204,26.3017],[127.79148,26.30277],[127.78958,26.30562],[127.78919,26.30632],[127.78834,26.3086],[127.78799,26.31044],[127.78795,26.31212],[127.78812,26.31369],[127.78847,26.31509],[127.78936,26.31784],[127.78958,26.3191],[127.78958,26.32006],[127.7894,26.32115],[127.78905,26.3222],[127.78855,26.32324],[127.78487,26.32916],[127.78442,26.33002],[127.78416,26.33083],[127.7841,26.33175],[127.78419,26.33237],[127.78445,26.3331],[127.7848,26.33366],[127.78526,26.3342],[127.78594,26.33473],[127.78661,26.33511],[127.78878,26.33595],[127.79248,26.33685],[127.79332,26.33712],[127.7941,26.33746],[127.79499,26.33799],[127.79612,26.33901],[127.79743,26.34085],[127.79981,26.3446],[127.80152,26.34767],[127.80239,26.34945],[127.80289,26.35065],[127.80365,26.35319],[127.80446,26.35745],[127.80488,26.35902],[127.80588,26.36124],[127.80662,26.36248],[127.80801,26.36434],[127.80968,26.36613],[127.81116,26.36749],[127.8148,26.37047],[127.81661,26.37236],[127.81738,26.37338],[127.81781,26.37412],[127.81797,26.37457],[127.81793,26.37485],[127.81778,26.37503],[127.8174,26.37511],[127.81715,26.37496],[127.81706,26.37474],[127.81708,26.37454],[127.81732,26.37417],[127.81779,26.37383],[127.8183,26.37368],[127.81902,26.37374],[127.81964,26.37402],[127.82011,26.37437],[127.82026,26.37474],[127.82039,26.37475]] },
    { day: 1, i: 2, from: "s1-1", to: "s1-2", mode: "walk", line: [[127.8204,26.3748],[127.82639,26.38051]] },
    { day: 1, i: 3, from: "s1-2", to: "s1-3", mode: "drive", min: 26, km: 22.1, line: [[127.82639,26.38027],[127.82676,26.38032],[127.82689,26.38058],[127.82711,26.38051],[127.82652,26.37995],[127.8242,26.37865],[127.82204,26.37708],[127.82152,26.37627],[127.82115,26.37477],[127.82072,26.37473],[127.82013,26.37418],[127.81952,26.37384],[127.8186,26.37361],[127.81811,26.37365],[127.81776,26.37377],[127.81729,26.3741],[127.81706,26.3744],[127.81698,26.37474],[127.81709,26.37501],[127.81741,26.37519],[127.81811,26.37528],[127.81843,26.37543],[127.81869,26.37579],[127.81894,26.37637],[127.81926,26.37792],[127.8193,26.38124],[127.81943,26.38233],[127.81961,26.38309],[127.82012,26.38447],[127.82042,26.38504],[127.82106,26.38607],[127.82274,26.38845],[127.82339,26.38975],[127.82372,26.39073],[127.82393,26.39185],[127.82396,26.39346],[127.82384,26.39439],[127.82348,26.39598],[127.82246,26.39886],[127.82199,26.39981],[127.82076,26.40192],[127.81872,26.40459],[127.81433,26.40896],[127.81345,26.40996],[127.81283,26.41082],[127.81207,26.41206],[127.81148,26.41341],[127.81095,26.41515],[127.81076,26.41643],[127.81075,26.41828],[127.8111,26.42075],[127.81185,26.42351],[127.81277,26.42571],[127.81413,26.4281],[127.81529,26.42972],[127.81739,26.43205],[127.81933,26.43374],[127.82082,26.43484],[127.8231,26.4362],[127.82505,26.43713],[127.82662,26.43773],[127.82808,26.4382],[127.83029,26.43876],[127.83477,26.4395],[127.8368,26.43994],[127.83885,26.44065],[127.84073,26.44168],[127.84166,26.44233],[127.84295,26.44349],[127.84363,26.44425],[127.84436,26.44524],[127.84514,26.44668],[127.84662,26.4504],[127.84746,26.45219],[127.84825,26.45346],[127.8496,26.45511],[127.85099,26.45641],[127.85166,26.45692],[127.85361,26.45814],[127.85581,26.45912],[127.85795,26.45974],[127.8601,26.46008],[127.86168,26.46016],[127.86307,26.46011],[127.86756,26.45972],[127.86906,26.45978],[127.87079,26.46002],[127.87466,26.46101],[127.87588,26.46125],[127.87698,26.46137],[127.8788,26.46138],[127.88036,26.4612],[127.88247,26.46063],[127.88725,26.45862],[127.88938,26.45794],[127.89178,26.45743],[127.89332,26.45724],[127.89458,26.45718],[127.89609,26.4572],[127.89768,26.45732],[127.89949,26.45771],[127.89995,26.45792],[127.90023,26.45814],[127.90086,26.45903],[127.9011,26.45913],[127.90144,26.45912],[127.90165,26.45904],[127.9019,26.45879],[127.90202,26.458],[127.9017,26.45715],[127.90087,26.456],[127.90023,26.45463],[127.90005,26.45361],[127.90003,26.45241],[127.89989,26.45198],[127.89945,26.45154],[127.89895,26.45139],[127.89844,26.45143],[127.8975,26.45183],[127.89712,26.4518],[127.89667,26.45143],[127.89666,26.45128],[127.89686,26.451],[127.8971,26.45088],[127.89931,26.44997],[127.90041,26.44966],[127.90204,26.44935],[127.90278,26.44939],[127.90408,26.44974],[127.90455,26.44979],[127.90627,26.44976],[127.90736,26.44945],[127.9086,26.44962],[127.90898,26.44981],[127.90966,26.45038],[127.91016,26.45053],[127.91074,26.45057],[127.91118,26.45073],[127.91199,26.45159],[127.91303,26.45221],[127.91347,26.45266],[127.91384,26.45265],[127.91458,26.45307],[127.91722,26.45334],[127.91722,26.45328]] },
    { day: 1, i: 4, from: "s1-3", to: "s1-4", mode: "drive", min: 19, km: 14, line: [[127.91722,26.45328],[127.91711,26.45421],[127.91998,26.45405],[127.92223,26.45364],[127.92277,26.4536],[127.92349,26.45374],[127.92557,26.45437],[127.92594,26.45454],[127.92813,26.45745],[127.9293,26.45842],[127.92997,26.45949],[127.93039,26.45987],[127.93061,26.4602],[127.93093,26.46098],[127.93102,26.46151],[127.93097,26.46194],[127.9306,26.46266],[127.92907,26.46416],[127.92799,26.46482],[127.927,26.46582],[127.92472,26.46712],[127.9225,26.46918],[127.92186,26.46986],[127.92141,26.47056],[127.92031,26.47262],[127.91849,26.4747],[127.91748,26.47668],[127.91703,26.47734],[127.91618,26.47818],[127.91418,26.47964],[127.91368,26.48022],[127.91281,26.48181],[127.91245,26.48301],[127.90942,26.48591],[127.90861,26.48625],[127.90833,26.48644],[127.90731,26.48775],[127.90699,26.48861],[127.90618,26.48943],[127.90593,26.48994],[127.90594,26.49035],[127.90615,26.49128],[127.9061,26.49154],[127.90587,26.49175],[127.90551,26.49191],[127.90493,26.4924],[127.90449,26.49255],[127.90405,26.49247],[127.90333,26.49205],[127.90294,26.49207],[127.90235,26.49225],[127.90176,26.4927],[127.90071,26.4926],[127.89933,26.49305],[127.89839,26.4932],[127.89797,26.49319],[127.89774,26.49289],[127.89759,26.49239],[127.89721,26.49234],[127.89608,26.49276],[127.89532,26.49318],[127.89454,26.49342],[127.89395,26.49395],[127.89359,26.49396],[127.89285,26.49372],[127.89235,26.49384],[127.89213,26.49406],[127.89204,26.49435],[127.89236,26.49562],[127.89199,26.49664],[127.89198,26.49694],[127.8921,26.49721],[127.89291,26.49816],[127.89354,26.49921],[127.89367,26.49962],[127.89366,26.49988],[127.89347,26.50023],[127.89326,26.50044],[127.8917,26.50142],[127.89132,26.50156],[127.89023,26.50164],[127.88947,26.50225],[127.88858,26.50148],[127.88814,26.50119],[127.88753,26.50102],[127.88628,26.5009],[127.88568,26.50106],[127.88281,26.50261],[127.88043,26.50345],[127.87303,26.5048],[127.87219,26.50483],[127.8718,26.50477],[127.87126,26.50461],[127.87074,26.50433],[127.86595,26.50107],[127.86358,26.49972],[127.86253,26.49891],[127.86082,26.49725],[127.85958,26.49821],[127.85861,26.49826],[127.85826,26.498],[127.85786,26.49804],[127.85761,26.49836],[127.85734,26.49892],[127.85759,26.49936],[127.85484,26.49882],[127.85471,26.49912],[127.85424,26.49976],[127.85387,26.50065],[127.85338,26.50136],[127.85249,26.50177],[127.85081,26.50382],[127.85048,26.5039],[127.85009,26.50384],[127.84974,26.50401]] },
    { day: 1, i: 5, from: "s1-4", to: "s1-5", mode: "drive", min: 36, km: 24.5, line: [[127.84974,26.50401],[127.85009,26.50384],[127.85048,26.5039],[127.85081,26.50382],[127.85249,26.50177],[127.85338,26.50136],[127.85387,26.50065],[127.85424,26.49976],[127.85471,26.49912],[127.85484,26.49882],[127.85759,26.49936],[127.85734,26.49892],[127.85761,26.49836],[127.85786,26.49804],[127.85826,26.498],[127.85861,26.49826],[127.85958,26.49821],[127.86082,26.49725],[127.86253,26.49891],[127.86358,26.49972],[127.86595,26.50107],[127.87074,26.50433],[127.87126,26.50461],[127.87219,26.50483],[127.87303,26.5048],[127.87968,26.50362],[127.88065,26.50339],[127.88281,26.50261],[127.88568,26.50106],[127.88614,26.50092],[127.88658,26.5009],[127.88791,26.5011],[127.88858,26.50148],[127.89,26.50272],[127.89028,26.5031],[127.89041,26.50369],[127.89007,26.50483],[127.89011,26.50549],[127.89029,26.50583],[127.89147,26.50703],[127.8918,26.50752],[127.89199,26.50821],[127.89227,26.51039],[127.89247,26.51101],[127.89307,26.51166],[127.89375,26.51204],[127.89406,26.51216],[127.89453,26.51222],[127.89654,26.51214],[127.89706,26.51205],[127.89837,26.51146],[127.89902,26.51146],[127.89941,26.51158],[127.89994,26.51196],[127.90147,26.51364],[127.90194,26.51394],[127.90294,26.51431],[127.90324,26.51449],[127.90357,26.51482],[127.90423,26.51577],[127.90455,26.51611],[127.90586,26.51684],[127.90691,26.51798],[127.9073,26.51819],[127.90762,26.51827],[127.90817,26.51827],[127.90864,26.5181],[127.91005,26.51688],[127.91041,26.51667],[127.91095,26.51649],[127.91276,26.51606],[127.91332,26.51612],[127.91444,26.51638],[127.915,26.51636],[127.9155,26.51612],[127.91609,26.51552],[127.91654,26.51526],[127.91719,26.51517],[127.9177,26.51538],[127.91871,26.51622],[127.91919,26.51683],[127.91948,26.51765],[127.9195,26.51874],[127.91961,26.51915],[127.91986,26.51951],[127.92073,26.52023],[127.92091,26.52049],[127.92108,26.52103],[127.92105,26.52204],[127.92118,26.52245],[127.92243,26.52426],[127.92311,26.52499],[127.92367,26.52538],[127.92635,26.52658],[127.92997,26.53],[127.93023,26.53046],[127.93072,26.53285],[127.93112,26.53388],[127.93186,26.5349],[127.93279,26.53568],[127.93345,26.53612],[127.93447,26.5365],[127.93525,26.53658],[127.93945,26.53595],[127.94046,26.53561],[127.94176,26.53482],[127.94243,26.53465],[127.94307,26.53473],[127.94442,26.53517],[127.94506,26.53557],[127.94724,26.53765],[127.94862,26.53853],[127.94916,26.53899],[127.95166,26.54213],[127.95193,26.54265],[127.95212,26.54381],[127.95247,26.54432],[127.95287,26.54463],[127.95334,26.54486],[127.95446,26.54515],[127.95746,26.54532],[127.95798,26.54531],[127.95844,26.54518],[127.95892,26.54484],[127.95919,26.54441],[127.95945,26.542],[127.95959,26.5416],[127.95993,26.54119],[127.96041,26.5409],[127.96135,26.54056],[127.96251,26.54035],[127.96322,26.54041],[127.96376,26.54073],[127.96441,26.54149],[127.96487,26.54236],[127.96497,26.544],[127.96518,26.54521],[127.96577,26.54664],[127.96657,26.54772],[127.96684,26.54831],[127.967,26.54904],[127.967,26.55034],[127.96723,26.55091],[127.96757,26.55133],[127.96794,26.55163],[127.96852,26.55194],[127.96978,26.55245],[127.97073,26.55316],[127.97115,26.55364],[127.97213,26.55529],[127.97268,26.55596],[127.97355,26.55669],[127.97509,26.55781],[127.97572,26.55841],[127.97661,26.55968],[127.9778,26.56211],[127.97937,26.56426],[127.98011,26.56555],[127.98047,26.56648],[127.98068,26.56733],[127.98098,26.57077],[127.98123,26.57181],[127.98195,26.57304],[127.98348,26.57458],[127.98408,26.57553],[127.98456,26.57706],[127.98509,26.57927],[127.98517,26.57981],[127.98511,26.58093],[127.98462,26.58323],[127.98413,26.58476],[127.98551,26.58546],[127.98662,26.5862],[127.98606,26.58717],[127.98584,26.58732],[127.98584,26.58748],[127.98541,26.58811],[127.98426,26.58955],[127.98234,26.59115],[127.9799,26.59257],[127.98011,26.59294],[127.9802,26.59331],[127.98,26.59351],[127.9792,26.59381],[127.97904,26.59401],[127.97933,26.59661],[127.97848,26.5984],[127.97824,26.59874],[127.97743,26.59931],[127.97653,26.60023],[127.97641,26.60051],[127.97652,26.60115],[127.97647,26.60149],[127.97483,26.60421],[127.97429,26.60477],[127.97333,26.60535]] },
    { day: 1, i: 6, from: "s1-5", to: "s1-6", mode: "drive", min: 1, km: 0.8, line: [[127.97333,26.60535],[127.97429,26.60477],[127.97477,26.60429],[127.97651,26.60139],[127.97652,26.60123],[127.97574,26.60111],[127.97505,26.60078],[127.97477,26.60113]] },
    { day: 1, i: 7, from: "s1-6", to: "s1-7", mode: "drive", min: 21, km: 14.8, line: [[127.97477,26.60113],[127.97505,26.60078],[127.97574,26.60111],[127.97652,26.60123],[127.97642,26.60159],[127.97489,26.60412],[127.98256,26.60797],[127.98382,26.60845],[127.98482,26.60861],[127.98557,26.60861],[127.98655,26.60845],[127.98876,26.60783],[127.98945,26.6078],[127.99016,26.60787],[127.99245,26.60858],[127.99366,26.60877],[127.99523,26.6087],[127.99778,26.60815],[127.9986,26.60818],[127.99944,26.60846],[128.00029,26.60906],[128.00073,26.60963],[128.00155,26.61095],[128.00223,26.61162],[128.00324,26.6122],[128.00512,26.613],[128.00559,26.61336],[128.00702,26.61485],[128.00776,26.61538],[128.00874,26.61585],[128.00985,26.61611],[128.01074,26.6162],[128.01268,26.61621],[128.01363,26.61635],[128.01462,26.61672],[128.01523,26.61711],[128.01574,26.61758],[128.01751,26.61989],[128.02105,26.62347],[128.02136,26.62367],[128.02285,26.62429],[128.02357,26.62475],[128.02587,26.62723],[128.02729,26.62836],[128.03789,26.63538],[128.0386,26.63574],[128.03966,26.63602],[128.04093,26.63601],[128.04832,26.63429],[128.04926,26.63423],[128.05076,26.63443],[128.05244,26.63489],[128.0548,26.63577],[128.0552,26.63598],[128.05595,26.63659],[128.05633,26.63676],[128.05787,26.63699],[128.05916,26.63748],[128.05984,26.63796],[128.06163,26.63958],[128.06333,26.64059],[128.06468,26.64125],[128.06627,26.64169],[128.06731,26.64248],[128.06779,26.64271],[128.06967,26.64291],[128.07017,26.64319],[128.071,26.64391],[128.07147,26.64417],[128.07223,26.64428],[128.07475,26.644],[128.07654,26.64426],[128.07716,26.6443],[128.07887,26.64421],[128.07924,26.64424],[128.07964,26.64437],[128.08114,26.6456],[128.08324,26.64655],[128.08371,26.64691],[128.08398,26.64725],[128.08415,26.64762],[128.08434,26.64905],[128.08453,26.64937],[128.0849,26.6497],[128.08555,26.64993],[128.08713,26.64982],[128.08763,26.64993],[128.08802,26.65017],[128.08838,26.65061],[128.0889,26.65198],[128.08922,26.65235],[128.08959,26.65257],[128.09075,26.65294],[128.09124,26.65336],[128.09224,26.65548],[128.0929,26.65657]] },
    { day: 2, i: 1, from: "s2-0", to: "s2-1", mode: "drive", min: 44, km: 30.9, line: [[128.0929,26.65657],[128.09224,26.65548],[128.09124,26.65336],[128.09075,26.65294],[128.08959,26.65257],[128.08922,26.65235],[128.0889,26.65198],[128.08838,26.65061],[128.08802,26.65017],[128.08763,26.64993],[128.08713,26.64982],[128.08555,26.64993],[128.0849,26.6497],[128.08453,26.64937],[128.08434,26.64905],[128.08415,26.64762],[128.08398,26.64725],[128.08371,26.64691],[128.08324,26.64655],[128.08114,26.6456],[128.07964,26.64437],[128.07924,26.64424],[128.07887,26.64421],[128.07716,26.6443],[128.07654,26.64426],[128.07475,26.644],[128.07223,26.64428],[128.07147,26.64417],[128.071,26.64391],[128.07017,26.64319],[128.06967,26.64291],[128.06779,26.64271],[128.06731,26.64248],[128.06627,26.64169],[128.06468,26.64125],[128.06333,26.64059],[128.06163,26.63958],[128.05984,26.63796],[128.05916,26.63748],[128.05787,26.63699],[128.05633,26.63676],[128.05595,26.63659],[128.0552,26.63598],[128.0548,26.63577],[128.05244,26.63489],[128.05076,26.63443],[128.04926,26.63423],[128.04832,26.63429],[128.04093,26.63601],[128.03966,26.63602],[128.0386,26.63574],[128.03789,26.63538],[128.02729,26.62836],[128.02587,26.62723],[128.02357,26.62475],[128.02285,26.62429],[128.02136,26.62367],[128.02105,26.62347],[128.01751,26.61989],[128.01574,26.61758],[128.01523,26.61711],[128.01462,26.61672],[128.01363,26.61635],[128.01268,26.61621],[128.01074,26.6162],[128.00985,26.61611],[128.00874,26.61585],[128.00776,26.61538],[128.00702,26.61485],[128.00559,26.61336],[128.00512,26.613],[128.00324,26.6122],[128.00263,26.61185],[128.00163,26.61088],[128.00036,26.60897],[127.9995,26.60837],[127.99885,26.60812],[127.99793,26.60804],[127.99714,26.60815],[127.99523,26.6086],[127.99369,26.60868],[127.9925,26.60849],[127.99039,26.60782],[127.98926,26.6077],[127.98834,26.60782],[127.98656,26.60836],[127.98571,26.6085],[127.98484,26.60851],[127.98373,26.60831],[127.98292,26.60804],[127.97727,26.60521],[127.96955,26.60127],[127.96799,26.60037],[127.96787,26.6004],[127.96716,26.60105],[127.96666,26.60134],[127.96286,26.60254],[127.96168,26.60302],[127.95485,26.60668],[127.95394,26.60707],[127.9533,26.60719],[127.95222,26.60711],[127.94631,26.60548],[127.94578,26.60511],[127.94448,26.60346],[127.94429,26.6033],[127.94376,26.60306],[127.94126,26.6026],[127.94084,26.60256],[127.94026,26.60262],[127.93975,26.60282],[127.93821,26.60364],[127.93753,26.60387],[127.93689,26.60396],[127.93534,26.60388],[127.93498,26.60391],[127.93431,26.60412],[127.93369,26.60452],[127.93113,26.60699],[127.92931,26.60826],[127.9283,26.60879],[127.92671,26.60941],[127.92581,26.60969],[127.92463,26.60992],[127.92288,26.60991],[127.92135,26.60967],[127.92064,26.60952],[127.91969,26.60905],[127.91884,26.60833],[127.91819,26.60757],[127.91761,26.60639],[127.91704,26.60444],[127.91651,26.60357],[127.91566,26.60278],[127.91447,26.60199],[127.91366,26.60162],[127.91294,26.60148],[127.9123,26.60148],[127.91167,26.60158],[127.90735,26.60258],[127.89655,26.60619],[127.89576,26.60666],[127.89546,26.60703],[127.89523,26.60758],[127.89522,26.60864],[127.8955,26.61303],[127.89539,26.61397],[127.89512,26.61481],[127.89432,26.61609],[127.8919,26.61848],[127.89146,26.61903],[127.8912,26.61971],[127.89103,26.62135],[127.8907,26.62203],[127.88809,26.62423],[127.88756,26.6248],[127.88731,26.62522],[127.88712,26.6257],[127.88701,26.62635],[127.88701,26.62971],[127.88684,26.63054],[127.88648,26.63152],[127.88594,26.63263],[127.88251,26.63757],[127.88159,26.63963],[127.88141,26.64029],[127.88137,26.64092],[127.88174,26.64308],[127.88176,26.64371],[127.88144,26.64638],[127.88145,26.64851],[127.88123,26.64962],[127.88088,26.65048],[127.87278,26.64871],[127.87246,26.6486],[127.8715,26.64783],[127.87104,26.64762],[127.86977,26.64736],[127.86844,26.64738],[127.86805,26.64731],[127.86632,26.64621],[127.86523,26.64528],[127.86356,26.6431],[127.86333,26.64263],[127.86318,26.64197]] },
    { day: 2, i: 2, from: "s2-1", to: "s2-2", mode: "boat", line: [[127.863,26.642],[127.81791,26.64767]] },
    { day: 2, i: 3, from: "s2-2", to: "s2-1", mode: "boat", line: [[127.81791,26.64767],[127.863,26.642]] },
    { day: 2, i: 3, from: "s2-1", to: "s2-3", mode: "drive", min: 24, km: 16.4, line: [[127.86318,26.64197],[127.86333,26.64263],[127.86356,26.6431],[127.86523,26.64528],[127.86632,26.64621],[127.86805,26.64731],[127.86844,26.64738],[127.86977,26.64736],[127.87104,26.64762],[127.8715,26.64783],[127.87246,26.6486],[127.87278,26.64871],[127.88099,26.65051],[127.88132,26.64964],[127.8815,26.64887],[127.88152,26.64654],[127.88186,26.64364],[127.88179,26.64272],[127.88147,26.64113],[127.88147,26.64053],[127.8816,26.63991],[127.88246,26.63784],[127.88593,26.6328],[127.88653,26.63163],[127.88696,26.63047],[127.88713,26.62949],[127.8871,26.62635],[127.88718,26.62582],[127.8874,26.62523],[127.88774,26.62471],[127.8881,26.62433],[127.89079,26.62205],[127.89112,26.62138],[127.89131,26.61961],[127.89158,26.61899],[127.89431,26.61624],[127.89482,26.61556],[127.8952,26.61485],[127.89548,26.61394],[127.8956,26.61293],[127.89532,26.60813],[127.89535,26.60759],[127.89557,26.60706],[127.89615,26.60648],[127.89658,26.60627],[127.89889,26.60548],[127.90697,26.60278],[127.90846,26.60237],[127.91128,26.60174],[127.91227,26.60157],[127.91317,26.6016],[127.91386,26.60178],[127.91465,26.6022],[127.91606,26.60324],[127.91685,26.60424],[127.91769,26.60683],[127.91825,26.6078],[127.91897,26.60859],[127.91986,26.60924],[127.92061,26.60959],[127.92246,26.60992],[127.92366,26.61003],[127.92475,26.61],[127.926,26.60974],[127.92793,26.60904],[127.92936,26.60833],[127.93025,26.60777],[127.93119,26.60704],[127.93376,26.60458],[127.93406,26.60436],[127.93468,26.60408],[127.93532,26.60397],[127.93658,26.60404],[127.93754,26.60397],[127.93814,26.60378],[127.93981,26.60288],[127.94054,26.60266],[127.94116,26.60268],[127.94373,26.60314],[127.9444,26.60353],[127.9458,26.60528],[127.94654,26.60567],[127.94792,26.60606],[127.94734,26.60672],[127.9471,26.60712],[127.94697,26.60747],[127.94703,26.60785],[127.94796,26.60896],[127.94813,26.60955],[127.94836,26.60989],[127.94883,26.61044],[127.94943,26.61086],[127.94996,26.61202],[127.95023,26.61217],[127.95095,26.61227],[127.95123,26.6124],[127.95259,26.61368],[127.95305,26.6146],[127.95372,26.61517],[127.95385,26.61559],[127.95352,26.61721],[127.95375,26.61773],[127.95437,26.6186],[127.9563,26.61948],[127.95659,26.61901],[127.95675,26.6189],[127.95726,26.6188],[127.95764,26.61888],[127.95816,26.61919],[127.9586,26.61933],[127.95877,26.61979],[127.95885,26.61984],[127.95946,26.61999],[127.96048,26.6206],[127.96147,26.62093],[127.96172,26.62076],[127.96217,26.62076],[127.96302,26.62091],[127.96325,26.62076]] },
    { day: 2, i: 4, from: "s2-3", to: "s2-4", mode: "drive", min: 81, km: 73.6, line: [[127.96325,26.62076],[127.96355,26.62],[127.96392,26.61974],[127.96423,26.61968],[127.96495,26.61992],[127.96517,26.62016],[127.96523,26.62084],[127.96536,26.62114],[127.96574,26.6214],[127.96578,26.62202],[127.96602,26.62209],[127.96652,26.62025],[127.96692,26.61922],[127.96752,26.61847],[127.96909,26.61699],[127.9693,26.61659],[127.96934,26.61602],[127.96918,26.61495],[127.96931,26.6144],[127.96983,26.61361],[127.96999,26.61317],[127.96988,26.61172],[127.97013,26.61131],[127.97084,26.61065],[127.97097,26.61031],[127.9709,26.60984],[127.97066,26.60953],[127.97012,26.60908],[127.96994,26.6088],[127.96989,26.60844],[127.97002,26.60807],[127.97228,26.60601],[127.97429,26.60477],[127.97472,26.60435],[127.97503,26.60392],[127.97647,26.60149],[127.97652,26.60115],[127.97641,26.60051],[127.97653,26.60023],[127.97743,26.59931],[127.97835,26.59861],[127.97925,26.59685],[127.97933,26.59629],[127.97922,26.5959],[127.97927,26.59573],[127.97903,26.59407],[127.9792,26.59381],[127.98,26.59351],[127.9802,26.59331],[127.98011,26.59294],[127.9799,26.59257],[127.98234,26.59115],[127.98426,26.58955],[127.98512,26.58852],[127.98583,26.58749],[127.98602,26.58737],[127.98608,26.58713],[127.98662,26.5862],[127.98551,26.58546],[127.98421,26.5848],[127.98471,26.58323],[127.98521,26.58094],[127.98528,26.58027],[127.98517,26.57911],[127.98441,26.57614],[127.98408,26.57529],[127.98381,26.57485],[127.98351,26.57445],[127.98211,26.57308],[127.98175,26.57261],[127.98143,26.57201],[127.98122,26.57146],[127.98109,26.57082],[127.98083,26.56767],[127.98045,26.56609],[127.97978,26.56471],[127.97792,26.56209],[127.97643,26.55917],[127.97598,26.55856],[127.97526,26.5578],[127.97375,26.5566],[127.97262,26.55556],[127.97203,26.55482],[127.97125,26.55361],[127.9707,26.55298],[127.97034,26.55268],[127.96972,26.55232],[127.96804,26.55156],[127.96766,26.55129],[127.96734,26.55091],[127.96715,26.55052],[127.96706,26.55008],[127.96708,26.54913],[127.96698,26.5485],[127.96665,26.54773],[127.96576,26.54643],[127.96537,26.54544],[127.96518,26.54437],[127.96517,26.54255],[127.965,26.54196],[127.96462,26.54138],[127.9643,26.54107],[127.9637,26.54073],[127.96272,26.54051],[127.9617,26.54064],[127.96015,26.54119],[127.95918,26.54139],[127.958,26.54135],[127.957,26.54105],[127.95647,26.54078],[127.95599,26.5404],[127.95545,26.53979],[127.95516,26.53933],[127.95483,26.53825],[127.9548,26.53766],[127.95487,26.53712],[127.95515,26.53639],[127.95583,26.53545],[127.95656,26.5349],[127.95743,26.53449],[127.9581,26.53431],[127.95923,26.53416],[127.96299,26.53406],[127.96556,26.53381],[127.96824,26.53326],[127.9705,26.53248],[127.97236,26.53157],[127.97381,26.53061],[127.97549,26.52911],[127.97647,26.52793],[127.97722,26.5268],[127.97781,26.52564],[127.97822,26.52462],[127.97863,26.52302],[127.97881,26.52125],[127.97878,26.5168],[127.97887,26.51552],[127.9791,26.51404],[127.97945,26.5125],[127.9798,26.51148],[127.98051,26.50991],[127.98305,26.50542],[127.98354,26.50412],[127.98384,26.50287],[127.98395,26.50196],[127.9839,26.50043],[127.9837,26.49932],[127.98311,26.49753],[127.98249,26.49627],[127.98203,26.49556],[127.98102,26.49426],[127.98016,26.49338],[127.97925,26.49262],[127.97827,26.49196],[127.97725,26.4914],[127.97576,26.49076],[127.97435,26.49034],[127.97217,26.48998],[127.96965,26.48983],[127.96449,26.48976],[127.9621,26.48948],[127.96028,26.48904],[127.95915,26.48863],[127.95804,26.48813],[127.95696,26.48753],[127.95574,26.48668],[127.95435,26.48543],[127.95348,26.48444],[127.95065,26.48059],[127.94948,26.47946],[127.94826,26.47861],[127.94688,26.47792],[127.94538,26.47744],[127.94384,26.47715],[127.9409,26.47678],[127.93969,26.47651],[127.93816,26.4759],[127.9369,26.4751],[127.936,26.47427],[127.93513,26.47313],[127.93453,26.47198],[127.93346,26.46956],[127.93295,26.46868],[127.93221,26.46775],[127.9312,26.46684],[127.93021,26.46622],[127.92925,26.46578],[127.9282,26.46541],[127.927,26.46512],[127.92508,26.46484],[127.91977,26.46444],[127.91791,26.46423],[127.9146,26.46358],[127.91263,26.46299],[127.91013,26.46198],[127.9051,26.45947],[127.90254,26.45837],[127.90118,26.45793],[127.89955,26.45753],[127.8973,26.45718],[127.89534,26.45708],[127.8935,26.45712],[127.89078,26.45749],[127.88876,26.458],[127.88722,26.45852],[127.88335,26.46019],[127.88179,26.46074],[127.87986,26.46119],[127.87818,26.46131],[127.87645,26.46122],[127.87539,26.46105],[127.87078,26.45992],[127.86936,26.4597],[127.86769,26.45962],[127.86305,26.46001],[127.86087,26.46003],[127.8591,26.45984],[127.85799,26.45964],[127.85584,26.45902],[127.85407,26.45824],[127.85224,26.45718],[127.8507,26.45601],[127.84921,26.4545],[127.84847,26.45356],[127.84742,26.45184],[127.84683,26.45062],[127.84515,26.44643],[127.8445,26.44522],[127.8434,26.44382],[127.84262,26.44303],[127.84172,26.44226],[127.84079,26.44159],[127.83982,26.44101],[127.83844,26.44036],[127.83743,26.44],[127.83546,26.43951],[127.83061,26.4387],[127.8285,26.43821],[127.82577,26.4373],[127.82317,26.43612],[127.82199,26.43545],[127.82046,26.43445],[127.81944,26.43371],[127.81776,26.43226],[127.81598,26.4304],[127.81483,26.42893],[127.81397,26.42765],[127.81323,26.42635],[127.81222,26.42412],[127.81178,26.42285],[127.81125,26.42074],[127.81101,26.41937],[127.81089,26.41774],[127.81091,26.41642],[127.81123,26.41465],[127.8116,26.41345],[127.81199,26.41254],[127.81267,26.41125],[127.81327,26.41036],[127.81514,26.40826],[127.81888,26.40457],[127.82045,26.4026],[127.82163,26.40069],[127.82238,26.39925],[127.82282,26.3982],[127.82317,26.39731],[127.8237,26.39556],[127.82394,26.39443],[127.82407,26.39327],[127.82398,26.39147],[127.82367,26.39023],[127.82307,26.38881],[127.82251,26.38789],[127.82086,26.38556],[127.82023,26.38443],[127.81987,26.38351],[127.81963,26.38273],[127.81948,26.38185],[127.8194,26.37835],[127.81927,26.37727],[127.81897,26.37606],[127.81851,26.37499],[127.81789,26.37392],[127.81717,26.3729],[127.81596,26.37149],[127.81488,26.37042],[127.81123,26.36742],[127.80976,26.36606],[127.80777,26.36387],[127.8067,26.36243],[127.80625,26.3617],[127.80545,26.36011],[127.80482,26.35846],[127.80382,26.35351],[127.8035,26.35225],[127.80276,26.35003],[127.80216,26.34872],[127.80082,26.34617],[127.79916,26.34335],[127.79753,26.3408],[127.79621,26.33897],[127.79538,26.33817],[127.79466,26.33766],[127.79401,26.33731],[127.79295,26.3369],[127.7888,26.33585],[127.78754,26.33542],[127.78659,26.335],[127.78576,26.3345],[127.7851,26.33387],[127.78474,26.33339],[127.78437,26.33259],[127.7842,26.33148],[127.78432,26.33064],[127.78452,26.33006],[127.78497,26.32921],[127.78866,26.32329],[127.78929,26.3219],[127.78964,26.32063],[127.7897,26.3195],[127.78959,26.31842],[127.78933,26.31731],[127.78859,26.31507],[127.78818,26.31331],[127.78805,26.31177],[127.78809,26.31043],[127.78849,26.30847],[127.78931,26.30636],[127.78993,26.30529],[127.79168,26.30266],[127.7923,26.30131],[127.7926,26.3],[127.79263,26.29891],[127.79251,26.29804],[127.79216,26.29691],[127.7915,26.29557],[127.78957,26.29224],[127.78862,26.29039],[127.78793,26.2885],[127.78735,26.28576],[127.78696,26.28432],[127.7865,26.28317],[127.78597,26.28214],[127.78519,26.28091],[127.78414,26.27954],[127.77815,26.27275],[127.77661,26.27072],[127.77559,26.26904],[127.77327,26.26403],[127.77224,26.26227],[127.77124,26.26098],[127.76983,26.25959],[127.7686,26.25861],[127.76462,26.25627],[127.76354,26.25541],[127.76311,26.25501],[127.76234,26.25403],[127.76054,26.25132],[127.7599,26.25065],[127.75933,26.25018],[127.75818,26.24949],[127.75724,26.24911],[127.75575,26.2488],[127.75227,26.24838],[127.75094,26.24799],[127.74968,26.24745],[127.74819,26.24655],[127.74683,26.24548],[127.74526,26.24399],[127.74384,26.24232],[127.74284,26.24089],[127.74214,26.23967],[127.74139,26.23807],[127.74088,26.23675],[127.73966,26.23269],[127.73887,26.22927],[127.73837,26.22642],[127.73821,26.22518],[127.73817,26.22412],[127.73848,26.22258],[127.73953,26.21945],[127.73973,26.2185],[127.73985,26.21652],[127.73977,26.21575],[127.73959,26.21515],[127.73812,26.21268],[127.73775,26.21182],[127.73742,26.2104],[127.73739,26.20905],[127.73773,26.20721],[127.73801,26.20652],[127.73963,26.20028],[127.74326,26.20081],[127.7484,26.19989],[127.74919,26.19985],[127.75143,26.20021],[127.75181,26.20041],[127.75304,26.20149],[127.75358,26.20159],[127.75425,26.20161],[127.75494,26.20147],[127.75774,26.20046],[127.75913,26.20012],[127.76048,26.20001],[127.76342,26.19998],[127.76399,26.19989],[127.76471,26.19959],[127.76515,26.19925],[127.76687,26.19757],[127.76783,26.19648],[127.76803,26.196],[127.76811,26.19554],[127.76803,26.19352],[127.76834,26.19282],[127.7715,26.18952],[127.77347,26.18692],[127.77372,26.18647],[127.77437,26.18349],[127.77456,26.18303],[127.77507,26.18226],[127.77519,26.18172],[127.77509,26.18111],[127.77455,26.17968]] },
    { day: 2, i: 5, from: "s2-4", to: "s2-5", mode: "drive", min: 14, km: 8.9, line: [[127.77455,26.17968],[127.77377,26.17658],[127.77379,26.1747],[127.77399,26.17419],[127.77438,26.17384],[127.77664,26.17227],[127.78496,26.16827],[127.78608,26.168],[127.79086,26.16754],[127.7919,26.16768],[127.79274,26.16798],[127.79775,26.17021],[127.79872,26.17075],[127.79926,26.1712],[127.79977,26.17184],[127.80018,26.17261],[127.8004,26.17352],[127.80041,26.17405],[127.80029,26.17486],[127.79859,26.18027],[127.79859,26.18087],[127.79881,26.1814],[127.79902,26.18171],[127.80082,26.18336],[127.80268,26.18489],[127.80819,26.18816],[127.80939,26.18866],[127.81276,26.18941],[127.81348,26.18949],[127.81482,26.18942],[127.8168,26.18896],[127.81784,26.1886],[127.81873,26.18811],[127.819,26.18764],[127.81946,26.18764],[127.82063,26.1874],[127.8214,26.18692],[127.82184,26.18676],[127.82204,26.18658],[127.82207,26.18645],[127.82167,26.18545],[127.82165,26.184],[127.82108,26.1831],[127.82099,26.18264],[127.82107,26.1823],[127.82166,26.18155],[127.82231,26.18026],[127.8227,26.17987],[127.8233,26.17955],[127.82707,26.17867],[127.82714,26.1783],[127.82817,26.17731],[127.82844,26.17753],[127.8285,26.17748]] },
    { day: 3, i: 1, from: "s3-0", to: "s3-1", mode: "drive", min: 4, km: 1.5, line: [[127.8285,26.17748],[127.82844,26.17753],[127.82817,26.17731],[127.82938,26.17604],[127.82912,26.17579],[127.82894,26.17439],[127.82869,26.17422],[127.82894,26.17365],[127.82892,26.17332],[127.82844,26.17255],[127.82794,26.172],[127.82781,26.17151],[127.82738,26.17085],[127.82681,26.17047],[127.82658,26.17021],[127.82647,26.16985],[127.82647,26.16928],[127.82635,26.1691],[127.82706,26.16873],[127.82757,26.16829],[127.82814,26.1682],[127.82857,26.16778],[127.82897,26.16787],[127.82912,26.1675]] },
    { day: 3, i: 2, from: "s3-1", to: "s3-2", mode: "drive", min: 15, km: 7.5, line: [[127.82912,26.1675],[127.82897,26.16787],[127.82865,26.16777],[127.82846,26.16788],[127.82821,26.16783],[127.82803,26.16824],[127.82757,26.16829],[127.82706,26.16873],[127.82635,26.1691],[127.82592,26.16899],[127.82452,26.1693],[127.82406,26.16909],[127.82379,26.16906],[127.82262,26.1698],[127.82231,26.16978],[127.82151,26.16952],[127.81943,26.17017],[127.81906,26.17008],[127.81813,26.16912],[127.8179,26.16875],[127.81806,26.16799],[127.81848,26.16703],[127.81844,26.16487],[127.81862,26.16379],[127.8185,26.16354],[127.81782,26.16286],[127.81741,26.16221],[127.81638,26.1616],[127.81578,26.16144],[127.81488,26.16092],[127.81416,26.16018],[127.81402,26.15969],[127.81372,26.15931],[127.81291,26.15868],[127.81215,26.15869],[127.81162,26.15854],[127.81102,26.15854],[127.81061,26.15846],[127.81018,26.15819],[127.80997,26.15796],[127.80991,26.15777],[127.80915,26.1578],[127.80879,26.15758],[127.80871,26.15736],[127.80828,26.15714],[127.80817,26.15725],[127.80767,26.15739],[127.80745,26.15802],[127.80732,26.15813],[127.80687,26.15807],[127.80585,26.15759],[127.80544,26.15703],[127.80491,26.15664],[127.80374,26.15434],[127.80326,26.15395],[127.80326,26.15386],[127.80291,26.15368],[127.80242,26.15309],[127.802,26.15289],[127.80109,26.15279],[127.79877,26.15145],[127.79843,26.151],[127.79855,26.14966],[127.79829,26.14919],[127.79771,26.14836],[127.79545,26.14637],[127.7952,26.14612],[127.79505,26.14584],[127.79494,26.14537],[127.79496,26.14507],[127.79532,26.14408],[127.79546,26.1434],[127.79539,26.14279],[127.79523,26.14238],[127.79497,26.14199],[127.79458,26.1416],[127.79245,26.14044],[127.79184,26.13986],[127.79168,26.13962],[127.79182,26.13916],[127.79173,26.13875],[127.7913,26.1383],[127.79044,26.13684],[127.7904,26.13665],[127.79058,26.13615],[127.79055,26.1359],[127.79036,26.13576],[127.78929,26.13552],[127.78898,26.13538],[127.78852,26.13466],[127.78775,26.1341],[127.78733,26.13313],[127.78684,26.13297],[127.78654,26.13278],[127.78603,26.13276],[127.78546,26.133],[127.78484,26.13352],[127.78463,26.1336]] },
    { day: 3, i: 3, from: "s3-2", to: "s3-3", mode: "drive", min: 26, km: 13.9, line: [[127.78463,26.1336],[127.78484,26.13352],[127.78546,26.133],[127.78618,26.13273],[127.78654,26.13278],[127.78684,26.13297],[127.78733,26.13313],[127.78775,26.1341],[127.78852,26.13466],[127.78898,26.13538],[127.78929,26.13552],[127.79036,26.13576],[127.79055,26.1359],[127.79058,26.13615],[127.7904,26.13665],[127.79044,26.13684],[127.79079,26.1374],[127.79038,26.1377],[127.79008,26.13809],[127.78896,26.1379],[127.78649,26.13793],[127.78562,26.13807],[127.78515,26.13829],[127.78464,26.13868],[127.78349,26.14],[127.7827,26.14035],[127.78199,26.14033],[127.78042,26.13988],[127.77967,26.13986],[127.77685,26.14043],[127.77616,26.14047],[127.77555,26.14031],[127.77416,26.13946],[127.77346,26.13924],[127.77308,26.13925],[127.77268,26.13936],[127.77112,26.14021],[127.7704,26.14046],[127.7697,26.1405],[127.76928,26.14041],[127.76888,26.14023],[127.76833,26.13985],[127.76794,26.13946],[127.76628,26.13752],[127.7662,26.13727],[127.7664,26.13605],[127.76626,26.13582],[127.76578,26.13553],[127.7656,26.13551],[127.765,26.13565],[127.76479,26.13559],[127.76361,26.13475],[127.76316,26.13421],[127.76289,26.13332],[127.76298,26.13199],[127.76289,26.13144],[127.76248,26.1307],[127.76191,26.13021],[127.7585,26.12832],[127.75728,26.12783],[127.75665,26.12766],[127.75588,26.12761],[127.75029,26.12774],[127.74988,26.12763],[127.74886,26.1269],[127.74851,26.12641],[127.74828,26.12505],[127.74848,26.12401],[127.74831,26.1236],[127.74797,26.12328],[127.74759,26.12321],[127.74465,26.12336],[127.74432,26.12315],[127.74329,26.12168],[127.74299,26.1214],[127.74109,26.12039],[127.73933,26.11893],[127.73736,26.11813],[127.7356,26.11801],[127.73369,26.11745],[127.73312,26.1172],[127.73271,26.11691],[127.73249,26.11665],[127.73224,26.11578],[127.73205,26.11548],[127.73004,26.11382],[127.72862,26.11285],[127.72772,26.11243],[127.72707,26.11193],[127.72653,26.11121],[127.7249,26.1097],[127.7245,26.10885],[127.72417,26.10838],[127.7238,26.10817],[127.72235,26.10764],[127.7219,26.10729],[127.72172,26.10691],[127.72172,26.10654],[127.7223,26.10532],[127.72237,26.10489],[127.72215,26.10016],[127.72209,26.09966],[127.72193,26.09924],[127.72148,26.0986],[127.72119,26.09832],[127.71681,26.09452],[127.71602,26.09413],[127.71536,26.09398],[127.71455,26.09398],[127.71326,26.09412],[127.71162,26.0939],[127.71027,26.09428],[127.70989,26.09455],[127.70921,26.09521],[127.70872,26.09544],[127.70806,26.09555],[127.70729,26.09556],[127.70663,26.09588],[127.70627,26.09597],[127.70545,26.09593],[127.70507,26.09599],[127.70463,26.09467],[127.70459,26.09418],[127.70585,26.09376],[127.70587,26.09343],[127.70556,26.09279],[127.70571,26.0921],[127.70575,26.09127],[127.70649,26.09129],[127.70741,26.09118],[127.70791,26.09104],[127.70844,26.09076],[127.70851,26.0905]] },
    { day: 3, i: 4, from: "s3-3", to: "s3-4", mode: "drive", min: 14, km: 5.7, line: [[127.70851,26.0905],[127.70844,26.09076],[127.70791,26.09104],[127.70707,26.09125],[127.70531,26.09125],[127.70455,26.09152],[127.70249,26.09154],[127.69914,26.09069],[127.69841,26.09057],[127.69626,26.09075],[127.69507,26.09058],[127.69429,26.09033],[127.69395,26.09033],[127.6941,26.08939],[127.69368,26.08829],[127.69315,26.08728],[127.69293,26.08583],[127.69275,26.08549],[127.69226,26.08516],[127.68807,26.08318],[127.68779,26.08311],[127.68736,26.08317],[127.68713,26.0833],[127.6864,26.08419],[127.68609,26.08481],[127.68594,26.08598],[127.68567,26.08652],[127.68526,26.08676],[127.68396,26.08723],[127.68331,26.08631],[127.683,26.08615],[127.68207,26.08626],[127.68039,26.0863],[127.67975,26.08608],[127.67919,26.08608],[127.67907,26.08595],[127.67767,26.08562],[127.67637,26.08566],[127.67577,26.08545],[127.67461,26.08536],[127.67437,26.08509],[127.67428,26.08509],[127.6735,26.08594],[127.67313,26.0861],[127.67256,26.0845],[127.67159,26.08347],[127.67098,26.08356],[127.67081,26.08375],[127.66994,26.08285],[127.66961,26.08308],[127.66883,26.08225],[127.66935,26.08184],[127.66959,26.08151],[127.66883,26.08067],[127.66868,26.08008],[127.66879,26.07932],[127.66915,26.07901]] },
    { day: 3, i: 5, from: "s3-4", to: "s3-5", mode: "drive", min: 3, km: 1.4, line: [[127.66915,26.07901],[127.66879,26.07932],[127.66868,26.08008],[127.66883,26.08067],[127.66953,26.08141],[127.66955,26.0816],[127.66921,26.08196],[127.66619,26.08425],[127.66603,26.08448],[127.66615,26.08481],[127.66613,26.08502],[127.66557,26.08444],[127.66532,26.08309],[127.6649,26.08211],[127.6648,26.08107],[127.66477,26.08097],[127.66468,26.08096]] },
    { day: 3, i: 6, from: "s3-5", to: "s3-6", mode: "drive", min: 56, km: 43, line: [[127.66468,26.08096],[127.66477,26.08097],[127.6648,26.08107],[127.6649,26.08211],[127.66532,26.08309],[127.66557,26.08444],[127.66613,26.08502],[127.66569,26.0868],[127.66572,26.08721],[127.6649,26.08866],[127.66471,26.08879],[127.66475,26.08945],[127.66462,26.09035],[127.66369,26.09102],[127.66329,26.09198],[127.66329,26.09228],[127.66419,26.09381],[127.66437,26.09482],[127.66448,26.095],[127.66739,26.09491],[127.66931,26.095],[127.67175,26.09471],[127.67307,26.09422],[127.67378,26.09416],[127.67551,26.0954],[127.67543,26.09567],[127.67559,26.09699],[127.67605,26.09873],[127.67645,26.09879],[127.67744,26.09922],[127.67733,26.09985],[127.67738,26.10049],[127.67757,26.10106],[127.67813,26.10213],[127.67826,26.10266],[127.67895,26.10245],[127.67994,26.10228],[127.68038,26.10292],[127.68068,26.10394],[127.68074,26.11012],[127.68068,26.11039],[127.68075,26.11469],[127.68083,26.11518],[127.6812,26.11575],[127.68244,26.11689],[127.68298,26.11726],[127.6844,26.11785],[127.68484,26.11821],[127.6851,26.11858],[127.68628,26.12092],[127.68646,26.12136],[127.68674,26.12264],[127.68677,26.12314],[127.68662,26.12491],[127.68668,26.12675],[127.68638,26.12744],[127.68527,26.12897],[127.6848,26.13155],[127.68497,26.13211],[127.68498,26.13267],[127.6849,26.13275],[127.68522,26.13315],[127.68552,26.13389],[127.68577,26.13424],[127.68627,26.13447],[127.6868,26.13449],[127.68721,26.13576],[127.68868,26.13829],[127.693,26.1427],[127.69338,26.1432],[127.69356,26.14373],[127.69356,26.14429],[127.69276,26.14731],[127.69364,26.14819],[127.69395,26.14897],[127.6942,26.14929],[127.69453,26.14954],[127.6952,26.14977],[127.69541,26.14994],[127.69576,26.1508],[127.69666,26.15151],[127.6971,26.15219],[127.69735,26.1528],[127.69812,26.15381],[127.69822,26.15399],[127.69796,26.15411],[127.69777,26.15435],[127.69751,26.15508],[127.70103,26.15749],[127.70186,26.15816],[127.70217,26.15855],[127.7024,26.15902],[127.70275,26.16116],[127.70324,26.16196],[127.70373,26.16242],[127.70623,26.16416],[127.70708,26.16504],[127.70759,26.16606],[127.70818,26.16883],[127.70869,26.16982],[127.71066,26.1722],[127.71246,26.17503],[127.71344,26.17703],[127.71394,26.17782],[127.71704,26.18125],[127.71759,26.18155],[127.71819,26.18164],[127.71992,26.18126],[127.72118,26.18141],[127.72195,26.18142],[127.72574,26.18098],[127.72649,26.18095],[127.72834,26.18104],[127.73023,26.18138],[127.73222,26.18218],[127.73329,26.18277],[127.73438,26.18353],[127.7356,26.18465],[127.73632,26.18551],[127.73692,26.18637],[127.73745,26.18734],[127.73824,26.18933],[127.73905,26.19214],[127.7396,26.19526],[127.73979,26.19763],[127.73977,26.19847],[127.73961,26.19963],[127.73748,26.20778],[127.73729,26.20898],[127.73731,26.21037],[127.73741,26.21103],[127.73765,26.21185],[127.73813,26.21293],[127.73941,26.21501],[127.73964,26.21567],[127.73973,26.21626],[127.73972,26.21678],[127.73957,26.21743],[127.73862,26.22021],[127.73822,26.22182],[127.73801,26.22373],[127.7381,26.22518],[127.73859,26.22838],[127.73899,26.23031],[127.74016,26.23491],[127.74127,26.23806],[127.74197,26.23956],[127.74271,26.24086],[127.7442,26.24294],[127.74586,26.24474],[127.74786,26.24643],[127.74901,26.24718],[127.74999,26.24771],[127.75113,26.24815],[127.75209,26.24843],[127.75572,26.24891],[127.75725,26.24924],[127.75845,26.24977],[127.75923,26.25024],[127.75983,26.25073],[127.7607,26.2517],[127.76232,26.2542],[127.76335,26.25537],[127.76438,26.25622],[127.76498,26.25661],[127.76768,26.25815],[127.7686,26.25875],[127.77045,26.26031],[127.77146,26.26142],[127.77237,26.26269],[127.77351,26.26478],[127.77549,26.26909],[127.77688,26.27131],[127.77797,26.27272],[127.78451,26.28018],[127.78572,26.28192],[127.78634,26.28311],[127.78705,26.28504],[127.78772,26.2881],[127.7883,26.28995],[127.78933,26.29206],[127.79159,26.29599],[127.79205,26.29694],[127.79243,26.29827],[127.79252,26.29964],[127.79234,26.30079],[127.79193,26.30194],[127.79099,26.30354],[127.78958,26.30562],[127.789,26.30674],[127.78834,26.3086],[127.78805,26.30996],[127.78794,26.31176],[127.78806,26.31335],[127.78828,26.31444],[127.78936,26.31784],[127.78958,26.3191],[127.78958,26.32006],[127.7894,26.32115],[127.78905,26.3222],[127.78855,26.32324],[127.78487,26.32916],[127.78442,26.33002],[127.78416,26.33083],[127.7841,26.33175],[127.78419,26.33237],[127.78445,26.3331],[127.7848,26.33366],[127.78526,26.3342],[127.78594,26.33473],[127.78661,26.33511],[127.78878,26.33595],[127.79248,26.33685],[127.79332,26.33712],[127.7941,26.33746],[127.79499,26.33799],[127.79612,26.33901],[127.79743,26.34085],[127.79981,26.3446],[127.80152,26.34767],[127.80239,26.34945],[127.80289,26.35065],[127.80365,26.35319],[127.80446,26.35745],[127.80488,26.35902],[127.80588,26.36124],[127.80719,26.36329],[127.80847,26.36487],[127.80968,26.36613],[127.81116,26.36749],[127.8148,26.37047],[127.81661,26.37236],[127.81738,26.37338],[127.81781,26.37412],[127.81797,26.37457],[127.81793,26.37485],[127.81778,26.37503],[127.8174,26.37511],[127.81715,26.37496],[127.81706,26.37464],[127.81718,26.37434],[127.81753,26.37398],[127.81789,26.37379],[127.8183,26.37368],[127.81869,26.37368],[127.81902,26.37374],[127.81964,26.37402],[127.82011,26.37437],[127.82028,26.37485],[127.82042,26.37497],[127.82066,26.37499],[127.82102,26.37488],[127.82119,26.37494],[127.82152,26.37627],[127.82186,26.37687],[127.82215,26.37719],[127.8242,26.37865],[127.82652,26.37995],[127.82711,26.38051],[127.82689,26.38058],[127.82676,26.38032],[127.82639,26.38027]] },
    { day: 3, i: 7, from: "s3-6", to: "s3-7", mode: "walk", line: [[127.82639,26.38051],[127.8204,26.3748]] },
    { day: 3, i: 8, from: "s3-7", to: "s3-8", mode: "bus", min: 39, km: 33.4, line: [[127.82039,26.37475],[127.82055,26.37458],[127.81992,26.37404],[127.81917,26.37363],[127.81788,26.37326],[127.81723,26.37284],[127.81488,26.37042],[127.81123,26.36742],[127.80976,26.36606],[127.80777,26.36387],[127.8067,26.36243],[127.80568,26.36063],[127.80499,26.35899],[127.80457,26.35744],[127.80382,26.35351],[127.8035,26.35225],[127.80299,26.35063],[127.80249,26.34942],[127.80082,26.34617],[127.79916,26.34335],[127.79753,26.3408],[127.79621,26.33897],[127.79509,26.33795],[127.79428,26.33744],[127.79371,26.33718],[127.79251,26.33676],[127.7888,26.33585],[127.78754,26.33542],[127.78659,26.335],[127.786,26.33467],[127.78536,26.33414],[127.78489,26.33362],[127.78456,26.33306],[127.7843,26.33235],[127.7842,26.33148],[127.78432,26.33064],[127.78452,26.33006],[127.78497,26.32921],[127.78866,26.32329],[127.78929,26.3219],[127.78964,26.32063],[127.7897,26.3195],[127.78959,26.31842],[127.78933,26.31731],[127.78859,26.31507],[127.78818,26.31331],[127.78805,26.31177],[127.78809,26.31043],[127.78849,26.30847],[127.78931,26.30636],[127.78993,26.30529],[127.79168,26.30266],[127.7923,26.30131],[127.7926,26.3],[127.79263,26.29891],[127.79251,26.29804],[127.79216,26.29691],[127.7915,26.29557],[127.78957,26.29224],[127.78862,26.29039],[127.78793,26.2885],[127.78735,26.28576],[127.78696,26.28432],[127.7865,26.28317],[127.78597,26.28214],[127.78519,26.28091],[127.78414,26.27954],[127.77815,26.27275],[127.77661,26.27072],[127.77559,26.26904],[127.77327,26.26403],[127.77224,26.26227],[127.77124,26.26098],[127.76983,26.25959],[127.7686,26.25861],[127.76462,26.25627],[127.76354,26.25541],[127.76311,26.25501],[127.76234,26.25403],[127.76054,26.25132],[127.7599,26.25065],[127.75933,26.25018],[127.75818,26.24949],[127.75724,26.24911],[127.75575,26.2488],[127.75317,26.24853],[127.75189,26.24829],[127.75057,26.24785],[127.74926,26.24722],[127.74756,26.24608],[127.74594,26.24468],[127.74429,26.24289],[127.74284,26.24089],[127.74168,26.23874],[127.74053,26.23572],[127.73966,26.23269],[127.73864,26.22803],[127.73824,26.22548],[127.73817,26.22367],[127.73852,26.22183],[127.73933,26.21945],[127.73949,26.21828],[127.73941,26.21744],[127.73915,26.21663],[127.73891,26.21613],[127.73832,26.21535],[127.73745,26.21461],[127.73651,26.21411],[127.73493,26.21351],[127.73292,26.21294],[127.73158,26.21268],[127.7275,26.21213],[127.72626,26.2117],[127.72527,26.21147],[127.72493,26.21153],[127.72413,26.21201],[127.72388,26.21195],[127.72286,26.21017],[127.72271,26.20978],[127.72272,26.20948],[127.72329,26.20805],[127.72334,26.20766],[127.72326,26.20728],[127.72149,26.2037],[127.72096,26.20296],[127.72025,26.20238],[127.71944,26.20201],[127.7165,26.20149],[127.7155,26.20108],[127.71497,26.20065],[127.71454,26.20008],[127.71399,26.19892],[127.71311,26.1966],[127.71278,26.196],[127.71229,26.19541],[127.71151,26.19482],[127.70622,26.19193],[127.70514,26.19155],[127.70388,26.19145],[127.70276,26.19158],[127.70209,26.19179],[127.69948,26.19296],[127.6979,26.19336],[127.69635,26.19359],[127.68662,26.1936],[127.68613,26.19367],[127.68544,26.19384],[127.68186,26.19518],[127.68095,26.1957],[127.68039,26.19621],[127.67997,26.19678],[127.67966,26.19745],[127.6795,26.19826],[127.6795,26.1991],[127.68001,26.20089],[127.68004,26.20143],[127.67996,26.2019],[127.67983,26.20177],[127.67843,26.20142],[127.67814,26.20156],[127.67611,26.20103],[127.66961,26.19831],[127.66841,26.19763],[127.66487,26.19464],[127.6642,26.19419],[127.663,26.19373],[127.65989,26.19306],[127.65942,26.19309],[127.65908,26.19342],[127.65894,26.19411],[127.65891,26.19481],[127.65913,26.19563],[127.65868,26.19564],[127.65699,26.19531],[127.65569,26.1952],[127.65006,26.19548],[127.64999,26.19687]] }
  ],
  packing: {
    cats: [
      {
        id: "ok-0",
        name: { ja: "書類・現金", en: "Documents & Money" },
        icon: "file",
        items: [
          { id: "ok-0-0", text: { ja: "身分証明書", en: "Photo ID" }, note: { ja: "国内線 — 搭乗券はスマホに", en: "Domestic flight — pass on the phone" } },
          { id: "ok-0-1", text: { ja: "運転免許証", en: "Driver's licence" }, note: { ja: "日本の免許証だけで運転できます", en: "Japanese licence is all we need" } },
          { id: "ok-0-2", text: { ja: "現金 約¥30,000", en: "Cash, about ¥30,000" }, note: { ja: "キャンプ場の料金、沖縄そば店、氷は現金", en: "Campsite fees, soba shops and ice are cash" } },
          { id: "ok-0-3", text: { ja: "クレジットカード・ETCカード", en: "Credit card & ETC card" }, note: { ja: "ETCなら35%割引 — ¥1,610が¥1,040", en: "ETC saves 35% — ¥1,040 against ¥1,610" } }
        ]
      },
      {
        id: "ok-1",
        name: { ja: "服装", en: "Wear" },
        icon: "shirt",
        items: [
          { id: "ok-1-0", text: { ja: "速乾Tシャツ 2枚", en: "2 quick-dry tees" }, note: { ja: "綿素材は避ける — 湿度が高く28 °C", en: "Nothing cotton — humid and 28 °C" } },
          { id: "ok-1-1", text: { ja: "ショートパンツ+薄手のロングパンツ", en: "Shorts + light trousers" } },
          { id: "ok-1-2", text: { ja: "薄手の長袖", en: "Light long sleeve" }, note: { ja: "日中の日差しと夕方の蚊対策に", en: "Sun by day, mosquitoes at dusk" } },
          { id: "ok-1-3", text: { ja: "パッカブルレインジャケット", en: "Packable rain shell" }, note: { ja: "10日のうち4日ほどは雨", en: "Rain on about 4 days in 10" } },
          { id: "ok-1-4", text: { ja: "足を覆う靴+サンダル", en: "Closed shoes + sandals" }, note: { ja: "やんばるは足を覆う靴で — ハブのいる土地", en: "Closed shoes for Yanbaru — habu country" } },
          { id: "ok-1-5", text: { ja: "帽子+サングラス", en: "Cap + sunglasses" } }
        ]
      },
      {
        id: "ok-2",
        name: { ja: "海遊び", en: "Water" },
        icon: "waves",
        items: [
          { id: "ok-2-0", text: { ja: "マスク+シュノーケル", en: "Mask + snorkel" }, note: { ja: "レンタルには含まれません", en: "Not in the rental" } },
          { id: "ok-2-1", text: { ja: "水着+長袖ラッシュガード", en: "Swimsuit + long-sleeve rash guard" }, note: { ja: "日差し対策、そしてクラゲへの本当の備え", en: "Sun, and the real answer to jellyfish" } },
          { id: "ok-2-2", text: { ja: "マリンシューズ", en: "Water shoes" }, note: { ja: "サンゴ礁とウニ対策", en: "Reef and urchins" } },
          { id: "ok-2-3", text: { ja: "マイクロファイバータオル", en: "Microfibre towel" } },
          { id: "ok-2-4", text: { ja: "ドライバッグ", en: "Dry bag" } },
          { id: "ok-2-5", text: { ja: "サンゴに優しい日焼け止め+リップクリーム", en: "Reef-safe sunscreen + lip balm" } },
          { id: "ok-2-6", text: { ja: "酔い止め", en: "Seasickness tablets" }, note: { ja: "2日目のダイビングの船で", en: "For the dive boat on day 2" } }
        ]
      },
      {
        id: "ok-3",
        name: { ja: "キャンプ・バーベキュー", en: "Camp & BBQ" },
        icon: "tent",
        items: [
          { id: "ok-3-0", text: { ja: "ライター × 2", en: "Lighter × 2" }, note: { ja: "身に着けて持ち込む — 預け荷物は不可、ジェットライターは禁止", en: "On the body — never checked, and jet lighters are banned" } },
          { id: "ok-3-1", text: { ja: "トング+折りたたみナイフ", en: "Tongs + folding knife" } },
          { id: "ok-3-2", text: { ja: "鍋・食器2人分・箸", en: "Pot, 2 bowls, chopsticks" }, note: { ja: "セットに付くのはグリルだけ、調理器具はなし", en: "The set brings a grill, not cookware" } },
          { id: "ok-3-3", text: { ja: "ヘッドランプ2つ+予備電池", en: "2 headlamps + spare batteries" }, note: { ja: "2人で明かり1つだと、壊れたら終わりです", en: "One light for two is a single point of failure" } },
          { id: "ok-3-4", text: { ja: "小さな救急セット", en: "Small first-aid kit" }, note: { ja: "絆創膏、消毒薬、ピンセット、抗ヒスタミン薬、痛み止め、経口補水液（粉末）", en: "Plasters, antiseptic, pincers, antihistamine, painkillers, rehydration powder" } },
          { id: "ok-3-5", text: { ja: "ゴミ袋+ウェットティッシュ", en: "Rubbish bags + wet wipes" }, note: { ja: "生ゴミも含めて、ゴミはすべて持ち帰り", en: "Carry everything out, food waste included" } },
          { id: "ok-3-6", text: { ja: "食酢の小瓶", en: "Small bottle of vinegar" }, note: { ja: "ハブクラゲに刺されたときだけ — カツオノエボシには絶対に使わない", en: "Habu-kurage stings only — never a Portuguese man o’ war" } },
          { id: "ok-3-7", text: { ja: "折りたたみクーラーバッグ", en: "Foldable cooler bag" }, note: { ja: "ジムニーに積んだまま", en: "Lives in the Jimny" } }
        ]
      },
      {
        id: "ok-4",
        name: { ja: "電子機器", en: "Tech" },
        icon: "camera",
        items: [
          { id: "ok-4-0", text: { ja: "スマホ・ケーブル・車載充電器", en: "Phone, cable, car charger" } },
          { id: "ok-4-1", text: { ja: "モバイルバッテリー", en: "Power bank" }, note: { ja: "野営地に電源はありません", en: "No mains at a wild site" } },
          { id: "ok-4-2", text: { ja: "カメラ・充電器・予備カード", en: "Camera, charger, spare card" } },
          { id: "ok-4-3", text: { ja: "オフライン地図のダウンロード", en: "Offline maps downloaded" }, note: { ja: "やんばるは電波が不安定", en: "Yanbaru signal is patchy" } }
        ]
      },
      {
        id: "ok-5",
        name: { ja: "現地調達", en: "Buy on Arrival" },
        icon: "cart",
        items: [
          { id: "ok-5-0", text: { ja: "2泊目の肉、2日目に購入", en: "Night 2 meat, bought on day 2" }, note: { ja: "1泊目はEvertrailのセット", en: "Night 1 is the Evertrail set" } },
          { id: "ok-5-1", text: { ja: "野菜・米・コーヒー・朝食", en: "Veg, rice, coffee, breakfast" } },
          { id: "ok-5-2", text: { ja: "油・塩・焼肉のたれ・アルミホイル", en: "Oil, salt, yakiniku sauce, foil" } },
          { id: "ok-5-3", text: { ja: "氷か保冷剤、2日分", en: "Ice or freezer blocks, both days" } },
          { id: "ok-5-4", text: { ja: "飲料水 5–10 L", en: "Drinking water, 5–10 L" } },
          { id: "ok-5-5", text: { ja: "虫除けスプレー+蚊取り線香", en: "Insect repellent + mosquito coils" }, note: { ja: "ディートかイカリジン — 歩いているときは蚊取り線香では無力", en: "DEET or icaridin — coils do nothing while walking" } }
        ]
      }
    ]
  },
  foot: { ja: "時刻はすべて日本時間", en: "All times JST" }
};
