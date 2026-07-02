// priceMin / priceMax in KSh. null = quotation required.
export const SERVICES = [
  {
    id: 'plumbing', name: 'Plumbing', icon: '💧', color: '#4A90D9',
    description: 'Leaks, drainage, installations & more',
    categories: [
      { id: 'leak-repairs', name: 'Leak Repairs', icon: '🔧', emergency: false, services: [
        { id: 'pipe-leakage',   name: 'Pipe Leakage Repair',            duration: '1–2 hrs',   pricingType: 'Fixed',     priceMin: 1500,  priceMax: 4000  },
        { id: 'tap-leakage',    name: 'Tap / Faucet Leakage',           duration: '30–60 min', pricingType: 'Fixed',     priceMin: 800,   priceMax: 2000  },
        { id: 'toilet-leakage', name: 'Toilet Leakage',                 duration: '1–2 hrs',   pricingType: 'Fixed',     priceMin: 1200,  priceMax: 3000  },
        { id: 'shower-leakage', name: 'Shower Leakage',                 duration: '1–2 hrs',   pricingType: 'Fixed',     priceMin: 1500,  priceMax: 3500  },
        { id: 'tank-leakage',   name: 'Water Tank Leakage',             duration: '2–3 hrs',   pricingType: 'Fixed',     priceMin: 2500,  priceMax: 6000  },
        { id: 'underground',    name: 'Underground Pipe Leak Detection', duration: '2–4 hrs',   pricingType: 'Quotation', priceMin: null,  priceMax: null  },
      ]},
      { id: 'drainage', name: 'Drainage Services', icon: '🌊', emergency: false, services: [
        { id: 'drain-unclog',  name: 'Drain Unclogging',         duration: '1–2 hrs',   pricingType: 'Fixed',     priceMin: 1000,  priceMax: 2500  },
        { id: 'sink-block',    name: 'Sink Blockage',             duration: '30–60 min', pricingType: 'Fixed',     priceMin: 800,   priceMax: 2000  },
        { id: 'toilet-block',  name: 'Toilet Blockage',           duration: '1 hr',      pricingType: 'Fixed',     priceMin: 1000,  priceMax: 2500  },
        { id: 'bath-drain',    name: 'Bathroom Drainage Repair',  duration: '1–2 hrs',   pricingType: 'Fixed',     priceMin: 1000,  priceMax: 2500  },
        { id: 'sewer-clean',   name: 'Sewer Line Cleaning',       duration: '2–4 hrs',   pricingType: 'Quotation', priceMin: null,  priceMax: null  },
        { id: 'bad-smell',     name: 'Bad Smell Diagnosis',       duration: '1 hr',      pricingType: 'Fixed',     priceMin: 1000,  priceMax: 2000  },
      ]},
      { id: 'toilet-bathroom', name: 'Toilet & Bathroom', icon: '🚿', emergency: false, services: [
        { id: 'toilet-install',  name: 'Toilet Installation',       duration: '2–3 hrs', pricingType: 'Fixed',     priceMin: 3000,  priceMax: 7000  },
        { id: 'toilet-repair',   name: 'Toilet Repair',             duration: '1–2 hrs', pricingType: 'Fixed',     priceMin: 1500,  priceMax: 4000  },
        { id: 'flush-repair',    name: 'Flush System Repair',       duration: '1 hr',    pricingType: 'Fixed',     priceMin: 1200,  priceMax: 3000  },
        { id: 'sink-install',    name: 'Sink Installation',         duration: '1–2 hrs', pricingType: 'Fixed',     priceMin: 2500,  priceMax: 5000  },
        { id: 'sink-repair',     name: 'Sink Repair',               duration: '1 hr',    pricingType: 'Fixed',     priceMin: 1000,  priceMax: 2500  },
        { id: 'shower-install',  name: 'Shower Installation',       duration: '2–4 hrs', pricingType: 'Fixed',     priceMin: 5000,  priceMax: 12000 },
        { id: 'shower-pressure', name: 'Shower Pressure Repair',    duration: '1–2 hrs', pricingType: 'Fixed',     priceMin: 1500,  priceMax: 3500  },
        { id: 'bath-pipe',       name: 'Bathroom Pipe Replacement', duration: '2–4 hrs', pricingType: 'Quotation', priceMin: null,  priceMax: null  },
      ]},
      { id: 'kitchen-plumbing', name: 'Kitchen Plumbing', icon: '🍳', emergency: false, services: [
        { id: 'kitchen-sink-i', name: 'Kitchen Sink Installation', duration: '1–2 hrs',  pricingType: 'Fixed',  priceMin: 2500, priceMax: 5000 },
        { id: 'kitchen-sink-r', name: 'Kitchen Sink Repair',       duration: '1 hr',     pricingType: 'Fixed',  priceMin: 1000, priceMax: 2500 },
        { id: 'water-filter',   name: 'Water Filter Installation', duration: '1–2 hrs',  pricingType: 'Fixed',  priceMin: 2000, priceMax: 4000 },
        { id: 'dishwasher',     name: 'Dishwasher Connection',     duration: '1–2 hrs',  pricingType: 'Fixed',  priceMin: 2000, priceMax: 4000 },
        { id: 'kitchen-pipe',   name: 'Kitchen Pipe Replacement',  duration: '2–3 hrs',  pricingType: 'Fixed',  priceMin: 2000, priceMax: 5000 },
        { id: 'tap-replace',    name: 'Tap Replacement',           duration: '30–60 min',pricingType: 'Fixed',  priceMin: 800,  priceMax: 2000 },
      ]},
      { id: 'water-system', name: 'Water System Services', icon: '⚙️', emergency: false, services: [
        { id: 'tank-install',  name: 'Water Tank Installation', duration: '3–5 hrs', pricingType: 'Quotation', priceMin: null,  priceMax: null  },
        { id: 'tank-clean',    name: 'Water Tank Cleaning',     duration: '2–3 hrs', pricingType: 'Fixed',     priceMin: 2500,  priceMax: 5000  },
        { id: 'pump-install',  name: 'Water Pump Installation', duration: '2–4 hrs', pricingType: 'Fixed',     priceMin: 4000,  priceMax: 10000 },
        { id: 'pressure-fix',  name: 'Water Pressure Fixing',   duration: '1–2 hrs', pricingType: 'Fixed',     priceMin: 2000,  priceMax: 5000  },
        { id: 'pipe-routing',  name: 'Pipe Routing',            duration: '3–6 hrs', pricingType: 'Quotation', priceMin: null,  priceMax: null  },
        { id: 'waterline',     name: 'Water Line Repair',       duration: '2–4 hrs', pricingType: 'Quotation', priceMin: null,  priceMax: null  },
      ]},
      { id: 'installations', name: 'Installation Services', icon: '🔩', emergency: false, services: [
        { id: 'new-piping',  name: 'New Piping Installation',    duration: '4–8 hrs',  pricingType: 'Quotation', priceMin: null, priceMax: null  },
        { id: 'house-plumb', name: 'House Plumbing Setup',       duration: '1–2 days', pricingType: 'Quotation', priceMin: null, priceMax: null  },
        { id: 'pipe-ext',    name: 'Pipe Extensions',            duration: '2–4 hrs',  pricingType: 'Fixed',     priceMin: 2000, priceMax: 5000  },
        { id: 'outdoor-tap', name: 'Outdoor Tap Installation',   duration: '1–2 hrs',  pricingType: 'Fixed',     priceMin: 1500, priceMax: 3500  },
        { id: 'washer-conn', name: 'Washing Machine Connection', duration: '1 hr',     pricingType: 'Fixed',     priceMin: 1500, priceMax: 3000  },
      ]},
      { id: 'emergency-plumbing', name: 'Emergency Plumbing', icon: '🚨', emergency: true, services: [
        { id: 'burst-pipes',  name: 'Burst Pipes',                   duration: 'ASAP', pricingType: 'Priority', priceMin: 3000, priceMax: 8000  },
        { id: 'overflow',     name: 'Overflowing Toilet',            duration: 'ASAP', pricingType: 'Priority', priceMin: 2000, priceMax: 5000  },
        { id: 'major-leak',   name: 'Major Leakage',                 duration: 'ASAP', pricingType: 'Priority', priceMin: 2500, priceMax: 7000  },
        { id: 'emrg-drain',   name: 'Emergency Drainage Blockage',   duration: 'ASAP', pricingType: 'Priority', priceMin: 2000, priceMax: 5000  },
        { id: 'no-water',     name: 'No Water Supply Issues',        duration: 'ASAP', pricingType: 'Priority', priceMin: 2000, priceMax: 6000  },
      ]},
      { id: 'inspection', name: 'Inspection & Maintenance', icon: '🔍', emergency: false, services: [
        { id: 'plumb-inspect', name: 'Plumbing Inspection',       duration: '1–2 hrs', pricingType: 'Fixed', priceMin: 1500, priceMax: 3000 },
        { id: 'prev-maint',    name: 'Preventive Maintenance',    duration: '2–3 hrs', pricingType: 'Fixed', priceMin: 2000, priceMax: 4000 },
        { id: 'press-inspect', name: 'Water Pressure Inspection', duration: '1 hr',    pricingType: 'Fixed', priceMin: 1000, priceMax: 2000 },
        { id: 'leak-detect',   name: 'Leak Detection Inspection', duration: '1–2 hrs', pricingType: 'Fixed', priceMin: 1500, priceMax: 3500 },
      ]},
    ],
  },

  {
    id: 'electrical', name: 'Electrical', icon: '⚡', color: '#F6C90E',
    description: 'Wiring, repairs, installations & more',
    categories: [
      { id: 'socket-switch', name: 'Sockets & Switches', icon: '🔌', emergency: false, services: [
        { id: 'socket-rep',  name: 'Socket Repair',             duration: '30–60 min', pricingType: 'Fixed', priceMin: 800,  priceMax: 2000 },
        { id: 'socket-rep2', name: 'Socket Replacement',        duration: '30–60 min', pricingType: 'Fixed', priceMin: 1000, priceMax: 2500 },
        { id: 'switch-rep',  name: 'Switch Repair',             duration: '30 min',    pricingType: 'Fixed', priceMin: 500,  priceMax: 1500 },
        { id: 'switch-ins',  name: 'Switch Installation',       duration: '30–60 min', pricingType: 'Fixed', priceMin: 800,  priceMax: 2000 },
        { id: 'loose-conn',  name: 'Loose Connection Fixing',   duration: '1 hr',      pricingType: 'Fixed', priceMin: 800,  priceMax: 2000 },
        { id: 'outlet-ins',  name: 'Power Outlet Installation', duration: '1–2 hrs',   pricingType: 'Fixed', priceMin: 1500, priceMax: 3500 },
      ]},
      { id: 'lighting', name: 'Lighting Services', icon: '💡', emergency: false, services: [
        { id: 'bulb-rep',   name: 'Bulb Replacement',            duration: '15–30 min', pricingType: 'Fixed', priceMin: 300,  priceMax: 800   },
        { id: 'light-fix',  name: 'Light Fixture Installation',  duration: '1–2 hrs',   pricingType: 'Fixed', priceMin: 2000, priceMax: 5000  },
        { id: 'led-ins',    name: 'LED Light Installation',      duration: '1–2 hrs',   pricingType: 'Fixed', priceMin: 2000, priceMax: 5000  },
        { id: 'sec-light',  name: 'Security Light Installation', duration: '2–3 hrs',   pricingType: 'Fixed', priceMin: 3000, priceMax: 7000  },
        { id: 'chandelier', name: 'Chandelier Installation',     duration: '2–4 hrs',   pricingType: 'Fixed', priceMin: 5000, priceMax: 15000 },
        { id: 'out-light',  name: 'Outdoor Lighting Repair',    duration: '1–2 hrs',   pricingType: 'Fixed', priceMin: 2000, priceMax: 5000  },
      ]},
      { id: 'wiring', name: 'Wiring Services', icon: '🔗', emergency: false, services: [
        { id: 'house-rewire', name: 'House Rewiring',           duration: '1–3 days', pricingType: 'Quotation', priceMin: null, priceMax: null  },
        { id: 'faulty-wire',  name: 'Faulty Wiring Repair',    duration: '2–4 hrs',  pricingType: 'Fixed',     priceMin: 3000, priceMax: 8000  },
        { id: 'new-wire',     name: 'New Wiring Installation',  duration: '3–6 hrs',  pricingType: 'Quotation', priceMin: null, priceMax: null  },
        { id: 'cable-rep',    name: 'Cable Replacement',        duration: '2–4 hrs',  pricingType: 'Fixed',     priceMin: 2000, priceMax: 6000  },
        { id: 'elec-ext',     name: 'Electrical Extensions',   duration: '1–3 hrs',  pricingType: 'Fixed',     priceMin: 1500, priceMax: 4000  },
        { id: 'conc-wire',    name: 'Concealed Wiring Repair',  duration: '2–5 hrs',  pricingType: 'Quotation', priceMin: null, priceMax: null  },
      ]},
      { id: 'power-failure', name: 'Power Failure & Troubleshooting', icon: '⚠️', emergency: false, services: [
        { id: 'outage-diag', name: 'Power Outage Diagnosis',        duration: '1–2 hrs',  pricingType: 'Fixed', priceMin: 1000, priceMax: 2500 },
        { id: 'circuit-tr',  name: 'Circuit Troubleshooting',       duration: '1–2 hrs',  pricingType: 'Fixed', priceMin: 1500, priceMax: 3000 },
        { id: 'tripping',    name: 'Tripping Issue Repair',         duration: '1–2 hrs',  pricingType: 'Fixed', priceMin: 1500, priceMax: 3500 },
        { id: 'short-cir',   name: 'Short Circuit Repair',          duration: '1–3 hrs',  pricingType: 'Fixed', priceMin: 2000, priceMax: 6000 },
        { id: 'partial-pow', name: 'Partial Power Failure Repair',  duration: '1–3 hrs',  pricingType: 'Fixed', priceMin: 2000, priceMax: 5000 },
        { id: 'fuse-rep',    name: 'Fuse Repair',                   duration: '30–60 min',pricingType: 'Fixed', priceMin: 500,  priceMax: 1500 },
      ]},
      { id: 'breaker-board', name: 'Circuit Breaker & Distribution Board', icon: '🗄️', emergency: false, services: [
        { id: 'breaker-rep', name: 'Breaker Replacement',             duration: '1–2 hrs', pricingType: 'Fixed',     priceMin: 2000, priceMax: 5000  },
        { id: 'db-install',  name: 'Distribution Board Installation', duration: '3–5 hrs', pricingType: 'Quotation', priceMin: null, priceMax: null  },
        { id: 'fusebox',     name: 'Fuse Box Repair',                 duration: '1–2 hrs', pricingType: 'Fixed',     priceMin: 2000, priceMax: 5000  },
        { id: 'circuit-bal', name: 'Circuit Balancing',               duration: '2–3 hrs', pricingType: 'Fixed',     priceMin: 2000, priceMax: 4000  },
        { id: 'mcb-rep',     name: 'MCB Replacement',                 duration: '1 hr',    pricingType: 'Fixed',     priceMin: 1500, priceMax: 3500  },
        { id: 'panel-upg',   name: 'Electrical Panel Upgrade',        duration: '4–8 hrs', pricingType: 'Quotation', priceMin: null, priceMax: null  },
      ]},
      { id: 'appliance-conn', name: 'Appliance Connections', icon: '🏠', emergency: false, services: [
        { id: 'cooker-conn',  name: 'Cooker Connection',                 duration: '1–2 hrs', pricingType: 'Fixed', priceMin: 2000, priceMax: 4000 },
        { id: 'oven-conn',    name: 'Oven Connection',                   duration: '1–2 hrs', pricingType: 'Fixed', priceMin: 2000, priceMax: 4000 },
        { id: 'heater-conn',  name: 'Water Heater Connection',           duration: '1–2 hrs', pricingType: 'Fixed', priceMin: 2500, priceMax: 5000 },
        { id: 'washer-elec',  name: 'Washing Machine Electrical Setup',  duration: '1 hr',    pricingType: 'Fixed', priceMin: 1500, priceMax: 3000 },
        { id: 'ac-elec',      name: 'Air Conditioner Electrical Setup',  duration: '2–3 hrs', pricingType: 'Fixed', priceMin: 3000, priceMax: 7000 },
      ]},
      { id: 'elec-install', name: 'Installation Services', icon: '🔧', emergency: false, services: [
        { id: 'fan-inst',  name: 'Ceiling Fan Installation',  duration: '1–2 hrs',   pricingType: 'Fixed',     priceMin: 2000, priceMax: 4000 },
        { id: 'tv-mount',  name: 'TV Mounting with Wiring',   duration: '1–2 hrs',   pricingType: 'Fixed',     priceMin: 2500, priceMax: 5000 },
        { id: 'doorbell',  name: 'Doorbell Installation',     duration: '30–60 min', pricingType: 'Fixed',     priceMin: 1500, priceMax: 3500 },
        { id: 'cctv-pow',  name: 'CCTV Power Setup',          duration: '2–4 hrs',   pricingType: 'Fixed',     priceMin: 3000, priceMax: 8000 },
        { id: 'gen-conn',  name: 'Generator Connection',      duration: '3–5 hrs',   pricingType: 'Quotation', priceMin: null, priceMax: null },
      ]},
      { id: 'backup-power', name: 'Backup Power Systems', icon: '🔋', emergency: false, services: [
        { id: 'inverter',   name: 'Inverter Installation',       duration: '2–4 hrs', pricingType: 'Fixed',     priceMin: 4000,  priceMax: 10000 },
        { id: 'battery-bk', name: 'Battery Backup Setup',        duration: '2–3 hrs', pricingType: 'Fixed',     priceMin: 5000,  priceMax: 15000 },
        { id: 'gen-setup',  name: 'Generator Setup',             duration: '3–5 hrs', pricingType: 'Quotation', priceMin: null,  priceMax: null  },
        { id: 'ups-inst',   name: 'UPS Installation',            duration: '1–2 hrs', pricingType: 'Fixed',     priceMin: 2000,  priceMax: 5000  },
        { id: 'solar-elec', name: 'Solar Electrical Connection', duration: '4–8 hrs', pricingType: 'Quotation', priceMin: null,  priceMax: null  },
      ]},
      { id: 'emergency-elec', name: 'Emergency Electrical', icon: '🚨', emergency: true, services: [
        { id: 'burn-smell',   name: 'Burning Smell Diagnosis',  duration: 'ASAP', pricingType: 'Priority', priceMin: 2000, priceMax: 5000 },
        { id: 'exposed-wire', name: 'Exposed Wire Repair',      duration: 'ASAP', pricingType: 'Priority', priceMin: 2500, priceMax: 6000 },
        { id: 'sparks',       name: 'Electrical Sparks',        duration: 'ASAP', pricingType: 'Priority', priceMin: 2000, priceMax: 6000 },
        { id: 'danger-short', name: 'Dangerous Short Circuits', duration: 'ASAP', pricingType: 'Priority', priceMin: 3000, priceMax: 8000 },
        { id: 'blackout',     name: 'Emergency Blackout Repair',duration: 'ASAP', pricingType: 'Priority', priceMin: 2000, priceMax: 5000 },
      ]},
    ],
  },

  {
    id: 'cleaning', name: 'Cleaning', icon: '✨', color: '#4FD1C5',
    description: 'Deep cleaning, upholstery, carpets & more',
    categories: [
      // ── SMART SERVICES (special routing) ──────────────────
      {
        id: 'laundry', name: 'Laundry', icon: '👕', emergency: false,
        serviceMode: 'nearest',         // GPS-based nearest provider matching
        specialRoute: '/laundry',
        badge: '📍 Nearest Matched',
        description: 'We find the best-rated laundry near you automatically',
        services: [
          { id: 'wash-fold',   name: 'Wash & Fold',        duration: 'Same day',  pricingType: 'Per kg',   priceMin: 150,  priceMax: 250  },
          { id: 'dry-clean',   name: 'Dry Cleaning',       duration: '1–2 days',  pricingType: 'Per item', priceMin: 300,  priceMax: 800  },
          { id: 'ironing',     name: 'Ironing Only',       duration: 'Same day',  pricingType: 'Per item', priceMin: 30,   priceMax: 80   },
          { id: 'duvet',       name: 'Duvet / Blanket',    duration: '1–2 days',  pricingType: 'Fixed',    priceMin: 800,  priceMax: 1500 },
          { id: 'suit-clean',  name: 'Suit Dry Cleaning',  duration: '1–2 days',  pricingType: 'Fixed',    priceMin: 600,  priceMax: 1200 },
          { id: 'express',     name: 'Express 3-hr Wash',  duration: '3 hrs',     pricingType: 'Premium',  priceMin: 500,  priceMax: 1000 },
        ],
      },
      {
        id: 'carpet-wash', name: 'Carpet Washing', icon: '🪣', emergency: false,
        serviceMode: 'pickup-delivery', // Rider picks up, takes to station, returns
        specialRoute: '/carpet-washing',
        badge: '🚚 Pickup & Delivery',
        description: 'We collect your carpet, deep-clean it, and return it to you',
        services: [
          { id: 'small-carpet',  name: 'Small Carpet (≤ 4×6 ft)',    duration: '1–2 days', pricingType: 'Fixed',      priceMin: 1500,  priceMax: 2500  },
          { id: 'medium-carpet', name: 'Medium Carpet (4×6 – 6×9)',  duration: '1–2 days', pricingType: 'Fixed',      priceMin: 2500,  priceMax: 4000  },
          { id: 'large-carpet',  name: 'Large Carpet (6×9 ft+)',     duration: '2–3 days', pricingType: 'Fixed',      priceMin: 4000,  priceMax: 7000  },
          { id: 'persian-rug',   name: 'Persian / Antique Rug',      duration: '2–3 days', pricingType: 'Quotation',  priceMin: null,  priceMax: null  },
          { id: 'carpet-stain',  name: 'Stain Treatment Only',       duration: 'Same day', pricingType: 'Fixed',      priceMin: 1000,  priceMax: 2500  },
          { id: 'carpet-odor',   name: 'Odor & Sanitization',        duration: '1–2 days', pricingType: 'Fixed',      priceMin: 1500,  priceMax: 3000  },
        ],
      },
      {
        id: 'curtain-clean', name: 'Curtain Cleaning', icon: '🪟', emergency: false,
        serviceMode: 'hybrid',          // Onsite removal + pickup or onsite wash
        badge: '🔄 Onsite or Pickup',
        description: 'We clean curtains on-site or collect and return them',
        services: [
          { id: 'curtain-onsite',  name: 'Onsite Curtain Cleaning',    duration: '2–4 hrs',  pricingType: 'Fixed',   priceMin: 2000, priceMax: 5000 },
          { id: 'curtain-pickup',  name: 'Pickup & Deliver Cleaning',  duration: '1–2 days', pricingType: 'Fixed',   priceMin: 1500, priceMax: 4000 },
          { id: 'blind-clean',     name: 'Blind Cleaning',             duration: '1–2 hrs',  pricingType: 'Fixed',   priceMin: 1000, priceMax: 2500 },
          { id: 'sheer-clean',     name: 'Sheer / Net Curtain Clean',  duration: '1–2 hrs',  pricingType: 'Fixed',   priceMin: 800,  priceMax: 2000 },
        ],
      },
      // ── ONSITE SERVICES ────────────────────────────────────
      { id: 'house-clean', name: 'House Cleaning', icon: '🏠', emergency: false, serviceMode: 'onsite', badge: '🏠 Onsite', services: [
        { id: 'studio',     name: 'Studio Apartment Cleaning', duration: '2–3 hrs', pricingType: 'Fixed',      priceMin: 1500, priceMax: 2500  },
        { id: '1bed',       name: '1-Bedroom Cleaning',        duration: '2–3 hrs', pricingType: 'Fixed',      priceMin: 2000, priceMax: 3500  },
        { id: '2bed',       name: '2-Bedroom Cleaning',        duration: '3–4 hrs', pricingType: 'Fixed',      priceMin: 2500, priceMax: 4500  },
        { id: '3bed',       name: '3-Bedroom Cleaning',        duration: '4–6 hrs', pricingType: 'Fixed',      priceMin: 3500, priceMax: 6000  },
        { id: 'full-house', name: 'Full House Cleaning',       duration: '4–8 hrs', pricingType: 'Size-based', priceMin: 5000, priceMax: 15000 },
        { id: 'routine',    name: 'Routine Residential',       duration: '2–4 hrs', pricingType: 'Fixed',      priceMin: 2000, priceMax: 4000  },
      ]},
      { id: 'deep-clean', name: 'Deep Cleaning', icon: '🧹', emergency: false, services: [
        { id: 'full-deep',  name: 'Full Deep House Cleaning',  duration: '6–10 hrs', pricingType: 'Premium', priceMin: 5000,  priceMax: 12000 },
        { id: 'kitchen-dp', name: 'Kitchen Deep Cleaning',     duration: '2–4 hrs',  pricingType: 'Fixed',   priceMin: 2000,  priceMax: 4500  },
        { id: 'bath-deep',  name: 'Bathroom Deep Cleaning',    duration: '1–2 hrs',  pricingType: 'Fixed',   priceMin: 1000,  priceMax: 2500  },
        { id: 'hard-stain', name: 'Hard Stain Removal',        duration: '1–3 hrs',  pricingType: 'Fixed',   priceMin: 1500,  priceMax: 3500  },
        { id: 'grease',     name: 'Grease Removal',            duration: '1–2 hrs',  pricingType: 'Fixed',   priceMin: 1500,  priceMax: 3000  },
        { id: 'surface',    name: 'Detailed Surface Cleaning', duration: '2–4 hrs',  pricingType: 'Fixed',   priceMin: 2000,  priceMax: 4000  },
      ]},
      { id: 'sofa', name: 'Sofa & Upholstery', icon: '🛋️', emergency: false, serviceMode: 'hybrid', badge: '🔄 Onsite or Pickup', services: [
        { id: 'sofa-cl',   name: 'Sofa Cleaning',            duration: '1–3 hrs',  pricingType: 'Fixed', priceMin: 2000, priceMax: 5000 },
        { id: 'couch-cl',  name: 'Couch Cleaning',           duration: '1–2 hrs',  pricingType: 'Fixed', priceMin: 1500, priceMax: 3500 },
        { id: 'chair-cl',  name: 'Chair Cleaning',           duration: '30–60 min',pricingType: 'Fixed', priceMin: 800,  priceMax: 1500 },
        { id: 'uphol-st',  name: 'Upholstery Stain Removal', duration: '1–2 hrs',  pricingType: 'Fixed', priceMin: 1500, priceMax: 3000 },
        { id: 'fabric-cl', name: 'Fabric Cleaning',          duration: '1–2 hrs',  pricingType: 'Fixed', priceMin: 1500, priceMax: 3000 },
      ]},
      { id: 'carpet', name: 'Carpet & Rug (Onsite)', icon: '🪣', emergency: false, serviceMode: 'onsite', badge: '🏠 Onsite', services: [
        { id: 'carpet-vac', name: 'Carpet Vacuuming',     duration: '1 hr',    pricingType: 'Fixed', priceMin: 1000, priceMax: 2000 },
        { id: 'carpet-dp',  name: 'Deep Carpet Cleaning', duration: '2–4 hrs', pricingType: 'Fixed', priceMin: 2500, priceMax: 5000 },
        { id: 'rug-cl',     name: 'Rug Cleaning',         duration: '1–3 hrs', pricingType: 'Fixed', priceMin: 1500, priceMax: 3500 },
        { id: 'carpet-st',  name: 'Carpet Stain Removal', duration: '1–2 hrs', pricingType: 'Fixed', priceMin: 1500, priceMax: 3000 },
        { id: 'odor',       name: 'Odor Treatment',       duration: '1–2 hrs', pricingType: 'Fixed', priceMin: 2000, priceMax: 4000 },
      ]},
      { id: 'mattress', name: 'Mattress Cleaning', icon: '🛏️', emergency: false, serviceMode: 'onsite', badge: '🏠 Onsite', services: [
        { id: 'matt-vac',  name: 'Mattress Vacuuming',       duration: '30–60 min', pricingType: 'Fixed', priceMin: 800,  priceMax: 1500 },
        { id: 'dust-mite', name: 'Dust Mite Treatment',      duration: '1–2 hrs',   pricingType: 'Fixed', priceMin: 2000, priceMax: 4000 },
        { id: 'matt-odor', name: 'Mattress Odor Removal',    duration: '1 hr',      pricingType: 'Fixed', priceMin: 1500, priceMax: 3000 },
        { id: 'matt-st',   name: 'Mattress Stain Treatment', duration: '1 hr',      pricingType: 'Fixed', priceMin: 1500, priceMax: 3000 },
        { id: 'matt-san',  name: 'Mattress Sanitization',    duration: '1–2 hrs',   pricingType: 'Fixed', priceMin: 2000, priceMax: 4000 },
      ]},
      { id: 'windows', name: 'Window & Glass Cleaning', icon: '🪟', emergency: false, services: [
        { id: 'int-win',  name: 'Interior Window Cleaning', duration: '1–2 hrs',  pricingType: 'Fixed', priceMin: 1000, priceMax: 2500 },
        { id: 'ext-win',  name: 'Exterior Window Cleaning', duration: '2–4 hrs',  pricingType: 'Fixed', priceMin: 2000, priceMax: 5000 },
        { id: 'glass-dr', name: 'Glass Door Cleaning',      duration: '30–60 min',pricingType: 'Fixed', priceMin: 800,  priceMax: 1500 },
        { id: 'mirror',   name: 'Mirror Cleaning',          duration: '30 min',   pricingType: 'Fixed', priceMin: 500,  priceMax: 1000 },
        { id: 'balc-gl',  name: 'Balcony Glass Cleaning',   duration: '1–2 hrs',  pricingType: 'Fixed', priceMin: 1500, priceMax: 3000 },
      ]},
      {
        id: 'office-clean', name: 'Office Cleaning', icon: '🏢', emergency: false, serviceMode: 'onsite', badge: '🏠 Onsite', services: [
          { id: 'small-office',  name: 'Small Office (≤ 10 desks)',  duration: '2–3 hrs', pricingType: 'Fixed',      priceMin: 3000, priceMax: 5000  },
          { id: 'medium-office', name: 'Medium Office (10–30 desks)',duration: '3–5 hrs', pricingType: 'Fixed',      priceMin: 5000, priceMax: 9000  },
          { id: 'large-office',  name: 'Large Office (30+ desks)',   duration: '5–8 hrs', pricingType: 'Quotation',  priceMin: null, priceMax: null  },
          { id: 'boardroom',     name: 'Boardroom Cleaning',         duration: '1–2 hrs', pricingType: 'Fixed',      priceMin: 2000, priceMax: 4000  },
          { id: 'office-daily',  name: 'Daily Office Contract',      duration: 'Daily',   pricingType: 'Quotation',  priceMin: null, priceMax: null  },
          { id: 'floor-polish',  name: 'Floor Polishing',            duration: '2–4 hrs', pricingType: 'Fixed',      priceMin: 3000, priceMax: 7000  },
        ],
      },
      { id: 'move-clean', name: 'Move-In / Move-Out Cleaning', icon: '📦', emergency: false, serviceMode: 'onsite', badge: '🏠 Onsite', services: [
        { id: 'handover',  name: 'Apartment Handover Cleaning',   duration: '4–8 hrs', pricingType: 'Fixed', priceMin: 4000, priceMax: 9000 },
        { id: 'tenant-ex', name: 'Tenant Exit Cleaning',          duration: '4–8 hrs', pricingType: 'Fixed', priceMin: 4000, priceMax: 9000 },
        { id: 'prop-prep', name: 'Property Preparation Cleaning', duration: '4–8 hrs', pricingType: 'Fixed', priceMin: 4000, priceMax: 9000 },
        { id: 'empty-h',   name: 'Empty House Cleaning',          duration: '4–8 hrs', pricingType: 'Fixed', priceMin: 3500, priceMax: 8000 },
      ]},
      { id: 'post-const', name: 'Post-Construction Cleaning', icon: '🏗️', emergency: false, services: [
        { id: 'dust-rem',  name: 'Dust Removal',            duration: '2–4 hrs', pricingType: 'Quotation', priceMin: null, priceMax: null },
        { id: 'paint-cl',  name: 'Paint Stain Cleaning',    duration: '2–4 hrs', pricingType: 'Quotation', priceMin: null, priceMax: null },
        { id: 'cement-cl', name: 'Cement Residue Cleaning', duration: '2–4 hrs', pricingType: 'Quotation', priceMin: null, priceMax: null },
        { id: 'debris',    name: 'Debris Cleanup',          duration: '2–5 hrs', pricingType: 'Quotation', priceMin: null, priceMax: null },
        { id: 'polish',    name: 'Surface Polishing',       duration: '2–4 hrs', pricingType: 'Quotation', priceMin: null, priceMax: null },
      ]},
    ],
  },

  {
    id: 'painting', name: 'Painting', icon: '🎨', color: '#FC8A4D',
    description: 'Interior, exterior, decorative & more',
    categories: [
      { id: 'interior', name: 'Interior Painting', icon: '🏠', emergency: false, services: [
        { id: 'bedroom',   name: 'Bedroom Painting',     duration: '1–2 days', pricingType: 'Size-based', priceMin: 4000,  priceMax: 9000  },
        { id: 'living',    name: 'Living Room Painting', duration: '1–2 days', pricingType: 'Size-based', priceMin: 6000,  priceMax: 14000 },
        { id: 'kitchen',   name: 'Kitchen Painting',     duration: '1 day',    pricingType: 'Size-based', priceMin: 5000,  priceMax: 11000 },
        { id: 'bathroom',  name: 'Bathroom Painting',    duration: '1 day',    pricingType: 'Fixed',      priceMin: 3000,  priceMax: 7000  },
        { id: 'ceiling',   name: 'Ceiling Painting',     duration: '1 day',    pricingType: 'Size-based', priceMin: 4000,  priceMax: 10000 },
        { id: 'full-h',    name: 'Full House Painting',  duration: '3–7 days', pricingType: 'Quotation',  priceMin: null,  priceMax: null  },
      ]},
      { id: 'exterior', name: 'Exterior Painting', icon: '🏢', emergency: false, services: [
        { id: 'ext-wall', name: 'Exterior Wall Painting', duration: '2–5 days', pricingType: 'Quotation',  priceMin: null, priceMax: null  },
        { id: 'gate',     name: 'Gate Painting',          duration: '1 day',    pricingType: 'Fixed',      priceMin: 2500, priceMax: 6000  },
        { id: 'fence',    name: 'Fence Painting',         duration: '1–2 days', pricingType: 'Size-based', priceMin: 2000, priceMax: 8000  },
        { id: 'balcony',  name: 'Balcony Painting',       duration: '1 day',    pricingType: 'Fixed',      priceMin: 3000, priceMax: 7000  },
        { id: 'roof',     name: 'Roof Painting',          duration: '2–4 days', pricingType: 'Quotation',  priceMin: null, priceMax: null  },
        { id: 'compound', name: 'Compound Wall Painting', duration: '2–5 days', pricingType: 'Quotation',  priceMin: null, priceMax: null  },
      ]},
      { id: 'wall-prep', name: 'Wall Preparation', icon: '🖌️', emergency: false, services: [
        { id: 'scraping',  name: 'Wall Scraping',     duration: '1–3 hrs', pricingType: 'Fixed',      priceMin: 1500, priceMax: 4000 },
        { id: 'sanding',   name: 'Sanding',           duration: '1–3 hrs', pricingType: 'Fixed',      priceMin: 1500, priceMax: 3500 },
        { id: 'crack',     name: 'Crack Filling',     duration: '1–2 hrs', pricingType: 'Fixed',      priceMin: 1000, priceMax: 3000 },
        { id: 'putty',     name: 'Putty Application', duration: '1 day',   pricingType: 'Size-based', priceMin: 3000, priceMax: 8000 },
        { id: 'smoothing', name: 'Surface Smoothing', duration: '1–3 hrs', pricingType: 'Fixed',      priceMin: 1500, priceMax: 3500 },
        { id: 'old-paint', name: 'Old Paint Removal', duration: '2–5 hrs', pricingType: 'Fixed',      priceMin: 2000, priceMax: 5000 },
      ]},
      { id: 'decorative', name: 'Decorative Painting', icon: '🌟', emergency: false, services: [
        { id: 'texture',   name: 'Texture Painting',       duration: '1–3 days', pricingType: 'Premium', priceMin: 8000,  priceMax: 25000 },
        { id: 'accent',    name: 'Accent Wall Painting',   duration: '1 day',    pricingType: 'Fixed',   priceMin: 4000,  priceMax: 10000 },
        { id: 'wallpaper', name: 'Wallpaper Installation', duration: '1–2 days', pricingType: 'Fixed',   priceMin: 5000,  priceMax: 15000 },
        { id: 'custom',    name: 'Custom Color Designs',   duration: '1–3 days', pricingType: 'Premium', priceMin: 10000, priceMax: 30000 },
        { id: 'pattern',   name: 'Pattern Painting',       duration: '1–3 days', pricingType: 'Premium', priceMin: 8000,  priceMax: 20000 },
      ]},
      { id: 'wood-metal', name: 'Wood & Metal Painting', icon: '🚪', emergency: false, services: [
        { id: 'door',      name: 'Door Painting',          duration: '1 day',    pricingType: 'Fixed',     priceMin: 2500, priceMax: 5000  },
        { id: 'window-fr', name: 'Window Frame Painting',  duration: '1 day',    pricingType: 'Fixed',     priceMin: 2000, priceMax: 4000  },
        { id: 'cabinet',   name: 'Cabinet Painting',       duration: '1–2 days', pricingType: 'Fixed',     priceMin: 3000, priceMax: 8000  },
        { id: 'furniture', name: 'Furniture Painting',     duration: '1–2 days', pricingType: 'Quotation', priceMin: null, priceMax: null  },
        { id: 'metal-g',   name: 'Metal Gate Painting',    duration: '1 day',    pricingType: 'Fixed',     priceMin: 2500, priceMax: 6000  },
        { id: 'grill',     name: 'Grill Painting',         duration: '1 day',    pricingType: 'Fixed',     priceMin: 2000, priceMax: 5000  },
      ]},
      { id: 'waterproofing', name: 'Waterproofing & Protective Coating', icon: '🛡️', emergency: false, services: [
        { id: 'damp',       name: 'Damp Wall Treatment',    duration: '1–2 days', pricingType: 'Fixed',     priceMin: 4000, priceMax: 9000  },
        { id: 'waterproof', name: 'Waterproof Coating',     duration: '1–2 days', pricingType: 'Fixed',     priceMin: 5000, priceMax: 12000 },
        { id: 'roof-wp',    name: 'Roof Waterproofing',     duration: '2–4 days', pricingType: 'Quotation', priceMin: null, priceMax: null  },
        { id: 'mold-coat',  name: 'Mold-Resistant Coating', duration: '1–2 days', pricingType: 'Fixed',     priceMin: 4000, priceMax: 9000  },
      ]},
      { id: 'touchup', name: 'Touch-Up & Maintenance', icon: '✏️', emergency: false, services: [
        { id: 'touchup',   name: 'Paint Touch-Ups',        duration: '1–3 hrs', pricingType: 'Fixed', priceMin: 1000, priceMax: 3000 },
        { id: 'small-rep', name: 'Small Area Repainting',  duration: '2–4 hrs', pricingType: 'Fixed', priceMin: 2000, priceMax: 5000 },
        { id: 'stain-cov', name: 'Stain Covering',         duration: '1–2 hrs', pricingType: 'Fixed', priceMin: 1500, priceMax: 3500 },
        { id: 'dmg-rep',   name: 'Damage Repainting',      duration: '2–4 hrs', pricingType: 'Fixed', priceMin: 2500, priceMax: 6000 },
      ]},
      { id: 'movein-paint', name: 'Move-In / Move-Out Painting', icon: '📦', emergency: false, services: [
        { id: 'apt-rep',  name: 'Apartment Repainting',      duration: '3–7 days', pricingType: 'Quotation', priceMin: null, priceMax: null },
        { id: 'tenant-h', name: 'Tenant Handover Painting',  duration: '3–7 days', pricingType: 'Quotation', priceMin: null, priceMax: null },
        { id: 'prop-ref', name: 'Property Refresh Painting', duration: '3–7 days', pricingType: 'Quotation', priceMin: null, priceMax: null },
      ]},
    ],
  },

  {
    id: 'movers', name: 'Movers', icon: '📦', color: '#9F7AEA',
    description: 'House moves, office relocation & item transport — free quote',
    categories: [
      // ALL movers services are quotation-based: final price depends on
      // distance, goods volume and vehicle size (pickup / canter / lorry) —
      // none of which are known before the mover assesses the request.
      { id: 'house-moving', name: 'House Moving', icon: '🏠', emergency: false, services: [
        { id: 'bedsitter-move',  name: 'Bedsitter / Studio Move',             duration: '3–5 hrs', pricingType: 'Quotation', priceMin: null, priceMax: null },
        { id: 'one-br-move',     name: '1-Bedroom House Move',                duration: '4–6 hrs', pricingType: 'Quotation', priceMin: null, priceMax: null },
        { id: 'two-br-move',     name: '2-Bedroom House Move',                duration: '5–8 hrs', pricingType: 'Quotation', priceMin: null, priceMax: null },
        { id: 'three-br-move',   name: '3+ Bedroom House Move',               duration: '1 day',   pricingType: 'Quotation', priceMin: null, priceMax: null },
        { id: 'estate-move',     name: 'Within-Estate Move (Short Distance)', duration: '2–4 hrs', pricingType: 'Quotation', priceMin: null, priceMax: null },
      ]},
      { id: 'office-moving', name: 'Office & Business Moving', icon: '🏢', emergency: false, services: [
        { id: 'small-office',    name: 'Small Office Move',                   duration: '1 day',   pricingType: 'Quotation', priceMin: null, priceMax: null },
        { id: 'shop-relocation', name: 'Shop / Kiosk Relocation',             duration: '3–6 hrs', pricingType: 'Quotation', priceMin: null, priceMax: null },
        { id: 'equipment-move',  name: 'Business Equipment Transport',        duration: '2–4 hrs', pricingType: 'Quotation', priceMin: null, priceMax: null },
      ]},
      { id: 'item-transport', name: 'Single Item Transport', icon: '🛋️', emergency: false, services: [
        { id: 'furniture-item',  name: 'Furniture Item (Sofa, Bed, Wardrobe)', duration: '1–2 hrs', pricingType: 'Quotation', priceMin: null, priceMax: null },
        { id: 'appliance-item',  name: 'Appliance (Fridge, Cooker, Washer)',   duration: '1–2 hrs', pricingType: 'Quotation', priceMin: null, priceMax: null },
        { id: 'mattress-small',  name: 'Mattress / Small Items',               duration: '1 hr',    pricingType: 'Quotation', priceMin: null, priceMax: null },
        { id: 'fragile-item',    name: 'Fragile Item (TV, Glass, Mirror)',     duration: '1–2 hrs', pricingType: 'Quotation', priceMin: null, priceMax: null },
      ]},
      { id: 'packing-labor', name: 'Packing & Labour', icon: '📋', emergency: false, services: [
        { id: 'packing-service',   name: 'Professional Packing Service', duration: '2–4 hrs', pricingType: 'Quotation', priceMin: null, priceMax: null },
        { id: 'load-offload',      name: 'Loading & Offloading Only',    duration: '1–3 hrs', pricingType: 'Quotation', priceMin: null, priceMax: null },
        { id: 'packing-materials', name: 'Packing Materials Supply',     duration: '1 hr',    pricingType: 'Quotation', priceMin: null, priceMax: null },
      ]},
      { id: 'emergency-moving', name: 'Same-Day / Urgent Moving', icon: '🚨', emergency: true, services: [
        { id: 'same-day-move',   name: 'Same-Day House Move',   duration: 'ASAP', pricingType: 'Quotation', priceMin: null, priceMax: null },
        { id: 'urgent-item',     name: 'Urgent Item Transport', duration: 'ASAP', pricingType: 'Quotation', priceMin: null, priceMax: null },
      ]},
    ],
  },

  {
    id: 'water-carriers', name: 'Water Delivery', icon: '🚰', color: '#00B5D8',
    description: 'Clean water delivery — jerrycans, bulk & emergency',
    categories: [
      { id: 'jerrycan-delivery', name: 'Jerrycan Delivery (20L)', icon: '🛢️', emergency: false, services: [
        { id: 'jerrycan-5',      name: '1–5 Jerrycans',                  duration: '30–60 min', pricingType: 'Fixed',     priceMin: 400,  priceMax: 700  },
        { id: 'jerrycan-10',     name: '6–10 Jerrycans',                 duration: '30–60 min', pricingType: 'Fixed',     priceMin: 700,  priceMax: 1100 },
        { id: 'jerrycan-20',     name: '11–20 Jerrycans',                duration: '1–2 hrs',   pricingType: 'Fixed',     priceMin: 1100, priceMax: 1800 },
        { id: 'jerrycan-bulk',   name: '20+ Jerrycans (Bulk Order)',     duration: '1–2 hrs',   pricingType: 'Quotation', priceMin: null, priceMax: null },
      ]},
      { id: 'drinking-water', name: 'Drinking Water', icon: '🥤', emergency: false, services: [
        { id: 'dispenser-refill', name: 'Dispenser Bottle Refill (18.9L)', duration: '30–60 min', pricingType: 'Fixed', priceMin: 300,  priceMax: 700  },
        { id: 'dispenser-x5',     name: '5 × Dispenser Bottles',           duration: '1 hr',      pricingType: 'Fixed', priceMin: 1200, priceMax: 2200 },
      ]},
      { id: 'bulk-water', name: 'Bulk Water (Bowser / Tanker)', icon: '🚛', emergency: false, services: [
        { id: 'bowser-1000',     name: 'Water Bowser 1,000L',            duration: '1–2 hrs', pricingType: 'Fixed',     priceMin: 2500, priceMax: 5500  },
        { id: 'bowser-5000',     name: 'Water Bowser 5,000L',            duration: '1–3 hrs', pricingType: 'Fixed',     priceMin: 6000, priceMax: 12000 },
        { id: 'bowser-10000',    name: 'Water Bowser 10,000L+',          duration: '2–4 hrs', pricingType: 'Quotation', priceMin: null, priceMax: null  },
        { id: 'tank-filling',    name: 'Tank Filling Service',           duration: '1–3 hrs', pricingType: 'Quotation', priceMin: null, priceMax: null  },
      ]},
      { id: 'scheduled-water', name: 'Scheduled Delivery', icon: '📅', emergency: false, services: [
        { id: 'weekly-delivery',  name: 'Weekly Scheduled Delivery',     duration: 'Recurring', pricingType: 'Fixed',     priceMin: 350, priceMax: 650 },
        { id: 'monthly-plan',     name: 'Monthly Delivery Plan',         duration: 'Recurring', pricingType: 'Quotation', priceMin: null, priceMax: null },
      ]},
      { id: 'emergency-water', name: 'Emergency Water', icon: '🚨', emergency: true, services: [
        { id: 'emergency-jerrycan', name: 'Same-Day Emergency Delivery', duration: 'ASAP', pricingType: 'Priority', priceMin: 800,  priceMax: 2000 },
        { id: 'shortage-rescue',    name: 'Water Shortage Rescue (Bulk)', duration: 'ASAP', pricingType: 'Priority', priceMin: 3000, priceMax: 8000 },
      ]},
    ],
  },
];

// ── Helper to format price display ──────────────────────────
export function formatPrice(service) {
  if (!service) return 'TBD';
  const { pricingType, priceMin, priceMax } = service;

  if (pricingType === 'Quotation') return 'Quote on inspection';
  if (!priceMin) return 'Quote on inspection';

  const fmt = (n) => `KSh ${n.toLocaleString()}`;

  switch (pricingType) {
    case 'Priority':   return `${fmt(priceMin)} – ${fmt(priceMax)} + call-out fee`;
    case 'Size-based': return `From ${fmt(priceMin)} (size-based)`;
    case 'Premium':    return `${fmt(priceMin)} – ${fmt(priceMax)}`;
    default:           return `${fmt(priceMin)} – ${fmt(priceMax)}`;
  }
}
