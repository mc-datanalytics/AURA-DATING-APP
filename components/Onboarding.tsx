
import React, { useState, useRef } from 'react';
import { Sparkles, ArrowRight, BrainCircuit, Camera, X, Plus, Ghost, Eye, Info, Calendar, User, Loader2 } from 'lucide-react';
import { AttachmentStyle, UserProfile, DiscoveryMode } from '../types';
import { QUESTIONS } from '../services/matchingService';
import { playClick, playMatchSuccess } from '../services/audioService';
import { uploadPhoto } from '../services/dataService';

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
            <div className="mb-8 relative">
                <div className="absolute inset-0 bg-aura-accent blur-3xl opacity-20 rounded-full animate-pulse-slow"></div>
                <Sparkles className="w-20 h-20 text-aura-accent relative z-10" />
            </div>
            <h1 className="text-5xl font-serif font-bold mb-4 bg-clip-text text-transparent bg-gradient-to-r from-purple-200 to-pink-200">
                Aura
            </h1>
            <p className="text-xl text-gray-300 mb-8 font-light">
                La rencontre commence par l'âme.
            </p>
            <button
                onClick={handleStart}
                className="w-full max-w-xs bg-gradient-to-r from-aura-mid to-aura-accent hover:opacity-90 text-white py-4 rounded-xl font-semibold text-lg shadow-[0_0_20px_rgba(176,106,179,0.4)] transition-all transform hover:scale-105"
            >
                Commencer l'expérience
            </button>
        </div>
      );
  }

  if (step === 'NAME') {
      return (
        <div className="flex flex-col items-center justify-center min-h-[80vh] p-6 max-w-md mx-auto animate-fade-in">
             <h2 className="text-2xl font-serif mb-6">Comment t'appelles-tu ?</h2>
             <input
                type="text"
                autoFocus
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Ton prénom"
                className="w-full bg-white/10 border-b-2 border-white/20 text-center text-3xl p-4 text-white placeholder-gray-500 focus:outline-none focus:border-aura-accent transition-all mb-8"
             />
             <button
                onClick={handleNameNext}
                disabled={!name}
                className="bg-white/10 hover:bg-white/20 p-4 rounded-full disabled:opacity-30 transition-all"
             >
                 <ArrowRight size={32} />
             </button>
        </div>
      );
  }

  if (step === 'QUIZ') {
      const q = QUESTIONS[quizIndex];
      const progress = ((quizIndex) / QUESTIONS.length) * 100;
      return (
        <div className="flex flex-col min-h-[80vh] max-w-md mx-auto p-6 justify-center animate-fade-in">
            <div className="w-full bg-gray-800 h-1 rounded-full mb-8">
                <div className="bg-aura-accent h-1 rounded-full transition-all duration-500" style={{ width: `${progress}%` }}></div>
            </div>

            <span className="text-aura-accent text-xs font-bold tracking-widest uppercase mb-2">
                {q.category === 'MBTI' ? 'Analyse de la personnalité' : 'Analyse relationnelle'}
            </span>
            
            <h2 className="text-2xl font-serif font-bold mb-8 leading-relaxed">
                {q.text}
            </h2>

            <div className="space-y-4">
                {q.options.map((opt, idx) => (
                    <button
                        key={idx}
                        onClick={() => handleAnswer(opt.value)}
                        className="w-full text-left p-5 rounded-xl bg-white/5 border border-white/10 hover:bg-aura-accent/20 hover:border-aura-accent transition-all active:scale-95"
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
            <BrainCircuit className="w-16 h-16 text-aura-accent mb-6 animate-pulse" />
            <h2 className="text-3xl font-serif font-bold mb-2">Ton Aura est révélée</h2>
            <div className="glass-card p-8 rounded-2xl w-full my-6 border-t-4 border-aura-accent">
                <div className="grid grid-cols-2 gap-4 mb-6">
                    <div>
                        <div className="text-xs text-gray-400 uppercase tracking-widest mb-1">Personnalité</div>
                        <div className="text-3xl font-bold text-white">{mbti}</div>
                    </div>
                    <div>
                        <div className="text-xs text-gray-400 uppercase tracking-widest mb-1">Attachement</div>
                        <div className="text-xl font-bold text-aura-glow">{attachment}</div>
                    </div>
                </div>
                <p className="text-gray-300 text-sm italic">
                    "C'est la première étape. Complétons maintenant ton profil pour attirer les bonnes âmes."
                </p>
            </div>
            <button
                onClick={handleResultNext}
                className="w-full bg-gradient-to-r from-aura-mid to-aura-accent text-white py-4 rounded-xl font-bold shadow-lg hover:opacity-90 transition-all"
            >
                Finaliser mon profil
            </button>
        </div>
      );
  }

  if (step === 'DETAILS') {
      return (
          <div className="flex flex-col min-h-[80vh] max-w-md mx-auto p-6 pt-12 animate-fade-in">
              <h2 className="text-3xl font-serif font-bold mb-2">Quelques détails...</h2>
              <p className="text-gray-400 text-sm mb-8">Pour trouver des correspondances pertinentes.</p>

              <div className="space-y-6">
                  <div>
                      <label className="block text-xs font-bold text-gray-500 uppercase mb-2 flex items-center gap-2">
                          <Calendar size={14}/> Date de naissance
                      </label>
                      <input 
                          type="date" 
                          value={birthDate}
                          onChange={(e) => setBirthDate(e.target.value)}
                          className="w-full bg-white/5 border border-white/10 rounded-xl p-4 text-white focus:border-aura-accent outline-none"
                      />
                  </div>

                  <div>
                      <label className="block text-xs font-bold text-gray-500 uppercase mb-2 flex items-center gap-2">
                          <User size={14}/> Genre
                      </label>
                      <div className="flex gap-3">
                          {['Homme', 'Femme', 'Autre'].map((g) => (
                              <button
                                  key={g}
                                  onClick={() => { playClick(); setGender(g as any); }}
                                  className={`flex-1 py-3 rounded-xl border transition-all ${gender === g ? 'bg-aura-accent border-aura-accent text-white' : 'bg-white/5 border-white/10 text-gray-400 hover:bg-white/10'}`}
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
                  className="w-full bg-white/10 hover:bg-white/20 border border-white/10 text-white py-4 rounded-xl font-bold disabled:opacity-30 disabled:cursor-not-allowed transition-all mt-8"
              >
                  Continuer
              </button>
          </div>
      );
  }

  if (step === 'VISUALS') {
      return (
          <div className="flex flex-col min-h-[80vh] max-w-md mx-auto p-6 pt-12 animate-fade-in">
              <h2 className="text-3xl font-serif font-bold mb-2">Ton Image</h2>
              <p className="text-gray-400 text-sm mb-6">Choisis comment tu veux être vu(e).</p>

              {/* Photo Guidelines - ADDED FOR QUALITY */}
              <div className="bg-white/5 border border-white/10 rounded-xl p-4 mb-6">
                  <h3 className="text-xs font-bold text-gray-300 uppercase mb-2 flex items-center gap-2">
                      <Info size={14} className="text-aura-accent"/> Conseils Photo
                  </h3>
                  <ul className="text-xs text-gray-400 space-y-1.5">
                      <li className="flex items-start gap-2">
                          <span className="w-1.5 h-1.5 rounded-full bg-aura-accent/50 mt-1"></span>
                          <span><strong>Formats :</strong> JPG ou PNG. Evitez les photos floues.</span>
                      </li>
                      <li className="flex items-start gap-2">
                          <span className="w-1.5 h-1.5 rounded-full bg-aura-accent/50 mt-1"></span>
                          <span><strong>Photo 1 :</strong> Visage clair, sans lunettes de soleil.</span>
                      </li>
                      <li className="flex items-start gap-2">
                          <span className="w-1.5 h-1.5 rounded-full bg-aura-accent/50 mt-1"></span>
                          <span><strong>Contenu :</strong> Soyez seul(e) sur votre photo principale.</span>
                      </li>
                  </ul>
              </div>

              {/* Incognito Switch */}
              <div className="glass-card p-4 rounded-xl mb-8 flex items-center justify-between border border-white/10">
                  <div>
                      <div className="flex items-center gap-2 font-bold text-white mb-1">
                          {isIncognito ? <Ghost size={18} className="text-aura-accent"/> : <Eye size={18} className="text-aura-glow"/>}
                          Mode {isIncognito ? 'Incognito' : 'Clairvoyance'}
                      </div>
                      <p className="text-[10px] text-gray-400 max-w-[200px]">
                          {isIncognito 
                              ? "Tes photos sont floutées/masquées. Tu ne vois pas les photos des autres." 
                              : "Tu vois et montres tes photos normalement."}
                      </p>
                  </div>
                  <button 
                      onClick={() => { playClick(); setIsIncognito(!isIncognito); }}
                      className={`w-14 h-8 rounded-full p-1 transition-colors ${isIncognito ? 'bg-aura-accent' : 'bg-gray-600'}`}
                  >
                      <div className={`w-6 h-6 rounded-full bg-white shadow-sm transition-transform ${isIncognito ? 'translate-x-6' : 'translate-x-0'}`}></div>
                  </button>
              </div>

              {/* Photo Grid */}
              <div className="grid grid-cols-3 gap-3 mb-4">
                  {[0, 1, 2, 3, 4, 5].map((index) => (
                      <div key={index} className="aspect-[3/4] relative rounded-xl overflow-hidden bg-white/5 border border-white/10 flex items-center justify-center group">
                          {photos[index] ? (
                              <>
                                <img src={photos[index]} className="w-full h-full object-cover" alt="user" />
                                <button 
                                    onClick={() => removePhoto(index)}
                                    className="absolute top-1 right-1 bg-black/50 p-1 rounded-full text-white opacity-0 group-hover:opacity-100 transition-opacity"
                                >
                                    <X size={12} />
                                </button>
                                {index === 0 && (
                                    <div className="absolute bottom-0 left-0 right-0 bg-aura-accent/80 text-[8px] text-center text-white py-1 font-bold uppercase">Principale</div>
                                )}
                              </>
                          ) : (
                              <div className="flex flex-col items-center justify-center text-gray-600 relative">
                                  {isUploading && index === photos.length ? (
                                      <Loader2 size={20} className="animate-spin text-aura-accent" />
                                  ) : (
                                      <>
                                          <Plus size={20} />
                                          <span className="text-[8px] mt-1">Ajouter</span>
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
              
              {isIncognito && (
                  <div className="flex items-start gap-2 p-3 bg-blue-500/10 rounded-lg border border-blue-500/20 mb-4">
                      <Info size={16} className="text-blue-400 shrink-0 mt-0.5" />
                      <p className="text-xs text-blue-200">En mode Incognito, l'ajout de photos est optionnel mais recommandé pour le moment du dévoilement.</p>
                  </div>
              )}

              <div className="flex-1"></div>

              <button
                  onClick={handleVisualsNext}
                  className="w-full bg-gradient-to-r from-aura-mid to-aura-accent text-white py-4 rounded-xl font-bold shadow-lg hover:opacity-90 transition-all mt-4"
              >
                  Continuer
              </button>
          </div>
      );
  }

  if (step === 'SOUL') {
      return (
          <div className="flex flex-col min-h-[80vh] max-w-md mx-auto p-6 pt-12 animate-fade-in">
              <h2 className="text-3xl font-serif font-bold mb-2">Ton Esprit</h2>
              <p className="text-gray-400 text-sm mb-6">Dis-en plus sur ce qui te fait vibrer.</p>

              <div className="mb-6">
                  <label className="flex justify-between text-xs font-bold text-gray-500 uppercase mb-2">
                      <span>Bio</span>
                      <span>{bio.length}/500</span>
                  </label>
                  <textarea 
                      value={bio}
                      onChange={(e) => setBio(e.target.value.slice(0, 500))}
                      placeholder="Décris-toi en quelques mots... Ce que tu aimes, ce que tu cherches."
                      className="w-full h-32 bg-white/5 border border-white/10 rounded-xl p-4 text-white placeholder-gray-600 focus:border-aura-accent outline-none resize-none"
                  />
              </div>

              <div className="mb-8">
                   <label className="flex justify-between text-xs font-bold text-gray-500 uppercase mb-2">
                      <span>Intérêts ({selectedInterests.length}/5)</span>
                  </label>
                  <div className="flex flex-wrap gap-2">
                      {INTERESTS_LIST.map(interest => (
                          <button
                              key={interest}
                              onClick={() => toggleInterest(interest)}
                              className={`px-3 py-1.5 rounded-full text-xs font-medium border transition-all ${
                                  selectedInterests.includes(interest)
                                    ? 'bg-aura-accent text-white border-aura-accent'
                                    : 'bg-white/5 text-gray-400 border-white/10 hover:border-white/30'
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
                  className="w-full bg-gradient-to-r from-aura-mid to-aura-accent text-white py-4 rounded-xl font-bold shadow-lg hover:opacity-90 transition-all"
              >
                  Lancer Aura
              </button>
          </div>
      );
  }

  return null;
};

export default Onboarding;
