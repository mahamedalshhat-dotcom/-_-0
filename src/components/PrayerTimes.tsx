import { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { Clock, MapPin, Bell, RefreshCw } from 'lucide-react';
import { getPrayerTimes, formatTime } from '../lib/adhan';
import { db } from '../lib/db';
import { cn } from '../lib/utils';
import DailyWisdom from './DailyWisdom';

export default function PrayerTimesComponent() {
  const [times, setTimes] = useState<any>(null);
  const [locationName, setLocationName] = useState<string>("جاري تحديد الموقع...");
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [countdown, setCountdown] = useState<string>('');

  useEffect(() => {
    loadLocationAndTimes();
  }, []);

  useEffect(() => {
    if (!times || !times.next) return;
    
    const interval = setInterval(() => {
      const now = new Date();
      const nextTime = times.nextTime;
      
      if (!nextTime || typeof nextTime.getTime !== 'function' || isNaN(nextTime.getTime())) {
        setCountdown('--:--:--');
        return;
      }

      const diff = nextTime.getTime() - now.getTime();
      
      if (diff <= 0) {
        loadLocationAndTimes();
        return;
      }
      
      const hours = Math.floor(diff / (1000 * 60 * 60));
      const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
      const seconds = Math.floor((diff % (1000 * 60)) / 1000);
      
      setCountdown(`${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`);
    }, 1000);
    
    return () => clearInterval(interval);
  }, [times]);

  async function loadLocationAndTimes() {
    setIsRefreshing(true);
    setError(null);
    const settings = await db.settings.get('user_prefs');
    
    const defaultLat = 30.0444; 
    const defaultLng = 31.2357;

    if (settings?.locationMethod === 'manual' && settings.manualLocation) {
      const { city, country } = settings.manualLocation;
      if (city && country) {
        setLocationName(`${city}، ${country}`);
        // Fallback to last known or default if coords missing
        const lat = settings.location?.latitude || defaultLat;
        const lng = settings.location?.longitude || defaultLng;
        setTimes(getPrayerTimes(lat, lng, new Date(), settings.calculationMethod, settings.asrMethod));
        setIsRefreshing(false);
        return;
      }
    }

    if ("geolocation" in navigator) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const { latitude, longitude } = position.coords;
          setLocationName("موقعك الحالي");
          setTimes(getPrayerTimes(latitude, longitude, new Date(), settings?.calculationMethod, settings?.asrMethod));
          setIsRefreshing(false);
          // Save for future offline fallback
          db.settings.put({ ...settings, id: 'user_prefs', location: { latitude, longitude } });
        },
        (err) => {
          console.warn("Geolocation error:", err);
          setError("يرجى تفعيل الموقع الجغرافي لحساب المواقيت بدقة. تم استخدام موقع افتراضي.");
          const lat = settings?.location?.latitude || defaultLat;
          const lng = settings?.location?.longitude || defaultLng;
          setLocationName(settings?.location ? "آخر موقع معروف" : "القاهرة، مصر (افتراضي)");
          setTimes(getPrayerTimes(lat, lng, new Date(), settings?.calculationMethod, settings?.asrMethod));
          setIsRefreshing(false);
        },
        { enableHighAccuracy: true, timeout: 5000, maximumAge: 3600000 }
      );
    } else {
      const lat = settings?.location?.latitude || defaultLat;
      const lng = settings?.location?.longitude || defaultLng;
      setLocationName(settings?.location ? "آخر موقع معروف" : "القاهرة، مصر (افتراضي)");
      setTimes(getPrayerTimes(lat, lng, new Date(), settings?.calculationMethod, settings?.asrMethod));
      setIsRefreshing(false);
    }
  }

  if (!times) return <div className="flex items-center justify-center h-full animate-pulse text-sacred-gold">جاري حساب المواقيت...</div>;

  const prayers = [
    { id: 'fajr', name: 'الفجر', time: times.fajr },
    { id: 'sunrise', name: 'الشروق', time: times.sunrise },
    { id: 'dhuhr', name: 'الظهر', time: times.dhuhr },
    { id: 'asr', name: 'العصر', time: times.asr },
    { id: 'maghrib', name: 'المغرب', time: times.maghrib },
    { id: 'isha', name: 'العشاء', time: times.isha },
  ];
  return (
    <div className="space-y-6">
      <DailyWisdom />
      {/* Current Prayer Card */}
      <motion.div 
        initial={{ scale: 0.95, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        className="glass-card rounded-[2.5rem] p-8 text-center relative overflow-hidden shadow-[0_20px_50px_rgba(196,166,123,0.15)] border border-sacred-gold/10"
      >
        <div className="absolute -top-10 -right-10 w-40 h-40 bg-sacred-gold/5 rounded-full blur-3xl" />
        <div className="absolute -bottom-10 -left-10 w-40 h-40 bg-sacred-green/5 rounded-full blur-3xl" />

        <div className="flex items-center justify-center gap-2 mb-8 mx-auto">
          <div className="flex items-center gap-2 text-[10px] text-sacred-gold font-bold bg-sacred-gold/5 py-2 px-4 rounded-full border border-sacred-gold/10">
            <MapPin className="w-3 h-3" />
            <span>{locationName}</span>
          </div>
          <button 
            onClick={loadLocationAndTimes}
            disabled={isRefreshing}
            className={cn(
              "p-2 rounded-full bg-sacred-gold/5 text-sacred-gold transition-all border border-sacred-gold/10 hover:bg-sacred-gold/10",
              isRefreshing && "animate-spin"
            )}
          >
            <RefreshCw className="w-3 h-3" />
          </button>
        </div>
        
        <div className="space-y-1">
          <p className="text-[10px] uppercase tracking-[0.4em] text-sacred-gold font-black mb-2">الصلاة القادمة</p>
          <h2 className="text-5xl font-display font-bold text-sacred-ink">
            {prayers.find(p => p.id === times.next)?.name || (times.next === 'fajr' ? 'الفجر' : '...')}
          </h2>
          <div className="flex flex-col items-center gap-2 mt-6">
            <p className="text-6xl font-display text-sacred-green font-black tracking-tighter">
              {formatTime(times.nextTime)}
            </p>
            <div className="flex items-center gap-2 bg-sacred-ink/5 px-4 py-1.5 rounded-full border border-sacred-ink/5">
              <Clock className="w-3 h-3 text-sacred-ink/40" />
              <span className="text-[11px] font-mono font-bold text-sacred-ink/60 tracking-widest">{countdown}</span>
            </div>
          </div>
        </div>
      </motion.div>

      {/* All Prayers List */}
      <div className="grid grid-cols-1 gap-3">
        {prayers.map((prayer, index) => {
          const isCurrent = times.current === prayer.id;
          const isNext = times.next === prayer.id;
          return (
            <motion.div
              key={prayer.id}
              initial={{ x: -20, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              transition={{ delay: index * 0.05 }}
              className={cn(
                "flex justify-between items-center p-5 rounded-3xl transition-all duration-500 border",
                isCurrent 
                  ? "bg-sacred-green text-white shadow-[0_10px_30px_rgba(46,125,50,0.2)] border-sacred-green scale-[1.02] z-20" 
                  : isNext
                    ? "bg-white border-sacred-gold/30 shadow-sm"
                    : "bg-white/40 text-sacred-ink border-sacred-gold/5"
              )}
            >
              <div className="flex items-center gap-4">
                <div className={cn(
                  "w-10 h-10 rounded-2xl flex items-center justify-center transition-colors duration-500",
                  isCurrent ? "bg-white/20" : "bg-sacred-gold/5"
                )}>
                  <span className={cn("text-xs font-black", isCurrent ? "text-white" : "text-sacred-gold")}>
                    {index + 1}
                  </span>
                </div>
                <div className="flex flex-col">
                  <span className="font-bold text-sm">{prayer.name}</span>
                  {isCurrent && <span className="text-[8px] uppercase tracking-widest opacity-60 font-black">الآن</span>}
                </div>
              </div>
              <div className="flex items-center gap-4">
                <span className="font-display font-black text-lg">{formatTime(prayer.time)}</span>
                <button className={cn(
                  "p-2.5 rounded-xl transition-all",
                  isCurrent ? "bg-white/20 hover:bg-white/30" : "bg-sacred-gold/5 hover:bg-sacred-gold/10 text-sacred-gold"
                )}>
                  <Bell className={cn("w-4 h-4", isCurrent && "fill-current")} />
                </button>
              </div>
            </motion.div>
          );
        })}
      </div>

      {error && (
        <p className="text-[10px] text-center text-red-500/60 italic">{error}</p>
      )}
    </div>
  );
}
