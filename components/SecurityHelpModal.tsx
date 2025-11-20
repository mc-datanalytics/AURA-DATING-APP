
import React from 'react';
import { X, Shield, HeartHandshake, Lock, MapPin, AlertTriangle, ChevronRight, Mail, FileText, ExternalLink, Phone } from 'lucide-react';
import { playClick } from '../services/audioService';

interface SecurityHelpModalProps {
  onClose: () => void;
}

const SecurityHelpModal: React.FC<SecurityHelpModalProps> = ({ onClose }) => {
  
  const handleClose = () => {
      playClick(600);
      onClose();
  }

  return (
    <div className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center p-0 sm:p-4">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/80 backdrop-blur-md animate-fade-in" onClick={handleClose}></div>

      {/* Modal Content */}
      <div className="relative w-full max-w-md bg-gray-900 rounded-t-[2.5rem] sm:rounded-[2.5rem] border-t sm:border border-white/10 shadow-2xl h-[90vh] flex flex-col animate-slide-up overflow-hidden">
        
        {/* Header */}
        <div className="p-6 border-b border-white/5 flex items-center justify-between bg-gray-900/50 backdrop-blur-xl z-10">
            <div className="flex items-center gap-3">
                <div className="p-2 bg-green-500/10 rounded-xl">
                    <Shield className="text-green-400" size={24} />
                </div>
                <div>
                    <h2 className="font-serif font-bold text-xl text-white">Sécurité & Aide</h2>
                    <p className="text-xs text-gray-500">Votre bien-être est notre priorité.</p>
                </div>
            </div>
            <button 
                onClick={handleClose}
                className="w-10 h-10 bg-white/5 rounded-full flex items-center justify-center hover:bg-white/10 text-gray-400 hover:text-white transition-colors"
            >
                <X size={20} />
            </button>
        </div>

        <div className="flex-1 overflow-y-auto custom-scrollbar p-6 space-y-8">
            
            {/* Section 1: Golden Rules */}
            <section>
                <h3 className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-4 flex items-center gap-2">
                    <HeartHandshake size={14} /> Règles d'or de la rencontre
                </h3>
                
                <div className="space-y-3">
                    <TipCard 
                        icon={<MapPin className="text-blue-400" size={18}/>}
                        title="Lieux publics uniquement"
                        desc="Pour les premiers rendez-vous, choisissez toujours un café, un restaurant ou un parc fréquenté."
                    />
                    <TipCard 
                        icon={<Lock className="text-purple-400" size={18}/>}
                        title="Gardez vos infos privées"
                        desc="Ne donnez jamais votre adresse, numéro de carte bancaire ou documents d'identité."
                    />
                    <TipCard 
                        icon={<AlertTriangle className="text-orange-400" size={18}/>}
                        title="Jamais d'argent"
                        desc="Aura est gratuit (sauf Premium). Si quelqu'un vous demande de l'argent, signalez-le immédiatement."
                    />
                </div>
            </section>

            {/* Section 2: Emergency & Support */}
            <section>
                 <h3 className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-4 flex items-center gap-2">
                    <Phone size={14} /> Assistance & Urgence
                </h3>
                
                <div className="bg-white/5 border border-white/10 rounded-2xl overflow-hidden">
                    <div className="p-4 border-b border-white/5 hover:bg-white/5 transition-colors cursor-pointer flex items-center gap-4">
                        <div className="w-10 h-10 rounded-full bg-red-500/20 flex items-center justify-center text-red-400">
                            <Phone size={20} />
                        </div>
                        <div className="flex-1">
                            <h4 className="font-bold text-white text-sm">Urgence (112 / 17)</h4>
                            <p className="text-xs text-gray-400">Si vous êtes en danger immédiat.</p>
                        </div>
                        <ExternalLink size={16} className="text-gray-600" />
                    </div>
                    <a href="mailto:support@aura-app.com" className="p-4 hover:bg-white/5 transition-colors cursor-pointer flex items-center gap-4">
                        <div className="w-10 h-10 rounded-full bg-aura-accent/20 flex items-center justify-center text-aura-accent">
                            <Mail size={20} />
                        </div>
                        <div className="flex-1">
                            <h4 className="font-bold text-white text-sm">Contacter le Support</h4>
                            <p className="text-xs text-gray-400">support@aura-app.com</p>
                        </div>
                        <ChevronRight size={16} className="text-gray-600" />
                    </a>
                </div>
            </section>

            {/* Section 3: Legal */}
            <section>
                 <h3 className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-4 flex items-center gap-2">
                    <FileText size={14} /> Informations Légales
                </h3>
                <div className="space-y-2">
                    <LegalLink label="Conditions Générales d'Utilisation" />
                    <LegalLink label="Politique de Confidentialité" />
                    <LegalLink label="Charte de la Communauté" />
                    <LegalLink label="Gestion des Cookies" />
                </div>
            </section>
            
            <div className="pt-4 text-center">
                <p className="text-[10px] text-gray-600">
                    Version 2.1.4 (Build 8842) <br/>
                    Aura Technologies Inc. © 2024
                </p>
            </div>

        </div>
      </div>
    </div>
  );
};

const TipCard = ({ icon, title, desc }: any) => (
    <div className="flex items-start gap-4 p-4 bg-white/5 rounded-xl border border-white/5">
        <div className="shrink-0 mt-0.5">{icon}</div>
        <div>
            <h4 className="font-bold text-white text-sm mb-1">{title}</h4>
            <p className="text-xs text-gray-400 leading-relaxed">{desc}</p>
        </div>
    </div>
);

const LegalLink = ({ label }: { label: string }) => (
    <button className="w-full flex items-center justify-between p-3 rounded-xl text-sm text-gray-300 hover:bg-white/5 hover:text-white transition-colors text-left">
        {label}
        <ExternalLink size={14} className="opacity-50" />
    </button>
);

export default SecurityHelpModal;
