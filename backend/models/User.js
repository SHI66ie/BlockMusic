const mongoose = require('mongoose');
const crypto = require('crypto');

const userSchema = new mongoose.Schema({
  displayName: {
    type: String,
    required: [true, 'Display name is required'],
    trim: true,
    maxlength: [50, 'Display name cannot exceed 50 characters']
  },
  email: {
    type: String,
    required: [true, 'Email is required'],
    unique: true,
    lowercase: true,
    trim: true,
    match: [/^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/, 'Please provide a valid email']
  },
  password: {
    type: String,
    required: function() {
      // Password is required for email signup, not for OAuth users
      return !this.googleId;
    },
    minlength: [6, 'Password must be at least 6 characters long'],
    select: false // Don't include password in queries by default
  },
  photo: {
    type: String,
    default: null
  },
  role: {
    type: String,
    enum: ['user', 'artist', 'admin'],
    default: 'user'
  },
  googleId: {
    type: String,
    unique: true,
    sparse: true // Allows multiple null values
  },
  walletAddress: {
    type: String,
    unique: true,
    sparse: true
  },
  emailVerified: {
    type: Boolean,
    default: false
  },
  passwordResetToken: String,
  passwordResetExpires: Date,
  emailVerificationToken: String,
  emailVerificationExpires: Date
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Index for better performance
userSchema.index({ email: 1 });
userSchema.index({ googleId: 1 });
userSchema.index({ walletAddress: 1 });

// Virtual for user's tracks (if needed)
userSchema.virtual('tracks', {
  ref: 'MusicNFT',
  localField: '_id',
  foreignField: 'artist'
});

// Pre-save middleware to hash password
userSchema.pre('save', async function(next) {
  // Only run this function if password was actually modified
  if (!this.isModified('password')) return next();

  // Hash the password with cost of 12
  this.password = await crypto.createHash('sha256').update(this.password).digest('hex');

  // Delete passwordConfirm field
  this.passwordConfirm = undefined;
  next();
});

// Instance method to check password
userSchema.methods.correctPassword = async function(candidatePassword, userPassword) {
  return await crypto.createHash('sha256').update(candidatePassword).digest('hex') === userPassword;
};

// Static method to find users by email or Google ID
userSchema.statics.findByEmailOrGoogle = function(identifier) {
  return this.findOne({
    $or: [
      { email: identifier },
      { googleId: identifier }
    ]
  });
};

const User = mongoose.model('User', userSchema);

module.exports = User;
