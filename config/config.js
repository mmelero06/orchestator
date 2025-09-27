// config/config.js
require('dotenv').config();

module.exports = {
  PORT: process.env.PORT || 3000,
  ACQUIRE_URL: process.env.ACQUIRE_URL || 'http://localhost:3001',
  PREDICT_URL: process.env.PREDICT_URL || 'http://localhost:3002'
};
