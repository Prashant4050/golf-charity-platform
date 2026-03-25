import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../utils/api';
import toast from 'react-hot-toast';

function StatusBadge({ status }) {
  const map = { active: 'badge-green', trialing: 'badge-blue', inactive: 'badge-dim', cancelled: 'badge-red', lapsed: 'badge-red' };
  return <span className={`badge ${map[status] || 'badge-dim'}`}>{status}</span>;
}

export default function DashboardPage() {
  const { user, refreshUser } = useAuth();
  const [latestDraw, setLatestDraw] = useState(null);
  const [scores, setScores] = useState([]);
  const [loading, setLoading] = useState(true);
  const [cancelling, setCancelling] = useState(false);
  const [proofUrl, setProofUrl] = useState('');

  useEffect(() => {
    Promise.all([
      api.get('/draws/latest').then(r => setLatestDraw(r.data)).catch(() => {}),
      api.get('/scores').then(r => setScores(r.data)).catch(() => {}),
    ]).finally(() => setLoading(false));
  }, []);

  const handleCancel = async () => {
    if (!window.confirm('Cancel subscription at end of billing period?')) return;
    setCancelling(true);
    try {
      await api.post('/payments/cancel');
      toast.success('Subscription will cancel at period end');
      await refreshUser();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Could not cancel');
    } finally {
      setCancelling(false);
    }
  };

  const handleProofSubmit = async (e) => {
    e.preventDefault();
    try {
      await api.post('/users/upload-proof', { proofUrl });
      toast.success('Proof submitted! Admin will review shortly.');
      setProofUrl('');
    } catch (err) {
      toast.error('Failed to submit proof');
    }
  };

  if (loading) return <div className="spinner" />;

  const sub = user?.subscription;
  const hasMembership = ['active', 'trialing'].includes(sub?.status);
  const renewDate = sub?.currentPeriodEnd ? new Date(sub.currentPeriodEnd).toLocaleDateString('en-GB') : '—';

  return (
    <div className="page-wrap">
      <div style={{ marginBottom: '2rem' }}>
        <h1 style={{ fontSize: '1.8rem', marginBottom: '0.25rem' }}>Welcome back, {user?.name?.split(' ')[0]} 👋</h1>
        <p style={{ color: '#86efac' }}>Here's your GolfGives overview</p>
      </div>

      {/* Subscription Status */}
      <div className="card" style={{ marginBottom: '1.5rem', display: 'flex', flexWrap: 'wrap', gap: '1.5rem', alignItems: 'center', justifyContent: 'space-between' }}>
        <div>
          <div style={{ fontSize: '0.8rem', color: '#4b7a5a', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: 6 }}>Subscription</div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flexWrap: 'wrap' }}>
            <StatusBadge status={sub?.status} />
            <span style={{ fontSize: '0.9rem', color: '#86efac' }}>{sub?.plan || '—'} plan</span>
            {sub?.status === 'active' && <span style={{ fontSize: '0.82rem', color: '#4b7a5a' }}>Renews {renewDate}</span>}
            {sub?.status === 'trialing' && <span style={{ fontSize: '0.82rem', color: '#4b7a5a' }}>Free access until {renewDate}</span>}
          </div>
          {sub?.cancelAtPeriodEnd && <div style={{ color: '#f59e0b', fontSize: '0.82rem', marginTop: 4 }}>⚠ Cancels at period end</div>}
        </div>
        {sub?.plan === 'free' && (
          <div style={{ color: '#60a5fa', fontSize: '0.82rem', marginTop: 4 }}>
            Starter plan lets you explore the dashboard and log scores. Upgrade to join paid draws.
          </div>
        )}
        <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
          {sub?.status === 'active' && !sub?.cancelAtPeriodEnd && (
            <button className="btn btn-danger btn-sm" onClick={handleCancel} disabled={cancelling}>
              {cancelling ? 'Cancelling…' : 'Cancel Subscription'}
            </button>
          )}
          {sub?.status === 'trialing' && (
            <Link to="/subscribe" className="btn btn-primary btn-sm">Upgrade Plan</Link>
          )}
          {!hasMembership && (
            <Link to="/subscribe" className="btn btn-primary btn-sm">Resubscribe</Link>
          )}
        </div>
      </div>

      {/* Stats */}
      <div className="stat-grid stat-grid-4" style={{ marginBottom: '1.5rem' }}>
        <div className="stat-card">
          <div className="stat-label">Scores Logged</div>
          <div className="stat-value green">{scores.length}/5</div>
        </div>
        <div className="stat-card">
          <div className="stat-label">Total Winnings</div>
          <div className="stat-value gold">£{user?.totalWinnings || 0}</div>
        </div>
        <div className="stat-card">
          <div className="stat-label">Charity</div>
          <div className="stat-value" style={{ fontSize: '1rem', paddingTop: 4 }}>{user?.charity?.name || 'Not selected'}</div>
        </div>
        <div className="stat-card">
          <div className="stat-label">Charity %</div>
          <div className="stat-value blue">{user?.charityPercentage || 10}%</div>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '1.5rem' }}>
        {/* Recent Scores */}
        <div className="card">
          <div className="section-title">
            <span>My Scores</span>
            <Link to="/scores" className="btn btn-outline btn-sm">Manage →</Link>
          </div>
          {scores.length === 0 ? (
            <div className="empty">
              <h3>No scores yet</h3>
              <p>Add your Stableford scores to enter the draw</p>
              <Link to="/scores" className="btn btn-primary btn-sm" style={{ marginTop: '1rem' }}>Add Score</Link>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              {scores.map((s, i) => (
                <div key={s._id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0.75rem', background: '#111a14', borderRadius: 8 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                    <div style={{ width: 32, height: 32, borderRadius: '50%', background: 'rgba(74,222,128,0.12)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.75rem', color: '#4ade80', fontWeight: 600 }}>#{i + 1}</div>
                    <div>
                      <div style={{ fontWeight: 600, fontSize: '1.1rem' }}>{s.score} pts</div>
                      <div style={{ fontSize: '0.75rem', color: '#4b7a5a' }}>{new Date(s.date).toLocaleDateString('en-GB')}</div>
                    </div>
                  </div>
                  {i === 0 && <span className="badge badge-green">Latest</span>}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Latest Draw */}
        <div className="card">
          <div className="section-title">Latest Draw</div>
          {!latestDraw ? (
            <div className="empty"><h3>No draw yet</h3><p>The first draw will run at end of month</p></div>
          ) : (
            <>
              <div style={{ marginBottom: '1rem' }}>
                <div style={{ fontSize: '0.8rem', color: '#4b7a5a', marginBottom: 4 }}>Draw Month</div>
                <div style={{ fontWeight: 600 }}>{latestDraw.month}</div>
              </div>
              <div style={{ marginBottom: '1rem' }}>
                <div style={{ fontSize: '0.8rem', color: '#4b7a5a', marginBottom: 8 }}>Winning Numbers</div>
                <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                  {latestDraw.drawNumbers.map((n, i) => (
                    <div key={i} style={{ width: 40, height: 40, borderRadius: '50%', background: 'rgba(74,222,128,0.12)', border: '1px solid rgba(74,222,128,0.3)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, color: '#4ade80' }}>{n}</div>
                  ))}
                </div>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: '0.5rem', textAlign: 'center' }}>
                <div style={{ background: '#111a14', borderRadius: 8, padding: '0.75rem' }}>
                  <div style={{ color: '#f59e0b', fontWeight: 700, fontSize: '1.1rem' }}>£{latestDraw.prizePool.fiveMatch}</div>
                  <div style={{ fontSize: '0.7rem', color: '#4b7a5a' }}>Jackpot</div>
                </div>
                <div style={{ background: '#111a14', borderRadius: 8, padding: '0.75rem' }}>
                  <div style={{ color: '#4ade80', fontWeight: 700, fontSize: '1.1rem' }}>£{latestDraw.prizePool.fourMatch}</div>
                  <div style={{ fontSize: '0.7rem', color: '#4b7a5a' }}>4-Match</div>
                </div>
                <div style={{ background: '#111a14', borderRadius: 8, padding: '0.75rem' }}>
                  <div style={{ color: '#60a5fa', fontWeight: 700, fontSize: '1.1rem' }}>£{latestDraw.prizePool.threeMatch}</div>
                  <div style={{ fontSize: '0.7rem', color: '#4b7a5a' }}>3-Match</div>
                </div>
              </div>
            </>
          )}
        </div>

        {/* Winnings & Proof */}
        {user?.totalWinnings > 0 && (
          <div className="card">
            <div className="section-title">Winnings</div>
            <div style={{ marginBottom: '1rem' }}>
              <div style={{ fontSize: '2rem', fontWeight: 900, fontFamily: "'Playfair Display', serif", color: '#f59e0b' }}>£{user.totalWinnings}</div>
              <div style={{ fontSize: '0.85rem', color: '#4b7a5a', marginTop: 4 }}>
                Payment: <span className={`badge ${user.paymentStatus === 'paid' ? 'badge-green' : 'badge-gold'}`}>{user.paymentStatus}</span>
              </div>
            </div>
            {user.paymentStatus === 'pending' && !user.winnerProof && (
              <form onSubmit={handleProofSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                <div className="form-group">
                  <label className="form-label">Upload Score Proof (URL)</label>
                  <input placeholder="https://your-screenshot-url.com" value={proofUrl} onChange={e => setProofUrl(e.target.value)} required />
                </div>
                <button type="submit" className="btn btn-primary btn-sm">Submit Proof</button>
              </form>
            )}
            {user.winnerProof && <p style={{ color: '#4ade80', fontSize: '0.88rem' }}>✓ Proof submitted — pending admin review</p>}
          </div>
        )}

        {/* Charity */}
        <div className="card">
          <div className="section-title">Your Charity</div>
          {!user?.charity ? (
            <div className="empty">
              <h3>No charity selected</h3>
              <p>Choose a charity to support with your subscription</p>
              <Link to="/charities" className="btn btn-primary btn-sm" style={{ marginTop: '1rem' }}>Browse Charities</Link>
            </div>
          ) : (
            <>
              <div style={{ fontWeight: 600, fontSize: '1.1rem', marginBottom: '0.5rem' }}>{user.charity.name}</div>
              <div style={{ color: '#86efac', fontSize: '0.88rem', marginBottom: '1rem', lineHeight: 1.5 }}>{user.charity.description?.substring(0, 100)}…</div>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <span style={{ color: '#4b7a5a', fontSize: '0.85rem' }}>Contribution: <strong style={{ color: '#4ade80' }}>{user.charityPercentage}%</strong></span>
                <Link to="/charities" className="btn btn-outline btn-sm">Change</Link>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
