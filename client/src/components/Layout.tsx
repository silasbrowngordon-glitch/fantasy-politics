import React, { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../lib/auth';
import toast from 'react-hot-toast';
import Logo from './Logo';

export default function Layout({ children }: { children: React.ReactNode }) {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [menuOpen, setMenuOpen] = useState(false);

  async function handleLogout() {
    await logout();
    toast.success('Logged out');
    navigate('/');
  }

  const navLinks = [
    { to: '/dashboard', label: 'Dashboard' },
    { to: '/leagues', label: 'Leagues' },
    { to: '/politicians', label: 'Politicians' },
    { to: '/scoring', label: 'Scoring' },
  ];

  if (user?.role === 'ADMIN') {
    navLinks.push({ to: '/admin', label: 'Admin' });
  }

  return (
    <div className="min-h-screen bg-ink-900">
      <nav className="bg-ink-800 sticky top-0 z-50 border-b border-ink-600">
        {/* Gold accent line */}
        <div className="h-0.5 bg-gradient-to-r from-crimson-500 via-gold-400 to-gold-500" />

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-14">
            <Link to="/dashboard" className="flex items-center gap-3 shrink-0">
              <Logo size={32} />
              <span className="font-display font-bold uppercase tracking-widest text-cream-100 text-sm hidden sm:block">
                Fantasy Politics
              </span>
            </Link>

            {/* Desktop nav */}
            <div className="hidden md:flex items-center gap-1">
              {navLinks.map((link) => {
                const active = location.pathname === link.to ||
                  (link.to !== '/dashboard' && location.pathname.startsWith(link.to));
                return (
                  <Link
                    key={link.to}
                    to={link.to}
                    className={`
                      relative px-4 py-4 text-xs font-display font-bold uppercase tracking-widest
                      transition-colors duration-150
                      ${active ? 'text-gold-400' : 'text-cream-400 hover:text-cream-100'}
                    `}
                    style={{ letterSpacing: '0.1em' }}
                  >
                    {link.label}
                    {active && (
                      <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-gold-400" />
                    )}
                  </Link>
                );
              })}
            </div>

            <div className="hidden md:flex items-center gap-3">
              <span className="text-xs text-cream-400 font-display uppercase tracking-wide">
                {user?.username}
                {user?.role === 'ADMIN' && (
                  <span className="ml-2 bg-gold-400 text-ink-900 px-1.5 py-0.5 rounded-sm font-bold text-xs">
                    ADMIN
                  </span>
                )}
              </span>
              <button onClick={handleLogout} className="btn-secondary text-xs px-3 py-1.5">
                Logout
              </button>
            </div>

            {/* Mobile menu button */}
            <button
              className="md:hidden text-cream-400 hover:text-cream-100 p-1"
              onClick={() => setMenuOpen(!menuOpen)}
            >
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                {menuOpen
                  ? <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  : <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                }
              </svg>
            </button>
          </div>
        </div>

        {/* Mobile menu */}
        {menuOpen && (
          <div className="md:hidden bg-ink-800 border-t border-ink-600 px-4 pb-4">
            {navLinks.map((link) => (
              <Link
                key={link.to}
                to={link.to}
                className="block py-3 text-xs font-display font-bold uppercase tracking-widest text-cream-400 hover:text-gold-400 transition-colors border-b border-ink-700 last:border-0"
                onClick={() => setMenuOpen(false)}
                style={{ letterSpacing: '0.1em' }}
              >
                {link.label}
              </Link>
            ))}
            <div className="pt-3 flex items-center justify-between">
              <span className="text-xs text-cream-500">{user?.email}</span>
              <button onClick={handleLogout} className="btn-secondary text-xs px-3 py-1.5">
                Logout
              </button>
            </div>
          </div>
        )}
      </nav>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {children}
      </main>
    </div>
  );
}
