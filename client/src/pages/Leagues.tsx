import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../lib/api';
import toast from 'react-hot-toast';
import LoadingSpinner from '../components/LoadingSpinner';
import { SCORING_TYPES, type ScoringType } from '../lib/scoringTypes';

export default function Leagues() {
  const [leagues, setLeagues] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [showJoin, setShowJoin] = useState(false);

  // Create form
  const [createName, setCreateName] = useState('');
  const [createTeamName, setCreateTeamName] = useState('');
  const [createMax, setCreateMax] = useState(10);
  const [createScoringTypes, setCreateScoringTypes] = useState<ScoringType[]>([]);
  const [creating, setCreating] = useState(false);

  // Join form
  const [inviteCode, setInviteCode] = useState('');
  const [joinTeamName, setJoinTeamName] = useState('');
  const [joining, setJoining] = useState(false);

  async function load() {
    const r = await api.get('/leagues');
    setLeagues(r.data.leagues);
    setLoading(false);
  }

  useEffect(() => { load(); }, []);

  function toggleScoringType(t: ScoringType) {
    setCreateScoringTypes((prev) =>
      prev.includes(t) ? prev.filter((x) => x !== t) : [...prev, t]
    );
  }

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    setCreating(true);
    try {
      await api.post('/leagues', {
        name: createName,
        teamName: createTeamName,
        maxMembers: createMax,
        scoringTypes: createScoringTypes,
      });
      toast.success('League created!');
      setShowCreate(false);
      setCreateName(''); setCreateTeamName(''); setCreateMax(10); setCreateScoringTypes([]);
      load();
    } catch (err: any) {
      toast.error(err.response?.data?.error || 'Failed to create league');
    } finally {
      setCreating(false);
    }
  }

  async function handleJoin(e: React.FormEvent) {
    e.preventDefault();
    setJoining(true);
    try {
      await api.post('/leagues/join', { inviteCode: inviteCode.toUpperCase(), teamName: joinTeamName });
      toast.success('Joined league!');
      setShowJoin(false);
      setInviteCode(''); setJoinTeamName('');
      load();
    } catch (err: any) {
      toast.error(err.response?.data?.error || 'Failed to join league');
    } finally {
      setJoining(false);
    }
  }

  if (loading) return <div className="flex justify-center py-20"><LoadingSpinner size="lg" /></div>;

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <div>
          <div className="overline mb-1">Season 2025</div>
          <h1 className="font-display font-extrabold uppercase text-4xl text-cream-100" style={{ letterSpacing: '-0.01em' }}>
            My Leagues
          </h1>
        </div>
        <div className="flex gap-3">
          <button onClick={() => { setShowJoin(true); setShowCreate(false); }} className="btn-secondary">
            Join League
          </button>
          <button onClick={() => { setShowCreate(true); setShowJoin(false); }} className="btn-primary">
            Create League
          </button>
        </div>
      </div>

      {/* Create Form */}
      {showCreate && (
        <div className="card mb-6" style={{ borderColor: 'rgba(212,168,67,0.4)' }}>
          <h2 className="font-display font-bold uppercase text-xl text-cream-100 mb-4 tracking-wide">
            Create New League
          </h2>
          <form onSubmit={handleCreate} className="space-y-5">
            <div className="grid sm:grid-cols-2 gap-4">
              <div>
                <label className="label">League Name</label>
                <input className="input" value={createName} onChange={(e) => setCreateName(e.target.value)} required placeholder="The Capitol Hill Classic" />
              </div>
              <div>
                <label className="label">Your Team Name</label>
                <input className="input" value={createTeamName} onChange={(e) => setCreateTeamName(e.target.value)} required placeholder="The Filibuster Kings" />
              </div>
              <div>
                <label className="label">Max Members</label>
                <input type="number" className="input" value={createMax} onChange={(e) => setCreateMax(+e.target.value)} min={2} max={20} />
              </div>
            </div>

            <div>
              <label className="label mb-2">Scoring Types <span className="text-cream-500 font-normal normal-case tracking-normal text-xs ml-1">(optional — select all that apply)</span></label>
              <div className="grid sm:grid-cols-2 md:grid-cols-3 gap-2">
                {SCORING_TYPES.map((t) => {
                  const selected = createScoringTypes.includes(t.value);
                  return (
                    <button
                      key={t.value}
                      type="button"
                      onClick={() => toggleScoringType(t.value)}
                      className={`text-left px-3 py-2.5 rounded-sm border transition-all ${
                        selected
                          ? 'border-gold-400 bg-gold-400/10 text-gold-300'
                          : 'border-ink-600 bg-ink-800 text-cream-400 hover:border-ink-500'
                      }`}
                    >
                      <div className="flex items-center gap-2">
                        <div className={`w-3.5 h-3.5 rounded-sm border flex items-center justify-center shrink-0 ${selected ? 'border-gold-400 bg-gold-400' : 'border-ink-400'}`}>
                          {selected && (
                            <svg className="w-2.5 h-2.5 text-ink-900" fill="none" viewBox="0 0 10 10" stroke="currentColor" strokeWidth={2}>
                              <path d="M1.5 5l2.5 2.5 4.5-4.5" strokeLinecap="round" strokeLinejoin="round" />
                            </svg>
                          )}
                        </div>
                        <div>
                          <div className="font-display font-bold uppercase text-xs tracking-wider">{t.label}</div>
                          <div className="text-xs text-cream-500 font-normal normal-case tracking-normal mt-0.5 leading-snug">{t.description.split('.')[0]}.</div>
                        </div>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="flex items-center gap-3 pt-1">
              <button type="submit" className="btn-primary" disabled={creating}>
                {creating ? 'Creating...' : 'Create League'}
              </button>
              <button type="button" onClick={() => setShowCreate(false)} className="btn-secondary">Cancel</button>
            </div>
          </form>
        </div>
      )}

      {/* Join Form */}
      {showJoin && (
        <div className="card mb-6" style={{ borderColor: 'rgba(212,168,67,0.4)' }}>
          <h2 className="font-display font-bold uppercase text-xl text-cream-100 mb-4 tracking-wide">
            Join a League
          </h2>
          <form onSubmit={handleJoin} className="grid sm:grid-cols-2 gap-4">
            <div>
              <label className="label">Invite Code</label>
              <input className="input uppercase tracking-widest" value={inviteCode} onChange={(e) => setInviteCode(e.target.value)} required placeholder="ABC123" maxLength={6} />
            </div>
            <div>
              <label className="label">Your Team Name</label>
              <input className="input" value={joinTeamName} onChange={(e) => setJoinTeamName(e.target.value)} required placeholder="The Swing State Sluggers" />
            </div>
            <div className="flex items-end gap-3 sm:col-span-2">
              <button type="submit" className="btn-primary" disabled={joining}>
                {joining ? 'Joining...' : 'Join League'}
              </button>
              <button type="button" onClick={() => setShowJoin(false)} className="btn-secondary">Cancel</button>
            </div>
          </form>
        </div>
      )}

      {leagues.length === 0 ? (
        <div className="card text-center py-16">
          <div className="font-display font-extrabold uppercase text-6xl text-ink-600 mb-4">FP</div>
          <h3 className="font-display font-bold uppercase text-2xl text-cream-100 mb-2">No Leagues Yet</h3>
          <p className="text-cream-400 mb-6 text-sm">Create a league or enter an invite code to join one.</p>
          <button onClick={() => setShowCreate(true)} className="btn-primary">Create a League</button>
        </div>
      ) : (
        <div className="grid md:grid-cols-2 gap-4">
          {leagues.map((m) => {
            const seasonTotal = m.dailyTotals?.reduce((s: number, dt: any) => s + dt.totalPoints, 0) ?? 0;
            const types: string[] = m.league.scoringTypes ?? [];
            return (
              <Link key={m.id} to={`/leagues/${m.league.id}`} className="card block group transition-colors" style={{ borderLeft: '3px solid transparent' }}
                onMouseEnter={(e) => (e.currentTarget.style.borderLeftColor = '#3b6ef8')}
                onMouseLeave={(e) => (e.currentTarget.style.borderLeftColor = 'transparent')}>
                <div className="flex justify-between items-start">
                  <div>
                    <h3 className="font-display font-bold uppercase text-xl text-cream-100 group-hover:text-gold-400 transition-colors" style={{ letterSpacing: '0.02em' }}>
                      {m.league.name}
                    </h3>
                    <p className="text-sm text-cream-400 mt-0.5">{m.teamName}</p>
                    <div className="flex flex-wrap gap-2 mt-2">
                      <span className={`text-xs px-2 py-0.5 rounded-sm font-display font-bold uppercase tracking-wide ${
                        m.league.draftStatus === 'COMPLETE' ? 'bg-green-950 text-green-400 border border-green-900' :
                        m.league.draftStatus === 'DRAFTING' ? 'bg-yellow-950 text-yellow-400 border border-yellow-900' :
                        'bg-ink-600 text-cream-500 border border-ink-500'
                      }`}>{m.league.draftStatus}</span>
                      <span className="text-xs text-cream-500">{m.league.members.length} members</span>
                      {m.isCommissioner && <span className="text-xs text-gold-500 font-display font-bold uppercase tracking-wide">Commish</span>}
                    </div>
                    {types.length > 0 && (
                      <div className="flex flex-wrap gap-1 mt-2">
                        {types.map((t: string) => (
                          <span key={t} className="text-xs px-1.5 py-0.5 rounded-sm font-display font-bold uppercase tracking-wide bg-ink-600 text-cream-400 border border-ink-500">
                            {t.replace('_', ' ')}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                  <div className="text-right shrink-0">
                    <div className="font-display font-extrabold text-3xl text-gold-400 leading-none">{seasonTotal.toFixed(1)}</div>
                    <div className="overline text-cream-500 mt-1">Season pts</div>
                  </div>
                </div>
                <div className="mt-3 pt-3 border-t border-ink-700 flex items-center justify-between">
                  <span className="text-xs text-cream-500">
                    Invite: <code className="text-gold-500 font-mono font-bold">{m.league.inviteCode}</code>
                  </span>
                  <span className="text-xs text-gold-400 font-display font-bold uppercase tracking-widest">View →</span>
                </div>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
