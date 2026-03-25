import { useState, useEffect } from 'react';
import AdminLayout from './AdminLayout';
import api from '../../utils/api';
import toast from 'react-hot-toast';

export default function AdminDraws() {
  const [draws, setDraws] = useState([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [form, setForm] = useState({ month: new Date().toISOString().slice(0, 7), drawType: 'random' });
  const [simulating, setSimulating] = useState(null);
  const [publishing, setPublishing] = useState(null);
  const [simResult, setSimResult] = useState(null);

  const load = () => {
    setLoading(true);
    api.get('/draws/admin/all').then(r => setDraws(r.data)).finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, []);

  const handleCreate = async (e) => {
    e.preventDefault();
    setCreating(true);
    try {
      const res = await api.post('/draws/create', form);
      toast.success(`Draw for ${form.month} created!`);
      setDraws(prev => [res.data, ...prev]);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to create draw');
    } finally { setCreating(false); }
  };

  const handleSimulate = async (drawId) => {
    setSimulating(drawId);
    try {
      const res = await api.post(`/draws/${drawId}/simulate`);
      setSimResult(res.data.simulation);
      toast.success('Simulation complete! Review results before publishing.');
      load();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Simulation failed');
    } finally { setSimulating(null); }
  };

  const handlePublish = async (drawId) => {
    if (!window.confirm('Publish this draw? This will generate official results and notify winners.')) return;
    setPublishing(drawId);
    try {
      await api.post(`/draws/${drawId}/publish`);
      toast.success('Draw published! Winners have been recorded.');
      setSimResult(null);
      load();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to publish');
    } finally { setPublishing(null); }
  };

  return (
    <AdminLayout title="Draw Management">
      {/* Create Draw */}
      <div className="card" style={{ marginBottom: '2rem' }}>
        <h3 style={{ fontSize: '1rem', marginBottom: '1rem' }}>Create New Draw</h3>
        <form onSubmit={handleCreate} style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap', alignItems: 'flex-end' }}>
          <div className="form-group" style={{ flex: '1 1 160px' }}>
            <label className="form-label">Month (YYYY-MM)</label>
            <input type="month" value={form.month} onChange={e => setForm({ ...form, month: e.target.value })} required />
          </div>
          <div className="form-group" style={{ flex: '1 1 180px' }}>
            <label className="form-label">Draw Type</label>
            <select value={form.drawType} onChange={e => setForm({ ...form, drawType: e.target.value })}>
              <option value="random">Random (Standard)</option>
              <option value="algorithmic">Algorithmic (Score-weighted)</option>
            </select>
          </div>
          <button type="submit" className="btn btn-primary" disabled={creating} style={{ height: 42 }}>
            {creating ? 'Creating…' : '+ Create Draw'}
          </button>
        </form>
        <p style={{ fontSize: '0.78rem', color: '#4b7a5a', marginTop: '0.75rem' }}>
          Algorithmic draws weight numbers by frequency in user scores (least common = higher chance).
        </p>
      </div>

      {/* Simulation Result */}
      {simResult && (
        <div className="card" style={{ marginBottom: '2rem', border: '1px solid #f59e0b', background: 'rgba(245,158,11,0.05)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
            <h3 style={{ fontSize: '1rem', color: '#f59e0b' }}>⚡ Simulation Preview</h3>
            <button className="btn btn-outline btn-sm" onClick={() => setSimResult(null)}>Dismiss</button>
          </div>
          <div style={{ marginBottom: '0.75rem' }}>
            <div style={{ fontSize: '0.8rem', color: '#4b7a5a', marginBottom: 6 }}>Simulated Numbers</div>
            <div style={{ display: 'flex', gap: '0.5rem' }}>
              {simResult.drawNumbers.map((n, i) => (
                <div key={i} style={{ width: 40, height: 40, borderRadius: '50%', background: 'rgba(245,158,11,0.15)', border: '1px solid rgba(245,158,11,0.4)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, color: '#f59e0b' }}>{n}</div>
              ))}
            </div>
          </div>
          <p style={{ fontSize: '0.85rem', color: '#86efac' }}>
            {simResult.winners?.length} winner(s) found · 5-Match winners: {simResult.fiveMatchWinners}
            {simResult.jackpotRollsOver ? ' · Jackpot will roll over' : ' · Jackpot will be claimed'}
          </p>
          <p style={{ fontSize: '0.8rem', color: '#4b7a5a', marginTop: 6 }}>Note: Publishing will generate a fresh set of official numbers, not these simulation numbers.</p>
        </div>
      )}

      {/* Draw List */}
      {loading ? <div className="spinner" /> : draws.length === 0 ? (
        <div className="empty card"><h3>No draws yet</h3><p>Create your first draw above</p></div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          {draws.map(draw => (
            <div key={draw._id} className="card">
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '1rem' }}>
                <div>
                  <div style={{ fontWeight: 600, fontSize: '1.1rem', marginBottom: 4 }}>{draw.month}</div>
                  <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                    <span className={`badge ${draw.status === 'published' ? 'badge-green' : draw.status === 'simulated' ? 'badge-gold' : 'badge-dim'}`}>{draw.status}</span>
                    <span className="badge badge-dim">{draw.drawType}</span>
                    <span className="badge badge-blue">{draw.activeSubscribers} subscribers</span>
                  </div>
                </div>

                <div style={{ textAlign: 'right' }}>
                  <div style={{ fontSize: '0.78rem', color: '#4b7a5a', marginBottom: 4 }}>Prize Pool</div>
                  <div style={{ fontWeight: 700, color: '#f59e0b', fontFamily: "'Playfair Display', serif" }}>£{draw.prizePool?.total || 0}</div>
                </div>

                <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
                  {draw.status !== 'published' && (
                    <button
                      className="btn btn-outline btn-sm"
                      onClick={() => handleSimulate(draw._id)}
                      disabled={simulating === draw._id}
                    >
                      {simulating === draw._id ? 'Simulating…' : '⚡ Simulate'}
                    </button>
                  )}
                  {draw.status !== 'published' && (
                    <button
                      className="btn btn-primary btn-sm"
                      onClick={() => handlePublish(draw._id)}
                      disabled={publishing === draw._id}
                    >
                      {publishing === draw._id ? 'Publishing…' : '🚀 Publish'}
                    </button>
                  )}
                  {draw.status === 'published' && (
                    <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                      {draw.drawNumbers.map((n, i) => (
                        <div key={i} style={{ width: 32, height: 32, borderRadius: '50%', background: 'rgba(74,222,128,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.8rem', fontWeight: 700, color: '#4ade80' }}>{n}</div>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              {draw.status === 'published' && draw.winners?.length > 0 && (
                <div style={{ marginTop: '1rem', borderTop: '1px solid #1f3527', paddingTop: '1rem' }}>
                  <div style={{ fontSize: '0.78rem', color: '#4b7a5a', marginBottom: '0.5rem' }}>{draw.winners.length} winner(s)</div>
                  <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                    {draw.winners.map((w, i) => (
                      <span key={i} className={`badge ${w.matchType === '5-match' ? 'badge-gold' : w.matchType === '4-match' ? 'badge-green' : 'badge-blue'}`}>
                        {w.matchType} · £{w.prize}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </AdminLayout>
  );
}
