import {Request, Response, NextFunction} from "express"
import { orm } from '../shared/bdd/orm.js'
import { Reservation } from "./reservation.entity.js"
import { User } from "../user/user.entity.js";
import { Flight } from "../flight/flight.entity.js"; 
import { LockMode } from "@mikro-orm/core"; 
import { calcularPrecio } from "../shared/utils/precio.js";

async function findAll (req:Request, res:Response) {
    try {
        const em = orm.em.fork();
        const reservations = await em.find(Reservation, {})
        res.status(200).json({message: 'Reservas encontradas', data: reservations})
    } catch (error: any) {
        res.status(500).json({message: 'Error al obtener reservas', error})
    }
}

async function findOne(req: Request, res: Response) {
    try {
        const em = orm.em.fork();
        const id = Number(req.params.id)
        const reservation = await em.findOne(Reservation, { id })
        if (!reservation){
            return res.status(404).send({message:'No encontrado'})
        }
        res.status(200).json({message: 'Reserva encontrada', data: reservation})
    } catch (error: any) {
        res.status(500).json({message: 'Error al obtener reserva', error})
    }
}

async function add(req: Request, res: Response) {
  try {
    const em = orm.em.fork();
    const userId = (req as any).user.id;
    const { flight_id, cantidad_personas } = req.body.sanitizedInput;

    // Validaciones
    if (!flight_id || !cantidad_personas) {
      return res.status(400).json({
        message: 'ID de vuelo y cantidad de personas son requeridos'
      });
    }

    if (cantidad_personas < 1 || cantidad_personas > 10) {
      return res.status(400).json({
        message: 'La cantidad de personas debe estar entre 1 y 10'
      });
    }

    // Verificar que el vuelo existe
    const flight = await em.findOne(
      Flight,
      { id: flight_id },
      { populate: ['destino'] }
    );

    if (!flight) {
      return res.status(404).json({ message: 'Vuelo no encontrado' });
    }

    // Verificar disponibilidad
    if (flight.capacidad_restante < cantidad_personas) {
      return res.status(400).json({
        message: `No hay suficientes asientos disponibles. Quedan ${flight.capacidad_restante} asientos.`
      });
    }

    // Verificar que el vuelo sea futuro
    const fechaVuelo = new Date(flight.fechahora_salida);
    if (fechaVuelo < new Date()) {
      return res.status(400).json({
        message: 'No se puede reservar un vuelo que ya partió'
      });
    }


    const precioCalc = calcularPrecio(flight, flight.origen, cantidad_personas);
    const precio_total = precioCalc.precioTotal; 

    // Crear reserva (pendiente de pago)
    const reservation = em.create(Reservation, {
      usuario: em.getReference(User, userId),
      flight: flight,
      cantidad_personas,
      valor_reserva: precio_total,
      estado: 'pendiente',
      fecha_reserva: new Date().toISOString(),
      createdAt: new Date(),
      updatedAt: new Date()
    });

    await em.flush();

    res.status(201).json({
      message: 'Reserva creada exitosamente',
      data: {
        id: reservation.id,
        vuelo: {
          id: flight.id,
          origen: flight.origen,
          destino: flight.destino.nombre,
          fecha_salida: flight.fechahora_salida
        },
        cantidad_personas: reservation.cantidad_personas,
        precio_total: reservation.valor_reserva,
        estado: reservation.estado
      }
    });

  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
}

async function findUserReservations(req: Request, res: Response) {
  try {
    const em = orm.em.fork();
    const userId = (req as any).user.id;

 // 1. La consulta ahora carga todas las relaciones anidadas que necesitamos.
    const reservations = await em.find(
      Reservation,
      { usuario: userId },
      { 
        populate: ['flight.destino'], 
        orderBy: { createdAt: 'DESC' }
      }
    );

    // 2. Mapeamos manualmente los datos para crear un objeto limpio y seguro para el frontend.
    const now = new Date();
    const responseData = reservations.map(reservation => {
      // Casteamos para poder acceder a las propiedades cargadas
      const flight = reservation.flight as any;

      // Si por alguna razón una reserva no tiene vuelo o destino, la ignoramos para evitar errores.
      if (!flight || !flight.destino) {
        return null;
      }

      const fechaVuelo = new Date(flight.fechahora_salida);
      const isPast = fechaVuelo < now;
      
      // Creamos el objeto con la estructura exacta que el frontend espera.
      return {
        id: reservation.id,
        fecha_reserva: reservation.fecha_reserva,
        valor_reserva: reservation.valor_reserva,
        estado: reservation.estado,
        cantidad_personas: reservation.cantidad_personas,
        isPast: isPast,
        canCancel: !isPast && reservation.estado !== 'cancelado' && reservation.estado !== 'completado',
        flight: {
          id: flight.id,
          origen: flight.origen,
          fechahora_salida: flight.fechahora_salida,
          fechahora_llegada: flight.fechahora_llegada,
          aerolinea: flight.aerolinea,
          destino: {
            id: flight.destino.id,
            nombre: flight.destino.nombre,
            imagen: flight.destino.imagen
          }
        }
      };
    }).filter(Boolean);

    res.status(200).json({
      message: 'Reservas encontradas',
      cantidad: responseData.length,
      data: responseData
    });
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
}



async function update(req: Request,res: Response) {
    try {
        const em = orm.em.fork();
        const id = Number(req.params.id)
        const reservation = await em.findOne(Reservation, { id })
        if (!reservation) {
            return res.status(404).send({ message: 'reserva no encontrada' })
        }
        em.assign(reservation, req.body.sanitizedInput)
        await em.flush()
        res.status(200).send({ message: 'reserva actualizada', data: reservation })
    } catch (error: any) {
        res.status(500).json({ message: 'Error al actualizar reserva', error })
    }
}

async function remove(req: Request, res: Response){
    try {
        const em = orm.em.fork();
        const id = Number(req.params.id)
        const reservation = await em.findOne(Reservation, { id })
        if (!reservation) {
            return res.status(404).send({ message: 'reserva no encontrada' })
        }
        await em.removeAndFlush(reservation)
        res.status(200).send({ message: 'reserva borrada' })
    } catch (error: any) {
        res.status(500).json({ message: 'Error al borrar viaje', error })
    }
}

// Cancelar una reserva
async function cancelReservation(req: Request, res: Response) {
  try {
    const em = orm.em.fork();
    const userId = (req as any).user.id;
    const reservationId = Number(req.params.id);

    const reservation = await em.findOne(
      Reservation,
      { id: reservationId, usuario: userId },
      { populate: ['flight'] }
    );

    if (!reservation) {
      return res.status(404).json({ message: 'Reserva no encontrada' });
    }

    // Verificar que la reserva se pueda cancelar
    if (reservation.estado === 'cancelado') {
      return res.status(400).json({ message: 'La reserva ya está cancelada' });
    }

    if (reservation.estado === 'completado') {
      return res.status(400).json({ message: 'No se puede cancelar un viaje completado' });
    }

    // Verificar que el vuelo no haya pasado
    const fechaVuelo = new Date((reservation.flight as any).fechahora_salida);
    if (fechaVuelo < new Date()) {
      return res.status(400).json({ message: 'No se puede cancelar un viaje que ya pasó' });
    }

    reservation.estado = 'cancelado';
    reservation.updatedAt = new Date();
    await em.flush();

    res.status(200).json({ 
      message: 'Reserva cancelada exitosamente',
      data: reservation
    });
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
}

export { findAll, findOne, add, update, remove, findUserReservations, cancelReservation };