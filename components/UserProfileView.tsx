
import React, { useState, useMemo } from 'react';
import { UserProfile, NotificationSettings } from '../types';
import { Volume2, VolumeX, Crown, LogOut, Shield, Sliders, Trash2, Eye, Bell, Zap, Sparkles, Activity, Wind, ChevronRight, Info, UserCog, User, Moon, Sun } from 'lucide-react';
import { playClick } from '../services/audioService';
import { getElementColor } from '../services/auraEngine';
import SecurityHelpModal from './SecurityHelpModal';
import { AreaChart, Area, XAxis, ResponsiveContainer } from 'recharts';

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
  isDarkMode: boolean;
  onToggleTheme: () => void;
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
  onOpenFilters,
  isDarkMode,
  onToggleTheme
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

  return (
    <div className="flex flex-col h-full bg-white dark:bg-obsidian overflow-y-auto custom-scrollbar pb-24 relative transition-colors duration-300">
      
      {showSecurityModal && (
          <SecurityHelpModal onClose={() => setShowSecurityModal(false)} />
      )}

      {/* Confirmation Overlay */}
      {confirmAction && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-black/80 backdrop-blur-sm animate-fade-in">
            <div className="w-full max-w-sm bg-white dark:bg-gray-900 border border-gray-200 dark:border-white/10 rounded-2xl p-6 shadow-2xl">
                <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2 text-center">
                    {confirmAction === 'DELETE' ? 'Supprimer le compte ?' : 'Se déconnecter ?'}
                </h3>
                <div className="flex gap-3 w-full mt-6">
                    <button onClick={() => setConfirmAction(null)} className="flex-1 py-3 bg-gray-100 dark:bg-white/5 rounded-xl text-gray-600 dark:text-gray-300 font-medium hover:bg-gray-200 dark:hover:bg-white/10 transition-colors">Annuler</button>
                    <button onClick={() => confirmAction === 'LOGOUT' ? onLogout() : onDeleteAccount()} className="flex-1 py-3 bg-gradient-to-r from-brand-mid to-brand-end rounded-xl text-white font-bold hover:opacity-90 transition-opacity">Confirmer</button>
                </div>
            </div>
        </div>
      )}

      {/* SIMPLE HEADER */}
      <div className="relative flex flex-col items-center pt-[max(env(safe-area-inset-top),2rem)] pb-6">
        <div className="w-24 h-24 rounded-full p-1 bg-gradient-to-br from-gray-200 to-gray-300 dark:from-gray-800 dark:to-black relative mb-4 border border-white dark:border-white/10 shadow-lg">
             <img src={user.imageUrl} className="w-full h-full rounded-full object-cover" />
             <div className="absolute -bottom-1 -right-1 w-8 h-8 rounded-full bg-white dark:bg-gray-900 border border-gray-200 dark:border-white/10 flex items-center justify-center text-white shadow-md" style={{ backgroundColor: dominantColor }}>
                 {getElementIcon(aura.dominantElement || 'TERRE')}
             </div>
        </div>
        <h2 className="text-3xl font-display font-bold text-gray-900 dark:text-white mb-1">{user.name}, {user.age}</h2>
        <p className="text-sm text-gray-500 dark:text-gray-400">{user.mbti} • {user.attachment}</p>
      </div>

      {/* SECTION: CADRE MON PROFIL */}
      <div className="px-4 mb-6">
           <div className="glass-panel rounded-3xl p-5 border border-gray-200 dark:border-white/10 bg-white/80 dark:bg-gray-900/50">
               <div className="flex items-center gap-2 mb-4 text-gray-400 uppercase text-xs font-bold tracking-wider">
                    <User size={14} /> Mon Profil
               </div>
               <div className="grid grid-cols-2 gap-3">
                   <button 
                       onClick={onEditProfile}
                       className="bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-white/10 rounded-2xl p-4 flex flex-col items-center justify-center gap-2 hover:bg-gray-100 dark:hover:bg-white/10 transition-colors active:scale-95 group"
                   >
                       <div className="p-2 rounded-full bg-white dark:bg-white/5 text-gray-800 dark:text-white shadow-sm group-hover:bg-brand-end group-hover:text-white transition-colors">
                            <UserCog size={20} />
                       </div>
                       <span className="text-xs font-bold text-gray-600 dark:text-gray-200 uppercase tracking-wider">Modifier</span>
                   </button>

                   <button 
                       onClick={onPreviewProfile}
                       className="bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-white/10 rounded-2xl p-4 flex flex-col items-center justify-center gap-2 hover:bg-gray-100 dark:hover:bg-white/10 transition-colors active:scale-95 group"
                   >
                       <div className="p-2 rounded-full bg-white dark:bg-white/5 text-gray-400 group-hover:bg-white group-hover:text-black transition-colors shadow-sm">
                            <Eye size={20} />
                       </div>
                       <span className="text-xs font-bold text-gray-600 dark:text-gray-200 uppercase tracking-wider">Aperçu</span>
                   </button>
               </div>
           </div>
      </div>

      {/* SECTION: CHRONIQUES DE L'AURA (EVOLUTION GRAPH) */}
      <div className="px-4 mt-0 relative z-20">
          <div className="glass-panel rounded-3xl p-5 border border-gray-200 dark:border-white/10 shadow-lg dark:shadow-[0_10px_40px_-10px_rgba(0,0,0,0.5)] backdrop-blur-xl bg-white/90 dark:bg-gray-900/80">
               
               <div className="flex items-center justify-between mb-6">
                   <div>
                       <h3 className="text-xs font-bold text-gray-400 dark:text-gray-300 uppercase tracking-widest flex items-center gap-2">
                           <Activity className="text-brand-end" size={14} /> Bio-Rythme
                       </h3>
                       <p className="text-[10px] text-gray-500 mt-1">Vos 7 derniers jours</p>
                   </div>
                   
                   <div className="flex flex-col items-end">
                       <div className="flex items-center gap-1.5 text-sm font-bold text-gray-900 dark:text-white">
                            <span style={{ color: currentState.color }}>{currentState.icon}</span>
                            {currentState.label}
                       </div>
                       <div className="text-[10px]" style={{ color: currentState.color }}>
                           {Math.round(currentValue)}% Énergie Auj.
                       </div>
                   </div>
               </div>

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
                                tick={{ fill: isDarkMode ? '#9ca3af' : '#6b7280', fontSize: 9, fontWeight: 500 }} 
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
               
               <div className="mt-4 pt-4 border-t border-gray-100 dark:border-white/5 flex items-start gap-3">
                   <div className="p-1.5 rounded-full bg-yellow-50 dark:bg-white/5 mt-0.5 text-yellow-600 dark:text-yellow-400">
                       <Info size={12} />
                   </div>
                   <p className="text-xs text-gray-600 dark:text-gray-400 leading-relaxed">
                       <strong className="text-gray-900 dark:text-white">Insight :</strong> Vos interactions récentes attirent particulièrement les profils <span className="text-gray-900 dark:text-white font-bold">Feu</span> et <span className="text-gray-900 dark:text-white font-bold">Air</span>. Continuez d'interagir pour stabiliser votre aura.
                   </p>
               </div>
          </div>
      </div>

      {/* SECTION: SETTINGS & ACTIONS */}
      <div className="px-4 mt-6 space-y-4">
          
          {/* Gold Card */}
          <button onClick={onGoPremium} className="w-full py-4 bg-gradient-to-br from-yellow-100 to-amber-100 dark:from-yellow-500/10 dark:to-amber-500/10 hover:from-yellow-200 hover:to-amber-200 dark:hover:from-yellow-500/20 dark:hover:to-amber-500/20 rounded-2xl flex items-center justify-between px-6 border border-yellow-500/20 transition-all active:scale-[0.98] group relative overflow-hidden shadow-sm">
              <div className="flex items-center gap-4 relative z-10">
                 <div className="w-10 h-10 rounded-full bg-yellow-500/20 flex items-center justify-center">
                     <Crown size={20} className="text-yellow-700 dark:text-yellow-400 group-hover:scale-110 transition-transform" />
                 </div>
                 <div className="text-left">
                     <h3 className="text-sm font-bold text-yellow-800 dark:text-yellow-100">Aura Gold</h3>
                     <p className="text-[10px] text-yellow-700/60 dark:text-yellow-200/60">Boostez votre visibilité</p>
                 </div>
              </div>
              <ChevronRight className="text-yellow-600/50 dark:text-yellow-500/50" size={20} />
              <div className="absolute top-0 right-0 w-20 h-full bg-gradient-to-l from-yellow-500/10 to-transparent"></div>
          </button>

          {/* Settings List */}
          <div className="bg-white dark:bg-white/5 rounded-3xl overflow-hidden backdrop-blur-sm border border-gray-200 dark:border-white/5 shadow-sm dark:shadow-none">
              <SettingItem 
                icon={<Sliders size={20} className="text-brand-end" />}
                label="Préférences de rencontre"
                subLabel={`${user.discoverySettings?.minAge || 18}-${user.discoverySettings?.maxAge || 50} ans • ${user.discoverySettings?.distance || 100}km`}
                onClick={() => { playClick(); onOpenFilters(); }}
                hasArrow
              />
              
              <div className="h-[1px] bg-gray-100 dark:bg-white/5 ml-16"></div>

              <SettingItem 
                icon={<Bell size={20} className="text-blue-500 dark:text-blue-400" />}
                label="Notifications"
                onClick={() => { playClick(); setShowNotifSettings(!showNotifSettings); }}
                rightElement={
                    <div className={`transition-transform duration-300 ${showNotifSettings ? 'rotate-90' : ''}`}>
                        <ChevronRight size={16} className="text-gray-400 dark:text-gray-500" />
                    </div>
                }
              />
              
              {showNotifSettings && (
                  <div className="bg-gray-50 dark:bg-black/20 pl-4 py-2 space-y-1 animate-slide-down border-t border-gray-100 dark:border-white/5">
                      <NotifToggle label="Nouveaux Matchs" enabled={settings.matches} onToggle={() => toggleSetting('matches')} />
                      <NotifToggle label="Messages" enabled={settings.messages} onToggle={() => toggleSetting('messages')} />
                  </div>
              )}

              <div className="h-[1px] bg-gray-100 dark:bg-white/5 ml-16"></div>

              <SettingItem 
                icon={soundEnabled ? <Volume2 size={20} className="text-green-600 dark:text-green-400" /> : <VolumeX size={20} className="text-gray-400" />}
                label="Sons & Ambiance"
                onClick={onToggleSound}
                rightElement={<ToggleSwitch enabled={soundEnabled} />}
              />

              <div className="h-[1px] bg-gray-100 dark:bg-white/5 ml-16"></div>

              {/* NIGHT MODE TOGGLE */}
              <SettingItem 
                icon={isDarkMode ? <Moon size={20} className="text-indigo-400" /> : <Sun size={20} className="text-orange-500" />}
                label={isDarkMode ? "Mode Nuit" : "Mode Amour"}
                subLabel={isDarkMode ? "Thème Sombre" : "Thème Clair"}
                onClick={onToggleTheme}
                rightElement={<ToggleSwitch enabled={isDarkMode} color="indigo" />}
              />
              
              <div className="h-[1px] bg-gray-100 dark:bg-white/5 ml-16"></div>

              <SettingItem 
                icon={<Shield size={20} className="text-gray-400" />}
                label="Sécurité & Aide"
                onClick={() => { playClick(); setShowSecurityModal(true); }}
                hasArrow
              />
          </div>

          {/* Danger Zone Buttons (Updated for visibility) */}
          <div className="mt-6 space-y-2 px-2 pb-6">
              <button onClick={triggerLogout} className="w-full py-3 text-sm font-medium rounded-xl transition-colors flex items-center justify-center gap-2 bg-gray-100 dark:bg-white/5 text-gray-900 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-white/10">
                  <LogOut size={16} /> Se déconnecter
              </button>
              <button onClick={triggerDelete} className="w-full py-3 text-xs font-bold uppercase tracking-wider rounded-xl transition-colors flex items-center justify-center gap-2 bg-red-50 dark:bg-white/5 text-red-700 dark:text-red-400 hover:bg-red-100 dark:hover:bg-red-500/10">
                  <Trash2 size={14} /> Supprimer mon compte
              </button>
          </div>

          <div className="text-center pb-8">
              <Sparkles className="w-4 h-4 text-gray-300 dark:text-white/10 mx-auto mb-2" />
              <p className="text-[10px] text-gray-400 dark:text-white/20 font-serif italic">Aura v2.4 • Love Mode Enabled</p>
          </div>
      </div>
    </div>
  );
};

const SettingItem = ({ icon, label, subLabel, rightElement, hasArrow, onClick }: any) => (
    <div onClick={onClick} className="flex items-center justify-between p-5 hover:bg-gray-50 dark:hover:bg-white/5 transition-colors cursor-pointer active:bg-gray-100 dark:active:bg-white/10 group">
        <div className="flex items-center gap-4">
            <div className="opacity-80 group-hover:opacity-100 transition-opacity">{icon}</div>
            <div>
                <div className="text-sm font-medium text-gray-900 dark:text-gray-100">{label}</div>
                {subLabel && <div className="text-xs text-gray-500 mt-0.5">{subLabel}</div>}
            </div>
        </div>
        {rightElement || (hasArrow && <ChevronRight size={16} className="text-gray-400 dark:text-gray-600 group-hover:text-black dark:group-hover:text-white transition-colors" />)}
    </div>
);

const ToggleSwitch = ({ enabled, color = 'green' }: { enabled: boolean, color?: string }) => {
    const bgClass = enabled 
        ? (color === 'indigo' ? 'bg-indigo-500' : 'bg-green-500')
        : 'bg-gray-300 dark:bg-gray-600';

    return (
        <div className={`w-11 h-6 rounded-full p-0.5 transition-colors duration-300 ${bgClass}`}>
            <div className={`w-5 h-5 rounded-full bg-white shadow-sm transition-transform duration-300 ${enabled ? 'translate-x-5' : 'translate-x-0'}`}></div>
        </div>
    );
};

const NotifToggle = ({ label, enabled, onToggle }: any) => (
    <div onClick={(e) => { e.stopPropagation(); onToggle(); }} className="flex items-center justify-between p-3 pr-5 hover:bg-gray-100 dark:hover:bg-white/5 rounded-lg cursor-pointer">
        <span className="text-xs text-gray-500 dark:text-gray-400 ml-10">{label}</span>
        <ToggleSwitch enabled={enabled} />
    </div>
);

export default UserProfileView;
