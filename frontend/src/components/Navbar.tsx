import React, { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useSound } from '../context/SoundContext';
import {
  Volume2, VolumeX, LogIn, LogOut, Trophy, BookOpen,
  Shield, Gamepad2, Menu, X
} from 'lucide-react';
import { ProtocolShape } from './ui/ProtocolShape';
import { IEEELogo } from './IEEELogo';

export const Navbar: React.FC = () => {
  const { user, team, logout } = useAuth();
  const { isMuted, toggleMute } = useSound();
  const location = useLocation();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  // Hairline bottom border strengthens after scroll (passive listener, rAF-throttled)
  useEffect(() => {
    let rAF = 0;
    const handleScroll = () => {
      if (rAF) return;
      rAF = requestAnimationFrame(() => {
        setScrolled(window.scrollY > 12);
        rAF = 0;
      });
    };
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => {
      window.removeEventListener('scroll', handleScroll);
      if (rAF) cancelAnimationFrame(rAF);
    };
  }, []);

  const isActive = (path: string) => location.pathname === path;

  const navLinks = [
    {
      to: '/rules',
      icon: <BookOpen className="w-4 h-4" aria-hidden="true" />,
      label: 'Rules',
      shape: 'circle' as const,
      show: true,
    },
    {
      to: '/leaderboard',
      icon: <Trophy className="w-4 h-4" aria-hidden="true" />,
      label: 'Leaderboard',
      shape: 'triangle' as const,
      show: user?.role === 'ADMIN',
    },
    {
      to: '/admin/dashboard',
      icon: <Shield className="w-4 h-4" aria-hidden="true" />,
      label: 'Admin Panel',
      shape: 'square' as const,
      show: user?.role === 'ADMIN',
    },
    {
      to: '/game',
      icon: <Gamepad2 className="w-4 h-4" aria-hidden="true" />,
      label: 'Arena',
      shape: 'square' as const,
      show: user?.role === 'TEAM',
    },
  ].filter(link => link.show);

  const linkClass = (path: string) =>
    `relative flex items-center gap-2 px-3 py-1.5 text-xs sm:text-sm font-medium transition-colors border-b-2 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-text-secondary focus-visible:ring-offset-2 focus-visible:ring-offset-canvas ${
      isActive(path)
        ? 'text-text-primary border-text-primary font-semibold'
        : 'text-text-muted hover:text-text-secondary border-transparent'
    }`;

  return (
    <nav
      className={`sticky top-0 z-50 bg-canvas transition-colors ${
        scrolled ? 'border-b border-border-strong' : 'border-b border-border-subtle'
      }`}
      role="navigation"
      aria-label="Main navigation"
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Brand Logo */}
          <Link to="/" className="flex items-center gap-3 group flex-shrink-0" aria-label="SQUID PROTOCOL — Home">
            <IEEELogo
              size="md"
              withContainer
              containerClassName="bg-surface border-border-subtle group-hover:border-border-strong transition-colors"
            />
            <div>
              <div className="flex items-center gap-2">
                <span className="font-display font-black tracking-wider text-base sm:text-lg text-text-primary">
                  SQUID<span className="text-[#ff004f]"> PROTOCOL</span>
                </span>
                {/* Structural Protocol markers: 01 (Circle), 02 (Triangle), 03 (Square) */}
                <div className="hidden sm:flex items-center gap-1.5 px-2 py-0.5 rounded bg-surface border border-border-subtle text-text-muted" aria-hidden="true">
                  <ProtocolShape type="circle" size={9} strokeWidth={1.5} />
                  <ProtocolShape type="triangle" size={9} strokeWidth={1.5} />
                  <ProtocolShape type="square" size={9} strokeWidth={1.5} />
                </div>
              </div>
              <span className="hidden sm:block text-[10px] font-mono tracking-widest text-text-muted uppercase leading-none mt-0.5">
                IEEE NISB · TOURNAMENT ENGINE
              </span>
            </div>
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden sm:flex items-center gap-3">
            {navLinks.map(link => (
              <Link
                key={link.to}
                to={link.to}
                aria-current={isActive(link.to) ? 'page' : undefined}
                className={linkClass(link.to)}
              >
                {isActive(link.to) ? (
                  <ProtocolShape type={link.shape} size={10} className="text-text-primary" />
                ) : (
                  <span className="text-text-muted">{link.icon}</span>
                )}
                <span>{link.label}</span>
              </Link>
            ))}

            {/* Audio Toggle */}
            <button
              onClick={toggleMute}
              aria-label={isMuted ? 'Unmute audio' : 'Mute audio'}
              title={isMuted ? 'Unmute Game SFX' : 'Mute Game SFX'}
              className="p-2 rounded bg-surface border border-border-subtle text-text-muted hover:text-text-primary hover:border-border-strong transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-text-secondary cursor-pointer"
            >
              {isMuted
                ? <VolumeX className="w-4 h-4 text-text-muted" aria-hidden="true" />
                : <Volume2 className="w-4 h-4 text-signal-green" aria-hidden="true" />
              }
            </button>

            {/* Auth State */}
            {team ? (
              <div className="flex items-center gap-2">
                <div className="hidden md:flex flex-col items-end px-3 py-1 rounded bg-surface border border-border-subtle text-xs leading-tight font-mono">
                  <span className="text-text-muted text-[10px] tracking-wider">{team.teamCode}</span>
                  <span className="font-bold text-signal-green tabular-nums tracking-wide">{team.totalScore} PTS</span>
                </div>
                <button
                  onClick={() => logout()}
                  aria-label="Log out of team"
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded text-xs font-mono bg-surface border border-border-subtle text-text-secondary hover:text-signal-red hover:border-signal-red/40 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-text-secondary cursor-pointer"
                >
                  <LogOut className="w-3.5 h-3.5" aria-hidden="true" />
                  <span className="hidden sm:inline">LOG OUT</span>
                </button>
              </div>
            ) : user ? (
              <button
                onClick={() => logout()}
                aria-label="Log out"
                className="flex items-center gap-1.5 px-3 py-1.5 rounded text-xs font-mono bg-surface border border-border-subtle text-text-secondary hover:text-text-primary transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-text-secondary cursor-pointer"
              >
                <LogOut className="w-3.5 h-3.5" aria-hidden="true" />
                <span>LOG OUT</span>
              </button>
            ) : (
              <Link
                to="/login"
                className="flex items-center gap-2 px-4 py-2 rounded text-xs sm:text-sm font-display font-bold uppercase tracking-wider bg-[#ff004f] hover:bg-[#ff2e7e] text-white border border-[#ff004f] transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-text-secondary focus-visible:ring-offset-2 focus-visible:ring-offset-canvas"
              >
                <LogIn className="w-3.5 h-3.5" aria-hidden="true" />
                <span>SIGN IN</span>
              </Link>
            )}
          </div>

          {/* Mobile: score badge + sound toggle + hamburger */}
          <div className="flex sm:hidden items-center gap-2">
            {team && (
              <span className="font-bold text-signal-green text-sm font-mono tabular-nums">{team.totalScore} PTS</span>
            )}
            <button
              onClick={toggleMute}
              aria-label={isMuted ? 'Unmute audio' : 'Mute audio'}
              className="p-2 rounded bg-surface border border-border-form text-text-muted"
            >
              {isMuted
                ? <VolumeX className="w-4 h-4 text-text-muted" aria-hidden="true" />
                : <Volume2 className="w-4 h-4 text-signal-green" aria-hidden="true" />
              }
            </button>
            <button
              onClick={() => setMobileMenuOpen(prev => !prev)}
              aria-label={mobileMenuOpen ? 'Close menu' : 'Open menu'}
              aria-expanded={mobileMenuOpen}
              aria-controls="mobile-menu"
              className="p-2 rounded bg-surface border border-border-form text-text-secondary hover:text-text-primary cursor-pointer"
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
                className={`flex items-center gap-2 px-3 py-2.5 rounded text-sm font-medium transition-colors w-full ${
                  isActive(link.to)
                    ? 'bg-surface text-text-primary border border-border-strong font-semibold'
                    : 'text-text-secondary hover:text-text-primary hover:bg-surface/60'
                }`}
              >
                {isActive(link.to) ? (
                  <ProtocolShape type={link.shape} size={12} className="text-text-primary" />
                ) : (
                  <span className="text-text-muted">{link.icon}</span>
                )}
                <span>{link.label}</span>
              </Link>
            ))}

            <div className="pt-2 border-t border-border-subtle mt-2">
              {team ? (
                <div className="space-y-2">
                  <div className="flex items-center justify-between px-3 py-2 rounded bg-surface border border-border-subtle text-xs font-mono">
                    <span className="text-text-muted">{team.teamCode}</span>
                    <span className="font-bold text-signal-green tabular-nums">{team.totalScore} PTS</span>
                  </div>
                  <button
                    onClick={() => { logout(); setMobileMenuOpen(false); }}
                    className="w-full flex items-center justify-center gap-2 px-3 py-2.5 rounded text-sm font-mono bg-surface border border-border-subtle text-text-secondary hover:text-signal-red hover:bg-signal-red-subtle cursor-pointer"
                  >
                    <LogOut className="w-4 h-4" aria-hidden="true" />
                    <span>EXIT GAME</span>
                  </button>
                </div>
              ) : user ? (
                <button
                  onClick={() => { logout(); setMobileMenuOpen(false); }}
                  className="w-full flex items-center justify-center gap-2 px-3 py-2.5 rounded text-sm font-mono bg-surface border border-border-subtle text-text-secondary hover:text-text-primary cursor-pointer"
                >
                  <LogOut className="w-4 h-4" aria-hidden="true" />
                  <span>LOGOUT</span>
                </button>
              ) : (
                <Link
                  to="/login"
                  onClick={() => setMobileMenuOpen(false)}
                  className="w-full flex items-center justify-center gap-2 px-3 py-2.5 rounded text-sm font-semibold bg-[#ff004f] text-white"
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
