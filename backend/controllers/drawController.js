const Draw = require('../models/Draw');
const User = require('../models/User');
const Score = require('../models/Score');
const {
  generateRandomNumbers,
  generateAlgorithmicNumbers,
  calculatePoolBreakdown,
  runDraw,
  getScoreFrequencyStats,
} = require('../utils/drawEngine');
const { sendEmail, emailTemplates } = require('../utils/email');
const { serializeDraw, roundCurrency } = require('../utils/serializers');

const parseDrawPeriod = (rawMonth, rawYear) => {
  if (typeof rawMonth === 'string' && /^\d{4}-\d{2}$/.test(rawMonth) && !rawYear) {
    const [year, month] = rawMonth.split('-').map(Number);
    return { month, year };
  }

  return {
    month: Number(rawMonth),
    year: Number(rawYear),
  };
};

const serializeSimulation = (simulationData, extras = {}) => ({
  drawNumbers: simulationData.drawnNumbers || simulationData.drawNumbers || [],
  winners: extras.winners || [],
  totalParticipants: simulationData.totalParticipants || 0,
  fiveMatchWinners: extras.fiveMatchWinners ?? simulationData.fiveMatchCount ?? 0,
  fourMatchWinners: extras.fourMatchWinners ?? simulationData.fourMatchCount ?? 0,
  threeMatchWinners: extras.threeMatchWinners ?? simulationData.threeMatchCount ?? 0,
  jackpotRollsOver: extras.jackpotRollsOver ?? false,
  jackpotPerWinner: roundCurrency(simulationData.jackpotPerWinner || 0),
  fourPrizePerWinner: roundCurrency(simulationData.fourPrizePerWinner || 0),
  threePrizePerWinner: roundCurrency(simulationData.threePrizePerWinner || 0),
  simulatedAt: simulationData.simulatedAt,
});

// @desc    Get all draws (public - published only)
// @route   GET /api/draws
exports.getDraws = async (req, res) => {
  try {
    const draws = await Draw.find({ status: 'published' })
      .sort({ year: -1, month: -1 })
      .limit(12)
      .populate('winners.user', 'firstName lastName');
    res.json(draws.map(serializeDraw));
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Get current month's draw info
// @route   GET /api/draws/current
exports.getCurrentDraw = async (req, res) => {
  try {
    const now = new Date();
    const draw = await Draw.findOne({
      month: now.getMonth() + 1,
      year: now.getFullYear(),
    }).populate('winners.user', 'firstName lastName');

    // Get pool estimate for current month
    const activeCount = await User.countDocuments({ 'subscription.status': 'active' });
    const monthlyCount = await User.countDocuments({ 'subscription.status': 'active', 'subscription.plan': 'monthly' });
    const yearlyCount = await User.countDocuments({ 'subscription.status': 'active', 'subscription.plan': 'yearly' });
    const poolBreakdown = calculatePoolBreakdown(activeCount, monthlyCount, yearlyCount);

    res.json({
      draw: serializeDraw(draw),
      poolBreakdown,
      activeSubscribers: activeCount,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Get latest published draw
// @route   GET /api/draws/latest
exports.getLatestDraw = async (req, res) => {
  try {
    const draw = await Draw.findOne({ status: 'published' })
      .sort({ year: -1, month: -1 })
      .populate('winners.user', 'firstName lastName');

    res.json(serializeDraw(draw));
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Get user's draw participation history
// @route   GET /api/draws/my-history
exports.getUserDrawHistory = async (req, res) => {
  try {
    const draws = await Draw.find({
      status: { $in: ['published', 'completed'] },
      'winners.user': req.user._id,
    }).sort({ year: -1, month: -1 });
    res.json(draws.map(serializeDraw));
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// ---- ADMIN ----

// @desc    Get all draws (admin)
// @route   GET /api/draws/admin/all
exports.adminGetAllDraws = async (req, res) => {
  try {
    const draws = await Draw.find({}).sort({ year: -1, month: -1 }).populate('winners.user', 'firstName lastName email');
    res.json(draws.map(serializeDraw));
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Create/configure a draw
// @route   POST /api/draws/admin/create
exports.createDraw = async (req, res) => {
  try {
    const { drawType } = req.body;
    const { month, year } = parseDrawPeriod(req.body.month, req.body.year);

    if (!month || !year) {
      return res.status(400).json({ success: false, message: 'Month and year are required' });
    }

    const existing = await Draw.findOne({ month, year });
    if (existing) {
      return res.status(400).json({ success: false, message: 'Draw already exists for this month/year' });
    }

    // Check for jackpot rollover
    let rolledOver = 0;
    const prevMonth = month === 1 ? 12 : month - 1;
    const prevYear = month === 1 ? year - 1 : year;
    const prevDraw = await Draw.findOne({ month: prevMonth, year: prevYear, jackpotRolledOver: true });
    if (prevDraw) rolledOver = prevDraw.jackpotPool;

    const activeCount = await User.countDocuments({ 'subscription.status': 'active' });
    const monthlyCount = await User.countDocuments({ 'subscription.status': 'active', 'subscription.plan': 'monthly' });
    const yearlyCount = await User.countDocuments({ 'subscription.status': 'active', 'subscription.plan': 'yearly' });
    const pool = calculatePoolBreakdown(activeCount, monthlyCount, yearlyCount, rolledOver);

    const draw = await Draw.create({
      month,
      year,
      drawType: drawType || 'random',
      totalSubscribers: activeCount,
      totalPoolAmount: pool.totalPool,
      jackpotPool: pool.jackpotPool,
      matchFourPool: pool.matchFourPool,
      matchThreePool: pool.matchThreePool,
      rolledOverAmount: rolledOver,
    });

    res.status(201).json(serializeDraw(draw));
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Simulate draw (pre-analysis mode)
// @route   POST /api/draws/admin/:id/simulate
exports.simulateDraw = async (req, res) => {
  try {
    const draw = await Draw.findById(req.params.id);
    if (!draw) return res.status(404).json({ success: false, message: 'Draw not found' });

    const drawnNumbers = draw.drawType === 'algorithmic'
      ? await generateAlgorithmicNumbers()
      : generateRandomNumbers();

    const { fiveMatchers, fourMatchers, threeMatchers, totalParticipants } = await runDraw(drawnNumbers);
    const winners = [...fiveMatchers, ...fourMatchers, ...threeMatchers];

    const simulationData = {
      drawnNumbers,
      totalParticipants,
      fiveMatchCount: fiveMatchers.length,
      fourMatchCount: fourMatchers.length,
      threeMatchCount: threeMatchers.length,
      jackpotPerWinner: fiveMatchers.length > 0 ? draw.jackpotPool / fiveMatchers.length : draw.jackpotPool,
      fourPrizePerWinner: fourMatchers.length > 0 ? draw.matchFourPool / fourMatchers.length : 0,
      threePrizePerWinner: threeMatchers.length > 0 ? draw.matchThreePool / threeMatchers.length : 0,
      simulatedAt: new Date(),
    };

    draw.simulationData = simulationData;
    draw.status = 'simulated';
    await draw.save();

    res.json({
      simulation: serializeSimulation(simulationData, {
        winners,
        fiveMatchWinners: fiveMatchers.length,
        fourMatchWinners: fourMatchers.length,
        threeMatchWinners: threeMatchers.length,
        jackpotRollsOver: fiveMatchers.length === 0,
      }),
      draw: serializeDraw(draw),
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Publish draw results
// @route   POST /api/draws/admin/:id/publish
exports.publishDraw = async (req, res) => {
  try {
    const draw = await Draw.findById(req.params.id);
    if (!draw) return res.status(404).json({ success: false, message: 'Draw not found' });
    if (draw.status === 'published' || draw.status === 'completed') {
      return res.status(400).json({ success: false, message: 'Draw already published' });
    }

    const drawnNumbers = draw.drawType === 'algorithmic'
      ? await generateAlgorithmicNumbers()
      : generateRandomNumbers();

    const { fiveMatchers, fourMatchers, threeMatchers } = await runDraw(drawnNumbers);

    const jackpotRollover = fiveMatchers.length === 0;

    // Build winners list
    const winnersList = [];

    const addWinners = (matchers, matchType, pool) => {
      const prize = matchers.length > 0 ? parseFloat((pool / matchers.length).toFixed(2)) : 0;
      matchers.forEach(m => {
        winnersList.push({
          user: m.user,
          matchType,
          matchedNumbers: m.matchedNumbers,
          prizeAmount: prize,
          paymentStatus: 'pending',
        });
      });
      return prize;
    };

    const jackpotPrize = addWinners(fiveMatchers, '5-match', draw.jackpotPool);
    addWinners(fourMatchers, '4-match', draw.matchFourPool);
    addWinners(threeMatchers, '3-match', draw.matchThreePool);

    draw.drawNumbers = drawnNumbers;
    draw.winners = winnersList;
    draw.fiveMatchWinners = fiveMatchers.length;
    draw.fourMatchWinners = fourMatchers.length;
    draw.threeMatchWinners = threeMatchers.length;
    draw.jackpotRolledOver = jackpotRollover;
    draw.status = 'published';
    draw.publishedAt = new Date();

    await draw.save();

    // Update user winnings
    await Promise.all(
      winnersList.map((winner) =>
        User.findByIdAndUpdate(winner.user, {
          $inc: { totalWinnings: winner.prizeAmount },
        })
      )
    );

    // Send draw result emails to all active subscribers
    const activeUsers = await User.find({ 'subscription.status': 'active' }).select('firstName email');
    for (const u of activeUsers) {
      await sendEmail({
        to: u.email,
        ...emailTemplates.drawResults(u.firstName, {
          month: draw.month,
          year: draw.year,
          numbers: drawnNumbers,
        }),
      });
    }

    // Send winner emails
    for (const w of winnersList) {
      const user = await User.findById(w.user).select('firstName email');
      if (user) {
        await sendEmail({
          to: user.email,
          ...emailTemplates.winner(user.firstName, w.prizeAmount, w.matchType),
        });
      }
    }

    await draw.populate('winners.user', 'firstName lastName email');

    res.json({
      success: true,
      draw: serializeDraw(draw),
      message: `Draw published! ${winnersList.length} winners found.`,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Get score frequency stats (for algorithmic draw insight)
// @route   GET /api/draws/admin/score-stats
exports.getScoreStats = async (req, res) => {
  try {
    const stats = await getScoreFrequencyStats();
    res.json(stats);
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
