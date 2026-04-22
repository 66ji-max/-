import React, { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';

export const Register: React.FC<{ onNavigate: (page: any) => void; language: string }> = ({ onNavigate }) => {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const { login } = useAuth();

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, email, password })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      login(data.token, data.user);
      onNavigate('dashboard');
    } catch (err: any) {
      setError(err.message);
    }
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-[80vh] px-4">
      <div className="w-full max-w-md p-8 bg-zinc-900 border border-zinc-800 rounded-2xl shadow-xl">
        <h2 className="text-2xl font-bold text-white mb-6 text-center">注册 Register</h2>
        {error && <div className="mb-4 p-3 bg-red-900/50 border border-red-500 text-red-200 rounded">{error}</div>}
        <form onSubmit={handleRegister} className="flex flex-col gap-4">
          <input
            type="text"
            value={name}
            onChange={e => setName(e.target.value)}
            placeholder="Your Name (Optional)"
            className="w-full px-4 py-3 bg-black/50 border border-zinc-700 rounded-lg text-white focus:outline-none focus:border-sfc-blue transition-colors"
          />
          <input
            type="email"
            value={email}
            onChange={e => setEmail(e.target.value)}
            placeholder="Email Address"
            className="w-full px-4 py-3 bg-black/50 border border-zinc-700 rounded-lg text-white focus:outline-none focus:border-sfc-blue transition-colors"
            required
          />
          <input
            type="password"
            value={password}
            onChange={e => setPassword(e.target.value)}
            placeholder="Password"
            className="w-full px-4 py-3 bg-black/50 border border-zinc-700 rounded-lg text-white focus:outline-none focus:border-sfc-blue transition-colors"
            required
          />
          <button type="submit" className="w-full py-3 mt-2 bg-sfc-orange hover:bg-orange-600 text-white font-bold rounded-lg transition-colors">
            Sign Up (10 Free Trials)
          </button>
        </form>
        <p className="mt-6 text-center text-gray-400 text-sm">
          Already have an account?{' '}
          <button onClick={() => onNavigate('login')} className="text-sfc-orange hover:underline">
            Login
          </button>
        </p>
      </div>
    </div>
  );
};
