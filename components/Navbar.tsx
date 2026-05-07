import React, { useState, useEffect } from 'react';
import { Menu, X, ChevronDown, Globe, User as UserIcon } from 'lucide-react';
import { EgretLogo } from './EgretLogo';
import { Page, Language } from '../types';
import { translations } from '../translations';
import { useAuth } from '../contexts/AuthContext';

interface NavbarProps {
  onNavigate: (page: Page) => void;
  currentPage: Page;
  language: Language;
  setLanguage: (lang: Language) => void;
}

const Navbar: React.FC<NavbarProps> = ({ onNavigate, currentPage, language, setLanguage }) => {
  const [isScrolled, setIsScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const t = translations[language].nav;
  const { user, logout } = useAuth();

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 50);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const handleNavClick = (key: string) => {
    onNavigate(key as Page);
    setMobileMenuOpen(false);
  };

  const navItems = [
    { key: 'home', label: t.home },
    { key: 'aiSaas', label: t.aiSaas }, // Matches 'ai-saas' in types via transformation or explicit check below
    { key: 'ecommerce', label: t.ecommerce },
  ];

  // Map keys to valid Page types if they differ
  const getPageKey = (key: string): Page => {
      if (key === 'aiSaas') return 'ai-saas';
      return key as Page;
  }

  const rightItems = [
    { key: 'news', label: t.news },
    { key: 'governance', label: t.governance },
    { key: 'about', label: t.about },
    { key: 'join', label: t.join },
  ];

  return (
    <nav
      className={`fixed top-0 left-0 w-full z-50 transition-all duration-300 ${
        isScrolled ? 'bg-black/90 backdrop-blur-md py-4 shadow-lg' : 'bg-transparent py-6'
      }`}
    >
      <div className="max-w-[1600px] w-full mx-auto px-4 md:px-8 xl:px-12 flex items-center justify-between flex-nowrap">
        {/* Left: Logo & Main Nav */}
        <div className={`flex items-center ${language === 'en' ? 'gap-3 xl:gap-8' : 'gap-6 xl:gap-12'} shrink-0`}>
          {/* Navbar Logo - Compact version for Header */}
          <div 
            className={`flex items-center ${language === 'en' ? 'gap-2 xl:gap-4' : 'gap-4'} cursor-pointer group shrink-0`} 
            onClick={() => onNavigate('home')}
          >
            <EgretLogo className="text-white group-hover:text-sfc-orange transition-colors shrink-0" size={language === 'en' ? 70 : 100} />
            <div className="flex flex-col leading-none shrink-0">
              <span className={`font-extrabold tracking-widest text-white whitespace-nowrap ${language === 'en' ? 'text-2xl xl:text-3xl' : 'text-3xl xl:text-4xl'}`}>{translations[(language || 'zh') as keyof typeof translations]?.brand?.title || '鹭起南洋'}</span>
              <span className={`text-sfc-orange font-bold text-right mt-1.5 whitespace-nowrap ${language === 'en' ? 'text-[10px] xl:text-[12px] tracking-wide' : 'text-[12px] xl:text-[14px] tracking-[0.2em]'}`}>{translations[(language || 'zh') as keyof typeof translations]?.brand?.subtitle || '扶摇直上'}</span>
            </div>
          </div>

          {/* Desktop Main Nav */}
          <div className={`hidden lg:flex items-center ${language === 'en' ? 'gap-3 xl:gap-6' : 'gap-6 xl:gap-8'} flex-nowrap shrink-0`}>
            {navItems.map((item) => (
              <button
                key={item.key}
                onClick={() => handleNavClick(getPageKey(item.key))}
                className={`text-sm font-medium transition-colors relative whitespace-nowrap shrink-0 ${
                  currentPage === getPageKey(item.key)
                    ? 'text-white'
                    : 'text-gray-300 hover:text-white'
                }`}
              >
                {item.label}
                {currentPage === getPageKey(item.key) && (
                    <span className="absolute -bottom-2 left-0 w-full h-0.5 bg-sfc-orange rounded-full"></span>
                )}
              </button>
            ))}
          </div>
        </div>

        {/* Right: Language & Secondary Nav */}
        <div className={`hidden lg:flex items-center ${language === 'en' ? 'gap-3 xl:gap-5' : 'gap-5 xl:gap-6'} flex-nowrap shrink-0`}>
            {/* Language Dropdown */}
            <div className="relative group py-2 shrink-0">
                <div 
                  className="flex items-center gap-1 text-sm text-gray-300 cursor-pointer group-hover:text-white select-none whitespace-nowrap shrink-0"
                >
                    <Globe size={14} className="shrink-0" />
                    <span className="whitespace-nowrap">Language | 语言</span>
                    <ChevronDown size={14} className="transition-transform group-hover:rotate-180 shrink-0" />
                </div>
                
                {/* Dropdown Menu */}
                <div className="absolute right-0 top-full pt-2 w-32 hidden group-hover:block animate-[fadeIn_0.2s_ease-out]">
                    <div className="bg-white rounded-lg shadow-xl overflow-hidden py-1">
                        <button 
                            onClick={() => setLanguage('zh')}
                            className={`w-full text-left px-4 py-3 text-sm hover:bg-gray-100 transition-colors ${language === 'zh' ? 'text-sfc-blue font-bold' : 'text-gray-800'}`}
                        >
                            简体中文
                        </button>
                        <button 
                            onClick={() => setLanguage('en')}
                            className={`w-full text-left px-4 py-3 text-sm hover:bg-gray-100 transition-colors ${language === 'en' ? 'text-sfc-blue font-bold' : 'text-gray-800'}`}
                        >
                            English
                        </button>
                    </div>
                </div>
            </div>
            
            {rightItems.map((item) => (
               <button 
                 key={item.key} 
                 onClick={() => handleNavClick(item.key as Page)}
                 className={`flex items-center gap-1 text-sm transition-colors whitespace-nowrap shrink-0 ${currentPage === item.key ? 'text-sfc-orange font-bold' : 'text-gray-300 hover:text-white'}`}
               >
                    {item.label}
               </button>
            ))}

            {/* Auth section */}
            <div className="relative group py-2 xl:ml-2 shrink-0">
               {user ? (
                   <>
                       <div className="flex items-center gap-2 cursor-pointer border border-zinc-700 px-3 py-1.5 rounded-full hover:border-sfc-blue transition-colors shrink-0 whitespace-nowrap">
                           <UserIcon size={14} className="text-sfc-blue shrink-0" />
                           <span className="text-sm font-medium text-white truncate max-w-[100px] xl:max-w-[120px]">{user.name || user.email}</span>
                       </div>
                       <div className="absolute right-0 top-full pt-2 w-48 hidden group-hover:block animate-[fadeIn_0.2s_ease-out]">
                           <div className="bg-white rounded-lg shadow-xl overflow-hidden py-1">
                               <button 
                                   onClick={() => { onNavigate('dashboard'); setMobileMenuOpen(false); }}
                                   className="w-full text-left px-4 py-3 text-sm hover:bg-gray-100 transition-colors text-gray-800 flex items-center gap-2"
                               >
                                   {t.userCenter}
                               </button>
                               {user.role === 'admin' && (
                                   <button 
                                       onClick={() => { onNavigate('admin'); setMobileMenuOpen(false); }}
                                       className="w-full text-left px-4 py-3 text-sm hover:bg-gray-100 transition-colors text-purple-600 flex items-center gap-2 font-semibold"
                                   >
                                       {t.adminPanel}
                                   </button>
                               )}
                               <button 
                                   onClick={() => { logout(); onNavigate('home'); setMobileMenuOpen(false); }}
                                   className="w-full text-left px-4 py-2 text-sm hover:bg-red-50 text-red-600 transition-colors"
                               >
                                   {t.logout}
                               </button>
                           </div>
                       </div>
                   </>
               ) : (
                   <button 
                       onClick={() => onNavigate('login')}
                       className="bg-sfc-blue text-white px-4 xl:px-5 py-2 rounded-full text-sm font-bold hover:bg-blue-600 transition-colors whitespace-nowrap shrink-0"
                   >
                       {t.loginRegister}
                   </button>
               )}
            </div>
        </div>

        {/* Mobile Menu Button */}
        <button
          className="lg:hidden text-white"
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
        >
          {mobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
        </button>
      </div>

      {/* Mobile Menu Overlay */}
      {mobileMenuOpen && (
        <div className="absolute top-full left-0 w-full bg-black/95 backdrop-blur-xl border-t border-gray-800 p-6 flex flex-col gap-4 lg:hidden h-screen">
           <div className="flex flex-col gap-2 py-2 border-b border-gray-800">
               <span className="text-gray-500 text-sm mb-1">Language | 语言</span>
               <button 
                 onClick={() => { setLanguage('zh'); setMobileMenuOpen(false); }}
                 className={`text-left text-lg ${language === 'zh' ? 'text-sfc-orange font-bold' : 'text-gray-300'}`}
               >
                 简体中文
               </button>
               <button 
                 onClick={() => { setLanguage('en'); setMobileMenuOpen(false); }}
                 className={`text-left text-lg ${language === 'en' ? 'text-sfc-orange font-bold' : 'text-gray-300'}`}
               >
                 English
               </button>
           </div>
          
          {[...navItems, ...rightItems].map((item) => (
            <button
              key={item.key}
              onClick={() => handleNavClick(getPageKey(item.key))}
              className={`text-left text-lg py-3 border-b border-gray-800 w-full ${currentPage === getPageKey(item.key) ? 'text-sfc-orange' : 'text-gray-300'}`}
            >
              {item.label}
            </button>
          ))}
        </div>
      )}
      <style>{`
          @keyframes fadeIn {
            from { opacity: 0; transform: translateY(-5px); }
            to { opacity: 1; transform: translateY(0); }
          }
        `}</style>
    </nav>
  );
};

export default Navbar;