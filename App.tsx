import React, { useState, useEffect } from 'react';
import Navbar from './components/Navbar';
import Hero from './components/Hero';
import AISaaS from './components/AISaaS';
import GenericPage from './components/GenericPage';
import { Page, Language } from './types';
import { translations } from './translations';
import { AuthProvider } from './contexts/AuthContext';
import { Login } from './components/Auth/Login';
import { Register } from './components/Auth/Register';
import { Dashboard } from './components/Dashboard/Dashboard';
import { AdminPanel } from './components/Admin/AdminPanel';

import { IngredientCheckApp } from './components/IngredientCheckApp';

function AppContent() {
  const [currentPage, setCurrentPage] = useState<Page>('home');
  const [language, setLanguage] = useState<Language>('zh');

  // Scroll to top whenever currentPage changes
  useEffect(() => {
    if (sessionStorage.getItem('aiScrollTarget') === 'pricing') {
       return;
    }
    window.scrollTo(0, 0);
  }, [currentPage]);

  const getPageTitle = (page: Page) => {
      switch(page) {
          case 'ecommerce': return language === 'zh' ? '跨境电商解决方案' : 'Cross-border E-commerce Solutions';
          case 'news': return language === 'zh' ? '资讯' : 'News';
          case 'governance': return language === 'zh' ? '公司治理' : 'Governance';
          case 'about': return language === 'zh' ? '关于我们' : 'About Us';
          case 'join': return language === 'zh' ? '加入我们' : 'Join Us';
          default: return '';
      }
  };

  const renderPage = () => {
    switch (currentPage) {
      case 'home':
        return <Hero language={language} onNavigate={setCurrentPage} />;
      case 'ai-saas':
        return <AISaaS language={language} onNavigate={setCurrentPage} />;
      case 'login':
        return <Login onNavigate={setCurrentPage} language={language} />;
      case 'register':
        return <Register onNavigate={setCurrentPage} language={language} />;
      case 'dashboard':
        return <Dashboard onNavigate={setCurrentPage} language={language} />;
      case 'admin':
        return <AdminPanel onNavigate={setCurrentPage} language={language} />;
      case 'ingredient-check':
        return <IngredientCheckApp onNavigate={setCurrentPage} language={language} />;
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

function App() {
    return (
        <AuthProvider>
            <AppContent />
        </AuthProvider>
    );
}

export default App;