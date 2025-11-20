
import React, { useState, useEffect, useRef } from 'react';
import { ChatSession, DiscoveryMode, Message } from '../types';
import { Send, ArrowLeft, Unlock, Sparkles, Flame, Moon, Shield, Mic, Image as ImageIcon, X, Play, Pause, Loader2 } from 'lucide-react';
import { generateChatReply } from '../services/geminiService';
import { playClick, playCardFlip } from '../services/audioService';
import { subscribeToChat, getCurrentUserId, uploadChatMedia } from '../services/dataService';
import { useParams, useNavigate } from 'react-router-dom';
import ReportModal from './ReportModal';
import { useToast } from './Toast';

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
  const { showToast } = useToast();

  const [session, setSession] = useState<ChatSession | undefined>(undefined);
  const [input, setInput] = useState('');
  const [messages, setMessages] = useState<Message[]>([]);
  const [isTyping, setIsTyping] = useState(false);
  const [isRevealed, setIsRevealed] = useState(false);
  const [showReportModal, setShowReportModal] = useState(false);
  
  // Ice Breaker State
  const [showIceBreaker, setShowIceBreaker] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<'SOFT' | 'SPICY' | 'DEEP' | null>(null);
  
  // Media State
  const [isUploading, setIsUploading] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);
  
  const scrollRef = useRef<HTMLDivElement>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const timerIntervalRef = useRef<number | null>(null);

  // Load session from params
  useEffect(() => {
      const foundSession = sessions.find(s => s.matchId === matchId);
      if (foundSession) {
          setSession(foundSession);
          setMessages(foundSession.messages);
          setIsRevealed(foundSession.isRevealed || mode === DiscoveryMode.CLAIRVOYANCE);
          setShowIceBreaker(foundSession.messages.length === 0);
      }
  }, [matchId, sessions, mode]);

  // --- REALTIME SUBSCRIPTION ---
  useEffect(() => {
      if (!matchId) return;

      const sub = subscribeToChat(matchId, (newMessage) => {
          setMessages(prev => {
             if (prev.find(m => m.id === newMessage.id)) return prev;
             const myId = getCurrentUserId();
             const processedMsg = {
                 ...newMessage,
                 senderId: newMessage.senderId === myId ? 'me' : newMessage.senderId
             };
             const updated = [...prev, processedMsg];
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
    if (messages.length > 0) {
        setShowIceBreaker(false);
    }
  }, [messages]);

  // --- MEDIA HANDLERS ---

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
      if (!e.target.files || !e.target.files[0]) return;
      
      setIsUploading(true);
      playClick();

      try {
          const url = await uploadChatMedia(e.target.files[0], 'image');
          if (url) {
              handleSend("", 'image', url);
          } else {
              showToast("Erreur lors de l'envoi de l'image", "error");
          }
      } catch (err) {
          console.error(err);
      } finally {
          setIsUploading(false);
          // Reset input
          e.target.value = '';
      }
  };

  const startRecording = async () => {
      playClick(200);
      try {
          const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
          const mediaRecorder = new MediaRecorder(stream);
          mediaRecorderRef.current = mediaRecorder;
          audioChunksRef.current = [];

          mediaRecorder.ondataavailable = (event) => {
              if (event.data.size > 0) {
                  audioChunksRef.current.push(event.data);
              }
          };

          mediaRecorder.onstop = async () => {
              stream.getTracks().forEach(track => track.stop());
              // Only process if meaningful length
              if (audioChunksRef.current.length > 0) {
                  const blob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
                  // Small artificial delay to feel like processing
                  setIsUploading(true);
                  const url = await uploadChatMedia(blob, 'audio');
                  setIsUploading(false);
                  
                  if (url) {
                      handleSend("", 'audio', url);
                  }
              }
          };

          mediaRecorder.start();
          setIsRecording(true);
          setRecordingTime(0);
          
          timerIntervalRef.current = window.setInterval(() => {
              setRecordingTime(prev => prev + 1);
          }, 1000);

      } catch (err) {
          console.error(err);
          showToast("Accès micro refusé", "error");
      }
  };

  const stopRecording = () => {
      if (mediaRecorderRef.current && isRecording) {
          mediaRecorderRef.current.stop();
          setIsRecording(false);
          if (timerIntervalRef.current) {
              clearInterval(timerIntervalRef.current);
              timerIntervalRef.current = null;
          }
          playClick(600);
      }
  };

  const handleSend = async (textOverride?: string, type: 'text' | 'image' | 'audio' = 'text', mediaUrl?: string) => {
    const textToSend = textOverride !== undefined ? textOverride : input;
    
    // Prevent empty text sends (unless media)
    if (type === 'text' && !textToSend.trim()) return;
    if (!session) return;

    // Optimistic Update
    const tempId = Date.now().toString();
    const userMsg: Message = {
      id: tempId,
      senderId: 'me',
      text: textToSend,
      type: type,
      mediaUrl: mediaUrl,
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
    <div className="flex flex-col h-full bg-white dark:bg-aura-dark relative transition-colors duration-300">
      
      {showReportModal && (
          <ReportModal 
            userName={session.user.name} 
            onClose={() => setShowReportModal(false)}
            onReport={(reason, details, block) => {
                if (block) {
                    onBlockUser(session.user.id);
                    navigate('/matches');
                }
            }}
          />
      )}

      {/* Header */}
      <div className="flex items-center p-4 bg-white/90 dark:bg-aura-light/50 backdrop-blur border-b border-gray-200 dark:border-white/5 z-20 transition-colors pt-[max(env(safe-area-inset-top),1rem)]">
        <button onClick={handleBack} className="mr-4 text-gray-500 dark:text-gray-300 hover:text-black dark:hover:text-white">
          <ArrowLeft />
        </button>
        
        <div className="relative">
            <div className={`w-10 h-10 rounded-full overflow-hidden border-2 ${isRevealed ? 'border-aura-accent' : 'border-gray-200 dark:border-gray-500'}`}>
            {isRevealed ? (
                <img src={session.user.imageUrl} alt="Avatar" className="w-full h-full object-cover" />
            ) : (
                <div className="w-full h-full bg-gradient-to-br from-gray-100 to-gray-300 dark:from-gray-700 dark:to-gray-900 flex items-center justify-center">
                    <Sparkles size={16} className="text-aura-accent opacity-50" />
                </div>
            )}
            </div>
            {!isRevealed && (
                <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-white dark:bg-aura-dark rounded-full flex items-center justify-center">
                    <div className="w-2 h-2 bg-red-400 rounded-full animate-pulse"></div>
                </div>
            )}
        </div>

        <div className="ml-3 flex-1">
          <h3 className="font-bold text-gray-900 dark:text-white flex items-center gap-2">
            {session.user.name}
            {!isRevealed && <span className="text-[10px] px-1.5 py-0.5 rounded bg-gray-100 dark:bg-gray-700 text-gray-500 dark:text-gray-300">MASQUÉ</span>}
          </h3>
          <div className="text-xs text-gray-500 dark:text-gray-400 flex gap-2">
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
                className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-gray-100 dark:hover:bg-white/10 text-gray-400 hover:text-red-400 transition-colors"
            >
                <Shield size={18} />
            </button>
        </div>
      </div>

      {/* Messages Area */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4 custom-scrollbar relative bg-gray-50 dark:bg-aura-dark transition-colors" ref={scrollRef}>
        
        {/* ICE BREAKER OVERLAY */}
        {showIceBreaker && (
            <div className="absolute inset-0 z-10 flex flex-col items-center justify-center p-6 animate-fade-in bg-white/80 dark:bg-aura-dark/50 backdrop-blur-sm">
                
                {!selectedCategory ? (
                    <>
                        <div className="mb-8 text-center">
                            <Sparkles className="w-12 h-12 text-aura-accent mx-auto mb-4 animate-pulse-slow" />
                            <h3 className="text-2xl font-serif font-bold text-gray-900 dark:text-white mb-2">Brisez la Glace</h3>
                            <p className="text-gray-500 dark:text-gray-400 text-sm">Choisissez une "Vibe" pour démarrer la conversation.</p>
                        </div>

                        <div className="grid grid-cols-1 gap-4 w-full max-w-xs">
                            <button onClick={() => handleCategorySelect('SOFT')} className="group relative overflow-hidden p-6 rounded-2xl bg-gradient-to-br from-pink-100 to-rose-100 dark:from-pink-500/20 dark:to-rose-500/20 border border-pink-200 dark:border-pink-500/30 hover:border-pink-500 transition-all hover:scale-105 active:scale-95 text-left">
                                <div className="flex items-center gap-3">
                                    <div className="p-2 bg-pink-200 dark:bg-pink-500/20 rounded-full"><Sparkles size={20} className="text-pink-500 dark:text-pink-300"/></div>
                                    <div>
                                        <div className="font-bold text-pink-900 dark:text-pink-100 text-lg">Douceur</div>
                                        <div className="text-xs text-pink-700/60 dark:text-pink-200/60">Léger et rêveur</div>
                                    </div>
                                </div>
                            </button>

                            <button onClick={() => handleCategorySelect('SPICY')} className="group relative overflow-hidden p-6 rounded-2xl bg-gradient-to-br from-orange-100 to-red-100 dark:from-orange-500/20 dark:to-red-500/20 border border-orange-200 dark:border-orange-500/30 hover:border-orange-500 transition-all hover:scale-105 active:scale-95 text-left">
                                <div className="flex items-center gap-3">
                                    <div className="p-2 bg-orange-200 dark:bg-orange-500/20 rounded-full"><Flame size={20} className="text-orange-500 dark:text-orange-300"/></div>
                                    <div>
                                        <div className="font-bold text-orange-900 dark:text-orange-100 text-lg">Audace</div>
                                        <div className="text-xs text-orange-700/60 dark:text-orange-200/60">Piquant et direct</div>
                                    </div>
                                </div>
                            </button>

                            <button onClick={() => handleCategorySelect('DEEP')} className="group relative overflow-hidden p-6 rounded-2xl bg-gradient-to-br from-indigo-100 to-violet-100 dark:from-indigo-500/20 dark:to-violet-500/20 border border-indigo-200 dark:border-indigo-500/30 hover:border-indigo-500 transition-all hover:scale-105 active:scale-95 text-left">
                                <div className="flex items-center gap-3">
                                    <div className="p-2 bg-indigo-200 dark:bg-indigo-500/20 rounded-full"><Moon size={20} className="text-indigo-500 dark:text-indigo-300"/></div>
                                    <div>
                                        <div className="font-bold text-indigo-900 dark:text-indigo-100 text-lg">Profondeur</div>
                                        <div className="text-xs text-indigo-700/60 dark:text-indigo-200/60">Intime et philosophique</div>
                                    </div>
                                </div>
                            </button>
                        </div>
                    </>
                ) : (
                    <div className="w-full max-w-sm animate-flip-in">
                         <button onClick={() => setSelectedCategory(null)} className="text-gray-500 dark:text-gray-400 hover:text-black dark:hover:text-white mb-6 flex items-center gap-2 text-sm">
                             <ArrowLeft size={14} /> Retour aux Vibes
                         </button>
                         <div className="space-y-3">
                             {ICE_BREAKERS[selectedCategory].map((msg, idx) => (
                                 <button key={idx} onClick={() => { playClick(800); handleSend(msg); }} className="w-full text-left p-4 bg-white dark:bg-white/10 hover:bg-aura-accent/10 dark:hover:bg-aura-accent/20 border border-gray-200 dark:border-white/10 hover:border-aura-accent rounded-xl transition-all active:scale-95 text-sm text-gray-700 dark:text-gray-200 leading-relaxed shadow-sm">
                                     "{msg}"
                                 </button>
                             ))}
                         </div>
                    </div>
                )}
            </div>
        )}

        {/* Messages */}
        {messages.map(msg => (
          <div key={msg.id} className={`flex ${msg.senderId === 'me' ? 'justify-end' : 'justify-start'}`}>
            <div className={`max-w-[80%] rounded-2xl px-4 py-3 text-sm shadow-sm overflow-hidden ${
              msg.senderId === 'me' 
                ? 'bg-gradient-to-br from-aura-mid to-aura-accent text-white rounded-tr-none shadow-md' 
                : 'bg-white dark:bg-white/10 text-gray-800 dark:text-gray-200 rounded-tl-none border border-gray-200 dark:border-white/5'
            }`}>
              
              {msg.type === 'image' && msg.mediaUrl && (
                  <div className="mb-1 -mx-4 -mt-3">
                      <img src={msg.mediaUrl} className="w-full h-auto max-h-64 object-cover cursor-pointer hover:opacity-90 transition-opacity" onClick={() => window.open(msg.mediaUrl, '_blank')} />
                  </div>
              )}

              {msg.type === 'audio' && msg.mediaUrl && (
                  <div className="flex items-center gap-2 min-w-[150px]">
                      <AudioMessage url={msg.mediaUrl} isMe={msg.senderId === 'me'} />
                  </div>
              )}

              {msg.text && <p>{msg.text}</p>}
              
              <div className={`text-[9px] mt-1 text-right opacity-60 ${msg.senderId === 'me' ? 'text-white' : 'text-gray-500 dark:text-gray-400'}`}>
                  {msg.timestamp.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
              </div>
            </div>
          </div>
        ))}
        
        {/* Typing & Uploading Indicators */}
        {isTyping && (
          <div className="flex justify-start">
             <div className="bg-white dark:bg-white/5 rounded-2xl px-4 py-3 rounded-tl-none flex gap-1 border border-gray-200 dark:border-white/5">
                <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></span>
                <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce delay-100"></span>
                <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce delay-200"></span>
             </div>
          </div>
        )}
        
        {isUploading && (
             <div className="flex justify-end">
                 <div className="bg-aura-accent/20 rounded-2xl px-4 py-3 rounded-tr-none flex items-center gap-2">
                     <Loader2 className="animate-spin text-aura-accent" size={16} />
                     <span className="text-xs text-aura-accent font-bold">Envoi...</span>
                 </div>
             </div>
        )}
      </div>

      {/* Input Bar */}
      <div className="p-4 bg-white/90 dark:bg-aura-light/30 backdrop-blur border-t border-gray-200 dark:border-white/5 z-20 transition-colors pb-[max(env(safe-area-inset-bottom),1rem)]">
        
        {isRecording ? (
             <div className="flex items-center gap-3 bg-red-50 dark:bg-red-900/20 rounded-full px-4 py-2 border border-red-200 dark:border-red-500/30 animate-pulse">
                 <div className="w-3 h-3 bg-red-500 rounded-full animate-ping"></div>
                 <span className="text-red-500 font-mono text-sm flex-1">{recordingTime}s</span>
                 <span className="text-xs text-red-400">Relâchez pour envoyer</span>
                 <button 
                    onClick={() => { setIsRecording(false); if(mediaRecorderRef.current) mediaRecorderRef.current.stop(); }} // Just stop without saving logic handled by state in real implementation but here simplifed
                    className="p-1 bg-white/50 rounded-full text-red-500"
                 >
                     <X size={16} />
                 </button>
             </div>
        ) : (
            <div className="flex items-center gap-2">
                {/* Media Buttons */}
                <label className="p-2.5 text-gray-400 hover:text-aura-accent dark:hover:text-white transition-colors cursor-pointer rounded-full hover:bg-gray-100 dark:hover:bg-white/10">
                    <ImageIcon size={20} />
                    <input type="file" accept="image/*" className="hidden" onChange={handleImageUpload} disabled={isUploading} />
                </label>
                
                <button 
                    onPointerDown={startRecording}
                    onPointerUp={stopRecording}
                    onPointerLeave={() => { if(isRecording) setIsRecording(false); }} // Cancel if dragged away
                    className={`p-2.5 rounded-full transition-all ${isRecording ? 'bg-red-500 text-white scale-110' : 'text-gray-400 hover:text-aura-accent dark:hover:text-white hover:bg-gray-100 dark:hover:bg-white/10'}`}
                >
                    <Mic size={20} />
                </button>

                {/* Text Input */}
                <div className="flex-1 bg-gray-100 dark:bg-white/5 rounded-full px-4 py-2.5 border border-transparent focus-within:border-aura-accent/50 transition-colors flex items-center">
                    <input 
                        type="text" 
                        className="flex-1 bg-transparent outline-none text-gray-900 dark:text-white placeholder-gray-500 text-sm"
                        placeholder={showIceBreaker ? "Brisez la glace..." : "Écrivez un message..."}
                        value={input}
                        onChange={(e) => setInput(e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && handleSend()}
                        disabled={isUploading}
                    />
                </div>

                <button 
                    onClick={() => handleSend()} 
                    disabled={!input.trim() || isUploading}
                    className="p-2.5 bg-aura-accent rounded-full text-white hover:opacity-90 transition-opacity shadow-md disabled:opacity-50 disabled:shadow-none"
                >
                    <Send size={18} />
                </button>
            </div>
        )}
      </div>
    </div>
  );
};

// Sub-component for Audio Player
const AudioMessage = ({ url, isMe }: { url: string, isMe: boolean }) => {
    const [playing, setPlaying] = useState(false);
    const audioRef = useRef<HTMLAudioElement>(null);

    const togglePlay = () => {
        if (!audioRef.current) return;
        if (playing) {
            audioRef.current.pause();
        } else {
            audioRef.current.play();
        }
        setPlaying(!playing);
    };

    return (
        <div className="flex items-center gap-2">
            <button onClick={togglePlay} className={`p-2 rounded-full ${isMe ? 'bg-white/20 text-white' : 'bg-aura-accent text-white'}`}>
                {playing ? <Pause size={14} fill="currentColor"/> : <Play size={14} fill="currentColor"/>}
            </button>
            <div className="flex flex-col gap-1">
                <div className={`h-1 w-24 rounded-full overflow-hidden ${isMe ? 'bg-white/30' : 'bg-gray-200 dark:bg-white/10'}`}>
                    <div className={`h-full ${isMe ? 'bg-white' : 'bg-aura-accent'} animate-pulse`} style={{ width: '100%' }}></div>
                </div>
            </div>
            <audio ref={audioRef} src={url} onEnded={() => setPlaying(false)} className="hidden" />
        </div>
    )
}

export default ChatView;
