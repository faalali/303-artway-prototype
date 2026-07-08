import { useState, useRef } from 'react';
import { submitOpportunityPipeline } from '../data/submissionPipeline';
import { saveFundingSource, findMatchingArtistsForRFQ, broadcastOpportunityToAllArtists, getClients, saveClient } from '../data/mockDatabase';
import SubmissionStatus from './SubmissionStatus';

const STEP_NAMES = [
  "Client Profile",
  "Creative Scope",
  "Budget & Timeline",
  "Location Details",
  "Review & Submit"
];

const CATEGORY_OPTIONS = [
  "Mural Commission",
  "Sculpture / 3D Installation",
  "DJ Booking / Performance",
  "Live Musician / Band / Singer",
  "Photography / Videography / Film",
  "Audio Engineering / Sound Production",
  "Makeup / SFX / Hair Stylist",
  "General Event Booking",
  "Other Creative Need"
];

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
  "Makeup / SFX Artist", "Costume / Wardrobe Stylist", "Gaffer / Grip / Film Crew",
  "3D Installation", "Site-Specific Installation", "Found Object / Assemblage",
  "Mosaic / Tile Work", "Metal Fabrication / Welding", "Ceramics / Pottery",
  "Textile / Fiber Art", "Neon / Light Art", "Kinetic Art / Interactive Installation",
  "Woodworking / Carpentry", "Glass Art", "Environmental / Land Art"
];

const STYLE_OPTIONS = [
  "Abstract", "Realism", "Street Art", "Graffiti", "Conceptual", "Geometrical", 
  "Pop", "Photorealism", "Pointillism", "Minimalist", "Narrative Realism", 
  "Organic Abstraction", "Indigenous Modernism", "Bold Black & White",
  "Cinematic Narrative", "Documentary / Non-Fiction", "Experimental / Avant-Garde",
  "Noir / Neo-Noir", "Electronic / Synthwave", "Hip-Hop / Lo-Fi Beats",
  "Acoustic / Indie Folk", "Cinematic Score / Soundscapes",
  "Sculptural / 3D Form", "Site-Specific / Environmental", "Assemblage / Found Object",
  "Kinetic / Interactive", "Earthwork / Land Art", "Architectural / Brutalist",
  "Biomorphic / Organic Form", "Textile / Craft-Based"
];

const CAPABILITY_OPTIONS = [
  { key: 'publicArtExperience', label: 'Have General Public Art Experience' },
  { key: 'muralExperience', label: 'Have Large Mural Painting Experience' },
  { key: 'communityEngagementExperience', label: 'Have Community Engagement / Co-Design Experience' },
  { key: 'youthEngagementExperience', label: 'Have Youth Mentorship / Paint Day Experience' },
  { key: 'teachingExperience', label: 'Have Art Teaching / Workshop Experience' },
  { key: 'licensingInsurance', label: 'Have General Liability Insurance / Art Licensing' },
  { key: 'sculptureInstallationExperience', label: 'Have 3D / Sculpture Installation Experience' },
  { key: 'galleryInstallationExperience', label: 'Have Gallery Exhibition / Frame Hanging Experience' },
  { key: 'curationExperience', label: 'Have Gallery Curation / Exhibition Design' },
  { key: 'otherInstallationExperience', label: 'Have Scaffolding, Scissor & Boom Lift Certification' },
  { key: 'digitalExperience', label: 'Have Graphic Design / Digital Prep / Vector Mapping' },
  { key: 'djPerformanceExperience', label: 'Have Live DJ / Turntablist Experience' },
  { key: 'liveMusicianExperience', label: 'Have Live Instrumentalist / Vocalist Performance' },
  { key: 'musicProductionExperience', label: 'Have Audio Production & Engineering Experience' },
  { key: 'eventPlanningExperience', label: 'Have Event Coordination / Production Logistics' },
  { key: 'festivalProductionExperience', label: 'Have Large-Scale Festival / Stage Management Experience' }
];

const SCALE_OPTIONS = ["Small", "Medium", "Large", "Digital"];

const COLORADO_CITIES = [
  { name: 'Denver', lat: 39.7392, lon: -104.9903 },
  { name: 'Colorado Springs', lat: 38.8339, lon: -104.8214 },
  { name: 'Boulder', lat: 40.0150, lon: -105.2705 },
  { name: 'Fort Collins', lat: 40.5853, lon: -105.0844 },
  { name: 'Grand Junction', lat: 39.0639, lon: -108.5506 },
  { name: 'Telluride', lat: 37.9375, lon: -107.8123 },
  { name: 'Pueblo', lat: 38.2544, lon: -104.6091 },
  { name: 'Aurora', lat: 39.7294, lon: -104.8319 },
  { name: 'Lakewood', lat: 39.7047, lon: -105.0814 },
  { name: 'Breckenridge', lat: 39.4817, lon: -106.0384 },
  { name: 'Golden', lat: 39.7562, lon: -105.2211 },
  { name: 'Steamboat Springs', lat: 40.4850, lon: -106.8317 }
];

export default function CommissionerRFQForm({ initialClient = null }) {
  const [step, setStep] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submissionStage, setSubmissionStage] = useState('idle');
  const [successData, setSuccessData] = useState(null);
  const [usernameError, setUsernameError] = useState('');

  // Simulated broadcast stages: 'indexing', 'matching', 'broadcasting', 'done'
  const [broadcastStage, setBroadcastStage] = useState('indexing');
  const [matchingArtists, setMatchingArtists] = useState([]);
  
  const [dragActive, setDragActive] = useState(false);
  const [fileError, setFileError] = useState('');
  const [fileUploading, setFileUploading] = useState(false);
  const fileInputRef = useRef(null);

  const [customMedium, setCustomMedium] = useState('');
  const [customStyle, setCustomStyle] = useState('');

  const [formData, setFormData] = useState({
    clientName: initialClient ? (initialClient.clientName || '') : '',
    contactName: initialClient ? (initialClient.contactName || '') : '',
    email: initialClient ? (initialClient.email || '') : '',
    phone: initialClient ? (initialClient.phone || '') : '',
    website: initialClient ? (initialClient.website || '') : '',
    username: initialClient ? (initialClient.username || '') : '',
    password: initialClient ? (initialClient.password || '') : '',
    bio: initialClient ? (initialClient.bio || '') : '',
    profilePicture: initialClient ? (initialClient.profilePicture || '') : '',
    
    title: '',
    category: 'Mural Commission',
    mediumsNeeded: [],
    stylesRequired: [],
    capabilitiesRequired: [],
    projectRequirements: '',
    
    budget: '',
    scaleRequired: 'Medium',
    deadline: '',
    eventDate: '',
    whoShouldApply: '',
    
    address: '',
    city: 'Denver',
    latitude: '39.7392',
    longitude: '-104.9903',
    permittingRequirements: '',
    permittingPayer: '',
    
    files: [],
    broadcastChecked: true
  });

  const handleCityChange = (cityName) => {
    const selected = COLORADO_CITIES.find(c => c.name === cityName);
    if (selected) {
      setFormData(prev => ({
        ...prev,
        city: cityName,
        latitude: String(selected.lat),
        longitude: String(selected.lon)
      }));
    } else {
      setFormData(prev => ({ ...prev, city: cityName }));
    }
  };

  const handleDrag = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFilesUpload(e.dataTransfer.files);
    }
  };

  const handleFileInputChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      handleFilesUpload(e.target.files);
    }
  };

  const handleFilesUpload = async (filesList) => {
    setFileError('');
    const currentFiles = formData.files || [];
    if (currentFiles.length + filesList.length > 3) {
      setFileError('You can upload a maximum of 3 attachments/briefs.');
      return;
    }

    const allowedTypes = [
      'application/pdf',
      'image/jpeg',
      'image/png',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
    ];
    const maxSizeBytes = 5 * 1024 * 1024; // 5 MB

    setFileUploading(true);
    const newFiles = [];

    for (let i = 0; i < filesList.length; i++) {
      const file = filesList[i];
      if (!allowedTypes.includes(file.type) && !file.name.toLowerCase().endsWith('.pdf') && !file.name.toLowerCase().endsWith('.docx')) {
        setFileError(`File "${file.name}" is not supported. Allowed formats: PDFs, JPEGs, PNGs, and Word docs.`);
        setFileUploading(false);
        return;
      }
      if (file.size > maxSizeBytes) {
        setFileError(`File "${file.name}" exceeds the 5 MB size limit.`);
        setFileUploading(false);
        return;
      }
      const isDuplicate = currentFiles.some(f => f.name === file.name && f.size === file.size);
      if (isDuplicate) continue;

      try {
        const base64Data = await convertToBase64(file);
        newFiles.push({
          name: file.name,
          type: file.type || 'application/octet-stream',
          size: file.size,
          base64Data: base64Data
        });
      } catch (err) {
        console.error('File conversion failed:', err);
        setFileError(`Failed to process file "${file.name}".`);
        setFileUploading(false);
        return;
      }
    }

    if (newFiles.length > 0) {
      setFormData(prev => ({
        ...prev,
        files: [...(prev.files || []), ...newFiles]
      }));
    }
    setFileUploading(false);
  };

  const convertToBase64 = (file) => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => resolve(reader.result);
      reader.onerror = (error) => reject(error);
    });
  };

  const handleRemoveFile = (idx) => {
    setFormData(prev => ({
      ...prev,
      files: prev.files.filter((_, i) => i !== idx)
    }));
  };

  const toggleMedium = (med) => {
    setFormData(prev => {
      const current = prev.mediumsNeeded || [];
      if (current.includes(med)) {
        return { ...prev, mediumsNeeded: current.filter(m => m !== med) };
      } else {
        return { ...prev, mediumsNeeded: [...current, med] };
      }
    });
  };

  const toggleStyle = (style) => {
    setFormData(prev => {
      const current = prev.stylesRequired || [];
      if (current.includes(style)) {
        return { ...prev, stylesRequired: current.filter(s => s !== style) };
      } else {
        return { ...prev, stylesRequired: [...current, style] };
      }
    });
  };

  const toggleCapability = (capKey) => {
    setFormData(prev => {
      const current = prev.capabilitiesRequired || [];
      if (current.includes(capKey)) {
        return { ...prev, capabilitiesRequired: current.filter(c => c !== capKey) };
      } else {
        return { ...prev, capabilitiesRequired: [...current, capKey] };
      }
    });
  };

  const handleNext = (e) => {
    e.preventDefault();
    if (step < 5) {
      setStep(step + 1);
      window.scrollTo(0, 0);
    }
  };

  const handleBack = () => {
    if (step > 1) {
      setStep(step - 1);
      window.scrollTo(0, 0);
    }
  };

  const handleResetForm = () => {
    setFormData({
      clientName: '',
      contactName: '',
      email: '',
      phone: '',
      website: '',
      title: '',
      category: 'Mural Commission',
      mediumsNeeded: [],
      stylesRequired: [],
      capabilitiesRequired: [],
      budget: '',
      scaleRequired: 'Medium',
      deadline: '',
      eventDate: '',
      whoShouldApply: '',
      address: '',
      city: 'Denver',
      latitude: '39.7392',
      longitude: '-104.9903',
      files: [],
      broadcastChecked: true
    });
    setStep(1);
    setSuccessData(null);
    setCustomMedium('');
    setCustomStyle('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Save client if new client registration
    let clientToSave = null;
    if (!initialClient) {
      if (!formData.username || formData.username.length < 3) {
        alert("Please enter a username of at least 3 characters.");
        return;
      }
      if (usernameError) {
        alert("This username is already taken. Please choose another.");
        return;
      }
      if (!formData.password) {
        alert("Please create a password.");
        return;
      }
      
      const clientPayload = {
        clientName: formData.clientName,
        contactName: formData.contactName,
        email: formData.email,
        phone: formData.phone,
        website: formData.website,
        username: formData.username,
        password: formData.password,
        bio: formData.bio,
        profilePicture: formData.profilePicture
      };
      const clientSaveResult = saveClient(clientPayload);
      if (clientSaveResult.success) {
        clientToSave = clientSaveResult.client;
        // Auto-login the new client
        localStorage.setItem('ila_client_session_v1', JSON.stringify({ email: clientToSave.email, id: clientToSave.id }));
      }
    }

    setIsSubmitting(true);

    const rfqId = `ILA-RFQ-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`;
    const rfqQuery = {
      mediums: formData.mediumsNeeded,
      styles: formData.stylesRequired,
      capabilities: formData.capabilitiesRequired,
      scale: formData.scaleRequired
    };

    const opportunityToSubmit = {
      id: rfqId,
      title: formData.title,
      provider: formData.clientName || 'Private Client',
      type: formData.category || 'RFQ / Commission',
      amount: formData.budget || 'Compensation Varies',
      status: 'Open',
      openDate: new Date().toISOString().split('T')[0],
      closeDate: formData.deadline || 'Rolling',
      description: formData.description,
      url: formData.website || `mailto:${formData.email}`,
      whoShouldApply: formData.whoShouldApply || `Vetted talent matching ${formData.mediumsNeeded.join(', ') || 'opportunity category'}`,
      clientId: initialClient ? initialClient.id : (clientToSave ? clientToSave.id : 'ILA-CLIENT-0001'),
      
      // Custom metadata for Commissioner postings
      isCommunityPost: true,
      submittedAt: new Date().toISOString(),   // used for 60-day TTL
      contactEmail: formData.email,
      contactPhone: formData.phone,
      contactPerson: formData.contactName,
      mediums: formData.mediumsNeeded,
      styles: formData.stylesRequired,
      capabilities: formData.capabilitiesRequired,
      scale: formData.scaleRequired,
      address: formData.address,
      city: formData.city,
      latitude: parseFloat(formData.latitude) || 39.7392,
      longitude: parseFloat(formData.longitude) || -104.9903,
      permittingRequirements: formData.permittingRequirements || '',
      permittingPayer: formData.permittingPayer || '',
      projectRequirements: formData.projectRequirements || '',
      attachedBriefs: formData.files || []
    };

    // 1. Firebase write + sync queue via guaranteed pipeline (no silent failures)
    const result = await submitOpportunityPipeline(opportunityToSubmit, (stage) => {
      setSubmissionStage(stage);
    });

    if (!result.success) {
      // "Submission failed. Please try again." shown by <SubmissionStatus>
      setIsSubmitting(false);
      return;
    }

    // 2. Fetch matched artists (only after confirmed Firebase write)
    const matches = findMatchingArtistsForRFQ(rfqQuery);
    setMatchingArtists(matches);

    // 3. Initiate broadcast pipeline
    setSuccessData(opportunityToSubmit);
    setIsSubmitting(false);
    setStep(6);

    setBroadcastStage('indexing');
    setTimeout(() => {
      setBroadcastStage('matching');
      setTimeout(() => {
        setBroadcastStage('broadcasting');
        if (formData.broadcastChecked) {
          broadcastOpportunityToAllArtists(opportunityToSubmit);
        }
        setTimeout(() => { setBroadcastStage('done'); }, 1500);
      }, 1500);
    }, 1500);
  };

  // ── Success Screen Component ───────────────────────────────────────────────
  if (step === 6 && successData) {
    return (
      <div className="public-form-container">
        <div className="form-card" style={{ maxWidth: '750px', textAlign: 'center', animation: 'fadeIn 0.4s ease' }}>
          <span className="material-symbols-outlined success-icon" style={{ 
            fontSize: '4.5rem', 
            color: 'var(--accent-electric)',
            background: 'rgba(74, 131, 237, 0.1)',
            padding: '1.25rem',
            borderRadius: '50%',
            marginBottom: '1.5rem',
            display: 'inline-block'
          }}>lock_open</span>
          
          <h1 style={{ fontFamily: 'Space Grotesk', fontSize: '2rem', fontWeight: 700, margin: 0, color: 'var(--text-primary)' }}>
            OPPORTUNITY PUBLISHED
          </h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: '1rem', marginTop: '0.5rem', marginBottom: '2rem' }}>
            Your RFQ/RFP Has Been Successfully Logged in the Art in Need Portal!
          </p>

          <div className="success-details" style={{ textAlign: 'left', background: 'rgba(0,0,0,0.2)', border: '1px solid var(--border-subtle)', borderRadius: '16px', padding: '1.5rem 2rem', marginBottom: '2.5rem' }}>
            <div className="success-detail-row" style={{ display: 'flex', justifyContent: 'space-between', padding: '0.65rem 0', borderBottom: '1px solid rgba(255,255,255,0.03)' }}>
              <span style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>Opportunity ID</span>
              <span style={{ color: 'var(--accent-electric)', fontWeight: 700, fontSize: '0.9rem', fontFamily: 'monospace' }}>{successData.id}</span>
            </div>
            <div className="success-detail-row" style={{ display: 'flex', justifyContent: 'space-between', padding: '0.65rem 0', borderBottom: '1px solid rgba(255,255,255,0.03)' }}>
              <span style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>Project Title</span>
              <span style={{ color: 'var(--text-primary)', fontWeight: 600, fontSize: '0.9rem' }}>{successData.title}</span>
            </div>
            <div className="success-detail-row" style={{ display: 'flex', justifyContent: 'space-between', padding: '0.65rem 0', borderBottom: '1px solid rgba(255,255,255,0.03)' }}>
              <span style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>Compensation</span>
              <span style={{ color: 'var(--accent-ochre)', fontWeight: 600, fontSize: '0.9rem' }}>{successData.amount}</span>
            </div>
            <div className="success-detail-row" style={{ display: 'flex', justifyContent: 'space-between', padding: '0.65rem 0', borderBottom: '1px solid rgba(255,255,255,0.03)' }}>
              <span style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>Scale of Work</span>
              <span style={{ color: 'var(--text-primary)', fontWeight: 500, fontSize: '0.9rem' }}>{successData.scale}</span>
            </div>
            <div className="success-detail-row" style={{ display: 'flex', justifyContent: 'space-between', padding: '0.65rem 0' }}>
              <span style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>Location / City</span>
              <span style={{ color: 'var(--text-primary)', fontWeight: 500, fontSize: '0.9rem' }}>{successData.address}, {successData.city}</span>
            </div>
          </div>

          {/* Interactive Simulated Pipeline Stages */}
          <div style={{
            background: 'rgba(255,255,255,0.01)',
            border: '1px solid var(--border-subtle)',
            borderRadius: '16px',
            padding: '2rem',
            textAlign: 'left',
            marginBottom: '2.5rem'
          }}>
            <h3 style={{ margin: 0, fontFamily: 'Space Grotesk', fontSize: '1.15rem', color: 'var(--text-primary)', marginBottom: '1.25rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <span className="material-symbols-outlined" style={{ fontSize: '1.25rem', color: 'var(--accent-electric)' }}>sync_saved_locally</span>
              Statewide Sync & Matching Status
            </h3>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              {/* Stage 1: Indexing */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', opacity: broadcastStage === 'indexing' ? 1 : 0.65 }}>
                <span className="material-symbols-outlined" style={{ 
                  color: broadcastStage === 'indexing' ? 'var(--accent-ochre)' : '#4ec88c', 
                  fontSize: '1.25rem',
                  animation: broadcastStage === 'indexing' ? 'rotate 1.5s linear infinite' : 'none'
                }}>
                  {broadcastStage === 'indexing' ? 'sync' : 'check_circle'}
                </span>
                <span style={{ fontSize: '0.9rem', color: 'var(--text-primary)' }}>
                  Indexing opportunity coordinates onto the <strong>Geospatial Opportunities Map</strong>...
                </span>
              </div>

              {/* Stage 2: Matching */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', opacity: (broadcastStage === 'matching' || broadcastStage === 'indexing') ? 0.65 : 1 }}>
                <span className="material-symbols-outlined" style={{ 
                  color: broadcastStage === 'matching' ? 'var(--accent-ochre)' : broadcastStage === 'indexing' ? 'radio_button_unchecked' : '#4ec88c', 
                  fontSize: '1.25rem',
                  animation: broadcastStage === 'matching' ? 'rotate 1.5s linear infinite' : 'none'
                }}>
                  {broadcastStage === 'matching' ? 'sync' : broadcastStage === 'indexing' ? 'radio_button_unchecked' : 'check_circle'}
                </span>
                <span style={{ fontSize: '0.9rem', color: 'var(--text-primary)' }}>
                  Searching local registry for talent matching required criteria...
                </span>
              </div>

              {/* Stage 3: Broadcasting */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', opacity: broadcastStage === 'done' ? 1 : 0.65 }}>
                <span className="material-symbols-outlined" style={{ 
                  color: broadcastStage === 'broadcasting' ? 'var(--accent-ochre)' : broadcastStage === 'done' ? '#4ec88c' : 'radio_button_unchecked', 
                  fontSize: '1.25rem',
                  animation: broadcastStage === 'broadcasting' ? 'rotate 1.5s linear infinite' : 'none'
                }}>
                  {broadcastStage === 'broadcasting' ? 'sync' : broadcastStage === 'done' ? 'check_circle' : 'radio_button_unchecked'}
                </span>
                <span style={{ fontSize: '0.9rem', color: 'var(--text-primary)' }}>
                  {formData.broadcastChecked ? 'Broadcasting personalized alert emails to matching registered talent...' : 'Skipping automatic email broadcasting per settings.'}
                </span>
              </div>
            </div>

            {/* Broadcast complete visual drawer */}
            {broadcastStage === 'done' && (
              <div style={{ 
                marginTop: '1.5rem', 
                padding: '1.25rem 1.5rem', 
                background: 'rgba(74, 131, 237, 0.05)', 
                border: '1px dashed rgba(74, 131, 237, 0.3)', 
                borderRadius: '12px',
                animation: 'fadeIn 0.4s ease-out'
              }}>
                <div style={{ fontWeight: 600, fontSize: '0.95rem', color: 'var(--accent-electric)', marginBottom: '0.5rem' }}>
                  🎉 Success! {matchingArtists.length} Registry Artists Matched &amp; Alerted!
                </div>
                <p style={{ margin: 0, fontSize: '0.85rem', color: 'var(--text-secondary)', lineHeight: '1.4' }}>
                  Your need has been cataloged in the **Art in Need Portal**. We have successfully dispatched automated alerts to all matching profiles who meet your required styles, scale, and technical capabilities.
                </p>
                {matchingArtists.length > 0 && (
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem', marginTop: '0.75rem' }}>
                    {matchingArtists.slice(0, 5).map(artist => (
                      <span key={artist.id} style={{ 
                        fontSize: '0.75rem', 
                        padding: '0.2rem 0.5rem', 
                        background: 'rgba(255,255,255,0.04)', 
                        border: '1px solid rgba(255,255,255,0.06)', 
                        borderRadius: '6px', 
                        color: 'var(--text-primary)' 
                      }}>
                        👤 {artist.alias || `${artist.firstName} ${artist.lastName}`}
                      </span>
                    ))}
                    {matchingArtists.length > 5 && (
                      <span style={{ fontSize: '0.75rem', padding: '0.2rem 0.5rem', color: 'var(--text-secondary)' }}>
                        +{matchingArtists.length - 5} more
                      </span>
                    )}
                  </div>
                )}
              </div>
            )}
          </div>

          <button 
            type="button" 
            className="btn-primary" 
            onClick={handleResetForm}
            style={{ width: '100%', maxWidth: '240px', margin: '0 auto' }}
          >
            Submit Another RFQ
          </button>
        </div>
        
        <style>{`
          @keyframes rotate {
            from { transform: rotate(0deg); }
            to { transform: rotate(360deg); }
          }
        `}</style>
      </div>
    );
  }

  // ── Render Steps ───────────────────────────────────────────────────────────
  return (
    <div className="public-form-container">
      <div className="form-card">
        
        {/* Header */}
        <header className="form-header">
          <div className="logo">ILA <span>GALLERY</span></div>
          <div style={{ fontSize: '0.85rem', color: 'var(--accent-electric)', letterSpacing: '2px', textTransform: 'uppercase', fontWeight: 600 }}>
            Art in Need Portal
          </div>
        </header>

        {/* Progress Tracker */}
        <nav aria-label="Progress" className="progress-nav">
          {/* Animated fill bar — width driven by current step */}
          <ol
            className="progress-tracker"
            style={{
              '--progress-width': `${((step - 1) / (STEP_NAMES.length - 1)) * 100}%`,
            }}
          >
            {STEP_NAMES.map((name, i) => {
              const targetStep  = i + 1;
              const isActive    = step === targetStep;
              const isDone      = step > targetStep;
              const isClickable = !isActive;

              // Tooltip text that makes the affordance crystal clear
              const tooltip = isActive
                ? `Currently on Step ${targetStep}: ${name}`
                : isDone
                  ? `↩ Go back to Step ${targetStep}: ${name}`
                  : `→ Jump to Step ${targetStep}: ${name}`;

              return (
                <li
                  key={i}
                  className={isActive ? 'step-active' : isDone ? 'step-done' : 'step-todo'}
                  aria-current={isActive ? 'step' : undefined}
                  title={tooltip}
                  onClick={() => {
                    if (isClickable) {
                      setStep(targetStep);
                      window.scrollTo({ top: 0, behavior: 'smooth' });
                    }
                  }}
                  role="button"
                  tabIndex={isClickable ? 0 : -1}
                  onKeyDown={(e) => {
                    if ((e.key === 'Enter' || e.key === ' ') && isClickable) {
                      e.preventDefault();
                      setStep(targetStep);
                      window.scrollTo({ top: 0, behavior: 'smooth' });
                    }
                  }}
                  aria-label={`${isActive ? 'Current step' : isClickable ? 'Click to go to' : 'Step'} ${targetStep}: ${name}${isDone ? ' (completed)' : ''}`}
                  style={{ cursor: isClickable ? 'pointer' : 'default' }}
                >
                  <span className="step-num">
                    {isDone ? '✓' : targetStep}
                  </span>
                  <span className="step-text">{name}</span>
                  {/* Subtle "jump" arrow hint that appears on hover for non-active steps */}
                  {isClickable && (
                    <span
                      aria-hidden="true"
                      className="step-jump-hint"
                      style={{
                        position: 'absolute',
                        top: '-18px',
                        left: '50%',
                        transform: 'translateX(-50%)',
                        fontSize: '0.6rem',
                        color: isDone ? '#4ec88c' : 'var(--accent-ochre)',
                        opacity: 0,
                        transition: 'opacity 0.2s ease',
                        pointerEvents: 'none',
                        whiteSpace: 'nowrap',
                        fontWeight: 700,
                        letterSpacing: '0.05em',
                      }}
                    >
                      {isDone ? '↩ BACK' : '→ SKIP'}
                    </span>
                  )}
                </li>
              );
            })}
          </ol>
        </nav>

        {/* Form Body */}
        <form onSubmit={step === 5 ? handleSubmit : handleNext}>
          
          {/* STEP 1: CONTACT PROFILE */}
          {step === 1 && (
            <div className="form-step-content" style={{ animation: 'fadeIn 0.3s ease forwards' }}>
              <h2 className="step-title">1. Client Contact Profile</h2>
              <p className="step-desc">Introduce yourself or your organization. Fields marked with * are required.</p>
              
              <div className="card-glass" style={{ 
                padding: '1.25rem 1.5rem', 
                marginBottom: '2rem',
                fontSize: '0.95rem',
                lineHeight: '1.6',
                color: 'var(--text-secondary)',
                animation: 'fadeIn 0.4s ease-out'
              }}>
                <h3 style={{ 
                  color: 'var(--text-primary)', 
                  fontFamily: "'Space Grotesk', sans-serif", 
                  fontSize: '1.1rem', 
                  fontWeight: 600,
                  marginBottom: '0.75rem',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem'
                }}>
                  <span className="material-symbols-outlined" style={{ fontSize: '1.25rem', color: 'var(--accent-electric)' }}>handshake</span>
                  Why Direct Connections Matter
                </h3>
                <p style={{ margin: 0, marginBottom: '0.75rem' }}>
                  Homegrown creative talent is the heartbeat of Colorado’s communities. However, connecting directly with commissioners, clients, and municipal organizations is often gated by complex networks or nationwide listing engines. We created the Art in Need Portal to dismantle these barriers—giving local clients, businesses, and municipalities a direct, frictionless pipeline to find, commission, and pay the incredible pool of talent in our homegrown artist registry.
                </p>
                <p style={{ margin: 0, marginBottom: '0.75rem' }}>
                  When you commission an artist directly, you are investing in local livelihoods and ensuring that our public spaces, galleries, and events are represented with authentic local voices. By posting your RFQ, RFP, or event needs here, your request instantly notifies vetted artists who match your exact styles, capabilities, scale, and medium preferences—bypassing corporate intermediaries and fostering genuine community connections.
                </p>
                <p style={{ margin: 0, marginBottom: '0.75rem' }}>
                  This creative hub serves as a double-sided engine of empowerment: it simplifies the booking and curation workflow for commissioners while creating sustainable, direct income streams for Colorado creatives. Every mural painted, playlist mixed, and exhibition setup built here represents a direct investment in the cultural fabric of our communities.
                </p>
                <p style={{ 
                  margin: '1rem 0 0 0', 
                  paddingTop: '0.75rem', 
                  borderTop: '1px dashed rgba(0, 180, 216, 0.3)', 
                  fontWeight: 500, 
                  color: 'var(--accent-electric)',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem',
                  fontSize: '0.9rem'
                }}>
                  <span className="material-symbols-outlined" style={{ fontSize: '1.15rem' }}>hub</span>
                  <span>Your posting will instantly query our active Colorado artist registry, notifying matching creators who meet your exact aesthetic and technical requirements.</span>
                </p>
              </div>

              {initialClient && (
                <div style={{
                  background: 'rgba(74, 131, 237, 0.08)',
                  border: '1px solid rgba(74, 131, 237, 0.2)',
                  color: '#60a5fa',
                  padding: '0.75rem 1rem',
                  borderRadius: '8px',
                  fontSize: '0.85rem',
                  fontWeight: 600,
                  marginBottom: '1.5rem',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.4rem'
                }}>
                  <span className="material-symbols-outlined" style={{ fontSize: '1.15rem' }}>check_circle</span>
                  Auto-filled from your logged-in Client Profile
                </div>
              )}

              <div className="form-grid-2">
                <div className="form-group">
                  <label className="form-label" htmlFor="clientName">Company / Client Name *</label>
                  <input 
                    required 
                    type="text" 
                    id="clientName" 
                    className="form-input"
                    value={formData.clientName}
                    disabled={!!initialClient}
                    onChange={(e) => setFormData({...formData, clientName: e.target.value})}
                    placeholder="e.g. Denver Arts Association"
                  />
                </div>
                <div className="form-group">
                  <label className="form-label" htmlFor="contactName">Primary Contact Person *</label>
                  <input 
                    required 
                    type="text" 
                    id="contactName" 
                    className="form-input"
                    value={formData.contactName}
                    disabled={!!initialClient}
                    onChange={(e) => setFormData({...formData, contactName: e.target.value})}
                    placeholder="e.g. Sarah Jenkins"
                  />
                </div>
              </div>

              <div className="form-grid-2">
                <div className="form-group">
                  <label className="form-label" htmlFor="email">Contact Email Address *</label>
                  <input 
                    required 
                    type="email" 
                    id="email" 
                    className="form-input"
                    value={formData.email}
                    disabled={!!initialClient}
                    onChange={(e) => setFormData({...formData, email: e.target.value})}
                    placeholder="e.g. sarah@example.com"
                  />
                </div>
                <div className="form-group">
                  <label className="form-label" htmlFor="phone">Contact Phone Number</label>
                  <input 
                    type="tel" 
                    id="phone" 
                    className="form-input"
                    value={formData.phone}
                    disabled={!!initialClient}
                    onChange={(e) => setFormData({...formData, phone: e.target.value})}
                    placeholder="e.g. 303-555-0199"
                  />
                </div>
              </div>

              <div className="form-group">
                <label className="form-label" htmlFor="website">Website URL</label>
                <input 
                  type="url" 
                  id="website" 
                  className="form-input"
                  value={formData.website}
                  disabled={!!initialClient}
                  onChange={(e) => setFormData({...formData, website: e.target.value})}
                  placeholder="e.g. https://myorganization.org"
                />
              </div>

              {/* Only show credentials setup for new guest clients */}
              {!initialClient && (
                <>
                  {/* Profile Picture Uploader */}
                  <div style={{ marginBottom: '2.5rem', marginTop: '1.5rem' }}>
                    <label className="form-label" style={{ display: 'block', marginBottom: '0.75rem' }}>Client Profile Logo / Picture</label>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem', flexWrap: 'wrap' }}>
                      {formData.profilePicture ? (
                        <div style={{ position: 'relative', flexShrink: 0 }}>
                          <img 
                            src={formData.profilePicture} 
                            alt="Logo Preview" 
                            style={{ width: '96px', height: '96px', borderRadius: '50%', objectFit: 'cover', border: '3px solid var(--accent-electric)', boxShadow: '0 4px 15px rgba(74, 131, 237, 0.15)' }} 
                          />
                          <button
                            type="button"
                            onClick={() => setFormData({ ...formData, profilePicture: '' })}
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
                          id="clientProfilePicInput"
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
                                setFormData({ ...formData, profilePicture: reader.result });
                              };
                            }
                          }}
                        />
                        <button
                          type="button"
                          className="btn-secondary"
                          onClick={() => document.getElementById('clientProfilePicInput').click()}
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
                            gap: '0.4rem'
                          }}
                        >
                          <span className="material-symbols-outlined" style={{ fontSize: '1.1rem' }}>photo_camera</span>
                          Upload Photo / Logo
                        </button>
                        <p style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', margin: '6px 0 0 0' }}>
                          JPEG or PNG under 800 KB. Square aspect ratio recommended.
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Biography */}
                  <div className="form-group" style={{ marginBottom: '2.5rem' }}>
                    <label className="form-label" htmlFor="bio">Client Biography / Organization Details</label>
                    <textarea
                      id="bio"
                      className="form-input"
                      style={{ minHeight: '100px', resize: 'vertical' }}
                      value={formData.bio || ''}
                      onChange={(e) => setFormData({ ...formData, bio: e.target.value })}
                      placeholder="Introduce your company, project vision, or community involvement..."
                    />
                  </div>

                  {/* Client Account Credentials */}
                  <div style={{
                    marginTop: '2.5rem',
                    paddingTop: '2rem',
                    borderTop: '1px dashed rgba(255,255,255,0.15)'
                  }}>
                    <h3 style={{
                      fontFamily: "'Space Grotesk', sans-serif",
                      fontSize: '1.1rem',
                      color: '#fff',
                      fontWeight: 600,
                      marginBottom: '0.5rem',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.4rem'
                    }}>
                      <span className="material-symbols-outlined" style={{ fontSize: '1.25rem', color: 'var(--accent-electric)' }}>lock</span>
                      Create Client Account Credentials
                    </h3>
                    <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: '1.25rem' }}>
                      Choose a username and password to access your Client Dashboard and manage your opportunities.
                    </p>
                    
                    <div className="form-grid-2">
                      <div className="form-group">
                        <label className="form-label" htmlFor="username">Create Username *</label>
                        <input 
                          required 
                          type="text" 
                          id="username" 
                          className="form-input"
                          value={formData.username || ''}
                          onChange={(e) => {
                            const val = e.target.value.toLowerCase().replace(/[^a-z0-9_.-]/g, '');
                            setFormData({ ...formData, username: val });
                            
                            if (val.length < 3) {
                              setUsernameError('Username must be at least 3 characters.');
                              return;
                            }
                            const taken = getClients().some(c => c.username?.toLowerCase() === val && c.id !== formData.id);
                            if (taken) {
                              setUsernameError('This username is already taken. Please choose another.');
                            } else {
                              setUsernameError('');
                            }
                          }}
                          placeholder="e.g. denverarts"
                        />
                        {usernameError ? (
                          <span style={{ fontSize: '0.75rem', color: '#ff6b7a', marginTop: '0.25rem', display: 'block' }}>
                            {usernameError}
                          </span>
                        ) : (
                          <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginTop: '0.25rem', display: 'block' }}>
                            Lowercase letters, numbers, dots, hyphens, and underscores only.
                          </span>
                        )}
                      </div>
                      <div className="form-group">
                        <label className="form-label" htmlFor="password">Create Password *</label>
                        <input 
                          required 
                          type="password" 
                          id="password" 
                          className="form-input"
                          value={formData.password || ''}
                          onChange={(e) => setFormData({...formData, password: e.target.value})}
                          placeholder="Choose a secure password"
                        />
                      </div>
                    </div>
                  </div>
                </>
              )}
            </div>
          )}

          {/* STEP 2: CREATIVE SCOPE */}
          {step === 2 && (
            <div className="form-step-content" style={{ animation: 'fadeIn 0.3s ease forwards' }}>
              <h2 className="step-title">2. Artistic Style &amp; Capabilities Requirements</h2>
              <p className="step-desc">Define what you need from the artists in the registry.</p>

              <div className="form-grid-2">
                <div className="form-group">
                  <label className="form-label" htmlFor="title">Opportunity Title *</label>
                  <input 
                    required 
                    type="text" 
                    id="title" 
                    className="form-input"
                    value={formData.title}
                    onChange={(e) => setFormData({...formData, title: e.target.value})}
                    placeholder="e.g. RiNo District Mural Call"
                  />
                </div>
                <div className="form-group">
                  <label className="form-label" htmlFor="category">Need Category *</label>
                  <select 
                    id="category" 
                    className="form-input"
                    value={formData.category}
                    onChange={(e) => setFormData({...formData, category: e.target.value})}
                    style={{ background: 'rgba(0, 0, 0, 0.3)', border: '1px solid var(--border-subtle)', color: 'var(--text-primary)', padding: '0.85rem 1rem', height: 'auto', borderRadius: '10px' }}
                  >
                    {CATEGORY_OPTIONS.map(opt => (
                      <option key={opt} value={opt} style={{ background: '#141416', color: '#fff' }}>{opt}</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Mediums Selector */}
              <div className="form-group">
                <label className="form-label">Required Artistic Mediums (Select all that apply) *</label>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: '0.65rem', maxHeight: '150px', overflowY: 'auto', padding: '0.85rem 1rem', background: 'rgba(0,0,0,0.15)', border: '1px solid var(--border-subtle)', borderRadius: '12px', marginTop: '0.5rem' }}>
                  {MEDIUM_OPTIONS.map(med => {
                    const isSelected = formData.mediumsNeeded.includes(med);
                    return (
                      <button
                        key={med}
                        type="button"
                        onClick={() => toggleMedium(med)}
                        style={{
                          padding: '0.4rem 0.6rem',
                          background: isSelected ? 'rgba(74, 131, 237, 0.15)' : 'rgba(255,255,255,0.02)',
                          border: isSelected ? '1px solid var(--accent-electric)' : '1px solid var(--border-subtle)',
                          borderRadius: '8px',
                          color: isSelected ? 'var(--accent-electric)' : 'var(--text-secondary)',
                          cursor: 'pointer',
                          fontSize: '0.8rem',
                          textAlign: 'left',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '0.35rem',
                          transition: 'all 0.2s ease'
                        }}
                      >
                        <span className="material-symbols-outlined" style={{ fontSize: '0.9rem' }}>
                          {isSelected ? 'check_box' : 'check_box_outline_blank'}
                        </span>
                        {med}
                      </button>
                    );
                  })}
                </div>
                
                <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.65rem', alignItems: 'center' }}>
                  <input
                    type="text"
                    value={customMedium}
                    onChange={(e) => setCustomMedium(e.target.value)}
                    placeholder="Add custom medium (e.g. Mural restoration)..."
                    style={{ flex: 1, padding: '0.5rem 0.75rem', background: 'rgba(0,0,0,0.4)', border: '1px solid var(--border-subtle)', borderRadius: '8px', color: '#fff', fontSize: '0.85rem' }}
                  />
                  <button
                    type="button"
                    onClick={() => {
                      const val = customMedium.trim();
                      if (val && !formData.mediumsNeeded.includes(val)) {
                        setFormData({
                          ...formData,
                          mediumsNeeded: [...formData.mediumsNeeded, val]
                        });
                      }
                      setCustomMedium('');
                    }}
                    style={{ padding: '0.5rem 1rem', background: 'rgba(74, 131, 237, 0.15)', border: '1px solid var(--accent-electric)', borderRadius: '8px', color: 'var(--accent-electric)', fontWeight: 600, fontSize: '0.85rem', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.25rem' }}
                  >
                    <span className="material-symbols-outlined" style={{ fontSize: '1rem' }}>add</span>
                    Add
                  </button>
                </div>
              </div>

              {/* Styles Selector */}
              <div className="form-group" style={{ marginTop: '1.5rem' }}>
                <label className="form-label">Required Artistic Styles (Select all that apply)</label>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: '0.65rem', maxHeight: '150px', overflowY: 'auto', padding: '0.85rem 1rem', background: 'rgba(0,0,0,0.15)', border: '1px solid var(--border-subtle)', borderRadius: '12px', marginTop: '0.5rem' }}>
                  {STYLE_OPTIONS.map(style => {
                    const isSelected = formData.stylesRequired.includes(style);
                    return (
                      <button
                        key={style}
                        type="button"
                        onClick={() => toggleStyle(style)}
                        style={{
                          padding: '0.4rem 0.6rem',
                          background: isSelected ? 'rgba(74, 131, 237, 0.12)' : 'rgba(255,255,255,0.01)',
                          border: isSelected ? '1px solid var(--accent-electric)' : '1px solid var(--border-subtle)',
                          borderRadius: '8px',
                          color: isSelected ? 'var(--accent-electric)' : 'var(--text-secondary)',
                          cursor: 'pointer',
                          fontSize: '0.8rem',
                          textAlign: 'left',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '0.35rem',
                          transition: 'all 0.2s ease'
                        }}
                      >
                        <span className="material-symbols-outlined" style={{ fontSize: '0.9rem' }}>
                          {isSelected ? 'check_box' : 'check_box_outline_blank'}
                        </span>
                        {style}
                      </button>
                    );
                  })}
                </div>
                
                <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.65rem', alignItems: 'center' }}>
                  <input
                    type="text"
                    value={customStyle}
                    onChange={(e) => setCustomStyle(e.target.value)}
                    placeholder="Add custom style (e.g. Cyberpunk)..."
                    style={{ flex: 1, padding: '0.5rem 0.75rem', background: 'rgba(0,0,0,0.4)', border: '1px solid var(--border-subtle)', borderRadius: '8px', color: '#fff', fontSize: '0.85rem' }}
                  />
                  <button
                    type="button"
                    onClick={() => {
                      const val = customStyle.trim();
                      if (val && !formData.stylesRequired.includes(val)) {
                        setFormData({
                          ...formData,
                          stylesRequired: [...formData.stylesRequired, val]
                        });
                      }
                      setCustomStyle('');
                    }}
                    style={{ padding: '0.5rem 1rem', background: 'rgba(74, 131, 237, 0.15)', border: '1px solid var(--accent-electric)', borderRadius: '8px', color: 'var(--accent-electric)', fontWeight: 600, fontSize: '0.85rem', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.25rem' }}
                  >
                    <span className="material-symbols-outlined" style={{ fontSize: '1rem' }}>add</span>
                    Add
                  </button>
                </div>
              </div>

              {/* Capabilities Checkboxes */}
              <div className="form-group" style={{ marginTop: '1.5rem' }}>
                <label className="form-label">Strict Technical Experience &amp; Capabilities Required (Only matching artists will be returned)</label>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '0.6rem', padding: '1rem', background: 'rgba(0,0,0,0.15)', border: '1px solid var(--border-subtle)', borderRadius: '12px', marginTop: '0.5rem' }}>
                  {CAPABILITY_OPTIONS.map(cap => {
                    const isSelected = formData.capabilitiesRequired.includes(cap.key);
                    return (
                      <label 
                        key={cap.key} 
                        style={{ 
                          display: 'flex', 
                          alignItems: 'center', 
                          gap: '0.50rem', 
                          fontSize: '0.85rem', 
                          color: isSelected ? 'var(--text-primary)' : 'var(--text-secondary)', 
                          cursor: 'pointer',
                          padding: '0.2rem 0'
                        }}
                      >
                        <input 
                          type="checkbox" 
                          checked={isSelected}
                          onChange={() => toggleCapability(cap.key)}
                          style={{ accentColor: 'var(--accent-electric)', cursor: 'pointer' }}
                        />
                        {cap.label}
                      </label>
                    );
                  })}
                </div>
              </div>

              <div className="form-group" style={{ marginTop: '1.5rem' }}>
                <label className="form-label" htmlFor="description">Scope of Work / Description *</label>
                <textarea 
                  required 
                  id="description" 
                  className="form-input"
                  rows="4"
                  value={formData.description}
                  onChange={(e) => setFormData({...formData, description: e.target.value})}
                  placeholder="Describe your creative need in detail (e.g. wall size, event set list length, style desired, etc.)"
                  style={{ minHeight: '100px', resize: 'vertical' }}
                />
              </div>

              <div className="form-group" style={{ marginTop: '1.5rem' }}>
                <label className="form-label" htmlFor="projectRequirements">Project Requirements / Equipment to Bring</label>
                <input 
                  type="text" 
                  id="projectRequirements" 
                  className="form-input"
                  value={formData.projectRequirements}
                  onChange={(e) => setFormData({...formData, projectRequirements: e.target.value})}
                  placeholder="e.g. Artist must bring own PA system (DJs), ladder/scaffolding (muralists), lighting (photographers)..."
                />
              </div>
            </div>
          )}

          {/* STEP 3: COMPENSATION & TIMELINE */}
          {step === 3 && (
            <div className="form-step-content" style={{ animation: 'fadeIn 0.3s ease forwards' }}>
              <h2 className="step-title">3. Compensation, Scale &amp; Timelines</h2>
              <p className="step-desc">Establish the financial terms, scale, and milestone dates.</p>

              <div className="form-grid-2">
                <div className="form-group">
                  <label className="form-label" htmlFor="budget">Compensation Budget / Range *</label>
                  <input 
                    required 
                    type="text" 
                    id="budget" 
                    className="form-input"
                    value={formData.budget}
                    onChange={(e) => setFormData({...formData, budget: e.target.value})}
                    placeholder="e.g. $5,000, or $500 per gig"
                  />
                </div>
                <div className="form-group">
                  <label className="form-label" htmlFor="scaleRequired">Required Scale of Work *</label>
                  <select 
                    id="scaleRequired" 
                    className="form-input"
                    value={formData.scaleRequired}
                    onChange={(e) => setFormData({...formData, scaleRequired: e.target.value})}
                    style={{ background: 'rgba(0, 0, 0, 0.3)', border: '1px solid var(--border-subtle)', color: 'var(--text-primary)', padding: '0.85rem 1rem', height: 'auto', borderRadius: '10px' }}
                  >
                    {SCALE_OPTIONS.map(opt => (
                      <option key={opt} value={opt} style={{ background: '#141416', color: '#fff' }}>{opt}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="form-grid-2">
                <div className="form-group">
                  <label className="form-label" htmlFor="deadline">Application Submission Deadline *</label>
                  <input 
                    required 
                    type="date" 
                    id="deadline" 
                    className="form-input"
                    value={formData.deadline}
                    onChange={(e) => setFormData({...formData, deadline: e.target.value})}
                    style={{ colorScheme: 'dark' }}
                  />
                </div>
                <div className="form-group">
                  <label className="form-label" htmlFor="eventDate">Estimated Project / Event Date *</label>
                  <input 
                    required 
                    type="date" 
                    id="eventDate" 
                    className="form-input"
                    value={formData.eventDate}
                    onChange={(e) => setFormData({...formData, eventDate: e.target.value})}
                    style={{ colorScheme: 'dark' }}
                  />
                </div>
              </div>

              <div className="form-group">
                <label className="form-label" htmlFor="whoShouldApply">Eligibility Criteria / Who Should Apply?</label>
                <input 
                  type="text" 
                  id="whoShouldApply" 
                  className="form-input"
                  value={formData.whoShouldApply}
                  onChange={(e) => setFormData({...formData, whoShouldApply: e.target.value})}
                  placeholder="e.g. Denver locals, must have own gear"
                />
              </div>
            </div>
          )}

          {/* STEP 4: LOCATION DETAILS */}
          {step === 4 && (
            <div className="form-step-content" style={{ animation: 'fadeIn 0.3s ease forwards' }}>
              <h2 className="step-title">4. Location &amp; Permitting Details</h2>
              <p className="step-desc">Provide physical locations and permitting details for your opportunity.</p>

              <div className="form-grid-2">
                <div className="form-group">
                  <label className="form-label" htmlFor="address">Venue / Installation Address *</label>
                  <input 
                    required 
                    type="text" 
                    id="address" 
                    className="form-input"
                    value={formData.address}
                    onChange={(e) => setFormData({...formData, address: e.target.value})}
                    placeholder="e.g. 2601 Welton St"
                  />
                </div>
                <div className="form-group">
                  <label className="form-label" htmlFor="city">Colorado Regional City *</label>
                  <select 
                    id="city" 
                    className="form-input"
                    value={formData.city}
                    onChange={(e) => handleCityChange(e.target.value)}
                    style={{ background: 'rgba(0, 0, 0, 0.3)', border: '1px solid var(--border-subtle)', color: 'var(--text-primary)', padding: '0.85rem 1rem', height: 'auto', borderRadius: '10px' }}
                  >
                    {COLORADO_CITIES.map(c => (
                      <option key={c.name} value={c.name} style={{ background: '#141416', color: '#fff' }}>{c.name}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem', marginTop: '1.5rem' }}>
                <div className="form-group">
                  <label className="form-label" htmlFor="permittingRequirements">Permitting Requirements (if any)</label>
                  <input 
                    type="text" 
                    id="permittingRequirements" 
                    className="form-input"
                    value={formData.permittingRequirements}
                    onChange={(e) => setFormData({...formData, permittingRequirements: e.target.value})}
                    placeholder="e.g. Street occupancy, building permit..."
                  />
                </div>
                <div className="form-group">
                  <label className="form-label" htmlFor="permittingPayer">Who will pay for permitting? *</label>
                  <select 
                    id="permittingPayer" 
                    className="form-input"
                    value={formData.permittingPayer}
                    onChange={(e) => setFormData({...formData, permittingPayer: e.target.value})}
                    style={{ background: 'rgba(0, 0, 0, 0.3)', border: '1px solid var(--border-subtle)', color: 'var(--text-primary)', padding: '0.85rem 1rem', height: 'auto', borderRadius: '10px' }}
                  >
                    <option value="" style={{ background: '#141416', color: '#fff' }}>-- Select Option --</option>
                    <option value="Client" style={{ background: '#141416', color: '#fff' }}>Client</option>
                    <option value="Artist" style={{ background: '#141416', color: '#fff' }}>Artist</option>
                    <option value="Shared / Split" style={{ background: '#141416', color: '#fff' }}>Shared / Split</option>
                    <option value="Not Applicable" style={{ background: '#141416', color: '#fff' }}>Not Applicable</option>
                  </select>
                </div>
              </div>
            </div>
          )}

          {/* STEP 5: REVIEW & SUBMIT */}
          {step === 5 && (
            <div className="form-step-content" style={{ animation: 'fadeIn 0.3s ease forwards' }}>
              <h2 className="step-title">5. Review &amp; Post Opportunity</h2>
              <p className="step-desc">Upload supporting briefs or site photos and review details before posting.</p>

              {/* Drag & Drop File Uploader */}
              <div className="form-group">
                <label className="form-label">Supporting Files &amp; Briefs (JPEGs, PNGs, PDFs, Word Docs - Max 3 files, 5MB limit)</label>
                
                <label 
                  className={`drag-drop-zone ${dragActive ? 'active' : ''}`}
                  onDragEnter={handleDrag}
                  onDragOver={handleDrag}
                  onDragLeave={handleDrag}
                  onDrop={handleDrop}
                  style={{
                    border: dragActive ? '2px dashed var(--accent-electric)' : '2px dashed var(--border-subtle)',
                    background: dragActive ? 'rgba(74, 131, 237, 0.05)' : 'rgba(255, 255, 255, 0.01)',
                    borderRadius: '16px',
                    padding: '2.5rem 1.5rem',
                    textAlign: 'center',
                    cursor: 'pointer',
                    transition: 'all 0.2s ease',
                    marginTop: '0.5rem',
                    display: 'block'
                  }}
                >
                  <input 
                    ref={fileInputRef}
                    type="file" 
                    multiple 
                    style={{ display: 'none' }}
                    onChange={handleFileInputChange}
                    accept="image/jpeg,image/png,image/webp,application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document,.pdf,.jpg,.jpeg,.png,.doc,.docx"
                  />
                  <span className="material-symbols-outlined" style={{ fontSize: '2.5rem', color: dragActive ? 'var(--accent-electric)' : 'var(--text-secondary)', marginBottom: '0.75rem' }}>
                    cloud_upload
                  </span>
                  <div style={{ fontWeight: 600, fontSize: '0.95rem', color: 'var(--text-primary)', marginBottom: '0.25rem' }}>
                    Drag &amp; drop files here or <span style={{ color: 'var(--accent-electric)', textDecoration: 'underline' }}>browse</span>
                  </div>
                  <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                    PDF, JPEG, PNG, or Word docs up to 5 MB
                  </div>
                </label>

                {fileError && (
                  <div style={{ color: 'rgba(255, 90, 90, 0.9)', fontSize: '0.82rem', marginTop: '0.5rem', display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                    <span className="material-symbols-outlined" style={{ fontSize: '1.1rem' }}>warning</span>
                    {fileError}
                  </div>
                )}

                {/* Uploading indicator */}
                {fileUploading && (
                  <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginTop: '0.5rem' }}>
                    Reading attachment...
                  </div>
                )}

                {/* Uploaded Files Registry List */}
                {formData.files && formData.files.length > 0 && (
                  <div style={{ marginTop: '1.25rem' }}>
                    <div style={{ fontSize: '0.88rem', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '0.5rem' }}>
                      Selected Files ({formData.files.length}/3)
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                      {formData.files.map((file, idx) => {
                        const sizeMB = (file.size / (1024 * 1024)).toFixed(2);
                        return (
                          <div 
                            key={idx} 
                            style={{ 
                              display: 'flex', 
                              justifyContent: 'space-between', 
                              alignItems: 'center', 
                              padding: '0.5rem 1rem', 
                              background: 'rgba(255,255,255,0.02)', 
                              border: '1px solid var(--border-subtle)', 
                              borderRadius: '8px' 
                            }}
                          >
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', overflow: 'hidden' }}>
                              <span className="material-symbols-outlined" style={{ fontSize: '1.25rem', color: 'var(--accent-electric)' }}>
                                {file.type.includes('image') ? 'image' : 'description'}
                              </span>
                              <span style={{ fontSize: '0.85rem', color: 'var(--text-primary)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: '250px' }}>
                                {file.name}
                              </span>
                              <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>({sizeMB} MB)</span>
                            </div>
                            <button
                              type="button"
                              onClick={() => handleRemoveFile(idx)}
                              style={{ background: 'none', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer', display: 'flex', padding: 0 }}
                            >
                              <span className="material-symbols-outlined" style={{ fontSize: '1.25rem' }}>delete</span>
                            </button>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>

              {/* Automatic matching info warning */}
              <div className="purpose-card" style={{
                background: 'rgba(74, 131, 237, 0.02)',
                borderLeft: '3px solid var(--accent-electric)',
                padding: '1.25rem 1.5rem',
                borderRadius: '8px',
                fontSize: '0.9rem',
                color: 'var(--text-secondary)',
                marginBottom: '1.5rem',
                marginTop: '1.5rem'
              }}>
                <div style={{ fontWeight: 600, color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '0.4rem', marginBottom: '0.4rem' }}>
                  <span className="material-symbols-outlined" style={{ fontSize: '1.1rem', color: 'var(--accent-electric)' }}>campaign</span>
                  Instant Statewide Registry Outreach
                </div>
                Posting this opportunity catalog will instantly map it, directory it, and trigger a **simulated search & matching alert** in our Colorado talent registry.
                <div style={{ marginTop: '0.75rem', display: 'flex', alignItems: 'center' }}>
                  <label style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer', fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-primary)' }}>
                    <input 
                      type="checkbox" 
                      checked={formData.broadcastChecked}
                      onChange={(e) => setFormData({...formData, broadcastChecked: e.target.checked})}
                      style={{ accentColor: 'var(--accent-electric)', cursor: 'pointer' }}
                    />
                    📢 Automatically match and broadcast alert emails to all eligible registered artists
                  </label>
                </div>
              </div>

              {/* Summary details */}
              <div style={{ background: 'rgba(0,0,0,0.15)', border: '1px solid var(--border-subtle)', borderRadius: '16px', padding: '1.5rem', marginTop: '1.5rem' }}>
                <h3 style={{ margin: 0, fontFamily: 'Space Grotesk', fontSize: '1.1rem', color: 'var(--text-primary)', marginBottom: '1rem' }}>RFP Posting Summary</h3>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', fontSize: '0.88rem' }}>
                  <div>
                    <span style={{ color: 'var(--text-secondary)' }}>Client Name:</span>
                    <div style={{ color: 'var(--text-primary)', fontWeight: 600 }}>{formData.clientName}</div>
                  </div>
                  <div>
                    <span style={{ color: 'var(--text-secondary)' }}>Opportunity Title:</span>
                    <div style={{ color: 'var(--text-primary)', fontWeight: 600 }}>{formData.title}</div>
                  </div>
                  <div>
                    <span style={{ color: 'var(--text-secondary)' }}>Category:</span>
                    <div style={{ color: 'var(--text-primary)' }}>{formData.category}</div>
                  </div>
                  <div>
                    <span style={{ color: 'var(--text-secondary)' }}>Scale Required:</span>
                    <div style={{ color: 'var(--text-primary)' }}>{formData.scaleRequired}</div>
                  </div>
                  <div>
                    <span style={{ color: 'var(--text-secondary)' }}>Compensation:</span>
                    <div style={{ color: 'var(--accent-ochre)', fontWeight: 600 }}>{formData.budget}</div>
                  </div>
                  <div>
                    <span style={{ color: 'var(--text-secondary)' }}>Submission Deadline:</span>
                    <div style={{ color: 'var(--text-primary)' }}>{formData.deadline}</div>
                  </div>
                  <div style={{ gridColumn: 'span 2' }}>
                    <span style={{ color: 'var(--text-secondary)' }}>Installation Address:</span>
                    <div style={{ color: 'var(--text-primary)' }}>{formData.address}, {formData.city}</div>
                  </div>
                  <div>
                    <span style={{ color: 'var(--text-secondary)' }}>Permitting Requirements:</span>
                    <div style={{ color: 'var(--text-primary)' }}>{formData.permittingRequirements || 'None specified'}</div>
                  </div>
                  <div>
                    <span style={{ color: 'var(--text-secondary)' }}>Permitting Paid By:</span>
                    <div style={{ color: 'var(--text-primary)' }}>{formData.permittingPayer || 'N/A'}</div>
                  </div>
                  <div style={{ gridColumn: 'span 2' }}>
                    <span style={{ color: 'var(--text-secondary)' }}>Project Requirements / Equipment to Bring:</span>
                    <div style={{ color: 'var(--text-primary)' }}>{formData.projectRequirements || 'None specified'}</div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Submission feedback telemetry system */}
          <SubmissionStatus stage={submissionStage} onRetry={handleSubmit} />

          {/* Form Actions Footer */}
          <footer style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginTop: '3rem',
            borderTop: '1px solid var(--border-subtle)',
            paddingTop: '1.5rem',
            gap: '1rem',
          }}>

            {/* ← Back button — always rendered, disabled on step 1 */}
            <button
              type="button"
              onClick={handleBack}
              disabled={step === 1}
              aria-label="Go to previous step"
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.45rem',
                background: step === 1 ? 'rgba(255,255,255,0.01)' : 'rgba(255,255,255,0.04)',
                border: '1px solid rgba(255,255,255,0.08)',
                color: step === 1 ? 'rgba(255,255,255,0.2)' : 'rgba(255,255,255,0.65)',
                borderRadius: '12px',
                padding: '0.75rem 1.5rem',
                cursor: step === 1 ? 'not-allowed' : 'pointer',
                fontWeight: 600,
                fontSize: '0.9rem',
                fontFamily: "'Space Grotesk', sans-serif",
                transition: 'all 0.2s ease',
                minWidth: '110px',
                justifyContent: 'center',
              }}
            >
              <span className="material-symbols-outlined" style={{ fontSize: '1rem' }}>arrow_back</span>
              Back
            </button>

            {/* Step counter pill */}
            <div style={{
              fontSize: '0.75rem',
              color: 'rgba(255,255,255,0.25)',
              letterSpacing: '0.08em',
              fontWeight: 500,
              fontFamily: "'Outfit', sans-serif",
            }}>
              Step {step} of {STEP_NAMES.length}
            </div>

            {/* Next / Publish → button */}
            <button
              type="submit"
              className="btn-primary"
              disabled={isSubmitting}
              aria-label={step === 5 ? 'Publish RFQ' : 'Go to next step'}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem',
                background: step === 5
                  ? 'linear-gradient(135deg, #00b4d8, #0090bb)'
                  : 'linear-gradient(135deg, #e05a47, #c94634)',
                border: 'none',
                borderRadius: '12px',
                padding: '0.75rem 1.75rem',
                color: '#fff',
                fontWeight: 700,
                fontSize: '0.9rem',
                fontFamily: "'Space Grotesk', sans-serif",
                cursor: isSubmitting ? 'not-allowed' : 'pointer',
                boxShadow: step === 5
                  ? '0 4px 16px rgba(0, 180, 216, 0.35)'
                  : '0 4px 16px rgba(224, 90, 71, 0.35)',
                transition: 'all 0.2s ease',
                minWidth: '150px',
                justifyContent: 'center',
                opacity: isSubmitting ? 0.7 : 1,
              }}
            >
              {isSubmitting ? (
                <>
                  <span className="loading-spinner"></span>
                  Submitting...
                </>
              ) : step === 5 ? (
                <>
                  <span className="material-symbols-outlined" style={{ fontSize: '1.1rem' }}>publish</span>
                  Publish RFQ
                </>
              ) : (
                <>
                  Continue
                  <span className="material-symbols-outlined" style={{ fontSize: '1rem' }}>arrow_forward</span>
                </>
              )}
            </button>
          </footer>

        </form>

      </div>
    </div>
  );
}
