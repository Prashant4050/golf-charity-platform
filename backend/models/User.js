const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema({
  firstName: { type: String, required: true, trim: true },
  lastName: { type: String, required: true, trim: true },
  email: { type: String, required: true, unique: true, lowercase: true, trim: true },
  password: { type: String, required: true, minlength: 6, select: false },
  role: { type: String, enum: ['subscriber', 'admin'], default: 'subscriber' },
  avatar: { type: String, default: '' },

  // Subscription
  subscription: {
    status: { type: String, enum: ['active', 'inactive', 'cancelled', 'lapsed', 'trialing'], default: 'inactive' },
    plan: { type: String, enum: ['free', 'monthly', 'yearly', null], default: null },
    stripeCustomerId: { type: String },
    stripeSubscriptionId: { type: String },
    currentPeriodStart: { type: Date },
    currentPeriodEnd: { type: Date },
    cancelAtPeriodEnd: { type: Boolean, default: false },
  },

  // Charity
  selectedCharity: { type: mongoose.Schema.Types.ObjectId, ref: 'Charity', default: null },
  charityContributionPercent: { type: Number, default: 10, min: 10, max: 100 },

  // Stats
  totalWinnings: { type: Number, default: 0 },
  drawsEntered: { type: Number, default: 0 },
  totalCharityContributed: { type: Number, default: 0 },

  isVerified: { type: Boolean, default: false },
  verificationToken: { type: String },
  resetPasswordToken: { type: String },
  resetPasswordExpire: { type: Date },
  lastLogin: { type: Date },
}, { timestamps: true });

// Hash password before save
userSchema.pre('save', async function (next) {
  if (!this.isModified('password')) return next();
  const salt = await bcrypt.genSalt(12);
  this.password = await bcrypt.hash(this.password, salt);
  next();
});

// Match password
userSchema.methods.matchPassword = async function (enteredPassword) {
  return await bcrypt.compare(enteredPassword, this.password);
};

// Virtual: full name
userSchema.virtual('fullName').get(function () {
  return `${this.firstName} ${this.lastName}`;
});

userSchema.set('toJSON', { virtuals: true });
userSchema.set('toObject', { virtuals: true });

module.exports = mongoose.model('User', userSchema);
