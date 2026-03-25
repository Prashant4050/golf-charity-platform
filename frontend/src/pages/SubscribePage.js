import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../utils/api';
import toast from 'react-hot-toast';

const plans = {
  free: {
    label: 'Starter',
    price: 'Rs 0',
    period: 'free access',
    total: 'Explore the dashboard before upgrading',
    saving: 'Best to try first',
    features: ['Dashboard access', 'Score logging', 'Charity browsing', 'No paid draw entry'],
  },
  monthly: {
    label: 'Monthly',
    price: 'GBP 10',
    period: 'per month',
    total: 'Full paid draw access each month',
    saving: null,
    features: ['Paid monthly draw access', 'Charity selection', 'Subscriber dashboard', 'Cancel when needed'],
  },
  yearly: {
    label: 'Yearly',
    price: 'GBP 96',
    period: 'per year',
    total: 'Best value for regular players',
    saving: 'Save GBP 24',
    features: ['Lower annual price', 'Paid monthly draw access', 'Charity selection', 'Long-term membership'],
  },
};

export default function SubscribePage() {
  const { user, refreshUser } = useAuth();
  const navigate = useNavigate();
  const [selected, setSelected] = useState(user?.subscription?.plan === 'free' ? 'free' : 'monthly');
  const [loading, setLoading] = useState(false);

  const hasPaidPlan =
    user?.subscription?.status === 'active' &&
    ['monthly', 'yearly'].includes(user?.subscription?.plan);

  const handleSubscribe = async () => {
    setLoading(true);

    try {
      if (selected === 'free') {
        await api.post('/payments/free-plan');
        await refreshUser();
        toast.success('Starter plan activated');
        navigate('/dashboard');
        return;
      }

      const res = await api.post('/payments/create-checkout', { plan: selected });
      window.location.href = res.data.url;
    } catch (err) {
      toast.error(err.response?.data?.message || 'Could not start checkout');
      setLoading(false);
    }
  };

  if (hasPaidPlan) {
    return (
      <div className="pricing-page public-page">
        <div className="pricing-shell">
          <div className="pricing-status-card">
            <span className="section-eyebrow">Membership active</span>
            <h1>Your {user.subscription.plan} plan is already active.</h1>
            <p>Head back to the dashboard or scores page to keep using the platform.</p>
            <div className="pricing-status-actions">
              <Link to="/dashboard" className="btn btn-primary btn-lg">Go to dashboard</Link>
              <Link to="/scores" className="btn btn-outline btn-lg">Open scores</Link>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="pricing-page public-page">
      <div className="pricing-shell">
        <section className="pricing-hero">
          <span className="section-eyebrow">Plans</span>
          <h1>Start with Rs 0 or upgrade into paid draws.</h1>
          <p>
            The starter option opens the dashboard and score tracking. Monthly and yearly memberships unlock paid draw access.
          </p>
        </section>

        {user?.subscription?.plan === 'free' && (
          <div className="pricing-notice">
            You are currently on the free starter plan. Upgrade any time to join the paid draw tiers.
          </div>
        )}

        <div className="plans-grid">
          {Object.entries(plans).map(([key, plan]) => (
            <button
              key={key}
              type="button"
              className={`plan-card${selected === key ? ' is-selected' : ''}${key === 'free' ? ' is-free' : ''}`}
              onClick={() => setSelected(key)}
            >
              <div className="plan-card__top">
                <div>
                  <span className="plan-card__label">{plan.label}</span>
                  <h2>{plan.price}</h2>
                  <p>{plan.period}</p>
                </div>
                {plan.saving && <span className="plan-badge">{plan.saving}</span>}
              </div>

              <div className="plan-card__summary">{plan.total}</div>

              <div className="plan-card__points">
                {plan.features.map((feature) => (
                  <div key={feature} className="plan-point">{feature}</div>
                ))}
              </div>

              <div className="plan-card__footer">
                <span>{selected === key ? 'Selected' : 'Click to choose'}</span>
              </div>
            </button>
          ))}
        </div>

        <div className="pricing-summary">
          <div className="pricing-summary-card">
            <strong>60%</strong>
            <span>Prize pool from paid plans</span>
          </div>
          <div className="pricing-summary-card">
            <strong>10%+</strong>
            <span>Directed to your chosen charity</span>
          </div>
          <div className="pricing-summary-card">
            <strong>1 click</strong>
            <span>Upgrade path from free to paid</span>
          </div>
        </div>

        <div className="pricing-action-bar">
          <button className="btn btn-primary btn-lg" onClick={handleSubscribe} disabled={loading}>
            {loading
              ? 'Working...'
              : selected === 'free'
                ? 'Start free plan'
                : `Continue with ${plans[selected].label.toLowerCase()} plan`}
          </button>
          <p>
            Paid plans continue through Stripe checkout. The starter plan activates immediately inside your account.
          </p>
        </div>
      </div>
    </div>
  );
}
