import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import api from '../lib/api';
import toast from 'react-hot-toast';
import LoadingSpinner from '../components/LoadingSpinner';
import PartyBadge from '../components/PartyBadge';
import ConfirmModal from '../components/ConfirmModal';

export default function MyRoster() {
  const { id } = useParams<{ id: string }>();
  const [data, setData] = useState<any>(null);
  const [allPoliticians, setAllPoliticians] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [savingLineup, setSavingLineup] = useState(false);
  const [starterIds, setStarterIds] = useState<Set<string>>(new Set());
  const [showWaiver, setShowWaiver] = useState(false);
  const [dropId, setDropId] = useState('');
  const [pickupSearch, setPickupSearch] = useState('');
  const [pickupId, setPickupId] = useState('');
  const [waivering, setWaivering] = useState(false);
  const [confirmDrop, setConfirmDrop] = useState<any>(null);

  async function load() {
    const [rosterRes, polRes] = await Promise.all([
      api.get(`/leagues/${id}/roster`),
      api.get('/politicians'),
    ]);
    setData(rosterRes.data);
    const rosterIds = new Set(rosterRes.data.roster.map((p: any) => p.id));
    const available = polRes.data.politicians.filter((p: any) => !rosterIds.has(p.id));
    setAllPoliticians(available);
    const starters = new Set<string>(
      rosterRes.data.roster.filter((p: any) => p.isStarter).map((p: any) => p.id)
    );
    setStarterIds(starters);
    setLoading(false);
  }

  useEffect(() => { load(); }, [id]);

  function toggleStarter(pid: string) {
    setStarterIds((prev) => {
      const next = new Set(prev);
      if (next.has(pid)) {
        next.delete(pid);
      } else {
        if (next.size >= (data?.member?.league?.starterSize ?? 8)) {
          toast.error(`Max ${data?.member?.league?.starterSize ?? 8} starters`);
          return prev;
        }
        next.add(pid);
      }
      return next;
    });
  }

  async function saveLineup() {
    setSavingLineup(true);
    try {
      await api.put(`/leagues/${id}/lineup`, { starterIds: Array.from(starterIds) });
      toast.success('Lineup saved!');
    } catch (err: any) {
      toast.error(err.response?.data?.error || 'Failed to save lineup');
    } finally {
      setSavingLineup(false);
    }
  }

  async function handleWaiver() {
    setWaivering(true);
    try {
      await api.post(`/leagues/${id}/waiver`, { dropId, pickupId });
      toast.success('Waiver processed!');
      setShowWaiver(false);
      setDropId(''); setPickupId('');
      load();
    } catch (err: any) {
      toast.error(err.response?.data?.error || 'Waiver failed');
    } finally {
      setWaivering(false);
    }
  }

  if (loading) return <div className="flex justify-center py-20"><LoadingSpinner size="lg" /></div>;

  const { roster } = data;
  const league = data.member;

  const filteredPickups = allPoliticians.filter(
    (p) => !pickupSearch || p.name.toLowerCase().includes(pickupSearch.toLowerCase())
  );

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <div className="text-sm text-gray-500 mb-1">
            <Link to={`/leagues/${id}`} className="hover:text-gray-300">League</Link> / My Roster
          </div>
          <h1 className="font-display text-4xl font-bold text-white">My Roster</h1>
          <p className="text-gray-400 mt-1">{data.member.teamName}</p>
        </div>
        <div className="flex gap-3">
          <button
            onClick={() => setShowWaiver(!showWaiver)}
            className="btn-secondary"
          >
            Waiver Wire
          </button>
          <button
            onClick={saveLineup}
            className="btn-primary"
            disabled={savingLineup}
          >
            {savingLineup ? 'Saving...' : 'Save Lineup'}
          </button>
        </div>
      </div>

      <div className="mb-3 flex items-center gap-2 text-sm text-gray-400">
        <span>Starters selected: <strong className="text-white">{starterIds.size}/8</strong></span>
        <span className="text-gray-600">·</span>
        <span>Click a player to toggle starter status</span>
      </div>

      {/* Roster table */}
      <div className="card mb-6">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="border-b border-navy-600">
              <tr>
                <th className="table-th">Status</th>
                <th className="table-th">Politician</th>
                <th className="table-th">Party</th>
                <th className="table-th">State</th>
                <th className="table-th text-right">Season Pts</th>
                <th className="table-th"></th>
              </tr>
            </thead>
            <tbody>
              {roster.length === 0 ? (
                <tr>
                  <td colSpan={6} className="table-td text-center text-gray-500 py-8">
                    No politicians drafted yet.
                  </td>
                </tr>
              ) : (
                [...roster]
                  .sort((a, b) => (b.isStarter ? 1 : 0) - (a.isStarter ? 1 : 0))
                  .map((p: any) => {
                    const isStarter = starterIds.has(p.id);
                    return (
                      <tr
                        key={p.id}
                        className={`table-row cursor-pointer ${isStarter ? 'bg-navy-700/30' : ''}`}
                        onClick={() => toggleStarter(p.id)}
                      >
                        <td className="table-td">
                          <span className={`text-xs px-2 py-0.5 rounded font-bold ${isStarter ? 'bg-green-900 text-green-300' : 'bg-gray-700 text-gray-400'}`}>
                            {isStarter ? 'STARTER' : 'BENCH'}
                          </span>
                        </td>
                        <td className="table-td">
                          <Link
                            to={`/politicians/${p.id}`}
                            className="font-semibold text-white hover:text-gold-400"
                            onClick={(e) => e.stopPropagation()}
                          >
                            {p.name}
                          </Link>
                          <div className="text-xs text-gray-500">{p.title}</div>
                        </td>
                        <td className="table-td"><PartyBadge party={p.party} /></td>
                        <td className="table-td text-gray-300">{p.state}</td>
                        <td className="table-td text-right font-bold text-gold-400">
                          {(p.seasonTotal ?? 0).toFixed(1)}
                        </td>
                        <td className="table-td">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              setConfirmDrop(p);
                            }}
                            className="text-xs text-red-400 hover:text-red-300"
                          >
                            Drop
                          </button>
                        </td>
                      </tr>
                    );
                  })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Waiver Wire */}
      {showWaiver && (
        <div className="card mb-6 border-gold-500">
          <h2 className="text-xl font-bold text-white mb-4">Waiver Wire — Drop & Pickup</h2>
          <div className="grid md:grid-cols-2 gap-6">
            <div>
              <label className="label">Drop (from your roster)</label>
              <select className="input" value={dropId} onChange={(e) => setDropId(e.target.value)}>
                <option value="">Select a player to drop</option>
                {roster.map((p: any) => (
                  <option key={p.id} value={p.id}>{p.name} ({p.party})</option>
                ))}
              </select>
            </div>
            <div>
              <label className="label">Pickup (free agent)</label>
              <input
                className="input mb-2"
                placeholder="Search available..."
                value={pickupSearch}
                onChange={(e) => setPickupSearch(e.target.value)}
              />
              <select className="input" value={pickupId} onChange={(e) => setPickupId(e.target.value)}>
                <option value="">Select a player to add</option>
                {filteredPickups.slice(0, 50).map((p: any) => (
                  <option key={p.id} value={p.id}>{p.name} ({p.party} · {p.state})</option>
                ))}
              </select>
            </div>
          </div>
          <div className="flex gap-3 mt-4">
            <button
              onClick={handleWaiver}
              className="btn-primary"
              disabled={!dropId || !pickupId || waivering}
            >
              {waivering ? 'Processing...' : 'Process Waiver'}
            </button>
            <button onClick={() => setShowWaiver(false)} className="btn-secondary">Cancel</button>
          </div>
        </div>
      )}

      {/* Drop confirm modal */}
      {confirmDrop && (
        <ConfirmModal
          title={`Drop ${confirmDrop.name}?`}
          message={`This will remove ${confirmDrop.name} from your roster. You can pick them up via waiver wire later if they're available.`}
          confirmLabel="Drop Player"
          onConfirm={() => {
            setDropId(confirmDrop.id);
            setConfirmDrop(null);
            setShowWaiver(true);
          }}
          onCancel={() => setConfirmDrop(null)}
        />
      )}
    </div>
  );
}
