var jwt = require('jsonwebtoken');
var SEED = require('../config/config').SEED;

// ===========================================
// Verificar token (Middleware)
// ===========================================
exports.verificaToken = function (req, res, next) {
    
    var token = req.query.token;

    jwt.verify(token, SEED, (err, decoded) => {
       
        if (err) {
            return res.status(401).json ({ // 401: Unauthorized
                ok: false,
                mensaje: 'Token incorrecto',
                errors: err
            });
        }

        req.usuario = decoded.usuario;
        
        // Esto le dice que puede continuar hacia abajo
        next();

    });
}