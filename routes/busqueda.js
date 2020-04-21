/*jshint esversion: 6 */

var express = require('express');
var app = express();

var Hospital = require('../models/hospital');
var Medico = require('../models/medico');
var Usuario = require('../models/usuario');

// ==================================================================
// Búsqueda específica por colección (Médicos, Hospitales o Usuarios)
// ==================================================================

app.get('/:tabla/:busqueda', (req, res, next) => {

    var tabla = req.params.tabla;
    var busqueda = req.params.busqueda;

    var regexp = new RegExp( busqueda, 'i');

    switch ( tabla) {

        case 'usuarios':
            promesa = buscarUsuarios(busqueda, regexp)  ;
            break;

        case 'medicos':
            promesa = buscarMedicos(busqueda, regexp)  ;
            break;

        case 'hospitales':
            promesa = buscarHospitales(busqueda, regexp)  ;
            break;

        default: 
        res.status(400).json({
                ok: false,
                message: 'Los tipos de búsqueda deben ser: usuarios, medicos y hospitales',
                error: { message: 'Tipo de tabla/coleccicón no válido'}
        });
    }

    promesa.then( data => {
    
        res.status(200).json({
            ok: true,
            // Se pone "talba" etre corchetes porque sino saldría 'tabla' en el JSON
            // Esto se llama propiedades de objeto computadas o procesadas
            [tabla]: data
        });
    });
   

});

// ==================================================================
// Búsqueda general
// ==================================================================

app.get('/todo/:busqueda', (req, res, next) => {

    // Esto "req.params.busqueda" es lo que se
    // pasa en el segmento de URL ":busqueda"
    var busqueda = req.params.busqueda;

    // Esta expresión regular le informa de que cogerá
    // el segmento de la URL y con la "i" le informa de que no 
    // haga case sensitive. Al final regexp es lo que se
    // pasa a find
    var regexp = new RegExp( busqueda, 'i');

    Promise.all( [
            buscarHospitales(busqueda, regexp), 
            buscarMedicos(busqueda, regexp),
            buscarUsuarios(busqueda, regexp)
         ])
        .then( respuestas => {
            res.status(200).json({
                ok: true,
                hospitales: respuestas[0],
                medicos: respuestas[1],
                usuarios: respuestas[2]
            });
        });

});
       
function buscarHospitales( busqueda, regexp) {

    return new Promise( (resolve, reject) => {
        // La búsqueda así "{ nombre: busqueda}" implica que hay que 
        // poner todo el nombre: "localhost:3000/busqueda/todo/<texto búsqueda>"
        Hospital.find({ nombre: regexp })
                .populate('usuario', 'nombre email')
                .exec( (err, hospitales) => {
                    if ( err ) {
                        reject('Error al cagar Hospitales', err);  
                    } else {
                        resolve(hospitales);
                    }
            
                });
    });
    
}

function buscarMedicos( busqueda, regexp) {

    return new Promise( (resolve, reject) => {
        // La búsqueda así "{ nombre: busqueda}" implica que hay que 
        // poner todo el nombre: "localhost:3000/busqueda/todo/<texto búsqueda>"
        Medico.find({ nombre: regexp })
                .populate('usuario', 'nombre email')
                .populate('hospital')
                .exec( (err, medicos) => {
                    if ( err ) {
                        reject('Error al cagar Médicos', err);  
                    } else {
                        resolve(medicos);
                    }
            
                });
    });
    
} 

function buscarUsuarios( busqueda, regexp) {

    return new Promise( (resolve, reject) => {
        // La búsqueda así "{ nombre: busqueda}" implica que hay que 
        // poner todo el nombre: "localhost:3000/busqueda/todo/Juan García"            
        Usuario.find({}, 'nombre email role')
                .or([{'nombre': regexp},{'email': regexp}]) 
                .exec((err, usuarios) => {
                    if ( err ) {
                        reject('Error al cagar Usuarios', err);  
                    } else {
                        resolve(usuarios);
                    }
            
        });
    });
    
} 

module.exports = app;