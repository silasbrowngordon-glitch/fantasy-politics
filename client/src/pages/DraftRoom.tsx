import React, { useEffect, useState, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../lib/api';
import { useAuth } from '../lib/auth';
import toast from 'react-hot-toast';
import LoadingSpinner from '../components/LoadingSpinner';
import PartyBadge from '../components/PartyBadge';

const PICK_TIMER = 90; // seconds

export default function DraftRoom() {
  const { id } = useParams<{ id: string }>();
  const { user } = useAuth();
  const navigate = useNavigate();

  const [draftData, setDraftData] = useState<any>(null);
  const [politicians, setPoliticians] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [picking, setPicking] = useState(false);
  const [starting, setStarting] = useState(false);
  const [timer, setTimer] = useState(PICK_TIMER);
  const [search, setSearch] = useState('');
  const [partyFilter, setPartyFilter] = useState('');

  const fetchDraft = useCallback(async () => {
    const r = await api.get(`/leagues/${id}/draft`);
    setDraftData(r.data);
    if (r.data.league.draftStatus === 'COMPLETE') {
      toast.success('Draft is complete!');
      navigate(`/leagues/${id}`);
    }
  }, [id]);

  useEffect(() => {
    Promise.all([
      fetchDraft(),
      api.get('/politicians'),
    ]).then(([, polRes]) => {
      setPoliticians(polRes.data.politicians);
    }).finally(() => setLoading(false));
  }, [fetchDraft]);

  // Poll every 3 seconds
  useEffect(() => {
    const interval = setInterval(fetchDraft, 3000);
    return () => clearInterval(interval);
  }, [fetchDraft]);

  // Timer countdown
  useEffect(() => {
    if (!draftData || draftData.league.draftStatus !== 'DRAFTING') return;
    setTimer(PICK_TIMER);
    const tick = setInterval(() => {
      setTimer((t) => {
        if (t <= 1) {
          clearInterval(tick);
          // Auto-pick on timeout — server handles it, just refetch
          fetchDraft();
          return PICK_TIMER;
        }
        return t - 1;
      });
    }, 1000);
    return () => clearInterval(tick);
  }, [draftData?.currentPickNumber]);

  async function handleStartDraft() {
    setStarting(true);
    try {
      await api.post(`/leagues/${id}/draft/start`);
      toast.success('Draft started!');
      fetchDraft();
    } catch (err: any) {
      toast.error(err.response?.data?.error || 'Failed to start draft');
    } finally {
      setStarting(false);
    }
  }

  async function handlePick(politicianId: string) {
    setPicking(true);
    try {
      await api.post(`/leagues/${id}/draft/pick`, { politicianId });
      toast.success('Pick recorded!');
      fetchDraft();
    } catch (err: any) {
      toast.error(err.response?.data?.error || 'Pick failed');
    } finally {
      setPicking(false);
    }
  }

  if (loading) return <div className="flex justify-center py-20"><LoadingSpinner size="lg" /></div>;
  if (!draftData) return <div className="text-gray-400">League not found.</div>;

  const { league, pickedIds, currentPickNumber, totalPicks, currentPickMemberId } = draftData;
  const myMember = league.members.find((m: any) => m.userId === user?.id);
  const isMyTurn = myMember?.id === currentPickMemberId;
  const currentPicker = league.members.find((m: any) => m.id === currentPickMemberId);

  const availablePoliticians = politicians
    .filter((p) => !pickedIds.includes(p.id))
    .filter((p) => !search || p.name.toLowerCase().includes(search.toLowerCase()))
    .filter((p) => !partyFilter || p.party === partyFilter);

  const timerPct = (timer / PICK_TIMER) * 100;
  const timerColor = timer > 30 ? 'bg-green-500' : timer > 10 ? 'bg-yellow-500' : 'bg-red-500';

  return (
    <div>
      <div className="mb-6">
        <div className="text-sm text-gray-500 mb-1">League: {league.name}</div>
        <h1 className="font-display text-4xl font-bold text-white">Draft Room</h1>
      </div>

      {league.draftStatus === 'PREDRAFT' && (
        <div className="card text-center py-12 mb-6">
          <div className="text-5xl mb-4">🎯</div>
          <h2 className="text-2xl font-bold text-white mb-2">Draft hasn't started yet</h2>
          <p className="text-gray-400 mb-6">
            {league.members.length} member{league.members.length !== 1 ? 's' : ''} in the league.
            {myMember?.isCommissioner
              ? ' You are the commissioner — start the draft when everyone is ready.'
              : ' Waiting for the commissioner to start the draft.'}
          </p>
          {myMember?.isCommissioner && (
            <button onClick={handleStartDraft} className="btn-primary text-lg px-8 py-3" disabled={starting}>
              {starting ? 'Starting...' : 'Start Draft'}
            </button>
          )}
        </div>
      )}

      {league.draftStatus === 'DRAFTING' && (
        <>
          {/* Status bar */}
          <div className="card mb-6">
            <div className="flex flex-wrap items-center gap-4 mb-3">
              <div>
                <div className="text-xs text-gray-500">Pick</div>
                <div className="text-2xl font-bold text-white">{currentPickNumber}/{totalPicks}</div>
              </div>
              <div>
                <div className="text-xs text-gray-500">Now Picking</div>
                <div className="text-lg font-bold text-white">
                  {isMyTurn
                    ? <span className="text-gold-400">YOU!</span>
                    : currentPicker?.teamName ?? '—'
                  }
                </div>
              </div>
              <div className="flex-1">
                <div className="flex justify-between text-xs text-gray-500 mb-1">
                  <span>Time remaining</span>
                  <span className={timer <= 10 ? 'text-red-400 font-bold' : ''}>{timer}s</span>
                </div>
                <div className="h-2 bg-navy-700 rounded-full overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all ${timerColor}`}
                    style={{ width: `${timerPct}%` }}
                  />
                </div>
              </div>
            </div>
          </div>

          <div className="grid lg:grid-cols-3 gap-6">
            {/* Available politicians */}
            <div className="lg:col-span-2">
              <div className="flex gap-3 mb-4">
                <input
                  className="input flex-1"
                  placeholder="Search politicians..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                />
                <select
                  className="input w-32"
                  value={partyFilter}
                  onChange={(e) => setPartyFilter(e.target.value)}
                >
                  <option value="">All</option>
                  <option value="DEM">DEM</option>
                  <option value="REP">REP</option>
                  <option value="IND">IND</option>
                </select>
              </div>

              <div className="space-y-2 max-h-[600px] overflow-y-auto pr-1">
                {availablePoliticians.map((p) => (
                  <div key={p.id} className="card flex items-center justify-between py-3 px-4">
                    <div>
                      <div className="font-semibold text-white">{p.name}</div>
                      <div className="flex gap-2 items-center mt-0.5">
                        <PartyBadge party={p.party} />
                        <span className="text-xs text-gray-500">{p.title} · {p.state}</span>
                      </div>
                    </div>
                    <button
                      onClick={() => handlePick(p.id)}
                      disabled={!isMyTurn || picking}
                      className={`btn-primary text-sm py-1.5 px-3 ${!isMyTurn ? 'opacity-40 cursor-not-allowed' : ''}`}
                    >
                      Draft
                    </button>
                  </div>
                ))}
                {availablePoliticians.length === 0 && (
                  <p className="text-gray-500 text-center py-8">No politicians available matching your filters.</p>
                )}
              </div>
            </div>

            {/* Draft board */}
            <div>
              <h2 className="text-lg font-bold text-white mb-3">Draft Board</h2>
              <div className="space-y-3">
                {league.members.map((member: any) => (
                  <div key={member.id} className={`card py-3 px-4 ${member.id === currentPickMemberId ? 'border-gold-500' : ''}`}>
                    <div className="flex items-center justify-between mb-2">
                      <div>
                        <div className="font-semibold text-white text-sm">{member.teamName}</div>
                        <div className="text-xs text-gray-500">{member.user.username}</div>
                      </div>
                      {member.id === currentPickMemberId && (
                        <span className="text-xs bg-gold-500 text-navy-900 px-1.5 py-0.5 rounded font-bold animate-pulse">
                          ON CLOCK
                        </span>
                      )}
                    </div>
                    <div className="space-y-0.5">
                      {member.draftPicks?.map((dp: any) => (
                        <div key={dp.id} className="text-xs text-gray-400 flex items-center gap-1">
                          <span className="text-gray-600">#{dp.draftOrder}</span>
                          <span>{dp.politician.name}</span>
                          <PartyBadge party={dp.politician.party} />
                        </div>
                      ))}
                      {(!member.draftPicks || member.draftPicks.length === 0) && (
                        <div className="text-xs text-gray-600 italic">No picks yet</div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
