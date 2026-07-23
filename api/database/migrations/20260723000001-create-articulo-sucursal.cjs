'use strict';

module.exports = {
  async up(queryInterface) {
    // 1. Crear tabla articulo_sucursal
    await queryInterface.createTable('articulo_sucursal', {
      id: {
        type: queryInterface.sequelize.Sequelize.INTEGER,
        allowNull: false,
        autoIncrement: true,
        primaryKey: true
      },
      idarticulo: {
        type: queryInterface.sequelize.Sequelize.INTEGER,
        allowNull: false,
        references: { model: 'articulo', key: 'idarticulo' },
        onDelete: 'CASCADE'
      },
      idsucursal: {
        type: queryInterface.sequelize.Sequelize.INTEGER,
        allowNull: false,
        references: { model: 'sucursal', key: 'idsucursal' },
        onDelete: 'CASCADE'
      },
      stock: {
        type: queryInterface.sequelize.Sequelize.INTEGER,
        allowNull: false,
        defaultValue: 0
      },
      createdAt: {
        type: queryInterface.sequelize.Sequelize.DATE,
        allowNull: true
      },
      updatedAt: {
        type: queryInterface.sequelize.Sequelize.DATE,
        allowNull: true
      }
    });

    // 2. Migrar stock existente desde articulo
    await queryInterface.sequelize.query(
      `INSERT INTO articulo_sucursal (idarticulo, idsucursal, stock, createdAt, updatedAt)
       SELECT idarticulo, idsucursal, stock, NOW(), NOW() FROM articulo`
    );

    // 3. Crear unique constraint
    await queryInterface.addConstraint('articulo_sucursal', {
      fields: ['idarticulo', 'idsucursal'],
      type: 'unique',
      name: 'uq_articulo_sucursal'
    });

    // 4. Quitar stock de articulo
    const articuloCols = await queryInterface.describeTable('articulo');
    if (articuloCols.stock) {
      await queryInterface.removeColumn('articulo', 'stock');
    }
    if (articuloCols.idsucursal) {
      await queryInterface.removeColumn('articulo', 'idsucursal');
    }

    // 5. Quitar idsucursal de categoria
    const categoriaCols = await queryInterface.describeTable('categoria');
    if (categoriaCols.idsucursal) {
      await queryInterface.removeColumn('categoria', 'idsucursal');
    }

    // 6. Quitar idsucursal de persona
    const personaCols = await queryInterface.describeTable('persona');
    if (personaCols.idsucursal) {
      await queryInterface.removeColumn('persona', 'idsucursal');
    }
  },

  async down(queryInterface) {
    // Restaurar idsucursal y stock en articulo
    const articuloCols = await queryInterface.describeTable('articulo');
    if (!articuloCols.stock) {
      await queryInterface.addColumn('articulo', 'stock', {
        type: queryInterface.sequelize.Sequelize.INTEGER,
        allowNull: false,
        defaultValue: 0
      });
    }
    if (!articuloCols.idsucursal) {
      await queryInterface.addColumn('articulo', 'idsucursal', {
        type: queryInterface.sequelize.Sequelize.INTEGER,
        allowNull: false,
        defaultValue: 1
      });
    }

    // Restaurar idsucursal en categoria
    const categoriaCols = await queryInterface.describeTable('categoria');
    if (!categoriaCols.idsucursal) {
      await queryInterface.addColumn('categoria', 'idsucursal', {
        type: queryInterface.sequelize.Sequelize.INTEGER,
        allowNull: false,
        defaultValue: 1
      });
    }

    // Restaurar idsucursal en persona
    const personaCols = await queryInterface.describeTable('persona');
    if (!personaCols.idsucursal) {
      await queryInterface.addColumn('persona', 'idsucursal', {
        type: queryInterface.sequelize.Sequelize.INTEGER,
        allowNull: false,
        defaultValue: 1
      });
    }

    // Re-poblar stock desde articulo_sucursal
    await queryInterface.sequelize.query(
      `UPDATE articulo a
       JOIN articulo_sucursal ars ON a.idarticulo = ars.idarticulo AND ars.idsucursal = 1
       SET a.stock = ars.stock`
    );

    await queryInterface.dropTable('articulo_sucursal');
  }
};
