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

/** 高價總控台 */
export function HvCommandPage() {
  const { hvProfiles, hvSuggestions, hvAlerts, teamRally } = useLegacyData();
  return (
    <HighValueCommandCenter
      profiles={hvProfiles}
      suggestions={hvSuggestions}
      alerts={hvAlerts}
      teamRally={teamRally}
    />
  );
}

/** 高價個人頁 */
export function HvPersonalPage() {
  const { hvProfiles, hvSuggestions } = useLegacyData();
  const topProfile = hvProfiles[0];
  if (!topProfile) {
    return (
      <PageBlock title="高價個人頁">
        <div style={{ padding: 32, color: '#94a3b8' }}>無資料</div>
      </PageBlock>
    );
  }
  return <HighValuePersonalPage profiles={hvProfiles} suggestions={hvSuggestions} />;
}

/** 話術素材庫 */
export function HvScriptsPage() {
  return <ScriptLibraryPage />;
}

/** 攻單名單 */
export function HvTargetsPage() {
  const { hvProfiles } = useLegacyData();
  return <CustomerTargetPage />;
}

/** 高價訓練 */
export function HvTrainingPage() {
  const { hvProfiles } = useLegacyData();
  return <HighValueTrainingPage profiles={hvProfiles} />;
}

/** 團隊喊話 */
export function HvRallyPage() {
  const { hvProfiles, teamRally } = useLegacyData();
  return <RallyAnnouncementPage profiles={hvProfiles} />;
}

/** 播報總控台 */
export function BcCommandPage() {
  return <BroadcastCommandCenter />;
}

/** 播報稿管理 */
export function BcScriptsPage() {
  return <BroadcastScriptManager />;
}

/** 播報風格 */
export function BcStylePage() {
  return <BroadcastStyleSettings />;
}

/** 播放控制 */
export function BcPlaybackPage() {
  return <BroadcastPlaybackControl />;
}

/** LINE 轉傳台 */
export function LineConvertPage() {
  return <LineGroupDashboard />;
}

/** 轉傳規則 */
export function LineRulesPage() {
  return <LineGroupRules />;
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
