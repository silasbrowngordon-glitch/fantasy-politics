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
    <div className="min-h-screen bg-navy-900">
      <nav className="bg-navy-800 sticky top-0 z-50" style={{ borderBottom: '3px solid transparent', borderImage: 'linear-gradient(to right, #cc2936, #7c3aed, #1d4ed8) 1' }}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <Link to="/dashboard" className="flex items-center gap-2">
              <Logo size={40} />
              <span className="font-display text-xl font-bold text-white">Fantasy Politics</span>
            </Link>

            {/* Desktop nav */}
            <div className="hidden md:flex items-center gap-6">
              {navLinks.map((link) => (
                <Link
                  key={link.to}
                  to={link.to}
                  className={`text-sm font-semibold transition-colors ${
                    location.pathname.startsWith(link.to)
                      ? 'text-patriot-400'
                      : 'text-gray-300 hover:text-white'
                  }`}
                >
                  {link.label}
                </Link>
              ))}
            </div>

            <div className="hidden md:flex items-center gap-4">
              <span className="text-sm text-gray-400">
                {user?.username}
                {user?.role === 'ADMIN' && (
                  <span className="ml-2 text-xs bg-gold-500 text-navy-900 px-1.5 py-0.5 rounded font-bold">ADMIN</span>
                )}
              </span>
              <button onClick={handleLogout} className="btn-secondary text-sm py-1.5">
                Logout
              </button>
            </div>

            {/* Mobile menu button */}
            <button
              className="md:hidden text-gray-300 hover:text-white"
              onClick={() => setMenuOpen(!menuOpen)}
            >
              <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
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
          <div className="md:hidden bg-navy-800 border-t border-navy-600 px-4 pb-4">
            {navLinks.map((link) => (
              <Link
                key={link.to}
                to={link.to}
                className="block py-2 text-sm font-semibold text-gray-300 hover:text-white"
                onClick={() => setMenuOpen(false)}
              >
                {link.label}
              </Link>
            ))}
            <div className="pt-2 border-t border-navy-600 mt-2">
              <p className="text-xs text-gray-500 mb-2">{user?.email}</p>
              <button onClick={handleLogout} className="btn-secondary text-sm py-1.5 w-full">
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
