import {Request, Response, NextFunction} from "express"
import { FlightRepository } from "./flight.repository.js"
import { Flight } from "./flight.entity.js"

const repository = new FlightRepository()

function sanitizeFlightInput(req: Request, res: Response, next: NextFunction) {
    req.body.sanitizedInput = {
        CiudadSalida: req.body.CiudadSalida,
        CiudadLlegada: req.body.CiudadLlegada,
        duracion: req.body.duracion,
        tipo: req.body.tipo,
    }
    //mas validaciones acá

    Object.keys(req.body.sanitizedInput).forEach((key)=>{
        if(req.body.sanitizedInput[key] === undefined) {
            delete req.body.sanitizedInput[key]
        }   
    })
    next()
}

function findAll (req:Request, res:Response) {
    res.json({data:repository.findAll()})
}

function findOne(req: Request, res: Response) {
    const id = req.params.id
    const flight = repository.findOne({ id })
    if (!flight){
    res.status(404).send({message:'No encontrado'})
    }
    res.json({data:flight})
}

function add(req: Request, res: Response)  {
    const input = req.body.sanitizedInput
    const flightInput = new Flight(
        input.CiudadSalida, 
        input.CiudadLlegada, 
        input.duracion, 
        input.tipo
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