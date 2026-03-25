const MONTH_NAMES = [
  'January',
  'February',
  'March',
  'April',
  'May',
  'June',
  'July',
  'August',
  'September',
  'October',
  'November',
  'December',
];

const toPlain = (value) => {
  if (!value) return value;
  if (typeof value.toObject === 'function') {
    return value.toObject({ virtuals: true });
  }
  return value;
};

const roundCurrency = (value) => Number((value || 0).toFixed(2));

const getUserName = (user) => {
  const plainUser = toPlain(user) || {};
  if (plainUser.name) return plainUser.name;
  if (plainUser.fullName) return plainUser.fullName;
  return [plainUser.firstName, plainUser.lastName].filter(Boolean).join(' ').trim();
};

const formatDrawMonth = (month, year) => {
  if (!month || !year) return '';
  return `${MONTH_NAMES[month - 1]} ${year}`;
};

const serializeScore = (score) => {
  const plainScore = toPlain(score) || {};
  const numericScore = plainScore.score ?? plainScore.value ?? 0;

  return {
    ...plainScore,
    score: numericScore,
    value: numericScore,
  };
};

const serializeCharity = (charity) => {
  const plainCharity = toPlain(charity);
  if (!plainCharity) return null;

  return {
    ...plainCharity,
    image: plainCharity.image || plainCharity.logo || '',
    logo: plainCharity.logo || plainCharity.image || '',
    events: (plainCharity.events || []).map((event) => ({
      ...event,
      title: event.title || event.name || '',
      name: event.name || event.title || '',
    })),
  };
};

const serializeWinner = (winner) => {
  const plainWinner = toPlain(winner) || {};
  const plainUser = plainWinner.user ? toPlain(plainWinner.user) : null;
  const prize = roundCurrency(plainWinner.prize ?? plainWinner.prizeAmount ?? 0);

  return {
    ...plainWinner,
    prize,
    prizeAmount: prize,
    user: plainUser ? { ...plainUser, name: getUserName(plainUser) } : null,
  };
};

const serializeDraw = (draw) => {
  const plainDraw = toPlain(draw);
  if (!plainDraw) return null;

  const prizePool = plainDraw.prizePool || {};
  const totalPoolAmount = roundCurrency(
    prizePool.total ??
      plainDraw.totalPoolAmount ??
      ((plainDraw.jackpotPool || 0) + (plainDraw.matchFourPool || 0) + (plainDraw.matchThreePool || 0))
  );

  return {
    ...plainDraw,
    month: typeof plainDraw.month === 'number' ? formatDrawMonth(plainDraw.month, plainDraw.year) : plainDraw.month,
    monthValue:
      typeof plainDraw.month === 'number' && plainDraw.year
        ? `${plainDraw.year}-${String(plainDraw.month).padStart(2, '0')}`
        : plainDraw.monthValue || '',
    drawNumbers: plainDraw.drawNumbers || [],
    activeSubscribers: plainDraw.activeSubscribers ?? plainDraw.totalSubscribers ?? 0,
    jackpotRollover: roundCurrency(plainDraw.jackpotRollover ?? plainDraw.rolledOverAmount ?? 0),
    prizePool: {
      total: totalPoolAmount,
      fiveMatch: roundCurrency(prizePool.fiveMatch ?? plainDraw.jackpotPool ?? 0),
      fourMatch: roundCurrency(prizePool.fourMatch ?? plainDraw.matchFourPool ?? 0),
      threeMatch: roundCurrency(prizePool.threeMatch ?? plainDraw.matchThreePool ?? 0),
    },
    winners: (plainDraw.winners || []).map(serializeWinner),
  };
};

const serializeUser = (user, options = {}) => {
  const plainUser = toPlain(user);
  if (!plainUser) return null;

  const winnerMeta = options.winnerMeta || {};
  const charity = serializeCharity(plainUser.charity || plainUser.selectedCharity);

  return {
    ...plainUser,
    name: getUserName(plainUser),
    charity,
    selectedCharity: charity,
    charityPercentage: plainUser.charityPercentage ?? plainUser.charityContributionPercent ?? 10,
    paymentStatus: winnerMeta.paymentStatus ?? plainUser.paymentStatus ?? null,
    winnerProof: winnerMeta.proofUrl ?? plainUser.winnerProof ?? '',
  };
};

module.exports = {
  formatDrawMonth,
  getUserName,
  roundCurrency,
  serializeCharity,
  serializeDraw,
  serializeScore,
  serializeUser,
  serializeWinner,
  toPlain,
};
