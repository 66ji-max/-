import React, { useState, useEffect } from 'react';
import { translations } from '../translations';
import { authFetch } from '../utils/apiClient';
import { X, Send, MessageSquarePlus, RefreshCw } from 'lucide-react';

interface SupportPanelProps {
  language: string;
  onClose: () => void;
  userRole: string;
}

export const SupportPanel: React.FC<SupportPanelProps> = ({ language, onClose, userRole }) => {
  const t = translations[language as keyof typeof translations].support;
  const [conversations, setConversations] = useState<any[]>([]);
  const [activeConv, setActiveConv] = useState<any>(null);
  const [subject, setSubject] = useState('');
  const [content, setContent] = useState('');
  const [loading, setLoading] = useState(false);
  const [loadingMsg, setLoadingMsg] = useState(false);

  useEffect(() => {
    fetchConversations();
    // Poll for list if not in active conversation
    const interval = setInterval(() => {
        if (!activeConv) fetchConversations(true);
    }, 10000);
    return () => clearInterval(interval);
  }, [activeConv]);

  useEffect(() => {
     let interval: any;
     if (activeConv) {
         fetchConversationDetail(activeConv.id, true); // initial fetch for active conv
         interval = setInterval(() => {
             fetchConversationDetail(activeConv.id, true);
         }, 5000); // Poll every 5 seconds
     }
     return () => clearInterval(interval);
  }, [activeConv?.id]);

  const fetchConversations = async (silent = false) => {
    if (!silent) setLoading(true);
    try {
      const res = await authFetch('/api/support?action=list');
      if (res.ok) {
         const data = await res.json();
         setConversations(data.conversations || []);
      }
    } catch (err) {
      console.error(err);
    } finally {
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
      } catch (err) {
          console.error(err);
      }
  };

  const handleCreate = async () => {
      if (!content.trim()) return;
      setLoadingMsg(true);
      try {
          const res = await authFetch('/api/support?action=create', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ subject: subject || (content.substring(0, 20) + '...'), content })
          });
          if (res.ok) {
              const data = await res.json();
              setSubject('');
              setContent('');
              setActiveConv(data.conversation);
              fetchConversations(true);
          }
      } catch (err) {
          console.error(err);
      } finally {
          setLoadingMsg(false);
      }
  };

  const handleReply = async () => {
      if (!content.trim() || !activeConv) return;
      setLoadingMsg(true);
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
      } catch (err) {
          console.error(err);
      } finally {
          setLoadingMsg(false);
      }
  };

  const renderList = () => (
      <div className="flex flex-col h-full">
          <div className="flex-1 overflow-y-auto p-4 space-y-4">
              {conversations.length === 0 && !loading && (
                  <div className="text-center text-gray-400 mt-10">{t.noConversationsYet}</div>
              )}
              {loading && <div className="text-center text-gray-400">{t.pending}...</div>}
              {conversations.map(c => {
                  const hasUnread = c.messages[0] && c.messages[0].senderRole !== userRole && !c.messages[0].isRead;
                  return (
                  <div 
                      key={c.id} 
                      onClick={() => setActiveConv(c)}
                      className="bg-white/5 border border-white/10 p-4 rounded-xl cursor-pointer hover:bg-white/10 transition-colors relative"
                  >
                      <div className="flex justify-between items-start mb-2">
                          <h4 className="font-bold text-white truncate pr-4">{c.subject}</h4>
                          {hasUnread && <div className="w-2.5 h-2.5 bg-sfc-orange rounded-full absolute top-5 right-4" title={t.unread} />}
                      </div>
                      <div className="flex justify-between items-center text-xs text-gray-400">
                          <span>{t[c.status as keyof typeof t] || c.status}</span>
                          <span>{new Date(c.lastMessageAt).toLocaleString()}</span>
                      </div>
                  </div>
              )})}
          </div>
          <div className="p-4 border-t border-white/10">
              <button 
                  onClick={() => setActiveConv('new')}
                  className="w-full py-3 bg-sfc-orange text-white rounded-xl font-bold hover:bg-orange-600 transition-colors flex items-center justify-center gap-2"
              >
                  <MessageSquarePlus size={18} />
                  {t.newConversation}
              </button>
          </div>
      </div>
  );

  const renderNew = () => (
      <div className="flex flex-col h-full p-4">
          <button onClick={() => setActiveConv(null)} className="text-gray-400 hover:text-white mb-4 flex items-center gap-2 text-sm">
              ← Back
          </button>
          <div className="flex-1 space-y-4">
              <input 
                  type="text" 
                  value={subject} 
                  onChange={(e) => setSubject(e.target.value)} 
                  placeholder={t.subject}
                  className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white focus:outline-none focus:border-sfc-orange"
              />
              <textarea 
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                  placeholder={t.enterQuestion}
                  className="w-full h-40 px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white focus:outline-none focus:border-sfc-orange resize-none"
              />
          </div>
          <button 
              onClick={handleCreate}
              disabled={loadingMsg || !content.trim()}
              className="mt-4 w-full py-3 bg-sfc-orange text-white rounded-xl font-bold hover:bg-orange-600 transition-colors disabled:opacity-50"
          >
              {loadingMsg ? '...' : t.send}
          </button>
      </div>
  );

  const renderChat = () => {
    if (!activeConv || activeConv === 'new') return null;
    return (
      <div className="flex flex-col h-full relative">
          <div className="p-4 border-b border-white/10 flex justify-between items-center bg-black/20">
              <button onClick={() => setActiveConv(null)} className="text-gray-400 hover:text-white text-sm">
                  ← Back
              </button>
              <span className={`text-xs px-2 py-1 rounded ${activeConv.status === 'closed' ? 'bg-gray-500/20 text-gray-400' : 'bg-green-500/20 text-green-400'}`}>
                  {t[activeConv.status as keyof typeof t] || activeConv.status}
              </span>
          </div>
          <div className="flex-1 overflow-y-auto p-4 space-y-4 flex flex-col">
              {activeConv.messages?.map((msg: any) => {
                  const isMe = msg.senderRole === userRole;
                  return (
                      <div key={msg.id} className={`max-w-[80%] rounded-2xl p-4 ${isMe ? 'bg-sfc-orange text-white self-end rounded-tr-sm' : 'bg-white/10 text-gray-200 self-start rounded-tl-sm'}`}>
                          <div className="text-xs opacity-50 mb-1 flex justify-between gap-4">
                              <span>{isMe ? t.userMessage : t.adminReply}</span>
                              <span>{new Date(msg.createdAt).toLocaleTimeString()}</span>
                          </div>
                          <div className="whitespace-pre-wrap text-sm">{msg.content}</div>
                      </div>
                  );
              })}
          </div>
          <div className="p-4 border-t border-white/10 bg-black/20">
              {activeConv.status === 'closed' ? (
                  <div className="text-center text-gray-500 text-sm py-2">{t.closed}</div>
              ) : (
                  <div className="flex gap-2 relative">
                      <textarea 
                          value={content}
                          onChange={(e) => setContent(e.target.value)}
                          placeholder={t.enterQuestion}
                          className="flex-1 h-12 min-h-12 max-h-32 px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white focus:outline-none focus:border-sfc-orange resize-y"
                      />
                      <button 
                          onClick={handleReply}
                          disabled={loadingMsg || !content.trim()}
                          className="px-4 bg-sfc-orange text-white rounded-xl font-bold hover:bg-orange-600 transition-colors disabled:opacity-50 flex items-center justify-center"
                      >
                          <Send size={18} />
                      </button>
                  </div>
              )}
          </div>
      </div>
  )};

  return (
    <div className="fixed bottom-6 right-6 z-50 animate-[fadeIn_0.2s_ease-out]">
        <div className="bg-zinc-900 border border-zinc-700/50 rounded-2xl shadow-2xl w-[350px] md:w-[400px] h-[600px] max-h-[80vh] flex flex-col overflow-hidden">
            <div className="flex justify-between items-center p-4 border-b border-zinc-800 bg-black/40">
                <h3 className="font-bold text-white flex items-center gap-2">
                    <MessageSquarePlus size={18} className="text-sfc-orange" />
                    {t.supportMessages}
                </h3>
                <div className="flex items-center gap-2">
                    <button onClick={() => activeConv ? fetchConversationDetail(activeConv.id, true) : fetchConversations(true)} className="text-gray-400 hover:text-white transition-colors" title="Refresh">
                        <RefreshCw size={16} />
                    </button>
                    <button onClick={onClose} className="text-gray-400 hover:text-white transition-colors">
                        <X size={20} />
                    </button>
                </div>
            </div>
            <div className="flex-1 overflow-hidden">
                {!activeConv ? renderList() : activeConv === 'new' ? renderNew() : renderChat()}
            </div>
        </div>
    </div>
  );
};
