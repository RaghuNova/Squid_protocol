import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useSound } from '../context/SoundContext';
import {
  Volume2,
  VolumeX,
  LogIn,
  LogOut,
  Trophy,
  BookOpen,
  Shield,
  Gamepad2,
  Menu,
  X,
  Terminal,
} from 'lucide-react';
import { CircleShape, TriangleShape, SquareShape } from './GeometricShapes';

export const Navbar: React.FC = () => {
  const { user, team, logout } = useAuth();
  const { isMuted, toggleMute } = useSound();
  const location = useLocation();
  const [mobileMenuOpen, setMobileMenuOpen] = useState<boolean>(false);

  const isActive = (path: string) => location.pathname === path;

  const closeMobileMenu = () => setMobileMenuOpen(false);

  return (
    <header className="sticky top-0 z-50 border-b border-[#1e2432] bg-[#08090d]/85 backdrop-blur-md">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Brand Logo & Geometric Glyph */}
          <Link
            to="/"
            onClick={closeMobileMenu}
            className="flex items-center gap-3 group focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#ff004f] rounded-lg p-1"
          >
            <div className="flex items-center gap-1.5 p-1.5 rounded-lg bg-[#0f1218] border border-[#1e2432] group-hover:border-[#ff004f]/40 transition-colors">
              <CircleShape size={16} color="#ff004f" />
              <TriangleShape size={16} color="#ff2e7e" />
              <SquareShape size={16} color="#00f0ff" />
            </div>
            <div className="flex flex-col">
              <div className="flex items-center gap-1.5">
                <span className="font-display font-black tracking-widest text-base sm:text-lg text-white group-hover:text-[#ff004f] transition-colors">
                  SQUID<span className="text-[#ff004f]"> PROTOCOL</span>
                </span>
                <span className="hidden lg:inline-block px-1.5 py-0.5 rounded text-[9px] font-mono tracking-widest bg-[#151922] text-[#00f0ff] border border-[#1e2432] uppercase">
                  V1.0
                </span>
              </div>
              <span className="hidden sm:inline-block text-[9px] font-mono tracking-widest text-gray-500 uppercase -mt-0.5">
                SURVIVE THE SYSTEM
              </span>
            </div>
          </Link>

          {/* Desktop Navigation Links */}
          <nav className="hidden md:flex items-center gap-2" aria-label="Main Navigation">
            <Link
              to="/rules"
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-mono tracking-wide transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-[#ff004f] ${
                isActive('/rules')
                  ? 'bg-[#151922] text-white border border-[#2c3447]'
                  : 'text-gray-400 hover:text-white hover:bg-[#0f1218]'
              }`}
            >
              <BookOpen className="w-3.5 h-3.5 text-[#ff2e7e]" aria-hidden="true" />
              <span>RULES</span>
            </Link>

            {user?.role === 'ADMIN' && (
              <Link
                to="/leaderboard"
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-mono tracking-wide transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-[#ff004f] ${
                  isActive('/leaderboard')
                    ? 'bg-[#151922] text-white border border-[#2c3447]'
                    : 'text-gray-400 hover:text-white hover:bg-[#0f1218]'
                }`}
              >
                <Trophy className="w-3.5 h-3.5 text-[#ffd166]" aria-hidden="true" />
                <span>STANDINGS</span>
              </Link>
            )}

            {user?.role === 'ADMIN' && (
              <Link
                to="/admin/dashboard"
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-mono tracking-wide transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-[#ff004f] ${
                  isActive('/admin/dashboard')
                    ? 'bg-[#ff004f]/15 text-white border border-[#ff004f]/40 font-bold'
                    : 'text-gray-400 hover:text-white hover:bg-[#0f1218]'
                }`}
              >
                <Shield className="w-3.5 h-3.5 text-[#ff004f]" aria-hidden="true" />
                <span>COMMAND CENTER</span>
              </Link>
            )}

            {user?.role === 'TEAM' && (
              <Link
                to="/game"
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-mono tracking-wide transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-[#ff004f] ${
                  isActive('/game')
                    ? 'bg-[#ff004f]/15 text-white border border-[#ff004f]/40 font-bold'
                    : 'text-gray-400 hover:text-white hover:bg-[#0f1218]'
                }`}
              >
                <Gamepad2 className="w-3.5 h-3.5 text-[#ff004f]" aria-hidden="true" />
                <span>ARENA</span>
              </Link>
            )}
          </nav>

          {/* Right Controls: Audio Toggle, Team Status, Auth Actions, Mobile Menu Toggle */}
          <div className="flex items-center gap-2 sm:gap-3">
            {/* Audio Toggle Button */}
            <button
              onClick={toggleMute}
              title={isMuted ? 'Unmute Game SFX' : 'Mute Game SFX'}
              className="p-2 rounded-lg bg-[#0f1218] border border-[#1e2432] text-gray-400 hover:text-white hover:border-[#2c3447] transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-[#ff004f] cursor-pointer"
              aria-label={isMuted ? 'Unmute Audio' : 'Mute Audio'}
            >
              {isMuted ? (
                <VolumeX className="w-4 h-4 text-gray-500" />
              ) : (
                <Volume2 className="w-4 h-4 text-[#00e676]" />
              )}
            </button>

            {/* Team Live Score Telemetry (Desktop) */}
            {team ? (
              <div className="flex items-center gap-2">
                <div className="hidden sm:flex items-center gap-2 px-3 py-1 rounded-lg bg-[#0f1218] border border-[#1e2432] text-xs font-mono">
                  <span className="w-2 h-2 rounded-full bg-[#00e676] animate-pulse motion-reduce:animate-none" aria-hidden="true" />
                  <span className="text-gray-300 font-bold">{team.teamCode}</span>
                  <span className="text-gray-600">|</span>
                  <span className="text-[#00e676] font-bold">{team.totalScore} PTS</span>
                </div>
                <button
                  onClick={() => logout()}
                  title="Disconnect Squad Session"
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-mono bg-red-950/40 text-red-400 border border-red-900/40 hover:bg-red-900/60 hover:text-red-200 transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-[#ff004f] cursor-pointer"
                >
                  <LogOut className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">EXIT</span>
                </button>
              </div>
            ) : user ? (
              <button
                onClick={() => logout()}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-mono bg-[#151922] text-gray-300 hover:text-white border border-[#1e2432] hover:border-[#2c3447] transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-[#ff004f] cursor-pointer"
              >
                <LogOut className="w-3.5 h-3.5" />
                <span>LOGOUT</span>
              </button>
            ) : (
              <Link
                to="/login"
                className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-mono font-semibold bg-[#ff004f] text-white hover:bg-[#e00045] transition-all shadow-red-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#ff004f] cursor-pointer"
              >
                <LogIn className="w-3.5 h-3.5" />
                <span>TEAM LOGIN</span>
              </Link>
            )}

            {/* Mobile Hamburger Toggle */}
            <button
              onClick={() => setMobileMenuOpen(prev => !prev)}
              aria-expanded={mobileMenuOpen}
              aria-label="Toggle navigation drawer"
              className="md:hidden p-2 rounded-lg bg-[#0f1218] border border-[#1e2432] text-gray-400 hover:text-white transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-[#ff004f]"
            >
              {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>

        {/* Mobile Slide-down Drawer */}
        {mobileMenuOpen && (
          <div className="md:hidden py-4 border-t border-[#1e2432] space-y-2 bg-[#08090d]/95 backdrop-blur-xl animate-fade-in">
            {team && (
              <div className="flex items-center justify-between p-3 rounded-lg bg-[#0f1218] border border-[#1e2432] mb-3 font-mono text-xs">
                <div className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-[#00e676]" aria-hidden="true" />
                  <span className="text-white font-bold">{team.teamCode}</span>
                  <span className="text-gray-400">({team.name})</span>
                </div>
                <span className="text-[#00e676] font-bold">{team.totalScore} PTS</span>
              </div>
            )}

            <Link
              to="/"
              onClick={closeMobileMenu}
              className={`flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-mono ${
                isActive('/') ? 'bg-[#151922] text-white' : 'text-gray-400 hover:text-white'
              }`}
            >
              <Terminal className="w-4 h-4 text-[#00f0ff]" />
              <span>OVERVIEW</span>
            </Link>

            <Link
              to="/rules"
              onClick={closeMobileMenu}
              className={`flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-mono ${
                isActive('/rules') ? 'bg-[#151922] text-white' : 'text-gray-400 hover:text-white'
              }`}
            >
              <BookOpen className="w-4 h-4 text-[#ff2e7e]" />
              <span>OFFICIAL RULES</span>
            </Link>

            {user?.role === 'ADMIN' && (
              <Link
                to="/leaderboard"
                onClick={closeMobileMenu}
                className={`flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-mono ${
                  isActive('/leaderboard') ? 'bg-[#151922] text-white' : 'text-gray-400 hover:text-white'
                }`}
              >
                <Trophy className="w-4 h-4 text-[#ffd166]" />
                <span>STANDINGS</span>
              </Link>
            )}

            {user?.role === 'ADMIN' && (
              <Link
                to="/admin/dashboard"
                onClick={closeMobileMenu}
                className={`flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-mono ${
                  isActive('/admin/dashboard') ? 'bg-[#ff004f]/20 text-white' : 'text-gray-400 hover:text-white'
                }`}
              >
                <Shield className="w-4 h-4 text-[#ff004f]" />
                <span>COMMAND CENTER</span>
              </Link>
            )}

            {user?.role === 'TEAM' && (
              <Link
                to="/game"
                onClick={closeMobileMenu}
                className={`flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-mono ${
                  isActive('/game') ? 'bg-[#ff004f]/20 text-white' : 'text-gray-400 hover:text-white'
                }`}
              >
                <Gamepad2 className="w-4 h-4 text-[#ff004f]" />
                <span>ARENA TERMINAL</span>
              </Link>
            )}
          </div>
        )}
      </div>
    </header>
  );
};
