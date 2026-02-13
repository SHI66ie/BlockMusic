const express = require('express');
const authController = require('../controllers/authController');
const { protect } = require('../middleware/auth');

const router = express.Router();

// Public routes
router.post('/signup', authController.signup);
router.post('/login', authController.login);
router.post('/google', authController.googleAuth);
router.post('/logout', authController.logout);

// Protected routes
router.use(protect); // All routes after this middleware require authentication

router.get('/me', authController.getMe);
router.patch('/me', authController.updateMe);

module.exports = router;
