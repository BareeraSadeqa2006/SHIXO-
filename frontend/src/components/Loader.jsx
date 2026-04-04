export default function Loader({ text = 'Loading data...' }) {
  return (
    <div style={{
      display: 'flex', flexDirection: 'column', alignItems: 'center',
      justifyContent: 'center', padding: '60px', gap: '16px',
    }}>
      <div style={{
        width: '40px', height: '40px',
        border: '4px solid #e2e8f0',
        borderTop: '4px solid #097C87',
        borderRadius: '50%',
        animation: 'spin 0.8s linear infinite',
      }} />
      <div style={{ color: '#718096', fontSize: '14px' }}>{text}</div>
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}
