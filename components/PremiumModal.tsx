
import React, { useState, useEffect } from 'react';
import { X, Check, Crown, Heart, Loader2, Star, Zap, Shield, Infinity, Eye, Ghost, Sliders, Sparkles, FileText, Dices } from 'lucide-react';
import { playClick, playMatchSuccess, playSuperLike } from '../services/audioService';
import { upgradeToPremium, getCurrentUserId, getPendingLikes, getMyProfile } from '../services/dataService';
import { SubscriptionTier } from '../types';
import clsx from 'clsx';
import { useToast } from './Toast';

interface PremiumModalProps {
  onClose: () => void;
  onUpgradeSuccess?: () => void;
}

type PlanType = 'SILVER' | 'GOLD' | 'INFINITY';

// --- CONFIGURATION DES PRIX & FEATURES ---
const PLANS = {
    SILVER: {
        title: "Silver",
        baseColor: "text-gray-500 dark:text-gray-200",
        gradient: "from-gray-300 to-slate-400",
        btnGradient: "from-gray-600 to-gray-500",
        icon: Sparkles,
        features: [
            { text: "Likes illimités", icon: Infinity },
            { text: "5 Super Likes / semaine", icon: Zap },
            { text: "3 Rapports de Compatibilité", icon: FileText }, // Feature ajoutée
            { text: "10 Relances Ice-Breaker", icon: Dices } // Feature ajoutée
        ],
        prices: [
            { id: 'silver_1w', duration: '1 Semaine', total: 4.99, perWeek: 4.99, save: null },
            { id: 'silver_1m', duration: '1 Mois', total: 12.99, perWeek: 3.25, save: '-35%', badge: 'START' },
            { id: 'silver_12m', duration: '12 Mois', total: 49.99, perWeek: 1.04, save: '-80%', badge: 'ECO' }
        ]
    },
    GOLD: {
        title: "Gold",
        baseColor: "text-yellow-600 dark:text-yellow-400",
        gradient: "from-yellow-400 to-amber-600",
        btnGradient: "from-yellow-500 to-amber-600",
        icon: Crown,
        features: [
            { text: "Tout ce qu'il y a dans Silver", icon: Check },
            { text: "Voir qui vous like (Unblur)", icon: Eye },
            { text: "Retour en arrière illimité", icon: Infinity },
            { text: "1 Boost mensuel gratuit", icon: Zap },
            { text: "10 Rapports de Compatibilité", icon: FileText }
        ],
        prices: [
            { id: 'gold_1w', duration: '1 Semaine', total: 9.99, perWeek: 9.99, save: null },
            { id: 'gold_1m', duration: '1 Mois', total: 29.99, perWeek: 7.50, save: '-25%', badge: 'POPULAIRE' },
            { id: 'gold_12m', duration: '12 Mois', total: 89.99, perWeek: 1.87, save: '-80%', badge: 'SMART' }
        ]
    },
    INFINITY: {
        title: "Infinity",
        baseColor: "text-fuchsia-600 dark:text-fuchsia-400",
        gradient: "from-fuchsia-500 to-purple-600",
        btnGradient: "from-fuchsia-600 to-purple-700",
        icon: Infinity,
        features: [
            { text: "Tout ce qu'il y a dans Gold", icon: Check },
            { text: "Mode Incognito (Invisible)", icon: Ghost },
            { text: "Priorité absolue (Messages)", icon: Star },
            { text: "Rapports & Boosts Illimités", icon: Zap }, // Feature ajoutée
            { text: "Mise en avant du profil (x5)", icon: Crown } // Feature ajoutée
        ],
        prices: [
            { id: 'inf_1w', duration: '1 Semaine', total: 19.99, perWeek: 19.99, save: null },
            { id: 'inf_1m', duration: '1 Mois', total: 59.99, perWeek: 14.99, save: '-25%', badge: 'ELITE' },
            { id: 'inf_12m', duration: '12 Mois', total: 149.99, perWeek: 3.12, save: '-85%', badge: 'BEST' }
        ]
    }
};

const PremiumModal: React.FC<PremiumModalProps> = ({ onClose, onUpgradeSuccess }) => {
  const { showToast } = useToast();
  const [planType, setPlanType] = useState<PlanType>('GOLD'); 
  const [selectedDurationIndex, setSelectedDurationIndex] = useState(1); // 1 Mois par défaut
  const [loading, setLoading] = useState(false);
  
  // Real Data State
  const [realLikers, setRealLikers] = useState<string[]>([]);
  const [likesCount, setLikesCount] = useState(0);
  const [loadingData, setLoadingData] = useState(true);

  useEffect(() => {
      const loadRealData = async () => {
          const profile = await getMyProfile();
          if (profile) {
              const likes = await getPendingLikes(profile);
              setLikesCount(likes.length);
              // Get up to 3 real images to blur
              setRealLikers(likes.slice(0, 3).map(p => p.imageUrl));
          }
          setLoadingData(false);
      };
      loadRealData();
  }, []);

  const handlePlanTypeChange = (type: PlanType) => {
      playClick(900);
      setPlanType(type);
  };

  const handleDurationSelect = (index: number) => {
      playClick(800);
      setSelectedDurationIndex(index);
  }

  const handlePurchase = async () => {
      playSuperLike();
      setLoading(true);
      
      const userId = getCurrentUserId();
      let tier = SubscriptionTier.GOLD;
      if (planType === 'SILVER') tier = SubscriptionTier.SILVER;
      if (planType === 'INFINITY') tier = SubscriptionTier.INFINITY;

      // Récupération de la durée en jours pour le backend
      const durationId = PLANS[planType].prices[selectedDurationIndex].id;
      let days = 30;
      if (durationId.includes('1w')) days = 7;
      if (durationId.includes('12m')) days = 365;

      if (userId) {
          setTimeout(async () => {
            // Appel au service qui déclenche la RPC Supabase
            const success = await upgradeToPremium(userId, tier, days);
            if (success) {
                playMatchSuccess();
                if (onUpgradeSuccess) onUpgradeSuccess();
                onClose();
            } else {
                showToast("Erreur lors de l'activation.", "error");
                setLoading(false);
            }
          }, 1500);
      } else {
          setLoading(false);
      }
  }

  const currentPlan = PLANS[planType];
  const selectedPrice = currentPlan.prices[selectedDurationIndex];

  return (
    <div className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center p-0 sm:p-4">
      
      <div className="absolute inset-0 bg-black/90 backdrop-blur-md animate-fade-in" onClick={() => { playClick(); onClose(); }}></div>
      
      <div className="relative w-full max-w-md bg-white dark:bg-[#0F0F11] sm:rounded-[2.5rem] rounded-t-[2.5rem] border border-gray-200 dark:border-white/5 shadow-2xl flex flex-col overflow-hidden animate-slide-up max-h-[95vh] transition-colors duration-300">
        
        {/* Close Button */}
        <button 
          onClick={onClose}
          className="absolute top-5 right-5 p-2 bg-gray-100 dark:bg-black/20 backdrop-blur rounded-full text-gray-500 dark:text-gray-400 hover:text-black dark:hover:text-white z-50 transition-colors border border-gray-200 dark:border-white/5"
        >
          <X size={20} />
        </button>

        {/* --- HERO SECTION (Social Proof) --- */}
        <div className="pt-8 pb-2 px-6 text-center relative overflow-hidden">
            {/* Ambient Glow */}
            <div 
                className={clsx(
                    "absolute top-0 left-1/2 -translate-x-1/2 w-full h-64 opacity-10 dark:opacity-20 blur-[80px] pointer-events-none transition-colors duration-700",
                    planType === 'SILVER' ? "bg-gray-400" : planType === 'GOLD' ? "bg-yellow-500" : "bg-fuchsia-500"
                )}
            ></div>

            <div className="relative z-10 mb-3 h-12 flex items-center justify-center">
                {loadingData ? (
                     <Loader2 className="animate-spin text-gray-500" />
                ) : likesCount > 0 ? (
                    <div className="flex justify-center -space-x-3 items-center animate-fade-in">
                        {realLikers.map((url, i) => (
                            <div key={i} className="w-10 h-10 rounded-full border-2 border-white dark:border-[#0F0F11] overflow-hidden relative shadow-lg">
                                <img src={url} className="w-full h-full object-cover blur-[4px] scale-110" />
                                <div className="absolute inset-0 bg-black/10"></div>
                            </div>
                        ))}
                        <div className="px-3 py-1 rounded-full bg-white/80 dark:bg-white/10 border border-gray-200 dark:border-white/10 text-xs font-bold text-gray-900 dark:text-white shadow-lg ml-2 backdrop-blur-md">
                            {likesCount} personnes vous ont liké
                        </div>
                    </div>
                ) : (
                     <div className="flex flex-col items-center">
                         <currentPlan.icon size={32} className={clsx("mb-2 animate-pulse-slow", currentPlan.baseColor)} />
                         <span className="text-xs font-bold text-gray-400 uppercase tracking-widest">Niveau Supérieur</span>
                     </div>
                )}
            </div>
        </div>

        {/* --- PLAN TOGGLE (Switcher) --- */}
        <div className="px-6 mb-6">
            <div className="w-full p-1 bg-gray-100 dark:bg-white/5 rounded-2xl flex relative border border-gray-200 dark:border-white/5 h-12">
                {/* Animated Background */}
                <div 
                    className={clsx(
                        "absolute top-1 bottom-1 w-[calc(33.33%-4px)] rounded-xl shadow-lg transition-all duration-300 ease-out bg-gradient-to-r",
                        currentPlan.gradient
                    )}
                    style={{ 
                        left: planType === 'SILVER' ? '4px' : planType === 'GOLD' ? '33.33%' : 'calc(66.66% - 1px)',
                        transform: planType === 'GOLD' ? 'translateX(2px)' : 'none'
                    }}
                ></div>

                <button 
                    onClick={() => handlePlanTypeChange('SILVER')}
                    className={clsx("flex-1 rounded-xl text-xs font-bold uppercase tracking-wider z-10 transition-colors", planType === 'SILVER' ? "text-white dark:text-black" : "text-gray-500 hover:text-gray-800 dark:hover:text-gray-300")}
                >
                    Silver
                </button>
                <button 
                    onClick={() => handlePlanTypeChange('GOLD')}
                    className={clsx("flex-1 rounded-xl text-xs font-bold uppercase tracking-wider z-10 transition-colors", planType === 'GOLD' ? "text-black" : "text-gray-500 hover:text-gray-800 dark:hover:text-gray-300")}
                >
                    Gold
                </button>
                <button 
                    onClick={() => handlePlanTypeChange('INFINITY')}
                    className={clsx("flex-1 rounded-xl text-xs font-bold uppercase tracking-wider z-10 transition-colors", planType === 'INFINITY' ? "text-white" : "text-gray-500 hover:text-gray-800 dark:hover:text-gray-300")}
                >
                    Infinity
                </button>
            </div>
        </div>

        {/* --- FEATURES LIST --- */}
        <div className="px-8 mb-6 min-h-[140px]">
             <h3 className={clsx("text-center font-display font-bold text-2xl mb-4 transition-colors", currentPlan.baseColor)}>
                 Aura {currentPlan.title}
             </h3>
             <div className="space-y-2.5">
                {currentPlan.features.map((feat, i) => (
                    <div key={i} className="flex items-center gap-3 animate-fade-in" style={{ animationDelay: `${i * 50}ms` }}>
                        <div className={clsx("w-5 h-5 rounded-full flex items-center justify-center shadow-sm shrink-0 bg-gradient-to-br", currentPlan.gradient)}>
                            <feat.icon size={10} className={planType === 'INFINITY' ? "text-white" : "text-black/70"} strokeWidth={3} />
                        </div>
                        <span className="text-sm font-medium text-gray-700 dark:text-gray-300">{feat.text}</span>
                    </div>
                ))}
             </div>
        </div>

        {/* --- DURATION CARDS (Horizontal) --- */}
        <div className="flex-1 px-4 pb-4 flex flex-col justify-end">
            <div className="grid grid-cols-3 gap-3 mb-4">
                {currentPlan.prices.map((price, idx) => {
                    const isSelected = selectedDurationIndex === idx;
                    return (
                        <button 
                            key={price.id}
                            onClick={() => handleDurationSelect(idx)}
                            className={clsx(
                                "relative flex flex-col items-center justify-center py-4 px-1 rounded-2xl border transition-all duration-300",
                                isSelected ? "bg-gray-50 dark:bg-white/10 border-gray-300 dark:border-white/20 shadow-glass transform scale-105" : "bg-gray-50 dark:bg-white/5 border-transparent opacity-60 hover:opacity-100"
                            )}
                        >
                            {price.badge && (
                                <div className={clsx(
                                    "absolute -top-2.5 px-2 py-0.5 rounded text-[8px] font-black uppercase tracking-wider shadow-md z-20",
                                    isSelected ? `bg-gradient-to-r ${currentPlan.gradient} text-black` : "bg-gray-300 dark:bg-gray-700 text-gray-600 dark:text-gray-400"
                                )}>
                                    {price.badge}
                                </div>
                            )}
                            
                            <span className="text-[10px] font-bold text-gray-500 dark:text-gray-400 uppercase mb-1">{price.duration}</span>
                            <div className="flex items-baseline gap-0.5">
                                <span className="text-lg font-display font-bold text-gray-900 dark:text-white">{price.perWeek.toFixed(2)}€</span>
                            </div>
                            <span className="text-[9px] text-gray-500">/ semaine</span>
                        </button>
                    );
                })}
            </div>

            {/* --- CTA --- */}
            <button 
                onClick={handlePurchase}
                disabled={loading}
                className={clsx(
                    "w-full py-4 rounded-2xl font-display font-bold text-lg text-white shadow-lg transition-all transform hover:scale-[1.02] active:scale-95 flex items-center justify-center gap-2 relative overflow-hidden group",
                    `bg-gradient-to-r ${currentPlan.btnGradient}`
                )}
            >
                {loading ? (
                    <Loader2 className="animate-spin" />
                ) : (
                    <>
                        CONTINUER <span className="opacity-80 text-sm font-normal">({selectedPrice.total}€)</span>
                    </>
                )}
            </button>
            
            <p className="mt-3 text-[9px] text-center text-gray-500 dark:text-gray-600">
                Paiement unique. Renouvellement auto. Annulation facile.
            </p>
        </div>

      </div>
    </div>
  );
};

export default PremiumModal;
