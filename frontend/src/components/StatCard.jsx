export default function StatCard({ title, value, sub, color, icon, bg }) {
  return (
    <div style={{
      background: bg || '#fff',
      borderRadius: '10px',
      padding: '20px',
      boxShadow: '0 1px 4px rgba(0,0,0,0.08)',
      borderTop: `3px solid ${color || '#097C87'}`,
      display: 'flex',
      flexDirection: 'column',
      gap: '6px',
    }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div style={{ fontSize: '12px', color: '#718096', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.5px' }}>
          {title}
        </div>
        {icon && <span style={{ fontSize: '22px' }}>{icon}</span>}
      </div>
      <div style={{ fontSize: '28px', fontWeight: 700, color: color || '#097C87', lineHeight: 1 }}>
        {value ?? '—'}
      </div>
      {sub && <div style={{ fontSize: '12px', color: '#a0aec0' }}>{sub}</div>}
    </div>
  );
}
