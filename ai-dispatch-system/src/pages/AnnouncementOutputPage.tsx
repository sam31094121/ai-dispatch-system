import React, { useState, useEffect, useRef } from 'react';
import { useLatest } from '../hooks/useLatest';
import { EMPEROR_UI, TU, MU, HUO, SHUI, JIN, EMPEROR } from '../constants/wuxingColors';

// ── 版本設定 ──
const VERSIONS = [
  {
    key: 'fullText'    as const,
    icon: '📋',
    label: '完整長版公告',
    desc: '主要發送版本｜包含審計＋排名＋派單＋個人建議',
    color: TU,
    autoCopy: true,   // ← 進入頁面自動複製這個
    priority: 1,
  },
  {
    key: 'lineText'    as const,
    icon: '💬',
    label: 'LINE 精簡快訊',
    desc: '群組快速發送｜簡潔有力',
    color: MU,
    autoCopy: false,
    priority: 2,
  },
  {
    key: 'shortText'   as const,
    icon: '⚡',
    label: '提振超短版',
    desc: '早會開場｜30 秒唸完',
    color: HUO,
    autoCopy: false,
    priority: 3,
  },
  {
    key: 'voiceText'   as const,
    icon: '🎤',
    label: '語音播報稿',
    desc: 'AI 語音播報｜標準發音格式',
    color: SHUI,
    autoCopy: false,
    priority: 4,
  },
  {
    key: 'managerText' as const,
    icon: '🔒',
    label: '主管內部報告',
    desc: '限主管｜含完整戰力分析',
    color: { ...HUO, abyss: '#1a0000', void: '#2d0000', shadow: '#7f1d1d', bright: '#fca5a5', text: '#fca5a5', core: '#ef4444' },
    autoCopy: false,
    priority: 5,
  },
] as const;

type VersionKey = typeof VERSIONS[number]['key'];

export function AnnouncementOutputPage(): React.ReactElement {
  const { loading, data, auditOk, errorReason, version, lastFetchedAt, refetch } = useLatest();
  const [copiedKey, setCopiedKey]   = useState<VersionKey | null>(null);
  const [activeTab, setActiveTab]   = useState<VersionKey>('fullText');
  const [autoCopied, setAutoCopied] = useState(false);
  const [copyFlash, setCopyFlash]   = useState(false);
  const autoCopyDone = useRef(false);

  const ann        = data?.announcement ?? null;
  const reportDate = data?.reportDate   ?? '';

  // ── 自動複製：公告載入完成後，自動複製完整版 ──
  useEffect(() => {
    if (loading || !ann?.fullText || autoCopyDone.current) return;
    autoCopyDone.current = true;
    navigator.clipboard.writeText(ann.fullText).catch(() => {});
    setAutoCopied(true);
    setCopyFlash(true);
    setTimeout(() => setCopyFlash(false), 1200);
  }, [loading, ann]);

  // 重新載入時重置自動複製旗標
  useEffect(() => {
    autoCopyDone.current = false;
    setAutoCopied(false);
  }, [version]);

  function copyText(key: VersionKey) {
    const text = ann?.[key];
    if (!text) return;
    navigator.clipboard.writeText(text).catch(() => {});
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(null), 2000);
  }

  const activeVersion = VERSIONS.find(v => v.key === activeTab)!;
  const p = activeVersion.color as typeof TU;
  const activeText = ann?.[activeTab] ?? '';
  const wordCount = activeText.length;

  return (
    <div style={{ background: EMPEROR_UI.pageBg, minHeight: '100%', fontFamily: '"Microsoft JhengHei", system-ui, sans-serif' }}>
      <style>{`
        @keyframes autoCopyPulse { 0%{box-shadow:0 0 0 0 #ffd70066} 70%{box-shadow:0 0 0 20px transparent} 100%{box-shadow:0 0 0 0 transparent} }
        @keyframes flashGold { 0%,100%{opacity:1} 50%{opacity:0.3} }
        @keyframes slideIn { from{opacity:0;transform:translateY(-8px)} to{opacity:1;transform:translateY(0)} }
        @keyframes tabActivate { from{transform:scale(0.97)} to{transform:scale(1)} }
      `}</style>

      {/* ── 頂部標題列 ── */}
      <div style={{
        background: `linear-gradient(135deg, ${EMPEROR.obsidian}, ${EMPEROR.obsidianMid})`,
        borderBottom: `1px solid ${EMPEROR_UI.borderAccent}`,
        padding: '10px 20px',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 8,
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <span style={{ fontFamily: 'serif', fontSize: 18, color: JIN.bright }}>金</span>
          <span style={{ fontSize: 17, fontWeight: 900, color: EMPEROR_UI.textPrimary }}>⑤ 公告生成中心</span>
          <span style={{ fontSize: 11, background: JIN.void, color: JIN.bright, border: `1px solid ${JIN.shadow}`, padding: '1px 8px', borderRadius: 4 }}>
            {version ? `v${version}` : '待生成'}
          </span>
          {reportDate && (
            <span style={{ fontSize: 11, color: SHUI.bright, background: SHUI.abyss, border: `1px solid ${SHUI.shadow}`, padding: '1px 8px', borderRadius: 4 }}>
              {reportDate}
            </span>
          )}
        </div>
        <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
          {/* 自動複製狀態徽章 */}
          {autoCopied && (
            <div style={{
              background: TU.abyss, border: `1px solid ${TU.shadow}`, borderRadius: 8,
              padding: '4px 12px', fontSize: 11, color: TU.bright, fontWeight: 900,
              animation: 'slideIn 0.3s ease-out',
            }}>
              ✅ 完整版已自動複製到剪貼簿
            </div>
          )}
          {/* 字數統計 */}
          {wordCount > 0 && (
            <div style={{
              background: EMPEROR.obsidian, border: `1px solid ${EMPEROR_UI.borderMain}`,
              borderRadius: 6, padding: '3px 10px', fontSize: 10, color: EMPEROR_UI.textDim, fontFamily: 'monospace',
            }}>
              {wordCount.toLocaleString()} 字
            </div>
          )}
          {/* 刷新按鈕 */}
          <button
            onClick={refetch} disabled={loading}
            style={{
              border: `1px solid ${SHUI.shadow}`, borderRadius: 6, padding: '5px 14px',
              background: loading ? EMPEROR.obsidian : SHUI.void,
              color: loading ? EMPEROR_UI.textDim : SHUI.bright,
              fontSize: 11, fontWeight: 700, cursor: loading ? 'not-allowed' : 'pointer',
            }}
          >
            🔄 {loading ? '載入中…' : '刷新'}
          </button>
          {lastFetchedAt && (
            <span style={{ fontSize: 10, color: EMPEROR_UI.textDim }}>
              更新：{new Date(lastFetchedAt).toLocaleTimeString('zh-TW')}
            </span>
          )}
        </div>
      </div>

      {/* ── 自動複製金色閃光提示條 ── */}
      {copyFlash && (
        <div style={{
          background: `linear-gradient(90deg, ${TU.abyss}, ${TU.void}, ${TU.abyss})`,
          borderBottom: `2px solid ${TU.bright}`,
          padding: '8px 20px', fontSize: 13, fontWeight: 900,
          color: '#ffd700', textAlign: 'center', letterSpacing: '0.08em',
          animation: 'flashGold 0.5s ease-in-out 2, autoCopyPulse 0.8s ease-out',
        }}>
          ⚡ 完整版公告已自動複製！直接貼到 LINE / 群組 即可發送
        </div>
      )}

      {/* ── 審計失敗 ── */}
      {!loading && !auditOk && (
        <div style={{ margin: '16px 20px', padding: '14px 18px', borderRadius: 10, background: '#1a0000', border: '1px solid #7f1d1d', color: '#fca5a5', fontWeight: 700, fontSize: 14 }}>
          ❌ 審計未通過，公告尚不可用。{errorReason ? `\n${errorReason}` : ''}
        </div>
      )}

      {/* ── 無公告提示 ── */}
      {!loading && auditOk && !ann && (
        <div style={{ margin: '16px 20px', padding: '14px 18px', borderRadius: 10, background: HUO.abyss, border: `1px solid ${HUO.shadow}`, color: HUO.text, fontWeight: 700, fontSize: 14 }}>
          ⏳ 審計已通過，公告尚未生成。請先執行排名派單步驟。
        </div>
      )}

      {/* ── 主體：版本標籤 + 內容 ── */}
      {!loading && auditOk && ann && (
        <div style={{ padding: '12px 20px 20px' }}>

          {/* 版本選擇 Tab 列 */}
          <div style={{
            display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 12,
            background: EMPEROR.obsidian, border: `1px solid ${EMPEROR_UI.borderAccent}`,
            borderRadius: 10, padding: '6px',
          }}>
            {VERSIONS.map(v => {
              const vp = v.color as typeof TU;
              const isActive = activeTab === v.key;
              const text = ann[v.key] ?? '';
              return (
                <button
                  key={v.key}
                  onClick={() => setActiveTab(v.key)}
                  style={{
                    flex: 1, minWidth: 120, border: 'none', borderRadius: 7,
                    padding: '8px 10px', cursor: 'pointer',
                    background: isActive
                      ? `linear-gradient(135deg, ${vp.void}, ${vp.abyss})`
                      : 'transparent',
                    borderBottom: `2px solid ${isActive ? vp.bright : 'transparent'}`,
                    transition: 'all 0.2s',
                    animation: isActive ? 'tabActivate 0.2s ease-out' : 'none',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: 5, justifyContent: 'center' }}>
                    <span style={{ fontSize: 14 }}>{v.icon}</span>
                    <span style={{
                      fontSize: 11, fontWeight: isActive ? 900 : 600,
                      color: isActive ? vp.bright : EMPEROR_UI.textMuted,
                      whiteSpace: 'nowrap',
                    }}>
                      {v.label}
                    </span>
                    {text && (
                      <span style={{
                        fontSize: 9, color: vp.core, background: vp.abyss,
                        padding: '0 4px', borderRadius: 3, fontFamily: 'monospace',
                      }}>
                        {text.length}字
                      </span>
                    )}
                  </div>
                  <div style={{ fontSize: 9, color: isActive ? vp.text : EMPEROR_UI.textDim, marginTop: 2, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                    {v.desc}
                  </div>
                </button>
              );
            })}
          </div>

          {/* 當前版本操作列 */}
          <div style={{
            display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8,
            padding: '8px 12px',
            background: p.abyss, border: `1px solid ${p.shadow}`, borderRadius: 8,
          }}>
            <span style={{ fontSize: 16 }}>{activeVersion.icon}</span>
            <span style={{ fontSize: 13, fontWeight: 900, color: p.bright }}>{activeVersion.label}</span>
            <span style={{ fontSize: 11, color: p.text }}>{activeVersion.desc}</span>
            <div style={{ marginLeft: 'auto', display: 'flex', gap: 8, alignItems: 'center' }}>
              {/* 字數 */}
              <span style={{ fontSize: 11, color: p.core, fontFamily: 'monospace' }}>
                {activeText.length.toLocaleString()} 字
              </span>
              {/* 一鍵複製按鈕 */}
              <button
                onClick={() => copyText(activeTab)}
                style={{
                  border: `1px solid ${p.shadow}`, borderRadius: 6,
                  padding: '6px 18px', fontSize: 12, fontWeight: 900,
                  cursor: 'pointer',
                  background: copiedKey === activeTab
                    ? `linear-gradient(135deg, ${p.void}, ${p.abyss})`
                    : `linear-gradient(135deg, ${p.core}, ${p.shadow})`,
                  color: copiedKey === activeTab ? p.bright : '#fff',
                  boxShadow: `0 0 12px ${p.bright}44`,
                  transition: 'all 0.2s',
                  animation: copiedKey === activeTab ? 'autoCopyPulse 0.6s ease-out' : 'none',
                }}
              >
                {copiedKey === activeTab ? '✅ 已複製！' : `📋 複製 ${activeVersion.label}`}
              </button>
              {/* 全選按鈕 */}
              <button
                onClick={() => {
                  const ta = document.getElementById('ann-textarea') as HTMLTextAreaElement | null;
                  ta?.select();
                }}
                style={{
                  border: `1px solid ${EMPEROR_UI.borderAccent}`, borderRadius: 6,
                  padding: '6px 12px', fontSize: 11, fontWeight: 700,
                  cursor: 'pointer', background: EMPEROR.obsidian, color: EMPEROR_UI.textDim,
                }}
              >
                全選
              </button>
            </div>
          </div>

          {/* 公告文字框 */}
          <textarea
            id="ann-textarea"
            readOnly
            value={activeText}
            onDoubleClick={(e) => (e.target as HTMLTextAreaElement).select()}
            style={{
              width: '100%', border: `1px solid ${p.shadow}`, borderRadius: 10,
              padding: '14px 16px', fontSize: 13,
              fontFamily: '"Fira Code", "Consolas", monospace',
              lineHeight: 1.8, boxSizing: 'border-box',
              background: p.abyss, color: p.text,
              outline: 'none', resize: 'vertical',
              minHeight: 360,
              boxShadow: `inset 0 2px 8px rgba(0,0,0,0.3), 0 0 0 1px ${p.core}22`,
              transition: 'all 0.2s',
            }}
          />

          {/* 快速複製所有版本 */}
          <div style={{
            marginTop: 12, display: 'flex', gap: 6, flexWrap: 'wrap', alignItems: 'center',
          }}>
            <span style={{ fontSize: 10, color: EMPEROR_UI.textDim, flexShrink: 0 }}>快速複製：</span>
            {VERSIONS.map(v => {
              const vp = v.color as typeof TU;
              const text = ann[v.key];
              if (!text) return null;
              return (
                <button
                  key={v.key}
                  onClick={() => copyText(v.key)}
                  style={{
                    border: `1px solid ${vp.shadow}`, borderRadius: 5, padding: '3px 10px',
                    background: copiedKey === v.key ? vp.void : 'transparent',
                    color: copiedKey === v.key ? vp.bright : vp.text,
                    fontSize: 10, fontWeight: 700, cursor: 'pointer',
                    transition: 'all 0.15s',
                  }}
                >
                  {copiedKey === v.key ? '✅' : v.icon} {v.label}
                </button>
              );
            })}
            {/* 複製全部（依序合併） */}
            <button
              onClick={() => {
                const all = VERSIONS
                  .map(v => ann[v.key] ? `===【${v.label}】===\n${ann[v.key]}` : '')
                  .filter(Boolean)
                  .join('\n\n');
                navigator.clipboard.writeText(all).catch(() => {});
                setCopiedKey('fullText');
                setTimeout(() => setCopiedKey(null), 2000);
              }}
              style={{
                border: `1px solid ${JIN.shadow}`, borderRadius: 5, padding: '3px 12px',
                background: JIN.void, color: JIN.bright,
                fontSize: 10, fontWeight: 900, cursor: 'pointer', marginLeft: 'auto',
              }}
            >
              📦 複製全部版本
            </button>
          </div>

        </div>
      )}
    </div>
  );
}
