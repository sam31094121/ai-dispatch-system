import React, { useState, useEffect } from 'react';
import { Settings, Save, RotateCcw, Loader2 } from 'lucide-react';
import type { SystemSettings } from '../types/report';

const defaultSettings: SystemSettings = {
  rankingPrimary: 'totalRevenue',
  rankingSecondary: 'totalFollowSuccess',
  a1Count: 4,
  a2Count: 5,
  bCount: 8,
  auditLevel: 2,
  bannedNames: [],
  correctNames: [],
};

export const SettingsPage: React.FC = () => {
  const [settings, setSettings] = useState<SystemSettings>(defaultSettings);
  const [saveState, setSaveState] = useState<'idle' | 'saving' | 'ok' | 'error'>('idle');
  const [saveMsg, setSaveMsg] = useState('');
  const [bannedInput, setBannedInput] = useState('');
  const [correctInput, setCorrectInput] = useState('');

  // 啟動時從後端載入設定
  useEffect(() => {
    fetch('/api/v1/settings')
      .then(r => r.json())
      .then(j => { if (j.success && j.data) setSettings(s => ({ ...s, ...j.data })); })
      .catch(() => {/* 無法連線時使用預設值 */});
  }, []);

  const handleSave = async () => {
    setSaveState('saving');
    setSaveMsg('');
    try {
      const res = await fetch('/api/v1/settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(settings),
      });
      const json = await res.json();
      if (json.success) {
        setSaveState('ok');
        setSaveMsg(json.message ?? '✅ 已儲存');
      } else {
        setSaveState('error');
        setSaveMsg(json.message ?? '❌ 儲存失敗');
      }
    } catch {
      setSaveState('error');
      setSaveMsg('❌ 無法連線後端');
    } finally {
      setTimeout(() => setSaveState('idle'), 3000);
    }
  };

  const handleReset = () => setSettings(defaultSettings);

  return (
    <div className="max-w-4xl mx-auto space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="pb-4 border-b border-gray-200">
        <h1 className="text-2xl md:text-3xl font-bold text-gray-900 flex items-center gap-3"><Settings className="w-7 h-7 text-indigo-500" /> AI 設定</h1>
        <p className="text-gray-500 mt-1">管理排名、派單、審計規則</p>
      </div>

      {/* 排名規則 */}
      <Section title="📊 排名規則設定">
        <FieldRow label="主排序欄位">
          <select value={settings.rankingPrimary} onChange={e => setSettings(s => ({ ...s, rankingPrimary: e.target.value as SystemSettings['rankingPrimary'] }))} className="input-style">
            <option value="totalRevenue">總業績</option>
            <option value="totalFollowAmount">追續金額</option>
          </select>
        </FieldRow>
        <FieldRow label="次排序欄位">
          <select value={settings.rankingSecondary} onChange={e => setSettings(s => ({ ...s, rankingSecondary: e.target.value as SystemSettings['rankingSecondary'] }))} className="input-style">
            <option value="totalFollowSuccess">追續成交</option>
            <option value="totalDispatchSuccess">派單成交</option>
          </select>
        </FieldRow>
      </Section>

      {/* 派單規則 */}
      <Section title="📋 派單分組規則">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <NumberField label="A1 名額" value={settings.a1Count} onChange={v => setSettings(s => ({ ...s, a1Count: v }))} />
          <NumberField label="A2 名額" value={settings.a2Count} onChange={v => setSettings(s => ({ ...s, a2Count: v }))} />
          <NumberField label="B 名額" value={settings.bCount} onChange={v => setSettings(s => ({ ...s, bCount: v }))} />
          <div className="flex flex-col">
            <label className="text-xs font-medium text-gray-500 mb-1">C 名額</label>
            <div className="px-3 py-2 bg-gray-100 rounded-lg text-sm text-gray-500">自動（剩餘人數）</div>
          </div>
        </div>
      </Section>

      {/* 審計嚴格度 */}
      <Section title="🔍 審計嚴格度">
        <div className="flex gap-3">
          {([1, 2, 3] as const).map(lv => (
            <button key={lv} onClick={() => setSettings(s => ({ ...s, auditLevel: lv }))}
              className={`flex-1 py-3 rounded-xl text-sm font-semibold border-2 transition-all ${settings.auditLevel === lv ? 'bg-indigo-50 border-indigo-500 text-indigo-700' : 'bg-white border-gray-200 text-gray-500 hover:border-gray-300'}`}>
              Level {lv}
              <p className="text-xs font-normal mt-1">{lv === 1 ? '寬鬆' : lv === 2 ? '標準' : '嚴格'}</p>
            </button>
          ))}
        </div>
      </Section>

      {/* 姓名管理 */}
      <Section title="👤 姓名管理">
        <FieldRow label="禁用錯名清單">
          <div className="space-y-2 w-full">
            <div className="flex gap-2">
              <input value={bannedInput} onChange={e => setBannedInput(e.target.value)} placeholder="輸入禁用名..." className="input-style flex-1" />
              <button onClick={() => { if (bannedInput.trim()) { setSettings(s => ({ ...s, bannedNames: [...s.bannedNames, bannedInput.trim()] })); setBannedInput(''); } }} className="px-3 py-2 bg-red-50 text-red-600 text-xs font-medium rounded-lg border border-red-200">新增</button>
            </div>
            <div className="flex flex-wrap gap-1.5">
              {settings.bannedNames.map((n, i) => (
                <span key={i} className="px-2 py-1 bg-red-50 text-red-600 text-xs rounded-full border border-red-200 flex items-center gap-1">
                  {n} <button onClick={() => setSettings(s => ({ ...s, bannedNames: s.bannedNames.filter((_, j) => j !== i) }))} className="text-red-400 hover:text-red-600">×</button>
                </span>
              ))}
            </div>
          </div>
        </FieldRow>
        <FieldRow label="正確姓名名單">
          <div className="space-y-2 w-full">
            <div className="flex gap-2">
              <input value={correctInput} onChange={e => setCorrectInput(e.target.value)} placeholder="輸入正確名..." className="input-style flex-1" />
              <button onClick={() => { if (correctInput.trim()) { setSettings(s => ({ ...s, correctNames: [...s.correctNames, correctInput.trim()] })); setCorrectInput(''); } }} className="px-3 py-2 bg-green-50 text-green-600 text-xs font-medium rounded-lg border border-green-200">新增</button>
            </div>
            <div className="flex flex-wrap gap-1.5">
              {settings.correctNames.map((n, i) => (
                <span key={i} className="px-2 py-1 bg-green-50 text-green-600 text-xs rounded-full border border-green-200 flex items-center gap-1">
                  {n} <button onClick={() => setSettings(s => ({ ...s, correctNames: s.correctNames.filter((_, j) => j !== i) }))} className="text-green-400 hover:text-green-600">×</button>
                </span>
              ))}
            </div>
          </div>
        </FieldRow>
      </Section>

      {/* Actions */}
      <div className="space-y-3 pt-4 border-t border-gray-200">
        {saveMsg && (
          <div className={`px-4 py-2.5 rounded-xl text-sm font-medium ${saveState === 'ok' ? 'bg-green-50 text-green-700 border border-green-200' : 'bg-red-50 text-red-700 border border-red-200'}`}>
            {saveMsg}
          </div>
        )}
        <div className="flex gap-3">
          <button onClick={handleSave} disabled={saveState === 'saving'}
            className="flex items-center gap-2 px-6 py-2.5 text-sm font-semibold text-white bg-gradient-to-r from-blue-600 to-indigo-600 rounded-lg shadow-md transition-all active:scale-95 disabled:opacity-60 disabled:cursor-not-allowed">
            {saveState === 'saving'
              ? <><Loader2 className="w-4 h-4 animate-spin" /> 儲存中...</>
              : saveState === 'ok'
              ? <><span>✅</span> 已儲存</>
              : <><Save className="w-4 h-4" /> 儲存設定</>}
          </button>
          <button onClick={handleReset} className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-gray-600 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 transition shadow-sm">
            <RotateCcw className="w-4 h-4" /> 重置為預設
          </button>
        </div>
      </div>

      <style>{`.input-style { @apply px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all; }`}</style>
    </div>
  );
};

const Section = ({ title, children }: { title: string; children: React.ReactNode }) => (
  <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
    <div className="p-4 border-b border-gray-100 bg-gray-50/50"><h2 className="font-semibold text-gray-800">{title}</h2></div>
    <div className="p-5 space-y-4">{children}</div>
  </div>
);

const FieldRow = ({ label, children }: { label: string; children: React.ReactNode }) => (
  <div className="flex flex-col md:flex-row md:items-center gap-2">
    <label className="text-sm font-medium text-gray-700 md:w-32 shrink-0">{label}</label>
    {children}
  </div>
);

const NumberField = ({ label, value, onChange }: { label: string; value: number; onChange: (v: number) => void }) => (
  <div className="flex flex-col">
    <label className="text-xs font-medium text-gray-500 mb-1">{label}</label>
    <input type="number" value={value} onChange={e => onChange(Number(e.target.value))} min={0} max={20}
      className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none w-full" />
  </div>
);
