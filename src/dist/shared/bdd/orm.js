import { MikroORM } from '@mikro-orm/core';
import { MySqlDriver } from '@mikro-orm/mysql';
export const orm = await MikroORM.init({
    entities: ['./src/dist/**/*.entity.js'],
    entitiesTs: ['src/**/*.entity.ts'],
    driver: MySqlDriver,
    clientUrl: process.env.DB_URL || '',
    debug: true,
    schemaGenerator: {
        disableForeignKeys: true,
        createForeignKeyConstraints: true,
        ignoreSchema: [],
    }
});
export const syncSchema = async () => {
    const generator = orm.getSchemaGenerator();
    /*await generator.createSchema();
    //await generator.dropSchema();*/
    //await generator.updateSchema({safe: true});
    console.log('Esquema actualizado');
};
//# sourceMappingURL=orm.js.map