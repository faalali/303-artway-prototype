import { useState, useEffect } from 'react';
import { 
  grantChecklist, 
  grantTemplates, 
  defaultBudgetTemplates, 
  permittingEngineeringDirectory, 
  mmlToneRewrites 
} from '../data/grantTemplates';
import ProjectMap from './ProjectMap';
import { findArtistByEmailAndId, getArtists } from '../data/mockDatabase';

// Curated comprehensive directory combining permits, engineering, and supply resources
const mergedDirectory = [
  ...permittingEngineeringDirectory,
  {
    id: 'alreco_metals',
    category: 'Supplies',
    name: 'Alreco Metals (Henderson)',
    role: 'Industrial Metal Plates & Tube Supply',
    description: 'Industrial aluminum, steel, brass sheets, and architectural tubes. Offers precision cutting and walk-in sales.',
    contact: '11800 E 120th Ave, Henderson',
    link: 'alrecometals.com'
  },
  {
    id: 'laird_plastics',
    category: 'Supplies',
    name: 'Laird Plastics (Denver)',
    role: 'Acrylic Panel & Weatherproof Plastics',
    description: 'Acrylic panels, plexiglass, polycarbonate, and specialized engineering plastics for weather-hardened sculpture details.',
    contact: '5151 Bannock St, Denver',
    link: 'lairdplastics.com'
  },
  {
    id: 'tool_library',
    category: 'Supplies',
    name: 'Denver Tool Library & Co-op',
    role: 'Shared Woodworking & Digital Fabrication tools',
    description: 'Access to shared metalworking, woodworking, and digital fabrication machinery. Ideal for cost-effective prototyping.',
    contact: '555 Santa Fe Dr, Denver',
    link: 'denvertoollibrary.org'
  },
  {
    id: 'sunbelt_rentals',
    category: 'Supplies',
    name: 'Sunbelt Rentals (Central Denver)',
    role: 'Scissor Lift & Boom Lift Hire',
    description: 'Scissor lifts, towable boom lifts, scaffolding, and site protection fences. Offers direct drop-off and safety harnesses.',
    contact: '2550 West 8th Ave, Denver',
    link: 'sunbeltrentals.com'
  },
  {
    id: 'united_rentals',
    category: 'Supplies',
    name: 'United Rentals (Denver/Aurora)',
    role: 'Heavy Rigging Machinery & Site Protection',
    description: 'Heavy rigging machinery, electric boom lifts, and street barrier setups. High availability of indoor/outdoor electric scissor lifts.',
    contact: '9500 E 40th Ave, Denver',
    link: 'unitedrentals.com'
  }
];

// Live Google AI Studio Gemini API Integration helper
async function callGeminiAPI(prompt, systemInstruction = '') {
  const apiKey = import.meta.env.VITE_GEMINI_API_KEY || '';
  if (!apiKey) {
    throw new Error('VITE_GEMINI_API_KEY environment variable is not defined.');
  }

  const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`;

  const payload = {
    contents: [
      {
        parts: [
          { text: prompt }
        ]
      }
    ]
  };

  if (systemInstruction) {
    payload.systemInstruction = {
      parts: [
        { text: systemInstruction }
      ]
    };
  }

  // Request JSON mode if prompt requests JSON
  if (prompt.toLowerCase().includes('json')) {
    payload.generationConfig = {
      responseMimeType: 'application/json'
    };
  }

  const response = await fetch(endpoint, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(payload)
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Gemini API request failed: ${response.status} - ${errorText}`);
  }

  const data = await response.json();
  const textContent = data.candidates?.[0]?.content?.parts?.[0]?.text;
  if (!textContent) {
    throw new Error('Invalid or empty response format from Gemini API.');
  }

  return textContent.trim();
}

function autoPopulatePlaceholders(templateId, fundingSource, artistProfile) {
  // Use passed artistProfile if available, otherwise try to load active session from localStorage, otherwise fallback to Elena
  let activeArtist = artistProfile;
  if (!activeArtist) {
    try {
      const sessionSaved = localStorage.getItem('ila_artist_session_v1');
      if (sessionSaved) {
        const session = JSON.parse(sessionSaved);
        const artistsSaved = localStorage.getItem('303_artway_artists_v8');
        const list = artistsSaved ? JSON.parse(artistsSaved) : getArtists();
        activeArtist = list.find(a => a.id === session.id || a.email === session.email);
      }
    } catch (e) {
      console.error('Failed to parse active artist session inside autoPopulatePlaceholders:', e);
    }
  }

  let profile = {
    name: 'Elena Guerrero',
    pronouns: 'She/Her',
    primaryMedium: 'Acrylic Aerosol, Weatherproof Exterior Finishes, and Stenciling',
    bio: 'deep site curation and local archives review',
    artStyles: 'Street Art, Realism',
    website: 'https://elenaguerrero.com'
  };

  if (activeArtist) {
    profile.name = activeArtist.alias || `${activeArtist.firstName} ${activeArtist.lastName}`.trim() || 'Artist';
    profile.pronouns = activeArtist.pronouns || 'She/Her';
    profile.primaryMedium = activeArtist.primaryMedium || 'Mural & Public Art';
    profile.bio = activeArtist.capabilitiesDescription || activeArtist.bio || 'deep site curation and local archives review';
    profile.website = activeArtist.website || 'https://myportfolio.com';
    if (activeArtist.artStyles && activeArtist.artStyles.length > 0) {
      profile.artStyles = activeArtist.artStyles.join(', ');
    }
  }

  const result = {};

  if (templateId === 'rfp_cover_letter') {
    result['[Artist Name]'] = profile.name;
    result['[Artist Pronouns]'] = profile.pronouns ? `(${profile.pronouns})` : '(She/Her)';
    result['[RFP Name]'] = fundingSource ? fundingSource.title : 'Public Art RFP';
    result['[Funding Agency]'] = fundingSource ? fundingSource.provider : 'Denver Arts & Venues';
    result['[Neighborhood/Theme]'] = fundingSource ? (((fundingSource.provider || '').includes('Denver')) ? 'Denver Urban Identity & Cultural Heritage' : 'Community Integration & Visual Landmark') : 'Community Integration';
    result['[Signature]'] = profile.name;
  } else if (templateId === 'mural_cover_letter') {
    result['[Artist Name]'] = profile.name;
    result['[Mural Call Title]'] = fundingSource ? fundingSource.title : 'Public Mural Project';
    result['[Site Location]'] = fundingSource ? (fundingSource.location || fundingSource.provider) : 'Denver Front Range Corridors';
    result['[Primary Style/Medium]'] = profile.primaryMedium;
    result['[Maintenance details]'] = 'maintenance required. Re-applying anti-graffiti sealant every 5 years guarantees lightfast protection and easy wash-down against street tagging';
  } else if (templateId === 'artist_statement') {
    result['[Artist Name]'] = profile.name;
    result['[Primary Medium/Mediums]'] = profile.primaryMedium;
    result['[Conceptual Philosophy]'] = profile.bio;
    result['[Community Engagement Method]'] = 'collaborative community engagement and co-design storytelling';
  }

  return result;
}

function getIsPriority(itemId, source) {
  if (!source) return false;
  const fid = source.id;
  if (fid === 'f4') {
    return ['wind_loads', 'municipal_permits', 'site_curation'].includes(itemId);
  }
  if (fid === 'f1') {
    return ['community_narrative', 'intent_statement', 'municipal_permits'].includes(itemId);
  }
  if (fid === 'f6') {
    return ['weather_durability', 'logistics_safety', 'site_curation'].includes(itemId);
  }
  return false;
}

function getPriorityReason(itemId, source) {
  if (!source) return '';
  const fid = source.id;
  if (fid === 'f4') {
    if (itemId === 'wind_loads') return 'Required for 90+ MPH building stamps';
    if (itemId === 'municipal_permits') return 'Required for Central DOTI sidewalk easement';
    if (itemId === 'site_curation') return 'Required for Sandstone color-matching panels';
  }
  if (fid === 'f1') {
    if (itemId === 'community_narrative') return 'Required for equity & localized history';
    if (itemId === 'intent_statement') return 'Critical resident storytelling alignment';
    if (itemId === 'municipal_permits') return 'Required for DOTI Right-of-Way licensing';
  }
  if (fid === 'f6') {
    if (itemId === 'weather_durability') return 'Required for historical brick weather-coating';
    if (itemId === 'logistics_safety') return 'Required for OSHA scissor lift operations';
    if (itemId === 'site_curation') return 'Required for scaled elevation photo overlays';
  }
  return '';
}

export default function GrantApplicationAssistant({ 
  preloadedBudget, 
  selectedFundingSource,
  onClearFundingSource,
  initialSubTab = 'map', 
  initialResourceSearch = '', 
  initialResourceHighlightId = null,
  projects = [],
  fundingSources = [],
  onApplyFunding,
  onNavigatePipeline,
  onLocateResource,
  mapFocusItemId,
  onClearMapFocus
}) {
  const [subTab, setSubTab] = useState(initialSubTab);

  // Active/Simulated Artist Profile State
  const [activeArtistsList, setActiveArtistsList] = useState(() => {
    try {
      const artistsSaved = localStorage.getItem('303_artway_artists_v8');
      if (artistsSaved) {
        return JSON.parse(artistsSaved);
      }
      return getArtists();
    } catch (e) {
      console.error('Failed to parse artists list:', e);
    }
    return [];
  });

  const [connectedArtist, setConnectedArtist] = useState(() => {
    try {
      const sessionSaved = localStorage.getItem('ila_artist_session_v1');
      if (sessionSaved) {
        const session = JSON.parse(sessionSaved);
        // Find in active list or database
        const artistsSaved = localStorage.getItem('303_artway_artists_v8');
        const list = artistsSaved ? JSON.parse(artistsSaved) : getArtists();
        return list.find(a => a.id === session.id || a.email === session.email) || null;
      }
    } catch (e) {
      console.error('Failed to parse artist session:', e);
    }
    return null;
  });

  const handleSelectSimulatedArtist = (artistId) => {
    if (!artistId) {
      setConnectedArtist(null);
      localStorage.removeItem('ila_artist_session_v1');
      setPlaceholderVals(autoPopulatePlaceholders(selectedTemplateId, selectedFundingSource, null));
      setPortfolioLinks([]);
      return;
    }
    const found = activeArtistsList.find(a => a.id === artistId);
    if (found) {
      setConnectedArtist(found);
      localStorage.setItem('ila_artist_session_v1', JSON.stringify({ email: found.email, id: found.id }));
      setPlaceholderVals(autoPopulatePlaceholders(selectedTemplateId, selectedFundingSource, found));
      if (found.website) {
        setPortfolioLinks([found.website]);
      } else {
        setPortfolioLinks([]);
      }
    }
  };

  const getShortName = (source) => {
    if (!source) return '';
    if (source.id === 'f4') return 'Central Library';
    if (source.id === 'f1') return 'PSYAH';
    if (source.id === 'f6') return 'Artspace Springs';
    if (source.title.length > 25) return source.title.substring(0, 22) + '...';
    return source.title;
  };

  // Checklist State
  const [checkedItems, setCheckedItems] = useState(() => {
    const saved = localStorage.getItem('303_artway_grant_checklist');
    return saved ? JSON.parse(saved) : {};
  });

  useEffect(() => {
    localStorage.setItem('303_artway_grant_checklist', JSON.stringify(checkedItems));
  }, [checkedItems]);

  const toggleChecklist = (id) => {
    setCheckedItems(prev => ({
      ...prev,
      [id]: !prev[id]
    }));
  };

  // Template State
  const [selectedTemplateId, setSelectedTemplateId] = useState(grantTemplates[0].id);
  const currentTemplate = grantTemplates.find(t => t.id === selectedTemplateId) || grantTemplates[0];
  const [placeholderVals, setPlaceholderVals] = useState(() => autoPopulatePlaceholders(selectedTemplateId, selectedFundingSource, connectedArtist));
  const [customText, setCustomText] = useState(null);
  const [copySuccess, setCopySuccess] = useState(false);

  // Portfolio Links & Uploaded Images State
  const [portfolioLinks, setPortfolioLinks] = useState(() => {
    if (connectedArtist && connectedArtist.website) {
      return [connectedArtist.website];
    }
    return [];
  });
  const [newLink, setNewLink] = useState('');
  const [uploadedImages, setUploadedImages] = useState([]);
  const [uploadError, setUploadError] = useState('');

  // AI MML Tone Enhancer Modal States
  const [isAiOpen, setIsAiOpen] = useState(false);
  const [selectedTone, setSelectedTone] = useState('academic');
  const [isAiProcessing, setIsAiProcessing] = useState(false);
  const [aiProgressStep, setAiProgressStep] = useState(0);

  // Permitting Search & Cost Estimator States
  const [resSearchQuery, setResSearchQuery] = useState(initialResourceSearch);
  const [activeResFilter, setActiveResFilter] = useState('All');
  const [projType, setProjType] = useState('private_mural');
  const [highlightedResId, setHighlightedResId] = useState(null);

  // Copilot AI States
  const [copilotQuery, setCopilotQuery] = useState('');
  const [isCopilotThinking, setIsCopilotThinking] = useState(false);
  const [copilotConsoleLogs, setCopilotConsoleLogs] = useState([]);
  const [copilotResult, setCopilotResult] = useState(null);

  // Intent Statement Builder States
  const [intentMedium, setIntentMedium] = useState('Sculpture');
  const [intentTheme, setIntentTheme] = useState('Cultural Heritage & Roots');
  const [generatedIntent, setGeneratedIntent] = useState('');
  const [intentCopySuccess, setIntentCopySuccess] = useState(false);

  // Budget Preview Creator States
  const [budgetPreviewTarget, setBudgetPreviewTarget] = useState(50000);
  const [budgetPreviewFocus, setBudgetPreviewFocus] = useState('balanced');
  const [generatedBudget, setGeneratedBudget] = useState(null);

  const permitEstimates = {
    private_mural: {
      title: 'Mural on Private Property',
      fee: 0,
      agency: 'Denver Arts & Venues Mural Registry',
      clearances: [
        'Requires written landlord/property owner consent.',
        'Must submit to Denver Arts & Venues Mural Registry to protect the mural under city code.',
        'Exempt from commercial sign regulations (no sign permits needed).',
        'No structural engineering review or stamps required.'
      ],
      resources: ['denver_arts_mural', 'guirys_color']
    },
    utility_mural: {
      title: 'Utility Box / Public Structure Mural',
      fee: 150,
      agency: 'Denver Department of Transportation & Infrastructure (DOTI)',
      clearances: [
        'Requires DOTI Encroachment Permit & Right-of-Way licensing.',
        'Must coordinate with utility owner (e.g. Xcel Energy or City Denver).',
        'Requires low-VOC, weather-proof paint and graffiti-resistant sealants.',
        'Requires standard pedestrian sidewalk safety protocols.'
      ],
      resources: ['doti_encroachment', 'guirys_color']
    },
    sculpture_small: {
      title: 'Minor Sculpture / Free-Standing Art (< 6ft)',
      fee: 350,
      agency: 'Denver DOTI & Zoning Administration',
      clearances: [
        'Requires minor encroachment license if placed on public right-of-way.',
        'Zoning review required for setback compliance.',
        'Requires structural anchoring details (foundation plan).',
        'Subject to local safety inspections upon installation.'
      ],
      resources: ['kla_engineers', 'recreate_fab']
    },
    sculpture_anchored: {
      title: 'Anchored Monument / Large Heavy Sculpture',
      fee: 1200,
      agency: 'Denver DOTI Encroachment & Structural Review',
      clearances: [
        'Mandatory Denver DOTI Structural Plan Review & Zoning permit.',
        'Requires structural engineering wind-load calculation stamp from a licensed Colorado Professional Engineer (P.E.).',
        'Excavation / sidewalk right-of-way encroachment permit required.',
        'Must carry active Commercial General Liability insurance of at least $1,000,000.'
      ],
      resources: ['doti_encroachment', 'kla_engineers', 'peak_structural', 'recreate_fab']
    }
  };

  const applyCustomBudget = (targetVal, type) => {
    setTargetBudget(targetVal);
    setBudgetRows(() => {
      return defaultBudgetTemplates.map(cat => {
        let categoryMultiplier = 1.0;
        if (type === 'material_heavy') {
          if (cat.category.includes('Materials')) categoryMultiplier = 1.4;
          else if (cat.category.includes('Artist')) categoryMultiplier = 0.8;
          else if (cat.category.includes('Insurance')) categoryMultiplier = 0.8;
        } else if (type === 'fabrication_heavy') {
          if (cat.category.includes('Engineering')) categoryMultiplier = 1.4;
          else if (cat.category.includes('Artist')) categoryMultiplier = 0.8;
          else if (cat.category.includes('Equipment')) categoryMultiplier = 0.8;
        }
        
        const totalAlloc = Math.round(targetVal * (cat.recommendedPct / 100) * categoryMultiplier);
        const itemAlloc = cat.items.length > 0 ? Math.round(totalAlloc / cat.items.length) : 0;
        return {
          ...cat,
          items: cat.items.map(item => ({ ...item, cost: itemAlloc }))
        };
      });
    });
    setSubTab('calculator');
  };

  const generateBudgetBreakdown = (targetVal, focus) => {
    let artistPct = 15;
    let materialsPct = 30;
    let fabPct = 20;
    let equipPct = 15;
    let contingencyPct = 20;

    if (focus === 'material_heavy') {
      artistPct = 10;
      materialsPct = 45;
      fabPct = 15;
      equipPct = 15;
      contingencyPct = 15;
    } else if (focus === 'fabrication_heavy') {
      artistPct = 12;
      materialsPct = 20;
      fabPct = 40;
      equipPct = 13;
      contingencyPct = 15;
    }

    const total = parseInt(targetVal) || 50000;
    
    return [
      { category: 'Artist Fees & Design', pct: artistPct, cost: Math.round(total * (artistPct / 100)), description: 'Covers conceptual design, project management, and execution labor.' },
      { category: 'Materials & Studio Supplies', pct: materialsPct, cost: Math.round(total * (materialsPct / 100)), description: 'Raw metals, weather-hardened lumber, premium exterior paints, primers.' },
      { category: 'Engineering & Fabrication', pct: fabPct, cost: Math.round(total * (fabPct / 100)), description: 'Colorado P.E. structural stamp reviews, welding, machining, casting.' },
      { category: 'Equipment, Shipping & Site Prep', pct: equipPct, cost: Math.round(total * (equipPct / 100)), description: 'Scissor lift/boom lift rentals, safe transport rigging, traffic lane barriers.' },
      { category: 'Insurance, Permits & Contingency', pct: contingencyPct, cost: Math.round(total * (contingencyPct / 100)), description: 'DOTI permits, 10% contingency safety margin, liability policy upgrades.' }
    ];
  };

  const generateIntentStatement = () => {
    const mediumMapping = {
      Mural: {
        intro: `Designed as a high-visibility structural mural, this project transforms the selected vertical surface into a living canvas.`,
        body: `The application of weather-hardened exterior finishes is structured to form a dialogue with the building's physical architecture, creating a vibrant visual landmark that engages passing pedestrians.`
      },
      Sculpture: {
        intro: `Conceived as a three-dimensional anchored sculpture, this installation occupies the spatial landscape to invite physical exploration.`,
        body: `Utilizing structural steel framing and low-maintenance anchoring systems, the monument is designed to withstand local wind-load limits while standing as a robust physical landmark.`
      },
      'Wooden Pavilion': {
        intro: `Designed as an interactive wooden pavilion and social gathering space, this structural shelter merges function with aesthetic form.`,
        body: `Using sustainably sourced lumber and structural steel anchor plates, the installation offers a tactile, inviting environment for community reflection and dialogue.`
      },
      'Light Installation': {
        intro: `Envisioned as a dynamic light installation, this nocturnal intervention activates the public corridor through glowing illumination.`,
        body: `Incorporating energy-efficient LED modules encased in waterproof acrylic casings, the work creates a safe, mesmerizing spatial experience that changes dynamically from sunset to dawn.`
      }
    };

    const themeMapping = {
      'Cultural Heritage & Roots': {
        context: `By centering historical local narratives and ancestral roots, the artwork serves as a cultural repository for the neighborhood's diverse identity.`,
        conclusion: `Through collaborative storytelling and visual tributes, this statement celebrates the shared legacy and resilience of our community.`
      },
      'Eco-Consciousness & Nature': {
        context: `The conceptual core focuses on environmental stewardship, ecological cycles, and our symbiotic relationship with the Colorado landscape.`,
        conclusion: `By using sustainable, low-impact fabrication materials, the artwork acts as a physical reminder of our collective responsibility to preserve natural resources.`
      },
      'Social Equity & Inclusion': {
        context: `This installation addresses themes of spatial justice, shared belonging, and the empowerment of marginalized historical voices.`,
        conclusion: `By creating an open, accessible public sanctuary, the project actively fosters structural inclusion, equity, and mutual understanding.`
      },
      'Abstract Spatial Geometry': {
        context: `The artwork explores abstract spatial relationships, color prisms, and geometric patterns that react to solar movement and pedestrian angles.`,
        conclusion: `By breaking down standard architectural grids, it invites visitors to re-examine their daily physical interactions with urban structures.`
      }
    };

    const mediumData = mediumMapping[intentMedium] || mediumMapping['Sculpture'];
    const themeData = themeMapping[intentTheme] || themeMapping['Cultural Heritage & Roots'];

    const fullStatement = `${mediumData.intro} ${themeData.context} ${mediumData.body} ${themeData.conclusion}\n\nProject Medium: ${intentMedium}\nCore Theme: ${intentTheme}`;
    setGeneratedIntent(fullStatement);
  };

  const handleCopilotSearch = (queryStr) => {
    const searchVal = (queryStr || copilotQuery).trim();
    if (!searchVal) return;
    
    setIsCopilotThinking(true);
    setCopilotConsoleLogs([]);
    setCopilotResult(null);

    const artistName = connectedArtist
      ? (connectedArtist.alias || `${connectedArtist.firstName} ${connectedArtist.lastName}`.trim())
      : 'Elena Guerrero';
    const artistMedium = connectedArtist?.primaryMedium || 'Acrylic Aerosol, Weatherproof Exterior Finishes, and Stenciling';
    const artistBio = connectedArtist?.capabilitiesDescription || connectedArtist?.bio || 'deep site curation and local archives review';
    const artistWebsite = connectedArtist?.website || 'https://elenaguerrero.com';

    let logs = connectedArtist ? [
      `[AI Copilot] Connecting to profile: ${artistName} (${artistMedium})...`,
      `[AI Copilot] Loading ${artistName}'s portfolio credentials & capabilities...`,
      `[AI Copilot] Aligning ${artistMedium} techniques with public art RFP requirements...`,
      `[AI Copilot] Synthesizing tailored proposal response for ${artistName}...`
    ] : [
      `[AI Copilot] Initializing semantic query parsing...`,
      `[AI Copilot] Retrieving public art guidelines & RFP templates...`,
      `[AI Copilot] Aligning municipal permit requirements & Denver DOTI standards...`,
      `[AI Copilot] Synthesizing structural concepts & response elements...`
    ];

    if (selectedFundingSource) {
      logs = connectedArtist ? [
        `[AI Copilot] Loading opportunity: "${selectedFundingSource.title}" for ${artistName}...`,
        `[AI Copilot] Matching ${artistName}'s ${artistMedium} credentials to ${selectedFundingSource.provider} requirements...`,
        selectedFundingSource.id === 'f4' ? `[AI Copilot] Verifying Denver DOTI sidewalk easements & P.E. structural stamps for ${artistName}...` :
        selectedFundingSource.id === 'f6' ? `[AI Copilot] Checking OSHA scissor lift & CDOT right-of-way codes for ${artistName}'s ${artistMedium} project...` :
        `[AI Copilot] Analyzing street-activation & municipal requirements for ${artistName}...`,
        `[AI Copilot] Synthesizing personalized proposal framework for ${artistName} (${selectedFundingSource.amount})...`
      ] : [
        `[AI Copilot] Loading active opportunity context: "${selectedFundingSource.title}"...`,
        `[AI Copilot] Pulling guidelines for "${selectedFundingSource.provider}" (Budget: ${selectedFundingSource.amount})...`,
        selectedFundingSource.id === 'f4' ? `[AI Copilot] Verifying Denver DOTI sidewalk easements & P.E. structural stamps...` :
        selectedFundingSource.id === 'f6' ? `[AI Copilot] Accessing OSHA scissor lift regulations & CDOT right-of-way codes...` :
        `[AI Copilot] Analyzing municipal requirements for street-activation & registry...`,
        `[AI Copilot] Synthesizing tailored proposal framework...`
      ];
    }

    // Call Gemini API in parallel
    const geminiPromise = (async () => {
      const systemInstruction = `You are a public art grant assistant and expert consultant for Colorado artists. Generate a highly detailed, professional response based on the user's query and context. The response MUST be returned as a JSON object matching one of the JSON schemas specified below depending on the type of result.
Do not include any Markdown wrapper blocks like \`\`\`json or other text; return ONLY the raw, parsed JSON string.

Schemas by type:

1. For type 'process':
{
  "type": "process",
  "title": "Clear, concise title",
  "subtitle": "Clear, concise subtitle",
  "content": "A short 2-3 sentence overview of the process.",
  "steps": [
    { "phase": "Phase/Step Title (e.g. 'Phase 1: Pre-Qualification')", "desc": "Detailed explanation of what the artist must do during this phase." }
  ],
  "tip": "Helpful hint or tip",
  "actionLabel": "Label for recommended next action (e.g., 'Go to Narrative Editor')",
  "actionTab": "templates"
}

2. For type 'presentation':
{
  "type": "presentation",
  "title": "Clear title",
  "subtitle": "Subtitle",
  "content": "Short 2-3 sentence overview.",
  "details": [
    { "title": "Section Title", "desc": "Detailed requirement explanation" }
  ],
  "suggestedDeck": [
    "Slide 1: ...",
    "Slide 2: ...",
    "Slide 3: ..."
  ],
  "actionLabel": "Action label",
  "actionTab": "resources"
}

3. For type 'intent':
{
  "type": "intent",
  "title": "Clear title",
  "subtitle": "Subtitle",
  "content": "Short 2-3 sentence overview."
}

4. For type 'budget':
{
  "type": "budget",
  "title": "Clear title",
  "subtitle": "Subtitle",
  "content": "Overview text.",
  "allocations": [
    { "cat": "Category Name (e.g., Artist Fees (15%))", "cost": "$Amount", "desc": "Brief line item explanation" }
  ],
  "tip": "Helpful tip",
  "actionLabel": "Action label",
  "actionTab": "calculator"
}

5. For type 'permits':
{
  "type": "permits",
  "title": "Clear title",
  "subtitle": "Subtitle",
  "content": "Overview text.",
  "requirements": [
    { "agency": "Agency Name (e.g., Denver DOTI Encroachment)", "detail": "Detailed explanation of application fees, timing, and requirements." }
  ],
  "tip": "Helpful tip",
  "actionLabel": "Action label",
  "actionTab": "resources"
}

6. For type 'general':
{
  "type": "general",
  "title": "Clear title",
  "subtitle": "Subtitle",
  "content": "Detailed answer matching the query.",
  "bulletPoints": [
    { "title": "Point Title", "desc": "Explanation of this point" }
  ],
  "tip": "Helpful tip",
  "actionLabel": "Action label",
  "actionTab": "checklist"
}

Select the schema type that matches the user's query intent. Keep responses highly specific to the artist's medium and the opportunity provider/budget. Make sure to refer to the actual artist profile and the selected opportunity if present.`;

      const artistContext = `Artist Name: ${artistName}
Primary Medium: ${artistMedium}
Bio/Capabilities: ${artistBio}
Website: ${artistWebsite}`;

      const opportunityContext = selectedFundingSource
        ? `Selected Opportunity Title: ${selectedFundingSource.title}
Provider: ${selectedFundingSource.provider}
Amount: ${selectedFundingSource.amount}
Type: ${selectedFundingSource.type}
Deadline: ${selectedFundingSource.closeDate}`
        : 'No specific opportunity selected.';

      const prompt = `User Query: "${searchVal}"
Artist Context:
${artistContext}

Opportunity Context:
${opportunityContext}

Return the completed JSON object.`;

      const responseText = await callGeminiAPI(prompt, systemInstruction);
      return JSON.parse(responseText);
    })();

    let currentLogIndex = 0;
    const interval = setInterval(async () => {
      if (currentLogIndex < logs.length) {
        setCopilotConsoleLogs(prev => [...prev, logs[currentLogIndex]]);
        currentLogIndex++;
      } else {
        clearInterval(interval);
        
        // Logs finished, now get the Gemini result or wait for it
        setCopilotConsoleLogs(prev => [...prev, `[AI Copilot] Contacting Google AI Studio...`]);
        try {
          const result = await geminiPromise;
          setCopilotResult(result);
          setIsCopilotThinking(false);
          setCopilotConsoleLogs(prev => [...prev, `[AI Copilot] Analysis successfully generated.`]);
        } catch (err) {
          console.warn('[AI Copilot] Gemini API error, falling back to local database:', err);
          setCopilotConsoleLogs(prev => [...prev, `[AI Copilot] Warning: Gemini API offline. Loading cached database patterns...`]);
          
          // Local mock fallback database
          const lowerQuery = searchVal.toLowerCase();
          let result;

          if (selectedFundingSource) {
            const fid = selectedFundingSource.id;
            const title = selectedFundingSource.title;
            const provider = selectedFundingSource.provider;
            const amount = selectedFundingSource.amount;

            if (lowerQuery.includes('process') || lowerQuery.includes('how to start') || lowerQuery.includes('explain')) {
              if (fid === 'f4') {
                result = {
                  type: 'process',
                  title: `🎨 Central Library Public Art Process Breakdown`,
                  subtitle: `Specific lifecycle for Denver Public Art's $150k Library RFQ.`,
                  content: `Because this is a major municipal project ($150,000), the selection process is highly technical and strict. Incomplete footings, lack of structural stamps, or missing certificates will lead to automatic disqualification.`,
                  steps: [
                    { phase: 'Phase 1: Pre-Qualification Vetting', desc: 'Confirm standard $1M general liability insurance. Submit 10 high-resolution visual plates of previous scaled installations.' },
                    { phase: 'Phase 2: Narrative & Sandstone Thematics', desc: 'Draft an Intent Statement aligning with the library\'s historical sandstone facade and community equity. Pre-fill your Standard RFQ Cover Letter.' },
                    { phase: 'Phase 3: Colorado P.E. Structural Stamps', desc: 'Mandatory! You must obtain certified plans from a licensed Colorado Professional Engineer (P.E.) detailing footings, anchoring bolts, and 90+ MPH wind-load durability.' },
                    { phase: 'Phase 4: DOTI Sidewalk Easement Permits', desc: 'Coordinate with Denver DOTI for temporary sidewalk barricades, pedestrian safety pathways, and construction zoning clearances.' },
                    { phase: 'Phase 5: Selection Panel Interview', desc: 'Present a 3D digital rendering set and physical scale maquette showing structural anchoring and color matches.' }
                  ],
                  tip: 'Tip: Navigate to our Narrative Template tab to edit your pre-filled standard RFP cover letter!',
                  actionLabel: 'Go to Narrative Editor',
                  actionTab: 'templates'
                };
              } else if (fid === 'f6') {
                result = {
                  type: 'process',
                  title: `🎨 Artspace Colorado Springs Mural Process Breakdown`,
                  subtitle: `Specific lifecycle for Artspace's $48,000 exterior mural.`,
                  content: `This project targets the dynamic exterior facades of Artspace. Execution requires rigorous safety protocols for high-elevation works, masonry preparation, and CDOT corridor coordination.`,
                  steps: [
                    { phase: 'Phase 1: Scale Proofs & Elevation Specs', desc: 'Measure the brick texture and elevation dimensions. Calculate necessary square footage and draft visual overlay grids.' },
                    { phase: 'Phase 2: Lift & Rigging Safety Licenses', desc: 'Confirm lift operator safety certifications (OSHA). Coordinate with Sunbelt Rentals for towable electric scissor lifts.' },
                    { phase: 'Phase 3: Weatherproofing & Masonry Prep', desc: 'Define sealant layers, primer coats for historical brick, and lightfast UV-resistant paints. Plan for graffiti-abatement shields.' },
                    { phase: 'Phase 4: Budget & Cost Allocations', desc: 'Structure your $48k budget. Allocate exactly 20% ($9,600) for scaffolding/lift rentals and 10% ($4,800) for protective anti-graffiti finishes.' },
                    { phase: 'Phase 5: Community Engagement Registry', desc: 'Align mural themes with local neighborhood roots. Submit finalized design to the city municipal registry.' }
                  ],
                  tip: 'Tip: Use our Denver Hub tab to locate and lock down scissor lift rentals or scaffolding suppliers.',
                  actionLabel: 'Search Lift Rentals',
                  actionTab: 'resources'
                };
              } else {
                result = {
                  type: 'process',
                  title: `🎨 P.S. You Are Here (PSYAH) Grant Process Breakdown`,
                  subtitle: `Community street activation process for the $10,000 micro-grant.`,
                  content: `PSYAH micro-grants focus heavily on neighborhood equity and collaborative resident engagement. Since the budget is smaller ($10k), heavy engineering stamps are waived, but community surveys and DOTI ROW licenses are strictly enforced.`,
                  steps: [
                    { phase: 'Phase 1: Resident Storytelling Workshops', desc: 'Initiate community surveys and co-design storytelling sessions with neighborhood residents.' },
                    { phase: 'Phase 2: Narrative & Community Alignment', desc: 'Draft your Community-Centered Artist Statement. Pre-fill the template using local history and cultural heritage themes.' },
                    { phase: 'Phase 3: Street & Sidewalk Right-of-Way Licensing', desc: 'Obtain temporary right-of-way permissions from Denver DOTI. Waive major structural stamps, but use standard sidewalk safety barricades.' },
                    { phase: 'Phase 4: Balanced Materials Budgeting', desc: 'Allocate $4,000 for high-durability traffic paints, street-grade sealants, and safety flags. Reserve $2,500 for community workshops.' },
                    { phase: 'Phase 5: Arts & Venues Mural Registration', desc: 'Register the finished street mural to protect the community mural and waive standard commercial sign taxes.' }
                  ],
                  tip: 'Tip: Navigate to our Interactive Checklist where your PSYAH-specific community gates are automatically highlighted!',
                  actionLabel: 'Go to Interactive Checklist',
                  actionTab: 'checklist'
                };
              }
            } else if (lowerQuery.includes('presentation') || lowerQuery.includes('requirements') || lowerQuery.includes('ideas') || lowerQuery.includes('render') || lowerQuery.includes('maquette')) {
              if (fid === 'f4') {
                result = {
                  type: 'presentation',
                  title: `🖼️ Central Library Presentation Requirements`,
                  subtitle: `Denver Public Art standard slides for the $150,000 RFQ.`,
                  content: `The library selection panel expects professional-grade technical presentations showing structural integration and material durability.`,
                  details: [
                    { title: '1. Day/Night Digital Renders', desc: 'Show the sculpture fully integrated under the library\'s exterior architectural lighting. Render both daytime angles and nighttime pedestrian sightlines.' },
                    { title: '2. 1:12 Structural Maquette', desc: 'A physical scale model is highly recommended. Showcase concrete anchor points, steel structural footings, and wind-load resistance.' },
                    { title: '3. Sandstone Swatch Plate', desc: 'Provide physical or digital color-match samples ensuring the artwork matches the tones of the historical sandstone building.' },
                    { title: '4. Signed Colorado P.E. Stamp', desc: 'A preliminary engineering review letter certifying wind-load capacity (90+ MPH) and steel thickness limits.' }
                  ],
                  suggestedDeck: [
                    'Slide 1: Artist Biography & Creative Intent',
                    'Slide 2: Day/Night Renders in Sandstone Context',
                    'Slide 3: P.E. Certified Footing & Anchor Details',
                    'Slide 4: Material Swatches & 20-Year Maintenance Plan',
                    'Slide 5: Balanced $150k Line-Item Cost Structure'
                  ],
                  actionLabel: 'Review Technical Engineers Directory',
                  actionTab: 'resources'
                };
              } else if (fid === 'f6') {
                result = {
                  type: 'presentation',
                  title: `🖼️ Artspace Springs Presentation Requirements`,
                  subtitle: `Mural design guidelines and masonry overlays.`,
                  content: `Artspace reviews emphasize facade alignment, weather resistance, and creative community narratives.`,
                  details: [
                    { title: '1. Architectural Photo Overlays', desc: 'Submit high-resolution digital mockups overlaying your mural design directly on photos of the active brick facade.' },
                    { title: '2. Paint Swatch Registry', desc: 'List exact professional paint codes (e.g. Guiry\'s premium lightfast acrylics) and anti-graffiti chemical specs.' },
                    { title: '3. Elevation Safety Layouts', desc: 'Provide diagrams showing lift placement, sidewalk barrier setbacks, and CDOT highway buffer zones.' },
                    { title: '4. Community Workshop Proofs', desc: 'Include visual plans for the collaborative workshop or resident stenciling event.' }
                  ],
                  suggestedDeck: [
                    'Slide 1: Artist Vision & Cultural Roots Concept',
                    'Slide 2: Scaled Photo Overlays (Before/After)',
                    'Slide 3: Scissor Lift Placement & Safety Buffers',
                    'Slide 4: Acrylic Paint Codes & Weatherproofing Specs',
                    'Slide 5: Workshop Logistics & Scaffolding Budget'
                  ],
                  actionLabel: 'Check Guiry\'s Painting Supplies',
                  actionTab: 'resources'
                };
              } else {
                result = {
                  type: 'presentation',
                  title: `🖼️ PSYAH Presentation Requirements`,
                  subtitle: `Interactive guides for the $10,000 Micro-Grant.`,
                  content: `For PSYAH, panels prioritize community heart, equity, and neighborhood engagement over complex structural designs.`,
                  details: [
                    { title: '1. Neighborhood Storyboard', desc: 'Submit visual moodboards showing neighborhood stories, historical landmarks, and cultural symbols to be woven into the street design.' },
                    { title: '2. Scaled Grid Layouts', desc: 'Provide simple hand-sketched or digital grids showing street footprint dimensions and pedestrian safety lines.' },
                    { title: '3. Traffic Paint Samples', desc: 'Show standard skid-resistant street paint codes and sealant choices to protect the work from high-traffic wear.' },
                    { title: '4. Community Letters of Support', desc: 'Include short written support notes or surveys from residents indicating neighborhood approval.' }
                  ],
                  suggestedDeck: [
                    'Slide 1: Artist Roots & Local Affiliations',
                    'Slide 2: Community Moodboard & Historical References',
                    'Slide 3: Scaled Street/Sidewalk Footprint Grid',
                    'Slide 4: Traffic Paint Swatches & Pedestrian Safety Layouts',
                    'Slide 5: Resident Engagement Workshop Plan & $10k Budget'
                  ],
                  actionLabel: 'Open Narrative Statement Editor',
                  actionTab: 'templates'
                };
              }
            } else if (lowerQuery.includes('intent') || lowerQuery.includes('statement') || lowerQuery.includes('creative') || lowerQuery.includes('formulate') || lowerQuery.includes('ideas')) {
              result = {
                type: 'intent',
                title: `✍️ Creative Intent Statement Generator for ${title}`,
                subtitle: `Tailored narrative prompt parameters matching the $${amount} opportunity.`,
                content: `For the ${title}, the selection committee (${provider}) is looking for themes centered on ${fid === 'f4' ? 'historical sandstone dialogue, structural permanence, and public accessibility' : fid === 'f6' ? 'vibrant wall overlays, community roots, and weather-proof safety' : 'street activation, local diversity, and resident storytelling'}. We have automatically configured the generator parameters below for this opportunity! Use the Narrative Template Editor to refine and copy the final output.`
              };
            } else if (lowerQuery.includes('budget') || lowerQuery.includes('calculator') || lowerQuery.includes('line-item') || lowerQuery.includes('draft') || lowerQuery.includes('cost')) {
              const parsedAmt = parseInt(amount.replace(/[^0-9]/g, '')) || 50000;
              result = {
                type: 'budget',
                title: `📊 Balanced $${parsedAmt.toLocaleString()} Budget Structure`,
                subtitle: `Tailored financial allocations for ${title}.`,
                content: `We have loaded your active opportunity budget of $${parsedAmt.toLocaleString()} into the Public Art Budget Estimator. Here is the recommended balanced breakdown for this opportunity to avoid panel disqualification:`,
                allocations: fid === 'f4' ? [
                  { cat: 'Artist Fees & Design (15%)', cost: `$${(parsedAmt * 0.15).toLocaleString()}`, desc: 'Artist fee, site design, and conceptual planning.' },
                  { cat: 'Materials & Footings (30%)', cost: `$${(parsedAmt * 0.30).toLocaleString()}`, desc: 'Sandstone color-matched structural materials, concrete mix.' },
                  { cat: 'P.E. Stamps & Fabrication (20%)', cost: `$${(parsedAmt * 0.20).toLocaleString()}`, desc: 'Colorado Professional Engineer stamps, structural welding.' },
                  { cat: 'Transport & Scaffolding (15%)', cost: `$${(parsedAmt * 0.15).toLocaleString()}`, desc: 'Flatbed transport, Sunbelt scissor lifts, site fences.' },
                  { cat: 'Insurance & Contingency (20%)', cost: `$${(parsedAmt * 0.20).toLocaleString()}`, desc: '$1M liability insurance, site prep, 10% contingency pool.' }
                ] : fid === 'f6' ? [
                  { cat: 'Artist Fees & Design (15%)', cost: `$${(parsedAmt * 0.15).toLocaleString()}`, desc: 'Artist execution fee and visual design overlays.' },
                  { cat: 'Masonry Prep & Aerosols (30%)', cost: `$${(parsedAmt * 0.30).toLocaleString()}`, desc: 'Guiry\'s premium lightfast acrylics, brick primers.' },
                  { cat: 'Lift Rental & Scaffolding (20%)', cost: `$${(parsedAmt * 0.20).toLocaleString()}`, desc: 'Sunbelt electric boom/scissor lifts, safety harness rigs.' },
                  { cat: 'Community Workshops (15%)', cost: `$${(parsedAmt * 0.15).toLocaleString()}`, desc: 'Outreach materials, neighborhood stencil workshop.' },
                  { cat: 'Permits & Protective Coats (20%)', cost: `$${(parsedAmt * 0.20).toLocaleString()}`, desc: 'CDOT/DOTI sidewalk closure permits, anti-graffiti shields, contingency.' }
                ] : [
                  { cat: 'Community Workshop & Outreach (25%)', cost: `$${(parsedAmt * 0.25).toLocaleString()}`, desc: 'Resident surveys, storytelling flyers, co-design workshop.' },
                  { cat: 'Artist Execution Fee (15%)', cost: `$${(parsedAmt * 0.15).toLocaleString()}`, desc: 'Artist design and mural painting fee.' },
                  { cat: 'Traffic Paint & Sealants (40%)', cost: `$${(parsedAmt * 0.40).toLocaleString()}`, desc: 'Skid-resistant street-grade coatings, paint brushes, sealants.' },
                  { cat: 'Safety Barriers & Flags (10%)', cost: `$${(parsedAmt * 0.10).toLocaleString()}`, desc: 'Temporary street traffic barricades, pedestrian safety signage.' },
                  { cat: 'Permits & Contingency (10%)', cost: `$${(parsedAmt * 0.10).toLocaleString()}`, desc: 'Denver DOTI right-of-way easement fees, 5% contingency.' }
                ],
                tip: 'Tip: You can customize individual line-items inside the Public Art Budget Estimator sub-tab.',
                actionLabel: 'Open Budget Estimator',
                actionTab: 'calculator'
              };
            } else if (lowerQuery.includes('permit') || lowerQuery.includes('denver') || lowerQuery.includes('doti') || lowerQuery.includes('safety') || lowerQuery.includes('zoning') || lowerQuery.includes('wind')) {
              if (fid === 'f4') {
                result = {
                  type: 'permits',
                  title: `🚧 Regulatory Codes & Permits for ${title}`,
                  subtitle: `Specific clearances managed by Denver Department of Transportation & Infrastructure (DOTI).`,
                  content: `As an anchored sculpture taller than 6 feet in a central public space, this installation is subject to strict building and street corridor regulations.`,
                  requirements: [
                    { agency: 'Denver DOTI Encroachment Permit', detail: 'Mandatory because footings encroach on a municipal library pathway. Requires a $300 easement application fee, detailed site plans, and sidewalk hazard barricades.' },
                    { agency: 'Colorado P.E. Structural Stamp', detail: 'Absolutely required. A licensed Colorado Professional Engineer must evaluate soil depth, structural anchors, and certify durability under 90+ MPH wind-loads.' },
                    { agency: 'ADA & Setback Sightlines', detail: 'The sculpture footprint must maintain a clear 5-foot pedestrian walkway and comply with the American with Disabilities Act (ADA) clearance codes.' },
                    { agency: 'General Liability Insurance ($1M)', detail: 'Proof of $1,000,000 commercial general liability insurance naming the City and County of Denver as an additional insured.' }
                  ],
                  tip: 'Tip: Check out our Denver Materials & Hubs tab to find certified P.E. structural engineering firms.',
                  actionLabel: 'Find Structural Engineers',
                  actionTab: 'resources'
                };
              } else if (fid === 'f6') {
                result = {
                  type: 'permits',
                  title: `🚧 Regulatory Codes & Permits for Artspace Springs`,
                  subtitle: `Scaffolding, lift licenses, and corridor safety.`,
                  content: `Because this is an exterior mural at high elevation, safety regulations focus heavily on lift operator licensing and right-of-way safety.`,
                  requirements: [
                    { agency: 'OSHA Scissor/Boom Lift Certification', detail: 'Operators must be certified. Lift placement must use safety harnesses and outriggers on stable, level ground.' },
                    { agency: 'CDOT Corridor Approvals', detail: 'If scaffolding blocks pedestrian walkways or encroaches on Colorado DOT corridors, temporary closure permits must be filed.' },
                    { agency: 'Denver Arts & Venues Mural Registry', detail: 'Exempts the mural from standard commercial sign codes and secures the artwork from unauthorized building paintovers.' },
                    { agency: 'Anti-Graffiti Masonry Sealant', detail: 'Mandatory weather-proofing anti-graffiti chemical layer. Exclude standard commercial sprays; use premium breathable silicon coatings.' }
                  ],
                  tip: 'Tip: You can search sunbelt scissor lift hire options inside the Denver Hub tab.',
                  actionLabel: 'Search Equipment Rentals',
                  actionTab: 'resources'
                };
              } else {
                result = {
                  type: 'permits',
                  title: `🚧 Regulatory Codes & Permits for PSYAH`,
                  subtitle: `Right-of-Way licensing and street-activation permits.`,
                  content: `Street-activation micro-installations waive heavy building permits but enforce safety and neighborhood equity approvals.`,
                  requirements: [
                    { agency: 'Denver DOTI Street Encroachment License', detail: 'Required for any street painting or sidewalk activation. The micro-grant provides expedited $150 processing waivers.' },
                    { agency: 'Neighborhood Stakeholder Survey', detail: 'Must submit proof of a community survey indicating at least 60% agreement from surrounding residents and local businesses.' },
                    { agency: 'Skid-Resistant Traffic Paint standards', detail: 'DOTI requires all street paints to meet standard coefficient of friction limits to prevent pedestrian slipping during wet weather.' },
                    { agency: 'Denver Arts & Venues Mural Registry', detail: 'Submit finished street art dimensions to protect the community mural and exempt it from commercial tax structures.' }
                  ],
                  tip: 'Tip: View our Interactive Checklist tab where the community survey gate is highlighted.',
                  actionLabel: 'View Checklist Gates',
                  actionTab: 'checklist'
                };
              }
            }
          }

          if (!result) {
            if (lowerQuery.includes('process') || lowerQuery.includes('how to start') || lowerQuery.includes('explain')) {
              result = {
                type: 'process',
                title: '🎨 Public Art Grant Proposal Process Breakdown',
                subtitle: 'Understanding the lifecycle of standard RFP and commission submissions.',
                content: `The path to a successful public art installation spans five distinct phases, moving from artistic eligibility checks to technical design verification and local code clearances. Staying organized across these gates ensures your application remains competitive and logistically feasible.`,
                steps: [
                  { phase: 'Phase 1: Eligibility & Profile (100% Artist)', desc: 'Ensure you meet geographic guidelines and submit up-to-date visual portfolios showcasing your material capacity.' },
                  { phase: 'Phase 2: Creative & Spatial Concept', desc: 'Craft a highly detailed visual render or model showing scale, safety barriers, and community connection. Formulate your Creative Intent Statement.' },
                  { phase: 'Phase 3: Structural Integrity Review', desc: 'Verify footing details, wind-load capacity, and determine if a licensed Colorado Professional Engineer (P.E.) stamp is required.' },
                  { phase: 'Phase 4: Safety & Municipal Permits', desc: 'Acquire City encroachment permits (DOTI), state roadway safety clearances (CDOT), and written landlord/property deeds.' },
                  { phase: 'Phase 5: Vetting & Submission', desc: 'Review the proposal against budget safety ratios and double-check required slides, templates, and insurance caps ($1M minimum).' }
                ],
                tip: 'Tip: You can use our Interactive Checklist tab to track these steps on-the-fly and save your progress.',
                actionLabel: 'Go to Interactive Checklist',
                actionTab: 'checklist'
              };
            } else if (lowerQuery.includes('presentation') || lowerQuery.includes('requirements') || lowerQuery.includes('ideas') || lowerQuery.includes('render') || lowerQuery.includes('maquette')) {
              result = {
                type: 'presentation',
                title: '🖼️ Public Art Presentation Requirements & Design Guidelines',
                subtitle: 'Recommended formats, documentation, and slides to wow selection committees.',
                content: `A premium presentation structure provides complete spatial context, detailing how the artwork sits within the surrounding community both visually and structurally. Selection committees look for deep technical clarity combined with conceptual vision.`,
                details: [
                  { title: '1. Multi-Angle Digital Renders', desc: 'Submit at least 3 distinct views (daytime, nighttime glow, and high-visibility pedestrian perspective). High-quality digital mockups are preferred over hand-sketched layouts.' },
                  { title: '2. Physical Maquette & Scale Models', desc: 'Create a 1:12 or 1:24 scale model (wood, clay, or 3D-print) to demonstrate structural weight and anchoring points. Be prepared to submit photos or bring it to the interview.' },
                  { title: '3. Material Sample Plates', desc: 'Provide 4x4 inch sample blocks of steel, acrylic panels, or paint codes with anti-graffiti sealants. Highlight weathering qualities for year-round durability.' },
                  { title: '4. Soil & Engineering Reports', desc: 'Include preliminary wind-load limits (90+ MPH standard for Denver) and footing guidelines, indicating you have consulted a Professional Engineer.' }
                ],
                suggestedDeck: [
                  'Slide 1: Artist Bio & Vision Statement',
                  'Slide 2: Spatial Render (Scale & Context)',
                  'Slide 3: Technical Specifications & Anchor System',
                  'Slide 4: Detailed Materials & Maintenance Schedule',
                  'Slide 5: Balanced Budget Breakdown & Safety Plans'
                ],
                actionLabel: 'Check Denver Supplies & Resource Hub',
                actionTab: 'resources'
              };
            } else if (lowerQuery.includes('intent') || lowerQuery.includes('statement') || lowerQuery.includes('creative') || lowerQuery.includes('formulate') || lowerQuery.includes('ideas')) {
              result = {
                type: 'intent',
                title: '✍️ Creative Intent Statement Generator & Advisor',
                subtitle: 'Draft a striking, conceptually rich narrative focused on spatial dialogue and community connection.',
                content: `A Creative Intent Statement bridges your aesthetic vision with the neighborhood's public context. Use our interactive form below to generate a tailored statement preset, customize the parameters, and directly copy it or import it into the Narrative Editor workspace!`
              };
            } else if (lowerQuery.includes('budget') || lowerQuery.includes('calculator') || lowerQuery.includes('line-item') || lowerQuery.includes('draft') || lowerQuery.includes('cost')) {
              result = {
                type: 'budget',
                title: '📊 Balanced Line-Item Budget Draft Helper',
                subtitle: 'Structure your funding using standard industry allocations to avoid disqualification.',
                content: `Most public art panels disqualify proposals that neglect necessary logistical allocations (e.g. failing to set aside enough funding for structural engineering reviews, heavy equipment hire, or zoning permits). Below, input your overall target grant budget to instantly draft a fully balanced, itemized cost structure!`
              };
            } else if (lowerQuery.includes('permit') || lowerQuery.includes('denver') || lowerQuery.includes('doti') || lowerQuery.includes('safety') || lowerQuery.includes('zoning') || lowerQuery.includes('wind')) {
              result = {
                type: 'permits',
                title: '🚧 Denver Municipal Permits & Engineering Safety Codes',
                subtitle: 'Local regulatory guidelines for public sculptures and high-traffic murals.',
                content: `Public installations in Denver are strictly governed by building codes, street corridor safety zones, and zoning parameters. Navigating these requirements early guarantees a feasible proposal.`,
                requirements: [
                  { agency: 'Denver DOTI (Encroachment & Sidewalks)', detail: 'Required if your sculpture or scaffolding encroaches on a public sidewalk, alleyway, or street easement. Fees range from $150 to $400.' },
                  { agency: 'Colorado P.E. Structural Stamp', detail: 'Mandatory for all sculptures taller than 6 feet or weighing over 500 lbs. Structural engineers must certify anchoring footings and 90+ MPH wind loads.' },
                  { agency: 'Zoning & Setback Standards', detail: 'Check zoning codes to ensure public sculptures satisfy boundary clearances. Standard street setbacks require clear sightlines for driver safety.' },
                  { agency: 'Denver Arts & Venues Mural Registry', detail: 'Private murals must be registered to protect the artwork under Denver municipal registry codes, exempting them from commercial sign tax structures.' }
                ],
                tip: 'Tip: You can estimate these municipal costs using our Permitting fee calculator inside the Denver Hub tab.',
                actionLabel: 'Estimate Permitting Fees',
                actionTab: 'resources'
              };
            } else {
              result = {
                type: 'general',
                title: `💡 AI Advisor Search: "${searchVal}"`,
                subtitle: 'Intelligent synthesis from the Denver Public Art Database.',
                content: `Your search query regarding "${searchVal}" touches on core technical, aesthetic, and structural considerations essential for compiling public art grant packages.`,
                bulletPoints: [
                  { title: 'Technical Alignment', desc: 'Ensure you verify material longevity, structural footprints, and anchoring techniques to pass the technical vetting phases.' },
                  { title: 'Community Value', desc: 'Every RFP prioritizes artists who weave localized narratives, historical roots, and resident feedback into their conceptual design.' },
                  { title: 'Budget Feasibility', desc: 'Keep artist fees close to 15% and materials/fabrication under 50% of the total budget to guarantee financial balance.' }
                ],
                tip: 'Tip: Click any of the Quick Copilot Suggestions below to load detailed step-by-step generators!',
                actionLabel: 'Review Proposals Checklist',
                actionTab: 'checklist'
              };
            }
          }

          setCopilotResult(result);
          setIsCopilotThinking(false);
        }
      }
    }, 300);
  };

  const handleEnhance = () => {
    setIsAiProcessing(true);
    setAiProgressStep(0);
    
    const artistName = connectedArtist
      ? (connectedArtist.alias || `${connectedArtist.firstName} ${connectedArtist.lastName}`.trim())
      : 'Elena Guerrero';
    const artistMedium = connectedArtist?.primaryMedium || 'Acrylic Aerosol, Weatherproof Exterior Finishes, and Stenciling';
    const artistBio = connectedArtist?.capabilitiesDescription || connectedArtist?.bio || 'deep site curation and local archives review';
    const artistWebsite = connectedArtist?.website || 'https://elenaguerrero.com';

    const textToEnhance = customText !== null ? customText : finalComputedText;
    
    // Strip portfolio footer if present
    let rawText = textToEnhance;
    const footerMarker = '--- PORTFOLIO LINKS & ATTACHMENTS ---';
    if (rawText.includes(footerMarker)) {
      rawText = rawText.split(footerMarker)[0].trim();
    }

    const artistContext = `Artist Name: ${artistName}
Primary Medium: ${artistMedium}
Bio/Capabilities: ${artistBio}
Website: ${artistWebsite}`;

    const opportunityContext = selectedFundingSource
      ? `Selected Opportunity Title: ${selectedFundingSource.title}
Provider: ${selectedFundingSource.provider}
Amount: ${selectedFundingSource.amount}
Type: ${selectedFundingSource.type}
Deadline: ${selectedFundingSource.closeDate}`
      : 'No specific opportunity selected.';

    const prompt = `You are a professional public art proposals writer. Enhance the following draft proposal narrative to make it more professional, clean, and compelling for selection panels.
Desired Tone: "${selectedTone}" (e.g. academic, persuasive, poetic, descriptive)

Artist Context:
${artistContext}

Opportunity Context:
${opportunityContext}

Draft Narrative:
"${rawText}"

Improve grammar, readability, and sentence flow according to the requested tone, while preserving the key facts, spatial constraints, and placeholder values.
Return ONLY the enhanced draft narrative. Do not include any intro, outro, explanations, or markdown blocks.`;

    const geminiPromise = callGeminiAPI(prompt, 'You are an expert grant proposal narrative writer. Return only the enhanced draft text.');

    // Animate through steps
    const interval = setInterval(async () => {
      setAiProgressStep(prev => {
        if (prev >= 3) {
          clearInterval(interval);
          
          (async () => {
            try {
              const enhancedText = await geminiPromise;
              
              // Append attachments back if they exist
              let footer = '';
              if (portfolioLinks.length > 0 || uploadedImages.length > 0) {
                footer = '\n\n--- PORTFOLIO LINKS & ATTACHMENTS ---';
                if (portfolioLinks.length > 0) {
                  footer += '\nPortfolio Links:\n' + portfolioLinks.map(link => `  - ${link}`).join('\n');
                }
                if (uploadedImages.length > 0) {
                  footer += '\nAttached Image Samples:\n' + uploadedImages.map(img => `  - ${img.name} (${(img.size / (1024 * 1024)).toFixed(2)} MB)`).join('\n');
                }
              }
              
              setCustomText(enhancedText + footer);
              setIsAiProcessing(false);
              setIsAiOpen(false);
            } catch (err) {
              console.warn('[AI Enhancer] Gemini API error, falling back to local templates:', err);
              // Fallback to local template rewrites
              const toneData = mmlToneRewrites[currentTemplate.id]?.[selectedTone];
              if (toneData) {
                let rewrittenText = `${toneData.intro}\n\n${toneData.body}\n\n${toneData.closing}`;
                
                // Replace placeholders
                currentTemplate.placeholders.forEach(ph => {
                  const val = placeholderVals[ph] || ph;
                  rewrittenText = rewrittenText.replaceAll(ph, val);
                });
                
                let footer = '';
                if (portfolioLinks.length > 0 || uploadedImages.length > 0) {
                  footer = '\n\n--- PORTFOLIO LINKS & ATTACHMENTS ---';
                  if (portfolioLinks.length > 0) {
                    footer += '\nPortfolio Links:\n' + portfolioLinks.map(link => `  - ${link}`).join('\n');
                  }
                  if (uploadedImages.length > 0) {
                    footer += '\nAttached Image Samples:\n' + uploadedImages.map(img => `  - ${img.name} (${(img.size / (1024 * 1024)).toFixed(2)} MB)`).join('\n');
                  }
                }
                
                setCustomText(rewrittenText + footer);
              }
              setIsAiProcessing(false);
              setIsAiOpen(false);
            }
          })();
          
          return 3;
        }
        return prev + 1;
      });
    }, 800);
  };

  const highlightResource = (id) => {
    setResSearchQuery('');
    setActiveResFilter('All');
    
    setTimeout(() => {
      setHighlightedResId(id);
      const element = document.getElementById(`resource-card-${id}`);
      if (element) {
        element.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
      setTimeout(() => {
        setHighlightedResId(null);
      }, 2500);
    }, 100);
  };

  useEffect(() => {
    if (initialResourceHighlightId && subTab === 'resources') {
      const timer = setTimeout(() => {
        highlightResource(initialResourceHighlightId);
      }, 50);
      return () => clearTimeout(timer);
    }
  }, [initialResourceHighlightId, subTab]);

  const filteredDirectory = mergedDirectory.filter(item => {
    const matchesFilter = activeResFilter === 'All' || item.category === activeResFilter;
    const matchesSearch = item.name.toLowerCase().includes(resSearchQuery.toLowerCase()) ||
                         item.role.toLowerCase().includes(resSearchQuery.toLowerCase()) ||
                         item.description.toLowerCase().includes(resSearchQuery.toLowerCase());
    return matchesFilter && matchesSearch;
  });

  const addPortfolioLink = (link) => {
    if (!link) return;
    let url = link.trim();
    if (!url.startsWith('http://') && !url.startsWith('https://')) {
      url = 'https://' + url;
    }
    setPortfolioLinks(prev => [...prev, url]);
    setCustomText(null);
  };

  const removePortfolioLink = (index) => {
    setPortfolioLinks(prev => prev.filter((_, i) => i !== index));
    setCustomText(null);
  };

  const handleImageUpload = (e) => {
    setUploadError('');
    const files = Array.from(e.target.files);
    if (!files.length) return;

    if (uploadedImages.length + files.length > 5) {
      setUploadError('Maximum of 5 portfolio images allowed.');
      return;
    }

    const validFiles = [];
    for (const file of files) {
      if (file.size > 8 * 1024 * 1024) {
        setUploadError(`File "${file.name}" exceeds the 8MB limit.`);
        return;
      }
      if (!file.type.startsWith('image/')) {
        setUploadError(`File "${file.name}" is not a valid image file.`);
        return;
      }
      validFiles.push({
        name: file.name,
        size: file.size,
        preview: URL.createObjectURL(file)
      });
    }

    setUploadedImages(prev => [...prev, ...validFiles]);
    setCustomText(null);
  };

  const removeUploadedImage = (index) => {
    setUploadedImages(prev => {
      const target = prev[index];
      if (target && target.preview) {
        URL.revokeObjectURL(target.preview);
      }
      return prev.filter((_, i) => i !== index);
    });
    setCustomText(null);
  };

  // Compute active text on the fly
  let computedText = currentTemplate.content;
  currentTemplate.placeholders.forEach(ph => {
    const val = placeholderVals[ph] || ph;
    computedText = computedText.replaceAll(ph, val);
  });

  // Append portfolio links and uploaded image summaries to narrative template
  let attachmentsFooter = '';
  if (portfolioLinks.length > 0 || uploadedImages.length > 0) {
    attachmentsFooter = '\n\n--- PORTFOLIO LINKS & ATTACHMENTS ---';
    if (portfolioLinks.length > 0) {
      attachmentsFooter += '\nPortfolio Links:\n' + portfolioLinks.map(link => `  - ${link}`).join('\n');
    }
    if (uploadedImages.length > 0) {
      attachmentsFooter += '\nAttached Image Samples:\n' + uploadedImages.map(img => `  - ${img.name} (${(img.size / (1024 * 1024)).toFixed(2)} MB)`).join('\n');
    }
  }

  const finalComputedText = computedText + attachmentsFooter;
  const activeText = customText !== null ? customText : finalComputedText;

  const handlePlaceholderChange = (ph, value) => {
    setPlaceholderVals(prev => ({
      ...prev,
      [ph]: value
    }));
    setCustomText(null); // Reset manual text override when placeholder changes so computed text is used
  };

  const copyToClipboard = () => {
    navigator.clipboard.writeText(activeText);
    setCopySuccess(true);
    setTimeout(() => setCopySuccess(false), 2000);
  };

  // Helper to parse budget cleanly, handling ranges like "$31,500 - $48,000" and strings like "Up to $10,000"
  const parseBudgetAmount = (val) => {
    if (!val) return 25000;
    if (typeof val === 'number') return val;
    const stringVal = String(val);
    const firstPart = stringVal.split('-')[0] || '';
    const cleaned = firstPart.replace(/[^0-9]/g, '');
    const parsed = parseInt(cleaned, 10);
    return isNaN(parsed) || parsed === 0 ? 25000 : parsed;
  };

  // Budget Calculator State
  const [targetBudget, setTargetBudget] = useState(() => {
    return parseBudgetAmount(preloadedBudget);
  });
  const [budgetRows, setBudgetRows] = useState(() => {
    const initialTarget = parseBudgetAmount(preloadedBudget);
    // Distribute total target budget based on default recommended percentages
    return defaultBudgetTemplates.map(cat => {
      const totalAlloc = Math.round(initialTarget * (cat.recommendedPct / 100));
      // Split the allocated money equally amongst items in this category
      const itemAlloc = Math.round(totalAlloc / cat.items.length);
      return {
        ...cat,
        items: cat.items.map(item => ({ ...item, cost: itemAlloc }))
      };
    });
  });
  // Which category dropdown is currently open (null = none)
  const [openDropdownCat, setOpenDropdownCat] = useState(null);
  // Close dropdown on any outside click
  useEffect(() => {
    if (openDropdownCat === null) return;
    const handler = () => setOpenDropdownCat(null);
    document.addEventListener('click', handler, true);
    return () => document.removeEventListener('click', handler, true);
  }, [openDropdownCat]);

  // Re-distribute budget if target budget is manually typed or updated from preloads
  const updateTargetBudget = (newTarget) => {
    const val = parseInt(newTarget) || 0;
    setTargetBudget(val);
    setBudgetRows(prev => prev.map(cat => {
      const totalAlloc = Math.round(val * (cat.recommendedPct / 100));
      const itemAlloc = cat.items.length > 0 ? Math.round(totalAlloc / cat.items.length) : 0;
      return {
        ...cat,
        items: cat.items.map(item => ({ ...item, cost: itemAlloc }))
      };
    }));
  };

  const handleItemCostChange = (catIdx, itemIdx, value) => {
    const numericCost = parseInt(value) || 0;
    setBudgetRows(prev => {
      const updated = [...prev];
      updated[catIdx] = {
        ...updated[catIdx],
        items: updated[catIdx].items.map((item, idx) => 
          idx === itemIdx ? { ...item, cost: numericCost } : item
        )
      };
      return updated;
    });
  };

  const addBudgetItem = (catIdx, presetName) => {
    const name = presetName || 'Custom Line Item';
    setBudgetRows(prev => {
      const updated = [...prev];
      updated[catIdx] = {
        ...updated[catIdx],
        items: [...updated[catIdx].items, { name, cost: 0 }]
      };
      return updated;
    });
    setOpenDropdownCat(null);
  };

  const clearAllBudget = () => {
    setBudgetRows(defaultBudgetTemplates.map(cat => ({
      ...cat,
      items: cat.items.map(item => ({ ...item, cost: 0 }))
    })));
    setOpenDropdownCat(null);
  };

  const removeBudgetItem = (catIdx, itemIdx) => {
    setBudgetRows(prev => {
      const updated = [...prev];
      updated[catIdx] = {
        ...updated[catIdx],
        items: updated[catIdx].items.filter((_, idx) => idx !== itemIdx)
      };
      return updated;
    });
  };

  // Computations for budget categories
  const categorySums = budgetRows.map(cat => 
    cat.items.reduce((sum, item) => sum + item.cost, 0)
  );
  const currentTotal = categorySums.reduce((sum, current) => sum + current, 0);
  const remainingBudget = targetBudget - currentTotal;

  return (
    <div className="grant-assistant-container" style={{ color: '#fff' }}>
      <style>{`
        .grant-assistant-nav {
          display: flex;
          gap: 1rem;
          border-bottom: 1px solid var(--border-subtle);
          padding-bottom: 1rem;
          margin-bottom: 2rem;
          flex-wrap: wrap;
        }
        .grant-assistant-nav-btn {
          background: rgba(255, 255, 255, 0.03);
          border: 1px solid var(--border-subtle);
          border-radius: 8px;
          padding: 0.6rem 1.2rem;
          color: var(--text-secondary);
          font-weight: 600;
          font-family: inherit;
          cursor: pointer;
          transition: all 0.25s cubic-bezier(0.16, 1, 0.3, 1);
          display: flex;
          alignItems: center;
          gap: 0.5rem;
        }
        .grant-assistant-nav-btn:hover {
          background: rgba(255, 255, 255, 0.08);
          color: var(--text-primary);
        }
        .grant-assistant-nav-btn.active {
          background: rgba(224, 90, 71, 0.12);
          border-color: var(--accent-terracotta);
          color: var(--accent-terracotta);
        }
        .section-card {
          background: rgba(0, 0, 0, 0.35);
          backdrop-filter: blur(16px);
          -webkit-backdrop-filter: blur(16px);
          border: 1px solid var(--border-subtle);
          border-radius: 16px;
          padding: 2rem;
          margin-bottom: 2rem;
        }
        .checklist-grid {
          display: grid;
          grid-template-columns: 1fr;
          gap: 1.25rem;
        }
        .checklist-item {
          display: flex;
          gap: 1.25rem;
          align-items: flex-start;
          padding: 1.25rem;
          background: rgba(255, 255, 255, 0.02);
          border: 1px solid rgba(255, 255, 255, 0.04);
          border-radius: 12px;
          cursor: pointer;
          transition: all 0.25s ease;
        }
        .checklist-item:hover {
          background: rgba(255, 255, 255, 0.04);
          border-color: rgba(255, 255, 255, 0.08);
          transform: translateX(4px);
        }
        .checklist-item.checked {
          border-color: rgba(52, 211, 153, 0.25);
          background: rgba(52, 211, 153, 0.03);
          opacity: 0.85;
        }
        .checkbox-custom {
          width: 22px;
          height: 22px;
          border-radius: 6px;
          border: 2px solid var(--text-secondary);
          display: flex;
          align-items: center;
          justify-content: center;
          color: transparent;
          flex-shrink: 0;
          transition: all 0.2s ease;
        }
        .checklist-item.checked .checkbox-custom {
          background: #34d399;
          border-color: #34d399;
          color: #0f172a;
        }
        .template-editor-grid {
          display: grid;
          grid-template-columns: 1fr;
          gap: 2rem;
        }
        @media(min-width: 992px) {
          .template-editor-grid {
            grid-template-columns: 350px 1fr;
          }
        }
        .interactive-text-area {
          width: 100%;
          min-height: 480px;
          background: rgba(0, 0, 0, 0.45);
          border: 1px solid var(--border-subtle);
          border-radius: 12px;
          color: #f8fafc;
          padding: 1.5rem;
          font-family: 'Space Mono', Courier, monospace;
          font-size: 0.92rem;
          line-height: 1.6;
          resize: vertical;
          outline: none;
          transition: border-color 0.25s ease;
        }
        .interactive-text-area:focus {
          border-color: var(--accent-terracotta);
        }
        .budget-card {
          padding: 1.5rem;
          background: rgba(255,255,255, 0.02);
          border: 1px solid var(--border-subtle);
          border-radius: 12px;
          margin-bottom: 1.5rem;
        }
        .budget-row {
          display: grid;
          grid-template-columns: 1fr 140px 40px;
          gap: 1rem;
          margin-bottom: 0.75rem;
          align-items: center;
        }
        .budget-input {
          background: rgba(0,0,0,0.3);
          border: 1px solid var(--border-subtle);
          border-radius: 6px;
          padding: 0.5rem 0.75rem;
          color: #fff;
          font-family: inherit;
          font-size: 0.9rem;
          width: 100%;
        }
        .budget-input:focus {
          border-color: var(--accent-electric);
          outline: none;
        }
        .resource-grid {
          display: grid;
          grid-template-columns: 1fr;
          gap: 1.5rem;
        }
        @media(min-width: 768px) {
          .resource-grid {
            grid-template-columns: 1fr 1fr;
          }
        }
        .resource-card {
          padding: 1.25rem;
          border-radius: 12px;
          background: rgba(255, 255, 255, 0.02);
          border: 1px solid rgba(255,255,255,0.05);
          transition: all 0.25s ease;
        }
        .resource-card:hover {
          background: rgba(255,255,255,0.04);
          border-color: var(--border-subtle);
        }
        .gallery-thumbnail-card:hover {
          transform: translateY(-4px) scale(1.02);
          border-color: var(--accent-terracotta) !important;
          box-shadow: 0 8px 24px rgba(224, 90, 71, 0.25), inset 0 0 0 1px rgba(255, 255, 255, 0.15) !important;
        }
        .gallery-thumbnail-card:hover .gallery-thumbnail-img {
          transform: scale(1.08);
        }
        
        /* AI MML Tone Enhancer Modal CSS */
        .ai-modal-overlay {
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: rgba(0, 0, 0, 0.7);
          backdrop-filter: blur(12px);
          -webkit-backdrop-filter: blur(12px);
          display: flex;
          align-items: center;
          justify-content: center;
          z-index: 1000;
          animation: fadeIn 0.25s cubic-bezier(0.16, 1, 0.3, 1) forwards;
        }
        .ai-modal-content {
          background: rgba(20, 20, 22, 0.95);
          backdrop-filter: blur(24px);
          -webkit-backdrop-filter: blur(24px);
          border: 1px solid rgba(255, 255, 255, 0.08);
          border-radius: 20px;
          padding: 2.25rem;
          width: 90%;
          max-width: 580px;
          box-shadow: 0 20px 50px rgba(0, 0, 0, 0.5), inset 0 0 0 1px rgba(255,255,255,0.05);
          position: relative;
          overflow: hidden;
          animation: scaleIn 0.3s cubic-bezier(0.34, 1.56, 0.64, 1) forwards;
        }
        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        @keyframes scaleIn {
          from { transform: scale(0.92); opacity: 0; }
          to { transform: scale(1); opacity: 1; }
        }
        .ai-tone-card {
          padding: 1rem;
          border-radius: 12px;
          background: rgba(255, 255, 255, 0.02);
          border: 1px solid rgba(255, 255, 255, 0.04);
          cursor: pointer;
          transition: all 0.25s cubic-bezier(0.16, 1, 0.3, 1);
        }
        .ai-tone-card:hover {
          background: rgba(255, 255, 255, 0.05);
          border-color: rgba(255, 255, 255, 0.1);
        }
        .ai-tone-card.active {
          background: rgba(235, 176, 91, 0.08);
          border-color: var(--accent-ochre);
          box-shadow: 0 4px 15px rgba(235, 176, 91, 0.1);
        }
        .ai-loader-container {
          display: flex;
          flex-direction: column;
          align-items: center;
          padding: 2.5rem 1rem;
        }
        .ai-processing-spark {
          animation: pulseGlow 1.5s ease-in-out infinite alternate;
        }
        @keyframes pulseGlow {
          from { transform: scale(0.95); filter: drop-shadow(0 0 4px rgba(235, 176, 91, 0.4)); }
          to { transform: scale(1.05); filter: drop-shadow(0 0 16px rgba(235, 176, 91, 0.8)); }
        }
        .ai-spinner-small {
          width: 18px;
          height: 18px;
          border: 2px solid rgba(235, 176, 91, 0.2);
          border-top-color: var(--accent-ochre);
          border-radius: 50%;
          animation: spin 0.8s linear infinite;
          flex-shrink: 0;
        }
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
        .ai-scanner-line {
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          height: 3px;
          background: linear-gradient(90deg, transparent, var(--accent-ochre), transparent);
          opacity: 0.65;
          animation: scan 2s linear infinite;
          pointer-events: none;
        }
        @keyframes scan {
          0% { top: 0%; }
          50% { top: 100%; }
          100% { top: 0%; }
        }
        .project-type-btn {
          transition: all 0.25s cubic-bezier(0.16, 1, 0.3, 1);
        }
        .project-type-btn:hover {
          background: rgba(255, 255, 255, 0.05) !important;
          border-color: rgba(255, 255, 255, 0.1) !important;
        }
        .project-type-btn.active:hover {
          background: rgba(235, 176, 91, 0.12) !important;
          border-color: var(--accent-ochre) !important;
        }
        .resource-filter-btn {
          transition: all 0.25s cubic-bezier(0.16, 1, 0.3, 1);
        }
        .resource-filter-btn:hover {
          background: rgba(255, 255, 255, 0.05) !important;
          border-color: rgba(255, 255, 255, 0.1) !important;
          color: var(--text-primary) !important;
        }
        .resource-filter-btn.active:hover {
          background: rgba(74, 131, 237, 0.18) !important;
          border-color: var(--accent-electric) !important;
        }
        .highlighted-resource-card {
          border-color: var(--accent-ochre) !important;
          background: rgba(235, 176, 91, 0.03) !important;
          box-shadow: 0 0 25px rgba(235, 176, 91, 0.15), inset 0 0 0 1px rgba(235, 176, 91, 0.1) !important;
          transform: translateY(-4px) scale(1.01);
        }
        .resource-card:hover {
          background: rgba(255, 255, 255, 0.03) !important;
          border-color: rgba(255, 255, 255, 0.08) !important;
          transform: translateY(-2px);
        }
        .resource-link {
          transition: all 0.2s ease;
        }
        .resource-link:hover {
          color: #70a1ff !important;
          text-decoration: underline !important;
        }
        @media (min-width: 992px) {
          .directory-grid-layout {
            grid-template-columns: 1fr 1fr !important;
          }
        }
        @keyframes pulse-glow {
          0%, 100% { opacity: 1; transform: scale(1); box-shadow: 0 0 6px rgba(224, 90, 71, 0.4); }
          50% { opacity: 0.85; transform: scale(0.98); box-shadow: 0 0 12px rgba(224, 90, 71, 0.7); }
        }
        .priority-indicator {
          border-color: rgba(224, 90, 71, 0.45) !important;
          background: linear-gradient(135deg, rgba(224, 90, 71, 0.04) 0%, rgba(255, 255, 255, 0.02) 100%) !important;
          box-shadow: 0 0 12px rgba(224, 90, 71, 0.12) !important;
        }
        /* Custom Scrollbar */
        .section-card,
        .interactive-text-area,
        .copilot-result-card {
          --scrollbar-thumb: rgba(224, 90, 71, 0.4);
          --scrollbar-track: rgba(255,255,255,0.03);
          scrollbar-color: var(--scrollbar-thumb) var(--scrollbar-track);
          scrollbar-width: thin;
        }
        @supports not (scrollbar-color: auto) {
          .section-card::-webkit-scrollbar,
          .interactive-text-area::-webkit-scrollbar,
          .copilot-result-card::-webkit-scrollbar {
            width: 6px;
            height: 6px;
          }
          .section-card::-webkit-scrollbar-thumb,
          .interactive-text-area::-webkit-scrollbar-thumb,
          .copilot-result-card::-webkit-scrollbar-thumb {
            background: var(--scrollbar-thumb);
            border-radius: 3px;
          }
          .section-card::-webkit-scrollbar-track,
          .interactive-text-area::-webkit-scrollbar-track,
          .copilot-result-card::-webkit-scrollbar-track {
            background: var(--scrollbar-track);
          }
        }
        /* Context control panel responsive */
        @media (max-width: 768px) {
          .context-control-panel {
            grid-template-columns: 1fr !important;
          }
        }
        /* Select option styling */
        select option {
          background: #1a1a2e;
          color: #e2e8f0;
        }
      `}</style>

      {/* Beta Header */}
      <div style={{
        background: 'linear-gradient(90deg, rgba(224,90,71,0.15) 0%, rgba(139,92,246,0.15) 100%)',
        border: '1px solid rgba(224,90,71,0.3)',
        borderRadius: '12px',
        padding: '1.25rem 1.5rem',
        marginBottom: '2rem',
        display: 'flex',
        alignItems: 'center',
        gap: '1rem',
        justifyContent: 'space-between'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <span className="material-symbols-outlined" style={{ color: 'var(--accent-terracotta)', fontSize: '2rem' }}>
            auto_awesome_motion
          </span>
          <div>
            <h3 style={{ margin: 0, fontFamily: 'Space Grotesk', fontSize: '1.15rem' }}>Grant Application & Proposal Assistant</h3>
            <p style={{ margin: '0.2rem 0 0 0', fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
              Developer Preview Sandbox — Helping artists craft and format highly successful submissions.
            </p>
          </div>
        </div>
        <div style={{
          background: 'var(--accent-terracotta)',
          color: '#fff',
          fontWeight: 700,
          fontSize: '0.7rem',
          letterSpacing: '0.08em',
          textTransform: 'uppercase',
          padding: '0.25rem 0.65rem',
          borderRadius: '999px'
        }}>
          BETA PREVIEW
        </div>
      </div>

      {/* ─── Context Control Panel ─── */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: '1fr 1fr',
        gap: '1rem',
        marginBottom: '1.5rem',
      }} className="context-control-panel">

        {/* Opportunity Selector */}
        <div style={{
          background: 'rgba(255,255,255,0.025)',
          backdropFilter: 'blur(20px)',
          WebkitBackdropFilter: 'blur(20px)',
          border: '1px solid rgba(255,255,255,0.07)',
          borderRadius: '14px',
          padding: '1.1rem 1.25rem',
          position: 'relative',
          overflow: 'hidden',
          boxShadow: selectedFundingSource ? '0 0 0 1.5px rgba(224,90,71,0.4), 0 8px 32px rgba(224,90,71,0.08)' : '0 4px 24px rgba(0,0,0,0.2)',
          transition: 'box-shadow 0.3s ease'
        }}>
          <div style={{ position: 'absolute', top: '-30px', left: '-30px', width: '80px', height: '80px', borderRadius: '50%', background: 'var(--accent-terracotta)', filter: 'blur(50px)', opacity: 0.12, pointerEvents: 'none' }} />
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.6rem' }}>
            <span className="material-symbols-outlined" style={{ fontSize: '1rem', color: 'var(--accent-terracotta)' }}>local_activity</span>
            <span style={{ fontSize: '0.7rem', fontWeight: 800, color: 'var(--accent-terracotta)', textTransform: 'uppercase', letterSpacing: '0.07em' }}>Active Grant Opportunity</span>
          </div>
          <select
            value={selectedFundingSource?.id || ''}
            onChange={e => {
              const id = e.target.value;
              if (!id) {
                onClearFundingSource && onClearFundingSource();
                return;
              }
              const src = fundingSources.find(f => f.id === id);
              if (src && onApplyFunding) onApplyFunding(src);
            }}
            style={{
              width: '100%',
              background: 'rgba(0,0,0,0.35)',
              border: '1px solid rgba(255,255,255,0.1)',
              borderRadius: '8px',
              padding: '0.55rem 0.85rem',
              color: selectedFundingSource ? 'var(--text-primary)' : 'var(--text-secondary)',
              fontFamily: 'Outfit, sans-serif',
              fontSize: '0.88rem',
              fontWeight: selectedFundingSource ? 600 : 400,
              cursor: 'pointer',
              outline: 'none',
              appearance: 'none',
              WebkitAppearance: 'none',
              backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 24 24' fill='none' stroke='%23888' stroke-width='2'%3E%3Cpath d='m6 9 6 6 6-6'/%3E%3C/svg%3E")`,
              backgroundRepeat: 'no-repeat',
              backgroundPosition: 'right 0.85rem center',
              paddingRight: '2.2rem',
              transition: 'border-color 0.2s ease'
            }}
          >
            <option value="">— Select a Grant or RFP —</option>
            {fundingSources.map(fs => (
              <option key={fs.id} value={fs.id}>
                {fs.title} · {fs.amount} · {fs.provider}
              </option>
            ))}
          </select>
          {selectedFundingSource && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginTop: '0.65rem', flexWrap: 'wrap' }}>
              <span style={{ fontSize: '0.75rem', color: 'var(--accent-ochre)', fontWeight: 600 }}>
                <span className="material-symbols-outlined" style={{ fontSize: '0.85rem', verticalAlign: 'middle' }}>payments</span> {selectedFundingSource.amount}
              </span>
              {selectedFundingSource.closeDate && (
                <span style={{ fontSize: '0.72rem', color: '#ff6b7a', fontWeight: 700, display: 'inline-flex', alignItems: 'center', gap: '0.25rem' }}>
                  <span style={{ width: 5, height: 5, borderRadius: '50%', background: '#ff4d5e', display: 'inline-block' }} />
                  Deadline: {new Date(selectedFundingSource.closeDate + 'T23:59:59').toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                </span>
              )}
              <span style={{ background: 'rgba(139,92,246,0.18)', border: '1px solid rgba(139,92,246,0.3)', color: '#a78bfa', borderRadius: '4px', padding: '0.1rem 0.45rem', fontWeight: 700, fontSize: '0.67rem', letterSpacing: '0.05em', textTransform: 'uppercase' }}>
                {selectedFundingSource.type}
              </span>
            </div>
          )}
        </div>

        {/* Artist Profile Integration */}
        <div style={{
          background: 'rgba(255,255,255,0.025)',
          backdropFilter: 'blur(20px)',
          WebkitBackdropFilter: 'blur(20px)',
          border: connectedArtist ? '1px solid rgba(74,131,237,0.35)' : '1px solid rgba(255,255,255,0.07)',
          borderRadius: '14px',
          padding: '1.1rem 1.25rem',
          position: 'relative',
          overflow: 'hidden',
          boxShadow: connectedArtist ? '0 0 0 1.5px rgba(74,131,237,0.3), 0 8px 32px rgba(74,131,237,0.07)' : '0 4px 24px rgba(0,0,0,0.2)',
          transition: 'box-shadow 0.3s ease'
        }}>
          <div style={{ position: 'absolute', top: '-30px', right: '-30px', width: '80px', height: '80px', borderRadius: '50%', background: 'var(--accent-electric)', filter: 'blur(50px)', opacity: 0.1, pointerEvents: 'none' }} />
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.6rem' }}>
            <span className="material-symbols-outlined" style={{ fontSize: '1rem', color: connectedArtist ? 'var(--accent-electric)' : 'var(--text-secondary)' }}>person_pin</span>
            <span style={{ fontSize: '0.7rem', fontWeight: 800, color: connectedArtist ? 'var(--accent-electric)' : 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.07em' }}>
              {connectedArtist ? 'Connected Artist Profile' : 'Artist Profile Integration'}
            </span>
          </div>
          <select
            value={connectedArtist?.id || ''}
            onChange={e => handleSelectSimulatedArtist(e.target.value)}
            style={{
              width: '100%',
              background: 'rgba(0,0,0,0.35)',
              border: '1px solid rgba(255,255,255,0.1)',
              borderRadius: '8px',
              padding: '0.55rem 0.85rem',
              color: connectedArtist ? 'var(--text-primary)' : 'var(--text-secondary)',
              fontFamily: 'Outfit, sans-serif',
              fontSize: '0.88rem',
              fontWeight: connectedArtist ? 600 : 400,
              cursor: 'pointer',
              outline: 'none',
              appearance: 'none',
              WebkitAppearance: 'none',
              backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 24 24' fill='none' stroke='%23888' stroke-width='2'%3E%3Cpath d='m6 9 6 6 6-6'/%3E%3C/svg%3E")`,
              backgroundRepeat: 'no-repeat',
              backgroundPosition: 'right 0.85rem center',
              paddingRight: '2.2rem',
              transition: 'border-color 0.2s ease'
            }}
          >
            <option value="">— No Artist Profile Connected —</option>
            {activeArtistsList.map(a => (
              <option key={a.id} value={a.id}>
                {a.alias || `${a.firstName} ${a.lastName}`.trim()} · {a.primaryMedium || 'Mixed Media'}
              </option>
            ))}
          </select>
          {connectedArtist && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginTop: '0.65rem', flexWrap: 'wrap' }}>
              <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.3rem', fontSize: '0.75rem', color: '#34d399', fontWeight: 700 }}>
                <span className="material-symbols-outlined" style={{ fontSize: '0.9rem' }}>verified</span>
                Profile Connected
              </span>
              <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
                {connectedArtist.primaryMedium}
              </span>
              {connectedArtist.city && (
                <span style={{ fontSize: '0.72rem', color: 'var(--text-secondary)', display: 'inline-flex', alignItems: 'center', gap: '0.2rem' }}>
                  <span className="material-symbols-outlined" style={{ fontSize: '0.8rem' }}>location_on</span>
                  {connectedArtist.city}, {connectedArtist.state}
                </span>
              )}
              <span style={{
                background: connectedArtist.vettingStatus === 'Vetted' ? 'rgba(52,211,153,0.12)' : 'rgba(255,255,255,0.05)',
                border: `1px solid ${connectedArtist.vettingStatus === 'Vetted' ? 'rgba(52,211,153,0.3)' : 'rgba(255,255,255,0.08)'}`,
                color: connectedArtist.vettingStatus === 'Vetted' ? '#34d399' : 'var(--text-secondary)',
                borderRadius: '4px', padding: '0.1rem 0.45rem', fontWeight: 700, fontSize: '0.67rem', letterSpacing: '0.05em', textTransform: 'uppercase'
              }}>
                {connectedArtist.vettingStatus || 'Pending'}
              </span>
            </div>
          )}
          {!connectedArtist && (
            <p style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginTop: '0.6rem', margin: '0.6rem 0 0 0', opacity: 0.7 }}>
              Connect a profile to auto-populate proposal templates with your credentials, portfolio, and medium details.
            </p>
          )}
        </div>
      </div>

      {/* Assistant Tab bar */}
      <div className="grant-assistant-nav">
        <button className={`grant-assistant-nav-btn ${subTab === 'map' ? 'active' : ''}`} onClick={() => setSubTab('map')}>
          <span className="material-symbols-outlined" style={{ fontSize: '1.2rem' }}>map</span> Geospatial Opportunities Map
        </button>
        <button className={`grant-assistant-nav-btn ${subTab === 'copilot' ? 'active' : ''}`} onClick={() => setSubTab('copilot')}>
          <span className="material-symbols-outlined" style={{ fontSize: '1.2rem' }}>psychology</span> Proposal AI Copilot
        </button>
        <button className={`grant-assistant-nav-btn ${subTab === 'checklist' ? 'active' : ''}`} onClick={() => setSubTab('checklist')}>
          <span className="material-symbols-outlined">checklist</span> Interactive Checklist
        </button>
        <button className={`grant-assistant-nav-btn ${subTab === 'templates' ? 'active' : ''}`} onClick={() => setSubTab('templates')}>
          <span className="material-symbols-outlined">drafts</span> Narrative Template Editor
        </button>
        <button className={`grant-assistant-nav-btn ${subTab === 'calculator' ? 'active' : ''}`} onClick={() => setSubTab('calculator')}>
          <span className="material-symbols-outlined">calculate</span> Public Art Budget Estimator
        </button>
        <button className={`grant-assistant-nav-btn ${subTab === 'resources' ? 'active' : ''}`} onClick={() => setSubTab('resources')}>
          <span className="material-symbols-outlined">architecture</span> Denver Materials & Hubs
        </button>
      </div>

      {/* Active Cognitive Workspace Banner */}
      {selectedFundingSource && (
        <div style={{
          background: 'linear-gradient(135deg, rgba(224, 90, 71, 0.15) 0%, rgba(167, 139, 250, 0.08) 100%)',
          border: '1px solid rgba(224, 90, 71, 0.35)',
          borderRadius: '12px',
          padding: '1.25rem 1.75rem',
          marginBottom: '1.5rem',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: '1.5rem',
          flexWrap: 'wrap',
          boxShadow: '0 8px 32px 0 rgba(224, 90, 71, 0.08)',
          position: 'relative',
          overflow: 'hidden'
        }}>
          <div style={{
            position: 'absolute', top: '-40px', right: '-40px',
            width: '100px', height: '100px', borderRadius: '50%',
            background: 'var(--accent-terracotta)', filter: 'blur(60px)', opacity: 0.2
          }} />
          
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem', flex: 1, zIndex: 1 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <span className="material-symbols-outlined" style={{ fontSize: '1rem', color: 'var(--accent-terracotta)' }}>auto_awesome_motion</span>
              <span style={{ fontSize: '0.72rem', color: 'var(--accent-terracotta)', fontWeight: 800, letterSpacing: '0.06em', textTransform: 'uppercase' }}>
                Active Cognitive Workspace
              </span>
            </div>
            
            <h3 style={{ fontFamily: 'Space Grotesk', fontSize: '1.2rem', margin: 0, fontWeight: 700, letterSpacing: '0.5px' }}>
              {selectedFundingSource.title}
            </h3>
            
            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', flexWrap: 'wrap', marginTop: '0.2rem', fontSize: '0.82rem', color: 'var(--text-secondary)' }}>
              <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.25rem' }}>
                <span className="material-symbols-outlined" style={{ fontSize: '0.95rem' }}>account_balance</span> {selectedFundingSource.provider}
              </span>
              <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.25rem' }}>
                <span className="material-symbols-outlined" style={{ fontSize: '0.95rem', color: 'var(--accent-ochre)' }}>payments</span> {selectedFundingSource.amount}
              </span>
              <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.25rem', background: 'rgba(139,92,246,0.15)', border: '1px solid rgba(139,92,246,0.3)', color: '#a78bfa', borderRadius: '4px', padding: '0.1rem 0.4rem', fontWeight: 600, textTransform: 'uppercase', fontSize: '0.7rem' }}>
                {selectedFundingSource.type}
              </span>
            </div>
          </div>
          
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', zIndex: 1 }}>
            {selectedFundingSource.closeDate && (
              <div style={{
                display: 'inline-flex', alignItems: 'center', gap: '0.4rem',
                background: 'rgba(255, 107, 122, 0.15)', border: '1px solid rgba(255, 107, 122, 0.3)',
                borderRadius: '8px', padding: '0.4rem 0.75rem', fontSize: '0.8rem', fontWeight: 700, color: '#ff6b7a'
              }}>
                <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#ff4d5e', boxShadow: '0 0 6px #ff4d5e' }} />
                Deadline: {new Date(selectedFundingSource.closeDate + 'T23:59:59').toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
              </div>
            )}
            
            <button
              onClick={onClearFundingSource}
              style={{
                background: 'rgba(255,255,255,0.04)',
                border: '1px solid var(--border-subtle)',
                borderRadius: '8px',
                padding: '0.5rem 1rem',
                color: 'var(--text-secondary)',
                fontWeight: 700,
                fontSize: '0.82rem',
                cursor: 'pointer',
                fontFamily: 'inherit',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.35rem',
                transition: 'all 0.2s'
              }}
              onMouseEnter={(e) => { e.currentTarget.style.background = 'rgba(224,90,71,0.1)'; e.currentTarget.style.color = '#fff'; e.currentTarget.style.borderColor = 'rgba(224,90,71,0.4)'; }}
              onMouseLeave={(e) => { e.currentTarget.style.background = 'rgba(255,255,255,0.04)'; e.currentTarget.style.color = 'var(--text-secondary)'; e.currentTarget.style.borderColor = 'var(--border-subtle)'; }}
            >
              <span className="material-symbols-outlined" style={{ fontSize: '1rem' }}>cancel</span>
              Reset Workspace
            </button>
          </div>
        </div>
      )}

      {/* Tab Content -1: Geospatial Opportunities Map */}
      {subTab === 'map' && (
        <div style={{ marginBottom: '2rem' }}>
          <ProjectMap 
            projects={projects}
            fundingSources={fundingSources}
            onApplyFunding={onApplyFunding}
            onNavigatePipeline={onNavigatePipeline}
            onLocateResource={onLocateResource}
            mapFocusItemId={mapFocusItemId}
            onClearMapFocus={onClearMapFocus}
          />
        </div>
      )}

      {/* Tab Content 0: Proposal AI Copilot */}
      {subTab === 'copilot' && (
        <div className="section-card" style={{ position: 'relative', overflow: 'hidden' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.5rem' }}>
            <span className="material-symbols-outlined" style={{ color: 'var(--accent-ochre)', fontSize: '2.0rem' }}>
              psychology
            </span>
            <h2 style={{ fontFamily: 'Space Grotesk', fontSize: '1.4rem', margin: 0 }}>Proposal AI Copilot & Search Advisor</h2>
          </div>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.92rem', marginBottom: '2rem' }}>
            Consult our simulated assistant to search presentation requirements, generate Creative Intent Statements, draft balanced line-item budgets, and explain regional guidelines.
          </p>

          {/* Search Input Bar */}
          <div style={{
            background: 'rgba(255, 255, 255, 0.02)',
            border: '1px solid rgba(255, 255, 255, 0.08)',
            borderRadius: '12px',
            padding: '0.75rem 1rem',
            display: 'flex',
            alignItems: 'center',
            gap: '0.75rem',
            marginBottom: '1.5rem',
            boxShadow: 'inset 0 1px 1px rgba(255, 255, 255, 0.05)'
          }}>
            <span className="material-symbols-outlined" style={{ color: 'var(--text-secondary)' }}>search</span>
            <input 
              type="text" 
              placeholder="Search for grant process, presentation requirements, creative statements, budgets..." 
              value={copilotQuery}
              onChange={(e) => setCopilotQuery(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') handleCopilotSearch();
              }}
              style={{
                background: 'transparent',
                border: 'none',
                color: '#fff',
                fontSize: '0.95rem',
                outline: 'none',
                flex: 1
              }}
            />
            <button 
              onClick={() => handleCopilotSearch()}
              style={{
                background: 'var(--accent-terracotta)',
                color: '#fff',
                border: 'none',
                borderRadius: '8px',
                padding: '0.5rem 1.25rem',
                fontSize: '0.85rem',
                fontWeight: 600,
                cursor: 'pointer',
                transition: 'all 0.2s'
              }}
            >
              Ask Advisor
            </button>
          </div>

          {/* Quick Suggestions / Preset Queries */}
          <div style={{ marginBottom: '2rem' }}>
            <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', fontWeight: 600, display: 'block', marginBottom: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
              Quick Copilot Suggestions:
            </span>
            <div style={{ display: 'flex', gap: '0.65rem', flexWrap: 'wrap' }}>
              <button 
                className="pill-btn"
                onClick={() => handleCopilotSearch(selectedFundingSource ? `Explain the Public Art Grant Process for ${selectedFundingSource.title}` : 'Explain the Public Art Grant Process')}
                style={{
                  background: 'rgba(255,255,255,0.03)',
                  border: '1px solid rgba(255,255,255,0.06)',
                  borderRadius: '999px',
                  padding: '0.4rem 0.85rem',
                  fontSize: '0.82rem',
                  color: 'var(--text-primary)',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.35rem',
                  transition: 'all 0.2s'
                }}
              >
                💡 Explain Process{selectedFundingSource ? ` for ${getShortName(selectedFundingSource)}` : ''}
              </button>
              <button 
                className="pill-btn"
                onClick={() => handleCopilotSearch(selectedFundingSource ? `Presentation requirements and slide deck ideas for ${selectedFundingSource.title}` : 'Presentation requirements and slide deck ideas')}
                style={{
                  background: 'rgba(255,255,255,0.03)',
                  border: '1px solid rgba(255,255,255,0.06)',
                  borderRadius: '999px',
                  padding: '0.4rem 0.85rem',
                  fontSize: '0.82rem',
                  color: 'var(--text-primary)',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.35rem',
                  transition: 'all 0.2s'
                }}
              >
                🖼️ Presentation Ideas{selectedFundingSource ? ` for ${getShortName(selectedFundingSource)}` : ''}
              </button>
              <button 
                className="pill-btn"
                onClick={() => handleCopilotSearch(selectedFundingSource ? `Formulate Creative Intent Statement ideas for ${selectedFundingSource.title}` : 'Formulate Creative Intent Statement ideas')}
                style={{
                  background: 'rgba(255,255,255,0.03)',
                  border: '1px solid rgba(255,255,255,0.06)',
                  borderRadius: '999px',
                  padding: '0.4rem 0.85rem',
                  fontSize: '0.82rem',
                  color: 'var(--text-primary)',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.35rem',
                  transition: 'all 0.2s'
                }}
              >
                ✍️ Creative Intent Statement{selectedFundingSource ? ` for ${getShortName(selectedFundingSource)}` : ''}
              </button>
              <button 
                className="pill-btn"
                onClick={() => handleCopilotSearch(selectedFundingSource ? `Draft Balanced Line-Item Budget structure for ${selectedFundingSource.title}` : 'Draft Balanced Line-Item Budget structure')}
                style={{
                  background: 'rgba(255,255,255,0.03)',
                  border: '1px solid rgba(255,255,255,0.06)',
                  borderRadius: '999px',
                  padding: '0.4rem 0.85rem',
                  fontSize: '0.82rem',
                  color: 'var(--text-primary)',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.35rem',
                  transition: 'all 0.2s'
                }}
              >
                📊 Draft Budget{selectedFundingSource ? ` for ${getShortName(selectedFundingSource)}` : ''}
              </button>
              <button 
                className="pill-btn"
                onClick={() => handleCopilotSearch(selectedFundingSource ? `Denver DOTI Permits and P.E. structural engineering safety for ${selectedFundingSource.title}` : 'Denver DOTI Permits and P.E. structural engineering safety')}
                style={{
                  background: 'rgba(255,255,255,0.03)',
                  border: '1px solid rgba(255,255,255,0.06)',
                  borderRadius: '999px',
                  padding: '0.4rem 0.85rem',
                  fontSize: '0.82rem',
                  color: 'var(--text-primary)',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.35rem',
                  transition: 'all 0.2s'
                }}
              >
                🚧 Permits & Safety{selectedFundingSource ? ` for ${getShortName(selectedFundingSource)}` : ''}
              </button>
            </div>
          </div>

          {/* Thinking simulator state */}
          {isCopilotThinking && (
            <div style={{
              background: 'rgba(255, 255, 255, 0.02)',
              border: '1px solid rgba(255, 255, 255, 0.05)',
              borderRadius: '12px',
              padding: '2rem',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '1.25rem',
              animation: 'pulse 1.5s infinite ease-in-out'
            }}>
              <div className="ai-agent-spinner" style={{
                width: '40px',
                height: '40px',
                border: '3px solid rgba(224, 90, 71, 0.1)',
                borderTop: '3px solid var(--accent-terracotta)',
                borderRadius: '50%',
                animation: 'spin 1s linear infinite'
              }} />
              <div style={{ textAlign: 'center' }}>
                <div style={{ fontWeight: 600, fontSize: '0.95rem', color: 'var(--text-primary)', marginBottom: '0.5rem' }}>AI Copilot Synthesizing...</div>
                <div style={{ fontSize: '0.82rem', color: 'var(--accent-ochre)', fontFamily: 'monospace', maxWidth: '450px', margin: '0 auto', lineHeight: 1.4 }}>
                  {copilotConsoleLogs.map((log, idx) => (
                    <div key={idx} style={{ opacity: idx === copilotConsoleLogs.length - 1 ? 1 : 0.4 }}>{log}</div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Copilot Result Block */}
          {!isCopilotThinking && copilotResult && (
            <div className="copilot-result-card" style={{
              background: 'rgba(255, 255, 255, 0.015)',
              border: '1px solid rgba(255, 255, 255, 0.06)',
              borderRadius: '16px',
              padding: '1.75rem',
              animation: 'fadeIn 0.35s cubic-bezier(0.16, 1, 0.3, 1)',
              boxShadow: '0 8px 32px 0 rgba(0, 0, 0, 0.2)'
            }}>
              <div style={{ borderBottom: '1px solid rgba(255, 255, 255, 0.08)', paddingBottom: '1rem', marginBottom: '1.25rem' }}>
                <h3 style={{ margin: 0, fontFamily: 'Space Grotesk', fontSize: '1.2rem', color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  {copilotResult.title}
                </h3>
                <p style={{ margin: '0.25rem 0 0 0', fontSize: '0.85rem', color: 'var(--accent-ochre)' }}>{copilotResult.subtitle}</p>
              </div>

              <p style={{ fontSize: '0.92rem', color: 'var(--text-secondary)', lineHeight: 1.5, marginBottom: '1.5rem' }}>
                {copilotResult.content}
              </p>

              {/* RENDER DYNAMIC CARD TOOL BY QUERY TYPE */}
              
              {/* Type 1: Process */}
              {copilotResult.type === 'process' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', marginBottom: '1.5rem' }}>
                  {copilotResult.steps.map((st, sIdx) => (
                    <div key={sIdx} style={{
                      background: 'rgba(255,255,255,0.01)',
                      borderLeft: '3px solid var(--accent-terracotta)',
                      padding: '0.75rem 1rem',
                      borderRadius: '0 8px 8px 0'
                    }}>
                      <h4 style={{ margin: '0 0 0.25rem 0', fontSize: '0.9rem', color: 'var(--text-primary)', fontWeight: 600 }}>{st.phase}</h4>
                      <p style={{ margin: 0, fontSize: '0.85rem', color: 'var(--text-secondary)' }}>{st.desc}</p>
                    </div>
                  ))}
                </div>
              )}

              {/* Type 2: Presentation */}
              {copilotResult.type === 'presentation' && (
                <div style={{ marginBottom: '1.5rem' }}>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '1rem', marginBottom: '1.5rem' }}>
                    {copilotResult.details.map((dt, dIdx) => (
                      <div key={dIdx} style={{ background: 'rgba(255,255,255,0.02)', padding: '0.85rem 1rem', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.04)' }}>
                        <h4 style={{ margin: '0 0 0.25rem 0', fontSize: '0.9rem', color: 'var(--accent-ochre)' }}>{dt.title}</h4>
                        <p style={{ margin: 0, fontSize: '0.82rem', color: 'var(--text-secondary)' }}>{dt.desc}</p>
                      </div>
                    ))}
                  </div>

                  <div style={{ background: 'rgba(224, 90, 71, 0.05)', border: '1px solid rgba(224, 90, 71, 0.15)', padding: '1rem', borderRadius: '12px', marginBottom: '1.5rem' }}>
                    <h4 style={{ margin: '0 0 0.5rem 0', fontSize: '0.85rem', textTransform: 'uppercase', letterSpacing: '0.04em', color: 'var(--accent-terracotta)' }}>Recommended Proposal Slide Deck:</h4>
                    <ul style={{ margin: 0, paddingLeft: '1.2rem', fontSize: '0.85rem', color: 'var(--text-secondary)', lineHeight: 1.6 }}>
                      {copilotResult.suggestedDeck.map((slide, sIdx) => (
                        <li key={sIdx}>{slide}</li>
                      ))}
                    </ul>
                  </div>
                </div>
              )}

              {/* Type 3: Intent Statement Builder (Custom Tool) */}
              {copilotResult.type === 'intent' && (
                <div style={{ background: 'rgba(255, 255, 255, 0.015)', border: '1px solid rgba(255, 255, 255, 0.04)', padding: '1.25rem', borderRadius: '12px', marginBottom: '1.5rem' }}>
                  <h4 style={{ margin: '0 0 1rem 0', fontSize: '0.95rem', color: 'var(--text-primary)' }}>🛠️ Interactive Statement Formulator</h4>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1.25rem' }}>
                    <div>
                      <label style={{ display: 'block', fontSize: '0.75rem', color: 'var(--text-secondary)', marginBottom: '0.35rem', fontWeight: 600 }}>1. CHOOSE PROJECT MEDIUM</label>
                      <select 
                        value={intentMedium}
                        onChange={(e) => setIntentMedium(e.target.value)}
                        style={{
                          width: '100%',
                          background: 'rgba(0,0,0,0.3)',
                          border: '1px solid rgba(255,255,255,0.1)',
                          color: '#fff',
                          borderRadius: '6px',
                          padding: '0.45rem 0.5rem',
                          outline: 'none',
                          fontSize: '0.85rem'
                        }}
                      >
                        <option value="Sculpture">Anchored Physical Sculpture</option>
                        <option value="Mural">High-Visibility Mural</option>
                        <option value="Wooden Pavilion">Wooden Social Pavilion</option>
                        <option value="Light Installation">Dynamic Light Installation</option>
                      </select>
                    </div>
                    <div>
                      <label style={{ display: 'block', fontSize: '0.75rem', color: 'var(--text-secondary)', marginBottom: '0.35rem', fontWeight: 600 }}>2. CHOOSE NARRATIVE FOCUS</label>
                      <select 
                        value={intentTheme}
                        onChange={(e) => setIntentTheme(e.target.value)}
                        style={{
                          width: '100%',
                          background: 'rgba(0,0,0,0.3)',
                          border: '1px solid rgba(255,255,255,0.1)',
                          color: '#fff',
                          borderRadius: '6px',
                          padding: '0.45rem 0.5rem',
                          outline: 'none',
                          fontSize: '0.85rem'
                        }}
                      >
                        <option value="Cultural Heritage & Roots">Cultural Heritage & Roots</option>
                        <option value="Eco-Consciousness & Nature">Eco-Consciousness & Nature</option>
                        <option value="Social Equity & Inclusion">Social Equity & Inclusion</option>
                        <option value="Abstract Spatial Geometry">Abstract Spatial Geometry</option>
                      </select>
                    </div>
                  </div>

                  <button 
                    onClick={generateIntentStatement}
                    style={{
                      background: 'rgba(255,255,255,0.06)',
                      border: '1px solid rgba(255,255,255,0.1)',
                      color: 'var(--text-primary)',
                      fontWeight: 600,
                      fontSize: '0.85rem',
                      padding: '0.5rem 1rem',
                      borderRadius: '8px',
                      cursor: 'pointer',
                      margin: '1rem 0 1.25rem 0',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.35rem',
                      transition: 'all 0.2s'
                    }}
                  >
                    <span className="material-symbols-outlined" style={{ fontSize: '1.1rem' }}>build</span> Formulate Custom Intent Idea
                  </button>

                  {/* Generated Statement Preview */}
                  {generatedIntent && (
                    <div style={{ animation: 'fadeIn 0.25s ease' }}>
                      <label style={{ display: 'block', fontSize: '0.75rem', color: 'var(--accent-ochre)', marginBottom: '0.35rem', fontWeight: 700 }}>GENERATED CREATIVE STATEMENT IDEA</label>
                      <div style={{
                        background: 'rgba(0,0,0,0.2)',
                        border: '1px solid rgba(255,255,255,0.06)',
                        borderRadius: '8px',
                        padding: '1rem',
                        fontSize: '0.88rem',
                        lineHeight: 1.5,
                        color: 'var(--text-primary)',
                        marginBottom: '1rem',
                        whiteSpace: 'pre-line'
                      }}>
                        {generatedIntent}
                      </div>

                      <div style={{ display: 'flex', gap: '0.75rem' }}>
                        <button 
                          onClick={() => {
                            navigator.clipboard.writeText(generatedIntent);
                            setIntentCopySuccess(true);
                            setTimeout(() => setIntentCopySuccess(false), 2000);
                          }}
                          style={{
                            background: 'rgba(255,255,255,0.05)',
                            border: '1px solid rgba(255,255,255,0.1)',
                            color: '#fff',
                            borderRadius: '8px',
                            padding: '0.45rem 1rem',
                            fontSize: '0.82rem',
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '0.35rem',
                            transition: 'all 0.2s'
                          }}
                        >
                          <span className="material-symbols-outlined" style={{ fontSize: '1rem' }}>content_copy</span> 
                          {intentCopySuccess ? 'Copied!' : 'Copy to Clipboard'}
                        </button>
                        <button 
                          onClick={() => {
                            setCustomText(generatedIntent);
                            setSubTab('templates');
                          }}
                          style={{
                            background: 'rgba(224, 90, 71, 0.15)',
                            border: '1px solid rgba(224, 90, 71, 0.3)',
                            color: 'var(--accent-terracotta)',
                            borderRadius: '8px',
                            padding: '0.45rem 1rem',
                            fontSize: '0.82rem',
                            fontWeight: 600,
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '0.35rem',
                            transition: 'all 0.2s'
                          }}
                        >
                          <span className="material-symbols-outlined" style={{ fontSize: '1rem' }}>edit_square</span> Load into Narrative Editor
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Type 4: Budget Helper (Custom Tool) */}
              {copilotResult.type === 'budget' && (
                <div style={{ background: 'rgba(255, 255, 255, 0.015)', border: '1px solid rgba(255, 255, 255, 0.04)', padding: '1.25rem', borderRadius: '12px', marginBottom: '1.5rem' }}>
                  <h4 style={{ margin: '0 0 1rem 0', fontSize: '0.95rem', color: 'var(--text-primary)' }}>🛠️ Interactive Line-Item Budget Preparer</h4>
                  
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1.25rem' }}>
                    <div>
                      <label style={{ display: 'block', fontSize: '0.75rem', color: 'var(--text-secondary)', marginBottom: '0.35rem', fontWeight: 600 }}>1. TARGET GRANT BUDGET ($)</label>
                      <input 
                        type="number"
                        value={budgetPreviewTarget}
                        onChange={(e) => setBudgetPreviewTarget(Math.max(1, parseInt(e.target.value) || 0))}
                        style={{
                          width: '100%',
                          background: 'rgba(0,0,0,0.3)',
                          border: '1px solid rgba(255,255,255,0.1)',
                          color: '#fff',
                          borderRadius: '6px',
                          padding: '0.45rem 0.5rem',
                          outline: 'none',
                          fontSize: '0.85rem'
                        }}
                      />
                    </div>
                    <div>
                      <label style={{ display: 'block', fontSize: '0.75rem', color: 'var(--text-secondary)', marginBottom: '0.35rem', fontWeight: 600 }}>2. PROJECT MATERIAL FOCUS</label>
                      <select 
                        value={budgetPreviewFocus}
                        onChange={(e) => setBudgetPreviewFocus(e.target.value)}
                        style={{
                          width: '100%',
                          background: 'rgba(0,0,0,0.3)',
                          border: '1px solid rgba(255,255,255,0.1)',
                          color: '#fff',
                          borderRadius: '6px',
                          padding: '0.45rem 0.5rem',
                          outline: 'none',
                          fontSize: '0.85rem'
                        }}
                      >
                        <option value="balanced">Standard Balanced Structure</option>
                        <option value="material_heavy">Material-Heavy (Paint/Metals)</option>
                        <option value="fabrication_heavy">Fabrication-Heavy (Engineering/Welding)</option>
                      </select>
                    </div>
                  </div>

                  <button 
                    onClick={() => setGeneratedBudget(generateBudgetBreakdown(budgetPreviewTarget, budgetPreviewFocus))}
                    style={{
                      background: 'rgba(255,255,255,0.06)',
                      border: '1px solid rgba(255,255,255,0.1)',
                      color: 'var(--text-primary)',
                      fontWeight: 600,
                      fontSize: '0.85rem',
                      padding: '0.5rem 1rem',
                      borderRadius: '8px',
                      cursor: 'pointer',
                      margin: '1rem 0 1.25rem 0',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.35rem',
                      transition: 'all 0.2s'
                    }}
                  >
                    <span className="material-symbols-outlined" style={{ fontSize: '1.1rem' }}>table_chart</span> Calculate Allocation Breakdown
                  </button>

                  {/* Calculated Budget Table */}
                  {generatedBudget && (
                    <div style={{ animation: 'fadeIn 0.25s ease' }}>
                      <label style={{ display: 'block', fontSize: '0.75rem', color: 'var(--accent-ochre)', marginBottom: '0.5rem', fontWeight: 700 }}>DRAFTED ITEMIZATION ALLOCATION PREVIEW</label>
                      
                      <div style={{ overflowX: 'auto', marginBottom: '1.25rem', border: '1px solid rgba(255,255,255,0.05)', borderRadius: '8px' }}>
                        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.85rem', background: 'rgba(0,0,0,0.15)' }}>
                          <thead>
                            <tr style={{ background: 'rgba(255,255,255,0.03)', borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
                              <th style={{ textAlign: 'left', padding: '0.6rem 0.85rem', color: 'var(--text-secondary)', fontWeight: 600 }}>Category</th>
                              <th style={{ textAlign: 'center', padding: '0.6rem 0.85rem', color: 'var(--text-secondary)', fontWeight: 600 }}>Ratio (%)</th>
                              <th style={{ textAlign: 'right', padding: '0.6rem 0.85rem', color: 'var(--text-secondary)', fontWeight: 600 }}>Allocation ($)</th>
                              <th style={{ textAlign: 'left', padding: '0.6rem 0.85rem', color: 'var(--text-secondary)', fontWeight: 600 }}>Typical Coverage</th>
                            </tr>
                          </thead>
                          <tbody>
                            {generatedBudget.map((row, rIdx) => (
                              <tr key={rIdx} style={{ borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
                                <td style={{ padding: '0.6rem 0.85rem', fontWeight: 600, color: '#fff' }}>{row.category}</td>
                                <td style={{ padding: '0.6rem 0.85rem', textAlign: 'center', color: 'var(--accent-ochre)' }}>{row.pct}%</td>
                                <td style={{ padding: '0.6rem 0.85rem', textAlign: 'right', fontWeight: 700, color: '#10b981' }}>${row.cost.toLocaleString()}</td>
                                <td style={{ padding: '0.6rem 0.85rem', color: 'var(--text-secondary)', fontSize: '0.78rem' }}>{row.description}</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>

                      <button 
                        onClick={() => applyCustomBudget(budgetPreviewTarget, budgetPreviewFocus)}
                        style={{
                          background: 'var(--accent-terracotta)',
                          color: '#fff',
                          border: 'none',
                          borderRadius: '8px',
                          padding: '0.6rem 1.25rem',
                          fontSize: '0.85rem',
                          fontWeight: 700,
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '0.35rem',
                          boxShadow: '0 4px 12px rgba(224, 90, 71, 0.25)',
                          transition: 'all 0.2s'
                        }}
                      >
                        <span className="material-symbols-outlined" style={{ fontSize: '1.1rem' }}>send</span> Apply This Budget structure to Calculator Tab
                      </button>
                    </div>
                  )}
                </div>
              )}

              {/* Type 5: Permits */}
              {copilotResult.type === 'permits' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', marginBottom: '1.5rem' }}>
                  {copilotResult.requirements.map((req, rIdx) => (
                    <div key={rIdx} style={{
                      background: 'rgba(255,255,255,0.02)',
                      border: '1px solid rgba(255,255,255,0.04)',
                      padding: '0.85rem 1rem',
                      borderRadius: '8px'
                    }}>
                      <div style={{ fontSize: '0.75rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.04em', color: 'var(--accent-ochre)', marginBottom: '0.25rem' }}>
                        {req.agency}
                      </div>
                      <p style={{ margin: 0, fontSize: '0.85rem', color: 'var(--text-secondary)' }}>{req.detail}</p>
                    </div>
                  ))}
                </div>
              )}

              {/* Type 6: General / Fallback */}
              {copilotResult.type === 'general' && (
                <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '1rem', marginBottom: '1.5rem' }}>
                  {copilotResult.bulletPoints.map((bp, bIdx) => (
                    <div key={bIdx} style={{
                      background: 'rgba(255,255,255,0.02)',
                      border: '1px solid rgba(255,255,255,0.04)',
                      padding: '0.85rem 1rem',
                      borderRadius: '8px'
                    }}>
                      <h4 style={{ margin: '0 0 0.25rem 0', fontSize: '0.88rem', color: 'var(--accent-ochre)' }}>{bp.title}</h4>
                      <p style={{ margin: 0, fontSize: '0.82rem', color: 'var(--text-secondary)' }}>{bp.desc}</p>
                    </div>
                  ))}
                </div>
              )}

              {/* Footer and Navigation Action */}
              {copilotResult.tip && (
                <div style={{ fontSize: '0.8rem', fontStyle: 'italic', color: 'var(--text-secondary)', marginBottom: '1.25rem' }}>
                  {copilotResult.tip}
                </div>
              )}

              {copilotResult.actionTab && (
                <button 
                  onClick={() => setSubTab(copilotResult.actionTab)}
                  style={{
                    background: 'rgba(255,255,255,0.06)',
                    border: '1px solid rgba(255,255,255,0.1)',
                    borderRadius: '8px',
                    padding: '0.5rem 1rem',
                    color: 'var(--text-primary)',
                    fontSize: '0.85rem',
                    fontWeight: 600,
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.35rem',
                    transition: 'all 0.2s'
                  }}
                >
                  <span className="material-symbols-outlined" style={{ fontSize: '1rem' }}>arrow_forward</span> 
                  {copilotResult.actionLabel}
                </button>
              )}
            </div>
          )}
        </div>
      )}

      {/* Tab Content 1: Checklist */}
      {subTab === 'checklist' && (
        <div className="section-card">
          <h2 style={{ fontFamily: 'Space Grotesk', fontSize: '1.4rem', marginBottom: '0.5rem' }}>Public Art Proposal Milestones</h2>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.92rem', marginBottom: '2rem' }}>
            Follow these phase-by-phase guidelines to construct a structurally feasible, highly compliant proposal package. Your checklist state is cached locally.
          </p>

          <div className="checklist-grid">
            {grantChecklist.map((item) => {
              const isChecked = !!checkedItems[item.id];
              const isPriority = getIsPriority(item.id, selectedFundingSource);
              const priorityReason = getPriorityReason(item.id, selectedFundingSource);
              return (
                <div 
                  key={item.id}
                  className={`checklist-item ${isChecked ? 'checked' : ''} ${isPriority ? 'priority-indicator' : ''}`}
                  onClick={() => toggleChecklist(item.id)}
                  style={{
                    position: 'relative',
                    border: isPriority ? '1px solid rgba(224, 90, 71, 0.45)' : undefined,
                    boxShadow: isPriority ? '0 0 12px rgba(224, 90, 71, 0.12)' : undefined,
                    background: isPriority ? 'linear-gradient(135deg, rgba(224, 90, 71, 0.04) 0%, rgba(255, 255, 255, 0.02) 100%)' : undefined
                  }}
                >
                  {isPriority && (
                    <div style={{
                      position: 'absolute',
                      top: '0.65rem',
                      right: '0.75rem',
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '0.25rem',
                      background: 'rgba(224, 90, 71, 0.15)',
                      border: '1px solid rgba(224, 90, 71, 0.4)',
                      color: 'var(--accent-terracotta)',
                      fontSize: '0.68rem',
                      fontWeight: 700,
                      padding: '0.15rem 0.45rem',
                      borderRadius: '4px',
                      letterSpacing: '0.04em',
                      animation: 'pulse-glow 1.8s ease-in-out infinite'
                    }}>
                      ★ HIGH PRIORITY: {priorityReason}
                    </div>
                  )}
                  <div className="checkbox-custom">
                    <span className="material-symbols-outlined" style={{ fontSize: '1.1rem' }}>done</span>
                  </div>
                  <div>
                    <div style={{ fontSize: '0.75rem', color: isChecked ? '#34d399' : 'var(--accent-ochre)', fontWeight: 700, letterSpacing: '0.04em', textTransform: 'uppercase', marginBottom: '0.15rem' }}>
                      {item.category}
                    </div>
                    <h3 style={{ fontSize: '1.05rem', margin: '0 0 0.35rem 0', fontWeight: 600 }}>{item.title}</h3>
                    <p style={{ margin: 0, fontSize: '0.88rem', color: 'var(--text-secondary)', lineHeight: 1.4 }}>{item.description}</p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Tab Content 2: Template Library & Custom Text Editor */}
      {subTab === 'templates' && (
        <div className="section-card">
          <h2 style={{ fontFamily: 'Space Grotesk', fontSize: '1.4rem', marginBottom: '0.5rem' }}>Narrative Proposal & Cover Letter Builder</h2>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.92rem', marginBottom: '2rem' }}>
            Select a template structure, fill in custom placeholders on the left panel, watch the text generate, and tweak the final draft inside the editable rich-text board on the right.
          </p>

          <div className="template-editor-grid">
            {/* Left Parameters Controller */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
              <div>
                <label className="form-label" style={{ marginBottom: '0.5rem', display: 'block' }}>Choose Narrative Structure</label>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                  {grantTemplates.map(t => (
                    <button
                      key={t.id}
                      onClick={() => {
                        setSelectedTemplateId(t.id);
                        setPlaceholderVals(autoPopulatePlaceholders(t.id, selectedFundingSource, connectedArtist)); 
                        setCustomText(null); // Reset manual edits
                      }}
                      style={{
                        padding: '0.75rem 1rem',
                        borderRadius: '8px',
                        background: selectedTemplateId === t.id ? 'rgba(167, 139, 250, 0.12)' : 'rgba(255,255,255,0.02)',
                        border: `1px solid ${selectedTemplateId === t.id ? 'var(--accent-lavender)' : 'var(--border-subtle)'}`,
                        color: selectedTemplateId === t.id ? 'var(--accent-lavender)' : 'var(--text-secondary)',
                        textAlign: 'left',
                        cursor: 'pointer',
                        fontFamily: 'inherit',
                        transition: 'all 0.2s ease'
                      }}
                    >
                      <div style={{ fontWeight: 700, fontSize: '0.9rem' }}>{t.title}</div>
                      <div style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', marginTop: '0.15rem', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                        {t.description}
                      </div>
                    </button>
                  ))}
                </div>
              </div>

              {/* Dynamic Placeholder Inputs */}
              <div>
                <h4 style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.04em', borderBottom: '1px solid var(--border-subtle)', paddingBottom: '0.5rem', marginBottom: '1rem' }}>
                  Fill Placeholders
                </h4>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                  {currentTemplate.placeholders.map(ph => (
                    <div key={ph}>
                      <label style={{ fontSize: '0.78rem', color: 'var(--accent-ochre)', fontWeight: 600, display: 'block', marginBottom: '0.35rem' }}>
                        {ph.replace('[', '').replace(']', '')}
                      </label>
                      <input
                        type="text"
                        placeholder={`Enter ${ph.toLowerCase()}...`}
                        value={placeholderVals[ph] || ''}
                        onChange={(e) => handlePlaceholderChange(ph, e.target.value)}
                        style={{
                          width: '100%',
                          background: 'rgba(0,0,0,0.3)',
                          border: '1px solid var(--border-subtle)',
                          borderRadius: '6px',
                          padding: '0.5rem 0.75rem',
                          color: '#fff',
                          fontFamily: 'inherit',
                          fontSize: '0.85rem'
                        }}
                      />
                    </div>
                  ))}
                </div>
              </div>

              {/* Portfolio & Reference Attachments */}
              <div style={{ borderTop: '1px solid var(--border-subtle)', paddingTop: '1.5rem' }}>
                <h4 style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.04em', borderBottom: '1px solid var(--border-subtle)', paddingBottom: '0.5rem', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                  <span className="material-symbols-outlined" style={{ fontSize: '1rem', color: 'var(--accent-ochre)' }}>link</span>
                  Portfolio Links
                </h4>
                
                <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1rem' }}>
                  <input
                    type="text"
                    placeholder="https://myportfolio.com/artwork..."
                    value={newLink}
                    onChange={(e) => setNewLink(e.target.value)}
                    style={{
                      flex: 1,
                      background: 'rgba(0,0,0,0.3)',
                      border: '1px solid var(--border-subtle)',
                      borderRadius: '6px',
                      padding: '0.5rem 0.75rem',
                      color: '#fff',
                      fontFamily: 'inherit',
                      fontSize: '0.85rem'
                    }}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        if (newLink.trim()) {
                          addPortfolioLink(newLink.trim());
                          setNewLink('');
                        }
                      }
                    }}
                  />
                  <button
                    type="button"
                    onClick={() => {
                      if (newLink.trim()) {
                        addPortfolioLink(newLink.trim());
                        setNewLink('');
                      }
                    }}
                    style={{
                      background: 'rgba(224, 90, 71, 0.15)',
                      border: '1px solid var(--accent-terracotta)',
                      color: 'var(--accent-terracotta)',
                      borderRadius: '6px',
                      padding: '0.5rem 0.75rem',
                      fontSize: '0.8rem',
                      fontWeight: 600,
                      cursor: 'pointer',
                      transition: 'all 0.2s ease'
                    }}
                  >
                    + Add
                  </button>
                </div>

                {portfolioLinks.length > 0 && (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', marginBottom: '1.5rem' }}>
                    {portfolioLinks.map((link, idx) => (
                      <div key={idx} style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        background: 'rgba(255, 255, 255, 0.02)',
                        border: '1px solid var(--border-subtle)',
                        borderRadius: '6px',
                        padding: '0.4rem 0.6rem',
                        fontSize: '0.8rem'
                      }}>
                        <span style={{ color: 'var(--accent-electric)', textOverflow: 'ellipsis', overflow: 'hidden', whiteSpace: 'nowrap', maxWidth: '200px' }}>
                          {link}
                        </span>
                        <button
                          type="button"
                          onClick={() => removePortfolioLink(idx)}
                          style={{ background: 'none', border: 'none', color: '#ff6b7a', cursor: 'pointer', display: 'flex', alignItems: 'center' }}
                          title="Remove link"
                        >
                          <span className="material-symbols-outlined" style={{ fontSize: '1rem' }}>close</span>
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Image Upload Dropzone */}
              <div style={{ borderTop: '1px solid var(--border-subtle)', paddingTop: '1.5rem' }}>
                <h4 style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.04em', borderBottom: '1px solid var(--border-subtle)', paddingBottom: '0.5rem', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                  <span className="material-symbols-outlined" style={{ fontSize: '1rem', color: 'var(--accent-ochre)' }}>image</span>
                  Previous Works (Max 5)
                </h4>

                <label 
                  style={{
                    border: '1px dashed var(--accent-terracotta)',
                    background: 'rgba(255, 255, 255, 0.01)',
                    borderRadius: '8px',
                    padding: '1.25rem',
                    textAlign: 'center',
                    cursor: 'pointer',
                    transition: 'all 0.2s ease',
                    position: 'relative',
                    display: 'block'
                  }}
                  onDragOver={(e) => e.preventDefault()}
                  onDrop={(e) => {
                    e.preventDefault();
                    const dt = e.dataTransfer;
                    if (dt.files && dt.files.length) {
                      handleImageUpload({ target: { files: dt.files } });
                    }
                  }}
                >
                  <input
                    id="portfolio-file-input"
                    type="file"
                    multiple
                    accept="image/jpeg,image/png,image/webp"
                    onChange={handleImageUpload}
                    style={{ display: 'none' }}
                  />
                  <span className="material-symbols-outlined" style={{ fontSize: '2rem', color: 'var(--accent-terracotta)', marginBottom: '0.5rem' }}>
                    cloud_upload
                  </span>
                  <div style={{ fontSize: '0.8rem', color: '#fff', fontWeight: 600 }}>
                    Click or Drag to Upload Images
                  </div>
                  <div style={{ fontSize: '0.7rem', color: 'var(--text-secondary)', marginTop: '0.25rem' }}>
                    Supports PNG, JPG, WEBP (Max 8MB per file, limit 5)
                  </div>
                </label>

                {uploadError && (
                  <div style={{ 
                    marginTop: '0.5rem', 
                    color: '#ff6b7a', 
                    fontSize: '0.78rem', 
                    display: 'flex', 
                    alignItems: 'center', 
                    gap: '0.25rem',
                    background: 'rgba(255, 107, 122, 0.08)',
                    padding: '0.4rem 0.6rem',
                    borderRadius: '6px',
                    border: '1px solid rgba(255, 107, 122, 0.2)'
                  }}>
                    <span className="material-symbols-outlined" style={{ fontSize: '0.9rem' }}>error</span>
                    {uploadError}
                  </div>
                )}
                
                {uploadedImages.length > 0 && (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem', marginTop: '0.75rem' }}>
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', fontWeight: 600, display: 'flex', justifyContent: 'space-between' }}>
                      <span>Uploaded Samples ({uploadedImages.length}/5):</span>
                      <span style={{ color: 'var(--accent-ochre)' }}>
                        {(uploadedImages.reduce((sum, img) => sum + img.size, 0) / (1024 * 1024)).toFixed(2)} MB total
                      </span>
                    </div>
                    
                    {uploadedImages.map((img, idx) => (
                      <div key={idx} style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        background: 'rgba(255, 255, 255, 0.02)',
                        border: '1px solid var(--border-subtle)',
                        borderRadius: '6px',
                        padding: '0.4rem 0.6rem',
                        fontSize: '0.8rem'
                      }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', overflow: 'hidden', flex: 1, marginRight: '0.5rem' }}>
                          <img 
                            src={img.preview} 
                            alt={img.name} 
                            style={{ width: '24px', height: '24px', borderRadius: '4px', objectFit: 'cover' }} 
                          />
                          <span style={{ textOverflow: 'ellipsis', overflow: 'hidden', whiteSpace: 'nowrap', color: '#fff' }}>
                            {img.name}
                          </span>
                          <span style={{ color: 'var(--text-secondary)', fontSize: '0.7rem', flexShrink: 0 }}>
                            ({(img.size / (1024 * 1024)).toFixed(2)} MB)
                          </span>
                        </div>
                        <button
                          type="button"
                          onClick={() => removeUploadedImage(idx)}
                          style={{ background: 'none', border: 'none', color: '#ff6b7a', cursor: 'pointer', display: 'flex', alignItems: 'center' }}
                          title="Remove image"
                        >
                          <span className="material-symbols-outlined" style={{ fontSize: '1rem' }}>close</span>
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Right Rich Text Workspace */}
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem', flexWrap: 'wrap', gap: '0.5rem' }}>
                <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', fontWeight: 500 }}>
                  ✏️ Live Workspace (Fully Editable)
                </span>
                <div style={{ display: 'flex', gap: '0.5rem' }}>
                  <button
                    onClick={() => {
                      setSelectedTone('academic');
                      setIsAiOpen(true);
                    }}
                    type="button"
                    style={{
                      padding: '0.45rem 1rem',
                      fontSize: '0.8rem',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.35rem',
                      background: 'rgba(235, 176, 91, 0.12)',
                      border: '1px solid var(--accent-ochre)',
                      color: 'var(--accent-ochre)',
                      borderRadius: '8px',
                      fontWeight: 600,
                      cursor: 'pointer',
                      transition: 'all 0.2s cubic-bezier(0.16, 1, 0.3, 1)'
                    }}
                  >
                    <span className="material-symbols-outlined" style={{ fontSize: '1.1rem' }}>
                      auto_awesome
                    </span>
                    AI MML Enhancer
                  </button>
                  <button
                    onClick={copyToClipboard}
                    className="btn-primary"
                    style={{
                      padding: '0.45rem 1rem',
                      fontSize: '0.8rem',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.35rem',
                      background: copySuccess ? 'rgba(52, 211, 153, 0.2)' : 'var(--accent-terracotta)',
                      borderColor: copySuccess ? '#34d399' : 'var(--accent-terracotta)',
                      color: copySuccess ? '#34d399' : '#fff'
                    }}
                  >
                    <span className="material-symbols-outlined" style={{ fontSize: '1rem' }}>
                      {copySuccess ? 'check' : 'content_copy'}
                    </span>
                    {copySuccess ? 'Copied!' : 'Copy Narrative'}
                  </button>
                </div>
              </div>

              <textarea
                className="interactive-text-area"
                value={activeText}
                onChange={(e) => setCustomText(e.target.value)}
              />

              {uploadedImages.length > 0 && (
                <div style={{ marginTop: '1.5rem' }}>
                  <h4 style={{ 
                    fontSize: '0.9rem', 
                    fontFamily: 'Space Grotesk', 
                    color: 'var(--text-primary)', 
                    marginBottom: '1rem',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.5rem'
                  }}>
                    <span className="material-symbols-outlined" style={{ color: 'var(--accent-terracotta)', fontSize: '1.2rem' }}>
                      photo_library
                    </span>
                    Attached Image Samples Gallery ({uploadedImages.length}/5)
                  </h4>
                  <div className="attachments-gallery" style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fill, minmax(130px, 1fr))',
                    gap: '1rem'
                  }}>
                    {uploadedImages.map((img, idx) => (
                      <div 
                        key={idx} 
                        className="gallery-thumbnail-card"
                        style={{
                          position: 'relative',
                          borderRadius: '12px',
                          border: '1px solid rgba(255, 255, 255, 0.08)',
                          background: 'rgba(0, 0, 0, 0.5)',
                          backdropFilter: 'blur(8px)',
                          overflow: 'hidden',
                          aspectRatio: '1',
                          boxShadow: '0 4px 20px rgba(0, 0, 0, 0.4), inset 0 0 0 1px rgba(255, 255, 255, 0.05)',
                          cursor: 'pointer',
                          transition: 'all 0.3s cubic-bezier(0.16, 1, 0.3, 1)'
                        }}
                      >
                        <img 
                          src={img.preview} 
                          alt={img.name} 
                          style={{
                            width: '100%',
                            height: '100%',
                            objectFit: 'cover',
                            transition: 'transform 0.4s cubic-bezier(0.16, 1, 0.3, 1)'
                          }}
                          className="gallery-thumbnail-img"
                        />
                        <div 
                          className="gallery-thumbnail-overlay"
                          style={{
                            position: 'absolute',
                            bottom: 0,
                            left: 0,
                            right: 0,
                            background: 'linear-gradient(to top, rgba(0,0,0,0.85) 0%, rgba(0,0,0,0) 100%)',
                            padding: '0.5rem',
                            color: '#fff',
                            fontSize: '0.7rem',
                            display: 'flex',
                            flexDirection: 'column',
                            justifyContent: 'flex-end',
                            opacity: 0.95,
                            transition: 'opacity 0.25s ease'
                          }}
                        >
                          <span style={{ fontWeight: 600, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                            {img.name}
                          </span>
                          <span style={{ color: 'var(--text-secondary)', fontSize: '0.65rem' }}>
                            {(img.size / (1024 * 1024)).toFixed(2)} MB
                          </span>
                        </div>
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            removeUploadedImage(idx);
                          }}
                          style={{
                            position: 'absolute',
                            top: '6px',
                            right: '6px',
                            width: '22px',
                            height: '22px',
                            borderRadius: '50%',
                            background: 'rgba(0,0,0,0.6)',
                            border: '1px solid rgba(255,255,255,0.1)',
                            color: '#ff6b7a',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            cursor: 'pointer',
                            padding: 0,
                            zIndex: 2,
                            boxShadow: '0 2px 8px rgba(0,0,0,0.5)'
                          }}
                          title="Remove file"
                        >
                          <span className="material-symbols-outlined" style={{ fontSize: '0.85rem' }}>close</span>
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Tab Content 3: Budget Calculator */}
      {subTab === 'calculator' && (
        <div className="section-card">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '1rem', marginBottom: '2rem' }}>
            <div>
              <h2 style={{ fontFamily: 'Space Grotesk', fontSize: '1.4rem', marginBottom: '0.5rem' }}>Public Art Cost Allocation Estimator</h2>
              <p style={{ color: 'var(--text-secondary)', fontSize: '0.92rem', margin: 0 }}>
                Analyze structural budgets. Change your overall target budget and fine-tune row items to ensure compliance.
              </p>
            </div>
            
            {/* Target Budget Controller + Clear All */}
            <div style={{ display: 'flex', alignItems: 'flex-end', gap: '1rem', flexWrap: 'wrap' }}>
              <div style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid var(--border-subtle)', borderRadius: '12px', padding: '1rem' }}>
                <label style={{ fontSize: '0.75rem', color: 'var(--accent-ochre)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.04em', display: 'block', marginBottom: '0.35rem' }}>
                  Total Target Grant Budget ($)
                </label>
                <input
                  type="number"
                  className="budget-input"
                  style={{ fontSize: '1.25rem', fontWeight: 700, width: '180px', color: 'var(--accent-ochre)' }}
                  value={targetBudget}
                  onChange={(e) => updateTargetBudget(e.target.value)}
                />
              </div>
              {/* Clear All button */}
              <button
                onClick={() => {
                  if (window.confirm('Clear all line items and reset all costs to $0? This cannot be undone.')) {
                    clearAllBudget();
                  }
                }}
                title="Reset all line items and costs to zero"
                style={{
                  display: 'flex', alignItems: 'center', gap: '0.4rem',
                  background: 'rgba(220,53,69,0.08)',
                  border: '1px solid rgba(220,53,69,0.3)',
                  borderRadius: '10px',
                  padding: '0.65rem 1.1rem',
                  color: '#ff6b7a',
                  fontSize: '0.82rem',
                  fontWeight: 700,
                  cursor: 'pointer',
                  fontFamily: 'inherit',
                  transition: 'all 0.2s ease',
                  whiteSpace: 'nowrap',
                  letterSpacing: '0.02em',
                }}
              >
                <span className="material-symbols-outlined" style={{ fontSize: '1rem' }}>restart_alt</span>
                Clear All / Start Fresh
              </button>
            </div>
          </div>

          {/* Budget Health Indicators */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
            gap: '1rem',
            marginBottom: '2rem'
          }}>
            <div style={{ background: 'rgba(0,0,0,0.2)', border: '1px solid var(--border-subtle)', borderRadius: '10px', padding: '1rem' }}>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', textTransform: 'uppercase' }}>Current Total Cost</div>
              <div style={{ fontSize: '1.4rem', fontWeight: 700, color: '#fff', marginTop: '0.2rem' }}>
                ${currentTotal.toLocaleString()}
              </div>
            </div>
            
            <div style={{ 
              background: 'rgba(0,0,0,0.2)', 
              border: `1px solid ${remainingBudget < 0 ? 'rgba(220,53,69,0.3)' : 'var(--border-subtle)'}`, 
              borderRadius: '10px', 
              padding: '1rem' 
            }}>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', textTransform: 'uppercase' }}>Remaining / Balance</div>
              <div style={{ 
                fontSize: '1.4rem', 
                fontWeight: 700, 
                color: remainingBudget < 0 ? '#ff6b7a' : remainingBudget === 0 ? '#34d399' : '#34d399', 
                marginTop: '0.2rem' 
              }}>
                ${remainingBudget.toLocaleString()}
                {remainingBudget < 0 && <span style={{ fontSize: '0.75rem', display: 'block', color: '#ff6b7a', fontWeight: 500 }}>Over Budget Limit!</span>}
              </div>
            </div>
          </div>

          {/* Cost Allocation Rows */}
          {budgetRows.map((cat, catIdx) => {
            const currentCatSum = categorySums[catIdx];
            const currentCatPct = targetBudget > 0 ? Math.round((currentCatSum / targetBudget) * 100) : 0;
            const diffPct = currentCatPct - cat.recommendedPct;
            
            // Warnings if category distribution is wildly skewed
            let warningText = '';
            if (Math.abs(diffPct) > 8) {
              warningText = `Allocation is ${currentCatPct}% (Recommended: ~${cat.recommendedPct}%)`;
            }

            return (
              <div key={cat.category} className="budget-card">
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem', borderBottom: '1px solid rgba(255,255,255,0.04)', paddingBottom: '0.5rem' }}>
                  <div>
                    <h3 style={{ fontSize: '1.05rem', margin: 0, fontWeight: 700, color: 'var(--accent-lavender)' }}>{cat.category}</h3>
                    <p style={{ margin: '0.15rem 0 0 0', fontSize: '0.78rem', color: 'var(--text-secondary)' }}>
                      Industry recommended: <strong style={{ color: '#fff' }}>~{cat.recommendedPct}%</strong>
                    </p>
                  </div>
                  
                  <div style={{ textAlign: 'right' }}>
                    <span style={{ fontSize: '1.15rem', fontWeight: 700, color: warningText ? '#ffab40' : '#34d399' }}>
                      ${currentCatSum.toLocaleString()}
                    </span>
                    <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginLeft: '0.5rem' }}>
                      ({currentCatPct}%)
                    </span>
                    {warningText && (
                      <span style={{ display: 'block', fontSize: '0.7rem', color: '#ffab40', fontWeight: 600 }}>
                        ⚠️ Deviates from norm
                      </span>
                    )}
                  </div>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                  {cat.items.map((item, itemIdx) => (
                    <div key={itemIdx} className="budget-row">
                      <input
                        type="text"
                        className="budget-input"
                        value={item.name}
                        onChange={(e) => {
                          const val = e.target.value;
                          setBudgetRows(prev => {
                            const updated = [...prev];
                            updated[catIdx].items[itemIdx].name = val;
                            return updated;
                          });
                        }}
                      />
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                        <span style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>$</span>
                        <input
                          type="number"
                          className="budget-input"
                          style={{ textAlign: 'right' }}
                          value={item.cost}
                          onChange={(e) => handleItemCostChange(catIdx, itemIdx, e.target.value)}
                        />
                      </div>
                      <button
                        onClick={() => removeBudgetItem(catIdx, itemIdx)}
                        style={{
                          background: 'none', border: 'none', color: '#888', cursor: 'pointer',
                          display: 'flex', alignItems: 'center', justifyContent: 'center'
                        }}
                        title="Delete line item"
                      >
                        <span className="material-symbols-outlined" style={{ fontSize: '1.1rem' }}>delete</span>
                      </button>
                    </div>
                  ))}
                </div>

                {/* Add Line Item — dropdown with curated presets */}
                <div style={{ position: 'relative', marginTop: '1rem' }}>
                  <button
                    onClick={() => setOpenDropdownCat(openDropdownCat === catIdx ? null : catIdx)}
                    style={{
                      background: 'rgba(74,131,237,0.08)',
                      border: '1px solid rgba(74,131,237,0.3)',
                      color: 'var(--accent-electric)',
                      cursor: 'pointer',
                      fontSize: '0.82rem',
                      fontWeight: 700,
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.35rem',
                      padding: '0.55rem 1rem',
                      borderRadius: '9px',
                      fontFamily: 'inherit',
                      transition: 'all 0.2s ease',
                      letterSpacing: '0.02em',
                    }}
                  >
                    <span className="material-symbols-outlined" style={{ fontSize: '0.95rem' }}>add_circle</span>
                    Add Line Item
                    <span className="material-symbols-outlined" style={{ fontSize: '0.85rem', marginLeft: '0.1rem' }}>
                      {openDropdownCat === catIdx ? 'expand_less' : 'expand_more'}
                    </span>
                  </button>

                  {openDropdownCat === catIdx && (
                    <div
                      style={{
                        position: 'absolute',
                        top: 'calc(100% + 6px)',
                        left: 0,
                        zIndex: 200,
                        background: 'rgba(18,18,22,0.98)',
                        border: '1px solid rgba(74,131,237,0.35)',
                        borderRadius: '12px',
                        boxShadow: '0 16px 40px rgba(0,0,0,0.6)',
                        backdropFilter: 'blur(20px)',
                        minWidth: '260px',
                        maxHeight: '300px',
                        overflowY: 'auto',
                        padding: '0.5rem',
                      }}
                    >
                      {/* Header */}
                      <div style={{
                        fontSize: '0.68rem', color: 'rgba(255,255,255,0.3)',
                        textTransform: 'uppercase', letterSpacing: '0.12em',
                        fontWeight: 700, padding: '0.4rem 0.6rem 0.5rem',
                        borderBottom: '1px solid rgba(255,255,255,0.05)',
                        marginBottom: '0.35rem',
                      }}>
                        {cat.category} — Select Preset
                      </div>

                      {/* Preset options */}
                      {(cat.presets || []).map((preset) => (
                        <button
                          key={preset}
                          onClick={() => addBudgetItem(catIdx, preset)}
                          style={{
                            display: 'block', width: '100%', textAlign: 'left',
                            background: 'none', border: 'none',
                            color: 'rgba(255,255,255,0.75)', fontSize: '0.84rem',
                            padding: '0.5rem 0.75rem', cursor: 'pointer',
                            borderRadius: '7px', fontFamily: 'inherit',
                            transition: 'all 0.15s ease',
                          }}
                          onMouseEnter={e => {
                            e.currentTarget.style.background = 'rgba(74,131,237,0.12)';
                            e.currentTarget.style.color = '#fff';
                          }}
                          onMouseLeave={e => {
                            e.currentTarget.style.background = 'none';
                            e.currentTarget.style.color = 'rgba(255,255,255,0.75)';
                          }}
                        >
                          {preset}
                        </button>
                      ))}

                      {/* Divider + Custom option */}
                      <div style={{ borderTop: '1px solid rgba(255,255,255,0.05)', margin: '0.35rem 0' }} />
                      <button
                        onClick={() => addBudgetItem(catIdx, 'Custom Line Item')}
                        style={{
                          display: 'flex', alignItems: 'center', gap: '0.4rem',
                          width: '100%', textAlign: 'left',
                          background: 'none', border: 'none',
                          color: 'var(--accent-ochre)', fontSize: '0.84rem',
                          padding: '0.5rem 0.75rem', cursor: 'pointer',
                          borderRadius: '7px', fontFamily: 'inherit',
                          fontWeight: 600,
                        }}
                        onMouseEnter={e => e.currentTarget.style.background = 'rgba(235,176,91,0.1)'}
                        onMouseLeave={e => e.currentTarget.style.background = 'none'}
                      >
                        <span className="material-symbols-outlined" style={{ fontSize: '0.9rem' }}>edit</span>
                        Custom / Write-In Item
                      </button>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Tab Content 4: Resource Hub */}
      {subTab === 'resources' && (
        <div className="section-card">
          <h2 style={{ fontFamily: 'Space Grotesk', fontSize: '1.4rem', marginBottom: '0.5rem' }}>Denver Permitting & Technical Resource Hub</h2>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.92rem', marginBottom: '2rem' }}>
            Vetting structural safety, city clearances, material distributors, and engineering networks across Colorado.
          </p>

          {/* Permitting Cost Estimator */}
          <div style={{
            background: 'rgba(255,255,255,0.01)',
            border: '1px solid var(--border-subtle)',
            borderRadius: '14px',
            padding: '1.5rem',
            marginBottom: '2.5rem'
          }}>
            <h3 style={{ fontFamily: 'Space Grotesk', fontSize: '1.15rem', margin: '0 0 1rem 0', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <span className="material-symbols-outlined" style={{ color: 'var(--accent-ochre)' }}>calculate</span>
              Denver Municipal Permit Fee & Safety Estimator
            </h3>
            
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', lineHeight: 1.4, marginBottom: '1.25rem' }}>
              Select a project typology to calculate standard city permit costs, department jurisdictions, and check critical feasibility clearance standards.
            </p>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '1.5rem' }} className="directory-grid-layout">
              {/* Selector Side */}
              <div>
                <label style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.04em', display: 'block', marginBottom: '0.6rem' }}>
                  Project Structure Typology
                </label>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
                  {Object.entries(permitEstimates).map(([key, value]) => (
                    <button
                      key={key}
                      onClick={() => setProjType(key)}
                      className={`project-type-btn ${projType === key ? 'active' : ''}`}
                      style={{
                        background: projType === key ? 'rgba(235, 176, 91, 0.08)' : 'rgba(255,255,255,0.02)',
                        border: `1px solid ${projType === key ? 'var(--accent-ochre)' : 'var(--border-subtle)'}`,
                        borderRadius: '10px',
                        padding: '0.75rem 1rem',
                        color: projType === key ? '#fff' : 'var(--text-secondary)',
                        textAlign: 'left',
                        cursor: 'pointer',
                        fontFamily: 'inherit',
                        transition: 'all 0.2s ease',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between'
                      }}
                    >
                      <span style={{ fontSize: '0.88rem', fontWeight: 700 }}>{value.title}</span>
                      <span className="material-symbols-outlined" style={{ fontSize: '1.1rem', color: projType === key ? 'var(--accent-ochre)' : 'var(--text-secondary)' }}>
                        {projType === key ? 'radio_button_checked' : 'radio_button_unchecked'}
                      </span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Estimate Calculation Results */}
              <div style={{
                background: 'rgba(0,0,0,0.3)',
                border: '1px solid var(--border-subtle)',
                borderRadius: '12px',
                padding: '1.25rem',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between'
              }}>
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', borderBottom: '1px solid rgba(255,255,255,0.06)', paddingBottom: '0.75rem', marginBottom: '1rem' }}>
                    <div>
                      <div style={{ fontSize: '0.72rem', color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>Jurisdiction Agency</div>
                      <div style={{ fontSize: '0.82rem', fontWeight: 700, color: '#fff', marginTop: '0.15rem' }}>
                        {permitEstimates[projType].agency}
                      </div>
                    </div>
                    <div style={{ textAlign: 'right' }}>
                      <div style={{ fontSize: '0.72rem', color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>Est. Permit Fee</div>
                      <div style={{ fontSize: '1.5rem', fontWeight: 800, color: 'var(--accent-ochre)', marginTop: '0.1rem' }}>
                        ${permitEstimates[projType].fee.toLocaleString()}
                      </div>
                    </div>
                  </div>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', marginBottom: '1.25rem' }}>
                    <div style={{ fontSize: '0.72rem', color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.04em', fontWeight: 600 }}>
                      Required Technical Clearances
                    </div>
                    {permitEstimates[projType].clearances.map((c, idx) => (
                      <div key={idx} style={{ display: 'flex', alignItems: 'flex-start', gap: '0.4rem', fontSize: '0.78rem', color: 'var(--text-secondary)', lineHeight: 1.35 }}>
                        <span className="material-symbols-outlined" style={{ color: 'var(--accent-ochre)', fontSize: '0.95rem', marginTop: '0.1rem' }}>check_circle</span>
                        <span>{c}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Recommended resource links */}
                <div style={{ borderTop: '1px solid rgba(255,255,255,0.06)', paddingTop: '0.75rem' }}>
                  <div style={{ fontSize: '0.72rem', color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.04em', marginBottom: '0.5rem', fontWeight: 600 }}>
                    Recommended Partners & Vetted Entities
                  </div>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.4rem' }}>
                    {permitEstimates[projType].resources.map(resId => {
                      const res = mergedDirectory.find(r => r.id === resId);
                      if (!res) return null;
                      return (
                        <button
                          key={resId}
                          onClick={() => highlightResource(resId)}
                          style={{
                            background: 'rgba(255, 255, 255, 0.03)',
                            border: '1px solid var(--border-subtle)',
                            borderRadius: '20px',
                            padding: '0.35rem 0.75rem',
                            color: 'var(--text-primary)',
                            fontSize: '0.72rem',
                            fontWeight: 600,
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '0.25rem',
                            transition: 'all 0.2s ease',
                            fontFamily: 'inherit'
                          }}
                        >
                          <span className="material-symbols-outlined" style={{ fontSize: '0.85rem', color: 'var(--accent-ochre)' }}>
                            {res.category === 'Permits' ? 'gavel' : res.category === 'Engineering' ? 'construction' : 'shopping_bag'}
                          </span>
                          {res.name.split(' (')[0]}
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Vetted Search Directory */}
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem', marginBottom: '1.25rem' }}>
              <h3 style={{ fontFamily: 'Space Grotesk', fontSize: '1.15rem', margin: 0 }}>
                🔍 Colorado Public Art Vetted Directory
              </h3>
              
              {/* Filter Pills */}
              <div style={{ display: 'flex', gap: '0.4rem', flexWrap: 'wrap' }}>
                {['All', 'Permits', 'Engineering', 'Supplies'].map(filterName => (
                  <button
                    key={filterName}
                    onClick={() => setActiveResFilter(filterName)}
                    className={`resource-filter-btn ${activeResFilter === filterName ? 'active' : ''}`}
                    style={{
                      background: activeResFilter === filterName ? 'rgba(74, 131, 237, 0.12)' : 'rgba(255,255,255,0.02)',
                      border: `1px solid ${activeResFilter === filterName ? 'var(--accent-electric)' : 'var(--border-subtle)'}`,
                      borderRadius: '8px',
                      padding: '0.4rem 0.85rem',
                      color: activeResFilter === filterName ? '#fff' : 'var(--text-secondary)',
                      fontSize: '0.78rem',
                      fontWeight: 600,
                      cursor: 'pointer',
                      fontFamily: 'inherit'
                    }}
                  >
                    {filterName}
                  </button>
                ))}
              </div>
            </div>

            {/* Search Input Bar */}
            <div style={{ position: 'relative', marginBottom: '1.5rem' }}>
              <span className="material-symbols-outlined" style={{
                position: 'absolute',
                left: '12px',
                top: '50%',
                transform: 'translateY(-50%)',
                color: 'var(--text-secondary)',
                fontSize: '1.2rem',
                pointerEvents: 'none'
              }}>
                search
              </span>
              <input
                type="text"
                placeholder="Search municipal offices, PE engineers, steel cutters, paint suppliers..."
                value={resSearchQuery}
                onChange={(e) => setResSearchQuery(e.target.value)}
                style={{
                  width: '100%',
                  background: 'rgba(0, 0, 0, 0.3)',
                  border: '1px solid var(--border-subtle)',
                  borderRadius: '10px',
                  padding: '0.65rem 1rem 0.65rem 2.5rem',
                  color: '#fff',
                  fontFamily: 'inherit',
                  fontSize: '0.88rem'
                }}
              />
              {resSearchQuery && (
                <button
                  onClick={() => setResSearchQuery('')}
                  style={{
                    position: 'absolute',
                    right: '12px',
                    top: '50%',
                    transform: 'translateY(-50%)',
                    background: 'none',
                    border: 'none',
                    color: 'var(--text-secondary)',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center'
                  }}
                >
                  <span className="material-symbols-outlined" style={{ fontSize: '1rem' }}>clear</span>
                </button>
              )}
            </div>

            {/* Grid directory matching search and filters */}
            {filteredDirectory.length === 0 ? (
              <div style={{
                textAlign: 'center',
                padding: '3rem 1.5rem',
                border: '1px dashed var(--border-subtle)',
                borderRadius: '12px',
                color: 'var(--text-secondary)'
              }}>
                <span className="material-symbols-outlined" style={{ fontSize: '2.5rem', marginBottom: '0.75rem' }}>search_off</span>
                <div style={{ fontSize: '0.9rem', fontWeight: 600 }}>No matching vetted Denver entities found</div>
                <div style={{ fontSize: '0.8rem', marginTop: '0.2rem' }}>Try clearing filters or queries.</div>
              </div>
            ) : (
              <div className="resource-grid" style={{ gridTemplateColumns: '1fr' }} id="directory-grid-container">
                {filteredDirectory.map((res) => {
                  const isHighlighted = highlightedResId === res.id;
                  
                  // Category badge details
                  let badgeBg = 'rgba(255, 255, 255, 0.05)';
                  let badgeBorder = 'rgba(255, 255, 255, 0.1)';
                  let badgeText = 'var(--text-secondary)';
                  if (res.category === 'Permits') {
                    badgeBg = 'rgba(224, 90, 71, 0.08)';
                    badgeBorder = 'rgba(224, 90, 71, 0.2)';
                    badgeText = 'var(--accent-terracotta)';
                  } else if (res.category === 'Engineering') {
                    badgeBg = 'rgba(167, 139, 250, 0.08)';
                    badgeBorder = 'rgba(167, 139, 250, 0.2)';
                    badgeText = 'var(--accent-lavender)';
                  } else if (res.category === 'Supplies') {
                    badgeBg = 'rgba(235, 176, 91, 0.08)';
                    badgeBorder = 'rgba(235, 176, 91, 0.2)';
                    badgeText = 'var(--accent-ochre)';
                  }

                  return (
                    <div 
                      key={res.id} 
                      id={`resource-card-${res.id}`}
                      className={`resource-card ${isHighlighted ? 'highlighted-resource-card' : ''}`}
                      style={{
                        padding: '1.25rem',
                        borderRadius: '12px',
                        background: 'rgba(255, 255, 255, 0.01)',
                        border: '1px solid rgba(255, 255, 255, 0.05)',
                        transition: 'all 0.3s cubic-bezier(0.16, 1, 0.3, 1)',
                        display: 'flex',
                        flexDirection: 'column',
                        justifyContent: 'space-between',
                        gap: '1rem',
                        scrollMargin: '20px'
                      }}
                    >
                      <div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '1rem' }}>
                          <h4 style={{ margin: 0, fontWeight: 700, color: '#fff', fontSize: '1.05rem', fontFamily: 'Space Grotesk' }}>
                            {res.name}
                          </h4>
                          <span style={{
                            fontSize: '0.68rem',
                            fontWeight: 700,
                            letterSpacing: '0.04em',
                            textTransform: 'uppercase',
                            background: badgeBg,
                            border: `1px solid ${badgeBorder}`,
                            color: badgeText,
                            padding: '0.2rem 0.5rem',
                            borderRadius: '4px',
                            flexShrink: 0
                          }}>
                            {res.category}
                          </span>
                        </div>

                        <div style={{ fontSize: '0.78rem', color: 'var(--accent-ochre)', fontWeight: 600, marginTop: '0.25rem' }}>
                          {res.role}
                        </div>
                        <p style={{ margin: '0.65rem 0 0 0', fontSize: '0.85rem', color: 'var(--text-secondary)', lineHeight: 1.45 }}>
                          {res.description}
                        </p>
                      </div>

                      <div style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        fontSize: '0.78rem',
                        borderTop: '1px solid rgba(255, 255, 255, 0.04)',
                        paddingTop: '0.65rem',
                        flexWrap: 'wrap',
                        gap: '0.5rem'
                      }}>
                        <span style={{ color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                          <span className="material-symbols-outlined" style={{ fontSize: '0.9rem' }}>location_on</span>
                          {res.contact}
                        </span>
                        
                        <a 
                          href={res.link.startsWith('http') ? res.link : `https://${res.link}`}
                          target="_blank" 
                          rel="noopener noreferrer"
                          className="resource-link"
                          style={{
                            color: 'var(--accent-electric)',
                            textDecoration: 'none',
                            fontWeight: 600,
                            display: 'flex',
                            alignItems: 'center',
                            gap: '0.25rem'
                          }}
                        >
                          Visit Portal
                          <span className="material-symbols-outlined" style={{ fontSize: '0.85rem' }}>open_in_new</span>
                        </a>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      )}

      {/* AI MML Tone Enhancer Modal Overlay */}
      {isAiOpen && (
        <div className="ai-modal-overlay">
          <div className="ai-modal-content">
            {/* Scanner line element */}
            {isAiProcessing && <div className="ai-scanner-line" />}
            
            {/* Header */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', borderBottom: '1px solid rgba(255,255,255,0.08)', paddingBottom: '0.75rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <span className="material-symbols-outlined" style={{ color: 'var(--accent-ochre)', fontSize: '1.6rem' }}>
                  auto_awesome
                </span>
                <h3 style={{ margin: 0, fontFamily: 'Space Grotesk', fontSize: '1.25rem', fontWeight: 700 }}>
                  {isAiProcessing ? 'MML Scanner Active' : 'AI MML Tone Enhancer'}
                </h3>
              </div>
              {!isAiProcessing && (
                <button
                  onClick={() => setIsAiOpen(false)}
                  style={{ background: 'none', border: 'none', color: '#ff6b7a', cursor: 'pointer', display: 'flex', alignItems: 'center' }}
                >
                  <span className="material-symbols-outlined" style={{ fontSize: '1.4rem' }}>close</span>
                </button>
              )}
            </div>

            {/* Modal Body */}
            {isAiProcessing ? (
              <div className="ai-loader-container">
                <span className="material-symbols-outlined ai-processing-spark" style={{ fontSize: '3rem', color: 'var(--accent-ochre)', marginBottom: '1.5rem' }}>
                  settings_suggest
                </span>
                <div style={{ fontSize: '1.05rem', fontWeight: 600, color: '#fff', marginBottom: '1.5rem', textAlign: 'center' }}>
                  Re-synthesizing Proposal Copy...
                </div>
                
                {/* Steps Checklist */}
                <div style={{ width: '100%', maxWidth: '380px', display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
                  {[
                    "Parsing artist parameters & custom variables...",
                    "Analyzing municipal permit requirements & structural guidelines...",
                    "Aligning narrative statement with curated tone register...",
                    "Synthesizing customized copy & polishing layout syntax..."
                  ].map((stepText, idx) => {
                    const isDone = aiProgressStep > idx;
                    const isActive = aiProgressStep === idx;
                    return (
                      <div key={idx} style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.75rem',
                        padding: '0.6rem 0.85rem',
                        borderRadius: '8px',
                        background: isActive ? 'rgba(235, 176, 91, 0.05)' : 'transparent',
                        border: isActive ? '1px solid rgba(235, 176, 91, 0.15)' : '1px solid transparent',
                        opacity: isDone ? 1 : isActive ? 1 : 0.4,
                        transition: 'all 0.3s ease'
                      }}>
                        {isDone ? (
                          <span className="material-symbols-outlined" style={{ color: '#34d399', fontSize: '1.2rem' }}>task_alt</span>
                        ) : isActive ? (
                          <div className="ai-spinner-small" />
                        ) : (
                          <span className="material-symbols-outlined" style={{ color: 'var(--text-secondary)', fontSize: '1.2rem' }}>circle</span>
                        )}
                        <span style={{ 
                          fontSize: '0.85rem', 
                          fontWeight: isActive ? 600 : 500, 
                          color: isDone ? '#34d399' : isActive ? 'var(--accent-ochre)' : 'var(--text-secondary)'
                        }}>
                          {stepText}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>
            ) : (
              <div>
                <p style={{ color: 'var(--text-secondary)', fontSize: '0.88rem', lineHeight: 1.5, marginBottom: '1.5rem' }}>
                  Adapt your cover letter or statement using curatorial registers aligned with public art guidelines. This will transform placeholders and manual edits instantly.
                </p>

                {/* Register Cards Grid */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '0.85rem', marginBottom: '2rem', maxHeight: '320px', overflowY: 'auto', paddingRight: '0.25rem' }}>
                  {[
                    { id: 'academic', title: 'Academic Curatorial Register', icon: 'history_edu', color: 'var(--accent-lavender)', tagline: 'Art-historical and theoretical precision.' },
                    { id: 'community', title: 'Community & Equity Register', icon: 'diversity_1', color: '#34d399', tagline: 'Amplifying neighborhood voices and equity.' },
                    { id: 'eco', title: 'Eco-Conscious & Sustainable Register', icon: 'forest', color: '#10b981', tagline: 'Highlighting green materials and footprints.' },
                    { id: 'street', title: 'Vibrant Mural & Street Art Register', icon: 'palette', color: 'var(--accent-terracotta)', tagline: 'Bold graphic impacts for urban corridors.' }
                  ].map(tone => (
                    <div 
                      key={tone.id}
                      className={`ai-tone-card ${selectedTone === tone.id ? 'active' : ''}`}
                      onClick={() => setSelectedTone(tone.id)}
                    >
                      <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'flex-start' }}>
                        <span className="material-symbols-outlined" style={{ color: tone.color, fontSize: '1.4rem', marginTop: '0.1rem' }}>
                          {tone.icon}
                        </span>
                        <div>
                          <h4 style={{ margin: 0, fontSize: '0.92rem', fontWeight: 700, color: '#fff' }}>
                            {tone.title}
                          </h4>
                          <p style={{ margin: '0.15rem 0 0 0', fontSize: '0.78rem', color: 'var(--text-secondary)', lineHeight: 1.3 }}>
                            {tone.tagline}
                          </p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Footer Buttons */}
                <div style={{ display: 'flex', gap: '1rem', justifyContent: 'flex-end', borderTop: '1px solid rgba(255,255,255,0.08)', paddingTop: '1.25rem' }}>
                  <button
                    onClick={() => setIsAiOpen(false)}
                    style={{
                      background: 'rgba(255, 255, 255, 0.03)',
                      border: '1px solid var(--border-subtle)',
                      borderRadius: '8px',
                      padding: '0.6rem 1.2rem',
                      color: 'var(--text-secondary)',
                      fontFamily: 'inherit',
                      fontWeight: 600,
                      cursor: 'pointer',
                      fontSize: '0.85rem'
                    }}
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleEnhance}
                    style={{
                      background: 'var(--accent-ochre)',
                      border: 'none',
                      borderRadius: '8px',
                      padding: '0.6rem 1.25rem',
                      color: '#0f172a',
                      fontFamily: 'inherit',
                      fontWeight: 700,
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.4rem',
                      fontSize: '0.85rem'
                    }}
                  >
                    <span className="material-symbols-outlined" style={{ fontSize: '1.1rem' }}>auto_awesome</span>
                    Enhance Draft
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
