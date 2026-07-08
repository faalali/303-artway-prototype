import React from 'react';

/**
 * SubmissionProgress.jsx
 *
 * Renders an accessible, highly elegant step-by-step progress indicator
 * representing the active stage in form transmission loops.
 *
 * Stages:
 *  0 - Validating Information
 *  1 - Saving Submission
 *  2 - Backing Up Records
 *  3 - Submission Complete
 */
export default function SubmissionProgress({ step = 0 }) {
  const stages = [
    'Validating Information',
    'Saving Submission',
    'Backing Up Records',
    'Submission Complete'
  ];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', fontFamily: "'Outfit', sans-serif" }}>
      {stages.map((label, index) => {
        const isActive = step === index;
        const isDone = step > index;

        return (
          <div
            key={label}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '1rem',
              opacity: isActive || isDone ? 1 : 0.45,
              transition: 'opacity 0.3s ease'
            }}
          >
            {/* Status dot indicator */}
            <div
              style={{
                width: '1.25rem',
                height: '1.25rem',
                borderRadius: '50%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                transition: 'all 0.3s ease',
                background: isDone ? '#4ec88c' : isActive ? 'var(--accent-terracotta)' : 'rgba(255,255,255,0.08)',
                border: isDone ? '1px solid #4ec88c' : isActive ? '1px solid var(--accent-terracotta)' : '1px solid rgba(255,255,255,0.15)',
                boxShadow: isActive ? '0 0 10px rgba(224,90,71,0.4)' : 'none',
                color: isDone ? '#0d0d0f' : '#fff',
                fontSize: '0.7rem',
                fontWeight: 700
              }}
            >
              {isDone ? '✓' : index + 1}
            </div>

            <p style={{
              margin: 0,
              fontSize: '0.95rem',
              fontWeight: isActive ? 700 : 500,
              color: isActive ? '#fff' : 'var(--text-secondary)',
              transition: 'color 0.3s ease'
            }}>
              {label}
            </p>
          </div>
        );
      })}
    </div>
  );
}
