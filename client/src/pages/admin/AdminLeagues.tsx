import React, { useEffect, useState } from 'react';
import api from '../../lib/api';
import toast from 'react-hot-toast';
import LoadingSpinner from '../../components/LoadingSpinner';
import ConfirmModal from '../../components/ConfirmModal';

export default function AdminLeagues() {
  const [leagues, setLeagues] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [confirmReset, setConfirmReset] = useState<any>(null);
  const [confirmDeactivate, setConfirmDeactivate] = useState<any>(null);

  async function load() {
    const r = await api.get('/admin/leagues');
    setLeagues(r.data.leagues);
    setLoading(false);
  }

  useEffect(() => { load(); }, []);

  async function handleReset(league: any) {
    try {
      await api.post(`/admin/leagues/${league.id}/reset`);
      toast.success(`${league.name} reset to PREDRAFT`);
      setConfirmReset(null);
      load();
    } catch (err: any) {
      toast.error(err.response?.data?.error || 'Reset failed');
    }
  }

  async function handleDeactivate(league: any) {
    try {
      await api.put(`/admin/leagues/${league.id}`, { isActive: !league.isActive });
      toast.success(league.isActive ? 'League deactivated' : 'League activated');
      setConfirmDeactivate(null);
      load();
    } catch (err: any) {
      toast.error('Failed');
    }
  }

  return (
    <div>
      <div className="mb-6">
        <div className="inline-block bg-crimson-600/20 border border-crimson-600/40 text-crimson-400 text-xs font-bold px-3 py-1 rounded-full mb-2">ADMIN</div>
        <h1 className="font-display text-4xl font-bold text-white">Manage Leagues</h1>
      </div>

      {loading ? (
        <div className="flex justify-center py-20"><LoadingSpinner size="lg" /></div>
      ) : (
        <div className="card overflow-x-auto">
          <table className="w-full">
            <thead className="border-b border-navy-600">
              <tr>
                <th className="table-th">League</th>
                <th className="table-th">Invite</th>
                <th className="table-th">Status</th>
                <th className="table-th">Members</th>
                <th className="table-th">Active</th>
                <th className="table-th">Actions</th>
              </tr>
            </thead>
            <tbody>
              {leagues.map((l) => {
                const totalPts = l.members.reduce((sum: number, m: any) => {
                  return sum + (m.dailyTotals?.reduce((s: number, dt: any) => s + dt.totalPoints, 0) ?? 0);
                }, 0);
                return (
                  <tr key={l.id} className={`table-row ${!l.isActive ? 'opacity-50' : ''}`}>
                    <td className="table-td font-semibold text-white">{l.name}</td>
                    <td className="table-td">
                      <code className="text-gold-500 font-mono font-bold">{l.inviteCode}</code>
                    </td>
                    <td className="table-td">
                      <span className={`text-xs px-2 py-0.5 rounded font-bold ${
                        l.draftStatus === 'COMPLETE' ? 'bg-green-900 text-green-300' :
                        l.draftStatus === 'DRAFTING' ? 'bg-yellow-900 text-yellow-300' :
                        'bg-gray-700 text-gray-400'
                      }`}>{l.draftStatus}</span>
                    </td>
                    <td className="table-td text-gray-300">{l._count.members}/{l.maxMembers}</td>
                    <td className="table-td">
                      <span className={`text-xs px-2 py-0.5 rounded font-bold ${l.isActive ? 'bg-green-900 text-green-300' : 'bg-gray-700 text-gray-400'}`}>
                        {l.isActive ? 'YES' : 'NO'}
                      </span>
                    </td>
                    <td className="table-td">
                      <div className="flex gap-3">
                        <button
                          onClick={() => setConfirmReset(l)}
                          className="text-xs text-yellow-400 hover:text-yellow-300"
                        >
                          Reset Draft
                        </button>
                        <button
                          onClick={() => setConfirmDeactivate(l)}
                          className="text-xs text-red-400 hover:text-red-300"
                        >
                          {l.isActive ? 'Deactivate' : 'Activate'}
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {confirmReset && (
        <ConfirmModal
          title={`Reset "${confirmReset.name}"?`}
          message="This will delete all draft picks, daily totals, and reset the league to PREDRAFT. This cannot be undone."
          confirmLabel="Reset League"
          onConfirm={() => handleReset(confirmReset)}
          onCancel={() => setConfirmReset(null)}
        />
      )}

      {confirmDeactivate && (
        <ConfirmModal
          title={`${confirmDeactivate.isActive ? 'Deactivate' : 'Activate'} "${confirmDeactivate.name}"?`}
          message={confirmDeactivate.isActive
            ? 'Members will no longer be able to access this league.'
            : 'This will reactivate the league for all members.'}
          confirmLabel={confirmDeactivate.isActive ? 'Deactivate' : 'Activate'}
          danger={confirmDeactivate.isActive}
          onConfirm={() => handleDeactivate(confirmDeactivate)}
          onCancel={() => setConfirmDeactivate(null)}
        />
      )}
    </div>
  );
}
