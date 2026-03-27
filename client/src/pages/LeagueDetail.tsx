import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import api from '../lib/api';
import { useAuth } from '../lib/auth';
import LoadingSpinner from '../components/LoadingSpinner';
import { SCORING_TYPE_MAP, type ScoringType } from '../lib/scoringTypes';

export default function LeagueDetail() {
  const { id } = useParams<{ id: string }>();
  const { user } = useAuth();
  const [data, setData] = useState<any>(null);
  const [myMember, setMyMember] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get(`/leagues/${id}`).then((r) => {
      setData(r.data);
      const me = r.data.league.members.find((m: any) => m.user.id === user?.id);
      setMyMember(me);
    }).finally(() => setLoading(false));
  }, [id]);

  if (loading) return <div className="flex justify-center py-20"><LoadingSpinner size="lg" /></div>;
  if (!data) return <div className="text-cream-400">League not found.</div>;

  const { league } = data;
  const today = new Date().toISOString().split('T')[0];

  return (
    <div>
      {/* Header */}
      <div className="flex items-start justify-between mb-6">
        <div>
          <div className="text-sm text-cream-500 mb-1">
            <Link to="/leagues" className="hover:text-cream-300">Leagues</Link> / {league.name}
          </div>
          <h1 className="font-display text-4xl font-bold text-white">{league.name}</h1>
          <div className="flex flex-wrap items-center gap-2 mt-2">
            <span className={`text-xs px-2 py-0.5 rounded-sm font-display font-bold uppercase tracking-wide ${
              league.draftStatus === 'COMPLETE' ? 'bg-green-950 text-green-400 border border-green-900' :
              league.draftStatus === 'DRAFTING' ? 'bg-yellow-950 text-yellow-400 border border-yellow-900' :
              'bg-ink-600 text-cream-500 border border-ink-500'
            }`}>{league.draftStatus}</span>
            <span className="text-sm text-cream-400">{league.members.length}/{league.maxMembers} members</span>
            <span className="text-sm text-cream-400">
              Invite: <code className="text-gold-500 font-mono font-bold">{league.inviteCode}</code>
            </span>
            {(league.scoringTypes ?? []).map((t: ScoringType) => {
              const info = SCORING_TYPE_MAP.get(t);
              return (
                <span key={t} className={`text-xs px-2 py-0.5 rounded-sm font-display font-bold uppercase tracking-wide border ${info?.badgeColor ?? 'bg-ink-600 text-cream-400 border-ink-500'}`}>
                  {info?.label ?? t}
                </span>
              );
            })}
          </div>
        </div>
        <div className="flex gap-3 flex-wrap">
          {myMember && (
            <Link to={`/leagues/${id}/roster`} className="btn-secondary">My Roster</Link>
          )}
          {myMember && league.draftStatus === 'COMPLETE' && (
            <Link to={`/leagues/${id}/trades`} className="btn-secondary">Trades</Link>
          )}
          {(league.draftStatus === 'DRAFTING' || (myMember?.isCommissioner && league.draftStatus === 'PREDRAFT')) && (
            <Link to={`/leagues/${id}/draft`} className="btn-primary">
              {league.draftStatus === 'PREDRAFT' ? 'Go to Draft Room' : 'Live Draft →'}
            </Link>
          )}
        </div>
      </div>

      {/* Standings */}
      <div className="card">
        <h2 className="text-xl font-bold text-white mb-4">Standings</h2>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="border-b border-ink-600">
              <tr>
                <th className="table-th">#</th>
                <th className="table-th">Team</th>
                <th className="table-th text-right">Today</th>
                <th className="table-th text-right">Season Total</th>
                <th className="table-th"></th>
              </tr>
            </thead>
            <tbody>
              {league.members.map((member: any, i: number) => {
                const isMe = member.user.id === user?.id;
                return (
                  <tr key={member.id} className={`table-row ${isMe ? 'bg-ink-700/50' : ''}`}>
                    <td className="table-td">
                      <span className={`font-bold text-lg ${i === 0 ? 'text-gold-400' : i === 1 ? 'text-cream-400' : i === 2 ? 'text-yellow-700' : 'text-cream-500'}`}>
                        {i + 1}
                      </span>
                    </td>
                    <td className="table-td">
                      <div>
                        <span className="font-semibold text-white">{member.teamName}</span>
                        {isMe && <span className="ml-2 text-xs text-gold-500">(You)</span>}
                        {member.isCommissioner && <span className="ml-2 text-xs text-cream-500">Commissioner</span>}
                      </div>
                      <div className="text-xs text-cream-500">{member.user.username}</div>
                    </td>
                    <td className="table-td text-right">
                      <span className="text-cream-300">+{(member.todayTotal ?? 0).toFixed(1)}</span>
                    </td>
                    <td className="table-td text-right">
                      <span className="font-bold text-gold-400 text-lg">{(member.seasonTotal ?? 0).toFixed(1)}</span>
                    </td>
                    <td className="table-td">
                      <Link
                        to={`/leagues/${id}/roster/${member.id}`}
                        className="text-xs text-gold-400 hover:text-gold-300"
                      >
                        View Roster
                      </Link>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
