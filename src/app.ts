import 'reflect-metadata'
import express from 'express'
import cookieParser from 'cookie-parser'
import { orm, syncSchema } from './shared/bdd/orm.js'
import { RequestContext } from '@mikro-orm/core'
import { flightRouter } from './flight/flight.routes.js'
import { userRouter } from './user/user.routes.js'
import { reservationRouter } from './reservation/reservation.routes.js'
import { destinyRouter } from './destiny/destiny.routes.js'
import path from 'path'
import { fileURLToPath } from 'url'
import { existsSync } from 'fs'
import cors from 'cors'

const app = express()
const PORT = 3000

app.disable('x-powered-by')

// Obtener __dirname en ES modules
const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

// IMPORTANTE: Calcular la ruta correcta a public/
// Si este archivo está en backend/src/app.ts, subimos un nivel
const publicPath = path.join(__dirname, '..', 'public')
const uploadsPath = path.join(publicPath, 'uploads')


if (existsSync(uploadsPath)) {
  const destinosPath = path.join(uploadsPath, 'destinos');

  if (existsSync(destinosPath)) {
    const fs = await import('fs');
    const files = fs.readdirSync(destinosPath);
  }
}
console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')

// CORS - debe ir ANTES de las rutas
app.use(cors({
  origin: 'http://localhost:5173',
  credentials: true,
}))

// Parsers - antes de las rutas
app.use(cookieParser())
app.use(express.json())

// Servir archivos estáticos ANTES de las rutas API
app.use('/uploads', express.static(uploadsPath, {
  setHeaders: (res, filePath) => {
    // Log cada vez que se sirve un archivo
    console.log(' Sirviendo:', filePath.split('uploads')[1])
  },
  fallthrough: false // Si no encuentra el archivo, lanza error 404
}))

// Logging
app.use((req, res, next) => {
  console.log(`${req.method} ${req.url}`)
  next()
})

// MikroORM RequestContext
app.use((req, res, next) => {
  RequestContext.create(orm.em, next)
})

// Ruta raíz
app.get('/', (req, res) => {
  res.json({
    message: 'VacationMatch API funcionando!',
    timestamp: new Date().toISOString(),
    cors: 'Configurado para http://localhost:5173'
  })
})

// Rutas API
app.use('/api/flights', flightRouter)
app.use('/api/users', userRouter)
app.use('/api/reservations', reservationRouter)
app.use('/api/destinies', destinyRouter)

// Middleware 404 - AL FINAL
app.use((req, res) => {
  console.log('404 - Ruta no encontrada:', req.method, req.url)
  res.status(404).json({ 
    message: 'Recurso no encontrado',
    path: req.url
  })
})

// Error handler
app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error(' Error:', err)
  res.status(err.status || 500).json({
    message: err.message || 'Error interno del servidor'
  })
})

async function startServer() {
  try {
    await syncSchema()
    app.listen(PORT, () => {
      console.log(`Servidor corriendo en http://localhost:${PORT}`)
    })
  } catch (error) {
    console.error('❌ Error al iniciar el servidor:', error)
  }
}

startServer()