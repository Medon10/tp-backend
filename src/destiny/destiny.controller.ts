import {Request, Response, NextFunction} from "express"
import { DestinyRepository } from "./destiny.repository.js"
import { Destiny } from "./destiny.entity.js"

const repository = new DestinyRepository()

function sanitizeUserInput(req: Request, res: Response, next: NextFunction) {
    req.body.sanitizedInput = {
        nombre: req.body.nombre,
        transporte: req.body.transporte,
        actividades: req.body.actividades

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
    const destiny = await repository.findAll()
    res.json({data:destiny})
}

async function findOne(req: Request, res: Response) {
    const id = req.params.id
    const destiny = await repository.findOne({ id })
    if (!destiny){
    return res.status(404).send({message:'No encontrado'})
    }
    res.json({data:destiny})
}

function add(req: Request, res: Response)  {
    const input = req.body.sanitizedInput
    const destinyInput = new Destiny(
        input.nombre, 
        input.transporte,
        input.actividades
    )
    const destiny = repository.add(destinyInput)
    res.status(201).send({message: 'destino creado', data: destiny})
}

function update(req: Request,res: Response) {
    req.body.sanitizedInput.id = req.params.id
    const destiny = repository.update(req.body.sanitizedInput)

    if(!destiny){
    res.status(404).send({message: 'destino no encontrado'})
    }
    else {
        res.status(200).send({message: 'destino actualizado', data: destiny})
    }
}

function remove(req: Request, res: Response){
    const id = req.params.id
    const destiny = repository.delete({id})

    if(!destiny){
        res.status(404).send({message: 'destino no encontrado'})
    } else{
        res.status(200).send({message: 'destino borrado'})
    }
}

export {sanitizeUserInput, findAll, findOne, add, update, remove}