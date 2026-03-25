const mongoose = require('mongoose');

const scoreEntrySchema = new mongoose.Schema({
  value: { type: Number, required: true, min: 1, max: 45 },
  date: { type: Date, required: true },
  course: { type: String, default: '' },
  notes: { type: String, default: '' },
}, { _id: true, timestamps: true });

const scoreSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, unique: true },
  scores: {
    type: [scoreEntrySchema],
    validate: {
      validator: function (arr) { return arr.length <= 5; },
      message: 'Cannot store more than 5 scores',
    },
  },
}, { timestamps: true });

// Add a new score, keeping only last 5 (rolling window)
scoreSchema.methods.addScore = function (scoreData) {
  this.scores.unshift(scoreData); // add to front (most recent)
  if (this.scores.length > 5) {
    this.scores = this.scores.slice(0, 5); // keep only 5
  }
};

// Get score values array for draw matching
scoreSchema.methods.getScoreValues = function () {
  return this.scores.map(s => s.value);
};

module.exports = mongoose.model('Score', scoreSchema);