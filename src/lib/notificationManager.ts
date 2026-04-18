import { getPrayerTimes } from './adhan';
import { db } from './db';
import { PRAYER_SOUNDS } from '../constants';

let lastNotifiedMinute = '';

export async function checkAndNotify() {
  const settings = await db.settings.get('user_prefs');
  if (!settings || !settings.notifications) return;

  const now = new Date();
  const currentMinute = `${now.getHours()}:${now.getMinutes()}`;
  if (currentMinute === lastNotifiedMinute) return;

  // Get location
  let lat = 30.0444;
  let lng = 31.2357;

  if (settings.locationMethod === 'auto' && settings.location) {
    lat = settings.location.latitude;
    lng = settings.location.longitude;
  } else if (settings.locationMethod === 'manual' && settings.manualLocation) {
    // Manual location fallback (Cairo for now as coordinates aren't stored for manual)
    lat = 30.0444;
    lng = 31.2357;
  }

  const times = getPrayerTimes(lat, lng);
  const prayers = [
    { id: 'fajr', name: 'الفجر', time: times.fajr },
    { id: 'dhuhr', name: 'الظهر', time: times.dhuhr },
    { id: 'asr', name: 'العصر', time: times.asr },
    { id: 'maghrib', name: 'المغرب', time: times.maghrib },
    { id: 'isha', name: 'العشاء', time: times.isha },
  ];

  for (const prayer of prayers) {
    const prayerTime = prayer.time;
    if (!prayerTime || typeof prayerTime.getTime !== 'function' || isNaN(prayerTime.getTime())) continue;

    const diffMs = prayerTime.getTime() - now.getTime();
    const diffMins = Math.floor(diffMs / 60000);

    // 1. Exact prayer time
    if (diffMins === 0) {
      triggerNotification(prayer.name, `حان الآن موعد أذان ${prayer.name}`, settings, false, prayer.name);
      lastNotifiedMinute = currentMinute;
      break;
    }

    // 2. Pre-prayer alert
    if (settings.prePrayerAlert && settings.prePrayerTime === diffMins) {
      triggerNotification(prayer.name, `بقي ${diffMins} دقيقة على أذان ${prayer.name}`, settings, true, prayer.name, diffMins);
      lastNotifiedMinute = currentMinute;
      break;
    }
  }
}

async function triggerNotification(title: string, body: string, settings: any, isPreAlert = false, prayerName: string, minutesLeft?: number) {
  // Dispatch custom event for in-app overlay
  window.dispatchEvent(new CustomEvent('prayer-alert', {
    detail: {
      prayerName,
      type: isPreAlert ? 'pre' : 'now',
      minutesLeft
    }
  }));

  // Show system notification
  if (Notification.permission === 'granted') {
    new Notification(title, {
      body,
      icon: '/favicon.ico',
      badge: '/favicon.ico',
      tag: isPreAlert ? 'pre-alert' : 'adhan',
      vibrate: [200, 100, 200],
      requireInteraction: true 
    } as any);
  }

  // Play sound if not in silent mode
  if (!settings.silentMode) {
    const soundId = settings.notificationSound || 'adhan-makkah';
    await playNotificationSound(soundId);
  }
}

let activeAudio: HTMLAudioElement | null = null;

export async function stopNotificationSound() {
  if (activeAudio) {
    activeAudio.pause();
    activeAudio.src = '';
    activeAudio = null;
  }
}

async function playNotificationSound(soundId: string) {
  try {
    const cache = await caches.open('adhan-cache');
    const sound = PRAYER_SOUNDS.find(s => s.id === soundId);
    
    let audioBlob: Blob | null = null;

    if (sound) {
      const response = await cache.match(sound.url);
      if (response) {
        audioBlob = await response.blob();
      } else if (sound.url.startsWith('/sounds/')) {
        // Play bundled asset directly
        stopNotificationSound();
        const audio = new Audio(sound.url);
        activeAudio = audio;
        await audio.play();
        return;
      } else {
        // Fallback for network URLs not in cache (not recommended but for safety)
        stopNotificationSound();
        const audio = new Audio(sound.url);
        activeAudio = audio;
        await audio.play();
        return;
      }
    } else if (soundId.startsWith('custom-')) {
      const customSound = await db.customSounds.get(soundId);
      if (customSound) {
        audioBlob = customSound.data;
      }
    }

    if (audioBlob) {
      stopNotificationSound();
      // Re-wrap to ensure correct MIME type
      const finalBlob = new Blob([audioBlob], { type: 'audio/mpeg' });
      const url = URL.createObjectURL(finalBlob);
      const audio = new Audio();
      activeAudio = audio;
      
      audio.oncanplaythrough = async () => {
        try {
          await audio.play();
        } catch (err) {
          console.error("Notification sound play failed", err);
          URL.revokeObjectURL(url);
          if (activeAudio === audio) activeAudio = null;
        }
      };

      audio.onended = () => {
        URL.revokeObjectURL(url);
        if (activeAudio === audio) activeAudio = null;
      };
      audio.onerror = () => {
        console.error("Notification sound load failed");
        URL.revokeObjectURL(url);
        if (activeAudio === audio) activeAudio = null;
      };

      audio.src = url;
      audio.load();
    }
  } catch (err) {
    console.error("Failed to play notification sound", err);
  }
}
