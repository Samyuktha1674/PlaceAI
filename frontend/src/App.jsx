import { Routes, Route, Navigate } from 'react-router-dom'
import Landing from './pages/Landing.jsx'
import StudentLogin from './pages/StudentLogin.jsx'
import StudentDashboard from './pages/StudentDashboard.jsx'
import StudentProfile from './pages/StudentProfile.jsx'
import AIAnalysis from './pages/AIAnalysis.jsx'
import SkillGapPage from './pages/SkillGapPage.jsx'
import LearningPathPage from './pages/LearningPathPage.jsx'
import WhatIfPage from './pages/WhatIfPage.jsx'
import InstitutionDashboard from './pages/InstitutionDashboard.jsx'
import BatchAnalytics from './pages/BatchAnalytics.jsx'
import LivePredict from './pages/LivePredict.jsx'
import BatchUpload from './pages/BatchUpload.jsx'

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<Landing />} />
      <Route path="/student/login" element={<StudentLogin />} />
      <Route path="/student" element={<StudentDashboard />} />
      <Route path="/student/profile" element={<StudentProfile />} />
      <Route path="/student/analysis" element={<AIAnalysis />} />
      <Route path="/student/skill-gaps" element={<SkillGapPage />} />
      <Route path="/student/learning-path" element={<LearningPathPage />} />
      <Route path="/student/what-if" element={<WhatIfPage />} />
      <Route path="/institution" element={<InstitutionDashboard />} />
      <Route path="/institution/analytics" element={<BatchAnalytics />} />
      <Route path="/predict" element={<LivePredict />} />
      <Route path="/institution/upload" element={<BatchUpload />} />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}
