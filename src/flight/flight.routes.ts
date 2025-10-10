import { Router } from "express";
import { findAll, findOne, add, update, remove, findByDestino, buscarVuelos } from "./flight.controller.js"; // Asegúrate que 'buscarVuelos' esté aquí
import { sanitizeFlightInput } from "../shared/middleware/sanitizeFlight.js";
import { verifyToken } from "../shared/middleware/verifytoken.js";
import { verifyAdmin } from "../shared/middleware/verifyAdmin.js";

export const flightRouter = Router();

// Rutas públicas
flightRouter.get('/', findAll);
flightRouter.get('/:id', findOne);
flightRouter.get('/destino/:destinoId', findByDestino);
flightRouter.post('/search', buscarVuelos); 

// Rutas de Admin
flightRouter.post('/', verifyToken, verifyAdmin, sanitizeFlightInput, add);
flightRouter.put('/:id', verifyToken, verifyAdmin, sanitizeFlightInput, update);
flightRouter.patch('/:id', verifyToken, verifyAdmin, sanitizeFlightInput, update);
flightRouter.delete('/:id', verifyToken, verifyAdmin, remove);