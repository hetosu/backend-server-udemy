var express = require('express');
var bcrypt = require('bcryptjs');
var jwt = require('jsonwebtoken');

var mdAutenticacion = require('../middlewares/autenticacion');

var app = express();
var Usuario = require('../models/usuario');

// ===========================================
// Obterner todos los usuarios
// ===========================================

app.get('/', (req, res, next) => {

    Usuario.find({}, 'nombre email img role')
        .exec (   
            (err, usuarios) => {

            if ( err ) {
                return res.status(500).json ({
                    ok: false,
                    mensaje: 'Error recuperando usuarios',
                    errors: err,
                });
            }

            res.status(200).json({
                ok: true,
                usuarios: usuarios
            });
    });

});

// ===========================================
// Actualizar usuario
// ===========================================
// Normalmemtne se usa put o patch (ambos indistintamente)
// Esto :id indica que es necesario mandar un id
app.put('/:id', mdAutenticacion.verificaToken, (req, res) => {

    var id = req.params.id;
    var body = req.body;

    Usuario.findById( id, (err, usuario) => {

        // Este sería un error de acceso a B.D.
        if ( err ) {
            return res.status(500).json ({
                ok: false,
                mensaje: 'Error al buscar usuario',
                errors: err
            });
        }

        // Este sería el error si no localiza el usuario
        if ( !usuario ){
            return res.status(400).json ({
                ok: false,
                mensaje: 'El usuario con el id' + id + 'no existe',
                errors: { message: 'No xiste un usuario con ese id'}
            });
        }

        usuario.nombre = body.nombre;
        usuario.email = body.email;
        usuario.role = body.role;

        usuario.save( (err, usuarioGuardado) => {
            // Error al guardar
            if ( err ) {
                return res.status(400).json ({
                    ok: false,
                    mensaje: 'Error al actualizar usuario',
                    errors: err
                });
            }  
            
            // Esto no se guarda porque estoy pasando el "save". 
            // Al ser dentro del callback devuelve ';)' para que
            // no se vea la clave en el json devuelto
            usuarioGuardado.password = ';)';

            // Si no sucede ningún error devolvemos ok:true y el usuario guardado
            res.status(200).json({
                ok: true,
                usuario: usuarioGuardado
            });                      
        });

    });

});

// ===========================================
// Crear un nuevo usuario
// ===========================================

app.post('/', mdAutenticacion.verificaToken, (req, res) => {

    // Extraemos el body
    var body = req.body;

    // Usuario es del modelo de mongoose (usuarios.js)
    var usuario = new Usuario({
        nombre: body.nombre,
        email: body.email,
        password: bcrypt.hashSync(body.password, 10),
        img: body.img,
        role: body.role
    });

    // Guardamos el usuario y si hay error lo devolvemos
    usuario.save( ( err, usuarioGuardado ) => {

        if ( err ) {
            return res.status(400).json ({
                ok: false,
                mensaje: 'Error al crear usuario',
                errors: err
            });
        };

        // Si no sucede ningún error devolvemos ok:true y el usuario guardado
        res.status(201).json({
            ok: true,
            usuario: usuarioGuardado,
            usuarioToken: req.usuario
        });

    });


});

// ===========================================
// Borrar un usuario mediante el id
// ===========================================
app.delete('/:id', mdAutenticacion.verificaToken, (req, res) => {

    var id = req.params.id;

    Usuario.findByIdAndRemove(id, (err, usuarioBorrado) => {
    
        // Error serio de base de datos
        if ( err ) {
            return res.status(500).json ({
                ok: false,
                mensaje: 'Error al borrar usuario',
                errors: err
            });
        }

        if ( !usuarioBorrado ) {
            return res.status(400).json ({
                ok: false,
                mensaje: 'No existe un usuario con ese id',
                errors: {message: 'No existe un usuario con ese id'}
            });
        }

        // Cuando lo borra bien devuelve el usurio borrado
        res.status(200).json({
            ok: true,
            usuario: usuarioBorrado
        });        

    });
});

module.exports = app;