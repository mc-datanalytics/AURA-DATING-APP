
import React, { useState } from 'react';
import { UserProfile, NotificationSettings } from '../types';
import { Volume2, VolumeX, Crown, Edit, LogOut, Shield, Sliders, Trash2, AlertTriangle, Eye, Bell, MessageCircle, Zap, Sparkles, ThumbsUp, Flame, Droplets, Mountain, Wind, ChevronRight, Info } from 'lucide-react';
import { playClick } from '../services/audioService';
import { getElementColor } from '../services/auraEngine';
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
  const [showAuraDetail, setShowAuraDetail] = useState(false);

  const settings = user.notificationSettings || {
      matches: true, messages: true, likes: true, dailyAura: true, superLikes: true
  };

  // Aura Data (On garde les valeurs par défaut si null)
  const aura = user.aura || { intensity: 50, depth: 50, stability: 50, openness: 50, dominantElement: 'TERRE' };
  const dominantColor = getElementColor(aura.dominantElement || 'TERRE');

  const toggleSetting = (key: keyof NotificationSettings) => {
      playClick();
      onUpdateNotificationSettings({ ...settings, [key]: !settings[key] });
  }

  const triggerLogout = () => { playClick(600); setConfirmAction('LOGOUT'); }
  const triggerDelete = () => { playClick(500); setConfirmAction('DELETE'); }
  
  const getElementIcon = (elem: string) => {
      switch(elem) {
          case 'FEU': return <Flame size={16} fill="currentColor" />;
          case 'EAU': return <Droplets size={16} fill="currentColor" />;
          case 'TERRE': return <Mountain size={16} fill="currentColor" />;
          case 'AIR': return <Wind size={16} fill="currentColor" />;
          default: return <Sparkles size={16} />;
      }
  }

  const getElementLabel = (elem: string) => {
      switch(elem) {
          case 'FEU': return "Feu";
          case 'EAU': return "Eau";
          case 'TERRE': return "Terre";
          case 'AIR': return "Air";
          default: return "Mystère";
      }
  }

  const getAuraDescription = (elem: string) => {
       switch(elem) {
          case 'FEU': return "Votre énergie est intense et passionnée. Vous vivez dans l'instant, prenez des décisions rapides et suivez votre instinct. Votre âme brûle d'un désir d'action.";
          case 'EAU': return "Votre énergie est profonde et émotionnelle. Vous cherchez le sens caché derrière chaque interaction. Vous valorisez la connexion authentique plus que la rapidité.";
          case 'TERRE': return "Votre énergie est stable et rassurante. Vous êtes le roc sur lequel on peut bâtir. Votre constance et votre loyauté sont vos plus grands atouts de séduction.";
          case 'AIR': return "Votre énergie est libre et curieuse. Vous aimez la nouveauté, les idées et l'exploration. Vous êtes une brise fraîche qui refuse d'être enfermée.";
          default: return "Votre aura est en pleine formation.";
      }
  }

  return (
    <div className="flex flex-col h-full bg-aura-dark overflow-y-auto custom-scrollbar pb-24 relative">
      
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

      {/* AURA DETAIL MODAL (Clean & Minimalist) */}
      {showAuraDetail && (
           <div className="fixed inset-0 z-[90] flex items-center justify-center p-6" onClick={() => setShowAuraDetail(false)}>
               <div className="absolute inset-0 bg-black/80 backdrop-blur-lg"></div>
               <div className="relative bg-gray-900 border border-white/10 rounded-[2rem] p-8 max-w-sm w-full text-center shadow-2xl animate-scale-in" onClick={e => e.stopPropagation()}>
                   
                   {/* Close Button */}
                   <button onClick={() => setShowAuraDetail(false)} className="absolute top-4 right-4 p-2 text-gray-500 hover:text-white">
                       <ChevronRight size={24} className="rotate-90" />
                   </button>

                   <div 
                        className="w-24 h-24 rounded-full mx-auto mb-6 flex items-center justify-center shadow-[0_0_40px_rgba(0,0,0,0.5)] relative"
                        style={{ background: `linear-gradient(135deg, ${dominantColor}, ${dominantColor}60)` }}
                   >
                       <div className="absolute inset-0 rounded-full border-2 border-white/20 animate-pulse-slow"></div>
                       <div className="text-white scale-150 relative z-10">
                            {getElementIcon(aura.dominantElement || 'TERRE')}
                       </div>
                   </div>
                   
                   <div className="mb-2 text-[10px] font-bold uppercase tracking-widest opacity-70" style={{ color: dominantColor }}>Votre Essence</div>
                   <h3 className="text-3xl font-serif font-bold text-white mb-4">
                       {getElementLabel(aura.dominantElement || 'TERRE')}
                   </h3>
                   
                   <p className="text-gray-300 leading-relaxed text-sm mb-8">
                       {getAuraDescription(aura.dominantElement || 'TERRE')}
                   </p>
                   
                   <div className="grid grid-cols-2 gap-3 text-xs text-gray-400 bg-white/5 p-4 rounded-xl mb-6">
                       <div className="flex flex-col items-center gap-1">
                           <span className="font-bold text-white">{aura.intensity}%</span>
                           <span>Intensité</span>
                       </div>
                       <div className="flex flex-col items-center gap-1">
                           <span className="font-bold text-white">{aura.depth}%</span>
                           <span>Profondeur</span>
                       </div>
                       <div className="flex flex-col items-center gap-1">
                           <span className="font-bold text-white">{aura.stability}%</span>
                           <span>Stabilité</span>
                       </div>
                       <div className="flex flex-col items-center gap-1">
                           <span className="font-bold text-white">{aura.openness}%</span>
                           <span>Ouverture</span>
                       </div>
                   </div>

                   <button onClick={() => setShowAuraDetail(false)} className="w-full py-3 bg-white/10 rounded-xl text-sm font-bold text-white hover:bg-white/20 transition-colors">Fermer</button>
               </div>
           </div>
      )}

      {/* HEADER PROFILE */}
      <div className="relative flex flex-col items-center pt-12 pb-8 overflow-hidden">
        {/* Ambient Background */}
        <div className="absolute inset-0 opacity-20 pointer-events-none transition-colors duration-1000" style={{ background: `radial-gradient(circle at 50% 0%, ${dominantColor}, transparent 70%)` }}></div>

        {/* Avatar Area */}
        <div className="relative mb-4 group cursor-pointer z-10" onClick={onEditProfile}>
            {/* The "Living" Ring - Subtle & Elegant */}
            <div className="absolute -inset-1 rounded-full opacity-50 blur-md transition-colors duration-1000" style={{ backgroundColor: dominantColor }}></div>
            <img src={user.imageUrl} className="w-28 h-28 rounded-full object-cover relative z-10 border-2 border-white/10 shadow-2xl bg-gray-900" />
            <div className="absolute bottom-0 right-0 bg-white/10 backdrop-blur-md p-2 rounded-full border border-white/20 z-20 shadow-lg hover:bg-white/20 transition-colors">
                <Edit size={14} className="text-white" />
            </div>
        </div>

        <h2 className="text-3xl font-serif font-bold text-white mb-1 relative z-10">{user.name}, {user.age}</h2>
        <p className="text-xs text-gray-400 mb-4 relative z-10">{user.mbti} • {user.attachment}</p>
        
        {/* THE AURA BUTTON - Explicit Interaction */}
        <button 
            onClick={(e) => { 
                e.stopPropagation(); 
                playClick(); 
                setShowAuraDetail(true); 
            }}
            className="relative z-10 group mt-2 px-5 py-2.5 rounded-full bg-white/5 border border-white/10 flex items-center gap-3 hover:bg-white/10 hover:border-white/20 transition-all active:scale-95 overflow-hidden shadow-lg"
        >
            {/* Hover Glow Effect */}
            <div className="absolute inset-0 opacity-0 group-hover:opacity-10 transition-opacity duration-500" style={{ backgroundColor: dominantColor }}></div>
            
            <div className="w-8 h-8 rounded-full bg-black/20 flex items-center justify-center text-white shadow-inner" style={{ color: dominantColor }}>
                {getElementIcon(aura.dominantElement || 'TERRE')}
            </div>
            
            <div className="flex flex-col items-start mr-2">
                <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider leading-none mb-0.5">Votre Aura</span>
                <div className="flex items-center gap-1.5">
                    <span className="text-sm font-bold text-white leading-none">{getElementLabel(aura.dominantElement || 'TERRE')}</span>
                    <Info size={12} className="text-gray-500 group-hover:text-white transition-colors" />
                </div>
            </div>
            
            <ChevronRight size={16} className="text-gray-600 group-hover:translate-x-1 transition-transform" />
        </button>

        {/* Action Grid */}
        <div className="grid grid-cols-2 gap-3 w-full max-w-xs mt-8 px-4 relative z-10">
             <button onClick={onPreviewProfile} className="py-3 bg-white/5 hover:bg-white/10 rounded-2xl flex flex-col items-center justify-center gap-1 border border-white/5 transition-all active:scale-95">
                 <Eye size={20} className="text-gray-300 mb-1" />
                 <span className="text-xs font-medium text-gray-400">Aperçu public</span>
             </button>
             <button onClick={onGoPremium} className="py-3 bg-gradient-to-br from-yellow-500/10 to-amber-500/10 hover:from-yellow-500/20 hover:to-amber-500/20 rounded-2xl flex flex-col items-center justify-center gap-1 border border-yellow-500/20 transition-all relative overflow-hidden active:scale-95 group">
                 <Crown size={20} className="text-yellow-400 mb-1 group-hover:scale-110 transition-transform" />
                 <span className="text-xs font-bold text-yellow-100">Aura Gold</span>
                 <div className="absolute top-2 right-2 w-2 h-2 bg-red-500 rounded-full animate-pulse"></div>
             </button>
        </div>
      </div>

      {/* SETTINGS LIST */}
      <div className="px-4 mt-2 space-y-4">
          
          {/* Discovery Section */}
          <div className="bg-white/5 rounded-3xl overflow-hidden backdrop-blur-sm border border-white/5">
              <SettingItem 
                icon={<Sliders size={20} className="text-aura-accent" />}
                label="Préférences"
                subLabel={`${user.discoverySettings?.minAge || 18}-${user.discoverySettings?.maxAge || 50} ans • ${user.discoverySettings?.distance || 100}km`}
                onClick={() => { playClick(); onOpenFilters(); }}
                hasArrow
              />
          </div>

          {/* General Settings */}
          <div className="bg-white/5 rounded-3xl overflow-hidden backdrop-blur-sm border border-white/5">
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
                  <div className="bg-black/20 pl-4 py-2 space-y-1 animate-slide-down">
                      <NotifToggle label="Nouveaux Matchs" enabled={settings.matches} onToggle={() => toggleSetting('matches')} />
                      <NotifToggle label="Messages" enabled={settings.messages} onToggle={() => toggleSetting('messages')} />
                  </div>
              )}

              <div className="h-[1px] bg-white/5 ml-14"></div>

              <SettingItem 
                icon={soundEnabled ? <Volume2 size={20} className="text-green-400" /> : <VolumeX size={20} className="text-gray-400" />}
                label="Sons & Ambiance"
                onClick={onToggleSound}
                rightElement={<ToggleSwitch enabled={soundEnabled} />}
              />
              
              <div className="h-[1px] bg-white/5 ml-14"></div>

              <SettingItem 
                icon={<Shield size={20} className="text-gray-400" />}
                label="Sécurité & Aide"
                onClick={() => playClick()}
                hasArrow
              />
          </div>

          {/* Danger Zone */}
          <div className="mt-8 space-y-3 px-2">
              <button onClick={triggerLogout} className="w-full py-3 text-sm text-gray-400 font-medium hover:text-white transition-colors rounded-xl hover:bg-white/5">
                  Se déconnecter
              </button>
              <button onClick={triggerDelete} className="w-full py-3 text-xs text-red-500/70 font-bold uppercase tracking-wider hover:text-red-500 transition-colors rounded-xl hover:bg-red-500/10">
                  Supprimer mon compte
              </button>
          </div>

          <div className="text-center pb-8 pt-4">
              <Sparkles className="w-4 h-4 text-white/10 mx-auto mb-2" />
              <p className="text-[10px] text-white/20 font-serif italic">Aura v2.1 • Karmic Engine Active</p>
          </div>
      </div>
    </div>
  );
};

const SettingItem = ({ icon, label, subLabel, rightElement, hasArrow, onClick }: any) => (
    <div onClick={onClick} className="flex items-center justify-between p-5 hover:bg-white/5 transition-colors cursor-pointer active:bg-white/10">
        <div className="flex items-center gap-4">
            {icon}
            <div>
                <div className="text-sm font-medium text-gray-100">{label}</div>
                {subLabel && <div className="text-xs text-gray-500 mt-0.5">{subLabel}</div>}
            </div>
        </div>
        {rightElement || (hasArrow && <ChevronRight size={16} className="text-gray-600" />)}
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
