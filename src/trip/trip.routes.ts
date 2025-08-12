import { Router } from "express";
import { findAll, findOne, add, update, remove } from "./trip.controller.js";
import { sanitizeTripInput } from "../shared/middleware/sanitizeTrip.js";

export const tripRouter = Router()

tripRouter.get('/', findAll)
tripRouter.get('/:id', findOne)
tripRouter.post('/', sanitizeTripInput, add)
tripRouter.put('/:id', sanitizeTripInput, update)
tripRouter.patch('/:id', sanitizeTripInput, update)
tripRouter.delete('/:id', remove)