const Draw = require('../models/Draw');

// @desc    Upload winner proof URL
// @route   POST /api/users/upload-proof
exports.uploadProof = async (req, res) => {
  try {
    const proofUrl = String(req.body.proofUrl || '').trim();

    if (!proofUrl) {
      return res.status(400).json({ success: false, message: 'Proof URL is required' });
    }

    const draw = await Draw.findOne({
      winners: {
        $elemMatch: {
          user: req.user._id,
          paymentStatus: 'pending',
        },
      },
    }).sort({ publishedAt: -1, createdAt: -1 });

    if (!draw) {
      return res.status(404).json({ success: false, message: 'No pending winner record found' });
    }

    const winner = draw.winners.find(
      (entry) => entry.user.toString() === req.user._id.toString() && entry.paymentStatus === 'pending'
    );

    if (!winner) {
      return res.status(404).json({ success: false, message: 'No pending winner record found' });
    }

    winner.proofSubmitted = true;
    winner.proofUrl = proofUrl;
    await draw.save();

    res.json({ success: true, message: 'Proof submitted successfully' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
