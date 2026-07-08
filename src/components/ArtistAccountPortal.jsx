import { useMemo, useState, useEffect } from 'react';
import {
  findArtistByEmailAndId,
  findArtistByCredentials,
  getFundingSources,
  getProjects,
  updateArtistFields,
  fetchArtistsFromGoogleSheet,
  findClientByCredentials,
  getClients,
} from '../data/mockDatabase';
import ProjectMap from './ProjectMap';
import GrantApplicationAssistant from './GrantApplicationAssistant';
import ClientAccountPortal from './ClientAccountPortal';
import { logClientEvent } from '../enterprise/auditLogger';

const SESSION_KEY = 'ila_artist_session_v1';
const SAVED_KEY_PREFIX = 'ila_artist_saved_v1';

const PROFILE_FIELDS = [
  { key: 'alias', label: 'Display / Artist Name', type: 'text', placeholder: 'Your public artist name' },
  { key: 'email', label: 'Email', type: 'email', placeholder: 'artist@example.com' },
  { key: 'phone', label: 'Phone', type: 'tel', placeholder: '303-555-0199' },
  { key: 'city', label: 'City', type: 'text', placeholder: 'Denver' },
  { key: 'state', label: 'State', type: 'text', placeholder: 'CO' },
  { key: 'website', label: 'Website', type: 'url', placeholder: 'https://your-site.com' },
  { key: 'portfolioUrl', label: 'Portfolio URL', type: 'url', placeholder: 'https://your-portfolio.com' },
  { key: 'instagram', label: 'Instagram', type: 'text', placeholder: '@artistname' },
  { key: 'linkedin', label: 'LinkedIn', type: 'url', placeholder: 'https://linkedin.com/in/name' },
  { key: 'primaryMedium', label: 'Primary Medium', type: 'text', placeholder: 'Mural, Film, DJ, Sculpture...' },
  { key: 'budgetRange', label: 'Preferred Budget Range', type: 'text', placeholder: '$5,000 - $25,000' },
];

const TEXTAREA_FIELDS = [
  { key: 'secondaryMediums', label: 'Secondary Mediums', hint: 'Comma-separated list' },
  { key: 'artStyles', label: 'Styles', hint: 'Comma-separated list' },
  { key: 'themes', label: 'Themes', hint: 'Comma-separated list' },
  { key: 'capabilitiesDescription', label: 'Capabilities / Production Notes', hint: 'What can you build, perform, produce, or install?' },
  { key: 'notableProjects', label: 'Notable Projects', hint: 'Past work, clients, shows, installations, or releases' },
  { key: 'communityAffiliations', label: 'Community Affiliations', hint: 'Districts, collectives, cultural orgs, neighborhoods' },
];

function asArray(value) {
  if (Array.isArray(value)) return value;
  if (!value) return [];
  return String(value).split(',').map(item => item.trim()).filter(Boolean);
}

function toCsv(value) {
  return Array.isArray(value) ? value.join(', ') : value || '';
}

function normalize(value) {
  return String(value || '').toLowerCase();
}

function buildArtistTerms(artist) {
  return [
    artist.primaryMedium,
    artist.city,
    artist.state,
    artist.experienceLevel,
    artist.capabilitiesDescription,
    artist.notableProjects,
    artist.communityAffiliations,
    ...asArray(artist.secondaryMediums),
    ...asArray(artist.artStyles),
    ...asArray(artist.themes),
  ].filter(Boolean).map(normalize);
}

function scoreItem(item, artist, type) {
  const terms = buildArtistTerms(artist);
  const haystack = normalize([
    item.title,
    item.name,
    item.provider,
    item.type,
    item.status,
    item.description,
    item.whoShouldApply,
    item.funding,
  ].filter(Boolean).join(' '));

  let score = 0;
  const reasons = [];

  terms.forEach((term) => {
    if (term.length > 2 && haystack.includes(term)) {
      score += 18;
      if (reasons.length < 3) reasons.push(term);
    }
  });

  if (artist.state && haystack.includes('statewide')) score += 12;
  if (artist.city && haystack.includes(normalize(artist.city))) score += 15;
  if (artist.publicArtExperience && /public art|rfq|commission|mural|sculpture/.test(haystack)) score += 10;
  if (artist.muralExperience && /mural|wall|underpass|utility box/.test(haystack)) score += 16;
  if (artist.sculptureInstallationExperience && /sculpture|installation|plaza|outdoor/.test(haystack)) score += 16;
  if (artist.digitalExperience && /film|digital|video|web|xr|projection|documentary/.test(haystack)) score += 16;
  if (artist.djPerformanceExperience || artist.liveMusicianExperience) {
    if (/music|jazz|festival|event|performance/.test(haystack)) score += 16;
  }
  if (type === 'project' && /approved|active|planning/.test(normalize(item.status))) score += 8;

  return {
    ...item,
    matchScore: Math.min(99, Math.max(score, reasons.length ? score : 28)),
    matchReasons: reasons.length ? reasons : ['statewide fit'],
  };
}

function getSavedState(artistId) {
  try {
    return JSON.parse(localStorage.getItem(`${SAVED_KEY_PREFIX}_${artistId}`)) || { funding: [], projects: [] };
  } catch {
    return { funding: [], projects: [] };
  }
}

function saveSavedState(artistId, value) {
  localStorage.setItem(`${SAVED_KEY_PREFIX}_${artistId}`, JSON.stringify(value));
}

export default function ArtistAccountPortal({ onCreateProfile, onOpenGrantAssistant, hideSwitcher = false }) {
  const [activePortalTab, setActivePortalTab] = useState(() => {
    const hasArtistSession = !!localStorage.getItem('ila_artist_session_v1');
    const hasClientSession = !!localStorage.getItem('ila_client_session_v1');
    if (!hasArtistSession && hasClientSession) {
      return 'client';
    }
    return 'artist';
  });

  const [mode, setMode] = useState('signin');
  const [login, setLogin] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [artist, setArtist] = useState(() => {
    try {
      const session = JSON.parse(localStorage.getItem(SESSION_KEY));
      if (session?.email && session?.id) return findArtistByEmailAndId(session.email, session.id);
    } catch {
      return null;
    }
    return null;
  });
  const [activeTab, setActiveTab] = useState('overview');
  const [status, setStatus] = useState('');
  const [saved, setSaved] = useState(() => artist ? getSavedState(artist.id) : { funding: [], projects: [] });

  const [draft, setDraft] = useState(() => artist ? artistToDraft(artist) : {});

  const [selectedFundingSource, setSelectedFundingSource] = useState(null);
  const [preloadedAssistantBudget, setPreloadedAssistantBudget] = useState(null);
  const [mapFocusItemId, setMapFocusItemId] = useState(null);
  const [fundingMode, setFundingMode] = useState('matches'); // matches or all
  const [projectMode, setProjectMode] = useState('matches'); // matches or all
  const [copied, setCopied] = useState(false);
  const [fundingSearchQuery, setFundingSearchQuery] = useState('');
  const [projectSearchQuery, setProjectSearchQuery] = useState('');
  const [rfqSearchQuery, setRfqSearchQuery] = useState('');
  const [savedSearchQuery, setSavedSearchQuery] = useState('');

  const allFundingSources = useMemo(() => getFundingSources(), []);
  const allProjects = useMemo(() => getProjects(), []);

  const savedFunding = useMemo(() => {
    return allFundingSources.filter(item => saved.funding.includes(item.id));
  }, [allFundingSources, saved.funding]);

  const savedProjects = useMemo(() => {
    return allProjects.filter(item => saved.projects.includes(item.id));
  }, [allProjects, saved.projects]);

  useEffect(() => {
    if (!artist) return;
    try {
      const raw = sessionStorage.getItem('ila_grant_preload');
      if (raw) {
        const source = JSON.parse(raw);
        if (source) {
          setSelectedFundingSource(source);
          setPreloadedAssistantBudget(source.amount);
          setActiveTab('grant-assistant');
          sessionStorage.removeItem('ila_grant_preload');
        }
      }
    } catch (e) {
      console.error('Error preloading grant from session:', e);
    }
  }, [artist]);

  const matches = useMemo(() => {
    if (!artist) return { funding: [], projects: [] };
    return {
      funding: getFundingSources()
        .map(item => scoreItem(item, artist, 'funding'))
        .sort((a, b) => b.matchScore - a.matchScore)
        .slice(0, 8),
      projects: getProjects()
        .map(item => scoreItem(item, artist, 'project'))
        .sort((a, b) => b.matchScore - a.matchScore)
        .slice(0, 8),
    };
  }, [artist]);

  const filteredFunding = useMemo(() => {
    if (!artist) return [];
    let list = fundingMode === 'matches' 
      ? matches.funding 
      : allFundingSources.map(item => scoreItem(item, artist, 'funding'));

    list = list.filter(item => !item.isCommunityPost);

    if (fundingSearchQuery.trim()) {
      const q = fundingSearchQuery.toLowerCase();
      list = list.filter(f => 
        (f.title || '').toLowerCase().includes(q) ||
        (f.provider || '').toLowerCase().includes(q) ||
        (f.description || '').toLowerCase().includes(q)
      );
    }
    return list;
  }, [fundingMode, matches.funding, allFundingSources, artist, fundingSearchQuery]);

  const filteredRFQs = useMemo(() => {
    if (!artist) return [];
    const list = allFundingSources
      .filter(f => {
        if (!f.isCommunityPost) return false;
        const anchor = f.submittedAt || f.openDate;
        if (!anchor) return true;
        const posted = new Date(anchor);
        const expires = new Date(posted.getTime() + 60 * 24 * 60 * 60 * 1000);
        return new Date() < expires;
      })
      .map(item => scoreItem(item, artist, 'funding'));

    if (rfqSearchQuery.trim()) {
      const q = rfqSearchQuery.toLowerCase();
      return list.filter(f => 
        (f.title || '').toLowerCase().includes(q) ||
        (f.provider || '').toLowerCase().includes(q) ||
        (f.description || '').toLowerCase().includes(q) ||
        (f.city && f.city.toLowerCase().includes(q))
      );
    }
    return list;
  }, [allFundingSources, artist, rfqSearchQuery]);

  const filteredProjects = useMemo(() => {
    if (!artist) return [];
    let list = projectMode === 'matches' 
      ? matches.projects 
      : allProjects.map(item => scoreItem(item, artist, 'project'));

    if (projectSearchQuery.trim()) {
      const q = projectSearchQuery.toLowerCase();
      list = list.filter(p => 
        (p.name || '').toLowerCase().includes(q) ||
        (p.provider || '').toLowerCase().includes(q) ||
        (p.description || '').toLowerCase().includes(q) ||
        (p.status || '').toLowerCase().includes(q)
      );
    }
    return list;
  }, [projectMode, matches.projects, allProjects, artist, projectSearchQuery]);

  const filteredSavedFunding = useMemo(() => {
    if (!artist) return [];
    let list = savedFunding.map(item => scoreItem(item, artist, 'funding'));
    if (savedSearchQuery.trim()) {
      const q = savedSearchQuery.toLowerCase();
      list = list.filter(f => 
        (f.title || '').toLowerCase().includes(q) ||
        (f.provider || '').toLowerCase().includes(q) ||
        (f.description || '').toLowerCase().includes(q)
      );
    }
    return list;
  }, [savedFunding, artist, savedSearchQuery]);

  const filteredSavedProjects = useMemo(() => {
    if (!artist) return [];
    let list = savedProjects.map(item => scoreItem(item, artist, 'project'));
    if (savedSearchQuery.trim()) {
      const q = savedSearchQuery.toLowerCase();
      list = list.filter(p => 
        (p.name || '').toLowerCase().includes(q) ||
        (p.provider || '').toLowerCase().includes(q) ||
        (p.description || '').toLowerCase().includes(q) ||
        (p.status || '').toLowerCase().includes(q)
      );
    }
    return list;
  }, [savedProjects, artist, savedSearchQuery]);

  if (activePortalTab === 'client') {
    return <ClientAccountPortal hideSwitcher={true} />;
  }

  const handleSignIn = async (event) => {
    event.preventDefault();
    setError('');
    setIsLoading(true);
    try {
      let artistProfile = findArtistByCredentials(login, password);
      let clientProfile = findClientByCredentials(login, password);

      if (!artistProfile && !clientProfile) {
        setError('Profile not found in local cache. Syncing with database...');
        const updatedList = await fetchArtistsFromGoogleSheet(true);
        if (updatedList && Array.isArray(updatedList)) {
          const normLogin = String(login).trim().toLowerCase();
          const trimmedPass = String(password).trim();
          artistProfile = updatedList.find(a => {
            const emailMatch = String(a.email || '').trim().toLowerCase() === normLogin;
            const usernameMatch = String(a.username || '').trim().toLowerCase() === normLogin;
            const passMatch = a.password ? (String(a.password).trim() === trimmedPass) : (String(a.id || '').trim().toLowerCase() === normLogin || String(a.id || '').trim() === trimmedPass);
            return (emailMatch || usernameMatch) && passMatch;
          });
        }
      }

      if (!artistProfile && !clientProfile) {
        logClientEvent("USER_SIGNIN_FAILED", {
          loginAttempted: login
        });
        setError('No profile matches those credentials.');
        setIsLoading(false);
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

      if (artistProfile) {
        setArtist(artistProfile);
        setDraft(artistToDraft(artistProfile));
        setSaved(getSavedState(artistProfile.id));
        setActiveTab('overview');
        setActivePortalTab('artist');
      } else if (clientProfile) {
        setActivePortalTab('client');
      }
    } catch (err) {
      console.error('Sign-in sync failed:', err);
      setError('Connection error: ' + err.message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSignOut = () => {
    localStorage.removeItem(SESSION_KEY);
    localStorage.removeItem('ila_client_session_v1');
    localStorage.removeItem('ila_unified_session_v1');
    setArtist(null);
    setDraft({});
    setSaved({ funding: [], projects: [] });
    setMode('signin');
    setActivePortalTab('artist');
  };

  const handleSaveProfile = (event) => {
    event.preventDefault();
    if (!artist) return;

    const payload = {
      ...draft,
      secondaryMediums: asArray(draft.secondaryMediums),
      artStyles: asArray(draft.artStyles),
      themes: asArray(draft.themes),
    };
    const result = updateArtistFields(artist.id, payload);
    if (!result.success) {
      setStatus(result.error || 'Profile could not be saved.');
      return;
    }
    setArtist(result.artist);
    setDraft(artistToDraft(result.artist));
    localStorage.setItem(SESSION_KEY, JSON.stringify({ email: result.artist.email, id: result.artist.id }));
    setStatus('Profile updated. Your matches have been refreshed.');
    setTimeout(() => setStatus(''), 3500);
  };

  const toggleSaved = (type, id) => {
    if (!artist) return;
    const next = {
      ...saved,
      [type]: saved[type].includes(id)
        ? saved[type].filter(itemId => itemId !== id)
        : [...saved[type], id],
    };
    setSaved(next);
    saveSavedState(artist.id, next);
  };

  if (!artist) {
    return (
      <div className="artist-account-shell">
        <header className="artist-account-header">
          <p className="artist-account-eyebrow">Artist registry profile</p>
          <h1>Create your profile once. Keep your opportunities moving.</h1>
          <p className="artist-account-desc">
            Colorado artists can register a full creative profile, return with their Artist ID, update availability, and save funding or project pipeline matches that fit their practice.
          </p>
        </header>

        <section className="artist-portal-grid">
          {/* Card 1: Register Profile */}
          <article className="artist-portal-card create-card">
            <div className="card-icon-wrapper">
              <span className="material-symbols-outlined">person_add</span>
            </div>
            <h2>Register a New Profile</h2>
            <p>
              Create your initial record to join the database, parse your resume automatically, upload your portfolios, and unlock opportunity matches tailored to your mediums.
            </p>
            <button className="artist-account-primary create-button" type="button" onClick={onCreateProfile}>
              Start profile registration
              <span className="material-symbols-outlined">arrow_forward</span>
            </button>
          </article>

          {/* Card 2: Sign In */}
          <article className="artist-portal-card login-card">
            <div className="card-icon-wrapper">
              <span className="material-symbols-outlined">login</span>
            </div>
            <h2>Access Existing Profile</h2>
            <p>
              Enter your registered email and unique Artist ID to access your matchmaking dashboard, save opportunities, and update your availability.
            </p>
            
            <form className="artist-account-form" onSubmit={handleSignIn} style={{ width: '100%', marginTop: 'auto' }}>
              <label style={{ display: 'grid', gap: '0.4rem', width: '100%', marginBottom: '0.75rem' }}>
                Email Address or Username
                <input 
                  value={login} 
                  onChange={(event) => setLogin(event.target.value)} 
                  type="text" 
                  placeholder="artist@example.com or username" 
                  required 
                  disabled={isLoading}
                  style={{ width: '100%', minHeight: '44px', background: 'rgba(0,0,0,0.36)', border: '1px solid rgba(255,255,255,0.14)', borderRadius: '8px', padding: '0 0.85rem', color: '#fff', opacity: isLoading ? 0.6 : 1 }}
                />
              </label>
              <label style={{ display: 'grid', gap: '0.4rem', width: '100%', marginBottom: '0.75rem' }}>
                Password or Artist ID
                <input 
                  value={password} 
                  onChange={(event) => setPassword(event.target.value)} 
                  type="password" 
                  placeholder="•••••••• or ILA-2026-0001" 
                  required 
                  disabled={isLoading}
                  style={{ width: '100%', minHeight: '44px', background: 'rgba(0,0,0,0.36)', border: '1px solid rgba(255,255,255,0.14)', borderRadius: '8px', padding: '0 0.85rem', color: '#fff', opacity: isLoading ? 0.6 : 1 }}
                />
              </label>
              {error && <p className="artist-account-message error" style={{ margin: '0.5rem 0' }}>{error}</p>}
              <button className="artist-account-primary login-button" type="submit" disabled={isLoading} style={{ width: '100%', marginTop: '0.5rem', opacity: isLoading ? 0.7 : 1 }}>
                <span className={`material-symbols-outlined ${isLoading ? 'spinning' : ''}`}>{isLoading ? 'sync' : 'dashboard'}</span>
                {isLoading ? 'Syncing with database...' : 'Sign in to dashboard'}
              </button>
            </form>
          </article>
        </section>

        <section className="artist-account-benefits">
          {[
            ['badge', 'Profile login', 'Return with your email and Artist ID to keep your public profile current.'],
            ['bookmark', 'Saved opportunities', 'Track grants, RFQs, commissions, and project leads that matter to you.'],
            ['auto_awesome', 'Personalized matches', 'Matches rank by your mediums, styles, location, and capabilities.'],
          ].map(([icon, title, body]) => (
            <article key={title}>
              <span className="material-symbols-outlined">{icon}</span>
              <h2>{title}</h2>
              <p>{body}</p>
            </article>
          ))}
        </section>
        <ArtistAccountStyles />
      </div>
    );
  }

  const hasArtistSession = !!localStorage.getItem('ila_artist_session_v1');
  const hasClientSession = !!localStorage.getItem('ila_client_session_v1');
  const showSwitcher = !hideSwitcher && hasArtistSession && hasClientSession;

  return (
    <div className="artist-account-shell">
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
      <header className="artist-dashboard-header">
        <div style={{ display: 'flex', gap: '1.25rem', alignItems: 'center' }}>
          {artist.profilePicture ? (
            <img src={artist.profilePicture} alt="Avatar" style={{ width: '64px', height: '64px', borderRadius: '50%', objectFit: 'cover', border: '2px solid var(--accent-terracotta)', flexShrink: 0 }} />
          ) : (
            <div style={{ width: '64px', height: '64px', borderRadius: '50%', background: 'rgba(255,255,255,0.05)', display: 'flex', alignItems: 'center', justifyContent: 'center', border: '1px solid rgba(255,255,255,0.1)', flexShrink: 0 }}>
              <span className="material-symbols-outlined" style={{ fontSize: '2rem', color: 'rgba(255,255,255,0.3)' }}>person</span>
            </div>
          )}
          <div>
            <p className="artist-account-eyebrow">Artist dashboard</p>
            <h1>{artist.alias || `${artist.firstName} ${artist.lastName}`}</h1>
            <p>{artist.primaryMedium || 'Creative profile'} · {artist.city || 'Colorado'} · {artist.availabilityStatus || 'Available'}</p>
          </div>
        </div>
        <div className="artist-dashboard-actions">
          <span>{artist.id}</span>
          <button type="button" onClick={handleSignOut}>Sign out</button>
        </div>
      </header>

      <nav className="artist-dashboard-tabs" aria-label="Artist dashboard tabs">
        {[
          ['overview', 'Overview', 'dashboard'],
          ['profile', 'Edit profile', 'edit'],
          ['funding', 'Funding sources', 'workspace_premium'],
          ['client-rfqs', 'Art in Need Board', 'campaign'],
          ['applications', 'Grant Applications', 'edit_note'],
          ['grant-assistant', 'Grant Assistant', 'auto_awesome_motion'],
          ['projects', 'Project pipeline', 'account_tree'],
          ['map', 'Opportunities Map', 'explore'],
          ['saved', 'Saved', 'bookmark'],
        ].map(([key, label, icon]) => (
          <button className={activeTab === key ? 'active' : ''} type="button" key={key} onClick={() => setActiveTab(key)}>
            <span className="material-symbols-outlined">{icon}</span>
            {label}
          </button>
        ))}
      </nav>

      {activeTab === 'overview' && (
        <div style={{ animation: 'fadeIn 0.3s ease forwards', display: 'flex', flexDirection: 'column', gap: '2.5rem' }}>
          {/* Celebration Top Layout */}
          <div style={{ 
            display: 'grid', 
            gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', 
            gap: '2.5rem', 
            marginBottom: '1rem',
            alignItems: 'center',
            width: 'min(1180px, 100%)',
            marginInline: 'auto',
            marginTop: '1.5rem'
          }}>
            {/* Left Column: Greeting */}
            <div style={{ textAlign: 'left' }}>
              <span className="material-symbols-outlined" style={{ fontSize: '3rem', color: 'var(--accent-terracotta)', marginBottom: '0.5rem', display: 'block' }}>check_circle</span>
              <h1 style={{ fontFamily: 'Space Grotesk', fontSize: '2.2rem', fontWeight: 900, color: '#fff', margin: '0.25rem 0 0.75rem', lineHeight: 1.15 }}>
                Welcome, {artist.firstName}!
              </h1>
              <p style={{ color: 'rgba(255,255,255,0.7)', fontSize: '0.98rem', lineHeight: '1.6', margin: 0 }}>
                Thank you for completing your registry. Your profile is active in the Colorado statewide creative directory. Keep your availability, styles, and portfolio updated to get matched with active municipal calls.
              </p>
              <div style={{ display: 'flex', gap: '1.5rem', marginTop: '1.5rem', flexWrap: 'wrap' }}>
                <div style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: '12px', padding: '0.75rem 1.25rem', minWidth: '130px' }}>
                  <div style={{ fontSize: '0.72rem', color: 'rgba(255,255,255,0.4)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Profile Health</div>
                  <div style={{ fontSize: '1.4rem', fontWeight: 700, color: 'var(--accent-terracotta)', fontFamily: 'Space Grotesk', marginTop: '2px' }}>
                    {(() => {
                      const fields = [
                        ['Portfolio', artist.portfolioUrl || artist.website],
                        ['Primary medium', artist.primaryMedium],
                        ['Capabilities', artist.capabilitiesDescription],
                        ['Availability', artist.availabilityStatus],
                        ['Notable work', artist.notableProjects],
                      ];
                      const complete = fields.filter(([, value]) => Boolean(value)).length;
                      return Math.round((complete / fields.length) * 100);
                    })()}%
                  </div>
                </div>
                <div style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: '12px', padding: '0.75rem 1.25rem', minWidth: '130px' }}>
                  <div style={{ fontSize: '0.72rem', color: 'rgba(255,255,255,0.4)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Saved Items</div>
                  <div style={{ fontSize: '1.4rem', fontWeight: 700, color: 'var(--accent-electric)', fontFamily: 'Space Grotesk', marginTop: '2px' }}>
                    {saved.funding.length + saved.projects.length}
                  </div>
                </div>
              </div>
            </div>

            {/* Right Column: Digital Artist Pass */}
            <div className="artist-pass-card">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid rgba(255,255,255,0.08)', paddingBottom: '0.75rem' }}>
                <div style={{ fontFamily: 'Space Grotesk', fontWeight: 800, fontSize: '0.8rem', letterSpacing: '0.15em', textTransform: 'uppercase', color: 'rgba(255,255,255,0.5)' }}>
                  Artist Pass
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                  <span className="opp-badge fit-high" style={{ margin: 0, padding: '0.15rem 0.45rem', fontSize: '0.65rem' }}>Active</span>
                </div>
              </div>

              <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
                {artist.profilePicture ? (
                  <img src={artist.profilePicture} alt="Avatar" style={{ width: '56px', height: '56px', borderRadius: '50%', objectFit: 'cover', border: '2px solid var(--accent-terracotta)' }} />
                ) : (
                  <div style={{ width: '56px', height: '56px', borderRadius: '50%', background: 'rgba(255,255,255,0.04)', display: 'flex', alignItems: 'center', justifyContent: 'center', border: '1px solid rgba(255,255,255,0.08)' }}>
                    <span className="material-symbols-outlined" style={{ fontSize: '1.5rem', color: 'rgba(255,255,255,0.3)' }}>person</span>
                  </div>
                )}
                <div>
                  <div style={{ fontSize: '1.1rem', fontWeight: 700, color: '#fff', fontFamily: 'Space Grotesk' }}>
                    {artist.firstName} {artist.lastName}
                  </div>
                  {artist.alias && (
                    <div style={{ fontSize: '0.8rem', color: 'var(--accent-ochre)', fontWeight: 500, marginTop: '1px' }}>
                      aka {artist.alias}
                    </div>
                  )}
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', fontSize: '0.82rem', marginTop: '0.25rem' }}>
                <div>
                  <div style={{ color: 'rgba(255,255,255,0.4)', textTransform: 'uppercase', fontSize: '0.65rem', letterSpacing: '0.05em', marginBottom: '2px' }}>Medium</div>
                  <div style={{ color: '#fff', fontWeight: 600 }}>{artist.primaryMedium || 'Not specified'}</div>
                </div>
                <div>
                  <div style={{ color: 'rgba(255,255,255,0.4)', textTransform: 'uppercase', fontSize: '0.65rem', letterSpacing: '0.05em', marginBottom: '2px' }}>Vetting Status</div>
                  <div style={{ color: 'var(--accent-electric)', fontWeight: 600 }}>{artist.vettingStatus || 'Approved'}</div>
                </div>
              </div>

              <div style={{ 
                background: 'rgba(0,0,0,0.25)', 
                border: '1px solid rgba(255,255,255,0.06)', 
                borderRadius: '10px', 
                padding: '0.65rem 0.85rem', 
                display: 'flex', 
                justifyContent: 'space-between', 
                alignItems: 'center',
                marginTop: '0.25rem'
              }}>
                <div style={{ display: 'flex', flexDirection: 'column' }}>
                  <span style={{ fontSize: '0.62rem', color: 'rgba(255,255,255,0.4)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Artist ID / Key</span>
                  <span style={{ fontSize: '0.92rem', fontWeight: 700, color: 'var(--accent-terracotta)', fontFamily: 'Space Grotesk', marginTop: '1px' }}>{artist.id}</span>
                </div>
                <button 
                  type="button"
                  style={{ 
                    background: 'rgba(255,255,255,0.04)', 
                    border: '1px solid rgba(255,255,255,0.08)',
                    borderRadius: '6px', 
                    padding: '0.35rem 0.6rem', 
                    color: 'rgba(255,255,255,0.75)', 
                    fontSize: '0.72rem', 
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.25rem',
                    fontWeight: 600
                  }}
                  onClick={() => {
                    navigator.clipboard.writeText(artist.id);
                    setCopied(true);
                    setTimeout(() => setCopied(false), 2000);
                  }}
                >
                  <span className="material-symbols-outlined" style={{ fontSize: '0.85rem' }}>content_copy</span>
                  {copied ? 'Copied' : 'Copy'}
                </button>
              </div>
            </div>
          </div>

          {/* Unlocked Artist Resources & Tools cards */}
          <div style={{ width: 'min(1180px, 100%)', marginInline: 'auto' }}>
            <h2 style={{ fontFamily: 'Space Grotesk', fontSize: '1.35rem', fontWeight: 700, color: '#fff', marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <span className="material-symbols-outlined" style={{ color: 'var(--accent-electric)' }}>workspace_premium</span>
              Artist Resources &amp; Matchmaking Tools
            </h2>
            
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))',
              gap: '1.5rem'
            }}>
              {/* Card 1: Grants & Funding */}
              <div className="dashboard-feature-card funding" style={{
                background: 'linear-gradient(135deg, rgba(224, 90, 71, 0.06) 0%, rgba(13, 13, 15, 0.4) 100%)',
                border: '1px solid rgba(224, 90, 71, 0.16)',
                borderRadius: '16px',
                padding: '1.75rem',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between',
                minHeight: '230px',
                boxShadow: '0 10px 30px rgba(0,0,0,0.3)',
                backdropFilter: 'blur(10px)'
              }}>
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                    <span className="material-symbols-outlined" style={{ fontSize: '2.2rem', color: 'var(--accent-terracotta)' }}>workspace_premium</span>
                    <span className="opp-badge fit-high" style={{ background: 'rgba(224, 90, 71, 0.1)', borderColor: 'rgba(224, 90, 71, 0.25)', color: 'var(--accent-terracotta)' }}>{matches.funding.length} Matches</span>
                  </div>
                  <h3 style={{ fontFamily: 'Space Grotesk', fontSize: '1.2rem', marginTop: '1rem', color: '#fff', fontWeight: 700 }}>Grants &amp; Funding</h3>
                  <p style={{ color: 'rgba(255,255,255,0.55)', marginTop: '0.4rem', fontSize: '0.88rem', lineHeight: '1.5' }}>
                    Browse regional calls, public art grants, and residency funding opportunities matching your practice.
                  </p>
                </div>
                <button className="pill-btn" type="button" style={{ 
                  marginTop: '1.25rem', width: '100%', borderRadius: '10px', 
                  background: 'var(--accent-terracotta)', border: 'none', color: '#fff', 
                  fontWeight: 700, padding: '0.65rem 1.25rem', display: 'flex', 
                  alignItems: 'center', justifyContent: 'center', gap: '0.4rem', 
                  cursor: 'pointer', fontFamily: 'inherit', fontSize: '0.88rem',
                  boxShadow: '0 4px 12px rgba(224, 90, 71, 0.2)',
                  transition: 'all 0.2s ease'
                }} onClick={() => setActiveTab('funding')}>
                  Explore Database
                  <span className="material-symbols-outlined" style={{ fontSize: '1rem' }}>arrow_forward</span>
                </button>
              </div>

              {/* Card 2: Art in Need Board */}
              <div className="dashboard-feature-card rfqs" style={{
                background: 'linear-gradient(135deg, rgba(167, 139, 250, 0.06) 0%, rgba(13, 13, 15, 0.4) 100%)',
                border: '1px solid rgba(167, 139, 250, 0.16)',
                borderRadius: '16px',
                padding: '1.75rem',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between',
                minHeight: '230px',
                boxShadow: '0 10px 30px rgba(0,0,0,0.3)',
                backdropFilter: 'blur(10px)'
              }}>
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                    <span className="material-symbols-outlined" style={{ fontSize: '2.2rem', color: '#a78bfa' }}>campaign</span>
                    <span className="opp-badge fit-medium" style={{ background: 'rgba(167, 139, 250, 0.1)', borderColor: 'rgba(167, 139, 250, 0.25)', color: '#a78bfa' }}>Live Feed</span>
                  </div>
                  <h3 style={{ fontFamily: 'Space Grotesk', fontSize: '1.2rem', marginTop: '1rem', color: '#fff', fontWeight: 700 }}>Art in Need Board</h3>
                  <p style={{ color: 'rgba(255,255,255,0.55)', marginTop: '0.4rem', fontSize: '0.88rem', lineHeight: '1.5' }}>
                    Review commission briefs and event requests uploaded directly by local clients and companies.
                  </p>
                </div>
                <button className="pill-btn" type="button" style={{ 
                  marginTop: '1.25rem', width: '100%', borderRadius: '10px', 
                  background: '#a78bfa', border: 'none', color: '#fff', 
                  fontWeight: 700, padding: '0.65rem 1.25rem', display: 'flex', 
                  alignItems: 'center', justifyContent: 'center', gap: '0.4rem', 
                  cursor: 'pointer', fontFamily: 'inherit', fontSize: '0.88rem',
                  boxShadow: '0 4px 12px rgba(167, 139, 250, 0.2)',
                  transition: 'all 0.2s ease'
                }} onClick={() => setActiveTab('client-rfqs')}>
                  View Commissions
                  <span className="material-symbols-outlined" style={{ fontSize: '1rem' }}>arrow_forward</span>
                </button>
              </div>

              {/* Card 3: Project Pipeline */}
              <div className="dashboard-feature-card pipeline" style={{
                background: 'linear-gradient(135deg, rgba(74, 131, 237, 0.06) 0%, rgba(13, 13, 15, 0.4) 100%)',
                border: '1px solid rgba(74, 131, 237, 0.16)',
                borderRadius: '16px',
                padding: '1.75rem',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between',
                minHeight: '230px',
                boxShadow: '0 10px 30px rgba(0,0,0,0.3)',
                backdropFilter: 'blur(10px)'
              }}>
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                    <span className="material-symbols-outlined" style={{ fontSize: '2.2rem', color: 'var(--accent-electric)' }}>explore</span>
                    <span className="opp-badge fit-high" style={{ background: 'rgba(74, 131, 237, 0.1)', borderColor: 'rgba(74, 131, 237, 0.25)', color: 'var(--accent-electric)' }}>{matches.projects.length} Matches</span>
                  </div>
                  <h3 style={{ fontFamily: 'Space Grotesk', fontSize: '1.2rem', marginTop: '1rem', color: '#fff', fontWeight: 700 }}>Project Pipeline</h3>
                  <p style={{ color: 'rgba(255,255,255,0.55)', marginTop: '0.4rem', fontSize: '0.88rem', lineHeight: '1.5' }}>
                    Track municipal installations and regional public art milestones in Colorado.
                  </p>
                </div>
                <button className="pill-btn" type="button" style={{ 
                  marginTop: '1.25rem', width: '100%', borderRadius: '10px', 
                  background: 'var(--accent-electric)', border: 'none', color: '#fff', 
                  fontWeight: 700, padding: '0.65rem 1.25rem', display: 'flex', 
                  alignItems: 'center', justifyContent: 'center', gap: '0.4rem', 
                  cursor: 'pointer', fontFamily: 'inherit', fontSize: '0.88rem',
                  boxShadow: '0 4px 12px rgba(74, 131, 237, 0.2)',
                  transition: 'all 0.2s ease'
                }} onClick={() => setActiveTab('projects')}>
                  Track Projects
                  <span className="material-symbols-outlined" style={{ fontSize: '1rem' }}>arrow_forward</span>
                </button>
              </div>

              {/* Card 4: Grant Assistant */}
              <div className="dashboard-feature-card assistant" style={{
                background: 'linear-gradient(135deg, rgba(235, 166, 90, 0.06) 0%, rgba(13, 13, 15, 0.4) 100%)',
                border: '1px solid rgba(235, 166, 90, 0.16)',
                borderRadius: '16px',
                padding: '1.75rem',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between',
                minHeight: '230px',
                boxShadow: '0 10px 30px rgba(0,0,0,0.3)',
                backdropFilter: 'blur(10px)'
              }}>
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                    <span className="material-symbols-outlined" style={{ fontSize: '2.2rem', color: 'var(--accent-ochre)' }}>auto_awesome</span>
                    <span className="opp-badge fit-medium" style={{ background: 'rgba(235, 166, 90, 0.1)', borderColor: 'rgba(235, 166, 90, 0.25)', color: 'var(--accent-ochre)' }}>AI Copilot</span>
                  </div>
                  <h3 style={{ fontFamily: 'Space Grotesk', fontSize: '1.2rem', marginTop: '1rem', color: '#fff', fontWeight: 700 }}>Grant Assistant</h3>
                  <p style={{ color: 'rgba(255,255,255,0.55)', marginTop: '0.4rem', fontSize: '0.88rem', lineHeight: '1.5' }}>
                    Draft proposals, calculate budgets, and review educational grant writing checklists.
                  </p>
                </div>
                <button className="pill-btn" type="button" style={{ 
                  marginTop: '1.25rem', width: '100%', borderRadius: '10px', 
                  background: 'var(--accent-ochre)', border: 'none', color: '#fff', 
                  fontWeight: 700, padding: '0.65rem 1.25rem', display: 'flex', 
                  alignItems: 'center', justifyContent: 'center', gap: '0.4rem', 
                  cursor: 'pointer', fontFamily: 'inherit', fontSize: '0.88rem',
                  boxShadow: '0 4px 12px rgba(235, 166, 90, 0.2)',
                  transition: 'all 0.2s ease'
                }} onClick={() => setActiveTab('grant-assistant')}>
                  Open Assistant
                  <span className="material-symbols-outlined" style={{ fontSize: '1rem' }}>arrow_forward</span>
                </button>
              </div>
            </div>
          </div>

          {/* Match Snapshot and Next Best Actions */}
          <section className="artist-dashboard-grid" style={{ width: 'min(1180px, 100%)', marginInline: 'auto' }}>
            <article className="artist-account-card span-2">
              <h2 style={{ fontFamily: 'Space Grotesk', fontSize: '1.35rem', fontWeight: 700, color: '#fff', marginBottom: '0.5rem' }}>Your Match Snapshot</h2>
              <p style={{ margin: 0, color: 'var(--text-secondary)' }}>These are recalculated automatically whenever you update your profile.</p>
              <div className="artist-match-summary" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: '1rem', marginTop: '1.5rem' }}>
                <div>
                  <strong style={{ fontSize: '1.75rem', color: '#fff', fontFamily: 'Space Grotesk' }}>{matches.funding.length}</strong>
                  <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>Funding leads</span>
                </div>
                <div>
                  <strong style={{ fontSize: '1.75rem', color: '#fff', fontFamily: 'Space Grotesk' }}>{matches.projects.length}</strong>
                  <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>Project leads</span>
                </div>
                <div>
                  <strong style={{ fontSize: '1.75rem', color: '#fff', fontFamily: 'Space Grotesk' }}>{saved.funding.length + saved.projects.length}</strong>
                  <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>Saved items</span>
                </div>
              </div>
            </article>
            <article className="artist-account-card">
              <h2 style={{ fontFamily: 'Space Grotesk', fontSize: '1.35rem', fontWeight: 700, color: '#fff', marginBottom: '0.5rem' }}>Next Best Actions</h2>
              <ul className="artist-action-list" style={{ marginTop: '0.75rem', paddingLeft: '1.1rem' }}>
                <li>Confirm your availability and portfolio URL.</li>
                <li>Save at least three funding or project matches.</li>
                <li>Add capabilities that describe scale, tools, and team size.</li>
              </ul>
            </article>
          </section>
        </div>
      )}

      {activeTab === 'profile' && (
        <form className="artist-profile-editor" onSubmit={handleSaveProfile}>
          <div className="artist-editor-heading">
            <div>
              <h2>Edit full profile</h2>
              <p>Changes update your local registry profile and refresh your matches.</p>
            </div>
            <button className="artist-account-primary" type="submit">Save updates</button>
          </div>
          {status && <p className="artist-account-message success">{status}</p>}
          
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
                    alt="Profile Avatar" 
                    style={{ width: '96px', height: '96px', borderRadius: '50%', objectFit: 'cover', border: '3px solid var(--accent-terracotta)', boxShadow: '0 4px 15px rgba(224, 90, 71, 0.15)' }} 
                  />
                  <button
                    type="button"
                    onClick={() => setDraft(prev => ({ ...prev, profilePicture: '' }))}
                    style={{
                      position: 'absolute',
                      top: '-4px',
                      right: '-4px',
                      background: 'var(--accent-terracotta)',
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
                  <span className="material-symbols-outlined" style={{ fontSize: '2.2rem', color: 'rgba(255,255,255,0.2)' }}>person</span>
                </div>
              )}
              
              <div style={{ flex: '1 1 200px' }}>
                <input
                  type="file"
                  id="profilePicEditInput"
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
                  onClick={() => document.getElementById('profilePicEditInput').click()}
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
                  Change Photo
                </button>
                <p style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', margin: '6px 0 0 0' }}>
                  JPEG or PNG under 800 KB. Square aspect ratio recommended.
                </p>
              </div>
            </div>

            <label style={{ display: 'grid', gap: '0.4rem' }}>
              Biography / About Me
              <textarea
                value={draft.bio || ''}
                placeholder="Write a brief biography..."
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
                  fontFamily: 'inherit',
                  textTransform: 'none',
                  letterSpacing: 'normal',
                  fontWeight: 'normal'
                }}
              />
            </label>
          </div>
          <div className="artist-editor-grid">
            {PROFILE_FIELDS.map(field => (
              <label key={field.key}>
                {field.label}
                <input
                  type={field.type}
                  value={draft[field.key] || ''}
                  placeholder={field.placeholder}
                  onChange={(event) => setDraft({ ...draft, [field.key]: event.target.value })}
                />
              </label>
            ))}
            <label>
              Availability
              <select value={draft.availabilityStatus || 'Available'} onChange={(event) => setDraft({ ...draft, availabilityStatus: event.target.value })}>
                <option value="Available">Available</option>
                <option value="Semi-Available">Semi-Available</option>
                <option value="Booked">Booked</option>
              </select>
            </label>
            <label>
              Experience Level
              <select value={draft.experienceLevel || 'Emerging'} onChange={(event) => setDraft({ ...draft, experienceLevel: event.target.value })}>
                <option value="Emerging">Emerging</option>
                <option value="Mid-Career">Mid-Career</option>
                <option value="Established">Established</option>
              </select>
            </label>
          </div>
          <div className="artist-textarea-grid">
            {TEXTAREA_FIELDS.map(field => (
              <label key={field.key}>
                {field.label}
                <textarea
                  value={draft[field.key] || ''}
                  placeholder={field.hint}
                  onChange={(event) => setDraft({ ...draft, [field.key]: event.target.value })}
                />
              </label>
            ))}
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
            
            <div className="artist-editor-grid" style={{ marginTop: '0.5rem' }}>
              <label style={{ display: 'grid', gap: '0.4rem' }}>
                Username
                <input
                  type="text"
                  value={draft.username || ''}
                  placeholder="e.g. janedoe"
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

      {activeTab === 'funding' && (
        <section className="artist-account-card" style={{ padding: '1.75rem 2rem' }}>
          <div className="artist-editor-heading" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem', borderBottom: '1px solid var(--border-subtle)', paddingBottom: '1.25rem', marginBottom: '1.5rem' }}>
            <div>
              <h2 style={{ margin: 0, fontFamily: 'Space Grotesk' }}>Funding Sources</h2>
              <p style={{ margin: '0.2rem 0 0 0', color: 'var(--text-secondary, rgba(255,255,255,0.5))', fontSize: '0.88rem' }}>{fundingMode === 'matches' ? 'Opportunities matching your capability score.' : 'All funding sources in the database.'}</p>
            </div>
            <div style={{ display: 'flex', gap: '1rem', alignItems: 'center', flexWrap: 'wrap' }}>
              <div className="portal-search-bar">
                <span className="material-symbols-outlined" style={{ fontSize: '1.1rem', color: 'rgba(255,255,255,0.3)' }}>search</span>
                <input 
                  type="text" 
                  placeholder="Search opportunities..." 
                  value={fundingSearchQuery}
                  onChange={(e) => setFundingSearchQuery(e.target.value)}
                />
                {fundingSearchQuery && (
                  <button 
                    type="button"
                    onClick={() => setFundingSearchQuery('')}
                    style={{ background: 'transparent', border: 'none', color: 'rgba(255,255,255,0.4)', cursor: 'pointer', display: 'flex', alignItems: 'center', padding: 0 }}
                  >
                    <span className="material-symbols-outlined" style={{ fontSize: '1rem' }}>close</span>
                  </button>
                )}
              </div>
              <div style={{ display: 'flex', gap: '0.5rem' }}>
                <button 
                  type="button" 
                  onClick={() => setFundingMode('matches')}
                  style={{
                    padding: '0.4rem 0.85rem',
                    borderRadius: '6px',
                    border: '1px solid var(--border-subtle)',
                    background: fundingMode === 'matches' ? 'var(--accent-terracotta)' : 'rgba(255,255,255,0.03)',
                    color: '#fff',
                    fontSize: '0.8rem',
                    fontWeight: 700,
                    cursor: 'pointer'
                  }}
                >
                  Profile Matches
                </button>
                <button 
                  type="button" 
                  onClick={() => setFundingMode('all')}
                  style={{
                    padding: '0.4rem 0.85rem',
                    borderRadius: '6px',
                    border: '1px solid var(--border-subtle)',
                    background: fundingMode === 'all' ? 'var(--accent-terracotta)' : 'rgba(255,255,255,0.03)',
                    color: '#fff',
                    fontSize: '0.8rem',
                    fontWeight: 700,
                    cursor: 'pointer'
                  }}
                >
                  Browse All
                </button>
              </div>
            </div>
          </div>
          
          <MatchGrid
            title=""
            items={filteredFunding}
            type="funding"
            savedIds={saved.funding}
            onToggleSaved={toggleSaved}
            onOpenAssistant={(item) => {
              setSelectedFundingSource(item);
              setPreloadedAssistantBudget(item.amount);
              setActiveTab('grant-assistant');
            }}
          />
        </section>
      )}

      {activeTab === 'client-rfqs' && (
        <section className="artist-account-card" style={{ padding: '1.75rem 2rem' }}>
          <div className="artist-editor-heading" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem', borderBottom: '1px solid var(--border-subtle)', paddingBottom: '1.25rem', marginBottom: '1.5rem' }}>
            <div>
              <h2 style={{ margin: 0, fontFamily: 'Space Grotesk' }}>Art in Need Board</h2>
              <p style={{ margin: '0.2rem 0 0 0', color: 'var(--text-secondary, rgba(255,255,255,0.5))', fontSize: '0.88rem' }}>Active commission calls, RFQs, and event gigs posted by clients.</p>
            </div>
            <div className="portal-search-bar">
              <span className="material-symbols-outlined" style={{ fontSize: '1.1rem', color: 'rgba(255,255,255,0.3)' }}>search</span>
              <input 
                type="text" 
                placeholder="Search commissions..." 
                value={rfqSearchQuery}
                onChange={(e) => setRfqSearchQuery(e.target.value)}
              />
              {rfqSearchQuery && (
                <button 
                  type="button"
                  onClick={() => setRfqSearchQuery('')}
                  style={{ background: 'transparent', border: 'none', color: 'rgba(255,255,255,0.4)', cursor: 'pointer', display: 'flex', alignItems: 'center', padding: 0 }}
                >
                  <span className="material-symbols-outlined" style={{ fontSize: '1rem' }}>close</span>
                </button>
              )}
            </div>
          </div>
          
          <MatchGrid
            title=""
            items={filteredRFQs}
            type="client-rfqs"
            savedIds={saved.funding}
            onToggleSaved={toggleSaved}
          />
        </section>
      )}

      {activeTab === 'projects' && (
        <section className="artist-account-card" style={{ padding: '1.75rem 2rem' }}>
          <div className="artist-editor-heading" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem', borderBottom: '1px solid var(--border-subtle)', paddingBottom: '1.25rem', marginBottom: '1.5rem' }}>
            <div>
              <h2 style={{ margin: 0, fontFamily: 'Space Grotesk' }}>Project Pipeline</h2>
              <p style={{ margin: '0.2rem 0 0 0', color: 'var(--text-secondary, rgba(255,255,255,0.5))', fontSize: '0.88rem' }}>{projectMode === 'matches' ? 'Colorado projects matching your style and medium.' : 'All public art projects in the registry.'}</p>
            </div>
            <div style={{ display: 'flex', gap: '1rem', alignItems: 'center', flexWrap: 'wrap' }}>
              <div className="portal-search-bar">
                <span className="material-symbols-outlined" style={{ fontSize: '1.1rem', color: 'rgba(255,255,255,0.3)' }}>search</span>
                <input 
                  type="text" 
                  placeholder="Search projects..." 
                  value={projectSearchQuery}
                  onChange={(e) => setProjectSearchQuery(e.target.value)}
                />
                {projectSearchQuery && (
                  <button 
                    type="button"
                    onClick={() => setProjectSearchQuery('')}
                    style={{ background: 'transparent', border: 'none', color: 'rgba(255,255,255,0.4)', cursor: 'pointer', display: 'flex', alignItems: 'center', padding: 0 }}
                  >
                    <span className="material-symbols-outlined" style={{ fontSize: '1rem' }}>close</span>
                  </button>
                )}
              </div>
              <div style={{ display: 'flex', gap: '0.5rem' }}>
                <button 
                  type="button" 
                  onClick={() => setProjectMode('matches')}
                  style={{
                    padding: '0.4rem 0.85rem',
                    borderRadius: '6px',
                    border: '1px solid var(--border-subtle)',
                    background: projectMode === 'matches' ? 'var(--accent-terracotta)' : 'rgba(255,255,255,0.03)',
                    color: '#fff',
                    fontSize: '0.8rem',
                    fontWeight: 700,
                    cursor: 'pointer'
                  }}
                >
                  Profile Matches
                </button>
                <button 
                  type="button" 
                  onClick={() => setProjectMode('all')}
                  style={{
                    padding: '0.4rem 0.85rem',
                    borderRadius: '6px',
                    border: '1px solid var(--border-subtle)',
                    background: projectMode === 'all' ? 'var(--accent-terracotta)' : 'rgba(255,255,255,0.03)',
                    color: '#fff',
                    fontSize: '0.8rem',
                    fontWeight: 700,
                    cursor: 'pointer'
                  }}
                >
                  Browse All
                </button>
              </div>
            </div>
          </div>
          
          <MatchGrid
            title=""
            items={filteredProjects}
            type="projects"
            savedIds={saved.projects}
            onToggleSaved={toggleSaved}
          />
        </section>
      )}

      {activeTab === 'saved' && (
        <section className="artist-saved-sections" style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
          <div className="artist-editor-heading" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem', borderBottom: '1px solid var(--border-subtle)', paddingBottom: '1.25rem' }}>
            <div>
              <h2 style={{ margin: 0, fontFamily: 'Space Grotesk' }}>Saved Opportunities</h2>
              <p style={{ margin: '0.2rem 0 0 0', color: 'var(--text-secondary, rgba(255,255,255,0.5))', fontSize: '0.88rem' }}>Opportunities you have bookmarked for quick access.</p>
            </div>
            <div className="portal-search-bar">
              <span className="material-symbols-outlined" style={{ fontSize: '1.1rem', color: 'rgba(255,255,255,0.3)' }}>search</span>
              <input 
                type="text" 
                placeholder="Search saved items..." 
                value={savedSearchQuery}
                onChange={(e) => setSavedSearchQuery(e.target.value)}
              />
              {savedSearchQuery && (
                <button 
                  type="button"
                  onClick={() => setSavedSearchQuery('')}
                  style={{ background: 'transparent', border: 'none', color: 'rgba(255,255,255,0.4)', cursor: 'pointer', display: 'flex', alignItems: 'center', padding: 0 }}
                >
                  <span className="material-symbols-outlined" style={{ fontSize: '1rem' }}>close</span>
                </button>
              )}
            </div>
          </div>
          
          <MatchGrid 
            title="Saved funding" 
            items={filteredSavedFunding} 
            type="funding" 
            savedIds={saved.funding} 
            onToggleSaved={toggleSaved} 
            onOpenAssistant={(item) => {
              setSelectedFundingSource(item);
              setPreloadedAssistantBudget(item.amount);
              setActiveTab('grant-assistant');
            }}
          />
          
          <MatchGrid 
            title="Saved projects" 
            items={filteredSavedProjects} 
            type="projects" 
            savedIds={saved.projects} 
            onToggleSaved={toggleSaved} 
          />
        </section>
      )}

      {activeTab === 'applications' && (
        <section className="artist-account-card" style={{ padding: '1.75rem 2rem' }}>
          <div className="artist-editor-heading" style={{ marginBottom: '1.25rem' }}>
            <div>
              <h2 style={{ margin: 0, fontFamily: 'Space Grotesk', fontSize: '1.2rem' }}>Grant Applications</h2>
              <p style={{ color: 'var(--text-secondary, rgba(255,255,255,0.5))', fontSize: '0.88rem', marginTop: '0.3rem' }}>
                Your top-matched funding opportunities — click any to open the Grant Proposal Assistant pre-loaded with your profile.
              </p>
            </div>
          </div>

          {matches.funding.length === 0 ? (
            <p className="artist-empty-state">No funding matches yet. Complete your profile to improve your match score.</p>
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '1rem' }}>
              {matches.funding.map(item => (
                <div key={item.id} style={{
                  background: 'rgba(255,255,255,0.025)',
                  backdropFilter: 'blur(12px)',
                  WebkitBackdropFilter: 'blur(12px)',
                  border: '1px solid rgba(255,255,255,0.07)',
                  borderRadius: '12px',
                  padding: '1.25rem',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '0.5rem',
                  position: 'relative',
                  overflow: 'hidden',
                  transition: 'border-color 0.25s ease, box-shadow 0.25s ease'
                }}>
                  {/* Match score badge */}
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '0.5rem', flexWrap: 'wrap' }}>
                    <span style={{
                      fontSize: '0.7rem', fontWeight: 800,
                      background: item.matchScore >= 70 ? 'rgba(52,211,153,0.15)' : 'rgba(235,176,91,0.15)',
                      border: `1px solid ${item.matchScore >= 70 ? 'rgba(52,211,153,0.35)' : 'rgba(235,176,91,0.35)'}`,
                      color: item.matchScore >= 70 ? '#34d399' : '#ebb05b',
                      borderRadius: '4px', padding: '0.15rem 0.5rem',
                      letterSpacing: '0.05em', textTransform: 'uppercase'
                    }}>
                      {item.matchScore}% fit
                    </span>
                    {item.closeDate && (
                      <span style={{ fontSize: '0.72rem', color: 'rgba(255,107,122,0.9)', fontWeight: 700 }}>
                        Closes {item.closeDate}
                      </span>
                    )}
                  </div>

                  <div style={{ fontFamily: 'Space Grotesk, sans-serif', fontWeight: 700, fontSize: '0.95rem', color: '#f1f5f9', lineHeight: 1.3 }}>
                    {item.title}
                  </div>

                  <div style={{ fontSize: '0.8rem', color: 'rgba(255,255,255,0.5)', display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                    <span className="material-symbols-outlined" style={{ fontSize: '0.9rem' }}>account_balance</span>
                    {item.provider}
                  </div>

                  {item.amount && (
                    <div style={{ fontSize: '0.88rem', fontWeight: 700, color: '#ebb05b' }}>{item.amount}</div>
                  )}

                  {/* Match reasons */}
                  <div style={{ display: 'flex', gap: '0.35rem', flexWrap: 'wrap', marginTop: '0.25rem' }}>
                    {item.matchReasons.slice(0, 3).map(r => (
                      <span key={r} style={{
                        fontSize: '0.67rem', padding: '0.1rem 0.4rem',
                        background: 'rgba(255,255,255,0.04)',
                        border: '1px solid rgba(255,255,255,0.08)',
                        borderRadius: '4px', color: 'rgba(255,255,255,0.55)'
                      }}>{r}</span>
                    ))}
                  </div>

                  {/* Build Proposal CTA */}
                  <button
                    className="btn-build-proposal"
                    style={{ marginTop: '0.75rem', fontSize: '0.85rem', padding: '0.75rem 1rem', minHeight: '44px' }}
                    onClick={() => {
                      setSelectedFundingSource(item);
                      setPreloadedAssistantBudget(item.amount);
                      setActiveTab('grant-assistant');
                    }}
                  >
                    <span style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                      <span className="material-symbols-outlined" style={{ fontSize: '1rem' }}>edit_note</span>
                      Build Proposal
                    </span>
                    <span style={{ display: 'flex', alignItems: 'center', gap: '0.2rem', fontSize: '0.73rem', opacity: 0.8 }}>
                      Open Assistant <span className="material-symbols-outlined" style={{ fontSize: '0.9rem' }}>arrow_forward</span>
                    </span>
                  </button>
                </div>
              ))}
            </div>
          )}
        </section>
      )}

      {activeTab === 'grant-assistant' && (
        <section className="artist-account-card" style={{ padding: '1.75rem 2rem' }}>
          <div style={{ marginBottom: '1.5rem' }}>
            <h2 style={{ margin: 0, fontFamily: 'Space Grotesk' }}>Grant Application Assistant</h2>
            <p style={{ color: 'var(--text-secondary, rgba(255,255,255,0.5))', fontSize: '0.88rem', marginTop: '0.2rem' }}>
              Outline proposal timelines, construct draft budgets, and evaluate requirements checklists.
            </p>
          </div>
          <GrantApplicationAssistant
            key={`gaa_${selectedFundingSource?.id || 'default'}`}
            preloadedBudget={preloadedAssistantBudget}
            selectedFundingSource={selectedFundingSource}
            onClearFundingSource={() => { setSelectedFundingSource(null); setPreloadedAssistantBudget(null); }}
            projects={allProjects}
            fundingSources={allFundingSources}
            mapFocusItemId={mapFocusItemId}
            onClearMapFocus={() => setMapFocusItemId(null)}
            onApplyFunding={(sourceOrBudget) => {
              if (sourceOrBudget && typeof sourceOrBudget === 'object') {
                setSelectedFundingSource(sourceOrBudget);
                setPreloadedAssistantBudget(sourceOrBudget.amount);
              } else {
                setPreloadedAssistantBudget(sourceOrBudget);
              }
            }}
          />
        </section>
      )}

      {activeTab === 'map' && (
        <section className="artist-account-card" style={{ padding: '1.75rem 2rem', background: 'transparent', border: 'none', boxShadow: 'none' }}>
          <div style={{ marginBottom: '1.5rem' }}>
            <h2 style={{ margin: 0, fontFamily: 'Space Grotesk', color: '#fff' }}>Opportunities Map</h2>
            <p style={{ color: 'var(--text-secondary, rgba(255,255,255,0.5))', fontSize: '0.88rem', marginTop: '0.2rem' }}>
              Explore Colorado public art projects, funding opportunities, and local fabrication resources.
            </p>
          </div>
          <ProjectMap
            projects={allProjects}
            fundingSources={allFundingSources}
            onApplyFunding={(source) => {
              setSelectedFundingSource(source);
              setPreloadedAssistantBudget(source.amount);
              setActiveTab('grant-assistant');
            }}
            mapFocusItemId={mapFocusItemId}
            onClearMapFocus={() => setMapFocusItemId(null)}
          />
        </section>
      )}

      <ArtistAccountStyles />
    </div>
  );
}

function artistToDraft(artist) {
  return {
    ...artist,
    secondaryMediums: toCsv(artist.secondaryMediums),
    artStyles: toCsv(artist.artStyles),
    themes: toCsv(artist.themes),
  };
}

function ProfileHealth({ artist }) {
  const fields = [
    ['Portfolio', artist.portfolioUrl || artist.website],
    ['Primary medium', artist.primaryMedium],
    ['Capabilities', artist.capabilitiesDescription],
    ['Availability', artist.availabilityStatus],
    ['Notable work', artist.notableProjects],
  ];
  const complete = fields.filter(([, value]) => Boolean(value)).length;
  const percent = Math.round((complete / fields.length) * 100);
  return (
    <>
      <div className="artist-health-meter"><span style={{ width: `${percent}%` }} /></div>
      <p>{percent}% complete</p>
      <ul className="artist-action-list">
        {fields.map(([label, value]) => (
          <li key={label} className={value ? 'done' : ''}>{label}</li>
        ))}
      </ul>
    </>
  );
}

function MatchGrid({ title, items, type, savedIds, onToggleSaved, onOpenAssistant }) {
  return (
    <div style={{ width: '100%' }}>
      {title && (
        <h3 style={{ fontFamily: 'Space Grotesk, sans-serif', fontSize: '1.25rem', color: '#fff', marginBottom: '1rem', fontWeight: 700 }}>
          {title}
        </h3>
      )}
      {items.length === 0 ? (
        <p className="artist-empty-state">No matching opportunities found.</p>
      ) : (
        <div className="opportunities-grid" style={{ marginBottom: '2rem' }}>
          {items.map(item => {
            const isSaved = savedIds && savedIds.includes(item.id);
            const close = item.closeDate ? new Date(item.closeDate + 'T23:59:00') : null;
            const daysLeft = close ? Math.ceil((close - new Date()) / (1000 * 60 * 60 * 24)) : null;
            const isCritical = daysLeft !== null && daysLeft > 0 && daysLeft <= 7;
            
            // Check match score coloring
            const scoreColor = item.matchScore >= 70 ? '#34d399' : '#ebb05b';
            const scoreBg = item.matchScore >= 70 ? 'rgba(52,211,153,0.1)' : 'rgba(235,176,91,0.1)';
            const scoreBorder = item.matchScore >= 70 ? 'rgba(52,211,153,0.25)' : 'rgba(235,176,91,0.25)';

            return (
              <div 
                key={item.id} 
                className={`premium-opp-card ${isCritical ? 'critical' : ''}`}
                style={type === 'client-rfqs' || item.isCommunityPost ? { borderLeft: '4px solid #a78bfa' } : {}}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '0.5rem', flexWrap: 'wrap' }}>
                  <div style={{ display: 'flex', gap: '0.4rem', flexWrap: 'wrap' }}>
                    <span 
                      className="opp-badge" 
                      style={{ 
                        background: type === 'projects' 
                          ? (item.status === 'Approved' || item.status === 'RFQ Active' ? 'rgba(52, 211, 153, 0.12)' : 'rgba(255,255,255,0.04)') 
                          : (type === 'client-rfqs' || item.isCommunityPost ? 'rgba(167, 139, 250, 0.1)' : 'rgba(224, 90, 71, 0.1)'),
                        borderColor: type === 'projects'
                          ? (item.status === 'Approved' || item.status === 'RFQ Active' ? 'rgba(52, 211, 153, 0.3)' : 'rgba(255,255,255,0.1)')
                          : (type === 'client-rfqs' || item.isCommunityPost ? 'rgba(167, 139, 250, 0.25)' : 'rgba(224, 90, 71, 0.25)'),
                        color: type === 'projects'
                          ? (item.status === 'Approved' || item.status === 'RFQ Active' ? '#34d399' : 'rgba(255,255,255,0.6)')
                          : (type === 'client-rfqs' || item.isCommunityPost ? '#a78bfa' : 'var(--accent-terracotta)')
                      }}
                    >
                      {type === 'projects' ? item.status : (type === 'client-rfqs' || item.isCommunityPost ? 'Client Post' : item.type || 'Grant')}
                    </span>
                    
                    {/* Match Score Badge */}
                    <span 
                      className="opp-badge"
                      style={{ background: scoreBg, borderColor: scoreBorder, color: scoreColor }}
                    >
                      {item.matchScore}% fit
                    </span>
                  </div>

                  {/* Bookmark Button */}
                  {onToggleSaved && (
                    <button 
                      type="button" 
                      onClick={() => onToggleSaved(type === 'client-rfqs' ? 'funding' : type, item.id)}
                      style={{
                        background: isSaved ? 'rgba(255,255,255,0.08)' : 'transparent',
                        border: '1px solid rgba(255,255,255,0.12)',
                        borderRadius: '6px',
                        color: isSaved ? '#ebb05b' : 'rgba(255,255,255,0.6)',
                        padding: '0.2rem 0.5rem',
                        fontSize: '0.72rem',
                        fontWeight: 700,
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.25rem',
                        transition: 'all 0.2s ease',
                      }}
                      onMouseEnter={e => {
                        e.currentTarget.style.color = '#ebb05b';
                        e.currentTarget.style.borderColor = 'rgba(235,176,91,0.4)';
                      }}
                      onMouseLeave={e => {
                        if (!isSaved) {
                          e.currentTarget.style.color = 'rgba(255,255,255,0.6)';
                          e.currentTarget.style.borderColor = 'rgba(255,255,255,0.12)';
                        }
                      }}
                    >
                      <span className="material-symbols-outlined" style={{ fontSize: '0.85rem' }}>{isSaved ? 'bookmark' : 'bookmark_add'}</span>
                      {isSaved ? 'Saved' : 'Save'}
                    </button>
                  )}
                </div>

                <h3 style={{ margin: '0.25rem 0 0', fontSize: '1.15rem', color: 'var(--text-primary)', fontFamily: 'Space Grotesk', fontWeight: 700, lineHeight: 1.3 }}>
                  {item.title || item.name}
                </h3>
                
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                  <span className="material-symbols-outlined" style={{ fontSize: '0.95rem' }}>
                    {type === 'client-rfqs' || item.isCommunityPost ? 'corporate_fare' : 'account_balance'}
                  </span>
                  <span style={{ textOverflow: 'ellipsis', overflow: 'hidden', whiteSpace: 'nowrap' }}>{item.provider}</span>
                  {(type === 'client-rfqs' || item.isCommunityPost) && item.city && (
                    <span style={{ color: 'rgba(255,255,255,0.4)', marginLeft: 'auto' }}>📍 {item.city}</span>
                  )}
                </div>

                <p style={{ margin: '0.25rem 0 auto', fontSize: '0.85rem', color: 'var(--text-secondary)', lineHeight: '1.45' }}>
                  {item.description}
                </p>

                {/* Tag row for scale or other attributes */}
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.35rem', marginTop: '0.2rem' }}>
                  {item.scale && <span className="opp-tag-pill">📐 {item.scale} Scale</span>}
                  {item.mediums && item.mediums.map(med => <span key={med} className="opp-tag-pill">{med}</span>)}
                  {item.matchReasons && item.matchReasons.map(reason => (
                    <span key={reason} className="opp-tag-pill reason">{reason}</span>
                  ))}
                </div>

                <div className="opp-budget-tag" style={{ marginTop: '0.5rem' }}>
                  <span className="material-symbols-outlined" style={{ fontSize: '0.95rem' }}>payments</span>
                  {item.amount || item.budget || 'Budget varies'}
                </div>

                {/* Bottom section with action buttons */}
                <div style={{ borderTop: '1px solid rgba(255,255,255,0.05)', paddingTop: '0.75rem', marginTop: '0.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.5rem' }}>
                  <span style={{ fontSize: '0.72rem', color: 'rgba(255,255,255,0.3)', textTransform: 'uppercase' }}>
                    {daysLeft !== null && daysLeft > 0 ? (
                      <span style={{ color: isCritical ? '#ff6b7a' : '#34d399', fontWeight: 700 }}>
                        {daysLeft === 1 ? 'Closes in 1 day' : `Closes in ${daysLeft} days`}
                      </span>
                    ) : item.closeDate ? (
                      <span style={{ color: '#ff6b7a', fontWeight: 700 }}>Closed</span>
                    ) : item.status ? (
                      item.status
                    ) : (
                      'Rolling'
                    )}
                  </span>

                  <div style={{ display: 'flex', gap: '0.5rem' }}>
                    {(type === 'client-rfqs' || item.isCommunityPost) && item.contactEmail && (
                      <a 
                        href={`mailto:${item.contactEmail}`} 
                        style={{ 
                          fontSize: '0.8rem', 
                          color: '#fff', 
                          textDecoration: 'none', 
                          display: 'flex', 
                          alignItems: 'center', 
                          gap: '0.2rem',
                          fontWeight: 700,
                          background: 'rgba(230,92,70,0.08)',
                          border: '1px solid rgba(230,92,70,0.15)',
                          padding: '0.25rem 0.55rem',
                          borderRadius: '6px'
                        }}
                      >
                        <span className="material-symbols-outlined" style={{ fontSize: '0.85rem' }}>mail</span>
                        Contact
                      </a>
                    )}

                    {item.url && (
                      <a 
                        href={item.url.startsWith('http') ? item.url : `https://${item.url}`} 
                        target="_blank" 
                        rel="noopener noreferrer" 
                        style={{ 
                          fontSize: '0.8rem', 
                          color: 'var(--accent-electric)', 
                          textDecoration: 'none', 
                          display: 'flex', 
                          alignItems: 'center', 
                          gap: '0.2rem',
                          fontWeight: 700,
                          background: 'rgba(74, 131, 237, 0.06)',
                          border: '1px solid rgba(74, 131, 237, 0.15)',
                          padding: '0.25rem 0.55rem',
                          borderRadius: '6px'
                        }}
                      >
                        View <span className="material-symbols-outlined" style={{ fontSize: '0.85rem' }}>open_in_new</span>
                      </a>
                    )}

                    {type === 'funding' && onOpenAssistant && (
                      <button
                        type="button"
                        style={{ 
                          fontSize: '0.8rem', 
                          color: '#fff', 
                          textDecoration: 'none', 
                          display: 'flex', 
                          alignItems: 'center', 
                          gap: '0.2rem',
                          fontWeight: 700,
                          background: 'var(--accent-terracotta)',
                          border: 'none',
                          padding: '0.25rem 0.55rem',
                          borderRadius: '6px',
                          cursor: 'pointer'
                        }}
                        onClick={() => onOpenAssistant(item)}
                      >
                        <span className="material-symbols-outlined" style={{ fontSize: '0.85rem' }}>edit_note</span>
                        Draft
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

function ArtistAccountStyles() {
  return (
    <style>{`
      .artist-account-shell {
        min-height: 100vh;
        background:
          radial-gradient(circle at top left, rgba(224,90,71,0.16), transparent 30rem),
          radial-gradient(circle at top right, rgba(74,131,237,0.12), transparent 28rem),
          var(--bg-dark);
        color: var(--text-primary);
        padding: clamp(1rem, 3vw, 2rem);
      }

      .spinning {
        display: inline-block;
        animation: spin 1s linear infinite;
      }
      @keyframes spin {
        from { transform: rotate(0deg); }
        to { transform: rotate(360deg); }
      }

      .artist-account-header,
      .artist-dashboard-header,
      .artist-dashboard-tabs,
      .artist-dashboard-grid,
      .artist-profile-editor,
      .artist-account-card,
      .artist-portal-grid,
      .artist-account-benefits,
      .artist-saved-sections {
        width: min(1180px, 100%);
        margin-inline: auto;
      }

      .artist-account-header {
        text-align: center;
        padding: clamp(2rem, 5vw, 4.5rem) 0 2rem;
      }

      .artist-account-header h1 {
        font-family: 'Space Grotesk', sans-serif;
        font-size: clamp(2.2rem, 5.5vw, 3.8rem);
        letter-spacing: -0.01em;
        line-height: 1.05;
        margin: 0.5rem 0 1rem 0;
      }

      .artist-account-desc {
        max-width: 780px;
        margin-inline: auto;
        font-size: 1.08rem;
        color: var(--text-secondary);
        line-height: 1.6;
      }

      .artist-portal-grid {
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(360px, 1fr));
        gap: 1.75rem;
        margin-bottom: 3.5rem;
      }

      .artist-portal-card {
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

      .artist-portal-card::before {
        content: '';
        position: absolute;
        top: 0;
        left: 0;
        right: 0;
        height: 4px;
        opacity: 0.85;
      }

      .artist-portal-card.create-card::before {
        background: linear-gradient(90deg, var(--accent-terracotta), rgba(224,90,71,0.25));
      }

      .artist-portal-card.login-card::before {
        background: linear-gradient(90deg, var(--accent-electric), rgba(74,131,237,0.25));
      }

      .artist-portal-card:hover {
        transform: translateY(-4px);
        background: rgba(255, 255, 255, 0.045);
      }

      .artist-portal-card.create-card:hover {
        border-color: rgba(224, 90, 71, 0.3);
        box-shadow: 0 20px 40px rgba(224, 90, 71, 0.08), 0 20px 45px rgba(0,0,0,0.3);
      }

      .artist-portal-card.login-card:hover {
        border-color: rgba(74, 131, 237, 0.3);
        box-shadow: 0 20px 40px rgba(74, 131, 237, 0.08), 0 20px 45px rgba(0,0,0,0.3);
      }

      .card-icon-wrapper {
        width: 52px;
        height: 52px;
        border-radius: 12px;
        display: flex;
        align-items: center;
        justify-content: center;
        margin-bottom: 1.5rem;
      }

      .create-card .card-icon-wrapper {
        background: rgba(224, 90, 71, 0.1);
        border: 1px solid rgba(224, 90, 71, 0.2);
      }
      .create-card .card-icon-wrapper .material-symbols-outlined {
        color: var(--accent-terracotta);
        font-size: 1.6rem;
      }

      .login-card .card-icon-wrapper {
        background: rgba(74, 131, 237, 0.1);
        border: 1px solid rgba(74, 131, 237, 0.2);
      }
      .login-card .card-icon-wrapper .material-symbols-outlined {
        color: var(--accent-electric);
        font-size: 1.6rem;
      }

      .artist-portal-card h2 {
        font-family: 'Space Grotesk', sans-serif;
        font-size: 1.5rem;
        font-weight: 700;
        color: #fff;
        margin: 0 0 0.75rem 0;
        letter-spacing: -0.01em;
      }

      .artist-portal-card p {
        font-size: 0.95rem;
        line-height: 1.6;
        color: var(--text-secondary);
        margin: 0 0 2rem 0;
      }

      .artist-portal-card .artist-account-primary {
        margin-top: auto;
        width: 100%;
        display: flex;
        justify-content: center;
        align-items: center;
        gap: 0.5rem;
        min-height: 48px;
        border-radius: 10px;
        font-size: 0.95rem;
        font-weight: 700;
        transition: background-color 0.2s, transform 0.1s;
      }

      .artist-portal-card .artist-account-primary.create-button {
        background: var(--accent-terracotta);
        border: 1px solid rgba(255, 255, 255, 0.1);
        color: #fff;
      }

      .artist-portal-card .artist-account-primary.create-button:hover {
        background: #e66b59;
        transform: translateY(-1px);
      }

      .artist-portal-card .artist-account-primary.login-button {
        background: var(--accent-electric);
        border: 1px solid rgba(255, 255, 255, 0.1);
        color: #fff;
      }

      .artist-portal-card .artist-account-primary.login-button:hover {
        background: #5a93f5;
        transform: translateY(-1px);
      }

      .artist-account-eyebrow {
        color: var(--accent-terracotta);
        font-family: 'Space Grotesk', sans-serif;
        font-size: 0.75rem;
        font-weight: 800;
        letter-spacing: 0.18em;
        margin: 0 0 0.75rem;
        text-transform: uppercase;
      }

      .artist-dashboard-header h1 {
        font-family: 'Space Grotesk', sans-serif;
        font-size: clamp(2.5rem, 7vw, 5.4rem);
        letter-spacing: 0;
        line-height: 0.95;
        margin: 0;
      }

      .artist-dashboard-header p,
      .artist-account-card p,
      .artist-match-card p,
      .artist-profile-editor p {
        color: var(--text-secondary);
        line-height: 1.6;
      }

      .artist-account-card,
      .artist-profile-editor,
      .artist-account-benefits article,
      .artist-match-card {
        background: rgba(255,255,255,0.045);
        border: 1px solid rgba(255,255,255,0.1);
        border-radius: 8px;
        box-shadow: 0 18px 55px rgba(0,0,0,0.22);
      }

      .artist-profile-editor,
      .artist-account-card {
        padding: 1.25rem;
      }

      .artist-dashboard-tabs {
        display: flex;
        gap: 0.55rem;
        flex-wrap: wrap;
      }

      .artist-dashboard-tabs button,
      .artist-match-topline button {
        border-radius: 8px;
        cursor: pointer;
        font-family: 'Space Grotesk', sans-serif;
        font-weight: 700;
        min-height: 42px;
      }

      .artist-dashboard-tabs button {
        background: transparent;
        border: 1px solid transparent;
        color: var(--text-secondary);
        flex: 1;
        padding: 0 0.9rem;
      }

      .artist-account-toggle button.active,
      .artist-dashboard-tabs button.active,
      .artist-account-toggle button:hover,
      .artist-dashboard-tabs button:hover {
        background: rgba(255,255,255,0.08);
        border-color: rgba(255,255,255,0.14);
        color: #fff;
      }

      .artist-account-form,
      .artist-account-create {
        display: grid;
        gap: 0.9rem;
        margin-top: 1rem;
      }

      .artist-account-create {
        text-align: center;
        padding: 1rem 0.5rem 0.5rem;
      }

      .artist-account-create > .material-symbols-outlined {
        color: var(--accent-terracotta);
        font-size: 2.4rem;
      }

      .artist-account-form label,
      .artist-profile-editor label {
        color: rgba(255,255,255,0.55);
        display: grid;
        font-family: 'Space Grotesk', sans-serif;
        font-size: 0.75rem;
        font-weight: 800;
        gap: 0.4rem;
        letter-spacing: 0.08em;
        text-transform: uppercase;
      }

      .artist-account-form input,
      .artist-profile-editor input,
      .artist-profile-editor select,
      .artist-profile-editor textarea {
        background: rgba(0,0,0,0.36);
        border: 1px solid rgba(255,255,255,0.14);
        border-radius: 8px;
        color: #fff;
        font: 500 0.95rem 'Outfit', sans-serif;
        min-height: 44px;
        outline: none;
        padding: 0 0.85rem;
      }

      .artist-profile-editor textarea {
        min-height: 104px;
        padding: 0.8rem 0.85rem;
        resize: vertical;
      }

      .artist-account-primary {
        align-items: center;
        background: #f2f2f2;
        border: 1px solid rgba(255,255,255,0.5);
        color: #09090b;
        display: inline-flex;
        gap: 0.5rem;
        justify-content: center;
        padding: 0 1rem;
      }

      .artist-account-message {
        border-radius: 8px;
        font-size: 0.9rem;
        margin: 0;
        padding: 0.75rem;
      }

      .artist-account-message.error {
        background: rgba(255,84,105,0.12);
        color: #ff8b99;
      }

      .artist-account-message.success {
        background: rgba(70,217,139,0.12);
        color: #7ee5aa;
      }

      .artist-account-benefits {
        display: grid;
        grid-template-columns: repeat(3, minmax(0, 1fr));
        gap: 1rem;
      }

      .artist-account-benefits article {
        padding: 1.25rem;
      }

      .artist-account-benefits .material-symbols-outlined,
      .artist-account-card .material-symbols-outlined {
        color: var(--accent-terracotta);
      }

      .artist-dashboard-header {
        align-items: end;
        display: flex;
        justify-content: space-between;
        gap: 1rem;
        padding: 2rem 0 1rem;
      }

      .artist-dashboard-header h1 {
        font-size: clamp(2rem, 5vw, 4rem);
      }

      .artist-dashboard-actions {
        align-items: center;
        display: flex;
        gap: 0.75rem;
      }

      .artist-dashboard-actions span {
        background: rgba(255,255,255,0.08);
        border: 1px solid rgba(255,255,255,0.12);
        border-radius: 8px;
        color: #fff;
        font-family: 'Space Grotesk', sans-serif;
        font-weight: 800;
        padding: 0.75rem;
      }

      .artist-dashboard-actions button {
        background: transparent;
        border: 1px solid rgba(255,255,255,0.14);
        color: #fff;
        padding: 0 1rem;
      }

      .artist-dashboard-tabs {
        border-bottom: 1px solid rgba(255,255,255,0.08);
        padding-bottom: 1rem;
      }

      .artist-dashboard-tabs button {
        align-items: center;
        display: inline-flex;
        gap: 0.45rem;
        flex: none;
      }

      .artist-dashboard-grid {
        display: grid;
        grid-template-columns: repeat(3, minmax(0, 1fr));
        gap: 1rem;
        padding-top: 1rem;
      }

      .artist-account-card.span-2 {
        grid-column: span 2;
      }

      .artist-account-card h2,
      .artist-profile-editor h2,
      .artist-match-card h3,
      .artist-account-benefits h2 {
        font-family: 'Space Grotesk', sans-serif;
        letter-spacing: 0;
        margin: 0;
      }

      .artist-match-summary {
        display: grid;
        grid-template-columns: repeat(3, minmax(0, 1fr));
        gap: 0.75rem;
        margin-top: 1rem;
      }

      .artist-match-summary div {
        background: rgba(0,0,0,0.24);
        border: 1px solid rgba(255,255,255,0.08);
        border-radius: 8px;
        padding: 1rem;
      }

      .artist-match-summary strong {
        display: block;
        font-family: 'Space Grotesk', sans-serif;
        font-size: 2rem;
      }

      .artist-match-summary span {
        color: var(--text-secondary);
      }

      .artist-action-list {
        color: var(--text-secondary);
        display: grid;
        gap: 0.55rem;
        line-height: 1.5;
        margin: 1rem 0 0;
        padding-left: 1.1rem;
      }

      .artist-action-list .done {
        color: #7ee5aa;
      }

      .artist-health-meter {
        background: rgba(255,255,255,0.08);
        border-radius: 999px;
        height: 10px;
        margin-top: 1rem;
        overflow: hidden;
      }

      .artist-health-meter span {
        background: linear-gradient(90deg, var(--accent-terracotta), var(--accent-electric));
        display: block;
        height: 100%;
      }

      .artist-profile-editor {
        margin-top: 1rem;
      }

      .artist-editor-heading {
        align-items: center;
        display: flex;
        justify-content: space-between;
        gap: 1rem;
        margin-bottom: 1rem;
      }

      .artist-editor-grid,
      .artist-textarea-grid,
      .artist-match-grid {
        display: grid;
        gap: 0.85rem;
      }

      .artist-editor-grid {
        grid-template-columns: repeat(3, minmax(0, 1fr));
      }

      .artist-textarea-grid {
        grid-template-columns: repeat(2, minmax(0, 1fr));
        margin-top: 0.85rem;
      }

      .artist-match-grid {
        grid-template-columns: repeat(2, minmax(0, 1fr));
        margin-top: 1rem;
      }

      .artist-match-card {
        padding: 1rem;
      }

      .artist-match-topline,
      .artist-match-meta,
      .artist-reason-row {
        align-items: center;
        display: flex;
        flex-wrap: wrap;
        gap: 0.5rem;
        justify-content: space-between;
      }

      .artist-match-topline > span {
        color: #7ee5aa;
        font-family: 'Space Grotesk', sans-serif;
        font-weight: 900;
      }

      .artist-match-topline button {
        align-items: center;
        background: rgba(255,255,255,0.06);
        border: 1px solid rgba(255,255,255,0.12);
        color: #fff;
        display: inline-flex;
        gap: 0.35rem;
        padding: 0 0.75rem;
      }

      .artist-match-card h3 {
        font-size: 1.15rem;
        margin-top: 0.8rem;
      }

      .artist-match-meta {
        border-top: 1px solid rgba(255,255,255,0.08);
        color: var(--text-secondary);
        font-size: 0.85rem;
        margin-top: 1rem;
        padding-top: 0.85rem;
      }

      .artist-reason-row {
        justify-content: flex-start;
        margin-top: 0.75rem;
      }

      .artist-reason-row span {
        background: rgba(224,90,71,0.12);
        border: 1px solid rgba(224,90,71,0.24);
        border-radius: 999px;
        color: #f0956a;
        font-size: 0.78rem;
        padding: 0.25rem 0.55rem;
      }

      .artist-link-button {
        align-items: center;
        color: var(--accent-electric);
        display: inline-flex;
        font-weight: 800;
        gap: 0.35rem;
        margin-top: 1rem;
        text-decoration: none;
      }

      .artist-empty-state {
        background: rgba(255,255,255,0.04);
        border: 1px dashed rgba(255,255,255,0.15);
        border-radius: 8px;
        padding: 1rem;
      }

      .artist-saved-sections {
        display: grid;
        gap: 1rem;
        margin-top: 1rem;
      }

      @media (max-width: 920px) {
        .artist-account-hero,
        .artist-account-benefits,
        .artist-dashboard-grid,
        .artist-editor-grid,
        .artist-textarea-grid,
        .artist-match-grid {
          grid-template-columns: 1fr;
        }

        .artist-account-card.span-2 {
          grid-column: auto;
        }

        .artist-dashboard-header,
        .artist-editor-heading {
          align-items: stretch;
          flex-direction: column;
        }
      }

      @media (max-width: 560px) {
        .artist-dashboard-actions,
        .artist-match-summary {
          grid-template-columns: 1fr;
          display: grid;
        }

        .artist-dashboard-tabs button {
          flex: 1 1 calc(50% - 0.55rem);
        }
      }
    `}</style>
  );
}
