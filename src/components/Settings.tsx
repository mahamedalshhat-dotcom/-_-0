import { useState, useEffect, useRef } from 'react';
import { motion } from 'motion/react';
import { 
  Moon, 
  Sun, 
  Bell, 
  MapPin, 
  Mic, 
  VolumeX, 
  Monitor, 
  ShieldCheck,
  ChevronLeft,
  Smartphone,
  Volume2,
  Play,
  Square as StopIcon,
  Download,
} from 'lucide-react';
import { db } from '../lib/db';
import { cn } from '../lib/utils';
import { fetchWithRetry } from '../lib/api';
import { PRAYER_SOUNDS as sounds } from '../constants';
import { PRAYER_SOUNDS } from '../constants';

export default function Settings() {
  const [isSyncing, setIsSyncing] = useState(false);
  const [theme, setTheme] = useState<'light' | 'dark' | 'sepia'>('light');
  const [notifications, setNotifications] = useState(true);
  const [prePrayerAlert, setPrePrayerAlert] = useState(true);
  const [prePrayerTime, setPrePrayerTime] = useState(15);
  const [notificationSound, setNotificationSound] = useState('adhan-makkah');
  const [silentMode, setSilentMode] = useState(false);
  const [previewingId, setPreviewingId] = useState<string | null>(null);
  const [downloadingId, setDownloadingId] = useState<string | null>(null);
  const [downloadedSounds, setDownloadedSounds] = useState<Set<string>>(new Set());
  const [customSounds, setCustomSounds] = useState<{ id: string, name: string, data: Blob }[]>([]);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    checkPermissions();
    loadSettings();
    checkDownloadedSounds();
    loadCustomSounds();
  }, []);

  const loadCustomSounds = async () => {
    const custom = await db.customSounds.toArray();
    setCustomSounds(custom);
  };

  const checkDownloadedSounds = async () => {
    const cachesKeys = await caches.keys();
    if (cachesKeys.includes('adhan-cache')) {
      const cache = await caches.open('adhan-cache');
      const keys = await cache.keys();
      const downloaded = new Set(keys.map(req => {
        const sound = sounds.find(s => s.url === req.url);
        return sound ? sound.id : '';
      }).filter(id => id !== ''));
      setDownloadedSounds(downloaded);
    }
  };

  const downloadSound = async (sound: typeof sounds[0]) => {
    setDownloadingId(sound.id);
    
    const proxies = [
      (url: string) => `https://corsproxy.io/?${encodeURIComponent(url)}`,
      (url: string) => `https://api.allorigins.win/raw?url=${encodeURIComponent(url)}`,
      (url: string) => `https://api.codetabs.com/v1/proxy?quest=${encodeURIComponent(url)}`,
      (url: string) => `https://thingproxy.freeboard.io/fetch/${url}`,
      (url: string) => `https://yacdn.org/proxy/${url}`
    ];

    try {
      const cache = await caches.open('adhan-cache');
      
      // Race all proxies in parallel for maximum speed
      try {
        const blob = await Promise.any(proxies.map(async (getProxy) => {
          const proxyUrl = getProxy(sound.url);
          // Use only 1 retry for parallel racing to fail fast and let others win
          const res = await fetchWithRetry(proxyUrl, 1, 12000);
          const b = await res.blob();
          if (b.size < 50000) throw new Error("File too small");
          return b;
        }));
        
        // Store with forced audio/mpeg type
        await cache.put(sound.url, new Response(blob, {
          headers: { 
            'Content-Type': 'audio/mpeg',
            'Content-Length': blob.size.toString()
          }
        }));
        
        setDownloadedSounds(prev => new Set([...prev, sound.id]));
        setDownloadingId(null);
        return;
      } catch (raceErr) {
        console.warn("All parallel proxies failed, trying JSON fallback...", raceErr);
      }

      // Final attempt: AllOrigins JSON (Slowest but most robust)
      try {
        const jsonProxy = `https://api.allorigins.win/get?url=${encodeURIComponent(sound.url)}`;
        const response = await fetchWithRetry(jsonProxy, 2, 20000);
        if (response.ok) {
          const data = await response.json();
          if (data.contents && (data.contents.startsWith('data:audio') || data.contents.startsWith('data:application/octet-stream') || data.contents.startsWith('data:'))) {
            const blobRes = await fetch(data.contents);
            const blob = await blobRes.blob();
            if (blob.size > 50000) {
              await cache.put(sound.url, new Response(blob, { 
                headers: { 'Content-Type': 'audio/mpeg' } 
              }));
              setDownloadedSounds(prev => new Set([...prev, sound.id]));
              setDownloadingId(null);
              return;
            }
          }
        }
      } catch (jsonErr) {
        console.warn("JSON proxy failed", jsonErr);
      }

      alert("تعذر تحميل الملف الصوتي. قد يكون الموقع المصدر محجوباً أو هناك مشكلة في الاتصال. يرجى المحاولة لاحقاً.");
    } catch (err) {
      console.error("General download error", err);
      alert("حدث خطأ غير متوقع أثناء التحميل. يرجى المحاولة مرة أخرى.");
    } finally {
      setDownloadingId(null);
    }
  };

  const togglePreview = async (sound: typeof sounds[0] | { id: string, name: string, data: Blob }) => {
    if (previewingId === sound.id) {
      audioRef.current?.pause();
      setPreviewingId(null);
    } else {
      // Check if it's a custom sound (has data as Blob)
      if ('data' in sound) {
        if (audioRef.current) {
          audioRef.current.pause();
          audioRef.current.src = '';
        }
        const url = URL.createObjectURL(sound.data);
        const audio = new Audio(url);
        audioRef.current = audio;
        audio.onended = () => {
          setPreviewingId(null);
          URL.revokeObjectURL(url);
        };
        try {
          await audio.play();
          setPreviewingId(sound.id);
        } catch (err) {
          console.error("Custom sound play failed", err);
          setPreviewingId(null);
        }
        return;
      }

      if (sound.url.startsWith('/sounds/')) {
        if (audioRef.current) {
          audioRef.current.pause();
        }
        const audio = new Audio(sound.url);
        audioRef.current = audio;
        audio.onplay = () => setPreviewingId(sound.id);
        audio.onended = () => setPreviewingId(null);
        audio.onerror = () => {
          setPreviewingId(null);
          alert("الملف الصوتي غير موجود في السيرفر. يرجى التأكد من وجوده في مجلد public/sounds/");
        };
        try {
          await audio.play();
        } catch (err) {
          console.error("Bundled play failed", err);
          setPreviewingId(null);
        }
        return;
      }
      
      if (!downloadedSounds.has(sound.id)) {
        alert("يرجى تحميل الصوت أولاً قبل التشغيل.");
        return;
      }
      
      try {
        const cache = await caches.open('adhan-cache');
        const response = await cache.match(sound.url);
        if (response) {
          const blob = await response.blob();
          
          if (blob.size < 50000) {
            alert("يبدو أن الملف المحمل تالف (حجمه صغير جداً). يرجى حذفه وإعادة تحميله.");
            await cache.delete(sound.url);
            setDownloadedSounds(prev => {
              const next = new Set(prev);
              next.delete(sound.id);
              return next;
            });
            return;
          }

          // Create a new audio object for each play to avoid state issues
          if (audioRef.current) {
            audioRef.current.pause();
            audioRef.current.src = '';
          }

          const url = URL.createObjectURL(blob);
          const audio = new Audio();
          audioRef.current = audio;
          
          audio.oncanplaythrough = async () => {
            try {
              await audio.play();
              setPreviewingId(sound.id);
            } catch (playErr) {
              console.error("Play failed", playErr);
              // Fallback: try to play on next user interaction or show alert
              alert("المتصفح يمنع التشغيل التلقائي. يرجى الضغط مرة أخرى.");
              setPreviewingId(null);
            }
          };

          audio.onended = () => {
            setPreviewingId(null);
            URL.revokeObjectURL(url);
          };

          audio.onerror = () => {
            setPreviewingId(null);
            URL.revokeObjectURL(url);
            alert("حدث خطأ أثناء تشغيل الملف. يرجى إعادة التحميل.");
          };

          audio.src = url;
          audio.load();
        }
      } catch (err) {
        console.error("Playback failed", err);
        alert("فشل تشغيل الملف المحمل.");
      }
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('audio/')) {
      alert("يرجى اختيار ملف صوتي فقط.");
      return;
    }

    if (file.size > 10 * 1024 * 1024) { // 10MB limit
      alert("حجم الملف كبير جداً. الحد الأقصى هو 10 ميجابايت.");
      return;
    }

    const name = file.name.replace(/\.[^/.]+$/, "");
    const id = `custom-${Date.now()}`;
    
    try {
      await db.customSounds.add({
        id,
        name: `مخصص: ${name}`,
        data: file,
        type: file.type,
        createdAt: Date.now()
      });
      await loadCustomSounds();
      alert("تم إضافة صوت المؤذن بنجاح!");
    } catch (err) {
      console.error("Failed to save custom sound", err);
      alert("فشل حفظ الملف الصوتي.");
    }
  };

  const deleteCustomSound = async (id: string) => {
    if (confirm("هل أنت متأكد من حذف هذا الصوت؟")) {
      await db.customSounds.delete(id);
      if (notificationSound === id) {
        updateNotificationSound('adhan-makkah');
      }
      await loadCustomSounds();
    }
  };

  const [permissions, setPermissions] = useState({
    location: false,
    audio: false,
    notifications: false
  });
  const [locationMethod, setLocationMethod] = useState<'auto' | 'manual'>('auto');
  const [manualLocation, setManualLocation] = useState({ city: '', country: '' });

  const [calculationMethod, setCalculationMethod] = useState('MuslimWorldLeague');
  const [asrMethod, setAsrMethod] = useState('Shafi');

  async function loadSettings() {
    const settings = await db.settings.get('user_prefs');
    if (settings) {
      setTheme(settings.theme || 'light');
      if (settings.locationMethod) setLocationMethod(settings.locationMethod);
      if (settings.manualLocation) setManualLocation(settings.manualLocation);
      if (settings.notifications !== undefined) setNotifications(settings.notifications);
      if ((settings as any).prePrayerAlert !== undefined) setPrePrayerAlert((settings as any).prePrayerAlert);
      if ((settings as any).prePrayerTime !== undefined) setPrePrayerTime((settings as any).prePrayerTime);
      if ((settings as any).notificationSound) setNotificationSound((settings as any).notificationSound);
      if ((settings as any).silentMode !== undefined) setSilentMode((settings as any).silentMode);
      if ((settings as any).calculationMethod) setCalculationMethod((settings as any).calculationMethod);
      if ((settings as any).asrMethod) setAsrMethod((settings as any).asrMethod);
    }
  }

  const updateCalculationMethod = async (val: string) => {
    setCalculationMethod(val);
    await updateSetting('calculationMethod', val);
  };

  const updateAsrMethod = async (val: string) => {
    setAsrMethod(val);
    await updateSetting('asrMethod', val);
  };

  const updateSetting = async (key: string, value: any) => {
    const settings = await db.settings.get('user_prefs') || { id: 'user_prefs' };
    await db.settings.put({ ...settings, [key]: value });
  };

  const toggleNotifications = async (val: boolean) => {
    setNotifications(val);
    await updateSetting('notifications', val);
  };

  const togglePrePrayerAlert = async (val: boolean) => {
    setPrePrayerAlert(val);
    await updateSetting('prePrayerAlert', val);
  };

  const updatePrePrayerTime = async (val: number) => {
    setPrePrayerTime(val);
    await updateSetting('prePrayerTime', val);
  };

  const updateNotificationSound = async (val: string) => {
    setNotificationSound(val);
    await updateSetting('notificationSound', val);
  };

  const toggleSilentMode = async (val: boolean) => {
    setSilentMode(val);
    await updateSetting('silentMode', val);
  };

  async function checkPermissions() {
    const loc = await navigator.permissions.query({ name: 'geolocation' as PermissionName });
    const mic = await navigator.permissions.query({ name: 'microphone' as PermissionName });
    const notif = await navigator.permissions.query({ name: 'notifications' as PermissionName });

    setPermissions({
      location: loc.state === 'granted',
      audio: mic.state === 'granted',
      notifications: notif.state === 'granted'
    });
  }

  const requestPermission = async (type: 'location' | 'audio' | 'notifications') => {
    try {
      if (type === 'location') {
        navigator.geolocation.getCurrentPosition(
          () => checkPermissions(),
          (err) => {
            console.error("Location access denied", err);
            alert("يرجى تفعيل الوصول للموقع من إعدادات المتصفح لحساب مواقيت الصلاة.");
          },
          { enableHighAccuracy: true, timeout: 5000, maximumAge: 0 }
        );
      } else if (type === 'audio') {
        try {
          await navigator.mediaDevices.getUserMedia({ audio: true });
          checkPermissions();
        } catch (err) {
          console.error("Microphone access denied", err);
          alert("يرجى تفعيل الوصول للميكروفون من إعدادات المتصفح لاستخدام ميزة تصحيح التلاوة.");
        }
      } else if (type === 'notifications') {
        const res = await Notification.requestPermission();
        if (res === 'granted') {
          checkPermissions();
        } else {
          alert("يرجى تفعيل الإشعارات من إعدادات المتصفح لتلقي تنبيهات الأذان.");
        }
      }
    } catch (err) {
      console.error("Permission request failed", err);
    }
  };

  const toggleTheme = async (newTheme: 'light' | 'dark' | 'sepia') => {
    setTheme(newTheme);
    const settings = await db.settings.get('user_prefs');
    await db.settings.put({ ...settings, id: 'user_prefs', theme: newTheme });
    
    // Apply theme to document root
    document.documentElement.classList.remove('dark', 'sepia');
    if (newTheme !== 'light') {
      document.documentElement.classList.add(newTheme);
    }
  };

  const saveLocationSettings = async (method: 'auto' | 'manual', loc?: { city: string, country: string }) => {
    setLocationMethod(method);
    if (loc) setManualLocation(loc);
    await db.settings.put({ 
      id: 'user_prefs', 
      theme, 
      locationMethod: method, 
      manualLocation: loc || manualLocation 
    });
  };

  return (
    <div className="h-full flex flex-col space-y-8 pb-10">
      <div className="text-center">
        <p className="text-[10px] uppercase tracking-[0.3em] text-sacred-gold font-bold mb-2">تخصيص التجربة</p>
        <h2 className="text-xl font-display font-bold">الإعدادات</h2>
      </div>

      {/* Theme Selection */}
      <section className="space-y-4">
        <h3 className="text-xs font-bold text-sacred-ink/40 flex items-center gap-2">
          <Smartphone className="w-3 h-3" /> المظهر
        </h3>
        <div className="grid grid-cols-3 gap-3">
          {[
            { id: 'light', name: 'نهاري', icon: Sun, color: 'bg-white' },
            { id: 'dark', name: 'ليلي', icon: Moon, color: 'bg-slate-900' },
            { id: 'sepia', name: 'دافئ', icon: Smartphone, color: 'bg-[#f4ecd8]' }
          ].map((t) => (
            <button
              key={t.id}
              onClick={() => toggleTheme(t.id as any)}
              className={cn(
                "flex flex-col items-center gap-2 p-4 rounded-2xl border-2 transition-all",
                theme === t.id ? "border-sacred-gold bg-white shadow-md" : "border-transparent bg-white/40"
              )}
            >
              <div className={cn("w-8 h-8 rounded-full flex items-center justify-center", t.color)}>
                <t.icon className={cn("w-4 h-4", t.id === 'light' ? "text-orange-500" : "text-white")} />
              </div>
              <span className="text-[10px] font-bold">{t.name}</span>
            </button>
          ))}
        </div>
      </section>

      {/* Permissions Section */}
      <section className="space-y-4">
        <h3 className="text-xs font-bold text-sacred-ink/40 flex items-center gap-2">
          <ShieldCheck className="w-3 h-3" /> الموقع والصلاحيات
        </h3>
        
        {/* Location Method Toggle */}
        <div className="flex p-1 bg-sacred-gold/5 rounded-xl gap-1">
          <button
            onClick={() => saveLocationSettings('auto')}
            className={cn(
              "flex-1 py-2 rounded-lg text-[10px] font-bold transition-all",
              locationMethod === 'auto' ? "bg-white shadow-sm text-sacred-gold" : "text-sacred-ink/40"
            )}
          >
            تحديد تلقائي (GPS)
          </button>
          <button
            onClick={() => saveLocationSettings('manual')}
            className={cn(
              "flex-1 py-2 rounded-lg text-[10px] font-bold transition-all",
              locationMethod === 'manual' ? "bg-white shadow-sm text-sacred-gold" : "text-sacred-ink/40"
            )}
          >
            تحديد يدوي
          </button>
        </div>

        {locationMethod === 'manual' && (
          <motion.div 
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="grid grid-cols-2 gap-2"
          >
            <input
              type="text"
              placeholder="المدينة (مثلاً: القاهرة)"
              value={manualLocation.city}
              onChange={(e) => saveLocationSettings('manual', { ...manualLocation, city: e.target.value })}
              className="bg-white/60 border border-sacred-gold/10 rounded-xl p-3 text-[10px] focus:outline-none focus:border-sacred-gold"
            />
            <input
              type="text"
              placeholder="الدولة (مثلاً: مصر)"
              value={manualLocation.country}
              onChange={(e) => saveLocationSettings('manual', { ...manualLocation, country: e.target.value })}
              className="bg-white/60 border border-sacred-gold/10 rounded-xl p-3 text-[10px] focus:outline-none focus:border-sacred-gold"
            />
          </motion.div>
        )}

        <div className="space-y-2">
          {[
            { id: 'location', name: 'الوصول للموقع', desc: 'لحساب مواقيت الصلاة بدقة', icon: MapPin, granted: permissions.location, hidden: locationMethod === 'manual' },
            { id: 'audio', name: 'الميكروفون', desc: 'لتصحيح التلاوة صوتياً', icon: Mic, granted: permissions.audio },
            { id: 'notifications', name: 'الإشعارات', desc: 'للتنبيهات ومواعيد الأذان', icon: Bell, granted: permissions.notifications },
          ].filter(p => !p.hidden).map((p) => (
            <div key={p.id} className="flex items-center justify-between p-4 bg-white/60 rounded-2xl">
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 rounded-xl bg-sacred-gold/10 flex items-center justify-center text-sacred-gold">
                  <p.icon className="w-5 h-5" />
                </div>
                <div className="text-right">
                  <h4 className="text-sm font-bold">{p.name}</h4>
                  <p className="text-[9px] text-sacred-ink/40">{p.desc}</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                {p.id === 'notifications' && (
                  <button 
                    onClick={() => toggleNotifications(!notifications)}
                    className={cn(
                      "w-8 h-4 rounded-full relative transition-all duration-300 mr-2",
                      notifications ? "bg-sacred-green" : "bg-sacred-ink/10"
                    )}
                  >
                    <div className={cn(
                      "absolute top-0.5 w-3 h-3 rounded-full bg-white transition-all duration-300",
                      notifications ? "right-0.5" : "right-4.5"
                    )} />
                  </button>
                )}
                <button 
                  onClick={() => !p.granted && requestPermission(p.id as any)}
                  className={cn(
                    "px-3 py-1 rounded-full text-[9px] font-bold transition-all",
                    p.granted ? "bg-sacred-green/10 text-sacred-green" : "bg-sacred-gold text-white shadow-sm"
                  )}
                >
                  {p.granted ? "مفعل" : "تفعيل"}
                </button>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Prayer Calculation Settings */}
      <section className="space-y-4">
        <h3 className="text-xs font-bold text-sacred-ink/40 flex items-center gap-2">
          <Clock className="w-3 h-3" /> حساب المواقيت
        </h3>
        
        <div className="space-y-4 p-4 bg-white/60 rounded-2xl">
          <div className="space-y-2">
            <label className="text-[10px] font-bold text-sacred-ink/60 block">طريقة الحساب</label>
            <select 
              value={calculationMethod}
              onChange={(e) => updateCalculationMethod(e.target.value)}
              className="w-full bg-white border border-sacred-gold/10 rounded-xl p-3 text-[10px] focus:outline-none focus:border-sacred-gold"
            >
              <option value="MuslimWorldLeague">رابطة العالم الإسلامي</option>
              <option value="Egyptian">الهيئة المصرية العامة للمساحة</option>
              <option value="Karachi">جامعة العلوم الإسلامية بكراتشي</option>
              <option value="UmmAlQura">أم القرى (مكة المكرمة)</option>
              <option value="Dubai">دبي</option>
              <option value="Qatar">قطر</option>
              <option value="Kuwait">الكويت</option>
              <option value="MoonsightingCommittee">لجنة رؤية الهلال</option>
              <option value="Singapore">سنغافورة</option>
              <option value="Turkey">تركيا</option>
              <option value="Tehran">معهد الجيوفيزياء بجامعة طهران</option>
            </select>
          </div>

          <div className="space-y-2">
            <label className="text-[10px] font-bold text-sacred-ink/60 block">المذهب (صلاة العصر)</label>
            <div className="flex p-1 bg-sacred-gold/5 rounded-xl gap-1">
              <button
                onClick={() => updateAsrMethod('Shafi')}
                className={cn(
                  "flex-1 py-2 rounded-lg text-[10px] font-bold transition-all",
                  asrMethod === 'Shafi' ? "bg-white shadow-sm text-sacred-gold" : "text-sacred-ink/40"
                )}
              >
                شافعي، مالكي، حنبلي
              </button>
              <button
                onClick={() => updateAsrMethod('Hanafi')}
                className={cn(
                  "flex-1 py-2 rounded-lg text-[10px] font-bold transition-all",
                  asrMethod === 'Hanafi' ? "bg-white shadow-sm text-sacred-gold" : "text-sacred-ink/40"
                )}
              >
                حنفي
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* Smart Features */}
      <section className="space-y-4">
        <h3 className="text-xs font-bold text-sacred-ink/40 flex items-center gap-2">
          <Bell className="w-3 h-3" /> الميزات الذكية
        </h3>
        <div className="space-y-2">
          {/* Pre-prayer Alert */}
          <div className="flex flex-col p-4 bg-white/60 rounded-2xl space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 rounded-xl bg-sacred-gold/10 flex items-center justify-center text-sacred-gold">
                  <Clock className="w-5 h-5" />
                </div>
                <div className="text-right">
                  <h4 className="text-sm font-bold">تنبيه قبل الصلاة</h4>
                  <p className="text-[9px] text-sacred-ink/40">تذكير قبل الموعد</p>
                </div>
              </div>
              <button 
                onClick={() => togglePrePrayerAlert(!prePrayerAlert)}
                className={cn(
                  "w-10 h-5 rounded-full relative transition-all duration-300",
                  prePrayerAlert ? "bg-sacred-green" : "bg-sacred-ink/10"
                )}
              >
                <div className={cn(
                  "absolute top-1 w-3 h-3 rounded-full bg-white transition-all duration-300",
                  prePrayerAlert ? "right-1" : "right-6"
                )} />
              </button>
            </div>
            
            {prePrayerAlert && (
              <div className="flex items-center gap-2 pt-2 border-t border-sacred-gold/5">
                <span className="text-[10px] font-bold text-sacred-ink/60">الوقت:</span>
                <div className="flex gap-2 overflow-x-auto pb-1">
                  {[5, 10, 15, 20, 30].map((time) => (
                    <button
                      key={time}
                      onClick={() => updatePrePrayerTime(time)}
                      className={cn(
                        "px-3 py-1 rounded-lg text-[9px] font-bold transition-all whitespace-nowrap",
                        prePrayerTime === time ? "bg-sacred-gold text-white" : "bg-white border border-sacred-gold/10"
                      )}
                    >
                      {time} دقيقة
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Muezzin Voices */}
          <div className="flex flex-col p-4 bg-white/60 rounded-2xl space-y-4">
            <div className="flex items-center justify-between gap-4">
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 rounded-xl bg-sacred-gold/10 flex items-center justify-center text-sacred-gold">
                  <Volume2 className="w-5 h-5" />
                </div>
                <div className="text-right">
                  <h4 className="text-sm font-bold">أصوات المؤذنين</h4>
                  <p className="text-[9px] text-sacred-ink/40">اختر صوت الأذان المفضل لديك</p>
                </div>
              </div>
              <button 
                onClick={() => fileInputRef.current?.click()}
                className="sacred-button px-3 py-1.5 text-[9px] flex items-center gap-1.5"
              >
                <Mic className="w-3 h-3" />
                إضافة صوتك
              </button>
              <input 
                type="file" 
                ref={fileInputRef} 
                onChange={handleFileUpload} 
                accept="audio/*" 
                className="hidden" 
              />
            </div>
            
            <div className="grid grid-cols-1 gap-2 pt-2 border-t border-sacred-gold/5">
              {/* Built-in and Downloadable Sounds */}
              {sounds.map((sound) => (
                <div key={sound.id} className="flex gap-2">
                  <button
                    onClick={() => updateNotificationSound(sound.id)}
                    className={cn(
                      "flex-1 p-3 rounded-xl text-[10px] font-bold transition-all text-right border flex justify-between items-center",
                      notificationSound === sound.id ? "bg-sacred-green/10 border-sacred-green text-sacred-green" : "bg-white border-sacred-gold/5"
                    )}
                  >
                    <span>{sound.name}</span>
                    {notificationSound === sound.id && <div className="w-2 h-2 rounded-full bg-sacred-green" />}
                  </button>
                  
                  {sound.url.startsWith('/sounds/') ? (
                    <button
                      onClick={() => togglePreview(sound)}
                      className={cn(
                        "w-12 rounded-xl flex items-center justify-center transition-all border",
                        previewingId === sound.id ? "bg-red-50 border-red-200 text-red-500" : "bg-sacred-green/5 border-sacred-green/10 text-sacred-green"
                      )}
                      title="تشغيل / إيقاف"
                    >
                      {previewingId === sound.id ? <StopIcon className="w-4 h-4 fill-current" /> : <Play className="w-4 h-4 fill-current" />}
                    </button>
                  ) : !downloadedSounds.has(sound.id) ? (
                    <button
                      onClick={() => downloadSound(sound)}
                      disabled={downloadingId === sound.id}
                      className={cn(
                        "w-12 rounded-xl flex items-center justify-center transition-all border bg-sacred-gold/5 border-sacred-gold/10 text-sacred-gold",
                        downloadingId === sound.id && "animate-pulse opacity-50"
                      )}
                      title="تحميل الملف للتشغيل أوفلاين"
                    >
                      <Download className="w-4 h-4" />
                    </button>
                  ) : (
                    <button
                      onClick={() => togglePreview(sound)}
                      className={cn(
                        "w-12 rounded-xl flex items-center justify-center transition-all border",
                        previewingId === sound.id ? "bg-red-50 border-red-200 text-red-500" : "bg-sacred-green/5 border-sacred-green/10 text-sacred-green"
                      )}
                      title="تشغيل / إيقاف"
                    >
                      {previewingId === sound.id ? <StopIcon className="w-4 h-4 fill-current" /> : <Play className="w-4 h-4 fill-current" />}
                    </button>
                  )}
                </div>
              ))}

              {/* Custom Uploaded Sounds */}
              {customSounds.length > 0 && (
                <div className="pt-2 border-t border-sacred-gold/5 mt-2 space-y-2">
                  <p className="text-[9px] font-bold text-sacred-ink/40 px-1">أصواتك المضافة:</p>
                  {customSounds.map((sound) => (
                    <div key={sound.id} className="flex gap-2">
                      <button
                        onClick={() => updateNotificationSound(sound.id)}
                        className={cn(
                          "flex-1 p-3 rounded-xl text-[10px] font-bold transition-all text-right border flex justify-between items-center",
                          notificationSound === sound.id ? "bg-sacred-green/10 border-sacred-green text-sacred-green" : "bg-white border-sacred-gold/5"
                        )}
                      >
                        <span>{sound.name}</span>
                        {notificationSound === sound.id && <div className="w-2 h-2 rounded-full bg-sacred-green" />}
                      </button>
                      
                      <button
                        onClick={() => togglePreview(sound)}
                        className={cn(
                          "w-12 rounded-xl flex items-center justify-center transition-all border",
                          previewingId === sound.id ? "bg-red-50 border-red-200 text-red-500" : "bg-sacred-green/5 border-sacred-green/10 text-sacred-green"
                        )}
                      >
                        {previewingId === sound.id ? <StopIcon className="w-4 h-4 fill-current" /> : <Play className="w-4 h-4 fill-current" />}
                      </button>

                      <button
                        onClick={() => deleteCustomSound(sound.id)}
                        className="w-10 rounded-xl flex items-center justify-center bg-red-50 text-red-400 border border-red-100 hover:bg-red-100 transition-all"
                      >
                        <VolumeX className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Silent Mode */}
          <div className="flex items-center justify-between p-4 bg-white/60 rounded-2xl">
            <div className="flex items-center gap-4">
              <div className="w-10 h-10 rounded-xl bg-sacred-gold/10 flex items-center justify-center text-sacred-gold">
                <VolumeX className="w-5 h-5" />
              </div>
              <div className="text-right">
                <h4 className="text-sm font-bold">الوضع الصامت</h4>
                <p className="text-[9px] text-sacred-ink/40">صامت تلقائياً أثناء وقت الصلاة</p>
              </div>
            </div>
            <button 
              onClick={() => toggleSilentMode(!silentMode)}
              className={cn(
                "w-10 h-5 rounded-full relative transition-all duration-300",
                silentMode ? "bg-sacred-green" : "bg-sacred-ink/10"
              )}
            >
              <div className={cn(
                "absolute top-1 w-3 h-3 rounded-full bg-white transition-all duration-300",
                silentMode ? "right-1" : "right-6"
              )} />
            </button>
          </div>
        </div>
      </section>

      <div className="p-6 text-center space-y-4">
        <p className="text-[9px] text-sacred-ink/20">إصدار 1.0.0 - صنع بكل حب للأمة الإسلامية</p>
      </div>
    </div>
  );
}

function Clock({ className }: { className?: string }) {
  return <svg className={className} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>;
}
