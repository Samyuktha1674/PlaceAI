import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { User, Edit3, Save, X, CheckCircle, TrendingUp, Brain } from 'lucide-react'
import Header from '../components/shared/Header.jsx'
import { studentAPI } from '../utils/api.js'

const SCORE_FIELDS = [
  { key: 'aptitude_score',      label: 'Aptitude Score',      max: 100 },
  { key: 'technical_score',     label: 'Technical Score',     max: 100 },
  { key: 'coding_score',        label: 'Coding Score',        max: 100 },
  { key: 'communication_score', label: 'Communication Score', max: 100 },
  { key: 'resume_quality',      label: 'Resume Quality',      max: 100 },
  { key: 'consistency_score',   label: 'Consistency Score',   max: 100 },
]

function ScoreBar({ value, max = 100 }) {
  const pct   = Math.min((Number(value) || 0) / max * 100, 100)
  const color = pct >= 75 ? 'var(--green)' : pct >= 50 ? 'var(--gold)' : 'var(--red)'
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
      <div style={{ flex: 1, height: 8, background: 'var(--border)', borderRadius: 4 }}>
        <div style={{ height: '100%', width: `${pct}%`, background: color, borderRadius: 4, transition: 'width 0.5s' }} />
      </div>
      <span style={{ fontFamily: 'Space Grotesk', fontWeight: 700, fontSize: '0.9rem', minWidth: 50, textAlign: 'right' }}>
        {Number(value) || 0}/{max}
      </span>
    </div>
  )
}

export default function StudentProfile() {
  const nav = useNavigate()
  const studentId   = localStorage.getItem('student_id') || 'S001'
  const studentName = localStorage.getItem('student_name') || ''
  const [profile, setProfile] = useState(null)
  const [editing, setEditing] = useState(false)
  const [form, setForm]       = useState({})
  const [saved, setSaved]     = useState(false)
  const [loading, setLoading] = useState(true)
  const [prediction, setPrediction] = useState(null)

  const loadProfile = () => {
    setLoading(true)
    studentAPI.getProfile(studentId)
      .then(r => {
        setProfile(r.data)
        setForm(r.data)
      })
      .catch(err => console.error('Profile load error:', err))
      .finally(() => setLoading(false))

    // Also load prediction
    studentAPI.getDashboard(studentId)
      .then(r => setPrediction(r.data))
      .catch(() => {})
  }

  useEffect(() => { loadProfile() }, [])

  const handleSave = async () => {
    try {
      await studentAPI.updateProfile(studentId, form)
      // Reload both profile and prediction after save
      const [profRes, dashRes] = await Promise.all([
        studentAPI.getProfile(studentId),
        studentAPI.getDashboard(studentId)
      ])
      setProfile(profRes.data)
      setForm(profRes.data)
      setPrediction(dashRes.data)
      setEditing(false)
      setSaved(true)
      setTimeout(() => setSaved(false), 3000)
    } catch (err) {
      alert('Save failed: ' + (err?.response?.data?.error || err.message))
    }
  }

  if (loading) return (
    <div className="page-wrapper">
      <Header studentName={studentName} />
      <div className="loading-spinner"><div className="spinner" /><span>Loading profile...</span></div>
    </div>
  )

  if (!profile) return null

  // Performance insight classification
  const getInsight = (key, val) => {
    const v = Number(val) || 0
    const score = key === 'cgpa' ? v * 10 : v
    if (score >= 75) return { label: 'Strong', color: 'var(--green)', bg: '#ECFDF5' }
    if (score >= 55) return { label: 'Moderate', color: 'var(--gold)', bg: '#FFFBEB' }
    return { label: 'Needs Work', color: 'var(--red)', bg: '#FEF2F2' }
  }

  return (
    <div className="page-wrapper">
      <Header studentName={studentName} extra={
        !editing
          ? <button onClick={() => setEditing(true)}
              style={{ background: 'rgba(255,255,255,0.2)', border: 'none', color: 'white',
                padding: '7px 14px', borderRadius: 8, cursor: 'pointer',
                fontFamily: 'DM Sans', display: 'flex', alignItems: 'center', gap: 6, fontSize: '0.875rem' }}>
              <Edit3 size={14} /> Edit Profile
            </button>
          : <div style={{ display: 'flex', gap: 8 }}>
              <button onClick={handleSave}
                style={{ background: 'var(--green)', border: 'none', color: 'white',
                  padding: '7px 14px', borderRadius: 8, cursor: 'pointer',
                  fontFamily: 'DM Sans', display: 'flex', alignItems: 'center', gap: 6, fontSize: '0.875rem' }}>
                <Save size={14} /> Save & Recalculate
              </button>
              <button onClick={() => { setEditing(false); setForm(profile) }}
                style={{ background: 'rgba(255,0,0,0.3)', border: 'none', color: 'white',
                  padding: '7px 14px', borderRadius: 8, cursor: 'pointer', fontFamily: 'DM Sans', fontSize: '0.875rem' }}>
                <X size={14} /> Cancel
              </button>
            </div>
      } />

      <div className="content-area fade-in">
        {saved && (
          <div className="alert alert-success" style={{ marginBottom: 20 }}>
            <CheckCircle size={16} />
            <strong>Profile saved!</strong> Readiness score has been recalculated based on your new scores.
            {prediction && <span style={{ marginLeft: 8 }}>
              New readiness: <strong>{prediction.readiness_score}%</strong> ({prediction.risk_level})
            </span>}
          </div>
        )}

        {editing && (
          <div className="alert alert-info" style={{ marginBottom: 20 }}>
            <Edit3 size={16} />
            Use the sliders to update your scores, then click <strong>Save & Recalculate</strong> — the AI will instantly recompute your placement readiness.
          </div>
        )}

        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 20 }}>
          <button onClick={() => nav('/student')} style={{ background: 'none', border: 'none',
            color: 'var(--text-secondary)', cursor: 'pointer', fontFamily: 'DM Sans' }}>← Dashboard</button>
        </div>

        <div className="grid-2">
          {/* Left column */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>

            {/* Identity card */}
            <div className="card" style={{ textAlign: 'center' }}>
              <div style={{ width: 72, height: 72, borderRadius: '50%',
                background: 'linear-gradient(135deg,#5B21B6,#7C3AED)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                margin: '0 auto 12px', fontSize: '1.8rem', color: 'white',
                fontFamily: 'Space Grotesk', fontWeight: 700 }}>
                {(profile.name || 'S')[0]}
              </div>
              <h2 style={{ fontSize: '1.2rem', marginBottom: 4 }}>{profile.name}</h2>
              <p style={{ color: 'var(--text-secondary)', fontSize: '0.875rem', marginBottom: 16 }}>{profile.email}</p>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8, textAlign: 'left',
                background: 'var(--bg)', borderRadius: 10, padding: '12px 16px' }}>
                {[['Student ID', profile.student_id], ['CGPA', profile.cgpa], ['Attendance', `${profile.attendance}%`]]
                  .map(([k, v]) => (
                    <div key={k} style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.875rem' }}>
                      <span style={{ color: 'var(--text-secondary)' }}>{k}</span>
                      <strong>{v}</strong>
                    </div>
                  ))}
              </div>
            </div>

            {/* Prediction summary */}
            {prediction && (
              <div className="card" style={{ background: 'linear-gradient(135deg,#1E1040,#2D1B69)', border: 'none' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16 }}>
                  <Brain size={18} color="#A78BFA" />
                  <h3 style={{ color: 'white', fontSize: '0.95rem' }}>AI Prediction</h3>
                  {editing && <span style={{ fontSize: '0.72rem', color: '#A78BFA', marginLeft: 'auto' }}>Save to update</span>}
                </div>
                {[
                  ['Readiness', `${prediction.readiness_score}%`],
                  ['Probability', `${prediction.placement_probability}%`],
                  ['Risk', prediction.risk_level],
                  ['Salary', `₹${prediction.expected_salary_min}-${prediction.expected_salary_max}L`],
                ].map(([k, v]) => (
                  <div key={k} style={{ display: 'flex', justifyContent: 'space-between',
                    padding: '8px 0', borderBottom: '1px solid rgba(255,255,255,0.08)', color: 'white', fontSize: '0.875rem' }}>
                    <span style={{ color: 'rgba(255,255,255,0.6)' }}>{k}</span>
                    <strong style={{ color: k === 'Risk' && prediction.risk_level === 'High Risk' ? '#FCA5A5' : '#A78BFA' }}>{v}</strong>
                  </div>
                ))}
              </div>
            )}

            {/* Quick stats */}
            <div className="card">
              <h3 style={{ marginBottom: 16 }}>Experience</h3>
              <div className="grid-2">
                {[
                  { label: 'Internships', key: 'internships', max: 3, unit: '' },
                  { label: 'Projects',    key: 'projects',    max: 5, unit: '' },
                ].map(({ label, key, max }) => (
                  <div key={key} style={{ textAlign: 'center', padding: '16px', background: 'var(--bg)', borderRadius: 10 }}>
                    <div style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', marginBottom: 4 }}>{label}</div>
                    {editing ? (
                      <input type="number" min={0} max={max * 3} value={form[key] ?? 0}
                        onChange={e => setForm(p => ({ ...p, [key]: parseInt(e.target.value) || 0 }))}
                        style={{ width: '60px', textAlign: 'center', border: '1.5px solid var(--brand)',
                          borderRadius: 6, padding: '4px', fontFamily: 'Space Grotesk',
                          fontWeight: 700, fontSize: '1.4rem', color: 'var(--brand)' }} />
                    ) : (
                      <div style={{ fontFamily: 'Space Grotesk', fontWeight: 700, fontSize: '2rem', color: 'var(--brand)' }}>
                        {profile[key] || 0}
                      </div>
                    )}
                  </div>
                ))}
              </div>
              <div style={{ marginTop: 12, padding: '10px 14px', background: '#EFF6FF',
                border: '1px solid #BFDBFE', borderRadius: 8, fontSize: '0.82rem', color: '#1D4ED8' }}>
                💡 Aim for <strong>2+ internships</strong> and <strong>4-5 quality projects</strong> to significantly improve your readiness score.
              </div>
            </div>
          </div>

          {/* Right column */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>

            {/* Academic scores */}
            <div className="card">
              <h3 style={{ marginBottom: 6 }}>Academic Information</h3>
              <p style={{ color: 'var(--text-secondary)', fontSize: '0.8rem', marginBottom: 20 }}>
                {editing ? 'Drag sliders to update your scores' : 'Your current academic metrics'}
              </p>
              <div className="grid-2">
                {[
                  { key: 'cgpa', label: 'CGPA', min: 0, max: 10, step: 0.1, display: v => `${Number(v).toFixed(1)}/10` },
                  { key: 'attendance', label: 'Attendance %', min: 0, max: 100, step: 1, display: v => `${v}%` },
                ].map(f => (
                  <div key={f.key}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
                      <label style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-secondary)' }}>{f.label}</label>
                      <strong style={{ fontFamily: 'Space Grotesk' }}>{f.display(editing ? form[f.key] : profile[f.key])}</strong>
                    </div>
                    {editing ? (
                      <input type="range" min={f.min} max={f.max} step={f.step}
                        value={form[f.key] ?? f.min}
                        onChange={e => setForm(p => ({ ...p, [f.key]: parseFloat(e.target.value) }))}
                        style={{ width: '100%', accentColor: 'var(--brand)' }} />
                    ) : (
                      <ScoreBar value={f.key === 'cgpa' ? (Number(profile[f.key]) || 0) * 10 : profile[f.key]} />
                    )}
                  </div>
                ))}
              </div>
            </div>

            {/* Skills */}
            <div className="card">
              <h3 style={{ marginBottom: 6 }}>Skills &amp; Assessment Scores</h3>
              <p style={{ color: 'var(--text-secondary)', fontSize: '0.8rem', marginBottom: 20 }}>
                {editing ? 'Drag sliders — AI will recalculate on save' : 'Based on your test performance'}
              </p>
              {SCORE_FIELDS.map(f => {
                const val = editing ? (form[f.key] ?? 0) : (profile[f.key] ?? 0)
                const insight = getInsight(f.key, val)
                return (
                  <div key={f.key} style={{ marginBottom: 18 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6, alignItems: 'center' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <span style={{ fontSize: '0.875rem', fontWeight: 500 }}>{f.label}</span>
                        <span style={{ background: insight.bg, color: insight.color,
                          padding: '1px 8px', borderRadius: 20, fontSize: '0.72rem', fontWeight: 600 }}>
                          {insight.label}
                        </span>
                      </div>
                      <strong style={{ fontFamily: 'Space Grotesk', fontSize: '0.95rem' }}>{Number(val)}/{f.max}</strong>
                    </div>
                    {editing ? (
                      <input type="range" min={0} max={f.max} step={1}
                        value={Number(form[f.key]) || 0}
                        onChange={e => setForm(p => ({ ...p, [f.key]: parseInt(e.target.value) }))}
                        style={{ width: '100%', accentColor: insight.color }} />
                    ) : (
                      <ScoreBar value={val} max={f.max} />
                    )}
                  </div>
                )
              })}
            </div>

            {/* Bottom buttons */}
            <div style={{ display: 'flex', gap: 12 }}>
              <button className="btn btn-primary btn-full btn-lg" onClick={() => nav('/student/analysis')}>
                <Brain size={16} /> View AI Analysis
              </button>
              <button className="btn btn-outline btn-full btn-lg" onClick={() => nav('/student/learning-path')}>
                My Learning Path
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
