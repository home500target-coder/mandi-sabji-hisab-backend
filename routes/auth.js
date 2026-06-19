const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const { protect } = require('../middleware/auth');

// Generate JWT Helper
const generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET || 'secret_key_sabji_hisab', {
    expiresIn: '30d'
  });
};

// @desc    Register a new farmer user
// @route   POST /api/auth/register
// @access  Public
router.post('/register', async (req, res) => {
  const { username, password, farmerName, villageName, phone } = req.body;

  try {
    if (!username || !password || !farmerName) {
      return res.status(400).json({ message: 'Please enter all required fields' });
    }

    const normalizedUsername = username.trim().toLowerCase();

    if (normalizedUsername.length < 3) {
      return res.status(400).json({ message: 'Username must be at least 3 characters long' });
    }
    if (/\s/.test(normalizedUsername)) {
      return res.status(400).json({ message: 'Username cannot contain spaces' });
    }

    if (phone && phone.trim()) {
      const phoneRegex = /^[6-9]\d{9}$/;
      const trimmedPhone = phone.trim();
      if (!phoneRegex.test(trimmedPhone)) {
        return res.status(400).json({ message: 'Please enter a valid 10-digit mobile number' });
      }

      const phoneExists = await User.findOne({ phone: trimmedPhone });
      if (phoneExists) {
        return res.status(400).json({ message: 'Mobile number already registered' });
      }
    }

    const userExists = await User.findOne({ username: normalizedUsername });
    if (userExists) {
      return res.status(400).json({ message: 'Username already taken' });
    }

    const user = await User.create({
      username: normalizedUsername,
      password,
      farmerName,
      villageName,
      phone: phone ? phone.trim() : ''
    });

    if (user) {
      return res.status(201).json({
        _id: user._id,
        username: user.username,
        farmerName: user.farmerName,
        villageName: user.villageName,
        phone: user.phone,
        token: generateToken(user._id)
      });
    } else {
      return res.status(400).json({ message: 'Invalid user data received' });
    }
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
});

// @desc    Login farmer & return token
// @route   POST /api/auth/login
// @access  Public
router.post('/login', async (req, res) => {
  const { username, password } = req.body;

  try {
    if (!username || !password) {
      return res.status(400).json({ message: 'Please enter username and password' });
    }

    const user = await User.findOne({ username: username.trim().toLowerCase() });
    if (user && (await user.matchPassword(password))) {
      return res.json({
        _id: user._id,
        username: user.username,
        farmerName: user.farmerName,
        villageName: user.villageName,
        phone: user.phone,
        token: generateToken(user._id)
      });
    } else {
      return res.status(401).json({ message: 'Invalid username or password' });
    }
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
});

// @desc    Get current logged in user details
// @route   GET /api/auth/me
// @access  Private
router.get('/me', protect, async (req, res) => {
  return res.json(req.user);
});

module.exports = router;
