import * as THREE from 'https://cdn.jsdelivr.net/npm/three@0.161.0/build/three.module.js';
import { OrbitControls } from 'https://cdn.jsdelivr.net/npm/three@0.161.0/examples/jsm/controls/OrbitControls.js';
import { EffectComposer } from 'https://cdn.jsdelivr.net/npm/three@0.161.0/examples/jsm/postprocessing/EffectComposer.js';
import { RenderPass } from 'https://cdn.jsdelivr.net/npm/three@0.161.0/examples/jsm/postprocessing/RenderPass.js';
import { GlitchPass } from 'https://cdn.jsdelivr.net/npm/three@0.161.0/examples/jsm/postprocessing/GlitchPass.js';


const canvas = document.getElementById('ants3d');
const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(60, window.innerWidth/window.innerHeight, 0.1, 1000);
camera.position.set(40, 40, 40);

const renderer = new THREE.WebGLRenderer({canvas, antialias: true});
renderer.setSize(window.innerWidth, window.innerHeight);
window.addEventListener('resize', () => {
  renderer.setSize(window.innerWidth, window.innerHeight);
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
});

const controls = new OrbitControls(camera, canvas);
controls.enablePan = false;

const GRID_SIZE = 41;
const cubeGeo = new THREE.BoxGeometry(1,1,1);
const wireMat = new THREE.MeshBasicMaterial({ color: 0x888888, wireframe: true });

const voxels = [];
for (let x=0; x<GRID_SIZE; x++)
for (let y=0; y<GRID_SIZE; y++)
for (let z=0; z<GRID_SIZE; z++) {
  const mesh = new THREE.Mesh(cubeGeo, wireMat);
  mesh.position.set(x - GRID_SIZE/2, y - GRID_SIZE/2, z - GRID_SIZE/2);
  scene.add(mesh);
  voxels.push(mesh);
}

class Ant3D {
  constructor(gridSize) {
    this.pos = new THREE.Vector3(0,0,0);
    this.dir = new THREE.Vector3(1,0,0);
    this.memo = new Map();
    this.limit = (gridSize - 1) / 2;
  }
  key() {
    return `${this.pos.x}|${this.pos.y}|${this.pos.z}`;
  }
  step() {
    const k = this.key();
    const state = this.memo.get(k) || 0;
    const turn = state ? -1 : 1;
    const axis = this.dir.x ? 'y' : (this.dir.y ? 'z' : 'x');
    this.dir.applyAxisAngle(new THREE.Vector3(
      axis === 'x', axis === 'y', axis === 'z'
    ), turn * Math.PI / 2).round();
    this.memo.set(k, 1 - state);
    this.pos.add(this.dir);
    ['x','y','z'].forEach(a => {
      if (this.pos[a] > this.limit) this.pos[a] = -this.limit;
      if (this.pos[a] < -this.limit) this.pos[a] = this.limit;
    });
  }
}

const ant = new Ant3D(GRID_SIZE);

const composer = new EffectComposer(renderer);
composer.addPass(new RenderPass(scene, camera));
const glitch = new GlitchPass();
glitch.goWild = true;
glitch.enabled = false;
composer.addPass(glitch);

let scrollTimeout;
window.addEventListener('scroll', () => {
  glitch.enabled = true;
  clearTimeout(scrollTimeout);
  scrollTimeout = setTimeout(() => glitch.enabled = false, 400);
});

function animate() {
  requestAnimationFrame(animate);
  for (let i = 0; i < 300; i++) ant.step();
  for (const mesh of voxels) {
    const k = `${mesh.position.x}|${mesh.position.y}|${mesh.position.z}`;
    mesh.material.color.setHex(ant.memo.get(k) ? 0xfefefe : 0x888888);
  }
  composer.render();
}

animate();
