
import React, { useState, useRef } from 'react';
import { UserProfile } from '../types';
import { ArrowLeft, Save, Plus, X, Star, Image as ImageIcon, Loader2, Info } from 'lucide-react';
import { playClick } from '../services/audioService';
import { uploadPhoto } from '../services/dataService';

interface EditProfileViewProps {
  user: UserProfile;
  onSave: (updatedProfile: UserProfile) => void;
  onCancel: () => void;
}

// Shared list (ideally centralize this)
const INTERESTS_LIST = [
  "Voyage", "Cuisine", "Cinéma", "Lecture", "Randonnée", 
  "Photographie", "Musique", "Art", "Technologie", "Jeux Vidéo",
  "Yoga", "Sport", "Astronomie", "Philosophie", "Animaux", 
  "Mode", "Entrepreneuriat", "Politique", "Vin", "Histoire"
];

const EditProfileView: React.FC<EditProfileViewProps> = ({ user, onSave, onCancel }) => {
  
  // Initialize photos from user.photos or fallback to imageUrl
  const [photos, setPhotos] = useState<string[]>(
    user.photos && user.photos.length > 0 ? user.photos : [user.imageUrl]
  );
  
  const [bio, setBio] = useState(user.bio);
  const [selectedInterests, setSelectedInterests] = useState<string[]>(user.interests);
  const [isUploading, setIsUploading] = useState(false);
  
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
        if (photos.length >= 6) return;
        
        setIsUploading(true);
        playClick(800);
        
        try {
             const publicUrl = await uploadPhoto(e.target.files[0]);
             if (publicUrl) {
                 setPhotos([...photos, publicUrl]);
                 playClick(800);
             } else {
                 alert("Erreur d'upload.");
             }
        } catch (error) {
            console.error(error);
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

  const setMainPhoto = (index: number) => {
    if (index === 0) return;
    playClick(700);
    const newPhotos = [...photos];
    const targetPhoto = newPhotos[index];
    // Swap
    newPhotos.splice(index, 1);
    newPhotos.unshift(targetPhoto);
    setPhotos(newPhotos);
  };

  const toggleInterest = (interest: string) => {
    playClick();
    if (selectedInterests.includes(interest)) {
        setSelectedInterests(selectedInterests.filter(i => i !== interest));
    } else {
        if (selectedInterests.length < 5) {
            setSelectedInterests([...selectedInterests, interest]);
        }
    }
  };

  const handleSave = () => {
      if (photos.length === 0) {
          alert("Il vous faut au moins une photo.");
          return;
      }
      playClick(900);
      
      const updatedUser: UserProfile = {
          ...user,
          bio,
          interests: selectedInterests,
          imageUrl: photos[0], // Main photo is always index 0
          photos: photos
      };
      
      onSave(updatedUser);
  };

  return (
    <div className="flex flex-col h-full bg-aura-dark relative">
        
        {/* Header */}
        <div className="flex items-center justify-between p-4 bg-aura-dark/90 backdrop-blur border-b border-white/10 sticky top-0 z-20">
            <button onClick={onCancel} className="text-gray-300 hover:text-white p-2">
                <ArrowLeft size={24} />
            </button>
            <h2 className="text-lg font-serif font-bold text-white">Modifier le profil</h2>
            <button 
                onClick={handleSave} 
                className="text-aura-accent font-bold hover:text-white transition-colors p-2 flex items-center gap-1"
            >
                <Save size={18} /> Sauver
            </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto custom-scrollbar p-6 pb-24 space-y-8">
            
            {/* Photos Section */}
            <section>
                <h3 className="text-xs font-bold text-gray-500 uppercase mb-3 flex items-center gap-2">
                    <ImageIcon size={14}/> Mes Photos ({photos.length}/6)
                </h3>

                {/* Guidelines Block - ADDED FOR QUALITY */}
                <div className="bg-white/5 border border-white/10 rounded-xl p-3 mb-4">
                  <div className="flex items-start gap-3">
                      <Info size={16} className="text-aura-accent shrink-0 mt-0.5"/>
                      <div className="text-xs text-gray-400">
                          <p className="font-bold text-gray-300 mb-1">Recommandations :</p>
                          <ul className="space-y-1 list-disc list-inside opacity-80">
                              <li>Formats <strong>JPG/PNG</strong>. La qualité compte !</li>
                              <li>La <strong>1ère photo</strong> doit montrer votre visage clairement.</li>
                              <li>Souriez, c'est contagieux.</li>
                          </ul>
                      </div>
                  </div>
                </div>

                <p className="text-[10px] text-gray-400 mb-3">La première photo est votre photo principale. Cliquez sur une photo pour la définir comme principale.</p>
                
                <div className="grid grid-cols-3 gap-3">
                    {/* Existing Photos */}
                    {photos.map((photo, index) => (
                        <div 
                            key={index} 
                            onClick={() => setMainPhoto(index)}
                            className={`aspect-[3/4] relative rounded-xl overflow-hidden bg-gray-800 border-2 cursor-pointer transition-all group ${index === 0 ? 'border-aura-accent shadow-[0_0_10px_rgba(176,106,179,0.3)]' : 'border-transparent hover:border-white/30'}`}
                        >
                            <img src={photo} className="w-full h-full object-cover" alt="user" />
                            
                            {index === 0 && (
                                <div className="absolute top-2 left-2 bg-aura-accent p-1 rounded-full shadow-lg">
                                    <Star size={10} fill="white" className="text-white" />
                                </div>
                            )}
                            
                            <button 
                                onClick={(e) => { e.stopPropagation(); removePhoto(index); }}
                                className="absolute top-1 right-1 bg-black/60 p-1.5 rounded-full text-white opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-500"
                            >
                                <X size={12} />
                            </button>
                        </div>
                    ))}

                    {/* Add Button */}
                    {photos.length < 6 && (
                        <label className="aspect-[3/4] rounded-xl bg-white/5 border border-dashed border-white/20 flex flex-col items-center justify-center cursor-pointer hover:bg-white/10 transition-all text-gray-400 hover:text-white hover:border-aura-accent relative">
                             {isUploading ? (
                                 <Loader2 className="animate-spin text-aura-accent" size={24} />
                             ) : (
                                 <>
                                    <Plus size={24} />
                                    <span className="text-[10px] mt-1 font-bold">Ajouter</span>
                                 </>
                             )}
                             <input 
                                type="file" 
                                accept="image/*" 
                                className="hidden" 
                                onChange={handlePhotoUpload}
                                disabled={isUploading}
                             />
                        </label>
                    )}
                </div>
            </section>

            {/* Bio Section */}
            <section>
                <h3 className="text-xs font-bold text-gray-500 uppercase mb-3 flex items-center justify-between">
                    <span>Votre Bio</span>
                    <span>{bio.length}/500</span>
                </h3>
                <textarea 
                    value={bio}
                    onChange={(e) => setBio(e.target.value.slice(0, 500))}
                    className="w-full h-32 bg-white/5 border border-white/10 rounded-xl p-4 text-white placeholder-gray-600 focus:border-aura-accent outline-none resize-none"
                    placeholder="Racontez votre histoire..."
                />
            </section>

            {/* Interests Section */}
            <section>
                <h3 className="text-xs font-bold text-gray-500 uppercase mb-3">
                    Passions ({selectedInterests.length}/5)
                </h3>
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
            </section>

        </div>
    </div>
  );
};

export default EditProfileView;
