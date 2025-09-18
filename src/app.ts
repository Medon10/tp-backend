import 'reflect-metadata'
import express from 'express'
import cookieParser from 'cookie-parser'
import { orm, syncSchema } from './shared/bdd/orm.js'
import { RequestContext } from '@mikro-orm/core'
import { flightRouter } from './flight/flight.routes.js'
import { userRouter } from './user/user.routes.js'
import { reservationRouter } from './reservation/reservation.routes.js'
import { destinyRouter } from './destiny/destiny.routes.js'

const app = express()
const PORT = 3000

// En tu app.ts, reemplaza el middleware CORS con esto:

app.disable('x-powered-by');

// Middleware CORS 
app.use((req, res, next) => {
  console.log(`Intercepted: ${req.method} ${req.url}`);
  
  res.header('Access-Control-Allow-Origin', 'http://localhost:5173');
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, PATCH, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization, Cookie');
  res.header('Access-Control-Allow-Credentials', 'true');
  
  if (req.method === 'OPTIONS') {
    console.log('Handling OPTIONS for:', req.url);
    return res.status(200).end();
  }
  
  next();
});


app.use(cookieParser());
app.use(express.json());

app.use((req, res, next) => {
  console.log(`${req.method} ${req.url} - Origin: ${req.get('Origin')}`);
  next();
});

// MikroORM RequestContext
app.use((req, res, next) => {
  RequestContext.create(orm.em, next);
});

// Rutas
app.get('/', (req, res) => {
  res.json({
    message: 'VacationMatch API funcionando!',
    timestamp: new Date().toISOString(),
    cors: 'Configurado para http://localhost:5173'
  });
});

app.use('/api/flights', flightRouter);
app.use('/api/users', userRouter);
app.use('/api/reservations', reservationRouter);
app.use('/api/destiny', destinyRouter);

async function startServer() {
  try {
    await syncSchema();
    app.listen(PORT, () => {
      console.log(` Servidor corriendo en http://localhost:${PORT}`);
      console.log(` CORS configurado para: http://localhost:5173`);
    });
  } catch (error) {
    console.error('❌ Error al iniciar el servidor:', error);
  }
}

startServer();