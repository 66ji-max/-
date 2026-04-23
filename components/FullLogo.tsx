import React from 'react';
import { EgretLogo } from './EgretLogo';
import { translations } from '../translations';

interface FullLogoProps {
  className?: string;
  scale?: number;
  language?: string;
}

export const FullLogo: React.FC<FullLogoProps> = ({ className = '', scale = 1, language = 'zh' }) => {
  const t = translations[language as keyof typeof translations]?.brand || translations.zh.brand;
  const subtitleChars = t.subtitle.split('');
  
  return (
    <div className={`flex flex-col items-center select-none ${className}`} style={{ transform: `scale(${scale})` }}>
        <div className="flex items-center gap-3">
            {/* Icon */}
            <div className="mb-2">
                <EgretLogo size={60} className="text-white" />
            </div>
            
            {/* Text Block */}
            <div className="flex flex-col">
                {/* Main Title */}
                <h1 className="text-6xl font-extrabold text-white tracking-wide leading-none" style={{ fontFamily: 'sans-serif' }}>
                    {t.title}
                </h1>
            </div>
        </div>

        {/* Decoration Line and Subtitle Container - Aligned with text width roughly */}
        <div className="w-full pl-20 pr-1"> {/* Padding to offset icon width visually */}
             {/* Orange Line */}
            <div className="w-full h-[6px] bg-[#ff6b00] rounded-full my-3"></div>
            
            {/* Subtitle */}
            <div className="flex justify-between w-full px-1">
                {subtitleChars.map((char, index) => (
                   <span key={index} className="text-lg font-bold text-white tracking-widest">{char}</span>
                ))}
            </div>
        </div>
    </div>
  );
};
