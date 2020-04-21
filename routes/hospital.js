// Con esto se quitan warnings  debido a usar "=>"
/*jshint esversion: 6 */

var express = require('express');

var mdAutenticacion = require('../middlewares/autenticacion');

var app = express();
var Hospital = require('../models/hospital');

// ===========================================
// Obterner todos los hospitales
// ===========================================

app.get('/', (req, res, next) => {

    var desde = req.query.desde || 0;
    desde = Number(desde);

    // Si no ponemos nada en el find({}) recupera toda la ingormación.
    Hospital.find({})
        .skip(desde)
        .limit(5)     
        .populate('usuario' , 'nombre email') // No pongo password porque no la quiero recibir en el JSON
        .exec (   
            (err, hospitales) => {

            if ( err ) {
                return res.status(500).json ({
                    ok: false,
                    mensaje: 'Error recuperando hospitales',
                    errors: err,
                });
            }

            Hospital.count({}, (err, conteo) => {
                res.status(200).json({
                    ok: true,
                    hospitales: hospitales,
                    total: conteo
                }); 

            });             

    });

});

// ===========================================
// Actualizar hospital
// ===========================================
// Normalmente se usa put o patch (ambos indistintamente)
// Este ":id" indica que es necesario mandar un id
app.put('/:id', mdAutenticacion.verificaToken, (req, res) => {

    var id = req.params.id;
    var body = req.body;

    Hospital.findById( id, (err, hospital) => {

        // Este sería un error de acceso a B.D.
        if ( err ) {
            return res.status(500).json ({
                ok: false,
                mensaje: 'Error al buscar hospital',
                errors: err
            });
        }

        // Este sería el error si no localiza el hospital
        if ( !hospital ){
            return res.status(400).json ({
                ok: false,
                mensaje: 'El hospital con el id' + id + ' no existe',
                errors: { message: 'No existe un hospital con ese id'}
            });
        }

        hospital.nombre = body.nombre;
        hospital.usuario = req.usuario._id;

        hospital.save( (err, hospitalGuardado) => {
            // Error al guardar
            if ( err ) {
                return res.status(400).json ({
                    ok: false,
                    mensaje: 'Error al actualizar hospital',
                    errors: err
                });
            }  

            // Si no sucede ningún error devolvemos true y el hospital actualizado
            res.status(200).json({
                ok: true,
                hospital: hospitalGuardado
            });                      
        });

    });

});

// ===========================================
// Crear un nuevo hospital
// ===========================================

app.post('/:id', mdAutenticacion.verificaToken, (req, res) => {

    // Extraemos el body
    var body = req.body;

    // Hospital es del modelo de mongoose (hospital.js)
    var hospital = new Hospital({
        nombre: body.nombre,
        usuario: req.usuario._id
     });

    // Guardamos el hospital y si hay error lo devolvemos
    hospital.save( ( err, hospitalGuardado ) => {

        if ( err ) {
            return res.status(400).json ({
                ok: false,
                mensaje: 'Error al crear hospital',
                errors: err
            });
        }

        // Si no sucede ningún error devolvemos ok:true y el hospital guardado
        res.status(201).json({
            ok: true,
            hospital: hospitalGuardado
        });

    });

});

// ===========================================
// Borrar un hospital mediante el id
// ===========================================
app.delete('/:id', mdAutenticacion.verificaToken, (req, res) => {

    var id = req.params.id;

    Hospital.findByIdAndRemove(id, (err, hospitalBorrado) => {
    
        // Error serio de base de datos
        if ( err ) {
            return res.status(500).json ({
                ok: false,
                mensaje: '[ERROR] Error al borrar hospital',
                errors: err
            });
        }

        if ( !hospitalBorrado ) {
            return res.status(400).json ({
                ok: false,
                mensaje: 'No existe un hospital con ese id',
                errors: {message: 'No existe un hospital con ese id'}
            });
        }

        // Cuando lo borra bien devuelve el hospital borrado
        res.status(200).json({
            ok: true,
            hospital: hospitalBorrado
        });        

    });
});

module.exports = app;