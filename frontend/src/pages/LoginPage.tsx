import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Navbar } from '../components/Navbar';
import { Footer } from '../components/Footer';
import { CircleShape, TriangleShape, SquareShape } from '../components/GeometricShapes';
import { IEEELogo } from '../components/IEEELogo';
import { KeyRound, Shield, AlertTriangle, ArrowRight, Loader2 } from 'lucide-react';

export const LoginPage: React.FC = () => {
  const { loginTeam } = useAuth();
  const navigate = useNavigate();

  const [teamCode, setTeamCode] = useState<string>('');
  const [pin, setPin] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    setIsSubmitting(true);

    try {
      if (!teamCode.trim() || !pin.trim()) {
        throw new Error('Please enter both Team Code and PIN.');
      }
      await loginTeam(teamCode.trim().toUpperCase(), pin.trim());
      navigate('/game');
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Invalid team code or PIN. Please check your credentials and try again.';
      setErrorMessage(message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#08090c] text-gray-100 flex flex-col selection:bg-[#ff004f] selection:text-white">
      <Navbar />

      <main className="flex-1 flex items-center justify-center px-4 py-16 relative" id="main-content">
        {/* Ambient glow */}
        <div className="absolute w-[500px] h-[500px] bg-[#ff004f]/8 rounded-full blur-[150px] pointer-events-none" aria-hidden="true" />

        <div className="w-full max-w-md bg-[#12151c] rounded-2xl border border-gray-800 p-8 shadow-2xl relative z-10 space-y-6 animate-slide-up">
          {/* Header */}
          <div className="text-center space-y-3">
            {/* Centered official IEEE NISB logo container */}
            <div className="flex justify-center mb-1">
              <IEEELogo
                size="xl"
                withContainer
                containerClassName="bg-[#0b0d12] border-gray-800 shadow-2xl hover:border-gray-700 transition-colors"
              />
            </div>

            {/* Investigation Dossier label */}
            <div className="flex items-center justify-center gap-1.5 pt-0.5" aria-hidden="true">
              <CircleShape size={11} color="#ff004f" />
              <TriangleShape size={11} color="#ff2e7e" />
              <SquareShape size={11} color="#00f0ff" />
              <span className="font-mono text-[10px] text-amber-400 tracking-widest uppercase ml-1">
                IEEE NISB · PARTICIPANT DOSSIER
              </span>
            </div>

            <h1 className="font-display font-black text-2xl sm:text-3xl text-white tracking-wide uppercase">
              TEAM SIGN IN
            </h1>
            <p className="text-xs font-mono text-gray-400 leading-relaxed max-w-xs mx-auto">
              Enter your team code and PIN to access the tournament.
            </p>
          </div>

          {/* Error Message */}
          {errorMessage && (
            <div
              role="alert"
              aria-live="assertive"
              className="p-3.5 rounded-xl bg-red-950/30 border border-red-800 text-red-400 font-mono text-xs flex items-start gap-2"
            >
              <AlertTriangle className="w-4 h-4 flex-shrink-0 mt-0.5" aria-hidden="true" />
              <span>{errorMessage}</span>
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-4" noValidate>
            <div className="space-y-1.5">
              <label htmlFor="teamCode" className="text-gray-400 uppercase tracking-wider block font-mono text-xs">
                Team Code
              </label>
              <div className="relative">
                <Shield className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500 pointer-events-none" aria-hidden="true" />
                <input
                  id="teamCode"
                  type="text"
                  value={teamCode}
                  onChange={(e) => setTeamCode(e.target.value.toUpperCase())}
                  placeholder="e.g. TEAM01"
                  autoComplete="username"
                  autoCapitalize="characters"
                  spellCheck={false}
                  disabled={isSubmitting}
                  className="w-full pl-10 pr-4 py-3 rounded-xl bg-[#090b0f] border border-gray-800 text-white font-mono text-sm uppercase placeholder-gray-600 focus:outline-none focus:border-[#ff004f] focus:ring-1 focus:ring-[#ff004f]/30 transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
                  required
                  aria-required="true"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <label htmlFor="pin" className="text-gray-400 uppercase tracking-wider block font-mono text-xs">
                Security PIN
              </label>
              <div className="relative">
                <KeyRound className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500 pointer-events-none" aria-hidden="true" />
                <input
                  id="pin"
                  type="password"
                  value={pin}
                  onChange={(e) => setPin(e.target.value)}
                  placeholder="••••••••"
                  autoComplete="current-password"
                  disabled={isSubmitting}
                  className="w-full pl-10 pr-4 py-3 rounded-xl bg-[#090b0f] border border-gray-800 text-white font-mono text-sm placeholder-gray-600 focus:outline-none focus:border-[#ff004f] focus:ring-1 focus:ring-[#ff004f]/30 transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
                  required
                  aria-required="true"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={isSubmitting || !teamCode.trim() || !pin.trim()}
              className="w-full py-3.5 rounded-xl font-display font-bold text-sm tracking-widest flex items-center justify-center gap-2 transition-all mt-2 bg-[#ff004f] text-white hover:bg-[#ff2e7e] shadow-[0_0_20px_rgba(255,0,79,0.4)] active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed disabled:shadow-none disabled:hover:bg-[#ff004f]"
              aria-disabled={isSubmitting || !teamCode.trim() || !pin.trim()}
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" aria-hidden="true" />
                  <span>SIGNING IN...</span>
                </>
              ) : (
                <>
                  <span>SIGN IN TO ARENA</span>
                  <ArrowRight className="w-4 h-4" aria-hidden="true" />
                </>
              )}
            </button>
          </form>

          <p className="pt-1 text-center text-[11px] font-mono text-gray-500">
            Forgot your PIN?{' '}
            <span className="text-gray-400">Ask an event official in the venue control room.</span>
          </p>
        </div>
      </main>

      <Footer />
    </div>
  );
};
