import React, { useEffect, useState, useCallback } from 'react';
import { Link } from 'react-router-dom';
import api from '../lib/api';
import LoadingSpinner from '../components/LoadingSpinner';
import PartyBadge from '../components/PartyBadge';

type SortKey = 'name' | 'party' | 'state' | 'title' | 'seasonTotal';

export default function Politicians() {
  const [politicians, setPoliticians] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [party, setParty] = useState('');
  const [state, setState] = useState('');
  const [sortKey, setSortKey] = useState<SortKey>('seasonTotal');
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('desc');

  const load = useCallback(async () => {
    const params: Record<string, string> = {};
    if (search) params.search = search;
    if (party) params.party = party;
    if (state) params.state = state;
    const r = await api.get('/politicians', { params });
    setPoliticians(r.data.politicians);
    setLoading(false);
  }, [search, party, state]);

  useEffect(() => { load(); }, [load]);

  function handleSort(key: SortKey) {
    if (sortKey === key) {
      setSortDir((d) => d === 'asc' ? 'desc' : 'asc');
    } else {
      setSortKey(key);
      setSortDir(key === 'seasonTotal' ? 'desc' : 'asc');
    }
  }

  const sorted = [...politicians].sort((a, b) => {
    const va = a[sortKey] ?? 0;
    const vb = b[sortKey] ?? 0;
    const cmp = typeof va === 'string' ? va.localeCompare(vb) : va - vb;
    return sortDir === 'asc' ? cmp : -cmp;
  });

  const states = [...new Set(politicians.map((p) => p.state))].sort();

  function SortIcon({ k }: { k: SortKey }) {
    if (sortKey !== k) return <span className="text-gray-700 ml-1">↕</span>;
    return <span className="text-gold-400 ml-1">{sortDir === 'asc' ? '↑' : '↓'}</span>;
  }

  return (
    <div>
      <h1 className="font-display text-4xl font-bold text-white mb-6">Politician Directory</h1>

      {/* Filters */}
      <div className="card mb-6">
        <div className="grid sm:grid-cols-3 gap-4">
          <div>
            <label className="label">Search</label>
            <input
              className="input"
              placeholder="Search by name..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <div>
            <label className="label">Party</label>
            <select className="input" value={party} onChange={(e) => setParty(e.target.value)}>
              <option value="">All Parties</option>
              <option value="DEM">Democrat</option>
              <option value="REP">Republican</option>
              <option value="IND">Independent</option>
              <option value="OTHER">Other</option>
            </select>
          </div>
          <div>
            <label className="label">State</label>
            <select className="input" value={state} onChange={(e) => setState(e.target.value)}>
              <option value="">All States</option>
              {states.map((s) => (
                <option key={s} value={s}>{s}</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center py-20"><LoadingSpinner size="lg" /></div>
      ) : (
        <div className="card overflow-x-auto">
          <table className="w-full">
            <thead className="border-b border-ink-600">
              <tr>
                <th className="table-th" onClick={() => handleSort('name')}>
                  Name <SortIcon k="name" />
                </th>
                <th className="table-th" onClick={() => handleSort('party')}>
                  Party <SortIcon k="party" />
                </th>
                <th className="table-th" onClick={() => handleSort('title')}>
                  Title <SortIcon k="title" />
                </th>
                <th className="table-th" onClick={() => handleSort('state')}>
                  State <SortIcon k="state" />
                </th>
                <th className="table-th text-right" onClick={() => handleSort('seasonTotal')}>
                  Season Pts <SortIcon k="seasonTotal" />
                </th>
              </tr>
            </thead>
            <tbody>
              {sorted.map((p) => (
                <tr key={p.id} className="table-row">
                  <td className="table-td">
                    <Link to={`/politicians/${p.id}`} className="font-semibold text-white hover:text-gold-400">
                      {p.name}
                    </Link>
                  </td>
                  <td className="table-td"><PartyBadge party={p.party} /></td>
                  <td className="table-td text-cream-300 text-sm">{p.title}</td>
                  <td className="table-td text-cream-300 text-sm">{p.state}</td>
                  <td className="table-td text-right font-bold text-gold-400">
                    {(p.seasonTotal ?? 0).toFixed(1)}
                  </td>
                </tr>
              ))}
              {sorted.length === 0 && (
                <tr>
                  <td colSpan={5} className="table-td text-center text-cream-500 py-8">
                    No politicians found matching your filters.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
          <div className="pt-3 text-xs text-cream-500">{sorted.length} politicians</div>
        </div>
      )}
    </div>
  );
}
