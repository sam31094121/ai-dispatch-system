import React, { useEffect, useRef } from 'react';
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

/* ------------------------------------------------------------
 * 電漿與核心 Shaders (GLSL)
 * ------------------------------------------------------------ */
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
    float f = 0.0; float a = 0.5;
    for (int i = 0; i < 5; i++) { f += a * noise(p); p *= 2.02; a *= 0.5; }
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
    float f = 0.0; float a = 0.5;
    for (int i = 0; i < 5; i++) { f += a * noise(p); p *= 2.02; a *= 0.5; }
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

    // 💡 質感優化：注入微觀噪點模擬生物背光顆粒 (High-frequency fine grain)
    float noiseG = hash13(vP * 35.0 + t);
    col *= (0.84 + 0.16 * noiseG);
    float energy = 0.55 + 0.65 * uEnergy;
    float glow = energy * (0.35 + 1.25 * fres) + veins * (1.2 + 1.4 * uEnergy);
    col += uColorC * veins * (0.6 + 1.2 * uEnergy);
    gl_FragColor = vec4(col * glow, 1.0);
  }
`;

const GLOBE_VERT = /* glsl */`
  varying vec3 vN;
  void main() { vN = normalize(normalMatrix * normal); gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }
`;

const GLOBE_FRAG = /* glsl */`
  precision highp float;
  uniform float uTime;
  uniform float uStrength;
  uniform vec3 uColor;
  varying vec3 vN;
  void main() {
    vec3 N = normalize(vN);
    float lon = atan(N.z, N.x); float lat = acos(clamp(N.y, -1.0, 1.0));
    
    // 🧬 【生化線路】網格加入時間滾動與波動 (Scrolling Bio-circuits)
    float mer = abs(sin(lon * 12.0 + uTime * 0.7)); 
    float par = abs(sin(lat * 10.0 + sin(uTime * 0.4)));
    
    float grid = smoothstep(0.97, 1.0, mer) + smoothstep(0.975, 1.0, par);
    float scan = 0.55 + 0.45 * sin(uTime * 1.8 + lon * 4.0);
    gl_FragColor = vec4(uColor * grid * scan * uStrength, grid * scan * uStrength);
  }
`;

const SPARK_VERT = /* glsl */`
  uniform float uTime;
  uniform float uEnergy;
  attribute float aSeed;
  varying float vGlow;
  void main() {
    vec3 p = position;
    float t = uTime * 4.0 + aSeed * 100.0;
    
    // 🧬 【突觸爆發】在球體外殼微微抖動發光
    p += normalize(p) * (0.02 + 0.12 * aSeed * sin(t));
    
    float flash = 0.4 + 0.6 * sin(uTime * 25.0 * aSeed);
    vGlow = flash * (uEnergy - 0.2);
    
    gl_PointSize = 4.2 * flash * (0.5 + 0.5 * uEnergy);
    gl_Position = projectionMatrix * modelViewMatrix * vec4(p, 1.0);
  }
`;

const SPARK_FRAG = /* glsl */`
  precision highp float;
  varying float vGlow;
  void main() {
    if (length(gl_PointCoord * 2.0 - 1.0) > 1.0) discard;
    vec3 colSynapse = mix(vec3(0.0, 1.0, 1.0), vec3(0.8, 0.0, 1.0), 0.5); 
    gl_FragColor = vec4(colSynapse * (1.1 + vGlow), vGlow * 0.9);
  }
`;

const DIGIT_VERT = /* glsl */`
  uniform float uTime;
  uniform float uBend;
  uniform float uBaseSize;
  uniform float uDigitRate;
  uniform float uPulseSpeed;
  uniform float uEnergy;

  attribute vec3 aStart; attribute vec3 aEnd; attribute float aSeed;
  attribute float aSpeed; attribute float aIntensity; attribute float aDigitBase;

  varying float vIntensity; varying float vDigit; varying float vAge; varying float vSeed;

  vec3 bezier2(vec3 a, vec3 b, vec3 c, float t) { vec3 ab = mix(a, b, t); vec3 bc = mix(b, c, t); return mix(ab, bc, t); }

  void main() {
    vIntensity = aIntensity; vSeed = aSeed; float t = fract(uTime * aSpeed + aSeed); 
    float life = smoothstep(0.00, 0.08, t) * (1.0 - smoothstep(0.75, 1.00, t));
    vec3 mid = (aStart + aEnd) * 0.5; vec3 axis = normalize(cross(normalize(aStart), vec3(0.0, 1.0, 0.0)) + 0.0001);
    vec3 ctrl = mid + axis * uBend * (0.25 + 0.75 * sin(aSeed * 12.7) * 0.5 + 0.5);
    vec3 p = bezier2(aStart, ctrl, aEnd, t) + normalize(bezier2(aStart, ctrl, aEnd, t) + 0.001) * (0.015 + 0.03 * aIntensity) * sin(uTime * 18.0 + aSeed * 31.0);

    float d = mod(aDigitBase + floor(uTime * uDigitRate + aSeed * 10.0), 10.0);

    // 🧬 【分裂生長】細胞分裂分支視覺算法
    float splitThreshold = 0.35; // 運作 35% 後開始分裂
    if (t > splitThreshold) {
       float splitFactor = smoothstep(splitThreshold, splitThreshold + 0.15, t);
       float side = sign(cos(aSeed * 543.21)); // 左右隨機分流
       vec3 splitDir = normalize(cross(ctrl - aStart, axis)); 
       // 粒子路徑向兩端分流，模擬細胞分裂與分岔血管
       p += splitDir * side * 0.18 * splitFactor * sin((t - splitThreshold) * 3.14159);
    }

    // 🫀 【泵送波浪】模擬微血管壁擠壓泵流 (Arterial Pulse Surge)
    float distToCenter = length(p);
    float pump = sin(distToCenter * 15.0 - uTime * 6.5 + aSeed); 
    p += normalize(p) * pump * 0.035 * (uEnergy - 0.4);

    float pulse = 0.6 + 0.4 * sin(uTime * uPulseSpeed * (1.5 + aIntensity * 2.0) + aSeed * 6.2831);
    float energyScale = 1.0 + (uEnergy - 1.2) * 1.6;
    
    vec4 mv = modelViewMatrix * vec4(p, 1.0);
    gl_PointSize = uBaseSize * energyScale * (0.65 + 1.6 * aIntensity) * pulse * life * (1.0 / max(0.001, -mv.z));
    vDigit = d; vAge = life; gl_Position = projectionMatrix * mv;
  }
`;

const DIGIT_FRAG = /* glsl */`
  precision highp float;
  uniform float uTime; uniform float uHueShiftSpeed; uniform float uEnergy;
  varying float vIntensity; varying float vDigit; varying float vAge; varying float vSeed;

  float sdBox(vec2 p, vec2 b) { vec2 d = abs(p) - b; return length(max(d, 0.0)) + min(max(d.x, d.y), 0.0); }
  float seg(vec2 uv, vec2 pos, vec2 size, float thickness) { return smoothstep(thickness, 0.0, sdBox(uv - pos, size)); }
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

  void main() {
    float dist = length(gl_PointCoord * 2.0 - 1.0);
    if (dist > 1.0) discard;

    vec2 uv = gl_PointCoord * 2.0 - 1.0; uv.x *= 0.75; float a = 0.0;
    vec2 hSize = vec2(0.38, 0.08); vec2 vSize = vec2(0.08, 0.32);
    a += segOn(vDigit, 0) * seg(uv, vec2(0,  0.62), hSize, 0.08);
    a += segOn(vDigit, 6) * seg(uv, vec2(0,  0.00), hSize, 0.08);
    a += segOn(vDigit, 3) * seg(uv, vec2(0, -0.62), hSize, 0.08);
    a += segOn(vDigit, 1) * seg(uv, vec2(0.46,  0.32), vSize, 0.08);
    a += segOn(vDigit, 2) * seg(uv, vec2(0.46, -0.32), vSize, 0.08);
    a += segOn(vDigit, 5) * seg(uv, vec2(-0.46, 0.32), vSize, 0.08);
    a += segOn(vDigit, 4) * seg(uv, vec2(-0.46,-0.32), vSize, 0.08);

    // 🩸 【熱血流】色彩漸層配方 (Capillary Neon Crimson + Gold)
    vec3 colBlood = mix(vec3(1.0, 0.02, 0.18), vec3(1.0, 0.72, 0.0), fract(vSeed * 3.5));
    vec3 colGlow = mix(colBlood, vec3(1.0), smoothstep(1.5, 2.4, uEnergy));

    float alpha = (a + smoothstep(1.2, 0.1, dot(uv, uv)) * 0.35) * (0.35 + 1.25 * vIntensity) * vAge;
    gl_FragColor = vec4(colGlow * (1.1 + 2.5 * a) * alpha, alpha);
  }
`;

/* 🌐 GPS to 3D Sphere Vector3 Conversion helper */
const latLongToVector3 = (lat: number, lon: number, radius: number) => {
  const phi = (90 - lat) * (Math.PI / 180);
  const theta = (lon + 180) * (Math.PI / 180);
  const x = -((radius) * Math.sin(phi) * Math.cos(theta));
  const z = ((radius) * Math.sin(phi) * Math.sin(theta));
  const y = ((radius) * Math.cos(phi));
  return new THREE.Vector3(x, y, z);
};

const CITY_NODES = [
  { name: 'Tokyo', lat: 35.6762, lon: 139.6503, color: '#00e5ff' },
  { name: 'London', lat: 51.5074, lon: -0.1278, color: '#7c4dff' },
  { name: 'New York', lat: 40.7128, lon: -74.0060, color: '#00ffa0' },
  { name: 'Paris', lat: 48.8566, lon: 2.3522, color: '#ff6ec7' },
  { name: 'Sydney', lat: -33.8688, lon: 151.2093, color: '#ffd700' },
  { name: 'Shanghai', lat: 31.2304, lon: 121.4737, color: '#00e5ff' },
];

export default function ThreeDataCore({ liveMetric = 0 }: { liveMetric?: number }) {
  const mountRef = useRef<HTMLDivElement>(null);
  const coreMatRef = useRef<THREE.ShaderMaterial | null>(null);

  // 📈 當外部數據 (liveMetric) 變化時，灌注一波爆發能量「電流衝擊」到 Shader
  useEffect(() => {
    if (coreMatRef.current) {
      // 瞬間拉高能量閾值，隨後在 animate 主線程常規連續衰減
      coreMatRef.current.uniforms.uEnergy.value = Math.min(2.4, coreMatRef.current.uniforms.uEnergy.value + 0.22);
    }
  }, [liveMetric]);

  useEffect(() => {
    if (!mountRef.current) return;

    const width = 420;
    const height = 420;

    const renderer = new THREE.WebGLRenderer({ antialias: false, alpha: true });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    mountRef.current.appendChild(renderer.domElement);

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(50, width / height, 0.1, 100);
    camera.position.set(0, 0.5, 9.0); // 調整相機視野對齊

    const composer = new EffectComposer(renderer);
    composer.addPass(new RenderPass(scene, camera));

    // 發光疊加 UnrealBloom
    // 💡 飽和度優化：顯著增幅發光強度，原色更鮮艷強烈
    const bloomPass = new UnrealBloomPass(new THREE.Vector2(width, height), 2.5, 0.45, 0.04);
    // ✨ 拖尾與數據熱血流體連續化 (Fluid Continuous Trails)
    const afterimagePass = new AfterimagePass(0.82);
    composer.addPass(afterimagePass);
    composer.addPass(bloomPass); // 🟢 載入發光增益 (Bloom Pass)
    composer.addPass(new OutputPass());

    // 1. 核心 Core
    const coreGeo = new THREE.IcosahedronGeometry(1.2, 5);
    const coreMat = new THREE.ShaderMaterial({
      uniforms: {
        uTime: { value: 0 }, uEnergy: { value: 1.2 }, uPulseSpeed: { value: 1.5 }, uHueShiftSpeed: { value: 0.12 },
        uColorA: { value: [0.0, 0.89, 1.0] }, uColorB: { value: [1.0, 0.16, 0.83] }, uColorC: { value: [1.0, 1.0, 1.0] }
      },
      vertexShader: CORE_VERT, fragmentShader: CORE_FRAG, transparent: true
    });
    const coreMesh = new THREE.Mesh(coreGeo, coreMat);
    scene.add(coreMesh);

    // 🧬 7. 能量圖騰 (Central Energy Totem / Wireframe TorusKnot)
    const totemGeo = new THREE.TorusKnotGeometry(0.75, 0.18, 120, 16);
    const totemMat = new THREE.MeshBasicMaterial({
      color: '#00ffd0', transparent: true, opacity: 0.45,
      wireframe: true, blending: THREE.AdditiveBlending, depthWrite: false
    });
    const totemMesh = new THREE.Mesh(totemGeo, totemMat);
    scene.add(totemMesh);

    // 保存引用供外部 useEffect / 幀動畫讀取
    coreMatRef.current = coreMat;

    // 2. 球殼 Globe (點矩陣/經緯細線)
    const globeMat = new THREE.ShaderMaterial({
      uniforms: { uTime: { value: 0 }, uStrength: { value: 0.6 }, uColor: { value: [0.0, 0.5, 1.0] } },
      vertexShader: GLOBE_VERT, fragmentShader: GLOBE_FRAG, transparent: true, blending: THREE.AdditiveBlending, depthWrite: false
    });
    const globeMesh = new THREE.Mesh(new THREE.SphereGeometry(2.2, 32, 24), globeMat); // 縮減球殼尺寸適配
    scene.add(globeMesh);

    // 3. 粒子數字 Digit Streams
    const count = 3000;
    const aStart = new Float32Array(count * 3); const aEnd = new Float32Array(count * 3);
    const aSeed = new Float32Array(count); const aSpeed = new Float32Array(count);
    const aIntensity = new Float32Array(count); const aDigitBase = new Float32Array(count);

    for (let i = 0; i < count; i++) {
        const theta = Math.random() * Math.PI * 2; const phi = Math.acos(Math.random() * 2 - 1);
        const sx = 2.2 * Math.sin(phi) * Math.cos(theta);
        const sy = 2.2 * Math.sin(phi) * Math.sin(theta);
        const sz = 2.2 * Math.cos(phi);
        aStart[i * 3 + 0] = sx; aStart[i * 3 + 1] = sy; aStart[i * 3 + 2] = sz;

        const endR = 0.5 + Math.random() * 0.8;
        aEnd[i * 3 + 0] = sx * 0.1; aEnd[i * 3 + 1] = sy * 0.1; aEnd[i * 3 + 2] = sz * 0.1;

        aSeed[i] = Math.random(); aSpeed[i] = 0.4 + Math.random() * 0.8;
        aIntensity[i] = Math.random(); aDigitBase[i] = Math.floor(Math.random() * 10);
    }

    const digitGeo = new THREE.BufferGeometry();
    digitGeo.setAttribute('position', new THREE.BufferAttribute(new Float32Array(count * 3), 3));
    digitGeo.setAttribute('aStart', new THREE.BufferAttribute(aStart, 3));
    digitGeo.setAttribute('aEnd', new THREE.BufferAttribute(aEnd, 3));
    digitGeo.setAttribute('aSeed', new THREE.BufferAttribute(aSeed, 1));
    digitGeo.setAttribute('aSpeed', new THREE.BufferAttribute(aSpeed, 1));
    digitGeo.setAttribute('aIntensity', new THREE.BufferAttribute(aIntensity, 1));
    digitGeo.setAttribute('aDigitBase', new THREE.BufferAttribute(aDigitBase, 1));

    const digitMat = new THREE.ShaderMaterial({
      uniforms: { 
        uTime: { value: 0 }, uBend: { value: 2.5 }, uBaseSize: { value: 26.0 }, 
        uDigitRate: { value: 12.0 }, uPulseSpeed: { value: 1.0 }, 
        uHueShiftSpeed: { value: 0.1 }, uPaletteMode: { value: 0 },
        uEnergy: { value: 1.2 } 
      },
      vertexShader: DIGIT_VERT, fragmentShader: DIGIT_FRAG, transparent: true, blending: THREE.AdditiveBlending, depthWrite: false
    });
    const digitPoints = new THREE.Points(digitGeo, digitMat);
    scene.add(digitPoints);

    // 🔬 4. 新增神經突觸火花 Neural Synaptic Sparks
    const sparkCount = 600;
    const sparkPos = new Float32Array(sparkCount * 3);
    const sparkSeed = new Float32Array(sparkCount);
    for (let i = 0; i < sparkCount; i++) {
        const theta = Math.random() * Math.PI * 2; const phi = Math.acos(Math.random() * 2 - 1);
        const r = 2.22 + Math.random() * 0.08;
        sparkPos[i * 3] = r * Math.sin(phi) * Math.cos(theta);
        sparkPos[i * 3 + 1] = r * Math.sin(phi) * Math.sin(theta);
        sparkPos[i * 3 + 2] = r * Math.cos(phi);
        sparkSeed[i] = Math.random();
    }
    const sparkGeo = new THREE.BufferGeometry();
    sparkGeo.setAttribute('position', new THREE.BufferAttribute(sparkPos, 3));
    sparkGeo.setAttribute('aSeed', new THREE.BufferAttribute(sparkSeed, 1));
    const sparkMat = new THREE.ShaderMaterial({
      uniforms: { uTime: { value: 0 }, uEnergy: { value: 1.2 } },
      vertexShader: SPARK_VERT, fragmentShader: SPARK_FRAG, transparent: true, blending: THREE.AdditiveBlending, depthWrite: false
    });
    const sparkPoints = new THREE.Points(sparkGeo, sparkMat);
    scene.add(sparkPoints);
    // 🔴 產生圓形紋理，防範預設的「四方形粒子」質感
    const circleTexture = (() => {
      const canvas = document.createElement('canvas');
      canvas.width = 16; canvas.height = 16;
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.beginPath(); ctx.arc(8, 8, 8, 0, Math.PI * 2);
        ctx.fillStyle = '#ffffff'; ctx.fill();
      }
      return new THREE.CanvasTexture(canvas);
    })();

    const orbits: THREE.Points[] = [];
    const colors = ['#00e5ff', '#ff3bd4', '#ffffff'];

    // 🛰️ 5. 實體 3D 弧線飛線 (Arc Connections representing Global Data)
    const arcPoints: THREE.Points[] = [];
    CITY_NODES.forEach((startCity, i) => {
      const endCity = CITY_NODES[(i + 1) % CITY_NODES.length]; // 環狀相連
      const p1 = latLongToVector3(startCity.lat, startCity.lon, 2.2);
      const p2 = latLongToVector3(endCity.lat, endCity.lon, 2.2);

      const mid = new THREE.Vector3().addVectors(p1, p2).multiplyScalar(0.5);
      const dist = p1.distanceTo(p2);
      const normal = mid.clone().normalize();
      const ctrl = mid.clone().add(normal.multiplyScalar(dist * 0.4 + 0.3)); // 拋物高度

      const curve = new THREE.QuadraticBezierCurve3(p1, ctrl, p2);
      const points = curve.getPoints(60); // 取 60 個點繪製細膩弧線
      const positions = new Float32Array(points.length * 3);
      
      points.forEach((p: THREE.Vector3, idx: number) => {
        positions[idx * 3] = p.x; positions[idx * 3 + 1] = p.y; positions[idx * 3 + 2] = p.z;
      });

      const arcGeo = new THREE.BufferGeometry().setAttribute('position', new THREE.BufferAttribute(positions, 3));
      const arcMat = new THREE.PointsMaterial({
        color: startCity.color, size: 2.8, transparent: true, opacity: 0.85,
        depthWrite: false, blending: THREE.AdditiveBlending, map: circleTexture
      });

      const arcPts = new THREE.Points(arcGeo, arcMat);
      scene.add(arcPts); arcPoints.push(arcPts);
    });


    for (let j = 0; j < 3; j++) {
      const ringCount = 180; const ringPos = new Float32Array(ringCount * 3);
      const radius = 2.7 + j * 0.35;
      for (let i = 0; i < ringCount; i++) {
        const phi = (i / ringCount) * Math.PI * 2;
        if (j === 1) { // 🧬 DNA Helix Conduits (雙螺旋大數據導管)
          const wave = Math.sin(phi * 8.0); // 傳導波動頻率
          const offset = (i % 2 === 0) ? 0.24 : -0.24; // 雙鏈相位差
          ringPos[i*3] = Math.cos(phi) * (radius + offset * wave * 0.15); 
          ringPos[i*3+1] = offset * wave; 
          ringPos[i*3+2] = Math.sin(phi) * (radius + offset * wave * 0.15);
        } else {
          ringPos[i*3] = Math.cos(phi) * radius; 
          ringPos[i*3+1] = Math.sin(phi * 2.0) * 0.15; 
          ringPos[i*3+2] = Math.sin(phi) * radius;
        }
      }
      const ringGeo = new THREE.BufferGeometry(); ringGeo.setAttribute('position', new THREE.BufferAttribute(ringPos, 3));
      
      const ringMat = new THREE.PointsMaterial({ 
        color: colors[j % 3], 
        size: 2.8, 
        map: circleTexture, // 套用圓形紋理遮罩
        transparent: true, 
        opacity: 0.5 - j*0.1, 
        blending: THREE.AdditiveBlending,
        depthWrite: false
      });
      const ringPts = new THREE.Points(ringGeo, ringMat);
      ringPts.rotation.x = j * 0.32; ringPts.rotation.z = j * 0.15;
      scene.add(ringPts); orbits.push(ringPts);
    }

    // 📡 6. 電波立體構造 (Volumetric expanding shockwaves)
    const waveCount = 3;
    const waves: THREE.Mesh[] = [];
    const waveGeo = new THREE.SphereGeometry(2.1, 32, 16); 

    for (let i = 0; i < waveCount; i++) {
       const wMat = new THREE.MeshBasicMaterial({
         color: ['#00ffd0', '#00e5ff', '#aaffee'][i % 3], 
         transparent: true, opacity: 0.15,
         blending: THREE.AdditiveBlending, depthWrite: false, side: THREE.DoubleSide,
         wireframe: true // 💡 網格化讓電波看起來更具立體傳播震盪質感
       });
       const wave = new THREE.Mesh(waveGeo, wMat);
       wave.scale.setScalar(1.0 + i * 0.4);
       scene.add(wave); waves.push(wave);
    }

    const clock = new THREE.Clock();
    let animationId: number; 
    
    function animate() {
      const t = clock.getElapsedTime() * 1.5; // 🚀 視覺加速優化：提升動態節奏與電波旋轉頻率
      const currentEnergy = coreMatRef.current ? coreMatRef.current.uniforms.uEnergy.value : 1.2;

      // 🎥 1. 相機微幅呼吸擺動 (Camera Breathing)，使整個場景「活起來」
      camera.position.x = Math.sin(t * 0.4) * 0.15;
      camera.position.y = 0.5 + Math.cos(t * 0.3) * 0.12;
      camera.lookAt(0, 0.3, 0);

      if (coreMatRef.current) { coreMatRef.current.uniforms.uTime.value = t; coreMatRef.current.uniforms.uEnergy.value = coreMatRef.current.uniforms.uEnergy.value * 0.92 + 1.2 * 0.08; }
      if (globeMat) globeMat.uniforms.uTime.value = t;
      if (digitMat) {
         digitMat.uniforms.uTime.value = t;
         digitMat.uniforms.uEnergy.value = currentEnergy; // 🟢 能量傳遞與核心同步！
      }
      if (sparkMat) {
         sparkMat.uniforms.uTime.value = t;
         sparkMat.uniforms.uEnergy.value = currentEnergy; // 🟢 突觸同步爆發！
      }
      // 🫀 【心臟復活/覺醒心跳演算】Arrhythmia Cycle
      const cycle = t % 10.0;
      let pulse = 0.0;
      if (cycle < 2.0) {
         pulse = Math.sin(t * 1.0) * 0.03; // 🤫 【休息期】：微弱呼吸
      } else if (cycle < 4.5) {
         const localT = (cycle - 2.0) * Math.PI * 4.0; 
         pulse = Math.max(0.0, Math.sin(localT)) * 0.22; // 🔬 【甦醒期】：重擊心跳 (Lubb-Dupp)
      } else {
         pulse = Math.sin(t * 3.5) * 0.09; // 🔥 【全面爆發期】：急速連續脈衝
      }

      if (coreMesh) {
         coreMesh.rotation.y = t * 0.4;
         const coreScale = 1.0 + pulse * currentEnergy;
         coreMesh.scale.setScalar(coreScale);
      }

      if (totemMesh) {
         // 🧬 能量圖騰向相反方向旋轉，交織出複雜的維度動能
         totemMesh.rotation.y = -t * 0.8;
         totemMesh.rotation.z = t * 0.35;
         const totemScale = 1.0 + pulse * 0.5 * currentEnergy;
         totemMesh.scale.setScalar(totemScale);
      }
      if (globeMesh) {
         globeMesh.rotation.y = t * 0.15;
         const globeScale = 1.0 + Math.sin(t * 1.5) * 0.04 * currentEnergy;
         globeMesh.scale.setScalar(globeScale);
      }

        // 🛰️ 5. 動態旋轉 3D 弧線飛線 (Arc Connections Rotation)
        if (arcPoints && arcPoints.length > 0) {
          arcPoints.forEach((arc) => {
            arc.rotation.y = t * 0.15; // 與外球殼同步慢速旋轉
          });
        }
      
      // 🛰️ 2. 外環軌道搖擺與呼吸 (Orbit Swing & Breathe)
      orbits.forEach((o, idx) => { 
        o.rotation.y = t * (0.1 + idx * 0.05); 
        o.rotation.x = idx * 0.32 + Math.sin(t * 0.5 + idx) * 0.12; 
        const pulseRatio = 1.0 + Math.sin(t * 1.5 + idx) * 0.04 * currentEnergy;
        o.scale.setScalar(pulseRatio);
      });

      // 📡 6. 電波膨脹立體構造動畫 (Expanding waves animation)
      if (waves && waves.length > 0) {
        waves.forEach((w, idx) => {
          let scale = w.scale.x + 0.006 * (1.0 + idx * 0.3); // 內圈慢、外圈快擴張
          if (scale > 3.0) scale = 0.9 + Math.random() * 0.1; // 超出範圍則重置收縮回來
          w.scale.setScalar(scale);
          
          const alpha = Math.max(0, 1.0 - (scale - 0.9) / 2.1) * 0.16 * currentEnergy;
          (w.material as THREE.MeshBasicMaterial).opacity = alpha;
          w.rotation.y = t * (0.08 + idx * 0.04);
        });
      }

      // 🛸 3. 核心大視窗心跳光暈 (Bloom Throbbing) 連動呼吸
      if (bloomPass) {
         bloomPass.strength = 1.35 + Math.sin(t * 1.5) * 0.25 * currentEnergy;
      }
      
      composer.render();
      animationId = requestAnimationFrame(animate);
    }
    animate();

    return () => {
      cancelAnimationFrame(animationId); // 🟢 釋放每幀循環，防止內存洩漏
      renderer.dispose();
      composer.dispose();
      mountRef.current?.removeChild(renderer.domElement);
    };
  }, []);

  return <div ref={mountRef} className="w-[420px] h-[420px] relative pointer-events-none" style={{ filter: 'drop-shadow(0 0 50px rgba(0, 229, 255, 0.3))' }} />;
}
