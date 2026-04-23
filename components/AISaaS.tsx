import React, { useState } from 'react';
import { Sparkles, ArrowUpRight } from 'lucide-react';
import { FullLogo } from './FullLogo';
import { Language } from '../types';
import { translations } from '../translations';
import AILabModal from './AILabModal';
import { Pricing } from './Pricing';
import { useAuth } from '../contexts/AuthContext';

interface AISaaSProps {
  language: Language;
  onNavigate: (page: any) => void;
}

// USER CONFIGURATION: Change this URL to switch the background image for all sub-pages
// Leave empty string '' to fallback to the default gradient
const PAGE_BACKGROUND_IMAGE = "https://image2url.com/r2/default/images/1769422110176-66edd487-25a5-49a1-abf5-9946e4477b99.blob";

const AISaaS: React.FC<AISaaSProps> = ({ language, onNavigate }) => {
  const t = translations[language].aiSaas;
  const [activeRadar, setActiveRadar] = useState<{title: string, instruction: string, greeting: string} | null>(null);
  const { user } = useAuth();

  const handleRadarClick = (type: 'trademark' | 'patent' | 'image' | 'policy') => {
      if (!user) {
          onNavigate('login');
          return;
      }
      let config = { title: '', instruction: '', greeting: '' };
      switch(type) {
          case 'trademark':
              config = {
                  title: t.cardRadar1Title,
                  instruction: "You are the Trademark Radar AI. Your job is to analyze potential trademark infringements for cross-border e-commerce sellers. Users will provide brand names or keywords. You should check for phonetic similarities, semantic conflicts, and potential risks in major markets (US, EU, Southeast Asia). Provide risk levels (High/Medium/Low) and reasoning.",
                  greeting: language === 'zh' ? "我是商标雷达。请输入您想查询的品牌名称或关键词，我将为您分析潜在的侵权风险。" : "I am the Trademark Radar. Please enter a brand name or keyword, and I will analyze potential infringement risks."
              };
              break;
          case 'patent':
              config = {
                  title: t.cardRadar2Title,
                  instruction: "You are the Patent Radar AI. You assist users in identifying potential patent infringements. Users may describe a product's mechanism or design. You should cross-reference common utility and design patents in the e-commerce space. Disclaimer: You are an AI assistant, not a lawyer.",
                  greeting: language === 'zh' ? "我是专利雷达。请描述您的产品功能或外观特征，我将为您检索相似的专利信息。" : "I am the Patent Radar. Please describe your product features or design, and I will search for similar patents."
              };
              break;
          case 'image':
              config = {
                  title: t.cardRadar3Title,
                  instruction: "You are the Image/Graphic Radar AI. You specialize in analyzing image descriptions for copyright and trademark violations in logos and product packaging. Users will describe an image. You analyze if it mimics known brands.",
                  greeting: language === 'zh' ? "我是图形商标雷达。请详细描述您想检测的Logo或产品图片特征（例如：一个咬了一口的苹果），我将为您识别潜在的图形侵权风险。" : "I am the Image Radar. Please describe the Logo or product image features you want to check, and I will identify potential graphic infringement risks."
              };
              break;
          case 'policy':
              config = {
                  title: t.cardRadar4Title,
                  instruction: "You are the Policy Radar AI. You are an expert in Amazon, eBay, Shopee, and Lazada seller policies. Users will ask about listing compliance, prohibited items, or account health. Provide strict, up-to-date policy advice.",
                  greeting: language === 'zh' ? "我是政策雷达。关于亚马逊、Shopee等平台的最新合规政策，您有什么疑问？" : "I am the Policy Radar. Do you have any questions about the latest compliance policies of platforms like Amazon or Shopee?"
              };
              break;
      }
      setActiveRadar(config);
  };

  const handleTopCardClick = (type: 'check' | 'eci' | 'logistics' | 'shopping') => {
      switch(type) {
          case 'check':
              // Scroll to radar section
              document.getElementById('radar-section')?.scrollIntoView({ behavior: 'smooth' });
              break;
          case 'eci':
              if (!user) { onNavigate('login'); return; }
              setActiveRadar({
                  title: t.card2Title,
                  instruction: "You are the ECI Talent Analyst AI. You specialize in HR analytics and predicting employee performance based on multi-dimensional traits. Explain how the 'Striver Index' works and how it helps companies identify top talent.",
                  greeting: language === 'zh' ? "我是 ECI 人才分析助手。我可以帮助您解读员工奋斗者指数，并通过多维特征识别优秀人才。您想了解什么？" : "I am the ECI Talent Analyst. I can help you interpret the Employee Striver Index and identify top talent through multi-dimensional characteristics."
              });
              break;
          case 'logistics':
              if (!user) { onNavigate('login'); return; }
              setActiveRadar({
                  title: t.card3Title,
                  instruction: "You are the Smart Logistics Brain. You use machine learning for sales forecasting, inventory placement, and route optimization in cross-border supply chains. You help reduce costs and improve efficiency.",
                  greeting: language === 'zh' ? "我是智能物流大脑。基于机器学习技术，我可以为您提供销量预测、供应链优化建议。请告诉我您的物流痛点。" : "I am the Smart Logistics Brain. Based on machine learning, I can provide sales forecasting and supply chain optimization advice."
              });
              break;
          case 'shopping':
              if (!user) { onNavigate('login'); return; }
              setActiveRadar({
                  title: t.card4Title,
                  instruction: "You are a Next-Gen E-commerce Shopping Assistant. You understand natural language, can recommend products based on vague descriptions, and simulate a personalized shopping experience.",
                  greeting: language === 'zh' ? "我是您的新一代电商购物助理。想买什么？直接告诉我，哪怕只是一个模糊的想法。" : "I am your Next-Gen Shopping Assistant. What are you looking for? Just tell me, even if it's just a vague idea."
              });
              break;
      }
  };

  return (
    <div className="relative min-h-screen w-full text-white font-sans flex flex-col items-center">
        {/* Consistent Fixed Background Image */}
        {PAGE_BACKGROUND_IMAGE ? (
            <div className="fixed inset-0 z-0 overflow-hidden pointer-events-none">
                <div 
                  className="absolute inset-0"
                  style={{
                      backgroundImage: `url(${PAGE_BACKGROUND_IMAGE})`,
                      backgroundSize: 'cover',
                      backgroundPosition: 'center',
                      backgroundRepeat: 'no-repeat'
                  }}
                ></div>
                {/* Dark Overlay for readability */}
                <div className="absolute inset-0 bg-[#0a0a1a]/90"></div> 
                {/* Gradient overlay to match theme */}
                <div className="absolute inset-0 bg-gradient-to-b from-black/50 via-transparent to-[#0a0a1a]"></div>
            </div>
        ) : (
            <div className="fixed inset-0 z-0 bg-gradient-to-b from-[#1a4b8c] to-[#0a0a1a] pointer-events-none"></div>
        )}

        {/* Content Layer */}
        <div className="relative z-10 w-full flex flex-col items-center animate-[fadeIn_0.5s_ease-out]">
        
        {/* Section 1: AI x Cross-border E-commerce */}
        <section className="w-full max-w-[1600px] p-8 md:p-16 pt-24 md:pt-32 flex flex-col items-center">
            <h2 className="text-3xl md:text-5xl font-light mb-16 md:mb-20 text-center tracking-wide">{t.section1Title}</h2>
            
            <div className="w-full max-w-7xl grid grid-cols-1 lg:grid-cols-2 gap-12 mb-16 items-center">
                {/* Logo Area */}
                <div className="flex flex-col items-center justify-center lg:items-start pl-0">
                    <FullLogo className="origin-center lg:origin-left transform scale-90 md:scale-100" />
                </div>
                
                {/* Description */}
                <div className="flex flex-col justify-center text-left">
                     <h3 className="text-2xl md:text-3xl font-normal mb-6">{t.section1Sub}</h3>
                     <p className="text-base md:text-lg opacity-90 leading-relaxed font-light">
                        {t.section1Desc}
                     </p>
                </div>
            </div>

            {/* Top Cards - Interactive */}
            <div className="w-full max-w-7xl grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <Card 
                    color="text-cyan-300" 
                    title={t.card1Title} 
                    desc={t.card1Desc} 
                    onClick={() => handleTopCardClick('check')}
                    showArrow
                />
                <Card 
                    color="text-orange-300" 
                    title={t.card2Title} 
                    desc={t.card2Desc} 
                    onClick={() => handleTopCardClick('eci')}
                    showArrow
                />
                <Card 
                    color="text-indigo-300" 
                    title={t.card3Title} 
                    desc={t.card3Desc} 
                    onClick={() => handleTopCardClick('logistics')}
                    showArrow
                />
                <Card 
                    color="text-yellow-300" 
                    title={t.card4Title} 
                    desc={t.card4Desc} 
                    onClick={() => handleTopCardClick('shopping')}
                    showArrow
                />
            </div>
        </section>

        {/* Section 2: AI x Infringement Radar */}
        {/* Removed min-h-screen to merge content better */}
        <section id="radar-section" className="w-full max-w-[1600px] p-8 md:p-16 pb-32 border-t border-white/10 flex flex-col items-center">
             <h2 className="text-3xl md:text-5xl font-light mb-16 md:mb-24 text-center tracking-wide">{t.section2Title}</h2>

             <div className="w-full max-w-7xl grid grid-cols-1 lg:grid-cols-2 gap-12 mb-20 items-center">
                {/* Left Icon */}
                <div className="flex items-center justify-center lg:justify-start gap-6">
                     <div className="bg-white/10 backdrop-blur-sm rounded-full p-4 border border-white/20">
                        <Sparkles className="w-16 h-16 md:w-24 md:h-24 text-white" strokeWidth={1.5} />
                     </div>
                     <span className="text-5xl md:text-7xl font-bold tracking-wider">{t.card1Title}</span>
                </div>

                {/* Right Description */}
                <div>
                    <h3 className="text-2xl md:text-3xl font-normal mb-4">{t.section2Sub}</h3>
                    <p className="text-base md:text-lg opacity-90 leading-relaxed font-light">
                         {t.section2Desc}
                    </p>
                </div>
             </div>

             {/* Cards */}
             <div className="w-full max-w-7xl grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                 <Card 
                    color="text-indigo-400" 
                    title={t.cardRadar1Title} 
                    desc={t.cardRadar1Desc}
                    onClick={() => handleRadarClick('trademark')}
                    showArrow
                />
                 <Card 
                    color="text-rose-400" 
                    title={t.cardRadar2Title} 
                    desc={t.cardRadar2Desc} 
                    onClick={() => handleRadarClick('patent')}
                    showArrow
                />
                 <Card 
                    color="text-emerald-400" 
                    title={t.cardRadar3Title} 
                    desc={t.cardRadar3Desc}
                    onClick={() => handleRadarClick('image')}
                    showArrow
                />
                 <Card 
                    color="text-amber-400" 
                    title={t.cardRadar4Title} 
                    desc={t.cardRadar4Desc} 
                    onClick={() => handleRadarClick('policy')}
                    showArrow
                />
             </div>
        </section>

        {/* Section 3: Pricing */}
        <section className="w-full max-w-[1600px] border-t border-white/10 bg-black/20">
             <Pricing onNavigate={onNavigate} language={language} isPage={true} />
        </section>

        </div> {/* End Content Layer */}

        {activeRadar && (
            <AILabModal 
                isOpen={!!activeRadar} 
                onClose={() => setActiveRadar(null)} 
                language={language}
                topic={activeRadar.title}
                systemInstruction={activeRadar.instruction}
                initialGreeting={activeRadar.greeting}
                onNavigate={onNavigate}
            />
        )}

        <style>{`
          @keyframes fadeIn {
            from { opacity: 0; }
            to { opacity: 1; }
          }
        `}</style>
    </div>
  );
};

const Card = ({color, title, desc, onClick, showArrow}: {color: string, title: string, desc: string, onClick?: () => void, showArrow?: boolean}) => (
    <div 
        onClick={onClick}
        className={`bg-white text-gray-800 p-8 rounded-xl shadow-lg hover:-translate-y-2 transition-transform duration-300 min-h-[200px] flex flex-col justify-start items-start group ${onClick ? 'cursor-pointer' : 'cursor-default'}`}
    >
        <div className={`mb-6 ${color} transform group-hover:scale-110 transition-transform duration-300`}>
            <Sparkles size={28} fill="currentColor" className="opacity-80" />
        </div>
        <h4 className="font-bold text-lg mb-3 text-slate-900">{title}</h4>
        <p className="text-sm text-gray-500 leading-relaxed font-light">{desc}</p>
        {onClick && showArrow && (
            <div className="mt-auto pt-4 text-sfc-blue text-xs font-bold opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-1">
                ACCESS <ArrowUpRight size={12} />
            </div>
        )}
    </div>
);

export default AISaaS;