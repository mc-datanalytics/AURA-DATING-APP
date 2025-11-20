
import React, { useEffect } from 'react';
import { UserProfile } from '../types';
import { MessageSquare, X, Sparkles, Heart } from 'lucide-react';
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
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-black/90 backdrop-blur-xl animate-fade-in">
      <div className="flex flex-col items-center w-full max-w-md relative">
        
        {/* Animated Background Glow */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full h-full bg-aura-accent/20 blur-[100px] rounded-full animate-pulse-slow"></div>

        {/* Title */}
        <div className="relative z-10 text-center mb-12 animate-slide-down">
            <div className="flex items-center justify-center gap-2 mb-2">
                <Sparkles className="text-yellow-300 animate-spin-slow" size={24} />
                <span className="text-yellow-300 font-bold tracking-widest uppercase text-xs">Nouvelle Connexion</span>
                <Sparkles className="text-yellow-300 animate-spin-slow" size={24} />
            </div>
            <h1 className="font-serif text-5xl italic font-bold text-transparent bg-clip-text bg-gradient-to-r from-pink-300 via-purple-300 to-indigo-300 drop-shadow-[0_0_10px_rgba(176,106,179,0.5)]">
                It's a Match
            </h1>
            <p className="text-white/80 mt-2">Vos âmes résonnent à <span className="text-aura-accent font-bold">{matchedUser.compatibilityScore}%</span></p>
        </div>

        {/* Avatars interacting */}
        <div className="relative flex justify-center items-center w-full h-40 mb-12">
            {/* Left Avatar (User) */}
            <div className="absolute left-4 w-32 h-32 rounded-full border-4 border-white/20 overflow-hidden shadow-[0_0_30px_rgba(255,255,255,0.1)] animate-swipe-right z-10 rotate-[-10deg]">
                <img src={currentUser.imageUrl} alt="Me" className="w-full h-full object-cover" />
            </div>
            
            {/* Heart Icon in Middle */}
            <div className="absolute z-20 bg-white p-3 rounded-full shadow-[0_0_20px_rgba(255,255,255,0.5)] animate-scale-in delay-300">
                <Heart className="text-aura-accent fill-aura-accent" size={32} />
            </div>

            {/* Right Avatar (Match) */}
            <div className="absolute right-4 w-32 h-32 rounded-full border-4 border-aura-accent overflow-hidden shadow-[0_0_30px_rgba(176,106,179,0.4)] animate-swipe-left z-10 rotate-[10deg]">
                <img src={matchedUser.imageUrl} alt="Match" className="w-full h-full object-cover" />
            </div>
        </div>

        {/* Actions */}
        <div className="w-full space-y-4 z-10 animate-slide-up delay-500">
            <button 
                onClick={handleMessage}
                className="w-full py-4 bg-gradient-to-r from-aura-mid to-aura-accent rounded-full font-bold text-lg text-white shadow-lg hover:scale-105 transition-transform flex items-center justify-center gap-2"
            >
                <MessageSquare size={20} />
                Envoyer un message
            </button>

            <button 
                onClick={handleClose}
                className="w-full py-4 bg-white/5 border border-white/10 rounded-full font-semibold text-gray-300 hover:bg-white/10 hover:text-white transition-all"
            >
                Continuer de swiper
            </button>
        </div>

      </div>
    </div>
  );
};

export default NewMatchOverlay;
