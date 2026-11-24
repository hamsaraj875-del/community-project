const express = require('express');
const router = express.Router();
const { auth } = require('../middleware/auth');
const { register, login, getMe } = require('../controllers/authController');

// Register (citizen)
router.post('/register', register);

// Login (citizen / authority)
router.post('/login', login);

// Current user profile
router.get('/me', auth, getMe);

module.exports = router;
