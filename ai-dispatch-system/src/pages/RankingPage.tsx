import React, { useMemo } from 'react';
import { useReportStore } from '../data/reportStore';
import { generateRankings } from '../engine/rankingEngine';
import type { GroupCode } from '../types/report';
import { ChevronLeft, ArrowRight, Trophy, Medal, Star, TrendingUp, Lock } from 'lucide-react';

const groupStyle: Record<GroupCode, { label: string; emoji: string; desc: string; colorVar: string; borderClass: string }> = {
  A1: { label: 'A1 優先', emoji: '🔴', desc: '高單主力', colorVar: '--color-fire-deep', borderClass: 'wx-group-a1' },
  A2: { label: 'A2 次優', emoji: '🟠', desc: '續單收割', colorVar: '--color-fire-400', borderClass: 'wx-group-a2' },
  B:  { label: 'B 一般',  emoji: '🟡', desc: '一般量單', colorVar: '--color-metal-500', borderClass: 'wx-group-b' },
  C:  { label: 'C 培養',  emoji: '🟢', desc: '補位培養', colorVar: '--color-wood-500', borderClass: 'wx-group-c' },
};

const rankIcon = (r: number) => {
  if (r === 1) return <Trophy className="w-5 h-5" style={{ color: 'var(--color-metal-500)' }} />;
  if (r === 2) return <Medal className="w-5 h-5" style={{ color: 'var(--color-earth-400)' }} />;
  if (r === 3) return <Medal className="w-5 h-5" style={{ color: 'var(--color-metal-400)' }} />;
  return <span className="w-5 h-5 flex items-center justify-center text-xs font-bold" style={{ color: 'var(--color-earth-400)' }}>{r}</span>;
};

export const RankingPage: React.FC<{ onNavigate: (p: string) => void }> = ({ onNavigate }) => {
  const { currentParseResult } = useReportStore();

  const rankings = useMemo(() => {
    if (!currentParseResult) return [];
    return generateRankings(currentParseResult.details);
  }, [currentParseResult]);

  if (!currentParseResult) {
    return (
      <div className="flex flex-col items-center justify-center h-[60vh]">
        <TrendingUp className="w-12 h-12 mb-4" style={{ color: 'var(--color-earth-400)' }} />
        <h2 className="text-xl font-semibold" style={{ color: 'var(--color-earth-800)' }}>查無資料</h2>
        <p className="mt-2" style={{ color: 'var(--color-earth-500)' }}>請先完成輸入、解析、審計</p>
        <button onClick={() => onNavigate('daily_input')} className="wx-btn wx-btn-water mt-4">返回輸入窗口</button>
      </div>
    );
  }

  // 骨牌防呆：審計未通過不顯示排名
  if (!currentParseResult.isAuditPassed) {
    return (
      <div className="flex flex-col items-center justify-center h-[60vh]">
        <Lock className="w-12 h-12 mb-4" style={{ color: 'var(--color-fire-400)' }} />
        <h2 className="text-xl font-semibold" style={{ color: 'var(--color-earth-800)' }}>審計尚未通過</h2>
        <p className="mt-2" style={{ color: 'var(--color-earth-500)' }}>必須先通過 AI 審計，才能生成排名與派單</p>
        <p className="text-xs mt-1 font-medium" style={{ color: 'var(--color-fire-deep)' }}>⛔ 骨牌效應防呆：禁止跳過審計</p>
        <button onClick={() => onNavigate('audit')} className="wx-btn wx-btn-water mt-4">前往 AI 審計</button>
      </div>
    );
  }

  const a1 = rankings.filter(r => r.groupCode === 'A1');
  const a2 = rankings.filter(r => r.groupCode === 'A2');
  const b = rankings.filter(r => r.groupCode === 'B');
  const c = rankings.filter(r => r.groupCode === 'C');
  const totalRevenue = rankings.reduce((s, r) => s + r.totalRevenue, 0);

  return (
    <div className="max-w-6xl mx-auto space-y-6 wx-animate-in">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 pb-4" style={{ borderBottom: '1px solid var(--color-earth-200)' }}>
        <div className="flex items-center gap-4">
          <button onClick={() => onNavigate('audit')} className="p-2 rounded-full transition" style={{ color: 'var(--color-earth-500)' }}><ChevronLeft className="w-6 h-6" /></button>
          <div>
            <h1 className="text-2xl md:text-3xl font-bold" style={{ color: 'var(--color-metal-700)' }}>整合排名與派單</h1>
            <p className="mt-1" style={{ color: 'var(--color-earth-500)' }}>{currentParseResult.date} · {currentParseResult.platform} · {rankings.length} 人</p>
          </div>
        </div>
        <button onClick={() => onNavigate('announcement')} className="wx-btn wx-btn-metal">
          <ArrowRight className="w-5 h-5" /> 生成公告
        </button>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: '整合總業績', value: `$${totalRevenue.toLocaleString()}`, gradient: 'linear-gradient(135deg, var(--color-metal-500), var(--color-metal-700))' },
          { label: '總人數', value: `${rankings.length} 人`, gradient: 'linear-gradient(135deg, var(--color-water-500), var(--color-water-700))' },
          { label: 'A1 高單主力', value: `${a1.length} 人`, gradient: 'linear-gradient(135deg, #c53030, #9b2c2c)' },
          { label: 'C 培養組', value: `${c.length} 人`, gradient: 'linear-gradient(135deg, var(--color-wood-500), var(--color-wood-700))' },
        ].map(card => (
          <div key={card.label} className="rounded-2xl p-5 text-white shadow-md" style={{ background: card.gradient }}>
            <p className="text-xs font-medium opacity-80">{card.label}</p>
            <p className="text-2xl font-bold mt-1">{card.value}</p>
          </div>
        ))}
      </div>

      {/* Ranking Table */}
      <div className="wx-card overflow-hidden">
        <div className="wx-card-header flex items-center gap-2">
          <Trophy className="w-5 h-5" style={{ color: 'var(--color-metal-500)' }} />
          <h2 className="text-lg font-semibold" style={{ color: 'var(--color-earth-800)' }}>整合名次表（依【總業績】→【續單】→【追單】）</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm wx-table min-w-[700px]">
            <thead>
              <tr>
                {['名次','姓名','追單','續單','總業績','實收','分組'].map(h => (
                  <th key={h} className={`px-4 py-3 ${h === '姓名' ? 'text-left' : h === '名次' ? 'text-left' : 'text-right'}`}
                    style={{ borderBottom: '1px solid var(--color-earth-200)' }}>{h === '分組' ? <span className="block text-center">{h}</span> : h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {rankings.map(r => (
                <tr key={r.employeeName} className="transition" style={{ borderBottom: '1px solid var(--color-earth-50)' }}>
                  <td className="px-4 py-3">{rankIcon(r.ranking)}</td>
                  <td className="px-4 py-3 font-medium" style={{ color: 'var(--color-earth-800)' }}>{r.employeeName}{r.isNew ? <span className="text-xs ml-1" style={{ color: 'var(--color-water-500)' }}>（新人）</span> : ''}</td>
                  <td className="px-4 py-3 text-right">{r.dispatchDeals}</td>
                  <td className="px-4 py-3 text-right">${r.followAmount.toLocaleString()}</td>
                  <td className="px-4 py-3 text-right wx-amount">${r.totalRevenue.toLocaleString()}</td>
                  <td className="px-4 py-3 text-right">${r.totalActual.toLocaleString()}</td>
                  <td className="px-4 py-3 text-center"><span className="wx-badge" style={{
                    color: `var(${groupStyle[r.groupCode].colorVar})`,
                    background: r.groupCode === 'A1' ? '#fef2f2' : r.groupCode === 'A2' ? 'var(--color-fire-50)' : r.groupCode === 'B' ? 'var(--color-metal-50)' : 'var(--color-wood-50)',
                    borderColor: r.groupCode === 'A1' ? '#fecaca' : r.groupCode === 'A2' ? 'var(--color-fire-200)' : r.groupCode === 'B' ? 'var(--color-metal-200)' : 'var(--color-wood-200)',
                  }}>{groupStyle[r.groupCode].label}</span></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Dispatch Groups */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {([['A1', a1], ['A2', a2], ['B', b], ['C', c]] as const).map(([code, members]) => {
          const s = groupStyle[code];
          return (
            <div key={code} className={`wx-card p-5 ${s.borderClass}`}>
              <h3 className="font-semibold mb-3" style={{ color: 'var(--color-earth-800)' }}>{s.emoji} {code}｜{s.desc} ({members.length}人)</h3>
              <div className="space-y-2">
                {members.map(m => (
                  <div key={m.employeeName} className="text-sm flex justify-between items-center">
                    <span style={{ color: 'var(--color-earth-700)' }}>{m.ranking}. {m.employeeName}</span>
                    <span className="text-xs wx-amount">${m.totalRevenue.toLocaleString()}</span>
                  </div>
                ))}
                {members.length === 0 && <p className="text-xs" style={{ color: 'var(--color-earth-400)' }}>（無）</p>}
              </div>
            </div>
          );
        })}
      </div>

      {/* Suggestions */}
      <div className="wx-card overflow-hidden">
        <div className="wx-card-header flex items-center gap-2">
          <Star className="w-5 h-5" style={{ color: 'var(--color-metal-500)' }} />
          <h2 className="text-lg font-semibold" style={{ color: 'var(--color-earth-800)' }}>每人一句：建議＋壓力＋激勵</h2>
        </div>
        <div className="divide-y" style={{ borderColor: 'var(--color-earth-50)' }}>
          {rankings.map(r => (
            <div key={r.employeeName} className="p-4 flex items-start gap-3">
              <span className="wx-badge shrink-0 mt-0.5" style={{
                color: `var(${groupStyle[r.groupCode].colorVar})`,
                background: r.groupCode === 'C' ? 'var(--color-wood-50)' : r.groupCode === 'B' ? 'var(--color-metal-50)' : 'var(--color-fire-50)',
                borderColor: r.groupCode === 'C' ? 'var(--color-wood-200)' : r.groupCode === 'B' ? 'var(--color-metal-200)' : 'var(--color-fire-200)',
              }}>{r.groupCode}</span>
              <div>
                <span className="font-medium" style={{ color: 'var(--color-earth-800)' }}>{r.employeeName}</span>
                <p className="text-sm mt-0.5" style={{ color: 'var(--color-earth-600)' }}>{r.suggestion}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Execution Rules */}
      <div className="p-5 rounded-2xl" style={{ background: 'var(--color-water-50)', border: '1px solid var(--color-water-200)' }}>
        <h3 className="font-semibold mb-3" style={{ color: 'var(--color-water-700)' }}>📌 執行規則（鎖死）</h3>
        <ul className="text-sm space-y-1.5 font-medium" style={{ color: 'var(--color-water-600)' }}>
          <li>照順序派。前面全忙，才往後。</li>
          <li>不得指定。不得跳位。</li>
          <li>同客戶回撥，優先回原承接人。</li>
        </ul>
      </div>
    </div>
  );
};
