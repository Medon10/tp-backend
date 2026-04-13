# Integración de Pagos (Mercado Pago)


## 1. Flujo de Pago Implementado
1. Usuario abre modal y confirma reserva.
2. Backend crea la reserva (`/api/reservations`).
3. Frontend solicita creación de preferencia (`/api/payments/create-preference`).
4. Se recibe `init_point` y se redirige al checkout de Mercado Pago.
5. Mercado Pago envía webhook a `/api/payments/webhook` con el estado del pago.
6. Backend puede actualizar el estado de la reserva.
7. Usuario vuelve vía `back_urls` a `/pago/resultado`.

## 2. Endpoint: Crear Preferencia
POST `/api/payments/create-preference`
Body:
```json
{ "reservationId": 123 }
```
Respuesta:
```json
{
  "message": "Preferencia creada",
  "data": {
    "preferenceId": "XXX",
    "init_point": "https://www.mercadopago.com/...",
    "sandbox_init_point": "https://sandbox.mercadopago.com/...",
    "reservationId": 123
  }
}
```

## 3. Webhook
POST `/api/payments/webhook`
- Mercado Pago enviará diferentes eventos. Se procesa solo `topic=payment`.
- Actualiza la reserva a `confirmado` si el pago está `approved`.