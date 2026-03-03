# VacationMatch — Backend

API REST para la plataforma VacationMatch, desarrollada con **Express 5.1**, **TypeScript** y **MikroORM 6.4** (MySQL).

## Inicio Rápido

```bash
npm install        # Instalar dependencias
npm run dev        # Iniciar en modo desarrollo (puerto 3000)
npm run build      # Compilar TypeScript
npm start          # Ejecutar build compilado
```

## Configuración

Crear un archivo `.env` en la raíz con las siguientes variables:

```env
DB_URL=mysql://usuario:contraseña@localhost:3306/VuelosApp
TOKEN_SECRET=clave_secreta_para_jwt
```

Ver todas las variables de entorno y la guía completa de instalación en [docs/installation.md](docs/installation.md).

## Documentación

- [Documentación completa de la API](docs/api.md) — Todos los endpoints, request/response, modelos de datos
- [Guía de instalación](docs/installation.md) — Instrucciones paso a paso
- [Integración de pagos](docs/payments.md) — Flujo de Mercado Pago
- [Propuesta del TP](docs/proposal.md) — Alcance y definición del proyecto

## Arquitectura

```
src/
├── app.ts              # Configuración Express, middlewares, rutas
├── destiny/            # Entidad, controller y rutas de destinos
├── flight/             # Entidad, controller y rutas de vuelos
├── reservation/        # Entidad, controller y rutas de reservas
├── favorite/           # Entidad, controller y rutas de favoritos
├── payment/            # Controller y rutas de pagos (Mercado Pago)
├── user/               # Entidad, controller y rutas de usuarios
├── shared/
│   ├── bdd/            # Configuración MikroORM y BaseEntity
│   ├── middleware/     # Autenticación, validación, uploads
│   └── utils/          # Cálculo dinámico de precios
└── types/              # Tipos TypeScript compartidos
```

## Tecnologías

| Tecnología | Uso |
|-----------|-----|
| Express 5.1 | Framework web |
| MikroORM 6.4 | ORM con MySQL driver |
| jsonwebtoken | Autenticación JWT |
| bcryptjs | Hashing de contraseñas |
| Mercado Pago SDK | Procesamiento de pagos |
| multer | Subida de imágenes |
| dotenv | Variables de entorno |

