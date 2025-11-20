import React, { useState, useEffect } from 'react';
import { Sparkles, X, Send, Zap } from 'lucide-react';
import { playClick, playDailyAuraComplete } from '../services/audioService';

interface DailyAuraModalProps {
  question: string;
  onClose: () => void;
  onComplete: (answer: string) => void;
}

const DailyAuraModal: React.FC<DailyAuraModalProps> = ({ question, onClose, onComplete }) => {
  const [step, setStep] = useState<'QUESTION' | 'SUCCESS'>('QUESTION');
  const [answer, setAnswer] = useState('');
  const [isAnimating, setIsAnimating] = useState(false);

  const handleSubmit = () => {
    if (!answer.trim()) return;
    
    playClick(900);
    setIsAnimating(true); 
    
    setTimeout(() => {
      playDailyAuraComplete();
      setStep('SUCCESS');
      setIsAnimating(false);
    }, 1500);
  };

  const handleCloseSuccess = () => {
    onComplete(answer);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black/80 dark:bg-black/90 backdrop-blur-md animate-fade-in transition-colors"
        onClick={step === 'QUESTION' ? onClose : undefined}
      />

      {/* Main Modal Content */}
      <div className="relative w-full max-w-md z-10 perspective-1000">
        
        {step === 'QUESTION' && (
          <div className={`bg-white dark:bg-gradient-to-b dark:from-gray-800 dark:to-black border border-gray-200 dark:border-brand-mid/30 rounded-3xl p-8 shadow-2xl transform transition-all duration-700 ${isAnimating ? 'scale-90 opacity-0 translate-y-10' : 'scale-100 opacity-100 translate-y-0'}`}>
            <button 
              onClick={onClose}
              className="absolute top-4 right-4 text-gray-400 hover:text-gray-900 dark:text-gray-500 dark:hover:text-white transition-colors"
            >
              <X size={24} />
            </button>

            <div className="flex justify-center mb-6">
              <div className="p-3 bg-brand-mid/10 dark:bg-brand-mid/20 rounded-full animate-float">
                <Sparkles className="w-8 h-8 text-brand-mid" />
              </div>
            </div>

            <h2 className="text-center text-brand-mid font-bold tracking-widest text-xs uppercase mb-4">
              Aura du Jour
            </h2>
            
            <h3 className="text-2xl font-serif text-center font-bold text-gray-900 dark:text-white mb-8 leading-relaxed">
              "{question}"
            </h3>

            <textarea
              value={answer}
              onChange={(e) => setAnswer(e.target.value)}
              placeholder="Laissez parler votre âme..."
              className="w-full bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-white/10 rounded-xl p-4 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none focus:border-brand-mid transition-all h-32 resize-none mb-6"
              autoFocus
            />

            <button
              onClick={handleSubmit}
              disabled={!answer.trim() || isAnimating}
              className="w-full bg-gradient-to-r from-brand-mid to-brand-end text-white py-4 rounded-xl font-bold shadow-lg hover:opacity-90 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 group"
            >
              {isAnimating ? (
                <span className="animate-pulse">Connexion à l'univers...</span>
              ) : (
                <>
                  Révéler à l'univers <Send size={18} className="group-hover:translate-x-1 transition-transform"/>
                </>
              )}
            </button>
            
            <p className="text-center text-[10px] text-gray-400 mt-4">
              Votre réponse affinera votre compatibilité et boostera votre profil.
            </p>
          </div>
        )}

        {step === 'SUCCESS' && (
          <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-brand-mid/50 rounded-3xl p-8 text-center animate-scale-in relative overflow-hidden shadow-2xl">
            {/* Magical Background Effects */}
            <div className="absolute inset-0 bg-brand-mid/5 dark:bg-brand-mid/10"></div>
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-64 h-64 bg-brand-mid blur-[100px] opacity-20 dark:opacity-30 animate-pulse-slow"></div>
            
            <div className="relative z-10 flex flex-col items-center">
                <div className="mb-6 relative">
                    <div className="absolute inset-0 bg-yellow-400 blur-xl opacity-50 animate-pulse"></div>
                    <Zap className="w-16 h-16 text-yellow-500 dark:text-yellow-400 relative drop-shadow-[0_0_15px_rgba(250,204,21,0.8)] animate-bounce" />
                </div>
                
                <h3 className="text-3xl font-serif font-bold text-transparent bg-clip-text bg-gradient-to-r from-yellow-500 to-amber-600 dark:from-yellow-200 dark:to-yellow-500 mb-2">
                    Aura Boostée !
                </h3>
                
                <p className="text-gray-600 dark:text-gray-300 mb-8 text-sm">
                    Votre réponse a été enregistrée. Votre visibilité est augmentée de <span className="text-yellow-600 dark:text-yellow-400 font-bold">200%</span> pour les prochaines 24h.
                </p>

                <button 
                    onClick={handleCloseSuccess}
                    className="px-8 py-3 bg-gray-100 dark:bg-white/10 border border-gray-200 dark:border-white/20 hover:bg-gray-200 dark:hover:bg-white/20 rounded-full font-semibold transition-all text-gray-900 dark:text-white"
                >
                    Retour aux rencontres
                </button>
            </div>
          </div>
        )}

      </div>
    </div>
  );
};

export default DailyAuraModal;