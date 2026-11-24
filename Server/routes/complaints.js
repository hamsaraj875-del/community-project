const express = require('express');
const multer = require('multer');
const { auth, authorityOnly } = require('../middleware/auth');
const {
  createComplaint,
  getMyComplaints,
  getAllComplaints,
  updateComplaint,
  getComplaintById,
} = require('../controllers/complaintController');

const router = express.Router();

// Multer memory storage for direct Cloudinary upload streaming
const storage = multer.memoryStorage();

const upload = multer({
  storage,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB limit
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('Only image files (JPG, PNG, WEBP, etc.) are allowed!'), false);
    }
  },
});

// Error handling wrapper for Multer
const handleUpload = (req, res, next) => {
  upload.single('image')(req, res, (err) => {
    if (err instanceof multer.MulterError) {
      if (err.code === 'LIMIT_FILE_SIZE') {
        return res.status(400).json({ message: 'Image size cannot exceed 10MB' });
      }
      return res.status(400).json({ message: err.message });
    } else if (err) {
      return res.status(400).json({ message: err.message });
    }
    next();
  });
};

// --- CITIZEN ROUTES ---
router.post('/', auth, handleUpload, createComplaint);
router.get('/my', auth, getMyComplaints);

// --- AUTHORITY ROUTES ---
router.get('/all', auth, authorityOnly, getAllComplaints);
router.patch('/:id', auth, authorityOnly, updateComplaint);

// --- COMPLAINT DETAIL ---
router.get('/:id', auth, getComplaintById);

module.exports = router;
