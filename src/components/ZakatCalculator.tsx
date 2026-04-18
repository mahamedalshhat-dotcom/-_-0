import { useState } from 'react';
import { motion } from 'motion/react';
import { Calculator, Info, Landmark, Coins } from 'lucide-react';
import { cn } from '../lib/utils';

export default function ZakatCalculator() {
  const [goldPrice, setGoldPrice] = useState<number>(0);
  const [wealth, setWealth] = useState<number>(0);
  const [result, setResult] = useState<number | null>(null);

  const calculateZakat = () => {
    const nisab = goldPrice * 85; // 85g of gold
    if (wealth >= nisab) {
      setResult(wealth * 0.025);
    } else {
      setResult(0);
    }
  };

  return (
    <div className="bg-white/40 backdrop-blur-xl rounded-[2.5rem] p-8 border border-sacred-gold/10 shadow-sm space-y-8">
      <div className="text-center">
        <h3 className="text-xl font-display font-bold text-sacred-ink">حاسبة الزكاة</h3>
        <p className="text-[10px] uppercase tracking-widest text-sacred-gold font-bold">Zakat Calculator</p>
      </div>

      <div className="space-y-6">
        <div className="space-y-2">
          <label className="text-[10px] font-black text-sacred-gold uppercase tracking-widest mr-2">سعر جرام الذهب (عيار 24)</label>
          <div className="relative">
            <Coins className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 text-sacred-gold/40" />
            <input 
              type="number"
              value={goldPrice || ''}
              onChange={(e) => setGoldPrice(Number(e.target.value))}
              placeholder="أدخل السعر الحالي..."
              className="w-full bg-white border border-sacred-gold/10 rounded-2xl py-4 pr-12 pl-4 text-sm focus:outline-none focus:border-sacred-gold/30 transition-all"
            />
          </div>
        </div>

        <div className="space-y-2">
          <label className="text-[10px] font-black text-sacred-gold uppercase tracking-widest mr-2">إجمالي المدخرات (المال، الذهب، التجارة)</label>
          <div className="relative">
            <Landmark className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 text-sacred-gold/40" />
            <input 
              type="number"
              value={wealth || ''}
              onChange={(e) => setWealth(Number(e.target.value))}
              placeholder="أدخل إجمالي المبلغ..."
              className="w-full bg-white border border-sacred-gold/10 rounded-2xl py-4 pr-12 pl-4 text-sm focus:outline-none focus:border-sacred-gold/30 transition-all"
            />
          </div>
        </div>

        <button 
          onClick={calculateZakat}
          className="w-full sacred-button py-4 flex items-center justify-center gap-2"
        >
          <Calculator className="w-4 h-4" />
          احسب الزكاة
        </button>

        {result !== null && (
          <motion.div 
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className={cn(
              "p-6 rounded-3xl text-center border",
              result > 0 ? "bg-sacred-green/5 border-sacred-green/20" : "bg-sacred-gold/5 border-sacred-gold/20"
            )}
          >
            {result > 0 ? (
              <>
                <p className="text-[10px] font-black text-sacred-green uppercase tracking-widest mb-2">مقدار الزكاة الواجبة</p>
                <h4 className="text-3xl font-display font-black text-sacred-green">{result.toLocaleString()}</h4>
                <p className="text-[10px] text-sacred-ink/40 mt-2">بناءً على نسبة 2.5% من إجمالي المال</p>
              </>
            ) : (
              <>
                <p className="text-[10px] font-black text-sacred-gold uppercase tracking-widest mb-2">النتيجة</p>
                <h4 className="text-lg font-bold text-sacred-ink">لم يبلغ مالك النصاب الشرعي</h4>
                <p className="text-[10px] text-sacred-ink/40 mt-2">النصاب التقريبي: {(goldPrice * 85).toLocaleString()}</p>
              </>
            )}
          </motion.div>
        )}
      </div>

      <div className="bg-sacred-gold/5 p-4 rounded-2xl border border-sacred-gold/10 flex gap-3">
        <Info className="w-5 h-5 text-sacred-gold shrink-0" />
        <p className="text-[10px] text-sacred-ink/60 leading-relaxed">
          تجب الزكاة إذا بلغ المال النصاب (ما يعادل 85 جراماً من الذهب عيار 24) وحال عليه الحول (سنة قمرية كاملة).
        </p>
      </div>
    </div>
  );
}
