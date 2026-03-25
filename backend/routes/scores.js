const express = require('express');
const router = express.Router();
const scoreController = require('../controllers/scoreController');
const { protect, adminOnly } = require('../middleware/Auth');

router.get('/user/:userId', protect, adminOnly, scoreController.getUserScores);
router.get('/', protect, scoreController.getScores);
router.post('/', protect, scoreController.addScore);
router.put('/:scoreId', protect, scoreController.editScore);
router.delete('/:scoreId', protect, scoreController.deleteScore);

module.exports = router;
