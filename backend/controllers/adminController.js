const User = require('../models/User');
const Score = require('../models/Score');
const Draw = require('../models/Draw');
const Charity = require('../models/Charity');
const { MONTHLY_PRICE, YEARLY_PRICE } = require('../utils/drawEngine');
const { serializeDraw, serializeScore, serializeUser, roundCurrency } = require('../utils/serializers');

const buildUserResponse = (user, scoreDoc) => ({
  ...serializeUser(user),
  scores: (scoreDoc?.scores || []).map(serializeScore),
});

// @desc    Admin dashboard stats
// @route   GET /api/admin/stats
exports.getStats = async (req, res) => {
  try {
    const [
      totalUsers,
      activeSubscribers,
      totalCharities,
      monthlyCount,
      yearlyCount,
      recentDrawDocs,
      prizeDrawDocs,
    ] = await Promise.all([
      User.countDocuments({}),
      User.countDocuments({ 'subscription.status': 'active' }),
      Charity.countDocuments({ active: true }),
      User.countDocuments({ 'subscription.status': 'active', 'subscription.plan': 'monthly' }),
      User.countDocuments({ 'subscription.status': 'active', 'subscription.plan': 'yearly' }),
      Draw.find({}).sort({ year: -1, month: -1 }).limit(5).lean(),
      Draw.find({ status: { $in: ['published', 'completed'] } }).select('winners').lean(),
    ]);

    const totalPrizePaid = roundCurrency(
      prizeDrawDocs.reduce(
        (sum, draw) => sum + (draw.winners || []).reduce((winnerSum, winner) => winnerSum + (winner.prizeAmount || 0), 0),
        0
      )
    );

    const monthlyRevenue = monthlyCount * MONTHLY_PRICE + ((yearlyCount * YEARLY_PRICE) / 12);
    const monthlyCharityContrib = roundCurrency(monthlyRevenue * 0.10);

    res.json({
      totalUsers,
      activeSubscribers,
      totalPrizePaid,
      totalCharities,
      monthlyCharityContrib,
      recentDraws: recentDrawDocs.map(serializeDraw),
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    List users for admin
// @route   GET /api/admin/users
exports.getUsers = async (req, res) => {
  try {
    const page = Math.max(1, Number(req.query.page) || 1);
    const limit = Math.min(50, Math.max(1, Number(req.query.limit) || 15));
    const search = String(req.query.search || '').trim();

    const filter = {};
    if (search) {
      filter.$or = [
        { firstName: { $regex: search, $options: 'i' } },
        { lastName: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } },
      ];
    }

    const [total, users] = await Promise.all([
      User.countDocuments(filter),
      User.find(filter)
        .sort({ createdAt: -1 })
        .skip((page - 1) * limit)
        .limit(limit)
        .populate('selectedCharity', 'name logo description category'),
    ]);

    const userIds = users.map((user) => user._id);
    const scoreDocs = await Score.find({ user: { $in: userIds } });
    const scoreMap = new Map(scoreDocs.map((doc) => [doc.user.toString(), doc]));

    res.json({
      users: users.map((user) => buildUserResponse(user, scoreMap.get(user._id.toString()))),
      total,
      pages: Math.max(1, Math.ceil(total / limit)),
      page,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Get single user for admin
// @route   GET /api/admin/users/:id
exports.getUser = async (req, res) => {
  try {
    const user = await User.findById(req.params.id).populate('selectedCharity', 'name logo description category');
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    const scoreDoc = await Score.findOne({ user: user._id });
    res.json(buildUserResponse(user, scoreDoc));
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Update a user score
// @route   PUT /api/admin/users/:userId/scores/:scoreId
exports.updateUserScore = async (req, res) => {
  try {
    const scoreValue = Number(req.body.score ?? req.body.value);
    const scoreDoc = await Score.findOne({ user: req.params.userId });

    if (!scoreDoc) {
      return res.status(404).json({ success: false, message: 'Score record not found' });
    }

    const scoreEntry = scoreDoc.scores.id(req.params.scoreId);
    if (!scoreEntry) {
      return res.status(404).json({ success: false, message: 'Score entry not found' });
    }

    if (scoreValue && (scoreValue < 1 || scoreValue > 45)) {
      return res.status(400).json({ success: false, message: 'Score must be between 1 and 45' });
    }

    if (scoreValue) scoreEntry.value = scoreValue;
    if (req.body.date) scoreEntry.date = new Date(req.body.date);
    await scoreDoc.save();

    res.json({ success: true, scores: scoreDoc.scores.map(serializeScore) });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
