// Con esto se quitan warnings  debido a usar "=>"
/*jshint esversion: 6 */

var express = require('express');

var mdAutenticacion = require('../middlewares/autenticacion');

var app = express();
var Medico = require('../models/medico');

// ===========================================
// Obterner todos los médicos
// ===========================================

app.get('/', (req, res, next) => {

    var desde = req.query.desde || 0;
    desde = Number(desde);

    Medico.find({})
        .skip(desde)
        .limit(5)       
        .populate('usuario', 'nombre email')
        .populate('hospital')
        .exec (   
            (err, medicos) => {

            if ( err ) {
                return res.status(500).json ({
                    ok: false,
                    mensaje: 'Error recuperando médicos',
                    errors: err,
                });
             }

             Medico.count({}, (err, conteo) => {
                res.status(200).json({
                    ok: true,
                    medicos: medicos,
                    total: conteo
                }); 
            });

    });

});

// ===========================================
// Actualizar médico
// ===========================================
// Normalmemtne se usa put o patch (ambos indistintamente)
// Este ":id" indica que es necesario mandar un id
app.put('/:id', mdAutenticacion.verificaToken, (req, res) => {

    var id = req.params.id;
    var body = req.body;

    Medico.findById( id, (err, medico) => {

        // Este sería un error de acceso a B.D.
        if ( err ) {
            return res.status(500).json ({
                ok: false,
                mensaje: 'Error al buscar médico',
                errors: err
            });
        }

        // Este sería el error si no localiza el médico
        if ( !medico ){
            return res.status(400).json ({
                ok: false,
                mensaje: 'El médico con el id' + id + ' no existe',
                errors: { message: 'No existe un médico con ese id'}
            });
        }

        medico.nombre = body.nombre;
        medico.usuario = req.usuario._id;
        medico.hospital = body.hospital;

        medico.save( (err, medicoGuardado) => {
            // Error al guardar
            if ( err ) {
                return res.status(400).json ({
                    ok: false,
                    mensaje: 'Error al actualizar medico',
                    errors: err
                });
            }  

            // Si no sucede ningún error devolvemos true y el medico actualizado
            res.status(200).json({
                ok: true,
                medico: medicoGuardado
            });                      
        });

    });

});

// ===========================================
// Crear un nuevo médico
// ===========================================

app.post('/', mdAutenticacion.verificaToken, (req, res) => {

    // Extraemos el body
    var body = req.body;

    // "Medico" es del modelo de mongoose (medico.js)
    var medico = new Medico({
        nombre: body.nombre,
        usuario: req.usuario._id,
        hospital: body.hospital,
     });

    // Guardamos el médico y si hay error lo devolvemos
    medico.save( ( err, medicoGuardado ) => {

        if ( err ) {
            return res.status(400).json ({
                ok: false,
                mensaje: 'Error al crear medico',
                errors: err
            });
        }

        // Si no sucede ningún error devolvemos ok:true y el medico guardado
        res.status(201).json({
            ok: true,
            medico: medicoGuardado
        });

    });

});

// ===========================================
// Borrar un medico mediante el id
// ===========================================
app.delete('/:id', mdAutenticacion.verificaToken, (req, res) => {

    var id = req.params.id;

    Medico.findByIdAndRemove(id, (err, medicoBorrado) => {
    
        // Error serio de base de datos
        if ( err ) {
            return res.status(500).json ({
                ok: false,
                mensaje: '[ERROR] Error al borrar medico',
                errors: err
            });
        }

        if ( !medicoBorrado ) {
            return res.status(400).json ({
                ok: false,
                mensaje: 'No existe un medico con ese id',
                errors: {message: 'No existe un medico con ese id'}
            });
        }

        // Cuando lo borra bien devuelve el medico borrado
        res.status(200).json({
            ok: true,
            medico: medicoBorrado
        });        

    });
});

module.exports = app;