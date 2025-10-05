import { Router } from "express";
import {  findAll, findOne, add, update, remove, findByDestino } from "./flight.controller.js";
import { sanitizeFlightInput } from "../shared/middleware/sanitizeFlight.js";

export const flightRouter = Router()

flightRouter.get('/', findAll)
flightRouter.get('/:id', findOne)
flightRouter.get('/destino/:destinoId', findByDestino);
flightRouter.post('/', sanitizeFlightInput, add)
flightRouter.put('/:id', sanitizeFlightInput, update)
flightRouter.patch('/:id', sanitizeFlightInput, update)
flightRouter.delete('/:id', remove)
