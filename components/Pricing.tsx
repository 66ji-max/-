import React, { useState } from 'react';
import { Check } from 'lucide-react';
import { Language } from '../types';
import { translations } from '../translations';
import { useAuth } from '../contexts/AuthContext';
import { authFetch } from '../utils/apiClient';
import { PaymentModal } from './PaymentModal';

export const Pricing: React.FC<{ onNavigate: (page: any) => void; language: Language; isPage?: boolean }> = ({ onNavigate, language, isPage }) => {
    const t = translations[language].pricing;
    const tupg = translations[language].upgrade;
    const { user } = useAuth();
    
    const [loadingPlan, setLoadingPlan] = useState<string | null>(null);
    const [currentOrder, setCurrentOrder] = useState<any>(null);
    const [showPayment, setShowPayment] = useState(false);

    const handleUpgrade = async (plan: 'startup' | 'pro', amount: number) => {
        if (!user) {
            onNavigate('login');
            return;
        }
        
        setLoadingPlan(plan);
        try {
            const res = await authFetch('/api/orders?action=create', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    plan,
                    amount,
                    currency: language === 'zh' ? 'RMB' : 'RM'
                })
            });
            
            if (res.ok) {
                const data = await res.json();
                setCurrentOrder(data.order);
                setShowPayment(true);
            } else {
                alert(tupg.orderFailed);
            }
        } catch (err) {
            alert(tupg.orderFailed);
        } finally {
            setLoadingPlan(null);
        }
    };

    const getPriceNumber = (plan: 'startup' | 'pro') => {
        if (plan === 'startup') return language === 'zh' ? 39 : 25;
        if (plan === 'pro') return language === 'zh' ? 99 : 65;
        return 0;
    };

    const plans = [
      {
          id: 'free',
          name: t.free.name,
          price: t.free.price,
          period: t.free.period,
          features: t.free.features,
          btnText: t.free.button,
          action: () => onNavigate('login'),
          popular: false
      },
      {
        id: 'startup',
        name: t.startup.name,
        price: t.startup.price,
        period: t.startup.period,
        features: t.startup.features,
        btnText: t.startup.button,
        action: () => handleUpgrade('startup', getPriceNumber('startup')),
        popular: true
      },
      {
        id: 'pro',
        name: t.pro.name,
        price: t.pro.price,
        period: t.pro.period,
        features: t.pro.features,
        btnText: t.pro.button,
        action: () => handleUpgrade('pro', getPriceNumber('pro')),
        popular: false
      }
    ];

    return (
        <div className={`w-full max-w-7xl mx-auto ${isPage ? 'pt-32 pb-20' : 'py-20'} px-6`}>
            {showPayment && currentOrder && (
                <PaymentModal 
                    isOpen={showPayment} 
                    onClose={() => setShowPayment(false)} 
                    order={currentOrder} 
                    language={language}
                    onPaymentComplete={() => {
                        setShowPayment(false);
                        alert(translations[language].chat ? 'Payment submitted successfully.' : 'Payment submitted successfully.'); // Simple alert for now
                        onNavigate('dashboard');
                    }}
                />
            )}
            <div className="text-center mb-16">
                <h2 className="text-4xl font-bold tracking-tight text-white mb-4">{t.title}</h2>
                <p className="text-lg text-gray-400 max-w-2xl mx-auto">{t.subtitle}</p>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                {plans.map((plan, idx) => (
                    <div 
                        key={idx} 
                        className={`relative rounded-3xl p-8 border ${plan.popular ? 'border-sfc-orange bg-zinc-900 shadow-2xl' : 'border-zinc-800 bg-black/40'} flex flex-col`}
                    >
                        {plan.popular && (
                            <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-sfc-orange text-white px-3 py-1 rounded-full text-xs font-bold tracking-wide">
                                MOST POPULAR
                            </div>
                        )}
                        <h3 className="text-xl font-medium text-white mb-2">{plan.name}</h3>
                        <div className="flex items-baseline gap-1 mb-8">
                            <span className="text-4xl font-bold text-white">{plan.price}</span>
                            <span className="text-sm font-medium text-gray-500">{plan.period}</span>
                        </div>
                        <ul className="flex flex-col gap-4 mb-10 flex-1">
                            {plan.features.map((feature, i) => (
                                <li key={i} className="flex items-center gap-3 text-sm text-gray-300">
                                    <div className={`p-1 rounded-full ${plan.popular ? 'bg-sfc-orange/20 text-sfc-orange' : 'bg-zinc-800 text-gray-400'}`}>
                                        <Check size={14} />
                                    </div>
                                    {feature}
                                </li>
                            ))}
                        </ul>
                        <button 
                            onClick={plan.action}
                            disabled={loadingPlan === plan.id}
                            className={`w-full py-4 rounded-xl font-bold transition-all flex items-center justify-center ${plan.popular ? 'bg-sfc-orange hover:bg-orange-600 text-white shadow-lg' : 'bg-white text-black hover:bg-gray-200'} disabled:opacity-70`}
                        >
                            {loadingPlan === plan.id ? (
                                <div className="w-5 h-5 border-2 border-current border-t-transparent rounded-full animate-spin" />
                            ) : plan.btnText}
                        </button>
                    </div>
                ))}
            </div>
        </div>
    );
};
