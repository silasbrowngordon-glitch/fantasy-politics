import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../lib/auth';
import toast from 'react-hot-toast';
import Logo from '../components/Logo';

export default function Login() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    try {
      await login(email, password);
      navigate('/dashboard');
    } catch (err: any) {
      toast.error(err.response?.data?.error || 'Login failed');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-ink-900 flex" style={{
      backgroundImage: 'linear-gradient(rgba(255,255,255,0.018) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.018) 1px, transparent 1px)',
      backgroundSize: '40px 40px',
    }}>
      {/* Left panel */}
      <div className="hidden lg:flex lg:w-1/2 flex-col justify-between p-12 border-r border-ink-600 bg-ink-800">
        <Link to="/" className="flex items-center gap-3">
          <Logo size={32} />
          <span className="font-display font-700 uppercase tracking-widest text-cream-200 text-sm">
            Fantasy Politics
          </span>
        </Link>
        <div>
          <div className="overline mb-4">Season 2025</div>
          <h2 className="font-display font-800 uppercase text-cream-100 leading-none mb-6"
              style={{ fontSize: '3.5rem', letterSpacing: '-0.01em', lineHeight: '0.92' }}>
            Draft the<br />
            <span style={{ color: '#d4a843' }}>chaos.</span><br />
            Score the<br />
            points.
          </h2>
          <div className="flex gap-8 pt-8 border-t border-ink-600">
            {[{ v: '+10', l: 'Indictment' }, { v: '+8', l: 'Ethics Probe' }, { v: '+5', l: 'Gaffe' }].map((s) => (
              <div key={s.l}>
                <div className="font-display font-800 text-3xl text-gold-400 leading-none">{s.v}</div>
                <div className="overline text-cream-500 mt-1">{s.l}</div>
              </div>
            ))}
          </div>
        </div>
        <p className="text-cream-500 text-xs">For entertainment purposes only.</p>
      </div>

      {/* Right panel */}
      <div className="flex-1 flex items-center justify-center px-6 py-12">
        <div className="w-full max-w-sm">
          {/* Mobile logo */}
          <div className="lg:hidden text-center mb-8">
            <Link to="/" className="inline-flex items-center gap-2">
              <Logo size={28} />
              <span className="font-display font-700 uppercase tracking-widest text-cream-200 text-sm">
                Fantasy Politics
              </span>
            </Link>
          </div>

          <div className="mb-8">
            <div className="overline mb-2">Welcome Back</div>
            <h1 className="font-display font-800 uppercase text-4xl text-cream-100"
                style={{ letterSpacing: '-0.01em' }}>
              Sign In
            </h1>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="label">Email</label>
              <input
                type="email"
                className="input"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                required
              />
            </div>
            <div>
              <label className="label">Password</label>
              <input
                type="password"
                className="input"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                required
              />
            </div>
            <button type="submit" className="btn-primary w-full py-3 text-base" disabled={loading}>
              {loading ? 'Signing in...' : 'Sign In'}
            </button>
          </form>

          <div className="mt-8 pt-6 border-t border-ink-600 text-center">
            <p className="text-cream-400 text-sm">
              No account?{' '}
              <Link to="/register" className="text-gold-400 font-display font-700 uppercase tracking-wide text-xs">
                Create one
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
