/* test unitario para calcularPrecio()
 *
 * Testeamos la función pura calcularPrecio() que calcula el precio
 * dinámico de un vuelo en base a 3 factores:
 *   1. Distancia (distancia_km * 0.10 sumado al monto base)
 *   2. Ocupación del vuelo (multiplicador según % de asientos vendidos)
 *   3. Anticipación (multiplicador según días hasta la fecha de salida)
 *
 * Usamos objetos planos casteados como Flight para evitar dependencias
 * de MikroORM, manteniendo el test completamente aislado (sin BD).
 */

import { describe, it, expect, vi, afterEach } from 'vitest';
import { calcularPrecio } from '../../src/shared/utils/precio.js';
import type { Flight } from '../../src/flight/flight.entity.js';

// ── Helpers ──────────────────────────────────────────────────────

/**
 * Crea un objeto Flight parcial con valores por defecto razonables.
 * Solo incluye los campos que calcularPrecio() realmente usa.
 * Se castea a Flight para satisfacer el tipado sin instanciar la entidad ORM.
 */
function crearFlight(overrides: Partial<{
  montoVuelo: number;
  distancia_km: number | undefined;
  cantidad_asientos: number;
  capacidad_restante: number;
  fechahora_salida: Date;
}> = {}): Flight {
  return {
    montoVuelo: 1000,
    distancia_km: undefined,         // Sin distancia por defecto
    cantidad_asientos: 100,
    capacidad_restante: 100,         // 0% ocupación por defecto
    fechahora_salida: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000), // 90 días en el futuro (sin factor anticipación)
    ...overrides,
  } as unknown as Flight;
}

/**
 * Helper para generar una fecha N días en el futuro desde "ahora".
 * Usamos un Date.now() mockeado para resultados deterministas.
 */
function diasEnElFuturo(dias: number): Date {
  return new Date(Date.now() + dias * 24 * 60 * 60 * 1000);
}

// Fijamos Date.now() para tests de anticipación deterministas 
const NOW = new Date('2026-03-01T12:00:00Z').getTime();

afterEach(() => {
  vi.restoreAllMocks();
});

// Tests

describe('calcularPrecio()', () => {

  //  1. Precio base sin factores adicionales 
  describe('Precio base (sin factores adicionales)', () => {
    /**
     * Escenario: vuelo con monto $1000, sin distancia, 0% ocupación,
     * fecha lejana (90 días). Ningún factor se activa.
     * Resultado esperado: precioPorPersona = 1000, precioTotal = 1000.
     */
    it('devuelve el monto base cuando no aplica ningún factor', () => {
      const flight = crearFlight();
      const resultado = calcularPrecio(flight, 'Buenos Aires', 1);

      expect(resultado.precioPorPersona).toBe(1000);
      expect(resultado.precioTotal).toBe(1000);
    });

    /**
     * Escenario: monto base distinto ($500).
     * Verifica que el cálculo parte siempre de montoVuelo.
     */
    it('respeta el montoVuelo como precio de partida', () => {
      const flight = crearFlight({ montoVuelo: 500 });
      const resultado = calcularPrecio(flight, 'Córdoba', 1);

      expect(resultado.precioPorPersona).toBe(500);
    });
  });

  // 2. Factor distancia 
  describe('Factor distancia', () => {
    /**
     * Fórmula: precioFinal += distancia_km * 0.10
     * Con montoVuelo=1000 y distancia_km=500:
     *   1000 + (500 * 0.10) = 1000 + 50 = 1050
     */
    it('suma distancia_km * 0.10 al precio base', () => {
      const flight = crearFlight({ distancia_km: 500 });
      const resultado = calcularPrecio(flight, 'Buenos Aires', 1);

      expect(resultado.precioPorPersona).toBe(1050);
    });

    /**
     * Con distancia_km=2000:
     *   1000 + (2000 * 0.10) = 1000 + 200 = 1200
     */
    it('escala linealmente con distancias mayores', () => {
      const flight = crearFlight({ distancia_km: 2000 });
      const resultado = calcularPrecio(flight, 'Buenos Aires', 1);

      expect(resultado.precioPorPersona).toBe(1200);
    });

    /**
     * Sin distancia_km (undefined), no se suma nada.
     */
    it('no aplica incremento si distancia_km es undefined', () => {
      const flight = crearFlight({ distancia_km: undefined });
      const resultado = calcularPrecio(flight, 'Buenos Aires', 1);

      expect(resultado.precioPorPersona).toBe(1000);
    });
  });

  // 3. Factor ocupación
  describe('Factor ocupación', () => {
    /**
     * Fórmula: % ocupación = (asientos_totales - capacidad_restante) / asientos_totales * 100
     *
     * Multiplicadores:
     *   ≥80% → ×1.5
     *   ≥60% → ×1.3
     *   ≥40% → ×1.15
     *   <40% → ×1.0 (sin cambio)
     */

    it('no aplica multiplicador con ocupación < 40%', () => {
      // 100 asientos, 70 restantes → 30% ocupación
      const flight = crearFlight({ cantidad_asientos: 100, capacidad_restante: 70 });
      const resultado = calcularPrecio(flight, 'Buenos Aires', 1);

      expect(resultado.precioPorPersona).toBe(1000);
    });

    it('aplica ×1.15 con ocupación ≥ 40%', () => {
      // 100 asientos, 60 restantes → 40% ocupación
      const flight = crearFlight({ cantidad_asientos: 100, capacidad_restante: 60 });
      const resultado = calcularPrecio(flight, 'Buenos Aires', 1);

      // 1000 * 1.15 = 1150
      expect(resultado.precioPorPersona).toBe(1150);
    });

    it('aplica ×1.3 con ocupación ≥ 60%', () => {
      // 100 asientos, 40 restantes → 60% ocupación
      const flight = crearFlight({ cantidad_asientos: 100, capacidad_restante: 40 });
      const resultado = calcularPrecio(flight, 'Buenos Aires', 1);

      // 1000 * 1.3 = 1300
      expect(resultado.precioPorPersona).toBe(1300);
    });

    it('aplica ×1.5 con ocupación ≥ 80%', () => {
      // 100 asientos, 20 restantes → 80% ocupación
      const flight = crearFlight({ cantidad_asientos: 100, capacidad_restante: 20 });
      const resultado = calcularPrecio(flight, 'Buenos Aires', 1);

      // 1000 * 1.5 = 1500
      expect(resultado.precioPorPersona).toBe(1500);
    });

    it('aplica ×1.5 con ocupación al 95% (límite alto)', () => {
      // 100 asientos, 5 restantes → 95% ocupación
      const flight = crearFlight({ cantidad_asientos: 100, capacidad_restante: 5 });
      const resultado = calcularPrecio(flight, 'Buenos Aires', 1);

      expect(resultado.precioPorPersona).toBe(1500);
    });
  });

  // 4. Factor anticipación
  describe('Factor anticipación', () => {
    /**
     * Multiplicadores según días hasta el vuelo:
     *   ≤7 días  → ×1.4  (compra de último momento)
     *   ≤30 días → ×1.3
     *   ≤60 días → ×1.2
     *   >60 días → ×1.0  (sin recargo)
     *
     * Mockeamos Date.now() para tener resultados deterministas.
     */

    it('no aplica multiplicador con +60 días de anticipación', () => {
      vi.spyOn(Date, 'now').mockReturnValue(NOW);
      const flight = crearFlight({
        fechahora_salida: new Date(NOW + 90 * 24 * 60 * 60 * 1000), // 90 días
      });
      const resultado = calcularPrecio(flight, 'Buenos Aires', 1);

      expect(resultado.precioPorPersona).toBe(1000);
    });

    it('aplica ×1.2 con ≤60 días de anticipación', () => {
      vi.spyOn(Date, 'now').mockReturnValue(NOW);
      const flight = crearFlight({
        fechahora_salida: new Date(NOW + 45 * 24 * 60 * 60 * 1000), // 45 días
      });
      const resultado = calcularPrecio(flight, 'Buenos Aires', 1);

      // 1000 * 1.2 = 1200
      expect(resultado.precioPorPersona).toBe(1200);
    });

    it('aplica ×1.3 con ≤30 días de anticipación', () => {
      vi.spyOn(Date, 'now').mockReturnValue(NOW);
      const flight = crearFlight({
        fechahora_salida: new Date(NOW + 20 * 24 * 60 * 60 * 1000), // 20 días
      });
      const resultado = calcularPrecio(flight, 'Buenos Aires', 1);

      // 1000 * 1.3 = 1300
      expect(resultado.precioPorPersona).toBe(1300);
    });

    it('aplica ×1.4 con ≤7 días de anticipación (último momento)', () => {
      vi.spyOn(Date, 'now').mockReturnValue(NOW);
      const flight = crearFlight({
        fechahora_salida: new Date(NOW + 3 * 24 * 60 * 60 * 1000), // 3 días
      });
      const resultado = calcularPrecio(flight, 'Buenos Aires', 1);

      // 1000 * 1.4 = 1400
      expect(resultado.precioPorPersona).toBe(1400);
    });

    it('aplica ×1.2 en el límite exacto de 60 días', () => {
      vi.spyOn(Date, 'now').mockReturnValue(NOW);
      const flight = crearFlight({
        fechahora_salida: new Date(NOW + 60 * 24 * 60 * 60 * 1000), // exactamente 60 días
      });
      const resultado = calcularPrecio(flight, 'Buenos Aires', 1);

      // 1000 * 1.2 = 1200
      expect(resultado.precioPorPersona).toBe(1200);
    });
  });

  // 5. Cálculo de precioTotal con múltiples personas 
  describe('precioTotal con múltiples personas', () => {
    /**
     * precioTotal = precioPorPersona * personas
     * El precio por persona no cambia con la cantidad de personas.
     */

    it('multiplica precioPorPersona por la cantidad de personas', () => {
      const flight = crearFlight();
      const resultado = calcularPrecio(flight, 'Buenos Aires', 4);

      expect(resultado.precioPorPersona).toBe(1000);
      expect(resultado.precioTotal).toBe(4000); // 1000 * 4
    });

    it('devuelve precioTotal = precioPorPersona para 1 persona (default)', () => {
      const flight = crearFlight();
      const resultado = calcularPrecio(flight, 'Buenos Aires');

      expect(resultado.precioTotal).toBe(resultado.precioPorPersona);
    });

    it('calcula correctamente con 7 personas y distancia', () => {
      const flight = crearFlight({ distancia_km: 1000 });
      const resultado = calcularPrecio(flight, 'Buenos Aires', 7);

      // 1000 + (1000 * 0.10) = 1100 por persona
      expect(resultado.precioPorPersona).toBe(1100);
      expect(resultado.precioTotal).toBe(7700); // 1100 * 7
    });
  });

  // 6. Combinación de todos los factores
  describe('Combinación de múltiples factores', () => {
    /**
     * Escenario completo: todos los factores activos simultáneamente.
     *
     * Datos:
     *   - montoVuelo = 1000
     *   - distancia_km = 500 → +50 → precio parcial = 1050
     *   - 100 asientos, 30 restantes → 70% ocupación → ×1.3 → 1050 * 1.3 = 1365
     *   - 20 días hasta vuelo → ≤30 días → ×1.3 → 1365 * 1.3 = 1774.5 → Math.round = 1775
     *   - 3 personas → precioTotal = 1775 * 3 = 5325
     */
    it('aplica distancia + ocupación + anticipación + personas correctamente', () => {
      vi.spyOn(Date, 'now').mockReturnValue(NOW);

      const flight = crearFlight({
        montoVuelo: 1000,
        distancia_km: 500,
        cantidad_asientos: 100,
        capacidad_restante: 30,   // 70% ocupación → ×1.3
        fechahora_salida: new Date(NOW + 20 * 24 * 60 * 60 * 1000), // 20 días → ×1.3
      });

      const resultado = calcularPrecio(flight, 'Buenos Aires', 3);

      // Cálculo paso a paso:
      // 1. Base:       1000
      // 2. Distancia:  1000 + 50 = 1050
      // 3. Ocupación:  1050 * 1.3 = 1365
      // 4. Anticipación: 1365 * 1.3 = 1774.5 → Math.round = 1775
      expect(resultado.precioPorPersona).toBe(1775);
      expect(resultado.precioTotal).toBe(5325); // 1775 * 3
    });

    /**
     * Escenario máximo: todos los multiplicadores en su valor más alto.
     *
     * Datos:
     *   - montoVuelo = 2000
     *   - distancia_km = 3000 → +300 → 2300
     *   - 200 asientos, 10 restantes → 95% ocupación → ×1.5 → 2300 * 1.5 = 3450
     *   - 5 días → ≤7 días → ×1.4 → 3450 * 1.4 = 4830
     *   - 2 personas → precioTotal = 4830 * 2 = 9660
     */
    it('aplica multiplicadores máximos combinados', () => {
      vi.spyOn(Date, 'now').mockReturnValue(NOW);

      const flight = crearFlight({
        montoVuelo: 2000,
        distancia_km: 3000,
        cantidad_asientos: 200,
        capacidad_restante: 10,   // 95% ocupación → ×1.5
        fechahora_salida: new Date(NOW + 5 * 24 * 60 * 60 * 1000), // 5 días → ×1.4
      });

      const resultado = calcularPrecio(flight, 'Córdoba', 2);

      // 2000 + 300 = 2300 → * 1.5 = 3450 → * 1.4 = 4830
      expect(resultado.precioPorPersona).toBe(4830);
      expect(resultado.precioTotal).toBe(9660);
    });
  });
});
