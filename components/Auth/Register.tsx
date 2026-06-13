import React, { useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { translations } from '../../translations';

export const Register: React.FC<{ onNavigate: (page: any) => void; language: string }> = ({ onNavigate, language }) => {
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const { login } = useAuth();
  const t = translations[language as keyof typeof translations].auth as any;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!username.trim()) {
      setError(t.validation.requiredUsername);
      document.getElementById('register-username')?.focus();
      return;
    }
    if (!email.trim()) {
      setError(t.validation.requiredEmail);
      document.getElementById('register-email')?.focus();
      return;
    }
    if (!password) {
      setError(t.validation.requiredPassword);
      document.getElementById('register-password')?.focus();
      return;
    }
    if (!confirmPassword) {
      setError(t.validation.requiredConfirmPassword);
      document.getElementById('register-confirm-password')?.focus();
      return;
    }
    
    if (password !== confirmPassword) {
      setError(t.passwordMismatch);
      return;
    }
    
    const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).{8,}$/;
    if (!passwordRegex.test(password)) {
      setError(t.weakPassword);
      return;
    }

    setIsLoading(true);
    try {
      const res = await fetch('/api/auth?action=register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, email, password })
      });
      
      if (!res.ok && res.status >= 500) {
        throw new Error(language === 'zh' ? '系统错误，请稍后再试' : 'System error, please try again');
      }
      const text = await res.text();
      let data;
      try {
        data = JSON.parse(text);
      } catch (parseErr) {
        throw new Error(language === 'zh' ? '系统错误，请稍后再试' : 'System error, please try again');
      }
      
      if (!res.ok) {
        if (data.code === 'USERNAME_EXISTS') {
            throw new Error(t.usernameInUse || 'Username already exists');
        }
        if (data.code === 'EMAIL_EXISTS') {
            throw new Error(t.emailInUse);
        }
        if (data.code === 'USERNAME_REQUIRED') {
            throw new Error(t.validation?.requiredUsername || 'Please enter your username');
        }
        if (data.code === 'WEAK_PASSWORD') {
            throw new Error(t.weakPassword);
        }
        if (data.code === 'DUPLICATE_VALUE') {
            throw new Error(t.duplicateAccountInfo || 'This account information is already in use. Please try another one.');
        }
        throw new Error(t.registerFailedDetailed || t.registerFailed || 'Registration failed. Please try again');
      }
      
      login(data.token, data.user);
      onNavigate('dashboard');
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="pt-32 pb-20 flex justify-center px-4">
      <form onSubmit={handleSubmit} noValidate className="bg-white/5 p-8 rounded-xl border border-white/10 w-full max-w-md animate-[fadeIn_0.4s_ease-out]">
        <h2 className="text-2xl font-bold mb-6 text-white">{t.registerTitle}</h2>
        {error && <div className="text-red-400 text-sm mb-4">{error}</div>}
        <input id="register-username" type="text" placeholder={t.username} value={username} onChange={e => {setUsername(e.target.value); setError('');}} onKeyDown={(e) => { if (e.key === 'Enter') handleSubmit(e); }} className={`w-full mb-4 p-3 bg-black/40 border rounded-lg text-white focus:outline-none focus:border-sfc-orange ${error === t.validation?.requiredUsername || error === t.usernameInUse ? 'border-red-400/60' : 'border-white/10'}`} />
        <input id="register-email" type="email" placeholder={t.email} value={email} onChange={e => {setEmail(e.target.value); setError('');}} onKeyDown={(e) => { if (e.key === 'Enter') handleSubmit(e); }} className={`w-full mb-4 p-3 bg-black/40 border rounded-lg text-white focus:outline-none focus:border-sfc-orange ${error === t.validation?.requiredEmail || error === t.emailInUse ? 'border-red-400/60' : 'border-white/10'}`} />
        <input id="register-password" type="password" placeholder={t.password} value={password} onChange={e => {setPassword(e.target.value); setError('');}} onKeyDown={(e) => { if (e.key === 'Enter') handleSubmit(e); }} className={`w-full mb-4 p-3 bg-black/40 border rounded-lg text-white focus:outline-none focus:border-sfc-orange ${error === t.validation?.requiredPassword || error === t.weakPassword ? 'border-red-400/60' : 'border-white/10'}`} />
        <input id="register-confirm-password" type="password" placeholder={t.confirmPassword} value={confirmPassword} onChange={e => {setConfirmPassword(e.target.value); setError('');}} onKeyDown={(e) => { if (e.key === 'Enter') handleSubmit(e); }} className={`w-full mb-6 p-3 bg-black/40 border rounded-lg text-white focus:outline-none focus:border-sfc-orange ${error === t.validation?.requiredConfirmPassword || error === t.passwordMismatch ? 'border-red-400/60' : 'border-white/10'}`} />
        
        <button 
          type="submit" 
          disabled={isLoading}
          className={`w-full bg-sfc-orange text-white font-bold py-3 rounded-full transition-colors flex items-center justify-center gap-2 ${isLoading ? 'opacity-70 cursor-not-allowed' : 'hover:bg-orange-600'}`}
        >
          {isLoading ? (
            <>
              <span className="inline-block h-4 w-4 animate-spin rounded-full border-2 border-white/40 border-t-white"></span>
              <span>{t.registering || 'Creating account...'}</span>
            </>
          ) : (
            t.registerBtn
          )}
        </button>
        
        <p className="mt-4 text-center text-sm text-gray-400">
          {t.hasAccount} <span onClick={() => onNavigate('login')} className="text-sfc-blue cursor-pointer hover:underline">{t.loginBtn}</span>
        </p>
      </form>
    </div>
  );
};
