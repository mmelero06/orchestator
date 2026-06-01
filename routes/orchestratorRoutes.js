// routes/orchestratorRoutes.js
const express = require('express');
const router = express.Router();
const { health, run } = require('../controllers/orchestratorController');

router.get('/health', health);
router.post('/run', run);

module.exports = router;
