const fs = require('fs');
const path = require('path');

const settlementDate = "2026-05-08";
const dispatchDate = "2026-05-09";

const rawData = [
    { name: "馬秋香", score: 9001.50, cash: 353930, followCash: 530590, total: 621230, avg: 30182.14, count: 17, group: "A1", advice: "本輪全面霸榜，今天重點是持續穩住高實收節奏。" },
    { name: "王梅慧", score: 4707.77, cash: 147240, followCash: 253580, total: 376660, avg: 23052.73, count: 11, group: "A1", advice: "高客單已拉開差距，今天再補實收就能繼續緊追第一梯隊。" },
    { name: "王珍珠", score: 4190.26, cash: 133510, followCash: 154230, total: 273510, avg: 8117.37, count: 19, group: "A1", advice: "你追續量是全場最高，今天要把高量轉成更高實收。" },
    { name: "許喬恩", score: 3873.46, cash: 142000, followCash: 142000, total: 142000, avg: 71000.00, count: 2, group: "A1", advice: "超高客單價非常突出，今天只要補單數就能再往上。" },
    { name: "湯玉琦", score: 3832.17, cash: 119040, followCash: 187920, total: 293380, avg: 17083.64, count: 11, group: "A1", advice: "你整體結構穩定，今天差的是再補高金額單。" },
    { name: "林沛昕", score: 3086.97, cash: 98568, followCash: 142560, total: 181216, avg: 12960.00, count: 11, group: "A2", advice: "你單數與實收都有撐住，今天有機會再往前推進。" },
    { name: "廖姿惠", score: 3021.23, cash: 111190, followCash: 120080, total: 194570, avg: 12008.00, count: 10, group: "A2", advice: "你追續單數提升很明顯，今天重點是穩定實收。" },
    { name: "林宜靜", score: 2416.71, cash: 122650, followCash: 61380, total: 179660, avg: 12276.00, count: 5, group: "A2", advice: "你實收穩定度高，今天只差補追續金額。" },
    { name: "徐華妤", score: 1984.04, cash: 40960, followCash: 98860, total: 137960, avg: 24715.00, count: 4, group: "A2", advice: "你的客單價很漂亮，今天要把量再補起來。" },
    { name: "李玲玲", score: 1549.93, cash: 76870, followCash: 22540, total: 125150, avg: 4508.00, count: 5, group: "A2", advice: "你實收有撐住，今天關鍵是提高追續金額。" },
    { name: "高美雲", score: 1476.91, cash: 35000, followCash: 49490, total: 76530, avg: 7070.00, count: 8, group: "A2", advice: "你整體有穩定輸出，今天再補單數就能往前。" },
    { name: "高如郁", score: 1233.41, cash: 37640, followCash: 39260, total: 85410, avg: 9815.00, count: 4, group: "A2", advice: "你實收有基礎，今天重點是提高成交量。" },
    { name: "梁依萍", score: 1228.06, cash: 39860, followCash: 39320, total: 79180, avg: 13106.67, count: 3, group: "A2", advice: "你的客單仍有優勢，今天差的是追續量。" },
    { name: "鄭珮恩", score: 1163.20, cash: 8750, followCash: 41340, total: 63570, avg: 5905.71, count: 7, group: "B", advice: "你追續單數進步很多，今天重點是提高客單。" },
    { name: "江沛林", score: 1087.68, cash: 51240, followCash: 15680, total: 96170, avg: 5226.67, count: 3, group: "B", advice: "你實收拉起來了，今天再補追續就能衝排名。" },
    { name: "林佩君", score: 778.80, cash: 18700, followCash: 18700, total: 41200, avg: 9350.00, count: 2, group: "B", advice: "你目前分數偏集中，今天要增加成交量。" },
    { name: "周美蓁", score: 597.78, cash: 12000, followCash: 12000, total: 12000, avg: 12000.00, count: 1, group: "B", advice: "你有穩定實收，今天補一筆就能明顯前進。" },
    { name: "江麗勉", score: 592.11, cash: 13460, followCash: 16480, total: 25460, avg: 4120.00, count: 4, group: "B", advice: "你有成交基礎，今天重點是提高總業績。" },
    { name: "謝啟芳", score: 554.28, cash: 16300, followCash: 12980, total: 43180, avg: 6490.00, count: 2, group: "C", advice: "你實收有進來，今天要補追續金額。" },
    { name: "陳百玲（新人）", score: 549.10, cash: 2000, followCash: 24180, total: 24180, avg: 8060.00, count: 3, group: "C", advice: "先穩定成交節奏，不急著硬衝高客單。" },
    { name: "陳玲華", score: 495.86, cash: 28120, followCash: 7000, total: 48090, avg: 7000.00, count: 1, group: "C", advice: "你有實收支撐，今天先補追續成交。" },
    { name: "莉莉（新人）", score: 439.55, cash: 11880, followCash: 11880, total: 11880, avg: 11880.00, count: 1, group: "C", advice: "今天先求穩定破單，慢慢累積節奏。" },
    { name: "鄭上官", score: 0, cash: 0, followCash: 0, total: 0, avg: 0, count: 0, group: "C", advice: "今天先求破零，有分數才有派單空間。" }
];

const report = {
    report: {
        reportId: `dispatch_${settlementDate.replace(/-/g, '_')}_v1`,
        version: 1,
        status: "published",
        title: `📣【AI 派單公告｜5/8 結算 → 5/9 正式派單順序｜AI 比例原則版】`,
        settlementDate: settlementDate,
        dispatchDate: dispatchDate,
        reportDate: "115/05/08",
        auditResult: "PASS",
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        sourceText: `📣【AI 派單公告｜5/8 結算 → 5/9 正式派單順序｜AI 比例原則版】\n\n一、審計結論\n\n審計結果：PASS\n...`,
        audit: {
            result: "PASS",
            rule: "先審計，後排序，再派單",
            platforms: [
                {
                    platformKey: "yixin",
                    platformName: "奕心產品",
                    passed: true,
                    metrics: { 追續單成交: 100, 全部總業績: 1949666, 追續單金額: 1609530, 實收總金額: 905078 }
                },
                {
                    platformKey: "ftv",
                    platformName: "民視產品",
                    passed: true,
                    metrics: { 追續單成交: 26, 全部總業績: 966380, 追續單金額: 159600, 實收總金額: 536830 }
                },
                {
                    platformKey: "company",
                    platformName: "公司產品",
                    passed: true,
                    metrics: { 追續單成交: 9, 全部總業績: 235400, 追續單金額: 232920, 實收總金額: 186960 }
                }
            ],
            notes: ["本輪三平台總表與個別明細加總一致。", "無漏算、無多算、無總盤衝突。", "蘇淑玲（已離職）已不列入正式排名與派單計算。"],
            excludedEmployees: ["蘇淑玲"]
        },
        summaryBoard: {
            追續單成交: 135,
            全部總業績: 3151446,
            追續單金額: 2002050,
            實收總金額: 1628868
        },
        rankings: rawData.map((d, index) => ({
            rank: index + 1,
            name: d.name,
            prevRank: null, // 無法從單次輸入得知，設為 null
            movement: "flat",
            isNew: d.name.includes("新人"),
            group: d.group,
            metrics: {
                正式權重分數: d.score,
                實收: d.cash,
                續單金額: d.followCash,
                總業績: d.total,
                追續客單價: d.avg,
                追續單數: d.count,
                追續金額: d.followCash,
                全部總業績: d.total
            },
            advice: d.advice
        })),
        groups: {
            A1: rawData.filter(d => d.group === "A1").map(d => d.name),
            A2: rawData.filter(d => d.group === "A2").map(d => d.name),
            B: rawData.filter(d => d.group === "B").map(d => d.name),
            C: rawData.filter(d => d.group === "C").map(d => d.name)
        },
        finalConfirmations: [
            "5/8 最新業績已統一為正式版。",
            "三平台總表核對通過。",
            "蘇淑玲（已離職）已移除。",
            "正式名次、分級與公告文字以本資料為準。"
        ]
    },
    meta: {
        operator: "antigravity-optimizer",
        savedAt: new Date().toISOString(),
        reason: "Official 5/8 settlement to 5/9 dispatch update",
        source: "user-request"
    }
};

fs.writeFileSync('c:/Users/DRAGON/Desktop/兆櫃系統/dispatch_app_red/data/latest.json', JSON.stringify(report, null, 2));
console.log('Successfully updated latest.json for 5/8 settlement.');
