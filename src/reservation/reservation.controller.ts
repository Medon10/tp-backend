import {Request, Response, NextFunction} from "express"
import { orm } from '../shared/bdd/orm.js'
import { Reservation } from "./reservation.entity.js"
import { User } from "../user/user.entity.js";
//si importo Flight se da una dependencia circular y no compila

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
        
        console.log('=== DEBUG RESERVA CREATION ===');
        console.log('Body original:', req.body);
        console.log('Sanitized input:', req.body.sanitizedInput);
        
        // Extraer IDs de relaciones del input sanitizado (ya no necesitamos destino_id)
        const { 
            flight_id, 
            usuario_id, 
            ...reservationData 
        } = req.body.sanitizedInput || req.body;
        
        console.log('IDs extraídos:', { flight_id, usuario_id });
        console.log('Datos de la reserva:', reservationData);
        
        // Validar que todos los IDs requeridos estén presentes
        const missingIds = [];
        if (!flight_id) missingIds.push('flight_id');  
        if (!usuario_id) missingIds.push('usuario_id');
        
        if (missingIds.length > 0) {
            return res.status(400).json({
                message: 'Error al crear reserva',
                error: `IDs requeridos faltantes: ${missingIds.join(', ')}`,
                receivedData: req.body.sanitizedInput || req.body
            });
        }

        // Verificar que existan las entidades relacionadas (flight con destino incluido)
        console.log('Verificando existencia de entidades relacionadas...');
        
        const [flight, usuario] = await Promise.all([
            // Cargar el flight con su destino relacionado
            em.findOne('Flight', flight_id, { 
                populate: ['destino'] // Asumiendo que en Flight tienes una relación 'destino'
            }),
            em.findOne(User, usuario_id)
        ]);

        console.log('Entidades encontradas:');
        console.log('- Flight:', flight ? `ID: ${(flight as any).id}` : 'NO ENCONTRADO');
        console.log('- Destino del vuelo:', flight ? `${(flight as any).destino?.nombre}` : 'NO DISPONIBLE');
        console.log('- Usuario:', usuario ? `ID: ${usuario.id}` : 'NO ENCONTRADO');

        // Validar existencia individual con mensajes específicos
        if (!flight) {
            return res.status(400).json({
                message: 'Error al crear reserva',
                error: `Vuelo con ID ${flight_id} no encontrado`,
                field: 'flight_id'
            });
        }

        if (!usuario) {
            return res.status(400).json({
                message: 'Error al crear reserva',
                error: `Usuario con ID ${usuario_id} no encontrado`,
                field: 'usuario_id'
            });
        }

        // Verificar que el vuelo tenga un destino asignado
        if (!(flight as any).destino) {
            return res.status(400).json({
                message: 'Error al crear reserva',
                error: `El vuelo con ID ${flight_id} no tiene un destino asignado`,
                field: 'flight_id'
            });
        }

        //aca podria haber validaciones de negocio ej: fecha de reserva > hoy
        console.log('Todas las entidades válidas, creando reserva...');

        const now = new Date();
        const reservation = em.create(Reservation, {
            fecha_reserva: reservationData.fecha_reserva,
            valor_reserva: reservationData.valor_reserva,
            estado: reservationData.estado || 'pendiente', // Estado por defecto
            flight: em.getReference('Flight', flight_id),
            usuario: em.getReference(User, usuario_id),
            createdAt: now,
            updatedAt: now
        });

        console.log('Reserva creada en memoria:', {
            fecha_reserva: reservation.fecha_reserva,
            valor_reserva: reservation.valor_reserva,
            estado: reservation.estado
        });

        // Persistir en base de datos
        await em.flush();

        console.log('Reserva persistida exitosamente con ID:', reservation.id);

        // Preparar respuesta con datos completos (incluyendo destino del vuelo)
        const response = {
            message: 'Reserva creada exitosamente',
            data: {
                id: reservation.id,
                fecha_reserva: reservation.fecha_reserva,
                valor_reserva: reservation.valor_reserva,
                estado: reservation.estado,
                relaciones: {
                    destino: {
                        id: (flight as any).destino.id,
                        nombre: (flight as any).destino.nombre 
                    },
                    flight: {
                        id: (flight as any).id,
                        origen: (flight as any).origen,
                        aerolinea: (flight as any).aerolinea,
                        fechahora_salida: (flight as any).fechahora_salida,
                        fechahora_llegada: (flight as any).fechahora_llegada
                    },
                    usuario: {
                        id: usuario.id,
                        nombre: usuario.nombre,
                    }
                },
                timestamps: {
                    createdAt: reservation.createdAt,
                    updatedAt: reservation.updatedAt
                }
            }
        };

        res.status(201).json(response);

    } catch (error) {
        console.error('=== ERROR EN RESERVATION CREATION ===');
        console.error('Error completo:', error);
        if (error instanceof Error) {
            console.error('Stack trace:', error.stack);
        }
        res.status(500).json({ message: 'Error al crear reserva', error });
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

export { findAll, findOne, add, update, remove }