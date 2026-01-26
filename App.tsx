import React, { useState, useEffect } from 'react';
import Navbar from './components/Navbar';
import Hero from './components/Hero';
import AISaaS from './components/AISaaS';
import GenericPage from './components/GenericPage';
import { Page, Language } from './types';
import { translations } from './translations';

function App() {
  const [currentPage, setCurrentPage] = useState<Page>('home');
  const [language, setLanguage] = useState<Language>('zh');

  // Scroll to top whenever currentPage changes
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [currentPage]);

  const getPageTitle = (page: Page) => {
      // Map page key to translation title
      const t = translations[language].nav;
      switch(page) {
          case 'ecommerce': return t.ecommerce;
          case 'news': return t.news;
          case 'governance': return t.governance;
          case 'about': return t.about;
          case 'join': return t.join;
          default: return '';
      }
  };

  const renderPage = () => {
    switch (currentPage) {
      case 'home':
        return <Hero language={language} />;
      case 'ai-saas':
        return <AISaaS language={language} />;
      case 'ecommerce':
      case 'news':
      case 'governance':
      case 'about':
      case 'join':
        return (
            <GenericPage 
                title={getPageTitle(currentPage)} 
                language={language} 
                type={currentPage}
            />
        );
      default:
        return <Hero language={language} />;
    }
  };

  return (
    <div className="min-h-screen bg-sfc-dark text-white font-sans selection:bg-sfc-orange selection:text-white">
      <Navbar 
        onNavigate={setCurrentPage} 
        currentPage={currentPage}
        language={language}
        setLanguage={setLanguage}
      />
      <main>
        {renderPage()}
      </main>
    </div>
  );
}

export default App;