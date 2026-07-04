// server.js
// Orquestador que coordina ACQUIRE y PREDICT

require('dotenv').config();
const express = require('express');
const axios = require('axios');
const jwt = require('jsonwebtoken'); // <-- Añadimos la librería de seguridad

const PORT = process.env.PORT_ORCHESTRATOR || 8080;
const ACQUIRE_URL = process.env.ACQUIRE_URL || 'http://localhost:3001';
const PREDICT_URL = process.env.PREDICT_URL || 'http://localhost:3002';
const SECRET_KEY = 'mi_clave_secreta_super_segura'; // <-- Clave para firmar el pase VIP

const app = express();
app.use(express.json());

// ---------------------------------------------------------
// 1. EL LOGIN: Donde conseguimos la llave (Token)
// ---------------------------------------------------------
// ---------------------------------------------------------
// 1. EL LOGIN: Conectado a ACQUIRE y MongoDB de verdad
// ---------------------------------------------------------
app.post('/login', async (req, res) => {
  const { username, password } = req.body;
  
  try {
    // Le pedimos a ACQUIRE que verifique el usuario en MongoDB
    const response = await axios.post(`${ACQUIRE_URL}/usuarios/verificar`, { username, password });
    
    // Si ACQUIRE nos responde que es válido (status 200 y valido: true)
    if (response.data && response.data.valido) {
      // Creamos el token VIP que caduca en 1 hora
      const token = jwt.sign({ username }, SECRET_KEY, { expiresIn: '1h' });
      return res.status(200).json({ token });
    } else {
      return res.status(401).json({ error: 'Usuario o contraseña incorrectos' });
    }
  } catch (error) {
    // Si ACQUIRE devuelve un 401 (Credenciales inválidas), axios lanza un error. Lo capturamos aquí:
    if (error.response && error.response.status === 401) {
      return res.status(401).json({ error: 'Usuario o contraseña incorrectos' });
    }
    
    console.error('[ORCHESTRATOR LOGIN ERROR]:', error.message);
    return res.status(500).json({ error: 'Error al conectar con el servicio de autenticación' });
  }
});
// ---------------------------------------------------------
// 2. EL PORTERO: Middleware que revisa si traes la llave
// ---------------------------------------------------------
const verificarToken = (req, res, next) => {
  const bearerHeader = req.headers['authorization'];
  
  if (typeof bearerHeader !== 'undefined') {
    const bearer = bearerHeader.split(' ');
    const token = bearer[1];
    
    jwt.verify(token, SECRET_KEY, (err, authData) => {
      if (err) {
        return res.status(403).json({ error: 'Token inválido o caducado' });
      }
      next(); // Si la llave es buena, te deja pasar
    });
  } else {
    return res.status(401).json({ error: '¡Alto! No tienes token de acceso' });
  }
};

app.get('/', (req, res) => {
  res.status(200).send('Orquestador vivo');
});

// Health check (Abierto para todos)
app.get('/health', (req, res) => {
  res.json({ status: 'ok', service: 'orchestrator' });
});

// ---------------------------------------------------------
// 3. LA RUTA PRINCIPAL (Ahora protegida por 'verificarToken')
// ---------------------------------------------------------
// OJO: Tu ruta se llama /process, no /run
app.post('/process', verificarToken, async (req, res) => {
  try {
    const { data, features, meta } = req.body;

    if (!data) return res.status(400).json({ error: 'Missing data field' });
    if (!features) return res.status(400).json({ error: 'Missing features field' });
    if (!meta) return res.status(400).json({ error: 'Missing meta field' });

    console.log('[ORCHESTRATOR] Llamando a ACQUIRE para guardar datos...');
    const acquireResponse = await axios.post(`${ACQUIRE_URL}/data`, { data, source: 'orchestrator' });
    const dataId = acquireResponse.data.dataId;

    console.log('[ORCHESTRATOR] Llamando a PREDICT para hacer predicción...');
    const predictResponse = await axios.post(`${PREDICT_URL}/predict`, { features, meta });
    const predictionId = predictResponse.data.predictionId;
    const prediction = predictResponse.data.prediction;

    res.status(201).json({
      success: true,
      dataId,           
      predictionId,     
      prediction,       
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('[ORCHESTRATOR] Error:', error.message);
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

app.listen(PORT, () => {
  console.log(`[ORCHESTRATOR] Servicio escuchando en http://localhost:${PORT}`);
});

app.post('/register', async (req, res) => {
  const { username, password } = req.body;
  try {
    const response = await axios.post(`${ACQUIRE_URL}/usuarios/registrar`, { username, password });
    res.status(201).json(response.data);
  } catch (error) {
    res.status(500).json({ error: 'No se pudo registrar el usuario en la Base de Datos' });
  }
});