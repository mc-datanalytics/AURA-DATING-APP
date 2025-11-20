
import React, { useState, useEffect } from 'react';
import { Hand, Heart, X, MousePointer2, Sparkles } from 'lucide-react';
import { playClick, playMatchSuccess, playTransition } from '../services/audioService';
import AuraLogo from './AuraLogo';

interface TutorialOverlayProps {
  onComplete: () => void;
}

const TutorialOverlay: React.FC<TutorialOverlayProps> = ({ onComplete }) => {
  const [step, setStep] = useState<0 | 1 | 2 | 3>(0); // 0: Welcome, 1: Soul/Info, 2: Actions, 3: Ready

  useEffect(() => {
    // Auto advance step 0 after a brief moment
    const timer = setTimeout(() => {
        setStep(1);
        playTransition();
    }, 1500);
    return () => clearTimeout(timer);
  }, []);

  const handleNext = () => {
    playClick(800);
    if (step < 3) {
        setStep(prev => (prev + 1) as any);
    } else {
        handleFinish();
    }
  };

  const handleFinish = () => {
      playMatchSuccess(); // The sensory reward
      onComplete();
  };

  return (
    <div className="fixed inset-0 z-[70] flex flex-col text-white cursor-pointer" onClick={step < 3 ? handleNext : undefined}>
      
      {/* Dark Backdrop with Hole effect (Simulated via opacity layers) */}
      <div className="absolute inset-0 bg-black/80 backdrop-blur-sm transition-all duration-700"></div>

      {/* STEP 0: WELCOME */}
      {step === 0 && (
          <div className="absolute inset-0 flex items-center justify-center animate-fade-in">
              <div className="text-center">
                  <AuraLogo size={100} className="mx-auto mb-4 animate-pulse-slow" />
                  <h1 className="text-4xl font-serif font-bold bg-clip-text text-transparent bg-gradient-to-r from-purple-200 to-pink-200">
                      Bienvenue sur Aura
                  </h1>
                  <p className="text-gray-400 mt-2">Laissez-vous guider...</p>
              </div>
          </div>
      )}

      {/* STEP 1: THE SOUL (Focus on Top/Center) */}
      {step === 1 && (
          <div className="absolute inset-0 animate-fade-in">
              {/* Spotlights */}
              <div className="absolute top-[15%] left-0 right-0 h-[50%] bg-gradient-to-b from-transparent via-white/5 to-transparent opacity-20 pointer-events-none"></div>
              
              <div className="absolute top-[40%] left-1/2 -translate-x-1/2 text-center w-64 pointer-events-none">
                  <div className="w-12 h-12 bg-aura-accent/20 rounded-full flex items-center justify-center mx-auto mb-4 animate-bounce border border-aura-accent">
                      <MousePointer2 className="text-aura-accent" />
                  </div>
                  <h2 className="text-2xl font-bold text-white mb-2 drop-shadow-lg">L'Âme d'abord</h2>
                  <p className="text-sm text-gray-200 leading-relaxed">
                      Ici, le physique est secondaire. <br/>
                      <span className="text-aura-accent font-bold">Touchez la carte</span> pour découvrir la bio, les passions et votre compatibilité.
                  </p>
                  <p className="text-xs text-gray-500 mt-8 animate-pulse">Appuyez pour continuer</p>
              </div>
          </div>
      )}

      {/* STEP 2: THE INSTINCT (Focus on Bottom) */}
      {step === 2 && (
          <div className="absolute inset-0 animate-fade-in">
               <div className="absolute bottom-0 left-0 right-0 h-[30%] bg-gradient-to-t from-aura-accent/10 to-transparent pointer-events-none"></div>

               <div className="absolute bottom-[25%] left-1/2 -translate-x-1/2 text-center w-72 pointer-events-none">
                   <div className="flex justify-center gap-12 mb-4">
                       <div className="flex flex-col items-center gap-2 animate-pulse">
                            <X className="text-gray-400" size={32} />
                            <span className="text-xs uppercase tracking-widest text-gray-500">Passer</span>
                       </div>
                       <div className="flex flex-col items-center gap-2 animate-pulse delay-100">
                            <Heart className="text-aura-accent fill-aura-accent" size={32} />
                            <span className="text-xs uppercase tracking-widest text-aura-accent">Connecter</span>
                       </div>
                   </div>
                   <h2 className="text-2xl font-bold text-white mb-2 drop-shadow-lg">Suivez votre instinct</h2>
                   <p className="text-sm text-gray-200">
                       Swipez <span className="text-red-300 font-bold">Gauche</span> pour passer.<br/>
                       Swipez <span className="text-aura-accent font-bold">Droite</span> pour connecter.
                   </p>
                   <p className="text-xs text-gray-500 mt-8 animate-pulse">Appuyez pour continuer</p>
               </div>
          </div>
      )}

      {/* STEP 3: LAUNCH */}
      {step === 3 && (
          <div className="absolute inset-0 flex items-center justify-center animate-scale-in p-6">
              <div className="text-center w-full max-w-sm bg-gray-900/90 backdrop-blur-xl border border-white/20 p-8 rounded-3xl shadow-[0_0_50px_rgba(176,106,179,0.3)]">
                  <h2 className="text-3xl font-serif font-bold text-white mb-4">C'est à vous</h2>
                  <p className="text-gray-300 mb-8">
                      Votre voyage commence maintenant. Soyez authentique, soyez curieux.
                  </p>
                  <button 
                    onClick={(e) => { e.stopPropagation(); handleFinish(); }}
                    className="w-full py-4 bg-gradient-to-r from-aura-mid to-aura-accent text-white font-bold rounded-xl text-lg shadow-lg hover:scale-105 transition-transform flex items-center justify-center gap-2"
                  >
                      <Sparkles size={20} className="animate-spin-slow" />
                      Découvrir les âmes
                  </button>
              </div>
          </div>
      )}
    </div>
  );
};

export default TutorialOverlay;
