import { Router } from "express";
import { sanitizeUserInput, findAll, findOne, add, update, remove } from "./trip.controller.js";

export const tripRouter = Router()

tripRouter.get('/', findAll)
tripRouter.get('/:id', findOne)
tripRouter.post('/', sanitizeUserInput, add)
tripRouter.put('/:id', sanitizeUserInput, update)
tripRouter.patch('/:id', sanitizeUserInput, update)
tripRouter.delete('/:id', remove)