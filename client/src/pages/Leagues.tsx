import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../lib/api';
import toast from 'react-hot-toast';
import LoadingSpinner from '../components/LoadingSpinner';

export default function Leagues() {
  const [leagues, setLeagues] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [showJoin, setShowJoin] = useState(false);

  // Create form
  const [createName, setCreateName] = useState('');
  const [createTeamName, setCreateTeamName] = useState('');
  const [createMax, setCreateMax] = useState(10);
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

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    setCreating(true);
    try {
      await api.post('/leagues', { name: createName, teamName: createTeamName, maxMembers: createMax });
      toast.success('League created!');
      setShowCreate(false);
      setCreateName(''); setCreateTeamName(''); setCreateMax(10);
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
        <h1 className="font-display text-4xl font-bold text-white">My Leagues</h1>
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
        <div className="card mb-6 border-gold-500">
          <h2 className="text-xl font-bold text-white mb-4">Create New League</h2>
          <form onSubmit={handleCreate} className="grid sm:grid-cols-2 gap-4">
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
            <div className="flex items-end gap-3">
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
        <div className="card mb-6 border-gold-500">
          <h2 className="text-xl font-bold text-white mb-4">Join a League</h2>
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
          <div className="text-5xl mb-4">🏛️</div>
          <h3 className="text-xl font-bold text-white mb-2">No leagues yet</h3>
          <p className="text-gray-400">Create a league or enter an invite code to join one.</p>
        </div>
      ) : (
        <div className="grid md:grid-cols-2 gap-4">
          {leagues.map((m) => {
            const seasonTotal = m.dailyTotals?.reduce((s: number, dt: any) => s + dt.totalPoints, 0) ?? 0;
            return (
              <Link key={m.id} to={`/leagues/${m.league.id}`} className="card block hover:border-gold-500 transition-colors group">
                <div className="flex justify-between items-start">
                  <div>
                    <h3 className="text-lg font-bold text-white group-hover:text-gold-400 transition-colors">
                      {m.league.name}
                    </h3>
                    <p className="text-sm text-gray-400 mt-0.5">{m.teamName}</p>
                    <div className="flex gap-2 mt-2">
                      <span className={`text-xs px-2 py-0.5 rounded font-bold ${
                        m.league.draftStatus === 'COMPLETE' ? 'bg-green-900 text-green-300' :
                        m.league.draftStatus === 'DRAFTING' ? 'bg-yellow-900 text-yellow-300' :
                        'bg-gray-700 text-gray-400'
                      }`}>{m.league.draftStatus}</span>
                      <span className="text-xs text-gray-500">{m.league.members.length} members</span>
                      {m.isCommissioner && <span className="text-xs text-gold-500">Commissioner</span>}
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-2xl font-bold text-gold-400">{seasonTotal.toFixed(1)}</div>
                    <div className="text-xs text-gray-500">season pts</div>
                  </div>
                </div>
                <div className="mt-3 pt-3 border-t border-navy-700 flex items-center justify-between">
                  <span className="text-xs text-gray-500">
                    Invite: <code className="text-gold-500 font-mono font-bold">{m.league.inviteCode}</code>
                  </span>
                  <span className="text-xs text-gold-400 font-semibold">View League →</span>
                </div>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
