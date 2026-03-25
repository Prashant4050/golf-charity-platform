import { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const styles = {
  nav: { position: 'sticky', top: 0, zIndex: 100, background: 'rgba(10,15,13,0.97)', backdropFilter: 'blur(12px)', borderBottom: '1px solid #2d4a35', height: 62 },
  inner: { maxWidth: 1100, margin: '0 auto', padding: '0 1.5rem', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'space-between' },
  logo: { fontFamily: "'Playfair Display', serif", fontSize: '1.35rem', fontWeight: 900, color: '#4ade80', letterSpacing: '-0.5px', textDecoration: 'none' },
  logoSpan: { color: '#f59e0b' },
  links: { display: 'flex', alignItems: 'center', gap: '0.25rem' },
  link: { color: '#86efac', padding: '6px 12px', borderRadius: 8, fontSize: '0.88rem', textDecoration: 'none', transition: 'all 0.2s', background: 'transparent', border: 'none', cursor: 'pointer', fontFamily: "'DM Sans', sans-serif" },
  linkActive: { background: '#1a2a1e', color: '#4ade80' },
  adminBadge: { background: 'rgba(245,158,11,0.15)', color: '#f59e0b', padding: '3px 8px', borderRadius: 6, fontSize: '0.7rem', fontWeight: 600, marginLeft: 4 },
  mobileBtn: { display: 'none', background: 'none', border: 'none', color: '#86efac', fontSize: '1.4rem', cursor: 'pointer' },
};

export default function Navbar() {
  const { user, logout } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const hasMembership = ['active', 'trialing'].includes(user?.subscription?.status);

  const isActive = (path) => location.pathname === path || location.pathname.startsWith(path + '/');

  const handleLogout = () => { logout(); navigate('/'); setOpen(false); };

  const NavLink = ({ to, children }) => (
    <Link to={to} style={{ ...styles.link, ...(isActive(to) ? styles.linkActive : {}) }} onClick={() => setOpen(false)}>
      {children}
    </Link>
  );

  return (
    <nav style={styles.nav}>
      <div style={styles.inner}>
        <Link to="/" style={styles.logo}>
          Golf<span style={styles.logoSpan}>Gives</span>
        </Link>

        <div style={{ ...styles.links, flexWrap: 'wrap' }}>
          <NavLink to="/charities">Charities</NavLink>
          <NavLink to="/draws">Draws</NavLink>
          {!user && <>
            <NavLink to="/login">Login</NavLink>
            <Link to="/register" className="btn btn-primary btn-sm" style={{ marginLeft: 8 }}>Join Now</Link>
          </>}
          {user && <>
            {hasMembership && <>
              <NavLink to="/dashboard">Dashboard</NavLink>
              <NavLink to="/scores">My Scores</NavLink>
            </>}
            {!hasMembership && <NavLink to="/subscribe">Subscribe</NavLink>}
            {user.subscription?.plan === 'free' && <NavLink to="/subscribe">Upgrade</NavLink>}
            {user.role === 'admin' && (
              <NavLink to="/admin">
                Admin <span style={styles.adminBadge}>ADMIN</span>
              </NavLink>
            )}
            <button style={{ ...styles.link, color: '#ef4444' }} onClick={handleLogout}>Logout</button>
          </>}
        </div>
      </div>
    </nav>
  );
}
