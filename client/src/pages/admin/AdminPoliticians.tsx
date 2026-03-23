import React, { useEffect, useState, useRef } from 'react';
import api from '../../lib/api';
import toast from 'react-hot-toast';
import LoadingSpinner from '../../components/LoadingSpinner';
import PartyBadge from '../../components/PartyBadge';

const EMPTY_FORM = { name: '', title: 'Senator', party: 'DEM', state: '', imageUrl: '', bio: '' };

export default function AdminPoliticians() {
  const [politicians, setPoliticians] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<any>(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [submitting, setSubmitting] = useState(false);
  const [search, setSearch] = useState('');
  const fileRef = useRef<HTMLInputElement>(null);

  async function load() {
    const r = await api.get('/admin/politicians');
    setPoliticians(r.data.politicians);
    setLoading(false);
  }

  useEffect(() => { load(); }, []);

  function openCreate() {
    setEditing(null);
    setForm(EMPTY_FORM);
    setShowForm(true);
  }

  function openEdit(p: any) {
    setEditing(p);
    setForm({ name: p.name, title: p.title, party: p.party, state: p.state, imageUrl: p.imageUrl ?? '', bio: p.bio ?? '' });
    setShowForm(true);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    try {
      if (editing) {
        await api.put(`/admin/politicians/${editing.id}`, form);
        toast.success('Politician updated!');
      } else {
        await api.post('/admin/politicians', form);
        toast.success('Politician added!');
      }
      setShowForm(false);
      load();
    } catch (err: any) {
      toast.error(err.response?.data?.error || 'Failed');
    } finally {
      setSubmitting(false);
    }
  }

  async function toggleActive(p: any) {
    await api.put(`/admin/politicians/${p.id}`, { ...p, isActive: !p.isActive });
    toast.success(p.isActive ? 'Deactivated' : 'Activated');
    load();
  }

  async function handleBulkImport(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    const formData = new FormData();
    formData.append('file', file);
    try {
      const r = await api.post('/admin/politicians/bulk-import', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      toast.success(`Imported ${r.data.created} politicians!`);
      load();
    } catch (err: any) {
      toast.error(err.response?.data?.error || 'Import failed');
    }
    if (fileRef.current) fileRef.current.value = '';
  }

  const filtered = politicians.filter(
    (p) => !search || p.name.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <div className="inline-block bg-crimson-600/20 border border-crimson-600/40 text-crimson-400 text-xs font-bold px-3 py-1 rounded-full mb-2">ADMIN</div>
          <h1 className="font-display text-4xl font-bold text-white">Manage Politicians</h1>
        </div>
        <div className="flex gap-3">
          <label className="btn-secondary cursor-pointer">
            Bulk Import CSV
            <input ref={fileRef} type="file" accept=".csv" className="hidden" onChange={handleBulkImport} />
          </label>
          <button onClick={openCreate} className="btn-primary">+ Add Politician</button>
        </div>
      </div>

      {/* Form */}
      {showForm && (
        <div className="card mb-6 border-gold-500">
          <h2 className="text-xl font-bold text-white mb-4">{editing ? 'Edit' : 'Add'} Politician</h2>
          <form onSubmit={handleSubmit} className="grid sm:grid-cols-2 gap-4">
            <div>
              <label className="label">Full Name</label>
              <input className="input" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required />
            </div>
            <div>
              <label className="label">Title</label>
              <select className="input" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })}>
                <option>Senator</option>
                <option>Representative</option>
                <option>Governor</option>
                <option>President</option>
                <option>Vice President</option>
                <option>Speaker of the House</option>
                <option>Other</option>
              </select>
            </div>
            <div>
              <label className="label">Party</label>
              <select className="input" value={form.party} onChange={(e) => setForm({ ...form, party: e.target.value })}>
                <option value="DEM">Democrat</option>
                <option value="REP">Republican</option>
                <option value="IND">Independent</option>
                <option value="OTHER">Other</option>
              </select>
            </div>
            <div>
              <label className="label">State (2-letter)</label>
              <input className="input" value={form.state} onChange={(e) => setForm({ ...form, state: e.target.value.toUpperCase() })} maxLength={2} required placeholder="TX" />
            </div>
            <div>
              <label className="label">Image URL (optional)</label>
              <input className="input" value={form.imageUrl} onChange={(e) => setForm({ ...form, imageUrl: e.target.value })} placeholder="https://..." />
            </div>
            <div>
              <label className="label">Bio (optional)</label>
              <input className="input" value={form.bio} onChange={(e) => setForm({ ...form, bio: e.target.value })} placeholder="Short description..." />
            </div>
            <div className="flex items-end gap-3 sm:col-span-2">
              <button type="submit" className="btn-primary" disabled={submitting}>
                {submitting ? 'Saving...' : (editing ? 'Update' : 'Add Politician')}
              </button>
              <button type="button" onClick={() => setShowForm(false)} className="btn-secondary">Cancel</button>
            </div>
          </form>
        </div>
      )}

      <div className="mb-4">
        <input className="input max-w-xs" placeholder="Search politicians..." value={search} onChange={(e) => setSearch(e.target.value)} />
      </div>

      {loading ? (
        <div className="flex justify-center py-20"><LoadingSpinner size="lg" /></div>
      ) : (
        <div className="card overflow-x-auto">
          <table className="w-full">
            <thead className="border-b border-navy-600">
              <tr>
                <th className="table-th">Name</th>
                <th className="table-th">Party</th>
                <th className="table-th">Title</th>
                <th className="table-th">State</th>
                <th className="table-th">Status</th>
                <th className="table-th">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((p) => (
                <tr key={p.id} className={`table-row ${!p.isActive ? 'opacity-50' : ''}`}>
                  <td className="table-td font-semibold text-white">{p.name}</td>
                  <td className="table-td"><PartyBadge party={p.party} /></td>
                  <td className="table-td text-sm text-gray-300">{p.title}</td>
                  <td className="table-td text-sm text-gray-300">{p.state}</td>
                  <td className="table-td">
                    <span className={`text-xs px-2 py-0.5 rounded font-bold ${p.isActive ? 'bg-green-900 text-green-300' : 'bg-gray-700 text-gray-400'}`}>
                      {p.isActive ? 'ACTIVE' : 'INACTIVE'}
                    </span>
                  </td>
                  <td className="table-td">
                    <div className="flex gap-3">
                      <button onClick={() => openEdit(p)} className="text-xs text-gold-400 hover:text-gold-300">Edit</button>
                      <button onClick={() => toggleActive(p)} className="text-xs text-gray-400 hover:text-white">
                        {p.isActive ? 'Deactivate' : 'Activate'}
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          <div className="pt-3 text-xs text-gray-600">{filtered.length} politicians</div>
        </div>
      )}
    </div>
  );
}
