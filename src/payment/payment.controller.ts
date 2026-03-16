import { Request, Response } from 'express';
import { MercadoPagoConfig, Preference, Payment, MerchantOrder } from 'mercadopago';
import { orm } from '../shared/bdd/orm.js';
import { Reservation } from '../reservation/reservation.entity.js';
import { Flight } from '../flight/flight.entity.js';

// Mercado Pago SDK
const mpClient = process.env.MP_ACCESS_TOKEN
  ? new MercadoPagoConfig({ accessToken: process.env.MP_ACCESS_TOKEN })
  : null;

if (!mpClient) {
  console.warn('MP_ACCESS_TOKEN is not set. Payment preference creation will fail until configured.');
}

/**
 * POST /api/payments/create-preference
 * Body: { reservationId: number }
 * Creates a Mercado Pago preference based on an existing reservation.
 */
export async function createPreference(req: Request, res: Response) {
  try {
    if (!process.env.MP_ACCESS_TOKEN) {
      return res.status(500).json({ message: 'Mercado Pago no configurado (falta MP_ACCESS_TOKEN).' });
    }
    if (!mpClient) {
      return res.status(500).json({ message: 'Cliente Mercado Pago no inicializado.' });
    }

    const { reservationId } = req.body;
    if (!reservationId) {
      return res.status(400).json({ message: 'reservationId requerido' });
    }

    const em = orm.em.fork();
    const reservation = await em.findOne(Reservation, { id: reservationId }, { populate: ['flight.destino', 'usuario'] });
    if (!reservation) {
      return res.status(404).json({ message: 'Reserva no encontrada' });
    }

    const flight = reservation.flight as any as Flight;

    // Construimos item único con el total. (Opcional: cambiar a unit_price por persona y quantity=cantidad_personas)
    const currency = process.env.MP_CURRENCY || 'ARS';
    const items = [
      {
        id: `reservation-${reservation.id}`,
        title: `Reserva vuelo a ${flight.destino?.nombre || ''}`,
        description: `Reserva para ${reservation.cantidad_personas || 1} pasajero(s)`,
        quantity: 1,
        unit_price: reservation.valor_reserva,
        currency_id: currency
      }
    ];

    const backUrlBase = process.env.FRONTEND_BASE_URL || 'http://localhost:5173';
    const backendBase = process.env.BACKEND_BASE_URL || '';

    const preferenceBody: any = {
      items,
      external_reference: String(reservation.id),
      payer: {
        email: reservation.usuario.email,
        name: reservation.usuario.nombre,
        surname: reservation.usuario.apellido
      },
      metadata: {
        reservationId: reservation.id,
        flightId: flight.id
      },
    };

    // back_urls y auto_return solo funcionan con URLs públicas (https).
    // En desarrollo local (http://localhost) MP las rechaza, así que las omitimos.
    if (backUrlBase.startsWith('https://')) {
      preferenceBody.back_urls = {
        success: `${backUrlBase}/pago/resultado?status=success&reservation=${reservation.id}`,
        failure: `${backUrlBase}/pago/resultado?status=failure&reservation=${reservation.id}`,
        pending: `${backUrlBase}/pago/resultado?status=pending&reservation=${reservation.id}`
      };
      preferenceBody.auto_return = 'approved';
    }

    // notification_url: solo la incluimos si el backend es HTTPS (producción).
    // En localhost, MP no puede enviar webhooks → usamos check-status en su lugar.
    if (backendBase.startsWith('https://')) {
      (preferenceBody as any).notification_url = `${backendBase}/api/payments/webhook`;
    }

    const preference = new Preference(mpClient);
    const preferenceResponse = await preference.create({ body: preferenceBody });

    res.status(201).json({
      message: 'Preferencia creada',
      data: {
        preferenceId: (preferenceResponse as any).id,
        init_point: (preferenceResponse as any).init_point,
        sandbox_init_point: (preferenceResponse as any).sandbox_init_point,
        reservationId: reservation.id
      }
    });
  } catch (error: any) {
    const mpDetail = error?.message || error?.response?.data?.message || error?.response?.data?.error || 'Error desconocido';
    res.status(500).json({ message: 'Error al crear preferencia', detail: mpDetail });
  }
}

/**
 * GET /api/payments/check-status/:reservationId
 * Busca pagos en MP con external_reference = reservationId.
 * Si encuentra uno aprobado, actualiza la reserva a 'confirmado'.
 * Útil porque en localhost el webhook de MP no puede llegar.
 */
export async function checkStatus(req: Request, res: Response) {
  try {
    if (!mpClient) {
      return res.status(500).json({ message: 'Cliente Mercado Pago no inicializado.' });
    }

    const reservationId = Number(req.params.reservationId);
    if (!reservationId) {
      return res.status(400).json({ message: 'reservationId inválido' });
    }

    const em = orm.em.fork();
    const reservation = await em.findOne(Reservation, { id: reservationId }, { populate: ['flight'] });
    if (!reservation) {
      return res.status(404).json({ message: 'Reserva no encontrada' });
    }

    // Si ya está confirmado/completado, no necesitamos consultar MP
    if (reservation.estado === 'confirmado' || reservation.estado === 'completado') {
      return res.status(200).json({
        message: 'Reserva ya confirmada',
        data: { estado: reservation.estado, paymentStatus: 'approved' }
      });
    }

    // Buscar pagos en MP por external_reference
    const paymentClient = new Payment(mpClient);
    const searchResult = await paymentClient.search({
      options: {
        criteria: 'desc',
        sort: 'date_created',
      },
      body: {
        external_reference: String(reservationId),
      }
    } as any);

    const results = (searchResult as any)?.results || [];
    const approvedPayment = results.find((p: any) => p.status === 'approved');

    if (approvedPayment) {
      await confirmarReserva(reservation, em);
        return res.status(200).json({
        message: 'Pago confirmado',
        data: { estado: 'confirmado', paymentStatus: 'approved' }
      });
    }

    const rejectedPayment = results.find((p: any) => p.status === 'rejected');
    if (rejectedPayment && results.length > 0 && !results.some((p: any) => p.status === 'pending' || p.status === 'in_process')) {
      return res.status(200).json({
        message: 'Pago rechazado',
        data: { estado: reservation.estado, paymentStatus: 'rejected' }
      });
    }

    // Aún pendiente
    return res.status(200).json({
      message: 'Pago pendiente',
      data: { estado: reservation.estado, paymentStatus: results[0]?.status || 'unknown' }
    });

  } catch (error: any) {
    res.status(500).json({ message: 'Error al verificar estado de pago', detail: error?.message });
  }
}

/**
 * POST /api/payments/webhook
 * Mercado Pago sends notifications here. We update the reservation state if approved.
 */
export async function webhook(req: Request, res: Response) {
  try {
    const query = req.query as any;
    const body = req.body as any;

    const topic = query.topic || body.topic || query.type;
    const paymentId = query.id || query['data.id'] || body?.data?.id;

    if (!topic) {
      console.warn('Webhook sin topic:', { query, body });
      return res.status(400).json({ message: 'Webhook sin topic' });
    }

    if (topic !== 'payment') {
      // Ignoramos otros eventos (merchant_order, etc.)
      return res.status(200).json({ message: 'Evento ignorado', topic });
    }

    if (!paymentId) {
      console.warn('Webhook payment sin paymentId', { query, body });
      return res.status(400).json({ message: 'Webhook sin payment id' });
    }

    if (!mpClient) {
      return res.status(500).json({ message: 'Cliente Mercado Pago no inicializado.' });
    }
    const paymentClient = new Payment(mpClient);
  const payment = await paymentClient.get({ id: paymentId });

  const externalRef = (payment as any).external_reference;
  const status = (payment as any).status; // approved, pending, rejected

    if (!externalRef) {
      console.warn('Pago sin external_reference', paymentId);
      return res.status(200).json({ message: 'Pago sin referencia' });
    }

    const reservationId = Number(externalRef);
    const em = orm.em.fork();
    const reservation = await em.findOne(Reservation, { id: reservationId }, { populate: ['flight'] });
    if (!reservation) {
      console.warn('Reserva no encontrada para webhook', reservationId);
      return res.status(200).json({ message: 'Reserva no encontrada, ignorado' });
    }

    // Si deseamos manejar estado pendiente -> confirmado, habría que agregar "pendiente" al tipo Reservation.estado.
    if ((payment as any).status === 'approved') {
      await confirmarReserva(reservation, em);
    } else if ((payment as any).status === 'rejected') {
      // Marcamos como cancelado si fue rechazado
      if (reservation.estado === 'pendiente') {
        reservation.estado = 'cancelado';
        reservation.updatedAt = new Date();
        await em.flush();
      }
    }

    res.status(200).json({ message: 'Webhook procesado', paymentStatus: (payment as any).status });
  } catch (error: any) {
    res.status(500).json({ message: 'Error procesando webhook', error: error.message });
  }
}

async function confirmarReserva(reservation: Reservation, em:any) {
  if (reservation.estado !== 'pendiente') return;

  const flight = reservation.flight as any as Flight;
  const cant = reservation.cantidad_personas || 1;

  if (flight.capacidad_restante >= cant) {
    flight.capacidad_restante -= cant;
  }
  reservation.estado = 'confirmado';
  reservation.updatedAt = new Date();
  await em.flush();
}
