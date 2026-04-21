import { Link, useNavigate } from 'react-router-dom'
import { Brain, Home, User } from 'lucide-react'

export default function Header({ type = 'student', studentName = '', extra }) {
  const nav = useNavigate()
  const isInstitution = type === 'institution'

  return (
    <header className={`header ${isInstitution ? 'institution-header' : ''}`}>
      <div className="header-brand">
        <Brain size={28} color="white" />
        <div>
          <h1>PlaceAI {isInstitution ? '– Institution Dashboard' : '– Student Dashboard'}</h1>
          {studentName && <div className="subtitle">Welcome back, {studentName}</div>}
          {isInstitution && <div className="subtitle">Batch Performance &amp; Analytics</div>}
        </div>
      </div>
      <nav className="header-nav">
        {extra}
        {!isInstitution && (
          <Link to="/student/profile">
            <User size={16} /> Profile
          </Link>
        )}
        <Link to="/">
          <Home size={16} /> Home
        </Link>
      </nav>
    </header>
  )
}
