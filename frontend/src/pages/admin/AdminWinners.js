import { useEffect, useState } from 'react';
import AdminLayout from './AdminLayout';
import api from '../../utils/api';

const badgeClassByMatch = {
  '5-match': 'badge-gold',
  '4-match': 'badge-green',
  '3-match': 'badge-blue',
};

const badgeClassByPayment = {
  paid: 'badge-green',
  pending: 'badge-gold',
  rejected: 'badge-red',
};

export default function AdminWinners() {
  const [winners, setWinners] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/winners')
      .then((res) => setWinners(res.data))
      .finally(() => setLoading(false));
  }, []);

  return (
    <AdminLayout title="Winners">
      {loading ? (
        <div className="spinner" />
      ) : winners.length === 0 ? (
        <div className="empty card">
          <h3>No winners yet</h3>
          <p>Published draw winners will appear here.</p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          {winners.map((winner) => (
            <div key={winner._id} className="card">
              <div style={{ display: 'flex', justifyContent: 'space-between', gap: '1rem', flexWrap: 'wrap' }}>
                <div>
                  <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center', flexWrap: 'wrap', marginBottom: '0.5rem' }}>
                    <h3 style={{ fontSize: '1rem' }}>{winner.user?.name || 'Anonymous'}</h3>
                    <span className={`badge ${badgeClassByMatch[winner.matchType] || 'badge-dim'}`}>{winner.matchType}</span>
                    <span className={`badge ${badgeClassByPayment[winner.paymentStatus] || 'badge-dim'}`}>{winner.paymentStatus}</span>
                  </div>
                  <div style={{ fontSize: '0.85rem', color: '#86efac', marginBottom: '0.35rem' }}>{winner.user?.email || 'No email'}</div>
                  <div style={{ fontSize: '0.8rem', color: '#4b7a5a' }}>
                    Draw: {winner.drawMonth} | Numbers: {(winner.drawNumbers || []).join(', ')}
                  </div>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <div style={{ fontSize: '0.8rem', color: '#4b7a5a', marginBottom: '0.25rem' }}>Prize</div>
                  <div style={{ fontSize: '1.3rem', fontWeight: 800, color: '#f59e0b', fontFamily: "'Playfair Display', serif" }}>
                    GBP {winner.prize}
                  </div>
                </div>
              </div>

              <div style={{ marginTop: '1rem', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '0.75rem' }}>
                <div style={{ background: '#111a14', borderRadius: 10, padding: '0.85rem' }}>
                  <div style={{ fontSize: '0.72rem', color: '#4b7a5a', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '0.35rem' }}>Matched Numbers</div>
                  <div style={{ color: '#86efac', fontSize: '0.88rem' }}>
                    {(winner.matchedNumbers || []).length > 0 ? winner.matchedNumbers.join(', ') : 'Not available'}
                  </div>
                </div>
                <div style={{ background: '#111a14', borderRadius: 10, padding: '0.85rem' }}>
                  <div style={{ fontSize: '0.72rem', color: '#4b7a5a', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '0.35rem' }}>Proof Status</div>
                  <div style={{ color: winner.proofSubmitted ? '#4ade80' : '#f59e0b', fontSize: '0.88rem' }}>
                    {winner.proofSubmitted ? 'Proof submitted' : 'Awaiting proof'}
                  </div>
                  {winner.proofUrl && (
                    <a href={winner.proofUrl} target="_blank" rel="noreferrer" style={{ display: 'inline-block', marginTop: '0.4rem', color: '#60a5fa', fontSize: '0.82rem' }}>
                      View proof
                    </a>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </AdminLayout>
  );
}
