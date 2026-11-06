// A made-up Okinawa trip for the map's unit tests (map.test.ts): real places, rough coordinates, no one's plans. Three
// days in the trip's colours; the legs hand-drawn polylines (the real trip's come from its OSRM cache).
import type { MapLeg, MapPlace } from './types.ts';

export const SAMPLE_COLORS = ['#2F86BD', '#D2701F', '#4FA35C'];

export const SAMPLE_PLACES: MapPlace[] = [
  { id: 'oka', kind: 'stop', day: 1, i: 1, name: { ja: '那覇空港', en: 'Naha Airport' }, lat: 26.2058, lon: 127.6469 },
  { id: 'kokusai', kind: 'stop', day: 1, i: 2, name: { ja: '国際通り', en: 'Kokusai-dori' }, lat: 26.2155, lon: 127.6880 },
  { id: 'shuri', kind: 'stop', day: 1, i: 3, name: { ja: '首里城', en: 'Shuri Castle' }, lat: 26.2170, lon: 127.7195 },
  { id: 'churaumi', kind: 'stop', day: 2, i: 1, name: { ja: '美ら海水族館', en: 'Churaumi Aquarium' }, lat: 26.6944, lon: 127.8779 },
  { id: 'bise', kind: 'stop', day: 2, i: 2, name: { ja: '備瀬のフクギ並木', en: 'Bise Fukugi Trees' }, lat: 26.7031, lon: 127.8807 },
  { id: 'motobu-port', kind: 'stop', day: 2, i: 3, name: { ja: '本部港', en: 'Motobu Port' }, lat: 26.6568, lon: 127.8917 },
  { id: 'minna', kind: 'stop', day: 2, i: 4, name: { ja: '水納島', en: 'Minna Island' }, lat: 26.6453, lon: 127.8200 },
  { id: 'manzamo', kind: 'stop', day: 3, i: 1, name: { ja: '万座毛', en: 'Cape Manzamo' }, lat: 26.5049, lon: 127.8505 },
  { id: 'mihama', kind: 'stop', day: 3, i: 2, name: { ja: 'アメリカンビレッジ', en: 'American Village' }, lat: 26.3164, lon: 127.7571 },
  { id: 'c-bise', kind: 'camp', name: { ja: '備瀬ビーチ', en: 'Bise Beach' }, lat: 26.7078, lon: 127.8822 },
  { id: 'c-nago', kind: 'camp', name: { ja: '21世紀の森ビーチ', en: '21st Century Forest Beach' }, lat: 26.5873, lon: 127.9688 },
  { id: 'n-kouri', kind: 'nature', name: { ja: '古宇利島', en: 'Kouri Island' }, lat: 26.7034, lon: 128.0233 },
  { id: 'n-yae', kind: 'nature', name: { ja: '八重岳', en: 'Mt Yae' }, lat: 26.6411, lon: 127.9306 },
  { id: 'food-soba', kind: 'food', name: { ja: '本部そば街道', en: 'Motobu Soba Road' }, lat: 26.6571, lon: 127.9052 },
  { id: 'food-makishi', kind: 'food', name: { ja: '牧志公設市場', en: 'Makishi Market' }, lat: 26.2149, lon: 127.6907 }
];

export const SAMPLE_LEGS: MapLeg[] = [
  { day: 1, mode: 'drive', line: [[127.6469, 26.2058], [127.6620, 26.2085], [127.6765, 26.2120], [127.6880, 26.2155]] },
  { day: 1, mode: 'walk', line: [[127.6880, 26.2155], [127.6990, 26.2160], [127.7080, 26.2178], [127.7195, 26.2170]] },
  { day: 2, mode: 'drive', line: [[127.7195, 26.2170], [127.7400, 26.3000], [127.7800, 26.4200], [127.8600, 26.5300], [127.9600, 26.5900], [127.9100, 26.6400], [127.8779, 26.6944]] },
  { day: 2, mode: 'walk', line: [[127.8779, 26.6944], [127.8790, 26.6990], [127.8807, 26.7031]] },
  { day: 2, mode: 'drive', line: [[127.8807, 26.7031], [127.8870, 26.6850], [127.8917, 26.6568]] },
  { day: 2, mode: 'boat', line: [[127.8917, 26.6568], [127.8600, 26.6500], [127.8200, 26.6453]] },
  { day: 3, mode: 'drive', line: [[127.8917, 26.6568], [127.9300, 26.6000], [127.8800, 26.5300], [127.8505, 26.5049]] },
  { day: 3, mode: 'bus', line: [[127.8505, 26.5049], [127.7900, 26.4300], [127.7650, 26.3600], [127.7571, 26.3164]] }
];
