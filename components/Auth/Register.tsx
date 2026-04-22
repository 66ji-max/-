import React, { useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';

export const Register: React.FC<{ onNavigate: (page: any) => void; language: string }> = ({ onNavigate }) => {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const { login } = useAuth();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, email, password })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Registration failed');
      
      login(data.token, data.user);
      onNavigate('dashboard');
    } catch (err: any) {
      setError(err.message);
    }
  };

  return (
    <div className="pt-32 pb-20 flex justify-center px-4">
      <form onSubmit={handleSubmit} className="bg-white/5 p-8 rounded-xl border border-white/10 w-full max-w-md animate-[fadeIn_0.4s_ease-out]">
        <h2 className="text-2xl font-bold mb-6 text-white">Create Account</h2>
        {error && <div className="text-red-400 text-sm mb-4">{error}</div>}
        <input type="text" placeholder="Name" value={name} onChange={e => setName(e.target.value)} required className="w-full mb-4 p-3 bg-black/40 border border-white/10 rounded-lg text-white focus:outline-none focus:border-sfc-orange" />
        <input type="email" placeholder="Email" value={email} onChange={e => setEmail(e.target.value)} required className="w-full mb-4 p-3 bg-black/40 border border-white/10 rounded-lg text-white focus:outline-none focus:border-sfc-orange" />
        <input type="password" placeholder="Password" value={password} onChange={e => setPassword(e.target.value)} required className="w-full mb-6 p-3 bg-black/40 border border-white/10 rounded-lg text-white focus:outline-none focus:border-sfc-orange" />
        <button type="submit" className="w-full bg-sfc-orange text-white font-bold py-3 rounded-full hover:bg-orange-600 transition-colors">Register</button>
        <p className="mt-4 text-center text-sm text-gray-400">
          Have an account? <span onClick={() => onNavigate('login')} className="text-sfc-blue cursor-pointer hover:underline">Login</span>
        </p>
      </form>
    </div>
  );
};
