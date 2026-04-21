import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Building2, AlertTriangle, TrendingUp, RefreshCw } from 'lucide-react'
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, Legend } from 'recharts'
import { institutionAPI } from '../utils/api.js'

const RC={'Low Risk':'#10B981','Medium Risk':'#F59E0B','High Risk':'#EF4444'}

function RiskBadge({level}){
  const m={'Low Risk':{bg:'#D1FAE5',col:'#065F46',br:'#6EE7B7'},'Medium Risk':{bg:'#FEF3C7',col:'#92400E',br:'#FCD34D'},'High Risk':{bg:'#FEE2E2',col:'#991B1B',br:'#FCA5A5'}}
  const s=m[level]||m['Medium Risk']
  return <span style={{background:s.bg,color:s.col,border:`1.5px solid ${s.br}`,padding:'3px 12px',borderRadius:20,fontWeight:700,fontSize:'0.78rem'}}>{level}</span>
}

export default function InstitutionDashboard() {
  const nav=useNavigate()
  const [dash,setDash]=useState(null)
  const [students,setStudents]=useState([])
  const [loading,setLoading]=useState(true)
  const [error,setError]=useState('')

  const load=()=>{
    setLoading(true);setError('')
    Promise.all([institutionAPI.getDashboard(),institutionAPI.getStudents()])
      .then(([dRes,sRes])=>{
        if(!dRes.data||dRes.data.total_students===undefined) throw new Error('Invalid dashboard data')
        setDash(dRes.data);setStudents(sRes.data||[])
      })
      .catch(e=>setError(e?.response?.data?.error||e.message))
      .finally(()=>setLoading(false))
  }

  useEffect(()=>{load()},[])

  if(loading) return(
    <div style={{minHeight:'100vh',background:'var(--bg)'}}>
      <div style={{height:64,background:'linear-gradient(135deg,#92400E,#D97706)'}}/>
      <div className="loading-spinner"><div className="spinner"/><span>Loading institution data...</span></div>
    </div>
  )

  if(error||!dash) return(
    <div style={{minHeight:'100vh',background:'var(--bg)'}}>
      <div style={{height:64,background:'linear-gradient(135deg,#92400E,#D97706)'}}/>
      <div className="content-area" style={{textAlign:'center',padding:60}}>
        <div style={{fontSize:'3rem',marginBottom:16}}>⚠️</div>
        <h2 style={{marginBottom:12}}>Cannot connect to backend</h2>
        <p style={{color:'var(--text-secondary)',marginBottom:24}}>{error||'Backend not responding'}</p>
        <div style={{background:'#F3F4F6',borderRadius:10,padding:'16px 20px',textAlign:'left',maxWidth:440,margin:'0 auto 24px',fontSize:'0.875rem'}}>
          <strong>Fix:</strong><br/>
          1. Open Terminal<br/>
          2. <code style={{background:'#E5E7EB',padding:'2px 6px',borderRadius:4}}>cd ~/Downloads/placeai/backend</code><br/>
          3. <code style={{background:'#E5E7EB',padding:'2px 6px',borderRadius:4}}>source venv/bin/activate</code><br/>
          4. <code style={{background:'#E5E7EB',padding:'2px 6px',borderRadius:4}}>python3 app.py</code>
        </div>
        <button className="btn btn-brand" onClick={load}><RefreshCw size={16}/> Try Again</button>
      </div>
    </div>
  )

  const rd=dash.risk_distribution||{}
  const pieData=Object.entries(rd).map(([name,v])=>({name,value:v.count||0,pct:v.pct||0})).filter(d=>d.value>0)
  const weakData=(dash.common_weakness||[]).map(w=>({name:w.skill.replace(' & ','&').replace(' Skills',''),pct:w.percentage}))

  return(
    <div style={{minHeight:'100vh',background:'var(--bg)'}}>
      <header style={{height:64,background:'linear-gradient(135deg,#92400E,#D97706)',display:'flex',alignItems:'center',
        justifyContent:'space-between',padding:'0 24px',position:'sticky',top:0,zIndex:100,boxShadow:'0 2px 16px rgba(146,64,14,0.3)'}}>
        <div style={{display:'flex',alignItems:'center',gap:10,color:'white'}}>
          <Building2 size={26}/>
          <div>
            <div style={{fontFamily:'Space Grotesk',fontWeight:700,fontSize:'1.05rem'}}>PlaceAI – Institution Dashboard</div>
            <div style={{fontSize:'0.75rem',color:'rgba(255,255,255,0.75)'}}>Batch Performance &amp; Analytics</div>
          </div>
        </div>
        <div style={{display:'flex',gap:8}}>
          <button onClick={()=>nav('/institution/upload')} style={{background:'rgba(255,255,255,0.2)',border:'none',color:'white',
            padding:'7px 14px',borderRadius:8,cursor:'pointer',fontFamily:'DM Sans',fontSize:'0.875rem'}}>↑ Upload Batch CSV</button>
          <button onClick={load} style={{background:'rgba(255,255,255,0.15)',border:'none',color:'white',
            padding:'7px 12px',borderRadius:8,cursor:'pointer',fontFamily:'DM Sans',fontSize:'0.875rem',display:'flex',alignItems:'center',gap:6}}>
            <RefreshCw size={13}/> Refresh</button>
          <button onClick={()=>nav('/')} style={{background:'transparent',border:'none',color:'rgba(255,255,255,0.8)',
            padding:'7px 12px',borderRadius:8,cursor:'pointer',fontFamily:'DM Sans',fontSize:'0.875rem'}}>Home</button>
        </div>
      </header>

      <div className="content-area fade-in">
        {/* KPIs */}
        <div className="stats-grid" style={{gridTemplateColumns:'repeat(4,1fr)',marginBottom:24}}>
          <div className="stat-card primary">
            <div className="label">Total Students</div>
            <div className="value">{dash.total_students}</div>
            <div className="sub-value">Current Batch</div></div>
          <div className="stat-card">
            <div className="label">Avg. Readiness</div>
            <div className="value" style={{color:'var(--brand)'}}>{dash.avg_readiness}%</div>
            <div className="progress-bar"><div className="progress-fill primary" style={{width:`${dash.avg_readiness}%`}}/></div></div>
          <div className="stat-card">
            <div className="label">Predicted Placement</div>
            <div className="value" style={{color:'var(--green)'}}>{dash.predicted_placement}%</div>
            <div className="sub-value">Expected Success Rate</div></div>
          <div className="stat-card" style={{background:'#FEF2F2',borderColor:'#FECACA'}}>
            <div className="label" style={{color:'var(--red)'}}>At-Risk Students</div>
            <div className="value" style={{color:'var(--red)'}}>{dash.at_risk_students}</div>
            <div className="sub-value" style={{color:'var(--red)'}}>Need Intervention</div></div>
        </div>

        {/* Charts */}
        <div className="grid-2" style={{marginBottom:24}}>
          <div className="card">
            <div className="card-header"><h3>Risk Level Distribution</h3></div>
            <p style={{color:'var(--text-secondary)',fontSize:'0.8rem',marginBottom:16}}>Student segmentation by placement readiness risk</p>
            {pieData.length>0?(
              <ResponsiveContainer width="100%" height={200}>
                <PieChart>
                  <Pie data={pieData} cx="50%" cy="50%" outerRadius={78} dataKey="value" nameKey="name"
                    label={({name,pct})=>`${name.replace(' Risk','')}: ${pct}%`}>
                    {pieData.map((d,i)=><Cell key={i} fill={RC[d.name]}/>)}
                  </Pie>
                  <Tooltip formatter={(v,name)=>[`${v} students`,name]}/>
                  <Legend iconSize={10} wrapperStyle={{fontSize:'0.78rem'}}/>
                </PieChart>
              </ResponsiveContainer>
            ):(
              <div style={{textAlign:'center',padding:'40px 0',color:'var(--text-muted'}}>No risk data available</div>
            )}
            <div style={{display:'flex',gap:12,marginTop:12}}>
              {pieData.map(d=>(
                <div key={d.name} style={{flex:1,textAlign:'center',padding:'10px 8px',background:'var(--bg)',borderRadius:8,border:'1px solid var(--border)'}}>
                  <div style={{fontFamily:'Space Grotesk',fontWeight:700,fontSize:'1.4rem',color:RC[d.name]}}>{d.value}</div>
                  <div style={{fontSize:'0.72rem',color:'var(--text-secondary)'}}>{d.name.replace(' Risk','')} Risk</div>
                </div>
              ))}
            </div>
          </div>

          <div className="card">
            <div className="card-header"><AlertTriangle size={16} color="var(--gold)"/><h3>Common Weak Areas Across Batch</h3></div>
            <p style={{color:'var(--text-secondary)',fontSize:'0.8rem',marginBottom:16}}>Skills requiring institutional focus</p>
            {weakData.length>0?(
              <ResponsiveContainer width="100%" height={200}>
                <BarChart data={weakData} margin={{top:5,right:10,left:-10,bottom:5}}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false}/>
                  <XAxis dataKey="name" fontSize={10} tick={{fill:'#6B7280'}} interval={0}/>
                  <YAxis fontSize={11} domain={[0,50]}/>
                  <Tooltip formatter={v=>[`${v}%`,'Students affected']}/>
                  <Bar dataKey="pct" fill="#EF4444" radius={[4,4,0,0]}/>
                </BarChart>
              </ResponsiveContainer>
            ):<div style={{textAlign:'center',padding:'40px 0',color:'var(--text-muted)'}}>No data</div>}
            <div style={{marginTop:12,padding:'10px 14px',background:'#FFFBEB',border:'1px solid #FDE68A',borderRadius:8,fontSize:'0.8rem',color:'#92400E'}}>
              <strong>Recommendation:</strong> Organize targeted workshops for these areas to improve overall batch performance.
            </div>
          </div>
        </div>

        {/* Bottom row */}
        <div className="grid-3" style={{marginBottom:24}}>
          <div className="feature-card" onClick={()=>nav('/institution/analytics')}>
            <TrendingUp size={20} color="var(--brand)"/>
            <div style={{display:'inline-block',float:'right',background:'var(--text-primary)',color:'white',padding:'2px 8px',borderRadius:20,fontSize:'0.72rem',fontWeight:600}}>Detailed</div>
            <h3 style={{marginTop:12}}>Detailed Batch Analytics</h3>
            <p>In-depth analysis of student performance, trends, and historical predictions</p>
            <button className="btn btn-primary btn-full" style={{marginTop:16}}>View Full Analytics</button>
          </div>
          <div className="card">
            <h3 style={{marginBottom:14}}>Training Recommendations</h3>
            {(dash.training_recommendations||[]).map(r=>(
              <div key={r} style={{display:'flex',alignItems:'center',gap:10,marginBottom:10,fontSize:'0.875rem',color:'var(--text-secondary)'}}>
                <div style={{width:8,height:8,borderRadius:'50%',background:'var(--brand)',flexShrink:0}}/>{r}
              </div>
            ))}
          </div>
          <div className="card" style={{background:'#ECFDF5',border:'1px solid #A7F3D0'}}>
            <div className="card-header"><TrendingUp size={16} color="var(--green)"/><h3>Success Indicators</h3></div>
            <div style={{marginBottom:12}}>
              <div style={{fontSize:'0.8rem',color:'var(--text-secondary)',marginBottom:4}}>Students on Track</div>
              <div style={{fontFamily:'Space Grotesk',fontWeight:700,fontSize:'1.8rem',color:'var(--green)'}}>{dash.students_on_track}%</div>
              <div className="progress-bar"><div className="progress-fill green" style={{width:`${dash.students_on_track}%`}}/></div>
            </div>
            <div>
              <div style={{fontSize:'0.8rem',color:'var(--text-secondary)',marginBottom:2}}>Avg. Skill Improvement</div>
              <div style={{fontFamily:'Space Grotesk',fontWeight:700,fontSize:'1.4rem',color:'var(--brand)'}}>+{dash.avg_skill_improvement}%</div>
              <div style={{fontSize:'0.75rem',color:'var(--text-muted)'}}>from last assessment</div>
            </div>
          </div>
        </div>

        {/* Student table */}
        <div className="card">
          <div className="card-header" style={{marginBottom:16}}>
            <h3>Student Overview</h3>
            <span style={{marginLeft:'auto',color:'var(--text-muted)',fontSize:'0.85rem'}}>{students.length} students</span>
          </div>
          {students.length===0?(
            <p style={{color:'var(--text-muted)',textAlign:'center',padding:32}}>No students found. Run seed_and_train.py first.</p>
          ):(
            <div className="table-wrapper">
              <table>
                <thead><tr>
                  <th>Student</th><th>Risk Level</th><th>Readiness</th><th>Placement Prob.</th><th>Top Weakness</th><th>Progress</th>
                </tr></thead>
                <tbody>
                  {students.map(s=>(
                    <tr key={s.student_id}>
                      <td><div style={{fontWeight:600}}>{s.name}</div><div style={{fontSize:'0.78rem',color:'var(--text-muted)'}}>{s.student_id}</div></td>
                      <td><RiskBadge level={s.risk_level||'Medium Risk'}/></td>
                      <td><span style={{fontFamily:'Space Grotesk',fontWeight:700,color:'var(--brand)'}}>{Number(s.readiness_score||0).toFixed(1)}%</span></td>
                      <td><span style={{fontFamily:'Space Grotesk',fontWeight:700,color:'var(--green)'}}>{Number(s.placement_probability||0).toFixed(1)}%</span></td>
                      <td><span style={{color:'var(--gold)',fontWeight:500}}>{s.top_weakness||'—'}</span></td>
                      <td style={{minWidth:120}}>
                        <div className="progress-bar">
                          <div className="progress-fill primary" style={{width:`${Math.min(Number(s.readiness_score||0),100)}%`}}/>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
