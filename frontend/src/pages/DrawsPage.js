import { useState, useEffect } from 'react';
import api from '../utils/api';

export default function DrawsPage() {
  const [draws, setDraws] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/draws').then(r => setDraws(r.data)).finally(() => setLoading(false));
  }, []);

  return (
    <div className="page-wrap">
      <div style={{ textAlign: 'center', marginBottom: '2.5rem' }}>
        <h1 style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>Monthly <span style={{ color: '#4ade80' }}>Draw Results</span></h1>
        <p style={{ color: '#86efac' }}>Every month, 5 winning numbers are drawn. Match 3, 4 or 5 of your scores to win.</p>
      </div>

      {loading ? <div className="spinner" /> : draws.length === 0 ? (
        <div className="empty card" style={{ maxWidth: 480, margin: '0 auto' }}>
          <h3>No draws yet</h3>
          <p>The first draw will run at the end of this month. Subscribe and add your scores to enter!</p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          {draws.map((draw, idx) => (
            <div key={draw._id} className="card" style={{ border: `1px solid ${idx === 0 ? '#4ade80' : '#2d4a35'}` }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '1rem', marginBottom: '1.25rem' }}>
                <div>
                  {idx === 0 && <div style={{ fontSize: '0.75rem', color: '#4ade80', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: 4 }}>Latest Draw</div>}
                  <h3 style={{ fontSize: '1.2rem' }}>{draw.month}</h3>
                  <div style={{ fontSize: '0.8rem', color: '#4b7a5a' }}>Published {new Date(draw.publishedAt).toLocaleDateString('en-GB')}</div>
                </div>
                <div style={{ display: 'flex', gap: '0.5rem' }}>
                  <span className="badge badge-dim">{draw.activeSubscribers} players</span>
                  <span className={`badge ${draw.jackpotRollover > 0 ? 'badge-gold' : 'badge-green'}`}>
                    {draw.jackpotRollover > 0 ? `Jackpot rolled: £${draw.jackpotRollover}` : 'Jackpot won!'}
                  </span>
                </div>
              </div>

              {/* Draw Numbers */}
              <div style={{ marginBottom: '1.25rem' }}>
                <div style={{ fontSize: '0.8rem', color: '#4b7a5a', marginBottom: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Winning Numbers</div>
                <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
                  {draw.drawNumbers.map((n, i) => (
                    <div key={i} style={{ width: 48, height: 48, borderRadius: '50%', background: 'rgba(74,222,128,0.1)', border: '2px solid rgba(74,222,128,0.35)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, fontSize: '1.1rem', color: '#4ade80' }}>{n}</div>
                  ))}
                </div>
              </div>

              {/* Prize Pools */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: '0.75rem', marginBottom: '1.25rem' }}>
                {[
                  { label: '5-Match Jackpot', val: draw.prizePool.fiveMatch, color: '#f59e0b' },
                  { label: '4-Match', val: draw.prizePool.fourMatch, color: '#4ade80' },
                  { label: '3-Match', val: draw.prizePool.threeMatch, color: '#60a5fa' },
                ].map(p => (
                  <div key={p.label} style={{ background: '#111a14', borderRadius: 8, padding: '0.75rem', textAlign: 'center' }}>
                    <div style={{ color: p.color, fontWeight: 700, fontSize: '1.1rem', fontFamily: "'Playfair Display', serif" }}>£{p.val}</div>
                    <div style={{ fontSize: '0.72rem', color: '#4b7a5a', marginTop: 3 }}>{p.label}</div>
                  </div>
                ))}
              </div>

              {/* Winners */}
              {draw.winners?.length > 0 && (
                <div>
                  <div style={{ fontSize: '0.8rem', color: '#4b7a5a', marginBottom: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Winners</div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                    {draw.winners.map((w, i) => (
                      <div key={i} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: '#111a14', borderRadius: 8, padding: '0.75rem 1rem' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                          <span className={`badge ${w.matchType === '5-match' ? 'badge-gold' : w.matchType === '4-match' ? 'badge-green' : 'badge-blue'}`}>{w.matchType}</span>
                          <span style={{ fontSize: '0.9rem' }}>{w.user?.name || 'Anonymous'}</span>
                        </div>
                        <span style={{ fontWeight: 700, color: '#f59e0b' }}>£{w.prize}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
              {draw.winners?.length === 0 && (
                <div style={{ color: '#4b7a5a', fontSize: '0.88rem' }}>No winners this month.</div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}