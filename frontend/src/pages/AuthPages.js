import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';

const shellContent = {
  login: {
    kicker: 'Golf charity platform',
    title: 'Step back into your golf routine.',
    copy: 'Sign in to manage scores, support a cause, and keep your membership moving.',
    chips: ['Track your last 5 scores', 'Choose a charity', 'Upgrade from free any time'],
    notes: [
      'Monthly and yearly plans unlock paid draw access.',
      'The free starter plan is perfect for trying the platform first.',
      'Your dashboard keeps scores, charity choices, and winnings in one place.',
    ],
  },
  register: {
    kicker: 'Start with a free plan',
    title: 'Create your account and start with Rs 0.',
    copy: 'Join the platform, explore the dashboard, and upgrade when you want paid draw access.',
    chips: ['Rs 0 starter plan', 'Simple account setup', 'Upgrade when ready'],
    notes: [
      'Create one account for scores, charities, and future paid draws.',
      'Starter access lets you explore before committing to a paid plan.',
      'You can switch to monthly or yearly membership any time from the plans page.',
    ],
  },
};

const statItems = [
  { value: '5', label: 'scores tracked' },
  { value: '3', label: 'prize tiers' },
  { value: '1', label: 'cause you choose' },
];

function AuthShell({ mode, children, footer }) {
  const content = shellContent[mode];

  return (
    <div className="auth-page public-page">
      <div className="auth-layout container">
        <section className="auth-aside">
          <div>
            <span className="auth-kicker">{content.kicker}</span>
            <h1 className="auth-title">{content.title}</h1>
            <p className="auth-copy">{content.copy}</p>

            <div className="auth-chip-row">
              {content.chips.map((chip) => (
                <span key={chip} className="auth-chip">{chip}</span>
              ))}
            </div>
          </div>

          <div className="auth-stat-grid">
            {statItems.map((item) => (
              <div key={item.label} className="auth-stat-card">
                <strong>{item.value}</strong>
                <span>{item.label}</span>
              </div>
            ))}
          </div>

          <div className="auth-note-list">
            {content.notes.map((note) => (
              <div key={note} className="auth-note">{note}</div>
            ))}
          </div>
        </section>

        <section className="auth-card">
          {children}
          <div className="auth-footer">{footer}</div>
        </section>
      </div>
    </div>
  );
}

export function LoginPage() {
  const [form, setForm] = useState({ email: '', password: '' });
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const handle = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const user = await login(form.email, form.password);
      const firstName = user.name?.split(' ')[0] || 'Golfer';
      const hasMembership = ['active', 'trialing'].includes(user.subscription?.status);

      toast.success(`Welcome back, ${firstName}!`);
      navigate(user.role === 'admin' ? '/admin' : hasMembership ? '/dashboard' : '/subscribe');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthShell
      mode="login"
      footer={
        <>
          Do not have an account?
          <Link to="/register" className="text-link">Create one</Link>
        </>
      }
    >
      <div className="auth-card-head">
        <h2>Welcome back</h2>
        <p>Sign in to your GolfGives account.</p>
      </div>

      <form onSubmit={handle} className="auth-form">
        <div className="form-group">
          <label className="form-label">Email</label>
          <input
            type="email"
            placeholder="you@example.com"
            value={form.email}
            onChange={(e) => setForm({ ...form, email: e.target.value })}
            required
          />
        </div>

        <div className="form-group">
          <label className="form-label">Password</label>
          <input
            type="password"
            placeholder="********"
            value={form.password}
            onChange={(e) => setForm({ ...form, password: e.target.value })}
            required
          />
        </div>

        <button type="submit" className="btn btn-primary auth-submit" disabled={loading}>
          {loading ? 'Signing in...' : 'Sign in'}
        </button>
      </form>
    </AuthShell>
  );
}

export function RegisterPage() {
  const [form, setForm] = useState({ name: '', email: '', password: '' });
  const [loading, setLoading] = useState(false);
  const { register } = useAuth();
  const navigate = useNavigate();

  const handle = async (e) => {
    e.preventDefault();

    if (form.password.length < 6) {
      return toast.error('Password must be at least 6 characters');
    }

    setLoading(true);

    try {
      await register(form.name, form.email, form.password);
      toast.success('Account created! Choose a paid plan or start free.');
      navigate('/subscribe');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Registration failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthShell
      mode="register"
      footer={
        <>
          Already have an account?
          <Link to="/login" className="text-link">Sign in</Link>
        </>
      }
    >
      <div className="auth-card-head">
        <h2>Create your account</h2>
        <p>Join now and start with a free starter plan if you want.</p>
      </div>

      <form onSubmit={handle} className="auth-form">
        <div className="form-group">
          <label className="form-label">Full name</label>
          <input
            placeholder="John Smith"
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
            required
          />
        </div>

        <div className="form-group">
          <label className="form-label">Email</label>
          <input
            type="email"
            placeholder="you@example.com"
            value={form.email}
            onChange={(e) => setForm({ ...form, email: e.target.value })}
            required
          />
        </div>

        <div className="form-group">
          <label className="form-label">Password</label>
          <input
            type="password"
            placeholder="Minimum 6 characters"
            value={form.password}
            onChange={(e) => setForm({ ...form, password: e.target.value })}
            required
          />
        </div>

        <button type="submit" className="btn btn-primary auth-submit" disabled={loading}>
          {loading ? 'Creating account...' : 'Create account'}
        </button>
      </form>
    </AuthShell>
  );
}
