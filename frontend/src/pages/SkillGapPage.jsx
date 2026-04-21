import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Target, RefreshCw } from 'lucide-react'
import { RadarChart, Radar, PolarGrid, PolarAngleAxis, ResponsiveContainer,
         BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Cell, Legend } from 'recharts'
import Header from '../components/shared/Header.jsx'
import { studentAPI } from '../utils/api.js'

const PC = { High:'#EF4444', Medium:'#F59E0B', Low:'#10B981' }

export default function SkillGapPage() {
  const nav = useNavigate()
  const studentId   = localStorage.getItem('student_id') || 'S001'
  const studentName = localStorage.getItem('student_name') || ''
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError]     = useState('')

  const load = () => {
    setLoading(true); setError('')
    studentAPI.getSkillGaps(studentId)
      .then(r => {
        if (!r.data || !r.data.gaps) throw new Error('No gap data received')
        setData(r.data)
      })
      .catch(e => setError(e?.response?.data?.error || e.message))
      .finally(() => setLoading(false))
  }

  useEffect(() => { load() }, [])

  if (loading) return (
    <div className="page-wrapper"><Header studentName={studentName}/>
      <div className="loading-spinner"><div className="spinner"/><span>Analyzing skill gaps...</span></div>
    </div>
  )

  if (error || !data) return (
    <div className="page-wrapper"><Header studentName={studentName}/>
      <div className="content-area" style={{textAlign:'center',padding:48}}>
        <p style={{color:'var(--red)',marginBottom:20}}>{error||'Failed to load skill gaps'}</p>
        <button className="btn btn-brand" onClick={load}><RefreshCw size={14}/> Retry</button>
      </div>
    </div>
  )

  // Build radar data from actual gap data
  const radarKeys = ['coding_score','technical_score','communication_score','aptitude_score','resume_quality','projects']
  const radarData = radarKeys.map(k => {
    const g = data.gaps.find(x => x.feature === k) || {}
    return {
      skill: (g.skill || k).replace(' Score','').replace(' Skills','').replace(' Quality',''),
      'Your Score': g.current || 0,
      'Required':   g.required || 75,
      'Industry Avg': g.industry_avg || 70,
    }
  })

  const barData = data.gaps.slice(0,6).map(g => ({
    name: g.skill.replace(' Score','').replace(' Skills','').replace(' Quality',''),
    gap:  g.gap_magnitude, priority: g.priority, full: g.skill
  }))

  return (
    <div className="page-wrapper">
      <Header studentName={studentName}/>
      <div className="content-area fade-in">
        {/* Header */}
        <div style={{background:'linear-gradient(135deg,#D97706,#F59E0B)',borderRadius:14,
          padding:'20px 24px',marginBottom:24,display:'flex',alignItems:'center',gap:12,color:'white'}}>
          <button onClick={() => nav('/student')} style={{background:'none',border:'none',color:'white',cursor:'pointer',fontSize:'1.1rem'}}>←</button>
          <Target size={24}/><div>
            <h2 style={{color:'white',marginBottom:2}}>Skill Gap Analysis</h2>
            <p style={{color:'rgba(255,255,255,0.8)',fontSize:'0.875rem'}}>Compare your skills with what companies actually expect</p>
          </div>
          <button onClick={load} className="btn btn-sm" style={{marginLeft:'auto',background:'rgba(255,255,255,0.2)',border:'none',color:'white'}}>
            <RefreshCw size={13}/> Refresh
          </button>
        </div>

        {/* KPIs */}
        <div className="stats-grid" style={{gridTemplateColumns:'repeat(4,1fr)',marginBottom:24}}>
          <div className="stat-card"><div className="label">Total Skills Analyzed</div>
            <div className="value">{data.total_skills}</div></div>
          <div className="stat-card" style={{background:'#FEF2F2',borderColor:'#FECACA'}}>
            <div className="label" style={{color:'var(--red)'}}>High Priority Gaps</div>
            <div className="value" style={{color:'var(--red)'}}>{data.high_priority_gaps}</div></div>
          <div className="stat-card" style={{background:'#FFFBEB',borderColor:'#FDE68A'}}>
            <div className="label" style={{color:'var(--gold)'}}>Medium Priority Gaps</div>
            <div className="value" style={{color:'var(--gold)'}}>{data.medium_priority_gaps}</div></div>
          <div className="stat-card" style={{background:'#ECFDF5',borderColor:'#A7F3D0'}}>
            <div className="label" style={{color:'var(--green)'}}>Average Gap Score</div>
            <div className="value" style={{color:'var(--green)'}}>{data.average_gap_score}</div></div>
        </div>

        {/* Charts */}
        <div className="grid-2" style={{marginBottom:24}}>
          <div className="card">
            <h3 style={{marginBottom:4}}>Skills Comparison Radar</h3>
            <p style={{color:'var(--text-secondary)',fontSize:'0.8rem',marginBottom:16}}>Your score vs required vs industry average</p>
            <ResponsiveContainer width="100%" height={280}>
              <RadarChart data={radarData}>
                <PolarGrid stroke="#E5E7EB"/>
                <PolarAngleAxis dataKey="skill" tick={{fontSize:11,fill:'#6B7280'}}/>
                <Radar name="Your Score"    dataKey="Your Score"    stroke="#5B21B6" fill="#5B21B6" fillOpacity={0.3} strokeWidth={2}/>
                <Radar name="Required"      dataKey="Required"      stroke="#EF4444" fill="none" strokeWidth={1.5} strokeDasharray="4 2"/>
                <Radar name="Industry Avg"  dataKey="Industry Avg"  stroke="#10B981" fill="none" strokeWidth={1.5} strokeDasharray="2 2"/>
                <Legend iconSize={10} wrapperStyle={{fontSize:'0.78rem'}}/>
                <Tooltip/>
              </RadarChart>
            </ResponsiveContainer>
            <div style={{marginTop:8,padding:'10px 14px',background:'#EFF6FF',border:'1px solid #BFDBFE',borderRadius:8,fontSize:'0.8rem',color:'#1D4ED8'}}>
              Areas where your score (blue) is below the required (red) need improvement.
            </div>
          </div>
          <div className="card">
            <h3 style={{marginBottom:4}}>Gap Magnitude by Skill</h3>
            <p style={{color:'var(--text-secondary)',fontSize:'0.8rem',marginBottom:16}}>Points needed to meet company requirements</p>
            {barData.length > 0 ? (
              <ResponsiveContainer width="100%" height={250}>
                <BarChart data={barData} layout="vertical" margin={{left:100,right:30}}>
                  <CartesianGrid strokeDasharray="3 3" horizontal={false}/>
                  <XAxis type="number" domain={[0,25]} fontSize={11}/>
                  <YAxis dataKey="name" type="category" width={95} fontSize={11} tick={{fill:'#6B7280'}}/>
                  <Tooltip content={({active,payload})=>{
                    if(!active||!payload?.length) return null
                    const d=payload[0].payload
                    return(<div style={{background:'white',border:'1px solid var(--border)',borderRadius:8,padding:'10px 14px'}}>
                      <strong>{d.full}</strong>
                      <div style={{fontSize:'0.85rem',color:'var(--text-secondary)'}}>Gap: {d.gap} pts</div>
                      <div style={{color:PC[d.priority],fontWeight:600,fontSize:'0.85rem'}}>Priority: {d.priority}</div>
                    </div>)
                  }}/>
                  <Bar dataKey="gap" radius={[0,4,4,0]}>
                    {barData.map((d,i)=><Cell key={i} fill={PC[d.priority]}/>)}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            ) : <p style={{color:'var(--text-muted)',textAlign:'center',padding:40}}>No gap data</p>}
            <div style={{display:'flex',gap:16,marginTop:10,fontSize:'0.78rem'}}>
              {[['#10B981','Small (<5)'],['#F59E0B','Medium (6-15)'],['#EF4444','Large (>15)']].map(([c,l])=>(
                <div key={l} style={{display:'flex',alignItems:'center',gap:5}}>
                  <div style={{width:10,height:10,borderRadius:2,background:c}}/>{l}
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Detailed breakdown */}
        <div className="card" style={{marginBottom:20}}>
          <div className="card-header"><Target size={18} color="var(--gold)"/>
            <h3>Detailed Skill-by-Skill Analysis</h3>
          </div>
          <p style={{color:'var(--text-secondary)',fontSize:'0.875rem',marginBottom:20}}>Actionable insights and what you need to do for each skill</p>
          <div style={{display:'flex',flexDirection:'column',gap:14}}>
            {data.gaps.map(gap => {
              const border = gap.priority==='High'?'#FECACA':gap.priority==='Medium'?'#FDE68A':'#A7F3D0'
              const bg     = gap.priority==='High'?'#FEF2F2':gap.priority==='Medium'?'#FFFBEB':'#ECFDF5'
              return (
                <div key={gap.feature} style={{border:`1px solid ${border}`,borderRadius:12,padding:'16px 20px',background:bg}}>
                  <div style={{display:'flex',alignItems:'center',gap:10,marginBottom:12}}>
                    <strong style={{fontSize:'0.95rem'}}>{gap.skill}</strong>
                    <span style={{background:PC[gap.priority],color:'white',padding:'2px 10px',borderRadius:20,fontSize:'0.72rem',fontWeight:700}}>{gap.priority} Priority</span>
                  </div>
                  <div style={{display:'grid',gridTemplateColumns:'repeat(4,1fr)',gap:14,marginBottom:10}}>
                    {[['Your Score',gap.current,'#5B21B6'],['Required',gap.required,'#EF4444'],
                      ['Gap',gap.gap>0?`-${gap.gap}`:'✓ Met',gap.gap>0?'#EF4444':'#10B981'],
                      ['Industry Avg',gap.industry_avg,'#10B981']].map(([lbl,val,col])=>(
                      <div key={lbl}><div style={{fontSize:'0.73rem',color:'var(--text-secondary)',marginBottom:3}}>{lbl}</div>
                        <div style={{fontFamily:'Space Grotesk',fontWeight:700,fontSize:'1.2rem',color:col}}>{val}</div>
                      </div>
                    ))}
                  </div>
                  <div style={{marginBottom:8}}>
                    <div style={{fontSize:'0.78rem',color:'var(--text-secondary)',marginBottom:4}}>Your Progress toward requirement: {gap.your_progress}%</div>
                    <div style={{height:7,background:'rgba(0,0,0,0.08)',borderRadius:4}}>
                      <div style={{height:'100%',width:`${gap.your_progress}%`,background:PC[gap.priority],borderRadius:4,transition:'width 0.6s'}}/>
                    </div>
                  </div>
                  <div style={{padding:'10px 14px',background:'white',borderRadius:8,fontSize:'0.85rem',color:'var(--text-secondary)',display:'flex',gap:8}}>
                    <span>📌</span><div><strong>Action: </strong>{gap.recommended_action}</div>
                  </div>
                </div>
              )
            })}
          </div>
        </div>

        {/* Industry insights */}
        <div className="card" style={{background:'#F8F7FF',border:'1px solid #DDD6FE'}}>
          <h3 style={{marginBottom:16}}>Industry Insights &amp; Company Expectations</h3>
          <div className="grid-2">
            <div>
              <h4 style={{color:'var(--brand)',marginBottom:14,fontSize:'0.875rem'}}>Top Companies Prioritize:</h4>
              {[['Data Structures & Algorithms','Essential for 85% of technical interviews'],
                ['System Design','Expected for mid-level and senior roles'],
                ['Communication','Critical for client-facing positions'],
                ['Project Portfolio','Demonstrates practical experience']].map(([t,d],i)=>(
                <div key={t} style={{marginBottom:10,display:'flex',gap:10}}>
                  <span style={{color:'var(--brand)',fontWeight:700}}>{i+1}.</span>
                  <div><strong style={{fontSize:'0.875rem'}}>{t}:</strong><span style={{color:'var(--text-secondary)',fontSize:'0.85rem'}}> {d}</span></div>
                </div>
              ))}
            </div>
            <div>
              <h4 style={{color:'var(--brand)',marginBottom:14,fontSize:'0.875rem'}}>Industry Survey Insights:</h4>
              {[['78% of recruiters','Look for strong problem-solving skills over grades'],
                ['65% of companies','Require at least 1 internship or project experience'],
                ['92% of placements','Involved candidates with 70+ coding proficiency']].map(([stat,desc])=>(
                <div key={stat} style={{marginBottom:10,padding:'10px 14px',background:'white',borderRadius:8,border:'1px solid var(--border)'}}>
                  <div style={{fontWeight:700,fontSize:'0.9rem',marginBottom:2}}>{stat}</div>
                  <div style={{color:'var(--text-secondary)',fontSize:'0.8rem'}}>{desc}</div>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div style={{display:'flex',gap:12,marginTop:24}}>
          <button className="btn btn-primary btn-lg" onClick={() => nav('/student/learning-path')}>View Personalized Learning Path</button>
          <button className="btn btn-outline btn-lg" onClick={() => nav('/student/what-if')}>Run What-If Analysis</button>
        </div>
      </div>
    </div>
  )
}
