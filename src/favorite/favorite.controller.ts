import { Request, Response } from "express";
import { orm } from "../shared/bdd/orm.js";
import { Favorite } from "./favorite.entity.js";
import { Flight } from "../flight/flight.entity.js";
import { calcularPrecio } from "../shared/utils/precio.js";

// Obtener favoritos del usuario autenticado
async function findUserFavorites(req: Request, res: Response) {
  try {
    const em = orm.em.fork();
    const userId = (req as any).user.id;

    console.log('Buscando favoritos para usuario:', userId);

    const favorites = await em.find(
      Favorite,
      { user: userId },
      { 
        populate: ['flight', 'flight.destino'],
        orderBy: { createdAt: 'DESC' }
      }
    );

    console.log('Favoritos encontrados:', favorites.length);

    // Filtrar favoritos válidos y calcular precios
    const favoritosConPrecio = favorites
      .filter(fav => {
        // Verificar que el vuelo existe y está poblado
        if (!fav.flight) {
          console.warn('⚠️ Favorito sin vuelo:', fav.id);
          return false;
        }
        return true;
      })
      .map(fav => {
        try {
          const flight = fav.flight;
          const origen = flight.origen || 'Buenos Aires';

          console.log('Calculando precio para vuelo:', flight.id);

          const { precioPorPersona } = calcularPrecio(flight, origen, 1);

          return {
            id: fav.id,
            fecha_guardado: fav.createdAt,
            vuelo: {
              id: flight.id,
              origen: flight.origen,
              destino: flight.destino ? {
                id: flight.destino.id,
                nombre: flight.destino.nombre,
                imagen: flight.destino.imagen,
                transporte: flight.destino.transporte || [],
                actividades: flight.destino.actividades || []
              } : null,
              fechahora_salida: flight.fechahora_salida,
              fechahora_llegada: flight.fechahora_llegada,
              aerolinea: flight.aerolinea,
              duracion: flight.duracion,
              capacidad_restante: flight.capacidad_restante || 0,
              precio_por_persona: precioPorPersona,
              distancia_aproximada: flight.distancia_km || 0
            }
          };
        } catch (error) {
          console.error('Error al procesar favorito:', fav.id, error);
          return null;
        }
      })
      .filter(fav => fav !== null); // Remover favoritos con errores

    console.log('Enviando respuesta con', favoritosConPrecio.length, 'favoritos');

    res.status(200).json({
      message: 'Favoritos encontrados',
      cantidad: favoritosConPrecio.length,
      data: favoritosConPrecio
    });
  } catch (error: any) {
    console.error('Error en findUserFavorites:', error);
    console.error('Stack:', error.stack);
    res.status(500).json({ 
      message: error.message,
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
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