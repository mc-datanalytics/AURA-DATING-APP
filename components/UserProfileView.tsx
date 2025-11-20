
import React, { useState, useMemo } from 'react';
import { UserProfile, NotificationSettings } from '../types';
import { Volume2, VolumeX, Crown, Edit3, LogOut, Shield, Sliders, Trash2, Eye, Bell, Zap, Sparkles, Activity, Wind, ChevronRight, Info, TrendingUp, UserCog, User } from 'lucide-react';
import { playClick } from '../services/audioService';
import { getElementColor } from '../services/auraEngine';
import SecurityHelpModal from './SecurityHelpModal';
import { AreaChart, Area, XAxis, ResponsiveContainer, Tooltip } from 'recharts';
import clsx from 'clsx';

interface UserProfileViewProps {
  user: UserProfile;
  soundEnabled: boolean;
  onToggleSound: () => void;
  onGoPremium: () => void;
  onLogout: () => void;
  onDeleteAccount: () => void;
  onEditProfile: () => void;
  onPreviewProfile: () => void;
  onUpdateNotificationSettings: (settings: NotificationSettings) => void;
  onOpenFilters: () => void;
}

// --- GAMIFICATION LOGIC ---
const getEnergyState = (value: number) => {
    if (value >= 90) return { label: "Cosmique", color: "#fbbf24", icon: <Zap size={14} fill="currentColor" /> }; // Gold
    if (value >= 70) return { label: "Magnétique", color: "#f472b6", icon: <Sparkles size={14} /> }; // Pink
    if (value >= 40) return { label: "Actif", color: "#34d399", icon: <Activity size={14} /> }; // Green
    return { label: "En Repli", color: "#9ca3af", icon: <Wind size={14} /> }; // Gray
};

const UserProfileView: React.FC<UserProfileViewProps> = ({ 
  user, 
  soundEnabled, 
  onToggleSound, 
  onGoPremium,
  onLogout,
  onDeleteAccount,
  onEditProfile,
  onPreviewProfile,
  onUpdateNotificationSettings,
  onOpenFilters
}) => {

  const [confirmAction, setConfirmAction] = useState<'LOGOUT' | 'DELETE' | null>(null);
  const [showNotifSettings, setShowNotifSettings] = useState(false);
  const [showSecurityModal, setShowSecurityModal] = useState(false);

  const settings = user.notificationSettings || {
      matches: true, messages: true, likes: true, dailyAura: true, superLikes: true
  };

  // Aura Data
  const aura = user.aura || { intensity: 50, depth: 50, stability: 50, openness: 50, dominantElement: 'TERRE' };
  const dominantColor = getElementColor(aura.dominantElement || 'TERRE');

  // --- MOCK HISTORICAL DATA FOR UI/UX DEMO ---
  const historyData = useMemo(() => {
      const days = ['Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam', 'Auj'];
      return days.map((day, i) => ({
          day,
          value: Math.min(100, Math.max(20, aura.intensity + (Math.sin(i) * 20) + (Math.random() * 15 - 5)))
      }));
  }, [aura.intensity]);

  // Current State Logic
  const currentValue = historyData[historyData.length - 1].value;
  const currentState = getEnergyState(currentValue);

  const toggleSetting = (key: keyof NotificationSettings) => {
      playClick();
      onUpdateNotificationSettings({ ...settings, [key]: !settings[key] });
  }

  const triggerLogout = () => { playClick(600); setConfirmAction('LOGOUT'); }
  const triggerDelete = () => { playClick(500); setConfirmAction('DELETE'); }
  
  const getElementIcon = (elem: string) => {
      switch(elem) {
          case 'FEU': return <Activity size={24} />; 
          default: return <Sparkles size={24} />;
      }
  }

  const getElementLabel = (elem: string) => {
      switch(elem) {
          case 'FEU': return "Aura de Feu";
          case 'EAU': return "Aura d'Eau";
          case 'TERRE': return "Aura de Terre";
          case 'AIR': return "Aura d'Air";
          default: return "Aura Mystique";
      }
  }

  const getAuraQuote = (elem: string) => {
       switch(elem) {
          case 'FEU': return "Intense. Passionné. Instinctif.";
          case 'EAU': return "Profond. Émotionnel. Intuitif.";
          case 'TERRE': return "Stable. Loyal. Ancré.";
          case 'AIR': return "Libre. Curieux. Changeant.";
          default: return "En pleine formation...";
      }
  }

  return (
    <div className="flex flex-col h-full bg-aura-dark overflow-y-auto custom-scrollbar pb-24 relative">
      
      {showSecurityModal && (
          <SecurityHelpModal onClose={() => setShowSecurityModal(false)} />
      )}

      {/* Confirmation Overlay */}
      {confirmAction && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-black/80 backdrop-blur-sm animate-fade-in">
            <div className="w-full max-w-sm bg-gray-900 border border-white/10 rounded-2xl p-6 shadow-2xl">
                <h3 className="text-xl font-bold text-white mb-2 text-center">
                    {confirmAction === 'DELETE' ? 'Supprimer le compte ?' : 'Se déconnecter ?'}
                </h3>
                <div className="flex gap-3 w-full mt-6">
                    <button onClick={() => setConfirmAction(null)} className="flex-1 py-3 bg-white/5 rounded-xl text-gray-300 font-medium">Annuler</button>
                    <button onClick={() => confirmAction === 'LOGOUT' ? onLogout() : onDeleteAccount()} className="flex-1 py-3 bg-gradient-to-r from-aura-mid to-aura-accent rounded-xl text-white font-bold">Confirmer</button>
                </div>
            </div>
        </div>
      )}

      {/* HERO HEADER : IMMERSIVE AURA */}
      <div className="relative flex flex-col items-center overflow-hidden rounded-b-[3rem] bg-gradient-to-b from-gray-900 to-obsidian border-b border-white/5 pt-[max(env(safe-area-inset-top),2rem)]">
        
        {/* Ambient Background Light */}
        <div className="absolute top-[-50%] left-[-50%] right-[-50%] h-[150%] opacity-30 pointer-events-none transition-colors duration-1000 blur-[100px]" style={{ background: `radial-gradient(circle, ${dominantColor}, transparent 70%)` }}></div>

        {/* Avatar Reactor Core */}
        <div className="relative mb-4 z-10 group mt-4">
            {/* Rotating Ring */}
            <div className="absolute -inset-3 rounded-full opacity-60 border border-dashed animate-spin-slow pointer-events-none" style={{ borderColor: dominantColor }}></div>
            {/* Breathing Glow */}
            <div className="absolute -inset-1 rounded-full blur-md animate-pulse-slow transition-colors duration-1000 opacity-70" style={{ backgroundColor: dominantColor }}></div>
            
            <div className="w-32 h-32 rounded-full p-1 bg-gray-900 relative">
                <img src={user.imageUrl} className="w-full h-full rounded-full object-cover" />
                
                {/* Element Icon Badge */}
                <div className="absolute -bottom-2 -right-2 w-10 h-10 rounded-full bg-gray-900 border-2 border-gray-800 flex items-center justify-center shadow-lg text-white" style={{ backgroundColor: dominantColor }}>
                     {getElementIcon(aura.dominantElement || 'TERRE')}
                </div>
            </div>
        </div>

        <h2 className="text-4xl font-display font-bold text-white mb-1 relative z-10">{user.name}, {user.age}</h2>
        
        {/* Main Aura Label */}
        <div className="flex flex-col items-center relative z-10 mt-2 mb-6">
             <span className="text-lg font-bold bg-clip-text text-transparent bg-gradient-to-r from-white to-white/70 tracking-wide uppercase flex items-center gap-2" style={{ textShadow: `0 0 20px ${dominantColor}` }}>
                {getElementLabel(aura.dominantElement || 'TERRE')}
             </span>
             <p className="text-xs text-gray-400 font-serif italic mt-1 opacity-80">"{getAuraQuote(aura.dominantElement || 'TERRE')}"</p>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-4 gap-4 w-full max-w-xs px-4 mb-8 z-10">
             <AuraStat label="Intensité" value={aura.intensity} color={dominantColor} delay={0} />
             <AuraStat label="Profondeur" value={aura.depth} color={dominantColor} delay={100} />
             <AuraStat label="Stabilité" value={aura.stability} color={dominantColor} delay={200} />
             <AuraStat label="Ouverture" value={aura.openness} color={dominantColor} delay={300} />
        </div>

      </div>

      {/* SECTION: CENTRE DE CONTRÔLE (PROFILE ACTIONS) - ENCAPSULÉ */}
      <div className="px-4 mt-6 relative z-20">
           <div className="glass-panel rounded-3xl p-5 border border-white/10 bg-gray-900/60">
               <h3 className="text-xs font-bold text-gray-300 uppercase tracking-widest flex items-center gap-2 mb-4">
                   <User size={14} className="text-aura-accent"/> Mon Profil
               </h3>
               <div className="grid grid-cols-2 gap-3">
                   <button 
                       onClick={onEditProfile}
                       className="bg-white/5 border border-white/10 rounded-2xl p-4 flex flex-col items-center justify-center gap-2 hover:bg-white/10 transition-colors active:scale-95 group"
                   >
                       <div className="p-2 rounded-full bg-white/5 text-white group-hover:bg-aura-accent group-hover:text-white transition-colors">
                            <UserCog size={20} />
                       </div>
                       <span className="text-xs font-bold text-gray-200 uppercase tracking-wider">Modifier</span>
                   </button>

                   <button 
                       onClick={onPreviewProfile}
                       className="bg-white/5 border border-white/10 rounded-2xl p-4 flex flex-col items-center justify-center gap-2 hover:bg-white/10 transition-colors active:scale-95 group"
                   >
                       <div className="p-2 rounded-full bg-white/5 text-gray-400 group-hover:bg-white group-hover:text-black transition-colors">
                            <Eye size={20} />
                       </div>
                       <span className="text-xs font-bold text-gray-200 uppercase tracking-wider">Aperçu</span>
                   </button>
               </div>
           </div>
      </div>

      {/* SECTION: CHRONIQUES DE L'AURA (EVOLUTION GRAPH) */}
      <div className="px-4 mt-4 relative z-20">
          <div className="glass-panel rounded-3xl p-5 border border-white/10 shadow-[0_10px_40px_-10px_rgba(0,0,0,0.5)] backdrop-blur-xl bg-gray-900/80">
               
               {/* Header Simplifié et Informatif */}
               <div className="flex items-center justify-between mb-6">
                   <div>
                       <h3 className="text-xs font-bold text-gray-300 uppercase tracking-widest flex items-center gap-2">
                           <Activity className="text-aura-accent" size={14} /> Bio-Rythme
                       </h3>
                       <p className="text-[10px] text-gray-500 mt-1">Vos 7 derniers jours</p>
                   </div>
                   
                   {/* État Actuel mis en avant */}
                   <div className="flex flex-col items-end">
                       <div className="flex items-center gap-1.5 text-sm font-bold text-white">
                            <span style={{ color: currentState.color }}>{currentState.icon}</span>
                            {currentState.label}
                       </div>
                       <div className="text-[10px]" style={{ color: currentState.color }}>
                           {Math.round(currentValue)}% Énergie Auj.
                       </div>
                   </div>
               </div>

               {/* Graphique - Purement Visuel pour Mobile */}
               <div className="h-32 w-full relative">
                   <ResponsiveContainer width="100%" height="100%">
                       <AreaChart data={historyData} margin={{ top: 5, right: 0, left: 0, bottom: 0 }}>
                           <defs>
                               <linearGradient id="colorAura" x1="0" y1="0" x2="0" y2="1">
                                   <stop offset="5%" stopColor={dominantColor} stopOpacity={0.4}/>
                                   <stop offset="95%" stopColor={dominantColor} stopOpacity={0}/>
                               </linearGradient>
                           </defs>
                           <XAxis 
                                dataKey="day" 
                                axisLine={false} 
                                tickLine={false} 
                                tick={{ fill: '#4b5563', fontSize: 9, fontWeight: 500 }} 
                                dy={5}
                                interval="preserveStartEnd"
                           />
                           <Area 
                                type="monotone" 
                                dataKey="value" 
                                stroke={dominantColor} 
                                strokeWidth={3}
                                fillOpacity={1} 
                                fill="url(#colorAura)" 
                                animationDuration={1500}
                                isAnimationActive={true}
                           />
                       </AreaChart>
                   </ResponsiveContainer>
               </div>
               
               {/* Smart Insight Footer */}
               <div className="mt-4 pt-4 border-t border-white/5 flex items-start gap-3">
                   <div className="p-1.5 rounded-full bg-white/5 mt-0.5 text-yellow-400">
                       <Info size={12} />
                   </div>
                   <p className="text-xs text-gray-400 leading-relaxed">
                       <strong className="text-white">Insight :</strong> Vos interactions récentes attirent particulièrement les profils <span className="text-white font-bold">Feu</span> et <span className="text-white font-bold">Air</span>. Continuez d'interagir pour stabiliser votre aura.
                   </p>
               </div>
          </div>
      </div>

      {/* SECTION: SETTINGS & ACTIONS */}
      <div className="px-4 mt-6 space-y-4">
          
          {/* Gold Card */}
          <button onClick={onGoPremium} className="w-full py-4 bg-gradient-to-br from-yellow-500/10 to-amber-500/10 hover:from-yellow-500/20 hover:to-amber-500/20 rounded-2xl flex items-center justify-between px-6 border border-yellow-500/20 transition-all active:scale-[0.98] group relative overflow-hidden">
              <div className="flex items-center gap-4 relative z-10">
                 <div className="w-10 h-10 rounded-full bg-yellow-500/20 flex items-center justify-center">
                     <Crown size={20} className="text-yellow-400 group-hover:scale-110 transition-transform" />
                 </div>
                 <div className="text-left">
                     <h3 className="text-sm font-bold text-yellow-100">Aura Gold</h3>
                     <p className="text-[10px] text-yellow-200/60">Boostez votre visibilité</p>
                 </div>
              </div>
              <ChevronRight className="text-yellow-500/50" size={20} />
              <div className="absolute top-0 right-0 w-20 h-full bg-gradient-to-l from-yellow-500/10 to-transparent"></div>
          </button>

          {/* Settings List */}
          <div className="bg-white/5 rounded-3xl overflow-hidden backdrop-blur-sm border border-white/5">
              <SettingItem 
                icon={<Sliders size={20} className="text-aura-accent" />}
                label="Préférences de rencontre"
                subLabel={`${user.discoverySettings?.minAge || 18}-${user.discoverySettings?.maxAge || 50} ans • ${user.discoverySettings?.distance || 100}km`}
                onClick={() => { playClick(); onOpenFilters(); }}
                hasArrow
              />
              
              <div className="h-[1px] bg-white/5 ml-16"></div>

              <SettingItem 
                icon={<Bell size={20} className="text-blue-400" />}
                label="Notifications"
                onClick={() => { playClick(); setShowNotifSettings(!showNotifSettings); }}
                rightElement={
                    <div className={`transition-transform duration-300 ${showNotifSettings ? 'rotate-90' : ''}`}>
                        <ChevronRight size={16} className="text-gray-500" />
                    </div>
                }
              />
              
              {showNotifSettings && (
                  <div className="bg-black/20 pl-4 py-2 space-y-1 animate-slide-down border-t border-white/5">
                      <NotifToggle label="Nouveaux Matchs" enabled={settings.matches} onToggle={() => toggleSetting('matches')} />
                      <NotifToggle label="Messages" enabled={settings.messages} onToggle={() => toggleSetting('messages')} />
                  </div>
              )}

              <div className="h-[1px] bg-white/5 ml-16"></div>

              <SettingItem 
                icon={soundEnabled ? <Volume2 size={20} className="text-green-400" /> : <VolumeX size={20} className="text-gray-400" />}
                label="Sons & Ambiance"
                onClick={onToggleSound}
                rightElement={<ToggleSwitch enabled={soundEnabled} />}
              />
              
              <div className="h-[1px] bg-white/5 ml-16"></div>

              <SettingItem 
                icon={<Shield size={20} className="text-gray-400" />}
                label="Sécurité & Aide"
                onClick={() => { playClick(); setShowSecurityModal(true); }}
                hasArrow
              />
          </div>

          {/* Danger Zone */}
          <div className="mt-6 space-y-2 px-2 pb-6">
              <button onClick={triggerLogout} className="w-full py-3 text-sm text-gray-400 font-medium hover:text-white transition-colors rounded-xl hover:bg-white/5 flex items-center justify-center gap-2">
                  <LogOut size={16} /> Se déconnecter
              </button>
              <button onClick={triggerDelete} className="w-full py-3 text-xs text-red-500/70 font-bold uppercase tracking-wider hover:text-red-500 transition-colors rounded-xl hover:bg-red-500/10 flex items-center justify-center gap-2">
                  <Trash2 size={14} /> Supprimer mon compte
              </button>
          </div>

          <div className="text-center pb-8">
              <Sparkles className="w-4 h-4 text-white/10 mx-auto mb-2" />
              <p className="text-[10px] text-white/20 font-serif italic">Aura v2.3 • Karmic Engine Active</p>
          </div>
      </div>
    </div>
  );
};

// Mini Component for Stats
const AuraStat = ({ label, value, color, delay }: { label: string, value: number, color: string, delay: number }) => (
    <div className="flex flex-col items-center animate-fade-in" style={{ animationDelay: `${delay}ms` }}>
        <div className="relative w-full h-1 bg-gray-800 rounded-full mb-2 overflow-hidden">
            <div className="h-full rounded-full transition-all duration-1000 ease-out" style={{ width: `${value}%`, backgroundColor: color }}></div>
        </div>
        <span className="text-lg font-bold text-white leading-none">{value}%</span>
        <span className="text-[10px] text-gray-500 uppercase mt-1">{label}</span>
    </div>
);

const SettingItem = ({ icon, label, subLabel, rightElement, hasArrow, onClick }: any) => (
    <div onClick={onClick} className="flex items-center justify-between p-5 hover:bg-white/5 transition-colors cursor-pointer active:bg-white/10 group">
        <div className="flex items-center gap-4">
            <div className="opacity-80 group-hover:opacity-100 transition-opacity">{icon}</div>
            <div>
                <div className="text-sm font-medium text-gray-100">{label}</div>
                {subLabel && <div className="text-xs text-gray-500 mt-0.5">{subLabel}</div>}
            </div>
        </div>
        {rightElement || (hasArrow && <ChevronRight size={16} className="text-gray-600 group-hover:text-white transition-colors" />)}
    </div>
);

const ToggleSwitch = ({ enabled }: { enabled: boolean }) => (
    <div className={`w-11 h-6 rounded-full p-0.5 transition-colors duration-300 ${enabled ? 'bg-green-500' : 'bg-gray-600'}`}>
        <div className={`w-5 h-5 rounded-full bg-white shadow-sm transition-transform duration-300 ${enabled ? 'translate-x-5' : 'translate-x-0'}`}></div>
    </div>
);

const NotifToggle = ({ label, enabled, onToggle }: any) => (
    <div onClick={(e) => { e.stopPropagation(); onToggle(); }} className="flex items-center justify-between p-3 pr-5 hover:bg-white/5 rounded-lg cursor-pointer">
        <span className="text-xs text-gray-400 ml-10">{label}</span>
        <ToggleSwitch enabled={enabled} />
    </div>
);

export default UserProfileView;
