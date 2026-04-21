import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { TrendingUp, Target, RefreshCw } from 'lucide-react'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
         ScatterChart, Scatter, LineChart, Line, Legend, Cell } from 'recharts'
import { institutionAPI } from '../utils/api.js'

export default function BatchAnalytics() {
  const nav=useNavigate()
  const [data,setData]=useState(null)
  const [students,setStudents]=useState([])
  const [tab,setTab]=useState('dist')
  const [loading,setLoading]=useState(true)
  const [error,setError]=useState('')

  const load=()=>{
    setLoading(true);setError('')
    Promise.all([institutionAPI.getBatchAnalytics(),institutionAPI.getStudents()])
      .then(([aRes,sRes])=>{
        if(!aRes.data) throw new Error('No analytics data')
        setData(aRes.data);setStudents(sRes.data||[])
      })
      .catch(e=>setError(e?.response?.data?.error||e.message))
      .finally(()=>setLoading(false))
  }

  useEffect(()=>{load()},[])

  if(loading) return(
    <div style={{minHeight:'100vh',background:'var(--bg)'}}>
      <div style={{height:64,background:'linear-gradient(135deg,#92400E,#D97706)'}}/>
      <div className="loading-spinner"><div className="spinner"/><span>Loading batch analytics...</span></div>
    </div>
  )

  if(error||!data) return(
    <div style={{minHeight:'100vh',background:'var(--bg)'}}>
      <div style={{height:64,background:'linear-gradient(135deg,#92400E,#D97706)'}}/>
      <div className="content-area" style={{textAlign:'center',padding:60}}>
        <p style={{color:'var(--red)',marginBottom:20}}>{error||'Failed to load analytics'}</p>
        <button className="btn btn-brand" onClick={load}><RefreshCw size={14}/> Retry</button>
      </div>
    </div>
  )

  const dist=data.score_distribution||{}
  const distData=Object.entries(dist).map(([range,count])=>({
    range,count,
    color:range==='50-60'?'#EF4444':range==='60-70'?'#F59E0B':range==='70-80'?'#F59E0B':'#10B981'
  }))

  const scatterData=students.map(s=>({
    x:Number(s.readiness_score||0),y:Number(s.placement_probability||0),
    name:s.name,risk:s.risk_level||'Medium Risk'
  }))

  const RC={'Low Risk':'#10B981','Medium Risk':'#F59E0B','High Risk':'#EF4444'}
  const historical=data.historical_trends||[]
  const rd=data.risk_distribution||{}
  const weakData=(data.common_weakness||[]).map(w=>({name:w.skill,pct:w.percentage}))

  const below60=(dist['50-60']||0)
  const moderate=(dist['60-70']||0)+(dist['70-80']||0)
  const strong  =(dist['80-90']||0)+(dist['90-100']||0)
  const total   =data.total_students||1

  return(
    <div style={{minHeight:'100vh',background:'var(--bg)'}}>
      <header style={{height:64,background:'linear-gradient(135deg,#92400E,#D97706)',display:'flex',
        alignItems:'center',justifyContent:'space-between',padding:'0 24px',position:'sticky',top:0,zIndex:100}}>
        <div style={{display:'flex',alignItems:'center',gap:10,color:'white'}}>
          <button onClick={()=>nav('/institution')} style={{background:'none',border:'none',color:'white',cursor:'pointer',fontSize:'1.1rem'}}>←</button>
          <TrendingUp size={22}/>
          <div>
            <div style={{fontFamily:'Space Grotesk',fontWeight:700,fontSize:'1rem'}}>Detailed Batch Analytics</div>
            <div style={{fontSize:'0.75rem',color:'rgba(255,255,255,0.75)'}}>Comprehensive performance insights and trends</div>
          </div>
        </div>
        <button onClick={load} style={{background:'rgba(255,255,255,0.2)',border:'none',color:'white',
          padding:'7px 14px',borderRadius:8,cursor:'pointer',fontFamily:'DM Sans',fontSize:'0.875rem',
          display:'flex',alignItems:'center',gap:6}}>
          <RefreshCw size={13}/> Refresh
        </button>
      </header>

      <div className="content-area fade-in">
        {/* KPIs */}
        <div className="stats-grid" style={{gridTemplateColumns:'repeat(5,1fr)',marginBottom:24}}>
          {[
            {l:'Batch Size',      v:data.total_students,                            col:'var(--text-primary)'},
            {l:'Avg Readiness',   v:`${data.avg_readiness}%`,                       col:'var(--brand)'},
            {l:'Low Risk',        v:rd['Low Risk']?.count??0,                       col:'var(--green)'},
            {l:'Medium Risk',     v:rd['Medium Risk']?.count??0,                    col:'var(--gold)'},
            {l:'High Risk',       v:rd['High Risk']?.count??0,                      col:'var(--red)'},
          ].map(({l,v,col})=>(
            <div key={l} className="stat-card"><div className="label">{l}</div>
              <div className="value" style={{color:col}}>{v}</div></div>
          ))}
        </div>

        {/* Tabs */}
        <div className="tabs" style={{marginBottom:20}}>
          <button className={`tab-btn ${tab==='dist'?'active':''}`} onClick={()=>setTab('dist')}>Score Distribution</button>
          <button className={`tab-btn ${tab==='scatter'?'active':''}`} onClick={()=>setTab('scatter')}>Readiness vs Probability</button>
          <button className={`tab-btn ${tab==='trend'?'active':''}`} onClick={()=>setTab('trend')}>Historical Trends</button>
        </div>

        {tab==='dist'&&(
          <div className="card" style={{marginBottom:24}}>
            <h3 style={{marginBottom:4}}>Readiness Score Distribution</h3>
            <p style={{color:'var(--text-secondary)',fontSize:'0.8rem',marginBottom:20}}>Number of students in each readiness score range</p>
            {distData.some(d=>d.count>0)?(
              <ResponsiveContainer width="100%" height={260}>
                <BarChart data={distData} margin={{top:10,right:20,left:0,bottom:10}}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false}/>
                  <XAxis dataKey="range" fontSize={12}/>
                  <YAxis fontSize={12} allowDecimals={false}/>
                  <Tooltip formatter={v=>[`${v} students`,'Count']}/>
                  <Bar dataKey="count" radius={[4,4,0,0]} label={{position:'top',fontSize:12}}>
                    {distData.map((d,i)=><Cell key={i} fill={d.color}/>)}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            ):<div style={{textAlign:'center',padding:'60px 0',color:'var(--text-muted)'}}>No distribution data available</div>}
            <div style={{display:'flex',gap:16,marginTop:16}}>
              {[{l:'Below 60% (Critical)',c:below60,col:'var(--red)',bg:'#FEF2F2',br:'#FECACA'},
                {l:'60-80% (Moderate)',   c:moderate,col:'var(--gold)',bg:'#FFFBEB',br:'#FDE68A'},
                {l:'Above 80% (Strong)',  c:strong,  col:'var(--green)',bg:'#ECFDF5',br:'#A7F3D0'}
              ].map(({l,c,col,bg,br})=>(
                <div key={l} style={{flex:1,background:bg,border:`1px solid ${br}`,borderRadius:10,padding:'14px 16px'}}>
                  <div style={{fontSize:'0.78rem',color:'var(--text-secondary)',marginBottom:4}}>{l}</div>
                  <div style={{fontFamily:'Space Grotesk',fontWeight:700,fontSize:'1.5rem',color:col}}>{c}</div>
                  <div style={{fontSize:'0.75rem',color:'var(--text-muted)'}}>{Math.round(c/total*100)}% of batch</div>
                </div>
              ))}
            </div>
          </div>
        )}

        {tab==='scatter'&&(
          <div className="card" style={{marginBottom:24}}>
            <h3 style={{marginBottom:4}}>Readiness Score vs Placement Probability</h3>
            <p style={{color:'var(--text-secondary)',fontSize:'0.8rem',marginBottom:20}}>Correlation between readiness score and predicted placement success</p>
            {scatterData.length>0?(
              <ResponsiveContainer width="100%" height={320}>
                <ScatterChart margin={{top:20,right:20,bottom:20,left:20}}>
                  <CartesianGrid strokeDasharray="3 3"/>
                  <XAxis type="number" dataKey="x" name="Readiness" domain={[0,100]}
                    label={{value:'Readiness Score (%)',position:'bottom',offset:-5,fontSize:12}} fontSize={11}/>
                  <YAxis type="number" dataKey="y" name="Probability" domain={[0,100]}
                    label={{value:'Placement Probability (%)',angle:-90,position:'insideLeft',offset:10,fontSize:12}} fontSize={11}/>
                  <Tooltip content={({active,payload})=>{
                    if(!active||!payload?.length) return null
                    const d=payload[0].payload
                    return(<div style={{background:'white',border:'1px solid var(--border)',borderRadius:8,padding:'10px 14px'}}>
                      <strong>{d.name}</strong>
                      <div style={{fontSize:'0.85rem',color:'var(--text-secondary)'}}>
                        Readiness: {Number(d.x||0).toFixed(1)}%<br/>Probability: {Number(d.y||0).toFixed(1)}%
                      </div>
                    </div>)
                  }}/>
                  <Scatter data={scatterData} fill="#5B21B6">
                    {scatterData.map((d,i)=><Cell key={i} fill={RC[d.risk]||'#5B21B6'}/>)}
                  </Scatter>
                </ScatterChart>
              </ResponsiveContainer>
            ):<div style={{textAlign:'center',padding:'60px 0',color:'var(--text-muted)'}}>No student data for scatter plot</div>}
            <div className="alert alert-info" style={{marginTop:12,fontSize:'0.85rem'}}>
              <strong>Insight:</strong> Students with readiness scores above 75% show placement probabilities above 75%.
            </div>
            <div style={{display:'flex',gap:16,marginTop:8}}>
              {[['#10B981','Low Risk'],['#F59E0B','Medium Risk'],['#EF4444','High Risk']].map(([c,l])=>(
                <div key={l} style={{display:'flex',alignItems:'center',gap:6,fontSize:'0.8rem'}}>
                  <div style={{width:10,height:10,borderRadius:'50%',background:c}}/>{l}
                </div>
              ))}
            </div>
          </div>
        )}

        {tab==='trend'&&(
          <div className="card" style={{marginBottom:24}}>
            <h3 style={{marginBottom:4}}>Historical Trends &amp; Predictions</h3>
            <p style={{color:'var(--text-secondary)',fontSize:'0.8rem',marginBottom:20}}>Batch performance over the years with 2026 prediction</p>
            <ResponsiveContainer width="100%" height={280}>
              <LineChart data={historical} margin={{top:10,right:20,left:0,bottom:10}}>
                <CartesianGrid strokeDasharray="3 3" stroke="#F3F4F6"/>
                <XAxis dataKey="year" fontSize={12}/>
                <YAxis domain={[50,80]} fontSize={12}/>
                <Tooltip content={({active,payload,label})=>{
                  if(!active||!payload?.length) return null
                  return(<div style={{background:'white',border:'1px solid var(--border)',borderRadius:8,padding:'10px 14px'}}>
                    <strong>{label}</strong>
                    {payload.map(p=>(<div key={p.dataKey} style={{fontSize:'0.85rem',color:p.color}}>
                      {p.dataKey==='avg_readiness'?'Avg Readiness':'Placement Rate'}: {p.value}%
                    </div>))}
                  </div>)
                }}/>
                <Legend iconSize={10} wrapperStyle={{fontSize:'0.8rem'}}
                  formatter={v=>v==='avg_readiness'?'Avg Readiness %':'Placement Rate %'}/>
                <Line type="monotone" dataKey="avg_readiness" stroke="#5B21B6" strokeWidth={2} dot={{r:5}}/>
                <Line type="monotone" dataKey="placement_rate" stroke="#10B981" strokeWidth={2} dot={{r:5}}/>
              </LineChart>
            </ResponsiveContainer>
            <div className="grid-2" style={{marginTop:16}}>
              <div style={{padding:'16px 20px',background:'#F5F3FF',border:'1px solid #DDD6FE',borderRadius:12}}>
                <div style={{fontSize:'0.8rem',color:'var(--text-secondary)',marginBottom:4}}>Year-over-Year Growth</div>
                <div style={{fontFamily:'Space Grotesk',fontWeight:700,fontSize:'1.6rem',color:'var(--brand)'}}>+{data.year_growth||5.9}%</div>
                <div style={{fontSize:'0.8rem',color:'var(--text-muted)'}}>Average readiness improvement</div>
              </div>
              <div style={{padding:'16px 20px',background:'#ECFDF5',border:'1px solid #A7F3D0',borderRadius:12}}>
                <div style={{fontSize:'0.8rem',color:'var(--text-secondary)',marginBottom:4}}>Placement Rate Trend</div>
                <div style={{fontFamily:'Space Grotesk',fontWeight:700,fontSize:'1.6rem',color:'var(--green)'}}>+{data.placement_growth||9.7}%</div>
                <div style={{fontSize:'0.8rem',color:'var(--text-muted)'}}>Improvement over 3 years</div>
              </div>
            </div>
          </div>
        )}

        {/* Weak areas + strategy */}
        <div className="card" style={{marginBottom:24}}>
          <div className="card-header"><Target size={16} color="var(--gold)"/><h3>Common Weakness Areas – Intervention Required</h3></div>
          <p style={{color:'var(--text-secondary)',fontSize:'0.8rem',marginBottom:16}}>Percentage of students struggling in each skill area</p>
          {weakData.length>0?(
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={weakData} layout="vertical" margin={{left:120,right:40,top:5,bottom:5}}>
                <CartesianGrid strokeDasharray="3 3" horizontal={false}/>
                <XAxis type="number" tickFormatter={v=>`${v}%`} domain={[0,50]} fontSize={11}/>
                <YAxis dataKey="name" type="category" width={115} fontSize={11} tick={{fill:'#6B7280'}}/>
                <Tooltip formatter={v=>[`${v}%`,'Students affected']}/>
                <Bar dataKey="pct" fill="#EF4444" radius={[0,4,4,0]}/>
              </BarChart>
            </ResponsiveContainer>
          ):<div style={{textAlign:'center',padding:'40px 0',color:'var(--text-muted)'}}>No data</div>}
        </div>

        <div className="grid-2">
          <div className="card" style={{background:'#EFF6FF',border:'1px solid #BFDBFE'}}>
            <h3 style={{marginBottom:16}}>Strategic Recommendations</h3>
            {[['Priority 1: Coding & DSA Training','45% of students need improvement. Organize intensive boot camps and daily practice sessions.'],
              ['Priority 2: Technical Skills Enhancement','38% struggle here. Conduct hands-on workshops on latest technologies and frameworks.'],
              ['Priority 3: Project Guidance','35% lack quality projects. Implement mentorship program for project development.'],
            ].map(([title,desc])=>(
              <div key={title} style={{marginBottom:14,padding:'10px 14px',background:'white',borderRadius:8}}>
                <div style={{color:'var(--brand)',fontWeight:600,fontSize:'0.875rem',marginBottom:4}}>{title}</div>
                <div style={{color:'var(--text-secondary)',fontSize:'0.8rem'}}>{desc}</div>
              </div>
            ))}
          </div>
          <div className="card" style={{background:'#F0FDF4',border:'1px solid #A7F3D0'}}>
            <h3 style={{marginBottom:16}}>Student Segmentation Strategy</h3>
            {[['Low Risk Students',rd['Low Risk']?.count??0,'Focus: Advanced topics, interview prep, company-specific training','var(--green)','#ECFDF5','#A7F3D0'],
              ['Medium Risk Students',rd['Medium Risk']?.count??0,'Focus: Strengthen fundamentals, consistent practice, skill gap bridging','var(--gold)','#FFFBEB','#FDE68A'],
              ['High Risk Students',rd['High Risk']?.count??0,'Focus: Intensive one-on-one mentoring, foundation building, daily monitoring','var(--red)','#FEF2F2','#FECACA'],
            ].map(([title,count,desc,col,bg,br])=>(
              <div key={title} style={{marginBottom:12,padding:'10px 14px',background:bg,border:`1px solid ${br}`,borderRadius:8}}>
                <div style={{color:col,fontWeight:600,fontSize:'0.875rem',marginBottom:4}}>{title} ({count})</div>
                <div style={{color:'var(--text-secondary)',fontSize:'0.8rem'}}>{desc}</div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
