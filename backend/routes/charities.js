const express = require('express');
const router = express.Router();
const charityController = require('../controllers/charityController');
const { protect, adminOnly } = require('../middleware/Auth');

router.get('/featured', charityController.getFeaturedCharities);
router.post('/select/:id', protect, charityController.selectCharity);
router.put('/select/:id', protect, charityController.selectCharity);
router.get('/', charityController.getCharities);
router.get('/:id', charityController.getCharity);
router.post('/', protect, adminOnly, charityController.createCharity);
router.put('/:id', protect, adminOnly, charityController.updateCharity);
router.delete('/:id', protect, adminOnly, charityController.deleteCharity);

module.exports = router;
