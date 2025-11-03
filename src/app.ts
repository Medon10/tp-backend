import 'reflect-metadata';
import 'dotenv/config';
import express from 'express';
import cookieParser from 'cookie-parser';
import cors from 'cors';
import path from 'path';
import { fileURLToPath } from 'url';
import { orm, syncSchema } from './shared/bdd/orm.js';
import { RequestContext } from '@mikro-orm/core';

import { flightRouter } from './flight/flight.routes.js';
import { userRouter } from './user/user.routes.js';
import { reservationRouter } from './reservation/reservation.routes.js';
import { destinyRouter } from './destiny/destiny.routes.js';
import { favoriteRouter } from './favorite/favorite.routes.js';

const app = express();
const PORT = 3000;

app.disable('x-powered-by');

app.use(cookieParser());

app.use(cors({
  origin: [
    'http://localhost:5173', 
    'https://vacationmatch.onrender.com'
  ],
  credentials: true,
}));

app.use(express.json());

app.use((req, res, next) => {
  RequestContext.create(orm.em, next);
});


app.use('/api/flights', flightRouter);
app.use('/api/users', userRouter);
app.use('/api/reservations', reservationRouter);
app.use('/api/destinies', destinyRouter);
app.use('/api/favorites', favoriteRouter);


const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const publicPath = path.join(__dirname, '..', 'public');
app.use('/uploads', express.static(path.join(publicPath, 'uploads')));


app.use((req, res) => {
  res.status(404).json({ message: 'Recurso no encontrado' });
});

app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error(err);
  res.status(err.status || 500).json({ message: err.message || 'Error interno del servidor' });
});


syncSchema().then(() => {
  app.listen(PORT, () => {
    console.log(`Servidor corriendo en http://localhost:${PORT}`);
  });
}).catch((error) => {
  console.error('Error al iniciar el servidor:', error);
});