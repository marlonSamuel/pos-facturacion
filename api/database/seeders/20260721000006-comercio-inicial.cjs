'use strict';

module.exports = {
  async up(queryInterface) {
    // Crear comercio "New Horizon"
    await queryInterface.bulkInsert('comercio', [{
      idcomercio: 1,
      nombre: 'New Horizon',
      nickname: 'new-horizon',
      descripcion: 'Sistema POS multi-comercio',
      direccion: 'Via Granada, Zona 8',
      telefono: '00000000',
      email: 'admin@newhorizon.com',
      logo: null,
      color_primario: '#1890ff',
      condicion: 1,
      createdAt: new Date(),
      updatedAt: new Date()
    }], { ignoreDuplicates: true });

    // Crear sucursal "Matriz"
    await queryInterface.bulkInsert('sucursal', [{
      idsucursal: 1,
      idcomercio: 1,
      codigo: 'MATRIZ',
      nombre: 'Matriz',
      direccion: 'Via Granada, Zona 8',
      telefono: '00000000',
      condicion: 1,
      nit: process.env.NIT_DTE || '44653948',
      nombre_emisor: process.env.NOMBRE_EMISOR || 'COMPAÑIA DE AGUA DE LAS TERRAZAS, S.A.',
      nombre_comercial: 'NEW HORIZON',
      direccion_emisor: 'Via Granada, Zona 8',
      regimen: 'GEN',
      usuario_digifact: process.env.USERNAME_DTE || '',
      password_digifact: process.env.PASS_DTE || '',
      codigo_establecimiento: process.env.CODIGO_ESTABLECIMIENTO || '1',
      codigo_pos: process.env.CODIGO_POS || '1',
      auth_url_digifact: process.env.AUTH_URL_DTE || '',
      cert_url_digifact: process.env.CERT_URL_DTE || '',
      cancel_url_digifact: process.env.CANCEL_URL_DTE || '',
      createdAt: new Date(),
      updatedAt: new Date()
    }], { ignoreDuplicates: true });
  },

  async down(queryInterface) {
    await queryInterface.bulkDelete('sucursal', { idsucursal: 1 }, {});
    await queryInterface.bulkDelete('comercio', { idcomercio: 1 }, {});
  }
};
