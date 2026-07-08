import { useState } from 'react';
import { saveArtist, submitArtistToGoogleSheet } from '../data/mockDatabase';

const MEDIUM_OPTIONS = [
  "Mural", "Sculpture", "Digital Art", "Illustration", "Fine Art", "Street Art", 
  "Oil Painting", "Printmaking", "Mixed Media", "Video", "Installation", "Graffiti", 
  "Wheatpaste", "Graphic Design", "Live Painting", "Curation", "Teaching", "Performance",
  "Singer / Vocalist", "Songwriter", "Photography", "Sculptor", "Dance / Choreography",
  "Choreographer", "Dramaturg", "Dance Dramaturg", "Movement Specialist",
  "DJ / Turntablist", "Performer / Live Act", "Lighting Director / Design",
  "Audio Engineer / Sound", "Producer / Beatmaker", "Rigger / Stagehand", "Production Assistant",
  "Model / Talent", "Actor / Actress", "Film Director / Filmmaker", "Cinematographer / DP",
  "Film / Video Editor", "Screenwriter / Writer", "Production Designer / Art Director",
  "Makeup / SFX Artist", "Costume / Wardrobe Stylist", "Gaffer / Grip / Film Crew"
].sort();

const STYLE_OPTIONS = [
  "Abstract", "Realism", "Street Art", "Graffiti", "Conceptual", "Geometrical", 
  "Pop", "Photorealism", "Pointillism", "Minimalist", "Narrative Realism", 
  "Organic Abstraction", "Indigenous Modernism", "Bold Black & White",
  "Cinematic Narrative", "Documentary / Non-Fiction", "Experimental / Avant-Garde",
  "Noir / Neo-Noir", "Electronic / Synthwave", "Hip-Hop / Lo-Fi Beats",
  "Acoustic / Indie Folk", "Cinematic Score / Soundscapes"
].sort();

const THEME_OPTIONS = [
  "Community", "Environment", "Culture", "Identity", "History", "Social Justice", 
  "Technology", "Hope", "Queer Identity", "Feminism", "Music", "Storytelling"
].sort();

export default function ArtistDirectory({ artists, onRefresh, isSyncing, onSync, onDeleteArtist }) {
  const [search, setSearch] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  const [selectedArtist, setSelectedArtist] = useState(null);
  const [syncOutcome, setSyncOutcome] = useState(null);

  const handleSync = async () => {
    if (!onSync) return;
    const res = await onSync();
    setSyncOutcome(res);
    setTimeout(() => setSyncOutcome(null), 6000);
  };

  // Expanded Filters State
  const [filters, setFilters] = useState({
    primaryMedium: '',
    secondaryMedium: '',
    artStyle: '',
    theme: '',
    experienceLevel: '',
    publicArt: 'all',
    mural: 'all',
    community: 'all',
    youthEngagement: 'all',
    teaching: 'all',
    licensing: 'all',
    sculptureInstall: 'all',
    galleryInstall: 'all',
    curation: 'all',
    otherInstall: 'all',
    digitalInstall: 'all',
    scale: '',
    collaboration: '',
    vettingStatus: '',
    residency: 'all'
  });

  const handleFilterChange = (field, value) => {
    setFilters({ ...filters, [field]: value });
  };

  const handleResetFilters = () => {
    setFilters({
      primaryMedium: '',
      secondaryMedium: '',
      artStyle: '',
      theme: '',
      experienceLevel: '',
      publicArt: 'all',
      mural: 'all',
      community: 'all',
      youthEngagement: 'all',
      teaching: 'all',
      licensing: 'all',
      sculptureInstall: 'all',
      galleryInstall: 'all',
      curation: 'all',
      otherInstall: 'all',
      digitalInstall: 'all',
      scale: '',
      collaboration: '',
      vettingStatus: '',
      residency: 'all'
    });
    setSearch('');
  };

  // Vetting & Contact updates inside Drawer
  const handleUpdateStatus = async (artist, status) => {
    const updated = { ...artist, vettingStatus: status };
    
    // Optimistically update local cache and component state first for responsive UI
    saveArtist(updated);
    setSelectedArtist(updated);
    if (onRefresh) onRefresh();
    
    // Silent background sync to Google Sheets (handles matching Artist ID row overwrite)
    try {
      await submitArtistToGoogleSheet(updated);
    } catch (err) {
      console.error('Failed to sync updated status to Google Sheets:', err);
    }
  };

  const handleLogContactToday = async (artist) => {
    const today = new Date().toISOString().split('T')[0];
    const updated = { ...artist, lastContacted: today };
    
    // Optimistically update local cache and component state first for responsive UI
    saveArtist(updated);
    setSelectedArtist(updated);
    if (onRefresh) onRefresh();
    
    try {
      await submitArtistToGoogleSheet(updated);
    } catch (err) {
      console.error('Failed to sync updated contact log to Google Sheets:', err);
    }
  };

  const handleDeleteArtistClick = async (artist) => {
    if (!artist || !artist.id) return;
    
    const fullName = `${artist.firstName || ''} ${artist.lastName || ''}`.trim() || 'this artist';
    if (window.confirm(`⚠️ Are you sure you want to permanently remove ${fullName} from the directory?\n\nThis will delete their profile locally and request deletion from the synced Google Sheet.`)) {
      setSelectedArtist(null); // Close the detail drawer
      if (onDeleteArtist) {
        await onDeleteArtist(artist.id);
      }
    }
  };

  // Multi-criteria filtering logic
  const filteredArtists = artists.filter(artist => {
    // 1. Search Query (Matches Name, Alias, City, Medium, BIPOC representation)
    const fullName = `${artist.firstName || ''} ${artist.lastName || ''} ${artist.alias || artist.name || ''}`.toLowerCase();
    const query = search.toLowerCase();
    const matchesSearch = !search || 
      fullName.includes(query) || 
      (artist.email && artist.email.toLowerCase().includes(query)) ||
      (artist.city && artist.city.toLowerCase().includes(query)) ||
      (artist.primaryMedium && artist.primaryMedium.toLowerCase().includes(query)) ||
      (artist.bipocIdentity && artist.bipocIdentity.toLowerCase().includes(query)) ||
      (artist.communityAffiliations && artist.communityAffiliations.toLowerCase().includes(query));

    // 2. Primary Medium Filter
    const artistMedium = artist.primaryMedium || (Array.isArray(artist.mediums) ? artist.mediums[0] : artist.mediums) || '';
    const matchesMedium = !filters.primaryMedium || artistMedium === filters.primaryMedium;

    // 3. Secondary Medium Filter
    const secondaryMeds = artist.secondaryMediums || (Array.isArray(artist.mediums) ? artist.mediums.slice(1) : []);
    const matchesSecondaryMedium = !filters.secondaryMedium || secondaryMeds.includes(filters.secondaryMedium);

    // 4. Art Style Filter
    const artStyles = artist.artStyles || [];
    const matchesArtStyle = !filters.artStyle || artStyles.includes(filters.artStyle);

    // 5. Theme Filter
    const themes = artist.themes || [];
    const matchesTheme = !filters.theme || themes.includes(filters.theme);

    // 6. Experience Level Filter
    const matchesExp = !filters.experienceLevel || artist.experienceLevel === filters.experienceLevel;

    // 7. Scale Capability Filter
    const artistScale = artist.scaleCapability || [];
    const matchesScale = !filters.scale || artistScale.includes(filters.scale);

    // 8. Collaboration Preference Filter
    const matchesCollaboration = !filters.collaboration || artist.collaborationPreference === filters.collaboration;

    // Residency Filter
    const isCO = String(artist.state || '').trim().toUpperCase() === 'CO';
    const matchesResidency = !filters.residency || filters.residency === 'all' ||
      (filters.residency === 'CO' && isCO) ||
      (filters.residency === 'out-of-state' && !isCO);

    // 9. Vetting Status
    const matchesVetting = !filters.vettingStatus || artist.vettingStatus === filters.vettingStatus;

    // 10. Public Art Experience
    const matchesPublic = filters.publicArt === 'all' || 
      (filters.publicArt === 'yes' && artist.publicArtExperience === true) ||
      (filters.publicArt === 'no' && !artist.publicArtExperience);

    // 11. Mural Experience
    const matchesMural = filters.mural === 'all' || 
      (filters.mural === 'yes' && artist.muralExperience === true) ||
      (filters.mural === 'no' && !artist.muralExperience);

    // 12. Community Engagement
    const matchesCommunity = filters.community === 'all' || 
      (filters.community === 'yes' && artist.communityEngagementExperience === true) ||
      (filters.community === 'no' && !artist.communityEngagementExperience);

    // 13. Youth Engagement
    const matchesYouth = filters.youthEngagement === 'all' ||
      (filters.youthEngagement === 'yes' && artist.youthEngagementExperience === true) ||
      (filters.youthEngagement === 'no' && !artist.youthEngagementExperience);

    // 14. Teaching
    const matchesTeaching = filters.teaching === 'all' ||
      (filters.teaching === 'yes' && artist.teachingExperience === true) ||
      (filters.teaching === 'no' && !artist.teachingExperience);

    // 15. Licensing & Insurance
    const matchesLicensing = filters.licensing === 'all' ||
      (filters.licensing === 'yes' && artist.licensingInsurance === true) ||
      (filters.licensing === 'no' && !artist.licensingInsurance);

    // 16. Sculpture Installation
    const matchesSculptureInstall = filters.sculptureInstall === 'all' ||
      (filters.sculptureInstall === 'yes' && artist.sculptureInstallationExperience === true) ||
      (filters.sculptureInstall === 'no' && !artist.sculptureInstallationExperience);

    // 17. Gallery Installation
    const matchesGalleryInstall = filters.galleryInstall === 'all' ||
      (filters.galleryInstall === 'yes' && artist.galleryInstallationExperience === true) ||
      (filters.galleryInstall === 'no' && !artist.galleryInstallationExperience);

    // 18. Curation
    const matchesCuration = filters.curation === 'all' ||
      (filters.curation === 'yes' && artist.curationExperience === true) ||
      (filters.curation === 'no' && !artist.curationExperience);

    // 19. Other Installation
    const matchesOtherInstall = filters.otherInstall === 'all' ||
      (filters.otherInstall === 'yes' && artist.otherInstallationExperience === true) ||
      (filters.otherInstall === 'no' && !artist.otherInstallationExperience);

    // 20. Digital Art / Projection Mapping / AR
    const matchesDigitalInstall = filters.digitalInstall === 'all' ||
      (filters.digitalInstall === 'yes' && artist.digitalExperience === true) ||
      (filters.digitalInstall === 'no' && !artist.digitalExperience);

    return matchesSearch && 
      matchesMedium && 
      matchesSecondaryMedium &&
      matchesArtStyle &&
      matchesTheme &&
      matchesExp && 
      matchesPublic && 
      matchesMural && 
      matchesCommunity && 
      matchesYouth &&
      matchesTeaching &&
      matchesLicensing &&
      matchesSculptureInstall &&
      matchesGalleryInstall &&
      matchesCuration &&
      matchesOtherInstall &&
      matchesDigitalInstall &&
      matchesScale && 
      matchesCollaboration &&
      matchesResidency &&
      matchesVetting;
  });

  return (
    <div className="crm-directory-container">
      {/* Top Search and Action Bar */}
      <div className="crm-toolbar">
        <div className="search-wrapper">
          <span className="material-symbols-outlined search-icon">search</span>
          <input 
            type="text" 
            className="search-input" 
            placeholder="Search by name, medium, neighborhood, BIPOC identity..." 
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
          {search && (
            <button className="clear-search" onClick={() => setSearch('')}>
              <span className="material-symbols-outlined">close</span>
            </button>
          )}
        </div>
        
        <button 
          className={`btn-secondary filter-toggle ${showFilters ? 'active' : ''}`}
          onClick={() => setShowFilters(!showFilters)}
        >
          <span className="material-symbols-outlined">filter_list</span> 
          {showFilters ? 'Hide Advanced Filters' : 'Advanced Filters'}
          {Object.values(filters).some(v => v !== '' && v !== 'all') && (
            <span className="filter-indicator-dot"></span>
          )}
        </button>

        {onSync && (
          <button 
            className="btn-secondary" 
            onClick={handleSync} 
            disabled={isSyncing}
            style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', opacity: isSyncing ? 0.7 : 1 }}
          >
            <span className={`material-symbols-outlined ${isSyncing ? 'spinning' : ''}`}>sync</span>
            {isSyncing ? 'Syncing...' : 'Sync Sheet'}
          </button>
        )}
      </div>

      {syncOutcome && (
        <div className="sync-outcome-banner" style={{
          margin: '0 0 1.5rem 0',
          padding: '1rem 1.25rem',
          background: 'rgba(30, 30, 30, 0.75)',
          backdropFilter: 'blur(10px)',
          WebkitBackdropFilter: 'blur(10px)',
          border: '1px solid rgba(255, 255, 255, 0.08)',
          borderLeft: '4px solid var(--accent-terracotta)',
          borderRadius: '8px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: '1rem',
          animation: 'fadeIn 0.3s ease-in-out',
          boxShadow: '0 4px 20px rgba(0, 0, 0, 0.2)'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <span className="material-symbols-outlined" style={{
              color: syncOutcome.success ? 'var(--accent-terracotta)' : '#ef4444',
              fontSize: '1.5rem',
              background: syncOutcome.success ? 'rgba(224, 90, 71, 0.1)' : 'rgba(239, 68, 68, 0.1)',
              padding: '0.4rem',
              borderRadius: '50%',
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}>
              {syncOutcome.success ? 'cloud_done' : 'cloud_off'}
            </span>
            <div>
              <h4 style={{
                margin: 0,
                fontFamily: 'Space Grotesk, sans-serif',
                fontSize: '0.95rem',
                fontWeight: 600,
                color: '#fff',
                letterSpacing: '0.3px'
              }}>
                {syncOutcome.success ? 'Sheets Synchronization Active' : 'Synchronization Failed'}
              </h4>
              <p style={{
                margin: '0.2rem 0 0 0',
                fontSize: '0.85rem',
                color: 'var(--text-secondary)',
                lineHeight: '1.4'
              }}>
                {syncOutcome.message}
              </p>
            </div>
          </div>
          <button 
            onClick={() => setSyncOutcome(null)} 
            style={{
              background: 'none',
              border: 'none',
              color: 'var(--text-secondary)',
              cursor: 'pointer',
              display: 'flex',
              padding: '4px',
              borderRadius: '4px'
            }}
          >
            <span className="material-symbols-outlined" style={{ fontSize: '1.2rem' }}>close</span>
          </button>
        </div>
      )}

      {/* Advanced Filters Expandable Panel */}
      {showFilters && (
        <div className="advanced-filters-panel">
          
          {/* Section 1: Artistic Focus & Mediums */}
          <h4 className="filters-section-title">
            <span className="material-symbols-outlined" style={{ fontSize: '1.15rem' }}>palette</span>
            Artistic Focus & Mediums
          </h4>
          <div className="filters-grid" style={{ marginBottom: '1.75rem' }}>
            {/* Primary Medium Dropdown */}
            <div className="filter-item">
              <label className="filter-label">Primary Medium</label>
              <select 
                className="filter-input"
                value={filters.primaryMedium}
                onChange={(e) => handleFilterChange('primaryMedium', e.target.value)}
              >
                <option value="">All Primary Mediums</option>
                {MEDIUM_OPTIONS.map((med, idx) => (
                  <option key={idx} value={med}>{med}</option>
                ))}
              </select>
            </div>

            {/* Secondary Medium Dropdown */}
            <div className="filter-item">
              <label className="filter-label">Secondary Medium</label>
              <select 
                className="filter-input"
                value={filters.secondaryMedium}
                onChange={(e) => handleFilterChange('secondaryMedium', e.target.value)}
              >
                <option value="">All Secondary Mediums</option>
                {MEDIUM_OPTIONS.map((med, idx) => (
                  <option key={idx} value={med}>{med}</option>
                ))}
              </select>
            </div>

            {/* Art Style Dropdown */}
            <div className="filter-item">
              <label className="filter-label">Art Style Focus</label>
              <select 
                className="filter-input"
                value={filters.artStyle}
                onChange={(e) => handleFilterChange('artStyle', e.target.value)}
              >
                <option value="">All Art Styles</option>
                {STYLE_OPTIONS.map((style, idx) => (
                  <option key={idx} value={style}>{style}</option>
                ))}
              </select>
            </div>

            {/* Theme Dropdown */}
            <div className="filter-item">
              <label className="filter-label">Thematic Focus</label>
              <select 
                className="filter-input"
                value={filters.theme}
                onChange={(e) => handleFilterChange('theme', e.target.value)}
              >
                <option value="">All Themes</option>
                {THEME_OPTIONS.map((theme, idx) => (
                  <option key={idx} value={theme}>{theme}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Section 2: Professional Capacity & Logistics */}
          <h4 className="filters-section-title">
            <span className="material-symbols-outlined" style={{ fontSize: '1.15rem' }}>engineering</span>
            Professional Capacity & Logistics
          </h4>
          <div className="filters-grid" style={{ marginBottom: '1.75rem' }}>
            {/* Experience Level Dropdown */}
            <div className="filter-item">
              <label className="filter-label">Experience Tier</label>
              <select 
                className="filter-input"
                value={filters.experienceLevel}
                onChange={(e) => handleFilterChange('experienceLevel', e.target.value)}
              >
                <option value="">All Experience Levels</option>
                <option value="Emerging">Emerging</option>
                <option value="Mid-Career">Mid-Career</option>
                <option value="Established">Established</option>
              </select>
            </div>

            {/* Scale Capability Dropdown */}
            <div className="filter-item">
              <label className="filter-label">Scale Capability</label>
              <select 
                className="filter-input"
                value={filters.scale}
                onChange={(e) => handleFilterChange('scale', e.target.value)}
              >
                <option value="">All Scales</option>
                <option value="Small">Small (Utility Boxes)</option>
                <option value="Medium">Medium (Bus Shelters)</option>
                <option value="Large">Large (Multi-story Walls)</option>
                <option value="Digital">Digital (Projection Mapping/AR/Web)</option>
              </select>
            </div>

            {/* Collaboration Preference Dropdown */}
            <div className="filter-item">
              <label className="filter-label">Collaboration Preference</label>
              <select 
                className="filter-input"
                value={filters.collaboration}
                onChange={(e) => handleFilterChange('collaboration', e.target.value)}
              >
                <option value="">All Preferences</option>
                <option value="Solo">Solo Work Only</option>
                <option value="Collaborative">Collaborative Only</option>
                <option value="Both">Both Solo & Collaborative</option>
              </select>
            </div>

            {/* Vetting Status Dropdown */}
            <div className="filter-item">
              <label className="filter-label">Vetting Status</label>
              <select 
                className="filter-input"
                value={filters.vettingStatus}
                onChange={(e) => handleFilterChange('vettingStatus', e.target.value)}
              >
                <option value="">All Statuses</option>
                <option value="New">New / Unvetted</option>
                <option value="In Review">In Review</option>
                <option value="Vetted">Vetted & Approved</option>
                <option value="Archived">Archived</option>
              </select>
            </div>

            {/* Residency Dropdown */}
            <div className="filter-item">
              <label className="filter-label">State Residency</label>
              <select 
                className="filter-input"
                value={filters.residency || 'all'}
                onChange={(e) => handleFilterChange('residency', e.target.value)}
              >
                <option value="all">All States</option>
                <option value="CO">Colorado Only</option>
                <option value="out-of-state">Out-of-State</option>
              </select>
            </div>
          </div>

          {/* Section 3: Specialized Experience & Capabilities */}
          <h4 className="filters-section-title">
            <span className="material-symbols-outlined" style={{ fontSize: '1.15rem' }}>check_circle</span>
            Capabilities & Specialized Experience
          </h4>
          <div className="filters-grid" style={{ marginBottom: '1.5rem' }}>
            {/* Public Art Boolean Selector */}
            <div className="filter-item">
              <label className="filter-label">Public Art Experience</label>
              <div className="toggle-group">
                <button 
                  className={`toggle-btn ${filters.publicArt === 'all' ? 'active' : ''}`}
                  onClick={() => handleFilterChange('publicArt', 'all')}
                >All</button>
                <button 
                  className={`toggle-btn ${filters.publicArt === 'yes' ? 'active' : ''}`}
                  onClick={() => handleFilterChange('publicArt', 'yes')}
                >Yes</button>
                <button 
                  className={`toggle-btn ${filters.publicArt === 'no' ? 'active' : ''}`}
                  onClick={() => handleFilterChange('publicArt', 'no')}
                >No</button>
              </div>
            </div>

            {/* Mural Boolean Selector */}
            <div className="filter-item">
              <label className="filter-label">Mural Experience</label>
              <div className="toggle-group">
                <button 
                  className={`toggle-btn ${filters.mural === 'all' ? 'active' : ''}`}
                  onClick={() => handleFilterChange('mural', 'all')}
                >All</button>
                <button 
                  className={`toggle-btn ${filters.mural === 'yes' ? 'active' : ''}`}
                  onClick={() => handleFilterChange('mural', 'yes')}
                >Yes</button>
                <button 
                  className={`toggle-btn ${filters.mural === 'no' ? 'active' : ''}`}
                  onClick={() => handleFilterChange('mural', 'no')}
                >No</button>
              </div>
            </div>

            {/* Community Co-Design Boolean Selector */}
            <div className="filter-item">
              <label className="filter-label">Community Engagement</label>
              <div className="toggle-group">
                <button 
                  className={`toggle-btn ${filters.community === 'all' ? 'active' : ''}`}
                  onClick={() => handleFilterChange('community', 'all')}
                >All</button>
                <button 
                  className={`toggle-btn ${filters.community === 'yes' ? 'active' : ''}`}
                  onClick={() => handleFilterChange('community', 'yes')}
                >Yes</button>
                <button 
                  className={`toggle-btn ${filters.community === 'no' ? 'active' : ''}`}
                  onClick={() => handleFilterChange('community', 'no')}
                >No</button>
              </div>
            </div>

            {/* Youth Engagement Boolean Selector */}
            <div className="filter-item">
              <label className="filter-label">Youth Engagement</label>
              <div className="toggle-group">
                <button 
                  className={`toggle-btn ${filters.youthEngagement === 'all' ? 'active' : ''}`}
                  onClick={() => handleFilterChange('youthEngagement', 'all')}
                >All</button>
                <button 
                  className={`toggle-btn ${filters.youthEngagement === 'yes' ? 'active' : ''}`}
                  onClick={() => handleFilterChange('youthEngagement', 'yes')}
                >Yes</button>
                <button 
                  className={`toggle-btn ${filters.youthEngagement === 'no' ? 'active' : ''}`}
                  onClick={() => handleFilterChange('youthEngagement', 'no')}
                >No</button>
              </div>
            </div>

            {/* Teaching Experience Boolean Selector */}
            <div className="filter-item">
              <label className="filter-label">Teaching Experience</label>
              <div className="toggle-group">
                <button 
                  className={`toggle-btn ${filters.teaching === 'all' ? 'active' : ''}`}
                  onClick={() => handleFilterChange('teaching', 'all')}
                >All</button>
                <button 
                  className={`toggle-btn ${filters.teaching === 'yes' ? 'active' : ''}`}
                  onClick={() => handleFilterChange('teaching', 'yes')}
                >Yes</button>
                <button 
                  className={`toggle-btn ${filters.teaching === 'no' ? 'active' : ''}`}
                  onClick={() => handleFilterChange('teaching', 'no')}
                >No</button>
              </div>
            </div>

            {/* General Liability Insurance Boolean Selector */}
            <div className="filter-item">
              <label className="filter-label">Licensing & Insurance</label>
              <div className="toggle-group">
                <button 
                  className={`toggle-btn ${filters.licensing === 'all' ? 'active' : ''}`}
                  onClick={() => handleFilterChange('licensing', 'all')}
                >All</button>
                <button 
                  className={`toggle-btn ${filters.licensing === 'yes' ? 'active' : ''}`}
                  onClick={() => handleFilterChange('licensing', 'yes')}
                >Yes</button>
                <button 
                  className={`toggle-btn ${filters.licensing === 'no' ? 'active' : ''}`}
                  onClick={() => handleFilterChange('licensing', 'no')}
                >No</button>
              </div>
            </div>

            {/* Sculpture Installation Boolean Selector */}
            <div className="filter-item">
              <label className="filter-label">Sculpture / 3D Install</label>
              <div className="toggle-group">
                <button 
                  className={`toggle-btn ${filters.sculptureInstall === 'all' ? 'active' : ''}`}
                  onClick={() => handleFilterChange('sculptureInstall', 'all')}
                >All</button>
                <button 
                  className={`toggle-btn ${filters.sculptureInstall === 'yes' ? 'active' : ''}`}
                  onClick={() => handleFilterChange('sculptureInstall', 'yes')}
                >Yes</button>
                <button 
                  className={`toggle-btn ${filters.sculptureInstall === 'no' ? 'active' : ''}`}
                  onClick={() => handleFilterChange('sculptureInstall', 'no')}
                >No</button>
              </div>
            </div>

            {/* Gallery Installation Boolean Selector */}
            <div className="filter-item">
              <label className="filter-label">Gallery Setup Experience</label>
              <div className="toggle-group">
                <button 
                  className={`toggle-btn ${filters.galleryInstall === 'all' ? 'active' : ''}`}
                  onClick={() => handleFilterChange('galleryInstall', 'all')}
                >All</button>
                <button 
                  className={`toggle-btn ${filters.galleryInstall === 'yes' ? 'active' : ''}`}
                  onClick={() => handleFilterChange('galleryInstall', 'yes')}
                >Yes</button>
                <button 
                  className={`toggle-btn ${filters.galleryInstall === 'no' ? 'active' : ''}`}
                  onClick={() => handleFilterChange('galleryInstall', 'no')}
                >No</button>
              </div>
            </div>

            {/* Curation Boolean Selector */}
            <div className="filter-item">
              <label className="filter-label">Curation & Design</label>
              <div className="toggle-group">
                <button 
                  className={`toggle-btn ${filters.curation === 'all' ? 'active' : ''}`}
                  onClick={() => handleFilterChange('curation', 'all')}
                >All</button>
                <button 
                  className={`toggle-btn ${filters.curation === 'yes' ? 'active' : ''}`}
                  onClick={() => handleFilterChange('curation', 'yes')}
                >Yes</button>
                <button 
                  className={`toggle-btn ${filters.curation === 'no' ? 'active' : ''}`}
                  onClick={() => handleFilterChange('curation', 'no')}
                >No</button>
              </div>
            </div>

            {/* Other Installation Boolean Selector */}
            <div className="filter-item">
              <label className="filter-label">AV & Sound Install</label>
              <div className="toggle-group">
                <button 
                  className={`toggle-btn ${filters.otherInstall === 'all' ? 'active' : ''}`}
                  onClick={() => handleFilterChange('otherInstall', 'all')}
                >All</button>
                <button 
                  className={`toggle-btn ${filters.otherInstall === 'yes' ? 'active' : ''}`}
                  onClick={() => handleFilterChange('otherInstall', 'yes')}
                >Yes</button>
                <button 
                  className={`toggle-btn ${filters.otherInstall === 'no' ? 'active' : ''}`}
                  onClick={() => handleFilterChange('otherInstall', 'no')}
                >No</button>
              </div>
            </div>

            {/* Digital Art / AR Boolean Selector */}
            <div className="filter-item">
              <label className="filter-label">Digital Art / AR / Projection</label>
              <div className="toggle-group">
                <button 
                  className={`toggle-btn ${filters.digitalInstall === 'all' ? 'active' : ''}`}
                  onClick={() => handleFilterChange('digitalInstall', 'all')}
                >All</button>
                <button 
                  className={`toggle-btn ${filters.digitalInstall === 'yes' ? 'active' : ''}`}
                  onClick={() => handleFilterChange('digitalInstall', 'yes')}
                >Yes</button>
                <button 
                  className={`toggle-btn ${filters.digitalInstall === 'no' ? 'active' : ''}`}
                  onClick={() => handleFilterChange('digitalInstall', 'no')}
                >No</button>
              </div>
            </div>
          </div>
          
          <div className="panel-actions">
            <button className="btn-secondary" style={{ padding: '0.5rem 1rem', fontSize: '0.85rem' }} onClick={handleResetFilters}>
              Reset Filters & Search
            </button>
          </div>
        </div>
      )}

      {/* Active Filter Indicators */}
      {filteredArtists.length < artists.length && (
        <div className="crm-results-count">
          Showing <strong>{filteredArtists.length}</strong> of {artists.length} artists based on filters.
        </div>
      )}

      {/* Artist Grid */}
      {filteredArtists.length === 0 ? (
        <div className="map-placeholder" style={{ padding: '6rem' }}>
          <span className="material-symbols-outlined" style={{ fontSize: '3rem', color: 'var(--text-secondary)' }}>search_off</span>
          <h3 style={{ fontFamily: 'Space Grotesk', fontSize: '1.25rem', marginTop: '1rem' }}>No artists match the selected criteria</h3>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>Try broadening your search keywords or resetting your active filters.</p>
        </div>
      ) : (
        <div className="artist-grid">
          {filteredArtists.map((artist) => {
            const primaryMediumVal = artist.primaryMedium || (Array.isArray(artist.mediums) ? artist.mediums[0] : artist.mediums);
            const secondaryMediumsVal = artist.secondaryMediums || (Array.isArray(artist.mediums) ? artist.mediums.slice(1) : []);
            
            return (
              <div key={artist.id} className="artist-card crm-artist-card" onClick={() => setSelectedArtist(artist)}>
                <div className="artist-card-header">
                  <div className="artist-id-pill">{artist.id || 'ILA-2026-NEW'}</div>
                  <div className={`vetting-badge badge-${(artist.vettingStatus || 'new').toLowerCase().replace(' ', '-')}`}>
                    {artist.vettingStatus || 'New'}
                  </div>
                </div>
                
                <div style={{ display: 'flex', gap: '1rem', alignItems: 'center', marginBottom: '0.5rem' }}>
                  {artist.profilePicture ? (
                    <img 
                      src={artist.profilePicture} 
                      alt={`${artist.firstName} ${artist.lastName}`} 
                      style={{ width: '48px', height: '48px', borderRadius: '50%', objectFit: 'cover', border: '2px solid rgba(255,255,255,0.1)', flexShrink: 0 }} 
                    />
                  ) : (
                    <div style={{ width: '48px', height: '48px', borderRadius: '50%', background: 'rgba(255,255,255,0.06)', display: 'flex', alignItems: 'center', justifyContent: 'center', border: '1px solid rgba(255,255,255,0.12)', flexShrink: 0 }}>
                      <span className="material-symbols-outlined" style={{ fontSize: '1.4rem', color: 'rgba(255,255,255,0.35)' }}>person</span>
                    </div>
                  )}
                  <div>
                    <h3 className="artist-name" style={{ margin: 0, fontSize: '1.35rem' }}>{artist.firstName} {artist.lastName}</h3>
                    {artist.alias && <div className="artist-alias" style={{ fontSize: '0.85rem', color: 'var(--accent-terracotta)', fontWeight: 500 }}>"{artist.alias}"</div>}
                  </div>
                </div>
                
                <div className="artist-neighborhood">
                  <span className="material-symbols-outlined">location_on</span> {artist.city}, {artist.state || 'CO'}
                </div>

                {artist.bio && (
                  <p style={{ 
                    fontSize: '0.82rem', 
                    color: 'var(--text-secondary)', 
                    margin: '0.65rem 0 0.25rem 0',
                    display: '-webkit-box',
                    WebkitLineClamp: 2,
                    WebkitBoxOrient: 'vertical',
                    overflow: 'hidden',
                    lineHeight: '1.4'
                  }}>
                    {artist.bio}
                  </p>
                )}

                {/* Availability status with last updated timestamp */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', marginTop: '0.4rem', flexWrap: 'wrap' }}>
                  <span style={{
                    fontSize: '0.72rem',
                    padding: '0.15rem 0.45rem',
                    borderRadius: '4px',
                    fontWeight: 600,
                    textTransform: 'uppercase',
                    background: artist.availabilityStatus === 'Available' ? 'rgba(78, 200, 140, 0.12)' : artist.availabilityStatus === 'Semi-Available' ? 'rgba(235, 176, 91, 0.12)' : 'rgba(255, 107, 122, 0.12)',
                    color: artist.availabilityStatus === 'Available' ? '#4ec88c' : artist.availabilityStatus === 'Semi-Available' ? 'var(--accent-ochre)' : '#ff6b7a',
                    border: '1px solid ' + (artist.availabilityStatus === 'Available' ? 'rgba(78, 200, 140, 0.25)' : artist.availabilityStatus === 'Semi-Available' ? 'rgba(235, 176, 91, 0.25)' : 'rgba(255, 107, 122, 0.25)')
                  }}>
                    {artist.availabilityStatus || 'Available'}
                  </span>
                  {artist.availabilityLastUpdated && (
                    <span style={{ fontSize: '0.68rem', color: 'rgba(255,255,255,0.3)', display: 'inline-flex', alignItems: 'center', gap: '0.15rem' }}>
                      <span className="material-symbols-outlined" style={{ fontSize: '0.85rem' }}>schedule</span>
                      {artist.availabilityLastUpdated.split(' ')[0]}
                    </span>
                  )}
                </div>

                {/* Portfolio URL external link on card */}
                {artist.portfolioUrl && (
                  <div style={{ marginTop: '0.55rem' }} onClick={(e) => e.stopPropagation()}>
                    <a href={artist.portfolioUrl} target="_blank" rel="noreferrer" className="text-link" style={{ display: 'inline-flex', alignItems: 'center', gap: '0.2rem', fontSize: '0.82rem', color: 'var(--accent-terracotta)', textDecoration: 'none' }}>
                      <span className="material-symbols-outlined" style={{ fontSize: '0.95rem' }}>link</span>
                      Portfolio Link
                    </a>
                  </div>
                )}
                
                <div className="artist-metrics-preview">
                  <span className="metric-pill" title="Public Art Experience">
                    <span className="material-symbols-outlined">foundation</span>
                    {artist.publicArtExperience ? 'Public Art' : 'Studio Art'}
                  </span>
                  <span className="metric-pill" title="Mural Painting Experience">
                    <span className="material-symbols-outlined">format_paint</span>
                    {artist.muralExperience ? 'Muralist' : 'Non-Mural'}
                  </span>
                </div>

                <div className="tags" style={{ marginTop: '1.5rem' }}>
                  {primaryMediumVal && <span className="tag primary-tag">{primaryMediumVal}</span>}
                  {secondaryMediumsVal.slice(0, 2).map((medium, index) => (
                    <span key={index} className="tag">{medium}</span>
                  ))}
                  {secondaryMediumsVal.length > 2 && (
                    <span className="tag count-tag">+{secondaryMediumsVal.length - 2}</span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Slide-out Detailed Artist Profile Drawer */}
      {selectedArtist && (
        <div className="drawer-overlay" onClick={() => setSelectedArtist(null)}>
          <div className="drawer-content" onClick={(e) => e.stopPropagation()}>
            <header className="drawer-header" style={{ display: 'flex', gap: '1.25rem', alignItems: 'center' }}>
              {selectedArtist.profilePicture ? (
                <img 
                  src={selectedArtist.profilePicture} 
                  alt={`${selectedArtist.firstName} ${selectedArtist.lastName}`} 
                  style={{ width: '72px', height: '72px', borderRadius: '50%', objectFit: 'cover', border: '2px solid var(--accent-terracotta)', boxShadow: '0 0 15px rgba(224, 90, 71, 0.2)', flexShrink: 0 }} 
                />
              ) : (
                <div style={{ width: '72px', height: '72px', borderRadius: '50%', background: 'rgba(255,255,255,0.06)', display: 'flex', alignItems: 'center', justifyContent: 'center', border: '1px solid rgba(255,255,255,0.12)', flexShrink: 0 }}>
                  <span className="material-symbols-outlined" style={{ fontSize: '2.2rem', color: 'rgba(255,255,255,0.3)' }}>person</span>
                </div>
              )}
              <div style={{ flex: 1 }}>
                <span className="drawer-id">{selectedArtist.id}</span>
                <h2 className="drawer-title" style={{ margin: 0 }}>{selectedArtist.firstName} {selectedArtist.lastName}</h2>
                {selectedArtist.alias && <p className="drawer-alias" style={{ margin: '2px 0 0 0' }}>Alias: <strong>{selectedArtist.alias}</strong></p>}
                
                <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center', marginTop: '0.65rem', flexWrap: 'wrap' }}>
                  <div className={`vetting-badge badge-${(selectedArtist.vettingStatus || 'new').toLowerCase().replace(' ', '-')}`} style={{ margin: 0 }}>
                    {selectedArtist.vettingStatus || 'New'}
                  </div>
                  <div style={{
                    fontSize: '0.72rem',
                    padding: '0.2rem 0.55rem',
                    borderRadius: '4px',
                    fontWeight: 600,
                    textTransform: 'uppercase',
                    background: selectedArtist.availabilityStatus === 'Available' ? 'rgba(78, 200, 140, 0.15)' : selectedArtist.availabilityStatus === 'Semi-Available' ? 'rgba(235, 176, 91, 0.15)' : 'rgba(255, 107, 122, 0.15)',
                    color: selectedArtist.availabilityStatus === 'Available' ? '#4ec88c' : selectedArtist.availabilityStatus === 'Semi-Available' ? 'var(--accent-ochre)' : '#ff6b7a',
                    border: '1px solid ' + (selectedArtist.availabilityStatus === 'Available' ? 'rgba(78, 200, 140, 0.3)' : selectedArtist.availabilityStatus === 'Semi-Available' ? 'rgba(235, 176, 91, 0.3)' : 'rgba(255, 107, 122, 0.3)')
                  }}>
                    {selectedArtist.availabilityStatus || 'Available'}
                  </div>
                  {selectedArtist.availabilityLastUpdated && (
                    <span style={{ fontSize: '0.72rem', color: 'rgba(255,255,255,0.4)', display: 'inline-flex', alignItems: 'center', gap: '0.2rem' }}>
                      <span className="material-symbols-outlined" style={{ fontSize: '0.9rem' }}>schedule</span>
                      Updated: {selectedArtist.availabilityLastUpdated}
                    </span>
                  )}
                </div>
              </div>
              <button className="close-drawer-btn" onClick={() => setSelectedArtist(null)}>
                <span className="material-symbols-outlined">close</span>
              </button>
            </header>

            <div className="drawer-body">
              {/* Vetting Status Admin CRM Controls */}
              <div className="drawer-admin-panel">
                <h3 className="admin-title">
                  <span className="material-symbols-outlined">verified_user</span> CRM Administration
                </h3>
                <div className="admin-controls-grid">
                  <div className="form-group" style={{ marginBottom: 0 }}>
                    <label className="form-label">Review Vetting Status</label>
                    <select
                      className="form-input"
                      style={{ padding: '0.5rem 1rem', fontSize: '0.9rem', appearance: 'auto' }}
                      value={selectedArtist.vettingStatus}
                      onChange={(e) => handleUpdateStatus(selectedArtist, e.target.value)}
                    >
                      <option value="New">New / Unvetted</option>
                      <option value="In Review">In Review</option>
                      <option value="Vetted">Vetted & Approved</option>
                      <option value="Archived">Archived</option>
                    </select>
                  </div>
                  <div className="contact-log-group">
                    <label className="form-label" style={{ display: 'block' }}>Last Contacted</label>
                    <span className="last-contact-text">{selectedArtist.lastContacted}</span>
                    <button 
                      className="btn-primary" 
                      style={{ padding: '0.5rem 1rem', fontSize: '0.85rem', width: '100%', marginTop: '0.5rem', justifyContent: 'center' }}
                      onClick={() => handleLogContactToday(selectedArtist)}
                    >
                      Log Contact Today
                    </button>
                  </div>
                </div>
                
                <div style={{ 
                  marginTop: '1.25rem', 
                  paddingTop: '1rem', 
                  borderTop: '1px solid rgba(255, 255, 255, 0.08)',
                  display: 'flex', 
                  justifyContent: 'flex-end' 
                }}>
                  <button
                    className="btn-secondary"
                    style={{
                      background: 'rgba(239, 68, 68, 0.1)',
                      color: '#f87171',
                      border: '1px solid rgba(239, 68, 68, 0.25)',
                      padding: '0.55rem 1rem',
                      fontSize: '0.82rem',
                      borderRadius: '8px',
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '0.4rem',
                      cursor: 'pointer',
                      transition: 'all 0.2s ease',
                      fontWeight: 600
                    }}
                    onClick={() => handleDeleteArtistClick(selectedArtist)}
                  >
                    <span className="material-symbols-outlined" style={{ fontSize: '1rem' }}>delete</span>
                    Remove Artist Profile
                  </button>
                </div>
              </div>

              {/* SECTION 1: Personal & Bio */}
              <section className="drawer-section">
                <h3 className="section-title">Personal & Identity Representation</h3>
                <div className="detail-grid-2">
                  <div className="detail-row">
                    <span className="detail-label">Pronouns</span>
                    <span className="detail-val">{selectedArtist.pronouns || 'Not specified'}</span>
                  </div>
                  <div className="detail-row">
                    <span className="detail-label">BIPOC / Identity</span>
                    <span className="detail-val">{selectedArtist.bipocIdentity || 'Not specified (Optional)'}</span>
                  </div>
                  <div className="detail-row" style={{ gridColumn: 'span 2' }}>
                    <span className="detail-label">Community Affiliations</span>
                    <span className="detail-val">{selectedArtist.communityAffiliations || 'None listed'}</span>
                  </div>
                  {selectedArtist.bio && (
                    <div className="detail-row" style={{ gridColumn: 'span 2', marginTop: '1rem', background: 'rgba(255,255,255,0.02)', padding: '0.9rem', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.05)' }}>
                      <span className="detail-label" style={{ marginBottom: '0.4rem', display: 'block' }}>Biography / About</span>
                      <p style={{ margin: 0, fontSize: '0.9rem', lineHeight: '1.5', color: 'var(--text-secondary)', whiteSpace: 'pre-line' }}>{selectedArtist.bio}</p>
                    </div>
                  )}
                </div>
              </section>

              {/* SECTION 2: Contact & Social */}
              <section className="drawer-section">
                <h3 className="section-title">Contact & Professional Socials</h3>
                <div className="detail-grid-2">
                  <div className="detail-row">
                    <span className="detail-label">Email</span>
                    <span className="detail-val">
                      <a href={`mailto:${selectedArtist.email}`} className="text-link">{selectedArtist.email}</a>
                    </span>
                  </div>
                  <div className="detail-row">
                    <span className="detail-label">Phone</span>
                    <span className="detail-val">{selectedArtist.phone || 'Not specified'}</span>
                  </div>
                  <div className="detail-row">
                    <span className="detail-label">Website</span>
                    <span className="detail-val">
                      {selectedArtist.website ? (
                        <a href={selectedArtist.website} target="_blank" rel="noreferrer" className="text-link">Visit Website</a>
                      ) : 'None'}
                    </span>
                  </div>
                  <div className="detail-row">
                    <span className="detail-label">Portfolio URL</span>
                    <span className="detail-val">
                      {selectedArtist.portfolioUrl ? (
                        <a href={selectedArtist.portfolioUrl} target="_blank" rel="noreferrer" className="text-link" style={{ display: 'inline-flex', alignItems: 'center', gap: '0.2rem' }}>
                          <span className="material-symbols-outlined" style={{ fontSize: '0.95rem' }}>link</span>
                          View Portfolio
                        </a>
                      ) : 'None'}
                    </span>
                  </div>
                  <div className="detail-row">
                    <span className="detail-label">Instagram</span>
                    <span className="detail-val">
                      {selectedArtist.instagram ? (
                        <a href={`https://instagram.com/${selectedArtist.instagram.replace('@','')}`} target="_blank" rel="noreferrer" className="text-link">
                          {selectedArtist.instagram}
                        </a>
                      ) : 'None'}
                    </span>
                  </div>
                  <div className="detail-row">
                    <span className="detail-label">LinkedIn</span>
                    <span className="detail-val">
                      {selectedArtist.linkedin ? (
                        <a href={selectedArtist.linkedin} target="_blank" rel="noreferrer" className="text-link">View Profile</a>
                      ) : 'None'}
                    </span>
                  </div>
                  <div className="detail-row" style={{ gridColumn: 'span 2' }}>
                    <span className="detail-label">Base Location</span>
                    <span className="detail-val">{selectedArtist.city}, {selectedArtist.state || 'CO'}</span>
                  </div>
                </div>
              </section>

              {/* SECTION 3: Artistic Profile */}
              <section className="drawer-section">
                <h3 className="section-title">Artistic Mediums & Themes</h3>
                <div className="detail-row">
                  <span className="detail-label">Primary Medium</span>
                  <span className="detail-val highlight-text" style={{ fontSize: '1.1rem' }}>
                    {selectedArtist.primaryMedium || (Array.isArray(selectedArtist.mediums) ? selectedArtist.mediums[0] : selectedArtist.mediums)}
                  </span>
                </div>
                
                <div className="detail-row" style={{ marginTop: '1rem' }}>
                  <span className="detail-label" style={{ marginBottom: '0.5rem', display: 'block' }}>Secondary Mediums & Skills</span>
                  <div className="tags">
                    {(selectedArtist.secondaryMediums || (Array.isArray(selectedArtist.mediums) ? selectedArtist.mediums.slice(1) : [])).map((med, idx) => (
                      <span key={idx} className="tag">{med}</span>
                    ))}
                  </div>
                </div>

                <div className="detail-row" style={{ marginTop: '1rem' }}>
                  <span className="detail-label" style={{ marginBottom: '0.5rem', display: 'block' }}>Artistic Styles</span>
                  <div className="tags">
                    {(selectedArtist.artStyles || []).map((style, idx) => (
                      <span key={idx} className="tag style-tag">{style}</span>
                    ))}
                  </div>
                </div>

                <div className="detail-row" style={{ marginTop: '1rem' }}>
                  <span className="detail-label" style={{ marginBottom: '0.5rem', display: 'block' }}>Themes Addressed</span>
                  <div className="tags">
                    {(selectedArtist.themes || []).map((theme, idx) => (
                      <span key={idx} className="tag theme-tag">{theme}</span>
                    ))}
                  </div>
                </div>
              </section>

              {/* SECTION 4: Professional Capacity */}
              <section className="drawer-section">
                <h3 className="section-title">Technical Capacity & Installation Scale</h3>
                <div className="detail-grid-2">
                  <div className="detail-row">
                    <span className="detail-label">Experience Tier</span>
                    <span className="detail-val">{selectedArtist.experienceLevel || 'Emerging'}</span>
                  </div>
                  <div className="detail-row">
                    <span className="detail-label">Collaboration</span>
                    <span className="detail-val">{selectedArtist.collaborationPreference || 'Both'}</span>
                  </div>
                  <div className="detail-row" style={{ gridColumn: 'span 2' }}>
                    <span className="detail-label" style={{ marginBottom: '0.5rem', display: 'block' }}>Installation Scale Capabilities</span>
                    <div className="tags">
                      {(selectedArtist.scaleCapability || []).map((scale, idx) => (
                        <span key={idx} className="tag">{scale === 'Digital' ? 'Digital' : `${scale} Scale`}</span>
                      ))}
                    </div>
                  </div>
                </div>

                <div className="boolean-checks-grid" style={{ marginTop: '1.5rem' }}>
                  <div className={`boolean-check-row ${selectedArtist.publicArtExperience ? 'active' : ''}`}>
                    <span className="material-symbols-outlined">{selectedArtist.publicArtExperience ? 'check_circle' : 'cancel'}</span>
                    <span>Public Art Experience</span>
                  </div>
                  <div className={`boolean-check-row ${selectedArtist.muralExperience ? 'active' : ''}`}>
                    <span className="material-symbols-outlined">{selectedArtist.muralExperience ? 'check_circle' : 'cancel'}</span>
                    <span>Mural Painting Experience</span>
                  </div>
                  <div className={`boolean-check-row ${selectedArtist.communityEngagementExperience ? 'active' : ''}`}>
                    <span className="material-symbols-outlined">{selectedArtist.communityEngagementExperience ? 'check_circle' : 'cancel'}</span>
                    <span>Community Co-Design / Outreach</span>
                  </div>
                  <div className={`boolean-check-row ${selectedArtist.youthEngagementExperience ? 'active' : ''}`}>
                    <span className="material-symbols-outlined">{selectedArtist.youthEngagementExperience ? 'check_circle' : 'cancel'}</span>
                    <span>Youth Engagement / Paint Days</span>
                  </div>
                  <div className={`boolean-check-row ${selectedArtist.teachingExperience ? 'active' : ''}`}>
                    <span className="material-symbols-outlined">{selectedArtist.teachingExperience ? 'check_circle' : 'cancel'}</span>
                    <span>Teaching / Workshop Experience</span>
                  </div>
                  <div className={`boolean-check-row ${selectedArtist.licensingInsurance ? 'active' : ''}`}>
                    <span className="material-symbols-outlined">{selectedArtist.licensingInsurance ? 'check_circle' : 'cancel'}</span>
                    <span>General Liability Insurance & Licensing</span>
                  </div>
                  <div className={`boolean-check-row ${selectedArtist.sculptureInstallationExperience ? 'active' : ''}`}>
                    <span className="material-symbols-outlined">{selectedArtist.sculptureInstallationExperience ? 'check_circle' : 'cancel'}</span>
                    <span>3D / Sculpture Installation</span>
                  </div>
                  <div className={`boolean-check-row ${selectedArtist.galleryInstallationExperience ? 'active' : ''}`}>
                    <span className="material-symbols-outlined">{selectedArtist.galleryInstallationExperience ? 'check_circle' : 'cancel'}</span>
                    <span>Gallery Exhibition Setup</span>
                  </div>
                  <div className={`boolean-check-row ${selectedArtist.curationExperience ? 'active' : ''}`}>
                    <span className="material-symbols-outlined">{selectedArtist.curationExperience ? 'check_circle' : 'cancel'}</span>
                    <span>Art Curation & Design</span>
                  </div>
                  <div className={`boolean-check-row ${selectedArtist.otherInstallationExperience ? 'active' : ''}`}>
                    <span className="material-symbols-outlined">{selectedArtist.otherInstallationExperience ? 'check_circle' : 'cancel'}</span>
                    <span>Specialized Installations (AV/Sound)</span>
                  </div>
                  <div className={`boolean-check-row ${selectedArtist.digitalExperience ? 'active' : ''}`}>
                    <span className="material-symbols-outlined">{selectedArtist.digitalExperience ? 'check_circle' : 'cancel'}</span>
                    <span>Digital Art / Projection Mapping / AR</span>
                  </div>
                  <div className={`boolean-check-row ${selectedArtist.eventProductionExperience ? 'active' : ''}`}>
                    <span className="material-symbols-outlined">{selectedArtist.eventProductionExperience ? 'check_circle' : 'cancel'}</span>
                    <span>Music & Event Production Experience</span>
                  </div>
                </div>

                {selectedArtist.capabilitiesDescription && (
                  <div className="detail-row" style={{ marginTop: '1.5rem' }}>
                    <span className="detail-label">Installation Capabilities & Equipment Description</span>
                    <div className="text-description-block" style={{ whiteSpace: 'pre-line' }}>
                      {selectedArtist.capabilitiesDescription}
                    </div>
                  </div>
                )}
              </section>

              {/* SECTION 5: Logistics */}
              <section className="drawer-section">
                <h3 className="section-title">Logistics, Availability & Projects</h3>
                <div className="detail-grid-2" style={{ marginBottom: '1.5rem' }}>
                  <div className="detail-row">
                    <span className="detail-label">Availability Status</span>
                    <span className="detail-val">
                      {selectedArtist.availabilityStatus || 'Available'}
                      {selectedArtist.availabilityLastUpdated && (
                        <span style={{ display: 'block', fontSize: '0.72rem', color: 'rgba(255,255,255,0.4)', marginTop: '2px' }}>
                          Last Updated: {selectedArtist.availabilityLastUpdated}
                        </span>
                      )}
                    </span>
                  </div>
                  <div className="detail-row">
                    <span className="detail-label">Commission Budget Range</span>
                    <span className="detail-val highlight-text">{selectedArtist.budgetRange || 'Flexible'}</span>
                  </div>
                </div>

                <div className="detail-row" style={{ marginBottom: '1.5rem' }}>
                  <span className="detail-label">Notable Projects / Commissions</span>
                  <div className="text-description-block">{selectedArtist.notableProjects || 'None listed'}</div>
                </div>

                <div className="detail-row" style={{ marginBottom: '1.5rem' }}>
                  <span className="detail-label">Professional References</span>
                  <div className="text-description-block">{selectedArtist.references || 'None listed'}</div>
                </div>

                <div className="detail-row">
                  <span className="detail-label">Specialized Accessibility & Installation Needs</span>
                  <div className="text-description-block">{selectedArtist.accessibilityNeeds || 'None specified'}</div>
                </div>
              </section>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
