
import React, { useState, useEffect } from 'react';
import { Hand, Heart, X, MousePointer2, Sparkles, Ghost, Users, Zap, ChevronUp, Atom, ScanFace } from 'lucide-react';
import { playClick, playMatchSuccess, playTransition } from '../services/audioService';
import AuraLogo from './AuraLogo';

interface TutorialOverlayProps {
  onComplete: () => void;
}

const TutorialOverlay: React.FC<TutorialOverlayProps> = ({ onComplete }) => {
  // Steps: 
  // 0: Intro
  // 1: The Aura Engine (Why these profiles?) - NEW
  // 2: Modes (Incognito/Clairvoyance)
  // 3: Oracle (Daily Boost)
  // 4: Details (Soul)
  // 5: Swipe (Instinct)
  // 6: Ready
  const [step, setStep] = useState<0 | 1 | 2 | 3 | 4 | 5 | 6>(0);

  useEffect(() => {
    // Auto advance step 0 after a brief moment
    const timer = setTimeout(() => {
        setStep(1);
        playTransition();
    }, 2500);
    return () => clearTimeout(timer);
  }, []);

  const handleNext = () => {
    playClick(800);
    if (step < 6) {
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
    <div className="fixed inset-0 z-[150] flex flex-col text-white cursor-pointer" onClick={step < 6 ? handleNext : undefined}>
      
      {/* Dark Backdrop with transition */}
      <div className="absolute inset-0 bg-black/85 backdrop-blur-sm transition-all duration-700"></div>

      {/* STEP 0: WELCOME */}
      {step === 0 && (
          <div className="absolute inset-0 flex items-center justify-center animate-fade-in">
              <div className="text-center p-6">
                  <div className="relative inline-block mb-6">
                      <div className="absolute inset-0 bg-white/20 blur-3xl rounded-full animate-pulse"></div>
                      <AuraLogo size={100} className="relative z-10 mx-auto animate-float" />
                  </div>
                  <h1 className="text-5xl font-serif font-bold bg-clip-text text-transparent bg-gradient-to-r from-brand-start via-white to-brand-end mb-4 tracking-tight">
                      Aura
                  </h1>
                  <p className="text-gray-300 text-lg font-light">La rencontre commence par l'âme.</p>
              </div>
          </div>
      )}

      {/* STEP 1: THE AURA ENGINE (THE "WHY") */}
      {step === 1 && (
          <div className="absolute inset-0 animate-fade-in">
              {/* Spotlight Center Card Area */}
              <div className="absolute top-[15%] left-[10%] right-[10%] h-[60%] border border-brand-mid/50 rounded-[2rem] shadow-[0_0_100px_rgba(127,0,255,0.3)] animate-pulse-slow pointer-events-none bg-brand-mid/5"></div>
              
              <div className="absolute bottom-[15%] left-1/2 -translate-x-1/2 text-center w-80 pointer-events-none">
                  <div className="w-14 h-14 bg-gradient-to-br from-brand-start to-brand-mid rounded-full flex items-center justify-center mx-auto mb-6 border border-white/20 shadow-glow-brand animate-float">
                      <Atom size={32} className="text-white animate-spin-slow" />
                  </div>
                  <h2 className="text-3xl font-bold text-white mb-3 font-display">Rien n'est hasard</h2>
                  <p className="text-sm text-gray-200 leading-relaxed font-body">
                      Les profils que vous voyez ne sont pas aléatoires.<br/><br/>
                      Une <span className="text-brand-end font-bold">intelligence invisible</span> analyse votre psychologie, votre rythme et vos choix pour n'attirer que ceux qui <span className="text-yellow-400 font-bold">vibrent à votre fréquence</span>.
                  </p>
              </div>
          </div>
      )}

      {/* STEP 2: THE MODES (Focus Top Right) */}
      {step === 2 && (
          <div className="absolute inset-0 animate-fade-in">
              {/* Spotlight Top Right */}
              <div className="absolute top-4 right-4 w-32 h-16 bg-white/10 rounded-full blur-xl animate-pulse pointer-events-none"></div>
              
              <div className="absolute top-24 right-4 text-right w-64 pointer-events-none pr-4">
                  <div className="flex justify-end gap-3 mb-4">
                       <div className="w-10 h-10 bg-gray-800 rounded-full flex items-center justify-center border border-white/20">
                           <Ghost size={20} className="text-gray-400" />
                       </div>
                       <div className="w-10 h-10 bg-brand-mid rounded-full flex items-center justify-center border border-white/20 shadow-glow-brand">
                           <Users size={20} className="text-white" />
                       </div>
                  </div>
                  <h2 className="text-2xl font-bold text-white mb-2">Choisissez votre vision</h2>
                  <p className="text-sm text-gray-300 leading-relaxed">
                      <strong className="text-brand-mid">Incognito</strong> pour voir les âmes sans voir les visages.<br/>
                      <strong className="text-brand-mid">Clairvoyance</strong> pour tout révéler.
                  </p>
              </div>
          </div>
      )}

      {/* STEP 3: THE ORACLE (Focus Top Bar) */}
      {step === 3 && (
          <div className="absolute inset-0 animate-fade-in">
              {/* Spotlight Top Bar */}
              <div className="absolute top-14 left-0 right-0 h-12 bg-yellow-500/20 blur-xl animate-pulse pointer-events-none"></div>
              
              <div className="absolute top-32 left-1/2 -translate-x-1/2 text-center w-72 pointer-events-none">
                  <div className="w-12 h-12 bg-yellow-500/20 rounded-full flex items-center justify-center mx-auto mb-4 border border-yellow-500 animate-bounce">
                      <Zap className="text-yellow-400 fill-yellow-400" size={24} />
                  </div>
                  <h2 className="text-2xl font-bold text-white mb-2">L'Oracle Quotidien</h2>
                  <p className="text-sm text-gray-300 leading-relaxed">
                      Répondez à la question du jour en haut de l'écran pour <span className="text-yellow-400 font-bold">booster votre Karma</span> et votre visibilité.
                  </p>
              </div>
          </div>
      )}

      {/* STEP 4: THE SOUL (Focus Center) */}
      {step === 4 && (
          <div className="absolute inset-0 animate-fade-in">
              {/* Spotlight Center */}
              <div className="absolute top-[20%] left-[10%] right-[10%] h-[50%] border-2 border-white/10 rounded-3xl bg-white/5 backdrop-blur-sm pointer-events-none"></div>
              
              <div className="absolute bottom-[30%] left-1/2 -translate-x-1/2 text-center w-72 pointer-events-none">
                  <div className="w-12 h-12 bg-white/10 rounded-full flex items-center justify-center mx-auto mb-4 animate-pulse border border-white/20">
                      <ChevronUp className="text-white" size={28} />
                  </div>
                  <h2 className="text-2xl font-bold text-white mb-2">Creusez plus profond</h2>
                  <p className="text-sm text-gray-300 leading-relaxed">
                      Touchez le bas de la carte ou scrollez pour révéler la Bio, le MBTI et le <span className="text-brand-end font-bold">Score de Compatibilité</span>.
                  </p>
              </div>
          </div>
      )}

      {/* STEP 5: THE INSTINCT (Focus Bottom) */}
      {step === 5 && (
          <div className="absolute inset-0 animate-fade-in">
               <div className="absolute bottom-0 left-0 right-0 h-[25%] bg-gradient-to-t from-brand-mid/20 to-transparent pointer-events-none"></div>

               <div className="absolute bottom-[20%] left-1/2 -translate-x-1/2 text-center w-80 pointer-events-none">
                   <div className="flex justify-center gap-16 mb-6">
                       <div className="flex flex-col items-center gap-2 animate-pulse">
                            <div className="w-14 h-14 rounded-full border-2 border-gray-600 flex items-center justify-center bg-black/40">
                                <X className="text-gray-400" size={24} />
                            </div>
                            <span className="text-[10px] uppercase tracking-widest text-gray-500 font-bold">Passer</span>
                       </div>
                       <div className="flex flex-col items-center gap-2 animate-pulse delay-100">
                            <div className="w-14 h-14 rounded-full border-2 border-brand-end flex items-center justify-center bg-brand-end/20 shadow-glow-fire">
                                <Heart className="text-brand-end fill-brand-end" size={24} />
                            </div>
                            <span className="text-[10px] uppercase tracking-widest text-brand-end font-bold">Connecter</span>
                       </div>
                   </div>
                   <h2 className="text-2xl font-bold text-white mb-2">Suivez votre instinct</h2>
                   <p className="text-sm text-gray-300">
                       L'algorithme apprend de chaque geste.
                   </p>
               </div>
          </div>
      )}

      {/* STEP 6: LAUNCH */}
      {step === 6 && (
          <div className="absolute inset-0 flex items-center justify-center animate-scale-in p-6">
              <div className="text-center w-full max-w-sm bg-gray-900/90 backdrop-blur-2xl border border-white/10 p-8 rounded-[2.5rem] shadow-[0_0_60px_rgba(75,0,224,0.4)]">
                  <div className="mb-6">
                      <Sparkles className="w-12 h-12 text-yellow-400 mx-auto animate-spin-slow" />
                  </div>
                  <h2 className="text-3xl font-display font-bold text-white mb-4">Votre Aura est prête</h2>
                  <p className="text-gray-400 mb-8 text-sm leading-relaxed">
                      Soyez authentique. Soyez curieux.<br/>L'univers fera le reste.
                  </p>
                  <button 
                    onClick={(e) => { e.stopPropagation(); handleFinish(); }}
                    className="w-full py-4 bg-gradient-to-r from-brand-mid to-brand-end text-white font-bold rounded-xl text-lg shadow-lg hover:scale-[1.02] transition-transform flex items-center justify-center gap-2 group"
                  >
                      Explorer
                      <Sparkles size={20} className="group-hover:rotate-12 transition-transform" />
                  </button>
              </div>
          </div>
      )}
    </div>
  );
};

export default TutorialOverlay;
