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
  title: 'AI 派單公告｜5/4 結算 → 5/5 正式派單順序',
  subTitle: 'AI 比例原則版',
  audit: {
    result: 'PASS',
    platformChecks: [
      { platform: '三立奕心', followupCount: 45, totalRevenue: 717358, followupAmount: 575440, receivedAmount: 60460, isPass: true },
      { platform: '民視產品', followupCount: 12, totalRevenue: 490000, followupAmount: 80590, receivedAmount: 18160, isPass: true },
      { platform: '公司產品', followupCount: 4, totalRevenue: 45710, followupAmount: 43230, receivedAmount: 35250, isPass: true },
    ],
    warnings: ['本輪三平台總表與個別明細加總一致。', '無漏算、無多算、無總盤衝突。'],
  },
  summary: { followupCount: 61, totalRevenue: 1253068, followupAmount: 699260, receivedAmount: 113870 },
  weights: { receivedWeight: 3000, followupAmountWeight: 2500, totalRevenueWeight: 1500, unitPriceWeight: 1500, followupCountWeight: 1500 },
  maxReference: {
    maxReceivedAmount: 30480, maxFollowupAmount: 189510, maxTotalRevenue: 244150,
    maxUnitPrice: 27072.86, maxFollowupCount: 7,
    maxReceivedName: '湯玉琦', maxFollowupAmountName: '馬秋香', maxTotalRevenueName: '馬秋香',
    maxUnitPriceName: '馬秋香', maxFollowupCountName: '王珍珠、馬秋香、林沛昕',
  },
  rankingList: [
    { rank: 1, name: '馬秋香', finalScore: 7000, receivedAmount: 0, followupAmount: 189510, totalRevenue: 244150, unitPrice: 27072.86, followupCount: 7, group: 'A1', rankChange: 'up', rankChangeValue: 1, advice: '你這輪靠追續金額、總業績與客單價全面拉高，今天重點是把實收補上。' },
    { rank: 2, name: '湯玉琦', finalScore: 6253.76, receivedAmount: 30480, followupAmount: 62860, totalRevenue: 106860, unitPrice: 12572, followupCount: 5, group: 'A1', rankChange: 'down', rankChangeValue: 1, advice: '你實收仍是全場第一，今天只要再補追續量就能穩住前段。' },
    { rank: 3, name: '林沛昕', finalScore: 6073.93, receivedAmount: 18100, followupAmount: 95580, totalRevenue: 126148, unitPrice: 13654.29, followupCount: 7, group: 'A1', rankChange: 'up', rankChangeValue: 1, advice: '你追續單數與實收都有撐住，今天是繼續往前推的關鍵。' },
    { rank: 4, name: '廖姿惠', finalScore: 3661.65, receivedAmount: 2980, followupAmount: 70660, totalRevenue: 97710, unitPrice: 17665, followupCount: 4, group: 'A1', rankChange: 'up', rankChangeValue: 5, advice: '你這輪客單價與追續金額明顯拉升，今天要把實收接起來。' },
    { rank: 5, name: '王珍珠', finalScore: 3188.03, receivedAmount: 0, followupAmount: 42650, totalRevenue: 128230, unitPrice: 6092.86, followupCount: 7, group: 'A2', rankChange: 'same', advice: '你單數有量、總業績有底，今天差的是把金額與實收再拉高。' },
    { rank: 6, name: '林宜靜', finalScore: 3077.17, receivedAmount: 7600, followupAmount: 31380, totalRevenue: 112760, unitPrice: 10460, followupCount: 3, group: 'A2', rankChange: 'down', rankChangeValue: 3, advice: '你有實收支撐，今天補上追續成交就能再往前。' },
    { rank: 7, name: '高美雲', finalScore: 2930.5, receivedAmount: 11250, followupAmount: 26070, totalRevenue: 42490, unitPrice: 6517.5, followupCount: 4, group: 'A2', rankChange: 'up', rankChangeValue: 6, advice: '你這輪名次明顯上升，今天要把成交穩定度延續。' },
    { rank: 8, name: '周美蓁', finalScore: 2292.29, receivedAmount: 12000, followupAmount: 12000, totalRevenue: 12000, unitPrice: 12000, followupCount: 1, group: 'A2', rankChange: 'down', rankChangeValue: 2, advice: '你有乾淨實收，今天只要再補一筆就能再動名次。' },
    { rank: 9, name: '許喬恩', finalScore: 2292.29, receivedAmount: 12000, followupAmount: 12000, totalRevenue: 12000, unitPrice: 12000, followupCount: 1, group: 'A2', rankChange: 'down', rankChangeValue: 2, advice: '你跟周美蓁分數相同，今天補單就能拉開差距。' },
    { rank: 10, name: '莉莉（新人）', finalScore: 2271.51, receivedAmount: 11880, followupAmount: 11880, totalRevenue: 11880, unitPrice: 11880, followupCount: 1, group: 'A2', rankChange: 'down', rankChangeValue: 2, advice: '你有實收亮點，今天先求穩定再往前推。', isNew: true },
    { rank: 11, name: '徐華妤', finalScore: 2105.03, receivedAmount: 0, followupAmount: 35640, totalRevenue: 35640, unitPrice: 17820, followupCount: 2, group: 'A2', rankChange: 'up', rankChangeValue: 10, advice: '你客單價很漂亮，今天關鍵是把實收補起來。' },
    { rank: 12, name: '高如郁', finalScore: 2039.76, receivedAmount: 7580, followupAmount: 15500, totalRevenue: 37640, unitPrice: 7750, followupCount: 2, group: 'A2', rankChange: 'down', rankChangeValue: 2, advice: '你有實收基礎，今天再補追續金額就能上推。' },
    { rank: 13, name: '李玲玲', finalScore: 1842.52, receivedAmount: 0, followupAmount: 18560, totalRevenue: 78690, unitPrice: 4640, followupCount: 4, group: 'B', rankChange: 'down', rankChangeValue: 2, advice: '你有單數但分數偏散，今天要提高追續金額。' },
    { rank: 14, name: '王梅慧', finalScore: 1742.81, receivedAmount: 0, followupAmount: 20800, totalRevenue: 52600, unitPrice: 5200, followupCount: 4, group: 'B', rankChange: 'down', rankChangeValue: 2, advice: '你單數有基本盤，今天差的是更高客單與實收。' },
    { rank: 15, name: '梁依萍', finalScore: 1486.55, receivedAmount: 0, followupAmount: 14280, totalRevenue: 47640, unitPrice: 14280, followupCount: 1, group: 'B', rankChange: 'up', rankChangeValue: 3, advice: '你有高客單切入點，今天先把下一筆成交接起來。' },
    { rank: 16, name: '林佩君', finalScore: 1312.99, receivedAmount: 0, followupAmount: 14700, totalRevenue: 14700, unitPrice: 14700, followupCount: 1, group: 'B', rankChange: 'up', rankChangeValue: 6, advice: '你這輪有有效分數，今天要把單數補上。' },
    { rank: 17, name: '江麗勉', finalScore: 898.95, receivedAmount: 0, followupAmount: 9480, totalRevenue: 13460, unitPrice: 4740, followupCount: 2, group: 'B', rankChange: 'down', rankChangeValue: 3, advice: '你有追續成交，今天再補一筆就能拉高排序。' },
    { rank: 18, name: '陳百玲（新人）', finalScore: 756.9, receivedAmount: 0, followupAmount: 6980, totalRevenue: 6980, unitPrice: 3490, followupCount: 2, group: 'B', rankChange: 'down', rankChangeValue: 1, advice: '你有累積，不急著衝，先把成交穩定做出來。', isNew: true },
    { rank: 19, name: '鄭珮恩', finalScore: 752.8, receivedAmount: 0, followupAmount: 5750, totalRevenue: 14500, unitPrice: 2875, followupCount: 2, group: 'B', rankChange: 'down', rankChangeValue: 3, advice: '你分數差距不大，今天先把追續金額補強。' },
    { rank: 20, name: '謝啟芳', finalScore: 518.85, receivedAmount: 0, followupAmount: 2980, totalRevenue: 16300, unitPrice: 2980, followupCount: 1, group: 'C', rankChange: 'down', rankChangeValue: 5, advice: '你有成交但分數偏低，今天要先提高客單。' },
    { rank: 21, name: '陳玲華', finalScore: 158.14, receivedAmount: 0, followupAmount: 0, totalRevenue: 25740, unitPrice: 0, followupCount: 0, group: 'C', rankChange: 'down', rankChangeValue: 1, advice: '你有總業績但缺追續與實收，今天先求有效成交。' },
    { rank: 22, name: '江沛林', finalScore: 91.85, receivedAmount: 0, followupAmount: 0, totalRevenue: 14950, unitPrice: 0, followupCount: 0, group: 'C', rankChange: 'down', rankChangeValue: 3, advice: '先把追續單與實收補起來，排名才有上升空間。' },
    { rank: 23, name: '蘇淑玲', finalScore: 0, receivedAmount: 0, followupAmount: 0, totalRevenue: 0, unitPrice: 0, followupCount: 0, group: 'C', rankChange: 'same', advice: '今天先求破零，有分數才有派單空間。' },
    { rank: 24, name: '鄭上官', finalScore: 0, receivedAmount: 0, followupAmount: 0, totalRevenue: 0, unitPrice: 0, followupCount: 0, group: 'C', rankChange: 'same', advice: '先解除空白狀態，後續才有排名意義。' },
  ],
  rankChanges: {
    up: ['馬秋香', '林沛昕', '廖姿惠', '高美雲', '徐華妤', '梁依萍', '林佩君'],
    down: ['湯玉琦', '林宜靜', '周美蓁', '許喬恩', '莉莉（新人）', '高如郁', '李玲玲', '王梅慧', '江麗勉', '陳百玲（新人）', '鄭珮恩', '謝啟芳', '陳玲華', '江沛林'],
    same: ['王珍珠', '蘇淑玲', '鄭上官'],
  },
  grouping: {
    A1: ['馬秋香', '湯玉琦', '林沛昕', '廖姿惠'],
    A2: ['王珍珠', '林宜靜', '高美雲', '周美蓁', '許喬恩', '莉莉（新人）', '徐華妤', '高如郁'],
    B: ['李玲玲', '王梅慧', '梁依萍', '林佩君', '江麗勉', '陳百玲（新人）', '鄭珮恩', '謝啟芳'],
    C: ['陳玲華', '江沛林', '蘇淑玲', '鄭上官'],
  },
  finalConfirmations: [
    '5/4 結算資料已核對完成。',
    '三平台總表全部核對通過。',
    '無漏算、無多算、無總盤衝突。',
    '5/5 正式派單順序，以本則公告為準。',
  ],
  fullAnnouncementText: '正式公告全文請由後端回傳。',
  compactAnnouncementText: '精簡公告全文請由後端回傳。',
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
