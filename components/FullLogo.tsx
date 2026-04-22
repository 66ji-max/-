import React from 'react';
import { EgretLogo } from './EgretLogo';

interface FullLogoProps {
  className?: string;
  scale?: number;
}

export const FullLogo: React.FC<FullLogoProps> = ({ className = '', scale = 1 }) => {
  return (
    <div className={`flex flex-col items-center select-none ${className}`} style={{ transform: `scale(${scale})` }}>
        <div className="flex items-center gap-3">
            <div className="mb-2">
                <EgretLogo size={60} className="text-white" />
            </div>
            <div className="flex flex-col">
                <h1 className="text-6xl font-extrabold text-white tracking-wide leading-none" style={{ fontFamily: 'sans-serif' }}>
                    鹭起南洋
                </h1>
            </div>
        </div>
        <div className="w-full pl-20 pr-1">
            <div className="w-full h-[6px] bg-[#ff6b00] rounded-full my-3"></div>
            <div className="flex justify-between w-full px-1">
                <span className="text-lg font-bold text-white tracking-widest">扶摇直上</span>
            </div>
        </div>
    </div>
  );
};
