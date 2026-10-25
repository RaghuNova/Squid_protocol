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
    <div className="min-h-screen bg-canvas text-text-primary flex flex-col selection:bg-signal-red selection:text-white">
      <Navbar />

      <main className="flex-1 flex items-center justify-center px-4 py-16 relative" id="main-content">
        <div className="w-full max-w-md bg-surface rounded-lg border border-border-subtle p-6 sm:p-8 space-y-6 relative z-10 shadow-xl">
          {/* Header */}
          <div className="text-center space-y-3">
            {/* Centered official IEEE NISB logo */}
            <div className="flex justify-center mb-1">
              <IEEELogo
                size="lg"
                withContainer
                containerClassName="bg-surface-elevated border-border-subtle"
              />
            </div>

            {/* Neutral Protocol Markers & Section Label */}
            <div className="flex items-center justify-center gap-1.5 pt-0.5" aria-hidden="true">
              <CircleShape size={11} color="var(--text-muted)" />
              <TriangleShape size={11} color="var(--text-muted)" />
              <SquareShape size={11} color="var(--text-muted)" />
              <span className="font-mono text-[10px] text-text-muted tracking-wider uppercase ml-1">
                IEEE NISB · PARTICIPANT ACCESS
              </span>
            </div>

            <h1 className="font-display font-bold text-2xl text-text-primary tracking-wide uppercase">
              TEAM SIGN IN
            </h1>
            <p className="text-xs font-mono text-text-muted leading-relaxed max-w-xs mx-auto">
              Enter your team code and PIN to access the tournament.
            </p>
          </div>

          {/* Error Message */}
          {errorMessage && (
            <div
              role="alert"
              aria-live="assertive"
              className="p-3.5 rounded-md bg-signal-red-subtle border border-signal-red/40 text-signal-red font-mono text-xs flex items-start gap-2"
            >
              <AlertTriangle className="w-4 h-4 flex-shrink-0 mt-0.5" aria-hidden="true" />
              <span>{errorMessage}</span>
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-4" noValidate>
            <div className="space-y-1.5">
              <label htmlFor="teamCode" className="text-text-secondary uppercase tracking-wider block font-mono text-xs">
                Team Code
              </label>
              <div className="relative">
                <Shield className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-text-muted pointer-events-none" aria-hidden="true" />
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
                  className="w-full pl-10 pr-4 py-2.5 rounded-md bg-surface-input border border-border-form text-text-primary font-mono text-sm uppercase placeholder:text-text-muted/50 focus:outline-none focus:border-border-strong focus-visible:ring-2 focus-visible:ring-text-primary transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
                  required
                  aria-required="true"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <label htmlFor="pin" className="text-text-secondary uppercase tracking-wider block font-mono text-xs">
                Security PIN
              </label>
              <div className="relative">
                <KeyRound className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-text-muted pointer-events-none" aria-hidden="true" />
                <input
                  id="pin"
                  type="password"
                  value={pin}
                  onChange={(e) => setPin(e.target.value)}
                  placeholder="••••••••"
                  autoComplete="current-password"
                  disabled={isSubmitting}
                  className="w-full pl-10 pr-4 py-2.5 rounded-md bg-surface-input border border-border-form text-text-primary font-mono text-sm placeholder:text-text-muted/50 focus:outline-none focus:border-border-strong focus-visible:ring-2 focus-visible:ring-text-primary transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
                  required
                  aria-required="true"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={isSubmitting || !teamCode.trim() || !pin.trim()}
              className="w-full py-3 rounded-md font-display font-semibold text-sm tracking-wide flex items-center justify-center gap-2 transition-colors mt-2 bg-text-primary text-canvas hover:bg-slate-200 border border-transparent disabled:opacity-50 disabled:cursor-not-allowed focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-text-primary focus-visible:ring-offset-2 focus-visible:ring-offset-canvas cursor-pointer"
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

          <p className="pt-1 text-center text-[11px] font-mono text-text-muted">
            Forgot your PIN?{' '}
            <span className="text-text-secondary">Ask an event official in the venue control room.</span>
          </p>
        </div>
      </main>

      <Footer />
    </div>
  );
};
