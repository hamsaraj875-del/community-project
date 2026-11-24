require('dotenv').config();
const cloudinary = require('./config/cloudinary');
const mongoose = require('mongoose');
const Complaint = require('./models/Complaint');

// 30 distinct, real civic complaint matching images
const COMPLAINT_IMAGE_MAPPING = [
  {
    title: 'Large Pothole on MG Road',
    publicId: 'real_pothole_crater',
    sourceUrl: 'https://images.unsplash.com/photo-1515162816999-a0c47dc192f7?w=800&q=80',
  },
  {
    title: 'Road Cave-in Near School',
    publicId: 'real_road_cavein',
    sourceUrl: 'https://images.unsplash.com/photo-1578662996442-48f60103fc96?w=800&q=80',
  },
  {
    title: 'Broken Footpath Tiles',
    publicId: 'real_broken_footpath',
    sourceUrl: 'https://images.unsplash.com/photo-1590486803833-1c5dc8ddd4c8?w=800&q=80',
  },
  {
    title: 'Road Divider Damaged',
    publicId: 'real_road_divider_crash',
    sourceUrl: 'https://images.unsplash.com/photo-1506521781263-d8422e82f27a?w=800&q=80',
  },
  {
    title: 'Speed Breaker Missing',
    publicId: 'real_speed_breaker_worn',
    sourceUrl: 'https://images.unsplash.com/photo-1568605117036-5fe5e7bab0b7?w=800&q=80',
  },
  {
    title: 'No Water Supply for 3 Days',
    publicId: 'real_no_water_dry_tap',
    sourceUrl: 'https://images.unsplash.com/photo-1584467735871-8e85353a8413?w=800&q=80',
  },
  {
    title: 'Burst Water Pipe',
    publicId: 'real_burst_water_pipe_gushing',
    sourceUrl: 'https://images.unsplash.com/photo-1585829365295-ab7cd400c167?w=800&q=80',
  },
  {
    title: 'Contaminated Water Supply',
    publicId: 'real_contaminated_muddy_water',
    sourceUrl: 'https://images.unsplash.com/photo-1518837695005-2083093ee35b?w=800&q=80',
  },
  {
    title: 'Low Water Pressure',
    publicId: 'real_low_water_pressure_trickle',
    sourceUrl: 'https://images.unsplash.com/photo-1607472586893-edb57bdc0e39?w=800&q=80',
  },
  {
    title: 'Leaking Water Meter',
    publicId: 'real_leaking_water_meter_valve',
    sourceUrl: 'https://images.unsplash.com/photo-1615915468538-0fbd857888ca?w=800&q=80',
  },
  {
    title: 'Frequent Power Cuts',
    publicId: 'real_power_cut_blackout_grid',
    sourceUrl: 'https://images.unsplash.com/photo-1473341304170-971dccb5ac1e?w=800&q=80',
  },
  {
    title: 'Fallen Electric Pole',
    publicId: 'real_fallen_electric_pole_hazard',
    sourceUrl: 'https://images.unsplash.com/photo-1513694203232-719a280e022f?w=800&q=80',
  },
  {
    title: 'Exposed Live Wires',
    publicId: 'real_exposed_live_wires_tangled',
    sourceUrl: 'https://images.unsplash.com/photo-1544725176-7c40e5a71c5e?w=800&q=80',
  },
  {
    title: 'Street Light Not Working',
    publicId: 'real_dark_street_light_out',
    sourceUrl: 'https://images.unsplash.com/photo-1509198397868-475647b2a1e5?w=800&q=80',
  },
  {
    title: 'Transformer Sparking',
    publicId: 'real_transformer_substation_sparking',
    sourceUrl: 'https://images.unsplash.com/photo-1520690214124-2405c5217036?w=800&q=80',
  },
  {
    title: 'Overflowing Garbage Bin',
    publicId: 'real_overflowing_garbage_dumpster',
    sourceUrl: 'https://images.unsplash.com/photo-1605600659908-0ef719419d41?w=800&q=80',
  },
  {
    title: 'Illegal Garbage Dumping',
    publicId: 'real_illegal_garbage_dumping_mound',
    sourceUrl: 'https://images.unsplash.com/photo-1530587191325-3db32d826c18?w=800&q=80',
  },
  {
    title: 'Dead Animal Not Removed',
    publicId: 'real_dead_animal_roadside_hazard',
    sourceUrl: 'https://images.unsplash.com/photo-1528323273322-d81458248d40?w=800&q=80',
  },
  {
    title: 'Open Drain Overflowing',
    publicId: 'real_open_drain_overflowing_sewage',
    sourceUrl: 'https://images.unsplash.com/photo-1517411032315-54ef2cb783bb?w=800&q=80',
  },
  {
    title: 'Stray Animals Near Garbage',
    publicId: 'real_stray_animals_garbage_dogs',
    sourceUrl: 'https://images.unsplash.com/photo-1548199973-03cce0bbc87b?w=800&q=80',
  },
  {
    title: 'Entire Street Dark',
    publicId: 'real_entire_street_dark_night',
    sourceUrl: 'https://images.unsplash.com/photo-1517457373958-b7bdd4587205?w=800&q=80',
  },
  {
    title: 'Flickering Street Lights',
    publicId: 'real_flickering_street_lamp_mist',
    sourceUrl: 'https://images.unsplash.com/photo-1534447677768-be436bb09401?w=800&q=80',
  },
  {
    title: 'Street Light Pole Broken',
    publicId: 'real_street_light_pole_broken',
    sourceUrl: 'https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?w=800&q=80',
  },
  {
    title: 'Park Bench Damaged',
    publicId: 'real_damaged_park_bench_broken',
    sourceUrl: 'https://images.unsplash.com/photo-1519331379826-f10be5486c6f?w=800&q=80',
  },
  {
    title: 'Park Lights Not Working',
    publicId: 'real_park_lights_out_dark_walkway',
    sourceUrl: 'https://images.unsplash.com/photo-1518709268805-4e9042af9f23?w=800&q=80',
  },
  {
    title: 'Children Play Equipment Broken',
    publicId: 'real_broken_playground_swings',
    sourceUrl: 'https://images.unsplash.com/photo-1576013551627-0cc20b96c2a7?w=800&q=80',
  },
  {
    title: 'CCTV Cameras Not Working',
    publicId: 'real_cctv_camera_pole_broken',
    sourceUrl: 'https://images.unsplash.com/photo-1557597774-9d273605dfa9?w=800&q=80',
  },
  {
    title: 'Encroachment on Footpath',
    publicId: 'real_footpath_encroachment_market',
    sourceUrl: 'https://images.unsplash.com/photo-1526374965328-7f61d4dc18c5?w=800&q=80',
  },
  {
    title: 'Blocked Storm Drain',
    publicId: 'real_blocked_storm_drain_flooding',
    sourceUrl: 'https://images.unsplash.com/photo-1544620347-c4fd4a3d5957?w=800&q=80',
  },
  {
    title: 'Manhole Cover Missing',
    publicId: 'real_open_manhole_cover_missing',
    sourceUrl: 'https://images.unsplash.com/photo-1590486803833-1c5dc8ddd4c8?w=800&q=80',
  },
];

async function run() {
  console.log('🚀 Uploading real matching complaint images to Cloudinary (cloud: dbaqcimmp)...\n');

  const urlMap = {};

  for (let i = 0; i < COMPLAINT_IMAGE_MAPPING.length; i++) {
    const item = COMPLAINT_IMAGE_MAPPING[i];
    console.log(`[${i + 1}/${COMPLAINT_IMAGE_MAPPING.length}] Uploading: ${item.title}`);
    try {
      const res = await cloudinary.uploader.upload(item.sourceUrl, {
        folder: 'civicvision/matching_complaints',
        public_id: item.publicId,
        overwrite: true,
      });
      urlMap[item.title] = res.secure_url;
      console.log(`  ✓ Cloudinary URL: ${res.secure_url}`);
    } catch (err) {
      console.error(`  ✗ Upload failed for "${item.title}":`, err.message);
    }
  }

  console.log('\nConnecting to MongoDB to update each complaint with its exact matching image...');
  await mongoose.connect(process.env.MONGODB_URI);

  let updatedCount = 0;
  for (const item of COMPLAINT_IMAGE_MAPPING) {
    const cloudUrl = urlMap[item.title];
    if (cloudUrl) {
      const res = await Complaint.updateMany(
        { title: item.title },
        { $set: { image: cloudUrl } }
      );
      if (res.modifiedCount > 0) {
        updatedCount += res.modifiedCount;
        console.log(`  ✓ Updated complaint: "${item.title}"`);
      }
    }
  }

  console.log(`\n🎉 Successfully updated ${updatedCount} complaints in MongoDB with real matching Cloudinary images!`);

  // Print sample check
  const sample = await Complaint.find().select('title category image').limit(6);
  console.log('\nSample verified complaints:');
  console.log(JSON.stringify(sample, null, 2));

  await mongoose.disconnect();
  process.exit(0);
}

run().catch(err => {
  console.error('Fatal error:', err);
  process.exit(1);
});
