import {Request, Response, NextFunction} from "express"
import { orm } from "../shared/bdd/orm.js"
import { Flight } from "./flight.entity.js"
import { Destiny } from "../destiny/destiny.entity.js";
import { Reservation } from "../reservation/reservation.entity.js";
import { Favorite } from "../favorite/favorite.entity.js";
import { DISTANCIAS } from "../shared/utils/precio.js";

async function findAll(req: Request, res: Response) {
  try {
    const em = orm.em.fork();
    const flights = await em.find(Flight, {}, { populate: ['destino'] });
    
    const responseData = flights.map(flight => ({
      id: flight.id,
      fechahora_salida: flight.fechahora_salida,
      fechahora_llegada: flight.fechahora_llegada,
      duracion: flight.duracion,
      aerolinea: flight.aerolinea,
      cantidad_asientos: flight.cantidad_asientos,
      capacidad_restante: flight.capacidad_restante,
      montoVuelo: flight.montoVuelo,
      origen: flight.origen,
      distancia_km: flight.distancia_km,
      destino: flight.destino,
      createdAt: flight.createdAt,
      updatedAt: flight.updatedAt
    }));

    res.json({ data: responseData });
  } catch (error) { 
    console.error("Error en findAll de vuelos:", error);
    res.status(500).json({ message: 'Error al obtener vuelos' }); 
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

async function findByDestino(req: Request, res: Response) {
  try {
    const em = orm.em.fork();
    const destinoId = Number.parseInt(req.params.destinoId);
    
    if (!destinoId) {
      return res.status(400).json({ message: 'ID de destino inválido' });
    }

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
      
    const flightsConPrecio = flights.map(f => {
        const precioCalculado = calcularPrecio(f);
        return { ...f, montoVuelo: precioCalculado };
    });

    res.status(200).json({
      message: 'Vuelos encontrados',
      cantidad: flightsConPrecio.length,
      data: flightsConPrecio
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

        const fechaSalida = new Date(flightData.fechahora_salida);
        const fechaLlegada = new Date(flightData.fechahora_llegada);

        if (fechaSalida < new Date()) {
            return res.status(400).json({ message: 'No se puede crear un vuelo en una fecha que ya ha pasado.' });
        }
        if (fechaLlegada <= fechaSalida) {
            return res.status(400).json({ message: 'La fecha de llegada debe ser posterior a la fecha de salida.' });
        }
        const destino = await em.findOne(Destiny, destino_id);
        if (!destino) {
            return res.status(400).json({
                message: 'Error al crear vuelo',
                error: `Destino con ID ${destino_id} no encontrado`
            });
        }
        
        console.log('Destino encontrado:', destino);
        
        const distancia = DISTANCIAS[destino.nombre] || 0;
        const flight = em.create(Flight, {
            ...flightData,
            destino: destino,
            capacidad_restante: flightData.cantidad_asientos,
            distancia_km: distancia 
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
                distancia_km: flight.distancia_km,
                destino: {
                    id: destino.id,
                    nombre: destino.nombre
                },
                createdAt: flight.createdAt,
                updatedAt: flight.updatedAt
            }
        });
        
    } catch (error) {
        console.error('Error detallado:', error);
        res.status(500).json({ message: 'Error interno al crear el vuelo.' });
    }
}

async function update(req: Request, res: Response) {
    try {
        const em = orm.em.fork();
        const id = Number.parseInt(req.params.id);
        const flightData = req.body.sanitizedInput;
        
        if (flightData.fechahora_salida && flightData.fechahora_llegada) {
            const fechaSalida = new Date(flightData.fechahora_salida);
            const fechaLlegada = new Date(flightData.fechahora_llegada);

            const hoy = new Date();
            hoy.setHours(0, 0, 0, 0);

            if (fechaSalida < hoy) {
                return res.status(400).json({ message: 'No se puede actualizar un vuelo a una fecha que ya ha pasado.' });
            }
            if (fechaLlegada <= fechaSalida) {
                return res.status(400).json({ message: 'La fecha de llegada debe ser posterior a la fecha de salida.' });
            }
        }
        const flight = await em.findOne(Flight, { id });
        if (!flight) {
            return res.status(404).send({ message: 'Vuelo no encontrado' });
        }
        em.assign(flight, flightData);
        await em.flush();
        res.status(200).send({ message: 'Vuelo actualizado', data: flight });
    } catch (error) {
        res.status(500).json({ message: 'Error al actualizar vuelo', error });
    }
}

async function remove(req: Request, res: Response){
    try {
        const em = orm.em.fork();
        const id = Number.parseInt(req.params.id);
        const flight = await em.findOne(Flight, { id }, { populate: ['reservations', 'favorites'] });

        if (!flight) {
            return res.status(404).send({ message: 'Vuelo no encontrado' });
        }

        const reservationsCount = flight.reservations.length;
        const favoritesCount = flight.favorites.length;

        if (reservationsCount > 0) {
            await em.nativeDelete(Reservation, { flight: flight.id });
        }
        if (favoritesCount > 0) {
            await em.nativeDelete(Favorite, { flight: flight.id });
        }
        await em.removeAndFlush(flight);

        let successMessage = 'Vuelo borrado exitosamente.';
        if (reservationsCount > 0 || favoritesCount > 0) {
            successMessage += ` Advertencia: Se eliminaron también ${reservationsCount} reserva(s) y ${favoritesCount} favorito(s) asociados.`;
        }

        res.status(200).json({ message: successMessage });
    } catch (error: any) {
        console.error('Error al borrar vuelo:', error);
        res.status(500).json({ message: 'Error interno al borrar el vuelo.', error: error.message });
    }
}

function calcularPrecio(flight: Flight, origen: string = 'Buenos Aires'): number {
  let precioFinal = flight.montoVuelo ?? 500;
  const distanciaDestino = DISTANCIAS[flight.destino.nombre] || 10000;
  const distanciaTotal = Math.abs(distanciaDestino - (DISTANCIAS[origen] || 0));
  
  precioFinal += distanciaTotal * 0.05;

  const ocupacion = (flight.cantidad_asientos - (flight as any).capacidad_restante) / flight.cantidad_asientos;
  if (ocupacion >= 0.8) precioFinal *= 1.5;
  else if (ocupacion >= 0.6) precioFinal *= 1.3;
  else if (ocupacion >= 0.4) precioFinal *= 1.15;

  const diasHastaVuelo = (new Date(flight.fechahora_salida).getTime() - Date.now()) / (1000 * 60 * 60 * 24);
  if (diasHastaVuelo <= 7) precioFinal *= 1.4;
  else if (diasHastaVuelo <= 30) precioFinal *= 1.3;
  else if (diasHastaVuelo <= 60) precioFinal *= 1.2;

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
      cantidad_asientos: { $gte: personas },
      origen: origen
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
        const precioPorPersona = calcularPrecio(flight, origen);
        const precioTotal = precioPorPersona * personas;

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