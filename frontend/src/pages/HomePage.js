import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../utils/api';

const steps = [
  {
    step: '01',
    title: 'Pick your plan',
    text: 'Start with the Rs 0 starter option or upgrade to a paid membership when you want draw access.',
  },
  {
    step: '02',
    title: 'Log stableford scores',
    text: 'Keep your latest golf rounds in one place so your game data is always ready.',
  },
  {
    step: '03',
    title: 'Support a cause',
    text: 'Choose the charity that matters to you and see your contribution reflected in the app.',
  },
  {
    step: '04',
    title: 'Upgrade for paid draws',
    text: 'Monthly and yearly memberships unlock the full prize-draw experience.',
  },
];

const prizeTiers = [
  { label: '5-match jackpot', value: '40%', note: 'Rolls over if nobody hits all 5.' },
  { label: '4-match prize', value: '35%', note: 'Split between strong monthly cards.' },
  { label: '3-match prize', value: '25%', note: 'Keeps more golfers in the action.' },
];

export default function HomePage() {
  const [charities, setCharities] = useState([]);
  const [featured, setFeatured] = useState(null);

  useEffect(() => {
    api.get('/charities?limit=4')
      .then((res) => setCharities(Array.isArray(res.data) ? res.data : []))
      .catch(() => {});

    api.get('/charities/featured?limit=1')
      .then((res) => setFeatured(Array.isArray(res.data) ? res.data[0] || null : null))
      .catch(() => {});
  }, []);

  return (
    <div className="home-page public-page">
      <section className="home-hero">
        <div className="container home-hero-grid">
          <div className="hero-copy-panel">
            <span className="hero-tag">Golf | Charity | Rewards</span>
            <h1 className="hero-title">Play better rounds and turn them into impact.</h1>
            <p className="hero-copy">
              GolfGives helps golfers log scores, discover charities, and upgrade into paid draw access when they are ready.
            </p>

            <div className="hero-actions">
              <Link to="/register" className="btn btn-primary btn-lg">Create account</Link>
              <Link to="/subscribe" className="btn btn-outline btn-lg">See plans</Link>
            </div>

            <div className="hero-meta-grid">
              <div className="hero-metric">
                <span>Start free</span>
                <strong>Rs 0 starter access available</strong>
              </div>
              <div className="hero-metric">
                <span>Stay organised</span>
                <strong>Track your latest 5 stableford rounds</strong>
              </div>
              <div className="hero-metric">
                <span>Choose your cause</span>
                <strong>Support a charity from the same dashboard</strong>
              </div>
            </div>
          </div>

          <div className="hero-spotlight">
            <div className="spotlight-card">
              <span className="spotlight-label">Featured charity</span>
              <h2>{featured?.name || 'A better way to connect golf and giving'}</h2>
              <p>
                {featured?.description
                  ? `${featured.description.slice(0, 170)}${featured.description.length > 170 ? '...' : ''}`
                  : 'Browse curated charities, choose where your support goes, and upgrade into paid draw access when you want the full experience.'}
              </p>

              <div className="spotlight-stats">
                <div className="spotlight-stat">
                  <span>Supporters</span>
                  <strong>{featured?.subscriberCount || 0}</strong>
                </div>
                <div className="spotlight-stat">
                  <span>Category</span>
                  <strong>{featured?.category || 'community'}</strong>
                </div>
              </div>

              <Link to="/charities" className="btn btn-outline">Browse charities</Link>
            </div>

            <div className="hero-score-strip">
              <span>5 latest scores</span>
              <strong>One dashboard</strong>
              <span>Upgrade for prize draws</span>
            </div>
          </div>
        </div>
      </section>

      <section className="home-section">
        <div className="container">
          <div className="section-header section-header--centered">
            <span className="section-eyebrow">How it works</span>
            <h2>One clean flow from signup to support</h2>
            <p>You can explore the product for free, then move into paid plans when you want monthly draw access.</p>
          </div>

          <div className="process-grid">
            {steps.map((item) => (
              <article key={item.step} className="process-card">
                <span className="process-step">{item.step}</span>
                <h3>{item.title}</h3>
                <p>{item.text}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="home-section home-section--muted">
        <div className="container">
          <div className="section-header section-header--centered">
            <span className="section-eyebrow">Prize structure</span>
            <h2>Three payout levels for paid members</h2>
            <p>Monthly and yearly memberships fund the prize pool while keeping the platform and charity support balanced.</p>
          </div>

          <div className="pool-grid">
            {prizeTiers.map((tier) => (
              <article key={tier.label} className="pool-card">
                <span className="pool-label">{tier.label}</span>
                <strong>{tier.value}</strong>
                <p>{tier.note}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="home-section">
        <div className="container">
          <div className="section-header">
            <div>
              <span className="section-eyebrow">Charity choices</span>
              <h2>Support a cause that feels personal</h2>
              <p>Your starter or paid plan can still be tied to a charity you care about.</p>
            </div>
            <Link to="/charities" className="btn btn-outline">See all charities</Link>
          </div>

          <div className="charity-grid">
            {(charities.length > 0 ? charities : Array.from({ length: 4 })).map((charity, index) => (
              <article key={charity?._id || index} className={`charity-tile${charity ? '' : ' charity-tile--placeholder'}`}>
                {charity ? (
                  <>
                    <span className="charity-tile__tag">{charity.category || 'community'}</span>
                    <h3>{charity.name}</h3>
                    <p>{charity.description?.slice(0, 120)}{charity.description?.length > 120 ? '...' : ''}</p>
                    <div className="charity-tile__meta">{charity.subscriberCount || 0} supporters</div>
                  </>
                ) : (
                  <>
                    <span className="charity-tile__tag">coming soon</span>
                    <h3>More charities loading</h3>
                    <p>We are pulling in more causes for golfers who want clear, local impact.</p>
                    <div className="charity-tile__meta">New partners on the way</div>
                  </>
                )}
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="home-section">
        <div className="container">
          <div className="home-cta-banner">
            <div>
              <span className="section-eyebrow">Ready to start?</span>
              <h2>Begin with Rs 0, then upgrade when you want paid draws.</h2>
              <p>The public pages, charity discovery, and starter dashboard make it easy to try the platform first.</p>
            </div>

            <div className="home-cta-actions">
              <Link to="/register" className="btn btn-primary btn-lg">Join now</Link>
              <Link to="/subscribe" className="btn btn-outline btn-lg">Compare plans</Link>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
