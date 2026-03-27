import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import api from '../lib/api';
import toast from 'react-hot-toast';
import LoadingSpinner from '../components/LoadingSpinner';
import PartyBadge from '../components/PartyBadge';

type TradeStatus = 'PENDING' | 'ACCEPTED' | 'REJECTED' | 'CANCELLED';

interface Politician {
  id: string;
  name: string;
  party: string;
  title: string;
  state: string;
}

interface Trade {
  id: string;
  status: TradeStatus;
  message: string | null;
  createdAt: string;
  proposer: { id: string; teamName: string; user: { id: string; username: string } };
  recipient: { id: string; teamName: string; user: { id: string; username: string } };
  offeredPoliticians: Politician[];
  requestedPoliticians: Politician[];
}

const STATUS_STYLE: Record<TradeStatus, string> = {
  PENDING: 'bg-yellow-950 text-yellow-400 border-yellow-900',
  ACCEPTED: 'bg-green-950 text-green-400 border-green-900',
  REJECTED: 'bg-red-950 text-red-400 border-red-900',
  CANCELLED: 'bg-ink-600 text-cream-500 border-ink-500',
};

function PoliticianList({ politicians }: { politicians: Politician[] }) {
  return (
    <div className="space-y-1">
      {politicians.map((p) => (
        <div key={p.id} className="flex items-center gap-2">
          <PartyBadge party={p.party} />
          <span className="text-sm text-cream-200 font-semibold">{p.name}</span>
          <span className="text-xs text-cream-500">{p.title} · {p.state}</span>
        </div>
      ))}
    </div>
  );
}

function TradeCard({
  trade,
  myMemberId,
  onAccept,
  onReject,
  onCancel,
}: {
  trade: Trade;
  myMemberId: string;
  onAccept: (id: string) => void;
  onReject: (id: string) => void;
  onCancel: (id: string) => void;
}) {
  const isProposer = trade.proposer.id === myMemberId;
  const isRecipient = trade.recipient.id === myMemberId;
  const isPending = trade.status === 'PENDING';

  return (
    <div className="card">
      {/* Header */}
      <div className="flex items-start justify-between mb-4">
        <div>
          <div className="flex items-center gap-2 flex-wrap">
            <span className="font-display font-bold text-cream-100 uppercase tracking-wide">
              {trade.proposer.teamName}
            </span>
            <span className="text-cream-500 text-sm">→</span>
            <span className="font-display font-bold text-cream-100 uppercase tracking-wide">
              {trade.recipient.teamName}
            </span>
            {isProposer && <span className="text-xs text-gold-400">(You proposed)</span>}
            {isRecipient && trade.status === 'PENDING' && (
              <span className="text-xs text-gold-400 font-bold">Incoming offer</span>
            )}
          </div>
          <div className="text-xs text-cream-500 mt-0.5">
            {new Date(trade.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
          </div>
        </div>
        <span className={`text-xs px-2 py-0.5 rounded-sm font-display font-bold uppercase tracking-wide border ${STATUS_STYLE[trade.status]}`}>
          {trade.status}
        </span>
      </div>

      {/* Trade items */}
      <div className="grid md:grid-cols-2 gap-4 mb-4">
        <div className="bg-ink-700/50 rounded-sm p-3 border border-ink-600">
          <div className="overline mb-2 text-xs" style={{ color: '#3b6ef8' }}>
            {trade.proposer.teamName} offers
          </div>
          <PoliticianList politicians={trade.offeredPoliticians} />
        </div>
        <div className="bg-ink-700/50 rounded-sm p-3 border border-ink-600">
          <div className="overline mb-2 text-xs" style={{ color: '#cc1a2e' }}>
            {trade.recipient.teamName} sends back
          </div>
          <PoliticianList politicians={trade.requestedPoliticians} />
        </div>
      </div>

      {trade.message && (
        <p className="text-cream-400 text-sm italic mb-4 border-l-2 border-ink-500 pl-3">
          "{trade.message}"
        </p>
      )}

      {/* Actions */}
      {isPending && (
        <div className="flex gap-2 pt-3 border-t border-ink-600">
          {isRecipient && (
            <>
              <button
                onClick={() => onAccept(trade.id)}
                className="btn-primary py-1.5 px-4 text-sm"
              >
                Accept
              </button>
              <button
                onClick={() => onReject(trade.id)}
                className="btn-secondary py-1.5 px-4 text-sm"
              >
                Reject
              </button>
            </>
          )}
          {isProposer && (
            <button
              onClick={() => onCancel(trade.id)}
              className="btn-secondary py-1.5 px-4 text-sm"
            >
              Cancel Offer
            </button>
          )}
        </div>
      )}
    </div>
  );
}

export default function Trades() {
  const { id: leagueId } = useParams<{ id: string }>();
  const [trades, setTrades] = useState<Trade[]>([]);
  const [myMemberId, setMyMemberId] = useState('');
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'pending' | 'history'>('pending');

  function loadTrades() {
    return api.get(`/leagues/${leagueId}/trades`).then((r) => {
      setTrades(r.data.trades);
      setMyMemberId(r.data.myMemberId);
    });
  }

  useEffect(() => {
    loadTrades().finally(() => setLoading(false));
  }, [leagueId]);

  async function handleAccept(tradeId: string) {
    try {
      await api.post(`/leagues/${leagueId}/trades/${tradeId}/accept`);
      toast.success('Trade accepted! Rosters updated.');
      await loadTrades();
    } catch (err: any) {
      toast.error(err.response?.data?.error || 'Failed to accept trade');
    }
  }

  async function handleReject(tradeId: string) {
    try {
      await api.post(`/leagues/${leagueId}/trades/${tradeId}/reject`);
      toast.success('Trade rejected.');
      await loadTrades();
    } catch (err: any) {
      toast.error(err.response?.data?.error || 'Failed to reject trade');
    }
  }

  async function handleCancel(tradeId: string) {
    try {
      await api.delete(`/leagues/${leagueId}/trades/${tradeId}`);
      toast.success('Trade offer cancelled.');
      await loadTrades();
    } catch (err: any) {
      toast.error(err.response?.data?.error || 'Failed to cancel trade');
    }
  }

  const pending = trades.filter((t) => t.status === 'PENDING');
  const history = trades.filter((t) => t.status !== 'PENDING');
  const incomingCount = pending.filter((t) => t.recipient.id === myMemberId).length;

  if (loading) return <div className="flex justify-center py-20"><LoadingSpinner size="lg" /></div>;

  return (
    <div>
      <div className="mb-6">
        <div className="text-sm text-cream-500 mb-1">
          <Link to={`/leagues/${leagueId}`} className="hover:text-cream-300">League</Link>
          {' '}/ Trades
        </div>
        <div className="flex items-center justify-between">
          <div>
            <h1 className="font-display font-extrabold uppercase text-4xl text-cream-100"
                style={{ letterSpacing: '-0.01em' }}>
              Trade Block
            </h1>
            <p className="text-cream-400 text-sm mt-1">
              Browse pending offers and trade history. Propose trades from any team's roster page.
            </p>
          </div>
          {incomingCount > 0 && (
            <div className="text-center">
              <div className="font-display font-extrabold text-4xl text-gold-400 leading-none">{incomingCount}</div>
              <div className="overline text-cream-500 mt-1">Incoming</div>
            </div>
          )}
        </div>
      </div>

      {/* Filter tabs */}
      <div className="flex gap-1 mb-6 border-b border-ink-600">
        {(['pending', 'history'] as const).map((tab) => (
          <button
            key={tab}
            onClick={() => setFilter(tab)}
            className={`px-4 py-2 font-display font-bold uppercase text-xs tracking-widest border-b-2 transition-colors ${
              filter === tab
                ? 'border-gold-400 text-gold-400'
                : 'border-transparent text-cream-500 hover:text-cream-300'
            }`}
          >
            {tab === 'pending' ? `Pending (${pending.length})` : `History (${history.length})`}
          </button>
        ))}
      </div>

      {filter === 'pending' && (
        <>
          {pending.length === 0 ? (
            <div className="card text-center py-16">
              <div className="text-5xl mb-4 text-cream-600">⇄</div>
              <h3 className="font-display font-bold uppercase text-2xl text-cream-100 mb-2">No Pending Trades</h3>
              <p className="text-cream-400 text-sm">
                Visit another team's roster page to propose a trade.
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {pending.map((t) => (
                <TradeCard
                  key={t.id}
                  trade={t}
                  myMemberId={myMemberId}
                  onAccept={handleAccept}
                  onReject={handleReject}
                  onCancel={handleCancel}
                />
              ))}
            </div>
          )}
        </>
      )}

      {filter === 'history' && (
        <>
          {history.length === 0 ? (
            <div className="card text-center py-16">
              <h3 className="font-display font-bold uppercase text-2xl text-cream-100 mb-2">No Trade History</h3>
              <p className="text-cream-400 text-sm">Completed, rejected, and cancelled trades will appear here.</p>
            </div>
          ) : (
            <div className="space-y-4">
              {history.map((t) => (
                <TradeCard
                  key={t.id}
                  trade={t}
                  myMemberId={myMemberId}
                  onAccept={handleAccept}
                  onReject={handleReject}
                  onCancel={handleCancel}
                />
              ))}
            </div>
          )}
        </>
      )}
    </div>
  );
}
