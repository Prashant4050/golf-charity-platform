import { useState, useEffect } from 'react';
import api from '../utils/api';
import toast from 'react-hot-toast';

export default function ScoresPage() {
  const [scores, setScores] = useState([]);
  const [form, setForm] = useState({ score: '', date: new Date().toISOString().split('T')[0] });
  const [editing, setEditing] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const load = () => api.get('/scores').then(r => setScores(r.data)).finally(() => setLoading(false));
  useEffect(() => { load(); }, []);

  const handleAdd = async (e) => {
    e.preventDefault();
    const val = Number(form.score);
    if (val < 1 || val > 45) return toast.error('Score must be 1–45 (Stableford)');
    setSaving(true);
    try {
      const res = await api.post('/scores', { score: val, date: form.date });
      setScores(res.data);
      setForm({ score: '', date: new Date().toISOString().split('T')[0] });
      toast.success('Score added!');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to add score');
    } finally { setSaving(false); }
  };

  const handleEdit = async (id) => {
    setSaving(true);
    try {
      const res = await api.put(`/scores/${id}`, { score: Number(editing.score), date: editing.date });
      setScores(res.data);
      setEditing(null);
      toast.success('Score updated!');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to update');
    } finally { setSaving(false); }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Remove this score?')) return;
    try {
      const res = await api.delete(`/scores/${id}`);
      setScores(res.data);
      toast.success('Score removed');
    } catch (err) {
      toast.error('Failed to delete');
    }
  };

  return (
    <div className="page-wrap" style={{ maxWidth: 700 }}>
      <h1 style={{ fontSize: '1.8rem', marginBottom: '0.25rem' }}>My Stableford Scores</h1>
      <p style={{ color: '#86efac', marginBottom: '2rem' }}>Up to 5 scores are kept. Adding a 6th removes the oldest. Range: 1–45.</p>

      {/* Add Score Form */}
      <div className="card" style={{ marginBottom: '2rem' }}>
        <h3 style={{ marginBottom: '1rem', fontSize: '1rem' }}>Add New Score</h3>
        <form onSubmit={handleAdd} style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap', alignItems: 'flex-end' }}>
          <div className="form-group" style={{ flex: '1 1 120px' }}>
            <label className="form-label">Score (1–45)</label>
            <input
              type="number" min="1" max="45" placeholder="e.g. 32"
              value={form.score} onChange={e => setForm({ ...form, score: e.target.value })} required
            />
          </div>
          <div className="form-group" style={{ flex: '1 1 160px' }}>
            <label className="form-label">Date Played</label>
            <input type="date" value={form.date} onChange={e => setForm({ ...form, date: e.target.value })} required />
          </div>
          <button type="submit" className="btn btn-primary" disabled={saving || scores.length >= 5 && false} style={{ height: 42 }}>
            {saving ? 'Adding…' : '+ Add Score'}
          </button>
        </form>
        {scores.length === 5 && (
          <p style={{ fontSize: '0.82rem', color: '#f59e0b', marginTop: '0.75rem' }}>
            ⚠ You have 5 scores. Adding one will remove the oldest.
          </p>
        )}
      </div>

      {/* Scores List */}
      {loading ? <div className="spinner" /> : scores.length === 0 ? (
        <div className="empty card">
          <h3>No scores yet</h3>
          <p>Add your first Stableford score above to enter the monthly draw.</p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
          {scores.map((s, i) => (
            <div key={s._id} className="card card-sm" style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
              <div style={{ width: 44, height: 44, borderRadius: '50%', background: i === 0 ? 'rgba(74,222,128,0.15)' : 'rgba(75,122,90,0.2)', border: `1px solid ${i === 0 ? 'rgba(74,222,128,0.4)' : 'rgba(75,122,90,0.3)'}`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, fontSize: '1.2rem', color: i === 0 ? '#4ade80' : '#86efac', flexShrink: 0 }}>
                {s.score}
              </div>

              {editing?._id === s._id ? (
                <div style={{ flex: 1, display: 'flex', gap: '0.75rem', flexWrap: 'wrap', alignItems: 'center' }}>
                  <input type="number" min="1" max="45" value={editing.score} onChange={e => setEditing({ ...editing, score: e.target.value })} style={{ width: 80 }} />
                  <input type="date" value={editing.date} onChange={e => setEditing({ ...editing, date: e.target.value })} style={{ width: 150 }} />
                  <button className="btn btn-primary btn-sm" onClick={() => handleEdit(s._id)} disabled={saving}>Save</button>
                  <button className="btn btn-outline btn-sm" onClick={() => setEditing(null)}>Cancel</button>
                </div>
              ) : (
                <>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontWeight: 600, fontSize: '1rem' }}>{s.score} points</div>
                    <div style={{ fontSize: '0.8rem', color: '#4b7a5a' }}>Played: {new Date(s.date).toLocaleDateString('en-GB')}</div>
                  </div>
                  <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                    {i === 0 && <span className="badge badge-green">Latest</span>}
                    <button className="btn btn-outline btn-sm" onClick={() => setEditing({ _id: s._id, score: s.score, date: new Date(s.date).toISOString().split('T')[0] })}>Edit</button>
                    <button className="btn btn-danger btn-sm" onClick={() => handleDelete(s._id)}>×</button>
                  </div>
                </>
              )}
            </div>
          ))}
        </div>
      )}

      <div className="card" style={{ marginTop: '2rem', background: 'rgba(74,222,128,0.04)' }}>
        <h4 style={{ marginBottom: '0.5rem', fontSize: '0.9rem' }}>How the draw works</h4>
        <p style={{ fontSize: '0.85rem', color: '#86efac', lineHeight: 1.7 }}>
          Your 5 most recent scores are your "draw numbers." Each month, 5 winning numbers are drawn from 1–45. Match 3, 4, or all 5 to win a share of the prize pool. The jackpot (5-match) rolls over if no one wins!
        </p>
      </div>
    </div>
  );
}