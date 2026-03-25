import { useState, useEffect } from 'react';
import AdminLayout from './AdminLayout';
import api from '../../utils/api';

export default function AdminDashboard() {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/admin/stats').then(r => setStats(r.data)).finally(() => setLoading(false));
  }, []);

  return (
    <AdminLayout title="Overview">
      {loading ? <div className="spinner" /> : !stats ? <p>Failed to load stats</p> : (
        <>
          <div className="stat-grid stat-grid-4" style={{ marginBottom: '2rem' }}>
            <div className="stat-card">
              <div className="stat-label">Total Users</div>
              <div className="stat-value blue">{stats.totalUsers}</div>
            </div>
            <div className="stat-card">
              <div className="stat-label">Active Subscribers</div>
              <div className="stat-value green">{stats.activeSubscribers}</div>
            </div>
            <div className="stat-card">
              <div className="stat-label">Total Prize Paid</div>
              <div className="stat-value gold">£{stats.totalPrizePaid}</div>
            </div>
            <div className="stat-card">
              <div className="stat-label">Charities Listed</div>
              <div className="stat-value">{stats.totalCharities}</div>
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1.5rem' }}>
            <div className="card">
              <h3 style={{ fontSize: '1rem', marginBottom: '1rem' }}>Monthly Charity Contribution</h3>
              <div style={{ fontSize: '2rem', fontWeight: 900, fontFamily: "'Playfair Display', serif", color: '#4ade80' }}>
                £{stats.monthlyCharityContrib?.toFixed(2) || '0'}
              </div>
              <p style={{ fontSize: '0.82rem', color: '#4b7a5a', marginTop: 6 }}>Estimated from active subscribers this month</p>
            </div>

            <div className="card">
              <h3 style={{ fontSize: '1rem', marginBottom: '1rem' }}>Recent Draws</h3>
              {stats.recentDraws?.length === 0 ? (
                <p style={{ color: '#4b7a5a', fontSize: '0.88rem' }}>No draws yet. Create one in the Draws section.</p>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                  {stats.recentDraws.map(d => (
                    <div key={d._id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.5rem 0', borderBottom: '1px solid #1f3527' }}>
                      <div>
                        <div style={{ fontWeight: 600, fontSize: '0.9rem' }}>{d.month}</div>
                        <div style={{ fontSize: '0.75rem', color: '#4b7a5a' }}>£{d.prizePool?.total || 0} pool</div>
                      </div>
                      <span className={`badge ${d.status === 'published' ? 'badge-green' : d.status === 'simulated' ? 'badge-gold' : 'badge-dim'}`}>{d.status}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="card">
              <h3 style={{ fontSize: '1rem', marginBottom: '1rem' }}>Quick Actions</h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                {[
                  { to: '/admin/draws', label: '🎲 Create / Run Draw' },
                  { to: '/admin/users', label: '👥 Manage Users' },
                  { to: '/admin/charities', label: '💚 Add Charity' },
                  { to: '/admin/winners', label: '🏆 Review Winners' },
                ].map(a => (
                  <a key={a.to} href={a.to} style={{ display: 'block', padding: '10px 14px', background: '#111a14', borderRadius: 8, fontSize: '0.88rem', color: '#86efac', textDecoration: 'none', border: '1px solid #2d4a35', transition: 'border-color 0.2s' }}
                    onMouseEnter={e => e.target.style.borderColor = '#4ade80'}
                    onMouseLeave={e => e.target.style.borderColor = '#2d4a35'}>
                    {a.label}
                  </a>
                ))}
              </div>
            </div>
          </div>
        </>
      )}
    </AdminLayout>
  );
}
