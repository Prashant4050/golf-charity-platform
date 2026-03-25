const express = require('express');
const router = express.Router();
const winnerController = require('../controllers/winnerController');
const { protect, adminOnly } = require('../middleware/Auth');

router.get('/', protect, adminOnly, winnerController.getWinners);

module.exports = router;
