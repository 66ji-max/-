import React, { useState } from 'react';
import { X } from 'lucide-react';
import { Language } from '../types';
import { translations } from '../translations';
import { authFetch } from '../utils/apiClient';

interface PaymentModalProps {
  isOpen: boolean;
  onClose: () => void;
  order: any;
  language: Language;
  onPaymentComplete: () => void;
}

export const PaymentModal: React.FC<PaymentModalProps> = ({ isOpen, onClose, order, language, onPaymentComplete }) => {
  const t = translations[language].upgrade;
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  if (!isOpen || !order) return null;

  const handleMarkPaid = async () => {
    setLoading(true);
    setError('');
    try {
      const res = await authFetch('/api/orders?action=mark-paid', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ referenceCode: order.referenceCode })
      });
      if (res.ok) {
        onPaymentComplete();
      } else {
        const data = await res.json();
        setError(data.error || t.paymentFailed);
      }
    } catch (err) {
      setError(t.paymentFailed);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-[fadeIn_0.2s_ease-out]">
      <div className="bg-zinc-900 border border-zinc-700/50 rounded-2xl w-full max-w-lg overflow-hidden shadow-2xl relative">
        <div className="flex justify-between items-center p-6 border-b border-zinc-800">
          <h2 className="text-xl font-bold text-white">{t.upgradeTitle} - {order.plan === 'startup' ? translations[language].pricing.startup.name : translations[language].pricing.pro.name}</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-white transition-colors" disabled={loading}>
            <X size={24} />
          </button>
        </div>

        <div className="p-6 space-y-6">
          <div className="bg-black/30 p-4 rounded-xl border border-white/5 space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-gray-400">{t.orderNumber}</span>
              <span className="font-mono text-white tracking-widest">{order.referenceCode}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-gray-400">{t.totalAmount}</span>
              <span className="font-bold text-sfc-orange text-lg">{order.currency} {order.amount.toFixed(2)}</span>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
             <div className="bg-zinc-800/50 p-4 rounded-xl flex flex-col items-center justify-center border border-zinc-700">
                 <div className="w-32 h-32 bg-white rounded flex items-center justify-center mb-3">
                     {/* Replace with real TNG QR URL/base64 */}
                     <img
                        src="/tng-qr.jpg"
                        alt="TNG QR"
                        className="w-28 h-28 object-contain"
                    />
                 </div>
                 <span className="text-sm text-gray-300 font-medium">{t.tngQr}</span>
             </div>
             <div className="bg-zinc-800/50 p-4 rounded-xl flex flex-col items-center justify-center border border-zinc-700">
                 <div className="w-32 h-32 bg-white rounded flex items-center justify-center mb-3">
                     {/* Replace with real Alipay QR URL/base64 */}
                    <img
                      src="/alipay-qr.jpg"
                      alt="Alipay QR"
                      className="w-28 h-28 object-contain"
                    />
                 </div>
                 <span className="text-sm text-gray-300 font-medium">{t.alipayQr}</span>
             </div>
          </div>

          <div className="text-sm text-gray-400 text-center px-4">
             <p className="mb-1">{t.paymentNote}</p>
             <p className="text-xs">{t.reviewNote}</p>
          </div>

          {error && (
            <div className="bg-red-500/10 border border-red-500/50 text-red-500 p-3 rounded text-sm text-center">
              {error}
            </div>
          )}

          <div className="flex gap-4 pt-2">
            <button 
              onClick={onClose} 
              className="flex-1 py-3 px-4 rounded-xl font-bold bg-zinc-800 text-white hover:bg-zinc-700 transition-colors"
              disabled={loading}
            >
              {t.close}
            </button>
            <button 
              onClick={handleMarkPaid} 
              className="flex-1 py-3 px-4 rounded-xl font-bold bg-sfc-orange text-white hover:bg-orange-600 transition-colors flex items-center justify-center"
              disabled={loading}
            >
              {loading ? (
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : (
                t.confirmPay
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
