const Score = require('../models/Score');
const User = require('../models/User');

/**
 * Generate 5 random draw numbers (1-45, no duplicates)
 */
const generateRandomNumbers = () => {
  const numbers = new Set();
  while (numbers.size < 5) {
    numbers.add(Math.floor(Math.random() * 45) + 1);
  }
  return Array.from(numbers).sort((a, b) => a - b);
};

/**
 * Algorithmic draw - weighted by score frequency across all active subscribers
 * Numbers that appear MORE frequently have LOWER weight (harder to match = bigger prize)
 */
const generateAlgorithmicNumbers = async () => {
  const activeUsers = await User.find({ 'subscription.status': 'active' }).select('_id');
  const userIds = activeUsers.map(u => u._id);
  const scores = await Score.find({ user: { $in: userIds } });

  // Count frequency of each score value (1-45)
  const freq = new Array(46).fill(0);
  let totalScores = 0;
  scores.forEach(doc => {
    doc.scores.forEach(s => {
      freq[s.value]++;
      totalScores++;
    });
  });

  if (totalScores === 0) return generateRandomNumbers();

  // Inverse weighting: less frequent = higher chance of being drawn
  const weights = new Array(46).fill(0);
  for (let i = 1; i <= 45; i++) {
    weights[i] = totalScores - (freq[i] || 0) + 1; // +1 to avoid 0 weight
  }

  // Weighted selection without replacement
  const selected = new Set();
  while (selected.size < 5) {
    let totalWeight = 0;
    for (let i = 1; i <= 45; i++) {
      if (!selected.has(i)) totalWeight += weights[i];
    }
    let rand = Math.random() * totalWeight;
    for (let i = 1; i <= 45; i++) {
      if (selected.has(i)) continue;
      rand -= weights[i];
      if (rand <= 0) {
        selected.add(i);
        break;
      }
    }
  }
  return Array.from(selected).sort((a, b) => a - b);
};

/**
 * Match user scores against drawn numbers
 * Returns match count (how many of the drawn numbers appear in user's 5 scores)
 */
const matchScore = (userScores, drawnNumbers) => {
  const userSet = new Set(userScores);
  return drawnNumbers.filter(n => userSet.has(n)).length;
};

/**
 * Calculate prize pool breakdown from subscription revenue
 * Monthly: £9.99, Yearly: £99.99
 */
const MONTHLY_PRICE = 9.99;
const YEARLY_PRICE = 99.99;
const PRIZE_POOL_PERCENT = 0.6;   // 60% of subscription goes to prize pool
const CHARITY_PERCENT_DEFAULT = 0.10; // 10% minimum charity
const PLATFORM_FEE = 0.30;        // 30% platform

const calculatePoolBreakdown = (activeSubscribers, monthlyCount, yearlyCount, rolledOver = 0) => {
  const monthlyRevenue = monthlyCount * MONTHLY_PRICE;
  const yearlyMonthlyEquivalent = (yearlyCount * YEARLY_PRICE) / 12;
  const totalRevenue = monthlyRevenue + yearlyMonthlyEquivalent;

  const totalPool = totalRevenue * PRIZE_POOL_PERCENT + rolledOver;

  return {
    totalRevenue: parseFloat(totalRevenue.toFixed(2)),
    totalPool: parseFloat(totalPool.toFixed(2)),
    jackpotPool: parseFloat((totalPool * 0.40 + rolledOver).toFixed(2)),
    matchFourPool: parseFloat((totalPool * 0.35).toFixed(2)),
    matchThreePool: parseFloat((totalPool * 0.25).toFixed(2)),
  };
};

/**
 * Run the full draw against all active subscribers
 */
const runDraw = async (drawnNumbers) => {
  const activeUsers = await User.find({ 'subscription.status': 'active' })
    .select('_id firstName lastName email')
    .lean();

  const userIds = activeUsers.map(u => u._id);
  const scores = await Score.find({ user: { $in: userIds } }).lean();

  const scoreMap = {};
  scores.forEach(s => { scoreMap[s.user.toString()] = s.scores.map(sc => sc.value); });

  const fiveMatchers = [];
  const fourMatchers = [];
  const threeMatchers = [];

  activeUsers.forEach(user => {
    const userScores = scoreMap[user._id.toString()] || [];
    if (userScores.length < 5) return; // Must have 5 scores to participate

    const matchCount = matchScore(userScores, drawnNumbers);
    const matchedNums = drawnNumbers.filter(n => new Set(userScores).has(n));

    if (matchCount === 5) fiveMatchers.push({ user: user._id, matchedNumbers: matchedNums });
    else if (matchCount === 4) fourMatchers.push({ user: user._id, matchedNumbers: matchedNums });
    else if (matchCount === 3) threeMatchers.push({ user: user._id, matchedNumbers: matchedNums });
  });

  return { fiveMatchers, fourMatchers, threeMatchers, totalParticipants: activeUsers.length };
};

/**
 * Get score frequency stats for admin analytics
 */
const getScoreFrequencyStats = async () => {
  const scores = await Score.find({}).lean();
  const freq = new Array(46).fill(0);
  scores.forEach(doc => doc.scores.forEach(s => { freq[s.value]++; }));
  return freq.slice(1).map((count, idx) => ({ value: idx + 1, count }));
};

module.exports = {
  generateRandomNumbers,
  generateAlgorithmicNumbers,
  matchScore,
  calculatePoolBreakdown,
  runDraw,
  getScoreFrequencyStats,
  MONTHLY_PRICE,
  YEARLY_PRICE,
};