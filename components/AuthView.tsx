
import React, { useState } from 'react';
import { Eye, EyeOff, ArrowRight, Sparkles } from 'lucide-react';
import { signIn, signUp } from '../services/dataService';
import { playClick, playMatchSuccess } from '../services/audioService';
import AuraLogo from './AuraLogo';

const AuthView: React.FC = () => {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    playClick();

    try {
      if (isLogin) {
        await signIn(email, password);
        playMatchSuccess();
      } else {
        await signUp(email, password);
        playMatchSuccess();
        // Auto-login is usually handled, but we might want to show a message if email confirm is needed
      }
    } catch (err: any) {
      console.error(err);
      setError(err.message || "Une erreur est survenue");
      playClick(400); // Error sound
    } finally {
      setLoading(false);
    }
  };

  const toggleMode = () => {
      playClick();
      setIsLogin(!isLogin);
      setError(null);
  }

  return (
    <div className="flex flex-col items-center justify-center min-h-[80vh] p-6 w-full max-w-md mx-auto animate-fade-in">
      
      {/* Branding */}
      <div className="mb-8 text-center">
        <div className="relative inline-block mb-2">
            <div className="absolute inset-0 bg-aura-accent blur-3xl opacity-20 rounded-full animate-pulse-slow"></div>
            <AuraLogo size={100} className="relative z-10 mx-auto" />
        </div>
        <h1 className="text-4xl font-serif font-bold bg-clip-text text-transparent bg-gradient-to-r from-purple-200 to-pink-200 mb-2">
            Aura
        </h1>
        <p className="text-gray-400 text-sm">Rencontrez l'âme avant le corps.</p>
      </div>

      {/* Card */}
      <div className="w-full glass-card p-8 rounded-3xl border border-white/10 shadow-[0_0_40px_rgba(0,0,0,0.3)]">
          
          <div className="flex gap-4 mb-8 border-b border-white/10 pb-4">
              <button 
                onClick={() => !isLogin && toggleMode()}
                className={`flex-1 pb-2 text-sm font-bold uppercase tracking-wider transition-colors ${isLogin ? 'text-aura-accent border-b-2 border-aura-accent' : 'text-gray-500 hover:text-gray-300'}`}
              >
                  Connexion
              </button>
              <button 
                onClick={() => isLogin && toggleMode()}
                className={`flex-1 pb-2 text-sm font-bold uppercase tracking-wider transition-colors ${!isLogin ? 'text-aura-accent border-b-2 border-aura-accent' : 'text-gray-500 hover:text-gray-300'}`}
              >
                  Inscription
              </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
              <div>
                  <label className="block text-xs font-bold text-gray-400 uppercase mb-2 ml-1">Email</label>
                  <input 
                    type="email" 
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full bg-white/5 border border-white/10 rounded-xl p-4 text-white placeholder-gray-600 focus:border-aura-accent outline-none transition-all"
                    placeholder="votre@email.com"
                  />
              </div>

              <div>
                  <label className="block text-xs font-bold text-gray-400 uppercase mb-2 ml-1">Mot de passe</label>
                  <div className="relative">
                    <input 
                        type={showPassword ? "text" : "password"} 
                        required
                        minLength={6}
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        className="w-full bg-white/5 border border-white/10 rounded-xl p-4 text-white placeholder-gray-600 focus:border-aura-accent outline-none transition-all pr-12"
                        placeholder="••••••••"
                    />
                    <button 
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-500 hover:text-white transition-colors"
                    >
                        {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                    </button>
                  </div>
              </div>

              {error && (
                  <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-lg text-red-200 text-xs text-center animate-shake">
                      {error}
                  </div>
              )}

              <button 
                type="submit" 
                disabled={loading}
                className="w-full py-4 bg-gradient-to-r from-aura-mid to-aura-accent text-white font-bold rounded-xl shadow-lg hover:opacity-90 transition-all active:scale-95 flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                  {loading ? (
                      <Sparkles className="animate-spin" size={20} />
                  ) : (
                      <>
                        {isLogin ? 'Se connecter' : "S'inscrire"} <ArrowRight size={18} />
                      </>
                  )}
              </button>
          </form>
      </div>

      <p className="text-center text-[10px] text-gray-500 mt-8 max-w-xs">
          En continuant, vous acceptez nos Conditions Générales et notre Politique de Confidentialité.
      </p>

    </div>
  );
};

export default AuthView;
