import {Request, Response, NextFunction} from "express"
import { orm } from '../shared/bdd/orm.js'
import { User } from "./user.entity.js"


async function findAll (req:Request, res:Response) {
    try {
        const em = orm.em.fork();
        const users = await em.find(User, {})
        res.status(200).json({message: 'Usuarios encontrados', data: users})
    } catch (error: any) {
        res.status(500).json({message: 'Error al obtener usuarios', error})
    }
}

async function findOne(req: Request, res: Response) {
    try {
        const em = orm.em.fork();
        const id = Number(req.params.id)
        const user = await em.findOne(User, { id })
        res.status(200).json({message: 'Usuario encontrado', data: user})
    } catch (error: any) {
        res.status(500).json({message: 'Error al obtener usuario', error})
    }
}

async function add(req:Request, res: Response) {
    try{
        const em = orm.em.fork();
        const user = em.create(User, req.body.sanitizedInput)
        await em.flush()
        res.status(201).json({message: 'Usuario creado', data: user})
    }
    catch(error: any){
        res.status(500).json({message: error.message})
    }
}

async function update(req:Request, res: Response) {
    try{
        const em = orm.em.fork();
        const id = Number.parseInt(req.params.id)
        const user = await em.findOneOrFail(User, id)
        em.assign(user, req.body.sanitizedInput)
        await em.flush()
        res.status(200).json({message: 'Usuario actualizado', data: user})
    }
    catch(error: any){
        res.status(500).json({message: error.message})
    }
}

async function remove(req:Request, res: Response) {
    try{
        const em = orm.em.fork();   
        const id = Number.parseInt(req.params.id)
        const user = await em.findOneOrFail(User, id)
        if (!user) {
            return res.status(404).json({ message: "Usuario no encontrado" });
        }
        await em.removeAndFlush(user)
        res.status(200).json({message: 'Usuario borrado'})
    }
    catch(error: any){
        res.status(500).json({message: error.message})    
    }
}

//falta validar contraseña

export { findAll, findOne, add, update, remove}