import { Router } from 'express';
import { createPreference, checkStatus, webhook } from './payment.controller.js';
import { verifyToken } from '../shared/middleware/verifytoken.js';

const paymentRouter = Router();

// Create preference requires auth (user creating reservation)
paymentRouter.post('/create-preference', verifyToken, createPreference);

// Check payment status for a reservation (polling from frontend)
paymentRouter.get('/check-status/:reservationId', verifyToken, checkStatus);

// Webhook: Mercado Pago sends POSTs (no auth). Must accept raw JSON.
paymentRouter.post('/webhook', webhook);

export { paymentRouter };