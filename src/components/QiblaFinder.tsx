import { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { Compass, Navigation, MapPin } from 'lucide-react';

export default function QiblaFinder() {
  const [heading, setHeading] = useState(0);
  const [qiblaDir, setQiblaDir] = useState(0);
  const [isSupported, setIsSupported] = useState(true);
  const [location, setLocation] = useState<{ lat: number; lng: number } | null>(null);

  useEffect(() => {
    if ("geolocation" in navigator) {
      navigator.geolocation.getCurrentPosition((pos) => {
        const { latitude, longitude } = pos.coords;
        setLocation({ lat: latitude, lng: longitude });
        
        // Calculate Qibla direction
        // Kaaba coordinates: 21.4225° N, 39.8262° E
        const kaabaLat = 21.4225 * Math.PI / 180;
        const kaabaLng = 39.8262 * Math.PI / 180;
        const myLat = latitude * Math.PI / 180;
        const myLng = longitude * Math.PI / 180;
        
        const y = Math.sin(kaabaLng - myLng);
        const x = Math.cos(myLat) * Math.tan(kaabaLat) - Math.sin(myLat) * Math.cos(kaabaLng - myLng);
        let qibla = Math.atan2(y, x) * 180 / Math.PI;
        setQiblaDir((qibla + 360) % 360);
      });
    }

    const handleOrientation = (e: DeviceOrientationEvent) => {
      const webkitHeading = (e as any).webkitCompassHeading;
      if (webkitHeading !== undefined) {
        setHeading(webkitHeading);
      } else if (e.alpha !== null) {
        setHeading(360 - e.alpha);
      }
    };

    if (window.DeviceOrientationEvent) {
      window.addEventListener('deviceorientation', handleOrientation, true);
    } else {
      setIsSupported(false);
    }

    return () => window.removeEventListener('deviceorientation', handleOrientation);
  }, []);

  const diff = (qiblaDir - heading + 360) % 360;
  const isAligned = Math.abs(diff) < 5 || Math.abs(diff - 360) < 5;

  return (
    <div className="bg-white/40 backdrop-blur-xl rounded-[2.5rem] p-8 border border-sacred-gold/10 shadow-sm flex flex-col items-center text-center space-y-8">
      <div>
        <h3 className="text-xl font-display font-bold text-sacred-ink">بوصلة القبلة</h3>
        <p className="text-[10px] uppercase tracking-widest text-sacred-gold font-bold">Qibla Finder</p>
      </div>

      <div className="relative w-64 h-64 flex items-center justify-center">
        {/* Outer Ring */}
        <div className="absolute inset-0 rounded-full border-4 border-sacred-gold/10" />
        
        {/* Compass Disk */}
        <motion.div 
          animate={{ rotate: -heading }}
          transition={{ type: "spring", stiffness: 50, damping: 20 }}
          className="relative w-full h-full rounded-full flex items-center justify-center"
        >
          <div className="absolute top-4 font-bold text-sacred-ink/40 text-[10px]">N</div>
          <div className="absolute bottom-4 font-bold text-sacred-ink/40 text-[10px]">S</div>
          <div className="absolute left-4 font-bold text-sacred-ink/40 text-[10px]">W</div>
          <div className="absolute right-4 font-bold text-sacred-ink/40 text-[10px]">E</div>
          
          {/* Qibla Marker */}
          <motion.div 
            style={{ rotate: qiblaDir }}
            className="absolute inset-0 flex flex-col items-center pt-2"
          >
            <div className="w-6 h-6 bg-sacred-gold rounded-full flex items-center justify-center shadow-lg">
              <Navigation className="w-3 h-3 text-white fill-current" />
            </div>
            <div className="w-1 h-12 bg-sacred-gold/20 rounded-full -mt-1" />
          </motion.div>
        </motion.div>

        {/* Center Needle (Fixed) */}
        <div className="absolute w-1 h-32 bg-gradient-to-b from-sacred-green to-transparent rounded-full z-10" />
        <div className="absolute w-4 h-4 bg-sacred-green rounded-full border-2 border-white shadow-md z-20" />
      </div>

      <div className="space-y-2">
        <p className={cn(
          "text-lg font-bold transition-all duration-500",
          isAligned ? "text-sacred-green scale-110" : "text-sacred-ink/60"
        )}>
          {isAligned ? "أنت باتجاه القبلة" : "قم بتدوير الهاتف"}
        </p>
        <div className="flex items-center justify-center gap-4 text-[10px] text-sacred-ink/40 font-bold">
          <div className="flex items-center gap-1">
            <Compass className="w-3 h-3" />
            <span>{Math.round(heading)}°</span>
          </div>
          <div className="flex items-center gap-1">
            <MapPin className="w-3 h-3" />
            <span>القبلة: {Math.round(qiblaDir)}°</span>
          </div>
        </div>
      </div>

      {!isSupported && (
        <p className="text-[10px] text-red-500 italic">عذراً، جهازك لا يدعم مستشعر البوصلة.</p>
      )}
    </div>
  );
}

import { cn } from '../lib/utils';
