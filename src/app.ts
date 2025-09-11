import 'reflect-metadata'
import express from 'express'
import { orm, syncSchema } from './shared/bdd/orm.js'
import { RequestContext } from '@mikro-orm/core'
import { flightRouter } from './flight/flight.routes.js'
import { userRouter } from './user/user.routes.js'
import { reservationRouter } from './reservation/reservation.routes.js'
import { destinyRouter } from './destiny/destiny.routes.js'

const app = express()
const PORT = 3000
//middleware
app.use(express.json())

// Create MikroORM RequestContext for each request
app.use((req, res, next) => {
    RequestContext.create(orm.em, next)
})

//API routes
app.use('/api/flights', flightRouter)
app.use('/api/users', userRouter) 
app.use('/api/reservations', reservationRouter)
app.use('/api/destiny', destinyRouter)


async function startServer() {
    try {
        await syncSchema(); // Sync database schema
        app.listen(PORT, () => {
        console.log(`Servidor corriendo en http://localhost:${PORT}`);
        });
        } catch (error) {
        console.error('Error al iniciar el servidor:', error);
    }
}
startServer();
