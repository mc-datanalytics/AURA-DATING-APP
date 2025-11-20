import React, { useEffect } from 'react';
import { UserProfile } from '../types';
import { MessageSquare, X, Sparkles, Infinity } from 'lucide-react';
import { playMatchSuccess, playClick } from '../services/audioService';

interface NewMatchOverlayProps {
  currentUser: UserProfile;
  matchedUser: UserProfile;
  onSendMessage: () => void;
  onKeepSwiping: () => void;
}

const NewMatchOverlay: React.FC<NewMatchOverlayProps> = ({ 
  currentUser, 
  matchedUser, 
  onSendMessage, 
  onKeepSwiping 
}) => {

  useEffect(() => {
    playMatchSuccess();
  }, []);

  const handleMessage = () => {
      playClick();
      onSendMessage();
  }

  const handleClose = () => {
      playClick(600);
      onKeepSwiping();
  }

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-obsidian/95 backdrop-blur-3xl animate-fade-in">
      <div className="flex flex-col items-center w-full max-w-md relative">
        
        {/* Particle Explosion (Simulated) */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[150%] h-[150%] bg-[radial-gradient(circle,rgba(127,0,255,0.2)_0%,transparent_70%)] animate-pulse-slow pointer-events-none"></div>

        {/* Title */}
        <div className="relative z-10 text-center mb-16 animate-scale-in">
            <div className="flex items-center justify-center gap-2 mb-3">
                <div className="h-[1px] w-12 bg-gradient-to-r from-transparent to-yellow-500/50"></div>
                <Sparkles className="text-yellow-400 animate-spin-slow" size={16} />
                <div className="h-[1px] w-12 bg-gradient-to-l from-transparent to-yellow-500/50"></div>
            </div>
            <h1 className="font-display text-5xl font-bold text-white tracking-tight drop-shadow-[0_0_20px_rgba(255,255,255,0.3)]">
                KARMA<br/>ALIGNED
            </h1>
            <p className="text-gray-400 mt-4 font-body text-sm tracking-wide">
                {currentUser.aura.dominantElement} & {matchedUser.aura.dominantElement} créent l'étincelle.
            </p>
        </div>

        {/* Avatars with Gold Thread */}
        <div className="relative flex justify-between items-center w-full h-40 mb-16 px-4">
            
            {/* Connecting Thread */}
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full h-[2px] bg-gradient-to-r from-transparent via-yellow-400 to-transparent shadow-[0_0_10px_#FACC15] animate-pulse z-0"></div>
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-20 bg-obsidian border border-yellow-500/50 p-2 rounded-full shadow-[0_0_20px_rgba(250,204,21,0.4)] animate-scale-in delay-300">
                 <Infinity size={24} className="text-yellow-400" />
            </div>

            {/* Left Avatar (User) */}
            <div className="w-28 h-28 rounded-full p-[2px] bg-gradient-to-br from-brand-start to-brand-end relative z-10 animate-slide-up">
                <div className="w-full h-full rounded-full overflow-hidden border-4 border-obsidian">
                    <img src={currentUser.imageUrl} alt="Me" className="w-full h-full object-cover" />
                </div>
            </div>
            
            {/* Right Avatar (Match) */}
            <div className="w-28 h-28 rounded-full p-[2px] bg-gradient-to-bl from-brand-start to-brand-end relative z-10 animate-slide-up delay-100">
                 <div className="w-full h-full rounded-full overflow-hidden border-4 border-obsidian">
                    <img src={matchedUser.imageUrl} alt="Match" className="w-full h-full object-cover" />
                </div>
            </div>
        </div>

        {/* Actions */}
        <div className="w-full space-y-4 z-10 animate-slide-up delay-500">
            <button 
                onClick={handleMessage}
                className="w-full py-4 bg-white text-black rounded-full font-bold text-lg shadow-[0_0_30px_rgba(255,255,255,0.2)] hover:scale-105 transition-transform flex items-center justify-center gap-2 font-display"
            >
                <MessageSquare size={20} />
                Dire Bonjour
            </button>

            <button 
                onClick={handleClose}
                className="w-full py-4 bg-transparent border border-white/10 rounded-full font-semibold text-gray-400 hover:text-white hover:border-white/30 transition-all font-body"
            >
                Explorer encore
            </button>
        </div>

      </div>
    </div>
  );
};

export default NewMatchOverlay;