import {Request, Response, NextFunction} from "express"
import { orm } from '../shared/bdd/orm.js'
import { Trip } from "./trip.entity.js"
import { User } from "../user/user.entity.js";
import { Destiny } from "../destiny/destiny.entity.js";
//si importo Flight se da una dependencia circular y no compila

async function findAll (req:Request, res:Response) {
    try {
        const em = orm.em.fork();
        const trips = await em.find(Trip, {})
        res.status(200).json({message: 'Viajes encontrados', data: trips})
    } catch (error: any) {
        res.status(500).json({message: 'Error al obtener viajes', error})
    }
}

async function findOne(req: Request, res: Response) {
    try {
        const em = orm.em.fork();
        const id = Number(req.params.id)
        const trip = await em.findOne(Trip, { id })
        if (!trip){
            return res.status(404).send({message:'No encontrado'})
        }
        res.status(200).json({message: 'Viaje encontrado', data: trip})
    } catch (error: any) {
        res.status(500).json({message: 'Error al obtener viaje', error})
    }
}

async function add(req: Request, res: Response) {
    try {
        const em = orm.em.fork();
        
        console.log('=== DEBUG TRIP CREATION ===');
        console.log('Body original:', req.body);
        console.log('Sanitized input:', req.body.sanitizedInput);
        
        // Extraer IDs de relaciones del input sanitizado
        const { 
            destino_id, 
            flight_id, 
            usuario_id, 
            ...tripData 
        } = req.body.sanitizedInput || req.body;
        
        console.log('IDs extraídos:', { destino_id, flight_id, usuario_id });
        console.log('Datos del trip:', tripData);
        
        // Validar que todos los IDs requeridos estén presentes
        const missingIds = [];
        if (!destino_id) missingIds.push('destino_id');
        if (!flight_id) missingIds.push('flight_id');  
        if (!usuario_id) missingIds.push('usuario_id');
        
        if (missingIds.length > 0) {
            return res.status(400).json({
                message: 'Error al crear viaje',
                error: `IDs requeridos faltantes: ${missingIds.join(', ')}`,
                receivedData: req.body.sanitizedInput || req.body
            });
        }

        // Verificar que existan todas las entidades relacionadas
        console.log('Verificando existencia de entidades relacionadas...');
        
        const [destino, flight, usuario] = await Promise.all([
            em.findOne(Destiny, destino_id),
            em.findOne('Flight', flight_id), // String literal para evitar import circular
            em.findOne(User, usuario_id)
        ]);

        console.log('Entidades encontradas:');
        console.log('- Destino:', destino ? `ID: ${destino.id}` : 'NO ENCONTRADO');
        console.log('- Flight:', flight ? `ID: ${(flight as any).id}` : 'NO ENCONTRADO');
        console.log('- Usuario:', usuario ? `ID: ${usuario.id}` : 'NO ENCONTRADO');

        // Validar existencia individual con mensajes específicos
        if (!destino) {
            return res.status(400).json({
                message: 'Error al crear viaje',
                error: `Destino con ID ${destino_id} no encontrado`,
                field: 'destino_id'
            });
        }

        if (!flight) {
            return res.status(400).json({
                message: 'Error al crear viaje',
                error: `Vuelo con ID ${flight_id} no encontrado`,
                field: 'flight_id'
            });
        }

        if (!usuario) {
            return res.status(400).json({
                message: 'Error al crear viaje',
                error: `Usuario con ID ${usuario_id} no encontrado`,
                field: 'usuario_id'
            });
        }
        //aca podria haber validaciones de negocio ej: fecha de reserva > hoy
        console.log('Todas las entidades válidas, creando viaje...');

        const now = new Date();
        const trip = em.create(Trip, {
            fecha_reserva: tripData.fecha_reserva,
            valor_reserva: tripData.valor_reserva, // Usar precio del vuelo si no se especifica
            estado: tripData.estado || 'pendiente', // Estado por defecto
            destino: em.getReference(Destiny, destino_id),
            flight: em.getReference('Flight', flight_id), // String literal
            usuario: em.getReference(User, usuario_id),
            createdAt: now,
            updatedAt: now
        });

        console.log('Trip creado en memoria:', {
            fecha_reserva: trip.fecha_reserva,
            valor_reserva: trip.valor_reserva,
            estado: trip.estado
        });

        // Persistir en base de datos
        await em.flush();
        
        console.log('Trip persistido exitosamente con ID:', trip.id);

        // Preparar respuesta con datos completos
        const response = {
            message: 'Viaje creado exitosamente',
            data: {
                id: trip.id,
                fecha_reserva: trip.fecha_reserva,
                valor_reserva: trip.valor_reserva,
                estado: trip.estado,
                relaciones: {
                    destino: {
                        id: destino.id,
                        nombre: destino.nombre 
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
                    createdAt: trip.createdAt,
                    updatedAt: trip.updatedAt
                }
            }
        };

        res.status(201).json(response);

    } catch (error) {
        console.error('=== ERROR EN TRIP CREATION ===');
        console.error('Error completo:', error);
        if (error instanceof Error) {
            console.error('Stack trace:', error.stack);
        }
        res.status(500).json({ message: 'Error al crear viaje', error });
    }
}

async function update(req: Request,res: Response) {
    try {
        const em = orm.em.fork();
        const id = Number(req.params.id)
        const trip = await em.findOne(Trip, { id })
        if (!trip) {
            return res.status(404).send({ message: 'viaje no encontrado' })
        }
        em.assign(trip, req.body.sanitizedInput)
        await em.flush()
        res.status(200).send({ message: 'viaje actualizado', data: trip })
    } catch (error: any) {
        res.status(500).json({ message: 'Error al actualizar viaje', error })
    }
}

async function remove(req: Request, res: Response){
    try {
        const em = orm.em.fork();
        const id = Number(req.params.id)
        const trip = await em.findOne(Trip, { id })
        if (!trip) {
            return res.status(404).send({ message: 'viaje no encontrado' })
        }
        await em.removeAndFlush(trip)
        res.status(200).send({ message: 'viaje borrado' })
    } catch (error: any) {
        res.status(500).json({ message: 'Error al borrar viaje', error })
    }
}

export { findAll, findOne, add, update, remove }