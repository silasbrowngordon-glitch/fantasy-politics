import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import api from '../lib/api';
import LoadingSpinner from '../components/LoadingSpinner';
import PartyBadge from '../components/PartyBadge';

export default function PoliticianProfile() {
  const { id } = useParams<{ id: string }>();
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get(`/politicians/${id}`)
      .then((r) => setData(r.data))
      .finally(() => setLoading(false));
  }, [id]);

  if (loading) return <div className="flex justify-center py-20"><LoadingSpinner size="lg" /></div>;
  if (!data) return <div className="text-gray-400">Politician not found.</div>;

  const { politician } = data;

  return (
    <div>
      <div className="mb-2 text-sm text-gray-500">
        <Link to="/politicians" className="hover:text-gray-300">Politicians</Link> / {politician.name}
      </div>

      {/* Profile header */}
      <div className="card mb-6 flex items-start gap-6">
        {politician.imageUrl ? (
          <img
            src={politician.imageUrl}
            alt={politician.name}
            className="w-20 h-20 rounded-full object-cover border-2 border-navy-600"
          />
        ) : (
          <div className="w-20 h-20 rounded-full bg-navy-700 border-2 border-navy-600 flex items-center justify-center text-3xl font-bold text-gold-500">
            {politician.name.charAt(0)}
          </div>
        )}
        <div className="flex-1">
          <div className="flex items-center gap-3 flex-wrap">
            <h1 className="font-display text-4xl font-bold text-white">{politician.name}</h1>
            <PartyBadge party={politician.party} />
            {!politician.isActive && (
              <span className="text-xs bg-red-900 text-red-300 px-2 py-0.5 rounded">INACTIVE</span>
            )}
          </div>
          <p className="text-gray-400 mt-1">{politician.title} · {politician.state}</p>
          {politician.bio && <p className="text-gray-300 mt-3 max-w-2xl">{politician.bio}</p>}
          <div className="mt-4">
            <span className="text-3xl font-bold text-gold-400">{(politician.seasonTotal ?? 0).toFixed(1)}</span>
            <span className="text-gray-500 ml-2 text-sm">season points</span>
          </div>
        </div>
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        {/* Score history */}
        <div className="lg:col-span-2 card">
          <h2 className="text-xl font-bold text-white mb-4">Point History</h2>
          {politician.dailyScores.length === 0 ? (
            <p className="text-gray-500">No scores recorded yet.</p>
          ) : (
            <div className="space-y-1 max-h-[500px] overflow-y-auto">
              {politician.dailyScores.map((s: any) => (
                <div key={s.id} className="flex items-start justify-between py-2.5 border-b border-navy-700 last:border-0">
                  <div>
                    <div className="text-sm font-semibold text-white">
                      {new Date(s.date).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric', timeZone: 'UTC' })}
                    </div>
                    {s.note && <div className="text-xs text-gray-500 mt-0.5 max-w-md">{s.note}</div>}
                  </div>
                  <span className={`font-bold text-lg ml-4 ${s.points > 0 ? 'text-gold-400' : s.points < 0 ? 'text-red-400' : 'text-gray-500'}`}>
                    {s.points > 0 ? '+' : ''}{s.points}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* On rosters */}
        <div className="card">
          <h2 className="text-xl font-bold text-white mb-4">On Rosters</h2>
          {politician.draftPicks.length === 0 ? (
            <p className="text-gray-500 text-sm">Not drafted in any league.</p>
          ) : (
            <div className="space-y-3">
              {politician.draftPicks.map((dp: any) => (
                <Link
                  key={dp.id}
                  to={`/leagues/${dp.leagueMember.league.id}`}
                  className="block p-3 bg-navy-700 rounded hover:bg-navy-600 transition-colors"
                >
                  <div className="font-semibold text-white text-sm">{dp.leagueMember.league.name}</div>
                  <div className="text-xs text-gray-400 mt-0.5">
                    {dp.leagueMember.user.username}'s team
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
