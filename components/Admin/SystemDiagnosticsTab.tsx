import React, { useState, useEffect } from 'react';
import { authFetch } from '../../utils/apiClient';
import { CheckCircle, XCircle, RefreshCw } from 'lucide-react';

export const SystemDiagnosticsTab: React.FC<{ language: string }> = ({ language }) => {
  const [health, setHealth] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const fetchHealth = async () => {
    setLoading(true);
    setError('');
    try {
      const res = await authFetch('/api/admin?action=health');
      const data = await res.json();
      if (res.ok) {
        setHealth(data);
      } else {
        setError(data.error || data.code || 'Diagnostics failed');
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchHealth();
  }, []);

  if (loading) {
    return <div className="text-white text-center py-20">Loading Diagnostics...</div>;
  }

  if (error) {
    return (
      <div className="bg-red-500/20 border border-red-500 text-red-100 p-6 rounded-lg text-center">
        <h3 className="text-lg font-bold mb-2">Diagnostics Error</h3>
        <p>{error}</p>
        <button onClick={fetchHealth} className="mt-4 px-4 py-2 bg-red-600 hover:bg-red-700 rounded text-white font-bold flex items-center justify-center gap-2 mx-auto">
          <RefreshCw size={16} /> Retry
        </button>
      </div>
    );
  }

  if (!health) return null;

  return (
    <div className="space-y-6 text-white">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-bold">{language === 'zh' ? '系统诊断' : 'System Diagnostics'}</h2>
        <button onClick={fetchHealth} className="flex items-center gap-2 bg-white/10 hover:bg-white/20 px-3 py-1.5 rounded transition-colors text-sm">
          <RefreshCw size={14} /> {language === 'zh' ? '刷新' : 'Refresh'}
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white/5 border border-white/10 p-6 rounded-xl">
          <h3 className="text-lg font-semibold mb-4 text-gray-300">Environment Variables</h3>
          <ul className="space-y-3">
            <li className="flex justify-between items-center">
              <span>Postgres Prisma URL</span>
              {health.env?.hasPostgresPrismaUrl ? <CheckCircle className="text-green-400" size={20} /> : <XCircle className="text-red-400" size={20} />}
            </li>
            <li className="flex justify-between items-center">
              <span>Postgres URL Non-Pooling</span>
              {health.env?.hasPostgresUrlNonPooling ? <CheckCircle className="text-green-400" size={20} /> : <XCircle className="text-red-400" size={20} />}
            </li>
            <li className="flex justify-between items-center">
              <span>Vercel Blob Token</span>
              {health.env?.hasBlobToken ? <CheckCircle className="text-green-400" size={20} /> : <XCircle className="text-red-400" size={20} />}
            </li>
            <li className="flex justify-between items-center">
              <span>JWT Secret</span>
              {health.env?.hasJwtSecret ? <CheckCircle className="text-green-400" size={20} /> : <XCircle className="text-red-400" size={20} />}
            </li>
          </ul>
        </div>

        <div className="bg-white/5 border border-white/10 p-6 rounded-xl">
          <h3 className="text-lg font-semibold mb-4 text-gray-300">Database Connection</h3>
          <ul className="space-y-3">
            <li className="flex justify-between items-center">
              <span>Prisma Client Loaded</span>
              {health.database?.clientLoaded ? <CheckCircle className="text-green-400" size={20} /> : <XCircle className="text-red-400" size={20} />}
            </li>
            <li className="flex justify-between items-center">
              <span>Database Connected</span>
              {health.database?.connected ? <CheckCircle className="text-green-400" size={20} /> : <XCircle className="text-red-400" size={20} />}
            </li>
          </ul>
        </div>
      </div>

      <div className="bg-white/5 border border-white/10 p-6 rounded-xl">
        <h3 className="text-lg font-semibold mb-4 text-gray-300">Database Tables</h3>
        
        {health.missingTables?.length > 0 && (
          <div className="mb-6 p-4 bg-yellow-500/20 border border-yellow-500/50 rounded-lg text-yellow-200">
            {language === 'zh' 
              ? '缺少数据库表，请执行 npx prisma db push 或在 Neon SQL Editor 手动建表。' 
              : 'Missing database tables. Please run npx prisma db push or create them in Neon SQL Editor.'}
          </div>
        )}

        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {health.tables && Object.entries(health.tables).map(([tableName, exists]) => (
            <div key={tableName} className="flex justify-between items-center bg-black/40 p-3 rounded border border-white/5">
              <span className="font-mono text-sm text-gray-400">{tableName}</span>
              {exists ? <CheckCircle className="text-green-400" size={16} /> : <XCircle className="text-red-400" size={16} />}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
