import React from 'react';
import { Link } from 'react-router-dom';

export default function Landing() {
  return (
    <div className="min-h-screen bg-navy-900">
      {/* Header */}
      <nav className="border-b border-navy-600 px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="text-gold-500 text-2xl">★</span>
          <span className="font-display text-xl font-bold text-white">Fantasy Politics</span>
        </div>
        <div className="flex gap-3">
          <Link to="/login" className="btn-secondary">Sign In</Link>
          <Link to="/register" className="btn-primary">Get Started</Link>
        </div>
      </nav>

      {/* Hero */}
      <div className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-navy-700/30 to-navy-900" />
        <div className="relative max-w-4xl mx-auto px-6 py-24 text-center">
          <div className="inline-block bg-gold-500/10 border border-gold-500/30 text-gold-400 text-sm font-bold px-4 py-2 rounded-full mb-8">
            The #1 Fantasy Game for Political Junkies
          </div>
          <h1 className="font-display text-5xl md:text-7xl font-bold text-white mb-6 leading-tight">
            Draft the <span className="text-gold-400">Politicians.</span><br />
            Win the <span className="text-crimson-400">Season.</span>
          </h1>
          <p className="text-xl text-gray-300 mb-10 max-w-2xl mx-auto">
            Fantasy Politics is fantasy sports for Washington insiders and armchair analysts alike.
            Draft senators, representatives, and more — earn points based on their daily political activity.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link to="/register" className="btn-primary text-lg px-8 py-3">
              Create Your Team
            </Link>
            <Link to="/login" className="btn-secondary text-lg px-8 py-3">
              Sign In
            </Link>
          </div>
        </div>
      </div>

      {/* Features */}
      <div className="max-w-6xl mx-auto px-6 py-20">
        <h2 className="font-display text-3xl font-bold text-center text-white mb-12">
          How It Works
        </h2>
        <div className="grid md:grid-cols-3 gap-8">
          {[
            {
              icon: '🗳️',
              title: 'Draft Your Roster',
              desc: 'Join a league and draft real politicians in a live snake draft. Choose from senators, representatives, governors, and more.',
            },
            {
              icon: '📊',
              title: 'Earn Daily Points',
              desc: 'Our game administrator assigns daily point values based on each politician\'s news-making activities. Big day? Big points.',
            },
            {
              icon: '🏆',
              title: 'Climb the Standings',
              desc: 'Set your starting lineup each day, work the waiver wire, and climb the league standings to claim the championship.',
            },
          ].map((f) => (
            <div key={f.title} className="card text-center">
              <div className="text-5xl mb-4">{f.icon}</div>
              <h3 className="text-xl font-bold text-gold-400 mb-3">{f.title}</h3>
              <p className="text-gray-400">{f.desc}</p>
            </div>
          ))}
        </div>
      </div>

      {/* CTA */}
      <div className="bg-navy-800 border-y border-navy-600 py-16 text-center">
        <h2 className="font-display text-3xl font-bold text-white mb-4">
          Ready to play the political game?
        </h2>
        <p className="text-gray-400 mb-8">Join thousands of players drafting the nation's most influential politicians.</p>
        <Link to="/register" className="btn-primary text-lg px-10 py-3">
          Start Playing Free
        </Link>
      </div>

      <footer className="text-center py-8 text-gray-600 text-sm">
        © 2025 Fantasy Politics. For entertainment purposes only.
      </footer>
    </div>
  );
}
