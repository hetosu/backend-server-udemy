var express = require('express');

//var mdAutenticacion = require('../middlewares/autenticacion');

var fileUpload = require('express-fileupload');
var fs = require('fs'); // Para poder escribir sobre el file system

var app = express();

// Para guardar la imagen en B.D. necesito los modelos de Mongo
var Usuario = require('../models/usuario');
var Medico = require('../models/medico');
var Hospital = require('../models/hospital');

// default options
app.use(fileUpload());

app.put('/:tipo/:id', (req, res, next) => {

    var tipo = req.params.tipo;
    var id = req.params.id;

    // VALIDACION 1: Tipos de colección
    var tiposValidos = ['hospitales', 'medicos', 'usuarios'];
    if ( tiposValidos.indexOf (tipo) < 0 ) {
        return res.status(400).json ({
            ok: false,
            mensaje: 'Tipo de colección no válida',
            errors: {message:'Debe seleccionar una colección válida: ' + tiposValidos.join(', ')}
        }); 
    }

    // VALIDACION 2: Se ha seleccionado un archivo
    if ( !req.files ) {
        return res.status(400).json ({
            ok: false,
            mensaje: 'No seleccionó nada',
            errors: {message:'Debe seleccionar una imagen'},
        });
    }

    // Obtener nombre del archivo
    var archivo = req.files.imagen;
    var nombreCortado = archivo.name.split('.');
    var extensionArchivo = nombreCortado[nombreCortado.length - 1].toLowerCase();

    // extensionArchivo = extensionArchivo.toLowerCase();

    // Solo aceptamos estas extensiones
    var extensionesValidas = ['png', 'jpg', 'gif', 'jpeg'];

    // VALIDACION 3: Validar si es correcta la extensión que admitimos
    if ( extensionesValidas.indexOf (extensionArchivo) < 0 ) {
        return res.status(400).json ({
            ok: false,
            mensaje: 'No es un fichero con extensión válida',
            errors: {message:'Debe seleccionar una imagen con extensión ' + extensionesValidas.join(', ')}
        }); 
    }

    // VALIDACION 4: Nombre de archivo personalizado
    // 127234234-123.png -> La primera parte es un número y después 
    // del guión un aleatorio. Así evitamos la caché del navegador
    // Estos símbolos son de template literal:
    var nombreArchivo = `${ id }-${ new Date().getMilliseconds() }.${ extensionArchivo }`;

    // Mover el archivo del temporal a un path específico
    var path = `./uploads/${ tipo }/${ nombreArchivo }`;

    archivo.mv( path, err => {
        if ( err ) {
            return res.status(500).json ({
                ok: false,
                mensaje: 'Error al mover archivo',
                errors: err
            }); 
        }   

        subirPorTipo ( tipo, id, nombreArchivo, res);

    });
});

function subirPorTipo ( tipo, id, nombreArchivo, res) {

    if ( tipo === 'usuarios') {
        Usuario.findById(id, (err, usuario) => {
            
            if ( !usuario) {
                return res.status(400).json({
                    ok: false,
                    mensaje: 'Usuario no existe',
                    errors: {message:  'Usuario no existe'}
                });
            } 
           
            var pathViejo = './uploads/usuarios/' + usuario.img;

            // Si existe, elimina la imagen anterior
            if ( fs.existsSync( pathViejo ) ) {
                fs.unlinkSync( pathViejo );
            }

            usuario.img = nombreArchivo;

            usuario.save( (err, usuarioActualizado) => {
                
                usuarioActualizado.password = ':)';

                return res.status(200).json({
                    ok: true,
                    mensaje: 'Imagen del usuario actualizada',                    
                    usuario: usuarioActualizado
                });

            });
        });
    }

    if ( tipo === 'medicos') {
        Medico.findById(id, (err, medico) => {

            if ( !medico) {
                return res.status(400).json({
                    ok: false,
                    mensaje: 'Médico no existe',
                    errors: {message:  'Médico no existe'}
                });
            }

            var pathViejo = './uploads/medicos/' + medico.img;

            // Si existe, elimina la imagen anterior
            if ( fs.existsSync( pathViejo ) ) {
                fs.unlinkSync( pathViejo );
            }

            medico.img = nombreArchivo;

            medico.save( (err, medicoActualizado) => {
                
                return res.status(200).json({
                    ok: true,
                    mensaje: 'Imagen del medico actualizada',                    
                    medico: medicoActualizado
                });

            });
        });
    }

    if ( tipo === 'hospitales') {
        Hospital.findById(id, (err, hospital) => {

            if ( !hospital) {
                return res.status(400).json({
                    ok: false,
                    mensaje: 'Hospital no existe',
                    errors: {message:  'Hospital no existe'}
                });
            }
            
            var pathViejo = './uploads/hospitales/' + hospital.img;

            // Si existe, elimina la imagen anterior
            if ( fs.existsSync( pathViejo ) ) {
                fs.unlinkSync( pathViejo );
            }

            hospital.img = nombreArchivo;

            hospital.save( (err, hospitalActualizado) => {
                
                return res.status(200).json({
                    ok: true,
                    mensaje: 'Imagen del hospital actualizada',                    
                    hospital: hospitalActualizado
                });

            });
        });
    }

}

module.exports = app;