const User = require('../models/User');
const { createSendToken } = require('../middleware/auth');
const crypto = require('crypto');
const { promisify } = require('util');

/**
 * User signup with email and password
 */
exports.signup = async (req, res) => {
  try {
    const { displayName, email, password } = req.body;

    // Check if user already exists
    const existingUser = await User.findOne({ 
      $or: [{ email }, { googleId: req.body.googleId }] 
    });

    if (existingUser) {
      return res.status(400).json({
        status: 'error',
        message: 'User already exists with this email or Google account'
      });
    }

    // Create new user
    const newUser = await User.create({
      displayName,
      email,
      password,
      role: 'user',
      ...(req.body.googleId && { googleId: req.body.googleId }),
      ...(req.body.googlePhoto && { photo: req.body.googlePhoto })
    });

    // Remove password from output
    newUser.password = undefined;

    // Send token
    createSendToken(newUser, 201, res);
  } catch (error) {
    console.error('Signup error:', error);
    res.status(400).json({
      status: 'error',
      message: error.message || 'Failed to create account'
    });
  }
};

/**
 * User login with email and password
 */
exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;

    // Check if email and password exist
    if (!email || !password) {
      return res.status(400).json({
        status: 'error',
        message: 'Please provide email and password'
      });
    }

    // Check if user exists && password is correct
    const user = await User.findOne({ email }).select('+password');

    if (!user || !(await user.correctPassword(password, user.password))) {
      return res.status(401).json({
        status: 'error',
        message: 'Incorrect email or password'
      });
    }

    // Remove password from output
    user.password = undefined;

    // Send token
    createSendToken(user, 200, res);
  } catch (error) {
    console.error('Login error:', error);
    res.status(400).json({
      status: 'error',
      message: error.message || 'Failed to login'
    });
  }
};

/**
 * Google OAuth login/signup
 */
exports.googleAuth = async (req, res) => {
  try {
    const { googleId, email, displayName, photo } = req.body;

    if (!googleId || !email) {
      return res.status(400).json({
        status: 'error',
        message: 'Google ID and email are required'
      });
    }

    // Check if user exists with Google ID
    let user = await User.findOne({ googleId });

    if (user) {
      // User exists, login
      createSendToken(user, 200, res);
    } else {
      // Check if user exists with email (merge accounts)
      user = await User.findOne({ email });

      if (user) {
        // Link Google account to existing user
        user.googleId = googleId;
        if (photo && !user.photo) {
          user.photo = photo;
        }
        await user.save();
        createSendToken(user, 200, res);
      } else {
        // Create new user
        const newUser = await User.create({
          googleId,
          email,
          displayName,
          photo,
          role: 'user',
          password: crypto.randomBytes(32).toString('hex') // Random password for OAuth users
        });

        createSendToken(newUser, 201, res);
      }
    }
  } catch (error) {
    console.error('Google auth error:', error);
    res.status(400).json({
      status: 'error',
      message: error.message || 'Google authentication failed'
    });
  }
};

/**
 * Get current user profile
 */
exports.getMe = async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    
    res.status(200).json({
      status: 'success',
      data: {
        user
      }
    });
  } catch (error) {
    console.error('Get profile error:', error);
    res.status(400).json({
      status: 'error',
      message: error.message || 'Failed to get profile'
    });
  }
};

/**
 * Update user profile
 */
exports.updateMe = async (req, res) => {
  try {
    // Filter out unwanted fields
    const filteredBody = {};
    const allowedFields = ['displayName', 'email', 'photo'];
    
    Object.keys(req.body).forEach(el => {
      if (allowedFields.includes(el)) {
        filteredBody[el] = req.body[el];
      }
    });

    const updatedUser = await User.findByIdAndUpdate(
      req.user.id,
      filteredBody,
      {
        new: true,
        runValidators: true
      }
    );

    res.status(200).json({
      status: 'success',
      data: {
        user: updatedUser
      }
    });
  } catch (error) {
    console.error('Update profile error:', error);
    res.status(400).json({
      status: 'error',
      message: error.message || 'Failed to update profile'
    });
  }
};

/**
 * Logout user
 */
exports.logout = (req, res) => {
  res.cookie('jwt', 'loggedout', {
    expires: new Date(Date.now() + 10 * 1000),
    httpOnly: true
  });
  
  res.status(200).json({
    status: 'success',
    message: 'Logged out successfully'
  });
};
