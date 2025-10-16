import { Flight } from "../../flight/flight.entity.js";

export const DISTANCIAS: { [key: string]: number } = {
  'Buenos Aires': 0,
  'Venecia': 11000,
  'Tierra del Fuego': 2800,
  'Pisos Picados': 1500,
  'Kino Der Toten': 12000,
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

export function calcularPrecio(flight: Flight, origen: string = "Buenos Aires", personas: number = 1): { 
  precioPorPersona: number;
  precioTotal: number;
} {
  let precioFinal = flight.montoVuelo;

  // 1. Factor de distancia
  if (flight.distancia_km) {
    const incrementoDistancia = flight.distancia_km * 0.10;
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

  // 3. Factor de anticipación
  const fechaVuelo = new Date(flight.fechahora_salida);
  const diasHastaVuelo = Math.floor((fechaVuelo.getTime() - Date.now()) / (1000 * 60 * 60 * 24));
  
  if (diasHastaVuelo <= 7) {
    precioFinal *= 1.4;
  } else if (diasHastaVuelo <= 30) {
    precioFinal *= 1.3;
  } else if (diasHastaVuelo <= 60) {
    precioFinal *= 1.2;
  }

  const precioPorPersona = Math.round(precioFinal);
  const precioTotal = precioPorPersona * personas;

  return {
    precioPorPersona,
    precioTotal
  };
}