var mongoose = require('mongoose');
var uniqueValidator = require('mongoose-unique-validator');

var Schema = mongoose.Schema;

// ================================================================
// Esquema - Médico
// ================================================================

var medicoSchema = new Schema({
    nombre: { type: String, required: [true, 'El nombre es necesario'] },
    img: { type: String, required: false },
    usuario: { type: Schema.Types.ObjectId, ref: 'Usuario', required: true },
    hospital: { type: Schema.Types.ObjectId, ref: 'Hospital', required: [true, 'El id hospital es un campo obligatorio'] }
});

// }, { collection: 'medicos' });

medicoSchema.plugin(uniqueValidator, {message: 'El {PATH} debe de ser único'});

// Exportación del modelo
module.exports = mongoose.model('Medico', medicoSchema);