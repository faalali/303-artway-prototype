import { useState, useMemo, useEffect } from 'react';
import {
  getClients,
  findClientByCredentials,
  getArtists,
  findArtistByCredentials,
  fetchArtistsFromGoogleSheet,
  getFundingSources,
  updateClientFields,
  saveClient,
  findMatchingArtistsForRFQ
} from '../data/mockDatabase';
import CommissionerRFQForm from './CommissionerRFQForm';
import ArtistAccountPortal from './ArtistAccountPortal';
import { logClientEvent } from '../enterprise/auditLogger';

const SESSION_KEY = 'ila_client_session_v1';

/** Individual artist contact card shown inside the client dashboard */
function ClientArtistContactCard({ artist, idx, post }) {
  const [expanded, setExpanded] = useState(false);
  const name = artist.alias || `${artist.firstName} ${artist.lastName}`;
  const isVetted = artist.vettingStatus === 'Vetted';

  const introSubject = encodeURIComponent(`Opportunity Introduction: ${post?.title || 'Art Commission'}`);
  const introBody = encodeURIComponent(
    `Hi ${artist.firstName || name},\n\nWe came across your profile in the ILA Gallery Creative Registry and think you may be a great fit for an upcoming project.\n\n` +
    `Project: ${post?.title || 'N/A'}\nBudget: ${post?.amount || 'N/A'}\nDeadline: ${post?.closeDate || 'N/A'}\n\n` +
    `We'd love to connect. Please let us know if you're interested!\n\nWarm regards,\nILA Gallery Network`
  );

  return (
    <div style={{
      border: `1px solid ${isVetted ? 'rgba(78,200,140,0.2)' : 'rgba(255,255,255,0.07)'}`,
      borderRadius: '10px', overflow: 'hidden',
      background: 'rgba(255,255,255,0.015)',
      transition: 'border-color 0.2s ease',
    }}>
      {/* Header row */}
      <div
        onClick={() => setExpanded(p => !p)}
        style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0.8rem 1rem', cursor: 'pointer', gap: '0.75rem' }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem', flex: 1, minWidth: 0 }}>
          <div style={{
            width: '26px', height: '26px', borderRadius: '50%', flexShrink: 0,
            background: 'rgba(74,131,237,0.12)', border: '1px solid rgba(74,131,237,0.25)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: '0.68rem', fontWeight: 700, color: 'var(--accent-electric)'
          }}>{idx + 1}</div>
          <div style={{ minWidth: 0 }}>
            <div style={{ fontWeight: 600, fontSize: '0.85rem', color: '#fff', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{name}</div>
            <div style={{ fontSize: '0.72rem', color: 'var(--text-secondary)' }}>
              {artist.primaryMedium} • {artist.city}, {artist.state}
            </div>
          </div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', flexShrink: 0 }}>
          {artist.availabilityStatus && (
            <span style={{
              fontSize: '0.62rem', padding: '0.12rem 0.38rem',
              background: artist.availabilityStatus === 'Available' ? 'rgba(78,200,140,0.1)' : 'rgba(255,171,64,0.1)',
              border: `1px solid ${artist.availabilityStatus === 'Available' ? 'rgba(78,200,140,0.25)' : 'rgba(255,171,64,0.25)'}`,
              color: artist.availabilityStatus === 'Available' ? '#4ec88c' : '#ffab40',
              borderRadius: '4px', fontWeight: 700
            }}>{artist.availabilityStatus}</span>
          )}
          <span style={{
            fontSize: '0.62rem', padding: '0.12rem 0.38rem',
            background: isVetted ? 'rgba(78,200,140,0.12)' : 'rgba(230,92,70,0.12)',
            border: `1px solid ${isVetted ? 'rgba(78,200,140,0.3)' : 'rgba(230,92,70,0.3)'}`,
            color: isVetted ? '#4ec88c' : 'var(--accent-terracotta)',
            borderRadius: '4px', fontWeight: 700
          }}>{isVetted ? '✓ Vetted' : artist.vettingStatus}</span>
          <span className="material-symbols-outlined" style={{
            fontSize: '1rem', color: 'rgba(255,255,255,0.3)',
            transform: expanded ? 'rotate(180deg)' : 'rotate(0deg)',
            transition: 'transform 0.25s ease'
          }}>expand_more</span>
        </div>
      </div>

      {/* Expanded details */}
      {expanded && (
        <div style={{ borderTop: '1px solid rgba(255,255,255,0.06)', padding: '1rem', display: 'flex', flexDirection: 'column', gap: '0.85rem', animation: 'fadeIn 0.2s ease' }}>
          {artist.capabilitiesDescription && (
            <p style={{ margin: 0, fontSize: '0.8rem', color: 'var(--text-secondary)', lineHeight: '1.5', fontStyle: 'italic' }}>
              "{artist.capabilitiesDescription}"
            </p>
          )}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.55rem', fontSize: '0.8rem' }}>
            {artist.email && (
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', overflow: 'hidden' }}>
                <span className="material-symbols-outlined" style={{ fontSize: '0.9rem', color: 'var(--accent-electric)', flexShrink: 0 }}>mail</span>
                <a href={`mailto:${artist.email}?subject=${introSubject}&body=${introBody}`} style={{ color: 'var(--accent-electric)', textDecoration: 'underline', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }} onClick={e => e.stopPropagation()}>{artist.email}</a>
              </div>
            )}
            {artist.phone && (
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                <span className="material-symbols-outlined" style={{ fontSize: '0.9rem', color: '#4ec88c', flexShrink: 0 }}>call</span>
                <a href={`tel:${artist.phone}`} style={{ color: '#4ec88c', textDecoration: 'none' }} onClick={e => e.stopPropagation()}>{artist.phone}</a>
              </div>
            )}
            {artist.website && (
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', overflow: 'hidden' }}>
                <span className="material-symbols-outlined" style={{ fontSize: '0.9rem', color: 'var(--accent-ochre)', flexShrink: 0 }}>language</span>
                <a href={artist.website.startsWith('http') ? artist.website : `https://${artist.website}`} target="_blank" rel="noopener noreferrer" style={{ color: 'var(--accent-ochre)', textDecoration: 'underline', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }} onClick={e => e.stopPropagation()}>{artist.website.replace(/^https?:\/\//, '')}</a>
              </div>
            )}
            {artist.instagram && (
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                <span className="material-symbols-outlined" style={{ fontSize: '0.9rem', color: '#c084fc', flexShrink: 0 }}>photo_camera</span>
                <a href={`https://instagram.com/${artist.instagram.replace('@', '')}`} target="_blank" rel="noopener noreferrer" style={{ color: '#c084fc', textDecoration: 'underline' }} onClick={e => e.stopPropagation()}>{artist.instagram}</a>
              </div>
            )}
            {artist.budgetRange && (
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                <span className="material-symbols-outlined" style={{ fontSize: '0.9rem', color: 'var(--accent-ochre)', flexShrink: 0 }}>payments</span>
                <span style={{ color: 'var(--text-primary)' }}>{artist.budgetRange}</span>
              </div>
            )}
          </div>
          {artist.email && (
            <a
              href={`mailto:${artist.email}?subject=${introSubject}&body=${introBody}`}
              onClick={e => e.stopPropagation()}
              style={{
                display: 'inline-flex', alignItems: 'center', gap: '0.4rem',
                padding: '0.5rem 1rem',
                background: 'rgba(74,131,237,0.12)', border: '1px solid rgba(74,131,237,0.3)',
                borderRadius: '7px', color: 'var(--accent-electric)',
                fontSize: '0.8rem', fontWeight: 700, textDecoration: 'none', alignSelf: 'flex-start',
                transition: 'all 0.2s ease',
              }}
              onMouseEnter={e => { e.currentTarget.style.background = 'rgba(74,131,237,0.22)'; }}
              onMouseLeave={e => { e.currentTarget.style.background = 'rgba(74,131,237,0.12)'; }}
            >
              <span className="material-symbols-outlined" style={{ fontSize: '0.95rem' }}>forward_to_inbox</span>
              Send Intro Email
            </a>
          )}
        </div>
      )}
    </div>
  );
}

/** Expandable matched artists section for each posting in the client dashboard */
function MatchedArtistsSection({ post }) {
  const [open, setOpen] = useState(false);
  const rfqQuery = {
    mediums: post.mediums || [],
    styles: post.styles || [],
    capabilities: post.capabilities || [],
    scale: post.scale || ''
  };
  const matches = findMatchingArtistsForRFQ(rfqQuery);

  return (
    <div style={{ marginTop: '0.5rem' }}>
      <button
        type="button"
        onClick={() => setOpen(p => !p)}
        style={{
          width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          padding: '0.65rem 0.85rem',
          background: open ? 'rgba(74,131,237,0.12)' : 'rgba(74,131,237,0.06)',
          border: `1px solid ${open ? 'rgba(74,131,237,0.3)' : 'rgba(74,131,237,0.15)'}`,
          borderRadius: '8px', cursor: 'pointer', transition: 'all 0.2s ease',
          fontFamily: 'inherit',
        }}
      >
        <span style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.85rem', color: 'var(--accent-electric)', fontWeight: 700 }}>
          <span className="material-symbols-outlined" style={{ fontSize: '1.1rem' }}>electric_bolt</span>
          {matches.length} Matched Artist{matches.length !== 1 ? 's' : ''} — View &amp; Contact
        </span>
        <span className="material-symbols-outlined" style={{ fontSize: '1.1rem', color: 'rgba(255,255,255,0.4)', transform: open ? 'rotate(180deg)' : 'rotate(0deg)', transition: 'transform 0.25s ease' }}>expand_more</span>
      </button>

      {open && (
        <div style={{ marginTop: '0.75rem', display: 'flex', flexDirection: 'column', gap: '0.65rem', animation: 'fadeIn 0.2s ease' }}>
          {matches.length === 0 ? (
            <div style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', padding: '0.75rem', background: 'rgba(255,255,255,0.01)', border: '1px dashed rgba(255,255,255,0.06)', borderRadius: '8px', textAlign: 'center' }}>
              No direct registry matches. Try relaxing medium or style requirements.
            </div>
          ) : (
            <>
              <div style={{ fontSize: '0.75rem', color: 'rgba(255,255,255,0.3)', fontStyle: 'italic' }}>
                All contacts visible during beta — click any card to expand.
              </div>
              {matches.map((artist, idx) => (
                <ClientArtistContactCard key={artist.id} artist={artist} idx={idx} post={post} />
              ))}
            </>
          )}
        </div>
      )}
    </div>
  );
}


export default function ClientAccountPortal({ hideSwitcher = false }) {
  const [activePortalTab, setActivePortalTab] = useState(() => {
    const hasArtistSession = !!localStorage.getItem('ila_artist_session_v1');
    const hasClientSession = !!localStorage.getItem('ila_client_session_v1');
    if (!hasClientSession && hasArtistSession) {
      return 'artist';
    }
    return 'client';
  });

  const [mode, setMode] = useState('signin');
  const [login, setLogin] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  
  const [client, setClient] = useState(() => {
    try {
      const session = JSON.parse(localStorage.getItem(SESSION_KEY));
      if (session?.email && session?.id) {
        const list = getClients();
        return list.find(c => c.id === session.id) || null;
      }
    } catch {
      return null;
    }
    return null;
  });

  const [activeTab, setActiveTab] = useState('overview');
  const [status, setStatus] = useState('');
  const [draft, setDraft] = useState(() => client ? { ...client } : {});
  const [fundingSources, setFundingSources] = useState(() => getFundingSources());

  // Reload funding sources whenever the active tab changes to ensure "My Postings" stays up to date
  useEffect(() => {
    if (client) {
      setFundingSources(getFundingSources());
    }
  }, [activeTab, client]);

  // Sync draft if client changes (e.g. login/out)
  useEffect(() => {
    if (client) {
      setDraft({ ...client });
    } else {
      setDraft({});
    }
  }, [client]);

  // Filter funding sources submitted by this client
  const myPostings = useMemo(() => {
    if (!client) return [];
    return fundingSources.filter(f => 
      f.isCommunityPost && 
      (f.clientId === client.id || 
       (f.contactEmail && f.contactEmail.toLowerCase() === client.email.toLowerCase()))
    );
  }, [fundingSources, client]);

  if (activePortalTab === 'artist') {
    return (
      <ArtistAccountPortal
        hideSwitcher={true}
        onCreateProfile={() => { window.location.href = '/?role=artist'; }}
        onOpenGrantAssistant={(source) => {
          try { sessionStorage.setItem('ila_grant_preload', JSON.stringify(source)); } catch {}
          window.open(`${window.location.origin}/?admin#grant-assistant`, '_blank');
        }}
      />
    );
  }

  const handleSignIn = (event) => {
    event.preventDefault();
    setError('');

    const artistProfile = findArtistByCredentials(login, password);
    const clientProfile = findClientByCredentials(login, password);

    if (!artistProfile && !clientProfile) {
      logClientEvent("USER_SIGNIN_FAILED", {
        loginAttempted: login
      });
      setError('No profile matches those credentials.');
      return;
    }

    if (artistProfile) {
      logClientEvent("USER_SIGNIN_SUCCESS", {
        role: "artist",
        email: artistProfile.email,
        artistId: artistProfile.id
      });
      localStorage.setItem('ila_artist_session_v1', JSON.stringify({ email: artistProfile.email, id: artistProfile.id }));
    }
    if (clientProfile) {
      logClientEvent("USER_SIGNIN_SUCCESS", {
        role: "client",
        email: clientProfile.email,
        clientId: clientProfile.id
      });
      localStorage.setItem('ila_client_session_v1', JSON.stringify({ email: clientProfile.email, id: clientProfile.id }));
    }

    const session = {
      artistId: artistProfile?.id || null,
      clientId: clientProfile?.id || null,
      name: artistProfile?.alias || artistProfile?.firstName || clientProfile?.clientName || 'User',
      hasArtist: !!artistProfile,
      hasClient: !!clientProfile,
    };
    localStorage.setItem('ila_unified_session_v1', JSON.stringify(session));

    if (clientProfile) {
      setClient(clientProfile);
      setDraft({ ...clientProfile });
      setActiveTab('overview');
      setActivePortalTab('client');
    } else if (artistProfile) {
      setActivePortalTab('artist');
    }
  };

  const handleSignOut = () => {
    localStorage.removeItem(SESSION_KEY);
    localStorage.removeItem('ila_artist_session_v1');
    localStorage.removeItem('ila_unified_session_v1');
    setClient(null);
    setDraft({});
    setLogin('');
    setPassword('');
    setMode('signin');
    setActivePortalTab('client');
  };

  const handleSaveProfile = (event) => {
    event.preventDefault();
    if (!client) return;

    if (!draft.clientName || !draft.contactName || !draft.email) {
      setStatus('Please fill in all required contact details.');
      return;
    }

    const payload = {
      clientName: draft.clientName,
      contactName: draft.contactName,
      email: draft.email,
      phone: draft.phone || '',
      website: draft.website || '',
      bio: draft.bio || '',
      profilePicture: draft.profilePicture || '',
      username: draft.username || '',
      password: draft.password || ''
    };

    const result = updateClientFields(client.id, payload);
    if (!result.success) {
      setStatus(result.error || 'Profile could not be saved.');
      return;
    }
    setClient(result.client);
    setDraft({ ...result.client });
    localStorage.setItem(SESSION_KEY, JSON.stringify({ email: result.client.email, id: result.client.id }));
    setStatus('Profile successfully updated.');
    setTimeout(() => setStatus(''), 3500);
  };

  const handleRegisterFromCard = () => {
    // Navigate straight to posting a new project (which registers guest profiles)
    setMode('register');
  };

  if (mode === 'register') {
    return (
      <div style={{ minHeight: '100vh', background: 'var(--bg-dark)', display: 'flex', flexDirection: 'column' }}>
        <div style={{ padding: '1rem clamp(1rem, 3vw, 2rem)' }}>
          <button
            type="button"
            onClick={() => setMode('signin')}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.35rem',
              background: 'rgba(255,255,255,0.05)',
              border: '1px solid rgba(255,255,255,0.1)',
              borderRadius: '8px',
              padding: '0.5rem 1rem',
              color: 'var(--text-primary)',
              fontSize: '0.82rem',
              cursor: 'pointer',
              fontFamily: "'Space Grotesk', sans-serif",
              marginBottom: '1rem'
            }}
          >
            <span className="material-symbols-outlined" style={{ fontSize: '0.95rem' }}>arrow_back</span>
            Back to Client Portal Landing
          </button>
        </div>
        <CommissionerRFQForm initialClient={null} />
      </div>
    );
  }

  if (!client) {
    return (
      <div className="client-account-shell">
        <header className="client-account-header">
          <p className="client-account-eyebrow">Client account portal</p>
          <h1>Commission Colorado’s best. Organize your projects in one place.</h1>
          <p className="client-account-desc">
            Submit a creative opportunity, build a profile for organization logos and bios, and access your client dashboard to trace matching artists.
          </p>
        </header>

        <section className="client-portal-grid">
          {/* Card 1: Submit & Register */}
          <article className="client-portal-card post-card">
            <div className="card-icon-wrapper">
              <span className="material-symbols-outlined">campaign</span>
            </div>
            <h2>Post a New Opportunity</h2>
            <p>
              Fill out the Art in Need RFQ form to publish your creative project. You will set up your credentials during submission to manage your postings.
            </p>
            <button className="client-account-primary post-button" type="button" onClick={handleRegisterFromCard}>
              Start profile registration
              <span className="material-symbols-outlined">arrow_forward</span>
            </button>
          </article>

          {/* Card 2: Sign In */}
          <article className="client-portal-card login-card">
            <div className="card-icon-wrapper">
              <span className="material-symbols-outlined">lock_open</span>
            </div>
            <h2>Access Client Dashboard</h2>
            <p>
              Log in to your client account with your username/email and password to update details and review your submitted projects.
            </p>
            
            <form className="client-account-form" onSubmit={handleSignIn} style={{ width: '100%', marginTop: 'auto' }}>
              <label style={{ display: 'grid', gap: '0.4rem', width: '100%', marginBottom: '0.75rem' }}>
                Username or Email Address
                <input 
                  value={login} 
                  onChange={(event) => setLogin(event.target.value)} 
                  type="text" 
                  placeholder="e.g. denverarts or director@ila-gallery.com" 
                  required 
                  style={{ width: '100%', minHeight: '44px', background: 'rgba(0,0,0,0.36)', border: '1px solid rgba(255,255,255,0.14)', borderRadius: '8px', padding: '0 0.85rem', color: '#fff' }}
                />
              </label>
              <label style={{ display: 'grid', gap: '0.4rem', width: '100%', marginBottom: '0.75rem' }}>
                Password
                <input 
                  value={password} 
                  onChange={(event) => setPassword(event.target.value)} 
                  type="password" 
                  placeholder="••••••••" 
                  required 
                  style={{ width: '100%', minHeight: '44px', background: 'rgba(0,0,0,0.36)', border: '1px solid rgba(255,255,255,0.14)', borderRadius: '8px', padding: '0 0.85rem', color: '#fff' }}
                />
              </label>
              {error && <p className="client-account-message error" style={{ margin: '0.5rem 0', color: '#ff6b7a', fontSize: '0.85rem' }}>{error}</p>}
              <button className="client-account-primary login-button" type="submit" style={{ width: '100%', marginTop: '0.5rem' }}>
                <span className="material-symbols-outlined">dashboard</span>
                Sign in to dashboard
              </button>
            </form>
          </article>
        </section>

        <section className="client-account-benefits">
          {[
            ['account_circle', 'Client credentials', 'Log back in securely to edit organization bios and logo avatars.'],
            ['quick_reference_all', 'Frictionless RFQs', 'Logged-in sessions freeze contact inputs, enabling 1-click repeat postings.'],
            ['group', 'Direct matching', 'Instantly alert Colorado registry artists matching your styles and mediums.'],
          ].map(([icon, title, body]) => (
            <article key={title}>
              <span className="material-symbols-outlined">{icon}</span>
              <h2>{title}</h2>
              <p>{body}</p>
            </article>
          ))}
        </section>
        <ClientAccountStyles />
      </div>
    );
  }

  const hasArtistSession = !!localStorage.getItem('ila_artist_session_v1');
  const hasClientSession = !!localStorage.getItem('ila_client_session_v1');
  const showSwitcher = !hideSwitcher && hasArtistSession && hasClientSession;

  return (
    <div className="client-account-shell">
      {showSwitcher && (
        <div style={{ display: 'flex', background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '14px', padding: '4px', gap: '2px', width: 'fit-content', marginBottom: '1.5rem' }}>
          <button type="button" onClick={() => setActivePortalTab('artist')} style={{ padding: '0.55rem 1.1rem', borderRadius: '10px', border: 'none', background: activePortalTab === 'artist' ? 'var(--accent-terracotta)' : 'transparent', color: '#fff', fontWeight: 700, fontSize: '0.82rem', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.4rem', transition: 'all 0.3s', fontFamily: "'Space Grotesk', sans-serif", boxShadow: activePortalTab === 'artist' ? '0 4px 12px rgba(224,90,71,0.3)' : 'none' }}>
            <span className="material-symbols-outlined" style={{ fontSize: '0.95rem' }}>palette</span>
            Artist Dashboard
          </button>
          <button type="button" onClick={() => setActivePortalTab('client')} style={{ padding: '0.55rem 1.1rem', borderRadius: '10px', border: 'none', background: activePortalTab === 'client' ? 'var(--accent-electric)' : 'transparent', color: '#fff', fontWeight: 700, fontSize: '0.82rem', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.4rem', transition: 'all 0.3s', fontFamily: "'Space Grotesk', sans-serif", boxShadow: activePortalTab === 'client' ? '0 4px 12px rgba(74,131,237,0.3)' : 'none' }}>
            <span className="material-symbols-outlined" style={{ fontSize: '0.95rem' }}>campaign</span>
            Commissioner Dashboard
          </button>
        </div>
      )}
      <header className="client-dashboard-header">
        <div style={{ display: 'flex', gap: '1.25rem', alignItems: 'center' }}>
          {client.profilePicture ? (
            <img src={client.profilePicture} alt="Avatar" style={{ width: '64px', height: '64px', borderRadius: '50%', objectFit: 'cover', border: '2px solid var(--accent-electric)', flexShrink: 0 }} />
          ) : (
            <div style={{ width: '64px', height: '64px', borderRadius: '50%', background: 'rgba(255,255,255,0.05)', display: 'flex', alignItems: 'center', justifyContent: 'center', border: '1px solid rgba(255,255,255,0.1)', flexShrink: 0 }}>
              <span className="material-symbols-outlined" style={{ fontSize: '2rem', color: 'rgba(255,255,255,0.3)' }}>domain</span>
            </div>
          )}
          <div>
            <p className="client-account-eyebrow">Client dashboard</p>
            <h1>{client.clientName}</h1>
            <p>Contact: {client.contactName} · {client.email}</p>
          </div>
        </div>
        <div className="client-dashboard-actions">
          <span>{client.id}</span>
          <button type="button" onClick={handleSignOut}>Sign out</button>
        </div>
      </header>

      <nav className="client-dashboard-tabs" aria-label="Client dashboard tabs">
        {[
          ['overview', 'My Postings', 'list_alt'],
          ['post', 'Post New Project', 'add_circle'],
          ['profile', 'Edit profile', 'edit'],
        ].map(([key, label, icon]) => (
          <button className={activeTab === key ? 'active' : ''} type="button" key={key} onClick={() => setActiveTab(key)}>
            <span className="material-symbols-outlined">{icon}</span>
            {label}
          </button>
        ))}
      </nav>

      {activeTab === 'overview' && (
        <section className="client-account-card">
          <div className="client-editor-heading" style={{ marginBottom: '1.5rem' }}>
            <div>
              <h2>Your Creative Opportunities</h2>
              <p>Review projects and RFQs logged under your account.</p>
            </div>
          </div>
          
          {myPostings.length === 0 ? (
            <div style={{
              textAlign: 'center',
              padding: '3rem 2rem',
              background: 'rgba(255,255,255,0.01)',
              border: '1px dashed rgba(255,255,255,0.1)',
              borderRadius: '16px',
              color: 'var(--text-secondary)'
            }}>
              <span className="material-symbols-outlined" style={{ fontSize: '3rem', color: 'rgba(255,255,255,0.15)', marginBottom: '1rem', display: 'block' }}>campaign</span>
              <p style={{ margin: 0, fontSize: '1.05rem', fontWeight: 500 }}>No opportunities posted yet</p>
              <p style={{ margin: '0.25rem 0 1.5rem 0', fontSize: '0.88rem' }}>Publish your first project need to query matched registry talent.</p>
              <button className="client-account-primary" onClick={() => setActiveTab('post')} style={{ margin: '0 auto', maxWidth: '220px' }}>
                Post New Opportunity
              </button>
            </div>
          ) : (
            <div className="client-match-grid">
              {myPostings.map(post => {
                const rfqQuery = {
                  mediums: post.mediums || [],
                  styles: post.styles || [],
                  capabilities: post.capabilities || [],
                  scale: post.scale || ''
                };
                const matchedCount = findMatchingArtistsForRFQ(rfqQuery).length;

                return (
                  <article className="client-match-card" key={post.id}>
                    <div className="client-match-topline">
                      <span className="client-match-status">{post.status || 'Open'}</span>
                      <span style={{ fontSize: '0.78rem', color: 'var(--text-secondary)' }}>ID: {post.id}</span>
                    </div>
                    <h3>{post.title}</h3>
                    <p>{post.description || 'No description provided.'}</p>
                    
                    <div className="client-match-meta">
                      <span>💰 {post.amount || 'Compensation varies'}</span>
                      <span>📍 {post.city}</span>
                    </div>

                    <div className="client-tag-row" style={{ marginBottom: '1rem' }}>
                      {post.mediums && post.mediums.map(m => (
                        <span key={m} className="client-tag">🎨 {m}</span>
                      ))}
                      {post.scale && (
                        <span className="client-tag">📐 {post.scale} scale</span>
                      )}
                    </div>

                    {/* Matched Artist Contact Cards */}
                    <MatchedArtistsSection post={post} />
                  </article>
                );
              })}
            </div>
          )}
        </section>
      )}

      {activeTab === 'post' && (
        <div style={{ animation: 'fadeIn 0.4s ease-out', marginTop: '1.5rem' }}>
          <CommissionerRFQForm initialClient={client} />
        </div>
      )}

      {activeTab === 'profile' && (
        <form className="client-profile-editor" onSubmit={handleSaveProfile}>
          <div className="client-editor-heading">
            <div>
              <h2>Edit Client CRM Details</h2>
              <p>Modify contact info, company details, logo, and credentials.</p>
            </div>
            <button className="client-account-primary" type="submit">Save updates</button>
          </div>
          {status && <p className="client-account-message status-banner">{status}</p>}

          {/* Avatar and Bio Section */}
          <div style={{
            background: 'rgba(255, 255, 255, 0.02)',
            border: '1px solid rgba(255, 255, 255, 0.06)',
            borderRadius: '12px',
            padding: '1.5rem',
            marginBottom: '2rem',
            display: 'flex',
            flexDirection: 'column',
            gap: '1.5rem'
          }}>
            <h3 style={{ margin: 0, fontFamily: "'Space Grotesk', sans-serif", fontSize: '1.1rem', color: '#fff', borderBottom: '1px solid rgba(255,255,255,0.08)', paddingBottom: '0.5rem' }}>
              Profile Presentation
            </h3>
            
            <div style={{ display: 'flex', gap: '1.5rem', alignItems: 'center', flexWrap: 'wrap' }}>
              {draft.profilePicture ? (
                <div style={{ position: 'relative', flexShrink: 0 }}>
                  <img 
                    src={draft.profilePicture} 
                    alt="Logo Preview" 
                    style={{ width: '96px', height: '96px', borderRadius: '50%', objectFit: 'cover', border: '3px solid var(--accent-electric)', boxShadow: '0 4px 15px rgba(74, 131, 237, 0.15)' }} 
                  />
                  <button
                    type="button"
                    onClick={() => setDraft(prev => ({ ...prev, profilePicture: '' }))}
                    style={{
                      position: 'absolute',
                      top: '-4px',
                      right: '-4px',
                      background: 'var(--accent-electric)',
                      color: '#fff',
                      border: 'none',
                      borderRadius: '50%',
                      width: '24px',
                      height: '24px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      cursor: 'pointer',
                      boxShadow: '0 2px 5px rgba(0,0,0,0.3)',
                      padding: 0
                    }}
                    title="Remove picture"
                  >
                    <span className="material-symbols-outlined" style={{ fontSize: '0.9rem' }}>close</span>
                  </button>
                </div>
              ) : (
                <div 
                  style={{ 
                    width: '96px', 
                    height: '96px', 
                    borderRadius: '50%', 
                    background: 'rgba(255, 255, 255, 0.03)', 
                    border: '1px dashed rgba(255,255,255,0.2)', 
                    display: 'flex', 
                    alignItems: 'center', 
                    justifyContent: 'center',
                    flexShrink: 0
                  }}
                >
                  <span className="material-symbols-outlined" style={{ fontSize: '2.2rem', color: 'rgba(255,255,255,0.2)' }}>domain</span>
                </div>
              )}
              
              <div style={{ flex: '1 1 200px' }}>
                <input
                  type="file"
                  id="clientLogoEditInput"
                  accept="image/jpeg,image/png"
                  style={{ display: 'none' }}
                  onChange={(e) => {
                    if (e.target.files && e.target.files[0]) {
                      const file = e.target.files[0];
                      if (file.size > 800 * 1024) {
                        alert("Image is too large. Please select an image smaller than 800 KB.");
                        return;
                      }
                      const reader = new FileReader();
                      reader.readAsDataURL(file);
                      reader.onload = () => {
                        setDraft(prev => ({ ...prev, profilePicture: reader.result }));
                      };
                    }
                  }}
                />
                <button
                  type="button"
                  onClick={() => document.getElementById('clientLogoEditInput').click()}
                  style={{
                    background: 'rgba(255, 255, 255, 0.05)',
                    border: '1px solid rgba(255, 255, 255, 0.1)',
                    padding: '0.55rem 1rem',
                    borderRadius: '8px',
                    color: '#fff',
                    fontSize: '0.85rem',
                    fontWeight: 600,
                    cursor: 'pointer',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '0.4rem',
                    minHeight: 'auto'
                  }}
                >
                  <span className="material-symbols-outlined" style={{ fontSize: '1.1rem' }}>photo_camera</span>
                  Change Logo / Avatar
                </button>
                <p style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', margin: '6px 0 0 0' }}>
                  JPEG or PNG under 800 KB. Square aspect ratio recommended.
                </p>
              </div>
            </div>

            <label style={{ display: 'grid', gap: '0.4rem' }}>
              Bio / Organization Details
              <textarea
                value={draft.bio || ''}
                placeholder="Write a bio to introduce your organization..."
                onChange={(event) => setDraft({ ...draft, bio: event.target.value })}
                style={{ 
                  width: '100%', 
                  minHeight: '100px', 
                  background: 'rgba(0,0,0,0.25)', 
                  border: '1px solid rgba(255,255,255,0.12)', 
                  borderRadius: '8px', 
                  padding: '0.75rem', 
                  color: '#fff',
                  fontSize: '0.9rem',
                  fontFamily: 'inherit'
                }}
              />
            </label>
          </div>

          <div className="client-editor-grid">
            <label>
              Company / Client Name *
              <input
                type="text"
                required
                value={draft.clientName || ''}
                onChange={(event) => setDraft({ ...draft, clientName: event.target.value })}
              />
            </label>
            <label>
              Primary Contact Person *
              <input
                type="text"
                required
                value={draft.contactName || ''}
                onChange={(event) => setDraft({ ...draft, contactName: event.target.value })}
              />
            </label>
            <label>
              Contact Email Address *
              <input
                type="email"
                required
                value={draft.email || ''}
                onChange={(event) => setDraft({ ...draft, email: event.target.value })}
              />
            </label>
            <label>
              Contact Phone Number
              <input
                type="tel"
                value={draft.phone || ''}
                onChange={(event) => setDraft({ ...draft, phone: event.target.value })}
              />
            </label>
            <label style={{ gridColumn: 'span 2' }}>
              Website URL
              <input
                type="url"
                value={draft.website || ''}
                onChange={(event) => setDraft({ ...draft, website: event.target.value })}
              />
            </label>
          </div>

          {/* Credentials Settings Card */}
          <div style={{
            background: 'rgba(255, 255, 255, 0.02)',
            border: '1px solid rgba(255, 255, 255, 0.06)',
            borderRadius: '12px',
            padding: '1.5rem',
            marginTop: '2rem',
            display: 'flex',
            flexDirection: 'column',
            gap: '1.5rem'
          }}>
            <h3 style={{ margin: 0, fontFamily: "'Space Grotesk', sans-serif", fontSize: '1.1rem', color: '#fff', borderBottom: '1px solid rgba(255,255,255,0.08)', paddingBottom: '0.5rem' }}>
              Security & Credentials
            </h3>
            <p style={{ margin: 0, fontSize: '0.82rem', color: 'var(--text-secondary)' }}>
              Choose a username and password to log back into your matchmaking dashboard and update your profile.
            </p>
            
            <div className="client-editor-grid" style={{ marginTop: '0.5rem' }}>
              <label style={{ display: 'grid', gap: '0.4rem' }}>
                Username
                <input
                  type="text"
                  value={draft.username || ''}
                  placeholder="e.g. denverarts"
                  onChange={(event) => setDraft({ ...draft, username: event.target.value.toLowerCase().replace(/[^a-z0-9_.-]/g, '') })}
                />
              </label>
              <label style={{ display: 'grid', gap: '0.4rem' }}>
                Password
                <input
                  type="password"
                  value={draft.password || ''}
                  placeholder="Enter a secure password"
                  onChange={(event) => setDraft({ ...draft, password: event.target.value })}
                />
              </label>
            </div>
          </div>
        </form>
      )}

      <ClientAccountStyles />
    </div>
  );
}

function ClientAccountStyles() {
  return (
    <style>{`
      .client-account-shell {
        min-height: 100vh;
        background:
          radial-gradient(circle at top left, rgba(74, 131, 237, 0.14), transparent 30rem),
          radial-gradient(circle at top right, rgba(235, 176, 91, 0.08), transparent 28rem),
          var(--bg-dark);
        color: var(--text-primary);
        padding: clamp(1rem, 3vw, 2rem);
      }

      .client-account-header,
      .client-dashboard-header,
      .client-dashboard-tabs,
      .client-profile-editor,
      .client-account-card,
      .client-portal-grid,
      .client-account-benefits {
        width: min(1180px, 100%);
        margin-inline: auto;
      }

      .client-account-header {
        text-align: center;
        padding: clamp(2rem, 5vw, 4.5rem) 0 2rem;
      }

      .client-account-header h1 {
        font-family: 'Space Grotesk', sans-serif;
        font-size: clamp(2.2rem, 5.5vw, 3.8rem);
        letter-spacing: -0.01em;
        line-height: 1.05;
        margin: 0.5rem 0 1rem 0;
      }

      .client-account-desc {
        max-width: 780px;
        margin-inline: auto;
        font-size: 1.08rem;
        color: var(--text-secondary);
        line-height: 1.6;
      }

      .client-portal-grid {
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(360px, 1fr));
        gap: 1.75rem;
        margin-bottom: 3.5rem;
      }

      .client-portal-card {
        background: rgba(255, 255, 255, 0.03);
        border: 1px solid rgba(255, 255, 255, 0.08);
        border-radius: 16px;
        padding: 2.5rem 2rem;
        display: flex;
        flex-direction: column;
        align-items: flex-start;
        transition: transform 0.3s ease, border-color 0.3s ease, box-shadow 0.3s ease;
        backdrop-filter: blur(10px);
        position: relative;
        overflow: hidden;
        box-shadow: 0 20px 45px rgba(0,0,0,0.25);
      }

      .client-portal-card::before {
        content: '';
        position: absolute;
        top: 0;
        left: 0;
        right: 0;
        height: 4px;
        opacity: 0.85;
      }

      .client-portal-card.post-card::before {
        background: linear-gradient(90deg, var(--accent-electric), rgba(74,131,237,0.25));
      }

      .client-portal-card.login-card::before {
        background: linear-gradient(90deg, var(--accent-electric), rgba(74,131,237,0.25));
      }

      .client-portal-card:hover {
        transform: translateY(-4px);
        background: rgba(255, 255, 255, 0.045);
      }

      .client-portal-card.post-card:hover {
        border-color: rgba(74, 131, 237, 0.3);
        box-shadow: 0 20px 40px rgba(74, 131, 237, 0.08), 0 20px 45px rgba(0,0,0,0.3);
      }

      .client-portal-card.login-card:hover {
        border-color: rgba(74, 131, 237, 0.3);
        box-shadow: 0 20px 40px rgba(74, 131, 237, 0.08), 0 20px 45px rgba(0,0,0,0.3);
      }

      .card-icon-wrapper {
        width: 54px;
        height: 54px;
        border-radius: 12px;
        display: flex;
        align-items: center;
        justify-content: center;
        background: rgba(74, 131, 237, 0.1);
        border: 1px solid rgba(74, 131, 237, 0.15);
        color: var(--accent-electric);
        margin-bottom: 1.5rem;
      }

      .card-icon-wrapper span {
        font-size: 1.8rem;
      }

      .client-portal-card h2 {
        font-size: 1.4rem;
        font-weight: 700;
        margin: 0 0 0.75rem 0;
        color: var(--text-primary);
      }

      .client-portal-card p {
        font-size: 0.95rem;
        color: var(--text-secondary);
        line-height: 1.5;
        margin: 0 0 2rem 0;
      }

      .client-account-primary {
        background: var(--accent-electric);
        color: #fff;
        border: none;
        border-radius: 10px;
        padding: 0.85rem 1.5rem;
        font-size: 0.95rem;
        font-weight: 700;
        cursor: pointer;
        display: flex;
        align-items: center;
        justify-content: center;
        gap: 0.5rem;
        transition: all 0.3s ease;
        font-family: 'Space Grotesk', sans-serif;
        box-shadow: 0 4px 14px rgba(74, 131, 237, 0.3);
        min-height: 48px;
        width: 100%;
      }

      .client-account-primary:hover {
        background: #3a72df;
        transform: translateY(-1px);
        box-shadow: 0 6px 20px rgba(74, 131, 237, 0.4);
      }

      .client-account-primary span {
        font-size: 1.1rem;
        transition: transform 0.25s ease;
      }

      .client-account-primary:hover span {
        transform: translateX(3px);
      }

      .client-account-benefits {
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
        gap: 2rem;
        padding: 3rem 0;
        border-top: 1px solid rgba(255,255,255,0.06);
      }

      .client-account-benefits article {
        display: flex;
        flex-direction: column;
        align-items: flex-start;
      }

      .client-account-benefits span {
        color: var(--accent-electric);
        font-size: 2.2rem;
        margin-bottom: 0.75rem;
      }

      .client-account-benefits h2 {
        font-size: 1.15rem;
        font-weight: 700;
        margin: 0 0 0.5rem 0;
      }

      .client-account-benefits p {
        font-size: 0.9rem;
        color: var(--text-secondary);
        line-height: 1.5;
        margin: 0;
      }

      .client-dashboard-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        flex-wrap: wrap;
        gap: 1.5rem;
        padding: 2.5rem 0 1.5rem 0;
      }

      .client-dashboard-header h1 {
        font-size: 2rem;
        font-weight: 700;
        margin: 0 0 0.25rem 0;
      }

      .client-dashboard-header p {
        font-size: 0.95rem;
        color: var(--text-secondary);
        margin: 0;
      }

      .client-dashboard-actions {
        display: flex;
        align-items: center;
        gap: 1rem;
      }

      .client-dashboard-actions span {
        font-family: monospace;
        font-size: 0.85rem;
        background: rgba(255,255,255,0.04);
        padding: 0.35rem 0.65rem;
        border-radius: 6px;
        color: var(--text-secondary);
        border: 1px solid rgba(255,255,255,0.06);
      }

      .client-dashboard-actions button {
        background: rgba(255,255,255,0.05);
        color: var(--text-primary);
        border: 1px solid rgba(255,255,255,0.1);
        padding: 0.45rem 0.9rem;
        border-radius: 8px;
        font-size: 0.85rem;
        cursor: pointer;
        transition: all 0.2s;
        font-weight: 600;
      }

      .client-dashboard-actions button:hover {
        background: rgba(255,255,255,0.08);
        border-color: rgba(255,255,255,0.15);
      }

      .client-dashboard-tabs {
        display: flex;
        gap: 0.5rem;
        border-bottom: 1px solid rgba(255,255,255,0.06);
        margin-bottom: 2rem;
        overflow-x: auto;
        padding-bottom: 1px;
      }

      .client-dashboard-tabs button {
        background: none;
        border: none;
        color: var(--text-secondary);
        padding: 0.85rem 1.25rem;
        font-size: 0.95rem;
        cursor: pointer;
        display: flex;
        align-items: center;
        gap: 0.5rem;
        font-family: 'Space Grotesk', sans-serif;
        font-weight: 600;
        position: relative;
        transition: color 0.2s;
      }

      .client-dashboard-tabs button:hover {
        color: var(--text-primary);
      }

      .client-dashboard-tabs button.active {
        color: var(--accent-electric);
      }

      .client-dashboard-tabs button.active::after {
        content: '';
        position: absolute;
        bottom: 0;
        left: 0;
        right: 0;
        height: 2px;
        background: var(--accent-electric);
      }

      .client-dashboard-tabs button span {
        font-size: 1.15rem;
      }

      .client-account-card {
        background: rgba(255,255,255,0.02);
        border: 1px solid rgba(255,255,255,0.06);
        border-radius: 16px;
        padding: 2.2rem 2rem;
      }

      .client-editor-heading h2 {
        font-size: 1.4rem;
        font-weight: 700;
        margin: 0 0 0.35rem 0;
      }

      .client-editor-heading p {
        font-size: 0.9rem;
        color: var(--text-secondary);
        margin: 0;
      }

      .client-match-grid {
        display: grid;
        grid-template-columns: repeat(auto-fill, minmax(320px, 1fr));
        gap: 1.5rem;
        margin-top: 1.5rem;
      }

      .client-match-card {
        background: rgba(255,255,255,0.02);
        border: 1px solid rgba(255,255,255,0.06);
        border-radius: 12px;
        padding: 1.5rem;
        display: flex;
        flex-direction: column;
        transition: border-color 0.2s, background-color 0.2s;
      }

      .client-match-card:hover {
        background: rgba(255,255,255,0.03);
        border-color: rgba(255,255,255,0.1);
      }

      .client-match-topline {
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-bottom: 0.75rem;
      }

      .client-match-status {
        font-size: 0.75rem;
        font-weight: 700;
        text-transform: uppercase;
        letter-spacing: 0.5px;
        color: var(--accent-electric);
        background: rgba(74, 131, 237, 0.1);
        padding: 0.2rem 0.5rem;
        border-radius: 4px;
      }

      .client-match-card h3 {
        font-size: 1.15rem;
        font-weight: 700;
        margin: 0 0 0.5rem 0;
        line-height: 1.3;
      }

      .client-match-card p {
        font-size: 0.88rem;
        color: var(--text-secondary);
        line-height: 1.4;
        margin: 0 0 1.25rem 0;
        flex-grow: 1;
        display: -webkit-box;
        -webkit-line-clamp: 3;
        -webkit-box-orient: vertical;
        overflow: hidden;
      }

      .client-match-meta {
        display: flex;
        gap: 1rem;
        font-size: 0.8rem;
        color: var(--text-secondary);
        margin-bottom: 0.75rem;
        border-top: 1px solid rgba(255,255,255,0.04);
        padding-top: 0.75rem;
      }

      .client-tag-row {
        display: flex;
        flex-wrap: wrap;
        gap: 0.4rem;
      }

      .client-tag {
        font-size: 0.75rem;
        background: rgba(255,255,255,0.04);
        border: 1px solid rgba(255,255,255,0.06);
        padding: 0.15rem 0.45rem;
        border-radius: 6px;
        color: var(--text-primary);
      }

      .client-profile-editor {
        background: rgba(255, 255, 255, 0.02);
        border: 1px solid rgba(255, 255, 255, 0.06);
        border-radius: 16px;
        padding: 2.2rem 2rem;
      }

      .client-editor-heading {
        display: flex;
        justify-content: space-between;
        align-items: center;
        flex-wrap: wrap;
        gap: 1.5rem;
        margin-bottom: 2rem;
      }

      .client-editor-grid {
        display: grid;
        grid-template-columns: 1fr 1fr;
        gap: 1.25rem;
      }

      @media (max-width: 767px) {
        .client-editor-grid {
          grid-template-columns: 1fr;
        }
        .client-editor-grid > label[style*="grid-column: span 2"] {
          grid-column: span 1 !important;
        }
      }

      .client-profile-editor label {
        display: flex;
        flex-direction: column;
        gap: 0.4rem;
        font-size: 0.88rem;
        color: var(--text-secondary);
        font-weight: 500;
      }

      .client-profile-editor input {
        width: 100%;
        min-height: 44px;
        background: rgba(0,0,0,0.36);
        border: 1px solid rgba(255,255,255,0.14);
        border-radius: 8px;
        padding: 0 0.85rem;
        color: #fff;
        font-size: 0.95rem;
        font-family: inherit;
        outline: none;
        transition: border-color 0.2s;
      }

      .client-profile-editor input:focus {
        border-color: var(--accent-electric);
      }

      .client-account-message {
        font-size: 0.88rem;
        padding: 0.75rem 1rem;
        border-radius: 8px;
        margin: 1rem 0;
        font-weight: 600;
      }

      .client-account-message.status-banner {
        background: rgba(74, 131, 237, 0.1);
        border: 1px solid rgba(74, 131, 237, 0.2);
        color: #60a5fa;
        width: 100%;
      }

      .client-account-eyebrow {
        color: var(--accent-electric);
        letter-spacing: 2px;
        text-transform: uppercase;
        font-weight: 700;
        font-size: 0.82rem;
      }

      .client-account-shell p.client-account-eyebrow {
        font-family: 'Space Grotesk', sans-serif;
      }
    `}</style>
  );
}
