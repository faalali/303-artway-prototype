import { useState, useEffect, useRef } from 'react';
import { submitArtistPipeline } from '../data/submissionPipeline';
import { getArtists, syncLocalArtistsToGoogleSheet, getFundingSources, emailFundingSourcesToArtist, getProjects, emailProjectPipelineToArtist } from '../data/mockDatabase';
import { loadDraft, saveDraft, clearDraft } from '../enterprise/autosaveDraft';
import SubmissionStatus from './SubmissionStatus';
import GrantApplicationAssistant from './GrantApplicationAssistant';
import ProjectMap from './ProjectMap';
import ArtistAccountPortal from './ArtistAccountPortal';

const STEP_NAMES = [
  "Bio & Identity",
  "Contact & Social",
  "Artistic Style",
  "Capabilities",
  "Submit Application"
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

const THEME_OPTIONS = [
  "Community", "Environment", "Culture", "Identity", "History", "Social Justice", 
  "Technology", "Hope", "Queer Identity", "Feminism", "Music", "Storytelling"
];

const SCALE_GROUPS = [
  {
    label: '🖼  Physical / Installation Scale',
    desc: 'For muralists, sculptors, installation artists, fabricators',
    options: [
      { value: 'Micro / Intimate', hint: 'up to 4 ft — utility boxes, small panels, tabletop' },
      { value: 'Small', hint: '4–10 ft — doors, windows, small walls' },
      { value: 'Medium', hint: '10–30 ft — bus shelters, storefronts, single-story' },
      { value: 'Large', hint: '30–60 ft — multi-story buildings, warehouses' },
      { value: 'Monumental / Architectural', hint: '60 ft+ — stadiums, bridges, skyline-scale' },
    ],
  },
  {
    label: '🎬  Film & Video Production Scope',
    desc: 'For filmmakers, cinematographers, video editors, DPs',
    options: [
      { value: 'Short-Form Content', hint: 'reels, ads, social clips under 5 min' },
      { value: 'Short Film', hint: 'narrative or doc, 5–40 min' },
      { value: 'Feature Film / Documentary', hint: 'full-length, 40 min+' },
      { value: 'Commercial / Brand Video', hint: 'product, promo, corporate' },
      { value: 'Live Event / Broadcast Video', hint: 'concerts, conferences, streaming' },
    ],
  },
  {
    label: '🎤  Performing Arts & Event Scope',
    desc: 'For musicians, DJs, dancers, performers, live acts, comedians',
    options: [
      { value: 'Intimate / Private Event', hint: 'pop-ups, house shows, 1–50 guests' },
      { value: 'Small Venue', hint: 'bars, galleries, 50–250 guests' },
      { value: 'Mid-Size Venue', hint: 'clubs, theaters, 250–1,000 guests' },
      { value: 'Large Venue', hint: 'arenas, pavilions, 1,000–5,000 guests' },
      { value: 'Festival / Multi-Day Production', hint: 'multi-stage, 5,000+ attendees' },
    ],
  },
  {
    label: '💻  Digital & Remote Scope',
    desc: 'For digital artists, designers, animators, audio engineers, web creators',
    options: [
      { value: 'Digital / Web', hint: 'websites, apps, online campaigns' },
      { value: 'Projection Mapping / XR', hint: 'VR, AR, immersive digital installation' },
      { value: 'Remote / Deliverable-Based', hint: 'fully remote, delivery by file or link' },
      { value: 'Streaming / Online Audience', hint: 'Twitch, YouTube Live, virtual events' },
    ],
  },
  {
    label: '👥  Project & Collaboration Size',
    desc: 'Applies to all vocations',
    options: [
      { value: 'Solo Project', hint: 'independent, self-directed work' },
      { value: 'Small Team (2–5)', hint: 'tight-knit crew or ensemble' },
      { value: 'Large Crew / Production', hint: '6+ collaborators, full crew' },
    ],
  },
];

const TECH_QUALIFICATIONS_OPTIONS = [
  { key: 'publicArtExperience', label: 'Have General Public Art Experience' },
  { key: 'muralExperience', label: 'Have Large Mural Painting Experience' },
  { key: 'communityEngagementExperience', label: 'Have Community Engagement / Co-Design Experience' },
  { key: 'youthEngagementExperience', label: 'Have Youth Mentorship / Paint Day Experience' },
  { key: 'teachingExperience', label: 'Have Art Teaching / Workshop Experience' },
  { key: 'licensingInsurance', label: 'Possess General Liability Insurance / Art Licensing capability' },
  { key: 'sculptureInstallationExperience', label: 'Have 3D / Sculpture Installation Experience' },
  { key: 'galleryInstallationExperience', label: 'Have Gallery Exhibition / Setup Experience' },
  { key: 'curationExperience', label: 'Have Art Curation / Exhibition Design Experience' },
  { key: 'otherInstallationExperience', label: 'Have Other Installation Experience (e.g. AV, sound)' },
  { key: 'digitalExperience', label: 'Have Digital Art / Projection Mapping / AR Experience' }
];

const MUSIC_PRODUCTION_OPTIONS = [
  { key: 'djPerformanceExperience', label: 'DJ / Turntablist — Live DJ Sets & Electronic Music Performance' },
  { key: 'liveMusicianExperience', label: 'Live Musician / Band — Vocalist, Instrumentalist, or Ensemble' },
  { key: 'musicProductionExperience', label: 'Music Producer / Recording Artist — Studio Production & Original Releases' },
  { key: 'eventPlanningExperience', label: 'Event Planner / Coordinator — Pop-Ups, Markets, Gallery Openings & Concerts' },
  { key: 'festivalProductionExperience', label: 'Festival & Large-Scale Event Producer — Multi-Day / Multi-Stage Productions' }
];

export default function ArtistQuestionnaire() {
  const [accountMode, setAccountMode] = useState('portal');
  const [step, setStep] = useState(() => {
    try {
      const cachedStep = localStorage.getItem('ila_questionnaire_step');
      return cachedStep ? parseInt(cachedStep, 10) : 1;
    } catch {
      return 1;
    }
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [successData, setSuccessData] = useState(null);
  const [submissionStage, setSubmissionStage] = useState('idle');
  const [usernameError, setUsernameError] = useState('');
  const [successTab, setSuccessTab] = useState('dashboard');
  const [successSearchQuery, setSuccessSearchQuery] = useState('');
  const [selectedFundingSource, setSelectedFundingSource] = useState(null);
  const [preloadedAssistantBudget, setPreloadedAssistantBudget] = useState(null);
  const [mapFocusItemId, setMapFocusItemId] = useState(null);
  const [emailSending, setEmailSending] = useState(false);
  const [emailSent, setEmailSent] = useState(false);
  const [simulatedToast, setSimulatedToast] = useState(false);
  const [pipelineEmailSending, setPipelineEmailSending] = useState(false);
  const [pipelineEmailSent, setPipelineEmailSent] = useState(false);
  const [pipelineSimulatedToast, setPipelineSimulatedToast] = useState(false);

  useEffect(() => {
    const runSilentSync = async () => {
      try {
        await syncLocalArtistsToGoogleSheet(true);
      } catch (err) {
        console.error('Silent background recovery sync failed:', err);
      }
    };
    runSilentSync();
  }, []);

  useEffect(() => {
    if (successData?.email && successData?.id) {
      localStorage.setItem('ila_artist_session_v1', JSON.stringify({
        email: successData.email,
        id: successData.id
      }));
    }
  }, [successData]);
  const [copied, setCopied] = useState(false);

  const [dragActive, setDragActive] = useState(false);
  const [fileError, setFileError] = useState('');
  const [fileUploading, setFileUploading] = useState(false);
  const fileInputRef = useRef(null);

  // Resume autofill state
  const [resumeDragActive, setResumeDragActive] = useState(false);
  const [resumeFileError, setResumeFileError] = useState('');
  const [resumeParsing, setResumeParsing] = useState(false);
  const [resumeParseSuccess, setResumeParseSuccess] = useState(null);
  const resumeInputRef = useRef(null);

  const handleResumeDrag = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setResumeDragActive(true);
    } else if (e.type === "dragleave") {
      setResumeDragActive(false);
    }
  };

  const handleResumeDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setResumeDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleResumeUpload(e.dataTransfer.files[0]);
    }
  };

  const handleResumeInputChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      handleResumeUpload(e.target.files[0]);
    }
  };

  const handleResumeUpload = (file) => {
    setResumeFileError('');
    setResumeParseSuccess(null);
    
    const allowedTypes = [
      'application/pdf',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'text/plain'
    ];
    
    const nameLower = file.name.toLowerCase();
    const isAllowed = allowedTypes.includes(file.type) || 
                      nameLower.endsWith('.pdf') || 
                      nameLower.endsWith('.doc') || 
                      nameLower.endsWith('.docx') || 
                      nameLower.endsWith('.txt');
                      
    if (!isAllowed) {
      setResumeFileError('Invalid file format. Please upload a PDF, DOCX, DOC, or TXT file.');
      return;
    }
    
    if (file.size > 5 * 1024 * 1024) {
      setResumeFileError('File exceeds the 5 MB limit.');
      return;
    }
    
    setResumeParsing(true);
    setTimeout(() => {
      setFormData(prev => ({
        ...prev,
        firstName: 'Alex',
        lastName: 'Rivera',
        alias: 'A.R. Rivera',
        email: 'alex.rivera.art@gmail.com',
        phone: '303-555-0199',
        notableProjects: 'RiNo Art District Mural Commission (2025), Denver Public Library Community Wall Project (2024), RedLine Contemporary Art Group Exhibition (2025)'
      }));
      setResumeParsing(false);
      setResumeParseSuccess({
        fileName: file.name,
        fieldsCount: 6,
        fieldsList: ['First Name', 'Last Name', 'Alias', 'Email', 'Phone', 'Notable Projects']
      });
    }, 1500);
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
    
    const currentFiles = formData.workExamples || [];
    if (currentFiles.length + filesList.length > 5) {
      setFileError('You can upload a maximum of 5 work examples.');
      return;
    }

    const allowedTypes = [
      'image/jpeg',
      'image/png',
      'video/mp4',
      'audio/mp3',
      'audio/mpeg',
      'application/pdf'
    ];
    const maxSizeBytes = 8 * 1024 * 1024; // 8 MB
    
    setFileUploading(true);
    const newFiles = [];

    for (let i = 0; i < filesList.length; i++) {
      const file = filesList[i];
      
      // Validate type
      if (!allowedTypes.includes(file.type) && !file.name.toLowerCase().endsWith('.mp3')) {
        setFileError(`File "${file.name}" is not supported. Allowed formats: JPEGs, PNGs, MP4s, MP3s, PDFs.`);
        setFileUploading(false);
        return;
      }
      
      // Validate size
      if (file.size > maxSizeBytes) {
        setFileError(`File "${file.name}" exceeds the 8 MB size limit.`);
        setFileUploading(false);
        return;
      }

      // Check duplicates
      const isDuplicate = currentFiles.some(f => f.name === file.name && f.size === file.size);
      if (isDuplicate) {
        continue;
      }

      try {
        const base64Data = await convertToBase64(file);
        newFiles.push({
          name: file.name,
          type: file.type || (file.name.toLowerCase().endsWith('.mp3') ? 'audio/mpeg' : ''),
          size: file.size,
          base64Data: base64Data
        });
      } catch (err) {
        console.error('FileReader error:', err);
        setFileError(`Failed to process file "${file.name}".`);
        setFileUploading(false);
        return;
      }
    }

    if (newFiles.length > 0) {
      setFormData(prev => ({
        ...prev,
        workExamples: [...(prev.workExamples || []), ...newFiles]
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

  const handleRemoveFile = (indexToRemove) => {
    setFormData(prev => ({
      ...prev,
      workExamples: prev.workExamples.filter((_, idx) => idx !== indexToRemove)
    }));
  };

  const handleResetForm = () => {
    clearDraft();
    try {
      localStorage.removeItem('ila_questionnaire_step');
    } catch (e) {}
    setFormData({
      firstName: '',
      lastName: '',
      alias: '',
      pronouns: '',
      bipocIdentity: '',
      communityAffiliations: '',
      username: '',
      password: '',
      bio: '',
      profilePicture: '',
      email: '',
      phone: '',
      website: '',
      instagram: '',
      linkedin: '',
      city: '',
      state: 'CO',
      primaryMedium: '',
      secondaryMediums: [],
      artStyles: [],
      themes: [],
      experienceLevel: 'Emerging',
      publicArtExperience: false,
      muralExperience: false,
      communityEngagementExperience: false,
      scaleCapability: [],
      collaborationPreference: 'Both',
      youthEngagementExperience: false,
      teachingExperience: false,
      licensingInsurance: false,
      sculptureInstallationExperience: false,
      galleryInstallationExperience: false,
      curationExperience: false,
      otherInstallationExperience: false,
      digitalExperience: false,
      djPerformanceExperience: false,
      liveMusicianExperience: false,
      musicProductionExperience: false,
      eventPlanningExperience: false,
      festivalProductionExperience: false,
      capabilitiesDescription: '',
      availabilityStatus: 'Available',
      budgetRange: '',
      notableProjects: '',
      references: '',
      accessibilityNeeds: '',
      portfolioUrl: '',
      workExamples: []
    });
    setStep(1);
    setSuccessData(null);
    setSuccessTab('receipt');
    setEmailSending(false);
    setEmailSent(false);
    setSimulatedToast(false);
    setPipelineEmailSending(false);
    setPipelineEmailSent(false);
    setPipelineSimulatedToast(false);
    setResumeDragActive(false);
    setResumeFileError('');
    setResumeParsing(false);
    setResumeParseSuccess(null);
  };
  
  const [formData, setFormData] = useState(() => {
    const cached = loadDraft();
    return cached || {
      firstName: '',
      lastName: '',
      alias: '',
      pronouns: '',
      bipocIdentity: '',
      communityAffiliations: '',
      username: '',
      password: '',
      bio: '',
      profilePicture: '',
      
      email: '',
      phone: '',
      website: '',
      instagram: '',
      linkedin: '',
      city: '',
      state: 'CO',
      
      primaryMedium: '',
      secondaryMediums: [],
      artStyles: [],
      themes: [],
      
      experienceLevel: 'Emerging',
      publicArtExperience: false,
      muralExperience: false,
      communityEngagementExperience: false,
      youthEngagementExperience: false,
      teachingExperience: false,
      licensingInsurance: false,
      
      sculptureInstallationExperience: false,
      galleryInstallationExperience: false,
      curationExperience: false,
      otherInstallationExperience: false,
      digitalExperience: false,
      djPerformanceExperience: false,
      liveMusicianExperience: false,
      musicProductionExperience: false,
      eventPlanningExperience: false,
      festivalProductionExperience: false,
      capabilitiesDescription: '',
      
      scaleCapability: [],
      collaborationPreference: 'Both',
      
      availabilityStatus: 'Available',
      budgetRange: '',
      notableProjects: '',
      references: '',
      accessibilityNeeds: '',
      portfolioUrl: '',
      workExamples: []
    };
  });

  useEffect(() => {
    try {
      localStorage.setItem('ila_questionnaire_step', String(step));
    } catch (e) {
      console.warn('Failed to save questionnaire step:', e);
    }
  }, [step]);

  useEffect(() => {
    saveDraft(formData);
  }, [formData]);

  const [showCustomPrimary, setShowCustomPrimary] = useState(() => {
    return formData.primaryMedium && !MEDIUM_OPTIONS.includes(formData.primaryMedium);
  });
  const [customSecondary, setCustomSecondary] = useState('');
  const [customStyle, setCustomStyle] = useState('');
  const [customTheme, setCustomTheme] = useState('');
  const [isSecondaryDropdownOpen, setIsSecondaryDropdownOpen] = useState(false);
  const [secondarySearchQuery, setSecondarySearchQuery] = useState('');
  const [isStyleDropdownOpen, setIsStyleDropdownOpen] = useState(false);
  const [styleSearchQuery, setStyleSearchQuery] = useState('');
  const [isThemeDropdownOpen, setIsThemeDropdownOpen] = useState(false);
  const [themeSearchQuery, setThemeSearchQuery] = useState('');
  const [isScaleDropdownOpen, setIsScaleDropdownOpen] = useState(false);
  const [scaleSearchQuery, setScaleSearchQuery] = useState('');
  const [isTechDropdownOpen, setIsTechDropdownOpen] = useState(false);
  const [techSearchQuery, setTechSearchQuery] = useState('');
  const [isMusicDropdownOpen, setIsMusicDropdownOpen] = useState(false);
  const [musicSearchQuery, setMusicSearchQuery] = useState('');

  const handlePrimaryMediumChange = (e) => {
    const val = e.target.value;
    if (val === 'Other') {
      setShowCustomPrimary(true);
      setFormData({ ...formData, primaryMedium: '' });
    } else {
      setShowCustomPrimary(false);
      setFormData({ ...formData, primaryMedium: val });
    }
  };

  const handleAddCustomSecondary = () => {
    const val = customSecondary.trim();
    if (!val) return;
    if (!formData.secondaryMediums.includes(val)) {
      setFormData({
        ...formData,
        secondaryMediums: [...formData.secondaryMediums, val]
      });
    }
    setCustomSecondary('');
  };

  const handleAddCustomStyle = () => {
    const val = customStyle.trim();
    if (!val) return;
    if (!formData.artStyles.includes(val)) {
      setFormData({
        ...formData,
        artStyles: [...formData.artStyles, val]
      });
    }
    setCustomStyle('');
  };

  const handleAddCustomTheme = () => {
    const val = customTheme.trim();
    if (!val) return;
    if (!formData.themes.includes(val)) {
      setFormData({
        ...formData,
        themes: [...formData.themes, val]
      });
    }
    setCustomTheme('');
  };

  const handlePillToggle = (field, value) => {
    const current = formData[field];
    if (current.includes(value)) {
      setFormData({
        ...formData,
        [field]: current.filter(item => item !== value)
      });
    } else {
      setFormData({
        ...formData,
        [field]: [...current, value]
      });
    }
  };

  const handleNext = (e) => {
    e.preventDefault();
    if (step < 5) {
      setStep(step + 1);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  const handleBack = () => {
    if (step > 1) {
      setStep(step - 1);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
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
    setIsSubmitting(true);
    setSubmissionStage('validating');

    // Normalize URLs
    const normalizedData = { ...formData };
    if (normalizedData.website && normalizedData.website.trim() && !/^https?:\/\//i.test(normalizedData.website.trim())) {
      normalizedData.website = 'https://' + normalizedData.website.trim();
    }
    if (normalizedData.linkedin && normalizedData.linkedin.trim() && !/^https?:\/\//i.test(normalizedData.linkedin.trim())) {
      normalizedData.linkedin = 'https://' + normalizedData.linkedin.trim();
    }

    const result = await submitArtistPipeline(normalizedData, (stage) => {
      setSubmissionStage(stage);
    });

    setIsSubmitting(false);

    if (result.success) {
      // "Submission saved successfully." OR "Saved successfully. Backup sync is in progress."
      setSuccessData(result.savedArtist || null);
    }
    // On firebase_error: SubmissionStatus shows "Submission failed. Please try again."
    // No alert() calls — NEVER silent, NEVER assumed success
  };

  const handleEmailFundingList = async () => {
    if (!successData || !successData.email) return;
    
    setEmailSending(true);
    try {
      const name = successData.alias || `${successData.firstName} ${successData.lastName}`;
      const result = await emailFundingSourcesToArtist(successData.email, name);
      
      if (result.success) {
        setEmailSent(true);
        if (result.simulated) {
          setSimulatedToast(true);
          setTimeout(() => setSimulatedToast(false), 5000);
        }
      } else {
        alert("Failed to request email: " + (result.error || "unknown error"));
      }
    } catch (err) {
      console.error("Error emailing funding list:", err);
      alert("An unexpected error occurred while requesting the email.");
    } finally {
      setEmailSending(false);
    }
  };

  const handleEmailPipelineList = async () => {
    if (!successData || !successData.email) return;
    
    setPipelineEmailSending(true);
    try {
      const name = successData.alias || `${successData.firstName} ${successData.lastName}`;
      const result = await emailProjectPipelineToArtist(successData.email, name);
      
      if (result.success) {
        setPipelineEmailSent(true);
        if (result.simulated) {
          setPipelineSimulatedToast(true);
          setTimeout(() => setPipelineSimulatedToast(false), 5000);
        }
      } else {
        alert("Failed to request email: " + (result.error || "unknown error"));
      }
    } catch (err) {
      console.error("Error emailing project pipeline:", err);
      alert("An unexpected error occurred while requesting the email.");
    } finally {
      setPipelineEmailSending(false);
    }
  };

  if (!successData && accountMode === 'portal') {
    return <ArtistAccountPortal
      onCreateProfile={() => setAccountMode('questionnaire')}
      onOpenGrantAssistant={(source) => {
        try { sessionStorage.setItem('ila_grant_preload', JSON.stringify(source)); } catch {}
        window.open(`${window.location.origin}/?admin#grant-assistant`, '_blank');
      }}
    />;
  }

  if (successData) {
    const shareUrl = typeof window !== 'undefined' ? (window.location.origin + '/?tab=register') : 'https://ila-gallery-database.web.app/?tab=register';
    const fundingSourcesList = getFundingSources();

    const filteredFunding = fundingSourcesList.filter(f => !f.isCommunityPost && (
      f.title.toLowerCase().includes(successSearchQuery.toLowerCase()) ||
      f.provider.toLowerCase().includes(successSearchQuery.toLowerCase()) ||
      f.description.toLowerCase().includes(successSearchQuery.toLowerCase())
    ));

    const filteredRFQs = fundingSourcesList.filter(f => {
      if (!f.isCommunityPost) return false;
      const anchor = f.submittedAt || f.openDate;
      if (!anchor) return true;
      const posted = new Date(anchor);
      const expires = new Date(posted.getTime() + 60 * 24 * 60 * 60 * 1000);
      if (new Date() < expires) {
        return (
          f.title.toLowerCase().includes(successSearchQuery.toLowerCase()) ||
          f.provider.toLowerCase().includes(successSearchQuery.toLowerCase()) ||
          f.description.toLowerCase().includes(successSearchQuery.toLowerCase()) ||
          (f.city && f.city.toLowerCase().includes(successSearchQuery.toLowerCase()))
        );
      }
      return false;
    });

    const filteredProjects = getProjects().filter(p => (
      p.name.toLowerCase().includes(successSearchQuery.toLowerCase()) ||
      p.provider.toLowerCase().includes(successSearchQuery.toLowerCase()) ||
      p.description.toLowerCase().includes(successSearchQuery.toLowerCase()) ||
      p.status.toLowerCase().includes(successSearchQuery.toLowerCase())
    ));

    return (
      <div className="public-form-container">
        <div className="success-card" style={{ 
          maxWidth: successTab === 'dashboard' ? '950px' : '1200px', 
          transition: 'max-width 0.4s cubic-bezier(0.16, 1, 0.3, 1)', 
          padding: successTab === 'dashboard' ? '3rem' : '2.25rem 3rem' 
        }}>
          
          {/* Back button visible on sub-tool pages */}
          {successTab !== 'dashboard' && (
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2.5rem', flexWrap: 'wrap', gap: '1rem', borderBottom: '1px solid rgba(255,255,255,0.06)', paddingBottom: '1.25rem' }}>
              <button 
                type="button" 
                onClick={() => { setSuccessTab('dashboard'); setSuccessSearchQuery(''); }} 
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '0.45rem',
                  background: 'rgba(255,255,255,0.04)',
                  border: '1px solid rgba(255,255,255,0.08)',
                  borderRadius: '8px',
                  padding: '0.5rem 1rem',
                  color: 'rgba(255,255,255,0.75)',
                  cursor: 'pointer',
                  fontFamily: "'Space Grotesk', sans-serif",
                  fontSize: '0.82rem',
                  fontWeight: 700,
                  transition: 'all 0.2s ease',
                }}
                onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.08)'}
                onMouseLeave={e => e.currentTarget.style.background = 'rgba(255,255,255,0.04)'}
              >
                <span className="material-symbols-outlined" style={{ fontSize: '1rem' }}>arrow_back</span>
                Back to Dashboard
              </button>

              {successTab !== 'assistant' && (
                <div className="portal-search-bar">
                  <span className="material-symbols-outlined" style={{ fontSize: '1.1rem', color: 'rgba(255,255,255,0.3)' }}>search</span>
                  <input 
                    type="text" 
                    placeholder="Search opportunities..." 
                    value={successSearchQuery}
                    onChange={(e) => setSuccessSearchQuery(e.target.value)}
                  />
                  {successSearchQuery && (
                    <button 
                      type="button"
                      onClick={() => setSuccessSearchQuery('')}
                      style={{ background: 'transparent', border: 'none', color: 'rgba(255,255,255,0.4)', cursor: 'pointer', display: 'flex', alignItems: 'center', padding: 0 }}
                    >
                      <span className="material-symbols-outlined" style={{ fontSize: '1rem' }}>close</span>
                    </button>
                  )}
                </div>
              )}
            </div>
          )}

          {successTab === 'dashboard' && (
            <div className="success-step-content" style={{ animation: 'fadeIn 0.3s ease forwards', textAlign: 'left' }}>
              
              {/* Celebration Top Layout */}
              <div style={{ 
                display: 'grid', 
                gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', 
                gap: '2.5rem', 
                marginBottom: '3rem',
                alignItems: 'center'
              }}>
                {/* Left Column: Greeting */}
                <div style={{ textAlign: 'left' }}>
                  <span className="material-symbols-outlined" style={{ fontSize: '3rem', color: 'var(--accent-terracotta)', marginBottom: '0.5rem', animation: 'scaleUp 0.4s ease' }}>check_circle</span>
                  <h1 style={{ fontFamily: 'Space Grotesk', fontSize: '2.2rem', fontWeight: 900, color: '#fff', margin: '0.25rem 0 0.75rem', lineHeight: 1.15 }}>
                    Congratulations, {successData.firstName}!
                  </h1>
                  <p style={{ color: 'rgba(255,255,255,0.7)', fontSize: '0.98rem', lineHeight: '1.6', margin: 0 }}>
                    Your registry profile has been created successfully. You are now officially part of the Colorado statewide creative directory.
                  </p>
                  <p style={{ color: 'rgba(255,255,255,0.5)', fontSize: '0.88rem', lineHeight: '1.5', marginTop: '0.75rem' }}>
                    Your profile has been queued for review by our curatorial team. We will use these details to match you with appropriate creative projects, exhibitions, murals, and event opportunities.
                  </p>
                </div>

                {/* Right Column: Digital Artist Pass (Receipt) */}
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
                    {successData.profilePicture ? (
                      <img src={successData.profilePicture} alt="Avatar" style={{ width: '56px', height: '56px', borderRadius: '50%', objectFit: 'cover', border: '2px solid var(--accent-terracotta)' }} />
                    ) : (
                      <div style={{ width: '56px', height: '56px', borderRadius: '50%', background: 'rgba(255,255,255,0.04)', display: 'flex', alignItems: 'center', justifyContent: 'center', border: '1px solid rgba(255,255,255,0.08)' }}>
                        <span className="material-symbols-outlined" style={{ fontSize: '1.5rem', color: 'rgba(255,255,255,0.3)' }}>person</span>
                      </div>
                    )}
                    <div>
                      <div style={{ fontSize: '1.1rem', fontWeight: 700, color: '#fff', fontFamily: 'Space Grotesk' }}>
                        {successData.firstName} {successData.lastName}
                      </div>
                      {successData.alias && (
                        <div style={{ fontSize: '0.8rem', color: 'var(--accent-ochre)', fontWeight: 500, marginTop: '1px' }}>
                          aka {successData.alias}
                        </div>
                      )}
                    </div>
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', fontSize: '0.82rem', marginTop: '0.25rem' }}>
                    <div>
                      <div style={{ color: 'rgba(255,255,255,0.4)', textTransform: 'uppercase', fontSize: '0.65rem', letterSpacing: '0.05em', marginBottom: '2px' }}>Medium</div>
                      <div style={{ color: '#fff', fontWeight: 600 }}>{successData.primaryMedium || 'Not specified'}</div>
                    </div>
                    <div>
                      <div style={{ color: 'rgba(255,255,255,0.4)', textTransform: 'uppercase', fontSize: '0.65rem', letterSpacing: '0.05em', marginBottom: '2px' }}>Vetting Status</div>
                      <div style={{ color: 'var(--accent-electric)', fontWeight: 600 }}>{successData.vettingStatus || 'New'}</div>
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
                      <span style={{ fontSize: '0.92rem', fontWeight: 700, color: 'var(--accent-terracotta)', fontFamily: 'Space Grotesk', marginTop: '1px' }}>{successData.id}</span>
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
                        navigator.clipboard.writeText(successData.id);
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

              {/* 2x2 Grid of Feature Cards */}
              <div style={{ marginBottom: '3rem' }}>
                <h2 style={{ fontFamily: 'Space Grotesk', fontSize: '1.35rem', fontWeight: 700, color: '#fff', marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <span className="material-symbols-outlined" style={{ color: 'var(--accent-electric)' }}>workspace_premium</span>
                  Unlocked Artist Resources &amp; Tools
                </h2>
                
                <div style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
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
                        <span className="opp-badge fit-high" style={{ background: 'rgba(224, 90, 71, 0.1)', borderColor: 'rgba(224, 90, 71, 0.25)', color: 'var(--accent-terracotta)' }}>Unlocked</span>
                      </div>
                      <h3 style={{ fontFamily: 'Space Grotesk', fontSize: '1.2rem', marginTop: '1rem', color: '#fff', fontWeight: 700 }}>Grants &amp; Funding</h3>
                      <p style={{ color: 'rgba(255,255,255,0.55)', marginTop: '0.4rem', fontSize: '0.88rem', lineHeight: '1.5' }}>
                        Browse curated regional calls, public art grants, and residency funding opportunities matching your practice.
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
                    }} onClick={() => setSuccessTab('funding')}>
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
                    }} onClick={() => setSuccessTab('clientRFQs')}>
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
                        <span className="opp-badge fit-high" style={{ background: 'rgba(74, 131, 237, 0.1)', borderColor: 'rgba(74, 131, 237, 0.25)', color: 'var(--accent-electric)' }}>Statewide</span>
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
                    }} onClick={() => setSuccessTab('pipeline')}>
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
                    }} onClick={() => setSuccessTab('assistant')}>
                      Open Assistant
                      <span className="material-symbols-outlined" style={{ fontSize: '1rem' }}>arrow_forward</span>
                    </button>
                  </div>
                </div>
              </div>

              {/* Share with a Friend Card */}
              <div className="share-section" style={{ padding: '1.5rem', borderRadius: '16px', background: 'rgba(230, 92, 70, 0.05)', border: '1px solid rgba(230, 92, 70, 0.15)', textAlign: 'center', marginBottom: '1.5rem' }}>
                <span className="material-symbols-outlined" style={{ fontSize: '1.8rem', color: 'var(--accent-terracotta)', marginBottom: '0.5rem' }}>share</span>
                <h3 style={{ fontFamily: 'Space Grotesk', fontSize: '1.1rem', color: 'var(--text-primary)', marginBottom: '0.3rem', fontWeight: 700 }}>Share this registry with a friend</h3>
                <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: '1rem', lineHeight: '1.4' }}>
                  Help other artists join the ILA Gallery Network by sharing this registry link!
                </p>
                <div className="share-link-wrapper" style={{ display: 'flex', gap: '0.5rem', background: 'rgba(0,0,0,0.2)', padding: '0.5rem', borderRadius: '8px', border: '1px solid var(--border-subtle)', alignItems: 'center' }}>
                  <input 
                    type="text" 
                    readOnly 
                    value={shareUrl} 
                    aria-label="Share Link"
                    style={{ background: 'transparent', border: 'none', color: 'var(--text-primary)', fontSize: '0.85rem', flex: 1, padding: '4px', outline: 'none' }}
                  />
                  <button 
                    type="button"
                    className="btn-primary" 
                    style={{ padding: '0.5rem 1rem', fontSize: '0.85rem', whiteSpace: 'nowrap' }}
                    onClick={() => {
                      navigator.clipboard.writeText(shareUrl);
                      alert("Share link copied to clipboard!");
                    }}
                  >
                    Copy Link
                  </button>
                </div>
              </div>
            </div>
          )}

          {successTab === 'funding' && (
            <div className="funding-step-content" style={{ textAlign: 'left', animation: 'fadeIn 0.3s ease forwards' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1.5rem' }}>
                <span className="material-symbols-outlined" style={{ fontSize: '2.5rem', color: 'var(--accent-terracotta)' }}>workspace_premium</span>
                <div>
                  <h2 style={{ fontFamily: 'Space Grotesk', fontSize: '1.5rem', margin: 0, fontWeight: 700, color: 'var(--text-primary)' }}>Exclusive Funding Database</h2>
                  <p style={{ margin: 0, color: 'var(--text-secondary)', fontSize: '0.85rem' }}>Curated active public art grants and regional RFQ listings</p>
                </div>
              </div>

              {/* Simulated Toast Notification */}
              {simulatedToast && (
                <div 
                  style={{ 
                    background: 'rgba(74, 131, 237, 0.12)',
                    border: '1px solid rgba(74, 131, 237, 0.3)',
                    padding: '1rem',
                    borderRadius: '12px',
                    marginBottom: '1.5rem',
                    color: 'var(--text-primary)',
                    fontSize: '0.85rem',
                    display: 'flex',
                    alignItems: 'flex-start',
                    gap: '0.5rem',
                    animation: 'fadeIn 0.3s ease'
                  }}
                >
                  <span className="material-symbols-outlined" style={{ color: 'var(--accent-electric)', fontSize: '1.25rem', marginTop: '2px' }}>info</span>
                  <div>
                    <strong>[Local Test Simulation]</strong> We've successfully simulated sending the email to <strong>{successData.email}</strong>! In your live deployed environment, the Google Apps Script will execute <code>MailApp.sendEmail</code> to deliver this beautiful list directly to your inbox.
                  </div>
                </div>
              )}

              {/* Email Request Bar */}
              <div 
                style={{ 
                  background: 'rgba(255,255,255,0.02)',
                  border: '1px solid var(--border-subtle)',
                  borderRadius: '16px',
                  padding: '1.25rem 1.5rem',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  flexWrap: 'wrap',
                  gap: '1rem',
                  marginBottom: '2rem'
                }}
              >
                <div style={{ flex: 1, minWidth: '250px' }}>
                  <div style={{ fontWeight: 600, fontSize: '0.95rem', color: 'var(--text-primary)' }}>Email this list to yourself</div>
                  <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginTop: '2px' }}>
                    Send this full curated directory directly to <strong>{successData.email}</strong>
                  </div>
                </div>
                
                <button 
                  type="button"
                  className="btn-primary" 
                  disabled={emailSending}
                  style={{ 
                    display: 'flex', 
                    alignItems: 'center', 
                    gap: '0.5rem', 
                    justifyContent: 'center',
                    minWidth: '160px',
                    background: emailSent ? 'rgba(74, 131, 237, 0.15)' : 'var(--accent-terracotta)',
                    borderColor: emailSent ? 'var(--accent-electric)' : 'var(--accent-terracotta)',
                    color: 'var(--text-primary)'
                  }}
                  onClick={handleEmailFundingList}
                >
                  {emailSending ? (
                    <>
                      <span className="loading-spinner" style={{ width: '14px', height: '14px', border: '2px solid rgba(255,255,255,0.2)', borderTopColor: '#fff' }}></span>
                      Sending...
                    </>
                  ) : emailSent ? (
                    <>
                      <span className="material-symbols-outlined" style={{ fontSize: '1.2rem', color: 'var(--accent-electric)' }}>check_circle</span>
                      List Emailed!
                    </>
                  ) : (
                    <>
                      <span className="material-symbols-outlined" style={{ fontSize: '1.1rem' }}>mail</span>
                      Email Me List
                    </>
                  )}
                </button>
              </div>

              {/* Funding List */}
              {filteredFunding.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '3rem 1rem', background: 'rgba(255,255,255,0.01)', border: '1px dashed rgba(255,255,255,0.08)', borderRadius: '16px', color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
                  No funding opportunities match your search.
                </div>
              ) : (
                <div className="opportunities-grid" style={{ marginBottom: '2rem' }}>
                  {filteredFunding.map((source) => {
                    const close = source.closeDate ? new Date(source.closeDate + 'T23:59:00') : null;
                    const daysLeft = close ? Math.ceil((close - new Date()) / (1000 * 60 * 60 * 24)) : null;
                    const isCritical = daysLeft !== null && daysLeft > 0 && daysLeft <= 7;

                    return (
                      <div 
                        key={source.id} 
                        className={`premium-opp-card ${isCritical ? 'critical' : ''}`}
                      >
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '0.5rem' }}>
                          <span className="opp-badge fit-high" style={{ background: 'rgba(224, 90, 71, 0.1)', borderColor: 'rgba(224, 90, 71, 0.25)', color: 'var(--accent-terracotta)' }}>{source.type}</span>
                          {daysLeft !== null && daysLeft > 0 ? (
                            <span style={{ 
                              fontSize: '0.75rem', 
                              color: isCritical ? '#ff6b7a' : '#34d399', 
                              fontWeight: 700,
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: '0.25rem'
                            }}>
                              <span style={{ width: 6, height: 6, borderRadius: '50%', background: isCritical ? '#ff4d5e' : '#34d399', display: 'inline-block' }} />
                              {daysLeft === 1 ? '1 day left' : `${daysLeft} days left`}
                            </span>
                          ) : source.closeDate ? (
                            <span style={{ fontSize: '0.72rem', color: '#ff6b7a', fontWeight: 700 }}>Closed</span>
                          ) : (
                            <span style={{ fontSize: '0.72rem', color: '#34d399', fontWeight: 700 }}>Rolling</span>
                          )}
                        </div>

                        <h3 style={{ margin: '0.25rem 0 0', fontSize: '1.15rem', color: 'var(--text-primary)', fontFamily: 'Space Grotesk', fontWeight: 700, lineHeight: 1.3 }}>{source.title}</h3>
                        
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                          <span className="material-symbols-outlined" style={{ fontSize: '0.95rem' }}>account_balance</span>
                          <span style={{ textOverflow: 'ellipsis', overflow: 'hidden', whiteSpace: 'nowrap' }}>{source.provider}</span>
                        </div>

                        <p style={{ margin: '0.25rem 0 auto', fontSize: '0.85rem', color: 'var(--text-secondary)', lineHeight: '1.45' }}>
                          {source.description}
                        </p>

                        <div className="opp-budget-tag" style={{ marginTop: '0.5rem' }}>
                          <span className="material-symbols-outlined" style={{ fontSize: '0.95rem' }}>payments</span>
                          {source.amount}
                        </div>

                        <div style={{ borderTop: '1px solid rgba(255,255,255,0.05)', paddingTop: '0.75rem', marginTop: '0.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                          <span style={{ fontSize: '0.72rem', color: 'rgba(255,255,255,0.3)', textTransform: 'uppercase' }}>ID: {source.id}</span>
                          <div style={{ display: 'flex', gap: '0.5rem' }}>
                            {source.url && (
                              <a 
                                href={`https://${source.url}`} 
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
                                Link <span className="material-symbols-outlined" style={{ fontSize: '0.85rem' }}>open_in_new</span>
                              </a>
                            )}
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
                              onClick={() => {
                                setSelectedFundingSource(source);
                                setPreloadedAssistantBudget(source.amount);
                                setSuccessTab('assistant');
                              }}
                            >
                              <span className="material-symbols-outlined" style={{ fontSize: '0.85rem' }}>edit_note</span>
                              Draft
                            </button>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {successTab === 'clientRFQs' && (
            <div className="funding-step-content" style={{ textAlign: 'left', animation: 'fadeIn 0.3s ease forwards' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1.5rem' }}>
                <span className="material-symbols-outlined" style={{ fontSize: '2.5rem', color: '#a78bfa' }}>campaign</span>
                <div>
                  <h2 style={{ fontFamily: 'Space Grotesk', fontSize: '1.5rem', margin: 0, fontWeight: 700, color: 'var(--text-primary)' }}>Art in Need Board</h2>
                  <p style={{ margin: 0, color: 'var(--text-secondary)', fontSize: '0.85rem' }}>Active commission calls, RFQs, and event gigs posted independently by local clients</p>
                </div>
              </div>

              {/* Client Opportunities List */}
              {filteredRFQs.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '3rem 1rem', background: 'rgba(255,255,255,0.01)', border: '1px dashed rgba(255,255,255,0.08)', borderRadius: '16px', color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
                  No active client needs found matching your search.
                </div>
              ) : (
                <div className="opportunities-grid" style={{ marginBottom: '2rem' }}>
                  {filteredRFQs.map((source) => (
                    <div 
                      key={source.id} 
                      className="premium-opp-card"
                      style={{ borderLeft: '4px solid #a78bfa' }}
                    >
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '0.5rem' }}>
                        <span className="opp-badge" style={{ background: 'rgba(167, 139, 250, 0.1)', borderColor: 'rgba(167, 139, 250, 0.25)', color: '#a78bfa' }}>Client Post</span>
                        <span style={{ fontSize: '0.75rem', color: 'rgba(255,255,255,0.4)', fontWeight: 600 }}>📍 {source.city || 'Colorado'}</span>
                      </div>

                      <h3 style={{ margin: '0.25rem 0 0', fontSize: '1.15rem', color: 'var(--text-primary)', fontFamily: 'Space Grotesk', fontWeight: 700, lineHeight: 1.3 }}>{source.title}</h3>
                      
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                        <span className="material-symbols-outlined" style={{ fontSize: '0.95rem' }}>corporate_fare</span>
                        <span>{source.provider}</span>
                      </div>

                      <p style={{ margin: '0.25rem 0 auto', fontSize: '0.85rem', color: 'var(--text-secondary)', lineHeight: '1.45' }}>
                        {source.description}
                      </p>

                      <div className="opp-budget-tag" style={{ marginTop: '0.5rem' }}>
                        <span className="material-symbols-outlined" style={{ fontSize: '0.95rem' }}>payments</span>
                        {source.amount}
                      </div>

                      {/* Display scale */}
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.35rem', marginTop: '0.2rem' }}>
                        <span className="opp-tag-pill">📐 {source.scale || 'Medium'} Scale</span>
                        {source.mediums && source.mediums.map(med => (
                          <span key={med} className="opp-tag-pill">{med}</span>
                        ))}
                      </div>

                      {source.contactPerson && (
                        <div style={{ 
                          background: 'rgba(0,0,0,0.18)', 
                          border: '1px solid rgba(255,255,255,0.04)', 
                          borderRadius: '8px', 
                          padding: '0.5rem 0.75rem', 
                          fontSize: '0.78rem',
                          color: 'var(--text-secondary)',
                          marginTop: '0.25rem'
                        }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem', fontWeight: 600, color: '#fff' }}>
                            <span className="material-symbols-outlined" style={{ fontSize: '0.85rem' }}>contact_page</span>
                            {source.contactPerson}
                          </div>
                          {source.contactEmail && <div style={{ fontSize: '0.72rem', marginTop: '2px', wordBreak: 'break-all' }}>{source.contactEmail}</div>}
                        </div>
                      )}

                      <div style={{ borderTop: '1px solid rgba(255,255,255,0.05)', paddingTop: '0.75rem', marginTop: '0.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.5rem' }}>
                        <span style={{ fontSize: '0.72rem', color: 'rgba(255,255,255,0.3)', textTransform: 'uppercase' }}>Deadline: {source.closeDate || 'Rolling'}</span>
                        <div style={{ display: 'flex', gap: '0.5rem' }}>
                          {source.contactEmail && (
                            <a 
                              href={`mailto:${source.contactEmail}`} 
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
                          {source.url && (
                            <a 
                              href={source.url.startsWith('http') ? source.url : `https://${source.url}`} 
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
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {successTab === 'pipeline' && (
            <div className="pipeline-step-content" style={{ textAlign: 'left', animation: 'fadeIn 0.3s ease forwards' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1.5rem' }}>
                <span className="material-symbols-outlined" style={{ fontSize: '2.5rem', color: 'var(--accent-electric)' }}>explore</span>
                <div>
                  <h2 style={{ fontFamily: 'Space Grotesk', fontSize: '1.5rem', margin: 0, fontWeight: 700, color: 'var(--text-primary)' }}>Exclusive Project Pipeline</h2>
                  <p style={{ margin: 0, color: 'var(--text-secondary)', fontSize: '0.85rem' }}>Curated active local and regional municipal projects and public art initiatives</p>
                </div>
              </div>

              {/* Simulated Toast Notification */}
              {pipelineSimulatedToast && (
                <div 
                  style={{ 
                    background: 'rgba(74, 131, 237, 0.12)',
                    border: '1px solid rgba(74, 131, 237, 0.3)',
                    padding: '1rem',
                    borderRadius: '12px',
                    marginBottom: '1.5rem',
                    color: 'var(--text-primary)',
                    fontSize: '0.85rem',
                    display: 'flex',
                    alignItems: 'flex-start',
                    gap: '0.5rem',
                    animation: 'fadeIn 0.3s ease'
                  }}
                >
                  <span className="material-symbols-outlined" style={{ color: 'var(--accent-electric)', fontSize: '1.25rem', marginTop: '2px' }}>info</span>
                  <div>
                    <strong>[Local Test Simulation]</strong> We've successfully simulated sending the project pipeline list to <strong>{successData.email}</strong>! In your live deployed environment, the Google Apps Script will execute <code>MailApp.sendEmail</code> to deliver this beautiful list directly to your inbox.
                  </div>
                </div>
              )}

              {/* Email Request Bar */}
              <div 
                style={{ 
                  background: 'rgba(255,255,255,0.02)',
                  border: '1px solid var(--border-subtle)',
                  borderRadius: '16px',
                  padding: '1.25rem 1.5rem',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  flexWrap: 'wrap',
                  gap: '1rem',
                  marginBottom: '2rem'
                }}
              >
                <div style={{ flex: 1, minWidth: '250px' }}>
                  <div style={{ fontWeight: 600, fontSize: '0.95rem', color: 'var(--text-primary)' }}>Email this pipeline to yourself</div>
                  <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginTop: '2px' }}>
                    Send this curated project pipeline directly to <strong>{successData.email}</strong>
                  </div>
                </div>
                
                <button 
                  type="button"
                  className="btn-primary" 
                  disabled={pipelineEmailSending}
                  style={{ 
                    display: 'flex', 
                    alignItems: 'center', 
                    gap: '0.5rem', 
                    justifyContent: 'center',
                    minWidth: '180px',
                    background: pipelineEmailSent ? 'rgba(74, 131, 237, 0.15)' : 'var(--accent-electric)',
                    borderColor: pipelineEmailSent ? 'var(--accent-electric)' : 'var(--accent-electric)',
                    color: 'var(--text-primary)'
                  }}
                  onClick={handleEmailPipelineList}
                >
                  {pipelineEmailSending ? (
                    <>
                      <span className="loading-spinner" style={{ width: '14px', height: '14px', border: '2px solid rgba(255,255,255,0.2)', borderTopColor: '#fff' }}></span>
                      Sending...
                    </>
                  ) : pipelineEmailSent ? (
                    <>
                      <span className="material-symbols-outlined" style={{ fontSize: '1.2rem', color: 'var(--accent-electric)' }}>check_circle</span>
                      Pipeline Emailed!
                    </>
                  ) : (
                    <>
                      <span className="material-symbols-outlined" style={{ fontSize: '1.1rem' }}>mail</span>
                      Email Me Pipeline
                    </>
                  )}
                </button>
              </div>

              {/* Project Pipeline List */}
              {filteredProjects.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '3rem 1rem', background: 'rgba(255,255,255,0.01)', border: '1px dashed rgba(255,255,255,0.08)', borderRadius: '16px', color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
                  No projects match your search.
                </div>
              ) : (
                <div className="opportunities-grid" style={{ marginBottom: '2rem' }}>
                  {filteredProjects.map((project) => (
                    <div 
                      key={project.id} 
                      className="premium-opp-card"
                    >
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '0.5rem' }}>
                        <span className="opp-badge" style={{ 
                          background: project.status === 'Approved' || project.status === 'RFQ Active' ? 'rgba(52, 211, 153, 0.12)' : 'rgba(255,255,255,0.04)', 
                          borderColor: project.status === 'Approved' || project.status === 'RFQ Active' ? 'rgba(52, 211, 153, 0.3)' : 'rgba(255,255,255,0.1)', 
                          color: project.status === 'Approved' || project.status === 'RFQ Active' ? '#34d399' : 'rgba(255,255,255,0.6)'
                        }}>{project.status}</span>
                      </div>

                      <h3 style={{ margin: '0.25rem 0 0', fontSize: '1.15rem', color: 'var(--text-primary)', fontFamily: 'Space Grotesk', fontWeight: 700, lineHeight: 1.3 }}>{project.name}</h3>
                      
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                        <span className="material-symbols-outlined" style={{ fontSize: '0.95rem' }}>corporate_fare</span>
                        <span>{project.provider}</span>
                      </div>

                      <div className="opp-budget-tag" style={{ marginTop: '0.5rem' }}>
                        <span className="material-symbols-outlined" style={{ fontSize: '0.95rem' }}>payments</span>
                        {project.budget}
                      </div>

                      <p style={{ margin: '0.25rem 0 0', fontSize: '0.85rem', color: 'var(--text-secondary)', lineHeight: '1.45' }}>
                        Funding state: <strong>{project.funding}</strong>
                      </p>

                      <div style={{ borderTop: '1px solid rgba(255,255,255,0.05)', paddingTop: '0.75rem', marginTop: '0.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <span style={{ fontSize: '0.72rem', color: 'rgba(255,255,255,0.3)', textTransform: 'uppercase' }}>ID: {project.id}</span>
                        {project.url && (
                          <a 
                            href={project.url.startsWith('http') ? project.url : `https://${project.url}`} 
                            target="_blank" 
                            rel="noopener noreferrer" 
                            style={{ 
                              fontSize: '0.8rem', 
                              color: 'var(--accent-electric)', 
                              textDecoration: 'none', 
                              display: 'flex', 
                              alignItems: 'center', 
                              gap: '0.2,',
                              fontWeight: 700,
                              background: 'rgba(74, 131, 237, 0.06)',
                              border: '1px solid rgba(74, 131, 237, 0.15)',
                              padding: '0.25rem 0.55rem',
                              borderRadius: '6px'
                            }}
                          >
                            Details <span className="material-symbols-outlined" style={{ fontSize: '0.85rem' }}>open_in_new</span>
                          </a>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {successTab === 'assistant' && (
            <div className="assistant-step-content" style={{ textAlign: 'left', animation: 'fadeIn 0.3s ease forwards' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '2rem' }}>
                <span className="material-symbols-outlined" style={{ fontSize: '2.5rem', color: 'var(--accent-ochre)' }}>auto_awesome</span>
                <div>
                  <h2 style={{ fontFamily: 'Space Grotesk', fontSize: '1.5rem', margin: 0, fontWeight: 700, color: 'var(--text-primary)' }}>Grant Application Assistant (Unlocked)</h2>
                  <p style={{ margin: 0, color: 'var(--text-secondary)', fontSize: '0.85rem' }}>Draft narrative templates, build budgets, attach portfolio items, and utilize local resources</p>
                </div>
              </div>
              <GrantApplicationAssistant 
                key={`gaa_${selectedFundingSource?.id || 'default'}`}
                preloadedBudget={preloadedAssistantBudget}
                selectedFundingSource={selectedFundingSource}
                onClearFundingSource={() => { setSelectedFundingSource(null); setPreloadedAssistantBudget(null); }}
                projects={filteredProjects}
                fundingSources={fundingSourcesList}
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
            </div>
          )}

          {successTab === 'dashboard' && (
            <>
              {/* ── Always-visible Statewide Map ─────────────────────────────── */}
              <div style={{ marginTop: '2.5rem', borderTop: '1px solid rgba(255,255,255,0.06)', paddingTop: '2rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', marginBottom: '0.75rem' }}>
                  <span className="material-symbols-outlined" style={{ fontSize: '1.6rem', color: '#4ec88c' }}>map</span>
                  <div>
                    <div style={{ fontFamily: 'Space Grotesk', fontWeight: 700, fontSize: '1.1rem', color: 'var(--text-primary)' }}>Colorado Statewide Opportunities Map</div>
                    <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Live RFQs, active commissions, project sites &amp; vetted regional suppliers — all unlocked for you</div>
                  </div>
                </div>

                <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', marginBottom: '1rem' }}>
                  {[
                    { color: '#e05a47', label: 'Funding / RFQ' },
                    { color: '#4a83ed', label: 'Project Sites' },
                    { color: '#eba65a', label: 'Suppliers & Fabricators' },
                  ].map(({ color, label }) => (
                    <span key={label} style={{ display: 'inline-flex', alignItems: 'center', gap: '0.35rem', background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '20px', padding: '0.3rem 0.75rem', fontSize: '0.78rem', color: 'rgba(255,255,255,0.65)' }}>
                      <span style={{ width: 8, height: 8, borderRadius: '50%', background: color, display: 'inline-block' }} />
                      {label}
                    </span>
                  ))}
                </div>

                <div style={{ borderRadius: '16px', overflow: 'hidden', border: '1px solid rgba(255,255,255,0.08)', minHeight: '540px' }}>
                  <ProjectMap fundingSources={getFundingSources()} projects={getProjects()} />
                </div>

                <p style={{ marginTop: '0.75rem', fontSize: '0.78rem', color: 'rgba(255,255,255,0.28)', textAlign: 'center' }}>
                  Scroll to zoom · Drag to pan · Click any marker for details
                </p>
              </div>

              <button 
                type="button"
                className="btn-primary" 
                style={{ width: '100%', justifyContent: 'center', marginTop: '1.5rem', background: 'transparent', border: '1px solid var(--border-subtle)', color: 'var(--text-primary)' }}
                onClick={handleResetForm}
              >
                Submit Another Profile
              </button>
            </>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="public-form-container">
      <div className="form-card">
        {/* Gallery Logo & Branding */}
        <header className="form-header">
          <div className="logo">ILA <span>GALLERY</span></div>
          <div style={{ fontSize: '0.85rem', color: 'var(--accent-terracotta)', letterSpacing: '2px', textTransform: 'uppercase', fontWeight: 600 }}>
            Artist Registry & Intake Portal
          </div>
        </header>

        {/* Mobile Step Progress Bar — visible only on small screens */}
        <div style={{
          display: 'none',      /* overridden to flex via CSS below */
          alignItems: 'center',
          gap: '0.65rem',
          marginBottom: '1.5rem',
          marginTop: '-0.25rem',
        }} className="mobile-step-bar">
          <div style={{
            flex: 1,
            height: '4px',
            background: 'rgba(255,255,255,0.07)',
            borderRadius: '4px',
            overflow: 'hidden',
          }}>
            <div style={{
              width: `${((step - 1) / 4) * 100}%`,
              height: '100%',
              background: 'linear-gradient(90deg, var(--accent-electric), var(--accent-terracotta))',
              borderRadius: '4px',
              transition: 'width 0.45s cubic-bezier(0.16, 1, 0.3, 1)',
            }} />
          </div>
          <span style={{
            fontSize: '0.75rem', fontWeight: 700,
            color: 'rgba(255,255,255,0.45)',
            whiteSpace: 'nowrap', flexShrink: 0,
          }}>
            Step {step} / 5
          </span>
        </div>

        {/* Progress Tracker */}
        <nav aria-label="Progress" className="progress-nav">
          <ol
            className="progress-tracker"
            style={{ '--progress-width': `${((step - 1) / (STEP_NAMES.length - 1)) * 100}%` }}
          >
            {STEP_NAMES.map((name, i) => {
              const targetStep  = i + 1;
              const isActive    = step === targetStep;
              const isDone      = step > targetStep;
              const isClickable = !isActive;

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
                  aria-label={`${isActive ? 'Current step' : 'Click to go to'} ${targetStep}: ${name}${isDone ? ' (completed)' : ''}`}
                  style={{ cursor: isClickable ? 'pointer' : 'default' }}
                >
                  <span className="step-num">
                    {isDone ? '✓' : targetStep}
                  </span>
                  <span className="step-text">{name}</span>
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
          {/* STEP 1: BIO & IDENTITY */}
          {step === 1 && (
            <div className="form-step-content">
              <h2 className="step-title">1. Artist Bio & Identity</h2>
              <p className="step-desc">Introduce yourself and your community alignments. Fields marked with * are required.</p>
              
              {/* Mission & Purpose Card */}
              <div className="purpose-card" style={{
                background: 'rgba(224, 90, 71, 0.03)',
                borderLeft: '3px solid var(--accent-terracotta)',
                padding: '1.5rem',
                borderRadius: '8px',
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
                  <span className="material-symbols-outlined" style={{ fontSize: '1.25rem', color: 'var(--accent-terracotta)' }}>explore</span>
                  Why This Database Matters
                </h3>
                <p style={{ margin: 0, marginBottom: '0.75rem' }}>
                  In Colorado, many calls for public art are open to applicants nationwide. We built this database to change that dynamic—ensuring our local, homegrown Colorado artists get the first look and right of refusal for creative projects and installations in our own neighborhoods.
                </p>
                <p style={{ margin: 0, marginBottom: '0.75rem' }}>
                  We believe that artists who live in and are connected to these communities are best equipped to preserve their histories, tell their stories, and represent them authentically. ILA Gallery is committed to working tirelessly for Denver and Colorado creatives, providing equal opportunities and direct pipelines as new projects come down the line.
                </p>
                <p style={{ margin: 0, marginBottom: '0.75rem' }}>
                  To support this mission and empower our local creative ecosystem, completing this questionnaire will grant you immediate, full access to our curated statewide <strong>Project Pipeline</strong> and active <strong>Funding Sources</strong> directories.
                </p>
                <p style={{ 
                  margin: '1rem 0 0 0', 
                  paddingTop: '0.75rem', 
                  borderTop: '1px dashed rgba(230, 92, 70, 0.3)', 
                  fontWeight: 500, 
                  color: 'var(--accent-terracotta)',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem',
                  fontSize: '0.9rem'
                }}>
                  <span className="material-symbols-outlined" style={{ fontSize: '1.15rem' }}>lock_open</span>
                  <span>Once you complete this questionnaire, you will instantly unlock full, curated access to our live statewide <strong>Project Pipeline</strong> and active <strong>Funding Sources</strong> directories.</span>
                </p>
              </div>

              {/* Resume Autofill Parser Drop-Zone */}
              <div style={{ marginBottom: '2.5rem' }}>
                <h3 style={{ 
                  color: '#fff', 
                  fontFamily: "'Space Grotesk', sans-serif", 
                  fontSize: '1.05rem', 
                  fontWeight: 600,
                  marginBottom: '0.5rem',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.4rem'
                }}>
                  <span className="material-symbols-outlined" style={{ fontSize: '1.2rem', color: 'var(--accent-ochre)' }}>electric_bolt</span>
                  ⚡ Quick Start: Auto-fill from Resume
                </h3>
                <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: '1rem', marginTop: '-0.1rem' }}>
                  Upload your resume/CV (PDF, DOCX, DOC, or TXT) to instantly extract your contact details and notable project achievements.
                </p>
                
                <label 
                  onDragEnter={handleResumeDrag}
                  onDragOver={handleResumeDrag}
                  onDragLeave={handleResumeDrag}
                  onDrop={handleResumeDrop}
                  style={{
                    border: resumeDragActive ? '2px dashed var(--accent-ochre)' : '1px dashed rgba(255, 255, 255, 0.15)',
                    borderRadius: '16px',
                    padding: '1.75rem 1.5rem',
                    textAlign: 'center',
                    background: resumeDragActive ? 'rgba(235, 176, 91, 0.08)' : 'rgba(255, 255, 255, 0.01)',
                    cursor: 'pointer',
                    transition: 'all 0.3s ease',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '0.6rem',
                    boxShadow: resumeDragActive ? '0 0 15px rgba(235, 176, 91, 0.1)' : 'none',
                  }}
                >
                  <input
                    ref={resumeInputRef}
                    type="file"
                    accept="application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document,text/plain"
                    onChange={handleResumeInputChange}
                    style={{ display: 'none' }}
                  />
                  
                  {resumeParsing ? (
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.5rem' }}>
                      <span className="material-symbols-outlined spinning" style={{ fontSize: '2.2rem', color: 'var(--accent-ochre)' }}>
                        sync
                      </span>
                      <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', fontWeight: 500 }}>
                        Extracting profile details...
                      </p>
                    </div>
                  ) : (
                    <>
                      <span 
                        className="material-symbols-outlined" 
                        style={{ 
                          fontSize: '2.4rem', 
                          color: resumeDragActive ? 'var(--accent-ochre)' : 'rgba(255,255,255,0.4)',
                          transition: 'color 0.3s ease',
                        }}
                      >
                        description
                      </span>
                      <div>
                        <p style={{ fontWeight: 600, fontSize: '0.95rem', color: '#fff', margin: 0 }}>
                          Drag & drop resume here, or <span style={{ color: 'var(--accent-ochre)', textDecoration: 'underline' }}>browse</span>
                        </p>
                        <p style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', margin: '4px 0 0 0' }}>
                          Supports PDF, DOCX, DOC, TXT up to 5 MB
                        </p>
                      </div>
                    </>
                  )}
                </label>

                {resumeFileError && (
                  <div style={{ marginTop: '0.75rem', color: '#ff6b7a', fontSize: '0.88rem', display: 'flex', alignItems: 'center', gap: '0.4rem', background: 'rgba(255, 107, 122, 0.1)', padding: '0.65rem 0.85rem', borderRadius: '8px', border: '1px solid rgba(255, 107, 122, 0.2)' }}>
                    <span className="material-symbols-outlined" style={{ fontSize: '1rem' }}>error</span>
                    <span>{resumeFileError}</span>
                  </div>
                )}

                {resumeParseSuccess && (
                  <div style={{ marginTop: '0.75rem', color: '#4ec88c', fontSize: '0.88rem', background: 'rgba(78, 200, 140, 0.08)', padding: '0.85rem 1rem', borderRadius: '8px', border: '1px solid rgba(78, 200, 140, 0.2)' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontWeight: 600, marginBottom: '0.35rem' }}>
                      <span className="material-symbols-outlined" style={{ fontSize: '1.1rem' }}>check_circle</span>
                      <span>⚡ Resume "{resumeParseSuccess.fileName}" successfully parsed!</span>
                    </div>
                    <p style={{ margin: 0, fontSize: '0.8rem', color: 'rgba(255,255,255,0.6)', lineHeight: '1.4' }}>
                      Auto-populated {resumeParseSuccess.fieldsCount} fields: {resumeParseSuccess.fieldsList.join(', ')}. Please verify these fields across all steps before submitting.
                    </p>
                  </div>
                )}
              </div>

              <div className="form-grid-2">
                <div className="form-group">
                  <label className="form-label" htmlFor="firstName">First Name *</label>
                  <input 
                    required 
                    type="text" 
                    id="firstName" 
                    className="form-input"
                    value={formData.firstName}
                    onChange={(e) => setFormData({...formData, firstName: e.target.value})}
                    placeholder="e.g. Jane"
                  />
                </div>
                <div className="form-group">
                  <label className="form-label" htmlFor="lastName">Last Name *</label>
                  <input 
                    required 
                    type="text" 
                    id="lastName" 
                    className="form-input"
                    value={formData.lastName}
                    onChange={(e) => setFormData({...formData, lastName: e.target.value})}
                    placeholder="e.g. Doe"
                  />
                </div>
              </div>

              <div className="form-grid-2">
                <div className="form-group">
                  <label className="form-label" htmlFor="alias">Artist Name / Alias</label>
                  <input 
                    type="text" 
                    id="alias" 
                    className="form-input"
                    value={formData.alias}
                    onChange={(e) => setFormData({...formData, alias: e.target.value})}
                    placeholder="e.g. Detour"
                  />
                </div>
                <div className="form-group">
                  <label className="form-label" htmlFor="pronouns">Pronouns</label>
                  <select
                    id="pronouns"
                    className="form-input"
                    value={formData.pronouns}
                    onChange={(e) => setFormData({...formData, pronouns: e.target.value})}
                    style={{ cursor: 'pointer', appearance: 'none', backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='8' viewBox='0 0 12 8'%3E%3Cpath d='M1 1l5 5 5-5' stroke='%23a1a1aa' stroke-width='1.5' fill='none' stroke-linecap='round'/%3E%3C/svg%3E")`, backgroundRepeat: 'no-repeat', backgroundPosition: 'right 1rem center', paddingRight: '2.5rem' }}
                  >
                    <option value="">Select pronouns…</option>
                    <option value="she/her">she / her</option>
                    <option value="he/him">he / him</option>
                    <option value="they/them">they / them</option>
                    <option value="she/they">she / they</option>
                    <option value="he/they">he / they</option>
                    <option value="ze/zir">ze / zir</option>
                    <option value="xe/xem">xe / xem</option>
                    <option value="any/all">any / all</option>
                    <option value="prefer-not-to-say">Prefer not to say</option>
                    <option value="prefer-to-self-describe">Prefer to self-describe…</option>
                  </select>
                  {formData.pronouns === 'prefer-to-self-describe' && (
                    <input
                      type="text"
                      className="form-input"
                      style={{ marginTop: '0.6rem' }}
                      placeholder="Enter your pronouns…"
                      value={formData.pronounsCustom || ''}
                      onChange={(e) => setFormData({...formData, pronounsCustom: e.target.value})}
                      autoFocus
                    />
                  )}
                </div>
              </div>

              <div className="form-group">
                <label className="form-label" htmlFor="bipocIdentity">BIPOC / Identity Representation <span style={{ color: 'var(--text-secondary)', fontWeight: 400 }}>(Self-Identified, Optional)</span></label>
                <select
                  id="bipocIdentity"
                  className="form-input"
                  value={formData.bipocIdentity}
                  onChange={(e) => setFormData({...formData, bipocIdentity: e.target.value})}
                  style={{ cursor: 'pointer', appearance: 'none', backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='8' viewBox='0 0 12 8'%3E%3Cpath d='M1 1l5 5 5-5' stroke='%23a1a1aa' stroke-width='1.5' fill='none' stroke-linecap='round'/%3E%3C/svg%3E")`, backgroundRepeat: 'no-repeat', backgroundPosition: 'right 1rem center', paddingRight: '2.5rem' }}
                >
                  <option value="">Select identity (optional)…</option>
                  <optgroup label="── Black / African Diaspora ──">
                    <option value="Black / African American">Black / African American</option>
                    <option value="Afro-Latino/a/x">Afro-Latino/a/x</option>
                    <option value="African (Immigrant/Diaspora)">African (Immigrant / Diaspora)</option>
                    <option value="Afro-Caribbean">Afro-Caribbean</option>
                  </optgroup>
                  <optgroup label="── Indigenous / Native ──">
                    <option value="Indigenous / Native American">Indigenous / Native American</option>
                    <option value="Alaska Native">Alaska Native</option>
                    <option value="Native Hawaiian / Pacific Islander">Native Hawaiian / Pacific Islander</option>
                    <option value="First Nations (Canada)">First Nations (Canada)</option>
                  </optgroup>
                  <optgroup label="── Latino/a/x / Hispanic ──">
                    <option value="Latino/a/x / Hispanic">Latino/a/x / Hispanic</option>
                    <option value="Chicano/a/x">Chicano/a/x</option>
                    <option value="Mexican / Mexican American">Mexican / Mexican American</option>
                    <option value="Central American">Central American</option>
                    <option value="South American">South American</option>
                  </optgroup>
                  <optgroup label="── Asian / Asian American ──">
                    <option value="Asian / Asian American">Asian / Asian American</option>
                    <option value="East Asian">East Asian</option>
                    <option value="Southeast Asian">Southeast Asian</option>
                    <option value="South Asian">South Asian</option>
                    <option value="Filipino/a/x">Filipino/a/x</option>
                  </optgroup>
                  <optgroup label="── Middle Eastern / North African ──">
                    <option value="Middle Eastern / North African (MENA)">Middle Eastern / North African (MENA)</option>
                    <option value="Arab American">Arab American</option>
                  </optgroup>
                  <optgroup label="── Multiracial / Other ──">
                    <option value="Multiracial / Mixed Race">Multiracial / Mixed Race</option>
                    <option value="Person of Color (general)">Person of Color (general)</option>
                    <option value="prefer-not-to-say">Prefer not to say</option>
                    <option value="prefer-to-self-describe">Prefer to self-describe…</option>
                  </optgroup>
                </select>
                {formData.bipocIdentity === 'prefer-to-self-describe' && (
                  <input
                    type="text"
                    className="form-input"
                    style={{ marginTop: '0.6rem' }}
                    placeholder="Describe your identity in your own words…"
                    value={formData.bipocIdentityCustom || ''}
                    onChange={(e) => setFormData({...formData, bipocIdentityCustom: e.target.value})}
                    autoFocus
                  />
                )}
              </div>

              <div className="form-group">
                <label className="form-label" htmlFor="communityAffiliations">Community Affiliations & Neighborhood Connections</label>
                <input 
                  type="text" 
                  id="communityAffiliations" 
                  className="form-input"
                  value={formData.communityAffiliations}
                  onChange={(e) => setFormData({...formData, communityAffiliations: e.target.value})}
                  placeholder="e.g. RiNo Art District, Five Points Community, local galleries, existing installations"
                />
              </div>

              {/* Profile Picture Uploader */}
              <div style={{ marginBottom: '2.5rem', marginTop: '1.5rem' }}>
                <label className="form-label" style={{ display: 'block', marginBottom: '0.75rem' }}>Profile Picture</label>
                <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem', flexWrap: 'wrap' }}>
                  {formData.profilePicture ? (
                    <div style={{ position: 'relative', flexShrink: 0 }}>
                      <img 
                        src={formData.profilePicture} 
                        alt="Profile Preview" 
                        style={{ width: '96px', height: '96px', borderRadius: '50%', objectFit: 'cover', border: '3px solid var(--accent-terracotta)', boxShadow: '0 4px 15px rgba(224, 90, 71, 0.15)' }} 
                      />
                      <button
                        type="button"
                        onClick={() => setFormData({ ...formData, profilePicture: '' })}
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
                      id="profilePicInput"
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
                      onClick={() => document.getElementById('profilePicInput').click()}
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
                      Upload Photo
                    </button>
                    <p style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', margin: '6px 0 0 0' }}>
                      JPEG or PNG under 800 KB. Square aspect ratio recommended.
                    </p>
                  </div>
                </div>
              </div>

              {/* Biography */}
              <div className="form-group" style={{ marginBottom: '1.5rem' }}>
                <label className="form-label" htmlFor="bio">Biography / About Me *</label>
                <textarea
                  required
                  id="bio"
                  className="form-input"
                  style={{ minHeight: '120px', resize: 'vertical' }}
                  value={formData.bio || ''}
                  onChange={(e) => setFormData({ ...formData, bio: e.target.value })}
                  placeholder="Share your story, artistic philosophy, and what drives your creative practice..."
                />
                <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginTop: '0.25rem', display: 'block' }}>
                  Brief summary shown on your public registry card and detailed matches sheet.
                </span>
              </div>
            </div>
          )}

          {/* STEP 2: CONTACT & SOCIAL */}
          {step === 2 && (
            <div className="form-step-content">
              <h2 className="step-title">2. Contact & Socials</h2>
              <p className="step-desc">How can we and project clients reach out to you? * is required.</p>

              <div className="form-grid-2">
                <div className="form-group">
                  <label className="form-label" htmlFor="email">Email Address *</label>
                  <input 
                    required 
                    type="email" 
                    id="email" 
                    className="form-input"
                    value={formData.email}
                    onChange={(e) => setFormData({...formData, email: e.target.value})}
                    placeholder="e.g. contact@domain.com"
                  />
                </div>
                <div className="form-group">
                  <label className="form-label" htmlFor="phone">Phone Number *</label>
                  <input 
                    required 
                    type="tel" 
                    id="phone" 
                    className="form-input"
                    value={formData.phone}
                    onChange={(e) => setFormData({...formData, phone: e.target.value})}
                    placeholder="e.g. 303-555-0100"
                  />
                </div>
              </div>

              <div className="form-grid-2">
                <div className="form-group">
                  <label className="form-label" htmlFor="website">Website / Portfolio URL</label>
                  <input 
                    type="text" 
                    id="website" 
                    className="form-input"
                    value={formData.website}
                    onChange={(e) => setFormData({...formData, website: e.target.value})}
                    placeholder="e.g. www.eazy.media"
                  />
                </div>
                <div className="form-group">
                  <label className="form-label" htmlFor="instagram">Instagram Handle</label>
                  <input 
                    type="text" 
                    id="instagram" 
                    className="form-input"
                    value={formData.instagram}
                    onChange={(e) => setFormData({...formData, instagram: e.target.value})}
                    placeholder="e.g. @myhandle"
                  />
                </div>
              </div>

              <div className="form-group">
                <label className="form-label" htmlFor="linkedin">LinkedIn Profile URL</label>
                <input 
                  type="text" 
                  id="linkedin" 
                  className="form-input"
                  value={formData.linkedin}
                  onChange={(e) => setFormData({...formData, linkedin: e.target.value})}
                  placeholder="e.g. linkedin.com/in/username"
                />
              </div>

              <div className="form-grid-2">
                <div className="form-group">
                  <label className="form-label" htmlFor="city">Location (City) *</label>
                  <input 
                    required 
                    type="text" 
                    id="city" 
                    className="form-input"
                    value={formData.city}
                    onChange={(e) => setFormData({...formData, city: e.target.value})}
                    placeholder="e.g. Denver"
                  />
                </div>
                <div className="form-group">
                  <label className="form-label" htmlFor="state">Location (State) *</label>
                  <input 
                    required 
                    type="text" 
                    id="state" 
                    className="form-input"
                    value={formData.state}
                    onChange={(e) => setFormData({...formData, state: e.target.value})}
                    placeholder="e.g. CO"
                  />
                </div>
              </div>
            </div>
          )}

          {/* STEP 3: ARTISTIC STYLE */}
          {step === 3 && (
            <div className="form-step-content">
              <h2 className="step-title">3. Artistic Medium & Focus</h2>
              <p className="step-desc">Help us filter your works for matching commissions. * is required.</p>

              <div className="form-group">
                <label className="form-label" htmlFor="primaryMedium">Primary Artistic Medium *</label>
                <select 
                  required
                  id="primaryMedium" 
                  className="form-input"
                  style={{ appearance: 'auto' }}
                  value={showCustomPrimary ? 'Other' : formData.primaryMedium}
                  onChange={handlePrimaryMediumChange}
                >
                  <option value="">-- Select Primary Medium --</option>
                  {MEDIUM_OPTIONS.map((opt, idx) => (
                    <option key={idx} value={opt}>{opt}</option>
                  ))}
                  <option value="Other">Other (Please specify...)</option>
                </select>

                {showCustomPrimary && (
                  <div style={{ marginTop: '0.75rem', animation: 'fadeIn 0.2s ease-out' }}>
                    <input
                      required
                      type="text"
                      className="form-input"
                      placeholder="Please specify your primary medium (e.g. Glassblowing, Textile Art)"
                      value={formData.primaryMedium}
                      onChange={(e) => setFormData({ ...formData, primaryMedium: e.target.value })}
                    />
                  </div>
                )}
              </div>

              <div className="form-group" style={{ position: 'relative' }}>
                <label className="form-label">Secondary Mediums & Skills (Select all that apply)</label>
                
                {/* Dropdown Toggle Button */}
                <button
                  type="button"
                  onClick={() => setIsSecondaryDropdownOpen(!isSecondaryDropdownOpen)}
                  style={{
                    background: 'rgba(255,255,255,0.03)',
                    border: '1px solid rgba(255,255,255,0.1)',
                    borderRadius: '12px',
                    padding: '0.8rem 1.2rem',
                    color: '#fff',
                    textAlign: 'left',
                    width: '100%',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    cursor: 'pointer',
                    fontSize: '1rem',
                    minHeight: '48px',
                    boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
                  }}
                >
                  <span style={{ color: formData.secondaryMediums.length > 0 ? '#fff' : 'rgba(255,255,255,0.5)' }}>
                    {formData.secondaryMediums.length > 0 
                      ? `${formData.secondaryMediums.length} medium${formData.secondaryMediums.length === 1 ? '' : 's'} selected` 
                      : 'Select secondary mediums & skills...'}
                  </span>
                  <span className="material-symbols-outlined" style={{
                    transform: isSecondaryDropdownOpen ? 'rotate(180deg)' : 'none',
                    transition: 'transform 0.2s',
                    color: 'rgba(255,255,255,0.6)'
                  }}>
                    expand_more
                  </span>
                </button>

                {/* Dropdown List Container */}
                {isSecondaryDropdownOpen && (
                  <div 
                    style={{
                      position: 'absolute',
                      zIndex: 100,
                      top: '100%',
                      left: 0,
                      width: '100%',
                      background: '#18181b',
                      border: '1px solid rgba(255,255,255,0.15)',
                      borderRadius: '12px',
                      padding: '1rem',
                      marginTop: '0.5rem',
                      boxShadow: '0 20px 40px rgba(0,0,0,0.6)',
                      display: 'flex',
                      flexDirection: 'column'
                    }}
                    onClick={(e) => e.stopPropagation()}
                  >
                    {/* Search Field */}
                    <input
                      type="text"
                      placeholder="Search mediums..."
                      value={secondarySearchQuery}
                      onChange={(e) => setSecondarySearchQuery(e.target.value)}
                      style={{
                        background: 'rgba(255,255,255,0.06)',
                        border: '1px solid rgba(255,255,255,0.1)',
                        borderRadius: '8px',
                        padding: '0.6rem 0.8rem',
                        color: '#fff',
                        fontSize: '0.9rem',
                        width: '100%',
                        marginBottom: '0.75rem',
                        outline: 'none'
                      }}
                    />

                    {/* Scrollable list */}
                    <div style={{
                      maxHeight: '220px',
                      overflowY: 'auto',
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '0.25rem',
                      paddingRight: '0.5rem'
                    }}>
                      
                      {/* Active Custom Mediums (not in preset list) */}
                      {formData.secondaryMediums.filter(val => !MEDIUM_OPTIONS.includes(val)).map((opt, idx) => (
                        <label
                          key={`custom-${idx}`}
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '0.75rem',
                            padding: '0.5rem 0.75rem',
                            borderRadius: '8px',
                            cursor: 'pointer',
                            background: 'rgba(224, 90, 71, 0.08)',
                            border: '1px solid rgba(224, 90, 71, 0.15)'
                          }}
                        >
                          <input
                            type="checkbox"
                            checked={true}
                            onChange={() => handlePillToggle('secondaryMediums', opt)}
                            style={{ width: '16px', height: '16px', accentColor: '#e05a47', cursor: 'pointer' }}
                          />
                          <span style={{ fontSize: '0.95rem', color: '#fff', display: 'flex', alignItems: 'center', gap: '0.4rem', width: '100%', justifyContent: 'space-between' }}>
                            {opt}
                            <span style={{ fontSize: '0.75rem', color: 'rgba(255,255,255,0.4)', background: 'rgba(255,255,255,0.1)', padding: '0.1rem 0.4rem', borderRadius: '4px' }}>Custom</span>
                          </span>
                        </label>
                      ))}

                      {/* Filtered Preset Options */}
                      {MEDIUM_OPTIONS.filter(opt => opt.toLowerCase().includes(secondarySearchQuery.toLowerCase())).map((opt, idx) => (
                        <label
                          key={idx}
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '0.75rem',
                            padding: '0.5rem 0.75rem',
                            borderRadius: '8px',
                            cursor: 'pointer',
                            background: formData.secondaryMediums.includes(opt) ? 'rgba(255,255,255,0.04)' : 'transparent'
                          }}
                          className="dropdown-item-hover-style"
                        >
                          <input
                            type="checkbox"
                            checked={formData.secondaryMediums.includes(opt)}
                            onChange={() => handlePillToggle('secondaryMediums', opt)}
                            style={{ width: '16px', height: '16px', accentColor: '#e05a47', cursor: 'pointer' }}
                          />
                          <span style={{ fontSize: '0.95rem', color: formData.secondaryMediums.includes(opt) ? '#fff' : 'rgba(255,255,255,0.75)' }}>{opt}</span>
                        </label>
                      ))}

                      {MEDIUM_OPTIONS.filter(opt => opt.toLowerCase().includes(secondarySearchQuery.toLowerCase())).length === 0 && (
                        <span style={{ color: 'rgba(255,255,255,0.4)', padding: '1rem', fontSize: '0.9rem', textAlign: 'center' }}>No matches found</span>
                      )}

                    </div>
                  </div>
                )}

                {/* Displaying selected items cleanly as inline tag list */}
                {formData.secondaryMediums.length > 0 && (
                  <div style={{
                    display: 'flex',
                    flexWrap: 'wrap',
                    gap: '0.5rem',
                    marginTop: '0.75rem'
                  }}>
                    {formData.secondaryMediums.map((opt, idx) => (
                      <span
                        key={idx}
                        style={{
                          background: 'rgba(255,255,255,0.06)',
                          border: '1px solid rgba(255,255,255,0.12)',
                          borderRadius: '6px',
                          padding: '0.2rem 0.6rem',
                          fontSize: '0.82rem',
                          color: 'rgba(255,255,255,0.9)',
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '0.35rem'
                        }}
                      >
                        {opt}
                        <button
                          type="button"
                          onClick={() => handlePillToggle('secondaryMediums', opt)}
                          style={{
                            background: 'transparent',
                            border: 'none',
                            color: 'rgba(255,255,255,0.4)',
                            padding: 0,
                            cursor: 'pointer',
                            fontSize: '0.85rem',
                            display: 'flex',
                            alignItems: 'center',
                            marginLeft: '0.15rem'
                          }}
                          title="Remove"
                        >
                          ✕
                        </button>
                      </span>
                    ))}
                  </div>
                )}

                {/* Custom secondary medium input field outside of dropdown */}
                <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.75rem', maxWidth: '400px' }}>
                  <input
                    type="text"
                    className="form-input"
                    style={{ padding: '0.6rem 1rem', fontSize: '0.9rem', borderRadius: '10px' }}
                    placeholder="Add custom medium..."
                    value={customSecondary}
                    onChange={(e) => setCustomSecondary(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        handleAddCustomSecondary();
                      }
                    }}
                  />
                  <button
                    type="button"
                    className="btn-primary"
                    style={{ padding: '0.6rem 1.2rem', borderRadius: '10px', fontSize: '0.9rem', whiteSpace: 'nowrap' }}
                    onClick={handleAddCustomSecondary}
                  >
                    + Add
                  </button>
                </div>
              </div>

              <div className="form-group" style={{ position: 'relative' }}>
                <label className="form-label">Art Styles Represented (Select all that apply)</label>
                
                {/* Dropdown Toggle Button */}
                <button
                  type="button"
                  onClick={() => setIsStyleDropdownOpen(!isStyleDropdownOpen)}
                  style={{
                    background: 'rgba(255,255,255,0.03)',
                    border: '1px solid rgba(255,255,255,0.1)',
                    borderRadius: '12px',
                    padding: '0.8rem 1.2rem',
                    color: '#fff',
                    textAlign: 'left',
                    width: '100%',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    cursor: 'pointer',
                    fontSize: '1rem',
                    minHeight: '48px',
                    boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
                  }}
                >
                  <span style={{ color: formData.artStyles.length > 0 ? '#fff' : 'rgba(255,255,255,0.5)' }}>
                    {formData.artStyles.length > 0 
                      ? `${formData.artStyles.length} style${formData.artStyles.length === 1 ? '' : 's'} selected` 
                      : 'Select art styles...'}
                  </span>
                  <span className="material-symbols-outlined" style={{
                    transform: isStyleDropdownOpen ? 'rotate(180deg)' : 'none',
                    transition: 'transform 0.2s',
                    color: 'rgba(255,255,255,0.6)'
                  }}>
                    expand_more
                  </span>
                </button>

                {/* Dropdown List Container */}
                {isStyleDropdownOpen && (
                  <div 
                    style={{
                      position: 'absolute',
                      zIndex: 100,
                      top: '100%',
                      left: 0,
                      width: '100%',
                      background: '#18181b',
                      border: '1px solid rgba(255,255,255,0.15)',
                      borderRadius: '12px',
                      padding: '1rem',
                      marginTop: '0.5rem',
                      boxShadow: '0 20px 40px rgba(0,0,0,0.6)',
                      display: 'flex',
                      flexDirection: 'column'
                    }}
                    onClick={(e) => e.stopPropagation()}
                  >
                    {/* Search Field */}
                    <input
                      type="text"
                      placeholder="Search styles..."
                      value={styleSearchQuery}
                      onChange={(e) => setStyleSearchQuery(e.target.value)}
                      style={{
                        background: 'rgba(255,255,255,0.06)',
                        border: '1px solid rgba(255,255,255,0.1)',
                        borderRadius: '8px',
                        padding: '0.6rem 0.8rem',
                        color: '#fff',
                        fontSize: '0.9rem',
                        width: '100%',
                        marginBottom: '0.75rem',
                        outline: 'none'
                      }}
                    />

                    {/* Scrollable list */}
                    <div style={{
                      maxHeight: '220px',
                      overflowY: 'auto',
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '0.25rem',
                      paddingRight: '0.5rem'
                    }}>
                      
                      {/* Active Custom Styles */}
                      {formData.artStyles.filter(val => !STYLE_OPTIONS.includes(val)).map((opt, idx) => (
                        <label
                          key={`custom-style-${idx}`}
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '0.75rem',
                            padding: '0.5rem 0.75rem',
                            borderRadius: '8px',
                            cursor: 'pointer',
                            background: 'rgba(224, 90, 71, 0.08)',
                            border: '1px solid rgba(224, 90, 71, 0.15)'
                          }}
                        >
                          <input
                            type="checkbox"
                            checked={true}
                            onChange={() => handlePillToggle('artStyles', opt)}
                            style={{ width: '16px', height: '16px', accentColor: '#e05a47', cursor: 'pointer' }}
                          />
                          <span style={{ fontSize: '0.95rem', color: '#fff', display: 'flex', alignItems: 'center', gap: '0.4rem', width: '100%', justifyContent: 'space-between' }}>
                            {opt}
                            <span style={{ fontSize: '0.75rem', color: 'rgba(255,255,255,0.4)', background: 'rgba(255,255,255,0.1)', padding: '0.1rem 0.4rem', borderRadius: '4px' }}>Custom</span>
                          </span>
                        </label>
                      ))}

                      {/* Filtered Preset Options */}
                      {STYLE_OPTIONS.filter(opt => opt.toLowerCase().includes(styleSearchQuery.toLowerCase())).map((opt, idx) => (
                        <label
                          key={idx}
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '0.75rem',
                            padding: '0.5rem 0.75rem',
                            borderRadius: '8px',
                            cursor: 'pointer',
                            background: formData.artStyles.includes(opt) ? 'rgba(255,255,255,0.04)' : 'transparent'
                          }}
                          className="dropdown-item-hover-style"
                        >
                          <input
                            type="checkbox"
                            checked={formData.artStyles.includes(opt)}
                            onChange={() => handlePillToggle('artStyles', opt)}
                            style={{ width: '16px', height: '16px', accentColor: '#e05a47', cursor: 'pointer' }}
                          />
                          <span style={{ fontSize: '0.95rem', color: formData.artStyles.includes(opt) ? '#fff' : 'rgba(255,255,255,0.75)' }}>{opt}</span>
                        </label>
                      ))}

                      {STYLE_OPTIONS.filter(opt => opt.toLowerCase().includes(styleSearchQuery.toLowerCase())).length === 0 && (
                        <span style={{ color: 'rgba(255,255,255,0.4)', padding: '1rem', fontSize: '0.9rem', textAlign: 'center' }}>No matches found</span>
                      )}

                    </div>
                  </div>
                )}

                {/* Displaying selected items cleanly as inline tag list */}
                {formData.artStyles.length > 0 && (
                  <div style={{
                    display: 'flex',
                    flexWrap: 'wrap',
                    gap: '0.5rem',
                    marginTop: '0.75rem'
                  }}>
                    {formData.artStyles.map((opt, idx) => (
                      <span
                        key={idx}
                        style={{
                          background: 'rgba(255,255,255,0.06)',
                          border: '1px solid rgba(255,255,255,0.12)',
                          borderRadius: '6px',
                          padding: '0.2rem 0.6rem',
                          fontSize: '0.82rem',
                          color: 'rgba(255,255,255,0.9)',
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '0.35rem'
                        }}
                      >
                        {opt}
                        <button
                          type="button"
                          onClick={() => handlePillToggle('artStyles', opt)}
                          style={{
                            background: 'transparent',
                            border: 'none',
                            color: 'rgba(255,255,255,0.4)',
                            padding: 0,
                            cursor: 'pointer',
                            fontSize: '0.85rem',
                            display: 'flex',
                            alignItems: 'center',
                            marginLeft: '0.15rem'
                          }}
                          title="Remove"
                        >
                          ✕
                        </button>
                      </span>
                    ))}
                  </div>
                )}

                {/* Custom style input field outside of dropdown */}
                <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.75rem', maxWidth: '400px' }}>
                  <input
                    type="text"
                    className="form-input"
                    style={{ padding: '0.6rem 1rem', fontSize: '0.9rem', borderRadius: '10px' }}
                    placeholder="Add custom style..."
                    value={customStyle}
                    onChange={(e) => setCustomStyle(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        handleAddCustomStyle();
                      }
                    }}
                  />
                  <button
                    type="button"
                    className="btn-primary"
                    style={{ padding: '0.6rem 1.2rem', borderRadius: '10px', fontSize: '0.9rem', whiteSpace: 'nowrap' }}
                    onClick={handleAddCustomStyle}
                  >
                    + Add
                  </button>
                </div>
              </div>

              <div className="form-group" style={{ position: 'relative' }}>
                <label className="form-label">Themes Expressed in Your Work (Select all that apply)</label>
                
                {/* Dropdown Toggle Button */}
                <button
                  type="button"
                  onClick={() => setIsThemeDropdownOpen(!isThemeDropdownOpen)}
                  style={{
                    background: 'rgba(255,255,255,0.03)',
                    border: '1px solid rgba(255,255,255,0.1)',
                    borderRadius: '12px',
                    padding: '0.8rem 1.2rem',
                    color: '#fff',
                    textAlign: 'left',
                    width: '100%',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    cursor: 'pointer',
                    fontSize: '1rem',
                    minHeight: '48px',
                    boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
                  }}
                >
                  <span style={{ color: formData.themes.length > 0 ? '#fff' : 'rgba(255,255,255,0.5)' }}>
                    {formData.themes.length > 0 
                      ? `${formData.themes.length} theme${formData.themes.length === 1 ? '' : 's'} selected` 
                      : 'Select themes...'}
                  </span>
                  <span className="material-symbols-outlined" style={{
                    transform: isThemeDropdownOpen ? 'rotate(180deg)' : 'none',
                    transition: 'transform 0.2s',
                    color: 'rgba(255,255,255,0.6)'
                  }}>
                    expand_more
                  </span>
                </button>

                {/* Dropdown List Container */}
                {isThemeDropdownOpen && (
                  <div 
                    style={{
                      position: 'absolute',
                      zIndex: 100,
                      top: '100%',
                      left: 0,
                      width: '100%',
                      background: '#18181b',
                      border: '1px solid rgba(255,255,255,0.15)',
                      borderRadius: '12px',
                      padding: '1rem',
                      marginTop: '0.5rem',
                      boxShadow: '0 20px 40px rgba(0,0,0,0.6)',
                      display: 'flex',
                      flexDirection: 'column'
                    }}
                    onClick={(e) => e.stopPropagation()}
                  >
                    {/* Search Field */}
                    <input
                      type="text"
                      placeholder="Search themes..."
                      value={themeSearchQuery}
                      onChange={(e) => setThemeSearchQuery(e.target.value)}
                      style={{
                        background: 'rgba(255,255,255,0.06)',
                        border: '1px solid rgba(255,255,255,0.1)',
                        borderRadius: '8px',
                        padding: '0.6rem 0.8rem',
                        color: '#fff',
                        fontSize: '0.9rem',
                        width: '100%',
                        marginBottom: '0.75rem',
                        outline: 'none'
                      }}
                    />

                    {/* Scrollable list */}
                    <div style={{
                      maxHeight: '220px',
                      overflowY: 'auto',
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '0.25rem',
                      paddingRight: '0.5rem'
                    }}>
                      
                      {/* Active Custom Themes */}
                      {formData.themes.filter(val => !THEME_OPTIONS.includes(val)).map((opt, idx) => (
                        <label
                          key={`custom-theme-${idx}`}
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '0.75rem',
                            padding: '0.5rem 0.75rem',
                            borderRadius: '8px',
                            cursor: 'pointer',
                            background: 'rgba(224, 90, 71, 0.08)',
                            border: '1px solid rgba(224, 90, 71, 0.15)'
                          }}
                        >
                          <input
                            type="checkbox"
                            checked={true}
                            onChange={() => handlePillToggle('themes', opt)}
                            style={{ width: '16px', height: '16px', accentColor: '#e05a47', cursor: 'pointer' }}
                          />
                          <span style={{ fontSize: '0.95rem', color: '#fff', display: 'flex', alignItems: 'center', gap: '0.4rem', width: '100%', justifyContent: 'space-between' }}>
                            {opt}
                            <span style={{ fontSize: '0.75rem', color: 'rgba(255,255,255,0.4)', background: 'rgba(255,255,255,0.1)', padding: '0.1rem 0.4rem', borderRadius: '4px' }}>Custom</span>
                          </span>
                        </label>
                      ))}

                      {/* Filtered Preset Options */}
                      {THEME_OPTIONS.filter(opt => opt.toLowerCase().includes(themeSearchQuery.toLowerCase())).map((opt, idx) => (
                        <label
                          key={idx}
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '0.75rem',
                            padding: '0.5rem 0.75rem',
                            borderRadius: '8px',
                            cursor: 'pointer',
                            background: formData.themes.includes(opt) ? 'rgba(255,255,255,0.04)' : 'transparent'
                          }}
                          className="dropdown-item-hover-style"
                        >
                          <input
                            type="checkbox"
                            checked={formData.themes.includes(opt)}
                            onChange={() => handlePillToggle('themes', opt)}
                            style={{ width: '16px', height: '16px', accentColor: '#e05a47', cursor: 'pointer' }}
                          />
                          <span style={{ fontSize: '0.95rem', color: formData.themes.includes(opt) ? '#fff' : 'rgba(255,255,255,0.75)' }}>{opt}</span>
                        </label>
                      ))}

                      {THEME_OPTIONS.filter(opt => opt.toLowerCase().includes(themeSearchQuery.toLowerCase())).length === 0 && (
                        <span style={{ color: 'rgba(255,255,255,0.4)', padding: '1rem', fontSize: '0.9rem', textAlign: 'center' }}>No matches found</span>
                      )}

                    </div>
                  </div>
                )}

                {/* Displaying selected items cleanly as inline tag list */}
                {formData.themes.length > 0 && (
                  <div style={{
                    display: 'flex',
                    flexWrap: 'wrap',
                    gap: '0.5rem',
                    marginTop: '0.75rem'
                  }}>
                    {formData.themes.map((opt, idx) => (
                      <span
                        key={idx}
                        style={{
                          background: 'rgba(255,255,255,0.06)',
                          border: '1px solid rgba(255,255,255,0.12)',
                          borderRadius: '6px',
                          padding: '0.2rem 0.6rem',
                          fontSize: '0.82rem',
                          color: 'rgba(255,255,255,0.9)',
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '0.35rem'
                        }}
                      >
                        {opt}
                        <button
                          type="button"
                          onClick={() => handlePillToggle('themes', opt)}
                          style={{
                            background: 'transparent',
                            border: 'none',
                            color: 'rgba(255,255,255,0.4)',
                            padding: 0,
                            cursor: 'pointer',
                            fontSize: '0.85rem',
                            display: 'flex',
                            alignItems: 'center',
                            marginLeft: '0.15rem'
                          }}
                          title="Remove"
                        >
                          ✕
                        </button>
                      </span>
                    ))}
                  </div>
                )}

                {/* Custom theme input field outside of dropdown */}
                <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.75rem', maxWidth: '400px' }}>
                  <input
                    type="text"
                    className="form-input"
                    style={{ padding: '0.6rem 1rem', fontSize: '0.9rem', borderRadius: '10px' }}
                    placeholder="Add custom theme..."
                    value={customTheme}
                    onChange={(e) => setCustomTheme(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        handleAddCustomTheme();
                      }
                    }}
                  />
                  <button
                    type="button"
                    className="btn-primary"
                    style={{ padding: '0.6rem 1.2rem', borderRadius: '10px', fontSize: '0.9rem', whiteSpace: 'nowrap' }}
                    onClick={handleAddCustomTheme}
                  >
                    + Add
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* STEP 4: CAPABILITIES */}
          {step === 4 && (
            <div className="form-step-content">
              <h2 className="step-title">4. Technical & Installation Capabilities</h2>
              <p className="step-desc">Detail your operational capacity for public art installations.</p>

              <div className="form-grid-2">
                <div className="form-group">
                  <label className="form-label" htmlFor="experienceLevel">Experience Level</label>
                  <select 
                    id="experienceLevel" 
                    className="form-input"
                    style={{ appearance: 'auto' }}
                    value={formData.experienceLevel}
                    onChange={(e) => setFormData({...formData, experienceLevel: e.target.value})}
                  >
                    <option value="Emerging">Emerging (0-3 years public works)</option>
                    <option value="Mid-Career">Mid-Career (3-8 years public works)</option>
                    <option value="Established">Established (8+ years / large commissions)</option>
                  </select>
                </div>

                <div className="form-group">
                  <label className="form-label" htmlFor="collaborationPreference">Collaboration Preference</label>
                  <select 
                    id="collaborationPreference" 
                    className="form-input"
                    style={{ appearance: 'auto' }}
                    value={formData.collaborationPreference}
                    onChange={(e) => setFormData({...formData, collaborationPreference: e.target.value})}
                  >
                    <option value="Solo">Prefer Solo Work</option>
                    <option value="Team">Prefer Collaborative/Team projects</option>
                    <option value="Both">Open to both Solo & Team projects</option>
                  </select>
                </div>
              </div>

              <div className="form-group" style={{ position: 'relative' }}>
                <label className="form-label">Scale & Scope Capability <span style={{ color: 'var(--text-secondary)', fontWeight: 400, fontSize: '0.85rem' }}>(Select all that apply)</span></label>
                <p style={{ fontSize: '0.82rem', color: 'rgba(255,255,255,0.35)', marginBottom: '1.25rem', lineHeight: 1.5 }}>
                  Pick every scope that describes your work — across multiple categories if needed.
                </p>
                
                {/* Dropdown Toggle Button */}
                <button
                  type="button"
                  onClick={() => setIsScaleDropdownOpen(!isScaleDropdownOpen)}
                  style={{
                    background: 'rgba(255,255,255,0.03)',
                    border: '1px solid rgba(255,255,255,0.1)',
                    borderRadius: '12px',
                    padding: '0.8rem 1.2rem',
                    color: '#fff',
                    textAlign: 'left',
                    width: '100%',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    cursor: 'pointer',
                    fontSize: '1rem',
                    minHeight: '48px',
                    boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
                  }}
                >
                  <span style={{ color: formData.scaleCapability.length > 0 ? '#fff' : 'rgba(255,255,255,0.5)' }}>
                    {formData.scaleCapability.length > 0 
                      ? `${formData.scaleCapability.length} item${formData.scaleCapability.length === 1 ? '' : 's'} selected` 
                      : 'Select scale & scope capabilities...'}
                  </span>
                  <span className="material-symbols-outlined" style={{
                    transform: isScaleDropdownOpen ? 'rotate(180deg)' : 'none',
                    transition: 'transform 0.2s',
                    color: 'rgba(255,255,255,0.6)'
                  }}>
                    expand_more
                  </span>
                </button>

                {/* Dropdown List Container */}
                {isScaleDropdownOpen && (
                  <div 
                    style={{
                      position: 'absolute',
                      zIndex: 100,
                      top: '100%',
                      left: 0,
                      width: '100%',
                      background: '#18181b',
                      border: '1px solid rgba(255,255,255,0.15)',
                      borderRadius: '12px',
                      padding: '1rem',
                      marginTop: '0.5rem',
                      boxShadow: '0 20px 40px rgba(0,0,0,0.6)',
                      display: 'flex',
                      flexDirection: 'column'
                    }}
                    onClick={(e) => e.stopPropagation()}
                  >
                    {/* Search Field */}
                    <input
                      type="text"
                      placeholder="Search scale & scope..."
                      value={scaleSearchQuery}
                      onChange={(e) => setScaleSearchQuery(e.target.value)}
                      style={{
                        background: 'rgba(255,255,255,0.06)',
                        border: '1px solid rgba(255,255,255,0.1)',
                        borderRadius: '8px',
                        padding: '0.6rem 0.8rem',
                        color: '#fff',
                        fontSize: '0.9rem',
                        width: '100%',
                        marginBottom: '0.75rem',
                        outline: 'none'
                      }}
                    />

                    {/* Scrollable list */}
                    <div style={{
                      maxHeight: '280px',
                      overflowY: 'auto',
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '0.75rem',
                      paddingRight: '0.5rem'
                    }}>
                      
                      {SCALE_GROUPS.map((group) => {
                        // Filter options within this group based on search query
                        const filteredOptions = group.options.filter(opt =>
                          opt.value.toLowerCase().includes(scaleSearchQuery.toLowerCase()) ||
                          (opt.hint && opt.hint.toLowerCase().includes(scaleSearchQuery.toLowerCase()))
                        );

                        if (filteredOptions.length === 0) return null;

                        return (
                          <div key={group.label} style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                            {/* Group Header */}
                            <div style={{ display: 'flex', alignItems: 'baseline', gap: '0.6rem', padding: '0.25rem 0.5rem 0.1rem 0.5rem', borderBottom: '1px solid rgba(255,255,255,0.05)', marginBottom: '0.25rem' }}>
                              <span style={{ fontSize: '0.72rem', fontWeight: 700, color: 'rgba(255,255,255,0.4)', letterSpacing: '0.04em', textTransform: 'uppercase' }}>
                                {group.label}
                              </span>
                            </div>

                            {/* Group Options */}
                            {filteredOptions.map((opt) => {
                              const isChecked = formData.scaleCapability.includes(opt.value);
                              return (
                                <label
                                  key={opt.value}
                                  style={{
                                    display: 'flex',
                                    alignItems: 'flex-start',
                                    gap: '0.75rem',
                                    padding: '0.5rem 0.75rem',
                                    borderRadius: '8px',
                                    cursor: 'pointer',
                                    background: isChecked ? 'rgba(255,255,255,0.04)' : 'transparent'
                                  }}
                                  className="dropdown-item-hover-style"
                                  title={opt.hint}
                                >
                                  <input
                                    type="checkbox"
                                    checked={isChecked}
                                    onChange={() => handlePillToggle('scaleCapability', opt.value)}
                                    style={{ width: '16px', height: '16px', marginTop: '0.15rem', accentColor: '#e05a47', cursor: 'pointer' }}
                                  />
                                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.15rem' }}>
                                    <span style={{ fontSize: '0.92rem', fontWeight: 600, color: isChecked ? '#fff' : 'rgba(255,255,255,0.75)' }}>{opt.value}</span>
                                    <span style={{ fontSize: '0.72rem', color: 'rgba(255,255,255,0.45)' }}>{opt.hint}</span>
                                  </div>
                                </label>
                              );
                            })}
                          </div>
                        );
                      })}

                      {/* No Match Check */}
                      {SCALE_GROUPS.every(group => 
                        group.options.filter(opt => 
                          opt.value.toLowerCase().includes(scaleSearchQuery.toLowerCase()) ||
                          (opt.hint && opt.hint.toLowerCase().includes(scaleSearchQuery.toLowerCase()))
                        ).length === 0
                      ) && (
                        <span style={{ color: 'rgba(255,255,255,0.4)', padding: '1rem', fontSize: '0.9rem', textAlign: 'center' }}>No matches found</span>
                      )}

                    </div>
                  </div>
                )}

                {/* Displaying selected items cleanly as inline tag list */}
                {formData.scaleCapability.length > 0 && (
                  <div style={{
                    display: 'flex',
                    flexWrap: 'wrap',
                    gap: '0.5rem',
                    marginTop: '0.75rem'
                  }}>
                    {formData.scaleCapability.map((opt, idx) => (
                      <span
                        key={idx}
                        style={{
                          background: 'rgba(255,255,255,0.06)',
                          border: '1px solid rgba(255,255,255,0.12)',
                          borderRadius: '6px',
                          padding: '0.2rem 0.6rem',
                          fontSize: '0.82rem',
                          color: 'rgba(255,255,255,0.9)',
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '0.35rem'
                        }}
                      >
                        {opt}
                        <button
                          type="button"
                          onClick={() => handlePillToggle('scaleCapability', opt)}
                          style={{
                            background: 'transparent',
                            border: 'none',
                            color: 'rgba(255,255,255,0.4)',
                            padding: 0,
                            cursor: 'pointer',
                            fontSize: '0.85rem',
                            display: 'flex',
                            alignItems: 'center',
                            marginLeft: '0.15rem'
                          }}
                          title="Remove"
                        >
                          ✕
                        </button>
                      </span>
                    ))}
                  </div>
                )}
              </div>

              <div className="form-group" style={{ position: 'relative' }}>
                <label className="form-label">Technical Experience & Qualifications <span style={{ color: 'var(--text-secondary)', fontWeight: 400, fontSize: '0.85rem' }}>(Select all that apply)</span></label>
                
                {/* Dropdown Toggle Button */}
                <button
                  type="button"
                  onClick={() => setIsTechDropdownOpen(!isTechDropdownOpen)}
                  style={{
                    background: 'rgba(255,255,255,0.03)',
                    border: '1px solid rgba(255,255,255,0.1)',
                    borderRadius: '12px',
                    padding: '0.8rem 1.2rem',
                    color: '#fff',
                    textAlign: 'left',
                    width: '100%',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    cursor: 'pointer',
                    fontSize: '1rem',
                    minHeight: '48px',
                    boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
                  }}
                >
                  <span style={{ color: TECH_QUALIFICATIONS_OPTIONS.filter(opt => formData[opt.key]).length > 0 ? '#fff' : 'rgba(255,255,255,0.5)' }}>
                    {TECH_QUALIFICATIONS_OPTIONS.filter(opt => formData[opt.key]).length > 0 
                      ? `${TECH_QUALIFICATIONS_OPTIONS.filter(opt => formData[opt.key]).length} qualification${TECH_QUALIFICATIONS_OPTIONS.filter(opt => formData[opt.key]).length === 1 ? '' : 's'} selected` 
                      : 'Select technical experience...'}
                  </span>
                  <span className="material-symbols-outlined" style={{
                    transform: isTechDropdownOpen ? 'rotate(180deg)' : 'none',
                    transition: 'transform 0.2s',
                    color: 'rgba(255,255,255,0.6)'
                  }}>
                    expand_more
                  </span>
                </button>

                {/* Dropdown List Container */}
                {isTechDropdownOpen && (
                  <div 
                    style={{
                      position: 'absolute',
                      zIndex: 100,
                      top: '100%',
                      left: 0,
                      width: '100%',
                      background: '#18181b',
                      border: '1px solid rgba(255,255,255,0.15)',
                      borderRadius: '12px',
                      padding: '1rem',
                      marginTop: '0.5rem',
                      boxShadow: '0 20px 40px rgba(0,0,0,0.6)',
                      display: 'flex',
                      flexDirection: 'column'
                    }}
                    onClick={(e) => e.stopPropagation()}
                  >
                    {/* Search Field */}
                    <input
                      type="text"
                      placeholder="Search qualifications..."
                      value={techSearchQuery}
                      onChange={(e) => setTechSearchQuery(e.target.value)}
                      style={{
                        background: 'rgba(255,255,255,0.06)',
                        border: '1px solid rgba(255,255,255,0.1)',
                        borderRadius: '8px',
                        padding: '0.6rem 0.8rem',
                        color: '#fff',
                        fontSize: '0.9rem',
                        width: '100%',
                        marginBottom: '0.75rem',
                        outline: 'none'
                      }}
                    />

                    {/* Scrollable list */}
                    <div style={{
                      maxHeight: '250px',
                      overflowY: 'auto',
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '0.25rem',
                      paddingRight: '0.5rem'
                    }}>
                      
                      {TECH_QUALIFICATIONS_OPTIONS.filter(opt => opt.label.toLowerCase().includes(techSearchQuery.toLowerCase())).map((opt, idx) => (
                        <label
                          key={idx}
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '0.75rem',
                            padding: '0.5rem 0.75rem',
                            borderRadius: '8px',
                            cursor: 'pointer',
                            background: formData[opt.key] ? 'rgba(255,255,255,0.04)' : 'transparent'
                          }}
                          className="dropdown-item-hover-style"
                        >
                          <input
                            type="checkbox"
                            checked={!!formData[opt.key]}
                            onChange={() => setFormData({ ...formData, [opt.key]: !formData[opt.key] })}
                            style={{ width: '16px', height: '16px', accentColor: '#e05a47', cursor: 'pointer' }}
                          />
                          <span style={{ fontSize: '0.95rem', color: formData[opt.key] ? '#fff' : 'rgba(255,255,255,0.75)' }}>{opt.label}</span>
                        </label>
                      ))}

                      {TECH_QUALIFICATIONS_OPTIONS.filter(opt => opt.label.toLowerCase().includes(techSearchQuery.toLowerCase())).length === 0 && (
                        <span style={{ color: 'rgba(255,255,255,0.4)', padding: '1rem', fontSize: '0.9rem', textAlign: 'center' }}>No matches found</span>
                      )}

                    </div>
                  </div>
                )}

                {/* Displaying selected items cleanly as inline tag list */}
                {TECH_QUALIFICATIONS_OPTIONS.filter(opt => formData[opt.key]).length > 0 && (
                  <div style={{
                    display: 'flex',
                    flexWrap: 'wrap',
                    gap: '0.5rem',
                    marginTop: '0.75rem'
                  }}>
                    {TECH_QUALIFICATIONS_OPTIONS.filter(opt => formData[opt.key]).map((opt, idx) => (
                      <span
                        key={idx}
                        style={{
                          background: 'rgba(255,255,255,0.06)',
                          border: '1px solid rgba(255,255,255,0.12)',
                          borderRadius: '6px',
                          padding: '0.2rem 0.6rem',
                          fontSize: '0.82rem',
                          color: 'rgba(255,255,255,0.9)',
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '0.35rem'
                        }}
                      >
                        {opt.label.replace(/^Have\s+/i, '').replace(/^Possess\s+/i, '')}
                        <button
                          type="button"
                          onClick={() => setFormData({ ...formData, [opt.key]: false })}
                          style={{
                            background: 'transparent',
                            border: 'none',
                            color: 'rgba(255,255,255,0.4)',
                            padding: 0,
                            cursor: 'pointer',
                            fontSize: '0.85rem',
                            display: 'flex',
                            alignItems: 'center',
                            marginLeft: '0.15rem'
                          }}
                          title="Remove"
                        >
                          ✕
                        </button>
                      </span>
                    ))}
                  </div>
                )}
              </div>

              {/* Music & Event Production Sub-Section */}
              <div className="form-group" style={{ marginTop: '1.5rem', position: 'relative' }}>
                <label className="form-label" style={{ fontSize: '0.95rem', letterSpacing: '0.08em', textTransform: 'uppercase', color: 'var(--accent-terracotta)', marginBottom: '0.75rem', display: 'block' }}>
                  🎵 Music &amp; Event Production
                </label>
                <p style={{ fontSize: '0.82rem', color: 'rgba(255,255,255,0.5)', marginBottom: '1rem', marginTop: '-0.25rem' }}>Select all that apply to your practice as a performer, musician, or event professional.</p>
                
                {/* Dropdown Toggle Button */}
                <button
                  type="button"
                  onClick={() => setIsMusicDropdownOpen(!isMusicDropdownOpen)}
                  style={{
                    background: 'rgba(255,255,255,0.03)',
                    border: '1px solid rgba(255,255,255,0.1)',
                    borderRadius: '12px',
                    padding: '0.8rem 1.2rem',
                    color: '#fff',
                    textAlign: 'left',
                    width: '100%',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    cursor: 'pointer',
                    fontSize: '1rem',
                    minHeight: '48px',
                    boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
                  }}
                >
                  <span style={{ color: MUSIC_PRODUCTION_OPTIONS.filter(opt => formData[opt.key]).length > 0 ? '#fff' : 'rgba(255,255,255,0.5)' }}>
                    {MUSIC_PRODUCTION_OPTIONS.filter(opt => formData[opt.key]).length > 0 
                      ? `${MUSIC_PRODUCTION_OPTIONS.filter(opt => formData[opt.key]).length} item${MUSIC_PRODUCTION_OPTIONS.filter(opt => formData[opt.key]).length === 1 ? '' : 's'} selected` 
                      : 'Select music & event production experience...'}
                  </span>
                  <span className="material-symbols-outlined" style={{
                    transform: isMusicDropdownOpen ? 'rotate(180deg)' : 'none',
                    transition: 'transform 0.2s',
                    color: 'rgba(255,255,255,0.6)'
                  }}>
                    expand_more
                  </span>
                </button>

                {/* Dropdown List Container */}
                {isMusicDropdownOpen && (
                  <div 
                    style={{
                      position: 'absolute',
                      zIndex: 100,
                      top: '100%',
                      left: 0,
                      width: '100%',
                      background: '#18181b',
                      border: '1px solid rgba(255,255,255,0.15)',
                      borderRadius: '12px',
                      padding: '1rem',
                      marginTop: '0.5rem',
                      boxShadow: '0 20px 40px rgba(0,0,0,0.6)',
                      display: 'flex',
                      flexDirection: 'column'
                    }}
                    onClick={(e) => e.stopPropagation()}
                  >
                    {/* Search Field */}
                    <input
                      type="text"
                      placeholder="Search music & event production..."
                      value={musicSearchQuery}
                      onChange={(e) => setMusicSearchQuery(e.target.value)}
                      style={{
                        background: 'rgba(255,255,255,0.06)',
                        border: '1px solid rgba(255,255,255,0.1)',
                        borderRadius: '8px',
                        padding: '0.6rem 0.8rem',
                        color: '#fff',
                        fontSize: '0.9rem',
                        width: '100%',
                        marginBottom: '0.75rem',
                        outline: 'none'
                      }}
                    />

                    {/* Scrollable list */}
                    <div style={{
                      maxHeight: '220px',
                      overflowY: 'auto',
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '0.25rem',
                      paddingRight: '0.5rem'
                    }}>
                      
                      {MUSIC_PRODUCTION_OPTIONS.filter(opt => opt.label.toLowerCase().includes(musicSearchQuery.toLowerCase())).map((opt, idx) => (
                        <label
                          key={idx}
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '0.75rem',
                            padding: '0.5rem 0.75rem',
                            borderRadius: '8px',
                            cursor: 'pointer',
                            background: formData[opt.key] ? 'rgba(255,255,255,0.04)' : 'transparent'
                          }}
                          className="dropdown-item-hover-style"
                        >
                          <input
                            type="checkbox"
                            checked={!!formData[opt.key]}
                            onChange={() => setFormData({ ...formData, [opt.key]: !formData[opt.key] })}
                            style={{ width: '16px', height: '16px', accentColor: '#e05a47', cursor: 'pointer' }}
                          />
                          <span style={{ fontSize: '0.95rem', color: formData[opt.key] ? '#fff' : 'rgba(255,255,255,0.75)' }}>{opt.label}</span>
                        </label>
                      ))}

                      {MUSIC_PRODUCTION_OPTIONS.filter(opt => opt.label.toLowerCase().includes(musicSearchQuery.toLowerCase())).length === 0 && (
                        <span style={{ color: 'rgba(255,255,255,0.4)', padding: '1rem', fontSize: '0.9rem', textAlign: 'center' }}>No matches found</span>
                      )}

                    </div>
                  </div>
                )}

                {/* Displaying selected items cleanly as inline tag list */}
                {MUSIC_PRODUCTION_OPTIONS.filter(opt => formData[opt.key]).length > 0 && (
                  <div style={{
                    display: 'flex',
                    flexWrap: 'wrap',
                    gap: '0.5rem',
                    marginTop: '0.75rem'
                  }}>
                    {MUSIC_PRODUCTION_OPTIONS.filter(opt => formData[opt.key]).map((opt, idx) => (
                      <span
                        key={idx}
                        style={{
                          background: 'rgba(255,255,255,0.06)',
                          border: '1px solid rgba(255,255,255,0.12)',
                          borderRadius: '6px',
                          padding: '0.2rem 0.6rem',
                          fontSize: '0.82rem',
                          color: 'rgba(255,255,255,0.9)',
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '0.35rem'
                        }}
                      >
                        {opt.label.split(' — ')[0]}
                        <button
                          type="button"
                          onClick={() => setFormData({ ...formData, [opt.key]: false })}
                          style={{
                            background: 'transparent',
                            border: 'none',
                            color: 'rgba(255,255,255,0.4)',
                            padding: 0,
                            cursor: 'pointer',
                            fontSize: '0.85rem',
                            display: 'flex',
                            alignItems: 'center',
                            marginLeft: '0.15rem'
                          }}
                          title="Remove"
                        >
                          ✕
                        </button>
                      </span>
                    ))}
                  </div>
                )}
              </div>


              <div className="form-group" style={{ marginTop: '2rem' }}>
                <label className="form-label" htmlFor="capabilitiesDescription">Installation Capabilities & Equipment Description</label>
                <textarea 
                  id="capabilitiesDescription"
                  className="form-input"
                  style={{ 
                    minHeight: '120px', 
                    resize: 'vertical', 
                    lineHeight: '1.5',
                    background: 'rgba(0,0,0,0.4)',
                    border: '1px solid var(--border-subtle)',
                    borderRadius: '12px',
                    color: '#fff',
                    padding: '1rem',
                    fontFamily: 'inherit'
                  }}
                  value={formData.capabilitiesDescription}
                  onChange={(e) => setFormData({...formData, capabilitiesDescription: e.target.value})}
                  placeholder="Tell us about your installation workflows, technical capabilities, specialized machinery (e.g. scissor lift certified, rigging), or specific materials you specialize in handling..."
                />
              </div>

              {/* Portfolio Link / External URL */}
              <div className="form-group" style={{ marginTop: '2rem', marginBottom: '2rem' }}>
                <label className="form-label" htmlFor="portfolioUrl">Portfolio Link / External URL</label>
                <p style={{ fontSize: '0.82rem', color: 'rgba(255,255,255,0.35)', marginBottom: '0.5rem', marginTop: '-0.25rem' }}>
                  If your portfolio files exceed the 8 MB upload limit, or if you prefer to share a link to your Behance, Adobe Portfolio, or personal website, add it here.
                </p>
                <input 
                  type="url" 
                  id="portfolioUrl" 
                  className="form-input"
                  value={formData.portfolioUrl || ''}
                  onChange={(e) => setFormData({...formData, portfolioUrl: e.target.value})}
                  placeholder="https://behance.net/myportfolio"
                />
              </div>

              {/* Premium Drag & Drop Work Examples Upload Zone */}
              <div className="form-group" style={{ marginTop: '2.5rem' }}>
                <label className="form-label">
                  Work Examples & Portfolios (JPEGs, PNGs, MP4s, MP3s, PDFs - Up to 8 MB per file)
                </label>
                
                <label 
                  className={`file-upload-zone ${dragActive ? 'drag-active' : ''}`}
                  onDragEnter={handleDrag}
                  onDragOver={handleDrag}
                  onDragLeave={handleDrag}
                  onDrop={handleDrop}
                  style={{
                    border: dragActive ? '2px dashed var(--accent-terracotta)' : '1px dashed var(--border-subtle)',
                    borderRadius: '16px',
                    padding: '2.5rem 2rem',
                    textAlign: 'center',
                    background: dragActive ? 'rgba(224, 90, 71, 0.08)' : 'rgba(0,0,0,0.3)',
                    cursor: 'pointer',
                    transition: 'all 0.3s cubic-bezier(0.16, 1, 0.3, 1)',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '0.75rem',
                    boxShadow: dragActive ? '0 0 20px rgba(224, 90, 71, 0.15)' : 'none',
                  }}
                >
                  <input
                    ref={fileInputRef}
                    type="file"
                    multiple
                    accept="image/jpeg,image/png,image/webp,video/mp4,audio/mpeg,audio/mp3,application/pdf"
                    onChange={handleFileInputChange}
                    style={{ display: 'none' }}
                  />
                  
                  {fileUploading ? (
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.5rem' }}>
                      <span className="material-symbols-outlined spinning" style={{ fontSize: '2.5rem', color: 'var(--accent-ochre)' }}>
                        sync
                      </span>
                      <p style={{ color: 'var(--text-secondary)', fontSize: '0.95rem', fontWeight: 500 }}>
                        Processing files to Base64...
                      </p>
                    </div>
                  ) : (
                    <>
                      <span 
                        className="material-symbols-outlined" 
                        style={{ 
                          fontSize: '3rem', 
                          color: dragActive ? 'var(--accent-terracotta)' : 'var(--text-secondary)',
                          transition: 'color 0.3s ease',
                          transform: dragActive ? 'scale(1.1)' : 'scale(1)',
                        }}
                      >
                        cloud_upload
                      </span>
                      <div>
                        <p style={{ fontWeight: 600, fontSize: '1.05rem', color: '#fff', marginBottom: '0.25rem' }}>
                          Drag & drop files here, or <span style={{ color: 'var(--accent-terracotta)', textDecoration: 'underline' }}>browse</span>
                        </p>
                        <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                          Supports JPEG, PNG, MP4, MP3, PDF up to 8 MB (Max 5 files)
                        </p>
                      </div>
                    </>
                  )}
                </label>

                {/* File Upload Errors */}
                {fileError && (
                  <div 
                    style={{ 
                      marginTop: '0.75rem', 
                      color: 'var(--accent-terracotta)', 
                      fontSize: '0.9rem',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.5rem',
                      background: 'rgba(220, 38, 38, 0.1)',
                      padding: '0.75rem 1rem',
                      borderRadius: '8px',
                      border: '1px solid rgba(220, 38, 38, 0.2)'
                    }}
                  >
                    <span className="material-symbols-outlined" style={{ fontSize: '1.1rem' }}>error</span>
                    <span>{fileError}</span>
                  </div>
                )}

                {/* Uploaded File List / Previews */}
                {formData.workExamples && formData.workExamples.length > 0 && (
                  <div style={{ marginTop: '1.5rem', display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                    <p style={{ fontSize: '0.9rem', fontWeight: 600, color: 'var(--text-secondary)' }}>
                      Selected Files ({formData.workExamples.length}/5)
                    </p>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))', gap: '0.75rem' }}>
                      {formData.workExamples.map((file, idx) => {
                        let icon = 'description';
                        let accentColor = 'var(--text-secondary)';
                        let bgSubtle = 'rgba(255, 255, 255, 0.05)';
                        
                        if (file.type.startsWith('image/')) {
                          icon = 'image';
                          accentColor = '#4a83ed';
                          bgSubtle = 'rgba(74, 131, 237, 0.08)';
                        } else if (file.type.startsWith('video/')) {
                          icon = 'movie';
                          accentColor = '#ebb05b';
                          bgSubtle = 'rgba(235, 176, 91, 0.08)';
                        } else if (file.type.startsWith('audio/')) {
                          icon = 'audiotrack';
                          accentColor = '#e05a47';
                          bgSubtle = 'rgba(224, 90, 71, 0.08)';
                        } else if (file.type === 'application/pdf') {
                          icon = 'picture_as_pdf';
                          accentColor = '#10b981';
                          bgSubtle = 'rgba(16, 185, 129, 0.08)';
                        }

                        const formatSize = (bytes) => {
                          if (bytes === 0) return '0 Bytes';
                          const k = 1024;
                          const sizes = ['Bytes', 'KB', 'MB'];
                          const i = Math.floor(Math.log(bytes) / Math.log(k));
                          return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
                        };

                        return (
                          <div 
                            key={idx}
                            style={{
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'space-between',
                              padding: '0.75rem 1rem',
                              background: bgSubtle,
                              borderRadius: '12px',
                              border: `1px solid ${accentColor}1A`,
                              transition: 'all 0.3s cubic-bezier(0.16, 1, 0.3, 1)',
                              gap: '0.75rem'
                            }}
                          >
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', overflow: 'hidden' }}>
                              {file.type.startsWith('image/') && file.base64Data && file.base64Data !== "[Base64 Payload]" ? (
                                <div 
                                  style={{ 
                                    width: '36px', 
                                    height: '36px', 
                                    borderRadius: '8px', 
                                    backgroundImage: `url(${file.base64Data})`,
                                    backgroundSize: 'cover',
                                    backgroundPosition: 'center',
                                    border: '1px solid var(--border-subtle)'
                                  }}
                                />
                              ) : (
                                <div 
                                  style={{ 
                                    width: '36px', 
                                    height: '36px', 
                                    borderRadius: '8px', 
                                    background: 'rgba(0,0,0,0.3)',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center'
                                  }}
                                >
                                  <span className="material-symbols-outlined" style={{ fontSize: '1.25rem', color: accentColor }}>
                                    {icon}
                                  </span>
                                </div>
                              )}
                              <div style={{ display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
                                <p 
                                  style={{ 
                                    fontSize: '0.85rem', 
                                    fontWeight: 500, 
                                    color: '#fff', 
                                    whiteSpace: 'nowrap', 
                                    overflow: 'hidden', 
                                    textOverflow: 'ellipsis',
                                    maxWidth: '140px'
                                  }}
                                  title={file.name}
                                >
                                  {file.name}
                                </p>
                                <p style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
                                  {formatSize(file.size)}
                                </p>
                              </div>
                            </div>
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleRemoveFile(idx);
                              }}
                              style={{
                                background: 'transparent',
                                border: 'none',
                                color: 'var(--text-secondary)',
                                cursor: 'pointer',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                padding: '4px',
                                borderRadius: '50%',
                                transition: 'all 0.2s ease',
                              }}
                              onMouseEnter={(e) => {
                                e.currentTarget.style.background = 'rgba(224, 90, 71, 0.15)';
                                e.currentTarget.style.color = 'var(--accent-terracotta)';
                              }}
                              onMouseLeave={(e) => {
                                e.currentTarget.style.background = 'transparent';
                                e.currentTarget.style.color = 'var(--text-secondary)';
                              }}
                            >
                              <span className="material-symbols-outlined" style={{ fontSize: '1.1rem' }}>
                                close
                              </span>
                            </button>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* STEP 5: PROJECTS & AVAILABILITY */}
          {step === 5 && (
            <div className="form-step-content">
              <h2 className="step-title">5. Projects, Availability & Logistics</h2>
              <p className="step-desc">Final details to complete your curation profile and submit.</p>

              <div className="form-grid-2">
                <div className="form-group">
                  <label className="form-label" htmlFor="availabilityStatus">Availability Status</label>
                  <select 
                    id="availabilityStatus" 
                    className="form-input"
                    style={{ appearance: 'auto' }}
                    value={formData.availabilityStatus}
                    onChange={(e) => setFormData({...formData, availabilityStatus: e.target.value})}
                  >
                    <option value="Available">Fully Available (Accepting commissions immediately)</option>
                    <option value="Semi-Available">Semi-Available (Accepting, but has ongoing projects)</option>
                    <option value="Booked">Booked out (Available for future planning only)</option>
                  </select>
                </div>

                <div className="form-group">
                  <label className="form-label" htmlFor="budgetRange">Desired Budget Range for Commissions</label>
                  <input 
                    type="text" 
                    id="budgetRange" 
                    className="form-input"
                    value={formData.budgetRange}
                    onChange={(e) => setFormData({...formData, budgetRange: e.target.value})}
                    placeholder="e.g. $5,000 - $25,000"
                  />
                </div>
              </div>

              <div className="form-group">
                <label className="form-label" htmlFor="notableProjects">Notable Projects (Include locations, clients, or titles)</label>
                <textarea 
                  id="notableProjects" 
                  className="form-input"
                  style={{ minHeight: '80px', resize: 'vertical' }}
                  value={formData.notableProjects}
                  onChange={(e) => setFormData({...formData, notableProjects: e.target.value})}
                  placeholder="e.g. RiNo Art District Wall 2025, Denver Central Library Archway Commission..."
                />
              </div>

              <div className="form-group">
                <label className="form-label" htmlFor="references">References (Names & Contact Emails/Phones)</label>
                <textarea 
                  id="references" 
                  className="form-input"
                  style={{ minHeight: '80px', resize: 'vertical' }}
                  value={formData.references}
                  onChange={(e) => setFormData({...formData, references: e.target.value})}
                  placeholder="e.g. John Smith (Curator at RiNo) - john@rinoart.org"
                />
              </div>

              <div className="form-group">
                <label className="form-label" htmlFor="accessibilityNeeds">Accessibility or Specialized Equipment Needs (e.g. scaffolding, lifts, specific accessibility setups)</label>
                <input 
                  type="text" 
                  id="accessibilityNeeds" 
                  className="form-input"
                  value={formData.accessibilityNeeds}
                  onChange={(e) => setFormData({...formData, accessibilityNeeds: e.target.value})}
                  placeholder="e.g. Scaffolding required, wheelchair accessible site prefered"
                />
              </div>

              {/* Account Credentials */}
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
                  <span className="material-symbols-outlined" style={{ fontSize: '1.25rem', color: 'var(--accent-terracotta)' }}>lock</span>
                  Create Portal Account Credentials
                </h3>
                <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: '1.25rem' }}>
                  Choose a username and password to log back into your matchmaking dashboard and update your profile anytime.
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
                        const taken = getArtists().some(a => a.username?.toLowerCase() === val && a.id !== formData.id);
                        if (taken) {
                          setUsernameError('This username is already taken. Please choose another.');
                        } else {
                          setUsernameError('');
                        }
                      }}
                      placeholder="e.g. janedoe"
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
            </div>
          )}

          {/* Submission feedback telemetry system */}
          <SubmissionStatus stage={submissionStage} onRetry={handleSubmit} />

          {/* Form Actions */}
          <footer style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginTop: '3.5rem',
            borderTop: '1px solid var(--border-subtle)',
            paddingTop: '2rem',
            gap: '1rem',
          }}>

            {/* ← Back — always rendered, disabled on step 1 */}
            <button
              type="button"
              onClick={handleBack}
              disabled={step === 1 || isSubmitting}
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
                cursor: step === 1 || isSubmitting ? 'not-allowed' : 'pointer',
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

            {/* Continue / Submit → */}
            <button
              type="submit"
              className="btn-primary"
              disabled={isSubmitting}
              aria-label={step === 5 ? 'Submit Registry Data' : 'Go to next step'}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem',
                background: step === 5
                  ? 'linear-gradient(135deg, #e05a47, #c94634)'
                  : 'linear-gradient(135deg, #e05a47, #c94634)',
                border: 'none',
                borderRadius: '12px',
                padding: '0.75rem 1.75rem',
                color: '#fff',
                fontWeight: 700,
                fontSize: '0.9rem',
                fontFamily: "'Space Grotesk', sans-serif",
                cursor: isSubmitting ? 'not-allowed' : 'pointer',
                boxShadow: '0 4px 16px rgba(224, 90, 71, 0.35)',
                transition: 'all 0.2s ease',
                minWidth: '160px',
                justifyContent: 'center',
                opacity: isSubmitting ? 0.7 : 1,
              }}
            >
              {isSubmitting ? (
                <span style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <span className="loading-spinner"></span>
                  Submitting...
                </span>
              ) : step === 5 ? (
                <>
                  <span className="material-symbols-outlined" style={{ fontSize: '1.1rem' }}>how_to_reg</span>
                  Submit Registry Data
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
