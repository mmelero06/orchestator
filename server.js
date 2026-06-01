// server.js
// Orquestador que coordina ACQUIRE y PREDICT

require('dotenv').config();
const express = require('express');
const axios = require('axios');

const PORT = process.env.PORT_ORCHESTRATOR || 8080;
const ACQUIRE_URL = process.env.ACQUIRE_URL || 'http://localhost:3001';
const PREDICT_URL = process.env.PREDICT_URL || 'http://localhost:3002';

const app = express();
app.use(express.json());

// Health check
app.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    service: 'orchestrator'
  });
});

// Endpoint principal: recibe datos, los guarda en ACQUIRE y hace predicción en PREDICT
app.post('/process', async (req, res) => {
  try {
    const { data, features, meta } = req.body;

    // Validaciones básicas
    if (!data) {
      return res.status(400).json({ error: 'Missing data field' });
    }
    if (!features) {
      return res.status(400).json({ error: 'Missing features field' });
    }
    if (!meta) {
      return res.status(400).json({ error: 'Missing meta field' });
    }

    // 1. Llamar a ACQUIRE para guardar los datos
    console.log('[ORCHESTRATOR] Llamando a ACQUIRE para guardar datos...');
    const acquireResponse = await axios.post(`${ACQUIRE_URL}/acquire`, {
      data,
      source: 'orchestrator'
    });
    
    const dataId = acquireResponse.data.dataId;
    console.log(`[ORCHESTRATOR] Datos guardados con ID: ${dataId}`);

    // 2. Llamar a PREDICT para hacer la predicción
    console.log('[ORCHESTRATOR] Llamando a PREDICT para hacer predicción...');
    const predictResponse = await axios.post(`${PREDICT_URL}/predict`, {
      features,
      meta
    });

    const predictionId = predictResponse.data.predictionId;
    const prediction = predictResponse.data.prediction;
    console.log(`[ORCHESTRATOR] Predicción realizada: ${prediction}`);

    // 3. Devolver ambos resultados
    res.status(201).json({
      success: true,
      dataId,           // ID de los datos guardados en ACQUIRE
      predictionId,     // ID de la predicción guardada en PREDICT
      prediction,       // Resultado de la predicción
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('[ORCHESTRATOR] Error:', error.message);
    
    // Si el error viene de uno de los servicios
    if (error.response) {
      return res.status(error.response.status).json({
        error: 'Error calling service',
        service: error.response.config.url,
        details: error.response.data
      });
    }
    
    res.status(500).json({ error: 'Internal orchestrator error' });
  }
});

// Iniciar servidor
app.listen(PORT, () => {
  console.log(`[ORCHESTRATOR] Servicio escuchando en http://localhost:${PORT}`);
  console.log(`[ORCHESTRATOR] ACQUIRE_URL: ${ACQUIRE_URL}`);
  console.log(`[ORCHESTRATOR] PREDICT_URL: ${PREDICT_URL}`);
});
