import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { AdminLayout } from './AdminLayout';
import { AdminDashboard } from './AdminDashboard';
import { CircleShape, TriangleShape, SquareShape } from '../../components/GeometricShapes';
import { IEEELogo } from '../../components/IEEELogo';
import { Lock, User, AlertTriangle, ArrowRight, ShieldAlert, Loader2 } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';

export const AdminIndex: React.FC = () => {
  const navigate = useNavigate();
  const { user, loginAdmin, logout, isLoading } = useAuth();
  const [username, setUsername] = useState<string>('');
  const [password, setPassword] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#06070a] text-white flex items-center justify-center font-mono text-xs">
        AUTHENTICATING ADMIN CONSOLE...
      </div>
    );
  }

  // If already logged in as ADMIN, show dashboard
  if (user?.role === 'ADMIN') {
    return (
      <AdminLayout>
        <AdminDashboard />
      </AdminLayout>
    );
  }

  // If logged in as TEAM, deny access
  if (user && user.role === 'TEAM') {
    return (
      <div className="min-h-screen bg-[#06070a] text-gray-100 flex items-center justify-center p-4">
        <div className="max-w-md w-full p-8 rounded-2xl bg-[#12151c] border border-red-900/60 text-center space-y-4">
          <ShieldAlert className="w-12 h-12 text-[#ff004f] mx-auto" />
          <h2 className="font-display font-black text-2xl text-white">ACCESS FORBIDDEN</h2>
          <p className="text-xs font-mono text-gray-400">
            Currently logged in as a Team operative. To access the System Control Room, log out of your team session.
          </p>
          <div className="pt-2 flex flex-col gap-2">
            <button
              onClick={() => logout()}
              type="button"
              className="w-full inline-flex items-center justify-center gap-2 px-6 py-2.5 rounded-xl bg-[#ff004f] hover:bg-[#e00045] text-white font-mono text-xs font-bold transition-colors"
            >
              <span>LOG OUT & SIGN IN AS ADMIN</span>
            </button>
            <Link
              to="/game"
              className="w-full inline-flex items-center justify-center gap-2 px-6 py-2.5 rounded-xl border border-gray-700 hover:border-gray-500 bg-gray-900/60 text-gray-300 font-mono text-xs font-bold transition-colors"
            >
              <span>RETURN TO SQUAD ARENA</span>
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </div>
      </div>
    );
  }

  // Otherwise, render Admin Login Form
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    setIsSubmitting(true);

    try {
      if (!username.trim() || !password.trim()) {
        throw new Error('Please enter username and password.');
      }
      await loginAdmin(username.trim(), password.trim());
      navigate('/admin/dashboard');
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Access Denied. Invalid administrative credentials.';
      setErrorMessage(message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#06070a] text-gray-100 flex items-center justify-center p-4 relative font-sans">
      <div className="w-full max-w-md p-8 rounded-2xl bg-[#0e1117] border border-gray-800 shadow-2xl space-y-6">
        <div className="text-center space-y-3">
          <div className="flex justify-center mb-1">
            <IEEELogo
              size="lg"
              withContainer
              containerClassName="bg-[#0b0d12] border-gray-800 shadow-2xl"
            />
          </div>
          <div className="flex items-center justify-center gap-1.5" aria-hidden="true">
            <CircleShape size={11} color="#ff004f" />
            <TriangleShape size={11} color="#ff2e7e" />
            <SquareShape size={11} color="#00f0ff" />
            <span className="font-mono text-[10px] text-[#ff004f] tracking-widest uppercase ml-1">
              IEEE NISB · RESTRICTED ACCESS
            </span>
          </div>
          <h1 className="font-display font-black text-2xl text-white tracking-wide uppercase">
            SYSTEM CONTROL ROOM
          </h1>
          <p className="text-xs font-mono text-gray-400">
            Authorized tournament directors and engineers only.
          </p>
        </div>

        {errorMessage && (
          <div role="alert" aria-live="assertive" className="p-3.5 rounded-xl bg-red-950/30 border border-red-800 text-red-400 font-mono text-xs flex items-start gap-2">
            <AlertTriangle className="w-4 h-4 flex-shrink-0 mt-0.5" aria-hidden="true" />
            <span>{errorMessage}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4 font-mono text-xs">
          <div className="space-y-1.5">
            <label htmlFor="admin-username" className="text-gray-400 uppercase tracking-wider block font-mono text-xs">Admin Identity</label>
            <div className="relative">
              <User className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500 pointer-events-none" aria-hidden="true" />
              <input
                id="admin-username"
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="admin"
                autoComplete="username"
                disabled={isSubmitting}
                className="w-full pl-10 pr-4 py-3 rounded-xl bg-[#06070a] border border-gray-800 text-white font-mono text-sm placeholder-gray-600 focus:outline-none focus:border-[#ff004f] focus-visible:ring-2 focus-visible:ring-[#ff004f] focus-visible:ring-offset-2 focus-visible:ring-offset-[#0e1117] transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
                required
                aria-required="true"
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <label htmlFor="admin-password" className="text-gray-400 uppercase tracking-wider block font-mono text-xs">Access Keyphrase</label>
            <div className="relative">
              <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500 pointer-events-none" aria-hidden="true" />
              <input
                id="admin-password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••••••"
                autoComplete="current-password"
                disabled={isSubmitting}
                className="w-full pl-10 pr-4 py-3 rounded-xl bg-[#06070a] border border-gray-800 text-white font-mono text-sm placeholder-gray-600 focus:outline-none focus:border-[#ff004f] focus-visible:ring-2 focus-visible:ring-[#ff004f] focus-visible:ring-offset-2 focus-visible:ring-offset-[#0e1117] transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
                required
                aria-required="true"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={isSubmitting || !username.trim() || !password.trim()}
            className="w-full py-3.5 rounded-xl font-display font-black text-sm tracking-widest bg-[#ff004f] text-white hover:bg-[#ff2e7e] transition-all shadow-[0_0_20px_rgba(255,0,79,0.4)] flex items-center justify-center gap-2 mt-2 active:scale-[0.98] cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-2 focus-visible:ring-offset-[#0e1117] disabled:opacity-50 disabled:cursor-not-allowed disabled:shadow-none disabled:hover:bg-[#ff004f]"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" aria-hidden="true" />
                <span>AUTHENTICATING...</span>
              </>
            ) : (
              <>
                <span>ENTER COMMAND CONSOLE</span>
                <ArrowRight className="w-4 h-4" aria-hidden="true" />
              </>
            )}
          </button>
        </form>

        <div className="text-center pt-2">
          <Link to="/" className="text-xs font-mono text-gray-500 hover:text-gray-300">
            ← Return to Public Terminal
          </Link>
        </div>
      </div>
    </div>
  );
};
