import { useEffect, useState } from 'react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  RadialBarChart, RadialBar, Legend, Cell, PieChart, Pie,
} from 'recharts';
import { getWorkforceData } from '../api';
import Loader from '../components/Loader';
import StatCard from '../components/StatCard';
import SectionHeader from '../components/SectionHeader';

const COLORS = ['#097C87', '#23CED9', '#A1CCA6', '#F9D779', '#FCA47C', '#6B7280', '#9333EA', '#EF4444', '#10B981', '#F59E0B'];

const card = (style = {}) => ({
  background: '#fff', borderRadius: '10px', padding: '20px',
  boxShadow: '0 1px 4px rgba(0,0,0,0.08)', ...style,
});

export default function WorkforceMonitoring() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [districtPage, setDistrictPage] = useState(0);
  const PAGE_SIZE = 10;

  const load = async () => {
    setLoading(true);
    setError(null);
    try {
      const d = await getWorkforceData();
      setData(d);
    } catch {
      setError('Failed to load workforce data.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  if (loading) return <Loader text="Loading workforce analytics..." />;
  if (error) return (
    <div style={{ padding: '40px', textAlign: 'center' }}>
      <div style={{ color: '#e53e3e', marginBottom: '16px' }}>{error}</div>
      <button onClick={load} style={{ background: '#097C87', color: '#fff', border: 'none', borderRadius: '6px', padding: '10px 20px', cursor: 'pointer' }}>Retry</button>
    </div>
  );

  const pagedDistricts = data.district_summary.slice(districtPage * PAGE_SIZE, (districtPage + 1) * PAGE_SIZE);
  const totalDistrictPages = Math.ceil(data.district_summary.length / PAGE_SIZE);

  // Prepare bar chart data for district
  const districtBarData = data.district_summary.map(d => ({
    district: d.District.length > 12 ? d.District.slice(0, 12) + '…' : d.District,
    full: d.District,
    Teachers: d.Total_Teachers,
    Required: d.Required_Teachers,
    Gap: Math.abs(d.Gap),
  })).slice(0, 20);

  return (
    <div>
      <div style={{ marginBottom: '24px' }}>
        <h1 style={{ margin: 0, fontSize: '22px', fontWeight: 700, color: '#1a202c' }}>Workforce Monitoring</h1>
        <p style={{ margin: '4px 0 0', color: '#718096', fontSize: '13px' }}>
          Comprehensive analytics across all districts, schools, and teacher profiles
        </p>
      </div>

      {/* Summary Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: '16px', marginBottom: '24px' }}>
        <StatCard title="Total Teachers" value={data.total_teachers?.toLocaleString()} icon="" color="#097C87" />
        <StatCard title="Transfer Pending" value={data.transfer_pending?.toLocaleString()} icon="" color="#FCA47C" />
        <StatCard title="Districts Covered" value={data.district_summary.length} icon="" color="#23CED9" />
        <StatCard title="Surplus Schools" value={data.surplus_schools.length} icon="" color="#A1CCA6" />
        <StatCard title="Shortage Schools" value={data.shortage_schools.length} icon="" color="#E53E3E" />
      </div>

      {/* Charts Row 1 */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '20px', marginBottom: '20px' }}>
        {/* Subject Distribution Pie */}
        <div style={card()}>
          <SectionHeader title="Subject-wise Teacher Distribution" />
          <ResponsiveContainer width="100%" height={380}>
            <PieChart margin={{ top: 20, right: 30, bottom: 80, left: 30 }}>
              <Pie data={data.subject_distribution} dataKey="count" nameKey="subject"
                cx="45%" cy="40%" outerRadius={85}
                label={({ percent }) => percent > 0.04 ? `${(percent * 100).toFixed(0)}%` : ''}
                labelLine={true}>
                {data.subject_distribution.map((_, i) => (
                  <Cell key={i} fill={COLORS[i % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip formatter={(v, n) => [v.toLocaleString(), n]} />
              <Legend verticalAlign="bottom" height={36} wrapperStyle={{ fontSize: '12px', paddingTop: '20px' }} />
            </PieChart>
          </ResponsiveContainer>
        </div>

        {/* Age Distribution */}
        <div style={card()}>
          <SectionHeader title="Teacher Age Distribution" sub="Grouped by age brackets" />
          <ResponsiveContainer width="100%" height={260}>
            <BarChart data={data.age_distribution} margin={{ top: 5, right: 10, left: -10, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis dataKey="range" tick={{ fontSize: 12 }} />
              <YAxis tick={{ fontSize: 11 }} />
              <Tooltip contentStyle={{ fontSize: '12px' }} formatter={(v) => [v.toLocaleString(), 'Teachers']} />
              <Bar dataKey="count" fill="#097C87" radius={[4, 4, 0, 0]}>
                {data.age_distribution.map((_, i) => (
                  <Cell key={i} fill={COLORS[i % COLORS.length]} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Service Distribution */}
        <div style={card()}>
          <SectionHeader title="Years of Service Distribution" sub="Experience breakdown" />
          <ResponsiveContainer width="100%" height={260}>
            <BarChart data={data.service_distribution} margin={{ top: 5, right: 10, left: -10, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis dataKey="range" tick={{ fontSize: 12 }} />
              <YAxis tick={{ fontSize: 11 }} />
              <Tooltip contentStyle={{ fontSize: '12px' }} formatter={(v) => [v.toLocaleString(), 'Teachers']} />
              <Bar dataKey="count" fill="#23CED9" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* District Teachers vs Required Bar Chart */}
      <div style={{ ...card(), marginBottom: '20px' }}>
        <SectionHeader title="District-wise Current vs Required Teachers" sub="Top 20 districts by teacher count" />
        <ResponsiveContainer width="100%" height={280}>
          <BarChart data={districtBarData} margin={{ top: 5, right: 20, left: -10, bottom: 60 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
            <XAxis dataKey="district" tick={{ fontSize: 10 }} angle={-40} textAnchor="end" />
            <YAxis tick={{ fontSize: 11 }} />
            <Tooltip
              contentStyle={{ fontSize: '12px', borderRadius: '6px' }}
              formatter={(v, n) => [v.toLocaleString(), n]}
            />
            <Legend wrapperStyle={{ fontSize: '12px' }} />
            <Bar dataKey="Teachers" fill="#097C87" radius={[3, 3, 0, 0]} />
            <Bar dataKey="Required" fill="#F9D779" radius={[3, 3, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Surplus & Shortage Schools side by side */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', marginBottom: '20px' }}>
        {/* Surplus Schools */}
        <div style={card()}>
          <SectionHeader title="Top Surplus Schools" sub="Schools with excess teachers" />
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '12px' }}>
              <thead>
                <tr style={{ background: '#f7fafc', borderBottom: '2px solid #e2e8f0' }}>
                  {['School', 'District', 'Current', 'Required', 'Surplus'].map(h => (
                    <th key={h} style={{ padding: '8px 10px', textAlign: 'left', fontWeight: 700, color: '#4a5568', whiteSpace: 'nowrap' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {data.surplus_schools.map((s, i) => (
                  <tr key={i} style={{ borderBottom: '1px solid #f0f0f0' }}>
                    <td style={{ padding: '8px 10px', fontWeight: 500 }} title={s.School_Name}>
                      {s.School_Name.length > 22 ? s.School_Name.slice(0, 22) + '…' : s.School_Name}
                    </td>
                    <td style={{ padding: '8px 10px', color: '#718096' }}>{s.District}</td>
                    <td style={{ padding: '8px 10px', textAlign: 'center' }}>{s.Current_Teacher_Count}</td>
                    <td style={{ padding: '8px 10px', textAlign: 'center' }}>{s.Required_Teacher_Count}</td>
                    <td style={{ padding: '8px 10px', textAlign: 'center' }}>
                      <span style={{ background: '#C6F6D5', color: '#276749', padding: '2px 8px', borderRadius: '10px', fontWeight: 700, fontSize: '11px' }}>
                        +{s.Surplus_Shortage}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Shortage Schools */}
        <div style={card()}>
          <SectionHeader title="Top Shortage Schools" sub="Schools needing urgent staffing" />
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '12px' }}>
              <thead>
                <tr style={{ background: '#f7fafc', borderBottom: '2px solid #e2e8f0' }}>
                  {['School', 'District', 'Current', 'Required', 'Shortage'].map(h => (
                    <th key={h} style={{ padding: '8px 10px', textAlign: 'left', fontWeight: 700, color: '#4a5568', whiteSpace: 'nowrap' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {data.shortage_schools.map((s, i) => (
                  <tr key={i} style={{ borderBottom: '1px solid #f0f0f0' }}>
                    <td style={{ padding: '8px 10px', fontWeight: 500 }} title={s.School_Name}>
                      {s.School_Name.length > 22 ? s.School_Name.slice(0, 22) + '…' : s.School_Name}
                    </td>
                    <td style={{ padding: '8px 10px', color: '#718096' }}>{s.District}</td>
                    <td style={{ padding: '8px 10px', textAlign: 'center' }}>{s.Current_Teacher_Count}</td>
                    <td style={{ padding: '8px 10px', textAlign: 'center' }}>{s.Required_Teacher_Count}</td>
                    <td style={{ padding: '8px 10px', textAlign: 'center' }}>
                      <span style={{ background: '#FED7D7', color: '#9B2C2C', padding: '2px 8px', borderRadius: '10px', fontWeight: 700, fontSize: '11px' }}>
                        {s.Surplus_Shortage}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* District Summary Table */}
      <div style={card()}>
        <SectionHeader
          title="District-wise Workforce Summary"
          sub={`Showing ${districtPage * PAGE_SIZE + 1}–${Math.min((districtPage + 1) * PAGE_SIZE, data.district_summary.length)} of ${data.district_summary.length} districts`}
          action={
            <button onClick={load} style={{
              background: '#097C87', color: '#fff', border: 'none',
              borderRadius: '6px', padding: '6px 14px', cursor: 'pointer', fontSize: '12px',
            }}>↻ Refresh</button>
          }
        />
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '12px' }}>
            <thead>
              <tr style={{ background: '#f7fafc', borderBottom: '2px solid #e2e8f0' }}>
                {['District', 'Schools', 'Current Teachers', 'Required', 'Gap', 'Avg Ratio', 'Surplus', 'Shortage'].map(h => (
                  <th key={h} style={{ padding: '10px 12px', textAlign: 'left', fontWeight: 700, color: '#4a5568', whiteSpace: 'nowrap' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {pagedDistricts.map((d, i) => (
                <tr key={i} style={{ borderBottom: '1px solid #f0f0f0' }}
                  onMouseEnter={e => e.currentTarget.style.background = '#f7fafc'}
                  onMouseLeave={e => e.currentTarget.style.background = ''}
                >
                  <td style={{ padding: '10px 12px', fontWeight: 600 }}>{d.District}</td>
                  <td style={{ padding: '10px 12px', textAlign: 'center' }}>{d.Schools}</td>
                  <td style={{ padding: '10px 12px', textAlign: 'center' }}>{d.Total_Teachers?.toLocaleString()}</td>
                  <td style={{ padding: '10px 12px', textAlign: 'center' }}>{d.Required_Teachers?.toLocaleString()}</td>
                  <td style={{ padding: '10px 12px', textAlign: 'center' }}>
                    <span style={{
                      background: d.Gap > 50 ? '#FED7D7' : d.Gap < -50 ? '#C6F6D5' : '#FEFCBF',
                      color: d.Gap > 50 ? '#9B2C2C' : d.Gap < -50 ? '#276749' : '#744210',
                      padding: '2px 8px', borderRadius: '10px', fontWeight: 700,
                    }}>
                      {d.Gap > 0 ? `+${d.Gap}` : d.Gap}
                    </span>
                  </td>
                  <td style={{ padding: '10px 12px', textAlign: 'center' }}>
                    <span style={{
                      background: d.Avg_Ratio > 40 ? '#FED7D7' : d.Avg_Ratio > 30 ? '#FEFCBF' : '#C6F6D5',
                      color: d.Avg_Ratio > 40 ? '#9B2C2C' : d.Avg_Ratio > 30 ? '#744210' : '#276749',
                      padding: '2px 8px', borderRadius: '10px', fontWeight: 600,
                    }}>
                      {d.Avg_Ratio}
                    </span>
                  </td>
                  <td style={{ padding: '10px 12px', textAlign: 'center', color: '#276749', fontWeight: 600 }}>{d.Surplus_Schools}</td>
                  <td style={{ padding: '10px 12px', textAlign: 'center', color: '#9B2C2C', fontWeight: 600 }}>{d.Shortage_Schools}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div style={{ display: 'flex', justifyContent: 'center', gap: '8px', marginTop: '12px' }}>
          <button onClick={() => setDistrictPage(p => Math.max(0, p - 1))} disabled={districtPage === 0}
            style={{ padding: '6px 14px', border: '1px solid #e2e8f0', borderRadius: '4px', cursor: 'pointer', background: '#fff', fontSize: '12px' }}>
            ‹ Prev
          </button>
          {Array.from({ length: totalDistrictPages }, (_, i) => (
            <button key={i} onClick={() => setDistrictPage(i)}
              style={{
                padding: '6px 12px', border: '1px solid #e2e8f0', borderRadius: '4px',
                cursor: 'pointer', fontSize: '12px',
                background: districtPage === i ? '#097C87' : '#fff',
                color: districtPage === i ? '#fff' : '#4a5568',
              }}>
              {i + 1}
            </button>
          ))}
          <button onClick={() => setDistrictPage(p => Math.min(totalDistrictPages - 1, p + 1))} disabled={districtPage === totalDistrictPages - 1}
            style={{ padding: '6px 14px', border: '1px solid #e2e8f0', borderRadius: '4px', cursor: 'pointer', background: '#fff', fontSize: '12px' }}>
            Next ›
          </button>
        </div>
      </div>
    </div>
  );
}
