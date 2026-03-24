import React from 'react';
import { Link } from 'react-router-dom';

const sections = [
  {
    to: '/admin/ai-scoring',
    icon: '✨',
    title: 'AI Score Generator',
    desc: 'Paste today\'s news headlines and let Claude auto-generate scores.',
    highlight: true,
  },
  {
    to: '/admin/scores',
    icon: '📊',
    title: 'Daily Score Entry',
    desc: 'Manually enter today\'s point values for all active politicians.',
  },
  {
    to: '/admin/politicians',
    icon: '👤',
    title: 'Manage Politicians',
    desc: 'Add, edit, or deactivate politicians. Bulk import via CSV.',
  },
  {
    to: '/admin/leagues',
    icon: '🏛️',
    title: 'Manage Leagues',
    desc: 'View all leagues, reset drafts, deactivate leagues.',
  },
  {
    to: '/admin/users',
    icon: '👥',
    title: 'Manage Users',
    desc: 'View all users, promote to admin, deactivate accounts.',
  },
];

export default function AdminDashboard() {
  return (
    <div>
      <div className="mb-8">
        <div className="inline-block bg-crimson-600/20 border border-crimson-600/40 text-crimson-400 text-xs font-bold px-3 py-1 rounded-full mb-3">
          ADMIN PANEL
        </div>
        <h1 className="font-display text-4xl font-bold text-white">Admin Dashboard</h1>
        <p className="text-gray-400 mt-2">Manage the Fantasy Politics game from here.</p>
      </div>

      <div className="grid sm:grid-cols-2 gap-4">
        {sections.map((s) => (
          <Link
            key={s.to}
            to={s.to}
            className={`card block hover:border-gold-500 transition-colors group ${s.highlight ? 'border-gold-500/50' : ''}`}
          >
            <div className="text-4xl mb-3">{s.icon}</div>
            <h2 className={`text-xl font-bold mb-2 group-hover:text-gold-400 transition-colors ${s.highlight ? 'text-gold-400' : 'text-white'}`}>
              {s.title}
              {s.highlight && <span className="ml-2 text-xs bg-gold-500 text-navy-900 px-1.5 py-0.5 rounded">KEY</span>}
            </h2>
            <p className="text-gray-400 text-sm">{s.desc}</p>
          </Link>
        ))}
      </div>
    </div>
  );
}
