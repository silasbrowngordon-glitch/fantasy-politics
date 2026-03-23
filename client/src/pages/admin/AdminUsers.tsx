import React, { useEffect, useState } from 'react';
import api from '../../lib/api';
import toast from 'react-hot-toast';
import LoadingSpinner from '../../components/LoadingSpinner';
import { useAuth } from '../../lib/auth';

export default function AdminUsers() {
  const { user: me } = useAuth();
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  async function load() {
    const r = await api.get('/admin/users');
    setUsers(r.data.users);
    setLoading(false);
  }

  useEffect(() => { load(); }, []);

  async function handlePromote(user: any) {
    const newRole = user.role === 'ADMIN' ? 'PLAYER' : 'ADMIN';
    try {
      await api.put(`/admin/users/${user.id}/role`, { role: newRole });
      toast.success(`${user.username} is now ${newRole}`);
      load();
    } catch {
      toast.error('Failed to update role');
    }
  }

  async function handleToggleActive(user: any) {
    try {
      await api.put(`/admin/users/${user.id}`, { isActive: !user.isActive });
      toast.success(user.isActive ? 'User deactivated' : 'User activated');
      load();
    } catch {
      toast.error('Failed');
    }
  }

  const filtered = users.filter(
    (u) => !search ||
      u.username.toLowerCase().includes(search.toLowerCase()) ||
      u.email.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div>
      <div className="mb-6">
        <div className="inline-block bg-crimson-600/20 border border-crimson-600/40 text-crimson-400 text-xs font-bold px-3 py-1 rounded-full mb-2">ADMIN</div>
        <h1 className="font-display text-4xl font-bold text-white">Manage Users</h1>
      </div>

      <div className="mb-4">
        <input
          className="input max-w-xs"
          placeholder="Search users..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      {loading ? (
        <div className="flex justify-center py-20"><LoadingSpinner size="lg" /></div>
      ) : (
        <div className="card overflow-x-auto">
          <table className="w-full">
            <thead className="border-b border-navy-600">
              <tr>
                <th className="table-th">Username</th>
                <th className="table-th">Email</th>
                <th className="table-th">Role</th>
                <th className="table-th">Status</th>
                <th className="table-th">Joined</th>
                <th className="table-th">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((u) => (
                <tr key={u.id} className={`table-row ${!u.isActive ? 'opacity-50' : ''}`}>
                  <td className="table-td font-semibold text-white">
                    {u.username}
                    {u.id === me?.id && <span className="ml-2 text-xs text-gold-500">(You)</span>}
                  </td>
                  <td className="table-td text-gray-400 text-sm">{u.email}</td>
                  <td className="table-td">
                    <span className={`text-xs px-2 py-0.5 rounded font-bold ${
                      u.role === 'ADMIN' ? 'bg-crimson-600/30 text-crimson-400' : 'bg-gray-700 text-gray-400'
                    }`}>
                      {u.role}
                    </span>
                  </td>
                  <td className="table-td">
                    <span className={`text-xs px-2 py-0.5 rounded font-bold ${
                      u.isActive ? 'bg-green-900 text-green-300' : 'bg-gray-700 text-gray-400'
                    }`}>
                      {u.isActive ? 'ACTIVE' : 'INACTIVE'}
                    </span>
                  </td>
                  <td className="table-td text-gray-500 text-sm">
                    {new Date(u.createdAt).toLocaleDateString()}
                  </td>
                  <td className="table-td">
                    {u.id !== me?.id && (
                      <div className="flex gap-3">
                        <button
                          onClick={() => handlePromote(u)}
                          className="text-xs text-gold-400 hover:text-gold-300"
                        >
                          {u.role === 'ADMIN' ? 'Demote' : 'Make Admin'}
                        </button>
                        <button
                          onClick={() => handleToggleActive(u)}
                          className="text-xs text-red-400 hover:text-red-300"
                        >
                          {u.isActive ? 'Deactivate' : 'Activate'}
                        </button>
                      </div>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          <div className="pt-3 text-xs text-gray-600">{filtered.length} users</div>
        </div>
      )}
    </div>
  );
}
