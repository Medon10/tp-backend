import { MikroORM } from '@mikro-orm/core';
import { SqlHighlighter } from '@mikro-orm/sql-highlighter';
import { MySqlDriver } from '@mikro-orm/mysql';

export const orm = await MikroORM.init({
    entities: ['dist/**/*.entity.js'],
    entitiesTs: ['src/**/*.entity.ts'],
    dbName: process.env.DB_NAME || 'VuelosApp',
    driver: MySqlDriver,
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'root',
    password : process.env.DB_PASSWORD || '',
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
    //await generator.dropSchema();*/
    //await generator.updateSchema({safe: true});
    console.log('Esquema actualizado');
}