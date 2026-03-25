const mongoose = require('mongoose');

const paymentSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  stripePaymentIntentId: { type: String },
  stripeSubscriptionId: { type: String },
  stripeInvoiceId: { type: String },
  amount: { type: Number, required: true }, // in pence/cents
  currency: { type: String, default: 'gbp' },
  plan: { type: String, enum: ['monthly', 'yearly'] },
  status: { type: String, enum: ['succeeded', 'failed', 'pending', 'refunded'], default: 'pending' },
  type: { type: String, enum: ['subscription', 'charity_donation'], default: 'subscription' },

  // Breakdown
  prizePoolContribution: { type: Number, default: 0 },
  charityContribution: { type: Number, default: 0 },
  platformFee: { type: Number, default: 0 },

  charity: { type: mongoose.Schema.Types.ObjectId, ref: 'Charity' },
  periodStart: { type: Date },
  periodEnd: { type: Date },
}, { timestamps: true });

module.exports = mongoose.model('Payment', paymentSchema);