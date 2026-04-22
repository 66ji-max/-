import React, { useEffect, useState } from 'react';
import { useAuth, Membership } from '../../contexts/AuthContext';
import { Upload, Trash2, File as FileIcon, X } from 'lucide-react';

interface UploadedFile {
    id: string;
    originalName: string;
    mimeType: string;
    size: number;
    createdAt: string;
}

export const Dashboard: React.FC<{ onNavigate: (page: any) => void }> = ({ onNavigate }) => {
  const { user, refreshUser, logout } = useAuth();
  const [files, setFiles] = useState<UploadedFile[]>([]);
  const [uploading, setUploading] = useState(false);
  const [membership, setMembership] = useState<Membership | null>(null);

  useEffect(() => {
    if (!user) {
        onNavigate('login');
        return;
    }
    fetchFiles();
    fetchMembership();
  }, [user]);

  const fetchMembership = async () => {
      try {
          const res = await fetch('/api/membership/me');
          if (res.ok) {
              const data = await res.json();
              setMembership(data.membership);
          }
      } catch(err) {
          console.error(err);
      }
  }

  const fetchFiles = async () => {
      try {
        const res = await fetch('/api/files');
        if (res.ok) {
            const data = await res.json();
            setFiles(data.files);
        }
      } catch(err) {
          console.error(err);
      }
  }

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
      if (!e.target.files || e.target.files.length === 0) return;
      const file = e.target.files[0];
      
      const formData = new FormData();
      formData.append('file', file);

      setUploading(true);
      try {
          const res = await fetch('/api/files/upload', {
              method: 'POST',
              body: formData
          });
          if (res.ok) {
              fetchFiles();
          } else {
              alert('Upload failed');
          }
      } catch(err) {
          console.error(err);
      } finally {
          setUploading(false);
      }
  }

  const handleDeleteFile = async (id: string) => {
      if (!confirm('Are you sure you want to delete this file?')) return;
      try {
          const res = await fetch(`/api/files/${id}`, { method: 'DELETE' });
          if (res.ok) {
              setFiles(files.filter(f => f.id !== id));
          }
      } catch(err) {
          console.error(err);
      }
  }

  if (!user) return <div className="min-h-screen text-center py-20">Please log in...</div>;

  return (
    <div className="max-w-6xl mx-auto px-4 py-24 min-h-[80vh]">
        <div className="flex justify-between items-center mb-10">
            <h1 className="text-3xl font-bold text-white">Your Dashboard</h1>
            <div className="flex gap-4">
                <button 
                  onClick={() => onNavigate('ai-saas')}
                  className="px-4 py-2 bg-sfc-blue text-white rounded hover:bg-blue-600 transition-colors"
                >
                  Go to AI SAAS
                </button>
                <button onClick={() => { logout(); onNavigate('home'); }} className="px-4 py-2 border border-zinc-700 text-gray-300 rounded hover:bg-zinc-800 transition-colors">Logout</button>
            </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="md:col-span-1 bg-zinc-900 border border-zinc-800 rounded-xl p-6 h-fit">
                <h2 className="text-xl font-bold text-white mb-4">Account details</h2>
                <div className="space-y-3 text-sm text-gray-300">
                    <p><span className="font-medium text-gray-500">Name:</span> {user.name || 'N/A'}</p>
                    <p><span className="font-medium text-gray-500">Email:</span> {user.email}</p>
                </div>
                
                <hr className="my-6 border-zinc-700" />
                
                <h2 className="text-xl font-bold text-white mb-4">Membership Plan</h2>
                {membership ? (
                    <div className="space-y-4">
                        <div className="flex items-center gap-2">
                           <span className="px-2 py-1 text-xs uppercase font-bold bg-sfc-orange text-white rounded">{membership.plan}</span>
                           <span className="text-xs text-gray-400">({membership.status})</span>
                        </div>
                        {membership.plan === 'free' && (
                            <p className="text-sm text-gray-300">
                              You have <strong className="text-white text-lg mx-1">{membership.trialRemaining}</strong> AI calls remaining.
                            </p>
                        )}
                        <button onClick={() => onNavigate('ai-saas')} className="text-sfc-blue text-sm hover:underline">
                            Upgrade plan / View pricing
                        </button>
                    </div>
                ) : <p className="text-sm text-gray-500">Loading membership...</p>}
            </div>

            <div className="md:col-span-2 bg-zinc-900 border border-zinc-800 rounded-xl p-6">
                 <div className="flex justify-between items-center mb-6">
                    <h2 className="text-xl font-bold text-white">My Files</h2>
                    <label className="cursor-pointer bg-white text-black px-4 py-2 rounded-lg text-sm font-bold flex items-center gap-2 hover:bg-gray-200 transition-colors">
                        <Upload size={16} />
                        {uploading ? 'Uploading...' : 'Upload File'}
                        <input type="file" className="hidden" disabled={uploading} onChange={handleFileUpload} />
                    </label>
                 </div>

                 <div className="space-y-3">
                     {files.length === 0 ? (
                         <div className="text-center py-12 text-gray-500 border border-dashed border-zinc-700 rounded-xl">
                            No files uploaded to your secure storage yet.
                         </div>
                     ) : (
                         files.map(file => (
                             <div key={file.id} className="flex items-center justify-between p-4 bg-black/40 border border-zinc-800 rounded-lg group hover:border-zinc-700 transition">
                                 <div className="flex items-center gap-3">
                                    <FileIcon className="text-sfc-blue" size={24} />
                                    <div>
                                        <p className="text-sm font-medium text-gray-200">{file.originalName}</p>
                                        <p className="text-xs text-gray-500">{(file.size / 1024).toFixed(1)} KB • {new Date(file.createdAt).toLocaleDateString()}</p>
                                    </div>
                                 </div>
                                 <button 
                                    onClick={() => handleDeleteFile(file.id)}
                                    className="p-2 text-gray-500 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-all rounded-full hover:bg-white/5"
                                 >
                                     <Trash2 size={16} />
                                 </button>
                             </div>
                         ))
                     )}
                 </div>
            </div>
        </div>
    </div>
  );
};
