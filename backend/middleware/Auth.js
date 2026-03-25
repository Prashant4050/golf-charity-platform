const jwt = require('jsonwebtoken');
const User = require('../models/User');

// Protect routes - require valid JWT
exports.protect = async (req, res, next) => {
  let token;
  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
    token = req.headers.authorization.split(' ')[1];
  }
  if (!token) {
    return res.status(401).json({ success: false, message: 'Not authorised, no token' });
  }
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = await User.findById(decoded.id).select('-password').populate('selectedCharity', 'name logo');
    if (!req.user) {
      return res.status(401).json({ success: false, message: 'User not found' });
    }
    next();
  } catch (error) {
    return res.status(401).json({ success: false, message: 'Not authorised, token invalid' });
  }
};

// Admin only
exports.adminOnly = (req, res, next) => {
  if (req.user && req.user.role === 'admin') return next();
  return res.status(403).json({ success: false, message: 'Admin access required' });
};

// Active subscriber only
exports.subscriberOnly = (req, res, next) => {
  if (req.user && req.user.subscription.status === 'active') return next();
  return res.status(403).json({ success: false, message: 'Active subscription required' });
};

// Check subscription status (non-blocking, just attaches status)
exports.checkSubscription = async (req, res, next) => {
  if (req.user) {
    const now = new Date();
    if (
      req.user.subscription.currentPeriodEnd &&
      req.user.subscription.currentPeriodEnd < now &&
      req.user.subscription.status === 'active'
    ) {
      await User.findByIdAndUpdate(req.user._id, { 'subscription.status': 'lapsed' });
      req.user.subscription.status = 'lapsed';
    }
  }
  next();
};
