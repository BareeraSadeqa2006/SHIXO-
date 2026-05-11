import { useState, useEffect, useCallback } from 'react';
import { getMeoDashboard, approveTransfer, rejectTransfer } from '../api';
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend
} from 'recharts';

const COLORS = ['#0B3C5D', '#328CC1', '#2E8B57', '#D4AF37', '#C0392B', '#154872', '#4CA3D8', '#8B5CF6'];
const REJECT_REASONS = [
  'No vacancy available at requested school',
  'Current school has teacher shortage',
  'Low priority score - does not meet threshold',
  'Minimum service period not completed',
  'Subject requirement conflict at requested school',
  'Policy constraints - transfer freeze period active',
];

const tabs = ['Overview', 'Requests', 'Schools', 'Analytics'];

export default function MEODashboard({ user, onLogout }) {
  const [activeTab, setActiveTab] = useState('Overview');
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [rejectModal, setRejectModal] = useState(null);
  const [rejectReason, setRejectReason] = useState('');
  const [actionLoading, setActionLoading] = useState('');
  const [sidebarOpen, setSidebarOpen] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await getMeoDashboard(user.user_id);
      setData(res.data);
    } catch (err) {
      console.error(err);
    }
    setLoading(false);
  }, [user.user_id]);

  useEffect(() => {
    let ignore = false;
    getMeoDashboard(user.user_id)
      .then(res => { if (!ignore) { setData(res.data); setLoading(false); } })
      .catch(() => { if (!ignore) setLoading(false); });
    return () => { ignore = true; };
  }, [user.user_id]);

  const handleApprove = async (requestId) => {
    setActionLoading(requestId);
    try {
      await approveTransfer({ request_id: requestId, meo_id: user.user_id });
      load();
    } catch (err) {
      alert(err.response?.data?.detail || 'Failed to approve');
    }
    setActionLoading('');
  };

  const handleReject = async () => {
    if (!rejectModal || !rejectReason) return;
    setActionLoading(rejectModal);
    try {
      await rejectTransfer({ request_id: rejectModal, meo_id: user.user_id, rejection_reason: rejectReason });
      setRejectModal(null);
      setRejectReason('');
      load();
    } catch (err) {
      alert(err.response?.data?.detail || 'Failed to reject');
    }
    setActionLoading('');
  };

  if (loading || !data) {
    return (
      <div className="min-h-screen bg-soft-white flex items-center justify-center">
        <div className="text-center">
          <div className="w-8 h-8 border-3 border-teal border-t-transparent rounded-full animate-spin mx-auto mb-3"></div>
          <p className="text-sm text-gray-500">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  const subjectData = Object.entries(data.subject_distribution || {}).map(([k, v]) => ({ name: k, value: v }));
  const schoolStatusData = [
    { name: 'Shortage', value: data.shortage_schools, color: '#C0392B' },
    { name: 'Surplus', value: data.surplus_schools, color: '#2E8B57' },
    { name: 'Balanced', value: data.total_schools - data.shortage_schools - data.surplus_schools, color: '#328CC1' },
  ];

  return (
    <div className="min-h-screen bg-soft-white flex">
      {/* Sidebar */}
      <aside className={`bg-navy text-white flex-shrink-0 transition-all duration-300 ${sidebarOpen ? 'w-56' : 'w-16'}`}>
        <div className="p-4 border-b border-white/10 flex items-center justify-between">
          {sidebarOpen && <span className="font-bold text-sm">SHIXO MEO</span>}
          <button onClick={() => setSidebarOpen(!sidebarOpen)} className="text-light-gray hover:text-white p-1">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          </button>
        </div>
        <nav className="py-4 space-y-1 px-2">
          {tabs.map(t => (
            <button
              key={t}
              onClick={() => setActiveTab(t)}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-colors ${
                activeTab === t ? 'bg-teal text-white' : 'text-light-gray hover:bg-white/5'
              }`}
            >
              {t === 'Overview' && <svg className="w-4 h-4 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 5a1 1 0 011-1h14a1 1 0 011 1v2a1 1 0 01-1 1H5a1 1 0 01-1-1V5zM4 13a1 1 0 011-1h6a1 1 0 011 1v6a1 1 0 01-1 1H5a1 1 0 01-1-1v-6zM16 13a1 1 0 011-1h2a1 1 0 011 1v6a1 1 0 01-1 1h-2a1 1 0 01-1-1v-6z" /></svg>}
              {t === 'Requests' && <svg className="w-4 h-4 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>}
              {t === 'Schools' && <svg className="w-4 h-4 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" /></svg>}
              {t === 'Analytics' && <svg className="w-4 h-4 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" /></svg>}
              {sidebarOpen && (
                <span className="flex-1 text-left">
                  {t}
                  {t === 'Requests' && data.pending_requests?.length > 0 && (
                    <span className="ml-2 bg-gold text-navy text-xs rounded-full px-1.5 py-0.5 font-bold">{data.pending_requests.length}</span>
                  )}
                </span>
              )}
            </button>
          ))}
        </nav>
        <div className="absolute bottom-0 left-0 p-4">
          <button onClick={onLogout} className="text-xs text-light-gray hover:text-white flex items-center gap-2">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
            </svg>
            {sidebarOpen && 'Logout'}
          </button>
        </div>
      </aside>

      {/* Main */}
      <div className="flex-1 flex flex-col min-h-screen">
        <header className="bg-white border-b border-light-gray px-6 py-3 flex items-center justify-between">
          <div>
            <h1 className="text-lg font-bold text-navy">MEO Dashboard</h1>
            <p className="text-xs text-gray-500">Mandal Education Officer — {data.mandal}</p>
          </div>
          <div className="flex items-center gap-3">
            <span className="text-xs bg-teal/10 text-teal px-3 py-1 rounded-full font-medium">{user.user_id}</span>
            <span className="text-xs bg-gold/10 text-gold px-3 py-1 rounded-full font-medium">{data.mandal}</span>
          </div>
        </header>

        <main className="flex-1 overflow-y-auto p-6 scrollbar-thin">
          {/* Overview */}
          {activeTab === 'Overview' && (
            <div className="space-y-6">
              {/* Stat cards */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {[
                  { label: 'Total Teachers', value: data.total_teachers, color: 'text-navy', bg: 'bg-navy/5' },
                  { label: 'Total Schools', value: data.total_schools, color: 'text-teal', bg: 'bg-teal/5' },
                  { label: 'Shortage Schools', value: data.shortage_schools, color: 'text-alert', bg: 'bg-alert/5' },
                  { label: 'Pending Requests', value: data.pending_requests?.length || 0, color: 'text-gold', bg: 'bg-gold/5' },
                ].map((s) => (
                  <div key={s.label} className={`${s.bg} rounded-xl border border-light-gray p-5`}>
                    <p className={`text-3xl font-bold ${s.color}`}>{s.value}</p>
                    <p className="text-xs text-gray-500 mt-1">{s.label}</p>
                  </div>
                ))}
              </div>

              <div className="grid md:grid-cols-2 gap-6">
                {/* School status pie */}
                <div className="bg-white rounded-xl border border-light-gray p-6">
                  <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-4">School Status Distribution</h3>
                  <div className="h-56">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie data={schoolStatusData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={80} label>
                          {schoolStatusData.map((entry, i) => (
                            <Cell key={i} fill={entry.color} />
                          ))}
                        </Pie>
                        <Tooltip />
                        <Legend />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                </div>

                {/* Subject dist bar */}
                <div className="bg-white rounded-xl border border-light-gray p-6">
                  <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-4">Subject-wise Teacher Distribution</h3>
                  <div className="h-56">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={subjectData}>
                        <XAxis dataKey="name" tick={{ fontSize: 10 }} angle={-45} textAnchor="end" height={60} />
                        <YAxis tick={{ fontSize: 11 }} />
                        <Tooltip />
                        <Bar dataKey="value" fill="#328CC1" radius={[4, 4, 0, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              </div>

              {/* Quick transfer summary */}
              <div className="grid md:grid-cols-3 gap-4">
                <div className="bg-gold/5 rounded-xl border border-gold/20 p-5 text-center">
                  <p className="text-3xl font-bold text-gold">{data.pending_requests?.length || 0}</p>
                  <p className="text-sm text-gray-500">Pending</p>
                </div>
                <div className="bg-success/5 rounded-xl border border-success/20 p-5 text-center">
                  <p className="text-3xl font-bold text-success">{data.approved_requests?.length || 0}</p>
                  <p className="text-sm text-gray-500">Approved</p>
                </div>
                <div className="bg-alert/5 rounded-xl border border-alert/20 p-5 text-center">
                  <p className="text-3xl font-bold text-alert">{data.rejected_requests?.length || 0}</p>
                  <p className="text-sm text-gray-500">Rejected</p>
                </div>
              </div>

              <div className="bg-white rounded-xl border border-light-gray p-5">
                <p className="text-sm text-gray-500"><span className="font-semibold text-navy">Avg Student-Teacher Ratio:</span> {data.avg_student_teacher_ratio}</p>
              </div>
            </div>
          )}

          {/* Requests */}
          {activeTab === 'Requests' && (
            <div className="space-y-6">
              {/* Pending */}
              <div className="bg-white rounded-xl border border-light-gray p-6">
                <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-4">
                  Pending Transfer Requests ({data.pending_requests?.length || 0})
                </h3>
                {data.pending_requests?.length === 0 ? (
                  <p className="text-sm text-gray-400 text-center py-6">No pending requests</p>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="bg-soft-white">
                          <th className="text-left p-3 font-medium text-gray-500">Request ID</th>
                          <th className="text-left p-3 font-medium text-gray-500">Teacher</th>
                          <th className="text-left p-3 font-medium text-gray-500">From</th>
                          <th className="text-left p-3 font-medium text-gray-500">To</th>
                          <th className="text-center p-3 font-medium text-gray-500">Priority</th>
                          <th className="text-left p-3 font-medium text-gray-500">Reason</th>
                          <th className="text-center p-3 font-medium text-gray-500">Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {data.pending_requests.map((r) => (
                          <tr key={r.request_id} className="border-t border-light-gray hover:bg-soft-white">
                            <td className="p-3 font-mono text-xs">{r.request_id}</td>
                            <td className="p-3 font-medium">{r.teacher_id}</td>
                            <td className="p-3 text-gray-500 text-xs">{r.current_school}</td>
                            <td className="p-3 text-gray-500 text-xs">{r.requested_school}</td>
                            <td className="p-3 text-center">
                              <span className={`font-bold ${r.priority_score >= 60 ? 'text-success' : r.priority_score >= 40 ? 'text-gold' : 'text-alert'}`}>
                                {r.priority_score}
                              </span>
                            </td>
                            <td className="p-3 text-xs text-gray-500 max-w-[150px] truncate">{r.transfer_reason}</td>
                            <td className="p-3 text-center">
                              <div className="flex items-center gap-2 justify-center">
                                <button
                                  onClick={() => handleApprove(r.request_id)}
                                  disabled={actionLoading === r.request_id}
                                  className="bg-success hover:bg-success/80 text-white px-3 py-1.5 rounded text-xs font-medium transition-colors disabled:opacity-50"
                                >
                                  Approve
                                </button>
                                <button
                                  onClick={() => { setRejectModal(r.request_id); setRejectReason(''); }}
                                  disabled={actionLoading === r.request_id}
                                  className="bg-alert hover:bg-alert/80 text-white px-3 py-1.5 rounded text-xs font-medium transition-colors disabled:opacity-50"
                                >
                                  Reject
                                </button>
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>

              {/* Approved/Rejected */}
              {['approved_requests', 'rejected_requests'].map((key) => (
                <div key={key} className="bg-white rounded-xl border border-light-gray p-6">
                  <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-4">
                    {key === 'approved_requests' ? 'Approved' : 'Rejected'} Requests ({data[key]?.length || 0})
                  </h3>
                  {data[key]?.length > 0 ? (
                    <div className="overflow-x-auto">
                      <table className="w-full text-sm">
                        <thead>
                          <tr className="bg-soft-white">
                            <th className="text-left p-3 font-medium text-gray-500">Request ID</th>
                            <th className="text-left p-3 font-medium text-gray-500">Teacher</th>
                            <th className="text-left p-3 font-medium text-gray-500">From → To</th>
                            <th className="text-center p-3 font-medium text-gray-500">Priority</th>
                            <th className="text-left p-3 font-medium text-gray-500">Date</th>
                            {key === 'rejected_requests' && <th className="text-left p-3 font-medium text-gray-500">Reason</th>}
                          </tr>
                        </thead>
                        <tbody>
                          {data[key].map((r) => (
                            <tr key={r.request_id} className="border-t border-light-gray">
                              <td className="p-3 font-mono text-xs">{r.request_id}</td>
                              <td className="p-3">{r.teacher_id}</td>
                              <td className="p-3 text-xs text-gray-500">{r.current_school} → {r.requested_school}</td>
                              <td className="p-3 text-center font-bold text-teal">{r.priority_score}</td>
                              <td className="p-3 text-xs">{r.approval_date}</td>
                              {key === 'rejected_requests' && <td className="p-3 text-xs text-alert">{r.rejection_reason}</td>}
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  ) : (
                    <p className="text-sm text-gray-400 text-center py-4">None</p>
                  )}
                </div>
              ))}
            </div>
          )}

          {/* Schools */}
          {activeTab === 'Schools' && (
            <div className="bg-white rounded-xl border border-light-gray p-6">
              <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-4">
                Schools in {data.mandal} ({data.schools?.length || 0})
              </h3>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="bg-soft-white">
                      <th className="text-left p-3 font-medium text-gray-500">School ID</th>
                      <th className="text-left p-3 font-medium text-gray-500">Name</th>
                      <th className="text-center p-3 font-medium text-gray-500">Students</th>
                      <th className="text-center p-3 font-medium text-gray-500">Current</th>
                      <th className="text-center p-3 font-medium text-gray-500">Required</th>
                      <th className="text-center p-3 font-medium text-gray-500">Ratio</th>
                      <th className="text-center p-3 font-medium text-gray-500">Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {data.schools?.map((s) => {
                      const diff = s.current_teacher_count - s.required_teacher_count;
                      return (
                        <tr key={s.school_id} className="border-t border-light-gray hover:bg-soft-white">
                          <td className="p-3 font-mono text-xs">{s.school_id}</td>
                          <td className="p-3 font-medium">{s.school_name}</td>
                          <td className="p-3 text-center">{s.student_strength}</td>
                          <td className="p-3 text-center">{s.current_teacher_count}</td>
                          <td className="p-3 text-center">{s.required_teacher_count}</td>
                          <td className="p-3 text-center">{s.student_teacher_ratio}</td>
                          <td className="p-3 text-center">
                            <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                              diff < 0 ? 'bg-alert/10 text-alert' : diff > 0 ? 'bg-success/10 text-success' : 'bg-teal/10 text-teal'
                            }`}>
                              {diff < 0 ? `Shortage (${Math.abs(diff)})` : diff > 0 ? `Surplus (+${diff})` : 'Balanced'}
                            </span>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Analytics */}
          {activeTab === 'Analytics' && (
            <div className="space-y-6">
              <div className="grid md:grid-cols-2 gap-6">
                {/* Student-Teacher ratio distribution */}
                <div className="bg-white rounded-xl border border-light-gray p-6">
                  <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-4">Student-Teacher Ratio by School</h3>
                  <div className="h-64">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={data.schools?.slice(0, 15).map(s => ({
                        name: s.school_id, ratio: s.student_teacher_ratio
                      }))}>
                        <XAxis dataKey="name" tick={{ fontSize: 9 }} angle={-45} textAnchor="end" height={50} />
                        <YAxis tick={{ fontSize: 11 }} />
                        <Tooltip />
                        <Bar dataKey="ratio" fill="#0B3C5D" radius={[4, 4, 0, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </div>

                {/* Teacher distribution */}
                <div className="bg-white rounded-xl border border-light-gray p-6">
                  <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-4">Subject Distribution</h3>
                  <div className="h-64">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie data={subjectData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={90}>
                          {subjectData.map((_, i) => (
                            <Cell key={i} fill={COLORS[i % COLORS.length]} />
                          ))}
                        </Pie>
                        <Tooltip />
                        <Legend wrapperStyle={{ fontSize: 11 }} />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              </div>

              {/* Shortage/Surplus table */}
              <div className="bg-white rounded-xl border border-light-gray p-6">
                <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-4">Shortage & Surplus Analysis</h3>
                <div className="grid md:grid-cols-2 gap-6">
                  <div>
                    <p className="text-xs font-semibold text-alert mb-2">Top Shortage Schools</p>
                    {data.schools?.filter(s => s.current_teacher_count < s.required_teacher_count)
                      .sort((a, b) => (a.current_teacher_count - a.required_teacher_count) - (b.current_teacher_count - b.required_teacher_count))
                      .slice(0, 5)
                      .map(s => (
                        <div key={s.school_id} className="flex justify-between text-sm py-1.5 border-b border-light-gray">
                          <span className="text-gray-600">{s.school_name}</span>
                          <span className="text-alert font-medium">-{s.required_teacher_count - s.current_teacher_count}</span>
                        </div>
                      ))}
                  </div>
                  <div>
                    <p className="text-xs font-semibold text-success mb-2">Top Surplus Schools</p>
                    {data.schools?.filter(s => s.current_teacher_count > s.required_teacher_count)
                      .sort((a, b) => (b.current_teacher_count - b.required_teacher_count) - (a.current_teacher_count - a.required_teacher_count))
                      .slice(0, 5)
                      .map(s => (
                        <div key={s.school_id} className="flex justify-between text-sm py-1.5 border-b border-light-gray">
                          <span className="text-gray-600">{s.school_name}</span>
                          <span className="text-success font-medium">+{s.current_teacher_count - s.required_teacher_count}</span>
                        </div>
                      ))}
                  </div>
                </div>
              </div>
            </div>
          )}
        </main>
      </div>

      {/* Reject Modal */}
      {rejectModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl max-w-md w-full p-6">
            <h3 className="text-lg font-bold text-navy mb-4">Reject Transfer Request</h3>
            <p className="text-sm text-gray-500 mb-4">Request: {rejectModal}</p>
            <div className="space-y-3 mb-4">
              {REJECT_REASONS.map((r) => (
                <label key={r} className="flex items-start gap-2 cursor-pointer">
                  <input
                    type="radio"
                    name="reject_reason"
                    value={r}
                    checked={rejectReason === r}
                    onChange={() => setRejectReason(r)}
                    className="mt-0.5"
                  />
                  <span className="text-sm text-gray-600">{r}</span>
                </label>
              ))}
            </div>
            <div className="flex gap-3">
              <button
                onClick={handleReject}
                disabled={!rejectReason}
                className="flex-1 bg-alert hover:bg-alert/80 text-white py-2.5 rounded-lg text-sm font-medium disabled:opacity-50"
              >
                Confirm Rejection
              </button>
              <button
                onClick={() => setRejectModal(null)}
                className="flex-1 bg-light-gray hover:bg-gray-200 text-gray-700 py-2.5 rounded-lg text-sm font-medium"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
