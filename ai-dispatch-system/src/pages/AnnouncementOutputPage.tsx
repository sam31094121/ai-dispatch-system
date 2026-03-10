import React, { useEffect, useState } from 'react';
import { announcementService } from '../services/announcement.service';
import type { AnnouncementOutput } from '../types/announcement';
import { PageBlock } from '../components/PageBlock';
import { StatusBadge } from '../components/StatusBadge';

interface AnnouncementOutputPageProps {
  reportDate: string;
}

const textAreaStyle: React.CSSProperties = {
  width: '100%',
  minHeight: 180,
  resize: 'vertical',
  border: '1px solid #cbd5e1',
  borderRadius: 12,
  padding: '16px',
  fontSize: 14,
  fontFamily: '"Fira Code", monospace',
  lineHeight: 1.6,
  boxSizing: 'border-box',
  background: '#f8fafc',
  color: '#334155',
  transition: 'border-color 0.2s',
  outline: 'none',
};

const copyButtonStyle: React.CSSProperties = {
  border: '1px solid #e2e8f0',
  background: '#ffffff',
  color: '#475569',
  padding: '6px 14px',
  borderRadius: 6,
  fontSize: 13,
  fontWeight: 700,
  cursor: 'pointer',
  transition: 'all 0.2s',
  boxShadow: '0 1px 2px rgba(0,0,0,0.05)',
  display: 'inline-flex',
  alignItems: 'center',
  gap: 6,
};

const generateButtonStyle: React.CSSProperties = {
  border: 'none',
  background: '#2a4365',
  color: '#fff',
  borderRadius: 8,
  padding: '12px 24px',
  cursor: 'pointer',
  fontWeight: 700,
  fontSize: 15,
  transition: 'background 0.2s',
  display: 'inline-flex',
  alignItems: 'center',
  gap: 8,
};

export function AnnouncementOutputPage({
  reportDate,
}: AnnouncementOutputPageProps): React.ReactElement {
  const [data, setData] = useState<AnnouncementOutput | null>(null);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  async function generate() {
    try {
      setLoading(true);
      const result = await announcementService.generate(reportDate);
      setData(result);
      setMessage('公告封裝成功 ✅');
      setTimeout(() => setMessage(''), 3000);
    } catch (error: any) {
      setMessage(error?.responseMessage || error?.message || '生成引擎發生錯誤 ❌');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void generate();
  }, [reportDate]);

  async function copyText(text: string | null | undefined, key: string, label: string) {
    if (!text) return;
    try {
      await navigator.clipboard.writeText(text);
      setCopiedKey(key);
      setTimeout(() => setCopiedKey(null), 2000);
    } catch (e) {
      setMessage('複製失敗，請手動框選複製 ❌');
    }
  }

  return (
    <div style={{ background: '#f8fafc', minHeight: '100%', padding: 24 }}>
      <PageBlock
        title="最終站：多渠道公告輸出中心"
        rightSlot={
          loading ? (
            <StatusBadge label="多維度生成中..." tone="warn" />
          ) : (
            <StatusBadge label={`結算日：${reportDate}`} tone="pass" />
          )
        }
      >
        <p style={{ color: '#64748b', fontSize: 14, marginBottom: 24 }}>
          系統已為您備妥適用於不同情境與軟體的公告文案。請挑選最合適的文案直接發送：
        </p>

        {message && (
          <div
            style={{
              padding: '12px 16px',
              borderRadius: 8,
              background: message.includes('成功') ? '#ecfdf5' : '#fef2f2',
              color: message.includes('成功') ? '#065f46' : '#991b1b',
              fontWeight: 600,
              fontSize: 14,
              border: `1px solid ${message.includes('成功') ? '#a7f3d0' : '#fecaca'}`,
              marginBottom: 20
            }}
          >
            {message}
          </div>
        )}

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(360px, 1fr))', gap: 24 }}>
          <div style={{ background: '#ffffff', padding: 20, borderRadius: 16, border: '1px solid #e2e8f0', boxShadow: '0 4px 6px rgba(0,0,0,0.02)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
              <strong style={{ color: '#1e293b', fontSize: 16 }}>📋 完整長版公告</strong>
              <button 
                onClick={() => copyText(data?.fullText, 'full', '完整長版公告')} 
                style={copyButtonStyle}
                onMouseOver={(e) => (e.currentTarget.style.background = '#f1f5f9')}
                onMouseOut={(e) => (e.currentTarget.style.background = '#ffffff')}
              >
                {copiedKey === 'full' ? '已複製 ✅' : '點擊複製 📋'}
              </button>
            </div>
            <textarea readOnly value={data?.fullText ?? ''} style={textAreaStyle} placeholder="等待生成..." />
          </div>

          <div style={{ background: '#ffffff', padding: 20, borderRadius: 16, border: '1px solid #e2e8f0', boxShadow: '0 4px 6px rgba(0,0,0,0.02)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
              <strong style={{ color: '#10b981', fontSize: 16 }}>💬 LINE 精簡快訊</strong>
              <button 
                onClick={() => copyText(data?.lineText, 'line', 'LINE 精簡快訊')} 
                style={copyButtonStyle}
                onMouseOver={(e) => (e.currentTarget.style.background = '#f1f5f9')}
                onMouseOut={(e) => (e.currentTarget.style.background = '#ffffff')}
              >
                {copiedKey === 'line' ? '已複製 ✅' : '點擊複製 📋'}
              </button>
            </div>
            <textarea readOnly value={data?.lineText ?? ''} style={textAreaStyle} placeholder="等待生成..." />
          </div>

          <div style={{ background: '#ffffff', padding: 20, borderRadius: 16, border: '1px solid #e2e8f0', boxShadow: '0 4px 6px rgba(0,0,0,0.02)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
              <strong style={{ color: '#8b5cf6', fontSize: 16 }}>⚡ 提振超短版</strong>
              <button 
                onClick={() => copyText(data?.shortText, 'short', '提振超短版')} 
                style={copyButtonStyle}
                onMouseOver={(e) => (e.currentTarget.style.background = '#f1f5f9')}
                onMouseOut={(e) => (e.currentTarget.style.background = '#ffffff')}
              >
                {copiedKey === 'short' ? '已複製 ✅' : '點擊複製 📋'}
              </button>
            </div>
            <textarea readOnly value={data?.shortText ?? ''} style={textAreaStyle} placeholder="等待生成..." />
          </div>

          <div style={{ background: '#ffffff', padding: 20, borderRadius: 16, border: '1px solid #e2e8f0', boxShadow: '0 4px 6px rgba(0,0,0,0.02)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
              <strong style={{ color: '#3b82f6', fontSize: 16 }}>🎤 語音播報版稿</strong>
              <button 
                onClick={() => copyText(data?.voiceText, 'voice', '語音播報版稿')} 
                style={copyButtonStyle}
                onMouseOver={(e) => (e.currentTarget.style.background = '#f1f5f9')}
                onMouseOut={(e) => (e.currentTarget.style.background = '#ffffff')}
              >
                {copiedKey === 'voice' ? '已複製 ✅' : '點擊複製 📋'}
              </button>
            </div>
            <textarea readOnly value={data?.voiceText ?? ''} style={textAreaStyle} placeholder="等待生成..." />
          </div>

          <div style={{ background: '#dc2626', padding: 20, borderRadius: 16, border: '1px solid #ef4444', boxShadow: '0 4px 6px rgba(0,0,0,0.02)', gridColumn: '1 / -1' }}>
             <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
              <strong style={{ color: '#ffffff', fontSize: 16 }}>🔒 主管內部機密報告</strong>
              <button 
                onClick={() => copyText(data?.managerText, 'manager', '主管內部機密報告')} 
                style={{ ...copyButtonStyle, background: '#fee2e2', borderColor: '#fee2e2', color: '#dc2626' }}
                onMouseOver={(e) => (e.currentTarget.style.filter = 'brightness(0.95)')}
                onMouseOut={(e) => (e.currentTarget.style.filter = 'none')}
              >
                {copiedKey === 'manager' ? '已收繳 ✅' : '限主管複製 🤫'}
              </button>
            </div>
            <textarea readOnly value={data?.managerText ?? ''} style={{ ...textAreaStyle, background: '#7f1d1d', color: '#fca5a5', borderColor: '#991b1b' }} placeholder="等待生成..." />
          </div>
        </div>

        <div style={{ display: 'flex', gap: 12, marginTop: 32, borderTop: '1px solid #e2e8f0', paddingTop: 24 }}>
          <button
            type="button"
            onClick={generate}
            disabled={loading}
            style={{
              ...generateButtonStyle,
              opacity: loading ? 0.7 : 1,
            }}
          >
            🔄 重整抓取最新文案
          </button>
        </div>
      </PageBlock>
    </div>
  );
}
