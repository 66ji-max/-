import React, { useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { translations } from '../../translations';

export const Register: React.FC<{ onNavigate: (page: any) => void; language: string }> = ({ onNavigate, language }) => {
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const { login } = useAuth();
  const t = translations[language as keyof typeof translations].auth;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password !== confirmPassword) {
      setError(t.passwordMismatch);
      return;
    }
    
    const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).{8,}$/;
    if (!passwordRegex.test(password)) {
      setError(t.weakPassword);
      return;
    }

    try {
      const res = await fetch('/api/auth?action=register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, email, password })
      });
      
      const text = await res.text();
      let data;
      try {
        data = JSON.parse(text);
      } catch (parseErr) {
        throw new Error(text || t.systemError);
      }
      
      if (!res.ok) {
        if (data.code === 'EMAIL_EXISTS') {
            throw new Error(t.emailInUse);
        }
        if (data.code === 'WEAK_PASSWORD') {
            throw new Error(t.weakPassword);
        }
        throw new Error(data.error || t.registerFailed);
      }
      
      login(data.token, data.user);
      onNavigate('dashboard');
    } catch (err: any) {
      setError(err.message);
    }
  };

  return (
    <div className="pt-32 pb-20 flex justify-center px-4">
      <form onSubmit={handleSubmit} className="bg-white/5 p-8 rounded-xl border border-white/10 w-full max-w-md animate-[fadeIn_0.4s_ease-out]">
        <h2 className="text-2xl font-bold mb-6 text-white">{t.registerTitle}</h2>
        {error && <div className="text-red-400 text-sm mb-4">{error}</div>}
        <input type="text" placeholder={t.username} value={username} onChange={e => setUsername(e.target.value)} required className="w-full mb-4 p-3 bg-black/40 border border-white/10 rounded-lg text-white focus:outline-none focus:border-sfc-orange" />
        <input type="email" placeholder={t.email} value={email} onChange={e => setEmail(e.target.value)} required className="w-full mb-4 p-3 bg-black/40 border border-white/10 rounded-lg text-white focus:outline-none focus:border-sfc-orange" />
        <input type="password" placeholder={t.password} value={password} onChange={e => setPassword(e.target.value)} required className="w-full mb-4 p-3 bg-black/40 border border-white/10 rounded-lg text-white focus:outline-none focus:border-sfc-orange" />
        <input type="password" placeholder={t.confirmPassword} value={confirmPassword} onChange={e => setConfirmPassword(e.target.value)} required className="w-full mb-6 p-3 bg-black/40 border border-white/10 rounded-lg text-white focus:outline-none focus:border-sfc-orange" />
        <button type="submit" className="w-full bg-sfc-orange text-white font-bold py-3 rounded-full hover:bg-orange-600 transition-colors">{t.registerBtn}</button>
        <p className="mt-4 text-center text-sm text-gray-400">
          {t.hasAccount} <span onClick={() => onNavigate('login')} className="text-sfc-blue cursor-pointer hover:underline">{t.loginBtn}</span>
        </p>
      </form>
    </div>
  );
};
