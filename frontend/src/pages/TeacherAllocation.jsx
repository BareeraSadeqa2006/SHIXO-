import { useState } from 'react';
import { getTeachers, predictTransfer, recommendSchool, executeTransfer } from '../api';
import Loader from '../components/Loader';
import SectionHeader from '../components/SectionHeader';

const card = (style = {}) => ({
  background: '#fff', borderRadius: '10px', padding: '20px',
  boxShadow: '0 1px 4px rgba(0,0,0,0.08)', ...style,
});

export default function TeacherAllocation() {
  const [teacherId, setTeacherId] = useState('');
  const [loading, setLoading] = useState(false);
  const [prediction, setPrediction] = useState(null);
  const [recommendations, setRecommendations] = useState(null);
  const [error, setError] = useState(null);
  const [transferring, setTransferring] = useState(null);
  const [transferResult, setTransferResult] = useState(null);

  // Quick search
  const [quickSearch, setQuickSearch] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [searching, setSearching] = useState(false);

  const handleQuickSearch = async (val) => {
    setQuickSearch(val);
    if (val.length < 2) { setSearchResults([]); return; }
    setSearching(true);
    try {
      const data = await getTeachers(val, 1, 8);
      setSearchResults(data.teachers);
    } catch { setSearchResults([]); }
    finally { setSearching(false); }
  };

  const selectTeacher = (t) => {
    setTeacherId(t.Teacher_ID);
    setQuickSearch(`${t.Teacher_ID} — ${t.Teacher_Name}`);
    setSearchResults([]);
  };

  const handleAnalyze = async () => {
    if (!teacherId.trim()) return;
    setLoading(true);
    setError(null);
    setPrediction(null);
    setRecommendations(null);
    setTransferResult(null);
    try {
      const pred = await predictTransfer(teacherId.trim());
      setPrediction(pred);
      if (pred.transfer_recommended) {
        const rec = await recommendSchool(teacherId.trim());
        setRecommendations(rec);
      }
    } catch (e) {
      setError('Analysis failed. Check teacher ID and try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleExecute = async (school) => {
    setTransferring(school.School_ID);
    try {
      const result = await executeTransfer(teacherId.trim(), school.School_ID);
      setTransferResult(result);
      setRecommendations(null);
      setPrediction(null);
    } catch (e) {
      alert('Transfer execution failed.');
    } finally {
      setTransferring(null);
    }
  };

  return (
    <div>
      <div style={{ marginBottom: '24px' }}>
        <h1 style={{ margin: 0, fontSize: '22px', fontWeight: 700, color: '#1a202c' }}>Teacher Allocation</h1>
        <p style={{ margin: '4px 0 0', color: '#718096', fontSize: '13px' }}>
          Predict transfer eligibility and get AI-recommended school allocations
        </p>
      </div>

      {/* Input Panel */}
      <div style={{ ...card(), marginBottom: '20px' }}>
        <SectionHeader title="Teacher Lookup & Allocation Analysis" />
        <div style={{ display: 'flex', gap: '12px', alignItems: 'flex-end', flexWrap: 'wrap' }}>
          <div style={{ flex: 1, minWidth: '280px', position: 'relative' }}>
            <label style={{ fontSize: '12px', fontWeight: 600, color: '#4a5568', display: 'block', marginBottom: '4px' }}>
              Teacher ID or Name Search
            </label>
            <input
              value={quickSearch}
              onChange={e => handleQuickSearch(e.target.value)}
              placeholder="Type to search (e.g. TCH00042 or Rajesh Sharma)..."
              style={{
                width: '100%', padding: '10px 14px', border: '1px solid #e2e8f0',
                borderRadius: '6px', fontSize: '13px', outline: 'none', boxSizing: 'border-box',
              }}
            />
            {searchResults.length > 0 && (
              <div style={{
                position: 'absolute', top: '100%', left: 0, right: 0, zIndex: 50,
                background: '#fff', border: '1px solid #e2e8f0', borderRadius: '6px',
                boxShadow: '0 4px 12px rgba(0,0,0,0.1)', maxHeight: '220px', overflowY: 'auto',
              }}>
                {searchResults.map(t => (
                  <div
                    key={t.Teacher_ID}
                    onClick={() => selectTeacher(t)}
                    style={{ padding: '10px 14px', cursor: 'pointer', borderBottom: '1px solid #f0f0f0', fontSize: '13px' }}
                    onMouseEnter={e => e.currentTarget.style.background = '#f7fafc'}
                    onMouseLeave={e => e.currentTarget.style.background = ''}
                  >
                    <div style={{ fontWeight: 600 }}>{t.Teacher_Name} <span style={{ color: '#718096', fontWeight: 400 }}>({t.Teacher_ID})</span></div>
                    <div style={{ fontSize: '11px', color: '#a0aec0' }}>{t.Subject} • {t.Current_School_Name}</div>
                  </div>
                ))}
              </div>
            )}
          </div>
          <div>
            <label style={{ fontSize: '12px', fontWeight: 600, color: '#4a5568', display: 'block', marginBottom: '4px' }}>
              Or enter Teacher ID directly
            </label>
            <input
              value={teacherId}
              onChange={e => setTeacherId(e.target.value)}
              placeholder="e.g. TCH00042"
              style={{
                padding: '10px 14px', border: '1px solid #e2e8f0',
                borderRadius: '6px', fontSize: '13px', outline: 'none', width: '180px',
              }}
            />
          </div>
          <button
            onClick={handleAnalyze}
            disabled={loading || !teacherId.trim()}
            style={{
              background: loading ? '#ccc' : '#097C87', color: '#fff', border: 'none',
              borderRadius: '6px', padding: '10px 24px', cursor: loading ? 'default' : 'pointer',
              fontSize: '14px', fontWeight: 600, flexShrink: 0,
            }}
          >
            {loading ? '⏳ Analyzing...' : '🔍 Analyze & Recommend'}
          </button>
        </div>
      </div>

      {loading && <Loader text="Running AI transfer prediction and school recommendation engine..." />}
      {error && (
        <div style={{ ...card(), borderTop: '3px solid #E53E3E', color: '#E53E3E', fontWeight: 600 }}>
          ⚠️ {error}
        </div>
      )}

      {/* Transfer Success */}
      {transferResult && (
        <div style={{ ...card(), borderTop: '3px solid #48BB78', marginBottom: '20px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div style={{ fontSize: '40px' }}>✅</div>
            <div>
              <div style={{ fontWeight: 700, fontSize: '16px', color: '#276749' }}>Transfer Executed Successfully</div>
              <div style={{ fontSize: '13px', color: '#718096', marginTop: '4px' }}>{transferResult.message}</div>
            </div>
          </div>
          <button
            onClick={() => { setTransferResult(null); setTeacherId(''); setQuickSearch(''); }}
            style={{
              marginTop: '12px', background: '#097C87', color: '#fff', border: 'none',
              borderRadius: '6px', padding: '8px 18px', cursor: 'pointer', fontSize: '13px',
            }}
          >
            Analyze Another Teacher
          </button>
        </div>
      )}

      {/* Prediction Result */}
      {prediction && !loading && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          {/* Prediction Card */}
          <div style={{ ...card(), borderTop: `3px solid ${prediction.transfer_recommended ? '#FCA47C' : '#A1CCA6'}` }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px' }}>
              <div>
                <div style={{ fontSize: '18px', fontWeight: 700, color: '#1a202c' }}>{prediction.teacher_name}</div>
                <div style={{ fontSize: '13px', color: '#718096' }}>{prediction.subject} • {prediction.current_school}</div>
              </div>
              <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
                <div style={{ textAlign: 'center' }}>
                  <div style={{ fontSize: '11px', color: '#a0aec0', marginBottom: '2px' }}>PRIORITY SCORE</div>
                  <div style={{ fontSize: '24px', fontWeight: 700, color: prediction.priority_score >= 60 ? '#E53E3E' : prediction.priority_score >= 40 ? '#DD6B20' : '#276749' }}>
                    {prediction.priority_score}
                  </div>
                </div>
                <div style={{
                  background: prediction.transfer_recommended ? '#FCA47C' : '#A1CCA6',
                  color: '#fff', padding: '12px 20px', borderRadius: '8px', fontWeight: 700, fontSize: '14px',
                }}>
                  {prediction.transfer_recommended ? '⇄ TRANSFER RECOMMENDED' : '✓ STAYS IN CURRENT SCHOOL'}
                </div>
              </div>
            </div>

            {/* Reasons */}
            <div style={{ marginTop: '16px', display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
              {prediction.reasons.map((r, i) => (
                <span key={i} style={{
                  background: '#EBF8FF', color: '#2B6CB0', padding: '4px 12px',
                  borderRadius: '20px', fontSize: '12px',
                }}>
                  {r}
                </span>
              ))}
            </div>
          </div>

          {/* School Recommendations */}
          {recommendations && (
            <div style={card()}>
              <SectionHeader
                title="Top 3 Recommended Schools"
                sub={`Best matching schools for ${recommendations.subject} teacher allocation`}
              />
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '16px' }}>
                {recommendations.recommended_schools.map((s, i) => (
                  <div key={s.School_ID} style={{
                    border: `2px solid ${i === 0 ? '#097C87' : '#e2e8f0'}`,
                    borderRadius: '10px', padding: '16px',
                    background: i === 0 ? 'rgba(9,124,135,0.03)' : '#fff',
                  }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '12px' }}>
                      <div>
                        <div style={{ fontSize: '11px', color: '#a0aec0', marginBottom: '4px' }}>
                          {i === 0 ? '🥇 TOP RECOMMENDATION' : i === 1 ? '🥈 ALTERNATIVE' : '🥉 ALTERNATIVE'}
                        </div>
                        <div style={{ fontWeight: 700, fontSize: '14px', color: '#1a202c' }}>{s.School_Name}</div>
                        <div style={{ fontSize: '12px', color: '#718096', marginTop: '2px' }}>📍 {s.District}</div>
                      </div>
                      <div style={{
                        background: '#097C87', color: '#fff', padding: '4px 10px',
                        borderRadius: '16px', fontSize: '12px', fontWeight: 600, flexShrink: 0,
                      }}>
                        Score: {s.Score}
                      </div>
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', marginBottom: '16px', fontSize: '12px' }}>
                      <div style={{ background: '#f7fafc', padding: '8px', borderRadius: '6px' }}>
                        <div style={{ color: '#a0aec0', fontSize: '10px', textTransform: 'uppercase', marginBottom: '2px' }}>Students</div>
                        <div style={{ fontWeight: 700 }}>{s.Student_Strength?.toLocaleString()}</div>
                      </div>
                      <div style={{ background: '#f7fafc', padding: '8px', borderRadius: '6px' }}>
                        <div style={{ color: '#a0aec0', fontSize: '10px', textTransform: 'uppercase', marginBottom: '2px' }}>Ratio</div>
                        <div style={{ fontWeight: 700, color: s.Student_Teacher_Ratio > 40 ? '#E53E3E' : '#276749' }}>
                          {s.Student_Teacher_Ratio}
                        </div>
                      </div>
                      <div style={{ background: '#FED7D7', padding: '8px', borderRadius: '6px' }}>
                        <div style={{ color: '#a0aec0', fontSize: '10px', textTransform: 'uppercase', marginBottom: '2px' }}>Shortage</div>
                        <div style={{ fontWeight: 700, color: '#C53030' }}>{s.Shortage} teachers</div>
                      </div>
                      <div style={{ background: '#C6F6D5', padding: '8px', borderRadius: '6px' }}>
                        <div style={{ color: '#a0aec0', fontSize: '10px', textTransform: 'uppercase', marginBottom: '2px' }}>Vacancy ({s.Subject_Vacancy > 0 ? '✓' : ''})</div>
                        <div style={{ fontWeight: 700, color: '#276749' }}>{s.Subject_Vacancy} posts</div>
                      </div>
                    </div>

                    <button
                      onClick={() => handleExecute(s)}
                      disabled={transferring === s.School_ID}
                      style={{
                        width: '100%', background: i === 0 ? '#097C87' : '#fff',
                        color: i === 0 ? '#fff' : '#097C87',
                        border: `2px solid #097C87`, borderRadius: '6px',
                        padding: '10px', cursor: 'pointer', fontWeight: 700, fontSize: '13px',
                        opacity: transferring ? 0.6 : 1,
                      }}
                    >
                      {transferring === s.School_ID ? '⏳ Processing...' : `⇄ Transfer Here`}
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {prediction && !prediction.transfer_recommended && (
            <div style={{ ...card(), textAlign: 'center', padding: '40px', borderTop: '3px solid #A1CCA6' }}>
              <div style={{ fontSize: '48px', marginBottom: '12px' }}>✅</div>
              <div style={{ fontSize: '16px', fontWeight: 700, color: '#276749', marginBottom: '8px' }}>
                No Transfer Required
              </div>
              <div style={{ color: '#718096', fontSize: '13px' }}>
                The AI model determined this teacher does not meet the criteria for transfer. They should remain in their current school.
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
