import {Request, Response, NextFunction} from "express"
import { TripRepository } from "./trip.repository.js"
import { Trip } from "./trip.entity.js"

const repository = new TripRepository()

function sanitizeUserInput(req: Request, res: Response, next: NextFunction) {
    req.body.sanitizedInput = {
        fecha_salida: req.body.fecha_salida,
        fecha_llegada: req.body.fecha_llegada,
        estado: req.body.estado,
        usuario_id: req.body.usuario_id,
        destino_id: req.body.destino_id,

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
    const trips = await repository.findAll()
    res.json({data:trips})
}

async function findOne(req: Request, res: Response) {
    const id = req.params.id
    const trip = await repository.findOne({ id })
    if (!trip){
    return res.status(404).send({message:'No encontrado'})
    }
    res.json({data:trip})
}

function add(req: Request, res: Response)  {
    const input = req.body.sanitizedInput
    const tripInput = new Trip(
        input.fecha_salida, 
        input.fecha_llegada,
        input.estado, 
        input.usuario_id, 
        input.destino_id
    )
    const trip = repository.add(tripInput)
    res.status(201).send({message: 'viaje creado', data: trip})
}

function update(req: Request,res: Response) {
    req.body.sanitizedInput.id = req.params.id
    const trip = repository.update(req.body.sanitizedInput)

    if(!trip){
    res.status(404).send({message: 'viaje no encontrado'})
    }
    else {
        res.status(200).send({message: 'viaje actualizado', data: trip})
    }
}

function remove(req: Request, res: Response){
    const id = req.params.id
    const trip = repository.delete({id})

    if(!trip){
        res.status(404).send({message: 'viaje no encontrado'})
    } else{
        res.status(200).send({message: 'viaje borrado'})
    }
}

export {sanitizeUserInput, findAll, findOne, add, update, remove}