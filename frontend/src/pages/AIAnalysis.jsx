import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Brain, Info, RefreshCw } from 'lucide-react'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts'
import Header from '../components/shared/Header.jsx'
import { studentAPI } from '../utils/api.js'

function CircularScore({ value }) {
  const v = Number(value) || 0
  const r = 52, c = 2 * Math.PI * r
  const fill = (v / 100) * c
  const color = v >= 70 ? '#10B981' : v >= 50 ? '#F59E0B' : '#EF4444'
  return (
    <svg width="130" height="130" viewBox="0 0 130 130">
      <circle cx="65" cy="65" r={r} fill="none" stroke="#E5E7EB" strokeWidth="10" />
      <circle cx="65" cy="65" r={r} fill="none" stroke={color} strokeWidth="10"
        strokeDasharray={`${fill} ${c}`} strokeLinecap="round" transform="rotate(-90 65 65)" />
      <text x="65" y="59" textAnchor="middle" fontFamily="Space Grotesk"
        fontWeight="700" fontSize="22" fill={color}>{v}%</text>
      <text x="65" y="76" textAnchor="middle" fontFamily="DM Sans"
        fontSize="10" fill="#9CA3AF">Readiness</text>
    </svg>
  )
}

const DIR_COLORS = { positive: '#10B981', negative: '#EF4444', neutral: '#F59E0B' }

export default function AIAnalysis() {
  const nav = useNavigate()
  const studentId   = localStorage.getItem('student_id') || 'S001'
  const studentName = localStorage.getItem('student_name') || ''
  const [analysis, setAnalysis] = useState(null)
  const [tab, setTab]           = useState('xai')
  const [loading, setLoading]   = useState(true)
  const [error, setError]       = useState('')

  const load = () => {
    setLoading(true); setError('')
    studentAPI.getAnalysis(studentId)
      .then(r => { setAnalysis(r.data) })
      .catch(err => setError(err?.response?.data?.error || err.message))
      .finally(() => setLoading(false))
  }

  useEffect(() => { load() }, [])

  if (loading) return (
    <div className="page-wrapper">
      <Header studentName={studentName} />
      <div className="loading-spinner"><div className="spinner" /><span>Running AI model...</span></div>
    </div>
  )

  if (error || !analysis) return (
    <div className="page-wrapper">
      <Header studentName={studentName} />
      <div className="content-area">
        <div style={{ textAlign: 'center', padding: 48 }}>
          <div style={{ fontSize: '3rem', marginBottom: 16 }}>❌</div>
          <p style={{ color: 'var(--red)', marginBottom: 20 }}>{error || 'No data received'}</p>
          <button className="btn btn-brand" onClick={load}><RefreshCw size={16}/> Retry</button>
        </div>
      </div>
    </div>
  )

  const fi   = (analysis.feature_importance || []).sort((a, b) => b.impact - a.impact)
  const prob = Number(analysis.placement_probability) || 0
  const rs   = Number(analysis.readiness_score) || 0

  return (
    <div className="page-wrapper">
      <Header studentName={studentName} />
      <div className="content-area fade-in">
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 24 }}>
          <button onClick={() => nav('/student')} style={{ background: 'none', border: 'none',
            color: 'var(--text-secondary)', cursor: 'pointer', fontSize: '1.1rem' }}>←</button>
          <Brain size={24} color="var(--brand)" />
          <div>
            <h2>AI Placement Readiness Analysis</h2>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem' }}>
              Analysis for {analysis.student_name} — computed live by the ML model
            </p>
          </div>
          <button onClick={load} className="btn btn-outline btn-sm" style={{ marginLeft: 'auto' }}>
            <RefreshCw size={14} /> Refresh
          </button>
        </div>

        {/* Summary */}
        <div className="card" style={{ marginBottom: 24 }}>
          <div className="card-header">
            <Brain size={18} color="var(--brand)" />
            <h3>Overall Placement Readiness Assessment</h3>
          </div>
          <div style={{ display: 'flex', gap: 48, alignItems: 'center', flexWrap: 'wrap' }}>
            <CircularScore value={rs} />
            <div style={{ display: 'flex', gap: 40, flexWrap: 'wrap' }}>
              <div>
                <div style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', marginBottom: 8 }}>Risk Level</div>
                <span style={{
                  padding: '5px 16px', borderRadius: 20, fontWeight: 700, fontSize: '0.9rem',
                  background: analysis.risk_level === 'Low Risk' ? '#D1FAE5' : analysis.risk_level === 'Medium Risk' ? '#FEF3C7' : '#FEE2E2',
                  color: analysis.risk_level === 'Low Risk' ? '#065F46' : analysis.risk_level === 'Medium Risk' ? '#92400E' : '#991B1B',
                }}>{analysis.risk_level}</span>
              </div>
              <div>
                <div style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', marginBottom: 4 }}>Placement Probability</div>
                <div style={{ fontFamily: 'Space Grotesk', fontWeight: 700, fontSize: '2rem',
                  color: prob >= 70 ? 'var(--green)' : prob >= 50 ? 'var(--gold)' : 'var(--red)' }}>
                  {prob}%
                </div>
              </div>
              <div>
                <div style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', marginBottom: 4 }}>Expected Salary</div>
                <div style={{ fontFamily: 'Space Grotesk', fontWeight: 700, fontSize: '1.4rem', color: 'var(--brand)' }}>
                  ₹{analysis.expected_salary_min}–{analysis.expected_salary_max}L
                </div>
              </div>
              <div>
                <div style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', marginBottom: 8 }}>Top Company Matches</div>
                <div style={{ display: 'flex', gap: 8 }}>
                  {(analysis.top_companies || []).map(c => (
                    <span key={c.name} style={{ padding: '4px 12px', border: '1px solid var(--border)',
                      borderRadius: 20, fontSize: '0.82rem', fontWeight: 500 }}>{c.name}</span>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="tabs">
          <button className={`tab-btn ${tab === 'xai' ? 'active' : ''}`} onClick={() => setTab('xai')}>
            Feature Importance (XAI)
          </button>
          <button className={`tab-btn ${tab === 'detail' ? 'active' : ''}`} onClick={() => setTab('detail')}>
            Detailed Breakdown
          </button>
        </div>

        {tab === 'xai' && (
          <div className="card">
            <div className="card-header">
              <Info size={16} color="var(--brand)" />
              <h3>SHAP-Like Feature Importance Analysis</h3>
            </div>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.875rem', marginBottom: 24 }}>
              This chart shows how each factor contributes to your score. Green bars = helping you.
              Red bars = hurting your chances. Longer bar = bigger impact on final score.
            </p>
            {fi.length === 0 ? (
              <p style={{ color: 'var(--text-secondary)' }}>No feature data available.</p>
            ) : (
              <ResponsiveContainer width="100%" height={340}>
                <BarChart data={fi} layout="vertical" margin={{ left: 140, right: 80, top: 5, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#F3F4F6" />
                  <XAxis type="number" tickFormatter={v => v.toFixed(1)} fontSize={12} />
                  <YAxis dataKey="label" type="category" width={135} fontSize={12} tick={{ fill: '#4B5563' }} />
                  <Tooltip content={({ active, payload }) => {
                    if (!active || !payload?.length) return null
                    const d = payload[0].payload
                    return (
                      <div style={{ background: 'white', border: '1px solid var(--border)',
                        borderRadius: 10, padding: '12px 16px', boxShadow: 'var(--shadow-md)', minWidth: 200 }}>
                        <div style={{ fontWeight: 700, marginBottom: 6 }}>{d.label}</div>
                        <div style={{ fontSize: '0.85rem', lineHeight: 1.8, color: 'var(--text-secondary)' }}>
                          Model Weight: <strong>{d.weight}%</strong><br />
                          Your Score: <strong style={{ color: 'var(--brand)' }}>{d.your_score}</strong><br />
                          Industry Avg: <strong>{d.industry_avg}</strong><br />
                          <span style={{ color: DIR_COLORS[d.direction], fontWeight: 700 }}>
                            {d.direction === 'positive' ? '↑ Helping you' : '↓ Hurting your score'}
                          </span>
                        </div>
                      </div>
                    )
                  }} />
                  <Bar dataKey="impact" radius={[0, 5, 5, 0]}>
                    {fi.map((entry, i) => (
                      <Cell key={i} fill={DIR_COLORS[entry.direction] || '#6B7280'} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            )}
            <div style={{ display: 'flex', gap: 20, marginTop: 16 }}>
              {[['#10B981','Positive (above average)'],['#EF4444','Negative (below average)'],['#F59E0B','Neutral']].map(([c,l])=>(
                <div key={l} style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: '0.8rem' }}>
                  <div style={{ width: 12, height: 12, borderRadius: 3, background: c }} />{l}
                </div>
              ))}
            </div>
            <div className="alert alert-info" style={{ marginTop: 16 }}>
              <Info size={15} />
              <span><strong>How to read:</strong> Bar length = importance in the AI model.
                Color = whether your score in that area is above (green) or below (red) the industry average.
                Focus on the long red bars first — those give you the biggest improvement.</span>
            </div>
          </div>
        )}

        {tab === 'detail' && (
          <div>
            <div className="card" style={{ marginBottom: 16, background: 'var(--bg)' }}>
              <h3 style={{ marginBottom: 4 }}>Detailed Factor Analysis</h3>
              <p style={{ color: 'var(--text-secondary)', fontSize: '0.875rem' }}>
                Individual breakdown of each factor with scores and actionable advice
              </p>
            </div>
            {(analysis.detailed_breakdown || []).map(item => {
              const statusColor = item.status === 'Strong' ? 'var(--green)' : item.status === 'Moderate' ? 'var(--gold)' : 'var(--red)'
              const statusBg    = item.status === 'Strong' ? '#ECFDF5' : item.status === 'Moderate' ? '#FFFBEB' : '#FEF2F2'
              const border      = item.status === 'Strong' ? '#A7F3D0' : item.status === 'Moderate' ? '#FDE68A' : '#FECACA'
              return (
                <div key={item.feature} style={{ border: `1px solid ${border}`, borderRadius: 12,
                  padding: '16px 20px', marginBottom: 12, background: statusBg }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
                    <div>
                      <strong style={{ fontSize: '0.95rem' }}>{item.label}</strong>
                      <span style={{ color: 'var(--text-secondary)', fontSize: '0.8rem', marginLeft: 10 }}>
                        Weight: {item.weight}% | Your Score: <strong style={{ color: 'var(--brand)' }}>{item.your_score}</strong>
                      </span>
                    </div>
                    <span style={{ background: statusBg, color: statusColor, border: `1.5px solid ${border}`,
                      padding: '3px 12px', borderRadius: 20, fontSize: '0.78rem', fontWeight: 700 }}>
                      {item.status}
                    </span>
                  </div>
                  <div style={{ height: 8, background: 'rgba(0,0,0,0.08)', borderRadius: 4, marginBottom: 10 }}>
                    <div style={{ height: '100%', width: `${Math.min(Number(item.your_score)||0,100)}%`,
                      background: statusColor, borderRadius: 4, transition: 'width 0.6s' }} />
                  </div>
                  <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: 6 }}>
                    <span>{item.status === 'Strong' ? '✓' : '⚠'}</span> {item.advice}
                  </div>
                </div>
              )
            })}
          </div>
        )}

        {/* Transparency section */}
        <div className="card" style={{ marginTop: 24, background: '#F8F7FF', border: '1px solid #DDD6FE' }}>
          <div className="card-header"><Brain size={16} color="var(--brand)" /><h3>Model Transparency & Methodology</h3></div>
          <div className="grid-2">
            <div>
              <h4 style={{ color: 'var(--brand)', marginBottom: 12, fontSize: '0.875rem' }}>Analysis Method:</h4>
              {['Random Forest trained on 200 historical placement records',
                'Feature importance using SHAP-like methodology',
                'Weighted scoring aligned with industry survey data',
                'Compared against 5 company hiring benchmarks'].map(t => (
                <div key={t} style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: 8 }}>• {t}</div>
              ))}
            </div>
            <div>
              <h4 style={{ color: 'var(--brand)', marginBottom: 12, fontSize: '0.875rem' }}>Data Sources:</h4>
              {['Historical placement records (3 years)',
                'Company hiring criteria: TCS, Infosys, Wipro, Zoho, Accenture',
                'Industry professional survey responses',
                'Current batch performance metrics'].map(t => (
                <div key={t} style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: 8 }}>• {t}</div>
              ))}
            </div>
          </div>
          <div style={{ marginTop: 14, padding: '12px 16px', background: 'white', borderRadius: 8,
            fontSize: '0.8rem', color: 'var(--text-muted)', fontStyle: 'italic' }}>
            Note: This analysis provides decision support based on data patterns. It does not guarantee placement outcomes
            but helps you understand exactly where to focus your preparation efforts.
          </div>
        </div>
      </div>
    </div>
  )
}
