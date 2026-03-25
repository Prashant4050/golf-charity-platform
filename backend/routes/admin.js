const express = require('express');
const router = express.Router();
const adminController = require('../controllers/adminController');
const { protect, adminOnly } = require('../middleware/Auth');

router.use(protect, adminOnly);
router.get('/stats', adminController.getStats);
router.get('/users', adminController.getUsers);
router.get('/users/:id', adminController.getUser);
router.put('/users/:userId/scores/:scoreId', adminController.updateUserScore);

module.exports = router;
