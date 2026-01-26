import React from 'react';
import { Sparkles, ArrowUpRight } from 'lucide-react';
import { EgretLogo } from './EgretLogo';
import { Language } from '../types';
import { translations } from '../translations';

interface AISaaSProps {
  language: Language;
}

const AISaaS: React.FC<AISaaSProps> = ({ language }) => {
  const t = translations[language].aiSaas;

  return (
    <div className="bg-sfc-blue min-h-screen w-full text-white font-sans animate-[fadeIn_0.5s_ease-out]">
        {/* Section 1: AI x Cross-border E-commerce */}
        <section className="min-h-screen flex flex-col items-center justify-center p-8 md:p-16 relative pt-24 md:pt-32">
            <h2 className="text-3xl md:text-5xl font-light mb-16 md:mb-24 text-center tracking-wide">{t.section1Title}</h2>
            
            <div className="w-full max-w-7xl grid grid-cols-1 lg:grid-cols-2 gap-12 mb-16 items-center">
                {/* Logo Area */}
                <div className="flex flex-col items-start md:items-center lg:items-start pl-4 md:pl-0">
                    <div className="w-auto">
                        {/* 鹭起南洋 Logo Recreation */}
                         <div className="flex flex-col leading-none relative group">
                            <div className="flex items-center gap-4 mb-2">
                                <EgretLogo size={64} className="text-white opacity-90" />
                                <span className="text-6xl md:text-8xl font-black tracking-tight text-white drop-shadow-md">鹭起南洋</span>
                            </div>
                            <div className="h-2 md:h-3 bg-[#ff6b00] w-full mt-2 rounded-full transform -skew-x-[20deg] translate-x-4"></div>
                            <span className="text-xl md:text-3xl mt-4 font-bold tracking-[0.5em] text-white text-right w-full">扶摇直上</span>
                        </div>
                    </div>
                </div>
                
                {/* Description */}
                <div className="flex flex-col justify-center text-left">
                     <h3 className="text-2xl md:text-3xl font-normal mb-6">{t.section1Sub}</h3>
                     <p className="text-base md:text-lg opacity-90 leading-relaxed font-light">
                        {t.section1Desc}
                     </p>
                </div>
            </div>

            {/* Cards */}
            <div className="w-full max-w-7xl grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <Card 
                    color="text-cyan-300" 
                    title={t.card1Title} 
                    desc={t.card1Desc} 
                />
                <Card 
                    color="text-orange-300" 
                    title={t.card2Title} 
                    desc={t.card2Desc} 
                />
                <Card 
                    color="text-indigo-300" 
                    title={t.card3Title} 
                    desc={t.card3Desc} 
                />
                <Card 
                    color="text-yellow-300" 
                    title={t.card4Title} 
                    desc={t.card4Desc} 
                />
            </div>
        </section>

        {/* Section 2: AI x Infringement Radar */}
        <section className="min-h-screen flex flex-col items-center justify-center p-8 md:p-16 relative border-t border-white/10 pt-24 md:pt-32">
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
                    <p className="text-base md:text-lg opacity-90 leading-relaxed mb-8 font-light">
                         {t.section2Desc}
                    </p>
                    <button className="flex items-center gap-2 border border-white/40 hover:bg-white hover:text-sfc-blue px-6 py-2.5 rounded transition-all duration-300 group">
                        <span>{t.btnWebsite}</span>
                        <ArrowUpRight size={18} className="group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
                    </button>
                </div>
             </div>

             {/* Cards */}
             <div className="w-full max-w-7xl grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                 <Card 
                    color="text-indigo-400" 
                    title={t.cardRadar1Title} 
                    desc={t.cardRadar1Desc} 
                />
                 <Card 
                    color="text-rose-400" 
                    title={t.cardRadar2Title} 
                    desc={t.cardRadar2Desc} 
                />
                 <Card 
                    color="text-emerald-400" 
                    title={t.cardRadar3Title} 
                    desc={t.cardRadar3Desc} 
                />
                 <Card 
                    color="text-amber-400" 
                    title={t.cardRadar4Title} 
                    desc={t.cardRadar4Desc} 
                />
             </div>
        </section>
        <style>{`
          @keyframes fadeIn {
            from { opacity: 0; }
            to { opacity: 1; }
          }
        `}</style>
    </div>
  );
};

const Card = ({color, title, desc}: {color: string, title: string, desc: string}) => (
    <div className="bg-white text-gray-800 p-8 rounded-xl shadow-lg hover:-translate-y-2 transition-transform duration-300 min-h-[200px] flex flex-col justify-start items-start group cursor-default">
        <div className={`mb-6 ${color} transform group-hover:scale-110 transition-transform duration-300`}>
            <Sparkles size={28} fill="currentColor" className="opacity-80" />
        </div>
        <h4 className="font-bold text-lg mb-3 text-slate-900">{title}</h4>
        <p className="text-sm text-gray-500 leading-relaxed font-light">{desc}</p>
    </div>
);

export default AISaaS;