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
import { ToastProvider, useToast } from './components/Toast';

const DAILY_QUESTION = "Quelle est la chose la plus importante que vos ex diraient de vous ?";

const AppContent: React.FC = () => {
  // Navigation
  const navigate = useNavigate();
  const location = useLocation();
  const { showToast } = useToast();
  
  // Theme State
  const [isDarkMode, setIsDarkMode] = useState<boolean>(() => {
      const saved = localStorage.getItem('aura_theme');
      return saved === 'dark'; // Default to light if not set
  });

  // Apply Theme
  useEffect(() => {
      const root = window.document.documentElement;
      if (isDarkMode) {
          root.classList.add('dark');
          localStorage.setItem('aura_theme', 'dark');
          document
            .querySelector('meta[name="theme-color"]')
            ?.setAttribute('content', '#050505');
      } else {
          root.classList.remove('dark');
          localStorage.setItem('aura_theme', 'light');
          document
            .querySelector('meta[name="theme-color"]')
            ?.setAttribute('content', '#ffffff');
      }
  }, [isDarkMode]);

  const toggleTheme = () => {
      playClick(600);
      setIsDarkMode(!isDarkMode);
  }

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
                  
                  // Mise à jour silencieuse de la position GPS au démarrage
                  DataService.updateUserLocation();

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
            DataService.updateUserLocation(); // Get location on signup
            await loadDiscovery(newProfile);
            setShowTutorial(true);
            navigate('/discovery');
            showToast("Bienvenue sur Aura", "success");
        } else {
            showToast("Erreur serveur lors de la création.", "error");
        }
    } catch (err: any) {
        console.error(err);
        const msg = err?.message || (typeof err === 'object' ? JSON.stringify(err) : String(err));
        showToast("Erreur: " + msg, "error");
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
          showToast("Retour en arrière effectué", "info");
      } else {
          showToast("Aucun profil à restaurer", "info");
      }
  };

  const handleBlockUser = async (userId: string) => {
      if (!userProfile) return;
      await DataService.blockUser(userProfile.id, userId);
      
      // Update local state immediately
      setMatches(prev => prev.filter(m => m.user.id !== userId));
      setProfiles(prev => prev.filter(p => p.id !== userId));
      setPendingLikes(prev => prev.filter(p => p.id !== userId));
      showToast("Utilisateur bloqué", "success");
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
             // Send to DB with correct type and URL
             await DataService.sendMessage(matchId, userProfile.id, lastMsg.text, lastMsg.type, lastMsg.mediaUrl);
             
             // SIMULATE AI REPLY (For Demo Only - Text only for AI)
             if (lastMsg.type === 'text') {
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
      } 
  };

  const switchMode = (m: DiscoveryMode) => { playClick(900); setMode(m); }
  
  const handleOpenDailyAura = () => { 
      if (!userProfile?.isBoosted) { 
          playDailyAuraOpen(); 
          setShowDailyModal(true); 
      } else {
          showToast("Votre boost est déjà actif !", "success");
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
          showToast("Profil mis à jour", "success");
      } else {
          setUserProfile(updatedProfile);
          navigate('/settings');
          showToast("Erreur lors de la mise à jour", "error");
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
      showToast("Préférences enregistrées", "success");
  }

  const handleLogout = () => {
      DataService.signOut();
      navigate('/auth');
  };

  const handleDeleteAccount = () => {
      handleLogout();
      showToast("Compte supprimé", "info");
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
          showToast("Bienvenue dans Aura Premium", "success");
      }
  }

  // --- RENDERERS ---
  
  // Header adapté avec padding Safe Area (pt-[...])
  const renderDiscoveryHeader = () => (
    <div className="relative z-50 flex flex-col bg-white/90 dark:bg-obsidian/90 backdrop-blur-md border-b border-gray-200 dark:border-white/5 pt-[max(env(safe-area-inset-top),0.75rem)] transition-colors duration-300">
        <div className="flex items-center justify-between px-4 py-3">
             <div className="flex items-center gap-3">
                 <AuraLogo size={32} />
                 <span className="font-display font-bold text-2xl tracking-tight text-gray-900 dark:text-white">Aura</span>
             </div>
             
             <div className="flex items-center gap-3">
                {/* Filters Button Moved Here */}
                <button onClick={() => { playClick(); setShowFiltersModal(true); }} className="w-9 h-9 rounded-full bg-gray-100 dark:bg-carbon border border-gray-200 dark:border-white/10 flex items-center justify-center text-gray-500 dark:text-gray-400 hover:text-black dark:hover:text-white hover:border-gray-300 dark:hover:border-white/30 transition-all">
                    <Sliders size={16} />
                </button>

                <div className="flex bg-gray-100 dark:bg-carbon rounded-full p-1 border border-gray-200 dark:border-white/5">
                    <button onClick={() => switchMode(DiscoveryMode.INCOGNITO)} className={clsx("w-8 h-8 rounded-full flex items-center justify-center transition-all", mode === DiscoveryMode.INCOGNITO ? "bg-white dark:bg-white/10 text-gray-900 dark:text-white shadow-sm dark:shadow-inner" : "text-gray-400 dark:text-gray-500 hover:text-black dark:hover:text-white")}>
                        <Ghost size={14} />
                    </button>
                    <button onClick={() => switchMode(DiscoveryMode.CLAIRVOYANCE)} className={clsx("w-8 h-8 rounded-full flex items-center justify-center transition-all", mode === DiscoveryMode.CLAIRVOYANCE ? "bg-brand-mid text-white shadow-glow-brand" : "text-gray-400 dark:text-gray-500 hover:text-black dark:hover:text-white")}>
                        <Users size={14} />
                    </button>
                </div>
             </div>
        </div>
        <div onClick={handleOpenDailyAura} className={clsx("w-full px-4 py-2 cursor-pointer transition-all duration-500 flex items-center justify-center gap-2 text-xs font-medium border-t border-gray-200 dark:border-white/5", userProfile?.isBoosted ? "bg-gradient-to-r from-yellow-500/10 to-amber-500/10 text-yellow-600 dark:text-yellow-200" : "bg-gray-50 dark:bg-carbon text-gray-900 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-white/5")}>
             {userProfile?.isBoosted ? (<><Zap size={12} className="text-yellow-500 dark:text-yellow-400 animate-pulse" fill="currentColor" /><span>Boost Actif</span></>) : (<><Sparkles size={12} className="text-brand-end animate-pulse-slow" /><span>L'Oracle : <span className="italic opacity-80 text-gray-700 dark:text-white">"{DAILY_QUESTION}"</span></span></>)}
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
        <div className="absolute bottom-0 w-full h-[calc(6rem+env(safe-area-inset-bottom))] bg-gradient-to-t from-white via-white/80 to-transparent dark:from-obsidian dark:via-obsidian/80 dark:to-transparent flex items-end justify-center pb-[calc(1.5rem+env(safe-area-inset-bottom))] z-50 pointer-events-none transition-colors duration-300">
            <div className="pointer-events-auto flex w-auto bg-white/90 dark:bg-carbon/80 backdrop-blur-xl border border-gray-200 dark:border-white/10 rounded-full px-6 py-2 shadow-[0_8px_30px_rgba(0,0,0,0.12)] dark:shadow-glass gap-8">
                <button onClick={() => { playTransition(); navigate('/discovery'); }} className={clsx("flex flex-col items-center justify-center gap-1 transition-all active:scale-95 group relative", isDiscovery ? "text-gray-900 dark:text-white" : "text-gray-400 dark:text-gray-500")}>
                    <div className={clsx("absolute inset-0 blur-lg opacity-50 transition-opacity", isDiscovery ? "bg-brand-start opacity-20 dark:opacity-40" : "opacity-0")}></div>
                    <Users size={24} className="relative z-10" strokeWidth={isDiscovery ? 2.5 : 2} />
                    {isDiscovery && <div className="w-1 h-1 bg-brand-end rounded-full absolute -bottom-2"></div>}
                </button>
                
                <button onClick={() => { playTransition(); navigate('/matches'); }} className={clsx("flex flex-col items-center justify-center gap-1 transition-all active:scale-95 group relative", isMatches ? "text-gray-900 dark:text-white" : "text-gray-400 dark:text-gray-500")}>
                    <div className={clsx("absolute inset-0 blur-lg opacity-50 transition-opacity", isMatches ? "bg-brand-start opacity-20 dark:opacity-40" : "opacity-0")}></div>
                    <div className="relative">
                         <MessageSquare size={24} className="relative z-10" strokeWidth={isMatches ? 2.5 : 2} />
                         {(matches.some(m => m.messages.length > 0 && m.messages[m.messages.length-1].senderId !== 'me') || pendingLikes.length > 0) && <span className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-brand-end rounded-full border-2 border-white dark:border-carbon animate-pulse"></span>}
                    </div>
                    {isMatches && <div className="w-1 h-1 bg-brand-end rounded-full absolute -bottom-2"></div>}
                </button>
                
                <button onClick={() => { playTransition(); navigate('/settings'); }} className={clsx("flex flex-col items-center justify-center gap-1 transition-all active:scale-95 group relative", isSettings ? "text-gray-900 dark:text-white" : "text-gray-400 dark:text-gray-500")}>
                    <div className={clsx("absolute inset-0 blur-lg opacity-50 transition-opacity", isSettings ? "bg-brand-start opacity-20 dark:opacity-40" : "opacity-0")}></div>
                    <UserIcon size={24} className="relative z-10" strokeWidth={isSettings ? 2.5 : 2} />
                    {isSettings && <div className="w-1 h-1 bg-brand-end rounded-full absolute -bottom-2"></div>}
                </button>
            </div>
        </div>
    );
  };

  if (isLoading) {
      return (
        <div className="relative w-full h-[100dvh] overflow-hidden bg-white dark:bg-obsidian flex justify-center sm:items-center sm:bg-gray-100 dark:sm:bg-gray-950">
            <div className="w-full max-w-md h-full sm:h-[90dvh] relative bg-white dark:bg-obsidian sm:rounded-[2.5rem] sm:border-[8px] sm:border-gray-200 dark:sm:border-gray-900 shadow-2xl overflow-hidden flex flex-col ring-1 ring-black/5 dark:ring-white/10">
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
    <div className="relative w-full h-[100dvh] overflow-hidden bg-white dark:bg-obsidian text-gray-900 dark:text-white font-body selection:bg-brand-mid selection:text-white flex justify-center sm:items-center sm:bg-gray-100 dark:sm:bg-black transition-colors duration-300">
      <div className="w-full max-w-md h-full sm:h-[90dvh] relative bg-white dark:bg-obsidian sm:rounded-[2.5rem] sm:border-[8px] sm:border-gray-200 dark:sm:border-gray-900 shadow-2xl overflow-hidden flex flex-col ring-1 ring-black/5 dark:ring-white/10 transition-colors duration-300">
        
        {/* Scanline effect overlay - Reduced opacity in light mode */}
        <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(rgba(18,16,16,0)_50%,rgba(0,0,0,0.1)_50%),linear-gradient(90deg,rgba(255,0,0,0.03),rgba(0,255,0,0.01),rgba(0,0,255,0.03))] z-[100] bg-[length:100%_2px,3px_100%] opacity-0 dark:opacity-20"></div>

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
                <div className="flex flex-col h-full bg-white dark:bg-obsidian transition-colors duration-300">
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
                                        className="w-10 h-10 rounded-full bg-white/80 dark:bg-black/20 backdrop-blur-md border border-yellow-500/30 text-yellow-500 flex items-center justify-center shadow-[0_0_15px_rgba(234,179,8,0.15)] hover:bg-yellow-500/10 hover:scale-110 transition-all active:scale-95 group"
                                    >
                                        <RotateCcw size={18} className="group-hover:-rotate-90 transition-transform duration-500" />
                                    </button>
                                </div>

                                <div className="text-gray-400 dark:text-gray-500 flex flex-col items-center animate-pulse">
                                    <Ghost className="mb-4 opacity-50" size={40} />
                                    <span className="text-sm font-medium">Le vide cosmique...</span>
                                    <button 
                                        onClick={() => setShowFiltersModal(true)}
                                        className="mt-4 px-6 py-2 glass-button rounded-full text-xs font-bold hover:bg-black/5 dark:hover:bg-white/10 transition-colors uppercase tracking-widest text-gray-800 dark:text-white"
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
                <div className="flex flex-col h-full bg-white dark:bg-obsidian transition-colors duration-300">
                    <div className="p-6 pb-4 border-b border-gray-200 dark:border-white/5 bg-white/90 dark:bg-obsidian/90 backdrop-blur z-10 pt-[max(env(safe-area-inset-top),1.5rem)] transition-colors">
                        <h2 className="text-3xl font-display font-bold text-gray-900 dark:text-white">Connexions</h2>
                    </div>
                    <div className="flex-1 overflow-y-auto p-4 space-y-3 custom-scrollbar pb-24">
                        <div 
                            onClick={() => navigate('/likes')}
                            className="mb-6 p-1 rounded-2xl bg-gradient-to-r from-brand-mid to-brand-end p-[1px] cursor-pointer active:scale-[0.98] transition-transform shadow-md"
                        >
                            <div className="bg-white dark:bg-carbon rounded-2xl p-4 flex items-center justify-between">
                                <div className="flex items-center gap-3">
                                        <div className="w-12 h-12 rounded-full bg-gray-50 dark:bg-white/5 flex items-center justify-center shadow-glow-brand relative border border-gray-100 dark:border-white/10">
                                            <Crown size={20} className="text-brand-end" fill="currentColor" />
                                            {pendingLikes.length > 0 && <div className="absolute -top-1 -right-1 w-5 h-5 bg-brand-end rounded-full flex items-center justify-center text-[10px] font-bold border border-white dark:border-obsidian animate-bounce text-white">{pendingLikes.length}</div>}
                                        </div>
                                        <div>
                                            <h3 className="font-bold text-gray-900 dark:text-white text-sm">Âmes intéressées</h3>
                                            <p className="text-xs text-gray-500 dark:text-gray-400">Voir qui résonne avec vous</p>
                                        </div>
                                </div>
                                <div className="w-8 h-8 rounded-full bg-gray-50 dark:bg-white/5 flex items-center justify-center text-gray-400"><ArrowLeft size={16} className="rotate-180" /></div>
                            </div>
                        </div>

                        <h3 className="text-[10px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-widest mb-4 ml-2">Discussions</h3>
                        {matches.length === 0 && (
                            <div className="flex flex-col items-center justify-center h-32 opacity-40">
                                <Ghost className="w-10 h-10 mb-2 text-gray-400 dark:text-gray-600" />
                                <p className="text-xs text-gray-500">Aucune résonance pour le moment.</p>
                            </div>
                        )}
                        {matches.map(match => (
                            <div key={match.matchId} onClick={() => openChat(match)} className="glass-panel bg-white dark:bg-white/5 p-3 rounded-2xl flex items-center gap-4 cursor-pointer hover:bg-gray-50 dark:hover:bg-white/5 transition-all active:scale-[0.98] shadow-sm dark:shadow-none border border-gray-100 dark:border-white/5">
                                <div className="w-14 h-14 rounded-full overflow-hidden bg-gray-100 dark:bg-carbon relative border border-gray-200 dark:border-white/10 shadow-md">
                                    {match.isRevealed ? <img src={match.user.imageUrl} className="w-full h-full object-cover"/> : <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-gray-200 to-gray-400 dark:from-gray-800 dark:to-black"><Ghost className="w-6 h-6 text-brand-mid opacity-50"/></div>}
                                </div>
                                <div className="flex-1 min-w-0">
                                    <div className="flex justify-between items-baseline">
                                        <h3 className="font-display font-semibold text-lg truncate text-gray-900 dark:text-white">{match.user.name}</h3>
                                        <span className="text-[10px] text-brand-end font-bold bg-brand-end/10 px-2 py-0.5 rounded-full border border-brand-end/20">{match.user.compatibilityScore}%</span>
                                    </div>
                                    <p className="text-xs text-gray-500 dark:text-gray-400 truncate pr-4 mt-0.5 font-medium">
                                        {match.messages.length > 0 ? <span className={match.messages[match.messages.length-1].senderId === 'me' ? 'text-gray-400 dark:text-gray-500' : 'text-gray-600 dark:text-gray-300'}>
                                            {match.messages[match.messages.length-1].type === 'image' ? '📷 Photo' : match.messages[match.messages.length-1].type === 'audio' ? '🎙️ Message Vocal' : match.messages[match.messages.length-1].text}
                                        </span> : <span className="italic text-brand-mid flex items-center gap-1"><Sparkles size={10}/> La magie attend...</span>}
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
                <div className="flex flex-col h-full bg-white dark:bg-obsidian transition-colors duration-300">
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
                        isDarkMode={isDarkMode}
                        onToggleTheme={toggleTheme}
                    />
                </div>
            )} />

            {/* Edit Profile */}
            <Route path="/profile/edit" element={userProfile && (
                 <div className="flex flex-col h-full bg-white dark:bg-obsidian transition-colors duration-300">
                    <EditProfileView user={userProfile} onSave={handleUpdateProfile} onCancel={() => navigate('/settings')} />
                 </div>
            )} />

            {/* Profile Preview */}
            <Route path="/profile/preview" element={userProfile && (
                <div className="flex flex-col h-full relative bg-white dark:bg-obsidian transition-colors duration-300">
                     <div className="absolute top-0 left-0 right-0 p-4 z-50 pt-[max(env(safe-area-inset-top),1rem)]">
                        <button onClick={() => navigate('/settings')} className="flex items-center gap-2 text-gray-900 dark:text-white glass-button px-4 py-2 rounded-full shadow-lg"><ArrowLeft size={16} /> Retour</button>
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

const App: React.FC = () => {
  return (
    <ToastProvider>
      <AppContent />
    </ToastProvider>
  );
};

export default App;