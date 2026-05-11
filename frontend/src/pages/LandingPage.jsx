import { Link } from 'react-router-dom';

const features = [
  {
    title: 'AI Transfer Prediction',
    desc: 'Machine learning algorithms analyze service records, medical conditions, and policy criteria to recommend optimal transfers.',
    icon: (
      <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9.75 3.104v5.714a2.25 2.25 0 01-.659 1.591L5 14.5M9.75 3.104c-.251.023-.501.05-.75.082m.75-.082a24.301 24.301 0 014.5 0m0 0v5.714a2.25 2.25 0 00.659 1.591L19 14.5M14.25 3.104c.251.023.501.05.75.082M19 14.5l-2.47-2.47" />
      </svg>
    ),
  },
  {
    title: 'Smart Workforce Analytics',
    desc: 'Real-time dashboards tracking teacher distribution, shortage areas, student-teacher ratios across all mandals.',
    icon: (
      <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 13.125C3 12.504 3.504 12 4.125 12h2.25c.621 0 1.125.504 1.125 1.125v6.75C7.5 20.496 6.996 21 6.375 21h-2.25A1.125 1.125 0 013 19.875v-6.75zM9.75 8.625c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125v11.25c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V8.625zM16.5 4.125c0-.621.504-1.125 1.125-1.125h2.25C20.496 3 21 3.504 21 4.125v15.75c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V4.125z" />
      </svg>
    ),
  },
  {
    title: 'Automated Workflows',
    desc: 'End-to-end transfer management from application to approval with automatic database synchronization.',
    icon: (
      <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19.5 12c0-1.232-.046-2.453-.138-3.662a4.006 4.006 0 00-3.7-3.7 48.678 48.678 0 00-7.324 0 4.006 4.006 0 00-3.7 3.7c-.017.22-.032.441-.046.662M19.5 12l3-3m-3 3l-3-3m-12 3c0 1.232.046 2.453.138 3.662a4.006 4.006 0 003.7 3.7 48.656 48.656 0 007.324 0 4.006 4.006 0 003.7-3.7c.017-.22.032-.441.046-.662M4.5 12l3 3m-3-3l-3 3" />
      </svg>
    ),
  },
  {
    title: 'Role-Based Governance',
    desc: 'Dedicated portals for Teachers and Mandal Education Officers with secure access control.',
    icon: (
      <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12.75L11.25 15 15 9.75m-3-7.036A11.959 11.959 0 013.598 6 11.99 11.99 0 003 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285z" />
      </svg>
    ),
  },
  {
    title: 'School Allocation Engine',
    desc: 'Intelligent school recommendations based on vacancy, shortage, student-teacher ratio, and subject requirements.',
    icon: (
      <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 21v-8.25M15.75 21v-8.25M8.25 21v-8.25M3 9l9-6 9 6m-1.5 12V10.332A48.36 48.36 0 0012 9.75c-2.551 0-5.056.2-7.5.582V21" />
      </svg>
    ),
  },
  {
    title: 'Transfer Order Generation',
    desc: 'Automatic generation of official government transfer orders upon approval, ready for download.',
    icon: (
      <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" />
      </svg>
    ),
  },
];

const stats = [
  { label: 'Schools Managed', value: '500+' },
  { label: 'Teachers Tracked', value: '10,000+' },
  { label: 'Mandals Covered', value: '20' },
  { label: 'AI Accuracy', value: '95%+' },
];

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-soft-white">
      {/* Header */}
      <header className="bg-navy text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-gold rounded-lg flex items-center justify-center font-bold text-navy text-lg">S</div>
              <div>
                <h1 className="text-xl font-bold tracking-wide">SHIXO</h1>
                <p className="text-xs text-teal-light opacity-80">Government Education Portal</p>
              </div>
            </div>
            <nav className="hidden md:flex items-center gap-6">
              <a href="#features" className="text-sm text-light-gray hover:text-white transition-colors">Features</a>
              <a href="#analytics" className="text-sm text-light-gray hover:text-white transition-colors">Analytics</a>
              <a href="#about" className="text-sm text-light-gray hover:text-white transition-colors">About</a>
              <Link to="/login" className="bg-teal hover:bg-teal-light px-5 py-2 rounded text-sm font-medium transition-colors">
                Login Portal
              </Link>
            </nav>
            <Link to="/login" className="md:hidden bg-teal hover:bg-teal-light px-4 py-2 rounded text-sm font-medium">
              Login
            </Link>
          </div>
        </div>
      </header>

      {/* Hero */}
      <section className="bg-gradient-to-br from-navy via-navy-light to-teal text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 lg:py-28">
          <div className="max-w-3xl">
            <div className="inline-flex items-center gap-2 bg-white/10 backdrop-blur-sm rounded-full px-4 py-1.5 mb-6">
              <span className="w-2 h-2 bg-success rounded-full"></span>
              <span className="text-xs font-medium">AI-Powered Governance Platform</span>
            </div>
            <h2 className="text-4xl lg:text-5xl font-bold leading-tight mb-6">
              Smart Teacher Transfer &<br />
              <span className="text-gold">Workforce Analytics</span> Platform
            </h2>
            <p className="text-lg text-light-gray mb-8 max-w-2xl leading-relaxed">
              Transparent, data-driven governance for managing government teacher transfers,
              workforce allocation, and education workforce monitoring across districts and mandals.
            </p>
            <div className="flex flex-wrap gap-4">
              <Link to="/login" className="bg-gold hover:bg-yellow-500 text-navy px-8 py-3 rounded-lg font-semibold text-sm transition-colors shadow-lg">
                Access Portal
              </Link>
              <a href="#features" className="border border-white/30 hover:bg-white/10 px-8 py-3 rounded-lg font-medium text-sm transition-colors">
                Explore Features
              </a>
            </div>
          </div>
        </div>
      </section>

      {/* Stats Bar */}
      <section className="bg-white border-b border-light-gray">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            {stats.map((s) => (
              <div key={s.label} className="text-center">
                <div className="text-3xl font-bold text-navy">{s.value}</div>
                <div className="text-sm text-gray-500 mt-1">{s.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features */}
      <section id="features" className="py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-14">
            <h3 className="text-3xl font-bold text-navy mb-3">Platform Capabilities</h3>
            <p className="text-gray-500 max-w-xl mx-auto">
              Comprehensive tools for transparent and efficient teacher workforce management
            </p>
          </div>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {features.map((f) => (
              <div key={f.title} className="bg-white rounded-xl p-6 border border-light-gray hover:shadow-lg hover:border-teal/30 transition-all group">
                <div className="w-12 h-12 bg-teal/10 text-teal rounded-lg flex items-center justify-center mb-4 group-hover:bg-teal group-hover:text-white transition-colors">
                  {f.icon}
                </div>
                <h4 className="text-lg font-semibold text-navy mb-2">{f.title}</h4>
                <p className="text-sm text-gray-500 leading-relaxed">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* AI Section */}
      <section id="analytics" className="py-20 bg-navy text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div>
              <h3 className="text-3xl font-bold mb-4">AI-Based Government<br />Teacher Management System</h3>
              <p className="text-light-gray mb-6 leading-relaxed">
                Leveraging Random Forest machine learning algorithms trained on comprehensive
                teacher service data to predict transfer eligibility, calculate priority scores,
                and recommend optimal school placements.
              </p>
              <div className="space-y-4">
                {[
                  'Explainable AI — understand why transfers are recommended',
                  'Priority scoring based on service years, medical needs, and policy criteria',
                  'Smart school allocation using vacancy and shortage analysis',
                  'Real-time workforce distribution monitoring'
                ].map((item) => (
                  <div key={item} className="flex items-start gap-3">
                    <svg className="w-5 h-5 text-success mt-0.5 shrink-0" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.857-9.809a.75.75 0 00-1.214-.882l-3.483 4.79-1.88-1.88a.75.75 0 10-1.06 1.061l2.5 2.5a.75.75 0 001.137-.089l4-5.5z" clipRule="evenodd" />
                    </svg>
                    <span className="text-sm text-light-gray">{item}</span>
                  </div>
                ))}
              </div>
            </div>
            <div className="bg-white/5 backdrop-blur-sm rounded-xl p-8 border border-white/10">
              <div className="text-sm font-mono text-teal-light mb-4">Transfer Priority Scoring</div>
              <div className="space-y-3">
                {[
                  { label: 'Transfer Request Filed', score: '+30' },
                  { label: 'Medical Condition', score: '+25' },
                  { label: 'Service Years >= 5', score: '+20' },
                  { label: 'Spouse Distance > 200km', score: '+20' },
                  { label: 'Rural Service >= 3 years', score: '+15' },
                  { label: 'Promotion Due', score: '+10' },
                  { label: 'Long Service >= 10 years', score: '+10' },
                ].map((item) => (
                  <div key={item.label} className="flex justify-between items-center bg-white/5 rounded-lg px-4 py-2.5">
                    <span className="text-sm text-light-gray">{item.label}</span>
                    <span className="text-sm font-mono font-bold text-gold">{item.score}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h3 className="text-3xl font-bold text-navy mb-4">Ready to Access the Portal?</h3>
          <p className="text-gray-500 mb-8 max-w-lg mx-auto">
            Login as a Teacher to check transfer eligibility or as a Mandal Education Officer to manage workforce.
          </p>
          <Link to="/login" className="inline-block bg-navy hover:bg-navy-light text-white px-10 py-3.5 rounded-lg font-semibold text-sm transition-colors shadow-lg">
            Login to SHIXO Portal
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer id="about" className="bg-navy text-white py-12 border-t border-white/10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid md:grid-cols-3 gap-8">
            <div>
              <div className="flex items-center gap-3 mb-4">
                <div className="w-8 h-8 bg-gold rounded flex items-center justify-center font-bold text-navy text-sm">S</div>
                <span className="font-bold text-lg">SHIXO</span>
              </div>
              <p className="text-sm text-light-gray leading-relaxed">
                AI-Based Government Teacher Transfer & Workforce Management Platform.
                Enabling transparent, data-driven governance in education.
              </p>
            </div>
            <div>
              <h4 className="font-semibold mb-3">Quick Links</h4>
              <div className="space-y-2 text-sm text-light-gray">
                <a href="#features" className="block hover:text-white">Features</a>
                <a href="#analytics" className="block hover:text-white">AI Analytics</a>
                <Link to="/login" className="block hover:text-white">Portal Login</Link>
              </div>
            </div>
            <div>
              <h4 className="font-semibold mb-3">Contact</h4>
              <div className="space-y-2 text-sm text-light-gray">
                <p>Department of School Education</p>
                <p>Government of Telangana</p>
                <p>support@shixo.gov.in</p>
              </div>
            </div>
          </div>
          <div className="border-t border-white/10 mt-8 pt-8 text-center text-xs text-light-gray">
            &copy; {new Date().getFullYear()} SHIXO — Government Teacher Management Platform. All rights reserved.
          </div>
        </div>
      </footer>
    </div>
  );
}
