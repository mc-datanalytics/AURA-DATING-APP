
import React, { useState, useEffect, useRef } from 'react';
import { ChatSession, DiscoveryMode, Message } from '../types';
import { Send, ArrowLeft, Unlock, Sparkles, Flame, Moon, Shield, MoreVertical } from 'lucide-react';
import { generateChatReply } from '../services/geminiService';
import { playClick, playCardFlip } from '../services/audioService';
import { subscribeToChat, getCurrentUserId } from '../services/dataService';
import { useParams, useNavigate } from 'react-router-dom';
import ReportModal from './ReportModal';

interface ChatViewProps {
  sessions: ChatSession[];
  mode: DiscoveryMode;
  onUpdateMessages: (matchId: string, messages: Message[]) => void;
  onBlockUser: (userId: string) => void;
}

// Ice Breaker Data
const ICE_BREAKERS = {
  SOFT: [
    "Si tu pouvais dîner avec n'importe qui, vivant ou mort ?",
    "Quel est ton endroit préféré sur Terre ?",
    "Quelle chanson écoutes-tu en boucle en ce moment ?"
  ],
  SPICY: [
    "Quelle est ton opinion la plus impopulaire ?",
    "Ton pire date de tous les temps ?",
    "Quelle est la chose la plus folle que tu aies faite par amour ?"
  ],
  DEEP: [
    "Qu'est-ce qui te fait te lever le matin ?",
    "Quelle leçon as-tu apprise récemment ?",
    "De quoi es-tu le plus fier dans ta vie ?"
  ]
};

const ChatView: React.FC<ChatViewProps> = ({ sessions, mode, onUpdateMessages, onBlockUser }) => {
  const { matchId } = useParams<{ matchId: string }>();
  const navigate = useNavigate();

  const [session, setSession] = useState<ChatSession | undefined>(undefined);
  const [input, setInput] = useState('');
  const [messages, setMessages] = useState<Message[]>([]);
  const [isTyping, setIsTyping] = useState(false);
  const [isRevealed, setIsRevealed] = useState(false);
  const [showReportModal, setShowReportModal] = useState(false);
  
  // Ice Breaker State
  const [showIceBreaker, setShowIceBreaker] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<'SOFT' | 'SPICY' | 'DEEP' | null>(null);

  const scrollRef = useRef<HTMLDivElement>(null);

  // Load session from params
  useEffect(() => {
      const foundSession = sessions.find(s => s.matchId === matchId);
      if (foundSession) {
          setSession(foundSession);
          setMessages(foundSession.messages);
          setIsRevealed(foundSession.isRevealed || mode === DiscoveryMode.CLAIRVOYANCE);
          setShowIceBreaker(foundSession.messages.length === 0);
      } else {
          // Optionally handle not found
      }
  }, [matchId, sessions, mode]);

  // --- REALTIME SUBSCRIPTION ---
  useEffect(() => {
      if (!matchId) return;

      const sub = subscribeToChat(matchId, (newMessage) => {
          // If the message is NOT from me (to avoid double entry with optimistic UI), add it.
          setMessages(prev => {
             if (prev.find(m => m.id === newMessage.id)) return prev;
             const myId = getCurrentUserId();
             const processedMsg = {
                 ...newMessage,
                 senderId: newMessage.senderId === myId ? 'me' : newMessage.senderId
             };
             const updated = [...prev, processedMsg];
             
             // Notify parent to keep sync
             onUpdateMessages(matchId, updated);
             return updated;
          });
      });

      return () => {
          sub.unsubscribe();
      }
  }, [matchId]);


  // Auto-scroll
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
    // Update showIceBreaker based on messages length in case user typed manually
    if (messages.length > 0) {
        setShowIceBreaker(false);
    }
  }, [messages]);

  const handleSend = async (textOverride?: string) => {
    const textToSend = textOverride || input;
    if (!textToSend.trim() || !session) return;

    // Optimistic Update
    const tempId = Date.now().toString();
    const userMsg: Message = {
      id: tempId,
      senderId: 'me',
      text: textToSend,
      timestamp: new Date()
    };

    const updatedMessages = [...messages, userMsg];
    setMessages(updatedMessages);
    setInput('');
    setShowIceBreaker(false);

    // Send to Parent -> DataService -> Supabase
    if (matchId) {
        onUpdateMessages(matchId, updatedMessages);
    }
  };

  const handleCategorySelect = (cat: 'SOFT' | 'SPICY' | 'DEEP') => {
      playCardFlip();
      setSelectedCategory(cat);
  }

  const handleReveal = () => {
    if (mode === DiscoveryMode.INCOGNITO && !isRevealed && session) {
        if (confirm("Souhaitez-vous proposer le Dévoilement à " + session.user.name + " ?")) {
            setIsRevealed(true);
        }
    }
  };

  const handleBack = () => {
      playClick();
      navigate('/matches');
  }

  if (!session) {
      return <div className="flex items-center justify-center h-full text-gray-500">Chargement de la conversation...</div>;
  }

  return (
    <div className="flex flex-col h-full bg-aura-dark relative">
      
      {showReportModal && (
          <ReportModal 
            userName={session.user.name} 
            onClose={() => setShowReportModal(false)}
            onReport={(reason, details, block) => {
                if (block) {
                    onBlockUser(session.user.id);
                    navigate('/matches');
                }
                // Le report API est géré dans App.tsx via le callback onBlockUser ou ici
            }}
          />
      )}

      {/* Header */}
      <div className="flex items-center p-4 bg-aura-light/50 backdrop-blur border-b border-white/5 z-20">
        <button onClick={handleBack} className="mr-4 text-gray-300 hover:text-white">
          <ArrowLeft />
        </button>
        
        <div className="relative">
            <div className={`w-10 h-10 rounded-full overflow-hidden border-2 ${isRevealed ? 'border-aura-accent' : 'border-gray-500'}`}>
            {isRevealed ? (
                <img src={session.user.imageUrl} alt="Avatar" className="w-full h-full object-cover" />
            ) : (
                <div className="w-full h-full bg-gradient-to-br from-gray-700 to-gray-900 flex items-center justify-center">
                    <Sparkles size={16} className="text-aura-accent opacity-50" />
                </div>
            )}
            </div>
            {!isRevealed && (
                <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-aura-dark rounded-full flex items-center justify-center">
                    <div className="w-2 h-2 bg-red-400 rounded-full animate-pulse"></div>
                </div>
            )}
        </div>

        <div className="ml-3 flex-1">
          <h3 className="font-bold text-white flex items-center gap-2">
            {session.user.name}
            {!isRevealed && <span className="text-[10px] px-1.5 py-0.5 rounded bg-gray-700 text-gray-300">MASQUÉ</span>}
          </h3>
          <div className="text-xs text-gray-400 flex gap-2">
             <span>{session.user.mbti}</span> • <span>{session.user.attachment}</span>
          </div>
        </div>
        
        <div className="flex items-center gap-2">
            {!isRevealed && messages.length > 2 && (
                <button 
                    onClick={handleReveal}
                    className="text-xs bg-aura-accent/20 text-aura-accent px-3 py-1.5 rounded-full border border-aura-accent/50 hover:bg-aura-accent hover:text-white transition-colors flex items-center gap-1"
                >
                    <Unlock size={12} /> Dévoiler
                </button>
            )}
            
            <button 
                onClick={() => setShowReportModal(true)}
                className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-white/10 text-gray-400 hover:text-red-400 transition-colors"
            >
                <Shield size={18} />
            </button>
        </div>
      </div>

      {/* Messages Area */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4 custom-scrollbar relative" ref={scrollRef}>
        
        {/* ICE BREAKER GAME OVERLAY (If empty) */}
        {showIceBreaker && (
            <div className="absolute inset-0 z-10 flex flex-col items-center justify-center p-6 animate-fade-in bg-aura-dark/50 backdrop-blur-sm">
                
                {!selectedCategory ? (
                    <>
                        <div className="mb-8 text-center">
                            <Sparkles className="w-12 h-12 text-aura-accent mx-auto mb-4 animate-pulse-slow" />
                            <h3 className="text-2xl font-serif font-bold text-white mb-2">Brisez la Glace</h3>
                            <p className="text-gray-400 text-sm">Choisissez une "Vibe" pour démarrer la conversation.</p>
                        </div>

                        <div className="grid grid-cols-1 gap-4 w-full max-w-xs">
                            <button 
                                onClick={() => handleCategorySelect('SOFT')}
                                className="group relative overflow-hidden p-6 rounded-2xl bg-gradient-to-br from-pink-500/20 to-rose-500/20 border border-pink-500/30 hover:border-pink-500 transition-all hover:scale-105 active:scale-95 text-left"
                            >
                                <div className="flex items-center gap-3">
                                    <div className="p-2 bg-pink-500/20 rounded-full"><Sparkles size={20} className="text-pink-300"/></div>
                                    <div>
                                        <div className="font-bold text-pink-100 text-lg">Douceur</div>
                                        <div className="text-xs text-pink-200/60">Léger et rêveur</div>
                                    </div>
                                </div>
                            </button>

                            <button 
                                onClick={() => handleCategorySelect('SPICY')}
                                className="group relative overflow-hidden p-6 rounded-2xl bg-gradient-to-br from-orange-500/20 to-red-500/20 border border-orange-500/30 hover:border-orange-500 transition-all hover:scale-105 active:scale-95 text-left"
                            >
                                <div className="flex items-center gap-3">
                                    <div className="p-2 bg-orange-500/20 rounded-full"><Flame size={20} className="text-orange-300"/></div>
                                    <div>
                                        <div className="font-bold text-orange-100 text-lg">Audace</div>
                                        <div className="text-xs text-orange-200/60">Piquant et direct</div>
                                    </div>
                                </div>
                            </button>

                            <button 
                                onClick={() => handleCategorySelect('DEEP')}
                                className="group relative overflow-hidden p-6 rounded-2xl bg-gradient-to-br from-indigo-500/20 to-violet-500/20 border border-indigo-500/30 hover:border-indigo-500 transition-all hover:scale-105 active:scale-95 text-left"
                            >
                                <div className="flex items-center gap-3">
                                    <div className="p-2 bg-indigo-500/20 rounded-full"><Moon size={20} className="text-indigo-300"/></div>
                                    <div>
                                        <div className="font-bold text-indigo-100 text-lg">Profondeur</div>
                                        <div className="text-xs text-indigo-200/60">Intime et philosophique</div>
                                    </div>
                                </div>
                            </button>
                        </div>
                    </>
                ) : (
                    <div className="w-full max-w-sm animate-flip-in">
                         <button 
                            onClick={() => setSelectedCategory(null)}
                            className="text-gray-400 hover:text-white mb-6 flex items-center gap-2 text-sm"
                         >
                             <ArrowLeft size={14} /> Retour aux Vibes
                         </button>

                         <h3 className="text-xl font-serif font-bold text-white mb-6 flex items-center gap-2">
                            {selectedCategory === 'SOFT' && <Sparkles className="text-pink-400"/>}
                            {selectedCategory === 'SPICY' && <Flame className="text-orange-400"/>}
                            {selectedCategory === 'DEEP' && <Moon className="text-indigo-400"/>}
                            Sélectionne un message
                         </h3>

                         <div className="space-y-3">
                             {ICE_BREAKERS[selectedCategory].map((msg, idx) => (
                                 <button
                                    key={idx}
                                    onClick={() => { playClick(800); handleSend(msg); }}
                                    className="w-full text-left p-4 bg-white/10 hover:bg-aura-accent/20 border border-white/10 hover:border-aura-accent rounded-xl transition-all active:scale-95 text-sm text-gray-200 leading-relaxed"
                                 >
                                     "{msg}"
                                 </button>
                             ))}
                         </div>
                    </div>
                )}
            </div>
        )}

        {!isRevealed && !showIceBreaker && (
            <div className="text-center py-4">
                <p className="text-xs text-gray-500 italic">Le visage de {session.user.name} est caché. Connectez-vous par l'esprit pour révéler l'Aura.</p>
            </div>
        )}

        {messages.map(msg => (
          <div key={msg.id} className={`flex ${msg.senderId === 'me' ? 'justify-end' : 'justify-start'}`}>
            <div className={`max-w-[80%] rounded-2xl px-4 py-3 text-sm ${
              msg.senderId === 'me' 
                ? 'bg-gradient-to-br from-aura-mid to-aura-accent text-white rounded-tr-none shadow-lg' 
                : 'bg-white/10 text-gray-200 rounded-tl-none border border-white/5'
            }`}>
              {msg.text}
            </div>
          </div>
        ))}
        
        {isTyping && (
          <div className="flex justify-start">
             <div className="bg-white/5 rounded-2xl px-4 py-3 rounded-tl-none flex gap-1">
                <span className="w-2 h-2 bg-gray-500 rounded-full animate-bounce"></span>
                <span className="w-2 h-2 bg-gray-500 rounded-full animate-bounce delay-100"></span>
                <span className="w-2 h-2 bg-gray-500 rounded-full animate-bounce delay-200"></span>
             </div>
          </div>
        )}
      </div>

      {/* Input */}
      <div className="p-4 bg-aura-light/30 backdrop-blur border-t border-white/5 z-20">
        <div className="flex items-center gap-2 bg-white/5 rounded-full px-4 py-2 border border-white/10 focus-within:border-aura-accent/50 transition-colors">
          <input 
            type="text" 
            className="flex-1 bg-transparent outline-none text-white placeholder-gray-500"
            placeholder={showIceBreaker ? "Ou écrivez votre propre message..." : "Écrivez un message..."}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSend()}
          />
          <button onClick={() => handleSend()} className="p-2 bg-aura-accent rounded-full text-white hover:opacity-90 transition-opacity">
            <Send size={16} />
          </button>
        </div>
      </div>
    </div>
  );
};

export default ChatView;
