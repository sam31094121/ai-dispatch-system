// ════════════════════════════════════════════════════
// 模組路由包裝頁
// 把舊有各模組元件包裝成獨立路由頁面，供 App.tsx 直接匯入。
// 每個元件所需的 mockData 在此統一準備，未來換成真實 API 時只需改這一個檔案。
// ════════════════════════════════════════════════════

import React, { useMemo } from 'react';
import { rawEmployees, platforms } from '../data/mockData';
import { calculateAiScores, assignGroups } from '../engine/aiEngine';
import { analyzeTrends, generateMarketingSuggestions } from '../engine/trendEngine';
import {
  analyzeHighValueAbility,
  generateHighValueSuggestions,
  detectHighValueAlerts,
  generateTeamRally,
} from '../engine/highValueEngine';

// ── 元件匯入 ──
import CeoDashboard from '../components/CeoDashboard';
import DispatchDashboard from '../components/DispatchDashboard';
import MyDashboard from '../components/MyDashboard';
import MarketingAIDashboard from '../components/MarketingAI';
import { HighValueCommandCenter, HighValuePersonalPage } from '../components/HighValueCommand';
import {
  ScriptLibraryPage,
  CustomerTargetPage,
  HighValueTrainingPage,
  RallyAnnouncementPage,
} from '../components/HighValueTools';
import {
  BroadcastCommandCenter,
  BroadcastScriptManager,
  BroadcastStyleSettings,
  BroadcastPlaybackControl,
} from '../components/BroadcastPages';
import { LineGroupDashboard, LineGroupRules } from '../components/LineGroupPages';
import { HiringDashboard, TrainingDashboard } from '../components/HiringTraining';
import { PageBlock } from '../components/PageBlock';

// ════════════════════════════════════════════════════
// 共用 Hook：準備所有舊模組所需的計算資料
// ════════════════════════════════════════════════════
function useLegacyData() {
  return useMemo(() => {
    const withScores = calculateAiScores(rawEmployees);
    const employees = assignGroups(withScores);
    const trends = analyzeTrends(employees);
    const suggestions = generateMarketingSuggestions(employees, trends);
    const hvProfiles = analyzeHighValueAbility(employees);
    const hvSuggestions = generateHighValueSuggestions(hvProfiles, employees);
    const hvAlerts = detectHighValueAlerts(hvProfiles);
    const teamRally = generateTeamRally(hvProfiles, '主管版');
    return { employees, platforms, trends, suggestions, hvProfiles, hvSuggestions, hvAlerts, teamRally };
  }, []);
}

// ════════════════════════════════════════════════════
// 輔助元件：分頁切換容器
// ════════════════════════════════════════════════════
function TabbedConsole({ title, tabs, topGlow = '#00D4FF' }: { title: string, tabs: { label: string, component: React.ComponentType<any>, props?: any }[], topGlow?: string }) {
  const [activeTab, setActiveTab] = React.useState(0);
  const ActiveComponent = tabs[activeTab].component;

  return (
    <div style={{ padding: '16px 20px', animation: 'ml-pageIn 0.3s ease-out' }}>
      <div style={{
        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
        marginBottom: 16, paddingBottom: 12, borderBottom: '1px solid rgba(0,212,255,0.08)'
      }}>
        <h1 style={{
          fontSize: 16, fontWeight: 900, color: '#fff', letterSpacing: '1px',
          textShadow: `0 0 16px ${topGlow}aa`, fontFamily: 'Orbitron, sans-serif'
        }}>
          {title}
        </h1>
        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
          {tabs.map((tab, idx) => {
            const isActive = activeTab === idx;
            return (
              <button
                key={idx}
                onClick={() => setActiveTab(idx)}
                style={{
                  padding: '5px 12px', borderRadius: 8, cursor: 'pointer',
                  fontSize: 11, fontWeight: 800, fontFamily: 'Orbitron, sans-serif',
                  transition: 'all 0.2s',
                  background: isActive ? `${topGlow}22` : 'rgba(0,0,0,0.3)',
                  color: isActive ? topGlow : '#94a3b8',
                  border: isActive ? `1px solid ${topGlow}55` : '1px solid rgba(255,255,255,0.08)',
                  boxShadow: isActive ? `0 0 12px ${topGlow}22` : 'none',
                }}
              >
                {tab.label}
              </button>
            );
          })}
        </div>
      </div>
      <div className="tab-content" style={{ animation: 'ml-pageIn 0.2s ease-out' }}>
        <ActiveComponent {...(tabs[activeTab].props || {})} />
      </div>
    </div>
  );
}

// ════════════════════════════════════════════════════
// 各模組路由頁面
// ════════════════════════════════════════════════════

/** 老闆總控台 */
export function BossPage() {
  const { employees, trends } = useLegacyData();
  return <CeoDashboard employees={employees} platforms={platforms} trends={trends} />;
}

/** 主管派單台 */
export function DispatchPage() {
  const { employees } = useLegacyData();
  return <DispatchDashboard employees={employees} />;
}

/** 員工個人頁 */
export function MemberPage() {
  const { employees } = useLegacyData();
  return <MyDashboard employees={employees} />;
}

/** 人工智慧行銷建議 */
export function MarketingPage() {
  const { suggestions, trends } = useLegacyData();
  return <MarketingAIDashboard suggestions={suggestions as any} trends={trends} />;
}

// ──⬇️ 聚合控制台 ──

/** 高價成交爆發 綜合主頁 */
export function HighValuePage() {
  const { hvProfiles, hvSuggestions, hvAlerts, teamRally } = useLegacyData();

  const tabs = [
    { label: '總控台', component: HighValueCommandCenter, props: { profiles: hvProfiles, suggestions: hvSuggestions, alerts: hvAlerts, teamRally } },
    { label: '個人頁', component: HighValuePersonalPage, props: { profiles: hvProfiles, suggestions: hvSuggestions } },
    { label: '話術庫', component: ScriptLibraryPage },
    { label: '攻單名單', component: CustomerTargetPage },
    { label: '高價訓練', component: HighValueTrainingPage, props: { profiles: hvProfiles } },
    { label: '團隊喊話', component: RallyAnnouncementPage, props: { profiles: hvProfiles } },
  ];

  return <TabbedConsole title="高價成交爆發總控" tabs={tabs} topGlow="#ff2a4b" />;
}

/** 女聲智慧播報 綜合主頁 */
export function BroadcastPage() {
  const tabs = [
    { label: '總控台', component: BroadcastCommandCenter },
    { label: '稿管理', component: BroadcastScriptManager },
    { label: '風格', component: BroadcastStyleSettings },
    { label: '控制', component: BroadcastPlaybackControl },
  ];

  return <TabbedConsole title="女聲智慧播報總控" tabs={tabs} topGlow="#ffd700" />;
}

/** LINE 群組轉傳 綜合主頁 */
export function LinePage() {
  const tabs = [
    { label: '轉傳台', component: LineGroupDashboard },
    { label: '規則', component: LineGroupRules },
  ];

  return <TabbedConsole title="LINE 群組轉傳總控" tabs={tabs} topGlow="#00FF9C" />;
}

/** 招聘管理 */
export function HiringPage() {
  return <HiringDashboard />;
}

/** 訓練管理 */
export function TrainingPage() {
  const { employees } = useLegacyData();
  return <TrainingDashboard employees={employees} />;
}

