
import React, { useEffect, useState } from 'react';
import { UserProfile, DiscoveryMode } from '../types';
import { ArrowLeft, Crown, Heart, Ghost, Zap, Lock } from 'lucide-react';
import { playClick, playMatchSuccess } from '../services/audioService';
import ProfileCard from './ProfileCard';
import clsx from 'clsx';

interface LikesReceivedViewProps {
  user: UserProfile;
  onBack: () => void;
  onGoPremium: () => void;
  onMatch: (target: UserProfile) => void;
  pendingLikes: UserProfile[];
}

const LikesReceivedView: React.FC<LikesReceivedViewProps> = ({ 
  user, 
  onBack, 
  onGoPremium, 
  onMatch, 
  pendingLikes 
}) => {

  const [selectedProfile, setSelectedProfile] = useState<UserProfile | null>(null);

  const handleProfileClick = (profile: UserProfile) => {
      playClick();
      if (!user.isPremium) {
          onGoPremium();
      } else {
          setSelectedProfile(profile);
      }
  }

  const handleAccept = () => {
      if(selectedProfile) {
          playMatchSuccess();
          onMatch(selectedProfile);
          setSelectedProfile(null);
      }
  }

  if (selectedProfile) {
      return (
          <div className="h-full flex flex-col bg-gray-900">
              <div className="p-4 flex items-center bg-black/20 backdrop-blur z-50 absolute top-0 left-0 right-0">
                  <button onClick={() => setSelectedProfile(null)} className="text-white flex items-center gap-2 bg-black/40 px-3 py-1.5 rounded-full border border-white/10">
                      <ArrowLeft size={16} /> Retour
                  </button>
              </div>
              <div className="flex-1 flex items-center justify-center p-4">
                   <ProfileCard 
                        profile={selectedProfile} 
                        mode={DiscoveryMode.CLAIRVOYANCE}
                        onSwipe={(dir) => {
                            if (dir === 'right') handleAccept();
                            else setSelectedProfile(null); // Pass essentially closes view
                        }}
                   />
              </div>
          </div>
      )
  }

  return (
    <div className="flex flex-col h-full bg-aura-dark overflow-y-auto custom-scrollbar">
      
      {/* Header */}
      <div className="p-4 flex items-center justify-between bg-aura-dark/90 backdrop-blur sticky top-0 z-20 border-b border-white/5">
        <div className="flex items-center gap-3">
            <button onClick={onBack} className="text-gray-300 hover:text-white">
                <ArrowLeft size={24} />
            </button>
            <h2 className="font-serif font-bold text-xl text-white">Ils vous ont liké</h2>
        </div>
        <div className="px-3 py-1 bg-yellow-500/20 border border-yellow-500/50 rounded-full text-yellow-400 text-xs font-bold">
            {pendingLikes.length} Likes
        </div>
      </div>

      <div className="p-4 pb-24">
         {pendingLikes.length === 0 ? (
             <div className="flex flex-col items-center justify-center h-[60vh] text-center opacity-50">
                 <Ghost className="w-16 h-16 mb-4 text-gray-500" />
                 <h3 className="text-lg font-bold text-gray-300">C'est calme...</h3>
                 <p className="text-sm text-gray-500 mt-2">Optimisez votre profil pour attirer plus d'âmes.</p>
             </div>
         ) : (
             <>
                {!user.isPremium && (
                    <div className="mb-6 p-4 rounded-2xl bg-gradient-to-r from-yellow-600/20 to-amber-600/20 border border-yellow-500/30 flex flex-col items-center text-center relative overflow-hidden">
                        <div className="absolute inset-0 bg-yellow-500/5 animate-pulse-slow"></div>
                        <Crown className="text-yellow-400 mb-2" size={24} fill="currentColor" />
                        <h3 className="font-bold text-yellow-100 mb-1">Passez à Aura Gold</h3>
                        <p className="text-xs text-yellow-200/70 mb-4">Voyez qui vous like et matchez instantanément sans attendre.</p>
                        <button 
                            onClick={onGoPremium}
                            className="px-6 py-2 bg-yellow-500 hover:bg-yellow-400 text-black font-bold rounded-full text-sm shadow-lg transition-transform hover:scale-105"
                        >
                            Débloquer les visages
                        </button>
                    </div>
                )}

                <div className="grid grid-cols-2 gap-3">
                    {pendingLikes.map((profile) => (
                        <div 
                            key={profile.id} 
                            onClick={() => handleProfileClick(profile)}
                            className={clsx(
                                "relative aspect-[3/4] rounded-xl overflow-hidden bg-gray-800 cursor-pointer group transition-all",
                                profile.hasSuperLikedUser 
                                    ? "border-2 border-blue-400 shadow-[0_0_20px_rgba(96,165,250,0.5)] scale-[1.02]" 
                                    : "border border-white/5"
                            )}
                        >
                            <img 
                                src={profile.imageUrl} 
                                className={`w-full h-full object-cover transition-all duration-500 ${!user.isPremium ? 'blur-xl scale-110 opacity-60' : 'blur-0 group-hover:scale-105'}`}
                            />
                            
                            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent"></div>

                            {/* Super Like Badge */}
                            {profile.hasSuperLikedUser && (
                                <div className="absolute top-2 right-2 bg-blue-500/90 backdrop-blur border border-blue-400 p-1.5 rounded-full shadow-[0_0_15px_rgba(59,130,246,0.6)] animate-pulse z-10">
                                    <Zap size={12} className="text-white" fill="currentColor" />
                                </div>
                            )}

                            <div className="absolute bottom-0 left-0 right-0 p-3">
                                {user.isPremium ? (
                                    <>
                                        <div className="font-bold text-white text-sm flex items-center gap-1">
                                            {profile.name}, {profile.age}
                                        </div>
                                        <div className="text-[10px] text-aura-accent font-bold">
                                            {profile.compatibilityScore}% Compatible
                                        </div>
                                    </>
                                ) : (
                                    <div className="flex flex-col items-center justify-center h-full mb-4">
                                        <Lock size={20} className="text-white/50 mb-1" />
                                        <span className="text-[10px] font-bold text-yellow-500 uppercase tracking-wider">Gold</span>
                                    </div>
                                )}
                            </div>
                        </div>
                    ))}
                </div>
             </>
         )}
      </div>
    </div>
  );
};

export default LikesReceivedView;
