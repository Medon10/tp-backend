/**
 *
 * Este test verifica el endpoint GET /api/destinies de la API Express
 * sin necesidad de conexión real a MySQL. Se mockean:
 *
 *   1. El módulo ORM (shared/bdd/orm.ts) → top-level await con
 *      MikroORM.init() nunca se ejecuta; el EntityManager devuelve
 *      datos de ejemplo mediante vi.mock().
 *
 *   2. RequestContext de @mikro-orm/core → el middleware de la app
 *      simplemente llama next() en vez de crear un scope real.
 *
 * Se usa Supertest para hacer requests HTTP contra la instancia
 * Express exportada desde app.ts (sin llamar a .listen()).
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import request from 'supertest';

// Datos y funciones mock (hoisted antes de vi.mock)
const { mockDestinos, mockFind } = vi.hoisted(() => {
  const mockDestinos = [
    {
      id: 1,
      nombre: 'Bariloche',
      imagen: 'bariloche.jpg',
      transporte: ['avion', 'bus'],
      actividades: ['ski', 'trekking'],
      createdAt: new Date('2026-01-01'),
      updatedAt: new Date('2026-01-01'),
    },
    {
      id: 2,
      nombre: 'Cancún',
      imagen: 'cancun.jpg',
      transporte: ['avion'],
      actividades: ['playa', 'buceo'],
      createdAt: new Date('2026-01-15'),
      updatedAt: new Date('2026-01-15'),
    },
    {
      id: 3,
      nombre: 'Roma',
      imagen: 'roma.jpg',
      transporte: ['avion'],
      actividades: ['turismo', 'gastronomía'],
      createdAt: new Date('2026-02-01'),
      updatedAt: new Date('2026-02-01'),
    },
  ];

  const mockFind = vi.fn().mockResolvedValue(mockDestinos);
  return { mockDestinos, mockFind };
});

// Mock del módulo ORM 
// Reemplaza el top-level await de MikroORM.init() por un objeto
// fake que expone em.fork() devolviendo un EntityManager simulado.
vi.mock('../../src/shared/bdd/orm.js', () => ({
  orm: {
    em: {
      fork: () => ({
        find: mockFind,
        findOne: vi.fn(),
        create: vi.fn(),
        flush: vi.fn(),
        assign: vi.fn(),
        removeAndFlush: vi.fn(),
      }),
    },
  },
  syncSchema: vi.fn().mockResolvedValue(undefined),
}));

// Mock parcial de @mikro-orm/core 
// Preserva los decoradores reales (Entity, Property, etc.) que
// necesitan las entidades al ser importadas, pero reemplaza
// RequestContext.create para que simplemente llame next().
vi.mock('@mikro-orm/core', async (importOriginal) => {
  const actual: Record<string, unknown> = await importOriginal();
  return {
    ...actual,
    RequestContext: {
      create: (_em: unknown, next: () => void) => next(),
    },
  };
});

// Importar app DESPUÉS de los mocks 
// Vitest hoistea vi.mock() al top, pero el import dinámico
// garantiza que app.ts se cargue con los módulos ya mockeados.
const { app } = await import('../../src/app.js');

// Tests

describe('GET /api/destinies', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockFind.mockResolvedValue(mockDestinos);
  });

  // Status 200 
  it('responde con status 200', async () => {
    const res = await request(app).get('/api/destinies');
    expect(res.status).toBe(200);
  });

  // Body es un array 
  it('el body contiene un array de destinos en la propiedad "data"', async () => {
    const res = await request(app).get('/api/destinies');

    expect(res.body).toHaveProperty('data');
    expect(Array.isArray(res.body.data)).toBe(true);
  });

  // Cantidad de elementos
  it('devuelve la cantidad correcta de destinos', async () => {
    const res = await request(app).get('/api/destinies');

    expect(res.body.data).toHaveLength(mockDestinos.length);
  });

  // Propiedades esperadas 
  // La entidad Destiny tiene: id, nombre, imagen, transporte, actividades
  // (BaseEntity aporta id, createdAt, updatedAt)
  it('cada destino tiene las propiedades esperadas (id, nombre, imagen, transporte, actividades)', async () => {
    const res = await request(app).get('/api/destinies');

    for (const destino of res.body.data) {
      expect(destino).toHaveProperty('id');
      expect(destino).toHaveProperty('nombre');
      expect(destino).toHaveProperty('imagen');
      expect(destino).toHaveProperty('transporte');
      expect(destino).toHaveProperty('actividades');
    }
  });

  // Valores coinciden con los datos mockeados
  it('los valores devueltos coinciden con los datos de la base (mock)', async () => {
    const res = await request(app).get('/api/destinies');

    const primero = res.body.data[0];
    expect(primero.id).toBe(mockDestinos[0].id);
    expect(primero.nombre).toBe(mockDestinos[0].nombre);
    expect(primero.imagen).toBe(mockDestinos[0].imagen);
    expect(primero.transporte).toEqual(mockDestinos[0].transporte);
    expect(primero.actividades).toEqual(mockDestinos[0].actividades);
  });

  // Content-Type JSON 
  it('responde con Content-Type application/json', async () => {
    const res = await request(app).get('/api/destinies');

    expect(res.headers['content-type']).toMatch(/application\/json/);
  });

  //Array vacío cuando no hay destinos 
  it('devuelve array vacío si no hay destinos en la DB', async () => {
    mockFind.mockResolvedValueOnce([]);

    const res = await request(app).get('/api/destinies');

    expect(res.status).toBe(200);
    expect(res.body.data).toEqual([]);
  });

  //Error 500 cuando falla la DB 
  it('responde con 500 si el EntityManager lanza un error', async () => {
    mockFind.mockRejectedValueOnce(new Error('DB connection lost'));

    const res = await request(app).get('/api/destinies');

    expect(res.status).toBe(500);
    expect(res.body).toHaveProperty('message');
  });
});
