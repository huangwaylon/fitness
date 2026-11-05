// @ts-nocheck -- check.ts's page: the app's createPlayer on a plain stage.
import * as THREE from 'three';
import { createPlayer } from '/lib/components/player3d/player3d.ts';
import { DEFAULT_LOOKS } from '/lib/contract/look.ts';
import { portrait } from '/lib/components/player3d/portrait.ts';

const r = new THREE.WebGLRenderer({ antialias: true, preserveDrawingBuffer: true });
r.setSize(900, 900);
r.outputColorSpace = THREE.SRGBColorSpace;
document.body.appendChild(r.domElement);
const scene = new THREE.Scene();
scene.background = new THREE.Color('#cfe8e0');
scene.add(new THREE.HemisphereLight(0xffffff, 0x9fb0a0, 1.6));
const sun = new THREE.DirectionalLight(0xfff2dd, 1.4);
sun.position.set(-40, 120, 90);
scene.add(sun);
const cam = new THREE.PerspectiveCamera(24, 1, 1, 2000);
const shot = (y, d, x = 0, yaw = 0) => {
  cam.position.set(x + d * Math.sin(yaw), y + d * 0.12, d * Math.cos(yaw));
  cam.lookAt(x, y, 0);
  r.render(scene, cam);
  return r.domElement.toDataURL('image/png');
};

window.run = async () => {
  const out = {};
  const a = await createPlayer('A', DEFAULT_LOOKS.A, '/room/player', 1);
  const b = await createPlayer('B', DEFAULT_LOOKS.B, '/room/player', 2);
  a.group.position.x = -55; b.group.position.x = 55;
  scene.add(a.group, b.group);
  const step = (t) => { a.step(t); b.step(t); };
  step(0); step(1000);
  out.idle = shot(45, 420);
  out.face = shot(70, 160, -55, -0.3);
  out.faceB = shot(70, 160, 55, 0.3);
  out.backB = shot(70, 200, 55, Math.PI - 0.5);
  out.side = shot(70, 180, -55, -1.0);
  a.set('sit'); b.set('sit'); step(3000);
  out.sit = shot(40, 420);
  a.set('walk'); b.set('walk');
  for (let t = 3000; t < 3400; t += 16) { a.step(t, 1.5, 120); b.step(t, 1.5, 120); }
  out.walk = shot(45, 420, 0, 0.9);
  a.set('lie'); b.set('lie'); step(6000);
  out.lie = shot(30, 420, 0, 1.2);
  a.set('idle'); b.set('idle'); step(9000);
  a.face('happy'); b.face('surprised'); step(9100);
  out.faces = shot(70, 260);
  a.face(null); b.face(null);
  a.act('wave'); b.act('sting'); step(9200); step(9900);
  out.acts = shot(45, 420);
  out.sting = shot(70, 170, 55, 0.2);
  step(13000);
  // a swap: B into A's top and hair, a red-haired A
  await b.dress({ ...DEFAULT_LOOKS.B, top: 'TopsTexTopTshirtsHPocketshirts3', bottom: 'BottomsTexPantsNormalDenim0', hair: 'PlayerHair05', ornament: null, eye: 'PlayerEye00' });
  await a.dress({ ...DEFAULT_LOOKS.A, hairColor: '#a03020', skin: '#c98e62', glasses: 'AccessoryGlassOval1', top: 'TopsTexOnepieceBalloonHDolly0', bottom: null });
  step(14000);
  out.dressed = shot(45, 420);
  out.portraitA = portrait(r, a, 256, '#f4efe2').toDataURL('image/png');
  out.portraitB = portrait(r, b, 256, null).toDataURL('image/png');
  out.after = shot(45, 420);
  // all of them on one sheet
  const c = document.createElement('canvas'); c.width = c.height = 900;
  const g = c.getContext('2d');
  const ks = Object.keys(out);
  for (let i = 0; i < ks.length; i++) {
    const im = new Image(); im.src = out[ks[i]]; await im.decode();
    g.drawImage(im, (i % 3) * 300, Math.floor(i / 3) * 300, 300, 300);
    g.fillStyle = '#000'; g.font = '14px sans-serif'; g.fillText(ks[i], (i % 3) * 300 + 6, Math.floor(i / 3) * 300 + 18);
  }
  out.sheet = c.toDataURL('image/png');
  return out;
};
window.ready = true;
