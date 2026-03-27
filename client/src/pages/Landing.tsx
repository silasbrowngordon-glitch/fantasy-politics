import React from 'react';
import { Link } from 'react-router-dom';
import Logo from '../components/Logo';

const STEPS = [
  {
    num: '01',
    title: 'Draft Your Roster',
    body: 'Join a league and pick real politicians in a live snake draft — senators, representatives, governors, and more.',
  },
  {
    num: '02',
    title: 'Earn Daily Points',
    body: 'Points are assigned every day based on each politician\'s news coverage, votes, speeches — and yes, scandals.',
  },
  {
    num: '03',
    title: 'Win the Season',
    body: 'Set your starting lineup, work the waiver wire, and climb the standings. The most chaotic roster wins.',
  },
];

const STATS = [
  { value: '500+', label: 'Active Politicians' },
  { value: 'Daily', label: 'Score Updates' },
  { value: 'Live', label: 'Draft Rooms' },
];

export default function Landing() {
  return (
    <div className="min-h-screen bg-ink-900" style={{
      backgroundImage: 'linear-gradient(rgba(255,255,255,0.018) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.018) 1px, transparent 1px)',
      backgroundSize: '40px 40px',
    }}>

      {/* Nav */}
      <nav className="border-b border-ink-600 px-6 py-4">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <Link to="/" className="flex items-center gap-3">
            <Logo size={36} />
            <span className="font-display text-xl font-bold uppercase tracking-widest text-cream-100">
              Fantasy Politics
            </span>
          </Link>
          <div className="flex gap-3">
            <Link to="/login" className="btn-secondary text-xs px-4 py-2">Sign In</Link>
            <Link to="/register" className="btn-primary text-xs px-4 py-2">Get Started</Link>
          </div>
        </div>
      </nav>

      {/* Hero */}
      <div className="max-w-6xl mx-auto px-6 pt-20 pb-16">
        <div className="max-w-4xl">
          <div className="overline mb-6">Season 2025 · Now Open</div>

          <h1 className="font-display font-extrabold uppercase leading-none text-cream-100 mb-6"
              style={{ fontSize: 'clamp(3.5rem, 9vw, 7rem)', letterSpacing: '-0.01em', lineHeight: '0.92' }}>
            Draft the<br />
            <span style={{ color: '#d4a843' }}>Politicians.</span><br />
            Win the<br />
            <span style={{ WebkitTextStroke: '2px #d4a843', color: 'transparent' }}>Season.</span>
          </h1>

          <p className="text-cream-300 text-lg leading-relaxed max-w-xl mt-8 mb-10 font-body">
            Fantasy sports for political obsessives. Draft real senators and representatives,
            score points on their daily activity — and cash in when they inevitably implode.
          </p>

          <div className="flex flex-wrap gap-4 items-center">
            <Link to="/register" className="btn-primary text-base px-8 py-3">
              Create Your Team
            </Link>
            <Link to="/login" className="btn-secondary text-base px-8 py-3">
              Sign In
            </Link>
          </div>
        </div>

        {/* Stats strip */}
        <div className="mt-16 pt-8 border-t border-ink-600 flex flex-wrap gap-12">
          {STATS.map((s) => (
            <div key={s.label}>
              <div className="font-display font-extrabold uppercase text-4xl text-gold-400 leading-none">
                {s.value}
              </div>
              <div className="overline mt-1 text-cream-500">{s.label}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Gold divider ticker */}
      <div className="bg-gold-400 py-2 overflow-hidden">
        <div className="flex gap-12 whitespace-nowrap font-display font-bold uppercase text-ink-900 text-sm tracking-widest px-6">
          {Array.from({ length: 8 }).map((_, i) => (
            <React.Fragment key={i}>
              <span>Draft · Vote · Score · Win</span>
              <span style={{ color: '#a07835' }}>★</span>
            </React.Fragment>
          ))}
        </div>
      </div>

      {/* How it works */}
      <div className="max-w-6xl mx-auto px-6 py-24">
        <div className="overline mb-4">How It Works</div>
        <h2 className="font-display font-extrabold uppercase text-5xl text-cream-100 mb-16"
            style={{ letterSpacing: '-0.01em' }}>
          Three steps to glory
        </h2>

        <div className="grid md:grid-cols-3 gap-0 border border-ink-600 rounded-sm overflow-hidden">
          {STEPS.map((step, i) => (
            <div
              key={step.num}
              className={`p-8 ${i < STEPS.length - 1 ? 'border-b md:border-b-0 md:border-r border-ink-600' : ''}`}
            >
              <div className="font-display font-extrabold text-6xl leading-none mb-4"
                   style={{ color: '#2e2e3d' }}>
                {step.num}
              </div>
              <h3 className="font-display font-bold uppercase text-2xl text-cream-100 mb-3"
                  style={{ letterSpacing: '0.02em' }}>
                {step.title}
              </h3>
              <p className="text-cream-400 text-sm leading-relaxed">{step.body}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Chaos bonus callout */}
      <div className="border-y border-ink-600 bg-ink-800">
        <div className="max-w-6xl mx-auto px-6 py-16 flex flex-col md:flex-row items-start md:items-center justify-between gap-8">
          <div>
            <div className="overline mb-3" style={{ color: '#c41e3a' }}>New This Season</div>
            <h2 className="font-display font-extrabold uppercase text-4xl text-cream-100 leading-tight"
                style={{ letterSpacing: '-0.01em' }}>
              Chaos Bonus.<br />
              <span style={{ color: '#d4a843' }}>Scandal pays.</span>
            </h2>
          </div>
          <div className="flex gap-8 flex-wrap">
            {[
              { pts: '+5', label: 'Major Gaffe' },
              { pts: '+8', label: 'Ethics Probe' },
              { pts: '+10', label: 'Indictment' },
            ].map((b) => (
              <div key={b.label} className="text-center">
                <div className="font-display font-extrabold text-4xl text-gold-400 leading-none">{b.pts}</div>
                <div className="overline mt-1 text-cream-500">{b.label}</div>
              </div>
            ))}
          </div>
          <Link to="/register" className="btn-primary shrink-0">
            Start Playing Free
          </Link>
        </div>
      </div>

      {/* Footer */}
      <div className="max-w-6xl mx-auto px-6 py-12 flex flex-col md:flex-row items-center justify-between gap-4 border-t border-ink-600 mt-0">
        <div className="flex items-center gap-3">
          <Logo size={28} />
          <span className="font-display font-bold uppercase tracking-widest text-cream-400 text-sm">
            Fantasy Politics
          </span>
        </div>
        <p className="text-cream-500 text-xs">
          © 2025 Fantasy Politics · For entertainment purposes only
        </p>
        <div className="flex gap-6">
          <Link to="/scoring" className="text-cream-500 hover:text-gold-400 text-xs font-display uppercase tracking-widest transition-colors">
            Scoring Rules
          </Link>
          <Link to="/login" className="text-cream-500 hover:text-gold-400 text-xs font-display uppercase tracking-widest transition-colors">
            Sign In
          </Link>
        </div>
      </div>
    </div>
  );
}
