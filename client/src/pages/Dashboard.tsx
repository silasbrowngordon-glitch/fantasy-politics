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

  return (
    <div>
      <div className="mb-8">
        <h1 className="font-display text-4xl font-bold text-white">
          Welcome back, <span className="text-gold-400">{user?.username}</span>
        </h1>
        <p className="text-gray-400 mt-1">Here's your political lineup at a glance.</p>
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        {/* Leagues */}
        <div className="lg:col-span-2 space-y-4">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-bold text-white">Your Leagues</h2>
            <Link to="/leagues" className="text-gold-400 hover:text-gold-300 text-sm font-semibold">
              View All →
            </Link>
          </div>

          {memberships.length === 0 ? (
            <div className="card text-center py-12">
              <div className="text-5xl mb-4">🗳️</div>
              <h3 className="text-xl font-bold text-white mb-2">No leagues yet</h3>
              <p className="text-gray-400 mb-6">Create or join a league to start playing.</p>
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
                  className="card block hover:border-gold-500 transition-colors group"
                >
                  <div className="flex items-start justify-between">
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className="text-lg font-bold text-white group-hover:text-gold-400 transition-colors">
                          {m.league.name}
                        </h3>
                        {m.isCommissioner && (
                          <span className="text-xs bg-gold-500 text-navy-900 px-1.5 py-0.5 rounded font-bold">
                            COMMISSIONER
                          </span>
                        )}
                      </div>
                      <p className="text-sm text-gray-400">{m.teamName}</p>
                      <div className="flex items-center gap-2 mt-2">
                        <span className={`text-xs px-2 py-0.5 rounded font-bold ${
                          m.league.draftStatus === 'COMPLETE' ? 'bg-green-900 text-green-300' :
                          m.league.draftStatus === 'DRAFTING' ? 'bg-yellow-900 text-yellow-300' :
                          'bg-gray-700 text-gray-400'
                        }`}>
                          {m.league.draftStatus}
                        </span>
                        <span className="text-xs text-gray-500">
                          {m.league.members.length} members
                        </span>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-2xl font-bold text-gold-400">{seasonTotal.toFixed(1)}</div>
                      <div className="text-xs text-gray-500">season pts</div>
                      <div className="text-sm text-gray-300 mt-1">+{todayTotal.toFixed(1)} today</div>
                    </div>
                  </div>
                </Link>
              );
            })
          )}
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Today's top scores */}
          <div className="card">
            <h2 className="text-lg font-bold text-white mb-4">Today's Top Scores</h2>
            {topScores.length === 0 ? (
              <p className="text-gray-500 text-sm">No scores entered yet today.</p>
            ) : (
              <div className="space-y-2">
                {topScores.map((score, i) => (
                  <div key={score.id} className="flex items-center justify-between py-1.5 border-b border-navy-700 last:border-0">
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-gray-500 w-5">{i + 1}.</span>
                      <div>
                        <div className="text-sm font-semibold text-white">{score.politician.name}</div>
                        <div className="text-xs text-gray-500">{score.politician.party}</div>
                      </div>
                    </div>
                    <span className="text-gold-400 font-bold">{score.points}</span>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Quick links */}
          <div className="card">
            <h2 className="text-lg font-bold text-white mb-4">Quick Links</h2>
            <div className="space-y-2">
              <Link to="/leagues" className="flex items-center gap-3 py-2 text-gray-300 hover:text-white transition-colors">
                <span>🏟️</span> <span className="text-sm">My Leagues</span>
              </Link>
              <Link to="/politicians" className="flex items-center gap-3 py-2 text-gray-300 hover:text-white transition-colors">
                <span>👤</span> <span className="text-sm">Politician Directory</span>
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
