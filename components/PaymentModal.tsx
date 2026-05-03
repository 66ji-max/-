import React, { useState } from 'react';
import ReactDOM from 'react-dom';
import { X, Upload, Image as ImageIcon } from 'lucide-react';
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
  
  const [payerOrderNo, setPayerOrderNo] = useState('');
  const [proofImageBase64, setProofImageBase64] = useState<string>('');
  const [proofImageFilename, setProofImageFilename] = useState('');
  const [proofImageContentType, setProofImageContentType] = useState('');
  const [proofMethod, setProofMethod] = useState<'alipay' | 'tng' | null>(null);

  if (!isOpen || !order) return null;

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
        setError('Please select an image file');
        return;
    }

    if (file.size > 5 * 1024 * 1024) {
        setError('Image size must be less than 5MB');
        return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
        const result = event.target?.result as string;
        if (result) {
            setProofImageBase64(result.split(',')[1]);
            setProofImageFilename(file.name);
            setProofImageContentType(file.type);
            setError('');
        }
    };
    reader.readAsDataURL(file);
  };

  const handleMarkPaid = async () => {
    if (!payerOrderNo.trim() && !proofImageBase64) {
        setError(t.proofRequired || 'At least order number or screenshot is required');
        return;
    }

    setLoading(true);
    setError('');
    try {
      const res = await authFetch('/api/orders?action=mark-paid', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          referenceCode: order.referenceCode,
          paymentMethod: proofMethod || 'unknown',
          payerOrderNo: payerOrderNo.trim() || undefined,
          proofImageBase64: proofImageBase64 || undefined,
          proofImageFilename: proofImageFilename || undefined,
          proofImageContentType: proofImageContentType || undefined
        })
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

  const getAlipayQrUrl = () => {
     if (order.couponApplied || order.discountAmount) {
         if (order.plan === 'startup' && order.currency === 'RMB') return '/alipay-qr-rmb30.jpg';
         if (order.plan === 'pro' && order.currency === 'RMB') return '/alipay-qr-rmb90.jpg';
     } else {
         if (order.plan === 'startup' && order.currency === 'RMB') return '/alipay-qr-rmb39.jpg';
         if (order.plan === 'pro' && order.currency === 'RMB') return '/alipay-qr-rmb99.jpg';
     }
     return '/alipay-qr.jpg';
  };

  return ReactDOM.createPortal(
    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-[fadeIn_0.2s_ease-out] overflow-y-auto pt-10 pb-10">
      <div className="bg-zinc-900 border border-zinc-700/50 rounded-2xl w-full max-w-lg overflow-hidden shadow-2xl relative my-auto">
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
              <span className="font-bold text-sfc-orange text-lg">
                  {order.currency} {order.amount.toFixed(2)}
                  {order.couponApplied && <span className="ml-2 text-xs bg-sfc-orange/20 text-sfc-orange px-2 py-0.5 rounded">{t.couponApplied || 'Coupon Applied'}</span>}
              </span>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
             <div 
                 className={`bg-zinc-800/50 p-4 rounded-xl flex flex-col items-center justify-center border cursor-pointer transition-colors ${proofMethod === 'tng' ? 'border-sfc-orange ring-1 ring-sfc-orange/50' : 'border-zinc-700 hover:border-gray-500'}`}
                 onClick={() => setProofMethod('tng')}
              >
                  <div className="w-32 h-32 bg-white rounded flex items-center justify-center mb-3">
                     <img
                        src="/tng-qr.jpg"
                        alt="TNG QR"
                        className="w-28 h-28 object-contain"
                    />
                 </div>
                 <span className="text-sm text-gray-300 font-medium">{t.tngQr}</span>
             </div>
             <div 
                 className={`bg-zinc-800/50 p-4 rounded-xl flex flex-col items-center justify-center border cursor-pointer transition-colors ${proofMethod === 'alipay' ? 'border-sfc-orange ring-1 ring-sfc-orange/50' : 'border-zinc-700 hover:border-gray-500'}`}
                 onClick={() => setProofMethod('alipay')}
              >
                 <div className="w-32 h-32 bg-white rounded flex items-center justify-center mb-3">
                     {/* NOTE: You MUST upload /alipay-qr-rmb39.jpg, /alipay-qr-rmb99.jpg, /alipay-qr-rmb30.jpg, and /alipay-qr-rmb90.jpg into public/ directory */}
                    <img
                      src={getAlipayQrUrl()}
                      onError={(e) => { (e.target as HTMLImageElement).src = '/alipay-qr.jpg' }}
                      alt="Alipay QR"
                      className="w-28 h-28 object-contain"
                    />
                 </div>
                 <span className="text-sm text-gray-300 font-medium">{t.alipayQr}</span>
             </div>
          </div>

          <div className="bg-zinc-800/30 p-4 rounded-xl border border-zinc-700/50 space-y-4">
               <h3 className="text-sm font-semibold text-white">{t.paymentProof || 'Payment Proof'}</h3>
               
               <div>
                  <input
                    type="text"
                    value={payerOrderNo}
                    onChange={(e) => setPayerOrderNo(e.target.value)}
                    placeholder={t.enterOrderNo || 'Enter Alipay/TNG order number'}
                    className="w-full bg-zinc-900 border border-zinc-700 text-white px-4 py-2 rounded-lg focus:outline-none focus:border-sfc-orange transition-colors text-sm placeholder:text-zinc-600"
                  />
               </div>
               
               <div className="flex items-center gap-4">
                  <div className="flex-1">
                      <div className="relative">
                          <input 
                              type="file" 
                              id="proof-upload" 
                              accept="image/*" 
                              onChange={handleFileChange}
                              className="hidden"
                          />
                          <label 
                              htmlFor="proof-upload"
                              className="flex items-center justify-center gap-2 w-full bg-zinc-800 hover:bg-zinc-700 text-gray-300 py-2 px-4 rounded-lg cursor-pointer border border-zinc-700 transition-colors text-sm"
                          >
                              <Upload size={16} />
                              {proofImageFilename ? proofImageFilename : (t.uploadScreenshot || 'Upload Screenshot')}
                          </label>
                      </div>
                  </div>
                  {proofImageBase64 && (
                      <div className="w-10 h-10 rounded border border-zinc-700 bg-zinc-800 flex items-center justify-center overflow-hidden flex-shrink-0">
                          <img src={`data:${proofImageContentType};base64,${proofImageBase64}`} alt="Proof" className="w-full h-full object-cover" />
                      </div>
                  )}
               </div>
               
               <p className="text-xs text-gray-500">{t.proofRequired || 'At least order number or screenshot is required'}</p>
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
              className="flex-1 py-3 px-4 rounded-xl font-bold bg-sfc-orange text-white hover:bg-orange-600 transition-colors flex items-center justify-center disabled:opacity-50"
              disabled={loading || (!proofImageBase64 && !payerOrderNo.trim())}
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
    </div>,
    document.body
  );
};
