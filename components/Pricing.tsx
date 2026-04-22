import React from 'react';
import { Check } from 'lucide-react';

export const Pricing: React.FC<{ onNavigate: (page: any) => void; isPage?: boolean }> = ({ onNavigate, isPage }) => {
    const plans = [
      {
          name: '免费体验',
          price: '¥0',
          period: '/一次性',
          features: ['10次免费试用体验', '基础 OCR 识别', '每日响应时间 < 2s'],
          btnText: '免费开始',
          action: () => onNavigate('register'),
          popular: false
      },
      {
        name: '初创版 / Startup',
        price: '¥39',
        period: '/月',
        features: ['适合小微卖家流水测试', '支持基础 OCR 和图像识别', '每日无限制提问'],
        btnText: '升级初创版',
        action: () => alert('Mock: Redirect to payment page...'),
        popular: true
      },
      {
        name: '专业版 / Pro',
        price: '¥99',
        period: '/月',
        features: ['适合高频选品团队', '批量扫描与实时政策推送', '优先极速队列与 1v1 支持'],
        btnText: '升级专业版',
        action: () => alert('Mock: Redirect to payment page...'),
        popular: false
      }
    ];

    return (
        <div className={`w-full max-w-7xl mx-auto ${isPage ? 'pt-32 pb-20' : 'py-20'} px-6`}>
            <div className="text-center mb-16">
                <h2 className="text-4xl font-bold tracking-tight text-white mb-4">Pricing & Subscription</h2>
                <p className="text-lg text-gray-400 max-w-2xl mx-auto">Choose the right plan to boost your efficiency and get access to exclusive xLab AI models.</p>
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
