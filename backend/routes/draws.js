const express = require('express');
const router = express.Router();
const drawController = require('../controllers/drawController');
const { protect, adminOnly } = require('../middleware/Auth');

router.get('/latest', drawController.getLatestDraw);
router.get('/current', drawController.getCurrentDraw);
router.get('/my-history', protect, drawController.getUserDrawHistory);
router.get('/admin/all', protect, adminOnly, drawController.adminGetAllDraws);
router.get('/admin/score-stats', protect, adminOnly, drawController.getScoreStats);
router.post('/admin/create', protect, adminOnly, drawController.createDraw);
router.post('/admin/:id/simulate', protect, adminOnly, drawController.simulateDraw);
router.post('/admin/:id/publish', protect, adminOnly, drawController.publishDraw);
router.post('/create', protect, adminOnly, drawController.createDraw);
router.post('/:id/simulate', protect, adminOnly, drawController.simulateDraw);
router.post('/:id/publish', protect, adminOnly, drawController.publishDraw);
router.get('/', drawController.getDraws);

module.exports = router;
