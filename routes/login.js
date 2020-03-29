var express = require('express');
var bcrypt = require('bcryptjs');
var jwt = require('jsonwebtoken');

var SEED = require('../config/config').SEED;

var app = express();
var Usuario = require('../models/usuario');

// ===========================================
// Login
// ===========================================

app.post('/', (req, res) => {

    // Extraemos el body
    var body = req.body;

    // Condición de búsqueda: { email: body.email }
    Usuario.findOne({ email: body.email }, (err, usuarioDB) => {

        // Este es un error grave
        if (err) {
            return res.status(500).json ({
                ok: false,
                mensaje: '[ERROR] Error al buscar usuario',
                errors: err
            });
        }

        // Verificar si existe el mail
        if (!usuarioDB) {
            return res.status(400).json ({
                ok: false,
                mensaje: 'Credenciales incorrectas - email',
                errors: err
            });
        }

        // Verificar si la password es correcta
        if  (!bcrypt.compareSync( body.password, usuarioDB.password ) ){
            return res.status(400).json ({
                ok: false,
                mensaje: 'Credenciales incorrectas - password ',
                errors: err
            });
        }

        // Crear un token 
        usuarioDB.password = ';)';

        var token = jwt.sign({ usuario: usuarioDB }, SEED, { expiresIn: 14400}) // 4 horas

        res.status(200).json({
            ok: true,
            usuario: usuarioDB,
            token: token,
            id: usuarioDB._id
        });  

    });  

    
});

module.exports = app;