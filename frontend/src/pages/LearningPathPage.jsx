import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { BookOpen, Clock, CheckCircle, ChevronDown, ChevronUp, RefreshCw } from 'lucide-react'
import Header from '../components/shared/Header.jsx'
import { studentAPI } from '../utils/api.js'

const PC = { High:'#EF4444', Medium:'#F59E0B', Low:'#10B981' }
const PBG= { High:'#FEF2F2', Medium:'#FFFBEB', Low:'#ECFDF5' }
const PBR= { High:'#FECACA', Medium:'#FDE68A', Low:'#A7F3D0' }

function ModuleCard({ module }) {
  const [open, setOpen] = useState(false)
  const col = PC[module.priority]; const bg = PBG[module.priority]; const br = PBR[module.priority]
  const resources = [
    'LeetCode / Striver DSA Sheet','YouTube — Gate Smashers / Abdul Bari','GeeksforGeeks Practice'
  ]
  return (
    <div style={{border:`1px solid ${br}`,borderRadius:12,overflow:'hidden',marginBottom:14}}>
      <div style={{background:bg,padding:'18px 22px'}}>
        <div style={{display:'flex',gap:14,alignItems:'flex-start'}}>
          <div style={{width:34,height:34,borderRadius:'50%',border:`2px solid ${col}`,
            display:'flex',alignItems:'center',justifyContent:'center',
            fontFamily:'Space Grotesk',fontWeight:700,color:col,flexShrink:0,fontSize:'0.9rem'}}>
            {module.module_num}
          </div>
          <div style={{flex:1}}>
            <div style={{display:'flex',alignItems:'center',gap:8,marginBottom:6,flexWrap:'wrap'}}>
              <strong style={{fontSize:'0.95rem'}}>{module.title}</strong>
              <span style={{background:col,color:'white',padding:'2px 10px',borderRadius:20,fontSize:'0.72rem',fontWeight:700}}>
                {module.priority} Priority
              </span>
            </div>
            <p style={{color:'var(--text-secondary)',fontSize:'0.85rem',marginBottom:12}}>{module.description}</p>
            <div style={{display:'flex',gap:20,fontSize:'0.8rem',color:'var(--text-secondary)',marginBottom:10}}>
              <span><Clock size={12} style={{verticalAlign:'middle',marginRight:4}}/>{module.duration}</span>
              <span>📚 {module.resources} Resources</span>
              <span>🎯 {module.skills_covered} Skills</span>
            </div>
            <div style={{fontSize:'0.78rem',color:'var(--text-secondary)',marginBottom:5}}>Progress: {module.progress}%</div>
            <div style={{height:7,background:'rgba(0,0,0,0.08)',borderRadius:4,marginBottom:12}}>
              <div style={{height:'100%',width:`${module.progress}%`,background:col,borderRadius:4}}/>
            </div>
            <div style={{display:'flex',gap:10}}>
              <button onClick={() => setOpen(o=>!o)} style={{background:'transparent',border:'1px solid var(--border)',
                borderRadius:8,padding:'7px 14px',fontSize:'0.82rem',cursor:'pointer',fontFamily:'DM Sans',
                display:'flex',alignItems:'center',gap:6}}>
                View Resources {open?<ChevronUp size={13}/>:<ChevronDown size={13}/>}
              </button>
              <button style={{background:'transparent',border:'1px solid var(--border)',borderRadius:8,
                padding:'7px 14px',fontSize:'0.82rem',cursor:'pointer',fontFamily:'DM Sans'}}>
                Continue Learning
              </button>
            </div>
          </div>
        </div>
      </div>
      {open && (
        <div style={{padding:'14px 22px',borderTop:`1px solid ${br}`,background:'white'}}>
          <h4 style={{fontSize:'0.85rem',marginBottom:10,color:'var(--brand)'}}>Recommended Resources:</h4>
          {resources.map(r=>(
            <div key={r} style={{display:'flex',alignItems:'center',gap:8,padding:'7px 12px',
              background:'var(--bg)',borderRadius:7,border:'1px solid var(--border)',marginBottom:7,fontSize:'0.85rem'}}>
              <CheckCircle size={13} color="var(--green)"/> {r}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

export default function LearningPathPage() {
  const nav = useNavigate()
  const studentId   = localStorage.getItem('student_id')||'S001'
  const studentName = localStorage.getItem('student_name')||''
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError]     = useState('')

  const load = () => {
    setLoading(true); setError('')
    studentAPI.getLearningPath(studentId)
      .then(r => {
        if(!r.data||!r.data.modules) throw new Error('No learning path data')
        setData(r.data)
      })
      .catch(e => setError(e?.response?.data?.error||e.message))
      .finally(() => setLoading(false))
  }

  useEffect(() => { load() },[])

  if(loading) return(
    <div className="page-wrapper"><Header studentName={studentName}/>
      <div className="loading-spinner"><div className="spinner"/><span>Generating your personalized learning path...</span></div>
    </div>
  )
  if(error||!data) return(
    <div className="page-wrapper"><Header studentName={studentName}/>
      <div className="content-area" style={{textAlign:'center',padding:48}}>
        <p style={{color:'var(--red)',marginBottom:20}}>{error||'Failed to load'}</p>
        <button className="btn btn-brand" onClick={load}><RefreshCw size={14}/> Retry</button>
      </div>
    </div>
  )

  const completionDate = new Date()
  completionDate.setMonth(completionDate.getMonth() + Math.ceil((data.estimated_weeks||18)/4))
  const dateStr = completionDate.toLocaleString('default',{month:'long',year:'numeric'})

  return (
    <div className="page-wrapper">
      <Header studentName={studentName}/>
      <div className="content-area fade-in">
        <div style={{background:'linear-gradient(135deg,#065F46,#10B981)',borderRadius:14,
          padding:'20px 24px',marginBottom:24,display:'flex',alignItems:'center',gap:12,color:'white'}}>
          <button onClick={() => nav('/student')} style={{background:'none',border:'none',color:'white',cursor:'pointer',fontSize:'1.1rem'}}>←</button>
          <BookOpen size={24}/>
          <div>
            <h2 style={{color:'white',marginBottom:2}}>Personalized Learning Path</h2>
            <p style={{color:'rgba(255,255,255,0.8)',fontSize:'0.875rem'}}>AI-generated roadmap prioritized by your skill gaps</p>
          </div>
          <button onClick={load} className="btn btn-sm" style={{marginLeft:'auto',background:'rgba(255,255,255,0.2)',border:'none',color:'white'}}>
            <RefreshCw size={13}/> Refresh
          </button>
        </div>

        {/* KPIs */}
        <div className="stats-grid" style={{gridTemplateColumns:'repeat(4,1fr)',marginBottom:24}}>
          <div className="stat-card"><div className="label">Total Modules</div>
            <div className="value">{data.total_modules}</div><div className="sub-value">In your learning path</div></div>
          <div className="stat-card" style={{borderColor:'#BFDBFE',background:'#EFF6FF'}}>
            <div className="label" style={{color:'#1D4ED8'}}>In Progress</div>
            <div className="value" style={{color:'#1D4ED8'}}>{data.in_progress}</div>
            <div className="sub-value" style={{color:'#1D4ED8'}}>Modules started</div></div>
          <div className="stat-card" style={{borderColor:'#A7F3D0',background:'#ECFDF5'}}>
            <div className="label" style={{color:'var(--green)'}}>Completed</div>
            <div className="value" style={{color:'var(--green)'}}>{data.completed}</div>
            <div className="sub-value" style={{color:'var(--green)'}}>Modules finished</div></div>
          <div className="stat-card" style={{borderColor:'#DDD6FE',background:'#F5F3FF'}}>
            <div className="label" style={{color:'var(--brand)'}}>Overall Progress</div>
            <div className="value" style={{color:'var(--brand)'}}>{data.overall_progress}%</div>
            <div className="progress-bar" style={{marginTop:6}}>
              <div className="progress-fill primary" style={{width:`${data.overall_progress}%`}}/>
            </div>
          </div>
        </div>

        {/* Modules */}
        <div className="card" style={{marginBottom:20}}>
          <h3 style={{marginBottom:4}}>Your Customized Learning Roadmap</h3>
          <p style={{color:'var(--text-secondary)',fontSize:'0.875rem',marginBottom:20}}>
            Modules are prioritized based on your skill gaps and company requirements
          </p>
          {(data.modules||[]).length===0
            ? <p style={{color:'var(--text-muted)',textAlign:'center',padding:32}}>No modules generated. Please refresh.</p>
            : (data.modules||[]).map(m => <ModuleCard key={m.feature||m.title} module={m}/>)
          }
        </div>

        {/* Schedule & tips */}
        <div className="card" style={{marginBottom:20,background:'#F8F7FF',border:'1px solid #DDD6FE'}}>
          <h3 style={{marginBottom:16}}>Learning Path Recommendations</h3>
          <div className="grid-2">
            <div>
              <h4 style={{color:'var(--brand)',marginBottom:14,fontSize:'0.875rem'}}>Suggested Study Schedule:</h4>
              {Object.entries(data.study_schedule||{}).map(([when,what])=>(
                <div key={when} style={{marginBottom:10,display:'flex',gap:8,alignItems:'flex-start'}}>
                  <CheckCircle size={14} color="var(--brand)" style={{marginTop:2,flexShrink:0}}/>
                  <div style={{fontSize:'0.875rem'}}>
                    <strong style={{textTransform:'capitalize'}}>{when}:</strong>{' '}
                    <span style={{color:'var(--text-secondary)'}}>{what}</span>
                  </div>
                </div>
              ))}
            </div>
            <div>
              <h4 style={{color:'var(--brand)',marginBottom:14,fontSize:'0.875rem'}}>Success Tips:</h4>
              {(data.success_tips||[]).map(tip=>(
                <div key={tip} style={{marginBottom:10,display:'flex',gap:8,alignItems:'flex-start'}}>
                  <CheckCircle size={14} color="var(--brand)" style={{marginTop:2,flexShrink:0}}/>
                  <span style={{fontSize:'0.875rem',color:'var(--text-secondary)'}}>{tip}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Timeline */}
        <div className="card">
          <h3 style={{marginBottom:4}}>Estimated Completion Timeline</h3>
          <p style={{color:'var(--text-secondary)',fontSize:'0.8rem',marginBottom:16}}>Based on recommended study schedule</p>
          <div style={{background:'#F0FDF4',border:'1px solid #A7F3D0',borderRadius:12,padding:'20px 28px',
            display:'flex',justifyContent:'space-between',alignItems:'center',flexWrap:'wrap',gap:20}}>
            <div>
              <div style={{fontSize:'0.8rem',color:'var(--text-secondary)',marginBottom:4}}>Total Time Required</div>
              <div style={{fontFamily:'Space Grotesk',fontWeight:700,fontSize:'1.8rem',color:'var(--green)'}}>
                {data.estimated_weeks}–{(data.estimated_weeks||0)+2} Weeks
              </div>
              <div style={{fontSize:'0.8rem',color:'var(--text-muted)'}}>With consistent daily practice</div>
            </div>
            <div style={{textAlign:'right'}}>
              <div style={{fontSize:'0.8rem',color:'var(--text-secondary)',marginBottom:4}}>Expected Completion</div>
              <div style={{fontFamily:'Space Grotesk',fontWeight:700,fontSize:'1.4rem'}}>{dateStr}</div>
              <div style={{color:'var(--brand)',fontSize:'0.85rem'}}>Ready for placement season</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
