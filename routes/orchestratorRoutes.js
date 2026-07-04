const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const { health, run } = require('../controllers/orchestratorController');
const verificarToken = require('../middlewares/auth'); // Importamos a nuestro portero

// La contraseña maestra (la misma que pusimos en el portero)
const JWT_SECRET = 'clave_secreta_sod_2026';

// 1. Ruta de Salud (Pública)
router.get('/health', health);

// 2. NUEVA RUTA: Login (Pública) - Aquí se consiguen las llaves
router.post('/login', (req, res) => {
  const { username, password } = req.body;

  // Comprobamos si los credenciales son los correctos
  if (username === 'admin' && password === 'sod2026') {
    // Le fabricamos una llave (token) que caduca en 2 horas
    const token = jwt.sign({ username, role: 'admin' }, JWT_SECRET, { expiresIn: '2h' });
    return res.json({ token });
  } else {
    return res.status(401).json({ error: 'Usuario o contraseña incorrectos' });
  }
});

// 3. Ruta Principal (PROTEGIDA) - Fíjate cómo hemos puesto "verificarToken" justo antes de "run"
router.post('/run', verificarToken, run);

module.exports = router;