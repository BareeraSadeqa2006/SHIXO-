import { useState } from 'react';
import Navbar from './components/Navbar';
import Sidebar from './components/Sidebar';
import Overview from './pages/Overview';
import TransferManagement from './pages/TransferManagement';
import TeacherAllocation from './pages/TeacherAllocation';
import WorkforceMonitoring from './pages/WorkforceMonitoring';

const TABS = [
  { id: 'overview', label: 'Overview', icon: '⊞' },
  { id: 'transfer', label: 'Transfer Management', icon: '⇄' },
  { id: 'allocation', label: 'Teacher Allocation', icon: '◎' },
  { id: 'workforce', label: 'Workforce Monitoring', icon: '≡' },
];

export default function App() {
  const [activeTab, setActiveTab] = useState('overview');
  const [sidebarOpen, setSidebarOpen] = useState(true);

  const renderPage = () => {
    switch (activeTab) {
      case 'overview': return <Overview />;
      case 'transfer': return <TransferManagement />;
      case 'allocation': return <TeacherAllocation />;
      case 'workforce': return <WorkforceMonitoring />;
      default: return <Overview />;
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100vh', overflow: 'hidden', background: '#f4f6f8' }}>
      <Navbar onMenuToggle={() => setSidebarOpen(p => !p)} />
      <div style={{ display: 'flex', flex: 1, overflow: 'hidden' }}>
        <Sidebar
          tabs={TABS}
          activeTab={activeTab}
          onTabChange={setActiveTab}
          isOpen={sidebarOpen}
        />
        <main style={{ flex: 1, overflowY: 'auto', padding: '24px' }}>
          {renderPage()}
        </main>
      </div>
    </div>
  );
}
