import React, { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { CircleShape, TriangleShape, SquareShape } from '../../components/GeometricShapes';
import { IEEELogo } from '../../components/IEEELogo';
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
} from 'lucide-react';

interface AdminLayoutProps {
  children: React.ReactNode;
}

export const AdminLayout: React.FC<AdminLayoutProps> = ({ children }) => {
  const { user, logout } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(false);

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

  const SidebarContent = () => (
    <>
      <div className="p-5 space-y-6 flex-1">
        {/* Logo & Terminal Identity */}
        <div className="flex items-center justify-between pb-4 border-b border-gray-800/80">
          <div className="flex items-center gap-2.5">
            <IEEELogo size="sm" withContainer />
            <div>
              <span className="font-display font-black text-sm tracking-wider text-white block">
                CONTROL ROOM
              </span>
              <span className="text-[10px] font-mono text-[#ff004f] uppercase tracking-widest">
                IEEE NISB · ADMIN
              </span>
            </div>
          </div>
          {/* Close button - mobile only */}
          <button
            className="md:hidden p-1.5 rounded-lg text-gray-400 hover:text-white hover:bg-gray-800 transition-colors"
            onClick={() => setSidebarOpen(false)}
            aria-label="Close navigation"
          >
            <X className="w-4 h-4" aria-hidden="true" />
          </button>
        </div>

        {/* Navigation Links */}
        <nav aria-label="Admin navigation">
          <ul className="space-y-0.5" role="list">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = location.pathname === item.path;

              return (
                <li key={item.path}>
                  <Link
                    to={item.path}
                    onClick={() => setSidebarOpen(false)}
                    aria-current={isActive ? 'page' : undefined}
                    className={`flex items-center gap-3 px-3 py-2.5 rounded-xl font-mono text-xs transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#ff004f] ${
                      isActive
                        ? 'bg-[#ff004f]/15 text-white border border-[#ff004f]/40 font-bold'
                        : 'text-gray-400 hover:text-white hover:bg-gray-800/50'
                    }`}
                  >
                    <Icon
                      className={`w-4 h-4 flex-shrink-0 ${isActive ? 'text-[#ff004f]' : 'text-gray-500'}`}
                      aria-hidden="true"
                    />
                    <span>{item.label}</span>
                  </Link>
                </li>
              );
            })}
          </ul>
        </nav>
      </div>

      {/* Footer info & Logout */}
      <div className="p-4 border-t border-gray-800/80 space-y-3 font-mono text-xs">
        <div className="flex items-center justify-between text-gray-400 text-[11px]">
          <span>USER: <strong className="text-gray-200">{user?.username}</strong></span>
          <span className="text-[#00e676] flex items-center gap-1">
            <span className="w-1.5 h-1.5 rounded-full bg-[#00e676] inline-block animate-pulse" aria-hidden="true"></span>
            ONLINE
          </span>
        </div>

        <div className="flex items-center gap-2">
          <Link
            to="/leaderboard"
            target="_blank"
            rel="noopener noreferrer"
            className="flex-1 py-1.5 px-2 rounded-lg bg-gray-900 hover:bg-gray-800 border border-gray-800 hover:border-gray-700 text-gray-300 text-[11px] flex items-center justify-center gap-1 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#ff004f]"
            aria-label="Open scoreboard in new tab"
          >
            <span>Scoreboard</span>
            <ExternalLink className="w-3 h-3" aria-hidden="true" />
          </Link>
          <button
            onClick={handleLogout}
            className="py-1.5 px-3 rounded-lg bg-red-950/40 hover:bg-red-900/50 border border-red-900/40 text-red-400 text-[11px] flex items-center gap-1.5 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-500 cursor-pointer"
            aria-label="Log out of admin console"
          >
            <LogOut className="w-3 h-3" aria-hidden="true" />
            <span>Exit</span>
          </button>
        </div>
      </div>
    </>
  );

  return (
    <div className="min-h-screen bg-[#06070a] text-gray-100 flex flex-col md:flex-row font-sans selection:bg-[#ff004f] selection:text-white">
      {/* Skip to Main Content Link for Keyboard Users */}
      <a
        href="#admin-main"
        className="sr-only focus:not-sr-only focus:absolute focus:top-3 focus:left-3 focus:z-50 focus:px-4 focus:py-2 focus:rounded-xl focus:bg-[#ff004f] focus:text-white focus:font-mono focus:text-xs focus:font-bold focus:shadow-lg focus:outline-none focus:ring-2 focus:ring-white"
      >
        Skip to main content
      </a>

      {/* Mobile sidebar overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/60 z-30 md:hidden"
          onClick={() => setSidebarOpen(false)}
          aria-hidden="true"
        />
      )}

      {/* Sidebar — always visible on md+, slide-in on mobile */}
      <aside
        id="admin-sidebar"
        className={`fixed md:sticky top-0 left-0 h-full md:h-screen w-64 bg-[#0a0c10] border-r border-gray-800/80 flex flex-col flex-shrink-0 z-40 transition-transform duration-300 ease-in-out ${
          sidebarOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'
        }`}
        aria-label="Admin sidebar"
      >
        <SidebarContent />
      </aside>

      {/* Main content area */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Mobile top bar */}
        <div className="md:hidden flex items-center justify-between px-4 py-3 border-b border-gray-800/80 bg-[#0a0c10] sticky top-0 z-20">
          <button
            onClick={() => setSidebarOpen(true)}
            className="flex items-center gap-2 text-gray-400 hover:text-white transition-colors"
            aria-label="Open navigation menu"
            aria-expanded={sidebarOpen}
            aria-controls="admin-sidebar"
          >
            <Menu className="w-5 h-5" aria-hidden="true" />
            <span className="font-mono text-xs font-bold text-[#ff004f] uppercase tracking-wider">CONTROL ROOM</span>
          </button>
          <span className="font-mono text-[11px] text-gray-500 uppercase">
            {navItems.find(n => n.path === location.pathname)?.label ?? 'Admin'}
          </span>
        </div>

        {/* Main Command Room Workspace */}
        <main
          id="admin-main"
          tabIndex={-1}
          className="flex-1 p-4 sm:p-6 md:p-8 overflow-y-auto max-w-7xl focus:outline-none"
        >
          {children}
        </main>
      </div>
    </div>
  );
};
