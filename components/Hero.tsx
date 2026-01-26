import React, { useState } from 'react';
import { ArrowUpRight } from 'lucide-react';
import AILabModal from './AILabModal';
import ParticleBackground from './ParticleBackground';
import { Language } from '../types';
import { translations } from '../translations';

interface HeroProps {
  language: Language;
}

const Hero: React.FC<HeroProps> = ({ language }) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const t = translations[language].hero;

  return (
    <div className="relative w-full h-screen overflow-hidden flex items-center justify-center bg-[#0a0a1a]">
      {/* Background Image with Overlay */}
      <div className="absolute inset-0 z-0">
         <img
          src="https://images.unsplash.com/photo-1451187580459-43490279c0fa?q=80&w=2072&auto=format&fit=crop"
          alt="Global Digital Logistics Network"
          className="w-full h-full object-cover opacity-60"
        />
        
        {/* Radial Gradient overlay to vignette the edges and darken center slightly */}
        <div className="absolute inset-0 bg-gradient-to-b from-black/40 via-transparent to-black/80"></div>
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_transparent_0%,_#0a0a1a_90%)]"></div>
      </div>

      {/* Particle Effect Layer */}
      <ParticleBackground />

      {/* Content Container */}
      <div className="relative z-10 max-w-[1200px] w-full px-8 md:px-12 flex flex-col justify-center h-full pt-20">
        
        {/* Main Headline */}
        <div className="space-y-4 md:space-y-6 mb-16 mt-12 text-center md:text-left">
          <h1 className="text-4xl md:text-6xl lg:text-7xl font-bold text-white tracking-tight leading-tight opacity-0 animate-[slideUp_1s_ease-out_0.5s_forwards]">
            {t.line1}
          </h1>
          <h1 className="text-4xl md:text-6xl lg:text-7xl font-light text-white tracking-tight leading-tight opacity-0 animate-[slideUp_1s_ease-out_0.8s_forwards]">
            {t.line2}<br className="md:hidden" />{t.line2_sub}
          </h1>
        </div>

        {/* Call to Action Button (Left) */}
        <div className="opacity-0 animate-[fadeIn_1s_ease-out_1.2s_forwards] flex justify-center md:justify-start">
          <button 
            onClick={() => setIsModalOpen(true)}
            className="group flex items-center gap-2 px-8 py-3 border border-white/80 rounded-full text-white text-lg font-light hover:bg-white hover:text-black transition-all duration-300 backdrop-blur-sm"
          >
            {t.aiButton}
            <ArrowUpRight size={20} className="group-hover:translate-x-1 group-hover:-translate-y-1 transition-transform" />
          </button>
        </div>
      </div>

      {/* Abstract Glowing Elements */}
      <div className="absolute top-1/2 left-1/4 w-96 h-96 bg-purple-600/20 blur-[100px] rounded-full mix-blend-screen pointer-events-none animate-pulse"></div>
      <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-blue-600/10 blur-[100px] rounded-full mix-blend-screen pointer-events-none"></div>

      {/* Modal */}
      <AILabModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} language={language} />
      
      <style>{`
        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        @keyframes slideUp {
          from { opacity: 0; transform: translateY(20px); }
          to { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </div>
  );
};

export default Hero;
