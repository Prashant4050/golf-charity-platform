const User = require('../models/User');
const Score = require('../models/Score');
const Draw = require('../models/Draw');
const { generateToken } = require('../utils/generateToken');
const { sendEmail, emailTemplates } = require('../utils/email');
const { serializeUser } = require('../utils/serializers');

const getWinnerMeta = async (userId) => {
  const draw = await Draw.findOne({ 'winners.user': userId })
    .sort({ publishedAt: -1, createdAt: -1 })
    .lean();

  if (!draw) return { paymentStatus: null, proofUrl: '' };

  const winner = draw.winners.find((entry) => entry.user.toString() === userId.toString());
  if (!winner) return { paymentStatus: null, proofUrl: '' };

  return {
    paymentStatus: winner.paymentStatus || null,
    proofUrl: winner.proofUrl || '',
  };
};

const splitName = (name = '') => {
  const trimmed = name.trim();
  if (!trimmed) return { firstName: '', lastName: '' };

  const parts = trimmed.split(/\s+/);
  return {
    firstName: parts[0] || '',
    lastName: parts.slice(1).join(' ') || 'Member',
  };
};

// @desc    Register user
// @route   POST /api/auth/register
exports.register = async (req, res) => {
  try {
    const { email, password } = req.body;
    const incomingFirst = req.body.firstName?.trim();
    const incomingLast = req.body.lastName?.trim();
    const fallbackName = splitName(req.body.name);
    const firstName = incomingFirst || fallbackName.firstName;
    const lastName = incomingLast || fallbackName.lastName;

    if (!firstName || !lastName) {
      return res.status(400).json({ success: false, message: 'First and last name are required' });
    }

    const existing = await User.findOne({ email });
    if (existing) {
      return res.status(400).json({ success: false, message: 'Email already registered' });
    }

    const user = await User.create({ firstName, lastName, email, password });

    // Create empty score document for the user
    await Score.create({ user: user._id, scores: [] });

    // Send welcome email
    const tmpl = emailTemplates.welcome(user.firstName);
    await sendEmail({ to: user.email, ...tmpl });

    const token = generateToken(user._id);

    res.status(201).json({
      success: true,
      token,
      user: serializeUser(user),
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Login user
// @route   POST /api/auth/login
exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;

    const user = await User.findOne({ email })
      .select('+password')
      .populate('selectedCharity', 'name logo');

    if (!user || !(await user.matchPassword(password))) {
      return res.status(401).json({ success: false, message: 'Invalid email or password' });
    }

    user.lastLogin = new Date();
    await user.save({ validateBeforeSave: false });

    const token = generateToken(user._id);

    res.json({
      success: true,
      token,
      user: serializeUser(user),
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Get current user
// @route   GET /api/auth/me
exports.getMe = async (req, res) => {
  try {
    const user = await User.findById(req.user._id).populate('selectedCharity', 'name logo description');
    const winnerMeta = await getWinnerMeta(req.user._id);
    res.json(serializeUser(user, { winnerMeta }));
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Update profile
// @route   PUT /api/auth/profile
exports.updateProfile = async (req, res) => {
  try {
    const { firstName, lastName, avatar } = req.body;
    const user = await User.findByIdAndUpdate(
      req.user._id,
      { firstName, lastName, avatar },
      { new: true, runValidators: true }
    ).populate('selectedCharity', 'name logo');
    res.json({ success: true, user: serializeUser(user) });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Change password
// @route   PUT /api/auth/change-password
exports.changePassword = async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;
    const user = await User.findById(req.user._id).select('+password');
    if (!(await user.matchPassword(currentPassword))) {
      return res.status(400).json({ success: false, message: 'Current password incorrect' });
    }
    user.password = newPassword;
    await user.save();
    res.json({ success: true, message: 'Password updated' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
