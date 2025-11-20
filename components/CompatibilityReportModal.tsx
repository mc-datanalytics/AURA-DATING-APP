
import React, { useEffect, useState } from 'react';
import { UserProfile } from '../types';
import { X, Sparkles, Brain, Heart, AlertTriangle, Lightbulb } from 'lucide-react';
import { generateCompatibilityReport } from '../services/geminiService';
import { playClick, playDailyAuraComplete } from '../services/audioService';

interface CompatibilityReportModalProps {
  me: UserProfile;
  other: UserProfile;
  onClose: () => void;
}

const CompatibilityReportModal: React.FC<CompatibilityReportModalProps> = ({ me, other, onClose }) => {
  const [loading, setLoading] = useState(true);
  const [report, setReport] = useState<{ title: string, synergy: string, challenges: string, advice: string } | null>(null);

  useEffect(() => {
    const fetchReport = async () => {
        // Artificial delay for "Magic" effect
        await new Promise(resolve => setTimeout(resolve, 1500));
        const data = await generateCompatibilityReport(me, other);
        setReport(data);
        setLoading(false);
        playDailyAuraComplete();
    };
    fetchReport();
  }, [me, other]);

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/90 backdrop-blur-xl animate-fade-in" onClick={onClose}></div>

      <div className="relative w-full max-w-md bg-gradient-to-b from-[#1a1528] to-[#0d0b1a] rounded-3xl border border-aura-accent/30 shadow-[0_0_60px_rgba(176,106,179,0.2)] overflow-hidden flex flex-col max-h-[90vh] animate-scale-in">
        
        <button 
            onClick={() => { playClick(); onClose(); }}
            className="absolute top-4 right-4 text-gray-400 hover:text-white z-20 bg-black/20 rounded-full p-1"
        >
            <X size={20} />
        </button>

        {loading ? (
            <div className="flex flex-col items-center justify-center h-96 p-8 text-center">
                <div className="relative mb-8">
                    <div className="absolute inset-0 bg-aura-accent blur-2xl opacity-20 animate-pulse-slow"></div>
                    <Brain className="w-16 h-16 text-aura-accent animate-pulse" />
                </div>
                <h3 className="text-xl font-serif font-bold text-white mb-2">Connexion aux Astres...</h3>
                <p className="text-sm text-gray-400">L'IA analyse la résonance entre {me.mbti} et {other.mbti}...</p>
            </div>
        ) : (
            <div className="flex-1 overflow-y-auto custom-scrollbar">
                {/* Header Graphic */}
                <div className="relative h-32 bg-gradient-to-br from-aura-mid to-aura-dark flex items-center justify-center overflow-hidden">
                    <div className="absolute inset-0 opacity-30 bg-[url('https://www.transparenttextures.com/patterns/stardust.png')]"></div>
                    <div className="flex items-center gap-4 z-10 mt-4">
                        <img src={me.imageUrl} className="w-16 h-16 rounded-full border-2 border-purple-400 object-cover" />
                        <div className="text-2xl text-white/50">⚡</div>
                        <img src={other.imageUrl} className="w-16 h-16 rounded-full border-2 border-teal-400 object-cover" />
                    </div>
                </div>

                <div className="p-6 pb-8">
                    <div className="text-center mb-8">
                        <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-aura-accent">Rapport de Compatibilité</span>
                        <h2 className="text-3xl font-serif font-bold text-white mt-2 bg-clip-text text-transparent bg-gradient-to-r from-white to-purple-200">
                            {report?.title}
                        </h2>
                    </div>

                    <div className="space-y-6">
                        <div className="bg-white/5 rounded-2xl p-5 border border-white/5">
                            <h3 className="text-sm font-bold text-green-300 uppercase mb-3 flex items-center gap-2">
                                <Heart size={16} /> La Synergie
                            </h3>
                            <p className="text-sm text-gray-300 leading-relaxed">
                                {report?.synergy}
                            </p>
                        </div>

                        <div className="bg-white/5 rounded-2xl p-5 border border-white/5">
                            <h3 className="text-sm font-bold text-orange-300 uppercase mb-3 flex items-center gap-2">
                                <AlertTriangle size={16} /> Les Défis
                            </h3>
                            <p className="text-sm text-gray-300 leading-relaxed">
                                {report?.challenges}
                            </p>
                        </div>

                        <div className="bg-gradient-to-r from-aura-mid/20 to-aura-accent/20 rounded-2xl p-5 border border-aura-accent/30">
                            <h3 className="text-sm font-bold text-purple-300 uppercase mb-3 flex items-center gap-2">
                                <Lightbulb size={16} /> Le Conseil de l'Oracle
                            </h3>
                            <p className="text-sm text-white font-medium italic">
                                "{report?.advice}"
                            </p>
                        </div>
                    </div>
                </div>
            </div>
        )}
      </div>
    </div>
  );
};

export default CompatibilityReportModal;
