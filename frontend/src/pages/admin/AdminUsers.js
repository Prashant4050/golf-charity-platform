import { useState, useEffect } from 'react';
import AdminLayout from './AdminLayout';
import api from '../../utils/api';
import toast from 'react-hot-toast';

export default function AdminUsers() {
  const [data, setData] = useState({ users: [], total: 0, pages: 1 });
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [selected, setSelected] = useState(null);
  const [editScore, setEditScore] = useState(null);

  const load = (p = 1, s = '') => {
    setLoading(true);
    api.get(`/admin/users?page=${p}&limit=15${s ? `&search=${s}` : ''}`)
      .then(r => setData(r.data))
      .catch(() => toast.error('Failed to load users'))
      .finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, []);

  const handleSearch = (e) => { e.preventDefault(); load(1, search); setPage(1); };

  const handleEditScore = async (userId, scoreId) => {
    try {
      await api.put(`/admin/users/${userId}/scores/${scoreId}`, editScore);
      toast.success('Score updated');
      const res = await api.get(`/admin/users/${userId}`);
      setSelected(res.data);
      setEditScore(null);
    } catch (err) {
      toast.error('Failed to update score');
    }
  };

  const statusColors = { active: 'badge-green', inactive: 'badge-dim', cancelled: 'badge-red', lapsed: 'badge-red' };

  return (
    <AdminLayout title="Users">
      <form onSubmit={handleSearch} style={{ display: 'flex', gap: '0.75rem', marginBottom: '1.5rem', maxWidth: 400 }}>
        <input placeholder="Search name or email…" value={search} onChange={e => setSearch(e.target.value)} />
        <button type="submit" className="btn btn-outline" style={{ flexShrink: 0 }}>Search</button>
      </form>

      {loading ? <div className="spinner" /> : (
        <>
          <div style={{ marginBottom: '0.75rem', fontSize: '0.85rem', color: '#4b7a5a' }}>{data.total} users found</div>
          <div className="table-wrap" style={{ marginBottom: '1.5rem' }}>
            <table>
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Email</th>
                  <th>Plan</th>
                  <th>Status</th>
                  <th>Scores</th>
                  <th>Charity %</th>
                  <th>Winnings</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {data.users.map(u => (
                  <tr key={u._id}>
                    <td style={{ fontWeight: 500 }}>{u.name}</td>
                    <td style={{ color: '#86efac', fontSize: '0.85rem' }}>{u.email}</td>
                    <td><span className="badge badge-dim">{u.subscription?.plan || '—'}</span></td>
                    <td><span className={`badge ${statusColors[u.subscription?.status] || 'badge-dim'}`}>{u.subscription?.status || 'none'}</span></td>
                    <td>{u.scores?.length || 0}/5</td>
                    <td>{u.charityPercentage || 10}%</td>
                    <td style={{ color: '#f59e0b', fontWeight: 600 }}>£{u.totalWinnings || 0}</td>
                    <td>
                      <button className="btn btn-outline btn-sm" onClick={() => setSelected(u)}>View</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
            <button className="btn btn-outline btn-sm" disabled={page <= 1} onClick={() => { setPage(p => p - 1); load(page - 1, search); }}>← Prev</button>
            <span style={{ fontSize: '0.85rem', color: '#4b7a5a' }}>Page {page} of {data.pages}</span>
            <button className="btn btn-outline btn-sm" disabled={page >= data.pages} onClick={() => { setPage(p => p + 1); load(page + 1, search); }}>Next →</button>
          </div>
        </>
      )}

      {/* User Detail Modal */}
      {selected && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)', zIndex: 200, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem' }} onClick={() => setSelected(null)}>
          <div style={{ background: '#1a2a1e', border: '1px solid #2d4a35', borderRadius: 16, padding: '2rem', maxWidth: 560, width: '100%', maxHeight: '80vh', overflowY: 'auto' }} onClick={e => e.stopPropagation()}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
              <h2 style={{ fontSize: '1.2rem' }}>{selected.name}</h2>
              <button className="btn btn-outline btn-sm" onClick={() => setSelected(null)}>×</button>
            </div>

            <div style={{ display: 'grid', gap: '0.5rem', fontSize: '0.88rem', marginBottom: '1.5rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}><span style={{ color: '#4b7a5a' }}>Email</span><span>{selected.email}</span></div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}><span style={{ color: '#4b7a5a' }}>Plan</span><span>{selected.subscription?.plan || '—'}</span></div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}><span style={{ color: '#4b7a5a' }}>Status</span><span className={`badge ${statusColors[selected.subscription?.status] || 'badge-dim'}`}>{selected.subscription?.status}</span></div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}><span style={{ color: '#4b7a5a' }}>Charity %</span><span>{selected.charityPercentage}%</span></div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}><span style={{ color: '#4b7a5a' }}>Winnings</span><span style={{ color: '#f59e0b', fontWeight: 600 }}>£{selected.totalWinnings || 0}</span></div>
            </div>

            <h4 style={{ fontSize: '0.9rem', marginBottom: '0.75rem' }}>Scores ({selected.scores?.length || 0}/5)</h4>
            {selected.scores?.length === 0 ? (
              <p style={{ color: '#4b7a5a', fontSize: '0.85rem' }}>No scores logged</p>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                {selected.scores.map(s => (
                  <div key={s._id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: '#111a14', borderRadius: 8, padding: '0.6rem 1rem', fontSize: '0.85rem' }}>
                    {editScore?._id === s._id ? (
                      <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center', flex: 1 }}>
                        <input type="number" min="1" max="45" value={editScore.score} onChange={e => setEditScore({ ...editScore, score: e.target.value })} style={{ width: 70 }} />
                        <input type="date" value={editScore.date} onChange={e => setEditScore({ ...editScore, date: e.target.value })} style={{ width: 140 }} />
                        <button className="btn btn-primary btn-sm" onClick={() => handleEditScore(selected._id, s._id)}>Save</button>
                        <button className="btn btn-outline btn-sm" onClick={() => setEditScore(null)}>✕</button>
                      </div>
                    ) : (
                      <>
                        <span><strong>{s.score}</strong> pts — {new Date(s.date).toLocaleDateString('en-GB')}</span>
                        <button className="btn btn-outline btn-sm" onClick={() => setEditScore({ _id: s._id, score: s.score, date: new Date(s.date).toISOString().split('T')[0] })}>Edit</button>
                      </>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </AdminLayout>
  );
}
