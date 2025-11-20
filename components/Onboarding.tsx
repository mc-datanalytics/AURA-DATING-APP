
import React, { useState, useRef } from 'react';
import { Sparkles, ArrowRight, BrainCircuit, Camera, X, Plus, Ghost, Eye, Info, Calendar, User, Loader2 } from 'lucide-react';
import { AttachmentStyle, UserProfile, DiscoveryMode } from '../types';
import { QUESTIONS } from '../services/matchingService';
import { playClick, playMatchSuccess } from '../services/audioService';
import { uploadPhoto } from '../services/dataService';
import AuraLogo from './AuraLogo';

interface OnboardingProps {
  onComplete: (profile: Partial<UserProfile> & { mode: DiscoveryMode }) => void;
}

// Static Data for Interests
const INTERESTS_LIST = [
  "Voyage", "Cuisine", "Cinéma", "Lecture", "Randonnée", 
  "Photographie", "Musique", "Art", "Technologie", "Jeux Vidéo",
  "Yoga", "Sport", "Astronomie", "Philosophie", "Animaux", 
  "Mode", "Entrepreneuriat", "Politique", "Vin", "Histoire"
];

const Onboarding: React.FC<OnboardingProps> = ({ onComplete }) => {
  // Steps: INTRO -> NAME -> QUIZ -> RESULT -> DETAILS -> VISUALS -> SOUL
  const [step, setStep] = useState<'INTRO' | 'NAME' | 'QUIZ' | 'RESULT' | 'DETAILS' | 'VISUALS' | 'SOUL'>('INTRO');
  
  // --- DATA STATE ---
  const [name, setName] = useState('');
  const [quizIndex, setQuizIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<number, string>>({});
  
  // Details
  const [birthDate, setBirthDate] = useState('');
  const [gender, setGender] = useState<'Homme' | 'Femme' | 'Autre' | ''>('');
  
  // Visuals
  const [photos, setPhotos] = useState<string[]>([]);
  const [isUploading, setIsUploading] = useState(false); // New loading state
  const [isIncognito, setIsIncognito] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Soul
  const [bio, setBio] = useState('');
  const [selectedInterests, setSelectedInterests] = useState<string[]>([]);

  // --- HELPERS ---

  // Calculate MBTI based on answers
  const calculateMBTI = () => {
    const counts = { E: 0, I: 0, S: 0, N: 0, T: 0, F: 0, J: 0, P: 0 };
    QUESTIONS.filter(q => q.category === 'MBTI').forEach(q => {
      const val = answers[q.id] as keyof typeof counts;
      if (val) counts[val]++;
    });
    return (
      (counts.E >= counts.I ? 'E' : 'I') +
      (counts.S >= counts.N ? 'S' : 'N') +
      (counts.T >= counts.F ? 'T' : 'F') +
      (counts.J >= counts.P ? 'J' : 'P')
    );
  };

  // Determine Attachment based on majority
  const calculateAttachment = (): AttachmentStyle => {
    const counts: Record<string, number> = {};
    QUESTIONS.filter(q => q.category === 'ATTACHMENT').forEach(q => {
      const val = answers[q.id];
      counts[val] = (counts[val] || 0) + 1;
    });
    const sorted = Object.entries(counts).sort((a, b) => b[1] - a[1]);
    return sorted[0][0] as AttachmentStyle;
  };

  const calculateAge = (dateString: string) => {
    const today = new Date();
    const birthDate = new Date(dateString);
    let age = today.getFullYear() - birthDate.getFullYear();
    const m = today.getMonth() - birthDate.getMonth();
    if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) {
      age--;
    }
    return age;
  };

  // --- HANDLERS ---

  const handleStart = () => {
      playClick(600);
      setStep('NAME');
  }

  const handleNameNext = () => {
      if(name) {
          playClick(700);
          setStep('QUIZ');
      }
  }

  const handleAnswer = (value: string) => {
    playClick(800 + (quizIndex * 20));
    const newAnswers = { ...answers, [QUESTIONS[quizIndex].id]: value };
    setAnswers(newAnswers);

    if (quizIndex < QUESTIONS.length - 1) {
      setTimeout(() => setQuizIndex(quizIndex + 1), 250);
    } else {
      playMatchSuccess();
      setStep('RESULT');
    }
  };

  const handleResultNext = () => {
      playClick(700);
      setStep('DETAILS');
  }

  const handleDetailsNext = () => {
      if(birthDate && gender) {
          playClick(700);
          setStep('VISUALS');
      }
  }

  const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
      if (e.target.files && e.target.files[0]) {
          if (photos.length >= 6) return;
          
          setIsUploading(true);
          playClick(600);
          
          try {
            const publicUrl = await uploadPhoto(e.target.files[0]);
            if (publicUrl) {
                setPhotos([...photos, publicUrl]);
                playClick(800);
            } else {
                alert("Erreur lors de l'upload. Vérifiez votre connexion.");
            }
          } catch (err) {
              console.error(err);
          } finally {
              setIsUploading(false);
          }
      }
  };

  const removePhoto = (index: number) => {
      playClick(600);
      const newPhotos = [...photos];
      newPhotos.splice(index, 1);
      setPhotos(newPhotos);
  };

  const handleVisualsNext = () => {
      // Validation: If not incognito, need at least 1 photo
      if (!isIncognito && photos.length === 0) {
          alert("En mode Clairvoyance, une photo est requise.");
          return;
      }
      playClick(700);
      setStep('SOUL');
  }

  const toggleInterest = (interest: string) => {
      playClick(900);
      if (selectedInterests.includes(interest)) {
          setSelectedInterests(selectedInterests.filter(i => i !== interest));
      } else {
          if (selectedInterests.length < 5) {
              setSelectedInterests([...selectedInterests, interest]);
          }
      }
  }

  const finish = () => {
    playClick(700);
    const mbti = calculateMBTI();
    const attachment = calculateAttachment();
    const age = calculateAge(birthDate);

    onComplete({
      name,
      bio: bio || "Une âme mystérieuse...",
      mbti,
      attachment,
      age,
      imageUrl: photos.length > 0 ? photos[0] : `https://api.dicebear.com/7.x/avataaars/svg?seed=${name}`,
      photos: photos, // IMPORTANT: Passing the full array of photos
      interests: selectedInterests,
      mode: isIncognito ? DiscoveryMode.INCOGNITO : DiscoveryMode.CLAIRVOYANCE
    });
  };

  // --- RENDERERS ---

  if (step === 'INTRO') {
      return (
        <div className="flex flex-col items-center justify-center min-h-[80vh] p-6 text-center max-w-md mx-auto animate-float">
            {/* Ambient Background */}
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                 <div className="w-64 h-64 bg-brand-start rounded-full blur-[120px] opacity-30 animate-pulse-slow"></div>
            </div>
            
            <div className="mb-8 relative z-10">
                <div className="absolute inset-0 bg-white/20 blur-3xl opacity-20 rounded-full"></div>
                <AuraLogo size={120} className="relative z-10" />
            </div>
            <h1 className="text-6xl font-display font-bold mb-4 text-transparent bg-clip-text bg-gradient-to-r from-white via-purple-200 to-white tracking-tight">
                Aura
            </h1>
            <p className="text-xl text-gray-400 mb-12 font-body font-light max-w-xs">
                La rencontre commence par l'âme.
            </p>
            <button
                onClick={handleStart}
                className="w-full max-w-xs glass-button bg-gradient-to-r from-brand-start/80 to-brand-end/80 hover:opacity-100 text-white py-4 rounded-full font-display font-bold text-lg shadow-glow-brand transition-all transform hover:scale-105"
            >
                Commencer l'expérience
            </button>
        </div>
      );
  }

  if (step === 'NAME') {
      return (
        <div className="flex flex-col items-center justify-center min-h-[80vh] p-6 max-w-md mx-auto animate-fade-in">
             <h2 className="text-3xl font-display font-bold mb-8 text-center">Comment t'appelles-tu ?</h2>
             <input
                type="text"
                autoFocus
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Ton Prénom"
                className="w-full bg-transparent border-b-2 border-white/10 text-center text-4xl p-4 text-white placeholder-white/20 focus:outline-none focus:border-brand-end transition-all mb-12 font-display"
             />
             <button
                onClick={handleNameNext}
                disabled={!name}
                className="w-16 h-16 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center disabled:opacity-30 transition-all border border-white/10"
             >
                 <ArrowRight size={28} />
             </button>
        </div>
      );
  }

  if (step === 'QUIZ') {
      const q = QUESTIONS[quizIndex];
      const progress = ((quizIndex) / QUESTIONS.length) * 100;
      return (
        <div className="flex flex-col min-h-[80vh] max-w-md mx-auto p-6 justify-center animate-fade-in relative">
            <div className="w-full bg-white/5 h-1 rounded-full mb-10 fixed top-24 left-0 right-0 max-w-md mx-auto">
                <div className="bg-brand-end h-1 rounded-full transition-all duration-500 shadow-[0_0_10px_#FF4B6E]" style={{ width: `${progress}%` }}></div>
            </div>

            <span className="text-brand-mid text-[10px] font-bold tracking-[0.2em] uppercase mb-4">
                {q.category === 'MBTI' ? 'Analyse Psyché' : 'Analyse Cœur'}
            </span>
            
            <h2 className="text-2xl font-display font-bold mb-10 leading-relaxed text-white">
                {q.text}
            </h2>

            <div className="space-y-4">
                {q.options.map((opt, idx) => (
                    <button
                        key={idx}
                        onClick={() => handleAnswer(opt.value)}
                        className="w-full text-left p-6 rounded-2xl glass-button hover:bg-white/10 hover:border-brand-mid/50 transition-all active:scale-95 text-lg font-medium"
                    >
                        {opt.text}
                    </button>
                ))}
            </div>
        </div>
      );
  }

  if (step === 'RESULT') {
      const mbti = calculateMBTI();
      const attachment = calculateAttachment();
      return (
        <div className="flex flex-col items-center justify-center min-h-[80vh] p-6 text-center max-w-md mx-auto animate-fade-in">
            <div className="relative mb-8">
                <div className="absolute inset-0 bg-brand-start blur-3xl opacity-30 animate-pulse"></div>
                <BrainCircuit className="w-20 h-20 text-white relative z-10" />
            </div>
            
            <h2 className="text-4xl font-display font-bold mb-2">Ton Aura est révélée</h2>
            
            <div className="glass-panel p-8 rounded-3xl w-full my-8 border border-white/10 relative overflow-hidden">
                <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-brand-start via-brand-end to-brand-start"></div>
                
                <div className="grid grid-cols-2 gap-8">
                    <div>
                        <div className="text-[10px] text-gray-400 uppercase tracking-widest mb-2 font-bold">Personnalité</div>
                        <div className="text-4xl font-display font-bold text-white tracking-wider">{mbti}</div>
                    </div>
                    <div>
                        <div className="text-[10px] text-gray-400 uppercase tracking-widest mb-2 font-bold">Attachement</div>
                        <div className="text-xl font-display font-bold text-brand-end">{attachment}</div>
                    </div>
                </div>
            </div>
            
            <p className="text-gray-400 text-sm mb-8 max-w-xs leading-relaxed">
                "C'est la première étape. Complétons maintenant ton profil pour attirer les bonnes âmes."
            </p>

            <button
                onClick={handleResultNext}
                className="w-full glass-button bg-white/10 text-white py-4 rounded-full font-bold text-lg hover:bg-white/20 transition-all border border-white/20"
            >
                Finaliser mon profil
            </button>
        </div>
      );
  }

  if (step === 'DETAILS') {
      return (
          <div className="flex flex-col min-h-[80vh] max-w-md mx-auto p-6 pt-12 animate-fade-in">
              <h2 className="text-3xl font-display font-bold mb-2">Quelques détails...</h2>
              <p className="text-gray-500 text-sm mb-10">Pour l'algorithme karmique.</p>

              <div className="space-y-8">
                  <div>
                      <label className="block text-xs font-bold text-gray-400 uppercase mb-3 flex items-center gap-2 tracking-wider">
                          <Calendar size={14}/> Date de naissance
                      </label>
                      <input 
                          type="date" 
                          value={birthDate}
                          onChange={(e) => setBirthDate(e.target.value)}
                          className="w-full bg-white/5 border border-white/10 rounded-2xl p-4 text-white focus:border-brand-mid outline-none transition-all font-body"
                      />
                  </div>

                  <div>
                      <label className="block text-xs font-bold text-gray-400 uppercase mb-3 flex items-center gap-2 tracking-wider">
                          <User size={14}/> Genre
                      </label>
                      <div className="flex gap-3">
                          {['Homme', 'Femme', 'Autre'].map((g) => (
                              <button
                                  key={g}
                                  onClick={() => { playClick(); setGender(g as any); }}
                                  className={`flex-1 py-4 rounded-2xl border transition-all font-bold text-sm ${gender === g ? 'bg-brand-mid border-brand-mid text-white shadow-glow-brand' : 'bg-white/5 border-white/10 text-gray-400 hover:bg-white/10'}`}
                              >
                                  {g}
                              </button>
                          ))}
                      </div>
                  </div>
              </div>

              <div className="flex-1"></div>

              <button
                  onClick={handleDetailsNext}
                  disabled={!birthDate || !gender}
                  className="w-full glass-button bg-white/10 hover:bg-white/20 border border-white/10 text-white py-4 rounded-full font-bold disabled:opacity-30 disabled:cursor-not-allowed transition-all mt-8"
              >
                  Continuer
              </button>
          </div>
      );
  }

  if (step === 'VISUALS') {
      return (
          <div className="flex flex-col min-h-[80vh] max-w-md mx-auto p-6 pt-12 animate-fade-in">
              <h2 className="text-3xl font-display font-bold mb-2">Ton Image</h2>
              <p className="text-gray-500 text-sm mb-8">Choisis comment tu veux être vu(e).</p>

              {/* Incognito Switch - Neo Style */}
              <div className="glass-panel p-5 rounded-2xl mb-8 flex items-center justify-between border border-white/10 cursor-pointer transition-colors hover:bg-white/5" onClick={() => { playClick(); setIsIncognito(!isIncognito); }}>
                  <div>
                      <div className="flex items-center gap-2 font-bold text-white mb-1">
                          {isIncognito ? <Ghost size={18} className="text-brand-end"/> : <Eye size={18} className="text-brand-start"/>}
                          Mode {isIncognito ? 'Incognito' : 'Clairvoyance'}
                      </div>
                      <p className="text-[10px] text-gray-400 max-w-[200px]">
                          {isIncognito 
                              ? "Tes photos sont masquées par une aura fluide." 
                              : "Tu es visible."}
                      </p>
                  </div>
                  <div className={`w-12 h-7 rounded-full p-1 transition-colors duration-300 ${isIncognito ? 'bg-brand-end' : 'bg-carbon border border-white/20'}`}>
                      <div className={`w-5 h-5 rounded-full bg-white shadow-sm transition-transform duration-300 ${isIncognito ? 'translate-x-5' : 'translate-x-0'}`}></div>
                  </div>
              </div>

              {/* Photo Grid */}
              <div className="grid grid-cols-3 gap-3 mb-4">
                  {[0, 1, 2, 3, 4, 5].map((index) => (
                      <div key={index} className="aspect-[3/4] relative rounded-2xl overflow-hidden bg-white/5 border border-white/5 flex items-center justify-center group hover:border-white/20 transition-all">
                          {photos[index] ? (
                              <>
                                <img src={photos[index]} className="w-full h-full object-cover" alt="user" />
                                <button 
                                    onClick={() => removePhoto(index)}
                                    className="absolute top-1 right-1 bg-black/50 p-1.5 rounded-full text-white opacity-0 group-hover:opacity-100 transition-opacity backdrop-blur-sm"
                                >
                                    <X size={12} />
                                </button>
                                {index === 0 && (
                                    <div className="absolute bottom-0 left-0 right-0 bg-brand-start/80 backdrop-blur-sm text-[8px] text-center text-white py-1 font-bold uppercase tracking-widest">Principale</div>
                                )}
                              </>
                          ) : (
                              <div className="flex flex-col items-center justify-center text-gray-600 relative">
                                  {isUploading && index === photos.length ? (
                                      <Loader2 size={20} className="animate-spin text-brand-mid" />
                                  ) : (
                                      <>
                                          <Plus size={24} className="opacity-50" />
                                      </>
                                  )}
                              </div>
                          )}
                          {/* Hidden inputs */}
                          {!photos[index] && !isUploading && (
                               <input 
                                    type="file" 
                                    accept="image/*"
                                    className="absolute inset-0 opacity-0 cursor-pointer"
                                    onChange={handlePhotoUpload}
                               />
                          )}
                      </div>
                  ))}
              </div>
              
              <div className="flex-1"></div>

              <button
                  onClick={handleVisualsNext}
                  className="w-full glass-button bg-white/10 text-white py-4 rounded-full font-bold text-lg hover:bg-white/20 transition-all border border-white/20 mt-6"
              >
                  Continuer
              </button>
          </div>
      );
  }

  if (step === 'SOUL') {
      return (
          <div className="flex flex-col min-h-[80vh] max-w-md mx-auto p-6 pt-12 animate-fade-in">
              <h2 className="text-3xl font-display font-bold mb-2">Ton Esprit</h2>
              <p className="text-gray-500 text-sm mb-8">Ce qui te fait vibrer.</p>

              <div className="mb-8">
                  <label className="flex justify-between text-xs font-bold text-gray-400 uppercase mb-3 tracking-wider">
                      <span>Bio</span>
                      <span>{bio.length}/500</span>
                  </label>
                  <textarea 
                      value={bio}
                      onChange={(e) => setBio(e.target.value.slice(0, 500))}
                      placeholder="Raconte ton histoire..."
                      className="w-full h-32 bg-white/5 border border-white/10 rounded-2xl p-4 text-white placeholder-white/20 focus:border-brand-mid outline-none resize-none font-body text-lg"
                  />
              </div>

              <div className="mb-8">
                   <label className="flex justify-between text-xs font-bold text-gray-400 uppercase mb-3 tracking-wider">
                      <span>Intérêts ({selectedInterests.length}/5)</span>
                  </label>
                  <div className="flex flex-wrap gap-2">
                      {INTERESTS_LIST.map(interest => (
                          <button
                              key={interest}
                              onClick={() => toggleInterest(interest)}
                              className={`px-4 py-2 rounded-full text-xs font-bold border transition-all ${
                                  selectedInterests.includes(interest)
                                    ? 'bg-brand-mid text-white border-brand-mid shadow-glow-brand'
                                    : 'bg-white/5 text-gray-400 border-white/10 hover:bg-white/10'
                              }`}
                          >
                              {interest}
                          </button>
                      ))}
                  </div>
              </div>

              <div className="flex-1"></div>

              <button
                  onClick={finish}
                  className="w-full bg-gradient-to-r from-brand-start to-brand-end text-white py-4 rounded-full font-display font-bold text-xl shadow-glow-brand hover:opacity-90 transition-all transform hover:scale-[1.02]"
              >
                  Lancer Aura
              </button>
          </div>
      );
  }

  return null;
};

export default Onboarding;
