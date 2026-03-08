// ==========================================
// 資料匯入元件
// ==========================================
import React, { useState } from 'react';
import { Upload, FileText } from 'lucide-react';
import { Card, CardHeader, CardContent } from './ui';
import { parsePerformanceText } from '../engine/aiEngine';
import { type Employee } from '../data/mockData';

interface Props { onImport: (data: Employee[]) => void }

export default function DataImport({ onImport }: Props) {
  const [rawText, setRawText] = useState('');
  const [result, setResult] = useState<string | null>(null);

  const handleImport = () => {
    const parsed = parsePerformanceText(rawText);
    if (parsed.length > 0) {
      onImport(parsed);
      setResult(`✅ 成功解析 ${parsed.length} 筆員工業績資料！`);
      setRawText('');
    } else {
      setResult('❌ 無法辨識資料，請確認格式是否正確。');
    }
  };

  return (
    <Card className="border-indigo-200">
      <CardHeader title="匯入員工業績資料" icon={FileText} className="bg-indigo-50/50" />
      <CardContent className="space-y-3">
        <textarea
          className="w-full h-28 p-3 text-xs border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none font-mono resize-y"
          placeholder="貼上業績資料，如：1. 馬秋香｜【追單】8｜【續單】184,700｜【總業績】231,100｜【實收】231,100"
          value={rawText}
          onChange={(e) => setRawText(e.target.value)}
        />
        <div className="flex justify-between items-center">
          <p className="text-[11px] text-slate-400">格式：數字. 姓名｜【追單】…｜【續單】…｜【總業績】…｜【實收】…</p>
          <button onClick={handleImport}
            className="flex items-center gap-2 px-5 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 text-sm font-medium shadow-sm">
            <Upload className="w-3.5 h-3.5" /> 解析並更新
          </button>
        </div>
        {result && <p className="text-sm font-medium">{result}</p>}
      </CardContent>
    </Card>
  );
}
