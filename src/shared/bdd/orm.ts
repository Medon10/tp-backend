import { MikroORM } from '@mikro-orm/core';
import { SqlHighlighter } from '@mikro-orm/sql-highlighter';
import { MySqlDriver } from '@mikro-orm/mysql';

const shouldUseTls = process.env.DB_SSL !== 'false';
const rejectUnauthorized = process.env.DB_SSL_REJECT_UNAUTHORIZED !== 'false';

const normalizeCaCert = (rawCert: string | undefined): string | undefined => {
    if (!rawCert) return undefined;

    const normalized = rawCert.replace(/\\n/g, '\n').trim();
    if (!normalized) return undefined;

    // Accept both full PEM and plain base64 body.
    if (normalized.includes('BEGIN CERTIFICATE')) {
        return normalized;
    }

    const chunks = normalized.match(/.{1,64}/g) ?? [normalized];
    return `-----BEGIN CERTIFICATE-----\n${chunks.join('\n')}\n-----END CERTIFICATE-----`;
};

const caCert = normalizeCaCert(process.env.DB_SSL_CA);

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