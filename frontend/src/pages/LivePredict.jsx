import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Brain, Zap, TrendingUp, Target, BookOpen, AlertTriangle, CheckCircle, RotateCcw, UserPlus } from 'lucide-react'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Cell, ResponsiveContainer } from 'recharts'
import { predictAPI } from '../utils/api.js'

const FIELDS = [
  { key:'name',               label:'Full Name',             type:'text',   placeholder:'e.g. Arjun Sharma',        min:null, max:null,  step:null,  group:'personal' },
  { key:'email',              label:'Email Address',         type:'email',  placeholder:'e.g. arjun@college.edu',   min:null, max:null,  step:null,  group:'personal' },
  { key:'cgpa',               label:'CGPA (out of 10)',      type:'number', placeholder:'e.g. 7.8',                 min:0,    max:10,    step:0.1,   group:'academic' },
  { key:'attendance',         label:'Attendance (%)',        type:'number', placeholder:'e.g. 85',                  min:0,    max:100,   step:0.1,   group:'academic' },
  { key:'aptitude_score',     label:'Aptitude Score (0-100)',type:'number', placeholder:'e.g. 72',                  min:0,    max:100,   step:1,     group:'scores'   },
  { key:'technical_score',    label:'Technical Score (0-100)',type:'number',placeholder:'e.g. 68',                  min:0,    max:100,   step:1,     group:'scores'   },
  { key:'coding_score',       label:'Coding Score (0-100)',  type:'number', placeholder:'e.g. 65',                  min:0,    max:100,   step:1,     group:'scores'   },
  { key:'communication_score',label:'Communication (0-100)', type:'number', placeholder:'e.g. 75',                  min:0,    max:100,   step:1,     group:'scores'   },
  { key:'resume_quality',     label:'Resume Quality (0-100)',type:'number', placeholder:'e.g. 70',                  min:0,    max:100,   step:1,     group:'scores'   },
  { key:'consistency_score',  label:'Consistency (0-100)',   type:'number', placeholder:'e.g. 72',                  min:0,    max:100,   step:1,     group:'scores'   },
  { key:'internships',        label:'No. of Internships',    type:'number', placeholder:'e.g. 1',                   min:0,    max:10,    step:1,     group:'experience'},
  { key:'projects',           label:'No. of Projects',       type:'number', placeholder:'e.g. 3',                   min:0,    max:20,    step:1,     group:'experience'},
]

const EMPTY = Object.fromEntries(FIELDS.map(f => [f.key, '']))

const EXAMPLE_DATA = {
  name:'Arjun Sharma', email:'arjun@college.edu',
  cgpa:7.2, attendance:82, aptitude_score:68, technical_score:65,
  coding_score:60, communication_score:72, resume_quality:65,
  consistency_score:68, internships:1, projects:2
}

const IMPACT_COLORS = { positive:'#10B981', negative:'#EF4444', neutral:'#F59E0B' }

function CircleScore({ value, size=120 }) {
  const r = (size/2) - 10
  const c = 2 * Math.PI * r
  const fill = (value / 100) * c
  const color = value >= 70 ? '#10B981' : value >= 50 ? '#F59E0B' : '#EF4444'
  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
      <circle cx={size/2} cy={size/2} r={r} fill="none" stroke="#E5E7EB" strokeWidth="9"/>
      <circle cx={size/2} cy={size/2} r={r} fill="none" stroke={color} strokeWidth="9"
        strokeDasharray={`${fill} ${c}`} strokeLinecap="round"
        transform={`rotate(-90 ${size/2} ${size/2})`}/>
      <text x={size/2} y={size/2 - 4} textAnchor="middle"
        fontFamily="Space Grotesk" fontWeight="700" fontSize={size/5} fill={color}>
        {value}%
      </text>
      <text x={size/2} y={size/2 + 14} textAnchor="middle"
        fontFamily="DM Sans" fontSize="10" fill="#9CA3AF">
        Readiness
      </text>
    </svg>
  )
}

function RiskPill({ level }) {
  const map = {
    'Low Risk':    { bg:'#D1FAE5', color:'#065F46', border:'#6EE7B7' },
    'Medium Risk': { bg:'#FEF3C7', color:'#92400E', border:'#FCD34D' },
    'High Risk':   { bg:'#FEE2E2', color:'#991B1B', border:'#FCA5A5' },
  }
  const s = map[level] || map['Medium Risk']
  return (
    <span style={{ background:s.bg, color:s.color, border:`1.5px solid ${s.border}`,
      padding:'4px 14px', borderRadius:20, fontWeight:700, fontSize:'0.85rem' }}>
      {level}
    </span>
  )
}

export default function LivePredict() {
  const nav = useNavigate()
  const [form, setForm]       = useState(EMPTY)
  const [errors, setErrors]   = useState({})
  const [loading, setLoading] = useState(false)
  const [result, setResult]   = useState(null)
  const [saveMsg, setSaveMsg] = useState('')
  const [saving, setSaving]   = useState(false)

  const set = (k, v) => {
    setForm(p => ({ ...p, [k]: v }))
    setErrors(p => ({ ...p, [k]: '' }))
  }

  const validate = () => {
    const e = {}
    FIELDS.forEach(f => {
      const v = form[f.key]
      if (f.key === 'email') return          // optional
      if (v === '' || v === null || v === undefined) {
        if (f.key !== 'name') e[f.key] = 'Required'
      }
      if (f.type === 'number' && v !== '') {
        const n = parseFloat(v)
        if (isNaN(n)) e[f.key] = 'Must be a number'
        else if (f.min !== null && n < f.min) e[f.key] = `Min ${f.min}`
        else if (f.max !== null && n > f.max) e[f.key] = `Max ${f.max}`
      }
    })
    if (!form.name.trim()) e.name = 'Name is required'
    setErrors(e)
    return Object.keys(e).length === 0
  }

  const handlePredict = async () => {
    if (!validate()) return
    setLoading(true)
    setResult(null)
    try {
      const payload = { ...form }
      FIELDS.filter(f => f.type === 'number').forEach(f => {
        payload[f.key] = parseFloat(form[f.key])
      })
      const res = await predictAPI.livePrediction(payload)
      setResult(res.data)
      setTimeout(() => {
        document.getElementById('result-section')?.scrollIntoView({ behavior:'smooth' })
      }, 100)
    } catch(e) {
      alert('Prediction failed: ' + (e.response?.data?.error || e.message))
    } finally {
      setLoading(false)
    }
  }

  const handleSaveAndRegister = async () => {
    setSaving(true)
    try {
      const payload = { ...form }
      FIELDS.filter(f => f.type === 'number').forEach(f => {
        payload[f.key] = parseFloat(form[f.key])
      })
      const res = await predictAPI.registerStudent(payload)
      setSaveMsg(`Student registered with ID: ${res.data.student_id}. They can now login!`)
    } catch(e) {
      setSaveMsg('Save failed: ' + (e.response?.data?.error || e.message))
    } finally {
      setSaving(false)
    }
  }

  const fillExample = () => {
    setForm({ ...EMPTY, ...Object.fromEntries(Object.entries(EXAMPLE_DATA).map(([k,v])=>[k,String(v)])) })
    setErrors({})
    setResult(null)
    setSaveMsg('')
  }

  const reset = () => { setForm(EMPTY); setErrors({}); setResult(null); setSaveMsg('') }

  const groups = [
    { id:'personal',   label:'👤 Personal Information' },
    { id:'academic',   label:'🎓 Academic Details' },
    { id:'scores',     label:'📊 Assessment Scores' },
    { id:'experience', label:'💼 Experience' },
  ]

  const fiData = (result?.feature_importance || []).slice(0, 8).map(f => ({
    label: f.label.replace(' Score','').replace(' Skills',''),
    impact: f.impact,
    direction: f.direction
  }))

  return (
    <div style={{ minHeight:'100vh', background:'var(--bg)' }}>

      {/* Header */}
      <header style={{
        background:'linear-gradient(135deg,#5B21B6,#7C3AED)',
        padding:'16px 32px', display:'flex', alignItems:'center',
        justifyContent:'space-between', position:'sticky', top:0, zIndex:100,
        boxShadow:'0 2px 16px rgba(91,33,182,0.3)'
      }}>
        <div style={{ display:'flex', alignItems:'center', gap:10, color:'white' }}>
          <Brain size={28} color="white"/>
          <div>
            <div style={{ fontFamily:'Space Grotesk', fontWeight:700, fontSize:'1.1rem' }}>
              PlaceAI – Live Prediction Demo
            </div>
            <div style={{ fontSize:'0.75rem', color:'rgba(255,255,255,0.75)' }}>
              Enter student data → get instant AI prediction
            </div>
          </div>
        </div>
        <div style={{ display:'flex', gap:10 }}>
          <button onClick={fillExample} style={{
            background:'rgba(255,255,255,0.2)', border:'none', color:'white',
            padding:'8px 16px', borderRadius:8, cursor:'pointer',
            fontFamily:'DM Sans', fontWeight:600, fontSize:'0.875rem',
            display:'flex', alignItems:'center', gap:6
          }}>
            <Zap size={15}/> Load Example Data
          </button>
          <button onClick={reset} style={{
            background:'transparent', border:'1px solid rgba(255,255,255,0.4)',
            color:'white', padding:'8px 14px', borderRadius:8, cursor:'pointer',
            fontFamily:'DM Sans', fontSize:'0.875rem',
            display:'flex', alignItems:'center', gap:6
          }}>
            <RotateCcw size={14}/> Reset
          </button>
          <button onClick={() => nav('/')} style={{
            background:'transparent', border:'none', color:'rgba(255,255,255,0.7)',
            padding:'8px 14px', borderRadius:8, cursor:'pointer', fontFamily:'DM Sans'
          }}>← Home</button>
        </div>
      </header>

      <div style={{ maxWidth:1100, margin:'0 auto', padding:'28px 24px' }}>

        {/* Intro banner */}
        <div style={{
          background:'linear-gradient(135deg,#EDE9FE,#DDD6FE)',
          border:'1px solid #C4B5FD', borderRadius:14,
          padding:'18px 24px', marginBottom:28,
          display:'flex', alignItems:'center', gap:14
        }}>
          <div style={{ fontSize:'2rem' }}>🎯</div>
          <div>
            <div style={{ fontFamily:'Space Grotesk', fontWeight:700, fontSize:'1rem', color:'#4C1D95', marginBottom:4 }}>
              How this works
            </div>
            <div style={{ color:'#5B21B6', fontSize:'0.875rem', lineHeight:1.6 }}>
              Fill in the student details below and click <strong>Predict Now</strong>.
              The AI model will analyze all parameters and instantly show placement readiness,
              risk level, skill gaps, and a personalized learning path — all computed live.
            </div>
          </div>
        </div>

        <div style={{ display:'grid', gridTemplateColumns: result ? '1fr 1fr' : '1fr', gap:28, alignItems:'start' }}>

          {/* ── LEFT: Input Form ── */}
          <div>
            <div className="card" style={{ padding:28 }}>
              <div style={{ display:'flex', alignItems:'center', gap:10, marginBottom:24 }}>
                <UserPlus size={22} color="var(--brand)"/>
                <h2 style={{ fontSize:'1.1rem' }}>Student Data Entry</h2>
              </div>

              {groups.map(g => {
                const gFields = FIELDS.filter(f => f.group === g.id)
                return (
                  <div key={g.id} style={{ marginBottom:24 }}>
                    <div style={{
                      fontFamily:'Space Grotesk', fontWeight:600, fontSize:'0.85rem',
                      color:'var(--brand)', marginBottom:14, padding:'6px 12px',
                      background:'#F5F3FF', borderRadius:8, display:'inline-block'
                    }}>{g.label}</div>
                    <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:12 }}>
                      {gFields.map(f => (
                        <div key={f.key} style={{ gridColumn: (f.type==='text'||f.type==='email') ? 'span 2' : 'span 1' }}>
                          <label style={{
                            display:'block', fontSize:'0.78rem', fontWeight:600,
                            color:'var(--text-secondary)', textTransform:'uppercase',
                            letterSpacing:'0.04em', marginBottom:5
                          }}>{f.label}</label>
                          <input
                            type={f.type}
                            placeholder={f.placeholder}
                            value={form[f.key]}
                            min={f.min ?? undefined}
                            max={f.max ?? undefined}
                            step={f.step ?? undefined}
                            onChange={e => set(f.key, e.target.value)}
                            style={{
                              width:'100%', padding:'9px 13px',
                              border:`1.5px solid ${errors[f.key] ? '#EF4444' : 'var(--border)'}`,
                              borderRadius:8, fontSize:'0.9rem', fontFamily:'DM Sans',
                              outline:'none', color:'var(--text-primary)',
                              background: errors[f.key] ? '#FEF2F2' : 'white'
                            }}
                          />
                          {errors[f.key] && (
                            <div style={{ color:'#EF4444', fontSize:'0.73rem', marginTop:2 }}>
                              ⚠ {errors[f.key]}
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )
              })}

              <button
                onClick={handlePredict}
                disabled={loading}
                style={{
                  width:'100%', padding:'14px', borderRadius:10,
                  background: loading ? '#9CA3AF' : 'linear-gradient(135deg,#5B21B6,#7C3AED)',
                  color:'white', border:'none', fontFamily:'DM Sans',
                  fontWeight:700, fontSize:'1rem', cursor: loading ? 'not-allowed' : 'pointer',
                  display:'flex', alignItems:'center', justifyContent:'center', gap:10,
                  transition:'all 0.2s', boxShadow: loading ? 'none' : '0 4px 16px rgba(91,33,182,0.35)'
                }}
              >
                {loading
                  ? <><div style={{ width:20,height:20,border:'2px solid rgba(255,255,255,0.3)',
                      borderTopColor:'white',borderRadius:'50%',
                      animation:'spin 0.8s linear infinite'}}/> Running AI Model…</>
                  : <><Brain size={20}/> Predict Placement Readiness</>
                }
              </button>

              {result && (
                <button
                  onClick={handleSaveAndRegister}
                  disabled={saving}
                  style={{
                    width:'100%', marginTop:10, padding:'11px',
                    borderRadius:10, background:'transparent',
                    border:'1.5px solid var(--green)', color:'var(--green)',
                    fontFamily:'DM Sans', fontWeight:600, fontSize:'0.9rem',
                    cursor: saving ? 'not-allowed' : 'pointer',
                    display:'flex', alignItems:'center', justifyContent:'center', gap:8
                  }}
                >
                  <UserPlus size={16}/>
                  {saving ? 'Saving…' : 'Save Student to System'}
                </button>
              )}

              {saveMsg && (
                <div style={{
                  marginTop:10, padding:'10px 14px', borderRadius:8,
                  background: saveMsg.includes('failed') ? '#FEF2F2' : '#ECFDF5',
                  color: saveMsg.includes('failed') ? 'var(--red)' : 'var(--green)',
                  fontSize:'0.85rem', display:'flex', alignItems:'center', gap:8
                }}>
                  {saveMsg.includes('failed') ? '⚠' : <CheckCircle size={15}/>} {saveMsg}
                </div>
              )}
            </div>
          </div>

          {/* ── RIGHT: Results ── */}
          {result && (
            <div id="result-section">

              {/* Big result card */}
              <div style={{
                background:'linear-gradient(135deg,#1E1040,#2D1B69)',
                borderRadius:16, padding:'28px 24px', marginBottom:20, color:'white'
              }}>
                <div style={{ display:'flex', alignItems:'center', gap:10, marginBottom:20 }}>
                  <Brain size={20} color="#A78BFA"/>
                  <span style={{ fontFamily:'Space Grotesk', fontWeight:700, fontSize:'1rem' }}>
                    AI Prediction Result for {result.student_name}
                  </span>
                </div>
                <div style={{ display:'flex', alignItems:'center', gap:28, flexWrap:'wrap' }}>
                  <CircleScore value={result.readiness_score}/>
                  <div style={{ flex:1 }}>
                    <div style={{ marginBottom:14 }}>
                      <div style={{ fontSize:'0.75rem', color:'rgba(255,255,255,0.6)', marginBottom:6 }}>Risk Level</div>
                      <RiskPill level={result.risk_level}/>
                    </div>
                    <div style={{ marginBottom:14 }}>
                      <div style={{ fontSize:'0.75rem', color:'rgba(255,255,255,0.6)', marginBottom:4 }}>Placement Probability</div>
                      <div style={{ fontFamily:'Space Grotesk', fontWeight:700, fontSize:'1.6rem', color:'#34D399' }}>
                        {result.placement_probability}%
                      </div>
                    </div>
                    <div>
                      <div style={{ fontSize:'0.75rem', color:'rgba(255,255,255,0.6)', marginBottom:4 }}>Expected Salary</div>
                      <div style={{ fontFamily:'Space Grotesk', fontWeight:700, fontSize:'1.2rem', color:'#A78BFA' }}>
                        ₹{result.expected_salary_min}–{result.expected_salary_max}L
                      </div>
                    </div>
                  </div>
                </div>

                {/* Top companies */}
                <div style={{ marginTop:20, paddingTop:16, borderTop:'1px solid rgba(255,255,255,0.15)' }}>
                  <div style={{ fontSize:'0.75rem', color:'rgba(255,255,255,0.6)', marginBottom:10 }}>Top Company Matches</div>
                  <div style={{ display:'flex', gap:8 }}>
                    {result.top_companies?.map(c => (
                      <span key={c.name} style={{ padding:'4px 14px',
                        background:'rgba(255,255,255,0.12)', border:'1px solid rgba(255,255,255,0.2)',
                        borderRadius:20, fontSize:'0.8rem', fontWeight:500 }}>{c.name}</span>
                    ))}
                  </div>
                </div>
              </div>

              {/* Feature importance chart */}
              <div className="card" style={{ marginBottom:20 }}>
                <h3 style={{ fontSize:'0.95rem', marginBottom:4 }}>SHAP-Like Feature Importance</h3>
                <p style={{ color:'var(--text-secondary)', fontSize:'0.8rem', marginBottom:16 }}>
                  How each factor is influencing the readiness score
                </p>
                <ResponsiveContainer width="100%" height={250}>
                  <BarChart data={fiData} layout="vertical" margin={{ left:110, right:30 }}>
                    <CartesianGrid strokeDasharray="3 3" horizontal={false}/>
                    <XAxis type="number" fontSize={11}/>
                    <YAxis dataKey="label" type="category" width={105} fontSize={11} tick={{ fill:'#6B7280' }}/>
                    <Tooltip formatter={v => [v.toFixed(2), 'Impact Weight']}/>
                    <Bar dataKey="impact" radius={[0,4,4,0]}>
                      {fiData.map((d,i) => (
                        <Cell key={i} fill={IMPACT_COLORS[d.direction]}/>
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
                <div style={{ display:'flex', gap:16, marginTop:8, fontSize:'0.78rem' }}>
                  {[['#10B981','Positive (helping)'],['#EF4444','Negative (hurting)'],['#F59E0B','Neutral']].map(([c,l])=>(
                    <div key={l} style={{ display:'flex', alignItems:'center', gap:5 }}>
                      <div style={{ width:10,height:10,borderRadius:2,background:c }}/>{l}
                    </div>
                  ))}
                </div>
              </div>

              {/* Top skill gaps */}
              {result.skill_gaps?.gaps?.length > 0 && (
                <div className="card" style={{ marginBottom:20 }}>
                  <div style={{ display:'flex', alignItems:'center', gap:8, marginBottom:16 }}>
                    <Target size={18} color="var(--gold)"/>
                    <h3 style={{ fontSize:'0.95rem' }}>Top Skill Gaps to Fix</h3>
                    <span style={{ marginLeft:'auto', background:'#FEF3C7', color:'var(--gold)',
                      padding:'2px 10px', borderRadius:20, fontSize:'0.75rem', fontWeight:600 }}>
                      {result.skill_gaps.high_priority_gaps} High Priority
                    </span>
                  </div>
                  {result.skill_gaps.gaps.slice(0,4).map(g => (
                    <div key={g.feature} style={{ marginBottom:14 }}>
                      <div style={{ display:'flex', justifyContent:'space-between', marginBottom:5 }}>
                        <span style={{ fontSize:'0.875rem', fontWeight:500 }}>{g.skill}</span>
                        <div style={{ display:'flex', gap:8, alignItems:'center' }}>
                          <span style={{ color:'var(--brand)', fontWeight:700, fontSize:'0.85rem' }}>{g.current}</span>
                          <span style={{ color:'var(--text-muted)', fontSize:'0.78rem' }}>/ {g.required} needed</span>
                          <span style={{
                            background: g.priority==='High' ? '#FEE2E2' : '#FEF3C7',
                            color: g.priority==='High' ? 'var(--red)' : 'var(--gold)',
                            padding:'2px 8px', borderRadius:20, fontSize:'0.72rem', fontWeight:600
                          }}>{g.priority}</span>
                        </div>
                      </div>
                      <div className="progress-bar">
                        <div className="progress-fill" style={{
                          width:`${g.your_progress}%`,
                          background: g.priority==='High' ? 'var(--red)' : 'var(--gold)'
                        }}/>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* Learning path summary */}
              {result.learning_path_summary && (
                <div className="card" style={{ background:'#ECFDF5', border:'1px solid #A7F3D0' }}>
                  <div style={{ display:'flex', alignItems:'center', gap:8, marginBottom:14 }}>
                    <BookOpen size={18} color="var(--green)"/>
                    <h3 style={{ fontSize:'0.95rem' }}>AI-Generated Learning Plan</h3>
                  </div>
                  <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr 1fr', gap:12 }}>
                    {[
                      ['Modules', result.learning_path_summary.total_modules],
                      ['Weeks Needed', result.learning_path_summary.estimated_weeks + '–' + (result.learning_path_summary.estimated_weeks+2)],
                      ['Start With', null],
                    ].map(([label, val]) => (
                      <div key={label} style={{ background:'white', borderRadius:8, padding:'12px 14px' }}>
                        <div style={{ fontSize:'0.75rem', color:'var(--text-secondary)', marginBottom:4 }}>{label}</div>
                        <div style={{ fontFamily:'Space Grotesk', fontWeight:700, fontSize: val===null ? '0.8rem' : '1.2rem', color:'var(--green)' }}>
                          {val ?? result.learning_path_summary.top_module}
                        </div>
                      </div>
                    ))}
                  </div>
                  <div style={{ marginTop:14, padding:'10px 14px', background:'white', borderRadius:8,
                    fontSize:'0.82rem', color:'var(--text-secondary)', borderLeft:'3px solid var(--green)' }}>
                    <strong>Next step:</strong> Focus on {result.skill_gaps?.gaps?.[0]?.skill} first — it has the biggest impact on your readiness score.
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      <style>{`@keyframes spin { to { transform:rotate(360deg); } }`}</style>
    </div>
  )
}
