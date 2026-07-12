import { useState, useEffect, useRef } from 'react';
import { getArtists, getFundingSources, getProjects, submitArtistToGoogleSheet, fetchArtistsFromGoogleSheet, syncLocalArtistsToGoogleSheet, getGoogleSheetsConfig, saveGoogleSheetsConfig, saveFundingSource, saveProject, broadcastOpportunityToAllArtists, submitOpportunityToGoogleSheet, deleteOpportunityFromGoogleSheet, deleteFundingSource, testGoogleSheetsConnection, deleteArtistLocally, deleteArtistFromGoogleSheet, fetchFundingSourcesFromGoogleSheet, syncLocalFundingSourcesToGoogleSheet } from './data/mockDatabase';
import { db, auth } from './firebase';
import { signInWithEmailAndPassword, createUserWithEmailAndPassword } from 'firebase/auth';
import { collection, query, onSnapshot, doc, setDoc, deleteDoc } from 'firebase/firestore';
import ArtistDirectory from './components/ArtistDirectory';
import CRMManager from './components/CRMManager';
import AddArtistModal from './components/AddArtistModal';
import AddOpportunityModal from './components/AddOpportunityModal';
import FundingSources from './components/FundingSources';
import ProjectPipeline from './components/ProjectPipeline';
import ArtistQuestionnaire from './components/ArtistQuestionnaire';
import MobileShareModal from './components/MobileShareModal';
import GrantApplicationAssistant from './components/GrantApplicationAssistant';
import ClientAccountPortal from './components/ClientAccountPortal';
import HubHomepage from './components/HubHomepage';
import ArtInNeedDashboard from './components/ArtInNeedDashboard';
import ILASyncDashboard from './components/ILASyncDashboard';
import ProjectMap from './components/ProjectMap';


// ── Admin credentials ────────────────────────────────────────────────────────
const ADMIN_EMAIL    = 'faal@eazy.media';
const ADMIN_PASSWORD = 'Lifeline1';
const SESSION_KEY    = 'ila_admin_auth';

// ── Admin Login Gate ──────────────────────────────────────────────────────────
function AdminLoginGate({ onSuccess }) {
  const [email, setEmail]       = useState('');
  const [password, setPassword] = useState('');
  const [showPass, setShowPass] = useState(false);
  const [error, setError]       = useState(false);
  const [shaking, setShaking]   = useState(false);
  const emailRef = useRef(null);

  useEffect(() => { emailRef.current?.focus(); }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (email.trim().toLowerCase() === ADMIN_EMAIL && password === ADMIN_PASSWORD) {
      try {
        await signInWithEmailAndPassword(auth, email.trim().toLowerCase(), password);
      } catch (authErr) {
        if (authErr.code === 'auth/user-not-found' || authErr.code === 'auth/invalid-credential') {
          try {
            await createUserWithEmailAndPassword(auth, email.trim().toLowerCase(), password);
          } catch (createErr) {
            console.error('[Admin Auth] Programmatic creation failed:', createErr);
          }
        } else {
          console.error('[Admin Auth] Sign in failed:', authErr);
        }
      }
      sessionStorage.setItem(SESSION_KEY, '1');
      onSuccess();
    } else {
      setError(true);
      setShaking(true);
      setPassword('');
      setTimeout(() => { setShaking(false); setError(false); }, 1800);
    }
  };

  return (
    <div style={{
      minHeight: '100vh',
      background: 'radial-gradient(ellipse at 20% 50%, rgba(224,90,71,0.12) 0%, transparent 60%), radial-gradient(ellipse at 80% 20%, rgba(167,139,250,0.08) 0%, transparent 60%), #0d0d0f',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      fontFamily: "'Space Grotesk', 'Inter', sans-serif",
      padding: '2rem',
    }}>
      <div style={{
        width: '100%',
        maxWidth: '420px',
        background: 'rgba(255,255,255,0.04)',
        border: '1px solid rgba(255,255,255,0.09)',
        borderRadius: '20px',
        padding: '3rem 2.5rem',
        backdropFilter: 'blur(20px)',
        boxShadow: '0 32px 64px rgba(0,0,0,0.5)',
        transform: shaking ? 'none' : 'none',
        animation: shaking ? 'shake 0.4s ease' : 'none',
      }}>
        <div style={{ textAlign: 'center', marginBottom: '2.5rem' }}>
          <div style={{ fontSize: '2.4rem', fontWeight: 900, letterSpacing: '-0.02em', color: '#fff' }}>
            ILA<span style={{ color: '#e05a47' }}>GALLERY</span>
          </div>
          <div style={{ fontSize: '0.78rem', color: 'rgba(255,255,255,0.4)', letterSpacing: '0.2em', textTransform: 'uppercase', marginTop: '0.4rem' }}>
            Admin Access Required
          </div>
        </div>

        <form onSubmit={handleSubmit}>
          {/* Email */}
          <label style={{ display: 'block', fontSize: '0.78rem', color: 'rgba(255,255,255,0.45)', letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: '0.5rem' }}>
            Email
          </label>
          <input
            ref={emailRef}
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="admin@example.com"
            autoComplete="username"
            style={{
              width: '100%',
              padding: '0.85rem 1rem',
              background: 'rgba(0,0,0,0.45)',
              border: error ? '1px solid rgba(255,80,80,0.7)' : '1px solid rgba(255,255,255,0.12)',
              borderRadius: '10px',
              color: '#fff',
              fontSize: '1rem',
              outline: 'none',
              boxSizing: 'border-box',
              fontFamily: 'inherit',
              transition: 'border 0.2s',
              marginBottom: '1rem',
            }}
          />

          {/* Password */}
          <label style={{ display: 'block', fontSize: '0.78rem', color: 'rgba(255,255,255,0.45)', letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: '0.5rem' }}>
            Password
          </label>
          <div style={{ position: 'relative' }}>
            <input
              type={showPass ? 'text' : 'password'}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              autoComplete="current-password"
              style={{
                width: '100%',
                padding: '0.85rem 3rem 0.85rem 1rem',
                background: 'rgba(0,0,0,0.45)',
                border: error ? '1px solid rgba(255,80,80,0.7)' : '1px solid rgba(255,255,255,0.12)',
                borderRadius: '10px',
                color: '#fff',
                fontSize: '1rem',
                outline: 'none',
                boxSizing: 'border-box',
                fontFamily: 'inherit',
                transition: 'border 0.2s',
              }}
            />
            <button
              type="button"
              onClick={() => setShowPass(p => !p)}
              style={{
                position: 'absolute', right: '0.9rem', top: '50%', transform: 'translateY(-50%)',
                background: 'none', border: 'none', cursor: 'pointer',
                color: 'rgba(255,255,255,0.35)', fontSize: '1.1rem', padding: 0, lineHeight: 1,
              }}
              tabIndex={-1}
              aria-label={showPass ? 'Hide password' : 'Show password'}
            >
              {showPass ? '🙈' : '👁'}
            </button>
          </div>

          {error && (
            <p style={{ color: 'rgba(255,90,90,0.9)', fontSize: '0.82rem', marginTop: '0.6rem', marginBottom: 0 }}>
              Incorrect email or password. Please try again.
            </p>
          )}

          <button
            type="submit"
            style={{
              marginTop: '1.5rem',
              width: '100%',
              padding: '0.9rem',
              background: '#e05a47',
              border: 'none',
              borderRadius: '10px',
              color: '#fff',
              fontSize: '0.95rem',
              fontWeight: 700,
              cursor: 'pointer',
              letterSpacing: '0.03em',
              boxShadow: '0 4px 16px rgba(224,90,71,0.35)',
              fontFamily: 'inherit',
            }}
          >
            Sign In to Dashboard
          </button>
        </form>

        <p style={{ marginTop: '2rem', textAlign: 'center', fontSize: '0.78rem', color: 'rgba(255,255,255,0.2)' }}>
          This area is restricted to ILA Gallery administrators only.
        </p>
      </div>

      <style>{`
        @keyframes shake {
          0%,100% { transform: translateX(0); }
          20%      { transform: translateX(-10px); }
          40%      { transform: translateX(10px); }
          60%      { transform: translateX(-8px); }
          80%      { transform: translateX(8px); }
        }
      `}</style>
    </div>
  );
}

// ── Public Entryway Segmented Role Portal ─────────────────────────────────────
function PublicPortal({ onAdminToggle }) {
  const params = new URLSearchParams(typeof window !== 'undefined' ? window.location.search : '');
  const [view, setView] = useState(() => {
    const roleParam = params.get('role');
    const rfqParam  = params.get('rfq');
    if (roleParam === 'commissioner' || rfqParam === 'true') return 'commissioner';
    if (roleParam === 'artist') return 'artist';
    return 'home'; // Default: show the split-screen homepage
  });

  const handleNavigate = (destination) => {
    setView(destination);
    // Always start at the top of the new view — critical on mobile
    window.scrollTo({ top: 0, behavior: 'instant' });
    // Update URL without full reload
    const url = new URL(window.location.href);
    url.searchParams.delete('tab');
    if (destination === 'home') {
      url.searchParams.delete('role');
      url.searchParams.delete('rfq');
    } else if (destination === 'commissioner') {
      url.searchParams.set('role', 'commissioner');
      url.searchParams.delete('rfq');
    } else {
      url.searchParams.set('role', 'artist');
      url.searchParams.delete('rfq');
    }
    window.history.replaceState(null, '', url.toString());
  };

  // Show the split-screen homepage
  if (view === 'home') {
    return <HubHomepage onNavigate={handleNavigate} onAdminToggle={onAdminToggle} />;
  }

  // Show the chosen portal form with a back button in the header
  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg-dark)', display: 'flex', flexDirection: 'column' }}>
      
      {/* Sticky segmented glass header */}
      <header style={{
        position: 'sticky', top: 0, zIndex: 100,
        background: 'rgba(13, 13, 15, 0.7)',
        backdropFilter: 'blur(20px)',
        borderBottom: '1px solid rgba(255, 255, 255, 0.05)',
        padding: '0.85rem 2rem',
        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
        flexWrap: 'wrap', gap: '1rem'
      }}>
        {/* Logo + back link */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <button
            type="button"
            onClick={() => handleNavigate('home')}
            style={{
              display: 'flex', alignItems: 'center', gap: '0.35rem',
              background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)',
              borderRadius: '8px', padding: '0.4rem 0.75rem',
              color: 'rgba(255,255,255,0.55)', fontSize: '0.78rem', cursor: 'pointer',
              fontFamily: "'Space Grotesk', sans-serif", letterSpacing: '0.03em',
              transition: 'all 0.2s ease',
            }}
            aria-label="Back to homepage"
          >
            <span className="material-symbols-outlined" style={{ fontSize: '0.9rem' }}>arrow_back</span>
            Home
          </button>
          <span style={{ fontSize: '1.3rem', fontWeight: 900, color: '#fff', letterSpacing: '-0.5px', fontFamily: "'Space Grotesk', sans-serif" }}>
            ILA<span style={{ color: view === 'artist' ? 'var(--accent-terracotta)' : 'var(--accent-electric)' }}>GALLERY</span>
          </span>
          <span style={{ fontSize: '0.7rem', color: 'rgba(255,255,255,0.3)', letterSpacing: '0.15em', textTransform: 'uppercase', borderLeft: '1px solid rgba(255,255,255,0.1)', paddingLeft: '0.5rem', fontFamily: "'Outfit', sans-serif" }}>
            {view === 'artist' ? 'Artist Registry' : 'Art in Need Portal'}
          </span>
        </div>

        {/* Portal switcher */}
        <div style={{
          display: 'flex', background: 'rgba(255,255,255,0.03)',
          border: '1px solid rgba(255,255,255,0.08)', borderRadius: '14px',
          padding: '4px', gap: '2px'
        }}>
          <button
            type="button"
            onClick={() => handleNavigate('artist')}
            style={{
              padding: '0.55rem 1.1rem', borderRadius: '10px', border: 'none',
              background: view === 'artist' ? 'var(--accent-terracotta)' : 'transparent',
              color: '#fff', fontWeight: 700, fontSize: '0.82rem', cursor: 'pointer',
              display: 'flex', alignItems: 'center', gap: '0.4rem',
              transition: 'all 0.3s cubic-bezier(0.16, 1, 0.3, 1)',
              fontFamily: "'Space Grotesk', sans-serif",
              boxShadow: view === 'artist' ? '0 4px 12px rgba(224, 90, 71, 0.3)' : 'none'
            }}
          >
            <span className="material-symbols-outlined" style={{ fontSize: '0.95rem' }}>palette</span>
            Artist Registry
          </button>
          <button
            type="button"
            onClick={() => handleNavigate('commissioner')}
            style={{
              padding: '0.55rem 1.1rem', borderRadius: '10px', border: 'none',
              background: view === 'commissioner' ? 'var(--accent-electric)' : 'transparent',
              color: '#fff', fontWeight: 700, fontSize: '0.82rem', cursor: 'pointer',
              display: 'flex', alignItems: 'center', gap: '0.4rem',
              transition: 'all 0.3s cubic-bezier(0.16, 1, 0.3, 1)',
              fontFamily: "'Space Grotesk', sans-serif",
              boxShadow: view === 'commissioner' ? '0 4px 12px rgba(0, 180, 216, 0.3)' : 'none'
            }}
          >
            <span className="material-symbols-outlined" style={{ fontSize: '0.95rem' }}>campaign</span>
            Art in Need Portal
          </button>
        </div>
      </header>

      {/* Active portal form */}
      <main style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
        {view === 'artist' ? (
          <div style={{ animation: 'fadeIn 0.4s ease-out', flex: 1, display: 'flex', flexDirection: 'column' }}>
            <ArtistQuestionnaire />
          </div>
        ) : (
          <div style={{ animation: 'fadeIn 0.4s ease-out', flex: 1, display: 'flex', flexDirection: 'column' }}>
            <ClientAccountPortal />
          </div>
        )}
      </main>
    </div>
  );
}

// ── Main App ──────────────────────────────────────────────────────────────────
function App() {
  const params = new URLSearchParams(typeof window !== 'undefined' ? window.location.search : '');
  const [isAdminRoute, setIsAdminRoute] = useState(() => {
    return params.get('admin') !== null || params.get('dev') === 'true';
  });
  const isBeta       = params.get('beta') === 'true'  || params.get('dev') === 'true';

  const [isAuthenticated, setIsAuthenticated] = useState(() => {
    const paramsInit = new URLSearchParams(typeof window !== 'undefined' ? window.location.search : '');
    const isAdmin = paramsInit.get('admin') !== null || paramsInit.get('dev') === 'true';
    if (!isAdmin) return false;
    return sessionStorage.getItem(SESSION_KEY) === '1';
  });

  const [artists, setArtists] = useState(() => getArtists());
  const [crmCount, setCrmCount] = useState(0);
  const [isSyncing, setIsSyncing] = useState(false);
  const [sheetsConfig, setSheetsConfig] = useState(() => getGoogleSheetsConfig());
  const [syncDiagnostics, setSyncDiagnostics] = useState({ status: 'checking', message: 'Checking connection to Google Sheets...' });
  const [preloadedAssistantBudget, setPreloadedAssistantBudget] = useState(null);
  const [selectedFundingSource, setSelectedFundingSource] = useState(null);
  const [assistantSubTab, setAssistantSubTab] = useState('map');
  const [assistantResourceSearch] = useState('');
  const [assistantResourceHighlightId, setAssistantResourceHighlightId] = useState(null);
  const [highlightedProjectId, setHighlightedProjectId] = useState(null);
  const [applyCounter, setApplyCounter] = useState(0);
  const [fundingSources, setFundingSources] = useState(() => getFundingSources());
  const [projects, setProjects] = useState(() => getProjects());
  const [mapFocusItemId, setMapFocusItemId] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isOpportunityModalOpen, setIsOpportunityModalOpen] = useState(false);
  const [activeTab, setActiveTab] = useState('dashboard');
  const [isShareModalOpen, setIsShareModalOpen] = useState(false);

  // Pick up "Build Proposal" intent from the artist portal
  useEffect(() => {
    try {
      const raw = sessionStorage.getItem('ila_grant_preload');
      if (raw) {
        const source = JSON.parse(raw);
        sessionStorage.removeItem('ila_grant_preload');
        // Short delay so the dashboard renders first
        setTimeout(() => {
          setSelectedFundingSource(source);
          setPreloadedAssistantBudget(source.amount);
          setAssistantSubTab('copilot');
          setApplyCounter(c => c + 1);
          setActiveTab('grant-assistant');
        }, 300);
      }
    } catch {}
    // Also handle hash-based deep link
    if (window.location.hash === '#grant-assistant') {
      window.history.replaceState(null, '', window.location.pathname + window.location.search);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleTabChange = (tabName) => {
    setActiveTab(tabName);
    setHighlightedProjectId(null);
    setAssistantResourceHighlightId(null);
    // Reset focus item on tab change unless navigating to map
    if (tabName !== 'map') setMapFocusItemId(null);
  };

  const handleLocateOnMap = (itemId) => {
    setMapFocusItemId(itemId);
    setActiveTab('map');
  };

  const handleConfigChange = (url, isEnabled) => {
    saveGoogleSheetsConfig(url, isEnabled);
    setSheetsConfig({ url, isEnabled });
  };

  useEffect(() => {
    if (!isAuthenticated) return;
    const syncData = async () => {
      setIsSyncing(true);
      try {
        // Sync artists
        const syncResult = await syncLocalArtistsToGoogleSheet(true);
        if (syncResult.success && syncResult.updatedList) {
          setArtists(syncResult.updatedList);
        } else {
          const synced = await fetchArtistsFromGoogleSheet(true);
          setArtists(synced);
        }
      } catch (err) {
        console.error('Initial background sync failed:', err);
      }

      try {
        // Sync funding sources
        const fsSyncResult = await syncLocalFundingSourcesToGoogleSheet(true);
        if (fsSyncResult.success && fsSyncResult.updatedList) {
          setFundingSources(fsSyncResult.updatedList);
        } else {
          const fsSynced = await fetchFundingSourcesFromGoogleSheet(true);
          setFundingSources(fsSynced);
        }
      } catch (fsSyncErr) {
        console.error('Initial background funding sources sync failed:', fsSyncErr);
      } finally {
        setIsSyncing(false);
      }
    };
    syncData();
  }, [isAuthenticated]);

  // Real-time Firestore sync for funding sources and projects
  useEffect(() => {
    // 1. Listen to Firestore funding_sources collection
    const qFunding = query(collection(db, 'funding_sources'));
    const unsubscribeFunding = onSnapshot(qFunding, (snapshot) => {
      if (snapshot.empty) {
        // Seed Firestore remote collection with local default funding sources
        const localSources = getFundingSources();
        localSources.forEach(async (source) => {
          try {
            await setDoc(doc(db, 'funding_sources', source.id), source);
          } catch (err) {
            console.error('[Firestore] Failed seeding funding source:', err);
          }
        });
      } else {
        const remoteSources = [];
        snapshot.forEach(d => {
          const data = d.data();
          const isClosed = data.closeDate && new Date(data.closeDate + 'T23:59:00') < new Date();
          if (isClosed && !data.isCommunityPost) {
            // Delete closed official funding sources from Firestore
            deleteDoc(doc(db, 'funding_sources', d.id)).catch(err => console.error(err));
          } else {
            remoteSources.push({ id: d.id, ...data });
          }
        });

        const localSources = getFundingSources();
        const mergedMap = new Map();
        
        // Populate local first
        localSources.forEach(s => mergedMap.set(s.id, s));
        // Remote overrides/appends
        remoteSources.forEach(s => mergedMap.set(s.id, s));

        const finalSources = Array.from(mergedMap.values());
        localStorage.setItem('303_artway_funding_v10', JSON.stringify(finalSources));
        setFundingSources(finalSources);
      }
    }, (err) => {
      console.error('[Firestore] funding_sources listener failed:', err);
    });

    // 2. Listen to Firestore projects collection
    const qProjects = query(collection(db, 'projects'));
    const unsubscribeProjects = onSnapshot(qProjects, (snapshot) => {
      if (snapshot.empty) {
        // Seed Firestore remote collection with local default projects
        const localProjects = getProjects();
        localProjects.forEach(async (project) => {
          try {
            await setDoc(doc(db, 'projects', project.id), project);
          } catch (err) {
            console.error('[Firestore] Failed seeding project:', err);
          }
        });
      } else {
        const remoteProjects = [];
        snapshot.forEach(d => {
          remoteProjects.push({ id: d.id, ...d.data() });
        });

        const localProjects = getProjects();
        const mergedMap = new Map();

        localProjects.forEach(p => mergedMap.set(p.id, p));
        remoteProjects.forEach(p => mergedMap.set(p.id, p));

        const finalProjects = Array.from(mergedMap.values());
        localStorage.setItem('303_artway_projects_v9', JSON.stringify(finalProjects));
        setProjects(finalProjects);
      }
    }, (err) => {
      console.error('[Firestore] projects listener failed:', err);
    });

    return () => {
      unsubscribeFunding();
      unsubscribeProjects();
    };
  }, []);

  useEffect(() => {
    const qCrm = query(collection(db, 'crmContacts'));
    const unsubscribeCrm = onSnapshot(qCrm, (snapshot) => {
      setCrmCount(snapshot.size);
    }, (err) => {
      console.error('[Firestore] crmContacts count listener failed:', err);
    });
    return unsubscribeCrm;
  }, []);

  useEffect(() => {
    if (!isAuthenticated) return;
    let active = true;
    
    const runDiagnostics = async () => {
      setSyncDiagnostics({ status: 'checking', message: 'Checking connection to Google Sheets...' });
      const result = await testGoogleSheetsConnection(sheetsConfig.url);
      if (active) {
        setSyncDiagnostics(result);
      }
    };
    
    runDiagnostics();
    
    return () => {
      active = false;
    };
  }, [sheetsConfig.url, isAuthenticated]);

  const handleAddArtist = async (newArtist) => {
    const nameParts = (newArtist.name || '').trim().split(/\s+/);
    const firstName = nameParts[0] || 'Unknown';
    const lastName = nameParts.slice(1).join(' ') || '';
    const secondaryMediums = newArtist.mediums || [];
    const primaryMedium = secondaryMediums[0] || '';

    const artistToSubmit = {
      firstName, lastName, alias: '', pronouns: '', bipocIdentity: '',
      communityAffiliations: newArtist.neighborhood || '',
      email: newArtist.email || '', phone: '', website: '', instagram: '', linkedin: '',
      city: 'Denver', state: 'CO', primaryMedium, secondaryMediums,
      artStyles: [], themes: [],
      experienceLevel: newArtist.experience || 'Emerging',
      publicArtExperience: false, muralExperience: false,
      communityEngagementExperience: false, youthEngagementExperience: false,
      teachingExperience: false, licensingInsurance: false,
      sculptureInstallationExperience: false, galleryInstallationExperience: false,
      curationExperience: false, otherInstallationExperience: false,
      digitalExperience: false, capabilitiesDescription: '',
      scaleCapability: [], collaborationPreference: 'Both',
      availabilityStatus: 'Available', budgetRange: '',
      notableProjects: '', references: '', accessibilityNeeds: '',
      vettingStatus: 'New'
    };

    const result = await submitArtistToGoogleSheet(artistToSubmit);
    if (result.updated) {
      setArtists(result.updated);
    } else {
      setArtists(getArtists());
    }
    setIsModalOpen(false);
  };

  const handleSaveOpportunity = async (newOpportunity) => {
    if (newOpportunity.destType === 'funding') {
      const serial = fundingSources.length + 1;
      const opportunityToSubmit = {
        id: `f${serial}`, title: newOpportunity.title, provider: newOpportunity.provider,
        type: newOpportunity.type, amount: newOpportunity.amount, status: 'Open',
        openDate: newOpportunity.openDate, closeDate: newOpportunity.closeDate,
        description: newOpportunity.description, url: newOpportunity.url,
        whoShouldApply: newOpportunity.whoShouldApply || 'All Eligible Artists'
      };
      const updated = saveFundingSource(opportunityToSubmit);
      setFundingSources(updated);

      // Save to remote Firestore:
      try {
        await setDoc(doc(db, 'funding_sources', opportunityToSubmit.id), opportunityToSubmit);
      } catch (fsErr) {
        console.error("[Firestore] Failed to save funding source:", fsErr);
      }

      // Sync opportunity to Google Sheets (awaited so errors surface)
      try {
        await submitOpportunityToGoogleSheet(opportunityToSubmit);
      } catch (sheetErr) {
        console.error("[Dashboard] Failed to sync opportunity to Google Sheets:", sheetErr);
      }

      if (newOpportunity.broadcast) {
        setIsSyncing(true);
        try {
          const res = await broadcastOpportunityToAllArtists(opportunityToSubmit);
          if (res.success) alert(`📢 Broadcast complete! Alert emails dispatched to all ${res.recipientCount || artists.length} registered artists.`);
        } catch (e) { console.error('Broadcast failed:', e); }
        finally { setIsSyncing(false); }
      }
    } else {
      const serial = projects.length + 1;
      const projectToSubmit = {
        id: `p${serial}`, name: newOpportunity.title, provider: newOpportunity.provider,
        status: 'Concept', budget: newOpportunity.amount, funding: 'Pending',
        openDate: newOpportunity.openDate, closeDate: newOpportunity.closeDate,
        description: newOpportunity.description, url: newOpportunity.url,
        whoShouldApply: newOpportunity.whoShouldApply || 'All Eligible Artists'
      };
      const updated = saveProject(projectToSubmit);
      setProjects(updated);

      // Save to remote Firestore:
      try {
        await setDoc(doc(db, 'projects', projectToSubmit.id), projectToSubmit);
      } catch (fsErr) {
        console.error("[Firestore] Failed to save project:", fsErr);
      }

      if (newOpportunity.broadcast) {
        setIsSyncing(true);
        try {
          const res = await broadcastOpportunityToAllArtists(projectToSubmit);
          if (res.success) alert(`📢 Broadcast complete! Alert emails dispatched to all ${res.recipientCount || artists.length} registered artists.`);
        } catch (e) { console.error('Broadcast failed:', e); }
        finally { setIsSyncing(false); }
      }
    }
    setIsOpportunityModalOpen(false);
  };

  const handleSyncFundingSources = async () => {
    setIsSyncing(true);
    try {
      const res = await syncLocalFundingSourcesToGoogleSheet(true);
      if (res.success && res.updatedList) {
        setFundingSources(res.updatedList);
        
        // Push remote updates/deletions to Firestore
        res.updatedList.forEach(async (source) => {
          try {
            await setDoc(doc(db, 'funding_sources', source.id), source);
          } catch (err) {
            console.error('[Firestore] Failed to update Firestore on sheet sync:', err);
          }
        });
        
        alert(res.message || "Funding sources synchronized successfully!");
      } else {
        alert("Sync failed: " + (res.message || "Unknown error"));
      }
    } catch (err) {
      console.error("Failed manual funding sources sync:", err);
      alert("Error: " + err.message);
    } finally {
      setIsSyncing(false);
    }
  };

  const handleDeleteOpportunity = async (oppId) => {
    if (!oppId) return;
    if (window.confirm("Are you sure you want to remove this opportunity? This will permanently delete it from both the dashboard and the Google Sheet.")) {
      // 1. Delete locally from localStorage & state
      const updated = deleteFundingSource(oppId);
      setFundingSources(updated);

      // Delete from remote Firestore
      try {
        await deleteDoc(doc(db, 'funding_sources', oppId));
        await deleteDoc(doc(db, 'projects', oppId));
      } catch (fsErr) {
        console.error("[Firestore] Failed to delete from Firestore:", fsErr);
      }
      
      // 2. Delete from Google Sheets in background
      setIsSyncing(true);
      try {
        const res = await deleteOpportunityFromGoogleSheet(oppId);
        if (res && res.success) {
          alert("Opportunity removed successfully from the dashboard and Google Sheet!");
        } else {
          alert("Opportunity removed locally. Google Sheets update skipped or pending sync.");
        }
      } catch (e) {
        console.error("Failed to delete opportunity from Google Sheet:", e);
        alert("Opportunity removed locally, but failed to sync deletion to Google Sheet.");
      } finally {
        setIsSyncing(false);
      }
    }
  };

  const handleDeleteArtist = async (artistId) => {
    if (!artistId) return;
    
    // 1. Delete locally and refresh state
    const updated = deleteArtistLocally(artistId);
    setArtists(updated);
    
    // 2. Perform silent background sync deletion from Google Sheet
    setIsSyncing(true);
    try {
      const res = await deleteArtistFromGoogleSheet(artistId);
      if (res && res.success) {
        alert("Artist profile successfully removed from both the dashboard and the Google Sheet!");
      } else {
        alert("Artist profile removed locally. Google Sheets update pending sync.");
      }
    } catch (e) {
      console.error("Failed to sync artist deletion to Google Sheet:", e);
      alert("Artist profile removed locally, but failed to sync deletion to Google Sheet.");
    } finally {
      setIsSyncing(false);
    }
  };

  // ── PUBLIC DEFAULT: show both intake forms ───────────────────────────────
  if (!isAdminRoute) {
    return <PublicPortal onAdminToggle={() => setIsAdminRoute(true)} />;
  }

  // ── ADMIN ROUTE but not authenticated: show login gate ───────────────────
  if (!isAuthenticated) {
    return <AdminLoginGate onSuccess={() => setIsAuthenticated(true)} />;
  }

  // ── AUTHENTICATED ADMIN DASHBOARD ─────────────────────────────────────────
  return (
    <div className="app-container">
      <aside className="sidebar">
        <div className="logo-container">
          <div className="logo">ILA<span>GALLERY</span></div>
          <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', letterSpacing: '0.5px', textTransform: 'uppercase', fontWeight: 600 }}>
            Artist Community Database
          </div>
        </div>
        
        <nav className="nav-links">
          <a className={`nav-link ${activeTab === 'dashboard' ? 'active' : ''}`} onClick={() => handleTabChange('dashboard')}>
            <span className="material-symbols-outlined">dashboard</span> Dashboard
          </a>
          <a className={`nav-link ${activeTab === 'map' ? 'active' : ''}`} onClick={() => handleTabChange('map')}>
            <span className="material-symbols-outlined" style={{ color: 'var(--accent-terracotta)' }}>explore</span> Opportunities Map
          </a>
          <a className={`nav-link ${activeTab === 'directory' ? 'active' : ''}`} onClick={() => handleTabChange('directory')}>
            <span className="material-symbols-outlined">group</span> Artist Directory
          </a>
          <a className={`nav-link ${activeTab === 'crm' ? 'active' : ''}`} onClick={() => handleTabChange('crm')}>
            <span className="material-symbols-outlined" style={{ color: 'var(--accent-ochre)' }}>contacts</span> CRM Contacts
          </a>
          <a className={`nav-link ${activeTab === 'pipeline' ? 'active' : ''}`} onClick={() => handleTabChange('pipeline')}>
            <span className="material-symbols-outlined">map</span> Project Pipeline
          </a>
          <a className={`nav-link ${activeTab === 'funding' ? 'active' : ''}`} onClick={() => handleTabChange('funding')}>
            <span className="material-symbols-outlined">account_balance</span> Funding Sources
          </a>
          <a className={`nav-link ${activeTab === 'art-in-need' ? 'active' : ''}`} onClick={() => handleTabChange('art-in-need')}>
            <span className="material-symbols-outlined" style={{ color: 'var(--accent-electric)' }}>campaign</span> Art in Need Portal
          </a>
          <a className={`nav-link ${activeTab === 'grant-assistant' ? 'active' : ''}`} onClick={() => handleTabChange('grant-assistant')}>
            <span className="material-symbols-outlined" style={{ color: 'var(--accent-terracotta)' }}>auto_awesome_motion</span> Grant Assistant
          </a>
          <a className={`nav-link ${activeTab === 'sync-dashboard' ? 'active' : ''}`} onClick={() => handleTabChange('sync-dashboard')}>
            <span className="material-symbols-outlined" style={{ color: 'var(--accent-electric)' }}>sync</span> Sync Command Center
          </a>


          <div style={{ margin: '1.5rem 0 0.5rem 0', borderTop: '1px solid var(--border-subtle)' }}></div>
          
          <a href="/" target="_blank" rel="noopener noreferrer" className="nav-link">
            <span className="material-symbols-outlined">open_in_new</span> Public Intake Form
          </a>
          <a onClick={() => setIsShareModalOpen(true)} className="nav-link" style={{ color: 'var(--accent-terracotta)', cursor: 'pointer' }}>
            <span className="material-symbols-outlined">qr_code_2</span> Share &amp; Test Phone
          </a>
          <a
            onClick={() => { sessionStorage.removeItem(SESSION_KEY); window.location.href = '/'; }}
            className="nav-link"
            style={{ color: 'rgba(255,255,255,0.3)', cursor: 'pointer', marginTop: '0.5rem' }}
          >
            <span className="material-symbols-outlined">logout</span> Sign Out
          </a>
        </nav>

        <div className="sheets-config-panel">
          <div className="panel-title">
            <span className="material-symbols-outlined">cloud_sync</span>
            Google Sheets Sync
          </div>
          <p className="panel-desc">
            Link this dashboard to a live Google Sheet via Apps Script Web App URL.
          </p>
          <input 
            type="text" 
            className="config-input" 
            placeholder="Paste Apps Script Web App URL..." 
            value={sheetsConfig.url}
            onChange={(e) => handleConfigChange(e.target.value, sheetsConfig.isEnabled)}
            aria-label="Google Sheets Web App URL"
          />
          <label className="config-toggle">
            <input 
              type="checkbox" 
              checked={sheetsConfig.isEnabled}
              onChange={(e) => handleConfigChange(sheetsConfig.url, e.target.checked)}
            />
            Enable Real-Time Sync
          </label>
          
          {sheetsConfig.isEnabled && (
            <div style={{
              marginTop: '0.8rem',
              padding: '0.65rem 0.75rem',
              borderRadius: '8px',
              fontSize: '0.75rem',
              lineHeight: '1.4',
              display: 'flex',
              alignItems: 'flex-start',
              gap: '0.45rem',
              transition: 'all 0.3s ease',
              border: syncDiagnostics.status === 'success' ? '1px solid rgba(76, 175, 80, 0.25)' :
                      syncDiagnostics.status === 'warning' ? '1px solid rgba(255, 152, 0, 0.25)' :
                      syncDiagnostics.status === 'checking' ? '1px solid rgba(255, 255, 255, 0.1)' :
                      '1px solid rgba(244, 67, 54, 0.25)',
              background: syncDiagnostics.status === 'success' ? 'rgba(76, 175, 80, 0.05)' :
                          syncDiagnostics.status === 'warning' ? 'rgba(255, 152, 0, 0.05)' :
                          syncDiagnostics.status === 'checking' ? 'rgba(255, 255, 255, 0.02)' :
                          'rgba(244, 67, 54, 0.05)',
              color: syncDiagnostics.status === 'success' ? '#81c784' :
                     syncDiagnostics.status === 'warning' ? '#ffb74d' :
                     syncDiagnostics.status === 'checking' ? 'rgba(255,255,255,0.6)' :
                     '#e57373'
            }}>
              <span className={`material-symbols-outlined ${syncDiagnostics.status === 'checking' ? 'spinning' : ''}`} style={{ 
                fontSize: '1rem', 
                flexShrink: 0,
                marginTop: '1px'
              }}>
                {syncDiagnostics.status === 'success' ? 'check_circle' :
                 syncDiagnostics.status === 'warning' ? 'lock_open' :
                 syncDiagnostics.status === 'checking' ? 'sync' :
                 'error'}
              </span>
              <div>
                <strong style={{ display: 'block', marginBottom: '2px', fontWeight: 700 }}>
                  {syncDiagnostics.status === 'success' ? 'Sync Connected' :
                   syncDiagnostics.status === 'warning' ? 'Action Required' :
                   syncDiagnostics.status === 'checking' ? 'Checking Status...' :
                   'Connection Offline'}
                </strong>
                {syncDiagnostics.message}
              </div>
            </div>
          )}
        </div>
      </aside>

      <main className="main-content">
        <header className="header">
          <div>
            <h1 className="title" style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flexWrap: 'wrap' }}>
              {activeTab === 'directory' ? 'Artist Directory' : 
               activeTab === 'crm' ? 'CRM Manager' : 
               activeTab === 'pipeline' ? 'Project Pipeline' :
               activeTab === 'funding' ? 'Funding Sources' :
               activeTab === 'art-in-need' ? 'Art in Need Portal' :
               activeTab === 'grant-assistant' ? 'Grant Proposal Assistant' :
               activeTab === 'sync-dashboard' ? 'Sync Command Center' :
               activeTab === 'map' ? 'Opportunities Geospatial Map' :
               'Dashboard Overview'}
              {isSyncing && (
                <span className="sync-status" style={{ fontSize: '0.85rem', color: 'var(--accent-terracotta)', fontWeight: 500, display: 'inline-flex', alignItems: 'center', gap: '0.25rem', padding: '0.25rem 0.5rem', background: 'rgba(230, 92, 70, 0.1)', borderRadius: '4px' }}>
                  <span className="material-symbols-outlined spinning" style={{ fontSize: '1.1rem' }}>sync</span> Syncing Sheet...
                </span>
              )}
            </h1>
            <p style={{ color: 'var(--text-secondary)', marginTop: '0.5rem' }}>
              {activeTab === 'directory' ? 'Manage your local talent and public art contacts.' : 
               activeTab === 'crm' ? 'Manage gallery contacts, collectors, artists, leads, follow-ups, and notes.' : 
               activeTab === 'pipeline' ? 'Track ongoing public art installations along the ILA Gallery network.' :
               activeTab === 'funding' ? 'Active grant opportunities from Denver Arts & Venues and CaFÉ.' :
               activeTab === 'art-in-need' ? 'View and manage community creative postings, coordinate required styles, scale details, and matched talent lists.' :
               activeTab === 'grant-assistant' ? 'Interactive educational checklists, copyable proposal templates, and structural cost calculators.' :
               activeTab === 'sync-dashboard' ? 'Real-time telemetry and error recovery panel for Google Sheets integration.' :
               activeTab === 'map' ? 'Discover and analyze RFQs, grants, and technical resources plotted across Colorado.' :
               'High-level metrics for the ILA Gallery Artist Community.'}
            </p>
          </div>
          
          {activeTab === 'directory' && (
            <button className="btn-primary" onClick={() => setIsModalOpen(true)}>
              + Add Artist
            </button>
          )}
          {(activeTab === 'funding' || activeTab === 'pipeline') && (
            <div style={{ display: 'flex', gap: '0.5rem' }}>
              {activeTab === 'funding' && (
                <button 
                  className="btn-secondary" 
                  onClick={handleSyncFundingSources}
                  disabled={isSyncing}
                  style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem' }}
                >
                  <span className="material-symbols-outlined spinning" style={{ display: isSyncing ? 'inline-block' : 'none', fontSize: '1.1rem' }}>sync</span>
                  <span className="material-symbols-outlined" style={{ display: !isSyncing ? 'inline-block' : 'none', fontSize: '1.1rem' }}>sync</span>
                  Sync Google Sheets
                </button>
              )}
              <button className="btn-primary" onClick={() => setIsOpportunityModalOpen(true)}>
                + Add Opportunity
              </button>
            </div>
          )}
        </header>

        {activeTab === 'dashboard' && (
          <div>
            <div className="stats-grid">
              <div className="stat-card" onClick={() => handleTabChange('directory')} style={{ cursor: 'pointer' }}>
                <div className="stat-label"><span className="material-symbols-outlined">group</span> Total Artists</div>
                <div className="stat-value">{artists.length}</div>
              </div>
              <div className="stat-card" onClick={() => handleTabChange('pipeline')} style={{ cursor: 'pointer' }}>
                <div className="stat-label"><span className="material-symbols-outlined">map</span> Active Projects</div>
                <div className="stat-value">{projects.length}</div>
              </div>
              <div className="stat-card" onClick={() => handleTabChange('funding')} style={{ cursor: 'pointer' }}>
                <div className="stat-label"><span className="material-symbols-outlined">account_balance</span> Funding Sources</div>
                <div className="stat-value">{fundingSources.filter(f => !f.isCommunityPost).length}</div>
              </div>
              <div className="stat-card" onClick={() => handleTabChange('art-in-need')} style={{ cursor: 'pointer' }}>
                <div className="stat-label"><span className="material-symbols-outlined" style={{ color: 'var(--accent-electric)' }}>campaign</span> Art in Need Posts</div>
                <div className="stat-value">{fundingSources.filter(f => f.isCommunityPost).length}</div>
              </div>
              <div className="stat-card" onClick={() => handleTabChange('crm')} style={{ cursor: 'pointer' }}>
                <div className="stat-label"><span className="material-symbols-outlined" style={{ color: 'var(--accent-ochre)' }}>contacts</span> CRM Contacts</div>
                <div className="stat-value">{crmCount}</div>
              </div>
            </div>
            
            <div style={{
              background: 'linear-gradient(135deg, rgba(224, 90, 71, 0.08) 0%, rgba(167, 139, 250, 0.05) 50%, rgba(235, 166, 90, 0.03) 100%)',
              border: '1px solid rgba(255, 255, 255, 0.08)',
              borderRadius: '16px', padding: '2.5rem', marginTop: '1.5rem',
              display: 'flex', flexDirection: 'column', gap: '1.25rem',
              position: 'relative', overflow: 'hidden',
              boxShadow: '0 8px 32px 0 rgba(0, 0, 0, 0.2)'
            }}>
              <div style={{ position: 'absolute', top: '-50px', right: '-50px', width: '150px', height: '150px', borderRadius: '50%', background: 'var(--accent-terracotta)', filter: 'blur(80px)', opacity: 0.15 }} />
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                <span className="material-symbols-outlined" style={{ fontSize: '2rem', color: 'var(--accent-terracotta)' }}>map</span>
                <h2 style={{ fontFamily: 'Space Grotesk', fontSize: '1.4rem', margin: 0, fontWeight: 700, letterSpacing: '0.5px' }}>
                  Colorado Geospatial Opportunities Map
                </h2>
              </div>
              <p style={{ margin: 0, color: 'var(--text-secondary)', fontSize: '0.95rem', lineHeight: 1.5, maxWidth: '650px' }}>
                Discover active RFQs, municipal public art commissions, active projects, and vetted local fabricators and suppliers plotted across Colorado. Analyze budgets with the AI Copilot and locate technical resources.
              </p>
              <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginTop: '0.5rem' }}>
                <button 
                  onClick={() => { handleTabChange('map'); }}
                  className="btn-primary"
                  style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem', background: 'var(--accent-terracotta)', border: 'none', borderRadius: '8px', padding: '0.75rem 1.5rem', color: '#fff', fontWeight: 700, cursor: 'pointer', fontSize: '0.9rem', boxShadow: '0 4px 14px rgba(224, 90, 71, 0.3)' }}
                >
                  <span className="material-symbols-outlined" style={{ fontSize: '1.1rem' }}>explore</span>
                  Launch Geospatial Opportunities Map
                </button>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'directory' && (
          <ArtistDirectory 
            artists={artists} 
            onRefresh={() => setArtists(getArtists())} 
            isSyncing={isSyncing}
            onSync={async () => {
              setIsSyncing(true);
              try {
                const result = await syncLocalArtistsToGoogleSheet(true);
                if (result.success && result.updatedList) setArtists(result.updatedList);
                return result;
              } catch (err) {
                console.error('Manual sync failed:', err);
                return { success: false, message: `Sync failed: ${err.message}` };
              } finally {
                setIsSyncing(false);
              }
            }}
            onDeleteArtist={handleDeleteArtist}
          />
        )}

        {activeTab === 'crm' && (
          <CRMManager />
        )}

        {activeTab === 'pipeline' && (
          <ProjectPipeline projects={projects} highlightedProjectId={highlightedProjectId} onLocateOnMap={handleLocateOnMap} />
        )}

        {activeTab === 'funding' && (
          <FundingSources 
            sources={fundingSources.filter(f => !f.isCommunityPost && !(f.closeDate && new Date(f.closeDate + 'T23:59:00') < new Date()))} 
            isBeta={isBeta}
            onDelete={handleDeleteOpportunity}
            onLocateOnMap={handleLocateOnMap}
            onApply={(source) => {
              setSelectedFundingSource(source);
              setPreloadedAssistantBudget(source.amount);
              setAssistantSubTab('copilot');
              setApplyCounter(c => c + 1);
              handleTabChange('grant-assistant');
            }}
            onBroadcast={async (source) => {
              setIsSyncing(true);
              try {
                const res = await broadcastOpportunityToAllArtists(source);
                if (res.success) {
                  alert(`📢 Broadcast complete! Personalized alert emails dispatched to all ${res.recipientCount || artists.length} registered artists matching requested genres.`);
                } else {
                  alert(`Failed to broadcast: ${res.error}`);
                }
              } catch (e) {
                console.error('Manual broadcast failed:', e);
                alert(`Error: ${e.message}`);
              } finally {
                setIsSyncing(false);
              }
            }}
          />
        )}

        {activeTab === 'art-in-need' && (
          <ArtInNeedDashboard 
            opportunities={fundingSources.filter(f => f.isCommunityPost && !(f.closeDate && new Date(f.closeDate + 'T23:59:00') < new Date()))}
            isSyncing={isSyncing}
            isAdmin={true}
            onDelete={handleDeleteOpportunity}
            onLocateOnMap={handleLocateOnMap}
            onBroadcast={async (source) => {
              setIsSyncing(true);
              try {
                const res = await broadcastOpportunityToAllArtists(source);
                if (res.success) {
                  alert(`📢 Broadcast complete! Personalized alert emails dispatched to all ${res.recipientCount || artists.length} registered artists matching required styles, scales, and capabilities.`);
                } else {
                  alert(`Failed to broadcast: ${res.error}`);
                }
              } catch (e) {
                console.error('Manual broadcast failed:', e);
                alert(`Error: ${e.message}`);
              } finally {
                setIsSyncing(false);
              }
            }}
          />
        )}

        {activeTab === 'grant-assistant' && (
          <GrantApplicationAssistant 
            key={`gaa_${selectedFundingSource?.id || 'default'}_${applyCounter}_${assistantResourceHighlightId || 'none'}`} 
            preloadedBudget={preloadedAssistantBudget}
            selectedFundingSource={selectedFundingSource}
            onClearFundingSource={() => { setSelectedFundingSource(null); setPreloadedAssistantBudget(null); }}
            initialSubTab={assistantSubTab}
            initialResourceSearch={assistantResourceSearch}
            initialResourceHighlightId={assistantResourceHighlightId}
            projects={projects}
            fundingSources={fundingSources}
            mapFocusItemId={mapFocusItemId}
            onClearMapFocus={() => setMapFocusItemId(null)}
            onApplyFunding={(sourceOrBudget) => {
              if (sourceOrBudget && typeof sourceOrBudget === 'object') {
                setSelectedFundingSource(sourceOrBudget);
                setPreloadedAssistantBudget(sourceOrBudget.amount);
              } else {
                setPreloadedAssistantBudget(sourceOrBudget);
                const parsed = parseInt(String(sourceOrBudget).replace(/[^0-9]/g, ''), 10);
                const found = fundingSources.find(f => {
                  const amt = parseInt(f.amount.replace(/[^0-9]/g, ''), 10);
                  return amt === parsed;
                });
                if (found) setSelectedFundingSource(found);
              }
              setAssistantSubTab('copilot');
              setApplyCounter(c => c + 1);
            }}
            onNavigatePipeline={(project) => { setHighlightedProjectId(project.id); setActiveTab('pipeline'); }}
            onLocateResource={(resource) => {
              const idMapping = { 's1': 'guirys_color', 's2': 'alreco_metals', 's3': 'laird_plastics', 's4': 'tool_library', 's5': 'recreate_fab', 's6': 'sunbelt_rentals', 's7': 'peak_structural', 's8': 'kla_engineers' };
              setAssistantSubTab('resources');
              setAssistantResourceHighlightId(idMapping[resource.id] || resource.id);
              setApplyCounter(c => c + 1);
            }}
          />
        )}

        {activeTab === 'sync-dashboard' && (
          <ILASyncDashboard />
        )}

        {activeTab === 'map' && (
          <ProjectMap 
            projects={projects}
            fundingSources={fundingSources}
            mapFocusItemId={mapFocusItemId}
            onClearMapFocus={() => setMapFocusItemId(null)}
            onApplyFunding={(source) => {
              if (source && typeof source === 'object') {
                setSelectedFundingSource(source);
                setPreloadedAssistantBudget(source.amount);
              } else {
                setPreloadedAssistantBudget(source);
              }
              setAssistantSubTab('copilot');
              setApplyCounter(c => c + 1);
              handleTabChange('grant-assistant');
            }}
            onNavigatePipeline={(project) => { 
              setHighlightedProjectId(project.id); 
              setActiveTab('pipeline'); 
            }}
            onLocateResource={(resource) => {
              const idMapping = { 's1': 'guirys_color', 's2': 'alreco_metals', 's3': 'laird_plastics', 's4': 'tool_library', 's5': 'recreate_fab', 's6': 'sunbelt_rentals', 's7': 'peak_structural', 's8': 'kla_engineers' };
              setAssistantSubTab('resources');
              setAssistantResourceHighlightId(idMapping[resource.id] || resource.id);
              setApplyCounter(c => c + 1);
              setActiveTab('grant-assistant');
            }}
          />
        )}

      </main>

      <AddArtistModal 
        isOpen={isModalOpen} 
        onClose={() => setIsModalOpen(false)}
        onSave={(newArtist) => { handleAddArtist(newArtist); setArtists(getArtists()); }}
      />
      <AddOpportunityModal 
        isOpen={isOpportunityModalOpen}
        onClose={() => setIsOpportunityModalOpen(false)}
        onSave={handleSaveOpportunity}
      />
      <MobileShareModal 
        isOpen={isShareModalOpen} 
        onClose={() => setIsShareModalOpen(false)} 
      />
    </div>
  );
}

export default App;
