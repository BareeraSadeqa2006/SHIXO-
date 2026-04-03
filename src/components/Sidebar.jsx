export default function Sidebar({ tabs, activeTab, onTabChange, isOpen }) {
  if (!isOpen) return null;

  return (
    <aside style={{
      width: '220px',
      background: '#fff',
      borderRight: '1px solid #e2e8f0',
      flexShrink: 0,
      display: 'flex',
      flexDirection: 'column',
      boxShadow: '2px 0 8px rgba(0,0,0,0.05)',
    }}>
      <nav style={{ padding: '16px 0', flex: 1 }}>
        <div style={{ padding: '8px 16px 12px', fontSize: '11px', fontWeight: 700,
          color: '#718096', letterSpacing: '1px', textTransform: 'uppercase' }}>
          Navigation
        </div>
        {tabs.map(tab => (
          <button
            key={tab.id}
            onClick={() => onTabChange(tab.id)}
            style={{
              width: '100%',
              display: 'flex',
              alignItems: 'center',
              gap: '12px',
              padding: '12px 20px',
              border: 'none',
              borderLeft: activeTab === tab.id ? '4px solid #097C87' : '4px solid transparent',
              background: activeTab === tab.id ? 'rgba(9,124,135,0.08)' : 'transparent',
              color: activeTab === tab.id ? '#097C87' : '#4a5568',
              fontWeight: activeTab === tab.id ? 700 : 500,
              fontSize: '13px',
              cursor: 'pointer',
              textAlign: 'left',
              transition: 'all 0.15s',
            }}
          >
            <span style={{ fontSize: '16px', width: '20px' }}>{tab.icon}</span>
            {tab.label}
          </button>
        ))}
      </nav>
      <div style={{
        padding: '16px',
        borderTop: '1px solid #e2e8f0',
        fontSize: '11px',
        color: '#a0aec0',
        textAlign: 'center',
      }}>
        <div style={{ marginBottom: '4px', fontWeight: 600, color: '#718096' }}>System Status</div>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}>
          <div style={{ width: '8px', height: '8px', background: '#48BB78', borderRadius: '50%' }} />
          All Systems Operational
        </div>
      </div>
    </aside>
  );
}
