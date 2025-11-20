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
      
      const restoredId = await DataService.undoLastSwipe(userProfile.id);
      if (restoredId) {
          await loadDiscovery(userProfile);
      }
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
  const renderDiscoveryHeader = () => (
    <div className="relative z-50 flex flex-col bg-aura-dark/80 backdrop-blur-md border-b border-white/5 shadow-lg">
        <div className="flex items-center justify-between px-4 py-3">
             <div className="flex items-center gap-2">
                 <div className="p-1.5 bg-aura-accent/20 rounded-lg"><Users className="w-5 h-5 text-aura-accent" /></div>
                 <span className="font-serif font-bold text-xl text-transparent bg-clip-text bg-gradient-to-r from-purple-200 to-pink-200">Aura</span>
             </div>
             <div className="flex bg-black/30 rounded-full p-1 border border-white/5">
                <button onClick={() => switchMode(DiscoveryMode.INCOGNITO)} className={clsx("px-3 py-1.5 rounded-full text-[10px] font-bold flex items-center gap-1.5 transition-all", mode === DiscoveryMode.INCOGNITO ? "bg-aura-accent text-white shadow-lg" : "text-gray-400 hover:text-white")}>
                    <Ghost size={12} /> <span className="hidden sm:inline">Incognito</span>
                </button>
                <button onClick={() => switchMode(DiscoveryMode.CLAIRVOYANCE)} className={clsx("px-3 py-1.5 rounded-full text-[10px] font-bold flex items-center gap-1.5 transition-all", mode === DiscoveryMode.CLAIRVOYANCE ? "bg-aura-glow text-white shadow-lg" : "text-gray-400 hover:text-white")}>
                    <Users size={12} /> <span className="hidden sm:inline">Clairvoyance</span>
                </button>
             </div>
        </div>
        <div onClick={handleOpenDailyAura} className={clsx("w-full px-4 py-2 cursor-pointer transition-all duration-500 flex items-center justify-center gap-2 text-xs font-medium border-t border-white/5", userProfile?.isBoosted ? "bg-gradient-to-r from-yellow-500/10 to-amber-500/10 text-yellow-200 hover:bg-yellow-500/20" : "bg-gradient-to-r from-aura-mid/40 to-aura-accent/40 text-purple-200 hover:bg-aura-accent/50")}>
             {userProfile?.isBoosted ? (<><Zap size={12} className="text-yellow-400 animate-pulse" fill="currentColor" /><span>Boost Actif</span></>) : (<><Sparkles size={12} className="text-aura-accent animate-spin-slow" /><span>Aura du jour : <span className="italic opacity-80">"{DAILY_QUESTION}"</span></span></>)}
        </div>
    </div>
  );

  const renderBottomNav = () => {
    const p = location.pathname;
    const isDiscovery = p === '/discovery';
    const isMatches = p === '/matches' || p.startsWith('/chat') || p === '/likes';
    const isSettings = p === '/settings' || p === '/profile/edit';

    return (
        <div className="absolute bottom-0 w-full h-20 bg-gradient-to-t from-aura-dark to-transparent flex items-end justify-around pb-6 z-50 pointer-events-none">
            <div className="pointer-events-auto flex w-full justify-around max-w-md mx-auto">
                <button onClick={() => { playTransition(); navigate('/discovery'); }} className={clsx("flex flex-col items-center gap-1 transition-all active:scale-95 group", isDiscovery ? "text-aura-accent" : "text-gray-500")}>
                    <div className={clsx("p-2.5 rounded-full transition-all duration-300", isDiscovery ? "bg-aura-accent/10 shadow-[0_0_15px_rgba(176,106,179,0.2)] -translate-y-1" : "group-hover:bg-white/5")}><Users size={22} /></div>
                </button>
                <button onClick={() => { playTransition(); navigate('/matches'); }} className={clsx("flex flex-col items-center gap-1 relative transition-all active:scale-95 group", isMatches ? "text-aura-accent" : "text-gray-500")}>
                    <div className={clsx("p-2.5 rounded-full transition-all duration-300", isMatches ? "bg-aura-accent/10 shadow-[0_0_15px_rgba(176,106,179,0.2)] -translate-y-1" : "group-hover:bg-white/5")}><MessageSquare size={22} /></div>
                    {(matches.some(m => m.messages.length > 0 && m.messages[m.messages.length-1].senderId !== 'me') || pendingLikes.length > 0) && <span className="absolute top-2 right-2 w-2 h-2 bg-red-500 rounded-full border border-aura-dark animate-pulse"></span>}
                </button>
                <button onClick={() => { playTransition(); navigate('/settings'); }} className={clsx("flex flex-col items-center gap-1 transition-all active:scale-95 group", isSettings ? "text-aura-accent" : "text-gray-500")}>
                    <div className={clsx("p-2.5 rounded-full transition-all duration-300", isSettings ? "bg-aura-accent/10 shadow-[0_0_15px_rgba(176,106,179,0.2)] -translate-y-1" : "group-hover:bg-white/5")}><UserIcon size={22} /></div>
                </button>
            </div>
        </div>
    );
  };

  // If loading, use the main layout wrapper but show skeleton content to simulate "App is ready but fetching"
  if (isLoading) {
      return (
        <div className="relative w-full h-[100dvh] overflow-hidden bg-aura-dark flex justify-center sm:items-center sm:bg-gray-900">
            <div className="w-full max-w-md h-full sm:h-[90dvh] relative bg-aura-dark sm:rounded-[2.5rem] sm:border-[8px] sm:border-gray-800 shadow-2xl overflow-hidden flex flex-col ring-8 ring-black/50">
                 <div className="flex flex-col h-full">
                     {/* Fake Header for loading state */}
                     <div className="relative z-50 flex flex-col bg-aura-dark/80 backdrop-blur-md border-b border-white/5 shadow-lg">
                        <div className="flex items-center justify-between px-4 py-3">
                            <div className="flex items-center gap-2">
                                <div className="p-1.5 bg-aura-accent/20 rounded-lg"><Users className="w-5 h-5 text-aura-accent" /></div>
                                <span className="font-serif font-bold text-xl text-transparent bg-clip-text bg-gradient-to-r from-purple-200 to-pink-200">Aura</span>
                            </div>
                        </div>
                     </div>
                     <div className="flex-1 flex items-center justify-center p-4">
                        <SkeletonCard />
                     </div>
                 </div>
            </div>
        </div>
      )
  }

  // Determine if bottom nav should be shown
  const showBottomNav = ['/discovery', '/matches', '/settings', '/likes'].includes(location.pathname);

  return (
    <div className="relative w-full h-[100dvh] overflow-hidden bg-aura-dark text-white font-sans selection:bg-aura-accent selection:text-white flex justify-center sm:items-center sm:bg-gray-900">
      <div className="w-full max-w-md h-full sm:h-[90dvh] relative bg-aura-dark sm:rounded-[2.5rem] sm:border-[8px] sm:border-gray-800 shadow-2xl overflow-hidden flex flex-col ring-8 ring-black/50">
        
        <div className="hidden sm:block absolute -inset-[2px] rounded-[2.6rem] border border-white/10 pointer-events-none z-[100]"></div>
        
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
                    <div className="flex-1 relative flex items-center justify-center p-4 pb-20">
                        {profiles.length > 0 ? (
                            <ProfileCard key={profiles[0].id} profile={profiles[0]} currentUser={userProfile} mode={mode} onSwipe={handleSwipe} />
                        ) : (
                            <div className="text-gray-500 flex flex-col items-center animate-pulse">
                                <Ghost className="mb-4 opacity-50" size={40} />
                                <span className="text-sm">Plus aucun profil dans votre zone...</span>
                                <span className="text-xs mt-2">Revenez plus tard ou ajustez vos filtres.</span>
                                <button 
                                    onClick={() => setShowFiltersModal(true)}
                                    className="mt-4 px-4 py-2 bg-white/10 rounded-full text-xs font-bold hover:bg-white/20 transition-colors"
                                >
                                    Ajuster les filtres
                                </button>
                            </div>
                        )}
                        <div className="absolute top-6 left-6 flex flex-col gap-3">
                            <button onClick={handleRewind} className="p-3 rounded-full bg-black/40 backdrop-blur text-white/60 hover:text-white hover:bg-black/60 border border-white/5 transition-all active:scale-90 shadow-lg"><RotateCcw size={20} /></button>
                            <button onClick={() => { playClick(); setShowFiltersModal(true); }} className="p-3 rounded-full bg-black/40 backdrop-blur text-white/60 hover:text-white hover:bg-black/60 border border-white/5 transition-all active:scale-90 shadow-lg"><Sliders size={20} /></button>
                        </div>
                    </div>
                </div>
            )} />

            {/* Matches List */}
            <Route path="/matches" element={userProfile && (
                <div className="flex flex-col h-full">
                    <div className="p-6 pb-4 border-b border-white/5 bg-aura-dark/80 backdrop-blur z-10">
                        <h2 className="text-3xl font-serif font-bold bg-clip-text text-transparent bg-gradient-to-r from-purple-200 to-white">Connexions</h2>
                    </div>
                    <div className="flex-1 overflow-y-auto p-4 space-y-3 custom-scrollbar pb-24">
                        <div 
                            onClick={() => navigate('/likes')}
                            className="mb-6 p-4 rounded-2xl bg-gradient-to-r from-yellow-500/10 to-amber-500/10 border border-yellow-500/30 flex items-center justify-between cursor-pointer hover:bg-yellow-500/20 transition-all group"
                        >
                            <div className="flex items-center gap-3">
                                    <div className="w-12 h-12 rounded-full bg-gradient-to-br from-yellow-400 to-amber-600 flex items-center justify-center shadow-lg relative">
                                        <Crown size={20} className="text-white" fill="currentColor" />
                                        {pendingLikes.length > 0 && <div className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 rounded-full flex items-center justify-center text-[10px] font-bold border border-aura-dark animate-bounce">{pendingLikes.length}</div>}
                                    </div>
                                    <div>
                                        <h3 className="font-bold text-yellow-100 text-sm group-hover:text-white transition-colors">Ils vous ont liké</h3>
                                        <p className="text-xs text-yellow-200/60">Découvrez qui s'intéresse à vous.</p>
                                    </div>
                            </div>
                            <div className="bg-yellow-500/20 p-2 rounded-full text-yellow-400 group-hover:translate-x-1 transition-transform"><ArrowLeft size={16} className="rotate-180" /></div>
                        </div>

                        <h3 className="text-xs font-bold text-gray-500 uppercase tracking-widest mb-2">Vos Conversations</h3>
                        {matches.length === 0 && (
                            <div className="flex flex-col items-center justify-center h-32 opacity-40">
                                <Ghost className="w-10 h-10 mb-2 text-gray-600" />
                                <p className="text-xs text-gray-500">C'est calme par ici...</p>
                            </div>
                        )}
                        {matches.map(match => (
                            <div key={match.matchId} onClick={() => openChat(match)} className="glass-card p-3 rounded-2xl flex items-center gap-4 cursor-pointer hover:bg-white/5 transition-all border border-white/5 active:scale-[0.98]">
                                <div className="w-14 h-14 rounded-full overflow-hidden bg-gray-800 relative border border-white/10 shadow-md">
                                    {match.isRevealed ? <img src={match.user.imageUrl} className="w-full h-full object-cover"/> : <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-gray-800 to-black"><Ghost className="w-6 h-6 text-aura-accent opacity-50"/></div>}
                                </div>
                                <div className="flex-1 min-w-0">
                                    <div className="flex justify-between items-baseline">
                                        <h3 className="font-bold text-lg truncate text-gray-100">{match.user.name}</h3>
                                        <span className="text-[10px] text-aura-accent font-bold bg-aura-accent/10 px-2 py-0.5 rounded-full">{match.user.compatibilityScore}%</span>
                                    </div>
                                    <p className="text-xs text-gray-400 truncate pr-4 mt-0.5">
                                        {match.messages.length > 0 ? <span className={match.messages[match.messages.length-1].senderId === 'me' ? 'text-gray-500' : 'text-gray-300'}>{match.messages[match.messages.length-1].text}</span> : <span className="italic text-aura-accent/70 flex items-center gap-1"><Sparkles size={10}/> La magie attend...</span>}
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
                <ChatView sessions={matches} mode={mode} onUpdateMessages={handleUpdateChatMessages} />
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
                <div className="flex flex-col h-full relative bg-gray-900">
                     <div className="absolute top-0 left-0 right-0 p-4 z-50 bg-gradient-to-b from-black/50 to-transparent">
                        <button onClick={() => navigate('/settings')} className="flex items-center gap-2 text-white bg-black/30 backdrop-blur px-4 py-2 rounded-full border border-white/10"><ArrowLeft size={16} /> Retour</button>
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