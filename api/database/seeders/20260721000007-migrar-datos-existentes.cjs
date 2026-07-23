'use strict';

module.exports = {
  async up(queryInterface) {
    // 1. Asignar todos los usuarios existentes al comercio 1, sucursal 1
    await queryInterface.sequelize.query(
      "UPDATE usuario SET idcomercio = 1, idsucursal = 1 WHERE idcomercio IS NULL"
    );

    // 2. Poblar idcomercio=1 en registros existentes
    await queryInterface.sequelize.query(
      "UPDATE articulo SET idcomercio = 1 WHERE idcomercio IS NULL OR idcomercio = 0"
    );
    await queryInterface.sequelize.query(
      "UPDATE categoria SET idcomercio = 1 WHERE idcomercio IS NULL OR idcomercio = 0"
    );
    await queryInterface.sequelize.query(
      "UPDATE persona SET idcomercio = 1 WHERE idcomercio IS NULL OR idcomercio = 0"
    );
    await queryInterface.sequelize.query(
      "UPDATE venta SET idsucursal = 1 WHERE idsucursal IS NULL OR idsucursal = 0"
    );
    // 3. Migrar stock existente a articulo_sucursal (sucursal 1)
    await queryInterface.sequelize.query(
      "INSERT IGNORE INTO articulo_sucursal (idarticulo, idsucursal, stock) SELECT idarticulo, 1, 0 FROM articulo"
    );    await queryInterface.sequelize.query(
      "UPDATE ingreso SET idsucursal = 1 WHERE idsucursal IS NULL OR idsucursal = 0"
    );

    // 3. Crear registro en usuario_sucursal para cada usuario → sucursal 1
    await queryInterface.sequelize.query(
      `INSERT INTO usuario_sucursal (idusuario, idsucursal, createdAt)
       SELECT u.idusuario, 1, NOW()
       FROM usuario u
       WHERE NOT EXISTS (
         SELECT 1 FROM usuario_sucursal us
         WHERE us.idusuario = u.idusuario AND us.idsucursal = 1
       )`
    );
  },

  async down(queryInterface) {
    await queryInterface.sequelize.query(
      "UPDATE usuario SET idcomercio = NULL, idsucursal = NULL WHERE idcomercio = 1"
    );
    await queryInterface.sequelize.query(
      "UPDATE articulo SET idsucursal = NULL WHERE idsucursal = 1"
    );
    await queryInterface.sequelize.query(
      "UPDATE categoria SET idsucursal = NULL WHERE idsucursal = 1"
    );
    await queryInterface.sequelize.query(
      "UPDATE persona SET idsucursal = NULL WHERE idsucursal = 1"
    );
    await queryInterface.sequelize.query(
      "UPDATE venta SET idsucursal = NULL WHERE idsucursal = 1"
    );
    await queryInterface.sequelize.query(
      "UPDATE ingreso SET idsucursal = NULL WHERE idsucursal = 1"
    );
    await queryInterface.sequelize.query(
      "DELETE FROM usuario_sucursal WHERE idsucursal = 1"
    );
  }
};
