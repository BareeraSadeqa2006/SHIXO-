export default function Navbar({ onMenuToggle }) {
  return (
    <header style={{
      background: '#097C87',
      color: 'white',
      padding: '0 24px',
      height: '60px',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      boxShadow: '0 2px 8px rgba(0,0,0,0.15)',
      flexShrink: 0,
      zIndex: 100,
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
        <button
          onClick={onMenuToggle}
          style={{
            background: 'none', border: 'none', color: 'white',
            fontSize: '22px', cursor: 'pointer', lineHeight: 1, padding: '4px',
          }}
          title="Toggle Sidebar"
        >
          ☰
        </button>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <div style={{
            width: '42px', height: '42px', background: '#ffffff',
            borderRadius: '10px', display: 'flex', alignItems: 'center',
            justifyContent: 'center', overflow: 'hidden',
          }}>
            <img src="/favicon2.jpeg" alt="Logo" style={{ width: 'auto', height: '32px', objectFit: 'contain' }} />
          </div>
          <div>
            <div style={{ fontWeight: 700, fontSize: '15px', letterSpacing: '0.3px' }}>
              SHIXO
            </div>
            <div style={{ fontSize: '11px', opacity: 0.85, letterSpacing: '0.5px' }}>
              Transforming Teacher Management with AI
            </div>
          </div>
        </div>
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: '20px', fontSize: '13px', opacity: 0.9 }}>
        <span>{new Date().toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}</span>
        <div style={{
          background: '#23CED9', borderRadius: '20px', padding: '4px 14px',
          fontSize: '12px', fontWeight: 600, color: '#fff',
        }}>
          Admin Panel
        </div>
      </div>
    </header>
  );
}
