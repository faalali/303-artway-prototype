import React from 'react';

/**
 * UserDashboard.jsx
 *
 * Renders the personalized submission portal dashboard for registered creative practitioners,
 * providing real-time tracking of review stages, custom recommendations, and matching metrics.
 */
export default function UserDashboard({ user = { displayName: 'Creative' }, submissions = [] }) {
  return (
    <div style={{
      minHeight: '100vh',
      background: 'var(--bg-dark)',
      fontFamily: "'Outfit', sans-serif",
      padding: '2rem 1.5rem',
      backgroundImage: 'radial-gradient(circle at top right, rgba(224, 90, 71, 0.05), transparent 45%), radial-gradient(circle at bottom left, rgba(74, 131, 237, 0.05), transparent 45%)'
    }}>
      <div style={{ maxWidth: '1100px', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '2rem' }}>
        
        {/* Profile Welcome Banner */}
        <div style={{
          background: 'var(--bg-panel)',
          border: '1px solid var(--border-subtle)',
          borderRadius: '24px',
          padding: '2.5rem',
          boxShadow: '0 12px 30px rgba(0,0,0,0.3)',
          position: 'relative',
          overflow: 'hidden'
        }}>
          <div style={{ position: 'absolute', top: '-50px', right: '-50px', width: '150px', height: '150px', borderRadius: '50%', background: 'var(--accent-terracotta)', filter: 'blur(80px)', opacity: 0.1 }} />
          <h1 style={{
            fontSize: '2.3rem',
            fontWeight: 900,
            margin: 0,
            color: '#fff',
            fontFamily: "'Space Grotesk', sans-serif",
            letterSpacing: '-0.5px'
          }}>
            Welcome back, {user.displayName}
          </h1>

          <p style={{ marginTop: '0.6rem', textTransform: 'uppercase', letterSpacing: '2px', fontSize: '0.8rem', color: 'var(--accent-ochre)', fontWeight: 700 }}>
            ILA Gallery Creative Partner Portal
          </p>
          <p style={{ marginTop: '0.5rem', color: 'var(--text-secondary)', fontSize: '0.98rem', maxWidth: '600px', lineHeight: 1.5 }}>
            Access and track your ongoing municipal public art applications, coordinate required styling parameters, and locate newly listed community opportunities.
          </p>
        </div>

        {/* Dynamic Metric Blocks */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
          gap: '1.5rem'
        }}>
          <div style={{
            background: 'var(--bg-panel)',
            border: '1px solid var(--border-subtle)',
            borderRadius: '20px',
            padding: '1.75rem',
            boxShadow: '0 8px 24px rgba(0,0,0,0.2)',
            position: 'relative'
          }}>
            <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 3, background: 'var(--accent-electric)' }} />
            <h2 style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '1px', margin: 0 }}>
              Submitted Applications
            </h2>
            <p style={{ fontSize: '3.5rem', fontWeight: 700, margin: '1rem 0 0', color: '#fff', fontFamily: "'Space Grotesk', sans-serif" }}>
              {submissions.length}
            </p>
          </div>

          <div style={{
            background: 'var(--bg-panel)',
            border: '1px solid var(--border-subtle)',
            borderRadius: '20px',
            padding: '1.75rem',
            boxShadow: '0 8px 24px rgba(0,0,0,0.2)',
            position: 'relative'
          }}>
            <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 3, background: 'var(--accent-terracotta)' }} />
            <h2 style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '1px', margin: 0 }}>
              Under Active Review
            </h2>
            <p style={{ fontSize: '3.5rem', fontWeight: 700, margin: '1rem 0 0', color: '#fff', fontFamily: "'Space Grotesk', sans-serif" }}>
              {submissions.filter((s) => s.status === 'under_review').length}
            </p>
          </div>

          <div style={{
            background: 'var(--bg-panel)',
            border: '1px solid var(--border-subtle)',
            borderRadius: '20px',
            padding: '1.75rem',
            boxShadow: '0 8px 24px rgba(0,0,0,0.2)',
            position: 'relative'
          }}>
            <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 3, background: 'var(--accent-ochre)' }} />
            <h2 style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '1px', margin: 0 }}>
              Matching Opportunities
            </h2>
            <p style={{ fontSize: '3.5rem', fontWeight: 700, margin: '1rem 0 0', color: '#fff', fontFamily: "'Space Grotesk', sans-serif" }}>
              12
            </p>
          </div>
        </div>

        {/* Detailed Submission Log Section */}
        <div style={{
          background: 'var(--bg-panel)',
          border: '1px solid var(--border-subtle)',
          borderRadius: '24px',
          padding: '2rem'
        }}>
          <h3 style={{ margin: 0, fontSize: '1.3rem', fontWeight: 700, color: '#fff', fontFamily: "'Space Grotesk', sans-serif", marginBottom: '1.5rem' }}>
            Submission Activity Trace
          </h3>
          
          {submissions.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '3rem 1rem', color: 'var(--text-secondary)' }}>
              <span className="material-symbols-outlined" style={{ fontSize: '3rem', opacity: 0.2, marginBottom: '0.5rem', display: 'block' }}>
                folder_open
              </span>
              No submissions traced under this account. Launch public forms to get started.
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              {submissions.map((sub, idx) => (
                <div
                  key={sub.id || idx}
                  style={{
                    background: 'rgba(255,255,255,0.02)',
                    border: '1px solid rgba(255,255,255,0.04)',
                    borderRadius: '12px',
                    padding: '1.1rem 1.4rem',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    flexWrap: 'wrap',
                    gap: '1rem'
                  }}
                >
                  <div>
                    <h4 style={{ margin: 0, fontSize: '1.05rem', color: '#fff', fontWeight: 700 }}>
                      {sub.title || sub.firstName ? `${sub.firstName} ${sub.lastName}` : 'Creative Registration Entry'}
                    </h4>
                    <p style={{ margin: '0.2rem 0 0', fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                      Application ID: <strong style={{ color: 'var(--accent-electric)' }}>{sub.id || 'N/A'}</strong> • Type: {sub.type || sub.formType || 'Registry'}
                    </p>
                  </div>
                  
                  <span style={{
                    padding: '0.25rem 0.75rem',
                    borderRadius: '20px',
                    fontSize: '0.72rem',
                    fontWeight: 700,
                    textTransform: 'uppercase',
                    letterSpacing: '0.5px',
                    background: sub.status === 'approved' ? 'rgba(78,200,140,0.1)' : 'rgba(74,131,237,0.1)',
                    border: sub.status === 'approved' ? '1px solid rgba(78,200,140,0.3)' : '1px solid rgba(74,131,237,0.3)',
                    color: sub.status === 'approved' ? '#34d399' : '#60a5fa'
                  }}>
                    {sub.status || 'Pending Vetting'}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
