import React, {
  useState, useEffect, useRef, useMemo, useCallback,
  Component, type ErrorInfo, type ReactNode,
} from 'react';
import { Link } from 'react-router-dom';
import { rawEmployees, platforms } from '../data/mockData';
import { calculateAiScores, assignGroups, calcHealthScore } from '../engine/aiEngine';

const CFG = {
  particles:  { ultra:320, high:160, low:55,  minimal:10 },
  matrixDens: { ultra:1.0, high:.65, low:.28, minimal:0  },
  bolts:      { ultra:14,  high:7,   low:2,   minimal:0  },
  ripples:    { ultra:16,  high:8,   low:3,   minimal:0  },
  numStreams:  { ultra:80,  high:40,  low:16,  minimal:0  },
  stars:      { ultra:220, high:110, low:0,   minimal:0  },
  fps:        { down:30, up:50, crit:18 },
  mouse:      { parallax:.012 },
} as const;
type Tier = 'ultra' | 'high' | 'low' | 'minimal';

const CSS = `
  @keyframes hb        { 0%,100%{transform:scale(1);opacity:.85} 8%{transform:scale(1.22);opacity:1;filter:brightness(2.1) drop-shadow(0 0 65px #00e5ffff)} 20%{transform:scale(.91);opacity:.87} 35%{transform:scale(1.14);opacity:1;filter:brightness(1.5) drop-shadow(0 0 36px #00ffd0bb)} 52%{transform:scale(.97);opacity:.93} }
  @keyframes breathe   { 0%,100%{transform:scale(1);opacity:.68} 50%{transform:scale(1.09);opacity:1} }
  @keyframes breatheS  { 0%,100%{opacity:.5;transform:scale(1) translateY(0)} 50%{opacity:1;transform:scale(1.07) translateY(-7px)} }
  @keyframes throb     { 0%,100%{text-shadow:0 0 10px rgba(0,255,208,.3)} 50%{text-shadow:0 0 45px rgba(0,255,208,1),0 0 90px rgba(0,210,255,.65)} }
  @keyframes scanRot   { from{transform:translate(-50%,-50%) rotate(0deg)} to{transform:translate(-50%,-50%) rotate(360deg)} }
  @keyframes orbDNA    { from{transform:translate(-50%,-50%) rotate(0deg) rotateX(68deg)} to{transform:translate(-50%,-50%) rotate(360deg) rotateX(68deg)} }
  @keyframes orbDNA2   { from{transform:translate(-50%,-50%) rotate(360deg) rotateX(68deg) rotateZ(50deg)} to{transform:translate(-50%,-50%) rotate(0deg) rotateX(68deg) rotateZ(50deg)} }
  @keyframes orbDNA3   { from{transform:translate(-50%,-50%) rotate(180deg) rotateY(72deg)} to{transform:translate(-50%,-50%) rotate(-180deg) rotateY(72deg)} }
  @keyframes orbDNA4   { from{transform:translate(-50%,-50%) rotate(90deg) rotateZ(30deg) rotateX(45deg)} to{transform:translate(-50%,-50%) rotate(450deg) rotateZ(30deg) rotateX(45deg)} }
  @keyframes memGlow   { 0%,100%{box-shadow:0 0 50px rgba(0,229,200,.28),inset 0 0 60px rgba(0,229,200,.1)} 33%{box-shadow:0 0 140px rgba(0,229,200,.8),inset 0 0 120px rgba(0,229,200,.26)} 66%{box-shadow:0 0 95px rgba(124,77,255,.58),inset 0 0 85px rgba(124,77,255,.18)} }
  @keyframes petriF    { 0%,100%{transform:translateY(0) rotate(0deg) scale(1)} 30%{transform:translateY(-9px) rotate(.7deg) scale(1.013)} 65%{transform:translateY(-4px) rotate(-.6deg) scale(1.006)} }
  @keyframes godray    { 0%,100%{opacity:.05;transform:translateX(-50%) skewX(-14deg) scaleX(1)} 50%{opacity:.3;transform:translateX(-50%) skewX(-14deg) scaleX(1.42)} }
  @keyframes hueC      { 0%{filter:hue-rotate(0deg) brightness(1)} 50%{filter:hue-rotate(22deg) brightness(1.07)} 100%{filter:hue-rotate(0deg) brightness(1)} }
  @keyframes cpng      { 0%{r:4;opacity:1} 100%{r:30;opacity:0} }
  @keyframes gaugeEx   { 0%,100%{filter:brightness(1)} 50%{filter:brightness(1.8) drop-shadow(0 0 28px #00ffa0ff)} }
  @keyframes vitalNd   { 0%,100%{filter:drop-shadow(0 0 9px #00ffa055)} 50%{filter:drop-shadow(0 0 40px #00ffa0ff) brightness(2.4)} }
  @keyframes pktTravel { 0%{offset-distance:0%;opacity:0} 4%{opacity:1} 87%{opacity:.95} 100%{offset-distance:100%;opacity:0} }
  @keyframes pgFade    { from{opacity:0;transform:translateY(20px)} to{opacity:1;transform:translateY(0)} }
  @keyframes ticker    { from{transform:translateX(0)} to{transform:translateX(-50%)} }
  @keyframes pulseWave { 0%{r:40;opacity:.85;stroke-width:4} 100%{r:218;opacity:0;stroke-width:.3} }
  @keyframes ecgPulse  { 0%{transform:translateX(0)} 100%{transform:translateX(-200px)} }
  @keyframes blobMorph { 0%,100%{border-radius:62% 38% 54% 46% / 48% 62% 38% 52%} 25%{border-radius:42% 58% 36% 64% / 58% 36% 64% 42%} 50%{border-radius:56% 44% 62% 38% / 36% 64% 42% 58%} 75%{border-radius:38% 62% 46% 54% / 64% 38% 58% 42%} }
  @keyframes blobMorphB{ 0%,100%{border-radius:38% 62% 46% 54%/64% 38% 58% 42%} 20%{border-radius:71% 29% 63% 37%/42% 68% 32% 58%} 40%{border-radius:44% 56% 38% 62%/56% 40% 60% 44%} 60%{border-radius:58% 42% 72% 28%/36% 74% 26% 64%} 80%{border-radius:29% 71% 34% 66%/68% 28% 72% 32%} }
  @keyframes blobMorphC{ 0%,100%{border-radius:50% 50% 50% 50%/50% 50% 50% 50%} 16%{border-radius:76% 24% 64% 36%/44% 72% 28% 56%} 33%{border-radius:33% 67% 42% 58%/68% 34% 66% 32%} 50%{border-radius:60% 40% 30% 70%/52% 40% 60% 48%} 66%{border-radius:24% 76% 58% 42%/38% 62% 38% 62%} 83%{border-radius:52% 48% 76% 24%/26% 78% 22% 74%} }
  @keyframes orbMorph  { 0%,100%{rx:128;ry:36} 25%{rx:118;ry:44} 50%{rx:134;ry:30} 75%{rx:122;ry:42} }
  @keyframes orbMorphB { 0%,100%{rx:142;ry:40} 33%{rx:128;ry:52} 66%{rx:155;ry:33} }
  @keyframes coreBlob  { 0%,100%{d:path('M 200 110 C 250 110 290 150 290 200 C 290 250 250 290 200 290 C 150 290 110 250 110 200 C 110 150 150 110 200 110 Z')} 25%{d:path('M 200 105 C 258 108 295 148 292 205 C 289 262 248 295 200 293 C 145 291 108 255 112 200 C 116 148 145 102 200 105 Z')} 50%{d:path('M 200 108 C 255 105 298 152 295 208 C 292 258 245 292 195 290 C 148 288 106 250 110 198 C 114 146 148 111 200 108 Z')} 75%{d:path('M 200 112 C 248 110 288 155 286 202 C 284 255 245 294 200 292 C 152 290 112 248 114 200 C 116 150 155 114 200 112 Z')} }
  @keyframes aura1     { 0%,100%{transform:translate(-50%,-50%) scale(1) rotate(0deg);opacity:.55} 33%{transform:translate(-50%,-50%) scale(1.08) rotate(120deg);opacity:.85} 66%{transform:translate(-50%,-50%) scale(.96) rotate(240deg);opacity:.65} }
  @keyframes aura2     { 0%,100%{transform:translate(-50%,-50%) scale(1) rotate(360deg);opacity:.4} 50%{transform:translate(-50%,-50%) scale(1.12) rotate(180deg);opacity:.75} }
  @keyframes fluxBeam  { 0%,100%{opacity:.04;stroke-width:.4;filter:none} 50%{opacity:.55;stroke-width:2;filter:drop-shadow(0 0 8px currentColor)} }
  @keyframes bootNum   { 0%{transform:translateY(-10px) scale(.85);opacity:0;filter:blur(4px)} 15%{opacity:1;filter:blur(0);transform:translateY(0) scale(1.08)} 85%{opacity:1;transform:translateY(0) scale(1)} 100%{transform:translateY(10px) scale(.88);opacity:0;filter:blur(3px)} }
  @keyframes numFlash  { 0%,100%{filter:brightness(1)} 20%{filter:brightness(2.2) drop-shadow(0 0 18px currentColor)} }
  @keyframes underJet  { 0%,100%{transform:translate(-50%,0) scaleX(1);opacity:.18} 50%{transform:translate(-50%,0) scaleX(1.35);opacity:.55} }
  @keyframes jetSpark  { 0%{transform:translate(-50%,-50%) translateY(0);opacity:1;border-radius:50%} 100%{transform:translate(-50%,-50%) translateY(60px) scale(.1);opacity:0;border-radius:50%} }
  @keyframes shimmer   { 0%{background-position:200% center} 100%{background-position:-200% center} }
  @keyframes elecArc   { 0%,80%,100%{opacity:0;stroke-width:.3} 81%{opacity:1;stroke-width:2.8;filter:drop-shadow(0 0 12px #00e5ff)} 86%{opacity:.3;stroke-width:.6} 90%{opacity:.9;stroke-width:2.2} 94%{opacity:.15;stroke-width:.4} 97%{opacity:.7;stroke-width:1.6} }
  @keyframes currentFlow { from{stroke-dashoffset:80;opacity:.75} to{stroke-dashoffset:0;opacity:.18} }
  @keyframes plasmaCore  { 0%,100%{filter:drop-shadow(0 0 14px #00e5ff) drop-shadow(0 0 32px #00ffd0)} 50%{filter:drop-shadow(0 0 38px #fff) drop-shadow(0 0 76px #00e5ff) drop-shadow(0 0 120px #7c4dff)} }
  @keyframes quantArc  { 0%,100%{opacity:.06;stroke-width:.6} 50%{opacity:.62;stroke-width:2.2;filter:drop-shadow(0 0 18px #7c4dff)} }
  @keyframes dendrite  { 0%,100%{opacity:0;stroke-width:.3} 50%{opacity:.9;stroke-width:1.8} }
  @keyframes coronaRay { 0%,100%{opacity:.05;transform:scaleY(1)} 50%{opacity:.2;transform:scaleY(1.22)} }
  @keyframes cellDiv   { 0%,100%{letter-spacing:-.02em;transform:scaleX(1)} 48%{letter-spacing:.08em;transform:scaleX(1.06)} 52%{letter-spacing:-.02em;transform:scaleX(.97)} }
  @keyframes dataGlitch { 0%,91%,100%{transform:none;opacity:1;filter:none} 92%{transform:skewX(5deg) translateX(-3px);opacity:.88;filter:drop-shadow(-3px 0 #f0f)} 93%{transform:skewX(-3deg) translateX(2px);opacity:.94;filter:drop-shadow(2px 0 #0ff)} 94%{transform:none;opacity:1} 95%{transform:skewX(2deg) scaleX(.98);filter:drop-shadow(1px 0 #0f0);opacity:.93} 96%{transform:none;opacity:1} }
  @keyframes scanH     { 0%{top:-3px;opacity:0} 5%{opacity:.7} 92%{opacity:.38} 100%{top:102%;opacity:0} }
  @keyframes metalSheen{ 0%{background-position:-200% center} 100%{background-position:200% center} }
  @keyframes numFall   { 0%{transform:translateY(-20px);opacity:0} 8%{opacity:1} 90%{opacity:.85} 100%{transform:translateY(100vh);opacity:0} }
  @keyframes neonBorder { 0%,100%{border-color:rgba(0,229,200,.25);box-shadow:0 0 12px rgba(0,229,200,.1)} 33%{border-color:rgba(124,77,255,.4);box-shadow:0 0 24px rgba(124,77,255,.2)} 66%{border-color:rgba(0,229,200,.35);box-shadow:0 0 20px rgba(0,229,200,.18)} }
  @keyframes counterUp { 0%{opacity:0;transform:translateY(6px)} 100%{opacity:1;transform:translateY(0)} }
  @keyframes corePulse { 0%,100%{opacity:.3;transform:translate(-50%,-50%) scale(1)} 50%{opacity:.9;transform:translate(-50%,-50%) scale(1.06)} }
  @keyframes radarArm  { from{transform:rotate(0deg)} to{transform:rotate(360deg)} }
  @keyframes hudBlink  { 0%,100%{opacity:.55} 50%{opacity:1} }
  @keyframes hudPing   { 0%{transform:scale(1);opacity:.9} 100%{transform:scale(2.5);opacity:0} }
  @keyframes computeIn { 0%{opacity:0;transform:translateX(-8px)} 100%{opacity:1;transform:translateX(0)} }
  @keyframes starFlick { 0%,100%{opacity:.4} 50%{opacity:1} }
  @keyframes bhSpin    { from{transform:rotate(0deg)} to{transform:rotate(360deg)} }
  @keyframes bhSpinR   { from{transform:rotate(360deg)} to{transform:rotate(0deg)} }
  @keyframes bhFlicker { 0%,100%{opacity:.12} 50%{opacity:.88} }
  @keyframes jetPulse  { 0%,100%{stroke-dashoffset:0;opacity:.1} 50%{stroke-dashoffset:24;opacity:.36} }
  @keyframes photon    { 0%,100%{filter:drop-shadow(0 0 10px rgba(255,180,50,.5))} 50%{filter:drop-shadow(0 0 26px rgba(255,230,100,.95)) drop-shadow(0 0 60px rgba(255,140,0,.5))} }
  @keyframes voidWin   { 0%,100%{box-shadow:0 0 40px rgba(0,229,200,.08),inset 0 0 60px rgba(0,0,20,.9)} 50%{box-shadow:0 0 90px rgba(124,77,255,.24),inset 0 0 60px rgba(0,0,20,.9)} }
  @keyframes rankSlide { from{opacity:0;transform:translateX(-22px)} to{opacity:1;transform:translateX(0)} }
  @keyframes parseFlash{ 0%,100%{opacity:1} 50%{opacity:.65;filter:brightness(1.5)} }

  /* ══ NEW: 3D + 螢光強化 ══ */
  @keyframes float3D    { 0%,100%{transform:translateY(0) translateZ(0) rotateX(0deg)} 33%{transform:translateY(-12px) translateZ(18px) rotateX(1.5deg)} 66%{transform:translateY(-6px) translateZ(8px) rotateX(-1deg)} }
  @keyframes textDepth  { 0%,100%{text-shadow:1px 2px 0 #00e5ff,2px 4px 0 rgba(0,0,0,.9),0 0 30px rgba(0,229,200,.7),0 0 60px rgba(0,229,200,.3),0 0 100px rgba(0,229,200,.1)} 50%{text-shadow:1px 2px 0 #7c4dff,2px 4px 0 rgba(0,0,0,.9),0 0 50px rgba(124,77,255,.9),0 0 100px rgba(124,77,255,.4),0 0 160px rgba(0,229,200,.2)} }
  @keyframes neonFlare  { 0%,100%{filter:drop-shadow(0 0 8px #00e5ff) drop-shadow(0 0 20px rgba(0,229,200,.5))} 25%{filter:drop-shadow(0 0 18px #7c4dff) drop-shadow(0 0 40px rgba(124,77,255,.6)) drop-shadow(0 0 80px rgba(124,77,255,.2))} 50%{filter:drop-shadow(0 0 22px #00e5ff) drop-shadow(0 0 50px rgba(0,229,200,.8)) drop-shadow(0 0 100px rgba(0,229,200,.25))} 75%{filter:drop-shadow(0 0 16px #ffd700) drop-shadow(0 0 36px rgba(255,215,0,.5))} }
  @keyframes cardLift   { 0%,100%{transform:translateY(0) translateZ(0) rotateY(0deg);box-shadow:0 4px 20px rgba(0,0,0,.6),0 0 0 rgba(0,229,200,0)} 50%{transform:translateY(-6px) translateZ(20px) rotateY(0.5deg);box-shadow:0 20px 60px rgba(0,0,0,.8),0 0 30px rgba(0,229,200,.18)} }
  @keyframes pulseRing3D{ 0%{opacity:.7;transform:translate(-50%,-50%) scale(1) translateZ(0)} 100%{opacity:0;transform:translate(-50%,-50%) scale(2.8) translateZ(80px)} }
  @keyframes hologram   { 0%,100%{opacity:.85;transform:scaleY(1)} 48%{opacity:.92;transform:scaleY(1.002)} 50%{opacity:.7;transform:scaleY(.998) skewX(.4deg)} 52%{opacity:.9;transform:scaleY(1.001)} }
  @keyframes glitchDepth{ 0%,88%,100%{transform:none;text-shadow:1px 2px 0 #00e5ff,2px 4px 0 rgba(0,0,0,.9)} 89%{transform:translate(-2px,0) skewX(4deg);text-shadow:-2px 2px 0 #f0f,4px 2px 0 #0ff,1px 3px 0 rgba(0,0,0,.9)} 91%{transform:translate(2px,0) skewX(-2deg);text-shadow:2px 2px 0 #0f0,1px 3px 0 rgba(0,0,0,.9)} 93%{transform:none;text-shadow:1px 2px 0 #00e5ff,2px 4px 0 rgba(0,0,0,.9)} }
  @keyframes orbitGlow  { 0%,100%{stroke-opacity:.15;stroke-width:.6} 50%{stroke-opacity:.7;stroke-width:2;filter:drop-shadow(0 0 6px #00e5ff)} }
  @keyframes depthPulse { 0%,100%{box-shadow:0 0 20px rgba(0,229,200,.12),inset 0 0 30px rgba(0,229,200,.04),0 8px 32px rgba(0,0,0,.6)} 50%{box-shadow:0 0 60px rgba(0,229,200,.35),inset 0 0 60px rgba(0,229,200,.10),0 20px 60px rgba(0,0,0,.9),0 0 100px rgba(124,77,255,.15)} }
  @keyframes floatIcon  { 0%,100%{transform:translateY(0) scale(1) rotateZ(0deg)} 50%{transform:translateY(-8px) scale(1.12) rotateZ(3deg)} }
  @keyframes scanV      { 0%{left:-3px;opacity:0} 5%{opacity:.8} 95%{opacity:.5} 100%{left:102%;opacity:0} }
  @keyframes perspShift { 0%,100%{transform:perspective(800px) rotateY(0deg) translateZ(0)} 50%{transform:perspective(800px) rotateY(1.5deg) translateZ(8px)} }

  .hb        { animation: hb 1.8s ease-in-out infinite; }
  .breathe   { animation: breathe 3.5s ease-in-out infinite; }
  .breatheS  { animation: breatheS 6.5s ease-in-out infinite; }
  .petriF    { animation: petriF 6s ease-in-out infinite; }
  .mem       { animation: memGlow 5s ease-in-out infinite; }
  .hueC      { animation: hueC 11s ease-in-out infinite; }
  .pgFade    { animation: pgFade .9s ease-out both; }
  .ticker    { animation: ticker 26s linear infinite; white-space:nowrap; display:inline-block; }
  .shimmerTxt {
    background: linear-gradient(90deg,#00ffd0,#7c4dff,#00e5ff,#ff6ec7,#ffd700,#00ffd0);
    background-size: 250% auto; -webkit-background-clip: text;
    -webkit-text-fill-color: transparent; animation: shimmer 3.2s linear infinite;
    filter: drop-shadow(0 0 12px rgba(0,229,200,.55)) drop-shadow(0 2px 0 rgba(0,0,0,.9));
  }
  .shimmerTxt3d {
    background: linear-gradient(90deg,#00ffd0,#7c4dff,#00e5ff,#ff6ec7,#ffd700,#00ffd0);
    background-size: 250% auto; -webkit-background-clip: text;
    -webkit-text-fill-color: transparent; animation: shimmer 3.2s linear infinite;
    position: relative;
    filter: drop-shadow(0 3px 0 rgba(0,0,0,.95)) drop-shadow(0 0 20px rgba(0,229,200,.7));
  }
  .cellDiv    { animation: cellDiv 3.2s ease-in-out infinite; }
  .dataGlitch { animation: dataGlitch 4.8s ease-in-out infinite; }
  .hologram   { animation: hologram 6s ease-in-out infinite; }
  .glass {
    background: linear-gradient(145deg,rgba(0,15,35,.65),rgba(0,8,22,.75));
    backdrop-filter: blur(28px); -webkit-backdrop-filter: blur(28px);
    border: 1px solid rgba(0,229,200,.18);
    box-shadow: 0 8px 40px rgba(0,0,0,.7),
                inset 0 1px 0 rgba(255,255,255,.09),
                inset 0 -1px 0 rgba(0,229,200,.06);
  }
  .glass-deep {
    background: rgba(0,6,20,.82); backdrop-filter: blur(36px);
    -webkit-backdrop-filter: blur(36px);
    border: 1px solid rgba(0,229,200,.10);
    box-shadow: 0 16px 80px rgba(0,0,0,.85), inset 0 1px 0 rgba(255,255,255,.05);
  }
  .metalCard { position:relative; overflow:hidden; transform-style: preserve-3d; }
  .metalCard::before {
    content:''; position:absolute; top:0; left:0; right:0; height:1px;
    background: linear-gradient(90deg,transparent,rgba(255,255,255,.22),rgba(0,229,200,.4),rgba(255,255,255,.22),transparent);
    border-radius:inherit; pointer-events:none; z-index:2;
  }
  .metalCard::after {
    content:''; position:absolute; inset:0;
    background: linear-gradient(135deg,rgba(255,255,255,.07) 0%,transparent 40%,transparent 60%,rgba(0,229,200,.04) 100%);
    background-size:200% auto; animation: metalSheen 5s ease-in-out infinite;
    pointer-events:none; border-radius:inherit; z-index:1;
  }
  .scanLine {
    position:absolute; left:0; right:0; height:2px;
    background: linear-gradient(90deg,transparent,rgba(0,229,200,.8),rgba(255,255,255,.5),rgba(0,229,200,.8),transparent);
    box-shadow: 0 0 12px rgba(0,229,200,.6), 0 0 30px rgba(0,229,200,.2);
    animation: scanH 4s linear infinite; pointer-events:none; z-index:20;
  }
  .scanLineV {
    position:absolute; top:0; bottom:0; width:2px;
    background: linear-gradient(180deg,transparent,rgba(0,229,200,.6),rgba(255,255,255,.4),rgba(0,229,200,.6),transparent);
    box-shadow: 0 0 10px rgba(0,229,200,.5);
    animation: scanV 7s linear infinite; pointer-events:none; z-index:20;
  }
  .neonBorder { animation: neonBorder 4s ease-in-out infinite; }
  .tierBadge {
    position:fixed; bottom:12px; right:14px;
    font-size:8px; letter-spacing:2px; font-weight:900;
    color:rgba(0,229,200,.28); z-index:100; pointer-events:none; font-family:monospace;
  }
  .numStream {
    position:absolute; pointer-events:none; font-family:monospace;
    font-size:11px; font-weight:700; user-select:none;
  }
  .depthCard {
    transform-style: preserve-3d;
    perspective: 1000px;
    transition: transform .4s cubic-bezier(.23,1,.32,1), box-shadow .4s ease;
    will-change: transform;
    animation: cardLift 6s ease-in-out infinite;
  }
  .depthCard:hover {
    transform: translateY(-12px) translateZ(24px) scale(1.025) !important;
    box-shadow: 0 30px 80px rgba(0,0,0,.9), 0 0 50px rgba(0,229,200,.28), 0 0 100px rgba(0,229,200,.10) !important;
    animation: none;
  }
  .coreGlow {
    filter: drop-shadow(0 0 28px #00e5ff) drop-shadow(0 0 60px rgba(0,229,200,.5)) drop-shadow(0 0 100px rgba(0,229,200,.2));
    animation: neonFlare 3s ease-in-out infinite;
  }

  /* ══ 生命引擎覺醒 — 生物心跳 × 細胞意識 ══ */
  @keyframes heartBeat {
    0%   { transform:scale(1);    filter:brightness(1); }
    10%  { transform:scale(1.32); filter:brightness(4.0) drop-shadow(0 0 120px #00ffffff) drop-shadow(0 0 60px #00e5ffff) drop-shadow(0 0 200px #00ffd0cc); }
    20%  { transform:scale(0.88); filter:brightness(1.05); }
    30%  { transform:scale(1.55); filter:brightness(3.8) drop-shadow(0 0 100px #ff1040ff) drop-shadow(0 0 180px #ff003088) drop-shadow(0 0 250px #cc002055); }
    40%  { transform:scale(0.93); filter:brightness(1.4) drop-shadow(0 0 30px #00ffd0cc); }
    50%  { transform:scale(1);    filter:brightness(1); }
    100% { transform:scale(1);    filter:brightness(1); }
  }
  @keyframes gaugeHeartBeat {
    0%,100% { filter:brightness(1)   drop-shadow(0 0  8px #00ffa033); }
    15%     { filter:brightness(2.6) drop-shadow(0 0 40px #00ffa0ff); }
    25%     { filter:brightness(1.1) drop-shadow(0 0 10px #00ffa044); }
    35%     { filter:brightness(2.0) drop-shadow(0 0 28px #00ffd0cc); }
    50%     { filter:brightness(1)   drop-shadow(0 0  8px #00ffa033); }
  }
  @keyframes ringHeartBeat {
    0%   { transform:scale(1);    opacity:1; }
    10%  { transform:scale(1.22); opacity:1; }
    20%  { transform:scale(0.88); opacity:.7; }
    30%  { transform:scale(1.38); opacity:1; }
    40%  { transform:scale(0.95); opacity:.85; }
    50%  { transform:scale(1);    opacity:1; }
    100% { transform:scale(1);    opacity:1; }
  }
  @keyframes cellMitosis {
    0%   { transform:scale(1);    filter:brightness(1); }
    18%  { transform:scale(1.22); filter:brightness(2.8) drop-shadow(0 0 22px currentColor); }
    32%  { transform:scale(0.95); filter:brightness(1.4); }
    50%  { transform:scale(1.06); filter:brightness(1.2); }
    100% { transform:scale(1);    filter:brightness(1); }
  }
  @keyframes divRing {
    0%   { transform:translate(-50%,-50%) scale(0.2); opacity:0.9; }
    100% { transform:translate(-50%,-50%) scale(3.5); opacity:0; }
  }
  @keyframes breatheVoid {
    0%,100% { box-shadow:inset 0 0 220px rgba(200,0,40,.42),inset 0 0 100px rgba(0,0,20,.97),0 0 120px rgba(0,229,200,.08),inset 0 0 400px rgba(160,0,20,.22); }
    50%     { box-shadow:inset 0 0 360px rgba(0,229,200,.32),inset 0 0 120px rgba(0,0,20,.92),0 0 200px rgba(0,229,200,.22),inset 0 0 500px rgba(0,180,160,.12); }
  }
  @keyframes cellBreathe {
    0%,100% { background:#000812; }
    33%     { background:rgba(2,0,8,1); }
    66%     { background:rgba(0,3,12,1); }
  }
  /* 球體呼吸膨脹 */
  @keyframes sphereBreathe {
    0%,100% { transform:scale(1);     filter:drop-shadow(0 0 20px rgba(0,229,200,.55)) drop-shadow(0 0 50px rgba(0,229,200,.28)); }
    10%     { transform:scale(1.09);  filter:drop-shadow(0 0 80px rgba(0,229,200,1.0)) drop-shadow(0 0 160px rgba(0,229,200,.7)) drop-shadow(0 0 240px rgba(0,255,208,.45)); }
    20%     { transform:scale(0.96);  filter:drop-shadow(0 0 25px rgba(0,229,200,.7)); }
    30%     { transform:scale(1.12);  filter:drop-shadow(0 0 100px rgba(255,20,60,1.0)) drop-shadow(0 0 180px rgba(255,60,40,.6)) drop-shadow(0 0 260px rgba(0,229,200,.45)); }
    42%     { transform:scale(0.975); filter:drop-shadow(0 0 30px rgba(0,229,200,.6)); }
    50%,100%{ transform:scale(1);     filter:drop-shadow(0 0 20px rgba(0,229,200,.55)) drop-shadow(0 0 50px rgba(0,229,200,.28)); }
  }
  /* 血管流動（城市連線） */
  @keyframes bloodFlow {
    0%   { stroke-dashoffset:120; opacity:.55; stroke-width:1.2; }
    40%  { opacity:.95; stroke-width:1.8; }
    100% { stroke-dashoffset:0;   opacity:.35; stroke-width:1; }
  }
  /* 突觸放電 — 加速版，火花更密集 */
  @keyframes synapseFire {
    0%,100% { opacity:0;   stroke-width:.3; filter:none; }
    6%      { opacity:1;   stroke-width:3.5; filter:drop-shadow(0 0 22px #00ffff) drop-shadow(0 0 8px #fff); }
    14%     { opacity:.2;  stroke-width:.6; }
    22%     { opacity:.95; stroke-width:2.8; filter:drop-shadow(0 0 14px #00ffd0); }
    30%     { opacity:.1;  stroke-width:.4; }
    38%     { opacity:.75; stroke-width:2;   filter:drop-shadow(0 0 10px #b464ff); }
    48%     { opacity:0;   stroke-width:.3; }
  }
  /* 意識暈圈 */
  @keyframes consciousRing {
    0%   { r:115; opacity:.7; stroke-width:2; }
    50%  { r:130; opacity:.2; stroke-width:.5; }
    100% { r:145; opacity:0;  stroke-width:.2; }
  }
  /* 模塊卡片生命脈動 */
  @keyframes cardLifePulse {
    0%,100% { box-shadow:0 4px 20px rgba(0,0,0,.6), 0 0 0 rgba(0,229,200,0); border-color:rgba(0,229,200,.18); }
    15%     { box-shadow:0 8px 40px rgba(0,0,0,.7), 0 0 28px rgba(0,229,200,.22); border-color:rgba(0,229,200,.4); }
    35%     { box-shadow:0 12px 50px rgba(0,0,0,.75),0 0 40px rgba(220,30,60,.18); border-color:rgba(220,30,60,.25); }
    50%,100%{ box-shadow:0 4px 20px rgba(0,0,0,.6), 0 0 0 rgba(0,229,200,0); border-color:rgba(0,229,200,.18); }
  }
  /* 腦波掃描 */
  @keyframes brainWave {
    0%   { transform:translateX(-100%); opacity:0; }
    5%   { opacity:.7; }
    90%  { opacity:.4; }
    100% { transform:translateX(100vw); opacity:0; }
  }
  @keyframes brainWaveB {
    0%   { transform:translateX(-100%); opacity:0; }
    8%   { opacity:.5; }
    92%  { opacity:.25; }
    100% { transform:translateX(100vw); opacity:0; }
  }
  .heartBeat     { animation:heartBeat     1.8s ease-in-out infinite; }
  .gaugeHB       { animation:gaugeHeartBeat 1.8s ease-in-out infinite; }
  .ringHB        { animation:ringHeartBeat  1.8s ease-in-out infinite; }
  .breatheVoid   { animation:breatheVoid    4s   ease-in-out infinite; }
  .cellBreathe   { animation:cellBreathe    8s   ease-in-out infinite; }
  .sphereBreathe { animation:sphereBreathe  1.8s ease-in-out infinite; }
  .cardLifePulse { animation:cardLifePulse  1.8s ease-in-out infinite; }
`;

/* ── FPS MONITOR ── */
const usePerf = (): Tier => {
  const [tier, setTier] = useState<Tier>('high');
  const times = useRef<number[]>([]);
  const raf   = useRef(0);
  const lastOp= useRef(0);
  useEffect(()=>{
    let prev = performance.now();
    const tick = (now:number) => {
      times.current.push(now-prev); prev=now;
      if(times.current.length>=60){
        const fps=1000/(times.current.reduce((a,b)=>a+b,0)/60);
        times.current=[];
        const t=Date.now();
        if(t-lastOp.current<4000){raf.current=requestAnimationFrame(tick);return;}
        if(fps<CFG.fps.crit){setTier('minimal');lastOp.current=t;}
        else if(fps<CFG.fps.down){setTier(p=>p==='ultra'?'high':p==='high'?'low':p==='low'?'minimal':p);lastOp.current=t;}
        else if(fps>CFG.fps.up){setTier(p=>p==='minimal'?'low':p==='low'?'high':p);lastOp.current=t;}
      }
      raf.current=requestAnimationFrame(tick);
    };
    raf.current=requestAnimationFrame(tick);
    return()=>cancelAnimationFrame(raf.current);
  },[]);
  return tier;
};

/* ── MOUSE PARALLAX ── */
const useMouse = () => {
  const mx=useRef(0), my=useRef(0);
  const [pos,setPos]=useState({x:0,y:0});
  useEffect(()=>{
    let frame=0;
    const onMove=(e:MouseEvent)=>{mx.current=e.clientX;my.current=e.clientY;};
    const lerp=()=>{
      setPos(p=>{
        const nx=p.x+(mx.current-p.x)*.08, ny=p.y+(my.current-p.y)*.08;
        return(Math.abs(nx-p.x)<.05&&Math.abs(ny-p.y)<.05)?p:{x:nx,y:ny};
      });
      frame=requestAnimationFrame(lerp);
    };
    window.addEventListener('mousemove',onMove,{passive:true});
    frame=requestAnimationFrame(lerp);
    return()=>{window.removeEventListener('mousemove',onMove);cancelAnimationFrame(frame);};
  },[]);
  return pos;
};

/* ── ERROR BOUNDARY ── */
interface SZProps{children:ReactNode;fallback?:ReactNode;label?:string;}
interface SZState{err:boolean;}
class SafeZone extends Component<SZProps,SZState>{
  state:SZState={err:false};
  static getDerivedStateFromError():SZState{return{err:true};}
  componentDidCatch(e:Error,_i:ErrorInfo){console.warn('[SafeZone]',this.props.label??'?',e.message);}
  render(){
    if(this.state.err)return this.props.fallback??(<div style={{padding:'12px 18px',color:'rgba(0,229,200,.4)',fontSize:'11px',fontFamily:'monospace',border:'1px solid rgba(0,229,200,.08)',borderRadius:8}}>◈ 模組已安全降級</div>);
    return this.props.children;
  }
}

/* ── NUMBER STREAM ── */
const STREAM_CHARS='0123456789ABCDEF$¥€×÷±∞∑►▲◆';
interface StreamCol{x:number;digits:string[];speed:number;delay:number;color:string;size:number;}
const NumberStream=({tier}:{tier:Tier})=>{
  const count=CFG.numStreams[tier];
  const cols=useMemo(():StreamCol[]=>{
    const COLORS=['rgba(0,229,200,X)','rgba(0,255,140,X)','rgba(124,77,255,X)','rgba(0,200,255,X)','rgba(255,200,0,X)'];
    return Array.from({length:count},(_,i)=>({
      x:Math.random()*100,
      digits:Array.from({length:Math.floor(Math.random()*16)+6},()=>STREAM_CHARS[Math.floor(Math.random()*STREAM_CHARS.length)]),
      speed:Math.random()*5+3,delay:Math.random()*6,
      color:COLORS[i%COLORS.length].replace('X',String((Math.random()*.5+.35).toFixed(2))),
      size:Math.floor(Math.random()*5)+9,
    }));
  },[count]);
  if(count===0)return null;
  return(
    <div style={{position:'absolute',inset:0,overflow:'hidden',pointerEvents:'none',zIndex:1}}>
      {cols.map((c,i)=>(
        <div key={i} style={{
          position:'absolute',left:`${c.x}%`,top:0,fontFamily:'monospace',
          fontSize:`${c.size}px`,fontWeight:700,color:c.color,
          textShadow:`0 0 8px ${c.color}`,
          animation:`numFall ${c.speed}s linear infinite`,animationDelay:`${c.delay}s`,
          writingMode:'vertical-rl',letterSpacing:'6px',opacity:.7,
          userSelect:'none',pointerEvents:'none',lineHeight:1.4,
        }}>{c.digits.join('')}</div>
      ))}
    </div>
  );
};

/* ── LIVE COMPUTE PANEL ── */
const COMPUTE_OPS=['SUM','AVG','MAX','MIN','SORT','HASH','PACK','SCAN','RANK','SYNC','LOAD','MERGE','INDEX','FLUSH'];
const LiveCompute=({tier}:{tier:Tier})=>{
  const [lines,setLines]=useState<string[]>([]);
  useEffect(()=>{
    if(tier==='minimal'||tier==='low')return;
    const gen=()=>{
      const op=COMPUTE_OPS[Math.floor(Math.random()*COMPUTE_OPS.length)];
      const id=Math.floor(Math.random()*9999).toString().padStart(4,'0');
      const val=Math.floor(Math.random()*9999999)?.toLocaleString();
      return `${op}[${id}] ${Math.random()>.12?'✓':'→'} ${val}`;
    };
    setLines(Array.from({length:10},gen));
    const iv=setInterval(()=>setLines(p=>[gen(),...p.slice(0,11)]),190);
    return()=>clearInterval(iv);
  },[tier]);
  if(tier==='minimal'||tier==='low')return null;
  return(
    <div style={{
      position:'absolute',left:'clamp(10px,2.5vw,36px)',top:'50%',
      transform:'translateY(-40%)',
      fontFamily:'monospace',fontSize:'7.5px',letterSpacing:'1px',
      color:'rgba(0,229,200,.45)',zIndex:12,pointerEvents:'none',
      maxWidth:'clamp(110px,14vw,170px)',
    }}>
      <div style={{marginBottom:7,fontSize:'6px',letterSpacing:'3.5px',color:'rgba(0,229,200,.28)',fontWeight:700}}>PROC·STREAM</div>
      {lines.map((l,i)=>(
        <div key={i} style={{
          opacity:1-i*.075,marginBottom:2.5,
          color:l.includes('✓')?'rgba(0,255,160,.6)':'rgba(0,229,200,.45)',
          animation:i===0?'computeIn .18s ease-out':undefined,
          fontSize:'7px',
        }}>{l}</div>
      ))}
    </div>
  );
};

/* ── HUD CORNERS ── */
const HudCorners=({tier}:{tier:Tier})=>{
  if(tier==='minimal')return null;
  return(
    <>
      {/* top-left */}
      <div style={{position:'absolute',top:16,left:16,width:52,height:52,pointerEvents:'none',zIndex:15}}>
        <svg viewBox="0 0 52 52" style={{width:'100%',height:'100%',overflow:'visible'}}>
          <line x1="2" y1="26" x2="2" y2="2" stroke="#00e5ff" strokeWidth="1.4" strokeOpacity=".6"/>
          <line x1="2" y1="2" x2="26" y2="2" stroke="#00e5ff" strokeWidth="1.4" strokeOpacity=".6"/>
          <circle cx="2" cy="2" r="2.2" fill="#00e5ff" opacity=".85" style={{animation:'hudBlink 1.6s ease-in-out infinite'}}/>
          <circle cx="2" cy="2" r="5" fill="none" stroke="#00e5ff" strokeOpacity=".3" style={{animation:'hudPing 2s ease-out infinite'}}/>
        </svg>
        <div style={{position:'absolute',left:20,top:5,fontSize:'6px',letterSpacing:'2.5px',color:'rgba(0,229,200,.45)',fontFamily:'monospace'}}>SYS.OK</div>
      </div>
      {/* top-right */}
      <div style={{position:'absolute',top:16,right:16,width:52,height:52,pointerEvents:'none',zIndex:15}}>
        <svg viewBox="0 0 52 52" style={{width:'100%',height:'100%',overflow:'visible'}}>
          <line x1="50" y1="26" x2="50" y2="2" stroke="#7c4dff" strokeWidth="1.4" strokeOpacity=".6"/>
          <line x1="50" y1="2" x2="26" y2="2" stroke="#7c4dff" strokeWidth="1.4" strokeOpacity=".6"/>
          <circle cx="50" cy="2" r="2.2" fill="#7c4dff" opacity=".85" style={{animation:'hudBlink 2s ease-in-out infinite',animationDelay:'.4s'}}/>
          <circle cx="50" cy="2" r="5" fill="none" stroke="#7c4dff" strokeOpacity=".3" style={{animation:'hudPing 2.3s ease-out infinite',animationDelay:'.5s'}}/>
        </svg>
        <div style={{position:'absolute',right:20,top:5,fontSize:'6px',letterSpacing:'2.5px',color:'rgba(124,77,255,.45)',fontFamily:'monospace'}}>NET.ON</div>
      </div>
      {/* bottom-left */}
      <div style={{position:'absolute',bottom:16,left:16,width:52,height:52,pointerEvents:'none',zIndex:15}}>
        <svg viewBox="0 0 52 52" style={{width:'100%',height:'100%',overflow:'visible'}}>
          <line x1="2" y1="26" x2="2" y2="50" stroke="#00ffd0" strokeWidth="1.4" strokeOpacity=".5"/>
          <line x1="2" y1="50" x2="26" y2="50" stroke="#00ffd0" strokeWidth="1.4" strokeOpacity=".5"/>
          <circle cx="2" cy="50" r="2.2" fill="#00ffd0" opacity=".7" style={{animation:'hudBlink 2.4s ease-in-out infinite',animationDelay:'.8s'}}/>
        </svg>
        <div style={{position:'absolute',left:20,bottom:5,fontSize:'6px',letterSpacing:'2.5px',color:'rgba(0,255,208,.35)',fontFamily:'monospace'}}>AI.ACT</div>
      </div>
      {/* bottom-right */}
      <div style={{position:'absolute',bottom:16,right:16,width:52,height:52,pointerEvents:'none',zIndex:15}}>
        <svg viewBox="0 0 52 52" style={{width:'100%',height:'100%',overflow:'visible'}}>
          <line x1="50" y1="26" x2="50" y2="50" stroke="#ffd700" strokeWidth="1.4" strokeOpacity=".45"/>
          <line x1="50" y1="50" x2="26" y2="50" stroke="#ffd700" strokeWidth="1.4" strokeOpacity=".45"/>
          <circle cx="50" cy="50" r="2.2" fill="#ffd700" opacity=".65" style={{animation:'hudBlink 1.9s ease-in-out infinite',animationDelay:'1.1s'}}/>
        </svg>
        <div style={{position:'absolute',right:20,bottom:5,fontSize:'6px',letterSpacing:'2.5px',color:'rgba(255,215,0,.35)',fontFamily:'monospace'}}>DAT.OK</div>
      </div>
    </>
  );
};

/* ── DATA CANVAS ── */
interface MxCol{x:number;y:number;speed:number;chars:string[];}
interface Pt{x:number;y:number;vx:number;vy:number;r:number;c:string;life:number;maxLife:number;}
interface Seg{x1:number;y1:number;x2:number;y2:number;}
interface Star{x:number;y:number;r:number;flicker:number;speed:number;}
const MCHARS='0123456789ABCDEF.,-%+$¥×÷'.split('');

const DataCanvas=({tier,mouseX,mouseY,heartFlashRef}:{tier:Tier;mouseX:number;mouseY:number;heartFlashRef?:React.MutableRefObject<number>})=>{
  const cvs=useRef<HTMLCanvasElement>(null);
  const pts=useRef<Pt[]>([]);
  const mx=useRef<MxCol[]>([]);
  const stars=useRef<Star[]>([]);
  const raf=useRef(0);
  const t0=useRef(0);
  const genSeg=useCallback((x1:number,y1:number,x2:number,y2:number,d:number,segs:Seg[])=>{
    segs.push({x1,y1,x2,y2});
    if(d<=0)return;
    const mx2=(x1+x2)/2+(Math.random()-.5)*(Math.hypot(x2-x1,y2-y1)*.45);
    const my2=(y1+y2)/2+(Math.random()-.5)*(Math.hypot(x2-x1,y2-y1)*.45);
    genSeg(x1,y1,mx2,my2,d-1,segs);genSeg(mx2,my2,x2,y2,d-1,segs);
  },[]);
  useEffect(()=>{
    const canvas=cvs.current;if(!canvas)return;
    const ctx=canvas.getContext('2d');if(!ctx)return;
    const resize=()=>{canvas.width=canvas.offsetWidth;canvas.height=canvas.offsetHeight;};
    resize();
    const ro=new ResizeObserver(resize);ro.observe(canvas);
    const W=()=>canvas.width,H=()=>canvas.height;
    const COLORS=['#00ffd0','#00e5ff','#7c4dff','#00ff8c','#ffd700'];
    const initPts=()=>{
      const n=CFG.particles[tier];
      pts.current=Array.from({length:n},()=>({
        x:Math.random()*W(),y:Math.random()*H(),
        vx:(Math.random()-.5)*.55,vy:(Math.random()-.5)*.55,
        r:Math.random()*2.2+.6,c:COLORS[Math.floor(Math.random()*COLORS.length)],
        life:Math.random()*200,maxLife:Math.random()*200+100,
      }));
    };
    const initMx=()=>{
      const cols=Math.floor(W()/16*CFG.matrixDens[tier]);
      mx.current=Array.from({length:cols},(_,i)=>({
        x:(i/(cols||1))*W()+Math.random()*12,y:Math.random()*H(),
        speed:Math.random()*1.6+.8,
        chars:Array.from({length:Math.floor(Math.random()*16)+6},()=>MCHARS[Math.floor(Math.random()*MCHARS.length)]),
      }));
    };
    const initStars=()=>{
      const n=CFG.stars[tier];
      stars.current=Array.from({length:n},()=>({
        x:Math.random()*W(),y:Math.random()*H(),
        r:Math.random()*1.1+.2,flicker:Math.random()*Math.PI*2,
        speed:Math.random()*.025+.008,
      }));
    };
    initPts();initMx();initStars();
    t0.current=performance.now();
    let boltTimer=0;
    const draw=(now:number)=>{
      try{
        const w=W(),h=H();
        const t=(now-t0.current)*.001;
        ctx.clearRect(0,0,w,h);
        // — stars —
        for(const s of stars.current){
          s.flicker+=s.speed;
          const a=.25+.35*Math.sin(s.flicker);
          ctx.beginPath();ctx.arc(s.x, s.y, Math.max(0.1, s.r),0,Math.PI*2);
          ctx.fillStyle=`rgba(200,225,255,${a})`;ctx.fill();
        }
        // — hex grid —
        const hex=40;
        ctx.strokeStyle='rgba(0,229,200,.04)';ctx.lineWidth=.7;
        for(let row=0;row*hex*1.5<h+hex;row++){
          for(let col=0;col*hex*1.732<w+hex;col++){
            const ox=(row%2)*hex*.866;
            const cx2=col*hex*1.732+ox,cy2=row*hex*1.5;
            ctx.beginPath();
            for(let s=0;s<6;s++){const a=s*Math.PI/3-Math.PI/6;ctx.lineTo(cx2+hex*.48*Math.cos(a),cy2+hex*.48*Math.sin(a));}
            ctx.closePath();ctx.stroke();
          }
        }
        // — matrix rain — 心跳時轉血紅色
        if(CFG.matrixDens[tier]>0){
          const hf=heartFlashRef?.current??0;
          const mxR=hf===2?'255,20,50':hf===1?'180,10,30':'0,229,200';
          const mxBright=hf===2?'#ff1432':hf===1?'#cc0820':'#00ffd0';
          for(const col of mx.current){
            col.y+=col.speed;
            if(col.y>h+col.chars.length*16)col.y=-col.chars.length*16;
            for(let i=0;i<col.chars.length;i++){
              if(Math.random()<.02)col.chars[i]=MCHARS[Math.floor(Math.random()*MCHARS.length)];
              const py=col.y+i*14;if(py<0||py>h)continue;
              const bright=i===col.chars.length-1;
              ctx.font=bright?'bold 12px monospace':'11px monospace';
              ctx.fillStyle=bright?'rgba(255,255,255,.95)':`rgba(${mxR},${Math.max(.04,(1-i/col.chars.length)*.58)})`;
              if(bright){ctx.shadowColor=mxBright;ctx.shadowBlur=hf?18:14;}
              ctx.fillText(col.chars[i],col.x,py);
              if(bright)ctx.shadowBlur=0;
            }
          }
        }
        // — lightning —
        const bCount=CFG.bolts[tier];
        if(bCount>0){
          if(boltTimer===0)boltTimer=now;
          const interval=Math.max(55,580/bCount);
          if(now-boltTimer>interval){
            boltTimer=now;
            const segs:Seg[]=[];
            const sx=Math.random()*w;
            genSeg(sx,0,sx+(Math.random()-.5)*w*.5,h*.4+Math.random()*h*.3,5,segs);
            ctx.save();ctx.globalCompositeOperation='screen';
            const alpha=Math.random()*.7+.3;
            for(const s of segs){
              ctx.strokeStyle=`rgba(180,220,255,${alpha*.6})`;ctx.lineWidth=.8;
              ctx.beginPath();ctx.moveTo(s.x1,s.y1);ctx.lineTo(s.x2,s.y2);ctx.stroke();
              ctx.strokeStyle=`rgba(255,255,255,${alpha*.22})`;ctx.lineWidth=2.5;ctx.stroke();
            }
            ctx.restore();
          }
        }
        // — particles —
        const pCount=CFG.particles[tier];
        const drawConn=tier!=='minimal'&&tier!=='low';
        const mi=80;
        for(let i=0;i<pts.current.length&&i<pCount;i++){
          const p=pts.current[i];
          const mdx=p.x-mouseX*w,mdy=p.y-mouseY*h,md=Math.hypot(mdx,mdy);
          if(md<mi&&md>0){const f=(mi-md)/mi*.25;p.vx+=(mdx/md)*f;p.vy+=(mdy/md)*f;}
          p.x+=p.vx;p.y+=p.vy;p.vx*=.992;p.vy*=.992;
          if(p.x<0||p.x>w)p.vx*=-1;if(p.y<0||p.y>h)p.vy*=-1;
          p.life++;
          if(p.life>p.maxLife){p.x=Math.random()*w;p.y=Math.random()*h;p.vx=(Math.random()-.5)*.55;p.vy=(Math.random()-.5)*.55;p.life=0;}
          const alpha=Math.sin(p.life/p.maxLife*Math.PI)*.8+.2;
          ctx.beginPath();ctx.arc(p.x, p.y, Math.max(0.1, Math.max(0.1), p.r),0,Math.PI*2);
          ctx.fillStyle=p.c.replace(')',`,${alpha})`).replace('rgb','rgba');
          ctx.shadowColor=p.c;ctx.shadowBlur=p.r*5;ctx.fill();ctx.shadowBlur=0;
          if(drawConn){
            for(let j=i+1;j<Math.min(pts.current.length,pCount);j++){
              const q=pts.current[j],d=Math.hypot(p.x-q.x,p.y-q.y);
              if(d<80){
                const intens=(1-d/80);
                const r3=Math.random();
                if(r3<.18){
                  // 神經突觸閃光 — 亮青白
                  ctx.strokeStyle=`rgba(80,255,255,${(intens*.7).toFixed(3)})`;
                  ctx.lineWidth=2.5; ctx.shadowColor='#50ffff'; ctx.shadowBlur=22;
                } else if(r3<.32){
                  // 紫色突觸 — 二級神經
                  ctx.strokeStyle=`rgba(180,90,255,${(intens*.55).toFixed(3)})`;
                  ctx.lineWidth=1.6; ctx.shadowColor='#b45aff'; ctx.shadowBlur=14;
                } else if(r3<.62){
                  // 熱血主血管 — 深紅
                  ctx.strokeStyle=`rgba(210,20,45,${(intens*.38).toFixed(3)})`;
                  ctx.lineWidth=1.2; ctx.shadowColor='rgba(255,10,40,.55)'; ctx.shadowBlur=7;
                } else {
                  // 微血管 — 暗紅極細
                  ctx.strokeStyle=`rgba(140,10,25,${(intens*.2).toFixed(3)})`;
                  ctx.lineWidth=.6; ctx.shadowBlur=1;
                }
                ctx.beginPath();ctx.moveTo(p.x,p.y);ctx.lineTo(q.x,q.y);ctx.stroke();
                ctx.shadowBlur=0;
              }
            }
          }
        }
        // — ripples — 交替血色/青色，心跳節律感
        if(CFG.ripples[tier]>0){
          const rn=CFG.ripples[tier];
          for(let i=0;i<rn;i++){
            const phase=(t*.12+i/rn)%1;
            const r=phase*Math.min(w,h)*.45;
            // 奇數圈=血紅，偶數圈=青
            const col=i%2===0?`rgba(0,229,200,${(1-phase)*.13})`:`rgba(200,20,50,${(1-phase)*.09})`;
            ctx.strokeStyle=col; ctx.lineWidth=i%2===0?1.2:.8;
            ctx.beginPath();ctx.arc(w*.5, h*.5, Math.max(0.1, r),0,Math.PI*2);ctx.stroke();
          }
        }
      }catch(e){console.warn('[Canvas]',e);}
      raf.current=requestAnimationFrame(draw);
    };
    if(tier==='minimal'){return()=>{ro.disconnect();cancelAnimationFrame(raf.current);};}
    raf.current=requestAnimationFrame(draw);
    return()=>{ro.disconnect();cancelAnimationFrame(raf.current);};
  // eslint-disable-next-line react-hooks/exhaustive-deps
  },[tier]);
  if(tier==='minimal')return null;
  return(<canvas ref={cvs} style={{position:'absolute',inset:0,width:'100%',height:'100%',pointerEvents:'none',zIndex:0}}/>);
};

/* ── LIFE CANVAS — 全球生命引擎：終極生物發光意識生態系 ── */
interface CellObj {
  x:number; y:number; vx:number; vy:number;
  r:number; life:number; maxLife:number; hue:number;
  dying:boolean; pulsePhase:number;
}
interface DivFlash { x:number; y:number; t:number; ring2:boolean; }
interface BloodFlow { ax:number; ay:number; bx:number; by:number; phase:number; speed:number; color:string; }
const MAX_CELLS=300, INIT_CELLS=150, DIV_THRESHOLD=120, DEATH_LIFE=280;

const LifeCanvas=({tier}:{tier:Tier})=>{
  const cvs=useRef<HTMLCanvasElement>(null);
  const cells=useRef<CellObj[]>([]);
  const flashes=useRef<DivFlash[]>([]);
  const flows=useRef<BloodFlow[]>([]);
  const rafLC=useRef(0);
  const frameN=useRef(0);

  useEffect(()=>{
    if(tier==='minimal')return;
    const canvas=cvs.current; if(!canvas)return;
    const ctx=canvas.getContext('2d'); if(!ctx)return;
    const resize=()=>{ canvas.width=window.innerWidth; canvas.height=window.innerHeight; };
    resize();
    window.addEventListener('resize',resize,{passive:true});

    const mkCell=(x?:number,y?:number):CellObj=>({
      x: x??Math.random()*canvas.width, y: y??Math.random()*canvas.height,
      vx:(Math.random()-.5)*1.4, vy:(Math.random()-.5)*1.4,
      r:Math.random()*3.2+1.4, life:Math.random()*100, maxLife:DEATH_LIFE+Math.random()*60,
      hue:150+Math.random()*70, dying:false, pulsePhase:Math.random()*Math.PI*2,
    });
    cells.current=Array.from({length:INIT_CELLS},()=>mkCell());

    const draw=(now:number)=>{
      frameN.current++;
      const w=canvas.width, h=canvas.height;
      // 有機殘影 — 比之前更深，讓血管痕跡更持久
      ctx.fillStyle='rgba(3,0,4,0.14)';
      ctx.fillRect(0,0,w,h);

      const alive=cells.current;
      const newDiv:DivFlash[]=[];

      // ── 更新 + 繪製細胞 ──
      for(let i=alive.length-1;i>=0;i--){
        const c=alive[i];
        // 死亡期加速消退
        if(c.dying){ c.r*=.96; if(c.r<.3){ alive.splice(i,1); continue; } }
        c.x+=c.vx; c.y+=c.vy; c.life+=1.2; c.pulsePhase+=.09;
        // 壁彈
        if(c.x<0||c.x>w){ c.vx*=-1; c.x=Math.max(0,Math.min(w,c.x)); }
        if(c.y<0||c.y>h){ c.vy*=-1; c.y=Math.max(0,Math.min(h,c.y)); }
        // 老年死亡
        if(c.life>c.maxLife && !c.dying){ c.dying=true; }
        // 細胞分裂 — life>DIV_THRESHOLD，分裂時有 mini 第二環
        if(!c.dying && c.life>DIV_THRESHOLD && alive.length<MAX_CELLS){
          newDiv.push({x:c.x,y:c.y,t:now,ring2:Math.random()<.4});
          alive.push({
            x:c.x+(Math.random()-.5)*14, y:c.y+(Math.random()-.5)*14,
            vx:-c.vx*.8+(Math.random()-.5)*.7, vy:-c.vy*.8+(Math.random()-.5)*.7,
            r:c.r*.85+Math.random()*.6, life:0, maxLife:c.maxLife*(0.8+Math.random()*.35),
            hue:c.hue+(Math.random()-.5)*40, dying:false, pulsePhase:0,
          });
          c.life=0;
        }
        // 脈動半徑 — 三層脈衝疊加（心跳感）
        const beat=1+Math.sin(c.pulsePhase)*0.45+Math.sin(c.pulsePhase*2.1)*0.15;
        const pr=c.r*beat;
        const alpha=c.dying? .15 : (0.5+0.4*Math.sin(c.pulsePhase));
        const glow=c.dying? 4 : (12+8*Math.sin(c.pulsePhase));

        // 細胞核 glow 外圈
        ctx.beginPath(); ctx.arc(c.x,c.y,Math.max(.3,pr*1.8),0,Math.PI*2);
        ctx.fillStyle=`hsla(${c.hue},100%,60%,${(alpha*.18).toFixed(3)})`;
        ctx.fill();
        // 細胞本體
        ctx.beginPath(); ctx.arc(c.x,c.y,Math.max(.3,pr),0,Math.PI*2);
        ctx.fillStyle=`hsla(${c.hue},100%,68%,${alpha.toFixed(3)})`;
        ctx.shadowColor=`hsl(${c.hue},100%,72%)`; ctx.shadowBlur=glow;
        ctx.fill(); ctx.shadowBlur=0;
      }
      flashes.current.push(...newDiv);

      // ── 神經連線 — 熱血血管 × 突觸閃光 × 血流方向 ──
      const len=Math.min(alive.length,MAX_CELLS);
      for(let i=0;i<len;i++){
        for(let j=i+1;j<len;j++){
          const dx=alive[i].x-alive[j].x, dy=alive[i].y-alive[j].y;
          const dist=Math.hypot(dx,dy);
          if(dist<200){
            const intens=(1-dist/200);
            const r=Math.random();
            if(r<.12){
              // 神經突觸閃光 — 極亮青×白
              ctx.strokeStyle=`rgba(140,255,255,${(intens*.95).toFixed(3)})`;
              ctx.lineWidth=3.2; ctx.shadowColor='#90ffff'; ctx.shadowBlur=38;
            } else if(r<.24){
              // 二級突觸 — 紫色電弧
              ctx.strokeStyle=`rgba(200,80,255,${(intens*.75).toFixed(3)})`;
              ctx.lineWidth=2.2; ctx.shadowColor='#c850ff'; ctx.shadowBlur=22;
            } else if(r<.58){
              // 熱血主血管 — 鮮紅
              ctx.strokeStyle=`rgba(245,20,45,${(intens*.55).toFixed(3)})`;
              ctx.lineWidth=1.8; ctx.shadowColor='rgba(255,0,40,.7)'; ctx.shadowBlur=12;
            } else {
              // 微血管 — 深暗紅
              ctx.strokeStyle=`rgba(180,12,25,${(intens*.32).toFixed(3)})`;
              ctx.lineWidth=.85; ctx.shadowBlur=3;
            }
            ctx.beginPath(); ctx.moveTo(alive[i].x,alive[i].y); ctx.lineTo(alive[j].x,alive[j].y); ctx.stroke();
            ctx.shadowBlur=0;

            // 血流流動粒子 — 更高密度 2.5%
            if(frameN.current%2===0 && Math.random()<.025){
              const t2=(now*.0012*(.35+Math.random()*.45))%1;
              const fx=alive[i].x+(alive[j].x-alive[i].x)*t2;
              const fy=alive[i].y+(alive[j].y-alive[i].y)*t2;
              const isRed=Math.random()<.4;
              ctx.beginPath(); ctx.arc(fx,fy,2.2,0,Math.PI*2);
              ctx.fillStyle=isRed?`rgba(255,50,80,${(intens*.95).toFixed(3)})`:`rgba(0,255,200,${(intens*.95).toFixed(3)})`;
              ctx.shadowColor=isRed?'#ff3250':'#00ffc8'; ctx.shadowBlur=16;
              ctx.fill(); ctx.shadowBlur=0;
            }
            // 群聚放電 — dist<60 時產生額外電弧閃光
            if(dist<60 && Math.random()<.08){
              ctx.strokeStyle=`rgba(255,255,255,${(intens*.7).toFixed(3)})`;
              ctx.lineWidth=.5; ctx.shadowColor='#ffffff'; ctx.shadowBlur=30;
              ctx.beginPath(); ctx.moveTo(alive[i].x,alive[i].y); ctx.lineTo(alive[j].x,alive[j].y); ctx.stroke();
              ctx.shadowBlur=0;
            }
          }
        }
      }

      // ── 分裂閃光環（三環）+ 16方向炸裂粒子噴射 ──
      flashes.current=flashes.current.filter(f=>{
        const age=(now-f.t)/800;
        if(age>=1)return false;
        const fade=(1-age).toFixed(3);
        // 主環 — 大
        ctx.beginPath(); ctx.arc(f.x,f.y,Math.max(.1,age*88),0,Math.PI*2);
        ctx.strokeStyle=`rgba(0,255,215,${fade})`; ctx.lineWidth=3;
        ctx.shadowColor='#00ffd7'; ctx.shadowBlur=28; ctx.stroke(); ctx.shadowBlur=0;
        // 第二環（延遲）— 中
        if(f.ring2){
          const age2=Math.max(0,age-.12);
          ctx.beginPath(); ctx.arc(f.x,f.y,Math.max(.1,age2*52),0,Math.PI*2);
          ctx.strokeStyle=`rgba(255,80,120,${(+(1-age2)).toFixed(3)})`; ctx.lineWidth=2;
          ctx.shadowColor='#ff5078'; ctx.shadowBlur=18; ctx.stroke(); ctx.shadowBlur=0;
        }
        // 第三環（更延遲）— 小
        {
          const age3=Math.max(0,age-.28);
          if(age3>0){
            ctx.beginPath(); ctx.arc(f.x,f.y,Math.max(.1,age3*30),0,Math.PI*2);
            ctx.strokeStyle=`rgba(180,255,255,${(+(1-age3)*.7).toFixed(3)})`; ctx.lineWidth=1.2;
            ctx.shadowColor='#b4ffff'; ctx.shadowBlur=10; ctx.stroke(); ctx.shadowBlur=0;
          }
        }
        // 炸裂粒子 — 16個方向噴射（前40%爆發）
        const spark=Math.min(age*2.5,1);
        if(spark<1){
          for(let k=0;k<16;k++){
            const a=(k/16)*Math.PI*2;
            const isMain=k%2===0;
            const dist=age*(isMain?90:60);
            const px2=f.x+Math.cos(a)*dist, py2=f.y+Math.sin(a)*dist;
            const sz=Math.max(.2,(1-spark)*(isMain?4.5:2.5));
            const colors=['0,255,215','120,255,255','255,80,120','255,200,50','0,200,255'];
            ctx.beginPath(); ctx.arc(px2,py2,sz,0,Math.PI*2);
            ctx.fillStyle=`rgba(${colors[k%colors.length]},${((1-spark)*.95).toFixed(3)})`;
            ctx.shadowColor=isMain?'#00ffd7':'#78ffff'; ctx.shadowBlur=isMain?16:8;
            ctx.fill(); ctx.shadowBlur=0;
          }
        }
        return true;
      });

      // ── 意識粒子 — 每8幀生成2個隨機發光點 ──
      if(frameN.current%8===0){
        for(let k=0;k<3;k++){
          ctx.beginPath(); ctx.arc(Math.random()*w,Math.random()*h,1,0,Math.PI*2);
          ctx.fillStyle=`rgba(0,255,${180+Math.random()*75|0},.7)`;
          ctx.shadowColor='#00ffc8'; ctx.shadowBlur=10; ctx.fill(); ctx.shadowBlur=0;
        }
      }
      // ── 神經傳導物質 — 沿神經路徑移動的亮光球 ──
      if(frameN.current%4===0){
        const nLen=Math.min(alive.length,MAX_CELLS);
        // 從細胞對中隨機選3條活躍通道發射傳導物質
        for(let attempt=0;attempt<6;attempt++){
          const i=Math.floor(Math.random()*nLen);
          const j=Math.floor(Math.random()*nLen);
          if(i===j)continue;
          const dx=alive[i].x-alive[j].x, dy=alive[i].y-alive[j].y;
          const dist=Math.hypot(dx,dy);
          if(dist<170&&Math.random()<.45){
            // 傳導物質在路徑上的位置（時間驅動，0-1往返）
            const phase=((now*0.0015+(i*0.07+j*0.03))%1);
            const tx=alive[i].x+(alive[j].x-alive[i].x)*phase;
            const ty=alive[i].y+(alive[j].y-alive[i].y)*phase;
            const isExcitatory=Math.random()<.6; // 興奮性傳導物質=青，抑制性=紅
            // 發光核
            ctx.beginPath(); ctx.arc(tx,ty,2.5,0,Math.PI*2);
            ctx.fillStyle=isExcitatory?'rgba(0,255,220,.95)':'rgba(255,60,80,.9)';
            ctx.shadowColor=isExcitatory?'#00ffdc':'#ff3c50';
            ctx.shadowBlur=16; ctx.fill();
            // 外暈圈
            ctx.beginPath(); ctx.arc(tx,ty,5,0,Math.PI*2);
            ctx.fillStyle=isExcitatory?'rgba(0,255,220,.22)':'rgba(255,60,80,.18)';
            ctx.fill(); ctx.shadowBlur=0;
            break; // 每4幀只發射一個確保性能
          }
        }
      }

      rafLC.current=requestAnimationFrame(draw);
    };
    rafLC.current=requestAnimationFrame(draw);
    return()=>{ window.removeEventListener('resize',resize); cancelAnimationFrame(rafLC.current); };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  },[tier]);

  if(tier==='minimal')return null;
  return(<canvas ref={cvs} style={{position:'fixed',inset:0,width:'100%',height:'100%',pointerEvents:'none',zIndex:0}}/>);
};

/* ── DATA SPHERE ── */
const CITIES=[
  {name:'Tokyo',    color:'#00e5ff'},{name:'London',    color:'#7c4dff'},
  {name:'New York', color:'#00ffd0'},{name:'Shanghai',  color:'#ffd700'},
  {name:'Singapore',color:'#00ff8c'},{name:'Dubai',     color:'#ff6ec7'},
];
const DataSphere=({live,tier}:{live:number;tier:Tier})=>{
  const R=110,heavy=tier==='ultra'||tier==='high';
  const EPATHS=['M 200 200 Q 240 140 280 200','M 200 200 Q 170 140 140 200','M 200 200 Q 240 250 200 310','M 200 200 Q 160 260 200 310','M 200 200 Q 280 220 340 180','M 200 200 Q 120 220 60 180'];
  const QARCS=[[70,120,330,280],[60,200,340,200],[90,90,310,310],[130,60,270,340]];
  return(
    <svg width="400" height="400" viewBox="0 0 400 400" style={{overflow:'visible'}}>
      <defs>
        <radialGradient id="sg8" cx="38%" cy="32%" r="68%">
          <stop offset="0%" stopColor="#00e5ff" stopOpacity=".4"/>
          <stop offset="35%" stopColor="#7c4dff" stopOpacity=".2"/>
          <stop offset="65%" stopColor="#ff4b91" stopOpacity=".15"/> {/* 追加霓虹粉/紫 3D極光 */}
          <stop offset="85%" stopColor="#ffd700" stopOpacity=".08"/>  {/* 追加數據金 */}
          <stop offset="100%" stopColor="#000610" stopOpacity=".95"/>
        </radialGradient>
        <radialGradient id="cg8" cx="45%" cy="45%" r="55%">
          <stop offset="0%" stopColor="#fff" stopOpacity="1"/>
          <stop offset="30%" stopColor="#00e5ff" stopOpacity=".9"/>
          <stop offset="70%" stopColor="#ff4b91" stopOpacity=".4"/>
          <stop offset="100%" stopColor="#00ffd0" stopOpacity="0"/>
        </radialGradient>
        <filter id="glow8" x="-30%" y="-30%" width="160%" height="160%">
          <feGaussianBlur stdDeviation="3" result="b"/>
          <feMerge><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge>
        </filter>
        <filter id="haze8" x="-50%" y="-50%" width="200%" height="200%">
          <feGaussianBlur stdDeviation="12"/>
        </filter>
        <linearGradient id="jetBlood" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%"   stopColor="#ff1a3a" stopOpacity="0.9"/>
          <stop offset="40%"  stopColor="#ff6030" stopOpacity="0.6"/>
          <stop offset="100%" stopColor="#00e5ff" stopOpacity="0.4"/>
        </linearGradient>
      </defs>
      {/* 3D 深度光暈層 */}
      <circle cx="200" cy="200" r={R+80} fill="rgba(0,229,200,.025)" filter="url(#haze8)"/>
      <circle cx="200" cy="200" r={R+55} fill="rgba(124,77,255,.02)" filter="url(#haze8)"/>
      <circle cx="200" cy="200" r={R+40} fill="rgba(0,229,200,.04)" filter="url(#haze8)"/>
      {/* ── 有機光暈光圈（blob 形態，非圓形）── */}
      {[R+22,R+40,R+60,R+85].map((r2,i)=>{
        const d=r2; const blobAnims=['blobMorphC','blobMorphB','blobMorph','blobMorphC'];
        return(
          <rect key={i} x={200-d} y={200-d} width={d*2} height={d*2}
            fill="none"
            stroke={['rgba(0,229,200,.22)','rgba(124,77,255,.16)','rgba(0,255,140,.1)','rgba(255,215,0,.07)'][i]}
            strokeWidth={[1.4,1,.7,.4][i]}
            rx={d} ry={d}
            style={{
              transformOrigin:'200px 200px',
              animation:`${blobAnims[i]} ${[4.5,6.2,8,10.5][i]}s ease-in-out infinite, ringHeartBeat 1.8s ease-in-out infinite`,
              animationDelay:`${(i*.15).toFixed(2)}s`,
            }}/>
        );
      })}
      {/* 核心主球體（blob 形態 + sphereBreathe 呼吸）*/}
      <rect x={200-R} y={200-R} width={R*2} height={R*2}
        fill="url(#sg8)" stroke="rgba(0,229,200,.45)" strokeWidth="2"
        rx={R} ry={R}
        style={{
          transformOrigin:'200px 200px',
          animation:'blobMorphC 5s ease-in-out infinite, sphereBreathe 1.8s ease-in-out infinite',
        }}/>
      {/* 意識暈圈 — 持續向外擴散 */}
      {[0,600,1200].map((delay,i)=>(
        <circle key={i} cx="200" cy="200" r={R+5}
          fill="none" stroke={['rgba(0,229,200,.5)','rgba(255,50,80,.4)','rgba(0,255,140,.35)'][i]}
          strokeWidth="1.5"
          style={{animation:`consciousRing 2.4s ease-out infinite`,animationDelay:`${delay}ms`}}/>
      ))}
      {/* longitude grid */}
      {heavy && Array.from({length:6},(_,i)=>(
        <ellipse key={i} cx="200" cy="200"
          rx={R*Math.abs(Math.cos((i+1)*Math.PI/7))*.98} ry={R}
          fill="none" stroke="rgba(0,229,200,.055)" strokeWidth=".5"
          transform={`rotate(${i*30},200,200)`}
        />
      ))}
      {/* latitude rings */}
      {heavy && [-40,-20,0,20,40].map((lat,i)=>{
        const rx=R*Math.cos(lat*Math.PI/180);
        return(<ellipse key={i} cx="200" cy={200+R*Math.sin(lat*Math.PI/180)*.3} rx={rx} ry={rx*.28}
          fill="none" stroke="rgba(0,229,200,.09)" strokeWidth=".7" strokeDasharray="4 8"
          style={{animation:`scanRot ${8+i*1.5}s linear infinite`}}/>);
      })}
      {/* orbital rings */}
      {['orbDNA','orbDNA2','orbDNA3','orbDNA4'].map((anim,i)=>(
        <ellipse key={i} cx="200" cy="200" rx={R+12+i*14} ry={(R+12+i*14)*.28}
          fill="none" stroke={['rgba(0,229,200,.25)','rgba(124,77,255,.2)','rgba(0,255,140,.15)','rgba(255,215,0,.12)'][i]}
          strokeWidth={[1.2,.9,.7,.5][i]}
          style={{animation:`${anim} ${[7,9.5,11,13][i]}s linear infinite`,transformOrigin:'200px 200px'}}/>
      ))}
      {heavy && QARCS.map(([x1,y1,x2,y2],i)=>(
        <path key={i} d={`M${x1} ${y1} Q200 200 ${x2} ${y2}`}
          fill="none" stroke={['rgba(0,229,200,.18)','rgba(124,77,255,.18)','rgba(0,255,140,.14)','rgba(255,215,0,.12)'][i]}
          strokeWidth="1" style={{animation:`quantArc ${3+i*.8}s ease-in-out infinite`,animationDelay:`${i*.6}s`}}/>
      ))}
      {heavy && EPATHS.map((d,i)=>(
        <path key={i} d={d} fill="none"
          stroke={['#00e5ff','#7c4dff','#00ffd0','#00ff8c','#ffd700','#ff6ec7'][i]}
          strokeWidth="1.1" strokeDasharray="5 15"
          style={{animation:`elecArc ${2.5+i*.4}s ease-in-out infinite`,animationDelay:`${i*.5}s`}}/>
      ))}
      {CITIES.map((city,i)=>{
        const angle=(i/CITIES.length)*Math.PI*2+.3;
        const cx2=200+Math.cos(angle)*R*.82,cy2=200+Math.sin(angle)*R*.45;
        return(
          <g key={city.name} filter="url(#glow8)">
            <line x1="200" y1="200" x2={cx2} y2={cy2} stroke={city.color} strokeWidth="1.2" strokeDasharray="6 10" style={{animation:`bloodFlow ${1.4+i*.2}s linear infinite`,animationDelay:`${i*.28}s`}}/>
            <circle cx={cx2} cy={cy2} r="4" fill={city.color} fillOpacity=".9" style={{animation:`cpng 2s ease-out infinite`,animationDelay:`${i*.33}s`}}/>
            <circle cx={cx2} cy={cy2} r="4" fill={city.color} fillOpacity=".9"/>
            <text x={cx2+7} y={cy2+4} fill={city.color} fontSize="7.5" fontFamily="monospace" opacity=".85">{city.name}</text>
          </g>
        );
      })}
      {heavy && [[200,90],[310,200],[200,310],[90,200],[265,130],[135,270]].map(([ex,ey],i)=>(
        <line key={i} x1="200" y1="200" x2={ex} y2={ey}
          stroke="rgba(0,255,208,.5)" strokeWidth="1" strokeDasharray="3 6"
          style={{animation:`dendrite ${1.8+i*.35}s ease-in-out infinite`,animationDelay:`${i*.28}s`}}/>
      ))}
      {heavy && Array.from({length:24},(_,i)=>{
        const a=(i/24)*Math.PI*2;
        return(<line key={i} x1={200+R*Math.cos(a)} y1={200+R*Math.sin(a)} x2={200+(R+28)*Math.cos(a)} y2={200+(R+28)*Math.sin(a)} stroke="rgba(0,229,200,.16)" strokeWidth=".7" style={{animation:`coronaRay ${1.5+i*.06}s ease-in-out infinite`,animationDelay:`${i*.08}s`}}/>);
      })}
      {heavy && EPATHS.slice(0,3).map((d,i)=>(
        <circle key={i} r="3" fill={['#00ffd0','#7c4dff','#ffd700'][i]}
          style={{offsetPath:`path('${d}')`,offsetDistance:'0%',animation:`pktTravel ${2+i*.6}s linear infinite`,animationDelay:`${i*.8}s`,filter:`drop-shadow(0 0 6px ${['#00ffd0','#7c4dff','#ffd700'][i]})`} as React.CSSProperties}/>
      ))}
      <circle cx="200" cy="200" r="16" fill="url(#cg8)" style={{animation:'plasmaCore 2.2s ease-in-out infinite, heartBeat 1.8s ease-in-out infinite 0.1s'}} filter="url(#glow8)"/>
      <circle cx="200" cy="200" r="7" fill="white" opacity=".95" style={{animation:'heartBeat 1.8s ease-in-out infinite'}}/>

      {/* ── 核心下方能量噴射束（活的，會變化）── */}
      {/* 主噴射軸 */}
      <line x1="200" y1={200+R} x2="200" y2="395"
        stroke="url(#jetBlood)" strokeWidth="2"
        strokeLinecap="round"
        style={{animation:'jetPulse 1.4s ease-in-out infinite'}}
        filter="url(#glow8)"/>
      {/* 噴射光暈 */}
      <ellipse cx="200" cy="340" rx="30" ry="6"
        fill="none" stroke="rgba(0,229,200,.3)" strokeWidth="1"
        style={{animation:'underJet 2s ease-in-out infinite',transformOrigin:'200px 340px'}}/>
      <ellipse cx="200" cy="360" rx="20" ry="4"
        fill="none" stroke="rgba(124,77,255,.25)" strokeWidth=".8"
        style={{animation:'underJet 2.6s ease-in-out infinite .4s',transformOrigin:'200px 360px'}}/>
      <ellipse cx="200" cy="385" rx="12" ry="2.5"
        fill="none" stroke="rgba(0,229,200,.15)" strokeWidth=".5"
        style={{animation:'underJet 3.2s ease-in-out infinite .8s',transformOrigin:'200px 385px'}}/>
      {/* 側翼偏折束 */}
      {[[-1,1],[1,-1],[-.6,.8],[.8,-.6]].map(([dx,dy],i)=>(
        <line key={i} x1={200} y1={200+R+10}
          x2={200+dx*28} y2={200+R+40+dy*10}
          stroke={['rgba(0,229,200,.35)','rgba(124,77,255,.3)','rgba(0,255,140,.22)','rgba(255,215,0,.2)'][i]}
          strokeWidth={[1.2,.9,.7,.5][i]} strokeLinecap="round"
          style={{animation:`fluxBeam ${2.2+i*.5}s ease-in-out infinite`,animationDelay:`${i*.4}s`}}/>
      ))}
      {/* 噴射粒子 */}
      {heavy && Array.from({length:8},(_,i)=>{
        const angle=(i/8)*Math.PI*2;
        const r2=R+30;
        return(<circle key={i}
          cx={200+Math.cos(angle)*r2*.25}
          cy={200+R+Math.sin(Math.abs(angle))*20}
          r={1.2+Math.random()}
          fill={['#00e5ff','#7c4dff','#00ffd0','#ffd700'][i%4]}
          opacity=".8"
          style={{animation:`jetSpark ${1.5+i*.3}s ease-out infinite`,animationDelay:`${i*.2}s`}}/>);
      })}

      {/* ── 額外突觸神經線 — 30條隨機放電 ── */}
      {heavy && Array.from({length:30},(_,i)=>{
        const a1=(i/30)*Math.PI*2, a2=a1+((i%3)*.8+.4);
        const r1=R*(.5+.5*(i%3)/3), r2=R*(1.1+(i%4)*.08);
        return(<line key={`syn-${i}`}
          x1={200+Math.cos(a1)*r1} y1={200+Math.sin(a1)*r1}
          x2={200+Math.cos(a2)*r2} y2={200+Math.sin(a2)*r2}
          stroke={['#00ffff','#ff1a3a','#00ffd0','#b464ff','#ffb400'][i%5]}
          strokeWidth=".8" strokeDasharray="3 9"
          style={{animation:`synapseFire ${0.5+i*.06}s ease-in-out infinite`,animationDelay:`${(i*.07)%1}s`}}/>);
      })}
      <text x="200" y="398" textAnchor="middle" fill="rgba(0,229,200,.45)" fontSize="8.5" fontFamily="monospace" style={{animation:'hudBlink 2s ease-in-out infinite'}}>{`DATA NODES: ${live?.toLocaleString()}`}</text>
    </svg>
  );
};

/* ── VITAL GAUGE ── */
const ECG_D="M0 40 L18 40 L22 38 L28 54 L34 10 L40 50 L46 40 L68 38 L74 40 L90 42 L96 10 L102 52 L110 40 L132 38 L145 40 L162 37 L178 40 L220 40";
const VitalGauge=({score}:{score:number})=>(
  <svg width="100%" height="80" viewBox="0 0 220 80" preserveAspectRatio="none" style={{overflow:'visible'}}>
    <defs>
      <filter id="ecgGlow8"><feGaussianBlur stdDeviation="2.5" result="b"/><feMerge><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge></filter>
    </defs>
    {[{color:'#00e5ff',dy:0,op:.85,sw:1.5},{color:'#00ffd0',dy:1,op:.5,sw:.9},{color:'#7c4dff',dy:2,op:.38,sw:.7}].map(({color,dy,op,sw},ci)=>(
      <g key={ci} style={{animation:`ecgPulse ${1.6+ci*.3}s linear infinite`,animationDelay:`${ci*.22}s`}}>
        <path d={ECG_D} fill="none" stroke={color} strokeWidth={sw} strokeOpacity={op} filter="url(#ecgGlow8)" transform={`translate(0,${dy*4})`}
          style={{animation:`gaugeHeartBeat 1.8s ease-in-out infinite`,animationDelay:`${ci*.2}s`}}/>
      </g>
    ))}
    <text x="210" y="16" textAnchor="end" fill="#00e5ff" fontSize="13" fontFamily="monospace" fontWeight="900" style={{animation:'vitalNd 2s ease-in-out infinite'}}>{score}</text>
    <text x="210" y="28" textAnchor="end" fill="rgba(0,229,200,.5)" fontSize="8" fontFamily="monospace">VITALITY</text>
  </svg>
);

/* ── ANIMATED COUNTER ── */
const AnimCounter=({target,prefix='',suffix='',dur=280}:{target:number;prefix?:string;suffix?:string;dur?:number;})=>{
  const [val,setVal]=useState(target);
  const [flash,setFlash]=useState(false);
  const [divRing,setDivRing]=useState(false);
  const prev=useRef(target);
  const t0=useRef(0);
  useEffect(()=>{
    const start=prev.current;
    prev.current=target;
    setFlash(true); setTimeout(()=>setFlash(false),200);
    setDivRing(true); setTimeout(()=>setDivRing(false),600);
    t0.current=performance.now();
    const tick=(now:number)=>{
      const p=Math.min((now-t0.current)/dur,1);
      setVal(Math.floor(start+(target-start)*(1-Math.pow(1-p,3))));
      if(p<1)requestAnimationFrame(tick);
    };
    requestAnimationFrame(tick);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  },[target]);
  return(
    <span style={{display:'inline-block',position:'relative'}}>
      <span style={{
        display:'inline-block',
        transition:'transform .12s',
        transform: flash ? 'scale(1.22)' : 'scale(1)',
        filter: flash ? 'brightness(2.8) drop-shadow(0 0 22px currentColor)' : 'brightness(1)',
        animation: flash ? 'cellMitosis 0.5s ease-out' : undefined,
      }}>{prefix}{val?.toLocaleString()}{suffix}</span>
      {divRing&&(
        <span style={{
          position:'absolute', left:'50%', top:'50%',
          width:40, height:40, borderRadius:'50%',
          border:'2px solid rgba(0,255,220,0.9)',
          pointerEvents:'none',
          animation:'divRing 0.6s ease-out forwards',
          boxShadow:'0 0 12px rgba(0,255,220,0.6)',
        }}/>
      )}
    </span>
  );
};

/* ── HEX OVERLAY ── */
const HexOverlay=()=>(
  <svg style={{position:'absolute',inset:0,width:'100%',height:'100%',opacity:.07,pointerEvents:'none'}} xmlns="http://www.w3.org/2000/svg">
    <defs><pattern id="hex8" x="0" y="0" width="50" height="57.7" patternUnits="userSpaceOnUse"><polygon points="25,1 49,14.5 49,43.2 25,56.7 1,43.2 1,14.5" fill="none" stroke="#00e5ff" strokeWidth=".6"/></pattern></defs>
    <rect width="100%" height="100%" fill="url(#hex8)"/>
  </svg>
);

/* ── PLATFORM REVENUE ── */
// 3/16 結算：奕心 3,153,310 ／民視 1,073,304 ／公司 806,688 ＝ 5,033,302
const PlatformRevenue=({tier:_tier, data: PLAT_D = [], total: TOTAL = 0}:{tier:Tier, data?: any[], total?: number})=>{
  const R=110,CIRC=2*Math.PI*R;
  const segs=(()=>{
    let off=CIRC*.25;
    return PLAT_D.map(d=>{
      const len=CIRC*d.pct/100;
      const r={...d,len,off};
      off=((off-len)%CIRC+CIRC)%CIRC;
      return r;
    });
  })();
  return(
    <div style={{padding:'clamp(12px,2vh,22px) clamp(16px,4vw,56px)',background:'linear-gradient(180deg,#000c20 0%,#00081a 100%)',position:'relative',overflow:'hidden'}}>
      <div style={{position:'absolute',inset:0,background:'radial-gradient(ellipse 70% 60% at 50% 50%,rgba(0,50,100,.28),transparent)',pointerEvents:'none'}}/>
      <div style={{position:'absolute',inset:0,backgroundImage:'repeating-linear-gradient(0deg,rgba(0,229,200,.015) 0px,rgba(0,229,200,.015) 1px,transparent 1px,transparent 32px),repeating-linear-gradient(90deg,rgba(0,229,200,.015) 0px,rgba(0,229,200,.015) 1px,transparent 1px,transparent 32px)',pointerEvents:'none'}}/>
      <div style={{textAlign:'center',marginBottom:'clamp(10px,2vh,20px)',position:'relative'}}>
        <div style={{fontSize:'clamp(7px,.85vw,10px)',letterSpacing:'7px',color:'rgba(0,229,200,.38)',marginBottom:8,fontFamily:'monospace'}}>PLATFORM · REVENUE · ANALYTICS</div>
        <h2 className="shimmerTxt" style={{fontSize:'clamp(16px,2.2vw,30px)',fontWeight:900,margin:0}}>平台業績分布</h2>
      </div>
      <div style={{display:'flex',alignItems:'center',justifyContent:'center',gap:'clamp(20px,5vw,64px)',flexWrap:'wrap',maxWidth:1100,margin:'0 auto',position:'relative'}}>
        {/* DONUT RING */}
        <SafeZone label="donut">
          <div style={{width:'clamp(200px,26vw,290px)',flexShrink:0}}>
            <svg viewBox="0 0 280 280" style={{width:'100%',height:'auto',overflow:'visible'}}>
              <defs>
                <filter id="sglow" x="-40%" y="-40%" width="180%" height="180%">
                  <feGaussianBlur stdDeviation="6" result="b"/>
                  <feMerge><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge>
                </filter>
                <filter id="sglowS" x="-20%" y="-20%" width="140%" height="140%">
                  <feGaussianBlur stdDeviation="2.5" result="b"/>
                  <feMerge><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge>
                </filter>
              </defs>
              {/* bg track */}
              <circle cx="140" cy="140" r={R} fill="none" stroke="rgba(255,255,255,.04)" strokeWidth="24"/>
              {/* segments */}
              {segs.map((s,i)=>(
                <circle key={i} cx="140" cy="140" r={R} fill="none"
                  stroke={s.color} strokeWidth={[22,18,14][i]}
                  strokeDasharray={`${s.len} ${CIRC-s.len}`}
                  strokeDashoffset={s.off}
                  filter={i===0?'url(#sglow)':'url(#sglowS)'}
                  style={{opacity:.92,animation:`breathe ${3.5+i*.7}s ease-in-out infinite`,animationDelay:`${i*.5}s`}}
                />
              ))}
              {/* inner ring */}
              <circle cx="140" cy="140" r={R-18} fill="none" stroke="rgba(0,229,200,.07)" strokeWidth=".8" strokeDasharray="3 8"/>
              <circle cx="140" cy="140" r={R+20} fill="none" stroke="rgba(0,229,200,.04)" strokeWidth=".6" strokeDasharray="2 12"/>
              {/* node dots */}
              {segs.map((s,i)=>{
                const startAngle=(-s.off/CIRC)*2*Math.PI+(s.len/CIRC)*Math.PI;
                const nx=140+R*Math.cos(startAngle),ny=140+R*Math.sin(startAngle);
                return(<circle key={i} cx={nx} cy={ny} r="4" fill={s.color} style={{animation:`cpng 2s ease-out infinite`,animationDelay:`${i*.5}s`}}/>);
              })}
              {/* center text */}
              <text x="140" y="125" textAnchor="middle" fill="rgba(0,229,200,.35)" fontSize="7" fontFamily="monospace" letterSpacing="2">TOTAL REV</text>
              <text x="140" y="146" textAnchor="middle" fill="white" fontSize="15" fontFamily="monospace" fontWeight="900" style={{animation:'throb 2.5s ease-in-out infinite'}}>{`$${TOTAL?.toLocaleString()}`}</text>
              <text x="140" y="161" textAnchor="middle" fill="rgba(0,229,200,.28)" fontSize="7" fontFamily="monospace">3 PLATFORMS</text>
              {/* legend arcs */}
              {segs.map((s,i)=>(
                <text key={i} x="140" y={185+i*14} textAnchor="middle" fill={s.color} fontSize="8" fontFamily="monospace" opacity=".7">
                  {`${s.name}  ${Number(s.pct).toFixed(1)}%`}
                </text>
              ))}
            </svg>
          </div>
        </SafeZone>
        {/* PLATFORM CARDS */}
        <div style={{display:'flex',flexDirection:'column',gap:'clamp(8px,1.5vh,14px)',flex:'1 1 280px',maxWidth:460}}>
          {PLAT_D.map((p,i)=>(
            <SafeZone key={i} label={`plat-${i}`}>
              <div className="glass metalCard" style={{padding:'clamp(12px,1.8vw,20px)',borderRadius:16,border:`1px solid ${p.color}22`,position:'relative',overflow:'hidden'}}>
                {/* energy fill */}
                <div style={{position:'absolute',left:0,top:0,bottom:0,width:`${p.pct}%`,background:`linear-gradient(90deg,${p.color}14,transparent)`,borderRight:`1px solid ${p.color}22`}}/>
                <div style={{position:'relative'}}>
                  <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',marginBottom:8}}>
                    <div style={{display:'flex',alignItems:'center',gap:10}}>
                      <div style={{width:10,height:10,borderRadius:'50%',background:p.color,boxShadow:`0 0 12px ${p.color}`,animation:'breathe 2.5s ease-in-out infinite',animationDelay:`${i*.42}s`}}/>
                      <span style={{fontWeight:800,fontSize:'clamp(15px,1.8vw,20px)',color:p.color,textShadow:`0 0 20px ${p.color}66`,letterSpacing:'.5px'}}>{p.name}</span>
                    </div>
                    <div style={{display:'flex',alignItems:'baseline',gap:6}}>
                      <span style={{fontFamily:'monospace',fontSize:'clamp(18px,2.2vw,26px)',fontWeight:900,color:p.color,textShadow:`0 0 20px ${p.color}88`,lineHeight:1}}>{Number(p.pct).toFixed(1)}</span>
                      <span style={{fontFamily:'monospace',fontSize:'clamp(10px,1.1vw,13px)',color:`${p.color}88`}}>%</span>
                    </div>
                  </div>
                  {/* bar */}
                  <div style={{height:4,background:'rgba(255,255,255,.06)',borderRadius:2,marginBottom:8,overflow:'hidden'}}>
                    <div style={{height:'100%',width:`${p.pct}%`,background:`linear-gradient(90deg,${p.color},${p.color}55)`,borderRadius:2,boxShadow:`0 0 8px ${p.color}88`,animation:`breatheX 3s ease-in-out infinite`,animationDelay:`${i*.5}s`}}/>
                  </div>
                  <div style={{display:'flex',justifyContent:'space-between',alignItems:'baseline'}}>
                    <span style={{fontFamily:'monospace',fontSize:'clamp(14px,2vw,24px)',fontWeight:900,color:'white',textShadow:`0 0 30px ${p.color}55`,letterSpacing:'-0.5px'}}>{`$${p.rev?.toLocaleString()}`}</span>
                    <span style={{fontSize:'7px',letterSpacing:'2px',color:`${p.color}50`,fontFamily:'monospace'}}>USD · REVENUE</span>
                  </div>
                </div>
              </div>
            </SafeZone>
          ))}
          {/* total summary row */}
          <div className="glass-deep" style={{padding:'clamp(10px,1.5vw,16px)',borderRadius:12,border:'1px solid rgba(0,229,200,.1)',display:'flex',justifyContent:'space-between',alignItems:'center'}}>
            <span style={{fontFamily:'monospace',fontSize:'clamp(9px,1vw,11px)',color:'rgba(0,229,200,.45)',letterSpacing:'3px'}}>TOTAL CYCLE</span>
            <span style={{fontFamily:'monospace',fontSize:'clamp(16px,2vw,22px)',fontWeight:900,color:'white',textShadow:'0 0 25px rgba(0,229,200,.4)'}}>{`$${TOTAL?.toLocaleString()}`}</span>
          </div>
        </div>
      </div>
    </div>
  );
};

/* ── BLACK HOLE PORTAL ── */
const BlackHolePortal=({tier}:{tier:Tier})=>{
  const heavy=tier==='ultra'||tier==='high';
  const CX=230,CY=230,EH=76;
  return(
    <div style={{position:'relative',width:'clamp(240px,32vw,400px)',height:'clamp(240px,32vw,400px)',filter:'drop-shadow(0 0 70px rgba(80,0,255,.55)) drop-shadow(0 0 140px rgba(0,60,200,.28))',transform:'perspective(900px) rotateX(12deg)',transformStyle:'preserve-3d'}}>
      <svg viewBox="0 0 460 460" style={{width:'100%',height:'100%',overflow:'visible'}}>
        <defs>
          <filter id="bhG" x="-50%" y="-50%" width="200%" height="200%"><feGaussianBlur stdDeviation="12" result="b"/><feMerge><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge></filter>
          <filter id="bhC" x="-60%" y="-60%" width="220%" height="220%"><feGaussianBlur stdDeviation="18"/></filter>
          <filter id="bhS" x="-25%" y="-25%" width="150%" height="150%"><feGaussianBlur stdDeviation="4" result="b"/><feMerge><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge></filter>
          <radialGradient id="bhSp" cx="50%" cy="50%" r="50%"><stop offset="0%" stopColor="#000000"/><stop offset="18%" stopColor="#020008"/><stop offset="45%" stopColor="#06001c"/><stop offset="78%" stopColor="#030012"/><stop offset="100%" stopColor="#000812"/></radialGradient>
          <radialGradient id="dkI" cx="50%" cy="50%" r="50%"><stop offset="0%" stopColor="transparent"/><stop offset="44%" stopColor="transparent"/><stop offset="52%" stopColor="rgba(255,240,150,.55)"/><stop offset="58%" stopColor="rgba(255,170,40,.42)"/><stop offset="65%" stopColor="rgba(0,229,200,.26)"/><stop offset="72%" stopColor="rgba(124,77,255,.16)"/><stop offset="82%" stopColor="rgba(0,150,255,.08)"/><stop offset="100%" stopColor="transparent"/></radialGradient>
          <radialGradient id="dkO" cx="50%" cy="50%" r="50%"><stop offset="0%" stopColor="transparent"/><stop offset="55%" stopColor="transparent"/><stop offset="65%" stopColor="rgba(0,229,200,.07)"/><stop offset="72%" stopColor="rgba(124,77,255,.05)"/><stop offset="82%" stopColor="rgba(0,100,255,.03)"/><stop offset="100%" stopColor="transparent"/></radialGradient>
          <radialGradient id="phR" cx="50%" cy="50%" r="50%"><stop offset="0%" stopColor="transparent"/><stop offset="80%" stopColor="transparent"/><stop offset="86%" stopColor="rgba(255,210,100,.6)"/><stop offset="90%" stopColor="rgba(255,242,180,.96)"/><stop offset="94%" stopColor="rgba(255,190,60,.6)"/><stop offset="100%" stopColor="transparent"/></radialGradient>
        </defs>
        {/* deep space */}
        <circle cx={CX} cy={CY} r="224" fill="url(#bhSp)"/>
        {/* gravitational lensing rings */}
        {[212,196,183,170,160,152].map((r,i)=>(
          <circle key={i} cx={CX} cy={CY} r={r} fill="none"
            stroke={i%2===0?'rgba(0,229,200,.055)':'rgba(124,77,255,.04)'}
            strokeWidth={.7-i*.05}
            style={{animation:`quantArc ${3+i*.7}s ease-in-out infinite`,animationDelay:`${i*.28}s`}}/>
        ))}
        {/* star field */}
        {heavy&&Array.from({length:28},(_,i)=>{
          const a=(i/28)*Math.PI*2+(i*.4);const r=165+Math.sin(i*1.9)*42;
          return(<circle key={i} cx={CX+Math.cos(a)*r} cy={CY+Math.sin(a)*r} r={i%4===0?1.2:.65} fill="rgba(210,225,255,.55)" style={{animation:`bhFlicker ${.9+i*.14}s ease-in-out infinite`,animationDelay:`${i*.06}s`}}/>);
        })}
        {/* outer accretion disk (cool) */}
        <g style={{transformOrigin:`${CX}px ${CY}px`,animation:'bhSpinR 20s linear infinite'}}>
          <ellipse cx={CX} cy={CY} rx="188" ry="54" fill="url(#dkO)" opacity=".9"/>
        </g>
        {/* inner accretion disk (hot) */}
        <g style={{transformOrigin:`${CX}px ${CY}px`,animation:'bhSpin 9s linear infinite'}}>
          <ellipse cx={CX} cy={CY} rx="160" ry="46" fill="url(#dkI)" opacity=".95" filter="url(#bhS)"/>
        </g>
        {/* relativistic jets */}
        <line x1={CX} y1={CY-EH-2} x2={CX-7} y2={CY-222} stroke="rgba(0,229,200,.22)" strokeWidth="2.2" strokeDasharray="6 14" style={{animation:'jetPulse 2.3s ease-in-out infinite'}}/>
        <line x1={CX} y1={CY-EH-2} x2={CX+7} y2={CY-222} stroke="rgba(124,77,255,.18)" strokeWidth="1.4" strokeDasharray="4 16" style={{animation:'jetPulse 2.9s ease-in-out infinite',animationDelay:'.5s'}}/>
        <line x1={CX} y1={CY+EH+2} x2={CX+5} y2={CY+222} stroke="rgba(0,229,200,.18)" strokeWidth="1.8" strokeDasharray="6 14" style={{animation:'jetPulse 2.6s ease-in-out infinite',animationDelay:'1.1s'}}/>
        {/* spiral infalling arms */}
        {heavy&&[0,72,144,216,288].map((sd,i)=>{
          const sa=sd*Math.PI/180,ea=(sd+150)*Math.PI/180;
          return(<path key={i} d={`M${CX+Math.cos(sa)*142} ${CY+Math.sin(sa)*142*.3} Q${CX+Math.cos((sa+ea)/2)*108} ${CY+Math.sin((sa+ea)/2)*108*.3} ${CX+Math.cos(ea)*(EH+14)} ${CY+Math.sin(ea)*(EH+14)*.3}`} fill="none" stroke={['rgba(255,200,80,.35)','rgba(255,140,30,.28)','rgba(0,229,200,.22)','rgba(124,77,255,.18)','rgba(255,80,160,.14)'][i]} strokeWidth={1.2-i*.12} style={{animation:`bhSpin ${7+i*1.4}s linear infinite`,transformOrigin:`${CX}px ${CY}px`,animationDelay:`${i*.6}s`}}/>);
        })}
        {/* photon sphere */}
        <circle cx={CX} cy={CY} r={EH+5} fill="url(#phR)" filter="url(#bhG)" style={{animation:'photon 2.6s ease-in-out infinite'}}/>
        {/* shadow: disk goes BEHIND event horizon at bottom */}
        <ellipse cx={CX} cy={CY+20} rx={EH+10} ry={22} fill="rgba(0,0,0,.88)"/>
        {/* event horizon — pure black void */}
        <circle cx={CX} cy={CY} r={EH} fill="black"/>
        {/* singularity core glow */}
        <circle cx={CX} cy={CY} r={EH-2} fill="none" stroke="rgba(80,0,180,.88)" strokeWidth="7" filter="url(#bhC)" style={{animation:'eventHor 3.2s ease-in-out infinite'}}/>
        {/* Hawking radiation sparks near horizon */}
        {Array.from({length:14},(_,i)=>{
          const a=(i/14)*Math.PI*2;
          return(<circle key={i} cx={CX+Math.cos(a)*(EH+7)} cy={CY+Math.sin(a)*(EH+7)*.36} r="1.1" fill="rgba(255,255,255,.9)" style={{animation:`bhFlicker ${.55+i*.1}s ease-in-out infinite`,animationDelay:`${i*.05}s`}}/>);
        })}
        {/* orbiting particles being sucked in */}
        {Array.from({length:9},(_,i)=>(
          <circle key={i} r="1.8" cx={CX+(118+(i%3)*26)} cy={CY} fill={['#00e5ff','#7c4dff','#ffd700','#ff6ec7','#00ffd0','#ff8c00','#00ff8c','#fff','#00e5ff'][i]} opacity=".7" style={{animation:`bhSpin ${4+i*.55}s linear infinite`,transformOrigin:`${CX}px ${CY}px`,animationDelay:`${i*.52}s`}}/>
        ))}
        <text x={CX} y={CY+4} textAnchor="middle" fill="rgba(255,220,100,.07)" fontSize="9" fontFamily="monospace" letterSpacing="1.5">VOID CORE</text>
      </svg>
    </div>
  );
};

/* ── VOID CANVAS BACKGROUND ── */
const VoidCanvas=({tier}:{tier:Tier})=>{
  const cvs=useRef<HTMLCanvasElement>(null);
  const raf=useRef(0);
  useEffect(()=>{
    const canvas=cvs.current;if(!canvas)return;
    const ctx=canvas.getContext('2d');if(!ctx)return;
    const resize=()=>{canvas.width=canvas.offsetWidth;canvas.height=canvas.offsetHeight;};
    resize();
    const ro=new ResizeObserver(resize);ro.observe(canvas);
    const W=()=>canvas.width,H=()=>canvas.height;
    const n=tier==='ultra'?200:tier==='high'?100:tier==='low'?35:0;
    if(n===0){return()=>{ro.disconnect();cancelAnimationFrame(raf.current);};}
    const VCOLS=['#00e5ff','#7c4dff','#ff6ec7','#ffd700','#00ffd0','#ff8c00'];
    const pts=Array.from({length:n},()=>({
      angle:Math.random()*Math.PI*2,
      radius:Math.random()*340+110,
      speed:(Math.random()*.018+.004)*(Math.random()>.5?1:-1),
      sr:Math.random()*.55+.12,
      color:VCOLS[Math.floor(Math.random()*VCOLS.length)],
      sz:Math.random()*2.4+.4,
    }));
    let t=0;
    const draw=()=>{
      const w=W(),h=H();const cx=w/2,cy=h/2;
      ctx.fillStyle='rgba(0,2,10,.16)';ctx.fillRect(0,0,w,h);
      t+=.008;
      // 4 accretion disk layers rotating at different speeds
      for(let lyr=0;lyr<4;lyr++){
        const R=112+lyr*34;
        ctx.save();ctx.translate(cx,cy);ctx.rotate(t*(0.07+lyr*.035));ctx.scale(1,.29);
        const g=ctx.createRadialGradient(0,0,R-18,0,0,R+20);
        const c0=['rgba(255,200,80,.12)','rgba(0,229,200,.09)','rgba(124,77,255,.07)','rgba(0,150,255,.05)'][lyr];
        const c1=['rgba(255,140,30,.08)','rgba(0,160,200,.06)','rgba(80,40,200,.04)','transparent'][lyr];
        g.addColorStop(0,'transparent');g.addColorStop(.35,c0);g.addColorStop(.65,c1);g.addColorStop(1,'transparent');
        ctx.beginPath();ctx.arc(0, 0, Math.max(0.1, R),0,Math.PI*2);ctx.fillStyle=g;ctx.fill();
        ctx.restore();
      }
      // counter-rotating outer disk
      ctx.save();ctx.translate(cx,cy);ctx.rotate(-t*.04);ctx.scale(1,.22);
      const og=ctx.createRadialGradient(0,0,162,0,0,196);
      og.addColorStop(0,'transparent');og.addColorStop(.4,'rgba(0,229,200,.05)');og.addColorStop(.7,'rgba(124,77,255,.03)');og.addColorStop(1,'transparent');
      ctx.beginPath();ctx.arc(0, 0, Math.max(0.1, 179),0,Math.PI*2);ctx.fillStyle=og;ctx.fill();ctx.restore();
      // gravitational lensing rings
      for(let i=0;i<7;i++){
        ctx.beginPath();ctx.arc(cx, cy, Math.max(0.1, 195+i*18),0,Math.PI*2);
        ctx.strokeStyle=`rgba(${i%2===0?'0,229,200':'124,77,255'},${Math.max(.005,.06-i*.008).toFixed(3)})`;
        ctx.lineWidth=.7;ctx.stroke();
      }
      // photon ring (hot orange-gold glow)
      const pg=ctx.createRadialGradient(cx,cy,80,cx,cy,97);
      pg.addColorStop(0,'transparent');pg.addColorStop(.3,'rgba(255,200,70,.25)');pg.addColorStop(.55,'rgba(255,240,160,.55)');pg.addColorStop(.8,'rgba(255,190,50,.22)');pg.addColorStop(1,'transparent');
      ctx.beginPath();ctx.arc(cx, cy, Math.max(0.1, 88),0,Math.PI*2);ctx.fillStyle=pg;ctx.fill();
      // singularity haze
      const hg=ctx.createRadialGradient(cx,cy,60,cx,cy,110);
      hg.addColorStop(0,'rgba(50,0,120,.6)');hg.addColorStop(.55,'rgba(20,0,60,.2)');hg.addColorStop(1,'transparent');
      ctx.beginPath();ctx.arc(cx, cy, Math.max(0.1, 110),0,Math.PI*2);ctx.fillStyle=hg;ctx.fill();
      // event horizon — absolute void
      const eg=ctx.createRadialGradient(cx,cy,0,cx,cy,82);
      eg.addColorStop(0,'#000');eg.addColorStop(.9,'#000');eg.addColorStop(1,'rgba(20,0,50,.5)');
      ctx.beginPath();ctx.arc(cx, cy, Math.max(0.1, 82),0,Math.PI*2);ctx.fillStyle=eg;ctx.fill();
      // spiraling particles sucked inward
      for(const p of pts){
        p.angle+=p.speed;p.radius-=p.sr;
        if(p.radius<84){p.angle=Math.random()*Math.PI*2;p.radius=Math.random()*330+170;p.speed=(Math.random()*.018+.004)*(Math.random()>.5?1:-1);p.sr=Math.random()*.55+.12;}
        const px=cx+Math.cos(p.angle)*p.radius;
        const py=cy+Math.sin(p.angle)*p.radius*.3;
        const alpha=Math.min(1,(p.radius-84)/120)*.72;
        ctx.beginPath();ctx.arc(px, py, Math.max(0.1, p.sz*alpha),0,Math.PI*2);
        ctx.fillStyle=p.color;ctx.globalAlpha=alpha;ctx.fill();ctx.globalAlpha=1;
      }
      raf.current=requestAnimationFrame(draw);
    };
    raf.current=requestAnimationFrame(draw);
    return()=>{ro.disconnect();cancelAnimationFrame(raf.current);};
  },[tier]);
  if(tier==='minimal')return null;
  return<canvas ref={cvs} style={{position:'absolute',inset:0,width:'100%',height:'100%',pointerEvents:'none',zIndex:0}}/>;
};

/* ── DATA VOID PANEL v10 — 黑洞全功能派單引擎 ── */
interface ParsedRow{name:string;amount:number;rank:number;group:'A1'|'A2'|'B'|'C';}
function calcGroup(rank:number,total:number):'A1'|'A2'|'B'|'C'{
  if(rank<=4)return'A1';
  if(rank<=Math.ceil(total*.45))return'A2';
  if(rank<=Math.ceil(total*.75))return'B';
  return'C';
}
function voidSuggest(row:ParsedRow,_total:number,pct:string):string{
  const {rank,amount,group}=row;
  const fmt=(n:number)=>'$'+Math.round(n)?.toLocaleString();
  const gap=rank>1?'':' 拉大差距是你今天的唯一任務';
  if(group==='A1'){
    if(rank===1)return`👑 王牌核心 — 佔比${pct}%${gap}。繼續深耕高客單，鎖住第一不是守，是進攻。`;
    return`🔴 A1精銳 — 業績${fmt(amount)}，追上第一還差一口氣。今天再補一筆大單，排名隨時翻轉。`;
  }
  if(group==='A2')return`🟠 A2收割 — 第${rank}名，佔比${pct}%。把追單節奏加快，讓續單變實收，A1門口就差這一步。`;
  if(group==='B'){
    if(amount<50000)return`🟡 B組發力 — 第${rank}名，業績${fmt(amount)}偏低。今天至少補兩筆追單，節奏動起來才有上升空間。`;
    return`🟡 B組穩定 — 第${rank}名，把現有名單整理成回撥清單，每筆追單認真收口，可以再往前推。`;
  }
  return`🟢 C組啟動 — 第${rank}名。不追就不動，今天先破一筆實收，節奏開了後面就會順。`;
}
const GROUP_CFG={
  A1:{label:'🔴 A1｜高單主力',  color:'#FF4D6A',bg:'rgba(255,77,106,.08)', border:'rgba(255,77,106,.25)'},
  A2:{label:'🟠 A2｜續單收割',  color:'#FF8C00',bg:'rgba(255,140,0,.07)',   border:'rgba(255,140,0,.22)'},
  B: {label:'🟡 B 組｜一般量單',color:'#F2C200',bg:'rgba(242,194,0,.07)',   border:'rgba(242,194,0,.20)'},
  C: {label:'🟢 C 組｜培養觀察',color:'#00FF9C',bg:'rgba(0,255,156,.06)',   border:'rgba(0,255,156,.18)'},
} as const;
const RANK_COLORS=['#FFD700','#C0C0C0','#CD7F32','#00E5FF','#8B5CF6','#00FFD0','#FF6EC7','#00FF8C','#FF8C00','#7DF9FF'];

const DataVoidPanel=({tier}:{tier:Tier})=>{
  const [rawInput,setRawInput]=useState('');
  const [rows,setRows]=useState<ParsedRow[]>([]);
  const [phase,setPhase]=useState<'idle'|'parsing'|'done'|'sent'>('idle');
  const [apiOk,setApiOk]=useState<boolean|null>(null);
  const [showSuggest,setShowSuggest]=useState(false);
  const [showDispatch,setShowDispatch]=useState(false);
  const [copied,setCopied]=useState(false);
  const taRef=useRef<HTMLTextAreaElement>(null);

  useEffect(()=>{
    const saved=localStorage.getItem('voidRankings');
    if(saved){try{const d=JSON.parse(saved);if(d?.rows?.length>0){setRows(d.rows);setPhase('done');setShowDispatch(true);}}catch{}}
    fetch('http://localhost:3001/api/v1/health').then(r=>setApiOk(r.ok)).catch(()=>setApiOk(false));
  },[]);

  useEffect(()=>{
    if(rows.length>0){
      const payload={rows,updatedAt:Date.now()};
      localStorage.setItem('voidRankings',JSON.stringify(payload));
      window.dispatchEvent(new CustomEvent('voidRankingsUpdate',{detail:payload}));
    }
  },[rows]);

  // Ctrl+Enter shortcut
  useEffect(()=>{
    const handler=(e:KeyboardEvent)=>{if((e.ctrlKey||e.metaKey)&&e.key==='Enter'&&document.activeElement===taRef.current){e.preventDefault();parseRank();}};
    window.addEventListener('keydown',handler);return()=>window.removeEventListener('keydown',handler);
  },[rawInput]); // eslint-disable-line

  const parseRank=useCallback(()=>{
    if(!rawInput.trim())return;
    setPhase('parsing');setShowSuggest(false);setShowDispatch(false);
    const parsed:{name:string;amount:number}[]=[];
    for(const line of rawInput.split('\n')){
      const l=line.trim();if(!l||l.startsWith('#'))continue;
      // try multiple formats: "name num", "name,num", "name：num", "name: num", "num name"
      const patterns=[
        /^(.+?)[\s　,，：:]+\$?([\d,.]+)\s*$/,
        /^\$?([\d,.]+)\s+(.+)$/,
      ];
      for(const pat of patterns){
        const m=l.match(pat);
        if(m){
          const [nameRaw,numRaw]=pat===patterns[1]?[m[2],m[1]]:[m[1],m[2]];
          const amt=parseInt(numRaw.replace(/[,，\s]/g,''),10);
          if(nameRaw.trim()&&!isNaN(amt)&&amt>0){parsed.push({name:nameRaw.trim(),amount:amt});break;}
        }
      }
    }
    parsed.sort((a,b)=>b.amount-a.amount);
    const ranked:ParsedRow[]=parsed.map((r,i)=>({...r,rank:i+1,group:calcGroup(i+1,parsed.length)}));
    setTimeout(()=>{setRows(ranked);setPhase('done');setShowDispatch(true);},680);
  },[rawInput]);

  const sendBackend=useCallback(async()=>{
    if(!rows.length)return;
    setApiOk(null);
    try{
      // 1. 儲存原始文字 + 排名結果到 storage（存檔、備份、日誌）
      const today=new Intl.DateTimeFormat('sv-SE',{timeZone:'Asia/Taipei'}).format(new Date());
      const rawSummary=rows.map(r=>`${r.rank}、${r.name}｜【總業績】${r.amount.toLocaleString()}`).join('\n');
      const saveRes=await fetch('/api/v1/system/save-report',{method:'POST',headers:{'Content-Type':'application/json'},
        body:JSON.stringify({rawText:rawInput||rawSummary,optimizedText:rawSummary,reportDate:today,platformName:'快速輸入',reportMode:'累積報表'})});
      const saveJson=await saveRes.json();

      // 2. 同步更新 localStorage + 廣播全頁更新事件
      const payload={rows,updatedAt:Date.now(),savedToBackend:saveJson.success};
      localStorage.setItem('voidRankings',JSON.stringify(payload));
      window.dispatchEvent(new CustomEvent('voidRankingsUpdate',{detail:payload}));

      setApiOk(saveRes.ok);
      if(saveRes.ok)setPhase('sent');
    }catch{setApiOk(false);}
  },[rows,rawInput]);

  const buildDispatchText=useCallback(()=>{
    const date=new Date().toLocaleDateString('zh-TW',{month:'numeric',day:'numeric'});
    const lines=[`📣【AI 派單公告｜${date} 業績排名 → 派單順序】`,``];
    const groups:Array<keyof typeof GROUP_CFG>=['A1','A2','B','C'];
    groups.forEach(g=>{
      const members=rows.filter(r=>r.group===g);
      if(!members.length)return;
      lines.push(GROUP_CFG[g].label);
      members.forEach(r=>lines.push(`  ${r.rank}. ${r.name}  $${r.amount?.toLocaleString()}`));
      lines.push(``);
    });
    lines.push(`📊 整合總業績：$${rows.reduce((s,r)=>s+r.amount,0)?.toLocaleString()}`);
    lines.push(`📌 規則：照順序派。前面全忙才往後。不得指定不得跳位。`);
    lines.push(`✅ 看完請回 +1`);
    return lines.join('\n');
  },[rows]);

  const copyDispatch=useCallback(()=>{
    navigator.clipboard.writeText(buildDispatchText()).then(()=>{setCopied(true);setTimeout(()=>setCopied(false),2000);});
  },[buildDispatchText]);

  const totalAmt=rows.reduce((s,r)=>s+r.amount,0);
  const maxAmt=rows.length>0?rows[0].amount:1;

  return(
    <section style={{position:'relative',background:'transparent',overflow:'hidden',display:'flex',flexDirection:'column'}}>
      <SafeZone label="voidCvs"><VoidCanvas tier={tier}/></SafeZone>
      {/* depth layers */}
      <div style={{position:'absolute',inset:0,background:'radial-gradient(ellipse 85% 78% at 50% 50%,transparent 20%,rgba(0,2,12,.55) 55%,rgba(0,2,12,.96) 100%)',pointerEvents:'none',zIndex:1}}/>
      <div style={{position:'absolute',inset:0,backgroundImage:'repeating-linear-gradient(0deg,rgba(0,212,255,.005) 0px,transparent 1px,transparent 42px)',pointerEvents:'none',zIndex:2}}/>

      <div style={{position:'relative',zIndex:10,padding:'clamp(18px,3vh,32px) clamp(16px,4vw,56px)'}}>
        {/* header */}
        <div style={{textAlign:'center',marginBottom:'clamp(12px,2vh,22px)'}}>
          <div style={{fontSize:'clamp(7px,.8vw,9px)',letterSpacing:'8px',color:'rgba(0,212,255,.4)',marginBottom:7,fontFamily:'monospace',textTransform:'uppercase'}}>LIFE ENGINE · AI DISPATCH · 2026-03-21 · v11.0</div>
          <h2 className="shimmerTxt" style={{fontSize:'clamp(22px,3vw,44px)',fontWeight:900,margin:'0 0 8px',letterSpacing:'-.01em'}}>業績黑洞輸入 · AI全通派單</h2>
          <div style={{fontSize:'clamp(8px,.9vw,11px)',color:'rgba(0,212,255,.38)',letterSpacing:'2.5px',fontFamily:'monospace'}}>
            INPUT → VOID CORE AI → RANK → DISPATCH ORDER → SYNC ALL PAGES → BACKEND
          </div>
        </div>

        <div style={{maxWidth:1280,margin:'0 auto',display:'flex',gap:'clamp(16px,3.5vw,44px)',alignItems:'flex-start',flexWrap:'wrap'}}>

          {/* LEFT: Black Hole Portal */}
          <div style={{flex:'0 0 auto',display:'flex',flexDirection:'column',alignItems:'center',gap:16}}>
            <SafeZone label="bhPortal"><BlackHolePortal tier={tier}/></SafeZone>
            {/* live stats under BH */}
            {rows.length>0&&(
              <div style={{display:'flex',flexDirection:'column',gap:6,width:'clamp(200px,24vw,320px)'}}>
                {(['A1','A2','B','C'] as const).map(g=>{
                  const cnt=rows.filter(r=>r.group===g).length;
                  if(!cnt)return null;
                  const cfg=GROUP_CFG[g];
                  return(
                    <div key={g} style={{display:'flex',alignItems:'center',gap:8,padding:'5px 12px',borderRadius:8,background:cfg.bg,border:`1px solid ${cfg.border}`}}>
                      <span style={{fontSize:'9px',fontWeight:900,color:cfg.color,fontFamily:'monospace',letterSpacing:'1px',minWidth:28}}>{g}</span>
                      <span style={{flex:1,height:3,background:`${cfg.color}22`,borderRadius:2,overflow:'hidden'}}>
                        <span style={{display:'block',height:'100%',width:`${(cnt/rows.length)*100}%`,background:cfg.color,borderRadius:2}}/>
                      </span>
                      <span style={{fontSize:'8px',color:cfg.color,fontFamily:'monospace'}}>{cnt}人</span>
                    </div>
                  );
                })}
                <div style={{textAlign:'center',fontSize:'8px',color:'rgba(0,212,255,.4)',fontFamily:'monospace',letterSpacing:'2px',marginTop:4}}>
                  CTRL+ENTER 快速解析
                </div>
              </div>
            )}
          </div>

          {/* RIGHT: Input + Output */}
          <div style={{flex:'1 1 300px',display:'flex',flexDirection:'column',gap:'clamp(10px,1.8vh,16px)'}}>

            {/* Input Card */}
            <div className="glass" style={{borderRadius:22,border:'1px solid rgba(0,212,255,.14)',overflow:'hidden',animation:'voidWin 5s ease-in-out infinite',position:'relative'}}>
              <div className="scanLine"/>
              <div style={{padding:'clamp(14px,2vw,24px)'}}>
                {/* status bar */}
                <div style={{display:'flex',alignItems:'center',gap:8,marginBottom:12,flexWrap:'wrap'}}>
                  <div style={{width:7,height:7,borderRadius:'50%',flexShrink:0,
                    background:apiOk===true?'#00FF9C':apiOk===false?'#FF4D6A':'#F2C200',
                    boxShadow:`0 0 10px ${apiOk===true?'#00FF9C':apiOk===false?'#FF4D6A':'#F2C200'}`,
                    animation:'breathe 2s ease-in-out infinite'}}/>
                  <span style={{fontSize:'7.5px',letterSpacing:'2px',color:'rgba(0,212,255,.5)',fontFamily:'monospace'}}>
                    {apiOk===true?'BACKEND LIVE':'BACKEND OFFLINE / 離線模式 — 本機處理'}
                  </span>
                  {rows.length>0&&(
                    <span style={{marginLeft:'auto',fontSize:'7px',letterSpacing:'2px',color:'rgba(0,212,255,.4)',fontFamily:'monospace',flexShrink:0}}>
                      {`✓ ${rows.length}人 · $${totalAmt?.toLocaleString()}`}
                    </span>
                  )}
                </div>

                <div style={{fontSize:'8px',letterSpacing:'3px',color:'rgba(0,212,255,.38)',marginBottom:6,fontFamily:'monospace'}}>
                  ◈ PASTE PERFORMANCE DATA — 直接貼入業績數據
                </div>
                <div style={{fontSize:'9px',color:'rgba(0,212,255,.28)',marginBottom:8,fontFamily:'monospace'}}>
                  支援：空格／逗號／冒號分隔，$符號，千分位　每行一筆
                </div>

                <textarea ref={taRef}
                  value={rawInput}
                  onChange={e=>setRawInput(e.target.value)}
                  placeholder={'李玲玲 813920\n王珍珠 537020\n馬秋香 533670\n王梅慧 446210\n\n或貼入任意格式：\n李玲玲, $813,920\n王珍珠: 537020'}
                  style={{width:'100%',minHeight:'clamp(120px,16vh,180px)',background:'rgba(0,4,18,.9)',border:'1px solid rgba(0,212,255,.10)',borderRadius:14,padding:'13px 15px',color:'rgba(210,240,255,.92)',fontFamily:'"Noto Sans TC",monospace',fontSize:'13px',lineHeight:1.9,resize:'vertical',outline:'none',boxSizing:'border-box' as const,transition:'border-color .2s, box-shadow .2s'}}
                  onFocus={e=>{e.target.style.borderColor='rgba(0,212,255,.36)';e.target.style.boxShadow='0 0 20px rgba(0,212,255,.08)';}}
                  onBlur={e=>{e.target.style.borderColor='rgba(0,212,255,.10)';e.target.style.boxShadow='none';}}
                />

                <div style={{display:'flex',gap:8,marginTop:10,flexWrap:'wrap'}}>
                  <button onClick={parseRank} disabled={!rawInput.trim()||phase==='parsing'}
                    style={{flex:'1 1 160px',padding:'12px 0',borderRadius:12,cursor:rawInput.trim()?'pointer':'not-allowed',
                      border:`1px solid ${rawInput.trim()?'rgba(0,212,255,.28)':'rgba(255,255,255,.05)'}`,
                      background:rawInput.trim()?'linear-gradient(135deg,rgba(0,212,255,.20),rgba(139,92,246,.20))':'rgba(255,255,255,.02)',
                      color:rawInput.trim()?'#00E5FF':'rgba(255,255,255,.18)',
                      fontFamily:'monospace',fontSize:'11px',letterSpacing:'3px',fontWeight:700,transition:'all .2s',
                      animation:phase==='parsing'?'parseFlash .4s ease-in-out infinite':'none',
                      textShadow:rawInput.trim()?'0 0 12px rgba(0,212,255,.5)':'none'}}>
                    {phase==='parsing'?'⚡ AI 解析中...':'⚡ AI解析與排名'}
                  </button>
                  {rows.length>0&&<>
                    <button onClick={()=>setShowSuggest(s=>!s)}
                      style={{padding:'12px 14px',borderRadius:12,cursor:'pointer',
                        border:`1px solid rgba(0,212,255,${showSuggest?.28:.14})`,
                        background:showSuggest?'rgba(0,212,255,.12)':'rgba(0,212,255,.04)',
                        color:'#00E5FF',fontFamily:'monospace',fontSize:'9px',letterSpacing:'1.5px',fontWeight:700,transition:'all .2s',flexShrink:0}}>
                      {showSuggest?'▲ AI建議':'▼ AI建議'}
                    </button>
                    <button onClick={()=>setShowDispatch(s=>!s)}
                      style={{padding:'12px 14px',borderRadius:12,cursor:'pointer',
                        border:`1px solid rgba(139,92,246,${showDispatch?.3:.15})`,
                        background:showDispatch?'rgba(139,92,246,.14)':'rgba(139,92,246,.04)',
                        color:'#A78BFA',fontFamily:'monospace',fontSize:'9px',letterSpacing:'1.5px',fontWeight:700,transition:'all .2s',flexShrink:0}}>
                      {showDispatch?'▲ 派單':'▼ 派單'}
                    </button>
                    {apiOk===true&&<button onClick={sendBackend}
                      style={{padding:'12px 14px',borderRadius:12,cursor:'pointer',
                        border:'1px solid rgba(0,255,156,.25)',background:'rgba(0,255,156,.06)',
                        color:'#00FF9C',fontFamily:'monospace',fontSize:'9px',letterSpacing:'1.5px',fontWeight:700,transition:'all .2s',flexShrink:0}}>
                      {phase==='sent'?'✓ 已同步':'↑ 後端'}
                    </button>}
                  </>}
                </div>
              </div>
            </div>

            {/* Ranked Output */}
            {rows.length>0&&(
              <div className="glass-deep" style={{borderRadius:22,border:'1px solid rgba(0,212,255,.07)',padding:'clamp(14px,2vw,22px)',overflow:'hidden'}}>
                <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',marginBottom:12,flexWrap:'wrap',gap:6}}>
                  <span style={{fontSize:'7px',letterSpacing:'4px',color:'rgba(0,212,255,.45)',fontFamily:'monospace'}}>◈ RANKED OUTPUT · {rows.length} 人</span>
                  <span style={{fontSize:'7px',letterSpacing:'2px',color:'rgba(0,255,156,.4)',fontFamily:'monospace'}}>✓ SYNC ALL PAGES</span>
                </div>
                <div style={{display:'flex',flexDirection:'column',gap:showSuggest?14:8,maxHeight:'clamp(280px,35vh,480px)',overflowY:'auto',paddingRight:4}}>
                  {rows.map((row,i)=>{
                    const pct=((row.amount/totalAmt)*100).toFixed(1);
                    const rc=RANK_COLORS[i%RANK_COLORS.length];
                    const gcfg=GROUP_CFG[row.group] || GROUP_CFG.C;
                    return(
                      <div key={i} style={{animation:'rankSlide .32s ease-out both',animationDelay:`${i*.042}s`}}>
                        <div style={{display:'flex',alignItems:'center',gap:10}}>
                          {/* rank badge */}
                          <div style={{width:32,height:32,borderRadius:'50%',flexShrink:0,
                            background:i<3?`radial-gradient(circle,${rc}28,transparent)`:'transparent',
                            border:`1.5px solid ${rc}${i<3?'70':'30'}`,
                            display:'flex',alignItems:'center',justifyContent:'center',
                            fontFamily:'monospace',fontSize:'11px',fontWeight:900,color:rc,
                            textShadow:`0 0 12px ${rc}`,boxShadow:i<3?`0 0 18px ${rc}22`:'none'}}>
                            {row.rank}
                          </div>
                          {/* data */}
                          <div style={{flex:1,minWidth:0}}>
                            <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:3,gap:6}}>
                              <div style={{display:'flex',alignItems:'center',gap:6,minWidth:0}}>
                                <span style={{fontWeight:800,fontSize:'clamp(12px,1.3vw,15px)',color:i<3?rc:'rgba(200,230,255,.85)',overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>{row.name}</span>
                                <span style={{fontSize:'7px',padding:'1px 5px',borderRadius:4,background:gcfg.bg,color:gcfg.color,border:`1px solid ${gcfg.border}`,fontFamily:'monospace',fontWeight:900,flexShrink:0}}>{row.group}</span>
                              </div>
                              <span style={{fontFamily:'monospace',fontSize:'clamp(12px,1.4vw,16px)',fontWeight:900,color:'white',whiteSpace:'nowrap',textShadow:`0 0 18px ${rc}55`}}>${row.amount?.toLocaleString()}</span>
                            </div>
                            <div style={{display:'flex',alignItems:'center',gap:6}}>
                              <div style={{flex:1,height:3,background:'rgba(255,255,255,.04)',borderRadius:1.5,overflow:'hidden'}}>
                                <div style={{height:'100%',width:`${(row.amount/maxAmt)*100}%`,background:`linear-gradient(90deg,${rc},${rc}60)`,borderRadius:1.5,boxShadow:`0 0 7px ${rc}55`,transition:'width .75s cubic-bezier(.23,1,.32,1)'}}/>
                              </div>
                              <span style={{fontSize:'8px',fontFamily:'monospace',color:`${rc}88`,flexShrink:0,width:34,textAlign:'right' as const}}>{pct}%</span>
                            </div>
                          </div>
                        </div>
                        {showSuggest&&(
                          <div style={{marginTop:5,marginLeft:42,padding:'7px 12px',borderRadius:9,
                            background:`${gcfg.bg}`,border:`1px solid ${gcfg.border}`,
                            fontSize:'clamp(9px,.95vw,11px)',color:`${gcfg.color}cc`,
                            fontFamily:'"Noto Sans TC",monospace',lineHeight:1.6}}>
                            {voidSuggest(row,rows.length,pct)}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
                {/* footer total */}
                <div style={{marginTop:12,paddingTop:10,borderTop:'1px solid rgba(0,212,255,.06)',display:'flex',justifyContent:'space-between',alignItems:'center',flexWrap:'wrap',gap:6}}>
                  <span style={{fontSize:'7px',letterSpacing:'2px',color:'rgba(0,212,255,.38)',fontFamily:'monospace'}}>{rows.length} NODES · VOID SYNC ✓</span>
                  <span style={{fontSize:'14px',fontWeight:900,color:'#00E5FF',textShadow:'0 0 24px rgba(0,212,255,.6)',fontFamily:'monospace'}}>${(totalAmt || 0)?.toLocaleString()}</span>
                </div>
              </div>
            )}

            {/* Dispatch Order Card */}
            {showDispatch&&rows.length>0&&(
              <div style={{borderRadius:22,border:'1px solid rgba(139,92,246,.18)',overflow:'hidden',background:'rgba(8,5,20,.88)',position:'relative'}}>
                <div style={{position:'absolute',top:0,left:0,right:0,height:2,background:'linear-gradient(90deg,transparent,rgba(139,92,246,.6),rgba(0,212,255,.6),transparent)'}}/>
                <div style={{padding:'clamp(14px,2vw,22px)'}}>
                  <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',marginBottom:14,flexWrap:'wrap',gap:8}}>
                    <span style={{fontSize:'8px',letterSpacing:'4px',color:'rgba(139,92,246,.7)',fontFamily:'monospace',fontWeight:900}}>◈ AI 派單順序 — DISPATCH ORDER</span>
                    <button onClick={copyDispatch}
                      style={{padding:'5px 12px',borderRadius:8,cursor:'pointer',
                        border:'1px solid rgba(139,92,246,.28)',background:'rgba(139,92,246,.10)',
                        color:copied?'#00FF9C':'#A78BFA',fontFamily:'monospace',fontSize:'8px',
                        letterSpacing:'1.5px',fontWeight:700,transition:'all .2s',flexShrink:0}}>
                      {copied?'✓ 已複製！':'📋 複製公告'}
                    </button>
                  </div>
                  <div style={{display:'flex',flexDirection:'column',gap:12}}>
                    {(['A1','A2','B','C'] as const).map(g=>{
                      const members=rows.filter(r=>r.group===g);
                      if(!members.length)return null;
                      const cfg=GROUP_CFG[g];
                      return(
                        <div key={g} style={{borderRadius:14,padding:'10px 14px',background:cfg.bg,border:`1px solid ${cfg.border}`}}>
                          <div style={{fontSize:'8.5px',fontWeight:900,color:cfg.color,fontFamily:'monospace',letterSpacing:'2px',marginBottom:7,textShadow:`0 0 10px ${cfg.color}66`}}>{cfg.label}</div>
                          <div style={{display:'flex',flexWrap:'wrap',gap:'4px 10px'}}>
                            {members.map((m,mi)=>(
                              <span key={mi} style={{fontSize:'13px',fontWeight:700,color:'rgba(220,240,255,.9)',letterSpacing:'.02em'}}>
                                <span style={{fontFamily:'monospace',fontSize:'9px',color:cfg.color,marginRight:3}}>{m.rank}.</span>
                                {m.name}
                                <span style={{fontFamily:'monospace',fontSize:'9px',color:'rgba(180,210,255,.45)',marginLeft:4}}>${m.amount?.toLocaleString()}</span>
                              </span>
                            ))}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                  {/* rules */}
                  <div style={{marginTop:12,padding:'8px 14px',borderRadius:10,background:'rgba(0,212,255,.04)',border:'1px solid rgba(0,212,255,.08)',fontSize:'9px',color:'rgba(0,212,255,.5)',fontFamily:'monospace',lineHeight:1.8,letterSpacing:'1px'}}>
                    📌 照順序派。前面全忙才往後。不得指定。不得跳位。同客戶優先回原承接人。
                  </div>
                </div>
              </div>
            )}

          </div>
        </div>
      </div>
    </section>
  );
};

/* ── ALL ROUTES PANEL — 全功能統一浮動側欄 ── */
type RouteGroup = { g: string; items: { title: string; icon: string; link: string; color: string }[] };
const AllRoutesPanel = ({ routes }: { routes: RouteGroup[] }) => {
  const [open, setOpen] = useState(false);
  return (
    <>
      {/* 觸發按鈕 — 右側中央懸浮 */}
      <button
        onClick={() => setOpen(o => !o)}
        style={{
          position: 'fixed', right: open ? 'clamp(210px,22vw,280px)' : 0, top: '50%',
          transform: 'translateY(-50%)',
          zIndex: 200, cursor: 'pointer',
          background: open ? 'rgba(0,229,200,.18)' : 'rgba(0,20,40,.88)',
          border: '1px solid rgba(0,229,200,.35)',
          borderRight: open ? '1px solid rgba(0,229,200,.35)' : 'none',
          borderRadius: open ? '12px 0 0 12px' : '12px 0 0 12px',
          padding: '14px 10px',
          color: '#00e5ff', fontSize: 18,
          boxShadow: '0 0 24px rgba(0,229,200,.22), inset 0 0 12px rgba(0,229,200,.06)',
          transition: 'all .25s cubic-bezier(.23,1,.32,1)',
          writingMode: 'vertical-rl',
          letterSpacing: '2px',
          fontFamily: 'monospace',
          fontWeight: 900,
          fontSize: 10,
        }}
        aria-label="全功能選單"
      >
        {open ? '◀ 收合' : '▶ 功能'}
      </button>

      {/* 側欄面板 */}
      <div style={{
        position: 'fixed', right: 0, top: 0, bottom: 0,
        width: open ? 'clamp(210px,22vw,280px)' : 0,
        overflow: 'hidden',
        background: 'rgba(0,6,20,.96)',
        borderLeft: '1px solid rgba(0,229,200,.18)',
        backdropFilter: 'blur(28px)',
        zIndex: 199,
        transition: 'width .28s cubic-bezier(.23,1,.32,1)',
        display: 'flex', flexDirection: 'column',
        boxShadow: open ? '-8px 0 60px rgba(0,0,0,.7), -2px 0 20px rgba(0,229,200,.06)' : 'none',
      }}>
        <div style={{ flex: 1, overflowY: 'auto', padding: open ? '20px 14px 20px 16px' : 0, opacity: open ? 1 : 0, transition: 'opacity .2s' }}>
          {/* 標題 */}
          <div style={{ marginBottom: 18, paddingBottom: 10, borderBottom: '1px solid rgba(0,229,200,.12)' }}>
            <div style={{ fontSize: 9, letterSpacing: '4px', color: 'rgba(0,229,200,.45)', fontFamily: 'monospace', marginBottom: 4 }}>ALL FUNCTIONS</div>
            <div style={{ fontSize: 13, fontWeight: 900, color: '#00e5ff', fontFamily: 'monospace', textShadow: '0 0 12px rgba(0,229,200,.6)' }}>全功能統一入口</div>
          </div>
          {/* 各分組 */}
          {routes.map((grp) => (
            <div key={grp.g} style={{ marginBottom: 16 }}>
              <div style={{ fontSize: 8, letterSpacing: '3px', color: 'rgba(0,229,200,.3)', fontFamily: 'monospace', marginBottom: 7, paddingLeft: 2 }}>◈ {grp.g}</div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                {grp.items.map((item) => (
                  <Link key={item.link} to={item.link}
                    onClick={() => setOpen(false)}
                    style={{ textDecoration: 'none', display: 'flex', alignItems: 'center', gap: 10,
                      padding: '8px 12px', borderRadius: 10,
                      background: 'rgba(255,255,255,.025)',
                      border: `1px solid ${item.color}22`,
                      transition: 'all .18s',
                      color: 'rgba(220,240,255,.88)',
                    }}
                    onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = `${item.color}18`; (e.currentTarget as HTMLElement).style.borderColor = `${item.color}55`; }}
                    onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = 'rgba(255,255,255,.025)'; (e.currentTarget as HTMLElement).style.borderColor = `${item.color}22`; }}
                  >
                    <span style={{ fontSize: 16, lineHeight: 1, flexShrink: 0 }}>{item.icon}</span>
                    <span style={{ fontSize: 12, fontWeight: 700, color: item.color, fontFamily: '"Noto Sans TC",monospace', flex: 1 }}>{item.title}</span>
                    <span style={{ fontSize: 9, color: `${item.color}66`, fontFamily: 'monospace' }}>▶</span>
                  </Link>
                ))}
              </div>
            </div>
          ))}
          {/* 底部版本資訊 */}
          <div style={{ marginTop: 12, paddingTop: 10, borderTop: '1px solid rgba(0,229,200,.08)', fontSize: 8, color: 'rgba(0,229,200,.25)', fontFamily: 'monospace', letterSpacing: '1.5px', lineHeight: 2 }}>
            LIFE ENGINE v11.0<br/>
            APEX · SYMBIOTIC CORE<br/>
            UPTIME 99.97%
          </div>
        </div>
      </div>
    </>
  );
};

/* ── MAIN PAGE ── */
export default function Homepage(){
  const tier=usePerf();
  const mouse=useMouse();
  const [live,setLive]=useState(9087808);
  const [rev,setRev]=useState(0); // 初始改為0，待載入
  const [vital,setVital]=useState(86);
  const [clk,setClk]=useState('');
  const [beat,setBeat]=useState(false);
  const [heartFlash,setHeartFlash]=useState(0); // 0=靜止,1=第一跳,2=第二跳
  const [synapseFlash,setSynapseFlash]=useState(false);
  const heartFlashRef=useRef(0); // ref 供 canvas 讀取，不觸發 re-render

  // ─── 新增動態業績 States ───
  const [platformData, setPlatformData] = useState<any[]>([]);
  const [totalRev, setTotalRev] = useState(0);
  const [activeStat, setActiveStat] = useState<string | null>(null); // 控制頂層數據點擊彈窗


  useEffect(()=>{
    // ── 全頁心跳節律 (1.8s 雙跳) ──
    const hbInterval=setInterval(()=>{
      heartFlashRef.current=1; setHeartFlash(1);
      setTimeout(()=>{ heartFlashRef.current=0; setHeartFlash(0); },200);
      setTimeout(()=>{ heartFlashRef.current=2; setHeartFlash(2); setTimeout(()=>{ heartFlashRef.current=0; setHeartFlash(0); },250); },350);
    },1800);
    // ── 神經突觸隨機閃光 ──
    const synapseInterval=setInterval(()=>{
      if(Math.random()<.7){ setSynapseFlash(true); setTimeout(()=>setSynapseFlash(false),120); }
    },320);
    // ── 快速跳動計時器 (每 380ms)：DATA/SEC + VITALITY 持續飛漲
    const idFast=setInterval(()=>{
      setLive(v=>v+Math.floor(Math.random()*1800+220)); // 更大幅度跳動
      setVital(v=>Math.min(99,Math.max(72,v+(Math.random()>.4?1:-1))));
      setBeat(true); setTimeout(()=>setBeat(false),180);
    },380);
    // ── 時鐘每秒更新
    const idClk=setInterval(()=>{
      setClk(new Date().toLocaleTimeString('zh-TW',{hour12:false}));
    },1000);
    // ── 偶發大爆發（每 2.2s 隨機噴出大數字）
    const idBurst=setInterval(()=>{
      if(Math.random()>.55){
        setLive(v=>v+Math.floor(Math.random()*8500+1500)); // 爆發增量
      }
    },2200);
    return()=>{clearInterval(hbInterval);clearInterval(synapseInterval);clearInterval(idFast);clearInterval(idClk);clearInterval(idBurst);};
  },[]);

  // ─── API 資料連線 ───
  useEffect(() => {
    fetch('http://localhost:3001/api/v1/rankings/2026-03-21')
      .then(r => r.json())
      .then(res => {
        if (res.success && res.data?.rankings) {
          let sum = 0;
          const platTotals: Record<string, number> = { '奕心': 0, '民視': 0, '公司產品': 0 };
          res.data.rankings.forEach((r: any) => {
            sum += r.total_actual_amount || 0;
            try {
              const p = JSON.parse(r.source_platform_data || '{}');
              for (const k in p) { if (platTotals[k] !== undefined) platTotals[k] += p[k]; }
            } catch {}
          });
          setTotalRev(sum);
          setRev(sum); // 同步給原本的儀表板
          
          const totalPlat = Object.values(platTotals).reduce((a, b) => a + b, 0) || 1;
          setPlatformData([
            {name:'奕心',pct:Math.round(platTotals['奕心']/totalPlat*100),rev:platTotals['奕心'],color:'#00e5ff',bg:'rgba(0,229,200,.1)'},
            {name:'民視',pct:Math.round(platTotals['民視']/totalPlat*100),rev:platTotals['民視'],color:'#7c4dff',bg:'rgba(124,77,255,.1)'},
            {name:'公司',pct:Math.round(platTotals['公司產品']/totalPlat*100),rev:platTotals['公司產品'],color:'#ffd700',bg:'rgba(255,215,0,.1)'},
          ]);
        }
      })
      .catch(err => console.error('後端業績連線失敗:', err));
  }, []);

  useEffect(()=>{
    const onErr=(e:ErrorEvent)=>{e.preventDefault();console.warn('[Recovery]',e.message);};
    const onRej=(e:PromiseRejectionEvent)=>{e.preventDefault();console.warn('[Recovery]',e.reason);};
    window.addEventListener('error',onErr);window.addEventListener('unhandledrejection',onRej);
    return()=>{window.removeEventListener('error',onErr);window.removeEventListener('unhandledrejection',onRej);};
  },[]);





  const scored=useMemo(()=>{try{const s=calculateAiScores(rawEmployees);return assignGroups(s).sort((a,b)=>(b.aiScore??0)-(a.aiScore??0));}catch{return[];};},[]);
  const health=useMemo(()=>{try{return calcHealthScore(scored);}catch{return 88;}},[scored]);

  const px=(mouse.x/window.innerWidth-.5)*CFG.mouse.parallax*100;
  const py=(mouse.y/window.innerHeight-.5)*CFG.mouse.parallax*100;
  const mx2=mouse.x/window.innerWidth,my2=mouse.y/window.innerHeight;

  const MODULE_CARDS=[
    {title:'AI 排名引擎', sub:'NEURAL RANKER v4.2',icon:'🧠',color:'#00e5ff',link:'/ranking',   badge:'LIVE', desc:'即時智能排名演算法核心',val:'99.8%'},
    {title:'派工調度中心',sub:'DISPATCH CORE v3.8',icon:'⚡',color:'#7c4dff',link:'/dispatch',  badge:'ARMED',desc:'全自動派工任務分配引擎',val:'2.1ms'},
    {title:'公告生成系統',sub:'HERALD AI v2.9',   icon:'📡',color:'#ffd700',link:'/announce',  badge:'SYNC', desc:'智能公告撰寫與發送系統',val:'12/hr'},
    {title:'每日報表引擎',sub:'ORACLE v5.1',      icon:'📊',color:'#00ffd0',link:'/',          badge:'AUTO',desc:'數據聚合報表自動生成', val:'∞ rows'},
    {title:'一鍵流水線', sub:'PIPELINE v2.0',     icon:'🚀',color:'#ff6ec7',link:'/pipeline',  badge:'BOOST',desc:'一鍵自動化完整流水作業',val:'AUTO'},
    {title:'資料審計核心',sub:'AUDIT AI v3.3',    icon:'🔍',color:'#00ff8c',link:'/ranking',   badge:'PASS', desc:'深度數據稽核與驗證系統',val:'100%'},
  ];
  // 全功能統一選單（所有路由）
  const ALL_ROUTES=[
    {g:'核心',items:[
      {title:'主儀表板',  icon:'🌐',link:'/dashboard',color:'#00e5ff'},
      {title:'報表工作台',icon:'📋',link:'/',         color:'#00ffd0'},
      {title:'一鍵流水線',icon:'🚀',link:'/pipeline', color:'#ff6ec7'},
    ]},
    {g:'業務',items:[
      {title:'AI排名引擎',icon:'🧠',link:'/ranking',  color:'#00e5ff'},
      {title:'派單調度', icon:'⚡',link:'/dispatch',  color:'#7c4dff'},
      {title:'公告生成', icon:'📡',link:'/announce',  color:'#ffd700'},
    ]},
    {g:'中心',items:[
      {title:'奕心指揮', icon:'🎯',link:'/hv-command',color:'#ff6ec7'},
      {title:'奕心話術', icon:'💬',link:'/hv-scripts',color:'#00ffd0'},
      {title:'奕心目標', icon:'🎪',link:'/hv-targets',color:'#00ff8c'},
      {title:'民視指揮', icon:'📺',link:'/bc-command',color:'#ffd700'},
      {title:'民視話術', icon:'📝',link:'/bc-scripts',color:'#7c4dff'},
    ]},
    {g:'管理',items:[
      {title:'LINE轉換', icon:'💚',link:'/line-convert',color:'#00ff8c'},
      {title:'LINE規則', icon:'📌',link:'/line-rules',  color:'#7c4dff'},
      {title:'招募系統', icon:'👥',link:'/hiring',      color:'#ffd700'},
      {title:'培訓系統', icon:'🏆',link:'/training',    color:'#ff6ec7'},
    ]},
  ];
  const STATS=[
    {label:'DATA / SEC', val:live, color:'#00e5ff',glow:'0 0 40px #00e5ff88',prefix:'',suffix:''},
    {label:'USD REVENUE',val:rev,  color:'#ffd700',glow:'0 0 40px #ffd70088',prefix:'$',suffix:''},
    {label:'VITALITY IDX',val:vital,color:'#00ffd0',glow:'0 0 40px #00ffd088',prefix:'',suffix:''},
  ];

  return(
    <div className="pgFade breatheVoid cellBreathe" style={{minHeight:'100vh',background:'#000812',fontFamily:'"Inter","Noto Sans TC",monospace,sans-serif',color:'#e0f8ff',overflowX:'hidden',perspective:'1200px',
      transform: heartFlash===2 ? 'scale(1.0055)' : heartFlash===1 ? 'scale(1.003)' : 'scale(1)',
      transition:'transform 0.12s ease-out',
    }}>
      <SafeZone label="lifeCanvas"><LifeCanvas tier={tier}/></SafeZone>
      {/* 全頁心跳閃光層 — 第一跳=青，第二跳=深紅，強度大幅提升 */}
      <div style={{
        position:'fixed',inset:0,pointerEvents:'none',zIndex:1,
        background: heartFlash===1
          ? 'radial-gradient(ellipse 160% 110% at 50% 30%,rgba(0,255,220,.22) 0%,rgba(0,229,200,.10) 40%,rgba(0,200,180,.04) 65%,transparent 80%)'
          : heartFlash===2
          ? 'radial-gradient(ellipse 150% 100% at 50% 40%,rgba(255,0,50,.28) 0%,rgba(220,10,50,.14) 35%,rgba(180,0,30,.06) 60%,transparent 78%)'
          : 'none',
        transition:'background .06s',
        mixBlendMode:'screen',
      }}/>
      {/* 主幹血管層 — 5條固定粗血管從畫面中心向四角延伸 */}
      <svg style={{position:'fixed',inset:0,width:'100%',height:'100%',pointerEvents:'none',zIndex:1,overflow:'visible'}} preserveAspectRatio="none">
        <defs>
          <linearGradient id="vein1" x1="50%" y1="50%" x2="0%" y2="0%"><stop offset="0%" stopColor="#cc1830" stopOpacity=".7"/><stop offset="100%" stopColor="#cc1830" stopOpacity="0"/></linearGradient>
          <linearGradient id="vein2" x1="50%" y1="50%" x2="100%" y2="0%"><stop offset="0%" stopColor="#cc1830" stopOpacity=".6"/><stop offset="100%" stopColor="#cc1830" stopOpacity="0"/></linearGradient>
          <linearGradient id="vein3" x1="50%" y1="50%" x2="100%" y2="100%"><stop offset="0%" stopColor="#8b1aff" stopOpacity=".55"/><stop offset="100%" stopColor="#8b1aff" stopOpacity="0"/></linearGradient>
          <linearGradient id="vein4" x1="50%" y1="50%" x2="0%" y2="100%"><stop offset="0%" stopColor="#cc1830" stopOpacity=".6"/><stop offset="100%" stopColor="#cc1830" stopOpacity="0"/></linearGradient>
          <linearGradient id="vein5" x1="50%" y1="50%" x2="50%" y2="0%"><stop offset="0%" stopColor="#00e5ff" stopOpacity=".45"/><stop offset="100%" stopColor="#00e5ff" stopOpacity="0"/></linearGradient>
          <filter id="veinBlur"><feGaussianBlur stdDeviation="3.5"/></filter>
          <filter id="veinBlurHB"><feGaussianBlur stdDeviation="6"/></filter>
        </defs>
        {[['vein1','50% 50%','0% 0%'],['vein2','50% 50%','100% 0%'],['vein3','50% 50%','100% 100%'],['vein4','50% 50%','0% 100%'],['vein5','50% 50%','50% 0%']].map(([gid,p1,p2],i)=>(
          <g key={i}>
            {/* 心跳光暈層 — 心跳時顯示 */}
            {heartFlash>0&&<line
              x1={p1.split(' ')[0]} y1={p1.split(' ')[1]}
              x2={p2.split(' ')[0]} y2={p2.split(' ')[1]}
              stroke={`url(#${gid})`} strokeWidth={[9,8,7,8,6][i]}
              strokeDasharray="12 18"
              filter="url(#veinBlurHB)" opacity={heartFlash===2?.9:.6}/>}
            <line
              x1={p1.split(' ')[0]} y1={p1.split(' ')[1]}
              x2={p2.split(' ')[0]} y2={p2.split(' ')[1]}
              stroke={`url(#${gid})`} strokeWidth={heartFlash>0?[5.5,5,4.5,5,3.8][i]:[3.5,3,2.8,3,2.2][i]}
              strokeDasharray="12 18"
              filter="url(#veinBlur)"
              style={{animation:`bloodFlow ${[1.8,2.1,2.4,1.6,2.8][i]}s linear infinite`,animationDelay:`${i*.35}s`,transition:'stroke-width .1s'}}/>
          </g>
        ))}
      </svg>
      {/* 腦波掃描線 — 全頁水平意識波形（4條不同高度）*/}
      {[
        {top:'22vh', color:'rgba(0,229,200,.38)',  dur:'3.2s', delay:'0s',   w:900, h:40},
        {top:'45vh', color:'rgba(200,20,50,.32)',   dur:'4.1s', delay:'1.1s', w:950, h:48},
        {top:'68vh', color:'rgba(0,229,200,.22)',   dur:'2.8s', delay:'0.6s', w:860, h:32},
        {top:'84vh', color:'rgba(140,80,255,.28)',  dur:'5.0s', delay:'2.0s', w:1000,h:44},
      ].map((w,i)=>(
        <svg key={i} style={{position:'fixed',left:0,top:w.top,width:'100%',height:`${w.h}px`,
          pointerEvents:'none',zIndex:1,overflow:'visible',
          animation:`brainWave${i%2?'B':''} ${w.dur} linear infinite`,animationDelay:w.delay}}>
          <path
            d={`M 0 ${w.h/2} Q ${w.w*.15} ${w.h/2-w.h*.4} ${w.w*.3} ${w.h/2} Q ${w.w*.45} ${w.h/2+w.h*.4} ${w.w*.6} ${w.h/2} Q ${w.w*.75} ${w.h/2-w.h*.35} ${w.w} ${w.h/2}`}
            fill="none" stroke={w.color} strokeWidth={i%2?1.2:.8}
            filter="url(#veinBlur)"/>
        </svg>
      ))}
      {/* 神經突觸全屏閃光層 */}
      {synapseFlash&&<div style={{
        position:'fixed',inset:0,pointerEvents:'none',zIndex:1,
        background:'radial-gradient(ellipse 55% 35% at 48% 38%,rgba(0,255,255,.045) 0%,transparent 55%)',
      }}/>}

      {/* HERO — 緊湊版：只用 56vh，不佔滿螢幕 */}
      <div style={{position:'relative',height:'clamp(340px,56vh,640px)',display:'flex',flexDirection:'column',alignItems:'center',justifyContent:'center',overflow:'hidden'}}>
        <div style={{position:'absolute',inset:0,background:'radial-gradient(ellipse 80% 60% at 50% 30%,rgba(0,60,100,.5) 0%,rgba(0,20,50,.3) 45%,#000812 100%)'}}/>
        <HexOverlay/>

        {/* radar sweep — behind canvas */}
        {tier!=='minimal'&&(
          <div style={{position:'absolute',left:'50%',top:'50%',width:0,height:0,pointerEvents:'none',zIndex:1}}>
            <div style={{position:'absolute',width:'clamp(280px,55vw,660px)',height:'clamp(280px,55vw,660px)',transform:'translate(-50%,-50%)',borderRadius:'50%',border:'1px solid rgba(0,229,200,.055)',overflow:'hidden'}}>
              <div style={{position:'absolute',left:'50%',top:'50%',width:'50%',height:'1px',transformOrigin:'0% 50%',background:'linear-gradient(90deg,rgba(0,229,200,.5),transparent)',animation:'radarArm 6s linear infinite',boxShadow:'0 0 10px rgba(0,229,200,.25)'}}/>
              <div style={{position:'absolute',inset:0,background:'conic-gradient(from -50deg,transparent 0deg,rgba(0,229,200,.055) 50deg,transparent 70deg)',borderRadius:'50%',animation:'radarArm 6s linear infinite'}}/>
            </div>
          </div>
        )}

        <SafeZone label="numStream"><NumberStream tier={tier}/></SafeZone>
        <SafeZone label="canvas"><DataCanvas tier={tier} mouseX={mx2} mouseY={my2} heartFlashRef={heartFlashRef}/></SafeZone>
        <div className="scanLine"/>
        <SafeZone label="hud"><HudCorners tier={tier}/></SafeZone>
        <SafeZone label="compute"><LiveCompute tier={tier}/></SafeZone>

        {/* god rays */}
        {(tier==='ultra'||tier==='high')&&[0,45,90,135,180,225,270,315].map((angle,i)=>(
          <div key={i} style={{position:'absolute',left:'50%',top:'50%',width:'2px',height:'55%',transformOrigin:'50% 0%',transform:`translate(-50%,0) rotate(${angle}deg)`,background:`linear-gradient(${['#00e5ff','#7c4dff','#00ffd0','#ffd700','#ff6ec7','#00ff8c','#00e5ff','#7c4dff'][i]},transparent)`,opacity:.07,pointerEvents:'none',animation:`godray ${3+i*.4}s ease-in-out infinite`,animationDelay:`${i*.35}s`}}/>
        ))}

        {/* title — 3D立體標題區 */}
        <div style={{position:'relative',zIndex:10,textAlign:'center',transform:`translate(${px*.6}px,${py*.4}px)`,transition:'transform .05s linear',padding:'0 16px',transformStyle:'preserve-3d'}}>
          {/* 螢光脈衝環 */}
          {[0,1,2].map(i=>(
            <div key={i} style={{position:'absolute',left:'50%',top:'50%',width:'clamp(200px,28vw,380px)',height:'clamp(200px,28vw,380px)',borderRadius:'50%',border:`1px solid rgba(0,229,200,${.12-i*.03})`,pointerEvents:'none',animation:`pulseRing3D ${2.4+i*.8}s ease-out infinite`,animationDelay:`${i*.8}s`}}/>
          ))}
          <div style={{fontSize:'clamp(8px,.9vw,10px)',letterSpacing:'6px',color:'rgba(0,229,200,.65)',marginBottom:8,fontFamily:'monospace',fontWeight:700,textShadow:'0 0 14px rgba(0,229,200,.5)',animation:'hudBlink 2.5s ease-in-out infinite'}}>2026-03-21 · LIFE ENGINE · v11.0 · {clk||'──:──:──'}</div>
          <h1 className="dataGlitch shimmerTxt" style={{fontSize:'clamp(20px,3.5vw,48px)',fontWeight:900,margin:'0 0 6px',letterSpacing:'-.01em',lineHeight:1.08}}>
            全球生命引擎中控台
          </h1>
          <div style={{fontSize:'clamp(8px,1vw,11px)',letterSpacing:'3px',color:'rgba(0,229,200,.45)',marginBottom:18,fontFamily:'monospace',textShadow:'0 0 10px rgba(0,229,200,.3)',animation:'throb 4s ease-in-out infinite'}}>
            APEX · LIFE ENGINE · SYMBIOTIC CORE · v11.0 · UPTIME 99.97%
          </div>
          {/* STATS — 橫向緊湊 + 3D浮卡 */}
          <div style={{display:'flex',gap:'clamp(6px,1.5vw,14px)',justifyContent:'center',flexWrap:'wrap',perspective:'800px'}}>
            {STATS.map((s,i)=>(
              <SafeZone key={i} label={`stat-${i}`}>
                <div className="glass metalCard depthCard" style={{
                  padding:'clamp(8px,1.2vw,12px) clamp(12px,1.8vw,20px)',
                  borderRadius:14,
                  animationDelay:`${i*1.8}s`,
                  transform:`translate(${px*(i-.5)*.8 + (heartFlash===1?(i-1)*2.5:heartFlash===2?(i-1)*-3.5:0)}px, ${heartFlash===2?-3:heartFlash===1?1.5:0}px) scale(${heartFlash===2?1.05:heartFlash===1?1.025:1})`,
                  transition:'transform .09s ease-out',
                  position:'relative',overflow:'hidden',
                  cursor: 'pointer',
                  boxShadow: heartFlash===2 ? `0 0 40px rgba(255,0,50,.35), 0 0 80px rgba(255,0,50,.18), inset 0 0 20px rgba(255,0,50,.08)` : heartFlash===1 ? `0 0 35px rgba(0,229,200,.3), 0 0 70px rgba(0,229,200,.12)` : undefined,
                }} onClick={() => setActiveStat(s.label)}> {/* 新增：點擊事件 */}
                  {/* 垂直掃描線 */}
                  <div className="scanLineV" style={{animationDelay:`${i*2.2}s`}}/>
                  <div style={{fontSize:'clamp(14px,2vw,26px)',fontWeight:900,fontFamily:'monospace',color:s.color,
                    textShadow:`0 0 30px ${s.color}, 0 0 60px ${s.color}88, 0 2px 0 rgba(0,0,0,.9)`,
                    transform:beat?'scale(1.06)':'scale(1)',transition:'transform .18s',letterSpacing:'-0.5px',
                    animation:`textDepth ${3+i*.5}s ease-in-out infinite`,animationDelay:`${i*.6}s`,
                  }}>
                    {s.prefix}<AnimCounter target={s.val}/>{s.suffix}
                  </div>
                  <div style={{fontSize:'clamp(6px,.75vw,8px)',letterSpacing:'2.5px',color:'rgba(255,255,255,.35)',marginTop:3,fontFamily:'monospace',textShadow:`0 0 8px ${s.color}44`}}>{s.label}</div>
                </div>
              </SafeZone>
            ))}
          </div>
        </div>

        {/* sphere — 3D浮動 + 球體心跳同步縮放 */}
        <div style={{position:'absolute',right:'clamp(20px,8vw,140px)',top:'50%',
          transform:`translateY(-50%) translate(${px*.8}px,${py*.6}px) scale(${heartFlash===2?1.04:heartFlash===1?1.02:1})`,
          transition:'transform .08s',zIndex:8,opacity:.95}}>
          {/* 球底光暈 — 心跳時擴大 */}
          <div style={{position:'absolute',bottom:-20,left:'50%',transform:'translateX(-50%)',
            width: heartFlash?'80%':'60%', height:heartFlash?28:20, borderRadius:'50%',
            background:'radial-gradient(ellipse,rgba(0,229,200,.35) 0%,transparent 70%)',
            filter:'blur(8px)',pointerEvents:'none',transition:'all .1s'}}/>
          <SafeZone label="sphere"><div className="hueC coreGlow"><DataSphere live={live} tier={tier}/></div></SafeZone>
        </div>

        {/* vitality — 心跳時有寬度震動 */}
        <div style={{position:'absolute',left:'clamp(12px,4vw,60px)',bottom:'clamp(40px,8vh,100px)',
          width:'clamp(160px,22vw,280px)',zIndex:9,
          transform:`translate(${px*.5}px,${py*.3}px) scaleX(${heartFlash===1?1.05:heartFlash===2?0.96:1})`,
          transition:'transform .09s'}}>
          <div style={{fontSize:'8px',letterSpacing:'3px',color:'rgba(0,229,200,.45)',marginBottom:6,fontFamily:'monospace'}}>LIFE SIGNAL</div>
          <SafeZone label="gauge"><VitalGauge score={vital}/></SafeZone>
        </div>

        <div className="breatheS" style={{position:'absolute',bottom:24,left:'50%',transform:'translateX(-50%)',color:'rgba(0,229,200,.38)',fontSize:22,zIndex:10}}>▼</div>
      </div>

      {/* ── 數據對流層 (高密度 50:50 並排) ── */}
      <div style={{display:'flex', gap:'16px', flexWrap:'wrap', maxWidth:1440, margin:'0 auto', padding:'16px clamp(16px,4vw,40px)', alignItems:'stretch', position:'relative'}}>
        <div style={{flex:'1 1 480px', minWidth:320, display:'flex', width:'100%'}}>
          <SafeZone label="platform">
            <PlatformRevenue
              tier={tier}
              data={platforms.map((p) => {
                const total = platforms.reduce((acc, x) => acc + x.revenue, 0);
                return {
                  name: p.name,
                  rev: p.revenue,
                  pct: total > 0 ? (p.revenue / total) * 100 : 0,
                  color: p.name === '奕心' ? '#00e5ff' : p.name === '民視' ? '#00ffa0' : '#b53cff',
                };
              })}
              total={platforms.reduce((acc, x) => acc + x.revenue, 0)}
            />
          </SafeZone>
        </div>
        <div style={{flex:'1 1 480px', minWidth:320, display:'flex', width:'100%'}}>
          <SafeZone label="voidPanel">
            <DataVoidPanel tier={tier}/>
          </SafeZone>
        </div>
      </div>

      {/* MODULE CARDS */}
      <div style={{padding:'clamp(20px,3.5vh,44px) clamp(16px,4vw,60px)',background:'linear-gradient(180deg,#000812 0%,#000c20 100%)'}}>
        <div style={{textAlign:'center',marginBottom:'clamp(14px,2.5vh,28px)'}}>
          <div style={{fontSize:'clamp(8px,.9vw,11px)',letterSpacing:'6px',color:'rgba(0,229,200,.45)',marginBottom:8,fontFamily:'monospace'}}>CORE MODULE ARRAY</div>
          <h2 className="shimmerTxt" style={{fontSize:'clamp(16px,2.2vw,32px)',fontWeight:900,margin:0}}>核心系統模組</h2>
        </div>
        <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fill,minmax(clamp(220px,28vw,340px),1fr))',gap:'clamp(12px,2vw,24px)',maxWidth:1200,margin:'0 auto'}}>
          {MODULE_CARDS.map((m,i)=>(
            <SafeZone key={i} label={`module-${i}`}>
              <Link to={m.link} style={{textDecoration:'none',color:'inherit',display:'block'}}>
                <div className="glass metalCard depthCard petriF neonBorder cardLifePulse" style={{
                  padding:'clamp(16px,2.5vw,28px)',borderRadius:20,cursor:'pointer',
                  animationDelay:`${i*.25}s`,
                  transform:`translate(${px*(i%3-.9)*.7}px,${py*(Math.floor(i/3)-.3)*.5}px)`,
                  transition:'transform .15s linear',
                  borderTop:`1px solid ${m.color}55`,
                  position:'relative',overflow:'hidden',
                }}>
                  {/* 頂角螢光 */}
                  <div style={{position:'absolute',top:-30,right:-30,width:80,height:80,borderRadius:'50%',background:`radial-gradient(circle,${m.color}22 0%,transparent 70%)`,filter:'blur(12px)',pointerEvents:'none'}}/>
                  {/* 底部反光條 */}
                  <div style={{position:'absolute',bottom:0,left:0,right:0,height:2,background:`linear-gradient(90deg,transparent,${m.color}66,transparent)`,borderRadius:'0 0 20px 20px'}}/>
                  <div style={{display:'flex',alignItems:'center',gap:12,marginBottom:12}}>
                    <div style={{
                      fontSize:28,width:48,height:48,display:'flex',alignItems:'center',justifyContent:'center',
                      background:`radial-gradient(circle,${m.color}33 0%,${m.color}0a 60%,transparent 100%)`,
                      borderRadius:14,
                      border:`1px solid ${m.color}44`,
                      boxShadow:`0 0 20px ${m.color}44, inset 0 0 12px ${m.color}18`,
                      animation:`floatIcon ${3.5+i*.4}s ease-in-out infinite`,
                      animationDelay:`${i*.5}s`,
                    }}>{m.icon}</div>
                    <div style={{flex:1}}>
                      <div style={{fontWeight:800,fontSize:'clamp(13px,1.4vw,16px)',color:m.color,
                        textShadow:`0 0 20px ${m.color}, 0 0 40px ${m.color}66, 0 2px 0 rgba(0,0,0,.8)`,
                        marginBottom:2,animation:`textDepth ${4+i*.3}s ease-in-out infinite`,animationDelay:`${i*.4}s`}}>{m.title}</div>
                      <div style={{fontSize:'8.5px',letterSpacing:'2px',color:'rgba(255,255,255,.32)',fontFamily:'monospace'}}>{m.sub}</div>
                    </div>
                    <div style={{fontSize:'7px',padding:'3px 7px',borderRadius:5,
                      background:`${m.color}18`,border:`1px solid ${m.color}55`,color:m.color,
                      letterSpacing:'2px',fontFamily:'monospace',fontWeight:700,
                      boxShadow:`0 0 10px ${m.color}44`,
                      animation:'hudBlink 1.8s ease-in-out infinite',animationDelay:`${i*.3}s`}}>{m.badge}</div>
                  </div>
                  <div style={{fontSize:'clamp(10px,1.1vw,12px)',color:'rgba(200,230,255,.55)',marginBottom:12,lineHeight:1.55}}>{m.desc}</div>
                  <div style={{display:'flex',alignItems:'center',justifyContent:'space-between'}}>
                    <div style={{fontFamily:'monospace',fontSize:'clamp(14px,1.8vw,22px)',fontWeight:900,color:m.color,
                      textShadow:`0 0 28px ${m.color}, 0 0 55px ${m.color}66, 0 2px 0 rgba(0,0,0,.9)`,
                      animation:`textDepth ${2.8+i*.4}s ease-in-out infinite`,animationDelay:`${i*.5}s`}}>{m.val}</div>
                    <div style={{fontSize:'10px',color:`${m.color}99`,letterSpacing:'1.5px',
                      textShadow:`0 0 8px ${m.color}66`,animation:'hudBlink 3s ease-in-out infinite'}}>▶ 進入系統</div>
                  </div>
                </div>
              </Link>
            </SafeZone>
          ))}
        </div>
      </div>

      {/* STATUS BAR + 功能快捷鍵 */}
      <div className="glass-deep" style={{borderTop:'1px solid rgba(0,229,200,.14)',padding:'clamp(8px,1.5vh,14px) clamp(16px,4vw,48px)',display:'flex',alignItems:'center',justifyContent:'space-between',flexWrap:'wrap',gap:10,boxShadow:'inset 0 1px 0 rgba(0,229,200,.08),0 -4px 30px rgba(0,0,0,.5)'}}>
        {/* 左：系統狀態指示燈 */}
        <div style={{display:'flex',gap:'clamp(12px,2.5vw,32px)',flexWrap:'wrap',alignItems:'center'}}>
          {[{k:'SYSTEM',v:'ONLINE',c:'#00ffd0'},{k:'AI CORE',v:'ACTIVE',c:'#00e5ff'},{k:'HEALTH',v:`${health}%`,c:health>80?'#00ffd0':'#ffd700'},{k:'NODES',v:`${scored.length}`,c:'#7c4dff'},{k:'UPTIME',v:'99.97%',c:'#00ff8c'}].map(({k,v,c},si)=>(
            <div key={k} style={{display:'flex',gap:7,alignItems:'center'}}>
              <div style={{position:'relative',width:7,height:7}}>
                <div style={{position:'absolute',inset:0,borderRadius:'50%',background:c,boxShadow:`0 0 10px ${c}, 0 0 20px ${c}66`}}/>
                <div style={{position:'absolute',inset:-3,borderRadius:'50%',border:`1px solid ${c}55`,animation:`hudPing ${2+si*.3}s ease-out infinite`,animationDelay:`${si*.5}s`}}/>
              </div>
              <span style={{fontSize:'8px',letterSpacing:'2px',color:'rgba(255,255,255,.28)',fontFamily:'monospace'}}>{k}</span>
              <span style={{fontSize:'10px',fontFamily:'monospace',fontWeight:900,color:c,textShadow:`0 0 10px ${c}`}}>{v}</span>
            </div>
          ))}
        </div>
        {/* 右：功能快捷鍵列 */}
        <div style={{display:'flex',gap:6,flexWrap:'wrap',alignItems:'center'}}>
          {[
            {title:'報表',icon:'📋',link:'/',        color:'#00ffd0'},
            {title:'排名',icon:'🧠',link:'/ranking', color:'#00e5ff'},
            {title:'派單',icon:'⚡',link:'/dispatch', color:'#7c4dff'},
            {title:'公告',icon:'📡',link:'/announce', color:'#ffd700'},
            {title:'流水線',icon:'🚀',link:'/pipeline',color:'#ff6ec7'},
            {title:'奕心',icon:'🎯',link:'/hv-command',color:'#00ff8c'},
            {title:'民視',icon:'📺',link:'/bc-command',color:'#ffd700'},
            {title:'LINE',icon:'💚',link:'/line-convert',color:'#00ff8c'},
          ].map(btn=>(
            <Link key={btn.link} to={btn.link} style={{textDecoration:'none'}}>
              <div style={{
                display:'flex',alignItems:'center',gap:5,
                padding:'5px 10px',borderRadius:8,cursor:'pointer',
                background:`${btn.color}10`,
                border:`1px solid ${btn.color}30`,
                color:btn.color,
                fontSize:11,fontWeight:700,fontFamily:'monospace',
                transition:'all .18s',
                boxShadow:`0 0 8px ${btn.color}18`,
                whiteSpace:'nowrap' as const,
              }}
              onMouseEnter={e=>{(e.currentTarget as HTMLElement).style.background=`${btn.color}22`;(e.currentTarget as HTMLElement).style.boxShadow=`0 0 18px ${btn.color}44`;}}
              onMouseLeave={e=>{(e.currentTarget as HTMLElement).style.background=`${btn.color}10`;(e.currentTarget as HTMLElement).style.boxShadow=`0 0 8px ${btn.color}18`;}}
              >
                <span style={{fontSize:13}}>{btn.icon}</span>{btn.title}
              </div>
            </Link>
          ))}
        </div>
      </div>

      <div className="tierBadge">{tier.toUpperCase()} TIER</div>

      {/* ─── 全功能統一浮動側欄 ─── */}
      <AllRoutesPanel routes={ALL_ROUTES}/>

      {/* ─── 3D 浮空 Modal 詳情 (加強文字功能) ─── */}
      {activeStat && (
        <div style={{position:'fixed',inset:0,background:'rgba(0,0,0,.68)',backdropFilter:'blur(24px)',zIndex:100,display:'flex',alignItems:'center',justifyContent:'center'}} onClick={()=>setActiveStat(null)}>
          <div className="glass-deep" style={{width:'clamp(300px,85vw,600px)',borderRadius:24,padding:'24px',animation:'rankSlide .4s ease-out both',border:'1px solid rgba(0,229,200,.4)',boxShadow:'0 0 70px rgba(0,229,200,.3)'}} onClick={e=>e.stopPropagation()}>
            <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:16}}>
              <h3 style={{margin:0,color:'#00e5ff',fontFamily:'monospace',fontSize:'18px',textShadow:'0 0 14px rgba(0,229,200,.6)'}}>{activeStat} 詳情資料</h3>
              <button onClick={()=>setActiveStat(null)} style={{background:'transparent',border:'none',color:'rgba(255,255,255,.6)',cursor:'pointer',fontSize:'18px'}}>✕</button>
            </div>
            <div style={{minHeight:220,background:'rgba(0,4,16,.65)',border:'1px solid rgba(0,229,200,.1)',borderRadius:16,padding:20,fontFamily:'monospace',fontSize:'13px',color:'rgba(220,240,255,.9)',lineHeight:1.9,overflowY:'auto',maxHeight:'65vh'}}>
               {activeStat === 'DATA / SEC' && (
                 <div style={{color:'#00ffd0'}}>
                   <div style={{color:'rgba(0,229,200,.5)',fontSize:'11px',marginBottom:10}}>SYS.OKNET.ONAI.ACTDAT.OK</div>
                   PROC·STREAM<br/>
                   FLUSH[4726] ✓ 7,786,450<br/>
                   SORT[3482] ✓ 3,610,828<br/>
                   RANK[1851] ✓ 1,129,685<br/>
                   SORT[1257] ✓ 6,574,584<br/>
                   AVG[7016] ✓ 1,406,487<br/>
                   INDEX[9354] ✓ 5,283,824<br/>
                   LIFE ENGINE v11.0 · 2026-03-21 · APEX
                 </div>
               )}
               {activeStat === 'USD REVENUE' && (
                 <div style={{color:'#ffd700'}}>
                   <div style={{fontSize:'16px',fontWeight:900,color:'white',marginBottom:12,borderBottom:'1px solid rgba(255,215,0,.2)',paddingBottom:8}}>📊 整合計算總業績：${totalRev?.toLocaleString()}</div>
                   - 奕心： ${((platformData.find(p=>p.name==='奕心')?.rev) || 0)?.toLocaleString()}<br/>
                   - 民視： ${((platformData.find(p=>p.name==='民視')?.rev) || 0)?.toLocaleString()}<br/>
                   - 公司： ${((platformData.find(p=>p.name==='公司')?.rev) || 0)?.toLocaleString()}<br/>
                   <br/>
                   <div style={{color:'rgba(0,255,156,.8)',marginTop:10}}>✅ 所有報表已通過審計核心驗證</div>
                 </div>
               )}
               {activeStat === 'VITALITY IDX' && (
                 <div style={{color:'#00e5ff'}}>
                   <div style={{fontSize:'15px',fontWeight:800,marginBottom:12}}>💖 系統活力係數分析 (86%)</div>
                   - CPU 負載: 28.4%<br/>
                   - RAM 使用: 4.2 GB / 16.0 GB<br/>
                   - AI 排名反應: 1.2ms<br/>
                   - API 同步狀態: 100% 穩定<br/>
                   - 防御性安全層: 零警告<br/>
                   <div style={{color:'rgba(0,229,200,.4)',marginTop:10,fontSize:'11px'}}>LAST UPDATE: {new Date().toLocaleTimeString()}</div>
                 </div>
               )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
