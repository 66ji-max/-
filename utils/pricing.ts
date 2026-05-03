export const PRICING = {
  RMB: {
    startup: 39,
    startup_discount: 30,
    pro: 99,
    pro_discount: 90
  },
  RM: {
    startup: 25,
    startup_discount: 20,
    pro: 65,
    pro_discount: 60
  }
};

export function getPlanPrice(plan: string, language: string, hasCoupon: boolean = false) {
  const currency = language === 'zh' ? 'RMB' : 'RM';
  const planData = PRICING[currency as keyof typeof PRICING];
  if (!planData) return { original: 0, current: 0, currency };

  const original = planData[plan as 'startup' | 'pro'] || 0;
  const current = hasCoupon ? planData[`${plan}_discount` as 'startup_discount' | 'pro_discount'] : original;
  
  return { original, current, currency };
}

export function formatPrice(currency: string, amount: number) {
  return `${currency === 'RMB' ? '￥' : 'RM'}${amount}`;
}
