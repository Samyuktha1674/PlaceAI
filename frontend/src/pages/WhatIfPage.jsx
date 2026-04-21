import { useEffect, useState, useCallback, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { Sliders, RefreshCw, Zap, TrendingUp } from 'lucide-react'
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine, Legend } from 'recharts'
import Header from '../components/shared/Header.jsx'
import { studentAPI } from '../utils/api.js'

const SLIDERS = [
  {key:'cgpa',            label:'CGPA',             min:5,  max:10,  step:0.1, fmt:v=>`${Number(v).toFixed(1)} / 10.0`},
  {key:'aptitude_score',  label:'Aptitude Score',   min:20, max:100, step:1,   fmt:v=>`${v} / 100`},
  {key:'technical_score', label:'Technical Score',  min:20, max:100, step:1,   fmt:v=>`${v} / 100`},
  {key:'communication_score',label:'Communication', min:20, max:100, step:1,   fmt:v=>`${v} / 100`},
  {key:'coding_score',    label:'Coding Score',     min:20, max:100, step:1,   fmt:v=>`${v} / 100`},
  {key:'projects',        label:'Projects',         min:0,  max:10,  step:1,   fmt:v=>`${v}`},
  {key:'internships',     label:'Internships',      min:0,  max:5,   step:1,   fmt:v=>`${v}`},
]

function RiskBadge({level}){
  const m={'Low Risk':{bg:'#D1FAE5',col:'#065F46',br:'#6EE7B7'},'Medium Risk':{bg:'#FEF3C7',col:'#92400E',br:'#FCD34D'},'High Risk':{bg:'#FEE2E2',col:'#991B1B',br:'#FCA5A5'}}
  const s=m[level]||m['Medium Risk']
  return <span style={{background:s.bg,color:s.col,border:`1.5px solid ${s.br}`,padding:'4px 14px',borderRadius:20,fontWeight:700,fontSize:'0.85rem'}}>{level}</span>
}

export default function WhatIfPage() {
  const nav = useNavigate()
  const sid  = localStorage.getItem('student_id')||'S001'
  const sname= localStorage.getItem('student_name')||''
  const [profile, setProfile]   = useState(null)
  const [sliders, setSliders]   = useState({})
  const [result, setResult]     = useState(null)
  const [simulating, setSimulating] = useState(false)
  const [loading, setLoading]   = useState(true)
  const timer = useRef(null)

  useEffect(()=>{
    studentAPI.getProfile(sid).then(r=>{
      setProfile(r.data)
      const init={}
      SLIDERS.forEach(s=>{init[s.key]=Number(r.data[s.key])||s.min})
      setSliders(init)
    }).catch(()=>{}).finally(()=>setLoading(false))
  },[])

  const runSim = useCallback((vals)=>{
    if(!profile) return
    setSimulating(true)
    studentAPI.whatIf(sid, vals)
      .then(r=>setResult(r.data))
      .catch(e=>console.error('What-if error:',e))
      .finally(()=>setSimulating(false))
  },[profile,sid])

  const handleSlider=(key,val)=>{
    const updated={...sliders,[key]:parseFloat(val)}
    setSliders(updated)
    // Debounce API call
    clearTimeout(timer.current)
    timer.current=setTimeout(()=>runSim(updated),400)
  }

  const reset=()=>{
    if(!profile) return
    const init={}
    SLIDERS.forEach(s=>{init[s.key]=Number(profile[s.key])||s.min})
    setSliders(init); setResult(null)
  }

  const autoOptimize=()=>{
    if(!profile) return
    const opt={...sliders}
    SLIDERS.forEach(s=>{
      const boost=s.key==='cgpa'?0.5:s.key==='projects'?2:s.key==='internships'?1:10
      opt[s.key]=Math.min(s.max,Number(opt[s.key])+boost)
    })
    setSliders(opt); runSim(opt)
  }

  if(loading) return(
    <div className="page-wrapper"><Header studentName={sname}/>
      <div className="loading-spinner"><div className="spinner"/><span>Loading simulator...</span></div>
    </div>
  )

  const orig=result?.original; const sim=result?.simulated
  const rc=result?.readiness_change??0
  const pc=result?.probability_change??0
  const si=result?.salary_impact??0

  const chartData=result?.simulation_data||(SLIDERS.slice(0,5).map(s=>({
    label:s.label.replace(' Score','').replace(' Skills',''),
    feature:s.key,
    current:profile?Math.min((Number(profile[s.key])||0)/(s.key==='cgpa'?0.1:1),100):0,
    simulated:Math.min((Number(sliders[s.key])||0)/(s.key==='cgpa'?0.1:1),100),
  })))

  return(
    <div className="page-wrapper">
      <Header studentName={sname} extra={
        <div style={{display:'flex',gap:8}}>
          <button onClick={reset} style={{background:'rgba(255,255,255,0.2)',border:'none',color:'white',padding:'6px 12px',borderRadius:8,cursor:'pointer',fontFamily:'DM Sans',fontSize:'0.85rem',display:'flex',alignItems:'center',gap:6}}>
            <RefreshCw size={13}/> Reset
          </button>
          <button onClick={autoOptimize} style={{background:'rgba(255,255,255,0.25)',border:'none',color:'white',padding:'6px 14px',borderRadius:8,cursor:'pointer',fontFamily:'DM Sans',fontWeight:600,fontSize:'0.85rem',display:'flex',alignItems:'center',gap:6}}>
            <Zap size={13}/> Auto-Optimize
          </button>
        </div>
      }/>

      <div className="content-area fade-in">
        <div style={{display:'flex',alignItems:'center',gap:12,marginBottom:24}}>
          <button onClick={()=>nav('/student')} style={{background:'none',border:'none',color:'var(--text-secondary)',cursor:'pointer',fontSize:'1.1rem'}}>←</button>
          <Sliders size={22} color="var(--brand)"/>
          <div><h2>What-If Scenario Analyzer</h2>
            <p style={{color:'var(--text-secondary)',fontSize:'0.85rem'}}>Move sliders to simulate improvements — see instant impact on your readiness</p>
          </div>
        </div>

        {/* Impact KPIs */}
        <div className="stats-grid" style={{gridTemplateColumns:'repeat(4,1fr)',marginBottom:24}}>
          <div className="stat-card" style={{background:rc>0?'#ECFDF5':'white',borderColor:rc>0?'#A7F3D0':'var(--border)'}}>
            <div className="label">Readiness Change</div>
            <div className="value" style={{color:rc>0?'var(--green)':rc<0?'var(--red)':'var(--text-primary)',fontSize:'1.8rem',display:'flex',alignItems:'center',gap:4}}>
              <TrendingUp size={20}/>{rc>=0?'+':''}{rc}%
            </div>
          </div>
          <div className="stat-card">
            <div className="label">Probability Change</div>
            <div className="value" style={{color:pc>=0?'#1D4ED8':'var(--red)',fontSize:'1.8rem'}}>{pc>=0?'+':''}{pc}%</div>
          </div>
          <div className="stat-card">
            <div className="label">Salary Impact</div>
            <div className="value" style={{color:'#1D4ED8',fontSize:'1.8rem'}}>+₹{Math.abs(si).toFixed(1)}L</div>
          </div>
          <div className="stat-card">
            <div className="label">New Risk Level</div>
            <div style={{marginTop:8}}><RiskBadge level={result?.new_risk_level||'Medium Risk'}/></div>
          </div>
        </div>

        <div className="grid-2">
          {/* Sliders */}
          <div className="card">
            <h3 style={{marginBottom:4}}>Adjust Your Scores</h3>
            <p style={{color:'var(--text-secondary)',fontSize:'0.875rem',marginBottom:20}}>
              Move the sliders — the AI re-calculates your readiness in real time
            </p>
            {SLIDERS.map(s=>{
              const current=Number(profile?.[s.key]||s.min)
              const val=Number(sliders[s.key]||current)
              const change=parseFloat((val-current).toFixed(s.key==='cgpa'?1:0))
              return(
                <div key={s.key} style={{marginBottom:20}}>
                  <div style={{display:'flex',justifyContent:'space-between',marginBottom:4}}>
                    <span style={{fontWeight:500,fontSize:'0.875rem'}}>{s.label}</span>
                    <span style={{fontFamily:'Space Grotesk',fontWeight:700,fontSize:'0.9rem',color:'var(--brand)'}}>{s.fmt(val)}</span>
                  </div>
                  <input type="range" min={s.min} max={s.max} step={s.step} value={val}
                    onChange={e=>handleSlider(s.key,e.target.value)}
                    style={{width:'100%',accentColor:'var(--brand)',cursor:'pointer'}}/>
                  <div style={{fontSize:'0.75rem',color:change>0?'var(--green)':change<0?'var(--red)':'var(--text-muted)'}}>
                    Current: {s.fmt(current)} | Change: {change>=0?'+':''}{s.key==='cgpa'?change.toFixed(1):change}
                  </div>
                </div>
              )
            })}
            {simulating&&<div style={{textAlign:'center',color:'var(--brand)',fontSize:'0.85rem',padding:'8px 0'}}>⚙️ Calculating...</div>}
          </div>

          {/* Chart */}
          <div className="card">
            <h3 style={{marginBottom:4}}>Current vs Simulated Comparison</h3>
            <p style={{color:'var(--text-secondary)',fontSize:'0.875rem',marginBottom:20}}>Visual comparison of your improvements</p>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={chartData} margin={{top:10,right:20,left:0,bottom:10}}>
                <CartesianGrid strokeDasharray="3 3" stroke="#F3F4F6"/>
                <XAxis dataKey="label" fontSize={11} tick={{fill:'#6B7280'}}/>
                <YAxis domain={[0,100]} fontSize={11}/>
                <ReferenceLine y={75} stroke="#D1D5DB" strokeDasharray="4 2"
                  label={{value:'Target',position:'insideTopRight',fontSize:11,fill:'#9CA3AF'}}/>
                <Tooltip content={({active,payload,label})=>{
                  if(!active||!payload?.length) return null
                  return(<div style={{background:'white',border:'1px solid var(--border)',borderRadius:8,padding:'10px 14px'}}>
                    <strong style={{fontSize:'0.9rem'}}>{label}</strong>
                    {payload.map(p=>(<div key={p.dataKey} style={{fontSize:'0.85rem',color:p.color}}>
                      {p.dataKey==='current'?'Current':'Simulated'}: {Number(p.value||0).toFixed(0)}
                    </div>))}
                  </div>)
                }}/>
                <Legend iconSize={10} wrapperStyle={{fontSize:'0.8rem'}}
                  formatter={v=>v==='current'?'Current':'Simulated'}/>
                <Line type="monotone" dataKey="current"   stroke="#5B21B6" strokeWidth={2} dot={{r:4,fill:'#5B21B6'}}/>
                <Line type="monotone" dataKey="simulated" stroke="#8B5CF6" strokeWidth={2} strokeDasharray="5 3" dot={{r:4,fill:'#8B5CF6'}}/>
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Detailed impact */}
        {result&&(
          <div className="card" style={{marginTop:24}}>
            <h3 style={{marginBottom:4}}>Detailed Impact Analysis</h3>
            <p style={{color:'var(--text-secondary)',fontSize:'0.875rem',marginBottom:20}}>How your simulated improvements affect placement readiness</p>
            <div className="grid-2">
              <div>
                <h4 style={{fontSize:'0.875rem',marginBottom:12,color:'var(--text-secondary)'}}>Current State</h4>
                {[['Readiness Score',`${orig?.readiness_score}%`],['Placement Probability',`${orig?.placement_probability}%`],
                  ['Expected Salary',`₹${orig?.expected_salary_min}–${orig?.expected_salary_max}L`],['Risk Level',orig?.risk_level]
                ].map(([lbl,val])=>(
                  <div key={lbl} style={{padding:'12px 16px',border:'1px solid var(--border)',borderRadius:8,marginBottom:10}}>
                    <div style={{fontSize:'0.78rem',color:'var(--text-secondary)',marginBottom:3}}>{lbl}</div>
                    <strong style={{fontFamily:'Space Grotesk',fontSize:'1.1rem'}}>{val}</strong>
                  </div>
                ))}
              </div>
              <div>
                <h4 style={{fontSize:'0.875rem',marginBottom:12,color:'var(--text-secondary)'}}>Simulated State</h4>
                {[['Readiness Score',`${sim?.readiness_score}%`,rc],['Placement Probability',`${sim?.placement_probability}%`,pc],
                  ['Expected Salary',`₹${sim?.expected_salary_min}–${sim?.expected_salary_max}L`,null],['Risk Level',sim?.risk_level,null]
                ].map(([lbl,val,chg])=>(
                  <div key={lbl} style={{padding:'12px 16px',border:'1px solid var(--border)',borderRadius:8,marginBottom:10,background:'#F8F7FF'}}>
                    <div style={{fontSize:'0.78rem',color:'var(--text-secondary)',marginBottom:3}}>{lbl}</div>
                    <div style={{display:'flex',alignItems:'center',gap:8}}>
                      <strong style={{fontFamily:'Space Grotesk',fontSize:'1.1rem'}}>{val}</strong>
                      {chg!==null&&chg!==0&&(
                        <span style={{color:chg>0?'var(--green)':'var(--red)',fontSize:'0.85rem',fontWeight:600}}>
                          {chg>=0?'↑ +':'↓ '}{chg}%
                        </span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
