import React, { useState, useEffect } from 'react';
import { translations } from '../../translations';
import { authFetch } from '../../utils/apiClient';
import { Send, MessageSquare, CheckCircle, Clock } from 'lucide-react';

export const SupportTab: React.FC<{ language: string; userRole: string }> = ({ language, userRole }) => {
  const t = translations[language as keyof typeof translations].support;
  const [conversations, setConversations] = useState<any[]>([]);
  const [activeConv, setActiveConv] = useState<any>(null);
  const [content, setContent] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchConversations();
    const interval = setInterval(() => {
        if (!activeConv) fetchConversations(true);
    }, 10000);
    return () => clearInterval(interval);
  }, [activeConv]);

  useEffect(() => {
     let interval: any;
     if (activeConv) {
         fetchConversationDetail(activeConv.id, true);
         interval = setInterval(() => fetchConversationDetail(activeConv.id, true), 5000);
     }
     return () => clearInterval(interval);
  }, [activeConv?.id]);

  const fetchConversations = async (silent = false) => {
    if (!silent) setLoading(true);
    try {
      const res = await authFetch('/api/support?action=list&all=true'); // fetch all for admin
      if (res.ok) {
         const data = await res.json();
         setConversations(data.conversations || []);
      }
    } catch (err) {} finally {
      if (!silent) setLoading(false);
    }
  };

  const fetchConversationDetail = async (id: string, silent = false) => {
      try {
          const res = await authFetch(`/api/support?action=get&id=${id}`);
          if (res.ok) {
              const data = await res.json();
              setActiveConv(data.conversation);
          }
      } catch (err) {}
  };

  const handleReply = async () => {
      if (!content.trim() || !activeConv) return;
      try {
          const res = await authFetch('/api/support?action=reply', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ conversationId: activeConv.id, content })
          });
          if (res.ok) {
              setContent('');
              fetchConversationDetail(activeConv.id, true);
              fetchConversations(true);
          }
      } catch (err) {}
  };

  const handleUpdateStatus = async (convId: string, status: string) => {
      try {
          await authFetch('/api/support?action=update_status', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ conversationId: convId, status })
          });
          fetchConversations(false);
          if (activeConv?.id === convId) {
             setActiveConv({ ...activeConv, status });
          }
      } catch (err) {}
  };

  if (loading && !conversations.length) return <div className="text-white py-10 text-center">{t.pending}...</div>;

  return (
      <div className="flex bg-white/5 border border-white/10 rounded-xl h-[600px] overflow-hidden">
          {/* List Sidebar */}
          <div className="w-1/3 border-r border-white/10 overflow-y-auto bg-black/20">
              {conversations.length === 0 && <div className="text-center p-8 text-gray-500">{t.noConversationsYet}</div>}
              {conversations.map(c => {
                  const hasUnread = c.messages?.[0] && c.messages[0].senderRole !== 'admin' && !c.messages[0].isRead;
                  return (
                  <div 
                      key={c.id} 
                      onClick={() => setActiveConv(c)}
                      className={`p-4 border-b border-white/5 cursor-pointer hover:bg-white/10 transition-colors relative ${activeConv?.id === c.id ? 'bg-white/10' : ''}`}
                  >
                      {hasUnread && <div className="w-2.5 h-2.5 bg-sfc-orange rounded-full absolute top-5 right-4" title={t.unread} />}
                      <div className="text-xs text-sfc-orange mb-1 truncate">{c.user?.email}</div>
                      <div className="font-bold text-white text-sm truncate pr-4">{c.subject}</div>
                      <div className="flex justify-between items-center text-xs text-gray-400 mt-2">
                          <span className={`px-2 py-0.5 rounded-full ${c.status === 'open' ? 'bg-yellow-500/20 text-yellow-400' : c.status === 'pending' ? 'bg-blue-500/20 text-blue-400' : 'bg-gray-500/20 text-gray-400'}`}>
                              {t[c.status as keyof typeof t] || c.status}
                          </span>
                          <span>{new Date(c.lastMessageAt).toLocaleDateString()}</span>
                      </div>
                  </div>
              )})}
          </div>

          {/* Detail View */}
          <div className="w-2/3 flex flex-col relative">
              {!activeConv ? (
                  <div className="flex-1 flex flex-col items-center justify-center text-gray-500">
                      <MessageSquare size={48} className="mb-4 opacity-50" />
                      <p>Select a conversation to view details</p>
                  </div>
              ) : (
                  <>
                      {/* Header */}
                      <div className="p-4 border-b border-white/10 bg-black/40 flex justify-between items-center">
                          <div>
                              <div className="font-bold text-white">{activeConv.subject}</div>
                              <div className="text-xs text-gray-400">User: {activeConv.user?.email}</div>
                          </div>
                          <div className="flex gap-2">
                              {activeConv.status !== 'closed' && (
                                  <button onClick={() => handleUpdateStatus(activeConv.id, 'closed')} className="px-3 py-1 bg-red-500/20 text-red-400 text-xs rounded hover:bg-red-500 hover:text-white transition-colors">
                                      {t.closeConversation}
                                  </button>
                              )}
                              {activeConv.status === 'closed' && (
                                  <button onClick={() => handleUpdateStatus(activeConv.id, 'open')} className="px-3 py-1 bg-blue-500/20 text-blue-400 text-xs rounded hover:bg-blue-500 hover:text-white transition-colors">
                                      Reopen
                                  </button>
                              )}
                          </div>
                      </div>
                      
                      {/* Chat History */}
                      <div className="flex-1 overflow-y-auto p-4 space-y-4">
                          {activeConv.messages?.map((msg: any) => {
                              const isAdmin = msg.senderRole === 'admin';
                              return (
                                <div key={msg.id} className={`max-w-[80%] min-w-0 rounded-xl p-4 ${isAdmin ? 'bg-sfc-orange/20 border border-sfc-orange/30 text-white self-end ml-auto' : 'bg-white/5 border border-white/10 text-gray-200'}`}>
                                    <div className="text-xs opacity-50 mb-2 flex justify-between gap-8">
                                        <span className="font-bold whitespace-nowrap">{isAdmin ? 'Admin' : activeConv.user?.name || activeConv.user?.email || 'User'}</span>
                                        <span className="whitespace-nowrap">{new Date(msg.createdAt).toLocaleString()}</span>
                                    </div>
                                    <div className="whitespace-pre-wrap text-sm break-words overflow-hidden" style={{ wordBreak: 'break-word', overflowWrap: 'anywhere' }}>{msg.content}</div>
                                </div>
                              )
                          })}
                      </div>

                      {/* Reply Box */}
                      {activeConv.status !== 'closed' && (
                      <div className="p-4 border-t border-white/10 bg-black/40">
                          <div className="flex gap-2">
                              <textarea 
                                  value={content}
                                  onChange={(e) => setContent(e.target.value)}
                                  placeholder="Type your reply here..."
                                  className="flex-1 h-20 px-4 py-2 bg-white/5 border border-white/10 rounded-xl text-white focus:outline-none focus:border-sfc-orange resize-none"
                              />
                              <button 
                                  onClick={handleReply}
                                  disabled={!content.trim()}
                                  className="px-6 bg-sfc-orange text-white rounded-xl font-bold hover:bg-orange-600 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
                              >
                                  <Send size={18} /> Send
                              </button>
                          </div>
                      </div>
                      )}
                  </>
              )}
          </div>
      </div>
  )
}
