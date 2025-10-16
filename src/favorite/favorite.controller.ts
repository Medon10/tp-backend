import { Request, Response } from "express";
import { orm } from "../shared/bdd/orm.js";
import { Favorite } from "./favorite.entity.js";
import { Flight } from "../flight/flight.entity.js";

// Se añade la lógica de cálculo de precios para ser usada en esta sección.
const DISTANCIAS: { [key: string]: number } = {
  'Buenos Aires': 0,
  'Venecia': 11000,
  'Tierra del Fuego': 2800,
  'Pisos Picados': 1500,
  'Kino Der Toten': 12000,
  'Japón': 18500,
  'Grecia': 11500,
  'Tailandia': 16500,
  'Islandia': 13500,
  'Perú': 3200,
  'Australia': 13800,
  'Egipto': 11800,
  'Nueva Zelanda': 11500,
  'Marruecos': 9500,
  'Noruega': 13000
};

function calcularPrecio(flight: Flight, origen: string = 'Buenos Aires'): number {
  let precioFinal = flight.montoVuelo ?? 500;
  const distanciaDestino = DISTANCIAS[flight.destino.nombre] || 10000;
  const distanciaTotal = Math.abs(distanciaDestino - (DISTANCIAS[origen] || 0));
  
  precioFinal += distanciaTotal * 0.05;

  const ocupacion = (flight.cantidad_asientos - flight.capacidad_restante) / flight.cantidad_asientos;
  if (ocupacion >= 0.8) precioFinal *= 1.5;
  else if (ocupacion >= 0.6) precioFinal *= 1.3;
  else if (ocupacion >= 0.4) precioFinal *= 1.15;

  const diasHastaVuelo = (new Date(flight.fechahora_salida).getTime() - Date.now()) / (1000 * 60 * 60 * 24);
  if (diasHastaVuelo <= 7) precioFinal *= 1.4;
  else if (diasHastaVuelo <= 30) precioFinal *= 1.3;
  else if (diasHastaVuelo <= 60) precioFinal *= 1.2;

  return Math.round(precioFinal);
}


// Obtener favoritos del usuario autenticado
async function findUserFavorites(req: Request, res: Response) {
  try {
    const em = orm.em.fork();
    const userId = (req as any).user.id; // Del middleware de autenticación

    const favorites = await em.find(
      Favorite,
      { user: userId },
      { 
        populate: ['flight', 'flight.destino'],
        orderBy: { createdAt: 'DESC' }
      }
    );

    // Ahora se calcula el precio dinámico para cada vuelo favorito.
    const favoriteFlights = favorites.map(fav => {
      if (!fav.flight) return null;
      const precioCalculado = calcularPrecio(fav.flight);
      return { ...fav.flight, montoVuelo: precioCalculado };
    }).filter(Boolean);

    res.status(200).json({
      message: 'Favoritos encontrados',
      cantidad: favoriteFlights.length,
      data: favoriteFlights
    });
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
}

// Agregar a favoritos
async function addFavorite(req: Request, res: Response) {
  try {
    const em = orm.em.fork();
    const userId = (req as any).user.id;
    const { flight_id } = req.body.sanitizedInput;

    // Verificar si ya existe
    const existing = await em.findOne(Favorite, {
      user: userId,
      flight: flight_id
    });

    if (existing) {
      return res.status(409).json({ 
        message: 'Este vuelo ya está en favoritos' 
      });
    }

    // Verificar que el vuelo existe
    const flight = await em.findOne(Flight, { id: flight_id });
    if (!flight) {
      return res.status(404).json({ message: 'Vuelo no encontrado' });
    }

    const now = new Date();
    const favorite = em.create(Favorite, {
      user: userId,
      flight: flight_id,
      createdAt: now,
      updatedAt: now
    });

    await em.flush();

    res.status(201).json({
      message: 'Agregado a favoritos',
      data: favorite
    });
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
}

// Eliminar de favoritos
async function removeFavorite(req: Request, res: Response) {
  try {
    const em = orm.em.fork();
    const userId = (req as any).user.id;
    const flightId = Number.parseInt(req.params.flightId);

    const favorite = await em.findOne(Favorite, {
      user: userId,
      flight: flightId
    });

    if (!favorite) {
      return res.status(404).json({ 
        message: 'No está en favoritos' 
      });
    }

    await em.removeAndFlush(favorite);

    res.status(200).json({ 
      message: 'Eliminado de favoritos' 
    });
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
}

// Verificar si un vuelo está en favoritos
async function checkFavorite(req: Request, res: Response) {
  try {
    const em = orm.em.fork();
    const userId = (req as any).user.id;
    const flightId = Number.parseInt(req.params.flightId);

    const favorite = await em.findOne(Favorite, {
      user: userId,
      flight: flightId
    });

    res.status(200).json({
      isFavorite: !!favorite
    });
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
}

export { findUserFavorites, addFavorite, removeFavorite, checkFavorite };