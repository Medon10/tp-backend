import {Request, Response, NextFunction} from "express"
import { orm } from "../shared/bdd/orm.js"
import { Flight } from "./flight.entity.js"
import { Destiny } from "../destiny/destiny.entity.js";
import { calcularPrecio } from "../shared/utils/precio.js";

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
    console.error('Error al buscar vuelos por destino:', error);
    res.status(500).json({ message: error.message });
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
            destino: destino,
            capacidad_restante: flightData.cantidad_asientos 
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
    }
}


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


const DISTANCIAS: { [key: string]: number } = {
  'Buenos Aires': 0,
  'Venecia': 11000,
  'Tierra del Fuego': 2800,
  'Pisos Picados': 1500, // Ajusta según ubicación real
  'Kino Der Toten': 12000, // Ajusta según ubicación real
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

function calcularPrecio(flight: Flight, origen: string): number {
  let precioFinal = flight.montoVuelo;

  // 1. Factor de distancia - usar distancia_km de la base de datos
  if (flight.distancia_km) {
    const incrementoDistancia = flight.distancia_km * 0.10; // $0.10 por km
    precioFinal += incrementoDistancia;
  }

  // 2. Factor de ocupación
  const porcentajeOcupacion = ((flight.cantidad_asientos - (flight.capacidad_restante || flight.cantidad_asientos)) / flight.cantidad_asientos) * 100;
  
  if (porcentajeOcupacion >= 80) {
    precioFinal *= 1.5;
  } else if (porcentajeOcupacion >= 60) {
    precioFinal *= 1.3;
  } else if (porcentajeOcupacion >= 40) {
    precioFinal *= 1.15;
  }

  // 3. Factor de anticipación - ARREGLAR: convertir string a Date
  const fechaVuelo = new Date(flight.fechahora_salida);
  const diasHastaVuelo = Math.floor((fechaVuelo.getTime() - Date.now()) / (1000 * 60 * 60 * 24));
  
  if (diasHastaVuelo <= 7) {
    precioFinal *= 1.4;
  } else if (diasHastaVuelo <= 30) {
    precioFinal *= 1.3;
  } else if (diasHastaVuelo <= 60) {
    precioFinal *= 1.2;
  }

  return Math.round(precioFinal);
}

async function buscarVuelos(req: Request, res: Response) {
  try {
    const em = orm.em.fork();
    const { presupuesto, personas, origen, fecha_salida } = req.body.sanitizedInput;

    console.log('Búsqueda de vuelos:', { presupuesto, personas, origen, fecha_salida });

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

    console.log(' Query conditions:', queryConditions);

    const flights = await em.find(
      Flight, 
      queryConditions,
      { populate: ['destino'] }
    );

    console.log(' Vuelos encontrados:', flights.length);

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

    console.log(' Vuelos dentro del presupuesto:', vuelosConPrecio.length);

    res.status(200).json({
      message: 'Vuelos encontrados',
      resultados: vuelosConPrecio.length,
      presupuesto_maximo: presupuesto,
      personas: personas,
      origen: origen,
      data: vuelosConPrecio
    });

  } catch (error: any) {
    console.error(' Error al buscar vuelos:', error);
    console.error('Stack:', error.stack);
    res.status(500).json({ message: error.message });
  }
}


export { findAll, findOne, add, update, remove, findByDestino, buscarVuelos }