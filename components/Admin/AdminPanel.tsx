import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { translations } from '../../translations';
import { Mail, Edit, Trash2, Key, Star, ShieldOff } from 'lucide-react';

export const AdminPanel: React.FC<{ onNavigate: (page: any) => void; language: string }> = ({ onNavigate, language }) => {
  const { user, token } = useAuth();
  const t = translations[language as keyof typeof translations].admin;
  
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');
  
  const [editingUserId, setEditingUserId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState({ name: '', email: '', username: '' });

  useEffect(() => {
    if (user && user.role !== 'admin') {
      onNavigate('dashboard');
      return;
    }
    fetchUsers();
  }, [user]);

  const fetchUsers = async () => {
    try {
      const res = await fetch('/api/admin/users', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await res.json();
      if (res.ok) {
        setUsers(data.users || []);
      } else {
        setError(data.error || 'Failed to fetch users');
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string, currentRole: string) => {
    if (id === user?.id) return alert(t.cannotDeleteSelf);
    if (currentRole === 'admin') return alert('Cannot delete another admin'); // Hardcoded EN as fallback mostly admins will know
    if (!window.confirm(t.confirmDelete)) return;

    try {
      const res = await fetch(`/api/admin/users/${id}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        setUsers(users.filter(u => u.id !== id));
        alert(t.deleteSuccess);
      } else {
        const data = await res.json();
        alert(data.error || t.deleteFailed);
      }
    } catch (err: any) {
        alert(err.message);
    }
  };

  const handleEdit = (u: any) => {
    setEditingUserId(u.id);
    setEditForm({ name: u.name || '', email: u.email || '', username: u.username || '' });
  };

  const saveEdit = async (id: string) => {
    try {
      const res = await fetch(`/api/admin/users/${id}`, {
        method: 'PATCH',
        headers: { 
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}` 
        },
        body: JSON.stringify(editForm)
      });
      const data = await res.json();
      
      if (!res.ok) {
          if (data.code === 'EMAIL_EXISTS') {
              alert(translations[language as keyof typeof translations].auth.emailInUse);
          } else {
              alert(data.error || t.updateFailed);
          }
          return;
      }
      
      setEditingUserId(null);
      fetchUsers();
      alert(t.updateSuccess);
    } catch (err: any) {
      alert(err.message);
    }
  };

  const changeMembership = async (id: string, plan: string, status: string) => {
    try {
      const res = await fetch(`/api/admin/users/${id}/membership`, {
        method: 'PATCH',
        headers: { 
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}` 
        },
        body: JSON.stringify({ plan, status, trialRemaining: plan === 'pro' ? 9999 : 10 })
      });
      if (res.ok) {
        fetchUsers();
      } else {
        const data = await res.json();
        alert(data.error || t.updateFailed);
      }
    } catch (err: any) {
        alert(err.message);
    }
  };

  const filteredUsers = users.filter(u => 
      (u.email || '').toLowerCase().includes(search.toLowerCase()) || 
      (u.username || '').toLowerCase().includes(search.toLowerCase())
  );

  if (loading) return <div className="pt-32 text-center text-white">Loading...</div>;

  return (
    <div className="pt-32 pb-20 px-4 md:px-8 max-w-7xl mx-auto min-h-screen">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
        <h1 className="text-3xl font-bold text-white">{t.title}</h1>
        <input 
            type="text" 
            placeholder={t.searchPlaceholder} 
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="px-4 py-2 bg-white/5 border border-white/10 rounded-lg text-white focus:outline-none focus:border-sfc-orange"
        />
      </div>

      {error && <div className="p-4 mb-6 bg-red-500/20 border border-red-500 text-red-100 rounded-lg">{error}</div>}

      <div className="bg-white/5 border border-white/10 rounded-xl overflow-x-auto">
        <table className="w-full text-left text-white text-sm">
          <thead className="bg-white/10 border-b border-white/10">
            <tr>
              <th className="p-4 font-semibold">{t.role}</th>
              <th className="p-4 font-semibold">User details</th>
              <th className="p-4 font-semibold">{t.plan} / {t.status}</th>
              <th className="p-4 font-semibold text-right">Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredUsers.map(u => (
              <tr key={u.id} className="border-b border-white/5 hover:bg-white/5 transition-colors">
                <td className="p-4">
                  <span className={`px-2 py-1 rounded text-xs font-bold ${u.role === 'admin' ? 'bg-purple-500/20 text-purple-300' : 'bg-white/10 text-gray-300'}`}>
                    {u.role.toUpperCase()}
                  </span>
                </td>
                <td className="p-4">
                  {editingUserId === u.id ? (
                      <div className="space-y-2">
                          <input type="text" value={editForm.name} onChange={e => setEditForm({...editForm, name: e.target.value})} className="w-full px-2 py-1 bg-black/40 border border-white/20 rounded text-white" placeholder="Name" />
                          <input type="text" value={editForm.username} onChange={e => setEditForm({...editForm, username: e.target.value})} className="w-full px-2 py-1 bg-black/40 border border-white/20 rounded text-white" placeholder="Username" />
                          <input type="email" value={editForm.email} onChange={e => setEditForm({...editForm, email: e.target.value})} className="w-full px-2 py-1 bg-black/40 border border-white/20 rounded text-white" placeholder="Email" />
                      </div>
                  ) : (
                      <div>
                          <div className="font-semibold">{u.name || '-'}</div>
                          <div className="text-xs text-gray-400 block">{u.username ? `@${u.username}` : ''}</div>
                          <div className="text-gray-300 text-xs mt-1 flex items-center gap-1"><Mail size={12}/> {u.email}</div>
                      </div>
                  )}
                </td>
                <td className="p-4">
                   <div className="flex flex-col gap-1">
                        <span className={`inline-block px-2 py-1 rounded text-xs w-max font-medium ${u.membership?.plan === 'pro' ? 'bg-sfc-orange/20 text-sfc-orange border border-sfc-orange/30' : 'bg-gray-500/20 text-gray-300'}`}>
                            {u.membership?.plan || 'free'}
                        </span>
                        <span className="text-xs text-gray-400">{u.membership?.status}</span>
                   </div>
                </td>
                <td className="p-4 text-right space-x-2">
                  {editingUserId === u.id ? (
                      <>
                        <button onClick={() => saveEdit(u.id)} className="bg-green-500 hover:bg-green-600 text-white px-3 py-1 rounded text-xs transition-colors">{t.save}</button>
                        <button onClick={() => setEditingUserId(null)} className="bg-gray-500 hover:bg-gray-600 text-white px-3 py-1 rounded text-xs transition-colors">{t.cancel}</button>
                      </>
                  ) : (
                      <div className="flex flex-wrap items-center justify-end gap-2">
                        {u.role !== 'admin' && (
                            u.membership?.plan !== 'pro' ? (
                                <button onClick={() => changeMembership(u.id, 'pro', 'active')} className="bg-sfc-orange/20 hover:bg-sfc-orange border border-sfc-orange text-white w-8 h-8 flex items-center justify-center rounded transition-colors" title={t.grantVip}>
                                    <Star size={14} />
                                </button>
                            ) : (
                                <button onClick={() => changeMembership(u.id, 'free', 'trial')} className="bg-gray-500/20 hover:bg-gray-500 text-white w-8 h-8 flex items-center justify-center border border-gray-500 rounded transition-colors" title={t.revokeVip}>
                                    <ShieldOff size={14} />
                                </button>
                            )
                        )}
                        <button onClick={() => handleEdit(u)} className="bg-white/10 hover:bg-white/20 text-white w-8 h-8 flex items-center justify-center rounded transition-colors" title={t.edit}>
                            <Edit size={14} />
                        </button>
                        {u.role !== 'admin' && (
                            <button onClick={() => handleDelete(u.id, u.role)} className="bg-red-500/20 hover:bg-red-600 border border-red-500/50 text-white w-8 h-8 flex items-center justify-center rounded transition-colors" title={t.delete}>
                                <Trash2 size={14} />
                            </button>
                        )}
                      </div>
                  )}
                </td>
              </tr>
            ))}
            {filteredUsers.length === 0 && (
                <tr>
                    <td colSpan={4} className="p-8 text-center text-gray-400">No users found.</td>
                </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};
