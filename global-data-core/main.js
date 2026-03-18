import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';

import { EffectComposer } from 'three/addons/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/addons/postprocessing/RenderPass.js';
import { UnrealBloomPass } from 'three/addons/postprocessing/UnrealBloomPass.js';
import { OutputPass } from 'three/addons/postprocessing/OutputPass.js';
import { FXAAPass } from 'three/addons/postprocessing/FXAAPass.js';

import { ShaderPass } from 'three/addons/postprocessing/ShaderPass.js';
import { RGBShiftShader } from 'three/addons/shaders/RGBShiftShader.js';
import { AfterimagePass } from 'three/addons/postprocessing/AfterimagePass.js';

import GUI from 'lil-gui';

/**
 * ============================================================
 * 參數（lil-gui 可調）
 * ============================================================
 */
const params = {
  // 視覺規模
  globeRadius: 6.0,
  coreRadius: 1.35,

  // 節點與流
  nodeCount: 240,
  streamsPerNode: 18, 
  streamBend: 2.2,    
  digitRate: 14.0,    
  basePointSize: 26.0,

  // 能量與顏色
  energy: 1.0,
  pulseSpeed: 1.2,
  hueShiftSpeed: 0.08,
  palette: 'cyber', // cyber | plasma | amber

  // 渲染品質
  renderScale: 1.0,     
  maxPixelRatio: 2.0,   

  // 後製：Bloom
  bloomStrength: 1.35,
  bloomRadius: 0.55,
  bloomThreshold: 0.06,

  // 後製：特效
  enableRGBShift: true,
  rgbShiftAmount: 0.0025,
  enableAfterimage: false,
  afterimageDamp: 0.90, 

  // Tone mapping
  exposure: 1.15,

  // 操作
  autoRotate: true,
  autoRotateSpeed: 0.25,

  rebuild: () => rebuildAll(),
};

const TAU = Math.PI * 2.0;
const clamp = (x, a, b) => Math.min(b, Math.max(a, x));
const fract = (x) => x - Math.floor(x);

function hash11(x) {
  return fract(Math.sin(x) * 43758.5453123);
}
function hash31(x) {
  return new THREE.Vector3(hash11(x + 0.1), hash11(x + 1.7), hash11(x + 2.3));
}

function randomUnitVec(seed) {
  const u = hash11(seed + 10.0);
  const v = hash11(seed + 20.0);
  const theta = TAU * u;
  const z = v * 2.0 - 1.0;
  const r = Math.sqrt(Math.max(0.0, 1.0 - z * z));
  return new THREE.Vector3(r * Math.cos(theta), z, r * Math.sin(theta));
}

const CORE_VERT = /* glsl */`
  uniform float uTime;
  uniform float uEnergy;
  uniform float uPulseSpeed;

  varying vec3 vN;
  varying vec3 vP;

  float hash13(vec3 p) {
    p = fract(p * 0.1031);
    p += dot(p, p.zyx + 31.32);
    return fract((p.x + p.y) * p.z);
  }

  float noise(vec3 p) {
    vec3 i = floor(p);
    vec3 f = fract(p);
    vec3 u = f * f * (3.0 - 2.0 * f);
    float n000 = hash13(i + vec3(0,0,0));
    float n100 = hash13(i + vec3(1,0,0));
    float n010 = hash13(i + vec3(0,1,0));
    float n110 = hash13(i + vec3(1,1,0));
    float n001 = hash13(i + vec3(0,0,1));
    float n101 = hash13(i + vec3(1,0,1));
    float n011 = hash13(i + vec3(0,1,1));
    float n111 = hash13(i + vec3(1,1,1));
    float nx00 = mix(n000, n100, u.x);
    float nx10 = mix(n010, n110, u.x);
    float nx01 = mix(n001, n101, u.x);
    float nx11 = mix(n011, n111, u.x);
    float nxy0 = mix(nx00, nx10, u.y);
    float nxy1 = mix(nx01, nx11, u.y);
    return mix(nxy0, nxy1, u.z);
  }

  float fbm(vec3 p) {
    float f = 0.0;
    float a = 0.5;
    for (int i = 0; i < 5; i++) {
      f += a * noise(p);
      p *= 2.02;
      a *= 0.5;
    }
    return f;
  }

  void main() {
    vN = normalize(normalMatrix * normal);
    vec3 p = position;
    float t = uTime * uPulseSpeed;
    float pulse = 0.5 + 0.5 * sin(t * 2.2);
    float n = fbm(normalize(p) * 2.6 + t * 0.25);
    float disp = (0.10 + 0.18 * uEnergy) * (0.25 + 0.75 * pulse) * (n - 0.45);
    p += normalize(p) * disp;
    vP = (modelMatrix * vec4(p, 1.0)).xyz;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(p, 1.0);
  }
`;

const CORE_FRAG = /* glsl */`
  precision highp float;
  uniform float uTime;
  uniform float uEnergy;
  uniform float uHueShiftSpeed;
  uniform vec3 uColorA;
  uniform vec3 uColorB;
  uniform vec3 uColorC;

  varying vec3 vN;
  varying vec3 vP;

  float hash13(vec3 p) {
    p = fract(p * 0.1031);
    p += dot(p, p.zyx + 31.32);
    return fract((p.x + p.y) * p.z);
  }

  float noise(vec3 p) {
    vec3 i = floor(p);
    vec3 f = fract(p);
    vec3 u = f * f * (3.0 - 2.0 * f);
    float n000 = hash13(i + vec3(0,0,0));
    float n100 = hash13(i + vec3(1,0,0));
    float n010 = hash13(i + vec3(0,1,0));
    float n110 = hash13(i + vec3(1,1,0));
    float n001 = hash13(i + vec3(0,0,1));
    float n101 = hash13(i + vec3(1,0,1));
    float n011 = hash13(i + vec3(0,1,1));
    float n111 = hash13(i + vec3(1,1,1));
    float nx00 = mix(n000, n100, u.x);
    float nx10 = mix(n010, n110, u.x);
    float nx01 = mix(n001, n101, u.x);
    float nx11 = mix(n011, n111, u.x);
    float nxy0 = mix(nx00, nx10, u.y);
    float nxy1 = mix(nx01, nx11, u.y);
    return mix(nxy0, nxy1, u.z);
  }

  float fbm(vec3 p) {
    float f = 0.0;
    float a = 0.5;
    for (int i = 0; i < 5; i++) {
      f += a * noise(p);
      p *= 2.02;
      a *= 0.5;
    }
    return f;
  }

  void main() {
    vec3 N = normalize(vN);
    vec3 V = normalize(cameraPosition - vP);
    float fres = pow(1.0 - max(0.0, dot(N, V)), 3.0);
    float t = uTime;
    float n = fbm(N * 3.2 + t * 0.35);
    float bands = abs(sin((n * 9.0 + t * 3.0) * 3.14159));
    float veins = smoothstep(0.80, 0.98, bands);
    float mixAB = smoothstep(0.20, 0.85, n);
    vec3 col = mix(uColorA, uColorB, mixAB);
    col += 0.12 * sin(vec3(0.0, 2.0, 4.0) + t * uHueShiftSpeed * 6.0);
    float energy = 0.55 + 0.65 * uEnergy;
    float glow = energy * (0.35 + 1.25 * fres) + veins * (1.2 + 1.4 * uEnergy);
    col += uColorC * veins * (0.6 + 1.2 * uEnergy);
    gl_FragColor = vec4(col * glow, 1.0);
  }
`;

const GLOBE_VERT = /* glsl */`
  varying vec3 vN;
  void main() {
    vN = normalize(normalMatrix * normal);
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`;

const GLOBE_FRAG = /* glsl */`
  precision highp float;
  uniform float uTime;
  uniform float uStrength;
  uniform vec3 uColor;
  varying vec3 vN;

  void main() {
    vec3 N = normalize(vN);
    float lon = atan(N.z, N.x);
    float lat = acos(clamp(N.y, -1.0, 1.0));
    float mer = abs(sin(lon * 12.0));
    float par = abs(sin(lat * 10.0));
    float grid = smoothstep(0.98, 1.0, mer) + smoothstep(0.985, 1.0, par);
    float scan = 0.55 + 0.45 * sin(uTime * 1.8 + lon * 4.0);
    float a = grid * scan * uStrength;
    gl_FragColor = vec4(uColor * a, a);
  }
`;

const NODE_VERT = /* glsl */`
  uniform float uTime;
  uniform float uBaseSize;
  uniform float uPulseSpeed;
  attribute float aIntensity;
  attribute float aSeed;
  varying float vIntensity;
  varying float vSeed;

  void main() {
    vIntensity = aIntensity;
    vSeed = aSeed;
    vec4 mv = modelViewMatrix * vec4(position, 1.0);
    float pulse = 0.6 + 0.4 * sin(uTime * uPulseSpeed * (1.2 + aIntensity * 1.8) + aSeed * 6.2831);
    float size = uBaseSize * (0.7 + 1.2 * aIntensity) * pulse;
    gl_PointSize = size * (1.0 / max(0.001, -mv.z));
    gl_Position = projectionMatrix * mv;
  }
`;

const NODE_FRAG = /* glsl */`
  precision highp float;
  uniform float uTime;
  uniform float uHueShiftSpeed;
  varying float vIntensity;
  varying float vSeed;

  vec3 palette(float x) {
    return 0.55 + 0.45 * sin(vec3(0.0, 2.0, 4.0) + x * 6.2831);
  }

  void main() {
    vec2 uv = gl_PointCoord * 2.0 - 1.0;
    float r = dot(uv, uv);
    float core = smoothstep(0.20, 0.00, r);
    float halo = smoothstep(1.00, 0.15, r);
    float t = uTime * uHueShiftSpeed + vSeed;
    vec3 col = palette(t);
    float a = (core * 1.0 + halo * 0.55) * (0.25 + 1.25 * vIntensity);
    gl_FragColor = vec4(col * a, a);
  }
`;

const DIGIT_VERT = /* glsl */`
  uniform float uTime;
  uniform float uBend;
  uniform float uBaseSize;
  uniform float uDigitRate;
  uniform float uPulseSpeed;

  attribute vec3 aStart;
  attribute vec3 aEnd;
  attribute float aSeed;
  attribute float aSpeed;
  attribute float aIntensity;
  attribute float aDigitBase;

  varying float vIntensity;
  varying float vDigit;
  varying float vAge;
  varying float vSeed;

  vec3 bezier2(vec3 a, vec3 b, vec3 c, float t) {
    vec3 ab = mix(a, b, t);
    vec3 bc = mix(b, c, t);
    return mix(ab, bc, t);
  }

  void main() {
    vIntensity = aIntensity;
    vSeed = aSeed;

    float t = fract(uTime * aSpeed + aSeed); 

    float fadeIn  = smoothstep(0.00, 0.08, t);
    float fadeOut = 1.0 - smoothstep(0.78, 1.00, t);
    float life = fadeIn * fadeOut;

    vec3 mid = (aStart + aEnd) * 0.5;
    vec3 axis = normalize(cross(normalize(aStart), vec3(0.0, 1.0, 0.0)) + 0.0001);
    float bend = uBend * (0.25 + 0.75 * sin(aSeed * 12.7) * 0.5 + 0.5);
    vec3 ctrl = mid + axis * bend;

    vec3 p = bezier2(aStart, ctrl, aEnd, t);
    float jitter = (0.015 + 0.03 * aIntensity) * sin(uTime * 18.0 + aSeed * 31.0);
    p += normalize(p + 0.001) * jitter;

    float d = mod(aDigitBase + floor(uTime * uDigitRate + aSeed * 10.0), 10.0);
    float pulse = 0.6 + 0.4 * sin(uTime * uPulseSpeed * (1.5 + aIntensity * 2.0) + aSeed * 6.2831);

    vec4 mv = modelViewMatrix * vec4(p, 1.0);
    float size = uBaseSize * (0.65 + 1.4 * aIntensity) * pulse * life;

    gl_PointSize = size * (1.0 / max(0.001, -mv.z));

    vDigit = d;
    vAge = life;

    gl_Position = projectionMatrix * mv;
  }
`;

const DIGIT_FRAG = /* glsl */`
  precision highp float;
  uniform float uTime;
  uniform float uHueShiftSpeed;
  uniform int uPaletteMode; 

  varying float vIntensity;
  varying float vDigit;
  varying float vAge;
  varying float vSeed;

  float sdBox(vec2 p, vec2 b) {
    vec2 d = abs(p) - b;
    return length(max(d, 0.0)) + min(max(d.x, d.y), 0.0);
  }

  float seg(vec2 uv, vec2 pos, vec2 size, float thickness) {
    float d = sdBox(uv - pos, size);
    return smoothstep(thickness, 0.0, d);
  }

  float segOn(float digit, int idx) {
    if (digit < 0.5) return (idx==6) ? 0.0 : 1.0;
    else if (digit < 1.5) return (idx==1 || idx==2) ? 1.0 : 0.0;
    else if (digit < 2.5) return (idx==0||idx==1||idx==6||idx==4||idx==3) ? 1.0 : 0.0;
    else if (digit < 3.5) return (idx==0||idx==1||idx==6||idx==2||idx==3) ? 1.0 : 0.0;
    else if (digit < 4.5) return (idx==5||idx==6||idx==1||idx==2) ? 1.0 : 0.0;
    else if (digit < 5.5) return (idx==0||idx==5||idx==6||idx==2||idx==3) ? 1.0 : 0.0;
    else if (digit < 6.5) return (idx==0||idx==5||idx==6||idx==2||idx==3||idx==4) ? 1.0 : 0.0;
    else if (digit < 7.5) return (idx==0||idx==1||idx==2) ? 1.0 : 0.0;
    else if (digit < 8.5) return 1.0;
    else return (idx==0||idx==1||idx==2||idx==3||idx==5||idx==6) ? 1.0 : 0.0;
  }

  vec3 paletteCyber(float x) { return 0.55 + 0.45 * sin(vec3(0.2, 2.2, 4.2) + x * 6.2831); }
  vec3 palettePlasma(float x) { return 0.55 + 0.45 * sin(vec3(1.0, 2.0, 3.0) + x * 6.2831); }
  vec3 paletteAmber(float x) {
    vec3 base = 0.55 + 0.45 * sin(vec3(0.0, 1.5, 3.0) + x * 6.2831);
    return vec3(base.r * 1.15, base.g * 1.05, base.b * 0.45);
  }

  void main() {
    vec2 uv = gl_PointCoord * 2.0 - 1.0;
    uv.x *= 0.75;
    float th = 0.08; 
    float a = 0.0;
    vec2 hSize = vec2(0.38, 0.08);
    vec2 vSize = vec2(0.08, 0.32);
    vec2 pTop = vec2(0.0,  0.62); vec2 pMid = vec2(0.0,  0.00); vec2 pBot = vec2(0.0, -0.62);
    vec2 pUR = vec2(0.46,  0.32); vec2 pLR = vec2(0.46, -0.32); vec2 pUL = vec2(-0.46, 0.32); vec2 pLL = vec2(-0.46,-0.32);

    float d = vDigit;
    a += segOn(d, 0) * seg(uv, pTop, hSize, th);
    a += segOn(d, 6) * seg(uv, pMid, hSize, th);
    a += segOn(d, 3) * seg(uv, pBot, hSize, th);
    a += segOn(d, 1) * seg(uv, pUR, vSize, th);
    a += segOn(d, 2) * seg(uv, pLR, vSize, th);
    a += segOn(d, 5) * seg(uv, pUL, vSize, th);
    a += segOn(d, 4) * seg(uv, pLL, vSize, th);

    float r = dot(uv, uv);
    float glow = smoothstep(1.2, 0.1, r);
    float t = uTime * uHueShiftSpeed + vSeed * 0.7;
    vec3 col;
    if (uPaletteMode == 0) col = paletteCyber(t);
    else if (uPaletteMode == 1) col = palettePlasma(t);
    else col = paletteAmber(t);

    float alpha = (a * 1.0 + glow * 0.35) * (0.25 + 1.35 * vIntensity) * vAge;
    vec3 outCol = col * (1.2 + 2.2 * a) * alpha;
    gl_FragColor = vec4(outCol, alpha);
  }
`;

const canvas = document.getElementById('c');
const renderer = new THREE.WebGLRenderer({
  canvas, antialias: false, alpha: false, depth: true, stencil: false, powerPreference: 'high-performance'
});
renderer.outputColorSpace = THREE.SRGBColorSpace;
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = params.exposure;

const scene = new THREE.Scene();
scene.background = new THREE.Color(0x04060a);
scene.fog = new THREE.FogExp2(0x04060a, 0.045);

const camera = new THREE.PerspectiveCamera(55, window.innerWidth/window.innerHeight, 0.1, 200);
camera.position.set(0, 2.5, 12.5);

const controls = new OrbitControls(camera, renderer.domElement);
controls.enableDamping = true;
controls.dampingFactor = 0.06;
controls.autoRotate = params.autoRotate;
controls.autoRotateSpeed = params.autoRotateSpeed;

scene.add(new THREE.AmbientLight(0xffffff, 0.12));
const keyLight = new THREE.PointLight(0xffffff, 1.4, 80);
keyLight.position.set(8, 10, 12);
scene.add(keyLight);

let coreMesh, globeMesh, nodePoints, digitPoints;
let coreMat, globeMat, nodeMat, digitMat;

function paletteToColors(mode) {
  if (mode === 'amber') return { A: new THREE.Color('#ffcc33'), B: new THREE.Color('#00ff88'), C: new THREE.Color('#ffffff'), globe: new THREE.Color('#ffcc33'), paletteMode: 2 };
  if (mode === 'plasma') return { A: new THREE.Color('#ff3bd4'), B: new THREE.Color('#ff7a18'), C: new THREE.Color('#ffffff'), globe: new THREE.Color('#ff3bd4'), paletteMode: 1 };
  return { A: new THREE.Color('#00e5ff'), B: new THREE.Color('#ff2bd6'), C: new THREE.Color('#ffffff'), globe: new THREE.Color('#00e5ff'), paletteMode: 0 };
}

function buildCore() {
  const geo = new THREE.IcosahedronGeometry(params.coreRadius, 6);
  const cols = paletteToColors(params.palette);
  coreMat = new THREE.ShaderMaterial({
    uniforms: { uTime: { value: 0 }, uEnergy: { value: params.energy }, uPulseSpeed: { value: params.pulseSpeed }, uHueShiftSpeed: { value: params.hueShiftSpeed }, uColorA: { value: cols.A.toArray().slice(0, 3) }, uColorB: { value: cols.B.toArray().slice(0, 3) }, uColorC: { value: cols.C.toArray().slice(0, 3) } },
    vertexShader: CORE_VERT, fragmentShader: CORE_FRAG
  });
  coreMesh = new THREE.Mesh(geo, coreMat);
  scene.add(coreMesh);
  const wire = new THREE.Mesh(new THREE.IcosahedronGeometry(params.coreRadius * 1.03, 2), new THREE.MeshBasicMaterial({ color: cols.A, wireframe: true, transparent: true, opacity: 0.18, blending: THREE.AdditiveBlending, depthWrite: false }));
  coreMesh.add(wire);
}

function buildGlobe() {
  const geo = new THREE.SphereGeometry(params.globeRadius * 0.92, 64, 48);
  const cols = paletteToColors(params.palette);
  globeMat = new THREE.ShaderMaterial({
    uniforms: { uTime: { value: 0 }, uStrength: { value: 0.9 }, uColor: { value: cols.globe.toArray().slice(0, 3) } },
    vertexShader: GLOBE_VERT, fragmentShader: GLOBE_FRAG, transparent: true, blending: THREE.AdditiveBlending, depthWrite: false
  });
  globeMesh = new THREE.Mesh(geo, globeMat);
  scene.add(globeMesh);
}

function buildNodesAndDigits() {
  const nodeCount = Math.floor(params.nodeCount);
  const streamsPerNode = Math.floor(params.streamsPerNode);
  const totalDigits = nodeCount * streamsPerNode;

  const nodePos = new Float32Array(nodeCount * 3);
  const nodeIntensity = new Float32Array(nodeCount);
  const nodeSeed = new Float32Array(nodeCount);

  for (let i = 0; i < nodeCount; i++) {
    const seed = i * 13.37; const dir = randomUnitVec(seed); const r = params.globeRadius;
    nodePos[i * 3 + 0] = dir.x * r; nodePos[i * 3 + 1] = dir.y * r; nodePos[i * 3 + 2] = dir.z * r;
    nodeIntensity[i] = 0.12 + 0.88 * Math.pow(hash11(seed + 2.0), 2.0); nodeSeed[i] = hash11(seed + 9.0);
  }

  const nodeGeo = new THREE.BufferGeometry();
  nodeGeo.setAttribute('position', new THREE.BufferAttribute(nodePos, 3));
  nodeGeo.setAttribute('aIntensity', new THREE.BufferAttribute(nodeIntensity, 1));
  nodeGeo.setAttribute('aSeed', new THREE.BufferAttribute(nodeSeed, 1));

  nodeMat = new THREE.ShaderMaterial({
    uniforms: { uTime: { value: 0 }, uBaseSize: { value: 22.0 }, uPulseSpeed: { value: params.pulseSpeed }, uHueShiftSpeed: { value: params.hueShiftSpeed } },
    vertexShader: NODE_VERT, fragmentShader: NODE_FRAG, transparent: true, blending: THREE.AdditiveBlending, depthWrite: false
  });
  nodePoints = new THREE.Points(nodeGeo, nodeMat);
  scene.add(nodePoints);

  const dummyPos = new Float32Array(totalDigits * 3);
  const aStart = new Float32Array(totalDigits * 3);
  const aEnd = new Float32Array(totalDigits * 3);
  const aSeed = new Float32Array(totalDigits);
  const aSpeed = new Float32Array(totalDigits);
  const aIntensity = new Float32Array(totalDigits);
  const aDigitBase = new Float32Array(totalDigits);

  for (let i = 0; i < totalDigits; i++) {
    const nodeId = Math.floor(i / streamsPerNode);
    const localId = i - nodeId * streamsPerNode;
    const sx = nodePos[nodeId * 3 + 0]; const sy = nodePos[nodeId * 3 + 1]; const sz = nodePos[nodeId * 3 + 2];
    const seed = (nodeId + 1) * 91.7 + localId * 7.11; const endDir = randomUnitVec(seed + 99.0);
    const endR = params.coreRadius * (0.15 + 0.75 * hash11(seed + 199.0));
    aStart[i * 3 + 0] = sx; aStart[i * 3 + 1] = sy; aStart[i * 3 + 2] = sz;
    aEnd[i * 3 + 0] = endDir.x * endR; aEnd[i * 3 + 1] = endDir.y * endR; aEnd[i * 3 + 2] = endDir.z * endR;
    aSeed[i] = hash11(seed + 1.0); const inten = nodeIntensity[nodeId]; aIntensity[i] = inten * (0.55 + 0.45 * hash11(seed + 4.0));
    aSpeed[i] = (0.25 + 1.35 * inten) * (0.35 + 0.65 * hash11(seed + 6.0)); aDigitBase[i] = Math.floor(hash11(seed + 8.0) * 10.0);
    dummyPos[i*3] = dummyPos[i*3+1] = dummyPos[i*3+2] = 0;
  }

  const digitGeo = new THREE.BufferGeometry();
  digitGeo.setAttribute('position', new THREE.BufferAttribute(dummyPos, 3));
  digitGeo.setAttribute('aStart', new THREE.BufferAttribute(aStart, 3));
  digitGeo.setAttribute('aEnd', new THREE.BufferAttribute(aEnd, 3));
  digitGeo.setAttribute('aSeed', new THREE.BufferAttribute(aSeed, 1));
  digitGeo.setAttribute('aSpeed', new THREE.BufferAttribute(aSpeed, 1));
  digitGeo.setAttribute('aIntensity', new THREE.BufferAttribute(aIntensity, 1));
  digitGeo.setAttribute('aDigitBase', new THREE.BufferAttribute(aDigitBase, 1));

  const cols = paletteToColors(params.palette);
  digitMat = new THREE.ShaderMaterial({
    uniforms: { uTime: { value: 0 }, uBend: { value: params.streamBend }, uBaseSize: { value: params.basePointSize }, uDigitRate: { value: params.digitRate }, uPulseSpeed: { value: params.pulseSpeed }, uHueShiftSpeed: { value: params.hueShiftSpeed }, uPaletteMode: { value: cols.paletteMode } },
    vertexShader: DIGIT_VERT, fragmentShader: DIGIT_FRAG, transparent: true, blending: THREE.AdditiveBlending, depthWrite: false
  });
  digitPoints = new THREE.Points(digitGeo, digitMat);
  scene.add(digitPoints);
}

function disposeObject3D(obj) {
  if (!obj) return;
  obj.traverse((o) => { if (o.geometry) o.geometry.dispose(); if (o.material) { if (Array.isArray(o.material)) o.material.forEach((m) => m.dispose()); else o.material.dispose(); } });
  if (obj.parent) obj.parent.remove(obj);
}

let composer, bloomPass, outputPass, fxaaPass, rgbShiftPass, afterimagePass;

function buildPost() {
  composer = new EffectComposer(renderer);
  composer.addPass(new RenderPass(scene, camera));
  bloomPass = new UnrealBloomPass(new THREE.Vector2(1, 1), params.bloomStrength, params.bloomRadius, params.bloomThreshold);
  composer.addPass(bloomPass);
  if (params.enableAfterimage) { afterimagePass = new AfterimagePass(params.afterimageDamp); composer.addPass(afterimagePass); }
  outputPass = new OutputPass(); composer.addPass(outputPass);
  fxaaPass = new FXAAPass(); composer.addPass(fxaaPass);
  if (params.enableRGBShift) { rgbShiftPass = new ShaderPass(RGBShiftShader); rgbShiftPass.uniforms.amount.value = params.rgbShiftAmount; composer.addPass(rgbShiftPass); }
}

function rebuildAll() {
  disposeObject3D(coreMesh); disposeObject3D(globeMesh); disposeObject3D(nodePoints); disposeObject3D(digitPoints);
  composer = null; buildCore(); buildGlobe(); buildNodesAndDigits(); buildPost(); resize();
}

function resize() {
  const w = window.innerWidth; const h = window.innerHeight;
  camera.aspect = w / h; camera.updateProjectionMatrix();
  const pr = clamp(window.devicePixelRatio, 1.0, params.maxPixelRatio) * params.renderScale;
  renderer.setPixelRatio(pr); renderer.setSize(w, h, false);
  if (composer) { composer.setPixelRatio(pr); composer.setSize(w, h); renderer.getDrawingBufferSize(new THREE.Vector2()); if (fxaaPass) fxaaPass.setSize(w * pr, h * pr); }
}

window.addEventListener('resize', resize);

const gui = new GUI(); gui.title('Global Data Core');
const fScene = gui.addFolder('Scene');
fScene.add(params, 'globeRadius', 3.0, 12.0, 0.1).onFinishChange(() => rebuildAll());
fScene.add(params, 'coreRadius', 0.6, 3.2, 0.01).onFinishChange(() => rebuildAll());
fScene.add(params, 'autoRotate').onChange((v) => (controls.autoRotate = v));
fScene.add(params, 'autoRotateSpeed', 0.0, 2.0, 0.01).onChange((v) => (controls.autoRotateSpeed = v));

const fData = gui.addFolder('Data / Flow');
fData.add(params, 'nodeCount', 40, 700, 1).onFinishChange(() => rebuildAll());
fData.add(params, 'streamsPerNode', 1, 60, 1).onFinishChange(() => rebuildAll());
fData.add(params, 'streamBend', 0.0, 6.0, 0.05).onChange((v) => { if (digitMat) digitMat.uniforms.uBend.value = v; });

const fEnergy = gui.addFolder('Energy / Color');
fEnergy.add(params, 'energy', 0.0, 2.5, 0.01).onChange((v) => { if (coreMat) coreMat.uniforms.uEnergy.value = v; });
fEnergy.add(params, 'pulseSpeed', 0.1, 4.0, 0.01).onChange((v) => { if (coreMat) coreMat.uniforms.uPulseSpeed.value = v; if (nodeMat) nodeMat.uniforms.uPulseSpeed.value = v; if (digitMat) digitMat.uniforms.uPulseSpeed.value = v; });
fEnergy.add(params, 'palette', ['cyber', 'plasma', 'amber']).onFinishChange(() => rebuildAll());
fEnergy.add(params, 'exposure', 0.5, 2.5, 0.01).onChange((v) => (renderer.toneMappingExposure = v));

const fPost = gui.addFolder('Post FX');
fPost.add(params, 'bloomStrength', 0.0, 3.0, 0.01).onChange((v) => bloomPass && (bloomPass.strength = v));
fPost.add(params, 'enableRGBShift').onFinishChange(() => rebuildAll());
fPost.add(params, 'enableAfterimage').onFinishChange(() => rebuildAll());
gui.add(params, 'rebuild');

let energyTarget = params.energy; let lastDataKick = 0;
function syntheticDataTick(timeSec) {
  if (timeSec - lastDataKick > 0.25) { lastDataKick = timeSec; const kick = 0.75 + 0.25 * Math.sin(timeSec * 2.0); energyTarget = clamp(params.energy * kick + 0.15 * (hash11(timeSec) - 0.5), 0.0, 2.5); }
  if (coreMat) coreMat.uniforms.uEnergy.value = coreMat.uniforms.uEnergy.value * 0.92 + energyTarget * 0.08;
}

function animate(ms) {
  const t = ms * 0.001; syntheticDataTick(t);
  if (coreMesh) { coreMesh.rotation.y = t * 0.35; coreMesh.rotation.x = Math.sin(t * 0.2) * 0.08; }
  if (globeMesh) globeMesh.rotation.y = t * 0.08;
  if (coreMat) coreMat.uniforms.uTime.value = t; if (globeMat) globeMat.uniforms.uTime.value = t; if (nodeMat) nodeMat.uniforms.uTime.value = t; if (digitMat) digitMat.uniforms.uTime.value = t;
  controls.update(); if (composer) composer.render(); else renderer.render(scene, camera);
  requestAnimationFrame(animate);
}

rebuildAll();
requestAnimationFrame(animate);
