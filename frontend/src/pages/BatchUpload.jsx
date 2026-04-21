import { useState, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { Building2, Upload, FileText, CheckCircle, AlertTriangle, Download, Trash2 } from 'lucide-react'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Cell, ResponsiveContainer, PieChart, Pie, Legend } from 'recharts'
import { predictAPI } from '../utils/api.js'

const CSV_TEMPLATE_HEADERS = [
  'name','email','cgpa','attendance','aptitude_score','technical_score',
  'coding_score','communication_score','resume_quality','consistency_score',
  'internships','projects'
]

const SAMPLE_ROWS = [
  ['Meena Rajan','meena@college.edu','7.5','88','70','68','62','74','70','72','1','2'],
  ['Rohan Das','rohan@college.edu','6.8','75','60','58','55','65','60','62','0','1'],
  ['Sneha Pillai','sneha@college.edu','8.2','92','80','78','76','82','78','80','2','4'],
  ['Vikram Nair','vikram@college.edu','7.0','80','65','62','60','70','65','68','1','3'],
]

function downloadTemplate() {
  const header = CSV_TEMPLATE_HEADERS.join(',')
  const rows   = SAMPLE_ROWS.map(r => r.join(','))
  const csv    = [header, ...rows].join('\n')
  const blob   = new Blob([csv], { type:'text/csv' })
  const url    = URL.createObjectURL(blob)
  const a      = document.createElement('a')
  a.href = url; a.download = 'placeai_batch_template.csv'; a.click()
  URL.revokeObjectURL(url)
}

function parseCSV(text) {
  const lines = text.trim().split('\n').filter(l => l.trim())
  if (lines.length < 2) return { error: 'CSV must have a header row and at least one data row.' }

  const headers = lines[0].split(',').map(h => h.trim().toLowerCase().replace(/\s+/g,'_').replace(/[^a-z0-9_]/g,''))
  const required = ['name','cgpa','aptitude_score','technical_score','coding_score']
  const missing  = required.filter(r => !headers.includes(r))
  if (missing.length) return { error: `Missing required columns: ${missing.join(', ')}` }

  const rows = []
  for (let i = 1; i < lines.length; i++) {
    const vals = lines[i].split(',').map(v => v.trim().replace(/^"|"$/g,''))
    const obj  = {}
    headers.forEach((h, idx) => { obj[h] = vals[idx] ?? '' })
    rows.push(obj)
  }
  return { rows, headers }
}

const RISK_COLORS = { 'Low Risk':'#10B981', 'Medium Risk':'#F59E0B', 'High Risk':'#EF4444' }

export default function BatchUpload() {
  const nav = useNavigate()
  const fileRef   = useRef()
  const [step, setStep]         = useState('upload')  // upload | preview | result
  const [csvRows, setCsvRows]   = useState([])
  const [parseErr, setParseErr] = useState('')
  const [fileName, setFileName] = useState('')
  const [loading, setLoading]   = useState(false)
  const [result, setResult]     = useState(null)
  const [uploadErr, setUploadErr] = useState('')

  const handleFile = (file) => {
    if (!file) return
    setFileName(file.name)
    setParseErr(''); setResult(null); setUploadErr('')
    const reader = new FileReader()
    reader.onload = e => {
      const parsed = parseCSV(e.target.result)
      if (parsed.error) { setParseErr(parsed.error); return }
      setCsvRows(parsed.rows)
      setStep('preview')
    }
    reader.readAsText(file)
  }

  const handleDrop = e => {
    e.preventDefault()
    const file = e.dataTransfer.files[0]
    if (file?.name.endsWith('.csv')) handleFile(file)
  }

  const handleUpload = async () => {
    setLoading(true); setUploadErr('')
    try {
      const res = await predictAPI.uploadBatch(csvRows)
      setResult(res.data)
      setStep('result')
    } catch(e) {
      setUploadErr('Upload failed: ' + (e.response?.data?.error || e.message))
    } finally {
      setLoading(false)
    }
  }

  const reset = () => {
    setStep('upload'); setCsvRows([]); setParseErr(''); setFileName('');
    setResult(null); setUploadErr('')
  }

  // ── Analytics display helpers
  const riskDist = result?.analytics?.risk_distribution || {}
  const pieData  = Object.entries(riskDist).map(([name,v]) => ({ name, value: v.count }))
  const weakData = (result?.analytics?.common_weakness || []).map(w => ({ name: w.skill, pct: w.percentage }))

  return (
    <div style={{ minHeight:'100vh', background:'var(--bg)' }}>

      {/* Header */}
      <header style={{
        background:'linear-gradient(135deg,#92400E,#D97706)',
        padding:'16px 32px', display:'flex', alignItems:'center',
        justifyContent:'space-between', position:'sticky', top:0, zIndex:100
      }}>
        <div style={{ display:'flex', alignItems:'center', gap:10, color:'white' }}>
          <Building2 size={26}/>
          <div>
            <div style={{ fontFamily:'Space Grotesk', fontWeight:700, fontSize:'1.05rem' }}>Batch Upload & Analysis</div>
            <div style={{ fontSize:'0.75rem', color:'rgba(255,255,255,0.75)' }}>Upload CSV → Instant batch analytics</div>
          </div>
        </div>
        <div style={{ display:'flex', gap:10 }}>
          <button onClick={downloadTemplate} style={{
            background:'rgba(255,255,255,0.2)', border:'none', color:'white',
            padding:'8px 14px', borderRadius:8, cursor:'pointer',
            fontFamily:'DM Sans', fontWeight:600, fontSize:'0.875rem',
            display:'flex', alignItems:'center', gap:6
          }}><Download size={14}/> Download Template CSV</button>
          <button onClick={() => nav('/institution')} style={{
            background:'transparent', border:'none', color:'rgba(255,255,255,0.7)',
            padding:'8px 12px', borderRadius:8, cursor:'pointer', fontFamily:'DM Sans'
          }}>← Dashboard</button>
        </div>
      </header>

      <div style={{ maxWidth:1000, margin:'0 auto', padding:'28px 24px' }}>

        {/* Step indicator */}
        <div style={{ display:'flex', alignItems:'center', gap:0, marginBottom:32, justifyContent:'center' }}>
          {[['1','Upload CSV'],['2','Preview Data'],['3','View Results']].map(([num, label], i) => {
            const stepMap = { 'upload':0, 'preview':1, 'result':2 }
            const current = stepMap[step]
            const done    = i < current
            const active  = i === current
            return (
              <div key={num} style={{ display:'flex', alignItems:'center' }}>
                <div style={{ display:'flex', flexDirection:'column', alignItems:'center', gap:6 }}>
                  <div style={{
                    width:36, height:36, borderRadius:'50%', display:'flex',
                    alignItems:'center', justifyContent:'center',
                    background: done ? '#D97706' : active ? '#92400E' : '#E5E7EB',
                    color: (done||active) ? 'white' : '#9CA3AF',
                    fontFamily:'Space Grotesk', fontWeight:700, fontSize:'0.9rem'
                  }}>
                    {done ? <CheckCircle size={18}/> : num}
                  </div>
                  <span style={{ fontSize:'0.78rem', color: active ? '#92400E' : '#9CA3AF', fontWeight: active ? 600 : 400 }}>
                    {label}
                  </span>
                </div>
                {i < 2 && <div style={{ width:80, height:2, background: done ? '#D97706' : '#E5E7EB', margin:'0 8px', marginBottom:22 }}/>}
              </div>
            )
          })}
        </div>

        {/* ── STEP 1: Upload ── */}
        {step === 'upload' && (
          <div>
            <div className="alert alert-info" style={{ marginBottom:20 }}>
              <FileText size={16}/>
              <div>
                <strong>How to use:</strong> Download the template CSV, fill in your students' data (or use any CSV with the right columns), then upload it here. The AI will instantly analyze all students.
              </div>
            </div>

            {/* Drop zone */}
            <div
              onDrop={handleDrop}
              onDragOver={e => e.preventDefault()}
              onClick={() => fileRef.current.click()}
              style={{
                border:'2px dashed #D97706', borderRadius:16, padding:'60px 32px',
                textAlign:'center', cursor:'pointer', background:'#FFFBEB',
                transition:'all 0.2s'
              }}
              onMouseEnter={e => e.currentTarget.style.background = '#FEF3C7'}
              onMouseLeave={e => e.currentTarget.style.background = '#FFFBEB'}
            >
              <Upload size={48} color="#D97706" style={{ margin:'0 auto 16px' }}/>
              <div style={{ fontFamily:'Space Grotesk', fontWeight:700, fontSize:'1.1rem', color:'#92400E', marginBottom:8 }}>
                Drop your CSV file here or click to browse
              </div>
              <div style={{ color:'#B45309', fontSize:'0.875rem' }}>
                Supports .csv files • Max 500 students
              </div>
              <input ref={fileRef} type="file" accept=".csv" style={{ display:'none' }}
                onChange={e => handleFile(e.target.files[0])}/>
            </div>

            {parseErr && (
              <div className="alert alert-danger" style={{ marginTop:16 }}>
                <AlertTriangle size={16}/> {parseErr}
              </div>
            )}

            {/* Required columns */}
            <div className="card" style={{ marginTop:24 }}>
              <h3 style={{ fontSize:'0.95rem', marginBottom:12 }}>Required CSV Columns</h3>
              <div style={{ display:'grid', gridTemplateColumns:'repeat(4,1fr)', gap:8 }}>
                {CSV_TEMPLATE_HEADERS.map(h => (
                  <div key={h} style={{ padding:'7px 12px', background:'var(--bg)',
                    borderRadius:8, border:'1px solid var(--border)', fontSize:'0.8rem',
                    fontFamily:'monospace', color:'var(--brand)' }}>{h}</div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* ── STEP 2: Preview ── */}
        {step === 'preview' && (
          <div>
            <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:20 }}>
              <div style={{ display:'flex', alignItems:'center', gap:10 }}>
                <CheckCircle size={20} color="var(--green)"/>
                <div>
                  <h3 style={{ fontSize:'1rem' }}>File loaded: <strong>{fileName}</strong></h3>
                  <p style={{ color:'var(--text-secondary)', fontSize:'0.85rem' }}>{csvRows.length} students detected</p>
                </div>
              </div>
              <div style={{ display:'flex', gap:10 }}>
                <button onClick={reset} style={{
                  padding:'8px 16px', border:'1px solid var(--border)', borderRadius:8,
                  background:'white', cursor:'pointer', fontFamily:'DM Sans', fontSize:'0.875rem',
                  display:'flex', alignItems:'center', gap:6
                }}><Trash2 size={14}/> Remove</button>
                <button onClick={handleUpload} disabled={loading} style={{
                  padding:'10px 24px', borderRadius:8,
                  background: loading ? '#9CA3AF' : 'linear-gradient(135deg,#92400E,#D97706)',
                  color:'white', border:'none', fontFamily:'DM Sans',
                  fontWeight:700, cursor: loading ? 'not-allowed' : 'pointer',
                  display:'flex', alignItems:'center', gap:8
                }}>
                  {loading
                    ? <><div style={{ width:16,height:16,border:'2px solid rgba(255,255,255,0.3)',borderTopColor:'white',borderRadius:'50%',animation:'spin 0.8s linear infinite'}}/> Analyzing…</>
                    : <><Upload size={16}/> Analyze {csvRows.length} Students</>
                  }
                </button>
              </div>
            </div>

            {uploadErr && <div className="alert alert-danger" style={{ marginBottom:16 }}><AlertTriangle size={16}/> {uploadErr}</div>}

            <div className="table-wrapper">
              <table>
                <thead>
                  <tr>
                    <th>#</th>
                    {CSV_TEMPLATE_HEADERS.map(h => <th key={h}>{h}</th>)}
                  </tr>
                </thead>
                <tbody>
                  {csvRows.slice(0,10).map((row, i) => (
                    <tr key={i}>
                      <td style={{ color:'var(--text-muted)', fontWeight:600 }}>{i+1}</td>
                      {CSV_TEMPLATE_HEADERS.map(h => (
                        <td key={h} style={{ maxWidth:120, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>
                          {row[h] ?? '—'}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            {csvRows.length > 10 && (
              <div style={{ textAlign:'center', color:'var(--text-muted)', fontSize:'0.85rem', padding:'12px', marginTop:8 }}>
                … and {csvRows.length - 10} more rows
              </div>
            )}
          </div>
        )}

        {/* ── STEP 3: Results ── */}
        {step === 'result' && result && (
          <div>
            <div className="alert alert-success" style={{ marginBottom:20 }}>
              <CheckCircle size={16}/>
              <strong>{result.saved_count} students analyzed and saved to the system!</strong>
              {result.error_count > 0 && ` (${result.error_count} rows had errors)`}
            </div>

            {/* KPIs */}
            <div className="stats-grid" style={{ gridTemplateColumns:'repeat(4,1fr)', marginBottom:24 }}>
              {[
                { label:'Students Processed', val: result.saved_count, color:'var(--brand)' },
                { label:'Avg Readiness', val: (result.analytics?.avg_readiness || 0) + '%', color:'var(--brand)' },
                { label:'Predicted Placement', val: (result.analytics?.predicted_placement || 0) + '%', color:'var(--green)' },
                { label:'At-Risk Students', val: result.analytics?.at_risk_students || 0, color:'var(--red)' },
              ].map(({ label, val, color }) => (
                <div key={label} className="stat-card">
                  <div className="label">{label}</div>
                  <div className="value" style={{ color }}>{val}</div>
                </div>
              ))}
            </div>

            <div className="grid-2" style={{ marginBottom:24 }}>
              {/* Pie */}
              <div className="card">
                <h3 style={{ marginBottom:16, fontSize:'0.95rem' }}>Risk Level Distribution</h3>
                <ResponsiveContainer width="100%" height={200}>
                  <PieChart>
                    <Pie data={pieData} cx="50%" cy="50%" outerRadius={75}
                      dataKey="value" nameKey="name"
                      label={({ name, value }) => `${name.replace(' Risk','')}: ${value}`}>
                      {pieData.map((d,i) => <Cell key={i} fill={RISK_COLORS[d.name]}/>)}
                    </Pie>
                    <Tooltip/>
                    <Legend iconSize={10} wrapperStyle={{ fontSize:'0.8rem' }}/>
                  </PieChart>
                </ResponsiveContainer>
              </div>

              {/* Weakness bar */}
              <div className="card">
                <h3 style={{ marginBottom:16, fontSize:'0.95rem' }}>Common Weak Areas</h3>
                <ResponsiveContainer width="100%" height={200}>
                  <BarChart data={weakData} margin={{ left:0, right:20 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false}/>
                    <XAxis dataKey="name" fontSize={10} tick={{ fill:'#6B7280' }} interval={0}
                      tickFormatter={v => v.replace(' & DSA','').replace(' Skills','')}/>
                    <YAxis fontSize={11} domain={[0,60]} tickFormatter={v => v+'%'}/>
                    <Tooltip formatter={v => [v+'%','Students affected']}/>
                    <Bar dataKey="pct" fill="#EF4444" radius={[4,4,0,0]}/>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Training recommendations */}
            <div className="card" style={{ marginBottom:20 }}>
              <h3 style={{ fontSize:'0.95rem', marginBottom:16 }}>AI Training Recommendations for This Batch</h3>
              <div style={{ display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:12 }}>
                {(result.analytics?.training_recommendations || []).map((r,i) => (
                  <div key={i} style={{ padding:'12px 16px', background:'#EFF6FF',
                    border:'1px solid #BFDBFE', borderRadius:10 }}>
                    <div style={{ color:'var(--brand)', fontWeight:700, fontSize:'0.85rem', marginBottom:4 }}>
                      Priority {i+1}
                    </div>
                    <div style={{ color:'var(--text-secondary)', fontSize:'0.85rem' }}>{r}</div>
                  </div>
                ))}
              </div>
            </div>

            <div style={{ display:'flex', gap:12 }}>
              <button onClick={reset} style={{
                padding:'10px 20px', border:'1px solid var(--border)', borderRadius:8,
                background:'white', cursor:'pointer', fontFamily:'DM Sans', fontWeight:600
              }}>Upload Another File</button>
              <button onClick={() => nav('/institution')} style={{
                padding:'10px 20px', borderRadius:8,
                background:'linear-gradient(135deg,#92400E,#D97706)',
                color:'white', border:'none', fontFamily:'DM Sans', fontWeight:600, cursor:'pointer'
              }}>View Full Institution Dashboard</button>
            </div>
          </div>
        )}
      </div>

      <style>{`@keyframes spin { to { transform:rotate(360deg); } }`}</style>
    </div>
  )
}
