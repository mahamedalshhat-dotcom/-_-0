import { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import NoorAI from './NoorAI';
import RecitationCheck from './RecitationCheck';
import { cn } from '../lib/utils';

export default function AIAssistant() {
  const [mode, setMode] = useState<'chat' | 'recitation'>('chat');

  return (
    <div className="h-full flex flex-col space-y-6">
      <div className="flex bg-white/40 backdrop-blur-xl p-1.5 rounded-2xl border border-sacred-gold/10 self-center">
        <button
          onClick={() => setMode('chat')}
          className={cn(
            "px-6 py-2 rounded-xl text-xs font-bold transition-all",
            mode === 'chat' ? "bg-sacred-gold text-white shadow-md" : "text-sacred-ink/40 hover:text-sacred-ink"
          )}
        >
          نور AI
        </button>
        <button
          onClick={() => setMode('recitation')}
          className={cn(
            "px-6 py-2 rounded-xl text-xs font-bold transition-all",
            mode === 'recitation' ? "bg-sacred-gold text-white shadow-md" : "text-sacred-ink/40 hover:text-sacred-ink"
          )}
        >
          تصحيح التلاوة
        </button>
      </div>

      <div className="flex-1">
        <AnimatePresence mode="wait">
          <motion.div
            key={mode}
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 1.05 }}
            className="h-full"
          >
            {mode === 'chat' ? <NoorAI /> : <RecitationCheck />}
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  );
}
