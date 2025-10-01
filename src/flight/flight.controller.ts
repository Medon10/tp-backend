import {Request, Response, NextFunction} from "express"
import { orm } from "../shared/bdd/orm.js"
import { Flight } from "./flight.entity.js"
import { Destiny } from "../destiny/destiny.entity.js";

async function findAll (req:Request, res:Response) {
    try {
        const em = orm.em.fork();
        
        // Optional date filtering
        let whereClause = {};
        
        if (req.query.fechaInicio && req.query.fechaFin) {
            console.log('Filtering flights by date:', req.query.fechaInicio, 'to', req.query.fechaFin);
            whereClause = {
                fechahora_salida: {
                    $gte: req.query.fechaInicio,
                    $lte: req.query.fechaFin
                }
            };
        }
        
        const flights = await em.find(Flight, whereClause, {
            populate: ['destino'] // Populate the destination relationship
        })
        
        console.log(`Found ${flights.length} flights`);
        res.json({data:flights})
    } catch (error) {
        console.error('Error al obtener vuelos:', error);
        res.status(500).json({message: 'Error al obtener vuelos', error: error instanceof Error ? error.message : 'Error desconocido'})
    }
}

async function findOne(req: Request, res: Response) {
    try {
        const em = orm.em.fork();
        const id = Number(req.params.id)
        const flight = await em.findOne(Flight, { id })
        if (!flight){
            return res.status(404).send({message:'No encontrado'})
        }
        res.json({data:flight})
    } catch (error) {
        res.status(500).json({message: 'Error al obtener vuelo', error})
    }
}

async function add(req: Request, res: Response) {
    try {
        const em = orm.em.fork();
        
        console.log('Datos recibidos:', req.body.sanitizedInput);
        
        const { destino_id, ...flightData } = req.body.sanitizedInput;
        
        // Validar que destino_id esté presente
        if (!destino_id) {
            return res.status(400).json({
                message: 'Error al crear vuelo',
                error: 'destino_id es requerido'
            });
        }
        
        // Verificar que el destino existe
        const destino = await em.findOne(Destiny, destino_id);
        if (!destino) {
            return res.status(400).json({
                message: 'Error al crear vuelo',
                error: `Destino con ID ${destino_id} no encontrado`
            });
        }
        
        console.log('Destino encontrado:', destino);
        
        // Crear el vuelo
        const flight = em.create(Flight, {
            ...flightData,
            destino: destino 
        });
        
        await em.flush();
        
        console.log('Vuelo creado:', flight);
        
        res.status(201).json({
            message: 'Vuelo creado exitosamente',
            data: {
                id: flight.id,
                fechahora_salida: flight.fechahora_salida,
                fechahora_llegada: flight.fechahora_llegada,
                duracion: flight.duracion,
                aerolinea: flight.aerolinea,
                cantidad_asientos: flight.cantidad_asientos,
                montoVuelo: flight.montoVuelo,
                origen: flight.origen,
                destino: {
                    id: destino.id,
                    nombre: destino.nombre // asumiendo que Destiny tiene nombre
                },
                createdAt: flight.createdAt,
                updatedAt: flight.updatedAt
            }
        });
        
    } catch (error) {
        console.error('Error detallado:', error);
        res.status(500).json({ 
            message: 'Error al crear vuelo', 
            error: error instanceof Error ? error.message : 'Error desconocido'
        });
    }
}

/*async function add(req: Request, res: Response)  {
    try {
        const em = orm.em.fork();
        const {destino_id, ...flightData} = req.body.sanitizedInput;
        const destino = await em.findOne(Destiny, destino_id);
        if (!destino) {
            return res.status(400).json({
                message: 'Error al crear vuelo',
                error: `Destino con ID ${destino_id} no encontrado`
            });
        }
        const flight = em.create(Flight, {
            ...flightData,
            destino: destino 
        });
        await em.flush();
        res.status(201).send({message: 'vuelo creado', data: flight})
    } catch (error) {
        res.status(500).json({message: 'Error al crear vuelo', error})
    }
}*/

async function update(req: Request,res: Response) {
    try {
        const em = orm.em.fork();
        const id = Number.parseInt(req.params.id)
        const flight = await em.findOne(Flight, { id })
        if (!flight) {
            return res.status(404).send({ message: 'vuelo no encontrado' })
        }
        em.assign(flight, req.body.sanitizedInput)
        await em.flush()
        res.status(200).send({ message: 'vuelo actualizado', data: flight })
    } catch (error) {
        res.status(500).json({ message: 'Error al actualizar vuelo', error })
    }
}

async function remove(req: Request, res: Response){
    try {
        const em = orm.em.fork();
        const id = Number.parseInt(req.params.id)
        const flight = await em.findOne(Flight, { id })
        if (!flight) {
            return res.status(404).send({ message: 'vuelo no encontrado' })
        }
        await em.removeAndFlush(flight)
        res.status(200).send({ message: 'vuelo borrado', data: flight })
    } catch (error) {
        res.status(500).json({ message: 'Error al borrar vuelo', error })
    }
}


export { findAll, findOne, add, update, remove, }