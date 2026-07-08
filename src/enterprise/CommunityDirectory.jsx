import React from 'react';

/**
 * CommunityDirectory.jsx
 *
 * Renders an elegant grid representing registered partner artists,
 * utilizing prototype styling patterns (ochre tag limits, transited card hovers).
 */
export default function CommunityDirectory({ artists = [] }) {
  return (
    <div
      style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
        gap: '2rem',
        fontFamily: "'Outfit', sans-serif"
      }}
    >
      {artists.length === 0 ? (
        <div style={{
          gridColumn: '1 / -1',
          textAlign: 'center',
          padding: '4rem 1rem',
          color: 'var(--text-secondary)',
          background: 'var(--bg-panel)',
          border: '1px solid var(--border-subtle)',
          borderRadius: '16px'
        }}>
          <span className="material-symbols-outlined" style={{ fontSize: '3.5rem', opacity: 0.2, marginBottom: '0.5rem', display: 'block' }}>
            group
          </span>
          No artists registered in the community directory yet.
        </div>
      ) : (
        artists.map((artist) => (
          <div
            key={artist.id}
            className="artist-card"
            style={{
              background: 'var(--bg-panel)',
              border: '1px solid var(--border-subtle)',
              borderRadius: '20px',
              overflow: 'hidden',
              display: 'flex',
              flexDirection: 'column',
              position: 'relative',
              transition: 'transform 0.3s ease, box-shadow 0.3s ease'
            }}
          >
            {/* Header image cover (checks if present, otherwise provides gorgeous gradient filler) */}
            {artist.image ? (
              <img
                src={artist.image}
                alt={artist.name || `${artist.firstName} ${artist.lastName}`}
                style={{
                  height: '14rem',
                  width: '100%',
                  objectFit: 'cover',
                  borderBottom: '1px solid var(--border-subtle)'
                }}
              />
            ) : (
              <div style={{
                height: '10rem',
                width: '100%',
                background: 'linear-gradient(135deg, rgba(224, 90, 71, 0.12) 0%, rgba(74, 131, 237, 0.08) 100%)',
                borderBottom: '1px solid var(--border-subtle)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: 'var(--text-secondary)'
              }}>
                <span className="material-symbols-outlined" style={{ fontSize: '2.5rem', opacity: 0.35 }}>image</span>
              </div>
            )}

            {/* Inner details */}
            <div style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '0.5rem', flex: 1 }}>
              <h2 className="artist-name" style={{
                fontSize: '1.3rem',
                fontWeight: 700,
                margin: 0,
                color: '#fff',
                fontFamily: "'Space Grotesk', sans-serif"
              }}>
                {artist.name || `${artist.firstName} ${artist.lastName}`}
              </h2>

              <p style={{
                margin: 0,
                fontSize: '0.85rem',
                color: 'var(--accent-ochre)',
                fontWeight: 600,
                textTransform: 'uppercase',
                letterSpacing: '1px'
              }}>
                {artist.discipline || artist.primaryMedium || 'Multidisciplinary Artist'}
              </p>

              {artist.communityAffiliations && (
                <p style={{
                  margin: '0.2rem 0 0',
                  fontSize: '0.82rem',
                  color: 'var(--text-secondary)',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.25rem'
                }}>
                  <span className="material-symbols-outlined" style={{ fontSize: '0.95rem', color: 'var(--accent-terracotta)' }}>location_on</span>
                  {artist.communityAffiliations}
                </p>
              )}
            </div>
          </div>
        ))
      )}
    </div>
  );
}
