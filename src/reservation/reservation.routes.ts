import { Router } from "express";
import { findAll, findOne, add, update, remove } from "./reservation.controller.js";
import { sanitizeReservationInput } from "../shared/middleware/sanitizeReservation.js";

export const reservationRouter = Router()

reservationRouter.get('/', findAll)
reservationRouter.get('/:id', findOne)
reservationRouter.post('/', sanitizeReservationInput, add)
reservationRouter.put('/:id', sanitizeReservationInput, update)
reservationRouter.patch('/:id', sanitizeReservationInput, update)
reservationRouter.delete('/:id', remove)