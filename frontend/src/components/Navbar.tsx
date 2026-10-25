import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useSound } from '../context/SoundContext';
import {
  Volume2, VolumeX, LogIn, LogOut, Trophy, BookOpen,
  Shield, Gamepad2, Menu, X
} from 'lucide-react';
import { CircleShape, TriangleShape, SquareShape } from './GeometricShapes';
import { IEEELogo } from './IEEELogo';

export const Navbar: React.FC = () => {
  const { user, team, logout } = useAuth();
  const { isMuted, toggleMute } = useSound();
  const location = useLocation();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const isActive = (path: string) => location.pathname === path;

  const navLinks = [
    {
      to: '/rules',
      icon: <BookOpen className="w-4 h-4 text-[#ff2e7e]" aria-hidden="true" />,
      label: 'Rules',
      show: true,
    },
    {
      to: '/leaderboard',
      icon: <Trophy className="w-4 h-4 text-[#ffd166]" aria-hidden="true" />,
      label: 'Leaderboard',
      show: user?.role === 'ADMIN',
    },
    {
      to: '/admin/dashboard',
      icon: <Shield className="w-4 h-4 text-[#ff004f]" aria-hidden="true" />,
      label: 'Admin Panel',
      show: user?.role === 'ADMIN',
    },
    {
      to: '/game',
      icon: <Gamepad2 className="w-4 h-4 text-[#ff004f]" aria-hidden="true" />,
      label: 'Arena',
      show: user?.role === 'TEAM',
    },
  ].filter(link => link.show);

  const linkClass = (path: string) =>
    `flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#ff004f] ${
      isActive(path)
        ? 'bg-gray-800 text-white border border-gray-700'
        : 'text-gray-400 hover:text-white hover:bg-gray-900'
    }`;

  return (
    <nav className="sticky top-0 z-50 border-b border-gray-800/80 bg-[#08090c]/90 backdrop-blur-md" role="navigation" aria-label="Main navigation">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Brand Logo */}
          <Link to="/" className="flex items-center gap-3 group flex-shrink-0" aria-label="SQUID PROTOCOL — Home">
            <IEEELogo
              size="md"
              withContainer
              containerClassName="group-hover:border-[#ff004f]/50 transition-colors"
            />
            <div>
              <div className="flex items-center gap-1.5">
                <span className="font-display font-black tracking-widest text-base sm:text-lg text-white group-hover:text-[#ff004f] transition-colors">
                  SQUID<span className="text-[#ff004f]"> PROTOCOL</span>
                </span>
                <div className="hidden lg:flex items-center gap-1 opacity-70 ml-0.5" aria-hidden="true">
                  <CircleShape size={9} color="#ff004f" />
                  <TriangleShape size={9} color="#ff2e7e" />
                  <SquareShape size={9} color="#00f0ff" />
                </div>
              </div>
              <span className="hidden sm:block text-[10px] font-mono tracking-widest text-gray-500 uppercase leading-none">
                IEEE NISB · SURVIVE THE SYSTEM
              </span>
            </div>
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden sm:flex items-center gap-2">
            {navLinks.map(link => (
              <Link key={link.to} to={link.to} className={linkClass(link.to)}>
                {link.icon}
                <span>{link.label}</span>
              </Link>
            ))}

            {/* Audio Toggle */}
            <button
              onClick={toggleMute}
              aria-label={isMuted ? 'Unmute audio' : 'Mute audio'}
              title={isMuted ? 'Unmute Game SFX' : 'Mute Game SFX'}
              className="p-2 rounded-lg bg-gray-900 border border-gray-800 text-gray-400 hover:text-white hover:border-gray-700 transition-colors"
            >
              {isMuted
                ? <VolumeX className="w-4 h-4 text-gray-500" aria-hidden="true" />
                : <Volume2 className="w-4 h-4 text-[#00e676]" aria-hidden="true" />
              }
            </button>

            {/* Auth State */}
            {team ? (
              <div className="flex items-center gap-2">
                <div className="hidden md:flex flex-col items-end px-3 py-1 rounded bg-[#12151c] border border-gray-800 text-xs leading-tight">
                  <span className="font-mono text-gray-400">{team.teamCode}</span>
                  <span className="font-bold text-[#00e676]">{team.totalScore} PTS</span>
                </div>
                <button
                  onClick={() => logout()}
                  aria-label="Log out of team"
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-mono bg-red-950/40 text-red-400 border border-red-900/50 hover:bg-red-900/50 transition-colors"
                >
                  <LogOut className="w-3.5 h-3.5" aria-hidden="true" />
                  <span className="hidden sm:inline">LOG OUT</span>
                </button>
              </div>
            ) : user ? (
              <button
                onClick={() => logout()}
                aria-label="Log out"
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-mono bg-gray-800 text-gray-300 hover:bg-gray-700 transition-colors"
              >
                <LogOut className="w-3.5 h-3.5" aria-hidden="true" />
                <span>LOG OUT</span>
              </button>
            ) : (
              <Link
                to="/login"
                className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-md text-xs sm:text-sm font-semibold bg-[#ff004f] text-white hover:bg-[#ff2e7e] transition-colors shadow-[0_0_15px_rgba(255,0,79,0.35)]"
              >
                <LogIn className="w-4 h-4" aria-hidden="true" />
                <span>SIGN IN</span>
              </Link>
            )}
          </div>

          {/* Mobile: score badge + hamburger */}
          <div className="flex sm:hidden items-center gap-2">
            {team && (
              <span className="font-bold text-[#00e676] text-sm font-mono">{team.totalScore} PTS</span>
            )}
            <button
              onClick={toggleMute}
              aria-label={isMuted ? 'Unmute audio' : 'Mute audio'}
              className="p-2 rounded-lg bg-gray-900 border border-gray-800 text-gray-400"
            >
              {isMuted
                ? <VolumeX className="w-4 h-4 text-gray-500" aria-hidden="true" />
                : <Volume2 className="w-4 h-4 text-[#00e676]" aria-hidden="true" />
              }
            </button>
            <button
              onClick={() => setMobileMenuOpen(prev => !prev)}
              aria-label={mobileMenuOpen ? 'Close menu' : 'Open menu'}
              aria-expanded={mobileMenuOpen}
              aria-controls="mobile-menu"
              className="p-2 rounded-lg bg-gray-900 border border-gray-800 text-gray-400 hover:text-white"
            >
              {mobileMenuOpen
                ? <X className="w-5 h-5" aria-hidden="true" />
                : <Menu className="w-5 h-5" aria-hidden="true" />
              }
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Dropdown Menu */}
      {mobileMenuOpen && (
        <div
          id="mobile-menu"
          className="sm:hidden border-t border-gray-800/80 bg-[#08090c]/95 backdrop-blur-md animate-fade-in"
          role="menu"
        >
          <div className="px-4 py-3 space-y-1">
            {navLinks.map(link => (
              <Link
                key={link.to}
                to={link.to}
                role="menuitem"
                onClick={() => setMobileMenuOpen(false)}
                className={`flex items-center gap-2 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors w-full ${
                  isActive(link.to)
                    ? 'bg-gray-800 text-white'
                    : 'text-gray-400 hover:text-white hover:bg-gray-900'
                }`}
              >
                {link.icon}
                <span>{link.label}</span>
              </Link>
            ))}

            <div className="pt-2 border-t border-gray-800/60 mt-2">
              {team ? (
                <div className="space-y-2">
                  <div className="flex items-center justify-between px-3 py-2 rounded-lg bg-[#12151c] border border-gray-800 text-xs font-mono">
                    <span className="text-gray-400">{team.teamCode}</span>
                    <span className="font-bold text-[#00e676]">{team.totalScore} PTS</span>
                  </div>
                  <button
                    onClick={() => { logout(); setMobileMenuOpen(false); }}
                    className="w-full flex items-center justify-center gap-2 px-3 py-2.5 rounded-lg text-sm font-mono bg-red-950/40 text-red-400 border border-red-900/50"
                  >
                    <LogOut className="w-4 h-4" aria-hidden="true" />
                    <span>EXIT GAME</span>
                  </button>
                </div>
              ) : user ? (
                <button
                  onClick={() => { logout(); setMobileMenuOpen(false); }}
                  className="w-full flex items-center justify-center gap-2 px-3 py-2.5 rounded-lg text-sm font-mono bg-gray-800 text-gray-300"
                >
                  <LogOut className="w-4 h-4" aria-hidden="true" />
                  <span>LOGOUT</span>
                </button>
              ) : (
                <Link
                  to="/login"
                  onClick={() => setMobileMenuOpen(false)}
                  className="w-full flex items-center justify-center gap-2 px-3 py-2.5 rounded-lg text-sm font-semibold bg-[#ff004f] text-white"
                >
                  <LogIn className="w-4 h-4" aria-hidden="true" />
                  <span>TEAM LOGIN</span>
                </Link>
              )}
            </div>
          </div>
        </div>
      )}
    </nav>
  );
};
