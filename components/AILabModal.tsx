import React, { useState, useRef, useEffect } from 'react';
import { X, Send, Cpu, Sparkles, Paperclip, File as FileIcon, Clock, Plus, Trash2, MessageSquare } from 'lucide-react';
import { streamBackendChat } from '../services/geminiService';
import { ChatMessage, Language } from '../types';
import { translations } from '../translations';
import { useAuth } from '../contexts/AuthContext';
import { authFetch } from '../utils/apiClient';

interface AILabModalProps {
  isOpen: boolean;
  onClose: () => void;
  language: Language;
  topic?: string;
  systemInstruction?: string;
  initialGreeting?: string;
  onNavigate?: (page: any) => void;
}

const AILabModal: React.FC<AILabModalProps> = ({ 
  isOpen, 
  onClose, 
  language, 
  topic, 
  systemInstruction, 
  initialGreeting,
  onNavigate
}) => {
  const t = translations[language].chat;
  const { user, refreshUser, token } = useAuth();
  
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [attachedFile, setAttachedFile] = useState<File | null>(null);
  const [sessionId, setSessionId] = useState<string | undefined>();
  const [history, setHistory] = useState<any[]>([]);
  const [showHistory, setShowHistory] = useState(false);
  
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const fetchHistory = async () => {
      try {
          const res = await authFetch('/api/ai/history?action=list');
          if (res.ok) {
              const data = await res.json();
              setHistory(data.sessions || []);
          }
      } catch (err) {}
  };

  useEffect(() => {
    if (isOpen) {
        if (!user) {
            onClose();
            if (onNavigate) onNavigate('login');
            return;
        }
        startNewChat();
        fetchHistory();
    }
  }, [isOpen, language, initialGreeting, t.welcome, user, onClose]);

  const startNewChat = () => {
      setSessionId(undefined);
      let greeting = initialGreeting || t.welcome;
      setMessages([
          {
            id: 'welcome',
            role: 'model',
            text: greeting,
          },
      ]);
      setAttachedFile(null);
  };

  const loadSession = async (id: string) => {
      try {
          const res = await authFetch(`/api/ai/history?action=get&sessionId=${id}`);
          if (res.ok) {
              const data = await res.json();
              setSessionId(id);
              setMessages(data.session.messages.map((m: any) => ({
                  id: m.id,
                  role: m.role,
                  text: m.content
              })));
              setShowHistory(false);
          }
      } catch (err) {}
  };

  const deleteSession = async (e: React.MouseEvent, id: string) => {
      e.stopPropagation();
      try {
          await authFetch(`/api/ai/history?action=delete&sessionId=${id}`, { method: 'DELETE' });
          if (sessionId === id) {
              startNewChat();
          }
          fetchHistory();
      } catch (err) {}
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!user) {
        onClose();
        if (onNavigate) onNavigate('register');
        return;
    }
    if (e.target.files && e.target.files[0]) {
      setAttachedFile(e.target.files[0]);
    }
    if (fileInputRef.current) {
        fileInputRef.current.value = '';
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) {
        onClose();
        if (onNavigate) onNavigate('register');
        return;
    }
    if ((!input.trim() && !attachedFile) || isLoading) return;

    let displayText = input;
    if (attachedFile) {
        displayText = `[File: ${attachedFile.name}]\n${input}`;
    }

    const userMsg: ChatMessage = {
      id: Date.now().toString(),
      role: 'user',
      text: displayText,
    };

    setMessages((prev) => [...prev, userMsg]);
    setInput('');
    setIsLoading(true);
    
    const currentPrompt = input || "Describe this file.";
    const currentFile = attachedFile || undefined;
    setAttachedFile(null);

    const modelMsgId = (Date.now() + 1).toString();
    const modelMsg: ChatMessage = {
      id: modelMsgId,
      role: 'model',
      text: '',
      isStreaming: true,
    };

    setMessages((prev) => [...prev, modelMsg]);

    try {
      await streamBackendChat(
        currentPrompt, 
        (chunk) => {
            setMessages((prev) =>
              prev.map((msg) =>
                msg.id === modelMsgId ? { ...msg, text: msg.text + chunk } : msg
              )
            );
        }, 
        systemInstruction, 
        currentFile,
        token,
        sessionId,
        (newSessionId) => {
            if (!sessionId) {
                setSessionId(newSessionId);
                fetchHistory(); // Refresh list to show new session
            }
        },
        topic || 'AI Chat',
        topic
      );
      
      refreshUser();
    } finally {
      setMessages((prev) =>
        prev.map((msg) =>
          msg.id === modelMsgId ? { ...msg, isStreaming: false } : msg
        )
      );
      setIsLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      <div 
        className="absolute inset-0 bg-black/70 backdrop-blur-sm"
        onClick={onClose}
      />
      
      <div className="relative w-full max-w-4xl bg-zinc-900 border border-zinc-700 rounded-2xl shadow-2xl overflow-hidden flex h-[600px] animate-[fadeIn_0.3s_ease-out]">
        
        {/* History Sidebar */}
        <div className={`w-64 bg-black/60 border-r border-zinc-800 flex flex-col transition-all duration-300 ${showHistory ? 'ml-0' : '-ml-64'} md:ml-0 overflow-hidden absolute md:relative h-full z-20`}>
            <div className="p-4 border-b border-zinc-800 flex justify-between items-center bg-black/40">
                <span className="font-bold text-white uppercase text-xs tracking-wider flex items-center gap-2">
                    <Clock size={14} className="text-sfc-orange" />
                    History
                </span>
                <button onClick={startNewChat} className="text-gray-400 hover:text-white" title="New Chat"><Plus size={16}/></button>
            </div>
            <div className="flex-1 overflow-y-auto w-full">
                {history.map(session => (
                    <div 
                        key={session.id} 
                        onClick={() => loadSession(session.id)}
                        className={`p-3 border-b border-zinc-800/50 cursor-pointer flex items-center justify-between group transition-colors ${sessionId === session.id ? 'bg-zinc-800/80 border-l-2 border-l-sfc-orange' : 'hover:bg-zinc-800/50'}`}
                    >
                        <div className="flex items-center gap-2 overflow-hidden w-full">
                            <MessageSquare size={14} className={sessionId === session.id ? 'text-sfc-orange' : 'text-gray-500'} />
                            <span className="text-sm text-gray-300 truncate w-full pr-2 select-none">{session.title}</span>
                        </div>
                        <Trash2 size={14} className="text-gray-600 opacity-0 group-hover:opacity-100 hover:text-red-400 cursor-pointer flex-shrink-0" onClick={(e) => deleteSession(e, session.id)} />
                    </div>
                ))}
            </div>
        </div>

        {/* Main Chat Area */}
        <div className="flex-1 flex flex-col h-full bg-zinc-900 relative z-10 w-full">
            {/* Header */}
            <div className="bg-gradient-to-r from-purple-900/50 to-blue-900/50 p-4 border-b border-zinc-700 flex justify-between items-center w-full">
              <div className="flex items-center gap-3 text-white">
                <button className="md:hidden text-gray-400 hover:text-white" onClick={() => setShowHistory(!showHistory)}>
                    <Clock size={20} />
                </button>
                <Cpu className="text-purple-400" size={24} />
                <h2 className="font-bold text-lg tracking-wide select-none">{topic || 'AI SAAS'}</h2>
              </div>
              <button 
                onClick={onClose}
                className="text-gray-400 hover:text-white transition-colors"
              >
                <X size={24} />
              </button>
            </div>

            {/* Chat Messages */}
            <div className="flex-1 overflow-y-auto p-4 md:p-6 space-y-6 scrollbar-hide bg-black/40" onClick={() => setShowHistory(false)}>
              {messages.map((msg) => (
                <div
                  key={msg.id}
                  className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
                >
                  <div
                    className={`max-w-[85%] md:max-w-[75%] rounded-2xl px-5 py-4 text-sm leading-relaxed shadow-sm ${
                      msg.role === 'user'
                        ? 'bg-blue-600/90 text-white border-blue-500/50 border'
                        : 'bg-zinc-800 text-gray-100 border border-zinc-700 shadow-xl'
                    }`}
                  >
                    {msg.role === 'model' && (
                        <div className="flex items-center gap-2 mb-2 text-xs text-purple-400 font-bold uppercase tracking-wider">
                            <Sparkles size={12} /> {topic || 'Assistant'}
                        </div>
                    )}
                    <div className="whitespace-pre-wrap">{msg.text}</div>
                    {msg.isStreaming && <span className="inline-block w-1.5 h-4 ml-1 bg-purple-400 animate-pulse align-middle" />}
                  </div>
                </div>
              ))}
              <div ref={messagesEndRef} />
            </div>

            {/* Input Area */}
            <form onSubmit={handleSubmit} className="p-4 bg-zinc-900 border-t border-zinc-800 shrink-0">
              {attachedFile && (
                <div className="mb-3 flex items-center gap-2 bg-white/10 px-3 py-2 rounded-lg w-fit border border-white/20 animate-[fadeIn_0.2s_ease-out]">
                    <FileIcon size={14} className="text-purple-400" />
                    <span className="text-xs text-gray-200 truncate max-w-[200px]">{attachedFile.name}</span>
                    <button 
                        type="button" 
                        onClick={() => setAttachedFile(null)} 
                        className="ml-2 text-gray-400 hover:text-red-400 transition-colors"
                    >
                        <X size={14}/>
                    </button>
                </div>
              )}
              <div className="relative flex items-center gap-2">
                <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="bg-black/50 border border-zinc-700 text-gray-400 p-3 md:p-3.5 rounded-full hover:text-white hover:border-zinc-500 transition-all shrink-0"
                    title={language === 'zh' ? "添加文件" : "Attach file"}
                >
                    <Paperclip size={20} />
                </button>
                <input 
                    type="file" 
                    ref={fileInputRef} 
                    className="hidden" 
                    onChange={handleFileSelect} 
                    accept="image/*,application/pdf"
                />
                <input
                  type="text"
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  placeholder={t.inputPlaceholder}
                  className="flex-1 bg-black/50 border border-zinc-700 rounded-full px-5 p-3 md:p-3.5 text-white focus:outline-none focus:border-purple-500 transition-colors"
                />
                <button
                  type="submit"
                  disabled={isLoading || (!input.trim() && !attachedFile)}
                  className="bg-white text-black p-3 md:p-3.5 rounded-full hover:bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed transition-colors shrink-0"
                >
                  {isLoading ? (
                      <div className="w-5 h-5 border-2 border-black border-t-transparent rounded-full animate-spin" />
                  ) : (
                      <Send size={20} />
                  )}
                </button>
              </div>
            </form>
        </div>
      </div>
    </div>
  );
};

export default AILabModal;