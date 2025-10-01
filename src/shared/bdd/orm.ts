import { MikroORM } from '@mikro-orm/core';
import { SqlHighlighter } from '@mikro-orm/sql-highlighter';
import { MySqlDriver } from '@mikro-orm/mysql';
//import { dbpassword } from '../ormpassword.js';

export const orm = await MikroORM.init({
    entities: ['dist/**/*.entity.js'],
    entitiesTs: ['src/**/*.entity.ts'],
    dbName: 'VuelosApp',
    driver: MySqlDriver,
    host: 'localhost',
    user: 'root',
    password : "1234",
    highlighter: new SqlHighlighter(),
    debug: true,
    schemaGenerator: { //nunca en producción, solo desarrollo
        disableForeignKeys: true,
        createForeignKeyConstraints: true,
        ignoreSchema: [],
    }
});

export const syncSchema = async () => {
    const generator = orm.getSchemaGenerator();
    /*await generator.createSchema();
    await generator.dropSchema();*/
    await generator.updateSchema();
    console.log('Esquema actualizado');
}