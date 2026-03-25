const mongoose = require('mongoose');

const eventSchema = new mongoose.Schema({
  name: { type: String, required: true },
  date: { type: Date, required: true },
  location: { type: String },
  description: { type: String },
  registrationUrl: { type: String },
});

const charitySchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true },
  slug: { type: String, unique: true, lowercase: true },
  description: { type: String, required: true },
  shortDescription: { type: String },
  logo: { type: String, default: '' },
  images: [{ type: String }],
  website: { type: String },
  category: {
    type: String,
    enum: ['health', 'education', 'environment', 'sports', 'community', 'children', 'elderly', 'other'],
    default: 'other'
  },
  registrationNumber: { type: String },
  featured: { type: Boolean, default: false },
  active: { type: Boolean, default: true },
  events: [eventSchema],
  totalReceived: { type: Number, default: 0 },
  subscriberCount: { type: Number, default: 0 },
}, { timestamps: true });

// Auto-generate slug from name
charitySchema.pre('save', function (next) {
  if (this.isModified('name') && !this.slug) {
    this.slug = this.name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
  }
  next();
});

module.exports = mongoose.model('Charity', charitySchema);