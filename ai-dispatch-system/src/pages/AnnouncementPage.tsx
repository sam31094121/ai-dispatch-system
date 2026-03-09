import React, { useMemo, useState } from 'react';
import { useReportStore } from '../data/reportStore';
import { generateRankings, generateAnnouncements } from '../engine/rankingEngine';
import { ChevronLeft, Copy, CheckCircle, FileText, MessageSquare, Mic, Shield, Zap, Lock } from 'lucide-react';

type Tab = 'full' | 'line' | 'short' | 'broadcast' | 'manager';

const tabs: { key: Tab; label: string; icon: React.ElementType }[] = [
  { key: 'full', label: '完整版', icon: FileText },
  { key: 'line', label: 'LINE 版', icon: MessageSquare },
  { key: 'short', label: '20秒超短版', icon: Zap },
  { key: 'broadcast', label: '播報版', icon: Mic },
  { key: 'manager', label: '主管威壓版', icon: Shield },
];

export const AnnouncementPage: React.FC<{ onNavigate: (p: string) => void }> = ({ onNavigate }) => {
  const { currentParseResult } = useReportStore();
  const [activeTab, setActiveTab] = useState<Tab>('full');
  const [copiedTab, setCopiedTab] = useState<Tab | null>(null);

  const rankings = useMemo(() => {
    if (!currentParseResult) return [];
    return generateRankings(currentParseResult.details);
  }, [currentParseResult]);

  const announcements = useMemo(() => {
    if (!currentParseResult || rankings.length === 0) return null;
    return generateAnnouncements(currentParseResult.date, rankings, currentParseResult.platform);
  }, [currentParseResult, rankings]);

  const handleCopy = (tab: Tab) => {
    if (!announcements) return;
    const textMap: Record<Tab, string> = {
      full: announcements.fullText, line: announcements.lineText,
      short: announcements.shortText, broadcast: announcements.broadcastText, manager: announcements.managerText,
    };
    navigator.clipboard.writeText(textMap[tab]).then(() => {
      setCopiedTab(tab);
      setTimeout(() => setCopiedTab(null), 2000);
    });
  };

  // 骨牌防呆：審計未通過不允許生成公告
  if (currentParseResult && !currentParseResult.isAuditPassed) {
    return (
      <div className="flex flex-col items-center justify-center h-[60vh]">
        <Lock className="w-12 h-12 mb-4" style={{ color: 'var(--color-fire-400)' }} />
        <h2 className="text-xl font-semibold" style={{ color: 'var(--color-earth-800)' }}>審計尚未通過</h2>
        <p className="mt-2" style={{ color: 'var(--color-earth-500)' }}>必須先通過 AI 審計與排名，才能生成公告</p>
        <p className="text-xs mt-1 font-medium" style={{ color: 'var(--color-fire-deep)' }}>⛔ 骨牌效應防呆：禁止跳過審計/排名直接輸出公告</p>
        <button onClick={() => onNavigate('audit')} className="wx-btn wx-btn-water mt-4">前往 AI 審計</button>
      </div>
    );
  }

  if (!currentParseResult || !announcements) {
    return (
      <div className="flex flex-col items-center justify-center h-[60vh]">
        <FileText className="w-12 h-12 mb-4" style={{ color: 'var(--color-earth-400)' }} />
        <h2 className="text-xl font-semibold" style={{ color: 'var(--color-earth-800)' }}>查無公告資料</h2>
        <p className="mt-2" style={{ color: 'var(--color-earth-500)' }}>請先完成輸入→解析→審計→排名</p>
        <button onClick={() => onNavigate('daily_input')} className="wx-btn wx-btn-water mt-4">返回輸入窗口</button>
      </div>
    );
  }

  const textMap: Record<Tab, string> = {
    full: announcements.fullText, line: announcements.lineText,
    short: announcements.shortText, broadcast: announcements.broadcastText, manager: announcements.managerText,
  };

  return (
    <div className="max-w-5xl mx-auto space-y-6 wx-animate-in">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 pb-4" style={{ borderBottom: '1px solid var(--color-earth-200)' }}>
        <div className="flex items-center gap-4">
          <button onClick={() => onNavigate('ranking')} className="p-2 rounded-full transition" style={{ color: 'var(--color-earth-500)' }}><ChevronLeft className="w-6 h-6" /></button>
          <div>
            <h1 className="text-2xl md:text-3xl font-bold" style={{ color: 'var(--color-metal-700)' }}>公告輸出</h1>
            <p className="mt-1" style={{ color: 'var(--color-earth-500)' }}>{currentParseResult.date} · {currentParseResult.platform}</p>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex flex-wrap gap-2 p-1.5 rounded-xl" style={{ background: 'var(--color-earth-100)' }}>
        {tabs.map(t => (
          <button key={t.key} onClick={() => setActiveTab(t.key)}
            className="flex items-center gap-1.5 px-4 py-2 text-sm font-medium rounded-lg transition-all"
            style={activeTab === t.key
              ? { background: 'white', color: 'var(--color-water-600)', boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }
              : { color: 'var(--color-earth-500)' }}>
            <t.icon className="w-4 h-4" /> {t.label}
          </button>
        ))}
      </div>

      {/* Content */}
      <div className="wx-card overflow-hidden">
        <div className="wx-card-header flex justify-between items-center">
          <h2 className="font-semibold" style={{ color: 'var(--color-earth-800)' }}>{tabs.find(t => t.key === activeTab)?.label} 公告</h2>
          <button onClick={() => handleCopy(activeTab)} className="wx-btn wx-btn-water text-sm">
            {copiedTab === activeTab ? <><CheckCircle className="w-4 h-4" /> 已複製！</> : <><Copy className="w-4 h-4" /> 一鍵複製</>}
          </button>
        </div>
        <div className="p-6">
          <pre className="whitespace-pre-wrap font-mono text-sm leading-relaxed p-5 rounded-xl max-h-[60vh] overflow-auto"
            style={{ color: 'var(--color-earth-700)', background: 'var(--color-earth-50)', border: '1px solid var(--color-earth-100)' }}>
            {textMap[activeTab]}
          </pre>
        </div>
      </div>

      {/* Quick Copy All */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
        {tabs.map(t => (
          <button key={t.key} onClick={() => handleCopy(t.key)}
            className="flex items-center justify-center gap-1.5 px-3 py-2.5 text-xs font-medium rounded-lg transition shadow-sm"
            style={{ background: 'white', border: '1px solid var(--color-earth-200)', color: 'var(--color-earth-600)' }}>
            {copiedTab === t.key ? <CheckCircle className="w-3.5 h-3.5" style={{ color: 'var(--color-wood-500)' }} /> : <Copy className="w-3.5 h-3.5" style={{ color: 'var(--color-earth-400)' }} />}
            複製{t.label}
          </button>
        ))}
      </div>
    </div>
  );
};
