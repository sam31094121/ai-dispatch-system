import React, { useState, useMemo } from 'react'
import { motion } from 'framer-motion'
import {
  Search, Copy, CheckCircle2, AlertTriangle, TrendingUp, TrendingDown,
  Minus, Trophy, Sparkles, ChevronDown, ChevronUp,
} from 'lucide-react'

/* ─────────────────────────────────────────────────────── TYPES */

type AuditStatus = 'PASS' | 'WARNING' | 'FAIL'
type GroupKey = 'A1' | 'A2' | 'B' | 'C'
type RankChangeType = 'up' | 'down' | 'same' | 'new'

type PlatformCheck = {
  platform: string
  followupCount: number
  totalRevenue: number
  followupAmount: number
  receivedAmount: number
  isPass: boolean
  note?: string
}

type AuditSection = {
  result: AuditStatus
  platformChecks: PlatformCheck[]
  warnings: string[]
}

type SummarySection = {
  followupCount: number
  totalRevenue: number
  followupAmount: number
  receivedAmount: number
}

type WeightRule = {
  receivedWeight: number
  followupAmountWeight: number
  totalRevenueWeight: number
  unitPriceWeight: number
  followupCountWeight: number
}

type MaxReference = {
  maxReceivedAmount: number
  maxFollowupAmount: number
  maxTotalRevenue: number
  maxUnitPrice: number
  maxFollowupCount: number
  maxReceivedName: string
  maxFollowupAmountName: string
  maxTotalRevenueName: string
  maxUnitPriceName: string
  maxFollowupCountName: string
}

type RankingItem = {
  rank: number
  name: string
  finalScore: number
  receivedAmount: number
  followupAmount: number
  totalRevenue: number
  unitPrice: number
  followupCount: number
  group: GroupKey
  rankChange: RankChangeType
  rankChangeValue?: number
  advice: string
  isNew?: boolean
}

type AnnouncementPayload = {
  title: string
  subTitle: string
  audit: AuditSection
  summary: SummarySection
  weights: WeightRule
  maxReference: MaxReference
  rankingList: RankingItem[]
  rankChanges: { up: string[]; down: string[]; same: string[] }
  grouping: Record<GroupKey, string[]>
  finalConfirmations: string[]
  fullAnnouncementText: string
  compactAnnouncementText: string
}

/* ─────────────────────────────────────────────────────── DEMO DATA */

const DEMO_PAYLOAD: AnnouncementPayload = {
  title: 'AI 派單公告｜5/7 結算 → 5/8 正式派單順序',
  subTitle: 'AI 比例原則版 · 分組：manual_from_announcement',
  audit: {
    result: 'PASS',
    platformChecks: [
      { platform: '三立奕心', followupCount: 85, totalRevenue: 1673616, followupAmount: 1437250, receivedAmount: 622598,  isPass: true },
      { platform: '民視產品', followupCount: 21, totalRevenue: 873270,  followupAmount: 129250,  receivedAmount: 380120,  isPass: true },
      { platform: '公司產品', followupCount: 8,  totalRevenue: 221120,  followupAmount: 218640,  receivedAmount: 186960,  isPass: true },
    ],
    warnings: ['本輪三平台總表與個別明細加總一致。', '無漏算、無多算、無總盤衝突。'],
  },
  summary: { followupCount: 114, totalRevenue: 2768006, followupAmount: 1785140, receivedAmount: 1189678 },
  weights: { receivedWeight: 3000, followupAmountWeight: 2500, totalRevenueWeight: 1500, unitPriceWeight: 1500, followupCountWeight: 1500 },
  maxReference: {
    maxReceivedAmount: 212210, maxFollowupAmount: 437910, maxTotalRevenue: 510790,
    maxUnitPrice: 71000, maxFollowupCount: 17,
    maxReceivedName: '馬秋香', maxFollowupAmountName: '馬秋香', maxTotalRevenueName: '馬秋香',
    maxUnitPriceName: '許喬恩', maxFollowupCountName: '王珍珠',
  },
  rankingList: [
    { rank: 1,  name: '馬秋香',        finalScore: 8858.72, receivedAmount: 212210, followupAmount: 437910, totalRevenue: 510790, unitPrice: 33685.38, followupCount: 13, group: 'A1', rankChange: 'same', advice: '你這輪全面領先，今天重點是把優勢繼續拉開。' },
    { rank: 2,  name: '許喬恩',        finalScore: 4911.59, receivedAmount: 142000, followupAmount: 142000, totalRevenue: 142000, unitPrice: 71000.00, followupCount: 2,  group: 'A1', rankChange: 'same', advice: '你的超高客單直接衝上前段，今天維持成交節奏很重要。' },
    { rank: 3,  name: '王珍珠',        finalScore: 4745.94, receivedAmount: 105250, followupAmount: 145530, totalRevenue: 254150, unitPrice: 8560.59,  followupCount: 17, group: 'A1', rankChange: 'same', advice: '你單數與實收都很穩，今天再補高客單會更強。' },
    { rank: 4,  name: '湯玉琦',        finalScore: 4539.39, receivedAmount: 96760,  followupAmount: 187920, totalRevenue: 261240, unitPrice: 17083.64, followupCount: 11, group: 'A1', rankChange: 'same', advice: '你追續量很漂亮，今天把實收再往上推。' },
    { rank: 5,  name: '王梅慧',        finalScore: 4414.27, receivedAmount: 47240,  followupAmount: 238720, totalRevenue: 350440, unitPrice: 26524.44, followupCount: 9,  group: 'A1', rankChange: 'same', advice: '你高客單開始成形，今天關鍵是再補實收。' },
    { rank: 6,  name: '林沛昕',        finalScore: 3979.29, receivedAmount: 98568,  followupAmount: 142560, totalRevenue: 179656, unitPrice: 12960.00, followupCount: 11, group: 'A1', rankChange: 'same', advice: '你整體很平均，今天只差再補高額成交。' },
    { rank: 7,  name: '廖姿惠',        finalScore: 3744.40, receivedAmount: 105150, followupAmount: 114080, totalRevenue: 185490, unitPrice: 12675.56, followupCount: 9,  group: 'A2', rankChange: 'same', advice: '你實收與追續同步成長，今天有機會再往前。' },
    { rank: 8,  name: '林宜靜',        finalScore: 2781.89, receivedAmount: 108690, followupAmount: 41380,  totalRevenue: 149020, unitPrice: 10345.00, followupCount: 4,  group: 'A2', rankChange: 'same', advice: '你實收很穩，今天把追續量補起來。' },
    { rank: 9,  name: '徐華妤',        finalScore: 2038.72, receivedAmount: 27740,  followupAmount: 89620,  totalRevenue: 105100, unitPrice: 22405.00, followupCount: 4,  group: 'A2', rankChange: 'same', advice: '你客單價很亮眼，今天重點是增加成交數。' },
    { rank: 10, name: '李玲玲',        finalScore: 1969.20, receivedAmount: 99130,  followupAmount: 22540,  totalRevenue: 105610, unitPrice: 4508.00,  followupCount: 5,  group: 'A2', rankChange: 'same', advice: '你實收有撐住，今天再補追續金額。' },
    { rank: 11, name: '梁依萍',        finalScore: 1470.21, receivedAmount: 33360,  followupAmount: 39320,  totalRevenue: 79180,  unitPrice: 13106.67, followupCount: 3,  group: 'A2', rankChange: 'same', advice: '你有高客單優勢，今天先求再接一筆。' },
    { rank: 12, name: '高美雲',        finalScore: 1370.15, receivedAmount: 18710,  followupAmount: 42580,  totalRevenue: 62390,  unitPrice: 8516.00,  followupCount: 5,  group: 'A2', rankChange: 'same', advice: '你目前差距不大，再補單就有機會翻位。' },
    { rank: 13, name: '高如郁',        finalScore: 1203.26, receivedAmount: 27060,  followupAmount: 27380,  totalRevenue: 70450,  unitPrice: 9126.67,  followupCount: 3,  group: 'A2', rankChange: 'same', advice: '你還在可上升區，今天先穩定成交。' },
    { rank: 14, name: '鄭珮恩',        finalScore: 816.95,  receivedAmount: 3390,   followupAmount: 20400,  totalRevenue: 42630,  unitPrice: 4080.00,  followupCount: 5,  group: 'B',  rankChange: 'same', advice: '你追續單數有起來，今天補實收會更完整。' },
    { rank: 15, name: '林佩君',        finalScore: 809.56,  receivedAmount: 14700,  followupAmount: 18700,  totalRevenue: 41200,  unitPrice: 9350.00,  followupCount: 2,  group: 'B',  rankChange: 'same', advice: '你現在要把成交量做出來。' },
    { rank: 16, name: '江沛林',        finalScore: 684.15,  receivedAmount: 11560,  followupAmount: 6980,   totalRevenue: 83490,  unitPrice: 6980.00,  followupCount: 1,  group: 'B',  rankChange: 'same', advice: '你有總業績底盤，今天補追續即可往前。' },
    { rank: 17, name: '陳玲華',        finalScore: 676.01,  receivedAmount: 18300,  followupAmount: 7000,   totalRevenue: 48090,  unitPrice: 7000.00,  followupCount: 1,  group: 'B',  rankChange: 'same', advice: '先把有效成交做出來，排名就會往上。' },
    { rank: 18, name: '陳百玲（新人）', finalScore: 672.31,  receivedAmount: 2000,   followupAmount: 24180,  totalRevenue: 24180,  unitPrice: 8060.00,  followupCount: 3,  group: 'B',  rankChange: 'same', advice: '穩定累積最重要，先把節奏做穩。', isNew: true },
    { rank: 19, name: '周美蓁',        finalScore: 615.15,  receivedAmount: 12000,  followupAmount: 12000,  totalRevenue: 12000,  unitPrice: 12000.00, followupCount: 1,  group: 'B',  rankChange: 'same', advice: '你有穩定實收，再一筆就能往前推。' },
    { rank: 20, name: '莉莉（新人）',  finalScore: 609.88,  receivedAmount: 11880,  followupAmount: 11880,  totalRevenue: 11880,  unitPrice: 11880.00, followupCount: 1,  group: 'C',  rankChange: 'same', advice: '先維持穩定成交，慢慢把分數墊高。', isNew: true },
    { rank: 21, name: '江麗勉',        finalScore: 560.54,  receivedAmount: 13460,  followupAmount: 9480,   totalRevenue: 13460,  unitPrice: 4740.00,  followupCount: 2,  group: 'C',  rankChange: 'same', advice: '今天先補追續量，會比較容易翻位。' },
    { rank: 22, name: '謝啟芳',        finalScore: 348.11,  receivedAmount: 9340,   followupAmount: 2980,   totalRevenue: 16300,  unitPrice: 2980.00,  followupCount: 1,  group: 'C',  rankChange: 'same', advice: '先把客單價往上拉，分數會提升很多。' },
    { rank: 23, name: '蘇淑玲',        finalScore: 56.56,   receivedAmount: 0,      followupAmount: 0,      totalRevenue: 19260,  unitPrice: 0,        followupCount: 0,  group: 'C',  rankChange: 'same', advice: '今天先求破零，有分數才有競爭力。' },
    { rank: 24, name: '鄭上官',        finalScore: 0,       receivedAmount: 0,      followupAmount: 0,      totalRevenue: 0,      unitPrice: 0,        followupCount: 0,  group: 'C',  rankChange: 'same', advice: '先解除空白狀態，後續排名才有排名意義。' },
  ],
  rankChanges: {
    up:   [],
    down: [],
    same: [],
  },
  grouping: {
    A1: ['馬秋香', '許喬恩', '王珍珠', '湯玉琦', '王梅慧', '林沛昕'],
    A2: ['廖姿惠', '林宜靜', '徐華妤', '李玲玲', '梁依萍', '高美雲', '高如郁'],
    B:  ['鄭珮恩', '林佩君', '江沛林', '陳玲華', '陳百玲（新人）', '周美蓁'],
    C:  ['莉莉（新人）', '江麗勉', '謝啟芳', '蘇淑玲', '鄭上官'],
  },
  finalConfirmations: [
    '5/7 結算資料已核對完成。',
    '三平台總表全部核對通過。',
    '本輪三平台總表與個別明細加總一致。',
    '無漏算、無多算、無總盤衝突。',
    '5/8 正式派單順序，以本則公告為準。',
  ],
  fullAnnouncementText: `【AI 派單公告｜5/7 結算 → 5/8 正式派單順序｜AI 比例原則版】

一、審計結論：PASS
二、整合總盤：追續114單｜總業績2,768,006｜追續金額1,785,140｜實收1,189,678

三、正式名次
1.馬秋香 8858.72｜2.許喬恩 4911.59｜3.王珍珠 4745.94｜4.湯玉琦 4539.39
5.王梅慧 4414.27｜6.林沛昕 3979.29｜7.廖姿惠 3744.40｜8.林宜靜 2781.89
9.徐華妤 2038.72｜10.李玲玲 1969.20｜11.梁依萍 1470.21｜12.高美雲 1370.15
13.高如郁 1203.26｜14.鄭珮恩 816.95｜15.林佩君 809.56｜16.江沛林 684.15
17.陳玲華 676.01｜18.陳百玲（新人）672.31｜19.周美蓁 615.15｜20.莉莉（新人）609.88
21.江麗勉 560.54｜22.謝啟芳 348.11｜23.蘇淑玲 56.56｜24.鄭上官 0.00

四、分級（manual_from_announcement）
🔴A1：馬秋香、許喬恩、王珍珠、湯玉琦、王梅慧、林沛昕
🟠A2：廖姿惠、林宜靜、徐華妤、李玲玲、梁依萍、高美雲、高如郁
🟡B：鄭珮恩、林佩君、江沛林、陳玲華、陳百玲（新人）、周美蓁
🟢C：莉莉（新人）、江麗勉、謝啟芳、蘇淑玲、鄭上官`,
  compactAnnouncementText: '🔴A1主力：馬秋香、許喬恩、王珍珠、湯玉琦、王梅慧、林沛昕｜🟠A2次主力：廖姿惠、林宜靜、徐華妤、李玲玲、梁依萍、高美雲、高如郁｜🟡B組：鄭珮恩、林佩君、江沛林、陳玲華、陳百玲（新人）、周美蓁｜🟢C組：莉莉（新人）、江麗勉、謝啟芳、蘇淑玲、鄭上官',
}

/* ─────────────────────────────────────────────────────── CONSTANTS */

const G: Record<GroupKey, { text: string; bg: string; border: string; label: string }> = {
  A1: { text: 'text-amber-300',  bg: 'bg-amber-500/10',  border: 'border-amber-400/30',  label: 'A1 高優先主力' },
  A2: { text: 'text-cyan-300',   bg: 'bg-cyan-500/10',   border: 'border-cyan-400/30',   label: 'A2 次主力追進' },
  B:  { text: 'text-violet-300', bg: 'bg-violet-500/10', border: 'border-violet-400/30', label: 'B 一般量單' },
  C:  { text: 'text-slate-400',  bg: 'bg-slate-500/10',  border: 'border-slate-400/30',  label: 'C 基礎培育' },
}

/* ─────────────────────────────────────────────────────── HELPERS */

const nf = new Intl.NumberFormat('zh-TW', { maximumFractionDigits: 0 })
const fmt = (v: number) => nf.format(v)
const fmtScore = (v: number) => v.toFixed(2)
const barPct = (v: number, max: number) => max > 0 ? Math.min(100, (v / max) * 100) : 0

/* ─────────────────────────────────────────────────────── ATOMS */

function Panel({ children, className = '' }: { children: React.ReactNode; className?: string }) {
  return (
    <div className={`bg-white/[0.025] border border-white/[0.07] rounded-xl ${className}`}>
      {children}
    </div>
  )
}

function Eyebrow({ text }: { text: string }) {
  return <p className="text-[10px] uppercase tracking-[0.15em] text-slate-500 mb-1">{text}</p>
}

function AuditBadge({ status }: { status: AuditStatus }) {
  const s = {
    PASS:    'text-emerald-400 bg-emerald-400/10 border-emerald-400/30',
    WARNING: 'text-amber-400  bg-amber-400/10  border-amber-400/30',
    FAIL:    'text-rose-400   bg-rose-400/10   border-rose-400/30',
  }[status]
  const Icon = status === 'PASS' ? CheckCircle2 : AlertTriangle
  return (
    <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold border ${s}`}>
      <Icon size={12} /> {status}
    </span>
  )
}

function ScoreBar({ value, max, group }: { value: number; max: number; group: GroupKey }) {
  const w = barPct(value, max)
  const bar = group === 'A1' ? 'from-amber-400 to-amber-300' :
              group === 'A2' ? 'from-cyan-400 to-cyan-300' :
              group === 'B'  ? 'from-violet-400 to-violet-300' :
                               'from-slate-600 to-slate-500'
  return (
    <div className="h-[3px] w-full bg-white/[0.06] rounded-full overflow-hidden mt-1.5">
      <motion.div
        initial={{ width: 0 }}
        animate={{ width: `${w}%` }}
        transition={{ duration: 0.9, ease: 'easeOut' }}
        className={`h-full rounded-full bg-gradient-to-r ${bar}`}
      />
    </div>
  )
}

function RankPip({ change, value }: { change: RankChangeType; value?: number }) {
  if (change === 'up') return (
    <span className="flex items-center gap-0.5 text-emerald-400 text-[11px] font-bold whitespace-nowrap">
      <TrendingUp size={11} /> +{value ?? ''}
    </span>
  )
  if (change === 'down') return (
    <span className="flex items-center gap-0.5 text-rose-400 text-[11px] font-bold whitespace-nowrap">
      <TrendingDown size={11} /> -{value ?? ''}
    </span>
  )
  if (change === 'new') return (
    <span className="flex items-center gap-0.5 text-cyan-400 text-[11px] font-bold">
      <Sparkles size={11} /> NEW
    </span>
  )
  return <Minus size={11} className="text-slate-600" />
}

function GroupChip({ group }: { group: GroupKey }) {
  const c = G[group]
  return (
    <span className={`inline-flex px-1.5 py-0.5 rounded text-[11px] font-bold border ${c.text} ${c.bg} ${c.border}`}>
      {group}
    </span>
  )
}

function CopyBtn({ text, label }: { text: string; label?: string }) {
  const [done, setDone] = useState(false)
  const copy = async () => {
    await navigator.clipboard.writeText(text)
    setDone(true)
    setTimeout(() => setDone(false), 2000)
  }
  return (
    <button
      onClick={copy}
      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-white/[0.04] border border-white/[0.08] hover:bg-white/[0.08] transition-colors"
    >
      {done ? <CheckCircle2 size={13} className="text-emerald-400" /> : <Copy size={13} />}
      {done ? '已複製' : (label ?? '複製')}
    </button>
  )
}

/* ─────────────────────────────────────────────────────── SECTIONS */

function A1Spotlight({ list, maxScore }: { list: RankingItem[]; maxScore: number }) {
  const a1 = list.filter(r => r.group === 'A1')
  return (
    <section className="space-y-3">
      <div className="flex items-center gap-2">
        <Trophy size={14} className="text-amber-400" />
        <Eyebrow text="A1 高優先主力｜今日必派首席" />
      </div>
      {/* Rank 1 full-width */}
      {a1.filter(r => r.rank === 1).map(r => (
        <motion.div
          key={r.name}
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          className="relative p-5 rounded-xl border border-amber-400/40 bg-amber-500/[0.07] shadow-lg shadow-amber-500/10"
        >
          <span className="absolute top-4 right-4 text-2xl">👑</span>
          <div className="flex items-center gap-3 mb-3">
            <span className="text-3xl font-black text-amber-300">#1</span>
            <div>
              <p className="text-xl font-black">{r.name}</p>
              <RankPip change={r.rankChange} value={r.rankChangeValue} />
            </div>
          </div>
          <p className="text-3xl font-black text-amber-200 mb-1 mono">{fmtScore(r.finalScore)}</p>
          <ScoreBar value={r.finalScore} max={maxScore} group="A1" />
          <div className="grid grid-cols-3 sm:grid-cols-5 gap-3 mt-4">
            {[
              { label: '實收',     val: fmt(r.receivedAmount) },
              { label: '追續金額', val: fmt(r.followupAmount) },
              { label: '總業績',   val: fmt(r.totalRevenue) },
              { label: '客單價',   val: fmt(r.unitPrice) },
              { label: '追續單數', val: String(r.followupCount) },
            ].map(m => (
              <div key={m.label}>
                <p className="text-[10px] text-slate-500">{m.label}</p>
                <p className="text-sm font-bold text-slate-200 mono">{m.val}</p>
              </div>
            ))}
          </div>
          <p className="mt-4 text-xs text-amber-200/70 border-t border-amber-400/20 pt-3 leading-relaxed">{r.advice}</p>
        </motion.div>
      ))}
      {/* Ranks 2-4 grid */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        {a1.filter(r => r.rank > 1).map((r, i) => (
          <motion.div
            key={r.name}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 + i * 0.07 }}
            className="p-4 rounded-xl border border-amber-400/20 bg-amber-500/[0.03]"
          >
            <div className="flex items-center justify-between mb-2">
              <span className="text-2xl font-black text-amber-300">#{r.rank}</span>
              <RankPip change={r.rankChange} value={r.rankChangeValue} />
            </div>
            <p className="text-base font-bold mb-1">{r.name}</p>
            <p className="text-xl font-black text-amber-200 mono">{fmtScore(r.finalScore)}</p>
            <ScoreBar value={r.finalScore} max={maxScore} group="A1" />
            <div className="grid grid-cols-2 gap-2 mt-3">
              <div><p className="text-[10px] text-slate-500">實收</p><p className="text-xs font-semibold mono">{fmt(r.receivedAmount)}</p></div>
              <div><p className="text-[10px] text-slate-500">追續金額</p><p className="text-xs font-semibold mono">{fmt(r.followupAmount)}</p></div>
            </div>
          </motion.div>
        ))}
      </div>
    </section>
  )
}

function SummaryPanel({ summary }: { summary: SummarySection }) {
  const stats = [
    { label: '追續成交', value: fmt(summary.followupCount), unit: '單' },
    { label: '總業績',   value: fmt(summary.totalRevenue),  unit: '元' },
    { label: '追續金額', value: fmt(summary.followupAmount), unit: '元' },
    { label: '實收',     value: fmt(summary.receivedAmount), unit: '元' },
  ]
  return (
    <Panel className="p-5">
      <Eyebrow text="Overall Stats" />
      <h2 className="text-base font-bold mb-4">整合總盤</h2>
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {stats.map(s => (
          <div key={s.label} className="text-center p-3 rounded-lg bg-white/[0.03] border border-white/[0.05]">
            <p className="text-[10px] text-slate-500 mb-1">{s.label}</p>
            <p className="text-xl font-black mono">{s.value}</p>
            <p className="text-[10px] text-slate-500">{s.unit}</p>
          </div>
        ))}
      </div>
    </Panel>
  )
}

function RankingTable({ list, maxScore }: { list: RankingItem[]; maxScore: number }) {
  const [search, setSearch] = useState('')
  const filtered = useMemo(
    () => search ? list.filter(r => r.name.includes(search)) : list,
    [search, list]
  )
  return (
    <Panel className="p-5">
      <div className="flex items-center justify-between mb-4 gap-3">
        <div>
          <Eyebrow text="Official Ranking" />
          <h2 className="text-base font-bold">正式派單名次</h2>
        </div>
        <div className="relative shrink-0">
          <Search size={13} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-500" />
          <input
            type="search"
            placeholder="搜尋姓名…"
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="pl-7 pr-3 py-1.5 text-xs bg-white/[0.04] border border-white/[0.08] rounded-lg focus:outline-none focus:border-amber-400/40 w-32 transition-colors"
          />
        </div>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-white/[0.06]">
              {['名次', '姓名', '分級', '分數', '異動', '實收', '追續金額', '總業績', '客單價', '追續單數'].map(h => (
                <th key={h} className="pb-2 pr-3 text-left text-[10px] uppercase tracking-wide text-slate-500 font-medium whitespace-nowrap">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {filtered.map((r, i) => (
              <motion.tr
                key={r.name}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: i * 0.015 }}
                className="border-b border-white/[0.03] hover:bg-white/[0.03] transition-colors"
              >
                <td className="py-2.5 pr-3">
                  <span className={`font-black text-lg ${r.rank <= 4 ? 'text-amber-300' : r.rank <= 12 ? 'text-cyan-300' : r.rank <= 19 ? 'text-violet-300' : 'text-slate-500'}`}>
                    {r.rank}
                  </span>
                </td>
                <td className="py-2.5 pr-3 font-medium whitespace-nowrap">
                  {r.name}
                  {r.isNew && <span className="ml-1 text-[10px] text-cyan-400 border border-cyan-400/30 rounded px-1 align-middle">NEW</span>}
                </td>
                <td className="py-2.5 pr-3"><GroupChip group={r.group} /></td>
                <td className="py-2.5 pr-3 min-w-[90px]">
                  <span className="font-bold mono text-xs">{fmtScore(r.finalScore)}</span>
                  <ScoreBar value={r.finalScore} max={maxScore} group={r.group} />
                </td>
                <td className="py-2.5 pr-3"><RankPip change={r.rankChange} value={r.rankChangeValue} /></td>
                <td className="py-2.5 pr-3 mono text-xs text-right tabular-nums">{fmt(r.receivedAmount)}</td>
                <td className="py-2.5 pr-3 mono text-xs text-right tabular-nums">{fmt(r.followupAmount)}</td>
                <td className="py-2.5 pr-3 mono text-xs text-right tabular-nums">{fmt(r.totalRevenue)}</td>
                <td className="py-2.5 pr-3 mono text-xs text-right tabular-nums">{fmt(r.unitPrice)}</td>
                <td className="py-2.5 pr-3 mono text-xs text-right tabular-nums">{r.followupCount}</td>
              </motion.tr>
            ))}
          </tbody>
        </table>
      </div>
    </Panel>
  )
}

function RankChanges({ rankChanges }: { rankChanges: AnnouncementPayload['rankChanges'] }) {
  const isNotProvided = rankChanges.up.length === 0 && rankChanges.down.length === 0 && rankChanges.same.length === 0
  if (isNotProvided) {
    return (
      <Panel className="p-4">
        <p className="text-xs text-slate-500 flex items-center gap-2">
          <Minus size={13} className="text-slate-600" />
          本輪未提供名次異動對照資料（not_provided）
        </p>
      </Panel>
    )
  }
  const rows = [
    { label: '↑ 名次上升', cls: 'text-emerald-400', names: rankChanges.up },
    { label: '↓ 名次下降', cls: 'text-rose-400',    names: rankChanges.down },
    { label: '— 名次持平', cls: 'text-slate-400',   names: rankChanges.same },
  ]
  return (
    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
      {rows.map(row => (
        <Panel key={row.label} className="p-4">
          <p className={`text-xs font-bold mb-2.5 ${row.cls}`}>{row.label} ({row.names.length})</p>
          <div className="flex flex-wrap gap-1.5">
            {row.names.map(n => (
              <span key={n} className="text-[11px] px-1.5 py-0.5 rounded bg-white/[0.04] border border-white/[0.06] text-slate-300">{n}</span>
            ))}
          </div>
        </Panel>
      ))}
    </div>
  )
}

function GroupsPanel({ grouping }: { grouping: Record<GroupKey, string[]> }) {
  return (
    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
      {(Object.keys(grouping) as GroupKey[]).map(g => {
        const c = G[g]
        const members = grouping[g]
        return (
          <Panel key={g} className={`p-4 border ${c.border}`}>
            <p className={`text-xs font-bold mb-1 ${c.text}`}>{c.label}</p>
            <p className="text-2xl font-black mb-2">{members.length}<span className="text-xs font-normal text-slate-500 ml-1">人</span></p>
            <div className="flex flex-wrap gap-1">
              {members.map(n => (
                <span key={n} className={`text-[11px] px-1.5 py-0.5 rounded border ${c.text} ${c.bg} ${c.border}`}>{n}</span>
              ))}
            </div>
          </Panel>
        )
      })}
    </div>
  )
}

function AuditPanel({ audit }: { audit: AuditSection }) {
  const [open, setOpen] = useState(false)
  return (
    <Panel className="p-5">
      <div className="flex items-center justify-between mb-3">
        <div>
          <Eyebrow text="Audit" />
          <h2 className="text-base font-bold">審計結果</h2>
        </div>
        <div className="flex items-center gap-2">
          <AuditBadge status={audit.result} />
          <button onClick={() => setOpen(!open)} className="text-slate-500 hover:text-slate-300 transition-colors">
            {open ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
          </button>
        </div>
      </div>
      <ul className="space-y-1 mb-3">
        {audit.warnings.map((w, i) => (
          <li key={i} className="text-xs text-slate-400 flex items-start gap-1.5">
            <CheckCircle2 size={12} className="text-emerald-400 mt-0.5 shrink-0" /> {w}
          </li>
        ))}
      </ul>
      {open && (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mt-4 pt-4 border-t border-white/[0.06]">
          {audit.platformChecks.map(p => (
            <div key={p.platform} className="p-3 rounded-lg bg-white/[0.03] border border-white/[0.05]">
              <div className="flex items-center justify-between mb-2">
                <p className="text-xs font-bold">{p.platform}</p>
                <span className={`text-[10px] font-bold ${p.isPass ? 'text-emerald-400' : 'text-rose-400'}`}>
                  {p.isPass ? '✓ PASS' : '✗ FAIL'}
                </span>
              </div>
              <div className="grid grid-cols-2 gap-1 text-[11px] text-slate-400 mono">
                <span>追續: {p.followupCount}</span>
                <span>實收: {fmt(p.receivedAmount)}</span>
                <span>追續額: {fmt(p.followupAmount)}</span>
                <span>總業績: {fmt(p.totalRevenue)}</span>
              </div>
            </div>
          ))}
        </div>
      )}
    </Panel>
  )
}

function AdvicePanel({ list }: { list: RankingItem[] }) {
  return (
    <Panel className="p-5">
      <Eyebrow text="Per-person Advice" />
      <h2 className="text-base font-bold mb-4">每人一句建議</h2>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
        {list.map(r => (
          <div key={r.name} className="p-3 rounded-lg bg-white/[0.02] border border-white/[0.05]">
            <div className="flex items-center gap-1.5 mb-1.5 flex-wrap">
              <span className={`text-sm font-black mono ${r.rank <= 4 ? 'text-amber-300' : 'text-slate-500'}`}>#{r.rank}</span>
              <span className="text-sm font-semibold">{r.name}</span>
              <GroupChip group={r.group} />
            </div>
            <p className="text-xs text-slate-400 leading-relaxed">{r.advice}</p>
          </div>
        ))}
      </div>
    </Panel>
  )
}

function CopyPanel({ payload }: { payload: AnnouncementPayload }) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
      {[
        { eyebrow: 'Full Announcement', title: '完整公告文字', text: payload.fullAnnouncementText, label: '複製完整版' },
        { eyebrow: 'Compact',           title: '群組精簡版',   text: payload.compactAnnouncementText, label: '複製精簡版' },
      ].map(item => (
        <Panel key={item.title} className="p-5">
          <div className="flex items-center justify-between mb-3">
            <div>
              <Eyebrow text={item.eyebrow} />
              <h2 className="text-sm font-bold">{item.title}</h2>
            </div>
            <CopyBtn text={item.text} label={item.label} />
          </div>
          <textarea
            readOnly
            value={item.text}
            className="w-full h-36 text-xs text-slate-400 bg-white/[0.02] border border-white/[0.06] rounded-lg p-3 resize-none focus:outline-none mono"
          />
        </Panel>
      ))}
    </div>
  )
}

/* ─────────────────────────────────────────────────────── APP */

export default function App() {
  const payload = DEMO_PAYLOAD
  const maxScore = payload.rankingList[0]?.finalScore ?? 1

  return (
    <div className="min-h-screen bg-[#05080f] text-slate-100">

      {/* TOPBAR */}
      <header className="sticky top-0 z-50 bg-[#05080f]/95 backdrop-blur-md border-b border-white/[0.06] px-4 py-3">
        <div className="max-w-5xl mx-auto flex items-center justify-between gap-4">
          <div>
            <p className="text-[10px] uppercase tracking-widest text-slate-500">AI Dispatch Terminal</p>
            <h1 className="text-base font-black leading-tight">{payload.title}</h1>
            <p className="text-xs text-slate-500">{payload.subTitle}</p>
          </div>
          <AuditBadge status={payload.audit.result} />
        </div>
      </header>

      {/* CONTENT */}
      <div className="max-w-5xl mx-auto px-4 py-6 space-y-6 pb-16">

        {/* 1. A1 英雄 */}
        <A1Spotlight list={payload.rankingList} maxScore={maxScore} />

        {/* 2. 整合總盤 */}
        <SummaryPanel summary={payload.summary} />

        {/* 3. 名次表 */}
        <RankingTable list={payload.rankingList} maxScore={maxScore} />

        {/* 4. 名次異動 */}
        <RankChanges rankChanges={payload.rankChanges} />

        {/* 5. 分級卡 */}
        <GroupsPanel grouping={payload.grouping} />

        {/* 6. 審計 */}
        <AuditPanel audit={payload.audit} />

        {/* 7. 每人建議 */}
        <AdvicePanel list={payload.rankingList} />

        {/* 8. 鎖定確認 */}
        <Panel className="p-5">
          <Eyebrow text="Final Lock" />
          <h2 className="text-base font-bold mb-3">正式鎖定確認</h2>
          <ul className="space-y-2">
            {payload.finalConfirmations.map((c, i) => (
              <li key={i} className="flex items-center gap-2 text-sm text-slate-300">
                <CheckCircle2 size={14} className="text-emerald-400 shrink-0" /> {c}
              </li>
            ))}
          </ul>
        </Panel>

        {/* 9. 複製區 */}
        <CopyPanel payload={payload} />

      </div>
    </div>
  )
}
