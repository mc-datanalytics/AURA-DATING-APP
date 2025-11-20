
import React, { useState, useRef, useEffect } from 'react';
import { Fingerprint, ShieldCheck, AlertTriangle } from 'lucide-react';
import { playClick, playMatchSuccess, playSwipeLeft } from '../services/audioService';
import clsx from 'clsx';

interface AntiBotVerificationProps {
  onVerified: () => void;
}

const AntiBotVerification: React.FC<AntiBotVerificationProps> = ({ onVerified }) => {
  const [progress, setProgress] = useState(0);
  const [status, setStatus] = useState<'IDLE' | 'PRESSING' | 'SUCCESS' | 'FAILED'>('IDLE');
  const [message, setMessage] = useState("Maintenez pour synchroniser votre âme");
  
  const requestRef = useRef<number>(0);
  const startTimeRef = useRef<number>(0);
  const intensityRef = useRef<number>(0); // To simulate organic fluctuation

  const handlePressStart = (e: React.PointerEvent | React.TouchEvent) => {
    // Prevent default to stop text selection or scrolling
    // e.preventDefault(); 
    if (status === 'SUCCESS') return;
    
    setStatus('PRESSING');
    setMessage("Synchronisation...");
    startTimeRef.current = Date.now();
    intensityRef.current = 0;
    
    const animate = () => {
      intensityRef.current += 0.8 + Math.random() * 0.5; // Non-linear speed
      
      setProgress((prev) => {
        const next = prev + intensityRef.current * 0.05;
        if (next >= 100) {
           // Overload fail
           return 100;
        }
        return next;
      });
      
      requestRef.current = requestAnimationFrame(animate);
    };
    
    requestRef.current = requestAnimationFrame(animate);
    playClick(200); // Low hum start
  };

  const handlePressEnd = () => {
    if (status !== 'PRESSING') return;
    
    cancelAnimationFrame(requestRef.current);
    
    const duration = Date.now() - startTimeRef.current;
    
    // Bot Detection 1: Too fast (Click instead of hold)
    if (duration < 500) {
       failVerification("Trop rapide. Ressentez l'instant.");
       return;
    }

    // Logic: Target zone is 85% - 95%
    if (progress >= 85 && progress <= 98) {
        succeedVerification();
    } else if (progress > 98) {
        failVerification("Surcharge d'énergie. Relâchez plus tôt.");
    } else {
        failVerification("Signal trop faible. Maintenez plus longtemps.");
    }
  };

  const failVerification = (msg: string) => {
      setStatus('FAILED');
      setMessage(msg);
      playSwipeLeft(); // Error sound
      
      // Reset after delay
      setTimeout(() => {
          setProgress(0);
          setStatus('IDLE');
          setMessage("Maintenez pour synchroniser votre âme");
      }, 1500);
  };

  const succeedVerification = () => {
      setStatus('SUCCESS');
      setMessage("Résonance Confirmée");
      playMatchSuccess();
      
      setTimeout(() => {
          onVerified();
      }, 1000);
  };

  // Monitor for overload during press
  useEffect(() => {
      if (progress >= 100 && status === 'PRESSING') {
          handlePressEnd();
      }
  }, [progress, status]);

  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] p-6 animate-fade-in select-none">
        
        <div className="mb-12 text-center">
            <h2 className="text-3xl font-display font-bold text-gray-900 dark:text-white mb-2">
                Preuve d'Âme
            </h2>
            <p className="text-gray-500 dark:text-gray-400 text-sm max-w-xs mx-auto">
                Prouvez que vous êtes humain via ce rituel de résonance.
            </p>
        </div>

        {/* The Ritual Circle */}
        <div className="relative w-48 h-48 flex items-center justify-center mb-12">
            
            {/* Background Track */}
            <div className="absolute inset-0 rounded-full border-4 border-gray-200 dark:border-white/10"></div>
            
            {/* Target Zone Indicator (85-95%) */}
            <svg className="absolute inset-0 w-full h-full -rotate-90" viewBox="0 0 100 100">
                 <circle 
                    cx="50" cy="50" r="48" 
                    fill="none" 
                    stroke="#4B00E0" 
                    strokeWidth="4"
                    strokeDasharray="301.59"
                    strokeDashoffset={301.59 - (301.59 * 0.13)} // Length of the segment
                    className="opacity-20"
                    transform="rotate(306 50 50)" // Position at ~85%
                 />
            </svg>

            {/* Active Progress Ring */}
            <svg className="absolute inset-0 w-full h-full -rotate-90 filter drop-shadow-[0_0_10px_rgba(127,0,255,0.5)]" viewBox="0 0 100 100">
                <circle
                    cx="50" cy="50" r="48"
                    fill="none"
                    stroke={status === 'FAILED' ? '#ef4444' : status === 'SUCCESS' ? '#10b981' : 'url(#gradientAura)'}
                    strokeWidth="6"
                    strokeLinecap="round"
                    strokeDasharray="301.59"
                    strokeDashoffset={301.59 - (301.59 * (progress / 100))}
                    className="transition-all duration-75 ease-linear"
                />
                <defs>
                    <linearGradient id="gradientAura" x1="0%" y1="0%" x2="100%" y2="0%">
                        <stop offset="0%" stopColor="#7F00FF" />
                        <stop offset="100%" stopColor="#FF4B6E" />
                    </linearGradient>
                </defs>
            </svg>

            {/* Fingerprint Button */}
            <button
                onPointerDown={handlePressStart}
                onPointerUp={handlePressEnd}
                onPointerLeave={handlePressEnd}
                onTouchStart={handlePressStart}
                onTouchEnd={handlePressEnd}
                className={clsx(
                    "w-32 h-32 rounded-full flex items-center justify-center transition-all duration-300 z-10 outline-none touch-none",
                    status === 'IDLE' && "bg-gray-100 dark:bg-white/5 text-gray-400 animate-pulse-slow",
                    status === 'PRESSING' && "bg-white dark:bg-white/10 text-brand-mid scale-95 shadow-inner",
                    status === 'SUCCESS' && "bg-green-500 text-white scale-110 shadow-glow-brand",
                    status === 'FAILED' && "bg-red-500 text-white shake"
                )}
            >
                {status === 'SUCCESS' ? (
                    <ShieldCheck size={48} className="animate-scale-in" />
                ) : status === 'FAILED' ? (
                    <AlertTriangle size={48} className="animate-shake" />
                ) : (
                    <Fingerprint size={48} className={status === 'PRESSING' ? 'animate-pulse' : ''} />
                )}
            </button>

            {/* Resonance Ripple Effect */}
            {status === 'PRESSING' && (
                 <div className="absolute inset-0 rounded-full border border-brand-mid opacity-50 animate-ping"></div>
            )}
        </div>

        {/* Status Message */}
        <div className={clsx("text-center transition-colors duration-300 font-bold", 
            status === 'FAILED' ? "text-red-500" : 
            status === 'SUCCESS' ? "text-green-500" : 
            "text-gray-600 dark:text-gray-300"
        )}>
            {message}
        </div>

        {status === 'IDLE' && (
            <p className="text-[10px] text-gray-400 mt-2">Relâchez quand le cercle est presque plein.</p>
        )}
    </div>
  );
};

export default AntiBotVerification;
