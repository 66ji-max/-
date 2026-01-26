import React, { useState, useEffect, useRef } from 'react';
import { FullLogo } from './FullLogo';
import { Language } from '../types';
import { translations } from '../translations';
import { FileText, Shield, TrendingUp, Truck, Globe, Calculator, Scale, AlertCircle, CheckCircle, Navigation, X, ArrowRight, Calendar, Tag, Upload, Check, Activity, Database, Server, Lock, Users, Briefcase, User, Mail, Phone as PhoneIcon, Paperclip } from 'lucide-react';

// USER CONFIGURATION: Change this URL to switch the background image for all sub-pages
// Leave empty string '' to fallback to the default gradient
const PAGE_BACKGROUND_IMAGE = "https://image2url.com/r2/default/images/1769422110176-66edd487-25a5-49a1-abf5-9946e4477b99.blob";

interface GenericPageProps {
  title: string;
  language: Language;
  type: 'ecommerce' | 'news' | 'governance' | 'about' | 'join';
}

interface DetailContent {
  type: 'tool' | 'article' | 'text';
  title: string;
  subtitle?: string;
  date?: string;
  category?: string;
  content: React.ReactNode;
  tags?: string[];
}

// Interactive Calculator Component
const CalculatorModalContent = ({ language }: { language: Language }) => {
    const [cif, setCif] = useState<number>(450);
    const [rate, setRate] = useState<number>(10);
    
    const taxPayable = (cif * rate) / 100;

    return (
        <div className="space-y-6">
            <div className="bg-white/5 p-6 rounded-lg border border-white/10">
                <h4 className="text-lg font-bold text-sfc-orange mb-4">{language === 'zh' ? "计算逻辑演示" : "Calculation Logic Demo"}</h4>
                <div className="grid grid-cols-2 gap-4 text-sm">
                    <div className="space-y-2">
                        <label className="text-gray-400 block">{language === 'zh' ? "商品申报价值 (CIF)" : "Declared Value (CIF)"}</label>
                        <div className="flex items-center bg-black/40 rounded border border-white/10 focus-within:border-sfc-orange transition-colors">
                            <span className="pl-3 text-gray-500 select-none">RM</span>
                            <input 
                                type="number" 
                                value={cif}
                                onChange={(e) => setCif(Number(e.target.value))}
                                className="bg-transparent p-3 text-white w-full focus:outline-none"
                            />
                        </div>
                    </div>
                    <div className="space-y-2">
                        <label className="text-gray-400 block">{language === 'zh' ? "税率 (Sales Tax)" : "Sales Tax Rate"}</label>
                        <div className="flex items-center bg-black/40 rounded border border-white/10 focus-within:border-sfc-orange transition-colors">
                            <input 
                                type="number" 
                                value={rate}
                                onChange={(e) => setRate(Number(e.target.value))}
                                className="bg-transparent p-3 text-white w-full focus:outline-none"
                            />
                            <span className="pr-3 text-gray-500 select-none">%</span>
                        </div>
                    </div>
                    <div className="col-span-2 pt-4 border-t border-white/10 mt-2">
                        <div className="flex justify-between items-center">
                            <span className="text-gray-300">{language === 'zh' ? "应缴税额" : "Tax Payable"}:</span>
                            <span className="text-3xl font-bold text-green-400">RM {taxPayable.toFixed(2)}</span>
                        </div>
                    </div>
                </div>
            </div>
            <div className="space-y-4 text-gray-300 leading-relaxed">
                <p>
                    {language === 'zh' 
                        ? "自2024年1月1日起，马来西亚对从国外在线销售并在该国交付的低价值商品（LVG）征收10%的销售税。本工具通过API直接对接JKDM数据库，帮助卖家实时计算税费，生成K1申报单草稿。"
                        : "Effective January 1, 2024, Malaysia imposes a 10% sales tax on Low Value Goods (LVG) sold online from abroad and delivered in the country. This tool connects directly to the JKDM database via API to help sellers calculate taxes in real-time and generate draft K1 declaration forms."}
                </p>
                <ul className="list-disc pl-5 space-y-2 text-sm text-gray-400">
                    <li>{language === 'zh' ? "支持多币种自动汇率换算" : "Supports multi-currency automatic exchange rate conversion"}</li>
                    <li>{language === 'zh' ? "自动判定 HS Code 税率优惠" : "Automatic determination of HS Code tax preferences"}</li>
                    <li>{language === 'zh' ? "一键导出季度报表" : "One-click export of quarterly reports"}</li>
                </ul>
            </div>
        </div>
    );
};

// Live Stats Component
const LiveStatsCard = ({ 
    icon, 
    label, 
    initialValue, 
    incrementRange, 
    suffix = "" 
}: { 
    icon: React.ReactNode, 
    label: string, 
    initialValue: number, 
    incrementRange: number,
    suffix?: string 
}) => {
    const [count, setCount] = useState(initialValue);

    useEffect(() => {
        const interval = setInterval(() => {
            setCount(prev => prev + Math.floor(Math.random() * incrementRange));
        }, 1000); // Update every second
        return () => clearInterval(interval);
    }, [incrementRange]);

    return (
        <div className="flex flex-col p-6 bg-white/5 border border-white/10 rounded-xl hover:bg-white/10 transition-all duration-500 group">
            <div className="flex justify-between items-start mb-4">
                <span className="text-gray-400 text-sm font-medium uppercase tracking-wider">{label}</span>
                <div className="text-sfc-orange opacity-80 group-hover:opacity-100 group-hover:scale-110 transition-all">
                    {icon}
                </div>
            </div>
            <div className="text-3xl font-mono font-bold text-white mt-auto">
                {count.toLocaleString()}{suffix}
            </div>
        </div>
    );
};

// --- Added Missing Components ---

const FeatureCard = ({ icon, title, desc, onClick }: { icon: React.ReactNode, title: string, desc: string, onClick?: () => void }) => (
    <div
        onClick={onClick}
        className={`bg-white/5 p-6 rounded-xl border border-white/10 hover:bg-white/10 hover:-translate-y-1 transition-all duration-300 group cursor-pointer flex flex-col items-start gap-4 h-full`}
    >
        <div className="p-3 bg-sfc-blue/20 rounded-lg group-hover:bg-sfc-blue/40 transition-colors">
            {icon}
        </div>
        <div>
            <h4 className="text-xl font-bold text-white mb-2 group-hover:text-sfc-orange transition-colors">{title}</h4>
            <p className="text-gray-400 text-sm leading-relaxed">{desc}</p>
        </div>
        {onClick && (
            <div className="mt-auto pt-4 flex items-center text-sfc-blue text-xs font-bold uppercase tracking-wider opacity-0 group-hover:opacity-100 transition-opacity">
                ACCESS <ArrowRight size={12} className="ml-1" />
            </div>
        )}
    </div>
);

const NewsItem = ({ date, category, title, desc, onClick }: { date: string, category: string, title: string, desc: string, onClick?: () => void }) => (
    <div
        onClick={onClick}
        className="group border-b border-white/10 pb-6 last:border-0 cursor-pointer"
    >
        <div className="flex items-center gap-4 text-xs text-gray-500 mb-2">
            <span className="font-mono text-sfc-orange">{date}</span>
            <span className="w-1 h-1 bg-gray-600 rounded-full"></span>
            <span className="uppercase tracking-wider">{category}</span>
        </div>
        <h4 className="text-lg font-bold text-white mb-2 group-hover:text-sfc-orange transition-colors line-clamp-1">{title}</h4>
        <p className="text-gray-400 text-sm line-clamp-2 leading-relaxed">{desc}</p>
    </div>
);

const GovernanceCard = ({ icon, title, content, onClick }: { icon: React.ReactNode, title: string, content: string, onClick?: () => void }) => (
    <div 
        onClick={onClick}
        className={`bg-white/5 p-8 rounded-xl border border-white/10 flex flex-col items-center text-center hover:bg-white/10 transition-all duration-300 ${onClick ? 'cursor-pointer hover:border-sfc-orange/50 hover:-translate-y-1' : ''}`}
    >
        <div className="mb-6 p-4 bg-black/30 rounded-full border border-white/5 text-sfc-orange group-hover:scale-110 transition-transform">
            {icon}
        </div>
        <h4 className="text-xl font-bold text-white mb-4">{title}</h4>
        <p className="text-gray-400 leading-relaxed text-sm">
            {content}
        </p>
        {onClick && (
            <div className="mt-6 text-sfc-blue text-xs font-bold opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-1">
                VIEW DETAILS <ArrowRight size={12} />
            </div>
        )}
    </div>
);

const JobItem = ({ title, onClick }: { title: string; onClick?: () => void }) => (
    <div 
        onClick={onClick}
        className={`flex items-center justify-between p-4 bg-white/5 border border-white/10 rounded-lg hover:border-sfc-orange/50 transition-colors group ${onClick ? 'cursor-pointer' : ''}`}
    >
        <span className="text-white font-medium group-hover:text-sfc-orange transition-colors">{title}</span>
        <ArrowRight size={18} className="text-gray-500 group-hover:translate-x-1 transition-transform" />
    </div>
);

const JobApplicationModal = ({ isOpen, onClose, language, jobTitle }: { isOpen: boolean, onClose: () => void, language: Language, jobTitle?: string }) => {
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isSuccess, setIsSuccess] = useState(false);
    const [fileName, setFileName] = useState<string | null>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        setIsSubmitting(true);
        // Simulate API call
        setTimeout(() => {
            setIsSubmitting(false);
            setIsSuccess(true);
            setTimeout(() => {
                setIsSuccess(false);
                onClose();
            }, 2000);
        }, 1500);
    };

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            setFileName(e.target.files[0].name);
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-black/80 backdrop-blur-sm" onClick={onClose}></div>
            <div className="relative w-full max-w-lg bg-zinc-900 border border-zinc-700 rounded-2xl shadow-2xl p-8 animate-[fadeIn_0.2s_ease-out] overflow-hidden">
                <button onClick={onClose} className="absolute top-4 right-4 text-gray-400 hover:text-white z-10">
                    <X size={24} />
                </button>

                {isSuccess ? (
                    <div className="flex flex-col items-center justify-center py-12 text-center">
                        <div className="w-16 h-16 bg-green-500/20 rounded-full flex items-center justify-center mb-6 text-green-500 animate-[fadeIn_0.3s_ease-out]">
                            <CheckCircle size={32} />
                        </div>
                        <h3 className="text-2xl font-bold text-white mb-2">
                            {language === 'zh' ? "投递成功！" : "Submission Successful!"}
                        </h3>
                        <p className="text-gray-400">
                            {language === 'zh' ? "我们将尽快与您联系。" : "We will contact you shortly."}
                        </p>
                    </div>
                ) : (
                    <>
                        <div className="mb-8">
                            <h3 className="text-2xl font-bold text-white mb-2 flex items-center gap-2">
                                <Briefcase size={24} className="text-sfc-orange" />
                                {language === 'zh' ? "申请职位" : "Apply for Position"}
                            </h3>
                            <p className="text-gray-400 text-sm">
                                {jobTitle || (language === 'zh' ? "加入鹭起南洋，共创未来" : "Join SFC, Build the Future")}
                            </p>
                        </div>
                        
                        <form onSubmit={handleSubmit} className="space-y-4">
                            <div className="space-y-1">
                                <label className="text-xs font-bold text-gray-500 uppercase tracking-wider">{language === 'zh' ? "姓名" : "Name"}</label>
                                <div className="flex items-center bg-black/40 rounded border border-white/10 focus-within:border-sfc-orange transition-colors px-3 py-2">
                                    <User size={16} className="text-gray-500 mr-2" />
                                    <input required type="text" className="bg-transparent w-full text-white focus:outline-none placeholder-gray-600" placeholder={language === 'zh' ? "您的姓名" : "Your Name"} />
                                </div>
                            </div>

                            <div className="space-y-1">
                                <label className="text-xs font-bold text-gray-500 uppercase tracking-wider">{language === 'zh' ? "电子邮箱" : "Email"}</label>
                                <div className="flex items-center bg-black/40 rounded border border-white/10 focus-within:border-sfc-orange transition-colors px-3 py-2">
                                    <Mail size={16} className="text-gray-500 mr-2" />
                                    <input required type="email" className="bg-transparent w-full text-white focus:outline-none placeholder-gray-600" placeholder="example@email.com" />
                                </div>
                            </div>

                            <div className="space-y-1">
                                <label className="text-xs font-bold text-gray-500 uppercase tracking-wider">{language === 'zh' ? "联系电话" : "Phone"}</label>
                                <div className="flex items-center bg-black/40 rounded border border-white/10 focus-within:border-sfc-orange transition-colors px-3 py-2">
                                    <PhoneIcon size={16} className="text-gray-500 mr-2" />
                                    <input required type="tel" className="bg-transparent w-full text-white focus:outline-none placeholder-gray-600" placeholder="+86 1XX XXXX XXXX" />
                                </div>
                            </div>

                            <div className="space-y-1">
                                <label className="text-xs font-bold text-gray-500 uppercase tracking-wider">{language === 'zh' ? "申请岗位" : "Position"}</label>
                                <div className="flex items-center bg-black/40 rounded border border-white/10 focus-within:border-sfc-orange transition-colors px-3 py-2">
                                    <Briefcase size={16} className="text-gray-500 mr-2" />
                                    <input 
                                        type="text" 
                                        className="bg-transparent w-full text-white focus:outline-none placeholder-gray-600" 
                                        defaultValue={jobTitle} 
                                        placeholder={language === 'zh' ? "意向岗位" : "Target Position"} 
                                    />
                                </div>
                            </div>

                            <div className="space-y-1 pt-2">
                                <label className="text-xs font-bold text-gray-500 uppercase tracking-wider block mb-1">{language === 'zh' ? "上传简历 (PDF/Word)" : "Resume (PDF/Word)"}</label>
                                <input 
                                    type="file" 
                                    ref={fileInputRef}
                                    className="hidden" 
                                    accept=".pdf,.doc,.docx"
                                    onChange={handleFileChange}
                                />
                                <button 
                                    type="button"
                                    onClick={() => fileInputRef.current?.click()}
                                    className="w-full flex items-center justify-center gap-2 p-4 border border-dashed border-white/20 rounded hover:bg-white/5 transition-colors text-gray-400 hover:text-white"
                                >
                                    {fileName ? (
                                        <>
                                            <FileText size={18} className="text-sfc-orange" />
                                            <span className="text-white truncate">{fileName}</span>
                                        </>
                                    ) : (
                                        <>
                                            <Paperclip size={18} />
                                            <span>{language === 'zh' ? "点击上传附件" : "Click to attach file"}</span>
                                        </>
                                    )}
                                </button>
                            </div>

                            <button 
                                type="submit" 
                                disabled={isSubmitting}
                                className="w-full py-3 bg-gradient-to-r from-sfc-blue to-blue-600 rounded font-bold text-white hover:from-blue-500 hover:to-blue-400 transition-all transform hover:scale-[1.02] active:scale-[0.98] mt-4 flex items-center justify-center gap-2"
                            >
                                {isSubmitting ? (
                                    <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                                ) : (
                                    <>
                                        {language === 'zh' ? "立即投递" : "Submit Application"}
                                        <ArrowRight size={18} />
                                    </>
                                )}
                            </button>
                        </form>
                    </>
                )}
            </div>
        </div>
    );
}

// ------------------------------------

const GenericPage: React.FC<GenericPageProps> = ({ title, language, type }) => {
  const [activeItem, setActiveItem] = useState<DetailContent | null>(null);
  const [isJobModalOpen, setIsJobModalOpen] = useState(false);
  const [applicationJobTitle, setApplicationJobTitle] = useState('');

  // Helper to open details
  const openDetail = (item: DetailContent) => {
    setActiveItem(item);
    document.body.style.overflow = 'hidden'; // Prevent background scrolling
  };

  const closeDetail = () => {
    setActiveItem(null);
    document.body.style.overflow = 'auto';
  };

  const openApplication = (title: string = '') => {
      setApplicationJobTitle(title);
      setIsJobModalOpen(true);
  }

  const renderContent = () => {
    switch (type) {
      // ... (other cases remain unchanged)
      case 'ecommerce':
        return (
          <div className="w-full max-w-6xl">
             <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                {/* ... existing ecommerce cards ... */}
                <FeatureCard 
                    icon={<Calculator size={32} className="text-white" />}
                    title={language === 'zh' ? "LVG 税费智能计算" : "LVG Tax Calculator"} 
                    desc={language === 'zh' ? "针对马来西亚低价值商品（LVG）新规，自动计算销售税，确保合规。" : "Automated calculation of Malaysia's Low Value Goods (LVG) tax for compliance."}
                    onClick={() => openDetail({
                        type: 'tool',
                        title: language === 'zh' ? "LVG 税费智能计算器" : "LVG Tax Smart Calculator",
                        subtitle: language === 'zh' ? "符合马来西亚皇家关税局 (JKDM) 2024 新规" : "Compliant with JKDM 2024 Regulations",
                        tags: ['Tax Tech', 'Compliance', 'Malaysia'],
                        content: <CalculatorModalContent language={language} />
                    })}
                />
                <FeatureCard 
                    icon={<CheckCircle size={32} className="text-white" />}
                    title={language === 'zh' ? "清真认证直通车" : "Halal Certification Hub"} 
                    desc={language === 'zh' ? "链接 JAKIM 认证机构，为食品与化妆品出口提供一站式清真合规咨询。" : "One-stop Halal compliance consulting connecting with JAKIM certification bodies."}
                    onClick={() => openDetail({
                        type: 'text',
                        title: language === 'zh' ? "马来西亚 JAKIM 清真认证服务" : "Malaysia JAKIM Halal Certification Service",
                        tags: ['Halal', 'Food & Bev', 'Cosmetics'],
                        content: (
                            <div className="space-y-6">
                                <p className="text-gray-300 leading-relaxed">
                                    {language === 'zh'
                                        ? "马来西亚拥有全球最严格的清真认证标准（MS 1500:2019）。对于希望进入马来西亚穆斯林市场的中国食品、药品及化妆品企业，获得 JAKIM（马来西亚伊斯兰教发展局）认证是至关重要的通行证。"
                                        : "Malaysia has the world's strictest Halal certification standards (MS 1500:2019). For Chinese food, pharmaceutical, and cosmetic companies wishing to enter the Malaysian Muslim market, obtaining JAKIM (Department of Islamic Development Malaysia) certification is a crucial pass."}
                                </p>
                                <div className="grid grid-cols-1 gap-4">
                                    <div className="bg-white/5 p-4 rounded border border-white/10 flex gap-4">
                                        <div className="w-8 h-8 bg-green-500/20 rounded-full flex items-center justify-center text-green-400 font-bold">1</div>
                                        <div>
                                            <h5 className="font-bold text-white mb-1">{language === 'zh' ? "原料审核" : "Ingredient Audit"}</h5>
                                            <p className="text-sm text-gray-400">{language === 'zh' ? "AI 预审原料表，排除违禁成分（如猪源性、酒精）。" : "AI pre-review of ingredient lists to exclude prohibited components (e.g., porcine, alcohol)."}</p>
                                        </div>
                                    </div>
                                    <div className="bg-white/5 p-4 rounded border border-white/10 flex gap-4">
                                        <div className="w-8 h-8 bg-green-500/20 rounded-full flex items-center justify-center text-green-400 font-bold">2</div>
                                        <div>
                                            <h5 className="font-bold text-white mb-1">{language === 'zh' ? "现场验厂辅导" : "Factory Audit Coaching"}</h5>
                                            <p className="text-sm text-gray-400">{language === 'zh' ? "协助建立 HAS（清真保障体系），模拟审计流程。" : "Assist in establishing HAS (Halal Assurance System) and simulate audit processes."}</p>
                                        </div>
                                    </div>
                                    <div className="bg-white/5 p-4 rounded border border-white/10 flex gap-4">
                                        <div className="w-8 h-8 bg-green-500/20 rounded-full flex items-center justify-center text-green-400 font-bold">3</div>
                                        <div>
                                            <h5 className="font-bold text-white mb-1">{language === 'zh' ? "证书申请代理" : "Certificate Application Proxy"}</h5>
                                            <p className="text-sm text-gray-400">{language === 'zh' ? "直接对接 JAKIM 及其认可的外国清真认证机构（FHCB）。" : "Direct interface with JAKIM and its recognized Foreign Halal Certification Bodies (FHCB)."}</p>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )
                    })} 
                />
                <FeatureCard 
                    icon={<TrendingUp size={32} className="text-white" />}
                    title={language === 'zh' ? "东南亚选品雷达" : "SEA Market Radar"} 
                    desc={language === 'zh' ? "基于 Shopee/Lazada 大数据，分析中马贸易爆款趋势与价格区间。" : "Big data analysis of trending products and pricing on Shopee/Lazada."}
                    onClick={() => openDetail({
                        type: 'tool',
                        title: language === 'zh' ? "东南亚电商选品大数据" : "SEA E-commerce Big Data Selection",
                        subtitle: "Powered by xLab AI Analysis",
                        tags: ['Big Data', 'Shopee', 'Lazada', 'TikTok Shop'],
                        content: (
                            <div className="space-y-6">
                                <div className="aspect-video bg-gradient-to-br from-indigo-900 to-slate-900 rounded-lg border border-white/10 flex items-center justify-center relative overflow-hidden group">
                                    <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1551288049-bebda4e38f71?q=80&w=2070&auto=format&fit=crop')] bg-cover bg-center opacity-20 group-hover:scale-105 transition-transform duration-700"></div>
                                    <div className="relative z-10 text-center">
                                        <TrendingUp size={48} className="mx-auto text-sfc-orange mb-4" />
                                        <p className="text-white font-mono">{language === 'zh' ? "实时数据看板预览" : "Real-time Dashboard Preview"}</p>
                                    </div>
                                </div>
                                <p className="text-gray-300">
                                    {language === 'zh'
                                        ? "选品雷达覆盖 Shopee MY, Lazada MY 及 TikTok Shop 马来西亚站点的实时交易数据。系统通过 NLP 分析评论情感，预测未来 30 天的爆款趋势。"
                                        : "Market Radar covers real-time transaction data from Shopee MY, Lazada MY, and TikTok Shop Malaysia. The system uses NLP to analyze review sentiment and predict trending products for the next 30 days."}
                                </p>
                                <div className="flex gap-4">
                                    <button className="flex-1 py-3 bg-sfc-blue rounded hover:bg-blue-600 transition-colors text-white text-sm font-bold">
                                        {language === 'zh' ? "查看本周热搜词" : "View Weekly Top Search Terms"}
                                    </button>
                                    <button className="flex-1 py-3 bg-white/10 rounded hover:bg-white/20 transition-colors text-white text-sm font-bold">
                                        {language === 'zh' ? "下载行业报告" : "Download Industry Report"}
                                    </button>
                                </div>
                            </div>
                        )
                    })} 
                />
                <FeatureCard 
                    icon={<Truck size={32} className="text-white" />}
                    title={language === 'zh' ? "端到端物流追踪" : "E2E Logistics Tracking"} 
                    desc={language === 'zh' ? "整合深圳至巴生港/槟城物流数据，实现全链路可视化监控。" : "Integrated logistics tracking from Shenzhen to Port Klang/Penang."}
                    onClick={() => openDetail({
                        type: 'text',
                        title: language === 'zh' ? "中马跨境物流全链路可视化" : "China-Malaysia Logistics E2E Visibility",
                        tags: ['Logistics', 'IoT', 'Customs'],
                        content: (
                            <div className="space-y-6">
                                <p className="text-gray-300">
                                    {language === 'zh'
                                        ? "告别信息黑洞。我们的系统打通了船公司、报关行及马来西亚本地派送商（如 J&T, Pos Laju）的数据接口。无论货物在深圳仓、海上、巴生港清关还是最后一公里派送，您都能在同一个看板上掌握状态。"
                                        : "Say goodbye to information black holes. Our system integrates data interfaces from shipping lines, customs brokers, and local Malaysian couriers (e.g., J&T, Pos Laju). Whether the goods are in Shenzhen warehouse, at sea, clearing customs at Port Klang, or in last-mile delivery, you can track the status on a single dashboard."}
                                </p>
                                <div className="border-l-2 border-sfc-orange pl-6 space-y-6">
                                    <div className="relative">
                                        <div className="absolute -left-[31px] top-0 w-4 h-4 rounded-full bg-sfc-orange border-2 border-black"></div>
                                        <h5 className="text-white font-bold">{language === 'zh' ? "深圳集运仓 (SFC SZ)" : "Shenzhen Consolidation Hub"}</h5>
                                        <p className="text-xs text-gray-500 mt-1">Received, Weighed, Labeling</p>
                                    </div>
                                    <div className="relative">
                                        <div className="absolute -left-[31px] top-0 w-4 h-4 rounded-full bg-gray-600 border-2 border-black"></div>
                                        <h5 className="text-white font-bold">{language === 'zh' ? "海关申报 (Export Declaration)" : "Export Declaration"}</h5>
                                        <p className="text-xs text-gray-500 mt-1">9610 / 9710 / 9810 Modes</p>
                                    </div>
                                    <div className="relative">
                                        <div className="absolute -left-[31px] top-0 w-4 h-4 rounded-full bg-gray-600 border-2 border-black"></div>
                                        <h5 className="text-white font-bold">{language === 'zh' ? "目的港清关 (Port Klang)" : "Customs Clearance (Port Klang)"}</h5>
                                        <p className="text-xs text-gray-500 mt-1">SST Payment & Release</p>
                                    </div>
                                </div>
                            </div>
                        )
                    })} 
                />
                <FeatureCard 
                    icon={<Globe size={32} className="text-white" />}
                    title={language === 'zh' ? "多语言本地化" : "Localization Service"} 
                    desc={language === 'zh' ? "AI 驱动的马来语/英语/中文自动翻译与 listing 优化。" : "AI-driven translation and listing optimization for Malay/English/Chinese."}
                    onClick={() => openDetail({
                        type: 'text',
                        title: language === 'zh' ? "AI 驱动的电商本地化" : "AI-Driven E-commerce Localization",
                        tags: ['Translation', 'Bahasa Melayu', 'SEO'],
                        content: (
                            <div className="space-y-4 text-gray-300">
                                <p>
                                    {language === 'zh'
                                        ? "马来西亚是一个多语言国家（马来语、英语、中文）。直接使用翻译软件往往会产生歧义或不符合当地表达习惯。我们的 AI 模型经过千万级电商语料训练，特别是针对 'Manglish'（马来西亚式英语）和当地俚语进行了优化。"
                                        : "Malaysia is a multilingual country (Malay, English, Chinese). Direct use of translation software often leads to ambiguity or unnatural phrasing. Our AI model is trained on millions of e-commerce corpus entries, specifically optimized for 'Manglish' and local slang."}
                                </p>
                                <div className="bg-white/10 p-4 rounded text-sm font-mono">
                                    <div className="text-red-400 mb-2">Before: "High quality female clothes cheap"</div>
                                    <div className="text-green-400">After: "Baju Kurung Moden Murah & Berkualiti (Ready Stock)"</div>
                                </div>
                            </div>
                        )
                    })} 
                />
                <FeatureCard 
                    icon={<Shield size={32} className="text-white" />}
                    title={language === 'zh' ? "知识产权保护" : "IP Protection"} 
                    desc={language === 'zh' ? "中马双边商标注册与侵权监测，保护品牌出海安全。" : "Bilateral trademark registration and infringement monitoring."}
                    onClick={() => openDetail({
                        type: 'text',
                        title: language === 'zh' ? "中马双边知识产权盾牌" : "China-Malaysia Bilateral IP Shield",
                        tags: ['MyIPO', 'Trademark', 'Legal'],
                        content: (
                            <div className="space-y-4 text-gray-300">
                                <p>
                                    {language === 'zh'
                                        ? "我们与马来西亚知识产权局 (MyIPO) 注册代理人合作，提供从商标检索、注册到维权的全流程服务。同时，我们的 AI 图像识别技术可以监测 Shopee/Lazada 平台上的盗图和侵权跟卖行为。"
                                        : "We partner with registered agents of the Intellectual Property Corporation of Malaysia (MyIPO) to provide full-process services from trademark search and registration to enforcement. Meanwhile, our AI image recognition technology monitors image theft and unauthorized listings on Shopee/Lazada."}
                                </p>
                            </div>
                        )
                    })} 
                />
             </div>
          </div>
        );
      case 'news':
        return (
          <div className="flex flex-col gap-6 w-full max-w-4xl">
             {/* ... existing news items ... */}
             <div className="mb-8 p-6 bg-blue-900/20 border border-blue-500/30 rounded-xl">
                <h3 className="text-xl font-bold text-sfc-orange mb-2 flex items-center gap-2">
                    <AlertCircle size={20} /> 
                    {language === 'zh' ? "最新政策速递" : "Latest Policy Alerts"}
                </h3>
                <p className="text-gray-300">
                    {language === 'zh' ? "关注中马贸易最新动态，把握RCEP政策红利。" : "Stay updated on China-Malaysia trade dynamics and RCEP benefits."}
                </p>
             </div>
             <NewsItem 
                date="2024.01.15" 
                category={language === 'zh' ? "税务法规" : "Tax Regulation"}
                title={language === 'zh' ? "马来西亚海关关于低价值商品（LVG）销售税的最新征收细则解读" : "Interpretation of Malaysia Customs' Latest Rules on LVG Sales Tax Collection"} 
                desc={language === 'zh' ? "自2024年1月1日起，所有在线销售至马来西亚且价格低于500令吉的进口商品需缴纳10%销售税，本平台已更新计税引擎。" : "From Jan 1, 2024, a 10% sales tax applies to imported goods under RM500 sold online to Malaysia."}
                onClick={() => openDetail({
                    type: 'article',
                    title: language === 'zh' ? "LVG 新政深度解读：卖家如何应对？" : "Deep Dive into LVG Policy: How Sellers Should Respond?",
                    date: "2024.01.15",
                    category: "Tax Regulation",
                    content: (
                        <div className="text-gray-300 space-y-6 leading-loose">
                            <p>
                                <strong>{language === 'zh' ? "背景：" : "Background:"}</strong><br/>
                                {language === 'zh' 
                                    ? "马来西亚皇家关税局（JKDM）宣布，从2024年1月1日起，对通过在线市场向马来西亚消费者销售的低价值商品（LVG）征收10%的销售税。LVG 定义为价格不超过 RM500 的商品。"
                                    : "The Royal Malaysian Customs Department (JKDM) announced that effective January 1, 2024, a 10% sales tax will be imposed on Low Value Goods (LVG) sold via online marketplaces to Malaysian consumers. LVG is defined as goods priced not exceeding RM500."}
                            </p>
                            <p>
                                <strong>{language === 'zh' ? "谁需要注册？" : "Who needs to register?"}</strong><br/>
                                {language === 'zh'
                                    ? "任何在12个月内向马来西亚销售 LVG 总额超过 RM500,000 的外国卖家或电商平台，必须在 MyLVG 系统中注册。"
                                    : "Any foreign seller or e-commerce platform with total LVG sales to Malaysia exceeding RM500,000 within 12 months must register in the MyLVG system."}
                            </p>
                            <p>
                                <strong>{language === 'zh' ? "对中国卖家的影响：" : "Impact on Chinese Sellers:"}</strong><br/>
                                {language === 'zh'
                                    ? "1. 价格竞争力：需重新计算定价策略，包含10%税费。\n2. 通关流程：包裹需附带 LVG 注册号，否则可能在清关时被双重征税。\n3. 系统对接：需确保 ERP 系统能生成符合新规的商业发票。"
                                    : "1. Price Competitiveness: Pricing strategies need to be recalculated to include the 10% tax.\n2. Customs Process: Parcels must carry the LVG registration number, otherwise they may be double-taxed at clearance.\n3. System Integration: ERP systems must generate commercial invoices compliant with new regulations."}
                            </p>
                        </div>
                    )
                })} 
             />
             <NewsItem 
                date="2023.12.20" 
                category={language === 'zh' ? "贸易协定" : "Trade Agreement"}
                title={language === 'zh' ? "中国-东盟自贸区3.0版谈判推进，中马跨境物流迎利好" : "China-ASEAN FTA 3.0 Negotiations Advance, Boosting Cross-border Logistics"} 
                desc={language === 'zh' ? "新一轮谈判重点聚焦数字经济与绿色经济，预计将进一步简化通关流程，降低物流成本。" : "Focusing on digital and green economy, expected to simplify customs and lower costs."}
                onClick={() => openDetail({
                    type: 'article',
                    title: language === 'zh' ? "中国-东盟自贸区 3.0：中马贸易的新机遇" : "China-ASEAN FTA 3.0: New Opportunities for China-Malaysia Trade",
                    date: "2023.12.20",
                    category: "Trade Agreement",
                    content: (
                        <div className="text-gray-300 space-y-6 leading-loose">
                            <p>
                                {language === 'zh'
                                    ? "中国-东盟自由贸易区（ACFTA）3.0版谈判正在加速推进。与之前的版本不同，3.0版将更加关注数字经济、绿色经济和供应链互联互通。"
                                    : "Negotiations for Version 3.0 of the China-ASEAN Free Trade Area (ACFTA) are accelerating. Unlike previous versions, Version 3.0 will focus more on the digital economy, green economy, and supply chain connectivity."}
                            </p>
                            <ul className="list-disc pl-5 space-y-2">
                                <li>
                                    <strong>{language === 'zh' ? "无纸化贸易：" : "Paperless Trade:"}</strong> 
                                    {language === 'zh' ? " 推动电子原产地证书（e-CO）的全面互认，减少纸质文件传递时间。" : " Promoting full mutual recognition of electronic Certificates of Origin (e-CO) to reduce paper document transit time."}
                                </li>
                                <li>
                                    <strong>{language === 'zh' ? "快速通关：" : "Express Clearance:"}</strong> 
                                    {language === 'zh' ? " 对易腐货物和快件实施‘6小时通关’便利措施。" : " Implementing '6-hour clearance' facilitation measures for perishable goods and express shipments."}
                                </li>
                            </ul>
                        </div>
                    )
                })}
             />
             <NewsItem 
                date="2023.11.05" 
                category={language === 'zh' ? "行业准入" : "Market Access"}
                title={language === 'zh' ? "马来西亚SIRIM认证新标准发布，涉及多类家电产品" : "New SIRIM Certification Standards Released for Home Appliances"} 
                desc={language === 'zh' ? "出口马来西亚的充电宝、适配器等产品需强制通过SIRIM认证，请卖家及时自查。" : "Mandatory SIRIM certification for power banks and adapters exported to Malaysia."}
                onClick={() => openDetail({
                    type: 'article',
                    title: language === 'zh' ? "SIRIM 认证避坑指南" : "SIRIM Certification Guide",
                    date: "2023.11.05",
                    category: "Compliance",
                    content: (
                        <div className="text-gray-300 space-y-6 leading-loose">
                            <p>
                                {language === 'zh'
                                    ? "SIRIM QAS International 近期收紧了对通讯设备和电器产品的认证要求。未获得 SIRIM 标签（Label）的产品将被海关扣押或退运。"
                                    : "SIRIM QAS International has recently tightened certification requirements for communication devices and electrical appliances. Products without the SIRIM Label will be detained or returned by customs."}
                            </p>
                            <div className="bg-red-500/10 p-4 border border-red-500/30 rounded">
                                <h5 className="text-red-400 font-bold mb-2">{language === 'zh' ? "高风险产品清单：" : "High Risk Product List:"}</h5>
                                <ul className="list-disc pl-5 text-sm space-y-1">
                                    <li>Power Banks ({language === 'zh' ? "充电宝" : "Power Banks"})</li>
                                    <li>Travel Adapters ({language === 'zh' ? "旅行插座" : "Travel Adapters"})</li>
                                    <li>Electric Shavers ({language === 'zh' ? "电动剃须刀" : "Electric Shavers"})</li>
                                    <li>Bluetooth Headsets ({language === 'zh' ? "蓝牙耳机" : "Bluetooth Headsets"})</li>
                                </ul>
                            </div>
                        </div>
                    )
                })}
             />
             <NewsItem 
                date="2023.10.12" 
                category={language === 'zh' ? "平台动态" : "Platform News"}
                title={language === 'zh' ? "鹭起南洋获选“2023年度中马数字贸易最佳服务商”" : "SFC Awarded 'Best China-Malaysia Digital Trade Service Provider 2023'"} 
                desc={language === 'zh' ? "凭借在合规科技领域的持续创新，助力超过5000家企业顺利出海马来西亚。" : "Recognized for innovation in compliance tech, helping 5000+ companies expand to Malaysia."}
                onClick={() => {}} 
             />
          </div>
        );
      case 'governance':
        return (
          <div className="w-full max-w-5xl">
             <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-12">
                <GovernanceCard 
                    icon={<Scale size={40} className="text-sfc-orange" />}
                    title={language === 'zh' ? "合规经营体系" : "Compliance Framework"}
                    content={language === 'zh' ? "严格遵守中国《数据安全法》与马来西亚《个人数据保护法》（PDPA），建立双重合规审查机制，确保跨境数据流动安全可控。" : "Strict adherence to China's DSL and Malaysia's PDPA, establishing dual compliance review mechanisms for safe cross-border data flow."}
                    onClick={() => openDetail({
                        type: 'text',
                        title: language === 'zh' ? "全球合规运营体系" : "Global Compliance Operation System",
                        tags: ['ISO 27001', 'GDPR', 'PDPA', 'Audit'],
                        content: (
                            <div className="space-y-6 text-gray-300 leading-relaxed">
                                <p>
                                    {language === 'zh'
                                        ? "我们建立了一套“三道防线”的合规防御体系，确保每一笔跨境交易都符合始发国与目的国的法律法规。"
                                        : "We have established a 'Three Lines of Defense' compliance system to ensure every cross-border transaction complies with the laws of both origin and destination countries."}
                                </p>
                                <div className="grid gap-4">
                                    <div className="bg-white/5 p-4 rounded border border-white/10 flex gap-4 items-start">
                                        <div className="mt-1 bg-blue-500/20 p-2 rounded-full text-blue-400"><Activity size={16} /></div>
                                        <div>
                                            <h5 className="font-bold text-white mb-1">{language === 'zh' ? "第一道防线：AI 实时风控" : "Tier 1: AI Real-time Risk Control"}</h5>
                                            <p className="text-sm text-gray-400">{language === 'zh' ? "基于 NLP 技术，实时扫描订单中的敏感词汇（如违禁品、侵权品牌），拦截率达 99.9%。" : "Based on NLP, scanning sensitive words (contraband, infringing brands) in real-time, with an interception rate of 99.9%."}</p>
                                        </div>
                                    </div>
                                    <div className="bg-white/5 p-4 rounded border border-white/10 flex gap-4 items-start">
                                        <div className="mt-1 bg-green-500/20 p-2 rounded-full text-green-400"><Lock size={16} /></div>
                                        <div>
                                            <h5 className="font-bold text-white mb-1">{language === 'zh' ? "第二道防线：法务专家复核" : "Tier 2: Legal Expert Review"}</h5>
                                            <p className="text-sm text-gray-400">{language === 'zh' ? "对于高风险或模糊地带的业务，由中马两地执业律师组成的团队进行二次人工审核。" : "For high-risk or ambiguous cases, a team of licensed lawyers from both China and Malaysia conducts a secondary manual review."}</p>
                                        </div>
                                    </div>
                                    <div className="bg-white/5 p-4 rounded border border-white/10 flex gap-4 items-start">
                                        <div className="mt-1 bg-purple-500/20 p-2 rounded-full text-purple-400"><Server size={16} /></div>
                                        <div>
                                            <h5 className="font-bold text-white mb-1">{language === 'zh' ? "第三道防线：外部独立审计" : "Tier 3: External Independent Audit"}</h5>
                                            <p className="text-sm text-gray-400">{language === 'zh' ? "每年聘请“四大”会计师事务所进行数据安全与合规审计，定期发布 ESG 报告。" : "Annually engaging 'Big Four' accounting firms for data security and compliance audits, publishing regular ESG reports."}</p>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )
                    })}
                />
                <GovernanceCard 
                    icon={<Navigation size={40} className="text-sfc-orange" />}
                    title={language === 'zh' ? "贸易伦理准则" : "Trade Ethics Code"}
                    content={language === 'zh' ? "倡导公平贸易，拒绝假冒伪劣商品。建立黑名单制度，对侵犯知识产权的行为零容忍，维护‘中国制造’的良好声誉。" : "Advocating fair trade, rejecting counterfeits. Zero tolerance for IP infringement to uphold the reputation of 'Made in China'."}
                    onClick={() => openDetail({
                        type: 'text',
                        title: language === 'zh' ? "跨境贸易伦理准则" : "Cross-border Trade Ethics Standards",
                        tags: ['Fair Trade', 'Anti-Corruption', 'Sustainability'],
                        content: (
                            <div className="space-y-6 text-gray-300 leading-relaxed">
                                <p>
                                    {language === 'zh'
                                        ? "商业不仅是逐利，更是责任。鹭起南洋始终坚持“阳光贸易”，致力于构建透明、公正、可持续的跨境商业生态。"
                                        : "Business is not just about profit, but responsibility. SFC adheres to 'Sunny Trade' and is committed to building a transparent, fair, and sustainable cross-border business ecosystem."}
                                </p>
                                <ul className="list-disc pl-5 space-y-4">
                                    <li>
                                        <strong className="text-white block mb-1">{language === 'zh' ? "零容忍政策 (Zero Tolerance)" : "Zero Tolerance Policy"}</strong>
                                        {language === 'zh' ? "对于任何形式的商业贿赂、洗钱及售卖假冒伪劣商品行为，一经发现，立即永久封停账号并移交司法机关。" : "Any form of bribery, money laundering, or sale of counterfeit goods will result in immediate permanent account suspension and referral to judicial authorities."}
                                    </li>
                                    <li>
                                        <strong className="text-white block mb-1">{language === 'zh' ? "绿色供应链 (Green Supply Chain)" : "Green Supply Chain"}</strong>
                                        {language === 'zh' ? "优先推荐使用环保包装材料的商家。我们承诺到2025年，平台物流包装的可回收率达到 80%。" : "Priority recommendation for merchants using eco-friendly packaging. We commit to 80% recyclability of platform logistics packaging by 2025."}
                                    </li>
                                    <li>
                                        <strong className="text-white block mb-1">{language === 'zh' ? "公平用工 (Fair Labor Practices)" : "Fair Labor Practices"}</strong>
                                        {language === 'zh' ? "严格审查供应商的用工情况，坚决抵制强迫劳动和童工产品进入我们的供应链。" : "Strictly auditing supplier labor practices, resolutely rejecting forced labor and child labor products from entering our supply chain."}
                                    </li>
                                </ul>
                            </div>
                        )
                    })}
                />
             </div>
             
             <h3 className="text-2xl font-light text-white mb-8 text-center">{language === 'zh' ? "平台实时数据监控" : "Platform Live Monitor"}</h3>
             <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <LiveStatsCard 
                    icon={<Activity size={24} />}
                    label={language === 'zh' ? "累积 API 调用量" : "Cumulative API Calls"}
                    initialValue={8439201}
                    incrementRange={15}
                />
                <LiveStatsCard 
                    icon={<Shield size={24} />}
                    label={language === 'zh' ? "实时风险拦截" : "Live Threat Interceptions"}
                    initialValue={42109}
                    incrementRange={3}
                />
                <LiveStatsCard 
                    icon={<Database size={24} />}
                    label={language === 'zh' ? "合规知识图谱节点" : "Compliance Graph Nodes"}
                    initialValue={152840}
                    incrementRange={0} // Static high number
                    suffix="+"
                />
             </div>
          </div>
        );
      case 'about':
        return (
          <div className="text-center max-w-4xl bg-white/5 p-12 rounded-2xl backdrop-blur-sm border border-white/10">
             <h3 className="text-2xl font-bold text-white mb-6">
                {language === 'zh' ? "连接中国与南洋的数字桥梁" : "The Digital Bridge Connecting China and Nanyang"}
             </h3>
             <p className="text-lg text-gray-300 leading-relaxed mb-8 text-justify">
                {language === 'zh' 
                    ? "鹭起南洋（SFC）成立于2025年11月，我们致力于通过人工智能与大数据技术，重构跨境贸易的信任机制与效率体系。从合规检测到智能物流，从选品决策到本土化运营，我们为中国企业出海马来西亚提供全链路的数字化解决方案。我们相信，技术不应只是工具，更是促进区域经济融合、增进文化理解的纽带。"
                    : "Founded in Shenzhen, SFC has been dedicated to China-Malaysia trade for over a decade. We are committed to reconstructing the trust mechanism and efficiency system of cross-border trade through AI and big data. From compliance checks to smart logistics, we provide end-to-end digital solutions. We believe technology acts as a bond promoting regional economic integration."}
             </p>
             <div className="grid grid-cols-3 gap-8 mt-12 border-t border-white/10 pt-8">
                <div>
                    <div className="text-4xl font-bold text-sfc-orange mb-2">10000+</div>
                    <div className="text-sm text-gray-400">{language === 'zh' ? "年使用量" : "Years Experience"}</div>
                </div>
                <div>
                    <div className="text-4xl font-bold text-sfc-orange mb-2">500+</div>
                    <div className="text-sm text-gray-400">{language === 'zh' ? "服务企业" : "Clients Served"}</div>
                </div>
                <div>
                    <div className="text-4xl font-bold text-sfc-orange mb-2">RM 20w+</div>
                    <div className="text-sm text-gray-400">{language === 'zh' ? "促成贸易额" : "Trade Volume"}</div>
                </div>
             </div>
          </div>
        );
      case 'join':
        return (
           <div className="grid grid-cols-1 md:grid-cols-2 gap-12 w-full max-w-5xl items-center">
                <div className="text-left">
                    <h3 className="text-3xl font-bold text-white mb-6">
                        {language === 'zh' ? "与我们一起，定义中马数字贸易的未来" : "Define the Future of Digital Trade with Us"}
                    </h3>
                    <p className="text-gray-300 mb-8 leading-relaxed">
                        {language === 'zh' 
                            ? "我们需要懂技术、懂贸易、懂南洋文化的复合型人才。如果你对 AI 充满热情，对出海业务有独到见解，欢迎加入鹭起南洋。"
                            : "We need talent who understands tech, trade, and Nanyang culture. If you are passionate about AI and cross-border business, join us."}
                    </p>
                    <div className="flex flex-col gap-4">
                        <JobItem 
                            title={language === 'zh' ? "跨境合规专家 (吉隆坡/厦门)" : "Compliance Expert (KL/XM)"}
                            onClick={() => openApplication(language === 'zh' ? "跨境合规专家" : "Compliance Expert")}
                        />
                        <JobItem 
                            title={language === 'zh' ? "高级算法工程师 (NLP方向)" : "Senior Algo Engineer (NLP)"} 
                            onClick={() => openApplication(language === 'zh' ? "高级算法工程师 (NLP方向)" : "Senior Algo Engineer (NLP)")}
                        />
                        <JobItem 
                            title={language === 'zh' ? "马来语运营总监" : "Malay Operations Director"} 
                            onClick={() => openApplication(language === 'zh' ? "马来语运营总监" : "Malay Operations Director")}
                        />
                    </div>
                </div>
                <div className="bg-white/5 p-8 rounded-xl border border-white/10 h-full flex flex-col justify-center items-center text-center">
                    <div className="w-20 h-20 bg-sfc-orange rounded-full flex items-center justify-center mb-6">
                        <FileText size={40} className="text-white" />
                    </div>
                    <h4 className="text-xl font-bold text-white mb-2">{language === 'zh' ? "投递简历" : "Send Resume"}</h4>
                    <p className="text-gray-400 mb-6">hr@luqinanyang.com</p>
                    <button 
                        onClick={() => openApplication()}
                        className="px-8 py-3 bg-white text-sfc-blue rounded-full font-bold hover:bg-gray-100 transition-colors w-full md:w-auto"
                    >
                        {language === 'zh' ? "申请职位" : "Apply Now"}
                    </button>
                </div>
           </div>
        );
      default:
        return null;
    }
  };

  return (
    <div className="relative min-h-screen w-full pt-32 pb-20 px-6 flex flex-col items-center animate-[fadeIn_0.5s_ease-out]">
      {/* Configurable Background Image */}
      {PAGE_BACKGROUND_IMAGE ? (
          <div 
            className="absolute inset-0 z-0"
            style={{
                backgroundImage: `url(${PAGE_BACKGROUND_IMAGE})`,
                backgroundSize: 'cover',
                backgroundPosition: 'center',
            }}
          >
            {/* Dark Overlay for readability */}
            <div className="absolute inset-0 bg-[#0a0a1a]/90"></div> 
            {/* Gradient overlay to match theme */}
            <div className="absolute inset-0 bg-gradient-to-b from-black/50 via-transparent to-[#0a0a1a]"></div>
          </div>
      ) : (
          /* Default Gradient Fallback */
          <div className="absolute inset-0 z-0 bg-gradient-to-b from-[#1a4b8c] to-[#0a0a1a]"></div>
      )}

      {/* Content Layer */}
      <div className="relative z-10 w-full flex flex-col items-center">
          {/* Branding Header */}
          <div className="mb-20 transform scale-75 md:scale-100 origin-top">
            <FullLogo />
          </div>

          {/* Page Title */}
          <div className="relative mb-16 text-center">
            <h2 className="text-4xl md:text-5xl font-light text-white tracking-widest relative z-10">{title}</h2>
            <div className="absolute -bottom-4 left-1/2 transform -translate-x-1/2 w-24 h-1 bg-white/20"></div>
          </div>

          {/* Content Area */}
          {renderContent()}
      </div>

      {/* Detail Modal */}
      {activeItem && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-black/80 backdrop-blur-sm" onClick={closeDetail}></div>
            <div className="relative w-full max-w-3xl bg-zinc-900 border border-zinc-700 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh] animate-[fadeIn_0.2s_ease-out]">
                {/* Modal Header */}
                <div className="bg-gradient-to-r from-sfc-blue/20 to-transparent p-6 border-b border-white/10 flex justify-between items-start">
                    <div>
                        {activeItem.category && (
                            <span className="text-xs font-mono text-sfc-orange uppercase tracking-wider mb-2 block">
                                {activeItem.category} {activeItem.date && `• ${activeItem.date}`}
                            </span>
                        )}
                        <h3 className="text-2xl font-bold text-white">{activeItem.title}</h3>
                        {activeItem.subtitle && (
                            <p className="text-gray-400 mt-1">{activeItem.subtitle}</p>
                        )}
                        {activeItem.tags && (
                            <div className="flex gap-2 mt-4">
                                {activeItem.tags.map((tag, i) => (
                                    <span key={i} className="px-2 py-1 bg-white/10 text-xs text-gray-300 rounded flex items-center gap-1">
                                        <Tag size={10} /> {tag}
                                    </span>
                                ))}
                            </div>
                        )}
                    </div>
                    <button onClick={closeDetail} className="text-gray-400 hover:text-white p-2 hover:bg-white/10 rounded-full transition-colors">
                        <X size={24} />
                    </button>
                </div>

                {/* Modal Content */}
                <div className="p-8 overflow-y-auto scrollbar-hide">
                    {activeItem.content}
                </div>

                {/* Modal Footer */}
                <div className="p-4 border-t border-white/10 bg-black/20 flex justify-end">
                    <button onClick={closeDetail} className="px-6 py-2 bg-white text-black font-bold rounded-full hover:bg-gray-200 transition-colors">
                        {language === 'zh' ? "关闭" : "Close"}
                    </button>
                </div>
            </div>
        </div>
      )}

      {/* Job Application Modal */}
      {isJobModalOpen && (
          <JobApplicationModal 
            isOpen={isJobModalOpen} 
            onClose={() => setIsJobModalOpen(false)} 
            language={language} 
            jobTitle={applicationJobTitle}
          />
      )}

      <style>{`
          @keyframes fadeIn {
            from { opacity: 0; transform: translateY(10px); }
            to { opacity: 1; transform: translateY(0); }
          }
      `}</style>
    </div>
  );
};

export default GenericPage;