import { useState, useMemo, useEffect, useRef } from 'react';

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

// Latitudes and Longitudes of key locations in Colorado
const COLORADO_CITIES = [
  { name: 'Denver', lat: 39.7392, lon: -104.9903, hasZoom: true },
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

// Curated Suppliers and Fabrication Hubs (Denver and regional)
const LOCAL_SUPPLIERS = [
  {
    id: 's1',
    name: "Guiry's Color Source",
    type: 'Supplies',
    category: 'Paint & Artist Supplies',
    lat: 39.7310,
    lon: -104.9960,
    description: 'Premier regional depot for heavy-duty industrial coatings, outdoor spray pigments, and mural sealants.',
    address: '845 Santa Fe Dr, Denver'
  },
  {
    id: 's2',
    name: 'Alreco Metals',
    type: 'Supplies',
    category: 'Steel & Aluminum Raw Materials',
    lat: 39.8828,
    lon: -104.8694,
    description: 'Industrial metal scrap and structural plate distributor. Ideal for steel structural armature fabrication.',
    address: '11800 E 120th Ave, Henderson'
  },
  {
    id: 's3',
    name: 'Laird Plastics',
    type: 'Supplies',
    category: 'Acrylics & Composites',
    lat: 39.7520,
    lon: -104.9980,
    description: 'High-performance polymer and plexiglass suppliers. Excellent for weather-proof lighting sculpture elements.',
    address: '5151 Bannock St, Denver'
  },
  {
    id: 's4',
    name: 'Denver Tool Library',
    type: 'Fabrication',
    category: 'Tool Rentals & Community Workshop',
    lat: 39.7250,
    lon: -104.9850,
    description: 'Shared-cost tool access and machinery yard. High-capacity welding bays and woodworking tables.',
    address: '555 Santa Fe Dr, Denver'
  },
  {
    id: 's5',
    name: 'Recreate Fabrication',
    type: 'Fabrication',
    category: 'Welding & Public Art Construction',
    lat: 39.7610,
    lon: -104.9650,
    description: 'Specialist fabricator catering to public artists. High-load crane setups and custom steel footing structures.',
    address: '3501 Brighton Blvd, Denver'
  },
  {
    id: 's6',
    name: 'Sunbelt Rentals',
    type: 'Supplies',
    category: 'Scissor & Boom Lift Rentals',
    lat: 39.7120,
    lon: -105.0120,
    description: 'Heavy equipment logistics and high-elevation scissor lifts. Fully compliant with public safety equipment standards.',
    address: '2550 W 8th Ave, Denver'
  },
  {
    id: 's7',
    name: 'Peak Structural',
    type: 'Engineering',
    category: 'Foundation & Soil Engineering',
    lat: 38.8339,
    lon: -104.8214,
    description: 'Specialized structural concrete footings and structural weight soil metrics. Essential for Southern Colorado armatures.',
    address: 'Colorado Springs Office'
  },
  {
    id: 's8',
    name: 'KL&A Structural Engineers',
    type: 'Engineering',
    category: 'Professional Engineer (P.E.) Stamps',
    lat: 39.7562,
    lon: -105.2211,
    description: 'Nationally recognized structural firm with specialized art armature engineering stamp capabilities.',
    address: '1812 Market St, Golden'
  }
];

// True-to-life de-clustered coordinate offsets for Denver Metro items in zoomed view
const DENVER_LOCAL_COORDS = {
  p1: { lat: 39.7680, lon: -104.9680 }, // RiNo / 303 ArtWay
  p2: { lat: 39.7550, lon: -104.9730 }, // Five Points Box Series
  p3: { lat: 39.7240, lon: -104.9980 }, // Santa Fe Youth Pavement Art
  p9: { lat: 39.7294, lon: -104.8319 }, // Aurora Capital Design
  p10: { lat: 39.7047, lon: -105.0814 }, // Lakewood Art on the Commons
  p14: { lat: 39.7490, lon: -105.0050 }, // Denver Film Festival / LoDo
  f1: { lat: 39.7640, lon: -104.9720 }, // 303 ArtWay PSYAH Grant
  f3: { lat: 39.7525, lon: -104.9790 }, // Five Points District Art Grant
  f4: { lat: 39.7375, lon: -104.9885 }  // Denver Central Library Commission
};

// Bespoke Dark Night Google Map Styles
const MAP_STYLES = [
  { elementType: "geometry", stylers: [{ color: "#0b0c10" }] },
  { elementType: "labels.text.stroke", stylers: [{ color: "#0b0c10" }, { weight: 2 }] },
  { elementType: "labels.text.fill", stylers: [{ color: "#79828e" }] },
  {
    featureType: "administrative.locality",
    elementType: "labels.text.fill",
    stylers: [{ color: "#d2d8e1" }],
  },
  {
    featureType: "poi",
    elementType: "labels.text.fill",
    stylers: [{ color: "#a5b0be" }],
  },
  {
    featureType: "poi.park",
    elementType: "geometry",
    stylers: [{ color: "#14171d" }],
  },
  {
    featureType: "poi.park",
    elementType: "labels.text.fill",
    stylers: [{ color: "#5ea582" }],
  },
  {
    featureType: "road",
    elementType: "geometry",
    stylers: [{ color: "#1a1c23" }],
  },
  {
    featureType: "road",
    elementType: "geometry.stroke",
    stylers: [{ color: "#111217" }],
  },
  {
    featureType: "road",
    elementType: "labels.text.fill",
    stylers: [{ color: "#616873" }],
  },
  {
    featureType: "road.highway",
    elementType: "geometry",
    stylers: [{ color: "#252833" }],
  },
  {
    featureType: "road.highway",
    elementType: "geometry.stroke",
    stylers: [{ color: "#171920" }],
  },
  {
    featureType: "road.highway",
    elementType: "labels.text.fill",
    stylers: [{ color: "#c1a58c" }],
  },
  {
    featureType: "transit",
    elementType: "geometry",
    stylers: [{ color: "#14161f" }],
  },
  {
    featureType: "transit.station",
    elementType: "labels.text.fill",
    stylers: [{ color: "#a29285" }],
  },
  {
    featureType: "water",
    elementType: "geometry",
    stylers: [{ color: "#05070a" }],
  },
  {
    featureType: "water",
    elementType: "labels.text.fill",
    stylers: [{ color: "#3a414a" }],
  },
  {
    featureType: "water",
    elementType: "labels.text.stroke",
    stylers: [{ color: "#05070a" }],
  },
];

export default function ProjectMap({ projects, fundingSources, onApplyFunding, onNavigatePipeline, onLocateResource, mapFocusItemId, onClearMapFocus }) {
  const [isDenverZoom, setIsDenverZoom] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeLayer, setActiveLayer] = useState('all'); // all, projects, funding, suppliers
  const [selectedItem, setSelectedItem] = useState(null);
  const [hoveredItem, setHoveredItem] = useState(null);
  const [showCreativeTrail, setShowCreativeTrail] = useState(true);

  // Script loading and Map integration states (Avoid calling setState synchronously inside render/effects)
  const [mapLoaded, setMapLoaded] = useState(() => typeof window !== 'undefined' && !!(window.google && window.google.maps));
  const [loadError, setLoadError] = useState(null);
  const [useVectorMap, setUseVectorMap] = useState(false);

  const mapContainerRef = useRef(null);
  const mapRef = useRef(null);
  const markersRef = useRef({});
  const polylineRef = useRef(null);

  // AI Geospatial insights states
  const [isGeneratingInsights, setIsGeneratingInsights] = useState(false);
  const [aiInsights, setAiInsights] = useState({});

  const handleGenerateMapInsights = async (item) => {
    if (!item) return;
    setIsGeneratingInsights(true);
    try {
      const prompt = `You are a professional Colorado-based public art coordinator. Analyze this map asset and provide unique geospatial and logistical insights:
Name: ${item.name}
Type: ${item.type}
City: ${item.cityName}
Budget: ${item.budget || 'Stipend'}
Description: ${item.description}
Address/Location: ${item.address || 'N/A'}

Formulate a concise 2-3 sentence analysis of logistical opportunities, zoning details (specifically referencing RiNo, Santa Fe art district, or Five Points if applicable to the item location/theme), DOTI easement guidelines, or proximity to local materials suppliers. Keep the tone expert, practical, and highly professional.`;

      const responseText = await callGeminiAPI(prompt, 'You are a geospatial public art logistics consultant. Return a concise 2-3 sentence analysis.');
      setAiInsights(prev => ({ ...prev, [item.id]: responseText }));
    } catch (err) {
      console.warn('[AI Map Insights] Gemini error:', err);
      // Fallback
      const fallbackInsights = `Logistical Analysis for ${item.name}: Located in the ${item.cityName} corridor. Anchoring requires local DOTI easement reviews. Proximity to Denver supplies (like Guiry's Color Source) provides seamless paint and sealer sourcing opportunities.`;
      setAiInsights(prev => ({ ...prev, [item.id]: fallbackInsights }));
    } finally {
      setIsGeneratingInsights(false);
    }
  };

  // Helper check: Is the item within the Denver Metro bounding coordinates?
  const isDenverMetroItem = (item) => {
    const metroCities = ['Denver', 'Aurora', 'Lakewood', 'Golden'];
    if (metroCities.includes(item.cityName)) return true;
    if (item.cityName === 'Denver Metro' || item.cityName === 'Henderson') return true;
    if (item.address && (item.address.includes('Denver') || item.address.includes('Henderson') || item.address.includes('Golden') || item.address.includes('Lakewood') || item.address.includes('Aurora'))) return true;
    return false;
  };

  const isVectorActive = useVectorMap || !mapLoaded || !!loadError;

  // Convert lat/lon coordinates to responsive X/Y percentages for Colorado bounding box (Statewide)
  const getXY = (lat, lon) => {
    const minLat = 36.9924;
    const maxLat = 41.0024;
    const minLon = -109.0603;
    const maxLon = -102.0415;
    const x = ((lon - minLon) / (maxLon - minLon)) * 100;
    const y = ((maxLat - lat) / (maxLat - minLat)) * 100;
    return { x: Math.max(5, Math.min(95, x)), y: Math.max(5, Math.min(95, y)) };
  };

  // Convert lat/lon coordinates to responsive X/Y percentages for Denver Metro bounding box (Local Zoom)
  const getDenverXY = (lat, lon) => {
    const minLat = 39.68;
    const maxLat = 39.80;
    const minLon = -105.12;
    const maxLon = -104.80;
    const x = ((lon - minLon) / (maxLon - minLon)) * 100;
    const y = ((maxLat - lat) / (maxLat - minLat)) * 100;
    return { x: Math.max(8, Math.min(92, x)), y: Math.max(8, Math.min(92, y)) };
  };

  // Auto-switch to vector fallback map if Google Maps tag is slow / blocked (after 2.5 seconds)
  useEffect(() => {
    if (mapLoaded) return;
    const timer = setTimeout(() => {
      if (!mapLoaded) {
        setUseVectorMap(true);
      }
    }, 2500);
    return () => clearTimeout(timer);
  }, [mapLoaded]);

  // Compile all interactive map elements into a unified database list
  const mapItems = useMemo(() => {
    const items = [];

    // 1. Projects
    (projects || []).forEach(p => {
      if (!p) return;
      const pName = p.name || '';
      let city = COLORADO_CITIES.find(c => pName.includes(c.name)) || COLORADO_CITIES[0];
      if (pName.includes('Mesa County') || pName.includes('Grand Junction')) {
        city = COLORADO_CITIES.find(c => c.name === 'Grand Junction');
      } else if (pName.includes('Larimer County') || pName.includes('Fort Collins')) {
        city = COLORADO_CITIES.find(c => c.name === 'Fort Collins');
      } else if (pName.includes('Boulder County') || pName.includes('Boulder')) {
        city = COLORADO_CITIES.find(c => c.name === 'Boulder');
      } else if (pName.includes('El Paso County') || pName.includes('Colorado Springs')) {
        city = COLORADO_CITIES.find(c => c.name === 'Colorado Springs');
      } else if (pName.includes('Jefferson County') || pName.includes('Lakewood')) {
        city = COLORADO_CITIES.find(c => c.name === 'Lakewood');
      } else if (pName.includes('San Miguel County') || pName.includes('Telluride')) {
        city = COLORADO_CITIES.find(c => c.name === 'Telluride');
      } else if (pName.includes('Pueblo County') || pName.includes('Pueblo')) {
        city = COLORADO_CITIES.find(c => c.name === 'Pueblo');
      } else if (pName.includes('Arapahoe County') || pName.includes('Aurora')) {
        city = COLORADO_CITIES.find(c => c.name === 'Aurora');
      } else if (pName.includes('Statewide')) {
        city = p.id === 'p15' ? COLORADO_CITIES.find(c => c.name === 'Steamboat Springs') : COLORADO_CITIES[0];
      }

      let lat = city.lat;
      let lon = city.lon;
      
      if (DENVER_LOCAL_COORDS[p.id]) {
        lat = DENVER_LOCAL_COORDS[p.id].lat;
        lon = DENVER_LOCAL_COORDS[p.id].lon;
      }

      items.push({
        id: p.id,
        name: pName,
        type: 'project',
        category: p.status || 'Active',
        lat,
        lon,
        cityName: city.name,
        budget: p.budget || 'Varies',
        funding: p.funding || 'Pending',
        timeline: p.openDate && p.closeDate ? `${p.openDate} to ${p.closeDate}` : 'TBD',
        description: p.description || `Active public art development tracking through ILA Gallery network. Current status is ${(p.status || '').toLowerCase()}.`
      });
    });

    // 2. Funding Opportunities (RFQs)
    (fundingSources || []).forEach(f => {
      if (!f) return;
      const fProvider = f.provider || 'Private Client';
      const fTitle = f.title || 'Opportunity';
      let city = COLORADO_CITIES.find(c => fProvider.includes(c.name)) || COLORADO_CITIES[0];
      if (fProvider.includes('El Paso') || fTitle.includes('Colorado Springs')) {
        city = COLORADO_CITIES.find(c => c.name === 'Colorado Springs');
      } else if (fProvider.includes('Boulder')) {
        city = COLORADO_CITIES.find(c => c.name === 'Boulder');
      } else if (fProvider.includes('Fort Collins') || fProvider.includes('Larimer')) {
        city = COLORADO_CITIES.find(c => c.name === 'Fort Collins');
      } else if (fProvider.includes('Grand Junction') || fProvider.includes('Mesa')) {
        city = COLORADO_CITIES.find(c => c.name === 'Grand Junction');
      } else if (fProvider.includes('Summit') || fTitle.includes('Breck')) {
        city = COLORADO_CITIES.find(c => c.name === 'Breckenridge');
      } else if (fProvider.includes('Arapahoe') || fProvider.includes('Aurora')) {
        city = COLORADO_CITIES.find(c => c.name === 'Aurora');
      } else if (fProvider.includes('Jefferson') || fTitle.includes('Lakewood')) {
        city = COLORADO_CITIES.find(c => c.name === 'Lakewood');
      }

      let lat = f.latitude !== undefined && f.latitude !== null ? parseFloat(f.latitude) : city.lat;
      let lon = f.longitude !== undefined && f.longitude !== null ? parseFloat(f.longitude) : city.lon;
      
      if (DENVER_LOCAL_COORDS[f.id]) {
        lat = DENVER_LOCAL_COORDS[f.id].lat;
        lon = DENVER_LOCAL_COORDS[f.id].lon;
      } else if (f.id === 'f3') {
        lat = 39.7541; lon = -104.9786;
      } else if (f.id === 'f4') {
        lat = 39.7379; lon = -104.9884;
      }

      items.push({
        id: f.id,
        name: fTitle,
        type: 'funding',
        category: f.type || 'RFQ',
        lat,
        lon,
        cityName: city.name,
        budget: f.amount || 'Varies',
        funding: fProvider,
        timeline: f.closeDate ? `Closes ${f.closeDate}` : 'Rolling',
        description: f.description || '',
        url: f.url || '',
        isCommunityPost: !!f.isCommunityPost
      });
    });

    // 3. Local Suppliers
    LOCAL_SUPPLIERS.forEach(s => {
      items.push({
        ...s,
        cityName: COLORADO_CITIES.find(c => c.lat === s.lat && c.lon === s.lon)?.name || 'Denver'
      });
    });

    return items;
  }, [projects, fundingSources]);

  // Filter items based on search query, active layer, and active zoom region
  const filteredItems = useMemo(() => {
    return mapItems.filter(item => {
      const matchesSearch = searchQuery.trim() === '' || 
        item.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
        (item.address && item.address.toLowerCase().includes(searchQuery.toLowerCase())) ||
        item.cityName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.category.toLowerCase().includes(searchQuery.toLowerCase());

      if (!matchesSearch) return false;

      let matchesLayer = true;
      if (activeLayer === 'projects') matchesLayer = item.type === 'project';
      else if (activeLayer === 'funding') matchesLayer = item.type === 'funding';
      else if (activeLayer === 'suppliers') matchesLayer = (item.type === 'Supplies' || item.type === 'Fabrication' || item.type === 'Engineering');

      if (!matchesLayer) return false;

      if (isDenverZoom) {
        return isDenverMetroItem(item);
      }

      return true;
    });
  }, [mapItems, searchQuery, activeLayer, isDenverZoom]);

  // Handle deep linking for opportunities
  const handleApplyOpportunity = (item) => {
    if (item.type === 'funding' && onApplyFunding) {
      const matchingSource = fundingSources?.find(f => f.id === item.id);
      if (matchingSource) {
        onApplyFunding(matchingSource);
      } else {
        const firstPart = item.budget.split('-')[0] || '';
        const cleanAmt = firstPart.replace(/[^0-9]/g, '');
        const parsedNum = parseInt(cleanAmt) || 15000;
        onApplyFunding(parsedNum);
      }
    }
  };

  // Dynamic Google Maps Script Loading — robust loader with callback and watchdog
  useEffect(() => {
    if (mapLoaded) return;

    // Already available (hot-reload / script already ran)
    if (typeof window !== 'undefined' && window.google && window.google.maps) {
      setTimeout(() => setMapLoaded(true), 0);
      return;
    }

    // Script tag exists but hasn't fired yet — poll for the global object
    const existingScript = document.getElementById('google-maps-script');
    if (existingScript) {
      const poll = setInterval(() => {
        if (window.google && window.google.maps) {
          clearInterval(poll);
          clearTimeout(pollTimeout);
          setMapLoaded(true);
        }
      }, 150);
      const pollTimeout = setTimeout(() => {
        clearInterval(poll);
        setLoadError('Google Maps took too long to load. Please refresh.');
      }, 12000);
      return () => { clearInterval(poll); clearTimeout(pollTimeout); };
    }

    // Build URL — use global callback so Maps API calls it when ready
    const rawKey = import.meta.env.VITE_GOOGLE_MAPS_API_KEY || '';
    const apiKey = (rawKey && rawKey !== 'YOUR_API_KEY_HERE' && rawKey.startsWith('AIzaSy')) ? rawKey : '';
    // On localhost, skip the key to avoid RefererNotAllowedMapError from referrer restrictions.
    // The key is always used in production (import.meta.env.PROD = true).
    const isLocalhost = typeof window !== 'undefined' &&
      (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1');
    const keyParam = (apiKey && !isLocalhost) ? `&key=${apiKey}` : '';

    window.__googleMapsReady = () => {
      setMapLoaded(true);
      delete window.__googleMapsReady;
    };

    const script = document.createElement('script');
    script.id = 'google-maps-script';
    script.src = `https://maps.googleapis.com/maps/api/js?v=weekly${keyParam}&libraries=geometry&callback=__googleMapsReady`;
    script.async = true;
    script.defer = true;
    script.onerror = () => setLoadError('Failed to load Google Maps. Please check your internet connection.');

    // Watchdog: if callback never fires within 12 s, check directly
    const watchdog = setTimeout(() => {
      if (window.google && window.google.maps) {
        setMapLoaded(true);
      } else {
        setLoadError('Google Maps failed to initialise. Please refresh the page.');
      }
    }, 12000);

    document.head.appendChild(script);
    return () => clearTimeout(watchdog);
  }, [mapLoaded]);

  // Mount effect to ensure map starts centered on Denver on tab mount
  useEffect(() => {
    if (mapRef.current) {
      mapRef.current.panTo({ lat: 39.7392, lng: -104.9903 });
      mapRef.current.setZoom(12);
    }
    // Start in Denver zoom by default
    const timer = setTimeout(() => {
      setIsDenverZoom(true);
    }, 0);
    return () => clearTimeout(timer);
  }, []);

  // Handle external focus / deep linking from other tabs
  useEffect(() => {
    if (!mapFocusItemId) return;

    const targetItem = mapItems.find(item => item.id === mapFocusItemId);
    if (targetItem) {
      const isDenver = isDenverMetroItem(targetItem);
      setIsDenverZoom(isDenver);
      setSelectedItem(targetItem);

      if (mapLoaded && mapRef.current) {
        mapRef.current.panTo({ lat: targetItem.lat, lng: targetItem.lon });
        mapRef.current.setZoom(isDenver ? 13 : 9);
      }
      
      if (onClearMapFocus) {
        onClearMapFocus();
      }
    }
  }, [mapFocusItemId, mapItems, mapLoaded, onClearMapFocus]);

  // Map Instance Initialization (Added target dependency with mapRef check to safely resolve warning)
  useEffect(() => {
    if (!mapLoaded || !mapContainerRef.current || mapRef.current) return;

    const initialCenter = isDenverZoom 
      ? { lat: 39.7392, lng: -104.9903 } 
      : { lat: 39.0, lng: -105.5 };
    const initialZoom = isDenverZoom ? 12 : 7;

    // Strict boundaries for the State of Colorado
    const coloradoBounds = {
      north: 41.0024,
      south: 36.9924,
      west: -109.0603,
      east: -102.0415
    };

    mapRef.current = new window.google.maps.Map(mapContainerRef.current, {
      center: initialCenter,
      zoom: initialZoom,
      minZoom: 6,
      maxZoom: 16,
      restriction: {
        latLngBounds: coloradoBounds,
        strictBounds: false
      },
      styles: MAP_STYLES,
      disableDefaultUI: true,
      zoomControl: true,
      mapTypeControl: false,
      scaleControl: true,
      streetViewControl: false,
      rotateControl: false,
      fullscreenControl: false,
    });

    // Add map click listener to clear selected item
    mapRef.current.addListener('click', () => {
      setSelectedItem(null);
    });
  }, [mapLoaded, isDenverZoom]);

  // Synchronize map pan & zoom based on Statewide/Denver toggle
  useEffect(() => {
    if (!mapRef.current) return;

    const targetCenter = isDenverZoom 
      ? { lat: 39.7392, lng: -104.9903 } 
      : { lat: 39.0, lng: -105.5 };
    const targetZoom = isDenverZoom ? 12 : 7;

    mapRef.current.panTo(targetCenter);
    mapRef.current.setZoom(targetZoom);
  }, [isDenverZoom]);

  // Re-build markers when active layers, searches or load statuses update
  useEffect(() => {
    if (!mapLoaded || !mapRef.current) return;

    // Clear old markers
    Object.values(markersRef.current).forEach(marker => marker.setMap(null));
    markersRef.current = {};

    filteredItems.forEach(item => {
      let markerColor = '#a78bfa'; // Projects - var(--accent-lavender)
      if (item.type === 'funding') markerColor = '#e05a47'; // Funding - var(--accent-terracotta)
      if (item.type === 'Supplies' || item.type === 'Fabrication' || item.type === 'Engineering') {
        markerColor = '#eba65a'; // Resources - var(--accent-ochre)
      }

      // Custom Glowing Map Pin Path Symbol (Default State)
      const svgMarker = {
        path: "M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z",
        fillColor: markerColor,
        fillOpacity: 0.85,
        strokeWeight: 1,
        strokeColor: '#ffffff',
        scale: 1.05,
        anchor: new window.google.maps.Point(12, 22),
      };

      const marker = new window.google.maps.Marker({
        position: { lat: item.lat, lng: item.lon },
        map: mapRef.current,
        title: item.name,
        icon: svgMarker,
      });

      marker.addListener('click', (e) => {
        if (e && e.stop) e.stop();
        setSelectedItem(item);
        mapRef.current.panTo({ lat: item.lat, lng: item.lon });
      });

      markersRef.current[item.id] = marker;
    });
  }, [mapLoaded, filteredItems]);

  // Manage highlight scale/zIndex of markers on selection and hover dynamically
  useEffect(() => {
    if (!mapLoaded) return;

    filteredItems.forEach(item => {
      const marker = markersRef.current[item.id];
      if (!marker) return;

      const isSelected = selectedItem?.id === item.id;
      const isHovered = hoveredItem?.id === item.id;

      let markerColor = '#a78bfa';
      if (item.type === 'funding') markerColor = '#e05a47';
      if (item.type === 'Supplies' || item.type === 'Fabrication' || item.type === 'Engineering') {
        markerColor = '#eba65a';
      }

      const svgMarker = {
        path: "M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z",
        fillColor: markerColor,
        fillOpacity: (isSelected || isHovered) ? 1.0 : 0.85,
        strokeWeight: (isSelected || isHovered) ? 2.5 : 1,
        strokeColor: '#ffffff',
        scale: (isSelected || isHovered) ? 1.4 : 1.05,
        anchor: new window.google.maps.Point(12, 22),
      };

      marker.setIcon(svgMarker);
      if (isSelected || isHovered) {
        marker.setZIndex(1000);
      } else {
        marker.setZIndex(1);
      }
    });
  }, [mapLoaded, selectedItem, hoveredItem, filteredItems]);

  // Colorado Creative Trail connector polyline layer Statewide
  useEffect(() => {
    if (!mapLoaded || !mapRef.current) return;

    if (polylineRef.current) {
      polylineRef.current.setMap(null);
      polylineRef.current = null;
    }

    if (isDenverZoom || !showCreativeTrail) return;

    const citiesInTrail = [
      'Grand Junction', 'Telluride', 'Steamboat Springs', 'Fort Collins', 
      'Boulder', 'Golden', 'Denver', 'Aurora', 'Lakewood', 'Colorado Springs', 'Pueblo'
    ];
    
    const trailCoordinates = citiesInTrail
      .map(name => COLORADO_CITIES.find(c => c.name === name))
      .filter(Boolean)
      .map(c => ({ lat: c.lat, lng: c.lon }));

    const lineSymbol = {
      path: 'M 0,-1 0,1',
      strokeOpacity: 1,
      scale: 2
    };

    polylineRef.current = new window.google.maps.Polyline({
      path: trailCoordinates,
      strokeColor: '#e05a47', // var(--accent-terracotta)
      strokeOpacity: 0,
      icons: [{
        icon: lineSymbol,
        offset: '0',
        repeat: '15px'
      }],
      map: mapRef.current
    });
  }, [mapLoaded, isDenverZoom, showCreativeTrail]);

  return (
    <div style={{
      display: 'grid',
      gridTemplateColumns: '320px 1fr',
      gap: '1.5rem',
      background: 'var(--bg-panel)',
      border: '1px solid var(--border-subtle)',
      borderRadius: '16px',
      overflow: 'hidden',
      height: '620px',
      boxShadow: '0 8px 32px 0 rgba(0, 0, 0, 0.45)',
      backdropFilter: 'blur(20px)',
      position: 'relative'
    }}>
      <style>{`
        @keyframes pulse {
          0% { transform: scale(0.95); opacity: 0.8; }
          50% { transform: scale(1.15); opacity: 0.4; }
          100% { transform: scale(1.25); opacity: 0; }
        }
        @keyframes slideLeft {
          from { transform: translateX(100%); opacity: 0; }
          to { transform: translateX(0); opacity: 1; }
        }
      `}</style>

      {/* 1. Sidebar Panel */}
      <div style={{
        background: 'rgba(10, 11, 16, 0.45)',
        borderRight: '1px solid var(--border-subtle)',
        display: 'flex',
        flexDirection: 'column',
        height: '100%',
        zIndex: 2
      }}>
        {/* Search Header */}
        <div style={{ padding: '1.25rem', borderBottom: '1px solid rgba(255, 255, 255, 0.05)' }}>
          {/* Zoom Toggle Segment Controls */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: '1fr 1fr',
            background: 'rgba(255, 255, 255, 0.02)',
            border: '1px solid rgba(255, 255, 255, 0.06)',
            borderRadius: '10px',
            padding: '2px',
            marginBottom: '1rem'
          }}>
            <button
              onClick={() => { setIsDenverZoom(false); setSelectedItem(null); }}
              style={{
                background: !isDenverZoom ? 'rgba(255, 255, 255, 0.06)' : 'transparent',
                border: 'none',
                borderRadius: '8px',
                padding: '0.45rem',
                color: !isDenverZoom ? '#fff' : 'var(--text-secondary)',
                fontSize: '0.78rem',
                fontWeight: 600,
                fontFamily: 'inherit',
                cursor: 'pointer',
                transition: 'all 0.2s ease',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '0.25rem'
              }}
            >
              <span className="material-symbols-outlined" style={{ fontSize: '0.9rem' }}>public</span>
              Statewide
            </button>
            <button
              onClick={() => { setIsDenverZoom(true); setSelectedItem(null); }}
              style={{
                background: isDenverZoom ? 'rgba(224, 90, 71, 0.12)' : 'transparent',
                border: 'none',
                borderRadius: '8px',
                padding: '0.45rem',
                color: isDenverZoom ? 'var(--accent-terracotta)' : 'var(--text-secondary)',
                fontSize: '0.78rem',
                fontWeight: 600,
                fontFamily: 'inherit',
                cursor: 'pointer',
                transition: 'all 0.2s ease',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '0.25rem'
              }}
            >
              <span className="material-symbols-outlined" style={{ fontSize: '0.9rem' }}>zoom_in</span>
              Denver Metro
            </button>
          </div>

          <div style={{
            background: 'rgba(255, 255, 255, 0.02)',
            border: '1px solid var(--border-subtle)',
            borderRadius: '8px',
            padding: '0.45rem 0.75rem',
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem',
            marginBottom: '0.75rem'
          }}>
            <span className="material-symbols-outlined" style={{ fontSize: '1.1rem', color: 'var(--text-secondary)' }}>search</span>
            <input
              type="text"
              placeholder={isDenverZoom ? "Search Denver resources..." : "Search Colorado map features..."}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              style={{
                background: 'transparent',
                border: 'none',
                color: '#fff',
                fontSize: '0.85rem',
                outline: 'none',
                width: '100%',
                fontFamily: 'inherit'
              }}
            />
            {searchQuery && (
              <span 
                className="material-symbols-outlined" 
                onClick={() => setSearchQuery('')}
                style={{ fontSize: '1rem', color: 'var(--text-secondary)', cursor: 'pointer' }}
              >
                close
              </span>
            )}
          </div>

          {/* Layer Filter Pills */}
          <div style={{ display: 'flex', gap: '0.35rem', flexWrap: 'wrap' }}>
            <button 
              onClick={() => setActiveLayer('all')}
              style={{
                background: activeLayer === 'all' ? 'rgba(255,255,255,0.06)' : 'transparent',
                border: `1px solid ${activeLayer === 'all' ? 'rgba(255,255,255,0.12)' : 'rgba(255,255,255,0.04)'}`,
                color: activeLayer === 'all' ? '#fff' : 'var(--text-secondary)',
                fontSize: '0.72rem', padding: '0.2rem 0.45rem', borderRadius: '4px', cursor: 'pointer', fontFamily: 'inherit'
              }}
            >
              All ({filteredItems.length})
            </button>
            <button 
              onClick={() => setActiveLayer('projects')}
              style={{
                background: activeLayer === 'projects' ? 'rgba(167, 139, 250, 0.08)' : 'transparent',
                border: `1px solid ${activeLayer === 'projects' ? 'var(--accent-lavender)' : 'rgba(255,255,255,0.04)'}`,
                color: activeLayer === 'projects' ? 'var(--accent-lavender)' : 'var(--text-secondary)',
                fontSize: '0.72rem', padding: '0.2rem 0.45rem', borderRadius: '4px', cursor: 'pointer', fontFamily: 'inherit'
              }}
            >
              Projects
            </button>
            <button 
              onClick={() => setActiveLayer('funding')}
              style={{
                background: activeLayer === 'funding' ? 'rgba(224, 90, 71, 0.12)' : 'transparent',
                border: `1px solid ${activeLayer === 'funding' ? 'var(--accent-terracotta)' : 'rgba(255,255,255,0.04)'}`,
                color: activeLayer === 'funding' ? 'var(--accent-terracotta)' : 'var(--text-secondary)',
                fontSize: '0.72rem', padding: '0.2rem 0.45rem', borderRadius: '4px', cursor: 'pointer', fontFamily: 'inherit'
              }}
            >
              Opportunities
            </button>
            <button 
              onClick={() => setActiveLayer('suppliers')}
              style={{
                background: activeLayer === 'suppliers' ? 'rgba(235, 166, 90, 0.08)' : 'transparent',
                border: `1px solid ${activeLayer === 'suppliers' ? 'var(--accent-ochre)' : 'rgba(255,255,255,0.04)'}`,
                color: activeLayer === 'suppliers' ? 'var(--accent-ochre)' : 'var(--text-secondary)',
                fontSize: '0.72rem', padding: '0.2rem 0.45rem', borderRadius: '4px', cursor: 'pointer', fontFamily: 'inherit'
              }}
            >
              Resources
            </button>
          </div>
        </div>

        {/* Trail Toggle (only applicable in Statewide) */}
        {!isDenverZoom && (
          <div style={{ padding: '0.5rem 1.25rem', borderBottom: '1px solid rgba(255, 255, 255, 0.05)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: '0.72rem', color: 'var(--text-secondary)', fontWeight: 600 }}>Colorado Creative Trail Layer</span>
            <label style={{ display: 'flex', alignItems: 'center', cursor: 'pointer', position: 'relative' }}>
              <input 
                type="checkbox" 
                checked={showCreativeTrail}
                onChange={(e) => setShowCreativeTrail(e.target.checked)}
                style={{ cursor: 'pointer', accentColor: 'var(--accent-terracotta)' }}
              />
            </label>
          </div>
        )}

        {/* Scrollable Results List */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '0.75rem' }} className="custom-scrollbar">
          {filteredItems.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '2rem 1rem', color: 'var(--text-secondary)', fontSize: '0.8rem' }}>
              <span className="material-symbols-outlined" style={{ fontSize: '2rem', marginBottom: '0.5rem', color: 'rgba(255,255,255,0.1)' }}>search_off</span>
              <div>No features match this query.</div>
            </div>
          ) : (
            filteredItems.map(item => {
              const isSelected = selectedItem?.id === item.id;
              const isHovered = hoveredItem?.id === item.id;
              let badgeColor = 'var(--accent-lavender)';
              if (item.type === 'funding') badgeColor = 'var(--accent-terracotta)';
              if (item.type === 'Supplies' || item.type === 'Fabrication' || item.type === 'Engineering') badgeColor = 'var(--accent-ochre)';

              return (
                <div
                  key={item.id}
                  onMouseEnter={() => setHoveredItem(item)}
                  onMouseLeave={() => setHoveredItem(null)}
                  onClick={() => {
                    setSelectedItem(item);
                    if (mapRef.current) {
                      mapRef.current.panTo({ lat: item.lat, lng: item.lon });
                    }
                  }}
                  style={{
                    background: isSelected ? 'rgba(255, 255, 255, 0.04)' : isHovered ? 'rgba(255, 255, 255, 0.02)' : 'transparent',
                    border: `1px solid ${isSelected ? 'rgba(255,255,255,0.08)' : 'transparent'}`,
                    padding: '0.65rem 0.85rem',
                    borderRadius: '8px',
                    marginBottom: '0.35rem',
                    cursor: 'pointer',
                    transition: 'all 0.15s ease'
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '0.5rem' }}>
                    <h4 style={{ margin: 0, fontSize: '0.82rem', fontWeight: 600, color: isSelected || isHovered ? '#fff' : 'var(--text-primary)', lineHeight: 1.3 }}>
                      {item.name}
                    </h4>
                    <span style={{
                      fontSize: '0.62rem',
                      fontWeight: 700,
                      padding: '0.15rem 0.35rem',
                      borderRadius: '4px',
                      background: `${badgeColor}15`,
                      border: `1px solid ${badgeColor}30`,
                      color: badgeColor,
                      textTransform: 'uppercase',
                      whiteSpace: 'nowrap'
                    }}>
                      {item.type === 'project' ? 'Project' : item.type === 'funding' ? 'Grant' : 'Resource'}
                    </span>
                  </div>
                  <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.35rem', fontSize: '0.72rem', color: 'var(--text-secondary)' }}>
                    <span>📍 {item.cityName}</span>
                    <span>•</span>
                    <span style={{ color: '#34d399', fontWeight: 600 }}>
                      {item.budget || 'Stipend'}
                    </span>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* 2. Map Canvas Block */}
      <div style={{ position: 'relative', height: '100%', overflow: 'hidden', background: '#08090c' }}>
        {/* Title Overlay */}
        <div style={{
          position: 'absolute', top: '1.25rem', left: '1.25rem', zIndex: 10,
          background: 'rgba(8, 9, 12, 0.75)', padding: '0.65rem 1rem', borderRadius: '10px',
          border: '1px solid rgba(255, 255, 255, 0.05)', backdropFilter: 'blur(12px)',
          boxShadow: '0 4px 20px rgba(0,0,0,0.5)'
        }}>
          <h3 style={{ margin: 0, fontFamily: 'Space Grotesk', fontSize: '0.95rem', fontWeight: 700, color: '#fff', letterSpacing: '0.5px', display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
            <span className="material-symbols-outlined" style={{ fontSize: '1.1rem', color: 'var(--accent-terracotta)' }}>explore</span>
            {isDenverZoom ? 'Denver Metro Opportunities Map' : 'Colorado Geospatial Opportunities Map'}
          </h3>
          <span style={{ fontSize: '0.72rem', color: 'var(--text-secondary)' }}>
            {isDenverZoom 
              ? `Displaying ${filteredItems.length} de-clustered public art resources & districts` 
              : `Showing ${filteredItems.length} active public art markers across Colorado`}
          </span>
        </div>

        {/* Dynamic Warning Alert Overlay for API Key missing (Glassmorphic) */}
        {mapLoaded && (!import.meta.env.VITE_GOOGLE_MAPS_API_KEY || import.meta.env.VITE_GOOGLE_MAPS_API_KEY === 'YOUR_API_KEY_HERE') && (
          <div style={{
            position: 'absolute', top: '1.25rem', left: '50%', transform: 'translateX(-50%)', zIndex: 10,
            background: 'rgba(235, 166, 90, 0.12)', border: '1px solid rgba(235, 166, 90, 0.3)',
            borderRadius: '8px', padding: '0.5rem 1rem', display: 'flex', alignItems: 'center', gap: '0.5rem',
            backdropFilter: 'blur(12px)', boxShadow: '0 4px 20px rgba(0,0,0,0.5)', fontSize: '0.72rem',
            width: 'max-content', maxWidth: '90%'
          }}>
            <span className="material-symbols-outlined" style={{ color: 'var(--accent-ochre)', fontSize: '1.1rem' }}>info</span>
            <span style={{ color: '#fff', fontWeight: 500 }}>
              Running in sandbox mode. Add <code style={{ color: 'var(--accent-ochre)', background: 'rgba(0,0,0,0.2)', padding: '2px 4px', borderRadius: '3px', fontFamily: 'monospace' }}>VITE_GOOGLE_MAPS_API_KEY</code> in <code style={{ fontFamily: 'monospace' }}>.env.production</code> for production.
            </span>
          </div>
        )}

        {/* Back Button (Only in Denver Zoom) */}
        {isDenverZoom && (
          <button
            onClick={() => { setIsDenverZoom(false); setSelectedItem(null); }}
            style={{
              position: 'absolute',
              top: '1.25rem',
              right: '1.25rem',
              zIndex: 10,
              background: 'rgba(255,255,255,0.04)',
              border: '1px solid rgba(255,255,255,0.1)',
              borderRadius: '8px',
              padding: '0.45rem 0.75rem',
              color: '#fff',
              fontSize: '0.78rem',
              fontWeight: 600,
              fontFamily: 'inherit',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '0.25rem',
              backdropFilter: 'blur(8px)',
              transition: 'all 0.2s ease',
              boxShadow: '0 4px 16px rgba(0,0,0,0.4)'
            }}
            onMouseEnter={(e) => e.target.style.background = 'rgba(255,255,255,0.08)'}
            onMouseLeave={(e) => e.target.style.background = 'rgba(255,255,255,0.04)'}
          >
            <span className="material-symbols-outlined" style={{ fontSize: '0.9rem' }}>arrow_back</span>
            Back to Statewide
          </button>
        )}

        {/* Legend Overlay */}
        <div style={{
          position: 'absolute', bottom: '1.25rem', left: '1.25rem', zIndex: 10,
          background: 'rgba(8, 9, 12, 0.75)', padding: '0.65rem 0.85rem', borderRadius: '10px',
          border: '1px solid rgba(255, 255, 255, 0.05)', backdropFilter: 'blur(12px)',
          display: 'flex', flexDirection: 'column', gap: '0.35rem', fontSize: '0.7rem',
          boxShadow: '0 4px 20px rgba(0,0,0,0.5)'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', color: 'var(--text-secondary)' }}>
            <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#a78bfa', boxShadow: '0 0 8px #a78bfa' }} />
            <span>Active Pipeline Projects</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', color: 'var(--text-secondary)' }}>
            <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#e05a47', boxShadow: '0 0 8px #e05a47' }} />
            <span>Open Funding RFQs / Grants</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', color: 'var(--text-secondary)' }}>
            <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#eba65a', boxShadow: '0 0 8px #eba65a' }} />
            <span>Material Supplies & PE Engineering</span>
          </div>
        </div>

        {/* Denver Districts Quick Legend (Only in Denver Zoom) */}
        {isDenverZoom && (
          <div style={{
            position: 'absolute', bottom: '1.25rem', right: '1.25rem', zIndex: 10,
            background: 'rgba(8, 9, 12, 0.75)', padding: '0.65rem 0.85rem', borderRadius: '10px',
            border: '1px solid rgba(255, 255, 255, 0.05)', backdropFilter: 'blur(12px)',
            display: 'flex', flexDirection: 'column', gap: '0.35rem', fontSize: '0.7rem',
            boxShadow: '0 4px 20px rgba(0,0,0,0.5)', width: '130px'
          }}>
            <div style={{ fontWeight: 600, color: '#fff', borderBottom: '1px solid rgba(255,255,255,0.08)', paddingBottom: '0.2rem', marginBottom: '0.15rem' }}>Districts</div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', color: 'rgba(167, 139, 250, 0.85)' }}>
              <span style={{ width: '8px', height: '8px', background: 'rgba(167, 139, 250, 0.25)', border: '1px solid var(--accent-lavender)' }} />
              <span>RiNo</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', color: 'rgba(224, 90, 71, 0.85)' }}>
              <span style={{ width: '8px', height: '8px', background: 'rgba(224, 90, 71, 0.25)', border: '1px solid var(--accent-terracotta)' }} />
              <span>Five Points</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', color: 'rgba(235, 166, 90, 0.85)' }}>
              <span style={{ width: '8px', height: '8px', background: 'rgba(235, 166, 90, 0.25)', border: '1px solid var(--accent-ochre)' }} />
              <span>Santa Fe</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', color: 'rgba(56, 189, 248, 0.85)' }}>
              <span style={{ width: '8px', height: '8px', background: 'rgba(56, 189, 248, 0.25)', border: '1px solid var(--accent-electric)' }} />
              <span>LoDo</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', color: 'rgba(244, 63, 94, 0.85)' }}>
              <span style={{ width: '8px', height: '8px', background: 'rgba(244, 63, 94, 0.25)', border: '1px solid #f43f5e' }} />
              <span>Golden Tri.</span>
            </div>
          </div>
        )}

        {/* Loading Spinner overlay */}
        {!mapLoaded && !loadError && (
          <div style={{
            position: 'absolute', top: 0, left: 0, right: 0, bottom: 0,
            background: 'rgba(8, 9, 12, 0.85)', display: 'flex', flexDirection: 'column',
            alignItems: 'center', justifyContent: 'center', gap: '1rem', zIndex: 100,
            backdropFilter: 'blur(12px)'
          }}>
            <span className="material-symbols-outlined" style={{ fontSize: '3rem', color: 'var(--accent-terracotta)', animation: 'pulse 1.5s infinite ease-in-out' }}>explore</span>
            <div style={{ color: '#fff', fontSize: '0.9rem', fontFamily: 'Space Grotesk', fontWeight: 600 }}>Loading Geospatial Platform...</div>
          </div>
        )}

        {/* Load Error overlay */}
        {loadError && (
          <div style={{
            position: 'absolute', top: 0, left: 0, right: 0, bottom: 0,
            background: 'rgba(8, 9, 12, 0.9)', display: 'flex', flexDirection: 'column',
            alignItems: 'center', justifyContent: 'center', gap: '1rem', zIndex: 100,
            padding: '2rem', textAlign: 'center'
          }}>
            <span className="material-symbols-outlined" style={{ fontSize: '3rem', color: '#ef4444' }}>error</span>
            <div style={{ color: '#fff', fontSize: '1rem', fontFamily: 'Space Grotesk', fontWeight: 700 }}>Google Maps Load Error</div>
            <div style={{ color: 'var(--text-secondary)', fontSize: '0.82rem', maxWidth: '400px' }}>{loadError}</div>
          </div>
        )}

        {/* Floating Satellite / Vector Switcher Toggle Pill Overlay */}
        <div style={{
          position: 'absolute', top: '1.25rem', left: '50%', transform: 'translateX(-50%)', zIndex: 12,
          background: 'rgba(8, 9, 12, 0.75)', border: '1px solid rgba(255, 255, 255, 0.08)',
          borderRadius: '999px', padding: '3px', display: 'flex', gap: '2px',
          backdropFilter: 'blur(16px)', boxShadow: '0 8px 32px rgba(0,0,0,0.5)'
        }}>
          <button
            onClick={() => {
              if (mapLoaded && !loadError) setUseVectorMap(false);
              else alert("Google Maps is currently unavailable. Operating in Vector Offline Mode.");
            }}
            style={{
              background: !isVectorActive ? 'rgba(224, 90, 71, 0.2)' : 'transparent',
              border: 'none', borderRadius: '999px', padding: '0.4rem 1rem',
              color: !isVectorActive ? '#fff' : 'var(--text-secondary)',
              fontSize: '0.72rem', fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.25rem',
              fontFamily: 'inherit', outline: 'none', transition: 'all 0.2s'
            }}
          >
            <span className="material-symbols-outlined" style={{ fontSize: '0.95rem' }}>satellite</span>
            Satellite Map
          </button>
          <button
            onClick={() => setUseVectorMap(true)}
            style={{
              background: isVectorActive ? 'rgba(224, 90, 71, 0.2)' : 'transparent',
              border: 'none', borderRadius: '999px', padding: '0.4rem 1rem',
              color: isVectorActive ? '#fff' : 'var(--text-secondary)',
              fontSize: '0.72rem', fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.25rem',
              fontFamily: 'inherit', outline: 'none', transition: 'all 0.2s'
            }}
          >
            <span className="material-symbols-outlined" style={{ fontSize: '0.95rem' }}>draw</span>
            High-Fidelity Vector Map
          </button>
        </div>

        {/* Google Map Container Element */}
        <div 
          ref={mapContainerRef} 
          style={{ width: '100%', height: '100%', display: isVectorActive ? 'none' : 'block' }}
        />

        {/* High-Fidelity Vector Fallback Map */}
        {isVectorActive && (
          <div style={{
            width: '100%',
            height: '100%',
            position: 'absolute',
            top: 0, left: 0, right: 0, bottom: 0,
            background: '#090a0f',
            backgroundImage: 'radial-gradient(circle at 50% 50%, #151620 0%, #090a0f 100%)',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            overflow: 'hidden',
            padding: '2.5rem',
            boxSizing: 'border-box'
          }}>
            {/* Vector Map Canvas */}
            <div style={{
              width: '95%',
              height: '88%',
              position: 'relative',
              border: '1px solid rgba(255, 255, 255, 0.04)',
              borderRadius: '12px',
              background: 'rgba(255, 255, 255, 0.01)',
              boxShadow: 'inset 0 0 40px rgba(0,0,0,0.6)',
              overflow: 'hidden'
            }}>
              {/* Coordinate Grid Overlay */}
              <svg style={{ position: 'absolute', width: '100%', height: '100%', pointerEvents: 'none' }}>
                <defs>
                  <pattern id="grid" width="40" height="40" patternUnits="userSpaceOnUse">
                    <path d="M 40 0 L 0 0 0 40" fill="none" stroke="rgba(255, 255, 255, 0.015)" strokeWidth="1"/>
                  </pattern>
                </defs>
                <rect width="100%" height="100%" fill="url(#grid)" />
                
                {/* Colorado Bounding Border (Statewide only) */}
                {!isDenverZoom && (
                  <rect 
                    x="5%" y="5%" width="90%" height="90%" 
                    fill="rgba(224, 90, 71, 0.01)" 
                    stroke="rgba(224, 90, 71, 0.12)" 
                    strokeWidth="2" 
                    strokeDasharray="4 8"
                    rx="8"
                  />
                )}

                {/* Denver Metro grid boundaries (Denver Zoom only) */}
                {isDenverZoom && (
                  <rect 
                    x="8%" y="8%" width="84%" height="84%" 
                    fill="rgba(167, 139, 250, 0.005)" 
                    stroke="rgba(167, 139, 250, 0.12)" 
                    strokeWidth="2" 
                    strokeDasharray="4 8"
                    rx="8"
                  />
                )}
                
                {/* Statewide Creative Trail connector line */}
                {!isDenverZoom && showCreativeTrail && (
                  (() => {
                    const citiesInTrail = [
                      'Grand Junction', 'Telluride', 'Steamboat Springs', 'Fort Collins', 
                      'Boulder', 'Golden', 'Denver', 'Aurora', 'Lakewood', 'Colorado Springs', 'Pueblo'
                    ];
                    const trailPoints = citiesInTrail
                      .map(name => COLORADO_CITIES.find(c => c.name === name))
                      .filter(Boolean)
                      .map(c => getXY(c.lat, c.lon));
                    const pathD = trailPoints.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x}% ${p.y}%`).join(' ');
                    return (
                      <path 
                        d={pathD} 
                        fill="none" 
                        stroke="rgba(224, 90, 71, 0.35)" 
                        strokeWidth="2" 
                        strokeDasharray="6 6"
                        style={{ strokeLinecap: 'round', animation: 'dash 35s linear infinite' }}
                      />
                    );
                  })()
                )}
              </svg>

              {/* Major Cities (Statewide only) */}
              {!isDenverZoom && COLORADO_CITIES.map(c => {
                const { x, y } = getXY(c.lat, c.lon);
                return (
                  <div 
                    key={c.name} 
                    onClick={() => {
                      if (c.name === 'Denver') { setIsDenverZoom(true); }
                    }}
                    style={{
                      position: 'absolute',
                      left: `${x}%`,
                      top: `${y}%`,
                      transform: 'translate(-50%, -50%)',
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      cursor: c.name === 'Denver' ? 'pointer' : 'default',
                      zIndex: 8
                    }}
                  >
                    <div style={{ width: '6px', height: '6px', borderRadius: '50%', background: 'rgba(235, 166, 90, 0.7)', boxShadow: '0 0 8px #eba65a' }} />
                    <div style={{
                      position: 'absolute',
                      width: '14px', height: '14px', borderRadius: '50%',
                      border: '1px solid rgba(235, 166, 90, 0.4)',
                      animation: 'pulseGlow 2s infinite ease-in-out',
                      pointerEvents: 'none'
                    }} />
                    <span style={{
                      fontSize: '0.62rem',
                      color: 'rgba(255,255,255,0.4)',
                      fontWeight: 600,
                      fontFamily: 'Space Grotesk',
                      marginTop: '0.2rem',
                      whiteSpace: 'nowrap'
                    }}>
                      {c.name}
                    </span>
                  </div>
                );
              })}

              {/* Denver Districts Overlay Cards (Denver Zoom only) */}
              {isDenverZoom && (
                <>
                  {/* RiNo */}
                  <div style={{ position: 'absolute', left: '60%', top: '25%', transform: 'translate(-50%, -50%)', border: '1px solid rgba(167, 139, 250, 0.2)', background: 'rgba(167, 139, 250, 0.05)', borderRadius: '6px', padding: '0.25rem 0.5rem', color: 'var(--accent-lavender)', fontSize: '0.65rem', fontWeight: 700, letterSpacing: '0.5px', pointerEvents: 'none' }}>RINO</div>
                  {/* Five Points */}
                  <div style={{ position: 'absolute', left: '55%', top: '40%', transform: 'translate(-50%, -50%)', border: '1px solid rgba(224, 90, 71, 0.2)', background: 'rgba(224, 90, 71, 0.05)', borderRadius: '6px', padding: '0.25rem 0.5rem', color: 'var(--accent-terracotta)', fontSize: '0.65rem', fontWeight: 700, letterSpacing: '0.5px', pointerEvents: 'none' }}>FIVE POINTS</div>
                  {/* Santa Fe */}
                  <div style={{ position: 'absolute', left: '30%', top: '65%', transform: 'translate(-50%, -50%)', border: '1px solid rgba(235, 166, 90, 0.2)', background: 'rgba(235, 166, 90, 0.05)', borderRadius: '6px', padding: '0.25rem 0.5rem', color: 'var(--accent-ochre)', fontSize: '0.65rem', fontWeight: 700, letterSpacing: '0.5px', pointerEvents: 'none' }}>SANTA FE</div>
                  {/* LoDo */}
                  <div style={{ position: 'absolute', left: '42%', top: '35%', transform: 'translate(-50%, -50%)', border: '1px solid rgba(56, 189, 248, 0.2)', background: 'rgba(56, 189, 248, 0.05)', borderRadius: '6px', padding: '0.25rem 0.5rem', color: 'var(--accent-electric)', fontSize: '0.65rem', fontWeight: 700, letterSpacing: '0.5px', pointerEvents: 'none' }}>LODO</div>
                  {/* Golden Triangle */}
                  <div style={{ position: 'absolute', left: '46%', top: '55%', transform: 'translate(-50%, -50%)', border: '1px solid rgba(244, 63, 94, 0.2)', background: 'rgba(244, 63, 94, 0.05)', borderRadius: '6px', padding: '0.25rem 0.5rem', color: '#f43f5e', fontSize: '0.65rem', fontWeight: 700, letterSpacing: '0.5px', pointerEvents: 'none' }}>GOLDEN TRIANGLE</div>
                </>
              )}

              {/* Active Marker Pins */}
              {filteredItems.map(item => {
                const { x, y } = isDenverZoom ? getDenverXY(item.lat, item.lon) : getXY(item.lat, item.lon);
                const isSelected = selectedItem?.id === item.id;
                const isHovered = hoveredItem?.id === item.id;
                
                let markerColor = '#a78bfa'; // Projects - var(--accent-lavender)
                if (item.type === 'funding') markerColor = '#e05a47'; // Funding - var(--accent-terracotta)
                if (item.type === 'Supplies' || item.type === 'Fabrication' || item.type === 'Engineering') {
                  markerColor = '#eba65a'; // Resources - var(--accent-ochre)
                }
                const size = (isSelected || isHovered) ? 14 : 9;

                return (
                  <div
                    key={item.id}
                    onClick={() => setSelectedItem(item)}
                    onMouseEnter={() => setHoveredItem(item)}
                    onMouseLeave={() => setHoveredItem(null)}
                    style={{
                      position: 'absolute',
                      left: `${x}%`,
                      top: `${y}%`,
                      transform: 'translate(-50%, -100%)', // align anchor at bottom-middle of the pin
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      cursor: 'pointer',
                      zIndex: (isSelected || isHovered) ? 15 : 10,
                      transition: 'all 0.15s cubic-bezier(0.175, 0.885, 0.32, 1.275)'
                    }}
                  >
                    {/* Glowing outer animation circle */}
                    {(isSelected || isHovered) && (
                      <div style={{
                        position: 'absolute',
                        bottom: '-4px',
                        width: '24px', height: '24px', borderRadius: '50%',
                        background: 'rgba(255,255,255,0.03)',
                        border: `1.5px solid ${markerColor}`,
                        animation: 'pulseGlow 1.5s infinite ease-in-out',
                        pointerEvents: 'none'
                      }} />
                    )}

                    {/* Styled Pin Marker */}
                    <div style={{
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center'
                    }}>
                      {/* Pin Head */}
                      <div style={{
                        width: `${size + 8}px`,
                        height: `${size + 8}px`,
                        borderRadius: '50% 50% 50% 0',
                        background: markerColor,
                        transform: 'rotate(-45deg)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        border: '1.5px solid #ffffff',
                        boxShadow: '0 3px 8px rgba(0,0,0,0.5)'
                      }}>
                        {/* Inner Pin Dot */}
                        <div style={{
                          width: `${(size + 8) / 2.5}px`,
                          height: `${(size + 8) / 2.5}px`,
                          borderRadius: '50%',
                          background: '#ffffff',
                          transform: 'rotate(45deg)'
                        }} />
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
            
            {/* Notice Footer */}
            <div style={{
              marginTop: '0.5rem',
              fontSize: '0.7rem',
              color: 'var(--text-secondary)',
              display: 'flex',
              alignItems: 'center',
              gap: '0.25rem',
              background: 'rgba(255,255,255,0.02)',
              padding: '0.25rem 0.75rem',
              borderRadius: '999px',
              border: '1px solid rgba(255, 255, 255, 0.04)'
            }}>
              <span className="material-symbols-outlined" style={{ fontSize: '0.85rem', color: 'var(--accent-terracotta)' }}>offline_bolt</span>
              <span>Vector Offline Mode active. Standard geospatial capabilities initialized.</span>
            </div>
          </div>
        )}

        {/* 3. Slide-in Geospatial Inspector Panel */}
        {selectedItem && (
          <div style={{
            position: 'absolute',
            top: 0,
            right: 0,
            width: '320px',
            height: '100%',
            background: 'rgba(8, 9, 12, 0.9)',
            backdropFilter: 'blur(16px)',
            borderLeft: '1px solid var(--border-subtle)',
            padding: '1.5rem',
            display: 'flex',
            flexDirection: 'column',
            gap: '1.25rem',
            zIndex: 50,
            boxShadow: '-8px 0 32px rgba(0,0,0,0.5)',
            animation: 'slideLeft 0.25s cubic-bezier(0.16, 1, 0.3, 1)',
            overflowY: 'auto'
          }}>
            {/* Close Button Header */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid rgba(255, 255, 255, 0.06)', paddingBottom: '0.75rem' }}>
              <div>
                <span style={{
                  fontSize: '0.65rem',
                  fontWeight: 700,
                  padding: '0.15rem 0.45rem',
                  borderRadius: '4px',
                  background: selectedItem.type === 'project' ? 'rgba(167, 139, 250, 0.15)' : selectedItem.type === 'funding' ? 'rgba(224,90,71,0.15)' : 'rgba(235,166,90,0.15)',
                  border: '1px solid rgba(255,255,255,0.06)',
                  color: selectedItem.type === 'project' ? 'var(--accent-lavender)' : selectedItem.type === 'funding' ? 'var(--accent-terracotta)' : 'var(--accent-ochre)',
                  textTransform: 'uppercase',
                  letterSpacing: '0.04em'
                }}>
                  {selectedItem.type === 'project' ? 'Project Track' : selectedItem.type === 'funding' ? 'Grant Source' : selectedItem.category}
                </span>
                <div style={{ fontSize: '0.7rem', color: 'var(--text-secondary)', marginTop: '0.35rem' }}>
                  📍 {selectedItem.cityName} County Corridor
                </div>
              </div>
              <button 
                onClick={() => setSelectedItem(null)}
                style={{
                  background: 'rgba(255,255,255,0.04)',
                  border: '1px solid rgba(255,255,255,0.08)',
                  borderRadius: '50%',
                  width: '28px',
                  height: '28px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: 'var(--text-secondary)',
                  cursor: 'pointer',
                  outline: 'none',
                  marginLeft: 'auto',
                  transition: 'all 0.2s ease'
                }}
                onMouseEnter={(e) => e.target.style.background = 'rgba(255,255,255,0.08)'}
                onMouseLeave={(e) => e.target.style.background = 'rgba(255,255,255,0.04)'}
              >
                <span className="material-symbols-outlined" style={{ fontSize: '1rem' }}>close</span>
              </button>
            </div>

            {/* Core Info */}
            <div>
              <h3 style={{ margin: 0, fontFamily: 'Space Grotesk', fontSize: '1.05rem', color: '#fff', fontWeight: 700, lineHeight: 1.35 }}>
                {selectedItem.name}
              </h3>
              
              {/* Cost/Budget Badge */}
              <div style={{
                background: 'rgba(52, 211, 153, 0.05)',
                border: '1px solid rgba(52, 211, 153, 0.15)',
                borderRadius: '8px',
                padding: '0.5rem 0.75rem',
                marginTop: '0.85rem',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between'
              }}>
                <span style={{ fontSize: '0.72rem', color: 'var(--text-secondary)' }}>Funding Allocated:</span>
                <span style={{ fontSize: '0.95rem', fontWeight: 800, color: '#34d399' }}>{selectedItem.budget || 'Stipend'}</span>
              </div>
            </div>

            {/* Timelines and Details */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', fontSize: '0.78rem' }}>
              {selectedItem.funding && (
                <div>
                  <span style={{ color: 'var(--text-secondary)', display: 'block', fontSize: '0.68rem', textTransform: 'uppercase', letterSpacing: '0.04em', marginBottom: '0.15rem' }}>
                    Provider / Sponsor
                  </span>
                  <span style={{ color: '#fff', fontWeight: 500 }}>{selectedItem.funding}</span>
                </div>
              )}
              {selectedItem.timeline && (
                <div>
                  <span style={{ color: 'var(--text-secondary)', display: 'block', fontSize: '0.68rem', textTransform: 'uppercase', letterSpacing: '0.04em', marginBottom: '0.15rem' }}>
                    Project Timeline
                  </span>
                  <span style={{ color: '#fff' }}>📅 {selectedItem.timeline}</span>
                </div>
              )}
              {selectedItem.address && (
                <div>
                  <span style={{ color: 'var(--text-secondary)', display: 'block', fontSize: '0.68rem', textTransform: 'uppercase', letterSpacing: '0.04em', marginBottom: '0.15rem' }}>
                    Location / Office
                  </span>
                  <span style={{ color: '#fff' }}>🏢 {selectedItem.address}</span>
                </div>
              )}
            </div>

            {/* Description Text */}
            <p style={{
              fontSize: '0.82rem',
              color: 'var(--text-secondary)',
              lineHeight: 1.5,
              margin: 0,
              borderTop: '1px solid rgba(255, 255, 255, 0.05)',
              paddingTop: '0.75rem'
            }}>
              {selectedItem.description}
            </p>

            {/* AI Geospatial Insights Block */}
            <div style={{
              marginTop: '0.75rem',
              paddingTop: '0.75rem',
              borderTop: '1px dotted rgba(255, 255, 255, 0.08)'
            }}>
              {aiInsights[selectedItem.id] ? (
                <div style={{
                  background: 'rgba(235, 166, 90, 0.05)',
                  border: '1px solid rgba(235, 166, 90, 0.15)',
                  borderRadius: '8px',
                  padding: '0.75rem',
                  fontSize: '0.78rem',
                  lineHeight: 1.45,
                  color: 'var(--text-secondary)'
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', marginBottom: '0.35rem', color: 'var(--accent-ochre)', fontWeight: 700 }}>
                    <span className="material-symbols-outlined" style={{ fontSize: '1rem' }}>psychology</span>
                    AI Geospatial Insights
                  </div>
                  {aiInsights[selectedItem.id]}
                </div>
              ) : (
                <button
                  onClick={() => handleGenerateMapInsights(selectedItem)}
                  disabled={isGeneratingInsights}
                  style={{
                    background: 'rgba(255, 255, 255, 0.03)',
                    border: '1px solid rgba(255, 255, 255, 0.08)',
                    color: '#fff',
                    borderRadius: '8px',
                    padding: '0.55rem 0.85rem',
                    fontSize: '0.75rem',
                    fontWeight: 600,
                    cursor: isGeneratingInsights ? 'not-allowed' : 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '0.35rem',
                    width: '100%',
                    transition: 'all 0.2s',
                    fontFamily: 'inherit'
                  }}
                  onMouseEnter={(e) => { if (!isGeneratingInsights) e.target.style.background = 'rgba(255, 255, 255, 0.06)'; }}
                  onMouseLeave={(e) => { if (!isGeneratingInsights) e.target.style.background = 'rgba(255, 255, 255, 0.03)'; }}
                >
                  <span className="material-symbols-outlined" style={{ fontSize: '1rem', color: 'var(--accent-ochre)', animation: isGeneratingInsights ? 'pulse 1s infinite' : 'none' }}>
                    {isGeneratingInsights ? 'hourglass_empty' : 'psychology'}
                  </span>
                  {isGeneratingInsights ? 'Analyzing Location...' : 'Generate AI Map Insights'}
                </button>
              )}
            </div>

            {/* CROSS-TAB DEEP-LINK BUTTON CONNECTOR */}
            <div style={{ marginTop: 'auto', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
              {/* Option A: Open Opportunity */}
              {selectedItem.type === 'funding' && (
                <button
                  onClick={() => handleApplyOpportunity(selectedItem)}
                  style={{
                    background: 'var(--accent-terracotta)',
                    color: '#fff',
                    border: 'none',
                    borderRadius: '8px',
                    padding: '0.6rem 1rem',
                    fontSize: '0.82rem',
                    fontWeight: 700,
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '0.35rem',
                    boxShadow: '0 4px 12px rgba(224, 90, 71, 0.25)',
                    fontFamily: 'inherit',
                    transition: 'transform 0.2s ease'
                  }}
                  onMouseEnter={(e) => e.target.style.transform = 'translateY(-1px)'}
                  onMouseLeave={(e) => e.target.style.transform = 'none'}
                >
                  <span className="material-symbols-outlined" style={{ fontSize: '1.1rem' }}>auto_awesome</span>
                  Analyze with AI Copilot
                </button>
              )}

              {/* Option B: Active Pipeline Project */}
              {selectedItem.type === 'project' && onNavigatePipeline && (
                <button
                  onClick={() => onNavigatePipeline(selectedItem)}
                  style={{
                    background: 'rgba(167, 139, 250, 0.12)',
                    border: '1px solid rgba(167, 139, 250, 0.25)',
                    color: 'var(--accent-lavender)',
                    borderRadius: '8px',
                    padding: '0.6rem 1rem',
                    fontSize: '0.82rem',
                    fontWeight: 700,
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '0.35rem',
                    fontFamily: 'inherit',
                    transition: 'transform 0.2s ease'
                  }}
                  onMouseEnter={(e) => e.target.style.transform = 'translateY(-1px)'}
                  onMouseLeave={(e) => e.target.style.transform = 'none'}
                >
                  <span className="material-symbols-outlined" style={{ fontSize: '1.1rem' }}>route</span>
                  View in Project Pipeline
                </button>
              )}

              {/* Option C: Supplier Hub Resources */}
              {(selectedItem.type === 'Supplies' || selectedItem.type === 'Fabrication' || selectedItem.type === 'Engineering') && onLocateResource && (
                <button
                  onClick={() => onLocateResource(selectedItem)}
                  style={{
                    background: 'rgba(235, 166, 90, 0.12)',
                    border: '1px solid rgba(235, 166, 90, 0.25)',
                    color: 'var(--accent-ochre)',
                    borderRadius: '8px',
                    padding: '0.6rem 1rem',
                    fontSize: '0.82rem',
                    fontWeight: 700,
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '0.35rem',
                    fontFamily: 'inherit',
                    transition: 'transform 0.2s ease'
                  }}
                  onMouseEnter={(e) => e.target.style.transform = 'translateY(-1px)'}
                  onMouseLeave={(e) => e.target.style.transform = 'none'}
                >
                  <span className="material-symbols-outlined" style={{ fontSize: '1.1rem' }}>architecture</span>
                  Locate Resource in Hub
                </button>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
