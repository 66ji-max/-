import React, { useEffect, useState, useRef } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { FileUp, Trash2, File as FileIcon } from 'lucide-react';
import { translations } from '../../translations';
import { authFetch } from '../../utils/apiClient';

export const Dashboard: React.FC<{ onNavigate: (page: any) => void; language?: string }> = ({ onNavigate, language = 'zh' }) => {
  const { user, token, logout } = useAuth();
  const [files, setFiles] = useState<any[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const t = translations[language as keyof typeof translations].dashboard;

  useEffect(() => {
    if (!user) { onNavigate('login'); return; }
    
    const fetchFiles = async () => {
      try {
        const res = await authFetch('/api/files?action=list');
        if (res.ok) {
          const data = await res.json();
          setFiles(data.files || []);
        }
      } catch (err) {}
    };
    fetchFiles();
  }, [user, token, onNavigate]);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (!selectedFile || !token) return;

    setIsUploading(true);
    
    // Convert to base64 for serverless upload
    const reader = new FileReader();
    reader.onload = async (event) => {
      const base64Buffer = (event.target?.result as string).split(',')[1];
      
      try {
        const res = await authFetch('/api/files?action=upload', {
          method: 'POST',
          headers: { 
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            filename: selectedFile.name,
            contentType: selectedFile.type,
            size: selectedFile.size,
            base64Buffer
          })
        });
        
        if (res.ok) {
          const result = await res.json();
          setFiles(prev => [result.file, ...prev]);
        }
      } catch (err) {
        console.error("Upload failed", err);
      } finally {
        setIsUploading(false);
      }
    };
    reader.readAsDataURL(selectedFile);
  };

  const handleDeleteFile = async (id: string) => {
    try {
      await authFetch(`/api/files?action=delete&id=${id}`, { 
          method: 'DELETE'
      });
      setFiles(files.filter(f => f.id !== id));
    } catch (e) {}
  };

  return (
    <div className="pt-32 px-6 pb-20 max-w-5xl mx-auto text-white animate-[fadeIn_0.5s_ease-out]">
        <h2 className="text-3xl font-bold mb-8">{t.title}</h2>
        
        <div className="p-6 bg-white/5 rounded-xl border border-white/10 mb-8">
            <h3 className="text-xl font-bold mb-2 text-sfc-orange truncate">{t.welcome}{user?.name || user?.email}</h3>
            <div className="grid grid-cols-2 gap-4 mt-4">
                <div className="bg-black/30 p-4 rounded border border-white/5">
                    <p className="text-gray-400 text-sm">{t.subscriptionPlan}</p>
                    <p className="text-lg font-bold text-white uppercase">{t.planLabels[(user?.membership?.plan as keyof typeof t.planLabels) || 'na']}</p>
                </div>
                <div className="bg-black/30 p-4 rounded border border-white/5">
                    <p className="text-gray-400 text-sm">{t.accountStatus}</p>
                    <p className="text-lg font-bold text-white capitalize">{t.statusLabels[(user?.membership?.status as keyof typeof t.statusLabels) || 'na']}</p>
                </div>
            </div>
            {user?.membership?.plan === 'free' && (
                <div className="mt-4 p-3 bg-yellow-500/10 border border-yellow-500/20 rounded inline-block">
                    <p className="text-yellow-400 text-sm font-bold">{t.freeTrialRemaining}{user?.membership?.trialRemaining}</p>
                </div>
            )}
            <div className="mt-6 flex flex-wrap gap-4">
              <button onClick={() => { logout(); onNavigate('home'); }} className="px-5 py-2 bg-red-500/20 text-red-400 font-bold rounded-lg hover:bg-red-500/40 transition-colors">{t.logout}</button>
              <button onClick={() => onNavigate('ai-saas')} className="px-5 py-2 bg-sfc-blue text-white font-bold rounded-lg hover:bg-blue-600 transition-colors">{t.goAI}</button>
              <button onClick={() => { sessionStorage.setItem('aiScrollTarget', 'pricing'); onNavigate('ai-saas'); }} className="px-5 py-2 bg-sfc-orange text-white font-bold rounded-lg hover:bg-orange-600 transition-colors">{t.upgradeAI}</button>
            </div>
        </div>
        
        <div className="p-6 bg-white/5 rounded-xl border border-white/10">
            <div className="flex justify-between items-center mb-6">
                <h3 className="text-xl font-bold">{t.myFiles}</h3>
                <div>
                   <input type="file" ref={fileInputRef} onChange={handleFileUpload} className="hidden" />
                   <button 
                       onClick={() => fileInputRef.current?.click()}
                       disabled={isUploading}
                       className="bg-white/10 hover:bg-white/20 text-white px-4 py-2 rounded-lg text-sm transition-colors flex items-center gap-2 font-bold disabled:opacity-50"
                   >
                       {isUploading ? <div className="w-4 h-4 rounded-full border-2 border-white/30 border-t-white animate-spin"></div> : <FileUp size={16} />}
                       {t.uploadFile}
                   </button>
                </div>
            </div>

            {files.length === 0 ? (
                <div className="text-center py-12 text-gray-500 border border-dashed border-gray-700 rounded-lg">
                    <FileIcon size={48} className="mx-auto text-gray-600 mb-4" />
                    <p>{t.noFiles}</p>
                </div>
            ) : (
                <div className="space-y-3">
                    {files.map(f => (
                        <div key={f.id} className="flex items-center justify-between p-4 bg-black/30 rounded border border-white/5 hover:border-white/10 transition-colors">
                            <div className="flex items-center gap-4">
                                <FileIcon size={24} className="text-sfc-orange" />
                                <div>
                                    <p className="font-bold text-sm text-gray-200">{f.originalName}</p>
                                    <p className="text-xs text-gray-500">{(f.size / 1024).toFixed(2)} KB • {new Date(f.createdAt).toLocaleDateString()}</p>
                                </div>
                            </div>
                            <button 
                                onClick={() => handleDeleteFile(f.id)}
                                className="p-2 text-gray-400 hover:text-red-400 bg-white/5 rounded hover:bg-red-400/10 transition-colors"
                            >
                                <Trash2 size={16} />
                            </button>
                        </div>
                    ))}
                </div>
            )}
        </div>
    </div>
  );
};
