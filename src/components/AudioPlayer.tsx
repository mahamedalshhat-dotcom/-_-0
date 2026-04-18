import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Play, Pause, SkipBack, SkipForward, X, Volume2, Music } from 'lucide-react';
import { cn } from '../lib/utils';

interface AudioState {
  index: number;
  playlist: { url: string; title: string; subtitle: string }[];
  isPlaying: boolean;
}

export default function AudioPlayer() {
  const [state, setState] = useState<AudioState | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    const handlePlayAudio = (e: any) => {
      const { url, title, subtitle, playlist } = e.detail;
      if (playlist && Array.isArray(playlist)) {
        setState({ playlist, index: 0, isPlaying: true });
      } else {
        setState({ playlist: [{ url, title, subtitle }], index: 0, isPlaying: true });
      }
    };

    window.addEventListener('play-quran-audio', handlePlayAudio);
    return () => window.removeEventListener('play-quran-audio', handlePlayAudio);
  }, []);

  const playPromiseRef = useRef<Promise<void> | null>(null);

  const currentItem = state ? state.playlist[state.index] : null;

  useEffect(() => {
    if (currentItem?.url && audioRef.current) {
      audioRef.current.src = currentItem.url;
      if (state?.isPlaying) {
        playPromiseRef.current = audioRef.current.play();
        playPromiseRef.current.catch(err => {
          if (err.name !== 'AbortError') {
            console.error("Playback failed", err);
          }
        });
      }
    }
  }, [currentItem?.url]);

  const handleEnded = () => {
    if (state && state.index < state.playlist.length - 1) {
      setState(prev => prev ? { ...prev, index: prev.index + 1 } : null);
    } else {
      setState(prev => prev ? { ...prev, isPlaying: false } : null);
    }
  };

  const nextTrack = () => {
    if (state && state.index < state.playlist.length - 1) {
      setState(prev => prev ? { ...prev, index: prev.index + 1 } : null);
    }
  };

  const prevTrack = () => {
    if (state && state.index > 0) {
      setState(prev => prev ? { ...prev, index: prev.index - 1 } : null);
    }
  };

  const togglePlay = async () => {
    if (!audioRef.current) return;
    
    if (state?.isPlaying) {
      if (playPromiseRef.current) {
        try { await playPromiseRef.current; } catch (err) {}
      }
      audioRef.current.pause();
      setState(prev => prev ? { ...prev, isPlaying: false } : null);
    } else {
      try {
        playPromiseRef.current = audioRef.current.play();
        setState(prev => prev ? { ...prev, isPlaying: true } : null);
        await playPromiseRef.current;
      } catch (err) {
        if (err.name !== 'AbortError') console.error("Playback failed", err);
        setState(prev => prev ? { ...prev, isPlaying: false } : null);
      } finally {
        playPromiseRef.current = null;
      }
    }
  };

  if (!state || !currentItem) return null;

  return (
    <AnimatePresence>
      <motion.div 
        initial={{ y: 100, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        exit={{ y: 100, opacity: 0 }}
        className="fixed bottom-[7.5rem] left-4 right-4 max-w-[calc(100%-2rem)] md:max-w-2xl lg:max-w-4xl mx-auto bg-sacred-ink text-white p-4 rounded-3xl shadow-2xl z-[150] flex items-center gap-4 border border-white/10 backdrop-blur-xl"
      >
        <audio 
          ref={audioRef} 
          onEnded={handleEnded}
          onPlay={() => setState(prev => prev ? { ...prev, isPlaying: true } : null)}
          onPause={() => setState(prev => prev ? { ...prev, isPlaying: false } : null)}
        />
        
        <div className="w-12 h-12 rounded-2xl bg-white/10 flex items-center justify-center text-sacred-gold shrink-0">
          <Music className={cn("w-6 h-6", state.isPlaying && "animate-pulse")} />
        </div>

        <div className="flex-1 min-w-0">
          <h4 className="text-sm font-bold truncate">{currentItem.title}</h4>
          <p className="text-[10px] text-white/60 truncate">{currentItem.subtitle} {state.playlist.length > 1 && `(${state.index + 1}/${state.playlist.length})`}</p>
        </div>

        <div className="flex items-center gap-2">
          {state.playlist.length > 1 && (
            <>
              <button 
                onClick={prevTrack}
                disabled={state.index === 0}
                className="p-2 text-white/40 hover:text-white disabled:opacity-10"
              >
                <SkipBack className="w-4 h-4 fill-current" />
              </button>
              <button 
                onClick={nextTrack}
                disabled={state.index === state.playlist.length - 1}
                className="p-2 text-white/40 hover:text-white disabled:opacity-10"
              >
                <SkipForward className="w-4 h-4 fill-current" />
              </button>
            </>
          )}
          <button 
            onClick={togglePlay}
            className="w-10 h-10 rounded-full bg-white text-sacred-ink flex items-center justify-center hover:scale-105 transition-all"
          >
            {state.isPlaying ? <Pause className="w-5 h-5 fill-current" /> : <Play className="w-5 h-5 fill-current ml-1" />}
          </button>
          <button 
            onClick={() => setState(null)}
            className="p-2 text-white/40 hover:text-white transition-all"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </motion.div>
    </AnimatePresence>
  );
}

export function playQuranAudio(url: string, title: string, subtitle: string, playlist?: { url: string; title: string; subtitle: string }[]) {
  window.dispatchEvent(new CustomEvent('play-quran-audio', { detail: { url, title, subtitle, playlist } }));
}
