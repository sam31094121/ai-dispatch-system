import React, { useState } from 'react';
import { useReportStore } from '../data/reportStore';
import { runFullAudit } from '../engine/reportAuditEngine';
import type { LegacyAuditResult } from '../types/report';
import { ShieldCheck, ShieldAlert, ShieldX, ChevronLeft, CheckCircle, AlertTriangle, XCircle, ArrowRight, Lock } from 'lucide-react';

const severityIcon = (s: 'error' | 'warning') =>
  s === 'error' ? <XCircle className="w-4 h-4" style={{ color: 'var(--color-fire-deep)' }} /> : <AlertTriangle className="w-4 h-4" style={{ color: 'var(--color-fire-400)' }} />;

const statusConfig = {
  PASS: { icon: ShieldCheck, colorVar: '--color-wood-600', bgClass: 'wx-pass', label: '✅ 審計通過' },
  WARNING: { icon: ShieldAlert, colorVar: '--color-fire-600', bgClass: 'wx-warn', label: '⚠️ 有警告事項' },
  FAIL: { icon: ShieldX, colorVar: '--color-fire-deep', bgClass: 'wx-fail', label: '❌ 審計未通過' },
  PENDING: { icon: ShieldAlert, colorVar: '--color-earth-500', bgClass: 'wx-info', label: '⏳ 尚未審計' },
};

export const AuditPage: React.FC<{ onNavigate: (p: string) => void }> = ({ onNavigate }) => {
  const { currentParseResult, setCurrentParseResult } = useReportStore();
  const [auditResult, setAuditResult] = useState<LegacyAuditResult | null>(null);

  const handleRunAudit = () => {
    if (!currentParseResult) return;
    const result = runFullAudit(currentParseResult);
    setAuditResult(result);
  };

  const handleApprove = () => {
    if (!currentParseResult) return;
    setCurrentParseResult({ ...currentParseResult, isAuditPassed: true });
    onNavigate('ranking');
  };

  if (!currentParseResult) {
    return (
      <div className="flex flex-col items-center justify-center h-[60vh]">
        <ShieldAlert className="w-12 h-12 mb-4" style={{ color: 'var(--color-fire-400)' }} />
        <h2 className="text-xl font-semibold" style={{ color: 'var(--color-earth-800)' }}>查無解析資料</h2>
        <p className="mt-2" style={{ color: 'var(--color-earth-500)' }}>請先完成資料輸入與解析</p>
        <button onClick={() => onNavigate('daily_input')} className="wx-btn wx-btn-water mt-4">返回輸入窗口</button>
      </div>
    );
  }

  const sc = auditResult ? statusConfig[auditResult.status] : statusConfig.PENDING;
  const errors = auditResult?.items.filter(i => i.severity === 'error') ?? [];
  const warnings = auditResult?.items.filter(i => i.severity === 'warning') ?? [];
  const groupedByType = auditResult?.items.reduce((acc, i) => {
    (acc[i.auditType] = acc[i.auditType] || []).push(i);
    return acc;
  }, {} as Record<string, typeof auditResult.items>) ?? {};

  const canProceed = auditResult?.canProceedToRanking ?? false;

  return (
    <div className="max-w-5xl mx-auto space-y-6 wx-animate-in">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 pb-4" style={{ borderBottom: '1px solid var(--color-earth-200)' }}>
        <div className="flex items-center gap-4">
          <button onClick={() => onNavigate('parse_result')} className="p-2 rounded-full transition" style={{ color: 'var(--color-earth-500)' }}><ChevronLeft className="w-6 h-6" /></button>
          <div>
            <h1 className="text-2xl md:text-3xl font-bold" style={{ color: 'var(--color-water-700)' }}>AI 審計</h1>
            <p className="mt-1" style={{ color: 'var(--color-earth-500)' }}>{currentParseResult.date} · {currentParseResult.platform}</p>
          </div>
        </div>
        <div className="flex gap-3">
          {!auditResult && (
            <button onClick={handleRunAudit} className="wx-btn wx-btn-water">
              <ShieldCheck className="w-5 h-5" /> 執行 AI 審計
            </button>
          )}
          {auditResult && canProceed && (
            <button onClick={handleApprove} className="wx-btn wx-btn-wood">
              <ArrowRight className="w-5 h-5" /> 確認通過，進入排名
            </button>
          )}
          {auditResult && !canProceed && (
            <button disabled className="wx-btn opacity-50 cursor-not-allowed" style={{ background: 'var(--color-earth-300)', color: 'white' }}>
              <Lock className="w-5 h-5" /> 有未解衝突，無法進入排名
            </button>
          )}
        </div>
      </div>

      {/* Status Banner */}
      <div className={`p-5 rounded-2xl border ${sc.bgClass} flex items-center gap-4`}>
        <sc.icon className="w-10 h-10" style={{ color: `var(${sc.colorVar})` }} />
        <div>
          <p className="text-lg font-bold" style={{ color: `var(${sc.colorVar})` }}>{sc.label}</p>
          {auditResult && <p className="text-sm mt-1" style={{ color: 'var(--color-earth-600)' }}>發現 {errors.length} 項錯誤、{warnings.length} 項警告{auditResult.canProceedToRanking ? '' : '｜⛔ 有 C 級未解衝突，派單已鎖死'}</p>}
          {!auditResult && <p className="text-sm mt-1" style={{ color: 'var(--color-earth-500)' }}>按下「執行 AI 審計」開始檢查資料</p>}
        </div>
      </div>

      {/* ─── 審計結論卡 ─── */}
      {auditResult && (
        <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
          {[
            { label: '天地盤', pass: !groupedByType['天地盤'] },
            { label: '邏輯盤', pass: !groupedByType['邏輯盤']?.some(i => i.severity === 'error') },
            { label: '姓名檢查', pass: !groupedByType['姓名檢查'] },
            { label: '欄位完整性', pass: !groupedByType['欄位完整性'] },
            { label: '可進入派單', pass: canProceed },
          ].map(c => (
            <div key={c.label} className={`p-3 rounded-xl text-center border ${c.pass ? 'wx-pass' : 'wx-fail'}`}>
              <p className="text-sm font-bold">{c.pass ? '✅ PASS' : '❌ FAIL'}</p>
              <p className="text-xs mt-0.5 font-medium" style={{ color: 'var(--color-earth-600)' }}>{c.label}</p>
            </div>
          ))}
        </div>
      )}

      {/* Audit Details */}
      {auditResult && (
        <div className="space-y-4">
          {Object.entries(groupedByType).map(([type, items]) => (
            <div key={type} className="wx-card overflow-hidden">
              <div className="wx-card-header flex items-center justify-between">
                <h3 className="font-semibold" style={{ color: 'var(--color-earth-800)' }}>{type}</h3>
                <span className="wx-badge wx-info">{items.length} 項</span>
              </div>
              <div className="divide-y" style={{ borderColor: 'var(--color-earth-50)' }}>
                {items.map(item => (
                  <div key={item.id} className="p-4 flex items-start gap-3 transition">
                    {severityIcon(item.severity)}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-medium text-sm" style={{ color: 'var(--color-earth-800)' }}>{item.field}</span>
                        <span className={`wx-badge ${item.severity === 'error' ? 'wx-fail' : 'wx-warn'}`}>{item.severity === 'error' ? '錯誤' : '警告'}</span>
                      </div>
                      <p className="text-sm mt-1" style={{ color: 'var(--color-earth-600)' }}>{item.message}</p>
                      {item.suggestion && <p className="text-xs mt-1 px-2 py-1 rounded inline-block" style={{ background: 'var(--color-water-50)', color: 'var(--color-water-600)' }}>💡 {item.suggestion}</p>}
                      {item.difference != null && <p className="text-xs mt-1" style={{ color: 'var(--color-earth-500)' }}>差額：{item.difference > 0 ? '+' : ''}{item.difference.toLocaleString()}</p>}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Action Buttons */}
      {auditResult && (
        <div className="flex flex-wrap gap-3 pt-4" style={{ borderTop: '1px solid var(--color-earth-200)' }}>
          <button onClick={() => onNavigate('parse_result')} className="px-4 py-2 text-sm font-medium rounded-lg transition shadow-sm"
            style={{ color: 'var(--color-earth-600)', background: 'white', border: '1px solid var(--color-earth-200)' }}>退回修改</button>
          <button onClick={handleRunAudit} className="px-4 py-2 text-sm font-medium rounded-lg transition shadow-sm"
            style={{ color: 'var(--color-water-600)', background: 'var(--color-water-50)', border: '1px solid var(--color-water-200)' }}>重新審計</button>
          {auditResult.status === 'WARNING' && canProceed && (
            <button onClick={handleApprove} className="px-4 py-2 text-sm font-medium rounded-lg transition shadow-sm"
              style={{ color: 'var(--color-fire-600)', background: 'var(--color-fire-50)', border: '1px solid var(--color-fire-200)' }}>忽略警告，確認通過</button>
          )}
        </div>
      )}
    </div>
  );
};
