import React, { useState } from 'react';
import { Eye, EyeOff } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { translations } from '../../translations';

export const Login: React.FC<{ onNavigate: (page: any) => void; language: string }> = ({ onNavigate, language }) => {
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [rememberMe, setRememberMe] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const formRef = React.useRef<HTMLFormElement | null>(null);
  const { login } = useAuth();
  const t = translations[language as keyof typeof translations].auth as any;

  React.useEffect(() => {
    const rememberedId = localStorage.getItem('rememberedIdentifier');
    if (rememberedId) {
      setIdentifier(rememberedId);
    }
    const isRemembered = localStorage.getItem('rememberMe') === 'true';
    setRememberMe(isRemembered);
  }, []);

  const maybeStorePasswordCredential = async () => {
    try {
      if (
        formRef.current &&
        'credentials' in navigator &&
        'PasswordCredential' in window
      ) {
        const credential = new (window as any).PasswordCredential(formRef.current);
        await navigator.credentials.store(credential);
      }
    } catch (err) {
      console.warn('Password credential store was skipped:', err);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    
    if (!identifier.trim()) {
      setError(t.validation.requiredIdentifier);
      document.getElementById('login-identifier')?.focus();
      return;
    }
    if (!password) {
      setError(t.validation.requiredPassword);
      document.getElementById('login-password')?.focus();
      return;
    }

    setIsLoading(true);
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
        throw new Error(language === 'zh' ? '系统错误，请稍后再试' : 'System error, please try again');
      }
      
      if (!res.ok) {
        if (data.code === 'PRISMA_MODULE_LOAD_FAILED') {
          throw new Error(
            language === 'zh'
              ? '后端数据库模块加载失败，请检查部署日志'
              : 'Backend database module failed to load. Please check deployment logs.'
          );
        }
        if (data.code === 'PASSWORD_HASH_MISSING') {
          throw new Error(
            language === 'zh'
              ? '该账号密码数据异常，请重新注册或联系管理员'
              : 'This account has invalid password data. Please re-register or contact admin.'
          );
        }
        if (data.code === 'LOGIN_SYSTEM_ERROR') {
          throw new Error(
            language === 'zh'
              ? '登录服务异常，请稍后再试'
              : 'Login service error. Please try again later.'
          );
        }
        if (data.code === 'DATABASE_CONNECTION_FAILED' || data.code === 'PRISMA_INIT_FAILED') {
          throw new Error(language === 'zh' ? '数据库连接失败，请检查 Vercel 数据库环境变量' : 'Database connection failed. Please check Vercel database environment variables.');
        }
        if (data.code === 'PASSWORD_VERIFIER_FAILED') {
          throw new Error(language === 'zh' ? '密码验证服务异常，请稍后重试' : 'Password verification service error. Please try again later.');
        }
        if (data.code === 'INVALID_CREDENTIALS') {
          throw new Error(language === 'zh' ? '邮箱或用户名或密码错误' : 'Invalid email/username or password');
        }
        if (data.code === 'MISSING_CREDENTIALS') {
          throw new Error(t.validation?.requiredIdentifier || (language === 'zh' ? '请输入邮箱/用户名和密码' : 'Missing credentials'));
        }
        throw new Error(data.error || t.loginFailed || (language === 'zh' ? '登录失败' : 'Login failed'));
      }
      
      if (rememberMe) {
        localStorage.setItem('rememberedIdentifier', identifier);
        localStorage.setItem('rememberMe', 'true');
      } else {
        localStorage.removeItem('rememberedIdentifier');
        localStorage.removeItem('rememberMe');
      }
      
      login(data.token, data.user, rememberMe);
      setIsLoading(false);
      
      await maybeStorePasswordCredential();
      
      setTimeout(() => {
        onNavigate('dashboard');
      }, 100);
    } catch (err: any) {
      setError(err.message);
      setIsLoading(false);
    }
  };

  return (
    <div className="pt-32 pb-20 flex justify-center px-4">
      <form ref={formRef} onSubmit={handleSubmit} noValidate autoComplete="on" className="bg-white/5 p-8 rounded-xl border border-white/10 w-full max-w-md animate-[fadeIn_0.4s_ease-out]">
        <h2 className="text-2xl font-bold mb-6 text-white">{t.loginTitle}</h2>
        {error && <div className="text-red-400 text-sm mb-4">{error}</div>}
        <input id="login-identifier" name="username" autoComplete="username" type="text" placeholder={t.emailOrUsername} value={identifier} onChange={e => {setIdentifier(e.target.value); setError('');}} className={`w-full mb-4 p-3 bg-black/40 border rounded-lg text-white focus:outline-none focus:border-sfc-orange ${error === t.validation.requiredIdentifier ? 'border-red-400/60' : 'border-white/10'}`} />
        <div className="relative w-full mb-4">
          <input id="login-password" name="password" autoComplete="current-password" type={showPassword ? 'text' : 'password'} placeholder={t.password} value={password} onChange={e => {setPassword(e.target.value); setError('');}} className={`w-full p-3 pr-10 bg-black/40 border rounded-lg text-white focus:outline-none focus:border-sfc-orange ${error === t.validation.requiredPassword ? 'border-red-400/60' : 'border-white/10'}`} />
          <button
            type="button"
            onClick={() => setShowPassword(!showPassword)}
            className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-white transition-colors"
            aria-label={showPassword ? (t.hidePassword || 'Hide password') : (t.showPassword || 'Show password')}
            title={showPassword ? (t.hidePassword || 'Hide password') : (t.showPassword || 'Show password')}
          >
            {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
          </button>
        </div>
        
        <div className="flex flex-col mb-6">
          <div className="flex items-center">
            <input 
              type="checkbox" 
              id="remember-me" 
              checked={rememberMe}
              onChange={(e) => setRememberMe(e.target.checked)}
              className="w-4 h-4 rounded border-white/10 bg-black/40 text-sfc-orange focus:ring-sfc-orange cursor-pointer"
            />
            <label htmlFor="remember-me" className="ml-2 text-sm text-gray-300 cursor-pointer select-none">
              {t.rememberMe || 'Remember me'}
            </label>
          </div>
          <p className="mt-1 ml-6 text-xs text-gray-500">
            {t.rememberMeDesc || 'Remembers your account and session. Passwords are saved by your browser.'}
          </p>
        </div>

        <button 
          type="submit" 
          disabled={isLoading}
          className={`w-full bg-sfc-blue text-white font-bold py-3 rounded-full transition-colors flex items-center justify-center gap-2 ${isLoading ? 'opacity-70 cursor-not-allowed' : 'hover:bg-blue-600'}`}
        >
          {isLoading ? (
            <>
              <span className="inline-block h-4 w-4 animate-spin rounded-full border-2 border-white/40 border-t-white"></span>
              <span>{t.loggingIn || 'Signing in...'}</span>
            </>
          ) : (
            t.loginBtn
          )}
        </button>
        <p className="mt-4 text-center text-sm text-gray-400">
          {t.noAccount} <span onClick={() => onNavigate('register')} className="text-sfc-orange cursor-pointer hover:underline">{t.registerBtn}</span>
        </p>
      </form>
    </div>
  );
};
