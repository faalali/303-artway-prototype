/**
 * SubmissionStatus.jsx
 *
 * Exact user-facing messages:
 *   success        → "Submission saved successfully."
 *   sheets_pending → "Saved successfully. Backup sync is in progress."
 *   firebase_error → "Submission failed. Please try again."  + Retry button
 *
 * NEVER silently fails. NEVER assumes success. Always shows feedback.
 */
import { useState, useEffect, useRef } from 'react';

const STAGES = {
  validating:     { icon: 'fact_check',   color: '#60a5fa', spin: false, message: 'Validating your information...' },
  saving:         { icon: 'cloud_upload', color: '#60a5fa', spin: true,  message: 'Saving to database...' },
  queuing:        { icon: 'sync',         color: '#60a5fa', spin: true,  message: 'Queuing backup sync...' },
  success:        { icon: 'check_circle', color: '#34d399', spin: false, message: 'Submission saved successfully.' },
  sheets_pending: { icon: 'cloud_done',   color: '#f59e0b', spin: false, message: 'Saved successfully. Backup sync is in progress.' },
  firebase_error: { icon: 'error',        color: '#f87171', spin: false, message: 'Submission failed. Please try again.' },
};

export default function SubmissionStatus({ stage = 'idle', onRetry }) {
  const [show, setShow]     = useState(false);
  const [dots, setDots]     = useState('');
  const intervalRef         = useRef(null);

  useEffect(() => {
    if (stage && stage !== 'idle') setShow(true);
  }, [stage]);

  // Animated dots for in-progress states
  useEffect(() => {
    const cfg = STAGES[stage];
    if (cfg?.spin) {
      intervalRef.current = setInterval(() => {
        setDots(d => d.length >= 3 ? '' : d + '.');
      }, 400);
    } else {
      clearInterval(intervalRef.current);
      setDots('');
    }
    return () => clearInterval(intervalRef.current);
  }, [stage]);

  if (!show || stage === 'idle') return null;

  const cfg     = STAGES[stage] || STAGES.firebase_error;
  const isError = stage === 'firebase_error';
  const isDone  = stage === 'success' || stage === 'sheets_pending';

  return (
    <div
      role="status"
      aria-live="assertive"
      style={{
        display:       'flex',
        alignItems:    'flex-start',
        gap:           '0.85rem',
        padding:       '1rem 1.25rem',
        borderRadius:  '12px',
        marginTop:     '1rem',
        border:        `1px solid ${cfg.color}33`,
        background:    `${cfg.color}0d`,
        animation:     'fadeIn 0.2s ease',
        transition:    'all 0.3s ease',
      }}
    >
      {/* Icon */}
      <span
        className={`material-symbols-outlined${cfg.spin ? ' spinning' : ''}`}
        style={{ fontSize: '1.35rem', color: cfg.color, flexShrink: 0, marginTop: '1px' }}
        aria-hidden="true"
      >
        {cfg.icon}
      </span>

      {/* Message */}
      <div style={{ flex: 1 }}>
        <p style={{
          margin:     0,
          fontSize:   '0.92rem',
          fontWeight: 600,
          color:      cfg.color,
          fontFamily: "'Space Grotesk', sans-serif",
          lineHeight: 1.4,
        }}>
          {cfg.message}{cfg.spin ? dots : ''}
        </p>

        {/* Secondary explanation for pending */}
        {stage === 'sheets_pending' && (
          <p style={{ margin: '0.3rem 0 0', fontSize: '0.78rem', color: 'rgba(255,255,255,0.4)', lineHeight: 1.5 }}>
            Your submission is saved in our database. The spreadsheet backup will sync automatically in the background.
          </p>
        )}

        {/* Secondary for error */}
        {isError && (
          <p style={{ margin: '0.3rem 0 0', fontSize: '0.78rem', color: 'rgba(255,255,255,0.4)', lineHeight: 1.5 }}>
            Check your internet connection or review your inputs and try again.
          </p>
        )}
      </div>

      {/* Retry button — only on error */}
      {isError && onRetry && (
        <button
          type="button"
          onClick={onRetry}
          aria-label="Retry submission"
          style={{
            display:     'inline-flex',
            alignItems:  'center',
            gap:         '0.3rem',
            padding:     '0.45rem 0.9rem',
            background:  'rgba(255,255,255,0.07)',
            border:      '1px solid rgba(255,255,255,0.15)',
            borderRadius:'8px',
            color:       '#fff',
            fontSize:    '0.82rem',
            fontWeight:  700,
            cursor:      'pointer',
            fontFamily:  'inherit',
            flexShrink:  0,
            whiteSpace:  'nowrap',
          }}
          onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.13)'}
          onMouseLeave={e => e.currentTarget.style.background = 'rgba(255,255,255,0.07)'}
        >
          <span className="material-symbols-outlined" style={{ fontSize: '0.95rem' }}>refresh</span>
          Retry
        </button>
      )}
    </div>
  );
}
