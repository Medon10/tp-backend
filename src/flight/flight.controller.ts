import {Request, Response, NextFunction} from "express"
import { FlightRepository } from "./flight.repository.js"
import { Flight } from "./flight.entity.js"

const repository = new FlightRepository()

function sanitizeFlightInput(req: Request, res: Response, next: NextFunction) {
    req.body.sanitizedInput = {
        fechahora_salida: req.body.fechahora_salida,
        fechahora_llegada: req.body.fechahora_llegada,
        duracion: req.body.duracion,
        aerolinea: req.body.aerolinea,
        cantidad_asientos: req.body.cantidad_asientos
    }
    //mas validaciones acá

    Object.keys(req.body.sanitizedInput).forEach((key)=>{
        if(req.body.sanitizedInput[key] === undefined) {
            delete req.body.sanitizedInput[key]
        }   
    })
    next()
}

async function findAll (req:Request, res:Response) {
    const flights = await repository.findAll()
    res.json({data:flights})
}

async function findOne(req: Request, res: Response) {
    const id = req.params.id
    const flight = await repository.findOne({ id })
    if (!flight){
    return res.status(404).send({message:'No encontrado'})
    }
    res.json({data:flight})
}

function add(req: Request, res: Response)  {
    const input = req.body.sanitizedInput
    const flightInput = new Flight(
        input.fechahora_salida, 
        input.fechahora_llegada, 
        input.duracion, 
        input.aerolinea,
        input.cantidad_asientos
    )
    const flight = repository.add(flightInput)
    res.status(201).send({message: 'vuelo creado', data: flight})
}

function update(req: Request,res: Response) {
    req.body.sanitizedInput.id = req.params.id
    const flight = repository.update(req.body.sanitizedInput)
    
    if(!Flight){
    res.status(404).send({message: 'vuelo no encontrado'})
    }
    else {
        res.status(200).send({message: 'vuelo actualizado', data: flight})
    }
}

function remove(req: Request, res: Response){
    const id = req.params.id
    const flight = repository.delete({id})

    if(!Flight){
        res.status(404).send({message: 'vuelo no encontrado'})
    } else{
        res.status(200).send({message: 'vuelo borrado'})
    }
}

export {sanitizeFlightInput, findAll, findOne, add, update, remove}