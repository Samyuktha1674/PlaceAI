import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Brain, LogIn, Users, AlertCircle } from 'lucide-react'
import { studentAPI } from '../utils/api.js'

// Hardcoded fallback so login always works even if backend is slow to start
const DEMO_STUDENTS = {
  'S001': { student_id: 'S001', name: 'Rahul Sharma',  email: 'rahul.sharma@university.edu',  cgpa: 7.8, aptitude_score: 72, technical_score: 68, coding_score: 65, communication_score: 75, resume_quality: 70, consistency_score: 72, internships: 1, projects: 3, attendance: 88 },
  'S002': { student_id: 'S002', name: 'Priya Patel',   email: 'priya.patel@university.edu',   cgpa: 8.5, aptitude_score: 80, technical_score: 82, coding_score: 78, communication_score: 85, resume_quality: 80, consistency_score: 82, internships: 2, projects: 4, attendance: 92 },
  'S003': { student_id: 'S003', name: 'Amit Kumar',    email: 'amit.kumar@university.edu',    cgpa: 7.2, aptitude_score: 65, technical_score: 62, coding_score: 60, communication_score: 70, resume_quality: 65, consistency_score: 68, internships: 1, projects: 2, attendance: 80 },
  'S004': { student_id: 'S004', name: 'Sneha Reddy',   email: 'sneha.reddy@university.edu',   cgpa: 8.0, aptitude_score: 76, technical_score: 74, coding_score: 72, communication_score: 78, resume_quality: 75, consistency_score: 76, internships: 2, projects: 3, attendance: 90 },
  'S005': { student_id: 'S005', name: 'Arjun Singh',   email: 'arjun.singh@university.edu',   cgpa: 6.5, aptitude_score: 55, technical_score: 52, coding_score: 50, communication_score: 60, resume_quality: 55, consistency_score: 58, internships: 0, projects: 1, attendance: 72 },
  'S006': { student_id: 'S006', name: 'Divya Iyer',    email: 'divya.iyer@university.edu',    cgpa: 8.8, aptitude_score: 84, technical_score: 86, coding_score: 82, communication_score: 88, resume_quality: 84, consistency_score: 86, internships: 2, projects: 5, attendance: 95 },
  'S007': { student_id: 'S007', name: 'Karan Mehta',   email: 'karan.mehta@university.edu',   cgpa: 6.8, aptitude_score: 58, technical_score: 55, coding_score: 52, communication_score: 62, resume_quality: 58, consistency_score: 60, internships: 0, projects: 2, attendance: 75 },
  'S008': { student_id: 'S008', name: 'Anjali Desai',  email: 'anjali.desai@university.edu',  cgpa: 7.5, aptitude_score: 73, technical_score: 70, coding_score: 68, communication_score: 74, resume_quality: 72, consistency_score: 73, internships: 1, projects: 3, attendance: 85 },
}

export default function StudentLogin() {
  const nav = useNavigate()
  const [studentId, setStudentId] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const handleLogin = async (id) => {
    const cleanId = ((id !== undefined ? id : studentId) || '').trim().toUpperCase()
    if (!cleanId) { setError('Please enter a Student ID'); return }

    setLoading(true)
    setError('')

    // Try the backend API first
    try {
      const res = await studentAPI.login(cleanId)
      if (res.data && res.data.student_id) {
        localStorage.setItem('student_id', res.data.student_id)
        localStorage.setItem('student_name', res.data.name)
        localStorage.setItem('student_profile', JSON.stringify(res.data))
        nav('/student')
        return
      }
    } catch (err) {
      console.warn('Backend login failed, trying local fallback:', err.message)
    }

    // Fallback to local data (works even if backend is not running)
    if (DEMO_STUDENTS[cleanId]) {
      const student = DEMO_STUDENTS[cleanId]
      localStorage.setItem('student_id', student.student_id)
      localStorage.setItem('student_name', student.name)
      localStorage.setItem('student_profile', JSON.stringify(student))
      nav('/student')
      return
    }

    setError('Student ID "' + cleanId + '" not found. Please use S001 to S008.')
    setLoading(false)
  }

  return (
    <div style={{
      minHeight: '100vh',
      background: 'linear-gradient(135deg, #0F0A1E 0%, #1E1040 100%)',
      display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24
    }}>
      <div style={{
        background: 'rgba(255,255,255,0.05)', backdropFilter: 'blur(20px)',
        border: '1px solid rgba(139,92,246,0.3)', borderRadius: 20,
        padding: '48px 40px', width: '100%', maxWidth: 440, textAlign: 'center'
      }}>
        <Brain size={48} color="#8B5CF6" style={{ margin: '0 auto 16px' }} />
        <h1 style={{ fontFamily: 'Space Grotesk', color: 'white', fontSize: '1.5rem', marginBottom: 8 }}>
          Student Portal
        </h1>
        <p style={{ color: 'rgba(255,255,255,0.6)', fontSize: '0.875rem', marginBottom: 32 }}>
          Enter your Student ID to access your placement readiness dashboard
        </p>

        <div style={{ textAlign: 'left', marginBottom: 16 }}>
          <label style={{
            color: 'rgba(255,255,255,0.7)', fontSize: '0.8rem', fontWeight: 600,
            textTransform: 'uppercase', letterSpacing: '0.04em', display: 'block', marginBottom: 8
          }}>
            Student ID
          </label>
          <input
            value={studentId}
            onChange={e => { setStudentId(e.target.value); setError('') }}
            onKeyDown={e => e.key === 'Enter' && handleLogin()}
            placeholder="e.g. S001"
            autoFocus
            style={{
              width: '100%', padding: '13px 16px',
              background: 'rgba(255,255,255,0.1)',
              border: '1.5px solid ' + (error ? '#EF4444' : 'rgba(139,92,246,0.4)'),
              borderRadius: 10, color: 'white', fontSize: '1rem',
              outline: 'none', fontFamily: 'DM Sans'
            }}
          />
        </div>

        {error && (
          <div style={{
            display: 'flex', alignItems: 'center', gap: 8,
            color: '#FCA5A5', fontSize: '0.85rem', marginBottom: 16, textAlign: 'left',
            background: 'rgba(239,68,68,0.1)', padding: '10px 14px', borderRadius: 8
          }}>
            <AlertCircle size={16} style={{ flexShrink: 0 }} />
            {error}
          </div>
        )}

        <button
          onClick={() => handleLogin()}
          disabled={loading}
          style={{
            width: '100%', padding: '13px', background: '#1A1033', color: 'white',
            border: 'none', borderRadius: 10, fontSize: '1rem', fontWeight: 600,
            cursor: loading ? 'not-allowed' : 'pointer', marginBottom: 24,
            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
            fontFamily: 'DM Sans', opacity: loading ? 0.7 : 1
          }}
        >
          {loading ? 'Logging in...' : <><LogIn size={18} /> Enter as Student</>}
        </button>

        <div style={{ borderTop: '1px solid rgba(255,255,255,0.1)', paddingTop: 20 }}>
          <p style={{
            color: 'rgba(255,255,255,0.5)', fontSize: '0.8rem', marginBottom: 12,
            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6
          }}>
            <Users size={14} />
            Demo Students — click any card to login instantly
          </p>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
            {Object.entries(DEMO_STUDENTS).map(function([id, s]) {
              return (
                <button
                  key={id}
                  onClick={() => handleLogin(id)}
                  disabled={loading}
                  style={{
                    padding: '10px 12px', background: 'rgba(139,92,246,0.12)',
                    border: '1px solid rgba(139,92,246,0.3)', borderRadius: 10,
                    color: 'rgba(255,255,255,0.85)', fontSize: '0.8rem',
                    cursor: loading ? 'not-allowed' : 'pointer',
                    textAlign: 'left', fontFamily: 'DM Sans'
                  }}
                >
                  <div style={{ color: '#A78BFA', fontWeight: 700, fontSize: '0.85rem', marginBottom: 2 }}>{id}</div>
                  <div style={{ fontSize: '0.78rem', color: 'rgba(255,255,255,0.7)' }}>{s.name}</div>
                </button>
              )
            })}
          </div>
        </div>

        <button
          onClick={() => nav('/')}
          style={{
            marginTop: 20, background: 'transparent', border: 'none',
            color: 'rgba(255,255,255,0.4)', fontSize: '0.85rem',
            cursor: 'pointer', fontFamily: 'DM Sans'
          }}
        >
          Back to Home
        </button>
      </div>
    </div>
  )
}
