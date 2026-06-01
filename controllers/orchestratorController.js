// controllers/orchestratorController.js
const axios = require('axios');
const { ACQUIRE_URL, PREDICT_URL } = require('../config/config');

function health(req, res) {
  res.json({
    status: 'ok',
    service: 'orchestrator'
  });
}

async function run(req, res) {
  try {
    // 1. Llamar a ACQUIRE para obtener los datos mockeados
    let acquireResult;
    try {
      const acquireResponse = await axios.post(`${ACQUIRE_URL}/data`, {});
      acquireResult = acquireResponse.data;
    } catch (err) {
      console.error('Error llamando a acquire:', err.message);
      return res.status(503).json({
        error: 'Acquire service unavailable',
        details: err.message
      });
    }

    // 2. Llamar a PREDICT para hacer predicción
    let predictResult;
    try {
      const predictResponse = await axios.post(`${PREDICT_URL}/predict`, {
        features: acquireResult.features,
      });
      predictResult = predictResponse.data;
    } catch (err) {
      console.error('Error llamando a predict:', err.message);
      return res.status(503).json({
        error: 'Predict service unavailable',
        details: err.message,
        acquireResult // Devolvemos el resultado de acquire aunque falle predict
      });
    }

    // 3. Devolver respuesta según contrato
    res.status(200).json({
      dataId: acquireResult.dataId,
      predictionId: predictResult.predictionId,
      prediction: predictResult.prediction,
      timestamp: predictResult.timestamp || new Date().toISOString()
    });

  } catch (err) {
    console.error('Error en orchestrator:', err);
    res.status(500).json({
      error: 'Internal orchestrator error',
      details: err.message
    });
  }
}

module.exports = {
  health,
  run
};
