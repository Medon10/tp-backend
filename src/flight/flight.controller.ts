import { Request, Response } from "express";
import { orm } from "../shared/bdd/orm.js";
import { Flight } from "./flight.entity.js";
import { Destiny } from "../destiny/destiny.entity.js";

// --- Lógica de Precios Dinámicos ---
const DISTANCIAS: { [key: string]: number } = {
  'Buenos Aires': 0, 'Venecia': 11000, 'Tierra del Fuego': 2800,
  'Pisos Picados': 9000, 'Kino Der Toten': 12000, 'Japón': 18500,
  'Grecia': 11500, 'Tailandia': 16500, 'Islandia': 13500, 'Perú': 3200,
  'Australia': 13800, 'Egipto': 11800, 'Nueva Zelanda': 11500,
  'Marruecos': 9500, 'Noruega': 13000, 'Roma': 11000
};

function calcularPrecio(flight: Flight, origen: string = 'Buenos Aires'): number {
  let precioFinal = flight.montoVuelo;
  const distanciaDestino = DISTANCIAS[flight.destino.nombre] || 10000;
  const distanciaTotal = Math.abs(distanciaDestino - (DISTANCIAS[origen] || 0));
  
  precioFinal += distanciaTotal * 0.05;

  const ocupacion = (flight.cantidad_asientos - (flight as any).capacidad_restante) / flight.cantidad_asientos;
  if (ocupacion >= 0.8) precioFinal *= 1.5;
  else if (ocupacion >= 0.6) precioFinal *= 1.3;
  else if (ocupacion >= 0.4) precioFinal *= 1.15;

  const diasHastaVuelo = (new Date(flight.fechahora_salida).getTime() - Date.now()) / (1000 * 60 * 60 * 24);
  if (diasHastaVuelo <= 7) precioFinal *= 1.4;
  else if (diasHastaVuelo <= 30) precioFinal *= 1.3;
  else if (diasHastaVuelo <= 60) precioFinal *= 1.2;

  return Math.round(precioFinal);
}

// --- Controladores de Rutas ---

async function findAll(req: Request, res: Response) {
  try {
    const em = orm.em.fork();
    const flights = await em.find(Flight, {}, { populate: ['destino'] });
    const flightsConPrecio = flights.map(f => ({ ...f, montoVuelo: calcularPrecio(f) }));
    res.json({ data: flightsConPrecio });
  } catch (error) { res.status(500).json({ message: 'Error al obtener vuelos' }); }
}

async function findOne(req: Request, res: Response) {
  try {
    const em = orm.em.fork();
    const flight = await em.findOne(Flight, { id: Number(req.params.id) }, { populate: ['destino'] });
    if (!flight) return res.status(404).send({ message: 'No encontrado' });
    flight.montoVuelo = calcularPrecio(flight);
    res.json({ data: flight });
  } catch (error) { res.status(500).json({ message: 'Error al obtener vuelo' }); }
}

async function findByDestino(req: Request, res: Response) {
  try {
    const em = orm.em.fork();
    const flights = await em.find(Flight, { destino: Number(req.params.destinoId), fechahora_salida: { $gte: new Date() } }, { populate: ['destino'], orderBy: { fechahora_salida: 'ASC' } });
    const flightsConPrecio = flights.map(f => ({ ...f, montoVuelo: calcularPrecio(f) }));
    res.status(200).json({ data: flightsConPrecio });
  } catch (error: any) { res.status(500).json({ message: error.message }); }
}

async function buscarVuelos(req: Request, res: Response) {
  try {
    const em = orm.em.fork();
    const { presupuesto, personas, origen, fecha_salida } = req.body;

    if (!presupuesto || !personas || !origen || !fecha_salida) {
      return res.status(400).json({ message: 'Faltan parámetros' });
    }

    const fechaBusqueda = new Date(fecha_salida);
    const fechaInicio = new Date(fechaBusqueda);
    fechaInicio.setUTCHours(0, 0, 0, 0);
    const fechaFin = new Date(fechaBusqueda);
    fechaFin.setUTCHours(23, 59, 59, 999);

    const flights = await em.find(Flight, {
      capacidad_restante: { $gte: personas },
      fechahora_salida: { $gte: fechaInicio, $lte: fechaFin } // Corregido aquí
    }, { populate: ['destino'] });

    const vuelosConPrecio = flights
      .map(flight => {
        const precioPorPersona = calcularPrecio(flight, origen);
        return {
          ...flight, // Devolvemos el vuelo completo
          precio_por_persona: precioPorPersona,
          precio_total: precioPorPersona * Number(personas),
        };
      })
      .filter(vuelo => vuelo.precio_total <= presupuesto)
      .sort((a, b) => a.precio_total - b.precio_total);

    res.status(200).json({ data: vuelosConPrecio });
  } catch (error: any) {
    console.error('Error al buscar vuelos:', error);
    res.status(500).json({ message: error.message });
  }
}

// Funciones de Admin (no necesitan cálculo de precio, ya que guardan el precio base)
async function add(req: Request, res: Response) { /* ...tu código original... */ }
async function update(req: Request, res: Response) { /* ...tu código original... */ }
async function remove(req: Request, res: Response) { /* ...tu código original... */ }

export { findAll, findOne, add, update, remove, findByDestino, buscarVuelos };