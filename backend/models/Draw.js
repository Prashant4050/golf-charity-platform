const mongoose = require('mongoose');

const winnerSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  matchType: { type: String, enum: ['5-match', '4-match', '3-match'] },
  matchedNumbers: [{ type: Number }],
  prizeAmount: { type: Number },
  paymentStatus: { type: String, enum: ['pending', 'paid', 'rejected'], default: 'pending' },
  proofSubmitted: { type: Boolean, default: false },
  proofUrl: { type: String },
  verifiedAt: { type: Date },
  paidAt: { type: Date },
});

const drawSchema = new mongoose.Schema({
  month: { type: Number, required: true }, // 1-12
  year: { type: Number, required: true },
  drawNumbers: [{ type: Number, min: 1, max: 45 }], // 5 drawn numbers
  drawType: { type: String, enum: ['random', 'algorithmic'], default: 'random' },
  status: { type: String, enum: ['pending', 'simulated', 'published', 'completed'], default: 'pending' },

  // Prize pool
  totalSubscribers: { type: Number, default: 0 },
  totalPoolAmount: { type: Number, default: 0 },
  jackpotPool: { type: Number, default: 0 },    // 40%
  matchFourPool: { type: Number, default: 0 },  // 35%
  matchThreePool: { type: Number, default: 0 }, // 25%

  // Rollover jackpot from previous month
  rolledOverAmount: { type: Number, default: 0 },

  winners: [winnerSchema],

  // Stats
  fiveMatchWinners: { type: Number, default: 0 },
  fourMatchWinners: { type: Number, default: 0 },
  threeMatchWinners: { type: Number, default: 0 },

  jackpotRolledOver: { type: Boolean, default: false },
  publishedAt: { type: Date },
  simulationData: { type: mongoose.Schema.Types.Mixed },
}, { timestamps: true });

drawSchema.index({ month: 1, year: 1 }, { unique: true });

module.exports = mongoose.model('Draw', drawSchema);