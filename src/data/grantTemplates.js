export const grantChecklist = [
  {
    id: 'eligibility',
    category: 'Phase 1: Pre-Submission Alignment',
    title: 'Confirm Eligibility Criteria',
    description: 'Read the RFP thoroughly. Verify geographic restrictions (e.g. Denver-only), budget caps, required demographics, insurance limits, and medium suitability before drafting.'
  },
  {
    id: 'site_curation',
    category: 'Phase 1: Pre-Submission Alignment',
    title: 'Conduct Site Curation & Scaled Proofs',
    description: 'Inspect the physical location. Compile a high-impact scaled visual mockup showing how the artwork integrates with the physical site’s sightlines, textures, and dimensions.'
  },
  {
    id: 'rfp_timeline',
    category: 'Phase 1: Pre-Submission Alignment',
    title: 'Audit RFP Timeline & presentation Requirements',
    description: 'Review critical milestones, curatorial panel boards, public presentation deadlines, and finalize your submission schedule to allow buffer room.'
  },
  {
    id: 'intent_statement',
    category: 'Phase 2: Concept & Narrative',
    title: 'Formulate Creative Intent Statement',
    description: 'Draft a core narrative detailing your aesthetic philosophy, conceptual goals, and how the visual style addresses the specific curatorial prompts.'
  },
  {
    id: 'community_narrative',
    category: 'Phase 2: Concept & Narrative',
    title: 'Draft Community Connection Statement',
    description: 'Write a powerful section connecting your work directly to neighborhood heritage, diversity, historical highlights, and clear community benefit.'
  },
  {
    id: 'ai_mml_review',
    category: 'Phase 2: Concept & Narrative',
    title: 'Run AI MML-Enhanced Copy Review',
    description: 'Use the AI MML Tone Enhancer in the builder to align your draft narratives with Academic, Community-Empathetic, Eco-Conscious, or Street Art vocabularies.'
  },
  {
    id: 'wind_loads',
    category: 'Phase 3: Technical & Feasibility',
    title: 'Verify Wind Loads & Structural Integrity',
    description: 'For dimensional murals or structures, outline structural supports, internal armatures, and calculate wind load standards to ensure structural safety.'
  },
  {
    id: 'weather_durability',
    category: 'Phase 3: Technical & Feasibility',
    title: 'Assess Weatherability & Lightfastness',
    description: 'Select premium exterior lightfast pigments, weatherproofing sealants, and anti-graffiti shields. Confirm metal selections resist rusting in Colorado winter cycles.'
  },
  {
    id: 'municipal_permits',
    category: 'Phase 3: Technical & Feasibility',
    title: 'Audit Denver Municipal Permitting',
    description: 'Identify DOTI encroachment, CDOT right-of-way permissions, sidewalk closures, FAA height limits, or Arts & Venues Mural Registry rules.'
  },
  {
    id: 'balanced_budget',
    category: 'Phase 4: Financial & Logistics',
    title: 'Draft Balanced Line-Item Budget',
    description: 'Detail fees, materials, equipment, insurance, engineering stamps, fabrication, and contingency. Use the budget calculator to check standard percentages.'
  },
  {
    id: 'logistics_safety',
    category: 'Phase 4: Financial & Logistics',
    title: 'Build Logistics & Equipment Safety Plan',
    description: 'Establish lift operator safety certificates, scaffolding barricades, night hazard flags, and pedestrian sidewalk diversion strategies.'
  },
  {
    id: 'final_verification',
    category: 'Phase 5: Submission & Verification',
    title: 'Execute Final Proposal Checklist Audit',
    description: 'Confirm all attachments, visual sheets, references, insurance certificates, and signed affidavits are properly organized in a single high-end PDF portfolio.'
  }
];

export const grantTemplates = [
  {
    id: 'rfp_cover_letter',
    title: 'Standard RFP/RFQ Cover Letter',
    description: 'A formal letter demonstrating alignment with a public art committee’s goals, project constraints, and neighborhood themes.',
    placeholders: ['[Artist Name]', '[Artist Pronouns]', '[RFP Name]', '[Funding Agency]', '[Neighborhood/Theme]', '[Signature]'],
    content: `Dear members of the [Funding Agency] Selection Committee,

I am writing to express my enthusiastic interest in submitting my credentials for the [RFP Name] opportunity. As a professional artist whose work focuses on [Neighborhood/Theme], I am inspired by the community-centric vision outlined in this call, and I welcome the opportunity to create a transformative piece of public art for this site.

Over the past several years, my artistic practice has centered on creating highly engaging public work. I have developed a technical proficiency in working with robust and durable materials, ensuring that my installations are built for longevity, structural integrity, and ease of ongoing maintenance. I have successfully completed similar scope projects on-time and within budget, working in close collaboration with project managers, structural engineers, and fabricators.

What excites me most about [RFP Name] is the focus on community integration. In my practice, I believe public art serves as a catalyst for conversation and neighborhood pride. I intend to approach this project by gathering local stories and translating those narratives into a visually vibrant landmark that respects and honors the unique historical tapestry of the area.

Enclosed with this application, you will find my portfolio, references, and a preliminary feasibility outline. Thank you for your time and consideration of my application. I look forward to the possibility of collaborating with [Funding Agency] to bring this project to life.

Sincerely,

[Artist Name]
[Artist Pronouns]
[Signature]`
  },
  {
    id: 'mural_cover_letter',
    title: 'Mural RFP Proposal Letter',
    description: 'A letter focusing on site-specific murals, scaling up designs, and outdoor weather-proofing.',
    placeholders: ['[Artist Name]', '[Mural Call Title]', '[Site Location]', '[Primary Style/Medium]', '[Maintenance details]'],
    content: `Dear Selection Committee,

Please accept this letter and the accompanying portfolio as my application for the [Mural Call Title] at [Site Location]. 

My name is [Artist Name] and I specialize in large-scale outdoor wall installations using [Primary Style/Medium]. My murals are designed to be high-impact visual landmarks that command attention, spark curiosity, and enhance the walkability of public corridors.

For [Site Location], my design concept centers on creating an uplifting and modern composition. Technically, I am well-versed in outdoor wall preparation, safety rigging, lift operation, and standard weatherproofing techniques. I utilize only premium lightfast acrylics and professional anti-graffiti coatings, assuring that the finished mural retains its vibrant colors for years to come with minimal [Maintenance details].

I take great pride in executing large-scale wall projects in public environments with minimal disruption to local businesses and traffic. I look forward to the opportunity to transform this wall into a dynamic asset for the heritage trail.

Best regards,

[Artist Name]`
  },
  {
    id: 'artist_statement',
    title: 'Community-Centered Artist Statement',
    description: 'A professional statement detailing the conceptual foundation of public art and neighborhood activation.',
    placeholders: ['[Artist Name]', '[Primary Medium/Mediums]', '[Conceptual Philosophy]', '[Community Engagement Method]'],
    content: `[Artist Name] is a visual artist whose work operates at the intersection of history, storytelling, and public space. Utilizing [Primary Medium/Mediums], they create site-specific interventions that encourage viewers to pause and reflect on their connection to the environment and to one another.

At the core of my creative practice is the belief that public art should never be passive. Each piece is constructed as an open dialogue with the surrounding community. My creative process typically begins with [Conceptual Philosophy], gathering local insights and architectural histories, and distilling them into abstract or narrative forms.

By weaving local voices directly into the fabric of the work, the resulting sculpture or mural stands not merely as decoration, but as an authentic reflection of the neighborhood's lived experiences. Through this [Community Engagement Method], the community is invited to take ownership of the art, ensuring its preservation and cultural relevance for future generations.`
  }
];

export const defaultBudgetTemplates = [
  {
    category: 'Artist Fees & Design',
    recommendedPct: 15,
    items: [
      { name: 'Artist Fee (Design & Development)', cost: 3000 },
      { name: 'Artist Fee (Project Management & Execution)', cost: 4500 }
    ],
    presets: [
      'Hourly Rate (Design Hours)',
      'Mockup / Concept Sketch Fee',
      'Revised Proof / Iteration Fee',
      'Final Design Sign-Off Fee',
      'Color Study & Palette Development',
      'Site Visit & Measurement Fee',
      'Photography Reference Session',
      'Buffing / Surface Prep by Artist',
      'Project Management Fee',
      'Artist Travel & Mileage',
      'Studio Rental (Design Phase)',
      'Set-Up Fee (Day of Install)',
      'Teardown / Wrap-Up Fee',
      'Revisions & Change Order Fee',
      'Digital Rendering / 3D Mockup',
      'Licensing Fee (Image/Design Rights)',
      'Artist Assistant (Hourly)',
      'Portfolio Documentation Fee',
    ]
  },
  {
    category: 'Materials & Studio Supplies',
    recommendedPct: 30,
    items: [
      { name: 'Primary Fabrication Materials', cost: 10000 },
      { name: 'Undercoats, Sealants & Protective Finishes', cost: 1500 },
      { name: 'Studio Consumables', cost: 500 }
    ],
    presets: [
      'Exterior Acrylic / Latex Paint (Gallons)',
      'Montana / Ironlak Spray Cans',
      'Primer & Masonry Sealer',
      'Anti-Graffiti Clear Coat',
      'UV-Resistant Varnish / Top Coat',
      'Rollers, Brushes & Applicators',
      'Painter\'s Tape & Masking Film',
      'Drop Cloths & Plastic Sheeting',
      'Sandpaper & Surface Abrasives',
      'Caulk & Gap Filler',
      'Steel / Aluminum Sheet Stock',
      'Welding Wire & Rods',
      'Concrete Mix & Anchoring Epoxy',
      'Wood / Plywood (Substrate)',
      'Mosaic Tile & Adhesive',
      'Resin & Casting Materials',
      'Scaffold Planks & Ties',
      'Ladders (Purchase)',
      'Scissor Lift / Boom Lift (Weekly Rental)',
      'Generator Rental',
      'Extension Cords & Power Distribution',
      'Safety Harness & Fall Arrest Gear',
      'Hard Hats & Hi-Vis Vests',
      'Respirators & Gloves',
      'Assistant Hourly Rate (Materials Handling)',
      'Delivery / Freight of Materials',
      'Storage Unit (Materials)',
    ]
  },
  {
    category: 'Engineering & Fabrication',
    recommendedPct: 20,
    items: [
      { name: 'Structural Engineering Review & Stamp', cost: 2500 },
      { name: 'External Fabricator Fees', cost: 4000 }
    ],
    presets: [
      'Structural Engineer Consultation (Hourly)',
      'Colorado P.E. Stamp Fee',
      'Wind-Load Calculation Report',
      'Soil / Footing Analysis',
      'Seismic Anchoring Review',
      'CNC Plasma / Laser Cutting',
      'Metal Fabrication & Welding Labor',
      'Powder Coating / Patina Finishing',
      'Concrete Footing & Pour Labor',
      'Armature & Internal Framework',
      'Maquette / Scale Model Build',
      '3D Printing Prototype',
      'CAD Drafting & Technical Drawings',
      'Quality Control Inspection',
      'Load Testing & Certification',
    ]
  },
  {
    category: 'Equipment, Shipping & Site Prep',
    recommendedPct: 15,
    items: [
      { name: 'Scissor Lift / Boom Lift Weekly Rental', cost: 1800 },
      { name: 'Rigging & Transportation of Artwork', cost: 1200 },
      { name: 'Site Preparation & Safety Barriers', cost: 800 }
    ],
    presets: [
      'Scissor Lift Rental (Daily)',
      'Boom Lift / Cherry Picker Rental (Weekly)',
      'Forklift Rental',
      'Scaffold System Rental',
      'Scaffold Delivery & Setup Fee',
      'Flat-Bed Truck / Freight Shipping',
      'Art Crate & Custom Packaging',
      'Crane / Rigging Crew (Day Rate)',
      'Rigging Hardware (Straps, Shackles)',
      'Site Survey & Layout',
      'Concrete Cutting / Core Drilling',
      'Site Power & Temporary Utilities',
      'Waste Disposal / Dumpster',
      'Pedestrian Safety Barrier Rental',
      'Traffic Control Cones & Signage',
      'Night-Time Hazard Lighting',
      'Porta-Potty / Site Facilities',
      'Water / Pressure Washing Equipment',
    ]
  },
  {
    category: 'Insurance, Permits & Contingency',
    recommendedPct: 20,
    items: [
      { name: 'General Liability Insurance Upgrade', cost: 600 },
      { name: 'City Encroachment / Scaffold Permits', cost: 400 },
      { name: 'Contingency Fund (Recommended 10-15%)', cost: 4000 }
    ],
    presets: [
      'General Liability Insurance ($1M)',
      'Inland Marine / Art-in-Transit Insurance',
      'Workers\' Comp (if hiring crew)',
      'Denver DOTI Encroachment Permit',
      'CDOT Right-of-Way Permit',
      'Denver Arts & Venues Mural Registry',
      'Building / Structural Permit',
      'Electrical Permit (if wired)',
      'FAA Height Clearance (if >200 ft)',
      'ADA Compliance Review',
      'Community Outreach & Survey Costs',
      'Legal / Contract Review',
      'Accounting & Tax Preparation',
      'Contingency Fund (10%)',
      'Contingency Fund (15%)',
      'Maintenance Reserve (Year 1)',
      'Warranty / Warranty Bond',
    ]
  }
];

export const permittingEngineeringDirectory = [
  {
    id: 'doti_encroachment',
    category: 'Permits',
    name: 'Denver Department of Transportation & Infrastructure (DOTI)',
    role: 'Street, Sidewalk & Scaffolding Encroachment Permits',
    description: 'Required if your scaffold, lift, or sculpture footprint occupies any public sidewalk, street lane, or city right-of-way. Processes temporary construction and permanent encroachment permits.',
    contact: 'DOTI Permit Office - 201 W Colfax Ave, Denver',
    link: 'denvergov.org/doti'
  },
  {
    id: 'denver_arts_mural',
    category: 'Permits',
    name: 'Denver Arts & Venues Mural Registry',
    role: 'Mural Registration & Preservation Registry',
    description: 'Free registry for murals on private property. Registering your mural protects it under municipal ordinances and exempts it from commercial sign codes. Requires landlord consent.',
    contact: 'Denver Arts & Venues - 1345 Champa St, Denver',
    link: 'artsandvenuesdenver.com'
  },
  {
    id: 'kla_engineers',
    category: 'Engineering',
    name: 'KL&A Structural Engineers (Denver & Golden)',
    role: 'Public Art Structural Reviews & PE Stamps',
    description: 'High-end structural engineering firm with extensive experience reviewing outdoor public art installations, anchoring systems, wind-load tolerances, and providing Colorado Professional Engineer (P.E.) stamps.',
    contact: 'KL&A Golden Office - 1819 Denver West Dr',
    link: 'klaengineers.com'
  },
  {
    id: 'peak_structural',
    category: 'Engineering',
    name: 'Peak Structural Foundation Review',
    role: 'Seismic & Geotechnical Anchor Calculations',
    description: 'Provides foundation inspections, soil evaluations, and specialized heavy foundation anchors for large exterior sculptures or tall free-standing mural walls.',
    contact: 'Peak Structural Denver Branch',
    link: 'peakstructural.com'
  },
  {
    id: 'guirys_color',
    category: 'Supplies',
    name: 'Guiry\'s Color Source (Denver Central)',
    role: 'Industrial Spray Coatings & Premium Mural Acrylics',
    description: 'Denver\'s premier supplier of Montana Cans, Golden Artist Colors, premium exterior primers, and industrial weather-proof clear coatings. Offers bulk accounts for registered public artists.',
    contact: '2180 S Colorado Blvd, Denver',
    link: 'guirys.com'
  },
  {
    id: 'recreate_fab',
    category: 'Supplies',
    name: 'Recreate Fabrication Studio',
    role: 'CNC Routing, Custom Welding & Metal Fab',
    description: 'Specializes in high-precision structural metalwork, CNC plasma cutting, and architectural fabrication for artist prototypes and municipal sculpture scaling.',
    contact: '4800 Washington St, Denver',
    link: 'recreatefab.com'
  }
];

export const mmlToneRewrites = {
  rfp_cover_letter: {
    academic: {
      tagline: "Academic Curatorial Tone",
      description: "Applies elevated art-historical, spatial, and conceptual language suitable for galleries and museum panels.",
      intro: "Dear members of the [Funding Agency] Selection Committee,\n\nI am writing to formally submit my credentials for [RFP Name]. My creative methodology operates as a critical spatial dialogue centered on [Neighborhood/Theme], investigating how site-specific interventions can disrupt and activate public spheres. I welcome the opportunity to integrate this rigorous visual and material inquiry into your current project context.",
      body: "My artistic practice is deeply invested in the architectural legacies of our public environments. Over the past several years, I have refined a material lexicon—specifically utilizing weather-hardened polymers, structural metals, and lightfast pigments—to manifest public installations that navigate wind loads, seismic anchors, and rigorous engineering vetting. This structural durability supports a conceptual foundation that prioritizes longevity and seamless curatorial preservation. Having executed complex public commissions on-time and within strict fiscal boundaries, I pride myself on maintaining high-level administrative coordination with lead fabricators, civil planners, and municipal engineers.",
      closing: "What excites me about [RFP Name] is its invitation to investigate neighborhood dynamics. My intention is to conduct extensive historical excavations of the site, translating local community markers into an elevated visual language. Enclosed are my stamps of engineering feasibility, visual samples, and references. Thank you for your review."
    },
    community: {
      tagline: "Community & Equity Tone",
      description: "Emphasizes social equity, grassroots storytelling, diverse representation, and neighborhood activation.",
      intro: "Dear members of the [Funding Agency] Selection Committee,\n\nI am thrilled to submit my application for [RFP Name]. As an artist whose practice is dedicated to amplifying diverse voices and reflecting [Neighborhood/Theme], I am deeply inspired by the inclusive goals of this call and would love to build an authentic visual landmark for this neighborhood.",
      body: "For me, public art is a grassroots catalyst for social healing, dialogue, and community pride. My previous mural and sculpture projects have been created in direct, paid partnership with neighborhood youth, local community advocates, and historical groups. I ensure that my artistic execution is highly accessible and physically safe, planning around clear pedestrian barriers, sidewalk scaffolding permits, and low-impact eco-conscious paints. I bring a solid track record of completing public installations on schedule, working hand-in-hand with neighborhood groups to turn public walls into shared spaces of belonging.",
      closing: "The opportunity to activate [RFP Name] allows me to center local stories that have historically been overlooked. I plan to facilitate listening sessions to shape this design collaboratively. Thank you for your time and for prioritizing community-led creative work."
    },
    eco: {
      tagline: "Eco-Conscious & Sustainable Tone",
      description: "Focuses on sustainable materials, organic aesthetics, environmental footprints, and low-VOC paints.",
      intro: "Dear members of the [Funding Agency] Selection Committee,\n\nI am writing to express my eager interest in [RFP Name]. Focusing my work on [Neighborhood/Theme], my creative practice is anchored in ecological responsibility, visual biophilia, and sustainable public design. I am excited to propose a carbon-conscious, durable installation for this vital space.",
      body: "My structural methodology prioritizes low-VOC exterior coatings, organic sealants, non-toxic anti-graffiti layers, and locally sourced recycled steels or sustainably harvested timbers. I design for structural resilience, planning detailed wind-load evaluations and secure foundation anchors to ensure long-term physical integrity without disrupting surrounding ecosystems. My administrative approach is lean, green, and highly organized, ensuring that shipping, lift operations, and fabrication loops minimize carbon footprints while meeting every municipal milestone.",
      closing: "For [RFP Name], I plan to design an installation that acts as a visual lung for the site, celebrating natural systems and neighborhood identity. Enclosed are my ecological safety datasheets and structural feasibility details. Thank you for supporting sustainable public art."
    },
    street: {
      tagline: "Vibrant Mural & Street Tone",
      description: "Bold, high-impact, modern street art and mural tone designed to energize high-traffic urban corridors.",
      intro: "Dear Selection Committee,\n\nLet's make this wall talk! I am writing to express my massive interest in the [RFP Name] opportunity. My artistic style is centered on [Neighborhood/Theme], using bold, high-contrast, modern street art styles to completely energize the urban space.",
      body: "Over the years, I've mastered the logistics of giant public murals and structural spray coatings. I specialize in scaling designs from small drafts into towering visual highlights, working safely with boom lifts, scaffold structures, and municipal right-of-way permissions. I utilize lightfast Montana spray coatings and industrial anti-graffiti seals to make sure the work stays incredibly crisp, vibrant, and clean for decades. I work fast, keep a pristine studio site, and collaborate tightly with building owners and city permitting boards to deliver head-turning urban landmarks.",
      closing: "I am ready to bring high-energy, vibrant storytelling to [RFP Name] and turn this site into a must-see community focal point. Let's make it happen!"
    }
  },
  mural_cover_letter: {
    academic: {
      tagline: "Academic Curatorial Tone",
      description: "Applies elevated art-historical, spatial, and conceptual language.",
      intro: "Dear Selection Committee,\n\nPlease accept this formal letter and accompanying visual research for the [Mural Call Title] at [Site Location].",
      body: "My name is [Artist Name] and my spatial interventions utilize [Primary Style/Medium] to dissect and reframe public architecture. For [Site Location], I propose a high-impact visual dialogue that responds to local physical vectors. Technically, I am well-versed in scaffolding calculations, high-access boom lift operation, and structural masonry preparation. I treat surfaces with premium lightfast silicates and permanent anti-graffiti shields, ensuring optimal chromatic retention with minimal [Maintenance details].",
      closing: "I look forward to the possibility of executing this site-specific painting, contributing an intellectually stimulating and visually striking landmark to the corridor."
    },
    community: {
      tagline: "Community & Equity Tone",
      description: "Emphasizes social equity, grassroots storytelling, and neighborhood pride.",
      intro: "Dear Selection Committee,\n\nI am so excited to submit my proposal for the [Mural Call Title] mural at [Site Location]!",
      body: "My name is [Artist Name] and I specialize in community-driven large-scale murals using [Primary Style/Medium]. My compositions focus on neighborhood heritage, diverse representation, and local pride. For the mural at [Site Location], my technical workflow includes direct collaboration with community groups and local youth artists. I maintain a safe and accessible workspace, coordinating scaffold platforms, traffic safety cones, and dust-mitigation protocols. The artwork will be protected with long-lasting UV barriers, ensuring that the community feels absolute ownership and joy with simple [Maintenance details].",
      closing: "I would be honored to transform this shared wall into a vibrant mirror of the local neighborhood's history. Thank you for your consideration!"
    },
    eco: {
      tagline: "Eco-Conscious & Sustainable Tone",
      description: "Focuses on sustainable materials, organic aesthetics, and environmental footprints.",
      intro: "Dear Selection Committee,\n\nPlease accept this eco-conscious mural proposal for the [Mural Call Title] at [Site Location].",
      body: "My name is [Artist Name] and I specialize in carbon-conscious public murals using [Primary Style/Medium]. My technical practice centers on non-toxic, bio-based paints, low-VOC pigments, and ecological weatherproofing. For the mural at [Site Location], I plan to utilize solar-powered electric scissor lifts and biodegradable preparation materials. The completed mural will be sealed with a natural anti-microbial, anti-graffiti coating to resist UV wear while minimizing [Maintenance details].",
      closing: "Let's bring a beautiful, environmentally friendly, biophilic visual statement to this key public corridor. Thank you for your support!"
    },
    street: {
      tagline: "Vibrant Mural & Street Tone",
      description: "Bold, high-impact, modern street art and mural tone designed to energize urban walls.",
      intro: "Hey Selection Committee,\n\nI'm ready to bring some serious heat to the [Mural Call Title] at [Site Location]!",
      body: "I'm [Artist Name], a large-scale muralist specializing in high-contrast urban murals using [Primary Style/Medium]. My style is bold, loud, and modern—designed to turn blank walls into viral photo backdrops and community highlights. At [Site Location], I'll use professional heavy-duty lifts, premium lightfast outdoor spray paint, and a bulletproof industrial clear coat that withstands heavy weathering and eliminates [Maintenance details] worries. I run safe, super-organized street art projects that keep traffic flowing and local businesses smiling.",
      closing: "Let's transform this wall into a gorgeous, high-impact urban statement that local residents will talk about for years. Let's paint!"
    }
  },
  artist_statement: {
    academic: {
      tagline: "Academic Curatorial Tone",
      description: "Applies sophisticated conceptual, theoretical, and curatorial phrasing.",
      intro: "[Artist Name] is a contemporary visual researcher whose creative inquiry explores the socio-spatial parameters of urban public environments. Utilizing [Primary Medium/Mediums], they construct site-specific interventions that interrogate the boundaries between historical memory and community geography.",
      body: "[Artist Name] believes that public art has a responsibility to be an active spatial intervention. At the core of my creative practice is a critical rejection of passive public decoration. I treat the urban surface as a living archive, establishing an active dialogue with local spatial dimensions. My methodology is rooted in [Conceptual Philosophy], extracting architectural markers and archival transcripts to distill complex social narratives into abstract or biomorphic forms.",
      closing: "By embedding these curatorial registers into the public realm, my sculptures and murals invite deep critical engagement. Through [Community Engagement Method], the public is positioned not merely as spectators, but as co-creators of spatial meaning, ensuring cultural durability and ongoing relevance."
    },
    community: {
      tagline: "Community & Equity Tone",
      description: "Emphasizes representation, grassroots narratives, and inclusive art practices.",
      intro: "[Artist Name] is a community-first public artist whose practice is dedicated to amplifying marginalized stories and activating neighborhood spaces. Utilizing [Primary Medium/Mediums], they create warm, inclusive, and visually striking artworks that make every resident feel represented.",
      body: "I believe that public art has a responsibility to be a community mirror. My work is built on grassroots conversations, oral histories, and direct collaboration. I begin my design process through [Conceptual Philosophy], hosting community listening circles and story-sharing workshops to ensure the neighborhood's heartbeat is reflected in the final artwork.",
      closing: "Through [Community Engagement Method], the community gains true co-ownership of the sculpture or mural. This process empowers local residents, celebrating our shared heritage and ensuring the artwork remains a beloved neighborhood center for decades."
    },
    eco: {
      tagline: "Eco-Conscious & Sustainable Tone",
      description: "Focuses on ecological biophilia, carbon footprint, and green materials.",
      intro: "[Artist Name] is an eco-centric public artist whose work explores biophilic design, carbon footprints, and environmental stewardship in urban environments. Utilizing [Primary Medium/Mediums], they construct living or sustainable public art that celebrates natural systems.",
      body: "My creative practice treats the environment as my primary partner. I select non-toxic, recycled, and locally sourced materials to ensure a low carbon footprint. My methodology begins with [Conceptual Philosophy], studying local soil, native flora, and seasonal patterns to integrate the installation seamlessly into its ecological niche.",
      closing: "Through [Community Engagement Method], local residents participate in green building, planting, or ecological education. The artwork stands as an eco-educational landmark that fosters environmental mindfulness and respects the urban ecosystem."
    },
    street: {
      tagline: "Vibrant Mural & Street Tone",
      description: "Bold, modern street art, muralism, and head-turning visual energy.",
      intro: "[Artist Name] is a high-energy muralist and street artist who brings bold colors, modern visual styles, and immense graphic impact to city streets. Utilizing [Primary Medium/Mediums], they completely transform blank walls into unforgettable urban landmarks.",
      body: "Public art should turn heads and start conversations. My murals combine modern graphic styling with local urban storytelling. I kick off my mural projects using [Conceptual Philosophy], gathering bold local themes and modern colorways to build high-impact visual focal points.",
      closing: "Through [Community Engagement Method], residents are invited to grab brushes, sign names, or participate in block-party painting sessions. The resulting mural acts as a massive visual spark plug, boosting neighborhood pride and activating the street."
    }
  }
};
