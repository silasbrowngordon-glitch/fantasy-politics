import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../lib/auth';
import toast from 'react-hot-toast';
import Logo from '../components/Logo';

export default function Register() {
  const { register } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (password.length < 8) {
      toast.error('Password must be at least 8 characters');
      return;
    }
    setLoading(true);
    try {
      await register(email, username, password);
      navigate('/dashboard');
      toast.success('Welcome to Fantasy Politics!');
    } catch (err: any) {
      toast.error(err.response?.data?.error || 'Registration failed');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen flex">
      {/* Left panel */}
      <div className="hidden lg:flex lg:w-1/2 flex-col justify-between p-12 border-r border-ink-600 bg-ink-800">
        <Link to="/" className="flex items-center gap-3">
          <Logo size={32} />
          <span className="font-display font-bold uppercase tracking-widest text-cream-200 text-sm">
            Fantasy Politics
          </span>
        </Link>
        <div>
          <div className="overline mb-4">Join Season 2025</div>
          <h2 className="font-display font-extrabold uppercase text-cream-100 leading-none mb-6"
              style={{ fontSize: '3.5rem', letterSpacing: '-0.01em', lineHeight: '0.92' }}>
            Your roster<br />
            <span style={{ color: '#3b6ef8' }}>awaits.</span>
          </h2>
          <p className="text-cream-400 text-sm leading-relaxed max-w-xs">
            Draft senators, representatives, and governors. Score points on their votes,
            speeches — and spectacular meltdowns.
          </p>
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
              <span className="font-display font-bold uppercase tracking-widest text-cream-200 text-sm">
                Fantasy Politics
              </span>
            </Link>
          </div>

          <div className="mb-8">
            <div className="overline mb-2">Get Started</div>
            <h1 className="font-display font-extrabold uppercase text-4xl text-cream-100"
                style={{ letterSpacing: '-0.01em' }}>
              Create Account
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
              <label className="label">Username</label>
              <input
                type="text"
                className="input"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="YourTeamName"
                required
                minLength={3}
                maxLength={20}
              />
            </div>
            <div>
              <label className="label">Password</label>
              <input
                type="password"
                className="input"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Min. 8 characters"
                required
                minLength={8}
              />
            </div>
            <button type="submit" className="btn-primary w-full py-3 text-base" disabled={loading}>
              {loading ? 'Creating account...' : 'Create Account'}
            </button>
          </form>

          <div className="mt-8 pt-6 border-t border-ink-600 text-center">
            <p className="text-cream-400 text-sm">
              Already have an account?{' '}
              <Link to="/login" className="text-gold-400 font-display font-bold uppercase tracking-wide text-xs">
                Sign in
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
