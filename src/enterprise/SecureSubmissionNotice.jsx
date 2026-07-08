import React from 'react';

/**
 * SecureSubmissionNotice.jsx
 *
 * Trust notification banner providing user assurance regarding secure storage limits.
 */
export default function SecureSubmissionNotice() {
  return (
    <div style={{
      background: 'rgba(78, 200, 140, 0.05)',
      border: '1px solid rgba(78, 200, 140, 0.25)',
      borderRadius: '16px',
      padding: '1.25rem 1.5rem',
      fontFamily: "'Outfit', sans-serif",
      display: 'flex',
      flexDirection: 'column',
      gap: '0.4rem',
      boxShadow: '0 4px 15px rgba(0,0,0,0.1)'
    }}>
      <p style={{
        margin: 0,
        fontWeight: 700,
        color: '#4ec88c',
        fontSize: '0.98rem',
        display: 'flex',
        alignItems: 'center',
        gap: '0.4rem',
        fontFamily: "'Space Grotesk', sans-serif"
      }}>
        <span className="material-symbols-outlined" style={{ fontSize: '1.15rem' }}>verified_user</span>
        Your submission is securely saved and encrypted.
      </p>

      <p style={{
        margin: 0,
        color: 'var(--text-secondary)',
        fontSize: '0.85rem',
        lineHeight: 1.5
      }}>
        You will receive confirmation and status updates as your submission progresses through our administrative review pipelines.
      </p>
    </div>
  );
}
