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
      icon: <BookOpen className="w-4 h-4" aria-hidden="true" />,
      label: 'Rules',
      show: true,
    },
    {
      to: '/leaderboard',
      icon: <Trophy className="w-4 h-4" aria-hidden="true" />,
      label: 'Leaderboard',
      show: user?.role === 'ADMIN',
    },
    {
      to: '/admin/dashboard',
      icon: <Shield className="w-4 h-4" aria-hidden="true" />,
      label: 'Admin Panel',
      show: user?.role === 'ADMIN',
    },
    {
      to: '/game',
      icon: <Gamepad2 className="w-4 h-4" aria-hidden="true" />,
      label: 'Arena',
      show: user?.role === 'TEAM',
    },
  ].filter(link => link.show);

  const linkClass = (path: string) =>
    `flex items-center gap-2 px-3 py-1.5 rounded-md text-xs sm:text-sm font-medium transition-colors border focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#ff004f] focus-visible:ring-offset-2 focus-visible:ring-offset-canvas ${
      isActive(path)
        ? 'bg-surface text-text-primary border-border-strong font-semibold'
        : 'text-text-secondary hover:text-text-primary hover:bg-surface/60 border-transparent'
    }`;

  return (
    <nav className="sticky top-0 z-50 border-b border-border-subtle bg-canvas" role="navigation" aria-label="Main navigation">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Brand Logo */}
          <Link to="/" className="flex items-center gap-3 group flex-shrink-0" aria-label="SQUID PROTOCOL — Home">
            <IEEELogo
              size="md"
              withContainer
              containerClassName="group-hover:border-border-strong transition-colors"
            />
            <div>
              <div className="flex items-center gap-1.5">
                <span className="font-display font-bold tracking-wide text-base sm:text-lg text-text-primary group-hover:text-[#ff004f] transition-colors">
                  SQUID<span className="text-[#ff004f]"> PROTOCOL</span>
                </span>
                {/* Structural Protocol markers: 01 (Red), 02 (Cyan), 03 (Green) */}
                <div className="hidden lg:flex items-center gap-1 opacity-80 ml-0.5" aria-hidden="true">
                  <CircleShape size={9} color="#ff004f" />
                  <TriangleShape size={9} color="#00f0ff" />
                  <SquareShape size={9} color="#00e676" />
                </div>
              </div>
              <span className="hidden sm:block text-[10px] font-mono tracking-wider text-text-muted uppercase leading-none">
                IEEE NISB · TOURNAMENT ENGINE
              </span>
            </div>
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden sm:flex items-center gap-2">
            {navLinks.map(link => (
              <Link
                key={link.to}
                to={link.to}
                aria-current={isActive(link.to) ? 'page' : undefined}
                className={linkClass(link.to)}
              >
                <span className={isActive(link.to) ? 'text-text-primary' : 'text-text-muted'}>
                  {link.icon}
                </span>
                <span>{link.label}</span>
              </Link>
            ))}

            {/* Audio Toggle */}
            <button
              onClick={toggleMute}
              aria-label={isMuted ? 'Unmute audio' : 'Mute audio'}
              title={isMuted ? 'Unmute Game SFX' : 'Mute Game SFX'}
              className="p-2 rounded-md bg-surface border border-border-form text-text-muted hover:text-text-primary hover:border-border-strong transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#ff004f] focus-visible:ring-offset-2 focus-visible:ring-offset-canvas cursor-pointer"
            >
              {isMuted
                ? <VolumeX className="w-4 h-4 text-text-muted" aria-hidden="true" />
                : <Volume2 className="w-4 h-4 text-[#00e676]" aria-hidden="true" />
              }
            </button>

            {/* Auth State */}
            {team ? (
              <div className="flex items-center gap-2">
                <div className="hidden md:flex flex-col items-end px-3 py-1 rounded-md bg-surface border border-border-subtle text-xs leading-tight font-mono">
                  <span className="text-text-muted">{team.teamCode}</span>
                  <span className="font-bold text-[#00e676] tabular-nums">{team.totalScore} PTS</span>
                </div>
                <button
                  onClick={() => logout()}
                  aria-label="Log out of team"
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-mono bg-surface border border-border-subtle text-text-secondary hover:text-[#ff004f] hover:border-[#ff004f]/40 hover:bg-signal-red-subtle transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#ff004f] cursor-pointer"
                >
                  <LogOut className="w-3.5 h-3.5" aria-hidden="true" />
                  <span className="hidden sm:inline">LOG OUT</span>
                </button>
              </div>
            ) : user ? (
              <button
                onClick={() => logout()}
                aria-label="Log out"
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-mono bg-surface border border-border-subtle text-text-secondary hover:text-text-primary hover:bg-surface-elevated transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#ff004f] cursor-pointer"
              >
                <LogOut className="w-3.5 h-3.5" aria-hidden="true" />
                <span>LOG OUT</span>
              </button>
            ) : (
              <Link
                to="/login"
                className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-md text-xs sm:text-sm font-semibold bg-[#ff004f] hover:bg-[#e00045] text-white transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#ff004f] focus-visible:ring-offset-2 focus-visible:ring-offset-canvas"
              >
                <LogIn className="w-4 h-4" aria-hidden="true" />
                <span>SIGN IN</span>
              </Link>
            )}
          </div>

          {/* Mobile: score badge + sound toggle + hamburger */}
          <div className="flex sm:hidden items-center gap-2">
            {team && (
              <span className="font-bold text-[#00e676] text-sm font-mono tabular-nums">{team.totalScore} PTS</span>
            )}
            <button
              onClick={toggleMute}
              aria-label={isMuted ? 'Unmute audio' : 'Mute audio'}
              className="p-2 rounded-md bg-surface border border-border-form text-text-muted"
            >
              {isMuted
                ? <VolumeX className="w-4 h-4 text-text-muted" aria-hidden="true" />
                : <Volume2 className="w-4 h-4 text-[#00e676]" aria-hidden="true" />
              }
            </button>
            <button
              onClick={() => setMobileMenuOpen(prev => !prev)}
              aria-label={mobileMenuOpen ? 'Close menu' : 'Open menu'}
              aria-expanded={mobileMenuOpen}
              aria-controls="mobile-menu"
              className="p-2 rounded-md bg-surface border border-border-form text-text-secondary hover:text-text-primary cursor-pointer"
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
          className="sm:hidden border-t border-border-subtle bg-canvas"
          role="menu"
        >
          <div className="px-4 py-3 space-y-1">
            {navLinks.map(link => (
              <Link
                key={link.to}
                to={link.to}
                role="menuitem"
                aria-current={isActive(link.to) ? 'page' : undefined}
                onClick={() => setMobileMenuOpen(false)}
                className={`flex items-center gap-2 px-3 py-2.5 rounded-md text-sm font-medium transition-colors w-full ${
                  isActive(link.to)
                    ? 'bg-surface text-text-primary border border-border-strong font-semibold'
                    : 'text-text-secondary hover:text-text-primary hover:bg-surface/60'
                }`}
              >
                <span className={isActive(link.to) ? 'text-text-primary' : 'text-text-muted'}>
                  {link.icon}
                </span>
                <span>{link.label}</span>
              </Link>
            ))}

            <div className="pt-2 border-t border-border-subtle mt-2">
              {team ? (
                <div className="space-y-2">
                  <div className="flex items-center justify-between px-3 py-2 rounded-md bg-surface border border-border-subtle text-xs font-mono">
                    <span className="text-text-muted">{team.teamCode}</span>
                    <span className="font-bold text-[#00e676] tabular-nums">{team.totalScore} PTS</span>
                  </div>
                  <button
                    onClick={() => { logout(); setMobileMenuOpen(false); }}
                    className="w-full flex items-center justify-center gap-2 px-3 py-2.5 rounded-md text-sm font-mono bg-surface border border-border-subtle text-text-secondary hover:text-[#ff004f] hover:bg-signal-red-subtle cursor-pointer"
                  >
                    <LogOut className="w-4 h-4" aria-hidden="true" />
                    <span>EXIT GAME</span>
                  </button>
                </div>
              ) : user ? (
                <button
                  onClick={() => { logout(); setMobileMenuOpen(false); }}
                  className="w-full flex items-center justify-center gap-2 px-3 py-2.5 rounded-md text-sm font-mono bg-surface border border-border-subtle text-text-secondary hover:text-text-primary cursor-pointer"
                >
                  <LogOut className="w-4 h-4" aria-hidden="true" />
                  <span>LOGOUT</span>
                </button>
              ) : (
                <Link
                  to="/login"
                  onClick={() => setMobileMenuOpen(false)}
                  className="w-full flex items-center justify-center gap-2 px-3 py-2.5 rounded-md text-sm font-semibold bg-[#ff004f] text-white"
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
