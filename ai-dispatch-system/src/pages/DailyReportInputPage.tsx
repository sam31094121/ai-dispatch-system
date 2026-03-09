import React, { useMemo, useState } from 'react';
import { 平台選項, 報表模式選項 } from '../constants/dictionaries';
import type { DailyReportInputForm } from '../types/forms';
import { reportService } from '../services/report.service';
import { StatusBadge } from '../components/StatusBadge';
import { PageBlock } from '../components/PageBlock';

interface DailyReportInputPageProps {
  onParsed?: (payload: { reportId: number; reportDate: string }) => void;
}

const inputStyle: React.CSSProperties = {
  width: '100%',
  border: '1px solid #cbd5e1',
  borderRadius: 8,
  padding: '12px 16px',
  fontSize: 15,
  outline: 'none',
  boxSizing: 'border-box',
  background: '#ffffff',
  color: '#334155',
  transition: 'border-color 0.2s, box-shadow 0.2s',
};

const labelStyle: React.CSSProperties = {
  fontSize: 14,
  fontWeight: 600,
  color: '#475569',
  marginBottom: 8,
  display: 'block',
};

const buttonStyle: React.CSSProperties = {
  border: 'none',
  borderRadius: 8,
  padding: '12px 24px',
  fontWeight: 600,
  fontSize: 15,
  cursor: 'pointer',
  transition: 'all 0.2s',
  display: 'inline-flex',
  justifyContent: 'center',
  alignItems: 'center',
};

const initialForm: DailyReportInputForm = {
  reportDate: '',
  platformName: '',
  reportMode: '',
  rawTextContent: '',
  noteText: '',
};

export function DailyReportInputPage({
  onParsed,
}: DailyReportInputPageProps): React.ReactElement {
  const [form, setForm] = useState<DailyReportInputForm>(initialForm);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [createdReportId, setCreatedReportId] = useState<number | null>(null);

  const isValid = useMemo(() => {
    return Boolean(
      form.reportDate &&
        form.platformName &&
        form.reportMode &&
        form.rawTextContent.trim()
    );
  }, [form]);

  function updateField<K extends keyof DailyReportInputForm>(
    key: K,
    value: DailyReportInputForm[K]
  ) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  async function handleCreateAndParse() {
    if (!isValid) {
      setMessage('請先完整輸入日期、平台、模式與原始日報內容。');
      return;
    }

    try {
      setLoading(true);
      setMessage('');

      const report = await reportService.createReport({
        reportDate: form.reportDate,
        platformName: form.platformName as any,
        reportMode: form.reportMode as any,
        rawTextContent: form.rawTextContent,
        noteText: form.noteText,
      });

      setCreatedReportId(report.id);

      await reportService.runParse(report.id, { forceReparse: false });

      setMessage(`建立並解析成功 🎉，報表編號：${report.id}`);
      onParsed?.({ reportId: report.id, reportDate: form.reportDate });
    } catch (error: any) {
      setMessage(error?.responseMessage || error?.message || '建立或解析失敗');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div
      style={{
        background: '#f8fafc',
        minHeight: '100%',
        padding: 24,
      }}
    >
      <PageBlock
        title="每日業績輸入"
        rightSlot={
          loading ? (
            <StatusBadge label="處理中..." tone="warn" />
          ) : createdReportId ? (
            <StatusBadge label={`報表編號：${createdReportId}`} tone="pass" />
          ) : (
            <StatusBadge label="等待輸入" tone="info" />
          )
        }
      >
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
            gap: 20,
            marginBottom: 24,
          }}
        >
          <div>
            <label style={labelStyle}>報表日期</label>
            <input
              type="date"
              value={form.reportDate}
              onChange={(e) => updateField('reportDate', e.target.value)}
              style={inputStyle}
            />
          </div>

          <div>
            <label style={labelStyle}>平台</label>
            <select
              value={form.platformName}
              onChange={(e) => updateField('platformName', e.target.value as any)}
              style={inputStyle}
            >
              <option value="">請選擇平台</option>
              {平台選項.map((item) => (
                <option key={item} value={item}>
                  {item}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label style={labelStyle}>報表模式</label>
            <select
              value={form.reportMode}
              onChange={(e) => updateField('reportMode', e.target.value as any)}
              style={inputStyle}
            >
              <option value="">請選擇模式</option>
              {報表模式選項.map((item) => (
                <option key={item} value={item}>
                  {item}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label style={labelStyle}>備註</label>
            <input
              value={form.noteText}
              onChange={(e) => updateField('noteText', e.target.value)}
              placeholder="例：3/8 原始輸入"
              style={inputStyle}
            />
          </div>
        </div>

        <div style={{ marginBottom: 24 }}>
          <label style={labelStyle}>原始日報輸入框</label>
          <textarea
            value={form.rawTextContent}
            onChange={(e) => updateField('rawTextContent', e.target.value)}
            placeholder="請直接貼上原始日報全文..."
            style={{
              ...inputStyle,
              minHeight: 320,
              resize: 'vertical',
              fontFamily: '"Fira Code", monospace',
              lineHeight: 1.6,
              background: '#f1f5f9',
            }}
          />
        </div>

        <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
          <button
            type="button"
            onClick={() => setForm(initialForm)}
            style={{
              ...buttonStyle,
              background: '#e2e8f0',
              color: '#475569',
            }}
            onMouseOver={(e) => (e.currentTarget.style.background = '#cbd5e1')}
            onMouseOut={(e) => (e.currentTarget.style.background = '#e2e8f0')}
          >
            清空重填
          </button>

          <button
            type="button"
            onClick={handleCreateAndParse}
            disabled={loading || !isValid}
            style={{
              ...buttonStyle,
              background: isValid ? '#2a4365' : '#cbd5e1',
              color: '#ffffff',
              opacity: loading ? 0.7 : 1,
              cursor: isValid ? 'pointer' : 'not-allowed',
            }}
          >
            建立報表並執行 AI 解析
          </button>
        </div>

        {message && (
          <div
            style={{
              marginTop: 20,
              padding: '16px 20px',
              borderRadius: 8,
              background: createdReportId ? '#ecfdf5' : '#fffbeb',
              color: createdReportId ? '#065f46' : '#92400e',
              fontWeight: 600,
              border: `1px solid ${createdReportId ? '#a7f3d0' : '#fde68a'}`,
            }}
          >
            {message}
          </div>
        )}
      </PageBlock>
    </div>
  );
}
