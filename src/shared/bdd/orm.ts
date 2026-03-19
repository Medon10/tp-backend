import { MikroORM } from '@mikro-orm/core';
import { SqlHighlighter } from '@mikro-orm/sql-highlighter';
import { MySqlDriver } from '@mikro-orm/mysql';

const shouldUseTls = process.env.DB_SSL !== 'false';
const rejectUnauthorized = process.env.DB_SSL_REJECT_UNAUTHORIZED !== 'false';
const caCert = process.env.DB_SSL_CA?.replace(/\\n/g, '\n');

export const orm = await MikroORM.init({
    entities: ['dist/**/*.entity.js'],
    entitiesTs: ['src/**/*.entity.ts'],
    driver: MySqlDriver,
    clientUrl: process.env.DB_URL || '',
    driverOptions: shouldUseTls
        ? {
            connection: {
                ssl: {
                    minVersion: 'TLSv1.2',
                    rejectUnauthorized,
                    ...(caCert ? { ca: caCert } : {}),
                },
            },
        }
        : {},
    debug: false,
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