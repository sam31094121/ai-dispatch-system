import React, { useEffect, useState } from 'react';
import { rankingService } from '../services/ranking.service';
import { dispatchService } from '../services/dispatch.service';
import type { RankingGenerateResult } from '../types/ranking';
import type { DispatchGenerateResult, DispatchItem } from '../types/dispatch';
import { PageBlock } from '../components/PageBlock';
import { StatusBadge } from '../components/StatusBadge';
import { formatMoney } from '../utils/formatters';

interface RankingDispatchPageProps {
  reportDate: string;
  onAnnouncement?: (reportDate: string) => void;
}

const thStyle: React.CSSProperties = {
  textAlign: 'right',
  padding: '12px 16px',
  borderBottom: '2px solid #e2e8f0',
  whiteSpace: 'nowrap',
  color: '#475569',
  fontWeight: 700,
  fontSize: 14,
};

const thLeftStyle: React.CSSProperties = {
  ...thStyle,
  textAlign: 'left',
};

const tdStyle: React.CSSProperties = {
  padding: '14px 16px',
  borderBottom: '1px solid #e2e8f0',
  verticalAlign: 'middle',
  color: '#334155',
  fontSize: 15,
};

const buttonStyle: React.CSSProperties = {
  border: 'none',
  borderRadius: 8,
  padding: '12px 20px',
  fontWeight: 600,
  fontSize: 14,
  cursor: 'pointer',
  transition: 'all 0.2s',
  display: 'inline-flex',
  justifyContent: 'center',
  alignItems: 'center',
  boxShadow: '0 2px 4px rgba(0,0,0,0.05)',
};

export function RankingDispatchPage({
  reportDate,
  onAnnouncement,
}: RankingDispatchPageProps): React.ReactElement {
  const [ranking, setRanking] = useState<RankingGenerateResult | null>(null);
  const [dispatchResult, setDispatchResult] = useState<DispatchGenerateResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');

  async function loadData() {
    try {
      setLoading(true);
      const rankingData = await rankingService.generate(reportDate);
      const dispatchData = await dispatchService.generate(reportDate);

      setRanking(rankingData);
      setDispatchResult(dispatchData);
      setMessage('');
    } catch (error: any) {
      setMessage(error?.responseMessage || error?.message || '生成名次或派單失敗 ❌');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void loadData();
  }, [reportDate]);

  function renderDispatchGroup(title: string, items: DispatchItem[], headerColor: string, bgColor: string) {
    return (
      <div
        style={{
          background: bgColor,
          borderRadius: 16,
          padding: 20,
          border: '1px solid',
          borderColor: headerColor,
          minWidth: 280,
          flex: 1,
          boxShadow: '0 4px 12px rgba(0,0,0,0.02)',
        }}
      >
        <h4 style={{ marginTop: 0, marginBottom: 16, color: headerColor, fontSize: 18, fontWeight: 800, borderBottom: `2px solid ${headerColor}`, paddingBottom: 8, display: 'inline-block' }}>
          {title}
        </h4>
        
        {items.length === 0 && <div style={{ color: '#94a3b8', fontStyle: 'italic', padding: 8 }}>目前無人編制於此</div>}
        
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {items.map((item) => (
            <div
              key={`${title}-${item.groupOrderNo}-${item.employeeName}`}
              style={{
                background: '#ffffff',
                padding: '16px',
                borderRadius: 10,
                border: '1px solid #e2e8f0',
                position: 'relative',
                transition: 'transform 0.2s, box-shadow 0.2s',
                cursor: 'default',
              }}
              onMouseOver={e => {
                e.currentTarget.style.transform = 'translateY(-2px)';
                e.currentTarget.style.boxShadow = '0 6px 16px rgba(0,0,0,0.06)';
              }}
              onMouseOut={e => {
                e.currentTarget.style.transform = 'none';
                e.currentTarget.style.boxShadow = 'none';
              }}
            >
              <div style={{ position: 'absolute', top: -10, left: -10, background: headerColor, color: '#fff', width: 28, height: 28, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800, fontSize: 13, border: '3px solid #fff' }}>
                {item.groupOrderNo}
              </div>
              
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8, paddingLeft: 8 }}>
                <div style={{ fontWeight: 800, fontSize: 18, color: '#1e293b' }}>
                  {item.employeeName}
                </div>
                <div style={{ fontSize: 13, color: '#64748b', background: '#f1f5f9', padding: '4px 8px', borderRadius: 999, fontWeight: 700 }}>
                  總名次 #{item.rankNo}
                </div>
              </div>
              
              <div style={{ fontSize: 13, color: '#475569', background: '#f8fafc', padding: '8px 12px', borderRadius: 8, borderLeft: `3px solid ${headerColor}`, lineHeight: 1.5 }}>
                <strong style={{ color: '#334155' }}>💡 派單策略：</strong>{item.suggestionText || '無特別指示'}
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div style={{ background: '#f8fafc', minHeight: '100%', padding: 24 }}>
      <PageBlock
        title="統合戰力：業績排名與智能派單"
        rightSlot={
          loading ? (
            <StatusBadge label="引擎運算中..." tone="warn" />
          ) : (
            <StatusBadge label={`結算日：${reportDate}`} tone="info" />
          )
        }
      >
        {ranking && (
          <div style={{ marginBottom: 40 }}>
            <h3 style={{ margin: '0 0 16px 0', color: '#1e293b', fontSize: 18 }}>🏆 三大平台總營收戰報</h3>
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
                gap: 16,
                marginBottom: 24,
              }}
            >
              <div style={{ background: '#ffffff', padding: '20px', borderRadius: 12, border: '1px solid #e2e8f0', borderLeft: '4px solid #3b82f6' }}>
                <div style={{ fontSize: 13, color: '#64748b', fontWeight: 600, marginBottom: 8 }}>奕心專案</div>
                <div style={{ fontSize: 24, fontWeight: 800, color: '#0f172a' }}>{formatMoney(ranking.summary.yixinTotalRevenue)}</div>
              </div>
              <div style={{ background: '#ffffff', padding: '20px', borderRadius: 12, border: '1px solid #e2e8f0', borderLeft: '4px solid #8b5cf6' }}>
                <div style={{ fontSize: 13, color: '#64748b', fontWeight: 600, marginBottom: 8 }}>民視專案</div>
                <div style={{ fontSize: 24, fontWeight: 800, color: '#0f172a' }}>{formatMoney(ranking.summary.minshiTotalRevenue)}</div>
              </div>
              <div style={{ background: '#ffffff', padding: '20px', borderRadius: 12, border: '1px solid #e2e8f0', borderLeft: '4px solid #f59e0b' }}>
                <div style={{ fontSize: 13, color: '#64748b', fontWeight: 600, marginBottom: 8 }}>公司自營產品</div>
                <div style={{ fontSize: 24, fontWeight: 800, color: '#0f172a' }}>{formatMoney(ranking.summary.companyTotalRevenue)}</div>
              </div>
              <div style={{ background: '#0f172a', padding: '20px', borderRadius: 12, border: '1px solid #1e293b', position: 'relative', overflow: 'hidden' }}>
                <div style={{ position: 'absolute', top: -20, right: -20, width: 100, height: 100, background: '#38bdf8', opacity: 0.2, borderRadius: '50%', filter: 'blur(20px)' }}></div>
                <div style={{ fontSize: 13, color: '#94a3b8', fontWeight: 600, marginBottom: 8 }}>💰 日結算總營業額</div>
                <div style={{ fontSize: 28, fontWeight: 900, color: '#f8fafc', letterSpacing: '0.02em' }}>{formatMoney(ranking.summary.allTotalRevenue)}</div>
              </div>
            </div>

            <h3 style={{ margin: '0 0 16px 0', color: '#1e293b', fontSize: 18 }}>⚔️ 英雄榜 (整合名次)</h3>
            <div style={{ overflowX: 'auto', borderRadius: 12, border: '1px solid #e2e8f0', background: '#ffffff' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr style={{ background: '#f1f5f9' }}>
                    <th style={{ ...thStyle, textAlign: 'center', width: 60 }}>🏆</th>
                    <th style={thLeftStyle}>姓名</th>
                    <th style={thStyle}>追單數</th>
                    <th style={thStyle}>續單業績</th>
                    <th style={thStyle}>總牌價業績</th>
                    <th style={{ ...thStyle, color: '#059669' }}>💸 實收業績</th>
                  </tr>
                </thead>
                <tbody>
                  {ranking.rankings.map((row, index) => {
                    const isTop3 = index < 3;
                    return (
                      <tr key={`${row.rankNo}-${row.employeeName}`} style={{ background: isTop3 ? '#fffbeb' : 'transparent', transition: 'background 0.2s' }} onMouseOver={e => !isTop3 && (e.currentTarget.style.background = '#f8fafc')} onMouseOut={e => !isTop3 && (e.currentTarget.style.background = 'transparent')}>
                        <td style={{ ...tdStyle, textAlign: 'center', fontWeight: 900, fontSize: isTop3 ? 18 : 15, color: row.rankNo === 1 ? '#d97706' : row.rankNo === 2 ? '#64748b' : row.rankNo === 3 ? '#b45309' : '#94a3b8' }}>
                          #{row.rankNo}
                        </td>
                        <td style={{ ...tdStyle, fontWeight: 800, color: '#1e293b', fontSize: 16 }}>
                          {row.employeeName}
                        </td>
                        <td style={{ ...tdStyle, textAlign: 'right', fontFamily: 'monospace', fontSize: 16 }}>{row.totalFollowupCount}</td>
                        <td style={{ ...tdStyle, textAlign: 'right', fontFamily: 'monospace', fontSize: 16 }}>{formatMoney(row.totalFollowupAmount)}</td>
                        <td style={{ ...tdStyle, textAlign: 'right', fontFamily: 'monospace', fontSize: 16, color: '#475569' }}>{formatMoney(row.totalRevenueAmount)}</td>
                        <td style={{ ...tdStyle, textAlign: 'right', fontFamily: 'monospace', fontSize: 16, fontWeight: 800, color: '#059669' }}>{formatMoney(row.totalActualAmount)}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {dispatchResult && (
          <div style={{ marginBottom: 32 }}>
            <h3 style={{ margin: '0 0 16px 0', color: '#1e293b', fontSize: 18 }}>🎯 明日 AI 派單全域分組 (自動解鎖)</h3>
            <div
              style={{
                display: 'flex',
                gap: 20,
                alignItems: 'stretch',
                overflowX: 'auto',
                paddingBottom: 8,
              }}
            >
              {renderDispatchGroup('A1 突破之刃 (高單主力)', dispatchResult.groups.A1, '#dc2626', '#fef2f2')}
              {renderDispatchGroup('A2 獵鷹部隊 (續單收割)', dispatchResult.groups.A2, '#ea580c', '#fff7ed')}
              {renderDispatchGroup('B 磐石陣線 (量單主軸)', dispatchResult.groups.B, '#2563eb', '#eff6ff')}
              {renderDispatchGroup('C 破風新銳 (補位成長)', dispatchResult.groups.C, '#059669', '#ecfdf5')}
            </div>
          </div>
        )}

        <div style={{ display: 'flex', gap: 16, marginTop: 16, padding: '20px 0', borderTop: '1px solid #e2e8f0' }}>
          <button
            type="button"
            onClick={loadData}
            disabled={loading}
            style={{
              ...buttonStyle,
              background: '#e2e8f0',
              color: '#475569',
              opacity: loading ? 0.7 : 1,
            }}
            onMouseOver={(e) => (e.currentTarget.style.background = '#cbd5e1')}
            onMouseOut={(e) => (e.currentTarget.style.background = '#e2e8f0')}
          >
            🔄 重新洗牌計算
          </button>

          <button
            type="button"
            disabled={loading || !ranking}
            onClick={() => onAnnouncement?.(reportDate)}
            style={{
              ...buttonStyle,
              background: '#0f172a',
              color: '#ffffff',
            }}
          >
            封裝進入公告輸出 ➔
          </button>
        </div>

        {message && (
          <div
            style={{
              marginTop: 16,
              padding: '12px 16px',
              borderRadius: 8,
              background: '#fffbeb',
              color: '#92400e',
              fontWeight: 600,
              border: '1px solid #fde68a',
            }}
          >
            {message}
          </div>
        )}
      </PageBlock>
    </div>
  );
}
