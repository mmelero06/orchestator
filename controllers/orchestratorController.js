// controllers/orchestratorController.js
const axios = require('axios');
const { ACQUIRE_URL, PREDICT_URL } = require('../config/config');

function health(req, res) {
  res.json({
    status: 'ok',
    service: 'orchestrator'
  });
}

async function process(req, res) {
  try {
    const { data, features, meta } = req.body;

    // Validar datos
    if (!data || !features || !meta) {
      return res.status(400).json({
        error: 'Missing required fields: data, features, meta'
      });
    }

    // 1. Llamar a ACQUIRE para guardar los datos
    let acquireResult;
    try {
      const acquireResponse = await axios.post(`${ACQUIRE_URL}/acquire`, {
        data,
        source: meta.source || 'orchestrator'
      });
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
        features,
        meta
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

    // 3. Devolver respuesta combinada
    res.status(201).json({
      success: true,
      acquireResult,
      predictResult
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
  process
};
