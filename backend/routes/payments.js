const express = require('express');
const router = express.Router();
const paymentController = require('../controllers/paymentController');
const { protect } = require('../middleware/Auth');

router.post('/webhook', paymentController.webhook);
router.post('/free-plan', protect, paymentController.activateFreePlan);
router.post('/create-checkout', protect, paymentController.createCheckout);
router.post('/portal', protect, paymentController.createPortal);
router.post('/cancel', protect, paymentController.cancelSubscription);
router.get('/history', protect, paymentController.getPaymentHistory);
router.get('/subscription', protect, paymentController.getSubscription);

module.exports = router;
