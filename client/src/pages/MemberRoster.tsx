import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import api from '../lib/api';
import LoadingSpinner from '../components/LoadingSpinner';
import PartyBadge from '../components/PartyBadge';

export default function MemberRoster() {
  const { id, memberId } = useParams<{ id: string; memberId: string }>();
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get(`/leagues/${id}/roster/${memberId}`)
      .then((r) => setData(r.data))
      .finally(() => setLoading(false));
  }, [id, memberId]);

  if (loading) return <div className="flex justify-center py-20"><LoadingSpinner size="lg" /></div>;
  if (!data) return <div className="text-cream-400">Roster not found.</div>;

  const { member, roster } = data;
  const seasonTotal = roster.reduce((s: number, p: any) => s + (p.seasonTotal ?? 0), 0);

  return (
    <div>
      <div className="mb-6">
        <div className="text-sm text-cream-500 mb-1">
          <Link to={`/leagues/${id}`} className="hover:text-cream-300">League</Link> / Rosters / {member.teamName}
        </div>
        <h1 className="font-display text-4xl font-bold text-white">{member.teamName}</h1>
        <p className="text-cream-400 mt-1">{member.user.username} · Season Total: <strong className="text-gold-400">{seasonTotal.toFixed(1)} pts</strong></p>
      </div>

      <div className="card">
        <table className="w-full">
          <thead className="border-b border-ink-600">
            <tr>
              <th className="table-th">Status</th>
              <th className="table-th">Politician</th>
              <th className="table-th">Party</th>
              <th className="table-th">Title / State</th>
              <th className="table-th text-right">Season Pts</th>
            </tr>
          </thead>
          <tbody>
            {[...roster]
              .sort((a, b) => (b.isStarter ? 1 : 0) - (a.isStarter ? 1 : 0))
              .map((p: any) => (
                <tr key={p.id} className="table-row">
                  <td className="table-td">
                    <span className={`text-xs px-2 py-0.5 rounded font-bold ${p.isStarter ? 'bg-green-900 text-green-300' : 'bg-ink-700 text-cream-400'}`}>
                      {p.isStarter ? 'STARTER' : 'BENCH'}
                    </span>
                  </td>
                  <td className="table-td">
                    <Link to={`/politicians/${p.id}`} className="font-semibold text-white hover:text-gold-400">
                      {p.name}
                    </Link>
                  </td>
                  <td className="table-td"><PartyBadge party={p.party} /></td>
                  <td className="table-td text-cream-400 text-xs">{p.title} · {p.state}</td>
                  <td className="table-td text-right font-bold text-gold-400">{(p.seasonTotal ?? 0).toFixed(1)}</td>
                </tr>
              ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
