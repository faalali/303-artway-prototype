import React from 'react';

/**
 * NotificationCenter.jsx
 *
 * Renders active administrative notifications, review reports,
 * and system synchronization alert dispatches for registered creative users.
 */
export default function NotificationCenter({ notifications = [] }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', fontFamily: "'Outfit', sans-serif" }}>
      {notifications.length === 0 ? (
        <div style={{
          textAlign: 'center',
          padding: '2.5rem 1rem',
          color: 'var(--text-secondary)',
          background: 'rgba(255,255,255,0.01)',
          border: '1px dashed rgba(255,255,255,0.06)',
          borderRadius: '16px'
        }}>
          <span className="material-symbols-outlined" style={{ fontSize: '2rem', opacity: 0.2, marginBottom: '0.4rem', display: 'block' }}>
            notifications_off
          </span>
          No new messages in your notifications feed.
        </div>
      ) : (
        notifications.map((item) => (
          <div
            key={item.id}
            style={{
              background: 'var(--bg-panel)',
              border: '1px solid var(--border-subtle)',
              borderRadius: '16px',
              padding: '1.25rem 1.5rem',
              boxShadow: '0 4px 15px rgba(0,0,0,0.15)',
              display: 'flex',
              flexDirection: 'column',
              gap: '0.5rem',
              position: 'relative'
            }}
          >
            <h3 style={{
              margin: 0,
              fontSize: '1.05rem',
              fontWeight: 700,
              color: '#fff',
              fontFamily: "'Space Grotesk', sans-serif"
            }}>
              {item.title}
            </h3>

            <p style={{
              margin: 0,
              fontSize: '0.9rem',
              color: 'var(--text-secondary)',
              lineHeight: 1.5
            }}>
              {item.message}
            </p>
          </div>
        ))
      )}
    </div>
  );
}
