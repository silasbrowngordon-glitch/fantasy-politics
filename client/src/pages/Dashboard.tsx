import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../lib/auth';
import api from '../lib/api';
import LoadingSpinner from '../components/LoadingSpinner';

interface Membership {
  id: string;
  teamName: string;
  isCommissioner: boolean;
  league: {
    id: string;
    name: string;
    draftStatus: string;
    members: Array<{ id: string; user: { username: string } }>;
  };
  dailyTotals: Array<{ date: string; totalPoints: number }>;
}

interface Score {
  id: string;
  points: number;
  date: string;
  politician: { name: string; party: string };
}

export default function Dashboard() {
  const { user } = useAuth();
  const [memberships, setMemberships] = useState<Membership[]>([]);
  const [topScores, setTopScores] = useState<Score[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      api.get('/leagues'),
      api.get('/scores'),
    ]).then(([leaguesRes, scoresRes]) => {
      setMemberships(leaguesRes.data.leagues);
      setTopScores(scoresRes.data.scores.slice(0, 5));
    }).finally(() => setLoading(false));
  }, []);

  if (loading) return (
    <div className="flex justify-center py-20">
      <LoadingSpinner size="lg" />
    </div>
  );

  const today = new Date().toISOString().split('T')[0];

  const draftStatusStyle = (s: string) => {
    if (s === 'COMPLETE') return 'bg-green-950 text-green-400 border border-green-900';
    if (s === 'DRAFTING') return 'bg-yellow-950 text-yellow-400 border border-yellow-900';
    return 'bg-ink-600 text-cream-500 border border-ink-500';
  };

  return (
    <div>
      <div className="mb-10">
        <div className="overline mb-2">Your Dashboard</div>
        <h1 className="font-display font-extrabold uppercase text-5xl text-cream-100 leading-none"
            style={{ letterSpacing: '-0.01em' }}>
          Welcome back,{' '}
          <span style={{ color: '#d4a843' }}>{user?.username}</span>
        </h1>
        <p className="text-cream-400 mt-2 text-sm">Here's your political lineup at a glance.</p>
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        {/* Leagues */}
        <div className="lg:col-span-2 space-y-4">
          <div className="flex items-center justify-between mb-2">
            <h2 className="font-display font-bold uppercase text-lg text-cream-200 tracking-widest">
              Your Leagues
            </h2>
            <Link to="/leagues" className="text-gold-400 text-xs font-display font-bold uppercase tracking-widest hover:text-gold-300 transition-colors">
              View All →
            </Link>
          </div>

          {memberships.length === 0 ? (
            <div className="card text-center py-16">
              <div className="text-5xl mb-4">🗳️</div>
              <h3 className="font-display font-bold uppercase text-2xl text-cream-100 mb-2">
                No Leagues Yet
              </h3>
              <p className="text-cream-400 mb-6 text-sm">Create or join a league to start playing.</p>
              <Link to="/leagues" className="btn-primary">Get Started</Link>
            </div>
          ) : (
            memberships.map((m) => {
              const todayTotal = m.dailyTotals?.find(
                (dt: any) => dt.date?.split('T')[0] === today
              )?.totalPoints ?? 0;
              const seasonTotal = m.dailyTotals?.reduce((sum: number, dt: any) => sum + dt.totalPoints, 0) ?? 0;

              return (
                <Link
                  key={m.id}
                  to={`/leagues/${m.league.id}`}
                  className="card block group transition-colors duration-150"
                  style={{ borderLeft: '3px solid transparent' }}
                  onMouseEnter={(e) => (e.currentTarget.style.borderLeftColor = '#d4a843')}
                  onMouseLeave={(e) => (e.currentTarget.style.borderLeftColor = 'transparent')}
                >
                  <div className="flex items-start justify-between">
                    <div>
                      <div className="flex items-center gap-2 mb-1 flex-wrap">
                        <h3 className="font-display font-bold uppercase text-xl text-cream-100 group-hover:text-gold-400 transition-colors"
                            style={{ letterSpacing: '0.02em' }}>
                          {m.league.name}
                        </h3>
                        {m.isCommissioner && (
                          <span className="text-xs bg-gold-400 text-ink-900 px-1.5 py-0.5 rounded-sm font-display font-bold uppercase tracking-wide">
                            Commish
                          </span>
                        )}
                      </div>
                      <p className="text-cream-400 text-sm">{m.teamName}</p>
                      <div className="flex items-center gap-2 mt-2 flex-wrap">
                        <span className={`text-xs px-2 py-0.5 rounded-sm font-display font-bold uppercase tracking-wide ${draftStatusStyle(m.league.draftStatus)}`}>
                          {m.league.draftStatus}
                        </span>
                        <span className="text-xs text-cream-500">
                          {m.league.members.length} members
                        </span>
                      </div>
                    </div>
                    <div className="text-right shrink-0">
                      <div className="font-display font-extrabold text-3xl text-gold-400 leading-none">
                        {seasonTotal.toFixed(1)}
                      </div>
                      <div className="overline text-cream-500 mt-1">Season pts</div>
                      <div className="text-sm text-cream-300 mt-1 font-display">
                        +{todayTotal.toFixed(1)} today
                      </div>
                    </div>
                  </div>
                </Link>
              );
            })
          )}
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          <div className="card">
            <h2 className="font-display font-bold uppercase tracking-widest text-sm text-cream-300 mb-4">
              Today's Top Scores
            </h2>
            {topScores.length === 0 ? (
              <p className="text-cream-500 text-sm">No scores entered yet today.</p>
            ) : (
              <div className="space-y-1">
                {topScores.map((score, i) => (
                  <div key={score.id} className="flex items-center justify-between py-2 border-b border-ink-600 last:border-0">
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-cream-500 w-5 font-display font-bold">{i + 1}</span>
                      <div>
                        <div className="text-sm font-semibold text-cream-100">{score.politician.name}</div>
                        <div className="text-xs text-cream-500">{score.politician.party}</div>
                      </div>
                    </div>
                    <span className="font-display font-bold text-gold-400">{score.points}</span>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="card">
            <h2 className="font-display font-bold uppercase tracking-widest text-sm text-cream-300 mb-4">
              Quick Links
            </h2>
            <div className="space-y-1">
              {[
                { to: '/leagues', icon: '🏟', label: 'My Leagues' },
                { to: '/politicians', icon: '👤', label: 'Politician Directory' },
                { to: '/scoring', icon: '📋', label: 'Scoring Rules' },
              ].map((l) => (
                <Link
                  key={l.to}
                  to={l.to}
                  className="flex items-center gap-3 py-2.5 text-cream-400 hover:text-gold-400 transition-colors border-b border-ink-700 last:border-0"
                >
                  <span>{l.icon}</span>
                  <span className="text-xs font-display font-bold uppercase tracking-widest">{l.label}</span>
                </Link>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
