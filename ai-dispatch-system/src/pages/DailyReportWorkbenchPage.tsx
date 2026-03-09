import React, { useState } from 'react';
import { DailyReportInputPage } from './DailyReportInputPage';
import { ParseResultConfirmPage } from './ParseResultConfirmPage';
import { AuditCheckPage } from './AuditCheckPage';
import { RankingDispatchPage } from './RankingDispatchPage';
import { AnnouncementOutputPage } from './AnnouncementOutputPage';
import { StatusBadge } from '../components/StatusBadge';

type StepKey = 'input' | 'parse' | 'audit' | 'ranking' | 'announcement';

const navButtonStyle: React.CSSProperties = {
  border: 'none',
  borderRadius: 8,
  padding: '10px 16px',
  fontWeight: 700,
  fontSize: 14,
  cursor: 'pointer',
  transition: 'all 0.2s',
  display: 'flex',
  alignItems: 'center',
  gap: 6,
  boxShadow: '0 1px 2px rgba(0,0,0,0.05)',
};

export function DailyReportWorkbenchPage(): React.ReactElement {
  const [step, setStep] = useState<StepKey>('input');
  const [reportId, setReportId] = useState<number | null>(null);
  const [reportDate, setReportDate] = useState<string>('');

  function canGo(target: StepKey) {
    if (target === 'input') return true;
    if (target === 'parse') return Boolean(reportId);
    if (target === 'audit') return Boolean(reportId);
    if (target === 'ranking') return Boolean(reportDate);
    if (target === 'announcement') return Boolean(reportDate);
    return false;
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', minHeight: '100%', background: '#f8fafc' }}>
      <div
        style={{
          position: 'sticky',
          top: 0,
          zIndex: 40,
          background: 'rgba(255, 255, 255, 0.9)',
          backdropFilter: 'blur(12px)',
          borderBottom: '1px solid #e2e8f0',
          padding: '16px 24px',
          boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.05)',
        }}
      >
        <div
          style={{
            maxWidth: 1600,
            margin: '0 auto',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            flexWrap: 'wrap',
            gap: 16,
          }}
        >
          <div>
            <h1 style={{ margin: '0 0 8px 0', fontSize: 24, fontWeight: 900, color: '#0f172a', letterSpacing: '-0.02em' }}>
              每日業績核心樞紐 ( 工作台 )
            </h1>
            <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
              <StatusBadge
                label={reportId ? `報表編號：${reportId}` : '狀態：等待建立'}
                tone={reportId ? 'pass' : 'warn'}
              />
              <StatusBadge
                label={reportDate ? `結算日：${reportDate}` : '未指定結算日'}
                tone={reportDate ? 'pass' : 'warn'}
              />
            </div>
          </div>

          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', background: '#f1f5f9', padding: '6px', borderRadius: 12, border: '1px solid #e2e8f0' }}>
            <button
              style={{
                ...navButtonStyle,
                background: step === 'input' ? '#3b82f6' : 'transparent',
                color: step === 'input' ? '#fff' : '#64748b',
                boxShadow: step === 'input' ? '0 4px 6px rgba(59,130,246,0.3)' : 'none',
              }}
              onClick={() => setStep('input')}
            >
              1️⃣ 輸入站
            </button>

            <button
              style={{
                ...navButtonStyle,
                background: step === 'parse' ? '#2563eb' : 'transparent',
                color: step === 'parse' ? '#fff' : '#64748b',
                opacity: canGo('parse') ? 1 : 0.4,
                boxShadow: step === 'parse' ? '0 4px 6px rgba(37,99,235,0.3)' : 'none',
              }}
              disabled={!canGo('parse')}
              onClick={() => setStep('parse')}
            >
              2️⃣ 解析結果
            </button>

            <button
              style={{
                ...navButtonStyle,
                background: step === 'audit' ? '#1d4ed8' : 'transparent',
                color: step === 'audit' ? '#fff' : '#64748b',
                opacity: canGo('audit') ? 1 : 0.4,
                boxShadow: step === 'audit' ? '0 4px 6px rgba(29,78,216,0.3)' : 'none',
              }}
              disabled={!canGo('audit')}
              onClick={() => setStep('audit')}
            >
              3️⃣ 智能審計
            </button>

            <button
              style={{
                ...navButtonStyle,
                background: step === 'ranking' ? '#1e40af' : 'transparent',
                color: step === 'ranking' ? '#fff' : '#64748b',
                opacity: canGo('ranking') ? 1 : 0.4,
                boxShadow: step === 'ranking' ? '0 4px 6px rgba(30,64,175,0.3)' : 'none',
              }}
              disabled={!canGo('ranking')}
              onClick={() => setStep('ranking')}
            >
              4️⃣ 軍團派單
            </button>

            <button
              style={{
                ...navButtonStyle,
                background: step === 'announcement' ? '#1e293b' : 'transparent',
                color: step === 'announcement' ? '#fff' : '#64748b',
                opacity: canGo('announcement') ? 1 : 0.4,
                boxShadow: step === 'announcement' ? '0 4px 6px rgba(30,41,59,0.3)' : 'none',
              }}
              disabled={!canGo('announcement')}
              onClick={() => setStep('announcement')}
            >
              5️⃣ 公告發報
            </button>
          </div>
        </div>
      </div>

      <div style={{ flex: 1, maxWidth: 1600, margin: '0 auto', width: '100%' }}>
        {step === 'input' && (
          <DailyReportInputPage
            onParsed={({ reportId: createdId, reportDate: createdDate }) => {
              setReportId(createdId);
              setReportDate(createdDate);
              setStep('parse');
            }}
          />
        )}

        {step === 'parse' && reportId && (
          <ParseResultConfirmPage
            reportId={reportId}
            onAudit={() => setStep('audit')}
          />
        )}

        {step === 'audit' && reportId && (
          <AuditCheckPage
            reportId={reportId}
            onPassed={() => setStep('ranking')}
          />
        )}

        {step === 'ranking' && reportDate && (
          <RankingDispatchPage
            reportDate={reportDate}
            onAnnouncement={() => setStep('announcement')}
          />
        )}

        {step === 'announcement' && reportDate && (
          <AnnouncementOutputPage reportDate={reportDate} />
        )}
      </div>
    </div>
  );
}
