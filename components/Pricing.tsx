import React, { useState } from 'react';
import { Check } from 'lucide-react';
import { Language } from '../types';
import { translations } from '../translations';
import { useAuth } from '../contexts/AuthContext';
import { authFetch } from '../utils/apiClient';
import { PaymentModal } from './PaymentModal';
import { getPlanPrice, formatPrice } from '../utils/pricing';
import AILabModal from './AILabModal';
import { CouponModal } from './CouponModal';

export const Pricing: React.FC<{ onNavigate: (page: any) => void; language: Language; isPage?: boolean }> = ({ onNavigate, language, isPage }) => {
    const t = translations[language].pricing;
    const tupg = translations[language].upgrade;
    const { user, refreshUser } = useAuth();
    
    const [loadingPlan, setLoadingPlan] = useState<string | null>(null);
    const [currentOrder, setCurrentOrder] = useState<any>(null);
    const [showPayment, setShowPayment] = useState(false);
    const [isLabModalOpen, setIsLabModalOpen] = useState(false);
    const [showCouponModal, setShowCouponModal] = useState(false);

    const handleUpgrade = async (plan: 'startup' | 'pro') => {
        if (!user) {
            onNavigate('login');
            return;
        }
        
        setLoadingPlan(plan);
        const { original } = getPlanPrice(plan, language, user.discountCouponClaimed);
        try {
            const res = await authFetch('/api/orders?action=create', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    plan,
                    amount: original,
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

    const handlePaymentClose = () => {
        setShowPayment(false);
        if (currentOrder && !user?.discountCouponClaimed) {
             setShowCouponModal(true);
        }
    };

    const getPriceDisplay = (plan: 'startup' | 'pro', tPriceFallback: string) => {
        const { original, current, currency } = getPlanPrice(plan, language, user?.discountCouponClaimed);
        
        if (user?.discountCouponClaimed) {
             return (
                 <div className="flex flex-col gap-1 items-start">
                     <span className="text-xl line-through text-gray-500">{formatPrice(currency, original)}</span>
                     <div className="flex gap-2 items-center">
                        <span className="text-4xl font-bold text-sfc-orange">{formatPrice(currency, current)}</span>
                        <span className="bg-sfc-orange/20 text-sfc-orange text-xs px-2 py-1 rounded">{tupg.discountPrice || 'Discount'}</span>
                     </div>
                 </div>
             );
        }
        return <span className="text-4xl font-bold text-white">{formatPrice(currency, original)}</span>;
    };

    const plans = [
      {
          id: 'free',
          name: t.free.name,
          priceDisplay: <span className="text-4xl font-bold text-white">{t.free.price}</span>,
          period: t.free.period,
          features: t.free.features,
          btnText: t.free.button,
          action: () => {
              if (user) {
                  setIsLabModalOpen(true);
              } else {
                  onNavigate('login');
              }
          },
          popular: false
      },
      {
        id: 'startup',
        name: t.startup.name,
        priceDisplay: getPriceDisplay('startup', t.startup.price),
        period: t.startup.period,
        features: t.startup.features,
        btnText: t.startup.button,
        action: () => handleUpgrade('startup'),
        popular: true
      },
      {
        id: 'pro',
        name: t.pro.name,
        priceDisplay: getPriceDisplay('pro', t.pro.price),
        period: t.pro.period,
        features: t.pro.features,
        btnText: t.pro.button,
        action: () => handleUpgrade('pro'),
        popular: false
      }
    ];

    return (
        <div className={`w-full max-w-7xl mx-auto ${isPage ? 'pt-32 pb-20' : 'py-20'} px-6`} id="pricing-section">
            {showCouponModal && currentOrder && (
                <CouponModal
                    isOpen={showCouponModal}
                    onClose={() => setShowCouponModal(false)}
                    language={language}
                    orderReferenceCode={currentOrder.referenceCode}
                />
            )}
            {showPayment && currentOrder && (
                <PaymentModal 
                    isOpen={showPayment} 
                    onClose={handlePaymentClose} 
                    order={currentOrder} 
                    language={language}
                    onPaymentComplete={() => {
                        setShowPayment(false);
                        alert(translations[language].chat ? 'Payment submitted successfully.' : 'Payment submitted successfully.'); // Simple alert for now
                        refreshUser();
                        onNavigate('dashboard');
                    }}
                />
            )}
            <AILabModal 
                 isOpen={isLabModalOpen} 
                 onClose={() => setIsLabModalOpen(false)} 
                 language={language} 
                 onNavigate={onNavigate}
            />
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
                            {plan.priceDisplay}
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
