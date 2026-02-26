import {Request, Response, NextFunction} from "express"
import { orm } from "../shared/bdd/orm.js"
import { Flight } from "./flight.entity.js"
import { Destiny } from "../destiny/destiny.entity.js";
import { calcularPrecio } from "../shared/utils/precio.js";

async function findAll (req:Request, res:Response) {
    try {
        const em = orm.em.fork();
        const flights = await em.find(
            Flight, 
            {},
            { populate: ['destino'] } 
        )
        res.json({data:flights})
    } catch (error) {
        res.status(500).json({message: 'Error al obtener vuelos', error})
    }
}

async function findOne(req: Request, res: Response) {
    try {
        const em = orm.em.fork();
        const id = Number(req.params.id)
        const flight = await em.findOne(
            Flight, 
            { id },
            { populate: ['destino'] }
        )
        if (!flight){
            return res.status(404).send({message:'No encontrado'})
        }
        res.json({data:flight})
    } catch (error) {
        res.status(500).json({message: 'Error al obtener vuelo', error})
    }
}

async function findByDestino(req: Request, res: Response) {
  try {
    const em = orm.em.fork();
    const destinoId = Number.parseInt(req.params.destinoId);
    
    if (!destinoId) {
      return res.status(400).json({ message: 'ID de destino inválido' });
    }

    // Buscar vuelos futuros para ese destino
    const flights = await em.find(
      Flight,
      {
        destino: destinoId,
        fechahora_salida: { $gte: new Date() }
      },
      {
        populate: ['destino'],
        orderBy: { fechahora_salida: 'ASC' }
      }
    );

        const vuelosConPrecio = flights.map(flight => {
          const origen = flight.origen || 'Buenos Aires';
          const { precioPorPersona } = calcularPrecio(flight, origen, 1);

          return {
            id: flight.id,
            origen: flight.origen,
            destino: {
              id: flight.destino.id,
              nombre: flight.destino.nombre,
              imagen: flight.destino.imagen,
              transporte: flight.destino.transporte || [],
              actividades: flight.destino.actividades || []
            },
            fechahora_salida: flight.fechahora_salida,
            fechahora_llegada: flight.fechahora_llegada,
            duracion: flight.duracion,
            capacidad_restante: flight.capacidad_restante,
            precio_por_persona: precioPorPersona, // Precio dinámico
            distancia_aproximada: flight.distancia_km || 0,  
            cantidad_asientos: flight.cantidad_asientos,
            aerolinea: flight.aerolinea
      };
    });

    res.status(200).json({
      message: 'Vuelos encontrados',
      cantidad: flights.length,
      data: vuelosConPrecio
    });
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
}

async function add(req: Request, res: Response) {
    try {
        const em = orm.em.fork();
        
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
        
        // Crear el vuelo
        const flight = em.create(Flight, {
            ...flightData,
            destino: destino 
        });
        
        await em.flush();
        
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
        
    } catch (error: any) {
        res.status(500).json({ message: 'Error al crear vuelo', error: error.message });
    }
}


async function update(req: Request,res: Response) {
    try {
        const em = orm.em.fork();
        const id = Number.parseInt(req.params.id)
        const flight = await em.findOne(
            Flight, 
            { id },
            { populate: ['destino'] } 
        )
        if (!flight) {
            return res.status(404).send({ message: 'vuelo no encontrado' })
        }
        
        // Si viene destino_id en el body, actualizar la relación
        const { destino_id, ...flightData } = req.body.sanitizedInput;
        
        if (destino_id) {
            const destino = await em.findOne(Destiny, destino_id);
            if (!destino) {
                return res.status(400).json({
                    message: 'Destino no encontrado'
                });
            }
            em.assign(flight, { ...flightData, destino });
        } else {
            em.assign(flight, flightData);
        }
        
        await em.flush()
        res.status(200).send({ message: 'Vuelo actualizado exitosamente', data: flight })
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

async function buscarVuelos(req: Request, res: Response) {
  try {
    const em = orm.em.fork();
    const { presupuesto, personas, origen, fecha_salida } = req.body.sanitizedInput;

    if (!presupuesto || !personas || !origen) {
      return res.status(400).json({ 
        message: 'Faltan parámetros: presupuesto, personas y origen son requeridos' 
      });
    }

    if (personas < 1 || personas > 10) {
      return res.status(400).json({ 
        message: 'La cantidad de personas debe estar entre 1 y 10' 
      });
    }

    let queryConditions: any = {
      origen: { $eq: origen },
      cantidad_asientos: { $gte: personas } 
    };

    if (fecha_salida) {
      const fechaBusqueda = new Date(fecha_salida);
      const fechaInicio = new Date(fechaBusqueda);
      fechaInicio.setHours(0, 0, 0, 0);
      const fechaFin = new Date(fechaBusqueda);
      fechaFin.setHours(23, 59, 59, 999);

      queryConditions.fechahora_salida = {
        $gte: fechaInicio.toISOString(),
        $lte: fechaFin.toISOString()
      };
    } else {
      queryConditions.fechahora_salida = { $gte: new Date().toISOString() };
    }

    const flights = await em.find(
      Flight, 
      queryConditions,
      { populate: ['destino'] }
    );

    const vuelosConPrecio = flights
      .map(flight => {
        const {precioPorPersona, precioTotal} = calcularPrecio(flight, origen, personas);

        return {
          id: flight.id,
          origen: flight.origen,
          destino: {
            id: flight.destino.id,
            nombre: flight.destino.nombre,
            imagen: flight.destino.imagen,
            transporte: flight.destino.transporte,
            actividades: flight.destino.actividades
          },
          fecha_hora: flight.fechahora_salida,
          capacidad_restante: flight.capacidad_restante, 
          precio_por_persona: precioPorPersona,
          precio_total: precioTotal,
          personas: personas,
          distancia_aproximada: flight.distancia_km || 0
        };
      })
      .filter(vuelo => vuelo.precio_total <= presupuesto)
      .sort((a, b) => a.precio_total - b.precio_total);

    res.status(200).json({
      message: 'Vuelos encontrados',
      resultados: vuelosConPrecio.length,
      presupuesto_maximo: presupuesto,
      personas: personas,
      origen: origen,
      data: vuelosConPrecio
    });

  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
}


export { findAll, findOne, add, update, remove, findByDestino, buscarVuelos }