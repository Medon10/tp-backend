import express, { NextFunction, Request, Response } from 'express'
import { flightRouter } from './flight/flight.routes.js'
import { userRouter } from './user/user.routes.js' 

const app = express()

app.use(express.json())
app.use('/api/flights',flightRouter)
app.use('/api/users', userRouter)
app.use((req,res)=> {
    res.status(404).send({message: 'Recurso no encontrado'})
})


app.listen(3000, ()=>{
    console.log('server running on http://localhost:3000/')
})