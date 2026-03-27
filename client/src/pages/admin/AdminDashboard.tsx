import React from 'react';
import { Link } from 'react-router-dom';

const sections = [
  {
    to: '/admin/ai-scoring',
    title: 'AI Score Generator',
    desc: 'Paste today\'s news headlines and let Claude auto-generate scores.',
    highlight: true,
    icon: (
      <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09z" />
      </svg>
    ),
  },
  {
    to: '/admin/scores',
    title: 'Daily Score Entry',
    desc: 'Manually enter today\'s point values for all active politicians.',
    icon: (
      <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 3v11.25A2.25 2.25 0 006 16.5h2.25M3.75 3h-1.5m1.5 0h16.5m0 0h1.5m-1.5 0v11.25A2.25 2.25 0 0118 16.5h-2.25m-7.5 0h7.5m-7.5 0l-1 3m8.5-3l1 3m0 0l.5 1.5m-.5-1.5h-9.5m0 0l-.5 1.5" />
      </svg>
    ),
  },
  {
    to: '/admin/politicians',
    title: 'Manage Politicians',
    desc: 'Add, edit, or deactivate politicians. Bulk import via CSV.',
    icon: (
      <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z" />
      </svg>
    ),
  },
  {
    to: '/admin/leagues',
    title: 'Manage Leagues',
    desc: 'View all leagues, reset drafts, deactivate leagues.',
    icon: (
      <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 21v-8.25M15.75 21v-8.25M8.25 21v-8.25M3 9l9-6 9 6m-1.5 12V10.332A48.36 48.36 0 0012 9.75c-2.551 0-5.056.2-7.5.582V21M3 21h18M12 6.75h.008v.008H12V6.75z" />
      </svg>
    ),
  },
  {
    to: '/admin/users',
    title: 'Manage Users',
    desc: 'View all users, promote to admin, deactivate accounts.',
    icon: (
      <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M18 18.72a9.094 9.094 0 003.741-.479 3 3 0 00-4.682-2.72m.94 3.198l.001.031c0 .225-.012.447-.037.666A11.944 11.944 0 0112 21c-2.17 0-4.207-.576-5.963-1.584A6.062 6.062 0 016 18.719m12 0a5.971 5.971 0 00-.941-3.197m0 0A5.995 5.995 0 0012 12.75a5.995 5.995 0 00-5.058 2.772m0 0a3 3 0 00-4.681 2.72 8.986 8.986 0 003.74.477m.94-3.197a5.971 5.971 0 00-.94 3.197M15 6.75a3 3 0 11-6 0 3 3 0 016 0zm6 3a2.25 2.25 0 11-4.5 0 2.25 2.25 0 014.5 0zm-13.5 0a2.25 2.25 0 11-4.5 0 2.25 2.25 0 014.5 0z" />
      </svg>
    ),
  },
];

export default function AdminDashboard() {
  return (
    <div>
      <div className="mb-8">
        <div className="inline-block bg-crimson-600/20 border border-crimson-600/40 text-crimson-400 text-xs font-display font-bold uppercase tracking-widest px-3 py-1 rounded-sm mb-3">
          Admin Panel
        </div>
        <h1 className="font-display font-extrabold uppercase text-5xl text-cream-100" style={{ letterSpacing: '-0.01em' }}>
          Admin Dashboard
        </h1>
        <p className="text-cream-400 mt-2 text-sm">Manage the Fantasy Politics game from here.</p>
      </div>

      <div className="grid sm:grid-cols-2 gap-4">
        {sections.map((s) => (
          <Link
            key={s.to}
            to={s.to}
            className={`card block group transition-colors ${s.highlight ? 'border-gold-400/40' : ''}`}
            style={s.highlight ? { borderLeft: '3px solid #3b6ef8' } : {}}
          >
            <div className={`mb-3 ${s.highlight ? 'text-gold-400' : 'text-cream-500'}`}>
              {s.icon}
            </div>
            <h2 className={`font-display font-bold uppercase text-xl mb-2 group-hover:text-gold-400 transition-colors tracking-wide ${s.highlight ? 'text-gold-400' : 'text-cream-100'}`}>
              {s.title}
              {s.highlight && (
                <span className="ml-2 text-xs bg-gold-400 text-ink-900 px-1.5 py-0.5 rounded-sm font-bold uppercase tracking-wide">
                  Key
                </span>
              )}
            </h2>
            <p className="text-cream-400 text-sm">{s.desc}</p>
          </Link>
        ))}
      </div>
    </div>
  );
}
