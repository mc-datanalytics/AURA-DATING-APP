
import React, { useState, useEffect, useRef } from 'react';
import { UserProfile, DiscoveryMode } from '../types';
import { Eye, Heart, X, Zap, Brain, Activity, ChevronUp, Lock, CheckCircle2, HelpCircle, Sparkles, Flame, Droplets, Mountain, Wind, Info, FileText, Leaf, Stars, Fingerprint, Shield, Play, Pause, Volume2, RotateCcw, MapPin, BadgeCheck, ShieldCheck } from 'lucide-react';
import CompatibilityChart from './CompatibilityChart';
import CompatibilityReportModal from './CompatibilityReportModal';
import clsx from 'clsx';
import { playSwipeRight, playSwipeLeft, playClick, playSuperLike } from '../services/audioService';
import { getElementColor } from '../services/auraEngine';
import ReportModal from './ReportModal';

interface ProfileCardProps {
  profile: UserProfile;
  currentUser?: UserProfile; 
  mode: DiscoveryMode;
  onSwipe: (direction: 'left' | 'right' | 'super') => void;
  onBlock?: (userId: string) => void;
  onRewind?: () => void;
}

const STAT_DEFINITIONS: Record<string, { question: string, desc: string, icon: any }> = {
    'Cœur': { question: "Sécurité Affective", desc: "Vos styles d'attachement créent-ils un refuge ou une tempête ?", icon: Heart },
    'Esprit': { question: "Connexion Mentale", desc: "Vos cerveaux (MBTI) se stimulent-ils intellectuellement ?", icon: Brain },
    'Karma': { question: "Équilibre Karmique", desc: "L'analyse comportementale de vos actions sur l'app.", icon: Activity },
    'Passions': { question: "Mode de Vie", desc: "Vos centres d'intérêt communs et vos goûts.", icon: Leaf },
    'Magie': { question: "L'Étincelle", desc: "Ce petit truc inexplicable qui dépasse les algorithmes.", icon: Stars }
};

const ProfileCard: React.FC<ProfileCardProps> = ({ profile, currentUser, mode, onSwipe, onBlock, onRewind }) => {
  const [swipeStatus, setSwipeStatus] = useState<'idle' | 'left' | 'right' | 'super'>('idle');
  const [dragX, setDragX] = useState(0);
  const [dragY, setDragY] = useState(0); 
  const [isDragging, setIsDragging] = useState(false);
  const [isAnimating, setIsAnimating] = useState(false); 
  const [currentPhotoIndex, setCurrentPhotoIndex] = useState(0);
  const [showDetails, setShowDetails] = useState(false);
  const [showReport, setShowReport] = useState(false);
  const [showReportModal, setShowReportModal] = useState(false);
  const [hoveredStat, setHoveredStat] = useState<string | null>(null);
  
  // Voice Aura State
  const [isPlayingVoice, setIsPlayingVoice] = useState(false);
  const audioRef = useRef<HTMLAudioElement>(null);
  
  const cardRef = useRef<HTMLDivElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);
  const startPos = useRef({ x: 0, y: 0 });
  const lastDragTime = useRef(0);

  const photos = profile.photos && profile.photos.length > 0 ? profile.photos : [profile.imageUrl];

  useEffect(() => {
    setSwipeStatus('idle'); setDragX(0); setDragY(0); setIsDragging(false); setIsAnimating(false);
    setCurrentPhotoIndex(0); setShowDetails(false); setShowReport(false); setHoveredStat(null); setShowReportModal(false);
    setIsPlayingVoice(false);
    if (contentRef.current) contentRef.current.scrollTop = 0;
  }, [profile.id]);

  // Handle Audio End
  useEffect(() => {
      const audio = audioRef.current;
      if (!audio) return;
      
      const handleEnded = () => setIsPlayingVoice(false);
      audio.addEventListener('ended', handleEnded);
      return () => audio.removeEventListener('ended', handleEnded);
  }, []);

  const toggleVoiceAura = (e: React.MouseEvent) => {
      e.stopPropagation();
      const audio = audioRef.current;
      if (!audio) return;

      if (isPlayingVoice) {
          audio.pause();
          setIsPlayingVoice(false);
      } else {
          playClick();
          audio.play();
          setIsPlayingVoice(true);
      }
  };

  // Handle Mouse Wheel (Scroll) to open/close details
  const handleWheel = (e: React.WheelEvent) => {
      if (showDetails) {
          // If details are open and we are at the top and scroll up, close details
          if (contentRef.current && contentRef.current.scrollTop === 0 && e.deltaY < -30) {
              toggleDetails();
          }
      } else {
          // If details are closed and we scroll down, open details
          if (e.deltaY > 30) {
              toggleDetails();
          }
      }
  };

  const handlePointerDown = (e: React.PointerEvent) => {
    if (showDetails || showReport || showReportModal || (e.target as HTMLElement).closest('button')) return;
    (e.target as HTMLElement).setPointerCapture(e.pointerId);
    startPos.current = { x: e.clientX, y: e.clientY };
    setIsDragging(true); setIsAnimating(false);
    lastDragTime.current = Date.now();
  };

  const handlePointerMove = (e: React.PointerEvent) => {
    if (!isDragging) return;
    const dx = e.clientX - startPos.current.x;
    const dy = e.clientY - startPos.current.y;
    
    if (Math.abs(dx) > Math.abs(dy)) {
        // Horizontal Swipe
        setDragX(dx);
        setDragY(dy * 0.2); // Dampen Y
    } else {
        // Vertical Movement
        setDragX(dx * 0.2); // Dampen X
        setDragY(dy);
    }
  };

  const handlePointerUp = (e: React.PointerEvent) => {
    if (!isDragging) return;
    setIsDragging(false);
    try { (e.target as HTMLElement).releasePointerCapture(e.pointerId); } catch (err) {}
    const velocity = Math.abs(dragX) / (Date.now() - lastDragTime.current);
    const velocityY = Math.abs(dragY) / (Date.now() - lastDragTime.current);

    // Tap Detection
    if (Math.abs(dragX) < 5 && Math.abs(dragY) < 5) {
        handleTapLogic(e);
        setDragX(0); setDragY(0);
        return;
    }

    // Swipe Left/Right
    if (Math.abs(dragX) > 100 || (Math.abs(dragX) > 50 && velocity > 0.5)) {
         if (dragX > 0) triggerSwipe('right');
         else triggerSwipe('left');
         return;
    }
    
    // Vertical Drag Logic
    if (dragY < -100 || (dragY < -50 && velocityY > 0.5)) {
        setShowDetails(true);
        playClick(700);
    } 

    resetCardPosition();
  };

  const handleTapLogic = (e: React.PointerEvent) => {
      const rect = e.currentTarget.getBoundingClientRect();
      const tapX = e.clientX - rect.left;
      if (tapX < rect.width * 0.35 && currentPhotoIndex > 0) { setCurrentPhotoIndex(prev => prev - 1); playClick(800); }
      else if (tapX > rect.width * 0.65 && currentPhotoIndex < photos.length - 1) { setCurrentPhotoIndex(prev => prev + 1); playClick(800); }
      else toggleDetails();
  };

  const resetCardPosition = () => { setIsAnimating(true); setDragX(0); setDragY(0); setTimeout(() => setIsAnimating(false), 300); };
  const triggerSwipe = (dir: 'left' | 'right' | 'super') => {
      setIsAnimating(true); setSwipeStatus(dir);
      if (dir === 'right') { setDragX(window.innerWidth + 200); playSwipeRight(); }
      else if (dir === 'left') { setDragX(-window.innerWidth - 200); playSwipeLeft(); }
      else { setDragY(-window.innerHeight); playSuperLike(); }
      setTimeout(() => onSwipe(dir), 300);
  };

  const toggleDetails = () => { playClick(700); setShowDetails(!showDetails); }

  const isIncognito = mode === DiscoveryMode.INCOGNITO;
  const score = profile.compatibilityScore || 50;
  const rotateDeg = dragX * 0.04;
  const details = profile.compatibilityDetails || { emotional: 50, intellectual: 50, lifestyle: 50, karmic: 50 };
  const auraColor = getElementColor(profile.aura?.dominantElement || 'TERRE');

  const isVerticalDragUp = dragY < 0 && Math.abs(dragY) > Math.abs(dragX);
  const cardTransform = isVerticalDragUp 
    ? `scale(${1 - Math.abs(dragY) * 0.0005})` 
    : `translateX(${dragX}px) translateY(${dragY}px) rotate(${rotateDeg}deg)`;
  const sheetTranslateY = showDetails ? '0%' : isVerticalDragUp ? `calc(100% + ${dragY}px)` : '100%';
  const infoOpacity = isVerticalDragUp ? Math.max(0, 1 - (Math.abs(dragY) / 200)) : 1;

  // Formattage de la distance
  const displayDistance = profile.distanceKm !== undefined 
      ? (profile.distanceKm < 1 ? "< 1 km" : `${Math.round(profile.distanceKm)} km`) 
      : null;

  // Simplified Chart Data for Grand Public
  const chartData = [
    { subject: 'Cœur', A: details.emotional, fullMark: 100 },
    { subject: 'Esprit', A: details.intellectual, fullMark: 100 },
    { subject: 'Passions', A: details.lifestyle, fullMark: 100 },
    { subject: 'Karma', A: details.karmic, fullMark: 100 },
    { subject: 'Magie', A: (score + details.karmic)/2, fullMark: 100 },
  ];

  const getElementIcon = (elem: string) => {
      switch(elem) {
          case 'FEU': return <Flame size={12} fill="currentColor" />;
          case 'EAU': return <Droplets size={12} fill="currentColor" />;
          case 'TERRE': return <Mountain size={12} fill="currentColor" />;
          case 'AIR': return <Wind size={12} fill="currentColor" />;
          default: return <Sparkles size={12} />;
      }
  }

  return (
    <>
    {showReport && currentUser && <CompatibilityReportModal me={currentUser} other={profile} onClose={() => setShowReport(false)} />}
    
    {showReportModal && (
        <ReportModal 
            userName={profile.name} 
            onClose={() => setShowReportModal(false)}
            onReport={(reason, details, block) => {
                if (block && onBlock) {
                    onBlock(profile.id);
                }
            }}
        />
    )}
    
    {/* Audio Element for Voice Aura */}
    {profile.voiceAuraUrl && <audio ref={audioRef} src={profile.voiceAuraUrl} preload="none" />}

    <div 
        className="relative w-full max-w-sm perspective-1000" 
        onWheel={handleWheel} // Native scroll support
        style={{ height: '62vh' }} // Reduced height to create space for bottom nav
    >
      {/* REWIND BUTTON - Top Left Positioning (Static) */}
      {onRewind && (
           <div className="absolute top-4 left-4 z-50">
                <button 
                    onClick={(e) => { e.stopPropagation(); playClick(); onRewind(); }} 
                    className="w-10 h-10 rounded-full bg-black/20 backdrop-blur-md border border-yellow-500/30 text-yellow-500 flex items-center justify-center shadow-[0_0_15px_rgba(234,179,8,0.15)] hover:bg-yellow-500/10 hover:scale-110 transition-all active:scale-95 group"
                >
                    <RotateCcw size={18} className="group-hover:-rotate-90 transition-transform duration-500" />
                </button>
           </div>
      )}

      <div 
        ref={cardRef}
        className={clsx("relative w-full h-full rounded-[2rem] overflow-hidden bg-white dark:bg-carbon select-none touch-none shadow-[0_25px_50px_-12px_rgba(0,0,0,0.3)] dark:shadow-[0_25px_50px_-12px_rgba(0,0,0,0.8)]", isAnimating && "transition-transform duration-300 cubic-bezier(0.25, 0.8, 0.25, 1)")}
        style={{ 
            transform: cardTransform,
            // Bioluminescent Inner Glow matching element - Reduced intensity for natural look
            boxShadow: `inset 0 0 20px ${auraColor}20` 
        }}
        onPointerDown={handlePointerDown} onPointerMove={handlePointerMove} onPointerUp={handlePointerUp} onPointerLeave={handlePointerUp}
      >
        {/* Overlay Feedback */}
        <div className="absolute top-10 left-8 z-50 border-[6px] border-green-400 rounded-xl px-4 py-1 -rotate-12 transition-opacity" style={{ opacity: Math.max(dragX/100, 0) }}><span className="text-4xl font-black text-green-400 uppercase tracking-widest">LIKE</span></div>
        <div className="absolute top-10 right-8 z-50 border-[6px] border-red-500 rounded-xl px-4 py-1 rotate-12 transition-opacity" style={{ opacity: Math.max(-dragX/100, 0) }}><span className="text-4xl font-black text-red-500 uppercase tracking-widest">NOPE</span></div>
        
        {/* Image Layer */}
        <div className="relative w-full h-full">
            
            {/* Distance Badge (Top Right) - Dynamic Location */}
            {!isIncognito && displayDistance && (
                <div className="absolute top-4 right-4 z-20 px-3 py-1.5 rounded-full bg-black/20 backdrop-blur-md border border-white/10 flex items-center gap-1.5 text-white/80 shadow-lg">
                    <MapPin size={10} />
                    <span className="text-[10px] font-bold tracking-wider uppercase">{displayDistance}</span>
                </div>
            )}

            {isIncognito ? (
                 // FLUID SHADER SIMULATION (CSS)
                 <div className="w-full h-full flex flex-col items-center justify-center relative overflow-hidden bg-black">
                     <div className="absolute inset-0 animate-fluid opacity-80" style={{ 
                         background: `linear-gradient(45deg, ${auraColor}, #000, ${auraColor})`,
                         backgroundSize: '200% 200%'
                     }}></div>
                     <div className="absolute inset-0 backdrop-blur-3xl"></div>
                     
                     <div className="relative z-10 text-white/80 mix-blend-overlay animate-breathing"><Brain size={80} strokeWidth={1} /></div>
                     
                     <div className="absolute top-6 right-6 bg-black/40 backdrop-blur-md px-3 py-1.5 rounded-full flex items-center gap-2 z-20 border border-white/10 shadow-lg">
                         <Lock size={12} className="text-white" />
                         <span className="text-[10px] font-bold uppercase text-white tracking-widest">Incognito</span>
                     </div>
                 </div>
            ) : (
                <img src={photos[currentPhotoIndex]} className="w-full h-full object-cover pointer-events-none" />
            )}

            {/* Elemental Border (Subtle Inner Line) */}
            <div className="absolute inset-0 border-[1px] opacity-40 pointer-events-none rounded-[2rem]" style={{ borderColor: auraColor }}></div>

            {/* Photo Indicators (Minimalist Dots) */}
            {!isIncognito && photos.length > 1 && (
                <div className="absolute top-4 left-0 right-0 flex justify-center gap-2 z-20">
                    {photos.map((_, idx) => (
                        <div key={idx} className={clsx("h-1.5 rounded-full transition-all duration-300 backdrop-blur-sm shadow-sm", idx === currentPhotoIndex ? "w-6 bg-white" : "w-1.5 bg-white/40")} />
                    ))}
                </div>
            )}

            {/* Info Overlay (Neo-Glass Gradient Tinted by Aura) */}
            <div 
                className="absolute bottom-0 left-0 right-0 h-3/5 z-20 flex flex-col justify-end px-6 pb-24 transition-opacity duration-300"
                style={{ 
                    opacity: infoOpacity,
                    // Very Subtle Tinted Gradient to keep photo natural (20 hex = ~12% opacity)
                    background: `linear-gradient(to top, #050505 10%, ${auraColor}20 50%, transparent 100%)`
                }}
            >
                 <div className="pointer-events-auto cursor-pointer" onClick={toggleDetails}>
                      {/* Top Badges */}
                      <div className="flex items-center gap-2 mb-3">
                          <div className="px-3 py-1 rounded-full bg-black/40 backdrop-blur-md border border-white/10 text-[10px] font-bold uppercase flex items-center gap-1.5 text-white shadow-glass">
                               <Zap size={12} fill="currentColor" className="text-yellow-400" /> {score}%
                          </div>
                          <div className="px-3 py-1 rounded-full bg-black/40 backdrop-blur-md border border-white/10 text-[10px] font-bold uppercase flex items-center gap-1.5 text-white/90 shadow-glass">
                               <span style={{ color: auraColor }}>{getElementIcon(profile.aura?.dominantElement || 'TERRE')}</span> {profile.aura?.dominantElement}
                          </div>
                          
                          {/* VOICE AURA BUTTON */}
                          {profile.voiceAuraUrl && (
                              <button 
                                onClick={toggleVoiceAura}
                                className={clsx("ml-auto px-3 py-1 rounded-full backdrop-blur-md border flex items-center gap-1.5 text-[10px] font-bold uppercase transition-all active:scale-95 shadow-glass", isPlayingVoice ? "bg-white/20 text-white border-white/40" : "bg-black/40 text-white border-white/10 hover:bg-white/10")}
                              >
                                  {isPlayingVoice ? <span className="flex items-center gap-0.5"><span className="w-0.5 h-2 bg-white animate-[pulse_0.5s_ease-in-out_infinite]"/> <span className="w-0.5 h-3 bg-white animate-[pulse_0.7s_ease-in-out_infinite]"/> <span className="w-0.5 h-2 bg-white animate-[pulse_0.6s_ease-in-out_infinite]"/></span> : <Volume2 size={12} />}
                              </button>
                          )}
                      </div>

                      {/* Name & Age & Verified - Clash Display */}
                      <div className="flex items-end gap-2 mb-1">
                          <h2 className="text-4xl font-display font-bold text-white drop-shadow-lg tracking-tight">{profile.name}</h2>
                          {/* Verified Badge */}
                          {profile.isVerified && (
                             <ShieldCheck size={24} className="text-brand-mid mb-2 drop-shadow-lg fill-white" strokeWidth={1.5} />
                          )}
                          <span className="text-2xl font-display font-light text-gray-300 mb-1.5 ml-1">{profile.age}</span>
                      </div>

                      <p className="text-sm text-gray-200 line-clamp-2 opacity-90 font-body font-medium leading-relaxed">"{profile.bio}"</p>
                      <div className="flex items-center justify-center gap-1 mt-4 opacity-50 text-[10px] uppercase tracking-[0.2em] font-bold text-white">
                           <ChevronUp size={12} className="animate-bounce" /> Détails
                      </div>
                 </div>
            </div>
        </div>

        {/* DETAILS SHEET (Expanded) - Adaptive Background */}
        <div 
            ref={contentRef}
            className={clsx("absolute inset-0 z-40 bg-white/95 dark:bg-obsidian/90 backdrop-blur-xl flex flex-col transition-transform duration-300 cubic-bezier(0.25, 0.8, 0.25, 1)")}
            style={{ transform: `translateY(${sheetTranslateY})` }}
            onWheel={handleWheel} 
        >
             <div className="p-6 pt-16 overflow-y-auto custom-scrollbar h-full text-gray-900 dark:text-white">
                 <button onClick={toggleDetails} className="absolute top-4 right-4 p-2 bg-gray-100 dark:bg-white/5 rounded-full text-gray-600 dark:text-white hover:bg-gray-200 dark:hover:bg-white/10 transition-colors"><ChevronUp size={24} className="rotate-180" /></button>
                 
                 <div className="text-center mb-8">
                     {/* Avatar with Elemental Ring */}
                     <div className="w-28 h-28 rounded-full mx-auto mb-4 p-1 relative shadow-[0_0_30px_rgba(0,0,0,0.2)] dark:shadow-[0_0_30px_rgba(0,0,0,0.5)]">
                         <div className="absolute inset-0 rounded-full border-2 border-dashed opacity-50 animate-spin-slow" style={{ borderColor: auraColor }}></div>
                         <img src={profile.imageUrl} className="w-full h-full rounded-full object-cover border-2 border-white dark:border-black" />
                         
                         {profile.voiceAuraUrl && (
                             <button 
                                onClick={toggleVoiceAura}
                                className="absolute -bottom-2 -right-2 w-10 h-10 rounded-full bg-white dark:bg-carbon border border-gray-200 dark:border-white/10 flex items-center justify-center shadow-lg hover:scale-110 transition-transform"
                             >
                                 {isPlayingVoice ? <span className="flex items-center gap-0.5 h-3"><span className="w-1 h-full bg-aura-accent animate-pulse"/> <span className="w-1 h-2/3 bg-aura-accent animate-pulse delay-75"/></span> : <Play size={14} fill="currentColor" className="text-aura-accent ml-1"/>}
                             </button>
                         )}
                     </div>
                     
                     <h2 className="text-3xl font-display font-bold text-gray-900 dark:text-white mb-1 flex items-center justify-center gap-2">
                        {profile.name}, {profile.age}
                        {profile.isVerified && <ShieldCheck size={24} className="text-brand-mid fill-white/10" />}
                     </h2>
                     
                     {/* Tags MBTI/Attachment */}
                     <div className="flex justify-center gap-2 opacity-70 mt-2">
                         <span className="px-3 py-1 rounded-lg bg-gray-100 dark:bg-white/5 text-[10px] text-gray-600 dark:text-gray-300 border border-gray-200 dark:border-white/5 font-bold uppercase tracking-widest">{profile.mbti}</span>
                         <span className="px-3 py-1 rounded-lg bg-gray-100 dark:bg-white/5 text-[10px] text-gray-600 dark:text-gray-300 border border-gray-200 dark:border-white/5 font-bold uppercase tracking-widest">{profile.attachment}</span>
                     </div>
                 </div>

                 <div className="space-y-6 pb-20">
                     
                     {/* Section Graphique */}
                     <div className="glass-panel rounded-3xl p-5 bg-white/80 dark:bg-white/5 border border-gray-100 dark:border-transparent">
                         <div className="flex justify-between items-center mb-4">
                             <h3 className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-widest flex gap-2 items-center"><Fingerprint size={14}/> Empreinte</h3>
                             <div className="px-2 py-0.5 rounded bg-gray-100 dark:bg-white/5 text-[10px] font-bold text-gray-900 dark:text-white border border-gray-200 dark:border-white/5">{score}%</div>
                         </div>
                         
                         <div className="h-48 relative mb-4">
                             <CompatibilityChart data={chartData} onHoverLabel={setHoveredStat} />
                         </div>

                         <div className="p-4 bg-gray-50 dark:bg-black/40 rounded-2xl text-center min-h-[80px] flex flex-col justify-center border border-gray-200 dark:border-white/5 transition-all">
                             <span className="text-xs font-bold text-gray-900 dark:text-white uppercase block mb-1 flex items-center justify-center gap-2 tracking-wider">
                                 {hoveredStat ? React.createElement(STAT_DEFINITIONS[hoveredStat].icon, { size: 14, className: "text-brand-mid" }) : <Sparkles size={14} className="text-brand-mid"/>}
                                 {hoveredStat ? STAT_DEFINITIONS[hoveredStat].question : "Analysez votre synergie"}
                             </span>
                             <span className="text-[10px] text-gray-500 dark:text-gray-400 leading-tight font-medium">
                                 {hoveredStat ? STAT_DEFINITIONS[hoveredStat].desc : "Touchez les dimensions ci-dessous."}
                             </span>
                         </div>

                         <div className="flex justify-between gap-2 mt-4 overflow-x-auto pb-2">
                             {Object.keys(STAT_DEFINITIONS).map((key) => {
                                 const Icon = STAT_DEFINITIONS[key].icon;
                                 const isActive = hoveredStat === key;
                                 return (
                                     <button
                                        key={key}
                                        onClick={() => { playClick(); setHoveredStat(key); }}
                                        className={clsx(
                                            "flex flex-col items-center justify-center p-3 rounded-xl min-w-[55px] transition-all border",
                                            isActive ? "bg-gray-100 dark:bg-white/10 border-gray-300 dark:border-white/20 text-gray-900 dark:text-white shadow-glass scale-105" : "bg-transparent border-transparent text-gray-500 dark:text-gray-600 hover:text-gray-700 dark:hover:text-gray-400"
                                        )}
                                     >
                                         <Icon size={18} className="mb-1.5" />
                                         <span className="text-[8px] font-bold uppercase tracking-wider">{key.substring(0,3)}</span>
                                     </button>
                                 )
                             })}
                         </div>
                     </div>

                     <div>
                         <h3 className="text-xs font-bold text-gray-500 uppercase mb-3 flex items-center gap-2 tracking-widest"><Leaf size={14}/> Passions</h3>
                         <div className="flex flex-wrap gap-2">{profile.interests.map(i => <span key={i} className="px-4 py-1.5 bg-gray-100 dark:bg-white/5 rounded-full text-xs text-gray-700 dark:text-white font-medium border border-gray-200 dark:border-white/5 hover:border-brand-mid hover:bg-brand-mid/10 transition-colors">{i}</span>)}</div>
                     </div>

                     <button onClick={() => { playClick(); setShowReport(true); }} className="w-full py-4 bg-gradient-to-r from-brand-mid/10 to-brand-end/10 border border-brand-mid/20 rounded-2xl text-xs font-bold text-brand-mid dark:text-white shadow-lg flex items-center justify-center gap-2 hover:bg-brand-mid/20 transition-all uppercase tracking-widest">
                         <FileText size={14} /> Rapport Cosmique complet
                     </button>

                     <div className="flex justify-center pt-4">
                         <button 
                            onClick={() => setShowReportModal(true)}
                            className="text-[10px] text-gray-400 hover:text-red-400 flex items-center gap-1.5 transition-colors font-bold uppercase tracking-wider"
                         >
                             <Shield size={12} /> Signaler
                         </button>
                     </div>
                 </div>
             </div>
        </div>
      </div>
      
      {/* Action Buttons - Floating Neo Style - Adjusted for Tinder-Standard Layout */}
      <div className={clsx("absolute -bottom-4 left-0 right-0 z-50 transition-all duration-300", showDetails ? "translate-y-20 opacity-0 pointer-events-none" : "translate-y-0 opacity-100")}>
           
           {/* Main Trio - Perfectly Centered */}
           <div className="flex justify-center items-center gap-6">
               <button onClick={() => triggerSwipe('left')} className="w-16 h-16 bg-white/90 dark:bg-carbon border border-gray-200 dark:border-white/5 rounded-full text-red-500 flex items-center justify-center shadow-glass hover:scale-110 hover:border-red-500 transition-all group">
                   <X size={32} className="group-hover:scale-110 transition-transform" />
               </button>
               
               <button onClick={() => triggerSwipe('super')} className="w-12 h-12 bg-white/90 dark:bg-carbon border border-brand-start/30 rounded-full text-brand-start dark:text-violet-400 flex items-center justify-center shadow-[0_0_20px_rgba(127,0,255,0.4)] hover:scale-110 hover:border-brand-start -translate-y-3 transition-all group">
                   <Zap size={22} fill="currentColor" className="group-hover:scale-110 transition-transform" />
               </button>
               
               <button onClick={() => triggerSwipe('right')} className="w-16 h-16 bg-white/90 dark:bg-carbon border border-gray-200 dark:border-white/5 rounded-full text-brand-end flex items-center justify-center shadow-glass hover:scale-110 hover:border-brand-end transition-all group">
                   <Heart size={32} fill="currentColor" className="group-hover:scale-110 transition-transform" />
               </button>
           </div>
      </div>
    </div>
    </>
  );
};

export default ProfileCard;
