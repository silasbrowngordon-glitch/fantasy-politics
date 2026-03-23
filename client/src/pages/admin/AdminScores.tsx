import React, { useEffect, useState, useRef } from 'react';
import api from '../../lib/api';
import toast from 'react-hot-toast';
import LoadingSpinner from '../../components/LoadingSpinner';
import PartyBadge from '../../components/PartyBadge';

interface ScoreRow {
  id: string;
  name: string;
  party: string;
  state: string;
  title: string;
  score: { id: string; points: number; note?: string } | null;
}

export default function AdminScores() {
  const today = new Date().toISOString().split('T')[0];
  const [date, setDate] = useState(today);
  const [rows, setRows] = useState<ScoreRow[]>([]);
  const [points, setPoints] = useState<Record<string, string>>({});
  const [notes, setNotes] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [updatedAt, setUpdatedAt] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const inputRefs = useRef<Record<string, HTMLInputElement | null>>({});

  async function load(d: string) {
    setLoading(true);
    try {
      const r = await api.get('/admin/scores', { params: { date: d } });
      setRows(r.data.politicians);
      const pts: Record<string, string> = {};
      const nts: Record<string, string> = {};
      for (const p of r.data.politicians) {
        pts[p.id] = p.score?.points?.toString() ?? '';
        nts[p.id] = p.score?.note ?? '';
      }
      setPoints(pts);
      setNotes(nts);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { load(date); }, [date]);

  function handleKeyDown(e: React.KeyboardEvent, idx: number) {
    if (e.key === 'Enter' || e.key === 'ArrowDown') {
      e.preventDefault();
      const nextId = filtered[idx + 1]?.id;
      if (nextId) inputRefs.current[nextId]?.focus();
    }
    if (e.key === 'ArrowUp') {
      e.preventDefault();
      const prevId = filtered[idx - 1]?.id;
      if (prevId) inputRefs.current[prevId]?.focus();
    }
  }

  async function handleSave() {
    setSaving(true);
    try {
      const scores = rows
        .filter((r) => points[r.id] !== '' && points[r.id] !== undefined)
        .map((r) => ({
          politicianId: r.id,
          points: parseFloat(points[r.id]) || 0,
          note: notes[r.id] || undefined,
        }));

      const res = await api.post('/admin/scores', { date, scores });
      setUpdatedAt(new Date().toLocaleTimeString());
      toast.success(`Saved ${scores.length} scores!`);
    } catch (err: any) {
      toast.error(err.response?.data?.error || 'Failed to save scores');
    } finally {
      setSaving(false);
    }
  }

  const filtered = rows.filter(
    (r) => !search || r.name.toLowerCase().includes(search.toLowerCase())
  );

  const entered = Object.values(points).filter((v) => v !== '').length;

  return (
    <div>
      <div className="flex items-start justify-between mb-6">
        <div>
          <div className="inline-block bg-crimson-600/20 border border-crimson-600/40 text-crimson-400 text-xs font-bold px-3 py-1 rounded-full mb-2">
            ADMIN
          </div>
          <h1 className="font-display text-4xl font-bold text-white">Daily Score Entry</h1>
          {updatedAt && (
            <p className="text-sm text-gray-500 mt-1">Scores last updated: {updatedAt}</p>
          )}
        </div>
        <button
          onClick={handleSave}
          className="btn-primary text-lg px-8 py-3"
          disabled={saving}
        >
          {saving ? 'Saving...' : `Save All Scores (${entered})`}
        </button>
      </div>

      <div className="card mb-6">
        <div className="flex flex-wrap gap-4 items-end">
          <div>
            <label className="label">Date</label>
            <input
              type="date"
              className="input w-44"
              value={date}
              onChange={(e) => setDate(e.target.value)}
            />
          </div>
          <div className="flex-1 min-w-48">
            <label className="label">Filter by name</label>
            <input
              className="input"
              placeholder="Search politicians..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <div className="text-sm text-gray-400">
            <strong className="text-white">{entered}</strong> of {rows.length} scored
          </div>
        </div>
      </div>

      <div className="text-xs text-gray-500 mb-2">
        Tip: Use Enter / ↑↓ arrows to navigate between point fields quickly.
      </div>

      {loading ? (
        <div className="flex justify-center py-20"><LoadingSpinner size="lg" /></div>
      ) : (
        <div className="card overflow-x-auto">
          <table className="w-full">
            <thead className="border-b border-navy-600">
              <tr>
                <th className="table-th">Politician</th>
                <th className="table-th">Party</th>
                <th className="table-th">State</th>
                <th className="table-th w-32">Points</th>
                <th className="table-th">Note (optional)</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((row, idx) => (
                <tr key={row.id} className={`table-row ${row.score ? 'bg-navy-700/20' : ''}`}>
                  <td className="table-td">
                    <div className="font-semibold text-white">{row.name}</div>
                    <div className="text-xs text-gray-500">{row.title}</div>
                  </td>
                  <td className="table-td"><PartyBadge party={row.party} /></td>
                  <td className="table-td text-gray-300 text-sm">{row.state}</td>
                  <td className="table-td">
                    <input
                      ref={(el) => { inputRefs.current[row.id] = el; }}
                      type="number"
                      step="0.5"
                      className="input w-24 text-center font-bold"
                      value={points[row.id] ?? ''}
                      onChange={(e) => setPoints((prev) => ({ ...prev, [row.id]: e.target.value }))}
                      onKeyDown={(e) => handleKeyDown(e, idx)}
                      placeholder="0"
                    />
                  </td>
                  <td className="table-td">
                    <input
                      type="text"
                      className="input text-sm"
                      value={notes[row.id] ?? ''}
                      onChange={(e) => setNotes((prev) => ({ ...prev, [row.id]: e.target.value }))}
                      placeholder="Why these points?"
                    />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <div className="mt-6 flex justify-end">
        <button
          onClick={handleSave}
          className="btn-primary text-lg px-10 py-3"
          disabled={saving}
        >
          {saving ? 'Saving All Scores...' : `Save All Scores`}
        </button>
      </div>
    </div>
  );
}
