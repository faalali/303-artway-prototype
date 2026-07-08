import { useState, useMemo } from 'react';
import { findMatchingArtistsForRFQ } from '../data/mockDatabase';

// 60-day public visibility window for all community posts
const TTL_DAYS = 60;

/** 
 * ArtistContactCard — renders a single matched artist with full contact info.
 * Beta: all contact info is visible to commissioners.
 */
function ArtistContactCard({ artist, idx, opportunity }) {
  const [expanded, setExpanded] = useState(false);

  const name = artist.alias || `${artist.firstName} ${artist.lastName}`;
  const isVetted = artist.vettingStatus === 'Vetted';

  const introSubject = encodeURIComponent(
    `Opportunity Introduction: ${opportunity?.title || 'Art Commission'}`
  );
  const introBody = encodeURIComponent(
    `Hi ${artist.firstName || name},\n\nWe came across your profile in the ILA Gallery Creative Registry and think you may be a great fit for an upcoming project.\n\n` +
    `Project: ${opportunity?.title || 'N/A'}\nClient: ${opportunity?.provider || 'N/A'}\nBudget: ${opportunity?.amount || 'N/A'}\nDeadline: ${opportunity?.closeDate || 'N/A'}\n\n` +
    `We'd love to connect and share more details. Please let us know if you're interested!\n\nWarm regards,\n${opportunity?.provider || 'The Team'}`
  );

  return (
    <div style={{
      border: `1px solid ${isVetted ? 'rgba(78,200,140,0.2)' : 'rgba(255,255,255,0.07)'}`,
      borderRadius: '12px',
      overflow: 'hidden',
      background: 'rgba(255,255,255,0.015)',
      transition: 'border-color 0.2s ease',
    }}>
      {/* Card Header — always visible, click to expand */}
      <div
        onClick={() => setExpanded(p => !p)}
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '0.9rem 1.2rem',
          cursor: 'pointer',
          gap: '0.75rem',
        }}
      >
        {/* Rank + Name + Medium */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flex: 1, minWidth: 0 }}>
          <div style={{
            width: '28px', height: '28px', borderRadius: '50%', flexShrink: 0,
            background: 'rgba(74,131,237,0.12)', border: '1px solid rgba(74,131,237,0.25)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: '0.7rem', fontWeight: 700, color: 'var(--accent-electric)'
          }}>
            {idx + 1}
          </div>
          <div style={{ minWidth: 0 }}>
            <div style={{ fontWeight: 600, fontSize: '0.9rem', color: '#fff', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
              {name}
            </div>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginTop: '0.1rem' }}>
              {artist.primaryMedium}
              {artist.secondaryMediums?.length > 0 && (
                <span style={{ color: 'rgba(255,255,255,0.25)' }}> + {artist.secondaryMediums.slice(0,2).join(', ')}</span>
              )}
              {' '}• {artist.city}, {artist.state}
            </div>
          </div>
        </div>

        {/* Right side: vetting + availability + chevron */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexShrink: 0 }}>
          {artist.availabilityStatus && (
            <span style={{
              fontSize: '0.65rem', padding: '0.15rem 0.4rem',
              background: artist.availabilityStatus === 'Available' ? 'rgba(78,200,140,0.1)' : 'rgba(255,171,64,0.1)',
              border: `1px solid ${artist.availabilityStatus === 'Available' ? 'rgba(78,200,140,0.25)' : 'rgba(255,171,64,0.25)'}`,
              color: artist.availabilityStatus === 'Available' ? '#4ec88c' : '#ffab40',
              borderRadius: '4px', fontWeight: 700
            }}>
              {artist.availabilityStatus}
            </span>
          )}
          <span style={{
            fontSize: '0.65rem', padding: '0.15rem 0.4rem',
            background: isVetted ? 'rgba(78,200,140,0.12)' : 'rgba(230,92,70,0.12)',
            border: `1px solid ${isVetted ? 'rgba(78,200,140,0.3)' : 'rgba(230,92,70,0.3)'}`,
            color: isVetted ? '#4ec88c' : 'var(--accent-terracotta)',
            borderRadius: '4px', fontWeight: 700
          }}>
            {isVetted ? '✓ Vetted' : artist.vettingStatus}
          </span>
          <span className="material-symbols-outlined" style={{
            fontSize: '1.1rem', color: 'rgba(255,255,255,0.3)',
            transform: expanded ? 'rotate(180deg)' : 'rotate(0deg)',
            transition: 'transform 0.25s ease'
          }}>
            expand_more
          </span>
        </div>
      </div>

      {/* Expanded Contact Details */}
      {expanded && (
        <div style={{
          borderTop: '1px solid rgba(255,255,255,0.06)',
          padding: '1.1rem 1.2rem',
          display: 'flex', flexDirection: 'column', gap: '1rem',
          animation: 'fadeIn 0.2s ease'
        }}>
          {/* Bio / Capabilities blurb */}
          {artist.capabilitiesDescription && (
            <p style={{ margin: 0, fontSize: '0.82rem', color: 'var(--text-secondary)', lineHeight: '1.55', fontStyle: 'italic' }}>
              "{artist.capabilitiesDescription}"
            </p>
          )}

          {/* Contact Grid */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.65rem', fontSize: '0.82rem' }}>
            {artist.email && (
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', overflow: 'hidden' }}>
                <span className="material-symbols-outlined" style={{ fontSize: '0.95rem', color: 'var(--accent-electric)', flexShrink: 0 }}>mail</span>
                <a
                  href={`mailto:${artist.email}?subject=${introSubject}&body=${introBody}`}
                  style={{ color: 'var(--accent-electric)', textDecoration: 'underline', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}
                  onClick={e => e.stopPropagation()}
                >
                  {artist.email}
                </a>
              </div>
            )}
            {artist.phone && (
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                <span className="material-symbols-outlined" style={{ fontSize: '0.95rem', color: '#4ec88c', flexShrink: 0 }}>call</span>
                <a
                  href={`tel:${artist.phone}`}
                  style={{ color: '#4ec88c', textDecoration: 'none' }}
                  onClick={e => e.stopPropagation()}
                >
                  {artist.phone}
                </a>
              </div>
            )}
            {artist.website && (
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', overflow: 'hidden' }}>
                <span className="material-symbols-outlined" style={{ fontSize: '0.95rem', color: 'var(--accent-ochre)', flexShrink: 0 }}>language</span>
                <a
                  href={artist.website.startsWith('http') ? artist.website : `https://${artist.website}`}
                  target="_blank" rel="noopener noreferrer"
                  style={{ color: 'var(--accent-ochre)', textDecoration: 'underline', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}
                  onClick={e => e.stopPropagation()}
                >
                  {artist.website.replace(/^https?:\/\//, '')}
                </a>
              </div>
            )}
            {artist.instagram && (
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                <span className="material-symbols-outlined" style={{ fontSize: '0.95rem', color: '#c084fc', flexShrink: 0 }}>photo_camera</span>
                <a
                  href={`https://instagram.com/${artist.instagram.replace('@', '')}`}
                  target="_blank" rel="noopener noreferrer"
                  style={{ color: '#c084fc', textDecoration: 'underline' }}
                  onClick={e => e.stopPropagation()}
                >
                  {artist.instagram}
                </a>
              </div>
            )}
            {artist.linkedin && (
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', overflow: 'hidden' }}>
                <span className="material-symbols-outlined" style={{ fontSize: '0.95rem', color: 'rgba(255,255,255,0.45)', flexShrink: 0 }}>person</span>
                <a
                  href={artist.linkedin}
                  target="_blank" rel="noopener noreferrer"
                  style={{ color: 'rgba(255,255,255,0.55)', textDecoration: 'underline', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}
                  onClick={e => e.stopPropagation()}
                >
                  LinkedIn Profile
                </a>
              </div>
            )}
            {artist.budgetRange && (
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                <span className="material-symbols-outlined" style={{ fontSize: '0.95rem', color: 'var(--accent-ochre)', flexShrink: 0 }}>payments</span>
                <span style={{ color: 'var(--text-primary)' }}>{artist.budgetRange}</span>
              </div>
            )}
          </div>

          {/* Notable projects */}
          {artist.notableProjects && (
            <div style={{ fontSize: '0.78rem', color: 'rgba(255,255,255,0.35)' }}>
              <span style={{ color: 'rgba(255,255,255,0.45)', fontWeight: 600 }}>Notable: </span>
              {artist.notableProjects}
            </div>
          )}

          {/* CTA: Send Intro Email */}
          {artist.email && (
            <a
              href={`mailto:${artist.email}?subject=${introSubject}&body=${introBody}`}
              onClick={e => e.stopPropagation()}
              style={{
                display: 'inline-flex', alignItems: 'center', gap: '0.45rem',
                padding: '0.6rem 1.25rem',
                background: 'rgba(74,131,237,0.12)',
                border: '1px solid rgba(74,131,237,0.3)',
                borderRadius: '8px',
                color: 'var(--accent-electric)',
                fontSize: '0.82rem', fontWeight: 700,
                textDecoration: 'none',
                alignSelf: 'flex-start',
                transition: 'all 0.2s ease',
              }}
              onMouseEnter={e => { e.currentTarget.style.background = 'rgba(74,131,237,0.22)'; e.currentTarget.style.borderColor = 'rgba(74,131,237,0.5)'; }}
              onMouseLeave={e => { e.currentTarget.style.background = 'rgba(74,131,237,0.12)'; e.currentTarget.style.borderColor = 'rgba(74,131,237,0.3)'; }}
            >
              <span className="material-symbols-outlined" style={{ fontSize: '1rem' }}>forward_to_inbox</span>
              Send Intro Email
            </a>
          )}
        </div>
      )}
    </div>
  );
}


/** Returns { daysLeft, expiresOn, isExpired, isExpiringSoon } for a community post */
function getExpiryInfo(opp) {
  // Fall back to closeDate if no submittedAt stamp (legacy posts)
  const anchor = opp.submittedAt || opp.openDate;
  if (!anchor) return { daysLeft: TTL_DAYS, expiresOn: null, isExpired: false, isExpiringSoon: false };
  const posted  = new Date(anchor);
  const expires = new Date(posted.getTime() + TTL_DAYS * 24 * 60 * 60 * 1000);
  const now     = new Date();
  const msLeft  = expires - now;
  const daysLeft = Math.ceil(msLeft / (1000 * 60 * 60 * 24));
  return {
    daysLeft,
    expiresOn: expires.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
    isExpired: daysLeft <= 0,
    isExpiringSoon: daysLeft > 0 && daysLeft <= 10,
  };
}

export default function ArtInNeedDashboard({ opportunities, onBroadcast, isSyncing, onDelete, isAdmin, onLocateOnMap }) {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCity, setSelectedCity] = useState('');
  const [selectedScale, setSelectedScale] = useState('');
  const [selectedStyle, setSelectedStyle] = useState('');
  const [selectedOpportunity, setSelectedOpportunity] = useState(null);
  // Admin toggle to show expired posts (hidden from public automatically)
  const [showExpired, setShowExpired] = useState(false);
  const [confirmDeleteId, setConfirmDeleteId] = useState(null);

  // Expose all unique cities, scales, and styles in current listings for filtering
  const cities = useMemo(() => {
    const list = opportunities.map(o => o.city).filter(Boolean);
    return [...new Set(list)];
  }, [opportunities]);

  const scales = ["Small", "Medium", "Large", "Digital"];

  const styles = useMemo(() => {
    const list = opportunities.flatMap(o => o.styles || []).filter(Boolean);
    return [...new Set(list)];
  }, [opportunities]);

  // Separate expired from live
  const { liveOpportunities, expiredOpportunities } = useMemo(() => {
    const live    = [];
    const expired = [];
    opportunities.forEach(opp => {
      const { isExpired } = getExpiryInfo(opp);
      (isExpired ? expired : live).push(opp);
    });
    return { liveOpportunities: live, expiredOpportunities: expired };
  }, [opportunities]);

  // What the user actually sees (admins can peek at expired; public never can)
  const visiblePool = isAdmin && showExpired ? expiredOpportunities : liveOpportunities;

  // Filter opportunities
  const filteredOpportunities = useMemo(() => {
    return visiblePool.filter(opp => {
      const title = opp.title || opp.name || '';
      const client = opp.provider || '';
      const desc = opp.description || '';
      
      const matchesSearch = searchQuery.trim() === '' || 
        title.toLowerCase().includes(searchQuery.toLowerCase()) || 
        client.toLowerCase().includes(searchQuery.toLowerCase()) ||
        desc.toLowerCase().includes(searchQuery.toLowerCase());

      const matchesCity = selectedCity === '' || opp.city === selectedCity;
      const matchesScale = selectedScale === '' || opp.scale === selectedScale;
      const matchesStyle = selectedStyle === '' || (opp.styles || []).includes(selectedStyle);

      return matchesSearch && matchesCity && matchesScale && matchesStyle;
    });
  }, [visiblePool, searchQuery, selectedCity, selectedScale, selectedStyle]);

  /** Trigger delete with optional in-line confirmation flow */
  const handleQuickDelete = (oppId, e) => {
    e.stopPropagation();
    if (confirmDeleteId === oppId) {
      // Second click — confirmed
      onDelete && onDelete(oppId);
      if (selectedOpportunity?.id === oppId) setSelectedOpportunity(null);
      setConfirmDeleteId(null);
    } else {
      setConfirmDeleteId(oppId);
      // Auto-reset after 4 s if no second click
      setTimeout(() => setConfirmDeleteId(prev => (prev === oppId ? null : prev)), 4000);
    }
  };

  return (
    <div style={{ animation: 'fadeIn 0.35s ease-out' }}>

      {/* Admin Controls Bar — only visible to admins */}
      {isAdmin && (
        <div style={{
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          flexWrap: 'wrap', gap: '0.75rem',
          background: 'rgba(224,90,71,0.04)',
          border: '1px solid rgba(224,90,71,0.2)',
          borderRadius: '12px', padding: '0.85rem 1.25rem',
          marginBottom: '1.5rem',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', fontSize: '0.82rem', color: 'rgba(255,255,255,0.55)' }}>
            <span className="material-symbols-outlined" style={{ fontSize: '1rem', color: 'var(--accent-terracotta)' }}>admin_panel_settings</span>
            <strong style={{ color: '#fff' }}>Admin Mode</strong>
            <span style={{
              padding: '0.15rem 0.55rem', borderRadius: '999px', fontSize: '0.7rem', fontWeight: 700,
              background: 'rgba(52,211,153,0.12)', color: '#4ec88c', border: '1px solid rgba(52,211,153,0.25)'
            }}>
              {liveOpportunities.length} Live
            </span>
            {expiredOpportunities.length > 0 && (
              <span style={{
                padding: '0.15rem 0.55rem', borderRadius: '999px', fontSize: '0.7rem', fontWeight: 700,
                background: 'rgba(255,107,122,0.1)', color: '#ff6b7a', border: '1px solid rgba(255,107,122,0.2)'
              }}>
                {expiredOpportunities.length} Expired
              </span>
            )}
            <span style={{ color: 'rgba(255,255,255,0.25)', fontSize: '0.75rem' }}>
              — Posts auto-expire after {TTL_DAYS} days. Expired posts are hidden from the public portal.
            </span>
          </div>

          {expiredOpportunities.length > 0 && (
            <button
              onClick={() => setShowExpired(p => !p)}
              style={{
                display: 'flex', alignItems: 'center', gap: '0.35rem',
                background: showExpired ? 'rgba(255,107,122,0.12)' : 'rgba(255,255,255,0.04)',
                border: `1px solid ${showExpired ? 'rgba(255,107,122,0.35)' : 'rgba(255,255,255,0.08)'}`,
                borderRadius: '8px', padding: '0.45rem 0.9rem',
                color: showExpired ? '#ff6b7a' : 'rgba(255,255,255,0.5)',
                fontSize: '0.78rem', fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit',
                transition: 'all 0.2s ease',
              }}
            >
              <span className="material-symbols-outlined" style={{ fontSize: '0.9rem' }}>
                {showExpired ? 'visibility_off' : 'history'}
              </span>
              {showExpired ? 'Back to Live Posts' : `View ${expiredOpportunities.length} Expired Post${expiredOpportunities.length !== 1 ? 's' : ''}`}
            </button>
          )}
        </div>
      )}

      {/* Search & Filters Glassmorphic Bar */}

      <div style={{
        background: 'rgba(255, 255, 255, 0.02)',
        border: '1px solid var(--border-subtle)',
        borderRadius: '16px',
        padding: '1.5rem',
        marginBottom: '2rem',
        display: 'flex',
        flexWrap: 'wrap',
        gap: '1rem',
        alignItems: 'center',
        backdropFilter: 'blur(10px)'
      }}>
        
        {/* Search */}
        <div style={{ flex: '1 1 250px', position: 'relative' }}>
          <span className="material-symbols-outlined" style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', color: 'rgba(255,255,255,0.3)', fontSize: '1.2rem' }}>search</span>
          <input 
            type="text"
            placeholder="Search by title, description, or client..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            style={{
              width: '100%',
              padding: '0.8rem 1rem 0.8rem 2.8rem',
              background: 'rgba(0,0,0,0.3)',
              border: '1px solid rgba(255,255,255,0.08)',
              borderRadius: '10px',
              color: '#fff',
              outline: 'none',
              fontSize: '0.9rem',
              fontFamily: 'inherit',
              boxSizing: 'border-box'
            }}
          />
        </div>

        {/* City Filter */}
        <select 
          value={selectedCity} 
          onChange={(e) => setSelectedCity(e.target.value)}
          style={{
            padding: '0.8rem 1rem',
            background: 'rgba(0,0,0,0.3)',
            border: '1px solid rgba(255,255,255,0.08)',
            borderRadius: '10px',
            color: selectedCity ? '#fff' : 'rgba(255,255,255,0.5)',
            outline: 'none',
            fontSize: '0.9rem',
            fontFamily: 'inherit',
            minWidth: '150px',
            cursor: 'pointer'
          }}
        >
          <option value="" style={{ background: '#141416', color: '#fff' }}>All Cities</option>
          {cities.map(c => (
            <option key={c} value={c} style={{ background: '#141416', color: '#fff' }}>{c}</option>
          ))}
        </select>

        {/* Scale Filter */}
        <select 
          value={selectedScale} 
          onChange={(e) => setSelectedScale(e.target.value)}
          style={{
            padding: '0.8rem 1rem',
            background: 'rgba(0,0,0,0.3)',
            border: '1px solid rgba(255,255,255,0.08)',
            borderRadius: '10px',
            color: selectedScale ? '#fff' : 'rgba(255,255,255,0.5)',
            outline: 'none',
            fontSize: '0.9rem',
            fontFamily: 'inherit',
            minWidth: '140px',
            cursor: 'pointer'
          }}
        >
          <option value="" style={{ background: '#141416', color: '#fff' }}>All Scales</option>
          {scales.map(s => (
            <option key={s} value={s} style={{ background: '#141416', color: '#fff' }}>{s} Scale</option>
          ))}
        </select>

        {/* Style Filter */}
        <select 
          value={selectedStyle} 
          onChange={(e) => setSelectedStyle(e.target.value)}
          style={{
            padding: '0.8rem 1rem',
            background: 'rgba(0,0,0,0.3)',
            border: '1px solid rgba(255,255,255,0.08)',
            borderRadius: '10px',
            color: selectedStyle ? '#fff' : 'rgba(255,255,255,0.5)',
            outline: 'none',
            fontSize: '0.9rem',
            fontFamily: 'inherit',
            minWidth: '160px',
            cursor: 'pointer'
          }}
        >
          <option value="" style={{ background: '#141416', color: '#fff' }}>All Styles</option>
          {styles.map(st => (
            <option key={st} value={st} style={{ background: '#141416', color: '#fff' }}>{st}</option>
          ))}
        </select>

      </div>

      {/* Grid of Art in Need Entries */}
      {filteredOpportunities.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '4rem 2rem', background: 'rgba(255,255,255,0.01)', border: '1px dashed var(--border-subtle)', borderRadius: '16px', color: 'var(--text-secondary)' }}>
          <span className="material-symbols-outlined" style={{ fontSize: '2.5rem', marginBottom: '0.75rem' }}>campaign</span>
          <div style={{ fontSize: '1rem', fontWeight: 600 }}>No client opportunities posted.</div>
          <div style={{ fontSize: '0.85rem', marginTop: '0.25rem' }}>Community RFQs and creative needs will appear here once posted via the public Art in Need Portal.</div>
        </div>
      ) : (
        <div className="artist-grid">
          {filteredOpportunities.map(opp => {
            const closingDate = opp.closeDate ? new Date(opp.closeDate + 'T12:00:00') : null;
            const isClosed = closingDate && closingDate < new Date();
            
            return (
              <div 
                key={opp.id}
                className="artist-card"
                onClick={() => setSelectedOpportunity(opp)}
                style={{
                  padding: '2rem',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '0.85rem',
                  cursor: 'pointer',
                  borderColor: selectedOpportunity?.id === opp.id ? 'var(--accent-electric)' : undefined,
                  opacity: isClosed ? 0.6 : 1,
                  position: 'relative',
                  transition: 'transform 0.2s ease, border-color 0.2s ease'
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '0.75rem' }}>
                  <h3 style={{ margin: 0, fontSize: '1.15rem', color: 'var(--text-primary)', fontFamily: 'Space Grotesk', flex: 1 }}>{opp.title}</h3>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexShrink: 0 }}>
                    <span style={{ 
                      fontSize: '0.7rem', 
                      padding: '0.2rem 0.5rem', 
                      borderRadius: '6px', 
                      background: 'rgba(74, 131, 237, 0.12)', 
                      color: 'var(--accent-electric)', 
                      border: '1px solid rgba(74, 131, 237, 0.25)', 
                      fontWeight: 700,
                      whiteSpace: 'nowrap'
                    }}>
                      {opp.city}
                    </span>

                    {/* Admin quick-remove button */}
                    {isAdmin && onDelete && (
                      <button
                        onClick={(e) => handleQuickDelete(opp.id, e)}
                        title={confirmDeleteId === opp.id ? 'Click again to confirm removal' : 'Remove this opportunity'}
                        style={{
                          background: confirmDeleteId === opp.id ? 'rgba(220,53,69,0.22)' : 'rgba(220,53,69,0.08)',
                          border: `1px solid ${confirmDeleteId === opp.id ? 'rgba(220,53,69,0.6)' : 'rgba(220,53,69,0.2)'}`,
                          borderRadius: '6px', padding: '0.2rem 0.45rem',
                          color: confirmDeleteId === opp.id ? '#ff6b7a' : 'rgba(255,107,122,0.6)',
                          cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.2rem',
                          fontSize: '0.68rem', fontWeight: 700, fontFamily: 'inherit',
                          transition: 'all 0.2s ease',
                          whiteSpace: 'nowrap',
                        }}
                      >
                        <span className="material-symbols-outlined" style={{ fontSize: '0.8rem' }}>delete</span>
                        {confirmDeleteId === opp.id ? 'Confirm?' : 'Remove'}
                      </button>
                    )}
                  </div>
                </div>

                <div style={{ fontSize: '0.85rem', color: 'rgba(255,255,255,0.4)', display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                  <span className="material-symbols-outlined" style={{ fontSize: '1rem' }}>corporate_fare</span>
                  {opp.provider}
                </div>

                <p style={{ margin: 0, fontSize: '0.88rem', color: 'var(--text-secondary)', lineHeight: '1.5', display: '-webkit-box', WebkitLineClamp: 3, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                  {opp.description}
                </p>

                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.4rem', marginTop: '0.25rem', alignItems: 'center' }}>
                  <span style={{ fontSize: '0.7rem', padding: '0.15rem 0.45rem', background: 'rgba(139,92,246,0.12)', border: '1px solid rgba(139,92,246,0.25)', color: '#a78bfa', borderRadius: '4px', textTransform: 'uppercase' }}>
                    {opp.type}
                  </span>
                  <span style={{ fontSize: '0.7rem', padding: '0.15rem 0.45rem', background: 'rgba(235,166,90,0.12)', border: '1px solid rgba(235,166,90,0.25)', color: 'var(--accent-ochre)', borderRadius: '4px' }}>
                    📐 {opp.scale || 'Medium'} Scale
                  </span>

                  {/* Expiry countdown badge */}
                  {(() => {
                    const { daysLeft, expiresOn, isExpiringSoon } = getExpiryInfo(opp);
                    const color   = isExpiringSoon ? '#ffab40' : 'rgba(255,255,255,0.28)';
                    const bg      = isExpiringSoon ? 'rgba(255,171,64,0.1)' : 'rgba(255,255,255,0.02)';
                    const bdr     = isExpiringSoon ? '1px solid rgba(255,171,64,0.3)' : '1px solid rgba(255,255,255,0.05)';
                    return (
                      <span style={{
                        fontSize: '0.68rem', padding: '0.15rem 0.4rem',
                        background: bg, border: bdr, borderRadius: '4px',
                        color, fontWeight: isExpiringSoon ? 700 : 400,
                        display: 'flex', alignItems: 'center', gap: '0.2rem',
                      }}>
                        <span className="material-symbols-outlined" style={{ fontSize: '0.75rem' }}>schedule</span>
                        {isExpiringSoon
                          ? `⚠ ${daysLeft}d left`
                          : expiresOn ? `Until ${expiresOn}` : `${daysLeft}d left`
                        }
                      </span>
                    );
                  })()}
                </div>

                <div style={{ borderTop: '1px solid var(--border-subtle)', paddingTop: '1rem', marginTop: '0.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div>
                    <div style={{ fontSize: '0.72rem', color: 'var(--text-secondary)', textTransform: 'uppercase' }}>Budget</div>
                    <div style={{ fontSize: '0.95rem', fontWeight: 700, color: 'var(--accent-ochre)' }}>{opp.amount}</div>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <div style={{ fontSize: '0.72rem', color: 'var(--text-secondary)', textTransform: 'uppercase' }}>Deadline</div>
                    <div style={{ fontSize: '0.85rem', color: isClosed ? 'rgba(255,90,90,0.9)' : 'var(--text-primary)', fontWeight: 600 }}>{opp.closeDate}</div>
                  </div>
                </div>

                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  marginTop: '0.5rem',
                  flexWrap: 'wrap',
                  gap: '0.5rem',
                  width: '100%'
                }}>
                  {onLocateOnMap && (
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation(); // prevent opening details drawer!
                        onLocateOnMap(opp.id);
                      }}
                      style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '0.35rem',
                        padding: '0.35rem 0.65rem',
                        background: 'rgba(224, 90, 71, 0.08)',
                        border: '1px solid rgba(224, 90, 71, 0.25)',
                        borderRadius: '6px',
                        color: 'var(--accent-terracotta)',
                        fontSize: '0.75rem',
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
                      <span className="material-symbols-outlined" style={{ fontSize: '0.9rem' }}>explore</span>
                      Locate on Map
                    </button>
                  )}
                  <div style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '0.25rem',
                    fontSize: '0.78rem',
                    color: 'var(--accent-electric)',
                    fontWeight: 700,
                    marginLeft: 'auto'
                  }}>
                    View Details & Matches
                    <span className="material-symbols-outlined" style={{ fontSize: '0.9rem' }}>arrow_forward</span>
                  </div>
                </div>

              </div>
            );
          })}
        </div>
      )}

      {/* Expanded Inspection & Matching Drawer Overlay */}
      {selectedOpportunity && (
        <div style={{
          position: 'fixed',
          top: 0, left: 0, right: 0, bottom: 0,
          background: 'rgba(0, 0, 0, 0.75)',
          backdropFilter: 'blur(8px)',
          zIndex: 1000,
          display: 'flex',
          justifyContent: 'flex-end',
          animation: 'fadeIn 0.25s ease'
        }} onClick={() => setSelectedOpportunity(null)}>
          
          <div 
            style={{
              width: '100%',
              maxWidth: '650px',
              height: '100%',
              background: '#0d0d0f',
              borderLeft: '1px solid var(--border-subtle)',
              padding: '3rem 2.5rem',
              boxSizing: 'border-box',
              overflowY: 'auto',
              boxShadow: '-10px 0 40px rgba(0,0,0,0.8)',
              display: 'flex',
              flexDirection: 'column',
              gap: '2rem',
              animation: 'slideLeft 0.3s cubic-bezier(0.16, 1, 0.3, 1)'
            }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Drawer Header */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', borderBottom: '1px solid var(--border-subtle)', paddingBottom: '1.5rem' }}>
              <div>
                <div style={{ fontSize: '0.72rem', color: 'var(--accent-electric)', fontWeight: 700, letterSpacing: '1px', textTransform: 'uppercase', marginBottom: '0.35rem' }}>ART IN NEED POST</div>
                <h2 style={{ margin: 0, fontFamily: 'Space Grotesk', fontSize: '1.5rem', color: '#fff', fontWeight: 700 }}>{selectedOpportunity.title}</h2>
                <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginTop: '0.35rem', display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                  <span className="material-symbols-outlined" style={{ fontSize: '1rem' }}>corporate_fare</span>
                  {selectedOpportunity.provider}
                </div>
              </div>
              <button 
                type="button"
                onClick={() => setSelectedOpportunity(null)}
                style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)', color: '#fff', borderRadius: '50%', width: '36px', height: '36px', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}
              >
                <span className="material-symbols-outlined" style={{ fontSize: '1.2rem' }}>close</span>
              </button>
            </div>

            {/* 60-Day Expiry Status Banner */}
            {(() => {
              const { daysLeft, expiresOn, isExpired, isExpiringSoon } = getExpiryInfo(selectedOpportunity);
              const bg     = isExpired ? 'rgba(255,90,90,0.08)' : isExpiringSoon ? 'rgba(255,171,64,0.08)' : 'rgba(52,211,153,0.06)';
              const border = isExpired ? 'rgba(255,90,90,0.25)' : isExpiringSoon ? 'rgba(255,171,64,0.3)' : 'rgba(52,211,153,0.2)';
              const color  = isExpired ? '#ff6b7a' : isExpiringSoon ? '#ffab40' : '#4ec88c';
              const icon   = isExpired ? 'event_busy' : isExpiringSoon ? 'warning' : 'schedule';
              const label  = isExpired
                ? `This post expired on ${expiresOn} and is no longer visible to the public`
                : isExpiringSoon
                  ? `Expiring soon \u2014 ${daysLeft} day${daysLeft !== 1 ? 's' : ''} remaining (auto-removes ${expiresOn})`
                  : `Active \u2014 visible to artists for ${daysLeft} more day${daysLeft !== 1 ? 's' : ''} (until ${expiresOn})`;
              return (
                <div style={{
                  display: 'flex', alignItems: 'center', gap: '0.65rem',
                  background: bg, border: `1px solid ${border}`,
                  borderRadius: '10px', padding: '0.75rem 1rem',
                }}>
                  <span className="material-symbols-outlined" style={{ fontSize: '1.1rem', color }}>{icon}</span>
                  <div>
                    <div style={{ fontSize: '0.72rem', color, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '0.1rem' }}>
                      {isExpired ? 'Expired' : isExpiringSoon ? 'Expiring Soon' : 'Post Active'}
                    </div>
                    <div style={{ fontSize: '0.82rem', color: 'rgba(255,255,255,0.6)' }}>{label}</div>
                  </div>
                  {isAdmin && onDelete && (
                    <button
                      onClick={() => { onDelete(selectedOpportunity.id); setSelectedOpportunity(null); }}
                      style={{
                        marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: '0.3rem',
                        background: 'rgba(220,53,69,0.1)', border: '1px solid rgba(220,53,69,0.3)',
                        borderRadius: '7px', padding: '0.4rem 0.8rem',
                        color: '#ff6b7a', fontSize: '0.75rem', fontWeight: 700,
                        cursor: 'pointer', fontFamily: 'inherit', whiteSpace: 'nowrap',
                      }}
                    >
                      <span className="material-symbols-outlined" style={{ fontSize: '0.85rem' }}>delete_forever</span>
                      Remove Post
                    </button>
                  )}
                </div>
              );
            })()}


            <div>
              <h4 style={{ margin: 0, fontFamily: 'Space Grotesk', fontSize: '1rem', color: '#fff', marginBottom: '0.75rem' }}>Opportunity Description</h4>
              <p style={{ margin: 0, fontSize: '0.9rem', color: 'var(--text-secondary)', lineHeight: '1.6', background: 'rgba(255,255,255,0.01)', border: '1px solid rgba(255,255,255,0.03)', borderRadius: '12px', padding: '1.25rem' }}>
                {selectedOpportunity.description}
              </p>
            </div>

            {/* Client Profile and Contact Grid */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.25rem', background: 'rgba(255,255,255,0.01)', border: '1px solid var(--border-subtle)', borderRadius: '16px', padding: '1.5rem' }}>
              <div>
                <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', textTransform: 'uppercase' }}>Contact Person</span>
                <div style={{ color: '#fff', fontWeight: 600, fontSize: '0.88rem', marginTop: '0.2rem' }}>{selectedOpportunity.contactPerson || 'N/A'}</div>
              </div>
              <div>
                <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', textTransform: 'uppercase' }}>Email</span>
                <div style={{ marginTop: '0.2rem' }}>
                  <a href={`mailto:${selectedOpportunity.contactEmail}`} style={{ color: 'var(--accent-electric)', textDecoration: 'underline', fontSize: '0.88rem' }}>{selectedOpportunity.contactEmail || 'N/A'}</a>
                </div>
              </div>
              {selectedOpportunity.contactPhone && (
                <div>
                  <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', textTransform: 'uppercase' }}>Phone</span>
                  <div style={{ color: '#fff', fontWeight: 500, fontSize: '0.88rem', marginTop: '0.2rem' }}>{selectedOpportunity.contactPhone}</div>
                </div>
              )}
              {selectedOpportunity.url && (
                <div>
                  <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', textTransform: 'uppercase' }}>Submission Link / Web</span>
                  <div style={{ marginTop: '0.2rem', textOverflow: 'ellipsis', overflow: 'hidden', whiteSpace: 'nowrap' }}>
                    <a href={selectedOpportunity.url.startsWith('http') ? selectedOpportunity.url : `https://${selectedOpportunity.url}`} target="_blank" rel="noopener noreferrer" style={{ color: 'var(--accent-electric)', textDecoration: 'underline', fontSize: '0.88rem' }}>
                      {selectedOpportunity.url}
                    </a>
                  </div>
                </div>
              )}
            </div>

            {/* Criteria Checklist Details */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              <h4 style={{ margin: 0, fontFamily: 'Space Grotesk', fontSize: '1rem', color: '#fff' }}>Criteria Requirements</h4>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', fontSize: '0.85rem' }}>
                <div>
                  <span style={{ color: 'var(--text-secondary)' }}>Required Scale: </span>
                  <strong style={{ color: 'var(--accent-ochre)' }}>{selectedOpportunity.scale || 'Medium'} Scale</strong>
                </div>
                <div>
                  <span style={{ color: 'var(--text-secondary)' }}>Budget / Fee: </span>
                  <strong style={{ color: 'var(--accent-ochre)' }}>{selectedOpportunity.amount}</strong>
                </div>
                {selectedOpportunity.permittingRequirements && (
                  <div>
                    <span style={{ color: 'var(--text-secondary)' }}>Permitting: </span>
                    <strong style={{ color: '#fff' }}>{selectedOpportunity.permittingRequirements}</strong>
                  </div>
                )}
                {selectedOpportunity.permittingPayer && (
                  <div>
                    <span style={{ color: 'var(--text-secondary)' }}>Permitting Paid By: </span>
                    <strong style={{ color: '#fff' }}>{selectedOpportunity.permittingPayer}</strong>
                  </div>
                )}
                {selectedOpportunity.projectRequirements && (
                  <div style={{ gridColumn: 'span 2' }}>
                    <span style={{ color: 'var(--text-secondary)' }}>Project Requirements / Equipment to Bring: </span>
                    <div style={{ 
                      color: '#fff', 
                      marginTop: '0.35rem', 
                      padding: '0.75rem 1rem', 
                      background: 'rgba(255,255,255,0.02)', 
                      border: '1px solid rgba(255,255,255,0.04)', 
                      borderRadius: '8px', 
                      lineHeight: '1.5' 
                    }}>
                      {selectedOpportunity.projectRequirements}
                    </div>
                  </div>
                )}
                <div style={{ gridColumn: 'span 2' }}>
                  <span style={{ color: 'var(--text-secondary)' }}>Needed Mediums: </span>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.35rem', marginTop: '0.35rem' }}>
                    {(selectedOpportunity.mediums || []).map(m => (
                      <span key={m} style={{ fontSize: '0.75rem', padding: '0.15rem 0.4rem', background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: '4px', color: '#fff' }}>{m}</span>
                    ))}
                  </div>
                </div>
                {selectedOpportunity.styles && selectedOpportunity.styles.length > 0 && (
                  <div style={{ gridColumn: 'span 2' }}>
                    <span style={{ color: 'var(--text-secondary)' }}>Requested Styles: </span>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.35rem', marginTop: '0.35rem' }}>
                      {selectedOpportunity.styles.map(s => (
                        <span key={s} style={{ fontSize: '0.75rem', padding: '0.15rem 0.4rem', background: 'rgba(139,92,246,0.08)', border: '1px solid rgba(139,92,246,0.2)', borderRadius: '4px', color: '#a78bfa' }}>{s}</span>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Attached Briefs */}
            {selectedOpportunity.attachedBriefs && selectedOpportunity.attachedBriefs.length > 0 && (
              <div>
                <h4 style={{ margin: 0, fontFamily: 'Space Grotesk', fontSize: '1rem', color: '#fff', marginBottom: '0.75rem' }}>Attached Documents &amp; Briefs</h4>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                  {selectedOpportunity.attachedBriefs.map((file, idx) => (
                    <div key={idx} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.5rem 1rem', background: 'rgba(255,255,255,0.02)', border: '1px solid var(--border-subtle)', borderRadius: '8px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', overflow: 'hidden' }}>
                        <span className="material-symbols-outlined" style={{ fontSize: '1.2rem', color: 'var(--accent-electric)' }}>description</span>
                        <span style={{ fontSize: '0.85rem', color: '#fff', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{file.name}</span>
                      </div>
                      <a 
                        href={file.base64Data} 
                        download={file.name}
                        style={{ fontSize: '0.8rem', color: 'var(--accent-electric)', textDecoration: 'underline', display: 'flex', alignItems: 'center', gap: '0.2rem' }}
                      >
                        <span className="material-symbols-outlined" style={{ fontSize: '0.95rem' }}>download</span> Download
                      </a>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Vetted Candidate Matches Drawer */}
            <div style={{ borderTop: '1px solid var(--border-subtle)', paddingTop: '1.5rem', marginTop: '0.5rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem', flexWrap: 'wrap', gap: '0.75rem' }}>
                <h4 style={{ margin: 0, fontFamily: 'Space Grotesk', fontSize: '1.1rem', color: '#fff', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                  <span className="material-symbols-outlined" style={{ color: 'var(--accent-electric)' }}>workspace_premium</span>
                  Ranked Talent Registry Matches
                </h4>
                
                <div style={{ display: 'flex', gap: '0.5rem' }}>
                  {onLocateOnMap && (
                    <button
                      type="button"
                      onClick={() => onLocateOnMap(selectedOpportunity.id)}
                      style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '0.4rem',
                        padding: '0.5rem 1.25rem',
                        background: 'rgba(224, 90, 71, 0.08)',
                        border: '1px solid rgba(224, 90, 71, 0.25)',
                        borderRadius: '8px',
                        color: 'var(--accent-terracotta)',
                        fontSize: '0.8rem',
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
                      <span className="material-symbols-outlined" style={{ fontSize: '1.1rem' }}>explore</span>
                      Locate on Map
                    </button>
                  )}
                  {/* Delete Opportunity Action */}
                  {onDelete && (
                    <button
                      type="button"
                      disabled={isSyncing}
                      onClick={() => {
                        onDelete(selectedOpportunity.id);
                        setSelectedOpportunity(null); // close drawer
                      }}
                      style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '0.4rem',
                        padding: '0.5rem 1.25rem',
                        background: 'rgba(230, 92, 70, 0.1)',
                        border: '1px solid rgba(230, 92, 70, 0.25)',
                        borderRadius: '8px',
                        color: 'var(--accent-terracotta)',
                        fontSize: '0.8rem',
                        fontWeight: 700,
                        cursor: 'pointer',
                        transition: 'all 0.2s ease',
                        fontFamily: 'inherit'
                      }}
                      onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(230, 92, 70, 0.18)'}
                      onMouseLeave={(e) => e.currentTarget.style.background = 'rgba(230, 92, 70, 0.1)'}
                    >
                      <span className="material-symbols-outlined" style={{ fontSize: '1rem' }}>delete</span>
                      Remove Need
                    </button>
                  )}

                  {/* Re-broadcast Action Trigger */}
                  <button
                    type="button"
                    disabled={isSyncing}
                    onClick={() => onBroadcast && onBroadcast(selectedOpportunity)}
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '0.4rem',
                      padding: '0.5rem 1.25rem',
                      background: 'rgba(74, 131, 237, 0.1)',
                      border: '1px solid rgba(74, 131, 237, 0.25)',
                      borderRadius: '8px',
                      color: 'var(--accent-electric)',
                      fontSize: '0.8rem',
                      fontWeight: 700,
                      cursor: 'pointer',
                      transition: 'all 0.2s ease',
                      fontFamily: 'inherit'
                    }}
                    onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(74, 131, 237, 0.18)'}
                    onMouseLeave={(e) => e.currentTarget.style.background = 'rgba(74, 131, 237, 0.1)'}
                  >
                    <span className="material-symbols-outlined" style={{ fontSize: '1rem' }}>campaign</span>
                    {isSyncing ? 'Syncing...' : 'Broadcast Alert'}
                  </button>
                </div>
              </div>

              {/* Matching query */}
              {(() => {
                const matches = findMatchingArtistsForRFQ({
                  mediums: selectedOpportunity.mediums,
                  styles: selectedOpportunity.styles,
                  capabilities: selectedOpportunity.capabilities,
                  scale: selectedOpportunity.scale
                });

                if (matches.length === 0) {
                  return (
                    <div style={{ textAlign: 'center', padding: '2rem 1rem', background: 'rgba(255,255,255,0.01)', border: '1px dashed rgba(255,255,255,0.08)', borderRadius: '12px', color: 'var(--text-secondary)', fontSize: '0.85rem' }}>
                      No direct registry matches found. Try relaxing required style or capability filters.
                    </div>
                  );
                }

                return (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                    <div style={{ fontSize: '0.78rem', color: 'rgba(255,255,255,0.35)', fontStyle: 'italic', marginBottom: '0.25rem' }}>
                      {matches.length} artist{matches.length !== 1 ? 's' : ''} matched — all contacts are available during the beta period.
                    </div>
                    {matches.map((artist, idx) => (
                      <ArtistContactCard key={artist.id} artist={artist} idx={idx} opportunity={selectedOpportunity} />
                    ))}
                  </div>
                );
              })()}
            </div>

          </div>
        </div>
      )}

      {/* Slide left drawer animations style */}
      <style>{`
        @keyframes slideLeft {
          from { transform: translateX(100%); }
          to { transform: translateX(0); }
        }
      `}</style>
    </div>
  );
}
