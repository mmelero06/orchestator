const jwt = require('jsonwebtoken');

// Esta es la contraseña maestra para fabricar las llaves. 
// Para la recuperación la dejamos fija aquí y así no te da problemas.
const JWT_SECRET = 'clave_secreta_sod_2026';

function verificarToken(req, res, next) {
  // 1. Buscamos el token en la cabecera de la petición
  const authHeader = req.headers['authorization'];
  
  if (!authHeader) {
    return res.status(401).json({ error: 'Acceso denegado: No se proporcionó token en la cabecera' });
  }

  // El formato estándar es "Bearer <token>", así que cogemos solo la parte del token
  const token = authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ error: 'Acceso denegado: Formato de token inválido' });
  }

  try {
    // 2. Verificamos si el token es de verdad usando nuestra contraseña secreta
    const verificado = jwt.verify(token, JWT_SECRET);
    req.usuario = verificado; 
    next(); // ¡La llave es válida! Le dejamos pasar
  } catch (error) {
    return res.status(401).json({ error: 'Token inválido o expirado' });
  }
}

module.exports = verificarToken;