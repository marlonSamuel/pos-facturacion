'use strict';

const bcrypt = require('bcryptjs');

module.exports = {
  async up(queryInterface) {
    const hash = bcrypt.hashSync('admin', 10);

    await queryInterface.bulkInsert('usuario', [{
      idusuario: 1,
      nombre: 'Administrador',
      tipo_documento: 'DPI',
      num_documento: '0',
      direccion: 'Oficina Central',
      telefono: '00000000',
      email: 'admin@newhorizon.com',
      cargo: 'admin',
      login: 'admin',
      clave: hash,
      imagen: 'default.png',
      condicion: 1,
      idrol: 1,
      createdAt: new Date(),
      updatedAt: new Date()
    }], { ignoreDuplicates: true });
  },

  async down(queryInterface) {
    await queryInterface.bulkDelete('usuario', { idusuario: 1 }, {});
  }
};
