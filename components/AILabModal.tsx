import React, { useState, useRef, useEffect } from 'react';
import ReactDOM from 'react-dom';
import { X, Send, Cpu, Sparkles, Paperclip, File as FileIcon, Clock, Plus, Trash2, MessageSquare, Download, Pencil, MoreHorizontal, Check } from 'lucide-react';
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
  const [isGeneratingReport, setIsGeneratingReport] = useState(false);
  const [attachedFile, setAttachedFile] = useState<File | null>(null);
  const [sessionId, setSessionId] = useState<string | undefined>();
  const [history, setHistory] = useState<any[]>([]);
  const [showHistory, setShowHistory] = useState(false);
  const [editingSessionId, setEditingSessionId] = useState<string | null>(null);
  const [editTitle, setEditTitle] = useState('');
  const [activeMenuId, setActiveMenuId] = useState<string | null>(null);
  const [thinkingSeconds, setThinkingSeconds] = useState<number | null>(null);
  
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const abortControllerRef = useRef<AbortController | null>(null);
  const thinkingIntervalRef = useRef<any>(null);
  
  const fetchHistory = async () => {
      try {
          const res = await authFetch('/api/ai/history?action=list');
          if (res.ok) {
              const data = await res.json();
              setHistory(data.sessions || []);
          }
      } catch (err) {}
  };

  const hasInitializedRef = useRef(false);

  useEffect(() => {
    if (!isOpen) {
        hasInitializedRef.current = false;
        return;
    }
    
    if (hasInitializedRef.current) return;
    hasInitializedRef.current = true;

    if (!user) {
        onClose();
        if (onNavigate) onNavigate('login');
        return;
    }
    
    startNewChat();
    fetchHistory();
  }, [isOpen, user?.id, language, initialGreeting]);

  useEffect(() => {
    const handleGlobalClick = () => {
        if (activeMenuId) setActiveMenuId(null);
    };
    document.addEventListener('click', handleGlobalClick);
    return () => document.removeEventListener('click', handleGlobalClick);
  }, [activeMenuId]);

  const stopGeneration = () => {
      if (abortControllerRef.current) {
          abortControllerRef.current.abort();
      }
      if (thinkingIntervalRef.current) {
          clearInterval(thinkingIntervalRef.current);
          thinkingIntervalRef.current = null;
      }
      setThinkingSeconds(null);
  };

  useEffect(() => {
      if (!isOpen) {
          stopGeneration();
      }
  }, [isOpen]);

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

  const startRename = (e: React.MouseEvent, session: any) => {
      e.stopPropagation();
      setEditingSessionId(session.id);
      setEditTitle(session.title);
      setActiveMenuId(null);
  };

  const saveRename = async (id: string, e?: React.FormEvent | React.FocusEvent) => {
      if (e) {
          e.preventDefault();
          if ('stopPropagation' in e) e.stopPropagation();
      }
      
      const newTitle = editTitle.trim();
      setEditingSessionId(null);
      if (!newTitle) return;
      
      const originalTitle = history.find(s => s.id === id)?.title;
      if (newTitle === originalTitle) return;

      setHistory(prev => prev.map(s => s.id === id ? { ...s, title: newTitle } : s));

      try {
          const res = await authFetch('/api/ai/history?action=rename', {
              method: 'PATCH',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ sessionId: id, title: newTitle })
          });
          if (!res.ok) throw new Error('Rename failed');
      } catch (err) {
          alert(t.renameFailed || 'Failed to rename chat. Please try again.');
          // Revert on failure
          if (originalTitle) {
              setHistory(prev => prev.map(s => s.id === id ? { ...s, title: originalTitle } : s));
          }
      }
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

  const handleDownloadReport = async () => {
    try {
        setIsGeneratingReport(true);
        const { downloadHtmlReport } = await import('../utils/reportGenerator');
        
        const userQ = messages.filter(m => m.role === 'user').map(m => m.text).join('\n---\n') || '';
        const aiA = messages.filter(m => m.role === 'model' && m.id !== 'welcome').map(m => m.text).join('\n---\n') || '';

        const data = {
            title: language === 'zh' ? 'AI 合规分析报告' : 'AI Compliance Analysis Report',
            meta: {
                [language === 'zh' ? '用户名/邮箱' : 'User']: user?.name || user?.email,
                [language === 'zh' ? '当前套餐' : 'Plan']: user?.membership?.plan || 'free',
                [language === 'zh' ? '功能/模型' : 'Topic']: topic || 'AI Chat',
                [language === 'zh' ? '带附件' : 'Attachment']: attachedFile ? attachedFile.name : (language === 'zh' ? '否' : 'No')
            },
            warning: user?.membership?.plan === 'free' ? (language === 'zh' ? '建议升级到 Pro 解锁无限制高级功能。' : 'Upgrade to Pro for unlimited advanced features.') : undefined,
            contentHtml: `
                <h3>${language === 'zh' ? '提问内容' : 'User Query'}</h3>
                <div class="content">${userQ || (language === 'zh' ? '暂无数据' : 'No data')}</div>
                <h3>${language === 'zh' ? 'AI 分析结果' : 'AI Analysis'}</h3>
                <div class="content">${aiA || (language === 'zh' ? '暂无数据' : 'No data')}</div>
            `
        };

        const dateStr = new Date().toISOString().replace(/\D/g, '').substring(0, 12);
        downloadHtmlReport(data, `sailguard-ai-report-${dateStr}`, language);
    } catch(err) {
        alert(language === 'zh' ? '报告生成失败，请稍后重试' : 'Failed to generate report. Please try again');
    } finally {
        setIsGeneratingReport(false);
    }
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

  const isSubmittingRef = useRef(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) {
        onClose();
        if (onNavigate) onNavigate('register');
        return;
    }
    
    if (isSubmittingRef.current || isLoading) return;
    const trimmedInput = input.trim();
    if ((!trimmedInput && !attachedFile)) return;

    isSubmittingRef.current = true;
    let displayText = trimmedInput;
    if (attachedFile) {
        displayText = `[File: ${attachedFile.name}]\n${trimmedInput}`;
    }

    const currentPrompt = trimmedInput || "Describe this file.";
    const currentFile = attachedFile || undefined;

    const userMsg: ChatMessage = {
      id: Date.now().toString(),
      role: 'user',
      text: displayText,
    };

    setMessages((prev) => [...prev, userMsg]);
    setInput('');
    setIsLoading(true);
    setAttachedFile(null);
    setThinkingSeconds(0);
    
    abortControllerRef.current = new AbortController();
    
    thinkingIntervalRef.current = setInterval(() => {
        setThinkingSeconds(prev => prev !== null ? prev + 1 : null);
    }, 1000);

    const modelMsgId = (Date.now() + 1).toString();
    const modelMsg: ChatMessage = {
      id: modelMsgId,
      role: 'model',
      text: '', // Text will be overridden by the thinking timer in UI
      isStreaming: true,
    };

    setMessages((prev) => [...prev, modelMsg]);

    let hasReceivedFirstChunk = false;

    try {
      await streamBackendChat(
        currentPrompt, 
        (chunk) => {
             if (!hasReceivedFirstChunk) {
               hasReceivedFirstChunk = true;
               setThinkingSeconds(null);
               if (thinkingIntervalRef.current) {
                   clearInterval(thinkingIntervalRef.current);
                   thinkingIntervalRef.current = null;
               }
               setMessages((prev) =>
                 prev.map((msg) =>
                   msg.id === modelMsgId ? { ...msg, text: chunk } : msg
                 )
               );
             } else {
               setMessages((prev) =>
                 prev.map((msg) =>
                   msg.id === modelMsgId ? { ...msg, text: msg.text + chunk } : msg
                 )
               );
             }
        }, 
        systemInstruction, 
        currentFile,
        token,
        sessionId,
        (newSessionId) => {
            if (!sessionId) {
                setSessionId(newSessionId);
                fetchHistory(); // Refresh list to show new session ID early
            }
        },
        topic || 'AI Chat',
        topic,
        undefined, // onStatus if needed later
        abortControllerRef.current || undefined
      );
      
      await fetchHistory();
      refreshUser();
    } catch (err: any) {
        console.error("Chat Stream Error:", err);
        const errCode = err.code || '';
        const tai = translations[language as keyof typeof translations].aiSaas;
        
        let displayError = err.message || "[System Error] Failed to generate response";
        if (displayError.includes("Unexpected token") || displayError.includes("A server error") || displayError.includes("Unexpected end of JSON input")) {
             displayError = language === 'zh' ? 'AI 服务暂时不可用，请稍后重试' : 'AI service is temporarily unavailable. Please try again later.';
        }

        if (errCode === 'ABORTED_BY_USER') {
             displayError = language === 'zh' ? '已停止生成。' : 'Generation stopped.';
             // If we want it to not look like an error, we can just append it without [Error] prefix.
             // But for now appending [Error] might be okay. Let's customize it.
        }
        else if (errCode === 'AI_FIRST_TOKEN_TIMEOUT') displayError = language === 'zh' ? 'AI 首次响应较慢，请稍后重试' : 'AI first response is slow. Please try again.';
        else if (errCode === 'AI_RESPONSE_TIMEOUT') displayError = language === 'zh' ? 'AI 响应超时，请稍后重试' : 'AI response timed out. Please try again.';
        else if (errCode === 'AI_PROVIDER_NOT_CONFIGURED') displayError = language === 'zh' ? 'AI 服务未配置，请检查 API Key' : 'AI service is not configured. Please check API key.';
        else if (errCode === 'AI_PROVIDER_ERROR') displayError = language === 'zh' ? 'AI 服务调用失败，请检查 API Key 或模型配置' : 'AI provider failed. Please check API key or model configuration.';
        else if (errCode === 'VERCEL_ERROR') displayError = language === 'zh' ? 'AI 后端服务异常，请检查部署日志' : 'AI backend service error. Please check deployment logs.';
        else if (errCode === 'DATABASE_REQUIRED_FOR_FILE') displayError = language === 'zh' ? '文件分析需要数据库连接，请稍后重试' : 'File analysis requires database connection. Please try again later.';
        else if (errCode === 'MEMBERSHIP_CHECK_UNAVAILABLE') displayError = language === 'zh' ? '暂时无法验证会员权限，请稍后重试' : 'Unable to verify membership. Please try again later.';
        else if (errCode === 'FREE_DAILY_LIMIT_REACHED') displayError = tai?.freeDailyLimitReached || displayError;
        else if (errCode === 'STARTUP_DAILY_LIMIT_REACHED') displayError = tai?.startupDailyLimitReached || displayError;
        else if (errCode === 'ATTACHMENT_REQUIRES_STARTUP') displayError = tai?.fileUploadRequiresStartup || displayError;
        else if (errCode === 'ECI_REQUIRES_PRO') displayError = tai?.eciRequiresPro || displayError;
        else if (errCode === 'BLOB_TOKEN_MISSING') displayError = language === 'zh' ? '文件存储未配置，请检查 Vercel Blob Token。' : 'File storage is not configured. Please check Vercel Blob Token.';
        else if (errCode === 'UPLOADED_FILE_TABLE_MISSING') displayError = language === 'zh' ? '文件表未创建，请先同步数据库。' : 'Uploaded file table is missing. Please sync the database.';
        else if (errCode === 'DATABASE_CONNECTION_FAILED') displayError = language === 'zh' ? '数据库连接失败，请稍后重试。' : 'Database connection failed. Please try again later.';
        else if (errCode === 'FILE_UPLOAD_REQUIRES_STARTUP') displayError = tai?.fileUploadRequiresStartup || (language === 'zh' ? '文件上传需要 Startup 或 Pro 套餐。' : 'File upload requires Startup or Pro plan.');
        else if (errCode === 'FILE_TOO_LARGE') displayError = language === 'zh' ? '文件过大，请上传更小的文件。' : 'File is too large. Please upload a smaller file.';
        else if (errCode === 'FILE_DATA_EMPTY') displayError = language === 'zh' ? '文件数据为空，请重新选择文件。' : 'File data is empty. Please select the file again.';
        
        setMessages((prev) =>
          prev.map((msg) =>
            msg.id === modelMsgId 
              ? { ...msg, text: hasReceivedFirstChunk ? msg.text + (errCode === 'ABORTED_BY_USER' ? `\n\n${displayError}` : `\n\n[Error] ${displayError}`) : (errCode === 'ABORTED_BY_USER' ? displayError : `[Error] ${displayError}`) } 
              : msg
          )
        );
    } finally {
      if (thinkingIntervalRef.current) {
          clearInterval(thinkingIntervalRef.current);
          thinkingIntervalRef.current = null;
      }
      setThinkingSeconds(null);
      
      setMessages((prev) =>
        prev.map((msg) =>
          msg.id === modelMsgId ? { ...msg, isStreaming: false } : msg
        )
      );
      setIsLoading(false);
      isSubmittingRef.current = false;
    }
  };

  if (!isOpen) return null;

  return ReactDOM.createPortal(
    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4">
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
                        onClick={() => {
                            if (editingSessionId !== session.id) {
                                loadSession(session.id);
                            }
                        }}
                        className={`relative p-3 border-b border-zinc-800/50 cursor-pointer flex items-center justify-between group transition-colors ${sessionId === session.id ? 'bg-zinc-800/80 border-l-2 border-l-sfc-orange' : 'hover:bg-zinc-800/50'} ${editingSessionId === session.id ? 'bg-zinc-800/80' : ''}`}
                    >
                        <div className="flex items-center gap-2 overflow-hidden w-full h-6">
                            <MessageSquare size={14} className={sessionId === session.id ? 'text-sfc-orange shrink-0' : 'text-gray-500 shrink-0'} />
                            
                            {editingSessionId === session.id ? (
                                <div className="flex w-full items-center">
                                    <input
                                        type="text"
                                        autoFocus
                                        value={editTitle}
                                        onChange={(e) => setEditTitle(e.target.value)}
                                        onClick={(e) => e.stopPropagation()}
                                        onKeyDown={(e) => {
                                            if (e.key === 'Enter') {
                                                saveRename(session.id, e);
                                            } else if (e.key === 'Escape') {
                                                e.stopPropagation();
                                                setEditingSessionId(null);
                                            }
                                        }}
                                        onBlur={(e) => saveRename(session.id, e)}
                                        className="w-full bg-zinc-900 border border-zinc-600 rounded text-sm text-white px-1 outline-none focus:border-sfc-orange h-6"
                                    />
                                    <button 
                                        className="ml-1 text-green-400 p-0.5 hover:text-green-300"
                                        onMouseDown={(e) => { e.preventDefault(); saveRename(session.id, e); }}
                                    >
                                        <Check size={14} />
                                    </button>
                                </div>
                            ) : (
                                <span className="text-sm text-gray-300 truncate w-full pr-2 select-none" title={session.title}>{session.title}</span>
                            )}
                        </div>
                        
                        {editingSessionId !== session.id && (
                            <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity absolute right-2 bg-gradient-to-l from-zinc-800 via-zinc-800 to-transparent pl-4 h-full top-0">
                                <button 
                                    onClick={(e) => startRename(e, session)} 
                                    className="p-1 text-gray-400 hover:text-white transition-colors"
                                    title={t.renameChat || 'Rename'}
                                >
                                    <Pencil size={14} />
                                </button>
                                <div className="relative">
                                    <button 
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            setActiveMenuId(activeMenuId === session.id ? null : session.id);
                                        }} 
                                        className="p-1 text-gray-400 hover:text-white transition-colors"
                                        title={t.moreOptions || 'More'}
                                    >
                                        <MoreHorizontal size={14} />
                                    </button>
                                    
                                    {activeMenuId === session.id && (
                                        <div 
                                            className="absolute right-0 top-full mt-1 w-32 bg-zinc-800 border border-zinc-700 rounded-lg shadow-xl py-1 z-50 text-sm overflow-hidden"
                                        >
                                            <button 
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    setActiveMenuId(null);
                                                    startRename(e, session);
                                                }}
                                                className="w-full text-left px-3 py-2 text-gray-300 hover:bg-zinc-700 hover:text-white flex items-center gap-2 transition-colors"
                                            >
                                                <Pencil size={12} /> {t.renameChat || 'Rename'}
                                            </button>
                                            <button 
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    setActiveMenuId(null);
                                                    deleteSession(e, session.id);
                                                }}
                                                className="w-full text-left px-3 py-2 text-red-400 hover:bg-zinc-700 hover:text-red-300 flex items-center gap-2 transition-colors"
                                            >
                                                <Trash2 size={12} /> {t.deleteChat || 'Delete'}
                                            </button>
                                        </div>
                                    )}
                                </div>
                            </div>
                        )}
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
              <div className="flex items-center gap-2">
                  <button
                      onClick={handleDownloadReport}
                      disabled={isGeneratingReport || messages.length <= 1}
                      className="bg-zinc-800 hover:bg-zinc-700 text-white px-3 py-2 rounded-lg text-sm transition-colors flex items-center gap-2 disabled:opacity-50"
                  >
                      <Download size={14} />
                      <span className="hidden md:inline">
                          {isGeneratingReport ? (language === 'zh' ? '生成中...' : 'Generating...') : (language === 'zh' ? '下载报告' : 'Download Report')}
                      </span>
                  </button>
                  {(!user?.membership || user.membership.plan === 'free' || user.membership.status === 'trial') && (
                      <button 
                          onClick={() => {
                              onClose();
                              if (onNavigate) {
                                  const pricingEl = document.getElementById('pricing-section');
                                  if (pricingEl) {
                                      setTimeout(() => {
                                          pricingEl.scrollIntoView({ behavior: 'smooth', block: 'start' });
                                      }, 100);
                                  } else {
                                      sessionStorage.setItem('aiScrollTarget', 'pricing');
                                      onNavigate('ai-saas');
                                  }
                              }
                          }}
                          className="bg-sfc-orange hover:bg-orange-600 text-white px-4 py-2 rounded-full text-sm font-bold shadow-lg transition-colors ml-2"
                      >
                          {language === 'zh' ? '升级 AI' : 'Upgrade AI'}
                      </button>
                  )}
                  <button 
                    onClick={onClose}
                    className="text-gray-400 hover:text-white transition-colors ml-1"
                  >
                    <X size={24} />
                  </button>
              </div>
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
                    <div className="whitespace-pre-wrap">
                        {msg.isStreaming && msg.role === 'model' && msg.text === '' && thinkingSeconds !== null ? (
                            language === 'zh' ? `思考中 ${thinkingSeconds} 秒...` : `Thinking ${thinkingSeconds}s...`
                        ) : msg.text}
                    </div>
                    {msg.isStreaming && msg.text !== '' && <span className="inline-block w-1.5 h-4 ml-1 bg-purple-400 animate-pulse align-middle" />}
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
                {isLoading ? (
                    <button
                        type="button"
                        onClick={stopGeneration}
                        className="bg-red-500 text-white p-3 md:p-3.5 rounded-full hover:bg-red-400 transition-colors shrink-0"
                        title={language === 'zh' ? '停止生成' : 'Stop generating'}
                    >
                        <div className="w-5 h-5 flex items-center justify-center">
                            <div className="w-3.5 h-3.5 bg-white rounded-sm" />
                        </div>
                    </button>
                ) : (
                    <button
                      type="submit"
                      disabled={(!input.trim() && !attachedFile)}
                      className="bg-white text-black p-3 md:p-3.5 rounded-full hover:bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed transition-colors shrink-0"
                      title={language === 'zh' ? '发送' : 'Send'}
                    >
                      <Send size={20} />
                    </button>
                )}
              </div>
            </form>
        </div>
      </div>
    </div>,
    document.body
  );
};

export default AILabModal;