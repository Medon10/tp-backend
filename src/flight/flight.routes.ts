import { Router } from "express";
import { sanitizeFlightInput, findAll, findOne, add, update, remove } from "./flight.controller.js";

export const flightRouter = Router()

flightRouter.get('/', findAll)
flightRouter.get('/:id', findOne)
flightRouter.post('/', sanitizeFlightInput, add)
flightRouter.put('/:id', sanitizeFlightInput, update)
flightRouter.patch('/:id', sanitizeFlightInput, update)
flightRouter.delete('/:id', remove)
