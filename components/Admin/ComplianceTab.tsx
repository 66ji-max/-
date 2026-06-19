import React, { useState, useEffect } from 'react';
import { authFetch } from '../../utils/apiClient';
import { CheckCircle, XCircle } from 'lucide-react';

export const ComplianceTab: React.FC<{ language: string }> = ({ language }) => {
  const [articles, setArticles] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');

  const [form, setForm] = useState({
      title: '',
      summary: '',
      content: '',
      url: '',
      category: 'policy',
      language: 'zh'
  });

  const fetchArticles = async () => {
    setLoading(true);
    try {
      const res = await authFetch('/api/admin?action=compliance_articles');
      const data = await res.json();
      if (res.ok) {
        setArticles(data.articles || []);
      } else {
        setError(data.error || 'Failed to fetch articles');
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchArticles();
  }, []);

  const handleUpdateStatus = async (id: string, status: string) => {
    try {
      const res = await authFetch('/api/admin?action=update_compliance_article', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, status })
      });
      if (res.ok) {
        fetchArticles();
      } else {
         const data = await res.json();
         alert(data.error || 'Failed to update');
      }
    } catch (err) {
        alert('Update failed');
    }
  };

  const handleCreate = async (e: React.FormEvent) => {
      e.preventDefault();
      try {
          const res = await authFetch('/api/admin?action=create_compliance_article', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify(form)
          });
          if (res.ok) {
              setForm({ title: '', summary: '', content: '', url: '', category: 'policy', language: 'zh' });
              fetchArticles();
          } else {
             const data = await res.json();
             alert(data.error || 'Failed to create');
          }
      } catch (err) {
          alert('Creation failed');
      }
  };

  const filtered = articles.filter(a => 
      a.title?.toLowerCase().includes(search.toLowerCase()) || 
      a.category?.toLowerCase().includes(search.toLowerCase())
  );

  return (
      <div className="space-y-8">
          <div className="bg-white/5 border border-white/10 rounded-xl p-6">
              <h2 className="text-xl font-bold text-white mb-4">{language === 'zh' ? '添加新合规文章' : 'Add New Compliance Article'}</h2>
              <form onSubmit={handleCreate} className="space-y-4 max-w-2xl">
                  <input required placeholder="Title" value={form.title} onChange={e => setForm({...form, title: e.target.value})} className="w-full px-3 py-2 bg-black/40 border border-white/20 rounded text-white" />
                  <input required placeholder="URL" value={form.url} onChange={e => setForm({...form, url: e.target.value})} className="w-full px-3 py-2 bg-black/40 border border-white/20 rounded text-white" />
                  <input placeholder="Summary" value={form.summary} onChange={e => setForm({...form, summary: e.target.value})} className="w-full px-3 py-2 bg-black/40 border border-white/20 rounded text-white" />
                  <textarea placeholder="Content" value={form.content} onChange={e => setForm({...form, content: e.target.value})} className="w-full px-3 py-2 bg-black/40 border border-white/20 rounded text-white" rows={4} />
                  <div className="flex gap-4">
                      <select value={form.category} onChange={e => setForm({...form, category: e.target.value})} className="px-3 py-2 bg-black/40 border border-white/20 rounded text-white w-1/2">
                          <option value="policy">Policy</option>
                          <option value="customs">Customs</option>
                          <option value="trademark">Trademark</option>
                          <option value="platform">Platform</option>
                      </select>
                      <select value={form.language} onChange={e => setForm({...form, language: e.target.value})} className="px-3 py-2 bg-black/40 border border-white/20 rounded text-white w-1/2">
                          <option value="zh">Chinese (zh)</option>
                          <option value="en">English (en)</option>
                      </select>
                  </div>
                  <button type="submit" className="bg-sfc-orange text-white px-4 py-2 rounded font-bold hover:bg-orange-600 transition-colors">
                      {language === 'zh' ? '提交新文章' : 'Submit Article'}
                  </button>
              </form>
          </div>

          <div className="bg-white/5 border border-white/10 rounded-xl overflow-x-auto p-6">
              <div className="flex justify-between items-center mb-4">
                  <h2 className="text-xl font-bold text-white">{language === 'zh' ? '合规文章列表' : 'Compliance Articles'}</h2>
                  <input 
                      type="text" 
                      placeholder="Search title or category..." 
                      value={search}
                      onChange={(e) => setSearch(e.target.value)}
                      className="px-4 py-2 bg-black/40 border border-white/10 rounded-lg text-white focus:outline-none focus:border-sfc-orange md:w-64"
                  />
              </div>

              {error && <div className="p-3 mb-4 bg-red-500/20 text-red-200 rounded">{error}</div>}
              
              <table className="w-full text-left text-white text-sm">
                  <thead className="bg-white/10 border-b border-white/10">
                      <tr>
                          <th className="p-4 font-semibold">Title</th>
                          <th className="p-4 font-semibold">Category</th>
                          <th className="p-4 font-semibold">Status</th>
                          <th className="p-4 font-semibold">Date</th>
                          <th className="p-4 font-semibold text-right">Actions</th>
                      </tr>
                  </thead>
                  <tbody>
                      {filtered.map(a => (
                          <tr key={a.id} className="border-b border-white/5 hover:bg-white/5">
                              <td className="p-4 align-top">
                                  <div className="font-medium line-clamp-2">{a.title}</div>
                                  <a href={a.url} target="_blank" rel="noreferrer" className="text-xs text-blue-400 mt-1 truncate max-w-xs block">{a.url}</a>
                              </td>
                              <td className="p-4 align-top">
                                  <span className="bg-white/10 px-2 py-1 rounded text-xs">{a.category}</span>
                              </td>
                              <td className="p-4 align-top">
                                  <span className={`px-2 py-1 rounded text-xs font-bold ${
                                      a.status === 'published' ? 'bg-green-500/20 text-green-400' :
                                      a.status === 'rejected' ? 'bg-red-500/20 text-red-400' :
                                      'bg-yellow-500/20 text-yellow-400'
                                  }`}>
                                      {a.status}
                                  </span>
                              </td>
                              <td className="p-4 align-top text-xs text-gray-400">
                                  {new Date(a.crawledAt).toLocaleDateString()}
                              </td>
                              <td className="p-4 align-top text-right space-x-2 whitespace-nowrap">
                                  {a.status !== 'published' && (
                                      <button onClick={() => handleUpdateStatus(a.id, 'published')} className="bg-green-500/20 p-1.5 rounded hover:bg-green-500/40 text-green-400" title="Publish">
                                          <CheckCircle size={16} />
                                      </button>
                                  )}
                                  {a.status !== 'rejected' && (
                                      <button onClick={() => handleUpdateStatus(a.id, 'rejected')} className="bg-red-500/20 p-1.5 rounded hover:bg-red-500/40 text-red-400" title="Reject">
                                          <XCircle size={16} />
                                      </button>
                                  )}
                              </td>
                          </tr>
                      ))}
                      {filtered.length === 0 && !loading && (
                          <tr><td colSpan={5} className="p-8 text-center text-gray-500">No articles found.</td></tr>
                      )}
                  </tbody>
              </table>
          </div>
      </div>
  );
};
