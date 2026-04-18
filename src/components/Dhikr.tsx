import { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import Tasbih from './Tasbih';
import Adhkar from './Adhkar';
import { cn } from '../lib/utils';

export default function Dhikr() {
  const [mode, setMode] = useState<'adhkar' | 'tasbih'>('adhkar');

  return (
    <div className="h-full flex flex-col space-y-6">
      <div className="flex bg-white/40 backdrop-blur-xl p-1.5 rounded-2xl border border-sacred-gold/10 self-center">
        <button
          onClick={() => setMode('adhkar')}
          className={cn(
            "px-6 py-2 rounded-xl text-xs font-bold transition-all",
            mode === 'adhkar' ? "bg-sacred-gold text-white shadow-md" : "text-sacred-ink/40 hover:text-sacred-ink"
          )}
        >
          الأذكار
        </button>
        <button
          onClick={() => setMode('tasbih')}
          className={cn(
            "px-6 py-2 rounded-xl text-xs font-bold transition-all",
            mode === 'tasbih' ? "bg-sacred-gold text-white shadow-md" : "text-sacred-ink/40 hover:text-sacred-ink"
          )}
        >
          المسبحة
        </button>
      </div>

      <div className="flex-1">
        <AnimatePresence mode="wait">
          <motion.div
            key={mode}
            initial={{ opacity: 0, x: mode === 'adhkar' ? 20 : -20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: mode === 'adhkar' ? -20 : 20 }}
            className="h-full"
          >
            {mode === 'adhkar' ? <Adhkar /> : <Tasbih />}
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  );
}
