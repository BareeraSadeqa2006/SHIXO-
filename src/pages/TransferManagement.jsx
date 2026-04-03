import { useState, useEffect, useRef } from 'react';
import { getTeachers, predictTransfer } from '../api';
import Loader from '../components/Loader';
import SectionHeader from '../components/SectionHeader';

const card = (style = {}) => ({
  background: '#fff', borderRadius: '10px', padding: '20px',
  boxShadow: '0 1px 4px rgba(0,0,0,0.08)', ...style,
});

export default function TransferManagement() {
  const [search, setSearch] = useState('');
  const [teachers, setTeachers] = useState([]);
  const [totalTeachers, setTotalTeachers] = useState(0);
  const [page, setPage] = useState(1);
  const [loadingList, setLoadingList] = useState(false);
  const [selectedTeacher, setSelectedTeacher] = useState(null);
  const [predicting, setPredicting] = useState(false);
  const [prediction, setPrediction] = useState(null);
  const [predError, setPredError] = useState(null);
  const searchRef = useRef();
  const LIMIT = 15;

  const loadTeachers = async (s, p) => {
    setLoadingList(true);
    try {
      const data = await getTeachers(s, p, LIMIT);
      setTeachers(data.teachers);
      setTotalTeachers(data.total);
    } catch (e) {
      // ignore
    } finally {
      setLoadingList(false);
    }
  };

  useEffect(() => { loadTeachers(search, page); }, [search, page]);

  const handleSearch = (e) => {
    setSearch(e.target.value);
    setPage(1);
  };

  const handlePredict = async (teacher) => {
    setSelectedTeacher(teacher);
    setPrediction(null);
    setPredError(null);
    setPredicting(true);
    try {
      const result = await predictTransfer(teacher.Teacher_ID);
      setPrediction(result);
    } catch (e) {
      setPredError('Prediction failed. Please try again.');
    } finally {
      setPredicting(false);
    }
  };

  const totalPages = Math.ceil(totalTeachers / LIMIT);

  return (
    <div>
      <div style={{ marginBottom: '24px' }}>
        <h1 style={{ margin: 0, fontSize: '22px', fontWeight: 700, color: '#1a202c' }}>Transfer Management</h1>
        <p style={{ margin: '4px 0 0', color: '#718096', fontSize: '13px' }}>
          Select a teacher to run AI-powered transfer prediction analysis
        </p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '20px', alignItems: 'start' }}>
        {/* Teacher Directory */}
        <div style={{ ...card(), height: '100%' }}>
          <SectionHeader title="Teacher Directory" sub={`${totalTeachers.toLocaleString()} teachers found`} />
          <input
            ref={searchRef}
            value={search}
            onChange={handleSearch}
            placeholder="Search by name, ID, subject or school..."
            style={{
              width: '100%', padding: '8px 12px', border: '1px solid #e2e8f0',
              borderRadius: '6px', fontSize: '13px', marginBottom: '12px',
              outline: 'none', boxSizing: 'border-box',
            }}
          />
          {loadingList ? <Loader text="Loading teachers..." /> : (
            <>
              <div style={{ overflowX: 'auto', maxHeight: '420px', overflowY: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '12px' }}>
                  <thead style={{ position: 'sticky', top: 0, background: '#f7fafc', zIndex: 1 }}>
                    <tr style={{ borderBottom: '2px solid #e2e8f0' }}>
                      {['ID', 'Name', 'Subject', 'Yrs in School', 'Action'].map(h => (
                        <th key={h} style={{ padding: '9px 10px', textAlign: 'left', fontWeight: 700, color: '#4a5568', whiteSpace: 'nowrap' }}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {teachers.map(t => (
                      <tr
                        key={t.Teacher_ID}
                        style={{
                          borderBottom: '1px solid #f0f0f0',
                          background: selectedTeacher?.Teacher_ID === t.Teacher_ID ? 'rgba(9,124,135,0.07)' : '',
                        }}
                        onMouseEnter={e => e.currentTarget.style.background = 'rgba(9,124,135,0.04)'}
                        onMouseLeave={e => e.currentTarget.style.background = selectedTeacher?.Teacher_ID === t.Teacher_ID ? 'rgba(9,124,135,0.07)' : ''}
                      >
                        <td style={{ padding: '8px 10px', color: '#718096', fontFamily: 'monospace' }}>{t.Teacher_ID}</td>
                        <td style={{ padding: '8px 10px', fontWeight: 500 }}>{t.Teacher_Name}</td>
                        <td style={{ padding: '8px 10px' }}>
                          <span style={{ background: '#EBF8FF', color: '#2B6CB0', padding: '2px 8px', borderRadius: '10px', fontSize: '11px' }}>
                            {t.Subject}
                          </span>
                        </td>
                        <td style={{ padding: '8px 10px', textAlign: 'center' }}>
                          <span style={{
                            background: t.Years_in_Current_School >= 5 ? '#FED7D7' : '#C6F6D5',
                            color: t.Years_in_Current_School >= 5 ? '#9B2C2C' : '#276749',
                            padding: '2px 8px', borderRadius: '10px', fontWeight: 600, fontSize: '11px',
                          }}>
                            {t.Years_in_Current_School}
                          </span>
                        </td>
                        <td style={{ padding: '8px 10px' }}>
                          <button
                            onClick={() => handlePredict(t)}
                            disabled={predicting && selectedTeacher?.Teacher_ID === t.Teacher_ID}
                            style={{
                              background: '#097C87', color: '#fff', border: 'none',
                              borderRadius: '5px', padding: '4px 12px', cursor: 'pointer',
                              fontSize: '11px', fontWeight: 600,
                              opacity: predicting && selectedTeacher?.Teacher_ID === t.Teacher_ID ? 0.6 : 1,
                            }}
                          >
                            Predict
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              {/* Pagination */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '12px', fontSize: '12px', color: '#718096' }}>
                <span>Page {page} of {totalPages}</span>
                <div style={{ display: 'flex', gap: '6px' }}>
                  <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1}
                    style={{ padding: '4px 10px', border: '1px solid #e2e8f0', borderRadius: '4px', cursor: 'pointer', background: '#fff', fontSize: '12px', disabled: { opacity: 0.4 } }}>
                    ‹ Prev
                  </button>
                  <button onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page === totalPages}
                    style={{ padding: '4px 10px', border: '1px solid #e2e8f0', borderRadius: '4px', cursor: 'pointer', background: '#fff', fontSize: '12px' }}>
                    Next ›
                  </button>
                </div>
              </div>
            </>
          )}
        </div>

        {/* Right: Prediction Result */}
        <div>
          {predicting && <div style={card()}><Loader text="Running AI prediction..." /></div>}
          {predError && (
            <div style={card({ borderTop: '3px solid #E53E3E' })}>
              <div style={{ color: '#E53E3E', fontWeight: 600 }}>⚠️ {predError}</div>
            </div>
          )}

          {prediction && !predicting && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              {/* Result Header */}
              <div style={{
                ...card(),
                borderTop: `3px solid ${prediction.transfer_recommended ? '#FCA47C' : '#A1CCA6'}`,
              }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  <div>
                    <div style={{ fontSize: '13px', color: '#718096', marginBottom: '4px' }}>Transfer Prediction</div>
                    <div style={{ fontSize: '20px', fontWeight: 700, color: '#1a202c' }}>
                      {prediction.teacher_name}
                    </div>
                    <div style={{ fontSize: '13px', color: '#718096', marginTop: '2px' }}>
                      {prediction.subject} • {prediction.current_school}
                    </div>
                  </div>
                  <div>
                    <div style={{
                      background: prediction.transfer_recommended ? '#FCA47C' : '#A1CCA6',
                      color: '#fff', padding: '10px 20px', borderRadius: '8px',
                      fontWeight: 700, fontSize: '16px', textAlign: 'center',
                    }}>
                      {prediction.transfer_recommended ? '⇄ TRANSFER RECOMMENDED' : '✓ NO TRANSFER'}
                    </div>
                    <div style={{ fontSize: '12px', color: '#718096', marginTop: '6px' }}>
                      Confidence: {prediction.confidence}%
                    </div>
                  </div>
                </div>

                {/* Priority Score Bar */}
                <div style={{ marginTop: '16px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', marginBottom: '4px' }}>
                    <span style={{ color: '#718096', fontWeight: 600 }}>Priority Score</span>
                    <span style={{ fontWeight: 700, color: prediction.priority_score >= 60 ? '#E53E3E' : prediction.priority_score >= 40 ? '#DD6B20' : '#276749' }}>
                      {prediction.priority_score}/100
                    </span>
                  </div>
                  <div style={{ background: '#f0f0f0', borderRadius: '6px', height: '10px' }}>
                    <div style={{
                      height: '100%',
                      width: `${prediction.priority_score}%`,
                      borderRadius: '6px',
                      background: prediction.priority_score >= 60 ? '#E53E3E' : prediction.priority_score >= 40 ? '#DD6B20' : '#A1CCA6',
                      transition: 'width 0.5s',
                    }} />
                  </div>
                </div>
              </div>

              {/* Reasons */}
              <div style={card()}>
                <SectionHeader title="Transfer Justification Factors" />
                <ul style={{ margin: 0, paddingLeft: '0', listStyle: 'none', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  {prediction.reasons.map((r, i) => (
                    <li key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: '8px', fontSize: '13px' }}>
                      <span style={{ color: '#097C87', fontWeight: 700, marginTop: '1px' }}>✓</span>
                      <span>{r}</span>
                    </li>
                  ))}
                </ul>
              </div>

              {/* Teacher Details */}
              <div style={card()}>
                <SectionHeader title="Teacher Profile" />
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', fontSize: '13px' }}>
                  {[
                    { label: 'Teacher ID', value: prediction.teacher_id },
                    { label: 'Age', value: `${prediction.teacher_details.age} years` },
                    { label: 'Years of Service', value: `${prediction.teacher_details.years_of_service} years` },
                    { label: 'Years in School', value: `${prediction.teacher_details.years_in_school} years` },
                    { label: 'Rural Service', value: `${prediction.teacher_details.rural_years} years` },
                    { label: 'Transfer Request', value: prediction.teacher_details.transfer_request ? '✅ Yes' : '❌ No' },
                    { label: 'Medical Ground', value: prediction.teacher_details.medical_ground ? '✅ Yes' : '❌ No' },
                    { label: 'Spouse Distance', value: `${prediction.teacher_details.spouse_distance} km` },
                    { label: 'Promotion Due', value: prediction.teacher_details.promotion_due ? '✅ Yes' : '❌ No' },
                  ].map(({ label, value }) => (
                    <div key={label} style={{ background: '#f7fafc', padding: '10px', borderRadius: '6px' }}>
                      <div style={{ fontSize: '11px', color: '#a0aec0', marginBottom: '2px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>{label}</div>
                      <div style={{ fontWeight: 600, color: '#2d3748' }}>{value}</div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
