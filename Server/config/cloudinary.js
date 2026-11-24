const cloudinary = require('cloudinary').v2;

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME || 'dbaqcimmp',
  api_key: process.env.CLOUDINARY_API_KEY || '792833983991128',
  api_secret: process.env.CLOUDINARY_API_SECRET || 'V8_Yhm_Tb1_OeuuylMuN5IVMzvQ',
});

module.exports = cloudinary;
