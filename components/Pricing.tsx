import React from 'react';
import { Check } from 'lucide-react';
import { Language } from '../types';
import { translations } from '../translations';
import { useAuth } from '../contexts/AuthContext';

export const Pricing: React.FC<{ onNavigate: (page: any) => void; language: Language; isPage?: boolean }> = ({ onNavigate, language, isPage }) => {
    const t = translations[language].pricing;
    const { user } = useAuth();

    const handleUpgrade = () => {
        if (!user) {
            onNavigate('login');
        } else {
            alert('Mock: Redirect to payment page...');
        }
    };

    const plans = [
      {
          name: t.free.name,
          price: '¥0',
          period: t.free.period,
          features: t.free.features,
          btnText: t.free.button,
          action: () => onNavigate('login'),
          popular: false
      },
      {
        name: t.startup.name,
        price: t.startup.price,
        period: t.startup.period,
        features: t.startup.features,
        btnText: t.startup.button,
        action: handleUpgrade,
        popular: true
      },
      {
        name: t.pro.name,
        price: t.pro.price,
        period: t.pro.period,
        features: t.pro.features,
        btnText: t.pro.button,
        action: handleUpgrade,
        popular: false
      }
    ];

    return (
        <div className={`w-full max-w-7xl mx-auto ${isPage ? 'pt-32 pb-20' : 'py-20'} px-6`}>
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
                            className={`w-full py-4 rounded-xl font-bold transition-all ${plan.popular ? 'bg-sfc-orange hover:bg-orange-600 text-white shadow-lg' : 'bg-white text-black hover:bg-gray-200'}`}
                        >
                            {plan.btnText}
                        </button>
                    </div>
                ))}
            </div>
        </div>
    );
};
