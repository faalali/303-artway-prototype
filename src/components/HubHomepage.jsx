import { useState, useEffect } from 'react';
import { findArtistByEmailAndId, updateArtistFields, findByCredentialsUnified } from '../data/mockDatabase';
import ArtistQuestionnaire from './ArtistQuestionnaire';
import CommissionerRFQForm from './CommissionerRFQForm';
import ArtistAccountPortal from './ArtistAccountPortal';
import ClientAccountPortal from './ClientAccountPortal';

const UNIFIED_SESSION_KEY = 'ila_unified_session_v1';

const ARTIST_FEATURES = [
  { icon: 'palette', text: 'Showcase mediums, styles, and public art capabilities' },
  { icon: 'explore', text: 'Access grants, funding sources, and live calls' },
  { icon: 'notifications_active', text: 'Get matched to RFQs and commission alerts' },
  { icon: 'map', text: 'Appear on the Colorado creative opportunity map' },
];

const CLIENT_FEATURES = [
  { icon: 'brush', text: 'Find muralists, DJs, photographers, makers, and more' },
  { icon: 'manage_search', text: 'Search vetted artists by medium, style, and location' },
  { icon: 'send', text: 'Post RFQs or RFPs with budget, timeline, and scope' },
  { icon: 'electric_bolt', text: 'Notify matching Colorado artists instantly' },
];

const TRUST_ITEMS = [
  { value: 'Statewide', label: 'Colorado registry' },
  { value: 'Local-first', label: 'Artist matching' },
  { value: 'Secure', label: 'Private submissions' },
];

const ABOUT_CARDS = [
  {
    icon: 'museum',
    title: 'Built From ILA Gallery',
    body: 'Rooted in a contemporary art gallery based in Denver, the Hub extends local artist advocacy into a searchable creative database. We catalog and match artistic talent to public art installations, galleries, community murals, and civic projects across the Rocky Mountain region.',
  },
  {
    icon: 'hub',
    title: 'A Two-Sided Creative Hub',
    body: 'A dynamic ecosystem designed for both creators and project organizers. Artists showcase their capabilities, medium specialties, and live availability. Simultaneously, municipalities, business owners, and curators can post real opportunities, query database tags, and connect instantly.',
  },
  {
    icon: 'verified_user',
    title: 'Local-First Vetting',
    body: 'Our commitment is prioritizing Colorado-based artists to strengthen regional creative economies. Our vetting process verifies residency and local community ties first, while still hosting national specialists for major architectural scopes that require niche fabrications.',
  },
];

const PROCESS_CARDS = [
  {
    eyebrow: 'RFQ',
    title: 'Request for Qualifications',
    body: 'Best when you want to review artist fit first. Artists share bios, past work, resumes, references, and relevant experience before a full concept is requested.',
  },
  {
    eyebrow: 'RFP',
    title: 'Request for Proposals',
    body: 'Best when the project is already defined. Artists submit a concept, scope, materials, budget, and timeline for direct comparison.',
  },
];

export default function HubHomepage({ onNavigate }) {
  const [activeHomepageTab, setActiveHomepageTab] = useState(() => {
    const params = new URLSearchParams(typeof window !== 'undefined' ? window.location.search : '');
    const tabParam = params.get('tab');
    if (tabParam && ['home', 'about', 'register', 'post-project', 'self-service', 'faq'].includes(tabParam)) {
      return tabParam;
    }
    return 'home';
  });

  useEffect(() => {
    const handlePopState = () => {
      const params = new URLSearchParams(window.location.search);
      const tabParam = params.get('tab');
      if (tabParam && ['home', 'about', 'register', 'post-project', 'self-service', 'faq'].includes(tabParam)) {
        setActiveHomepageTab(tabParam);
      } else {
        setActiveHomepageTab('home');
      }
    };
    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  const [hoveredSide, setHoveredSide] = useState(null);
  const [profileEmail, setProfileEmail] = useState('');
  const [profileId, setProfileId] = useState('');
  const [editingArtist, setEditingArtist] = useState(null);
  const [searchError, setSearchError] = useState('');
  const [updateSuccess, setUpdateSuccess] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);
  const [selfServicePortal, setSelfServicePortal] = useState('artist');

  // ── Unified Login State ──────────────────────────────────────────────────
  const [uniLogin, setUniLogin] = useState('');
  const [uniPassword, setUniPassword] = useState('');
  const [uniError, setUniError] = useState('');
  const [uniLoading, setUniLoading] = useState(false);
  const [uniSession, setUniSession] = useState(() => {
    try {
      const raw = localStorage.getItem(UNIFIED_SESSION_KEY);
      return raw ? JSON.parse(raw) : null;
    } catch { return null; }
  });

  const handleUnifiedLogin = (e) => {
    e.preventDefault();
    setUniError('');
    setUniLoading(true);
    setTimeout(() => {
      const { artistProfile, clientProfile } = findByCredentialsUnified(uniLogin, uniPassword);
      if (!artistProfile && !clientProfile) {
        setUniError('No matching profile found. Check your username/email and password.');
        setUniLoading(false);
        return;
      }
      const session = {
        artistId: artistProfile?.id || null,
        clientId: clientProfile?.id || null,
        name: artistProfile?.alias || artistProfile?.firstName || clientProfile?.clientName || 'User',
        hasArtist: !!artistProfile,
        hasClient: !!clientProfile,
      };
      localStorage.setItem(UNIFIED_SESSION_KEY, JSON.stringify(session));
      setUniSession(session);
      setUniLoading(false);
      // Persist individual sessions so sub-portals are also logged in
      if (artistProfile) {
        localStorage.setItem('ila_artist_session_v1', JSON.stringify({ email: artistProfile.email, id: artistProfile.id }));
      }
      if (clientProfile) {
        localStorage.setItem('ila_client_session_v1', JSON.stringify({ email: clientProfile.email, id: clientProfile.id }));
      }
    }, 300);
  };

  const handleUnifiedLogout = () => {
    localStorage.removeItem(UNIFIED_SESSION_KEY);
    localStorage.removeItem('ila_artist_session_v1');
    localStorage.removeItem('ila_client_session_v1');
    setUniSession(null);
    setUniLogin('');
    setUniPassword('');
  };

  const handleCopyLink = () => {
    const url = typeof window !== 'undefined' ? (window.location.origin + '/?tab=register') : 'https://ila-gallery-database.web.app/?tab=register';
    navigator.clipboard.writeText(url);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2000);
  };

  const [updateFields, setUpdateFields] = useState({
    availabilityStatus: 'Available',
    portfolioUrl: '',
  });

  const handleProfileLookup = (event) => {
    event.preventDefault();
    setSearchError('');
    setUpdateSuccess(false);
    setEditingArtist(null);

    const artist = findArtistByEmailAndId(profileEmail, profileId);
    if (!artist) {
      setSearchError('No profile matches that email and registration ID.');
      return;
    }

    setEditingArtist(artist);
    setUpdateFields({
      availabilityStatus: artist.availabilityStatus || 'Available',
      portfolioUrl: artist.portfolioUrl || '',
    });
  };

  const handleProfileUpdate = (event) => {
    event.preventDefault();
    setSearchError('');
    setUpdateSuccess(false);

    const result = updateArtistFields(profileId, updateFields);
    if (!result.success) {
      setSearchError(result.error || 'Failed to update profile.');
      return;
    }

    setUpdateSuccess(true);
    setEditingArtist(result.artist);
  };

  const navigateToTab = (tab) => {
    setActiveHomepageTab(tab);
    window.scrollTo({ top: 0, behavior: 'instant' });
    const url = new URL(window.location.href);
    if (tab === 'home') {
      url.searchParams.delete('tab');
    } else {
      url.searchParams.set('tab', tab);
    }
    window.history.replaceState(null, '', url.toString());
  };

  return (
    <div className="hub-shell">
      <header className="hub-nav">
        <button className="hub-brand" type="button" onClick={() => navigateToTab('home')}>
          <span className="hub-brand-mark">ILA<span>GALLERY</span></span>
          <span className="hub-brand-meta" style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem' }}>
            Creative Hub
            <span style={{
              background: 'rgba(224, 90, 71, 0.12)',
              border: '1px solid rgba(224, 90, 71, 0.35)',
              color: 'var(--accent-terracotta)',
              fontSize: '0.62rem',
              fontWeight: 800,
              textTransform: 'uppercase',
              padding: '0.1rem 0.35rem',
              borderRadius: '4px',
              letterSpacing: '0.05em',
              lineHeight: '1',
              verticalAlign: 'middle'
            }}>Beta</span>
          </span>
        </button>

        <nav className="hub-nav-actions" aria-label="Homepage sections">
          <button
            className={activeHomepageTab === 'home' ? 'hub-nav-pill active' : 'hub-nav-pill'}
            type="button"
            onClick={() => navigateToTab('home')}
          >
            Home
          </button>
          <button
            className={activeHomepageTab === 'about' ? 'hub-nav-pill active' : 'hub-nav-pill'}
            type="button"
            onClick={() => navigateToTab('about')}
          >
            About
          </button>
          <button
            className={activeHomepageTab === 'self-service' ? 'hub-nav-pill active' : 'hub-nav-pill'}
            type="button"
            onClick={() => navigateToTab('self-service')}
          >
            Manage Profile
          </button>
          <button
            className={activeHomepageTab === 'faq' ? 'hub-nav-pill active' : 'hub-nav-pill'}
            type="button"
            onClick={() => navigateToTab('faq')}
          >
            FAQ
          </button>
          <span className="hub-live-badge">
            <span />
            Live Registry
          </span>
        </nav>
      </header>
 
      {activeHomepageTab === 'home' && (
        <section className="hub-hero" style={{
          position: 'relative',
          borderRadius: '24px',
          overflow: 'hidden',
          background: '#000',
          border: '1px solid rgba(255, 255, 255, 0.1)',
          boxShadow: '0 25px 50px -12px rgba(0,0,0,0.5)'
        }}>
          {/* Background Video */}
          <video
            src="/ila_database_video.mov"
            autoPlay
            loop
            muted
            playsInline
            style={{
              position: 'absolute',
              top: 0,
              left: 0,
              width: '100%',
              height: '100%',
              objectFit: 'cover',
              opacity: 0.5
            }}
          />
          
          {/* Overlay Gradient */}
          <div style={{
            position: 'absolute',
            top: 0,
            left: 0,
            width: '100%',
            height: '100%',
            background: 'radial-gradient(circle at center, rgba(9, 9, 11, 0.2) 0%, rgba(9, 9, 11, 0.85) 100%)',
            zIndex: 1
          }} />

          <div className="hub-hero-copy" style={{ position: 'relative', zIndex: 2 }}>
            <p className="hub-eyebrow" style={{ textShadow: '0 2px 8px rgba(0,0,0,0.5)' }}>Colorado statewide creative registry</p>
            <h1 style={{ textShadow: '0 2px 12px rgba(0,0,0,0.6)' }}>Where Creative Talent Meets Creative Opportunity.</h1>
            <p className="hub-lede" style={{ color: 'rgba(255,255,255,0.85)', textShadow: '0 2px 8px rgba(0,0,0,0.5)' }}>
              ILA Gallery Creative Hub helps Colorado creatives get discovered and gives clients a cleaner path to post public art, event, and commission opportunities.
            </p>
          </div>
   
          <aside className="hub-hero-panel" aria-label="Hub highlights" style={{ position: 'relative', zIndex: 2 }}>
            {TRUST_ITEMS.map((item, idx) => {
              const classes = ['hub-stat', idx === 0 ? 'state' : idx === 1 ? 'local' : 'secure'].join(' ');
              return (
                <div className={classes} key={item.label}>
                  <strong style={{ textShadow: '0 2px 8px rgba(0,0,0,0.5)' }}>{item.value}</strong>
                  <span style={{ textShadow: '0 2px 6px rgba(0,0,0,0.5)' }}>{item.label}</span>
                </div>
              );
            })}
          </aside>
        </section>
      )}

      <main className="hub-content" style={{ padding: activeHomepageTab === 'home' ? '0 0 3rem' : '2rem 0 3rem' }}>
        {activeHomepageTab === 'home' ? (
          <div style={{ marginTop: '1rem', display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>

            {/* TOP ROW — 2 primary action cards */}
            <div className="hub-primary-grid">

              {/* Artist Registry (Terracotta) */}
              <article className="hub-dashboard-card artist" style={{
                background: 'linear-gradient(135deg, rgba(224,90,71,0.14), rgba(255,255,255,0.02))',
                border: '1px solid rgba(224,90,71,0.4)',
                borderRadius: '16px',
                padding: '2rem',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between',
                minHeight: '280px',
                boxShadow: '0 20px 40px rgba(224,90,71,0.08)',
                transition: 'transform 0.2s ease, border-color 0.2s ease'
              }}>
                <div>
                  <span className="material-symbols-outlined" style={{ fontSize: '2.5rem', color: '#e05a47' }}>palette</span>
                  <h2 style={{ fontFamily: 'Space Grotesk', fontSize: '1.6rem', marginTop: '1rem', color: '#fff' }}>Artist Registry</h2>
                  <p style={{ color: 'rgba(255,255,255,0.6)', marginTop: '0.5rem', fontSize: '0.95rem', lineHeight: '1.5' }}>
                    Join the public opportunity registry. Submit your capabilities, website link, and resume to match with upcoming public opportunities across Colorado.
                  </p>
                </div>
                <button className="hub-primary-action" type="button" style={{ marginTop: '1.5rem', width: '100%', background: '#e05a47', borderColor: '#e05a47', color: '#fff', minHeight: '44px' }} onClick={() => navigateToTab('register')}>
                  Join Registry
                </button>
              </article>

              {/* Art in Need (Electric Blue) */}
              <article className="hub-dashboard-card client" style={{
                background: 'linear-gradient(135deg, rgba(0,180,216,0.14), rgba(255,255,255,0.02))',
                border: '1px solid rgba(0,180,216,0.4)',
                borderRadius: '16px',
                padding: '2rem',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between',
                minHeight: '280px',
                boxShadow: '0 20px 40px rgba(0,180,216,0.08)',
                transition: 'transform 0.2s ease, border-color 0.2s ease'
              }}>
                <div>
                  <span className="material-symbols-outlined" style={{ fontSize: '2.5rem', color: '#00b4d8' }}>campaign</span>
                  <h2 style={{ fontFamily: 'Space Grotesk', fontSize: '1.6rem', marginTop: '1rem', color: '#fff' }}>Art in Need</h2>
                  <p style={{ color: 'rgba(255,255,255,0.6)', marginTop: '0.5rem', fontSize: '0.95rem', lineHeight: '1.5' }}>
                    Commission murals, installations, or designs. Post your specifications and budget to connect with vetted local creators.
                  </p>
                </div>
                <button className="hub-primary-action" type="button" style={{ marginTop: '1.5rem', width: '100%', background: '#00b4d8', borderColor: '#00b4d8', color: '#fff', minHeight: '44px' }} onClick={() => navigateToTab('post-project')}>
                  Post a Project
                </button>
              </article>

            </div>

            {/* BOTTOM ROW — 3 secondary cards */}
            <div className="hub-secondary-grid">

              {/* About the Hub */}
              <article className="hub-dashboard-card neutral" style={{
                background: 'linear-gradient(135deg, rgba(255,255,255,0.04), rgba(255,255,255,0.01))',
                border: '1px solid rgba(255,255,255,0.1)',
                borderRadius: '16px',
                padding: '2rem',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between',
                minHeight: '240px',
                boxShadow: '0 20px 40px rgba(0,0,0,0.3)',
                transition: 'transform 0.2s ease, border-color 0.2s ease'
              }}>
                <div>
                  <span className="material-symbols-outlined" style={{ fontSize: '2.2rem', color: 'rgba(255,255,255,0.7)' }}>museum</span>
                  <h2 style={{ fontFamily: 'Space Grotesk', fontSize: '1.3rem', marginTop: '0.85rem', color: '#fff' }}>About the Hub</h2>
                  <p style={{ color: 'rgba(255,255,255,0.6)', marginTop: '0.4rem', fontSize: '0.9rem', lineHeight: '1.5' }}>
                    A public art registry built by ILA Gallery, extending advocacy for Colorado creators and cultural projects.
                  </p>
                </div>
                <button className="hub-secondary-action" type="button" style={{ marginTop: '1.25rem', width: '100%', minHeight: '40px' }} onClick={() => navigateToTab('about')}>
                  Read About Us
                </button>
              </article>

              {/* Manage Profile (Terracotta muted) */}
              <article className="hub-dashboard-card artist" style={{
                background: 'linear-gradient(135deg, rgba(224,90,71,0.07), rgba(255,255,255,0.01))',
                border: '1px solid rgba(224,90,71,0.2)',
                borderRadius: '16px',
                padding: '2rem',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between',
                minHeight: '240px',
                boxShadow: '0 20px 40px rgba(0,0,0,0.2)',
                transition: 'transform 0.2s ease, border-color 0.2s ease'
              }}>
                <div>
                  <span className="material-symbols-outlined" style={{ fontSize: '2.2rem', color: '#e05a47' }}>manage_accounts</span>
                  <h2 style={{ fontFamily: 'Space Grotesk', fontSize: '1.3rem', marginTop: '0.85rem', color: '#fff' }}>Manage Profile</h2>
                  <p style={{ color: 'rgba(255,255,255,0.6)', marginTop: '0.4rem', fontSize: '0.9rem', lineHeight: '1.5' }}>
                    Update availability status and portfolio links without waiting on an admin.
                  </p>
                </div>
                <button className="hub-secondary-action" type="button" style={{ marginTop: '1.25rem', width: '100%', minHeight: '40px' }} onClick={() => navigateToTab('self-service')}>
                  Edit Profile
                </button>
              </article>

              {/* Rules & FAQs (Electric Blue muted) */}
              <article className="hub-dashboard-card client" style={{
                background: 'linear-gradient(135deg, rgba(0,180,216,0.07), rgba(255,255,255,0.01))',
                border: '1px solid rgba(0,180,216,0.2)',
                borderRadius: '16px',
                padding: '2rem',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between',
                minHeight: '240px',
                boxShadow: '0 20px 40px rgba(0,0,0,0.2)',
                transition: 'transform 0.2s ease, border-color 0.2s ease'
              }}>
                <div>
                  <span className="material-symbols-outlined" style={{ fontSize: '2.2rem', color: '#00b4d8' }}>policy</span>
                  <h2 style={{ fontFamily: 'Space Grotesk', fontSize: '1.3rem', marginTop: '0.85rem', color: '#fff' }}>Rules &amp; FAQs</h2>
                  <p style={{ color: 'rgba(255,255,255,0.6)', marginTop: '0.4rem', fontSize: '0.9rem', lineHeight: '1.5' }}>
                    Vetting residency policy, RFQ vs RFP explained, and platform guidelines.
                  </p>
                </div>
                <button className="hub-secondary-action" type="button" style={{ marginTop: '1.25rem', width: '100%', minHeight: '40px' }} onClick={() => navigateToTab('faq')}>
                  View FAQs
                </button>
              </article>

            </div>

          </div>
        ) : activeHomepageTab === 'about' ? (
          <section className="hub-section-block">
            <div className="hub-about-video-header" style={{
              position: 'relative',
              borderRadius: '24px',
              overflow: 'hidden',
              height: '380px',
              marginBottom: '3rem',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'end',
              padding: '3rem',
              background: '#000',
              border: '1px solid rgba(255, 255, 255, 0.1)',
              boxShadow: '0 25px 50px -12px rgba(0,0,0,0.5)'
            }}>
              {/* Background Video */}
              <video
                src="/ila_database_video.mov"
                autoPlay
                loop
                muted
                playsInline
                style={{
                  position: 'absolute',
                  top: 0,
                  left: 0,
                  width: '100%',
                  height: '100%',
                  objectFit: 'cover',
                  opacity: 0.65
                }}
              />
              
              {/* Overlay Gradient */}
              <div style={{
                position: 'absolute',
                top: 0,
                left: 0,
                width: '100%',
                height: '100%',
                background: 'linear-gradient(to top, rgba(9, 9, 11, 0.95) 15%, rgba(9, 9, 11, 0.4) 60%, transparent 100%)',
                zIndex: 1
              }} />

              {/* Text content overlay */}
              <div style={{ position: 'relative', zIndex: 2 }}>
                <p className="hub-eyebrow" style={{ color: '#f0956a', margin: 0 }}>Advocating Local Creatives</p>
                <h1 style={{
                  fontFamily: 'Space Grotesk',
                  fontSize: '3.2rem',
                  margin: '0.5rem 0 0.8rem',
                  fontWeight: 900,
                  lineHeight: 1.1,
                  letterSpacing: '-0.02em',
                  textShadow: '0 2px 10px rgba(0,0,0,0.5)'
                }}>
                  About the Site
                </h1>
                <p style={{
                  color: 'rgba(255, 255, 255, 0.8)',
                  margin: 0,
                  fontSize: '1.2rem',
                  maxWidth: '750px',
                  lineHeight: '1.5',
                  textShadow: '0 2px 8px rgba(0,0,0,0.5)'
                }}>
                  A public art registry extending advocacy for Colorado creators, murals, and regional installations.
                </p>
              </div>
            </div>
            
            <div className="hub-card-grid" aria-label="About the hub">
              {ABOUT_CARDS.map((card) => (
                <article className="hub-info-card" key={card.title}>
                  <span className="material-symbols-outlined">{card.icon}</span>
                  <h2>{card.title}</h2>
                  <p>{card.body}</p>
                </article>
              ))}
            </div>
          </section>
        ) : activeHomepageTab === 'register' ? (
          <section className="hub-section-block">
            <div className="hub-section-heading" style={{ marginBottom: '2.5rem', textAlign: 'center' }}>
              <p className="hub-eyebrow" style={{ color: '#f0956a' }}>Artist Intake</p>
              <h1 style={{ fontFamily: 'Space Grotesk', fontSize: '2.5rem', margin: 0, fontWeight: 900 }}>Join the Artist Registry</h1>
              <p style={{ color: 'rgba(255,255,255,0.6)', marginTop: '0.5rem', fontSize: '1.1rem' }}>
                Register your creative practice, showcase capabilities, and get matched to public art opportunities.
              </p>
            </div>
            <div style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: '16px' }}>
              <ArtistQuestionnaire />
            </div>
          </section>
        ) : activeHomepageTab === 'post-project' ? (
          <section className="hub-section-block">
            <div className="hub-section-heading" style={{ marginBottom: '2.5rem', textAlign: 'center' }}>
              <p className="hub-eyebrow" style={{ color: '#62d7ee' }}>Art in Need</p>
              <h1 style={{ fontFamily: 'Space Grotesk', fontSize: '2.5rem', margin: 0, fontWeight: 900 }}>Post a Project</h1>
              <p style={{ color: 'rgba(255,255,255,0.6)', marginTop: '0.5rem', fontSize: '1.1rem' }}>
                Post your creative specifications, timeline, and budget to connect with vetted local talent.
              </p>
            </div>
            <div style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: '16px' }}>
              <CommissionerRFQForm />
            </div>
          </section>
        ) : activeHomepageTab === 'self-service' ? (
          <section className="hub-section-block">
            <div className="hub-mosaic-header">
              {/* Mosaic Background Grid */}
              <div className="hub-mosaic-bg">
                {/* Cell 1 */}
                <div className="hub-mosaic-cell">
                  <div className="hub-mosaic-slide slide-a">
                    <img src="/assets/mosaic_1.jpg" className="hub-mosaic-img pan-1" alt="Video interview monitor" />
                  </div>
                  <div className="hub-mosaic-slide slide-b">
                    <img src="/assets/mosaic_2.jpg" className="hub-mosaic-img pan-2" alt="Live backlit singer" />
                  </div>
                  <div className="hub-mosaic-slide slide-c">
                    <img src="/assets/mosaic_3.jpg" className="hub-mosaic-img pan-3" alt="DJ graffiti backdrop" />
                  </div>
                  <div className="hub-mosaic-slide slide-d">
                    <img src="/assets/mosaic_4.jpg" className="hub-mosaic-img pan-1" alt="Young DJ boy" />
                  </div>
                  <div className="hub-mosaic-slide slide-e">
                    <img src="/assets/mosaic_5.jpg" className="hub-mosaic-img pan-2" alt="Spray painting canvas" />
                  </div>
                  <div className="hub-mosaic-slide slide-f">
                    <img src="/assets/mosaic_6.jpg" className="hub-mosaic-img pan-3" alt="ILA Gallery space" />
                  </div>
                  <div className="hub-mosaic-slide slide-g">
                    <img src="/assets/mosaic_7.jpg" className="hub-mosaic-img pan-1" alt="Cactus mural" />
                  </div>
                  <div className="hub-mosaic-slide slide-h">
                    <img src="/assets/mosaic_8.jpg" className="hub-mosaic-img pan-2" alt="Female DJ operator" />
                  </div>
                  <div className="hub-mosaic-slide slide-i">
                    <img src="/assets/mosaic_9.jpg" className="hub-mosaic-img pan-3" alt="Studio interview setup" />
                  </div>
                  <div className="hub-mosaic-slide slide-j">
                    <img src="/assets/mosaic_10.jpg" className="hub-mosaic-img pan-1" alt="Hat DJ in bar" />
                  </div>
                  <div className="hub-mosaic-slide slide-k">
                    <img src="/assets/mosaic_11.jpg" className="hub-mosaic-img pan-2" alt="Film crew with camera" />
                  </div>
                  <div className="hub-mosaic-slide slide-l">
                    <img src="/assets/mosaic_12.jpg" className="hub-mosaic-img pan-3" alt="Painting mural child" />
                  </div>
                  <div className="hub-mosaic-slide slide-m">
                    <img src="/assets/mosaic_13.jpg" className="hub-mosaic-img pan-1" alt="Artist with painting" />
                  </div>
                  <div className="hub-mosaic-slide slide-n">
                    <img src="/assets/mosaic_14.jpg" className="hub-mosaic-img pan-2" alt="Mexican water tank mural" />
                  </div>
                  <div className="hub-mosaic-slide slide-o">
                    <img src="/assets/mosaic_15.jpg" className="hub-mosaic-img pan-3" alt="Blue mural painting lift" />
                  </div>
                  <div className="hub-mosaic-slide slide-p">
                    <img src="/assets/mosaic_16.jpg" className="hub-mosaic-img pan-1" alt="Forest mural lift" />
                  </div>
                  <div className="hub-mosaic-slide slide-q">
                    <img src="/assets/mosaic_17.jpg" className="hub-mosaic-img pan-2" alt="Fractal spiral building mural" />
                  </div>
                </div>
                {/* Cell 2 */}
                <div className="hub-mosaic-cell">
                  <div className="hub-mosaic-slide slide-a">
                    <img src="/assets/mosaic_6.jpg" className="hub-mosaic-img pan-3" alt="ILA Gallery space" />
                  </div>
                  <div className="hub-mosaic-slide slide-b">
                    <img src="/assets/mosaic_7.jpg" className="hub-mosaic-img pan-1" alt="Cactus mural" />
                  </div>
                  <div className="hub-mosaic-slide slide-c">
                    <img src="/assets/mosaic_8.jpg" className="hub-mosaic-img pan-2" alt="Female DJ operator" />
                  </div>
                  <div className="hub-mosaic-slide slide-d">
                    <img src="/assets/mosaic_9.jpg" className="hub-mosaic-img pan-3" alt="Studio interview setup" />
                  </div>
                  <div className="hub-mosaic-slide slide-e">
                    <img src="/assets/mosaic_10.jpg" className="hub-mosaic-img pan-1" alt="Hat DJ in bar" />
                  </div>
                  <div className="hub-mosaic-slide slide-f">
                    <img src="/assets/mosaic_11.jpg" className="hub-mosaic-img pan-2" alt="Film crew with camera" />
                  </div>
                  <div className="hub-mosaic-slide slide-g">
                    <img src="/assets/mosaic_12.jpg" className="hub-mosaic-img pan-3" alt="Painting mural child" />
                  </div>
                  <div className="hub-mosaic-slide slide-h">
                    <img src="/assets/mosaic_13.jpg" className="hub-mosaic-img pan-1" alt="Artist with painting" />
                  </div>
                  <div className="hub-mosaic-slide slide-i">
                    <img src="/assets/mosaic_14.jpg" className="hub-mosaic-img pan-2" alt="Mexican water tank mural" />
                  </div>
                  <div className="hub-mosaic-slide slide-j">
                    <img src="/assets/mosaic_15.jpg" className="hub-mosaic-img pan-3" alt="Blue mural painting lift" />
                  </div>
                  <div className="hub-mosaic-slide slide-k">
                    <img src="/assets/mosaic_16.jpg" className="hub-mosaic-img pan-1" alt="Forest mural lift" />
                  </div>
                  <div className="hub-mosaic-slide slide-l">
                    <img src="/assets/mosaic_17.jpg" className="hub-mosaic-img pan-2" alt="Fractal spiral building mural" />
                  </div>
                  <div className="hub-mosaic-slide slide-m">
                    <img src="/assets/mosaic_1.jpg" className="hub-mosaic-img pan-1" alt="Video interview monitor" />
                  </div>
                  <div className="hub-mosaic-slide slide-n">
                    <img src="/assets/mosaic_2.jpg" className="hub-mosaic-img pan-2" alt="Live backlit singer" />
                  </div>
                  <div className="hub-mosaic-slide slide-o">
                    <img src="/assets/mosaic_3.jpg" className="hub-mosaic-img pan-3" alt="DJ graffiti backdrop" />
                  </div>
                  <div className="hub-mosaic-slide slide-p">
                    <img src="/assets/mosaic_4.jpg" className="hub-mosaic-img pan-1" alt="Young DJ boy" />
                  </div>
                  <div className="hub-mosaic-slide slide-q">
                    <img src="/assets/mosaic_5.jpg" className="hub-mosaic-img pan-2" alt="Spray painting canvas" />
                  </div>
                </div>
                {/* Cell 3 */}
                <div className="hub-mosaic-cell">
                  <div className="hub-mosaic-slide slide-a">
                    <img src="/assets/mosaic_12.jpg" className="hub-mosaic-img pan-3" alt="Painting mural child" />
                  </div>
                  <div className="hub-mosaic-slide slide-b">
                    <img src="/assets/mosaic_13.jpg" className="hub-mosaic-img pan-1" alt="Artist with painting" />
                  </div>
                  <div className="hub-mosaic-slide slide-c">
                    <img src="/assets/mosaic_14.jpg" className="hub-mosaic-img pan-2" alt="Mexican water tank mural" />
                  </div>
                  <div className="hub-mosaic-slide slide-d">
                    <img src="/assets/mosaic_15.jpg" className="hub-mosaic-img pan-3" alt="Blue mural painting lift" />
                  </div>
                  <div className="hub-mosaic-slide slide-e">
                    <img src="/assets/mosaic_16.jpg" className="hub-mosaic-img pan-1" alt="Forest mural lift" />
                  </div>
                  <div className="hub-mosaic-slide slide-f">
                    <img src="/assets/mosaic_17.jpg" className="hub-mosaic-img pan-2" alt="Fractal spiral building mural" />
                  </div>
                  <div className="hub-mosaic-slide slide-g">
                    <img src="/assets/mosaic_1.jpg" className="hub-mosaic-img pan-1" alt="Video interview monitor" />
                  </div>
                  <div className="hub-mosaic-slide slide-h">
                    <img src="/assets/mosaic_2.jpg" className="hub-mosaic-img pan-2" alt="Live backlit singer" />
                  </div>
                  <div className="hub-mosaic-slide slide-i">
                    <img src="/assets/mosaic_3.jpg" className="hub-mosaic-img pan-3" alt="DJ graffiti backdrop" />
                  </div>
                  <div className="hub-mosaic-slide slide-j">
                    <img src="/assets/mosaic_4.jpg" className="hub-mosaic-img pan-1" alt="Young DJ boy" />
                  </div>
                  <div className="hub-mosaic-slide slide-k">
                    <img src="/assets/mosaic_5.jpg" className="hub-mosaic-img pan-2" alt="Spray painting canvas" />
                  </div>
                  <div className="hub-mosaic-slide slide-l">
                    <img src="/assets/mosaic_6.jpg" className="hub-mosaic-img pan-3" alt="ILA Gallery space" />
                  </div>
                  <div className="hub-mosaic-slide slide-m">
                    <img src="/assets/mosaic_7.jpg" className="hub-mosaic-img pan-1" alt="Cactus mural" />
                  </div>
                  <div className="hub-mosaic-slide slide-n">
                    <img src="/assets/mosaic_8.jpg" className="hub-mosaic-img pan-2" alt="Female DJ operator" />
                  </div>
                  <div className="hub-mosaic-slide slide-o">
                    <img src="/assets/mosaic_9.jpg" className="hub-mosaic-img pan-3" alt="Studio interview setup" />
                  </div>
                  <div className="hub-mosaic-slide slide-p">
                    <img src="/assets/mosaic_10.jpg" className="hub-mosaic-img pan-1" alt="Hat DJ in bar" />
                  </div>
                  <div className="hub-mosaic-slide slide-q">
                    <img src="/assets/mosaic_11.jpg" className="hub-mosaic-img pan-2" alt="Film crew with camera" />
                  </div>
                </div>
              </div>

              {/* Overlay Gradient */}
              <div className="hub-mosaic-overlay" />

              {/* Text Content Overlay */}
              <div style={{ position: 'relative', zIndex: 2 }}>
                <p className="hub-eyebrow" style={{ color: '#f0956a', margin: 0 }}>Registry & Client Self-Service</p>
                <h1 style={{
                  fontFamily: 'Space Grotesk',
                  fontSize: '3.2rem',
                  margin: '0.5rem 0 0.8rem',
                  fontWeight: 900,
                  lineHeight: 1.1,
                  letterSpacing: '-0.02em',
                  textShadow: '0 2px 10px rgba(0,0,0,0.5)'
                }}>
                  Manage Your Account
                </h1>
                <p style={{
                  color: 'rgba(255, 255, 255, 0.8)',
                  margin: 0,
                  fontSize: '1.2rem',
                  maxWidth: '750px',
                  lineHeight: '1.5',
                  textShadow: '0 2px 8px rgba(0,0,0,0.5)'
                }}>
                  Keep your credentials, contact, and profile details current. View submitted RFQs or registry matches.
                </p>
              </div>
            </div>

            {/* ── Unified Smart Login ──────────────────────────────────────────────── */}
            {!uniSession ? (
              <div style={{ maxWidth: '460px', margin: '2rem auto 0', display: 'flex', flexDirection: 'column', gap: '0' }}>
                {/* Login card */}
                <div style={{
                  background: 'rgba(255,255,255,0.035)',
                  border: '1px solid rgba(255,255,255,0.1)',
                  borderRadius: '20px',
                  padding: '2.5rem 2rem',
                  backdropFilter: 'blur(20px)',
                  boxShadow: '0 24px 60px rgba(0,0,0,0.4)',
                }}>
                  <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
                    <div style={{
                      width: '52px', height: '52px', borderRadius: '14px', margin: '0 auto 1rem',
                      background: 'linear-gradient(135deg, rgba(224,90,71,0.2), rgba(74,131,237,0.2))',
                      border: '1px solid rgba(255,255,255,0.1)',
                      display: 'flex', alignItems: 'center', justifyContent: 'center'
                    }}>
                      <span className="material-symbols-outlined" style={{ fontSize: '1.6rem', color: '#fff', opacity: 0.8 }}>manage_accounts</span>
                    </div>
                    <h2 style={{ margin: 0, fontFamily: "'Space Grotesk', sans-serif", fontSize: '1.5rem', fontWeight: 800, color: '#fff' }}>Sign In to Your Account</h2>
                    <p style={{ margin: '0.5rem 0 0', color: 'rgba(255,255,255,0.5)', fontSize: '0.88rem' }}>
                      Artist registry or commissioner portal — your credentials work for both.
                    </p>
                  </div>

                  <form onSubmit={handleUnifiedLogin} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                    <label style={{ display: 'grid', gap: '0.4rem', fontSize: '0.8rem', color: 'rgba(255,255,255,0.45)', textTransform: 'uppercase', letterSpacing: '0.1em' }}>
                      Username or Email
                      <input
                        type="text"
                        value={uniLogin}
                        onChange={e => setUniLogin(e.target.value)}
                        placeholder="e.g. faalali or admin@ila-gallery.com"
                        required
                        autoComplete="username"
                        style={{
                          width: '100%', padding: '0.85rem 1rem', boxSizing: 'border-box',
                          background: 'rgba(0,0,0,0.4)', border: `1px solid ${uniError ? 'rgba(255,80,80,0.5)' : 'rgba(255,255,255,0.12)'}`,
                          borderRadius: '10px', color: '#fff', fontSize: '0.95rem', fontFamily: 'inherit', outline: 'none',
                          transition: 'border 0.2s'
                        }}
                      />
                    </label>
                    <label style={{ display: 'grid', gap: '0.4rem', fontSize: '0.8rem', color: 'rgba(255,255,255,0.45)', textTransform: 'uppercase', letterSpacing: '0.1em' }}>
                      Password
                      <input
                        type="password"
                        value={uniPassword}
                        onChange={e => setUniPassword(e.target.value)}
                        placeholder="••••••••"
                        required
                        autoComplete="current-password"
                        style={{
                          width: '100%', padding: '0.85rem 1rem', boxSizing: 'border-box',
                          background: 'rgba(0,0,0,0.4)', border: `1px solid ${uniError ? 'rgba(255,80,80,0.5)' : 'rgba(255,255,255,0.12)'}`,
                          borderRadius: '10px', color: '#fff', fontSize: '0.95rem', fontFamily: 'inherit', outline: 'none',
                          transition: 'border 0.2s'
                        }}
                      />
                    </label>

                    {uniError && (
                      <p style={{ margin: 0, color: '#ff6b7a', fontSize: '0.84rem', textAlign: 'center' }}>{uniError}</p>
                    )}

                    <button
                      type="submit"
                      disabled={uniLoading}
                      style={{
                        marginTop: '0.5rem',
                        padding: '0.9rem', border: 'none', borderRadius: '11px',
                        background: uniLoading ? 'rgba(255,255,255,0.08)' : 'linear-gradient(135deg, #e05a47, #4a83ed)',
                        color: '#fff', fontSize: '0.95rem', fontWeight: 700, cursor: uniLoading ? 'not-allowed' : 'pointer',
                        fontFamily: "'Space Grotesk', sans-serif",
                        transition: 'all 0.2s ease',
                        boxShadow: uniLoading ? 'none' : '0 4px 16px rgba(74,131,237,0.25)',
                        display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem'
                      }}
                    >
                      <span className="material-symbols-outlined" style={{ fontSize: '1.1rem' }}>{uniLoading ? 'sync' : 'login'}</span>
                      {uniLoading ? 'Signing in…' : 'Sign In'}
                    </button>
                  </form>

                  <div style={{ marginTop: '1.75rem', borderTop: '1px solid rgba(255,255,255,0.07)', paddingTop: '1.25rem', display: 'flex', gap: '0.75rem', justifyContent: 'center', flexWrap: 'wrap' }}>
                    <button
                      type="button"
                      onClick={() => navigateToTab('register')}
                      style={{ background: 'rgba(224,90,71,0.08)', border: '1px solid rgba(224,90,71,0.2)', borderRadius: '8px', padding: '0.55rem 1rem', color: 'var(--accent-terracotta)', fontSize: '0.82rem', fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit', display: 'flex', alignItems: 'center', gap: '0.35rem' }}
                    >
                      <span className="material-symbols-outlined" style={{ fontSize: '0.95rem' }}>palette</span>
                      Register as Artist
                    </button>
                    <button
                      type="button"
                      onClick={() => onNavigate('commissioner')}
                      style={{ background: 'rgba(74,131,237,0.08)', border: '1px solid rgba(74,131,237,0.2)', borderRadius: '8px', padding: '0.55rem 1rem', color: 'var(--accent-electric)', fontSize: '0.82rem', fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit', display: 'flex', alignItems: 'center', gap: '0.35rem' }}
                    >
                      <span className="material-symbols-outlined" style={{ fontSize: '0.95rem' }}>campaign</span>
                      Post an Opportunity
                    </button>
                  </div>
                </div>
              </div>
            ) : (
              /* ── Logged-in Unified Dashboard ─────────────────────────────────────── */
              <div style={{ marginTop: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                {/* Welcome bar + sign out */}
                <div style={{
                  display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '1rem',
                  padding: '1rem 1.5rem',
                  background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.07)',
                  borderRadius: '14px',
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                    <div style={{ width: '40px', height: '40px', borderRadius: '50%', background: 'linear-gradient(135deg, rgba(224,90,71,0.3), rgba(74,131,237,0.3))', border: '1px solid rgba(255,255,255,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <span className="material-symbols-outlined" style={{ fontSize: '1.3rem', color: '#fff', opacity: 0.7 }}>person</span>
                    </div>
                    <div>
                      <div style={{ fontWeight: 700, fontSize: '0.95rem', color: '#fff' }}>Welcome back, {uniSession.name}</div>
                      <div style={{ fontSize: '0.75rem', color: 'rgba(255,255,255,0.4)', display: 'flex', gap: '0.5rem', marginTop: '0.15rem', flexWrap: 'wrap' }}>
                        {uniSession.hasArtist && <span style={{ background: 'rgba(224,90,71,0.12)', border: '1px solid rgba(224,90,71,0.25)', borderRadius: '4px', padding: '0.1rem 0.4rem', color: 'var(--accent-terracotta)', fontWeight: 700 }}>🎨 Artist Registry</span>}
                        {uniSession.hasClient && <span style={{ background: 'rgba(74,131,237,0.12)', border: '1px solid rgba(74,131,237,0.25)', borderRadius: '4px', padding: '0.1rem 0.4rem', color: 'var(--accent-electric)', fontWeight: 700 }}>📣 Commissioner</span>}
                      </div>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={handleUnifiedLogout}
                    style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px', padding: '0.5rem 1rem', color: 'rgba(255,255,255,0.55)', fontSize: '0.82rem', cursor: 'pointer', fontFamily: 'inherit', display: 'flex', alignItems: 'center', gap: '0.35rem' }}
                  >
                    <span className="material-symbols-outlined" style={{ fontSize: '0.95rem' }}>logout</span>
                    Sign Out
                  </button>
                </div>

                {/* Dual-portal tabs if user has both; otherwise render directly */}
                {uniSession.hasArtist && uniSession.hasClient ? (
                  <>
                    <div style={{ display: 'flex', background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '14px', padding: '4px', gap: '2px', width: 'fit-content' }}>
                      <button type="button" onClick={() => setSelfServicePortal('artist')} style={{ padding: '0.55rem 1.1rem', borderRadius: '10px', border: 'none', background: selfServicePortal === 'artist' ? 'var(--accent-terracotta)' : 'transparent', color: '#fff', fontWeight: 700, fontSize: '0.82rem', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.4rem', transition: 'all 0.3s', fontFamily: "'Space Grotesk', sans-serif", boxShadow: selfServicePortal === 'artist' ? '0 4px 12px rgba(224,90,71,0.3)' : 'none' }}>
                        <span className="material-symbols-outlined" style={{ fontSize: '0.95rem' }}>palette</span>
                        Artist Dashboard
                      </button>
                      <button type="button" onClick={() => setSelfServicePortal('client')} style={{ padding: '0.55rem 1.1rem', borderRadius: '10px', border: 'none', background: selfServicePortal === 'client' ? 'var(--accent-electric)' : 'transparent', color: '#fff', fontWeight: 700, fontSize: '0.82rem', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.4rem', transition: 'all 0.3s', fontFamily: "'Space Grotesk', sans-serif", boxShadow: selfServicePortal === 'client' ? '0 4px 12px rgba(74,131,237,0.3)' : 'none' }}>
                        <span className="material-symbols-outlined" style={{ fontSize: '0.95rem' }}>campaign</span>
                        Commissioner Dashboard
                      </button>
                    </div>
                    {selfServicePortal === 'artist' ? (
                      <ArtistAccountPortal
                        onCreateProfile={() => navigateToTab('register')}
                        onOpenGrantAssistant={(source) => {
                          try { sessionStorage.setItem('ila_grant_preload', JSON.stringify(source)); } catch {}
                          window.open(`${window.location.origin}/?admin#grant-assistant`, '_blank');
                        }}
                      />
                    ) : (
                      <ClientAccountPortal />
                    )}
                  </>
                ) : uniSession.hasArtist ? (
                  <ArtistAccountPortal
                    onCreateProfile={() => navigateToTab('register')}
                    onOpenGrantAssistant={(source) => {
                      try { sessionStorage.setItem('ila_grant_preload', JSON.stringify(source)); } catch {}
                      window.open(`${window.location.origin}/?admin#grant-assistant`, '_blank');
                    }}
                  />
                ) : (
                  <ClientAccountPortal />
                )}
              </div>
            )}
          </section>
        ) : activeHomepageTab === 'faq' ? (
          <section className="hub-section-block" style={{ maxWidth: '850px', margin: '0 auto', width: '100%' }}>
            <div className="hub-faq-header" style={{ textAlign: 'center', marginBottom: '3.5rem' }}>
              <p className="hub-eyebrow" style={{ color: '#62d7ee' }}>Vetting &amp; Guidelines</p>
              <h1 style={{ fontSize: '2.5rem', fontFamily: 'Space Grotesk', margin: 0, fontWeight: 900 }}>Frequently Asked Questions</h1>
              <p style={{ color: 'rgba(255,255,255,0.6)', marginTop: '0.5rem', fontSize: '1.1rem' }}>
                Understanding our local-first policies and request frameworks.
              </p>
            </div>

            {/* Section 1: RFP vs RFQ */}
            <div style={{ marginBottom: '4rem' }}>
              <div style={{ textAlign: 'center', marginBottom: '1.75rem' }}>
                <p className="hub-eyebrow" style={{ color: 'var(--accent-terracotta)' }}>Opportunity frameworks</p>
                <h2 style={{ fontSize: '1.8rem', fontFamily: 'Space Grotesk', margin: '0.25rem 0 0.5rem 0' }}>RFQ and RFP are different on purpose.</h2>
                <p style={{ maxWidth: '720px', margin: '0 auto', color: 'rgba(255,255,255,0.6)', fontSize: '0.95rem', lineHeight: 1.5 }}>
                  Choosing the right request type keeps artists from doing unpaid concept work too early and helps clients collect the right level of detail.
                </p>
              </div>

              <div className="hub-process-grid">
                {PROCESS_CARDS.map((card) => (
                  <article className="hub-process-card" key={card.eyebrow} style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '16px', padding: '2rem' }}>
                    <span style={{ color: 'var(--accent-terracotta)', fontSize: '0.75rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.12em' }}>{card.eyebrow}</span>
                    <h3 style={{ fontSize: '1.4rem', margin: '0.5rem 0', fontFamily: 'Space Grotesk' }}>{card.title}</h3>
                    <p style={{ color: 'rgba(255,255,255,0.7)', fontSize: '0.95rem', lineHeight: '1.6', margin: 0 }}>{card.body}</p>
                  </article>
                ))}
              </div>
            </div>

            {/* Section 2: Policies */}
            <div>
              <div style={{ textAlign: 'center', marginBottom: '1.75rem' }}>
                <p className="hub-eyebrow" style={{ color: '#62d7ee' }}>Vetting &amp; security</p>
                <h2 style={{ fontSize: '1.8rem', fontFamily: 'Space Grotesk', margin: '0.25rem 0 0.5rem 0' }}>Residency Verification &amp; Privacy</h2>
                <p style={{ maxWidth: '720px', margin: '0 auto', color: 'rgba(255,255,255,0.6)', fontSize: '0.95rem', lineHeight: 1.5 }}>
                  How we prioritize homegrown Colorado talent and secure your submitted details.
                </p>
              </div>

              <div className="hub-policy-grid">
                <article className="hub-policy-card" style={{ background: 'linear-gradient(135deg, rgba(224,90,71,0.08), rgba(255,255,255,0.03))', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '16px', padding: '2rem' }}>
                  <span className="material-symbols-outlined" style={{ fontSize: '2.5rem', color: '#e05a47' }}>policy</span>
                  <h2 style={{ fontSize: '1.4rem', marginTop: '1rem', marginBottom: '0.5rem', fontFamily: 'Space Grotesk' }}>Residency &amp; Vetting Policy</h2>
                  <p style={{ fontSize: '0.95rem', lineHeight: '1.6', color: 'rgba(255,255,255,0.7)', margin: 0 }}>
                    Out-of-state applicants can register, but Colorado local calls default to Colorado artists first. Broader calls can include regional or national specialists when the scope needs it.
                  </p>
                </article>

                <article className="hub-policy-card" style={{ background: 'linear-gradient(135deg, rgba(98,215,238,0.08), rgba(255,255,255,0.03))', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '16px', padding: '2rem' }}>
                  <span className="material-symbols-outlined" style={{ fontSize: '2.5rem', color: '#62d7ee' }}>security</span>
                  <h2 style={{ fontSize: '1.4rem', marginTop: '1rem', marginBottom: '0.5rem', fontFamily: 'Space Grotesk' }}>Data &amp; Privacy Commitment</h2>
                  <p style={{ fontSize: '0.95rem', lineHeight: '1.6', color: 'rgba(255,255,255,0.7)', margin: 0 }}>
                    We will <strong>never sell your information</strong>. The 303 ArtWay database exists solely to help local artists and commissioners discover, connect, and collaborate on public and private art projects.
                  </p>
                </article>

                <article className="hub-policy-card" style={{ background: 'linear-gradient(135deg, rgba(245,158,11,0.08), rgba(255,255,255,0.03))', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '16px', padding: '2rem' }}>
                  <span className="material-symbols-outlined" style={{ fontSize: '2.5rem', color: 'var(--accent-ochre)' }}>handshake</span>
                  <h2 style={{ fontSize: '1.4rem', marginTop: '1rem', marginBottom: '0.5rem', fontFamily: 'Space Grotesk' }}>Connection &amp; Contracts</h2>
                  <p style={{ fontSize: '0.95rem', lineHeight: '1.6', color: 'rgba(255,255,255,0.7)', margin: 0 }}>
                    ILA Gallery is <strong>merely a connector</strong>. We have no involvement in contract negotiations, agreement writing, or payment transfers for public, private, or service-based art commissions.
                  </p>
                </article>
              </div>
            </div>

            {/* Section 3: Share & Test Mobile Form */}
            <div style={{ marginTop: '4rem' }}>
              <div style={{ textAlign: 'center', marginBottom: '1.75rem' }}>
                <p className="hub-eyebrow" style={{ color: 'var(--accent-ochre)' }}>Testing &amp; sharing</p>
                <h2 style={{ fontSize: '1.8rem', fontFamily: 'Space Grotesk', margin: '0.25rem 0 0.5rem 0' }}>Share &amp; Test Intake Form</h2>
                <p style={{ maxWidth: '720px', margin: '0 auto', color: 'rgba(255,255,255,0.6)', fontSize: '0.95rem', lineHeight: 1.5 }}>
                  Scan the QR code to open the questionnaire directly on your phone, or copy the link to share it with other artists.
                </p>
              </div>

              <div className="hub-share-grid">
                {/* Left Card: Scannable QR Code */}
                <article className="hub-policy-card" style={{ background: 'linear-gradient(135deg, rgba(245,158,11,0.08), rgba(255,255,255,0.03))', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '16px', padding: '2rem', display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center' }}>
                  <span className="material-symbols-outlined" style={{ fontSize: '2.5rem', color: 'var(--accent-ochre)', marginBottom: '1rem' }}>qr_code_2</span>
                  <div style={{ background: '#fafafa', padding: '12px', borderRadius: '12px', boxShadow: '0 8px 24px rgba(0,0,0,0.4)', display: 'inline-flex', justifyContent: 'center', alignItems: 'center', marginBottom: '1rem' }}>
                    <img 
                      src={`https://quickchart.io/qr?text=${encodeURIComponent(typeof window !== 'undefined' ? (window.location.origin + '/?tab=register') : 'https://ila-gallery-database.web.app/?tab=register')}&dark=e05a47&light=fafafa&margin=2&size=150`} 
                      alt="Intake Form QR Code" 
                      style={{ width: '150px', height: '150px', borderRadius: '4px' }}
                      onError={(e) => {
                        e.target.onerror = null;
                        const url = typeof window !== 'undefined' ? (window.location.origin + '/?tab=register') : 'https://ila-gallery-database.web.app/?tab=register';
                        e.target.src = `https://api.qrserver.com/v1/create-qr-code/?size=150x150&color=e05a47&bgcolor=fafafa&qzone=2&data=${encodeURIComponent(url)}`;
                      }}
                    />
                  </div>
                  <span style={{ fontFamily: 'Space Grotesk', fontSize: '0.75rem', color: 'var(--accent-ochre)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '1px' }}>
                    Scan with camera
                  </span>
                </article>

                {/* Right Card: Public Share Link */}
                <article className="hub-policy-card" style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '16px', padding: '2rem', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
                  <div>
                    <h3 style={{ fontSize: '1.4rem', margin: '0 0 0.5rem 0', fontFamily: 'Space Grotesk' }}>Public Intake Web Link</h3>
                    <p style={{ fontSize: '0.95rem', lineHeight: '1.5', color: 'rgba(255,255,255,0.7)', margin: '0 0 1.5rem 0' }}>
                      This database is live on the public internet. Anyone can access the registry questionnaire from their mobile browser or desktop.
                    </p>
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                    <div style={{ display: 'flex', gap: '0.5rem', width: '100%' }}>
                      <input 
                        type="text" 
                        readOnly 
                        value={typeof window !== 'undefined' ? (window.location.origin + '/?tab=register') : 'https://ila-gallery-database.web.app/?tab=register'}
                        style={{ 
                          background: 'rgba(0,0,0,0.4)', 
                          border: '1px solid rgba(255,255,255,0.1)', 
                          color: '#fff', 
                          borderRadius: '8px', 
                          padding: '0.6rem 0.8rem',
                          fontSize: '0.75rem',
                          fontFamily: 'monospace',
                          flexGrow: 1,
                          outline: 'none'
                        }}
                      />
                      <button 
                        onClick={handleCopyLink}
                        style={{ 
                          background: copiedLink ? 'var(--accent-electric)' : 'rgba(255,255,255,0.08)',
                          border: '1px solid rgba(255,255,255,0.1)',
                          color: '#fff',
                          borderRadius: '8px',
                          padding: '0 0.8rem',
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          transition: 'all 0.2s ease',
                          minWidth: '42px'
                        }}
                        title="Copy Link"
                      >
                        <span className="material-symbols-outlined" style={{ fontSize: '1.2rem' }}>
                          {copiedLink ? 'check' : 'content_copy'}
                        </span>
                      </button>
                    </div>
                    {copiedLink && <span style={{ fontSize: '0.75rem', color: '#7ee5aa', alignSelf: 'flex-end', fontWeight: 600 }}>Link copied!</span>}
                  </div>
                </article>
              </div>
            </div>
          </section>
        ) : null}
      </main>

      <footer className="hub-footer">
        {[
          { icon: 'verified', text: 'Vetted Colorado artists' },
          { icon: 'lock', text: 'Secure submissions' },
          { icon: 'volunteer_activism', text: 'Community-first mission' },
          { icon: 'star', text: 'ILA Gallery powered' },
        ].map(({ icon, text }) => (
          <span key={text}>
            <span className="material-symbols-outlined">{icon}</span>
            {text}
          </span>
        ))}
      </footer>

      <style>{`
        .hub-shell {
          min-height: 100vh;
          background:
            linear-gradient(180deg, rgba(255,255,255,0.03), transparent 36rem),
            radial-gradient(circle at top left, rgba(224,90,71,0.16), transparent 26rem),
            radial-gradient(circle at top right, rgba(0,180,216,0.12), transparent 28rem),
            #09090b;
          color: #fff;
          font-family: 'Outfit', 'Inter', sans-serif;
          overflow-x: hidden;
        }

        .hub-nav {
          position: sticky;
          top: 0;
          z-index: 20;
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 1rem;
          padding: 1rem clamp(1rem, 4vw, 3rem);
          background: rgba(9,9,11,0.8);
          border-bottom: 1px solid rgba(255,255,255,0.08);
          backdrop-filter: blur(18px);
        }

        .hub-brand {
          display: flex;
          align-items: center;
          gap: 0.7rem;
          background: transparent;
          border: 0;
          color: inherit;
          cursor: pointer;
          font: inherit;
          text-align: left;
        }

        .hub-brand-mark {
          font-family: 'Space Grotesk', sans-serif;
          font-size: 1.45rem;
          font-weight: 900;
          color: #fff;
        }

        .hub-brand-mark span { color: #e05a47; }

        .hub-brand-meta {
          border-left: 1px solid rgba(255,255,255,0.14);
          color: rgba(255,255,255,0.42);
          font-size: 0.7rem;
          letter-spacing: 0.16em;
          padding-left: 0.7rem;
          text-transform: uppercase;
        }

        .hub-nav-actions {
          display: flex;
          align-items: center;
          gap: 0.55rem;
        }

        .hub-nav-pill,
        .hub-primary-action,
        .hub-secondary-action,
        .hub-form-button {
          min-height: 44px;
          border-radius: 8px;
          font-family: 'Space Grotesk', sans-serif;
          font-weight: 700;
          cursor: pointer;
          transition: transform 0.18s ease, border-color 0.18s ease, background 0.18s ease;
        }

        .hub-shell button:focus {
          outline: none;
        }

        .hub-shell button:focus-visible {
          outline: 2px solid rgba(98,215,238,0.75);
          outline-offset: 3px;
        }

        .hub-nav-pill {
          background: transparent;
          border: 1px solid transparent;
          color: rgba(255,255,255,0.64);
          padding: 0 0.95rem;
        }

        .hub-nav-pill.active,
        .hub-nav-pill:hover {
          background: rgba(255,255,255,0.07);
          border-color: rgba(255,255,255,0.12);
          color: #fff;
        }

        .hub-live-badge {
          display: inline-flex;
          align-items: center;
          gap: 0.45rem;
          color: rgba(255,255,255,0.45);
          font-size: 0.72rem;
          letter-spacing: 0.08em;
          text-transform: uppercase;
          white-space: nowrap;
        }

        .hub-live-badge span {
          width: 7px;
          height: 7px;
          border-radius: 50%;
          background: #46d98b;
          box-shadow: 0 0 16px rgba(70,217,139,0.8);
        }

        .hub-hero,
        .hub-content {
          width: min(1180px, calc(100% - 2rem));
          margin: 0 auto;
        }

        .hub-hero {
          display: grid;
          grid-template-columns: minmax(0, 1fr) 320px;
          gap: 2rem;
          align-items: center;
          padding: 3.5rem 3rem;
          margin-top: 2rem;
        }

        .hub-hero.portal-mode {
          align-items: center;
          padding: clamp(1.5rem, 4vw, 2.6rem) 0 1.25rem;
        }

        .hub-eyebrow {
          color: #f0956a;
          font-family: 'Space Grotesk', sans-serif;
          font-size: 0.72rem;
          font-weight: 800;
          letter-spacing: 0.18em;
          margin: 0 0 0.85rem;
          text-transform: uppercase;
        }

        .hub-hero h1 {
          max-width: 760px;
          color: #fff;
          font-family: 'Space Grotesk', sans-serif;
          font-size: clamp(2.55rem, 7vw, 5.7rem);
          letter-spacing: 0;
          line-height: 0.95;
          margin: 0;
        }

        .hub-hero.portal-mode h1 {
          font-size: clamp(2.2rem, 5vw, 4rem);
          max-width: 680px;
        }

        .hub-hero.portal-mode .hub-hero-actions {
          display: none;
        }

        .hub-hero.portal-mode .hub-stat {
          padding: 0.85rem 1rem;
        }

        .hub-hero.portal-mode .hub-stat strong {
          font-size: 1.15rem;
        }

        .hub-lede {
          max-width: 700px;
          color: rgba(255,255,255,0.66);
          font-size: 1.08rem;
          line-height: 1.65;
          margin: 1.25rem 0 0;
        }

        .hub-hero-actions {
          display: flex;
          flex-wrap: wrap;
          gap: 0.8rem;
          margin-top: 1.8rem;
        }

        .hub-primary-action,
        .hub-secondary-action,
        .hub-form-button {
          align-items: center;
          display: inline-flex;
          gap: 0.5rem;
          justify-content: center;
          padding: 0 1.15rem;
        }

        .hub-primary-action,
        .hub-form-button {
          background: #f2f2f2;
          border: 1px solid rgba(255,255,255,0.5);
          color: #09090b;
        }

        .hub-secondary-action {
          background: rgba(255,255,255,0.06);
          border: 1px solid rgba(255,255,255,0.12);
          color: #fff;
        }

        .hub-secondary-action.compact {
          width: 100%;
        }

        .hub-primary-action:hover,
        .hub-secondary-action:hover,
        .hub-form-button:hover,
        .hub-portal-card:hover {
          transform: translateY(-2px);
        }

        .hub-hero-panel {
          display: grid;
          gap: 0.75rem;
        }

        .hub-stat,
        .hub-info-card,
        .hub-section-band,
        .hub-policy-card,
        .hub-profile-card,
        .hub-portal-card {
          background: rgba(255,255,255,0.045);
          border: 1px solid rgba(255,255,255,0.1);
          border-radius: 8px;
          box-shadow: 0 18px 55px rgba(0,0,0,0.22);
        }

        .hub-stat {
          padding: 1.1rem 1.2rem;
        }

        .hub-stat strong {
          color: #fff;
          display: block;
          font-family: 'Space Grotesk', sans-serif;
          font-size: 1.55rem;
          line-height: 1;
        }

        .hub-stat span {
          color: rgba(255,255,255,0.48);
          display: block;
          font-size: 0.9rem;
          margin-top: 0.4rem;
        }


        .hub-content {
          padding-bottom: 3rem;
        }

        .hub-card-grid,
        .hub-profile-row,
        .hub-portal-grid {
          display: grid;
          gap: 1rem;
        }

        .hub-card-grid {
          grid-template-columns: repeat(3, minmax(0, 1fr));
        }

        .hub-primary-grid {
          display: grid;
          grid-template-columns: repeat(2, minmax(0, 1fr));
          gap: 1.5rem;
        }

        .hub-secondary-grid {
          display: grid;
          grid-template-columns: repeat(3, minmax(0, 1fr));
          gap: 1.5rem;
        }

        .hub-policy-grid {
          display: grid;
          grid-template-columns: repeat(3, minmax(0, 1fr));
          gap: 2rem;
        }

        .hub-share-grid {
          display: grid;
          grid-template-columns: repeat(2, minmax(0, 1fr));
          gap: 2rem;
        }

        .hub-info-card,
        .hub-policy-card,
        .hub-profile-card {
          padding: 1.5rem;
        }

        .hub-info-card > .material-symbols-outlined,
        .hub-policy-card > .material-symbols-outlined {
          color: #e05a47;
          font-size: 2rem;
        }

        .hub-info-card h2,
        .hub-section-band h2,
        .hub-policy-card h2,
        .hub-profile-card h2,
        .hub-portal-card h2 {
          color: #fff;
          font-family: 'Space Grotesk', sans-serif;
          letter-spacing: 0;
          margin: 0;
        }

        .hub-info-card h2,
        .hub-policy-card h2,
        .hub-profile-card h2 {
          font-size: 1.25rem;
          margin-top: 0.9rem;
        }

        .hub-info-card p,
        .hub-section-band p,
        .hub-process-card p,
        .hub-policy-card p,
        .hub-profile-card p,
        .hub-portal-card p,
        .hub-portal-card li {
          color: rgba(255,255,255,0.62);
          font-size: 0.95rem;
          line-height: 1.62;
        }

        .hub-info-card p,
        .hub-policy-card p {
          margin: 0.75rem 0 0;
        }

        .hub-section-band {
          display: grid;
          grid-template-columns: 0.75fr 1.25fr;
          gap: 1.25rem;
          margin-top: 1rem;
          padding: 1.5rem;
        }

        .hub-section-band h2 {
          font-size: clamp(1.6rem, 3vw, 2.35rem);
          line-height: 1.05;
        }

        .hub-section-band > div > p:last-child {
          margin: 1rem 0 0;
        }

        .hub-process-grid {
          display: grid;
          grid-template-columns: repeat(2, minmax(0, 1fr));
          gap: 0.9rem;
        }

        .hub-process-card {
          background: rgba(0,0,0,0.28);
          border: 1px solid rgba(255,255,255,0.08);
          border-radius: 8px;
          padding: 1.25rem;
        }

        .hub-process-card span {
          color: #00b4d8;
          display: inline-block;
          font-family: 'Space Grotesk', sans-serif;
          font-size: 0.72rem;
          font-weight: 900;
          letter-spacing: 0.14em;
          margin-bottom: 0.8rem;
        }

        .hub-process-card h3 {
          color: #fff;
          font-size: 1.05rem;
          margin: 0;
        }

        .hub-process-card p {
          margin: 0.65rem 0 0;
        }

        .hub-profile-row {
          grid-template-columns: 0.78fr 1.22fr;
          margin-top: 1rem;
        }

        .hub-profile-card {
          border-color: rgba(224,90,71,0.28);
          background: linear-gradient(135deg, rgba(224,90,71,0.1), rgba(255,255,255,0.04));
        }

        .hub-card-heading {
          display: flex;
          gap: 0.85rem;
          align-items: flex-start;
        }

        .hub-card-heading > .material-symbols-outlined {
          color: #e05a47;
          font-size: 2rem;
        }

        .hub-form {
          display: grid;
          gap: 0.9rem;
          margin-top: 1.1rem;
        }

        .hub-input-grid,
        .hub-button-grid {
          display: grid;
          grid-template-columns: repeat(2, minmax(0, 1fr));
          gap: 0.75rem;
        }

        .hub-form label {
          color: rgba(255,255,255,0.5);
          display: grid;
          font-family: 'Space Grotesk', sans-serif;
          font-size: 0.73rem;
          font-weight: 800;
          gap: 0.4rem;
          letter-spacing: 0.08em;
          text-transform: uppercase;
        }

        .hub-form input,
        .hub-form select {
          width: 100%;
          background: rgba(0,0,0,0.38);
          border: 1px solid rgba(255,255,255,0.14);
          border-radius: 8px;
          color: #fff;
          font: 500 0.95rem 'Outfit', sans-serif;
          min-height: 44px;
          outline: none;
          padding: 0 0.9rem;
        }

        .hub-form input:focus,
        .hub-form select:focus {
          border-color: rgba(240,149,106,0.75);
          box-shadow: 0 0 0 3px rgba(240,149,106,0.12);
        }

        .hub-form-message {
          border-radius: 8px;
          font-size: 0.88rem;
          margin: 0;
          padding: 0.75rem 0.85rem;
        }

        .hub-form-message.error {
          background: rgba(255,84,105,0.12);
          color: #ff8b99;
        }

        .hub-form-message.success {
          background: rgba(70,217,139,0.12);
          color: #7ee5aa;
        }

        .hub-found-profile {
          background: rgba(255,255,255,0.055);
          border: 1px solid rgba(255,255,255,0.1);
          border-radius: 8px;
          color: #fff;
          padding: 0.85rem;
        }

        .hub-found-profile span {
          color: rgba(255,255,255,0.45);
          display: block;
          font-size: 0.82rem;
          margin-top: 0.2rem;
        }

        .hub-portal-grid {
          grid-template-columns: repeat(2, minmax(0, 1fr));
        }

        .hub-portal-card {
          appearance: none;
          color: inherit;
          cursor: pointer;
          display: flex;
          flex-direction: column;
          min-height: 560px;
          overflow: hidden;
          padding: clamp(1.4rem, 3vw, 2rem);
          position: relative;
          text-align: left;
          transition: transform 0.2s ease, border-color 0.2s ease, background 0.2s ease;
        }

        .hub-portal-card.artist {
          background: linear-gradient(155deg, rgba(224,90,71,0.14), rgba(255,255,255,0.04));
          border-color: rgba(224,90,71,0.22);
        }

        .hub-portal-card.client {
          background: linear-gradient(155deg, rgba(0,180,216,0.13), rgba(255,255,255,0.04));
          border-color: rgba(0,180,216,0.22);
        }

        .hub-portal-card.active.artist,
        .hub-portal-card.artist:hover {
          border-color: rgba(224,90,71,0.52);
        }

        .hub-portal-card.active.client,
        .hub-portal-card.client:hover {
          border-color: rgba(0,180,216,0.52);
        }

        .hub-portal-icon {
          align-items: center;
          background: rgba(255,255,255,0.08);
          border: 1px solid rgba(255,255,255,0.12);
          border-radius: 8px;
          display: flex;
          height: 54px;
          justify-content: center;
          margin-bottom: 1.35rem;
          width: 54px;
        }

        .hub-portal-card.artist .hub-portal-icon,
        .hub-portal-card.artist .hub-portal-eyebrow,
        .hub-portal-card.artist li .material-symbols-outlined {
          color: #f0956a;
        }

        .hub-portal-card.client .hub-portal-icon,
        .hub-portal-card.client .hub-portal-eyebrow,
        .hub-portal-card.client li .material-symbols-outlined {
          color: #62d7ee;
        }

        .hub-portal-eyebrow {
          font-family: 'Space Grotesk', sans-serif;
          font-size: 0.72rem;
          font-weight: 900;
          letter-spacing: 0.14em;
          margin-bottom: 0.55rem;
          text-transform: uppercase;
        }

        .hub-portal-card h2 {
          font-size: clamp(1.75rem, 3vw, 2.6rem);
          line-height: 1.02;
        }

        .hub-portal-card p {
          margin: 1rem 0 1.6rem;
        }

        .hub-portal-card ul {
          display: grid;
          gap: 0.75rem;
          list-style: none;
          margin: 0 0 1.5rem;
          padding: 0;
        }

        .hub-portal-card li {
          align-items: flex-start;
          display: flex;
          gap: 0.65rem;
        }

        .hub-portal-card li .material-symbols-outlined {
          font-size: 1.1rem;
          margin-top: 0.1rem;
        }

        .hub-portal-cta {
          align-items: center;
          background: rgba(0,0,0,0.24);
          border: 1px solid rgba(255,255,255,0.1);
          border-radius: 8px;
          display: flex;
          gap: 1rem;
          justify-content: space-between;
          margin-top: auto;
          padding: 1rem;
        }

        .hub-portal-cta strong {
          color: #fff;
          display: block;
          font-family: 'Space Grotesk', sans-serif;
        }

        .hub-portal-cta span {
          color: rgba(255,255,255,0.46);
          display: block;
          font-size: 0.82rem;
          margin-top: 0.15rem;
        }

        .hub-footer {
          border-top: 1px solid rgba(255,255,255,0.08);
          display: flex;
          flex-wrap: wrap;
          gap: 1.25rem;
          justify-content: center;
          padding: 1rem;
        }

        .hub-footer > span {
          align-items: center;
          color: rgba(255,255,255,0.36);
          display: inline-flex;
          font-size: 0.8rem;
          gap: 0.45rem;
        }

        .hub-footer .material-symbols-outlined {
          font-size: 1rem;
        }

        /* Moving Mosaic Slideshow Styles */
        .hub-mosaic-header {
          position: relative;
          border-radius: 24px;
          overflow: hidden;
          height: 380px;
          margin-bottom: 3rem;
          display: flex;
          flex-direction: column;
          justify-content: flex-end;
          padding: 3rem;
          background: #000;
          border: 1px solid rgba(255, 255, 255, 0.1);
          box-shadow: 0 25px 50px -12px rgba(0,0,0,0.5);
        }

        .hub-mosaic-bg {
          position: absolute;
          top: 0;
          left: 0;
          width: 100%;
          height: 100%;
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 12px;
          padding: 12px;
          z-index: 0;
        }

        .hub-mosaic-cell {
          position: relative;
          overflow: hidden;
          border-radius: 12px;
          background: #141416;
          box-shadow: inset 0 0 40px rgba(0,0,0,0.8);
        }

        .hub-mosaic-slide {
          position: absolute;
          top: 0;
          left: 0;
          width: 100%;
          height: 100%;
          opacity: 0;
          transition: transform 0.8s ease-in-out;
        }

        /* Slide Opacity Crossfade Animations */
        .slide-a {
          animation: mosaicCrossfade 51s infinite;
        }
        .slide-b {
          animation: mosaicCrossfade 51s infinite;
          animation-delay: -3s;
        }
        .slide-c {
          animation: mosaicCrossfade 51s infinite;
          animation-delay: -6s;
        }
        .slide-d {
          animation: mosaicCrossfade 51s infinite;
          animation-delay: -9s;
        }
        .slide-e {
          animation: mosaicCrossfade 51s infinite;
          animation-delay: -12s;
        }
        .slide-f {
          animation: mosaicCrossfade 51s infinite;
          animation-delay: -15s;
        }
        .slide-g {
          animation: mosaicCrossfade 51s infinite;
          animation-delay: -18s;
        }
        .slide-h {
          animation: mosaicCrossfade 51s infinite;
          animation-delay: -21s;
        }
        .slide-i {
          animation: mosaicCrossfade 51s infinite;
          animation-delay: -24s;
        }
        .slide-j {
          animation: mosaicCrossfade 51s infinite;
          animation-delay: -27s;
        }
        .slide-k {
          animation: mosaicCrossfade 51s infinite;
          animation-delay: -30s;
        }
        .slide-l {
          animation: mosaicCrossfade 51s infinite;
          animation-delay: -33s;
        }
        .slide-m {
          animation: mosaicCrossfade 51s infinite;
          animation-delay: -36s;
        }
        .slide-n {
          animation: mosaicCrossfade 51s infinite;
          animation-delay: -39s;
        }
        .slide-o {
          animation: mosaicCrossfade 51s infinite;
          animation-delay: -42s;
        }
        .slide-p {
          animation: mosaicCrossfade 51s infinite;
          animation-delay: -45s;
        }
        .slide-q {
          animation: mosaicCrossfade 51s infinite;
          animation-delay: -48s;
        }

        @keyframes mosaicCrossfade {
          0%, 3.53% { opacity: 1; z-index: 2; }
          5.88%, 97.65% { opacity: 0; z-index: 1; }
          100% { opacity: 1; z-index: 2; }
        }

        /* Continuous Zoom/Pan Animations on the image itself */
        .hub-mosaic-img {
          width: 100%;
          height: 100%;
          object-fit: cover;
        }

        .pan-1 {
          animation: mosaicPan1 20s ease-in-out infinite alternate;
        }
        .pan-2 {
          animation: mosaicPan2 24s ease-in-out infinite alternate;
        }
        .pan-3 {
          animation: mosaicPan3 18s ease-in-out infinite alternate;
        }

        @keyframes mosaicPan1 {
          0% { transform: scale(1.05) translate(0, 0); }
          100% { transform: scale(1.18) translate(-3%, 2%); }
        }
        @keyframes mosaicPan2 {
          0% { transform: scale(1.2) translate(2%, -2%); }
          100% { transform: scale(1.05) translate(-1%, 1%); }
        }
        @keyframes mosaicPan3 {
          0% { transform: scale(1.1) translate(-2%, -1%); }
          100% { transform: scale(1.22) translate(2%, 3%); }
        }

        .hub-mosaic-overlay {
          position: absolute;
          top: 0;
          left: 0;
          width: 100%;
          height: 100%;
          background: linear-gradient(to top, rgba(9, 9, 11, 0.95) 15%, rgba(9, 9, 11, 0.4) 60%, rgba(9, 9, 11, 0.15) 100%);
          z-index: 1;
        }

        @media (max-width: 900px) {
          .hub-mosaic-bg {
            grid-template-columns: repeat(2, 1fr);
          }
          .hub-mosaic-cell:nth-child(3) {
            display: none;
          }
        }

        @media (max-width: 600px) {
          .hub-mosaic-bg {
            grid-template-columns: 1fr;
          }
          .hub-mosaic-cell:nth-child(2) {
            display: none;
          }
          .hub-mosaic-header {
            height: 320px;
            padding: 2rem;
          }
        }

        @media (max-width: 900px) {
          .hub-hero,
          .hub-card-grid,
          .hub-section-band,
          .hub-profile-row,
          .hub-portal-grid,
          .hub-secondary-grid,
          .hub-policy-grid {
            grid-template-columns: 1fr;
          }

          .hub-hero {
            padding: 2rem 1.5rem;
            gap: 1.5rem;
            margin-top: 1rem;
          }

          .hub-hero-panel {
            grid-template-columns: repeat(3, minmax(0, 1fr));
          }

          .hub-portal-card {
            min-height: 0;
          }

          .hub-stat.state {
            border-color: rgba(224, 90, 71, 0.35);
            background: linear-gradient(135deg, rgba(224, 90, 71, 0.14), rgba(255,255,255,0.01));
          }
          .hub-stat.state strong {
            color: #f0956a;
          }

          .hub-stat.local {
            border-color: rgba(0, 180, 216, 0.35);
            background: linear-gradient(135deg, rgba(0, 180, 216, 0.14), rgba(255,255,255,0.01));
          }
          .hub-stat.local strong {
            color: #62d7ee;
          }

          .hub-stat.secure {
            border-color: rgba(245, 158, 11, 0.35);
            background: linear-gradient(135deg, rgba(245, 158, 11, 0.14), rgba(255,255,255,0.01));
          }
          .hub-stat.secure strong {
            color: #fbbf24;
          }
        }

        @media (max-width: 768px) {
          .hub-primary-grid,
          .hub-share-grid {
            grid-template-columns: 1fr;
            gap: 1.25rem;
          }
        }

        @media (max-width: 640px) {
          .hub-nav {
            align-items: flex-start;
            flex-direction: column;
            gap: 0.85rem;
            padding: 1rem;
          }

          .hub-nav-actions {
            width: 100%;
            flex-wrap: wrap;
            gap: 0.4rem;
          }

          .hub-nav-pill {
            flex: 1 1 auto;
            min-height: 38px;
            padding: 0 0.65rem;
            font-size: 0.8rem;
            text-align: center;
          }

          .hub-live-badge {
            margin-left: auto;
            padding: 0.4rem 0;
            font-size: 0.68rem;
          }

          .hub-hero {
            padding: 1.75rem 1rem;
            gap: 1.25rem;
          }

          .hub-input-grid,
          .hub-button-grid,
          .hub-process-grid {
            grid-template-columns: 1fr;
          }

          .hub-hero-panel {
            grid-template-columns: repeat(3, minmax(0, 1fr));
            gap: 0.5rem;
            margin-top: 0.5rem;
            width: 100%;
          }

          .hub-stat {
            padding: 0.55rem 0.45rem;
            border-radius: 8px;
            text-align: center;
          }

          .hub-stat strong {
            font-size: 0.95rem;
          }

          .hub-stat span {
            font-size: 0.68rem;
            margin-top: 0.15rem;
            line-height: 1.25;
          }

          .hub-hero-actions {
            flex-direction: column;
          }

          .hub-primary-action,
          .hub-secondary-action,
          .hub-form-button {
            width: 100%;
          }
        }

        @media (max-width: 600px) {
          .hub-footer {
            flex-direction: column;
            align-items: center;
            gap: 0.75rem;
            padding: 1.5rem 1rem;
          }
        }
      `}</style>
    </div>
  );
}

function PortalCard({
  accent,
  eyebrow,
  icon,
  title,
  body,
  features,
  cta,
  detail,
  active,
  onClick,
  onMouseEnter,
  onMouseLeave,
}) {
  return (
    <button
      className={active ? `hub-portal-card ${accent} active` : `hub-portal-card ${accent}`}
      type="button"
      onClick={onClick}
      onMouseEnter={onMouseEnter}
      onMouseLeave={onMouseLeave}
    >
      <div className="hub-portal-icon">
        <span className="material-symbols-outlined">{icon}</span>
      </div>
      <span className="hub-portal-eyebrow">{eyebrow}</span>
      <h2>{title}</h2>
      <p>{body}</p>
      <ul>
        {features.map(({ icon: featureIcon, text }) => (
          <li key={text}>
            <span className="material-symbols-outlined">{featureIcon}</span>
            {text}
          </li>
        ))}
      </ul>
      <div className="hub-portal-cta">
        <div>
          <strong>{cta}</strong>
          <span>{detail}</span>
        </div>
        <span className="material-symbols-outlined">arrow_forward</span>
      </div>
    </button>
  );
}
