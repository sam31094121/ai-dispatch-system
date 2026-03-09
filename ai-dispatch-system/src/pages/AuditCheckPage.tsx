import React, { useEffect, useState } from 'react';
import { auditService } from '../services/audit.service';
import type { AuditRunResult, AuditIssue } from '../types/audit';
import { PageBlock } from '../components/PageBlock';
import { StatusBadge } from '../components/StatusBadge';

interface AuditCheckPageProps {
  reportId: number;
  onPassed?: (reportId: number) => void;
}

const thStyle: React.CSSProperties = {
  textAlign: 'left',
  padding: '12px 16px',
  borderBottom: '2px solid #e2e8f0',
  whiteSpace: 'nowrap',
  color: '#475569',
  fontWeight: 700,
  fontSize: 14,
};

const tdStyle: React.CSSProperties = {
  padding: '14px 16px',
  borderBottom: '1px solid #e2e8f0',
  verticalAlign: 'middle',
  fontSize: 14,
  color: '#334155',
};

const buttonStyle: React.CSSProperties = {
  border: 'none',
  borderRadius: 8,
  padding: '10px 18px',
  fontWeight: 600,
  fontSize: 14,
  cursor: 'pointer',
  transition: 'all 0.2s',
  display: 'inline-flex',
  justifyContent: 'center',
  alignItems: 'center',
  gap: 8,
};

export function getAuditTone(result: string): 'pass' | 'fail' | 'warn' | 'info' {
  if (result === '通過') return 'pass';
  if (result === '失敗') return 'fail';
  if (result === '鎖死') return 'fail';
  if (result === '警告') return 'warn';
  return 'info';
}

export function AuditCheckPage({
  reportId,
  onPassed,
}: AuditCheckPageProps): React.ReactElement {
  const [result, setResult] = useState<AuditRunResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');

  async function runAudit() {
    try {
      setLoading(true);
      const data = await auditService.runAudit(reportId, {
        runConsistencyCheck: true,
        runLogicCheck: true,
        runCumulativeCheck: true,
      });
      setResult(data);
      setMessage(data.finalResult === '通過' ? '審計通過 ✅' : '審計發現異常 ⚠️');
    } catch (error: any) {
      setMessage(error?.responseMessage || error?.message || '審計執行失敗 ❌');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void runAudit();
  }, [reportId]);

  async function handleManualApprove() {
    try {
      setLoading(true);
      await auditService.manualApprove(reportId, {
        approvedByUserId: 1, // 此處先寫死供展示
        noteText: '前端審計頁人工確認通過',
      });
      setMessage('人工強行過件已授權並紀錄 📝');
      await runAudit();
    } catch (error: any) {
      setMessage(error?.responseMessage || error?.message || '強行授權失敗 ❌');
    } finally {
      setLoading(false);
    }
  }

  const hasPass = result?.finalResult === '通過';

  return (
    <div style={{ background: '#f8fafc', minHeight: '100%', padding: 24 }}>
      <PageBlock
        title="AI 智控審計與異常稽核"
        rightSlot={
          loading ? (
            <StatusBadge label="多維度審計分析中..." tone="warn" />
          ) : result ? (
            <StatusBadge
              label={`總體評估：${result.finalResult}`}
              tone={getAuditTone(result.finalResult)}
            />
          ) : (
            <StatusBadge label="待命審計" tone="info" />
          )
        }
      >
        {result && (
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
              gap: 16,
              background: '#ffffff',
              padding: 20,
              borderRadius: 12,
              border: `1px solid ${hasPass ? '#a7f3d0' : '#fecaca'}`,
              marginBottom: 24,
              boxShadow: '0 2px 10px rgba(0,0,0,0.02)',
            }}
          >
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              <span style={{ fontSize: 13, color: '#64748b', fontWeight: 600 }}>模組一：總分一致性</span>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 16, fontWeight: 700, color: '#1e293b' }}>
                天地盤 <StatusBadge label={result.consistencyResult} tone={getAuditTone(result.consistencyResult)} />
              </div>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              <span style={{ fontSize: 13, color: '#64748b', fontWeight: 600 }}>模組二：商業法則判斷</span>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 16, fontWeight: 700, color: '#1e293b' }}>
                邏輯盤 <StatusBadge label={result.logicResult} tone={getAuditTone(result.logicResult)} />
              </div>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              <span style={{ fontSize: 13, color: '#64748b', fontWeight: 600 }}>模組三：歷史基線檢測</span>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 16, fontWeight: 700, color: '#1e293b' }}>
                累積盤 <StatusBadge label={result.cumulativeResult} tone={getAuditTone(result.cumulativeResult)} />
              </div>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 6, borderLeft: '1px dashed #cbd5e1', paddingLeft: 16 }}>
              <span style={{ fontSize: 13, color: '#64748b', fontWeight: 600 }}>系統判定放行</span>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 16, fontWeight: 700, color: '#1e293b' }}>
                准予派單 <StatusBadge label={result.canGenerateDispatch ? '允許' : '否決'} tone={result.canGenerateDispatch ? 'pass' : 'fail'} />
              </div>
            </div>
          </div>
        )}

        <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', marginBottom: 24 }}>
          <button
            type="button"
            onClick={runAudit}
            disabled={loading}
            style={{
              ...buttonStyle,
              background: '#2a4365',
              color: '#fff',
              opacity: loading ? 0.7 : 1,
            }}
          >
            🔄 重新執行全盤審計
          </button>

          <button
            type="button"
            onClick={handleManualApprove}
            disabled={loading || hasPass}
            style={{
              ...buttonStyle,
              background: '#ffffff',
              color: '#d97706',
              border: '1px solid #fcd34d',
              opacity: (loading || hasPass) ? 0.5 : 1,
              cursor: (loading || hasPass) ? 'not-allowed' : 'pointer',
            }}
            onMouseOver={(e) => !hasPass && (e.currentTarget.style.background = '#fffbeb')}
            onMouseOut={(e) => (e.currentTarget.style.background = '#ffffff')}
            title="僅限特殊例外狀況或系統誤判時使用"
          >
            ⚠️ 主管強行授權過件
          </button>

          <button
            type="button"
            disabled={!hasPass || loading}
            onClick={() => onPassed?.(reportId)}
            style={{
              ...buttonStyle,
              background: hasPass ? '#059669' : '#e2e8f0',
              color: hasPass ? '#ffffff' : '#64748b',
              cursor: hasPass ? 'pointer' : 'not-allowed',
            }}
          >
            進入排名與派單分發 ➔
          </button>
        </div>

        {message && (
          <div
            style={{
              marginBottom: 24,
              padding: '12px 16px',
              borderRadius: 8,
              background: hasPass ? '#ecfdf5' : '#fef2f2',
              color: hasPass ? '#065f46' : '#991b1b',
              fontWeight: 600,
              fontSize: 14,
              border: `1px solid ${hasPass ? '#a7f3d0' : '#fecaca'}`,
            }}
          >
            {message}
          </div>
        )}

        {(!result?.issues || result.issues.length > 0) && (
          <h3 style={{ margin: '0 0 16px 0', color: '#1e293b', fontSize: 18 }}>🚨 發現異常紅單</h3>
        )}

        <div style={{ overflowX: 'auto', borderRadius: 12, border: '1px solid #e2e8f0', background: '#ffffff' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ background: '#f8fafc' }}>
                <th style={thStyle}>異常類型</th>
                <th style={thStyle}>嚴重等級</th>
                <th style={thStyle}>衝突欄位</th>
                <th style={thStyle}>計算原始值</th>
                <th style={thStyle}>系統應得值</th>
                <th style={thStyle}>短缺溢出</th>
                <th style={thStyle}>除錯建議與說明</th>
              </tr>
            </thead>
            <tbody>
              {!result?.issues?.length && !loading && (
                <tr>
                  <td style={{ ...tdStyle, padding: 32, textAlign: 'center', color: '#059669', fontWeight: 600 }} colSpan={7}>
                    🎉 恭喜！全盤稽核驗收通過，資料潔淨無瑕疵。
                  </td>
                </tr>
              )}

              {result?.issues?.map((issue: AuditIssue) => (
                <tr key={issue.id} style={{ transition: 'background 0.2s', background: issue.issueLevel === '鎖死' ? '#fef2f2' : '#fffbeb' }} onMouseOver={e => e.currentTarget.style.filter = 'brightness(0.97)'} onMouseOut={e => e.currentTarget.style.filter = 'none'}>
                  <td style={{ ...tdStyle, fontWeight: 700, color: '#1e293b' }}>{issue.issueType}</td>
                  <td style={tdStyle}>
                    <StatusBadge
                      label={issue.issueLevel}
                      tone={issue.issueLevel === '鎖死' ? 'fail' : 'warn'}
                    />
                  </td>
                  <td style={{ ...tdStyle, fontFamily: 'monospace', color: '#334155' }}>{issue.fieldName || '-'}</td>
                  <td style={{ ...tdStyle, color: '#dc2626', fontWeight: 600, textDecoration: 'line-through' }}>{issue.rawValue || '-'}</td>
                  <td style={{ ...tdStyle, color: '#059669', fontWeight: 600 }}>{issue.expectedValue || '-'}</td>
                  <td style={{ ...tdStyle, color: '#b45309', fontWeight: 700 }}>{issue.diffValue || '-'}</td>
                  <td style={{ ...tdStyle, color: '#475569', fontSize: 13, lineHeight: 1.5 }}>{issue.suggestionText || '-'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </PageBlock>
    </div>
  );
}
