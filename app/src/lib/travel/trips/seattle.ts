// The seattle guide (docs/travel.md "Content"), ported from the old travel-plans site (its page, map tables and OSRM
// legs) and edited here since. Private values are {p:key} tokens (the trip note on the relay).
import type { Trip } from '../types.ts';

export const seattle: Trip = {
  id: "seattle",
  title: { en: "Seattle" },
  eyebrow: { en: "Cascades · 18 days" },
  sub: { en: "Jul 2 – Jul 19 · WA, USA" },
  start: "2026-07-02",
  end: "2026-07-19",
  tz: "America/Los_Angeles",
  cover: { src: "travel/seattle/cover.webp", w: 560, h: 760 },
  hero: { src: "travel/seattle/hero.webp", w: 720, h: 540 },
  dayColors: [],
  bbox: [-122.45, 46.75, -120.6, 48.15],
  days: [
    {
      n: 1,
      date: "2026-07-02",
      look: "travel",
      icon: "plane-landing",
      title: { en: "Arrival & Errands" },
      rows: [
        { t: "9:36", text: { en: "Land — Flight DL166" } },
        { t: "", text: { en: "Picked up by parents" } },
        { t: "~12:00", text: { en: "Arrive back home" } }
      ],
      sections: [
        {
          head: { en: "Afternoon errands" },
          kind: "bul",
          rows: [
            { text: { en: "Walmart" }, note: { en: "BIMBO sweet crispy wheels · strawberry shortcake ice cream" } },
            { text: { en: "H-Mart" }, note: { en: "Gas canisters" } },
            { text: { en: "Trader Joe's" }, note: { en: "Rainier cherries" } },
            { text: { en: "Target" } },
            { text: { en: "Downtown Redmond & Marymoor Park" } },
            { text: { en: "Bro makes ice cream" } }
          ]
        }
      ]
    },
    {
      n: 2,
      date: "2026-07-03",
      icon: "waves",
      title: { en: "Lake 22" },
      rows: [
        { t: "7:00", text: { en: "Leave house" } },
        { t: "8:30", text: { en: "Start hike" } },
        { t: "10:30", text: { en: "Brunch" } },
        { t: "11:30", text: { en: "Continue hike" } },
        { t: "13:00", text: { en: "Go home" } },
        { t: "", text: { en: "Chipotle dinner" } }
      ],
      photo: {
        src: "travel/seattle/lake-22.webp",
        w: 720,
        h: 480,
        alt: { en: "Lake 22 in the North Cascades" },
        caption: { en: "Granite Falls, WA" }
      },
      hike: {
        level: "mod",
        km: 9.8,
        gainM: 444,
        route: { en: "Out & back" },
        drive: { en: "1h 30m" },
        time: { en: "3 h 17 min" },
        pass: { en: "NW Forest Pass or day-use fee" },
        where: { en: "Granite Falls, WA" },
        gpx: "https://huangwaylon.github.io/gpx/#/trail/lake-22"
      }
    },
    {
      n: 3,
      date: "2026-07-04",
      icon: "sparkles",
      title: { en: "4th of July" },
      rows: [],
      sections: [
        {
          kind: "bul",
          rows: [
            { text: { en: "Visit bro at Makistand" } },
            { text: { en: "Burgers or hotdogs for lunch" } },
            {
              text: { en: "Seafair or Bellevue 4th of July event" },
              note: { en: "visitbellevuewa.com · seafair.org/4th-of-july" }
            },
            { text: { en: "Watch fireworks" } }
          ]
        }
      ]
    },
    {
      n: 4,
      date: "2026-07-05",
      icon: "building",
      title: { en: "Seattle City Day" },
      rows: [
        { t: "9:30", text: { en: "Depart from house" } },
        { t: "10:30", text: { en: "Arrive at UW" } },
        { t: "11:30", text: { en: "Depart UW" } },
        { t: "12:00", text: { en: "Lunch at Pike Place" } }
      ],
      sections: [
        {
          head: { en: "Downtown Seattle" },
          kind: "bul",
          rows: [
            { text: { en: "Pike Place Market" }, note: { en: "Original Starbucks · Pike Place Chowder" } },
            { text: { en: "Kerry Park" } },
            { text: { en: "Suzzallo & Allen Libraries" } },
            { text: { en: "Waterfront area" } }
          ]
        },
        {
          head: { en: "Evening" },
          kind: "bul",
          rows: [
            { text: { en: "Cousin's house for SUP · dinner with cousins" } },
            { text: { en: "Kirkland in the evening" } },
            { text: { en: "Watch sunset — 9:02 PM" } }
          ]
        }
      ]
    },
    {
      n: 5,
      date: "2026-07-06",
      icon: "waves",
      title: { en: "Snow Lake" },
      rows: [
        { t: "8:30", text: { en: "Leave house (~1 h drive)" } },
        { t: "9:30", text: { en: "Arrive & start hike" }, note: { en: "~2.5 h up" } },
        { t: "12:00", text: { en: "Reach Snow Lake — lunch" } },
        { t: "13:00", text: { en: "Descend" } },
        { t: "15:00", text: { en: "Go home" } }
      ],
      photo: {
        src: "travel/seattle/snow-lake.webp",
        w: 720,
        h: 480,
        alt: { en: "Snow Lake near Snoqualmie Pass" },
        caption: { en: "Snoqualmie Pass, WA" }
      },
      hike: {
        level: "mod",
        km: 10.8,
        gainM: 514,
        route: { en: "Out & back" },
        drive: { en: "1h 10m" },
        time: { en: "3 h 40 min" },
        pass: { en: "NW Forest Pass or day-use fee" },
        where: { en: "Snoqualmie Pass, WA" },
        gpx: "https://huangwaylon.github.io/gpx/#/trail/snow-lake"
      }
    },
    {
      n: 6,
      date: "2026-07-07",
      icon: "sprout",
      title: { en: "Farms & Alpacas" },
      rows: [
        { t: "9:00", text: { en: "Farrel-McWhirter Park" } },
        { t: "11:00", text: { en: "Carnation Farms" } },
        { t: "13:00", text: { en: "Harvold Berry Farm — raspberry U-pick" }, note: { en: "harvoldberryfarm.com" } },
        { t: "15:00", text: { en: "Cascade Rose Alpacas" } }
      ]
    },
    {
      n: 7,
      date: "2026-07-08",
      icon: "mountain-snow",
      title: { en: "Skyline Trail Loop" },
      rows: [
        { t: "6:00", text: { en: "Depart (3 h drive)" } },
        { t: "9:30", text: { en: "Start hike" } },
        { t: "12:00", text: { en: "Lunch" } },
        { t: "13:00", text: { en: "Descend" } },
        { t: "15:30", text: { en: "Go home" } }
      ],
      photo: {
        src: "travel/seattle/skyline-loop.webp",
        w: 720,
        h: 480,
        alt: { en: "Skyline Loop on Mount Rainier" },
        caption: { en: "Paradise, Mt. Rainier NP" }
      },
      hike: {
        level: "hard",
        km: 9.2,
        gainM: 543,
        route: { en: "Loop" },
        drive: { en: "3h" },
        time: { en: "~3 h 30 min" },
        pass: { en: "Mount Rainier NP entrance fee" },
        where: { en: "Paradise, Mt. Rainier NP" },
        gpx: "https://huangwaylon.github.io/gpx/#/trail/skyline-loop"
      }
    },
    {
      n: 8,
      date: "2026-07-09",
      icon: "droplets",
      title: { en: "Snoqualmie Falls" },
      rows: [],
      sections: [
        {
          kind: "bul",
          rows: [
            { text: { en: "Snoqualmie Falls with Mom & Dad" } },
            { text: { en: "Souvenir shopping in the afternoon" } }
          ]
        }
      ]
    },
    {
      n: 9,
      date: "2026-07-10",
      icon: "tent",
      title: { en: "Leavenworth" },
      rows: [],
      sections: [
        {
          kind: "bul",
          rows: [
            { text: { en: "Drive to Leavenworth (afternoon/evening)" } },
            { text: { en: "Camp out in the car" } }
          ]
        }
      ]
    },
    {
      n: 10,
      date: "2026-07-11",
      icon: "mountain-snow",
      title: { en: "The Enchantments" },
      rows: [
        { t: "5:00", text: { en: "Start hike (with Chris)" } },
        { t: "", text: { en: "{km:30.7} · {m:1477} gain · 10–13 h" } },
        { t: "<21:00", text: { en: "Finish before sunset" }, note: { en: "Bring the water filter!" } }
      ],
      photo: {
        src: "travel/seattle/enchantments.webp",
        w: 720,
        h: 480,
        alt: { en: "The Enchantments alpine lakes" },
        caption: { en: "Leavenworth, WA" }
      },
      hike: {
        level: "epic",
        km: 30.7,
        gainM: 1477,
        route: { en: "Point to point" },
        drive: { en: "2h 40m" },
        time: { en: "10–13 h" },
        pass: { en: "Overnight permit (lottery)" },
        where: { en: "Leavenworth, WA" },
        gpx: "https://huangwaylon.github.io/gpx/#/trail/enchantments"
      }
    },
    {
      n: 11,
      date: "2026-07-12",
      icon: "teacup",
      title: { en: "Bro Day" },
      rows: [],
      sections: [
        {
          kind: "bul",
          rows: [
            { text: { en: "Hang out with bro · shop for ingredients" } },
            { text: { en: "Downtown Redmond" }, note: { en: "Movie-theater butter popcorn" } },
            { text: { en: "Cooking class — make matcha tart" } },
            { text: { en: "Shopping: Bellevue Square & Downtown Park" } },
            { text: { en: "Läderach chocolate · HeyTea boba" } },
            { text: { en: "Board games · watch a movie" } }
          ]
        }
      ]
    },
    {
      n: 12,
      date: "2026-07-13",
      icon: "waves",
      title: { en: "Lake Serene" },
      rows: [
        { t: "8:00", text: { en: "Depart (1 h drive)" } },
        { t: "9:00", text: { en: "Start hike" } },
        { t: "12:00", text: { en: "Lunch" } },
        { t: "13:00", text: { en: "Descend" } },
        { t: "16:00", text: { en: "Go home" } }
      ],
      photo: {
        src: "travel/seattle/bridal-veil.webp",
        w: 720,
        h: 480,
        alt: { en: "Bridal Veil Falls and Lake Serene" },
        caption: { en: "Gold Bar, WA" }
      },
      hike: {
        level: "hard",
        km: 12.9,
        gainM: 828,
        route: { en: "Out & back" },
        drive: { en: "1h" },
        time: { en: "5 h 10 min" },
        pass: { en: "NW Forest Pass" },
        where: { en: "Gold Bar, WA" },
        gpx: "https://huangwaylon.github.io/gpx/#/trail/bridal-veil"
      }
    },
    {
      n: 13,
      date: "2026-07-14",
      icon: "mountain",
      title: { en: "Mt Pilchuck" },
      rows: [
        { t: "8:00", text: { en: "Depart" } },
        { t: "9:45", text: { en: "Start hike" } },
        { t: "12:00", text: { en: "Lunch" } },
        { t: "13:00", text: { en: "Descend" } },
        { t: "14:30", text: { en: "Go home" } }
      ],
      photo: {
        src: "travel/seattle/mount-pilchuck.webp",
        w: 720,
        h: 480,
        alt: { en: "Mt Pilchuck summit lookout" },
        caption: { en: "Granite Falls, WA" }
      },
      hike: {
        level: "hard",
        km: 8.7,
        gainM: 653,
        route: { en: "Out & back" },
        drive: { en: "1h 45m" },
        time: { en: "~3 h 30 min" },
        pass: { en: "NW Forest Pass" },
        where: { en: "Granite Falls, WA" },
        gpx: "https://huangwaylon.github.io/gpx/#/trail/mount-pilchuck"
      }
    },
    {
      n: 14,
      date: "2026-07-15",
      icon: "sailboat",
      title: { en: "SUP Day" },
      rows: [],
      sections: [
        {
          kind: "bul",
          rows: [
            { text: { en: "Lake Sammamish — Pine Lake Dock" } },
            { text: { en: "Downtown Kirkland" } },
            { text: { en: "Watch sunset" } }
          ]
        }
      ]
    },
    {
      n: 15,
      date: "2026-07-16",
      icon: "waves",
      title: { en: "Lake Valhalla" },
      rows: [
        { t: "7:30", text: { en: "Depart" } },
        { t: "9:00", text: { en: "Start hike" } },
        { t: "11:30", text: { en: "Lunch" } },
        { t: "12:30", text: { en: "Descend" } },
        { t: "15:00", text: { en: "Go home" } }
      ],
      photo: {
        src: "travel/seattle/lake-valhalla.webp",
        w: 720,
        h: 480,
        alt: { en: "Lake Valhalla on the Pacific Crest Trail" },
        caption: { en: "Leavenworth, WA" }
      },
      hike: {
        level: "mod",
        km: 10.3,
        gainM: 418,
        route: { en: "Out & back" },
        drive: { en: "1h 30m" },
        time: { en: "3 h 16 min" },
        pass: { en: "NW Forest Pass or parking fee" },
        where: { en: "Leavenworth, WA" },
        gpx: "https://huangwaylon.github.io/gpx/#/trail/lake-valhalla"
      }
    },
    {
      n: 16,
      date: "2026-07-17",
      icon: "shopping-bag",
      title: { en: "Souvenirs & Ballard" },
      rows: [],
      sections: [
        {
          kind: "bul",
          rows: [
            { text: { en: "Trader Joe's · World Market" }, note: { en: "Souvenir shopping" } },
            { text: { en: "Ballard Locks Fish Ladder" } },
            { text: { en: "Gas Works Park" } },
            { text: { en: "Ivars" } },
            { text: { en: "Evan's Creek Preserve" } },
            { text: { en: "Return SUP" } }
          ]
        }
      ]
    },
    {
      n: 17,
      date: "2026-07-18",
      icon: "waves",
      title: { en: "Lake Talapus" },
      rows: [
        { t: "7:00", text: { en: "Depart" } },
        { t: "8:30", text: { en: "Start hike" } },
        { t: "10:00", text: { en: "Brunch" } },
        { t: "11:00", text: { en: "Descend" } },
        { t: "12:00", text: { en: "Go home" } }
      ],
      photo: {
        src: "travel/seattle/talapus-lake.webp",
        w: 720,
        h: 480,
        alt: { en: "Talapus and Olallie lakes" },
        caption: { en: "Snoqualmie Pass, WA" }
      },
      hike: {
        level: "mod",
        km: 5.6,
        gainM: 200,
        route: { en: "Out & back" },
        drive: { en: "1h 10m" },
        time: { en: "1 h 42 min" },
        pass: { en: "NW Forest Pass" },
        where: { en: "Snoqualmie Pass, WA" },
        gpx: "https://huangwaylon.github.io/gpx/#/trail/talapus-lake"
      }
    },
    {
      n: 18,
      date: "2026-07-19",
      look: "travel",
      icon: "plane-takeoff",
      title: { en: "Fly Home to Japan" },
      rows: [
        { t: "7:30", text: { en: "Depart from home" } },
        { t: "8:30", text: { en: "Arrive at airport" }, note: { en: "Arrive 3 h before" } },
        { t: "11:50", text: { en: "Departure" } }
      ]
    }
  ],
  logistics: [],
  places: [],
  legs: [],
  packing: {
    cats: [
      {
        id: "se-0",
        name: { en: "Must Bring" },
        icon: "pin",
        items: [
          { id: "se-0-0", text: { en: "Passport" } },
          { id: "se-0-1", text: { en: "VISA registration (Umechan)" } },
          { id: "se-0-2", text: { en: "Driver's license (Waylon)" } },
          { id: "se-0-3", text: { en: "Phone" } },
          { id: "se-0-4", text: { en: "Phone charger" } },
          { id: "se-0-5", text: { en: "Clothes" }, note: { en: "A few days' worth — wash every few days" } },
          { id: "se-0-6", text: { en: "Camera" } },
          { id: "se-0-7", text: { en: "Tripod" } },
          { id: "se-0-8", text: { en: "Mt Rainier empty coffee cup" } }
        ]
      },
      {
        id: "se-1",
        name: { en: "SUP & Swim" },
        icon: "waves",
        items: [{ id: "se-1-0", text: { en: "Swimsuit" } }, { id: "se-1-1", text: { en: "Waterproof phone case" } }]
      },
      {
        id: "se-2",
        name: { en: "Hiking" },
        icon: "footprints",
        items: [
          { id: "se-2-0", text: { en: "Hiking shoes" } },
          { id: "se-2-1", text: { en: "Gas burner" } },
          { id: "se-2-2", text: { en: "Hat" } },
          { id: "se-2-3", text: { en: "Sunscreen" } },
          { id: "se-2-4", text: { en: "Water filter" }, note: { en: "For the Enchantments" } },
          { id: "se-2-5", text: { en: "Northwest Forest Pass" }, note: { en: "Day pass — wta.org/go-outside/passes" } }
        ]
      },
      {
        id: "se-3",
        name: { en: "Souvenirs" },
        icon: "gift",
        items: [
          { id: "se-3-0", text: { en: "Postcards" } },
          { id: "se-3-1", text: { en: "Souvenir requests" }, note: { en: "Ian · Brittany · Sonia (check requests)" } }
        ]
      }
    ]
  },
  classic: true
};
