/**
 * CivicVision — Database Seed Script
 * Seeds: 1 authority, 5 citizens, 32 realistic complaints across Bengaluru localities and civic categories
 * All complaint images are real, matching photographs hosted directly on Cloudinary (cloud: dbaqcimmp)
 *
 * Localities: Indiranagar, Koramangala, Jayanagar, Whitefield, HSR Layout, BTM Layout, Rajajinagar, Malleshwaram
 *
 * Run:  node seed.js
 * Run (force reset): node seed.js --fresh   ← wipes existing data first
 */

require('dotenv').config();
const mongoose = require('mongoose');
const User = require('./models/User');
const Complaint = require('./models/Complaint');

const FRESH = process.argv.includes('--fresh');

// ─── Accounts ───────────────────────────────────────────────────────────────

const AUTHORITY = {
  name: 'City Authority',
  email: 'authority@civicvision.com',
  password: 'authority123',
  phone: '9000000001',
  role: 'authority',
};

const CITIZENS = [
  { name: 'Rahul Sharma',   email: 'rahul@example.com',   password: 'citizen123', phone: '9876543201' },
  { name: 'Priya Verma',    email: 'priya@example.com',   password: 'citizen123', phone: '9876543202' },
  { name: 'Arun Nair',      email: 'arun@example.com',    password: 'citizen123', phone: '9876543203' },
  { name: 'Sneha Reddy',    email: 'sneha@example.com',   password: 'citizen123', phone: '9876543204' },
  { name: 'Mohammed Irfan', email: 'irfan@example.com',   password: 'citizen123', phone: '9876543205' },
];

// ─── 32 Realistic Bengaluru Complaints ──────────────────────────────────────
// [title, description, category, area, address, status, cloudinaryUrl]
const COMPLAINT_TEMPLATES = [
  // 1. Roads & Infrastructure
  [
    'Severe Pothole Near Indiranagar Metro Station',
    'A large pothole has developed near the metro station entrance. Two-wheelers are struggling to navigate the damaged road, especially during rainfall. The damaged section requires urgent asphalt filling.',
    'Roads & Infrastructure',
    'Indiranagar',
    'CMH Road, Outside Indiranagar Metro Gate 2',
    'In Progress',
    'https://res.cloudinary.com/dbaqcimmp/image/upload/v1795515144/civicvision/matching_complaints/real_pothole_crater.jpg',
  ],
  [
    'Dangerous Road Cave-in Near School Zone',
    'The road surface has caved in significantly near the school crossing, creating a 3-foot trench that poses a severe hazard to school vans and students on bicycles.',
    'Roads & Infrastructure',
    'Indiranagar',
    '5th Cross, Near Little Flowers School, HAL 2nd Stage',
    'In Progress',
    'https://res.cloudinary.com/dbaqcimmp/image/upload/v1795515145/civicvision/matching_complaints/real_road_cavein.jpg',
  ],
  [
    'Broken and Missing Footpath Slabs',
    'Pedestrian pavement slabs are dislodged, fractured, and jutting upwards for over 50 meters, forcing morning walkers and senior citizens onto the busy roadway.',
    'Roads & Infrastructure',
    'Jayanagar',
    '11th Main Road, 4th Block, Near Cool Joint Junction',
    'Received',
    'https://res.cloudinary.com/dbaqcimmp/image/upload/v1795515146/civicvision/matching_complaints/real_broken_footpath.jpg',
  ],
  [
    'Smashed Concrete Road Divider',
    'The central median concrete divider has been knocked out by a heavy vehicle collision, scattering debris and leaving sharp rebar exposed towards oncoming traffic.',
    'Roads & Infrastructure',
    'Whitefield',
    'ITPL Main Road, 100m Before Hope Farm Junction',
    'Resolved',
    'https://res.cloudinary.com/dbaqcimmp/image/upload/v1795515147/civicvision/matching_complaints/real_road_divider_crash.jpg',
  ],
  [
    'Worn-out Dangerous Speed Breaker',
    'The asphalt speed breaker near the hospital entrance has lost its reflective markings and degraded into sharp stone ridges, causing vehicle damage and sudden braking.',
    'Roads & Infrastructure',
    'HSR Layout',
    '27th Main Road, Sector 2, Opposite Apollo Clinic',
    'In Progress',
    'https://res.cloudinary.com/dbaqcimmp/image/upload/v1795515148/civicvision/matching_complaints/real_speed_breaker_worn.jpg',
  ],
  [
    'Damaged Street Sign and Road Guide Board',
    'The overhead directional street signboard on the intersection is bent, cracked, and obscuring lane vision for motorists turning into the layout.',
    'Roads & Infrastructure',
    'Koramangala',
    '80 Feet Road, 6th Block, Near Maharaja Signal',
    'Received',
    'https://res.cloudinary.com/dbaqcimmp/image/upload/v1795515903/civicvision/matching_complaints/real_damaged_street_sign.jpg',
  ],

  // 2. Drainage & Sewage
  [
    'Open Manhole Missing Cast Iron Lid',
    'A deep underground sewer manhole has been left completely open without a cover or safety barricade right by the city bus stop, posing a fatal trap in the dark.',
    'Drainage',
    'BTM Layout',
    '12th Main Road, 2nd Stage, JP Nagar Border Bus Stand',
    'In Progress',
    'https://res.cloudinary.com/dbaqcimmp/image/upload/v1795515169/civicvision/matching_complaints/real_open_manhole_cover_missing.jpg',
  ],
  [
    'Overflowing Underground Drain and Sewage on Street',
    'Black untreated sewage water is bubbling out of a blocked underground pipeline, flooding the residential lane with foul stench and creating breeding grounds for mosquitoes.',
    'Drainage',
    'Rajajinagar',
    '8th Cross, 1st Block, Near ESI Hospital Back Gate',
    'In Progress',
    'https://res.cloudinary.com/dbaqcimmp/image/upload/v1795515160/civicvision/matching_complaints/real_open_drain_overflowing_sewage.jpg',
  ],
  [
    'Blocked Storm Drain Grate Flooding Main Road',
    'The roadside rainwater storm drain is choked solid with plastic bags, silt, and discarded bottles. Even brief showers cause water to back up across the road.',
    'Drainage',
    'Whitefield',
    'Harlur Main Road, Near Salarpuria Sattva Gate',
    'Received',
    'https://res.cloudinary.com/dbaqcimmp/image/upload/v1795515168/civicvision/matching_complaints/real_blocked_storm_drain_flooding.jpg',
  ],
  [
    'Sewage Water Overflowing Across Public Roadway',
    'Contaminated drain overflow has formed a deep stagnant pool across the junction. Two-wheelers frequently slip, and residents cannot walk past the area safely.',
    'Drainage',
    'Malleshwaram',
    'Margosa Road, Between 7th & 8th Cross',
    'Received',
    'https://res.cloudinary.com/dbaqcimmp/image/upload/v1795515901/civicvision/matching_complaints/real_sewage_water_on_street.jpg',
  ],
  [
    'Severe Road Waterlogging After Rain',
    'Rainwater has accumulated over knee-deep along the primary road underpass due to non-functional drain sumps, stranding cars and halting traffic for hours.',
    'Drainage',
    'Koramangala',
    'Intermediate Ring Road, Near Sony World Junction Underpass',
    'Resolved',
    'https://res.cloudinary.com/dbaqcimmp/image/upload/v1795515899/civicvision/matching_complaints/real_stormwater_flooding_road.jpg',
  ],

  // 3. Water Supply
  [
    'Major Underground Water Main Pipe Burst',
    'A high-pressure BWSSB drinking water pipeline has fractured underground, creating a fountain gushing clean water into the street and eroding the road foundation.',
    'Water Supply',
    'BTM Layout',
    '29th Main Road, 2nd Stage, Near Kuvempu Nagar',
    'Resolved',
    'https://res.cloudinary.com/dbaqcimmp/image/upload/v1795515150/civicvision/matching_complaints/real_burst_water_pipe_gushing.jpg',
  ],
  [
    'Contaminated and Muddy Tap Water Supply',
    'Household municipal tap water is running dark muddy brown with a foul organic smell. Residents suspect an underground sewage seepage into the water main.',
    'Water Supply',
    'Rajajinagar',
    '3rd Block, 59th Cross, Off Chord Road',
    'In Progress',
    'https://res.cloudinary.com/dbaqcimmp/image/upload/v1795515151/civicvision/matching_complaints/real_contaminated_muddy_water.jpg',
  ],
  [
    'Severe Water Pressure Drop in Residential Line',
    'Municipal Cauvery water supply pressure has dropped to an unusable trickle for four straight days. Overhead tanks cannot fill without expensive private tankers.',
    'Water Supply',
    'Malleshwaram',
    '15th Cross, Sampige Road, Near Circle Maramma Temple',
    'Received',
    'https://res.cloudinary.com/dbaqcimmp/image/upload/v1795515151/civicvision/matching_complaints/real_low_water_pressure_trickle.jpg',
  ],
  [
    'Completely Dry Taps for 3 Consecutive Days',
    'No municipal water supply has been released into the street for over 72 hours without any prior BWSSB notice. Families urgently require water tanker deployment.',
    'Water Supply',
    'Koramangala',
    '8th Block, 60 Feet Road, Near National Games Village',
    'Resolved',
    'https://res.cloudinary.com/dbaqcimmp/image/upload/v1795515149/civicvision/matching_complaints/real_no_water_dry_tap.jpg',
  ],
  [
    'Continuous Leakage at Public Water Meter Valve',
    'The civic water distribution meter and valve chamber on the pavement is leaking continuously, flooding the pedestrian walkway and wasting thousands of liters.',
    'Water Supply',
    'Indiranagar',
    '100 Feet Road, Near Domlur Flyover Pillar 14',
    'Received',
    'https://res.cloudinary.com/dbaqcimmp/image/upload/v1795515152/civicvision/matching_complaints/real_leaking_water_meter_valve.jpg',
  ],
  [
    'Damaged and Overflowing Public Water Standpost',
    'The public community water tap tap has lost its shutoff valve, causing clean drinking water to flood uncontrollably across the lane while locals queue.',
    'Water Supply',
    'Jayanagar',
    '9th Block, 38th Cross Road, Near Ragigudda Temple',
    'In Progress',
    'https://res.cloudinary.com/dbaqcimmp/image/upload/v1795515937/civicvision/matching_complaints/real_overflowing_public_tap_leak.jpg',
  ],

  // 4. Electricity
  [
    'Fallen Electric Concrete Pole Blocking Street',
    'A high-tension concrete electric pole snapped during yesterday squall and collapsed across the road, snapping overhead wires and trapping parked vehicles.',
    'Electricity',
    'HSR Layout',
    'Sector 7, Near BDA Shopping Complex',
    'Resolved',
    'https://res.cloudinary.com/dbaqcimmp/image/upload/v1795515154/civicvision/matching_complaints/real_fallen_electric_pole_hazard.jpg',
  ],
  [
    'Tangled and Low-Hanging Live Power Cables',
    'Overhead electrical supply wires have detached from brackets and are dangling barely 5 feet above the public walkway near the children park gate.',
    'Electricity',
    'Koramangala',
    '5th Block, 1st Cross, Near BBMP Children Park',
    'Resolved',
    'https://res.cloudinary.com/dbaqcimmp/image/upload/v1795515154/civicvision/matching_complaints/real_exposed_live_wires_tangled.jpg',
  ],
  [
    'Distribution Transformer Emitting Sparks and Smoke',
    'The street electrical transformer unit is vibrating violently, emitting continuous loud arcing sparks and electrical burning odor. High risk of localized fire.',
    'Electricity',
    'BTM Layout',
    '1st Stage, Dollars Scheme Colony, 16th Main Road',
    'In Progress',
    'https://res.cloudinary.com/dbaqcimmp/image/upload/v1795515156/civicvision/matching_complaints/real_transformer_substation_sparking.jpg',
  ],
  [
    'Unscheduled Recurring Power Cuts in Tech Corridor',
    'Frequent unannounced power outages lasting 4 to 6 hours daily are disrupting businesses, commercial establishments, and residential remote workers.',
    'Electricity',
    'Whitefield',
    'Varthur Main Road, Adjacent to Prestige Tech Park',
    'In Progress',
    'https://res.cloudinary.com/dbaqcimmp/image/upload/v1795515153/civicvision/matching_complaints/real_power_cut_blackout_grid.jpg',
  ],

  // 5. Garbage & Sanitation
  [
    'Massive Overflowing BBMP Garbage Dumpster',
    'The community waste bin has not been cleared by collection trucks for over 8 days. Waste is spilling across the road, blocking traffic and attracting disease vectors.',
    'Garbage & Sanitation',
    'Koramangala',
    '1st Block, Near Sony World Signal Intersection',
    'Resolved',
    'https://res.cloudinary.com/dbaqcimmp/image/upload/v1795515157/civicvision/matching_complaints/real_overflowing_garbage_dumpster.jpg',
  ],
  [
    'Illegal Open Dumping of Construction and Food Waste',
    'Commercial operators and private contractors are repeatedly dumping truckloads of debris, plastic packaging, and organic waste on the roadside perimeter.',
    'Garbage & Sanitation',
    'HSR Layout',
    'Sector 1, BDA Park Perimeter Road',
    'In Progress',
    'https://res.cloudinary.com/dbaqcimmp/image/upload/v1795515158/civicvision/matching_complaints/real_illegal_garbage_dumping_mound.jpg',
  ],
  [
    'Unattended Animal Carcass on Pedestrian Walkway',
    'A dead street dog has been lying beside the storm drain on the main pedestrian footpath for over 48 hours without clearance, posing an acute public health hazard.',
    'Garbage & Sanitation',
    'Indiranagar',
    '12th Main Road, Opposite Apollo Pharmacy',
    'Received',
    'https://res.cloudinary.com/dbaqcimmp/image/upload/v1795515159/civicvision/matching_complaints/real_dead_animal_roadside_hazard.jpg',
  ],
  [
    'Aggressive Stray Packs Around Overflowing Waste Mound',
    'Packs of aggressive stray dogs are constantly feeding around the unsegregated roadside garbage dump, chasing schoolchildren and two-wheelers daily.',
    'Garbage & Sanitation',
    'Malleshwaram',
    '18th Cross, Near West of Chord Road Junction',
    'Received',
    'https://res.cloudinary.com/dbaqcimmp/image/upload/v1795515161/civicvision/matching_complaints/real_stray_animals_garbage_dogs.jpg',
  ],
  [
    'Unhygienic and Inoperable Public Toilet Complex',
    'The public sanitation block has choked drainage, overflowing toilets, non-functional water taps, and broken doors, rendering the entire facility completely unusable.',
    'Garbage & Sanitation',
    'Jayanagar',
    '4th Block Bus Terminus Complex',
    'In Progress',
    'https://res.cloudinary.com/dbaqcimmp/image/upload/v1795515900/civicvision/matching_complaints/real_dirty_public_toilet_sanitation.jpg',
  ],

  // 6. Street Lights
  [
    'Complete Street Light Failure Across 600m Stretch',
    'Every single streetlight fixture along this sector road has been dark for the past week, creating extreme safety concerns for evening commuters and women pedestrians.',
    'Street Lights',
    'BTM Layout',
    '7th Phase, Gottigere Link Road',
    'In Progress',
    'https://res.cloudinary.com/dbaqcimmp/image/upload/v1795515162/civicvision/matching_complaints/real_entire_street_dark_night.jpg',
  ],
  [
    'Flickering and Dim High-Pressure Sodium Lamp',
    'The primary overhead streetlight fixture at the bend flickers constantly and goes pitch black intermittently, blinding motorists negotiating the sharp curve.',
    'Street Lights',
    'Whitefield',
    'Kadugodi Main Road, Near ITPL Gate 3',
    'Received',
    'https://res.cloudinary.com/dbaqcimmp/image/upload/v1795515162/civicvision/matching_complaints/real_flickering_street_lamp_mist.jpg',
  ],
  [
    'Knocked-Down Cast Street Light Mast',
    'A concrete street light lamppost was severed at the base by a delivery truck and is lying flat across the pedestrian sidewalk, blocking wheelchairs and walkers.',
    'Street Lights',
    'HSR Layout',
    '14th Main Road, Sector 4, Near Agara Lake Road',
    'Resolved',
    'https://res.cloudinary.com/dbaqcimmp/image/upload/v1795515163/civicvision/matching_complaints/real_street_light_pole_broken.jpg',
  ],
  [
    'Dark Residential Street With Non-Working Sodium Lamps',
    'All street fixtures in the residential cross have burned out ballast units. Night vision is zero, and vehicle break-ins have been reported recently.',
    'Street Lights',
    'Jayanagar',
    '9th Block, 40 Feet Road, Near East End Circle',
    'Received',
    'https://res.cloudinary.com/dbaqcimmp/image/upload/v1795515155/civicvision/matching_complaints/real_dark_street_light_out.jpg',
  ],

  // 7. Parks & Recreation
  [
    'Damaged Public Benches with Exposed Metal Edges',
    'Multiple concrete and iron benches in the public park are shattered with jagged metal edges exposed, injuring several senior citizens and children.',
    'Parks & Recreation',
    'Jayanagar',
    '7th Block, Jayanagar BDA Recreational Park',
    'Received',
    'https://res.cloudinary.com/dbaqcimmp/image/upload/v1795515164/civicvision/matching_complaints/real_damaged_park_bench_broken.jpg',
  ],
  [
    'Broken Swings and Corroded Children Play Structures',
    'The chain swings and metal slide inside the municipal children park have snapped chains and rusted footings, presenting an imminent injury hazard for toddlers.',
    'Parks & Recreation',
    'Indiranagar',
    'Defence Colony Park, Off 100 Feet Road',
    'Resolved',
    'https://res.cloudinary.com/dbaqcimmp/image/upload/v1795515166/civicvision/matching_complaints/real_broken_playground_swings.jpg',
  ],
  [
    'Defective Park Floodlights Causing Night Insecurity',
    'All four high-mast floodlights inside the walking park are non-operational, leaving jogging paths in pitch dark after 6:30 PM.',
    'Parks & Recreation',
    'Koramangala',
    '3rd Block, BBMP Community Park',
    'In Progress',
    'https://res.cloudinary.com/dbaqcimmp/image/upload/v1795515165/civicvision/matching_complaints/real_park_lights_out_dark_walkway.jpg',
  ],

  // 8. Public Safety
  [
    'Non-Functional CCTV Surveillance Camera at Market',
    'The public safety surveillance cameras mounted at the main vegetable and commercial market junction have had severed cables for over a month with no maintenance.',
    'Public Safety',
    'Rajajinagar',
    'Market Road, 4th Block, Opposite Metro Station',
    'In Progress',
    'https://res.cloudinary.com/dbaqcimmp/image/upload/v1795515166/civicvision/matching_complaints/real_cctv_camera_pole_broken.jpg',
  ],
  [
    'Heavy Footpath Encroachment Forcing Pedestrians onto Road',
    'Commercial stalls, illegal tin awnings, and display crates have completely swallowed the entire sidewalk width, forcing children and commuters into live traffic.',
    'Public Safety',
    'Malleshwaram',
    'Sampige Road, Near 8th Cross Corner',
    'Received',
    'https://res.cloudinary.com/dbaqcimmp/image/upload/v1795515167/civicvision/matching_complaints/real_footpath_encroachment_market.jpg',
  ],
  [
    'Defective Traffic Signal Junction Causing Gridlock',
    'The electronic traffic signal pole at the four-way crossroads is dark and non-operational, causing chaotic vehicle pileups, gridlocks, and near collisions.',
    'Public Safety',
    'Whitefield',
    'Whitefield Main Road, Near Kundalahalli Gate Crossing',
    'In Progress',
    'https://res.cloudinary.com/dbaqcimmp/image/upload/v1795515936/civicvision/matching_complaints/real_broken_traffic_signal_pole.jpg',
  ],
];

// ─── Helpers ─────────────────────────────────────────────────────────────────

function daysAgo(n) {
  const d = new Date();
  d.setDate(d.getDate() - n);
  return d;
}

// ─── Main ────────────────────────────────────────────────────────────────────

async function seed() {
  console.log('\n🌱 CivicVision Seed Script (Realistic Public Issues)');
  console.log('════════════════════════════════════════════════════════\n');

  await mongoose.connect(process.env.MONGODB_URI);
  console.log('✅ Connected to MongoDB Atlas\n');

  if (FRESH) {
    await User.deleteMany({});
    await Complaint.deleteMany({});
    console.log('🗑️  Cleared existing data (--fresh mode)\n');
  }

  // ── 1. Authority ────────────────────────────────────────────────────────────
  let authority = await User.findOne({ email: AUTHORITY.email });
  if (!authority) {
    authority = await User.create(AUTHORITY);
    console.log('👮 Authority account created');
    console.log(`   Email    : ${AUTHORITY.email}`);
    console.log(`   Password : ${AUTHORITY.password}\n`);
  } else {
    console.log('👮 Authority account ready:', authority.email);
  }

  // ── 2. Citizens ─────────────────────────────────────────────────────────────
  const citizenDocs = [];
  let newCitizens = 0;
  for (const c of CITIZENS) {
    let doc = await User.findOne({ email: c.email });
    if (!doc) {
      doc = await User.create({ ...c, role: 'citizen' });
      newCitizens++;
    }
    citizenDocs.push(doc);
  }
  if (newCitizens > 0) {
    console.log(`👥 Created ${newCitizens} citizen account(s)`);
  } else {
    console.log(`👥 All ${citizenDocs.length} citizen accounts ready`);
  }

  // ── 3. Complaints ────────────────────────────────────────────────────────────
  // Always synchronize or recreate realistic complaints
  if (FRESH || (await Complaint.countDocuments()) === 0) {
    const complaints = COMPLAINT_TEMPLATES.map(([title, description, category, area, address, status, imageUrl], i) => {
      const citizen = citizenDocs[i % citizenDocs.length];
      const daysBack = (i % 25) + 1;

      const remarks = [];
      if (status === 'In Progress') {
        remarks.push({
          text: 'Inspection conducted by field municipal engineering team. Work order generated and vendor notified.',
          addedBy: authority._id,
          addedAt: daysAgo(Math.max(1, daysBack - 2)),
        });
      }
      if (status === 'Resolved') {
        remarks.push({
          text: 'Inspection conducted by field municipal engineering team. Work order generated.',
          addedBy: authority._id,
          addedAt: daysAgo(Math.max(2, daysBack - 3)),
        });
        remarks.push({
          text: 'Repair and restoration completed successfully. Quality check signed off by the ward engineer.',
          addedBy: authority._id,
          addedAt: daysAgo(Math.max(0, daysBack - 1)),
        });
      }

      return {
        title,
        description,
        category,
        area,
        address,
        status,
        citizen: citizen._id,
        remarks,
        image: imageUrl,
        createdAt: daysAgo(daysBack),
        updatedAt: daysAgo(Math.max(0, daysBack - 1)),
      };
    });

    await Complaint.insertMany(complaints);
    console.log(`\n📋 Inserted ${complaints.length} realistic complaints with real Cloudinary photos.`);
  } else {
    console.log('\n🔄 Updating all complaints to ensure 100% realistic Bengaluru descriptions and Cloudinary photos...');
    // Replace all records with the curated 36 realistic complaints
    await Complaint.deleteMany({});
    const complaints = COMPLAINT_TEMPLATES.map(([title, description, category, area, address, status, imageUrl], i) => {
      const citizen = citizenDocs[i % citizenDocs.length];
      const daysBack = (i % 25) + 1;

      const remarks = [];
      if (status === 'In Progress') {
        remarks.push({
          text: 'Inspection conducted by field municipal engineering team. Work order generated and vendor notified.',
          addedBy: authority._id,
          addedAt: daysAgo(Math.max(1, daysBack - 2)),
        });
      }
      if (status === 'Resolved') {
        remarks.push({
          text: 'Inspection conducted by field municipal engineering team. Work order generated.',
          addedBy: authority._id,
          addedAt: daysAgo(Math.max(2, daysBack - 3)),
        });
        remarks.push({
          text: 'Repair and restoration completed successfully. Quality check signed off by the ward engineer.',
          addedBy: authority._id,
          addedAt: daysAgo(Math.max(0, daysBack - 1)),
        });
      }

      return {
        title,
        description,
        category,
        area,
        address,
        status,
        citizen: citizen._id,
        remarks,
        image: imageUrl,
        createdAt: daysAgo(daysBack),
        updatedAt: daysAgo(Math.max(0, daysBack - 1)),
      };
    });

    await Complaint.insertMany(complaints);
    console.log(`✅ Replaced existing collection with ${complaints.length} realistic complaints.`);
  }

  // Summary breakdown
  const allDocs = await Complaint.find();
  const byStatus = { Received: 0, 'In Progress': 0, Resolved: 0 };
  const byCategory = {};
  const byArea = {};
  allDocs.forEach(c => {
    byStatus[c.status] = (byStatus[c.status] || 0) + 1;
    byCategory[c.category] = (byCategory[c.category] || 0) + 1;
    byArea[c.area] = (byArea[c.area] || 0) + 1;
  });

  console.log('\n📊 Realistic Database Breakdown:');
  console.log('   Status:');
  Object.entries(byStatus).forEach(([s, n]) => console.log(`   • ${s.padEnd(14)} ${n}`));
  console.log('   Categories:');
  Object.entries(byCategory).forEach(([cat, n]) => console.log(`   • ${cat.padEnd(24)} ${n}`));
  console.log('   Bengaluru Localities:');
  Object.entries(byArea).forEach(([ar, n]) => console.log(`   • ${ar.padEnd(20)} ${n}`));

  console.log('\n════════════════════════════════════════════════════════');
  console.log('🎉 Realistic CivicVision database successfully seeded!');
  console.log('Cloudinary Folder: civicvision/matching_complaints');
  console.log('Login credentials:');
  console.log('  Authority → authority@civicvision.com / authority123');
  console.log('  Citizen   → rahul@example.com / citizen123  (or any other citizen)');
  console.log('════════════════════════════════════════════════════════\n');

  await mongoose.disconnect();
  process.exit(0);
}

seed().catch(err => {
  console.error('\n❌ Seed failed:', err.message);
  process.exit(1);
});
