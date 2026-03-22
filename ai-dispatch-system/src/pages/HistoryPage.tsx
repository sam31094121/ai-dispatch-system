import React, { useState, useEffect } from 'react';
import { History, Search, Calendar, User, Filter, RefreshCw } from 'lucide-react';
import { EMPEROR_UI, EMPEROR, MU, HUO, SHUI, TU, JIN } from '../constants/wuxingColors';

interface HistoryRecord {
  id: number;
  date: string;
  platform: string;
  employees: number;
  revenue: number;
  status: string;
  auditAt: string;
  reportMode?: string;
}

const STATUS_STYLE: Record<string, { bg: string; color: string; border: string }> = {
  '通過': { bg: MU.abyss, color: MU.bright, border: MU.shadow },
  '警告': { bg: TU.abyss, color: TU.bright, border: TU.shadow },
  '失敗': { bg: HUO.abyss, color: HUO.bright, border: HUO.shadow },
};

const INPUT_STYLE: React.CSSProperties = {
  width: '100%', padding: '6px 10px', borderRadius: 8,
  border: `1px solid ${EMPEROR_UI.borderMain}`, background: EMPEROR.obsidianMid,
  color: EMPEROR_UI.textPrimary, fontSize: 12, outline: 'none',
};

export const HistoryPage: React.FC = () => {
  const [records, setRecords] = useState<HistoryRecord[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [dateFilter, setDateFilter] = useState('');
  const [platformFilter, setPlatformFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [nameFilter, setNameFilter] = useState('');

  const fetchHistory = async () => {
    setLoading(true);
    setError('');
    try {
      const params = new URLSearchParams();
      if (dateFilter) params.set('date', dateFilter);
      if (platformFilter) params.set('platform_name', platformFilter);
      const res = await fetch(`/api/v1/history/reports?${params}`);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const json = await res.json();
      const list = json.data ?? json.reports ?? json ?? [];
      const mapped: HistoryRecord[] = (Array.isArray(list) ? list : []).map((r: any) => ({
        id: r.id ?? 0,
        date: r.report_date ?? r.reportDate ?? r.date ?? '',
        platform: r.platform_name ?? r.platformName ?? r.platform ?? '',
        employees: r.employee_count ?? r.employeeCount ?? r.employees ?? 0,
        revenue: r.total_revenue ?? r.totalRevenue ?? r.revenue ?? 0,
        status: r.audit_result ?? r.auditResult ?? r.status ?? '—',
        auditAt: r.updated_at ?? r.updatedAt ?? r.auditAt ?? '',
        reportMode: r.report_mode ?? r.reportMode ?? '',
      }));
      setRecords(mapped);
    } catch (e: any) {
      setError(e.message || '無法連線');
      setRecords([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchHistory(); }, [dateFilter, platformFilter]);

  // Client-side filters (status + name)
  const filtered = records.filter(h => {
    if (statusFilter && h.status !== statusFilter) return false;
    if (nameFilter && !h.platform.includes(nameFilter) && !h.date.includes(nameFilter)) return false;
    return true;
  });

  return (
    <div style={{ maxWidth: 1100, margin: '0 auto', padding: '20px 24px', display: 'flex', flexDirection: 'column', gap: 16 }}>
      {/* Header */}
      <div style={{ paddingBottom: 12, borderBottom: `1px solid ${EMPEROR_UI.borderAccent}` }}>
        <h1 style={{ fontSize: 20, fontWeight: 900, color: SHUI.bright, margin: 0, display: 'flex', alignItems: 'center', gap: 10, letterSpacing: '.04em', textShadow: `0 0 12px ${SHUI.bright}44` }}>
          <History size={22} /> 歷史資料查詢
        </h1>
        <p style={{ fontSize: 11, color: EMPEROR_UI.textDim, marginTop: 4 }}>查看過去各日、各平台的業績與審計紀錄（即時 API 資料）</p>
      </div>

      {/* Filters */}
      <div style={{ background: EMPEROR.obsidian, border: `1px solid ${EMPEROR_UI.borderMain}`, borderRadius: 12, padding: '14px 18px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 10, fontSize: 12, fontWeight: 700, color: EMPEROR_UI.textMuted }}>
          <Filter size={14} /> 篩選條件
          <button onClick={fetchHistory} disabled={loading} style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: 4, padding: '4px 10px', borderRadius: 6, border: `1px solid ${SHUI.shadow}`, background: 'transparent', color: SHUI.bright, fontSize: 11, fontWeight: 700, cursor: 'pointer' }}>
            <RefreshCw size={12} style={{ animation: loading ? 'spin 1s linear infinite' : 'none' }} /> 重新查詢
          </button>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12 }}>
          <div>
            <label style={{ fontSize: 10, color: EMPEROR_UI.textDim, display: 'flex', alignItems: 'center', gap: 4, marginBottom: 4 }}><Calendar size={10} /> 日期</label>
            <input type="date" value={dateFilter} onChange={e => setDateFilter(e.target.value)} style={INPUT_STYLE} />
          </div>
          <div>
            <label style={{ fontSize: 10, color: EMPEROR_UI.textDim, display: 'block', marginBottom: 4 }}>平台</label>
            <select value={platformFilter} onChange={e => setPlatformFilter(e.target.value)} style={INPUT_STYLE}>
              <option value="">全部</option>
              <option>奕心</option>
              <option>民視</option>
              <option>公司產品</option>
            </select>
          </div>
          <div>
            <label style={{ fontSize: 10, color: EMPEROR_UI.textDim, display: 'block', marginBottom: 4 }}>審計狀態</label>
            <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)} style={INPUT_STYLE}>
              <option value="">全部</option>
              <option value="通過">通過</option>
              <option value="警告">警告</option>
              <option value="失敗">失敗</option>
            </select>
          </div>
          <div>
            <label style={{ fontSize: 10, color: EMPEROR_UI.textDim, display: 'flex', alignItems: 'center', gap: 4, marginBottom: 4 }}><User size={10} /> 關鍵字搜尋</label>
            <input type="text" value={nameFilter} onChange={e => setNameFilter(e.target.value)} placeholder="搜尋平台/日期..." style={INPUT_STYLE} />
          </div>
        </div>
      </div>

      {/* Error display */}
      {error && (
        <div style={{ padding: '10px 14px', borderRadius: 10, background: HUO.abyss, border: `1px solid ${HUO.shadow}`, color: HUO.bright, fontSize: 12, fontWeight: 700 }}>
          ⚠️ 查詢失敗：{error}（後端可能未啟動，請確認 server 在運行中）
        </div>
      )}

      {/* Results Table */}
      <div style={{ background: EMPEROR.obsidian, border: `1px solid ${EMPEROR_UI.borderMain}`, borderRadius: 12, overflow: 'hidden' }}>
        <div style={{ padding: '10px 18px', borderBottom: `1px solid ${EMPEROR_UI.borderAccent}`, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <h2 style={{ fontSize: 13, fontWeight: 800, color: EMPEROR_UI.textPrimary, margin: 0, display: 'flex', alignItems: 'center', gap: 8 }}>
            <Search size={14} color={SHUI.bright} /> 查詢結果
          </h2>
          <span style={{ fontSize: 10, color: EMPEROR_UI.textDim }}>{loading ? '載入中...' : `${filtered.length} 筆紀錄`}</span>
        </div>
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12, minWidth: 600 }}>
            <thead>
              <tr style={{ borderBottom: `1px solid ${EMPEROR_UI.borderMain}` }}>
                {['日期', '平台', '模式', '人數', '總業績', '審計', '時間'].map((h, i) => (
                  <th key={h} style={{ padding: '8px 14px', textAlign: i >= 3 && i <= 4 ? 'right' : i === 5 ? 'center' : 'left', fontSize: 10, fontWeight: 700, color: EMPEROR_UI.textDim, letterSpacing: '.06em' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.map((h, i) => {
                const ss = STATUS_STYLE[h.status] ?? { bg: EMPEROR.obsidianMid, color: EMPEROR_UI.textDim, border: EMPEROR_UI.borderMain };
                return (
                  <tr key={h.id || i} style={{ borderBottom: `1px solid ${EMPEROR_UI.borderMain}18`, transition: 'background .15s', cursor: 'pointer' }}
                    onMouseEnter={e => (e.currentTarget.style.background = 'rgba(255,255,255,0.02)')}
                    onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}>
                    <td style={{ padding: '10px 14px', fontWeight: 700, color: EMPEROR_UI.textPrimary }}>{h.date}</td>
                    <td style={{ padding: '10px 14px', color: SHUI.bright }}>{h.platform}</td>
                    <td style={{ padding: '10px 14px', color: EMPEROR_UI.textMuted, fontSize: 10 }}>{h.reportMode || '—'}</td>
                    <td style={{ padding: '10px 14px', textAlign: 'right', color: EMPEROR_UI.textSecondary }}>{h.employees || '—'}</td>
                    <td style={{ padding: '10px 14px', textAlign: 'right', fontWeight: 800, color: JIN.bright }}>{h.revenue ? `$${h.revenue.toLocaleString()}` : '—'}</td>
                    <td style={{ padding: '10px 14px', textAlign: 'center' }}>
                      <span style={{ fontSize: 10, fontWeight: 700, padding: '2px 8px', borderRadius: 4, background: ss.bg, color: ss.color, border: `1px solid ${ss.border}` }}>{h.status}</span>
                    </td>
                    <td style={{ padding: '10px 14px', color: EMPEROR_UI.textDim, fontSize: 10 }}>{h.auditAt ? new Date(h.auditAt).toLocaleString('zh-TW') : '—'}</td>
                  </tr>
                );
              })}
              {!loading && filtered.length === 0 && (
                <tr><td colSpan={7} style={{ textAlign: 'center', padding: '40px 0', color: EMPEROR_UI.textDim }}>
                  {error ? '查詢失敗' : records.length === 0 ? '尚無歷史紀錄（請先從一鍵流水線處理報表）' : '沒有符合篩選條件的紀錄'}
                </td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      <style>{`@keyframes spin { from { transform: rotate(0deg) } to { transform: rotate(360deg) } }`}</style>
    </div>
  );
};
