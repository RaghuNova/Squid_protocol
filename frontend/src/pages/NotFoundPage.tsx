import React from 'react';
import { Link } from 'react-router-dom';
import { Navbar } from '../components/Navbar';
import { Footer } from '../components/Footer';
import { AlertOctagon, ArrowLeft, Home } from 'lucide-react';

export const NotFoundPage: React.FC = () => {
  return (
    <div className="min-h-screen bg-[#08090c] text-gray-100 flex flex-col font-sans">
      <Navbar />
      <main className="flex-1 flex items-center justify-center p-4" id="main-content">
        <div className="max-w-md w-full p-8 sm:p-10 rounded-2xl bg-[#12151c] border border-gray-800 text-center space-y-5 animate-slide-up">
          <div aria-hidden="true">
            <AlertOctagon className="w-14 h-14 text-[#ff004f] mx-auto" />
          </div>

          <div className="space-y-2">
            <p className="font-mono text-xs text-[#ff004f] uppercase tracking-widest">Error 404</p>
            <h1 className="font-display font-black text-6xl sm:text-7xl text-white">404</h1>
            <h2 className="font-display font-bold text-lg text-gray-300 uppercase tracking-widest">
              PAGE NOT FOUND
            </h2>
          </div>

          <p className="text-sm font-mono text-gray-400 leading-relaxed">
            The page you requested could not be found. Please check the URL or return to the home page.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
            <Link
              to="/"
              className="inline-flex items-center gap-2 px-6 py-2.5 rounded-xl bg-[#ff004f] text-white font-mono text-xs font-semibold transition-all hover:bg-[#ff2e7e] active:scale-95 shadow-[0_0_15px_rgba(255,0,79,0.3)]"
            >
              <Home className="w-4 h-4" aria-hidden="true" />
              <span>RETURN HOME</span>
            </Link>
            <button
              onClick={() => window.history.back()}
              className="inline-flex items-center gap-2 px-6 py-2.5 rounded-xl bg-gray-800 hover:bg-gray-700 text-white font-mono text-xs font-semibold transition-colors"
            >
              <ArrowLeft className="w-4 h-4" aria-hidden="true" />
              <span>GO BACK</span>
            </button>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
};
