const express = require('express');
const router = express.Router();
const userController = require('../controllers/userController');
const { protect } = require('../middleware/Auth');

router.post('/upload-proof', protect, userController.uploadProof);

module.exports = router;
