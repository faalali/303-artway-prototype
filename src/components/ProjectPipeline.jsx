import { useState, useEffect } from 'react';

function computeInfo(closeDateStr, openDateStr) {
  const now = new Date();
  const close = closeDateStr ? new Date(closeDateStr + 'T23:59:00') : null;
  const open = openDateStr ? new Date(openDateStr + 'T00:00:00') : null;

  if (!close) return { label: null, urgency: 'normal', phase: 'unknown' };

  const msToClose = close - now;
  const msToOpen = open ? open - now : -1;

  if (open && msToOpen > 0) {
    const daysToOpen = Math.ceil(msToOpen / (1000 * 60 * 60 * 24));
    return {
      label: `Opens in ${daysToOpen}d`,
      sublabel: `Opens ${formatDate(open)}`,
      urgency: 'upcoming',
      phase: 'upcoming'
    };
  }

  if (msToClose < 0) {
    return { label: 'Closed', sublabel: `Closed ${formatDate(close)}`, urgency: 'closed', phase: 'closed' };
  }

  const daysLeft = Math.ceil(msToClose / (1000 * 60 * 60 * 24));
  let urgency = 'normal';
  if (daysLeft <= 7) urgency = 'critical';
  else if (daysLeft <= 21) urgency = 'warning';

  return {
    label: daysLeft === 1 ? '1 day left' : `${daysLeft} days left`,
    sublabel: `Closes ${formatDate(close)}`,
    urgency,
    phase: 'open',
    daysLeft
  };
}

function formatDate(date) {
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

function useCountdown(closeDateStr, openDateStr) {
  const [info, setInfo] = useState(() => computeInfo(closeDateStr, openDateStr));
  useEffect(() => {
    const interval = setInterval(() => setInfo(computeInfo(closeDateStr, openDateStr)), 60000);
    return () => clearInterval(interval);
  }, [closeDateStr, openDateStr]);
  return info;
}

function CountdownBadge({ closeDate, openDate }) {
  const info = useCountdown(closeDate, openDate);
  if (!info.label) return null;

  const colors = {
    critical: { bg: 'rgba(220,53,69,0.18)', border: 'rgba(220,53,69,0.5)', text: '#ff6b7a', dot: '#ff4d5e' },
    warning:  { bg: 'rgba(255,160,50,0.15)', border: 'rgba(255,160,50,0.4)', text: '#ffab40', dot: '#ffab40' },
    upcoming: { bg: 'rgba(139,92,246,0.15)', border: 'rgba(139,92,246,0.4)', text: '#a78bfa', dot: '#a78bfa' },
    closed:   { bg: 'rgba(100,100,120,0.15)', border: 'rgba(100,100,120,0.3)', text: '#888',   dot: '#666' },
    normal:   { bg: 'rgba(52,211,153,0.12)', border: 'rgba(52,211,153,0.35)', text: '#34d399', dot: '#34d399' },
  };
  const c = colors[info.urgency] || colors.normal;

  return (
    <div style={{
      display: 'inline-flex', alignItems: 'center', gap: '0.4rem',
      background: c.bg, border: `1px solid ${c.border}`,
      borderRadius: '999px', padding: '0.25rem 0.65rem',
      fontSize: '0.78rem', fontWeight: 700, color: c.text,
      letterSpacing: '0.02em', whiteSpace: 'nowrap'
    }}>
      <span style={{
        width: 7, height: 7, borderRadius: '50%', background: c.dot,
        boxShadow: info.urgency === 'critical' ? `0 0 6px ${c.dot}` : 'none',
        animation: info.urgency === 'critical' ? 'pulse-dot 1.4s ease-in-out infinite' : 'none',
        flexShrink: 0
      }} />
      {info.label}
    </div>
  );
}

function DateRow({ openDate, closeDate }) {
  const fmt = (ds) => ds ? new Date(ds + 'T12:00:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : '—';
  return (
    <div style={{ display: 'flex', gap: '1rem', marginTop: '0.75rem', flexWrap: 'wrap' }}>
      {openDate && (
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
          <span className="material-symbols-outlined" style={{ fontSize: '0.95rem', color: 'var(--accent-electric)' }}>event_available</span>
          <span>Opens <strong style={{ color: 'var(--text-primary)' }}>{fmt(openDate)}</strong></span>
        </div>
      )}
      {closeDate && (
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
          <span className="material-symbols-outlined" style={{ fontSize: '0.95rem', color: 'var(--accent-terracotta)' }}>event_busy</span>
          <span>Closes <strong style={{ color: 'var(--text-primary)' }}>{fmt(closeDate)}</strong></span>
        </div>
      )}
    </div>
  );
}

const STATUS_COLORS = {
  'Approved':    { color: '#34d399', icon: 'check_circle' },
  'RFQ Active':  { color: 'var(--accent-electric)', icon: 'campaign' },
  'Planning':    { color: '#ffab40', icon: 'pending' },
  'Concept':     { color: '#a78bfa', icon: 'lightbulb' },
  'In Progress': { color: 'var(--accent-electric)', icon: 'construction' },
};

export default function ProjectPipeline({ projects, highlightedProjectId, onLocateOnMap }) {
  useEffect(() => {
    if (highlightedProjectId) {
      setTimeout(() => {
        const el = document.getElementById(`project-${highlightedProjectId}`);
        if (el) {
          el.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }
      }, 100);
    }
  }, [highlightedProjectId]);

  return (
    <>
      <style>{`
        @keyframes pulse-dot {
          0%, 100% { opacity: 1; transform: scale(1); }
          50% { opacity: 0.5; transform: scale(1.4); }
        }
        @keyframes pulse-border {
          0%, 100% { border-color: var(--accent-lavender); box-shadow: 0 0 10px rgba(167, 139, 250, 0.2); }
          50% { border-color: rgba(167, 139, 250, 0.8); box-shadow: 0 0 20px rgba(167, 139, 250, 0.5); }
        }
      `}</style>
      <div className="artist-grid">
        {projects.map((project) => {
          const info = computeInfo(project.closeDate, project.openDate);
          const isCritical = info.urgency === 'critical';
          const isClosed = info.phase === 'closed';
          const statusStyle = STATUS_COLORS[project.status] || { color: 'var(--text-primary)', icon: 'radio_button_unchecked' };
          const isHighlighted = project.id === highlightedProjectId;

          return (
            <div
              key={project.id}
              id={`project-${project.id}`}
              className="artist-card"
              style={{
                padding: '2rem',
                opacity: isClosed ? 0.6 : 1,
                borderColor: isHighlighted ? 'var(--accent-lavender)' : isCritical ? 'rgba(220,53,69,0.35)' : undefined,
                animation: isHighlighted ? 'pulse-border 2s infinite' : undefined,
                position: 'relative',
                overflow: 'hidden',
                transition: 'all 0.3s ease'
              }}
            >
              {/* Urgency glow strip */}
              {isCritical && (
                <div style={{
                  position: 'absolute', top: 0, left: 0, right: 0, height: 3,
                  background: 'linear-gradient(90deg, #ff4d5e, #ff8c69)',
                  borderRadius: '12px 12px 0 0'
                }} />
              )}

              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '0.5rem', flexWrap: 'wrap', marginBottom: '0.75rem' }}>
                <div className="artist-name" style={{ fontSize: '1.1rem', flex: 1, display: 'inline-flex', alignItems: 'center', gap: '0.45rem', flexWrap: 'wrap' }}>
                  <span>{project.name}</span>
                  {project.url && (
                    <a
                      href={project.url.startsWith('http') ? project.url : `https://${project.url}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      title="Visit Official RFP/Opportunity Website"
                      style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        color: 'var(--accent-electric)',
                        textDecoration: 'none',
                        transition: 'all 0.2s ease',
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.color = '#fff';
                        e.currentTarget.style.transform = 'scale(1.1)';
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.color = 'var(--accent-electric)';
                        e.currentTarget.style.transform = 'scale(1)';
                      }}
                    >
                      <span className="material-symbols-outlined" style={{ fontSize: '1.1rem', verticalAlign: 'middle' }}>open_in_new</span>
                    </a>
                  )}
                </div>
                <CountdownBadge closeDate={project.closeDate} openDate={project.openDate} />
              </div>

              {/* Status row */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <span className="material-symbols-outlined" style={{ color: statusStyle.color, fontSize: '1.1rem' }}>
                  {statusStyle.icon}
                </span>
                <span style={{ color: statusStyle.color, fontWeight: 600, fontSize: '0.9rem' }}>{project.status}</span>
              </div>

              <DateRow openDate={project.openDate} closeDate={project.closeDate} />

              <div style={{
                display: 'flex', justifyContent: 'space-between',
                borderTop: '1px solid var(--border-subtle)', paddingTop: '1.25rem', marginTop: '1.25rem'
              }}>
                <div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '0.2rem' }}>Budget</div>
                  <div style={{ color: 'var(--accent-ochre)', fontWeight: 700, fontSize: '1rem' }}>{project.budget}</div>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '0.2rem' }}>Funding</div>
                  <div style={{ color: 'var(--text-primary)', fontWeight: 600, fontSize: '0.9rem' }}>{project.funding}</div>
                </div>
              </div>

              <div style={{ display: 'flex', gap: '0.75rem', marginTop: '1.25rem', width: '100%', flexWrap: 'wrap', alignItems: 'center' }}>
                {onLocateOnMap && (
                  <button
                    type="button"
                    onClick={() => onLocateOnMap(project.id)}
                    style={{
                      flex: 1,
                      display: 'inline-flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '0.4rem',
                      padding: '0.75rem 1.25rem',
                      background: 'rgba(167, 139, 250, 0.08)',
                      border: '1px solid rgba(167, 139, 250, 0.25)',
                      borderRadius: '8px',
                      color: 'var(--accent-lavender)',
                      fontSize: '0.85rem',
                      fontWeight: 700,
                      cursor: 'pointer',
                      transition: 'all 0.2s ease',
                      fontFamily: 'inherit'
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.background = 'rgba(167, 139, 250, 0.16)';
                      e.currentTarget.style.borderColor = 'rgba(167, 139, 250, 0.4)';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.background = 'rgba(167, 139, 250, 0.08)';
                      e.currentTarget.style.borderColor = 'rgba(167, 139, 250, 0.25)';
                    }}
                  >
                    <span className="material-symbols-outlined" style={{ fontSize: '1.15rem' }}>explore</span>
                    Locate on Map
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </>
  );
}
