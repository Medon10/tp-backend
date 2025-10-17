import {Request, Response, NextFunction} from "express"
import { orm } from '../shared/bdd/orm.js'
import { Reservation } from "./reservation.entity.js"
import { User } from "../user/user.entity.js";
import { Flight } from "../flight/flight.entity.js"; 
import { LockMode } from "@mikro-orm/core"; 
import { DISTANCIAS } from "../shared/utils/precio.js";

function calcularPrecio(flight: Flight, origen: string): number {
  let precioFinal = flight.montoVuelo ?? 500;
  const distanciaDestino = DISTANCIAS[flight.destino.nombre] || 10000;
  const distanciaTotal = Math.abs(distanciaDestino - (DISTANCIAS[origen] || 0));
  precioFinal += distanciaTotal * 0.05;

  const cantidadAsientos = Number(flight.cantidad_asientos) || 0;
  const capacidadRestante = Number(flight.capacidad_restante) || 0;

  if (cantidadAsientos > 0) {
      const ocupacion = (cantidadAsientos - capacidadRestante) / cantidadAsientos;
      if (ocupacion >= 0.8) precioFinal *= 1.5;
      else if (ocupacion >= 0.6) precioFinal *= 1.3;
      else if (ocupacion >= 0.4) precioFinal *= 1.15;
  }

  const diasHastaVuelo = (new Date(flight.fechahora_salida).getTime() - Date.now()) / (1000 * 60 * 60 * 24);
  if (diasHastaVuelo <= 7) precioFinal *= 1.4;
  else if (diasHastaVuelo <= 30) precioFinal *= 1.3;
  else if (diasHastaVuelo <= 60) precioFinal *= 1.2;

  return Math.round(precioFinal);
}

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
    const em = orm.em.fork();
    try {
        await em.transactional(async (em) => {
            const { flight_id, personas } = req.body;
            const usuario_id = (req as any).user.id; 

            if (!flight_id || !personas) {
                res.status(400);
                throw new Error('Faltan datos: se requiere ID del vuelo y cantidad de personas.');
            }

            const flight = await em.findOne(Flight, { id: flight_id }, { populate: ['destino'], lockMode: LockMode.PESSIMISTIC_WRITE });

            if (!flight) {
                res.status(404);
                throw new Error('El vuelo seleccionado no fue encontrado.');
            }

            if (flight.capacidad_restante < personas) {
                res.status(409);
                throw new Error('No hay suficientes asientos disponibles.');
            }

            flight.capacidad_restante -= personas;

            const precioPorPersona = calcularPrecio(flight, flight.origen);
            const valorTotalReserva = precioPorPersona * personas;

            const now = new Date();
            const nuevaReserva = em.create(Reservation, {
                fecha_reserva: now.toISOString().split('T')[0],
                valor_reserva: valorTotalReserva,
                estado: 'confirmado',
                personas: personas,
                usuario: em.getReference(User, usuario_id),
                flight: flight,
                createdAt: now,
                updatedAt: now 
            });
            em.persist(nuevaReserva);
        });

        res.status(201).json({ message: '¡Viaje reservado exitosamente!' });

    } catch (error: any) {
        console.error('Error al crear la reserva:', error);
        const statusCode = res.statusCode >= 400 ? res.statusCode : 500;
        res.status(statusCode).json({ message: error.message || 'Error interno al procesar la reserva.' });
    }
}

async function findUserReservations(req: Request, res: Response) {
  try {
    const em = orm.em.fork();
    const userId = (req as any).user.id;

    const reservations = await em.find(
      Reservation,
      { usuario: userId },
      { 
        populate: ['flight.destino'], 
        orderBy: { createdAt: 'DESC' }
      }
    );

    const now = new Date();
    const responseData = reservations.map(reservation => {
      const flight = reservation.flight as any;
      if (!flight || !flight.destino) return null;

      const precioPorPersona = calcularPrecio(flight, flight.origen);
      const valorTotalActualizado = precioPorPersona * (reservation.personas || 1);

      const fechaVuelo = new Date(flight.fechahora_salida);
      
      return {
        id: reservation.id,
        fecha_reserva: reservation.fecha_reserva,
        valor_reserva: valorTotalActualizado,
        estado: reservation.estado,
        isPast: fechaVuelo < now,
        canCancel: fechaVuelo >= now && reservation.estado !== 'cancelado' && reservation.estado !== 'completado',
        flight: {
          id: flight.id,
          origen: flight.origen,
          fechahora_salida: flight.fechahora_salida,
          fechahora_llegada: flight.fechahora_llegada,
          aerolinea: flight.aerolinea,
          destino: flight.destino
        }
      };
    }).filter(Boolean);

    res.status(200).json({
      message: 'Reservas encontradas',
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
    console.error('Error al cancelar reserva:', error);
    res.status(500).json({ message: error.message });
  }
}

export { findAll, findOne, add, update, remove, findUserReservations, cancelReservation };