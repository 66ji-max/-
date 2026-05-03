import React, { useState } from 'react';
import ReactDOM from 'react-dom';
import { X, Gift } from 'lucide-react';
import { Language } from '../types';
import { translations } from '../translations';
import { authFetch } from '../utils/apiClient';
import { useAuth } from '../contexts/AuthContext';

interface CouponModalProps {
  isOpen: boolean;
  onClose: () => void;
  language: Language;
  orderReferenceCode: string;
}

export const CouponModal: React.FC<CouponModalProps> = ({ isOpen, onClose, language, orderReferenceCode }) => {
  const t = translations[language].upgrade;
  const { refreshUser } = useAuth();
  const [loading, setLoading] = useState(false);

  if (!isOpen) return null;

  const handleClaim = async () => {
      setLoading(true);
      try {
          const res = await authFetch('/api/orders?action=claim-abandon-coupon', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ referenceCode: orderReferenceCode })
          });
          if (res.ok) {
              await refreshUser();
              onClose();
          }
      } catch (err) {
          console.error(err);
          onClose();
      } finally {
          setLoading(false);
      }
  };

  return ReactDOM.createPortal(
    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-[fadeIn_0.2s_ease-out]">
        <div className="bg-gradient-to-br from-zinc-900 to-black border border-sfc-orange/50 rounded-2xl w-full max-w-sm overflow-hidden shadow-2xl relative p-8 flex flex-col items-center">
            <button onClick={onClose} className="absolute top-4 right-4 text-gray-400 hover:text-white transition-colors" disabled={loading}>
              <X size={20} />
            </button>
            <div className="w-16 h-16 bg-sfc-orange/20 rounded-full flex items-center justify-center mb-6 border border-sfc-orange/50">
                <Gift className="text-sfc-orange" size={32} />
            </div>
            
            <h2 className="text-xl font-bold text-white mb-2 text-center">{t.exclusiveDiscount || 'Exclusive Discount'}</h2>
            <p className="text-sm text-gray-400 text-center mb-6">
                {t.abandonPrompt || 'It seems you had an issue paying, here is an exclusive discount for you!'}
            </p>

            <button 
                onClick={handleClaim}
                disabled={loading}
                className="w-full py-3 rounded-xl font-bold bg-sfc-orange text-white hover:bg-orange-600 transition-colors shadow-[0_0_15px_rgba(255,107,0,0.4)] disabled:opacity-50"
            >
                {loading ? '...' : (t.claimCoupon || 'Claim Coupon')}
            </button>
        </div>
    </div>,
    document.body
  );
};
