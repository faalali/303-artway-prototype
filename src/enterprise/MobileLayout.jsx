import React from 'react';

/**
 * MobileLayout.jsx
 *
 * Responsive, mobile-first header and footer container wrapper.
 */
export default function MobileLayout({ children }) {
  return (
    <div style={{
      minHeight: '100vh',
      background: 'var(--bg-dark)',
      display: 'flex',
      flexDirection: 'column',
      fontFamily: "'Outfit', sans-serif"
    }}>
      {/* Responsive Header */}
      <header style={{
        position: 'sticky',
        top: 0,
        zIndex: 100,
        background: 'rgba(13, 13, 15, 0.75)',
        backdropFilter: 'blur(20px)',
        borderBottom: '1px solid var(--border-subtle)',
        padding: '0.85rem 1.5rem',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center'
      }}>
        <h1 style={{
          fontSize: '1.25rem',
          fontWeight: 900,
          margin: 0,
          color: '#fff',
          fontFamily: "'Space Grotesk', sans-serif"
        }}>
          ILA<span style={{ color: 'var(--accent-terracotta)' }}>GALLERY</span>
        </h1>

        <button style={{
          background: 'rgba(255,255,255,0.05)',
          border: '1px solid rgba(255,255,255,0.1)',
          borderRadius: '8px',
          padding: '0.4rem 0.8rem',
          color: '#fff',
          fontSize: '0.8rem',
          fontWeight: 700,
          cursor: 'pointer',
          fontFamily: "'Space Grotesk', sans-serif"
        }}>
          Dashboard
        </button>
      </header>

      {/* Main Content */}
      <main style={{
        flex: 1,
        padding: '1.5rem',
        paddingBottom: '6rem' // Prevent content overlap with footer on short viewports
      }}>
        {children}
      </main>

      {/* Fixed Sticky Mobile Navigation/Action Bar */}
      <div style={{
        position: 'fixed',
        bottom: 0,
        left: 0,
        right: 0,
        background: 'rgba(13, 13, 15, 0.85)',
        backdropFilter: 'blur(25px)',
        borderTop: '1px solid var(--border-subtle)',
        padding: '1rem 1.5rem',
        display: 'flex',
        gap: '1rem',
        zIndex: 99
      }}>
        <button style={{
          width: '100%',
          background: 'var(--accent-terracotta)',
          color: '#fff',
          border: 'none',
          padding: '0.9rem',
          borderRadius: '12px',
          fontSize: '0.95rem',
          fontWeight: 700,
          cursor: 'pointer',
          fontFamily: "'Space Grotesk', sans-serif",
          boxShadow: '0 4px 12px rgba(224, 90, 71, 0.3)'
        }}>
          Continue
        </button>
      </div>
    </div>
  );
}
