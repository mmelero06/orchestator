// routes/orchestratorRoutes.js
const express = require('express');
const router = express.Router();
const { health, process } = require('../controllers/orchestratorController');

router.get('/health', health);
router.post('/process', process);

module.exports = router;
