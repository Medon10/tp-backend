import { Router } from 'express';
import { createPreference, webhook } from './payment.controller.js';
import { verifyToken } from '../shared/middleware/verifytoken.js';

const paymentRouter = Router();

// Create preference requires auth (user creating reservation)
paymentRouter.post('/create-preference', verifyToken, createPreference);

// Webhook: Mercado Pago sends POSTs (no auth). Must accept raw JSON.
paymentRouter.post('/webhook', webhook);

export { paymentRouter };