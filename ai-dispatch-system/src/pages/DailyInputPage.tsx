import React, { useState } from 'react';
import { useReportStore } from '../data/reportStore';
import type { ReportPlatform, ReportType } from '../types/report';
import { Calendar, Bot, Save, Trash2, FileText, Upload } from 'lucide-react';

const platforms: ReportPlatform[] = ['整合', '奕心', '民視', '公司產品'];
const reportTypes: ReportType[] = ['累積', '單日'];

export const DailyInputPage: React.FC<{ onNavigate: (page: string) => void }> = ({ onNavigate }) => {
  const { inputForm, updateInputForm, parseRawText } = useReportStore();
  const [isParsing, setIsParsing] = useState(false);

  const handleParse = async () => {
    if (!inputForm.rawText.trim()) { alert("請先貼上原始報表資料"); return; }
    setIsParsing(true);
    const success = await parseRawText(inputForm.rawText, inputForm.platform, inputForm.reportType, inputForm.date);
    setIsParsing(false);
    if (success) onNavigate('parse_result');
  };

  return (
    <div className="max-w-5xl mx-auto space-y-6 wx-animate-in">
      <div className="pb-4" style={{ borderBottom: '1px solid var(--color-earth-200)' }}>
        <h1 className="text-3xl font-bold" style={{ color: 'var(--color-water-700)' }}>每日業績輸入窗口</h1>
        <p className="mt-2" style={{ color: 'var(--color-earth-500)' }}>將原始業績日報貼入，由 AI 自動解析、清洗格式、偵測衝突。</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        {/* 左側設定 */}
        <div className="md:col-span-1 space-y-6">
          <div className="wx-card p-6">
            <h3 className="text-lg font-semibold mb-4 flex items-center gap-2" style={{ color: 'var(--color-water-700)' }}>
              <Calendar className="w-5 h-5" style={{ color: 'var(--color-water-500)' }} /> 基本資訊
            </h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1" style={{ color: 'var(--color-earth-600)' }}>日期</label>
                <input type="date" value={inputForm.date} onChange={(e) => updateInputForm({ date: e.target.value })}
                  className="w-full px-3 py-2 rounded-lg outline-none transition-all focus:ring-2"
                  style={{ border: '1px solid var(--color-earth-200)', background: 'var(--color-earth-50)', color: 'var(--color-earth-800)' }} />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1" style={{ color: 'var(--color-earth-600)' }}>系統平台</label>
                <div className="space-y-2">
                  {platforms.map(p => (
                    <label key={p} className="flex items-center gap-2 p-2 rounded-lg cursor-pointer transition-all"
                      style={{ border: inputForm.platform === p ? '1px solid var(--color-water-400)' : '1px solid transparent',
                               background: inputForm.platform === p ? 'var(--color-water-50)' : 'transparent' }}>
                      <input type="radio" name="platform" value={p} checked={inputForm.platform === p}
                        onChange={() => updateInputForm({ platform: p })} className="w-4 h-4" />
                      <span className="text-sm font-medium">{p}</span>
                    </label>
                  ))}
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1" style={{ color: 'var(--color-earth-600)' }}>報表類型</label>
                <div className="flex p-1 rounded-lg" style={{ background: 'var(--color-earth-100)' }}>
                  {reportTypes.map(t => (
                    <button key={t} onClick={() => updateInputForm({ reportType: t })}
                      className="flex-1 py-1.5 text-sm font-medium rounded-md transition-all"
                      style={inputForm.reportType === t
                        ? { background: 'white', color: 'var(--color-water-600)', boxShadow: '0 1px 2px rgba(0,0,0,0.05)' }
                        : { color: 'var(--color-earth-500)' }}>
                      {t}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>

          <div className="p-5 rounded-2xl" style={{ background: 'var(--color-water-50)', border: '1px solid var(--color-water-200)' }}>
            <h4 className="flex items-center gap-2 font-medium mb-2" style={{ color: 'var(--color-water-700)' }}>
              <Bot className="w-5 h-5" /> AI 解析提示
            </h4>
            <ul className="text-sm space-y-2 list-disc list-inside" style={{ color: 'var(--color-water-600)' }}>
              <li>只貼原始日報，不貼公告文</li>
              <li>A 級格式錯誤自動修正</li>
              <li>金額不一致只提示、不亂改</li>
            </ul>
          </div>
        </div>

        {/* 右側輸入 */}
        <div className="md:col-span-3">
          <div className="wx-card flex flex-col h-full overflow-hidden" style={{ minHeight: 500 }}>
            <div className="wx-card-header flex justify-between items-center group">
              <div className="flex items-center gap-2 font-medium" style={{ color: 'var(--color-earth-700)' }}>
                <FileText className="w-5 h-5" /> 原始資料輸入
              </div>
              <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                <button onClick={() => updateInputForm({rawText: ''})} className="p-1.5 rounded-md transition-colors" style={{ color: 'var(--color-fire-500)' }} title="清空">
                  <Trash2 className="w-4 h-4" />
                </button>
                <button className="p-1.5 rounded-md transition-colors" style={{ color: 'var(--color-earth-500)' }} title="載入範例"
                  onClick={() => updateInputForm({rawText: `1、李玲玲｜【追單】10｜【續單】334,810｜【總業績】421,610｜【實收】421,610\n2、王珍珠｜【追單】19｜【續單】264,230｜【總業績】360,930｜【實收】360,930\n3、王梅慧｜【追單】12｜【續單】245,640｜【總業績】318,320｜【實收】318,320\n4、馬秋香｜【追單】14｜【續單】245,300｜【總業績】291,700｜【實收】291,700\n5、林沛昕｜【追單】6｜【續單】163,170｜【總業績】268,590｜【實收】268,590\n6、林宜靜｜【追單】9｜【續單】141,040｜【總業績】188,800｜【實收】188,800\n7、廖姿惠｜【追單】9｜【續單】76,160｜【總業績】182,380｜【實收】182,380\n8、湯玉琦｜【追單】10｜【續單】40,030｜【總業績】140,010｜【實收】140,010\n9、徐華妤｜【追單】5｜【續單】82,180｜【總業績】135,700｜【實收】135,700\n10、高如郁｜【追單】6｜【續單】57,010｜【總業績】129,258｜【實收】129,258`})}>
                  <Upload className="w-4 h-4" />
                </button>
              </div>
            </div>
            <textarea
              className="flex-1 w-full p-6 bg-transparent border-none outline-none resize-none min-h-[400px] font-mono text-sm leading-relaxed"
              style={{ color: 'var(--color-earth-800)' }}
              placeholder={`請將原始的業績日報直接貼在這裡...\n\n格式範例：\n1、李玲玲｜【追單】10｜【續單】334,810｜【總業績】421,610｜【實收】421,610\n2、王珍珠｜【追單】19｜【續單】264,230｜【總業績】360,930｜【實收】360,930\n...`}
              value={inputForm.rawText}
              onChange={(e) => updateInputForm({ rawText: e.target.value })}
            />
            <div className="p-4 flex justify-between items-center" style={{ borderTop: '1px solid var(--color-earth-100)', background: 'var(--color-earth-50)' }}>
              <button className="flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-lg transition-colors shadow-sm"
                style={{ color: 'var(--color-earth-600)', background: 'white', border: '1px solid var(--color-earth-200)' }}>
                <Save className="w-4 h-4" /> 存成草稿
              </button>
              <button onClick={handleParse} disabled={isParsing || !inputForm.rawText.trim()}
                className="wx-btn wx-btn-water disabled:opacity-50 disabled:cursor-not-allowed">
                {isParsing ? (
                  <><svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>AI 解析中...</>
                ) : (
                  <><Bot className="w-5 h-5" /> 系統 AI 解析</>
                )}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
