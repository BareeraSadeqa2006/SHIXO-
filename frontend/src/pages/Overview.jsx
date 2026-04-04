import { useEffect, useState } from 'react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend,
} from 'recharts';
import { getDashboardStats } from '../api';
import StatCard from '../components/StatCard';
import Loader from '../components/Loader';
import SectionHeader from '../components/SectionHeader';

const COLORS = ['#097C87', '#23CED9', '#A1CCA6', '#F9D779', '#FCA47C', '#6B7280', '#9333EA', '#EF4444'];

const card = (style = {}) => ({
  background: '#fff',
  borderRadius: '10px',
  padding: '20px',
  boxShadow: '0 1px 4px rgba(0,0,0,0.08)',
  ...style,
});

export default function Overview() {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const load = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await getDashboardStats();
      setStats(data);
    } catch (e) {
      setError('Failed to load dashboard data. Ensure the backend is running.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  if (loading) return <Loader text="Loading dashboard statistics..." />;
  if (error) return (
    <div style={{ padding: '40px', textAlign: 'center' }}>
      <div style={{ fontSize: '40px', marginBottom: '12px' }}>⚠️</div>
      <div style={{ color: '#e53e3e', marginBottom: '16px' }}>{error}</div>
      <button onClick={load} style={{
        background: '#097C87', color: '#fff', border: 'none', borderRadius: '6px',
        padding: '10px 20px', cursor: 'pointer', fontSize: '14px',
      }}>Retry</button>
    </div>
  );

  return (
    <div>
      {/* Page Title */}
      <div style={{ marginBottom: '24px' }}>
        <h1 style={{ margin: 0, fontSize: '22px', fontWeight: 700, color: '#1a202c' }}>
          Dashboard Overview
        </h1>
        <p style={{ margin: '4px 0 0', color: '#718096', fontSize: '13px' }}>
          Real-time workforce statistics and analytics
        </p>
      </div>

      {/* Stat Cards */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))',
        gap: '16px',
        marginBottom: '24px',
      }}>
        <StatCard title="Total Teachers" value={stats.total_teachers?.toLocaleString()} icon="" color="#097C87" />
        <StatCard title="Total Schools" value={stats.total_schools?.toLocaleString()} icon="" color="#23CED9" />
        <StatCard title="Transfers Recommended" value={stats.transfers_recommended?.toLocaleString()} icon="" color="#FCA47C" />
        <StatCard title="Surplus Schools" value={stats.surplus_schools?.toLocaleString()} icon="" color="#A1CCA6" />
        <StatCard title="Shortage Schools" value={stats.shortage_schools?.toLocaleString()} icon="" color="#E53E3E" />
        <StatCard
          title="Avg. Student-Teacher Ratio"
          value={stats.avg_student_teacher_ratio}
          sub="Students per teacher"
          icon=""
          color="#F9D779"
        />
      </div>

      {/* Government Portal Status */}
      {stats.model_accuracy > 0 && (
        <div style={{
          background: 'linear-gradient(135deg, #097C87, #23CED9)',
          borderRadius: '10px',
          padding: '16px 24px',
          color: '#fff',
          marginBottom: '24px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: '12px',
        }}>
          <div>
            <div style={{ fontWeight: 700, fontSize: '15px' }}>Government Education Portal</div>
            <div style={{ fontSize: '12px', opacity: 0.9, marginTop: '2px' }}>
              Teacher Management Control Room — Ministry of Education
            </div>
          </div>
          <div style={{ textAlign: 'right' }}>
            <div style={{ fontSize: '28px', fontWeight: 800 }}>✓ Active</div>
            <div style={{ fontSize: '11px', opacity: 0.85 }}>System Status</div>
          </div>
        </div>
      )}

      {/* Charts Row */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
        gap: '20px',
        marginBottom: '24px',
      }}>
        {/* District Teacher Distribution */}
        <div style={card()}>
          <SectionHeader title="District-wise Teacher Distribution" sub="Top 15 districts by teacher count" />
          <ResponsiveContainer width="100%" height={280}>
            <BarChart data={stats.district_data} margin={{ top: 5, right: 10, left: -10, bottom: 60 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis dataKey="district" tick={{ fontSize: 10 }} angle={-45} textAnchor="end" />
              <YAxis tick={{ fontSize: 11 }} />
              <Tooltip
                contentStyle={{ fontSize: '12px', borderRadius: '6px' }}
                formatter={(v) => [v.toLocaleString(), 'Teachers']}
              />
              <Bar dataKey="teachers" fill="#097C87" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Student-Teacher Ratio Distribution */}
        <div style={card()}>
          <SectionHeader title="Student-Teacher Ratio Distribution" sub="Schools grouped by ratio range" />
          <ResponsiveContainer width="100%" height={320}>
            <PieChart margin={{ top: 10, right: 10, left: 10, bottom: 10 }}>
              <Pie
                data={stats.ratio_data}
                dataKey="schools"
                nameKey="range"
                cx="50%" cy="40%"
                outerRadius={90}
                label={({ percent }) => percent > 0.08 ? `${(percent * 100).toFixed(0)}%` : ''}
                labelLine={true}
              >
                {stats.ratio_data.map((_, i) => (
                  <Cell key={i} fill={COLORS[i % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip formatter={(v) => [v, 'Schools']} />
              <Legend verticalAlign="bottom" height={42} wrapperStyle={{ fontSize: '12px', paddingTop: '12px' }} />
            </PieChart>
          </ResponsiveContainer>
        </div>

        {/* Subject Distribution */}
        <div style={card()}>
          <SectionHeader title="Subject-wise Teacher Distribution" sub="Top 10 subjects" />
          <ResponsiveContainer width="100%" height={340}>
            <BarChart data={stats.subject_data} layout="vertical" margin={{ top: 10, right: 30, left: 160, bottom: 10 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis type="number" tick={{ fontSize: 12 }} />
              <YAxis dataKey="subject" type="category" tick={{ fontSize: 12 }} width={160} />
              <Tooltip contentStyle={{ fontSize: '12px' }} />
              <Bar dataKey="count" fill="#23CED9" radius={[0, 4, 4, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* School Table */}
      <div style={card()}>
        <SectionHeader
          title="Top 10 Schools by Student Strength"
          sub="Sorted by student enrollment"
          action={
            <button onClick={load} style={{
              background: '#097C87', color: '#fff', border: 'none',
              borderRadius: '6px', padding: '6px 14px', cursor: 'pointer', fontSize: '12px',
            }}>
              ↻ Refresh
            </button>
          }
        />
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
            <thead>
              <tr style={{ background: '#f7fafc', borderBottom: '2px solid #e2e8f0' }}>
                {['School Name', 'District', 'Students', 'Teachers (Current)', 'Required', 'Ratio'].map(h => (
                  <th key={h} style={{
                    padding: '10px 12px', textAlign: 'left', fontWeight: 700,
                    color: '#4a5568', whiteSpace: 'nowrap',
                  }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {stats.top_schools.map((s, i) => {
                const gap = s.Current_Teacher_Count - s.Required_Teacher_Count;
                return (
                  <tr key={i} style={{ borderBottom: '1px solid #f0f0f0' }}
                    onMouseEnter={e => e.currentTarget.style.background = '#f7fafc'}
                    onMouseLeave={e => e.currentTarget.style.background = ''}
                  >
                    <td style={{ padding: '10px 12px', fontWeight: 500 }}>{s.School_Name}</td>
                    <td style={{ padding: '10px 12px', color: '#718096' }}>{s.District}</td>
                    <td style={{ padding: '10px 12px' }}>{s.Student_Strength?.toLocaleString()}</td>
                    <td style={{ padding: '10px 12px' }}>
                      <span style={{
                        background: gap >= 0 ? '#C6F6D5' : '#FED7D7',
                        color: gap >= 0 ? '#276749' : '#9B2C2C',
                        padding: '2px 8px', borderRadius: '12px', fontWeight: 600,
                      }}>
                        {s.Current_Teacher_Count}
                      </span>
                    </td>
                    <td style={{ padding: '10px 12px' }}>{s.Required_Teacher_Count}</td>
                    <td style={{ padding: '10px 12px' }}>
                      <span style={{
                        background: s.Student_Teacher_Ratio > 40 ? '#FED7D7' :
                          s.Student_Teacher_Ratio > 30 ? '#FEFCBF' : '#C6F6D5',
                        color: s.Student_Teacher_Ratio > 40 ? '#9B2C2C' :
                          s.Student_Teacher_Ratio > 30 ? '#744210' : '#276749',
                        padding: '2px 8px', borderRadius: '12px', fontWeight: 600,
                      }}>
                        {s.Student_Teacher_Ratio?.toFixed(1)}
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
