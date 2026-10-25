import React, { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { CircleShape, TriangleShape, SquareShape } from '../../components/GeometricShapes';
import {
  LayoutDashboard,
  Radio,
  Clock,
  Users,
  FileQuestion,
  ListOrdered,
  Sliders,
  QrCode,
  History,
  Settings,
  LogOut,
  ExternalLink,
  Menu,
  X,
  Shield,
} from 'lucide-react';
import { Badge } from '../../components/ui/Badge';

interface AdminLayoutProps {
  children: React.ReactNode;
}

export const AdminLayout: React.FC<AdminLayoutProps> = ({ children }) => {
  const { user, logout } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [mobileMenuOpen, setMobileMenuOpen] = useState<boolean>(false);

  const handleLogout = async () => {
    await logout();
    navigate('/admin');
  };

  const navItems = [
    { path: '/admin/dashboard', label: 'Command Overview', icon: LayoutDashboard },
    { path: '/admin/live-control', label: 'Live Signal Control', icon: Radio },
    { path: '/admin/rounds', label: 'Round Controls', icon: Clock },
    { path: '/admin/teams', label: 'Squad Registry', icon: Users },
    { path: '/admin/questions', label: 'Question Matrix', icon: FileQuestion },
    { path: '/admin/submissions', label: 'Live Submissions', icon: ListOrdered },
    { path: '/admin/scores', label: 'Score Adjustments', icon: Sliders },
    { path: '/admin/qr', label: 'QR Code Matrix', icon: QrCode },
    { path: '/admin/audit-logs', label: 'Audit Log Trail', icon: History },
    { path: '/admin/settings', label: 'System Settings', icon: Settings },
  ];

  return (
    <div className="min-h-screen bg-[#08090d] text-gray-100 flex flex-col md:flex-row font-sans selection:bg-[#ff004f] selection:text-white">
      {/* Skip to Main Content Link for Keyboard Users */}
      <a
        href="#admin-main"
        className="sr-only focus:not-sr-only focus:absolute focus:top-3 focus:left-3 focus:z-50 focus:px-4 focus:py-2 focus:rounded-xl focus:bg-[#ff004f] focus:text-white focus:font-mono focus:text-xs focus:font-bold focus:shadow-lg focus:outline-none focus:ring-2 focus:ring-white"
      >
        Skip to main content
      </a>

      {/* Mobile Admin Header Bar */}
      <div className="md:hidden flex items-center justify-between p-4 bg-[#0a0c10] border-b border-[#1e2432]">
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1 p-1 rounded bg-[#0f1218] border border-[#1e2432]">
            <CircleShape size={12} color="#ff004f" />
            <TriangleShape size={12} color="#ff2e7e" />
            <SquareShape size={12} color="#00f0ff" />
          </div>
          <span className="font-display font-black text-xs tracking-wider text-white">
            CONTROL ROOM
          </span>
        </div>
        <button
          onClick={() => setMobileMenuOpen(prev => !prev)}
          aria-expanded={mobileMenuOpen}
          aria-label="Toggle admin navigation"
          className="p-1.5 rounded-lg bg-[#0f1218] border border-[#1e2432] text-gray-400 hover:text-white"
        >
          {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
        </button>
      </div>

      {/* Admin Sidebar */}
      <aside
        className={`${
          mobileMenuOpen ? 'block' : 'hidden'
        } md:flex w-full md:w-64 bg-[#0a0c10] border-r border-[#1e2432] flex-col justify-between flex-shrink-0 z-40`}
      >
        <div className="p-5 space-y-6">
          {/* Logo & Terminal Identity (Desktop) */}
          <div className="hidden md:flex items-center gap-2.5 pb-4 border-b border-[#1e2432]">
            <div className="flex items-center gap-1 p-1 rounded-lg bg-[#0f1218] border border-[#1e2432]">
              <CircleShape size={14} color="#ff004f" />
              <TriangleShape size={14} color="#ff2e7e" />
              <SquareShape size={14} color="#00f0ff" />
            </div>
            <div>
              <span className="font-display font-black text-sm tracking-wider text-white block">
                CONTROL ROOM
              </span>
              <span className="text-[10px] font-mono text-[#ff004f] uppercase tracking-widest font-bold">
                ADMIN CONSOLE
              </span>
            </div>
          </div>

          {/* Navigation Links */}
          <nav className="space-y-1" aria-label="Admin navigation">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = location.pathname === item.path;

              return (
                <Link
                  key={item.path}
                  to={item.path}
                  onClick={() => setMobileMenuOpen(false)}
                  aria-current={isActive ? 'page' : undefined}
                  className={`flex items-center gap-3 px-3 py-2 rounded-xl font-mono text-xs transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#ff004f] ${
                    isActive
                      ? 'bg-[#ff004f]/15 text-white border border-[#ff004f]/40 font-bold'
                      : 'text-gray-400 hover:text-white hover:bg-[#0f1218]'
                  }`}
                >
                  <Icon className={`w-4 h-4 ${isActive ? 'text-[#ff004f]' : 'text-gray-400'}`} />
                  <span>{item.label}</span>
                </Link>
              );
            })}
          </nav>
        </div>

        {/* Footer Info & Logout */}
        <div className="p-4 border-t border-[#1e2432] space-y-3 font-mono text-xs">
          <div className="flex items-center justify-between text-gray-400 text-[11px]">
            <span>USER: <strong className="text-gray-200">{user?.username}</strong></span>
            <span className="text-[#00e676] flex items-center gap-1 font-bold">● ONLINE</span>
          </div>

          <div className="flex items-center gap-2">
            <Link
              to="/leaderboard"
              target="_blank"
              className="flex-1 py-1.5 px-2 rounded-lg bg-[#0f1218] hover:bg-[#151922] border border-[#1e2432] text-gray-300 text-[11px] flex items-center justify-center gap-1 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#ff004f]"
            >
              <span>Scoreboard</span>
              <ExternalLink className="w-3 h-3 text-gray-400" />
            </Link>
            <button
              onClick={handleLogout}
              className="py-1.5 px-3 rounded-lg bg-red-950/40 hover:bg-red-900/60 border border-red-900/40 text-red-400 text-[11px] flex items-center gap-1 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-500 cursor-pointer"
            >
              <LogOut className="w-3 h-3" />
              <span>Exit</span>
            </button>
          </div>
        </div>
      </aside>

      {/* Main Command Room Workspace */}
      <main id="admin-main" tabIndex={-1} className="flex-1 p-6 sm:p-8 overflow-y-auto max-w-7xl focus:outline-none">
        {children}
      </main>
    </div>
  );
};
