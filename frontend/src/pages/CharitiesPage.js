import { useState, useEffect } from 'react';
import api from '../utils/api';
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';

export default function CharitiesPage() {
  const { user, refreshUser } = useAuth();
  const [charities, setCharities] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [selecting, setSelecting] = useState(null);
  const [percentage, setPercentage] = useState(10);
  const canSupport = ['active', 'trialing'].includes(user?.subscription?.status);

  const load = (q = '') => {
    setLoading(true);
    api.get(`/charities${q ? `?search=${q}` : ''}`)
      .then(r => setCharities(r.data))
      .catch(() => {})
      .finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, []);

  const handleSearch = (e) => {
    e.preventDefault();
    load(search);
  };

  const handleSelect = async (charity) => {
    if (!user) return toast.error('Please log in to select a charity');
    if (!canSupport) return toast.error('Choose a plan first');
    try {
      await api.post(`/charities/select/${charity._id}`, { percentage });
      await refreshUser();
      toast.success(`Now supporting ${charity.name}!`);
      setSelecting(null);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to select charity');
    }
  };

  return (
    <div className="page-wrap">
      <div style={{ textAlign: 'center', marginBottom: '2.5rem' }}>
        <h1 style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>
          Choose Your <span style={{ color: '#4ade80' }}>Charity</span>
        </h1>
        <p style={{ color: '#86efac' }}>Minimum 10% of your subscription supports your chosen cause every month.</p>
      </div>

      {/* Search */}
      <form onSubmit={handleSearch} style={{ display: 'flex', gap: '0.75rem', marginBottom: '2rem', maxWidth: 480 }}>
        <input placeholder="Search charities…" value={search} onChange={e => setSearch(e.target.value)} />
        <button type="submit" className="btn btn-outline" style={{ flexShrink: 0 }}>Search</button>
        {search && <button type="button" className="btn btn-outline" style={{ flexShrink: 0 }} onClick={() => { setSearch(''); load(); }}>Clear</button>}
      </form>

      {loading ? <div className="spinner" /> : charities.length === 0 ? (
        <div className="empty"><h3>No charities found</h3><p>Try a different search term</p></div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '1.25rem' }}>
          {charities.map(c => {
            const isSelected = user?.charity?._id === c._id || user?.charity === c._id;
            return (
              <div key={c._id} className="card" style={{ position: 'relative', border: `1px solid ${isSelected ? '#4ade80' : '#2d4a35'}`, transition: 'border-color 0.2s' }}>
                {c.featured && (
                  <div style={{ position: 'absolute', top: -10, right: 12, background: '#f59e0b', color: '#0a0f0d', padding: '2px 10px', borderRadius: 20, fontSize: '0.7rem', fontWeight: 700 }}>FEATURED</div>
                )}
                {isSelected && (
                  <div style={{ position: 'absolute', top: -10, left: 12, background: '#4ade80', color: '#0a0f0d', padding: '2px 10px', borderRadius: 20, fontSize: '0.7rem', fontWeight: 700 }}>YOUR CHARITY</div>
                )}

                <div style={{ marginBottom: '0.75rem' }}>
                  <h3 style={{ fontSize: '1.1rem', marginBottom: '0.4rem' }}>{c.name}</h3>
                  <span style={{ fontSize: '0.75rem', background: 'rgba(74,222,128,0.1)', color: '#4ade80', padding: '2px 8px', borderRadius: 4 }}>{c.category}</span>
                </div>

                <p style={{ fontSize: '0.88rem', color: '#86efac', lineHeight: 1.6, marginBottom: '1rem' }}>
                  {c.description?.substring(0, 120)}…
                </p>

                <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center', marginBottom: '1rem', fontSize: '0.8rem', color: '#4b7a5a' }}>
                  <span>👥 {c.subscriberCount || 0} supporters</span>
                  {c.events?.length > 0 && <span>📅 {c.events.length} events</span>}
                </div>

                {selecting === c._id ? (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                    <div className="form-group">
                      <label className="form-label">Your contribution % (min 10%)</label>
                      <input type="number" min="10" max="100" value={percentage} onChange={e => setPercentage(Number(e.target.value))} />
                    </div>
                    <div style={{ display: 'flex', gap: '0.5rem' }}>
                      <button className="btn btn-primary btn-sm" onClick={() => handleSelect(c)}>Confirm</button>
                      <button className="btn btn-outline btn-sm" onClick={() => setSelecting(null)}>Cancel</button>
                    </div>
                  </div>
                ) : (
                  <button
                    className={`btn btn-sm ${isSelected ? 'btn-outline' : 'btn-primary'}`}
                    onClick={() => { setSelecting(c._id); setPercentage(user?.charityPercentage || 10); }}
                    disabled={!user || !canSupport}
                  >
                    {isSelected ? '✓ Selected' : 'Support This Charity'}
                  </button>
                )}

                {/* Events */}
                {c.events?.length > 0 && (
                  <div style={{ marginTop: '1rem', borderTop: '1px solid #1f3527', paddingTop: '1rem' }}>
                    <div style={{ fontSize: '0.75rem', color: '#4b7a5a', marginBottom: '0.5rem', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Upcoming Events</div>
                    {c.events.slice(0, 2).map(ev => (
                      <div key={ev._id} style={{ fontSize: '0.82rem', color: '#86efac', marginBottom: 4 }}>
                        📅 {ev.title} — {new Date(ev.date).toLocaleDateString('en-GB')}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
