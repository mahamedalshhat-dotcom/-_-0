/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Book, 
  Clock, 
  Compass, 
  Settings as SettingsIcon, 
  RefreshCw,
  Heart,
  Bot,
  User as UserIcon,
} from 'lucide-react';
import { db } from './lib/db';
import { cn } from './lib/utils';
import { fetchWithRetry } from './lib/api';
import { checkAndNotify, stopNotificationSound } from './lib/notificationManager';
import QuranReader from './components/QuranReader';
import PrayerTimes from './components/PrayerTimes';
import Dhikr from './components/Dhikr';
import AIAssistant from './components/AIAssistant';
import Tools from './components/Tools';
import AudioPlayer from './components/AudioPlayer';

import Settings from './components/Settings';
import Developer from './components/Developer';
import PrayerAlert from './components/PrayerAlert';
import SplashScreen from './components/SplashScreen';

type Tab = 'quran' | 'prayer' | 'dhikr' | 'ai' | 'tools' | 'settings' | 'developer';

export default function App() {
  const [showSplash, setShowSplash] = useState(true);
  const [activeTab, setActiveTab] = useState<Tab>(() => {
    return (localStorage.getItem('noor_active_tab') as Tab) || 'prayer';
  });

  const [prayerAlert, setPrayerAlert] = useState<{
    prayerName: string;
    type: 'now' | 'pre';
    minutesLeft?: number;
  } | null>(null);

  const [isNavVisible, setIsNavVisible] = useState(true);
  const [lastScrollY, setLastScrollY] = useState(0);

  useEffect(() => {
    const handlePrayerAlert = (e: any) => {
      setPrayerAlert(e.detail);
    };

    const handleToggleNav = (e: any) => {
      setIsNavVisible(e.detail.visible);
    };

    window.addEventListener('prayer-alert', handlePrayerAlert);
    window.addEventListener('toggle-nav', handleToggleNav);
    return () => {
      window.removeEventListener('prayer-alert', handlePrayerAlert);
      window.removeEventListener('toggle-nav', handleToggleNav);
    };
  }, []);

  const handleScroll = (e: React.UIEvent<HTMLElement>) => {
    const currentScrollY = e.currentTarget.scrollTop;
    
    // Only toggle if we've scrolled a bit to avoid jitter
    if (Math.abs(currentScrollY - lastScrollY) > 10) {
      if (currentScrollY > lastScrollY && currentScrollY > 50) {
        // Scrolling down - hide
        setIsNavVisible(false);
      } else {
        // Scrolling up - show
        setIsNavVisible(true);
      }
      setLastScrollY(currentScrollY);
    }
  };

  useEffect(() => {
    localStorage.setItem('noor_active_tab', activeTab);
  }, [activeTab]);

  useEffect(() => {
    applySavedTheme();
  }, []);

  async function applySavedTheme() {
    const settings = await db.settings.get('user_prefs');
    if (settings?.theme) {
      document.documentElement.classList.remove('dark', 'sepia');
      if (settings.theme !== 'light') {
        document.documentElement.classList.add(settings.theme);
      }
    }
  }

  const [isSyncing, setIsSyncing] = useState(false);
  const [syncProgress, setSyncProgress] = useState(0);
  const [syncStatus, setSyncStatus] = useState('');
  const [hasData, setHasData] = useState(false);

  useEffect(() => {
    checkData();
    
    // Start notification checker
    const interval = setInterval(checkAndNotify, 60000);
    checkAndNotify(); // Initial check
    
    return () => clearInterval(interval);
  }, []);

  async function checkData() {
    const count = await db.surahs.count();
    setHasData(count > 0);
  }

  async function syncQuranData() {
    setIsSyncing(true);
    setSyncProgress(0);
    setSyncStatus('بدء التحميل...');
    
    try {
      // 1. Fetch Surahs
      setSyncStatus('تحميل قائمة السور...');
      const surahRes = await fetchWithRetry('https://api.alquran.cloud/v1/surah');
      const surahData = await surahRes.json();
      const mappedSurahs = surahData.data.map((s: any) => ({
        ...s,
        id: s.number
      }));
      await db.surahs.bulkPut(mappedSurahs);
      setSyncProgress(15);

      // 2. Fetch Ayahs
      setSyncStatus('تحميل آيات القرآن الكريم...');
      const ayahsRes = await fetchWithRetry('https://api.alquran.cloud/v1/quran/quran-simple');
      const ayahsData = await ayahsRes.json();
      setSyncProgress(60);
      
      setSyncStatus('معالجة البيانات وحفظها...');
      const totalSurahs = ayahsData.data.surahs.length;
      
      // Process in chunks of surahs to keep UI responsive and show progress
      for (let i = 0; i < totalSurahs; i++) {
        const s = ayahsData.data.surahs[i];
        const surahAyahs = s.ayahs.map((a: any) => ({
          id: a.number,
          surahId: s.number,
          numberInSurah: a.numberInSurah,
          text: a.text
        }));
        
        await db.ayahs.bulkPut(surahAyahs);
        
        // Progress from 60% to 95%
        const progress = 60 + Math.floor((i / totalSurahs) * 35);
        setSyncProgress(progress);
        if (i % 10 === 0) setSyncStatus(`جاري حفظ سورة ${s.name}...`);
      }
      
      setSyncProgress(100);
      setSyncStatus('تم التحميل بنجاح');
      setHasData(true);
      
      // Clear status after a delay
      setTimeout(() => setSyncStatus(''), 3000);
    } catch (error) {
      console.error("Sync Error:", error);
      setSyncStatus('فشل التحميل');
      alert("حدث خطأ أثناء تحميل البيانات. يرجى التحقق من اتصال الإنترنت والمحاولة مرة أخرى.");
    } finally {
      setIsSyncing(false);
    }
  }

  const tabs = [
    { id: 'prayer', icon: Clock, label: 'المواقيت' },
    { id: 'quran', icon: Book, label: 'المصحف' },
    { id: 'dhikr', icon: Heart, label: 'الأذكار' },
    { id: 'ai', icon: Bot, label: 'نور AI' },
    { id: 'tools', icon: Compass, label: 'الأدوات' },
    { id: 'settings', icon: SettingsIcon, label: 'الإعدادات' },
    { id: 'developer', icon: UserIcon, label: 'المطور' },
  ];

  const [direction, setDirection] = useState(0);

  const handleTabChange = (newTab: Tab) => {
    const currentIndex = tabs.findIndex(t => t.id === activeTab);
    const newIndex = tabs.findIndex(t => t.id === newTab);
    setDirection(newIndex > currentIndex ? 1 : -1);
    setActiveTab(newTab);
  };

  const variants = {
    enter: (direction: number) => ({
      x: direction > 0 ? 20 : -20,
      opacity: 0,
      filter: 'blur(10px)',
    }),
    center: {
      zIndex: 1,
      x: 0,
      opacity: 1,
      filter: 'blur(0px)',
    },
    exit: (direction: number) => ({
      zIndex: 0,
      x: direction < 0 ? 20 : -20,
      opacity: 0,
      filter: 'blur(10px)',
    })
  };

  return (
    <div className="min-h-screen flex flex-col w-full max-w-screen-xl mx-auto bg-sacred-bg shadow-2xl relative overflow-hidden lg:ring-1 lg:ring-sacred-gold/5 lg:my-6 lg:rounded-[3rem] lg:h-[calc(100vh-3rem)]">
      <AnimatePresence>
        {showSplash && (
          <SplashScreen onFinish={() => setShowSplash(false)} />
        )}
      </AnimatePresence>

      {/* Background Decoration */}
      <div className="absolute top-0 left-0 w-full h-64 bg-gradient-to-b from-sacred-gold/10 to-transparent pointer-events-none" />
      
      {/* Header */}
      <header className="p-6 flex justify-between items-center z-10 bg-white/40 backdrop-blur-md border-b border-sacred-gold/5">
        <div className="flex flex-col">
          <h1 className="font-display text-2xl font-bold text-sacred-ink tracking-tight">نور الحق</h1>
          <div className="flex items-center gap-2">
            <span className="w-8 h-[1px] bg-sacred-gold/30" />
            <p className="text-[9px] uppercase tracking-[0.3em] text-sacred-gold font-bold">Noor Al-Haq</p>
          </div>
        </div>
        {!hasData && !isSyncing && (
          <button 
            onClick={syncQuranData}
            className="sacred-button flex items-center gap-2 text-[10px] py-1.5"
          >
            <RefreshCw className="w-3 h-3" />
            تحميل البيانات
          </button>
        )}
        {isSyncing && (
          <div className="flex flex-col items-end gap-1">
            <div className="text-[10px] text-sacred-gold font-bold animate-pulse">
              {syncStatus} {syncProgress}%
            </div>
            <div className="w-24 h-1 bg-sacred-gold/10 rounded-full overflow-hidden">
              <motion.div 
                className="h-full bg-sacred-gold shadow-[0_0_8px_rgba(196,166,123,0.5)]"
                initial={{ width: 0 }}
                animate={{ width: `${syncProgress}%` }}
              />
            </div>
          </div>
        )}
      </header>

      {/* Main Content */}
      <main 
        onScroll={handleScroll}
        className="flex-1 overflow-y-auto px-6 pb-28 pt-4 z-10 scrollbar-hide"
      >
        <AnimatePresence mode="wait" custom={direction}>
          <motion.div
            key={activeTab}
            custom={direction}
            variants={variants}
            initial="enter"
            animate="center"
            exit="exit"
            transition={{
              x: { type: "spring", stiffness: 300, damping: 30 },
              opacity: { duration: 0.2 },
              filter: { duration: 0.2 }
            }}
            className="h-full"
          >
            {activeTab === 'prayer' && <PrayerTimes />}
            {activeTab === 'quran' && <QuranReader hasData={hasData} onSync={syncQuranData} />}
            {activeTab === 'dhikr' && <Dhikr />}
            {activeTab === 'ai' && <AIAssistant />}
            {activeTab === 'tools' && <Tools />}
            {activeTab === 'settings' && <Settings />}
            {activeTab === 'developer' && <Developer />}
          </motion.div>
        </AnimatePresence>
      </main>

      <AudioPlayer />

      <AnimatePresence>
        {prayerAlert && (
          <PrayerAlert 
            {...prayerAlert} 
            onClose={() => {
              setPrayerAlert(null);
              stopNotificationSound();
            }} 
          />
        )}
      </AnimatePresence>

      {/* Navigation */}
      <AnimatePresence>
        {isNavVisible && (
          <motion.nav 
            initial={{ y: 100, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 100, opacity: 0 }}
            transition={{ type: "spring", damping: 30, stiffness: 200 }}
            className="fixed bottom-6 left-4 right-4 max-w-[calc(100%-2rem)] md:max-w-2xl lg:max-w-4xl mx-auto z-[100]"
          >
            <div className="relative bg-white/90 backdrop-blur-3xl border border-white/40 px-2 py-2 flex justify-around items-center rounded-[2.5rem] shadow-[0_25px_50px_-12px_rgba(0,0,0,0.25)] ring-1 ring-sacred-gold/10">
              {/* Subtle inner glow */}
              <div className="absolute inset-0 rounded-[2.5rem] bg-gradient-to-b from-white/40 to-transparent pointer-events-none" />
              
              {tabs.map((tab) => {
                const isActive = activeTab === tab.id;
                return (
                  <button
                    key={tab.id}
                    onClick={() => handleTabChange(tab.id as Tab)}
                    className={cn(
                      "relative flex flex-col items-center justify-center transition-all duration-500 rounded-2xl group flex-1 h-12 min-w-0",
                      isActive ? "text-sacred-green" : "text-sacred-ink/30 hover:text-sacred-ink/50"
                    )}
                  >
                    {isActive && (
                      <motion.div 
                        layoutId="navPill"
                        className="absolute inset-0 bg-gradient-to-br from-sacred-green/10 to-sacred-gold/5 rounded-2xl -z-10"
                        transition={{ type: "spring", bounce: 0.2, duration: 0.6 }}
                      />
                    )}
                    
                    <div className="relative flex flex-col items-center">
                      <tab.icon className={cn(
                        "w-4 h-4 md:w-5 md:h-5 transition-all duration-500", 
                        isActive ? "scale-110 -translate-y-1.5" : "group-hover:scale-110"
                      )} />
                      
                      <AnimatePresence>
                        {isActive && (
                          <motion.span 
                            initial={{ opacity: 0, y: 5 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: 5 }}
                            className="text-[7px] md:text-[8px] font-bold tracking-tight absolute -bottom-3 whitespace-nowrap left-1/2 -translate-x-1/2"
                          >
                            {tab.label}
                          </motion.span>
                        )}
                      </AnimatePresence>
                    </div>

                    {isActive && (
                      <motion.div 
                        layoutId="activeIndicator"
                        className="absolute -bottom-1 w-1 h-1 bg-sacred-gold rounded-full shadow-[0_0_8px_rgba(196,166,123,0.8)]"
                        transition={{ type: "spring", bounce: 0.3, duration: 0.6 }}
                      />
                    )}
                  </button>
                );
              })}
            </div>
          </motion.nav>
        )}
      </AnimatePresence>
    </div>
  );
}

