import { Router } from "express";
import { findAll, findOne, add, update, remove, findByDestino, buscarVuelos } from "./flight.controller.js";
import { sanitizeFlightInput } from "../shared/middleware/sanitizeFlight.js";
import { verifyToken } from "../shared/middleware/verifytoken.js";
import { verifyAdmin } from "../shared/middleware/verifyAdmin.js";
import { sanitizeFlightSearch } from "../shared/middleware/sanitizeFlightSearch.js";
export const flightRouter = Router();
// Rutas públicas (todos pueden ver vuelos)
flightRouter.get('/', findAll);
flightRouter.get('/:id', findOne);
flightRouter.get('/destino/:destinoId', findByDestino);
flightRouter.post('/buscar', sanitizeFlightSearch, buscarVuelos);
// Rutas protegidas (solo para administradores)
flightRouter.post('/', verifyToken, verifyAdmin, sanitizeFlightInput, add);
flightRouter.put('/:id', verifyToken, verifyAdmin, sanitizeFlightInput, update);
flightRouter.patch('/:id', verifyToken, verifyAdmin, sanitizeFlightInput, update);
flightRouter.delete('/:id', verifyToken, verifyAdmin, remove);
//# sourceMappingURL=flight.routes.js.map