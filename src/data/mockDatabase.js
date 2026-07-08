// Paste your deployed Google Apps Script Web App URL here for secure automatic background sync

const defaultArtists = [
  {
    "id": "ILA-2026-0001",
    "firstName": "Casey",
    "lastName": "Kawaguchi",
    "alias": "Casey Kawaguchi",
    "pronouns": "he/him",
    "email": "contact@caseykawaguchi.com",
    "phone": "303-555-0101",
    "website": "https://caseykawaguchi.com",
    "instagram": "@caseykawaguchi",
    "city": "Denver",
    "state": "CO",
    "primaryMedium": "Mural",
    "secondaryMediums": [
      "Illustration",
      "Fine Art",
      "Street Art"
    ],
    "artStyles": [
      "Street Art",
      "Realism",
      "Calligraphy-inspired"
    ],
    "themes": [
      "Identity",
      "Honor",
      "Resilience",
      "Culture"
    ],
    "experienceLevel": "Established",
    "publicArtExperience": true,
    "muralExperience": true,
    "communityEngagementExperience": true,
    "scaleCapability": [
      "Large",
      "Medium"
    ],
    "collaborationPreference": "Solo",
    "youthEngagementExperience": true,
    "teachingExperience": false,
    "licensingInsurance": true,
    "availabilityStatus": "Available",
    "budgetRange": "$15,000 - $50,000",
    "notableProjects": "RiNo Art District Featured Wall, ILA Gallery Solo Show",
    "references": "ILA Gallery Director (director@ila-gallery.com)",
    "bipocIdentity": "Asian-American (Japanese)",
    "communityAffiliations": "RiNo Art District, ILA Gallery Network",
    "accessibilityNeeds": "None",
    "vettingStatus": "Vetted",
    "lastContacted": "2026-05-01",
    "linkedin": "https://www.linkedin.com/in/casey-kawaguchi-denver",
    "sculptureInstallationExperience": false,
    "galleryInstallationExperience": true,
    "curationExperience": true,
    "otherInstallationExperience": true,
    "capabilitiesDescription": "Experienced in high-elevation mural work and exterior painting. Strong gallery installation background with custom wooden panels and framed works."
  },
  {
    "id": "ILA-2026-0002",
    "firstName": "Jodie",
    "lastName": "Herrera",
    "alias": "Jodie Herrera",
    "pronouns": "she/her",
    "email": "info@jodieherrera.com",
    "phone": "303-555-0102",
    "website": "https://jodieherrera.com",
    "instagram": "@jodieherrera",
    "city": "Denver",
    "state": "CO",
    "primaryMedium": "Oil Painting",
    "secondaryMediums": [
      "Mural",
      "Mixed Media"
    ],
    "artStyles": [
      "Realism",
      "Contemporary Portraiture"
    ],
    "themes": [
      "Culture",
      "Environment",
      "Feminism",
      "Social Justice"
    ],
    "experienceLevel": "Established",
    "publicArtExperience": true,
    "muralExperience": true,
    "communityEngagementExperience": true,
    "scaleCapability": [
      "Medium",
      "Large"
    ],
    "collaborationPreference": "Both",
    "youthEngagementExperience": true,
    "teachingExperience": true,
    "licensingInsurance": true,
    "availabilityStatus": "Semi-Available",
    "budgetRange": "$10,000 - $35,000",
    "notableProjects": "Women Artists Murals Denver, RedLine Residency Exhibition",
    "references": "RedLine Executive Director",
    "bipocIdentity": "Latina / Indigenous",
    "communityAffiliations": "RedLine Contemporary Art Center, ILA Network",
    "accessibilityNeeds": "None",
    "vettingStatus": "Vetted",
    "lastContacted": "2026-04-15",
    "linkedin": "https://www.linkedin.com/in/jodie-herrera-art",
    "sculptureInstallationExperience": false,
    "galleryInstallationExperience": true,
    "curationExperience": true,
    "otherInstallationExperience": false,
    "capabilitiesDescription": "Extensive gallery exhibition history. Experienced in organizing and curating feminist and social justice group shows. Large-scale exterior oil and acrylic paint application."
  },
  {
    "id": "ILA-2026-0003",
    "firstName": "Thomas",
    "lastName": "Evans",
    "alias": "Detour",
    "pronouns": "he/him",
    "email": "detour@iamdetour.com",
    "phone": "303-555-0103",
    "website": "https://iamdetour.com",
    "instagram": "@detour303",
    "city": "Five Points",
    "state": "CO",
    "primaryMedium": "Mural",
    "secondaryMediums": [
      "Interactive Art",
      "Performance",
      "Digital"
    ],
    "artStyles": [
      "Abstract",
      "Realism",
      "Street Art",
      "Neon Pop"
    ],
    "themes": [
      "Community",
      "Culture",
      "Music",
      "History"
    ],
    "experienceLevel": "Established",
    "publicArtExperience": true,
    "muralExperience": true,
    "communityEngagementExperience": true,
    "scaleCapability": [
      "Large",
      "Medium"
    ],
    "collaborationPreference": "Both",
    "youthEngagementExperience": true,
    "teachingExperience": true,
    "licensingInsurance": true,
    "availabilityStatus": "Booked",
    "budgetRange": "$20,000 - $75,000",
    "notableProjects": "Five Points Jazz Festival Mural, Denver Art Museum Commission",
    "references": "Denver Arts & Venues Curator",
    "bipocIdentity": "Black / African-American",
    "communityAffiliations": "Five Points Creative Community, Westword Creative Alumni",
    "accessibilityNeeds": "None",
    "vettingStatus": "Vetted",
    "lastContacted": "2026-05-10",
    "linkedin": "https://www.linkedin.com/in/thomas-evans-detour",
    "sculptureInstallationExperience": true,
    "galleryInstallationExperience": true,
    "curationExperience": true,
    "otherInstallationExperience": true,
    "capabilitiesDescription": "Specializes in interactive public art installations combining sound, visual, and electronic components. Highly skilled in large-scale murals and multi-media stage productions."
  },
  {
    "id": "ILA-2026-0004",
    "firstName": "Koko",
    "lastName": "Bayer",
    "alias": "Koko Bayer",
    "pronouns": "they/them",
    "email": "koko@kokobayer.com",
    "phone": "303-555-0104",
    "website": "https://kokobayer.com",
    "instagram": "@kokobayer",
    "city": "Denver",
    "state": "CO",
    "primaryMedium": "Wheatpaste",
    "secondaryMediums": [
      "Sidewalk Art",
      "Photography",
      "Street Art"
    ],
    "artStyles": [
      "Street Art",
      "Abstract",
      "Retro Graphics"
    ],
    "themes": [
      "Community",
      "Environment",
      "Hope",
      "Public Space"
    ],
    "experienceLevel": "Established",
    "publicArtExperience": true,
    "muralExperience": false,
    "communityEngagementExperience": true,
    "scaleCapability": [
      "Medium",
      "Large"
    ],
    "collaborationPreference": "Both",
    "youthEngagementExperience": false,
    "teachingExperience": false,
    "licensingInsurance": true,
    "availabilityStatus": "Available",
    "budgetRange": "$5,000 - $20,000",
    "notableProjects": "\"Project Hope\" temporary street art installation series across Denver",
    "references": "RiNo Art District Curator",
    "bipocIdentity": "Prefer not to say",
    "communityAffiliations": "RiNo Art District, Westword Creative Alumni",
    "accessibilityNeeds": "Wheelchair access preferred for install sites",
    "vettingStatus": "Vetted",
    "lastContacted": "2026-05-08",
    "linkedin": "https://www.linkedin.com/in/koko-bayer-publicart",
    "sculptureInstallationExperience": false,
    "galleryInstallationExperience": true,
    "curationExperience": false,
    "otherInstallationExperience": true,
    "capabilitiesDescription": "Master of wheatpaste and temporary public installations. Proficient in large-scale exterior vinyl wraps and graphic installations. Prefers wheelchair accessible work zones."
  },
  {
    "id": "ILA-2026-0005",
    "firstName": "Armando",
    "lastName": "Silva",
    "alias": "Armando Silva",
    "pronouns": "he/him",
    "email": "art@armandosilva.com",
    "phone": "303-555-0105",
    "website": "https://armandosilva.com",
    "instagram": "@artlandsilva",
    "city": "Greeley",
    "state": "CO",
    "primaryMedium": "Mural",
    "secondaryMediums": [
      "Live Painting",
      "Fine Art",
      "Teaching"
    ],
    "artStyles": [
      "Realism",
      "Street Art",
      "Expressionist"
    ],
    "themes": [
      "Community",
      "Culture",
      "Youth empowerment",
      "Dreaming"
    ],
    "experienceLevel": "Established",
    "publicArtExperience": true,
    "muralExperience": true,
    "communityEngagementExperience": true,
    "scaleCapability": [
      "Large",
      "Medium"
    ],
    "collaborationPreference": "Both",
    "youthEngagementExperience": true,
    "teachingExperience": true,
    "licensingInsurance": true,
    "availabilityStatus": "Available",
    "budgetRange": "$10,000 - $40,000",
    "notableProjects": "Greeley Creative District Mural, ILA Gallery Residency",
    "references": "Greeley Arts Commission",
    "bipocIdentity": "Latino / Mexican-American",
    "communityAffiliations": "Greeley Creative District, ILA Network",
    "accessibilityNeeds": "None",
    "vettingStatus": "Vetted",
    "lastContacted": "2026-04-20",
    "linkedin": "https://www.linkedin.com/in/armando-silva-artist",
    "sculptureInstallationExperience": false,
    "galleryInstallationExperience": true,
    "curationExperience": false,
    "otherInstallationExperience": false,
    "capabilitiesDescription": "Dynamic live painting performance capability. Experienced in massive public mural planning, lift operation, and community-collaborative workshops."
  },
  {
    "id": "ILA-2026-0006",
    "firstName": "Ally",
    "lastName": "Grimm",
    "alias": "A.L. Grimm",
    "pronouns": "she/her",
    "email": "info@algrimeart.com",
    "phone": "303-555-0106",
    "website": "https://algrimeart.com",
    "instagram": "@a.l.grime",
    "city": "Denver",
    "state": "CO",
    "primaryMedium": "Digital Art",
    "secondaryMediums": [
      "Mural",
      "Installation",
      "AR Interactive"
    ],
    "artStyles": [
      "Abstract",
      "Geometrical",
      "Cyber-muralism"
    ],
    "themes": [
      "Technology",
      "Environment",
      "Mental Health",
      "Future"
    ],
    "experienceLevel": "Established",
    "publicArtExperience": true,
    "muralExperience": true,
    "communityEngagementExperience": true,
    "scaleCapability": [
      "Large",
      "Medium"
    ],
    "collaborationPreference": "Both",
    "youthEngagementExperience": true,
    "teachingExperience": false,
    "licensingInsurance": true,
    "availabilityStatus": "Available",
    "budgetRange": "$12,000 - $45,000",
    "notableProjects": "AR-enabled mural in downtown Denver, RedLine Group Exhibition",
    "references": "RedLine Curator",
    "bipocIdentity": "Latina",
    "communityAffiliations": "RedLine Resident Artist Network, Digital Denver Guild",
    "accessibilityNeeds": "None",
    "vettingStatus": "Vetted",
    "lastContacted": "2026-05-12",
    "linkedin": "https://www.linkedin.com/in/ally-grimm-algrime",
    "sculptureInstallationExperience": true,
    "galleryInstallationExperience": true,
    "curationExperience": true,
    "otherInstallationExperience": true,
    "capabilitiesDescription": "Expert in augmented reality (AR) integrations with physical murals. Comfortable designing complex digital-physical layouts and immersive projection mappings."
  },
  {
    "id": "ILA-2026-0007",
    "firstName": "Javier",
    "lastName": "Flores",
    "alias": "Javier Flores",
    "pronouns": "he/him",
    "email": "javier@redlineart.org",
    "phone": "303-555-0107",
    "website": "https://redlineart.org/javier",
    "instagram": "@javierfloresart",
    "city": "Denver",
    "state": "CO",
    "primaryMedium": "Printmaking",
    "secondaryMediums": [
      "Mixed Media",
      "Installation",
      "Sculpture"
    ],
    "artStyles": [
      "Conceptual",
      "Graphic",
      "Street Art"
    ],
    "themes": [
      "Identity",
      "Social Justice",
      "Immigration",
      "Culture"
    ],
    "experienceLevel": "Mid-Career",
    "publicArtExperience": true,
    "muralExperience": false,
    "communityEngagementExperience": true,
    "scaleCapability": [
      "Medium",
      "Small"
    ],
    "collaborationPreference": "Team",
    "youthEngagementExperience": true,
    "teachingExperience": true,
    "licensingInsurance": false,
    "availabilityStatus": "Semi-Available",
    "budgetRange": "$5,000 - $18,000",
    "notableProjects": "RedLine Chicano Art Archive Series, Community Printmaking Workshops",
    "references": "Metropolitan State University Fine Art Department",
    "bipocIdentity": "Chicano / Latino",
    "communityAffiliations": "RedLine Contemporary Art Center, MSU Denver Faculty",
    "accessibilityNeeds": "Requires wheelchair accessible studio and setups",
    "vettingStatus": "Vetted",
    "lastContacted": "2026-05-02",
    "linkedin": "https://www.linkedin.com/in/javier-flores-printmaker",
    "sculptureInstallationExperience": true,
    "galleryInstallationExperience": true,
    "curationExperience": true,
    "otherInstallationExperience": false,
    "capabilitiesDescription": "Highly skilled in printmaking, woodcut, and custom frame builds. Strong academic curation background. Requires accessible installation facilities."
  },
  {
    "id": "ILA-2026-0008",
    "firstName": "Steven",
    "lastName": "Yazzie",
    "alias": "Steven Yazzie",
    "pronouns": "he/him",
    "email": "steven@yazziestudio.com",
    "phone": "303-555-0108",
    "website": "https://yazziestudio.com",
    "instagram": "@stevenyazzie",
    "city": "Denver",
    "state": "CO",
    "primaryMedium": "Video",
    "secondaryMediums": [
      "Painting",
      "Installation",
      "Public Art"
    ],
    "artStyles": [
      "Conceptual",
      "Realism",
      "Indigenous Modernism"
    ],
    "themes": [
      "Environment",
      "Indigenous Sovereignty",
      "Land History",
      "History"
    ],
    "experienceLevel": "Established",
    "publicArtExperience": true,
    "muralExperience": false,
    "communityEngagementExperience": true,
    "scaleCapability": [
      "Large",
      "Medium",
      "Small"
    ],
    "collaborationPreference": "Both",
    "youthEngagementExperience": true,
    "teachingExperience": true,
    "licensingInsurance": true,
    "availabilityStatus": "Booked",
    "budgetRange": "$25,000 - $100,000",
    "notableProjects": "Denver Art Museum Indigenous Artist Residency, National Park Video Installations",
    "references": "DAM Native Art Curator",
    "bipocIdentity": "Indigenous / Dine (Navajo) / Laguna Pueblo",
    "communityAffiliations": "RedLine Alumnus, Native American Artist Association",
    "accessibilityNeeds": "None",
    "vettingStatus": "Vetted",
    "lastContacted": "2026-04-28",
    "linkedin": "https://www.linkedin.com/in/steven-yazzie-studio",
    "sculptureInstallationExperience": true,
    "galleryInstallationExperience": true,
    "curationExperience": true,
    "otherInstallationExperience": true,
    "capabilitiesDescription": "Professional video editor and videographer. Proficient in indoor projection mapping, sound engineering, multi-screen video installations, and large-scale public art."
  },
  {
    "id": "ILA-2026-0009",
    "firstName": "Kristina",
    "lastName": "Maldonado",
    "alias": "Kristina Maldonado Bad Hand",
    "pronouns": "she/her",
    "email": "kristina@badhand.com",
    "phone": "303-555-0109",
    "website": "https://badhand.studio",
    "instagram": "@badhandart",
    "city": "Denver",
    "state": "CO",
    "primaryMedium": "Illustration",
    "secondaryMediums": [
      "Mural",
      "Graphic Design",
      "Youth Mentorship"
    ],
    "artStyles": [
      "Graphic",
      "Street Art",
      "Comic Realism"
    ],
    "themes": [
      "Community",
      "Culture",
      "Indigenous Sovereignty",
      "Youth"
    ],
    "experienceLevel": "Mid-Career",
    "publicArtExperience": true,
    "muralExperience": true,
    "communityEngagementExperience": true,
    "scaleCapability": [
      "Medium",
      "Large"
    ],
    "collaborationPreference": "Both",
    "youthEngagementExperience": true,
    "teachingExperience": true,
    "licensingInsurance": true,
    "availabilityStatus": "Available",
    "budgetRange": "$8,000 - $30,000",
    "notableProjects": "Denver Public Library Indigenous Mural, RedLine Community Mural Project",
    "references": "Denver Public Library Arts Lead",
    "bipocIdentity": "Indigenous / Sicangu Lakota / Cherokee",
    "communityAffiliations": "RedLine Arts Partner, Denver Indigenous Advocates",
    "accessibilityNeeds": "None",
    "vettingStatus": "Vetted",
    "lastContacted": "2026-05-14",
    "linkedin": "https://www.linkedin.com/in/kristina-maldonado-bad-hand",
    "sculptureInstallationExperience": false,
    "galleryInstallationExperience": true,
    "curationExperience": true,
    "otherInstallationExperience": false,
    "capabilitiesDescription": "Expert graphic designer and digital illustrator. Experienced in coordinating youth-focused community mural projects and cultural storytelling exhibitions."
  },
  {
    "id": "ILA-2026-0010",
    "firstName": "Max",
    "lastName": "Kauffman",
    "alias": "Max Kauffman",
    "pronouns": "he/him",
    "email": "max@kauffmanart.com",
    "phone": "303-555-0110",
    "website": "https://kauffmanart.com",
    "instagram": "@kauffmanart",
    "city": "Denver",
    "state": "CO",
    "primaryMedium": "Mural",
    "secondaryMediums": [
      "Fine Art",
      "Installation",
      "Curating"
    ],
    "artStyles": [
      "Abstract",
      "Organic Abstraction",
      "Geometric Folk"
    ],
    "themes": [
      "Environment",
      "Structure",
      "Storytelling",
      "Spirituality"
    ],
    "experienceLevel": "Established",
    "publicArtExperience": true,
    "muralExperience": true,
    "communityEngagementExperience": true,
    "scaleCapability": [
      "Large",
      "Medium"
    ],
    "collaborationPreference": "Both",
    "youthEngagementExperience": false,
    "teachingExperience": false,
    "licensingInsurance": true,
    "availabilityStatus": "Available",
    "budgetRange": "$12,000 - $40,000",
    "notableProjects": "Crush Walls Mural Artist, Westword Featured Folk Abstraction Exhibition",
    "references": "RiNo Art District Director",
    "bipocIdentity": "White / Caucasian",
    "communityAffiliations": "Westword Creative Network, Local Galleries Group",
    "accessibilityNeeds": "None",
    "vettingStatus": "Vetted",
    "lastContacted": "2026-05-11",
    "linkedin": "https://www.linkedin.com/in/max-kauffman-art",
    "sculptureInstallationExperience": true,
    "galleryInstallationExperience": true,
    "curationExperience": true,
    "otherInstallationExperience": true,
    "capabilitiesDescription": "Prolific gallery curator and exhibition designer. Experienced in wood and metal sculptural assemblages, scaffolding setups, and mural paintings on rough brick/concrete."
  },
  {
    "id": "ILA-2026-0011",
    "firstName": "Jessica",
    "lastName": "Forrestal",
    "alias": "Jessica Forrestal",
    "pronouns": "she/her",
    "email": "jessica@forrestalart.com",
    "phone": "303-555-0111",
    "website": "https://forrestalart.com",
    "instagram": "@jessicaforrestal",
    "city": "Denver",
    "state": "CO",
    "primaryMedium": "Wall Drawing",
    "secondaryMediums": [
      "Mural",
      "Illustration",
      "Sculpture"
    ],
    "artStyles": [
      "Graphic",
      "Technical Illustration",
      "Bold Black & White"
    ],
    "themes": [
      "Technology",
      "Consumerism",
      "Structure",
      "Industrialization"
    ],
    "experienceLevel": "Mid-Career",
    "publicArtExperience": true,
    "muralExperience": true,
    "communityEngagementExperience": true,
    "scaleCapability": [
      "Medium",
      "Large"
    ],
    "collaborationPreference": "Solo",
    "youthEngagementExperience": true,
    "teachingExperience": true,
    "licensingInsurance": true,
    "availabilityStatus": "Available",
    "budgetRange": "$8,000 - $25,000",
    "notableProjects": "Museum of Outdoor Arts Wall Installation, Westword Solo Feature Showcase",
    "references": "MOA Director of Exhibitions",
    "bipocIdentity": "Prefer not to say",
    "communityAffiliations": "Denver Art Museum Creative Guild, Local Galleries Group",
    "accessibilityNeeds": "None",
    "vettingStatus": "Vetted",
    "lastContacted": "2026-05-11",
    "linkedin": "https://www.linkedin.com/in/jessica-forrestal",
    "sculptureInstallationExperience": true,
    "galleryInstallationExperience": true,
    "curationExperience": false,
    "otherInstallationExperience": true,
    "capabilitiesDescription": "Specializes in hand-drawn interactive murals and diagrammatic wall drawings. Experienced in structural sculpture fabrication and custom wooden builds."
  },
  {
    "id": "ILA-2026-0012",
    "firstName": "Molly",
    "lastName": "Bounds",
    "alias": "Molly Bounds",
    "pronouns": "she/her",
    "email": "molly@boundsart.com",
    "phone": "303-555-0112",
    "website": "https://boundsart.com",
    "instagram": "@mollybounds",
    "city": "Denver",
    "state": "CO",
    "primaryMedium": "Mural",
    "secondaryMediums": [
      "Painting",
      "Printmaking",
      "Illustration"
    ],
    "artStyles": [
      "Graphic",
      "Narrative Realism",
      "Folk Art"
    ],
    "themes": [
      "Social Justice",
      "Power Structures",
      "Feminine Agency",
      "Community"
    ],
    "experienceLevel": "Established",
    "publicArtExperience": true,
    "muralExperience": true,
    "communityEngagementExperience": true,
    "scaleCapability": [
      "Large",
      "Medium"
    ],
    "collaborationPreference": "Both",
    "youthEngagementExperience": true,
    "teachingExperience": false,
    "licensingInsurance": true,
    "availabilityStatus": "Available",
    "budgetRange": "$12,000 - $35,000",
    "notableProjects": "Westword Featured Mural Series, Civic Center Park Mural Co-Design",
    "references": "Civic Center Conservancy Program Manager",
    "bipocIdentity": "Prefer not to say",
    "communityAffiliations": "Westword Creative Network, Local Artist Co-ops",
    "accessibilityNeeds": "None",
    "vettingStatus": "Vetted",
    "lastContacted": "2026-05-11",
    "linkedin": "https://www.linkedin.com/in/molly-bounds-denver",
    "sculptureInstallationExperience": false,
    "galleryInstallationExperience": true,
    "curationExperience": false,
    "otherInstallationExperience": false,
    "capabilitiesDescription": "Extensive printmaking and screen-printing workshop capabilities. Experienced in large-scale lift operations for multi-story exterior mural painting."
  },
  {
    "id": "ILA-2026-0013",
    "firstName": "Caleb",
    "lastName": "Hahne",
    "alias": "Caleb Hahne Quintana",
    "pronouns": "he/him",
    "email": "caleb@hahne.studio",
    "phone": "303-555-0113",
    "website": "https://calebhahne.com",
    "instagram": "@calebhahne",
    "city": "Denver",
    "state": "CO",
    "primaryMedium": "Fine Art",
    "secondaryMediums": [
      "Painting",
      "Mural",
      "Illustration"
    ],
    "artStyles": [
      "Contemporary Realism",
      "Abstract Minimalist"
    ],
    "themes": [
      "Culture",
      "Memory",
      "Sorrow",
      "Landscape"
    ],
    "experienceLevel": "Established",
    "publicArtExperience": true,
    "muralExperience": true,
    "communityEngagementExperience": false,
    "scaleCapability": [
      "Medium",
      "Large"
    ],
    "collaborationPreference": "Solo",
    "youthEngagementExperience": false,
    "teachingExperience": false,
    "licensingInsurance": true,
    "availabilityStatus": "Booked",
    "budgetRange": "$15,000 - $60,000",
    "notableProjects": "Denver Art Museum Permanent Collection Acquisition, Westword Solo Cover Story",
    "references": "Museum Curator",
    "bipocIdentity": "Latino / Hispanic",
    "communityAffiliations": "Westword Creative Network, International Gallery Network",
    "accessibilityNeeds": "None",
    "vettingStatus": "Vetted",
    "lastContacted": "2026-05-11",
    "linkedin": "https://www.linkedin.com/in/calebhahne",
    "sculptureInstallationExperience": false,
    "galleryInstallationExperience": true,
    "curationExperience": false,
    "otherInstallationExperience": false,
    "capabilitiesDescription": "Adept at fine art painting, studio practices, and indoor murals. Deep experience in high-end gallery prep, canvas stretching, and museum exhibition layouts."
  },
  {
    "id": "ILA-2026-0014",
    "firstName": "Pedro",
    "lastName": "Barrios",
    "alias": "Pedro Barrios",
    "pronouns": "he/him",
    "email": "pedro@barriosart.com",
    "phone": "303-555-0114",
    "website": "https://barriosart.com",
    "instagram": "@pedro_barrios_art",
    "city": "Denver",
    "state": "CO",
    "primaryMedium": "Mural",
    "secondaryMediums": [
      "Curation",
      "Design",
      "Consultancy"
    ],
    "artStyles": [
      "Abstract",
      "Geometrical Pop",
      "Vibrant Surrealism"
    ],
    "themes": [
      "Community",
      "Culture",
      "Connection",
      "Movement"
    ],
    "experienceLevel": "Established",
    "publicArtExperience": true,
    "muralExperience": true,
    "communityEngagementExperience": true,
    "scaleCapability": [
      "Large",
      "Medium"
    ],
    "collaborationPreference": "Both",
    "youthEngagementExperience": true,
    "teachingExperience": false,
    "licensingInsurance": true,
    "availabilityStatus": "Available",
    "budgetRange": "$15,000 - $50,000",
    "notableProjects": "Denver Public Library Mural Collaborative, ILA Gallery Co-Curation Project",
    "references": "ILA Gallery Co-Director",
    "bipocIdentity": "Latino (Venezuelan)",
    "communityAffiliations": "ILA Gallery Network Co-founder, Westword 100 Creatives",
    "accessibilityNeeds": "None",
    "vettingStatus": "Vetted",
    "lastContacted": "2026-05-11",
    "linkedin": "https://www.linkedin.com/in/pedro-barrios-denver",
    "sculptureInstallationExperience": false,
    "galleryInstallationExperience": true,
    "curationExperience": true,
    "otherInstallationExperience": true,
    "capabilitiesDescription": "Co-founder of ILA Gallery with years of professional curation, art consultancy, and interior/exterior gallery layout design experience."
  },
  {
    "id": "ILA-2026-0015",
    "firstName": "Jolt",
    "lastName": "Garden",
    "alias": "Jolt (Guerilla Garden)",
    "pronouns": "he/him",
    "email": "jolt@guerillagarden.com",
    "phone": "303-555-0115",
    "website": "https://guerillagarden.com",
    "instagram": "@guerillagarden",
    "city": "Chicano Park / Denver",
    "state": "CO",
    "primaryMedium": "Mural",
    "secondaryMediums": [
      "Graffiti",
      "Street Art",
      "Teaching",
      "Youth Mentorship"
    ],
    "artStyles": [
      "Graffiti",
      "Street Art",
      "Vibrant Typography"
    ],
    "themes": [
      "Chicano History",
      "Social Justice",
      "Community",
      "Culture"
    ],
    "experienceLevel": "Established",
    "publicArtExperience": true,
    "muralExperience": true,
    "communityEngagementExperience": true,
    "scaleCapability": [
      "Large",
      "Medium"
    ],
    "collaborationPreference": "Both",
    "youthEngagementExperience": true,
    "teachingExperience": true,
    "licensingInsurance": true,
    "availabilityStatus": "Available",
    "budgetRange": "$15,000 - $45,000",
    "notableProjects": "Monumental Mural in Morrison Road Cultural District, Chicano Park Denver Monument",
    "references": "Denver Councilman District 3",
    "bipocIdentity": "Chicano / Latino",
    "communityAffiliations": "Guerilla Garden Founder, RiNo Art District Street Art Coalition",
    "accessibilityNeeds": "None",
    "vettingStatus": "Vetted",
    "lastContacted": "2026-05-11",
    "linkedin": "https://www.linkedin.com/in/jolt-guerilla-garden",
    "sculptureInstallationExperience": true,
    "galleryInstallationExperience": true,
    "curationExperience": true,
    "otherInstallationExperience": true,
    "capabilitiesDescription": "Founder of Guerilla Garden. Extensive knowledge in community activism, historic preservation, youth teaching, large-scale spray painting, and urban sculpture."
  },
  {
    "id": "ILA-2026-0016",
    "firstName": "Gamma",
    "lastName": "Acosta",
    "alias": "Gamma Acosta",
    "pronouns": "he/him",
    "email": "gamma@acostamurals.com",
    "phone": "303-555-0116",
    "website": "https://gammaproject.com",
    "instagram": "@gammagallery",
    "city": "Denver",
    "state": "CO",
    "primaryMedium": "Mural",
    "secondaryMediums": [
      "Street Art",
      "Photorealism",
      "Airbrush"
    ],
    "artStyles": [
      "Photorealism",
      "Street Art",
      "Gothic Surrealism"
    ],
    "themes": [
      "Culture",
      "Memory",
      "Sorrow",
      "Community"
    ],
    "experienceLevel": "Established",
    "publicArtExperience": true,
    "muralExperience": true,
    "communityEngagementExperience": false,
    "scaleCapability": [
      "Large",
      "Medium"
    ],
    "collaborationPreference": "Solo",
    "youthEngagementExperience": false,
    "teachingExperience": false,
    "licensingInsurance": true,
    "availabilityStatus": "Available",
    "budgetRange": "$20,000 - $80,000",
    "notableProjects": "Peyton Manning Monumental Mural in Denver, RiNo Art District Alley Headliner Wall",
    "references": "RiNo Art District Lead Coordinator",
    "bipocIdentity": "Latino",
    "communityAffiliations": "Denver Muralists Coalition, International Street Art Roster",
    "accessibilityNeeds": "None",
    "vettingStatus": "Vetted",
    "lastContacted": "2026-05-11",
    "linkedin": "https://www.linkedin.com/in/gamma-acosta-muralist",
    "sculptureInstallationExperience": false,
    "galleryInstallationExperience": true,
    "curationExperience": false,
    "otherInstallationExperience": false,
    "capabilitiesDescription": "Highly skilled photorealistic airbrush and muralist. Capable of painting massive scale portraits on high scaffolding or industrial boom lifts."
  },
  {
    "id": "ILA-2026-0017",
    "firstName": "Austin",
    "lastName": "Zucchini-Fowler",
    "alias": "Austin Zucchini-Fowler",
    "pronouns": "he/him",
    "email": "austin@zfart.com",
    "phone": "303-555-0117",
    "website": "https://zfart.com",
    "instagram": "@austinzart",
    "city": "Denver",
    "state": "CO",
    "primaryMedium": "Mural",
    "secondaryMediums": [
      "Illustration",
      "Fine Art",
      "Community Event Art"
    ],
    "artStyles": [
      "Pointillism",
      "Realism",
      "Vibrant Pop"
    ],
    "themes": [
      "Community",
      "Hope",
      "Gratitude",
      "Healthcare Workers"
    ],
    "experienceLevel": "Mid-Career",
    "publicArtExperience": true,
    "muralExperience": true,
    "communityEngagementExperience": true,
    "scaleCapability": [
      "Medium",
      "Large"
    ],
    "collaborationPreference": "Both",
    "youthEngagementExperience": true,
    "teachingExperience": false,
    "licensingInsurance": true,
    "availabilityStatus": "Available",
    "budgetRange": "$10,000 - $30,000",
    "notableProjects": "\"Gratitude\" Mural Series for healthcare workers, Denver Art District Box Art series",
    "references": "Saint Joseph Hospital Art Advisory Committee",
    "bipocIdentity": "White / Caucasian",
    "communityAffiliations": "Denver Street Art Coalition, Civic Art Advisory Board",
    "accessibilityNeeds": "None",
    "vettingStatus": "Vetted",
    "lastContacted": "2026-05-11",
    "linkedin": "https://www.linkedin.com/in/austin-zucchini-fowler",
    "sculptureInstallationExperience": false,
    "galleryInstallationExperience": true,
    "curationExperience": false,
    "otherInstallationExperience": true,
    "capabilitiesDescription": "Experienced in commercial art licensing, branding partnerships, and fast-paced public mural installations using a signature pointillism style."
  },
  {
    "id": "ILA-2026-0018",
    "firstName": "Kenzie",
    "lastName": "Sitterud",
    "alias": "Kenzie Sitterud",
    "pronouns": "they/them",
    "email": "kenzie@sitterudstudio.com",
    "phone": "303-555-0118",
    "website": "https://kenziesitterud.com",
    "instagram": "@kenziesitterud",
    "city": "Denver",
    "state": "CO",
    "primaryMedium": "Installation",
    "secondaryMediums": [
      "Mixed Media",
      "Design",
      "Public Sculpture"
    ],
    "artStyles": [
      "Conceptual",
      "Minimalist",
      "Geometrical Spatial"
    ],
    "themes": [
      "Environment",
      "Structure",
      "Accessibility",
      "Queer Identity"
    ],
    "experienceLevel": "Mid-Career",
    "publicArtExperience": true,
    "muralExperience": false,
    "communityEngagementExperience": true,
    "scaleCapability": [
      "Medium",
      "Large",
      "Small"
    ],
    "collaborationPreference": "Both",
    "youthEngagementExperience": true,
    "teachingExperience": true,
    "licensingInsurance": true,
    "availabilityStatus": "Available",
    "budgetRange": "$15,000 - $40,000",
    "notableProjects": "Denver International Airport Temporary Terminal Art installation, ILA Gallery Residency Group Exhibition",
    "references": "Denver International Airport Art Manager",
    "bipocIdentity": "Queer / Transgender (Self-identified)",
    "communityAffiliations": "Local Queer Art Network, Denver Contemporary Galleries Group",
    "accessibilityNeeds": "High contrast environments preferred for setups",
    "vettingStatus": "Vetted",
    "lastContacted": "2026-05-11",
    "linkedin": "https://www.linkedin.com/in/kenzie-sitterud",
    "sculptureInstallationExperience": true,
    "galleryInstallationExperience": true,
    "curationExperience": true,
    "otherInstallationExperience": true,
    "capabilitiesDescription": "Professional installation artist specializing in immersive, high-concept spatial design, wood and metal fabrication, and accessibility integrations."
  }
];

export const defaultFundingSources = [
  {
    id: 'f1',
    title: 'P.S. You Are Here (PSYAH)',
    provider: 'Denver Arts & Venues (Denver County)',
    type: 'Grant',
    amount: 'Up to $10,000',
    status: 'Open Soon',
    openDate: '2026-06-01',
    closeDate: '2026-07-15',
    description: 'Funds community-led outdoor public space projects, neighborhood activations, and street art across Denver County.',
    url: 'ArtsAndVenuesDenver.com/Grants'
  },
  {
    id: 'f2',
    title: 'DENVER CREATES Fund',
    provider: 'Denver Arts & Venues (Denver County)',
    type: 'Grant',
    amount: 'Varies',
    status: 'Open',
    openDate: '2026-05-01',
    closeDate: '2026-06-30',
    description: 'Direct investments in the Denver County creative sector supporting economic vitality and broadening access to arts.',
    url: 'ArtsAndVenuesDenver.com/Grants'
  },
  {
    id: 'f3',
    title: 'Five Points Jazz Grants',
    provider: 'Denver Arts & Venues (Denver County)',
    type: 'Grant',
    amount: 'Micro-grants',
    status: 'Rolling',
    openDate: '2026-01-01',
    closeDate: '2026-12-31',
    description: 'Supports year-round programming honoring the history of jazz in the Five Points neighborhood.',
    url: 'ArtsAndVenuesDenver.com/Grants'
  },
  {
    id: 'f4',
    title: 'Denver Public Art RFQ - Central Library',
    provider: 'Denver Public Art / CaFÉ (Denver County)',
    type: 'RFQ / Commission',
    amount: '$150,000',
    status: 'Active on CaFÉ',
    openDate: '2026-05-10',
    closeDate: '2026-06-20',
    description: 'Call for Entry (CaFÉ) seeking qualifications for a monumental public art installation at the newly renovated branch.',
    url: 'CallForEntry.org'
  },
  {
    id: 'f5',
    title: 'Climate Resilient Neighborhoods Mini Grant',
    provider: 'City of Denver (Denver County)',
    type: 'Grant',
    amount: 'Up to $5,000',
    status: 'Open',
    openDate: '2026-05-15',
    closeDate: '2026-07-01',
    description: 'Funding for projects raising awareness about climate resilience, perfect for green/solar art installations.',
    url: 'Denvergov.org'
  },
  {
    id: 'f6',
    title: 'Artspace Colorado Springs Mural RFQ',
    provider: 'Artspace Colorado Springs (El Paso County)',
    type: 'RFQ / Commission',
    amount: '$31,500 - $48,000',
    status: 'Open',
    openDate: '2026-06-01',
    closeDate: '2026-08-15',
    description: 'Call for local artists to design and execute two prominent exterior wall murals at the new Artspace community.',
    url: 'CallForEntry.org'
  },
  {
    id: 'f7',
    title: 'Creative Neighborhoods Program',
    provider: 'Boulder Arts Commission (Boulder County)',
    type: 'Grant',
    amount: 'Up to $5,000',
    status: 'Open',
    openDate: '2026-05-20',
    closeDate: '2026-07-31',
    description: 'Supports resident-led, artist-collaborated community projects bringing creative activation to Boulder neighborhoods.',
    url: 'Boulderarts.org'
  },
  {
    id: 'f8',
    title: 'Transformer Cabinet Mural Project',
    provider: 'Fort Collins Art in Public Places (Larimer County)',
    type: 'RFQ / Commission',
    amount: 'Up to $2,000',
    status: 'Rolling',
    openDate: '2026-01-01',
    closeDate: '2026-12-31',
    description: 'Graffiti abatement initiative transforming utility and transformer boxes into public murals along the Fort Collins grid.',
    url: 'Fcgov.com/Artspublicplaces'
  },
  {
    id: 'f9',
    title: 'Art on the Corner Outdoor Sculpture Exhibit',
    provider: 'Grand Junction Commission (Mesa County)',
    type: 'Exhibition / Sale',
    amount: 'Stipend + Awards',
    status: 'Open',
    openDate: '2026-04-01',
    closeDate: '2026-06-30',
    description: 'Competitive, year-round outdoor 3D sculpture exhibition displaying works on Main Street in downtown Grand Junction.',
    url: 'Gjcity.org'
  },
  {
    id: 'f10',
    title: 'Steamboat Springs Artist-in-Residence',
    provider: 'Steamboat Springs Arts Council (Routt County)',
    type: 'Residency / Stipend',
    amount: '$2,500 stipend + lodging',
    status: 'Open',
    openDate: '2026-06-01',
    closeDate: '2026-08-30',
    description: 'Fall residency opportunity in Steamboat Springs for visual artists and sculptors.',
    url: 'SteamboatCreates.org'
  },
  {
    id: 'f11',
    title: 'Art on the Riverfront Trail Underpass Mural',
    provider: 'Grand Junction / aRT (Mesa County)',
    type: 'RFQ / Commission',
    amount: '$1,000 stipend',
    status: 'Active on CaFÉ',
    openDate: '2026-05-12',
    closeDate: '2026-07-10',
    description: 'Biennial mural commission targeting trail underpasses along the Colorado Riverfront Trail system.',
    url: 'CallForEntry.org'
  },
  {
    id: 'f12',
    title: 'Aurora AIPP Consultant Design List',
    provider: 'City of Aurora (Arapahoe County)',
    type: 'Consulting / Commission',
    amount: '$55 / hour (Design Phase)',
    status: 'Active',
    openDate: '2026-03-01',
    closeDate: '2026-08-31',
    description: 'Joining the pre-approved Artist Consultant list to collaborate directly with municipal engineering and capital design teams.',
    url: 'Auroragov.org'
  },
  {
    id: 'f13',
    title: 'Salida Public Art Sculpture Commission',
    provider: 'City of Salida (Chaffee County)',
    type: 'RFQ / Commission',
    amount: '$15,000',
    status: 'Open',
    openDate: '2026-06-10',
    closeDate: '2026-09-01',
    description: 'Outdoor sculpture call for the newly renovated F Street pedestrian plaza.',
    url: 'CityofSalida.com'
  },
  {
    id: 'f14',
    title: 'Telluride Arts District Small Grants',
    provider: 'Telluride Arts District (San Miguel County)',
    type: 'Grant',
    amount: 'Up to $2,000',
    status: 'Rolling',
    openDate: '2026-01-01',
    closeDate: '2026-12-31',
    description: 'Grants supporting local creatives, project expenses, and structural artistic development in the San Miguel County region.',
    url: 'Telluridearts.org'
  },
  {
    id: 'f15',
    title: 'Creative Industries Career Advancement Grant',
    provider: 'Colorado Creative Industries (Statewide)',
    type: 'Grant',
    amount: 'Up to $2,500',
    status: 'Active',
    openDate: '2026-04-01',
    closeDate: '2026-09-30',
    description: 'Statewide professional development grant supporting creative business owners, marketing boosts, and skill enhancement.',
    url: 'Oedit.colorado.gov'
  },
  {
    id: 'f16',
    title: 'Pueblo Downtown Mural Festival Commission',
    provider: 'Pueblo Arts Alliance (Pueblo County)',
    type: 'Commission',
    amount: 'Varies',
    status: 'Open',
    openDate: '2026-05-01',
    closeDate: '2026-06-25',
    description: 'Open call for muralists and installers to participate in the annual creative corridor downtown revitalization program.',
    url: 'Puebloarts.org'
  },
  {
    id: 'f17',
    title: 'Carbondale Creative District Mural Commission',
    provider: 'Carbondale Arts (Garfield County)',
    type: 'Commission',
    amount: '$8,000',
    status: 'Open',
    openDate: '2026-06-01',
    closeDate: '2026-08-15',
    description: 'Seeking a muralist to paint the exterior of the new creative community hub in Carbondale.',
    url: 'CarbondaleArts.com'
  },
  {
    id: 'f18',
    title: 'Colorado Film Festival Sponsorship Support',
    provider: 'Colorado Office of Film, Television and Media (Statewide)',
    type: 'Sponsorship / Grant',
    amount: 'Varies',
    status: 'Open',
    openDate: '2026-05-15',
    closeDate: '2026-08-01',
    description: 'Financial sponsorship and marketing assistance program for communities hosting, expanding, or launching film festivals in Colorado.',
    url: 'Colorado.gov/film'
  },
  {
    id: 'f19',
    title: 'Denver Film Society Fiscal Sponsorship & Grants',
    provider: 'Denver Film / CFVA (Denver County)',
    type: 'Grant / Fiscal Support',
    amount: 'Varies',
    status: 'Rolling',
    openDate: '2026-01-01',
    closeDate: '2026-12-31',
    description: 'Provides direct grants, networking programs, educational sponsorships, and structural support for Colorado-based filmmakers and productions.',
    url: 'DenverFilm.org'
  },
  {
    id: 'f20',
    title: 'Westwood Creative Corridor Activation',
    provider: 'BuCu West / Denver Arts & Venues (Denver County)',
    type: 'Grant',
    amount: 'Up to $12,000',
    status: 'Open',
    openDate: '2026-06-15',
    closeDate: '2026-08-01',
    description: 'Funding community-led outdoor public art installations, stenciling, and street furniture in the Westwood neighborhood.',
    url: 'BuCuWest.org'
  },
  {
    id: 'f21',
    title: 'Red Hotel Local Artist Submission',
    provider: 'Boulder County / Red Hotel Art Program',
    type: 'Exhibition Call',
    amount: 'Stipend + Sales Revenue',
    status: 'Open',
    openDate: '2026-05-25',
    closeDate: '2026-08-31',
    description: 'Rotating quarterly exhibition inside the newly opened Red Hotel in Boulder. Seeking paintings, photography, sculpture, and mixed media in abstract, modern, western, and nature styles.',
    url: 'form.jotform.com/260954956677073',
    whoShouldApply: 'Boulder County painters, photographers, and sculptors specializing in modern, western, and nature abstract styles.'
  },
  {
    id: 'f22',
    title: 'Erie Town Plaza Sculpture Commission',
    provider: 'Erie Arts & Coal Creek District (Weld/Boulder County)',
    type: 'RFQ / Commission',
    amount: '$25,000',
    status: 'Open',
    openDate: '2026-05-15',
    closeDate: '2026-09-15',
    description: 'Call for qualifications for a prominent outdoor sculpture at the center of the newly expanded Town Plaza in Erie. Open to regional Front Range metal and wood sculptors.',
    url: 'CallForEntry.org',
    whoShouldApply: 'Metal and wood sculptors with public art experience interested in permanent outdoor placement.'
  },
  {
    id: 'f23',
    title: 'Arvada Center Lobby Mural Call',
    provider: 'Arvada Center for the Arts and Humanities (Jefferson County)',
    type: 'RFQ / Commission',
    amount: '$12,000',
    status: 'Open',
    openDate: '2026-06-05',
    closeDate: '2026-07-25',
    description: 'Call for muralists to design a large interior lobby mural that showcases the community culture and natural beauty of Arvada. Open to Colorado-based muralists.',
    url: 'ArvadaCenter.org/calls',
    whoShouldApply: 'Colorado muralists and painters specializing in community storytelling and natural landscapes.'
  },
  {
    id: 'comm-post-1',
    title: 'RiNo Art District Community Mural',
    provider: 'ILA Gallery Network',
    type: 'RFQ / Commission',
    amount: '$25,000',
    status: 'Open',
    openDate: '2026-06-15',
    closeDate: '2026-08-30',
    description: 'We are seeking an experienced muralist to paint a large exterior brick wall in the RiNo Art District. The project requires Geometrical Pop or Vibrant Surrealism style.',
    url: 'mailto:admin@ila-gallery.com',
    whoShouldApply: 'Vetted muralists with experience in large scale work.',
    clientId: 'ILA-CLIENT-ADMIN-001',
    isCommunityPost: true,
    submittedAt: '2026-06-15T12:00:00.000Z',
    contactEmail: 'admin@ila-gallery.com',
    contactPhone: '303-555-1001',
    contactPerson: 'ILA Admin',
    mediums: ['Mural', 'Painting'],
    styles: ['Abstract', 'Geometrical Pop', 'Vibrant Surrealism'],
    capabilities: ['Muralist', 'Curation'],
    scale: 'Large',
    address: '2601 Larimer St, Denver, CO 80205',
    city: 'Denver',
    latitude: 39.7588,
    longitude: -104.9856,
    permittingRequirements: 'Denver County construction/encroachment permit required.',
    permittingPayer: 'Client',
    projectRequirements: 'Muralist must provide their own scissor lift/scaffolding and paint supplies.',
    attachedBriefs: []
  }
];

export const defaultProjects = [
  {
    id: 'p1',
    name: '303 ArtWay - Heritage Archway (Denver County)',
    status: 'Planning',
    budget: '$50,000',
    funding: 'Pending PSYAH Grant',
    openDate: '2026-06-01',
    closeDate: '2026-08-31',
    url: 'ArtsAndVenuesDenver.com/Grants'
  },
  {
    id: 'p2',
    name: 'Local Legends Utility Box Series (Denver County)',
    status: 'Approved',
    budget: '$15,000',
    funding: 'Secured',
    openDate: '2026-05-15',
    closeDate: '2026-07-01',
    url: 'ArtsAndVenuesDenver.com/Grants'
  },
  {
    id: 'p3',
    name: 'Interactive Youth Pavement Art (Denver County)',
    status: 'Concept',
    budget: '$5,000',
    funding: 'Unfunded',
    openDate: '2026-07-01',
    closeDate: '2026-09-30',
    url: 'ArtsAndVenuesDenver.com/Grants'
  },
  {
    id: 'p4',
    name: 'Artspace Colorado Springs Mural (El Paso County)',
    status: 'RFQ Active',
    budget: '$45,000',
    funding: 'Approved Municipal Budget',
    openDate: '2026-05-01',
    closeDate: '2026-06-15',
    url: 'CallForEntry.org'
  },
  {
    id: 'p5',
    name: 'Creative Neighborhoods Block Activation (Boulder County)',
    status: 'Approved',
    budget: '$5,000',
    funding: 'Secured (Arts Commission)',
    openDate: '2026-05-20',
    closeDate: '2026-07-31',
    url: 'Boulderarts.org'
  },
  {
    id: 'p6',
    name: 'Transformer Cabinet Series (Larimer County)',
    status: 'Approved',
    budget: '$12,000',
    funding: 'APP Abatement Fund',
    openDate: '2026-05-01',
    closeDate: '2026-08-15',
    url: 'Fcgov.com/Artspublicplaces'
  },
  {
    id: 'p7',
    name: 'Art on the Corner Trail Exhibit (Mesa County)',
    status: 'Concept',
    budget: '$25,000',
    funding: 'Multi-source Pending',
    openDate: '2026-06-15',
    closeDate: '2026-10-31',
    url: 'Gjcity.org'
  },
  {
    id: 'p8',
    name: 'Riverfront Trail Underpass Mural (Mesa County)',
    status: 'Approved',
    budget: '$10,000',
    funding: 'aRT Fund Secured',
    openDate: '2026-05-12',
    closeDate: '2026-07-10',
    url: 'CallForEntry.org'
  },
  {
    id: 'p9',
    name: 'Aurora Capital Design Consultation (Arapahoe County)',
    status: 'Planning',
    budget: '$8,500',
    funding: 'Authorized Budget',
    openDate: '2026-05-01',
    closeDate: '2026-08-31',
    url: 'Auroragov.org'
  },
  {
    id: 'p10',
    name: 'Art on the Commons Sculpture Setup (Jefferson County)',
    status: 'Approved',
    budget: '$10,000',
    funding: 'Lakewood Cultural Fund',
    openDate: '2026-04-15',
    closeDate: '2026-05-30',
    url: 'Lakewood.org'
  },
  {
    id: 'p11',
    name: 'Telluride Arts District Installation (San Miguel County)',
    status: 'Planning',
    budget: '$15,000',
    funding: 'Telluride Arts District Secured',
    openDate: '2026-06-01',
    closeDate: '2026-09-01',
    url: 'Telluridearts.org'
  },
  {
    id: 'p12',
    name: 'CCI Career Advancement Initiative (Statewide)',
    status: 'Concept',
    budget: '$25,000',
    funding: 'State Budget Pending',
    openDate: '2026-07-01',
    closeDate: '2026-09-30',
    url: 'Oedit.colorado.gov'
  },
  {
    id: 'p13',
    name: 'Pueblo Creative Corridor Revitalization (Pueblo County)',
    status: 'Planning',
    budget: '$30,000',
    funding: 'PAA Grant Pending',
    openDate: '2026-05-01',
    closeDate: '2026-06-25',
    url: 'Puebloarts.org'
  },
  {
    id: 'p14',
    name: 'Denver Film Festival Panel & Screening Block (Denver County)',
    status: 'Approved',
    budget: '$8,000',
    funding: 'Secured (Denver Film Society)',
    openDate: '2026-05-01',
    closeDate: '2026-07-15',
    url: 'Colorado.gov/film'
  },
  {
    id: 'p15',
    name: 'Sundance Indigenous Film Fellowships (Statewide)',
    status: 'Concept',
    budget: '$10,000',
    funding: 'Pending Co-Sponsor',
    openDate: '2026-06-01',
    closeDate: '2026-06-15',
    url: 'Sundance.org/apply'
  },
  {
    id: 'p16',
    name: 'Telluride Film Festival Regional Showcase (San Miguel County)',
    status: 'Planning',
    budget: '$15,000',
    funding: 'Telluride Arts District',
    openDate: '2026-05-15',
    closeDate: '2026-08-01',
    url: 'Colorado.gov/film'
  },
  {
    id: 'p17',
    name: 'Vail Film Festival Colorado Showcase (Eagle County)',
    status: 'Approved',
    budget: '$5,000',
    funding: 'Secured',
    openDate: '2026-05-01',
    closeDate: '2026-06-10',
    url: 'Colorado.gov/film'
  }
];// Load secure settings from Vite's production environment variables
const PRODUCTION_URL = import.meta.env.VITE_GOOGLE_SHEETS_SCRIPT_URL || 'https://script.google.com/macros/s/AKfycbzUSfTlX6zBG0sFC33ManpVaURqOP9sWYUxnfRMsTHEBCOsM44IYLkim348fkf0x_M/exec';
const API_ACCESS_TOKEN = import.meta.env.VITE_API_ACCESS_TOKEN || '';

// Helper to recursively sanitize strings to protect against XSS injections in the spreadsheet/emails
const sanitizeString = (str) => {
  if (typeof str !== 'string') return str;
  return str
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#x27;')
    .replace(/\//g, '&#x2F;');
};

const sanitizeValue = (val) => {
  if (val === null || val === undefined) return val;
  if (typeof val === 'string') {
    return sanitizeString(val);
  }
  if (Array.isArray(val)) {
    return val.map(item => sanitizeValue(item));
  }
  if (typeof val === 'object') {
    const sanitizedObj = {};
    for (const key in val) {
      if (Object.prototype.hasOwnProperty.call(val, key)) {
        // Exclude binary data strings like base64Data to preserve original images/files
        if (key === 'base64Data') {
          sanitizedObj[key] = val[key];
        } else {
          sanitizedObj[key] = sanitizeValue(val[key]);
        }
      }
    }
    return sanitizedObj;
  }
  return val;
};

export const getGoogleSheetsConfig = () => {
  let storedUrl = localStorage.getItem('303_artway_google_sheets_url');
  
  if (storedUrl && storedUrl.includes('AKfycbx12l6VP9IoTt03ZsrF4XOM__hQ-ecu7a5cnKeHx-gVyk3C3iN7eKEzJaL36n9ihYai')) {
    localStorage.removeItem('303_artway_google_sheets_url');
    storedUrl = null;
  }
  
  let url = storedUrl || PRODUCTION_URL;
  const isEnabled = localStorage.getItem('303_artway_google_sheets_enabled') !== 'false'; // Defaults to true
  
  if (!localStorage.getItem('303_artway_google_sheets_url')) {
    localStorage.setItem('303_artway_google_sheets_url', PRODUCTION_URL);
  }
  if (!localStorage.getItem('303_artway_google_sheets_enabled')) {
    localStorage.setItem('303_artway_google_sheets_enabled', 'true');
  }
  
  return { url, isEnabled };
};

export const saveGoogleSheetsConfig = (url, isEnabled) => {
  localStorage.setItem('303_artway_google_sheets_url', url);
  localStorage.setItem('303_artway_google_sheets_enabled', isEnabled ? 'true' : 'false');
};

const ensureFaalAliInjected = (list) => {
  if (!Array.isArray(list)) return list;
  
  const faalAliProfile = {
    firstName: "Faal",
    lastName: "Ali",
    email: "faal@eazy.media",
    username: "faalali",
    password: "Lifeline1",
    id: "ILA-2026-170361",
    alias: "eazy",
    pronouns: "he/him",
    phone: "7205466126",
    website: "https://www.eazy.media",
    instagram: "@fa_eazy",
    linkedin: "",
    city: "Denver",
    state: "CO",
    primaryMedium: "Film",
    secondaryMediums: ["Curation", "Video"],
    artStyles: ["Documentary / Non-Fiction", "Cinematic Narrative"],
    themes: ["Community", "Environment", "Culture"],
    experienceLevel: "Established",
    publicArtExperience: true,
    muralExperience: false,
    communityEngagementExperience: false,
    scaleCapability: ["Short Film", "Feature Film / Documentary", "Commercial / Brand Video"],
    collaborationPreference: "Both",
    youthEngagementExperience: false,
    teachingExperience: false,
    licensingInsurance: false,
    sculptureInstallationExperience: false,
    galleryInstallationExperience: false,
    curationExperience: true,
    otherInstallationExperience: true,
    digitalExperience: true,
    eventProductionExperience: false,
    capabilitiesDescription: "",
    availabilityStatus: "Available",
    budgetRange: "1500-10000",
    notableProjects: "",
    references: "",
    bipocIdentity: "Black / African American",
    communityAffiliations: "",
    accessibilityNeeds: "",
    vettingStatus: "New",
    lastContacted: "Never",
    workExamples: [],
    createdAt: "2026-06-15T06:43:37.036Z",
    submitterUid: "anonymous"
  };

  const existingIdx = list.findIndex(a => 
    a.id === 'ILA-2026-170361' || 
    a.username === 'faalali' || 
    (a.email && String(a.email).trim().toLowerCase() === 'faal@eazy.media')
  );

  let updated;
  if (existingIdx !== -1) {
    const existing = list[existingIdx];
    if (existing.username !== 'faalali' || existing.password !== 'Lifeline1' || existing.email !== 'faal@eazy.media') {
      const merged = {
        ...existing,
        username: 'faalali',
        password: 'Lifeline1',
        email: 'faal@eazy.media',
        firstName: existing.firstName || 'Faal',
        lastName: existing.lastName || 'Ali'
      };
      updated = [...list];
      updated[existingIdx] = merged;
      localStorage.setItem('303_artway_artists_v8', JSON.stringify(updated));
      return updated;
    }
    return list;
  } else {
    updated = [...list, faalAliProfile];
    localStorage.setItem('303_artway_artists_v8', JSON.stringify(updated));
    return updated;
  }
};

export const getArtists = () => {
  let stored = localStorage.getItem('303_artway_artists_v8');
  let loadedArtists = null;
  
  if (stored) {
    try {
      loadedArtists = JSON.parse(stored);
    } catch (e) {
      console.error("Failed to parse v8 artists cache", e);
    }
  } else {
    // Check for older version v7 to migrate
    const storedV7 = localStorage.getItem('303_artway_artists_v7');
    if (storedV7) {
      try {
        const v7Artists = JSON.parse(storedV7);
        loadedArtists = v7Artists.map(artist => {
          const username = artist.username || (artist.email ? artist.email.split('@')[0].toLowerCase() : artist.id.toLowerCase());
          const password = artist.password || artist.id;
          return {
            ...artist,
            username,
            password,
            bio: artist.bio || "",
            profilePicture: artist.profilePicture || ""
          };
        });
        localStorage.setItem('303_artway_artists_v8', JSON.stringify(loadedArtists));
      } catch (e) {
        console.error("Failed to migrate v7 artists", e);
      }
    }
  }

  if (loadedArtists) {
    // Check if any loaded artist is missing username/password/bio/profilePicture
    let modified = false;
    const upgraded = loadedArtists.map(artist => {
      let isUpgraded = false;
      const copy = { ...artist };
      if (!copy.username) {
        copy.username = (copy.email ? copy.email.split('@')[0].toLowerCase() : copy.id.toLowerCase());
        isUpgraded = true;
      }
      if (!copy.password) {
        copy.password = copy.id;
        isUpgraded = true;
      }
      if (copy.bio === undefined) {
        copy.bio = "";
        isUpgraded = true;
      }
      if (copy.profilePicture === undefined) {
        copy.profilePicture = "";
        isUpgraded = true;
      }
      if (isUpgraded) modified = true;
      return copy;
    });
    if (modified) {
      const injectedUpgraded = ensureFaalAliInjected(upgraded);
      localStorage.setItem('303_artway_artists_v8', JSON.stringify(injectedUpgraded));
      return injectedUpgraded;
    }
    return ensureFaalAliInjected(loadedArtists);
  }

  const portfolioUrls = [
    "https://caseykawaguchi.com",
    "https://jodieherrera.com",
    "https://iamdetour.com",
    "https://kokobayer.com",
    "https://armandosilva.com",
    "https://algrimeart.com",
    "https://redlineart.org/javier",
    "https://yazziestudio.com",
    "https://badhand.studio",
    "https://kauffmanart.com",
    "https://forrestalart.com",
    "https://boundsart.com",
    "https://calebhahne.com",
    "https://barriosart.com"
  ];
  const populated = defaultArtists.map((artist, idx) => {
    return {
      ...artist,
      portfolioUrl: artist.portfolioUrl || portfolioUrls[idx] || "",
      availabilityLastUpdated: artist.availabilityLastUpdated || "Jun 1, 2026, 10:30 AM",
      username: artist.username || (artist.email ? artist.email.split('@')[0].toLowerCase() : artist.id.toLowerCase()),
      password: artist.password || artist.id,
      bio: artist.bio || "",
      profilePicture: artist.profilePicture || ""
    };
  });
  const injectedPopulated = ensureFaalAliInjected(populated);
  localStorage.setItem('303_artway_artists_v8', JSON.stringify(injectedPopulated));
  return injectedPopulated;
};

export const getFundingSources = () => {
  const stored = localStorage.getItem('303_artway_funding_v10');
  let list = [];
  if (stored) {
    try {
      list = JSON.parse(stored);
    } catch (e) {
      console.error(e);
      list = [...defaultFundingSources];
    }
  } else {
    list = [...defaultFundingSources];
  }

  // Filter out closed official funding sources (non-community posts)
  const activeList = list.filter(src => {
    if (src.isCommunityPost) return true; // Keep community posts
    const isClosed = src.closeDate && new Date(src.closeDate + 'T23:59:00') < new Date();
    return !isClosed;
  });

  let modified = false;
  let upgradedList = activeList.map(src => {
    const defSrc = defaultFundingSources.find(ds => ds.id === src.id);
    if (defSrc && defSrc.url && !src.url) {
      modified = true;
      return { ...src, url: defSrc.url };
    }
    return src;
  });

  // Self-healing migration: append missing code-level defaults
  defaultFundingSources.forEach(defSrc => {
    const isClosed = defSrc.closeDate && new Date(defSrc.closeDate + 'T23:59:00') < new Date();
    if (!isClosed && !upgradedList.some(src => src.id === defSrc.id)) {
      upgradedList.push(defSrc);
      modified = true;
    }
  });

  if (modified || activeList.length !== list.length) {
    localStorage.setItem('303_artway_funding_v10', JSON.stringify(upgradedList));
  }
  return upgradedList;
};

export const getProjects = () => {
  const stored = localStorage.getItem('303_artway_projects_v9');
  if (stored) {
    const list = JSON.parse(stored);
    let modified = false;
    let upgradedList = list.map(proj => {
      const defProj = defaultProjects.find(dp => dp.id === proj.id);
      if (defProj && defProj.url && !proj.url) {
        modified = true;
        return { ...proj, url: defProj.url };
      }
      return proj;
    });

    // Self-healing migration: append missing code-level defaults
    defaultProjects.forEach(defProj => {
      if (!upgradedList.some(proj => proj.id === defProj.id)) {
        upgradedList.push(defProj);
        modified = true;
      }
    });

    if (modified) {
      localStorage.setItem('303_artway_projects_v9', JSON.stringify(upgradedList));
    }
    return upgradedList;
  }
  localStorage.setItem('303_artway_projects_v9', JSON.stringify(defaultProjects));
  return defaultProjects;
};

export const saveArtist = (artist) => {
  const currentArtists = getArtists();

  // Generate a collision-resistant ID using timestamp + random suffix
  // This prevents the count-based collision bug where two submissions
  // in the same session both get the same ILA-2026-XXXX ID and overwrite each other.
  let artistId = artist.id;
  if (!artistId) {
    const year = new Date().getFullYear();
    const suffix = String(Date.now()).slice(-5) + Math.floor(Math.random() * 10);
    artistId = `ILA-${year}-${suffix}`;
  }
  
  const existingArtist = currentArtists.find(a => a.id === artistId);
  let availabilityLastUpdated = existingArtist ? (existingArtist.availabilityLastUpdated || '') : '';
  
  if (!existingArtist || existingArtist.availabilityStatus !== artist.availabilityStatus) {
    const now = new Date();
    availabilityLastUpdated = now.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) + ' ' + now.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });
  }
  
  // Strip large Base64 strings from workExamples for localStorage to avoid quota limits
  const optimizedArtist = {
    ...artist,
    id: artistId,
    vettingStatus: artist.vettingStatus || 'New',
    lastContacted: artist.lastContacted || 'Never',
    portfolioUrl: artist.portfolioUrl || '',
    availabilityLastUpdated
  };

  if (optimizedArtist.workExamples && Array.isArray(optimizedArtist.workExamples)) {
    optimizedArtist.workExamples = optimizedArtist.workExamples.map(example => {
      const copy = { ...example };
      if (copy.base64Data) {
        copy.base64Data = "[Base64 Payload]"; // Strip the huge Base64 string for local storage
      }
      return copy;
    });
  }

  const existingIndex = currentArtists.findIndex(a => a.id === artistId);
  let updatedArtists;
  if (existingIndex > -1) {
    updatedArtists = [...currentArtists];
    updatedArtists[existingIndex] = optimizedArtist;
  } else {
    updatedArtists = [...currentArtists, optimizedArtist];
  }
  
  localStorage.setItem('303_artway_artists_v8', JSON.stringify(updatedArtists));
  // Return both the full updated list AND the specific saved artist for easy lookup
  return { list: updatedArtists, savedId: artistId };
};

// Submits data directly to Google Sheet web app, with local fallback
export const submitArtistToGoogleSheet = async (artist, forceProductionUrl = false) => {
  const config = getGoogleSheetsConfig();
  const urlToUse = forceProductionUrl ? PRODUCTION_URL : (config.url || PRODUCTION_URL);
  const isEnabled = forceProductionUrl ? true : config.isEnabled;
  
  // Clean/escape all user inputs to protect against XSS injection before committing
  const sanitizedArtist = sanitizeValue(artist);
  
  // Format data for Google Sheet row mapping (do NOT overwrite an existing ID)
  const rowData = {
    ...sanitizedArtist,
    token: API_ACCESS_TOKEN // Cryptographic API authentication token
  };

  // Save locally first — always — to ensure no data is lost regardless of network state.
  // saveArtist now returns { list, savedId } so we can look up the exact artist saved.
  const { list: updatedList, savedId } = saveArtist(rowData);
  // Find the exact artist object we just persisted (by ID, not by array index)
  const savedArtist = updatedList.find(a => a.id === savedId) || updatedList[updatedList.length - 1];

  console.log('[Registry] Artist saved locally with ID:', savedId, '— Email:', sanitizedArtist.email || '(no email)');

  if (isEnabled && urlToUse) {
    try {
      // 1. Fast pre-flight diagnostic check (3-second timeout)
      let connectionIssue = false;
      let connectionMessage = '';
      try {
        const delimiter = urlToUse.includes('?') ? '&' : '?';
        const testUrl = `${urlToUse}${delimiter}token=${encodeURIComponent(API_ACCESS_TOKEN)}&test=1`;
        
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 3000);
        
        const testRes = await fetch(testUrl, { signal: controller.signal });
        clearTimeout(timeoutId);
        
        if (testRes.ok) {
          const text = await testRes.text();
          if (text.includes('<!DOCTYPE html>') || text.includes('accounts.google.com') || text.includes('AccountChooser')) {
            connectionIssue = true;
            connectionMessage = 'The Google Sheets server requires authorization. Please inform the gallery administrator.';
          }
        } else {
          connectionIssue = true;
          connectionMessage = `Google Sheets responded with HTTP status ${testRes.status}.`;
        }
      } catch (err) {
        connectionIssue = true;
        connectionMessage = 'Access Blocked. The Google Sheets Web App is not configured for public access.';
      }

      // 2. Perform the actual POST request (no-cors — response body is opaque but POST executes)
      const postBody = { ...rowData, id: savedId }; // Ensure the collision-resistant ID is sent
      await fetch(urlToUse, {
        method: 'POST',
        mode: 'no-cors',
        headers: {
          'Content-Type': 'text/plain;charset=utf-8',
        },
        body: JSON.stringify(postBody),
      });
      console.log('[Registry] POST dispatched to Google Sheet for artist ID:', savedId);
      return { success: !connectionIssue, connectionIssue, connectionMessage, updated: updatedList, savedArtist };
    } catch (e) {
      console.error('[Registry] Error submitting to Google Sheet Web App:', e);
      return { success: false, error: e.message, updated: updatedList, savedArtist };
    }
  }

  return { success: true, localOnly: true, updated: updatedList, savedArtist };
};

// Emails the funding sources list to the artist via Google Sheet Web App, with local simulation fallback
export const emailFundingSourcesToArtist = async (email, name, forceProductionUrl = false) => {
  const config = getGoogleSheetsConfig();
  const urlToUse = forceProductionUrl ? PRODUCTION_URL : (config.url || PRODUCTION_URL);
  const isEnabled = forceProductionUrl ? true : config.isEnabled;

  // Sanitize input values client-side
  const cleanEmail = sanitizeString(email);
  const cleanName = sanitizeString(name);

  console.log(`[Email Request] Sending funding sources to ${cleanEmail} (${cleanName})`);

  if (isEnabled && urlToUse) {
    try {
      await fetch(urlToUse, {
        method: 'POST',
        mode: 'no-cors', // standard Apps Script bypasses CORS in no-cors mode
        headers: {
          'Content-Type': 'text/plain;charset=utf-8',
        },
        body: JSON.stringify({
          action: 'emailFundingSources',
          email: cleanEmail,
          name: cleanName,
          token: API_ACCESS_TOKEN
        }),
      });
      console.log('Funding sources email requested successfully from Google Sheet Web App.');
      return { success: true };
    } catch (e) {
      console.error('Error requesting email from Google Sheet Web App:', e);
      return { success: false, error: e.message };
    }
  }

  // Local simulation fallback
  console.log('Google Sheets is disabled or not configured. Simulating email send locally.');
  return { success: true, simulated: true };
};

// Emails the project pipeline list to the artist via Google Sheet Web App, with local simulation fallback
export const emailProjectPipelineToArtist = async (email, name, forceProductionUrl = false) => {
  const config = getGoogleSheetsConfig();
  const urlToUse = forceProductionUrl ? PRODUCTION_URL : (config.url || PRODUCTION_URL);
  const isEnabled = forceProductionUrl ? true : config.isEnabled;

  // Sanitize input values client-side
  const cleanEmail = sanitizeString(email);
  const cleanName = sanitizeString(name);

  console.log(`[Email Request] Sending project pipeline to ${cleanEmail} (${cleanName})`);

  if (isEnabled && urlToUse) {
    try {
      await fetch(urlToUse, {
        method: 'POST',
        mode: 'no-cors', // standard Apps Script bypasses CORS in no-cors mode
        headers: {
          'Content-Type': 'text/plain;charset=utf-8',
        },
        body: JSON.stringify({
          action: 'emailProjectPipeline',
          email: cleanEmail,
          name: cleanName,
          token: API_ACCESS_TOKEN
        }),
      });
      console.log('Project pipeline email requested successfully from Google Sheet Web App.');
      return { success: true };
    } catch (e) {
      console.error('Error requesting email from Google Sheet Web App:', e);
      return { success: false, error: e.message };
    }
  }

  // Local simulation fallback
  console.log('Google Sheets is disabled or not configured. Simulating email send locally.');
  return { success: true, simulated: true };
};


// Fetches live data from Google Sheet and merges with localStorage to sync backend
export const fetchArtistsFromGoogleSheet = async (forceSync = false) => {
  const config = getGoogleSheetsConfig();
  const urlToUse = forceSync ? PRODUCTION_URL : (config.url || PRODUCTION_URL);
  const isEnabled = forceSync ? true : config.isEnabled;
  
  if (!isEnabled || !urlToUse) {
    return getArtists();
  }
  
  try {
    // Append cryptographic token as query parameter for secure authentication
    const delimiter = urlToUse.includes('?') ? '&' : '?';
    const urlWithToken = API_ACCESS_TOKEN ? `${urlToUse}${delimiter}token=${encodeURIComponent(API_ACCESS_TOKEN)}` : urlToUse;
    
    const response = await fetch(urlWithToken);
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    const data = await response.json();
    if (data && data.success && Array.isArray(data.artists)) {
      const sheetArtists = data.artists;
      const currentArtists = getArtists();
      
      // Use a Map to resolve and merge artists by ID
      const mergedMap = new Map();
      
      // 1. Populate with Sheet artists (last submission with same ID wins if duplicates)
      sheetArtists.forEach(sa => {
        if (sa.id) {
          mergedMap.set(sa.id, sa);
        }
      });
      
      // 2. Merge/Overlay with local artists to preserve local CRM modifications
      currentArtists.forEach(la => {
        if (!la.id) return;
        const sa = mergedMap.get(la.id);
        if (sa) {
          // Merge: preserve local CRM values if they were modified locally (aren't 'New' / 'Never')
          mergedMap.set(la.id, {
            ...sa, // Start with spreadsheet data
            ...la, // Apply local overrides
            vettingStatus: la.vettingStatus !== 'New' ? la.vettingStatus : (sa.vettingStatus || 'New'),
            lastContacted: la.lastContacted !== 'Never' ? la.lastContacted : (sa.lastContacted || 'Never')
          });
        } else {
          // If a local artist is not in the sheet (preloaded or manually added offline)
          mergedMap.set(la.id, la);
        }
      });
      
      const mergedList = Array.from(mergedMap.values());
      const finalMergedList = ensureFaalAliInjected(mergedList);
      
      // Save back to localStorage cache
      localStorage.setItem('303_artway_artists_v8', JSON.stringify(finalMergedList));
      return finalMergedList;
    }
    return getArtists();
  } catch (err) {
    console.error('Error fetching artists from Google Sheet Web App:', err);
    return getArtists(); // Offline/failed fallback
  }
};

// Bidirectional push-and-pull sync: identifies local-only submissions and pushes them to Google Sheets, then pulls latest entries down.
export const syncLocalArtistsToGoogleSheet = async (forceSync = false) => {
  const localArtists = getArtists();
  const config = getGoogleSheetsConfig();
  const urlToUse = forceSync ? PRODUCTION_URL : (config.url || PRODUCTION_URL);
  const isEnabled = forceSync ? true : config.isEnabled;

  if (!isEnabled || !urlToUse) {
    return { success: false, message: "Google Sheets connection URL not configured." };
  }

  let sheetArtists;
  try {
    // Append cryptographic token as query parameter for secure authentication
    const delimiter = urlToUse.includes('?') ? '&' : '?';
    const urlWithToken = API_ACCESS_TOKEN ? `${urlToUse}${delimiter}token=${encodeURIComponent(API_ACCESS_TOKEN)}` : urlToUse;
    
    const response = await fetch(urlWithToken);
    if (!response.ok) {
      throw new Error(`doGet failed with HTTP status ${response.status}`);
    }
    const data = await response.json();
    if (data && data.success && Array.isArray(data.artists)) {
      sheetArtists = data.artists;
    } else {
      throw new Error(data.error || "doGet endpoint returned invalid artist array structure.");
    }
  } catch (err) {
    console.error("Failed to fetch Google Sheet artists during pre-sync check:", err);
    return { success: false, message: `Could not retrieve spreadsheet records. Error: ${err.message}. Please verify doGet deployment.` };
  }

  // Create lookup tables of Sheet entries to prevent duplicates
  const sheetIds = new Set(sheetArtists.map(a => String(a.id || '').trim().toLowerCase()).filter(Boolean));
  const sheetEmails = new Set(sheetArtists.map(a => String(a.email || '').trim().toLowerCase()).filter(Boolean));
  const sheetNames = new Set(sheetArtists.map(a => `${String(a.firstName || '').trim()} ${String(a.lastName || '').trim()}`.toLowerCase()).filter(Boolean));

  const outstanding = localArtists.filter(la => {
    const idMatch = la.id && sheetIds.has(String(la.id).trim().toLowerCase());
    const emailMatch = la.email && sheetEmails.has(String(la.email).trim().toLowerCase());
    const nameMatch = la.firstName && sheetNames.has(`${String(la.firstName || '').trim()} ${String(la.lastName || '').trim()}`.toLowerCase());
    return !idMatch && !emailMatch && !nameMatch;
  });

  if (outstanding.length === 0) {
    // All local entries are accounted for; perform standard pull-down sync to ensure latest data is loaded
    const syncedList = await fetchArtistsFromGoogleSheet(forceSync);
    return {
      success: true,
      pushed: 0,
      pulled: syncedList.length,
      updatedList: syncedList,
      message: `Database up-to-date! Pulled down all ${syncedList.length} entries from Google Sheets.`
    };
  }

  let pushedCount = 0;
  
  // Sequentially transmit missing submissions to Google Sheets Web App
  for (const artist of outstanding) {
    try {
      const sanitized = sanitizeValue(artist);
      const postPayload = {
        ...sanitized,
        token: API_ACCESS_TOKEN
      };
      
      await fetch(urlToUse, {
        method: 'POST',
        mode: 'no-cors',
        headers: {
          'Content-Type': 'text/plain;charset=utf-8',
        },
        body: JSON.stringify(postPayload),
      });
      pushedCount++;
    } catch (e) {
      console.error(`Failed to push artist ${artist.firstName} ${artist.lastName} to Google Sheets:`, e);
    }
  }

  // Fetch the final, fully merged state down into React to guarantee synchronization
  const finalSyncedList = await fetchArtistsFromGoogleSheet(forceSync);

  return {
    success: true,
    pushed: pushedCount,
    pulled: finalSyncedList.length,
    updatedList: finalSyncedList,
    message: `Synchronized successfully! Uploaded ${pushedCount} local entries & updated database to ${finalSyncedList.length} total entries.`
  };
};

// Fetches live funding sources from Google Sheet and merges with local
export const fetchFundingSourcesFromGoogleSheet = async (forceSync = false) => {
  const config = getGoogleSheetsConfig();
  const urlToUse = forceSync ? PRODUCTION_URL : (config.url || PRODUCTION_URL);
  const isEnabled = forceSync ? true : config.isEnabled;
  
  if (!isEnabled || !urlToUse) {
    return getFundingSources();
  }
  
  try {
    const delimiter = urlToUse.includes('?') ? '&' : '?';
    const urlWithParams = `${urlToUse}${delimiter}sheet=Opportunities&token=${encodeURIComponent(API_ACCESS_TOKEN)}`;
    
    const response = await fetch(urlWithParams);
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    const data = await response.json();
    if (data && data.success && Array.isArray(data.opportunities)) {
      const sheetSources = data.opportunities;
      
      // Filter out and asynchronously clean up closed official funding sources from Google Sheets
      const activeSheetSources = sheetSources.filter(src => {
        const isClosed = src.closeDate && new Date(src.closeDate + 'T23:59:00') < new Date();
        if (isClosed && !src.isCommunityPost) {
          // Asynchronously delete from Google Sheet in background
          deleteOpportunityFromGoogleSheet(src.id, forceSync).catch(err => console.error('[Sheets] Auto-delete of closed source failed:', err));
          return false;
        }
        return true;
      });

      const currentSources = getFundingSources();
      const mergedMap = new Map();
      currentSources.forEach(src => {
        if (src.id) mergedMap.set(src.id, src);
      });
      
      activeSheetSources.forEach(sa => {
        if (sa.id) {
          mergedMap.set(sa.id, sa);
        }
      });
      
      const mergedList = Array.from(mergedMap.values());
      localStorage.setItem('303_artway_funding_v10', JSON.stringify(mergedList));
      return mergedList;
    }
    return getFundingSources();
  } catch (err) {
    console.error('Error fetching funding sources from Google Sheet:', err);
    return getFundingSources();
  }
};

// Bidirectional sync for funding sources: pushes local-only, pulls down latest
export const syncLocalFundingSourcesToGoogleSheet = async (forceSync = false) => {
  const localSources = getFundingSources();
  const config = getGoogleSheetsConfig();
  const urlToUse = forceSync ? PRODUCTION_URL : (config.url || PRODUCTION_URL);
  const isEnabled = forceSync ? true : config.isEnabled;

  if (!isEnabled || !urlToUse) {
    return { success: false, message: "Google Sheets connection URL not configured." };
  }

  let sheetOpportunities;
  try {
    const delimiter = urlToUse.includes('?') ? '&' : '?';
    const urlWithParams = `${urlToUse}${delimiter}sheet=Opportunities&token=${encodeURIComponent(API_ACCESS_TOKEN)}`;
    
    const response = await fetch(urlWithParams);
    if (!response.ok) {
      throw new Error(`doGet failed with HTTP status ${response.status}`);
    }
    const data = await response.json();
    if (data && data.success && Array.isArray(data.opportunities)) {
      sheetOpportunities = data.opportunities;
    } else {
      throw new Error(data.error || "doGet endpoint returned invalid opportunities structure.");
    }
  } catch (err) {
    console.error("Failed to fetch Google Sheet opportunities during sync:", err);
    return { success: false, message: `Could not retrieve sheet records: ${err.message}` };
  }

  const sheetIds = new Set(sheetOpportunities.map(o => String(o.id || '').trim().toLowerCase()).filter(Boolean));
  const sheetTitles = new Set(sheetOpportunities.map(o => String(o.title || o.name || '').trim().toLowerCase()).filter(Boolean));

  const outstanding = localSources.filter(ls => {
    const isClosed = ls.closeDate && new Date(ls.closeDate + 'T23:59:00') < new Date();
    if (isClosed && !ls.isCommunityPost) return false;

    const idMatch = ls.id && sheetIds.has(String(ls.id).trim().toLowerCase());
    const titleMatch = ls.title && sheetTitles.has(String(ls.title).trim().toLowerCase());
    return !idMatch && !titleMatch;
  });

  if (outstanding.length === 0) {
    const syncedList = await fetchFundingSourcesFromGoogleSheet(forceSync);
    return {
      success: true,
      pushed: 0,
      pulled: syncedList.length,
      updatedList: syncedList,
      message: `Funding sources up-to-date! Loaded ${syncedList.length} sources from Google Sheets.`
    };
  }

  let pushedCount = 0;
  for (const source of outstanding) {
    try {
      await submitOpportunityToGoogleSheet(source, forceSync);
      pushedCount++;
    } catch (e) {
      console.error(`Failed to push funding source "${source.title}" to Google Sheets:`, e);
    }
  }

  const finalSyncedList = await fetchFundingSourcesFromGoogleSheet(forceSync);
  return {
    success: true,
    pushed: pushedCount,
    pulled: finalSyncedList.length,
    updatedList: finalSyncedList,
    message: `Synchronized funding sources! Uploaded ${pushedCount} local entries & updated database.`
  };
};

// Commit manual funding source opportunity to local storage
export const saveFundingSource = (source) => {
  const current = getFundingSources();
  const sourceId = source.id || `f${Date.now()}`;
  const newSource = { ...source, id: sourceId };
  
  const idx = current.findIndex(s => s.id === sourceId);
  let updated;
  if (idx > -1) {
    updated = [...current];
    updated[idx] = newSource;
  } else {
    updated = [...current, newSource];
  }
  
  localStorage.setItem('303_artway_funding_v10', JSON.stringify(updated));
  return updated;
};

// Commit manual project opportunity to local storage
export const saveProject = (project) => {
  const current = getProjects();
  const projectId = project.id || `p${Date.now()}`;
  const newProject = { ...project, id: projectId };
  
  const idx = current.findIndex(p => p.id === projectId);
  let updated;
  if (idx > -1) {
    updated = [...current];
    updated[idx] = newProject;
  } else {
    updated = [...current, newProject];
  }
  
  localStorage.setItem('303_artway_projects_v9', JSON.stringify(updated));
  return updated;
};

// Broadcasts an opportunity to all artists on the list (via Google Sheet or local simulation fallback)
export const broadcastOpportunityToAllArtists = async (opportunity, forceProductionUrl = false) => {
  const config = getGoogleSheetsConfig();
  const urlToUse = forceProductionUrl ? PRODUCTION_URL : (config.url || PRODUCTION_URL);
  const isEnabled = forceProductionUrl ? true : config.isEnabled;

  console.log(`[Broadcast Request] Broadcasting opportunity "${opportunity.title || opportunity.name}" to all artists.`);

  if (isEnabled && urlToUse) {
    try {
      await fetch(urlToUse, {
        method: 'POST',
        mode: 'no-cors', // standard Apps Script bypasses CORS in no-cors mode
        headers: {
          'Content-Type': 'text/plain;charset=utf-8',
        },
        body: JSON.stringify({
          action: 'broadcastOpportunity',
          opportunity,
          token: API_ACCESS_TOKEN
        }),
      });
      console.log('Production email broadcast requested successfully from Google Sheet Web App.');
      return { success: true };
    } catch (e) {
      console.error('Error requesting email broadcast from Google Sheet Web App:', e);
      return { success: false, error: e.message };
    }
  }

  // Local simulated broadcast fallback
  if (opportunity.isCommunityPost) {
    const rfqQuery = {
      mediums: opportunity.mediums || [],
      styles: opportunity.styles || [],
      capabilities: opportunity.capabilities || [],
      scale: opportunity.scale || ''
    };
    const matchedArtists = findMatchingArtistsForRFQ(rfqQuery);
    
    console.log('--- START CLIENT MATCH RESULTS EMAIL ---');
    const clientEmail = opportunity.contactEmail || 'client@example.com';
    const clientName = opportunity.contactPerson || opportunity.provider || 'Client';
    const clientHtmlEmail = `
      ======================================================
      TO: ${clientEmail} (${clientName})
      SUBJECT: Match Results: Your Opportunity "${opportunity.title || opportunity.name}" - ILA Gallery
      ------------------------------------------------------
      Hello ${clientName},

      Thank you for posting your opportunity "${opportunity.title || opportunity.name}" on the ILA Gallery Creative Hub.

      We have queried our Colorado Artist Registry and found that **${matchedArtists.length}** artists match your project's qualifications (required mediums, styles, scale, and capabilities).

      To respect artist privacy, their names and direct identities are kept confidential at this stage. The matching artists have been notified and provided with your contact details (email and contact name) along with the project details. They will reach out to you directly if they are interested.

      Thank you for investing in Colorado's creative community!
      ======================================================
    `;
    console.log(clientHtmlEmail);
    console.log('--- END CLIENT MATCH RESULTS EMAIL ---');

    console.log('--- START TARGETED ARTIST MATCH NOTIFICATIONS ---');
    matchedArtists.forEach(artist => {
      const displayName = artist.alias || `${artist.firstName} ${artist.lastName}`.trim() || 'Artist';
      const artistEmail = artist.email || 'unknown@artist.com';
      
      const artistHtmlEmail = `
        ======================================================
        TO: ${artistEmail} (${displayName})
        SUBJECT: New Matching Project: "${opportunity.title || opportunity.name}" - ILA Gallery
        ------------------------------------------------------
        Hello ${displayName},

        A new creative opportunity has been posted that matches your qualifications!

        PROJECT DETAILS:
        - Title: ${opportunity.title || opportunity.name}
        - Category: ${opportunity.type || 'N/A'}
        - Budget/Compensation: ${opportunity.amount || opportunity.budget || 'Varies'}
        - Scale: ${opportunity.scale || 'N/A'}
        - Address: ${opportunity.address || 'N/A'}, ${opportunity.city || 'N/A'}
        - Description: ${opportunity.description || 'No description provided.'}

        CLIENT CONTACT DETAILS:
        - Name: ${opportunity.contactPerson || 'N/A'}
        - Email: ${opportunity.contactEmail || 'N/A'}
        - Phone: ${opportunity.contactPhone || 'N/A'}

        If this project fits your practice, please contact the client directly using the details above.

        To assist you in preparing a winning proposal, remember that you can use the pre-formatted narrative and cover letter templates inside the Grant Assistant page of the 303 ArtWay platform!
        ======================================================
      `;
      console.log(artistHtmlEmail);
    });
    console.log('--- END TARGETED ARTIST MATCH NOTIFICATIONS ---');
    
    return { success: true, simulated: true, recipientCount: matchedArtists.length };
  }

  // Fallback broadcast to all artists (e.g. for general / admin-created opportunities)
  console.log('--- START LOCAL SIMULATED BROADCAST ---');
  const artists = getArtists();
  console.log(`Simulating broadcast to ${artists.length} artists in Directory database.`);
  
  artists.forEach(artist => {
    const displayName = artist.alias || `${artist.firstName} ${artist.lastName}`.trim() || 'Artist';
    const email = artist.email || 'unknown@artist.com';
    
    const htmlEmail = `
      ======================================================
      TO: ${email} (${displayName})
      SUBJECT: New Opportunity Alert: ${opportunity.title || opportunity.name} - 303 ArtWay
      ------------------------------------------------------
      Hello ${displayName},

      We are thrilled to share a new creative opportunity that just became active! We highly encourage you to apply for this. 
      To assist you in preparing a winning proposal, remember that you can use the pre-formatted narrative and cover letter templates inside the Grant Assistant page of the 303 ArtWay platform!

      OPPORTUNITY DETAILS:
      - Title: ${opportunity.title || opportunity.name}
      - Provider: ${opportunity.provider || 'N/A'}
      - Type: ${opportunity.type || 'N/A'}
      - Compensation/Budget: ${opportunity.amount || opportunity.budget || 'Varies'}
      - Dates: Opened ${opportunity.openDate || 'N/A'} | Closes ${opportunity.closeDate || 'N/A'}
      - Target Applicants: ${opportunity.whoShouldApply || 'All Eligible Artists'}
      - Link: ${opportunity.url || 'N/A'}

      DESCRIPTION:
      ${opportunity.description || 'No description provided.'}

      This is an automated opportunity alert from the 303 ArtWay platform.
      Need assistance? Access our built-in AI Grant Application Assistant to draft cover letters, statements of interest, and budget breakdown estimates.
      ======================================================
    `;
    console.log(htmlEmail);
  });
  console.log('--- END LOCAL SIMULATED BROADCAST ---');
  return { success: true, simulated: true, recipientCount: artists.length };
};

// Finds registered artists who match a list of needed mediums/genres
export const findMatchingArtistsForMediums = (mediumsList) => {
  if (!mediumsList || mediumsList.length === 0) return [];
  const artists = getArtists();
  return artists.filter(artist => {
    const primary = (artist.primaryMedium || '').toLowerCase().trim();
    const secondaries = (artist.secondaryMediums || []).map(m => m.toLowerCase().trim());
    
    return mediumsList.some(med => {
      const medLower = med.toLowerCase().trim();
      if (!medLower) return false;
      if (primary && (primary.includes(medLower) || medLower.includes(primary))) return true;
      return secondaries.some(sec => sec && (sec.includes(medLower) || medLower.includes(sec)));
    });
  });
};

// Advanced Registry Matcher: Scores and filters artists based on comprehensive RFQ requirements
export const findMatchingArtistsForRFQ = (rfq) => {
  if (!rfq) return [];
  const artists = getArtists();
  
  const requestedMediums = (rfq.mediums || []).map(m => m.toLowerCase().trim());
  const requestedStyles = (rfq.styles || []).map(s => s.toLowerCase().trim());
  const requestedScale = (rfq.scale || '').toLowerCase().trim();
  const requiredCapabilities = rfq.capabilities || []; // Array of boolean capability key names
  
  const scoredArtists = artists.map(artist => {
    let score = 0;
    let isMatch = true;

    // 1. Medium Match: If requested mediums specified, check intersection
    if (requestedMediums.length > 0) {
      const primary = (artist.primaryMedium || '').toLowerCase().trim();
      const secondaries = (artist.secondaryMediums || []).map(m => m.toLowerCase().trim());
      
      const mediumMatch = requestedMediums.some(med => {
        if (primary && (primary.includes(med) || med.includes(primary))) return true;
        return secondaries.some(sec => sec && (sec.includes(med) || med.includes(sec)));
      });
      
      if (!mediumMatch) {
        isMatch = false;
      } else {
        score += 15; // Medium match is highly weighted
      }
    }

    // 2. Capabilities Check: Strict filter if checked as REQUIRED
    if (isMatch && requiredCapabilities.length > 0) {
      const missingCapability = requiredCapabilities.some(capKey => !artist[capKey]);
      if (missingCapability) {
        isMatch = false; // strictly filter out artists missing any required capability
      } else {
        score += requiredCapabilities.length * 5; // capability bonus
      }
    }

    // 3. Scale Check: Scale must match artist's scaleCapability list
    if (isMatch && requestedScale) {
      const artistScales = (artist.scaleCapability || []).map(s => s.toLowerCase().trim());
      if (artistScales.length > 0 && !artistScales.includes(requestedScale)) {
        isMatch = false; // scale mismatch (if artist doesn't support that scale)
      } else {
        score += 5;
      }
    }

    // 4. Style Intersection: Boost score based on number of intersecting styles
    if (isMatch && requestedStyles.length > 0) {
      const artistStyles = (artist.artStyles || []).map(s => s.toLowerCase().trim());
      const styleIntersections = artistStyles.filter(s => requestedStyles.includes(s));
      score += styleIntersections.length * 3; // style boost
    }

    return { artist, score, isMatch };
  });

  // Filter out non-matches, sort by highest score, then map back to artist objects
  return scoredArtists
    .filter(sa => sa.isMatch)
    .sort((a, b) => b.score - a.score)
    .map(sa => sa.artist);
};

// Submits opportunity to Google Sheet Web App, with local fallback
export const submitOpportunityToGoogleSheet = async (opportunity, forceProductionUrl = false) => {
  const config = getGoogleSheetsConfig();
  const urlToUse = forceProductionUrl ? PRODUCTION_URL : (config.url || PRODUCTION_URL);
  const isEnabled = forceProductionUrl ? true : config.isEnabled;

  const sanitizedOpp = sanitizeValue(opportunity);

  const payload = {
    action: "submitOpportunity",
    opportunity: sanitizedOpp,
    token: API_ACCESS_TOKEN
  };

  if (isEnabled && urlToUse) {
    try {
      await fetch(urlToUse, {
        method: 'POST',
        mode: 'no-cors',
        headers: {
          'Content-Type': 'text/plain;charset=utf-8',
        },
        body: JSON.stringify(payload),
      });
      console.log('Opportunity submitted successfully to Google Sheet at:', urlToUse);
      return { success: true };
    } catch (e) {
      console.error('Error submitting opportunity to Google Sheet Web App:', e);
      return { success: false, error: e.message };
    }
  }

  return { success: true, localOnly: true };
};

// Deletes opportunity from Google Sheet Web App
export const deleteOpportunityFromGoogleSheet = async (id, forceProductionUrl = false) => {
  const config = getGoogleSheetsConfig();
  const urlToUse = forceProductionUrl ? PRODUCTION_URL : (config.url || PRODUCTION_URL);
  const isEnabled = forceProductionUrl ? true : config.isEnabled;

  const payload = {
    action: "deleteOpportunity",
    id: id,
    token: API_ACCESS_TOKEN
  };

  if (isEnabled && urlToUse) {
    try {
      await fetch(urlToUse, {
        method: 'POST',
        mode: 'no-cors',
        headers: {
          'Content-Type': 'text/plain;charset=utf-8',
        },
        body: JSON.stringify(payload),
      });
      console.log('Opportunity delete requested successfully from Google Sheet at:', urlToUse);
      return { success: true };
    } catch (e) {
      console.error('Error deleting opportunity from Google Sheet Web App:', e);
      return { success: false, error: e.message };
    }
  }

  return { success: true, localOnly: true };
};

// Deletes opportunity locally from localStorage
export const deleteFundingSource = (id) => {
  const current = getFundingSources();
  const updated = current.filter(s => s.id !== id);
  localStorage.setItem('303_artway_funding_v10', JSON.stringify(updated));
  return updated;
};

// Performs a non-blocking diagnostic test on the Google Sheets script URL
export const testGoogleSheetsConnection = async (customUrl = null) => {
  const config = getGoogleSheetsConfig();
  const urlToUse = customUrl !== null ? customUrl : (config.url || PRODUCTION_URL);
  
  if (!urlToUse) {
    return { status: 'error', message: 'No Google Sheets URL configured.' };
  }
  
  try {
    const delimiter = urlToUse.includes('?') ? '&' : '?';
    const testUrl = `${urlToUse}${delimiter}token=${encodeURIComponent(API_ACCESS_TOKEN)}&test=1`;
    
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 7000);
    
    const response = await fetch(testUrl, { signal: controller.signal });
    clearTimeout(timeoutId);
    
    if (!response.ok) {
      return { 
        status: 'error', 
        message: `HTTP connection failed with status ${response.status}. Please check script deployment.` 
      };
    }
    
    const text = await response.text();
    
    if (text.includes('<!DOCTYPE html>') || text.includes('accounts.google.com') || text.includes('AccountChooser')) {
      return { 
        status: 'warning', 
        message: 'Authentication Required! The Web App is returning the Google Login screen. In Apps Script, redeploy and set "Who has access" to "Anyone".' 
      };
    }
    
    try {
      const data = JSON.parse(text);
      if (data && data.success) {
        return { status: 'success', message: 'Sync active! Successfully communicating with spreadsheet.' };
      } else {
        return { 
          status: 'error', 
          message: data.error || 'The spreadsheet returned a failure response. Verify your API token.' 
        };
      }
    } catch (parseErr) {
      return { 
        status: 'error', 
        message: 'Invalid response format. Please verify you pasted the correct Web App URL.' 
      };
    }
  } catch (err) {
    console.error('Spreadsheet pre-flight diagnostic failed:', err);
    if (err.name === 'AbortError') {
      return { status: 'error', message: 'Connection timed out. Verify your internet connection or URL.' };
    }
    return { 
      status: 'warning', 
      message: 'Access Blocked! Connection was refused due to CORS redirect. In Apps Script, redeploy as Web App, set "Who has access" to "Anyone", and authorize it.' 
    };
  }
};

// Deletes artist locally from localStorage
export const deleteArtistLocally = (id) => {
  const current = getArtists();
  const updated = current.filter(a => a.id !== id);
  localStorage.setItem('303_artway_artists_v8', JSON.stringify(updated));
  return updated;
};

// Deletes artist from Google Sheet Web App
export const deleteArtistFromGoogleSheet = async (id, forceProductionUrl = false) => {
  const config = getGoogleSheetsConfig();
  const urlToUse = forceProductionUrl ? PRODUCTION_URL : (config.url || PRODUCTION_URL);
  const isEnabled = forceProductionUrl ? true : config.isEnabled;

  const payload = {
    action: "deleteArtist",
    id: id,
    token: API_ACCESS_TOKEN
  };

  if (isEnabled && urlToUse) {
    try {
      await fetch(urlToUse, {
        method: 'POST',
        mode: 'no-cors', // standard Apps Script bypasses CORS in no-cors
        headers: {
          'Content-Type': 'text/plain;charset=utf-8',
        },
        body: JSON.stringify(payload),
      });
      console.log('Artist delete requested successfully from Google Sheet:', urlToUse);
      return { success: true };
    } catch (e) {
      console.error('Error deleting artist from Google Sheet Web App:', e);
      return { success: false, error: e.message };
    }
  }

  return { success: true, localOnly: true };
};

// Look up artist by email and registration ID
export const findArtistByEmailAndId = (email, id) => {
  const list = getArtists();
  return list.find(a => 
    String(a.email || '').trim().toLowerCase() === String(email).trim().toLowerCase() &&
    String(a.id || '').trim().toLowerCase() === String(id).trim().toLowerCase()
  ) || null;
};

// Look up artist by username/email and password (or ID fallback for legacy accounts)
export const findArtistByCredentials = (login, password) => {
  if (!login || !password) return null;
  const list = getArtists();
  const normLogin = String(login).trim().toLowerCase();
  const trimmedPass = String(password).trim();
  
  return list.find(a => {
    const emailMatch = String(a.email || '').trim().toLowerCase() === normLogin;
    const usernameMatch = String(a.username || '').trim().toLowerCase() === normLogin;
    // Support password, fall back to ID if password is not set (legacy profiles)
    const passMatch = a.password ? (String(a.password).trim() === trimmedPass) : (String(a.id || '').trim().toLowerCase() === normLogin || String(a.id || '').trim() === trimmedPass);
    return (emailMatch || usernameMatch) && passMatch;
  }) || null;
};

// Update specific profile fields for self-service portal
export const updateArtistFields = (id, updatedFields) => {
  const list = getArtists();
  const idx = list.findIndex(a => String(a.id).trim().toLowerCase() === String(id).trim().toLowerCase());
  if (idx === -1) return { success: false, error: 'Artist profile not found.' };
  
  const artist = list[idx];
  
  // Validate username uniqueness if it is being changed
  if (updatedFields.username) {
    const cleanUsername = String(updatedFields.username).trim().toLowerCase().replace(/[^a-z0-9_.-]/g, '');
    if (cleanUsername.length < 3) {
      return { success: false, error: 'Username must be at least 3 characters.' };
    }
    const taken = list.some(a => String(a.id).trim().toLowerCase() !== String(id).trim().toLowerCase() && String(a.username || '').trim().toLowerCase() === cleanUsername);
    if (taken) {
      return { success: false, error: 'This username is already taken. Please choose another.' };
    }
  }
  
  let availabilityLastUpdated = artist.availabilityLastUpdated || '';
  if (updatedFields.availabilityStatus && updatedFields.availabilityStatus !== artist.availabilityStatus) {
    const now = new Date();
    availabilityLastUpdated = now.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) + ' ' + now.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });
  }
  
  const updatedArtist = {
    ...artist,
    ...updatedFields,
    availabilityLastUpdated
  };
  
  const updatedList = [...list];
  updatedList[idx] = updatedArtist;
  localStorage.setItem('303_artway_artists_v8', JSON.stringify(updatedList));
  
  // Dispatch a background sync update if sheets enabled
  try {
    submitArtistToGoogleSheet(updatedArtist);
  } catch (e) {
    console.error('[Registry] Profile update sync dispatch failed:', e);
  }
  
  return { success: true, artist: updatedArtist, list: updatedList };
};

// ── CLIENT DATABASE & CRM INTEGRATION ──────────────────────────────────────────

const defaultClients = [
  {
    "id": "ILA-CLIENT-0001",
    "clientName": "ILA Gallery",
    "contactName": "Gallery Director",
    "email": "director@ila-gallery.com",
    "phone": "303-555-1000",
    "website": "https://ila-gallery.com",
    "username": "ilagallery",
    "password": "GalleryPassword1",
    "bio": "Denver's premier contemporary art gallery showcasing local and international creatives.",
    "profilePicture": ""
  },
  {
    "id": "ILA-CLIENT-ADMIN-001",
    "clientName": "ILA Gallery Network",
    "contactName": "ILA Admin",
    "email": "admin@ila-gallery.com",
    "phone": "303-555-1001",
    "website": "https://ila-gallery.com",
    "username": "ila",
    "password": "Lifeline1",
    "bio": "ILA Gallery administrator account for managing and testing the Art in Need portal, reviewing artist matches, and streamlining commissioner connections.",
    "profilePicture": ""
  }
];

/** Self-healing: ensure the ila/Lifeline1 admin client always exists in localStorage */
const ensureILAClientInjected = (list) => {
  const targetId = 'ILA-CLIENT-ADMIN-001';
  const existing = list.find(c => c.id === targetId || (c.username || '').toLowerCase() === 'ila');
  if (existing) {
    // Patch credentials if they got corrupted
    if (existing.username !== 'ila' || existing.password !== 'Lifeline1') {
      return list.map(c =>
        (c.id === targetId || (c.username || '').toLowerCase() === 'ila')
          ? { ...c, username: 'ila', password: 'Lifeline1', id: targetId }
          : c
      );
    }
    return list;
  }
  // Inject the admin account if missing
  return [
    ...list,
    {
      id: targetId,
      clientName: 'ILA Gallery Network',
      contactName: 'ILA Admin',
      email: 'admin@ila-gallery.com',
      phone: '303-555-1001',
      website: 'https://ila-gallery.com',
      username: 'ila',
      password: 'Lifeline1',
      bio: 'ILA Gallery administrator account for managing and testing the Art in Need portal.',
      profilePicture: ''
    }
  ];
};

export const getClients = () => {
  const stored = localStorage.getItem('303_artway_clients_v1');
  let list;
  if (stored) {
    list = JSON.parse(stored);
  } else {
    list = defaultClients;
  }
  // Always ensure the ILA admin account is present and correct
  const healed = ensureILAClientInjected(list);
  if (healed !== list) {
    localStorage.setItem('303_artway_clients_v1', JSON.stringify(healed));
  } else if (!stored) {
    localStorage.setItem('303_artway_clients_v1', JSON.stringify(healed));
  }
  return healed;
};

export const saveClient = (client) => {
  const current = getClients();
  let clientId = client.id;
  if (!clientId) {
    const year = new Date().getFullYear();
    const suffix = String(Date.now()).slice(-5) + Math.floor(Math.random() * 10);
    clientId = `ILA-CLIENT-${year}-${suffix}`;
  }
  
  const newClient = {
    ...client,
    id: clientId,
    username: client.username || (client.email ? client.email.split('@')[0].toLowerCase() : clientId.toLowerCase()),
    password: client.password || clientId,
    bio: client.bio || "",
    profilePicture: client.profilePicture || ""
  };
  
  const idx = current.findIndex(c => c.id === clientId);
  let updated;
  if (idx > -1) {
    updated = [...current];
    updated[idx] = newClient;
  } else {
    updated = [...current, newClient];
  }
  
  localStorage.setItem('303_artway_clients_v1', JSON.stringify(updated));
  return { success: true, client: newClient, list: updated };
};

export const findClientByCredentials = (login, password) => {
  if (!login || !password) return null;
  const list = getClients();
  const normLogin = String(login).trim().toLowerCase();
  const trimmedPass = String(password).trim();
  
  return list.find(c => {
    const emailMatch = String(c.email || '').trim().toLowerCase() === normLogin;
    const usernameMatch = String(c.username || '').trim().toLowerCase() === normLogin;
    const passMatch = c.password ? (String(c.password).trim() === trimmedPass) : (String(c.id || '').trim().toLowerCase() === normLogin || String(c.id || '').trim() === trimmedPass);
    return (emailMatch || usernameMatch) && passMatch;
  }) || null;
};

export const updateClientFields = (id, updatedFields) => {
  const list = getClients();
  const idx = list.findIndex(c => String(c.id).trim().toLowerCase() === String(id).trim().toLowerCase());
  if (idx === -1) return { success: false, error: 'Client profile not found.' };
  
  const client = list[idx];
  
  // Validate username uniqueness if it is being changed
  if (updatedFields.username) {
    const cleanUsername = String(updatedFields.username).trim().toLowerCase().replace(/[^a-z0-9_.-]/g, '');
    if (cleanUsername.length < 3) {
      return { success: false, error: 'Username must be at least 3 characters.' };
    }
    const taken = list.some(c => String(c.id).trim().toLowerCase() !== String(id).trim().toLowerCase() && String(c.username || '').trim().toLowerCase() === cleanUsername);
    if (taken) {
      return { success: false, error: 'This username is already taken. Please choose another.' };
    }
  }
  
  const updatedClient = {
    ...client,
    ...updatedFields
  };
  
  const updatedList = [...list];
  updatedList[idx] = updatedClient;
  localStorage.setItem('303_artway_clients_v1', JSON.stringify(updatedList));
  
  return { success: true, client: updatedClient, list: updatedList };
};

/**
 * Unified credential lookup — checks BOTH the artist registry and the client database
 * in a single call. Returns { artistProfile, clientProfile }, either of which may be null.
 * This powers the universal login flow so users don't have to pre-select their portal.
 */
export const findByCredentialsUnified = (login, password) => {
  const artistProfile = findArtistByCredentials(login, password);
  const clientProfile = findClientByCredentials(login, password);
  return { artistProfile: artistProfile || null, clientProfile: clientProfile || null };
};


