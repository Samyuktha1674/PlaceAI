import { useNavigate } from 'react-router-dom'
import { Brain, TrendingUp, Lightbulb, Target, Users, Building2, Zap, Upload } from 'lucide-react'

export default function Landing() {
  const nav = useNavigate()

  return (
    <div style={{ minHeight: '100vh', background: 'linear-gradient(135deg, #0F0A1E 0%, #1E1040 50%, #0F0A1E 100%)' }}>
      {/* Nav */}
      <header style={{ padding: '16px 40px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, color: 'white' }}>
          <Brain size={32} color="#8B5CF6" />
          <span style={{ fontFamily: 'Space Grotesk', fontWeight: 700, fontSize: '1.4rem', color: 'white' }}>PlaceAI</span>
        </div>
      </header>

      {/* Hero */}
      <main style={{ textAlign: 'center', padding: '60px 24px 48px' }}>
        <div style={{ marginBottom: 24 }}>
          <Brain size={64} color="#8B5CF6" style={{ margin: '0 auto 16px' }} />
        </div>
        <h1 style={{
          fontFamily: 'Space Grotesk', fontWeight: 700, fontSize: 'clamp(2rem,5vw,3rem)',
          color: 'white', marginBottom: 12
        }}>
          PlaceAI
        </h1>
        <p style={{ color: '#A78BFA', fontSize: '1.1rem', marginBottom: 8 }}>
          Explainable AI-Driven Placement Readiness System
        </p>
        <p style={{ color: '#C4B5FD', fontStyle: 'italic', fontSize: '0.95rem', marginBottom: 48 }}>
          "From Prediction to Explanation — Smart Placement Readiness with AI"
        </p>
        <p style={{ color: 'rgba(255,255,255,0.7)', maxWidth: 600, margin: '0 auto 60px', lineHeight: 1.7 }}>
          An intelligent decision intelligence platform that helps students and institutions understand
          placement readiness through transparent, data-driven AI analysis
        </p>

        {/* Live Demo Banner */}
        <div style={{
          display:'inline-flex', alignItems:'center', gap:10,
          background:'rgba(139,92,246,0.15)', border:'1px solid rgba(139,92,246,0.4)',
          borderRadius:40, padding:'10px 24px', marginBottom:40, cursor:'pointer'
        }} onClick={() => nav('/predict')}>
          <Zap size={18} color="#A78BFA"/>
          <span style={{ color:'#A78BFA', fontWeight:600, fontSize:'0.9rem' }}>
            🎯 Try Live Prediction Demo — enter any student data and get instant AI results
          </span>
          <span style={{ color:'#A78BFA', fontWeight:700 }}>→</span>
        </div>

        {/* Portal cards */}
        <div style={{ display: 'flex', gap: 24, justifyContent: 'center', flexWrap: 'wrap', marginBottom: 64 }}>
          {/* Student portal */}
          <div style={{
            background: 'rgba(255,255,255,0.05)', backdropFilter: 'blur(20px)',
            border: '1px solid rgba(139,92,246,0.3)', borderRadius: 16,
            padding: '40px 36px', width: 340, textAlign: 'center'
          }}>
            <Users size={48} color="#8B5CF6" style={{ margin: '0 auto 16px' }} />
            <h2 style={{ color: 'white', fontFamily: 'Space Grotesk', fontSize: '1.3rem', marginBottom: 12 }}>
              Student Portal
            </h2>
            <p style={{ color: 'rgba(255,255,255,0.65)', fontSize: '0.9rem', lineHeight: 1.6, marginBottom: 28 }}>
              Analyze your placement readiness, understand your strengths and weaknesses,
              and follow personalized learning paths
            </p>
            <button
              className="btn btn-primary btn-full btn-lg"
              onClick={() => nav('/student/login')}
              style={{ background: '#1A1033', color: 'white', fontSize: '0.95rem' }}
            >
              Enter as Student
            </button>
          </div>

          {/* Institution portal */}
          <div style={{
            background: 'rgba(255,255,255,0.05)', backdropFilter: 'blur(20px)',
            border: '1px solid rgba(139,92,246,0.3)', borderRadius: 16,
            padding: '40px 36px', width: 340, textAlign: 'center'
          }}>
            <Building2 size={48} color="#8B5CF6" style={{ margin: '0 auto 16px' }} />
            <h2 style={{ color: 'white', fontFamily: 'Space Grotesk', fontSize: '1.3rem', marginBottom: 12 }}>
              Institution Portal
            </h2>
            <p style={{ color: 'rgba(255,255,255,0.65)', fontSize: '0.9rem', lineHeight: 1.6, marginBottom: 28 }}>
              Analyze batch performance, identify weak areas, and improve training strategies
              with data-driven insights
            </p>
            <button
              className="btn btn-outline btn-full btn-lg"
              onClick={() => nav('/institution')}
              style={{ borderColor: '#8B5CF6', color: '#8B5CF6', fontSize: '0.95rem' }}
            >
              Enter as Institution
            </button>
          </div>
        </div>

        {/* Platform Features */}
        <h2 style={{ color: 'white', fontFamily: 'Space Grotesk', fontSize: '1.6rem', marginBottom: 32 }}>
          Platform Features
        </h2>
        <div style={{ display: 'flex', gap: 20, justifyContent: 'center', flexWrap: 'wrap', marginBottom: 48 }}>
          {[
            { Icon: TrendingUp, color: '#10B981', title: 'Predictive Analytics',
              desc: 'ML-powered placement probability predictions with risk level classification based on historical data patterns' },
            { Icon: Lightbulb, color: '#F59E0B', title: 'Explainable AI',
              desc: 'Transparent SHAP-like visualizations showing exactly how each factor influences your placement readiness' },
            { Icon: Target, color: '#EF4444', title: 'Personalized Paths',
              desc: 'Custom learning roadmaps aligned with skill gaps, company expectations, and industry standards' },
          ].map(({ Icon, color, title, desc }) => (
            <div key={title} style={{
              background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)',
              borderRadius: 12, padding: '28px 24px', width: 320, textAlign: 'left'
            }}>
              <Icon size={32} color={color} style={{ marginBottom: 12 }} />
              <h3 style={{ color: 'white', fontFamily: 'Space Grotesk', marginBottom: 8 }}>{title}</h3>
              <p style={{ color: 'rgba(255,255,255,0.6)', fontSize: '0.875rem', lineHeight: 1.6 }}>{desc}</p>
            </div>
          ))}
        </div>

        {/* What system offers */}
        <div style={{
          background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.1)',
          borderRadius: 16, padding: '40px', maxWidth: 800, margin: '0 auto 40px',
          textAlign: 'left'
        }}>
          <h2 style={{ color: 'white', fontFamily: 'Space Grotesk', textAlign: 'center', marginBottom: 28 }}>
            What This System Offers
          </h2>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 32 }}>
            <div>
              <h3 style={{ color: '#8B5CF6', marginBottom: 16 }}>For Students:</h3>
              {['Placement readiness analysis with risk assessment',
                'Detailed skill gap identification',
                'Personalized learning recommendations',
                'What-if scenario analysis',
                'Company expectation matching',
                'Progress tracking dashboard'
              ].map(item => (
                <div key={item} style={{ color: 'rgba(255,255,255,0.75)', fontSize: '0.875rem', marginBottom: 8 }}>
                  • {item}
                </div>
              ))}
            </div>
            <div>
              <h3 style={{ color: '#8B5CF6', marginBottom: 16 }}>For Institutions:</h3>
              {['Batch performance analytics',
                'Common weakness identification',
                'Placement prediction insights',
                'Training strategy recommendations',
                'Student risk segmentation',
                'Historical trend analysis'
              ].map(item => (
                <div key={item} style={{ color: 'rgba(255,255,255,0.75)', fontSize: '0.875rem', marginBottom: 8 }}>
                  • {item}
                </div>
              ))}
            </div>
          </div>
        </div>

        <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: '0.8rem', fontStyle: 'italic' }}>
          This system focuses on decision support and transparent AI explanations. It does not guarantee placements
          but helps in informed preparation and strategic planning.
        </p>
      </main>
    </div>
  )
}
