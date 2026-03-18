// ==========================================
// 全球大數據核心 — Three.js + GLSL WebGL
// 能量核心 · 全球球殼 · 數字電流粒子
// ==========================================
import { useEffect, useRef } from 'react';
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { EffectComposer } from 'three/examples/jsm/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/examples/jsm/postprocessing/RenderPass.js';
import { UnrealBloomPass } from 'three/examples/jsm/postprocessing/UnrealBloomPass.js';
import { OutputPass } from 'three/examples/jsm/postprocessing/OutputPass.js';
import { ShaderPass } from 'three/examples/jsm/postprocessing/ShaderPass.js';
import { RGBShiftShader } from 'three/examples/jsm/shaders/RGBShiftShader.js';

// ── GLSL ──────────────────────────────────────────

const CORE_VERT = /* glsl */`
  uniform float uTime; uniform float uEnergy; uniform float uPulseSpeed;
  varying vec3 vN; varying vec3 vP;

  float hash13(vec3 p) { p=fract(p*0.1031); p+=dot(p,p.zyx+31.32); return fract((p.x+p.y)*p.z); }

  float noise(vec3 p) {
    vec3 i=floor(p),f=fract(p),u=f*f*(3.0-2.0*f);
    float n000=hash13(i+vec3(0,0,0)),n100=hash13(i+vec3(1,0,0)),n010=hash13(i+vec3(0,1,0)),n110=hash13(i+vec3(1,1,0));
    float n001=hash13(i+vec3(0,0,1)),n101=hash13(i+vec3(1,0,1)),n011=hash13(i+vec3(0,1,1)),n111=hash13(i+vec3(1,1,1));
    return mix(mix(mix(n000,n100,u.x),mix(n010,n110,u.x),u.y),mix(mix(n001,n101,u.x),mix(n011,n111,u.x),u.y),u.z);
  }

  float fbm(vec3 p){ float f=0.0,a=0.5; for(int i=0;i<5;i++){f+=a*noise(p);p*=2.02;a*=0.5;} return f; }

  void main() {
    vN = normalize(normalMatrix * normal);
    vec3 p = position; float t = uTime * uPulseSpeed;
    float pulse = 0.5 + 0.5 * sin(t * 2.2);
    float n = fbm(normalize(p) * 2.6 + t * 0.25);
    float disp = (0.10 + 0.18 * uEnergy) * (0.25 + 0.75 * pulse) * (n - 0.45);
    p += normalize(p) * disp;
    vP = (modelMatrix * vec4(p,1.0)).xyz;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(p,1.0);
  }
`;

const CORE_FRAG = /* glsl */`
  precision highp float;
  uniform float uTime; uniform float uEnergy; uniform float uHueShiftSpeed;
  uniform vec3 uColorA; uniform vec3 uColorB; uniform vec3 uColorC;
  varying vec3 vN; varying vec3 vP;

  float hash13(vec3 p){ p=fract(p*0.1031); p+=dot(p,p.zyx+31.32); return fract((p.x+p.y)*p.z); }
  float noise(vec3 p){ vec3 i=floor(p),f=fract(p),u=f*f*(3.0-2.0*f); float n000=hash13(i+vec3(0,0,0)),n100=hash13(i+vec3(1,0,0)),n010=hash13(i+vec3(0,1,0)),n110=hash13(i+vec3(1,1,0)),n001=hash13(i+vec3(0,0,1)),n101=hash13(i+vec3(1,0,1)),n011=hash13(i+vec3(0,1,1)),n111=hash13(i+vec3(1,1,1)); return mix(mix(mix(n000,n100,u.x),mix(n010,n110,u.x),u.y),mix(mix(n001,n101,u.x),mix(n011,n111,u.x),u.y),u.z); }
  float fbm(vec3 p){ float f=0.0,a=0.5; for(int i=0;i<5;i++){f+=a*noise(p);p*=2.02;a*=0.5;} return f; }

  void main() {
    vec3 N=normalize(vN), V=normalize(cameraPosition-vP);
    float fres = pow(1.0-max(0.0,dot(N,V)),3.0);
    float n=fbm(N*3.2+uTime*0.35);
    float veins=smoothstep(0.80,0.98,abs(sin((n*9.0+uTime*3.0)*3.14159)));
    vec3 col=mix(uColorA,uColorB,smoothstep(0.20,0.85,n));
    col += 0.12*sin(vec3(0.0,2.0,4.0)+uTime*uHueShiftSpeed*6.0);
    float energy=0.55+0.65*uEnergy;
    float glow=energy*(0.35+1.25*fres)+veins*(1.2+1.4*uEnergy);
    col += uColorC*veins*(0.6+1.2*uEnergy);
    gl_FragColor = vec4(col*glow,1.0);
  }
`;

const GLOBE_VERT = /* glsl */`varying vec3 vN; void main(){ vN=normalize(normalMatrix*normal); gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.0); }`;

const GLOBE_FRAG = /* glsl */`
  precision highp float;
  uniform float uTime; uniform float uStrength; uniform vec3 uColor;
  varying vec3 vN;
  void main(){
    vec3 N=normalize(vN);
    float lon=atan(N.z,N.x), lat=acos(clamp(N.y,-1.0,1.0));
    float grid=smoothstep(0.98,1.0,abs(sin(lon*12.0)))+smoothstep(0.985,1.0,abs(sin(lat*10.0)));
    float a=grid*(0.55+0.45*sin(uTime*1.8+lon*4.0))*uStrength;
    gl_FragColor=vec4(uColor*a,a);
  }
`;

const NODE_VERT = /* glsl */`
  uniform float uTime; uniform float uBaseSize; uniform float uPulseSpeed;
  attribute float aIntensity; attribute float aSeed;
  varying float vIntensity; varying float vSeed;
  void main(){
    vIntensity=aIntensity; vSeed=aSeed;
    vec4 mv=modelViewMatrix*vec4(position,1.0);
    float pulse=0.6+0.4*sin(uTime*uPulseSpeed*(1.2+aIntensity*1.8)+aSeed*6.2831);
    gl_PointSize=uBaseSize*(0.7+1.2*aIntensity)*pulse*(1.0/max(0.001,-mv.z));
    gl_Position=projectionMatrix*mv;
  }
`;

const NODE_FRAG = /* glsl */`
  precision highp float;
  uniform float uTime; uniform float uHueShiftSpeed;
  varying float vIntensity; varying float vSeed;
  vec3 pal(float x){ return 0.55+0.45*sin(vec3(0.0,2.0,4.0)+x*6.2831); }
  void main(){
    vec2 uv=gl_PointCoord*2.0-1.0; float r=dot(uv,uv);
    float a=(smoothstep(0.20,0.00,r)+smoothstep(1.00,0.15,r)*0.55)*(0.25+1.25*vIntensity);
    gl_FragColor=vec4(pal(uTime*uHueShiftSpeed+vSeed)*a,a);
  }
`;

const DIGIT_VERT = /* glsl */`
  uniform float uTime; uniform float uBend; uniform float uBaseSize;
  uniform float uDigitRate; uniform float uPulseSpeed;
  attribute vec3 aStart; attribute vec3 aEnd;
  attribute float aSeed; attribute float aSpeed; attribute float aIntensity; attribute float aDigitBase;
  varying float vIntensity; varying float vDigit; varying float vAge; varying float vSeed;

  vec3 bez2(vec3 a,vec3 b,vec3 c,float t){ return mix(mix(a,b,t),mix(b,c,t),t); }

  void main(){
    vIntensity=aIntensity; vSeed=aSeed;
    float t=fract(uTime*aSpeed+aSeed);
    float life=smoothstep(0.00,0.08,t)*(1.0-smoothstep(0.78,1.00,t));
    vec3 mid=(aStart+aEnd)*0.5;
    vec3 axis=normalize(cross(normalize(aStart),vec3(0.0,1.0,0.0))+0.0001);
    vec3 ctrl=mid+axis*uBend*(0.25+0.75*(sin(aSeed*12.7)*0.5+0.5));
    vec3 p=bez2(aStart,ctrl,aEnd,t);
    p+=normalize(p+0.001)*(0.015+0.03*aIntensity)*sin(uTime*18.0+aSeed*31.0);
    vDigit=mod(aDigitBase+floor(uTime*uDigitRate+aSeed*10.0),10.0);
    float pulse=0.6+0.4*sin(uTime*uPulseSpeed*(1.5+aIntensity*2.0)+aSeed*6.2831);
    vec4 mv=modelViewMatrix*vec4(p,1.0);
    gl_PointSize=uBaseSize*(0.65+1.4*aIntensity)*pulse*life*(1.0/max(0.001,-mv.z));
    vAge=life;
    gl_Position=projectionMatrix*mv;
  }
`;

const DIGIT_FRAG = /* glsl */`
  precision highp float;
  uniform float uTime; uniform float uHueShiftSpeed; uniform int uPaletteMode;
  varying float vIntensity; varying float vDigit; varying float vAge; varying float vSeed;

  float sdBox(vec2 p,vec2 b){ vec2 d=abs(p)-b; return length(max(d,0.0))+min(max(d.x,d.y),0.0); }
  float seg(vec2 uv,vec2 pos,vec2 sz,float th){ return smoothstep(th,0.0,sdBox(uv-pos,sz)); }

  float segOn(float d,int i){
    if(d<0.5) return (i==6)?0.0:1.0;
    else if(d<1.5) return (i==1||i==2)?1.0:0.0;
    else if(d<2.5) return (i==0||i==1||i==6||i==4||i==3)?1.0:0.0;
    else if(d<3.5) return (i==0||i==1||i==6||i==2||i==3)?1.0:0.0;
    else if(d<4.5) return (i==5||i==6||i==1||i==2)?1.0:0.0;
    else if(d<5.5) return (i==0||i==5||i==6||i==2||i==3)?1.0:0.0;
    else if(d<6.5) return (i==0||i==5||i==6||i==2||i==3||i==4)?1.0:0.0;
    else if(d<7.5) return (i==0||i==1||i==2)?1.0:0.0;
    else if(d<8.5) return 1.0;
    else return (i==0||i==1||i==2||i==3||i==5||i==6)?1.0:0.0;
  }

  vec3 palC(float x){ return 0.55+0.45*sin(vec3(0.2,2.2,4.2)+x*6.2831); }
  vec3 palP(float x){ return 0.55+0.45*sin(vec3(1.0,2.0,3.0)+x*6.2831); }
  vec3 palA(float x){ vec3 b=0.55+0.45*sin(vec3(0.0,1.5,3.0)+x*6.2831); return vec3(b.r*1.15,b.g*1.05,b.b*0.45); }

  void main(){
    vec2 uv=(gl_PointCoord*2.0-1.0)*vec2(0.75,1.0);
    float th=0.08, a=0.0;
    vec2 hS=vec2(0.38,0.08), vS=vec2(0.08,0.32);
    float d=vDigit;
    a+=segOn(d,0)*seg(uv,vec2(0.0, 0.62),hS,th);
    a+=segOn(d,6)*seg(uv,vec2(0.0, 0.00),hS,th);
    a+=segOn(d,3)*seg(uv,vec2(0.0,-0.62),hS,th);
    a+=segOn(d,1)*seg(uv,vec2( 0.46, 0.32),vS,th);
    a+=segOn(d,2)*seg(uv,vec2( 0.46,-0.32),vS,th);
    a+=segOn(d,5)*seg(uv,vec2(-0.46, 0.32),vS,th);
    a+=segOn(d,4)*seg(uv,vec2(-0.46,-0.32),vS,th);
    float glow=smoothstep(1.2,0.1,dot(uv,uv));
    float t=uTime*uHueShiftSpeed+vSeed*0.7;
    vec3 col = (uPaletteMode==0)?palC(t):(uPaletteMode==1)?palP(t):palA(t);
    float alpha=(a+glow*0.35)*(0.25+1.35*vIntensity)*vAge;
    gl_FragColor=vec4(col*(1.2+2.2*a)*alpha,alpha);
  }
`;

// ── 工具函式 ────────────────────────────────────────

const TAU = Math.PI * 2;
const clamp = (x: number, a: number, b: number) => Math.min(b, Math.max(a, x));
const fract = (x: number) => x - Math.floor(x);
const hash11 = (x: number) => fract(Math.sin(x) * 43758.5453123);
function randomUnitVec(seed: number) {
  const u = hash11(seed + 10), v = hash11(seed + 20);
  const theta = TAU * u, z = v * 2 - 1, r = Math.sqrt(Math.max(0, 1 - z * z));
  return new THREE.Vector3(r * Math.cos(theta), z, r * Math.sin(theta));
}

// ── 主組件 ────────────────────────────────────────

export default function BigDataCorePage() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    // ── 參數 ──
    const P = {
      globeRadius: 6.0, coreRadius: 1.35,
      nodeCount: 240, streamsPerNode: 18,
      streamBend: 2.2, digitRate: 14.0, basePointSize: 26.0,
      energy: 1.0, pulseSpeed: 1.2, hueShiftSpeed: 0.08,
      bloomStrength: 1.35, bloomRadius: 0.55, bloomThreshold: 0.06,
      exposure: 1.15, maxPixelRatio: 2.0,
    };

    function paletteToColors() {
      return { A: new THREE.Color('#00e5ff'), B: new THREE.Color('#ff2bd6'), C: new THREE.Color('#ffffff'), globe: new THREE.Color('#00e5ff'), paletteMode: 0 };
    }

    // ── Renderer ──
    const renderer = new THREE.WebGLRenderer({ canvas, antialias: false, alpha: false, powerPreference: 'high-performance' });
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = P.exposure;

    // ── Scene / Camera ──
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x04060a);
    scene.fog = new THREE.FogExp2(0x04060a, 0.045);
    const camera = new THREE.PerspectiveCamera(55, 1, 0.1, 200);
    camera.position.set(0, 2.5, 12.5);

    // ── Controls ──
    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.06;
    controls.autoRotate = true;
    controls.autoRotateSpeed = 0.25;

    // ── Lights ──
    scene.add(new THREE.AmbientLight(0xffffff, 0.12));
    const kl = new THREE.PointLight(0xffffff, 1.4, 80);
    kl.position.set(8, 10, 12); scene.add(kl);

    // ── Objects ──
    let coreMesh: THREE.Mesh, globeMesh: THREE.Mesh, nodePoints: THREE.Points, digitPoints: THREE.Points;
    let coreMat: THREE.ShaderMaterial, globeMat: THREE.ShaderMaterial, nodeMat: THREE.ShaderMaterial, digitMat: THREE.ShaderMaterial;

    function buildCore() {
      const cols = paletteToColors();
      coreMat = new THREE.ShaderMaterial({
        uniforms: { uTime:{value:0}, uEnergy:{value:P.energy}, uPulseSpeed:{value:P.pulseSpeed}, uHueShiftSpeed:{value:P.hueShiftSpeed}, uColorA:{value:cols.A.toArray().slice(0,3)}, uColorB:{value:cols.B.toArray().slice(0,3)}, uColorC:{value:cols.C.toArray().slice(0,3)} },
        vertexShader: CORE_VERT, fragmentShader: CORE_FRAG,
      });
      coreMesh = new THREE.Mesh(new THREE.IcosahedronGeometry(P.coreRadius, 6), coreMat);
      scene.add(coreMesh);
      coreMesh.add(new THREE.Mesh(new THREE.IcosahedronGeometry(P.coreRadius * 1.03, 2), new THREE.MeshBasicMaterial({ color: cols.A, wireframe: true, transparent: true, opacity: 0.18, blending: THREE.AdditiveBlending, depthWrite: false })));
    }

    function buildGlobe() {
      const cols = paletteToColors();
      globeMat = new THREE.ShaderMaterial({
        uniforms: { uTime:{value:0}, uStrength:{value:0.9}, uColor:{value:cols.globe.toArray().slice(0,3)} },
        vertexShader: GLOBE_VERT, fragmentShader: GLOBE_FRAG, transparent: true, blending: THREE.AdditiveBlending, depthWrite: false,
      });
      globeMesh = new THREE.Mesh(new THREE.SphereGeometry(P.globeRadius * 0.92, 64, 48), globeMat);
      scene.add(globeMesh);
    }

    function buildNodesAndDigits() {
      const nc = P.nodeCount, sp = P.streamsPerNode, td = nc * sp;
      const nodePos = new Float32Array(nc * 3), nodeInt = new Float32Array(nc), nodeSeed = new Float32Array(nc);
      for (let i = 0; i < nc; i++) {
        const seed = i * 13.37, dir = randomUnitVec(seed), r = P.globeRadius;
        nodePos[i*3]=dir.x*r; nodePos[i*3+1]=dir.y*r; nodePos[i*3+2]=dir.z*r;
        nodeInt[i] = 0.12 + 0.88 * Math.pow(hash11(seed+2), 2);
        nodeSeed[i] = hash11(seed+9);
      }
      const nGeo = new THREE.BufferGeometry();
      nGeo.setAttribute('position', new THREE.BufferAttribute(nodePos, 3));
      nGeo.setAttribute('aIntensity', new THREE.BufferAttribute(nodeInt, 1));
      nGeo.setAttribute('aSeed', new THREE.BufferAttribute(nodeSeed, 1));
      nodeMat = new THREE.ShaderMaterial({ uniforms: { uTime:{value:0}, uBaseSize:{value:22}, uPulseSpeed:{value:P.pulseSpeed}, uHueShiftSpeed:{value:P.hueShiftSpeed} }, vertexShader: NODE_VERT, fragmentShader: NODE_FRAG, transparent: true, blending: THREE.AdditiveBlending, depthWrite: false });
      nodePoints = new THREE.Points(nGeo, nodeMat);
      scene.add(nodePoints);

      const dp=new Float32Array(td*3), aS=new Float32Array(td*3), aE=new Float32Array(td*3), aSeed=new Float32Array(td), aSpd=new Float32Array(td), aInt=new Float32Array(td), aDb=new Float32Array(td);
      for (let i = 0; i < td; i++) {
        const ni=Math.floor(i/sp), li=i-ni*sp;
        const seed=(ni+1)*91.7+li*7.11, endDir=randomUnitVec(seed+99), endR=P.coreRadius*(0.15+0.75*hash11(seed+199));
        aS[i*3]=nodePos[ni*3]; aS[i*3+1]=nodePos[ni*3+1]; aS[i*3+2]=nodePos[ni*3+2];
        aE[i*3]=endDir.x*endR; aE[i*3+1]=endDir.y*endR; aE[i*3+2]=endDir.z*endR;
        aSeed[i]=hash11(seed+1); const inten=nodeInt[ni]; aInt[i]=inten*(0.55+0.45*hash11(seed+4));
        aSpd[i]=(0.25+1.35*inten)*(0.35+0.65*hash11(seed+6)); aDb[i]=Math.floor(hash11(seed+8)*10);
      }
      const dGeo = new THREE.BufferGeometry();
      dGeo.setAttribute('position', new THREE.BufferAttribute(dp, 3));
      dGeo.setAttribute('aStart', new THREE.BufferAttribute(aS, 3));
      dGeo.setAttribute('aEnd', new THREE.BufferAttribute(aE, 3));
      dGeo.setAttribute('aSeed', new THREE.BufferAttribute(aSeed, 1));
      dGeo.setAttribute('aSpeed', new THREE.BufferAttribute(aSpd, 1));
      dGeo.setAttribute('aIntensity', new THREE.BufferAttribute(aInt, 1));
      dGeo.setAttribute('aDigitBase', new THREE.BufferAttribute(aDb, 1));
      const cols = paletteToColors();
      digitMat = new THREE.ShaderMaterial({ uniforms: { uTime:{value:0}, uBend:{value:P.streamBend}, uBaseSize:{value:P.basePointSize}, uDigitRate:{value:P.digitRate}, uPulseSpeed:{value:P.pulseSpeed}, uHueShiftSpeed:{value:P.hueShiftSpeed}, uPaletteMode:{value:cols.paletteMode} }, vertexShader: DIGIT_VERT, fragmentShader: DIGIT_FRAG, transparent: true, blending: THREE.AdditiveBlending, depthWrite: false });
      digitPoints = new THREE.Points(dGeo, digitMat);
      scene.add(digitPoints);
    }

    // ── Post ──
    let composer: EffectComposer, bloomPass: UnrealBloomPass;
    let fxaaPass: ShaderPass, rgbPass: ShaderPass;

    function buildPost(w: number, h: number, pr: number) {
      composer = new EffectComposer(renderer);
      composer.addPass(new RenderPass(scene, camera));
      bloomPass = new UnrealBloomPass(new THREE.Vector2(w, h), P.bloomStrength, P.bloomRadius, P.bloomThreshold);
      composer.addPass(bloomPass);
      composer.addPass(new OutputPass());
      // FXAA via ShaderPass (FXAAPass may not exist in this three version)
      const FXAAShader = { uniforms: { tDiffuse:{value:null}, resolution:{value:new THREE.Vector2(1/(w*pr),1/(h*pr))} }, vertexShader: `varying vec2 vUv; void main(){ vUv=uv; gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.0); }`, fragmentShader: `uniform sampler2D tDiffuse; uniform vec2 resolution; varying vec2 vUv; void main(){ gl_FragColor=texture2D(tDiffuse,vUv); }` };
      fxaaPass = new ShaderPass(FXAAShader);
      composer.addPass(fxaaPass);
      rgbPass = new ShaderPass(RGBShiftShader);
      (rgbPass.uniforms as any).amount.value = 0.0025;
      composer.addPass(rgbPass);
    }

    // ── Resize ──
    function resize() {
      const el = canvas.parentElement;
      const w = el ? el.clientWidth : window.innerWidth;
      const h = el ? el.clientHeight : window.innerHeight;
      const pr = clamp(window.devicePixelRatio, 1, P.maxPixelRatio);
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      renderer.setPixelRatio(pr);
      renderer.setSize(w, h, false);
      if (composer) { composer.setPixelRatio(pr); composer.setSize(w, h); }
    }

    // ── Init ──
    buildCore();
    buildGlobe();
    buildNodesAndDigits();
    const el = canvas.parentElement;
    const initW = el ? el.clientWidth : window.innerWidth;
    const initH = el ? el.clientHeight : window.innerHeight;
    const initPr = clamp(window.devicePixelRatio, 1, P.maxPixelRatio);
    buildPost(initW, initH, initPr);
    resize();

    const ro = new ResizeObserver(resize);
    if (canvas.parentElement) ro.observe(canvas.parentElement);

    // ── Animate ──
    let raf = 0;
    let energyTarget = P.energy, lastKick = 0;

    function animate(ms: number) {
      raf = requestAnimationFrame(animate);
      const t = ms * 0.001;

      // synthetic energy pulse
      if (t - lastKick > 0.25) {
        lastKick = t;
        energyTarget = clamp(P.energy * (0.75 + 0.25 * Math.sin(t * 2)) + 0.15 * (hash11(t) - 0.5), 0, 2.5);
      }
      if (coreMat) coreMat.uniforms.uEnergy.value = coreMat.uniforms.uEnergy.value * 0.92 + energyTarget * 0.08;

      if (coreMesh) { coreMesh.rotation.y = t * 0.35; coreMesh.rotation.x = Math.sin(t * 0.2) * 0.08; }
      if (globeMesh) globeMesh.rotation.y = t * 0.08;
      if (coreMat) coreMat.uniforms.uTime.value = t;
      if (globeMat) globeMat.uniforms.uTime.value = t;
      if (nodeMat) nodeMat.uniforms.uTime.value = t;
      if (digitMat) digitMat.uniforms.uTime.value = t;

      controls.update();
      if (composer) composer.render();
      else renderer.render(scene, camera);
    }

    raf = requestAnimationFrame(animate);

    // ── Cleanup ──
    return () => {
      cancelAnimationFrame(raf);
      ro.disconnect();
      renderer.dispose();
      composer?.dispose?.();
    };
  }, []);

  return (
    <div style={{ width: '100%', height: '100%', minHeight: '100vh', background: '#04060a', position: 'relative', overflow: 'hidden' }}>
      {/* 3D Canvas */}
      <canvas ref={canvasRef} style={{ width: '100%', height: '100%', display: 'block' }} />

      {/* HUD 疊層 */}
      <div style={{ position: 'absolute', top: 12, left: 16, zIndex: 10, display: 'flex', alignItems: 'center', gap: 8, pointerEvents: 'none' }}>
        <span style={{ width: 8, height: 8, borderRadius: '50%', background: '#00e5ff', boxShadow: '0 0 12px #00e5ff', display: 'inline-block', animation: 'gdcPulse 2s ease-in-out infinite' }} />
        <span style={{ fontSize: 11, fontWeight: 900, color: '#00e5ff', letterSpacing: '.12em', fontFamily: 'monospace', textShadow: '0 0 10px #00e5ff88' }}>GLOBAL BIG DATA ENGINE</span>
        <span style={{ fontSize: 9, color: 'rgba(0,229,255,.4)', letterSpacing: '.08em', fontFamily: 'monospace' }}>NODE_CORE · CYBER</span>
      </div>

      {/* 底部狀態列 */}
      <div style={{ position: 'absolute', bottom: 16, left: '50%', transform: 'translateX(-50%)', zIndex: 10, display: 'flex', gap: 24, background: 'rgba(4,6,10,.7)', backdropFilter: 'blur(12px)', border: '1px solid rgba(0,229,255,.12)', borderRadius: 12, padding: '8px 24px', pointerEvents: 'none' }}>
        {([['NODES', '240'], ['STREAMS', '4,320'], ['SYNC', '99.98%'], ['ENERGY', 'LIVE']] as const).map(([k, v]) => (
          <div key={k} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2 }}>
            <span style={{ fontSize: 8, color: 'rgba(0,229,255,.45)', letterSpacing: '.1em', fontFamily: 'monospace' }}>{k}</span>
            <span style={{ fontSize: 13, fontWeight: 900, color: '#00e5ff', fontFamily: 'monospace', textShadow: '0 0 8px #00e5ff66' }}>{v}</span>
          </div>
        ))}
      </div>

      <style>{`@keyframes gdcPulse { 0%,100%{opacity:.65;box-shadow:0 0 6px #00e5ff} 50%{opacity:1;box-shadow:0 0 18px #00e5ff} }`}</style>
    </div>
  );
}
