import { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import QiblaFinder from './QiblaFinder';
import ZakatCalculator from './ZakatCalculator';
import { cn } from '../lib/utils';

export default function Tools() {
  const [mode, setMode] = useState<'qibla' | 'zakat'>('qibla');

  return (
    <div className="h-full flex flex-col space-y-6">
      <div className="flex bg-white/40 backdrop-blur-xl p-1.5 rounded-2xl border border-sacred-gold/10 self-center">
        <button
          onClick={() => setMode('qibla')}
          className={cn(
            "px-6 py-2 rounded-xl text-xs font-bold transition-all",
            mode === 'qibla' ? "bg-sacred-gold text-white shadow-md" : "text-sacred-ink/40 hover:text-sacred-ink"
          )}
        >
          القبلة
        </button>
        <button
          onClick={() => setMode('zakat')}
          className={cn(
            "px-6 py-2 rounded-xl text-xs font-bold transition-all",
            mode === 'zakat' ? "bg-sacred-gold text-white shadow-md" : "text-sacred-ink/40 hover:text-sacred-ink"
          )}
        >
          الزكاة
        </button>
      </div>

      <div className="flex-1">
        <AnimatePresence mode="wait">
          <motion.div
            key={mode}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="h-full"
          >
            {mode === 'qibla' ? <QiblaFinder /> : <ZakatCalculator />}
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  );
}
