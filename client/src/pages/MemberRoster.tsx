import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import api from '../lib/api';
import { useAuth } from '../lib/auth';
import toast from 'react-hot-toast';
import LoadingSpinner from '../components/LoadingSpinner';
import PartyBadge from '../components/PartyBadge';

export default function MemberRoster() {
  const { id, memberId } = useParams<{ id: string; memberId: string }>();
  const { user } = useAuth();
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  // Trade form state
  const [myRoster, setMyRoster] = useState<any[]>([]);
  const [myMemberId, setMyMemberId] = useState('');
  const [showTradeForm, setShowTradeForm] = useState(false);
  const [offered, setOffered] = useState<Set<string>>(new Set());
  const [requested, setRequested] = useState<Set<string>>(new Set());
  const [tradeMessage, setTradeMessage] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    api.get(`/leagues/${id}/roster/${memberId}`)
      .then((r) => setData(r.data))
      .finally(() => setLoading(false));
  }, [id, memberId]);

  function openTradeForm() {
    if (myRoster.length === 0) {
      api.get(`/leagues/${id}/roster`).then((r) => {
        setMyRoster(r.data.roster ?? []);
        setMyMemberId(r.data.member?.id ?? '');
        setShowTradeForm(true);
      }).catch(() => toast.error('Could not load your roster'));
    } else {
      setShowTradeForm(true);
    }
  }

  function toggle(set: Set<string>, id: string): Set<string> {
    const next = new Set(set);
    next.has(id) ? next.delete(id) : next.add(id);
    return next;
  }

  async function handleProposeTrade(e: React.FormEvent) {
    e.preventDefault();
    if (offered.size === 0 || requested.size === 0) {
      toast.error('Select at least one politician to offer and one to request');
      return;
    }
    setSubmitting(true);
    try {
      await api.post(`/leagues/${id}/trades`, {
        recipientMemberId: memberId,
        offeredIds: Array.from(offered),
        requestedIds: Array.from(requested),
        message: tradeMessage.trim() || undefined,
      });
      toast.success('Trade offer sent!');
      setShowTradeForm(false);
      setOffered(new Set());
      setRequested(new Set());
      setTradeMessage('');
    } catch (err: any) {
      toast.error(err.response?.data?.error || 'Failed to send trade offer');
    } finally {
      setSubmitting(false);
    }
  }

  if (loading) return <div className="flex justify-center py-20"><LoadingSpinner size="lg" /></div>;
  if (!data) return <div className="text-cream-400">Roster not found.</div>;

  const { member, roster } = data;
  const seasonTotal = roster.reduce((s: number, p: any) => s + (p.seasonTotal ?? 0), 0);
  const isOwnRoster = member.user.id === user?.id;

  return (
    <div>
      <div className="mb-6">
        <div className="text-sm text-cream-500 mb-1">
          <Link to={`/leagues/${id}`} className="hover:text-cream-300">League</Link> / Rosters / {member.teamName}
        </div>
        <div className="flex items-start justify-between">
          <div>
            <h1 className="font-display text-4xl font-bold text-white">{member.teamName}</h1>
            <p className="text-cream-400 mt-1">
              {member.user.username} · Season Total:{' '}
              <strong className="text-gold-400">{seasonTotal.toFixed(1)} pts</strong>
            </p>
          </div>
          {!isOwnRoster && (
            <div className="flex gap-2">
              <Link to={`/leagues/${id}/trades`} className="btn-secondary text-xs px-3 py-2">
                Trade Block
              </Link>
              <button onClick={openTradeForm} className="btn-primary text-xs px-3 py-2">
                Propose Trade
              </button>
            </div>
          )}
        </div>
      </div>

      <div className="card mb-6">
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

      {/* Trade proposal form */}
      {showTradeForm && !isOwnRoster && (
        <div className="card">
          <div className="flex items-center justify-between mb-5">
            <div>
              <div className="overline mb-1">New Trade Offer</div>
              <h2 className="font-display font-bold uppercase text-2xl text-cream-100">
                Propose a Trade
              </h2>
            </div>
            <button onClick={() => setShowTradeForm(false)} className="text-cream-500 hover:text-cream-300 text-xl leading-none">
              ✕
            </button>
          </div>

          <form onSubmit={handleProposeTrade}>
            <div className="grid md:grid-cols-2 gap-6 mb-5">
              {/* Your offer */}
              <div>
                <div className="overline mb-3" style={{ color: '#3b6ef8' }}>
                  You offer ({offered.size} selected)
                </div>
                {myRoster.length === 0 ? (
                  <p className="text-cream-500 text-sm">Your roster is empty.</p>
                ) : (
                  <div className="space-y-1 max-h-72 overflow-y-auto pr-1">
                    {[...myRoster]
                      .sort((a, b) => (b.isStarter ? 1 : 0) - (a.isStarter ? 1 : 0))
                      .map((p: any) => (
                        <label
                          key={p.id}
                          className={`flex items-center gap-3 p-2 rounded-sm cursor-pointer transition-colors ${
                            offered.has(p.id) ? 'bg-ink-600 border border-gold-400/40' : 'hover:bg-ink-700 border border-transparent'
                          }`}
                        >
                          <input
                            type="checkbox"
                            checked={offered.has(p.id)}
                            onChange={() => setOffered(toggle(offered, p.id))}
                            className="accent-gold-400"
                          />
                          <PartyBadge party={p.party} />
                          <div className="min-w-0">
                            <div className="text-sm text-cream-200 font-semibold truncate">{p.name}</div>
                            <div className="text-xs text-cream-500">{p.seasonTotal?.toFixed(1) ?? '0'} pts</div>
                          </div>
                        </label>
                      ))}
                  </div>
                )}
              </div>

              {/* Their offer */}
              <div>
                <div className="overline mb-3" style={{ color: '#cc1a2e' }}>
                  You request ({requested.size} selected)
                </div>
                <div className="space-y-1 max-h-72 overflow-y-auto pr-1">
                  {[...roster]
                    .sort((a, b) => (b.isStarter ? 1 : 0) - (a.isStarter ? 1 : 0))
                    .map((p: any) => (
                      <label
                        key={p.id}
                        className={`flex items-center gap-3 p-2 rounded-sm cursor-pointer transition-colors ${
                          requested.has(p.id) ? 'bg-ink-600 border border-gold-400/40' : 'hover:bg-ink-700 border border-transparent'
                        }`}
                      >
                        <input
                          type="checkbox"
                          checked={requested.has(p.id)}
                          onChange={() => setRequested(toggle(requested, p.id))}
                          className="accent-gold-400"
                        />
                        <PartyBadge party={p.party} />
                        <div className="min-w-0">
                          <div className="text-sm text-cream-200 font-semibold truncate">{p.name}</div>
                          <div className="text-xs text-cream-500">{p.seasonTotal?.toFixed(1) ?? '0'} pts</div>
                        </div>
                      </label>
                    ))}
                </div>
              </div>
            </div>

            <div className="mb-5">
              <label className="label">Message (optional)</label>
              <input
                type="text"
                className="input"
                placeholder="Leave a note with your offer..."
                value={tradeMessage}
                onChange={(e) => setTradeMessage(e.target.value)}
                maxLength={200}
              />
            </div>

            <div className="flex gap-3">
              <button type="submit" className="btn-primary" disabled={submitting}>
                {submitting ? 'Sending...' : 'Send Trade Offer'}
              </button>
              <button type="button" className="btn-secondary" onClick={() => setShowTradeForm(false)}>
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
