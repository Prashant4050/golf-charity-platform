import { Link, useLocation } from 'react-router-dom';

const links = [
  { to: '/admin', label: '📊 Dashboard', exact: true },
  { to: '/admin/users', label: '👥 Users' },
  { to: '/admin/draws', label: '🎲 Draws' },
  { to: '/admin/charities', label: '💚 Charities' },
  { to: '/admin/winners', label: '🏆 Winners' },
];

export default function AdminLayout({ children, title }) {
  const location = useLocation();

  return (
    <div style={{ display: 'flex', minHeight: 'calc(100vh - 62px)' }}>
      {/* Sidebar */}
      <aside style={{ width: 220, background: '#111a14', borderRight: '1px solid #2d4a35', padding: '1.5rem 1rem', flexShrink: 0 }}>
        <div style={{ fontSize: '0.75rem', color: '#4b7a5a', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '1rem', padding: '0 0.5rem' }}>Admin Panel</div>
        <nav style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
          {links.map(l => {
            const active = l.exact ? location.pathname === l.to : location.pathname.startsWith(l.to);
            return (
              <Link key={l.to} to={l.to} style={{ display: 'block', padding: '8px 12px', borderRadius: 8, fontSize: '0.88rem', color: active ? '#4ade80' : '#86efac', background: active ? 'rgba(74,222,128,0.1)' : 'transparent', textDecoration: 'none', transition: 'all 0.15s', fontWeight: active ? 600 : 400 }}>
                {l.label}
              </Link>
            );
          })}
        </nav>
      </aside>

      {/* Content */}
      <main style={{ flex: 1, padding: '2rem', overflow: 'auto', minWidth: 0 }}>
        {title && <h1 style={{ fontSize: '1.6rem', marginBottom: '1.5rem' }}>{title}</h1>}
        {children}
      </main>
    </div>
  );
}