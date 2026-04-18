import { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Clock, CheckCircle2, X, BellRing, BookOpen } from 'lucide-react';
import { cn } from '../lib/utils';
import { getRandomReminder } from '../lib/reminders';

interface PrayerAlertProps {
  prayerName: string;
  type: 'now' | 'pre';
  minutesLeft?: number;
  onClose: () => void;
}

export default function PrayerAlert({ prayerName, type, minutesLeft, onClose }: PrayerAlertProps) {
  const [timeLeft, setTimeLeft] = useState(minutesLeft ? minutesLeft * 60 : 0);
  
  // Select a reminder once when the component mounts
  const reminder = useMemo(() => getRandomReminder(prayerName), [prayerName]);

  useEffect(() => {
    if (type === 'pre' && timeLeft > 0) {
      const timer = setInterval(() => setTimeLeft(prev => prev - 1), 1000);
      return () => clearInterval(timer);
    }
  }, [type, timeLeft]);

  useEffect(() => {
    // Keep screen on while alert is visible
    let wakeLock: any = null;
    const requestWakeLock = async () => {
      try {
        if ('wakeLock' in navigator) {
          // Check if permission is granted if the API exists
          if ((navigator as any).permissions) {
            const status = await (navigator as any).permissions.query({ name: 'screen-wake-lock' });
            if (status.state === 'denied') {
              console.warn('Screen Wake Lock permission denied by user or policy');
              return;
            }
          }
          wakeLock = await (navigator as any).wakeLock.request('screen');
        }
      } catch (err: any) {
        // Only log if it's not a permission policy error, to avoid console noise
        if (err.name !== 'NotAllowedError' && !err.message.includes('permissions policy')) {
          console.error('Wake Lock error:', err);
        }
      }
    };

    requestWakeLock();
    return () => {
      if (wakeLock) wakeLock.release();
    };
  }, []);

  const formatTime = (seconds: number) => {
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = seconds % 60;
    return {
      h: h.toString().padStart(2, '0'),
      m: m.toString().padStart(2, '0'),
      s: s.toString().padStart(2, '0')
    };
  };

  const handleComplete = () => {
    // Local storage logging could be added here if needed,
    // but for now we just close the UI as cloud sync is removed.
    onClose();
  };

  const time = formatTime(timeLeft);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-[9999] bg-sacred-ink/95 backdrop-blur-xl flex items-center justify-center p-6 text-white overflow-y-auto"
    >
      <div className="max-w-md w-full space-y-8 py-10">
        {/* Header Banner */}
        <motion.div 
          initial={{ y: -50 }}
          animate={{ y: 0 }}
          className={cn(
            "p-6 rounded-3xl text-center shadow-2xl relative overflow-hidden",
            type === 'now' ? "bg-sacred-green" : "bg-orange-600"
          )}
        >
          <div className="absolute top-0 right-0 p-4 opacity-10">
            <BellRing className="w-20 h-20" />
          </div>
          <h2 className="text-2xl font-display font-bold mb-1">
            {type === 'now' ? `حان الآن موعد أذان ${prayerName}` : `اقترب موعد صلاة ${prayerName}`}
          </h2>
          <p className="text-white/80 text-sm">
            {type === 'now' ? "حي على الصلاة.. حي على الفلاح" : "استعد للقاء الله عز وجل"}
          </p>
        </motion.div>

        {/* Digital Timer */}
        {type === 'pre' && (
          <div className="flex justify-center gap-4">
            {[
              { label: 'H', val: time.h },
              { label: 'M', val: time.m },
              { label: 'S', val: time.s }
            ].map((unit, i) => (
              <div key={i} className="flex flex-col items-center">
                <div className="bg-white/10 backdrop-blur-md border border-white/20 rounded-2xl w-20 h-24 flex items-center justify-center text-4xl font-mono font-bold text-sacred-gold shadow-inner">
                  {unit.val}
                </div>
                <span className="text-[10px] mt-2 opacity-40 font-bold">{unit.label}</span>
              </div>
            ))}
          </div>
        )}

        {/* Content Card */}
        <motion.div 
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ delay: 0.2 }}
          className="bg-white rounded-[2.5rem] p-8 text-sacred-ink shadow-2xl space-y-6"
        >
          <div className="text-center space-y-2">
            <div className="inline-flex items-center gap-2 text-sacred-gold">
              <BookOpen className="w-4 h-4" />
              <span className="text-xs font-bold uppercase tracking-widest">تذكرة إيمانية</span>
            </div>
            <h3 className="text-xl font-display font-bold text-red-600">هل صليت {prayerName}؟</h3>
          </div>

          <div className="space-y-6 text-right">
            <div className="bg-sacred-gold/5 p-6 rounded-3xl border-r-4 border-sacred-gold">
              <p className="text-sacred-green font-display text-lg leading-relaxed mb-4">
                "{reminder.verse}"
              </p>
              <span className="text-[10px] font-bold text-sacred-gold opacity-60">{reminder.reference}</span>
            </div>

            <div className="space-y-3">
              <p className="text-xs font-bold text-sacred-ink/40 flex items-center gap-2 justify-end">
                حديث شريف <span className="w-8 h-px bg-sacred-gold/20" />
              </p>
              <p className="text-sm font-medium leading-relaxed text-sacred-ink/80">
                "{reminder.hadith}"
              </p>
            </div>
          </div>
        </motion.div>

        {/* Actions */}
        <div className="grid grid-cols-2 gap-4">
          <button
            onClick={handleComplete}
            className="bg-sacred-green hover:bg-sacred-green/90 text-white py-5 rounded-3xl font-bold flex items-center justify-center gap-2 shadow-lg shadow-sacred-green/20 transition-all active:scale-95"
          >
            <CheckCircle2 className="w-5 h-5" />
            تمت الصلاة
          </button>
          <button
            onClick={onClose}
            className="bg-white/10 hover:bg-white/20 text-white py-5 rounded-3xl font-bold flex items-center justify-center gap-2 backdrop-blur-md transition-all active:scale-95"
          >
            <X className="w-5 h-5" />
            إغلاق
          </button>
        </div>
      </div>
    </motion.div>
  );
}
