
import React, { useState } from 'react';
import { X, Shield, CheckCircle2 } from 'lucide-react';
import { playClick } from '../services/audioService';

interface ReportModalProps {
  userName: string;
  onClose: () => void;
  onReport: (reason: string, details: string, block: boolean) => void;
}

const REPORT_REASONS = [
    "Faux profil / Spam",
    "Contenu inapproprié",
    "Harcèlement",
    "Mineur (-18 ans)",
    "Autre"
];

const ReportModal: React.FC<ReportModalProps> = ({ userName, onClose, onReport }) => {
  const [reason, setReason] = useState<string>("");
  const [details, setDetails] = useState("");
  const [blockChecked, setBlockChecked] = useState(true);
  const [step, setStep] = useState<'REASON' | 'DETAILS' | 'SUCCESS'>('REASON');

  const handleNext = () => {
      if (reason) {
          playClick(700);
          setStep('DETAILS');
      }
  };

  const handleSubmit = () => {
      playClick(900);
      onReport(reason, details, blockChecked);
      setStep('SUCCESS');
      setTimeout(() => {
          onClose();
      }, 2000);
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/80 dark:bg-black/90 backdrop-blur-md transition-colors" onClick={onClose}></div>
      
      <div className="relative w-full max-w-sm bg-white dark:bg-gray-900 border border-gray-200 dark:border-red-500/30 rounded-3xl shadow-2xl dark:shadow-[0_0_50px_rgba(220,38,38,0.2)] overflow-hidden animate-scale-in transition-colors duration-300">
        
        {step !== 'SUCCESS' && (
            <>
                <div className="bg-red-50 dark:bg-red-500/10 p-4 border-b border-red-100 dark:border-red-500/10 flex items-center justify-between">
                    <div className="flex items-center gap-2 text-red-600 dark:text-red-400 font-bold uppercase text-xs tracking-wider">
                        <Shield size={14} /> Signalement
                    </div>
                    <button onClick={onClose} className="text-gray-500 hover:text-black dark:hover:text-white transition-colors"><X size={20} /></button>
                </div>

                <div className="p-6">
                    {step === 'REASON' && (
                        <div className="animate-slide-up">
                            <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-1">Signaler {userName}</h3>
                            <p className="text-sm text-gray-500 dark:text-gray-400 mb-6">Aidez-nous à garder Aura sûre. Quelle est la raison ?</p>
                            
                            <div className="space-y-2">
                                {REPORT_REASONS.map(r => (
                                    <button
                                        key={r}
                                        onClick={() => setReason(r)}
                                        className={`w-full p-4 rounded-xl text-left text-sm font-medium transition-all ${reason === r ? 'bg-red-500 text-white shadow-lg' : 'bg-gray-50 dark:bg-white/5 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-white/10'}`}
                                    >
                                        {r}
                                    </button>
                                ))}
                            </div>

                            <button 
                                onClick={handleNext}
                                disabled={!reason}
                                className="w-full mt-6 py-3 bg-gray-900 dark:bg-white/10 rounded-xl font-bold text-white hover:bg-black dark:hover:bg-white/20 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                            >
                                Continuer
                            </button>
                        </div>
                    )}

                    {step === 'DETAILS' && (
                        <div className="animate-slide-up">
                             <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-1">Détails optionnels</h3>
                             <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">Ajoutez plus de contexte si nécessaire.</p>
                             
                             <textarea 
                                value={details}
                                onChange={(e) => setDetails(e.target.value)}
                                className="w-full h-24 bg-gray-50 dark:bg-black/20 border border-gray-200 dark:border-white/10 rounded-xl p-3 text-gray-900 dark:text-white text-sm focus:border-red-500 outline-none resize-none mb-4 transition-colors"
                                placeholder="Décrivez le problème..."
                             />

                             <label className="flex items-center gap-3 bg-gray-50 dark:bg-white/5 p-3 rounded-xl cursor-pointer mb-6 transition-colors">
                                 <div className={`w-5 h-5 rounded border flex items-center justify-center ${blockChecked ? 'bg-red-500 border-red-500' : 'border-gray-400 dark:border-gray-500 bg-white dark:bg-transparent'}`}>
                                     {blockChecked && <X size={14} className="text-white" />}
                                 </div>
                                 <input type="checkbox" checked={blockChecked} onChange={() => setBlockChecked(!blockChecked)} className="hidden" />
                                 <div className="flex-1">
                                     <div className="text-sm font-bold text-gray-900 dark:text-white">Bloquer {userName}</div>
                                     <div className="text-[10px] text-gray-500 dark:text-gray-400">Vous ne vous verrez plus sur l'app.</div>
                                 </div>
                             </label>

                             <button 
                                onClick={handleSubmit}
                                className="w-full py-3 bg-red-500 hover:bg-red-600 rounded-xl font-bold text-white shadow-lg transition-all"
                            >
                                Envoyer le signalement
                            </button>
                        </div>
                    )}
                </div>
            </>
        )}

        {step === 'SUCCESS' && (
            <div className="p-8 flex flex-col items-center justify-center text-center min-h-[300px] animate-fade-in">
                <div className="w-16 h-16 bg-green-500/20 rounded-full flex items-center justify-center mb-4">
                    <CheckCircle2 className="text-green-500 dark:text-green-400" size={32} />
                </div>
                <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">Merci</h3>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                    Votre signalement a été reçu. Nous allons examiner ce profil rapidement.
                </p>
            </div>
        )}

      </div>
    </div>
  );
};

export default ReportModal;
