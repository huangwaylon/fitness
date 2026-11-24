// A place's zone from its coordinates (src/tz.ts): one real city per zone the boxes name (each checked against a
// time-zone boundary lookup when the table was made), the edges that were wrong before, and the longitude fallback.
import { describe, expect, it } from 'vitest';
import { tzOf } from '../src/tz.ts';

describe('tzOf', () => {
  it('a city in every zone the boxes name', () => {
    const at: [number, number, string][] = [
    [5.35, -4.00, 'Africa/Abidjan'], // Abidjan
    [36.73, 3.09, 'Africa/Algiers'], // Algiers
    [30.06, 31.25, 'Africa/Cairo'], // Cairo
    [33.59, -7.61, 'Africa/Casablanca'], // Casablanca
    [-2.52, 32.90, 'Africa/Dar_es_Salaam'], // Mwanza
    [27.14, -13.19, 'Africa/El_Aaiun'], // Laayoune
    [-33.93, 18.42, 'Africa/Johannesburg'], // Cape Town
    [6.45, 3.39, 'Africa/Lagos'], // Lagos
    [-11.66, 27.48, 'Africa/Lubumbashi'], // Lubumbashi
    [-13.97, 33.79, 'Africa/Maputo'], // Lilongwe
    [9.02, 38.75, 'Africa/Nairobi'], // Addis Ababa
    [12.00, 8.52, 'Africa/Niamey'], // Kano
    [32.89, 13.19, 'Africa/Tripoli'], // Tripoli
    [36.82, 10.17, 'Africa/Tunis'], // Tunis
    [61.22, -149.90, 'America/Anchorage'], // Anchorage
    [-34.61, -58.38, 'America/Argentina/Buenos_Aires'], // Buenos Aires
    [-25.29, -57.65, 'America/Asuncion'], // Asunción
    [-1.46, -48.50, 'America/Belem'], // Belém
    [43.61, -116.20, 'America/Boise'], // Boise
    [21.17, -86.85, 'America/Cancun'], // Cancún
    [10.49, -66.88, 'America/Caracas'], // Caracas
    [41.85, -87.65, 'America/Chicago'], // Chicago
    [28.64, -106.09, 'America/Chihuahua'], // Chihuahua
    [31.72, -106.46, 'America/Denver'], // Juárez
    [51.05, -114.09, 'America/Edmonton'], // Calgary
    [44.65, -63.57, 'America/Halifax'], // Halifax
    [23.13, -82.38, 'America/Havana'], // Havana
    [58.30, -134.42, 'America/Juneau'], // Juneau
    [-17.79, -63.18, 'America/La_Paz'], // Santa Cruz de la Sierra
    [34.05, -118.24, 'America/Los_Angeles'], // Los Angeles
    [24.79, -107.39, 'America/Mazatlan'], // Culiacán
    [19.43, -99.13, 'America/Mexico_City'], // Mexico City
    [26.91, -101.42, 'America/Monterrey'], // Monclova
    [40.71, -74.01, 'America/New_York'], // New York City
    [5.87, -55.17, 'America/Paramaribo'], // Paramaribo
    [33.45, -112.07, 'America/Phoenix'], // Phoenix
    [18.54, -72.34, 'America/Port-au-Prince'], // Port-au-Prince
    [-12.97, -38.51, 'America/Recife'], // Salvador
    [52.13, -106.67, 'America/Regina'], // Saskatoon
    [-33.46, -70.65, 'America/Santiago'], // Santiago
    [18.47, -69.89, 'America/Santo_Domingo'], // Santo Domingo
    [-25.43, -49.27, 'America/Sao_Paulo'], // Curitiba
    [47.56, -52.71, 'America/St_Johns'], // St. Johns
    [31.87, -116.60, 'America/Tijuana'], // Ensenada
    [50.21, -66.38, 'America/Toronto'], // Sept-Iles
    [49.25, -123.12, 'America/Vancouver'], // Vancouver
    [60.72, -135.06, 'America/Whitehorse'], // Whitehorse
    [49.88, -97.15, 'America/Winnipeg'], // Winnipeg
    [43.26, 76.93, 'Asia/Almaty'], // Almaty
    [30.51, 47.78, 'Asia/Baghdad'], // Basrah
    [40.38, 49.89, 'Asia/Baku'], // Baku
    [13.75, 100.50, 'Asia/Bangkok'], // Bangkok
    [33.89, 35.50, 'Asia/Beirut'], // Beirut
    [42.87, 74.59, 'Asia/Bishkek'], // Bishkek
    [23.71, 90.41, 'Asia/Dhaka'], // Dhaka
    [22.55, 114.07, 'Asia/Hong_Kong'], // Shenzhen
    [52.30, 104.30, 'Asia/Irkutsk'], // Irkutsk
    [-6.21, 106.85, 'Asia/Jakarta'], // Jakarta
    [31.77, 35.22, 'Asia/Jerusalem'], // Jerusalem
    [34.53, 69.17, 'Asia/Kabul'], // Kabul
    [53.04, 158.65, 'Asia/Kamchatka'], // Petropavlovsk-Kamchatsky
    [24.86, 67.01, 'Asia/Karachi'], // Karachi
    [27.70, 85.32, 'Asia/Kathmandu'], // Kathmandu
    [19.07, 72.88, 'Asia/Kolkata'], // Mumbai
    [6.12, 102.24, 'Asia/Kuala_Lumpur'], // Kota Bharu
    [1.55, 110.33, 'Asia/Kuching'], // Kuching
    [59.56, 150.80, 'Asia/Magadan'], // Magadan
    [35.18, 33.36, 'Asia/Nicosia'], // Nicosia
    [55.04, 82.93, 'Asia/Novosibirsk'], // Novosibirsk
    [54.99, 73.37, 'Asia/Omsk'], // Omsk
    [51.23, 51.37, 'Asia/Oral'], // Oral
    [-0.03, 109.33, 'Asia/Pontianak'], // Pontianak
    [40.13, 124.39, 'Asia/Pyongyang'], // Dandong
    [24.69, 46.72, 'Asia/Riyadh'], // Riyadh
    [46.95, 142.74, 'Asia/Sakhalin'], // Yuzhno-Sakhalinsk
    [37.57, 126.98, 'Asia/Seoul'], // Seoul
    [31.22, 121.46, 'Asia/Shanghai'], // Shanghai
    [1.29, 103.85, 'Asia/Singapore'], // Singapore
    [25.05, 121.53, 'Asia/Taipei'], // Taipei
    [37.95, 58.38, 'Asia/Tashkent'], // Ashgabat
    [40.18, 44.51, 'Asia/Tbilisi'], // Yerevan
    [35.69, 51.42, 'Asia/Tehran'], // Tehran
    [26.85, 89.38, 'Asia/Thimphu'], // Jaigaon
    [35.69, 139.69, 'Asia/Tokyo'], // Tokyo
    [47.91, 106.88, 'Asia/Ulaanbaatar'], // Ulan Bator
    [37.11, 79.94, 'Asia/Urumqi'], // Hotan
    [43.11, 131.87, 'Asia/Vladivostok'], // Vladivostok
    [52.03, 113.50, 'Asia/Yakutsk'], // Chita
    [16.81, 96.16, 'Asia/Yangon'], // Yangon
    [56.85, 60.61, 'Asia/Yekaterinburg'], // Yekaterinburg
    [37.74, -25.67, 'Atlantic/Azores'], // Ponta Delgada
    [28.10, -15.41, 'Atlantic/Canary'], // Las Palmas de Gran Canaria
    [14.93, -23.51, 'Atlantic/Cape_Verde'], // Praia
    [62.01, -6.77, 'Atlantic/Faroe'], // Torshavn
    [32.67, -16.93, 'Atlantic/Madeira'], // Funchal
    [64.14, -21.90, 'Atlantic/Reykjavik'], // Reykjavík
    [-34.93, 138.60, 'Australia/Adelaide'], // Adelaide
    [-27.47, 153.03, 'Australia/Brisbane'], // Brisbane
    [-12.46, 130.84, 'Australia/Darwin'], // Darwin
    [-33.87, 151.21, 'Australia/Sydney'], // Sydney
    [46.35, 48.04, 'Europe/Astrakhan'], // Astrakhan
    [37.98, 23.73, 'Europe/Athens'], // Athens
    [44.43, 26.11, 'Europe/Bucharest'], // Bucharest
    [60.17, 24.94, 'Europe/Helsinki'], // Helsinki
    [41.01, 28.95, 'Europe/Istanbul'], // Istanbul
    [54.71, 20.51, 'Europe/Kaliningrad'], // Kaliningrad
    [50.45, 30.52, 'Europe/Kiev'], // Kyiv
    [38.72, -9.13, 'Europe/Lisbon'], // Lisbon
    [51.51, -0.13, 'Europe/London'], // London
    [42.23, -8.72, 'Europe/Madrid'], // Vigo
    [53.90, 27.57, 'Europe/Minsk'], // Minsk
    [55.75, 37.62, 'Europe/Moscow'], // Moscow
    [60.39, 5.32, 'Europe/Oslo'], // Bergen
    [52.52, 13.41, 'Europe/Paris'], // Berlin
    [56.95, 24.11, 'Europe/Riga'], // Riga
    [53.20, 50.15, 'Europe/Samara'], // Samara
    [51.54, 46.01, 'Europe/Saratov'], // Saratov
    [44.61, 33.52, 'Europe/Simferopol'], // Sevastopol
    [42.00, 21.43, 'Europe/Skopje'], // Skopje
    [42.70, 23.32, 'Europe/Sofia'], // Sofia
    [63.83, 20.26, 'Europe/Stockholm'], // Umeå
    [41.33, 19.82, 'Europe/Tirane'], // Tirana
    [54.69, 25.28, 'Europe/Vilnius'], // Vilnius
    [52.23, 21.01, 'Europe/Warsaw'], // Warsaw
    [4.18, 73.51, 'Indian/Maldives'], // Male
    [-36.85, 174.76, 'Pacific/Auckland'], // Auckland
    [21.31, -157.86, 'Pacific/Honolulu'], // Honolulu
    ];
    for (const [lat, lng, tz] of at) expect([lat, lng, tzOf(lat, lng)]).toEqual([lat, lng, tz]);
  });

  it('the edges: Japan, Korea and NE China; Turkey and the Greek islands; Malaysia and Sumatra; Navajo and Arizona', () => {
    expect(tzOf(35.68, 139.76)).toBe('Asia/Tokyo');
    expect(tzOf(26.2, 127.7)).toBe('Asia/Tokyo');
    expect(tzOf(43.06, 141.35)).toBe('Asia/Tokyo');
    expect(tzOf(34.2, 129.3)).toBe('Asia/Tokyo'); // Tsushima
    expect(tzOf(35.1, 129.04)).toBe('Asia/Seoul'); // Busan
    expect(tzOf(42.91, 129.51)).toBe('Asia/Shanghai'); // Yanji
    expect(tzOf(43.12, 131.9)).toBe('Asia/Vladivostok');
    expect(tzOf(41.01, 28.98)).toBe('Europe/Istanbul');
    expect(tzOf(38.64, 34.83)).toBe('Europe/Istanbul'); // Cappadocia
    expect(tzOf(36.43, 28.22)).toBe('Europe/Athens'); // Rhodes
    expect(tzOf(37.94, 23.64)).toBe('Europe/Athens');
    expect(tzOf(3.15, 101.71)).toBe('Asia/Kuala_Lumpur');
    expect(tzOf(5.4, 100.27)).toBe('Asia/Kuala_Lumpur'); // Penang
    expect(tzOf(1.08, 104.03)).toBe('Etc/GMT-7'); // Batam: not Singapore
    expect(tzOf(1.29, 103.85)).toBe('Asia/Singapore');
    expect(tzOf(7.88, 98.39)).toBe('Asia/Bangkok'); // Phuket
    expect(tzOf(36.86, -111.37)).toBe('America/Denver'); // Antelope Canyon (Navajo)
    expect(tzOf(36.06, -112.14)).toBe('America/Phoenix'); // Grand Canyon
    expect(tzOf(19.41, -99.17)).toBe('America/Mexico_City');
    expect(tzOf(51.18, -115.57)).toBe('America/Edmonton'); // Banff
    expect(tzOf(49.94, -123.03)).toBe('America/Vancouver');
    expect(tzOf(59.44, 24.74)).toBe('Europe/Riga'); // Tallinn: the same rules
    expect(tzOf(6.09, 73.2)).toBe('Indian/Maldives');
  });

  it('elsewhere: the longitude whole hour', () => {
    expect(tzOf(0, 0)).toBe('Etc/GMT');
    expect(tzOf(-9.43, 159.95)).toBe('Etc/GMT-11');
    expect(tzOf(-15, -147)).toBe('Etc/GMT+10');
  });
});
