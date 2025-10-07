import { Request, Response } from "express";
import { orm } from "../shared/bdd/orm.js";
import { Favorite } from "./favorite.entity.js";
import { Flight } from "../flight/flight.entity.js";

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

    res.status(200).json({
      message: 'Favoritos encontrados',
      cantidad: favorites.length,
      data: favorites
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