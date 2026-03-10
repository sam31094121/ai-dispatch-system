import React from 'react';
import { useReportStore } from '../data/reportStore';
import { AlertTriangle, CheckCircle, ChevronLeft, Save, FileText, Wrench, ShieldAlert, Lock } from 'lucide-react';

export const ParseResultPage: React.FC<{ onNavigate: (page: string) => void }> = ({ onNavigate }) => {
  const { currentParseResult, updateTotals, updateDetail } = useReportStore();

  if (!currentParseResult) {
    return (
      <div className="flex flex-col items-center justify-center h-[60vh]">
        <AlertTriangle className="w-12 h-12 mb-4" style={{ color: 'var(--color-fire-400)' }} />
        <h2 className="text-xl font-semibold" style={{ color: 'var(--color-earth-800)' }}>查無解析結果</h2>
        <p className="mt-2" style={{ color: 'var(--color-earth-500)' }}>請先返回輸入窗口進行 AI 解析</p>
        <button onClick={() => onNavigate('daily_input')} className="wx-btn wx-btn-water mt-6">返回輸入窗口</button>
      </div>
    );
  }

  const { totals, details, date, platform, reportType, autoFixRecords = [], conflicts = [] } = currentParseResult;
  const aFixes = autoFixRecords.filter(r => r.level === 'A');
  const bConflicts = conflicts.filter(c => c.level === 'B');
  const cConflicts = conflicts.filter(c => c.level === 'C');

  const handleTotalChange = (field: keyof typeof totals, value: string) => {
    updateTotals({ ...totals, [field]: Number(value) });
  };

  const handleDetailChange = (id: string, field: string, value: string) => {
    updateDetail(id, { [field]: field === 'employeeName' || field === 'employeeRole' ? value : Number(value) });
  };

  return (
    <div className="max-w-6xl mx-auto space-y-6 wx-animate-in">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 pb-4" style={{ borderBottom: '1px solid var(--color-earth-200)' }}>
        <div className="flex items-center gap-4">
          <button onClick={() => onNavigate('daily_input')} className="p-2 rounded-full transition-colors" style={{ color: 'var(--color-earth-500)' }}><ChevronLeft className="w-6 h-6" /></button>
          <div>
            <h1 className="text-2xl md:text-3xl font-bold flex items-center gap-3" style={{ color: 'var(--color-earth-900)' }}>
              解析結果確認
              <span className="px-3 py-1 text-sm font-medium rounded-full flex items-center gap-1 wx-pass" style={{ border: '1px solid' }}>
                <CheckCircle className="w-4 h-4" /> 解析成功
              </span>
            </h1>
            <p className="mt-2" style={{ color: 'var(--color-earth-500)' }}>{date} · {platform} · {reportType} · 共 {details.length} 人</p>
          </div>
        </div>
        <button onClick={() => onNavigate('audit')} className="wx-btn wx-btn-wood whitespace-nowrap">
          <Save className="w-4 h-4" /> 核對無誤，進行 AI 審計
        </button>
      </div>

      {/* ── A 級自動修正紀錄 ── */}
      {aFixes.length > 0 && (
        <div className="wx-card overflow-hidden">
          <div className="wx-card-header flex items-center justify-between">
            <h3 className="font-semibold flex items-center gap-2" style={{ color: 'var(--color-wood-700)' }}>
              <Wrench className="w-5 h-5" style={{ color: 'var(--color-wood-500)' }} /> A 級自動修正紀錄（已修正）
            </h3>
            <span className="wx-badge wx-pass">{aFixes.length} 項已修正</span>
          </div>
          <div className="p-4 space-y-2">
            {aFixes.map(f => (
              <div key={f.id} className="flex items-center gap-3 text-sm p-2 rounded-lg" style={{ background: 'var(--color-wood-50)' }}>
                <CheckCircle className="w-4 h-4 shrink-0" style={{ color: 'var(--color-wood-500)' }} />
                <span style={{ color: 'var(--color-earth-600)' }}>{f.category}：</span>
                <span className="wx-fix-before">{f.before}</span>
                <span className="wx-fix-arrow"></span>
                <span className="wx-fix-after">{f.after}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── B 級建議修正 ── */}
      {bConflicts.length > 0 && (
        <div className="wx-card overflow-hidden">
          <div className="wx-card-header flex items-center justify-between">
            <h3 className="font-semibold flex items-center gap-2" style={{ color: 'var(--color-fire-600)' }}>
              <ShieldAlert className="w-5 h-5" style={{ color: 'var(--color-fire-400)' }} /> B 級建議修正（需確認）
            </h3>
            <span className="wx-badge wx-warn">{bConflicts.length} 項待確認</span>
          </div>
          <div className="divide-y" style={{ borderColor: 'var(--color-earth-100)' }}>
            {bConflicts.map(c => (
              <div key={c.id} className="p-4 flex items-start gap-3">
                <AlertTriangle className="w-4 h-4 mt-0.5 shrink-0" style={{ color: 'var(--color-fire-400)' }} />
                <div>
                  <p className="font-medium text-sm" style={{ color: 'var(--color-earth-800)' }}>{c.field}</p>
                  <p className="text-sm mt-0.5" style={{ color: 'var(--color-earth-600)' }}>{c.message}</p>
                  {c.suggestion && <p className="text-xs mt-1 px-2 py-1 rounded inline-block" style={{ background: 'var(--color-water-50)', color: 'var(--color-water-600)' }}>💡 {c.suggestion}</p>}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── C 級禁止修正 ── */}
      {cConflicts.length > 0 && (
        <div className="wx-card overflow-hidden" style={{ borderColor: 'var(--color-fire-deep)' }}>
          <div className="px-5 py-4 flex items-center justify-between" style={{ background: '#fef2f2', borderBottom: '1px solid #fecaca' }}>
            <h3 className="font-semibold flex items-center gap-2" style={{ color: 'var(--color-fire-deep)' }}>
              <Lock className="w-5 h-5" /> C 級嚴重衝突（禁止自動修正）
            </h3>
            <span className="wx-badge wx-fail">{cConflicts.length} 項鎖死</span>
          </div>
          <div className="divide-y" style={{ borderColor: '#fecaca' }}>
            {cConflicts.map(c => (
              <div key={c.id} className="p-4 flex items-start gap-3" style={{ background: '#fffbfb' }}>
                <Lock className="w-4 h-4 mt-0.5 shrink-0" style={{ color: 'var(--color-fire-deep)' }} />
                <div>
                  <p className="font-medium text-sm" style={{ color: 'var(--color-earth-800)' }}>{c.field}｜{c.category}</p>
                  <p className="text-sm mt-0.5" style={{ color: 'var(--color-earth-600)' }}>{c.message}</p>
                  <p className="text-xs mt-1 font-medium" style={{ color: 'var(--color-fire-deep)' }}>⛔ 此項目禁止 AI 自動修正，需人工確認</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── 總計區塊 ── */}
      <div className="wx-card overflow-hidden">
        <div className="wx-card-header"><h2 className="text-lg font-semibold" style={{ color: 'var(--color-earth-800)' }}>總計資料</h2></div>
        <div className="p-6 grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
          <TotalCard label="人數" value={totals.employeeCount || 0} />
          <TotalCard label="追單總數" value={totals.totalDispatchDeals} />
          <TotalCard label="續單總金額" value={totals.totalFollowAmount} isCurrency />
          <TotalCard label="總業績" value={totals.totalRevenue} isCurrency highlight />
          <TotalCard label="實收" value={totals.totalActual} isCurrency />
          <TotalCard label="退貨" value={totals.totalCancelReturn} />
        </div>
      </div>

      {/* ── 個人明細 ── */}
      <div className="wx-card overflow-hidden">
        <div className="wx-card-header flex justify-between items-center">
          <div className="flex items-center gap-2"><FileText className="w-5 h-5" style={{ color: 'var(--color-water-500)' }} /><h2 className="text-lg font-semibold" style={{ color: 'var(--color-earth-800)' }}>個人明細表</h2></div>
          <span className="wx-badge wx-info">{details.length} 筆紀錄</span>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm wx-table min-w-[700px]">
            <thead>
              <tr>
                <th className="px-4 py-3" style={{ borderBottom: '1px solid var(--color-earth-200)' }}>#</th>
                <th className="px-4 py-3" style={{ borderBottom: '1px solid var(--color-earth-200)' }}>姓名</th>
                <th className="px-4 py-3" style={{ borderBottom: '1px solid var(--color-earth-200)' }}>標記</th>
                <th className="px-4 py-3 text-right" style={{ borderBottom: '1px solid var(--color-earth-200)' }}>追單</th>
                <th className="px-4 py-3 text-right" style={{ borderBottom: '1px solid var(--color-earth-200)' }}>續單</th>
                <th className="px-4 py-3 text-right" style={{ borderBottom: '1px solid var(--color-earth-200)' }}>總業績</th>
                <th className="px-4 py-3 text-right" style={{ borderBottom: '1px solid var(--color-earth-200)' }}>實收</th>
                <th className="px-4 py-3 text-right" style={{ borderBottom: '1px solid var(--color-earth-200)' }}>退貨</th>
                <th className="px-4 py-3 text-center" style={{ borderBottom: '1px solid var(--color-earth-200)' }}>狀態</th>
              </tr>
            </thead>
            <tbody>
              {details.map((d, i) => (
                <tr key={d.id} className="transition-colors" style={{ borderBottom: '1px solid var(--color-earth-50)' }}>
                  <td className="px-4 py-2 text-xs" style={{ color: 'var(--color-earth-400)' }}>{i + 1}</td>
                  <td className="px-4 py-2"><input type="text" value={d.employeeName} onChange={(e) => handleDetailChange(d.id, 'employeeName', e.target.value)} className="w-24 bg-transparent border-b border-transparent hover:border-current focus:border-current outline-none px-1 font-medium" style={{ color: 'var(--color-earth-800)' }} /></td>
                  <td className="px-4 py-2"><select value={d.employeeRole} onChange={(e) => handleDetailChange(d.id, 'employeeRole', e.target.value)} className="bg-transparent border-b border-transparent text-sm outline-none" style={{ color: 'var(--color-earth-700)' }}><option value="一般">一般</option><option value="新人">新人</option><option value="停用">停用</option></select></td>
                  <td className="px-4 py-2 text-right"><EditNum value={d.dispatchDeals} onChange={(v) => handleDetailChange(d.id, 'dispatchDeals', v)} /></td>
                  <td className="px-4 py-2 text-right"><EditNum value={d.followAmount} onChange={(v) => handleDetailChange(d.id, 'followAmount', v)} /></td>
                  <td className="px-4 py-2 text-right wx-amount"><EditNum value={d.revenue} onChange={(v) => handleDetailChange(d.id, 'revenue', v)} /></td>
                  <td className="px-4 py-2 text-right"><EditNum value={d.actual} onChange={(v) => handleDetailChange(d.id, 'actual', v)} /></td>
                  <td className="px-4 py-2 text-right"><EditNum value={d.cancelReturn} onChange={(v) => handleDetailChange(d.id, 'cancelReturn', v)} /></td>
                  <td className="px-4 py-2 text-center text-xs whitespace-nowrap">
                    {d._errors && d._errors.length > 0 ? <span className="wx-badge wx-fail">異常</span>
                     : d._warnings && d._warnings.length > 0 ? <span className="wx-badge wx-warn">警告</span>
                     : <span className="wx-badge wx-pass">正常</span>}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

const TotalCard = ({ label, value, isCurrency, highlight }: { label: string; value: number; isCurrency?: boolean; highlight?: boolean }) => (
  <div className="p-3 rounded-lg" style={{ background: highlight ? 'var(--color-metal-50)' : 'var(--color-earth-50)', border: `1px solid ${highlight ? 'var(--color-metal-200)' : 'var(--color-earth-100)'}` }}>
    <label className="text-xs font-medium" style={{ color: 'var(--color-earth-500)' }}>{label}</label>
    <div className="text-lg font-bold mt-0.5" style={{ color: highlight ? 'var(--color-metal-700)' : 'var(--color-earth-800)' }}>
      {isCurrency ? `$${value.toLocaleString()}` : value.toLocaleString()}
    </div>
  </div>
);

const EditNum = ({ value, onChange }: { value: number; onChange: (v: string) => void }) => (
  <input type="number" value={value} onChange={(e) => onChange(e.target.value)}
    className="w-24 text-right bg-transparent border-b border-transparent hover:border-current outline-none px-1" style={{ color: 'var(--color-earth-800)' }} />
);
