import React, { useState, useRef, useEffect } from 'react';
import { X, Send, Cpu, Sparkles, Paperclip, File as FileIcon } from 'lucide-react';
import { streamBackendChat } from '../services/geminiService';
import { ChatMessage, Language } from '../types';
import { translations } from '../translations';
import { useAuth } from '../contexts/AuthContext';

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
  const { user, refreshUser } = useAuth();
  
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [attachedFile, setAttachedFile] = useState<File | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  // Reset messages when modal opens
  useEffect(() => {
    if (isOpen) {
        if (!user) {
            onClose();
            if (onNavigate) onNavigate('register');
            return;
        }
        let greeting = initialGreeting || t.welcome;
        setMessages([
            {
              id: 'welcome',
              role: 'model',
              text: greeting,
            },
        ]);
        setAttachedFile(null);
    }
  }, [isOpen, language, initialGreeting, t.welcome, user, onNavigate, onClose]);

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

    // Construct user display message
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
    
    // Prepare data
    const currentPrompt = input || "Describe this file.";
    const currentFile = attachedFile || undefined;
    setAttachedFile(null); // Clear attachment immediately after send

    const modelMsgId = (Date.now() + 1).toString();
    const modelMsg: ChatMessage = {
      id: modelMsgId,
      role: 'model',
      text: '',
      isStreaming: true,
    };

    setMessages((prev) => [...prev, modelMsg]);

    try {
      await streamBackendChat(currentPrompt, (chunk) => {
        setMessages((prev) =>
          prev.map((msg) =>
            msg.id === modelMsgId ? { ...msg, text: msg.text + chunk } : msg
          )
        );
      }, systemInstruction, currentFile);
      
      // Refresh user after stream to get updated trial counts
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
      
      <div className="relative w-full max-w-2xl bg-zinc-900 border border-zinc-700 rounded-2xl shadow-2xl overflow-hidden flex flex-col h-[600px] animate-[fadeIn_0.3s_ease-out]">
        
        {/* Header */}
        <div className="bg-gradient-to-r from-purple-900/50 to-blue-900/50 p-4 border-b border-zinc-700 flex justify-between items-center">
          <div className="flex items-center gap-2 text-white">
            <Cpu className="text-purple-400" size={24} />
            <h2 className="font-bold text-lg tracking-wide">{topic || 'AI SAAS'}</h2>
          </div>
          <button 
            onClick={onClose}
            className="text-gray-400 hover:text-white transition-colors"
          >
            <X size={24} />
          </button>
        </div>

        {/* Chat Area */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4 scrollbar-hide bg-black/40">
          {messages.map((msg) => (
            <div
              key={msg.id}
              className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              <div
                className={`max-w-[80%] rounded-2xl px-4 py-3 text-sm leading-relaxed ${
                  msg.role === 'user'
                    ? 'bg-blue-600 text-white'
                    : 'bg-zinc-800 text-gray-100 border border-zinc-700'
                }`}
              >
                {msg.role === 'model' && (
                    <div className="flex items-center gap-2 mb-1 text-xs text-purple-400 font-bold uppercase">
                        <Sparkles size={10} /> {topic || 'Assistant'}
                    </div>
                )}
                <div className="whitespace-pre-wrap">{msg.text}</div>
                {msg.isStreaming && <span className="inline-block w-1 h-4 ml-1 bg-purple-400 animate-pulse align-middle" />}
              </div>
            </div>
          ))}
          <div ref={messagesEndRef} />
        </div>

        {/* Input Area */}
        <form onSubmit={handleSubmit} className="p-4 bg-zinc-900 border-t border-zinc-800">
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
                className="bg-black/50 border border-zinc-700 text-gray-400 p-3 rounded-full hover:text-white hover:border-zinc-500 transition-all"
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
              className="flex-1 bg-black/50 border border-zinc-700 rounded-full px-5 py-3 text-white focus:outline-none focus:border-purple-500 transition-colors"
            />
            <button
              type="submit"
              disabled={isLoading || (!input.trim() && !attachedFile)}
              className="bg-white text-black p-3 rounded-full hover:bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
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
  );
};

export default AILabModal;