export default function SectionHeader({ title, sub, action }) {
  return (
    <div style={{
      display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start',
      marginBottom: '16px', flexWrap: 'wrap', gap: '8px',
    }}>
      <div>
        <h2 style={{ margin: 0, fontSize: '16px', fontWeight: 700, color: '#1a202c' }}>{title}</h2>
        {sub && <p style={{ margin: '2px 0 0', fontSize: '13px', color: '#718096' }}>{sub}</p>}
      </div>
      {action && <div>{action}</div>}
    </div>
  );
}
