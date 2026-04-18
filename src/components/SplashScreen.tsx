import { motion } from 'motion/react';
import { BookOpen, Sparkles } from 'lucide-react';

interface SplashScreenProps {
  onFinish: () => void;
}

export default function SplashScreen({ onFinish }: SplashScreenProps) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="absolute inset-0 z-[1000] bg-sacred-ink flex flex-col items-center justify-center p-6 text-center"
    >
      {/* Background Ornaments */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-24 -left-24 w-64 h-64 bg-sacred-gold/10 rounded-full blur-3xl animate-pulse" />
        <div className="absolute -bottom-24 -right-24 w-64 h-64 bg-sacred-green/10 rounded-full blur-3xl animate-pulse delay-700" />
      </div>

      <motion.div
        initial={{ scale: 0.8, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ delay: 0.3, duration: 0.8, ease: "easeOut" }}
        className="relative z-10 space-y-8"
      >
        <div className="relative inline-block">
          <motion.div
            animate={{ 
              rotate: 360,
              scale: [1, 1.1, 1]
            }}
            transition={{ 
              rotate: { duration: 20, repeat: Infinity, ease: "linear" },
              scale: { duration: 4, repeat: Infinity, ease: "easeInOut" }
            }}
            className="w-32 h-32 border-2 border-sacred-gold/20 rounded-full flex items-center justify-center"
          >
            <BookOpen className="w-12 h-12 text-sacred-gold shadow-[0_0_20px_rgba(196,166,123,0.5)]" />
          </motion.div>
          <div className="absolute -top-2 -right-2">
            <Sparkles className="w-6 h-6 text-sacred-gold animate-bounce" />
          </div>
        </div>

        <div className="space-y-4">
          <motion.h1 
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.8 }}
            className="text-3xl font-display font-bold text-white tracking-widest leading-relaxed"
          >
            مرحباً بكم في <br />
            <span className="text-sacred-gold text-4xl mt-2 block">عالم القرآن الكريم</span>
          </motion.h1>
          
          <motion.div 
            initial={{ width: 0 }}
            animate={{ width: "100%" }}
            transition={{ delay: 1.2, duration: 1 }}
            className="h-0.5 bg-gradient-to-r from-transparent via-sacred-gold/50 to-transparent mx-auto w-48"
          />
          
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 1.5 }}
            className="text-xs text-sacred-gold/60 font-medium tracking-[0.2em] uppercase"
          >
            نورٌ يضيء دربك
          </motion.p>
        </div>
      </motion.div>

      {/* Progress Line */}
      <div className="absolute bottom-0 left-0 w-full h-1 bg-white/5">
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: "100%" }}
          transition={{ duration: 3, ease: "linear" }}
          onAnimationComplete={onFinish}
          className="h-full bg-sacred-gold"
        />
      </div>
    </motion.div>
  );
}
