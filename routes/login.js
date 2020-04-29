var express = require('express');
var bcrypt = require('bcryptjs');
var jwt = require('jsonwebtoken');

var SEED = require('../config/config').SEED;

var app = express();
var Usuario = require('../models/usuario');

// Google
var CLIENT_ID = require('../config/config').CLIENT_ID;
const {OAuth2Client} = require('google-auth-library');
const client = new OAuth2Client(CLIENT_ID);

// ===========================================
// Autenticación de google
// ===========================================
// Esta funcion se saca de la API de Google. Es un copy+paste
async function verify(token) {
    const ticket = await client.verifyIdToken({
        idToken: token,
        audience: CLIENT_ID,  // Specify the CLIENT_ID of the app that accesses the backend
        // Or, if multiple clients access the backend:
        //[CLIENT_ID_1, CLIENT_ID_2, CLIENT_ID_3]
    });

    const payload = ticket.getPayload();
    // const userid = payload['sub'];
    // If request specified a G Suite domain:
    //const domain = payload['hd'];

    return  {
        nombre  : payload.name,
        email   : payload.email,
        img     : payload.picture,
        google  : true
    }
 }

app.post('/google', async (req, res) => {
    
    var token = req.body.token;

    // verify se ha declarado anteriormente. Es una función que devuelve una promesa
    // para ejecutar esta funcion se necesita ejecutar dentro de una async. Por eso
    // ponemos async aquí: app.post('/google', async (req, res) 
    var googleUser = await verify( token ) 
        .catch(err => {
            res.status(403).json ({
                ok: false,
                mensaje: 'Token no válido!'
            });         
        });

    // El usuario existe con este correo
    Usuario.findOne({ email: googleUser.email}, (err, usuarioDB) => {
        // Este es un error grave de B.D.
        if (err) {
            return res.status(500).json ({
                ok: false,
                mensaje: '[ERROR] Error al buscar usuario',
                errors: err
            });
        }

        if ( usuarioDB ) {
            if ( usuarioDB.google === false ) {
                return res.status(400).json ({
                    ok: false,
                    mensaje: 'No puede autenticarse por Google. Prueba con autenticación normal'
                }); 
            } else {
                var token = jwt.sign({ usuario: usuarioDB }, SEED, { expiresIn: 14400}); // 4 horas

                res.status(200).json({
                    ok: true,
                    usuario: usuarioDB,
                    token: token,
                    id: usuarioDB._id
                }); 
            }
        } else {
            // El usuario no existe así que hay que crearlo
            var usuario = new Usuario();
            usuario.nombre = googleUser.nombre;
            usuario.email = googleUser.email;
            usuario.img = googleUser.img;
            usuario.google = true;
            usuario.password = 'N/A';

            usuario.save((err, usuarioDB) => {
                var token = jwt.sign({ usuario: usuarioDB }, SEED, { expiresIn: 14400}); // 4 horas

                res.status(200).json({
                    ok: true,
                    usuario: usuarioDB,
                    token: token,
                    id: usuarioDB._id
                });         
            });
        }

    });
    // Aquí ya sabemos que el usuario existe
    // Vamos a verificar si el usuario ya se ha conectado
    // con anterioridad
    
    // res.status(200).json ({
    //     ok: 'ok',
    //     mensaje: 'Bien!',
    //     // payload: payload,
    //     googleUser: googleUser
    // });
});

// ===========================================
// Autenticación normal
// ===========================================

app.post('/', (req, res) => {

    // Extraemos el body
    var body = req.body;

    // Condición de búsqueda: { email: body.email }
    Usuario.findOne({ email: body.email }, (err, usuarioDB) => {

        // Este es un error grave de B.D.
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

        var token = jwt.sign({ usuario: usuarioDB }, SEED, { expiresIn: 14400}); // 4 horas

        res.status(200).json({
            ok: true,
            usuario: usuarioDB,
            token: token,
            id: usuarioDB._id
        });  

    });  

    
});

module.exports = app;