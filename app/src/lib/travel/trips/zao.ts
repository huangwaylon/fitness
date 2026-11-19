// The zao guide (docs/travel.md "Content"): 樹氷合宿, three of us at Zao Onsen, planned in the group chat
// (2026-11-18/19) and written here.
//
// The trip's facts (docs/travel.md "Trip facts"): they bind every edit here.
// - Dates: Sat 2027-01-30 → Mon 02-01, up the evening before (Fri 01-29, after work: meet at the station ~20:00, the
//   car from there). The first day of the resort's ピークシーズン (1/30〜2/28) is 1/30: lift prices are peak's on all three days.
// - Who brings what (the chat's final plan, 11-19): the friend rides their own board and wear (a lift pass only); うめ and
//   ウェイ bring wear, rent boards. Bought ahead (WAmazing Snow): a 1-day pass each for day 2, and a 2-day snowboard set
//   each for days 1–2 (kept in the car overnight). Day 1: a 4-hour pass on the day (not sold ahead). Day 3: decided on
//   the morning (if riding: early, rental + pass on the spot).
// - Resort prices (zaomountainresort.com, 2026/27 table, peak, adult): 4-hour ¥7,400, 1-day ¥9,000. WAmazing's 1-day
//   pass is priced per date (¥6,800–8,800; the chat: ¥2,000 off a 1-day pass if bought by 12/18): its price for 1/31 shows at checkout.
//   WAmazing rentals: a 2-day snowboard set ¥10,000 (¥9,800 shown discounted).
// - Cancellation (WAmazing): passes free until the day of use; rentals free until 4 days before (then 30 / 50 / 80 / 100 %),
//   and a multi-day rental can't be cancelled once its first day is exchanged.
// - Hours (WAmazing's product pages): lifts 08:30–17:00; rentals 08:00–16:30, none at night; night skiing at 上の台
//   17:00–21:00 on these dates, called off in bad weather, no refund.
// - Places: OpenStreetMap (Overpass, 2026-11-19): 蔵王温泉バスターミナル, 上の台駅, 地蔵山頂駅 (and 蔵王山麓駅 38.16167,
//   140.39518; JR 山形駅 38.24847, 140.3278, for a later pin). One stop
//   a day, so no legs (the ropeway is no drive).
// - Not in the repo (it is public): the friend's name, the Walica group's link (in the chat), where we sleep.
// - Still open: which station we meet at, the trains up, where we stay, whether the boards fit the car (else the
//   friend's mother's), ETC (うめ's card, untried; the cash lane works), day 3.
// - Unverified: the ropeway's fares and hours, the 樹氷 light-up's dates, the bus times from Yamagata.
import type { Trip } from '../types.ts';

const RESORT = 'https://zaomountainresort.com/';
const SHOP = 'https://jp.wamazing.com/snow/resorts/zao-onsen/partner_ec/items';

export const zao: Trip = {
  id: 'zao',
  title: { ja: '蔵王', en: 'Zao' },
  eyebrow: { ja: '樹氷合宿 · 3日間', en: 'Snow monster camp · 3 days' },
  sub: { ja: '1月30日 – 2月1日 · 蔵王温泉スキー場', en: 'Jan 30 – Feb 1 · Zao Onsen ski resort' },
  start: '2027-01-30',
  end: '2027-02-01',
  tz: 'Asia/Tokyo',
  cover: { src: 'travel/zao/cover.webp', w: 560, h: 240 },
  hero: { src: 'travel/zao/hero.webp', w: 720, h: 540 },
  dayColors: ['#1f6fe0', '#e0453f', '#00996f'],
  bbox: [140.37, 38.14, 140.45, 38.18],
  days: [
    {
      n: 1,
      date: '2027-01-30',
      title: { ja: '初滑り', en: 'First runs' },
      sub: { ja: '4時間券 · ボードを借りる', en: 'A 4-hour pass · boards rented' },
      rows: [
        {
          t: '20:00',
          text: { ja: '駅で集合、車で蔵王へ', en: 'Meet at the station, drive up to Zao' },
          note: { ja: '1月29日（金）仕事のあと · 前泊', en: 'Fri Jan 29, after work · the night before' },
          dd: -1
        },
        {
          t: '08:00',
          text: { ja: 'レンタル受け取り — スノーボード2日間', en: 'Pick up the rentals — 2-day snowboard sets' },
          note: { ja: 'うめ・ウェイの2人分 · 予約済みの引換券', en: 'For うめ and ウェイ · the voucher bought ahead' }
        },
        {
          t: '08:30',
          text: { ja: '4時間券を窓口で買って滑る', en: 'Buy a 4-hour pass at the counter, ride' },
          note: { ja: 'ピーク料金 ¥7,400 · 前売りなし', en: 'Peak price ¥7,400 · not sold ahead' },
          place: 's1-0'
        },
        {
          t: '17:00',
          text: { ja: 'ナイター（上の台、〜21:00）', en: 'Night skiing (上の台, till 21:00)' },
          note: {
            ja: '気温と体力しだい · 悪天候は中止 · 夜はレンタル不可',
            en: 'If it isn’t too cold and we’re up for it · off in bad weather · no rentals at night'
          }
        },
        {
          t: '',
          text: { ja: 'ボードは車に積んで翌日へ', en: 'The boards stay in the car for tomorrow' }
        }
      ],
      links: [{ label: { ja: '蔵王温泉スキー場', en: 'Zao Onsen ski resort' }, href: RESORT }]
    },
    {
      n: 2,
      date: '2027-01-31',
      title: { ja: '樹氷の日', en: 'Snow monsters' },
      sub: { ja: '1日券 · 一日じゅう滑る', en: 'A 1-day pass · riding all day' },
      rows: [
        {
          t: '08:30',
          text: { ja: '1日券で滑りはじめ', en: 'First lift on the 1-day pass' },
          note: { ja: '3人とも前売りで購入済み', en: 'Bought ahead, all three' }
        },
        {
          t: '~11:00',
          text: { ja: '蔵王ロープウェイで地蔵山頂駅へ — 樹氷', en: 'Zao Ropeway up to 地蔵山頂駅 — the snow monsters' },
          note: { ja: '山麓線 → 山頂線 · 運賃と運行は当日確認', en: 'Sanroku line, then Sancho line · check fares and running on the day' },
          place: 's2-0'
        },
        { t: '17:00', text: { ja: 'リフト終了 · レンタル返却（〜16:30）', en: 'Lifts close · return the rentals (by 16:30)' } },
        { t: '', text: { ja: '温泉', en: 'Onsen' } }
      ],
      links: [{ label: { ja: 'リフト・ロープウェイ運行状況', en: 'Lift and ropeway status' }, href: `${RESORT}ropeway-lift-information/` }]
    },
    {
      n: 3,
      date: '2027-02-01',
      title: { ja: 'コンディションしだい', en: 'As the snow allows' },
      sub: { ja: '滑るなら早起き · 帰る日', en: 'Up early if we ride · the day home' },
      rows: [
        {
          t: '08:00',
          text: { ja: '滑るなら：レンタルとリフト券に並ぶ', en: 'If we ride: queue for rentals and a pass' },
          note: { ja: '半日券・4時間券は現地で', en: 'Half-day or 4-hour passes on the spot' },
          place: 's3-0'
        },
        { t: '', text: { ja: '帰路', en: 'Head home' } }
      ]
    }
  ],
  logistics: [
    {
      id: 'lift',
      icon: 'tag',
      title: { ja: 'リフト券', en: 'Lift passes' },
      sub: { ja: '2日目の1日券を前売りで、1日目は当日', en: 'Day 2’s 1-day pass ahead, day 1’s on the day' },
      stats: [
        { k: { ja: '4時間券', en: '4-hour' }, v: { ja: '¥7,400', en: '¥7,400' } },
        { k: { ja: '1日券', en: '1-day' }, v: { ja: '¥9,000', en: '¥9,000' } }
      ],
      sections: [
        {
          kind: 'bul',
          rows: [
            {
              text: { ja: '1月30日からピークシーズン（〜2/28）', en: 'Peak season from Jan 30 (to Feb 28)' },
              note: { ja: 'スキー場の料金表、大人 · 1/29まではレギュラー', en: 'The resort’s table, adult · regular till Jan 29' }
            },
            {
              text: { ja: '前売り（WAmazing）は日付で変動 ¥6,800〜8,800', en: 'Ahead (WAmazing) priced per date, ¥6,800–8,800' },
              note: { ja: '12/18までの早割で1日券が¥2,000安い（チャットより）', en: 'Early-bird till Dec 18: ¥2,000 off a 1-day pass (from the chat)' }
            },
            { text: { ja: '前売りは利用日当日までキャンセル無料', en: 'Free cancellation up to the day of use' } },
            { text: { ja: '4時間券は前売りなし', en: 'No 4-hour pass ahead' } }
          ]
        }
      ],
      links: [
        { label: { ja: 'WAmazing で買う', en: 'Buy on WAmazing' }, href: SHOP },
        { label: { ja: '料金表', en: 'Price table' }, href: RESORT }
      ]
    },
    {
      id: 'rental',
      icon: 'mountain-snow',
      title: { ja: 'レンタル', en: 'Rentals' },
      sub: { ja: 'スノーボード2日間 × 2（うめ・ウェイ）', en: 'Two 2-day snowboard sets (うめ, ウェイ)' },
      stats: [{ k: { ja: '2日間セット', en: '2-day set' }, v: { ja: '¥10,000', en: '¥10,000' } }],
      sections: [
        {
          kind: 'bul',
          rows: [
            { text: { ja: 'ウェアは持参', en: 'Our own wear' } },
            { text: { ja: '営業 08:00〜16:30、夜は借りられない', en: 'Open 08:00–16:30, none at night' } },
            {
              text: { ja: '4日前まで無料キャンセル', en: 'Free cancellation till 4 days before' },
              note: {
                ja: '3日前30% · 2日前50% · 前日80% · 当日100% · 1日目に引き換えたら全体が取消不可',
                en: '30 % 3 days before · 50 % 2 · 80 % the day before · 100 % on the day · none once day 1 is picked up'
              }
            }
          ]
        }
      ],
      links: [{ label: { ja: 'WAmazing で予約', en: 'Book on WAmazing' }, href: SHOP }]
    },
    {
      id: 'car',
      icon: 'car',
      title: { ja: '移動', en: 'Getting there' },
      sub: { ja: '駅まで電車、そこから車', en: 'Trains to the station, the car from there' },
      sections: [
        {
          kind: 'bul',
          rows: [
            {
              text: { ja: '新幹線か在来線かは未定', en: 'Shinkansen or local trains: not decided' },
              note: { ja: '前泊なので普通電車でも間に合う', en: 'The night before, so local trains work too' }
            },
            {
              text: { ja: 'ボード3枚が車に乗るか12月に確認', en: 'Whether three boards fit the car: checked in December' },
              note: { ja: 'だめなら合宿の間だけ別の車を借りる', en: 'If not, another car for the trip' }
            },
            {
              text: { ja: 'ETC：うめのカードを試す', en: 'ETC: trying うめ’s card' },
              note: { ja: '通らなくても一般レーンで払える', en: 'If it fails, the cash lane works' }
            },
            { text: { ja: '山形駅から蔵王温泉はバスもある（約40分、要確認）', en: 'A bus runs from Yamagata Station to Zao Onsen (~40 min, to check)' } }
          ]
        }
      ]
    },
    {
      id: 'money',
      icon: 'wallet',
      title: { ja: 'お金', en: 'Money' },
      sub: { ja: '割り勘は Walica のグループで', en: 'Split in the Walica group' },
      sections: [
        {
          kind: 'bul',
          rows: [
            { text: { ja: 'リンクはグループチャットのアナウンス', en: 'The link is pinned in the group chat' } },
            { text: { ja: '前売りは1人がまとめて買って Walica に記録', en: 'One of us buys the advance tickets, logged in Walica' } }
          ]
        }
      ]
    },
    {
      id: 'open',
      icon: 'clipboard',
      title: { ja: '未定', en: 'Still open' },
      sections: [
        {
          kind: 'bul',
          rows: [
            { text: { ja: '集合する駅', en: 'Which station we meet at' } },
            { text: { ja: '宿', en: 'Where we stay' } },
            { text: { ja: '電車の切符', en: 'The train tickets' } },
            { text: { ja: '3日目に滑るか', en: 'Whether we ride on day 3' } }
          ]
        }
      ]
    }
  ],
  places: [
    { id: 's1-0', kind: 'stop', name: { ja: '上の台ゲレンデ', en: 'Uenodai slope' }, lat: 38.17086, lon: 140.39799, day: 1, i: 0, min: 510 },
    { id: 's2-0', kind: 'stop', name: { ja: '地蔵山頂駅（樹氷）', en: 'Jizo Sancho station (snow monsters)' }, lat: 38.15472, lon: 140.43109, day: 2, i: 0, min: 660 },
    { id: 's3-0', kind: 'stop', name: { ja: '蔵王温泉バスターミナル', en: 'Zao Onsen bus terminal' }, lat: 38.16743, lon: 140.3937, day: 3, i: 0, min: 480 }
  ],
  legs: [],
  packing: {
    cats: [
      {
        id: 'za-0',
        name: { ja: '滑る', en: 'Riding' },
        icon: 'mountain-snow',
        items: [
          { id: 'za-0-0', text: { ja: 'ウェア上下', en: 'Snow jacket and pants' } },
          { id: 'za-0-1', text: { ja: 'グローブ', en: 'Gloves' } },
          { id: 'za-0-2', text: { ja: 'ゴーグル', en: 'Goggles' } },
          { id: 'za-0-3', text: { ja: 'ニット帽かヘルメット', en: 'Beanie or helmet' } },
          { id: 'za-0-4', text: { ja: 'ネックウォーマー', en: 'Neck warmer' } },
          { id: 'za-0-5', text: { ja: 'インナー・厚手の靴下', en: 'Base layers, thick socks' } }
        ]
      },
      {
        id: 'za-1',
        name: { ja: '書類とお金', en: 'Papers and money' },
        icon: 'file',
        items: [
          { id: 'za-1-0', text: { ja: 'リフト券・レンタルの引換QR', en: 'Lift pass and rental QR codes' } },
          { id: 'za-1-1', text: { ja: '電車の切符', en: 'Train tickets' } },
          { id: 'za-1-2', text: { ja: 'ETCカード', en: 'ETC card' }, note: { ja: 'うめ', en: 'うめ’s' } },
          { id: 'za-1-3', text: { ja: 'カードと現金', en: 'Cards and cash' } }
        ]
      },
      {
        id: 'za-2',
        name: { ja: '温泉と宿', en: 'Onsen and the stay' },
        icon: 'shirt',
        items: [
          { id: 'za-2-0', text: { ja: '着替え3日分', en: 'Clothes for 3 days' } },
          { id: 'za-2-1', text: { ja: 'タオル', en: 'Towel' } },
          { id: 'za-2-2', text: { ja: 'カイロ', en: 'Hand warmers' } },
          { id: 'za-2-3', text: { ja: '充電器・モバイルバッテリー', en: 'Chargers, power bank' }, note: { ja: '寒さで減りが早い', en: 'The cold drains phones' } },
          { id: 'za-2-4', text: { ja: 'キンパ', en: 'Kimbap' }, note: { ja: '余裕があれば、うめ', en: 'うめ, if there’s time' } }
        ]
      }
    ]
  },
  foot: { ja: '時刻はすべて日本時間', en: 'All times JST' }
};
