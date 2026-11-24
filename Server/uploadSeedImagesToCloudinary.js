require('dotenv').config();
const cloudinary = require('./config/cloudinary');
const mongoose = require('mongoose');
const Complaint = require('./models/Complaint');

// Source images representing real civic issues
const SEED_IMAGES = [
  {
    key: 'pothole',
    url: 'https://images.unsplash.com/photo-1515162816999-a0c47dc192f7?auto=format&fit=crop&w=800&q=80',
    category: 'Roads & Infrastructure',
    titleMatch: 'Pothole',
  },
  {
    key: 'road_cavein',
    url: 'https://images.unsplash.com/photo-1544620347-c4fd4a3d5957?auto=format&fit=crop&w=800&q=80',
    category: 'Roads & Infrastructure',
    titleMatch: 'Cave-in',
  },
  {
    key: 'broken_footpath',
    url: 'https://images.unsplash.com/photo-1590486803833-1c5dc8ddd4c8?auto=format&fit=crop&w=800&q=80',
    category: 'Roads & Infrastructure',
    titleMatch: 'Footpath',
  },
  {
    key: 'road_divider',
    url: 'https://images.unsplash.com/photo-1506521781263-d8422e82f27a?auto=format&fit=crop&w=800&q=80',
    category: 'Roads & Infrastructure',
    titleMatch: 'Divider',
  },
  {
    key: 'speed_breaker',
    url: 'https://images.unsplash.com/photo-1584463699039-38c237e1b5f2?auto=format&fit=crop&w=800&q=80',
    category: 'Roads & Infrastructure',
    titleMatch: 'Speed Breaker',
  },
  {
    key: 'water_tanker',
    url: 'https://images.unsplash.com/photo-1527199768775-bdabf3b31023?auto=format&fit=crop&w=800&q=80',
    category: 'Water Supply',
    titleMatch: 'No Water',
  },
  {
    key: 'burst_pipe',
    url: 'https://images.unsplash.com/photo-1585829365295-ab7cd400c167?auto=format&fit=crop&w=800&q=80',
    category: 'Water Supply',
    titleMatch: 'Burst',
  },
  {
    key: 'contaminated_water',
    url: 'https://images.unsplash.com/photo-1541888946425-d0fbb186f5f7?auto=format&fit=crop&w=800&q=80',
    category: 'Water Supply',
    titleMatch: 'Contaminated',
  },
  {
    key: 'low_water_pressure',
    url: 'https://images.unsplash.com/photo-1584467735871-8e85353a8413?auto=format&fit=crop&w=800&q=80',
    category: 'Water Supply',
    titleMatch: 'Pressure',
  },
  {
    key: 'leaking_meter',
    url: 'https://images.unsplash.com/photo-1615915468538-0fbd857888ca?auto=format&fit=crop&w=800&q=80',
    category: 'Water Supply',
    titleMatch: 'Meter',
  },
  {
    key: 'power_cuts',
    url: 'https://images.unsplash.com/photo-1473341304170-971dccb5ac1e?auto=format&fit=crop&w=800&q=80',
    category: 'Electricity',
    titleMatch: 'Power',
  },
  {
    key: 'electric_pole',
    url: 'https://images.unsplash.com/photo-1509390144018-eefd98344605?auto=format&fit=crop&w=800&q=80',
    category: 'Electricity',
    titleMatch: 'Pole',
  },
  {
    key: 'live_wires',
    url: 'https://images.unsplash.com/photo-1544725176-7c40e5a71c5e?auto=format&fit=crop&w=800&q=80',
    category: 'Electricity',
    titleMatch: 'Wires',
  },
  {
    key: 'transformer',
    url: 'https://images.unsplash.com/photo-1520690214124-2405c5217036?auto=format&fit=crop&w=800&q=80',
    category: 'Electricity',
    titleMatch: 'Transformer',
  },
  {
    key: 'garbage_overflow',
    url: 'https://images.unsplash.com/photo-1605600659908-0ef719419d41?auto=format&fit=crop&w=800&q=80',
    category: 'Garbage & Sanitation',
    titleMatch: 'Bin',
  },
  {
    key: 'illegal_dumping',
    url: 'https://images.unsplash.com/photo-1530587191325-3db32d826c18?auto=format&fit=crop&w=800&q=80',
    category: 'Garbage & Sanitation',
    titleMatch: 'Dumping',
  },
  {
    key: 'dead_animal',
    url: 'https://images.unsplash.com/photo-1528323273322-d81458248d40?auto=format&fit=crop&w=800&q=80',
    category: 'Garbage & Sanitation',
    titleMatch: 'Animal',
  },
  {
    key: 'stray_animals',
    url: 'https://images.unsplash.com/photo-1611284446314-60a58ac0deb9?auto=format&fit=crop&w=800&q=80',
    category: 'Garbage & Sanitation',
    titleMatch: 'Stray',
  },
  {
    key: 'street_dark',
    url: 'https://images.unsplash.com/photo-1517457373958-b7bdd4587205?auto=format&fit=crop&w=800&q=80',
    category: 'Street Lights',
    titleMatch: 'Dark',
  },
  {
    key: 'flickering_lights',
    url: 'https://images.unsplash.com/photo-1534447677768-be436bb09401?auto=format&fit=crop&w=800&q=80',
    category: 'Street Lights',
    titleMatch: 'Flickering',
  },
  {
    key: 'broken_light_pole',
    url: 'https://images.unsplash.com/photo-1508873696983-2df5293cb32f?auto=format&fit=crop&w=800&q=80',
    category: 'Street Lights',
    titleMatch: 'Pole Broken',
  },
  {
    key: 'park_bench',
    url: 'https://images.unsplash.com/photo-1519331379826-f10be5486c6f?auto=format&fit=crop&w=800&q=80',
    category: 'Parks & Recreation',
    titleMatch: 'Bench',
  },
  {
    key: 'park_lights',
    url: 'https://images.unsplash.com/photo-1568605117036-5fe5e7bab0b7?auto=format&fit=crop&w=800&q=80',
    category: 'Parks & Recreation',
    titleMatch: 'Park Lights',
  },
  {
    key: 'play_equipment',
    url: 'https://images.unsplash.com/photo-1576013551627-0cc20b96c2a7?auto=format&fit=crop&w=800&q=80',
    category: 'Parks & Recreation',
    titleMatch: 'Equipment',
  },
  {
    key: 'cctv_broken',
    url: 'https://images.unsplash.com/photo-1557597774-9d273605dfa9?auto=format&fit=crop&w=800&q=80',
    category: 'Public Safety',
    titleMatch: 'CCTV',
  },
  {
    key: 'footpath_encroachment',
    url: 'https://images.unsplash.com/photo-1526374965328-7f61d4dc18c5?auto=format&fit=crop&w=800&q=80',
    category: 'Public Safety',
    titleMatch: 'Encroachment',
  },
  {
    key: 'drain_overflow',
    url: 'https://images.unsplash.com/photo-1517411032315-54ef2cb783bb?auto=format&fit=crop&w=800&q=80',
    category: 'Drainage',
    titleMatch: 'Overflowing',
  },
  {
    key: 'storm_drain',
    url: 'https://images.unsplash.com/photo-1544620347-c4fd4a3d5957?auto=format&fit=crop&w=800&q=80',
    category: 'Drainage',
    titleMatch: 'Storm Drain',
  },
  {
    key: 'manhole_missing',
    url: 'https://images.unsplash.com/photo-1590486803833-1c5dc8ddd4c8?auto=format&fit=crop&w=800&q=80',
    category: 'Drainage',
    titleMatch: 'Manhole',
  },
];

async function main() {
  console.log('🚀 Uploading civic issue images directly to Cloudinary account: dbaqcimmp...\n');

  const uploadedMap = {};

  for (const item of SEED_IMAGES) {
    try {
      console.log(`Uploading ${item.key}...`);
      const res = await cloudinary.uploader.upload(item.url, {
        folder: 'civicvision/seed',
        public_id: item.key,
        overwrite: true,
      });
      uploadedMap[item.key] = res.secure_url;
      console.log(`  ✓ ${item.key} -> ${res.secure_url}`);
    } catch (err) {
      console.error(`  ✗ Error uploading ${item.key}:`, err.message);
    }
  }

  console.log('\n✅ All images uploaded to Cloudinary!');
  console.log('\nConnecting to MongoDB to update existing complaints with Cloudinary URLs...');

  await mongoose.connect(process.env.MONGODB_URI);
  const complaints = await Complaint.find();

  for (const comp of complaints) {
    // Find matching uploaded image
    let match = SEED_IMAGES.find(img => comp.title.toLowerCase().includes(img.titleMatch.toLowerCase()));
    if (!match) {
      match = SEED_IMAGES.find(img => img.category === comp.category) || SEED_IMAGES[0];
    }
    const cloudinaryUrl = uploadedMap[match.key] || Object.values(uploadedMap)[0];
    if (cloudinaryUrl) {
      comp.image = cloudinaryUrl;
      await comp.save();
    }
  }

  console.log(`✅ Updated ${complaints.length} complaints with real Cloudinary URLs in MongoDB!`);

  // Print sample
  const sample = await Complaint.find().select('title category image').limit(4);
  console.log('\nSample complaints in database:');
  console.log(JSON.stringify(sample, null, 2));

  await mongoose.disconnect();
  process.exit(0);
}

main().catch(err => {
  console.error('Fatal error:', err);
  process.exit(1);
});
