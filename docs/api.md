# Documentación de la API — VacationMatch

## Información General

| Aspecto | Detalle |
|---------|---------|
| **Base URL** | `http://localhost:3000/api` |
| **Formato** | JSON (`Content-Type: application/json`) |
| **Autenticación** | JWT vía cookie httpOnly (`token`) o header `Authorization: Bearer <token>` |
| **Roles** | `cliente` (por defecto) · `admin` |

---

## Autenticación

### Cómo funciona

1. El usuario hace `POST /api/users/login` con email y contraseña.
2. El backend valida las credenciales y devuelve un **JWT** en:
   - Una **cookie httpOnly** llamada `token` (1 hora de expiración).
   - El campo `token` del body de la respuesta (como fallback).
3. Las rutas protegidas verifican el token mediante el middleware `verifyToken`.
4. Las rutas de administrador agregan el middleware `verifyAdmin` que verifica `rol === 'admin'`.

### Niveles de acceso

| Nivel | Descripción | Ejemplo de rutas |
|-------|-------------|------------------|
| **Público** | Sin autenticación requerida | `GET /api/destinies`, `POST /api/users/login`, `POST /api/flights/buscar` |
| **Usuario autenticado** | Requiere `verifyToken` | `GET /api/reservations/misviajes`, `POST /api/favorites`, `GET /api/users/profile/me` |
| **Administrador** | Requiere `verifyToken` + `verifyAdmin` | `POST /api/destinies`, `DELETE /api/flights/:id` |

---

## Endpoints

### Destinos (`/api/destinies`)

#### `GET /api/destinies/` — Listar destinos

- **Autenticación:** Ninguna
- **Respuesta exitosa (200):**
  ```json
  {
    "data": [
      {
        "id": 1,
        "nombre": "Cancún",
        "imagen": "/uploads/destinos/cancun.jpg",
        "transporte": ["Avión", "Bus"],
        "actividades": ["Playa", "Snorkel"],
        "createdAt": "2025-01-15T10:00:00.000Z",
        "updatedAt": "2025-01-15T10:00:00.000Z"
      }
    ]
  }
  ```
- **Error (500):** `{ "message": "Error al obtener destinos" }`

---

#### `GET /api/destinies/:id` — Obtener un destino

- **Autenticación:** Ninguna
- **Parámetros URL:** `id` (number) — ID del destino
- **Respuesta exitosa (200):**
  ```json
  {
    "message": "Destino encontrado",
    "data": { "id": 1, "nombre": "Cancún", "imagen": "...", "transporte": [...], "actividades": [...] }
  }
  ```
- **Error (404):** `{ "message": "No encontrado" }`

---

#### `POST /api/destinies/` — Crear destino

- **Autenticación:** `verifyToken` + `verifyAdmin`
- **Middleware:** `sanitizeDestinyInput`
- **Body:**
  ```json
  {
    "nombre": "Cancún",
    "transporte": ["Avión", "Bus"],
    "actividades": ["Playa", "Snorkel"]
  }
  ```
  | Campo | Tipo | Requerido | Descripción |
  |-------|------|-----------|-------------|
  | `nombre` | string | **Sí** | Nombre del destino (único) |
  | `transporte` | string[] | No | Medios de transporte disponibles |
  | `actividades` | string[] | No | Actividades turísticas disponibles |

- **Respuesta exitosa (201):**
  ```json
  { "message": "Destino creado exitosamente", "data": { "id": 1, "nombre": "Cancún", ... } }
  ```
- **Errores:**
  - `400` — `"El nombre del destino es obligatorio."`
  - `409` — `"Ya existe un destino con este nombre."`

---

#### `POST /api/destinies/:id/upload` — Subir imagen de destino

- **Autenticación:** `verifyToken` + `verifyAdmin`
- **Content-Type:** `multipart/form-data`
- **Body:** Campo `imagen` con archivo de imagen (JPEG, PNG o WEBP, máximo 5MB)
- **Respuesta exitosa (200):**
  ```json
  { "message": "Imagen actualizada", "data": { "id": 1, "nombre": "Cancún", "imagen": "/uploads/destinos/1234-cancun.jpg", ... } }
  ```
- **Errores:**
  - `400` — `"No se recibió ninguna imagen"`
  - `404` — `"Destino no encontrado"`

---

#### `PUT /api/destinies/:id` — Actualizar destino

- **Autenticación:** `verifyToken` + `verifyAdmin`
- **Middleware:** `sanitizeDestinyInput`
- **Parámetros URL:** `id` (number)
- **Body:** Mismos campos que crear (todos opcionales)
- **Respuesta exitosa (200):** `{ "message": "destino actualizado", "data": { ... } }`
- **Error (404):** `{ "message": "destino no encontrado" }`

---

#### `PATCH /api/destinies/:id` — Actualización parcial de destino

- Igual que `PUT` (mismo handler, misma funcionalidad).

---

#### `DELETE /api/destinies/:id` — Eliminar destino

- **Autenticación:** `verifyToken` + `verifyAdmin`
- **Parámetros URL:** `id` (number)
- **Respuesta exitosa (200):** `{ "message": "destino borrado", "data": { ... } }`
- **Error (404):** `{ "message": "destino no encontrado" }`

---

### Vuelos (`/api/flights`)

#### `GET /api/flights/` — Listar vuelos

- **Autenticación:** Ninguna
- **Respuesta exitosa (200):**
  ```json
  {
    "data": [
      {
        "id": 1,
        "fechahora_salida": "2026-06-15T10:00:00.000Z",
        "fechahora_llegada": "2026-06-15T14:00:00.000Z",
        "duracion": 240,
        "aerolinea": "Aerolíneas Argentinas",
        "cantidad_asientos": 180,
        "capacidad_restante": 150,
        "montoVuelo": 50000,
        "origen": "Buenos Aires",
        "distancia_km": 2500,
        "destino": { "id": 1, "nombre": "Cancún", ... }
      }
    ]
  }
  ```

---

#### `GET /api/flights/:id` — Obtener un vuelo

- **Autenticación:** Ninguna
- **Parámetros URL:** `id` (number)
- **Respuesta exitosa (200):** `{ "data": { ... } }`
- **Error (404):** `{ "message": "No encontrado" }`

---

#### `GET /api/flights/destino/:destinoId` — Vuelos por destino

- **Autenticación:** Ninguna
- **Parámetros URL:** `destinoId` (number) — ID del destino
- **Descripción:** Devuelve vuelos **futuros** para un destino específico, con precio dinámico calculado.
- **Respuesta exitosa (200):**
  ```json
  {
    "message": "Vuelos encontrados",
    "cantidad": 3,
    "data": [
      {
        "id": 1,
        "origen": "Buenos Aires",
        "destino": { "id": 1, "nombre": "Cancún", "imagen": "...", "transporte": [...], "actividades": [...] },
        "fechahora_salida": "2026-06-15T10:00:00.000Z",
        "fechahora_llegada": "2026-06-15T14:00:00.000Z",
        "duracion": 240,
        "capacidad_restante": 150,
        "precio_por_persona": 75000,
        "distancia_aproximada": 2500,
        "cantidad_asientos": 180,
        "aerolinea": "Aerolíneas Argentinas"
      }
    ]
  }
  ```
- **Error (400):** `{ "message": "ID de destino inválido" }`

---

#### `POST /api/flights/buscar` — Buscar vuelos por presupuesto

- **Autenticación:** Ninguna
- **Middleware:** `sanitizeFlightSearch`
- **Body:**
  ```json
  {
    "presupuesto": 200000,
    "personas": 2,
    "origen": "Buenos Aires",
    "fecha_salida": "2026-06-01"
  }
  ```
  | Campo | Tipo | Requerido | Descripción |
  |-------|------|-----------|-------------|
  | `presupuesto` | number | **Sí** | Presupuesto máximo total |
  | `personas` | number | **Sí** | Cantidad de personas (1-10) |
  | `origen` | string | **Sí** | Ciudad de origen |
  | `fecha_salida` | string | No | Fecha mínima de salida (ISO) |

- **Descripción:** Busca vuelos que encajen dentro del presupuesto. El precio se calcula dinámicamente considerando distancia, ocupación y anticipación. Solo devuelve vuelos cuyo `precioTotal` ≤ `presupuesto`.
- **Respuesta exitosa (200):**
  ```json
  {
    "message": "Vuelos encontrados",
    "resultados": 5,
    "presupuesto_maximo": 200000,
    "personas": 2,
    "origen": "Buenos Aires",
    "data": [
      {
        "id": 1,
        "origen": "Buenos Aires",
        "destino": { "id": 1, "nombre": "Cancún", "imagen": "..." },
        "fecha_hora": "2026-06-15T10:00:00.000Z",
        "capacidad_restante": 150,
        "precio_por_persona": 75000,
        "precio_total": 150000,
        "personas": 2,
        "distancia_aproximada": 2500
      }
    ]
  }
  ```
- **Errores:**
  - `400` — `"Faltan parámetros: presupuesto, personas y origen son requeridos"`
  - `400` — `"La cantidad de personas debe estar entre 1 y 10"`

---

#### `POST /api/flights/` — Crear vuelo

- **Autenticación:** `verifyToken` + `verifyAdmin`
- **Middleware:** `sanitizeFlightInput`
- **Body:**
  ```json
  {
    "fechahora_salida": "2026-06-15T10:00:00.000Z",
    "fechahora_llegada": "2026-06-15T14:00:00.000Z",
    "duracion": 240,
    "aerolinea": "Aerolíneas Argentinas",
    "cantidad_asientos": 180,
    "montoVuelo": 50000,
    "origen": "Buenos Aires",
    "destino_id": 1,
    "distancia_km": 2500,
    "capacidad_restante": 180
  }
  ```
  | Campo | Tipo | Requerido | Descripción |
  |-------|------|-----------|-------------|
  | `fechahora_salida` | string (ISO) | **Sí** | Fecha y hora de salida |
  | `fechahora_llegada` | string (ISO) | **Sí** | Fecha y hora de llegada |
  | `duracion` | number | **Sí** | Duración en minutos |
  | `aerolinea` | string | **Sí** | Nombre de la aerolínea |
  | `cantidad_asientos` | number | **Sí** | Asientos totales |
  | `montoVuelo` | number | **Sí** | Monto base del vuelo |
  | `origen` | string | **Sí** | Ciudad de origen |
  | `destino_id` | number | **Sí** | ID del destino (FK) |
  | `distancia_km` | number | No | Distancia en kilómetros |
  | `capacidad_restante` | number | No | Asientos disponibles (default = cantidad_asientos) |

- **Respuesta exitosa (201):**
  ```json
  {
    "message": "Vuelo creado exitosamente",
    "data": { "id": 1, "fechahora_salida": "...", "destino": { "id": 1, "nombre": "Cancún" }, ... }
  }
  ```
- **Errores:**
  - `400` — `"destino_id es requerido"`
  - `400` — `"Destino con ID X no encontrado"`

---

#### `PUT /api/flights/:id` — Actualizar vuelo

- **Autenticación:** `verifyToken` + `verifyAdmin`
- **Middleware:** `sanitizeFlightInput`
- **Parámetros URL:** `id` (number)
- **Body:** Mismos campos que crear (todos opcionales). Si se envía `destino_id`, se re-vincula la relación.
- **Respuesta exitosa (200):** `{ "message": "Vuelo actualizado exitosamente", "data": { ... } }`
- **Errores:**
  - `404` — `"vuelo no encontrado"`
  - `400` — `"Destino no encontrado"` (si `destino_id` inválido)

---

#### `PATCH /api/flights/:id` — Actualización parcial de vuelo

- Igual que `PUT` (mismo handler).

---

#### `DELETE /api/flights/:id` — Eliminar vuelo

- **Autenticación:** `verifyToken` + `verifyAdmin`
- **Parámetros URL:** `id` (number)
- **Respuesta exitosa (200):** `{ "message": "vuelo borrado", "data": { ... } }`
- **Error (404):** `{ "message": "vuelo no encontrado" }`

---

### Reservas (`/api/reservations`)

#### `GET /api/reservations/misviajes` — Mis viajes

- **Autenticación:** `verifyToken`
- **Descripción:** Devuelve todas las reservas del usuario autenticado con datos del vuelo y destino. Calcula flags `isPast` (si el vuelo ya pasó) y `canCancel` (si es cancelable). Ordenadas por fecha de reserva descendente.
- **Respuesta exitosa (200):**
  ```json
  {
    "message": "Reservas encontradas",
    "cantidad": 3,
    "data": [
      {
        "id": 1,
        "fecha_reserva": "2026-01-20",
        "valor_reserva": 150000,
        "estado": "confirmado",
        "cantidad_personas": 2,
        "isPast": false,
        "canCancel": true,
        "flight": {
          "id": 1,
          "origen": "Buenos Aires",
          "fechahora_salida": "2026-06-15T10:00:00.000Z",
          "fechahora_llegada": "2026-06-15T14:00:00.000Z",
          "aerolinea": "Aerolíneas Argentinas",
          "destino": { "id": 1, "nombre": "Cancún", "imagen": "..." }
        }
      }
    ]
  }
  ```

---

#### `PATCH /api/reservations/:id/cancel` — Cancelar reserva

- **Autenticación:** `verifyToken`
- **Parámetros URL:** `id` (number) — ID de la reserva
- **Descripción:** Cancela una reserva del usuario autenticado. Valida que no esté ya cancelada, no esté completada, y el vuelo no haya partido.
- **Respuesta exitosa (200):** `{ "message": "Reserva cancelada exitosamente", "data": { ... } }`
- **Errores:**
  - `404` — `"Reserva no encontrada"`
  - `400` — `"La reserva ya está cancelada"`
  - `400` — `"No se puede cancelar un viaje completado"`
  - `400` — `"No se puede cancelar un viaje que ya pasó"`

---

#### `GET /api/reservations/` — Listar todas las reservas

- **Autenticación:** `verifyToken`
- **Respuesta exitosa (200):** `{ "message": "Reservas encontradas", "data": [...] }`

---

#### `GET /api/reservations/:id` — Obtener una reserva

- **Autenticación:** `verifyToken`
- **Parámetros URL:** `id` (number)
- **Respuesta exitosa (200):** `{ "message": "Reserva encontrada", "data": { ... } }`
- **Error (404):** `{ "message": "No encontrado" }`

---

#### `POST /api/reservations/` — Crear reserva

- **Autenticación:** `verifyToken`
- **Middleware:** `sanitizeReservationInput`
- **Body:**
  ```json
  {
    "flight_id": 1,
    "cantidad_personas": 2
  }
  ```
  | Campo | Tipo | Requerido | Descripción |
  |-------|------|-----------|-------------|
  | `flight_id` | number | **Sí** | ID del vuelo a reservar |
  | `cantidad_personas` | number | **Sí** | Cantidad de personas (1-10) |

- **Descripción:** Crea una reserva con estado `pendiente`. Valida existencia del vuelo, disponibilidad de asientos, vuelo futuro. El precio se calcula dinámicamente con `calcularPrecio()`.
- **Respuesta exitosa (201):**
  ```json
  {
    "message": "Reserva creada exitosamente",
    "data": {
      "id": 1,
      "vuelo": { "id": 1, "origen": "Buenos Aires", "destino": "Cancún", "fecha_salida": "..." },
      "cantidad_personas": 2,
      "precio_total": 150000,
      "estado": "pendiente"
    }
  }
  ```
- **Errores:**
  - `400` — `"ID de vuelo y cantidad de personas son requeridos"`
  - `400` — `"La cantidad de personas debe estar entre 1 y 10"`
  - `400` — `"No hay suficientes asientos disponibles. Quedan X asientos."`
  - `400` — `"No se puede reservar un vuelo que ya partió"`
  - `404` — `"Vuelo no encontrado"`

---

#### `PUT /api/reservations/:id` — Actualizar reserva

- **Autenticación:** `verifyToken`
- **Middleware:** `sanitizeReservationInput`
- **Parámetros URL:** `id` (number)
- **Respuesta exitosa (200):** `{ "message": "reserva actualizada", "data": { ... } }`
- **Error (404):** `{ "message": "reserva no encontrada" }`

---

#### `PATCH /api/reservations/:id` — Actualización parcial de reserva

- Igual que `PUT` (mismo handler).

---

#### `DELETE /api/reservations/:id` — Eliminar reserva

- **Autenticación:** `verifyToken`
- **Parámetros URL:** `id` (number)
- **Respuesta exitosa (200):** `{ "message": "reserva borrada" }`
- **Error (404):** `{ "message": "reserva no encontrada" }`

---

### Usuarios (`/api/users`)

#### `GET /api/users/test` — Health check

- **Autenticación:** Ninguna
- **Respuesta (200):** `{ "message": "Server is working!", "timestamp": "2026-02-24T12:00:00.000Z" }`

---

#### `POST /api/users/login` — Iniciar sesión

- **Autenticación:** Ninguna
- **Middleware:** `sanitizeLoginInput`
- **Body:**
  ```json
  {
    "email": "usuario@email.com",
    "password": "micontraseña"
  }
  ```
- **Descripción:** Autentica al usuario. Devuelve JWT en el body y lo setea como cookie httpOnly (1h de expiración). La cookie se configura con `SameSite=None; Secure` en producción.
- **Respuesta exitosa (200):**
  ```json
  {
    "message": "Login exitoso",
    "user": { "id": 1, "nombre": "Juan", "apellido": "Pérez", "email": "usuario@email.com", "rol": "cliente" },
    "token": "eyJhbGciOiJIUzI1NiIs..."
  }
  ```
- **Errores:**
  - `400` — `"Email y contraseña son requeridos"`
  - `404` — `"Usuario no encontrado"`
  - `401` — `"Contraseña incorrecta"`

---

#### `POST /api/users/signup` — Registrarse

- **Autenticación:** Ninguna
- **Middleware:** `sanitizeUserInput`
- **Body:**
  ```json
  {
    "nombre": "Juan",
    "apellido": "Pérez",
    "email": "usuario@email.com",
    "password": "micontraseña",
    "telefono": "3415551234"
  }
  ```
  | Campo | Tipo | Requerido | Validación |
  |-------|------|-----------|------------|
  | `nombre` | string | **Sí** | — |
  | `apellido` | string | **Sí** | — |
  | `email` | string | **Sí** | Formato email válido, único |
  | `password` | string | **Sí** | Mínimo 6 caracteres. Se hashea con bcrypt (10 rounds) |
  | `telefono` | string | No | Único |

- **Respuesta exitosa (201):**
  ```json
  {
    "message": "Usuario registrado exitosamente",
    "user": { "id": 1, "nombre": "Juan", "apellido": "Pérez", "email": "usuario@email.com", "rol": "cliente" }
  }
  ```
- **Errores:**
  - `400` — `"Email es requerido"` / `"Contraseña es requerida"` / `"Formato de email inválido"` / `"La contraseña debe tener al menos 6 caracteres"`
  - `409` — `"Este email ya está registrado"`

---

#### `POST /api/users/logout` — Cerrar sesión

- **Autenticación:** Ninguna
- **Descripción:** Limpia la cookie `token`.
- **Respuesta exitosa (200):** `{ "message": "Logout exitoso" }`

---

#### `GET /api/users/` — Listar usuarios

- **Autenticación:** `verifyToken`
- **Respuesta exitosa (200):** `{ "message": "Usuarios encontrados", "data": [...] }`

---

#### `GET /api/users/:id` — Obtener un usuario

- **Autenticación:** `verifyToken`
- **Parámetros URL:** `id` (number)
- **Respuesta exitosa (200):** `{ "message": "Usuario encontrado", "data": { ... } }`

---

#### `GET /api/users/profile/me` — Mi perfil

- **Autenticación:** `verifyToken`
- **Descripción:** Devuelve el perfil del usuario autenticado (basado en el JWT).
- **Respuesta exitosa (200):** `{ "message": "Usuario autenticado", "data": { "id": 1, "nombre": "...", "email": "...", "rol": "..." } }`
- **Error (404):** `{ "message": "Usuario no encontrado" }`

---

#### `GET /api/users/profile/stats` — Estadísticas del usuario

- **Autenticación:** `verifyToken`
- **Descripción:** Devuelve estadísticas del usuario: viajes completados, próximos viajes, próximo viaje más cercano, antigüedad como miembro.
- **Respuesta exitosa (200):**
  ```json
  {
    "message": "Estadísticas del usuario",
    "data": {
      "viajesCompletados": 5,
      "proximosViajes": 2,
      "proximoViaje": {
        "id": 3,
        "destino": "Cancún",
        "fecha_vuelo": "2026-06-15T10:00:00.000Z",
        "precio_total": 150000
      },
      "miembroDesde": "enero 2025",
      "aniosComoMiembro": "1 año",
      "aniosNumerico": 1.1
    }
  }
  ```
- **Error (404):** `{ "message": "Usuario no encontrado" }`

---

#### `PUT /api/users/profile/update` — Actualizar mi perfil

- **Autenticación:** `verifyToken`
- **Middleware:** `sanitizeUserInput` (rama profile-update)
- **Body:**
  ```json
  {
    "nombre": "Juan Carlos",
    "apellido": "Pérez López"
  }
  ```
- **Descripción:** Solo permite actualizar nombre y apellido del usuario autenticado.
- **Respuesta exitosa (200):**
  ```json
  {
    "message": "Perfil actualizado correctamente",
    "data": { "id": 1, "nombre": "Juan Carlos", "apellido": "Pérez López", "email": "usuario@email.com" }
  }
  ```
- **Errores:**
  - `400` — `"Debes proporcionar al menos el nombre o apellido para actualizar"`
  - `404` — `"Usuario no encontrado"`

---

#### `PUT /api/users/:id` — Actualizar usuario por ID

- **Autenticación:** `verifyToken`
- **Middleware:** `sanitizeUserInput`
- **Parámetros URL:** `id` (number)
- **Body:** `{ nombre?, apellido?, email?, password?, telefono? }`
- **Respuesta exitosa (200):** `{ "message": "Usuario actualizado", "data": { ... } }`

---

#### `PATCH /api/users/:id` — Actualización parcial de usuario

- Igual que `PUT /:id` (mismo handler).

---

#### `DELETE /api/users/:id` — Eliminar usuario

- **Autenticación:** `verifyToken`
- **Parámetros URL:** `id` (number)
- **Respuesta exitosa (200):** `{ "message": "Usuario borrado" }`
- **Error (404):** `{ "message": "Usuario no encontrado" }`

---

### Favoritos (`/api/favorites`)

> **Todas las rutas de favoritos** requieren `verifyToken` (aplicado a nivel del router).

#### `GET /api/favorites/` — Listar mis favoritos

- **Autenticación:** `verifyToken`
- **Descripción:** Devuelve los vuelos favoritos del usuario autenticado con precio dinámico calculado. Incluye datos del vuelo y destino. Ordenados por más reciente.
- **Respuesta exitosa (200):**
  ```json
  {
    "message": "Favoritos encontrados",
    "cantidad": 3,
    "data": [
      {
        "id": 1,
        "fecha_guardado": "2026-01-20T10:00:00.000Z",
        "vuelo": {
          "id": 1,
          "origen": "Buenos Aires",
          "destino": { "id": 1, "nombre": "Cancún", "imagen": "...", "transporte": [...], "actividades": [...] },
          "fechahora_salida": "2026-06-15T10:00:00.000Z",
          "fechahora_llegada": "2026-06-15T14:00:00.000Z",
          "aerolinea": "Aerolíneas Argentinas",
          "duracion": 240,
          "capacidad_restante": 150,
          "precio_por_persona": 75000,
          "distancia_aproximada": 2500
        }
      }
    ]
  }
  ```

---

#### `POST /api/favorites/` — Agregar a favoritos

- **Autenticación:** `verifyToken`
- **Middleware:** `sanitizeFavoriteInput`
- **Body:**
  ```json
  { "flight_id": 1 }
  ```
- **Respuesta exitosa (201):** `{ "message": "Agregado a favoritos", "data": { ... } }`
- **Errores:**
  - `409` — `"Este vuelo ya está en favoritos"`
  - `404` — `"Vuelo no encontrado"`

---

#### `DELETE /api/favorites/:flightId` — Quitar de favoritos

- **Autenticación:** `verifyToken`
- **Parámetros URL:** `flightId` (number) — ID del **vuelo** (no del favorito)
- **Respuesta exitosa (200):** `{ "message": "Eliminado de favoritos" }`
- **Error (404):** `{ "message": "No está en favoritos" }`

---

#### `GET /api/favorites/check/:flightId` — Verificar si es favorito

- **Autenticación:** `verifyToken`
- **Parámetros URL:** `flightId` (number)
- **Respuesta exitosa (200):** `{ "isFavorite": true }`

---

### Pagos (`/api/payments`)

#### `POST /api/payments/create-preference` — Crear preferencia de pago

- **Autenticación:** `verifyToken`
- **Body:**
  ```json
  { "reservationId": 1 }
  ```
- **Descripción:** Crea una preferencia de pago en Mercado Pago vinculada a una reserva existente. Devuelve la URL de checkout para redirigir al usuario.
- **Respuesta exitosa (201):**
  ```json
  {
    "message": "Preferencia creada",
    "data": {
      "preferenceId": "1234567890-abcdef",
      "init_point": "https://www.mercadopago.com.ar/checkout/v1/redirect?pref_id=...",
      "sandbox_init_point": "https://sandbox.mercadopago.com.ar/checkout/v1/redirect?pref_id=...",
      "reservationId": 1
    }
  }
  ```
- **Errores:**
  - `400` — `"reservationId requerido"`
  - `404` — `"Reserva no encontrada"`
  - `500` — `"Mercado Pago no configurado (falta MP_ACCESS_TOKEN)."`

---

#### `POST /api/payments/webhook` — Webhook de Mercado Pago

- **Autenticación:** Ninguna (server-to-server desde MP)
- **Descripción:** Recibe notificaciones de Mercado Pago. Si el pago fue aprobado, actualiza la reserva a `confirmado` y reduce la capacidad del vuelo. Si fue rechazado, marca la reserva como `cancelado`.
- **Respuesta exitosa (200):** `{ "message": "Webhook procesado", "paymentStatus": "approved" }`
- **Errores:**
  - `400` — `"Webhook sin topic"`
  - `400` — `"Webhook sin payment id"`

---

## Modelos de Datos (Entidades)

Todas las entidades heredan de `BaseEntity`: `id` (PK autoincrement), `createdAt` (Date), `updatedAt` (Date).

### Destiny (`destinies`)

| Campo | Tipo | Requerido | Descripción |
|-------|------|-----------|-------------|
| `nombre` | string | Sí | Nombre del destino |
| `imagen` | string | No | Ruta de la imagen subida |
| `transporte` | string[] (JSON) | No | Medios de transporte |
| `actividades` | string[] (JSON) | No | Actividades disponibles |

**Relaciones:** `OneToMany` → Flight (cascade persist+remove)

### Flight (`flights`)

| Campo | Tipo | Requerido | Descripción |
|-------|------|-----------|-------------|
| `fechahora_salida` | Date | Sí | Fecha/hora de salida |
| `fechahora_llegada` | Date | Sí | Fecha/hora de llegada |
| `duracion` | number | Sí | Duración en minutos |
| `aerolinea` | string | Sí | Aerolínea |
| `cantidad_asientos` | number | Sí | Asientos totales |
| `capacidad_restante` | number | Sí | Asientos disponibles |
| `montoVuelo` | number | Sí | Monto base |
| `origen` | string | Sí | Ciudad de origen |
| `distancia_km` | number | No | Distancia en km |

**Relaciones:** `ManyToOne` → Destiny · `OneToMany` → Reservation · `OneToMany` → Favorite

### User (`users`)

| Campo | Tipo | Requerido | Descripción |
|-------|------|-----------|-------------|
| `nombre` | string | Sí | Nombre |
| `apellido` | string | Sí | Apellido |
| `email` | string | Sí | Email (único) |
| `password` | string | Sí | Contraseña hasheada (oculta en serialización) |
| `rol` | `'cliente'` \| `'admin'` | No | Rol del usuario (default: `'cliente'`) |
| `telefono` | string | No | Teléfono (único) |

**Relaciones:** `OneToMany` → Reservation · `OneToMany` → Favorite

### Reservation (`reservations`)

| Campo | Tipo | Requerido | Descripción |
|-------|------|-----------|-------------|
| `fecha_reserva` | string (ISO) | Sí | Fecha de creación de la reserva |
| `valor_reserva` | number | Sí | Precio total calculado |
| `estado` | `'pendiente'` \| `'confirmado'` \| `'cancelado'` \| `'completado'` | Sí | Estado actual |
| `cantidad_personas` | number | No | Pasajeros |

**Relaciones:** `ManyToOne` → User · `ManyToOne` → Flight

### Favorite (`favorites`)

| Campo | Tipo | Requerido | Descripción |
|-------|------|-----------|-------------|
| — | — | — | Solo contiene relaciones y campos de BaseEntity |

**Relaciones:** `ManyToOne` → Flight · `ManyToOne` → User

---

## Cálculo Dinámico de Precios

La función `calcularPrecio(vuelo, origen, personas)` en `src/shared/utils/precio.ts` aplica 3 factores al monto base:

1. **Factor distancia:** +$0.10 por km
2. **Factor ocupación:**
   - ≥ 80% ocupado → ×1.5
   - ≥ 60% ocupado → ×1.3
   - ≥ 40% ocupado → ×1.15
3. **Factor anticipación:**
   - ≤ 7 días → ×1.4
   - ≤ 30 días → ×1.3
   - ≤ 60 días → ×1.2

**Resultado:** `{ precioPorPersona, precioTotal }` donde `precioTotal = precioPorPersona × personas`.

---

## Códigos de Error Comunes

| Código | Significado |
|--------|-------------|
| `200` | Operación exitosa |
| `201` | Recurso creado exitosamente |
| `400` | Error de validación en los datos enviados |
| `401` | No autenticado / contraseña incorrecta |
| `403` | Sin permisos (token inválido o no es admin) |
| `404` | Recurso no encontrado |
| `409` | Conflicto (recurso duplicado) |
| `500` | Error interno del servidor |

---

## Archivos Estáticos

Las imágenes de destinos se sirven desde `GET /uploads/destinos/<filename>` como archivos estáticos.
