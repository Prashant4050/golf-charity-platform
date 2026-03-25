const Score = require('../models/Score');
const { serializeScore } = require('../utils/serializers');

const serializeScores = (scores = []) => scores.map(serializeScore);

// @desc    Get user's scores
// @route   GET /api/scores
exports.getScores = async (req, res) => {
  try {
    let scoreDoc = await Score.findOne({ user: req.user._id });
    if (!scoreDoc) {
      scoreDoc = await Score.create({ user: req.user._id, scores: [] });
    }
    res.json(serializeScores(scoreDoc.scores));
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Add a new score
// @route   POST /api/scores
exports.addScore = async (req, res) => {
  try {
    const value = Number(req.body.value ?? req.body.score);
    const { date, course, notes } = req.body;

    if (!value || value < 1 || value > 45) {
      return res.status(400).json({ success: false, message: 'Score must be between 1 and 45 (Stableford)' });
    }
    if (!date) {
      return res.status(400).json({ success: false, message: 'Date is required' });
    }

    let scoreDoc = await Score.findOne({ user: req.user._id });
    if (!scoreDoc) {
      scoreDoc = await Score.create({ user: req.user._id, scores: [] });
    }

    scoreDoc.addScore({ value, date: new Date(date), course, notes });
    await scoreDoc.save();

    res.status(201).json(serializeScores(scoreDoc.scores));
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Edit a score
// @route   PUT /api/scores/:scoreId
exports.editScore = async (req, res) => {
  try {
    const value = req.body.value ?? req.body.score;
    const { date, course, notes } = req.body;

    if (value && (value < 1 || value > 45)) {
      return res.status(400).json({ success: false, message: 'Score must be between 1 and 45' });
    }

    const scoreDoc = await Score.findOne({ user: req.user._id });
    if (!scoreDoc) {
      return res.status(404).json({ success: false, message: 'Score record not found' });
    }

    const scoreEntry = scoreDoc.scores.id(req.params.scoreId);
    if (!scoreEntry) {
      return res.status(404).json({ success: false, message: 'Score entry not found' });
    }

    if (value) scoreEntry.value = value;
    if (date) scoreEntry.date = new Date(date);
    if (course !== undefined) scoreEntry.course = course;
    if (notes !== undefined) scoreEntry.notes = notes;

    await scoreDoc.save();
    res.json(serializeScores(scoreDoc.scores));
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Delete a score
// @route   DELETE /api/scores/:scoreId
exports.deleteScore = async (req, res) => {
  try {
    const scoreDoc = await Score.findOne({ user: req.user._id });
    if (!scoreDoc) return res.status(404).json({ success: false, message: 'Score record not found' });

    scoreDoc.scores = scoreDoc.scores.filter(s => s._id.toString() !== req.params.scoreId);
    await scoreDoc.save();

    res.json(serializeScores(scoreDoc.scores));
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Get score history for a specific user (admin)
// @route   GET /api/scores/user/:userId
exports.getUserScores = async (req, res) => {
  try {
    const scoreDoc = await Score.findOne({ user: req.params.userId }).populate('user', 'firstName lastName email');
    if (!scoreDoc) return res.status(404).json({ success: false, message: 'No scores found' });
    res.json(serializeScores(scoreDoc.scores));
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
