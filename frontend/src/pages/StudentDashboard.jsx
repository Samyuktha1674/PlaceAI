import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Brain, Target, BookOpen, Sliders, Award, AlertTriangle, ArrowRight, TrendingUp, RefreshCw } from 'lucide-react'
import Header from '../components/shared/Header.jsx'
import { studentAPI } from '../utils/api.js'

function RiskBadge({ level }) {
  const styles = {
    'Low Risk':    { bg: '#D1FAE5', color: '#065F46', border: '#6EE7B7' },
    'Medium Risk': { bg: '#FEF3C7', color: '#92400E', border: '#FCD34D' },
    'High Risk':   { bg: '#FEE2E2', color: '#991B1B', border: '#FCA5A5' },
  }
  const s = styles[level] || styles['Medium Risk']
  return (
    <span style={{ background: s.bg, color: s.color, border: `1.5px solid ${s.border}`,
      padding: '4px 14px', borderRadius: 20, fontWeight: 700, fontSize: '0.85rem',
      display: 'inline-block', marginTop: 4 }}>
      {level || 'Calculating...'}
    </span>
  )
}

export default function StudentDashboard() {
  const nav = useNavigate()
  const studentId   = localStorage.getItem('student_id') || 'S001'
  const studentName = localStorage.getItem('student_name') || 'Student'
  const [dash, setDash]       = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError]     = useState('')

  const loadDashboard = () => {
    setLoading(true)
    setError('')
    studentAPI.getDashboard(studentId)
      .then(r => {
        const data = r.data
        // Validate we actually got real data
        if (!data || typeof data.readiness_score === 'undefined') {
          setError('No data received from server')
          return
        }
        setDash(data)
      })
      .catch(err => {
        const msg = err?.response?.data?.error || err.message || 'Connection failed'
        setError(`Could not load dashboard: ${msg}. Make sure the backend is running.`)
      })
      .finally(() => setLoading(false))
  }

  useEffect(() => {
    if (!studentId) { nav('/student/login'); return }
    loadDashboard()
  }, [studentId])

  if (loading) return (
    <div className="page-wrapper">
      <Header studentName={studentName} />
      <div className="loading-spinner">
        <div className="spinner" />
        <span>Loading your dashboard...</span>
      </div>
    </div>
  )

  if (error || !dash) return (
    <div className="page-wrapper">
      <Header studentName={studentName} />
      <div className="content-area">
        <div style={{ textAlign: 'center', padding: '60px 24px' }}>
          <div style={{ fontSize: '3rem', marginBottom: 16 }}>⚠️</div>
          <h2 style={{ marginBottom: 12, color: 'var(--text-primary)' }}>Cannot connect to backend</h2>
          <p style={{ color: 'var(--text-secondary)', marginBottom: 8, maxWidth: 400, margin: '0 auto 24px' }}>
            {error || 'The backend server is not responding.'}
          </p>
          <div style={{ background: '#F3F4F6', borderRadius: 10, padding: '16px 20px',
            textAlign: 'left', maxWidth: 440, margin: '0 auto 24px', fontSize: '0.875rem' }}>
            <strong>To fix this:</strong>
            <div style={{ marginTop: 8, color: 'var(--text-secondary)' }}>
              1. Open Terminal<br/>
              2. <code style={{ background: '#E5E7EB', padding: '2px 6px', borderRadius: 4 }}>cd ~/Downloads/placeai/backend</code><br/>
              3. <code style={{ background: '#E5E7EB', padding: '2px 6px', borderRadius: 4 }}>source venv/bin/activate</code><br/>
              4. <code style={{ background: '#E5E7EB', padding: '2px 6px', borderRadius: 4 }}>python3 app.py</code>
            </div>
          </div>
          <button className="btn btn-brand" onClick={loadDashboard}>
            <RefreshCw size={16} /> Try Again
          </button>
        </div>
      </div>
    </div>
  )

  const s = dash.student || {}
  const readiness = Number(dash.readiness_score) || 0
  const prob      = Number(dash.placement_probability) || 0

  return (
    <div className="page-wrapper">
      <Header studentName={studentName} />
      <div className="content-area fade-in">

        {/* KPI Stats */}
        <div className="stats-grid" style={{ gridTemplateColumns: 'repeat(4, 1fr)', marginBottom: 24 }}>
          <div className="stat-card primary">
            <div className="label">Readiness Score</div>
            <div className="value">{readiness}%</div>
            <div className="sub-value">Overall Placement Readiness</div>
            <div style={{ marginTop: 8, height: 4, background: 'rgba(255,255,255,0.2)', borderRadius: 2 }}>
              <div style={{ height: '100%', width: `${readiness}%`, background: 'white', borderRadius: 2, transition: 'width 1s' }} />
            </div>
          </div>

          <div className="stat-card">
            <div className="label">Risk Level</div>
            <RiskBadge level={dash.risk_level} />
            <div className="sub-value" style={{ marginTop: 8 }}>Current Assessment</div>
          </div>

          <div className="stat-card">
            <div className="label">Placement Probability</div>
            <div className="value" style={{ color: prob >= 70 ? 'var(--green)' : prob >= 50 ? 'var(--gold)' : 'var(--red)' }}>
              {prob}%
            </div>
            <div className="sub-value">Success Likelihood</div>
          </div>

          <div className="stat-card">
            <div className="label">Expected Salary</div>
            <div className="value" style={{ color: 'var(--brand)', fontSize: '1.5rem' }}>
              ₹{dash.expected_salary_min}–{dash.expected_salary_max}L
            </div>
            <div className="sub-value">Per Annum Range</div>
          </div>
        </div>

        {/* Feature cards */}
        <div className="grid-3" style={{ marginBottom: 24 }}>
          <div className="feature-card" onClick={() => nav('/student/analysis')}>
            <div className="card-header" style={{ marginBottom: 8 }}>
              <Brain size={22} color="var(--brand)" />
              <ArrowRight size={16} color="var(--text-muted)" style={{ marginLeft: 'auto' }} />
            </div>
            <h3>AI Readiness Analysis</h3>
            <p>See exactly which factors are helping or hurting your placement chances</p>
            <button className="btn btn-primary btn-full" style={{ marginTop: 16 }}>View Full Analysis</button>
          </div>

          <div className="feature-card" onClick={() => nav('/student/skill-gaps')}>
            <div className="card-header" style={{ marginBottom: 8 }}>
              <Target size={22} color="var(--gold)" />
              <span style={{ marginLeft: 'auto', background: 'var(--red)', color: 'white',
                borderRadius: '50%', width: 22, height: 22, fontSize: '0.75rem',
                display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700 }}>
                {dash.areas_needing_attention?.length || 0}
              </span>
            </div>
            <h3>Skill Gap Analysis</h3>
            <p>Compare your scores with what companies actually expect from you</p>
            <button className="btn btn-outline btn-full" style={{ marginTop: 16 }}>Analyze Gaps</button>
          </div>

          <div className="feature-card" onClick={() => nav('/student/learning-path')}>
            <div className="card-header" style={{ marginBottom: 8 }}>
              <BookOpen size={22} color="var(--green)" />
              <TrendingUp size={16} color="var(--text-muted)" style={{ marginLeft: 'auto' }} />
            </div>
            <h3>Personalized Learning Path</h3>
            <p>AI-generated study plan specifically for your weak areas</p>
            <button className="btn btn-full" style={{ marginTop: 16, background: 'transparent',
              color: 'var(--green)', border: '1.5px solid var(--green)', borderRadius: 8,
              padding: '10px', fontWeight: 600, cursor: 'pointer', fontFamily: 'DM Sans' }}>
              View Learning Path
            </button>
          </div>
        </div>

        <div className="grid-3" style={{ marginBottom: 24 }}>
          <div className="feature-card" onClick={() => nav('/student/what-if')}>
            <div className="card-header" style={{ marginBottom: 8 }}>
              <Sliders size={22} color="var(--brand)" />
              <ArrowRight size={16} color="var(--text-muted)" style={{ marginLeft: 'auto' }} />
            </div>
            <h3>What-If Analyzer</h3>
            <p>Simulate "if I improve coding by 10 points, how much does my readiness change?"</p>
            <button className="btn btn-full" style={{ marginTop: 16, background: 'transparent',
              color: 'var(--brand)', border: '1.5px solid var(--brand)', borderRadius: 8,
              padding: '10px', fontWeight: 600, cursor: 'pointer', fontFamily: 'DM Sans' }}>
              Run Simulations
            </button>
          </div>

          {/* Top company matches */}
          <div className="card">
            <div className="card-header">
              <Award size={18} color="var(--brand)" />
              <h3>Top Company Matches</h3>
            </div>
            {(dash.top_companies || []).map((c, i) => (
              <div key={c.name} style={{ display: 'flex', justifyContent: 'space-between',
                alignItems: 'center', padding: '10px 0',
                borderBottom: i < (dash.top_companies.length - 1) ? '1px solid var(--border-light)' : 'none' }}>
                <span style={{ fontWeight: 600 }}>{c.name}</span>
                <span style={{ background: 'var(--bg)', padding: '2px 10px',
                  borderRadius: 20, fontSize: '0.8rem', border: '1px solid var(--border)' }}>
                  #{c.rank}
                </span>
              </div>
            ))}
          </div>

          {/* Areas needing attention */}
          <div className="card" style={{ background: '#FFFBEB', border: '1px solid #FDE68A' }}>
            <div className="card-header">
              <AlertTriangle size={18} color="var(--gold)" />
              <h3 style={{ color: 'var(--gold)' }}>Areas Needing Attention</h3>
            </div>
            {(dash.areas_needing_attention || []).length === 0 ? (
              <p style={{ color: 'var(--green)', fontWeight: 600 }}>🎉 All areas look strong!</p>
            ) : (dash.areas_needing_attention || []).map(a => (
              <div key={a.label} style={{ marginBottom: 14 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 5, alignItems: 'center' }}>
                  <span style={{ fontSize: '0.875rem', fontWeight: 500 }}>{a.label}</span>
                  <span style={{ color: 'var(--red)', fontSize: '0.8rem', fontWeight: 700,
                    background: '#FEE2E2', padding: '2px 8px', borderRadius: 20 }}>
                    -{Math.abs(Number(a.gap) || 0).toFixed(1)} pts below avg
                  </span>
                </div>
                <div className="progress-bar">
                  <div className="progress-fill red"
                    style={{ width: `${Math.max(5, 100 - Math.abs(Number(a.gap) || 0))}%` }} />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Profile snapshot */}
        <div className="card">
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <TrendingUp size={18} color="var(--brand)" />
              <h3>Your Profile Snapshot</h3>
            </div>
            <button onClick={() => nav('/student/profile')} className="btn btn-outline btn-sm">
              Edit Profile
            </button>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5,1fr)', gap: 20 }}>
            {[
              { label: 'CGPA',          value: s.cgpa,                display: `${s.cgpa}/10`,        pct: (Number(s.cgpa) || 0) * 10 },
              { label: 'Technical',     value: s.technical_score,     display: `${s.technical_score}/100`, pct: Number(s.technical_score) || 0 },
              { label: 'Coding',        value: s.coding_score,        display: `${s.coding_score}/100`,    pct: Number(s.coding_score) || 0 },
              { label: 'Communication', value: s.communication_score, display: `${s.communication_score}/100`, pct: Number(s.communication_score) || 0 },
              { label: 'Projects',      value: s.projects,            display: `${s.projects} done`,   pct: Math.min((Number(s.projects) || 0) / 5 * 100, 100) },
            ].map(({ label, display, pct }) => (
              <div key={label}>
                <div style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', marginBottom: 4 }}>{label}</div>
                <div style={{ fontFamily: 'Space Grotesk', fontSize: '1.4rem', fontWeight: 700, marginBottom: 6 }}>
                  {display}
                </div>
                <div className="progress-bar">
                  <div className="progress-fill primary" style={{ width: `${pct}%` }} />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
