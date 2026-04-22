import React, { useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { translations } from '../../translations';

export const Login: React.FC<{ onNavigate: (page: any) => void; language: string }> = ({ onNavigate, language }) => {
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const { login } = useAuth();
  const t = translations[language as keyof typeof translations].auth;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch('/api/auth?action=login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ identifier, password })
      });
      
      const text = await res.text();
      let data;
      try {
        data = JSON.parse(text);
      } catch (parseErr) {
        throw new Error(text || t.systemError);
      }
      
      if (!res.ok) throw new Error(data.error || t.loginFailed);
      
      login(data.token, data.user);
      onNavigate('dashboard');
    } catch (err: any) {
      setError(err.message);
    }
  };

  return (
    <div className="pt-32 pb-20 flex justify-center px-4">
      <form onSubmit={handleSubmit} className="bg-white/5 p-8 rounded-xl border border-white/10 w-full max-w-md animate-[fadeIn_0.4s_ease-out]">
        <h2 className="text-2xl font-bold mb-6 text-white">{t.loginTitle}</h2>
        {error && <div className="text-red-400 text-sm mb-4">{error}</div>}
        <input type="text" placeholder={t.emailOrUsername} value={identifier} onChange={e => setIdentifier(e.target.value)} required className="w-full mb-4 p-3 bg-black/40 border border-white/10 rounded-lg text-white focus:outline-none focus:border-sfc-orange" />
        <input type="password" placeholder={t.password} value={password} onChange={e => setPassword(e.target.value)} required className="w-full mb-6 p-3 bg-black/40 border border-white/10 rounded-lg text-white focus:outline-none focus:border-sfc-orange" />
        <button type="submit" className="w-full bg-sfc-blue text-white font-bold py-3 rounded-full hover:bg-blue-600 transition-colors">{t.loginBtn}</button>
        <p className="mt-4 text-center text-sm text-gray-400">
          {t.noAccount} <span onClick={() => onNavigate('register')} className="text-sfc-orange cursor-pointer hover:underline">{t.registerBtn}</span>
        </p>
      </form>
    </div>
  );
};
