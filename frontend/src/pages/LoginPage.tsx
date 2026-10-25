import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Navbar } from '../components/Navbar';
import { Footer } from '../components/Footer';
import { CircleShape, TriangleShape, SquareShape } from '../components/GeometricShapes';
import { KeyRound, Shield, AlertTriangle, ArrowRight, Terminal } from 'lucide-react';
import { Card, Button, Badge } from '../components/ui';

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
        throw new Error('Please enter both Team Code and Security PIN.');
      }
      await loginTeam(teamCode.trim().toUpperCase(), pin.trim());
      navigate('/game');
    } catch (err: any) {
      setErrorMessage(err.message || 'Authentication rejected. Verify team code and PIN.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#08090d] text-gray-100 flex flex-col font-sans selection:bg-[#ff004f] selection:text-white">
      <Navbar />

      <main className="flex-1 flex items-center justify-center px-4 py-16 relative bg-dot-grid">
        <div className="w-full max-w-md relative z-10">
          <Card variant="elevated" cornerAccents className="p-8 space-y-6">
            {/* Header Identity */}
            <div className="text-center space-y-2">
              <div className="flex items-center justify-center gap-1.5 mb-2 select-none">
                <CircleShape size={18} color="#ff004f" />
                <TriangleShape size={18} color="#ff2e7e" />
                <SquareShape size={18} color="#00f0ff" />
              </div>
              <Badge variant="danger" size="sm">
                RESTRICTED TERMINAL
              </Badge>
              <h1 className="font-display font-black text-2xl sm:text-3xl text-white tracking-wide uppercase pt-1">
                SQUAD AUTHENTICATION
              </h1>
              <p className="text-xs font-mono text-gray-400">
                Authenticate with your tournament-assigned Squad Code and PIN.
              </p>
            </div>

            {/* Error Message Alert */}
            {errorMessage && (
              <div
                role="alert"
                className="p-3.5 rounded-xl bg-red-950/40 border border-red-800/80 text-red-300 font-mono text-xs flex items-center gap-2.5 animate-fade-in"
              >
                <AlertTriangle className="w-4 h-4 flex-shrink-0 text-[#ff004f]" />
                <span>{errorMessage}</span>
              </div>
            )}

            {/* Ingress Form */}
            <form onSubmit={handleSubmit} className="space-y-4 font-mono text-xs">
              <div className="space-y-1.5">
                <label htmlFor="teamCode" className="text-gray-300 uppercase tracking-wider block font-semibold">
                  Squad Code
                </label>
                <div className="relative">
                  <Shield className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500 pointer-events-none" />
                  <input
                    id="teamCode"
                    type="text"
                    value={teamCode}
                    onChange={(e) => setTeamCode(e.target.value.toUpperCase())}
                    placeholder="e.g. TEAM01"
                    autoComplete="username"
                    autoCapitalize="characters"
                    spellCheck="false"
                    className="w-full pl-10 pr-4 py-3 rounded-xl bg-[#08090d] border border-[#1e2432] text-white font-mono text-sm uppercase placeholder-gray-600 focus:outline-none focus:border-[#ff004f] focus-visible:ring-2 focus-visible:ring-[#ff004f] transition-colors"
                    required
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label htmlFor="securityPin" className="text-gray-300 uppercase tracking-wider block font-semibold">
                  Security PIN
                </label>
                <div className="relative">
                  <KeyRound className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500 pointer-events-none" />
                  <input
                    id="securityPin"
                    type="password"
                    value={pin}
                    onChange={(e) => setPin(e.target.value)}
                    placeholder="••••••••"
                    autoComplete="current-password"
                    className="w-full pl-10 pr-4 py-3 rounded-xl bg-[#08090d] border border-[#1e2432] text-white font-mono text-sm placeholder-gray-600 focus:outline-none focus:border-[#ff004f] focus-visible:ring-2 focus-visible:ring-[#ff004f] transition-colors"
                    required
                  />
                </div>
              </div>

              <Button
                type="submit"
                variant="primary"
                size="lg"
                isLoading={isSubmitting}
                className="w-full mt-2"
                rightIcon={<ArrowRight className="w-4 h-4" />}
              >
                ACCESS ARENA CONSOLE
              </Button>
            </form>
          </Card>
        </div>
      </main>

      <Footer />
    </div>
  );
};
