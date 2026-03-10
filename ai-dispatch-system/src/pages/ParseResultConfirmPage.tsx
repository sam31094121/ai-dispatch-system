import React, { useEffect, useState } from 'react';
import { reportService } from '../services/report.service';
import type {
  DailyReportDetail,
  DailyReportTotals,
} from '../types/report';
import { PageBlock } from '../components/PageBlock';
import { StatusBadge } from '../components/StatusBadge';
import { formatMoney, formatPercent } from '../utils/formatters';

interface ParseResultConfirmPageProps {
  reportId: number;
  onAudit?: (reportId: number) => void;
}

const inputStyle: React.CSSProperties = {
  width: '100%',
  border: '1px solid #cbd5e1',
  borderRadius: 6,
  padding: '8px 10px',
  fontSize: 14,
  boxSizing: 'border-box',
  outline: 'none',
  transition: 'border-color 0.2s',
  color: '#334155',
};

const labelStyle: React.CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  gap: 6,
  fontSize: 13,
  fontWeight: 600,
  color: '#475569',
};

const tableCellStyle: React.CSSProperties = {
  borderBottom: '1px solid #e2e8f0',
  padding: '12px 10px',
  fontSize: 14,
  verticalAlign: 'middle',
  color: '#334155',
};

const buttonStyle: React.CSSProperties = {
  border: 'none',
  borderRadius: 8,
  padding: '10px 16px',
  fontWeight: 600,
  fontSize: 14,
  cursor: 'pointer',
  transition: 'all 0.2s',
};

export function ParseResultConfirmPage({
  reportId,
  onAudit,
}: ParseResultConfirmPageProps): React.ReactElement {
  const [totals, setTotals] = useState<DailyReportTotals | null>(null);
  const [details, setDetails] = useState<DailyReportDetail[]>([]);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [saveMessage, setSaveMessage] = useState('');

  async function loadData() {
    try {
      setLoading(true);
      const result = await reportService.getParseResult(reportId);
      setTotals(result.totals as DailyReportTotals);
      setDetails(result.details as DailyReportDetail[]);
      setMessage('');
    } catch (error: any) {
      setMessage(error?.responseMessage || error?.message || '讀取解析結果失敗');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void loadData();
  }, [reportId]);

  async function handleSaveTotals() {
    if (!totals) return;

    try {
      setLoading(true);
      await reportService.updateTotals(reportId, {
        totalCalls: totals.totalCalls,
        assignedDealsCount: totals.assignedDealsCount,
        followupDealsCount: totals.followupDealsCount,
        closingRatePercent: totals.closingRatePercent,
        followupAmount: totals.followupAmount,
        cancelledReturnAmount: totals.cancelledReturnAmount,
        totalRevenueAmount: totals.totalRevenueAmount,
        changeReason: '前端解析確認頁人工修正總計',
      });
      setSaveMessage('總計儲存成功 ✅');
      setTimeout(() => setSaveMessage(''), 3000);
    } catch (error: any) {
      setSaveMessage(error?.responseMessage || error?.message || '總計儲存失敗 ❌');
    } finally {
      setLoading(false);
    }
  }

  async function handleSaveDetail(detail: DailyReportDetail) {
    try {
      setLoading(true);
      await reportService.updateDetail(detail.id, {
        employeeName: detail.employeeName,
        normalizedName: detail.normalizedName,
        identityTag: detail.identityTag,
        totalCalls: detail.totalCalls,
        assignedDealsCount: detail.assignedDealsCount,
        followupDealsCount: detail.followupDealsCount,
        closingRatePercent: detail.closingRatePercent,
        followupAmount: detail.followupAmount,
        cancelledReturnAmount: detail.cancelledReturnAmount,
        totalRevenueAmount: detail.totalRevenueAmount,
        changeReason: '前端解析確認頁人工修正明細',
      });
      setSaveMessage(`已儲存：${detail.employeeName} ✅`);
      setTimeout(() => setSaveMessage(''), 3000);
    } catch (error: any) {
      setSaveMessage(error?.responseMessage || error?.message || '明細儲存失敗 ❌');
    } finally {
      setLoading(false);
    }
  }

  function updateTotalsField<K extends keyof DailyReportTotals>(
    key: K,
    value: DailyReportTotals[K]
  ) {
    setTotals((prev) => (prev ? { ...prev, [key]: value } : prev));
  }

  function updateDetailField<K extends keyof DailyReportDetail>(
    rowId: number,
    key: K,
    value: DailyReportDetail[K]
  ) {
    setDetails((prev) =>
      prev.map((item) => (item.id === rowId ? { ...item, [key]: value } : item))
    );
  }

  return (
    <div style={{ background: '#f8fafc', minHeight: '100%', padding: 24 }}>
      <PageBlock
        title="解析結果確認與除錯"
        rightSlot={
          loading ? (
            <StatusBadge label="資料傳輸中..." tone="warn" />
          ) : (
            <StatusBadge label={`目前處理報表編號：${reportId}`} tone="info" />
          )
        }
      >
        {message && (
          <div
            style={{
              padding: 12,
              marginBottom: 16,
              background: '#fef2f2',
              color: '#b91c1c',
              borderRadius: 8,
              fontWeight: 600,
            }}
          >
            {message}
          </div>
        )}

        {totals && (
          <div style={{ marginBottom: 32 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
              <h3 style={{ margin: 0, color: '#1e293b', fontSize: 18 }}>🎯 總計覆核</h3>
              {saveMessage && (
                <span style={{ color: saveMessage.includes('成功') ? '#059669' : '#dc2626', fontWeight: 600, fontSize: 13 }}>
                  {saveMessage}
                </span>
              )}
            </div>

            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))',
                gap: 16,
                background: '#ffffff',
                padding: 20,
                borderRadius: 12,
                border: '1px solid #e2e8f0',
                marginBottom: 20,
              }}
            >
              <label style={labelStyle}>
                累積總通數
                <input
                  style={inputStyle}
                  type="number"
                  value={totals.totalCalls}
                  onChange={(e) =>
                    updateTotalsField('totalCalls', Number(e.target.value))
                  }
                />
              </label>

              <label style={labelStyle}>
                派單成交
                <input
                  style={inputStyle}
                  type="number"
                  value={totals.assignedDealsCount}
                  onChange={(e) =>
                    updateTotalsField('assignedDealsCount', Number(e.target.value))
                  }
                />
              </label>

              <label style={labelStyle}>
                追續成交
                <input
                  style={inputStyle}
                  type="number"
                  value={totals.followupDealsCount}
                  onChange={(e) =>
                    updateTotalsField('followupDealsCount', Number(e.target.value))
                  }
                />
              </label>

              <label style={labelStyle}>
                當月成交率 (%)
                <input
                  style={inputStyle}
                  type="number"
                  value={totals.closingRatePercent ?? ''}
                  onChange={(e) =>
                    updateTotalsField(
                      'closingRatePercent',
                      e.target.value ? Number(e.target.value) : null
                    )
                  }
                />
              </label>

              <label style={labelStyle}>
                追續單金額
                <input
                  style={inputStyle}
                  type="number"
                  value={totals.followupAmount}
                  onChange={(e) =>
                    updateTotalsField('followupAmount', Number(e.target.value))
                  }
                />
              </label>

              <label style={labelStyle}>
                取消退貨
                <input
                  style={inputStyle}
                  type="number"
                  value={totals.cancelledReturnAmount}
                  onChange={(e) =>
                    updateTotalsField(
                      'cancelledReturnAmount',
                      Number(e.target.value)
                    )
                  }
                />
              </label>

              <label style={labelStyle}>
                當月總業績
                <input
                  style={inputStyle}
                  type="number"
                  value={totals.totalRevenueAmount}
                  onChange={(e) =>
                    updateTotalsField('totalRevenueAmount', Number(e.target.value))
                  }
                />
              </label>
            </div>

            <div style={{ display: 'flex', gap: 12 }}>
              <button
                type="button"
                onClick={handleSaveTotals}
                disabled={loading}
                style={{
                  ...buttonStyle,
                  background: '#2a4365',
                  color: '#fff',
                  opacity: loading ? 0.7 : 1,
                }}
              >
                💾 儲存總計並留存紀錄
              </button>

              <button
                type="button"
                onClick={() => onAudit?.(reportId)}
                style={{
                  ...buttonStyle,
                  background: '#059669',
                  color: '#fff',
                }}
              >
                前進審計階段 ➔
              </button>
            </div>
          </div>
        )}

        <h3 style={{ margin: '0 0 16px 0', color: '#1e293b', fontSize: 18 }}>👥 團隊個人明細</h3>

        <div style={{ overflowX: 'auto', borderRadius: 12, border: '1px solid #e2e8f0', background: '#ffffff' }}>
          <table
            style={{
              width: '100%',
              borderCollapse: 'collapse',
            }}
          >
            <thead>
              <tr style={{ background: '#f1f5f9' }}>
                {[
                  '姓名',
                  '身分',
                  '總通數',
                  '派單成交',
                  '追續成交',
                  '成交率',
                  '追續金額',
                  '取消退貨',
                  '當月業績',
                  '操作',
                ].map((head) => (
                  <th
                    key={head}
                    style={{
                      ...tableCellStyle,
                      fontWeight: 700,
                      textAlign: 'left',
                      whiteSpace: 'nowrap',
                      color: '#475569',
                      borderBottom: '2px solid #e2e8f0',
                    }}
                  >
                    {head}
                  </th>
                ))}
              </tr>
            </thead>

            <tbody>
              {details.length === 0 && !loading && (
                <tr>
                  <td colSpan={10} style={{ padding: 24, textAlign: 'center', color: '#94a3b8' }}>
                    未讀取到明細資料
                  </td>
                </tr>
              )}
              {details.map((row) => (
                <tr key={row.id} style={{ transition: 'background 0.2s' }} onMouseOver={e => e.currentTarget.style.background = '#f8fafc'} onMouseOut={e => e.currentTarget.style.background = 'transparent'}>
                  <td style={tableCellStyle}>
                    <input
                      style={{...inputStyle, width: 80}}
                      value={row.employeeName}
                      onChange={(e) =>
                        updateDetailField(row.id, 'employeeName', e.target.value)
                      }
                    />
                  </td>

                  <td style={tableCellStyle}>
                    <input
                      style={{...inputStyle, width: 60}}
                      value={row.identityTag}
                      onChange={(e) =>
                        updateDetailField(row.id, 'identityTag', e.target.value as any)
                      }
                    />
                  </td>

                  <td style={tableCellStyle}>
                    <input
                      style={{...inputStyle, width: 70}}
                      type="number"
                      value={row.totalCalls}
                      onChange={(e) =>
                        updateDetailField(row.id, 'totalCalls', Number(e.target.value))
                      }
                    />
                  </td>

                  <td style={tableCellStyle}>
                    <input
                      style={{...inputStyle, width: 70}}
                      type="number"
                      value={row.assignedDealsCount}
                      onChange={(e) =>
                        updateDetailField(
                          row.id,
                          'assignedDealsCount',
                          Number(e.target.value)
                        )
                      }
                    />
                  </td>

                  <td style={tableCellStyle}>
                    <input
                      style={{...inputStyle, width: 70}}
                      type="number"
                      value={row.followupDealsCount}
                      onChange={(e) =>
                        updateDetailField(
                          row.id,
                          'followupDealsCount',
                          Number(e.target.value)
                        )
                      }
                    />
                  </td>

                  <td style={{...tableCellStyle, fontWeight: 600, color: '#0f172a'}}>
                    <div style={{ minWidth: 60 }}>
                      {formatPercent(row.closingRatePercent)}
                    </div>
                  </td>

                  <td style={tableCellStyle}>
                    <input
                      style={{...inputStyle, width: 90}}
                      type="number"
                      value={row.followupAmount}
                      onChange={(e) =>
                        updateDetailField(
                          row.id,
                          'followupAmount',
                          Number(e.target.value)
                        )
                      }
                    />
                  </td>

                  <td style={tableCellStyle}>
                    <input
                      style={{...inputStyle, width: 90}}
                      type="number"
                      value={row.cancelledReturnAmount}
                      onChange={(e) =>
                        updateDetailField(
                          row.id,
                          'cancelledReturnAmount',
                          Number(e.target.value)
                        )
                      }
                    />
                  </td>

                  <td style={tableCellStyle}>
                    <input
                      style={{...inputStyle, width: 100, fontWeight: 600}}
                      type="number"
                      value={row.totalRevenueAmount}
                      onChange={(e) =>
                        updateDetailField(
                          row.id,
                          'totalRevenueAmount',
                          Number(e.target.value)
                        )
                      }
                    />
                  </td>

                  <td style={tableCellStyle}>
                    <button
                      type="button"
                      disabled={loading}
                      onClick={() => handleSaveDetail(row)}
                      style={{
                        ...buttonStyle,
                        background: '#e2e8f0',
                        color: '#475569',
                        padding: '6px 12px',
                        fontSize: 13,
                        opacity: loading ? 0.7 : 1,
                      }}
                      onMouseOver={(e) => (e.currentTarget.style.background = '#cbd5e1')}
                      onMouseOut={(e) => (e.currentTarget.style.background = '#e2e8f0')}
                    >
                      儲存單筆
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {totals && (
          <div style={{ marginTop: 24, padding: 16, background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: 12, color: '#334155', fontWeight: 600, display: 'flex', gap: 24 }}>
            <span>📊 系統加總試算：</span>
            <span>總通數 {totals.totalCalls}</span>
            <span>追續單 {formatMoney(totals.followupAmount)}</span>
            <span>總業績 <span style={{ color: '#059669', fontSize: 16 }}>{formatMoney(totals.totalRevenueAmount)}</span></span>
          </div>
        )}
      </PageBlock>
    </div>
  );
}
