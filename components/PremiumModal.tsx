import React, { useState } from 'react';
import { X, Check, Crown, Eye, Ghost, Activity, Loader2 } from 'lucide-react';
import { playClick, playMatchSuccess } from '../services/audioService';
import { upgradeToPremium, getCurrentUserId } from '../services/dataService';

interface PremiumModalProps {
  onClose: () => void;
  onUpgradeSuccess?: () => void;
}

const PremiumModal: React.FC<PremiumModalProps> = ({ onClose, onUpgradeSuccess }) => {
  const [loading, setLoading] = useState(false);
  
  const handleClose = () => {
    playClick();
    onClose();
  };

  const handleSelect = async () => {
      playClick(900);
      setLoading(true);
      
      const userId = getCurrentUserId();
      if (userId) {
          const success = await upgradeToPremium(userId);
          if (success) {
              playMatchSuccess();
              if (onUpgradeSuccess) onUpgradeSuccess();
              onClose();
          } else {
              alert("Une erreur est survenue lors du paiement.");
              setLoading(false);
          }
      } else {
          setLoading(false);
      }
  }

  return (
    <div className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center p-4 animate-fade-in">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/90 backdrop-blur-md" onClick={handleClose}></div>
      
      <div className="relative w-full max-w-md bg-gradient-to-b from-[#2a1f3d] to-[#0f0c29] rounded-3xl border border-yellow-500/30 shadow-[0_0_50px_rgba(234,179,8,0.15)] overflow-hidden animate-slide-up">
        
        {/* Gold Glow Header */}
        <div className="absolute top-0 left-0 right-0 h-40 bg-gradient-to-b from-yellow-500/20 to-transparent pointer-events-none"></div>
        
        <button 
          onClick={handleClose}
          className="absolute top-4 right-4 w-8 h-8 bg-white/10 rounded-full flex items-center justify-center text-gray-400 hover:text-white transition-colors z-20"
        >
          <X size={16} />
        </button>

        <div className="p-8 flex flex-col items-center relative z-10">
           <div className="w-16 h-16 rounded-full bg-gradient-to-br from-yellow-300 to-yellow-600 flex items-center justify-center shadow-lg mb-4 animate-float">
               <Crown size={32} className="text-white" fill="currentColor" />
           </div>
           
           <h2 className="text-3xl font-serif font-bold text-transparent bg-clip-text bg-gradient-to-r from-yellow-200 via-yellow-400 to-yellow-200 mb-2 text-center">
             Aura Gold
           </h2>
           <p className="text-gray-400 text-center text-sm mb-8">
             Débloquez le plein potentiel de votre âme.
           </p>

           <div className="space-y-4 w-full mb-8">
               <FeatureRow icon={<Eye className="text-yellow-400" size={20} />} text="Voir qui vous a liké" />
               <FeatureRow icon={<Activity className="text-aura-accent" size={20} />} text="Rapports de compatibilité détaillés" />
               <FeatureRow icon={<Ghost className="text-blue-400" size={20} />} text="Mode Incognito avancé" />
           </div>

           {/* Pricing Cards */}
           <div className="grid grid-cols-3 gap-3 w-full mb-6">
                <PricingCard duration="1 Mois" price="19€" />
                <PricingCard duration="6 Mois" price="12€/m" isPopular />
                <PricingCard duration="12 Mois" price="9€/m" />
           </div>

           <button 
                onClick={handleSelect}
                disabled={loading}
                className="w-full py-4 bg-gradient-to-r from-yellow-500 to-amber-600 text-white font-bold rounded-xl shadow-lg hover:scale-[1.02] transition-transform active:scale-95 flex items-center justify-center gap-2"
            >
               {loading ? <Loader2 className="animate-spin" /> : "Devenir Membre Gold"}
           </button>
        </div>
      </div>
    </div>
  );
};

const FeatureRow = ({ icon, text }: { icon: React.ReactNode, text: string }) => (
    <div className="flex items-center gap-4 bg-white/5 p-3 rounded-xl border border-white/5">
        {icon}
        <span className="font-medium text-sm">{text}</span>
    </div>
);

const PricingCard = ({ duration, price, isPopular }: { duration: string, price: string, isPopular?: boolean }) => (
    <div className={`relative p-3 rounded-xl border flex flex-col items-center justify-center cursor-pointer transition-all hover:bg-white/10 ${isPopular ? 'bg-yellow-500/20 border-yellow-500/50' : 'bg-white/5 border-white/10'}`}>
        {isPopular && (
            <div className="absolute -top-2 bg-yellow-500 text-[8px] font-bold px-2 py-0.5 rounded-full text-black uppercase">
                Populaire
            </div>
        )}
        <div className="text-xs text-gray-400 font-bold mb-1">{duration}</div>
        <div className="text-lg font-bold text-white">{price}</div>
    </div>
)

export default PremiumModal;