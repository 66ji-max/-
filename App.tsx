import React, { useState } from 'react';
import Navbar from './components/Navbar';
import Hero from './components/Hero';
import AISaaS from './components/AISaaS';
import { Page, Language } from './types';

function App() {
  const [currentPage, setCurrentPage] = useState<Page>('home');
  const [language, setLanguage] = useState<Language>('zh');

  return (
    <div className="min-h-screen bg-sfc-dark text-white font-sans selection:bg-sfc-orange selection:text-white">
      <Navbar 
        onNavigate={setCurrentPage} 
        currentPage={currentPage}
        language={language}
        setLanguage={setLanguage}
      />
      <main>
        {currentPage === 'home' ? (
          <Hero language={language} />
        ) : (
          <AISaaS language={language} />
        )}
      </main>
    </div>
  );
}

export default App;