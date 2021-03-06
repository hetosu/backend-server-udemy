var mongoose = require('mongoose');
var uniqueValidator = require('mongoose-unique-validator');

var Schema = mongoose.Schema;

var rolesValidos = {
    values: ['ADMIN_ROLE', 'USER_ROLE'],
    message: '{VALUE} no es un role permitido'
};

// ================================================================
// Esquema - Usuario
// ================================================================

var usuarioSchema = new Schema({
    nombre: { type: String, required: [true, 'El nombre es necesario'] },
    email: { type: String, unique:true, required: [true, 'El mail es necesario'] },
    password: { type: String, required: [true, 'La contraseña es necesaria'] },
    img: { type: String, required: false},
    role: { type: String, required: [true, 'El role es necesario'], default: 'USER_ROLE', enum: rolesValidos},
    google: { type: Boolean, default: false}
});

usuarioSchema.plugin(uniqueValidator, {message: 'El {PATH} debe de ser único'});

// Exportación del modelo
module.exports = mongoose.model('Usuario', usuarioSchema);
