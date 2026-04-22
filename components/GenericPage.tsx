import React, { useState, useEffect, useRef } from 'react';
import { FullLogo } from './FullLogo';
import { Language } from '../types';
import { streamBackendChat } from '../services/geminiService';
import { FileText, Shield, TrendingUp, Globe, Calculator, Scale, AlertCircle, CheckCircle, X, ArrowRight, Tag, Activity, Server, Users, Briefcase, User, Mail, Phone as PhoneIcon, Paperclip, PenTool, Coins, FileCheck, Search, Sparkles, Wand2, RefreshCw } from 'lucide-react';

const PAGE_BACKGROUND_IMAGE = "https://images.unsplash.com/photo-1451187580459-43490279c0fa?q=80&w=2072&auto=format&fit=crop";

interface GenericPageProps {
  title: string;
  language: Language;
  type: 'ecommerce' | 'news' | 'governance' | 'about' | 'join';
}

interface DetailContent {
  type: 'tool' | 'article' | 'text';
  title: string;
  subtitle?: string;
  date?: string;
  category?: string;
  content: React.ReactNode;
  tags?: string[];
}

interface AnalysisSegment {
    id: string;
    start: number;
    end: number;
    text: string;
    type: 'error' | 'warning';
    message: string;
    suggestion: string;
}

const cleanJsonString = (str: string) => {
    try {
        const jsonMatch = str.match(/```json\n([\s\S]*?)\n```/) || str.match(/```([\s\S]*?)```/);
        if (jsonMatch) {
            return jsonMatch[1];
        }
        return str;
    } catch (e) {
        return str;
    }
};

// --- SUB-COMPONENTS ---

const CopywritingAnalyzer = ({ language }: { language: Language }) => {
    const defaultText = language === 'zh' 
        ? "SkinWhitening Pro 是全马来西亚 No.1 的美白霜。100% 治愈痘痘，而且非常 cheap。"
        : "SkinWhitening Pro is the No.1 whitening cream in Malaysia. 100% cure for acne and very cheap.";

    const [text, setText] = useState(defaultText);
    const [debouncedText, setDebouncedText] = useState(defaultText);
    const [score, setScore] = useState(100);
    const [segments, setSegments] = useState<AnalysisSegment[]>([]);
    const [activeSegment, setActiveSegment] = useState<AnalysisSegment | null>(null);
    const [isFixing, setIsFixing] = useState(false);
    const [isScanning, setIsScanning] = useState(false);
    
    const textareaRef = useRef<HTMLTextAreaElement>(null);
    const backdropRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const handler = setTimeout(() => {
            setDebouncedText(text);
        }, 1000); 
        return () => clearTimeout(handler);
    }, [text]);

    useEffect(() => {
        const analyze = async () => {
            if (!debouncedText.trim()) {
                setSegments([]);
                setScore(100);
                return;
            }

            setIsScanning(true);
            
            const prompt = `
                You are a strict advertising compliance AI for Malaysia. 
                Analyze the following text for:
                1. "Policy Violations" (Absolute claims like "No.1", "100%", "Guaranteed", "Cure", "Best").
                2. "Cultural/Localization Issues" (Words that sound cheap, rude, or unnatural in Malaysian context).

                Return a JSON array ONLY. Format:
                [
                    { 
                        "quote": "exact substring from text", 
                        "type": "error" (for policy) or "warning" (for culture),
                        "message": "Short reason in ${language === 'zh' ? 'Chinese' : 'English'}", 
                        "suggestion": "Better alternative in ${language === 'zh' ? 'Chinese' : 'English'}" 
                    }
                ]
                
                Text to analyze:
                "${debouncedText}"
            `;

            try {
                let jsonStr = "";
                await streamBackendChat(prompt, (chunk) => jsonStr += chunk);
                
                const cleanedJson = cleanJsonString(jsonStr);
                const results = JSON.parse(cleanedJson);
                
                if (Array.isArray(results)) {
                    const newSegments: AnalysisSegment[] = [];
                    let currentScore = 100;
                    
                    results.forEach((item: any, index) => {
                        if (!item.quote) return;
                        const idx = debouncedText.indexOf(item.quote);
                        if (idx !== -1) {
                            newSegments.push({
                                id: `seg-${index}-${Date.now()}`,
                                start: idx,
                                end: idx + item.quote.length,
                                text: item.quote,
                                type: item.type === 'error' ? 'error' : 'warning',
                                message: item.message || 'Issue detected',
                                suggestion: item.suggestion || ''
                            });
                            currentScore -= (item.type === 'error' ? 15 : 5);
                        }
                    });

                    setSegments(newSegments);
                    setScore(Math.max(0, currentScore));
                }
            } catch (e) {
                console.error("Analysis failed", e);
            } finally {
                setIsScanning(false);
            }
        };
        
        analyze();
    }, [debouncedText, language]);

    const handleScroll = () => {
        if (textareaRef.current && backdropRef.current) {
            backdropRef.current.scrollTop = textareaRef.current.scrollTop;
            backdropRef.current.scrollLeft = textareaRef.current.scrollLeft;
        }
    };

    const handleAIFix = async () => {
        if (isFixing || !text) return;
        setIsFixing(true);
        setActiveSegment(null);
        
        const originalText = text;
        setText(""); 
        
        const prompt = `You are a professional copywriter for the Malaysian cross-border e-commerce market. 
        Rewrite the following product description to be strictly compliant with advertising laws (remove absolute claims like "No.1", "100%", "Cure", "Best", "Guaranteed").
        Make it culturally appealing to Malaysians (neutral, polite, professional). 
        Maintain the original language (${language === 'zh' ? 'Simplified Chinese' : 'English'}).
        Do not add any explanations, just output the rewritten text.
        
        Original Text:
        "${originalText}"`;

        try {
            await streamBackendChat(prompt, (chunk) => {
                setText(prev => prev + chunk);
            });
        } catch (e) {
            console.error(e);
            setText(originalText);
        } finally {
            setIsFixing(false);
        }
    };

    const renderHighlights = () => {
        const sortedSegments = [...segments].sort((a, b) => a.start - b.start);
        
        const nodes = [];
        let lastIndex = 0;

        sortedSegments.forEach((seg) => {
            if (seg.start > lastIndex) {
                nodes.push(
                    <span key={`text-${lastIndex}`}>{text.slice(lastIndex, seg.start)}</span>
                );
            }

            if (seg.start >= lastIndex) {
                 nodes.push(
                    <span 
                        key={seg.id}
                        onClick={(e) => {
                            e.stopPropagation();
                            setActiveSegment(seg);
                        }}
                        className={`
                            relative inline-block cursor-pointer border-b-2 transition-colors duration-200
                            ${seg.type === 'error' 
                                ? `border-red-500 ${activeSegment?.id === seg.id ? 'bg-red-500/30' : 'hover:bg-red-500/10'}` 
                                : `border-blue-500 ${activeSegment?.id === seg.id ? 'bg-blue-500/30' : 'hover:bg-blue-500/10'}` 
                            }
                        `}
                    >
                        {text.slice(seg.start, seg.end)}
                    </span>
                );
                lastIndex = seg.end;
            }
        });

        if (lastIndex < text.length) {
            nodes.push(<span key={`text-end`}>{text.slice(lastIndex)}</span>);
        }

        return nodes;
    };

    return (
        <div className="h-[600px] flex flex-col relative text-white">
            <div className="flex justify-between items-center mb-4 bg-white/5 p-4 rounded-lg border border-white/10">
                <div>
                    <h4 className="text-lg font-bold text-white flex items-center gap-2">
                        <PenTool size={18} className="text-sfc-orange" />
                        {language === 'zh' ? "智能文案检测" : "Smart Copy Check"}
                    </h4>
                    <p className="text-xs text-gray-400 mt-1">
                        {language === 'zh' ? "实时扫描广告法违规与文化冲突" : "Real-time scan for policy violations & cultural nuances"}
                    </p>
                </div>
                <div className="flex items-center gap-4 animate-[fadeIn_0.5s_ease-out]">
                    <div className="text-right">
                        <div className="text-[10px] text-gray-400 uppercase tracking-wider">{language === 'zh' ? "健康分" : "Health Score"}</div>
                        <div className={`text-3xl font-bold ${score > 80 ? 'text-green-400' : score > 60 ? 'text-yellow-400' : 'text-red-400'}`}>
                            {score}
                        </div>
                    </div>
                    <div className={`w-12 h-12 rounded-full border-4 flex items-center justify-center transition-colors duration-500 ${score > 80 ? 'border-green-400 text-green-400' : score > 60 ? 'border-yellow-400 text-yellow-400' : 'border-red-400 text-red-400'}`}>
                        {score > 80 ? <CheckCircle size={24} /> : <AlertCircle size={24} />}
                    </div>
                </div>
            </div>

            <div className="flex-1 relative bg-black/30 rounded-xl border border-white/10 overflow-hidden flex flex-col group">
                <div className="relative flex-1 w-full overflow-hidden">
                    <div 
                        ref={backdropRef}
                        className="absolute inset-0 z-10 p-6 text-lg leading-relaxed font-sans whitespace-pre-wrap break-words overflow-hidden pointer-events-none"
                        style={{ color: 'transparent' }} 
                    >
                        {renderHighlights()}
                        {text.endsWith('\n') && <br />}
                    </div>

                    <textarea 
                        ref={textareaRef}
                        className="absolute inset-0 z-0 w-full h-full bg-transparent p-6 text-lg text-gray-200 leading-relaxed font-sans resize-none focus:outline-none scrollbar-hide caret-white"
                        value={text}
                        onChange={(e) => setText(e.target.value)}
                        onScroll={handleScroll}
                        spellCheck={false}
                        disabled={isFixing}
                        placeholder={language === 'zh' ? "在此输入您的商品文案..." : "Enter your product copy here..."}
                        style={{ color: isFixing ? 'rgba(255,255,255,0.5)' : 'inherit' }}
                    />
                </div>

                <div className={`
                    absolute bottom-0 left-0 w-full p-4 bg-zinc-900/95 backdrop-blur border-t border-white/10 transition-transform duration-300 z-20
                    ${activeSegment ? 'translate-y-0' : 'translate-y-full'}
                `}>
                    {activeSegment && (
                        <div className="flex items-center justify-between gap-4">
                            <div className="flex items-start gap-3">
                                <div className={`p-2 rounded-full mt-1 ${activeSegment.type === 'error' ? 'bg-red-500/20 text-red-400' : 'bg-blue-500/20 text-blue-400'}`}>
                                    {activeSegment.type === 'error' ? <AlertCircle size={20} /> : <Sparkles size={20} />}
                                </div>
                                <div>
                                    <h5 className={`font-bold text-sm mb-1 ${activeSegment.type === 'error' ? 'text-red-400' : 'text-blue-400'}`}>
                                        {activeSegment.message}
                                    </h5>
                                    <div className="flex items-center gap-2 text-sm">
                                        <span className="text-gray-500 line-through">{activeSegment.text}</span>
                                        <ArrowRight size={14} className="text-gray-600" />
                                        <span className="text-green-400 font-mono bg-green-400/10 px-2 py-0.5 rounded">
                                            {activeSegment.suggestion}
                                        </span>
                                    </div>
                                </div>
                            </div>
                            <div className="flex gap-2 shrink-0">
                                <button 
                                    onClick={() => setActiveSegment(null)}
                                    className="p-2 text-gray-400 hover:text-white transition-colors"
                                >
                                    <X size={20} />
                                </button>
                                <button 
                                    onClick={() => {
                                        const before = text.slice(0, activeSegment.start);
                                        const after = text.slice(activeSegment.end);
                                        const newText = before + activeSegment.suggestion + after;
                                        setText(newText);
                                        setActiveSegment(null);
                                    }}
                                    className="px-4 py-2 bg-white text-black font-bold text-sm rounded hover:bg-gray-200 transition-colors flex items-center gap-2"
                                >
                                    <CheckCircle size={14} />
                                    {language === 'zh' ? "采纳" : "Apply"}
                                </button>
                            </div>
                        </div>
                    )}
                </div>
            </div>
            
            <div className="mt-4 flex justify-between items-center">
                 <div className="text-xs text-gray-500 flex items-center gap-3">
                    <span>{text.length} {language === 'zh' ? "字符" : "characters"}</span>
                    {isScanning && (
                        <span className="inline-flex items-center gap-1.5 text-sfc-orange animate-pulse bg-sfc-orange/10 px-2 py-0.5 rounded">
                            <div className="w-1.5 h-1.5 rounded-full bg-sfc-orange"></div>
                            {language === 'zh' ? "AI 正在扫描风险..." : "AI Scanning..."}
                        </span>
                    )}
                 </div>
                 
                 <div className="flex gap-3">
                     <button
                        onClick={() => {
                            setText(defaultText);
                            setActiveSegment(null);
                        }}
                        className="px-4 py-2 text-xs font-medium text-gray-400 hover:text-white transition-colors flex items-center gap-2"
                        disabled={isFixing}
                     >
                         <RefreshCw size={14} />
                         {language === 'zh' ? "重置" : "Reset"}
                     </button>
                     <button 
                        onClick={handleAIFix}
                        disabled={isFixing || isScanning}
                        className="px-6 py-2 bg-gradient-to-r from-sfc-blue to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white text-sm font-bold rounded-full shadow-lg shadow-blue-900/30 flex items-center gap-2 transition-all transform hover:scale-105 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
                     >
                        {isFixing ? (
                            <>
                                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                                {language === 'zh' ? "AI 优化中..." : "Optimizing..."}
                            </>
                        ) : (
                            <>
                                <Wand2 size={16} />
                                {language === 'zh' ? "AI 一键修复" : "AI Smart Fix"}
                            </>
                        )}
                     </button>
                 </div>
            </div>
        </div>
    );
};

const CalculatorModalContent = ({ language }: { language: Language }) => {
    const [cost, setCost] = useState(10);
    const [price, setPrice] = useState(25);
    const [shipping, setShipping] = useState(5);
    const [marketing, setMarketing] = useState(5);
    const [profit, setProfit] = useState(0);
    const [margin, setMargin] = useState(0);
    const [aiAdvice, setAiAdvice] = useState("");
    const [loadingAdvice, setLoadingAdvice] = useState(false);

    useEffect(() => {
        const p = price - cost - shipping - marketing;
        const m = price > 0 ? (p / price) * 100 : 0;
        setProfit(parseFloat(p.toFixed(2)));
        setMargin(parseFloat(m.toFixed(2)));
    }, [cost, price, shipping, marketing]);

    const getAdvice = async () => {
        setLoadingAdvice(true);
        setAiAdvice("");
        const prompt = `Act as a CFO for an e-commerce brand.
        Product Cost: $${cost}
        Selling Price: $${price}
        Shipping: $${shipping}
        Marketing: $${marketing}
        Profit: $${profit}
        Margin: ${margin}%
        
        Analyze this pricing structure. Is it healthy? Give 2-3 short, specific tips to improve profitability. Keep it under 50 words.`;
        
        try {
            await streamBackendChat(prompt, (chunk) => setAiAdvice(prev => prev + chunk));
        } catch(e) {
            setAiAdvice("AI Service Unavailable");
        } finally {
            setLoadingAdvice(false);
        }
    };

    return (
        <div className="h-[600px] flex flex-col text-white">
            <div className="flex items-center gap-2 mb-6">
                <Calculator className="text-sfc-orange" size={24} />
                <h3 className="text-xl font-bold">{language === 'zh' ? "利润计算器" : "Profit Calculator"}</h3>
            </div>
            
            <div className="grid grid-cols-2 gap-4 mb-6">
                <div className="space-y-1">
                    <label className="text-xs text-gray-400">{language === 'zh' ? "售价 ($)" : "Selling Price ($)"}</label>
                    <input type="number" value={price} onChange={e => setPrice(Number(e.target.value))} className="w-full bg-white/10 border border-white/20 rounded p-2 text-white focus:outline-none focus:border-sfc-orange" />
                </div>
                <div className="space-y-1">
                    <label className="text-xs text-gray-400">{language === 'zh' ? "成本 ($)" : "Product Cost ($)"}</label>
                    <input type="number" value={cost} onChange={e => setCost(Number(e.target.value))} className="w-full bg-white/10 border border-white/20 rounded p-2 text-white focus:outline-none focus:border-sfc-orange" />
                </div>
                <div className="space-y-1">
                    <label className="text-xs text-gray-400">{language === 'zh' ? "运费 ($)" : "Shipping ($)"}</label>
                    <input type="number" value={shipping} onChange={e => setShipping(Number(e.target.value))} className="w-full bg-white/10 border border-white/20 rounded p-2 text-white focus:outline-none focus:border-sfc-orange" />
                </div>
                <div className="space-y-1">
                    <label className="text-xs text-gray-400">{language === 'zh' ? "营销 ($)" : "Marketing ($)"}</label>
                    <input type="number" value={marketing} onChange={e => setMarketing(Number(e.target.value))} className="w-full bg-white/10 border border-white/20 rounded p-2 text-white focus:outline-none focus:border-sfc-orange" />
                </div>
            </div>

            <div className="bg-white/5 rounded-lg p-4 mb-6">
                <div className="flex justify-between items-end mb-2">
                    <span className="text-gray-400">{language === 'zh' ? "净利润" : "Net Profit"}</span>
                    <span className={`text-2xl font-bold ${profit >= 0 ? 'text-green-400' : 'text-red-400'}`}>${profit}</span>
                </div>
                <div className="flex justify-between items-end">
                    <span className="text-gray-400">{language === 'zh' ? "利润率" : "Margin"}</span>
                    <span className={`text-xl font-bold ${margin >= 20 ? 'text-green-400' : margin >= 10 ? 'text-yellow-400' : 'text-red-400'}`}>{margin}%</span>
                </div>
            </div>

            <div className="flex-1 overflow-y-auto min-h-0 bg-black/20 rounded-lg p-4 border border-white/5 mb-4">
                {aiAdvice ? (
                    <div className="text-sm text-gray-300 leading-relaxed">
                        <div className="flex items-center gap-2 text-purple-400 mb-2 font-bold text-xs uppercase tracking-wider">
                            <Sparkles size={12} /> AI Analysis
                        </div>
                        {aiAdvice}
                    </div>
                ) : (
                    <div className="h-full flex items-center justify-center text-gray-600 text-xs">
                        {language === 'zh' ? "点击分析获取 AI 建议" : "Click analyze for AI advice"}
                    </div>
                )}
            </div>

            <button 
                onClick={getAdvice}
                disabled={loadingAdvice}
                className="w-full py-3 bg-indigo-600 hover:bg-indigo-500 text-white font-bold rounded-lg transition-colors flex items-center justify-center gap-2 disabled:opacity-50"
            >
                {loadingAdvice ? <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <TrendingUp size={18} />}
                {language === 'zh' ? "AI 利润分析" : "Analyze Profitability"}
            </button>
        </div>
    );
};

const ProfitSimulatorContent = ({ language }: { language: Language }) => {
    const [sourcingCost, setSourcingCost] = useState(50);
    const [logisticCost, setLogisticCost] = useState(15);
    const [platformFee, setPlatformFee] = useState(5);
    const [sellingPrice, setSellingPrice] = useState(100);
    
    const totalCost = sourcingCost + logisticCost + (sellingPrice * platformFee / 100);
    const profit = sellingPrice - totalCost;
    const margin = (profit / sellingPrice) * 100;

    return (
        <div className="text-white space-y-6">
            <h4 className="text-lg font-bold text-sfc-orange mb-4">{language === 'zh' ? "单品利润预估" : "Unit Profit Estimation"}</h4>
            
            <div className="grid grid-cols-2 gap-6 text-sm">
                <div className="space-y-2">
                    <label className="text-gray-400 block">{language === 'zh' ? "采购成本 (RMB)" : "Sourcing Cost (RMB)"}</label>
                    <input 
                        type="number" 
                        value={sourcingCost}
                        onChange={(e) => setSourcingCost(Number(e.target.value))}
                        className="bg-black/40 rounded border border-white/10 p-3 text-white w-full focus:border-sfc-orange focus:outline-none transition-colors"
                    />
                </div>
                <div className="space-y-2">
                    <label className="text-gray-400 block">{language === 'zh' ? "预计售价 (RM)" : "Target Price (RM)"}</label>
                    <input 
                        type="number" 
                        value={sellingPrice}
                        onChange={(e) => setSellingPrice(Number(e.target.value))}
                        className="bg-black/40 rounded border border-white/10 p-3 text-white w-full focus:border-sfc-orange focus:outline-none transition-colors"
                    />
                </div>
            </div>
            
            <div className="mt-6 space-y-3 pt-4 border-t border-white/10">
                <div className="flex justify-between text-sm text-gray-400">
                    <span>{language === 'zh' ? "物流预估" : "Est. Logistics"}</span>
                    <span>- RM {logisticCost}</span>
                </div>
                <div className="flex justify-between text-sm text-gray-400">
                    <span>{language === 'zh' ? "平台佣金 (%)" : "Platform Commission (%)"}</span>
                    <div className="flex items-center gap-2">
                        <input 
                            type="number" 
                            value={platformFee}
                            onChange={(e) => setPlatformFee(Number(e.target.value))}
                            className="bg-black/40 w-12 text-center rounded border border-white/10 p-1 text-white text-xs focus:outline-none"
                        />
                        <span>- RM {(sellingPrice * platformFee / 100).toFixed(2)}</span>
                    </div>
                </div>
            </div>

            <div className="mt-6 pt-4 border-t border-white/10">
                <div className="flex justify-between items-center">
                    <span className="text-gray-200 font-bold">{language === 'zh' ? "预估净利" : "Est. Net Profit"}</span>
                    <div className="text-right">
                        <div className={`text-2xl font-bold ${profit > 0 ? 'text-green-400' : 'text-red-400'}`}>
                            RM {profit.toFixed(2)}
                        </div>
                        <div className={`text-xs ${margin > 0 ? 'text-green-600' : 'text-red-600'}`}>
                            Margin: {margin.toFixed(1)}%
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

const LiveStatsCard = ({ 
    icon, 
    label, 
    initialValue, 
    incrementRange, 
    suffix = "" 
}: { 
    icon: React.ReactNode, 
    label: string, 
    initialValue: number, 
    incrementRange: number,
    suffix?: string 
}) => {
    const [count, setCount] = useState(initialValue);

    useEffect(() => {
        const interval = setInterval(() => {
            setCount(prev => prev + Math.floor(Math.random() * incrementRange));
        }, 3000); 
        return () => clearInterval(interval);
    }, [incrementRange]);

    return (
        <div className="flex flex-col p-6 bg-white/5 border border-white/10 rounded-xl hover:bg-white/10 transition-all duration-500 group">
            <div className="flex justify-between items-start mb-4">
                <span className="text-gray-400 text-sm font-medium uppercase tracking-wider">{label}</span>
                <div className="text-sfc-orange opacity-80 group-hover:opacity-100 group-hover:scale-110 transition-all">
                    {icon}
                </div>
            </div>
            <div className="text-3xl font-mono font-bold text-white mt-auto">
                {count.toLocaleString()}{suffix}
            </div>
        </div>
    );
};

const FeatureCard = ({ icon, title, desc, onClick }: { icon: React.ReactNode, title: string, desc: string, onClick?: () => void }) => (
    <div
        onClick={onClick}
        className={`bg-white/5 p-6 rounded-xl border border-white/10 hover:bg-white/10 hover:-translate-y-1 transition-all duration-300 group cursor-pointer flex flex-col items-start gap-4 h-full`}
    >
        <div className="p-3 bg-sfc-blue/20 rounded-lg group-hover:bg-sfc-blue/40 transition-colors">
            {icon}
        </div>
        <div>
            <h4 className="text-xl font-bold text-white mb-2 group-hover:text-sfc-orange transition-colors">{title}</h4>
            <p className="text-gray-400 text-sm leading-relaxed">{desc}</p>
        </div>
        {onClick && (
            <div className="mt-auto pt-4 flex items-center text-sfc-blue text-xs font-bold uppercase tracking-wider opacity-0 group-hover:opacity-100 transition-opacity">
                ACCESS <ArrowRight size={12} className="ml-1" />
            </div>
        )}
    </div>
);

const NewsItem = ({ date, category, title, desc, onClick }: { date: string, category: string, title: string, desc: string, onClick?: () => void }) => (
    <div
        onClick={onClick}
        className="group border-b border-white/10 pb-6 last:border-0 cursor-pointer"
    >
        <div className="flex items-center gap-4 text-xs text-gray-500 mb-2">
            <span className="font-mono text-sfc-orange">{date}</span>
            <span className="w-1 h-1 bg-gray-600 rounded-full"></span>
            <span className="uppercase tracking-wider">{category}</span>
        </div>
        <h4 className="text-lg font-bold text-white mb-2 group-hover:text-sfc-orange transition-colors line-clamp-1">{title}</h4>
        <p className="text-gray-400 text-sm line-clamp-2 leading-relaxed">{desc}</p>
    </div>
);

const GovernanceCard = ({ icon, title, content }: { icon: React.ReactNode, title: string, content: string }) => (
    <div className="bg-white/5 p-8 rounded-xl border border-white/10 flex flex-col items-center text-center hover:bg-white/10 transition-all duration-300 hover:border-sfc-orange/50 hover:-translate-y-1">
        <div className="mb-6 p-4 bg-black/30 rounded-full border border-white/5 text-sfc-orange group-hover:scale-110 transition-transform">
            {icon}
        </div>
        <h4 className="text-xl font-bold text-white mb-4">{title}</h4>
        <p className="text-gray-400 leading-relaxed text-sm">
            {content}
        </p>
    </div>
);

const JobItem = ({ title, onClick }: { title: string; onClick?: () => void }) => (
    <div 
        onClick={onClick}
        className={`flex items-center justify-between p-4 bg-white/5 border border-white/10 rounded-lg hover:border-sfc-orange/50 transition-colors group ${onClick ? 'cursor-pointer' : ''}`}
    >
        <span className="text-white font-medium group-hover:text-sfc-orange transition-colors">{title}</span>
        <ArrowRight size={18} className="text-gray-500 group-hover:translate-x-1 transition-transform" />
    </div>
);

const JobApplicationModal = ({ isOpen, onClose, language, jobTitle }: { isOpen: boolean, onClose: () => void, language: Language, jobTitle?: string }) => {
    if (!isOpen) return null;
    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-black/80 backdrop-blur-sm" onClick={onClose}></div>
            <div className="relative w-full max-w-lg bg-zinc-900 border border-zinc-700 rounded-2xl shadow-2xl p-8 animate-[fadeIn_0.2s_ease-out] overflow-hidden text-white">
                <button onClick={onClose} className="absolute top-4 right-4 text-gray-400 hover:text-white z-10">
                    <X size={24} />
                </button>
                <div className="text-center py-8">
                    <Briefcase size={48} className="mx-auto text-sfc-orange mb-4" />
                    <h3 className="text-2xl font-bold mb-2">{language === 'zh' ? "职位申请" : "Job Application"}</h3>
                    <p className="text-gray-400">{jobTitle}</p>
                    <p className="text-sm text-gray-500 mt-4">(Simulation: Application form would go here)</p>
                </div>
            </div>
        </div>
    );
}

// --- MAIN COMPONENT ---

const GenericPage: React.FC<GenericPageProps> = ({ title, language, type }) => {
    const [activeItem, setActiveItem] = useState<DetailContent | null>(null);
    const [isJobModalOpen, setIsJobModalOpen] = useState(false);
    const [applicationJobTitle, setApplicationJobTitle] = useState('');

    const openDetail = (item: DetailContent) => {
        setActiveItem(item);
        document.body.style.overflow = 'hidden'; 
    };

    const closeDetail = () => {
        setActiveItem(null);
        document.body.style.overflow = 'auto';
    };

    const openApplication = (jobTitle: string = '') => {
        setApplicationJobTitle(jobTitle);
        setIsJobModalOpen(true);
    };
    
    // Background Image Style
    const backgroundStyle = PAGE_BACKGROUND_IMAGE ? {
        backgroundImage: `url(${PAGE_BACKGROUND_IMAGE})`,
        backgroundSize: 'cover',
        backgroundPosition: 'center',
    } : {};

    const renderContent = () => {
        switch (type) {
          case 'ecommerce':
            return (
              <div className="w-full max-w-7xl">
                 <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                    <FeatureCard 
                        icon={<PenTool size={32} className="text-white" />}
                        title={language === 'zh' ? "智能文案本地化" : "Smart Copywriting Localization"} 
                        desc={language === 'zh' ? "一键生成地道马来语商品描述，自动避开本地反感的“夸大宣传”词汇，让 listing 更受欢迎。" : "Generate authentic Malay product descriptions, avoiding exaggerated claims that locals dislike, making listings more popular."}
                        onClick={() => openDetail({
                            type: 'tool',
                            title: language === 'zh' ? "智能文案本地化" : "Smart Copywriting Localization",
                            subtitle: "AI-Powered Malay Localization",
                            tags: ['Bahasa Melayu', 'Copywriting', 'Compliance'],
                            content: <CopywritingAnalyzer language={language} />
                        })}
                    />
                    <FeatureCard 
                        icon={<Coins size={32} className="text-white" />}
                        title={language === 'zh' ? "利润试算器" : "Profit Simulator"} 
                        desc={language === 'zh' ? "进货前，自动估算关税、认证费、佣金等所有合规成本，快速判断产品是否真的有钱赚。" : "Estimate duties, certification fees, and commissions before stocking to quickly judge profitability."}
                        onClick={() => openDetail({
                            type: 'tool',
                            title: language === 'zh' ? "跨境利润试算器" : "Cross-border Profit Simulator",
                            tags: ['Profit', 'Cost Analysis', 'Finance'],
                            content: <ProfitSimulatorContent language={language} />
                        })}
                    />
                    <FeatureCard 
                        icon={<FileCheck size={32} className="text-white" />}
                        title={language === 'zh' ? "供应商证书查验" : "Supplier Cert Verification"} 
                        desc={language === 'zh' ? "一键核查厂家提供的国际证书（如 FDA、CE）在马来西亚是否有效，避免采购后才发现证书不认。" : "One-click verification of supplier certificates (FDA, CE) validity in Malaysia to avoid compliance pitfalls."}
                        onClick={() => openDetail({
                            type: 'tool',
                            title: language === 'zh' ? "证书有效性查验" : "Certificate Validity Verification",
                            subtitle: "FDA / CE / SIRIM / JAKIM",
                            tags: ['Compliance', 'Verification', 'Risk Control'],
                            content: (
                                <div className="space-y-6 text-white">
                                    <div className="flex items-center gap-4 bg-white/5 p-4 rounded border border-white/10">
                                        <Search size={24} className="text-gray-400" />
                                        <input 
                                            type="text" 
                                            placeholder={language === 'zh' ? "输入证书编号或供应商名称..." : "Enter Cert ID or Supplier Name..."} 
                                            className="bg-transparent border-none focus:outline-none text-white w-full"
                                        />
                                        <button className="bg-sfc-blue px-4 py-2 rounded text-white font-bold text-sm hover:bg-blue-600 transition-colors">
                                            {language === 'zh' ? "查验" : "Verify"}
                                        </button>
                                    </div>
                                    <p className="text-gray-300">
                                        {language === 'zh'
                                            ? "我们的数据库实时连接 FDA, SIRIM QAS 及 JAKIM 官方注册库。只需输入编号，系统自动验证证书的有效期、适用范围及是否在马来西亚海关白名单内。"
                                            : "Our database connects in real-time with FDA, SIRIM QAS, and JAKIM registries. Simply enter the ID, and the system verifies validity, scope, and Malaysia Customs whitelist status."}
                                    </p>
                                </div>
                            )
                        })}
                    />
                    <FeatureCard 
                        icon={<Calculator size={32} className="text-white" />}
                        title={language === 'zh' ? "LVG 税费智能计算" : "LVG Tax Calculator"} 
                        desc={language === 'zh' ? "针对马来西亚低价值商品（LVG）新规，自动计算销售税，确保合规。" : "Automated calculation of Malaysia's Low Value Goods (LVG) tax for compliance."}
                        onClick={() => openDetail({
                            type: 'tool',
                            title: language === 'zh' ? "LVG 税费智能计算器" : "LVG Tax Smart Calculator",
                            subtitle: language === 'zh' ? "符合马来西亚皇家关税局 (JKDM) 2024 新规" : "Compliant with JKDM 2024 Regulations",
                            tags: ['Tax Tech', 'Compliance', 'Malaysia'],
                            content: <CalculatorModalContent language={language} />
                        })}
                    />
                    <FeatureCard 
                        icon={<CheckCircle size={32} className="text-white" />}
                        title={language === 'zh' ? "清真认证直通车" : "Halal Certification Hub"} 
                        desc={language === 'zh' ? "链接 JAKIM 认证机构，为食品与化妆品出口提供一站式清真合规咨询。" : "One-stop Halal compliance consulting connecting with JAKIM certification bodies."}
                        onClick={() => openDetail({
                            type: 'text',
                            title: language === 'zh' ? "马来西亚 JAKIM 清真认证服务" : "Malaysia JAKIM Halal Certification Service",
                            tags: ['Halal', 'Food & Bev', 'Cosmetics'],
                            content: (
                                <div className="space-y-6 text-white">
                                    <p className="text-gray-300 leading-relaxed">
                                        {language === 'zh'
                                            ? "马来西亚拥有全球最严格的清真认证标准（MS 1500:2019）。对于希望进入马来西亚穆斯林市场的中国食品、药品及化妆品企业，获得 JAKIM（马来西亚伊斯兰教发展局）认证是至关重要的通行证。"
                                            : "Malaysia has the world's strictest Halal certification standards (MS 1500:2019). For Chinese food, pharmaceutical, and cosmetic companies wishing to enter the Malaysian Muslim market, obtaining JAKIM (Department of Islamic Development Malaysia) certification is a crucial pass."}
                                    </p>
                                </div>
                            )
                        })} 
                    />
                    <FeatureCard 
                        icon={<TrendingUp size={32} className="text-white" />}
                        title={language === 'zh' ? "东南亚选品雷达" : "SEA Market Radar"} 
                        desc={language === 'zh' ? "基于 Shopee/Lazada 大数据，分析中马贸易爆款趋势与价格区间。" : "Big data analysis of trending products and pricing on Shopee/Lazada."}
                        onClick={() => openDetail({
                            type: 'tool',
                            title: language === 'zh' ? "东南亚电商选品大数据" : "SEA E-commerce Big Data Selection",
                            subtitle: "Powered by xLab AI Analysis",
                            tags: ['Big Data', 'Shopee', 'Lazada', 'TikTok Shop'],
                            content: (
                                <div className="space-y-6 text-white">
                                    <div className="aspect-video bg-gradient-to-br from-indigo-900 to-slate-900 rounded-lg border border-white/10 flex items-center justify-center relative overflow-hidden group">
                                        <div className="relative z-10 text-center">
                                            <TrendingUp size={48} className="mx-auto text-sfc-orange mb-4" />
                                            <p className="text-white font-mono">{language === 'zh' ? "实时数据看板预览" : "Real-time Dashboard Preview"}</p>
                                        </div>
                                    </div>
                                    <p className="text-gray-300">
                                        {language === 'zh'
                                            ? "选品雷达覆盖 Shopee MY, Lazada MY 及 TikTok Shop 马来西亚站点的实时交易数据。系统通过 NLP 分析评论情感，预测未来 30 天的爆款趋势。"
                                            : "Market Radar covers real-time transaction data from Shopee MY, Lazada MY, and TikTok Shop Malaysia. The system uses NLP to analyze review sentiment and predict trending products for the next 30 days."}
                                    </p>
                                </div>
                            )
                        })} 
                    />
                    <FeatureCard 
                        icon={<Shield size={32} className="text-white" />}
                        title={language === 'zh' ? "知识产权保护" : "IP Protection"} 
                        desc={language === 'zh' ? "中马双边商标注册与侵权监测，保护品牌出海安全。" : "Bilateral trademark registration and infringement monitoring."}
                        onClick={() => openDetail({
                            type: 'text',
                            title: language === 'zh' ? "中马双边知识产权盾牌" : "China-Malaysia Bilateral IP Shield",
                            tags: ['MyIPO', 'Trademark', 'Legal'],
                            content: (
                                <div className="space-y-4 text-gray-300">
                                    <p>
                                        {language === 'zh'
                                            ? "我们与马来西亚知识产权局 (MyIPO) 注册代理人合作，提供从商标检索、注册到维权的全流程服务。"
                                            : "We partner with registered agents of the Intellectual Property Corporation of Malaysia (MyIPO) to provide full-process services from trademark search and registration to enforcement."}
                                    </p>
                                </div>
                            )
                        })} 
                    />
                 </div>
              </div>
            );
          case 'news':
            return (
                <div className="w-full max-w-4xl space-y-4">
                    <NewsItem 
                        date="2024.05.20" 
                        category={language === 'zh' ? "企业动态" : "Corporate News"} 
                        title={language === 'zh' ? "鹭起南洋发布 2024 Q1 财报：AI 驱动跨境物流效率提升 40%" : "SFC Releases 2024 Q1 Report: AI Drives 40% Efficiency Gain in Cross-border Logistics"} 
                        desc={language === 'zh' ? "本季度研发投入同比增长 25%，主要用于扩建吉隆坡 AI 算力中心及升级 SmartSort 智能分拣系统。" : "R&D investment increased by 25% YoY, focusing on expanding the Kuala Lumpur AI Computing Center and upgrading the SmartSort system."}
                        onClick={() => openDetail({
                            type: 'article',
                            title: language === 'zh' ? "2024 Q1 财报解读" : "2024 Q1 Financial Report Analysis",
                            date: "2024.05.20",
                            tags: ['Financial', 'AI Investment'],
                            content: <div className="text-gray-300"><p>{language === 'zh' ? "详细财报内容..." : "Detailed report content..."}</p></div>
                        })}
                    />
                    <NewsItem 
                        date="2024.04.15" 
                        category={language === 'zh' ? "行业洞察" : "Industry Insights"} 
                        title={language === 'zh' ? "RCEP 生效两周年：中马跨境贸易的新机遇与挑战" : "2nd Anniversary of RCEP: New Opportunities and Challenges in China-Malaysia Trade"} 
                        desc={language === 'zh' ? "深度解析关税减让政策对 3C 数码、美妆护肤品类的出口利好。" : "In-depth analysis of tariff reduction benefits for 3C digital and beauty product exports."}
                        onClick={() => openDetail({
                            type: 'article',
                            title: "RCEP Analysis",
                            content: <div className="text-gray-300"><p>Content...</p></div>
                        })}
                    />
                </div>
            );
          case 'governance':
            return (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 w-full max-w-7xl">
                    <GovernanceCard 
                        icon={<Scale size={32} />}
                        title={language === 'zh' ? "董事会架构" : "Board Structure"}
                        content={language === 'zh' ? "查看董事会成员名单、独立董事占比及各专门委员会职能说明。" : "View board members, independent director ratio, and committee functions."}
                    />
                    <GovernanceCard 
                        icon={<FileText size={32} />}
                        title={language === 'zh' ? "公司章程" : "Articles of Association"}
                        content={language === 'zh' ? "下载最新修订的公司章程及股东大会议事规则。" : "Download the latest Articles of Association and Rules of Procedure for Shareholders' Meetings."}
                    />
                    <GovernanceCard 
                        icon={<Shield size={32} />}
                        title={language === 'zh' ? "合规与道德" : "Compliance & Ethics"}
                        content={language === 'zh' ? "反腐败政策、举报渠道及商业行为准则。" : "Anti-corruption policies, whistleblowing channels, and Code of Business Conduct."}
                    />
                </div>
            );
          case 'about':
            return (
                <div className="max-w-4xl text-gray-300 space-y-8">
                    <div className="bg-white/5 p-8 rounded-xl border border-white/10">
                        <h3 className="text-2xl font-bold text-white mb-4">{language === 'zh' ? "关于鹭起南洋" : "About SFC"}</h3>
                        <p className="leading-relaxed mb-4">
                            {language === 'zh' 
                                ? "鹭起南洋 (SFC) 是中国领先的跨境电商综合服务商，深耕马来西亚及东南亚市场二十余年。我们致力于通过 AI 技术重塑跨境物流、供应链金融及人才生态。"
                                : "SFC is a leading cross-border e-commerce service provider in China, deeply rooted in the Malaysian and Southeast Asian markets for over 20 years. We are committed to reshaping cross-border logistics, supply chain finance, and talent ecosystems through AI technology."}
                        </p>
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 pt-4 border-t border-white/10">
                            <LiveStatsCard icon={<Globe size={24} />} label="Countries" initialValue={12} incrementRange={0} />
                            <LiveStatsCard icon={<Users size={24} />} label="Employees" initialValue={1200} incrementRange={1} />
                            <LiveStatsCard icon={<Server size={24} />} label="Warehouses" initialValue={5} incrementRange={0} />
                            <LiveStatsCard icon={<Activity size={24} />} label="Parcels/Day" initialValue={50000} incrementRange={5} suffix="+" />
                        </div>
                    </div>
                </div>
            );
          case 'join':
            return (
                <div className="max-w-4xl w-full">
                    <div className="bg-gradient-to-r from-sfc-blue/20 to-purple-900/20 p-8 rounded-xl border border-white/10 mb-8 flex justify-between items-center">
                        <div>
                            <h3 className="text-2xl font-bold text-white mb-2">{language === 'zh' ? "寻找不凡的你" : "We are hiring!"}</h3>
                            <p className="text-gray-400">{language === 'zh' ? "与 AI 一起，重新定义跨境电商的未来。" : "Redefine the future of cross-border e-commerce with AI."}</p>
                        </div>
                        <button 
                            onClick={() => openApplication()}
                            className="bg-white text-black px-6 py-3 rounded-full font-bold hover:bg-gray-200 transition-colors"
                        >
                            {language === 'zh' ? "自荐投递" : "General Application"}
                        </button>
                    </div>
                    <div className="space-y-3">
                        <JobItem title={language === 'zh' ? "高级 AI 算法工程师 (NLP/CV)" : "Senior AI Algorithm Engineer (NLP/CV)"} onClick={() => openApplication('Senior AI Engineer')} />
                        <JobItem title={language === 'zh' ? "跨境物流运营总监" : "Director of Logistics Operations"} onClick={() => openApplication('Logistics Director')} />
                        <JobItem title={language === 'zh' ? "东南亚市场品牌经理" : "SEA Brand Manager"} onClick={() => openApplication('Brand Manager')} />
                        <JobItem title={language === 'zh' ? "前端开发工程师 (React/Three.js)" : "Frontend Engineer (React/Three.js)"} onClick={() => openApplication('Frontend Engineer')} />
                    </div>
                </div>
            );
          default:
            return null;
        }
    };

    return (
        <div className="min-h-screen w-full bg-sfc-dark text-white pt-24 overflow-hidden relative font-sans">
            {/* Background Layer with Overlay */}
            {PAGE_BACKGROUND_IMAGE && (
                <div className="absolute inset-0 z-0">
                    <div className="absolute inset-0 z-0 opacity-40" style={backgroundStyle}></div>
                    <div className="absolute inset-0 bg-gradient-to-b from-black/80 via-black/50 to-black z-10"></div>
                </div>
            )}

            <div className="relative z-20 max-w-[1600px] mx-auto px-6 md:px-12 py-12">
                {/* Header */}
                <div className="mb-12 animate-[slideUp_0.5s_ease-out]">
                    <div className="flex items-center gap-4 mb-4 opacity-70">
                        <FullLogo scale={0.5} className="origin-left" />
                    </div>
                    <h1 className="text-5xl md:text-7xl font-bold tracking-tight mb-6">{title}</h1>
                    <div className="w-32 h-1 bg-sfc-orange rounded-full"></div>
                </div>

                {/* Content Area */}
                <div className="animate-[fadeIn_0.8s_ease-out_0.2s_forwards] opacity-0">
                    {renderContent()}
                </div>
            </div>

            {/* Modal for Details */}
            {activeItem && (
                <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
                    <div className="absolute inset-0 bg-black/80 backdrop-blur-md" onClick={closeDetail}></div>
                    <div className="relative w-full max-w-4xl bg-zinc-900 border border-zinc-700 rounded-2xl shadow-2xl flex flex-col max-h-[90vh] animate-[fadeIn_0.3s_ease-out]">
                        {/* Modal Header */}
                        <div className="p-6 border-b border-white/10 flex justify-between items-start bg-gradient-to-r from-zinc-800 to-zinc-900 rounded-t-2xl">
                            <div>
                                <div className="flex items-center gap-3 mb-2">
                                    <span className={`px-2 py-1 rounded text-xs font-bold uppercase tracking-wider ${
                                        activeItem.type === 'tool' ? 'bg-purple-500/20 text-purple-400' : 'bg-blue-500/20 text-blue-400'
                                    }`}>
                                        {activeItem.type === 'tool' ? (language === 'zh' ? "AI 工具" : "AI TOOL") : (language === 'zh' ? "资讯 / 服务" : "INFO / SERVICE")}
                                    </span>
                                    {activeItem.tags?.map(tag => (
                                        <span key={tag} className="text-xs text-gray-500 border border-gray-700 px-2 py-0.5 rounded">
                                            {tag}
                                        </span>
                                    ))}
                                </div>
                                <h3 className="text-2xl font-bold text-white">{activeItem.title}</h3>
                                {activeItem.subtitle && <p className="text-sfc-orange text-sm mt-1">{activeItem.subtitle}</p>}
                            </div>
                            <button onClick={closeDetail} className="text-gray-400 hover:text-white p-2 hover:bg-white/10 rounded-full transition-colors">
                                <X size={24} />
                            </button>
                        </div>
                        
                        {/* Modal Content */}
                        <div className="p-6 overflow-y-auto custom-scrollbar">
                            {activeItem.content}
                        </div>
                    </div>
                </div>
            )}

            {/* Job Application Modal */}
            <JobApplicationModal 
                isOpen={isJobModalOpen} 
                onClose={() => setIsJobModalOpen(false)} 
                language={language}
                jobTitle={applicationJobTitle}
            />
            
            <style>{`
                @keyframes slideUp {
                    from { opacity: 0; transform: translateY(20px); }
                    to { opacity: 1; transform: translateY(0); }
                }
                @keyframes fadeIn {
                    from { opacity: 0; }
                    to { opacity: 1; }
                }
            `}</style>
        </div>
    );
};

export default GenericPage;