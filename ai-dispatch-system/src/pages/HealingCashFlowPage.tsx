import React, { useState, useEffect, useRef, useMemo } from 'react';
import './HealingCashFlowPage.css';

interface Role {
  id: number;
  名稱: string;
  說明: string;
  主題: string;
}

const defaultPageConfig = {
  網站標題: "兆櫃AI派單系統 療癒金流四層空間",
  網站副標題: "這不是影片腳本，而是可直接開工的網頁工程版本。整體以黑框立體舞台、四層空間、3D 景深、紅包金流互動為核心。",
  主角編號: 1,
  標籤: ["網頁工程", "四層空間", "3D立體景深", "禁止英文顯示", "紅包金流互動"],
  角色資料: [
    { id: 1, 名稱: "黃金火焰", 說明: "資源金錢", 主題: "金" },
    { id: 2, 名稱: "白色高密度火焰", 說明: "穩定方法", 主題: "白" },
    { id: 3, 名稱: "帝王綠火焰", 說明: "長期權威", 主題: "綠" },
    { id: 4, 名稱: "黑鑽能量火焰", 說明: "翻身突破", 主題: "暗" },
    { id: 5, 名稱: "血紅能量火焰", 說明: "機會爆發", 主題: "紅" }
  ]
};

const positionClasses = ["中間位", "左上位", "右上位", "左下位", "右下位"];

export function HealingCashFlowPage() {
  const [pageConfig, setPageConfig] = useState(defaultPageConfig);
  const [mainId, setMainId] = useState(1);
  const [isErupting, setIsErupting] = useState(false);
  const audioCtxRef = useRef<AudioContext | null>(null);

  const containerRef = useRef<HTMLDivElement>(null);
  const effectLayerRef = useRef<HTMLDivElement>(null);
  const flowLayerRef = useRef<HTMLDivElement>(null);

  // 排序角色：第一位為主角，其餘為配角
  const sortedRoles = useMemo(() => {
    const main = pageConfig.角色資料.find(r => r.id === mainId) || pageConfig.角色資料[0];
    const others = pageConfig.角色資料.filter(r => r.id !== mainId);
    return [main, ...others];
  }, [mainId, pageConfig.角色資料]);

  useEffect(() => {
    fetch('/api/頁面設定')
      .then(res => res.json())
      .then(res => {
        if (res.成功) {
          setPageConfig(res.資料);
          setMainId(res.資料.主角編號);
        }
      })
      .catch(err => console.warn('無法讀取設定 API，維持默認數值：', err));
  }, []);

  useEffect(() => {
    // 3D 輕量舞台傾斜
    const stage = containerRef.current;
    if (!stage) return;

    const handleMouseMove = (e: MouseEvent) => {
      const box = stage.getBoundingClientRect();
      const x = (e.clientX - box.left) / box.width;
      const y = (e.clientY - box.top) / box.height;
      const tiltY = (x - 0.5) * 4;
      const tiltX = (0.5 - y) * 3;
      stage.style.setProperty('--舞台傾斜Y', `${tiltY}deg`);
      stage.style.setProperty('--舞台傾斜X', `${tiltX}deg`);
    };

    const handleMouseLeave = () => {
      stage.style.setProperty('--舞台傾斜Y', '0deg');
      stage.style.setProperty('--舞台傾斜X', '0deg');
    };

    stage.addEventListener('mousemove', handleMouseMove);
    stage.addEventListener('mouseleave', handleMouseLeave);

    return () => {
      stage.removeEventListener('mousemove', handleMouseMove);
      stage.removeEventListener('mouseleave', handleMouseLeave);
    };
  }, []);

  function ensureAudio() {
    if (!audioCtxRef.current) {
      audioCtxRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
    }
    if (audioCtxRef.current.state === 'suspended') {
      audioCtxRef.current.resume();
    }
  }

  function playCoinSound(volume = 0.045, duration = 0.12, offset = 0) {
    const ctx = audioCtxRef.current;
    if (!ctx) return;
    const now = ctx.currentTime;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(920, now);
    osc.frequency.exponentialRampToValueAtTime(1450 + offset, now + duration);

    gain.gain.setValueAtTime(0.0001, now);
    gain.gain.exponentialRampToValueAtTime(volume, now + 0.01);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + duration);

    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start(now);
    osc.stop(now + duration + 0.02);
  }

  function playPaperSound(volume = 0.018, duration = 0.22) {
    const ctx = audioCtxRef.current;
    if (!ctx) return;
    const sampleRate = ctx.sampleRate;
    const bufSize = Math.floor(sampleRate * duration);
    const buf = ctx.createBuffer(1, bufSize, sampleRate);
    const output = buf.getChannelData(0);

    for (let i = 0; i < bufSize; i++) {
       output[i] = (Math.random() * 2 - 1) * (1 - i / bufSize);
    }

    const source = ctx.createBufferSource();
    const filter = ctx.createBiquadFilter();
    const gain = ctx.createGain();

    filter.type = "bandpass";
    filter.frequency.value = 1800;
    filter.Q.value = 0.8;

    gain.gain.value = volume;
    source.buffer = buf;
    source.connect(filter);
    filter.connect(gain);
    gain.connect(ctx.destination);

    source.start();
  }

  function createGlow(x: number, y: number) {
    if (!effectLayerRef.current) return;
    const glow = document.createElement("div");
    glow.className = "柔光閃爍";
    glow.style.setProperty("--光X", `${x}%`);
    glow.style.setProperty("--光Y", `${y}%`);
    effectLayerRef.current.appendChild(glow);
    setTimeout(() => glow.remove(), 650);
  }

  function getRedEnvelopeCenter() {
    const btn = document.getElementById("紅包按鈕");
    const flow = flowLayerRef.current;
    if (!btn || !flow) return { x: window.innerWidth / 2, y: 300 };
    const btnBox = btn.getBoundingClientRect();
    const flowBox = flow.getBoundingClientRect();
    return {
      x: btnBox.left + btnBox.width / 2 - flowBox.left,
      y: btnBox.top + btnBox.height / 2 - flowBox.top
    };
  }

  function spawnCoin(origin: { x: number, y: number }, step: number) {
    if (!flowLayerRef.current) return;
    const el = document.createElement("div");
    el.className = "金幣 飛出動畫 金幣旋轉";

    const dx = (Math.random() * 560 - 280) + (step * 12);
    const dy = (Math.random() * -260) + 60;
    const dz = `${140 + Math.random() * 260}px`;
    const angle = `${Math.random() * 560 - 280}deg`;

    el.style.setProperty("--起點X", `${origin.x}px`);
    el.style.setProperty("--起點Y", `${origin.y}px`);
    el.style.setProperty("--位移X", `${dx}px`);
    el.style.setProperty("--位移Y", `${dy}px`);
    el.style.setProperty("--位移Z", dz);
    el.style.setProperty("--旋轉角度", angle);
    el.style.setProperty("--持續時間", `${1.15 + Math.random() * 0.75}s`);
    el.style.setProperty("--結尾比例", `${0.88 + Math.random() * 0.48}`);

    flowLayerRef.current.appendChild(el);
    setTimeout(() => el.remove(), 2200);
  }

  function spawnPaper(origin: { x: number, y: number }, step: number) {
    if (!flowLayerRef.current) return;
    const el = document.createElement("div");
    el.className = "鈔票 飛出動畫";

    const dx = (Math.random() * 620 - 310) + (step * 10);
    const dy = (Math.random() * -220) + 90;
    const dz = `${160 + Math.random() * 220}px`;
    const angle = `${Math.random() * 220 - 110}deg`;

    el.style.setProperty("--起點X", `${origin.x}px`);
    el.style.setProperty("--起點Y", `${origin.y}px`);
    el.style.setProperty("--位移X", `${dx}px`);
    el.style.setProperty("--位移Y", `${dy}px`);
    el.style.setProperty("--位移Z", dz);
    el.style.setProperty("--旋轉角度", angle);
    el.style.setProperty("--持續時間", `${1.3 + Math.random() * 0.55}s`);
    el.style.setProperty("--結尾比例", `${0.9 + Math.random() * 0.30}`);

    flowLayerRef.current.appendChild(el);
    setTimeout(() => el.remove(), 2200);
  }

  function sparkWave(origin: { x: number, y: number }, coins: number, papers: number, step: number) {
    for (let i = 0; i < coins; i++) {
      setTimeout(() => spawnCoin(origin, step), i * 35);
    }
    for (let i = 0; i < papers; i++) {
      setTimeout(() => spawnPaper(origin, step), i * 45);
    }
  }

  function activateEruption() {
    if (isErupting) return;
    setIsErupting(true);
    ensureAudio();

    const origin = getRedEnvelopeCenter();

    createGlow(50, 58);

    // 第一波
    setTimeout(() => {
      sparkWave(origin, 14, 0, 1);
      playCoinSound(0.05, 0.12, 0);
      setTimeout(() => playCoinSound(0.042, 0.10, 50), 90);
      setTimeout(() => playCoinSound(0.04, 0.09, -40), 180);
    }, 0);

    // 第二波
    setTimeout(() => {
      sparkWave(origin, 8, 7, 2);
      playPaperSound(0.018, 0.24);
      setTimeout(() => playCoinSound(0.038, 0.09, 80), 120);
    }, 420);

    // 第三波
    setTimeout(() => {
      sparkWave(origin, 18, 10, 3);
      playPaperSound(0.02, 0.28);
      playCoinSound(0.05, 0.12, -20);
      setTimeout(() => playCoinSound(0.04, 0.11, 100), 80);
      setTimeout(() => playCoinSound(0.035, 0.10, -90), 160);
    }, 920);

    // 第四波
    setTimeout(() => {
      sparkWave(origin, 22, 12, 4);
      createGlow(50, 56);
      playCoinSound(0.055, 0.14, 0);
      setTimeout(() => playPaperSound(0.02, 0.22), 90);
      setTimeout(() => playCoinSound(0.038, 0.11, 60), 140);
      setTimeout(() => playCoinSound(0.03, 0.09, -60), 250);
    }, 1480);

    setTimeout(() => {
      setIsErupting(false);
    }, 2600);
  }

  function getThemeClass(theme: string) {
    if (theme === "金") return "金主題";
    if (theme === "白") return "白主題";
    if (theme === "綠") return "綠主題";
    if (theme === "暗") return "暗主題";
    return "紅主題";
  }

  return (
    <>
      <div className="healing-page-bg" />
      <div className="外層空間" />

      <div className="頁面">
        <div className="頁首">
          <div className="標題區">
            <div className="標籤列">
              {pageConfig.標籤.map((tag: string, idx: number) => (
                <div key={idx} className="標籤">{tag}</div>
              ))}
            </div>
            <h1>{pageConfig.網站標題}</h1>
            <p className="副標題">{pageConfig.網站副標題}</p>
          </div>

          <aside className="規格卡">
            <h2>工程固定規則</h2>
            <div className="mt-2 space-y-1">
               <label className="block text-sm">切換主角：</label>
               <select 
                 className="w-full bg-slate-800 border border-slate-700 rounded-lg p-2 text-white"
                 value={mainId} 
                 onChange={e => setMainId(Number(e.target.value))}
               >
                 {pageConfig.角色資料.map((r: Role) => <option key={r.id} value={r.id}>{r.名稱}</option>)}
               </select>
            </div>
          </aside>
        </div>

        <div className="透視容器">
          <section className="黑框舞台" ref={containerRef}>
            <div className="舞台">
              <div className="第四空間" />
              <div className="第三空間" />
              
              <div className="第二空間">
                {sortedRoles.slice(1).map((r: Role, i: number) => (
                  <div 
                    key={r.id} 
                    className={`角色 ${getThemeClass(r.主題)} ${positionClasses[i + 1]} 已出現`} 
                    data-id={r.id}
                  >
                    <div className="地面影子" />
                    <div className="角色本體">
                      <div className="臉">
                        <div className="眼睛" />
                        <div className="眼睛" />
                      </div>
                      <div className="嘴巴" />
                    </div>
                    <div className="角色標籤">
                      <strong>{r.id}｜{r.名稱}</strong>
                      <span>{r.說明}</span>
                    </div>
                  </div>
                ))}
              </div>

              <div className="第一空間 shadow-2xl">
                {sortedRoles.slice(0, 1).map((r: Role) => (
                  <div 
                    key={r.id} 
                    className={`角色 ${getThemeClass(r.主題)} ${positionClasses[0]} 主角 已出現`} 
                    data-id={r.id}
                  >
                    <div className="主角光環" />
                    <div className="地面影子" />
                    <div className="角色本體">
                      <div className="臉">
                        <div className="眼睛" />
                        <div className="眼睛" />
                      </div>
                      <div className="嘴巴" />
                    </div>
                    <div className="角色標籤">
                      <strong>{r.id}｜{r.名稱}</strong>
                      <span>{r.說明}</span>
                    </div>
                    {/* 紅包僅主角開啟 */}
                    <div className="紅包區">
                      <button 
                        className={`紅包按鈕 ${isErupting ? '已打開' : ''}`} 
                        id="紅包按鈕" 
                        onClick={activateEruption}
                      >
                        <span className="封印章"></span>
                        <span className="提示字">點一下，啟動給予模式</span>
                      </button>
                    </div>
                  </div>
                ))}
              </div>

              <div className="特效層" ref={effectLayerRef} />
              <div className="金流層" ref={flowLayerRef} />

              <div className="資訊面板">
                <div className="資訊卡">
                  <h3>空間邏輯</h3>
                  <p>
                    第四空間負責外圍氛圍，第三空間負責深景舞台，第二空間固定放配角，第一空間固定放主角與金流互動。
                  </p>
                </div>
                <div className="資訊卡">
                  <h3>固定色盤</h3>
                  <div className="色盤格">
                    <div className="色塊項"><div className="色塊" style={{background: 'linear-gradient(90deg, #fff1bf, #f0b000)'}} /><div>黃金火焰</div></div>
                    <div className="色塊項"><div className="色塊" style={{background: 'linear-gradient(90deg, #ffffff, #dce7f5)'}} /><div>白色火焰</div></div>
                    <div className="色塊項"><div className="色塊" style={{background: 'linear-gradient(90deg, #87ffc8, #169a5d)'}} /><div>帝王綠</div></div>
                    <div className="色塊項"><div className="色塊" style={{background: 'linear-gradient(90deg, #6957ff, #1c1d2b)'}} /><div>黑鑽能量</div></div>
                    <div className="色塊項"><div className="色塊" style={{background: 'linear-gradient(90deg, #ff7b86, #b20c1b)'}} /><div>血紅能量</div></div>
                  </div>
                </div>
              </div>
            </div>
          </section>
        </div>
      </div>
    </>
  );
}

