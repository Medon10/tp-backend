import {Request, Response, NextFunction} from "express"
import { UserRepository } from "./user.repository.js"
import { User } from "./user.entity.js"

const repository = new UserRepository()

function sanitizeUserInput(req: Request, res: Response, next: NextFunction) {
    req.body.sanitizedInput = {
        nombre: req.body.nombre,
        apellido: req.body.apellido,
        contraseña: req.body.contraseña,
        email: req.body.email,
        telefono: req.body.telefono,

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
    const users = await repository.findAll()
    res.json({data:users})
}

async function findOne(req: Request, res: Response) {
    const id = req.params.id
    const user = await repository.findOne({ id })
    if (!user){
    return res.status(404).send({message:'No encontrado'})
    }
    res.json({data:user})
}

function add(req: Request, res: Response)  {
    const input = req.body.sanitizedInput
    const userInput = new User(
        input.nombre, 
        input.apellido,
        input.email, 
        input.contraseña, 
        input.telefono
    )
    const user = repository.add(userInput)
    res.status(201).send({message: 'usuario creado', data: user})
}

function update(req: Request,res: Response) {
    req.body.sanitizedInput.id = req.params.id
    const user = repository.update(req.body.sanitizedInput)
    
    if(!user){
    res.status(404).send({message: 'usuario no encontrado'})
    }
    else {
        res.status(200).send({message: 'usuario actualizado', data: user})
    }
}

function remove(req: Request, res: Response){
    const id = req.params.id
    const user = repository.delete({id})

    if(!user){
        res.status(404).send({message: 'usuario no encontrado'})
    } else{
        res.status(200).send({message: 'usuario borrado'})
    }
}

export {sanitizeUserInput, findAll, findOne, add, update, remove}