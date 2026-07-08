import { useState, useEffect } from 'react';

// Hook that returns live countdown data for a given closeDate string
function useCountdown(closeDateStr, openDateStr) {
  const [info, setInfo] = useState(() => computeInfo(closeDateStr, openDateStr));

  useEffect(() => {
    const interval = setInterval(() => {
      setInfo(computeInfo(closeDateStr, openDateStr));
    }, 60000); // refresh every minute
    return () => clearInterval(interval);
  }, [closeDateStr, openDateStr]);

  return info;
}

function computeInfo(closeDateStr, openDateStr) {
  const now = new Date();
  const close = closeDateStr ? new Date(closeDateStr + 'T23:59:00') : null;
  const open = openDateStr ? new Date(openDateStr + 'T00:00:00') : null;

  if (!close) return { label: null, urgency: 'normal', phase: 'unknown' };

  const msToClose = close - now;
  const msToOpen = open ? open - now : -1;

  // Not yet open
  if (open && msToOpen > 0) {
    const daysToOpen = Math.ceil(msToOpen / (1000 * 60 * 60 * 24));
    return {
      label: `Opens in ${daysToOpen}d`,
      sublabel: `Opens ${formatDate(open)}`,
      urgency: 'upcoming',
      phase: 'upcoming'
    };
  }

  // Already closed
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

function CountdownBadge({ closeDate, openDate }) {
  const info = useCountdown(closeDate, openDate);
  if (!info.label) return null;

  const colors = {
    critical: { bg: 'rgba(220,53,69,0.18)', border: 'rgba(220,53,69,0.5)', text: '#ff6b7a', dot: '#ff4d5e' },
    warning:  { bg: 'rgba(255,160,50,0.15)', border: 'rgba(255,160,50,0.4)', text: '#ffab40', dot: '#ffab40' },
    upcoming: { bg: 'rgba(139,92,246,0.15)', border: 'rgba(139,92,246,0.4)', text: '#a78bfa', dot: '#a78bfa' },
    closed:   { bg: 'rgba(100,100,120,0.15)', border: 'rgba(100,100,120,0.3)', text: '#888', dot: '#666' },
    normal:   { bg: 'rgba(52,211,153,0.12)', border: 'rgba(52,211,153,0.35)', text: '#34d399', dot: '#34d399' },
  };
  const c = colors[info.urgency] || colors.normal;

  return (
    <div style={{
      display: 'inline-flex', alignItems: 'center', gap: '0.4rem',
      background: c.bg, border: `1px solid ${c.border}`,
      borderRadius: '999px', padding: '0.25rem 0.65rem',
      fontSize: '0.78rem', fontWeight: 700, color: c.text,
      letterSpacing: '0.02em'
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

export default function FundingSources({ sources, onApply, onBroadcast, onDelete, onLocateOnMap }) {
  return (
    <>
      <style>{`
        @keyframes pulse-dot {
          0%, 100% { opacity: 1; transform: scale(1); }
          50% { opacity: 0.5; transform: scale(1.4); }
        }
      `}</style>
      <div className="artist-grid">
        {sources.map((source) => {
          const info = computeInfo(source.closeDate, source.openDate);
          const isCritical = info.urgency === 'critical';
          const isClosed = info.phase === 'closed';

          return (
            <div
              key={source.id}
              className="artist-card"
              style={{
                padding: '2rem',
                opacity: isClosed ? 0.6 : 1,
                borderColor: isCritical ? 'rgba(220,53,69,0.35)' : undefined,
                position: 'relative',
                overflow: 'hidden'
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

              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '0.5rem', flexWrap: 'wrap' }}>
                <div className="artist-name" style={{ fontSize: '1.1rem', flex: 1 }}>{source.title}</div>
                <CountdownBadge closeDate={source.closeDate} openDate={source.openDate} />
              </div>

              <div className="artist-neighborhood" style={{ marginTop: '0.4rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%', flexWrap: 'wrap', gap: '0.5rem' }}>
                <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.35rem' }}>
                  <span className="material-symbols-outlined">account_balance</span> {source.provider}
                </span>
                {source.url && (
                  <a
                    href={source.url.startsWith('http') ? source.url : `https://${source.url}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '0.25rem',
                      color: 'var(--accent-electric)',
                      fontSize: '0.78rem',
                      fontWeight: 700,
                      textDecoration: 'none',
                      padding: '0.25rem 0.55rem',
                      borderRadius: '6px',
                      background: 'rgba(59,130,246,0.08)',
                      border: '1px solid rgba(59,130,246,0.15)',
                      transition: 'all 0.2s ease',
                      marginLeft: 'auto'
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.background = 'rgba(59,130,246,0.16)';
                      e.currentTarget.style.borderColor = 'rgba(59,130,246,0.3)';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.background = 'rgba(59,130,246,0.08)';
                      e.currentTarget.style.borderColor = 'rgba(59,130,246,0.15)';
                    }}
                  >
                    <span>Visit Website</span>
                    <span className="material-symbols-outlined" style={{ fontSize: '0.85rem' }}>open_in_new</span>
                  </a>
                )}
              </div>

              {/* Type badge */}
              <div style={{ marginTop: '0.6rem', display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                <span style={{
                  display: 'inline-block', fontSize: '0.72rem', fontWeight: 600,
                  background: 'rgba(139,92,246,0.15)', border: '1px solid rgba(139,92,246,0.3)',
                  color: '#a78bfa', borderRadius: '4px', padding: '0.15rem 0.5rem',
                  letterSpacing: '0.05em', textTransform: 'uppercase'
                }}>{source.type}</span>

                {source.isCommunityPost && (
                  <span style={{
                    display: 'inline-block', fontSize: '0.72rem', fontWeight: 700,
                    background: 'rgba(74, 131, 237, 0.15)', border: '1px solid rgba(74, 131, 237, 0.3)',
                    color: 'var(--accent-electric)', borderRadius: '4px', padding: '0.15rem 0.5rem',
                    letterSpacing: '0.05em', textTransform: 'uppercase'
                  }}>Client Post</span>
                )}
              </div>

              {source.isCommunityPost && (
                <div style={{ 
                  marginTop: '0.85rem', 
                  background: 'rgba(255,255,255,0.01)', 
                  border: '1px solid rgba(255,255,255,0.04)', 
                  borderRadius: '10px', 
                  padding: '0.75rem 1rem', 
                  fontSize: '0.82rem',
                  color: 'var(--text-secondary)',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '0.35rem'
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                    <span className="material-symbols-outlined" style={{ fontSize: '1rem', color: 'var(--accent-electric)' }}>contact_mail</span>
                    <span>Contact: <strong style={{ color: 'var(--text-primary)' }}>{source.contactPerson || 'N/A'}</strong> ({source.contactEmail || 'N/A'})</span>
                  </div>
                  {source.contactPhone && (
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                      <span className="material-symbols-outlined" style={{ fontSize: '1rem' }}>call</span>
                      <span>Phone: <strong style={{ color: 'var(--text-primary)' }}>{source.contactPhone}</strong></span>
                    </div>
                  )}
                  {source.mediums && source.mediums.length > 0 && (
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', flexWrap: 'wrap', marginTop: '0.2rem' }}>
                      <span className="material-symbols-outlined" style={{ fontSize: '1rem', color: 'var(--accent-ochre)' }}>label</span>
                      <span>Needs: </span>
                      {source.mediums.map(med => (
                        <span key={med} style={{ fontSize: '0.72rem', padding: '0.1rem 0.35rem', background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '4px', color: 'var(--text-primary)' }}>{med}</span>
                      ))}
                    </div>
                  )}

                  {source.attachedBriefs && source.attachedBriefs.length > 0 && (
                    <div style={{ 
                      marginTop: '0.5rem', 
                      paddingTop: '0.5rem', 
                      borderTop: '1px solid rgba(255,255,255,0.05)',
                      display: 'flex', 
                      flexDirection: 'column', 
                      gap: '0.25rem' 
                    }}>
                      <div style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-primary)' }}>Attached Brief / Mockups:</div>
                      {source.attachedBriefs.map((file, idx) => (
                        <a 
                          key={idx} 
                          href={file.base64Data} 
                          download={file.name}
                          style={{ fontSize: '0.78rem', color: 'var(--accent-electric)', textDecoration: 'underline', display: 'inline-flex', alignItems: 'center', gap: '0.25rem', width: 'fit-content' }}
                        >
                          <span className="material-symbols-outlined" style={{ fontSize: '0.9rem' }}>download</span> 
                          {file.name}
                        </a>
                      ))}
                    </div>
                  )}
                </div>
              )}

              <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', margin: '0.9rem 0 0', lineHeight: 1.55 }}>
                {source.description}
              </p>

              <DateRow openDate={source.openDate} closeDate={source.closeDate} />

              {/* Amount / Status footer */}
              <div style={{
                display: 'flex', justifyContent: 'space-between',
                borderTop: '1px solid var(--border-subtle)', paddingTop: '1.25rem', marginTop: '1.25rem'
              }}>
                <div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '0.2rem' }}>Amount</div>
                  <div style={{ color: 'var(--accent-ochre)', fontWeight: 700, fontSize: '1rem' }}>{source.amount}</div>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '0.2rem' }}>Status</div>
                  <div style={{
                    color: isClosed ? '#888'
                      : (source.status.includes('Open') || source.status.includes('Active') || source.status.includes('Rolling'))
                        ? 'var(--accent-electric)' : 'var(--text-primary)',
                    fontWeight: 600
                  }}>
                    {source.status}
                  </div>
                </div>
              </div>

              {/* ── PRIMARY CTA: Build Proposal ── */}
              {!isClosed && (
                <button
                  onClick={() => onApply && onApply(source)}
                  className="btn-build-proposal"
                  id={`build-proposal-${source.id}`}
                >
                  <span style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <span className="material-symbols-outlined" style={{ fontSize: '1.15rem' }}>edit_note</span>
                    Build Proposal
                  </span>
                  <span style={{ display: 'flex', alignItems: 'center', gap: '0.2rem', fontSize: '0.78rem', opacity: 0.85 }}>
                    Open Grant Assistant
                    <span className="material-symbols-outlined" style={{ fontSize: '1rem' }}>arrow_forward</span>
                  </span>
                </button>
              )}

              <div style={{ display: 'flex', gap: '0.6rem', marginTop: '0.6rem', width: '100%', flexWrap: 'wrap', alignItems: 'center' }}>

                {onLocateOnMap && (
                  <button
                    type="button"
                    onClick={() => onLocateOnMap(source.id)}
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '0.4rem',
                      padding: '0.75rem 1.25rem',
                      background: 'rgba(224, 90, 71, 0.08)',
                      border: '1px solid rgba(224, 90, 71, 0.25)',
                      borderRadius: '8px',
                      color: 'var(--accent-terracotta)',
                      fontSize: '0.85rem',
                      fontWeight: 700,
                      cursor: 'pointer',
                      transition: 'all 0.2s ease',
                      fontFamily: 'inherit'
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.background = 'rgba(224, 90, 71, 0.16)';
                      e.currentTarget.style.borderColor = 'rgba(224, 90, 71, 0.4)';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.background = 'rgba(224, 90, 71, 0.08)';
                      e.currentTarget.style.borderColor = 'rgba(224, 90, 71, 0.25)';
                    }}
                  >
                    <span className="material-symbols-outlined" style={{ fontSize: '1.15rem' }}>explore</span>
                    Locate on Map
                  </button>
                )}

                {source.isCommunityPost && onBroadcast && (
                  <button
                    type="button"
                    onClick={() => onBroadcast(source)}
                    style={{
                      flex: isClosed ? '1' : '0 auto',
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '0.4rem',
                      padding: '0.75rem 1.25rem',
                      background: 'rgba(74, 131, 237, 0.1)',
                      border: '1px solid rgba(74, 131, 237, 0.25)',
                      borderRadius: '8px',
                      color: 'var(--accent-electric)',
                      fontSize: '0.85rem',
                      fontWeight: 700,
                      cursor: 'pointer',
                      transition: 'all 0.2s ease',
                      fontFamily: 'inherit'
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.background = 'rgba(74, 131, 237, 0.18)';
                      e.currentTarget.style.borderColor = 'rgba(74, 131, 237, 0.4)';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.background = 'rgba(74, 131, 237, 0.1)';
                      e.currentTarget.style.borderColor = 'rgba(74, 131, 237, 0.25)';
                    }}
                  >
                    <span className="material-symbols-outlined" style={{ fontSize: '1.15rem' }}>campaign</span>
                    Broadcast Alert
                  </button>
                )}

                {onDelete && (
                  <button
                    type="button"
                    onClick={() => onDelete(source.id)}
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '0.4rem',
                      padding: '0.75rem',
                      background: 'rgba(230, 92, 70, 0.08)',
                      border: '1px solid rgba(230, 92, 70, 0.2)',
                      borderRadius: '8px',
                      color: 'var(--accent-terracotta)',
                      fontSize: '0.85rem',
                      fontWeight: 700,
                      cursor: 'pointer',
                      transition: 'all 0.2s ease',
                      fontFamily: 'inherit',
                      flexShrink: 0
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.background = 'rgba(230, 92, 70, 0.16)';
                      e.currentTarget.style.borderColor = 'rgba(230, 92, 70, 0.35)';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.background = 'rgba(230, 92, 70, 0.08)';
                      e.currentTarget.style.borderColor = 'rgba(230, 92, 70, 0.2)';
                    }}
                    title="Remove Opportunity"
                  >
                    <span className="material-symbols-outlined" style={{ fontSize: '1.15rem' }}>delete</span>
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

