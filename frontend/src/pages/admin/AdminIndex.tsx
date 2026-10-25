import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { AdminLayout } from './AdminLayout';
import { AdminDashboard } from './AdminDashboard';
import { CircleShape, TriangleShape, SquareShape } from '../../components/GeometricShapes';
import { Lock, User, AlertTriangle, ArrowRight, ShieldAlert } from 'lucide-react';
import { Link } from 'react-router-dom';
import { Card, Badge, Button } from '../../components/ui';

export const AdminIndex: React.FC = () => {
  const { user, loginAdmin, isLoading } = useAuth();
  const [username, setUsername] = useState<string>('');
  const [password, setPassword] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#08090d] text-white flex items-center justify-center font-mono text-xs">
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
      <div className="min-h-screen bg-[#08090d] text-gray-100 flex items-center justify-center p-4">
        <Card variant="elevated" cornerAccents className="max-w-md w-full p-8 text-center space-y-4">
          <ShieldAlert className="w-12 h-12 text-[#ff004f] mx-auto" />
          <h2 className="font-display font-black text-2xl text-white">ACCESS FORBIDDEN</h2>
          <p className="text-xs font-mono text-gray-400">
            Your squad credentials lack Administrative Level-4 clearance. Return to the Arena terminal.
          </p>
          <div className="pt-2">
            <Link to="/game">
              <Button variant="primary" size="md" rightIcon={<ArrowRight className="w-4 h-4" />}>
                RETURN TO SQUAD ARENA
              </Button>
            </Link>
          </div>
        </Card>
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
    } catch (err: any) {
      setErrorMessage(err.message || 'Access Denied. Invalid administrative credentials.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#08090d] text-gray-100 flex items-center justify-center p-4 relative font-sans bg-dot-grid">
      <div className="w-full max-w-md relative z-10">
        <Card variant="elevated" cornerAccents className="p-8 space-y-6">
          <div className="text-center space-y-2">
            <div className="flex items-center justify-center gap-1.5 mb-2 select-none">
              <CircleShape size={18} color="#ff004f" />
              <TriangleShape size={18} color="#ff2e7e" />
              <SquareShape size={18} color="#00f0ff" />
            </div>
            <Badge variant="danger" size="sm">
              RESTRICTED ACCESS PORTAL
            </Badge>
            <h1 className="font-display font-black text-2xl text-white tracking-wide uppercase pt-1">
              SYSTEM CONTROL ROOM
            </h1>
            <p className="text-xs font-mono text-gray-400">
              Authorized tournament directors and engineers only.
            </p>
          </div>

          {errorMessage && (
            <div
              role="alert"
              className="p-3.5 rounded-xl bg-red-950/40 border border-red-800 text-red-300 font-mono text-xs flex items-center gap-2 animate-fade-in"
            >
              <AlertTriangle className="w-4 h-4 flex-shrink-0 text-[#ff004f]" />
              <span>{errorMessage}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4 font-mono text-xs">
            <div className="space-y-1.5">
              <label htmlFor="admin-username" className="text-gray-300 uppercase tracking-wider block font-semibold">
                Admin Username
              </label>
              <div className="relative">
                <User className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500 pointer-events-none" />
                <input
                  id="admin-username"
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="admin"
                  autoComplete="username"
                  className="w-full pl-10 pr-4 py-3 rounded-xl bg-[#08090d] border border-[#1e2432] text-white font-mono text-sm placeholder-gray-600 focus:outline-none focus:border-[#ff004f] focus-visible:ring-2 focus-visible:ring-[#ff004f] transition-colors"
                  required
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <label htmlFor="admin-password" className="text-gray-300 uppercase tracking-wider block font-semibold">
                Authorization Key
              </label>
              <div className="relative">
                <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500 pointer-events-none" />
                <input
                  id="admin-password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••••••"
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
              AUTHENTICATE CONSOLE
            </Button>
          </form>

          <div className="pt-2 text-center">
            <Link
              to="/"
              className="text-xs font-mono text-gray-400 hover:text-white transition-colors"
            >
              ← Return to public website
            </Link>
          </div>
        </Card>
      </div>
    </div>
  );
};
