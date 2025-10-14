import { Router } from "express";
import { findAll, findOne, add, update, remove, findUserReservations, cancelReservation } from "./reservation.controller.js";
import { sanitizeReservationInput } from "../shared/middleware/sanitizeReservation.js";
import { verifyToken } from "../shared/middleware/verifytoken.js";

export const reservationRouter = Router();


reservationRouter.get('/misviajes', verifyToken, findUserReservations); 
reservationRouter.patch('/:id/cancel', verifyToken, cancelReservation); 

reservationRouter.get('/', verifyToken, findAll);
reservationRouter.get('/:id', verifyToken, findOne);
reservationRouter.post('/', verifyToken, add);
reservationRouter.put('/:id', verifyToken, sanitizeReservationInput, update);
reservationRouter.patch('/:id', verifyToken, sanitizeReservationInput, update);
reservationRouter.delete('/:id', verifyToken, remove);