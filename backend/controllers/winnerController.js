const Draw = require('../models/Draw');
const { serializeDraw } = require('../utils/serializers');

// @desc    Get all winners for admin review
// @route   GET /api/winners
exports.getWinners = async (req, res) => {
  try {
    const draws = await Draw.find({
      status: { $in: ['published', 'completed'] },
      'winners.0': { $exists: true },
    })
      .sort({ year: -1, month: -1 })
      .populate('winners.user', 'firstName lastName email');

    const winners = draws.flatMap((draw) => {
      const serializedDraw = serializeDraw(draw);

      return serializedDraw.winners.map((winner, index) => ({
        _id: `${draw._id}-${winner._id || index}`,
        drawId: draw._id,
        drawMonth: serializedDraw.month,
        drawNumbers: serializedDraw.drawNumbers,
        publishedAt: draw.publishedAt,
        ...winner,
      }));
    });

    res.json(winners);
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
