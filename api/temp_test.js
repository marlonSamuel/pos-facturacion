const { Usuario } = require('../../src/models');
console.log('Usuario.findOne type:', typeof Usuario.findOne);
console.log('Is mock?', Boolean(Usuario.findOne?.mockResolvedValue));
