import React, { useState } from 'react';
import { Language } from '../types';
import { ChevronLeft, Upload, FileText, Beaker, FileCheck2, Share2, Download, CheckCircle2, AlertTriangle, AlertOctagon, ArrowRight, BookOpen, Microscope, ShieldAlert, FileWarning, FolderOpen, ListChecks, Building2, Clock, CheckCircle } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { EgretLogo } from './EgretLogo';

interface Props {
  language: Language;
  onNavigate: (page: any) => void;
}

type Step = 'input' | 'analyzing' | 'result' | 'remediation' | 'report';

export const IngredientCheckApp: React.FC<Props> = ({ language, onNavigate }) => {
  const [currentStep, setCurrentStep] = useState<Step>('input');
  const [isGeneratingReport, setIsGeneratingReport] = useState(false);
  const [reportData, setReportData] = useState<any>(null);

  const t = {
    back: language === 'zh' ? '返回检测大厅' : 'Back to Dashboard',
    title: language === 'zh' ? '成分检测服务' : 'Ingredient Compliance Check',
    subtitle: language === 'zh' ? '识别商品成分风险，检测标签、原料与目标市场合规问题' : 'Analyze product ingredients and detect compliance risks.',
    startCheck: language === 'zh' ? '开始检测' : 'Start Check',
    analyzing: language === 'zh' ? '正在进行合规风险检测...' : 'Analyzing compliance risks...',
    
    // Result
    resultTitle: language === 'zh' ? '合规检测结果' : 'Compliance Check Result',
    riskLevel: language === 'zh' ? '中高风险' : 'Medium-High Risk',
    riskSub: language === 'zh' ? '建议优先处理高风险项，避免影响清关与销售。' : 'Please address high-risk items first to avoid customs issues.',
    regulationsTitle: language === 'zh' ? '可能涉及的马来西亚法规/规范' : 'Regulatory References',
    
    // Actions
    downloadReport: language === 'zh' ? '下载报告' : 'Download Report',
    generateRemediation: language === 'zh' ? '生成整改清单' : 'Generate Remediation List',
    viewRemediation: language === 'zh' ? '查看整改建议' : 'View Remediation Plan',
  };

  const mockReport = {
    productName: language === 'zh' ? '棉花糖' : 'Marshmallow',
    category: language === 'zh' ? '食品糖果类' : 'Food - Confectionery',
    market: language === 'zh' ? '马来西亚' : 'Malaysia',
    reportNo: 'SGC-20240515-00078',
    date: new Date().toLocaleDateString(),
    riskLevel: language === 'zh' ? '中高风险' : 'Medium-High Risk',
    triggeredRules: language === 'zh' ? [
      '配料中检测到“牛明胶”',
      '标签缺少马来语关键信息',
      '添加剂说明不完整'
    ] : [
      'Bovine gelatin detected in ingredients',
      'Label missing key Malay information',
      'Incomplete additive information'
    ],
    suggestions: language === 'zh' ? [
      '补充马来语标签',
      '明确动物源成分说明',
      '完善包装信息后复检'
    ] : [
      'Add Malay label',
      'Clarify animal-derived ingredients',
      'Recheck after completing packaging info'
    ],
    regulations: language === 'zh' ? [
      {
        act: 'Food Act 1983 (Act 281)',
        desc: '用于食品监管整体框架，确保食品安全。'
      },
      {
        act: 'Food Regulations 1985',
        desc: '用于标签完整性、配料表说明、成分标示规范的复核。'
      },
      {
        act: 'Trade Descriptions Act 2011',
        desc: '用于复核商品描述与标签表述的准确性，避免误导。'
      },
      {
        act: 'Trade Descriptions (Certification and Marking of Halal) Order 2011',
        desc: '用于清真声称、动物源成分、清真认证表达等重点审查。'
      }
    ] : [
      {
        act: 'Food Act 1983 (Act 281)',
        desc: 'Overall framework for food safety regulation.'
      },
      {
        act: 'Food Regulations 1985',
        desc: 'For checking label completeness and ingredient specifications.'
      },
      {
        act: 'Trade Descriptions Act 2011',
        desc: 'For ensuring accuracy of product descriptions and preventing misleading claims.'
      },
      {
        act: 'Trade Descriptions (Certification and Marking of Halal) Order 2011',
        desc: 'For verifying Halal claims and animal-derived ingredients.'
      }
    ]
  };

  const handleStartCheck = () => {
    setCurrentStep('analyzing');
    setTimeout(() => {
      setCurrentStep('result');
      setReportData(mockReport);
    }, 2000);
  };

  const handleGenerateReport = async () => {
    setIsGeneratingReport(true);
    
    try {
        const res = await fetch('/api/ingredient-check/report', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
               productName: mockReport.productName,
               category: mockReport.category,
               market: mockReport.market,
               ingredients: language === 'zh' ? '白砂糖，葡萄糖浆，牛明胶，淀粉，食品添加剂（柠檬酸，食用香精，诱惑红）' : 'Sugar, Glucose Syrup, Bovine Gelatin, Starch, Additives'
            })
        });
        
        if (res.ok) {
            const data = await res.json();
            const adaptedData = {
               productName: data.productInfo?.name || mockReport.productName,
               category: data.productInfo?.category || mockReport.category,
               market: data.productInfo?.market || mockReport.market,
               reportNo: data.reportNo || mockReport.reportNo,
               date: data.generatedAt || mockReport.date,
               riskLevel: data.riskLevel || mockReport.riskLevel,
               triggeredRules: data.triggeredRules || mockReport.triggeredRules,
               suggestions: data.rectificationSuggestions || mockReport.suggestions,
               regulations: data.regulations || mockReport.regulations,
               summary: data.summary,
               requiredMaterials: data.requiredMaterials,
               localResources: data.localResources,
               disclaimer: data.disclaimer
            };
            setReportData(adaptedData);
            setCurrentStep('report');
            setIsGeneratingReport(false);
            return;
        }
    } catch (e) {
        console.error("AI Report generation failed, using mock data", e);
    }
    
    // Simulate AI generation fallback
    setTimeout(() => {
      setIsGeneratingReport(false);
      setReportData(mockReport);
      setCurrentStep('report');
    }, 1500);
  };

  const renderInput = () => (
    <div className="w-full max-w-4xl mx-auto flex flex-col items-center animate-[fadeIn_0.5s_ease-out]">
      <div className="text-center mb-12">
        <div className="w-20 h-20 bg-orange-500/20 text-orange-400 rounded-2xl flex items-center justify-center mx-auto mb-6 backdrop-blur-sm border border-orange-500/30">
          <Microscope size={40} />
        </div>
        <h1 className="text-4xl font-light mb-4 text-white">{t.title}</h1>
        <p className="text-gray-400 text-lg">{t.subtitle}</p>
      </div>

      <div className="w-full bg-[#111122]/80 backdrop-blur-xl border border-white/10 rounded-2xl p-8 mb-8">
       <div className="mb-6">
         <label className="block text-gray-300 mb-2">{language === 'zh' ? '商品名称' : 'Product Name'}</label>
         <input type="text" defaultValue={mockReport.productName} className="w-full bg-[#1a1a2e] border border-white/10 rounded-xl px-4 py-3 text-white focus:border-orange-500/50 outline-none transition-colors" />
       </div>
       <div className="grid grid-cols-2 gap-6 mb-6">
          <div>
            <label className="block text-gray-300 mb-2">{language === 'zh' ? '商品分类' : 'Category'}</label>
            <input type="text" defaultValue={mockReport.category} className="w-full bg-[#1a1a2e] border border-white/10 rounded-xl px-4 py-3 text-white outline-none" />
          </div>
          <div>
            <label className="block text-gray-300 mb-2">{language === 'zh' ? '目标市场' : 'Target Market'}</label>
            <select className="w-full bg-[#1a1a2e] border border-white/10 rounded-xl px-4 py-3 text-white outline-none">
              <option value="malaysia">{language === 'zh' ? '马来西亚' : 'Malaysia'}</option>
              <option value="indonesia">{language === 'zh' ? '印度尼西亚' : 'Indonesia'}</option>
              <option value="thailand">{language === 'zh' ? '泰国' : 'Thailand'}</option>
            </select>
          </div>
       </div>
       <div className="mb-8">
         <label className="block text-gray-300 mb-2">{language === 'zh' ? '成分表/配料信息' : 'Ingredients List'}</label>
         <textarea rows={4} defaultValue={language === 'zh' ? '白砂糖，葡萄糖浆，牛明胶，淀粉，食品添加剂（柠檬酸，食用香精，诱惑红）' : 'Sugar, Glucose Syrup, Bovine Gelatin, Starch, Additives'} className="w-full bg-[#1a1a2e] border border-white/10 rounded-xl px-4 py-3 text-white focus:border-orange-500/50 outline-none transition-colors" />
       </div>
       <button onClick={handleStartCheck} className="w-full bg-gradient-to-r from-orange-600 to-red-600 text-white font-medium py-4 rounded-xl hover:shadow-lg hover:shadow-orange-500/25 transition-all flex items-center justify-center space-x-2">
            <Beaker size={20} />
            <span>{t.startCheck}</span>
         </button>
      </div>
    </div>
  );

  const renderAnalyzing = () => (
    <div className="w-full max-w-xl mx-auto flex flex-col items-center justify-center min-h-[50vh] animate-[fadeIn_0.5s_ease-out]">
      <div className="w-24 h-24 mb-8 relative">
        <div className="absolute inset-0 border-4 border-orange-500/20 rounded-full"></div>
        <div className="absolute inset-0 border-4 border-orange-500 border-t-transparent rounded-full animate-spin"></div>
        <div className="absolute inset-0 flex items-center justify-center text-orange-500">
           <Beaker size={32} className="animate-pulse" />
        </div>
      </div>
      <h2 className="text-2xl font-light text-white">{t.analyzing}</h2>
    </div>
  );

  const renderResult = () => (
    <div className="w-full max-w-6xl mx-auto animate-[fadeIn_0.5s_ease-out]">
      {/* Header Info */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 border-b border-white/10 pb-6">
         <div>
            <h1 className="text-3xl font-light text-white mb-2">{mockReport.productName} - {t.resultTitle}</h1>
            <div className="flex items-center space-x-4 text-sm text-gray-400">
              <span className="flex items-center"><BookOpen size={14} className="mr-1"/> {mockReport.category}</span>
              <span>|</span>
              <span className="flex items-center"><Share2 size={14} className="mr-1"/> {mockReport.market}</span>
              <span>|</span>
              <span>{language === 'zh' ? '检测编号' : 'Report No'}: {mockReport.reportNo}</span>
              <span>|</span>
              <span>{mockReport.date}</span>
            </div>
         </div>
         <div className="mt-4 md:mt-0 flex space-x-3">
            <button onClick={handleGenerateReport} className="px-5 py-2.5 bg-[#1a1a2e] border border-white/10 hover:border-white/30 text-white rounded-lg transition-colors flex items-center">
              <Download size={16} className="mr-2" />
              {t.downloadReport}
            </button>
            <button onClick={() => setCurrentStep('remediation')} className="px-5 py-2.5 bg-orange-600 hover:bg-orange-500 text-white rounded-lg transition-colors flex items-center">
              <FileCheck2 size={16} className="mr-2" />
              {t.generateRemediation}
            </button>
         </div>
      </div>

      {/* Main Content */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
         <div className="lg:col-span-2 space-y-6">
            {/* Risk Banner */}
            <div className="bg-gradient-to-r from-orange-950/80 to-red-950/60 border-l-4 border-orange-500 rounded-r-xl p-6 flex items-start space-x-4 shadow-lg shadow-orange-900/10">
               <div className="mt-1 text-orange-400"><ShieldAlert size={32} /></div>
               <div>
                 <h2 className="text-2xl font-bold text-orange-400 mb-1">{language === 'zh' ? '风险等级：' : 'Risk Level: '}{t.riskLevel}</h2>
                 <p className="text-orange-200/80">{t.riskSub}</p>
               </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
               {/* Categories */}
               <div className="bg-[#1a1a2e]/60 border border-white/5 rounded-2xl p-6">
                  <h3 className="text-lg font-medium text-white mb-4 flex items-center"><FileWarning size={18} className="mr-2 text-gray-400" />{language === 'zh' ? '风险类别' : 'Risk Categories'}</h3>
                  <div className="space-y-3">
                    <div className="flex justify-between items-center bg-[#111122]/80 p-3 rounded-lg border border-white/5">
                      <span className="text-gray-300 text-sm">{language === 'zh' ? '清真成分风险' : 'Halal Ingredient Risk'}</span>
                      <span className="text-xs bg-red-500/20 text-red-400 px-2 py-1 rounded font-medium">{language === 'zh' ? '高风险' : 'High'}</span>
                    </div>
                    <div className="flex justify-between items-center bg-[#111122]/80 p-3 rounded-lg border border-white/5">
                      <span className="text-gray-300 text-sm">{language === 'zh' ? '标签合规风险' : 'Label Compliance Risk'}</span>
                      <span className="text-xs bg-orange-500/20 text-orange-400 px-2 py-1 rounded font-medium">{language === 'zh' ? '中高风险' : 'Med-High'}</span>
                    </div>
                    <div className="flex justify-between items-center bg-[#111122]/80 p-3 rounded-lg border border-white/5">
                      <span className="text-gray-300 text-sm">{language === 'zh' ? '材料待补充' : 'Missing Materials'}</span>
                      <span className="text-xs bg-yellow-500/20 text-yellow-400 px-2 py-1 rounded font-medium">{language === 'zh' ? '中风险' : 'Medium'}</span>
                    </div>
                  </div>
               </div>

               {/* Triggered Rules */}
               <div className="bg-[#1a1a2e]/60 border border-white/5 rounded-2xl p-6">
                  <h3 className="text-lg font-medium text-white mb-4 flex items-center"><AlertTriangle size={18} className="mr-2 text-gray-400" />{language === 'zh' ? '触发规则' : 'Triggered Rules'}</h3>
                  <ul className="space-y-3">
                    {mockReport.triggeredRules.map((rule, idx) => (
                       <li key={idx} className="flex items-start text-gray-300 text-sm bg-[#111122]/50 p-3 rounded-lg border border-white/5">
                         <span className="text-orange-500 mr-2 mt-0.5">•</span>
                         {rule}
                       </li>
                    ))}
                  </ul>
               </div>
            </div>

            {/* System Judgement */}
            <div className="bg-[#1a1a2e]/60 border border-white/5 rounded-2xl p-6">
                <h3 className="text-lg font-medium text-white mb-3 flex items-center"><Microscope size={18} className="mr-2 text-blue-400" />{language === 'zh' ? '系统判断' : 'System Judgement'}</h3>
                <p className="text-gray-300 leading-relaxed text-sm">
                  {language === 'zh' 
                    ? '当前不建议直接上架。系统检测到高风险的清真合规问题以及标签缺失。建议先补充动物源成分的证明材料，并完成马来语标签的修订，以符合当地市场法规。'
                    : 'Not recommended for immediate listing. High-risk halal compliance issues and missing labels detected. Please provide proof of animal-derived ingredients and revise the Malay label.'}
                </p>
            </div>
            
            {/* Regulatory References */}
            <div className="bg-[#1a1a2e]/60 border border-white/5 rounded-2xl p-6">
                <h3 className="text-lg font-medium text-white mb-4 flex items-center"><BookOpen size={18} className="mr-2 text-indigo-400" />{t.regulationsTitle}</h3>
                <div className="space-y-3">
                    {mockReport.regulations.map((reg, idx) => (
                       <div key={idx} className="bg-[#111122]/50 p-4 rounded-lg border border-white/5 flex flex-col space-y-1">
                          <span className="text-indigo-300 font-medium text-sm">{reg.act}</span>
                          <span className="text-gray-400 text-xs">{reg.desc}</span>
                       </div>
                    ))}
                </div>
            </div>
         </div>

         <div className="space-y-6">
             {/* Right side product card */}
             <div className="bg-[#1a1a2e]/80 border border-white/10 rounded-2xl p-6">
                 <div className="aspect-video bg-[#111122] rounded-xl flex items-center justify-center mb-6 border border-white/5">
                    <FileText size={48} className="text-gray-600" />
                 </div>
                 <h4 className="text-white font-medium text-xl mb-4">{mockReport.productName}</h4>
                 <div className="space-y-3 text-sm text-gray-400">
                    <div className="flex justify-between py-1 border-b border-white/5"><span className="opacity-70">Brand</span><span className="text-gray-200">SailGuard Example</span></div>
                    <div className="flex justify-between py-1 border-b border-white/5"><span className="opacity-70">Category</span><span className="text-gray-200">{mockReport.category}</span></div>
                    <div className="flex justify-between py-1 border-b border-white/5"><span className="opacity-70">Target</span><span className="text-gray-200">{mockReport.market}</span></div>
                    <div className="flex justify-between py-1"><span className="opacity-70">HS Code</span><span className="text-gray-200">170490</span></div>
                 </div>
             </div>

             {/* Next Steps */}
             <div className="bg-[#1a1a2e]/60 border border-white/5 rounded-2xl p-6">
                 <h3 className="text-lg font-medium text-white mb-4">{language === 'zh' ? '下一步操作' : 'Next Steps'}</h3>
                 <div className="space-y-3">
                    <button onClick={() => setCurrentStep('remediation')} className="w-full flex items-center justify-between p-3.5 rounded-xl border border-white/10 bg-white/5 hover:bg-white/10 transition-colors text-sm text-gray-200 group">
                      <span className="flex items-center"><FolderOpen size={16} className="mr-2 text-gray-400" />{language === 'zh' ? '补充材料' : 'Provide Materials'}</span>
                      <ArrowRight size={14} className="text-gray-500 group-hover:text-white transition-colors" />
                    </button>
                    <button onClick={() => setCurrentStep('remediation')} className="w-full flex items-center justify-between p-3.5 rounded-xl border border-white/10 bg-white/5 hover:bg-white/10 transition-colors text-sm text-gray-200 group">
                      <span className="flex items-center"><ListChecks size={16} className="mr-2 text-gray-400" />{language === 'zh' ? '修改标签' : 'Revise Label'}</span>
                      <ArrowRight size={14} className="text-gray-500 group-hover:text-white transition-colors" />
                    </button>
                 </div>
             </div>
         </div>
      </div>
    </div>
  );

  const renderRemediation = () => (
    <div className="w-full max-w-6xl mx-auto animate-[fadeIn_0.5s_ease-out]">
       <div className="text-center mb-10">
          <h1 className="text-3xl font-light text-white mb-4">{language === 'zh' ? '整改建议与资源匹配' : 'Rectification Plan & Resource Matching'}</h1>
          <div className="inline-flex items-center space-x-2 bg-orange-950/40 text-orange-400 px-4 py-2 rounded-full border border-orange-500/20 text-sm">
             <AlertTriangle size={16} />
             <span>{language === 'zh' ? '检测结果：中高风险 | 建议先整改后上架' : 'Result: Medium-High Risk | Remediation required before listing'}</span>
          </div>
       </div>

       <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
          {/* Card 1 */}
          <div className="bg-[#111122]/60 border border-white/10 rounded-2xl flex flex-col h-full overflow-hidden">
             <div className="bg-white/5 p-4 border-b border-white/5">
                <h3 className="font-medium text-white flex items-center"><CheckCircle2 size={18} className="mr-2 text-green-400" /> {language === 'zh' ? '必做整改项' : 'Required Actions'}</h3>
             </div>
             <div className="p-5 flex-1">
                <ul className="space-y-4">
                  {mockReport.suggestions.map((s, i) => (
                    <li key={i} className="flex justify-between items-start text-sm border-b border-white/5 pb-3 last:border-0 last:pb-0">
                       <span className="text-gray-300">{s}</span>
                       <span className="text-xs text-orange-400 bg-orange-400/10 px-1.5 py-0.5 rounded ml-2 whitespace-nowrap">{i === 0 ? 'High' : 'Med'}</span>
                    </li>
                  ))}
                </ul>
             </div>
             <div className="p-4 bg-black/40 text-xs text-gray-500 border-t border-white/5">
                {language === 'zh' ? '请优先完成所有高风险项，降低违规风险' : 'Complete high-risk items first'}
             </div>
          </div>

          {/* Card 2 */}
          <div className="bg-[#111122]/60 border border-white/10 rounded-2xl flex flex-col h-full overflow-hidden">
             <div className="bg-white/5 p-4 border-b border-white/5">
                <h3 className="font-medium text-white flex items-center"><FileText size={18} className="mr-2 text-blue-400" /> {language === 'zh' ? '待补充材料' : 'Missing Materials'}</h3>
             </div>
             <div className="p-5 flex-1">
                <ul className="space-y-3">
                  {[
                    language === 'zh' ? '供应商说明' : 'Supplier Declaration',
                    language === 'zh' ? '清真相关证明' : 'Halal Certificate',
                    language === 'zh' ? '包装图完整版' : 'Full Packaging Image',
                    language === 'zh' ? '成分/添加剂说明' : 'Additives Breakdown'
                  ].map((s, i) => (
                    <li key={i} className="flex justify-between items-center p-3 bg-white/5 rounded-lg text-sm text-gray-300 hover:bg-white/10 transition-colors cursor-pointer border border-transparent hover:border-white/10">
                       <span>{s}</span>
                       <ArrowRight size={14} className="text-gray-500" />
                    </li>
                  ))}
                </ul>
             </div>
          </div>

          {/* Card 3 */}
          <div className="bg-[#111122]/60 border border-white/10 rounded-2xl flex flex-col h-full overflow-hidden">
             <div className="bg-white/5 p-4 border-b border-white/5">
                <h3 className="font-medium text-white flex items-center"><Share2 size={18} className="mr-2 text-purple-400" /> {language === 'zh' ? '本地认证/检测资源' : 'Local Resources'}</h3>
             </div>
             <div className="p-5 flex-1 space-y-4">
                {[
                  { n: language === 'zh' ? '清真认证咨询' : 'Halal Consulting', d: 'JAKIM standards expert' },
                  { n: language === 'zh' ? '标签合规审核' : 'Label Audit', d: 'Malay translation & compliance' },
                ].map((r, i) => (
                  <div key={i} className="border border-white/10 p-3 rounded-lg">
                     <div className="flex justify-between items-start mb-1">
                        <h4 className="text-sm font-medium text-gray-200">{r.n}</h4>
                     </div>
                     <p className="text-xs text-gray-500 mb-3">{r.d}</p>
                     <button className="text-xs text-orange-400 hover:text-orange-300 border border-orange-500/30 px-3 py-1 rounded bg-orange-500/10 w-full transition-colors">{language === 'zh' ? '联系机构' : 'Contact'}</button>
                  </div>
                ))}
             </div>
          </div>
       </div>

       {/* Bottom Actions & Flow */}
       <div className="flex flex-col md:flex-row justify-between items-center bg-black/40 border border-white/10 rounded-2xl p-6">
          <div className="flex items-center space-x-4 w-full md:w-auto mb-6 md:mb-0 overflow-x-auto pb-2 md:pb-0 text-sm">
             <div className="flex items-center text-orange-400 font-medium whitespace-nowrap"><span className="w-6 h-6 rounded-full bg-orange-500/20 flex items-center justify-center mr-2 border border-orange-500/30">1</span> {language === 'zh' ? '提交整改材料' : 'Submit'}</div>
             <div className="w-8 h-px bg-white/20"></div>
             <div className="flex items-center text-gray-400 whitespace-nowrap"><span className="w-6 h-6 rounded-full bg-white/10 flex items-center justify-center mr-2">2</span> {language === 'zh' ? '系统复核' : 'Review'}</div>
             <div className="w-8 h-px bg-white/20"></div>
             <div className="flex items-center text-gray-400 whitespace-nowrap"><span className="w-6 h-6 rounded-full bg-white/10 flex items-center justify-center mr-2">3</span> {language === 'zh' ? '风险复评' : 'Re-assess'}</div>
             <div className="w-8 h-px bg-white/20"></div>
             <div className="flex items-center text-gray-400 whitespace-nowrap"><span className="w-6 h-6 rounded-full bg-white/10 flex items-center justify-center mr-2">4</span> {language === 'zh' ? '上架建议' : 'Listing'}</div>
          </div>
          <div className="flex items-center space-x-4 w-full md:w-auto justify-end">
             <span className="text-sm text-gray-500 mr-2">{language === 'zh' ? '预计周期：3-5工作日' : 'Est. Time: 3-5 days'}</span>
             <button onClick={handleGenerateReport} className="px-6 py-3 bg-orange-600 hover:bg-orange-500 text-white rounded-xl transition-colors font-medium">
               {language === 'zh' ? '生成合规报告' : 'Generate Report'}
             </button>
          </div>
       </div>
    </div>
  );

  const renderReport = () => {
    const data = reportData || mockReport;
    return (
    <div className="w-full max-w-6xl mx-auto animate-[fadeIn_0.5s_ease-out] flex flex-col lg:flex-row gap-6">
       {/* Left Sidebar */}
       <div className="w-full lg:w-72 flex-shrink-0 space-y-6">
          <div className="bg-[#1a1a2e]/60 border border-white/10 rounded-2xl p-6">
             <h3 className="text-sm font-medium text-gray-400 mb-5 uppercase tracking-wider">{language === 'zh' ? '报告信息' : 'Report Info'}</h3>
             <div className="space-y-4 text-sm">
                <div>
                   <div className="text-gray-500 text-xs mb-1">Status</div>
                   <div className="text-green-400 flex items-center font-medium"><CheckCircle2 size={14} className="mr-1.5"/> {language === 'zh' ? '已生成' : 'Generated'}</div>
                </div>
                <div>
                   <div className="text-gray-500 text-xs mb-1">Report No.</div>
                   <div className="text-gray-200 font-mono bg-white/5 px-2 py-1 rounded mt-1">{data.reportNo}</div>
                </div>
                <div>
                   <div className="text-gray-500 text-xs mb-1">Generated At</div>
                   <div className="text-gray-200">{data.date}</div>
                </div>
                <div>
                   <div className="text-gray-500 text-xs mb-1">Tool</div>
                   <div className="text-gray-200 flex items-center"><EgretLogo size={16} className="mr-1 text-white"/> SailGuard AI</div>
                </div>
             </div>
          </div>
          
          <div className="bg-[#1a1a2e]/60 border border-white/10 rounded-2xl p-6">
             <h3 className="text-sm font-medium text-gray-400 mb-5 uppercase tracking-wider">{language === 'zh' ? '产品信息' : 'Product Info'}</h3>
             <div className="space-y-4 text-sm">
                <div>
                   <div className="text-gray-500 text-xs mb-1">Name</div>
                   <div className="text-gray-200">{data.productName}</div>
                </div>
                <div>
                   <div className="text-gray-500 text-xs mb-1">Market</div>
                   <div className="text-gray-200">{data.market}</div>
                </div>
                <div>
                   <div className="text-gray-500 text-xs mb-1">Risk Level</div>
                   <div className="text-orange-400 font-medium">{data.riskLevel}</div>
                </div>
             </div>
          </div>
       </div>

       {/* Middle PDF View */}
       <div className="flex-1 bg-white rounded-lg shadow-2xl overflow-hidden flex flex-col min-h-[850px] relative">
          <div className="bg-gray-100 border-b border-gray-200 p-3 flex justify-between items-center text-gray-600 text-sm">
             <div className="font-medium text-gray-700">{data.productName}_Compliance_Report.pdf</div>
             <div className="flex space-x-4">
                <span>Page 1 / 1</span>
                <span>100%</span>
             </div>
          </div>
          <div className="flex-1 p-10 md:p-16 overflow-y-auto text-gray-800 bg-white relative" style={{ fontFamily: 'serif' }}>
             {/* Report Header Branding */}
             <div className="flex justify-between items-start border-b-2 border-gray-800 pb-8 mb-8">
                <div className="flex items-center space-x-3">
                   <div className="w-12 h-12 bg-gray-900 rounded-lg flex items-center justify-center">
                      <EgretLogo size={28} className="text-white" />
                   </div>
                   <div>
                      <h2 className="text-xl font-bold tracking-tight text-gray-900">SailGuard AI</h2>
                      <p className="text-xs text-gray-500 uppercase tracking-widest">Ingredient Check</p>
                   </div>
                </div>
                <div className="text-right text-sm">
                   <p className="text-gray-500">Ref: {data.reportNo}</p>
                   <p className="text-gray-500">{data.date}</p>
                </div>
             </div>
             
             <h1 className="text-3xl font-bold text-center mb-10 text-gray-900">
                {language === 'zh' ? `【${data.market}】商品成分合规检测报告` : `${data.market} Product Ingredient Compliance Report`}
             </h1>
             
             {data.summary && (
                <div className="mb-10 text-sm leading-relaxed text-gray-700 bg-orange-50/50 p-6 rounded-r-lg border-l-4 border-orange-500">
                    <p className="font-bold mb-2 flex items-center"><ShieldAlert size={16} className="mr-2 text-orange-600"/> Executive Summary:</p>
                    <p>{data.summary}</p>
                </div>
             )}

             <div className="mb-10">
                <h2 className="text-lg font-bold mb-4 border-b border-gray-200 pb-2 flex items-center text-gray-800">
                   <FileText size={20} className="mr-2 text-gray-500"/>
                   {language === 'zh' ? '1. 产品基本信息' : '1. Product Information'}
                </h2>
                <table className="w-full border-collapse border border-gray-300 text-sm">
                   <tbody>
                      <tr>
                        <td className="border border-gray-300 p-3 font-bold bg-gray-50 w-1/4">Product Name</td>
                        <td className="border border-gray-300 p-3">{data.productName}</td>
                        <td className="border border-gray-300 p-3 font-bold bg-gray-50 w-1/4">Category</td>
                        <td className="border border-gray-300 p-3">{data.category}</td>
                      </tr>
                      <tr>
                        <td className="border border-gray-300 p-3 font-bold bg-gray-50">Target Market</td>
                        <td className="border border-gray-300 p-3">{data.market}</td>
                        <td className="border border-gray-300 p-3 font-bold bg-gray-50">Overall Risk</td>
                        <td className="border border-gray-300 p-3 text-red-600 font-bold">{data.riskLevel}</td>
                      </tr>
                   </tbody>
                </table>
             </div>

             <div className="mb-10">
                <h2 className="text-lg font-bold mb-4 border-b border-gray-200 pb-2 flex items-center text-gray-800">
                   <FileWarning size={20} className="mr-2 text-orange-500"/>
                   {language === 'zh' ? '2. 风险与触发规则' : '2. Risks & Triggered Rules'}
                </h2>
                <ul className="space-y-3 text-sm">
                   {data.triggeredRules.map((r: string, i: number) => (
                      <li key={i} className="flex items-start">
                         <span className="text-orange-500 mr-2 mt-0.5">•</span>
                         <span>{r}</span>
                      </li>
                   ))}
                </ul>
             </div>

             <div className="mb-10">
                <h2 className="text-lg font-bold mb-4 border-b border-gray-200 pb-2 flex items-center text-gray-800">
                   <ListChecks size={20} className="mr-2 text-blue-500"/>
                   {language === 'zh' ? '3. 整改建议与补充材料' : '3. Rectification & Materials'}
                </h2>
                <div className="space-y-4 text-sm">
                   <div>
                      <h4 className="font-bold text-gray-700 mb-2">{language === 'zh' ? '修改建议：' : 'Suggestions:'}</h4>
                      <ul className="list-disc pl-5 space-y-1 text-gray-600">
                         {data.suggestions.map((r: string, i: number) => <li key={i}>{r}</li>)}
                      </ul>
                   </div>
                   <div className="bg-gray-50 p-4 rounded border border-gray-200">
                      <h4 className="font-bold text-gray-700 mb-2 flex items-center"><FolderOpen size={16} className="mr-1.5 text-gray-500"/> {language === 'zh' ? '需补充材料：' : 'Required Materials:'}</h4>
                      <ul className="list-none space-y-1 text-orange-700">
                         {data.requiredMaterials?.map((m: string, i: number) => <li key={`mat-${i}`} className="flex items-center"><CheckCircle size={14} className="mr-1.5 opacity-70"/> {m}</li>) ||
                          <li className="flex items-center"><CheckCircle size={14} className="mr-1.5 opacity-70"/> {language === 'zh' ? '供应商声明与清真认证证明' : 'Supplier declaration and halal certificate'}</li>
                         }
                      </ul>
                   </div>
                </div>
             </div>
             
             {data.regulations && data.regulations.length > 0 && (
                <div className="mb-10">
                   <h2 className="text-lg font-bold mb-4 border-b border-gray-200 pb-2 flex items-center text-gray-800">
                      <BookOpen size={20} className="mr-2 text-indigo-500"/>
                      {t.regulationsTitle}
                   </h2>
                   <div className="space-y-4 text-sm">
                      {data.regulations.map((reg: any, i: number) => (
                         <div key={i} className="pl-3 border-l-2 border-indigo-200">
                            <h4 className="font-bold text-gray-800">{reg.act}</h4>
                            <p className="text-gray-600 mt-1">{reg.desc}</p>
                         </div>
                      ))}
                   </div>
                </div>
             )}

             {data.localResources && data.localResources.length > 0 && (
               <div className="mb-10">
                  <h2 className="text-lg font-bold mb-4 border-b border-gray-200 pb-2 flex items-center text-gray-800">
                     <Building2 size={20} className="mr-2 text-emerald-500"/>
                     {language === 'zh' ? '5. 推荐本地资源' : '5. Local Resources'}
                  </h2>
                  <ul className="space-y-2 text-sm">
                     {data.localResources.map((r: any, i: number) => (
                        <li key={i} className="flex items-start">
                           <span className="text-emerald-500 mr-2 mt-0.5">•</span>
                           <span><strong>{r.name}</strong>: {r.description}</span>
                        </li>
                     ))}
                  </ul>
               </div>
             )}
             
             {/* Stamp / Watermark */}
             <div className="absolute bottom-32 right-12 opacity-20 pointer-events-none transform -rotate-12">
                 <div className="w-40 h-40 border-4 border-blue-600 rounded-full flex flex-col items-center justify-center p-2 text-blue-600">
                     <EgretLogo size={32} className="mb-1" />
                     <div className="text-center font-bold uppercase text-[10px] tracking-widest leading-tight">
                         SailGuard AI<br/>Verified
                     </div>
                 </div>
             </div>

             <div className="mt-20 pt-8 border-t-2 border-gray-800 text-xs text-gray-500 text-center relative z-10 bg-white">
                <p className="font-bold mb-2">
                   {language === 'zh' ? '免责声明 / Disclaimer' : 'Disclaimer'}
                </p>
                <p className="max-w-3xl mx-auto leading-relaxed">
                   {data.disclaimer || (language === 'zh' 
                      ? '本报告由鹭起南洋（SailGuard AI）基于规则库、平台规范及目标市场合规要求自动生成，仅供企业内部评估与整改参考，最终合规结论应结合官方法规、认证结果及平台政策执行。' 
                      : 'This report is automatically generated by SailGuard AI based on rule bases, platform specifications, and target market compliance requirements. It is for internal corporate assessment and rectification reference only. Final compliance conclusions should be made in conjunction with official regulations, certification results, and platform policies.')}
                </p>
                <p className="mt-4 font-mono text-gray-400">Generated on {data.date} | SailGuard AI Compliance Engine v2.0</p>
             </div>
          </div>
       </div>

       {/* Right Actions */}
       <div className="w-full lg:w-64 flex-shrink-0 space-y-4">
          <button className="w-full bg-orange-600 hover:bg-orange-500 text-white py-3.5 px-4 rounded-xl font-medium transition-all hover:-translate-y-0.5 shadow-lg shadow-orange-900/20 flex items-center justify-center">
             <Download size={18} className="mr-2" />
             {language === 'zh' ? '下载 PDF 报告' : 'Download PDF'}
          </button>
          <button className="w-full bg-[#1a1a2e] border border-white/10 hover:bg-white/10 hover:border-white/20 text-white py-3.5 px-4 rounded-xl font-medium transition-all flex items-center justify-center">
             <FileCheck2 size={18} className="mr-2" />
             {language === 'zh' ? '导出整改清单' : 'Export Checklist'}
          </button>
          <button className="w-full bg-[#1a1a2e] border border-white/10 hover:bg-white/10 hover:border-white/20 text-white py-3.5 px-4 rounded-xl font-medium transition-all flex items-center justify-center">
             <Share2 size={18} className="mr-2" />
             {language === 'zh' ? '分享报告链接' : 'Share Report'}
          </button>
          
          <div className="mt-8 p-5 bg-[#111122]/60 border border-white/5 rounded-xl text-sm text-gray-400">
             <h4 className="text-gray-300 font-medium mb-2 flex items-center"><Clock size={16} className="mr-2 text-gray-500" />{language === 'zh' ? '报告说明' : 'Report Guide'}</h4>
             <p className="leading-relaxed">
               {language === 'zh' 
                 ? '该报告可直接用于向内部合规团队或外部机构展示初步排查结果。建议优先下载 PDF 存档，并根据第三章建议准备材料。'
                 : 'This report can be used directly to present initial findings to internal teams or external agencies. We recommend downloading the PDF.'}
             </p>
          </div>
       </div>
    </div>
  );
  };

  return (
    <div className="relative min-h-screen w-full bg-[#0a0a1a] text-white pt-28 pb-12 px-4 md:px-8">
      {/* Background elements */}
      <div className="fixed inset-0 pointer-events-none z-0">
        <div className="absolute top-0 right-0 w-[800px] h-[800px] bg-orange-900/10 rounded-full blur-[120px] mix-blend-screen transform translate-x-1/3 -translate-y-1/3"></div>
        <div className="absolute bottom-0 left-0 w-[600px] h-[600px] bg-blue-900/10 rounded-full blur-[100px] mix-blend-screen transform -translate-x-1/3 translate-y-1/3"></div>
      </div>

      <div className="relative z-10 max-w-6xl mx-auto mt-4">
         <button 
           onClick={() => {
              if (currentStep === 'input') onNavigate('ai-saas');
              else if (currentStep === 'report') setCurrentStep('remediation');
              else if (currentStep === 'remediation') setCurrentStep('result');
              else if (currentStep === 'result') setCurrentStep('input');
           }}
           className="flex items-center text-gray-400 hover:text-white transition-colors mb-8 group"
         >
           <ChevronLeft size={20} className="mr-1 group-hover:-translate-x-1 transition-transform" />
           {t.back}
         </button>

         {isGeneratingReport ? (
             <div className="w-full max-w-xl mx-auto flex flex-col items-center justify-center min-h-[50vh] animate-[fadeIn_0.5s_ease-out]">
                <div className="w-24 h-24 mb-8 relative">
                    <div className="absolute inset-0 border-4 border-blue-500/20 rounded-full"></div>
                    <div className="absolute inset-0 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
                    <div className="absolute inset-0 flex items-center justify-center text-blue-500">
                       <FileText size={32} className="animate-pulse" />
                    </div>
                </div>
                <h2 className="text-2xl font-light text-white">{language === 'zh' ? '正在使用 AI 生成结构化合规报告...' : 'Generating AI Compliance Report...'}</h2>
             </div>
         ) : (
             <>
               {currentStep === 'input' && renderInput()}
               {currentStep === 'analyzing' && renderAnalyzing()}
               {currentStep === 'result' && renderResult()}
               {currentStep === 'remediation' && renderRemediation()}
               {currentStep === 'report' && renderReport()}
             </>
         )}
      </div>
    </div>
  );
};
