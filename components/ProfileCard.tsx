
import React, { useState, useEffect, useRef } from 'react';
import { UserProfile, DiscoveryMode } from '../types';
import { Eye, Heart, X, Zap, Brain, Activity, ChevronUp, Lock, CheckCircle2, HelpCircle, Sparkles, Flame, Droplets, Mountain, Wind, Info, FileText, Leaf, Stars, Fingerprint } from 'lucide-react';
import CompatibilityChart from './CompatibilityChart';
import CompatibilityReportModal from './CompatibilityReportModal';
import clsx from 'clsx';
import { playSwipeRight, playSwipeLeft, playClick, playSuperLike } from '../services/audioService';
import { getElementColor } from '../services/auraEngine';

interface ProfileCardProps {
  profile: UserProfile;
  currentUser?: UserProfile; 
  mode: DiscoveryMode;
  onSwipe: (direction: 'left' | 'right' | 'super') => void;
}

const STAT_DEFINITIONS: Record<string, { question: string, desc: string, icon: any }> = {
    'Cœur': { question: "Sécurité Affective", desc: "Vos styles d'attachement créent-ils un refuge ou une tempête ?", icon: Heart },
    'Esprit': { question: "Connexion Mentale", desc: "Vos cerveaux (MBTI) se stimulent-ils intellectuellement ?", icon: Brain },
    'Karma': { question: "Équilibre Karmique", desc: "L'analyse comportementale de vos actions sur l'app.", icon: Activity },
    'Passions': { question: "Mode de Vie", desc: "Vos centres d'intérêt communs et vos goûts.", icon: Leaf },
    'Magie': { question: "L'Étincelle", desc: "Ce petit truc inexplicable qui dépasse les algorithmes.", icon: Stars }
};

const ProfileCard: React.FC<ProfileCardProps> = ({ profile, currentUser, mode, onSwipe }) => {
  const [swipeStatus, setSwipeStatus] = useState<'idle' | 'left' | 'right' | 'super'>('idle');
  const [dragX, setDragX] = useState(0);
  const [dragY, setDragY] = useState(0); 
  const [isDragging, setIsDragging] = useState(false);
  const [isAnimating, setIsAnimating] = useState(false); 
  const [currentPhotoIndex, setCurrentPhotoIndex] = useState(0);
  const [showDetails, setShowDetails] = useState(false);
  const [showReport, setShowReport] = useState(false);
  const [hoveredStat, setHoveredStat] = useState<string | null>(null);
  
  const cardRef = useRef<HTMLDivElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);
  const startPos = useRef({ x: 0, y: 0 });
  const lastDragTime = useRef(0);

  const photos = profile.photos && profile.photos.length > 0 ? profile.photos : [profile.imageUrl];

  useEffect(() => {
    setSwipeStatus('idle'); setDragX(0); setDragY(0); setIsDragging(false); setIsAnimating(false);
    setCurrentPhotoIndex(0); setShowDetails(false); setShowReport(false); setHoveredStat(null);
    if (contentRef.current) contentRef.current.scrollTop = 0;
  }, [profile.id]);

  const handlePointerDown = (e: React.PointerEvent) => {
    if (showDetails || showReport || (e.target as HTMLElement).closest('button')) return;
    (e.target as HTMLElement).setPointerCapture(e.pointerId);
    startPos.current = { x: e.clientX, y: e.clientY };
    setIsDragging(true); setIsAnimating(false);
    lastDragTime.current = Date.now();
  };

  const handlePointerMove = (e: React.PointerEvent) => {
    if (!isDragging) return;
    setDragX(e.clientX - startPos.current.x);
    setDragY(e.clientY - startPos.current.y);
  };

  const handlePointerUp = (e: React.PointerEvent) => {
    if (!isDragging) return;
    setIsDragging(false);
    try { (e.target as HTMLElement).releasePointerCapture(e.pointerId); } catch (err) {}
    const velocity = Math.abs(dragX) / (Date.now() - lastDragTime.current);

    if (Math.abs(dragX) < 5 && Math.abs(dragY) < 5) {
        handleTapLogic(e);
        setDragX(0); setDragY(0);
        return;
    }
    if (dragX > 100 || (dragX > 50 && velocity > 0.5)) triggerSwipe('right');
    else if (dragX < -100 || (dragX < -50 && velocity > 0.5)) triggerSwipe('left');
    else if (dragY < -150) triggerSwipe('super'); // Drag up for super like
    else resetCardPosition();
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

    <div className="relative w-full max-w-sm h-[75vh] perspective-1000">
      <div 
        ref={cardRef}
        className={clsx("relative w-full h-full rounded-3xl overflow-hidden shadow-[0_20px_50px_rgba(0,0,0,0.5)] bg-gray-900 select-none touch-none", isAnimating && "transition-transform duration-300 cubic-bezier(0.25, 0.8, 0.25, 1)")}
        style={{ transform: `translateX(${dragX}px) translateY(${dragY}px) rotate(${rotateDeg}deg)` }}
        onPointerDown={handlePointerDown} onPointerMove={handlePointerMove} onPointerUp={handlePointerUp} onPointerLeave={handlePointerUp}
      >
        {/* Overlay Feedback */}
        <div className="absolute top-10 left-8 z-50 border-[6px] border-green-400 rounded-xl px-4 py-1 -rotate-12 transition-opacity" style={{ opacity: Math.max(dragX/100, 0) }}><span className="text-4xl font-black text-green-400 uppercase tracking-widest">LIKE</span></div>
        <div className="absolute top-10 right-8 z-50 border-[6px] border-red-500 rounded-xl px-4 py-1 rotate-12 transition-opacity" style={{ opacity: Math.max(-dragX/100, 0) }}><span className="text-4xl font-black text-red-500 uppercase tracking-widest">NOPE</span></div>
        
        {/* Image Layer */}
        <div className="relative w-full h-full">
            {isIncognito ? (
                 <div className="w-full h-full flex flex-col items-center justify-center bg-gradient-to-b from-gray-800 to-black relative">
                     <div className="absolute inset-0 blur-[100px] opacity-40 animate-pulse-slow" style={{ backgroundColor: auraColor }}></div>
                     <div className="relative z-10 text-white/10"><Brain size={100} /></div>
                     <div className="absolute top-6 right-6 bg-white/10 px-3 py-1 rounded-full flex items-center gap-2 z-20 border border-white/10"><Lock size={12} className="text-aura-accent" /><span className="text-[10px] font-bold uppercase text-gray-200">Incognito</span></div>
                 </div>
            ) : (
                <img src={photos[currentPhotoIndex]} className="w-full h-full object-cover pointer-events-none" />
            )}

            {/* Subtle Aura Border */}
            <div className="absolute inset-0 border-[3px] opacity-30 pointer-events-none rounded-3xl" style={{ borderColor: auraColor }}></div>

            {/* Photo Indicators */}
            {!isIncognito && photos.length > 1 && (
                <div className="absolute top-2 left-0 right-0 flex gap-1.5 px-2 z-20">
                    {photos.map((_, idx) => (
                        <div key={idx} className="flex-1 h-1 bg-black/20 rounded-full overflow-hidden backdrop-blur-md">
                            <div className={clsx("h-full bg-white transition-all duration-300", idx === currentPhotoIndex ? "w-full" : idx < currentPhotoIndex ? "w-full" : "w-0")} />
                        </div>
                    ))}
                </div>
            )}

            {/* Info Overlay (Minimised) */}
            <div className="absolute bottom-0 left-0 right-0 h-1/2 bg-gradient-to-t from-black via-black/60 to-transparent z-20 flex flex-col justify-end px-5 pb-24">
                 <div className="pointer-events-auto cursor-pointer" onClick={toggleDetails}>
                      <div className="flex items-center gap-2 mb-2">
                          <div className="px-2 py-0.5 rounded-md bg-white/10 backdrop-blur-md border border-white/10 text-[10px] font-bold uppercase flex items-center gap-1 text-white shadow-lg">
                               <Zap size={10} fill="currentColor" className="text-yellow-400" /> {score}% Compatible
                          </div>
                          <div className="px-2 py-0.5 rounded-md bg-white/10 backdrop-blur-md border border-white/10 text-[10px] font-bold uppercase flex items-center gap-1 text-white/80">
                               <span style={{ color: auraColor }}>{getElementIcon(profile.aura?.dominantElement || 'TERRE')}</span> {profile.aura?.dominantElement}
                          </div>
                      </div>
                      <div className="flex items-end gap-3 mb-1">
                          <h2 className="text-4xl font-serif font-bold text-white drop-shadow-md">{profile.name}</h2>
                          <span className="text-2xl font-light text-gray-300">{profile.age}</span>
                      </div>
                      <p className="text-xs text-gray-200 line-clamp-2 opacity-90 italic">"{profile.bio}"</p>
                      <div className="flex items-center gap-1 mt-2 opacity-60 text-xs uppercase tracking-widest font-bold text-aura-accent">
                           <Info size={10} /> En savoir plus
                      </div>
                 </div>
            </div>
        </div>

        {/* DETAILS SHEET (Expanded) */}
        <div className={clsx("absolute inset-0 z-40 bg-black/60 backdrop-blur-xl transition-all duration-500 flex flex-col", showDetails ? "translate-y-0 opacity-100" : "translate-y-full opacity-0 pointer-events-none")}>
             <div className="p-6 pt-16 overflow-y-auto custom-scrollbar h-full">
                 <button onClick={toggleDetails} className="absolute top-4 right-4 p-2 bg-white/10 rounded-full text-white"><ChevronUp size={24} className="rotate-180" /></button>
                 
                 <div className="text-center mb-6">
                     {/* Avatar avec bordure d'élément */}
                     <div className="w-24 h-24 rounded-full mx-auto mb-3 p-1 border-2 relative shadow-2xl" style={{ borderColor: `${auraColor}60` }}>
                         <img src={profile.imageUrl} className="w-full h-full rounded-full object-cover" />
                     </div>
                     
                     <h2 className="text-3xl font-serif font-bold text-white mb-1">{profile.name}, {profile.age}</h2>
                     
                     {/* Barre de Statut Unifiée (Clean Design) */}
                     <div className="flex justify-center mt-3 mb-3">
                         <div className="inline-flex items-center bg-white/5 rounded-full p-1 border border-white/10 backdrop-blur-md shadow-lg">
                             {/* Compatibilité */}
                             <div className="px-4 py-1.5 rounded-full bg-gradient-to-r from-aura-mid to-aura-accent flex items-center gap-2 shadow-md">
                                 <Zap size={12} fill="currentColor" className="text-yellow-300" />
                                 <span className="text-xs font-bold text-white tracking-wide">{score}%</span>
                             </div>
                             
                             {/* Séparateur */}
                             <div className="w-px h-3 bg-white/20 mx-2"></div>
                             
                             {/* Élément */}
                             <div className="pr-4 pl-1 flex items-center gap-2">
                                 <span style={{ color: auraColor }}>{getElementIcon(profile.aura?.dominantElement || 'TERRE')}</span>
                                 <span className="text-xs font-bold text-gray-300 tracking-wide uppercase">{profile.aura?.dominantElement}</span>
                             </div>
                         </div>
                     </div>

                     {/* Tags MBTI/Attachment */}
                     <div className="flex justify-center gap-2 opacity-70">
                         <span className="px-3 py-1 rounded-lg bg-white/5 text-[10px] text-gray-300 border border-white/5 font-bold uppercase tracking-widest">{profile.mbti}</span>
                         <span className="px-3 py-1 rounded-lg bg-white/5 text-[10px] text-gray-300 border border-white/5 font-bold uppercase tracking-widest">{profile.attachment}</span>
                     </div>
                 </div>

                 <div className="space-y-6 pb-20">
                     
                     {/* Section Graphique & Explications */}
                     <div className="bg-white/5 rounded-2xl p-4 border border-white/5">
                         <div className="flex justify-between items-center mb-2">
                             <h3 className="text-xs font-bold text-gray-400 uppercase flex gap-2 items-center"><Fingerprint size={12}/> Empreinte de l'Aura</h3>
                         </div>
                         
                         {/* Le Graphique */}
                         <div className="h-40 relative mb-4">
                             <CompatibilityChart data={chartData} onHoverLabel={setHoveredStat} />
                         </div>

                         {/* Boîte de description (Feed-back) */}
                         <div className="p-3 bg-black/30 rounded-xl text-center min-h-[80px] flex flex-col justify-center border border-white/5 transition-all">
                             <span className="text-xs font-bold text-aura-accent uppercase block mb-1 flex items-center justify-center gap-2">
                                 {hoveredStat ? React.createElement(STAT_DEFINITIONS[hoveredStat].icon, { size: 12 }) : <Sparkles size={12}/>}
                                 {hoveredStat ? STAT_DEFINITIONS[hoveredStat].question : "Analysez votre synergie"}
                             </span>
                             <span className="text-[10px] text-gray-300 leading-tight">
                                 {hoveredStat ? STAT_DEFINITIONS[hoveredStat].desc : "Touchez les dimensions ci-dessous pour comprendre vos points de connexion."}
                             </span>
                         </div>

                         {/* Boutons Interactifs (Dimensions) */}
                         <div className="flex justify-between gap-1 mt-3 overflow-x-auto pb-1">
                             {Object.keys(STAT_DEFINITIONS).map((key) => {
                                 const Icon = STAT_DEFINITIONS[key].icon;
                                 const isActive = hoveredStat === key;
                                 return (
                                     <button
                                        key={key}
                                        onClick={() => { playClick(); setHoveredStat(key); }}
                                        className={clsx(
                                            "flex flex-col items-center justify-center p-2 rounded-lg min-w-[50px] transition-all",
                                            isActive ? "bg-aura-accent text-white shadow-lg scale-105" : "bg-white/5 text-gray-400 hover:bg-white/10"
                                        )}
                                     >
                                         <Icon size={16} className={clsx("mb-1", isActive ? "text-white" : "text-gray-500")} />
                                         <span className="text-[8px] font-bold uppercase">{key}</span>
                                     </button>
                                 )
                             })}
                         </div>
                     </div>

                     <div>
                         <h3 className="text-xs font-bold text-gray-500 uppercase mb-3 flex items-center gap-2"><Leaf size={12}/> Passions Communes</h3>
                         <div className="flex flex-wrap gap-2">{profile.interests.map(i => <span key={i} className="px-3 py-1 bg-white/5 rounded-full text-xs text-gray-300 border border-white/5 hover:border-aura-accent/50 transition-colors">{i}</span>)}</div>
                     </div>

                     <button onClick={() => { playClick(); setShowReport(true); }} className="w-full py-3 bg-gradient-to-r from-aura-mid to-aura-accent rounded-xl text-xs font-bold text-white shadow-lg flex items-center justify-center gap-2 hover:scale-[1.02] transition-transform">
                         <FileText size={14} /> Voir le rapport détaillé par IA
                     </button>
                 </div>
             </div>
        </div>
      </div>
      
      {/* Action Buttons */}
      <div className={clsx("absolute -bottom-6 left-0 right-0 flex justify-center gap-6 z-50 transition-all duration-300", showDetails ? "translate-y-20 opacity-0 pointer-events-none" : "translate-y-0 opacity-100")}>
           <button onClick={() => triggerSwipe('left')} className="w-14 h-14 bg-gray-900 border border-gray-800 rounded-full text-red-500 flex items-center justify-center shadow-xl hover:scale-110 hover:bg-red-500 hover:text-white transition-all"><X size={24} /></button>
           <button onClick={() => triggerSwipe('super')} className="w-10 h-10 bg-gray-900 border border-blue-900/50 rounded-full text-blue-400 flex items-center justify-center shadow-xl hover:scale-110 hover:bg-blue-500 hover:text-white -translate-y-2 transition-all"><Zap size={16} fill="currentColor" /></button>
           <button onClick={() => triggerSwipe('right')} className="w-14 h-14 bg-gray-900 border border-gray-800 rounded-full text-aura-accent flex items-center justify-center shadow-xl hover:scale-110 hover:bg-aura-accent hover:text-white transition-all"><Heart size={24} fill="currentColor" /></button>
      </div>
    </div>
    </>
  );
};

export default ProfileCard;
