// ==========================================
// LINE 群組轉傳系統
// 帝王配色 · 全 inline style · 功能字鎖死
// ==========================================
import React, { useState, useMemo } from 'react';
import { convertToLineFormats, lineScenarios, type LineFormatResult, type LineConvertInput, type LineVersion } from '../engine/lineFormatEngine';
import { EMPEROR_UI, MU, HUO, SHUI, TU, JIN, EMPEROR } from '../constants/wuxingColors';

// ── 版本配色 ──
const VERSION_STYLE: Record<LineVersion, { color: string; bg: string; border: string; icon: string; desc: string }> = {
  full:      { color: SHUI.bright,  bg: SHUI.abyss,  border: SHUI.shadow,  icon: '📋', desc: '主管正式轉傳 · 公司群組公告' },
  concise:   { color: MU.bright,    bg: MU.abyss,    border: MU.shadow,    icon: '💬', desc: 'LINE 群組快速閱讀 · 保留重點' },
  ultra:     { color: HUO.bright,   bg: HUO.abyss,   border: HUO.shadow,   icon: '⚡', desc: '20秒內看完 · 快速執行通知' },
  manager:   { color: TU.bright,    bg: TU.abyss,    border: TU.shadow,    icon: '👊', desc: '主管威壓 · 強化執行力' },
  broadcast: { color: JIN.bright,   bg: JIN.abyss,   border: JIN.shadow,   icon: '🎙️', desc: '女聲播報 · 直接唸出 · 開會播放' },
};

// 預設系統內容（3 種真實場景）
const PRESETS: LineConvertInput[] = [
  {
    title: 'AI 派單公告 3/16',
    type: '派單公告',
    rawContent: `📣 AI 派單公告｜3/16 結算 → 3/17 派單順序
審計結果：PASS。
今日三平台整合實收：$2,428,366

1. 王珍珠｜追單 11｜續單 157,860｜總業績 331,930｜實收 331,930
2. 王梅慧｜追單 7｜續單 121,760｜總業績 318,320｜實收 318,320
3. 馬秋香｜追單 8｜續單 184,700｜總業績 296,500｜實收 296,500
4. 林沛昕｜追單 4｜續單 112,960｜總業績 243,340｜實收 243,340
5. 李玲玲｜追單 6｜續單 24,050｜總業績 203,350｜實收 203,350

派單規則：依名次順序派單，不得跳位。
禁止自行更改派單順序。`,
  },
  {
    title: '高價成交團隊喊話',
    type: '主管喊話',
    rawContent: `今天不是比誰講得多，今天是比誰敢拿大單。
全隊 21 人，6 人已具備主攻大單能力。
今日最強主攻手：王珍珠（總分 96）

規則很簡單：
遇到高價客戶，價值先講滿，價格後面談。
報價後不要自己先退，停三秒讓客戶思考。
收口要穩，不膽怯、不退縮、不虛弱。

今天誰收到高價客戶，誰就必須執行這三步。`,
  },
  {
    title: '高價收口訓練通知',
    type: '訓練通知',
    rawContent: `今日訓練重點：高價收口強化。

話術練習：
「這不是單純多花錢，而是一次把效果、品質、穩定度直接拉上來。」

模擬情境：
報完價格後客戶沉默，你必須等待不主動降價。
練習開口：「真正差距不是差幾千，而是最後效果能不能一次做到位。」

訓練時間：今日下午 2:00 · 會議室 A · 全員必須參加`,
  },
];

// CSS 注入
let _lineInjected = false;
function injectLineStyles() {
  if (_lineInjected || typeof document === 'undefined') return;
  _lineInjected = true;
  const s = document.createElement('style');
  s.textContent = `
    @keyframes lineScan { 0%{transform:translateY(-100%)} 100%{transform:translateY(400%)} }
    @keyframes linePop  { from{opacity:0;transform:scale(0.96) translateY(4px)} to{opacity:1;transform:scale(1) translateY(0)} }
    @keyframes lineCopy { 0%{transform:scale(1)} 50%{transform:scale(1.08)} 100%{transform:scale(1)} }
    @keyframes linePulse { 0%,100%{box-shadow:0 0 4px currentColor} 50%{box-shadow:0 0 14px currentColor} }
    .line-card { animation: linePop 0.25s ease-out; }
    .line-copy-btn:hover { filter: brightness(1.2); transform: translateY(-1px); }
    .line-copy-btn { transition: all 0.15s; }
    .line-preset-btn:hover { filter: brightness(1.15); }
    .line-preset-btn { transition: all 0.15s; }
  `;
  document.head.appendChild(s);
}

// ── 版本輸出卡片 ──
function VersionCard({ result, onCopy, isCopied }: { result: LineFormatResult; onCopy: () => void; isCopied: boolean }) {
  const vs = VERSION_STYLE[result.version];
  const lines = result.content.split('\n').length;
  const chars = result.content.length;
  return (
    <div className="line-card" style={{
      background: EMPEROR_UI.cardBg,
      border: `1px solid ${vs.border}`,
      borderLeft: `3px solid ${vs.color}`,
      borderRadius: 10,
      overflow: 'hidden',
      boxShadow: `0 2px 12px rgba(0,0,0,0.4), inset 0 1px 0 ${vs.color}11`,
    }}>
      {/* 卡片頭：icon + 版本名 + 描述 + 複製按鈕 */}
      <div style={{
        padding: '8px 12px',
        background: `linear-gradient(135deg,${vs.bg},${EMPEROR.obsidian})`,
        borderBottom: `1px solid ${vs.border}`,
        display: 'flex', alignItems: 'center', gap: 8,
      }}>
        <span style={{ fontSize: 16 }}>{vs.icon}</span>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: 12, fontWeight: 900, color: vs.color, lineHeight: 1.1 }}>{result.label}</div>
          <div style={{ fontSize: 9, color: EMPEROR_UI.textDim, marginTop: 1 }}>{vs.desc}</div>
        </div>
        {/* 即時字數/行數 */}
        <div style={{ display: 'flex', gap: 6, alignItems: 'center', marginRight: 8 }}>
          <span style={{ fontSize: 9, color: EMPEROR_UI.textDim, fontFamily: 'monospace' }}>{chars}字</span>
          <span style={{ fontSize: 9, color: EMPEROR_UI.textDim, fontFamily: 'monospace' }}>{lines}行</span>
          <span style={{ fontSize: 9, color: MU.bright, fontWeight: 700 }}>+1✓</span>
        </div>
        {/* 複製按鈕 */}
        <button
          className="line-copy-btn"
          type="button"
          onClick={onCopy}
          style={{
            padding: '5px 14px', borderRadius: 6,
            background: isCopied ? MU.void : vs.bg,
            color: isCopied ? MU.bright : vs.color,
            border: `1px solid ${isCopied ? MU.shadow : vs.border}`,
            fontSize: 11, fontWeight: 900, cursor: 'pointer',
            display: 'flex', alignItems: 'center', gap: 4,
            boxShadow: isCopied ? `0 0 8px ${MU.bright}44` : 'none',
            animation: isCopied ? 'lineCopy 0.3s ease-out' : 'none',
            whiteSpace: 'nowrap',
          }}>
          {isCopied ? '✅ 已複製' : '📋 複製'}
        </button>
      </div>

      {/* 內容預覽 */}
      <div style={{
        padding: '10px 14px',
        maxHeight: 180, overflowY: 'auto',
        position: 'relative',
      }}>
        {/* 掃描光 */}
        <div style={{
          position: 'absolute', left: 0, right: 0, height: '20%', pointerEvents: 'none',
          background: `linear-gradient(to bottom,${vs.color}08,transparent)`,
          animation: 'lineScan 4s linear infinite',
        }} />
        <pre style={{
          fontSize: 11, color: EMPEROR_UI.textSecondary, whiteSpace: 'pre-wrap',
          lineHeight: 1.8, margin: 0,
          fontFamily: '"Microsoft JhengHei", system-ui, sans-serif',
        }}>{result.content}</pre>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════
// 頁面一：LINE 轉傳總控台
// ═══════════════════════════════════════
export function LineGroupDashboard() {
  injectLineStyles();
  const [selectedPreset, setSelectedPreset] = useState(0);
  const [customMode, setCustomMode] = useState(false);
  const [customTitle, setCustomTitle] = useState('');
  const [customType, setCustomType] = useState('派單公告');
  const [customContent, setCustomContent] = useState('');
  const [copied, setCopied] = useState<string | null>(null);

  const input: LineConvertInput = customMode
    ? { title: customTitle || '自訂公告', type: customType, rawContent: customContent }
    : PRESETS[selectedPreset];

  const results = useMemo(() => {
    if (!input.rawContent.trim()) return [];
    return convertToLineFormats(input);
  }, [input.rawContent, input.title, input.type]);

  function handleCopy(content: string, label: string) {
    void navigator.clipboard.writeText(content).then(() => {
      setCopied(label);
      setTimeout(() => setCopied(null), 2200);
    });
  }

  const inputStyle: React.CSSProperties = {
    width: '100%', boxSizing: 'border-box',
    border: `1px solid ${EMPEROR_UI.borderAccent}`,
    borderRadius: 7, padding: '7px 10px',
    background: EMPEROR_UI.pageBg,
    color: EMPEROR_UI.textSecondary,
    fontSize: 12, outline: 'none',
    fontFamily: '"Microsoft JhengHei", system-ui, sans-serif',
  };

  return (
    <div style={{
      background: EMPEROR_UI.pageBg, minHeight: '100vh',
      padding: '10px 14px 24px',
      fontFamily: '"Microsoft JhengHei", system-ui, sans-serif',
    }}>

      {/* ══ 頁首 ══ */}
      <div style={{
        padding: '9px 14px', borderRadius: 10, marginBottom: 10,
        background: 'linear-gradient(135deg,#001a0d,#0d1a0a)',
        border: `1px solid ${MU.shadow}`,
        boxShadow: `0 4px 20px rgba(0,0,0,0.5), inset 0 1px 0 ${MU.bright}11`,
        display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 8,
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <span style={{ fontSize: 20, filter: `drop-shadow(0 0 6px ${MU.bright})` }}>💬</span>
          <div>
            <div style={{ fontSize: 15, fontWeight: 900, color: MU.bright, letterSpacing: '0.04em', lineHeight: 1.1,
              textShadow: `0 0 12px ${MU.bright}88`,
            }}>LINE 群組轉傳系統</div>
            <div style={{ fontSize: 9, color: EMPEROR_UI.textDim, marginTop: 2 }}>任意內容 → 5版格式 → 直接複製貼群</div>
          </div>
        </div>
        {/* 4 即時指標 */}
        <div style={{ display: 'flex', gap: 6 }}>
          {[
            { label: '輸出版本', val: '5版', color: MU.bright },
            { label: '結尾鎖死', val: '+1', color: JIN.bright },
            { label: '支援場景', val: `${lineScenarios.length}種`, color: SHUI.bright },
            { label: '格式規則', val: '鎖死', color: HUO.bright },
          ].map(m => (
            <div key={m.label} style={{
              background: EMPEROR.obsidian, border: `1px solid ${EMPEROR_UI.borderMain}`,
              borderRadius: 7, padding: '4px 8px', textAlign: 'center',
            }}>
              <div style={{ fontSize: 8, color: EMPEROR_UI.textDim, letterSpacing: '0.06em' }}>{m.label}</div>
              <div style={{ fontSize: 13, fontWeight: 900, color: m.color, lineHeight: 1, textShadow: `0 0 6px ${m.color}66` }}>{m.val}</div>
            </div>
          ))}
        </div>
      </div>

      {/* ══ 來源切換 + 內容輸入 ══ */}
      <div style={{
        background: EMPEROR_UI.cardBg, border: `1px solid ${EMPEROR_UI.borderAccent}`,
        borderRadius: 10, padding: '10px 12px', marginBottom: 10,
      }}>
        {/* 模式切換按鈕 */}
        <div style={{ display: 'flex', gap: 6, marginBottom: 10 }}>
          {[
            { label: '📦 系統內容直轉', key: false },
            { label: '✏️ 自訂內容輸入', key: true },
          ].map(m => (
            <button
              key={String(m.key)}
              className="line-preset-btn"
              type="button"
              onClick={() => setCustomMode(m.key)}
              style={{
                padding: '5px 14px', borderRadius: 6,
                background: customMode === m.key ? MU.void : EMPEROR_UI.pageBg,
                color: customMode === m.key ? MU.bright : EMPEROR_UI.textMuted,
                border: `1px solid ${customMode === m.key ? MU.shadow : EMPEROR_UI.borderMain}`,
                fontSize: 11, fontWeight: 800, cursor: 'pointer',
              }}>{m.label}</button>
          ))}
        </div>

        {/* 系統預設切換 */}
        {!customMode ? (
          <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
            {PRESETS.map((p, i) => (
              <button
                key={i}
                className="line-preset-btn"
                type="button"
                onClick={() => setSelectedPreset(i)}
                style={{
                  padding: '4px 12px', borderRadius: 6,
                  background: i === selectedPreset ? SHUI.void : EMPEROR_UI.pageBg,
                  color: i === selectedPreset ? SHUI.bright : EMPEROR_UI.textMuted,
                  border: `1px solid ${i === selectedPreset ? SHUI.shadow : EMPEROR_UI.borderMain}`,
                  fontSize: 11, fontWeight: i === selectedPreset ? 900 : 600,
                  cursor: 'pointer',
                  boxShadow: i === selectedPreset ? `0 0 6px ${SHUI.bright}33` : 'none',
                }}>{p.title}</button>
            ))}
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 7 }}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 7 }}>
              <input
                value={customTitle}
                onChange={e => setCustomTitle(e.target.value)}
                placeholder="標題（例：今日派單公告）"
                style={inputStyle}
              />
              <select
                value={customType}
                onChange={e => setCustomType(e.target.value)}
                style={{ ...inputStyle, cursor: 'pointer' }}>
                {lineScenarios.map(s => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>
            <div style={{ position: 'relative' }}>
              <textarea
                value={customContent}
                onChange={e => setCustomContent(e.target.value)}
                placeholder="貼上系統輸出內容 → 自動轉為 5 版 LINE 格式"
                rows={5}
                style={{ ...inputStyle, resize: 'vertical', lineHeight: 1.7, minHeight: 100 }}
              />
              {customContent && (
                <div style={{
                  position: 'absolute', bottom: 8, right: 10,
                  fontSize: 9, color: EMPEROR_UI.textDim, fontFamily: 'monospace',
                  background: EMPEROR_UI.pageBg, padding: '1px 6px', borderRadius: 4,
                }}>{customContent.length}字</div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* ══ 5 版輸出 ══ */}
      {results.length > 0 ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {/* 輸出標題欄 */}
          <div style={{
            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            padding: '6px 2px',
          }}>
            <div style={{ fontSize: 11, fontWeight: 900, color: EMPEROR_UI.textPrimary, letterSpacing: '0.04em' }}>
              📤 自動輸出 5 版 · 直接複製貼群
            </div>
            <div style={{ fontSize: 9, color: MU.bright, fontWeight: 700 }}>
              結尾全部已鎖死「看完請回 +1」
            </div>
          </div>
          {results.map(r => (
            <VersionCard
              key={r.version}
              result={r}
              isCopied={copied === r.label}
              onCopy={() => handleCopy(r.content, r.label)}
            />
          ))}
        </div>
      ) : (
        /* 空態提示 */
        <div style={{
          padding: '28px 20px', borderRadius: 10,
          background: EMPEROR_UI.cardBg, border: `1px dashed ${EMPEROR_UI.borderAccent}`,
          textAlign: 'center',
        }}>
          <div style={{ fontSize: 28, marginBottom: 8, filter: `drop-shadow(0 0 8px ${MU.bright}44)` }}>💬</div>
          <div style={{ fontSize: 13, fontWeight: 800, color: EMPEROR_UI.textMuted }}>貼上內容 → 自動生成 5 版格式</div>
          <div style={{ fontSize: 10, color: EMPEROR_UI.textDim, marginTop: 4 }}>選擇預設內容或切換至自訂輸入</div>
        </div>
      )}
    </div>
  );
}

// ═══════════════════════════════════════
// 頁面二：LINE 轉傳規則
// ═══════════════════════════════════════
const MUST_RULES = ['分段清楚', '標題獨立', '重點前置', '數字清楚', '名單分行', '執行規則獨立', '適合主管轉傳', '語氣專業', '結尾有執行感', '適合群組閱讀'];
const FORBIDDEN = ['大段不分行', '文字一整坨', '重點埋在中間', '數字不清楚', '段落太亂', '看完不知做什麼', '沒有執行感', '語氣太空泛', '不能直接轉傳'];

const ENDINGS = [
  '以上為今日統一執行內容，請全員確認。\n看完請回 +1。',
  '今天照此執行。\n看完請回 +1。',
  '看完請回 +1。',
  '今日起照表執行，不得跳位，不得自行更改。\n看完請回 +1。',
  '以上為今日正式執行內容。\n請全員確認。\n看完請回，加一。',
];

export function LineGroupRules() {
  injectLineStyles();

  return (
    <div style={{
      background: EMPEROR_UI.pageBg, minHeight: '100vh',
      padding: '10px 14px 24px',
      fontFamily: '"Microsoft JhengHei", system-ui, sans-serif',
    }}>

      {/* ══ 頁首 ══ */}
      <div style={{
        padding: '9px 14px', borderRadius: 10, marginBottom: 10,
        background: 'linear-gradient(135deg,#001a0d,#0d1a0a)',
        border: `1px solid ${MU.shadow}`,
        boxShadow: `0 4px 20px rgba(0,0,0,0.5)`,
        display: 'flex', alignItems: 'center', gap: 10,
      }}>
        <span style={{ fontSize: 18, filter: `drop-shadow(0 0 6px ${MU.bright})` }}>📖</span>
        <div>
          <div style={{ fontSize: 14, fontWeight: 900, color: MU.bright, lineHeight: 1.1 }}>LINE 轉傳規則總覽</div>
          <div style={{ fontSize: 9, color: EMPEROR_UI.textDim, marginTop: 2 }}>格式鎖死 · 5版說明 · 結尾標準 · 永久生效</div>
        </div>
      </div>

      {/* ══ 鎖死規則（必須 + 禁止 並排）══ */}
      <div style={{
        background: EMPEROR_UI.cardBg, border: `1px solid ${MU.shadow}`,
        borderRadius: 10, overflow: 'hidden', marginBottom: 8,
      }}>
        <div style={{
          padding: '7px 12px',
          background: `linear-gradient(135deg,${MU.abyss},${EMPEROR.obsidian})`,
          borderBottom: `1px solid ${MU.shadow}`,
          fontSize: 11, fontWeight: 900, color: MU.bright, letterSpacing: '0.06em',
          display: 'flex', alignItems: 'center', gap: 6,
        }}>
          🔒 LINE 群組轉傳鎖死規則（永久生效）
        </div>
        <div style={{ padding: '8px 10px', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
          {/* 必要 */}
          <div style={{
            background: '#001a0d', border: `1px solid ${MU.shadow}`,
            borderRadius: 8, padding: '8px 10px',
          }}>
            <div style={{ fontSize: 9, fontWeight: 900, color: MU.bright, marginBottom: 6, letterSpacing: '0.06em' }}>✅ 必要規則</div>
            {MUST_RULES.map(r => (
              <div key={r} style={{ display: 'flex', alignItems: 'center', gap: 5, marginBottom: 3 }}>
                <span style={{ width: 5, height: 5, borderRadius: '50%', background: MU.bright, flexShrink: 0 }} />
                <span style={{ fontSize: 10, color: EMPEROR_UI.textSecondary }}>{r}</span>
              </div>
            ))}
          </div>
          {/* 禁止 */}
          <div style={{
            background: '#1a0000', border: '1px solid #7f1d1d44',
            borderRadius: 8, padding: '8px 10px',
          }}>
            <div style={{ fontSize: 9, fontWeight: 900, color: '#f87171', marginBottom: 6, letterSpacing: '0.06em' }}>🚫 禁止問題</div>
            {FORBIDDEN.map(f => (
              <div key={f} style={{ display: 'flex', alignItems: 'center', gap: 5, marginBottom: 3 }}>
                <span style={{ width: 5, height: 5, borderRadius: '50%', background: '#f87171', flexShrink: 0 }} />
                <span style={{ fontSize: 10, color: '#fca5a577', textDecoration: 'line-through' }}>{f}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ══ 5 版說明（緊湊 grid）══ */}
      <div style={{
        background: EMPEROR_UI.cardBg, border: `1px solid ${EMPEROR_UI.borderAccent}`,
        borderRadius: 10, overflow: 'hidden', marginBottom: 8,
      }}>
        <div style={{
          padding: '7px 12px',
          background: `linear-gradient(135deg,${SHUI.abyss},${EMPEROR.obsidian})`,
          borderBottom: `1px solid ${SHUI.shadow}`,
          fontSize: 11, fontWeight: 900, color: SHUI.bright, letterSpacing: '0.06em',
        }}>
          📤 5 版輸出說明 · 使用場景
        </div>
        <div style={{ padding: '8px 10px', display: 'flex', flexDirection: 'column', gap: 5 }}>
          {Object.entries(VERSION_STYLE).map(([ver, vs]) => (
            <div key={ver} style={{
              display: 'flex', alignItems: 'center', gap: 10,
              padding: '6px 10px', borderRadius: 7,
              background: vs.bg, border: `1px solid ${vs.border}`,
            }}>
              <span style={{ fontSize: 16, flexShrink: 0 }}>{vs.icon}</span>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 11, fontWeight: 900, color: vs.color, lineHeight: 1 }}>
                  {ver === 'full' ? '完整版' : ver === 'concise' ? '群組精簡版' : ver === 'ultra' ? '超短版' : ver === 'manager' ? '主管威壓版' : '朗讀播放版'}
                </div>
                <div style={{ fontSize: 9, color: EMPEROR_UI.textDim, marginTop: 2 }}>{vs.desc}</div>
              </div>
              <span style={{
                fontSize: 9, padding: '1px 7px', borderRadius: 4,
                background: EMPEROR.obsidian, color: vs.color, border: `1px solid ${vs.border}`,
                fontWeight: 700, whiteSpace: 'nowrap',
              }}>{ver}</span>
            </div>
          ))}
        </div>
      </div>

      {/* ══ 結尾鎖死格式 ══ */}
      <div style={{
        background: EMPEROR_UI.cardBg, border: `1px solid ${JIN.shadow}`,
        borderRadius: 10, overflow: 'hidden',
      }}>
        <div style={{
          padding: '7px 12px',
          background: `linear-gradient(135deg,${JIN.abyss},${EMPEROR.obsidian})`,
          borderBottom: `1px solid ${JIN.shadow}`,
          fontSize: 11, fontWeight: 900, color: JIN.bright, letterSpacing: '0.06em',
          display: 'flex', alignItems: 'center', gap: 6,
        }}>
          🔒 結尾鎖死格式（5種）
          <span style={{ marginLeft: 'auto', fontSize: 9, color: EMPEROR_UI.textDim }}>全部以「+1」結尾</span>
        </div>
        <div style={{ padding: '8px 10px', display: 'flex', flexDirection: 'column', gap: 5 }}>
          {ENDINGS.map((e, i) => (
            <div key={i} style={{
              padding: '6px 10px', borderRadius: 7,
              background: JIN.abyss, border: `1px solid ${JIN.shadow}`,
              display: 'flex', alignItems: 'flex-start', gap: 8,
            }}>
              <span style={{
                width: 18, height: 18, borderRadius: '50%', flexShrink: 0,
                background: JIN.void, color: JIN.bright,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: 9, fontWeight: 900,
              }}>{i + 1}</span>
              <pre style={{
                fontSize: 10, color: EMPEROR_UI.textSecondary, whiteSpace: 'pre-wrap',
                lineHeight: 1.7, margin: 0,
                fontFamily: '"Microsoft JhengHei", system-ui, sans-serif',
              }}>{e}</pre>
            </div>
          ))}
        </div>
      </div>

    </div>
  );
}
