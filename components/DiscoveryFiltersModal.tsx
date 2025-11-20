
import React, { useState, useRef, useEffect } from 'react';
import { DiscoverySettings } from '../types';
import { X, Check, Users, MapPin, Calendar, Footprints, Car, Plane, RefreshCw } from 'lucide-react';
import { playClick } from '../services/audioService';
import { updateUserLocation } from '../services/dataService';

interface DiscoveryFiltersModalProps {
  settings: DiscoverySettings;
  onSave: (settings: DiscoverySettings) => void;
  onClose: () => void;
}

const DiscoveryFiltersModal: React.FC<DiscoveryFiltersModalProps> = ({ settings, onSave, onClose }) => {
  const [minAge, setMinAge] = useState(settings.minAge);
  const [maxAge, setMaxAge] = useState(settings.maxAge);
  const [distance, setDistance] = useState(settings.distance);
  const [gender, setGender] = useState(settings.genderPreference);
  const [isUpdatingLocation, setIsUpdatingLocation] = useState(false);

  const handleSave = () => {
    playClick(900);
    onSave({
        minAge,
        maxAge,
        distance,
        genderPreference: gender
    });
  };
  
  const handleUpdateLocation = async () => {
      setIsUpdatingLocation(true);
      playClick();
      await updateUserLocation();
      setTimeout(() => setIsUpdatingLocation(false), 1000); // Visual feedback
  }

  // --- DUAL SLIDER LOGIC ---
  const handleAgeChange = (e: React.ChangeEvent<HTMLInputElement>, type: 'min' | 'max') => {
      const val = parseInt(e.target.value);
      if (type === 'min') {
          const newMin = Math.min(val, maxAge - 1);
          setMinAge(newMin);
      } else {
          const newMax = Math.max(val, minAge + 1);
          setMaxAge(newMax);
      }
  };

  // Calculate percentage for the colored track (Range 18-60)
  const getPercent = (val: number) => ((val - 18) / (60 - 18)) * 100;
  const minPos = getPercent(minAge);
  const maxPos = getPercent(maxAge);

  return (
    <div className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center p-0 sm:p-4">
      {/* Injected Styles for Dual Range Slider Thumbs */}
      <style>{`
        .range-slider-thumb::-webkit-slider-thumb {
            pointer-events: auto;
            width: 28px;
            height: 28px;
            border-radius: 50%;
            -webkit-appearance: none;
            background: white;
            box-shadow: 0 4px 10px rgba(0,0,0,0.3);
            border: 2px solid #FF4B6E; /* brand-end */
            cursor: pointer;
            margin-top: -10px; /* Center on track (track h-2 = 8px, thumb 28px -> -10px offset) */
        }
        .range-slider-thumb::-moz-range-thumb {
            pointer-events: auto;
            width: 28px;
            height: 28px;
            border: none;
            border-radius: 50%;
            background: white;
            box-shadow: 0 4px 10px rgba(0,0,0,0.3);
            border: 2px solid #FF4B6E;
            cursor: pointer;
        }
      `}</style>
      
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/80 backdrop-blur-md transition-opacity animate-fade-in" onClick={onClose}></div>
      
      <div className="relative w-full max-w-md bg-white dark:bg-gradient-to-b dark:from-gray-900 dark:to-black rounded-t-[2.5rem] sm:rounded-[2.5rem] border-t sm:border border-gray-200 dark:border-white/10 shadow-[0_-10px_40px_rgba(0,0,0,0.1)] dark:shadow-[0_-10px_40px_rgba(0,0,0,0.5)] animate-slide-up overflow-hidden flex flex-col max-h-[90vh] transition-colors duration-300">
        
        {/* Mobile Handle */}
        <div className="w-full flex justify-center pt-3 pb-1 sm:hidden" onClick={onClose}>
            <div className="w-12 h-1.5 bg-gray-300 dark:bg-white/20 rounded-full"></div>
        </div>

        {/* Header */}
        <div className="flex items-center justify-between px-6 py-6 shrink-0">
            <h2 className="text-2xl font-serif font-bold text-gray-900 dark:text-white">Préférences</h2>
            <button 
                onClick={onClose} 
                className="w-10 h-10 bg-gray-100 dark:bg-white/5 rounded-full flex items-center justify-center hover:bg-gray-200 dark:hover:bg-white/10 text-gray-500 dark:text-gray-400 hover:text-black dark:hover:text-white transition-colors"
            >
                <X size={20} />
            </button>
        </div>

        <div className="px-6 pb-8 space-y-10 overflow-y-auto custom-scrollbar flex-1">
            
            {/* 1. GENDER */}
            <section>
                <label className="text-xs font-bold text-gray-500 uppercase mb-4 flex items-center gap-2 tracking-wider">
                    <Users size={14} /> Je souhaite rencontrer
                </label>
                <div className="flex p-1 bg-gray-100 dark:bg-white/5 rounded-2xl border border-gray-200 dark:border-white/5 relative overflow-hidden">
                    {/* Animated Background for active tab */}
                    <div 
                        className="absolute top-1 bottom-1 rounded-xl bg-white dark:bg-carbon border border-gray-200 dark:border-white/10 shadow-lg transition-all duration-300 ease-out z-0"
                        style={{
                            left: gender === 'Homme' ? '4px' : gender === 'Femme' ? '33.33%' : '66.66%',
                            width: 'calc(33.33% - 4px)',
                            transform: gender === 'Femme' ? 'translateX(2px)' : gender === 'ALL' ? 'translateX(-2px)' : 'none'
                        }}
                    ></div>

                    <button
                        onClick={() => { playClick(); setGender('Homme'); }}
                        className={`flex-1 py-3 rounded-xl text-sm font-bold transition-colors z-10 relative ${gender === 'Homme' ? 'text-black dark:text-white' : 'text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200'}`}
                    >
                        Hommes
                    </button>
                    <button
                        onClick={() => { playClick(); setGender('Femme'); }}
                        className={`flex-1 py-3 rounded-xl text-sm font-bold transition-colors z-10 relative ${gender === 'Femme' ? 'text-black dark:text-white' : 'text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200'}`}
                    >
                        Femmes
                    </button>
                    <button
                        onClick={() => { playClick(); setGender('ALL'); }}
                        className={`flex-1 py-3 rounded-xl text-sm font-bold transition-colors z-10 relative ${gender === 'ALL' ? 'text-black dark:text-white' : 'text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200'}`}
                    >
                        Tout
                    </button>
                </div>
            </section>

            {/* 2. AGE RANGE */}
            <section>
                <div className="flex justify-between items-center mb-8">
                    <label className="text-xs font-bold text-gray-500 uppercase flex items-center gap-2 tracking-wider">
                        <Calendar size={14} /> Tranche d'âge
                    </label>
                    <span className="text-lg font-bold text-gray-900 dark:text-white bg-gray-100 dark:bg-white/5 px-4 py-1.5 rounded-xl border border-gray-200 dark:border-white/5 shadow-inner min-w-[100px] text-center">
                        {minAge} - {maxAge} ans
                    </span>
                </div>
                
                <div className="relative h-8 flex items-center select-none">
                    {/* Track Background */}
                    <div className="absolute left-0 right-0 h-2 bg-gray-200 dark:bg-gray-800 rounded-full overflow-hidden"></div>

                    {/* Active Segment */}
                    <div 
                        className="absolute h-2 bg-brand-end rounded-full"
                        style={{ left: `${minPos}%`, right: `${100 - maxPos}%` }}
                    ></div>

                    {/* Inputs */}
                    <input 
                        type="range" min="18" max="60" value={minAge}
                        onChange={(e) => handleAgeChange(e, 'min')}
                        className="range-slider-thumb absolute w-full h-2 opacity-0 z-20 pointer-events-none appearance-none bg-transparent"
                    />
                    <input 
                        type="range" min="18" max="60" value={maxAge}
                        onChange={(e) => handleAgeChange(e, 'max')}
                        className="range-slider-thumb absolute w-full h-2 opacity-0 z-20 pointer-events-none appearance-none bg-transparent"
                    />

                    {/* Visual Thumbs (For visual fallback if CSS injection fails, positioned by JS) */}
                     <div 
                        className="absolute w-7 h-7 bg-white rounded-full shadow-lg border-2 border-brand-end pointer-events-none transition-transform flex items-center justify-center z-10"
                        style={{ left: `calc(${minPos}% - 14px)` }}
                    ></div>
                    <div 
                        className="absolute w-7 h-7 bg-white rounded-full shadow-lg border-2 border-brand-end pointer-events-none transition-transform flex items-center justify-center z-10"
                        style={{ left: `calc(${maxPos}% - 14px)` }}
                    ></div>
                </div>
            </section>

            {/* 3. DISTANCE */}
            <section>
                <div className="flex justify-between items-center mb-6">
                    <label className="text-xs font-bold text-gray-500 uppercase flex items-center gap-2 tracking-wider">
                        <MapPin size={14} /> Distance max
                    </label>
                    
                    <div className="flex items-center gap-2">
                        <button 
                            onClick={handleUpdateLocation}
                            disabled={isUpdatingLocation}
                            className="text-[10px] bg-gray-100 dark:bg-white/5 hover:bg-gray-200 dark:hover:bg-white/10 px-2 py-1 rounded-lg text-gray-500 dark:text-gray-400 flex items-center gap-1 transition-colors"
                        >
                           <RefreshCw size={10} className={isUpdatingLocation ? "animate-spin" : ""} />
                           {isUpdatingLocation ? "..." : "GPS"}
                        </button>
                        <span className="text-lg font-bold text-gray-900 dark:text-white bg-gray-100 dark:bg-white/5 px-4 py-1.5 rounded-xl border border-gray-200 dark:border-white/5 shadow-inner min-w-[80px] text-center">
                            {distance} km
                        </span>
                    </div>
                </div>

                <input 
                    type="range" 
                    min="2" max="200" step="2"
                    value={distance}
                    onChange={(e) => setDistance(parseInt(e.target.value))}
                    className="w-full h-2 bg-gray-200 dark:bg-gray-700 rounded-full appearance-none cursor-pointer accent-brand-end mb-8 hover:accent-brand-end transition-all"
                />

                {/* Presets */}
                <div className="grid grid-cols-3 gap-3">
                    <button 
                        onClick={() => { playClick(); setDistance(5); }} 
                        className={`py-3 px-2 rounded-xl border text-xs font-bold flex flex-col items-center gap-2 transition-all ${distance === 5 ? 'bg-brand-end/10 border-brand-end text-brand-end dark:text-white shadow-[0_0_15px_rgba(255,75,110,0.2)]' : 'bg-gray-50 dark:bg-white/5 border-gray-200 dark:border-white/5 text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-white/10'}`}
                    >
                        <Footprints size={18}/> Voisin (5km)
                    </button>
                    <button 
                        onClick={() => { playClick(); setDistance(25); }} 
                        className={`py-3 px-2 rounded-xl border text-xs font-bold flex flex-col items-center gap-2 transition-all ${distance === 25 ? 'bg-brand-end/10 border-brand-end text-brand-end dark:text-white shadow-[0_0_15px_rgba(255,75,110,0.2)]' : 'bg-gray-50 dark:bg-white/5 border-gray-200 dark:border-white/5 text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-white/10'}`}
                    >
                        <Car size={18}/> Ville (25km)
                    </button>
                    <button 
                        onClick={() => { playClick(); setDistance(100); }} 
                        className={`py-3 px-2 rounded-xl border text-xs font-bold flex flex-col items-center gap-2 transition-all ${distance === 100 ? 'bg-brand-end/10 border-brand-end text-brand-end dark:text-white shadow-[0_0_15px_rgba(255,75,110,0.2)]' : 'bg-gray-50 dark:bg-white/5 border-gray-200 dark:border-white/5 text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-white/10'}`}
                    >
                        <Plane size={18}/> Large (100km)
                    </button>
                </div>
            </section>
        </div>

        {/* Footer Action */}
        <div className="p-6 border-t border-gray-200 dark:border-white/5 bg-white/90 dark:bg-black/20 backdrop-blur-lg shrink-0">
            <button 
                onClick={handleSave}
                className="w-full py-4 bg-gradient-to-r from-brand-mid to-brand-end text-white font-bold rounded-xl shadow-lg hover:scale-[1.02] transition-transform active:scale-95 flex items-center justify-center gap-2 text-lg"
            >
                <Check size={22} />
                Appliquer les filtres
            </button>
        </div>

      </div>
    </div>
  );
};

export default DiscoveryFiltersModal;
