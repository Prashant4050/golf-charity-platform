const Charity = require('../models/Charity');
const User = require('../models/User');
const { serializeCharity } = require('../utils/serializers');

const VALID_CATEGORIES = ['health', 'education', 'environment', 'sports', 'community', 'children', 'elderly', 'other'];

const normalizeCategory = (category) => {
  const normalized = String(category || 'other').trim().toLowerCase();
  return VALID_CATEGORIES.includes(normalized) ? normalized : 'other';
};

const normalizeEvents = (events) => {
  if (!Array.isArray(events)) return undefined;

  return events
    .filter((event) => event && (event.name || event.title))
    .map((event) => ({
      name: event.name || event.title,
      date: event.date,
      location: event.location || '',
      description: event.description || '',
      registrationUrl: event.registrationUrl || event.url || '',
    }));
};

const buildCharityPayload = (body) => {
  const payload = { ...body };

  if ('category' in payload) {
    payload.category = normalizeCategory(payload.category);
  }

  if ('image' in payload || 'logo' in payload) {
    payload.logo = payload.logo || payload.image || '';
  }

  const normalizedEvents = normalizeEvents(payload.events);
  if (normalizedEvents) {
    payload.events = normalizedEvents;
  }

  delete payload.image;
  return payload;
};

const refreshSubscriberCounts = async () => {
  const counts = await User.aggregate([
    {
      $match: {
        selectedCharity: { $ne: null },
        'subscription.status': 'active',
      },
    },
    {
      $group: {
        _id: '$selectedCharity',
        count: { $sum: 1 },
      },
    },
  ]);

  await Charity.updateMany({}, { subscriberCount: 0 });
  await Promise.all(
    counts.map((entry) =>
      Charity.findByIdAndUpdate(entry._id, { subscriberCount: entry.count })
    )
  );
};

// @desc    Get all charities (public)
// @route   GET /api/charities
exports.getCharities = async (req, res) => {
  try {
    const { category, search, featured, limit } = req.query;
    const filter = { active: true };
    if (category) filter.category = normalizeCategory(category);
    if (featured === 'true') filter.featured = true;
    if (search) filter.name = { $regex: search, $options: 'i' };

    const query = Charity.find(filter).sort({ featured: -1, name: 1 });
    if (Number(limit) > 0) query.limit(Number(limit));

    const charities = await query;
    res.json(charities.map(serializeCharity));
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Get featured charities
// @route   GET /api/charities/featured
exports.getFeaturedCharities = async (req, res) => {
  try {
    const limit = Number(req.query.limit) || 4;
    const charities = await Charity.find({ active: true, featured: true })
      .sort({ name: 1 })
      .limit(limit);

    res.json(charities.map(serializeCharity));
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Get single charity
// @route   GET /api/charities/:id
exports.getCharity = async (req, res) => {
  try {
    const charity = await Charity.findById(req.params.id);
    if (!charity) return res.status(404).json({ success: false, message: 'Charity not found' });
    res.json(serializeCharity(charity));
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Select charity for user
// @route   PUT /api/charities/select/:id
exports.selectCharity = async (req, res) => {
  try {
    const charity = await Charity.findById(req.params.id);
    if (!charity || !charity.active) {
      return res.status(404).json({ success: false, message: 'Charity not found' });
    }

    const contributionPercent = req.body.contributionPercent ?? req.body.percentage;
    const percent = Math.max(10, Math.min(100, parseInt(contributionPercent, 10) || 10));

    await User.findByIdAndUpdate(req.user._id, {
      selectedCharity: charity._id,
      charityContributionPercent: percent,
    });

    await refreshSubscriberCounts();

    res.json({ success: true, message: 'Charity selection updated', charity: serializeCharity(charity) });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// ---- ADMIN ----

// @desc    Create charity (admin)
// @route   POST /api/charities
exports.createCharity = async (req, res) => {
  try {
    const charity = await Charity.create(buildCharityPayload(req.body));
    res.status(201).json(serializeCharity(charity));
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Update charity (admin)
// @route   PUT /api/charities/:id
exports.updateCharity = async (req, res) => {
  try {
    const charity = await Charity.findByIdAndUpdate(req.params.id, buildCharityPayload(req.body), {
      new: true,
      runValidators: true,
    });
    if (!charity) return res.status(404).json({ success: false, message: 'Charity not found' });
    res.json(serializeCharity(charity));
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Delete charity (admin)
// @route   DELETE /api/charities/:id
exports.deleteCharity = async (req, res) => {
  try {
    const charity = await Charity.findByIdAndUpdate(req.params.id, { active: false }, { new: true });
    if (!charity) return res.status(404).json({ success: false, message: 'Charity not found' });

    // Remove from users who had it selected
    await User.updateMany(
      { selectedCharity: charity._id },
      { selectedCharity: null, charityContributionPercent: 10 }
    );

    await refreshSubscriberCounts();
    res.json({ success: true, message: 'Charity deactivated' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
