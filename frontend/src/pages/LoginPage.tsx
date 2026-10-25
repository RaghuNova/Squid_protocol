import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Navbar } from '../components/Navbar';
import { Footer } from '../components/Footer';
import { ProtocolShape } from '../components/ui/ProtocolShape';
import { CornerMarks } from '../components/ui/CornerMarks';
import { IEEELogo } from '../components/IEEELogo';
import { KeyRound, Shield, AlertTriangle, ArrowRight, Loader2, Eye, EyeOff } from 'lucide-react';

export const LoginPage: React.FC = () => {
  const { loginTeam } = useAuth();
  const navigate = useNavigate();

  const [teamCode, setTeamCode] = useState<string>('');
  const [pin, setPin] = useState<string>('');
  const [showPin, setShowPin] = useState<boolean>(false);
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
    <div className="min-h-screen bg-canvas text-text-primary flex flex-col selection:bg-signal-red selection:text-white bg-grid-subtle">
      <Navbar />

      <main className="flex-1 flex items-center justify-center px-4 py-16 relative" id="main-content">
        <div className="w-full max-w-md bg-surface rounded border border-border-strong p-7 sm:p-9 space-y-6 relative corner-bracket-container">
          <CornerMarks size={10} />

          {/* Header */}
          <div className="text-center space-y-3">
            <div className="flex justify-center mb-1">
              <IEEELogo
                size="lg"
                withContainer
                containerClassName="bg-surface-elevated border-border-subtle"
              />
            </div>

            {/* ID Badge Header */}
            <div className="inline-flex items-center justify-center gap-2 px-3 py-1 rounded bg-surface-elevated border border-border-muted mx-auto" aria-hidden="true">
              <ProtocolShape type="circle" size={10} className="text-text-muted" />
              <ProtocolShape type="triangle" size={10} className="text-text-muted" />
              <ProtocolShape type="square" size={10} className="text-text-muted" />
              <span className="font-mono text-[10px] text-text-muted tracking-widest uppercase font-semibold pl-1">
                FACILITY ACCESS GATE
              </span>
            </div>

            <h1 className="font-display font-bold text-2xl sm:text-3xl text-text-primary tracking-tight uppercase">
              TEAM SIGN IN
            </h1>
            <p className="text-xs font-mono text-text-muted leading-relaxed max-w-xs mx-auto">
              Enter your official squad credentials to authenticate into the competition arena.
            </p>
          </div>

          {/* Error Message */}
          {errorMessage && (
            <div
              role="alert"
              aria-live="assertive"
              className="p-3.5 rounded bg-signal-red-subtle border border-signal-red/30 text-signal-red font-mono text-xs flex items-start gap-2.5"
            >
              <AlertTriangle className="w-4 h-4 flex-shrink-0 mt-0.5" aria-hidden="true" />
              <span className="leading-relaxed">{errorMessage}</span>
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-4" noValidate>
            <div className="space-y-1.5">
              <label htmlFor="teamCode" className="text-text-secondary uppercase tracking-wider block font-mono text-xs font-semibold">
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
                  className="w-full pl-10 pr-4 py-2.5 rounded bg-surface-input border border-border-form text-text-primary font-mono text-sm uppercase placeholder:text-text-muted/50 focus:outline-none focus:border-border-strong focus-visible:ring-2 focus-visible:ring-text-secondary transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
                  required
                  aria-required="true"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <label htmlFor="pin" className="text-text-secondary uppercase tracking-wider block font-mono text-xs font-semibold">
                Security PIN
              </label>
              <div className="relative">
                <KeyRound className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-text-muted pointer-events-none" aria-hidden="true" />
                <input
                  id="pin"
                  type={showPin ? 'text' : 'password'}
                  value={pin}
                  onChange={(e) => setPin(e.target.value)}
                  placeholder="••••••••"
                  autoComplete="current-password"
                  disabled={isSubmitting}
                  className="w-full pl-10 pr-11 py-2.5 rounded bg-surface-input border border-border-form text-text-primary font-mono text-sm placeholder:text-text-muted/50 focus:outline-none focus:border-border-strong focus-visible:ring-2 focus-visible:ring-text-secondary transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
                  required
                  aria-required="true"
                />
                <button
                  type="button"
                  onClick={() => setShowPin(!showPin)}
                  aria-pressed={showPin}
                  aria-label={showPin ? 'Hide PIN' : 'Show PIN'}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-text-muted hover:text-text-primary p-1 rounded transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-text-secondary cursor-pointer"
                >
                  {showPin ? (
                    <EyeOff className="w-4 h-4" aria-hidden="true" />
                  ) : (
                    <Eye className="w-4 h-4" aria-hidden="true" />
                  )}
                </button>
              </div>
            </div>

            {/* Brand pink-red stays on the Sign In button */}
            <button
              type="submit"
              disabled={isSubmitting || !teamCode.trim() || !pin.trim()}
              className="w-full py-3 rounded font-display font-bold text-sm tracking-wider uppercase flex items-center justify-center gap-2 transition-colors mt-2 bg-[#ff004f] hover:bg-[#ff2e7e] text-white border border-[#ff004f] disabled:opacity-40 disabled:cursor-not-allowed focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-text-secondary focus-visible:ring-offset-2 focus-visible:ring-offset-canvas cursor-pointer"
              aria-disabled={isSubmitting || !teamCode.trim() || !pin.trim()}
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin motion-reduce:hidden" aria-hidden="true" />
                  <span>AUTHENTICATING...</span>
                </>
              ) : (
                <>
                  <span>SIGN IN TO ARENA</span>
                  <ArrowRight className="w-4 h-4" aria-hidden="true" />
                </>
              )}
            </button>
          </form>

          <p className="pt-2 text-center text-[11px] font-mono text-text-muted border-t border-border-subtle">
            Forgot credentials?{' '}
            <span className="text-text-secondary">Contact an event official in the control room.</span>
          </p>
        </div>
      </main>

      <Footer />
    </div>
  );
};
