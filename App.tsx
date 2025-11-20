import React, { useState, useEffect } from 'react';
import { Routes, Route, useNavigate, useLocation, Navigate } from 'react-router-dom';
import { AppView, DiscoveryMode, UserProfile, ChatSession, Message, NotificationSettings, DiscoverySettings } from './types';
import Onboarding from './components/Onboarding';
import ProfileCard from './components/ProfileCard';
import SkeletonCard from './components/SkeletonCard';
import ChatView from './components/ChatView';
import DailyAuraModal from './components/DailyAuraModal';
import UserProfileView from './components/UserProfileView';
import PremiumModal from './components/PremiumModal';
import NewMatchOverlay from './components/NewMatchOverlay';
import EditProfileView from './components/EditProfileView';
import TutorialOverlay from './components/TutorialOverlay';
import LikesReceivedView from './components/LikesReceivedView';
import AuthView from './components/AuthView';
import DiscoveryFiltersModal from './components/DiscoveryFiltersModal';
import AuraLogo from './components/AuraLogo';
import { MessageSquare, Users, Ghost, User as UserIcon, Sparkles, Zap, Crown, ArrowLeft, RotateCcw, Sliders } from 'lucide-react';
import clsx from 'clsx';
import { playClick, playTransition, playDailyAuraOpen, playPremiumOpen } from './services/audioService';
import * as DataService from './services/dataService';
import { generateChatReply } from './services/geminiService';
import { supabase } from './services/supabaseClient';

const DAILY_QUESTION = "Quelle est la chose la plus importante que vos ex diraient de vous ?";

const App: React.FC = () => {
  // Navigation
  const navigate = useNavigate();
  const location = useLocation();
  
  const [mode, setMode] = useState<DiscoveryMode>(DiscoveryMode.INCOGNITO);
  
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [profiles, setProfiles] = useState<UserProfile[]>([]); // Discovery Queue
  const [matches, setMatches] = useState<ChatSession[]>([]);
  const [pendingLikes, setPendingLikes] = useState<UserProfile[]>([]);
  
  const [showDailyModal, setShowDailyModal] = useState(false);
  const [showPremiumModal, setShowPremiumModal] = useState(false);
  const [showFiltersModal, setShowFiltersModal] = useState(false);
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [showTutorial, setShowTutorial] = useState(false);
  const [currentMatchProfile, setCurrentMatchProfile] = useState<UserProfile | null>(null);

  const [isLoading, setIsLoading] = useState(true);

  // --- AUTH & INIT ---
  useEffect(() => {
      const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
          if (session?.user) {
              DataService.setCurrentUserId(session.user.id);
              const existingProfile = await DataService.getMyProfile();
              
              if (existingProfile) {
                  setUserProfile(existingProfile);
                  await loadDiscovery(existingProfile);
                  await loadMatches(existingProfile.id);
                  await loadPendingLikes(existingProfile);
                  
                  // If on auth page or root, go to discovery
                  if (location.pathname === '/' || location.pathname === '/auth') {
                      navigate('/discovery');
                  }
              } else {
                  navigate('/onboarding');
              }
          } else {
              navigate('/auth');
          }
          setIsLoading(false);
      });

      return () => subscription.unsubscribe();
  }, []);

  const loadDiscovery = async (me: UserProfile) => {
      const queue = await DataService.getDiscoveryProfiles(me);
      setProfiles(queue);
  };

  const loadMatches = async (myId: string) => {
      const sessionList = await DataService.getMatches(myId);
      const mappedSessions = sessionList.map(s => ({
          ...s,
          messages: s.messages.map(m => ({
              ...m,
              senderId: m.senderId === myId ? 'me' : m.senderId
          }))
      }));
      setMatches(mappedSessions);
  };

  const loadPendingLikes = async (me: UserProfile) => {
      const likes = await DataService.getPendingLikes(me);
      setPendingLikes(likes);
  }

  // --- HANDLERS ---

  const handleOnboardingComplete = async (partialProfile: Partial<UserProfile>) => {
    try {
        const newProfile = await DataService.createMyProfile(partialProfile);
        if (newProfile) {
            setUserProfile(newProfile);
            await loadDiscovery(newProfile);
            setShowTutorial(true);
            navigate('/discovery');
        } else {
            alert("Erreur: Impossible de créer le profil. Le serveur ne répond pas.");
        }
    } catch (err: any) {
        console.error(err);
        const msg = err?.message || (typeof err === 'object' ? JSON.stringify(err) : String(err));
        alert("Erreur lors de la création du profil: " + msg);
    }
  };

  const handleSwipe = async (direction: 'left' | 'right' | 'super') => {
    if (!userProfile || profiles.length === 0) return;

    const target = profiles[0];
    const remaining = profiles.slice(1);
    setProfiles(remaining);

    const match = await DataService.swipeProfile(userProfile.id, target.id, direction);

    if (match) {
        setCurrentMatchProfile(target);
        loadMatches(userProfile.id);
    }

    if (remaining.length === 0) {
        await loadDiscovery(userProfile);
    }
  };

  const handleRewind = async () => {
      if (!userProfile) return;
      playClick();
      
      const restoredProfile = await DataService.restoreLastSwipe(userProfile);
      if (restoredProfile) {
          // Add back to the start of the deck
          setProfiles(prev => [restoredProfile, ...prev]);
      }
  };

  const handleBlockUser = async (userId: string) => {
      if (!userProfile) return;
      await DataService.blockUser(userProfile.id, userId);
      
      // Update local state immediately
      setMatches(prev => prev.filter(m => m.user.id !== userId));
      setProfiles(prev => prev.filter(p => p.id !== userId));
      setPendingLikes(prev => prev.filter(p => p.id !== userId));
  };

  const handleOverlaySendMessage = async () => {
      if (!currentMatchProfile || !userProfile) return;
      
      // Refresh matches to ensure we have the ID
      const freshMatches = await DataService.getMatches(userProfile.id);
      const mappedMatches = freshMatches.map(s => ({
          ...s,
          messages: s.messages.map(m => ({
              ...m,
              senderId: m.senderId === userProfile.id ? 'me' : m.senderId
          }))
      }));
      setMatches(mappedMatches);

      const session = mappedMatches.find(m => m.user.id === currentMatchProfile.id);
      setCurrentMatchProfile(null);
      
      if (session) {
          navigate(`/chat/${session.matchId}`);
      } else {
          // Fallback if match creation is slow
          navigate('/matches');
      }
  };

  const handleOverlayKeepSwiping = async () => {
      setCurrentMatchProfile(null);
      if(userProfile) await loadMatches(userProfile.id);
  };

  const openChat = (session: ChatSession) => {
    playClick();
    navigate(`/chat/${session.matchId}`);
  };

  const handleUpdateChatMessages = async (matchId: string, updatedMessages: Message[]) => {
      if (!userProfile) return;
      
      // Find the active session from state
      const activeChat = matches.find(m => m.matchId === matchId);
      if (!activeChat) return;

      const lastMsg = updatedMessages[updatedMessages.length - 1];
      
      // Update local state immediately
      const newSessionState = { ...activeChat, messages: updatedMessages };
      setMatches(prev => prev.map(m => m.matchId === matchId ? newSessionState : m));

      // Persist to DB if it's my message
      if (lastMsg.senderId === 'me') {
         const existingInDb = activeChat.messages.find(m => m.id === lastMsg.id);
         if (!existingInDb) {
             await DataService.sendMessage(matchId, userProfile.id, lastMsg.text);
             
             // SIMULATE AI REPLY (For Demo Only)
             setTimeout(async () => {
                 const history = updatedMessages.map(m => ({ 
                    sender: m.senderId === 'me' ? 'Match' : activeChat.user.name, 
                    text: m.text 
                 }));
                 const replyText = await generateChatReply(activeChat.user, lastMsg.text, history);
                 await DataService.sendMessage(matchId, activeChat.user.id, replyText);
             }, 3000);
         }
      } 
  };

  const switchMode = (m: DiscoveryMode) => { playClick(900); setMode(m); }
  
  const handleOpenDailyAura = () => { 
      if (!userProfile?.isBoosted) { 
          playDailyAuraOpen(); 
          setShowDailyModal(true); 
      } 
  }
  
  const handleDailyAuraComplete = async (answer: string) => {
      if (!userProfile) return;
      const updated = { ...userProfile, dailyAuraAnswer: answer, isBoosted: true };
      setUserProfile(updated);
      await DataService.updateMyProfile(updated);
      setShowDailyModal(false);
  };

  const handleUpdateProfile = async (updatedProfile: UserProfile) => {
      const saved = await DataService.updateMyProfile(updatedProfile);
      if (saved) {
          setUserProfile(saved);
          navigate('/settings');
      } else {
          setUserProfile(updatedProfile);
          navigate('/settings');
      }
  };

  const handleUpdateNotificationSettings = async (settings: NotificationSettings) => {
      if (!userProfile) return;
      const updated = { ...userProfile, notificationSettings: settings };
      setUserProfile(updated);
      await DataService.updateMyProfile(updated);
  };

  const handleSaveDiscoverySettings = async (settings: DiscoverySettings) => {
      if (!userProfile) return;
      const updated = { ...userProfile, discoverySettings: settings };
      setUserProfile(updated);
      setShowFiltersModal(false);
      await DataService.updateMyProfile(updated);
      await loadDiscovery(updated);
  }

  const handleLogout = () => {
      DataService.signOut();
      navigate('/auth');
  };

  const handleDeleteAccount = () => {
      handleLogout();
  };

  const handleMatchFromLikes = async (target: UserProfile) => {
      if (!userProfile) return;
      const match = await DataService.swipeProfile(userProfile.id, target.id, 'right');
      if (match) {
          await loadPendingLikes(userProfile);
          await loadMatches(userProfile.id);
          setCurrentMatchProfile(target);
      }
  }

  const handlePremiumSuccess = () => {
      if (userProfile) {
          setUserProfile({ ...userProfile, isPremium: true });
      }
  }

  // --- RENDERERS ---
  
  // Header adapté avec padding Safe Area (pt-[...])
  const renderDiscoveryHeader = () => (
    <div className="relative z-50 flex flex-col bg-obsidian/90 backdrop-blur-md border-b border-white/5 pt-[max(env(safe-area-inset-top),0.75rem)]">
        <div className="flex items-center justify-between px-4 py-3">
             <div className="flex items-center gap-3">
                 <AuraLogo size={32} />
                 <span className="font-display font-bold text-2xl tracking-tight text-white">Aura</span>
             </div>
             
             <div className="flex items-center gap-3">
                {/* Filters Button Moved Here */}
                <button onClick={() => { playClick(); setShowFiltersModal(true); }} className="w-9 h-9 rounded-full bg-carbon border border-white/10 flex items-center justify-center text-gray-400 hover:text-white hover:border-white/30 transition-all">
                    <Sliders size={16} />
                </button>

                <div className="flex bg-carbon rounded-full p-1 border border-white/5">
                    <button onClick={() => switchMode(DiscoveryMode.INCOGNITO)} className={clsx("w-8 h-8 rounded-full flex items-center justify-center transition-all", mode === DiscoveryMode.INCOGNITO ? "bg-white/10 text-white shadow-inner" : "text-gray-500 hover:text-white")}>
                        <Ghost size={14} />
                    </button>
                    <button onClick={() => switchMode(DiscoveryMode.CLAIRVOYANCE)} className={clsx("w-8 h-8 rounded-full flex items-center justify-center transition-all", mode === DiscoveryMode.CLAIRVOYANCE ? "bg-brand-mid text-white shadow-glow-brand" : "text-gray-500 hover:text-white")}>
                        <Users size={14} />
                    </button>
                </div>
             </div>
        </div>
        <div onClick={handleOpenDailyAura} className={clsx("w-full px-4 py-2 cursor-pointer transition-all duration-500 flex items-center justify-center gap-2 text-xs font-medium border-t border-white/5", userProfile?.isBoosted ? "bg-gradient-to-r from-yellow-500/10 to-amber-500/10 text-yellow-200" : "bg-carbon text-gray-400 hover:bg-white/5")}>
             {userProfile?.isBoosted ? (<><Zap size={12} className="text-yellow-400 animate-pulse" fill="currentColor" /><span>Boost Actif</span></>) : (<><Sparkles size={12} className="text-brand-end animate-pulse-slow" /><span>L'Oracle : <span className="italic opacity-80 text-white">"{DAILY_QUESTION}"</span></span></>)}
        </div>
    </div>
  );

  // Navbar Flottante (Capsule Style)
  const renderBottomNav = () => {
    const p = location.pathname;
    const isDiscovery = p === '/discovery';
    const isMatches = p === '/matches' || p.startsWith('/chat') || p === '/likes';
    const isSettings = p === '/settings' || p === '/profile/edit';

    return (
        <div className="absolute bottom-0 w-full h-[calc(6rem+env(safe-area-inset-bottom))] bg-gradient-to-t from-obsidian via-obsidian/80 to-transparent flex items-end justify-center pb-[calc(1.5rem+env(safe-area-inset-bottom))] z-50 pointer-events-none">
            <div className="pointer-events-auto flex w-auto bg-carbon/80 backdrop-blur-xl border border-white/10 rounded-full px-6 py-2 shadow-glass gap-8">
                <button onClick={() => { playTransition(); navigate('/discovery'); }} className={clsx("flex flex-col items-center justify-center gap-1 transition-all active:scale-95 group relative", isDiscovery ? "text-white" : "text-gray-500")}>
                    <div className={clsx("absolute inset-0 blur-lg opacity-50 transition-opacity", isDiscovery ? "bg-brand-start opacity-40" : "opacity-0")}></div>
                    <Users size={24} className="relative z-10" strokeWidth={isDiscovery ? 2.5 : 2} />
                    {isDiscovery && <div className="w-1 h-1 bg-brand-end rounded-full absolute -bottom-2"></div>}
                </button>
                
                <button onClick={() => { playTransition(); navigate('/matches'); }} className={clsx("flex flex-col items-center justify-center gap-1 transition-all active:scale-95 group relative", isMatches ? "text-white" : "text-gray-500")}>
                    <div className={clsx("absolute inset-0 blur-lg opacity-50 transition-opacity", isMatches ? "bg-brand-start opacity-40" : "opacity-0")}></div>
                    <div className="relative">
                         <MessageSquare size={24} className="relative z-10" strokeWidth={isMatches ? 2.5 : 2} />
                         {(matches.some(m => m.messages.length > 0 && m.messages[m.messages.length-1].senderId !== 'me') || pendingLikes.length > 0) && <span className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-brand-end rounded-full border-2 border-carbon animate-pulse"></span>}
                    </div>
                    {isMatches && <div className="w-1 h-1 bg-brand-end rounded-full absolute -bottom-2"></div>}
                </button>
                
                <button onClick={() => { playTransition(); navigate('/settings'); }} className={clsx("flex flex-col items-center justify-center gap-1 transition-all active:scale-95 group relative", isSettings ? "text-white" : "text-gray-500")}>
                    <div className={clsx("absolute inset-0 blur-lg opacity-50 transition-opacity", isSettings ? "bg-brand-start opacity-40" : "opacity-0")}></div>
                    <UserIcon size={24} className="relative z-10" strokeWidth={isSettings ? 2.5 : 2} />
                    {isSettings && <div className="w-1 h-1 bg-brand-end rounded-full absolute -bottom-2"></div>}
                </button>
            </div>
        </div>
    );
  };

  if (isLoading) {
      return (
        <div className="relative w-full h-[100dvh] overflow-hidden bg-obsidian flex justify-center sm:items-center sm:bg-gray-950">
            <div className="w-full max-w-md h-full sm:h-[90dvh] relative bg-obsidian sm:rounded-[2.5rem] sm:border-[8px] sm:border-gray-900 shadow-2xl overflow-hidden flex flex-col ring-1 ring-white/10">
                 <div className="flex flex-col h-full items-center justify-center">
                    <div className="relative animate-pulse-slow">
                        <AuraLogo size={100} />
                    </div>
                 </div>
            </div>
        </div>
      )
  }

  const showBottomNav = ['/discovery', '/matches', '/settings', '/likes'].includes(location.pathname);

  return (
    // UTILISATION DE 100dvh POUR MOBILE
    <div className="relative w-full h-[100dvh] overflow-hidden bg-obsidian text-white font-body selection:bg-brand-mid selection:text-white flex justify-center sm:items-center sm:bg-black">
      <div className="w-full max-w-md h-full sm:h-[90dvh] relative bg-obsidian sm:rounded-[2.5rem] sm:border-[8px] sm:border-gray-900 shadow-2xl overflow-hidden flex flex-col ring-1 ring-white/10">
        
        {/* Scanline effect overlay (optional aesthetic) */}
        <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(rgba(18,16,16,0)_50%,rgba(0,0,0,0.1)_50%),linear-gradient(90deg,rgba(255,0,0,0.03),rgba(0,255,0,0.01),rgba(0,0,255,0.03))] z-[100] bg-[length:100%_2px,3px_100%] opacity-20"></div>

        {showTutorial && <TutorialOverlay onComplete={() => setShowTutorial(false)} />}
        {showDailyModal && <DailyAuraModal question={DAILY_QUESTION} onClose={() => setShowDailyModal(false)} onComplete={handleDailyAuraComplete} />}
        {showPremiumModal && <PremiumModal onClose={() => setShowPremiumModal(false)} onUpgradeSuccess={handlePremiumSuccess} />}
        {showFiltersModal && userProfile && userProfile.discoverySettings && (
            <DiscoveryFiltersModal settings={userProfile.discoverySettings} onSave={handleSaveDiscoverySettings} onClose={() => setShowFiltersModal(false)} />
        )}
        
        {currentMatchProfile && userProfile && (
            <NewMatchOverlay currentUser={userProfile} matchedUser={currentMatchProfile} onSendMessage={handleOverlaySendMessage} onKeepSwiping={handleOverlayKeepSwiping} />
        )}

        <Routes>
            <Route path="/auth" element={<AuthView />} />
            <Route path="/onboarding" element={<Onboarding onComplete={handleOnboardingComplete} />} />
            
            {/* Discovery View */}
            <Route path="/discovery" element={userProfile && (
                <div className="flex flex-col h-full">
                    {renderDiscoveryHeader()}
                    <div className="flex-1 relative flex flex-col items-center justify-center p-4 pb-36">
                        {profiles.length > 0 ? (
                            <ProfileCard 
                                key={profiles[0].id} 
                                profile={profiles[0]} 
                                currentUser={userProfile} 
                                mode={mode} 
                                onSwipe={handleSwipe}
                                onBlock={handleBlockUser}
                                onRewind={handleRewind} 
                            />
                        ) : (
                            <div className="relative w-full h-full flex flex-col items-center justify-center">
                                {/* Rewind Button for Empty State */}
                                <div className="absolute top-0 left-4 sm:left-0 z-20">
                                    <button 
                                        onClick={handleRewind}
                                        className="w-10 h-10 rounded-full bg-black/20 backdrop-blur-md border border-yellow-500/30 text-yellow-500 flex items-center justify-center shadow-[0_0_15px_rgba(234,179,8,0.15)] hover:bg-yellow-500/10 hover:scale-110 transition-all active:scale-95 group"
                                    >
                                        <RotateCcw size={18} className="group-hover:-rotate-90 transition-transform duration-500" />
                                    </button>
                                </div>

                                <div className="text-gray-500 flex flex-col items-center animate-pulse">
                                    <Ghost className="mb-4 opacity-50" size={40} />
                                    <span className="text-sm font-medium">Le vide cosmique...</span>
                                    <button 
                                        onClick={() => setShowFiltersModal(true)}
                                        className="mt-4 px-6 py-2 glass-button rounded-full text-xs font-bold hover:bg-white/10 transition-colors uppercase tracking-widest"
                                    >
                                        Ajuster les ondes
                                    </button>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            )} />

            {/* Matches List */}
            <Route path="/matches" element={userProfile && (
                <div className="flex flex-col h-full">
                    <div className="p-6 pb-4 border-b border-white/5 bg-obsidian/90 backdrop-blur z-10 pt-[max(env(safe-area-inset-top),1.5rem)]">
                        <h2 className="text-3xl font-display font-bold text-white">Connexions</h2>
                    </div>
                    <div className="flex-1 overflow-y-auto p-4 space-y-3 custom-scrollbar pb-24">
                        <div 
                            onClick={() => navigate('/likes')}
                            className="mb-6 p-1 rounded-2xl bg-gradient-to-r from-brand-mid to-brand-end p-[1px] cursor-pointer active:scale-[0.98] transition-transform"
                        >
                            <div className="bg-carbon rounded-2xl p-4 flex items-center justify-between">
                                <div className="flex items-center gap-3">
                                        <div className="w-12 h-12 rounded-full bg-white/5 flex items-center justify-center shadow-glow-brand relative border border-white/10">
                                            <Crown size={20} className="text-brand-end" fill="currentColor" />
                                            {pendingLikes.length > 0 && <div className="absolute -top-1 -right-1 w-5 h-5 bg-brand-end rounded-full flex items-center justify-center text-[10px] font-bold border border-obsidian animate-bounce text-white">{pendingLikes.length}</div>}
                                        </div>
                                        <div>
                                            <h3 className="font-bold text-white text-sm">Âmes intéressées</h3>
                                            <p className="text-xs text-gray-400">Voir qui résonne avec vous</p>
                                        </div>
                                </div>
                                <div className="w-8 h-8 rounded-full bg-white/5 flex items-center justify-center text-gray-400"><ArrowLeft size={16} className="rotate-180" /></div>
                            </div>
                        </div>

                        <h3 className="text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-4 ml-2">Discussions</h3>
                        {matches.length === 0 && (
                            <div className="flex flex-col items-center justify-center h-32 opacity-40">
                                <Ghost className="w-10 h-10 mb-2 text-gray-600" />
                                <p className="text-xs text-gray-500">Aucune résonance pour le moment.</p>
                            </div>
                        )}
                        {matches.map(match => (
                            <div key={match.matchId} onClick={() => openChat(match)} className="glass-panel p-3 rounded-2xl flex items-center gap-4 cursor-pointer hover:bg-white/5 transition-all active:scale-[0.98]">
                                <div className="w-14 h-14 rounded-full overflow-hidden bg-carbon relative border border-white/10 shadow-md">
                                    {match.isRevealed ? <img src={match.user.imageUrl} className="w-full h-full object-cover"/> : <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-gray-800 to-black"><Ghost className="w-6 h-6 text-brand-mid opacity-50"/></div>}
                                </div>
                                <div className="flex-1 min-w-0">
                                    <div className="flex justify-between items-baseline">
                                        <h3 className="font-display font-semibold text-lg truncate text-white">{match.user.name}</h3>
                                        <span className="text-[10px] text-brand-end font-bold bg-brand-end/10 px-2 py-0.5 rounded-full border border-brand-end/20">{match.user.compatibilityScore}%</span>
                                    </div>
                                    <p className="text-xs text-gray-400 truncate pr-4 mt-0.5 font-medium">
                                        {match.messages.length > 0 ? <span className={match.messages[match.messages.length-1].senderId === 'me' ? 'text-gray-500' : 'text-gray-300'}>{match.messages[match.messages.length-1].text}</span> : <span className="italic text-brand-mid flex items-center gap-1"><Sparkles size={10}/> La magie attend...</span>}
                                    </p>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )} />

            {/* Likes View */}
            <Route path="/likes" element={userProfile && (
                <LikesReceivedView user={userProfile} onBack={() => navigate('/matches')} onGoPremium={() => { playPremiumOpen(); setShowPremiumModal(true); }} onMatch={handleMatchFromLikes} pendingLikes={pendingLikes} />
            )} />

            {/* Chat View */}
            <Route path="/chat/:matchId" element={
                <ChatView 
                    sessions={matches} 
                    mode={mode} 
                    onUpdateMessages={handleUpdateChatMessages} 
                    onBlockUser={handleBlockUser} 
                />
            } />

            {/* Settings View */}
            <Route path="/settings" element={userProfile && (
                <div className="flex flex-col h-full">
                    <UserProfileView 
                        user={userProfile} 
                        soundEnabled={soundEnabled} 
                        onToggleSound={() => setSoundEnabled(!soundEnabled)} 
                        onGoPremium={() => { playPremiumOpen(); setShowPremiumModal(true); }} 
                        onLogout={handleLogout} 
                        onDeleteAccount={handleDeleteAccount} 
                        onEditProfile={() => { playClick(); navigate('/profile/edit'); }} 
                        onPreviewProfile={() => { playClick(); navigate('/profile/preview'); }}
                        onUpdateNotificationSettings={handleUpdateNotificationSettings}
                        onOpenFilters={() => { playClick(); setShowFiltersModal(true); }}
                    />
                </div>
            )} />

            {/* Edit Profile */}
            <Route path="/profile/edit" element={userProfile && (
                 <div className="flex flex-col h-full">
                    <EditProfileView user={userProfile} onSave={handleUpdateProfile} onCancel={() => navigate('/settings')} />
                 </div>
            )} />

            {/* Profile Preview */}
            <Route path="/profile/preview" element={userProfile && (
                <div className="flex flex-col h-full relative bg-obsidian">
                     <div className="absolute top-0 left-0 right-0 p-4 z-50 pt-[max(env(safe-area-inset-top),1rem)]">
                        <button onClick={() => navigate('/settings')} className="flex items-center gap-2 text-white glass-button px-4 py-2 rounded-full"><ArrowLeft size={16} /> Retour</button>
                     </div>
                     <div className="flex-1 flex items-center justify-center p-4">
                        <ProfileCard profile={{...userProfile, compatibilityScore: 100, compatibilityLabel: "L'Amour de Soi"}} mode={DiscoveryMode.CLAIRVOYANCE} onSwipe={() => {}} />
                     </div>
                </div>
            )} />

        </Routes>

        {showBottomNav && renderBottomNav()}

      </div>
    </div>
  );
};

export default App;